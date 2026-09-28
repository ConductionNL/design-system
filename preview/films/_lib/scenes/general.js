/**
 * The shared key frames of every app film: the hook, the four GENERAL scenes
 * (what every app shares: the common data layer, notifications, flows and the
 * assistant) and the BRAND outro. Each factory draws the SAME composition for
 * every app and takes the app's own content as parameters, so a Pipelinq film
 * and a Learniq film show one layout with two different records in it.
 *
 *   hookFrame(ctx, p)       APP      caption in the type column, the app's own UI in the
 *                                    window on the right, app hex at LOOP_ANCHOR
 *   dataLayerFrame(ctx, p)  GENERAL  one record: its fields, its change log, and the
 *                                    Nextcloud apps that link in (files, mail, meetings, chats)
 *   notifyFrame(ctx, p)     GENERAL  an event on a record, and the notification landing with
 *                                    the right person in the Nextcloud bell
 *   flowsFrame(ctx, p)      GENERAL  the flow editor while you draw your own flow (a capability:
 *                                    it never shows a run, and nothing is pre-built)
 *   aiFrame(ctx, p)         GENERAL  ask about your records, get the answer; the assistant
 *                                    only does what you allow and asks before it changes anything
 *   outroFrame(ctx, p)      BRAND    the honeycomb round the Nextcloud workspace hex, this
 *                                    app singled out, the wordmark and the install call
 *
 * 16:9, 1920 x 1080 (bible, revised 2026-09-27). Layout grammar: the small mark
 * and the caption sit in the type column (x 120 to 840, first baseline y 480),
 * the picture sits right of it (from x 940), and every word stays inside the
 * text box (x 120 to 1800, y 96 to 930). The positions come from ui.js layout()
 * for the frame's ctx.W x ctx.H.
 *
 *   hook and proofs  the AppMock window, drawn in mock space at u = 2.5 exactly as
 *                    the approved 9:16 boards drew it, shown at 0.8 with its top-left
 *                    corner at (940, 160), bleeding off the right and bottom edges
 *   general scenes   the approved 9:16 compositions (local x 120 to 780, y 640 to
 *                    1240), placed at 1.25x so local (120, 640) lands on (970, 160):
 *                    the cards fill x 970 to 1795, y 160 to 910
 *   outro            the wordmark and the install call in the type column, the
 *                    honeycomb on the right with this app's cell on LOOP_ANCHOR
 *
 * UI stays greeked (bars, pills, cards), as the design system's mocks are: only
 * the caption, the install call and the app name label are words. One orange per
 * frame, and orange is never a box behind text: an accent word is an orange
 * word, the install call is one line of orange text (Nextcloud included). On the
 * cobalt ground the app icon hex and the install call may both take the orange.
 * No brown anywhere. Hexes are pointy-top and never rotated. Colours from C.*
 * only; marks and glyphs are real symbols.
 *
 * The general scenes carry one device the app scenes do not: the honeycomb field
 * rising from the bottom of the frame under the UI, the shared layer every app
 * stands on, which the outro then closes round the Nextcloud hex.
 */
import { el, textBlock } from '../stage.js'
import { SQRT3 } from '../core.js'
import { C } from '../brand.js'
import { APP_NAMES } from '../assets.js'
import {
	TYPE, layout, rect, bar, circle, hex, use, clipped, mark, chrome, appTag, ncTag, fitCaptionSize,
	topbar, nav, panel, statusPill, idlePill, wHead, widgetTile, personRow, fileRow, calendarGrid,
	button, toggle, bubble, flowNode, flowEdge, dotCanvas, honeyField, workspaceCluster, CORNERS,
} from '../ui.js'

/** Stage px per mock CSS px inside the window's mock space, as direction C. */
const U = 2.5

/**
 * The app window. `nav` is the rail in CSS px (narrower than the 9:16 crop, so
 * the main column keeps the 9:16 boards' width of about 855 mock px); `row1` is
 * the first content row in mock px below the window top: the anchor line.
 */
export const WINDOW = { nav: 110, row1: 205 }

/** The window's place and scale on a W x H frame, and the loop anchor in stage px. */
function windowAt(W, H) {
	const { x, y, s } = layout(W, H).win
	const contentX = (WINDOW.nav + 14) * U
	return { x, y, s, contentX, anchor: { x: x + s * contentX, y: y + s * WINDOW.row1, r: 44 } }
}

/**
 * Where the app's hex sits on frame 1 (on the window's first content row, at the
 * main column's left edge, as in the 9:16 boards) and where the outro puts it
 * back: the outro's app cell lands on exactly this point, so the loop only
 * shrinks it. (1188, 324) on 1920 x 1080.
 */
export const LOOP_ANCHOR = windowAt(1920, 1080).anchor

/** The install call, exactly as the bible writes it: one whole line of orange text (Ruben, round 3). */
const CTA_TEXT = 'Install from the\nNextcloud app store'

/* ---------- small shared pieces ---------- */

/** The general scenes' placement: the 9:16 composition's local box (from x 120, y 640), scaled into the picture region at layout().ui. */
const GENERAL = { s: 1.25, x: 120, y: 640 }

/** A group in the general scenes' local coordinates (x 120 to 780, y 640 to 1240 as drawn in 9:16). */
function generalView(ctx) {
	const { ui } = layout(ctx.W, ctx.H)
	const tx = ui.x - GENERAL.s * GENERAL.x
	const ty = ui.y - GENERAL.s * GENERAL.y
	return el('g', { transform: `translate(${tx} ${ty}) scale(${GENERAL.s})` }, ctx.g)
}

/**
 * The shared layer: an unlit honeycomb rising from the bottom of the frame,
 * densest under the picture, fading toward the type column; nothing above y 660,
 * so the caption keeps a clean ground.
 */
function sharedField(ctx, { cx = ctx.W * 0.62, cy = ctx.H + 150, top = ctx.H * 0.61, scale = 0.7 } = {}) {
	return honeyField(ctx.g, cx, cy, 80, 10, { top, scale, W: ctx.W, H: ctx.H, alpha: { 0: 0.5, 1: 0.46, 2: 0.4, 3: 0.3, 4: 0.2, 5: 0.12, 6: 0.07 } })
}

