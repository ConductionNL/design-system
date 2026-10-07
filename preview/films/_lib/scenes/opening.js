/**
 * The Conduction opening: the sting in front of every Conduction film.
 *
 * Three bars at 128 BPM (5.625 s, 135 frames at 24 fps). A calm honeycomb in
 * cobalt holds a dormant cluster of 20 app glyphs. A current runs in from
 * the edges of the frame toward the heart of the cluster: a travelling front
 * with a sharp white leading edge and a tail that decays in steps, every cell
 * charging with a spring as it arrives and small arcs jumping the gap to the
 * next cell. The apps light up ring by ring, one per sixteenth, and on the
 * bar 2 downbeat the current reaches the heart (OpenRegister, the one every
 * app keeps its records in), which turns orange: the one orange. On the "and"
 * of 2.3 a second ripple runs outward and turns the apps away: every app cell
 * flips by scaling its width to nothing and back (a pointy-top hex is never
 * rotated, not even as movement). The back of the heart is the Conduction
 * avatar; the backs of the three cells to its right carry the wordmark, so the
 * name is revealed tile by tile in reading order while the camera glides to
 * the canonical lockup (avatar flush left of the wordmark). On the bar 3
 * downbeat the name powers on, whole and white, and holds while the hum
 * settles; then it hands over to the film (below). Within each ring the
 * apps charge and turn a few frames apart (seeded), as if turned by hand.
 *
 * The fronts are circles (Euclidean distance), not hex rings: rings of
 * pointy-top cells outline a flat-top hexagon, which the brand does not draw.
 *
 * Everything is a pure function of time. Stepped states (a cell's charge
 * colour, the arcs) switch on whole frames of the 24 fps grid, so the motion
 * blur sub-samples of one frame agree; springs and flips are continuous.
 *
 *   import { addOpening } from '../_lib/scenes/opening.js'
 *   const bodyStart = addOpening(film, { at: 0 })   // 5.625: returns the opening's end time
 *   addOpening(film, { at: 0, handover: false })     // no film follows: the lockup holds to the end
 *   addOpening(film, { at: 0, legacy: true })        // the finished ConNext master: the name on its tiles
 *
 * Round 28d (Ruben): by default the dark hexes behind the lockup flip out just before the name powers
 * on, so "Conduction" stands on clean ground, and flip back in before the handover (the last frame is
 * still the plain field of the contract). legacy: true keeps the name on its tiles.
 *
 * Sound cues (crackle, arc, hum, charge, powerOn, click, plus the house kick,
 * impact and whoosh) are recorded with film.cue next to the motion that
 * causes them; scripts/films/score.mjs renders them. No bell, no tonal ping.
 *
 * ------------------------------------------------------------------------
 * THE HANDOVER CONTRACT (a film follows: addOpening's default, handover: true)
 * ------------------------------------------------------------------------
 * Timing (opening-local, never moves): the name is whole from 3.75 s (bar 3.1,
 * frame 90) and stays whole to 5.25 s (frame 126), 1.5 s. From frame 126 the
 * lockup's four tiles turn back in reading order, a frame apart, 5 frames each
 * (a width to nothing and back, never a rotation): the avatar, then the three
 * wordmark tiles, the last one done on frame 134, the opening's last frame.
 * The few breathing cells settle to the plain ghost over the same frames.
 * addOpening returns at + 5.625, where the film's first frame (frame 135) is.
 *
 * The last frame (and the frame the film starts from) is ground and field only:
 *   - ground C.cobalt, no marks, no glyphs, no arcs, no lit or pale cells;
 *   - a pointy-top honeycomb of solid C.cobalt600 cells, the house world's
 *     proportions seen at house zoom 0.85: circumradius 127.5 px, gap 13.6 px,
 *     rounding 8.5 px, pitch 234.4 px along a row and 203.0 px row to row;
 *   - cell (0, 0), where the avatar was, centred at screen (648.5, 540); every
 *     other cell at that point + (234.4 (q + r/2), 203.0 r);
 *   - each cell's opacity by its screen distance from the frame centre: 1 near
 *     the centre down to 0.44 in the corners (HANDOVER.opacity(x, y));
 *   - the camera still pushing in slowly about the frame centre, 0.029 zoom
 *     a second (HANDOVER.push), so continuing the push or holding both read;
 *   - sound: only the hum, fading from 0.2 of its level at 5.625 s to silence
 *     a second into the film; nothing tonal rings.
 * A film's first frame should start from that ground: either draw the same
 * field (align its honeycomb to HANDOVER, or put handoverGround() under its
 * first scene) and build its first scene in on top, or build its own ground
 * in over it; no hard cut is needed because nothing on screen but the field
 * has to disappear. The exact numbers are exported as HANDOVER.
 */
import { el, set, nextId } from '../stage.js'
import { ease, spring, inv, clamp, lerp, bezier, mix, hexPath, axialToPixel, rand, SQRT3 } from '../core.js'
import { C } from '../brand.js'
import { MARK_BOX } from '../assets.js'

/* ------------------------------------------------------------ the grid */

export const BPM = 128
export const FPS = 24
const SPB = 60 / BPM
const S16 = SPB / 4
const F = (n) => n / FPS
/** Musical time, bars and beats counted from 1 as a storyboard writes them. */
export const G = (bar, beat = 1, s16 = 0) => ((bar - 1) * 4 + (beat - 1) + s16 / 4) * SPB
export const OPENING_BARS = 3
export const OPENING_DURATION = G(OPENING_BARS + 1) // 5.625 s, 135 frames

