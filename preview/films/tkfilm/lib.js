/**
 * Shared pieces for the Thematiq and Keepiq films (Round 23, the portfolio animation pass).
 * Engine additions for these two films only; _lib is not edited.
 *
 * The body of each film is ONE take through one honeycomb world, the ConNext film's device:
 *
 *   world    the handover lattice of the Conduction opening (circumradius 150, gap 16 in world
 *            units; at zoom 0.85 it is the opening's last field cell for cell), so the body starts
 *            on the opening's frame without a cut;
 *   depth    two more layers of the same pointy-top hexes: a far field (larger cells, slower, dimmer)
 *            and a near veil (a few big cells, faster, very faint), both moving with the camera at
 *            their own parallax; depth comes from size and opacity only (no blur, no gradient);
 *   screens  the product screens live INSIDE cells of the world, drawn in world space, so a push
 *            into a cell opens the real screen (the storyboard's key frame is the rest of that push)
 *            and a fly between two cells pulls back over the honeycomb and dives into the next;
 *   current  the Round 24 motif (_lib/current.js): a square-cornered wire along which a current runs,
 *            a small Nextcloud-cyan hex at its head; it carries the hand-offs and powers each key
 *            element on, with a crackle, an arc and a click.
 *
 * The camera is the ConNext film's (connext/lib/camera.js: rests and pivot/fly moves), the captions
 * its masked rise and glued exit (connext/lib/type.js).
 */
import { el, textBlock, nextId } from '../_lib/stage.js'
import { C } from '../_lib/brand.js'
import { clamp, inv, lerp, ease, spring, hexPath, SQRT3, mix, rand } from '../_lib/core.js'
import { HANDOVER } from '../_lib/scenes/opening.js'
import { drawWire, CURRENT, currentCues } from '../_lib/current.js'
import { WINDOW } from '../_lib/scenes/general.js'
import { topbar, nav, rect, bar, appTag, clipped, layout } from '../_lib/ui.js'

export const FPS = 24
export const F = (n) => n / FPS
export const R = 150
export const GAP = 16
const S = R + GAP / SQRT3
export const PITCH_X = S * SQRT3
export const PITCH_Y = S * 1.5
export const ROUND = 10

/** World centre of axial cell (q, r). */
export const cellXY = (q, r) => [PITCH_X * (q + r / 2), PITCH_Y * r]
export const hexDist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
export const worldTf = (c) => `translate(${(c.px - c.x * c.z).toFixed(3)} ${(c.py - c.y * c.z).toFixed(3)}) scale(${c.z.toFixed(5)})`
export const toScreen = (c, wx, wy) => [c.px + (wx - c.x) * c.z, c.py + (wy - c.y) * c.z]

/** The body's first camera: the world exactly on the opening's handover field (cell (0, 0) where the avatar was). */
export const HO = HANDOVER
export const CAM_HO = { x: 0, y: 0, z: HO.houseZoom, px: HO.origin[0], py: HO.origin[1] }
export const HO_RATE = HO.push / HO.zoom

/** A camera that puts world point (wx, wy) on screen (sx, sy) at zoom z. */
export const camOn = (wx, wy, sx, sy, z) => ({ x: wx, y: wy, z, px: sx, py: sy })

/* ------------------------------------------------------------ the field */

/** The ghost look of an empty cell, by its screen position: the opening's shading (full near the centre). */
export function ghostOpacity(sx, sy) {
	return HO.opacity(sx, sy)
}

/**
 * Draws every cell visible under camera c. look(q, r, info) returns null (skip), or
 * { fill, opacity, draw(g, wx, wy) } for a special cell. Empty cells are the ghost field.
 */
export function drawField(parent, c, look, { reach = 0, fill = C.cobalt600, solid = 0 } = {}) {
	const g = el('g', { transform: worldTf(c) }, parent)
	const x0 = c.x + (0 - c.px) / c.z, x1 = c.x + (1920 - c.px) / c.z
	const y0 = c.y + (0 - c.py) / c.z, y1 = c.y + (1080 - c.py) / c.z
	const rMin = Math.floor(y0 / PITCH_Y) - 1, rMax = Math.ceil(y1 / PITCH_Y) + 1
	const specials = []
	for (let r = rMin; r <= rMax; r++) {
		const qMin = Math.floor(x0 / PITCH_X - r / 2) - 1, qMax = Math.ceil(x1 / PITCH_X - r / 2) + 1
		for (let q = qMin; q <= qMax; q++) {
			const [wx, wy] = cellXY(q, r)
			const [sx, sy] = toScreen(c, wx, wy)
			const info = { q, r, k: `${q},${r}`, sx, sy, d: hexDist(q, r) }
			const lk = look ? look(q, r, info) : undefined
			if (lk === null) continue
			if (lk && lk.draw) { specials.push([lk, wx, wy]); continue }
			// Round 28c: ONE solid grid; `solid` blends the opening's shaded handover field into a clear, solid one
			const o = lk?.opacity ?? lerp(ghostOpacity(sx, sy), 1, solid)
			if (o <= 0.004) continue
			el('path', { d: hexPath(wx, wy, R, ROUND), fill: lk?.fill ?? fill, 'fill-opacity': o.toFixed(3) }, g)
		}
	}
	for (const [lk, wx, wy] of specials) lk.draw(g, wx, wy)
	return g
}

