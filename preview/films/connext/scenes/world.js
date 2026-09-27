/**
 * ConNext film, direction A ("One take"), 16:9: the world and its one camera.
 *
 * One honeycomb (boards/A16/world.js), one camera function of t, no cuts.
 * The approved key frames (boards/A16/board.js CAM) are the camera's rests,
 * each exact at its key time; everything else is the camera travelling
 * between them and the cells changing state on the grid. The UI inside
 * Filinq, Portaliq, Nextcloud and Hermiq is drawn in world space every frame
 * (boards/A16/ui.js, with its in-between states), so a push only ever makes
 * it bigger.
 *
 * Sound cues sit next to the motion that causes them.
 */
import { el } from '../../_lib/stage.js'
import { ease, spring, inv, clamp, lerp, bezier } from '../../_lib/core.js'
import { C } from '../../_lib/brand.js'
import { RING, WIDER, appCell, ghost, drawWorld, cellXY, R, hexDist } from '../boards/A16/world.js'
import { ROWS, DESK, contractPage, portalPhone, ncDesk, assistantChat } from '../boards/A16/ui.js'
import { CAM, DRIFT } from '../boards/A16/board.js'
import { DURATION } from '../boards/A16/timing.js'
import { rest, take, toScreen, W, H } from '../lib/camera.js'
import { T, SPB, S16, F, fq, on, within } from '../lib/grid.js'

/* ------------------------------------------------------------ the camera */

const [PX, PY] = cellXY(0, 1) // Portaliq
const [NX, NY] = cellXY(1, 1) // Nextcloud
/** Screen pivots of the slow pushes: the sign button's tap point, the popover's centre. */
const TAP_AT = toScreen(CAM.s4, PX + 7.8, PY - 13.3)
const POP_AT = toScreen(CAM.s5, NX + DESK.pop.x + DESK.pop.w / 2, NY + DESK.pop.y + DESK.pop.h / 2)

/** The push eases out of its slow drift before it pulls back, so the opener has left before the ground moves. */
const PULL = bezier(0.6, 0, 0.1, 1)

/** When each approved key frame is on screen: the rests are exact there. */
export const KEYS = { s1: 0, s2: T.key2, s3: T.key3, s4: T.key4, s5: T.key5, s6: T.key6, s6b: T.key6b, s7: T.key7, s8: T.key8 }

export const rests = [
	rest(CAM.s1, 0, { k: DRIFT.loop }), // s1: already pushing in on frame 1, about the client
	rest(CAM.s2, T.key2, { k: -0.03, v: [-3, -2] }), // s2: the pull back drifts on
	rest(CAM.s3, T.key3, { k: 0.048, pivot: [960, 420] }), // s3: the long crawl into the contract (11.3 to 12 by the caret)
	rest(CAM.s4, T.key4, { k: 0.03, pivot: TAP_AT }), // s4: a slow push about the tap
	rest(CAM.s5, T.key5, { k: 0.025, pivot: POP_AT }), // s5: drifting toward the popover
	rest(CAM.s6, T.key6, { k: DRIFT.s6 }), // s6: a slow push into the chat, across both captions
	rest(CAM.s7, T.key7, { k: -0.02 }), // s7: the whole honeycomb, easing back
	rest(CAM.s1, DURATION, { k: DRIFT.loop }), // s8: frame 1's picture, pushing at frame 1's speed
]
const moves = [
	{ from: T.pull[0], to: T.pull[1], ease: PULL, blend: 'pivot' }, // the push turns into the pull back
	{ from: T.push[0], to: T.push[1], ease: ease.brand, blend: 'pivot' }, // push into Filinq
	{ from: T.hop1[0], to: T.hop1[1], ease: ease.snap, blend: 'fly', rho: 2.0 }, // hop east over the wall, into Portaliq
	{ from: T.hop2[0], to: T.hop2[1], ease: ease.snap, blend: 'fly', rho: 2.0 }, // into Nextcloud
	{ from: T.hop3[0], to: T.hop3[1], ease: ease.snap, blend: 'fly', rho: 2.0 }, // into Hermiq
	{ from: T.pullOut[0], to: T.pullOut[1], ease: ease.brand, blend: 'pivot' }, // pull straight out past the ring
	{ from: T.pushIn[0], to: T.pushIn[1], ease: ease.brand, blend: 'pivot' }, // push back in on the lone client
]
export const camera = take(rests, moves)

