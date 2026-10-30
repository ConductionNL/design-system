/**
 * "Business software is next": the film of Ruben's talk (28 Oct 2026), English, 16:9, 24 fps, 128 BPM.
 *
 *   0 to 5.625 s     the shared Conduction opening (_lib/scenes/opening.js), 3 bars, never voiced
 *   body             the 41 approved storyboard stills (boards/talk/, every board but the three brand
 *                    pieces), each animated into its resting frame by ./animate.js, hard cuts on the beat
 *   then             Built on Nextcloud (lead Buildiq) and the install board (_lib/scenes/closing.js)
 *
 * Timing reads voice/takes.json ({ "<board id>": { file, dur, words, wer } }) on every load, so new
 * takes re-time the film with no code change: a scene lasts its take plus LEAD before and TAIL after,
 * its end rounded up to the next beat. A board without a take is timed from its line at WPS words a
 * second (at least MIN_VOICE). The last body scene ends on a bar line. Without the voice-over (?voice=0)
 * the timing stays the same, the written text stays, and two scenes add their spoken point as a caption.
 *
 * Every frame is a pure function of time.
 */
import { Film, loadFonts, variant, el, textBlock } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene, BUILT_ON_DUR, INSTALL_DUR } from '../_lib/scenes/closing.js'
import { timeline, wordCount } from '../_lib/timeline.js'
import { inv } from '../_lib/core.js'
import { curve, F } from '../_lib/motion.js'
import { TYPE } from '../_lib/ui.js'
import { boards } from './boards/talk/board.js'
import { animateBoard } from './animate.js'

const SLUG = 'business-software-next'
const LEAD = 0.6
const TAIL = 0.8
const WPS = 2.6
const MIN_VOICE = 3
const BRAND = ['opening', 'built-on', 'install']
const CLOSE = { lead: 'buildiq', lang: 'en' }
const V = variant('en')

/* ---------- the voice takes ---------- */
const takes = {}
try {
	const res = await fetch(new URL('./voice/takes.json', import.meta.url), { cache: 'no-store' })
	if (res.ok) Object.assign(takes, await res.json())
} catch { /* no takes yet: every scene is timed from its words */ }
for (const take of Object.values(takes)) {
	// words may be inline ([{ word, start, end }]) or a path to a words JSON beside the take
	if (typeof take.words === 'string') {
		try {
			const r = await fetch(new URL(`./voice/${take.words}`, import.meta.url), { cache: 'no-store' })
			const j = r.ok ? await r.json() : null
			take.words = Array.isArray(j) ? j : j?.words || null
		} catch { take.words = null }
	}
}

/* ---------- the timeline ---------- */
const G0 = timeline({ bpm: 128, fps: 24 }).grid
const ceilBeat = (t) => G0.beatAt(Math.ceil(t / G0.spb - 1e-6))
const ceilBar = (t) => G0.barAt(Math.ceil(t / G0.bar - 1e-6))
const BODY = boards.filter((b) => !BRAND.includes(b.id))
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

let t = OPENING.duration
const plan = BODY.map((b, i) => {
	const take = takes[b.id]
	const est = Math.max(MIN_VOICE, wordCount(b.words) / WPS)
	const voice = take?.dur ? +take.dur : est
	const start = t
	let end = ceilBeat(start + LEAD + voice + TAIL)
	if (i === BODY.length - 1) end = ceilBar(end)
	t = end
	const tokens = b.words.split(/\s+/).filter(Boolean)
	/** Scene-local seconds at which a word is spoken: from the take's alignment, else from its place in the line. */
	const wordAt = (word, after = 0) => {
		const w = norm(word || '')
		if (!w) return null
		if (Array.isArray(take?.words)) {
			const hit = take.words.find((x) => x.start >= after - LEAD && norm(x.word) === w)
			if (hit) return LEAD + hit.start
		}
		const k = tokens.findIndex((x) => norm(x) === w)
		if (k < 0) return null
		return LEAD + ((k + 0.25) / tokens.length) * voice
	}
	return { b, take, start, end, dur: end - start, voice, lead: LEAD, wordAt }
})
const BODY_END = t
const DURATION = BODY_END + BUILT_ON_DUR + INSTALL_DUR

