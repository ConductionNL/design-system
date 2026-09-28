/**
 * Shared product-UI vocabulary for every film: the design system's mock
 * components (AppMock, WidgetMock, SidebarMock, FlowMock and HermiqMock atoms)
 * rebuilt in SVG at a scale factor u (stage px per CSS px), so a scene can push
 * the camera into a real mock instead of inventing boxes.
 *
 * Proportions and tokens follow docusaurus-preset/src/components/AppMock/
 * AppMock.module.css, SidebarMock.module.css and FlowMock.module.css: topbar
 * 24px, nav 22%, col padding 14px, panel radius 4px, frame radius 10px, bars 3
 * to 8px, flow nodes with a 4px kind bar. Colours come from _lib/brand.js only.
 *
 * Promoted from connext/boards/C/ui.js (direction C, "Proof"). Nothing in here
 * names a product, an app or a claim: content arrives as parameters.
 *
 * 16:9 since 2026-09-27 (bible: every film is 1920 x 1080). The 9:16 version is
 * frozen as connext/boards/C/ui-9x16.js for the archived vertical ConNext board.
 * Frame-dependent defaults now assume 1920 x 1080; pass ctx.W / ctx.H where a
 * helper takes W and H. No brown anywhere (the documents family is out of the
 * films): file pips and document rules are cobalt tints, and nothing puts text
 * (or a greeked label) in an orange box.
 */
import { el, textBlock, nextId, measure } from './stage.js'
import { hexPath, SQRT3 } from './core.js'
import { C } from './brand.js'
import { MARK_BOX, APP_NAMES } from './assets.js'

/**
 * The 16:9 grid, derived from the frame size so one place holds every number
 * (bible, "Format and grid"). For 1920 x 1080:
 *
 *   box    the text safe box, x 120 to 1800, y 96 to 930 (the bottom 150 px stay
 *          free of words for the player's controls)
 *   col    the type column, x 120 to 840 (720 px, about 16 characters at 112 px);
 *          a line that cannot fit at 80 px may run to x 860 at 72 to 80 px
 *   win    the app window's top-left corner (940, 160) and its scale: the
 *          AppMock is drawn in mock space at u = 2.5, as the 9:16 boards drew
 *          it, and shown at 0.8, so it bleeds off the right and bottom edges
 *   type   the small mark top left at y 300 (72 px), the caption's first
 *          baseline at y 480, 112 px on a 120 px line: the chapter group sits a
 *          little above the box's centre, left of the picture
 *   ui     where a general scene's cards start: x 970, y 160 (they end by x 1795),
 *          so a stretched caption line keeps 100 px of cobalt before them
 */
export function layout(W = 1920, H = 1080) {
	const r10 = (v) => Math.round(v / 10) * 10
	const box = { x: 120, y: 96, r: W - 120, b: H - 150 }
	const col = { x: box.x, r: r10(W * 0.4375), stretch: r10(W * 0.448) }
	const win = { x: r10(W * 0.49), y: r10(H * 0.148), s: 0.8 }
	const type = { x: box.x, markY: r10(H * 0.278), markH: 72, y1: r10(H * 0.444), size: 112, lh: 120 }
	return { W, H, box, col, win, type, ui: { x: win.x + 30, y: win.y } }
}

const L16 = layout()

/** Caption grid, shared by every scene so type never jumps between cuts. */
export const TYPE = { x: L16.type.x, y1: L16.type.y1, size: L16.type.size, lh: L16.type.lh, col: L16.col.r, markY: L16.type.markY, markH: L16.type.markH }

