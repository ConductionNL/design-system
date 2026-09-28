/**
 * Archiving film (nl), the body: six scenes on the 128 BPM grid, each redrawn from its local
 * time every frame (a pure function of time). Key frames and words: boards/nl/board.js (round 12).
 *
 *   hook          7 beats  two worlds: the document re-filed into a separate archive, its metadata typed twice
 *   mdto          8 beats  #4 typewriter: the metadata fields type themselves, NEN-ISO 16175 heads the panel
 *   selectielijst 8 beats  #3 grid-cell ripple through the list; the last beat is #1's hex growing out of the result
 *   vernietiging  8 beats  #1 continued: the destruction round opens out of a hex at the approve step
 *   standards     8 beats  whip in; #9 text-swap on the held diagram (StUF-ZKN steps to StUF-ZDS)
 *   promise       9 beats  the three apps land round the Nextcloud hex: your workspace is the archive (Round 16)
 *
 * Captions (the chapter mark and the caption) rise out of their line clips in 6 frames, line 2 a
 * frame behind, and leave upward in 4 frames, gone 2 frames before the scene ends, so every
 * hand-over has at least 2 clear frames. No full stops.
 */
import { el, textBlock, nextId } from '../../_lib/stage.js'
import { ease, inv, clamp, lerp, spring, hexPath, SQRT3 } from '../../_lib/core.js'
import { C } from '../../_lib/brand.js'
import { LOOP_ANCHOR, WINDOW } from '../../_lib/scenes/general.js'
import { handoverGround } from '../../_lib/scenes/opening.js'
import { rect, bar, circle, hex, panel, statusPill, docPage, clipped, topbar, nav, appTag, ncTag, fitCaptionSize, layout, TYPE, workspaceCluster, CORNERS, hexCover, honeyAt, use } from '../../_lib/ui.js'

export const FPS = 24
export const SPB = 60 / 128
export const BAR = 4 * SPB
const F = (n) => n / FPS
const snap = (t) => Math.round(t * FPS) / FPS
const beat = (b) => b * SPB

/** Caption timing (local seconds): rise over 6 frames, leave over 4, gone 2 frames before the scene ends. */
export const RISE = F(6)
export const EXIT = F(4)
export const leaveAt = (dur) => snap(dur - F(6))

export const SCENES = [
	{ id: 'hook', beats: 7, mark: 'Archiefwet', text: 'Nog een apart\narchief nodig?', rise: F(12) },
	{ id: 'mdto', beats: 8, mark: 'MDTO', text: 'Bewaard\nwaar je werkt', rise: F(1) },
	{ id: 'selectielijst', beats: 8, mark: 'Selectielijst', text: 'Het zaaktype kent\nzijn bewaartermijn', rise: F(1) },
	{ id: 'vernietiging', beats: 8, mark: 'Vernietiging', text: 'Vernietigd met\nakkoord en spoor', rise: F(3) },
	{ id: 'standards', beats: 8, mark: 'ZGW en ZDS', text: 'Elk zaaksysteem\nspreekt dezelfde taal', rise: F(5) },
	{ id: 'promise', beats: 9, mark: 'Nextcloud', text: 'Je werkplek\nis het archief', rise: F(8) },
]
let acc = 0
for (const s of SCENES) { s.start = snap(beat(acc)); acc += s.beats; s.end = snap(beat(acc)); s.dur = s.end - s.start }
export const BODY = snap(beat(acc)) // 22.5 s, 12 bars

const U = 2.5
const W0 = layout().win // x 940, y 160, s 0.8
const toStage = (mx, my) => [W0.x + W0.s * mx, W0.y + W0.s * my]

/* ---------------------------------------------------------------- type */

/** A line block rising out of its clip (p) and leaving upward (q); line 2 a frame behind. */
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

/** The chapter mark and the caption of a scene at local time t. */
export function drawType(g, sc, t) {
	const out = leaveAt(sc.dur)
	const h = TYPE.markH
	risingBlock(g, sc.mark, { x: TYPE.x, y: TYPE.markY + h * 0.75, size: Math.round(h * 0.8), weight: 700, fill: C.white, tracking: -0.02 }, t, sc.rise, out)
	const size = fitCaptionSize(sc.text)
	risingBlock(g, sc.text, { x: TYPE.x, y: TYPE.y1, size, weight: 700, fill: C.white, tracking: -0.02, lineHeight: Math.round((size * TYPE.lh) / TYPE.size) / size }, t, sc.rise + F(1), out)
}

