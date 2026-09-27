/**
 * Variant A helper: one honeycomb world seen through one camera.
 *
 * Direction A is a single take, so every board draws the SAME world and only
 * the camera and the cell states change. A camera is { x, y, z, px, py }:
 * world point (x, y) lands on screen point (px, py) at zoom z. The animation
 * interpolates these cameras between key frames; nothing is cut.
 *
 * The product UI lives in world space too, inside the cell of the app that
 * shows it (see ./ui.js), so a push into a cell reveals UI that was already
 * there at ring scale instead of fading in screen-space cards.
 *
 * Lives in the variant folder on purpose: the shared engine (_lib) is not
 * edited by a variant.
 */
import { el } from '../../../_lib/stage.js'
import { hexPath, axialToPixel, inv } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { APP_NAMES } from '../../../_lib/assets.js'

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
 * mails, meetings and chats are right there). The centre is Pipelinq: the
 * client record lives in the CRM. Four cells are Nextcloud's own apps, drawn
 * with their own line icons (#nc-*). Filinq (the contract) and Portaliq (the
 * portal) are horizontal neighbours, so the camera can glide from one cell
 * straight into the next.
 */
export const RING = {
	'0,0': 'pipelinq',
	'0,-1': 'nc-files',
	'1,-1': 'nc-mail',
	'1,0': 'nc-calendar',
	'-1,0': 'nc-talk',
	'-1,1': 'filinq',
	'0,1': 'portaliq',
}

const NC_NAMES = { 'nc-files': 'Nextcloud Files', 'nc-mail': 'Nextcloud Mail', 'nc-calendar': 'Nextcloud Calendar', 'nc-talk': 'Nextcloud Talk' }

/** Family colours from story.json app_family_colours; every other app is cobalt. */
const FAMILY_OF = { filinq: C.terracotta, dossiq: C.lavender, integriq: C.lavender }

/**
 * How an app cell looks. On the cobalt ground a cobalt app hex would vanish,
 * so it inverts: white hex, cobalt glyph. Family apps keep their family fill
 * with a white glyph. Nextcloud's own apps are white hexes with their cobalt
 * line icon. `active` is the one orange cell of a scene. `inner` draws the
 * app's UI inside the cell, in world units.
 */
export function appCell(id, { active = false, inner = null } = {}) {
	const nc = id.startsWith('nc-')
	const symbol = nc ? `#${id}` : `#g-${id}`
	const name = nc ? NC_NAMES[id] : APP_NAMES[id]
	if (active) return { fill: C.orange, symbol, glyphColor: C.white, name, inner }
	if (FAMILY_OF[id]) return { fill: FAMILY_OF[id], symbol, glyphColor: C.white, name, inner }
	return { fill: C.white, symbol, glyphColor: C.cobalt, name, inner, line: nc }
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
 * ({ fill, opacity, symbol, glyphColor, inner }) or null. info has the cell's
 * screen centre and radius, so a state can depend on where the cell sits on
 * screen (the stepped wipe does).
 *
 * Order inside a cell: hex, then the app's UI (inner), then the glyph on top.
 * The glyph fades out as the cell grows past the frame (screen radius 400 to
 * 600 px), so by the time the camera is inside a cell only its UI is left.
 */
export function drawWorld(parent, cam, state, { W = 1080, H = 1920, reach = 11 } = {}) {
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
		if (st.inner) st.inner(cg, wx, wy)
		const glyphOpacity = 1 - inv(400, 600, sr)
		if (st.symbol && glyphOpacity > 0) {
			// Line icons carry less ink than the solid app glyphs; a slightly smaller box keeps their weight even.
			const gs = st.line ? GLYPH * 0.86 : GLYPH
			el('use', { href: st.symbol, x: wx - gs / 2, y: wy - gs / 2, width: gs, height: gs, color: st.glyphColor, opacity: glyphOpacity < 1 ? glyphOpacity.toFixed(3) : null }, cg)
		}
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

/* ---------- UI vocabulary (AppMock / WidgetMock / SidebarMock: bars, cards, pips, one orange) ---------- */

export const bar = (g, x, y, w, h, fill) => el('rect', { x, y, width: w, height: h, rx: h / 2, fill }, g)

/** A small app hex with its real glyph, as the mocks put one in a card header or row. */
export function miniHex(g, cx, cy, r, fill, glyph, glyphColor = C.white) {
	el('path', { d: hexPath(cx, cy, r, r * 0.09), fill }, g)
	if (glyph) {
		const gs = r * 0.98
		el('use', { href: `#g-${glyph}`, x: cx - gs / 2, y: cy - gs / 2, width: gs, height: gs, color: glyphColor }, g)
	}
}

/** Status pip: a tiny solid hex (mint done, orange active, cobalt-200 upcoming). */
export const pip = (g, cx, cy, r, fill) => el('path', { d: hexPath(cx, cy, r, r * 0.12), fill }, g)