/** The beats of the opening, in opening-local seconds. */
export const T = {
	connect: G(2), // 1.875: the current reaches the heart; the heart turns orange
	pulse: [G(2, 2), G(2, 3)], // the live network beats twice
	glide: [G(2, 3), G(3)], // 2.81 to 3.75: the camera glides to the lockup
	turn: G(2, 3, 2), // 3.05: the second ripple leaves the heart
	powerOn: G(3), // 3.75: the name powers on
	exit: G(3) + 1.5, // 5.25 (frame 126): the name has been whole for 1.5 s; the handover turns it back
	end: G(4), // 5.625
}

/* ------------------------------------------------------------ the world */

/**
 * Cell circumradius and gap, in world units; the avatar's outer hex is exactly
 * one cell. Gap and rounding keep the house world's proportions (the ConNext
 * world: R 150, gap 16, rounding 10), so at zoom 1.275 this field is that
 * world at zoom 0.85, cell for cell (see HANDOVER).
 */
const R = 100
const GAP = (16 / 150) * R
const ROUND = (10 / 150) * R
const PITCH = SQRT3 * R + GAP // 183.9: centre to centre of two neighbours
const GLYPH = R * 0.92
const cellXY = (q, r) => axialToPixel(q, r, R, GAP)
const hexDist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
const NEIGHBOURS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]

/**
 * The cluster: 20 apps (round 5: Buildiq is out of the films, it moves to
 * Nextcloud). The radius-2 honeycomb round the heart (rows of 3, 4, 5, 4 and
 * 3) plus one cell at the right end of the middle row, where the name will be
 * written: a honeycomb with a centre cell is only exactly symmetric with an
 * odd count, so the twentieth cell points the way the name goes. The camera
 * centres the cluster's mass, not its heart (see CX0). The heart is OpenRegister
 * (every app keeps its records in it); the first ring holds the apps a
 * customer meets first; the three cells right of the heart turn over to the
 * name.
 */
const CLUSTER = {
	'0,0': 'openregister',
	// first ring, clockwise from east
	'1,0': 'pipelinq', '1,-1': 'opencatalogi', '0,-1': 'filinq', '-1,0': 'integriq', '-1,1': 'launchpad', '0,1': 'portaliq',
	// second ring, clockwise from east
	'2,0': 'dossiq', '2,-1': 'shillinq', '2,-2': 'thematiq', '1,-2': 'learniq', '0,-2': 'decidiq', '-1,-1': 'hermiq',
	'-2,0': 'zaakafhandelapp', '-2,1': 'stackiq', '-2,2': 'keepiq', '-1,2': 'humaniq', '0,2': 'planninq', '1,1': 'versioniq',
	// the right end of the middle row: the name's last tile
	'3,0': 'larpinq',
}
/** The cells whose backs carry the wordmark, left to right. */
const NAME_CELLS = ['1,0', '2,0', '3,0']

/**
 * The canonical lockup (print/business-cards, print/banner): the avatar flush
 * left of the wordmark, centred on one line. There the logo box is 22 mm tall
 * beside 26 pt type with a 5 mm gap; in the wordmark file the type's em is
 * 0.8 of its height, so the wordmark is 1/1.92 of the avatar's height and the
 * gap from the hex edge is 0.295 of it.
 */
const [AW, AH] = MARK_BOX['avatar-conduction'] // 173.2 x 200: the outer hex is R = 100, one cell
const [WMW, WMH] = MARK_BOX['wordmark-conduction-white']
const WM_H = AH / 1.92
const WM_W = (WM_H * WMW) / WMH
const WM = { x: AW / 2 + 0.295 * AH, y: -WM_H / 2, w: WM_W, h: WM_H }
/** The lockup's visible extent (the wordmark file keeps a few units of side bearing on the right). */
const LOCK_CX = (-AW / 2 + WM.x + WM.w - (5 * WM_H) / WMH) / 2
/** The cluster's centre of mass: the camera frames it there until the glide, so the silhouette sits balanced. */
const CX0 = Object.keys(CLUSTER).reduce((a, k) => a + cellXY(...k.split(',').map(Number))[0], 0) / Object.keys(CLUSTER).length

/* ------------------------------------------------------------ helpers */

const ss = (a, b, x) => { const p = inv(a, b, x); return p * p * (3 - 2 * p) }
const hash = (q, r, k = 0) => { const g = rand((((q + 97) * 263 + (r + 97)) * 7919 + k * 104729) >>> 0); g(); return g() }
/** Frame index of a time on the 24 fps grid (stepped states read this). */
const fi = (t) => Math.round(t * FPS + 1e-6)
/** Non-uniform scale about a point: a flip is a width going to nothing and back, never a rotation. */
const scaleAbout = (sx, sy, cx, cy) => {
	sx = Math.max(sx, 0.001)
	sy = Math.max(sy, 0.001)
	return `matrix(${sx.toFixed(4)} 0 0 ${sy.toFixed(4)} ${(cx * (1 - sx)).toFixed(2)} ${(cy * (1 - sy)).toFixed(2)})`
}

/* ------------------------------------------------------------ colour */

const GHOST = C.cobalt600 // the house's empty cell: a solid, darker cobalt
const DORMANT_GLYPH = mix(C.cobalt400, C.cobalt300, 0.45) // a dormant app: its glyph embossed on the dark cell, legible but asleep
const C450 = mix(C.cobalt400, C.cobalt600, 0.5)
const C500 = mix(C.cobalt400, C.cobalt600, 0.75)
const C650 = mix(C.cobalt600, C.cobalt700, 0.5)
/**
 * The tail of a charge, frame by frame from its arrival. The inward front is the current itself: a sharp
 * white edge that decays in steps to the ghost. The outward ripple is the discharge: a one-frame crest, then
 * a trough a step darker than the ghost that recovers, so the field goes quiet as the name comes up. An app
 * cell's back comes up bright and clears fast, so the mark on it reads.
 */