/** A record's avatar: a person is a circle, a thing (course, product, case) a hex, anything else a rounded square. */
function avatar(g, cx, cy, r, shape = 'person', fill = C.cobalt300) {
	if (shape === 'hex') return hex(g, cx, cy, r * 1.08, fill, r * 0.14)
	if (shape === 'square') return rect(g, cx - r, cy - r, 2 * r, 2 * r, fill, r * 0.3)
	return circle(g, cx, cy, r, fill)
}

/** A progress bar (course completion, stage progress): cobalt-100 track, cobalt-400 fill. */
function progress(g, x, cy, w, p, u = U) {
	const h = 4 * u
	rect(g, x, cy - h / 2, w, h, C.cobalt100, h / 2)
	rect(g, x, cy - h / 2, Math.max(h, w * p), h, C.cobalt400, h / 2)
}

/** A row's trailing status: 'mint' (done, signed), 'idle' (open), 'progress' (with p), or none. */
function trailing(g, kind, xRight, cy, u, p = 0.5) {
	if (kind === 'mint') statusPill(g, xRight - 43 * u, cy, u)
	else if (kind === 'idle') idlePill(g, xRight - 34 * u, cy, u)
	else if (kind === 'progress') progress(g, xRight - 44 * u, cy, 44 * u, p, u)
}

/* ---------- HOOK (app layer, drawn by the template from app parameters) ---------- */

/**
 * hookFrame(ctx, p): frame 1, the thumbnail. A legible caption in the type
 * column beside the app's own UI (the AppMock window of direction C), the app's
 * hex at LOOP_ANCHOR. The proofs reuse it with their own drawUI.
 *
 *   app        the app id (glyph g-<app>)
 *   caption    at most 6 words, two lines
 *   pattern    'detail' (one record with widget tiles), 'list' (a record list) or
 *              'board' (columns of cards); or pass drawUI(win, geom) for the app's own
 *   tagFill    'orange' (default: the app hex is the frame's one orange and the loop
 *              lands on it) or 'cobalt' (then `accent` may put one orange in the UI)
 *   record     { avatar: 'person'|'hex'|'square', title, sub, status: 'mint'|'idle' }
 *   tiles      detail: up to 6 { icon: 'nc-mail'|..., body: 'calendar'|'mail'|'files'|'talk'|'deck'|'progress' }
 *   rows       list: [{ avatar, w, trail: 'mint'|'idle'|'progress', p }]
 *   columns    board: [[card widths], ...]
 *   nav        { items, active }
 *   header     the page header (title bar, two buttons); default on, except for the
 *              'board' pattern, whose column heads take its place. A drawUI that fills
 *              the top with its own lanes passes false.
 *
 * drawUI(win, geom) draws in the window's mock space (u = 2.5, origin at the
 * window's top-left corner): geom.x and geom.r bound the main column (about 855
 * px), geom.anchor.y is the first content row (the loop anchor's line), geom.visB
 * the mock y of the frame's bottom edge.
 */
