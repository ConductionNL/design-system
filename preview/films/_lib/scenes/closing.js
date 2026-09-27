/**
 * The shared closing modules of every film (Ruben, round 4, 2026-09-27).
 *
 * Films are modular now: the shared Conduction opening, the film's own body,
 * then these two key frames, the same in every film:
 *
 *   builtOnFrame(ctx, p)   BRAND  "Built on ConNext": the common data layer in the middle,
 *                                 Nextcloud as the ground it stands on, the Nextcloud apps it
 *                                 links a record to round it, and the film's app on top
 *   installFrame(ctx, p)   BRAND  the ConNext wordmark, the install call as orange text at
 *                                 headline size (two lines), and "100% open source. Free to
 *                                 use. Pay for an SLA when your company grows."
 *
 * What the cluster shows is what ships (round4/facts.json, fact a): OpenRegister
 * 2.1.0, its latest stable release, links a record to Nextcloud Files, Mail,
 * Calendar, Contacts, Talk, Deck and Tasks (IntegrationRegistry providers,
 * Application::bootBuiltinIntegrationProviders), and to more Nextcloud apps
 * (Activity, Polls, Photos, Forms, among others). Those four "more" cells sit in
 * the outer ring at lower opacity: there are more, and we do not count them.
 * Nextcloud Notes is NOT shown: OpenRegister's "Notes" are notes on the record in
 * Nextcloud's comments, not the Notes app.
 *
 * Brand (bible): 16:9, type in the left column (x 120 to 840, inside the safe box
 * y 96 to 930), picture right; pointy-top hexes only, never rotated; no terracotta;
 * orange is text or one shape, never a box behind text, one per frame (on the cobalt
 * ground the app icon hex and the install call may both be orange); the word
 * Nextcloud in running copy is white; the ConNext wordmark is the real symbol, never
 * live type; icons are real symbols, never drawn: #nc-* for Nextcloud's own apps
 * as brand symbols: #nc-* for Nextcloud's bundled apps, #icon-* (brand/assets/icons/) for the rest.
 *
 * Depends only on the engine (stage, core, brand, assets), not on ui.js or a
 * film's board, so every film can import it. Colours from C.* only.
 */
import { el, textBlock, measure } from '../stage.js'
import { hexPath, SQRT3 } from '../core.js'
import { C } from '../brand.js'
import { APP_NAMES, MARK_BOX } from '../assets.js'

/* ---------- icons the brand assets do not carry yet ---------- */

/* ---------- what the data layer links to (fact a, round4/facts.json) ---------- */

/**
 * The Nextcloud apps a record links to, in OpenRegister 2.1.0, as the cluster
 * shows them. `icon` is the symbol id; `more` marks the outer, quieter cells.
 * `provider` names the file at the tag that ships it, so the board can be checked.
 */
export const NC_LINKS = [
	{ id: 'files', name: 'Files', icon: 'nc-files', provider: 'BuiltinProviders/FilesProvider.php' },
	{ id: 'mail', name: 'Mail', icon: 'nc-mail', provider: 'Providers/EmailProvider.php (requires mail)' },
	{ id: 'calendar', name: 'Calendar', icon: 'nc-calendar', provider: 'Providers/CalendarProvider.php (requires calendar)' },
	{ id: 'deck', name: 'Deck', icon: 'nc-decks', provider: 'Providers/DeckProvider.php (requires deck)' },
	{ id: 'contacts', name: 'Contacts', icon: 'icon-contacts', provider: 'Providers/ContactsProvider.php (requires contacts)' },
	{ id: 'talk', name: 'Talk', icon: 'nc-talk', provider: 'Providers/TalkProvider.php (requires spreed)' },
	{ id: 'tasks', name: 'Tasks', icon: 'icon-tasks', provider: 'BuiltinProviders/TasksProvider.php (CalDAV to-dos)' },
	{ id: 'activity', name: 'Activity', icon: 'nc-activity', provider: 'Providers/ActivityProvider.php (requires activity)', more: true },
	{ id: 'polls', name: 'Polls', icon: 'icon-polls', provider: 'Providers/PollsProvider.php (requires polls)', more: true },
	{ id: 'photos', name: 'Photos', icon: 'icon-photos', provider: 'Providers/PhotosProvider.php', more: true },
	{ id: 'forms', name: 'Forms', icon: 'icon-forms', provider: 'Providers/FormsProvider.php', more: true },
]