/* ---------------------------------------------------------------- the window */

/** The AppMock window (as the board's archFrame), offset by dx; returns the mock-space group and geometry. */
function windowAt(g, dx = 0, { W = 1920, H = 1080 } = {}) {
	const view = el('g', { transform: `translate(${(W0.x + dx).toFixed(2)} ${W0.y}) scale(${W0.s})` }, g)
	const visR = (W - W0.x) / W0.s
	const visB = (H - W0.y) / W0.s
	const FW = 720 * U, FH = visB + 60
	const win = clipped(view, 0, 0, FW, FH, 10 * U)
	rect(win, 0, 0, FW, FH, C.white)
	topbar(win, 0, 0, FW, U, { fill: C.cobalt900 })
	nav(win, 0, 24 * U, WINDOW.nav * U, FH - 24 * U, U, { items: 7, active: 2 })
	const x = (WINDOW.nav + 14) * U
	const geom = { x, r: Math.min((720 - 187 - 14) * U, visR - 48 / W0.s), u: U, top: WINDOW.row1 + 60, visB }
	rect(win, (720 - 187) * U, 24 * U, U, FH, C.cobalt100)
	bar(win, geom.x, 95, 250, 35, C.cobalt)
	rect(win, geom.r - 95, 95, 95, 35, C.cobalt, 3 * U)
	return { win, geom }
}

/** The tag hex on the loop anchor; sx is a width scale (a turn-over, never a rotation). */
function tag(g, which, dx = 0, sx = 1) {
	if (sx <= 0.01) return
	const a = LOOP_ANCHOR
	const cx = a.x + dx
	const tg = el('g', sx < 1 ? { transform: `translate(${cx} ${a.y}) scale(${sx.toFixed(4)} 1) translate(${-cx} ${-a.y})` } : {}, g)
	if (which === 'nc') ncTag(tg, cx, a.y, a.r)
	else appTag(tg, cx, a.y, a.r, which, { fill: C.cobalt })
}
/** A turn-over from one tag to the next over 4 frames at local time t0. */
function tagSwap(g, from, to, t, t0, dx = 0) {
	const m = t0 + F(2)
	if (t < t0) return tag(g, from, dx)
	if (t < m) return tag(g, from, dx, 1 - ease.inCubic(inv(t0, m, t)))
	tag(g, to, dx, ease.outCubic(inv(m, m + F(2), t)))
}

const mono = (w, text, x, y, size = 26, fill = C.cobalt400) => textBlock(w, text, { x, y, size, weight: 500, family: 'IBM Plex Mono', fill, clip: false })
const pop = (t, t0, freq = 2.6) => (t < t0 ? 0 : spring(t - t0, { freq, zeta: 0.55 }))
const scaled = (g, cx, cy, s) => el('g', Math.abs(s - 1) > 1e-4 ? { transform: `translate(${cx} ${cy}) scale(${Math.max(s, 0.0001).toFixed(4)}) translate(${-cx} ${-cy})` } : {}, g)

/* ---------------------------------------------------------------- the document and its metadata */

const FIELDS = ['waardering', 'bewaartermijn', 'informatiecategorie', 'archiefvormer', 'dekkingInTijd']
const VALS = [150, 110, 170, 130, 120]
/** When each field starts typing in the mdto scene (local s), one pair of greeked characters (20 mock px) every 0.1 s. */
const TYPE_AT = FIELDS.map((_, i) => snap(beat(0.75 + i * 1.15)))
const typed = (i, t) => (t < TYPE_AT[i] ? 0 : Math.min(VALS[i], 20 * (Math.floor((t - TYPE_AT[i]) / 0.1) + 1)))

