/**
 * Variant A16 helper (direction A, "One take", re-composed for 16:9): one
 * honeycomb world seen through one camera.
 *
 * Direction A is a single take, so every board draws the SAME world and only
 * the camera and the cell states change. A camera is { x, y, z, px, py }:
 * world point (x, y) lands on screen point (px, py) at zoom z. The animation
 * interpolates these cameras between key frames; nothing is cut.
 *
 * The product UI lives in world space too, inside the cell of the app that
 * shows it (see ./ui.js), so a push into a cell reveals UI that was already
 * there instead of fading in screen-space cards.
 *
 * Changes from boards/A/world.js (the approved vertical record, untouched):
 *   - the stage is 1920 x 1080;
 *   - no brown: Filinq is a white app hex with its cobalt glyph like
 *     every other app (bible, 2026-09-27);
 *   - the story row runs east along r = 1: Filinq, Portaliq, then the one
 *     Nextcloud workspace hex (the bell) and Hermiq (the assistant), so the
 *     camera can glide cell to cell along one row;
 *   - a cell may keep its glyph at any zoom (keepGlyph, Filinq: the glyph's
 *     document border frames the contract), draw its UI over the glyph
 *     (innerOver), or reveal its UI with the zoom (innerIn: a screen-radius
 *     range), for cells whose glyph has no hollow to hold UI at ring scale.
 *
 * Lives in the variant folder on purpose: the shared engine (_lib) is not
 * edited by a variant.
 */
import { el } from '../../../_lib/stage.js'
import { hexPath, axialToPixel, inv } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { APP_NAMES, MARK_BOX } from '../../../_lib/assets.js'

export const W = 1920
export const H = 1080

/** Cell circumradius and gap in world units. */
export const R = 150
export const GAP = 16
const ROUND = 10
/** App glyph box inside a cell (world units): the glyph files are 24 x 24 viewBoxes. */
export const GLYPH = R * 0.92

export const cellXY = (q, r) => axialToPixel(q, r, R, GAP)
export const hexDist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
export const key = (q, r) => `${q},${r}`

/**
 * The first ring around your client (truth 2: open a client and their files,
 * mails, meetings and chats are right there), and the story row east of it.
 * The centre is Pipelinq: the client record lives in the CRM. Four cells are
 * Nextcloud's own apps with their own line icons (#nc-*). The bottom row
 * r = 1 is the one the camera travels: Filinq (the contract), Portaliq (the
 * portal), the Nextcloud workspace hex (the bell) and Hermiq (the assistant).
 */
export const RING = {
	'0,0': 'pipelinq',
	'0,-1': 'nc-files',
	'1,-1': 'nc-mail',
	'1,0': 'nc-calendar',
	'-1,0': 'nc-talk',
	'-1,1': 'filinq',
	'0,1': 'portaliq',
	'1,1': 'nextcloud',
	'2,1': 'hermiq',
}

/**
 * More apps that ripple on as the camera pulls out at the end (all in the Nextcloud app store).
 * Buildiq fills the open cell (2, 0) inside the story row rather than hanging below it
 * (round 3, 2026-09-27): the install call is now one line along the foot of the frame, so
 * the honeycomb keeps its bottom edge on the story row, clear of that line.
 */
export const WIDER = { '0,-2': 'integriq', '1,-2': 'decidiq', '2,-1': 'shillinq', '2,0': 'buildiq' }

const NC_NAMES = { 'nc-files': 'Nextcloud Files', 'nc-mail': 'Nextcloud Mail', 'nc-calendar': 'Nextcloud Calendar', 'nc-talk': 'Nextcloud Talk', nextcloud: 'Nextcloud' }

/** Family colours from story.json app_family_colours, without the documents family; every other app is cobalt. */
const FAMILY_OF = { dossiq: C.lavender, integriq: C.lavender }

/**
 * How an app cell looks. On the cobalt ground a cobalt app hex would vanish,
 * so it inverts: white hex, cobalt glyph. Family apps keep their family fill
 * with a white glyph. Nextcloud's own apps are white hexes with their cobalt
 * line icon. 'nextcloud' is the one workspace hex: Nextcloud blue with the
 * white Nextcloud mark. `active` is the one orange cell of a scene. `inner`
 * draws the app's UI inside the cell, in world units; `opts` passes through
 * keepGlyph, innerOver and innerIn (see drawWorld).
 */
export function appCell(id, { active = false, inner = null, ...opts } = {}) {
	if (id === 'nextcloud') {
		const [bw, bh] = MARK_BOX['nextcloud-logo']
		const gw = R * 1.12
		return { fill: C.nextcloud, symbol: '#nextcloud-logo', box: [gw, (gw * bh) / bw], glyphColor: C.white, name: NC_NAMES.nextcloud, inner, ...opts }
	}
	const nc = id.startsWith('nc-')
	const symbol = nc ? `#${id}` : `#g-${id}`
	const name = nc ? NC_NAMES[id] : APP_NAMES[id]
	if (active) return { fill: C.orange, symbol, glyphColor: C.white, name, inner, ...opts }
	if (FAMILY_OF[id]) return { fill: FAMILY_OF[id], symbol, glyphColor: C.white, name, inner, ...opts }
	return { fill: C.white, symbol, glyphColor: C.cobalt, name, inner, line: nc, ...opts }
}

