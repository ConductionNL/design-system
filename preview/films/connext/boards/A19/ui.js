/**
 * Variant A19 helper (round 6, 2026-09-28; copied from A18, the round-5 record):
 * the product UI that lives INSIDE a cell, in world units, plus the flow lane.
 * Round 6 adds leadLinks (s1: square-cornered links from the lead to the Nextcloud
 * components in the grid), ncNotify (s6: the desktop toast and the phone push) and
 * preparedWork (s7: the prepared action and the suggestion); the flow lane's last step
 * now travels on one continuous ease (dropEase). leadDiagram and ncDesk stay for the
 * record and are no longer drawn.
 *
 * Round 4 (Ruben, 2026-09-27): assistantChat is replaced by assistantDesk (the
 * mechanism made visible: what the apps hand the assistant, your question, and
 * the change it waits for you to allow), and flowLane is new (the flow the
 * customer draws, under the story row). Both are documented where they are
 * defined, at the end of this file. The A16 notes below still hold for the rest.
 *
 * Four pieces, all in the vocabulary of the design system's AppMock,
 * WidgetMock, SidebarMock and HermiqMock (white cards, cobalt and cobalt-300
 * bars, hex pips, one orange accent):
 *
 *   contractPage   the contract, inside the Filinq cell. Its outline is the
 *                  exact page hollow of the Filinq glyph (a document with a
 *                  folded corner), drawn over the glyph, so at ring scale it
 *                  is the page of that glyph and at the close-up the glyph's
 *                  cobalt border frames the contract.
 *   portalPhone    the client's phone, inside the square of the Portaliq
 *                  glyph. The portal on it wears the customer's own house
 *                  style (their header) and lists items from several apps.
 *   ncDesk         a colleague's Nextcloud, inside the Nextcloud workspace
 *                  hex: Nextcloud's own header (the app shelf, the bell, who
 *                  is signed in) and the bell's popover, where the new notice
 *                  lands on top of a shared file and a chat mention.
 *   assistantDesk  the assistant, inside the Hermiq cell (round 4, below).
 *   flowLane       the flow the customer draws, under the story row (round 4, below).
 *
 * Every piece is drawn at every camera that sees its cell, so nothing pops
 * when the camera arrives: it only gets bigger (ncDesk and assistantChat fade
 * in with the zoom instead, see world.js innerIn, because their glyphs have
 * no hollow to hold UI at ring scale).
 *
 * Changes from boards/A/ui.js: no brown (Filinq's pips are cobalt), the
 * portal lists a Pipelinq request below the fold, and ncDesk and
 * assistantChat are new.
 *
 * Round 3 (2026-09-27): the bell is the Lucide bell (#icon-bell), not the
 * greeked dot. Every piece also takes optional in-between states for the
 * film (a value arriving, the button press, the popover opening, the answer
 * growing); left out, each draws exactly the resting state the board shows,
 * so the film and the storyboard share one geometry.
 *
 * Lives in the variant folder on purpose: the shared engine (_lib) is not
 * edited by a variant.
 */
import { el, set, nextId } from '../../../_lib/stage.js'
import { hexPath } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { GLYPH, R, bar, miniHex, ncIcon, pip, cellXY, NC_SYMBOL, STORY } from './world.js'

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
 *
 * Film states: rows[i] = { chip, width } (chip: the source glyph's scale,
 * 0 hidden to 1 resting, a spring may overshoot; width: the value bar in page
 * units, 0 to ROWS[i].w) overrides `filled`; caretRow puts the caret after
 * that row's current value (-1: no caret).
 */
