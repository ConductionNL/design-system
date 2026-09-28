/**
 * ConNext film, round 5 (storyboard A18): the body's words. 27 on-screen words in the
 * body (the closing pieces carry their own: 2 and 17, _lib/scenes/closing.js), each
 * held for max(1.5 s, 0.4 s x words) from the frame it is fully up, all in the left
 * column of the safe box (x 120 to 1800, y 96 to 930).
 *
 * Hand-over (director, 2026-09-27, unchanged): a caption fully leaves (4 frames) before
 * the next one rises, with at least 2 clear frames between; it rises only once the
 * ground behind it is settled; while it leaves it is glued to the world, so it rides out
 * with its ground if the camera has started to move. Two-line captions lead with line 1
 * by a frame. The body opens on a cut after the shared opening, with "Start a lead."
 * already set (as round 3's frame 1 was).
 *
 * Round 3's version is kept in the review folder (round5/round3-film/scenes/type.js).
 */
import { ease, inv } from '../../_lib/core.js'
import { TYPE, MARK } from '../boards/A18/board.js'
import { T, RISE, EXIT, START } from '../boards/A18/timing.js'
import { glue, glueAttr } from '../lib/camera.js'
import { caption, wordmark } from '../lib/type.js'

const O = START.body

export function buildType(film, camera) {
	const all = []
	const b = (t) => O + t
	const add = (name, start, end, make) => film.scene(name, start, end, (ctx) => {
		const parts = make(ctx)
		all.push(...parts)
		return (t) => parts.forEach((p) => p.set(t))
	})

	/* s1 · set on the cut (no rise), leaves on bar 2 before the apps lift. */
	add('t-s1', b(0), b(T.openOut) + EXIT, (ctx) => [caption(ctx.g, TYPE.s1, { leave: b(T.openOut), camera })])

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

	/* s3 · once the white Filinq hex covers the type column; leaves as the camera hops east. */
	add('t-s3', b(T.s3In) - RISE, b(T.hop1[0]) + EXIT, (ctx) => [caption(ctx.g, TYPE.s3, { rise: b(T.s3In), lead: 0, leave: b(T.hop1[0]), camera })])
	/* s4 · once the white Portaliq ground fills the column; leaves as the camera pulls up to the lane. */
	add('t-s4', b(T.s4In) - RISE, b(T.flowOut[0]) + EXIT, (ctx) => [caption(ctx.g, TYPE.s4, { rise: b(T.s4In), leave: b(T.flowOut[0]), camera })])
	/* s5 · white on the cobalt once the pull up has settled; leaves before the push into Nextcloud. */
	add('t-s5', b(T.s5In) - RISE, b(T.s5Out) + EXIT, (ctx) => [caption(ctx.g, TYPE.s5, { rise: b(T.s5In), leave: b(T.s5Out), camera })])
	/* s6 · white on the cobalt inside the Nextcloud cell, once it fills the column; leaves as the camera hops east. */
	add('t-s6', b(T.s6In) - RISE, b(T.hop3[0]) + EXIT, (ctx) => [caption(ctx.g, TYPE.s6, { rise: b(T.s6In), leave: b(T.hop3[0]), camera })])
	/* s7 · rises with the change it waits on; leaves before the pull out. */
	add('t-s7', b(T.s7In) - RISE, b(T.s7Out) + EXIT, (ctx) => [caption(ctx.g, TYPE.s7, { rise: b(T.s7In), leave: b(T.s7Out), camera })])

	return all
}
