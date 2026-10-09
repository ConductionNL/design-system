/**
 * Records-management atoms: the recurring UI pieces of a film about records-grade storage, as small
 * animated building blocks any film can reuse.
 *
 * Every atom is a pure function of time. It draws under a parent group `g` for the local time `t` it is
 * given, and its moves start at the times in its options (`at`, `on`, ...), so the caller decides when
 * from the voice or the grid. Draw them fresh every frame (the caller clears its layer), the same way the
 * film scenes do. Moves come from the named tokens in ../motion.js; nothing pops, scales in or bounces:
 * hexes and pills flip in (turn over by a width squash, never a rotation), rows rise into place, lines
 * are drawn on. Colours come from ../brand.js only. No orange box behind text: orange is a ring, a hex
 * or text (bible, Brand rules).
 *
 *   windowFrame(g, o)      a plain app window (explorer, library, channel, word): title bar, chrome, nav
 *   fileRow(g, o)          a file or folder row with status marks on the right
 *   statusPill(g, o)       a small labelled pill (neutral, suggested, locked, frozen, ok, answer)
 *   lockMark(g, o)         the retention lock: a cobalt hex with the lock icon
 *   holdMark(g, o)         the legal hold: a hex with two bars (frozen)
 *   cryptBadge(g, o)       per-object encryption: a ringed hex with the lock icon
 *   refusalChain(g, o)     client > workspace > register > storage, lit step by step, stopping at the last
 *   versionStack(g, o)     stacked versions, each landing with its lock pip
 *   propertiesPane(g, o)   a properties panel whose fields fill in, each tagged as suggested
 *   revocationClock(g, o)  a ring that runs down a revocation window
 *   shredLines(g, o)       content lines that scramble into unreadable blocks (crypto-shredding)
 *
 * The usual options: x, y (top left) or cx, cy (centre), w, t (local seconds), at (when it arrives).
 * An atom whose `at` has not come yet draws nothing. Sizes are stage pixels at 1920 x 1080.
 */
import { el, textBlock, measure } from '../stage.js'
import { hexPath, inv, rand } from '../core.js'
import { C } from '../brand.js'
import { curve, F } from '../motion.js'

const arrive = curve('arrive')
const leave = curve('leave')
const drift = curve('drift')

/** Frames for each reveal, in one place (the kinetic-type roles use the same numbers). */
export const ATOM_FRAMES = { flip: 5, rise: 6, draw: 8, light: 4 }

/** 0..1 progress of a move that starts at t0 and runs `frames` frames on curve fn. */
export const progress = (t, t0, frames, fn = arrive) => fn(inv(t0, t0 + F(frames), t))

/** The width squash a turning hex or pill has at t: 0 (edge on) to 1 (flat). Turns in at `at`, out at `off`. */
export function turnScale(t, at, off = Infinity, frames = ATOM_FRAMES.flip) {
	if (t < at) return 0
	const sIn = progress(t, at, frames)
	if (t < off) return sIn
	return Math.min(sIn, 1 - leave(inv(off, off + F(frames), t)))
}

/** A group squashed horizontally about cx by s (the flip). Returns null when edge on. */
export function turned(g, cx, s) {
	if (s <= 0.001) return null
	return el('g', s < 0.999 ? { transform: `translate(${cx.toFixed(2)} 0) scale(${s.toFixed(4)} 1) translate(${(-cx).toFixed(2)} 0)` } : {}, g)
}

/** A group that rises dy px into place and fades up with it (rows, cards). Returns null before `at`. */
export function risen(g, t, at, { dy = 28, frames = ATOM_FRAMES.rise } = {}) {
	if (t < at) return null
	const p = progress(t, at, frames)
	return el('g', p < 0.999 ? { transform: `translate(0 ${(dy * (1 - p)).toFixed(2)})`, opacity: p.toFixed(3) } : {}, g)
}

const label = (g, text, x, y, { size = 24, weight = 600, fill = C.cobalt900, family = 'Figtree', anchor = 'start' } = {}) =>
	textBlock(g, text, { x, y, size, weight, fill, family, anchor, tracking: -0.01, clip: false })
const mono = (g, text, x, y, o = {}) => label(g, text, x, y, { size: 20, weight: 500, family: 'IBM Plex Mono', fill: C.cobalt400, ...o })

/* ------------------------------------------------------------------ window */