/** Empty honeycomb cells: a solid, darker cobalt, fading with distance for depth. */
export function ghost(d) {
	const opacity = d <= 2 ? 1 : d === 3 ? 0.8 : d === 4 ? 0.6 : 0.42
	return { fill: C.cobalt600, opacity }
}

/** Every cell within n steps of the centre. */
function cells(n) {
	const out = []
	for (let q = -n; q <= n; q++) for (let r = Math.max(-n, -q - n); r <= Math.min(n, -q + n); r++) out.push([q, r])
	return out
}

/**
 * Draws the honeycomb under a camera. state(q, r, info) returns a cell look
 * ({ fill, opacity, symbol, box, glyphColor, inner, keepGlyph, innerOver,
 * innerIn }) or null. info has the cell's screen centre and radius, so a
 * state can depend on where the cell sits on screen.
 *
 * Order inside a cell: hex, the app's UI (inner), the glyph on top; with
 * innerOver the UI goes over the glyph. The glyph fades out as the cell grows
 * past the frame (screen radius 400 to 600 px) unless keepGlyph. With
 * innerIn [a, b] the UI fades in over that screen-radius range (so a cell
 * whose glyph has no hollow shows only its glyph at ring scale).
 */
export function drawWorld(parent, cam, state, { reach = 12 } = {}) {
	const { x, y, z, px, py } = cam
	const g = el('g', { transform: `translate(${px.toFixed(2)} ${py.toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-x).toFixed(3)} ${(-y).toFixed(3)})` }, parent)
	for (const [q, r] of cells(reach)) {
		const [wx, wy] = cellXY(q, r)
		const sx = px + (wx - x) * z
		const sy = py + (wy - y) * z
		const sr = R * z
		if (sx + sr < 0 || sx - sr > W || sy + sr < 0 || sy - sr > H) continue
		const st = state(q, r, { sx, sy, sr, d: hexDist(q, r), k: key(q, r) })
		if (!st) continue
		const cg = el('g', st.name ? { 'aria-label': st.name } : {}, g)
		el('path', { d: hexPath(wx, wy, R, ROUND), fill: st.fill, 'fill-opacity': st.opacity ?? 1 }, cg)
		const innerOpacity = st.innerIn ? inv(st.innerIn[0], st.innerIn[1], sr) : 1
		const drawInner = () => {
			if (!st.inner || innerOpacity <= 0) return
			const ig = el('g', innerOpacity < 1 ? { opacity: innerOpacity.toFixed(3) } : {}, cg)
			st.inner(ig, wx, wy)
		}
		if (!st.innerOver) drawInner()
		const glyphOpacity = st.keepGlyph ? 1 : 1 - inv(400, 600, sr)
		if (st.symbol && glyphOpacity > 0) {
			// Line icons carry less ink than the solid app glyphs; a slightly smaller box keeps their weight even.
			const [gw, gh] = st.box || (st.line ? [GLYPH * 0.86, GLYPH * 0.86] : [GLYPH, GLYPH])
			el('use', { href: st.symbol, x: wx - gw / 2, y: wy - gh / 2, width: gw, height: gh, color: st.glyphColor, opacity: glyphOpacity < 1 ? glyphOpacity.toFixed(3) : null }, cg)
		}
		if (st.innerOver) drawInner()
	}
	return g
}

/** A camera that puts world point (wx, wy) at screen point (px, py) with zoom z. */
export const camAt = (wx, wy, px, py, z) => ({ x: wx, y: wy, z, px, py })

/** A camera that puts the centre of cell (q, r) at screen point (px, py) with zoom z. */
export function camOn(q, r, px, py, z) {
	const [x, y] = cellXY(q, r)
	return { x, y, z, px, py }
}

/* ---------- UI vocabulary (AppMock / WidgetMock / SidebarMock / HermiqMock: bars, cards, pips, one orange) ---------- */

export const bar = (g, x, y, w, h, fill, extra = {}) => el('rect', { x, y, width: w, height: h, rx: h / 2, fill, ...extra }, g)

/** A small app hex with its real glyph, as the mocks put one in a card header or row. */
export function miniHex(g, cx, cy, r, fill, glyph, glyphColor = C.white) {
	el('path', { d: hexPath(cx, cy, r, r * 0.09), fill }, g)
	if (glyph) {
		const gs = r * 0.98
		el('use', { href: `#g-${glyph}`, x: cx - gs / 2, y: cy - gs / 2, width: gs, height: gs, color: glyphColor }, g)
	}
}

/** Nextcloud's own line icon (#nc-*) in a box of size s centred on (cx, cy). */
export function ncIcon(g, cx, cy, s, id, color = C.cobalt) {
	el('use', { href: `#${id}`, x: cx - s / 2, y: cy - s / 2, width: s, height: s, color }, g)
}

/** Status pip: a tiny solid hex (mint done, orange active, cobalt-200 upcoming). */
export const pip = (g, cx, cy, r, fill) => el('path', { d: hexPath(cx, cy, r, r * 0.12), fill }, g)
