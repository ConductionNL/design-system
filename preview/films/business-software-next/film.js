/**
 * "Business software is next": the film of Ruben's talk (28 Oct 2026), English, 16:9, 24 fps, 128 BPM.
 *
 *   0 to 5.625 s     the shared Conduction opening (_lib/scenes/opening.js), 3 bars, never voiced
 *   body             a storyboard wall (Ruben, 30 Oct): every body board is a 1920 x 1080 card pinned on
 *                    one wall, one row per chapter, the rows running as a snake. The camera glides from card
 *                    to card along a row (a slight pull-back mid-move, then in) and pulls back between rows,
 *                    past the chapter header written on the wall (its number and title, the section's line
 *                    as voice-over), into the next row. On each card the still is animated into place by
 *                    ./animate.js as the camera lands; a card at rest is its approved still, pixel for pixel.
 *                    After the last card the camera pulls out over the whole wall.
 *   then             Built on Nextcloud (lead Buildiq) and the install board (_lib/scenes/closing.js)
 *
 * Timing reads voice/takes.json ({ "<board id>": { file, dur, words, wer } }) on every load, so new
 * takes re-time the film with no code change: the camera holds on a card for LEAD + its take + TAIL,
 * rounded up to the next beat; a glide or a row change follows. A board without a take is timed from
 * its line at WPS words a second (at least MIN_VOICE). The section takes (section-01 to section-04) play
 * during their row change. Without the voice-over (?voice=0) the timing stays the same, the written text
 * stays, and two cards add their spoken point as a caption.
 *
 * Every frame is a pure function of time. No rotation, no bounce, no gradients, no shadows: depth is
 * the opacity of the cards the camera is not on.
 */
import { Film, loadFonts, variant, el, textBlock } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene, BUILT_ON_DUR, INSTALL_DUR } from '../_lib/scenes/closing.js'
import { timeline, wordCount } from '../_lib/timeline.js'
import { inv, lerp, ease } from '../_lib/core.js'
import { curve, F } from '../_lib/motion.js'
import { TYPE } from '../_lib/ui.js'
import { boards } from './boards/talk/board.js'
import { animateBoard } from './animate.js'

const SLUG = 'business-software-next'
const LEAD = 0.35
const TAIL = 0.45
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

/* ---------- the wall: rows of cards, one row per chapter ---------- */
const BOARD = Object.fromEntries(boards.map((b) => [b.id, b]))
const ROWS = [
	{ id: 'intro', cards: ['who-codes', 'who-patched', 'fun-week', 'wordpress-week', 'headlines', 'core-vs-ecosystem', 'wordpress-share', 'wilded', 'title'] },
	{ id: '01', section: 'section-01', cards: ['suite-vs-workspace', 'office-landscape', 'workspace-landscape', 'gates-quote', 'open-workspace', 'office-vs-business'] },
	{ id: '02', section: 'section-02', cards: ['power-platform', 'buyout', 'cloud-act', 'out-hire', 'angry-citizens', 'sanne', 'yusuf', 'two-things'] },
	{ id: '03', section: 'section-03', cards: ['framework-basics', 'describe-review-use', 'manifest', 'one-data-layer', 'evidence', 'common-core', 'honest-limits', 'where-it-wins'] },
	{ id: '04', section: 'section-04', cards: ['store-growth', 'store-find', 'who-pays', 'ip-stake'] },
	{ id: 'close', cards: ['three-questions', 'final-line'] },
]
{
	const placed = new Set(ROWS.flatMap((r) => [...r.cards, r.section].filter(Boolean)))
	const missing = boards.filter((b) => !BRAND.includes(b.id) && !placed.has(b.id)).map((b) => b.id)
	if (missing.length) console.error('wall: boards not on the wall:', missing.join(', '))
}
const CW = 1920, CH = 1080
const GAP = 320 // between cards in a row
const PITCH = CH + 620 // row to row
const HEAD_W = 2500, HEAD_GAP = 360 // the chapter header beside a row's first card
const DIM = 0.38 // the opacity of a card the camera is not on