export const rect = (g, x, y, w, h, fill, r = 0, extra = {}) => el('rect', { x, y, width: w, height: h, rx: r, fill, ...extra }, g)
/** A placeholder text line: the mock's `.row` / `.l1` / `.l2` bars. */
export const bar = (g, x, y, w, h, fill, extra = {}) => rect(g, x, y, w, h, fill, Math.min(h / 2, 4), extra)
export const circle = (g, cx, cy, r, fill, extra = {}) => el('circle', { cx, cy, r, fill, ...extra }, g)
export const hex = (g, cx, cy, r, fill, round = 0, extra = {}) => el('path', { d: hexPath(cx, cy, r, round), fill, ...extra }, g)
export const use = (g, id, x, y, w, h, color, extra = {}) => el('use', { href: `#${id}`, x, y, width: w, height: h, color, ...extra }, g)

/** Solid ground for scenes that do not sit on the stage cobalt. */
export const ground = (ctx, fill) => rect(ctx.g, 0, 0, ctx.W, ctx.H, fill)

/** A group clipped to a rounded rect, for frames and phone screens. */
export function clipped(g, x, y, w, h, r) {
	const id = nextId('cclip')
	const cp = el('clipPath', { id }, g)
	rect(cp, x, y, w, h, C.white, r)
	return el('g', { 'clip-path': `url(#${id})` }, g)
}

/**
 * The ConNext wordmark as a small mark at the top of the type column (the Yoya
 * chapter logo), placed so its ink starts at x 120. The symbol's C starts 4.24
 * units into the 80-unit box.
 */
export function mark(g, { light = false, h = TYPE.markH, x = TYPE.x, y = TYPE.markY } = {}) {
	const id = light ? 'wordmark-connext' : 'wordmark-connext-white'
	const [bw, bh] = MARK_BOX[id]
	return use(g, id, x - (4.24 * h) / bh, y, (h * bw) / bh, h)
}

/**
 * The app's own name where the ConNext mark sits, for app films (Ruben, round 4). Same place,
 * same cap height and baseline as the wordmark (Figtree 700 at 0.8 h, baseline at 0.75 h).
 */
export function appMark(g, app, { light = false, h = TYPE.markH, x = TYPE.x, y = TYPE.markY } = {}) {
	const name = APP_NAMES[app] || app
	return textBlock(g, name, { x, y: y + h * 0.75, size: Math.round(h * 0.8), weight: 700, fill: light ? C.cobalt : C.white, tracking: -0.02, clip: false })
}

/** The scene caption: Figtree 700, sentence case, left-aligned at x 120. */
export function caption(g, text, fill, { y = TYPE.y1, size = TYPE.size, lh = TYPE.lh, accent, accent2 } = {}) {
	return textBlock(g, text, { x: TYPE.x, y, size, weight: 700, fill, accent, accent2, lineHeight: lh / size, tracking: -0.02, clip: false })
}

/**
 * The caption size that keeps every line in the type column, for copy that is
 * poured in from data. First choice: 112 px, or the largest size down to 80 px
 * that keeps the longest line inside x 120 to 840. A line too long for that
 * (more than about 18 characters) may run to x 860 at 72 to 80 px, still clear
 * of the app window at x 940 and the general scenes' cards at x 970. Below 72 px it stays 72 and reports the overflow
 * as a page error, so a stills run names it.
 */
export function fitCaptionSize(text, { size = TYPE.size, box = TYPE.col - TYPE.x, stretch = L16.col.stretch - TYPE.x, min = 72 } = {}) {
	const w = Math.max(...text.split('\n').map((l) => measure(l.replace(/[*_]/g, ''), { size, weight: 700, tracking: -0.02 })))
	if (w <= box) return size
	const inBox = Math.floor((size * box) / w)
	if (inBox >= 80) return inBox
	const wide = Math.floor((size * stretch) / w)
	if (wide >= min) return Math.min(wide, 80)
	console.error(`caption overflows the type column even at ${min} px: ${JSON.stringify(text)}`)
	return min
}

/** caption() at the size fitCaptionSize() picks, with the grid's line height. */
export function fitCaption(g, text, fill, opts = {}) {
	const size = fitCaptionSize(text, opts)
	// _word_ in a caption takes accent2: a Nextcloud app's name in Nextcloud cyan (round 6).
	return caption(g, text, fill, { y: opts.y ?? TYPE.y1, size, lh: Math.round((size * TYPE.lh) / TYPE.size), accent: opts.accent, accent2: opts.accent2 })
}

