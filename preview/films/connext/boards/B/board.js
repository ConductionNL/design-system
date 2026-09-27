/**
 * Direction B, "Sentence build": kinetic type leads.
 *
 * The problem is set in white on cobalt with the accent word in its one orange
 * block: one client spread over tab after tab. The turn slams a giant line onto
 * the cobalt field and a second onto a full-bleed forest field, while the tabs
 * fold into one client view. The answer grows a thin-line node diagram out of
 * the orange word, and the words swap while the diagram holds. An upright
 * hexagon iris closes the diagram into one cell of the end card.
 *
 * Every draw() builds the KEY FRAME of its scene: the resting frame the
 * animation is built around. Final sizes, positions and colours, camera at 1.0.
 *
 * No helper module: everything this variant needs is in this file.
 */
import { el, tf, textBlock } from '../../../_lib/stage.js'
import { hexPath, axialToPixel } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { APP_NAMES, MARK_BOX } from '../../../_lib/assets.js'

/* ---------- Grid and type scale (shared by every board so the cuts line up) ---------- */

const W = 1080
const H = 1920
const X0 = 120 // the left margin every word hangs from
const HEAD = 104 // headline size for sentence cards
const SLAM = 146 // the giant slam line: "One view," ends at x 766, clear of the right safe band
const SLAM2 = 120 // the slam's second line: "your server." is 784 px at 150, too wide for the box
const CTA = 72 // card-text minimum, used for the end card
const LABEL = 36 // app labels next to their hex (bible maximum)
const LH = 1.08
const BASE1 = 400 // baseline of line 1 on every sentence card
const BASE2 = BASE1 + Math.round(HEAD * LH) // baseline of line 2

/* ---------- Helpers ---------- */

/**
 * A sentence card: textBlock with *accent* words set in cobalt-900 on one
 * tight orange block (white or cobalt on orange fails 4.5:1; cobalt-900 on
 * orange is 5.9:1). Returns the block rect so a diagram can grow out of it.
 */
