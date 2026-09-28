/**
 * ConNext film, round 5 (storyboard A18): the body, one take, and its one camera.
 *
 * One honeycomb (boards/A18/world.js), one camera function of body time, no cuts
 * inside the body. The approved key frames (boards/A18/board.js CAM) are the
 * camera's rests, each exact at its key time; everything else is the camera
 * travelling between them and the world changing state on the grid. The UI inside
 * Filinq, Portaliq, Nextcloud and Hermiq, the lead's line diagram and the flow lane
 * are drawn in world space every frame, so a push only ever makes them bigger.
 *
 * The body runs from START.body (after the shared opening) for LEN.body; this scene
 * works in body time tb = t - START.body. Sound cues sit next to the motion that
 * causes them (film time). No bell anywhere (round 5): the badge is a click.
 *
 * Round 3's version is kept in the review folder (round5/round3-film/scenes/world.js).
 */
import { el } from '../../_lib/stage.js'
import { ease, spring, inv, clamp, lerp, bezier } from '../../_lib/core.js'
import { C } from '../../_lib/brand.js'
import { RING, SLOT, appCell, ghost, drawWorld, cellXY, camOn, R, hexDist } from '../boards/A18/world.js'
import { ROWS, WIN, contractPage, portalPhone, ncWindow, assistantDesk, flowLane, leadDiagram, ncHex, diagramX, DIAG } from '../boards/A18/ui.js'
import { CAM, DRIFT, ncFill } from '../boards/A18/board.js'
import { START, LEN, DIAGRAM } from '../boards/A18/timing.js'
import { rest, take, toScreen, W, H } from '../lib/camera.js'
import { T, SPB, S16, F, fq, on, within } from '../lib/grid.js'

const O = START.body

/* ------------------------------------------------------------ the camera */

const [PX, PY] = cellXY(0, 1) // Portaliq
const [NX, NY] = cellXY(1, 1) // Nextcloud
const TAP_AT = toScreen(CAM.s4, PX + 7.8, PY - 13.3)
const POP_AT = toScreen(CAM.s6, NX + WIN.pop.x + WIN.pop.w / 2, NY + WIN.pop.y + WIN.pop.h / 2)
const LEAD_AT = toScreen(CAM.s1, 0, 0)

/** The end of the take: the whole honeycomb, right of the (empty) type column. */
export const END = camOn(0, 0, 1250, 560, 0.72)
/** The ease of the first pull back: out of the drift slowly, so the caption has left before the ground moves much. */
const PULL = bezier(0.6, 0, 0.1, 1)

/** When each approved key frame is on screen, in body time: the rests are exact there. */
export const KEYS = { s1: T.key1, s2: T.key2, s3: T.key3, s4: T.key4, s5: T.keyFlows, s6: T.key6, s7: T.key7 }

export const rests = [
	rest(CAM.s1, T.key1, { k: DRIFT.s1, pivot: LEAD_AT }), // s1: a slow push about the lead
	rest(CAM.s2, T.key2, { k: -0.03, v: [-3, -2] }), // s2: the pull back drifts on
	rest(CAM.s3, T.key3, { k: 0.048, pivot: [960, 420] }), // s3: the long crawl into the contract
	rest(CAM.s4, T.key4, { k: 0.03, pivot: TAP_AT }), // s4: a slow push about the tap
	rest(CAM.s5, T.keyFlows, { k: 0.01, pivot: [1360, 700] }), // s5: nearly still while the flow is drawn
	rest(CAM.s6, T.key6, { k: 0.025, pivot: POP_AT }), // s6: drifting toward the popover
	rest(CAM.s7, T.key7, { k: DRIFT.s7 }), // s7: a slow push into the assistant
	rest(END, T.pullEnd[1], { k: -0.02 }), // the end: the whole honeycomb, easing back
]
const moves = [
	{ from: T.pull[0], to: T.pull[1], ease: PULL, blend: 'pivot' }, // from the diagram to the ring
	{ from: T.push[0], to: T.push[1], ease: ease.brand, blend: 'pivot' }, // push into Filinq
	{ from: T.hop1[0], to: T.hop1[1], ease: ease.snap, blend: 'fly', rho: 2.0 }, // hop east into Portaliq
	{ from: T.flowOut[0], to: T.flowOut[1], ease: ease.brand, blend: 'pivot' }, // pull up out of Portaliq to the lane
	{ from: T.pushNc[0], to: T.pushNc[1], ease: ease.brand, blend: 'pivot' }, // follow the edge up into Nextcloud
	{ from: T.hop3[0], to: T.hop3[1], ease: ease.snap, blend: 'fly', rho: 2.0 }, // hop east into the assistant
	{ from: T.pullEnd[0], to: T.pullEnd[0] + 0.72, ease: ease.brand, blend: 'pivot' }, // pull straight out past the ring
]
const bodyCamera = take(rests, moves)
/** The camera in film time (the captions glue to it). */
export const camera = (t) => bodyCamera(t - O)
export { bodyCamera }