/**
 * A scene's fixed chrome, the same in every film: the ground, the small
 * wordmark top left and the caption on the type grid, fitted to the text box.
 * `ground` is 'cobalt' (the stage colour, nothing drawn), 'light' (cobalt-50)
 * or 'white'. Returns the ink colour to use for anything else on that ground.
 */
export function chrome(ctx, { ground: gr = 'cobalt', text, captionOpts, app } = {}) {
	const light = gr !== 'cobalt'
	if (gr === 'light') ground(ctx, C.cobalt50)
	if (gr === 'white') ground(ctx, C.white)
	// An app film names its app here; the ConNext film and the shared modules keep the ConNext mark.
	// Round 26: the mark and the caption carry data-role, so a transition can hold them while the picture moves.
	const m = app ? appMark(ctx.g, app, { light }) : mark(ctx.g, { light })
	;(m.group || m).setAttribute('data-role', 'mark')
	const ink = light ? C.cobalt : C.white
	const cap = text ? fitCaption(ctx.g, text, ink, captionOpts) : null
	if (cap) cap.group.setAttribute('data-role', 'caption')
	return { light, ink, caption: cap }
}

/**
 * App tag: the app's real glyph on a pointy-top hex, with a white ring so it
 * reads on cobalt, white and cobalt-50 alike. `fill` is cobalt by default; the
 * one app the scene answers with may go orange on a cobalt ground.
 */
export function appTag(g, cx, cy, r, id, { fill = C.cobalt, glyph = C.white, ring = C.white, ringW = 6 } = {}) {
	const t = el('g', {}, g)
	if (ringW) hex(t, cx, cy, r + ringW, ring, (r + ringW) * 0.13)
	hex(t, cx, cy, r, fill, r * 0.13)
	const s = r * 0.84
	use(t, `g-${id}`, cx - s / 2, cy - s / 2, s, s, glyph)
	return t
}

/** The one Nextcloud workspace hex a scene may carry: #0082C9 with the white mark. */
export function ncTag(g, cx, cy, r, { ring = C.white, ringW = 6 } = {}) {
	const t = el('g', {}, g)
	if (ringW) hex(t, cx, cy, r + ringW, ring, (r + ringW) * 0.13)
	hex(t, cx, cy, r, C.nextcloud, r * 0.13)
	const [bw, bh] = MARK_BOX['nextcloud-logo']
	const w = r * 1.12
	const h = (w * bh) / bw
	use(t, 'nextcloud-logo', cx - w / 2, cy - h / 2, w, h, C.white)
	return t
}

/* ---------- AppMock atoms, at scale u ---------- */

/**
 * .topbar: cobalt row, logo, 14 shelf icons, spacer, pill, bell, avatar.
 * `fill` exists for a window that sits on the stage cobalt, where the mock's own
 * cobalt topbar would vanish into the ground.
 */
export function topbar(g, x, y, w, u, { fill = C.cobalt } = {}) {
	rect(g, x, y, w, 24 * u, fill)
	const cy = y + 12 * u
	let px = x + 10 * u
	rect(g, px, cy - 6 * u, 16 * u, 12 * u, C.white, 6 * u)
	px += 16 * u + 6 * u
	for (let i = 0; i < 14; i++) {
		rect(g, px, cy - 4 * u, 8 * u, 8 * u, C.white, u, { 'fill-opacity': 0.7 })
		px += 8 * u + 6 * u
	}
	let rx = x + w - 10 * u
	circle(g, rx - 5 * u, cy, 5 * u, C.white)
	rx -= 10 * u + 6 * u
	circle(g, rx - 4 * u, cy, 4 * u, C.white, { 'fill-opacity': 0.7 })
	rx -= 8 * u + 6 * u
	rect(g, rx - 12 * u, cy - 4 * u, 12 * u, 8 * u, C.white, 4 * u, { 'fill-opacity': 0.4 })
}

