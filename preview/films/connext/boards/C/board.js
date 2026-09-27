/**
 * Variant C, "Proof": four true cooperation moments shown as product UI, each
 * tagged with the app hexes that make it happen, joined by the upright-hex
 * match cut, ending on those apps round the Nextcloud workspace hex, the
 * wordmark and the install call.
 *
 * UI atoms (AppMock, WidgetMock, SidebarMock, phone), the document page, the
 * closing cluster and the small wordmark live in the shared _lib/ui.js, promoted
 * from this variant's own helpers so every app film speaks the same UI language.
 *
 * Text box: every word sits inside x 120 to 780, y 288 to 1248, so the &safe
 * overlay (meta.safe right 300, drawn over the full height) stays free of words.
 * The bible also allows text to x 888 above y 840; this board does not need it.
 *
 * Debug: board.html?v=C&cam draws each push-in at its end state (s1 inside the
 * app window at 4.0x, s2 at 1.4x), to check the caption never loses its ground.
 */
import { el, set, tfAbout } from '../../../_lib/stage.js'
import { C } from '../../../_lib/brand.js'
import {
	rect, bar, circle, hex, ground, clipped, caption, appTag, ncTag, mark,
	topbar, nav, panel, statusPill, phone,
	widgetTile, personRow, fileRow, calendarGrid, docPage, workspaceCluster,
} from '../../../_lib/ui.js'

const CAM = typeof location !== 'undefined' && new URLSearchParams(location.search).has('cam')

