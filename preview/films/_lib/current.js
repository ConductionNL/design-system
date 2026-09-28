/**
 * The current: Conduction's recurring motif (Round 24, Ruben, 2026-09-28).
 *
 * One square-cornered wire with a travelling current, the look and sound of the install board's
 * "current" concept. It is born in the Conduction opening (the frame's centre, where the name powered
 * on), carries each body hand-off from the outgoing scene's key element to the next one's and powers it
 * on, runs the Built on connectors and powers the install words (both in scenes/closing.js).
 *
 * Rules it keeps by construction:
 *   - one wire at a time: a scene draws only its incoming wire;
 *   - one orange at a time: the head is orange only where the scene has no orange of its own; in the
 *     body (where the key element is the scene's orange) it is Nextcloud cyan, which reads on the white
 *     app window and on the cobalt ground alike;
 *   - inside the safe box and clear of the caption column (x 120 to 880 between y 250 and 640): a
 *     route that would cross it goes round it on the right;
 *   - clicks, never a bell.
 *
 * Self-contained: imports only the engine (stage, core, brand).
 *
 *   route(from, to)                    the square-cornered points from one point to another
 *   drawWire(g, pts, k, opts)          the wire drawn to progress k (0..1), its head where it has got to
 *   keyElement(g, opts)                the scene's key element in stage px: the centre of its orange
 *                                      (the scene's answer), or null
 *   boardCurrent(g, { from, to, ... }) the still: the wire arrived, the head on the element, a thin ring
 *   sceneCurrent(g, t, { from, to })   the scene: the wire runs in (0 to RUN s), the element powers on
 *   currentCues(cue, t0, opts)         the sound of one run: a crackle along it, an arc and a click on
 *                                      arrival
 */
import { el } from './stage.js'
import { hexPath, ease, spring, inv, lerp } from './core.js'
import { C } from './brand.js'

export const CURRENT = {
	stroke: C.cobalt300, width: 5, head: 11,
	run: 0.42, // seconds for a hand-off to run from one element to the next
	safe: { x0: 120, y0: 96, x1: 1800, y1: 930 },
	caption: { x0: 100, y0: 250, x1: 880, y1: 640 }, // the type column's caption band: never crossed
	origin: [960, 540], // the frame's centre: where the opening powers on, where the current is born
}

const clampPt = ([x, y]) => [Math.min(Math.max(x, CURRENT.safe.x0), CURRENT.safe.x1), Math.min(Math.max(y, CURRENT.safe.y0), CURRENT.safe.y1)]
const crossesCaption = (a, b) => {
	const K = CURRENT.caption
	const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])], [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])]
	return x1 >= K.x0 && x0 <= K.x1 && y1 >= K.y0 && y0 <= K.y1
}

/** Square-cornered points from `from` to `to`: across then down, or down then across, whichever keeps clear of the caption band. */
export function route(from, to) {
	const a = clampPt(from), b = clampPt(to)
	const tries = [[a, [b[0], a[1]], b], [a, [a[0], b[1]], b]]
	for (const pts of tries) if (!pts.slice(1).some((p, i) => crossesCaption(pts[i], p))) return pts
	// Round the caption band on the right: out to x 920, along, and in.
	const x = Math.max(CURRENT.caption.x1 + 40, 920)
	return [a, [x, a[1]], [x, b[1]], b]
}