/* ------------------------------------------------------------ the ring lands */

/** Honeycomb axes in screen space (pointy-top): a cell flies in along one of them. */
const AX = { E: [1, 0], NE: [0.5, -Math.sqrt(3) / 2], NW: [-0.5, -Math.sqrt(3) / 2], SW: [-0.5, Math.sqrt(3) / 2], SE: [0.5, Math.sqrt(3) / 2] }
/** From the nearest frame edge that is not the type column: the left column never sees a cell fly. */
const FROM = { '0,-1': 'NE', '1,-1': 'E', '1,0': 'E', '-1,0': 'NW', '-1,1': 'SW', '0,1': 'SE', '1,1': 'E', '2,1': 'E' }
const TICK = { '0,-1': 1175, '1,-1': 1319, '1,0': 1480, '-1,0': 1760, '-1,1': 1976, '0,1': 1976, '1,1': 2349, '2,1': 2349 }
const PAN = { '0,-1': 0.1, '1,-1': 0.5, '1,0': 0.5, '-1,0': -0.2, '-1,1': -0.3, '0,1': 0.3, '1,1': 0.6, '2,1': 0.6 }

/** A damped spring whose first arrival at 1 takes D seconds. */
const springFor = (zeta, D) => {
	const freq = (Math.PI - Math.acos(zeta)) / (2 * Math.PI * Math.sqrt(1 - zeta * zeta) * D)
	return (s) => spring(s, { freq, zeta })
}
const FLY_D = 0.22
const FLY_SETTLE = 0.6
const OVER = 1.35 // oversize at the start of the flight
const flyPos = springFor(0.75, FLY_D) // travel: arrives on the sixteenth, barely overshoots the slot
const flyScale = springFor(0.6, FLY_D) // size: the pop (zeta 0.6), a few percent under 1 and back

/**
 * Where each flight starts: off frame along its axis, measured in the ring's own framing (the s2 key
 * camera), so a cell never starts inside the frame. Cells that land together along the same axis travel
 * as one train (Nextcloud and Hermiq along the story row), so they never overlap in flight.
 */
const START = (() => {
	const reach = {}
	for (const k of Object.keys(FROM)) {
		const [q, r] = k.split(',').map(Number)
		const [sx, sy] = toScreen(CAM.s2, ...cellXY(q, r))
		const [dx, dy] = AX[FROM[k]]
		const rad = R * CAM.s2.z * OVER + 12
		let L = 0
		while (L < 4000 && sx + dx * L - rad < W && sx + dx * L + rad > 0 && sy + dy * L - rad < H && sy + dy * L + rad > 0) L += 4
		const group = `${T.land[k]}|${FROM[k]}`
		reach[group] = Math.max(reach[group] || 0, L)
	}
	const out = {}
	for (const k of Object.keys(FROM)) {
		const [q, r] = k.split(',').map(Number)
		const [sx, sy] = toScreen(CAM.s2, ...cellXY(q, r))
		const [dx, dy] = AX[FROM[k]]
		const L = reach[`${T.land[k]}|${FROM[k]}`]
		out[k] = [sx + dx * L, sy + dy * L]
	}
	return out
})()

/* ------------------------------------------------------------ the UI in motion */

