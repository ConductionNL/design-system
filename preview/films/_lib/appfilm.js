/**
 * The app-film template: every Conduction app film (Pipelinq, Learniq, ...) is
 * the same 15-second structure on the 128 BPM grid, filled with the app's own
 * content. Direction C, "Proof", approved as the template on 2026-09-27.
 *
 * Four slots, each with a layer, so the storyboard shows the divide between
 * what every app shares and what this app does:
 *
 *   hook     APP      frame 1 is a legible caption over the app's own UI, with
 *                     the app's hex at LOOP_ANCHOR; the last frame lands there
 *   proof    APP      one or two moments only this app has, each as its UI
 *                     with its app hex tag, joined by the hex match cut
 *   general  GENERAL  one scene every app shares (data layer, notification, flows or
 *                     the assistant), the same composition with this app's content;
 *                     pick the one the app uses most strongly (apps/divide.md)
 *   outro    BRAND    the honeycomb closes round the Nextcloud workspace hex
 *                     with this app's hex singled out, the ConNext wordmark
 *                     and the install call, composed to loop into the hook
 *
 * An app film is mostly data: write a content object and call appFilm(content)
 * to get the { meta, boards } the harness (preview/films/board.html) expects.
 *
 * Timing is in beats on the 32-beat film (8 bars of 4), then converted to
 * seconds and snapped to the 25 fps frame grid, as the bible asks.
 */
import { ease, inv, lerp } from './core.js'
import { C } from './brand.js'
import { APP_NAMES } from './assets.js'
import { hexCover } from './ui.js'
import { FRAMES, LOOP_ANCHOR, COPY, MOTION } from './scenes/general.js'

export { LOOP_ANCHOR, COPY }

/* ---------- The grid ---------- */

export const FPS = 25
export const BPM = 128
/** Seconds per beat (0.46875) and per bar (1.875); 15 s is exactly 32 beats. */
export const SPB = 60 / BPM
export const BAR = 4 * SPB
export const DURATION = 15
export const BEATS = 32
export const SIXTEENTH = SPB / 4

/** Snaps a time to the nearest frame. */
export const snap = (t) => Math.round(t * FPS) / FPS
/** Film time of beat b (0-based), snapped to a frame. */
export const beatT = (b) => snap(b * SPB)
/** Beat b as the storyboard writes it: bar.beat, both 1-based (beat 6 is "2.3"). */
export const barBeat = (b) => `${Math.floor(b / 4) + 1}.${(b % 4) + 1}`

/* ---------- Reading budget (bible, "Mute first") ---------- */

export const READ = { min: 1.5, perWord: 0.4, maxWordsPerCard: 8, maxLines: 2, filmMin: 20, filmMax: 30 }
/** Seconds a line must hold after its last word is visible: max(1.5 s, 0.4 s x words). */
export const holdFor = (words) => Math.max(READ.min, READ.perWord * words)
export const wordCount = (s) => (s || '').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
/** A caption rises in a quick stagger: every word in within 0.24 s of the cut (6 frames). */
export const RISE = 0.24
/** A caption clears 4 frames before its slot ends, as the next hex passes it. */
export const CLEAR = 0.16

/** The install call, exactly as the bible writes it. */
export const CTA = 'Install from the\nNextcloud app store'

/* ---------- The slot plan ---------- */

/**
 * Beats per slot. Two proofs: four 6-beat slots and an 8-beat outro. One proof:
 * the proof gets 10 beats and the general scene 8, so each can carry a full card.
 *
 *   slot     beats   seconds          words  why
 *   hook     0-6     0.00 - 2.80      <= 6   on screen from frame 1, clears at 2.60: 2.60 s >= 2.4 s
 *   proof 1  6-12    2.80 - 5.64      <= 5   in by 3.04, clears 5.48: 2.44 s >= 2.0 s (6 words fit exactly)
 *   proof 2  12-18   5.64 - 8.44      <= 5   in by 5.88, clears 8.28: 2.40 s >= 2.0 s
 *   general  18-24   8.44 - 11.24     <= 6   in by 8.68, clears 11.08: 2.40 s >= 2.4 s
 *   outro    24-32   11.24 - 15.00    6 + 1  CTA in by 12.44, holds to 15.00: 2.56 s >= 2.4 s; the app name label from 11.24
 *
 *   one-proof plan: proof 6-16 (2.80 - 7.52, <= 8 words, 4.32 s), general 16-24 (7.52 - 11.24, <= 8 words, 3.32 s)
 *
 * Word ceiling per slot sums to 29 either way, inside the bible's 20 to 30.
 */