/** hook: phase 'hook' (empty slots, the panel ring drawing at ringP, a blink on slot 0); mdto: phase 'mdto'. */
function docWithMeta(w, geom, t, phase, { ringP = 0, blink = false } = {}) {
	const { u } = geom
	const x = geom.x, top = geom.top, dw = 470
	docPage(w, x, top, dw, 600, { k: dw / 500, values: [118, 96, 72], lastOrange: false })
	const px = x + dw + 30, pw = geom.r - px
	panel(w, px, top, pw, 600, u)
	if (phase === 'mdto') {
		// Round 12: the panel head names the standard the metadata follows, rising in its clip.
		const p = ease.brand(inv(beat(0.25), beat(0.25) + RISE, t))
		if (p > 0.001) {
			const blk = textBlock(w, 'NEN-ISO 16175', { x: px + 28, y: top + 50, size: 34, weight: 600, fill: C.cobalt, clip: true })
			if (p < 1) for (const it of blk.items) it.node.setAttribute('transform', `translate(0 ${(46 * (1 - p)).toFixed(2)})`)
		}
		const q = 1 - ease.brand(inv(0, beat(0.25), t))
		if (q > 0.001) bar(w, px + 28, top + 36, 150, 14, C.cobalt700, { opacity: q.toFixed(3) })
	} else bar(w, px + 28, top + 36, 150, 14, C.cobalt700)
	let current = -1
	FIELDS.forEach((f, i) => {
		const fy = top + 96 + i * 98
		mono(w, f, px + 28, fy + 8, 26)
		const sy = fy + 24, sw = pw - 56
		const v = phase === 'mdto' ? typed(i, t) : 0
		if (v > 0) {
			current = i
			rect(w, px + 28, sy, sw, 44, C.cobalt50, 6)
			bar(w, px + 44, sy + 17, v, 11, C.cobalt900)
			if (v < VALS[i] || i === FIELDS.length - 1) rect(w, px + 44 + v + 6, sy + 9, 3 * u, 26, C.cobalt, 0, { opacity: Math.floor(t * 4) % 2 && v >= VALS[i] ? 0 : 1 })
		} else {
			const flash = blink && i === 0
			rect(w, px + 28, sy, sw, 44, C.white, 6, { stroke: flash ? C.cobalt : C.cobalt200, 'stroke-width': flash ? 2 * u : u, 'stroke-dasharray': '10 8' })
		}
	})
	// The one orange: the worry (the whole panel, hook) or the field being written (mdto).
	if (phase === 'hook' && ringP > 0.001) rect(w, px - 8, top - 8, pw + 16, 616, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, pathLength: 1, 'stroke-dasharray': `${ringP.toFixed(4)} 1` })
	if (phase === 'mdto' && current >= 0) {
		const fy = top + 96 + current * 98
		rect(w, px + 18, fy - 22, pw - 36, 100, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	}
}

/**
 * Hook (Round 16): two worlds. The document done in the workspace (left); an arrow re-files it into
 * a separate archive (a grey second system, right) where the same fields are typed a second time;
 * the orange ring draws round the fields typed twice.
 */