export function hookFrame(ctx, p) {
	const { app, caption: text, pattern = 'detail', tagFill = 'orange', drawUI, accent = null } = p
	const g = ctx.g
	chrome(ctx, { text, app, captionOpts: p.captionOpts })
	const u = U
	const w0 = windowAt(ctx.W, ctx.H)
	const view = el('g', { transform: `translate(${w0.x} ${w0.y}) scale(${w0.s})` }, g)
	const visR = (ctx.W - w0.x) / w0.s
	const visB = (ctx.H - w0.y) / w0.s
	// The AppMock frame at 720 CSS px: wider than the view, so its right side (the sidebar) and its foot bleed off the frame.
	const FW = 720 * u, FH = visB + 60
	const win = clipped(view, 0, 0, FW, FH, 10 * u)
	rect(win, 0, 0, FW, FH, C.white)
	topbar(win, 0, 0, FW, u, { fill: C.cobalt900 })
	const NW = WINDOW.nav * u
	nav(win, 0, 24 * u, NW, FH - 24 * u, u, { items: p.nav?.items ?? 7, active: p.nav?.active ?? 1 })
	const geom = { x: w0.contentX, r: Math.min((720 - 187 - 14) * u, visR - 48 / w0.s), top: 24 * u, Y0: 0, u, anchor: { x: w0.contentX, y: WINDOW.row1 }, visB, accent: tagFill === 'orange' ? null : accent }
	rect(win, (720 - 187) * u, 24 * u, u, FH, C.cobalt100)
	// pageHeader: title bar, ghost + primary (a board's column heads take its place)
	if (p.header ?? (pattern !== 'board' || !!drawUI)) {
		bar(win, geom.x, 95, 250, 35, C.cobalt)
		rect(win, geom.r - 95, 95, 95, 35, C.cobalt, 3 * u)
		rect(win, geom.r - 200, 95, 95, 35, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	}
	if (drawUI) drawUI(win, geom)
	else HOOK_PATTERNS[pattern](win, geom, p)
	const a = w0.anchor
	appTag(g, a.x, a.y, a.r, app, { fill: tagFill === 'orange' ? C.orange : C.cobalt })
	if (p.ncAt) ncTag(g, p.ncAt[0], p.ncAt[1], 44)
}

const TILE_BODY = {
	calendar: (w, x, y, bw, u, geom) => calendarGrid(w, x, y, bw, 3, u, geom.accent === 'calendar' ? '0,3' : null, ['0,1', '1,4', '2,2', '1,0', '0,3']),
	mail: (w, x, y, bw, u) => { personRow(w, x, y, bw, u, C.cobalt200, 110); personRow(w, x, y + 44, bw, u, C.cobalt300, 84) },
	talk: (w, x, y, bw, u) => { personRow(w, x, y, bw, u, C.cobalt300, 96); personRow(w, x, y + 44, bw, u, C.cobalt200, 120) },
	files: (w, x, y, bw, u) => { fileRow(w, x, y, bw - 50, u); fileRow(w, x, y + 42, bw - 90, u) },
	deck: (w, x, y, bw, u) => { for (let c = 0; c < 3; c++) rect(w, x + c * (bw / 3), y, bw / 3 - 6, 70, C.cobalt50, 2 * u) },
	progress: (w, x, y, bw, u) => { for (let i = 0; i < 3; i++) progress(w, x, y + 8 + i * 30, bw - 10, [0.8, 0.45, 0.2][i], u) },
}

const HOOK_PATTERNS = {
	/** One record: overview panel on the anchor line, then widget tiles in three columns and an activity panel. */
	detail(w, geom, p) {
		const { u } = geom
		const rec = p.record || {}
		const oy = geom.anchor.y - 50, oh = 100
		panel(w, geom.x, oy, geom.r - geom.x, oh, u)
		avatar(w, geom.x + 95, oy + oh / 2, 32, rec.avatar, C.cobalt300)
		bar(w, geom.x + 145, oy + 28, rec.title ?? 230, 20, C.cobalt900)
		bar(w, geom.x + 145, oy + 60, rec.sub ?? 320, 10, C.cobalt300)
		if (rec.status === 'idle') idlePill(w, geom.x + 473, oy + oh / 2, u)
		else if (rec.status !== 'none') statusPill(w, geom.x + 473, oy + oh / 2, u)
		for (let i = 0; i < 3; i++) {
			bar(w, geom.x + 635, oy + 24 + i * 22, 50, 8, C.cobalt400)
			bar(w, geom.x + 700, oy + 24 + i * 22, 130 - i * 20, 8, C.cobalt700)
		}
		const tiles = p.tiles || [{ icon: 'nc-calendar', body: 'calendar' }, { icon: 'nc-mail', body: 'mail' }, { icon: 'nc-files', body: 'files' }, { icon: 'nc-talk', body: 'talk' }]
		const gx = 22, tw = Math.floor((geom.r - geom.x - 2 * gx) / 3), th = 175
		const rowsY = [geom.Y0 + 278, geom.Y0 + 278 + th + 22]
		const at = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1]]
		tiles.slice(0, 6).forEach((t, i) => {
			const [c, r] = at[i]
			widgetTile(w, geom.x + c * (tw + gx), rowsY[r], tw, th, u, t.icon, (x, y, bw) => TILE_BODY[t.body]?.(w, x, y, bw, u, geom))
		})
		const ay = rowsY[1] + th + 24
		panel(w, geom.x, ay, geom.r - geom.x, 320, u)
		bar(w, geom.x + 30, ay + 28, 150, 15, C.cobalt700)
		for (let i = 0; i < 4; i++) personRow(w, geom.x + 30, ay + 72 + i * 56, 520, u, i % 2 ? C.cobalt300 : C.cobalt200, 180 - i * 24)
	},
	/** A record list: rows 76 px apart in one panel, the first on the anchor line. */
	list(w, geom, p) {
		const { u } = geom
		const rows = p.rows || [
			{ avatar: 'person', w: 230, trail: 'mint' }, { avatar: 'person', w: 180, trail: 'idle' }, { avatar: 'person', w: 260, trail: 'idle' },
			{ avatar: 'person', w: 150, trail: 'mint' }, { avatar: 'person', w: 210, trail: 'idle' }, { avatar: 'person', w: 190, trail: 'idle' },
		]
		const top = geom.anchor.y - 50
		const width = geom.r - geom.x
		panel(w, geom.x, top, width, 12 + rows.length * 76 + 12, u)
		rows.forEach((row, i) => {
			const cy = geom.anchor.y + i * 76
			if (i > 0) rect(w, geom.x + 24, cy - 38, width - 48, u, C.cobalt50)
			avatar(w, geom.x + 76, cy, 20, row.avatar, i % 2 ? C.cobalt200 : C.cobalt300)
			bar(w, geom.x + 116, cy - 12, row.w, 10, C.cobalt900)
			bar(w, geom.x + 116, cy + 8, row.w * 0.6, 7, C.cobalt300)
			trailing(w, row.trail, geom.x + 590, cy, u, row.p)
			bar(w, geom.x + 640, cy - 4, 120, 8, C.cobalt200)
		})
	},
	/** Columns of cards (a pipeline or a planning board); the first card sits on the anchor line. */
	board(w, geom, p) {
		const { u } = geom
		const cols = p.columns || [[200, 160, 180], [170, 210], [190, 150, 170]]
		const cw = 270, gap = 20
		const cardH = 110
		const top = geom.anchor.y - cardH / 2
		cols.forEach((cards, c) => {
			const x = geom.x + c * (cw + gap)
			rect(w, x, top - 70, cw, 1000, C.cobalt50, 4 * u)
			bar(w, x + 20, top - 46, 110, 10, C.cobalt700)
			rect(w, x + cw - 56, top - 52, 36, 22, C.cobalt100, 11)
			cards.forEach((lw, i) => {
				const y = top + i * (cardH + 16)
				panel(w, x + 12, y, cw - 24, cardH, u)
				bar(w, x + 36, y + 30, lw * 0.9, 10, C.cobalt900)
				bar(w, x + 36, y + 54, lw * 0.6, 7, C.cobalt300)
				circle(w, x + cw - 50, y + cardH - 30, 14, C.cobalt200)
				bar(w, x + 36, y + cardH - 34, 60, 8, C.cobalt400)
			})
		})
	},
}

/* ---------- GENERAL: the data layer ---------- */

/**
 * dataLayerFrame(ctx, p): your records in one place, every change logged, and
 * the record's files, mail, meetings and chats right there.
 *
 *   app      the app id; its tag pins to the record card
 *   caption  the scene's line (see COPY.dataLayer)
 *   record   { avatar: 'person'|'hex'|'square', title: bar width, sub, status: 'mint'|'idle'|'none',
 *              fields: [[labelW, valueW], ...] up to 4 }
 *   history  newest first, up to 4: [{ av: colour, w: line width, sub }]; the newest takes the orange pip
 *   links    the Nextcloud apps that link in, 1 to 4: 'nc-files' | 'nc-mail' | 'nc-calendar' | 'nc-talk' | 'nc-decks'.
 *            Only the ones the app really links (divide.md): Pipelinq mail, files, calendar (no Talk);
 *            Learniq Talk and files (no Calendar).
 */
