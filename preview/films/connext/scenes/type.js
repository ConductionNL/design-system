/**
 * ConNext film, round 6 (storyboard A19): the body's words. No full stop at the end of
 * any line (Ruben, round 6). Every caption is held for max(1.5 s, 0.4 s x words) from the
 * frame it is fully up, in the left column of the safe box (x 120 to 1800, y 96 to 930).
 *
 * Hand-over (round 3, unchanged): a caption fully leaves (4 frames, 3 where tight) before
 * the next rises, with at least 2 clear frames between; it rises only on a settled ground;
 * while it leaves it is glued to the world. Two-line captions lead with line 1 by a frame.
 *
 * s1's line under "Start a lead" is the one exception, on purpose: one line whose words
 * change with each component that loads, a masked swap inside one clip band (the old words
 * leave upward as the new ones rise, both in 4 frames), the action in white and the name in
 * Nextcloud cyan. Each version of the line is its own scene (t-s1-<name>) so the checks can
 * read it; the last holds, then leaves with the headline.
 *
 * The round-5 version is kept in the review folder (round6/round5-film/scenes/type.js).
 */
import { el, textBlock } from '../../_lib/stage.js'
import { ease, inv } from '../../_lib/core.js'
import { TYPE, MARK, LINE, lineText } from '../boards/A19/board.js'
import { T, RISE, EXIT, EXIT3, SWAP, START, LOADS } from '../boards/A19/timing.js'
import { glue, glueAttr } from '../lib/camera.js'
import { caption, wordmark, leaveCurve } from '../lib/type.js'

const O = START.body
const TX = 120

export function buildType(film, camera) {
	const all = []
	const b = (t) => O + t
	const add = (name, start, end, make) => film.scene(name, start, end, (ctx) => {
		const parts = make(ctx)
		all.push(...parts)
		return (t) => parts.forEach((p) => p.set(t))
	})

	/* s1 · rises on the handover field (the opening's last frame is ground and field only, no cut); leaves with its last line. */
	add('t-s1', b(0), b(T.openOut) + EXIT, (ctx) => [caption(ctx.g, TYPE.s1, { rise: b(0), leave: b(T.openOut), camera })])

	/* s1 · the line under it: one version per component, swapping in one clip band. */
	LOADS.forEach((l, i) => {
		const inAt = b(l.at)
		const last = i === LOADS.length - 1
		const outAt = last ? b(T.openOut) : b(LOADS[i + 1].at)
		const outDur = last ? EXIT : SWAP
		film.scene(`t-s1-${l.name.toLowerCase()}`, inAt, outAt + outDur, (ctx) => {
			const group = el('g', {}, ctx.g)
			const blk = textBlock(group, lineText(l), { x: TX, y: LINE.y, size: LINE.size, weight: 700, fill: LINE.fill, accent: LINE.accent, tracking: -0.02 })
			const d = LINE.size * 1.35
			return (t) => {
				let dy = 0
				if (t < inAt + SWAP) dy = d * (1 - ease.brand(inv(inAt, inAt + SWAP, t)))
				if (t >= outAt) dy = -d * leaveCurve(inv(outAt, outAt + outDur, t))
				const tr = Math.abs(dy) > 1e-3 ? `translate(0 ${dy.toFixed(2)})` : null
				for (const it of blk.items) tr ? it.node.setAttribute('transform', tr) : it.node.removeAttribute('transform')
				const gl = last && t >= outAt ? glueAttr(glue(camera(outAt), camera(t))) : null
				gl ? group.setAttribute('transform', gl) : group.removeAttribute('transform')
			}
		})
	})

	/* s2 · the wordmark rises once the pull back has all but settled, then rides out with the world on the push into Filinq. */
	film.scene('t-s2', b(T.wmIn) - RISE, b(T.push[0]) + 0.5, (ctx) => {
		const wm = wordmark(ctx.g, MARK.s2.y, MARK.s2.h)
		return (t) => {
			if (t < b(T.push[0])) return wm.set({ dy: wm.clear * (1 - ease.brand(inv(b(T.wmIn), b(T.wmIn) + RISE, t))) })
			const g = glue(camera(b(T.push[0])), camera(t))
			if (117 * g.k + g.tx + wm.w * g.k < 0) return wm.set({ show: false })
			wm.set({ glueT: glueAttr(g) })
		}
	})

	add('t-s3', b(T.s3In) - RISE, b(T.hop1[0]) + EXIT, (ctx) => [caption(ctx.g, TYPE.s3, { rise: b(T.s3In), lead: 0, leave: b(T.hop1[0]), camera })])
	add('t-s4', b(T.s4In) - RISE, b(T.flowOut[0]) + EXIT, (ctx) => [caption(ctx.g, TYPE.s4, { rise: b(T.s4In), leave: b(T.flowOut[0]), camera })])
	add('t-s5', b(T.s5In) - RISE, b(T.s5Out) + EXIT, (ctx) => [caption(ctx.g, TYPE.s5, { rise: b(T.s5In), leave: b(T.s5Out), camera })])
	add('t-s6', b(T.s6In) - RISE, b(T.hop3[0]) + EXIT, (ctx) => [caption(ctx.g, TYPE.s6, { rise: b(T.s6In), leave: b(T.hop3[0]), camera })])
	/* s7 · the question beat, then "It prepares actions and suggestions" two clear frames later, in the same shot. */
	add('t-s7a', b(T.s7aIn) - RISE, b(T.s7aOut) + EXIT3, (ctx) => [caption(ctx.g, TYPE.s7a, { rise: b(T.s7aIn), leave: b(T.s7aOut), exit: EXIT3, camera })])
	add('t-s7b', b(T.s7bIn) - RISE, b(T.s7bOut) + EXIT, (ctx) => [caption(ctx.g, TYPE.s7b, { rise: b(T.s7bIn), leave: b(T.s7bOut), camera })])

	return all
}