/** .nav: cobalt-50 rail, navHead card, items, one .active. */
export function nav(g, x, y, w, h, u, { items = 6, active = 1, headHex = C.white } = {}) {
	rect(g, x, y, w, h, C.cobalt50)
	rect(g, x + w - u, y, u, h, C.cobalt100)
	const ix = x + 8 * u
	const iw = w - 16 * u
	let py = y + 10 * u
	rect(g, ix, py, iw, 19 * u, C.cobalt, 3 * u)
	hex(g, ix + 6 * u + 4 * u, py + 9.5 * u, 4.5 * u, headHex)
	bar(g, ix + 19 * u, py + 7.5 * u, iw - 25 * u, 4 * u, C.white, { 'fill-opacity': 0.7 })
	py += 19 * u + 4 * u + 5 * u
	for (let i = 0; i < items; i++) {
		const on = i === active
		if (on) rect(g, ix, py, iw, 16 * u, C.cobalt100, 2 * u)
		rect(g, ix + 5 * u, py + 4 * u, 8 * u, 8 * u, on ? C.cobalt : C.cobalt400, u)
		bar(g, ix + 18 * u, py + (on ? 5.5 : 6) * u, iw - 23 * u, (on ? 5 : 4) * u, on ? C.cobalt700 : C.cobalt200)
		py += 16 * u + 5 * u
	}
}

/** .panel: white card, 1px cobalt-100 border, radius 4px. */
export function panel(g, x, y, w, h, u, { fill = C.white, stroke = C.cobalt100, r = 4 } = {}) {
	return rect(g, x, y, w, h, fill, r * u, { stroke, 'stroke-width': u })
}

/** .statusPill: mint pill, hex glyph + short line. Returns its width. */
export function statusPill(g, x, cy, u, { bg = C.mint300, ink = C.mint } = {}) {
	// padding 2px 6px; hex 6x7, gap 3px, line 22x3
	const w = (6 + 6 + 3 + 22 + 6) * u
	const h = 11 * u
	rect(g, x, cy - h / 2, w, h, bg, h / 2)
	hex(g, x + 9 * u, cy, 3.5 * u, ink)
	bar(g, x + 15 * u, cy - 1.5 * u, 22 * u, 3 * u, ink)
	return w
}

/** A neutral pill (the mock's idle status): cobalt-50 with a cobalt-300 line. Returns its width. */
export function idlePill(g, x, cy, u, { w = 34, bg = C.cobalt50, ink = C.cobalt300 } = {}) {
	const h = 9 * u
	rect(g, x, cy - h / 2, w * u, h, bg, h / 2)
	bar(g, x + 8 * u, cy - 1.25 * u, (w - 16) * u, 2.5 * u, ink)
	return w * u
}

/** Widget head: the real Nextcloud app icon (in place of the mock's .h square) and a title line. */
export function wHead(g, x, y, u, icon, { titleW = 34 } = {}) {
	const s = 17 * u
	use(g, icon, x, y, s, s, C.cobalt)
	bar(g, x + s + 6 * u, y + s / 2 - 2.5 * u, titleW * u, 5 * u, C.cobalt700)
}

/**
 * A widget tile (.panel with a wHead): the card, the icon head, and the body
 * box handed to `body(x, y, w)`. Pads are in stage px, as direction C drew them.
 */
export function widgetTile(g, x, y, w, h, u, icon, body, { titleW = 30, pad = 36, padR = 28, top = 24, gap = 16 } = {}) {
	panel(g, x, y, w, h, u)
	wHead(g, x + pad, y + top, u, icon, { titleW })
	if (body) body(x + pad, y + top + 17 * u + gap, w - pad - padR)
}

/** SidebarMock .smPerson / WidgetMock mail row: avatar, a dark line and a light line. */
export function personRow(g, x, y, w, u, av, l1) {
	circle(g, x + 7 * u, y + 7 * u, 7 * u, av)
	bar(g, x + 14 * u + 5 * u, y + 7 * u - 5, l1, 3 * u, C.cobalt700)
	bar(g, x + 14 * u + 5 * u, y + 7 * u + 5, w - 19 * u - 10, 2 * u, C.cobalt200)
}