export function dataLayerFrame(ctx, p) {
	const { app, caption: text } = p
	const record = { avatar: 'person', title: 230, sub: 160, status: 'mint', fields: [[56, 150], [56, 120], [56, 170], [56, 96]], ...p.record }
	const history = (p.history || [{ av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 140 }, { av: C.cobalt300, w: 190 }, { av: C.cobalt200, w: 120 }]).slice(0, 4)
	const links = (p.links || ['nc-files', 'nc-mail', 'nc-calendar', 'nc-talk']).slice(0, 4)
	chrome(ctx, { text, app })
	sharedField(ctx)
	const g = generalView(ctx)

	// The record: avatar, name, status, and its fields in two columns.
	const rx = 170, ry = 640, rw = 610, rh = 236
	panel(g, rx, ry, rw, rh, U)
	const acy = ry + 70
	avatar(g, rx + 100, acy, 36, record.avatar, C.cobalt300)
	bar(g, rx + 156, acy - 22, record.title, 20, C.cobalt900)
	bar(g, rx + 156, acy + 10, record.sub, 10, C.cobalt300)
	trailing(g, record.status, rx + rw - 30, acy, U)
	rect(g, rx + 30, ry + 132, rw - 60, U, C.cobalt100)
	record.fields.slice(0, 4).forEach(([kw, vw], i) => {
		const x = rx + 40 + (i % 2) * (rw / 2 - 10)
		const y = ry + 170 + Math.floor(i / 2) * 36
		bar(g, x, y - 4, kw, 8, C.cobalt400)
		bar(g, x + kw + 16, y - 4, Math.min(vw, rw / 2 - kw - 70), 8, C.cobalt700)
	})
	appTag(g, rx, acy, 44, app)

	// Every change logged: the record's history, who and when, newest on top.
	const hx = 170, hy = 900, hw = 350, hh = 340
	panel(g, hx, hy, hw, hh, U)
	wHead(g, hx + 30, hy + 26, U, 'nc-activity', { titleW: 40 })
	history.forEach((h, i) => {
		const y = hy + 104 + i * 60
		if (i === 0) rect(g, hx + 14, y - 26, hw - 28, 52, C.cobalt50, 3 * U)
		circle(g, hx + 48, y, 17.5, h.av || C.cobalt300)
		bar(g, hx + 78, y - 11, Math.min(h.w || 160, hw - 180), 7.5, C.cobalt700)
		bar(g, hx + 78, y + 5, h.sub ?? 110, 5, C.cobalt200)
		bar(g, hx + hw - 98, y - 4, 44, 8, C.cobalt400)
		if (i === 0) circle(g, hx + hw - 36, y, 9, C.orange)
	})

	// Right there: the Nextcloud apps that link into this record.
	const sx = 548, sw = 232, tg = 12
	const th = Math.min(100, (hh - (links.length - 1) * tg) / links.length)
	links.forEach((icon, i) => {
		const ty = hy + i * (th + tg)
		panel(g, sx, ty, sw, th, U)
		use(g, icon, sx + 46, ty + 18, 40, 40, C.cobalt)
		bar(g, sx + 102, ty + 26, (sw - 124) * [0.8, 0.62, 0.72, 0.55][i], 8, C.cobalt700)
		bar(g, sx + 102, ty + 44, (sw - 124) * 0.5, 6, C.cobalt200)
		// a taller tile shows two linked items under its head
		for (let k = 0; ty + 76 + k * 22 + 8 < ty + th - 12; k++) bar(g, sx + 46, ty + 80 + k * 22, (sw - 92) * [0.9, 0.7][k % 2], 6, C.cobalt100)
	})
	ncTag(g, sx, hy + (links.length > 1 ? th + tg / 2 : th / 2), 38, { ringW: 5 })
}

/* ---------- GENERAL: the right person hears about it ---------- */

/**
 * notifyFrame(ctx, p): something happens on a record, and the right person
 * hears about it in the same Nextcloud bell where they see a shared file or a
 * chat mention. The record reaches a stage of its life (lavender, process); a
 * wire runs to the bell in Nextcloud's own header; the bell's badge is the
 * frame's one orange; the popover lists the new notice from this app on top of
 * Nextcloud's own (a shared file, a chat mention).
 *
 *   app         the app id; its tag pins to the record, its glyph marks the new notice
 *   caption     the scene's line (see COPY.notify)
 *   record      { avatar: 'person'|'hex'|'square', title, sub, status: 'mint'|'idle'|'none' }
 *   event       { stage: 0..3, the stage the record just reached; stages: 4 }
 *   notices     newest first, up to 3: [{ app } | { icon: 'nc-files'|'nc-talk'|... }, ...]
 *   recipients  1 or 2 avatar colours: who hears it (Learniq's overdue notice goes to the
 *               manager and HR, so two)
 */