/**
 * A plain app window, no third-party logos: a cobalt-900 title bar with the window's name, then the
 * chrome of its kind. Returns the content box { x, y, w, h } and, for an explorer, the nav rows.
 *   kind   'explorer' (a nav column of drives) | 'library' (a site header) | 'channel' (a channel rail)
 *          | 'word' (a ribbon strip) | 'plain'
 *   title  the window's name, e.g. 'Verkenner'
 *   nav    explorer: the drive labels, e.g. ['P: Projecten', 'I: Afdeling']; active: the lit one
 */
export function windowFrame(g, { x, y, w, h, title = '', kind = 'plain', nav = [], active = 0, titleSize = 26 } = {}) {
	const bar = Math.max(44, Math.round(titleSize * 2))
	el('rect', { x, y: y + 10, width: w, height: h, rx: 14, fill: C.cobalt900, 'fill-opacity': 0.35 }, g)
	el('rect', { x, y, width: w, height: h, rx: 14, fill: C.white }, g)
	el('path', { d: `M${x} ${y + bar}V${y + 14}Q${x} ${y} ${x + 14} ${y}H${x + w - 14}Q${x + w} ${y} ${x + w} ${y + 14}V${y + bar}Z`, fill: C.cobalt900 }, g)
	for (let i = 0; i < 3; i++) el('circle', { cx: x + w - 30 - i * 26, cy: y + bar / 2, r: 6, fill: C.cobalt600 }, g)
	label(g, title, x + 24, y + bar / 2 + titleSize * 0.36, { size: titleSize, fill: C.white })
	let cx = x, cy = y + bar, cw = w, ch = h - bar
	const out = { navRows: [] }
	if (kind === 'explorer') {
		const nw = Math.round(w * 0.27)
		el('rect', { x, y: cy, width: nw, height: ch - 14, fill: C.cobalt50 }, g)
		el('path', { d: `M${x} ${y + h - 14}V${y + h - 14}Q${x} ${y + h} ${x + 14} ${y + h}H${x + nw}V${y + h - 14}Z`, fill: C.cobalt50 }, g)
		nav.forEach((d, i) => {
			const ry = cy + 24 + i * 56
			if (i === active) el('rect', { x: x + 10, y: ry, width: nw - 20, height: 46, rx: 8, fill: C.cobalt100 }, g)
			el('rect', { x: x + 24, y: ry + 15, width: 22, height: 16, rx: 3, fill: i === active ? C.cobalt : C.cobalt300 }, g)
			label(g, d, x + 56, ry + 31, { size: 21, weight: i === active ? 700 : 500, fill: C.cobalt900 })
			out.navRows.push({ x: x + 10, y: ry, w: nw - 20, h: 46 })
		})
		cx = x + nw; cw = w - nw
	} else if (kind === 'library') {
		el('rect', { x, y: cy, width: w, height: 78, fill: C.cobalt50 }, g)
		el('rect', { x: x + 24, y: cy + 17, width: 44, height: 44, rx: 8, fill: C.cobalt }, g)
		el('rect', { x: x + 84, y: cy + 26, width: 160, height: 12, rx: 4, fill: C.cobalt700 }, g)
		el('rect', { x: x + 84, y: cy + 48, width: 100, height: 8, rx: 4, fill: C.cobalt300 }, g)
		cy += 78; ch -= 78
	} else if (kind === 'channel') {
		const rw = Math.round(w * 0.24)
		el('rect', { x, y: cy, width: rw, height: ch - 14, fill: C.cobalt50 }, g)
		for (let i = 0; i < 4; i++) el('rect', { x: x + 20, y: cy + 28 + i * 44, width: rw - 40 - (i % 2) * 30, height: 12, rx: 6, fill: i === 1 ? C.cobalt : C.cobalt200 }, g)
		cx = x + rw; cw = w - rw
	} else if (kind === 'word') {
		el('rect', { x, y: cy, width: w, height: 58, fill: C.cobalt50 }, g)
		for (let i = 0; i < Math.min(7, Math.floor((w - 40) / 70)); i++) el('rect', { x: x + 24 + i * 70, y: cy + 22, width: 46, height: 14, rx: 4, fill: C.cobalt200 }, g)
		cy += 58; ch -= 58
	}
	return { x: cx, y: cy, w: cw, h: ch, ...out }
}