function sentence(g, text, { x = X0, y = BASE1, size = HEAD, fill = C.white, lineHeight = LH } = {}) {
	const under = el('g', {}, g)
	const tb = textBlock(g, text, { x, y, size, weight: 700, fill, accent: C.cobalt900, lineHeight, clip: false })
	let block = null
	for (const line of tb.lines) {
		const acc = line.items.filter((it) => it.node.getAttribute('fill') === C.cobalt900)
		if (!acc.length) continue
		const pad = size * 0.14
		const x1 = acc[0].x - pad
		const x2 = acc[acc.length - 1].x + acc[acc.length - 1].w + pad
		const y1 = line.y - size * 0.86
		const y2 = line.y + size * 0.27
		el('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, fill: C.orange }, under)
		block = { x1, x2, y1, y2, cx: (x1 + x2) / 2 }
	}
	return { tb, block }
}

function hex(g, cx, cy, r, fill, extra = {}) {
	return el('path', { d: hexPath(cx, cy, r), fill, ...extra }, g)
}

/** An app hex with its real glyph (never drawn by hand). */
function appHex(g, cx, cy, r, sym, { fill = C.cobalt, color = C.white, opacity = 1, k = 1.0 } = {}) {
	const gg = el('g', { opacity }, g)
	hex(gg, cx, cy, r, fill)
	const s = r * k
	el('use', { href: `#${sym}`, x: cx - s / 2, y: cy - s / 2, width: s, height: s, color }, gg)
	return gg
}

/** A side box: a source that is not one of our apps (here Nextcloud's own Files and Mail). */
const BOX_W = 132
const BOX_H = 96
function sideBox(g, cx, cy, sym, { opacity = 1 } = {}) {
	const gg = el('g', { opacity }, g)
	el('rect', { x: cx - BOX_W / 2, y: cy - BOX_H / 2, width: BOX_W, height: BOX_H, fill: C.white, stroke: C.cobalt200, 'stroke-width': 2 }, gg)
	el('use', { href: `#${sym}`, x: cx - 24, y: cy - 24, width: 48, height: 48, color: C.cobalt }, gg)
	return gg
}

function label(g, text, x, y, { anchor = 'start', fill = C.cobalt, size = LABEL, opacity = 1 } = {}) {
	const t = el('text', { x, y, fill, 'font-family': 'Figtree', 'font-weight': 600, 'font-size': size, 'letter-spacing': '-0.02em', 'text-anchor': anchor, opacity }, g)
	t.textContent = text
	return t
}

/** Solid 2D offset shadow (no blur), per the brand rule. */
function shadowRect(g, x, y, w, h, dx, dy, fill, opacity) {
	el('rect', { x: x + dx, y: y + dy, width: w, height: h, fill, 'fill-opacity': opacity }, g)
}

function wordmark(g, x, top, ms) {
	const [mw, mh] = MARK_BOX['wordmark-connext-white']
	return el('use', { href: '#wordmark-connext-white', x: x - 2 * ms, y: top, width: mw * ms, height: mh * ms }, g)
}

/* ---------- Scene 1: the same client in tab after tab ---------- */

/**
 * One tab of the problem: a browser-style window in the WidgetMock vocabulary
 * (tab strip, then the client's own header, then one stock Nextcloud tile body:
 * files list, mail list, calendar grid or chat). Every window carries the same
 * client chip and name bar, so seven different tabs read as one client. No
 * input, no caret: nobody retypes anything here, the client is just spread out.
 *
 * Depth is a tier of cobalt tokens (tier 0 is the front window), so back
 * windows stay opaque and never show through front ones. No mixed colours.
 */
const CARD_W = 460
const CARD_H = 250
const STRIP = 44
const NAME_W = 184 // the client's name bar: the same width in every window and in the s2 view
const TIERS = [
	{ body: C.white, strip: C.cobalt100, dark: C.cobalt700, mid: C.cobalt300, light: C.cobalt200, cell: C.cobalt50, shade: 0.45 },
	{ body: C.cobalt100, strip: C.cobalt200, dark: C.cobalt400, mid: C.cobalt300, light: C.cobalt200, cell: C.cobalt50, shade: 0.36 },
	{ body: C.cobalt200, strip: C.cobalt300, dark: C.cobalt400, mid: C.cobalt300, light: C.cobalt100, cell: C.cobalt100, shade: 0.28 },
	{ body: C.cobalt300, strip: C.cobalt400, dark: C.cobalt400, mid: C.cobalt400, light: C.cobalt200, cell: C.cobalt200, shade: 0.2 },
]
function tabWindow(g, x, y, s, kind, tier = 0) {
	const t = TIERS[tier]
	const c = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, g)
	shadowRect(c, 0, -STRIP, CARD_W, CARD_H + STRIP, 12, 14, C.cobalt900, t.shade)
	// tab strip: the active tab (body colour) and one inactive tab; square favicons, never hexes
	el('rect', { x: 0, y: -STRIP, width: CARD_W, height: STRIP, fill: t.strip }, c)
	el('rect', { x: 0, y: -STRIP, width: 178, height: STRIP, fill: t.body }, c)
	el('rect', { x: 18, y: -30, width: 16, height: 16, fill: t.mid }, c)
	el('rect', { x: 46, y: -26, width: 96, height: 8, fill: t.mid }, c)
	el('rect', { x: 198, y: -28, width: 12, height: 12, fill: t.light }, c)
	el('rect', { x: 220, y: -25, width: 70, height: 6, fill: t.light }, c)
	// body, and the client's header: the same chip and name bar in every window
	el('rect', { x: 0, y: 0, width: CARD_W, height: CARD_H, fill: t.body }, c)
	el('circle', { cx: 54, cy: 50, r: 24, fill: t.cell, stroke: t.light, 'stroke-width': 2 }, c)
	el('rect', { x: 94, y: 36, width: NAME_W, height: 14, fill: t.dark }, c)
	el('rect', { x: 94, y: 60, width: 276, height: 7, fill: t.mid }, c)
	el('rect', { x: 0, y: 96, width: CARD_W, height: 2, fill: t.strip }, c)
	// the tile body, per kind
	if (kind === 'mail') {
		;[124, 164, 204].forEach((cy, i) => {
			el('circle', { cx: 42, cy, r: 13, fill: i % 2 ? t.light : t.mid }, c)
			el('rect', { x: 68, y: cy - 10, width: [220, 180, 240][i], height: 7, fill: t.dark }, c)
			el('rect', { x: 68, y: cy + 4, width: [320, 290, 330][i], height: 5, fill: t.light }, c)
		})
	} else if (kind === 'files') {
		;[124, 162, 200].forEach((cy, i) => {
			el('rect', { x: 28, y: cy - 11, width: 20, height: 22, fill: i === 1 ? t.dark : t.mid }, c)
			el('rect', { x: 62, y: cy - 3, width: [340, 280, 320][i], height: 6, fill: t.light }, c)
		})
	} else if (kind === 'calendar') {
		const events = [3, 8, 11, 16]
		const today = 9 // today in the darkest token, not orange: the orange belongs to the headline
		for (let i = 0; i < 21; i++) {
			const col = i % 7
			const row = Math.floor(i / 7)
			const fill = i === today ? t.dark : events.includes(i) ? t.mid : t.cell
			el('rect', { x: 28 + col * 58, y: 110 + row * 42, width: 52, height: 36, fill }, c)
		}
	} else if (kind === 'chat') {
		el('rect', { x: 28, y: 112, width: 236, height: 30, fill: t.light }, c)
		el('rect', { x: 196, y: 152, width: 236, height: 30, fill: t.mid }, c)
		el('rect', { x: 28, y: 192, width: 176, height: 30, fill: t.light }, c)
	}
	return c
}