// The snake: row 0 runs left to right; each next row starts under the last card of the row above and runs back.
const CARDS = []
const HEADS = []
{
	let x = 0
	ROWS.forEach((row, r) => {
		const dir = r % 2 === 0 ? 1 : -1
		const y = r * PITCH
		if (row.section) {
			const hx = dir === 1 ? x - HEAD_GAP - HEAD_W : x + CW + HEAD_GAP
			HEADS.push({ row: r, section: row.section, x: hx, y, w: HEAD_W })
		}
		row.cards.forEach((id, i) => {
			CARDS.push({ id, b: BOARD[id], row: r, x, y })
			if (i < row.cards.length - 1) x += dir * (CW + GAP)
		})
	})
}
const WALL = (() => {
	const xs = [...CARDS.map((c) => [c.x, c.x + CW]), ...HEADS.map((h) => [h.x, h.x + h.w])].flat()
	const ys = CARDS.map((c) => [c.y, c.y + CH]).flat()
	return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
})()

/* ---------- the timeline: holds on cards, glides between them, row changes past the headers ---------- */
const G0 = timeline({ bpm: 128, fps: 24 }).grid
const ceilBeat = (t) => G0.beatAt(Math.ceil(t / G0.spb - 1e-6))
const ceilBar = (t) => G0.barAt(Math.ceil(t / G0.bar - 1e-6))
const snapF = (t) => Math.round(t * 24) / 24
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const voiceOf = (b) => {
	const take = takes[b.id]
	return { take, voice: take?.dur ? +take.dur : Math.max(MIN_VOICE, wordCount(b.words) / WPS) }
}
const GLIDE = 3.5 * G0.spb // 1.64 s card to card
const INTRO_PUSH = G0.bar // the wall's first push, onto the first card
const ROW_OUT = 1.6, ROW_IN = 1.6 // pulling back from a row, pushing into the next
const FINAL_OUT = 3.2, FINAL_HOLD = 1.6
const CLOCK_GLIDE = 0.15 // within a row a card starts building just after the camera sets off towards it
const CLOCK_PUSH = 1.2 // after a row change (and the first push) it starts this long before the camera lands
const BODY_START = OPENING.duration

const cardK = (c) => ({ cx: c.x + CW / 2, cy: c.y + CH / 2, s: 1 })
const fitK = (x0, y0, x1, y1, k = 1) => ({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: k * Math.min(1920 / (x1 - x0), 1080 / (y1 - y0)) })

