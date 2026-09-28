/**
 * Thematiq's hero device (one Thematiq film since Round 20): the app window
 * repainting from Nextcloud's default blue into the customer's own house style.
 * It draws inside a hookFrame drawUI (window mock space, u = 2.5), over the chrome
 * hookFrame already drew: the topbar, the nav head card, the page title bar and the
 * primary button are painted twice, once in the old colour and once in the new, each
 * clipped to its side of the edge.
 *
 *   mode 'wipe'  a vertical edge at x = at; the new style lies to its right, and a
 *                column of pointy-top hexes in stepped sizes rides the edge (techniques
 *                #5, the stepped hex wipe)
 *   mode 'hex'   an upright hex centred on (cx, cy) with radius r; the new style lies
 *                inside it (technique #1, dot-grows-to-fill, as a hex)
 *
 * No text, no product names: the new style is an abstract palette from brand.js
 * (never a real organisation's colours). Hexes are never rotated.
 */
import { el, nextId } from '../_lib/stage.js'
import { hexPath } from '../_lib/core.js'
import { C } from '../_lib/brand.js'
import { rect, bar, hex, topbar } from '../_lib/ui.js'

const NAV = 110 // WINDOW.nav in CSS px

/** A group clipped to an arbitrary path. */
function clipTo(g, d, rule = 'nonzero') {
	const id = nextId('tclip')
	const cp = el('clipPath', { id }, g)
	el('path', { d, fill: C.white, 'clip-rule': rule }, cp)
	return el('g', { 'clip-path': `url(#${id})` }, g)
}

/** The window's branded chrome in one colour: topbar, nav head, active nav item, title bar, primary button. */
export function paintChrome(g, geom, fill, tint) {
	const { u } = geom
	const FW = 720 * u, FH = geom.visB + 60
	topbar(g, 0, 0, FW, u, { fill })
	const NW = NAV * u
	const ix = 8 * u, iw = NW - 16 * u
	rect(g, ix, 24 * u + 10 * u, iw, 19 * u, fill, 3 * u)
	hex(g, ix + 10 * u, 24 * u + 19.5 * u, 4.5 * u, C.white)
	bar(g, ix + 19 * u, 24 * u + 17.5 * u, iw - 25 * u, 4 * u, C.white, { 'fill-opacity': 0.7 })
	// active nav item (the second): tint behind, square in the brand colour
	const py = 24 * u + 10 * u + 19 * u + 9 * u + 21 * u
	rect(g, ix, py, iw, 16 * u, tint, 2 * u)
	rect(g, ix + 5 * u, py + 4 * u, 8 * u, 8 * u, fill, u)
	bar(g, geom.x, 95, 250, 35, fill)
	rect(g, geom.r - 95, 95, 95, 35, fill, 3 * u)
	return { FW, FH }
}

/**
 * repaint(win, geom, { mode, at, cx, cy, r, from, to, content(g, fill, tint) }):
 * `content` draws the page body in a given colour pair, so the body repaints too.
 */
export function repaint(win, geom, { mode = 'wipe', at = 700, cx = 0, cy = 0, r = 400, from = [C.nextcloud, C.cobalt50], to = [C.forest, C.forest300], content } = {}) {
	const FW = 720 * geom.u, FH = geom.visB + 60
	const oldD = mode === 'wipe' ? `M0 0 H${at} V${FH} H0 Z` : `M0 0 H${FW} V${FH} H0 Z ${hexPath(cx, cy, r)}`
	const newD = mode === 'wipe' ? `M${at} 0 H${FW} V${FH} H${at} Z` : hexPath(cx, cy, r)
	const og = clipTo(win, oldD, mode === 'hex' ? 'evenodd' : 'nonzero')
	const ng = clipTo(win, newD)
	;[[og, from], [ng, to]].forEach(([g, [fill, tint]]) => {
		rect(g, 0, 0, FW, FH, C.white)
		// the nav rail (cobalt-50 on both sides: only the brand colour moves)
		rect(g, 0, 24 * geom.u, NAV * geom.u, FH, C.cobalt50)
		rect(g, NAV * geom.u - geom.u, 24 * geom.u, geom.u, FH, C.cobalt100)
		paintChrome(g, geom, fill, tint)
		if (content) content(g, fill, tint)
	})
	if (mode === 'hex') {
		// the hex's own edge: a thin ring of the new colour, stepped outward twice
		hex(win, cx, cy, r + 14, 'none', 0, { stroke: to[0], 'stroke-width': 6 })
		hex(win, cx, cy, r + 40, 'none', 0, { stroke: to[1], 'stroke-width': 4 })
	} else {
		// the stepped hex column riding the edge: three sizes, the big ones leading
		const steps = [[0, 46], [26, 30], [48, 18]]
		for (let y = 90; y < FH; y += 150) {
			steps.forEach(([dx, rr], i) => hex(win, at + dx, y + (i % 2) * 40, rr, i === 0 ? to[0] : to[1], rr * 0.13))
		}
	}
}
