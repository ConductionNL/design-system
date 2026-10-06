/**
 * One timeline per film: the beat grid, the scenes, the captions, the sound cues and the voice takes,
 * declared in one place. Every frame number and every cue time comes from here, so picture and sound
 * cannot drift apart, and scripts/films/grid-check.mjs can read the whole plan back.
 *
 * The grid at 128 BPM and 24 fps:
 *   bar     1.875 s    45 frames exactly
 *   beat    0.46875 s  11.25 frames
 *   8th     0.234375 s  5.625 frames
 *   16th    0.1171875 s 2.8125 frames
 *
 * Snapping rule (the house rounding): a grid position is computed from its index from 0, in exact
 * seconds, and then rounded to the NEAREST frame, ties rounding up (Math.round). Never add rounded
 * steps to each other: rounding errors would pile up. So the 8ths of a bar land on frames
 * 0, 6, 11, 17, 23, 28, 34, 39 (and 45 is the next bar), never more than half a frame (21 ms) from
 * the music. A cut is on the grid when its frame equals the rounded frame of some 8th.
 *
 * Positions can be written as
 *   '3.2'      bar 3, beat 2 (1-based, as the player shows it)
 *   '3.2.3'    bar 3, beat 2, plus 3 sixteenths
 *   { beat: n } the n-th beat from 0;  { bar: n } the n-th bar from 0;  { eighth: n }
 *   a number   seconds (snapped to a frame)
 *
 *   grid({ bpm, fps })      the grid helpers
 *   timeline(spec)          resolves a film's plan; see the bottom of this file
 */

export function grid({ bpm = 128, fps = 24 } = {}) {
	const spb = 60 / bpm
	const snap = (t) => Math.round(t * fps) / fps
	const G = {
		bpm, fps, spb,
		bar: 4 * spb,
		eighthLen: spb / 2,
		sixteenthLen: spb / 4,
		/** Seconds -> frame index, and the house rounding of a time onto the frame grid. */
		frame: (t) => Math.round(t * fps),
		snap,
		/** Exact grid times (unsnapped), from index 0. */
		exact: { beat: (n) => n * spb, bar: (n) => n * 4 * spb, eighth: (n) => (n * spb) / 2, sixteenth: (n) => (n * spb) / 4 },
		/** Snapped grid times. */
		beatAt: (n) => snap(n * spb),
		barAt: (n) => snap(n * 4 * spb),
		eighthAt: (n) => snap((n * spb) / 2),
		/** bar (1-based), beat (1-based), sixteenths -> snapped seconds. */
		pos: (bar, beat = 1, s16 = 0) => snap(((bar - 1) * 4 + (beat - 1) + s16 / 4) * spb),
		/** Any position form (see the header) -> snapped seconds. */
		at(p) {
			if (typeof p === 'number') return snap(p)
			if (typeof p === 'string') {
				const [bar, beat = 1, s16 = 0] = p.split('.').map(Number)
				if (!Number.isFinite(bar)) throw new Error(`timeline: cannot read position "${p}"`)
				return G.pos(bar, beat, s16)
			}
			if (p && typeof p === 'object') {
				if ('s' in p) return snap(p.s)
				if ('bar' in p) return G.barAt(p.bar)
				if ('beat' in p) return G.beatAt(p.beat)
				if ('eighth' in p) return G.eighthAt(p.eighth)
			}
			throw new Error(`timeline: cannot read position ${JSON.stringify(p)}`)
		},
		/** 'bar' | 'beat' | '8th' | '16th' | 'off': the coarsest grid line a time's frame lands on. */
		classify(t) {
			const f = Math.round(t * fps)
			const on = (len) => Math.round(Math.round(t / len) * len * fps) === f
			if (on(4 * spb)) return 'bar'
			if (on(spb)) return 'beat'
			if (on(spb / 2)) return '8th'
			if (on(spb / 4)) return '16th'
			return 'off'
		},
		/** Frames from the nearest 8th (signed), for the grid report. */
		offEighth(t) {
			const len = spb / 2
			return Math.round(t * fps) - Math.round(Math.round(t / len) * len * fps)
		},
		/** "bar.beat" label for a time, as the player shows it. */
		label(t) {
			const b = Math.floor(t / spb + 1e-6)
			return `${Math.floor(b / 4) + 1}.${(b % 4) + 1}`
		},
	}
	return G
}