function twoWorlds(w, geom, t) {
	const { u } = geom
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	const lw = 400
	docPage(w, x, top, lw, 560, { k: lw / 500, values: [118, 96, 72], lastOrange: false })
	const ax = x + lw + 10, ay = top + 250
	const ap = ease.brand(inv(beat(1.25), beat(1.75), t))
	if (ap > 0.001) {
		rect(w, ax, ay - 1.5 * u, 70 * ap, 3 * u, C.cobalt300)
		if (ap > 0.95) hex(w, ax + 76, ay, 10, C.cobalt300, 1)
	}
	const sx = ax + 100, sw = x + width - sx
	const sp = ease.brand(inv(beat(1.5), beat(1.5) + 0.35, t))
	if (sp <= 0.001) return
	const sg = el('g', { opacity: sp.toFixed(3), transform: `translate(${(60 * (1 - sp)).toFixed(2)} 0)` }, w)
	rect(sg, sx, top, sw, 560, C.cobalt50, 6 * u, { stroke: C.gray300, 'stroke-width': u })
	rect(sg, sx, top, sw, 56, C.gray300, 0)
	mono(sg, 'apart archief', sx + 24, top + 38, 26, C.cobalt700)
	;['waardering', 'bewaartermijn', 'informatiecategorie', 'archiefvormer'].forEach((f, i) => {
		const fy = top + 96 + i * 104
		mono(sg, f, sx + 24, fy + 8, 26)
		// The second typing: the first field fills, the second has its cursor.
		const t0 = beat(2 + i * 0.75)
		const v = i < 2 && t >= t0 ? Math.min(120, 20 * (Math.floor((t - t0) / 0.1) + 1)) : 0
		rect(sg, sx + 24, fy + 24, sw - 48, 44, C.white, 6, { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': v ? 'none' : '10 8' })
		if (v) bar(sg, sx + 40, fy + 41, i === 0 ? v : Math.min(v, 40), 11, C.cobalt900)
		if (i === 1 && v) rect(sg, sx + 40 + Math.min(v, 40) + 6, fy + 33, 3 * u, 26, C.cobalt, 0, { opacity: Math.floor(t * 4) % 2 ? 0 : 1 })
	})
	const ringP = ease.brand(inv(beat(3.5), beat(3.5) + 0.35, t))
	if (ringP > 0.001) rect(sg, sx + 12, top + 72, sw - 24, 196, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, pathLength: 1, 'stroke-dasharray': `${ringP.toFixed(4)} 1` })
}

export function hookScene(ctx) {
	const layer = el('g', { 'data-layer': 'hook' }, ctx.g)
	const sc = SCENES[0]
	const t0 = ctx.start
	return (T) => {
		const t = clamp(T - t0, 0, sc.dur)
		layer.replaceChildren()
		// The opening's handover field, fading out as the window comes in.
		const fa = 1 - ease.outCubic(inv(0, 0.5, t))
		if (fa > 0.001) handoverGround(el('g', { opacity: fa.toFixed(3) }, layer))
		const dx = 760 * (1 - ease.brand(inv(F(2), F(2) + 0.62, t)))
		const { win, geom } = windowAt(layer, dx, ctx)
		twoWorlds(win, geom, t)
		const ts = pop(t, F(8))
		if (ts > 0.001) { const tg = scaled(layer, LOOP_ANCHOR.x + dx, LOOP_ANCHOR.y, ts); tag(tg, 'nc', dx) }
		drawType(layer, sc, t)
	}
}

export function mdtoScene(ctx) {
	const layer = el('g', { 'data-layer': 'mdto' }, ctx.g)
	const sc = SCENES[1]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		const { win, geom } = windowAt(layer, 0, ctx)
		docWithMeta(win, geom, t, 'mdto')
		tagSwap(layer, 'nc', 'filinq', t, 0)
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

export function selectieScene(ctx) {
	const layer = el('g', { 'data-layer': 'selectielijst' }, ctx.g)
	const sc = SCENES[2]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		const { win, geom } = windowAt(layer, 0, ctx)
		const { u } = geom
		const { x, top, width, ly, ry, hx, hy } = SEL(geom)
		// The case lands with its type.
		const cp = ease.brand(inv(0, 0.4, t))
		const cg = el('g', { transform: `translate(0 ${(-60 * (1 - cp)).toFixed(2)})`, opacity: cp.toFixed(3) }, win)
		panel(cg, x, top, width, 120, u)
		hex(cg, x + 60, top + 60, 28, C.lavender, 4)
		bar(cg, x + 110, top + 40, 240, 16, C.cobalt900)
		mono(cg, 'zaaktype', x + 110, top + 92, 26)
		bar(cg, x + 250, top + 82, 180, 11, C.cobalt700)
		statusPill(cg, x + width - 160, top + 60, u)
		// The list rises in under it.
		const lp = ease.brand(inv(beat(0.25), beat(0.25) + 0.4, t))
		const lg = el('g', { transform: `translate(0 ${(80 * (1 - lp)).toFixed(2)})`, opacity: lp.toFixed(3) }, win)
		panel(lg, x, ly, width, 440, u)
		mono(lg, 'selectielijst', x + 28, ly + 44, 28, C.cobalt700)
		// #3: the ripple. Each row's cells step 20% -> full -> settle, the wave running outward from the case type's row.
		const w0 = beat(1.25)
		for (let i = 0; i < 6; i++) {
			const rowY = ly + 76 + i * 58
			const d = Math.abs(i - LIT)
			const lit = t >= beat(3)
			rect(lg, x + 16, rowY, width - 32, 50, i === LIT && lit ? C.cobalt100 : [C.cobalt50, C.white][i % 2], 4)
			for (let c = 0; c < 4; c++) {
				const tw = w0 + d * 0.3 + c * 0.05
				const settle = Math.max(0.35, 1 - d * 0.18)
				let o = 0.2
				if (t >= tw) o = t < tw + 0.15 ? 1 : lerp(1, settle, ease.outCubic(inv(tw + 0.15, tw + 0.45, t)))
				else if (t >= tw - 0.15) o = 0.4
				const cx = x + 36 + c * ((width - 72) / 4)
				bar(lg, cx, rowY + 20, [70, 150, 90, 110][c] - d * 6, 10, i === LIT && lit ? C.cobalt900 : C.cobalt300, { opacity: o.toFixed(3) })
			}
		}
		// The square-cornered wire from the case type down to the lit row, then its result.
		const wp = ease.brand(inv(beat(3), beat(3.75), t))
		if (wp > 0.001) {
			const len = ry - top - 120 + 25
			rect(win, x + 60 - 1.5 * u, top + 120, 3 * u, len * Math.min(1, wp * 1.4), C.cobalt300)
			const hp = clamp(wp * 1.4 - 1, 0, 1) / 0.4
			if (hp > 0) rect(win, x + 60, ry + 25 - 1.5 * u, 40 * Math.min(1, hp), 3 * u, C.cobalt300)
		}
		const rs = pop(t, beat(4))
		if (rs > 0.001) hex(scaled(win, hx, hy, rs), hx, hy, 16, C.orange, 2)
		tag(layer, 'dossiq')
		drawType(layer, sc, t)
		// #1: the last beat, a cobalt hex grows out of the result hex past the frame edge (ease.snap).
		const gp = inv(sc.dur - SPB, sc.dur, t)
		if (gp > 0) {
			const [sx, sy] = toStage(hx, hy)
			const r = lerp(16 * W0.s, hexCover(sx, sy), ease.snap(gp))
			el('path', { d: hexPath(sx, sy, r, 0), fill: C.cobalt }, layer)
			const orr = 16 * W0.s * (1 + 2 * ease.snap(gp))
			el('path', { d: hexPath(sx, sy, orr, 2), fill: C.orange, opacity: (1 - gp).toFixed(3) }, layer)
		}
	}
}

/* ---------------------------------------------------------------- vernietiging */

/** The destruction round's geometry; the approve step (the one orange) is where #1 lands. */
const DEST = (geom) => {
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	const bw = (width - 30) / 2, rx = x + bw + 30
	return { x, top, width, bw, rx, ox: rx + bw - 60, oy: top + 230 }
}

export function destroyScene(ctx) {
	const layer = el('g', { 'data-layer': 'vernietiging' }, ctx.g)
	const sc = SCENES[3]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		// #1, second half: the window opens out of a hex at the approve step.
		const geomProbe = { x: (WINDOW.nav + 14) * U, top: WINDOW.row1 + 60, r: Math.min((720 - 187 - 14) * U, (1920 - W0.x) / W0.s - 48 / W0.s) }
		const D0 = DEST(geomProbe)
		const [sx, sy] = toStage(D0.ox, D0.oy)
		const op = ease.snap(inv(0, SPB, t))
		let host = layer
		if (op < 1) {
			const id = nextId('dclip')
			const cp = el('clipPath', { id }, layer)
			el('path', { d: hexPath(sx, sy, lerp(18 * W0.s, hexCover(sx, sy), op), 0) }, cp)
			host = el('g', { 'clip-path': `url(#${id})` }, layer)
		}
		const { win, geom } = windowAt(host, 0, ctx)
		const { u } = geom
		const { x, top, width, bw, rx, ox, oy } = DEST(geom)
		// Left: the destruction list, the records due, a row a sixteenth.
		panel(win, x, top, bw, 330, u)
		mono(win, 'vernietigingslijst', x + 28, top + 44, 28, C.cobalt700)
		for (let i = 0; i < 4; i++) {
			const t0 = beat(1 + i * 0.25)
			if (t < t0) continue
			const rp = ease.brand(inv(t0, t0 + 0.25, t))
			const ry = top + 80 + i * 58
			const rg = el('g', { opacity: rp.toFixed(3), transform: `translate(${(-30 * (1 - rp)).toFixed(2)} 0)` }, win)
			rect(rg, x + 20, ry, bw - 40, 46, i % 2 ? C.white : C.cobalt50, 4)
			hex(rg, x + 48, ry + 23, 12, C.lavender, 2)
			bar(rg, x + 72, ry + 18, [150, 120, 170, 130][i], 10, C.cobalt900)
			bar(rg, x + bw - 120, ry + 19, 70, 8, C.cobalt300)
		}
		// Right: the approval, a person, then the approved pill on beat 2.5.
		panel(win, rx, top, bw, 330, u)
		mono(win, 'akkoord', rx + 28, top + 44, 28, C.cobalt700)
		circle(win, rx + 70, top + 130, 34, C.cobalt300)
		bar(win, rx + 122, top + 112, 160, 12, C.cobalt900)
		bar(win, rx + 122, top + 138, 110, 8, C.cobalt300)
		const pp = pop(t, beat(2.5))
		if (pp > 0.001) statusPill(scaled(win, rx + 40 + 50, top + 230, pp), rx + 40, top + 230, u)
		hex(win, ox, oy, 18, C.orange, 2)
		// Under both: the verklaring with its seal, and the trail, chained row by row.
		const ty = top + 360
		const tp = ease.brand(inv(beat(3), beat(3) + 0.3, t))
		if (tp > 0.001) {
			const tg = el('g', { opacity: tp.toFixed(3) }, win)
			panel(tg, x, ty, width, 260, u)
			docPage(tg, x + width - 190, ty + 26, 160, 210, { k: 0.3, values: [96, 72], lastOrange: false, shadow: null })
			const ss = pop(t, beat(5.75))
			if (ss > 0.001) hex(scaled(tg, x + width - 60, ty + 210, ss), x + width - 60, ty + 210, 18, C.forest, 3)
			const n = [0, 1, 2, 3].filter((i) => t >= beat(3.5 + i * 0.75)).length
			if (n > 1) rect(tg, x + 50 - 1.5 * u, ty + 44, 3 * u, (n - 1) * 58, C.cobalt200)
			for (let i = 0; i < n; i++) {
				const cy = ty + 44 + i * 58
				const rp = ease.brand(inv(beat(3.5 + i * 0.75), beat(3.5 + i * 0.75) + 0.25, t))
				if (rp > 0.001) hex(tg, x + 50, cy, 13 * rp, C.cobalt400, 2 * rp)
				bar(tg, x + 84, cy - 6, [260, 220, 300, 240][i] * rp, 11, C.cobalt900)
				bar(tg, x + 400, cy - 5, 190 * rp, 9, C.cobalt200)
			}
		}
		tag(op >= 1 ? layer : host, 'openregister')
		drawType(layer, sc, t)
	}
}

