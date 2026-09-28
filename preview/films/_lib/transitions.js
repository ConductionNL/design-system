/**
 * Scene transitions: designed hand-offs between two body scenes (Round 26, Ruben, 2026-09-28).
 *
 * The current (current.js) is only the FALLBACK: a board that names no transition gets the wire. A
 * board that names one gets a designed hand-off in (from the board before it):
 *
 *   match    match cut: the key element of scene A lifts off, travels, and lands as the key element
 *            of scene B (position, size and colour carry over); B cuts in round it on the beat
 *   grow     shape-becomes-scene (#1): a hex opens out of A's key element with an orange rim and
 *            grows past the frame; B is inside it
 *   zoom     zoom-through: the camera pushes into A's key element, accelerating, and comes out
 *            of the push into B, decelerating onto its key element
 *   hexWipe  stepped hex wipe (#5): four hexes step out from a frame edge, one a frame pair
 *            (no smooth tween), the last covering the frame in the ground colour; hard cut to B
 *   whip     whip-pan on the beat (#11): A leaves left in four frames, B arrives from the right
 *            in five (render --blur 4 for the blur; flat speed streaks carry it in a still)
 *   swap     text-swap held on a diagram (#9): the window holds; the caption swaps, the orange
 *            moves, and B's content steps down into the held frame in three bands
 *   cluster  cluster-to-container (#10): A breaks into loose hexes that drift together into B's
 *            window, arriving together within the beat; the orange one lands on B's key element
 *
 * A board sets it as `transition: { type, from, to, note }`: `from` and `to` are optional anchors
 * (stage px) overriding the measured key elements of A and B; `note` is the director's reason for the
 * pick, written into the board's notes as "Transition in: ...".
 *
 * Rules kept by construction:
 *   - time-driven: every frame is a pure function of t; the cut is the board line (on the beat grid)
 *     and every step sits on frames of the 24 fps grid;
 *   - captions: A's caption is gone (it clears 4 frames before the cut) before anything moves across
 *     the type column; B's caption rises only after the transition leaves the column (capIn), so there
 *     are always at least 2 clear frames; while a caption is visible, the transition's moving layers
 *     are clipped away from the caption column (guard), so nothing crosses a visible caption;
 *   - flat: solid fills, pointy-top hexes, never rotated; one orange at a time; a hex that enters FLIPS in
 *     (turns over by squashing, Round 27), never pops or scales in (the grow and wipe hexes are shapes
 *     that open or step, not cells arriving);
 *   - sound: clicks, ticks, whooshes, arcs; never a bell.
 *
 * Self-contained: imports the engine (stage, core, brand) and current.js for the fallback.
 *
 *   TRANSITIONS                         the registry: { lead, tail, capIn, label, technique, sound }
 *   describe(tr)                        "Transition in: ..." for a board's director notes
 *   playBody(film, boards, opts)        plays body boards (their approved stills) with their hand-offs
 */
import { el } from './stage.js'
import { ease, inv, lerp, clamp, rand, hexPath, spring, SQRT3 } from './core.js'
import { C } from './brand.js'
import { CURRENT, keyElement, landing, sceneCurrent, currentCues } from './current.js'
import { clearFieldUnder } from './ui.js'

const FPS = 24
const F = (n) => n / FPS
const SPB = 60 / 128
const RISE = 0.24
const EXIT = F(4)
/** The type column, where the captions sit: nothing moves across it while a caption is up. */
export const COLUMN = { x0: 96, y0: 230, x1: 905, y1: 720 }

/** The smallest hex radius (pointy-top) centred at (cx, cy) that covers the whole frame. */
function hexCover(cx, cy, W = 1920, H = 1080) {
	const a = SQRT3 / 2
	let need = 0
	for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) {
		const dx = x - cx, dy = y - cy
		need = Math.max(need, Math.abs(dy), Math.abs(dy / 2 + a * dx), Math.abs(dy / 2 - a * dx))
	}
	return need / a
}
const about = (x, y, s, dx = 0, dy = 0) => `translate(${(x + dx).toFixed(2)} ${(y + dy).toFixed(2)}) scale(${Math.max(s, 1e-4).toFixed(4)}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})`

/**
 * The registry. lead: seconds before the cut the hand-off starts; tail: seconds after it ends;
 * capIn: seconds after the cut before B's caption may start to rise (the column is clear again).
 */