const TAILS = {
	in: [C.white, C.cobalt100, C.cobalt200, C.cobalt300, C.cobalt400, C.cobalt400, C450, C450, C500],
	out: [C.cobalt300, C500, C.cobalt700, C.cobalt700, C.cobalt700, C.cobalt700, C.cobalt700, C650, C650, C650],
	back: [C.cobalt200, C.cobalt400, C450, C500],
}
const tailColour = (tail, framesSince) => (framesSince < 0 || framesSince >= tail.length ? null : tail[framesSince])
const tailLevel = (tail, framesSince) => (framesSince < 0 || framesSince >= tail.length ? 0 : 1 - framesSince / tail.length)

/* ------------------------------------------------------------ timing of the two fronts */

/** Near the heart the front moves one ring per sixteenth, the same speed the second ripple leaves at. */
const V = PITCH / S16 // 1580 world units a second
const NEAR = 3 * PITCH
const DE_MAX = 2250
const V_EDGE = 780
const K = (V - V_EDGE) / (DE_MAX - NEAR)
/** Seconds before the heart that the inward front passes effective distance de: slow at the edges, accelerating in. */
function tauIn(de) {
	if (de <= NEAR) return de / V
	const v = Math.max(240, V - (de - NEAR) * K)
	return NEAR / V + Math.log(V / v) / K
}
/** The front comes in from the left: an ellipse with the heart as its focus, turning into a circle near the cluster. */
const BIAS = 0.22

/* ------------------------------------------------------------ the camera */

const Z0 = 0.62 // frame 1: the whole cluster small in a wide field
const Z1 = 0.7 // the push arrives with the current
const Z2 = 0.73 // the slow drift while the network is live
const Z3 = 1.22 // the lockup: the avatar 244 px tall, the lockup 43% of the frame, centred
const Z4 = 1.275 // the hold keeps pushing, slowly; at T.end the field is the house world at zoom 0.85 (HANDOVER)
const GLIDE = bezier(0.42, 0, 0.1, 1)

export function camera(t) {
	let z, x = CX0
	// The recoil starts on the frame of the hit (not mid-frame), so the blur sub-samples of that frame agree.
	if (fi(t) < fi(T.connect)) {
		z = lerp(Z0, Z1, Math.pow(clamp(t / T.connect), 2.1))
	} else if (t < T.glide[0]) {
		z = lerp(Z1, Z2, inv(T.connect, T.glide[0], t))
		// recoil: the hit pushes the camera back a touch and it springs home
		const e = t - T.connect
		z *= 1 - 0.014 * Math.exp(-e / 0.07) * Math.cos(2 * Math.PI * 3.2 * e)
	} else if (t < T.glide[1]) {
		const p = GLIDE(inv(T.glide[0], T.glide[1], t))
		z = Math.exp(lerp(Math.log(Z2), Math.log(Z3), p))
		x = lerp(CX0, LOCK_CX, p)
	} else {
		z = lerp(Z3, Z4, inv(T.glide[1], T.end, t))
		x = LOCK_CX
	}
	return { x, y: 0, z }
}
/** Stereo position of a world x at time t, from the frame. */
const panAt = (x, t) => { const c = camera(t); return clamp(((x - c.x) * c.z) / 960, -1, 1) * 0.85 }
const onScreen = (x, y, t, pad = 110) => { const c = camera(t); const sx = (x - c.x) * c.z, sy = (y - c.y) * c.z; return Math.abs(sx) < 960 + pad && Math.abs(sy) < 540 + pad }

/* ------------------------------------------------------------ the cells */

/**
 * Round 28d: the x scale of a lockup tile's dark hex (the ground behind the name). i: the tile's place in
 * reading order (0 the avatar's cell, 1 to 3 the name tiles), from exitAt - T.exit in frames. The hexes flip
 * out a frame apart from five frames before the power-on, three frames each; with a handover they flip back
 * in a frame apart, done on the frame the tiles start to turn back (T.exit).
 */
function lockupGround(t, lag, handover) {
	const i = Math.round(lag * FPS) > 0 ? Math.round(lag * FPS) : 0
	const o0 = T.powerOn - F(5) + F(i)
	let sx = 1 - ease.inCubic(inv(o0, o0 + F(3), t))
	if (handover) {
		const i0 = T.exit - F(6) + F(i)
		if (t >= i0) sx = ease.outCubic(inv(i0, i0 + F(3), t))
	}
	return sx
}
export const LOCKUP_CLEAR = { out: T.powerOn - F(5), back: T.exit - F(6) }

/** Flip timing: the width goes to nothing and back over 8 frames (7 to 9 for the apps, by hand), in-out, quick through edge-on. */
const FLIP = F(8)
/** The handover turns the lockup's four tiles back, a frame apart, each in 5 frames: frames 126 to 134, done on the last frame. */
const EXIT = F(5)