/**
 * The far field: the same hexes, twice the size, at half the camera's pan and a slower zoom,
 * dim. It gives the take its depth: when the camera moves, the far field slides behind.
 */
export function drawFar(parent, c, { alpha = 0.55 } = {}) {
	const k = 0.45
	const fc = { x: c.x * k, y: c.y * k, z: Math.pow(c.z, 0.55) * 0.55, px: c.px, py: c.py }
	const g = el('g', { transform: worldTf(fc) }, parent)
	const x0 = fc.x + (0 - fc.px) / fc.z, x1 = fc.x + (1920 - fc.px) / fc.z
	const y0 = fc.y + (0 - fc.py) / fc.z, y1 = fc.y + (1080 - fc.py) / fc.z
	const Rf = 2 * R, Sf = Rf + (2 * GAP) / SQRT3, px = Sf * SQRT3, py = Sf * 1.5
	for (let r = Math.floor(y0 / py) - 1; r <= Math.ceil(y1 / py) + 1; r++) {
		for (let q = Math.floor(x0 / px - r / 2) - 1; q <= Math.ceil(x1 / px - r / 2) + 1; q++) {
			const wx = px * (q + r / 2), wy = py * r
			const n = rand(q * 7919 + r * 104729)()
			if (n < 0.45) continue
			el('path', { d: hexPath(wx, wy, Rf, 2 * ROUND), fill: C.cobalt700, 'fill-opacity': (alpha * (0.35 + 0.4 * n)).toFixed(3) }, g)
		}
	}
	return g
}

/** The near veil: a handful of big faint hexes that pass in front, faster than the world (parallax 1.6). */
export function drawNear(parent, c, cells, { alpha = 0.07 } = {}) {
	const k = 1.6
	const nc = { x: c.x * k, y: c.y * k, z: c.z * 1.25, px: c.px, py: c.py }
	const g = el('g', { transform: worldTf(nc) }, parent)
	for (const [wx, wy, rr] of cells) el('path', { d: hexPath(wx, wy, rr, rr * 0.07), fill: C.cobalt400, 'fill-opacity': alpha }, g)
	return g
}

/* ------------------------------------------------------------ screens in cells */

const U = 2.5
const WIN = layout(1920, 1080).win // screen (940, 160) at 0.8: where the storyboard puts the window
/** The window mock's size in mock px (hookFrame: 720 CSS px wide at u 2.5), and its height here. */
export const MOCK_W = 720 * U
export const MOCK_H = 1150
/** The scale of a window inside a cell: the window's top-left sits at `at` (world) and its mock px are `ws` world units. */
export const WIN_S = 0.07

/**
 * The app window (general.js hookFrame's window, without the chrome): topbar, nav rail, the
 * page header and drawUI's content, at mock px from (0, 0). `paint` recolours the topbar.
 */
export function windowMock(g, drawUI, { app, st, topFill = C.cobalt900, header = true } = {}) {
	const FW = MOCK_W, FH = MOCK_H
	const win = clipped(g, 0, 0, FW, FH, 10 * U)
	rect(win, 0, 0, FW, FH, C.white)
	topbar(win, 0, 0, FW, U, { fill: topFill })
	const NW = WINDOW.nav * U
	nav(win, 0, 24 * U, NW, FH - 24 * U, U, { items: 7, active: 1 })
	const contentX = (WINDOW.nav + 14) * U
	const geom = { x: contentX, r: (720 - 187 - 14) * U, top: 24 * U, Y0: 0, u: U, anchor: { x: contentX, y: WINDOW.row1 }, visB: FH, st }
	rect(win, (720 - 187) * U, 24 * U, U, FH, C.cobalt100)
	if (header) {
		bar(win, geom.x, 95, 250, 35, C.cobalt)
		rect(win, geom.r - 95, 95, 95, 35, C.cobalt, 3 * U)
		rect(win, geom.r - 200, 95, 95, 35, C.white, 3 * U, { stroke: C.cobalt200, 'stroke-width': U })
	}
	drawUI(win, geom, st)
	return { geom, win }
}

/**
 * A screen placed in a cell: returns { at, s, key } where `key` is the camera that shows the window
 * exactly as the storyboard does (its top-left on screen at (940, 160), 0.8 screen px per mock px).
 * `off` shifts the window within its cell (world units) so the window's left sits inside the cell.
 */
export function screenIn(q, r, { off = [-58, -40], s = WIN_S } = {}) {
	const [cx, cy] = cellXY(q, r)
	const at = [cx + off[0], cy + off[1]]
	const z = WIN.s / s
	return { q, r, at, s, cell: [cx, cy], key: camOn(at[0], at[1], WIN.x, WIN.y, z) }
}