export function notifyFrame(ctx, p) {
	const { app, caption: text } = p
	const record = { avatar: 'person', title: 230, sub: 150, status: 'idle', ...p.record }
	const stages = p.event?.stages ?? 4
	const stage = Math.min(p.event?.stage ?? 2, stages - 1)
	const notices = (p.notices || [{ app }, { icon: 'nc-files' }, { icon: 'nc-talk' }]).slice(0, 3)
	const recipients = (p.recipients || [C.cobalt300]).slice(0, 2)
	chrome(ctx, { text, app })
	sharedField(ctx)
	const g = generalView(ctx)

	// The record, and the stage of its life it just reached.
	const rx = 170, ry = 640, rw = 610, rh = 212
	panel(g, rx, ry, rw, rh, U)
	const acy = ry + 66
	avatar(g, rx + 100, acy, 34, record.avatar, C.cobalt300)
	bar(g, rx + 156, acy - 22, record.title, 20, C.cobalt900)
	bar(g, rx + 156, acy + 10, record.sub, 10, C.cobalt300)
	trailing(g, record.status, rx + rw - 30, acy, U)
	rect(g, rx + 30, ry + 124, rw - 60, U, C.cobalt100)
	const sy = ry + 166
	const x0 = rx + 70, x1 = rx + rw - 70
	const sxAt = (i) => x0 + ((x1 - x0) * i) / (stages - 1)
	rect(g, x0, sy - 1.5, x1 - x0, 3, C.cobalt100)
	for (let i = 0; i < stages; i++) {
		const now = i === stage
		hex(g, sxAt(i), sy, now ? 15 : 10, i < stage ? C.mint : now ? C.lavender : C.cobalt200, now ? 2 : 1.4)
		bar(g, sxAt(i) - 26, sy + 24, 52, 6, now ? C.cobalt700 : C.cobalt200)
	}
	appTag(g, rx, acy, 44, app)

	// Nextcloud's own header: the bell, and who is signed in.
	const hx = 150, hy = 900, hw = 630, hh = 60
	const bellX = 676
	el('path', { d: `M${sxAt(stage)} ${sy + 34} V${hy - 22} H${bellX} V${hy}`, fill: 'none', stroke: C.cobalt300, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g)
	circle(g, sxAt(stage), sy + 34, 5, C.cobalt300)
	rect(g, hx, hy, hw, hh, C.cobalt900, 4 * U)
	rect(g, hx + 50, hy + hh / 2 - 13, 40, 26, C.white, 13)
	for (let i = 0; i < 6; i++) rect(g, hx + 108 + i * 34, hy + hh / 2 - 9, 18, 18, C.white, 2.5, { 'fill-opacity': 0.7 })
	// The bell: the Lucide bell (brand/assets/icons/bell.svg), white on Nextcloud's header.
	use(g, 'icon-bell', bellX - 16, hy + hh / 2 - 16, 32, 32, C.white)
	circle(g, bellX + 11, hy + hh / 2 - 10, 7.5, C.orange, { stroke: C.cobalt900, 'stroke-width': 3 })
	recipients.forEach((av, i) => circle(g, hx + hw - 36 - i * 24, hy + hh / 2, 15, av, { stroke: C.cobalt900, 'stroke-width': 3 }))
	ncTag(g, hx, hy + hh / 2, 32, { ringW: 5 })

	// The bell's popover: the new notice from this app on top of Nextcloud's own.
	const px = 260, py = 984, pw = 520, ph = 1240 - 984
	el('path', { d: `M${bellX - 14} ${py + 1} L${bellX} ${py - 13} L${bellX + 14} ${py + 1} Z`, fill: C.white }, g)
	panel(g, px, py, pw, ph, U)
	el('path', { d: `M${bellX - 14} ${py + 1.5} L${bellX} ${py - 12} L${bellX + 14} ${py + 1.5}`, fill: C.white }, g)
	bar(g, px + 26, py + 24, 140, 10, C.cobalt700)
	notices.forEach((n, i) => {
		const cy = py + 76 + i * 62
		if (i === 0) rect(g, px + 12, cy - 27, pw - 24, 54, C.cobalt50, 3 * U)
		if (n.app) appTag(g, px + 46, cy, 20, n.app, { ringW: 0 })
		else use(g, n.icon, px + 28, cy - 18, 36, 36, C.cobalt)
		bar(g, px + 84, cy - 11, n.w ?? [260, 210, 180][i], 9, i === 0 ? C.cobalt900 : C.cobalt700)
		bar(g, px + 84, cy + 6, (n.w ?? 220) * 0.55, 6, C.cobalt300)
		bar(g, px + pw - 72, cy - 3, 42, 7, C.cobalt300)
	})
}

/* ---------- GENERAL: draw your own flow ---------- */

/**
 * flowsFrame(ctx, p): the flow editor (FlowMock) while you draw your own flow.
 * In both Pipelinq 0.5.1 and Learniq 0.3.0 flows are a capability only: the
 * editor ships, the flows do not. So the frame shows the canvas mid-drawing: a
 * trigger on the app's record, two steps, and the next node being dropped into
 * place (its dashed slot is the frame's one orange: you decide). It never shows
 * a run, and nothing here says pre-built.
 *
 *   app      the app id
 *   caption  the scene's line (see COPY.flows)
 *   trigger  { app: whose record starts it (defaults to app) }
 */
export function flowsFrame(ctx, p) {
	const { app, caption: text } = p
	const trigger = { app, ...p.trigger }
	chrome(ctx, { text, app })
	sharedField(ctx)
	const g = generalView(ctx)

	const x0 = 150, y0 = 640, w0 = 630, h0 = 600
	dotCanvas(g, x0, y0, w0, h0, U)
	const k = 1.5
	const nT = flowNode(g, 180, 690, 180, 100, k, { kind: 'trigger' })
	const nA = flowNode(g, 450, 810, 180, 100, k, { kind: 'step' })
	const nB = flowNode(g, 180, 940, 180, 100, k, { kind: 'step', titleW: 0.45 })
	flowEdge(g, nT.r, nA.l, k)
	flowEdge(g, nA.l, nB.r, k, { pill: false })
	// The next node, being placed: its dashed slot, the dashed edge that will join it,
	// and the card lifted off the canvas with a flat 2D shadow.
	const sx = 450, sy = 1080, sw = 180, sh = 100
	const mx = (nB.r[0] + sx) / 2
	el('path', { d: `M${nB.r[0]} ${nB.r[1]} C${mx} ${nB.r[1]} ${mx} ${sy + sh / 2} ${sx} ${sy + sh / 2}`, fill: 'none', stroke: C.cobalt200, 'stroke-width': 2 * k, 'stroke-linecap': 'round', 'stroke-dasharray': '6 8' }, g)
	rect(g, sx, sy, sw, sh, 'none', 8 * k, { stroke: C.orange, 'stroke-width': 3, 'stroke-dasharray': '12 9' })
	const lx = sx - 34, ly = sy - 36
	rect(g, lx + 10, ly + 12, sw, sh, C.cobalt200, 8 * k)
	flowNode(g, lx, ly, sw, sh, k, { kind: 'step', titleW: 0.5 })
	appTag(g, 180, 690, 30, trigger.app, { ringW: 5 })
}

/* ---------- GENERAL: the assistant ---------- */

/**
 * aiFrame(ctx, p): ask a question about your records and get the answer; the
 * assistant only does what you allow and asks before it changes anything.
 * The surface is an assistant chat in the vocabulary of HermiqMock: question
 * right, the answer left built from the app's records, and, only for an app
 * whose assistant actions change records, an approval card whose Allow button
 * carries the frame's one orange as a ring round it: it waits for you.
 *
 * AI is as strong as each app's actions (divide.md): Pipelinq real (forecast,
 * create a lead, log a contact moment); Learniq weak (two read-only course
 * lookups, nothing about learners): leave it out, or ask about courses only,
 * with no approval card. Never a Hermiq sales agent for Pipelinq.
 *
 *   app         the app id; its tag pins to the chat header (the app you ask about)
 *   caption     the scene's line (see COPY.ai)
 *   assistant   optional app id to pin instead (only where that app is sourced)
 *   question    { w: bubble width, lines: [fractions] }
 *   answer      { rows: [{ avatar, w, trail: 'mint'|'idle'|'progress', p }] } up to 3
 *   permission  { toggles: [bool, ...] } settings switches (default none);
 *               { ask: true } shows the approval card (default false)
 */
export function aiFrame(ctx, p) {
	const { app, caption: text, assistant = null } = p
	const question = { w: 330, lines: [0.78, 0.5], ...p.question }
	const rows = (p.answer?.rows || [{ avatar: 'person', w: 190, trail: 'idle' }, { avatar: 'person', w: 160, trail: 'idle' }, { avatar: 'person', w: 210, trail: 'mint' }]).slice(0, 3)
	const permission = { toggles: [], ask: false, ...p.permission }
	chrome(ctx, { text, app })
	sharedField(ctx)
	const g = generalView(ctx)

	// Without an approval card the chat ends on the follow-up, so the card is shorter.
	const x = 150, y = 640, w = 630, h = permission.ask ? 700 : 580
	const card = clipped(g, x, y, w, h, 4 * U)
	rect(card, x, y, w, h, C.white)
	rect(g, x, y, w, h, 'none', 4 * U, { stroke: C.cobalt100, 'stroke-width': U })
	// Header: the assistant, and what it may do (settings switches, greeked).
	const hy = y + 44
	bar(g, x + 70, hy - 9, 150, 18, C.cobalt900)
	permission.toggles.slice(0, 3).forEach((on, i) => {
		const tx = x + w - 30 - (permission.toggles.length - i) * (22 * U + 14) + 14
		toggle(g, tx, hy, U, on)
	})
	rect(g, x, y + 88, w, U, C.cobalt100)
	appTag(g, x, hy, 36, assistant || app, { ringW: 5 })

	// The question, right.
	const qx = x + w - 30 - question.w, qy = y + 110
	bubble(g, qx, qy, question.w, 66, U, { side: 'user' })
	question.lines.forEach((f, i) => bar(g, qx + 24, qy + 20 + i * 18, (question.w - 48) * f, 8, C.cobalt700))

	// The answer, left: rows read from the app's records.
	const ax = x + 30, ay = qy + 66 + 20, aw = 480
	const ah = 44 + rows.length * 56 + 14
	bubble(g, ax, ay, aw, ah, U, { side: 'agent' })
	bar(g, ax + 24, ay + 20, 250, 8, C.cobalt700)
	rows.forEach((r, i) => {
		const cy = ay + 64 + i * 56
		rect(g, ax + 16, cy - 22, aw - 32, 44, C.white, 3 * U, { stroke: C.cobalt100, 'stroke-width': U })
		avatar(g, ax + 46, cy, 14, r.avatar, i % 2 ? C.cobalt200 : C.cobalt300)
		bar(g, ax + 76, cy - 9, r.w, 8, C.cobalt900)
		bar(g, ax + 76, cy + 5, r.w * 0.55, 5, C.cobalt300)
		trailing(g, r.trail, ax + aw - 32, cy, 2, r.p)
	})

	// It asks first: the approval card, Allow waiting inside an orange ring.
	if (permission.ask) {
		const py = ay + ah + 20, pw = 540, ph = 1238 - py
		bubble(g, ax, py, pw, ph, U, { side: 'agent' })
		bar(g, ax + 24, py + 28, 290, 9, C.cobalt700)
		bar(g, ax + 24, py + 48, 200, 6, C.cobalt300)
		const by = py + ph - 22 - 52
		button(g, ax + 24, by, 150, 52, U, { kind: 'ghost' })
		button(g, ax + 24 + 150 + 14, by, 190, 52, U, { kind: 'accent' })
	} else {
		// No approval to ask for: the person follows up, as in the mock's last turn.
		const fw = question.w * 0.7
		bubble(g, x + w - 30 - fw, ay + ah + 24, fw, 48, U, { side: 'user' })
		bar(g, x + w - 30 - fw + 24, ay + ah + 44, (fw - 48) * 0.7, 8, C.cobalt700)
	}
	// The prompt row, at the card's foot: texture only.
	rect(card, x + 30, y + h - 62, w - 60 - 70, 40, C.white, 4 * U, { stroke: C.cobalt200, 'stroke-width': U })
	rect(card, x + w - 30 - 56, y + h - 62, 56, 40, C.cobalt, 4 * U)
}

/* ---------- BRAND: the outro ---------- */

/**
 * outroFrame(ctx, p): the honeycomb closes round the Nextcloud workspace hex
 * with this app's hex singled out (orange: the app icon exception on cobalt),
 * the ConNext wordmark and the install call in orange text. The type column
 * holds the wordmark and the install call; the cluster sits right of it with the
 * app cell up-left of the workspace hex, exactly on LOOP_ANCHOR, so the last
 * beat only has to shrink it back to frame 1's tag.
 *
 *   app         the app id
 *   name        the label next to its hex (defaults to APP_NAMES)
 *   neighbours  up to 4 other app ids (white cells), placed so the ring stays balanced:
 *               1 -> SE; 2 -> NE, S; 3 -> NE, SE, SW; 4 -> NE, SE, S, SW. Corners without
 *               an app stay unlit field.
 */
export function outroFrame(ctx, p) {
	const { app, neighbours = [] } = p
	const name = p.name || APP_NAMES[app] || app
	const g = ctx.g
	const l = layout(ctx.W, ctx.H)
	const anchor = windowAt(ctx.W, ctx.H).anchor

	// The cluster, round the workspace hex, its NW cell on the loop anchor.
	const r = 80, gap = 8
	const s = r + gap / SQRT3
	const cx = anchor.x + 1.5 * SQRT3 * s
	const cy = anchor.y + 1.5 * s
	const n = Math.min(neighbours.length, 4)
	const slots = [[], [CORNERS.se], [CORNERS.ne, CORNERS.s], [CORNERS.ne, CORNERS.se, CORNERS.sw], [CORNERS.ne, CORNERS.se, CORNERS.s, CORNERS.sw]][n]
	const ring = [{ ...CORNERS.nw, id: app, fill: C.orange, glyph: C.white }, ...neighbours.slice(0, n).map((id, i) => ({ ...slots[i], id }))]
	const cl = workspaceCluster(g, cx, cy, r, gap, { ring, open: [], fieldTop: -Infinity, fieldScale: 0.5, W: ctx.W, H: ctx.H })
	// The app name label, right-aligned against its hex.
	const [ax, ay] = cl.cells[app]
	const labelSize = 36
	textBlock(g, name, { x: ax - (SQRT3 / 2) * r - 24, y: ay + labelSize * 0.36, anchor: 'end', size: labelSize, weight: 600, fill: C.white, tracking: -0.02, clip: false })

	// The type column: the wordmark where the small mark sat, the install call under it.
	const markH = 120
	mark(g, { h: markH })
	const size = fitCaptionSize(CTA_TEXT, { size: 96, box: l.col.stretch + 20 - l.col.x })
	const lh = Math.round(size * 1.07)
	textBlock(g, CTA_TEXT, { x: TYPE.x, y: l.type.markY + markH + 44 + Math.round(size * 0.7), size, weight: 700, fill: C.orange, lineHeight: lh / size, tracking: -0.02, clip: false })
}

/* ---------- registry, copy and motion ---------- */

export const FRAMES = { hook: hookFrame, dataLayer: dataLayerFrame, notify: notifyFrame, flows: flowsFrame, ai: aiFrame, outro: outroFrame }

/**
 * Copy templates for the general scenes. {one} and {many} are the app's record
 * kind (client / clients, course / courses); {Event} is a true, sourced record
 * event of the app, at most two words (the "?" is in the template). Sentence
 * case, no em-dashes, no banned words, no platform internals. `words` counts
 * the template with one-word fills; `fits` names the plans it fits (2 proofs:
 * 6 words in the general slot; 1 proof: 8). `use` says where divide.md
 * (apps/divide.md, from the Pipelinq 0.5.1 and Learniq 0.3.0 research) allows it.
 * Captions are fitted to the type column by chrome() (fitCaption), 112 px down
 * to 80, or 72 to 80 px on a line that may run to x 880.
 */
export const COPY = {
	dataLayer: {
		source: 'story.json ecosystem_mechanics[0] (records in one place, every change logged; shipped: openregister v2.1.0, adr-001) and [1] (files, mails, meetings and chats on the record; shipped: openregister v2.1.0 IntegrationRegistry)',
		templates: [
			{ id: 'D1', text: 'Every change shows\nwho and when.', words: 6, fits: [1, 2], rests: 'mechanics[0]: "Every change is logged with who did it and when."', use: 'Pipelinq (History tab on client, lead and 7 more detail pages) and Learniq (audit-trail widget on enrolment, credential, attendance)' },
			{ id: 'D2', text: 'Open a {one}.\nIt’s all there.', words: 6, fits: [1, 2], rests: 'mechanics[1]: "Open a client or a project and its files, mails, meetings and chats are right there."', use: 'Pipelinq strong (client page: mail, files, calendar, notes; no Talk). Learniq only with what it links: the group Talk room and files, no Calendar' },
			{ id: 'D3', text: 'Your {many},\non your own server.', words: 6, fits: [1, 2], rests: 'mechanics[0]: "All your apps keep their records in one place, on your own server." (bible "What is true" 10)', use: 'both' },
		],
	},
	notify: {
		source: 'story.json ecosystem_mechanics[8] (declared notification rules, delivered by OpenRegister to the Nextcloud bell or email; shipped: openregister v2.1.0 AnnotationNotificationDispatcher); apps/divide.md "The right person hears about it" (strong in both apps)',
		templates: [
			{ id: 'N1', text: 'The right person\nhears about it.', words: 6, fits: [1, 2], rests: 'mechanics[8]: "The right colleague hears about it in the same Nextcloud notification bell"', use: 'both' },
			{ id: 'N2', text: '{Event}?\nThe right person hears.', words: 6, fits: [1, 2], rests: 'mechanics[8] + the app\'s own declared rule', use: 'Pipelinq: a contract nearing renewal (account owner told), new lead, assignment, stage change. Learniq: a mandatory course due in 3 days (learner), overdue (manager and HR), a certificate expiring in 30 days (learner only: never the manager)' },
		],
	},
	flows: {
		source: 'story.json ecosystem_mechanics[7] (flow engine: triggers, tasks, notifications; shipped: openregister v2.1.0; "No cross-app flow comes pre-built: the customer or partner draws each one"); apps/divide.md "Draw your own flow" (capability only in both apps)',
		templates: [
			{ id: 'F1', text: 'You decide\nwhat happens next.', words: 5, fits: [1, 2], rests: 'mechanics[7]: the customer draws each flow', use: 'both, as a capability: show the editor, never a run, never "pre-built" (Pipelinq\'s one shipped flow arrives switched off; Learniq\'s Flows page ships empty)' },
			{ id: 'F2', text: 'Draw it once.\nIt runs from then on.', words: 8, fits: [1], rests: 'mechanics[7] plain language: "Set it up once."', use: 'both, one-proof films only; same limits as F1' },
		],
	},
	ai: {
		source: 'story.json ecosystem_mechanics[12] (records as assistant tools; approval gates; shipped: openregister v2.1.0 ObjectsToolProvider, hermiq v0.2.0 ToolOversightController). Not shipped, never say: "every app works with the assistant"',
		templates: [
			{ id: 'A1', text: 'Ask about {many}.\nGet the answer.', words: 6, fits: [1, 2], rests: 'mechanics[12]: "Ask a question about your clients or quotes and get the answer"', use: 'Pipelinq real (pipeline forecast, client and lead lookups). Learniq only as "ask about your courses" (listCourses, getCourseDetails), never learners; divide.md prefers leaving AI out of the Learniq film' },
			{ id: 'A2', text: 'It asks before\nit changes anything.', words: 6, fits: [1, 2], rests: 'mechanics[12]: "asks before it changes anything"; sourced to Hermiq\'s approval gates only', use: 'Pipelinq only (createLead, logContactmoment change records), and only once the surface shown is confirmed to ask first; never a Hermiq sales agent. Never Learniq (read-only tools)' },
			{ id: 'A3', text: 'Ask about {many}.\nNo report to build.', words: 7, fits: [1], rests: 'mechanics[12]: "get the answer instead of a report to build"', use: 'Pipelinq (forecast); one-proof films only' },
		],
	},
}

/** Fills a copy template: fill('Open a {one}.', { one: 'client', many: 'clients', Event: 'Deal won' }). */
export function fill(template, vars) {
	return template.replace(/\{(\w+)\}/g, (_, k) => {
		if (vars[k] === undefined) throw new Error(`copy: no value for {${k}}`)
		return vars[k]
	})
}

/* Motion notes in camera language, with the slot's own times. */
const SPB = 60 / 128
const t = (b) => (Math.round(b * SPB * 25) / 25).toFixed(2)
const bb = (b) => `${Math.floor(b / 4) + 1}.${(b % 4) + 1}`
const at = (b) => `${bb(b)} (${t(b)} s)`
const A = `(${Math.round(LOOP_ANCHOR.x)}, ${Math.round(LOOP_ANCHOR.y)})`

export const MOTION = {
	hook: (s) => `Frame 1 is this key frame exactly: the mark and the caption in the type column, the app's own UI in the window on the right and its hex at the loop anchor ${A}, no fade and nothing still to arrive. Hold two beats (0 to ${t(2)} s). From ${at(2)} to ${at(5)} the camera pushes in inside the app window, 1.00 to 3.0 (ease.brand), about the UI element proof 1 grows out of; the window's left edge stays at x ${layout().win.x} so the caption keeps its cobalt column. Out on ${at(5)}: that element snaps into an upright hex that grows past the frame (hexCut, ease.snap, one beat) and becomes proof 1's ground. The caption holds until the hex edge passes it (2.60 s).`,
	proof: (s) => `The hex fill is the new ground. The app's UI lands in the window (0.35 s, ease.brand); its app tag lands on ${at(s.from + 1)} at 2.0x and settles to 1.0 in 0.2 s (ease.brand). The caption rises in the type column in a quick stagger from the cut, every word in by ${(s.start + 0.24).toFixed(2)} s. From ${at(s.from + 2)} to ${at(s.from + 4)} the scene's own camera idea plays: a push in on the detail that proves it, or the values landing one per beat. Out on ${at(s.to - 1)}: a hex grows from the next scene's source element (hexCut, ease.snap, one beat). Caption clears at ${s.clears.toFixed(2)} s.`,
	dataLayer: (s) => `The hex fill lands as the cobalt ground and the record card drops in on the right (0.35 s, ease.brand) with the app tag pinned to it. On ${at(s.from + 1)} the history rows land top to bottom a 16th apart and the Nextcloud tiles slide in from the right one per 16th, the Nextcloud tag last; the honeycomb field pops in from the bottom edge, ring by ring on 16ths (the shared layer every app stands on). On ${at(s.from + 3)} a new row pushes in at the top of the history with the orange pip: who changed it, and when. Out on ${at(s.to - 1)}: the cards step down (0.85, ease.exit) and the app tag lifts off the record and travels to its cell in the outro cluster, over the field that stays. Caption clears at ${s.clears.toFixed(2)} s.`,
	notify: (s) => `The hex fill lands as the cobalt ground; the record card drops in on the right with the app tag, and Nextcloud's header slides down under it with the Nextcloud tag. On ${at(s.from + 1)} the record's stage marker steps forward one stage (the lavender hex pops 1.3x and settles) and the honeycomb field pops in from the bottom edge. On ${at(s.from + 2)} a pulse runs down the wire to the bell (one beat, ease.brand); the bell's orange badge pops on ${at(s.from + 3)} with a tick, and the popover drops open under it (0.2 s), the new notice sliding in on top of the file share and the chat mention. Out on ${at(s.to - 1)}: the cards step down and the app tag lifts off the record and travels to its cell in the outro cluster. Caption clears at ${s.clears.toFixed(2)} s.`,
	flows: (s) => `The hex fill lands as the cobalt ground and the flow canvas drops in on the right with its dot grid. The nodes are placed one per 16th as if drawn by hand (the trigger with the app tag, then two steps) and the edges draw between them (stroke reveal, 0.2 s each). On ${at(s.from + 2)} the next node lifts off (its flat shadow steps out 10 px) and travels toward its slot; the dashed orange slot appears on ${at(s.from + 3)}, and the node settles into it on ${at(s.from + 4)} with a tick, its dashed edge turning solid. No run line: nothing runs in this scene. The field pops in from the bottom edge. Out on ${at(s.to - 1)}: the canvas steps down and the app tag on the trigger travels to its cell in the outro cluster. Caption clears at ${s.clears.toFixed(2)} s.`,
	ai: (s) => `The hex fill lands as the cobalt ground and the chat card drops in on the right with the app tag on its header. On ${at(s.from + 1)} the question pops in right; typing dots for two 16ths; the answer grows and its rows land a 16th apart. On ${at(s.from + 3)} either the approval card lands and the orange ring round Allow waits (no press: it asks first), or, for a read-only app, the follow-up question pops in. The honeycomb field pops in from the bottom edge. Out on ${at(s.to - 1)}: the card steps down and the app tag travels to its cell in the outro cluster. Caption clears at ${s.clears.toFixed(2)} s.`,
	outro: (s) => `On ${at(s.from)} the app hex from the general scene lands in its cell up-left of the Nextcloud hex, on the loop anchor ${A}, and turns orange (the app icon exception on cobalt); the neighbour cells lock in white and the app name label rises to its left. The Nextcloud workspace hex lands at 1.4x and settles to 1.0 on ${at(s.from + 1)}; the field pops outward ring by ring on 16ths, nothing orbits. On ${at(s.from + 2)} the small mark scales up (anchored top left) to the 120 px wordmark and the install call rises under it as one line of orange text, line 2 a 16th behind, all in by ${(+t(s.from + 2) + 0.24).toFixed(2)} s. Hold to 18.75, no fade. Loop, in the last beat (${t(39)} to 18.75 s) with the install call still on screen: the wordmark shrinks back to the ${TYPE.markH} px mark, the field, the neighbour cells, the Nextcloud hex and the label step out, and the app cell shrinks in place to ${LOOP_ANCHOR.r} px (turning cobalt when the hook's tag is cobalt). The cut to frame 1 then changes the words and lays the app's UI in behind a hex that has not moved.`,
}
