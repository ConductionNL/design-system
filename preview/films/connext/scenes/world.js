/**
 * ConNext film, round 6 (storyboard A19): the body, one take, and its one camera.
 *
 * One honeycomb (boards/A19/world.js), one camera function of body time, no cuts
 * inside the body. The approved key frames (boards/A19/board.js CAM) are the
 * camera's rests, each exact at its key time; everything else is the camera
 * travelling between them and the world changing state on the grid. The UI inside
 * Filinq, Portaliq, Nextcloud and Hermiq, the lead's links and the flow lane are
 * drawn in world space every frame, so a push only ever makes them bigger.
 *
 * The body runs from START.body (after the shared opening) for LEN.body; this scene
 * works in body time tb = t - START.body. Sound cues sit next to the motion that
 * causes them (film time). No bell anywhere; accents are clicks, dry where they must
 * stay a click (score.mjs dry: true).
 *
 * The round-5 version is kept in the review folder (round6/round5-film/scenes/world.js).
 */
import { el } from '../../_lib/stage.js'
import { ease, spring, inv, clamp, lerp, bezier } from '../../_lib/core.js'
import { C } from '../../_lib/brand.js'
import { RING, SLOT, STORY, appCell, ghost, drawWorld, cellXY, camOn, R, hexDist } from '../boards/A19/world.js'
import { ROWS, WIN, contractPage, portalPhone, ncWindow, ncNotify, assistantDesk, flowLane, leadLinks, linkRoute } from '../boards/A19/ui.js'
import { CAM, DRIFT, ncFill, flowLift } from '../boards/A19/board.js'
import { START, LEN, LOADS, LINK_DUR } from '../boards/A19/timing.js'
import { HANDOVER } from '../../_lib/scenes/opening.js'
import { rest, take, toScreen, W, H } from '../lib/camera.js'
import { T, SPB, S16, F, fq, on, within } from '../lib/grid.js'

const O = START.body

/* ------------------------------------------------------------ the camera */

const [PX, PY] = cellXY(...STORY.portaliq)
const [NX, NY] = cellXY(...STORY.nextcloud)
const TAP_AT = toScreen(CAM.s4, PX + 7.8, PY - 13.3)
const LEAD_AT = toScreen(CAM.s1, 0, 0)
const NOTE_AT = toScreen(CAM.s6, NX + 6, NY + 4)

/**
 * The handover (coordinator, round 6): the opening's last frame is a plain field, this world at
 * zoom 0.85 cell for cell (HANDOVER: circumradius 127.5 px, gap 13.6 px, pitch 234.4 x 203.0 px,
 * cell (0, 0) at HANDOVER.origin). The body's first camera puts the world exactly on that field,
 * the lead on the handover cell (4, -2) (high on the right, where the s1 framing wants it), and
 * carries on the opening's slow push about the frame centre (HANDOVER.push, as a log-zoom rate).
 * It then settles into the s1 framing over T.handIn.
 */
const HO = HANDOVER
export const CAM_HANDOVER = { x: 0, y: 0, z: HO.houseZoom, px: HO.origin[0] + HO.pitchX * (4 - 2 / 2), py: HO.origin[1] - 2 * HO.pitchY }
const HANDOVER_RATE = HO.push / HO.zoom

/** The end of the take: the lead, the story row and the components, right of the (empty) type column. */
export const END = camOn(1, 1, 1330, 470, 0.55)
const PULL = bezier(0.6, 0, 0.1, 1)

export const KEYS = { s1: T.key1, s2: T.key2, s3: T.key3, s4: T.key4, s5: T.keyFlows, s6: T.key6, s7a: T.key7a, s7b: T.key7b }