/** WidgetMock file row: a hex pip (a cobalt tint: the documents family is out of the films) and a line. */
export function fileRow(g, x, y, lw, u, { pip = C.cobalt300, ink = C.cobalt200 } = {}) {
	hex(g, x + 5.5 * u, y + 6.5 * u, 6.5 * u, pip)
	bar(g, x + 11 * u + 5 * u, y + 6.5 * u - 3.75, lw, 3 * u, ink)
}

/** A calendar mini grid (.w-calendar): 7 columns, muted, event cells and one today cell. */
export function calendarGrid(g, x, y, w, rows, u, today, events, { todayFill = C.orange } = {}) {
	const gap = 2 * u
	const cw = (w - 6 * gap) / 7
	const ch = cw * 0.72
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < 7; c++) {
			const key = `${r},${c}`
			const fill = key === today ? todayFill : events.includes(key) ? C.cobalt300 : C.cobalt50
			rect(g, x + c * (cw + gap), y + r * (ch + gap), cw, ch, fill, u)
		}
	}
}

/**
 * SidebarMock .sb-tabs: one tab per registered integration, its real icon, a
 * short line, and the active underline. Returns the strip's height.
 */
export function sidebarTabs(g, x, y, w, u, icons, { active = 0, h = 22 } = {}) {
	const n = icons.length
	const tw = w / n
	rect(g, x, y + h * u - u, w, u, C.cobalt100)
	icons.forEach((icon, i) => {
		const on = i === active
		const tx = x + i * tw
		const s = 9 * u
		use(g, icon, tx + 7 * u, y + (h * u - s) / 2, s, s, on ? C.cobalt700 : C.cobalt300)
		bar(g, tx + 7 * u + s + 4 * u, y + (h * u) / 2 - 1.5 * u, Math.min(24 * u, tw - s - 18 * u), 3 * u, on ? C.cobalt700 : C.cobalt300)
		if (on) rect(g, tx, y + h * u - 2 * u, tw, 2 * u, C.cobalt)
	})
	return h * u
}

/**
 * A button: 'primary' (cobalt), 'ghost' (outlined) or 'accent' (the scene's one
 * orange). The accent is a primary button with an orange ring round it, never an
 * orange fill: a label (even a greeked one) never sits in an orange box.
 */
export function button(g, x, y, w, h, u, { kind = 'primary', label = 0.46 } = {}) {
	const fill = kind === 'ghost' ? C.white : C.cobalt
	const extra = kind === 'ghost' ? { stroke: C.cobalt200, 'stroke-width': u } : {}
	if (kind === 'accent') rect(g, x - 3 * u, y - 3 * u, w + 6 * u, h + 6 * u, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 1.6 * u })
	rect(g, x, y, w, h, fill, 4 * u, extra)
	const ink = kind === 'ghost' ? C.cobalt400 : C.white
	const lw = w * label
	bar(g, x + (w - lw) / 2, y + h / 2 - 2 * u, lw, 4 * u, ink)
}

/** A switch (settings toggle): mint when on, cobalt-200 when off. */
export function toggle(g, x, cy, u, on) {
	const w = 22 * u, h = 12 * u
	rect(g, x, cy - h / 2, w, h, on ? C.mint : C.cobalt200, h / 2)
	circle(g, on ? x + w - h / 2 : x + h / 2, cy, h / 2 - 2 * u, C.white)
	return w
}

/**
 * HermiqMock bubbles: the person's question on the right, the assistant's
 * answer on the left (surface with a cobalt-100 border). Returns the bubble rect.
 */
