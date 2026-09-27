/**
 * Variant A helper: the product UI that lives INSIDE a cell, in world units.
 *
 * Two pieces, both in the vocabulary of the design system's AppMock,
 * WidgetMock and SidebarMock (white cards, cobalt and cobalt-300 bars, hex
 * pips, one orange accent):
 *
 *   contractPage  the contract, inside the Filinq cell. Its outline is the
 *                 exact page hollow of the Filinq glyph (a document with a
 *                 folded corner), so at ring scale it is the white page of
 *                 that glyph, and a push into the cell turns the glyph's page
 *                 into the contract.
 *   portalPhone   the client's phone, inside the Portaliq cell, inside the
 *                 square of the Portaliq glyph. The portal on it wears the
 *                 customer's own house style (their header).
 *
 * Both are drawn at every camera, so nothing pops or fades in when the camera
 * arrives: it only gets bigger.
 *
 * Lives in the variant folder on purpose: the shared engine (_lib) is not
 * edited by a variant.
 */
import { el, nextId } from '../../../_lib/stage.js'
import { hexPath } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { GLYPH, bar, miniHex, pip } from './world.js'

/* ---------------------------------------------------------------- contract */

/** One glyph unit (the glyph files are 24 x 24) in world units. */
const U = GLYPH / 24

/**
 * The page hollow of the Filinq glyph (filinq.svg: M6,4 h7 v5 h5 v11 H6 Z),
 * in world units relative to the cell centre: 69 x 92 with the folded corner.
 */
export const PAGE = {
	x: -GLYPH / 2 + 6 * U, // -34.5
	y: -GLYPH / 2 + 4 * U, // -46
	w: 12 * U, // 69
	h: 16 * U, // 92
	notchX: 7 * U, // 40.25: the fold starts here...
	notchY: 5 * U, // 28.75: ...and ends here
}

/** Contract rows, in page units from the page's top-left: centre y and value width. */
export const ROWS = [
	{ c: 3.6, w: 14 }, // the client's name
	{ c: 9.1, w: 18 }, // their address
	{ c: 14.6, w: 8 }, // the amount
]
const CHIP_X = 5.8
const CHIP_R = 2.3
const VALUE_X = 9.4
const VALUE_H = 4

/**
 * The contract page. `filled` is how many rows hold their value; `caret`
 * puts the one orange, the typing caret, after the last filled value.
 * Each filled value starts with the Pipelinq glyph: it came from the client.
 */
export function contractPage(g, cx, cy, { filled = 0, caret = false } = {}) {
	const ox = cx + PAGE.x
	const oy = cy + PAGE.y
	const { w, h, notchX, notchY } = PAGE
	el('path', { d: `M${ox} ${oy}H${ox + notchX}V${oy + notchY}H${ox + w}V${oy + h}H${ox}Z`, fill: C.white }, g)

	ROWS.forEach((row, i) => {
		const y = oy + row.c
		// The field's underline is there from the start: the template before it fills.
		el('rect', { x: ox + 3.4, y: y + 2.5, width: 36, height: 0.12, fill: C.cobalt100 }, g)
		if (i < filled) {
			miniHex(g, ox + CHIP_X, y, CHIP_R, C.cobalt, 'pipelinq')
			bar(g, ox + VALUE_X, y - VALUE_H / 2, row.w, VALUE_H, C.cobalt)
		}
	})
	if (caret && filled > 0) {
		const last = ROWS[filled - 1]
		el('rect', { x: ox + VALUE_X + last.w + 0.5, y: oy + last.c - 2.6, width: 0.35, height: 5.2, rx: 0.12, fill: C.orange }, g)
	}

	// The signature field, still empty: it is signed in the portal.
	bar(g, ox + 3.4, oy + 19.2, 7, 0.9, C.cobalt300)
	el('rect', { x: ox + 3.4, y: oy + 20.6, width: 24, height: 6.4, rx: 0.8, fill: C.white, stroke: C.cobalt200, 'stroke-width': 0.1 }, g)
	el('rect', { x: ox + 5, y: oy + 25.4, width: 20.8, height: 0.1, fill: C.cobalt200 }, g)

	// Body text of the contract, the part nobody retypes.
	const widths = [58, 62, 50, 60, 44, 61, 55, 38, 60, 52, 62, 46, 58, 40, 60, 54, 30, 58, 50, 60, 36, 44, 58]
	for (let i = 0, y = 30.4; y < h - 3; i++, y += 2.4) bar(g, ox + 3.4, oy + y, widths[i % widths.length], 0.9, C.cobalt100)
}