export const rests = [
	rest(CAM_HANDOVER, 0, { k: HANDOVER_RATE, pivot: [960, 540] }), // the handover: the opening's field, still pushing in
	rest(CAM.s1, T.key1, { k: DRIFT.s1, pivot: LEAD_AT }), // s1: a slow push about the lead
	rest(CAM.s2, T.key2, { k: -0.03, v: [-3, -2] }), // s2: the pull back drifts on
	rest(CAM.s3, T.key3, { k: 0.048, pivot: [960, 420] }), // s3: the long crawl into the contract
	rest(CAM.s4, T.key4, { k: 0.03, pivot: TAP_AT }), // s4: a slow push about the tap
	rest(CAM.s5, T.keyFlows, { k: 0.01, pivot: [1480, 700] }), // s5: nearly still while the flow is drawn
	rest(CAM.s6, T.key6, { k: 0.02, pivot: NOTE_AT }), // s6: drifting toward the window's middle
	rest(CAM.s7, T.key7a, { k: DRIFT.s7 }), // s7: a slow push into the assistant, across both captions
	rest(END, T.pullEnd[1], { k: -0.02 }), // the end
]
const moves = [
	{ from: T.handIn[0], to: T.handIn[1], ease: ease.brand, blend: 'pivot' }, // out of the opening's push into the s1 framing
	{ from: T.pull[0], to: T.pull[1], ease: PULL, blend: 'pivot' },
	{ from: T.push[0], to: T.push[1], ease: ease.brand, blend: 'pivot' },
	{ from: T.hop1[0], to: T.hop1[1], ease: ease.snap, blend: 'fly', rho: 2.0 },
	{ from: T.flowOut[0], to: T.flowOut[1], ease: ease.brand, blend: 'pivot' },
	{ from: T.pushNc[0], to: T.pushNc[1], ease: ease.brand, blend: 'pivot' },
	{ from: T.hop3[0], to: T.hop3[1], ease: ease.snap, blend: 'fly', rho: 2.0 },
	{ from: T.pullEnd[0], to: T.pullEnd[0] + 0.72, ease: ease.brand, blend: 'pivot' },
]
const bodyCamera = take(rests, moves)
export const camera = (t) => bodyCamera(t - O)
export { bodyCamera }

/* ------------------------------------------------------------ springs */

const popSpring = (s) => (s <= 0 ? 0 : spring(s, { freq: 2.8, zeta: 0.55 }))
const springFor = (zeta, D) => {
	const freq = (Math.PI - Math.acos(zeta)) / (2 * Math.PI * Math.sqrt(1 - zeta * zeta) * D)
	return (s) => spring(s, { freq, zeta })
}

/* ------------------------------------------------------------ s1: the components load */

const LOAD_AT = Object.fromEntries(LOADS.map((l) => [l.id, l.at]))
const POP_SETTLE = 0.6
const NC_CELLS = Object.fromEntries(Object.entries(SLOT).map(([id, k]) => [id, k.split(',').map(Number)]))

function linkState(tb) {
	const links = {}
	for (const l of LOADS) links[l.id] = ease.inOutCubic(inv(l.at - LINK_DUR, l.at, tb))
	return { links, retract: ease.inOutCubic(inv(T.retract[0], T.retract[1], tb)) }
}

/* ------------------------------------------------------------ s2: the story row lands (from the right, along the row) */

const FLY_D = 0.22
const FLY_SETTLE = 0.6
const OVER = 1.35
const flyPos = springFor(0.75, FLY_D)
const flyScale = springFor(0.6, FLY_D)
const ROW_START = (() => {
	let L = 0
	const keys = Object.keys(T.land)
	for (const k of keys) {
		const [q, r] = k.split(',').map(Number)
		const [sx, sy] = toScreen(CAM.s2, ...cellXY(q, r))
		const rad = R * CAM.s2.z * OVER + 12
		let l = 0
		while (l < 4000 && sx + l - rad < W) l += 4
		L = Math.max(L, l)
	}
	return Object.fromEntries(keys.map((k) => {
		const [q, r] = k.split(',').map(Number)
		const [sx, sy] = toScreen(CAM.s2, ...cellXY(q, r))
		return [k, [sx + L, sy]]
	}))
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
		accent: t < T.flowOut[1],
	}
}

/** The flow the customer draws (s5). Round 6: the last step travels on one continuous ease, no pop, no stall. */
function laneState(t) {
	const lift = flowLift(t)
	return {
		trig: popSpring(t - T.trig),
		up: ease.outCubic(inv(T.trig + 0.06, T.trig + 0.26, t)),
		edge1: ease.outCubic(inv(T.edge1[0], T.edge1[1], t)),
		task: popSpring(t - T.task),
		card: ease.outCubic(inv(T.lift, T.lift + 0.16, t)), // it appears in the hand, no overshoot
		edge2: 1,
		lift,
		slot: Math.min(ease.outCubic(inv(T.slot, T.slot + 0.12, t)), 1 - inv(0.8, 1, lift)), // shows, then fades as the card covers it
		into: ease.outCubic(inv(T.into[0], T.into[1], t)),
		accent: true,
	}
}
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
	return { badge: t < T.hop3[1], badgeScale, open: 0 }
}
function noteState(t) {
	return {
		toast: ease.brand(inv(T.toast, T.toast + 0.3, t)),
		phone: ease.brand(inv(T.phone, T.phone + 0.42, t)),
		push: ease.brand(inv(T.pushMsg, T.pushMsg + 0.26, t)),
	}
}