/* ---------- layout ---------- */

/** The 16:9 type grid (bible: safe box x 120 to 1800, y 96 to 930; type column x 120 to 840). */
const TX = 120
const COL_R = 840

/** Pixel centre of axial cell (q, r) round a centre, pointy-top, circumradius r plus a gap. */
function axial(cx, cy, q, r, size, gap) {
	const s = size + gap / SQRT3
	return [cx + s * SQRT3 * (q + r / 2), cy + s * 1.5 * r]
}

/**
 * Where everything sits round the data layer, in axial cells: the data layer at
 * the centre; Nextcloud two rows below it, under the two lower cells of the ring,
 * so the ring stands on it; the six nearest Nextcloud apps in the first ring;
 * Tasks and the quieter "more" cells in the outer ring; the film's app (and, for
 * the ConNext film, the apps of its story) along the top, above the data layer.
 */
export const BUILT_ON = {
	size: 78,
	gap: 10,
	centre: [1340, 452],
	layer: [0, 0],
	nextcloud: [-1, 2],
	ring: { files: [0, -1], mail: [1, -1], calendar: [1, 0], deck: [0, 1], contacts: [-1, 1], talk: [-1, 0], tasks: [2, -1], activity: [-1, -1], polls: [2, 0], photos: [1, 1], forms: [-2, 1] },
	/** The top row: the film's app in the middle (1, -2), the other story apps either side. */
	top: [[1, -2], [0, -2], [2, -2]],
	/** The ground the cluster stands on: the rows under Nextcloud, bleeding off the frame. */
	groundRows: [2, 3, 4],
}

/** A hex with an icon or glyph centred in it. */
function cell(g, cx, cy, r, fill, { icon = null, glyph = null, color = C.cobalt, box = null, opacity = 1, ring = 0, ringFill = C.white } = {}) {
	const cg = el('g', opacity < 1 ? { opacity: opacity.toFixed(3) } : {}, g)
	if (ring) el('path', { d: hexPath(cx, cy, r + ring, (r + ring) * 0.1), fill: ringFill }, cg)
	el('path', { d: hexPath(cx, cy, r, r * 0.1), fill }, cg)
	const id = icon || (glyph ? `g-${glyph}` : null)
	if (id) {
		const [w, h] = box || (icon ? [r * 0.8, r * 0.8] : [r * 0.92, r * 0.92])
		el('use', { href: `#${id}`, x: cx - w / 2, y: cy - h / 2, width: w, height: h, color }, cg)
	}
	return cg
}

/** The one Nextcloud workspace hex a frame may carry: Nextcloud blue with the white mark. */
function workspaceHex(g, cx, cy, r) {
	const [bw, bh] = MARK_BOX['nextcloud-logo']
	const w = r * 1.12
	return cell(g, cx, cy, r, C.nextcloud, { icon: 'nextcloud-logo', color: C.white, box: [w, (w * bh) / bw] })
}

/** The ConNext wordmark placed by height, its ink (the C starts 4.24 units in) on x. */
function wordmark(g, x, y, h) {
	const [bw, bh] = MARK_BOX['wordmark-connext-white']
	return el('use', { href: '#wordmark-connext-white', x: x - (4.24 * h) / bh, y, width: (h * bw) / bh, height: h }, g)
}

/* ---------- BRAND: built on ConNext ---------- */

/**
 * builtOnFrame(ctx, p): "Built on" and the ConNext wordmark in the type column;
 * on the right the cluster: the common data layer (a forest hex, the data family,
 * with its app's real glyph and no name: no platform internals on screen), the
 * Nextcloud workspace hex under it as the ground, the ground rows of the honeycomb
 * spreading from there off the foot of the frame, and round the data layer the
 * Nextcloud apps it links a record to. The film's app sits on top, above the data
 * layer: orange, the frame's one orange (the app icon exception on cobalt), with
 * its name as a small label.
 *
 *   app      optional app id: the film's app, singled out on top (orange, labelled)
 *   apps     optional app ids beside it on the top row (cobalt cells, white glyphs, white ring), for
 *            a film about several apps (the ConNext film passes the apps of its story);
 *            at most two are placed
 *   caption  the live words before the wordmark (default 'Built on')
 *   label    false hides the app's name label (default true when app is set)
 *   show     optional { ring: 0..1, more: 0..1, top: 0..1, type: 0..1 } for the film's
 *            build; left out, the frame draws its resting state
 *
 * Returns the placed cell centres, so a film can animate from them.
 */