/* ------------------------------------------------------------------- phone */

/** The phone, in world units: 38 x 78, centred on the cell (inside the Portaliq glyph's square). */
export const PHONE = { w: 38, h: 78, inset: 1.2 }
const SW = PHONE.w - 2 * PHONE.inset // screen width 35.6
const SH = PHONE.h - 2 * PHONE.inset

/** List rows in the portal, screen units: what the client sees from every app you run. */
export const LIST = { top: 9.8, h: 11.4, pitch: 13 }
export const LIST_ROWS = [
	{ app: 'filinq', fill: C.terracotta, active: true }, // the contract just signed: the one orange
	{ app: 'shillinq', fill: C.cobalt }, // an invoice
	{ app: 'shillinq', fill: C.cobalt }, // a quote
	{ app: 'pipelinq', fill: C.cobalt }, // a request
]
/** World y of list row i relative to the phone centre. */
export const listRowY = (i) => -PHONE.h / 2 + PHONE.inset + LIST.top + LIST.h / 2 + i * LIST.pitch

/** The portal header in the customer's own house style: their logo tile, their name, the client's avatar. */
function portalHeader(g, sx, sy) {
	el('rect', { x: sx, y: sy, width: SW, height: 5.4, fill: C.cobalt }, g)
	el('rect', { x: sx + 14.3, y: sy + 0.7, width: 7, height: 1.5, rx: 0.75, fill: C.cobalt900 }, g)
	el('rect', { x: sx + 2.2, y: sy + 2.1, width: 2.6, height: 2.6, rx: 0.6, fill: C.white }, g)
	bar(g, sx + 5.8, sy + 2.3, 9, 1.0, C.white)
	bar(g, sx + 5.8, sy + 3.8, 5.5, 0.7, C.cobalt300)
	el('circle', { cx: sx + SW - 3.2, cy: sy + 3.3, r: 1.3, fill: C.cobalt200 }, g)
}

function rowCard(g, x, y, w, h, fill = C.white) {
	return el('rect', { x, y, width: w, height: h, rx: 1.0, fill, stroke: C.cobalt100, 'stroke-width': 0.1 }, g)
}

/**
 * The client's phone. view 'sign': the contract waiting for a signature
 * (signed: the signature is in the box, the one orange; tap: the tap echo on
 * the button). view 'list': every item from every app, the signed contract
 * first. sources: the apps that feed the list, as hexes on the left with a
 * line into each row (sources left, consumers right). accent: false when the
 * scene's one orange is elsewhere; the signed contract then shows a mint pip.
 */