function chatState(t) {
	const dots = t >= T.ask + 0.08 && t < T.answer ? [0, 1, 2].map((i) => -0.9 * Math.max(0, Math.sin(2 * Math.PI * ((t - T.ask) / (SPB / 2) - i * 0.2)))) : null
	return {
		rail: ease.brand(inv(T.rail[0], T.rail[0] + 0.22, t)) + ease.brand(inv(T.rail[1], T.rail[1] + 0.22, t)),
		ask: ease.brand(inv(T.ask, T.ask + 0.16, t)),
		dots,
		grow: ease.brand(inv(T.answer, T.answer + 0.22, t)),
		rows: T.rows.reduce((a, tr) => a + ease.outCubic(inv(tr - 0.05, tr + 0.05, t)), 0),
		appr: 0,
		prepared: ease.brand(inv(T.propose, T.propose + 0.24, t)),
		accent: true, // the ring round Allow waits; nothing is pressed
	}
}

/* ------------------------------------------------------------ the end: step off, toward the lead */

const STEP = [T.pullEnd[1] - 0.47, T.pullEnd[1] - 0.47 + S16, T.pullEnd[1] - 0.47 + 2 * S16]
function steppedOff(d, tq) {
	const s = STEP[Math.max(0, Math.min(2, 2 - Math.min(d, 2)))]
	if (!on(tq, s)) return null
	if (!on(tq, s + S16)) return { fill: C.cobalt200 }
	if (!on(tq, s + 2 * S16)) return { fill: C.cobalt800 }
	return ghost(d)
}

/* ------------------------------------------------------------ cell states */

/** An empty cell: in the first second the field's shading goes from the opening's (by screen distance) to the world's (by distance from the lead). */
function ghostAt(info, t) {
	const g = ghost(info.d)
	if (t >= T.fieldBlend[1]) return g
	const u = ease.inOutCubic(inv(T.fieldBlend[0], T.fieldBlend[1], t))
	return { fill: g.fill, opacity: lerp(HO.opacity(info.sx, info.sy), g.opacity, u) }
}

function ringLook(k, t, tq, info, dim) {
	const id = RING[k]
	const o = dim < 1 && !['filinq', 'nextcloud'].includes(id) ? { dim } : {}
	if (id === 'filinq') return appCell(id, { keepGlyph: true, innerOver: true, ...o, inner: (g, wx, wy) => contractPage(g, wx, wy, contractState(t, tq)) })
	if (id === 'portaliq') return appCell(id, { ...o, inner: (g, wx, wy) => portalPhone(g, wx, wy, phoneState(t, tq)) })
	if (id === 'nextcloud') return appCell(id, { innerIn: [260, 460], fill: ncFill(info.sr), ...o, inner: (g, wx, wy) => { ncWindow(g, wx, wy, deskState(t)); ncNotify(g, wx, wy, noteState(t)) } })
	if (id === 'hermiq') return appCell(id, { innerIn: [260, 460], ...o, inner: (g, wx, wy) => assistantDesk(g, wx, wy, chatState(t)) })
	return appCell(id, { active: k === '0,0' && within(tq, T.orange[0], T.orange[1]), ...o })
}

function look(info, t, tq, dim) {
	const { k, d } = info
	const id = RING[k]
	if (!id) return ghostAt(info, t)
	if (k === '0,0') {
		if (t < 0.4) return ghostAt(info, t) // the lead pops in on the field: drawn on top, see below
		return steppedOff(d, tq) || ringLook(k, t, tq, info, dim)
	}
	if (id.startsWith('nc-')) {
		if (t < LOAD_AT[id] + POP_SETTLE) return ghostAt(info, t) // not loaded yet, or popping in on top
		return steppedOff(d, tq) || ringLook(k, t, tq, info, dim)
	}
	if (T.land[k] !== undefined && t < T.land[k] + FLY_SETTLE) return ghostAt(info, t)
	return steppedOff(d, tq) || ringLook(k, t, tq, info, dim)
}

