/**
 * Conduction motion tokens: the house motion system, named, with a role for each curve and spring.
 *
 * A film picks its moves from this file instead of typing a cubic-bezier inline. Every token has one
 * job, so a curve says what the move is: something arriving, leaving, drifting, hitting, coming to
 * rest, or the camera. The film skill (.claude/skills/film/) explains when to use which.
 *
 * Re-derived for 24 fps. At 60 fps almost any curve looks smooth; at 24 a curve that covers most of
 * its travel in the first frame reads as a pop. So every entrance curve carries `minFrames`: the
 * shortest move (in whole frames) where no single frame carries more than half the travel. It is
 * computed from the curve below, never typed, so the number cannot drift from the curve. Springs are
 * kept under 4 Hz (an oscillation spans at least 6 frames, far below the 12 Hz Nyquist limit), and
 * each carries the frame it settles on and its contact frame (the first frame it reaches 1.0, where a
 * sound lands).
 *
 * Additive: core.js keeps ease.brand, ease.snap and ease.exit, and the tokens point at those same
 * functions, so a film that moves to tokens renders identically.
 *
 *   CURVES, SPRINGS          the tokens, each { fn, role, why, ... }
 *   curve(name)(p)           the easing function of a curve token
 *   springAt(name, sec)      a spring token's value at elapsed seconds
 *   frames(sec)              seconds -> whole frames (rounded); F(n) frames -> seconds
 *   durationFor(px, kind)    duration from distance, snapped up to whole frames
 *   peakSpeed(fn, px, sec)   the fastest px per frame a move reaches
 *   withinCeiling(...)       peakSpeed under SPEED_CEILING (whips are exempt)
 *   minDurationFor(...)      the shortest duration that stays under the ceiling
 *   rangeOk(durations)       the slowest move is at least 3x the fastest
 */
import { bezier, ease, spring } from './core.js'

export const FPS = 24
export const F = (n) => n / FPS
export const frames = (sec) => Math.round(sec * FPS)
/** Seconds snapped to the nearest frame (ties round up), the house rounding for every time on the grid. */
export const snapFrame = (sec) => Math.round(sec * FPS) / FPS

/** The largest share of the travel one frame carries when fn runs over n frames, and where. */
export function frameSteps(fn, n) {
	let a = 0, max = 0, first = 0
	for (let i = 1; i <= n; i++) {
		const b = fn(i / n)
		if (i === 1) first = b
		max = Math.max(max, Math.abs(b - a))
		a = b
	}
	return { first, max }
}
/** The shortest whole-frame move in which the first frame carries at most `limit` of the travel. */
export function minFramesFor(fn, limit = 0.5) {
	for (let n = 1; n <= 96; n++) if (frameSteps(fn, n).first <= limit) return n
	return 96
}

/* ---------- curves ---------- */

const def = (fn, role, why, entrance) => ({ fn, role, why, entrance, minFrames: entrance ? minFramesFor(fn) : null })

/**
 * The curve tokens. `bezier` is the CSS cubic-bezier, so a curve reads the same in devtools; `entrance`
 * marks curves that bring something into view (the pop rule applies to them).
 */
export const CURVES = {
	arrive: { ...def(ease.brand, 'arrivals: a word, a card or a window landing in place', 'decelerates hard, so the eye reads the thing at rest almost at once; the house curve since round 1', true), bezier: [0.2, 0, 0, 1] },
	leave: { ...def(ease.exit, 'exits: a caption clearing, a card stepping down, an implosion', 'starts slow and leaves at speed, so the exit is short and never competes with the arrival', false), bezier: [0.55, 0, 1, 0.45] },
	whip: { ...def(ease.snap, 'whips and hex cuts: a move that cuts at its fastest point', 'a whip in and a settle; the cut hides in the fast middle (render with --blur 4)', false), bezier: [0.7, 0, 0.15, 1] },
	drift: { ...def(bezier(0.65, 0, 0.35, 1), 'drifts and colour changes: a slow move, a fill turning', 'symmetric, so a slow move has no visible start or end', true), bezier: [0.65, 0, 0.35, 1] },
	contact: { ...def(bezier(0.55, 0, 0.9, 0.55), 'moving into a hit: a slam, a card landing on its sound', 'accelerates into the end and stops dead; the last frame is the contact frame', false), bezier: [0.55, 0, 0.9, 0.55] },
	rest: { ...def(bezier(0.45, 0, 0.1, 1), 'moves of things already on screen that must end fully still: a token relayed across a seam', 'eases out of rest and into rest, so nothing jumps at either end', true), bezier: [0.45, 0, 0.1, 1] },
	camera: { ...def(bezier(0.6, 0, 0.1, 1), 'camera pushes and pull-backs', 'a gentle start, so a push never reads as a cut, and a long settle onto the subject', true), bezier: [0.6, 0, 0.1, 1] },
}
export const curve = (name) => {
	const c = CURVES[name]
	if (!c) throw new Error(`motion: no curve token "${name}" (have ${Object.keys(CURVES).join(', ')})`)
	return c.fn
}

/* ---------- springs ---------- */