/* ------------------------------------------------------------------ pills and marks */

const TONES = {
	neutral: { bg: C.cobalt50, ink: C.cobalt700, stroke: null },
	suggested: { bg: C.white, ink: C.cobalt400, stroke: C.cobalt300, dash: '6 5' },
	locked: { bg: C.cobalt, ink: C.white, stroke: null },
	frozen: { bg: C.cobalt100, ink: C.cobalt, stroke: null },
	ok: { bg: C.mint300, ink: C.cobalt900, stroke: null },
	unknown: { bg: C.cobalt50, ink: C.cobalt300, stroke: C.cobalt200, dash: '4 4' },
	answer: { bg: C.white, ink: C.cobalt900, stroke: C.orange },
}

/**
 * A small labelled pill that flips in at `at` (turns over about its centre). anchor 'end' puts its right
 * edge at x. Returns { x, w, h } (its left edge and width) so marks can sit beside it.
 */
export function statusPill(g, { x, cy, label: text, tone = 'neutral', t = 1e9, at = -1, size = 19, anchor = 'start', off = Infinity } = {}) {
	const T = TONES[tone] || TONES.neutral
	const tw = measure(text, { size, weight: 600 })
	const w = tw + size * 1.3, h = size * 1.7
	const x0 = anchor === 'end' ? x - w : x
	const s = turnScale(t, at, off)
	const pg = turned(g, x0 + w / 2, s)
	if (!pg) return { x: x0, w, h }
	el('rect', { x: x0, y: cy - h / 2, width: w, height: h, rx: h / 2, fill: T.bg, ...(T.stroke ? { stroke: T.stroke, 'stroke-width': tone === 'answer' ? 3 : 2, 'stroke-dasharray': T.dash || null } : {}) }, pg)
	label(pg, text, x0 + w / 2, cy + size * 0.36, { size, fill: T.ink, anchor: 'middle' })
	return { x: x0, w, h }
}

function markHex(g, cx, cy, r, s, { fill, stroke = null, strokeW = 3 }) {
	const hg = turned(g, cx, s)
	if (!hg) return null
	el('path', { d: hexPath(cx, cy, r, r * 0.12), fill, ...(stroke ? { stroke, 'stroke-width': strokeW } : {}) }, hg)
	return hg
}

/** The retention lock: a cobalt hex with the lock icon, flipping in at `at`. `ring` draws an orange ring (the scene's answer). */
export function lockMark(g, { cx, cy, r = 22, t = 1e9, at = -1, fill = C.cobalt, ink = C.white, ring = false, off = Infinity } = {}) {
	const hg = markHex(g, cx, cy, r, turnScale(t, at, off), { fill, stroke: ring ? C.orange : null, strokeW: Math.max(3, r * 0.14) })
	if (!hg) return null
	const k = r * 1.05
	el('use', { href: '#icon-lock', x: cx - k / 2, y: cy - k / 2, width: k, height: k, color: ink }, hg)
	return hg
}

/** The legal hold: a hex with two upright bars (paused, frozen). */
export function holdMark(g, { cx, cy, r = 22, t = 1e9, at = -1, fill = C.cobalt700, ink = C.white, ring = false, off = Infinity } = {}) {
	const hg = markHex(g, cx, cy, r, turnScale(t, at, off), { fill, stroke: ring ? C.orange : null, strokeW: Math.max(3, r * 0.14) })
	if (!hg) return null
	const bw = r * 0.2, bh = r * 0.8
	el('rect', { x: cx - bw * 1.6, y: cy - bh / 2, width: bw, height: bh, rx: bw / 3, fill: ink }, hg)
	el('rect', { x: cx + bw * 0.6, y: cy - bh / 2, width: bw, height: bh, rx: bw / 3, fill: ink }, hg)
	return hg
}

/** Per-object encryption: a cobalt-900 hex inside a ring, the lock icon in it. */
export function cryptBadge(g, { cx, cy, r = 26, t = 1e9, at = -1, ring = C.cobalt300, ink = C.white, off = Infinity } = {}) {
	const s = turnScale(t, at, off)
	const hg = turned(g, cx, s)
	if (!hg) return null
	el('path', { d: hexPath(cx, cy, r * 1.32, r * 0.16), fill: 'none', stroke: ring, 'stroke-width': Math.max(3, r * 0.12) }, hg)
	el('path', { d: hexPath(cx, cy, r, r * 0.12), fill: C.cobalt900 }, hg)
	const k = r * 1.05
	el('use', { href: '#icon-lock', x: cx - k / 2, y: cy - k / 2, width: k, height: k, color: ink }, hg)
	return hg
}