export const TRANSITIONS = {
	match: {
		label: 'match cut', technique: 'match cut (key element carries over)', lead: F(6), tail: F(4), capIn: F(2),
		say: (n) => `a match cut: ${n.from} lifts off, travels and lands as ${n.to} (its position, size and orange carry over); the next picture cuts in round it on the beat`,
		sound: 'a tick as it lifts, a short whoosh under the travel, a dry click on the landing',
	},
	grow: {
		label: 'shape becomes the scene', technique: '#1 dot-grows-to-fill (as a hex)', lead: F(4), tail: F(6), capIn: F(6),
		say: (n) => `shape becomes the scene (#1): a hex opens out of ${n.from} with an orange rim and grows past the frame on ease.snap; ${n.to} is inside it`,
		sound: 'a rising whoosh as the hex opens, a dry click as it passes the frame',
	},
	zoom: {
		label: 'zoom-through', technique: 'zoom-through', lead: F(4), tail: F(8), capIn: F(8),
		say: (n) => `zoom-through: the camera pushes into ${n.from}, accelerating, and comes out of the push into the next scene, settling onto ${n.to}`,
		sound: 'a whoosh rising into the push, a low thud on the cut, a click as it settles',
	},
	hexWipe: {
		label: 'stepped hex wipe', technique: '#5 stepped hex wipe', lead: F(7), tail: F(4), capIn: F(3),
		say: (n) => `a stepped hex wipe (#5): four hexes step out of the ${n.edge} edge a frame pair apart (steps, not a tween: cobalt-300, white, cobalt-600, then cobalt covering the frame); hard cut, and ${n.to} lands`,
		sound: 'four ticks rising one a step, a dry click on the cut',
	},
	whip: {
		label: 'whip-pan', technique: '#11 whip-pan on the beat', lead: F(4), tail: F(5), capIn: F(2),
		say: (n) => `a whip-pan on the beat (#11): the picture leaves left in four frames and the next arrives from the right in five, landing on ${n.to}`,
		sound: 'a fast whoosh panned left to right across the cut, a dry click as it lands',
	},
	swap: {
		label: 'text-swap on a held window', technique: '#9 text-swap on a held diagram', lead: 0, tail: F(4), capIn: F(1),
		say: (n) => `text-swap on a held window (#9): the window holds, the caption swaps, and the new content steps down into it in three bands, the orange moving to ${n.to}`,
		sound: 'a dry click on the swap and two soft ticks as the bands step down',
	},
	cluster: {
		label: 'cluster to container', technique: '#10 cluster-to-container merge', lead: F(4), tail: F(8), capIn: F(4),
		say: (n) => `cluster to container (#10): the picture breaks into loose hexes that drift together into the next window, arriving together on the beat, the orange one landing on ${n.to}`,
		sound: 'a scatter of ticks as the hexes drift, a soft whoosh, a dry click as they merge',
	},
	current: {
		label: 'the current (fallback)', technique: 'the current (Round 24 fallback)', lead: 0, tail: CURRENT.run + 0.15, capIn: 0,
		say: (n) => `the current (the fallback): a hard cut, then the wire runs from the last scene's key element to ${n.to} and powers it on`,
		sound: 'a crackle along the wire, an arc and a dry click on arrival',
	},
}

/** "Transition in: ..." for a board's director notes. */
export function describe(tr, { from = "the last scene's key element", to = "this scene's key element", edge = 'right' } = {}) {
	const T = TRANSITIONS[tr?.type || 'current']
	if (!T) return ''
	const why = tr?.note ? ` Why: ${tr.note}` : ''
	return `Transition in: ${T.say({ from: tr?.fromName || from, to: tr?.toName || to, edge: tr?.edge || edge })}. Sound: ${T.sound}.${why}`
}

/* ---------- measuring a rendered board ---------- */