function buildCells() {
	const cells = []
	const byKey = {}
	for (let r = -7; r <= 7; r++) {
		for (let q = -16; q <= 16; q++) {
			const [x, y] = cellXY(q, r)
			if (Math.abs(x) > 1950 || Math.abs(y) > 1150) continue
			const k = `${q},${r}`
			const d = Math.hypot(x, y)
			const cosPhi = d > 0 ? x / d : 0
			const de = d * (1 - BIAS * ss(500, 1200, d) * cosPhi)
			const jitIn = (hash(q, r, 1) - 0.5) * 0.07 * ss(250, 900, d)
			const jitOut = (hash(q, r, 2) - 0.5) * 0.04 * ss(650, 1100, d)
			const app = CLUSTER[k] || null
			const ring = hexDist(q, r)
			// The apps charge and turn ring by ring on the sixteenths, each a few frames apart within its ring
			// (seeded, 0 to 2 frames: less than a sixteenth, so the ring order holds). The heart and the name
			// tiles keep their exact times: the heart lands on the downbeat, the name turns in reading order.
			const fixed = k === '0,0' || NAME_CELLS.includes(k)
			const lagIn = app && k !== '0,0' ? F(Math.floor(hash(q, r, 8) * 3)) : 0
			const lagOut = app && !fixed ? F(Math.floor(hash(q, r, 9) * 3)) : 0
			const cell = {
				k, q, r, x, y, d, app, ring,
				tIn: app ? T.connect - ring * S16 - lagIn : T.connect - tauIn(de) + jitIn,
				tOut: app ? T.turn + ring * S16 + lagOut : T.turn + d / V + jitOut,
				flip: app && !fixed ? F(7 + Math.floor(hash(q, r, 10) * 3)) : FLIP,
				exitAt: k === '0,0' ? T.exit : NAME_CELLS.includes(k) ? T.exit + F(1 + NAME_CELLS.indexOf(k)) : null,
				arcIn: app ? true : hash(q, r, 3) < 0.42,
				arcOut: !app && hash(q, r, 4) < 0.34,
				breath: hash(q, r, 5) < 0.2 ? { p: 11 + hash(q, r, 6) * 7, ph: hash(q, r, 7) * Math.PI * 2 } : null,
				name: NAME_CELLS.indexOf(k),
			}
			cells.push(cell)
			byKey[k] = cell
		}
	}
	// The cell each charge jumps from: inward, the neighbour that charged first; outward, the one nearest the heart.
	for (const c of cells) {
		let src = null, srcOut = null
		for (const [dq, dr] of NEIGHBOURS) {
			const n = byKey[`${c.q + dq},${c.r + dr}`]
			if (!n) continue
			if (n.tIn < c.tIn && (!src || n.tIn < src.tIn)) src = n
			if (n.tOut < c.tOut && (!srcOut || n.tOut < srcOut.tOut)) srcOut = n
		}
		c.src = src
		c.srcOut = srcOut
	}
	return { cells, byKey, leaks: buildLeaks(cells, byKey) }
}

/**
 * While the network is live, current leaks across the cluster's edge: a spark
 * from an app cell into a dark neighbour every few frames, and three at once
 * on each heartbeat. Seeded, so the picture and the crackle agree.
 */
function buildLeaks(cells, byKey) {
	const pairs = []
	for (const c of cells) {
		if (!c.app) continue
		for (const [dq, dr] of NEIGHBOURS) {
			const n = byKey[`${c.q + dq},${c.r + dr}`]
			if (n && !n.app) pairs.push([c, n])
		}
	}
	const g = rand(4242)
	const pick = () => pairs[Math.floor(g() * pairs.length)]
	const out = []
	const beats = T.pulse.map(fi)
	for (let f = fi(T.connect) + 5; f < fi(T.turn) - 3;) {
		const [a, b] = pick()
		out.push({ f, a, b })
		f += 2 + Math.floor(g() * 3)
	}
	for (const b of beats) for (let i = 0; i < 3; i++) { const [a, n] = pick(); out.push({ f: b, a, b: n }) }
	return out
}

/* ------------------------------------------------------------ arcs */

/**
 * A spark jumping the gap from cell a toward cell b: a jagged line along the
 * segment between their centres, from `from` to `to` (fractions of it), with
 * a fresh seeded jitter every frame and now and then a short branch.
 */
function arcPath(a, b, from, to, frame, seed, amp = 9) {
	const g = rand((frame * 7919 + seed * 104729) >>> 0)
	const dx = b.x - a.x, dy = b.y - a.y
	const len = Math.hypot(dx, dy)
	const nx = -dy / len, ny = dx / len
	const n = 5
	let d = ''
	const pts = []
	for (let i = 0; i <= n; i++) {
		const f = from + ((to - from) * i) / n
		const j = i === 0 || i === n ? 0 : (g() - 0.5) * 2 * amp
		const px = a.x + dx * f + nx * j, py = a.y + dy * f + ny * j
		pts.push([px, py])
		d += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1)
	}
	if (g() < 0.35) {
		const [bx, by] = pts[2 + Math.floor(g() * 2)]
		const side = g() < 0.5 ? -1 : 1
		const bl = 16 + g() * 16
		d += `M${bx.toFixed(1)} ${by.toFixed(1)}L${(bx + (dx / len) * bl * 0.6 + nx * side * bl).toFixed(1)} ${(by + (dy / len) * bl * 0.6 + ny * side * bl).toFixed(1)}`
	}
	return d
}

/* ------------------------------------------------------------ the scene */

/**
 * Builds the opening into group g and returns update(t) for opening-local t.
 * Used by addOpening (the film) and by the storyboard frames, so an approved
 * still is the animation's own frame.
 */