const MOVES = [] // camera segments: { t0, t1, from, to, kind }
const SECTION_VOICE = [] // { id, at }
let t = BODY_START
{
	const c0 = CARDS[0]
	MOVES.push({ t0: t, t1: t + INTRO_PUSH, from: { ...cardK(c0), s: 0.42 }, to: cardK(c0), kind: 'push' })
	t += INTRO_PUSH
}
CARDS.forEach((c, i) => {
	const { take, voice } = voiceOf(c.b)
	c.take = take
	c.voice = voice
	c.arrive = snapF(t)
	c.voiceAt = c.arrive + LEAD
	c.leave = ceilBeat(c.voiceAt + voice + TAIL)
	t = c.leave
	const next = CARDS[i + 1]
	if (!next) return
	if (next.row === c.row) {
		MOVES.push({ t0: t, t1: t + GLIDE, from: cardK(c), to: cardK(next), kind: 'glide' })
		t += GLIDE
		return
	}
	// a row change: pull back so this row's end, the next chapter header and the next row show, drift, push in
	const head = HEADS.find((h) => h.row === next.row)
	const sec = head ? voiceOf(BOARD[head.section]) : null
	const xs = [c.x, c.x + CW, next.x, next.x + CW, ...(head ? [head.x, head.x + head.w] : [])]
	const wide = fitK(Math.min(...xs) - 200, c.y - 120, Math.max(...xs) + 200, next.y + CH + 120, 1.0)
	const toward = head ? { cx: head.x + head.w / 2, cy: next.y + CH / 2 } : cardK(next)
	const wide2 = { cx: lerp(wide.cx, toward.cx, 0.35), cy: lerp(wide.cy, toward.cy, 0.35), s: wide.s * 1.12 }
	const voiceAt = t + 0.9
	const mid = Math.max(0.9, sec ? voiceAt + sec.voice + 0.35 - (t + ROW_OUT) - ROW_IN * 0.4 : 0.9)
	const total = ceilBeat(t + ROW_OUT + mid + ROW_IN) - t
	const midEnd = t + total - ROW_IN
	MOVES.push({ t0: t, t1: t + ROW_OUT, from: cardK(c), to: wide, kind: 'out' })
	MOVES.push({ t0: t + ROW_OUT, t1: midEnd, from: wide, to: wide2, kind: 'drift' })
	MOVES.push({ t0: midEnd, t1: t + total, from: wide2, to: cardK(next), kind: 'in' })
	if (head && sec.take?.file) SECTION_VOICE.push({ id: head.section, take: sec.take, at: voiceAt })
	if (head) { head.voiceAt = voiceAt; head.t0 = t; head.t1 = t + total }
	t += total
})
{
	const last = CARDS[CARDS.length - 1]
	const all = fitK(WALL.x0 - 400, WALL.y0 - 300, WALL.x1 + 400, WALL.y1 + 300, 1)
	MOVES.push({ t0: t, t1: t + FINAL_OUT, from: cardK(last), to: all, kind: 'final' })
	t += FINAL_OUT
	const end = ceilBar(t + FINAL_HOLD)
	MOVES.push({ t0: t, t1: end, from: all, to: { ...all, s: all.s * 1.03 }, kind: 'hold' })
	t = end
}
const BODY_END = t
const DURATION = BODY_END + BUILT_ON_DUR + INSTALL_DUR
CARDS.forEach((c, i) => {
	const prev = CARDS[i - 1], next = CARDS[i + 1]
	c.enter = prev ? prev.leave : BODY_START // the camera starts moving towards it
	// the card's own time 0: it builds while the camera glides in, so it is never seen empty for long
	c.clock = !prev ? BODY_START - F(2) : prev.row === c.row ? c.enter + CLOCK_GLIDE : c.arrive - CLOCK_PUSH
	c.exit = next ? next.arrive : BODY_END // the camera has left it
	const tokens = c.b.words.split(/\s+/).filter(Boolean)
	const lead = c.voiceAt - c.clock
	/** Card-clock seconds at which a word is spoken: from the take's alignment, else from its place in the line. */
	c.wordAt = (word, after = 0) => {
		const w = norm(word || '')
		if (!w) return null
		if (Array.isArray(c.take?.words)) {
			const hit = c.take.words.find((x) => x.start >= after - lead && norm(x.word) === w)
			if (hit) return lead + hit.start
		}
		const k = tokens.findIndex((x) => norm(x) === w)
		if (k < 0) return null
		return lead + ((k + 0.25) / tokens.length) * c.voice
	}
	c.lead = lead
	c.dur = c.leave - c.clock
})

/** The camera at film time t: world centre and zoom. Zoom moves in log space, so a pull-back feels even. */
const camCurve = curve('camera'), driftCurve = curve('drift')
const logLerp = (a, b, e) => Math.exp(lerp(Math.log(a), Math.log(b), e))
function cameraAt(tt) {
	const m = MOVES.find((x) => tt >= x.t0 && tt < x.t1)
	if (!m) {
		const before = MOVES.filter((x) => x.t1 <= tt).pop()
		if (before) return before.to
		return MOVES[0].from
	}
	const u = inv(m.t0, m.t1, tt)
	const e = m.kind === 'drift' || m.kind === 'hold' ? driftCurve(u) : camCurve(u)
	let s = logLerp(m.from.s, m.to.s, e)
	// a glide pulls back a little in the middle of the move and comes in again (sin², so it starts and ends still)
	if (m.kind === 'glide') s *= 1 - 0.42 * Math.sin(Math.PI * u) ** 2
	return { cx: lerp(m.from.cx, m.to.cx, e), cy: lerp(m.from.cy, m.to.cy, e), s }
}