export const meta = {
	id: 'C',
	title: 'Proof',
	logline: 'Four real moments, shown as the product itself: open a client and their files, mail and meetings are there, contracts fill themselves in, clients sign on their phone, and your apps feed one portal. Each moment carries the app hexes behind it, and those hexes close round the Nextcloud workspace hex, the ConNext wordmark and the install call.',
	references: [
		{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Partner badges fly in oversized and settle beside the UI (our app tags, landing at 2x and settling), and the ring that scales past the camera as a push-through bridge into UI proof.' },
		{ name: 'X Numbers', url: 'https://whatships.com/videos/x-numbers/', borrow: 'The dot that appears on a UI element, grows to fill the frame and hands over to the next container, done with an upright hex; digits rolling into place (our client values rolling into the contract).' },
		{ name: 'Claude mobile tools: Figma, Canva, Amplitude', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Push-in discipline: push in until the UI detail is large (s1 goes to 4x on one calendar cell), hold, pull back to the whole screen, never cut on a word.' },
		{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'Chapter layout in 9:16: a small logo top left, type in the top third, product UI below, exactly one orange per scene; the end card\'s orange button is the primary action.' },
	],
	background: C.cobalt,
	safe: { top: 288, bottom: 672, left: 120, right: 300 },
}

/* ---------- shared pieces ---------- */

/*
 * The calendar grid, the contract page (docPage) and the closing cluster
 * (workspaceCluster) are shared UI now, in _lib/ui.js. What stays here is
 * this film's content: which apps sit where round the workspace hex.
 *
 * The apps sit on the corner cells of the second ring. The top corner is left
 * open, like the overview's top card.
 */
const RING = [
	{ q: -1, r: -1, id: 'pipelinq' }, // north-west: the client record, a source
	{ q: 2, r: -1, id: 'filinq' }, // north-east
	{ q: 1, r: 1, id: 'portaliq' }, // south-east
	{ q: -1, r: 2, id: 'shillinq' }, // south
	{ q: -2, r: 1, id: 'dossiq' }, // south-west
]
const OPEN = { q: 1, r: -2 }
const cluster = (g, cx, cy, r, gap, opts) => workspaceCluster(g, cx, cy, r, gap, { ring: RING, open: [OPEN], ...opts })
const contractPage = docPage

/* ---------- the boards ---------- */

export const boards = [
	{
		id: 's1',
		title: 'Open a client',
		start: 0.0,
		end: 2.8,
		bars: '1.1-2.2',
		words: 'Open a client.\nIt’s all there.',
		motion: 'Frame 1 is the thumbnail and is this key frame exactly: the ConNext mark, the caption, the whole client record with all six linked tiles, and both tags, no fade and nothing still to arrive. Hold two beats (0 to 0.94 s). From 1.3 (0.94 s) to 2.2 (2.34 s) the camera pushes in inside the app window, 1.00 to 4.0 (ease.brand) about the orange today cell at (339, 1000); the window\'s top edge stays at y 630, so the caption keeps its cobalt band and the tags ride out of frame with the UI. At 4.0 the today cell is 106 px wide. Out on 2.2: the orange cell snaps into an upright hex dot that grows past the window to fill the frame in cobalt-50 over 0.47 s (ease.snap), the match cut into scene 2. The caption holds until the hex edge passes it at about 2.6 s (2.6 s of hold; 6 words need 2.4 s).',
		sound: 'Gentle open, no stinger on frame 1: pad and offbeat bass only. A soft pluck on 1.3 (0.94) as the push starts, a tick on 2.2 (2.34) as the cell turns into the hex, whoosh from 2.34 under the fill.',
		apps: ['pipelinq'],
		borrow: 'Yoya layout (small logo top left, type in the top third, UI below, one orange: today\'s meeting) with X Ticker partner badges pinned to the UI they power; Claude mobile push-in until one detail fills the frame; out through the X Numbers dot, as an upright hex.',
		draw(ctx) {
			const g = ctx.g
			const u = 2.5
			mark(g)
			caption(g, 'Open a client.\nIt’s all there.', C.white)

			// AppMock, App pattern, Generic Detail template at u 2.5, nav cropped left by the framing.
			// The window frame stays put; the camera pushes in inside it (see ?cam).
			const X0 = -235, Y0 = 630, FW = 720 * u, FH = 1920 - Y0 + 60
			const PIV = [339, 1000]
			const win = clipped(g, X0, Y0, FW, FH, 10 * u)
			const f = el('g', CAM ? { transform: tfAbout(PIV[0], PIV[1], 4) } : {}, win)
			rect(f, X0, Y0, FW, FH, C.white)
			topbar(f, X0, Y0, FW, u, { fill: C.cobalt900 })
			const NW = 158 * u
			nav(f, X0, Y0 + 24 * u, NW, FH - 24 * u, u, { items: 7, active: 1 })
			const cx0 = X0 + NW + 14 * u // col content left, 195
			const cRight = X0 + (720 - 187) * u - 14 * u // col content right, before the detail rail
			// pageHeader: title bar, ghost + primary
			bar(f, cx0, Y0 + 95, 250, 35, C.cobalt)
			rect(f, cRight - 95, Y0 + 95, 95, 35, C.cobalt, 3 * u)
			rect(f, cRight - 200, Y0 + 95, 95, 35, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
			rect(f, X0 + (720 - 187) * u, Y0 + 24 * u, u, FH, C.cobalt100)

			// Client overview panel (the Pipelinq record)
			const oy = Y0 + 155, oh = 100
			panel(f, cx0, oy, cRight - cx0, oh, u)
			circle(f, 290, oy + oh / 2, 32, C.cobalt300)
			bar(f, 340, oy + 28, 230, 20, C.cobalt900)
			bar(f, 340, oy + 60, 320, 10, C.cobalt300)
			statusPill(f, 668, oy + oh / 2, u)
			for (let i = 0; i < 3; i++) {
				bar(f, 830, oy + 24 + i * 22, 50, 8, C.cobalt400)
				bar(f, 895, oy + 24 + i * 22, 130 - i * 20, 8, C.cobalt700)
			}

			// Linked Nextcloud items as widget tiles: calendar, mail / files, chats (+ decks, activity beyond the box)
			const tw = 280, th = 175, gx = 22
			const rowsY = [Y0 + 278, Y0 + 278 + th + 22]
			const tile = (x, y, icon, body) => widgetTile(f, x, y, tw, th, u, icon, body)
			tile(cx0, rowsY[0], 'nc-calendar', (x, y, w) => {
				calendarGrid(f, x, y, w, 3, u, '0,3', ['0,1', '1,4', '2,2', '1,0'])
			})
			const mailRow = (x, y, w, av, l1) => personRow(f, x, y, w, u, av, l1)
			tile(cx0 + tw + gx, rowsY[0], 'nc-mail', (x, y, w) => {
				mailRow(x, y, w, C.cobalt200, 110)
				mailRow(x, y + 44, w, C.cobalt300, 84)
			})
			tile(cx0, rowsY[1], 'nc-files', (x, y, w) => {
				const row = (yy, lw) => fileRow(f, x, yy, lw, u)
				row(y, w - 50)
				row(y + 42, w - 90)
			})
			tile(cx0 + tw + gx, rowsY[1], 'nc-talk', (x, y, w) => {
				mailRow(x, y, w, C.cobalt300, 96)
				mailRow(x, y + 44, w, C.cobalt200, 120)
			})
			// beyond the text box, under the platform rail: more linked tiles, texture only
			tile(cx0 + 2 * (tw + gx), rowsY[0], 'nc-decks', (x, y, w) => {
				for (let c = 0; c < 3; c++) rect(f, x + c * (w / 3), y, w / 3 - 6, 70, C.cobalt50, 2 * u)
			})
			tile(cx0 + 2 * (tw + gx), rowsY[1], 'nc-activity', (x, y, w) => mailRow(x, y, w, C.cobalt200, 100))
			// activity stack below the fold (texture in the platform-overlay zone)
			const ay = rowsY[1] + th + 24
			panel(f, cx0, ay, cRight - cx0, 320, u)
			bar(f, cx0 + 30, ay + 28, 150, 15, C.cobalt700)
			for (let i = 0; i < 4; i++) mailRow(cx0 + 30, ay + 72 + i * 56, 520, i % 2 ? C.cobalt300 : C.cobalt200, 180 - i * 24)

			// App tags pinned to what they power; they ride with the UI during the push.
			const tags = el('g', CAM ? { transform: tfAbout(PIV[0], PIV[1], 4) } : {}, g)
			appTag(tags, cx0, oy + oh / 2, 44, 'pipelinq')
			ncTag(tags, cx0, rowsY[1] - 11, 44)
		},
	},
	{
		id: 's2',
		title: 'Contracts fill themselves in',
		start: 2.8,
		end: 5.64,
		bars: '2.3-3.4',
		words: 'Contracts fill\nthemselves in.',
		motion: 'The hex fill is the new cobalt-50 ground; the mark swaps to its light-ground version as the fill passes it. The contract page drops in from above (0.35 s, ease.brand) while the client card slides in from the left edge carrying its Pipelinq tag; the Filinq tag lands on 2.4 (3.28 s) at 2.0x and settles to 1.0 in 0.2 s (ease.brand). The caption rises word by word on 16th notes from 2.3 (all four words by 3.36 s). Bar 3.1 to 3.3: the camera pushes in and tilts down, 1.00 to 1.40 (ease.brand) about the page\'s top edge at (640, 640), so the page top never crosses the caption, while the three client values run along the wires into the slots one per beat (3.75, 4.22, 4.69), each rolling into its slot like a slot-machine digit; the amount lands last, in orange. Out on 3.4: the page scales down and slides into the phone\'s contract card (the container match cut) while a cobalt upright hex grows from the orange amount to fill the frame. Caption held 3.36 to 5.16 s (1.8 s; 4 words need 1.6 s).',
		sound: 'Hats enter; kick from bar 3.1 (3.75 s). Three rising plucks as the values land (3.75, 4.22, 4.69), the last one brighter for the orange amount. Tick when the Filinq tag lands (3.28). Whoosh on 3.4 (5.16) as the page shrinks away.',
		apps: ['pipelinq', 'filinq'],
		borrow: 'X Numbers digits rolling into place (client values rolling into the slots); X Ticker badge landing for the Filinq tag; Claude mobile push-in on the slots; sources left, consumers right; Yoya type-top layout.',
		draw(ctx) {
			const g = ctx.g
			ground(ctx, C.cobalt50)
			mark(g, { light: true })
			caption(g, 'Contracts fill\nthemselves in.', C.cobalt)
			const w = el('g', CAM ? { transform: tfAbout(640, 640, 1.4) } : {}, g)

			// Source: the Pipelinq client card (side box, left)
			const cx = 166, cy = 716, cw = 272, ch = 330
			rect(w, cx, cy + 14, cw, ch, C.cobalt100, 10)
			panel(w, cx, cy, cw, ch, 2.5)
			circle(w, cx + 58, cy + 56, 24, C.cobalt300)
			bar(w, cx + 94, cy + 38, 120, 16, C.cobalt900)
			bar(w, cx + 94, cy + 64, 90, 8, C.cobalt300)
			rect(w, cx + 22, cy + 106, cw - 44, 2.5, C.cobalt100)
			const K = 1.12
			const values = [118, 96, 72]
			const kv = values.map((vw0, i) => {
				const vw = vw0 * K
				const y = cy + 156 + i * 60
				bar(w, cx + 24, y - 4, 56, 8, C.cobalt400)
				bar(w, cx + 94, y - 5, vw, 10, C.cobalt700)
				return { x: cx + 94 + vw, y }
			})

			// Consumer: the contract Filinq renders (right). Wires run behind it.
			const px = 470, py = 640, pw = 500 * K, ph = 707 * K
			const wires = el('g', {}, w)
			const slots = contractPage(w, px, py, pw, ph, { values, k: K })
			kv.forEach((a, i) => {
				const b = slots[i]
				const x1 = a.x + 14, x2 = px + 30
				el('path', { d: `M${x1} ${a.y} C${x1 + 50} ${a.y} ${x2 - 50} ${b.cy} ${x2} ${b.cy}`, fill: 'none', stroke: C.cobalt300, 'stroke-width': 4, 'stroke-linecap': 'round' }, wires)
				circle(wires, x1, a.y, 7, C.cobalt300)
			})

			// Second source: the template you picked
			const ty = cy + ch + 56, th = 150
			rect(w, cx, ty + 14, cw, th, C.cobalt100, 10)
			panel(w, cx, ty, cw, th, 2.5)
			hex(w, cx + 50, ty + th / 2, 26, C.terracotta300, 3)
			bar(w, cx + 94, ty + 54, 130, 12, C.cobalt700)
			bar(w, cx + 94, ty + 80, 96, 8, C.cobalt300)
			const tBody = py + 460 * K
			el('path', { d: `M${cx + cw + 14} ${ty + th / 2} C${cx + cw + 64} ${ty + th / 2} ${px - 20} ${tBody} ${px + 30} ${tBody}`, fill: 'none', stroke: C.cobalt300, 'stroke-width': 4, 'stroke-linecap': 'round' }, wires)
			circle(wires, cx + cw + 14, ty + th / 2, 7, C.cobalt300)

			// Tags: Pipelinq on the card's top-right corner, Filinq on the page's top edge,
			// both placed so they stay in frame at the end of the 1.4x push.
			appTag(w, cx + cw, cy, 44, 'pipelinq')
			appTag(w, 600, py, 44, 'filinq')
		},
	},
	{
		id: 's3',
		title: 'Clients sign on their phone',
		start: 5.64,
		end: 7.96,
		bars: '4.1-5.1',
		words: 'Clients sign on\ntheir phone.',
		motion: 'Push-through bridge: the phone rises into the cobalt frame around the shrinking page, which lands as the thumbnail in the portal\'s contract card; its amount drops to cobalt as it lands, handing the scene\'s one orange to the Sign button. The caption rises in a quick stagger on 4.1 (all five words by 5.87 s). The camera stays pushed in: the phone bleeds off the bottom and the Sign button sits inside the text box. Tags land at 2.0x and settle to 1.0 in 0.2 s (ease.brand), as badges 40 px outside the bezel: Portaliq on 4.2 beside the portal header, Filinq on 4.3 beside the contract. Out on bar 5.1: the orange Sign button presses (scale 0.96, 0.1 s) and flips to a mint signed pill, the contract card folds into the first row of the list, and the camera pulls back (1.32 to 1.00 about (525, 611), ease.brand, one beat) into scene 4 without a cut. Caption held 5.87 to 7.96 s (2.09 s; 5 words need 2.0 s).',
		sound: 'Kick and bass bed. Ticks on the two tags (6.09, 6.56). Riser from 4.3 (6.56) into 5.1. Impact on the Sign press at 5.1 (7.50).',
		apps: ['portaliq', 'filinq'],
		borrow: 'X Numbers push-through into phone UI proof; X Ticker badges settling beside the phone; Claude mobile push-in (the screen detail large, held, never cut on a word).',
		draw(ctx) {
			const g = ctx.g
			mark(g)
			caption(g, 'Clients sign on\ntheir phone.', C.white)
			// Scene 4's phone (352, 630, 408 x 1010) at 1.3235x about (525, 611): the same take.
			const P = phone(g, 296, 636, 540, 1337)
			const s = P.screen
			const L = P.x, T = P.y, W = P.w
			// Portal header in the business's house style
			hex(s, L + 88, T + 102, 24, C.cobalt, 3)
			bar(s, L + 126, T + 94, 150, 16, C.cobalt700)
			circle(s, L + W - 58, T + 102, 20, C.cobalt100)
			rect(s, L, T + 150, W, 2.5, C.cobalt100)
			bar(s, L + 32, T + 180, 120, 10, C.cobalt400)
			// Contract card
			const cx = L + 24, cy = T + 212, cw = W - 48, ch = 372
			panel(s, cx, cy, cw, ch, 2.5, { r: 5.6 })
			contractPage(s, cx + 24, cy + 24, 500 * 0.26, 707 * 0.26, { k: 0.26, shadow: null, lastOrange: false })
			const tx = cx + 24 + 130 + 24
			bar(s, tx, cy + 34, 190, 16, C.cobalt900)
			bar(s, tx, cy + 64, 140, 9, C.cobalt300)
			// signer row (SidebarMock .smPerson): the client, same avatar as in scenes 1 and 2
			circle(s, tx + 17, cy + 128, 17, C.cobalt300)
			bar(s, tx + 46, cy + 116, 120, 8, C.cobalt700)
			bar(s, tx + 46, cy + 134, 80, 6, C.cobalt300)
			circle(s, cx + cw - 30, cy + 128, 8, C.cobalt200)
			// Decline (ghost) + Sign (primary, the one orange)
			const by = cy + ch - 94
			rect(s, cx + 24, by, 150, 66, C.white, 12, { stroke: C.cobalt200, 'stroke-width': 2.5 })
			bar(s, cx + 24 + 40, by + 28, 70, 10, C.cobalt400)
			const sx = cx + 24 + 150 + 16, sw = cw - 48 - 150 - 16
			rect(s, sx, by, sw, 66, C.orange, 12)
			bar(s, sx + sw / 2 - 48, by + 27, 96, 12, C.white)
			// next portal items below the fold: the two Shillinq rows of scene 4
			for (const [i, l1] of [[0, 170], [1, 140]]) {
				const iy = cy + ch + 20 + i * 130
				panel(s, cx, iy, cw, 110, 2.5, { r: 5.6 })
				hex(s, cx + 44, iy + 55, 18, C.cobalt300)
				bar(s, cx + 78, iy + 40, l1, 9, C.cobalt700)
				bar(s, cx + 78, iy + 60, 110, 6, C.cobalt200)
			}

			appTag(g, 256, T + 102, 44, 'portaliq')
			appTag(g, 256, cy + 150, 44, 'filinq')
		},
	},
	{
		id: 's4',
		title: 'Your apps feed one portal',
		start: 7.96,
		end: 10.32,
		bars: '5.2-6.2',
		words: 'Your apps feed\none portal.',
		motion: 'Same take as scene 3: the pull back lands on 5.2 with the phone in frame down to below the text box (it still bleeds off the 4:5 cut, as in scene 3) and the contract, now signed (mint), first in the list where scene 3\'s card was. The caption rises in a quick stagger on 5.2 (all five words by 8.20 s). The other portal rows drop in top to bottom a 16th apart. The orange Portaliq tag (the app icon exception on cobalt) lands with the pull back; the source tags fly in oversized from the left and settle into the column one per beat (Shillinq 5.3, Pipelinq 5.4, Dossiq 6.1), while the Filinq tag slides over from its scene 3 place; each trails a hairline wire to its rows. The caption clears at 10.20 s (2.0 s of hold; 5 words need 2.0 s). Out on 6.2: the tag column scales up past the camera (push-through, 0.47 s, ease.snap) while the phone sinks out of frame, and the tags become the cells of scene 5\'s cluster.',
		sound: 'Claps on 2 and 4 from bar 6. Four ticks pitched up in sequence as the tags settle (8.44, 8.91, 9.38, 9.61). Whoosh on 6.2 (9.84) for the push-through.',
		apps: ['portaliq', 'shillinq', 'pipelinq', 'filinq', 'dossiq'],
		borrow: 'X Ticker partner badges flying in oversized and settling round the phone; Claude mobile pull back to the whole screen; Yoya one orange (the Portaliq hex, the app icon exception on cobalt).',
		draw(ctx) {
			const g = ctx.g
			mark(g)
			caption(g, 'Your apps feed\none portal.', C.white)
			const P = phone(g, 352, 630, 408, 1010)
			const s = P.screen
			const L = P.x, T = P.y, W = P.w
			hex(s, L + 66, T + 88, 19, C.cobalt, 2.5)
			bar(s, L + 96, T + 81, 118, 13, C.cobalt700)
			circle(s, L + W - 46, T + 88, 16, C.cobalt100)
			rect(s, L, T + 126, W, 2, C.cobalt100)
			bar(s, L + 22, T + 150, 100, 9, C.cobalt400)
			// Rows by source app and its family: Filinq documents (terracotta), Shillinq and
			// Pipelinq (cobalt, no family), Dossiq process (lavender).
			const rows = [
				{ icon: C.terracotta300, l1: 140, signed: true }, // Filinq: the contract just signed
				{ icon: C.cobalt300, l1: 150 }, // Shillinq: invoice
				{ icon: C.cobalt300, l1: 124 }, // Shillinq: quote
				{ icon: C.cobalt300, l1: 160 }, // Pipelinq: request
				{ icon: C.lavender300, l1: 116 }, // Dossiq
			]
			const rowY = (i) => T + 172 + i * 88 // pitch 88 keeps the Dossiq tag inside y 1248
			rows.forEach((r, i) => {
				const y = rowY(i)
				panel(s, L + 16, y, W - 32, 76, 2, { r: 5 })
				hex(s, L + 48, y + 38, 17, r.icon)
				bar(s, L + 78, y + 24, r.l1, 8, C.cobalt700)
				bar(s, L + 78, y + 42, 96, 6, C.cobalt200)
				if (r.signed) statusPill(s, L + W - 32 - 16 - 86, y + 38, 2)
				else {
					rect(s, L + W - 32 - 16 - 86, y + 27, 86, 22, C.cobalt50, 11)
					bar(s, L + W - 32 - 16 - 66, y + 35, 46, 6, C.cobalt300)
				}
			})
			// portal tab bar (below the 4:5 cut; texture only)
			const tb = T + P.h - 92
			rect(s, L, tb, W, 2, C.cobalt100)
			for (let i = 0; i < 4; i++) rect(s, L + W * (0.125 + i * 0.25) - 12, tb + 26, 24, 24, i === 0 ? C.cobalt : C.cobalt200, 4)
			// wires from the source tags into their rows
			const tagX = 244
			const wire = (y1, ys) => {
				const gW = el('g', { fill: 'none', stroke: C.cobalt300, 'stroke-width': 3, 'stroke-linecap': 'round' }, g)
				const bx = 316
				el('path', { d: `M${tagX + 44} ${y1} H${bx}` }, gW)
				if (ys.length > 1) el('path', { d: `M${bx} ${ys[0]} V${ys[ys.length - 1]}` }, gW)
				for (const y of ys) el('path', { d: `M${bx} ${y} H${L + 16}` }, gW)
			}
			const mid = (i) => rowY(i) + 38
			const tags = [
				{ id: 'filinq', y: mid(0), rows: [mid(0)] },
				{ id: 'shillinq', y: (mid(1) + mid(2)) / 2, rows: [mid(1), mid(2)] },
				{ id: 'pipelinq', y: mid(3), rows: [mid(3)] },
				{ id: 'dossiq', y: mid(4), rows: [mid(4)] },
			]
			for (const t of tags) wire(t.y, t.rows)
			for (const t of tags) appTag(g, tagX, t.y, 36, t.id, { ringW: 5 })
			// The portal itself: scene 3's Portaliq badge, pulled back with the phone.
			appTag(g, 322, T + 88, 40, 'portaliq', { fill: C.orange })
		},
	},
	{
		id: 's5',
		title: 'Make Nextcloud your workspace',
		start: 10.32,
		end: 12.2,
		bars: '6.3-7.2',
		words: 'Make Nextcloud\nyour workspace.',
		motion: 'The pushed-through tags lock into place on 6.3 at the corners of the cluster and turn white as they land. The tagline rises on 6.3, both lines together (clip reveal, 0.12 s, all four words by 10.44 s). The Nextcloud workspace hex, about twice an app cell as in the design system\'s platform overview, lands at 1.4x and settles to 1.0 on the 7.1 impact (11.25 s). Around them the unlit field pops in outward, ring by ring on 16th notes, stepping down in opacity (cells pop into place, nothing orbits); the field stays below the words. Hard hold, no creep. Out on 7.2: the tagline clears at 12.20 s (1.76 s of hold; 4 words need 1.6 s), the field steps down, and the lit cluster scales down (1.00 to 0.85, ease.brand) and drops 50 px to centre (450, 950), landing hard on 7.3.',
		sound: 'Short riser from 6.3 (10.31) into bar 7.1; impact at 11.25 as the workspace hex lands; soft ticks under the ring pops. Bed drops to pad for half a bar before the logo.',
		apps: ['pipelinq', 'filinq', 'portaliq', 'shillinq', 'dossiq'],
		borrow: 'X Ticker: the partner ring filling round the centre and the outer rings lighting up, rebuilt as a pointy-top honeycomb with depth from opacity only; the centre-to-ring proportion comes from the design system\'s platform overview.',
		draw(ctx) {
			const g = ctx.g
			// Figtree 88: at 96 px both lines run past x 780 into the &safe band.
			caption(g, 'Make Nextcloud\nyour workspace.', C.white, { size: 88, lh: 94 })
			cluster(g, 450, 900, 80, 10, { fieldTop: 690, W: ctx.W, H: ctx.H })
			mark(g)
		},
	},
	{
		id: 's6',
		title: 'ConNext, install',
		start: 12.2,
		end: 15.0,
		bars: '7.3-8.4',
		words: 'Install from the\nNextcloud app store',
		motion: 'On 7.3 the small ConNext mark from frame 1 scales up, anchored top left, to the 120 px end-card wordmark as the cluster touches down. The orange button wipes in left to right (0.2 s, ease.brand) and the CTA rises inside it: line 1 on 7.3, line 2 a 16th behind (12.32 s, done by 12.52 s). Hold to 15.00 with no fade (2.48 s of hold; 6 words need 2.4 s). Loop, in the last half beat (14.77 to 15.00 s) with the CTA still on screen: the wordmark shrinks back to the 64 px mark, the field and four app cells step out, and the Pipelinq cell and the Nextcloud hex slide to the two tag positions frame 1 carries, (195, 835) and (195, 1094), at 44 px. The cut to frame 1 then changes only the words and lays the client record in behind two tags that have not moved.',
		sound: 'Bell (the sonic logo) on 7.3 (12.19) with the wordmark; a pluck at 12.32 with the second CTA line. Bed plays through to 15.00 and stops on the downbeat of the loop, no fade, so bar 1 re-enters clean; a soft tick under the tag slide at 14.77.',
		apps: ['pipelinq', 'filinq', 'portaliq', 'shillinq', 'dossiq'],
		borrow: 'Yoya end card discipline (the orange button is the primary action and the scene\'s one orange) over the X Ticker cluster resolved under the mark; the loop borrows the X Numbers hand-over: the closing hexes become frame 1\'s tags.',
		draw(ctx) {
			const g = ctx.g
			mark(g, { h: 120 })
			// The CTA as the primary button: C.orange, ink C.cobalt900 (5.9:1; white would be 3.0:1).
			// Padding 40 round the ink: cap top about 472, descender about 618.
			const btn = rect(g, 80, 432, 100, 226, C.orange, 15)
			const t = caption(g, 'Install from the\nNextcloud app store', C.cobalt900, { y: 524, size: 72, lh: 78 })
			set(btn, { width: (t.width + 40 + 40).toFixed(1) })
			cluster(g, 450, 950, 68, 8.5, { fieldTop: 780, fieldScale: 0.5, W: ctx.W, H: ctx.H })
		},
	},
]