/* ---------- what each scene's `material` asks for, beyond the defaults in animate.js ---------- */
const SPEC = {
	'who-codes': (w) => ({ lightAt: w('Hands') ?? 1.6, lightSpan: 1.2, bgSpread: 0.5 }),
	'who-patched': (w) => ({ bg: 'hold', outAt: (w('patched') ?? 1.5) - 0.2, outSpan: 1.3 }),
	'wordpress-week': () => ({ at: ['497', '176', '69'] }),
	headlines: () => ({ at: ['update', 'Stolen', 'million', 'PHP'] }),
	'core-vs-ecosystem': () => ({ at: ['six', 'eleven', 'five'] }),
	'wordpress-share': () => ({ from: { '39.6%': 43.6 }, at: [null, 'Small', 'core'] }),
	wilded: () => ({ at: [null, 'server', 'Knowledge', 'Publishing', 'browser', 'Business'] }),
	'suite-vs-workspace': () => ({ runOrder: 'draw', runSpan: 2.4, at: [null, null, null, null, null, 'workspace'] }),
	'office-landscape': () => ({ runOrder: 'draw', runSpan: 3.2 }),
	'open-workspace': () => ({ runOrder: 'draw', runSpan: 3.4, at: [null, 'Nextcloud'] }),
	'office-vs-business': () => ({ runSpan: 2.6 }),
	'power-platform': () => ({ at: ['33', '56', '500'] }),
	sanne: () => ({ at: [null, 'accepted', 'hours', 'invoice'] }),
	yusuf: () => ({ at: [null, 'Leave', 'spreadsheet'] }),
	'describe-review-use': () => ({ at: ['describe', 'review', 'Then', 'describe', 'review', 'Then'] }),
	buyout: () => ({ at: ['reasoning', 'Ours'] }),
	'cloud-act': () => ({ spread: 0.7 }),
	'out-hire': () => ({ at: ['170', '223000'] }),
	'store-growth': () => ({ stepWords: ['600', '6000', '60000', 'stop'] }),
	'ip-stake': () => ({ runOrder: 'draw', runSpan: 1.2 }),
	'three-questions': () => ({ at: ['really', 'try', 'IP'] }),
	'final-line': (w) => ({ lightAt: w('citizens') ?? 4, lightSpan: 1.6, bgSpread: 0.5 }),
}

/** The spoken point, shown as a caption in the version without the voice-over, where the still does not say it. */
const CAPTIONS = {
	'core-vs-ecosystem': { text: 'Citizen coders will not patch every week. The platform has to do it for them', y: 930, after: 'We' },
	'gates-quote': { text: 'By that test, a suite is never a platform', y: 770, after: 'By' },
}

/* ---------- the film ---------- */
const TL = timeline({
	bpm: 128, fps: 24, duration: DURATION,
	scenes: [
		{ id: 'opening', from: 0, to: OPENING.duration },
		...plan.map((p) => ({ id: p.b.id, from: { s: p.start }, to: { s: p.end } })),
		{ id: 'builtOn', from: { s: BODY_END }, to: { s: BODY_END + BUILT_ON_DUR } },
		{ id: 'install', from: { s: BODY_END + BUILT_ON_DUR }, to: { s: DURATION } },
	],
	voice: plan.filter((p) => p.take?.file).map((p) => ({ id: p.b.id, src: `preview/films/${SLUG}/voice/${p.take.file}`, at: p.start + LEAD, words: Array.isArray(p.take.words) ? p.take.words : [] })),
})

const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: DURATION, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
film.langs = ['en']
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

addOpening(film, { at: 0 })
const arrive = curve('arrive')
for (const p of plan) {
	film.scene(p.b.id, p.start, p.end, (ctx) => {
		const anim = animateBoard(ctx, p.b, { start: p.start, dur: p.dur, lead: p.lead, voice: p.voice, wordAt: p.wordAt, spec: SPEC[p.b.id]?.(p.wordAt) || {}, orange: C.orange, seed: p.start * 100 })
		p.settled = anim.end
		for (const { at, kind, ...o } of anim.cues) film.cue(p.start + at, kind, o)
		let cap = null
		const c = CAPTIONS[p.b.id]
		if (c && !V.voice) {
			const g = el('g', { 'data-part': 'caption' }, ctx.g)
			const tb = textBlock(g, c.text, { x: TYPE.x, y: c.y, size: 36, weight: 600, fill: C.cobalt200, tracking: -0.01, maxWidth: 1600, lineHeight: 1.2 })
			const at = Math.max(anim.end, (p.wordAt(c.after, 2) ?? anim.end) - F(2))
			cap = { tb, at }
			TL.captions.push({ id: p.b.id, text: c.text, up: G0.snap(p.start + at), out: p.end, rise: 0.3, exit: 0 })
		}
		return (ft) => {
			const l = ft - p.start
			anim.update(l)
			if (cap) cap.tb.items.forEach((it, i) => {
				const e = arrive(inv(cap.at + i * F(1), cap.at + i * F(1) + F(7), l))
				it.node.setAttribute('transform', e >= 1 ? null : `translate(0 ${((1 - e) * 50).toFixed(2)})`)
				if (e >= 1) it.node.removeAttribute('transform')
			})
		}
	})
}
film.scene('builtOn', BODY_END, BODY_END + BUILT_ON_DUR, (ctx) => builtOnScene(ctx, CLOSE))
film.scene('install', BODY_END + BUILT_ON_DUR, DURATION, (ctx) => installScene(ctx, CLOSE), { post: 0.001 })