/* ---------- what each card's `material` asks for, beyond the defaults in animate.js ---------- */
const SPEC = {
	'who-codes': (w) => ({ lightAt: (w('you') ?? 1.0) - 0.1, lightSpan: 0.05, bgSpread: 0.5 }),
	'who-patched': (w) => ({ bg: 'hold', lightAt: (w('patch') ?? 0.8) - 0.1, lightSpan: 1.2 }),
	'fun-week': () => ({ beatWord: 'Mine' }),
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
		{ id: 'wall', from: { s: BODY_START }, to: { s: BODY_END } },
		{ id: 'builtOn', from: { s: BODY_END }, to: { s: BODY_END + BUILT_ON_DUR } },
		{ id: 'install', from: { s: BODY_END + BUILT_ON_DUR }, to: { s: DURATION } },
	],
	voice: [
		...CARDS.filter((c) => c.take?.file).map((c) => ({ id: c.id, src: `preview/films/${SLUG}/voice/${c.take.file}`, at: c.voiceAt, words: Array.isArray(c.take.words) ? c.take.words : [] })),
		...SECTION_VOICE.map((v) => ({ id: v.id, src: `preview/films/${SLUG}/voice/${v.take.file}`, at: v.at, words: Array.isArray(v.take.words) ? v.take.words : [] })),
	].sort((a, b) => a.at - b.at),
})

const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: DURATION, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
film.langs = ['en']
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

addOpening(film, { at: 0 })
const arrive = curve('arrive')
const FAR = 1e6 // a card's clock when it is not the camera's: its approved still

/** The chapter header on the wall: the section's number in orange mono, its title, and its lede. */
function drawHead(g, h) {
	const sec = BOARD[h.section]
	const [num, ...rest] = sec.title.split(' · ')
	const title = rest.join(' · ')
	const x = h.x + 80
	textBlock(g, num, { x, y: h.y + 420, size: 400, weight: 500, family: 'IBM Plex Mono', fill: C.orange, tracking: -0.03, clip: false })
	textBlock(g, title, { x, y: h.y + 640, size: 150, weight: 700, fill: C.white, tracking: -0.02, lineHeight: 1.05, maxWidth: h.w - 160, clip: false })
	const lede = sec.words
	textBlock(g, lede, { x, y: h.y + (title.length > 22 ? 960 : 820), size: 64, weight: 500, fill: C.cobalt200, lineHeight: 1.25, maxWidth: h.w - 160, clip: false })
}