/* ---------------------------------------------------------------- standards */

export function standardsScene(ctx) {
	const layer = el('g', { 'data-layer': 'standards' }, ctx.g)
	const sc = SCENES[4]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		// The whip: the window arrives from the right in 5 frames (ease.snap; the render's motion blur smears it).
		const dx = 520 * (1 - ease.snap(inv(0, F(5), t)))
		const { win, geom } = windowAt(layer, dx, ctx)
		const { u } = geom
		const x = geom.x, top = geom.top, width = geom.r - geom.x
		panel(win, x, top, width, 130, u)
		hex(win, x + 64, top + 65, 28, C.lavender, 4)
		bar(win, x + 120, top + 44, 260, 16, C.cobalt900)
		bar(win, x + 120, top + 76, 170, 9, C.cobalt300)
		statusPill(win, x + width - 160, top + 65, u)
		const bw = (width - 30) / 2, by = top + 220
		// Square-cornered wires draw down and across, then split.
		const w1 = ease.brand(inv(beat(1), beat(1.5), t)), w2 = ease.brand(inv(beat(1.5), beat(2), t)), w3 = ease.brand(inv(beat(2), beat(2.4), t))
		if (w1 > 0) rect(win, x + 64 - 1.5 * u, top + 130, 3 * u, 50 * w1, C.cobalt300)
		if (w2 > 0) rect(win, x + 64, top + 178, (bw + 30 + bw / 2 - 64) * w2, 3 * u, C.cobalt300)
		if (w3 > 0) {
			rect(win, x + bw / 2 - 1.5 * u, top + 178, 3 * u, (by - top - 178) * w3, C.cobalt300)
			rect(win, x + bw + 30 + bw / 2 - 1.5 * u, top + 178, 3 * u, (by - top - 178) * w3, C.cobalt300)
		}
		const js = pop(t, beat(2))
		if (js > 0.001) hex(scaled(win, x + bw + 15, top + 178 + 1.5 * u, js), x + bw + 15, top + 178 + 1.5 * u, 16, C.orange, 2)
		// The two boxes; the second head swaps StUF-ZKN for StUF-ZDS on the held diagram (#9).
		const SWAP = beat(5)
		const box = (bx, t0, label) => {
			const p = ease.brand(inv(t0, t0 + 0.35, t))
			if (p <= 0.001) return
			const bg = el('g', { opacity: p.toFixed(3), transform: `translate(0 ${(40 * (1 - p)).toFixed(2)})` }, win)
			panel(bg, bx, by, bw, 360, u)
			rect(bg, bx, by, bw, 64, C.cobalt50, 0)
			if (typeof label === 'string') textBlock(bg, label, { x: bx + 28, y: by + 44, size: 36, weight: 600, fill: C.cobalt, clip: false })
			else label(bg, bx)
			for (let i = 0; i < 4; i++) {
				const fp = ease.brand(inv(t0 + beat(0.25 + i * 0.25), t0 + beat(0.25 + i * 0.25) + 0.2, t))
				const fy = by + 110 + i * 60
				bar(bg, bx + 30, fy, 90 * fp, 8, C.cobalt400)
				bar(bg, bx + 140, fy - 2, (150 - i * 16) * fp, 11, C.cobalt900)
			}
		}
		box(x, beat(2.5), 'ZGW')
		box(x + bw + 30, beat(3.25), (bg, bx) => {
			const q = inv(SWAP, SWAP + F(4), t)
			const words = q <= 0 ? [['StUF-ZKN', 0]] : q >= 1 ? [['StUF-ZDS', 0]] : [['StUF-ZKN', -46 * ease.exit(q)], ['StUF-ZDS', 46 * (1 - ease.brand(q))]]
			for (const [wd, dy] of words) {
				const blk = textBlock(bg, wd, { x: bx + 28, y: by + 44, size: 36, weight: 600, fill: C.cobalt, clip: true })
				if (Math.abs(dy) > 1e-3) for (const it of blk.items) it.node.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`)
			}
		})
		tag(layer, 'dossiq', dx)
		drawType(layer, sc, t)
	}
}

/* ---------------------------------------------------------------- promise */

export function promiseScene(ctx) {
	const layer = el('g', { 'data-layer': 'promise' }, ctx.g)
	const sc = SCENES[5]
	const r = 80, gap = 8
	const s = r + gap / SQRT3
	const cx = LOOP_ANCHOR.x + 1.5 * SQRT3 * s
	const cy = LOOP_ANCHOR.y + 1.5 * s
	const cells = [
		{ ...CORNERS.nw, id: 'openregister', fill: C.orange, glyph: C.white, at: beat(0.5) },
		{ ...CORNERS.ne, id: 'dossiq', at: beat(1) },
		{ ...CORNERS.s, id: 'filinq', at: beat(1.25) },
	]
	return (T) => {
		const t = clamp(T - ctx.start, 0, sc.dur)
		layer.replaceChildren()
		// The Nextcloud hex lands at 1.4x and settles; the three apps pop in round it.
		const k = t < 0.3 ? 1 + 0.4 * (1 - ease.brand(inv(0, 0.3, t))) : 1
		const g = scaled(layer, cx, cy, k)
		workspaceCluster(g, cx, cy, r, gap, { ring: [], open: cells, fieldTop: -Infinity, fieldScale: 0.5, W: ctx.W, H: ctx.H })
		const at = honeyAt(cx, cy, r, gap)
		for (const c of cells) {
			const ps = pop(t, c.at)
			if (ps <= 0.001) continue
			const [x, y] = at(c.q, c.r)
			const cg = scaled(g, x, y, ps)
			hex(cg, x, y, r, c.fill || C.white, r * 0.1, { stroke: C.cobalt, 'stroke-width': gap, 'paint-order': 'stroke' })
			const gs = r * 0.84
			use(cg, `g-${c.id}`, x - gs / 2, y - gs / 2, gs, gs, c.glyph || C.cobalt)
		}
		drawType(layer, sc, t)
	}
}

export const BUILDERS = { hook: hookScene, mdto: mdtoScene, selectielijst: selectieScene, vernietiging: destroyScene, standards: standardsScene, promise: promiseScene }

/** For the score: when each mdto field starts typing (local s) and how many character pairs it types. */
export const TYPE_AT_EXPORT = FIELDS.map((_, i) => ({ t0: TYPE_AT[i], pairs: Math.ceil(VALS[i] / 20) }))