export function bubble(g, x, y, w, h, u, { side = 'agent', fill } = {}) {
	const r = 8 * u
	const user = side === 'user'
	const f = fill || (user ? C.cobalt100 : C.cobalt50)
	const extra = user ? {} : { stroke: C.cobalt100, 'stroke-width': u }
	// One square corner at the speaker's side, as the mock's border-radius 8/2.
	const k = 2 * u
	const d = user
		? `M${x + r} ${y}H${x + w - k}Q${x + w} ${y} ${x + w} ${y + k}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`
		: `M${x + k} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + k}Q${x} ${y} ${x + k} ${y}Z`
	el('path', { d, fill: f, ...extra }, g)
	return { x, y, w, h }
}

/**
 * FlowMock node: a white card, a 4px kind bar (mint trigger, lavender step,
 * the end in cobalt-400 here because vermillion is not a brand fill), a title
 * line and two sub lines. Returns the ports { l: [x, y], r: [x, y] }.
 */
export function flowNode(g, x, y, w, h, u, { kind = 'step', titleW = 0.55 } = {}) {
	const barFill = kind === 'trigger' ? C.mint : kind === 'end' ? C.cobalt400 : C.lavender
	rect(g, x, y, w, h, C.white, 8 * u, { stroke: C.cobalt100, 'stroke-width': u })
	rect(g, x + 3 * u, y + 6 * u, 4 * u, h - 12 * u, barFill, 2 * u)
	const pad = 12 * u
	bar(g, x + pad, y + h * 0.3, w * titleW, 5 * u, C.cobalt700)
	bar(g, x + pad, y + h * 0.3 + 14 * u, w * 0.68, 3 * u, C.cobalt200)
	bar(g, x + pad, y + h * 0.3 + 22 * u, w * 0.44, 3 * u, C.cobalt200)
	return { l: [x, y + h / 2], r: [x + w, y + h / 2] }
}

/** FlowMock edge: a curved cobalt-200 line between two ports, with its pill label. */
export function flowEdge(g, a, b, u, { stroke = C.cobalt200, pill = true, width = 2 } = {}) {
	const mx = (a[0] + b[0]) / 2
	el('path', { d: `M${a[0]} ${a[1]} C${mx} ${a[1]} ${mx} ${b[1]} ${b[0]} ${b[1]}`, fill: 'none', stroke, 'stroke-width': width * u, 'stroke-linecap': 'round' }, g)
	if (pill) {
		const cy = (a[1] + b[1]) / 2
		rect(g, mx - 17 * u, cy - 7 * u, 34 * u, 14 * u, C.white, 7 * u, { stroke: C.cobalt100, 'stroke-width': u })
		bar(g, mx - 9 * u, cy - 1.5 * u, 18 * u, 3 * u, C.cobalt300)
	}
}

/** FlowMock canvas: cobalt-50 surface with the dot grid, clipped to its frame. */
export function dotCanvas(g, x, y, w, h, u, { step = 16, r = 10 } = {}) {
	const c = clipped(g, x, y, w, h, r * u)
	rect(c, x, y, w, h, C.cobalt50)
	const s = step * u
	const dots = el('g', { fill: C.cobalt200 }, c)
	for (let py = y + 2 * u; py < y + h; py += s) for (let px = x + 2 * u; px < x + w; px += s) circle(dots, px, py, u, C.cobalt200)
	rect(g, x, y, w, h, 'none', r * u, { stroke: C.cobalt100, 'stroke-width': u })
	return c
}

/* ---------- The phone: flat, no bezel shading ---------- */

export function phone(g, x, y, w, h, { body = C.cobalt900, inset = 0.032, radius = 0.15 } = {}) {
	const r = w * radius
	rect(g, x, y, w, h, body, r)
	const i = w * inset
	const s = { x: x + i, y: y + i, w: w - 2 * i, h: h - 2 * i, r: r - i }
	const screen = clipped(g, s.x, s.y, s.w, s.h, s.r)
	rect(screen, s.x, s.y, s.w, s.h, C.white)
	// status row: time, island, battery
	const k = s.w / 400
	bar(screen, s.x + 34 * k, s.y + 22 * k, 44 * k, 11 * k, C.cobalt900)
	rect(screen, s.x + s.w / 2 - 56 * k, s.y + 14 * k, 112 * k, 30 * k, body, 15 * k)
	bar(screen, s.x + s.w - 34 * k - 30 * k, s.y + 22 * k, 30 * k, 11 * k, C.cobalt900)
	return { screen, ...s, k }
}