export const PLANS = {
	2: [
		{ slot: 'hook', layer: 'app', from: 0, to: 6, maxWords: 6 },
		{ slot: 'proof', index: 0, layer: 'app', from: 6, to: 12, maxWords: 5 },
		{ slot: 'proof', index: 1, layer: 'app', from: 12, to: 18, maxWords: 5 },
		{ slot: 'general', layer: 'general', from: 18, to: 24, maxWords: 6 },
		{ slot: 'outro', layer: 'brand', from: 24, to: 32, maxWords: 7 },
	],
	1: [
		{ slot: 'hook', layer: 'app', from: 0, to: 6, maxWords: 6 },
		{ slot: 'proof', index: 0, layer: 'app', from: 6, to: 16, maxWords: 8 },
		{ slot: 'general', layer: 'general', from: 16, to: 24, maxWords: 8 },
		{ slot: 'outro', layer: 'brand', from: 24, to: 32, maxWords: 7 },
	],
}

/** The plan with times resolved: seconds (frame-snapped), bar.beat labels, and when the caption shows and clears. */
export function plan(nProofs = 2) {
	const p = PLANS[nProofs]
	if (!p) throw new Error(`appfilm: a film has 1 or 2 proof moments, not ${nProofs}`)
	return p.map((s) => {
		const start = beatT(s.from)
		const end = beatT(s.to)
		const shows = s.slot === 'hook' ? 0 : snap(start + RISE)
		// The CTA builds on beat 26 (12.20) and holds to the loop: see MOTION.outro.
		const ctaIn = snap(beatT(26) + RISE)
		const clears = s.slot === 'hook' ? 2.6 : s.slot === 'outro' ? DURATION : snap(end - CLEAR)
		const visible = s.slot === 'outro' ? ctaIn : shows
		return { ...s, start, end, bars: `${barBeat(s.from)}-${barBeat(s.to - 1)}`, shows: visible, clears, hold: +(clears - visible).toFixed(2) }
	})
}

/* ---------- The hex match cut ---------- */

/**
 * The join between scenes: a pointy-top hex snaps out of a UI element and
 * grows past the frame edge (ease.snap, one beat), and its fill is the next
 * scene's ground. Its reverse lands a full-frame hex into the next scene's
 * container. Never rotated: only position, radius and fill change.
 *
 *   const cut = hexCut({ at: s.end - SPB, from: [x, y, 12], fill: C.cobalt50 })
 *   cut(t) -> { cx, cy, r } or null outside the cut
 */
export function hexCut({ at, dur = SPB, from, to = null, W = 1080, H = 1920 }) {
	const [x0, y0, r0] = from
	const cover = hexCover(x0, y0, W, H)
	return (t) => {
		if (t < at || t >= at + dur) return null
		const p = ease.snap(inv(at, at + dur, t))
		if (!to) return { cx: x0, cy: y0, r: lerp(r0, cover, p) }
		// Shrink into the next container: the hex travels while it closes.
		const [x1, y1, r1] = to
		return { cx: lerp(x0, x1, p), cy: lerp(y0, y1, p), r: lerp(hexCover(x0, y0, W, H), r1, p) }
	}
}

/* ---------- Content object -> boards ---------- */

/**
 * The boards array the harness expects, from one content object.
 *
 *   {
 *     app: 'pipelinq',                     the <id> in the app's appinfo/info.xml
 *     name: 'Pipelinq',                    optional, defaults to APP_NAMES
 *     record: { one: 'client', many: 'clients' },
 *     logline, references,                 storyboard metadata
 *     hook:    { caption, ui: {...} | draw(ctx, api), motion, sound, source },
 *     proofs:  [{ id, title, caption, draw(ctx, api), apps, motion, sound, source }],   1 or 2
 *     general: { module: 'dataLayer' | 'notify' | 'flows' | 'ai', caption, params, source },
 *     outro:   { neighbours: ['portaliq', ...], sound },
 *   }
 *
 * Every board carries layer 'app' | 'general' | 'brand'; shared scenes also carry
 * module '<name>' (hook, dataLayer, notify, flows, ai, outro), so the review page can
 * show which frames come from the template and which are drawn per app.
 */