/** Words on a caption: tokens that carry a letter or a digit (markup like *accent* still counts). */
export const wordCount = (s) => (s || '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
/** The bible's reading hold: max(1.5 s, 0.4 s per word) after the last word is visible. */
export const holdFor = (words) => Math.max(1.5, 0.4 * words)

/**
 * Resolves a film's plan.
 *
 *   const TL = timeline({
 *     bpm: 128, fps: 24, bars: 6,
 *     scenes:   [{ id: 'nl', from: '1.1', to: '4.1' }, ...],
 *     captions: [{ id: 'nl', text: 'Gebouwd op Nextcloud', up: 0.5, out: '4.1', rise: 0.24, exit: 4 / 24 }],
 *     cues:     [{ at: '1.2', kind: 'tick', gain: 0.1 }],
 *     voice:    [{ id: 'nl', src: 'voice/nl-04.mp3', at: 0.29, words: [{ word, start, end }] }],
 *   })
 *   TL.scene('nl')        { id, start, end, frames: [f0, f1] }
 *   TL.cuesInto(film)     pushes every cue onto film.cue()
 *   TL.dump()             the plan as plain data (what grid-check reads)
 *   TL.expose()           sets window.__timeline = TL.dump()
 *
 * A caption's `rise` (seconds until its last word is fully up) and `exit` (seconds it takes to leave,
 * ending at `out`) let grid-check compute the hold the reader actually gets.
 */
export function timeline(spec) {
	const G = grid(spec)
	const bars = spec.bars ?? null
	const duration = spec.duration != null ? G.snap(spec.duration) : bars != null ? G.barAt(bars) : null
	const scenes = (spec.scenes || []).map((s) => {
		const start = G.at(s.from), end = G.at(s.to)
		if (end <= start) throw new Error(`timeline: scene ${s.id} ends before it starts`)
		return { ...s, start, end, frames: [G.frame(start), G.frame(end)] }
	})
	const captions = (spec.captions || []).map((c) => ({ rise: 0.24, exit: 4 / G.fps, ...c, up: G.at(c.up), out: G.at(c.out) }))
	const voice = (spec.voice || []).map((v) => ({ gain: 1, ...v, at: typeof v.at === 'number' ? v.at : G.at(v.at) }))
	const cues = (spec.cues || []).map(({ at, ...rest }) => ({ t: G.at(at), ...rest }))
	const TL = {
		grid: G, bpm: G.bpm, fps: G.fps, bars, duration, scenes, captions, voice, cues,
		scene(id) {
			const s = scenes.find((x) => x.id === id)
			if (!s) throw new Error(`timeline: no scene "${id}"`)
			return s
		},
		caption(id) {
			const c = captions.find((x) => x.id === id)
			if (!c) throw new Error(`timeline: no caption "${id}"`)
			return c
		},
		/** Adds a cue after the fact (a scene computing its own contact frame); stays on the frame grid. */
		cue(at, kind, opts = {}) {
			cues.push({ t: G.at(at), kind, ...opts })
		},
		cuesInto(film) {
			for (const { t, kind, ...o } of cues) film.cue(t, kind, o)
		},
		dump() {
			return {
				bpm: G.bpm, fps: G.fps, bars, duration,
				scenes: scenes.map(({ id, start, end }) => ({ id, start, end })),
				cuts: [...new Set(scenes.flatMap((s) => [s.start, s.end]))].sort((a, b) => a - b),
				captions: captions.map(({ id, text, up, out, rise, exit }) => ({ id, text, up, out, rise, exit })),
				voice: voice.map(({ id, src, at, words }) => ({ id, src, at, words: (words || []).map((w) => ({ word: w.word, start: +(at + w.start).toFixed(4), end: +(at + w.end).toFixed(4) })) })),
				cues: cues.map((c) => ({ ...c })),
			}
		},
		expose() {
			if (typeof window !== 'undefined') window.__timeline = TL.dump()
			return TL
		},
	}
	return TL
}
