/**
 * ConNext film, direction A (16:9): the words. 32 on-screen words, every one
 * from the approved storyboard plus "It asks first." (Ruben, round 3), each
 * held for max(1.5 s, 0.4 s x words) from the frame it is fully up, all in the
 * left column of the safe box (x 120 to 1800, y 96 to 930) except the install
 * call, one orange line along the foot of the box.
 *
 * Hand-over (director, 2026-09-27): a caption fully leaves (4 frames, 3 on
 * the two tightest hand-offs) before the next one rises, with at least 2 clear
 * frames between; it rises only once the ground behind it is settled; while it
 * leaves it is glued to the world, so it rides out with its ground if the
 * camera has started to move. Two-line captions lead with line 1 by a frame.
 * The end card holds to 18.25 s, then the opener rises again, so the last
 * frames are frame 1.
 */
import { ease, inv } from '../../_lib/core.js'
import { TYPE, MARK } from '../boards/A16/board.js'
import { T, RISE, EXIT, EXIT3, DURATION } from '../boards/A16/timing.js'
import { glue, glueAttr } from '../lib/camera.js'
import { caption, wordmark } from '../lib/type.js'

export function buildType(film, camera) {
	const all = []
	const add = (name, start, end, make) => film.scene(name, start, end, (ctx) => {
		const parts = make(ctx)
		all.push(...parts)
		return (t) => parts.forEach((p) => p.set(t))
	}, { post: end >= DURATION ? 0.001 : 0 })

	/* s1 · frame 1 is the thumbnail: set from the first frame, no fade in; leaves at 2.00 as the push eases into the pull back. */
	add('t-s1', 0, T.openOut + EXIT, (ctx) => [caption(ctx.g, TYPE.s1, { leave: T.openOut, camera })])

	/* s2 · the wordmark rises once the pull back has all but settled, then rides out with the world on the push into Filinq. */
	film.scene('t-s2', T.wmIn - RISE, T.push[0] + 0.5, (ctx) => {
		const wm = wordmark(ctx.g, MARK.s2.y, MARK.s2.h)
		return (t) => {
			if (t < T.push[0]) return wm.set({ dy: wm.clear * (1 - ease.brand(inv(T.wmIn, T.wmIn + RISE, t))) })
			const g = glue(camera(T.push[0]), camera(t))
			if (117 * g.k + g.tx + wm.w * g.k < 0) return wm.set({ show: false }) // off the left edge: gone
			wm.set({ glueT: glueAttr(g) })
		}
	})

	/* s3 · rises once the white Filinq hex covers the type column; leaves as the camera hops east. */
	add('t-s3', T.s3In - RISE, T.hop1[0] + EXIT, (ctx) => [caption(ctx.g, TYPE.s3, { rise: T.s3In, lead: 0, leave: T.hop1[0], camera })]) // both lines together: the hex covers the column's left end only on the rise's first frame
	/* s4 · rises once the white Portaliq ground fills the column; leaves as the camera hops east. */
	add('t-s4', T.s4In - RISE, T.hop2[0] + EXIT, (ctx) => [caption(ctx.g, TYPE.s4, { rise: T.s4In, leave: T.hop2[0], camera })])
	/* s5 · white on the workspace blue, once the blue fills the column; leaves as the camera hops east. */
	add('t-s5', T.s5In - RISE, T.hop3[0] + EXIT, (ctx) => [caption(ctx.g, TYPE.s5, { rise: T.s5In, leave: T.hop3[0], camera })])
	/* s6 · the question beat; leaves (3 frames) once the approval has landed... */
	add('t-s6', T.s6In - RISE, T.s6Out + EXIT3, (ctx) => [caption(ctx.g, TYPE.s6, { rise: T.s6In, lead: 0, leave: T.s6Out, exit: EXIT3, camera })])
	/* s6b · ...and "It asks first." rises two clear frames later, in the same shot; it leaves before the pull out. */
	add('t-s6b', T.s6bIn - RISE, T.s6bOut + EXIT, (ctx) => [caption(ctx.g, TYPE.s6b, { rise: T.s6bIn, leave: T.s6bOut, camera })])

	/* s7-s8 · the end card: the wordmark and the install call rise together once the lit cells have passed the type,
	   hold still across the step-off and the push back in, and leave (3 frames) for the opener. */
	film.scene('t-end', T.ctaIn - RISE, T.ctaOut + EXIT3, (ctx) => {
		const { cue } = ctx
		const wm = wordmark(ctx.g, MARK.end.y, MARK.end.h)
		const cta = caption(ctx.g, TYPE.cta, { rise: T.ctaIn, leave: T.ctaOut, exit: EXIT3, camera })
		all.push(cta)
		cue(T.ctaIn, 'impact', { gain: 0.5, from: 90, to: 32, decay: 1.1 })
		return (t) => {
			cta.set(t)
			if (t >= T.ctaOut) {
				const p = inv(T.ctaOut, T.ctaOut + EXIT3, t)
				return wm.set({ show: p < 1, dy: -wm.clear * p * p, glueT: glueAttr(glue(camera(T.ctaOut), camera(t))) })
			}
			wm.set({ dy: wm.clear * (1 - ease.brand(inv(T.ctaIn, T.ctaIn + RISE, t))) })
		}
	})

	/* s8 · two clear frames after the end card, the opener rises again: the last frames are frame 1. */
	add('t-s1-loop', T.openIn - RISE, DURATION, (ctx) => [caption(ctx.g, TYPE.s1, { rise: T.openIn })])

	return all
}
