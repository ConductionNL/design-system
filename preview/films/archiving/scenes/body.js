/**
 * Archiving film (nl), the body, rounds 19 to 27 (the storyboard at boards/nl/board.js): five scenes on
 * the 128 BPM grid, each redrawn from its local time every frame (a pure function of time).
 *
 *   hook          12 beats  "Nooit meer archiveren?" over two worlds: the document re-filed into a
 *                           separate archive, its metadata typed twice. The current (Round 24) is born
 *                           at the frame's centre and runs to the fields typed twice.
 *   mdto           9 beats  the two worlds become one: the separate archive turns over and out, the
 *                           workspace's own metadata panel turns over in; #4 typewriter fills it
 *   selectielijst  9 beats  arrives by a scroll-whip up from mdto; #3 ripple through the list
 *   vernietiging   9 beats  the window turns over (a card flip, the hex's own move) into the destruction round
 *   standards      9 beats  whip-pan: vernietiging leaves left, standards arrive from the right; the diagram holds
 *
 * Design rules (bible Round 26/27): each hand-off is a designed transition (the current is used once, as
 * the motif's birth, not between every scene); every hex flips in (a width turn-over, never a pop or a
 * scale); no hex floats over the grid (the app tag on the loop anchor is gone); the small mark over each
 * caption is a section title; lines are drawn on.
 *
 * Captions rise out of their line clips in 6 frames, line 2 a frame behind, and leave upward in 4
 * frames, gone 2 frames before the scene ends. No full stops.
 */
import { el, textBlock, nextId } from '../../_lib/stage.js'
import { ease, inv, clamp, lerp, hexPath } from '../../_lib/core.js'
import { C } from '../../_lib/brand.js'
import { WINDOW } from '../../_lib/scenes/general.js'
import { handoverGround } from '../../_lib/scenes/opening.js'
import { rect, bar, circle, hex, panel, statusPill, docPage, clipped, topbar, nav, fitCaptionSize, layout, TYPE } from '../../_lib/ui.js'
import { CURRENT, sceneCurrent } from '../../_lib/current.js'

export const FPS = 24
export const SPB = 60 / 128
export const BAR = 4 * SPB
const F = (n) => n / FPS
const snap = (t) => Math.round(t * FPS) / FPS
const beat = (b) => b * SPB

export const RISE = F(6)
export const EXIT = F(4)
export const leaveAt = (dur) => snap(dur - F(6))

/** Section titles (Round 27c) and captions (Rounds 19 to 21), as on the board. */
export const SCENES = [
	{ id: 'hook', beats: 12, mark: 'Soevereine werkplek', text: 'Nooit meer\narchiveren?', rise: F(12) },
	{ id: 'mdto', beats: 9, mark: 'Metadata', text: 'Compliant waar je\nwerkt, niet achteraf', rise: F(1) },
	{ id: 'selectielijst', beats: 9, mark: 'Bewaartermijn', text: 'Elk dossier krijgt\nvanzelf zijn termijn', rise: F(3) },
	{ id: 'vernietiging', beats: 9, mark: 'Vernietiging', text: 'Vernietigd met\nakkoord en spoor', rise: F(3) },
	{ id: 'standards', beats: 9, mark: 'Standaarden', text: 'Je werkplek is het\nDMS voor elk systeem', rise: F(5) },
]
let acc = 0
for (const s of SCENES) { s.start = snap(beat(acc)); acc += s.beats; s.end = snap(beat(acc)); s.dur = s.end - s.start }
export const BODY = snap(beat(acc)) // 22.5 s, 12 bars

const U = 2.5
const W0 = layout().win // x 940, y 160, s 0.8
const toStage = (mx, my) => [W0.x + W0.s * mx, W0.y + W0.s * my]
/** The window's centre on stage, for the card flip. */
const WIN_CX = W0.x + (1920 - W0.x) / 2

/* ---------------------------------------------------------------- type */