/* ------------------------------------------------------------ springs */

const springFor = (zeta, D) => {
	const freq = (Math.PI - Math.acos(zeta)) / (2 * Math.PI * Math.sqrt(1 - zeta * zeta) * D)
	return (s) => spring(s, { freq, zeta })
}
const popSpring = (s) => (s <= 0 ? 0 : spring(s, { freq: 2.8, zeta: 0.55 }))

/* ------------------------------------------------------------ s1-s2: the lead, its diagram, the ring */

const NC_FLY_D = 0.3 // an app's flight arrives this long after it lifts
const NC_SETTLE = 0.72
const ncPos = springFor(0.78, NC_FLY_D)
const ncSize = springFor(0.62, NC_FLY_D)

/** The diagram's state at body time tb (s1 and the start of s2). */
function diagramState(tb, tq) {
	const drops = {}, pops = {}, hide = {}
	for (const id of DIAGRAM) {
		const t0 = T.drops[id]
		drops[id] = ease.outCubic(inv(t0 - S16, t0, tb))
		pops[id] = popSpring(tb - t0)
		if (tb >= T.fly[id]) hide[id] = true // in flight, drawn on top by the scene
	}
	return {
		trunk: ease.outCubic(inv(T.trunk[0], T.trunk[1], tb)),
		bus: ease.outCubic(inv(T.bus[0], T.bus[1], tb)),
		drops, pops, hide,
		retract: ease.inOutCubic(inv(T.retract[0], T.retract[1], tb)),
	}
}

/* ------------------------------------------------------------ the story row lands (round 3) */