/** First frame at which the spring stays within tol of 1 for good (checked over 4 s). */
function settleFrame(opts, tol = 0.005) {
	let last = 0
	for (let i = 0; i <= 4 * FPS; i++) if (Math.abs(1 - spring(i / FPS, opts)) > tol) last = i + 1
	return last
}
/** The contact frame: the first frame the spring reaches 1.0 (within 0.5% for a critically damped spring). */
function contactFrame(opts) {
	const need = opts.zeta >= 1 ? 0.995 : 1
	for (let i = 0; i <= 4 * FPS; i++) if (spring(i / FPS, opts) >= need) return i
	return null
}
const sdef = (opts, role, why) => {
	const peak = Math.max(...Array.from({ length: 4 * FPS }, (_, i) => spring(i / FPS, opts)))
	return { ...opts, role, why, settle: settleFrame(opts), contact: contactFrame(opts), overshoot: +(Math.max(0, peak - 1)).toFixed(3) }
}

/**
 * The spring tokens, for spring(sec, token). Critically damped unless the token is `land`; `land` is
 * the one real bounce and stays rare: an object that physically drops onto a surface. Never use it to
 * make something pop in (the bible's no-pop rule).
 */
export const SPRINGS = {
	firm: sdef({ freq: 2.2, zeta: 1 }, 'the workhorse: UI pieces, cards, tags settling', 'critically damped, settles in about half a second with no wobble'),
	soft: sdef({ freq: 1.2, zeta: 1 }, 'weight: large panels, big type, the whole picture shifting', 'slow and heavy, reads as mass'),
	snap: sdef({ freq: 3.5, zeta: 1 }, 'small, quick things: a pip, a badge, a toggle', 'fast but still under 4 Hz, so it spans enough frames to read'),
	land: sdef({ freq: 2.0, zeta: 0.6 }, 'one real landing: an object dropping onto a surface, rare', 'about 10 percent overshoot and one visible rebound; never for an entrance'),
}
export const springAt = (name, sec) => {
	const s = SPRINGS[name]
	if (!s) throw new Error(`motion: no spring token "${name}" (have ${Object.keys(SPRINGS).join(', ')})`)
	return spring(sec, s)
}

/* ---------- duration from distance, speed ceiling, range ---------- */

/**
 * Duration grows with distance: a long move takes longer, so it keeps the same felt speed.
 *   element: 0.25 s + 0.6 ms per px, clamped to 6 to 24 frames (a card, a tag, a token)
 *   camera:  0.35 s + 1.35 ms per px, clamped to 0.6 to 2.4 s (a push or a pan, px of travel on the stage)
 * Snapped UP to whole frames so a move never ends between frames.
 */
export const DISTANCE = {
	element: { base: 0.25, perPx: 0.0006, min: F(6), max: F(24) },
	camera: { base: 0.35, perPx: 0.00135, min: 0.6, max: 2.4 },
}
export function durationFor(px, kind = 'element') {
	const d = DISTANCE[kind]
	if (!d) throw new Error(`motion: durationFor kind "${kind}" (element or camera)`)
	const sec = Math.min(d.max, Math.max(d.min, d.base + d.perPx * Math.abs(px)))
	return Math.ceil(sec * FPS - 1e-9) / FPS
}

/**
 * The speed ceiling: 96 px per frame (5% of the 1920 stage width). With the renderer's 0.5 shutter a
 * move at the ceiling smears 48 px, which still reads as motion blur, not a streak. Whips are exempt:
 * they cut at peak speed on purpose.
 */
export const SPEED_CEILING = 96
/** Fastest px per frame of a move of `px` over `sec` seconds on curve fn. */
export function peakSpeed(fn, px, sec) {
	const n = Math.max(1, Math.round(sec * FPS))
	return frameSteps(fn, n).max * Math.abs(px)
}
export const withinCeiling = (fn, px, sec, ceiling = SPEED_CEILING) => fn === ease.snap || peakSpeed(fn, px, sec) <= ceiling
/** The shortest whole-frame duration in which a move of px on fn stays under the ceiling. */
export function minDurationFor(fn, px, ceiling = SPEED_CEILING) {
	for (let n = 1; n <= 240; n++) if (frameSteps(fn, n).max * Math.abs(px) <= ceiling) return n / FPS
	return 240 / FPS
}

/** The rhythm rule: in a scene the slowest move is at least 3x the fastest, so there is contrast. */
export function rangeOk(durations, ratio = 3) {
	const d = durations.filter((x) => x > 0)
	if (d.length < 2) return true
	return Math.max(...d) >= ratio * Math.min(...d)
}

/** The tokens as plain data, for the brand kit page and the skill's table. */
export function tokenTable() {
	return {
		curves: Object.entries(CURVES).map(([name, c]) => ({ name, bezier: c.bezier, role: c.role, why: c.why, minFrames: c.minFrames })),
		springs: Object.entries(SPRINGS).map(([name, s]) => ({ name, freq: s.freq, zeta: s.zeta, role: s.role, why: s.why, settle: s.settle, contact: s.contact, overshoot: s.overshoot })),
		distance: DISTANCE,
		speedCeiling: SPEED_CEILING,
	}
}