const ORANGE = C.orange.toUpperCase()
/** The scene's key element with its node: the largest orange shape (the scene's answer), in stage px. */
function findKey(g, exclude = []) {
	const svg = g.ownerSVGElement
	const box = svg.getBoundingClientRect()
	const k = svg.viewBox.baseVal.width / box.width
	const hits = []
	for (const e of g.querySelectorAll('*')) {
		const f = (e.getAttribute('fill') || '').toUpperCase(), s = (e.getAttribute('stroke') || '').toUpperCase()
		if (f !== ORANGE && s !== ORANGE) continue
		if (e.closest('[data-current]') || e.closest('clipPath')) continue
		const r = e.getBoundingClientRect()
		if (!r.width && !r.height) continue
		hits.push({ x: (r.left + r.width / 2 - box.left) * k, y: (r.top + r.height / 2 - box.top) * k, w: r.width * k, h: r.height * k, node: e })
	}
	const far = hits.filter((h) => !exclude.some(([x, y]) => Math.hypot(h.x - x, h.y - y) < 70))
	return (far.length ? far : hits).sort((a, b) => b.w * b.h - a.w * a.h)[0] || null
}
/** The bounding box of a group in stage px (display must be on). */
function stageBox(node) {
	const svg = node.ownerSVGElement
	const box = svg.getBoundingClientRect()
	const k = svg.viewBox.baseVal.width / box.width
	const r = node.getBoundingClientRect()
	return { x: (r.left - box.left) * k, y: (r.top - box.top) * k, w: r.width * k, h: r.height * k }
}
/** The picture's container: the union of its parts that are not full-frame grounds. */
function containerOf(pic) {
	let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
	for (const c of pic.children) {
		const b = stageBox(c)
		if (!b.w || !b.h || b.w >= 1800) continue
		x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h)
	}
	if (!isFinite(x0)) return { x: 940, y: 150, w: 860, h: 780 }
	return { x: Math.max(x0, 0), y: Math.max(y0, 0), w: Math.min(x1, 1920) - Math.max(x0, 0), h: Math.min(y1, 1080) - Math.max(y0, 0) }
}
/** A copy of the key element (its tag group when it has one) in stage coordinates, for a match cut. */
function tokenOf(key, host) {
	if (!key) return null
	let n = key.node
	const area = key.w * key.h
	const p = n.parentNode
	if (p && p.tagName === 'g' && !p.hasAttribute('data-role') && p.childElementCount <= 6) {
		const b = stageBox(p)
		if (b.w * b.h <= area * 2.6) n = p
	}
	const m = host.getCTM().inverse().multiply(n.parentNode.getCTM())
	return { node: n, matrix: `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((v) => +v.toFixed(4)).join(' ')})` }
}

/**
 * Round 27c audit: every hex should sit exactly on a grid cell at the grid size. Lists the hex-shaped
 * paths of a picture (stage px) and the pairs that overlap without sharing a centre (a hex floating over
 * another, or over the field). Concentric pairs (a tag's ring round its hex) are fine.
 */
function hexAudit(pic) {
	const hexes = []
	for (const e of pic.querySelectorAll('path')) {
		if (e.closest('clipPath') || e.closest('[data-current]')) continue
		const d = e.getAttribute('d') || ''
		if ((d.match(/[LQ]/g) || []).length < 5) continue
		const b = stageBox(e)
		if (b.w < 16 || Math.abs(b.w / b.h - SQRT3 / 2) > 0.06) continue
		hexes.push({ x: +(b.x + b.w / 2).toFixed(1), y: +(b.y + b.h / 2).toFixed(1), r: +(b.h / 2).toFixed(1), fill: e.getAttribute('fill') })
	}
	const clashes = []
	for (let i = 0; i < hexes.length; i++) for (let j = i + 1; j < hexes.length; j++) {
		const a = hexes[i], b = hexes[j]
		const dist = Math.hypot(a.x - b.x, a.y - b.y)
		if (dist < 3) continue
		if (dist < (a.r + b.r) * 0.84) clashes.push({ a, b, dist: +dist.toFixed(1) })
	}
	return { count: hexes.length, radii: [...new Set(hexes.map((h) => Math.round(h.r)))].sort((p, q) => p - q), clashes }
}

/* ---------- the caption: rises out of its line, leaves upward ---------- */

let capIds = 0
function captionLines(capG) {
	if (!capG) return []
	const lines = []
	const groups = [...capG.querySelectorAll(':scope > g')].length ? [...capG.querySelectorAll(':scope > g')] : [capG]
	groups.forEach((lg) => {
		const b = lg.getBBox()
		if (!b.width) return
		const id = `tcap${++capIds}`
		const cp = el('clipPath', { id }, capG)
		el('rect', { x: b.x - 30, y: b.y + 2, width: b.width + 60, height: b.height + 10 }, cp)
		const wrap = el('g', { 'clip-path': `url(#${id})` }, capG)
		const inner = el('g', {}, wrap)
		inner.appendChild(lg)
		lines.push({ inner, h: b.height + 24 })
	})
	return lines
}