film.scene('wall', BODY_START, BODY_END, (ctx) => {
	ctx.g.setAttribute('display', 'inline') // the cards measure their pieces while they build
	el('rect', { width: 1920, height: 1080, fill: C.cobalt900 }, ctx.g)
	const world = el('g', { 'data-part': 'world' }, ctx.g)
	const clipId = 'bsn-card-clip'
	const cp = el('clipPath', { id: clipId }, film.defs)
	el('rect', { x: 0, y: 0, width: CW, height: CH }, cp)
	for (const h of HEADS) drawHead(el('g', { 'data-head': h.section }, world), h)
	for (const c of CARDS) {
		const g = el('g', { 'data-card': c.id, transform: `translate(${c.x} ${c.y})`, 'clip-path': `url(#${clipId})` }, world)
		el('rect', { width: CW, height: CH, fill: C.cobalt }, g) // the card's own ground: the stage colour of the stills
		const inner = el('g', {}, g)
		const cctx = Object.assign(Object.create(ctx), { g: inner, start: c.clock, end: c.leave })
		const anim = animateBoard(cctx, c.b, { start: c.clock, dur: c.dur, lead: c.lead, voice: c.voice, wordAt: c.wordAt, spec: SPEC[c.id]?.(c.wordAt) || {}, orange: C.orange, seed: Math.round(c.arrive * 100) })
		for (const { at, kind, ...o } of anim.cues) film.cue(c.clock + at, kind, o)
		c.g = g
		c.anim = anim
		c.settled = c.clock + anim.end
		const cap = CAPTIONS[c.id]
		if (cap && !V.voice) {
			const tb = textBlock(el('g', { 'data-part': 'caption' }, inner), cap.text, { x: TYPE.x, y: cap.y, size: 36, weight: 600, fill: C.cobalt200, tracking: -0.01, maxWidth: 1600, lineHeight: 1.2 })
			const at = Math.max(anim.end, (c.wordAt(cap.after, 2) ?? anim.end) - F(2))
			c.cap = { tb, at }
			TL.captions.push({ id: c.id, text: cap.text, up: G0.snap(c.clock + at), out: c.leave, rise: 0.3, exit: 0 })
		}
		c.lastL = null
	}
	ctx.g.removeAttribute('display')
	return (tt) => {
		const k = cameraAt(tt)
		world.setAttribute('transform', `translate(960 540) scale(${k.s.toFixed(5)}) translate(${(-k.cx).toFixed(2)} ${(-k.cy).toFixed(2)})`)
		const hw = 960 / k.s, hh = 540 / k.s
		for (const c of CARDS) {
			const seen = c.x < k.cx + hw && c.x + CW > k.cx - hw && c.y < k.cy + hh && c.y + CH > k.cy - hh
			c.g.setAttribute('display', seen ? 'inline' : 'none')
			if (!seen) continue
			// on its turn the card plays its own clock (from the moment the camera sets off towards it); otherwise it is its still
			const l = tt >= c.enter && tt < c.exit ? tt - c.clock : tt < c.enter ? FAR : FAR
			if (l !== c.lastL) {
				c.anim.update(l)
				if (c.cap) c.cap.tb.items.forEach((it, i) => {
					const e = arrive(inv(c.cap.at + i * F(1), c.cap.at + i * F(1) + F(7), l))
					if (e >= 1) it.node.removeAttribute('transform')
					else it.node.setAttribute('transform', `translate(0 ${((1 - e) * 50).toFixed(2)})`)
				})
				c.lastL = l
			}
			// depth by opacity: full while the camera comes to it and holds, dim elsewhere
			const prev = MOVES.find((m) => m.t1 === c.arrive || Math.abs(m.t1 - c.arrive) < 1e-6)
			const next = MOVES.find((m) => Math.abs(m.t0 - c.leave) < 1e-6)
			let o = DIM
			if (tt >= c.arrive && tt < c.leave) o = 1
			else if (prev && tt >= c.enter && tt < c.arrive) o = lerp(DIM, 1, driftCurve(inv(c.enter, c.arrive, tt)))
			else if (next && tt >= c.leave && tt < c.exit) o = lerp(1, DIM, driftCurve(inv(c.leave, c.exit, tt)))
			if (o >= 1) c.g.removeAttribute('opacity')
			else c.g.setAttribute('opacity', o.toFixed(3))
		}
	}
})
film.scene('builtOn', BODY_END, BODY_END + BUILT_ON_DUR, (ctx) => builtOnScene(ctx, CLOSE))
film.scene('install', BODY_END + BUILT_ON_DUR, DURATION, (ctx) => installScene(ctx, CLOSE), { post: 0.001 })

