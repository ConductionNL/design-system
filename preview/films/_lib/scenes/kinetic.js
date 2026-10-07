/**
 * Kinetic type: words that arrive on time, on the grid or on the voice.
 *
 * The rules, from the bible and the film skill (.claude/skills/film/references/kinetic-type.md):
 *   - words are revealed whole, never letter by letter, so a reveal can never spell another word on
 *     the way ("Conduct" on the way to "Conduction");
 *   - one reveal system per role, fixed in ROLES below: running words RISE out of their line's mask,
 *     the hero word FLIPS in (turns over like a hex, round 27), a slam word rises on the contact curve
 *     and stops dead. A recipe picks roles; it cannot give a role another reveal;
 *   - nothing pops, scales in or bounces: no back() curve, no overshoot spring;
 *   - the layout is fixed before the first word moves, so a line never reflows while it builds;
 *   - no full stop at the end of an on-screen line (round 6), and a comma that ends a line goes too;
 *   - the line holds max(1.5 s, 0.4 s per word) after its last word is fully up, then leaves upward.
 *
 * Timing comes from one of two places:
 *   voice  words: [{ word, start, end }] from WhisperX (film seconds; add the take's offset first with
 *          wordsAt()). Each word starts its reveal LEAD frames before its spoken onset, so it is
 *          readable on the frame the word is heard (the readable frame, not the end of the tween).
 *   grid   text: 'Words here' with start and stagger (seconds), each onset snapped to a frame.
 *
 * Recipes:
 *   lock   every word rises into its final place on its onset; the line locks together
 *   slam   one word per line, big; each rises on the contact curve and stops dead on its onset,
 *          with a click on the contact frame; at most 3 words (the reader has to keep up)
 *   hero   lock, plus one hero word in orange that flips in (the scene's one orange), with a click
 *
 *   kineticText(parent, spec) -> { update(t), plan }   draw under parent; call update(t) every frame
 *   kineticScene(film, id, spec)                       the same as a film scene, cues included
 *   wordsAt(words, offset)                             WhisperX words shifted to film time
 *   linesFromWords(words, { maxWords })                line breaks at commas, at most maxWords a line
 */
import { el, textBlock } from '../stage.js'
import { inv } from '../core.js'
import { C } from '../brand.js'
import { CURVES, FPS, snapFrame } from '../motion.js'
import { holdFor, wordCount } from '../timeline.js'

const F = (n) => n / FPS

/** One reveal per role. Frozen: a recipe chooses roles, never a role's reveal. */
export const ROLES = Object.freeze({
	line: Object.freeze({ reveal: 'rise', curve: 'arrive', frames: 6, why: 'running words rise out of their line mask, the house caption rise' }),
	hero: Object.freeze({ reveal: 'flip', curve: 'arrive', frames: 5, why: 'the one word that matters turns over in, like a hex (round 27); it carries the orange' }),
	slam: Object.freeze({ reveal: 'rise', curve: 'contact', frames: 4, why: 'a short rise that accelerates and stops dead on the contact frame' }),
})
export const RECIPES = Object.freeze({
	lock: { roles: ['line'], what: 'every word rises into its final place on its onset; the line locks together' },
	slam: { roles: ['slam'], what: 'one word per line, big; each stops dead on its onset with a click', maxWords: 3 },
	hero: { roles: ['line', 'hero'], what: 'the line locks; one hero word in orange flips in on its onset, with a click' },
})
/** Frames a word starts before its spoken onset, so it is readable on the onset frame. */
export const LEAD = 2
/** Frames the whole line takes to leave (upward, on the leave curve), ending at its out time. */
export const EXIT = 4

/** WhisperX words shifted by the take's offset in the film (seconds). */
export const wordsAt = (words, offset = 0) => words.map((w) => ({ ...w, start: +(w.start + offset).toFixed(4), end: +(w.end + offset).toFixed(4) }))

/** Display form of a word at the end of a line: no full stop, no trailing comma (round 6). */
const atLineEnd = (s) => s.replace(/[.,;:]+$/u, '')

/**
 * Line breaks for timed words: break after a word that ends with a comma, and never let a line run
 * past maxWords (5 at 1920 x 1080). Returns arrays of word indices.
 */
export function linesFromWords(words, { maxWords = 5, breakAt = /[,;:]$/u } = {}) {
	const lines = [[]]
	words.forEach((w, i) => {
		const cur = lines[lines.length - 1]
		if (cur.length >= maxWords) lines.push([])
		lines[lines.length - 1].push(i)
		if (breakAt.test(w.word) && i < words.length - 1) lines.push([])
	})
	return lines.filter((l) => l.length)
}

/**
 * Plans the timing: onset, fully-up and role per word, the hold and the out time. Pure; the page and
 * grid-check can call it without drawing.
 */