/** Caption state at time t: rises from t0 (line i a sixteenth-frame pair later), leaves from t1. */
function drawCaption(cap, t, t0, t1) {
	if (!cap) return false
	const on = t >= t0 && t < t1
	cap.g.setAttribute('display', on ? 'inline' : 'none')
	if (!on) return false
	cap.lines.forEach((l, i) => {
		const pIn = ease.brand(inv(t0 + i * F(2), t0 + i * F(2) + RISE, t))
		const pOut = ease.exit(inv(t1 - EXIT, t1, t))
		const dy = l.h * (1 - pIn) - l.h * pOut
		l.inner.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`)
	})
	return true
}

/* ---------- the guard: nothing crosses a visible caption ---------- */

let guardId = null
function guardDefs(defs, W, H) {
	if (guardId) return guardId
	guardId = 'tguard'
	const cp = el('clipPath', { id: guardId }, defs)
	el('path', { d: `M0 0H${W}V${H}H0Z M${COLUMN.x0} ${COLUMN.y0}V${COLUMN.y1}H${COLUMN.x1}V${COLUMN.y0}Z`, 'clip-rule': 'evenodd' }, cp)
	return guardId
}

/* ---------- the transitions, one frame each ---------- */

/**
 * Draws one frame of a hand-off. A and B: { pic (a group to transform), key, box, token };
 * over: the overlay group (cleared by the caller); u: seconds from the cut (negative before it).
 */
const DRAW = {
	match(u, A, B, over, o) {
		const T = TRANSITIONS.match
		const a = o.from || [A.key.x, A.key.y], b = o.to || [B.key.x, B.key.y]
		const k = ease.inOutCubic(inv(-T.lead, 0, u))
		// A drops away round its key element: it holds two frames, then shrinks into it over three (no
		// fade: an orange fading over cobalt reads as brown).
		const aOut = ease.exit(inv(-T.lead + F(2), -T.lead + F(5), u))
		if (aOut >= 1) A.pic.setAttribute('display', 'none')
		else if (aOut > 0) A.pic.setAttribute('transform', about(a[0], a[1], 1 - aOut))
		if (u < 0) {
			B.pic.setAttribute('display', 'none')
			// One orange at a time: the token is the key element now, so the original steps out of A.
			if (A.token) A.token.node.setAttribute('visibility', 'hidden')
			const sA = Math.sqrt(A.key.w * A.key.h), sB = Math.sqrt(B.key.w * B.key.h)
			const s = lerp(1, sB / Math.max(sA, 1), k) * (1 + 0.12 * Math.sin(Math.PI * k))
			const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k)
			if (A.token) {
				const g = el('g', { transform: `translate(${(x - a[0]).toFixed(2)} ${(y - a[1]).toFixed(2)}) ${about(a[0], a[1], s)}` }, over)
				const inner = el('g', { transform: A.token.matrix }, g)
				const copy = inner.appendChild(A.token.node.cloneNode(true))
				copy.removeAttribute('visibility')
			} else el('path', { d: hexPath(x, y, 40 * s, 6), fill: C.orange }, over)
		} else {
			// On the beat B cuts in round the landed element, with a small settle about it.
			A.pic.setAttribute('display', 'none')
			const s = 1 + 0.05 * (1 - ease.brand(inv(0, T.tail, u)))
			B.pic.setAttribute('transform', about(b[0], b[1], s))
		}
	},
	grow(u, A, B, over, o, W, H) {
		const T = TRANSITIONS.grow
		const [cx, cy] = o.from || [A.key.x, A.key.y]
		const r0 = Math.max(24, Math.min(A.key.w, A.key.h) / 2)
		const R = hexCover(cx, cy, W, H) + 20
		const k = ease.snap(inv(-T.lead, T.tail, u))
		const r = lerp(r0, R, k)
		const id = `tgrow${o.i}`
		const cp = el('clipPath', { id }, over)
		el('path', { d: hexPath(cx, cy, r, 0) }, cp)
		B.pic.setAttribute('clip-path', `url(#${id})`)
		// The rim: the key element's orange, thinning as it grows, gone once past the frame.
		const w = 14 * (1 - k)
		if (w > 0.6) el('path', { d: hexPath(cx, cy, r + w / 2, 0), fill: 'none', stroke: C.orange, 'stroke-width': w.toFixed(2), 'data-guard': 1 }, over)
		// The ground inside the hex: B sits on the stage cobalt, over A.
		el('path', { d: hexPath(cx, cy, r, 0), fill: C.cobalt }, B.under)
	},
	zoom(u, A, B, over, o) {
		const T = TRANSITIONS.zoom
		const a = o.from || [A.key.x, A.key.y], b = o.to || [B.key.x, B.key.y]
		if (u < 0) {
			B.pic.setAttribute('display', 'none')
			const k = ease.inCubic(inv(-T.lead, 0, u))
			const s = 1 + 7 * k
			// Pull the key element to the frame's centre as the camera pushes in.
			const dx = (960 - a[0]) * k, dy = (540 - a[1]) * k
			A.pic.setAttribute('transform', about(a[0], a[1], s, dx, dy))
		} else {
			A.pic.setAttribute('display', 'none')
			const k = ease.outCubic(inv(0, T.tail, u))
			// Out of the push: B arrives slightly large and settles onto its key element (no fade).
			const s = lerp(1.4, 1, k)
			B.pic.setAttribute('transform', about(b[0], b[1], s))
		}
	},
	hexWipe(u, A, B, over, o, W, H) {
		const T = TRANSITIONS.hexWipe
		const y = o.from ? o.from[1] : clamp(A.key.y, 200, 880)
		const cx = o.edge === 'left' ? -40 : W + 40
		const R = hexCover(cx, y, W, H) + 10
		const steps = [[-F(7), 0.24, C.cobalt300], [-F(5), 0.46, C.white], [-F(3), 0.7, C.cobalt600], [-F(1), 1, C.cobalt]]
		if (u < 0) {
			B.pic.setAttribute('display', 'none')
			steps.forEach(([t0, f, fill]) => {
				if (u < t0) return
				// A step: on in one frame at its full size (a mechanical step, never a tween or a scale-in).
				const r = R * f
				el('path', { d: hexPath(cx, y, r, 0), fill, 'data-guard': 1 }, over)
			})
		} else {
			A.pic.setAttribute('display', 'none')
			const k = ease.brand(inv(0, T.tail, u))
			B.pic.setAttribute('transform', `translate(0 ${(50 * (1 - k)).toFixed(1)})`)
		}
	},
	whip(u, A, B, over, o, W) {
		const T = TRANSITIONS.whip
		if (u < 0) {
			B.pic.setAttribute('display', 'none')
			const k = ease.inCubic(inv(-T.lead, 0, u))
			A.pic.setAttribute('transform', `translate(${(-W * 1.1 * k).toFixed(1)} 0)`)
		} else {
			A.pic.setAttribute('display', 'none')
			const k = ease.outCubic(inv(0, T.tail, u))
			// B is already in the frame on the first frame after the cut (from 70% of the width out).
			B.pic.setAttribute('transform', `translate(${(W * 0.7 * (1 - k)).toFixed(1)} 0)`)
		}
		// Flat speed streaks across the move, two frames either side of the cut.
		const s = inv(-F(3), F(3), u)
		if (s > 0 && s < 1) {
			const R = rand(97 + o.i)
			for (let i = 0; i < 6; i++) {
				const yy = 180 + R() * 720, len = 300 + R() * 600
				const x = lerp(W + 200, -len - 200, (s + R() * 0.3) % 1)
				el('rect', { x: x.toFixed(1), y: yy.toFixed(1), width: len.toFixed(1), height: 4, fill: C.cobalt300, 'data-guard': 1 }, over)
			}
		}
	},
	swap(u, A, B, over, o) {
		const T = TRANSITIONS.swap
		if (u < 0) { B.pic.setAttribute('display', 'none'); return }
		// The window holds (A under B); B's content steps down into it in three bands, a frame pair apart.
		const bx = B.box, n = u < F(2) ? 1 : u < F(4) ? 2 : 3
		if (u >= T.tail) { A.pic.setAttribute('display', 'none'); return }
		const id = `tswap${o.i}`
		const cp = el('clipPath', { id }, over)
		el('rect', { x: bx.x - 40, y: bx.y - 40, width: bx.w + 80, height: (bx.h + 80) * (n / 3) }, cp)
		B.pic.setAttribute('clip-path', `url(#${id})`)
		// The step's edge: a thin cobalt-300 line where the new content stops.
		if (n < 3) el('rect', { x: bx.x, y: (bx.y - 40 + (bx.h + 80) * (n / 3) - 2).toFixed(1), width: bx.w, height: 4, fill: C.cobalt300, 'data-guard': 1 }, over)
	},
	cluster(u, A, B, over, o) {
		const T = TRANSITIONS.cluster
		const R = rand(211 + o.i)
		const a = A.box, b = B.box
		const arrive = F(4)
		// B's window as a tight honeycomb: the slots the loose hexes drift into.
		const rr = Math.max(34, Math.sqrt((b.w * b.h) / (28 * 2.6)))
		const slots = []
		for (let row = 0; row * rr * 1.5 < b.h + rr; row++) {
			for (let col = 0; col * rr * SQRT3 < b.w + rr; col++) {
				const x = b.x + rr * 0.6 + col * rr * SQRT3 + (row % 2) * rr * SQRT3 / 2, y = b.y + rr * 0.6 + row * rr * 1.5
				if (x < b.x + b.w + rr * 0.3 && y < b.y + b.h + rr * 0.3) slots.push([x, y])
			}
		}
		// A shrinks away into the hexes as they break loose from it (no fade).
		const kA = inv(-T.lead, -T.lead + F(3), u)
		if (kA >= 1) A.pic.setAttribute('display', 'none')
		else A.pic.setAttribute('transform', about(a.x + a.w / 2, a.y + a.h / 2, 1 - 0.6 * ease.exit(kA)))
		if (u < arrive) B.pic.setAttribute('display', 'none')
		else {
			const k = ease.brand(inv(arrive, T.tail, u))
			B.pic.setAttribute('transform', about(b.x + b.w / 2, b.y + b.h / 2, lerp(0.96, 1, k)))
		}
		const bk = o.to || [B.key.x, B.key.y]
		// The honeycomb holds one frame as the window's shape, then the window cuts in (no dissolve).
		const gone = u < arrive + F(1) ? 1 : 0
		if (gone <= 0) return
		slots.forEach(([ex, ey], i) => {
			// Start loose over A's picture, right of the type column, a little way out from its centre.
			const ang = R() * Math.PI * 2, rad = 0.2 + R() * 0.6
			const sx = Math.max(COLUMN.x1 + 40, a.x + a.w / 2 + Math.cos(ang) * a.w * 0.5 * rad), sy = a.y + a.h / 2 + Math.sin(ang) * a.h * 0.5 * rad
			const t0 = -T.lead + R() * F(2)
			const k = ease.brand(inv(t0, arrive, u))
			// Each hex flips in (turns over by squashing, Round 27), then grows to its slot as it drifts.
			const flip = ease.outCubic(inv(t0, t0 + F(3), u))
			const r = lerp(14 + R() * 10, rr * 1.03, ease.inCubic(k))
			if (u < t0 || flip <= 0.001) return
			const cx = lerp(sx, ex, k), cy = lerp(sy, ey, k)
			el('path', { d: hexPath(cx, cy, r, r * 0.12), fill: i % 5 ? C.white : C.cobalt100, transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${flip.toFixed(4)} 1) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`, 'data-guard': 1 }, over)
		})
		// The orange one: the key element, travelling from A's to B's.
		const ka = ease.brand(inv(-T.lead + F(1), arrive, u))
		const [ax, ay] = o.from || [A.key.x, A.key.y]
		const r = lerp(18, Math.max(22, Math.min(B.key.w, B.key.h) / 2), ka) * gone
		el('path', { d: hexPath(lerp(ax, bk[0], ka), lerp(ay, bk[1], ka), r, r * 0.12), fill: C.orange, 'data-guard': 1 }, over)
	},
	current(u, A, B, over, o) {
		if (u < 0) { B.pic.setAttribute('display', 'none'); return }
		A.pic.setAttribute('display', 'none')
		const from = o.from || (A.key ? [A.key.x, A.key.y] : CURRENT.origin)
		const key = o.to ? { x: o.to[0], y: o.to[1], w: 60, h: 60 } : B.key
		if (!key) return
		sceneCurrent(over, u, { from, to: landing(key, from), element: key, headColor: C.nextcloudCyan, t0: 0.15 })
	},
}

/** The sound of one hand-off, on the film's cue list. */
export function transitionCues(type, cue, cut) {
	const T = TRANSITIONS[type]
	switch (type) {
	case 'match':
		cue(cut - T.lead, 'tick', { freq: 1760, gain: 0.1, pan: 0.3 })
		cue(cut - T.lead + F(1), 'whoosh', { dur: T.lead, from: 900, to: 2400, panFrom: 0.3, panTo: -0.1, gain: 0.07 })
		cue(cut, 'click', { gain: 0.26, freq: 2800, seed: 101, dry: true })
		break
	case 'grow':
		cue(cut - T.lead, 'whoosh', { dur: T.lead + T.tail, from: 600, to: 2800, panFrom: 0.3, panTo: 0, gain: 0.09 })
		cue(cut + F(2), 'click', { gain: 0.24, freq: 2600, seed: 102, dry: true })
		break
	case 'zoom':
		cue(cut - T.lead - F(2), 'whoosh', { dur: T.lead + F(4), from: 400, to: 3200, panFrom: 0, panTo: 0, gain: 0.11 })
		cue(cut, 'impact', { gain: 0.16, from: 100, to: 45, decay: 0.3 })
		cue(cut + T.tail, 'click', { gain: 0.22, freq: 2900, seed: 103, dry: true })
		break
	case 'hexWipe':
		[-F(7), -F(5), -F(3), -F(1)].forEach((d, i) => cue(cut + d, 'tick', { freq: 1318.51 * Math.pow(2, i / 4), gain: 0.1 + i * 0.02, pan: 0.5 - i * 0.2 }))
		cue(cut, 'click', { gain: 0.28, freq: 2700, seed: 104, dry: true })
		break
	case 'whip':
		cue(cut - T.lead, 'whoosh', { dur: T.lead + T.tail, from: 3200, to: 700, panFrom: -0.6, panTo: 0.6, gain: 0.13 })
		cue(cut + T.tail, 'click', { gain: 0.26, freq: 3000, seed: 105, dry: true })
		break
	case 'swap':
		cue(cut, 'click', { gain: 0.26, freq: 2600, seed: 106, dry: true })
		cue(cut + F(2), 'tick', { freq: 1760, gain: 0.07, pan: 0.3 })
		cue(cut + F(4), 'tick', { freq: 1975.53, gain: 0.07, pan: 0.35 })
		break
	case 'cluster': {
		const R = rand(311)
		for (let i = 0; i < 8; i++) cue(cut - T.lead + F(1) + R() * (T.lead + F(4)), 'tick', { freq: 1760 + R() * 900, gain: 0.05, decay: 0.03, pan: -0.2 + R() * 0.8 })
		cue(cut - T.lead, 'whoosh', { dur: T.lead + F(5), from: 700, to: 1800, panFrom: 0.4, panTo: 0.2, gain: 0.06 })
		cue(cut + F(5), 'click', { gain: 0.26, freq: 2800, seed: 107, dry: true })
		break
	}
	default:
		currentCues(cue, cut + 0.15)
	}
}

/* ---------- the player: body boards with their hand-offs ---------- */

/**
 * The hand-offs of a body: one per board after the first. A board without a transition gets the
 * current (the fallback). Times are film seconds; B's caption rises at max(its own rise, cut + capIn).
 */
export function handOffs(boards) {
	return boards.slice(1).map((b, j) => {
		const tr = b.transition && TRANSITIONS[b.transition.type] ? b.transition : { type: 'current' }
		const T = TRANSITIONS[tr.type]
		const cut = b.start
		return { i: j + 1, from: boards[j].id, to: b.id, type: tr.type, tr, cut, start: cut - T.lead, end: cut + T.tail, capIn: cut + T.capIn }
	})
}

/** When each board's caption rises and clears (film seconds), and the hold it is left with. */
export function captionTimes(boards, hands, need = () => 0) {
	return boards.map((b, i) => {
		const h = hands.find((x) => x.i === i)
		const t0 = Math.max(b.shows - RISE, h ? h.capIn : b.start)
		return { id: b.id, t0, t1: b.clears, hold: +(b.clears - (t0 + RISE)).toFixed(2), need: need(b) }
	})
}

/**
 * Plays the body boards as their approved stills, cut by their hand-offs, on the film's clock.
 *   playBody(film, boards, { t0, need, exclude })
 *     t0       the film time of the page's t = 0
 *     need     (board) => the reading hold its caption needs, for the caption report
 *     exclude  points whose orange is not a key element (the app tag on the loop anchor)
 * Returns { hands, caps } for the page's board data.
 */
export function playBody(film, boards, { t0 = 0, need, exclude = [], audit = null } = {}) {
	const hands = handOffs(boards)
	const caps = captionTimes(boards, hands, need)
	const dur = film.duration
	film.scene('body', 0, dur, (ctx) => {
		const stage = el('g', { 'data-part': 'pictures' }, ctx.g)
		const over = el('g', { 'data-part': 'transition' }, ctx.g)
		const hud = el('g', { 'data-part': 'type' }, ctx.g)
		const layers = boards.map((b) => {
			const g = el('g', { 'data-board': b.id, display: 'none' }, stage)
			const under = el('g', {}, g)
			const src = el('g', {}, g)
			const bctx = Object.assign(Object.create(ctx), { g: src, start: 0, end: 1 })
			const up = (b.drawBase || b.draw)(bctx)
			if (typeof up === 'function') up(0.5)
			// Split into picture, mark and caption: the mark and the caption go above the transition.
			const mark = src.querySelector('[data-role=mark]')
			const capG = src.querySelector('[data-role=caption]')
			const top = el('g', { 'data-board': b.id, display: 'none' }, hud)
			if (mark) top.appendChild(mark)
			if (capG) top.appendChild(capG)
			return { b, g, under, pic: src, top, mark, capG }
		})
		const gid = guardDefs(ctx.defs, ctx.W, ctx.H)
		const measure = () => {
			for (const L of layers) {
				L.g.setAttribute('display', 'inline')
				L.top.setAttribute('display', 'inline')
				clearFieldUnder(L.pic)
				L.key = findKey(L.pic, L.b.id === 'promise' ? [] : exclude)
				if (L.b.currentAnchor) L.key = { ...(L.key || {}), x: L.b.currentAnchor[0], y: L.b.currentAnchor[1], w: L.key?.w || 60, h: L.key?.h || 60 }
				if (!L.key) L.key = { x: 1370, y: 540, w: 60, h: 60 }
				L.box = containerOf(L.pic)
				L.token = L.key.node ? tokenOf(L.key, over) : null
				L.cap = L.capG ? { g: L.capG, lines: captionLines(L.capG) } : null
				if (audit) audit[L.b.id] = hexAudit(L.pic)
				L.g.setAttribute('display', 'none')
				L.top.setAttribute('display', 'none')
			}
		}
		let measured = false
		return (t) => {
			if (!measured) { measure(); measured = true }
			const ft = t + t0
			over.replaceChildren()
			over.removeAttribute('clip-path')
			let capUp = false
			layers.forEach((L, i) => {
				const b = L.b
				const h = hands.find((x) => x.i === i), hn = hands.find((x) => x.i === i + 1)
				const lo = h ? h.start : b.start, hi = hn ? hn.end : b.end
				const on = ft >= lo && ft < hi
				L.g.setAttribute('display', on ? 'inline' : 'none')
				L.top.setAttribute('display', on ? 'inline' : 'none')
				L.under.replaceChildren()
				if (!on) return
				for (const a of ['transform', 'opacity', 'clip-path', 'display']) L.pic.removeAttribute(a)
				if (L.token) L.token.node.removeAttribute('visibility')
				// One mark at a time: the outgoing board's until the cut, then the incoming one's.
				if (L.mark) L.mark.setAttribute('display', (!h || ft >= h.cut) && (!hn || ft < hn.cut) ? 'inline' : 'none')
				if (drawCaption(L.cap, ft, caps[i].t0, caps[i].t1)) capUp = true
			})
			// The hand-off that is running, if any; after a fallback hand-off the wire stays, arrived.
			const h = hands.find((x) => ft >= x.start && ft < x.end)
			const rest = !h && hands.find((x) => x.type === 'current' && ft >= x.end && ft < boards[x.i].end)
			const run = h || rest
			if (run) {
				const A = layers[run.i - 1], B = layers[run.i]
				const o = { i: run.i, from: run.tr.from, to: run.tr.to, edge: run.tr.edge }
				DRAW[run.type](ft - run.cut, A, B, over, o, ctx.W, ctx.H)
				// The guard: while a caption is up, the moving layers keep out of the type column.
				if (capUp && h) {
					over.setAttribute('clip-path', `url(#${gid})`)
					for (const P of [A.pic, B.pic]) if (P.getAttribute('transform')) P.setAttribute('clip-path', `url(#${gid})`)
				}
			}
		}
	}, { post: 0.001 })
	hands.forEach((h) => transitionCues(h.type, (t, kind, o) => { if (t - t0 >= 0 && t - t0 <= dur) film.cue(t - t0, kind, o) }, h.cut))
	return { hands, caps }
}