export const hexWidthOf = (r) => SQRT3 * r

/* ---------- Documents ---------- */

/**
 * A generated document page: a cobalt rule on top, heading, body
 * lines, labelled field slots holding values, more body, and a signature line.
 * `values` are the slot value widths; the last may take the scene's orange.
 * Returns the slots [{ x, cy }] so wires can run into them.
 */
export function docPage(g, x, y, w, h, { k = 1, values = [118, 96, 72], lastOrange = true, shadow = C.cobalt100, rule = C.cobalt } = {}) {
	if (shadow) rect(g, x, y + 14 * k, w, h, shadow, 8 * k)
	const pg = clipped(g, x, y, w, h, 8 * k)
	rect(pg, x, y, w, h, C.white)
	rect(pg, x, y, w, 12 * k, rule)
	rect(g, x, y, w, h, 'none', 8 * k, { stroke: C.cobalt100, 'stroke-width': 2.5 * k })
	const px = x + 44 * k
	bar(g, px, y + 54 * k, 230 * k, 18 * k, C.cobalt700)
	bar(g, px, y + 88 * k, 150 * k, 8 * k, C.cobalt300)
	for (const [i, lw] of [410, 380, 300].entries()) bar(g, px, y + (130 + i * 22) * k, lw * k, 10 * k, C.cobalt100)
	const slots = []
	values.forEach((vw, i) => {
		const cy = y + (234 + i * 70) * k
		bar(g, px, cy - 4 * k, 56 * k, 8 * k, C.cobalt400)
		const sx = px + 72 * k
		rect(g, sx, cy - 20 * k, 150 * k, 40 * k, C.cobalt50, 6 * k, { stroke: C.cobalt200, 'stroke-width': 2.5 * k })
		const orange = lastOrange && i === values.length - 1
		bar(g, sx + 16 * k, cy - 5 * k, vw * k, 10 * k, orange ? C.orange : C.cobalt700)
		slots.push({ x: sx, cy })
	})
	for (const [i, lw] of [410, 360, 390, 250].entries()) bar(g, px, y + (440 + i * 22) * k, lw * k, 10 * k, C.cobalt100)
	hex(g, px + 10 * k, y + 566 * k, 10 * k, C.cobalt200)
	bar(g, px + 30 * k, y + 568 * k, 200 * k, 3 * k, C.cobalt300)
	return slots
}

/* ---------- The honeycomb ---------- */

/** Opacity of an unlit field cell by its ring distance from the centre. */
export const FIELD_ALPHA = { 2: 0.42, 3: 0.27, 4: 0.17, 5: 0.11, 6: 0.07 }

/**
 * Centre of axial cell (q, r) on a honeycomb of cell radius r and gap, around (cx, cy).
 * Same geometry as core.axialToPixel, anchored.
 */
export function honeyAt(cx, cy, r, gap) {
	const s = r + gap / SQRT3
	return (q, rr) => [cx + s * SQRT3 * (q + rr / 2), cy + s * 1.5 * rr]
}

/**
 * The unlit honeycomb field: cobalt-400 cells whose opacity steps down with
 * ring distance (depth from opacity only, never blur). `skip(q, r, d)` leaves a
 * cell out; cells above `top` (pass -Infinity for none) or off the frame are not drawn.
 */