export function contractPage(g, cx, cy, { filled = 0, caret = false, rows = null, caretRow = null } = {}) {
	const ox = cx + PAGE.x
	const oy = cy + PAGE.y
	const { w, h, notchX, notchY } = PAGE
	el('path', { d: `M${ox} ${oy}H${ox + notchX}V${oy + notchY}H${ox + w}V${oy + h}H${ox}Z`, fill: C.white }, g)

	const state = rows || ROWS.map((row, i) => ({ chip: i < filled ? 1 : 0, width: i < filled ? row.w : 0 }))
	ROWS.forEach((row, i) => {
		const y = oy + row.c
		// The field's underline is there from the start: the template before it fills.
		el('rect', { x: ox + 3.4, y: y + 2.5, width: 36, height: 0.12, fill: C.cobalt100 }, g)
		const st = state[i] || { chip: 0, width: 0 }
		if (st.width > 0.05) bar(g, ox + VALUE_X, y - VALUE_H / 2, st.width, VALUE_H, C.cobalt)
		if (st.chip > 0.001) miniHex(g, ox + CHIP_X, y, CHIP_R * st.chip, C.cobalt, 'pipelinq')
	})
	const cr = caretRow !== null ? caretRow : caret && filled > 0 ? filled - 1 : -1
	if (cr >= 0) {
		const vw = state[cr] ? state[cr].width : ROWS[cr].w
		el('rect', { x: ox + VALUE_X + vw + 0.5, y: oy + ROWS[cr].c - 2.6, width: 0.6, height: 5.2, rx: 0.2, fill: C.orange }, g)
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

/** What else the client sees in the portal, below the contract: items from other apps you run. */
const BELOW = [
	{ app: 'shillinq', y: 30.6 }, // an invoice
	{ app: 'shillinq', y: 38.2 }, // a quote
	{ app: 'pipelinq', y: 45.8 }, // a request
]

/**
 * The client's phone, in the portal. The contract waits for a signature
 * (signed: the signature is in the box, the one orange; tap: the tap echo on
 * the button). Below the fold, items from other apps you run: truth 4, one
 * portal, carried by the picture. accent: false when the scene's one orange
 * is elsewhere; the signature is then drawn in cobalt.
 *
 * Film states: sig (0 to 1) draws the signature left to right and overrides
 * signed; press (0 to 1) presses the button (scale 0.97 at 1, about its
 * centre); echo [inner, outer] shows each tap outline and overrides tap.
 */
export function portalPhone(g, cx, cy, { signed = false, tap = false, accent = true, sig = null, press = 0, echo = null } = {}) {
	const px = cx - PHONE.w / 2
	const py = cy - PHONE.h / 2
	const sx = px + PHONE.inset
	const sy = py + PHONE.inset

	// A flat phone: a cobalt-200 body and a light screen, no bezel shading, no shadow.
	el('rect', { x: px, y: py, width: PHONE.w, height: PHONE.h, rx: 5.7, fill: C.cobalt200 }, g)
	const id = nextId('phonescreen')
	const cp = el('clipPath', { id }, g)
	el('rect', { x: sx, y: sy, width: SW, height: SH, rx: 4.5 }, cp)
	const s = el('g', { 'clip-path': `url(#${id})` }, g)
	el('rect', { x: sx, y: sy, width: SW, height: SH, fill: C.cobalt50 }, s)
	portalHeader(s, sx, sy)

	rowCard(s, sx + 1.2, sy + 6.4, 33.2, 22.6)
	miniHex(s, sx + 4.2, sy + 9.0, 1.6, C.cobalt, 'filinq')
	bar(s, sx + 6.8, sy + 8.1, 14, 1.5, C.cobalt)
	bar(s, sx + 6.8, sy + 10.3, 9, 0.8, C.cobalt300)
	bar(s, sx + 3.0, sy + 12.4, 7, 0.8, C.cobalt300)
	el('rect', { x: sx + 3.0, y: sy + 13.8, width: 29.6, height: 6.4, rx: 0.8, fill: C.white, stroke: C.cobalt200, 'stroke-width': 0.12 }, s)
	el('rect', { x: sx + 5.0, y: sy + 18.6, width: 25.6, height: 0.12, fill: C.cobalt200 }, s)
	// The one orange: the signature, the moment it lands in the box.
	const sf = sig !== null ? sig : signed ? 1 : 0
	if (sf > 0.001) el('rect', { x: sx + 7.0, y: sy + 16.7, width: 14 * sf, height: 0.5, rx: Math.min(0.25, 7 * sf), fill: accent ? C.orange : C.cobalt }, s)
	// The sign button: a cobalt primary with its white label bar (orange is never a button fill).
	const bx = sx + 3.0, by = sy + 21.4, bw = 29.6, bh = 6.2
	const bs = 1 - 0.03 * press
	const btn = el('g', bs < 1 ? { transform: `translate(${bx + bw / 2} ${by + bh / 2}) scale(${bs.toFixed(4)}) translate(${-(bx + bw / 2)} ${-(by + bh / 2)})` } : {}, s)
	el('rect', { x: bx, y: by, width: bw, height: bh, rx: 1.0, fill: C.cobalt }, btn)
	bar(btn, bx + bw / 2 - 3.5, by + bh / 2 - 0.6, 7, 1.2, C.white)
	const [e1, e2] = echo || [tap, tap]
	const tx = sx + 25.6, ty = sy + 24.5 // right of the label bar, so the echo never crosses it
	if (e1) el('path', { d: hexPath(tx, ty, 1.7, 0.15), fill: 'none', stroke: C.white, 'stroke-width': 0.14 }, s)
	if (e2) el('path', { d: hexPath(tx, ty, 3.7, 0.3), fill: 'none', stroke: C.cobalt300, 'stroke-width': 0.12 }, s)
	// The rest of the portal: an invoice and a quote from Shillinq, a request from Pipelinq.
	for (const row of BELOW) {
		const y = row.y
		rowCard(s, sx + 1.2, sy + y, 33.2, 6.4)
		miniHex(s, sx + 4.4, sy + y + 3.2, 1.7, C.cobalt, row.app)
		bar(s, sx + 7.4, sy + y + 1.9, 14, 1.3, C.cobalt)
		bar(s, sx + 7.4, sy + y + 3.9, 8, 0.8, C.cobalt300)
		pip(s, sx + 31.6, sy + y + 3.2, 0.9, C.cobalt200)
	}
}

/* ----------------------------------------------------------- the bell (ncDesk) */

/**
 * Where things sit on the colleague's Nextcloud, relative to the workspace
 * cell's centre. The header row is Nextcloud's own (AppMock .topbar: logo,
 * app shelf, spacer, bell, avatar), set straight on the workspace blue, which
 * is Nextcloud's default header colour. The popover hangs under the bell.
 */
export const DESK = {
	headY: -42,
	bellX: 22,
	avatarX: 29.5,
	pop: { x: -25, y: -35.5, w: 56, h: 64 },
}

/** The Lucide bell (#icon-bell) in the header, in world units, and its badge. */
export const BELL = { size: 5.2, badgeDx: 1.75, badgeDy: -1.55, badgeR: 1.45 }

/**
 * The colleague's Nextcloud. badge: the bell's badge, a small orange hex (the
 * one orange of the scene). fresh: the new notice (with the Filinq glyph: the
 * contract) sits on top of the list, above a shared file (#nc-files) and a
 * chat mention (#nc-talk), the notices they already get in the same bell.
 *
 * Film states: badgeScale sizes the badge about its centre (the pop); open
 * (0 to 1) drops the popover open from under the bell (0: closed, not drawn);
 * slide (0 to 1) brings the new notice in on top, pushing the others down,
 * and overrides fresh.
 */
export function ncDesk(g, cx, cy, { badge = true, fresh = true, badgeScale = 1, open = 1, slide = null } = {}) {
	const hy = cy + DESK.headY
	// Logo pill and the app shelf, left; greeked as the mock's .icon squares.
	el('rect', { x: cx - 110, y: hy - 1.6, width: 6.4, height: 3.2, rx: 1.6, fill: C.white }, g)
	for (let i = 0; i < 16; i++) el('rect', { x: cx - 100.5 + i * 5.6, y: hy - 1.5, width: 3, height: 3, rx: 0.4, fill: C.white, 'fill-opacity': 0.7 }, g)
	// The bell (Lucide, the brand's UI icon set) and who is signed in: the right person.
	const bx = cx + DESK.bellX
	el('use', { href: '#icon-bell', x: bx - BELL.size / 2, y: hy - BELL.size / 2, width: BELL.size, height: BELL.size, color: C.white }, g)
	el('circle', { cx: cx + DESK.avatarX, cy: hy, r: 2.5, fill: C.cobalt200, stroke: C.white, 'stroke-width': 0.4 }, g)
	if (badge && badgeScale > 0.001) {
		const kx = bx + BELL.badgeDx, ky = hy + BELL.badgeDy
		el('path', { d: hexPath(kx, ky, BELL.badgeR * badgeScale, 0.2 * badgeScale), fill: C.orange, stroke: C.nextcloud, 'stroke-width': 0.35 * Math.min(1, badgeScale) }, g)
	}
	if (open <= 0.001) return

	// The popover, with its caret pointing up at the bell. It drops open from under the bell.
	const { x, y, w, h } = DESK.pop
	const ox = cx + x, oy = cy + y
	const pg = el('g', {}, g)
	if (open < 1) {
		const id = nextId('popclip')
		const cp = el('clipPath', { id }, g)
		el('rect', { x: ox - 1, y: oy - 2, width: w + 2, height: (h + 3) * open }, cp)
		set(pg, { 'clip-path': `url(#${id})` })
	}
	el('rect', { x: ox, y: oy, width: w, height: h, rx: 1.4, fill: C.white }, pg)
	el('path', { d: `M${bx - 1.6} ${oy + 0.05}L${bx} ${oy - 1.6}L${bx + 1.6} ${oy + 0.05}Z`, fill: C.white }, pg)
	bar(pg, ox + 3.2, oy + 3.4, 15, 1.5, C.cobalt700)

	// The list, clipped under the popover's title so the new notice slides in from beneath it.
	const sl = slide !== null ? slide : fresh ? 1 : 0
	const lid = nextId('listclip')
	const lcp = el('clipPath', { id: lid }, pg)
	el('rect', { x: ox, y: oy + 7.6, width: w, height: h - 8.6 }, lcp)
	const list = el('g', { 'clip-path': `url(#${lid})` }, pg)
	const widths = { filinq: 26, 'nc-files': 22, 'nc-talk': 19 }
	const rows = [{ key: 'filinq', app: 'filinq', pos: -1 + sl }, { key: 'nc-files', icon: 'nc-files', pos: sl }, { key: 'nc-talk', icon: 'nc-talk', pos: 1 + sl }]
	for (const n of rows) {
		if (n.app && sl <= 0.001) continue
		const ry = oy + 9 + n.pos * 17.5
		const rc = ry + 8
		const top = n.app
		if (top) el('rect', { x: ox + 1.4, y: ry, width: w - 2.8, height: 16, rx: 1.0, fill: C.cobalt50 }, list)
		if (n.app) miniHex(list, ox + 7, rc, 3.3, C.cobalt, n.app)
		else ncIcon(list, ox + 7, rc, 5.6, n.icon, C.cobalt)
		const rw = widths[n.key]
		bar(list, ox + 13, rc - 2.6, rw, 1.7, top ? C.cobalt900 : C.cobalt700)
		bar(list, ox + 13, rc + 1.2, rw * 0.62, 1.0, C.cobalt300)
		bar(list, ox + w - 9.5, rc - 0.6, 6, 1.1, C.cobalt300)
	}
}

/* ------------------------------------------------------------ the flow lane */

/**
 * FLOWS (round 4): the flow the customer draws, in world units, on a lane under
 * the story row, drawn in the vocabulary of the design system's FlowMock (white
 * node cards with a 4 px kind bar, mint for a trigger, lavender for a step;
 * curved cobalt-200 edges). Each node hangs under the app hex it acts on and is
 * wired to it:
 *
 *   trigger  under Filinq: when the signing is complete (Filinq keeps signing
 *            requests as records, status COMPLETED; a trigger watches a record event)
 *   task     under Portaliq's column, wired to nothing above: the task for the right
 *            person (UserTaskNode), its owner an avatar
 *   notify   under the Nextcloud hex, wired up into it: the notification in the bell
 *            (SendNotificationNode)
 *
 * The customer draws it: in the key frame the notify step is still in the hand,
 * lifted off the lane with a flat 2D shadow, over its dashed slot (the one orange:
 * you decide). Nothing here runs and nothing is pre-built.
 *
 * States (all optional; the defaults are the key frame): trig, task (0 to 1: a
 * node's landing, 0 hidden), edge1, edge2, up (0 to 1: an edge drawing, stroke
 * reveal), lift (0 to 1: the notify step's position between the pick-up point and
 * its slot; 1 is dropped), slot (0 to 1: the dashed slot showing), into (0 to 1:
 * the edge climbing into the Nextcloud hex), accent (false: the slot is drawn
 * without its orange).
 */
/** The lane sits 261 world units under the story row (A19: the story row is row 0, east of the lead). */
export const LANE = { y: cellXY(...STORY.filinq)[1] + 261, w: 196, h: 92, pick: [-44, -40] }

export function laneNodes() {
	const [fx] = cellXY(...STORY.filinq)
	const [px] = cellXY(...STORY.portaliq)
	const [nx, ny] = cellXY(...STORY.nextcloud)
	const [lx, ly] = cellXY(...STORY.filinq)
	return {
		trig: { x: fx - LANE.w / 2, y: LANE.y - LANE.h / 2 },
		task: { x: px - LANE.w / 2, y: LANE.y - LANE.h / 2 },
		notify: { x: nx - LANE.w / 2, y: LANE.y - LANE.h / 2 },
		filinqFoot: [lx, ly + R],
		ncFoot: [nx, ny + R],
	}
}

function nodeCard(g, x, y, kind, content) {
	const { w, h } = LANE
	el('rect', { x, y, width: w, height: h, rx: 10, fill: C.white, stroke: C.cobalt100, 'stroke-width': 1.5 }, g)
	el('rect', { x: x + 6, y: y + 12, width: 6, height: h - 24, rx: 3, fill: kind === 'trigger' ? C.mint : C.lavender }, g)
	const ix = x + 40, iy = y + h / 2
	content(ix, iy)
	bar(g, x + 70, y + 28, w * 0.46, 9, C.cobalt700)
	bar(g, x + 70, y + 48, w * 0.5, 6, C.cobalt200)
	bar(g, x + 70, y + 62, w * 0.32, 6, C.cobalt200)
}

/** Stroke-reveal length for a path of known length (so an edge can draw on). */
function reveal(len, p) {
	return p >= 1 ? {} : { 'stroke-dasharray': `${len.toFixed(1)} ${len.toFixed(1)}`, 'stroke-dashoffset': (len * (1 - p)).toFixed(1) }
}

export function flowLane(g, { trig = 1, task = 1, edge1 = 1, edge2 = 1, up = 1, lift = 0.35, slot = 1, into = 0, accent = true, card = 1 } = {}) {
	const N = laneNodes()
	const { w, h } = LANE
	const edge = { fill: 'none', stroke: C.cobalt200, 'stroke-width': 4, 'stroke-linecap': 'round' }
	const lg = el('g', {}, g)

	// Filinq's foot to the trigger: the record event that starts it.
	if (up > 0.001 && trig > 0.001) {
		const [ax, ay] = N.filinqFoot
		const len = N.trig.y - ay
		el('path', { d: `M${ax} ${ay}V${N.trig.y}`, ...edge, ...reveal(len, up) }, lg)
		el('circle', { cx: ax, cy: ay, r: 6, fill: C.mint }, lg)
	}
	// trigger -> task
	const tr = [N.trig.x + w, LANE.y], tl = [N.task.x, LANE.y]
	if (edge1 > 0.001) el('path', { d: `M${tr[0]} ${tr[1]}H${tl[0]}`, ...edge, ...reveal(tl[0] - tr[0], edge1) }, lg)
	// task -> the notify step (round 6): one solid edge that follows the card from the moment it is
	// picked up, so it simply straightens as the card settles; no dashed-to-solid switch, no redraw.
	const sr = [N.task.x + w, LANE.y]
	const k0 = Math.min(1, Math.max(0, lift))
	const cardL = [N.notify.x + LANE.pick[0] * (1 - k0), N.notify.y + LANE.pick[1] * (1 - k0) + h / 2]
	if (edge2 > 0.001 && card > 0.001) {
		const mx = (sr[0] + cardL[0]) / 2
		el('path', { d: `M${sr[0]} ${sr[1]}C${mx} ${sr[1]} ${mx} ${cardL[1]} ${cardL[0]} ${cardL[1]}`, ...edge, opacity: Math.min(1, card).toFixed(3) }, lg)
	}

	const pop = (k) => 0.9 + 0.1 * Math.min(1, k)
	const place = (k, x, y, draw) => {
		if (k <= 0.001) return
		const cx = x + w / 2, cy = y + h / 2, s = pop(k)
		const ng = el('g', k < 1 ? { opacity: Math.min(1, k * 1.4).toFixed(3), transform: `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})` } : {}, lg)
		draw(ng)
	}
	// The trigger: Filinq's glyph, the signing complete.
	place(trig, N.trig.x, N.trig.y, (ng) => nodeCard(ng, N.trig.x, N.trig.y, 'trigger', (ix, iy) => miniHex(ng, ix, iy, 17, C.cobalt, 'filinq')))
	// The task, for the right person: an avatar.
	place(task, N.task.x, N.task.y, (ng) => nodeCard(ng, N.task.x, N.task.y, 'step', (ix, iy) => {
		el('circle', { cx: ix, cy: iy, r: 15, fill: C.cobalt200 }, ng)
		el('circle', { cx: ix, cy: iy - 4, r: 5.5, fill: C.white }, ng)
		el('path', { d: `M${ix - 9} ${iy + 10}Q${ix} ${iy + 1} ${ix + 9} ${iy + 10}`, fill: C.white }, ng)
	}))

	// The notify step: its dashed slot (the one orange: you decide), fading as the card covers it, and
	// the card travelling to it on one continuous ease (round 6: no stall, no snap). Its flat 2D shadow
	// closes in as it lands, so the landing is a settle, not a switch.
	if (slot > 0.001) {
		el('rect', { x: N.notify.x, y: N.notify.y, width: w, height: h, rx: 10, fill: 'none', stroke: accent ? C.orange : C.cobalt300, 'stroke-width': 4, 'stroke-dasharray': '16 11', opacity: Math.min(1, slot).toFixed(3) }, lg)
	}
	const k = k0
	const ox = N.notify.x + LANE.pick[0] * (1 - k), oy = N.notify.y + LANE.pick[1] * (1 - k)
	if (card > 0.001) {
		const cx = ox + w / 2, cy = oy + h / 2, sc = 0.94 + 0.06 * Math.min(1, card)
		const cg = el('g', card < 1 ? { opacity: Math.min(1, card).toFixed(3), transform: `translate(${cx} ${cy}) scale(${sc.toFixed(4)}) translate(${-cx} ${-cy})` } : {}, lg)
		const sh = 1 - k
		if (sh > 0.002) el('rect', { x: ox + 12 * sh, y: oy + 14 * sh, width: w, height: h, rx: 10, fill: C.cobalt900, 'fill-opacity': (0.45 * Math.min(1, sh * 2)).toFixed(3) }, cg)
		nodeCard(cg, ox, oy, 'step', (ix, iy) => el('use', { href: '#icon-bell', x: ix - 17, y: iy - 17, width: 34, height: 34, color: C.cobalt }, cg))
	}

	// Up into the Nextcloud hex: the notification reaches the bell. The dashed guide fades as the solid edge climbs.
	const [ux, uy] = N.ncFoot
	if (card > 0.001 && into < 0.999) el('path', { d: `M${ux} ${N.notify.y}V${uy}`, ...edge, 'stroke-dasharray': '10 12', opacity: (0.6 * (1 - into) * Math.min(1, card)).toFixed(3) }, lg)
	if (into > 0.001) {
		el('path', { d: `M${ux} ${N.notify.y}V${uy}`, ...edge, ...reveal(N.notify.y - uy, into) }, lg)
		el('circle', { cx: ux, cy: uy, r: 6 * Math.min(1, Math.max(0, (into - 0.8) / 0.2)), fill: C.mint }, lg)
	}
	return lg
}

/**
 * The flow's one continuous drop (round 6), shared by the board and the film so the key frame is
 * the film's frame: from the pick-up to the slot on a single smooth ease, no hold on the way.
 */
export const dropEase = (p) => {
	const x = Math.min(1, Math.max(0, p))
	return x * x * x * (x * (6 * x - 15) + 10) // smootherstep: zero velocity and acceleration at both ends
}

/* ------------------------------------------------- the assistant (the desk) */

/**
 * ASSISTANT (round 4, reworked so the mechanism shows): the assistant inside
 * the Hermiq cell, in the vocabulary of HermiqMock, as two panels.
 *
 *   rail   left, on cobalt-50: what your apps hand the assistant. Each app that
 *          declares actions has a block: its glyph, its records (a small table) and
 *          its actions, each with a switch: what you allow. Pipelinq (9 actions at
 *          0.5.1, among them create a lead and log a contact moment) and Filinq (17
 *          at 0.2.0, among them edit a document). Only apps with declared actions
 *          are shown, never "every app".
 *   chat   right: your question; the answer read from the records (client rows with
 *          the Pipelinq glyph); then the change it wants to make, with Not now (ghost)
 *          and Allow (cobalt primary), waiting. A thin line ties that change to the
 *          action in the rail it would use (lit with a cobalt ring): it can only reach
 *          for what the apps handed it and you switched on.
 *
 * Why this is true: round4/facts.json fact b. Records reach the assistant as tools
 * (OpenRegister ObjectsToolProvider), actions as #[McpTool] methods; Hermiq's engine
 * offers only granted tools and holds any write it was not granted for a person's
 * approval (FacadeToolInvoker). The one orange is the ring round Allow while it waits.
 *
 * States (optional; the defaults are the key frame s7b): rail (0 to 2, fractional:
 * the app blocks landing), ask (0 to 1), dots (typing offsets, overrides the answer),
 * grow (0 to 1), rows (0 to 2), appr (0 to 1: the change landing), accent (true: the
 * ring round Allow is orange), press (0 to 1), done (0 to 1: allowed, its pip mint,
 * the buttons gone, a new row in the rail's Pipelinq records).
 */
export const DESK2 = { x: -46, y: -40, w: 92, h: 80, rail: 32 }

function toggle(g, x, cy, on) {
	const w = 4.4, h = 2.4
	el('rect', { x, y: cy - h / 2, width: w, height: h, rx: h / 2, fill: on ? C.mint : C.cobalt200 }, g)
	el('circle', { cx: on ? x + w - h / 2 : x + h / 2, cy, r: h / 2 - 0.4, fill: C.white }, g)
}

function bubble(g, x, y, w, h, side = 'agent') {
	const r = 1.6, k = 0.4
	const user = side === 'user'
	const d = user
		? `M${x + r} ${y}H${x + w - k}Q${x + w} ${y} ${x + w} ${y + k}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`
		: `M${x + k} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + k}Q${x} ${y} ${x + k} ${y}Z`
	el('path', { d, fill: user ? C.cobalt100 : C.cobalt50, ...(user ? {} : { stroke: C.cobalt100, 'stroke-width': 0.15 }) }, g)
}

/** One app block in the rail: glyph and name, its records, its actions with switches. Returns the action pills' right-edge anchors. */
function railBlock(g, x, y, w, app, actions, { lit = -1, extraRow = 0 } = {}) {
	miniHex(g, x + 3.4, y + 2.6, 2.4, C.cobalt, app)
	bar(g, x + 7.2, y + 1.9, 12, 1.4, C.cobalt900)
	// Its records: a small table.
	const ty = y + 6.2
	el('rect', { x: x + 1, y: ty, width: w - 2, height: 6.6 + 2.6 * extraRow, rx: 0.8, fill: C.white, stroke: C.cobalt100, 'stroke-width': 0.12 }, g)
	for (let i = 0; i < 2; i++) {
		pip(g, x + 3.2, ty + 1.9 + i * 2.8, 0.7, C.cobalt300)
		bar(g, x + 5, ty + 1.4 + i * 2.8, 12 - i * 3, 1.0, C.cobalt300)
	}
	if (extraRow > 0.001) {
		const k = Math.min(1, extraRow)
		const rg = el('g', k < 1 ? { opacity: k.toFixed(3) } : {}, g)
		pip(rg, x + 3.2, ty + 1.9 + 2 * 2.8, 0.7, C.mint)
		bar(rg, x + 5, ty + 1.4 + 2 * 2.8, 13, 1.0, C.cobalt700)
	}
	// Its actions, each with a switch: what you allow.
	const anchors = []
	const ay0 = ty + 6.6 + 2.6 * extraRow + 1.6
	actions.forEach((on, i) => {
		const py = ay0 + i * 5
		el('rect', { x: x + 1, y: py, width: w - 2, height: 4, rx: 2, fill: C.white, stroke: i === lit ? C.cobalt : C.cobalt200, 'stroke-width': i === lit ? 0.4 : 0.12 }, g)
		bar(g, x + 3, py + 1.5, 13 - i * 2, 1.0, C.cobalt700)
		toggle(g, x + w - 6.6, py + 2, on)
		anchors.push([x + w - 1, py + 2])
	})
	return anchors
}

export function assistantDesk(g, cx, cy, { rail = 2, ask = 1, dots = null, grow = 1, rows = 2, appr = 1, accent = true, press = 0, done = 0, prepared = 0 } = {}) {
	const { x, y, w, h } = DESK2
	const ox = cx + x, oy = cy + y
	el('rect', { x: ox, y: oy, width: w, height: h, rx: 1.6, fill: C.white, stroke: C.cobalt100, 'stroke-width': 0.2 }, g)

	// Header: the assistant.
	const hy = oy + 4.8
	miniHex(g, ox + 4.6, hy, 2.7, C.cobalt, 'hermiq')
	bar(g, ox + 9, hy - 0.9, 16, 1.8, C.cobalt900)
	el('rect', { x: ox, y: oy + 9.4, width: w, height: 0.2, fill: C.cobalt100 }, g)

	// The rail: what your apps hand it.
	const rw = DESK2.rail
	el('rect', { x: ox, y: oy + 9.6, width: rw, height: h - 9.6, fill: C.cobalt50 }, g)
	el('rect', { x: ox + rw, y: oy + 9.6, width: 0.2, height: h - 9.6, fill: C.cobalt100 }, g)
	bar(g, ox + 2, oy + 12.2, 10, 1.1, C.cobalt400)
	const blocks = [
		{ app: 'pipelinq', actions: [true, true], y: oy + 15.6 },
		{ app: 'filinq', actions: [true, false], y: oy + 43 },
	]
	let lit = null
	blocks.forEach((b, i) => {
		const k = Math.min(1, Math.max(0, rail - i))
		if (k <= 0.001) return
		const bg = el('g', k < 1 ? { opacity: k.toFixed(3), transform: `translate(0 ${(3 * (1 - k)).toFixed(3)})` } : {}, g)
		const anchors = railBlock(bg, ox + 1.4, b.y, rw - 2.8, b.app, b.actions, { lit: i === 0 && (appr > 0.001 || prepared > 0.001) ? 0 : -1, extraRow: i === 0 ? done : 0 })
		if (i === 0) lit = anchors[0]
	})

	// The chat.
	const chx = ox + rw + 3, chw = w - rw - 6
	if (ask > 0.001) {
		const qw = 30, qx = ox + w - 3 - qw, qy = oy + 12.6
		const qg = el('g', ask < 1 ? { opacity: Math.min(1, ask * 1.4).toFixed(3) } : {}, g)
		bubble(qg, qx, qy, qw, 7.2, 'user')
		bar(qg, qx + 2.4, qy + 2, 22, 1.2, C.cobalt700)
		bar(qg, qx + 2.4, qy + 4.3, 13, 1.2, C.cobalt700)
	}
	const ax = chx, ay = oy + 22.4, aw = 42
	if (dots) {
		bubble(g, ax, ay, 12, 6.2, 'agent')
		dots.forEach((dy, i) => el('circle', { cx: ax + 3.2 + i * 2.8, cy: ay + 3.1 + dy, r: 0.8, fill: C.cobalt300 }, g))
	} else if (grow > 0.001) {
		const bh = 20 * grow
		const ag = el('g', {}, g)
		if (grow < 1) {
			const id = nextId('ansclip')
			const cp = el('clipPath', { id }, g)
			el('rect', { x: ax - 1, y: ay - 1, width: aw + 2, height: bh + 1 }, cp)
			set(ag, { 'clip-path': `url(#${id})` })
		}
		bubble(ag, ax, ay, aw, Math.max(bh, 3.4), 'agent')
		bar(ag, ax + 2.6, ay + 2.2, 22, 1.2, C.cobalt700)
		;[18, 14].forEach((rwid, i) => {
			const p = Math.min(1, Math.max(0, rows - i))
			if (p <= 0.001) return
			const ry = ay + 5.2 + i * 7
			const s = 0.9 + 0.1 * p
			const rg = el('g', p < 1 ? { opacity: p.toFixed(3), transform: `translate(${ax + 21} ${ry + 3}) scale(${s.toFixed(4)}) translate(${-(ax + 21)} ${-(ry + 3)})` } : {}, ag)
			el('rect', { x: ax + 1.8, y: ry, width: aw - 3.6, height: 6, rx: 0.9, fill: C.white, stroke: C.cobalt100, 'stroke-width': 0.12 }, rg)
			miniHex(rg, ax + 5.2, ry + 3, 2, C.cobalt, 'pipelinq')
			bar(rg, ax + 8.8, ry + 1.6, rwid, 1.3, C.cobalt900)
			bar(rg, ax + 8.8, ry + 3.6, rwid * 0.55, 0.9, C.cobalt300)
		})
	}

	// Round 6: the prepared action and the suggestion, waiting for you (preparedWork).
	if (prepared > 0.001) preparedWork(g, cx, cy, { appr: prepared, accent })
	// The change it wants to make, waiting for you (round 4 and 5).
	else if (appr > 0.001) {
		const px = chx, py = ay + 20 + 3, pw = 48, ph = 16
		const lift = 4 * (1 - Math.min(1, appr))
		const pg = el('g', appr < 1 ? { opacity: Math.min(1, appr).toFixed(3), transform: `translate(0 ${lift.toFixed(3)})` } : {}, g)
		// Tied to the action in the rail it would use.
		if (lit) {
			const [lx, ly] = lit
			el('path', { d: `M${lx} ${ly}C${lx + 5} ${ly} ${px - 5} ${py + 4} ${px} ${py + 4}`, fill: 'none', stroke: C.cobalt300, 'stroke-width': 0.3, 'stroke-dasharray': '0.9 0.7' }, pg)
		}
		bubble(pg, px, py, pw, ph, 'agent')
		pip(pg, px + 3.8, py + 3.6, 1.7, done > 0.5 ? C.mint : C.cobalt300)
		bar(pg, px + 7.2, py + 2.8, 24, 1.5, C.cobalt700)
		bar(pg, px + 7.2, py + 5.4, 16, 1.0, C.cobalt300)
		if (done < 0.999) {
			const bgp = el('g', done > 0.001 ? { opacity: (1 - done).toFixed(3) } : {}, pg)
			const by = py + 9.2
			el('rect', { x: px + 7.2, y: by, width: 12, height: 4.6, rx: 0.9, fill: C.white, stroke: C.cobalt200, 'stroke-width': 0.15 }, bgp)
			bar(bgp, px + 7.2 + 3, by + 1.8, 6, 1.0, C.cobalt400)
			const bx = px + 21.4, bw = 14, bh2 = 4.6
			const s = 1 - 0.04 * press
			const btn = el('g', s < 1 ? { transform: `translate(${bx + bw / 2} ${by + bh2 / 2}) scale(${s.toFixed(4)}) translate(${-(bx + bw / 2)} ${-(by + bh2 / 2)})` } : {}, bgp)
			el('rect', { x: bx, y: by, width: bw, height: bh2, rx: 0.9, fill: C.cobalt }, btn)
			bar(btn, bx + 3.5, by + 1.8, 7, 1.0, C.white)
			// The one orange: a ring round Allow while it waits (orange is never the button fill).
			if (accent && press < 0.5) el('rect', { x: bx - 1.1, y: by - 1.1, width: bw + 2.2, height: bh2 + 2.2, rx: 1.6, fill: 'none', stroke: C.orange, 'stroke-width': 0.5 }, bgp)
		}
	}

	// The prompt row: texture only.
	el('rect', { x: chx, y: oy + h - 7.4, width: chw - 7, height: 4.8, rx: 1.2, fill: C.white, stroke: C.cobalt200, 'stroke-width': 0.15 }, g)
	el('rect', { x: chx + chw - 5.6, y: oy + h - 7.4, width: 5.6, height: 4.8, rx: 1.2, fill: C.cobalt }, g)
}

/* ------------------------------------------------ round 5: the lead diagram */

/**
 * S1 (Ruben, round 5): "start a lead file and then with a line diagram connect it to
 * mail, calendars etc at the bottom", the Nextcloud apps in Nextcloud's colours. The
 * lead is the Pipelinq cell at the centre of the world; from its foot a line drops,
 * spreads both ways along a bus and drops again into a row of Nextcloud apps (a
 * Nextcloud-blue hex, white icon each), in world units under the lead. The apps are
 * the ones OpenRegister 2.1.0 links a record to (round4/facts.json, fact a); their
 * order along the bottom is the order of their ring slots, left to right (timing.js
 * DIAGRAM), so they fly up into the ring (s2) without crossing.
 *
 * States (optional; the defaults are the key frame): trunk, bus (0 to 1: the line
 * drawing on), drops { id: 0..1 } (each drop drawing on), pops { id: 0..1 } (each
 * app's hex scale, a spring may overshoot; 0 hidden), hide { id: true } (an app in
 * flight is drawn by the film instead), retract (0 to 1: the lines drawing back into
 * the lead).
 */
export const DIAG = { y: 450, bus: 310, pitch: 150, r: 72 }
export const diagramX = (i, n = 7) => (i - (n - 1) / 2) * DIAG.pitch

/** A Nextcloud app as the round-5 films draw it: a Nextcloud-blue hex with its white icon. */
export function ncHex(g, cx, cy, r, id, { opacity = 1 } = {}) {
	const hg = el('g', opacity < 1 ? { opacity: opacity.toFixed(3) } : {}, g)
	el('path', { d: hexPath(cx, cy, r, r * 0.08), fill: C.nextcloud }, hg)
	const s = r * 0.8
	el('use', { href: NC_SYMBOL[id], x: cx - s / 2, y: cy - s / 2, width: s, height: s, color: C.white }, hg)
	return hg
}

export function leadDiagram(g, order, { trunk = 1, bus = 1, drops = null, pops = null, hide = {}, retract = 0 } = {}) {
	const lg = el('g', {}, g)
	const line = { fill: 'none', stroke: C.cobalt200, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
	// Retracting runs in the order it drew, backwards: the drops into the bus, the bus into the trunk, the trunk into the lead.
	const keep = 1 - retract
	const keepDrop = 1 - Math.min(1, Math.max(0, retract / 0.4))
	const keepBus = 1 - Math.min(1, Math.max(0, (retract - 0.3) / 0.4))
	const keepTrunk = 1 - Math.min(1, Math.max(0, (retract - 0.6) / 0.4))
	const xs = order.map((_, i) => diagramX(i, order.length))
	const [x0, x1] = [xs[0], xs[xs.length - 1]]
	const top = R, by = DIAG.bus, hy = DIAG.y - DIAG.r
	// The trunk: from the lead's foot down to the bus.
	const tk = Math.min(trunk, keepTrunk)
	if (tk > 0.001) el('path', { d: `M0 ${top}V${top + (by - top) * tk}`, ...line }, lg)
	// The bus: out from the middle, both ways.
	const bk = Math.min(bus, keepBus)
	if (bk > 0.001) el('path', { d: `M${x0 * bk} ${by}H${x1 * bk}`, ...line }, lg)
	order.forEach((id, i) => {
		const dk = Math.min(drops ? drops[id] ?? 0 : 1, keepDrop)
		if (dk > 0.001) el('path', { d: `M${xs[i]} ${by}V${by + (hy - by) * dk}`, ...line }, lg)
		if (dk > 0.98 && keep > 0.98) el('circle', { cx: xs[i], cy: by, r: 6, fill: C.cobalt200 }, lg)
		const p = pops ? pops[id] ?? 0 : 1
		if (!hide[id] && p > 0.001) ncHex(lg, xs[i], DIAG.y, DIAG.r * p, id)
	})
	return lg
}

/* ------------------------------------------ round 5: the bell in an app window */

/**
 * S6 (Ruben, round 5): "the same 'app' design as Pipelinq instead of the Nextcloud
 * colour background". Inside the Nextcloud cell, a colleague's Nextcloud drawn as the
 * app films draw an app (the AppMock window of general.js: a white window on the
 * cobalt ground, its top bar cobalt-900), in world units round the cell's centre. The
 * cell's own fill turns from Nextcloud blue to cobalt as the camera goes in (board.js,
 * by screen radius), so the close-up is a white window on cobalt, not a blue frame.
 *
 * The top bar is Nextcloud's own header (the logo pill, the app shelf, the bell, who is
 * signed in). Under it, the Files app (the nav rail and a list), and the bell's popover:
 * the new notice (the Filinq glyph: the flow the customer drew in s5) lands on top of a
 * shared file (#nc-files) and a chat mention (#nc-talk). The badge on the bell is the one
 * orange.
 *
 * States: badge, badgeScale, open (0 to 1), slide (0 to 1), as ncDesk.
 */
export const WIN = { x: -38, y: -44, w: 80, h: 100, bar: 5.6, nav: 15, bellX: 22, avatarX: 29.5, pop: { x: -24, y: -35.2, w: 58, h: 66 } }

export function ncWindow(g, cx, cy, { badge = true, badgeScale = 1, open = 1, slide = 1 } = {}) {
	const { x, y, w, h, bar: bh, nav } = WIN
	const ox = cx + x, oy = cy + y
	el('rect', { x: ox, y: oy, width: w, height: h, rx: 1.2, fill: C.white }, g)
	// Nextcloud's header, in the app films' dark top bar.
	el('path', { d: `M${ox} ${oy + bh}V${oy + 1.2}Q${ox} ${oy} ${ox + 1.2} ${oy}H${ox + w - 1.2}Q${ox + w} ${oy} ${ox + w} ${oy + 1.2}V${oy + bh}Z`, fill: C.cobalt900 }, g)
	const hy = oy + bh / 2
	el('rect', { x: ox + 2.6, y: hy - 1.1, width: 4.4, height: 2.2, rx: 1.1, fill: C.white }, g)
	for (let i = 0; i < 10; i++) el('rect', { x: ox + 9.4 + i * 3.6, y: hy - 0.9, width: 1.8, height: 1.8, rx: 0.3, fill: C.white, 'fill-opacity': 0.7 }, g)
	const bx = cx + WIN.bellX
	el('use', { href: '#icon-bell', x: bx - 1.9, y: hy - 1.9, width: 3.8, height: 3.8, color: C.white }, g)
	el('circle', { cx: cx + WIN.avatarX, cy: hy, r: 1.8, fill: C.cobalt200, stroke: C.white, 'stroke-width': 0.3 }, g)
	// The Files app underneath: the nav rail and a list of files.
	el('rect', { x: ox, y: oy + bh, width: nav, height: h - bh, fill: C.cobalt50 }, g)
	for (let i = 0; i < 6; i++) {
		el('rect', { x: ox + 2, y: oy + bh + 4 + i * 4.2, width: 1.8, height: 1.8, rx: 0.3, fill: i === 0 ? C.cobalt : C.cobalt300 }, g)
		bar(g, ox + 5, oy + bh + 4.3 + i * 4.2, [7, 6, 8, 5, 7, 6][i], 1.2, i === 0 ? C.cobalt700 : C.cobalt300)
	}
	const mx = ox + nav + 4
	bar(g, mx, oy + bh + 4, 20, 2, C.cobalt900)
	for (let i = 0; i < 9; i++) {
		const ry = oy + bh + 10 + i * 7.4
		el('rect', { x: mx - 1.5, y: ry + 6.2, width: w - nav - 5, height: 0.15, fill: C.cobalt100 }, g)
		ncIcon(g, mx + 1.6, ry + 3, 3.2, 'nc-files', C.cobalt)
		bar(g, mx + 5, ry + 2.3, [22, 17, 25, 14, 20, 18, 23, 15, 19][i], 1.4, C.cobalt700)
		bar(g, mx + 42, ry + 2.5, 8, 1, C.cobalt300)
	}
	if (badge && badgeScale > 0.001) {
		const kx = bx + 1.4, ky = hy - 1.3
		el('path', { d: hexPath(kx, ky, 1.2 * badgeScale, 0.16 * badgeScale), fill: C.orange, stroke: C.cobalt900, 'stroke-width': 0.3 * Math.min(1, badgeScale) }, g)
	}
	if (open <= 0.001) return

	// The popover under the bell, with a flat 2D shadow so it reads over the white window.
	const p = WIN.pop
	const px = cx + p.x, py = cy + p.y
	const pg = el('g', {}, g)
	if (open < 1) {
		const id = nextId('popclip')
		const cp = el('clipPath', { id }, g)
		el('rect', { x: px - 1, y: py - 2, width: p.w + 3, height: (p.h + 4) * open }, cp)
		set(pg, { 'clip-path': `url(#${id})` })
	}
	el('rect', { x: px + 0.8, y: py + 1, width: p.w, height: p.h, rx: 1.4, fill: C.cobalt200 }, pg)
	el('rect', { x: px, y: py, width: p.w, height: p.h, rx: 1.4, fill: C.white, stroke: C.cobalt100, 'stroke-width': 0.2 }, pg)
	el('path', { d: `M${bx - 1.6} ${py + 0.1}L${bx} ${py - 1.6}L${bx + 1.6} ${py + 0.1}Z`, fill: C.white }, pg)
	bar(pg, px + 3.2, py + 3.4, 15, 1.5, C.cobalt700)
	const lid = nextId('listclip')
	const lcp = el('clipPath', { id: lid }, pg)
	el('rect', { x: px, y: py + 7.6, width: p.w, height: p.h - 8.6 }, lcp)
	const list = el('g', { 'clip-path': `url(#${lid})` }, pg)
	const widths = { filinq: 27, 'nc-files': 22, 'nc-talk': 19 }
	const rows = [{ key: 'filinq', app: 'filinq', pos: -1 + slide }, { key: 'nc-files', icon: 'nc-files', pos: slide }, { key: 'nc-talk', icon: 'nc-talk', pos: 1 + slide }]
	for (const n of rows) {
		if (n.app && slide <= 0.001) continue
		const ry = py + 9 + n.pos * 17.5
		const rc = ry + 8
		if (n.app) el('rect', { x: px + 1.4, y: ry, width: p.w - 2.8, height: 16, rx: 1.0, fill: C.cobalt50 }, list)
		if (n.app) miniHex(list, px + 7, rc, 3.3, C.cobalt, n.app)
		else ncIcon(list, px + 7, rc, 5.6, n.icon, C.cobalt)
		bar(list, px + 13, rc - 2.6, widths[n.key], 1.7, n.app ? C.cobalt900 : C.cobalt700)
		bar(list, px + 13, rc + 1.2, widths[n.key] * 0.62, 1.0, C.cobalt300)
		bar(list, px + p.w - 9.5, rc - 0.6, 6, 1.1, C.cobalt300)
	}
}

/* ------------------------------------------------ round 6: the lead's links */

/**
 * S1 (Ruben, round 6): "straight corners" and "place the components in the hex grid
 * pattern". The Nextcloud components are cells of the honeycomb (world.js RING, rows 2
 * and 3 under the lead), and each is linked to the lead by its own line with square
 * 90-degree corners: down from the lead's foot, along row 1 (all quiet cells), and down
 * the gap between cells into the component's top point. Mitred joins, butt ends, no dots
 * anywhere. The lines share the trunk and the bus, so a new one only ever adds its own
 * last leg to what is already drawn.
 *
 * States: links { id: 0..1 } (each line running out from the lead to its cell), retract
 * (0 to 1: every line drawing back into the lead).
 */
export const LINKS = { bus: 239, width: 8 }

/** The square-cornered route from the lead's foot to cell (q, r)'s top point, and its length. */
export function linkRoute(q, r) {
	const [x, y] = cellXY(q, r)
	const top = y - R
	const foot = R // the lead is the cell at (0, 0)
	if (Math.abs(x) < 0.5) return { d: `M0 ${foot}V${top}`, len: top - foot }
	return { d: `M0 ${foot}V${LINKS.bus}H${x}V${top}`, len: (LINKS.bus - foot) + Math.abs(x) + (top - LINKS.bus) }
}

export function leadLinks(g, cells, { links = null, retract = 0 } = {}) {
	const lg = el('g', {}, g)
	const line = { fill: 'none', stroke: C.cobalt200, 'stroke-width': LINKS.width, 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'stroke-miterlimit': 4 }
	for (const [id, [q, r]] of Object.entries(cells)) {
		const p = Math.min(links ? links[id] ?? 0 : 1, 1 - retract)
		if (p <= 0.001) continue
		const { d, len } = linkRoute(q, r)
		el('path', { d, ...line, ...(p < 1 ? { 'stroke-dasharray': `${len.toFixed(1)} ${len.toFixed(1)}`, 'stroke-dashoffset': (len * (1 - p)).toFixed(1) } : {}) }, lg)
	}
	return lg
}

/* ----------------------------- round 6: the notification on desktop and mobile */

/**
 * S6 (Ruben, round 6): "instant notifications to your environment and mobile ... a mobile
 * push message visual and a desktop bottom-left notification". Added to the app window of
 * round 5, in world units round the Nextcloud cell's centre:
 *
 *   toast   the desktop notification, bottom left of the window: a white card with a flat
 *           2D shadow, the Nextcloud mark, a title and a line (greeked), sliding in from the
 *           left edge
 *   phone   a phone in front of the window's right side, its lock screen dark: the time
 *           (greeked), and the push message card with the Nextcloud mark, title and line
 *
 * Rebuilt from the design system's vocabulary (the AppMock card and the flat phone of the
 * films), not invented. What is true: OpenRegister delivers the notice to the Nextcloud
 * bell (AnnotationNotificationDispatcher, NcNotificationSender), web push rides along with
 * it (SendNotificationNode: "Web-push rides along with the nc-notification channel"), and
 * Nextcloud's own clients carry its notifications to the phone.
 *
 * States: toast (0 to 1: sliding in), phone (0 to 1: rising in), push (0 to 1: the push
 * card dropping onto the lock screen).
 */
export const NOTE = {
	toast: { x: -36, y: 16, w: 34, h: 10.6 },
	phone: { x: 15, y: -13, w: 22, h: 47 },
}

function ncMark(g, cx, cy, w, color) {
	el('use', { href: '#nextcloud-logo', x: cx - w / 2, y: cy - (w * 60) / 130 / 2, width: w, height: (w * 60) / 130, color }, g)
}

export function ncNotify(g, cx, cy, { toast = 1, phone = 1, push = 1 } = {}) {
	// The desktop notification, bottom left of the window.
	if (toast > 0.001) {
		const t = NOTE.toast
		const dx = -40 * (1 - toast)
		const tg = el('g', { transform: `translate(${dx.toFixed(3)} 0)`, opacity: Math.min(1, toast * 1.6).toFixed(3) }, g)
		const x = cx + t.x, y = cy + t.y
		el('rect', { x: x + 0.6, y: y + 0.8, width: t.w, height: t.h, rx: 1.2, fill: C.cobalt200 }, tg)
		el('rect', { x, y, width: t.w, height: t.h, rx: 1.2, fill: C.white, stroke: C.cobalt100, 'stroke-width': 0.18 }, tg)
		el('rect', { x: x + 1.6, y: y + 1.6, width: 7.4, height: 7.4, rx: 1, fill: C.cobalt50 }, tg)
		ncMark(tg, x + 5.3, y + 5.3, 5.6, C.cobalt)
		bar(tg, x + 11, y + 2.9, 15, 1.5, C.cobalt900)
		bar(tg, x + 11, y + 5.6, 19, 1.0, C.cobalt300)
		bar(tg, x + 11, y + 7.6, 11, 1.0, C.cobalt300)
		bar(tg, x + t.w - 5.2, y + 2.9, 3.4, 1.0, C.cobalt200)
	}
	// The phone, in front of the window's right side, its lock screen and the push.
	if (phone > 0.001) {
		const p = NOTE.phone
		const dy = 34 * (1 - phone)
		const pg = el('g', { transform: `translate(0 ${dy.toFixed(3)})` }, g)
		const x = cx + p.x, y = cy + p.y
		el('rect', { x, y, width: p.w, height: p.h, rx: 3.4, fill: C.cobalt900 }, pg)
		const i = 0.9
		const sx = x + i, sy = y + i, sw = p.w - 2 * i, sh = p.h - 2 * i
		const id = nextId('lockscreen')
		const cp = el('clipPath', { id }, pg)
		el('rect', { x: sx, y: sy, width: sw, height: sh, rx: 2.6 }, cp)
		const s = el('g', { 'clip-path': `url(#${id})` }, pg)
		el('rect', { x: sx, y: sy, width: sw, height: sh, fill: C.cobalt800 }, s)
		el('rect', { x: sx + sw / 2 - 3.2, y: sy + 0.9, width: 6.4, height: 1.8, rx: 0.9, fill: C.cobalt900 }, s)
		// The lock screen: the time and the date, greeked.
		bar(s, sx + sw / 2 - 6.5, sy + 6.2, 13, 4.2, C.white)
		bar(s, sx + sw / 2 - 4.5, sy + 12, 9, 1.0, C.cobalt300)
		// The push message.
		if (push > 0.001) {
			const py = sy + 15.6 - 5 * (1 - push)
			const cg = el('g', { opacity: Math.min(1, push * 1.5).toFixed(3) }, s)
			el('rect', { x: sx + 1.2, y: py, width: sw - 2.4, height: 9.4, rx: 1.6, fill: C.white }, cg)
			el('rect', { x: sx + 2.3, y: py + 1.3, width: 3.4, height: 3.4, rx: 0.8, fill: C.cobalt50 }, cg)
			ncMark(cg, sx + 4, py + 3, 2.8, C.cobalt)
			bar(cg, sx + 6.7, py + 1.7, 8.4, 1.1, C.cobalt900)
			bar(cg, sx + sw - 4.8, py + 1.8, 2.4, 0.8, C.cobalt200)
			bar(cg, sx + 2.3, py + 5.6, sw - 5.2, 0.9, C.cobalt300)
			bar(cg, sx + 2.3, py + 7.3, sw - 9, 0.9, C.cobalt300)
		}
	}
}

/* ---------------------------------------- round 6: prepared actions and suggestions */

/**
 * S7 (Ruben, round 6): "ask questions about your data and have the assistant prepare
 * actions and suggestions". Drawn over the round-4 desk's last turn: one bubble, the
 * assistant's prepared work, waiting for you:
 *
 *   action      the change it prepared (its pending pip, a line, Not now and Allow; Allow
 *               ringed in orange, the one orange): a write you had not granted waits for a
 *               person's approval (Hermiq 0.2.0 FacadeToolInvoker, round4/facts.json fact b)
 *   suggestion  a suggestion under it (a lighter row with a ghost button): text it offers,
 *               nothing it does on its own
 *
 * The line from the rail's action to the prepared action stays: it can only reach for what
 * the apps handed it. States: appr (0 to 1: the bubble landing), accent.
 */
export function preparedWork(g, cx, cy, { appr = 1, accent = true } = {}) {
	if (appr <= 0.001) return
	const { x, y, rail } = DESK2
	const ox = cx + x, oy = cy + y
	const chx = ox + rail + 3
	const px = chx, py = oy + 45.2, pw = 50, ph = 23.6
	const lift = 4 * (1 - Math.min(1, appr))
	const pg = el('g', appr < 1 ? { opacity: Math.min(1, appr).toFixed(3), transform: `translate(0 ${lift.toFixed(3)})` } : {}, g)
	// Tied to the action in the rail it would use (Pipelinq's first action, at its right edge).
	const lx = ox + 1.4 + (rail - 2.8) - 1, ly = oy + 15.6 + 6.2 + 6.6 + 1.6 + 2
	el('path', { d: `M${lx} ${ly}C${lx + 5} ${ly} ${px - 5} ${py + 4} ${px} ${py + 4}`, fill: 'none', stroke: C.cobalt300, 'stroke-width': 0.3, 'stroke-dasharray': '0.9 0.7' }, pg)
	el('path', { d: `M${px + 0.4} ${py}H${px + pw - 1.6}Q${px + pw} ${py} ${px + pw} ${py + 1.6}V${py + ph - 1.6}Q${px + pw} ${py + ph} ${px + pw - 1.6} ${py + ph}H${px + 1.6}Q${px} ${py + ph} ${px} ${py + ph - 1.6}V${py + 0.4}Q${px} ${py} ${px + 0.4} ${py}Z`, fill: C.cobalt50, stroke: C.cobalt100, 'stroke-width': 0.15 }, pg)
	// The prepared action.
	pip(pg, px + 3.8, py + 3.6, 1.7, C.cobalt300)
	bar(pg, px + 7.2, py + 2.8, 24, 1.5, C.cobalt700)
	bar(pg, px + 7.2, py + 5.3, 15, 1.0, C.cobalt300)
	const by = py + 8
	el('rect', { x: px + 7.2, y: by, width: 12, height: 4.4, rx: 0.9, fill: C.white, stroke: C.cobalt200, 'stroke-width': 0.15 }, pg)
	bar(pg, px + 10.2, by + 1.7, 6, 1.0, C.cobalt400)
	const bx = px + 21.4, bw = 14, bh = 4.4
	el('rect', { x: bx, y: by, width: bw, height: bh, rx: 0.9, fill: C.cobalt }, pg)
	bar(pg, bx + 3.5, by + 1.7, 7, 1.0, C.white)
	if (accent) el('rect', { x: bx - 1.1, y: by - 1.1, width: bw + 2.2, height: bh + 2.2, rx: 1.6, fill: 'none', stroke: C.orange, 'stroke-width': 0.5 }, pg)
	// The suggestion: a lighter row, a ghost button; nothing happens until you take it.
	el('rect', { x: px + 0.2, y: py + 14.2, width: pw - 0.4, height: 0.15, fill: C.cobalt100 }, pg)
	el('path', { d: hexPath(px + 3.8, py + 18.6, 1.5, 0.2), fill: 'none', stroke: C.cobalt300, 'stroke-width': 0.3 }, pg)
	bar(pg, px + 7.2, py + 17.1, 21, 1.3, C.cobalt700)
	bar(pg, px + 7.2, py + 19.5, 13, 0.9, C.cobalt300)
	el('rect', { x: px + pw - 12.4, y: py + 16.4, width: 10, height: 4.2, rx: 0.9, fill: C.white, stroke: C.cobalt200, 'stroke-width': 0.15 }, pg)
	bar(pg, px + pw - 9.9, py + 18, 5, 1.0, C.cobalt400)
}