export function portalPhone(g, cx, cy, { view = 'sign', signed = false, tap = false, sources = false, accent = true } = {}) {
	const px = cx - PHONE.w / 2
	const py = cy - PHONE.h / 2
	const sx = px + PHONE.inset
	const sy = py + PHONE.inset

	if (sources) drawSources(g, cx, cy)

	// A flat phone: a cobalt-200 body and a light screen, no bezel shading, no shadow.
	el('rect', { x: px, y: py, width: PHONE.w, height: PHONE.h, rx: 5.7, fill: C.cobalt200 }, g)
	const id = nextId('phonescreen')
	const cp = el('clipPath', { id }, g)
	el('rect', { x: sx, y: sy, width: SW, height: SH, rx: 4.5 }, cp)
	const s = el('g', { 'clip-path': `url(#${id})` }, g)
	el('rect', { x: sx, y: sy, width: SW, height: SH, fill: C.cobalt50 }, s)
	portalHeader(s, sx, sy)

	if (view === 'sign') {
		rowCard(s, sx + 1.2, sy + 6.4, 33.2, 22.6)
		miniHex(s, sx + 4.2, sy + 9.0, 1.6, C.terracotta, 'filinq')
		bar(s, sx + 6.8, sy + 8.1, 14, 1.5, C.cobalt)
		bar(s, sx + 6.8, sy + 10.3, 9, 0.8, C.cobalt300)
		bar(s, sx + 3.0, sy + 12.4, 7, 0.8, C.cobalt300)
		el('rect', { x: sx + 3.0, y: sy + 13.8, width: 29.6, height: 6.4, rx: 0.8, fill: C.white, stroke: C.cobalt200, 'stroke-width': 0.12 }, s)
		el('rect', { x: sx + 5.0, y: sy + 18.6, width: 25.6, height: 0.12, fill: C.cobalt200 }, s)
		// The one orange: the signature, the moment it lands in the box.
		if (signed) el('rect', { x: sx + 7.0, y: sy + 16.7, width: 14, height: 0.5, rx: 0.25, fill: C.orange }, s)
		// The sign button: a cobalt primary with its white label bar (orange is never a button fill).
		el('rect', { x: sx + 3.0, y: sy + 21.4, width: 29.6, height: 6.2, rx: 1.0, fill: C.cobalt }, s)
		bar(s, sx + 3.0 + 14.8 - 3.5, sy + 21.4 + 3.1 - 0.6, 7, 1.2, C.white)
		if (tap) {
			const tx = sx + 25.6, ty = sy + 24.5 // right of the label bar, so the echo never crosses it
			el('path', { d: hexPath(tx, ty, 1.7, 0.15), fill: 'none', stroke: C.white, 'stroke-width': 0.14 }, s)
			el('path', { d: hexPath(tx, ty, 3.7, 0.3), fill: 'none', stroke: C.cobalt300, 'stroke-width': 0.12 }, s)
		}
		// The rest of the portal, below the fold: what the pull back will show.
		;[30.6, 38.2].forEach((y) => {
			rowCard(s, sx + 1.2, sy + y, 33.2, 6.4)
			miniHex(s, sx + 4.4, sy + y + 3.2, 1.7, C.cobalt, 'shillinq')
			bar(s, sx + 7.4, sy + y + 1.9, 14, 1.3, C.cobalt)
			bar(s, sx + 7.4, sy + y + 3.9, 8, 0.8, C.cobalt300)
			pip(s, sx + 31.6, sy + y + 3.2, 0.9, C.cobalt200)
		})
	} else {
		bar(s, sx + 2.4, sy + 7.2, 12, 1.3, C.cobalt)
		LIST_ROWS.forEach((row, i) => {
			const y0 = sy + LIST.top + i * LIST.pitch
			const c = y0 + LIST.h / 2
			rowCard(s, sx + 1.2, y0, 33.2, LIST.h)
			// The one orange: a left rule on the contract that was just signed.
			if (row.active && accent) el('rect', { x: sx + 1.2, y: y0 + 0.9, width: 0.9, height: LIST.h - 1.8, fill: C.orange }, s)
			miniHex(s, sx + 5.4, c, 2.6, row.fill, row.app)
			bar(s, sx + 9.4, c - 2.2, 15, 2.0, C.cobalt)
			bar(s, sx + 9.4, c + 0.9, 9, 1.2, C.cobalt300)
			if (!row.active) pip(s, sx + 31.2, c, 1.1, C.cobalt200)
			else if (!accent) pip(s, sx + 31.2, c, 1.1, C.mint) // signed, once the scene's orange has moved on
		})
	}
}

/** Source app hexes left of the phone, each with a line into the rows it feeds. Shillinq feeds two. */
export const SOURCES = [
	{ app: 'filinq', fill: C.terracotta, rows: [0] },
	{ app: 'shillinq', fill: C.cobalt, rows: [1, 2] },
	{ app: 'pipelinq', fill: C.cobalt, rows: [3] },
]
const SRC_X = -42.8
const SRC_R = 5.0

function drawSources(g, cx, cy) {
	const edge = cx - PHONE.w / 2
	for (const src of SOURCES) {
		const ys = src.rows.map((i) => cy + listRowY(i))
		const hy = ys.reduce((a, b) => a + b, 0) / ys.length
		const hx = cx + SRC_X
		const out = hx + SRC_R * 0.866 + 1.0
		const fork = cx - 30
		const d = ys.map((y) => (ys.length === 1 ? `M${out} ${y}H${edge}` : `M${out} ${hy}H${fork}V${y}H${edge}`)).join('')
		el('path', { d, fill: 'none', stroke: C.cobalt300, 'stroke-width': 0.33, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g)
		miniHex(g, hx, hy, SRC_R, src.fill, src.app)
	}
}