export function honeyField(g, cx, cy, r, gap, { skip = () => false, top = Infinity, bottom = Infinity, alpha = FIELD_ALPHA, scale = 1, W = 1920, H = 1080, extent = 16, fill = C.cobalt400, floor = 0.05 } = {}) {
	const at = honeyAt(cx, cy, r, gap)
	const field = el('g', {}, g)
	for (let q = -extent; q <= extent; q++) {
		for (let rr = -extent; rr <= extent; rr++) {
			const d = Math.max(Math.abs(q), Math.abs(rr), Math.abs(q + rr))
			if (skip(q, rr, d)) continue
			const [x, y] = at(q, rr)
			if (y < top || y > bottom || x < -r || x > W + r || y > H + r) continue
			hex(field, x, y, r, fill, r * 0.1, { 'fill-opacity': (alpha[d] ?? floor) * scale })
		}
	}
	return field
}

/** The six corner cells of the second ring, in the big hex's vertex directions. */
export const CORNERS = {
	n: { q: 1, r: -2 },
	ne: { q: 2, r: -1 },
	se: { q: 1, r: 1 },
	s: { q: -1, r: 2 },
	sw: { q: -2, r: 1 },
	nw: { q: -1, r: -1 },
}

/**
 * The closing cluster, after the design system's platform overview: one large
 * Nextcloud workspace hex with app cells at its corners. It sits on a regular
 * honeycomb of cell size r: the big hex takes the footprint of the centre and
 * its first ring, and the apps sit on the corner cells of the second ring
 * (distance 3s, exactly in the big hex's vertex directions).
 *
 *   ring   [{ q, r, id, fill?, glyph? }]: the app cells; `id` null draws a blank cell
 *   open   [{ q, r }]: cells left empty (no app, no field)
 *
 * Returns { at, s, R, cells: { id: [x, y] } }.
 */
export function workspaceCluster(g, cx, cy, r, gap, { ring = [], open = [], fieldTop = Infinity, fieldScale = 1, W = 1920, H = 1080, edge = C.cobalt, cellFill = C.white, glyphFill = C.cobalt } = {}) {
	const s = r + gap / SQRT3
	const at = honeyAt(cx, cy, r, gap)
	const lit = new Set(ring.map((c) => `${c.q},${c.r}`))
	const gone = new Set(open.map((c) => `${c.q},${c.r}`))
	honeyField(g, cx, cy, r, gap, { skip: (q, rr, d) => d <= 1 || lit.has(`${q},${rr}`) || gone.has(`${q},${rr}`), top: fieldTop, scale: fieldScale, W, H })
	// The workspace hex: about twice an app cell, as in platform-overview.
	const R = 2.55 * r
	hex(g, cx, cy, R, C.nextcloud, R * 0.06)
	const [bw, bh] = MARK_BOX['nextcloud-logo']
	const lw = R * 0.8
	use(g, 'nextcloud-logo', cx - lw / 2, cy - (lw * bh) / bw / 2, lw, (lw * bh) / bw, C.white)
	// App cells overlap the big hex's corners; a ground-coloured edge cuts them clean.
	const cells = {}
	for (const c of ring) {
		const [x, y] = at(c.q, c.r)
		hex(g, x, y, r, c.fill || cellFill, r * 0.1, { stroke: edge, 'stroke-width': gap, 'paint-order': 'stroke' })
		if (c.id) {
			const gs = r * 0.84
			use(g, `g-${c.id}`, x - gs / 2, y - gs / 2, gs, gs, c.glyph || glyphFill)
			cells[c.id] = [x, y]
		}
	}
	return { at, s, R, cells }
}

/* ---------- The hex match cut ---------- */

/**
 * The circumradius a pointy-top hex centred at (cx, cy) needs to cover the
 * whole W x H frame: the largest of the three slab distances over the corners,
 * divided by the apothem ratio. The match cut grows a hex from a UI element to
 * this size, so the next scene's ground is the hex itself.
 */
export function hexCover(cx, cy, W = 1920, H = 1080) {
	const a = SQRT3 / 2
	let need = 0
	for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) {
		const dx = x - cx, dy = y - cy
		need = Math.max(need, Math.abs(dx), Math.abs(dx / 2 + a * dy), Math.abs(dx / 2 - a * dy))
	}
	return need / a
}