function risingBlock(g, text, opts, t, riseAt, outAt) {
	if (t < riseAt || t >= outAt + EXIT) return
	const blk = textBlock(g, text, { ...opts, clip: true })
	const d = opts.size * 1.35
	blk.lines.forEach((line, i) => {
		const p = ease.brand(inv(riseAt + F(i), riseAt + F(i) + RISE, t))
		const q = inv(outAt, outAt + EXIT, t)
		const dy = q > 0 ? -d * ease.exit(q) : d * (1 - p)
		if (Math.abs(dy) > 1e-3) for (const it of line.items) it.node.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`)
	})
}

/** The section title and the caption of a scene at local time t. */
export function drawType(g, sc, t) {
	const out = leaveAt(sc.dur)
	const h = TYPE.markH
	risingBlock(g, sc.mark, { x: TYPE.x, y: TYPE.markY + h * 0.75, size: Math.round(h * 0.8), weight: 700, fill: C.white, tracking: -0.02 }, t, sc.rise, out)
	const size = fitCaptionSize(sc.text)
	risingBlock(g, sc.text, { x: TYPE.x, y: TYPE.y1, size, weight: 700, fill: C.white, tracking: -0.02, lineHeight: Math.round((size * TYPE.lh) / TYPE.size) / size }, t, sc.rise + F(1), out)
}

/* ---------------------------------------------------------------- the window and its moves */

/**
 * The AppMock window, drawn under a move: dx/dy translate, sx a width turn-over about the window's centre
 * (the card flip). `header` replaces the page title bar with a label (the standards the scene follows).
 */
function windowAt(g, { dx = 0, dy = 0, sx = 1, header = null } = {}) {
	const mv = el('g', {}, g)
	const parts = []
	if (dx || dy) parts.push(`translate(${dx.toFixed(2)} ${dy.toFixed(2)})`)
	if (sx < 1) parts.push(`translate(${WIN_CX} 0) scale(${Math.max(sx, 0.0001).toFixed(4)} 1) translate(${-WIN_CX} 0)`)
	if (parts.length) mv.setAttribute('transform', parts.join(' '))
	const view = el('g', { transform: `translate(${W0.x} ${W0.y}) scale(${W0.s})` }, mv)
	const visR = (1920 - W0.x) / W0.s
	const visB = (1080 - W0.y) / W0.s
	const FW = 720 * U, FH = visB + 60
	const win = clipped(view, 0, 0, FW, FH, 10 * U)
	rect(win, 0, 0, FW, FH, C.white)
	topbar(win, 0, 0, FW, U, { fill: C.cobalt900 })
	nav(win, 0, 24 * U, WINDOW.nav * U, FH - 24 * U, U, { items: 7, active: 2 })
	const x = (WINDOW.nav + 14) * U
	const geom = { x, r: Math.min((720 - 187 - 14) * U, visR - 48 / W0.s), u: U, top: WINDOW.row1 + 60, visB }
	rect(win, (720 - 187) * U, 24 * U, U, FH, C.cobalt100)
	if (header) textBlock(win, header, { x: geom.x, y: 124, size: 36, weight: 600, fill: C.cobalt, clip: false })
	else bar(win, geom.x, 95, 250, 35, C.cobalt)
	rect(win, geom.r - 95, 95, 95, 35, C.cobalt, 3 * U)
	return { win, geom }
}

/** A hex that flips in (a width turn-over about its centre from t0 over 5 frames; never a pop or a scale). */
function flipHex(g, cx, cy, r, fill, round, t, t0, extra = {}) {
	if (t < t0) return
	const sx = ease.outCubic(inv(t0, t0 + F(5), t))
	const hg = el('g', sx < 1 ? { transform: `translate(${cx} ${cy}) scale(${Math.max(sx, 0.0001).toFixed(4)} 1) translate(${-cx} ${-cy})` } : {}, g)
	hex(hg, cx, cy, r, fill, round, extra)
}

/** A group turned over about a vertical axis: sx 1 whole, 0 edge-on. */
const turned = (g, cx, sx) => el('g', sx < 1 ? { transform: `translate(${cx} 0) scale(${Math.max(sx, 0.0001).toFixed(4)} 1) translate(${-cx} 0)` } : {}, g)

const mono = (w, text, x, y, size = 26, fill = C.cobalt400) => textBlock(w, text, { x, y, size, weight: 500, family: 'IBM Plex Mono', fill, clip: false })

/* ---------------------------------------------------------------- hook: two worlds */

const DOC_W = 400
const GEOM0 = { x: (WINDOW.nav + 14) * U, top: WINDOW.row1 + 60, r: Math.min((720 - 187 - 14) * U, (1920 - W0.x) / W0.s - 48 / W0.s) }
/** The separate archive's box (mock space) and the fields typed twice (the hook's orange ring). */
const ARCH = (() => {
	const x = GEOM0.x, top = GEOM0.top, width = GEOM0.r - GEOM0.x
	const sx = x + DOC_W + 110
	return { sx, sw: x + width - sx, top, ring: [sx + 12, top + 72, x + width - sx - 24, 196] }
})()

function separateArchive(w, t, { flipOut = 1 } = {}) {
	const { u } = { u: U }
	const { sx, sw, top } = ARCH
	const sp = ease.brand(inv(beat(1.5), beat(1.5) + 0.35, t))
	if (sp <= 0.001 || flipOut <= 0.001) return
	const sg = turned(el('g', { opacity: sp.toFixed(3), transform: `translate(${(60 * (1 - sp)).toFixed(2)} 0)` }, w), sx + sw / 2, flipOut)
	rect(sg, sx, top, sw, 560, C.cobalt50, 6 * u, { stroke: C.gray300, 'stroke-width': u })
	rect(sg, sx, top, sw, 56, C.gray300, 0)
	mono(sg, 'apart archief', sx + 24, top + 38, 26, C.cobalt700)
	;['waardering', 'bewaartermijn', 'informatiecategorie', 'archiefvormer'].forEach((f, i) => {
		const fy = top + 96 + i * 104
		mono(sg, f, sx + 24, fy + 8, 26)
		const t0 = beat(2 + i * 0.75)
		const v = i < 2 && t >= t0 ? Math.min(120, 20 * (Math.floor((t - t0) / 0.1) + 1)) : 0
		rect(sg, sx + 24, fy + 24, sw - 48, 44, C.white, 6, { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': v ? 'none' : '10 8' })
		if (v) bar(sg, sx + 40, fy + 41, i === 0 ? v : Math.min(v, 40), 11, C.cobalt900)
		if (i === 1 && v) rect(sg, sx + 40 + Math.min(v, 40) + 6, fy + 33, 3 * u, 26, C.cobalt, 0, { opacity: Math.floor(t * 4) % 2 ? 0 : 1 })
	})
	const ringP = ease.brand(inv(beat(3.5), beat(3.5) + 0.35, t))
	const [rx, ry, rw, rh] = ARCH.ring
	if (ringP > 0.001) rect(sg, rx, ry, rw, rh, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, pathLength: 1, 'stroke-dasharray': `${ringP.toFixed(4)} 1` })
}

/** The re-filing arrow, drawn on. */
function refileArrow(w, t, fade = 1) {
	const ax = GEOM0.x + DOC_W + 10, ay = GEOM0.top + 250
	const ap = ease.brand(inv(beat(1.25), beat(1.75), t)) * fade
	if (ap <= 0.001) return
	rect(w, ax, ay - 1.5 * U, 70 * ap, 3 * U, C.cobalt300, 0, fade < 1 ? { opacity: fade.toFixed(3) } : {})
}

/** The current's route into the hook: from the frame's centre to the left edge of the fields typed twice. */
const HOOK_RING_STAGE = (() => {
	const [rx, ry, rw, rh] = ARCH.ring
	const [x0, y0] = toStage(rx, ry), [x1, y1] = toStage(rx + rw, ry + rh)
	return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, left: [x0 - 6, (y0 + y1) / 2] }
})()
export const CURRENT_HOOK_AT = beat(4.5)

export function hookScene(ctx) {
	const layer = el('g', { 'data-layer': 'hook' }, ctx.g)
	const sc = SCENES[0]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		// The opening's handover field, fading out as the window comes in.
		const fa = 1 - ease.outCubic(inv(0, 0.5, t))
		if (fa > 0.001) handoverGround(el('g', { opacity: fa.toFixed(3) }, layer))
		const dx = 760 * (1 - ease.brand(inv(F(2), F(2) + 0.62, t)))
		const { win, geom } = windowAt(layer, { dx })
		docPage(win, geom.x, geom.top, DOC_W, 560, { k: DOC_W / 500, values: [118, 96, 72], lastOrange: false })
		refileArrow(win, t)
		separateArchive(win, t)
		// Round 24: the current is born at the frame's centre and runs to the fields typed twice (the motif, once).
		if (t >= CURRENT_HOOK_AT) sceneCurrent(layer, t, { from: CURRENT.origin, to: HOOK_RING_STAGE.left, element: null, headColor: C.nextcloudCyan, t0: CURRENT_HOOK_AT })
		drawType(layer, sc, t)
	}
}

/* ---------------------------------------------------------------- mdto: the two worlds become one */

const FIELDS = ['waardering', 'bewaartermijn', 'informatiecategorie', 'archiefvormer', 'dekkingInTijd']
const VALS = [150, 110, 170, 130, 120]
const TYPE_AT = FIELDS.map((_, i) => snap(beat(1.25 + i * 1.15)))
const typed = (i, t) => (t < TYPE_AT[i] ? 0 : Math.min(VALS[i], 20 * (Math.floor((t - TYPE_AT[i]) / 0.1) + 1)))
/** The turn-over: the separate archive turns out (4 frames), the workspace's own panel turns in (4 frames). */
const TURN = [F(3), F(7), F(11)]
/** The last 5 frames: the page scrolls up out of the window (the scroll-whip into selectielijst). */
const SCROLL = F(5)

function metaPanel(w, geom, t) {
	const { u } = geom
	const px = geom.x + DOC_W + 30, pw = geom.r - px
	const sx = ease.outCubic(inv(TURN[1], TURN[2], t))
	if (sx <= 0.001) return
	const pg = turned(w, px + pw / 2, sx)
	panel(pg, px, geom.top, pw, 560, u)
	bar(pg, px + 28, geom.top + 36, 150, 14, C.cobalt700)
	let current = -1
	FIELDS.forEach((f, i) => {
		const fy = geom.top + 90 + i * 92
		mono(pg, f, px + 28, fy + 8, 26)
		const sy = fy + 24, sw = pw - 56
		const v = typed(i, t)
		if (v > 0) {
			current = i
			rect(pg, px + 28, sy, sw, 44, C.cobalt50, 6)
			bar(pg, px + 44, sy + 17, v, 11, C.cobalt900)
			if (v < VALS[i] || i === FIELDS.length - 1) rect(pg, px + 44 + v + 6, sy + 9, 3 * u, 26, C.cobalt, 0, { opacity: Math.floor(t * 4) % 2 && v >= VALS[i] ? 0 : 1 })
		} else rect(pg, px + 28, sy, sw, 44, C.white, 6, { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': '10 8' })
	})
	if (current >= 0) {
		const fy = geom.top + 90 + current * 92
		rect(pg, px + 18, fy - 22, pw - 36, 96, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	}
}

export function mdtoScene(ctx) {
	const layer = el('g', { 'data-layer': 'mdto' }, ctx.g)
	const sc = SCENES[1]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		const dy = -620 * ease.inCubic(inv(sc.dur - SCROLL, sc.dur, t))
		const { win, geom } = windowAt(layer, { dy, header: t >= beat(0.5) ? 'MDTO · ISO 16175 · Archiefwet' : null })
		docPage(win, geom.x, geom.top, DOC_W, 560, { k: DOC_W / 500, values: [118, 96, 72], lastOrange: false })
		// The two worlds become one: the arrow fades, the separate archive turns over and out.
		refileArrow(win, sc.dur, 1 - inv(0, TURN[1], t))
		if (t < TURN[1]) separateArchive(win, 99, { flipOut: 1 - ease.inCubic(inv(TURN[0], TURN[1], t)) })
		metaPanel(win, geom, t)
		drawType(layer, sc, t)
	}
}

/* ---------------------------------------------------------------- selectielijst */

const LIT = 3
const SEL = (geom) => {
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	const ly = top + 160
	const ry = ly + 76 + LIT * 58
	return { x, top, width, ly, ry, hx: x + width - 56, hy: ry + 25 }
}
/** The last 4 frames: the window turns over (the card flip into vernietiging). */
const FLIP = F(4)

export function selectieScene(ctx) {
	const layer = el('g', { 'data-layer': 'selectielijst' }, ctx.g)
	const sc = SCENES[2]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		// In: the page scrolls up into the window (the scroll-whip's second half). Out: the window turns over.
		const dy = 620 * (1 - ease.outCubic(inv(0, SCROLL, t)))
		const sx = 1 - ease.inCubic(inv(sc.dur - FLIP, sc.dur, t))
		const { win, geom } = windowAt(layer, { dy, sx })
		const { u } = geom
		const { x, top, width, ly, ry, hx, hy } = SEL(geom)
		panel(win, x, top, width, 120, u)
		hex(win, x + 60, top + 60, 28, C.cobalt300, 4)
		bar(win, x + 110, top + 40, 240, 16, C.cobalt900)
		mono(win, 'zaaktype', x + 110, top + 92, 26)
		bar(win, x + 250, top + 82, 180, 11, C.cobalt700)
		statusPill(win, x + width - 160, top + 60, u)
		panel(win, x, ly, width, 440, u)
		mono(win, 'selectielijst', x + 28, ly + 44, 28, C.cobalt700)
		// #3: the ripple, outward from the case type's row.
		const w0 = beat(1.5)
		for (let i = 0; i < 6; i++) {
			const rowY = ly + 76 + i * 58
			const d = Math.abs(i - LIT)
			const lit = t >= beat(3.25)
			rect(win, x + 16, rowY, width - 32, 50, i === LIT && lit ? C.cobalt100 : [C.cobalt50, C.white][i % 2], 4)
			for (let c = 0; c < 4; c++) {
				const tw = w0 + d * 0.3 + c * 0.05
				const settle = Math.max(0.35, 1 - d * 0.18)
				let o = 0.2
				if (t >= tw) o = t < tw + 0.15 ? 1 : lerp(1, settle, ease.outCubic(inv(tw + 0.15, tw + 0.45, t)))
				else if (t >= tw - 0.15) o = 0.4
				const cx = x + 36 + c * ((width - 72) / 4)
				bar(win, cx, rowY + 20, [70, 150, 90, 110][c] - d * 6, 10, i === LIT && lit ? C.cobalt900 : C.cobalt300, { opacity: o.toFixed(3) })
			}
		}
		// The square-cornered wire from the case type down to the lit row, drawn on, then its result flips in.
		const wp = ease.brand(inv(beat(3.25), beat(4), t))
		if (wp > 0.001) {
			const len = ry - top - 120 + 25
			rect(win, x + 60 - 1.5 * u, top + 120, 3 * u, len * Math.min(1, wp * 1.4), C.cobalt300)
			const hp = clamp(wp * 1.4 - 1, 0, 1) / 0.4
			if (hp > 0) rect(win, x + 60, ry + 25 - 1.5 * u, (width - 120) * Math.min(1, hp), 3 * u, C.cobalt300)
		}
		flipHex(win, hx, hy, 16, C.orange, 2, t, beat(4.25))
		drawType(layer, sc, t)
	}
}

/* ---------------------------------------------------------------- vernietiging */

const DEST = (geom) => {
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	const bw = (width - 30) / 2, rx = x + bw + 30
	return { x, top, width, bw, rx, ox: rx + bw - 60, oy: top + 230 }
}
/** The last 5 frames: the window whips out to the left (the whip-pan into the standards). */
const WHIP = F(5)

export function destroyScene(ctx) {
	const layer = el('g', { 'data-layer': 'vernietiging' }, ctx.g)
	const sc = SCENES[3]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		// In: the window turns back over from edge-on (the card flip's second half). Out: whip left.
		const sx = ease.outCubic(inv(0, FLIP, t))
		const dx = -1100 * ease.inCubic(inv(sc.dur - WHIP, sc.dur, t))
		const { win, geom } = windowAt(layer, { dx, sx })
		const { u } = geom
		const { x, top, width, bw, rx, ox, oy } = DEST(geom)
		panel(win, x, top, bw, 330, u)
		mono(win, 'vernietigingslijst', x + 28, top + 44, 28, C.cobalt700)
		for (let i = 0; i < 4; i++) {
			const t0 = beat(0.75 + i * 0.25)
			if (t < t0) continue
			const rp = ease.brand(inv(t0, t0 + 0.25, t))
			const ry = top + 80 + i * 58
			const rg = el('g', { opacity: rp.toFixed(3), transform: `translate(${(-30 * (1 - rp)).toFixed(2)} 0)` }, win)
			rect(rg, x + 20, ry, bw - 40, 46, i % 2 ? C.white : C.cobalt50, 4)
			flipHex(rg, x + 48, ry + 23, 12, C.cobalt300, 2, t, t0)
			bar(rg, x + 72, ry + 18, [150, 120, 170, 130][i], 10, C.cobalt900)
			bar(rg, x + bw - 120, ry + 19, 70, 8, C.cobalt300)
		}
		panel(win, rx, top, bw, 330, u)
		mono(win, 'akkoord', rx + 28, top + 44, 28, C.cobalt700)
		circle(win, rx + 70, top + 130, 34, C.cobalt300)
		bar(win, rx + 122, top + 112, 160, 12, C.cobalt900)
		bar(win, rx + 122, top + 138, 110, 8, C.cobalt300)
		if (t >= beat(2.5)) statusPill(win, rx + 40, top + 230, u)
		flipHex(win, ox, oy, 18, C.orange, 2, t, beat(2.5))
		// Under both: the verklaring with its seal, and the trail, chained row by row (lines drawn on).
		const ty = top + 360
		const tp = ease.brand(inv(beat(3), beat(3) + 0.3, t))
		if (tp > 0.001) {
			const tg = el('g', { opacity: tp.toFixed(3) }, win)
			panel(tg, x, ty, width, 260, u)
			docPage(tg, x + width - 190, ty + 26, 160, 210, { k: 0.3, values: [96, 72], lastOrange: false, shadow: null })
			flipHex(tg, x + width - 60, ty + 210, 18, C.cobalt, 3, t, beat(5.75))
			const n = [0, 1, 2, 3].filter((i) => t >= beat(3.5 + i * 0.75)).length
			if (n > 1) {
				const lp = ease.brand(inv(beat(3.5 + (n - 1) * 0.75), beat(3.5 + (n - 1) * 0.75) + 0.2, t))
				rect(tg, x + 50 - 1.5 * u, ty + 44, 3 * u, (n - 2 + lp) * 58, C.cobalt200)
			}
			for (let i = 0; i < n; i++) {
				const cy = ty + 44 + i * 58
				const t0 = beat(3.5 + i * 0.75)
				const rp = ease.brand(inv(t0, t0 + 0.25, t))
				flipHex(tg, x + 50, cy, 13, C.cobalt400, 2, t, t0)
				bar(tg, x + 84, cy - 6, [260, 220, 300, 240][i] * rp, 11, C.cobalt900)
				bar(tg, x + 400, cy - 5, 190 * rp, 9, C.cobalt200)
			}
		}
		drawType(layer, sc, t)
	}
}

/* ---------------------------------------------------------------- standards */

export const STANDARDS = ['ZGW', 'ZDS', 'StUF', 'OIO', 'CMMN']

export function standardsScene(ctx) {
	const layer = el('g', { 'data-layer': 'standards' }, ctx.g)
	const sc = SCENES[4]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		// The whip-pan's second half: the window arrives from the right in 5 frames.
		const dx = 1100 * (1 - ease.outCubic(inv(0, WHIP, t)))
		const { win, geom } = windowAt(layer, { dx })
		const { u } = geom
		const x = geom.x, top = geom.top, width = geom.r - geom.x
		panel(win, x, top, width, 130, u)
		hex(win, x + 64, top + 65, 28, C.cobalt300, 4)
		bar(win, x + 120, top + 44, 260, 16, C.cobalt900)
		bar(win, x + 120, top + 76, 170, 9, C.cobalt300)
		statusPill(win, x + width - 160, top + 65, u)
		// Square-cornered wires drawn on: down from the workspace, across, then down into five outside systems.
		const n = STANDARDS.length, gap = 14, bw = (width - gap * (n - 1)) / n, by = top + 240
		const mid = x + width / 2
		const w1 = ease.brand(inv(beat(1), beat(1.5), t)), w2 = ease.brand(inv(beat(1.5), beat(2), t)), w3 = ease.brand(inv(beat(2), beat(2.4), t))
		if (w1 > 0) rect(win, mid - 1.5 * u, top + 130, 3 * u, 60 * w1, C.cobalt300)
		if (w2 > 0) rect(win, mid - (width - bw) / 2 * w2, top + 188, (width - bw) * w2, 3 * u, C.cobalt300)
		flipHex(win, mid, top + 188 + 1.5 * u, 16, C.orange, 2, t, beat(1.5))
		STANDARDS.forEach((label, i) => {
			const bx = x + i * (bw + gap)
			if (w3 > 0) rect(win, bx + bw / 2 - 1.5 * u, top + 188, 3 * u, (by - top - 188) * w3, C.cobalt300)
			const t0 = beat(2.5 + i * 0.35)
			const p = ease.brand(inv(t0, t0 + 0.3, t))
			if (p <= 0.001) return
			const bg = el('g', { opacity: p.toFixed(3), transform: `translate(0 ${(40 * (1 - p)).toFixed(2)})` }, win)
			panel(bg, bx, by, bw, 330, u)
			rect(bg, bx, by, bw, 60, C.cobalt50, 0)
			textBlock(bg, label, { x: bx + bw / 2, y: by + 42, size: 30, weight: 600, fill: C.cobalt, anchor: 'middle', clip: false })
			for (let k = 0; k < 4; k++) {
				const fp = ease.brand(inv(t0 + beat(0.25 + k * 0.25), t0 + beat(0.25 + k * 0.25) + 0.2, t))
				bar(bg, bx + 18, by + 100 + k * 56, (bw - 36 - (k % 2) * 30) * fp, 10, k % 2 ? C.cobalt300 : C.cobalt900)
			}
		})
		drawType(layer, sc, t)
	}
}

export const BUILDERS = { hook: hookScene, mdto: mdtoScene, selectielijst: selectieScene, vernietiging: destroyScene, standards: standardsScene }

/** For the score: when each mdto field starts typing (local s) and how many character pairs it types. */
export const TYPE_AT_EXPORT = FIELDS.map((_, i) => ({ t0: TYPE_AT[i], pairs: Math.ceil(VALS[i] / 20) }))
/** For the score: the transitions (local s within their scene). */
export const MOVES = { turn: TURN, scroll: SCROLL, flip: FLIP, whip: WHIP, currentAt: CURRENT_HOOK_AT }