const AX = { E: [1, 0], SW: [-0.5, Math.sqrt(3) / 2], SE: [0.5, Math.sqrt(3) / 2] }
const FROM = { '-1,1': 'SW', '0,1': 'SE', '1,1': 'E', '2,1': 'E' }
const FLY_D = 0.22
const FLY_SETTLE = 0.6
const OVER = 1.35
const flyPos = springFor(0.75, FLY_D)
const flyScale = springFor(0.6, FLY_D)
const ROW_START = (() => {
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
	return { rows, caretRow: within(tq, T.fill[2], T.hop1[1]) ? 2 : -1 }
}

const ECHO_OFF = T.key4 + 0.14
function phoneState(t, tq) {
	const press = t < T.tap - 0.05 ? 0 : t < T.tap ? ease.outCubic(inv(T.tap - 0.05, T.tap, t)) : 1 - ease.outCubic(inv(T.tap, T.tap + 0.2, t))
	return {
		press,
		echo: [within(tq, T.tap + F(1), ECHO_OFF), within(tq, T.tap + F(2), ECHO_OFF + F(1))],
		sig: ease.outCubic(inv(T.sig, T.sig + F(3), t)),
		accent: t < T.flowOut[1], // the signature is the one orange until the camera has pulled out to the lane
	}
}

/** The flow the customer draws (s5). */
function laneState(t, tq) {
	const lift = 0.35 * ease.brand(inv(T.lift, T.slot, t)) + 0.65 * ease.snap(inv(T.drop - 0.12, T.drop, t))
	return {
		trig: popSpring(t - T.trig),
		up: ease.outCubic(inv(T.trig + 0.06, T.trig + 0.26, t)),
		edge1: ease.outCubic(inv(T.edge1[0], T.edge1[1], t)),
		task: popSpring(t - T.task),
		card: popSpring(t - T.lift),
		edge2: t < T.lift ? 0 : lift >= 1 ? ease.outCubic(inv(T.drop, T.drop + 0.15, t)) : 1,
		lift,
		slot: on(tq, T.slot) ? 1 : 0,
		into: ease.outCubic(inv(T.into[0], T.into[1], t)),
		accent: true,
	}
}
/** The cells the flow does not touch step down to a fifth, and back up for the push (two-frame steps). */
function quietDim(tq) {
	const down = on(tq, T.flowOut[1]) && !on(tq, T.pushNc[0])
	if (!down) {
		if (on(tq, T.pushNc[0]) && !on(tq, T.pushNc[0] + F(2))) return 0.6
		return 1
	}
	if (!on(tq, T.flowOut[1] + F(2))) return 0.6
	return 0.22
}

function deskState(t) {
	const b = t - T.badge
	const badgeScale = b < 0 ? 0 : b < 0.07 ? 1.3 * ease.outCubic(b / 0.07) : 1 + 0.3 * (1 - spring(b - 0.07, { freq: 3.2, zeta: 0.5 }))
	return {
		badge: t < T.hop3[1],
		badgeScale,
		open: ease.brand(inv(T.badge, T.badge + 0.2, t)),
		slide: ease.brand(inv(T.notice, T.notice + 0.28, t)),
	}
}

function chatState(t) {
	const dots = t >= T.ask + 0.08 && t < T.answer ? [0, 1, 2].map((i) => -0.9 * Math.max(0, Math.sin(2 * Math.PI * ((t - T.ask) / (SPB / 2) - i * 0.2)))) : null
	const press = t < T.allow - 0.05 ? 0 : t < T.allow ? ease.outCubic(inv(T.allow - 0.05, T.allow, t)) : 1 - ease.outCubic(inv(T.allow, T.allow + 0.2, t))
	return {
		rail: ease.brand(inv(T.rail[0], T.rail[0] + 0.22, t)) + ease.brand(inv(T.rail[1], T.rail[1] + 0.22, t)),
		ask: ease.brand(inv(T.ask, T.ask + 0.16, t)),
		dots,
		grow: ease.brand(inv(T.answer, T.answer + 0.22, t)),
		rows: T.rows.reduce((a, tr) => a + ease.outCubic(inv(tr - 0.05, tr + 0.05, t)), 0),
		appr: ease.brand(inv(T.propose, T.propose + 0.22, t)),
		accent: t < T.allow, // the ring round Allow is the one orange until you press it
		press,
		done: ease.brand(inv(T.done, T.done + 0.22, t)),
	}
}

/* ------------------------------------------------------------ the end: step off, toward the lead */

/** Outer cells first, the lead last, once the pull out has settled; the lead is dark by the body's last frame. */
const STEP = [T.pullEnd[0] + 0.55, T.pullEnd[0] + 0.55 + S16, T.pullEnd[0] + 0.55 + 2 * S16]
function steppedOff(d, tq) {
	const s = STEP[Math.max(0, Math.min(2, 2 - Math.min(d, 2)))]
	if (!on(tq, s)) return null
	if (!on(tq, s + S16)) return { fill: C.cobalt200 }
	if (!on(tq, s + 2 * S16)) return { fill: C.cobalt800 }
	return ghost(d)
}

/* ------------------------------------------------------------ cell states */

function ringLook(k, t, tq, info, dim) {
	const id = RING[k]
	const o = dim < 1 && !['filinq', 'nextcloud'].includes(id) ? { dim } : {}
	if (id === 'filinq') return appCell(id, { keepGlyph: true, innerOver: true, ...o, inner: (g, wx, wy) => contractPage(g, wx, wy, contractState(t, tq)) })
	if (id === 'portaliq') return appCell(id, { ...o, inner: (g, wx, wy) => portalPhone(g, wx, wy, phoneState(t, tq)) })
	if (id === 'nextcloud') return appCell(id, { innerIn: [260, 460], fill: ncFill(info.sr), ...o, inner: (g, wx, wy) => ncWindow(g, wx, wy, deskState(t)) })
	if (id === 'hermiq') return appCell(id, { innerIn: [260, 460], ...o, inner: (g, wx, wy) => assistantDesk(g, wx, wy, chatState(t)) })
	return appCell(id, { active: k === '0,0' && within(tq, T.orange[0], T.orange[1]), ...o })
}

function look(info, t, tq, dim) {
	const { k, d } = info
	const id = RING[k]
	if (!id) return ghost(d)
	if (k === '0,0') {
		if (t < 0.4) return ghost(d) // the lead settles on the cut: drawn on top, see below
		return steppedOff(d, tq) || ringLook(k, t, tq, info, dim)
	}
	if (id.startsWith('nc-')) {
		if (t < T.fly[id] + NC_SETTLE) return ghost(d) // still in the diagram, or in flight
		return steppedOff(d, tq) || ringLook(k, t, tq, info, dim)
	}
	if (T.land[k] !== undefined && t < T.land[k] + FLY_SETTLE) return ghost(d)
	return steppedOff(d, tq) || ringLook(k, t, tq, info, dim)
}

/* ------------------------------------------------------------ the scene */

export function buildWorld(ctx) {
	const { cue: cueAbs } = ctx
	const cue = (tb, kind, o) => cueAbs(O + tb, kind, o)
	const layer = el('g', { 'data-layer': 'world' }, ctx.g)

	// s1: the lead settles on the cut; a light scratch as the line draws; a tick per app as it pops in, up the scale.
	cue(0, 'pluck', { freq: 587.33, gain: 0.2, decay: 0.6 })
	cue(T.trunk[0], 'whoosh', { dur: 0.5, from: 1800, to: 5200, panFrom: 0, panTo: 0, gain: 0.05, q: 3 })
	const dropNotes = { 'nc-mail': 1174.66, 'nc-files': 1318.51, 'nc-calendar': 1318.51, 'nc-talk': 1479.98, 'nc-deck': 1479.98, 'nc-contacts': 1760, 'nc-tasks': 1760 }
	const seen = new Set()
	for (const id of DIAGRAM) {
		const t0 = T.drops[id]
		cue(t0, 'tick', { freq: dropNotes[id], gain: seen.has(t0) ? 0.12 : 0.17, pan: clamp(diagramX(DIAGRAM.indexOf(id)) / 600, -0.7, 0.7) })
		seen.add(t0)
	}
	// s2: a whoosh as the apps lift into the ring, a tick as each lands; the story row; the lead turns orange.
	cue(T.fly['nc-mail'] - 0.05, 'whoosh', { dur: 0.8, from: 400, to: 2600, panFrom: 0.3, panTo: -0.2, gain: 0.16 })
	for (const id of DIAGRAM) cue(T.fly[id] + NC_FLY_D, 'tick', { freq: dropNotes[id] * 1.5, gain: 0.1, pan: clamp(cellXY(...SLOT[id].split(',').map(Number))[0] / 700, -0.7, 0.7) })
	cue(T.land['-1,1'], 'tick', { freq: 1975.53, gain: 0.17, pan: -0.3 })
	cue(T.land['1,1'], 'tick', { freq: 2349.32, gain: 0.17, pan: 0.6 })
	cue(T.orange[0] + 0.02, 'pluck', { freq: 740, gain: 0.24 })
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
	// s5: the pull up to the lane; a soft thud per node, a light scratch per edge, a swish as the step is picked up, a click as it drops.
	cue(T.flowOut[0] - 0.04, 'whoosh', { dur: 0.75, from: 3200, to: 500, panFrom: 0.4, panTo: -0.2, gain: 0.2 })
	cue(T.trig, 'kick', { gain: 0.16, pitch: 120, end: 60, decay: 0.16, click: 0.05 })
	cue(T.edge1[0], 'whoosh', { dur: 0.22, from: 2500, to: 6000, panFrom: -0.3, panTo: 0.1, gain: 0.05, q: 3 })
	cue(T.task, 'kick', { gain: 0.16, pitch: 120, end: 60, decay: 0.16, click: 0.05 })
	cue(T.lift, 'whoosh', { dur: 0.35, from: 900, to: 2600, panFrom: 0.1, panTo: 0.5, gain: 0.09 })
	cue(T.slot, 'tick', { freq: 1479.98, gain: 0.1, pan: 0.5 })
	cue(T.drop, 'click', { gain: 0.3, freq: 2400, pan: 0.5, seed: 62 })
	cue(T.into[0], 'pluck', { freq: 880, gain: 0.18, decay: 0.5, pan: 0.5 })
	// s6: the push up into Nextcloud; a crisp click as the badge pops (round 5: no bell); a soft tick as the notice slides in.
	cue(T.pushNc[0] - 0.05, 'whoosh', { dur: 0.95, from: 500, to: 4600, panFrom: 0.2, panTo: 0.5, gain: 0.22 })
	cue(T.badge, 'click', { gain: 0.32, freq: 2800, pan: 0.4, seed: 63 })
	cue(T.notice, 'tick', { freq: 1480, gain: 0.16, pan: 0.3 })
	// s7: the hop; soft thuds as the app blocks land, a click per switch; a pluck as the answer lands; a held note as the change waits;
	// a click as Allow presses, a resolving pluck as it lands.
	cue(T.hop3[0] - 0.06, 'whoosh', { dur: 0.7, from: 700, to: 5200, panFrom: -0.6, panTo: 0.7, gain: 0.24 })
	T.rail.forEach((t, i) => {
		cue(t, 'kick', { gain: 0.12, pitch: 130, end: 70, decay: 0.12, click: 0.04 })
		cue(t + S16, 'click', { gain: 0.12, freq: 3000, pan: -0.4, seed: 64 + i })
	})
	cue(T.ask, 'tick', { freq: 1318.51, gain: 0.12, pan: 0.4 })
	cue(T.answer, 'pluck', { freq: 880, gain: 0.2 })
	T.rows.forEach((t, i) => cue(t, 'tick', { freq: [1174.66, 1318.5][i], gain: 0.12, pan: -0.2 }))
	cue(T.propose, 'pluck', { freq: 987.77, gain: 0.2, decay: 1.2, index: 1.2 })
	cue(T.allow, 'click', { gain: 0.3, freq: 2600, pan: 0.2, seed: 66 })
	cue(T.done, 'pluck', { freq: 1174.66, gain: 0.22, decay: 0.6 })
	// the end: a riser into the pull out, a whoosh, a hat per ring as the honeycomb steps off toward the lead.
	cue(T.done + 0.3, 'riser', { dur: T.pullEnd[0] - T.done - 0.3, gain: 0.1, root: 45 })
	cue(T.pullEnd[0] - 0.05, 'whoosh', { dur: 0.8, from: 2800, to: 300, panFrom: 0.3, panTo: -0.3, gain: 0.2 })
	STEP.forEach((t, i) => cue(t, 'hat', { gain: 0.14, pan: [0.5, 0.2, -0.1][i], seed: 40 + i }))

	return (t) => {
		layer.replaceChildren()
		const tb = t - O
		const tq = fq(tb)
		const cam = bodyCamera(tb)
		const dim = quietDim(tq)
		const wg = drawWorld(layer, cam, (q, r, info) => look(info, tb, tq, dim))

		// s1: the lead settles from 0.85 on the cut, on top of the world.
		if (tb < 0.4) {
			const [lx, ly] = toScreen(cam, 0, 0)
			const s = 0.85 + 0.15 * spring(tb, { freq: 2.6, zeta: 0.6 })
			drawWorld(layer, { x: 0, y: 0, z: cam.z * s, px: lx, py: ly }, (qq, rr, info) => (info.k === '0,0' ? appCell('pipelinq') : null), { reach: 1 })
		}
		// s1-s2: the line diagram (in world space, under the same camera), then each app in flight on top.
		const lastLand = Math.max(...DIAGRAM.map((id) => T.fly[id])) + NC_SETTLE
		if (tb < lastLand) {
			const g = el('g', { transform: wg.getAttribute('transform') }, layer)
			leadDiagram(g, DIAGRAM, diagramState(tb, tq))
			for (const id of DIAGRAM) {
				const s0 = tb - T.fly[id]
				if (s0 < 0 || s0 >= NC_SETTLE) continue
				const [sx, sy] = [diagramX(DIAGRAM.indexOf(id)), DIAG.y]
				const [ex, ey] = cellXY(...SLOT[id].split(',').map(Number))
				const p = ncPos(s0)
				// It grows mostly once it has travelled, so neighbours lifting a sixteenth apart never overlap on the way up.
				const r = lerp(DIAG.r, R, clamp(ncSize(Math.max(0, s0 - 0.12)), 0, 1.08))
				ncHex(g, lerp(sx, ex, p), lerp(sy, ey, p), r, id)
			}
		}
		// s2: the story row flies in, on top (round 3).
		const ref = rests[1](tb)
		for (const k of Object.keys(T.land)) {
			const s0 = tb - (T.land[k] - FLY_D)
			if (s0 <= 0 || tb >= T.land[k] + FLY_SETTLE) continue
			const [q, r] = k.split(',').map(Number)
			const [wx, wy] = cellXY(q, r)
			const [slx, sly] = toScreen(cam, wx, wy)
			const [x0, y0] = ROW_START[k]
			const pp = flyPos(s0)
			const z = lerp(ref.z, cam.z, clamp(pp)) * lerp(OVER, 1, flyScale(s0))
			drawWorld(layer, { x: wx, y: wy, z, px: lerp(x0, slx, pp), py: lerp(y0, sly, pp) }, (qq, rr, info) => (info.k === k ? ringLook(k, tb, tq, info, 1) : null), { reach: 3 })
		}
		// s5: the flow lane, while it is in view (from the pull up until the push has gone past it).
		if (tb >= T.flowOut[0] && tb < T.pushNc[1]) {
			const g = el('g', { transform: wg.getAttribute('transform') }, layer)
			flowLane(g, laneState(tb, tq))
		}
	}
}

/** For the checks: the world under a screen point, at film time t. */
export function groundAt(t, sx, sy) {
	const c = camera(t)
	const wx = c.x + (sx - c.px) / c.z
	const wy = c.y + (sy - c.py) / c.z
	const S = R + 16 / Math.sqrt(3)
	const qf = ((Math.sqrt(3) / 3) * wx - wy / 3) / S
	const rf = ((2 / 3) * wy) / S
	let q = Math.round(qf), r = Math.round(rf), s = Math.round(-qf - rf)
	const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s + qf + rf)
	if (dq > dr && dq > ds) q = -r - s
	else if (dr > ds) r = -q - s
	const [cx, cy] = cellXY(q, r)
	const ax = Math.abs(wx - cx), ay = Math.abs(wy - cy)
	const inside = ax <= (Math.sqrt(3) / 2) * R && ay <= R - ax / Math.sqrt(3)
	return { k: `${q},${r}`, d: hexDist(q, r), inside, z: c.z }
}