/* ---------- the bed: in D, one progression per act, the pad under everything, the pulse in the build acts ---------- */
const D = [50, 54, 57, 62], Dmaj9 = [50, 54, 61, 64], Bm9 = [47, 54, 57, 61], Gmaj9 = [47, 50, 54, 57], Aadd9 = [49, 52, 57, 59], Fsm7 = [49, 52, 54, 57], Bmadd9 = [47, 50, 54, 61], Gmaj7 = [47, 50, 54, 59], Em9 = [50, 54, 55, 59], Asus = [50, 52, 57, 59]
const ROOT = new Map([[D, 38], [Dmaj9, 38], [Bm9, 35], [Gmaj9, 43], [Aadd9, 45], [Fsm7, 42], [Bmadd9, 35], [Gmaj7, 43], [Em9, 40], [Asus, 45]])
const ACTS = [
	{ from: 'who-codes', prog: [Bm9, Gmaj9, D, Aadd9], pulse: false },
	{ from: 'wordpress-share', prog: [Gmaj9, Aadd9, Dmaj9, Bm9], pulse: true },
	{ from: 'section-01', prog: [Dmaj9, Bm9, Gmaj7, Asus], pulse: false },
	{ from: 'section-02', prog: [Em9, Gmaj9, Bm9, Aadd9], pulse: true },
	{ from: 'sanne', prog: [Dmaj9, Bm9, Gmaj7, Asus], pulse: false },
	{ from: 'section-03', prog: [Gmaj9, Aadd9, Fsm7, Bmadd9], pulse: true },
	{ from: 'section-04', prog: [Dmaj9, Aadd9, Bm9, Gmaj9], pulse: true },
	{ from: 'final-line', prog: [Gmaj9, Aadd9, Dmaj9, Dmaj9], pulse: false },
]
const BAR = G0.bar
const TOTAL_BARS = Math.round(DURATION / BAR)
const BODY_BAR0 = Math.round(OPENING.duration / BAR), BODY_BAR1 = Math.round(BODY_END / BAR)
const actOf = (b) => {
	const tt = b * BAR + 1e-3
	let a = 0
	ACTS.forEach((A, i) => { if (tt >= plan.find((p) => p.b.id === A.from).start) a = i })
	return a
}
const chords = [], bass = []
const kick = []
for (let b = 0; b < TOTAL_BARS; b++) {
	let ch
	if (b < BODY_BAR0) ch = D
	else if (b < BODY_BAR1) {
		const a = actOf(b)
		const a0 = Math.round(plan.find((p) => p.b.id === ACTS[a].from).start / BAR)
		ch = ACTS[a].prog[(b - a0 + 400) % 4]
		if (ACTS[a].pulse) kick.push([b, b + 1])
	} else ch = [Dmaj9, Bm9, Aadd9, Gmaj9, Gmaj9, Aadd9, D][Math.min(6, b - BODY_BAR1)] || D
	chords.push(ch)
	bass.push(ROOT.get(ch))
}
film.music = {
	bars: TOTAL_BARS,
	chords,
	bass,
	parts: { pad: [[BODY_BAR0, TOTAL_BARS]], bass: [[BODY_BAR0 + 2, TOTAL_BARS - 1]], kick, hat: kick },
	loop: false,
	duckDb: 15,
	voice: TL.voice.map(({ src, at, gain }) => ({ src, at: +at.toFixed(4), gain })),
}

film.board = { film: SLUG, variant: 'talk', meta: { title: 'Business software is next', words: BODY.map((b) => b.words).join(' ') } }
window.__bsn = { plan: plan.map((p) => ({ id: p.b.id, start: p.start, end: p.end, voice: p.voice, take: !!p.take, settled: p.settled })), duration: DURATION, bodyEnd: BODY_END }
TL.expose()
film.start()