/** Filinq: each value arrives next to the Pipelinq glyph of the client it came from; the amount types, a digit a sixteenth. */
function contractState(t, tq) {
	const chip = (t0) => spring(t - (t0 - 0.06), { freq: 3.2, zeta: 0.55 })
	const grow = (t0, w) => w * ease.brand(inv(t0, t0 + 0.28, t))
	let amount = 0
	for (let j = 0; j < 5; j++) if (on(tq, T.fill[2] + j * S16)) amount = (ROWS[2].w * (j + 1)) / 5
	const rows = [
		{ chip: chip(T.fill[0]), width: grow(T.fill[0], ROWS[0].w) },
		{ chip: chip(T.fill[1]), width: grow(T.fill[1], ROWS[1].w) },
		{ chip: chip(T.fill[2]), width: amount },
	]
	// The caret is the one orange from the first digit until the camera has landed in Portaliq (Filinq is off frame by then).
	return { rows, caretRow: within(tq, T.fill[2], T.hop1[1]) ? 2 : -1 }
}

const ECHO_OFF = T.key4 + 0.14
/** Portaliq: the press, the two tap outlines stepping out a frame apart, the signature drawn in over three frames. */
function phoneState(t, tq) {
	const press = t < T.tap - 0.05 ? 0 : t < T.tap ? ease.outCubic(inv(T.tap - 0.05, T.tap, t)) : 1 - ease.outCubic(inv(T.tap, T.tap + 0.2, t))
	return {
		press,
		echo: [within(tq, T.tap + F(1), ECHO_OFF), within(tq, T.tap + F(2), ECHO_OFF + F(1))],
		sig: ease.outCubic(inv(T.sig, T.sig + F(3), t)),
		accent: t < T.hop2[1], // the signature stays the one orange until the camera has landed in Nextcloud
	}
}

/** Nextcloud: the badge pops (1.3x and settle), the popover drops open, the new notice slides in on top. */
function deskState(t) {
	const b = t - T.badge
	const badgeScale = b < 0 ? 0 : b < 0.07 ? 1.3 * ease.outCubic(b / 0.07) : 1 + 0.3 * (1 - spring(b - 0.07, { freq: 3.2, zeta: 0.5 }))
	return {
		badge: t < T.hop3[1], // the one orange until the camera has landed in Hermiq
		badgeScale,
		open: ease.brand(inv(T.badge, T.badge + 0.2, t)),
		slide: ease.brand(inv(T.notice, T.notice + 0.28, t)),
	}
}

/** Hermiq: typing dots while the camera lands, the answer grows, its rows land a sixteenth apart, then the approval. */
function chatState(t) {
	const dots = t < T.answer ? [0, 1, 2].map((i) => -0.9 * Math.max(0, Math.sin(2 * Math.PI * ((t - T.hop3[0]) / (SPB / 2) - i * 0.2)))) : null
	const rows = T.rows.reduce((a, tr) => a + ease.outCubic(inv(tr - 0.05, tr + 0.05, t)), 0)
	return {
		dots,
		grow: ease.brand(inv(T.answer, T.answer + 0.22, t)),
		rows,
		appr: ease.brand(inv(T.approval, T.approval + 0.22, t)),
		accent: t < T.ctaIn, // the pending pip hands the orange to the install call (Hermiq is a few pixels wide by then)
	}
}

function ringLook(k, t, tq) {
	const id = RING[k]
	if (id === 'filinq') return appCell(id, { keepGlyph: true, innerOver: true, inner: (g, wx, wy) => contractPage(g, wx, wy, contractState(t, tq)) })
	if (id === 'portaliq') return appCell(id, { inner: (g, wx, wy) => portalPhone(g, wx, wy, phoneState(t, tq)) })
	if (id === 'nextcloud') return appCell(id, { innerIn: [260, 460], inner: (g, wx, wy) => ncDesk(g, wx, wy, deskState(t)) })
	if (id === 'hermiq') return appCell(id, { innerIn: [260, 460], inner: (g, wx, wy) => assistantChat(g, wx, wy, chatState(t)) })
	return appCell(id)
}

/* ------------------------------------------------------------ the end: ripple on, step off */

/** The ring a lit cell steps off with: the outer cells first, the first ring last, the client stays. */
const stepAt = (d) => T.step[Math.max(0, 3 - d)]
function steppedOff(d, tq) {
	const s = stepAt(d)
	if (!on(tq, s)) return null
	if (!on(tq, s + S16)) return { fill: C.cobalt200 } // flashes pale for a step
	if (!on(tq, s + 2 * S16)) return { fill: C.cobalt800 } // dims for a step
	return ghost(d) // settles to the resting dark cell
}
const RIPPLE = Object.fromEntries(Object.keys(WIDER).map((k, i) => [k, T.ripple[i]]))