export function appBoards(content) {
	const { app, proofs = [], hook = {}, general = {}, outro = {} } = content
	const name = content.name || APP_NAMES[app] || app
	const slots = plan(proofs.length)
	return slots.map((s) => {
		const base = { layer: s.layer, start: s.start, end: s.end, bars: s.bars, maxWords: s.maxWords, shows: s.shows, clears: s.clears, hold: s.hold }
		if (s.slot === 'hook') {
			return {
				...base,
				id: 'hook',
				module: hook.draw ? undefined : 'hook',
				title: hook.title || 'Hook',
				words: hook.caption,
				apps: [app],
				motion: hook.motion || MOTION.hook(s),
				sound: hook.sound || 'Gentle open, no stinger on frame 1: pad and offbeat bass only. A soft pluck as the push starts; a tick on the cell that becomes the hex; whoosh under the fill.',
				source: hook.source,
				draw: (ctx) => (hook.draw ? hook.draw(ctx, { app, name }) : FRAMES.hook(ctx, { app, caption: hook.caption, ...hook.ui })),
			}
		}
		if (s.slot === 'proof') {
			const pr = proofs[s.index]
			return {
				...base,
				id: pr.id || `proof${s.index + 1}`,
				title: pr.title || `Proof ${s.index + 1}`,
				words: pr.caption,
				apps: pr.apps || [app],
				motion: pr.motion || MOTION.proof(s),
				sound: pr.sound,
				source: pr.source,
				draw: (ctx) => pr.draw(ctx, { app, name }),
			}
		}
		if (s.slot === 'general') {
			const mod = general.module
			if (!FRAMES[mod]) throw new Error(`appfilm: no general scene module '${mod}' (have ${Object.keys(FRAMES).join(', ')})`)
			return {
				...base,
				id: `general-${mod}`,
				module: mod,
				title: general.title || { dataLayer: 'One place, every change logged', notify: 'The right person hears about it', flows: 'Draw your own flow', ai: 'Ask about your records' }[mod],
				words: general.caption,
				apps: [app, ...(general.params?.apps || [])],
				motion: general.motion || MOTION[mod](s),
				sound: general.sound,
				source: general.source || COPY[mod].source,
				draw: (ctx) => FRAMES[mod](ctx, { app, caption: general.caption, ...general.params }),
			}
		}
		return {
			...base,
			id: 'outro',
			module: 'outro',
			title: `${name}, install`,
			words: `${name}\n${CTA}`,
			apps: [app, ...(outro.neighbours || [])],
			motion: outro.motion || MOTION.outro(s),
			sound: outro.sound || 'Bell (the sonic logo) on 7.3 with the wordmark; a pluck with the second CTA line. The bed plays to 15.00 and stops on the downbeat of the loop, no fade.',
			draw: (ctx) => FRAMES.outro(ctx, { app, name, ...outro }),
		}
	})
}

/**
 * The words on screen, checked against the bible: at most 8 words and 2 lines
 * per card, each slot inside its ceiling, 20 to 30 words in the film, and each
 * caption's hold at least max(1.5 s, 0.4 s x words). Returns { total, ok, rows }.
 */
export function wordBudget(boards) {
	const rows = boards.map((b) => {
		const words = wordCount(b.words)
		const lines = (b.words || '').split('\n').filter(Boolean).length
		const cardWords = b.id === 'outro' ? wordCount(CTA) : words
		const need = holdFor(cardWords)
		const issues = []
		if (cardWords > READ.maxWordsPerCard) issues.push(`${cardWords} words on one card (max ${READ.maxWordsPerCard})`)
		if (b.id !== 'outro' && lines > READ.maxLines) issues.push(`${lines} lines (max ${READ.maxLines})`)
		if (b.maxWords && words > b.maxWords) issues.push(`${words} words in a slot that holds ${b.maxWords}`)
		if (b.hold !== undefined && b.hold + 1e-6 < need) issues.push(`holds ${b.hold} s, needs ${need.toFixed(2)} s`)
		return { id: b.id, layer: b.layer, words, hold: b.hold, need: +need.toFixed(2), issues }
	})
	const total = rows.reduce((a, r) => a + r.words, 0)
	const filmIssues = total < READ.filmMin || total > READ.filmMax ? [`${total} words in the film (bible: ${READ.filmMin} to ${READ.filmMax})`] : []
	return { total, ok: !filmIssues.length && rows.every((r) => !r.issues.length), filmIssues, rows }
}

/** The harness meta every app film shares: cobalt stage, the text box as the safe overlay. */
export function appMeta(content) {
	const name = content.name || APP_NAMES[content.app] || content.app
	return {
		id: content.id || content.app,
		title: content.title || `${name} film`,
		logline: content.logline || '',
		references: content.references || [],
		template: 'appfilm',
		background: C.cobalt,
		safe: { top: 288, bottom: 672, left: 120, right: 300 },
	}
}

/** Everything a board.js needs: export const { meta, boards } = appFilm(content). */
export function appFilm(content) {
	const boards = appBoards(content)
	return { meta: { ...appMeta(content), budget: wordBudget(boards) }, boards }
}