/* ---------- Scene 2: the one client view (SidebarMock shape) ---------- */

/**
 * The client view the tabs fold into, rebuilt from SidebarMock (header with
 * icon, title and close; a tab strip; a body of person rows) at k = w / 300,
 * the standalone mock's width. The tabs carry Nextcloud's own icons for the
 * windows that folded in: files, mail, calendar, chat. The mail tab is open.
 */
const VIEW_TABS = ['nc-files', 'nc-mail', 'nc-calendar', 'nc-talk']
function clientView(g, x, y, w) {
	const k = w / 300
	const pad = 10 * k
	const headH = pad * 2 + 16 * k
	const tabH = 64
	const rows = 4
	const bodyH = pad * 2 + rows * 22 + (rows - 1) * 12
	const h = headH + tabH + bodyH
	const v = el('g', {}, g)
	shadowRect(v, x, y, w, h, 10, 12, C.cobalt900, 0.35)
	el('rect', { x, y, width: w, height: h, fill: C.white }, v)
	// header: icon, title (the client's name bar, the same width as in every s1 window), description, close
	const icoR = 8 * k
	el('circle', { cx: x + pad + icoR, cy: y + pad + icoR, r: icoR, fill: C.cobalt50, stroke: C.cobalt200, 'stroke-width': 2 }, v)
	const mx = x + pad + icoR * 2 + 6 * k
	el('rect', { x: mx, y: y + pad + 3, width: NAME_W, height: 10, fill: C.cobalt900 }, v)
	el('rect', { x: mx, y: y + pad + 3 + 10 + 3 * k, width: 260, height: 5, fill: C.cobalt300 }, v)
	el('rect', { x: x + w - pad - 8 * k, y: y + pad + icoR - 4 * k, width: 8 * k, height: 8 * k, fill: C.cobalt300 }, v)
	el('rect', { x, y: y + headH - 2, width: w, height: 2, fill: C.cobalt100 }, v)
	// tab strip
	const ty = y + headH
	const tw = (w - pad * 2) / VIEW_TABS.length
	VIEW_TABS.forEach((sym, i) => {
		const active = i === 1
		const cx = x + pad + tw * (i + 0.5)
		el('use', { href: `#${sym}`, x: cx - 15, y: ty + 10, width: 30, height: 30, color: active ? C.cobalt700 : C.cobalt300 }, v)
		el('rect', { x: cx - 19, y: ty + 46, width: 38, height: 5, fill: active ? C.cobalt700 : C.cobalt300 }, v)
		if (active) el('rect', { x: cx - tw / 2, y: ty + tabH - 4, width: tw, height: 4, fill: C.cobalt }, v)
	})
	el('rect', { x, y: ty + tabH - 1, width: w, height: 2, fill: C.cobalt100 }, v)
	// body: the client's mails as person rows (smPerson), avatars in tokens, no orange
	const avatars = [C.cobalt200, C.forest300, C.cobalt300, C.cobalt200]
	for (let i = 0; i < rows; i++) {
		const cy = ty + tabH + pad + 11 + i * 34
		el('circle', { cx: x + pad + 11, cy, r: 11, fill: avatars[i] }, v)
		el('rect', { x: x + pad + 32, y: cy - 8, width: [250, 210, 280, 190][i], height: 6, fill: C.cobalt700 }, v)
		el('rect', { x: x + pad + 32, y: cy + 4, width: [180, 230, 150, 200][i], height: 4, fill: C.cobalt300 }, v)
	}
	return { x, y, w, h }
}

