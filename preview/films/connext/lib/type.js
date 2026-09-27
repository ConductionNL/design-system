/**
 * ConNext film, direction A (16:9): type that moves with intent.
 *
 * Every line sits in its own clip box (stage.js textBlock). A line RISES out
 * of its clip from below and LEAVES upward out of it; it never fades. While
 * a caption leaves, it is glued to the world (lib/camera.js glue), so if the
 * camera has started to move it rides out with the ground it sits on and
 * nothing in the world can cross it.
 *
 * Hand-over rules (director, 2026-09-27): a caption fully leaves (4 frames,
 * 3 where a hand-off is tight) before the next one enters, with at least 2
 * clear frames between; it rises only once the ground behind it is settled.
 * The times live in boards/A16/timing.js; the type specs in boards/A16/board.js.
 *
 * Engine addition for this film only; _lib is not edited.
 */
import { el, textBlock, nextId } from '../../_lib/stage.js'
import { ease, inv } from '../../_lib/core.js'
import { MARK_BOX } from '../../_lib/assets.js'
import { glue, glueAttr } from './camera.js'
import { RISE, EXIT } from '../boards/A16/timing.js'

export const TX = 120
/** A masked exit accelerates out of its clip; squared, so each of its frames still shows the move. */
export const leaveCurve = (p) => p * p
/** How far a line travels to clear its clip box (ascenders and descenders included), in font sizes. */
const CLEAR = 1.35

/**
 * A caption. spec: { text, size, y, lineHeight, fill } (board.js TYPE).
 *   rise:    start of the rise, or null to be set from the first frame
 *   lead:    frames each earlier line leads the last one by (the last line is up at rise + RISE)
 *   leave:   start of the exit, or null to hold to the end
 *   exit:    exit duration (default EXIT, 4 frames)
 *   camera:  camera(t), for the glue while leaving
 * Returns { block, set(t), visible(t) }.
 */
export function caption(g, spec, { rise = null, lead = 1, leave = null, exit = EXIT, camera = null, fps = 24 } = {}) {
	const { text, size, y, lineHeight, fill } = spec
	const group = el('g', {}, g)
	const block = textBlock(group, text, { x: TX, y, size, weight: 700, fill, lineHeight, tracking: -0.02 })
	const n = block.lines.length
	const d = size * CLEAR
	const riseAt = (i) => (rise === null ? null : rise - ((n - 1 - i) * lead) / fps)
	const firstRise = rise === null ? -Infinity : riseAt(0)
	const gone = leave === null ? Infinity : leave + exit
	const visible = (t) => t >= firstRise && t < gone
	const set = (t) => {
		if (!visible(t)) { group.setAttribute('display', 'none'); return }
		group.removeAttribute('display')
		block.lines.forEach((line, i) => {
			let dy = 0
			const r = riseAt(i)
			if (r !== null && t < r + RISE) dy = d * (1 - ease.brand(inv(r, r + RISE, t)))
			if (leave !== null && t >= leave) dy = -d * leaveCurve(inv(leave, leave + exit, t))
			const tr = Math.abs(dy) > 1e-3 ? `translate(0 ${dy.toFixed(2)})` : null
			for (const it of line.items) tr ? it.node.setAttribute('transform', tr) : it.node.removeAttribute('transform')
		})
		const gl = leave !== null && t >= leave && camera ? glueAttr(glue(camera(leave), camera(t))) : null
		gl ? group.setAttribute('transform', gl) : group.removeAttribute('transform')
	}
	return { block, group, set, visible }
}

/**
 * The ConNext wordmark (never live type, never recoloured) in a clip box, so
 * it can rise into its slot and leave upward. Placed as the storyboard does:
 * x 117, top y, height h. set({ dy, glueT }) where glueT is a transform
 * string that carries the whole mark (and its clip) with the world.
 */
export function wordmark(g, y, h) {
	const [mw, mh] = MARK_BOX['wordmark-connext-white']
	const w = (mw * h) / mh
	const outer = el('g', {}, g)
	const id = nextId('wm')
	const cp = el('clipPath', { id }, outer)
	const pad = 12
	el('rect', { x: TX - 3 - pad, y: y - pad, width: w + 2 * pad, height: h + 2 * pad }, cp)
	const inner = el('g', { 'clip-path': `url(#${id})` }, outer)
	const mark = el('use', { href: '#wordmark-connext-white', x: TX - 3, y, width: w, height: h }, inner)
	return {
		w, h, clear: h + 2 * pad,
		set({ show = true, dy = 0, glueT = null } = {}) {
			if (!show) { outer.setAttribute('display', 'none'); return }
			outer.removeAttribute('display')
			Math.abs(dy) > 1e-3 ? mark.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`) : mark.removeAttribute('transform')
			glueT ? outer.setAttribute('transform', glueT) : outer.removeAttribute('transform')
		},
	}
}