/* ------------------------------------------------------------ the scene */

export function buildWorld(ctx) {
	const { cue: cueAbs } = ctx
	const cue = (tb, kind, o) => cueAbs(O + tb, kind, o)
	const layer = el('g', { 'data-layer': 'world' }, ctx.g)

	// s1: the lead settles on the cut; per component a light scratch as its line runs out and a tick as it pops in, up the scale.
	cue(0, 'pluck', { freq: 587.33, gain: 0.2, decay: 0.6 })
	const notes = [1174.66, 1318.51, 1479.98, 1567.98, 1760, 1975.53, 2349.32]
	LOADS.forEach((l, i) => {
		const [x] = cellXY(...NC_CELLS[l.id])
		const pan = clamp(x / 500, -0.6, 0.6)
		cue(l.at - LINK_DUR, 'whoosh', { dur: LINK_DUR + 0.05, from: 2600, to: 6200, panFrom: 0, panTo: pan, gain: 0.04, q: 3, seed: 80 + i })
		cue(l.at, 'tick', { freq: notes[i], gain: 0.16, pan })
	})
	// s2: a soft whoosh as the lines draw back and the camera eases out; a tick per pair as the row lands; the lead turns orange.
	cue(T.retract[0] - 0.05, 'whoosh', { dur: 0.8, from: 2600, to: 500, panFrom: 0.2, panTo: -0.2, gain: 0.13 })
	cue(T.land['1,0'], 'tick', { freq: 1975.53, gain: 0.17, pan: 0.3 })
	cue(T.land['3,0'], 'tick', { freq: 2349.32, gain: 0.17, pan: 0.6 })
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
	// s5: the pull up to the lane; a soft thud per node, a light scratch per edge; one long soft swish under the carry; a dry click as it settles.
	cue(T.flowOut[0] - 0.04, 'whoosh', { dur: 0.75, from: 3200, to: 500, panFrom: 0.4, panTo: -0.2, gain: 0.2 })
	cue(T.trig, 'kick', { gain: 0.16, pitch: 120, end: 60, decay: 0.16, click: 0.05 })
	cue(T.edge1[0], 'whoosh', { dur: 0.22, from: 2500, to: 6000, panFrom: -0.3, panTo: 0.1, gain: 0.05, q: 3 })
	cue(T.task, 'kick', { gain: 0.16, pitch: 120, end: 60, decay: 0.16, click: 0.05 })
	cue(T.lift, 'whoosh', { dur: T.drop - T.lift, from: 700, to: 1900, panFrom: 0.1, panTo: 0.5, gain: 0.07 })
	cue(T.slot, 'tick', { freq: 1479.98, gain: 0.08, pan: 0.5 })
	cue(T.drop, 'click', { gain: 0.3, freq: 2400, pan: 0.5, seed: 62, dry: true })
	cue(T.into[0], 'pluck', { freq: 880, gain: 0.18, decay: 0.5, pan: 0.5 })
	// s6: the push up into Nextcloud; a crisp click as the badge pops; the desktop notification; the phone; the push.
	cue(T.pushNc[0] - 0.05, 'whoosh', { dur: 0.95, from: 500, to: 4600, panFrom: 0.2, panTo: 0.5, gain: 0.22 })
	cue(T.badge, 'click', { gain: 0.32, freq: 2800, pan: 0.4, seed: 63, dry: true })
	cue(T.toast, 'whoosh', { dur: 0.3, from: 1200, to: 3200, panFrom: -0.6, panTo: -0.3, gain: 0.07 })
	cue(T.toast + 0.12, 'tick', { freq: 1318.51, gain: 0.14, pan: -0.4 })
	cue(T.phone, 'whoosh', { dur: 0.45, from: 300, to: 1400, panFrom: 0.6, panTo: 0.5, gain: 0.1 })
	cue(T.pushMsg, 'tick', { freq: 1975.53, gain: 0.16, pan: 0.55 })
	cue(T.pushMsg, 'click', { gain: 0.24, freq: 3200, pan: 0.55, seed: 64, dry: true })
	// s7: the hop; soft thuds as the app blocks land, a click per switch; the question; the answer; the prepared work, waiting.
	cue(T.hop3[0] - 0.06, 'whoosh', { dur: 0.7, from: 700, to: 5200, panFrom: -0.6, panTo: 0.7, gain: 0.24 })
	T.rail.forEach((t, i) => {
		cue(t, 'kick', { gain: 0.12, pitch: 130, end: 70, decay: 0.12, click: 0.04 })
		cue(t + S16, 'click', { gain: 0.12, freq: 3000, pan: -0.4, seed: 65 + i, dry: true })
	})
	cue(T.ask, 'tick', { freq: 1318.51, gain: 0.12, pan: 0.4 })
	cue(T.answer, 'pluck', { freq: 880, gain: 0.2 })
	T.rows.forEach((t, i) => cue(t, 'tick', { freq: [1174.66, 1318.5][i], gain: 0.12, pan: -0.2 }))
	cue(T.propose, 'pluck', { freq: 987.77, gain: 0.2, decay: 1.4, index: 1.2 })
	// the end: a riser into the pull out, a whoosh, a hat per ring as the honeycomb steps off toward the lead.
	cue(T.s7bOut - 0.8, 'riser', { dur: T.pullEnd[0] - T.s7bOut + 0.8, gain: 0.1, root: 45 })
	cue(T.pullEnd[0] - 0.05, 'whoosh', { dur: 0.8, from: 2800, to: 300, panFrom: 0.3, panTo: -0.3, gain: 0.2 })
	STEP.forEach((t, i) => cue(t, 'hat', { gain: 0.14, pan: [0.5, 0.2, -0.1][i], seed: 40 + i }))

	return (t) => {
		layer.replaceChildren()
		const tb = t - O
		const tq = fq(tb)
		const cam = bodyCamera(tb)
		const dim = quietDim(tq)
		const wg = drawWorld(layer, cam, (q, r, info) => look(info, tb, tq, dim))

		// s1: the lead pops in on its cell of the handover field (nothing there on the first frame), on top of the world.
		if (tb < 0.4) {
			const [lx, ly] = toScreen(cam, 0, 0)
			const s = spring(tb, { freq: 2.6, zeta: 0.6 })
			drawWorld(layer, { x: 0, y: 0, z: cam.z * s, px: lx, py: ly }, (qq, rr, info) => (info.k === '0,0' ? appCell('pipelinq') : null), { reach: 1 })
		}
		// s1-s2: the lead's links (under the same camera) until they have drawn back.
		if (tb < T.retract[1] + 0.05) {
			const g = el('g', { transform: wg.getAttribute('transform') }, layer)
			leadLinks(g, NC_CELLS, linkState(tb))
		}
		// s1: each component pops into its cell as its line arrives, on top, then hands over to the world's own cell.
		for (const l of LOADS) {
			const s0 = tb - l.at
			if (s0 < 0 || s0 >= POP_SETTLE) continue
			const [q, r] = NC_CELLS[l.id]
			const [wx, wy] = cellXY(q, r)
			const [sx, sy] = toScreen(cam, wx, wy)
			const s = popSpring(s0)
			drawWorld(layer, { x: wx, y: wy, z: cam.z * Math.max(0.0001, s), px: sx, py: sy }, (qq, rr, info) => (info.k === `${q},${r}` ? appCell(l.id) : null), { reach: 4 })
		}
		// s2: the story row flies in from the right along the lead's own row, on top.
		const ref = rests[2](tb) // the s2 rest
		for (const k of Object.keys(T.land)) {
			const s0 = tb - (T.land[k] - FLY_D)
			if (s0 <= 0 || tb >= T.land[k] + FLY_SETTLE) continue
			const [q, r] = k.split(',').map(Number)
			const [wx, wy] = cellXY(q, r)
			const [slx, sly] = toScreen(cam, wx, wy)
			const [x0, y0] = ROW_START[k]
			const pp = flyPos(s0)
			const z = lerp(ref.z, cam.z, clamp(pp)) * lerp(OVER, 1, flyScale(s0))
			drawWorld(layer, { x: wx, y: wy, z, px: lerp(x0, slx, pp), py: lerp(y0, sly, pp) }, (qq, rr, info) => (info.k === k ? ringLook(k, tb, tq, info, 1) : null), { reach: 5 })
		}
		// s5: the flow lane, while it is in view.
		if (tb >= T.flowOut[0] && tb < T.pushNc[1]) {
			const g = el('g', { transform: wg.getAttribute('transform') }, layer)
			flowLane(g, laneState(tb))
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
