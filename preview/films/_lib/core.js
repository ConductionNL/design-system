/**
 * Conduction motion core: pure functions of time.
 *
 * Every value a film draws is computed from t (seconds) and nothing else, so a
 * frame renders identically whether it is played live, scrubbed to, or captured
 * frame by frame. No Date.now(), no requestAnimationFrame deltas, no randomness
 * except the seeded rand() below.
 */

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, p) => a + (b - a) * p
/** Progress of x through [a, b], clamped to 0..1. */
export const inv = (a, b, x) => (b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)))
/** Maps x from [a, b] onto [c, d], clamped. */
export const remap = (x, a, b, c, d, e = ease.linear) => lerp(c, d, e(inv(a, b, x)))

/**
 * CSS-compatible cubic-bezier easing. Newton iterations with a bisection
 * fallback, same approach as the browser, so a curve tuned in devtools reads
 * the same here.
 */
export function bezier(x1, y1, x2, y2) {
	const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
	const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
	const sx = (t) => ((ax * t + bx) * t + cx) * t
	const sy = (t) => ((ay * t + by) * t + cy) * t
	const dx = (t) => (3 * ax * t + 2 * bx) * t + cx
	return (x) => {
		if (x <= 0) return 0
		if (x >= 1) return 1
		let t = x
		for (let i = 0; i < 8; i++) {
			const e = sx(t) - x
			if (Math.abs(e) < 1e-6) return sy(t)
			const d = dx(t)
			if (Math.abs(d) < 1e-6) break
			t -= e / d
		}
		let lo = 0, hi = 1
		t = x
		for (let i = 0; i < 30; i++) {
			const v = sx(t)
			if (Math.abs(v - x) < 1e-6) break
			if (x > v) lo = t
			else hi = t
			t = (lo + hi) / 2
		}
		return sy(t)
	}
}

export const ease = {
	linear: (p) => p,
	inCubic: (p) => p * p * p,
	outCubic: (p) => 1 - Math.pow(1 - p, 3),
	inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
	outQuart: (p) => 1 - Math.pow(1 - p, 4),
	inQuart: (p) => p * p * p * p,
	outQuint: (p) => 1 - Math.pow(1 - p, 5),
	inOutQuint: (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2),
	outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
	inExpo: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
	inOutExpo: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2),
	outBack: (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
	/** The house curves. `brand` decelerates hard into place; `snap` is a whip in and settle. */
	brand: bezier(0.2, 0, 0, 1),
	snap: bezier(0.7, 0, 0.15, 1),
	exit: bezier(0.55, 0, 1, 0.45),
}

/**
 * Damped spring from 0 to 1, as a function of elapsed seconds (not progress).
 * Closed form, so it is exact at any t and needs no simulation state.
 * zeta < 1 overshoots; zeta = 1 is critically damped.
 */
export function spring(sec, { freq = 2.2, zeta = 0.55 } = {}) {
	if (sec <= 0) return 0
	const w = 2 * Math.PI * freq
	if (zeta >= 1) return 1 - Math.exp(-w * sec) * (1 + w * sec)
	const wd = w * Math.sqrt(1 - zeta * zeta)
	return 1 - Math.exp(-zeta * w * sec) * (Math.cos(wd * sec) + ((zeta * w) / wd) * Math.sin(wd * sec))
}

/** Seconds of progress through a segment, eased. */
export const seg = (t, start, dur, e = ease.linear) => e(inv(start, start + dur, t))

/** In, hold, out envelope: 0 -> 1 -> 0. */
export function envelope(t, start, inDur, hold, outDur, eIn = ease.brand, eOut = ease.exit) {
	if (t < start + inDur) return eIn(inv(start, start + inDur, t))
	const outStart = start + inDur + hold
	if (t < outStart) return 1
	return 1 - eOut(inv(outStart, outStart + outDur, t))
}

/** Staggered start time for item i of n across a spread. */
export const stagger = (i, n, spread, from = 'start') => {
	if (n <= 1) return 0
	const k = from === 'center' ? Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) : from === 'end' ? (n - 1 - i) / (n - 1) : i / (n - 1)
	return k * spread
}

/** Seeded PRNG (mulberry32), for deterministic scatter. */
export function rand(seed) {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/* ---------- Colour: solid fills only. Interpolating two solids is still a solid per frame. ---------- */

const hexToRgb = (h) => {
	const n = parseInt(h.slice(1), 16)
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')
export function mix(a, b, p) {
	const x = hexToRgb(a), y = hexToRgb(b)
	return toHex(lerp(x[0], y[0], p), lerp(x[1], y[1], p), lerp(x[2], y[2], p))
}

/* ---------- Pointy-top hex geometry (the only hex the brand allows) ---------- */

export const SQRT3 = Math.sqrt(3)

/** Vertices of a pointy-top hex with circumradius r, starting at the top point, clockwise. */
export function hexPoints(cx, cy, r) {
	const pts = []
	for (let i = 0; i < 6; i++) {
		const a = (Math.PI / 180) * (60 * i - 90)
		pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
	}
	return pts
}
export const hexPointsAttr = (cx, cy, r) => hexPoints(cx, cy, r).map(([x, y]) => x.toFixed(2) + ',' + y.toFixed(2)).join(' ')
/** SVG path for a pointy-top hex, optionally with rounded corners (radius in px). */
export function hexPath(cx, cy, r, round = 0) {
	const p = hexPoints(cx, cy, r)
	if (!round) return 'M' + p.map(([x, y]) => x.toFixed(2) + ' ' + y.toFixed(2)).join('L') + 'Z'
	let d = ''
	for (let i = 0; i < 6; i++) {
		const [x0, y0] = p[(i + 5) % 6], [x1, y1] = p[i], [x2, y2] = p[(i + 1) % 6]
		const l0 = Math.hypot(x0 - x1, y0 - y1), l2 = Math.hypot(x2 - x1, y2 - y1)
		const ax = x1 + ((x0 - x1) / l0) * round, ay = y1 + ((y0 - y1) / l0) * round
		const bx = x1 + ((x2 - x1) / l2) * round, by = y1 + ((y2 - y1) / l2) * round
		d += (i === 0 ? 'M' : 'L') + ax.toFixed(2) + ' ' + ay.toFixed(2) + 'Q' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' ' + bx.toFixed(2) + ' ' + by.toFixed(2)
	}
	return d + 'Z'
}
/** Width of a pointy-top hex of circumradius r (height is 2r). */
export const hexWidth = (r) => SQRT3 * r
/** Centre of axial cell (q, r) in a pointy-top honeycomb with cell circumradius size and a gap. */
export function axialToPixel(q, r, size, gap = 0) {
	const s = size + gap / SQRT3
	return [s * SQRT3 * (q + r / 2), s * 1.5 * r]
}
/** The six neighbours of an axial cell, clockwise from east. */
export const AXIAL_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]
/** Cells in a ring of radius k around (0, 0), clockwise from the east corner. */
export function axialRing(k) {
	if (k === 0) return [[0, 0]]
	const out = []
	let [q, r] = [AXIAL_DIRS[4][0] * k, AXIAL_DIRS[4][1] * k]
	for (let side = 0; side < 6; side++) {
		for (let step = 0; step < k; step++) {
			out.push([q, r])
			q += AXIAL_DIRS[side][0]
			r += AXIAL_DIRS[side][1]
		}
	}
	return out
}