/** Draws a screen in world space (under a world-space group). The mock is clipped to its cell's hex until `open` reaches 1. */
export function drawScreen(g, sc, drawUI, { open = 1, app, st, topFill } = {}) {
	const grp = el('g', {}, g)
	if (open < 1) {
		const id = nextId('cellclip')
		const cp = el('clipPath', { id }, grp)
		el('path', { d: hexPath(sc.cell[0], sc.cell[1], R * lerp(0.92, 20, ease.inCubic(open)), ROUND) }, cp)
		grp.setAttribute('clip-path', `url(#${id})`)
	}
	const inner = el('g', { transform: `translate(${sc.at[0].toFixed(3)} ${sc.at[1].toFixed(3)}) scale(${sc.s})` }, grp)
	windowMock(inner, drawUI, { app, st, topFill })
	return inner
}

/** The app's tag on the window's anchor (hookFrame's appTag), in mock px inside the window group. */
export function windowTag(inner, app, { fill = C.cobalt, sx = 1 } = {}) {
	const a = { x: (WINDOW.nav + 14) * U, y: WINDOW.row1 }
	// hookFrame draws it on the stage at radius 44 over a 0.8 window: 55 mock px. Round 27: it flips in (sx), never scales.
	if (sx <= 0.001) return
	const t = el('g', flipTf(a.x, a.y, sx), inner)
	appTag(t, a.x, a.y, 55, app, { fill })
}

/* ------------------------------------------------------------ the current (Round 24 motif) */

/**
 * The current (Round 24, _lib/current.js drawWire): a square-cornered wire drawn from pts[0] as far as k (0..1 of
 * its length), its head a small pointy-top hex. In the body the head is Nextcloud cyan (the scene's key element
 * holds its one orange). Coordinates are those of the group it is drawn in; `w` and `spark` are in that space.
 */
export function current(g, pts, k, { w = CURRENT.width, spark = CURRENT.head, stroke = CURRENT.stroke, headColor = C.nextcloudCyan } = {}) {
	if (k <= 0) return null
	return drawWire(g, pts, Math.min(1, k), { stroke, width: w, head: true, headColor, headR: spark })
}

/** A short burst of sparks where a current lands (a powered element): three small hexes stepping out and off. */
export function powerBurst(g, x, y, s, { r = 10, reach = 40 } = {}) {
	if (s <= 0 || s >= 1) return
	for (let i = 0; i < 6; i++) {
		const a = (Math.PI / 3) * i + Math.PI / 6
		const d = reach * ease.outCubic(s)
		const rr = r * (1 - s)
		if (rr < 0.5) continue
		el('path', { d: hexPath(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, rr * 0.2), fill: i % 2 ? C.white : C.cobalt200 }, g)
	}
}

/* ------------------------------------------------------------ type */

/** A word-by-word build: each word rises out of its own clip box, one per `step`, from `at`; leaves upward from `leave`. */
export function wordBuild(parent, text, opts, { at, step = F(2.8), rise = F(5), leave = Infinity, exit = F(4), accent } = {}) {
	const group = el('g', {}, parent)
	const blk = textBlock(group, text, { ...opts, accent, clip: true })
	const d = (opts.size || 96) * 1.35
	return (t) => {
		if (t < at - 0.001 || t >= leave + exit) { group.setAttribute('display', 'none'); return }
		group.removeAttribute('display')
		blk.items.forEach((it, i) => {
			const r0 = at + i * step
			let dy = d * (1 - ease.brand(inv(r0, r0 + rise, t)))
			if (t >= leave) dy = -d * inv(leave, leave + exit, t) ** 2
			Math.abs(dy) > 1e-3 ? it.node.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`) : it.node.removeAttribute('transform')
		})
	}
}

/**
 * Round 27 (all films): a hex always FLIPS in, turning over as in the opening: its width goes to nothing and back,
 * the back face showing first, the front after the edge. Never a rotation, never a uniform pop or scale.
 *   flip(t, t0)   { u, front, sx } over FLIP seconds from t0
 *   flipIn(t, t0) the width of something that turns over from nothing (front face only)
 */
export const FLIP = F(6)
export function flip(t, t0, dur = FLIP) {
	const u = clamp((t - t0) / dur)
	return { u, front: u >= 0.5, sx: Math.abs(Math.cos(Math.PI * u)) }
}
export const flipIn = (t, t0, dur = FLIP / 2) => (t < t0 ? 0 : ease.outCubic(clamp((t - t0) / dur)))
export const flipTf = (x, y, sx) => (sx >= 0.9995 ? {} : { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${Math.max(sx, 0.001).toFixed(4)} 1) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})` })

/** Spring helpers. */
export const pop = (s, { freq = 2.8, zeta = 0.55 } = {}) => (s <= 0 ? 0 : spring(s, { freq, zeta }))
export { ease, inv, clamp, lerp, mix, spring, hexPath, el, textBlock, C, nextId, CURRENT, currentCues }