/** Draws one mark spec at (x right edge, cy), returns the x left of it. Used by fileRow. */
function drawMark(g, m, xr, cy, t) {
	if (m.type === 'lock') { lockMark(g, { cx: xr - 22, cy, r: 20, t, at: m.at ?? -1, ring: m.ring, off: m.off }); return xr - 52 }
	if (m.type === 'hold') { holdMark(g, { cx: xr - 22, cy, r: 20, t, at: m.at ?? -1, ring: m.ring, off: m.off }); return xr - 52 }
	if (m.type === 'crypt') { cryptBadge(g, { cx: xr - 24, cy, r: 15, t, at: m.at ?? -1, off: m.off }); return xr - 56 }
	const p = statusPill(g, { x: xr, cy, label: m.label, tone: m.tone, t, at: m.at ?? -1, anchor: 'end', size: m.size || 18, off: m.off })
	return p.x - 10
}

/* ------------------------------------------------------------------ rows */

/**
 * A file or folder row (height 64): an icon, the name, and status marks on the right.
 *   kind      'doc' | 'folder' | 'sheet' | 'pdf'
 *   marks     [{ type: 'pill', label, tone, at } | { type: 'lock' | 'hold' | 'crypt', at, ring }], right to left
 *   selected  a cobalt-100 highlight; frozen: the name in cobalt-300 (nothing can change it)
 *   shredAt   from this time the name scrambles into blocks (see shredLines)
 *   hidden    the name is withheld: a lock-grey bar instead of the text (you see it exists)
 */