export function buildOpening(g, { defs, handover = true, legacy = false } = {}) {
	const { cells, leaks } = buildCells()
	const world = el('g', { 'data-layer': 'opening-world' }, g)
	const fieldLayer = el('g', {}, world)
	const appLayer = el('g', {}, world)
	const arcLayer = el('g', { fill: 'none', stroke: C.white, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, world)
	const topLayer = el('g', {}, world)
	const clipHost = defs || el('defs', {}, g)

	for (const c of cells) {
		const layer = c.app ? appLayer : fieldLayer
		c.g = el('g', {}, layer)
		if (!c.app) {
			c.hex = el('path', { d: hexPath(c.x, c.y, R, ROUND), fill: GHOST }, c.g)
			continue
		}
		// An app cell has two faces: the app (dormant, then lit) and its back.
		c.face = el('g', {}, c.g)
		c.faceHex = el('path', { d: hexPath(c.x, c.y, R, ROUND), fill: GHOST }, c.face)
		c.glyph = el('use', { href: `#g-${c.app}`, x: c.x - GLYPH / 2, y: c.y - GLYPH / 2, width: GLYPH, height: GLYPH, color: DORMANT_GLYPH }, c.face)
		c.back = el('g', { display: 'none' }, c.g)
		c.backHex = el('path', { d: hexPath(c.x, c.y, R, ROUND), fill: GHOST }, c.back)
		if (c.k === '0,0') {
			c.mark = el('use', { href: '#avatar-conduction', x: -AW / 2, y: -AH / 2, width: AW, height: AH, color: C.white }, c.back)
		}
		if (c.name >= 0) {
			// This cell's piece of the wordmark, clipped to its own hex, so it turns over with the cell.
			const id = nextId('opening-name')
			const cp = el('clipPath', { id }, clipHost)
			el('path', { d: hexPath(c.x, c.y, R, ROUND) }, cp)
			const pg = el('g', { 'clip-path': `url(#${id})` }, c.back)
			c.mark = el('use', { href: '#wordmark-conduction-white', x: WM.x, y: WM.y, width: WM.w, height: WM.h }, pg)
		}
	}
	const name = el('use', { href: '#wordmark-conduction-white', x: WM.x, y: WM.y, width: WM.w, height: WM.h, display: 'none' }, topLayer)
	const spark = el('path', { fill: 'none', stroke: C.white, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', display: 'none' }, topLayer)
	const arcPool = Array.from({ length: 160 }, () => el('path', { display: 'none' }, arcLayer))

	return function update(t) {
		const cam = camera(t)
		set(world, { transform: `translate(960 540) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(3)} ${(-cam.y).toFixed(3)})` })
		const f = fi(t)
		const powered = f >= fi(T.powerOn)
		// The handover (a film follows): from frame 126 the lockup's tiles turn back to plain field, and the
		// few lighter breathing cells settle, so the last frame is ground and ghost field only.
		const leaving = handover && f >= fi(T.exit)
		const calm = handover ? 1 - inv(T.exit, T.end - F(2), t) : 1
		const halfW = 960 / cam.z + R * 1.3, halfH = 540 / cam.z + R * 1.3
		const leakFlash = new Map()
		for (const l of leaks) {
			if (f === l.f + 1) leakFlash.set(l.b, C.cobalt400)
			else if (f === l.f + 2 && !leakFlash.has(l.b)) leakFlash.set(l.b, C500)
		}
		let arcs = 0
		const sw = (3.2 / cam.z).toFixed(2)
		arcLayer.setAttribute('stroke-width', sw)

		for (const c of cells) {
			if (Math.abs(c.x - cam.x) > halfW || Math.abs(c.y - cam.y) > halfH) {
				c.g.setAttribute('display', 'none')
				continue
			}
			c.g.setAttribute('display', 'inline')
			const sx0 = (c.x - cam.x) * cam.z, sy0 = (c.y - cam.y) * cam.z
			// The field recedes toward the frame's edges, cell by cell (a solid per cell, never a gradient).
			const base = 1 - 0.56 * ss(360, 1060, Math.hypot(sx0, sy0 * 1.25))
			const fIn = f - fi(c.tIn)
			const fOut = f - fi(c.tOut)
			const eIn = t - fi(c.tIn) / FPS
			const eOut = t - fi(c.tOut) / FPS

			if (!c.app) {
				// Field cell: charged by each front as it passes, a spring on arrival.
				const tail = fOut >= 0 ? TAILS.out : TAILS.in
				const since = fOut >= 0 ? fOut : fIn
				const col = tailColour(tail, since)
				let fill = col || GHOST
				if (!col && c.breath) fill = mix(GHOST, C.cobalt, calm * (0.18 + 0.14 * Math.sin((2 * Math.PI * t) / c.breath.p + c.breath.ph)))
				if (!col && leakFlash.has(c)) fill = leakFlash.get(c)
				const level = tailLevel(tail, since)
				set(c.hex, { fill, 'fill-opacity': (base + (1 - base) * level).toFixed(3) })
				const e = fOut >= 0 ? eOut : eIn
				const pre = fOut >= -2 && fOut < 0 ? fOut : fIn >= -2 && fIn < 0 ? fIn : null
				let s = 1
				if (pre !== null) s = 1 - 0.035 * (3 + pre) // squashes as the arc reaches it
				else if (e >= 0 && e < 0.8) s = 0.9 + 0.1 * spring(e, { freq: 4.2, zeta: 0.38 })
				c.g.setAttribute('transform', s === 1 ? '' : scaleAbout(s, s, c.x, c.y))
			} else {
				updateApp(c, t, f, eIn, fIn, eOut, fOut, powered, base, leaving)
				// Round 28d: clean ground behind the name. Just before it powers on, the dark hexes behind the
				// lockup flip out one after another (the avatar's cell, then the three name tiles); with a
				// handover they flip back in before the tiles turn back, so the grid is whole again.
				if (!legacy && c.exitAt !== null) {
					const sx = lockupGround(t, c.exitAt - T.exit, handover)
					c.backHex.setAttribute('transform', sx >= 1 ? '' : scaleAbout(Math.max(sx, 1e-4), 1, c.x, c.y))
					c.backHex.setAttribute('display', sx <= 0.001 ? 'none' : 'inline')
				}
			}

			// Arcs at the fronts: the jump into this cell, over the three frames up to its charge.
			const arcFront = (srcCell, fr, seed) => {
				if (!srcCell || fr < -2 || fr > 0 || arcs >= arcPool.length) return
				const span = fr === -2 ? [0.38, 0.64] : fr === -1 ? [0.38, 0.8] : [0.44, 0.96]
				set(arcPool[arcs++], { d: arcPath(srcCell, c, span[0], span[1], f, seed, 13), display: 'inline' })
			}
			if (c.arcIn) arcFront(c.src, fIn, c.q * 31 + c.r)
			if (c.arcOut) arcFront(c.srcOut, fOut, c.q * 17 + c.r * 3 + 5)
		}
		for (const l of leaks) {
			if (f < l.f || f > l.f + 1 || arcs >= arcPool.length) continue
			const span = f === l.f ? [0.4, 0.76] : [0.44, 0.97]
			set(arcPool[arcs++], { d: arcPath(l.a, l.b, span[0], span[1], f, l.a.q * 13 + l.b.r * 7 + 3, 13), display: 'inline' })
		}
		for (let i = arcs; i < arcPool.length; i++) arcPool[i].setAttribute('display', 'none')

		// The name: tile pieces until the power-on, then the whole wordmark, drawn once, over the cells;
		// in the handover the pieces come back so each tile can turn its piece away.
		name.setAttribute('display', powered && !leaving ? 'inline' : 'none')
		if (powered) {
			const s = 1 + 0.03 * (1 - spring(t - T.powerOn, { freq: 3.4, zeta: 0.5 }))
			name.setAttribute('transform', scaleAbout(s, s, WM.x + WM.w / 2, 0))
		}
		// The circuit closes: for two frames a spark jumps the avatar's gap as it powers on.
		const sparkOn = f >= fi(T.powerOn) && f < fi(T.powerOn) + 2
		if (sparkOn) set(spark, { display: 'inline', d: arcPath({ x: 31, y: -21 }, { x: 31, y: 21 }, 0, 1, f, 77, 5), 'stroke-width': (3 / cam.z).toFixed(2) })
		else spark.setAttribute('display', 'none')
	}
}


function updateApp(c, t, f, eIn, fIn, eOut, fOut, powered, base, leaving) {
	const isHeart = c.k === '0,0'
	const charged = fIn >= 0
	const orange = isHeart && f >= fi(T.connect) // a stepped state: on the frame grid, so blur sub-samples agree
	let sx = 1, sy = 1
	let showBack = false
	let turn = 0 // 0 facing, 1 edge-on

	if (fOut >= 0 || eOut >= 0) {
		const p = clamp(eOut / c.flip)
		const th = Math.PI * ease.inOutCubic(p)
		sx = Math.abs(Math.cos(th))
		sy = 1 + 0.07 * Math.sin(th) // the edge-on tile reads a touch nearer
		showBack = th > Math.PI / 2
		turn = showBack ? 0 : th / (Math.PI / 2)
	}

	// Scale: dormant cells squash as the arc reaches them, spring when charged, beat with the network.
	let s = 1
	if (!charged && fIn >= -2) s = 1 - 0.04 * (3 + fIn)
	else if (charged && eIn < 1) {
		const e = eIn
		s = isHeart ? 0.84 + 0.16 * spring(e, { freq: 3, zeta: 0.4 }) : 0.88 + 0.12 * spring(e, { freq: 3.4, zeta: 0.42 })
	}
	for (const tp of T.pulse) {
		const e = t - tp - F(c.ring)
		if (e > 0 && e < 0.18) s *= 1 + 0.028 * Math.sin((Math.PI * e) / 0.18)
	}
	// The hit at the heart: a small shock runs out through the lit cluster, a frame per ring.
	if (!isHeart) {
		const e = t - T.connect - F(c.ring)
		if (e > 0 && e < 0.2) s *= 1 + 0.035 * Math.sin((Math.PI * e) / 0.2)
	}
	// A beat before the turn the heart gathers itself; after the power-on it settles with a small overshoot.
	if (isHeart && t > T.turn - F(3) && t < T.turn) s *= 1 - 0.05 * inv(T.turn - F(3), T.turn, t)
	if (isHeart && powered) s *= 1 + 0.045 * (1 - spring(t - T.powerOn, { freq: 3.4, zeta: 0.5 }))

	// The handover: the lockup's tiles turn back the way they came, to plain field (no glyph, no mark).
	let blank = false
	if (leaving && c.exitAt !== null) {
		const pe = clamp((t - c.exitAt) / EXIT)
		const th = Math.PI * ease.inOutCubic(pe)
		sx = Math.abs(Math.cos(th))
		sy = 1 + 0.07 * Math.sin(th)
		blank = th > Math.PI / 2
		showBack = !blank
	}

	c.g.setAttribute('transform', sx === 1 && sy === 1 && s === 1 ? '' : scaleAbout(sx * s, sy * s, c.x, c.y))
	c.face.setAttribute('display', showBack ? 'none' : 'inline')
	c.back.setAttribute('display', showBack ? 'inline' : 'none')

	if (blank) {
		set(c.faceHex, { fill: GHOST, 'fill-opacity': base.toFixed(3) })
		c.glyph.setAttribute('display', 'none')
	} else if (!showBack) {
		let fill, glyph
		c.glyph.setAttribute('display', 'inline')
		if (!charged) {
			fill = GHOST
			glyph = DORMANT_GLYPH
		} else if (orange) {
			fill = mix(C.orange, C.coral600, 0.7 * turn)
			glyph = C.white
		} else {
			fill = mix(C.white, C.cobalt200, 0.75 * turn)
			glyph = C.cobalt
		}
		set(c.faceHex, { fill, 'fill-opacity': charged ? 1 : base.toFixed(3) })
		c.glyph.setAttribute('color', glyph)
		c.glyph.setAttribute('opacity', charged ? 1 : base.toFixed(3))
	} else {
		// The back comes up white (the front's edge) and decays to the ghost; the marks on it are pale until the power-on.
		const since = f - fi(c.tOut + c.flip / 2)
		const col = tailColour(TAILS.back, Math.max(0, since)) || GHOST
		set(c.backHex, { fill: col, 'fill-opacity': (base + (1 - base) * tailLevel(TAILS.back, Math.max(0, since))).toFixed(3) })
		if (c.mark) {
			const pale = powered ? 1 : 0.5
			c.mark.setAttribute('opacity', pale)
			if (c.name >= 0) c.mark.parentNode.setAttribute('display', powered && !leaving ? 'none' : 'inline')
		}
	}
}

/* ------------------------------------------------------------ the sound */

/**
 * The sound of conduction, as cues in opening-local time. A mains hum that
 * rises with the charge; a crackle along the front, every cell's arrival a
 * few impulses at that cell's place in the stereo field; an arc and a dry
 * click as the apps light ring by ring; a big arc and a low thud on the heart;
 * two short dry heartbeats while the network is live; a flutter of dry clicks
 * as the tiles turn over, like a split-flap board, the heart and the three
 * name tiles a touch louder; and on the bar 3 downbeat a dry power-on with a
 * crisp click, the hum settling underneath and fading into the film.
 *
 * Round 6 (Ruben): no bell and no tonal ping anywhere; the accent sound is a
 * click. Every click is dry (no reverb send) and varied a little in pitch and
 * level, never a rising figure, so nothing tonal rings after the name lands
 * except the hum. With the handover, four soft clicks as the tiles turn back.
 */
export function openingCues({ handover = true, legacy = false } = {}) {
	const { cells, leaks } = buildCells()
	const cues = []
	const cue = (t, kind, o = {}) => cues.push({ t, kind, ...o })
	const g = rand(9091)
	/** A dry switch click, varied by seed: body 2.2 to 3.0 kHz, level within about 3 dB, never a melody. */
	const click = (t, gain, pan = 0) => cue(t, 'click', { gain: +(gain * (0.8 + 0.4 * g())).toFixed(3), freq: Math.round(2200 + 800 * g()), decay: +(0.006 + 0.004 * g()).toFixed(4), pan: +pan.toFixed(3), seed: 60 + Math.floor(g() * 900), dry: true })

	cue(0, 'hum', {
		dur: OPENING_DURATION + 1.0, base: 49, gain: 0.16, seed: 41,
		// [t, level 0..1, lowpass Hz]: rising with the charge, full and bright when the circuit closes, settling clean on the name
		points: [[0, 0, 110], [0.5, 0.18, 140], [1.2, 0.4, 260], [1.7, 0.62, 520], [1.86, 0.72, 760], [T.connect, 1, 2200], [2.3, 0.82, 1300], [3.0, 0.74, 1100], [3.6, 0.82, 1500], [T.powerOn, 0.62, 520], [4.4, 0.42, 380], [OPENING_DURATION, 0.2, 300], [OPENING_DURATION + 1.0, 0, 240]],
	})
	cue(0.9, 'charge', { dur: T.connect - 0.9, from: 260, to: 1900, gain: 0.05 })

	// The crackle: one event per cell the inward front charges on screen, panned where the cell is.
	const inEvents = []
	for (const c of cells) {
		if (c.app || c.tIn < 0 || !onScreen(c.x, c.y, c.tIn)) continue
		const p = clamp(c.tIn / T.connect)
		inEvents.push([+c.tIn.toFixed(4), +panAt(c.x, c.tIn).toFixed(3), +(0.25 + 0.75 * Math.pow(p, 1.6)).toFixed(3)])
	}
	inEvents.sort((a, b) => a[0] - b[0])
	cue(0, 'crackle', { events: inEvents, gain: 0.3, seed: 21 })

	// The apps light ring by ring on the sixteenths into the heart: an arc and a dry click as each ring starts.
	const byRing = {}
	for (const c of cells) if (c.app && c.k !== '0,0') (byRing[c.ring] ||= []).push(c)
	for (const ring of [3, 2, 1]) {
		const group = byRing[ring]
		const t = Math.min(...group.map((c) => fi(c.tIn) / FPS))
		const pan = group.reduce((a, c) => a + panAt(c.x, t), 0) / group.length
		cue(t, 'arc', { from: 5200, to: 900, dur: 0.07, gain: 0.16, pan, seed: 30 + ring, dry: true })
		click(t, 0.2, pan)
	}
	// The heart: a big arc, a low thud; the camera recoils with it.
	cue(T.connect, 'arc', { from: 7000, to: 180, dur: 0.2, gain: 0.34, index: 7, seed: 39 })
	cue(T.connect, 'impact', { gain: 0.42, from: 105, to: 49, decay: 0.7, seed: 13 }) // lands on the hum's own G
	// Current leaking across the cluster's edge while the network is live: a small crackle per spark.
	cue(0, 'crackle', { events: leaks.map((l) => [+(F(l.f) + F(1)).toFixed(4), +panAt(l.b.x, F(l.f)).toFixed(3), 0.4]).sort((a, b) => a[0] - b[0]), gain: 0.2, seed: 23, burst: 2 })
	// The live network beats twice: short, dry, non-tonal thuds (the drum bus has no reverb send).
	T.pulse.forEach((t) => cue(t, 'kick', { gain: 0.2, pitch: 90, end: 52, decay: 0.12, click: 0.05 }))

	// The turn: a soft whoosh under the glide; the tiles turn over like a split-flap board, a dry click per
	// tile as it goes edge-on, the heart and the three name tiles a touch louder, each with a dry spark.
	cue(T.glide[0], 'whoosh', { dur: T.powerOn - T.glide[0], from: 380, to: 2600, panFrom: -0.1, panTo: 0.25, gain: 0.1, seed: 6 })
	const lead = new Set(['0,0', ...NAME_CELLS])
	for (const c of cells.filter((x) => x.app).sort((a, b) => a.tOut - b.tOut)) {
		const t0 = fi(c.tOut) / FPS
		const edge = t0 + c.flip / 2
		const pan = panAt(c.x, edge)
		if (lead.has(c.k)) {
			cue(t0, 'arc', { from: 6000, to: 1400, dur: 0.06, gain: 0.12, pan, seed: 50 + c.q, dry: true })
			click(edge, 0.24, pan)
		} else click(edge, 0.09, pan)
	}
	const outEvents = []
	for (const c of cells) {
		if (c.app || !onScreen(c.x, c.y, c.tOut) || c.tOut > T.powerOn + 0.3) continue
		outEvents.push([+c.tOut.toFixed(4), +panAt(c.x, c.tOut).toFixed(3), +(0.8 * (1 - 0.55 * inv(0, 1100, c.d))).toFixed(3)])
	}
	outEvents.sort((a, b) => a[0] - b[0])
	cue(0, 'crackle', { events: outEvents, gain: 0.22, seed: 22, freqLo: 1600, freqHi: 9000 })

	// The name powers on: a clean switch, a low thump, and a crisp click on top (round 5: a click, never a bell).
	// Round 6: the name lands on a click, not a ping. No tonal tink (bright 0), and a short, nearly flat
	// thump (a long 118 -> 37 Hz slide read as a 'boing').
	cue(T.powerOn, 'powerOn', { gain: 0.45, from: 64, to: 48, decay: 0.16, bright: 0, seed: 51, dry: true })
	cue(T.powerOn, 'click', { gain: 0.5, freq: 2600, seed: 61, dry: true }) // dry: no reverb 'ting' on the last sound

	// Round 28d: four soft dry clicks as the hexes behind the lockup flip out, and four as they flip back in.
	if (!legacy) {
		for (let i = 0; i < 4; i++) click(T.powerOn - F(5) + F(i) + F(1.5), 0.07, 0.1 + i * 0.12)
		if (handover) for (let i = 0; i < 4; i++) click(T.exit - F(6) + F(i) + F(1.5), 0.06, 0.1 + i * 0.12)
	}
	// The handover: four soft dry clicks as the lockup's tiles turn back, a frame apart.
	if (handover) for (const c of cells.filter((x) => x.exitAt !== null)) click(c.exitAt + EXIT / 2, 0.08, panAt(c.x, c.exitAt))
	return cues
}

/* ------------------------------------------------------------ into a film */

/**
 * Adds the opening to a film at time `at` (seconds, on a bar) and records its
 * sound cues. Returns the time the opening ends, where the film's own first
 * scene starts: `const start = addOpening(film, { at: 0 })`.
 *
 * The film must be 16:9 (1920 x 1080) and must have loaded the brand assets
 * (loadBrandAssets(film.defs)) before the opening renders.
 */
export function addOpening(film, { at = 0, sound = true, handover = true, legacy = false } = {}) {
	film.scene('opening', at, at + OPENING_DURATION, (ctx) => {
		const update = buildOpening(ctx.g, { defs: ctx.defs, handover, legacy })
		return (t) => update(t - at)
	})
	if (sound) for (const c of openingCues({ handover, legacy })) film.cue(at + c.t, c.kind, (({ t, kind, ...o }) => o)(c))
	return at + OPENING_DURATION
}

/* ------------------------------------------------------------ the handover */

/**
 * The field the opening hands over, in screen pixels at T.end (see the
 * contract at the top of this file). A film that wants to build in on the
 * same ground aligns its honeycomb to these numbers, or draws handoverGround()
 * under its first scene and builds on top of it.
 */
export const HANDOVER = (() => {
	const z = Z4
	const s = (R + GAP / SQRT3) * z
	const origin = [960 - LOCK_CX * z, 540]
	return {
		t: OPENING_DURATION,
		zoom: z,
		houseZoom: (z * R) / 150, // 0.85: the ConNext world (R 150, gap 16, rounding 10) seen at this zoom is this field
		R: R * z, // 127.5 px circumradius, pointy-top
		gap: GAP * z, // 13.6 px between neighbours
		round: ROUND * z, // 8.5 px corner rounding
		pitchX: s * SQRT3, // 234.4 px, centre to centre along a row
		pitchY: s * 1.5, // 203.0 px, row to row
		origin, // screen centre of cell (0, 0), where the avatar was: cells sit at origin + (pitchX (q + r/2), pitchY r)
		fill: GHOST, // C.cobalt600 on the C.cobalt ground
		/** Opacity of the cell centred at screen (x, y): full near the frame centre, down to 0.44 at the corners. */
		opacity: (x, y) => 1 - 0.56 * ss(360, 1060, Math.hypot(x - 960, (y - 540) * 1.25)),
		push: (Z4 - Z3) / (OPENING_DURATION - T.powerOn), // zoom per second about the frame centre as the opening ends (0.029)
	}
})()

/** Draws the handover field (the opening's last frame without anything on it) as static cells under parent. */
export function handoverGround(parent) {
	const H = HANDOVER
	const g = el('g', { 'data-layer': 'opening-handover-ground' }, parent)
	for (let r = -4; r <= 4; r++) {
		for (let q = -10; q <= 10; q++) {
			const x = H.origin[0] + H.pitchX * (q + r / 2)
			const y = H.origin[1] + H.pitchY * r
			if (x < -H.R || x > 1920 + H.R || y < -H.R || y > 1080 + H.R) continue
			el('path', { d: hexPath(x, y, H.R, H.round), fill: H.fill, 'fill-opacity': H.opacity(x, y).toFixed(3) }, g)
		}
	}
	return g
}

/** For the storyboard and the checks. */
export const OPENING = { duration: OPENING_DURATION, bars: OPENING_BARS, bpm: BPM, fps: FPS, T, G, camera, lockup: { WM, LOCK_CX, AW, AH }, cluster: CLUSTER, nameCells: NAME_CELLS, handover: HANDOVER }