export function builtOnFrame(ctx, p = {}) {
	const { g } = ctx
	const { app = null, apps = [], caption = 'Built on', label = true } = p
	const show = { ring: 1, more: 1, top: 1, type: 1, ...p.show }
	const L = BUILT_ON
	const [cx, cy] = L.centre
	const at = ([q, r]) => axial(cx, cy, q, r, L.size, L.gap)
	const cells = {}

	// The ground: the rows of the honeycomb under Nextcloud, dark and quiet, bleeding off the foot.
	for (const r of L.groundRows) {
		for (let q = -8; q <= 8; q++) {
			const [x, y] = at([q, r])
			if (x < 900 - L.size || x > ctx.W + L.size) continue
			if (q === L.nextcloud[0] && r === L.nextcloud[1]) continue
			const d = Math.abs(x - at(L.nextcloud)[0]) / (L.size * SQRT3)
			el('path', { d: hexPath(x, y, L.size, L.size * 0.1), fill: C.cobalt600, 'fill-opacity': Math.max(0.28, 1 - d * 0.16).toFixed(3) }, g)
		}
	}
	// Nextcloud: the ground the data layer stands on (under the ring's two lower cells).
	cells.nextcloud = at(L.nextcloud)
	workspaceHex(g, ...cells.nextcloud, L.size)

	// The common data layer, in the middle.
	cells.layer = at(L.layer)
	cell(g, ...cells.layer, L.size, C.forest, { glyph: 'openregister', color: C.white })

	// The Nextcloud apps it links a record to: white cells, cobalt line icons.
	for (const link of NC_LINKS) {
		const pos = L.ring[link.id]
		if (!pos) continue
		const k = link.more ? show.more : show.ring
		if (k <= 0.001) continue
		cells[link.id] = at(pos)
		cell(g, ...cells[link.id], L.size, C.white, { icon: link.icon, color: C.cobalt, opacity: (link.more ? 0.5 : 1) * k })
	}

	// The top row: the film's app singled out in the middle, other story apps either side.
	if (show.top > 0.001) {
		const top = []
		// Conduction's apps read apart from Nextcloud's: a cobalt hex, white glyph and a white ring
		// (the appTag look), where Nextcloud's apps are white cells with cobalt line icons.
		if (app) top.push({ id: app, fill: C.orange })
		for (const id of apps.slice(0, app ? 2 : 3)) top.push({ id, fill: C.cobalt })
		top.forEach((t, i) => {
			const pos = L.top[i]
			cells[t.id] = at(pos)
			cell(g, ...cells[t.id], L.size - 5, t.fill, { glyph: t.id, color: C.white, opacity: show.top, ring: 5 })
		})
		if (app && label) {
			const [ax, ay] = cells[app]
			const name = APP_NAMES[app] || app
			const size = 34
			// Left of the top row, right-aligned against it: an app name only ever as a small label.
			const leftmost = Math.min(...top.map((t) => cells[t.id][0]))
			textBlock(g, name, { x: leftmost - (SQRT3 / 2) * L.size - 22, y: ay + size * 0.36, anchor: 'end', size, weight: 600, fill: C.white, tracking: -0.02, clip: false })
		}
	}

	// The type column: the live words, then the wordmark under them.
	if (show.type > 0.001) {
		const tg = el('g', show.type < 1 ? { opacity: show.type.toFixed(3) } : {}, g)
		const size = 112
		textBlock(tg, caption, { x: TX, y: 468, size, weight: 700, fill: C.white, tracking: -0.02, clip: false })
		wordmark(tg, TX, 506, 128)
	}
	return { cells, size: L.size }
}

/* ---------- BRAND: the install board ---------- */

/** The install call and the line under it (Ruben, round 4). Every sentence under 16 words. */
export const INSTALL = {
	call: 'Install from the\nNextcloud app store',
	line: '100% open source. Free to use.\nPay for an SLA when your company grows.',
	/** Why each sentence is true (story.json facts). */
	sources: {
		'100% open source.': 'story.json facts: licence EUPL-1.2 (verified: llms.txt; connext.mdx:309; taalgebruik §7.4); "All apps are always free and open source" (foundation.html)',
		'Free to use.': 'story.json facts: price of the apps €0, support optional (verified)',
		'Pay for an SLA when your company grows.': 'story.json facts: support optional (verified); Ruben, round 4 decision (the line is his)',
	},
}