/* ---------- The diagram (shared by s3 and s4 so it truly holds across the swap) ---------- */

// A left label must start at x >= 120 ("Files" is 72 px at 36), a right label must end at x <= 780.
const NODE_R = 72
const COL_L = 284
const COL_R = 576
const SPINE_X = (COL_L + COL_R) / 2
const SPINE_TOP = 612
// Replit's spine: the nodes alternate sides, each on its own row. 92 px pitch keeps
// same-side hexes 184 apart (144 px tall) and puts Filinq's bottom vertex at y 1048.
const ROWS = [700, 792, 884, 976]
const PAPER = C.cobalt50 // ground of the answer scenes, so white UI reads as a card
const NODES = [
	// sources left as side boxes (Nextcloud's own apps: cited, not claimed); apps that use the client's details right as hexes
	{ id: 'files', sym: 'nc-files', name: 'Files', x: COL_L, y: ROWS[0], side: 'L' },
	{ id: 'portaliq', sym: 'g-portaliq', name: APP_NAMES.portaliq, x: COL_R, y: ROWS[1], side: 'R' },
	{ id: 'mail', sym: 'nc-mail', name: 'Mail', x: COL_L, y: ROWS[2], side: 'L' },
	{ id: 'filinq', sym: 'g-filinq', name: APP_NAMES.filinq, x: COL_R, y: ROWS[3], side: 'R' },
]
const LINE = 4

/** Root connector: from the bottom of the orange block down into the spine top, vertical tangents at both ends. */
function rootPath(bx, by) {
	const k = (SPINE_TOP - by) * 0.55
	return `M${bx.toFixed(1)} ${by.toFixed(1)}C${bx.toFixed(1)} ${(by + k).toFixed(1)} ${SPINE_X} ${(SPINE_TOP - k).toFixed(1)} ${SPINE_X} ${SPINE_TOP}`
}

