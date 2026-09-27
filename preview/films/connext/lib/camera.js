/**
 * ConNext film, direction A ("One take"), 16:9: the one camera.
 *
 * A camera is { x, y, z, px, py }: world point (x, y) lands on screen point
 * (px, py) at zoom z, the shape boards/A16/world.js draws with. The film's
 * camera is ONE function of t, built from:
 *
 *   rests  an approved key camera that the take passes through exactly at its
 *          key time, drifting slowly (log-zoom rate about a screen pivot, plus
 *          a pan), so the camera never parks dead;
 *   moves  eased blends from one drifting rest to the next. A move reads both
 *          rests at the same t, so its start and end velocities are the
 *          drifts' own and nothing ever cuts.
 *
 * Two kinds of move:
 *   pivot  a push or pull: pure zoom about the one world point both cameras
 *          put on the same screen spot, log zoom eased. Every point travels
 *          on a straight line to or from that spot ("push in on X").
 *   fly    a hop between two close-ups: the smooth zoom-and-pan path of van
 *          Wijk and Nuij (2003), which pulls back over the gap and dives back
 *          in, so the pan never smears thousands of pixels at full zoom.
 *
 * Reused from the vertical work in progress (kept in the review folder),
 * re-based on the 1920 x 1080 stage. glue() is new: the transform that keeps
 * a screen-space layer fixed to the world while the camera moves, so a
 * leaving caption rides out with the ground it sits on.
 *
 * Engine addition for this film only; _lib is not edited.
 */
import { clamp, inv, lerp } from '../../_lib/core.js'

export const W = 1920
export const H = 1080

/** Screen position of world point (wx, wy) under camera c. */
export const toScreen = (c, wx, wy) => [c.px + (wx - c.x) * c.z, c.py + (wy - c.y) * c.z]
/** World point under screen point (sx, sy). */
export const toWorld = (c, sx, sy) => [c.x + (sx - c.px) / c.z, c.y + (sy - c.py) / c.z]

/** Zoom camera c by factor f about screen point (ax, ay), then pan by (dx, dy) screen px. */
export function zoomAbout(c, f, ax, ay, dx = 0, dy = 0) {
	return { x: c.x, y: c.y, z: c.z * f, px: ax + (c.px - ax) * f + dx, py: ay + (c.py - ay) * f + dy }
}

/**
 * A rest: exactly `cam` at tKey, drifting at log-zoom rate k per second about
 * screen point `pivot` and panning at v px per second.
 */
export function rest(cam, tKey, { k = 0, pivot = [cam.px, cam.py], v = [0, 0] } = {}) {
	return (t) => {
		const dt = t - tKey
		return zoomAbout(cam, Math.exp(k * dt), pivot[0], pivot[1], v[0] * dt, v[1] * dt)
	}
}

/** Translation form of a camera: screen = z * world + T. */
const trans = (c) => [c.px - c.x * c.z, c.py - c.y * c.z]

/** Push or pull from camera a to camera b, u in 0..1 (already eased). */
export function pivotBlend(a, b, u) {
	const la = Math.log(a.z)
	const lb = Math.log(b.z)
	const z = Math.exp(lerp(la, lb, u))
	const [ax, ay] = trans(a)
	const [bx, by] = trans(b)
	if (Math.abs(la - lb) < 1e-3) return { x: 0, y: 0, z, px: lerp(ax, bx, u), py: lerp(ay, by, u) }
	const fx = (bx - ax) / (a.z - b.z)
	const fy = (by - ay) / (a.z - b.z)
	return { x: fx, y: fy, z, px: a.z * fx + ax, py: a.z * fy + ay }
}

/**
 * Hop from camera a to camera b along the van Wijk and Nuij optimal path
 * (the same closed form as d3.interpolateZoom). rho sets how far it pulls
 * back over the gap: larger rho, deeper pull. u in 0..1 (already eased).
 */
export function flyBlend(a, b, u, rho = Math.SQRT2, cx = W / 2, cy = H / 2) {
	const [ax, ay] = toWorld(a, cx, cy)
	const [bx, by] = toWorld(b, cx, cy)
	const aw = W / a.z
	const bw = W / b.z
	const dx = bx - ax
	const dy = by - ay
	const d2 = dx * dx + dy * dy
	const r2 = rho * rho
	const r4 = r2 * r2
	let x, y, w
	if (d2 < 1e-9) {
		const S = Math.log(bw / aw) / rho
		x = ax + u * dx
		y = ay + u * dy
		w = aw * Math.exp(rho * u * S)
	} else {
		const d1 = Math.sqrt(d2)
		const b0 = (bw * bw - aw * aw + r4 * d2) / (2 * aw * r2 * d1)
		const b1 = (bw * bw - aw * aw - r4 * d2) / (2 * bw * r2 * d1)
		const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0)
		const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1)
		const s = (u * (r1 - r0)) / rho
		const k = (aw / (r2 * d1)) * (Math.cosh(r0) * Math.tanh(rho * s + r0) - Math.sinh(r0))
		x = ax + k * dx
		y = ay + k * dy
		w = (aw * Math.cosh(r0)) / Math.cosh(rho * s + r0)
	}
	return { x, y, z: W / w, px: cx, py: cy }
}

/**
 * The take: rests[i] holds until moves[i] starts, then moves[i] blends it into
 * rests[i + 1]. moves[i] = { from, to, ease, blend: 'pivot' | 'fly', rho }.
 * Returns camera(t).
 */
export function take(rests, moves) {
	return (t) => {
		for (let i = 0; i < moves.length; i++) {
			const m = moves[i]
			if (t < m.from) return rests[i](t)
			if (t <= m.to) {
				const u = m.ease(clamp(inv(m.from, m.to, t)))
				const a = rests[i](t)
				const b = rests[i + 1](t)
				return m.blend === 'fly' ? flyBlend(a, b, u, m.rho) : pivotBlend(a, b, u)
			}
		}
		return rests[rests.length - 1](t)
	}
}

/**
 * The screen transform that carries a layer drawn under camera c0 along with
 * the world as the camera becomes c: screen' = k * screen + (tx, ty). A
 * caption glued this way sits on its ground, so nothing in the world can
 * cross it while it leaves.
 */
export function glue(c0, c) {
	const k = c.z / c0.z
	return { k, tx: c.px + (c0.x - c.x) * c.z - c0.px * k, ty: c.py + (c0.y - c.y) * c.z - c0.py * k }
}
export const glueAttr = ({ k, tx, ty }) => (Math.abs(k - 1) < 1e-5 && Math.abs(tx) < 1e-3 && Math.abs(ty) < 1e-3 ? null : `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(5)})`)