/* ------------------------------------------------------------ cell states */

function look(info, t, tq) {
	const { k, d } = info
	if (k === '0,0') return appCell('pipelinq', { active: within(tq, T.orange[0], T.orange[1]) })
	if (RING[k]) {
		if (t < T.land[k] + FLY_SETTLE) return ghost(d) // in flight: drawn on top, see below
		return steppedOff(d, tq) || ringLook(k, t, tq)
	}
	if (WIDER[k]) {
		if (!on(tq, RIPPLE[k])) return ghost(d)
		if (!on(tq, RIPPLE[k] + F(2))) return { fill: C.cobalt200 } // ripples on through a pale step
		return steppedOff(d, tq) || appCell(WIDER[k])
	}
	return ghost(d)
}

/* ------------------------------------------------------------ the scene */

export function buildWorld(ctx) {
	const { cue } = ctx
	const layer = el('g', { 'data-layer': 'world' }, ctx.g)

	// s1 -> s2: the pull back, and the ring landing on the sixteenths, pitched up the scale (the pairs doubled, panned apart).
	cue(1.86, 'whoosh', { dur: 0.95, from: 350, to: 2600, panFrom: 0.4, panTo: -0.4, gain: 0.2 })
	const doubled = new Set()
	for (const k of Object.keys(T.land)) {
		const t = T.land[k]
		cue(t, 'tick', { freq: TICK[k], pan: PAN[k], gain: doubled.has(t) ? 0.13 : 0.18 })
		doubled.add(t)
	}
	cue(T.orange[0] + 0.02, 'pluck', { freq: 740, gain: 0.24 }) // the client turns orange as the ring closes
	// s3: the push into Filinq; three rising plucks as the rows fill, soft ticks as the digits type, a tick as the caret lands.
	cue(T.push[0] - 0.1, 'whoosh', { dur: 0.9, from: 500, to: 4200, panFrom: 0.3, panTo: -0.4, gain: 0.22 })
	T.fill.forEach((t, i) => cue(t, 'pluck', { freq: [587.33, 739.99, 880][i], gain: 0.24 }))
	for (let j = 1; j < 4; j++) cue(T.fill[2] + j * S16, 'tick', { freq: 2637, gain: 0.06, decay: 0.03, pan: 0.2 })
	cue(T.amountLands, 'tick', { freq: 2349, gain: 0.14, decay: 0.05 })
	// s4: the hop east; a riser into the tap; impact and a bright pluck on it; a tick as the signature lands.
	cue(T.hop1[0] - 0.06, 'whoosh', { dur: 0.72, from: 700, to: 5200, panFrom: -0.6, panTo: 0.7, gain: 0.25 })
	cue(T.hop1[1], 'riser', { dur: T.tap - T.hop1[1], gain: 0.13, root: 50 })
	cue(T.tap, 'impact', { gain: 0.45, from: 110, to: 40, decay: 0.8 })
	cue(T.tap, 'pluck', { freq: 1174.66, gain: 0.28, decay: 0.5 })
	cue(T.sig, 'tick', { freq: 1760, gain: 0.18 })
	// s5: the hop; a small bell as the badge pops; a tick as the notice slides in.
	cue(T.hop2[0] - 0.06, 'whoosh', { dur: 0.78, from: 700, to: 5200, panFrom: -0.6, panTo: 0.7, gain: 0.24 })
	cue(T.badge, 'bell', { freq: 1318.5, gain: 0.14, decay: 0.45, pan: 0.4 })
	cue(T.notice, 'tick', { freq: 1480, gain: 0.16, pan: 0.3 })
	// s6: the hop; a soft pluck as the answer lands, a tick per row; a held note as the approval waits.
	cue(T.hop3[0] - 0.06, 'whoosh', { dur: 0.7, from: 700, to: 5200, panFrom: -0.6, panTo: 0.7, gain: 0.24 })
	cue(T.answer, 'pluck', { freq: 880, gain: 0.2 })
	T.rows.forEach((t, i) => cue(t, 'tick', { freq: [1174.66, 1318.5, 1480][i], gain: 0.13, pan: -0.2 }))
	cue(T.approval, 'pluck', { freq: 987.77, gain: 0.2, decay: 1.2, index: 1.2 })
	// s7: a riser into the pull out, the whoosh, a fast run of ticks as the extra apps ripple on.
	cue(14.5, 'riser', { dur: T.pullOut[0] - 14.5, gain: 0.12, root: 45 })
	cue(T.pullOut[0] - 0.05, 'whoosh', { dur: 0.9, from: 2800, to: 300, panFrom: 0.3, panTo: -0.3, gain: 0.22 })
	T.ripple.forEach((t, i) => cue(t, 'tick', { freq: [1480, 1760, 1976, 2349][i], gain: 0.15, pan: [-0.1, 0.2, 0.4, 0.3][i] }))
	// s8: the bell (the sonic logo) on bar 10 as the rings step off, a hat per ring; a soft whoosh into the push back in.
	cue(T.step[0], 'bell', { freq: 587.33, gain: 0.3, decay: 1.8 })
	T.step.forEach((t, i) => cue(t, 'hat', { gain: 0.16, pan: [0.5, 0.2, -0.1][i], seed: 40 + i }))
	cue(T.pushIn[0], 'whoosh', { dur: 0.8, from: 1800, to: 400, panFrom: -0.2, panTo: 0.2, gain: 0.1 })

	return (t) => {
		layer.replaceChildren()
		const tq = fq(t)
		const cam = camera(t)
		drawWorld(layer, cam, (q, r, info) => look(info, t, tq))

		// Cells in flight, on top of the world. Size follows the ring's own framing (the s2 rest) and blends into the
		// live slot's size as it lands, so a cell never balloons while the camera is still pulling back.
		const ref = rests[1](t)
		for (const k of Object.keys(T.land)) {
			const s0 = t - (T.land[k] - FLY_D)
			if (s0 <= 0 || t >= T.land[k] + FLY_SETTLE) continue
			const [q, r] = k.split(',').map(Number)
			const [wx, wy] = cellXY(q, r)
			const [slx, sly] = toScreen(cam, wx, wy)
			const [x0, y0] = START[k]
			const pp = flyPos(s0)
			const z = lerp(ref.z, cam.z, clamp(pp)) * lerp(OVER, 1, flyScale(s0))
			drawWorld(layer, { x: wx, y: wy, z, px: lerp(x0, slx, pp), py: lerp(y0, sly, pp) }, (qq, rr, info) => (info.k === k ? ringLook(k, t, tq) : null), { reach: 3 })
		}
	}
}

/** For the checks: the world under a screen point (which cell, and whether the point is inside its hex). */
export function groundAt(t, sx, sy) {
	const c = camera(t)
	const wx = c.x + (sx - c.px) / c.z
	const wy = c.y + (sy - c.py) / c.z
	// axial rounding (pointy-top, cell size R + gap)
	const S = R + 16 / Math.sqrt(3)
	const qf = ((Math.sqrt(3) / 3) * wx - wy / 3) / S
	const rf = ((2 / 3) * wy) / S
	let q = Math.round(qf), r = Math.round(rf), s = Math.round(-qf - rf)
	const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s + qf + rf)
	if (dq > dr && dq > ds) q = -r - s
	else if (dr > ds) r = -q - s
	const [cx, cy] = cellXY(q, r)
	// inside the (unrounded) hex of circumradius R?
	const ax = Math.abs(wx - cx), ay = Math.abs(wy - cy)
	const inside = ax <= (Math.sqrt(3) / 2) * R && ay <= R - ax / Math.sqrt(3)
	return { k: `${q},${r}`, d: hexDist(q, r), inside, z: c.z }
}