/**
 * installFrame(ctx, p): the end card. In the type column, top to bottom: the
 * ConNext wordmark; the install call as orange text at headline size on two
 * lines ("Nextcloud" orange too: the call is one line of orange, round 3); and
 * the white line under it on two lines, smaller. The orange call is the frame's
 * one orange (on cobalt the app hex may be orange too). The right of the frame
 * keeps a quiet honeycomb with the Nextcloud workspace hex, and the film's app on
 * it when there is one, so the end card still stands on Nextcloud.
 *
 *   app    optional app id: its hex (orange) sits on the Nextcloud hex, top right
 *   show   optional { call: 0..1, line1: 0..1, line2: 0..1 } for the film's staggered rise
 *
 * Sizes are measured, not guessed: the call at the largest size from 104 px down
 * that keeps "Nextcloud app store" inside x 120 to 1180 (clear of the picture),
 * the line at 64 px (the bible's caption minimum) or smaller only if it must.
 */
export function installFrame(ctx, p = {}) {
	const { g } = ctx
	const { app = null } = p
	const show = { call: 1, line1: 1, line2: 1, ...p.show }

	// The quiet honeycomb, top right, with Nextcloud in it (and the film's app on it).
	const size = 70, gap = 9
	const hcx = 1560, hcy = 300
	for (let q = -4; q <= 4; q++) {
		for (let r = -4; r <= 3; r++) {
			const [x, y] = axial(hcx, hcy, q, r, size, gap)
			const d = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
			if (y > 560 || x < 1200 || x > ctx.W + size || y < -size) continue
			if (q === 0 && r === 0) continue
			if (app && q === 0 && r === -1) continue
			el('path', { d: hexPath(x, y, size, size * 0.1), fill: C.cobalt600, 'fill-opacity': Math.max(0.25, 1 - d * 0.2).toFixed(3) }, g)
		}
	}
	workspaceHex(g, hcx, hcy, size)
	if (app) {
		const [ax, ay] = axial(hcx, hcy, 0, -1, size, gap)
		cell(g, ax, ay, size, C.orange, { glyph: app, color: C.white })
	}

	// The type column.
	const markH = 100
	const top = 220
	wordmark(g, TX, top, markH)
	const lines = INSTALL.call.split('\n')
	let callSize = 104
	const widest = (s, sz, w = 700) => Math.max(...s.split('\n').map((l) => measure(l, { size: sz, weight: w, tracking: -0.02 })))
	while (callSize > 88 && widest(INSTALL.call, callSize) > 1180 - TX) callSize -= 2
	const callLh = Math.round(callSize * 1.06)
	const callY = top + markH + 60 + Math.round(callSize * 0.74)
	if (show.call > 0.001) textBlock(el('g', show.call < 1 ? { opacity: show.call.toFixed(3) } : {}, g), INSTALL.call, { x: TX, y: callY, size: callSize, weight: 700, fill: C.orange, lineHeight: callLh / callSize, tracking: -0.02, clip: false })

	let lineSize = 64
	while (lineSize > 56 && widest(INSTALL.line, lineSize, 600) > 1800 - TX) lineSize -= 2
	const lineLh = Math.round(lineSize * 1.22)
	const lineY = callY + callLh * (lines.length - 1) + 70 + Math.round(lineSize * 0.74) + 40
	const [l1, l2] = INSTALL.line.split('\n')
	if (show.line1 > 0.001) textBlock(el('g', show.line1 < 1 ? { opacity: show.line1.toFixed(3) } : {}, g), l1, { x: TX, y: lineY, size: lineSize, weight: 600, fill: C.white, tracking: -0.01, clip: false })
	if (show.line2 > 0.001) textBlock(el('g', show.line2 < 1 ? { opacity: show.line2.toFixed(3) } : {}, g), l2, { x: TX, y: lineY + lineLh, size: lineSize, weight: 600, fill: C.white, tracking: -0.01, clip: false })
	return { callSize, lineSize, callY, lineY, lineLh }
}

/** The frames by name, for a film's module registry. */
export const CLOSING = { builtOn: builtOnFrame, install: installFrame }