export function fileRow(g, { x, y, w, name, kind = 'doc', marks = [], selected = false, frozen = false, hidden = false, t = 1e9, at = -1, shredAt = Infinity, h = 64, size = 23 } = {}) {
	const rg = risen(g, t, at)
	if (!rg) return null
	if (selected) el('rect', { x: x + 4, y: y + 3, width: w - 8, height: h - 6, rx: 8, fill: C.cobalt100 }, rg)
	el('rect', { x: x + 12, y: y + h - 1, width: w - 24, height: 1, fill: C.cobalt100 }, rg)
	const ix = x + 22, iy = y + h / 2
	if (kind === 'folder') {
		el('path', { d: `M${ix} ${iy - 11}h11l4 4h15v18h-30z`, fill: C.cobalt300 }, rg)
	} else {
		const tint = { doc: C.cobalt, sheet: C.forest, pdf: C.cobalt700 }[kind] || C.cobalt
		el('path', { d: `M${ix + 3} ${iy - 15}h17l8 8v22h-25z`, fill: C.white, stroke: tint, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, rg)
		el('rect', { x: ix + 8, y: iy - 2, width: 14, height: 3, fill: tint }, rg)
		el('rect', { x: ix + 8, y: iy + 4, width: 10, height: 3, fill: tint }, rg)
	}
	const nx = x + 66
	if (hidden) el('rect', { x: nx, y: iy - 7, width: Math.min(260, w * 0.38), height: 14, rx: 7, fill: C.cobalt200 }, rg)
	else if (t >= shredAt) shredLines(rg, { x: nx, y: iy - 7, w: Math.min(measure(name, { size, weight: 600 }), w * 0.5), lines: 1, t, at: shredAt, seed: name.length * 13, gap: 0 })
	else label(rg, name, nx, iy + size * 0.36, { size, fill: frozen ? C.cobalt400 : C.cobalt900 })
	let xr = x + w - 16
	for (const m of marks) xr = drawMark(rg, m, xr, iy, t)
	return { x, y, w, h, cy: iy, nameX: nx }
}

/* ------------------------------------------------------------------ the refusal chain */

/**
 * The path a request takes, as plain boxes (systems are boxes; hexes are apps): each node lights up at its
 * time in `at`, the connector to it drawn on just before, and the node at `stop` refuses: an orange ring
 * draws round it at `refused` and the lock flips in. Nodes after `stop` stay dark.
 *   nodes  ['Verkenner', 'Nextcloud', 'Register', 'Opslag']
 *   at     the time each node lights (local seconds); refused: when the stop node rings
 *   vertical  stack top to bottom instead of left to right
 */
export function refusalChain(g, { x, y, w, h = 84, nodes, at, stop = nodes.length - 1, refused = Infinity, t = 1e9, vertical = false, gap = 36, size = 24 } = {}) {
	const n = nodes.length
	const bw = vertical ? w : (w - gap * (n - 1)) / n
	const pos = nodes.map((_, i) => (vertical ? { x, y: y + i * (h + gap) } : { x: x + i * (bw + gap), y }))
	const centres = []
	nodes.forEach((name, i) => {
		const p = pos[i]
		const lit = progress(t, at[i], ATOM_FRAMES.light, drift)
		if (i > 0) {
			// The connector from the node before draws on over the frames before this one lights.
			const a = pos[i - 1]
			const k = progress(t, at[i] - F(ATOM_FRAMES.draw), ATOM_FRAMES.draw, arrive)
			if (vertical) {
				const x0 = x + bw / 2, y0 = a.y + h, len = gap
				el('rect', { x: x0 - 2, y: y0, width: 4, height: len, fill: C.cobalt100 }, g)
				if (k > 0) el('rect', { x: x0 - 2, y: y0, width: 4, height: len * k, fill: C.cobalt300 }, g)
			} else {
				const x0 = a.x + bw, y0 = y + h / 2, len = gap
				el('rect', { x: x0, y: y0 - 2, width: len, height: 4, fill: C.cobalt100 }, g)
				if (k > 0) el('rect', { x: x0, y: y0 - 2, width: len * k, height: 4, fill: C.cobalt300 }, g)
			}
		}
		const fill = lit > 0.5 ? C.white : C.cobalt700
		const ink = lit > 0.5 ? C.cobalt900 : C.cobalt300
		el('rect', { x: p.x, y: p.y, width: bw, height: h, rx: 10, fill, stroke: lit > 0.5 ? C.cobalt200 : C.cobalt600, 'stroke-width': 2 }, g)
		label(g, name, p.x + bw / 2, p.y + h / 2 + size * 0.36, { size, fill: ink, anchor: 'middle' })
		centres.push({ x: p.x + bw / 2, y: p.y + h / 2, box: { x: p.x, y: p.y, w: bw, h } })
		if (i === stop && t >= refused) {
			const r = progress(t, refused, ATOM_FRAMES.draw)
			el('rect', { x: p.x - 8, y: p.y - 8, width: bw + 16, height: h + 16, rx: 16, fill: 'none', stroke: C.orange, 'stroke-width': 5, pathLength: 1, 'stroke-dasharray': `${r.toFixed(4)} 1` }, g)
			lockMark(g, { cx: p.x + bw - 4, cy: p.y - 4, r: 22, t, at: refused + F(2) })
		}
	})
	return centres
}

/* ------------------------------------------------------------------ versions */

/** Stacked versions (v1 at the back), each landing at its time in `at`, each carrying its lock pip. */
export function versionStack(g, { x, y, w, h, at, t = 1e9, locked = true, step = 18, labels } = {}) {
	const n = at.length
	for (let i = 0; i < n; i++) {
		const ox = x + (n - 1 - i) * step, oy = y + (n - 1 - i) * -step
		const rg = risen(g, t, at[i], { dy: 40 })
		if (!rg) continue
		el('rect', { x: ox, y: oy, width: w, height: h, rx: 8, fill: C.white, stroke: C.cobalt200, 'stroke-width': 2 }, rg)
		el('rect', { x: ox + 18, y: oy + 22, width: w * 0.5, height: 10, rx: 5, fill: C.cobalt700 }, rg)
		el('rect', { x: ox + 18, y: oy + 44, width: w * 0.36, height: 8, rx: 4, fill: C.cobalt200 }, rg)
		mono(rg, labels ? labels[i] : `v${i + 1}`, ox + 18, oy + h - 16, { size: 18 })
		if (locked) lockMark(rg, { cx: ox + w - 26, cy: oy + 28, r: 15, t, at: at[i] + F(3) })
	}
}

/* ------------------------------------------------------------------ properties */

/**
 * A properties panel whose fields fill in one by one. Each value rises into its slot at its time in `at`,
 * and a "voorgesteld" pill (or `tag`) flips in beside it a few frames later. `focus` rings one field in
 * orange (the scene's answer) from `focusAt`.
 *   fields [{ label: 'Bewaartermijn', value: '10 jaar' }]
 */
export function propertiesPane(g, { x, y, w, title = 'Eigenschappen', fields, at, t = 1e9, tag = 'voorgesteld', rowH = 84, focus = -1, focusAt = Infinity } = {}) {
	el('rect', { x, y, width: w, height: 70 + fields.length * rowH, rx: 10, fill: C.white, stroke: C.cobalt100, 'stroke-width': 2 }, g)
	label(g, title, x + 22, y + 44, { size: 24, weight: 700 })
	fields.forEach((f, i) => {
		const fy = y + 70 + i * rowH
		mono(g, f.label, x + 22, fy + 18, { size: 18 })
		el('rect', { x: x + 22, y: fy + 28, width: w - 44, height: 44, rx: 6, fill: t >= at[i] ? C.cobalt50 : C.white, stroke: C.cobalt200, 'stroke-width': 2, 'stroke-dasharray': t >= at[i] ? null : '8 6' }, g)
		const vg = risen(g, t, at[i], { dy: 18 })
		if (vg) label(vg, f.value, x + 38, fy + 58, { size: 22 })
		if (tag) statusPill(g, { x: x + w - 34, cy: fy + 50, label: tag, tone: 'suggested', t, at: at[i] + F(3), anchor: 'end', size: 15 })
		if (i === focus && t >= focusAt) {
			const r = progress(t, focusAt, ATOM_FRAMES.draw)
			el('rect', { x: x + 12, y: fy + 20, width: w - 24, height: 60, rx: 10, fill: 'none', stroke: C.orange, 'stroke-width': 4, pathLength: 1, 'stroke-dasharray': `${r.toFixed(4)} 1` }, g)
		}
	})
	return { h: 70 + fields.length * rowH }
}

/* ------------------------------------------------------------------ revocation and shredding */

/**
 * A ring that runs down a revocation window: the track, the remaining arc (orange, the answer) shrinking
 * from `from` to `to` on the drift curve, and a label in the middle.
 */
export function revocationClock(g, { cx, cy, r = 90, t = 1e9, from = 0, to = 1, label: text = '', sub = '', ink = C.white, track = C.cobalt600, arc = C.orange } = {}) {
	el('circle', { cx, cy, r, fill: 'none', stroke: track, 'stroke-width': 14 }, g)
	const left = 1 - drift(inv(from, to, t))
	if (left > 0.002) {
		el('circle', { cx, cy, r, fill: 'none', stroke: arc, 'stroke-width': 14, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': `${left.toFixed(4)} 1`, transform: `translate(${cx} ${cy}) scale(-1 1) translate(${-cx} ${-cy}) rotate(-90 ${cx} ${cy})` }, g)
	}
	if (text) label(g, text, cx, cy + 12, { size: 38, weight: 700, fill: ink, anchor: 'middle' })
	if (sub) label(g, sub, cx, cy + 46, { size: 20, weight: 500, fill: C.cobalt200, anchor: 'middle' })
}

/**
 * Content lines that scramble into unreadable blocks from `at`: for six frames the blocks reshuffle on
 * every frame (seeded by the frame, so it stays a pure function of time), then they settle as noise.
 */
export function shredLines(g, { x, y, w, lines = 4, lineH = 30, t = 1e9, at = Infinity, seed = 7, gap = 1, ink = C.cobalt700, noise = C.cobalt300 } = {}) {
	const frame = Math.round(t * 24)
	const settled = t >= at + F(6)
	for (let i = 0; i < lines; i++) {
		const ly = y + i * lineH
		const lw = w * (i === lines - 1 && gap ? 0.6 : 1 - (i % 3) * 0.12)
		if (t < at) { el('rect', { x, y: ly, width: lw, height: 12, rx: 6, fill: ink }, g); continue }
		const rnd = rand(seed * 977 + i * 31 + (settled ? 0 : frame))
		let cx = x
		while (cx < x + lw - 6) {
			const bw = 6 + rnd() * 22
			el('rect', { x: cx, y: ly + (rnd() < 0.5 ? 0 : 3), width: Math.min(bw, x + lw - cx), height: 6 + rnd() * 8, fill: noise }, g)
			cx += bw + 3 + rnd() * 6
		}
	}
}