export function planKinetic(spec) {
	const { recipe = 'lock', start = 0, stagger = F(3), lead = LEAD } = spec
	if (!RECIPES[recipe]) throw new Error(`kinetic: no recipe "${recipe}" (lock, slam, hero)`)
	const timed = Array.isArray(spec.words)
	const raw = timed ? spec.words.map((w) => ({ ...w })) : spec.text.split(/\s+/).filter(Boolean).map((word) => ({ word }))
	if (recipe === 'slam' && raw.length > RECIPES.slam.maxWords) throw new Error(`kinetic: a slam takes at most ${RECIPES.slam.maxWords} words, got ${raw.length}`)
	// Line breaks: explicit (spec.lines as arrays of indices), slam = one word a line, else at commas.
	let lines = spec.lines
	if (!lines) lines = recipe === 'slam' ? raw.map((_, i) => [i]) : linesFromWords(raw, { maxWords: spec.maxWords || 5 })
	const lineOf = []
	lines.forEach((l, li) => l.forEach((i) => { lineOf[i] = li }))
	const heroAt = recipe === 'hero' ? (typeof spec.hero === 'number' ? spec.hero : spec.hero ? raw.findIndex((w) => atLineEnd(w.word).toLowerCase() === String(spec.hero).toLowerCase()) : raw.length - 1) : -1
	if (recipe === 'hero' && heroAt < 0) throw new Error(`kinetic: hero word "${spec.hero}" not in the line`)
	const items = raw.map((w, i) => {
		const role = i === heroAt ? 'hero' : recipe === 'slam' ? 'slam' : 'line'
		const R = ROLES[role]
		const end = lines[lineOf[i]].at(-1) === i
		const display = end ? atLineEnd(w.word) : w.word
		// The onset: the spoken start (voice) or the grid stagger, snapped to a frame. A slam word ENDS its
		// rise on the onset (the contact frame is the beat); every other word starts LEAD frames before it.
		const onset = timed ? snapFrame(w.start) : snapFrame(start + i * stagger)
		const t0 = role === 'slam' ? onset - F(R.frames) : onset - F(lead)
		return { i, word: w.word, display, role, line: lineOf[i], onset, t0, up: t0 + F(R.frames), spoken: timed ? { start: w.start, end: w.end } : null }
	})
	const lastUp = Math.max(...items.map((it) => it.up))
	const words = wordCount(items.map((it) => it.display).join(' '))
	const hold = holdFor(words)
	const out = spec.out != null ? snapFrame(spec.out) : snapFrame(lastUp + hold + F(spec.exit ?? EXIT))
	return { recipe, items, lines, words, hold, lastUp, out, exit: F(spec.exit ?? EXIT), heldFor: +(out - F(spec.exit ?? EXIT) - lastUp).toFixed(3) }
}

/**
 * Draws a kinetic line under `parent` and returns { update(t), plan, cues }. spec:
 *   recipe, words | text (+ start, stagger), hero (index or word), lines, maxWords,
 *   x, y (first baseline), size, lineHeight, fill, accent, weight, out, exit, lead
 * `cues` lists the sound the recipe calls for (clicks on contact frames); the caller records them, or
 * kineticScene() does it for you. With a voice the voice wins: lock adds no sound of its own.
 */
export function kineticText(parent, spec) {
	const plan = planKinetic(spec)
	const { x = 120, y = 520, size = 120, lineHeight = 1.08, fill = C.white, accent = C.orange, weight = 700 } = spec
	const text = plan.lines.map((l) => l.map((i) => (plan.items[i].role === 'hero' ? `*${plan.items[i].display}*` : plan.items[i].display)).join(' ')).join('\n')
	const root = el('g', { 'data-kinetic': plan.recipe }, parent)
	const blk = textBlock(root, text, { x, y, size, weight, fill, accent, lineHeight, tracking: -0.02, clip: true })
	if (blk.items.length !== plan.items.length) throw new Error(`kinetic: laid out ${blk.items.length} words for ${plan.items.length} (a word with a space or markup in it?)`)
	const nodes = blk.items.map((it, k) => ({ ...it, p: plan.items[k] }))
	const d = size * 1.35
	const cues = []
	for (const n of nodes) {
		if (n.p.role === 'slam') cues.push({ t: n.p.onset, kind: 'click', gain: 0.22, freq: 2700, seed: 201 + n.p.i, dry: true })
		if (n.p.role === 'hero') cues.push({ t: n.p.up, kind: 'click', gain: 0.2, freq: 2900, seed: 211, dry: true })
	}
	const update = (t) => {
		const leaving = inv(plan.out - plan.exit, plan.out, t)
		const gone = t >= plan.out
		root.setAttribute('display', gone ? 'none' : 'inline')
		if (gone) return
		for (const n of nodes) {
			const R = ROLES[n.p.role]
			const p = CURVES[R.curve].fn(inv(n.p.t0, n.p.up, t))
			const node = n.node
			if (t < n.p.t0) { node.setAttribute('visibility', 'hidden'); continue }
			node.removeAttribute('visibility')
			// Leaving: the whole line goes up together, accelerating (the leave curve), out of the mask.
			const up = leaving > 0 ? -d * CURVES.leave.fn(leaving) : 0
			if (R.reveal === 'rise') {
				const dy = up + d * (1 - p)
				node.setAttribute('transform', Math.abs(dy) > 1e-3 ? `translate(0 ${dy.toFixed(2)})` : '')
			} else {
				// The flip: the word turns over about its own centre (a horizontal squash, as the hexes do).
				const cx = n.x + n.w / 2
				const sx = Math.max(p, 1e-4)
				node.setAttribute('transform', `translate(0 ${up.toFixed(2)}) translate(${cx.toFixed(2)} 0) scale(${sx.toFixed(4)} 1) translate(${(-cx).toFixed(2)} 0)`)
			}
		}
	}
	update(-1)
	return { update, plan, cues, block: blk, root }
}

/** A kinetic line as its own film scene: visible from its first reveal to its out time, cues recorded. */
export function kineticScene(film, id, spec) {
	const plan = planKinetic(spec)
	const from = Math.max(0, Math.min(...plan.items.map((it) => it.t0)))
	let made = null
	film.scene(id, from, plan.out, (ctx) => {
		made = kineticText(ctx.g, spec)
		return (t) => made.update(t)
	}, { post: 0.001 })
	if (spec.sound !== false) for (const { t, kind, ...o } of made.cues) film.cue(t, kind, o)
	return { plan, from, out: plan.out }
}