/* ---------- sound for the camera: a soft whoosh under each glide, a longer one under each row change ---------- */
for (const m of MOVES) {
	if (m.kind === 'glide') film.cue(m.t0 + 0.1, 'whoosh', { dur: m.t1 - m.t0 - 0.2, from: 700, to: 1600, gain: 0.035, panFrom: 0.4, panTo: -0.4 })
	if (m.kind === 'out' || m.kind === 'final') film.cue(m.t0, 'whoosh', { dur: m.t1 - m.t0, from: 1800, to: 500, gain: 0.05, panFrom: 0, panTo: 0.2 })
	if (m.kind === 'in') film.cue(m.t0, 'whoosh', { dur: m.t1 - m.t0, from: 500, to: 1900, gain: 0.05, panFrom: 0.2, panTo: 0 })
	if (m.kind === 'in' || m.kind === 'push') film.cue(m.t1, 'tick', { freq: 1760, gain: 0.05, decay: 0.06 })
}

/* ---------- the bed: in D, one progression per row, the pad under everything, the pulse in the build rows ---------- */
const D = [50, 54, 57, 62], Dmaj9 = [50, 54, 61, 64], Bm9 = [47, 54, 57, 61], Gmaj9 = [47, 50, 54, 57], Aadd9 = [49, 52, 57, 59], Fsm7 = [49, 52, 54, 57], Bmadd9 = [47, 50, 54, 61], Gmaj7 = [47, 50, 54, 59], Em9 = [50, 54, 55, 59], Asus = [50, 52, 57, 59]
const ROOT = new Map([[D, 38], [Dmaj9, 38], [Bm9, 35], [Gmaj9, 43], [Aadd9, 45], [Fsm7, 42], [Bmadd9, 35], [Gmaj7, 43], [Em9, 40], [Asus, 45]])
const card = (id) => CARDS.find((c) => c.id === id)
const ACTS = [
	{ at: BODY_START, prog: [Bm9, Gmaj9, D, Aadd9], pulse: false },
	{ at: card('wordpress-share').enter, prog: [Gmaj9, Aadd9, Dmaj9, Bm9], pulse: true },
	{ at: card('suite-vs-workspace').enter, prog: [Dmaj9, Bm9, Gmaj7, Asus], pulse: false },
	{ at: card('power-platform').enter, prog: [Em9, Gmaj9, Bm9, Aadd9], pulse: true },
	{ at: card('sanne').enter, prog: [Dmaj9, Bm9, Gmaj7, Asus], pulse: false },
	{ at: card('framework-basics').enter, prog: [Gmaj9, Aadd9, Fsm7, Bmadd9], pulse: true },
	{ at: card('store-growth').enter, prog: [Dmaj9, Aadd9, Bm9, Gmaj9], pulse: true },
	{ at: card('three-questions').enter, prog: [Gmaj9, Aadd9, Dmaj9, Dmaj9], pulse: false },
]
const BAR = G0.bar
const TOTAL_BARS = Math.round(DURATION / BAR)
const BODY_BAR0 = Math.round(BODY_START / BAR), BODY_BAR1 = Math.round(BODY_END / BAR)
const chords = [], bass = [], kick = []
for (let b = 0; b < TOTAL_BARS; b++) {
	let ch
	if (b < BODY_BAR0) ch = D
	else if (b < BODY_BAR1) {
		let a = 0
		ACTS.forEach((A, i) => { if (b * BAR + 1e-3 >= A.at) a = i })
		const a0 = Math.floor(ACTS[a].at / BAR)
		ch = ACTS[a].prog[(b - a0) % 4]
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

film.board = { film: SLUG, variant: 'talk', meta: { title: 'Business software is next', words: CARDS.map((c) => c.b.words).join(' ') } }
window.__bsn = {
	cards: CARDS.map((c) => ({ id: c.id, row: c.row, enter: c.enter, arrive: c.arrive, leave: c.leave, voice: c.voice, take: !!c.take, settled: c.settled })),
	heads: HEADS.map((h) => ({ section: h.section, t0: h.t0, t1: h.t1, voiceAt: h.voiceAt })),
	moves: MOVES.map(({ t0, t1, kind }) => ({ t0, t1, kind })),
	duration: DURATION, bodyEnd: BODY_END,
}
TL.expose()
film.start()