/** The polyline drawn to progress k; returns the head's position. */
export function drawWire(g, pts, k, { stroke = CURRENT.stroke, width = CURRENT.width, head = true, headColor = C.white, headR = CURRENT.head } = {}) {
	if (k <= 0 || pts.length < 2) return null
	const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
	const total = lens.reduce((a, v) => a + v, 0)
	let left = total * Math.min(1, k), d = `M${pts[0][0]} ${pts[0][1]}`, hx = pts[0][0], hy = pts[0][1]
	for (let i = 0; i < lens.length && left > 0; i++) {
		const u = Math.min(1, left / lens[i])
		hx = lerp(pts[i][0], pts[i + 1][0], u)
		hy = lerp(pts[i][1], pts[i + 1][1], u)
		d += `L${hx.toFixed(1)} ${hy.toFixed(1)}`
		left -= lens[i]
	}
	el('path', { d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt', 'data-current': 'wire' }, g)
	// The spark: a small pointy-top hex at the head, never rotated.
	if (head) el('path', { d: hexPath(hx, hy, headR, headR * 0.2), fill: headColor, 'data-current': 'head' }, g)
	return [hx, hy]
}

/**
 * The scene's key element: the centre of its orange (by the house rules, the scene's one orange is its
 * answer, the thing the caption is about). Stage px, measured from the rendered SVG. `exclude` lists
 * points whose orange does not count (the app tag on the loop anchor, unless it is all there is).
 */
export function keyElement(g, { exclude = [], orange = C.orange } = {}) {
	const svg = g.ownerSVGElement
	if (!svg) return null
	const box = svg.getBoundingClientRect()
	const vb = svg.viewBox?.baseVal
	const k = vb && vb.width ? vb.width / box.width : 1
	const hits = []
	for (const e of g.querySelectorAll('*')) {
		const f = (e.getAttribute('fill') || '').toUpperCase(), s = (e.getAttribute('stroke') || '').toUpperCase()
		if (f !== orange.toUpperCase() && s !== orange.toUpperCase()) continue
		if (e.closest('[data-current]')) continue
		const r = e.getBoundingClientRect()
		if (!r.width && !r.height) continue
		hits.push({ x: (r.left + r.width / 2 - box.left) * k, y: (r.top + r.height / 2 - box.top) * k, w: r.width * k, h: r.height * k })
	}
	const far = hits.filter((h) => !exclude.some(([x, y]) => Math.hypot(h.x - x, h.y - y) < 70))
	const pick = (far.length ? far : hits).sort((a, b) => b.w * b.h - a.w * a.h)[0]
	return pick ? { x: pick.x, y: pick.y, w: pick.w, h: pick.h, hasOrange: hits.length > 0 } : null
}

/** Where a wire meets an element: its left edge, or its top edge when it comes from above. */
export function landing(el0, from) {
	const [fx, fy] = from
	if (!el0) return null
	if (Math.abs(fy - el0.y) > Math.abs(fx - el0.x) && fy < el0.y) return [el0.x, el0.y - el0.h / 2 - 6]
	return [el0.x - el0.w / 2 - 6, el0.y]
}

/** The still: the wire has arrived at the element, its head resting on the element's edge, a thin ring round the element. */
export function boardCurrent(g, { from, to, element = null, headColor = C.white } = {}) {
	const wg = el('g', { 'data-current': 'board' }, g)
	const pts = route(from, to)
	drawWire(wg, pts, 1, { headColor })
	// A thin ring only round a compact element (a cell, a button); a wide one is lit by the head alone.
	if (element && Math.max(element.w, element.h) <= 140) {
		const r = Math.max(element.w, element.h) / 2 + 14
		el('path', { d: hexPath(element.x, element.y, r, 6), fill: 'none', stroke: headColor, 'stroke-width': 2, opacity: 0.7, 'data-current': 'ring' }, wg)
	}
	return pts
}

/** The scene (local time t): the wire runs in over CURRENT.run, then rests; the element pulses once on arrival. */
export function sceneCurrent(g, t, { from, to, element = null, headColor = C.white, t0 = 0 } = {}) {
	const wg = el('g', { 'data-current': 'scene' }, g)
	const pts = route(from, to)
	const k = ease.inOutCubic(inv(t0, t0 + CURRENT.run, t))
	drawWire(wg, pts, k, { headColor, head: k > 0 })
	if (element && Math.max(element.w, element.h) <= 140 && t >= t0 + CURRENT.run) {
		const p = 1 - spring(t - t0 - CURRENT.run, { freq: 3.2, zeta: 0.5 })
		const r = Math.max(element.w, element.h) / 2 + 14 + 10 * p
		el('path', { d: hexPath(element.x, element.y, Math.min(r, 100), 6), fill: 'none', stroke: headColor, 'stroke-width': 2, opacity: (0.55 + 0.35 * p).toFixed(3), 'data-current': 'ring' }, wg)
	}
	return pts
}

/** The sound of one run: a crackle along the wire, an arc and a dry click as it arrives. */
export function currentCues(cue, t0, { pan = 0.3, gain = 1 } = {}) {
	cue(t0, 'crackle', { dur: CURRENT.run, density: 60, gain: 0.06 * gain, pan })
	cue(t0 + CURRENT.run, 'arc', { gain: 0.12 * gain, pan })
	cue(t0 + CURRENT.run, 'click', { gain: 0.2 * gain, freq: 2800, seed: 91, dry: true, pan })
}