function diagram(g, block, { dim = [], highlight = null, labels = true } = {}) {
	const lines = el('g', { fill: 'none', stroke: C.cobalt, 'stroke-width': LINE, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
	el('path', { d: rootPath(block.cx, block.y2) }, lines)
	el('path', { d: `M${SPINE_X} ${SPINE_TOP}V${ROWS[3]}` }, lines)
	for (const n of NODES) {
		// a left branch ends on the side box's right edge, a right branch on the hex's left vertex
		const edge = n.side === 'L' ? n.x + BOX_W / 2 : n.x - NODE_R * 0.866
		el('path', { d: `M${SPINE_X} ${n.y}H${edge.toFixed(1)}`, 'stroke-opacity': dim.includes(n.id) ? 0.22 : 1 }, lines)
	}
	// junction marks where each branch leaves the spine
	for (const y of ROWS) el('rect', { x: SPINE_X - 7, y: y - 7, width: 14, height: 14, fill: C.cobalt }, g)
	for (const n of NODES) {
		const opacity = dim.includes(n.id) ? 0.22 : 1
		if (n.side === 'L') sideBox(g, n.x, n.y, n.sym, { opacity })
		else appHex(g, n.x, n.y, NODE_R, n.sym, { fill: highlight === n.id ? C.terracotta : C.cobalt, opacity })
		if (labels) {
			const lx = n.side === 'L' ? n.x - BOX_W / 2 - 16 : n.x + NODE_R * 0.866 + 16
			label(g, n.name, lx, n.y + 12, { anchor: n.side === 'L' ? 'end' : 'start' })
		}
	}
}

/* ---------- The film ---------- */

export const meta = {
	id: 'B',
	title: 'Sentence build',
	logline: 'One sentence builds word by word: one client spread over tab after tab, then one view on your own server, then one client branching to the apps that use its details, ending on the store.',
	references: [
		{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'Words slam in big while the camera pulls back as the line grows; the accent word sits in its one orange shape; a thin-line diagram whose labels pop left and right about 0.17 s apart; words swap while the diagram holds; an iris into the end card (here an upright hexagon).' },
		{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'Headline template: line 1 in the ground\'s ink, line 2 in the orange accent about 0.5 to 0.8 s later; loose windows drifting round the problem headline; a hard full-bleed wipe between chapters.' },
		{ name: 'ChatGPT personal finance', url: 'https://whatships.com/videos/chatgpt-personal-finance/', borrow: 'The scale-contrast slam: a small line, then a giant line on its own flat colour field and a second on the next field about 0.5 s later, then back to a small line.' },
	],
	background: C.cobalt,
	safe: { top: 288, bottom: 672, left: 120, right: 300 },
}

export const boards = [
	{
		id: 's1',
		title: 'Same client, tab after tab',
		start: 0.0,
		end: 2.8,
		bars: '1.1-2.2',
		words: 'Same client,\ntab after tab.',
		motion: 'Frame 1 already holds both lines ("Same client," in white, "tab after tab." with "tab." in cobalt-900 on its orange block) and the front window (the client\'s mail), with the camera at 1.15x pivoted on the left margin at line 1\'s baseline (120, 400). From 1.2 (0.48) the camera pulls back to 1.0 by 1.4 (1.40) while the six other windows step in behind the front one, back to front, one per 16th (0.48, 0.60, 0.72, 0.84, 0.92, 1.04): files, calendar, chat, calendar, files, chat, each under the same client name bar, each a different tab. Hold: the windows drift up 8 px, the headline stays put. OUT: hard cut on 2.3 (2.80) to the slam.',
		sound: 'The pad is at full level on frame 1 (the end card\'s pad tail carries across the loop), no stinger, no fade. A soft tick per window from 1.2 in 16ths, the sixth a pluck. Hats enter on 2.1 (1.88).',
		apps: [],
		borrow: 'Replit sentence build (the camera pulls back as the frame fills, the accent word in its one orange shape) with Yoya\'s loose chips drifting round the problem headline, here the client\'s tabs.',
		draw(ctx) {
			const g = ctx.g
			// back to front: size and a tier of cobalt tokens carry the depth, no blur.
			// [x, body top y, scale, kind, tier]. Nothing below y 1410; the front window sits inside the text box.
			const windows = [
				[640, 690, 0.56, 'files', 3],
				[150, 700, 0.58, 'calendar', 3],
				[420, 800, 0.7, 'chat', 2],
				[770, 960, 0.72, 'calendar', 2],
				[-96, 850, 0.8, 'files', 1],
				[570, 1110, 0.86, 'chat', 1],
				[120, 994, 1.0, 'mail', 0],
			]
			for (const [x, y, s, kind, tier] of windows) tabWindow(g, x, y, s, kind, tier)
			sentence(g, 'Same client,\ntab after *tab.*', { fill: C.white })
		},
	},
	{
		id: 's2',
		title: 'One view, your server',
		start: 2.8,
		end: 5.16,
		bars: '2.3-3.3',
		words: 'One view,\nyour server.',
		motion: 'The turn is a hard scale contrast. Hard cut on 2.3 (2.80): the small headline is gone and "One view," slams in at 146 px on the cobalt field, the camera tight at 1.12x pivoted on the wordmark\'s corner (120, 300), so the line ends at x 844, inside 888; the ConNext wordmark stands still above it from this frame on. In the same beat the six back windows fold into the front window, back to front, two per 16th (2.80, 2.92, 3.04), still on cobalt. On 2.4 (3.28) the forest field slams up from the bottom edge to the seam (y 660), full bleed, "your server." punches in on its orange block at 120 px, the camera hard-reframes to 1.0, and the one window lands on the forest field as the client view: header with the client\'s name bar, a tab strip with files, mail, calendar and chat tabs, the mail tab open. Hold as a two-band poster, no drift. OUT: on 3.4 (5.16) a cobalt-50 full-bleed wipe rises from the bottom edge and lands 5.36 (Yoya chapter wipe).',
		sound: 'A soft whoosh on the cut at 2.80 and no hit, so the opening 3 s stay gentle. Two dry ticks as the windows fold in. The first firm hit on "your server." at 3.28. Kick and offbeat bass enter on 3.1 (3.76).',
		apps: [],
		borrow: 'ChatGPT scale-contrast slam: after the small line, a giant line on its own full-bleed field, then the next line on the next field about 0.5 s later. Yoya full-bleed wipe out.',
		draw(ctx) {
			const g = ctx.g
			const seam = 660
			el('rect', { x: 0, y: 0, width: W, height: H, fill: C.cobalt }, g)
			el('rect', { x: 0, y: seam, width: W, height: H - seam, fill: C.forest }, g)
			// the brand from 2.80: the wordmark above the slam, repeated on the end card
			wordmark(g, X0, 300, 0.9)
			// "One view," stands on the seam, "your server." hangs from it in the scene's one orange block
			textBlock(g, 'One view,', { x: X0, y: seam - 60, size: SLAM, weight: 700, fill: C.white, clip: false })
			sentence(g, '*your* *server.*', { y: seam + 143, size: SLAM2, fill: C.white })
			// the seven tabs, folded into one client view: built 480 wide, shown at 1.2x (576 x 333, x 204 to 780, y 911 to 1244)
			clientView(el('g', { transform: tf(204, 911, 1.2) }, g), 0, 0, 480)
		},
	},
	{
		id: 's3',
		title: 'Open a client',
		start: 5.16,
		end: 9.36,
		bars: '3.4-5.4',
		words: 'Open a client.\nFiles\nPortaliq\nMail\nFilinq',
		motion: 'The cobalt-50 wipe rises from 3.4 (5.16) and lands 5.36, with "Open" already rising at 1.3x, pivoted on (120, 400). The camera pulls back to 1.0 by 6.36 on the brand curve, so it reveals the diagram as it grows: "a" on the and (5.40, camera 1.15x), "client." slams into its orange block on 4.1 (5.64, camera 1.06x, the line ending at x 808, inside 888). A thin line drops from the bottom of the orange block, bends into the spine and draws down; branches shoot left and right and each node pops at the end of its branch with its label, about 0.17 s apart and alternating sides: Files 5.84, Portaliq 6.04, Mail 6.20, Filinq 6.36 (Portaliq\'s label ends at x 782 as it lands). Sources hang left as side boxes (Nextcloud\'s own Files and Mail, glyphs nc-files and nc-mail); apps that use the client\'s details hang right as cobalt hexes. The camera lands at 1.0 on the last node and stops dead, a deliberate hold. On 5.1 (7.52) a small cobalt pulse runs along each branch into the spine, toward the client. OUT: on 6.1 (9.36) the words swap while the diagram holds.',
		sound: 'Pluck on "client.". Four ticks, one per node, panned left, right, left, right. Hats double and claps join on 5.1 (7.52) with a soft whoosh under the pulses.',
		apps: ['portaliq', 'filinq'],
		borrow: 'Replit pull-back reveal and thin-line node diagram: one hub branching to labels that pop left and right about 0.17 s apart, joined by connector lines. Here the hub is the orange word itself, so the diagram grows out of the sentence.',
		draw(ctx) {
			const g = ctx.g
			el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, g)
			const { block } = sentence(g, 'Open a *client.*', { fill: C.cobalt })
			diagram(g, block)
		},
	},
	{
		id: 's4',
		title: 'Contracts fill themselves in',
		start: 9.36,
		end: 11.72,
		bars: '6.1-7.1',
		words: 'Contracts fill\nthemselves in.',
		motion: 'Text swap on a held diagram. On 6.1 (9.36) "Open a client." rolls up out of its line and "Contracts fill" rolls up into it in cobalt; the orange block drops to line 2 and "themselves in." lands as one unit on 6.2 (9.84), 0.48 s after line 1, with "themselves" in the block. The root line shortens to meet the block; the spine, branches and nodes do not move and the camera stays at 1.0. The labels tuck into their nodes, the Files and Mail boxes and the Portaliq hex dim to 22 %, the Filinq hex turns terracotta (documents), and a contract card drops straight down out of its bottom vertex on a short terracotta line, its fields filling from the client\'s details one per 16th (10.08, 10.20, 10.32, 10.44). OUT: on 7.2 (11.72) an upright hexagon iris closes on the Filinq hex.',
		sound: 'Whoosh on the swap, pluck on "themselves". A rising tick as each contract field fills. A riser starts on 7.1 (11.24) into the iris.',
		apps: ['filinq', 'portaliq'],
		borrow: 'Replit text swap on a held diagram (only the words and the orange word change); Yoya line 2 in orange about half a second after line 1.',
		draw(ctx) {
			const g = ctx.g
			el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, g)
			const { block } = sentence(g, 'Contracts fill\n*themselves* in.', { fill: C.cobalt })
			diagram(g, block, { dim: ['files', 'mail', 'portaliq'], highlight: 'filinq', labels: false })
			// the contract Filinq fills in from the client's details: directly under Filinq (consumers right)
			const f = NODES.find((n) => n.id === 'filinq')
			const cw = 284
			const ch = 180
			const cx = f.x - 80
			const cy = 1062
			el('path', { d: `M${f.x} ${f.y + NODE_R}V${cy}`, stroke: C.terracotta, 'stroke-width': LINE, fill: 'none' }, g)
			shadowRect(g, cx, cy, cw, ch, 10, 12, C.cobalt200, 1)
			el('rect', { x: cx, y: cy, width: cw, height: ch, fill: C.white }, g)
			el('rect', { x: cx, y: cy, width: cw, height: 14, fill: C.terracotta }, g)
			el('rect', { x: cx + 22, y: cy + 34, width: 124, height: 14, fill: C.cobalt900 }, g)
			// the client's details as key/value rows (SidebarMock smKv), every field filled
			;[NAME_W, 150, 212, 172].forEach((vw, i) => {
				const ry = cy + 74 + i * 26
				el('rect', { x: cx + 22, y: ry, width: 44, height: 8, fill: C.cobalt300 }, g)
				el('rect', { x: cx + 80, y: ry - 1, width: vw * 0.9, height: 10, fill: C.cobalt700 }, g)
			})
		},
	},
	{
		id: 's5',
		title: 'Install from the Nextcloud app store',
		start: 11.72,
		end: 15.0,
		bars: '7.2-8.4',
		words: 'Install from the\nNextcloud app store',
		motion: 'Upright hexagon iris: from 7.2 (11.72) the cobalt-50 frame closes as a pointy-top hexagon on the Filinq hex, carrying the diagram with it, until only the Filinq cell is left on cobalt at 11.96; it settles into cobalt-400 and the honeycomb pops round it back to front, one ring per 16th (far cells 11.96, near cells 12.08, app hexes 12.20), the Nextcloud workspace hex last in the centre (12.32). The ConNext wordmark rises into line 1 on the and of 7.2 (11.96); the CTA rolls up line by line, 0.16 s per roll: "Install from the" on 12.08, then the orange block with "Nextcloud app store" on 7.3 (12.20), fully up by 12.36, a 2.44 s hold before it leaves. Hold, the far cells breathing 1 %. LOOP: the honeycomb drops out back to front in 16ths from 8.4 (14.52): far cells on 14.52, near cells on 14.64, the six app hexes and then the Nextcloud hex on 14.76, so the ground is plain cobalt by 14.84. In the last 5 frames (14.80 to 15.00) the wordmark and both CTA lines roll up and out together while "Same client," and "tab after tab." roll up into the same place, scene 1\'s front window rises in from the bottom edge, and the camera pushes from 1.0 to 1.15x about (120, 400). Frame 1 is the landing of that move; its orange block punches in on frame 1 itself, so no frame holds two orange blocks.',
		sound: 'The riser peaks into the iris; impact as it closes (11.96). Ticks for the honeycomb rings. The bell (sonic logo) with the wordmark. The bed thins to pad and bass under the hold; the pad rings on through the last beat with no fade, so its tail carries across the loop into frame 1.',
		apps: ['filinq', 'pipelinq', 'portaliq', 'launchpad', 'shillinq', 'dossiq'],
		borrow: 'Replit end card: the iris closes to a small shape and the words roll up inside it about 0.16 to 0.25 s per roll. Here the iris is an upright hexagon.',
		draw(ctx) {
			const g = ctx.g
			// honeycomb: the Filinq cell sits exactly where, and as big as, the iris closed on it in s4
			const size = NODE_R
			const gap = 12
			const f = NODES.find((n) => n.id === 'filinq')
			const [nx, ny] = axialToPixel(1, 0, size, gap)
			const ox = f.x - nx
			const oy = f.y - ny
			const at = (q, r) => { const [x, y] = axialToPixel(q, r, size, gap); return [ox + x, oy + y] }
			// far cells: cobalt-400 at falling opacity, so depth reads as distance, not as holes.
			// No row above the app ring: it would crowd the CTA block (bottom at y 641).
			const deco = [
				[2, -1, 0.42], [2, 0, 0.42], [1, 1, 0.42], [3, -1, 0.3], [0, 2, 0.3], [-1, 2, 0.3], [-2, 1, 0.3],
				[3, 0, 0.18], [2, 1, 0.18], [1, 2, 0.18], [-2, 2, 0.18], [0, 3, 0.1], [-1, 3, 0.1],
			]
			for (const [q, r, o] of deco) { const [x, y] = at(q, r); hex(g, x, y, size, C.cobalt400, { 'fill-opacity': o }) }
			const apps = [
				[1, 0, 'g-filinq'], [1, -1, 'g-pipelinq'], [0, -1, 'g-portaliq'], [-1, 0, 'g-launchpad'], [-1, 1, 'g-shillinq'], [0, 1, 'g-dossiq'],
			]
			for (const [q, r, sym] of apps) { const [x, y] = at(q, r); appHex(g, x, y, size, sym, { fill: C.cobalt400 }) }
			// the one workspace hex: Nextcloud, cited as the workspace the apps install into
			const [wx, wy] = at(0, 0)
			hex(g, wx, wy, size, C.nextcloud)
			const [lw, lh] = MARK_BOX['nextcloud-logo']
			const ls = (size * 1.3) / lw
			el('use', { href: '#nextcloud-logo', x: wx - (lw * ls) / 2, y: wy - (lh * ls) / 2, width: lw * ls, height: lh * ls, color: C.white }, g)

			// wordmark on line 1: its baseline sits on scene 1's baseline, so the loop roll lands in place
			const ms = 1.62
			wordmark(g, X0, BASE1 - 60 * ms, ms)
			sentence(g, 'Install from the\n*Nextcloud* *app* *store*', { y: BASE1 + 128, size: CTA, fill: C.white, lineHeight: 1.3 })
		},
	},
]
