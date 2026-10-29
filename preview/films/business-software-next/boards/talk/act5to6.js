/**
 * Act 5 and 6: two angry citizens, and trust. Sanne retypes quotes, Yusuf runs
 * leave out of his inbox, and what empowering them takes: a framework for the
 * basics, apps as configuration (describe, review, use), one manifest, one data
 * layer, the measured evidence, tailoring without forking, the honest limits,
 * and where the trust promises hold.
 *
 * Every product window is redrawn from a /screens board (named in `material`)
 * with the atoms in _lib/ui.js; labels are translated to English. No screenshots,
 * no invented UI.
 */
import { el, textBlock, measure } from '../../../_lib/stage.js'
import { C } from '../../../_lib/brand.js'
import { rect, hex, clipped, topbar, nav, panel, appTag } from '../../../_lib/ui.js'
import { statusPill as pill } from '../../../_lib/atoms/records.js'
import { ground, eyebrow, headline, body, bigNumber, statRow, cell, integration, strip, board, X, W, MONO } from './kit.js'

/* ---------- small helpers for product UI ---------- */

/** Plain UI text: Figtree, tight tracking, no clip. */
const T = (g, text, x, y, { size = 18, weight = 600, fill = C.cobalt900, family = 'Figtree', anchor = 'start', maxWidth = Infinity, lineHeight = 1.3 } = {}) =>
	textBlock(g, text, { x, y, size, weight, fill, family, anchor, tracking: -0.01, clip: false, maxWidth, lineHeight })

/** A mono code line; indentation is kept by advancing x per leading space. */
function code(g, text, x, y, { size = 20, fill = C.white } = {}) {
	const lead = text.match(/^ */)[0].length
	const cw = measure('0', { size, weight: 500, family: MONO })
	if (text.trim()) textBlock(g, text.trim(), { x: x + lead * cw, y, size, weight: 500, family: MONO, fill, tracking: 0, clip: false })
}

/**
 * A cropped app window, as the house AppMock: cobalt-900 topbar, the nav rail,
 * a page title and sub line, and the app's tag on the corner. Returns the content box.
 */
function appWin(g, { x, y, w, h, app, title, sub, navW = 150, items = 6, active = 1 }) {
	const u = 1.4, tb = 24 * u
	el('rect', { x, y: y + 12, width: w, height: h, rx: 12, fill: C.cobalt900, 'fill-opacity': 0.3 }, g)
	const c = clipped(g, x, y, w, h, 12)
	rect(c, x, y, w, h, C.white)
	topbar(c, x, y, w, u, { fill: C.cobalt900 })
	if (navW) nav(c, x, y + tb, navW, h - tb, u, { items, active })
	const cx = x + navW + 24, top = y + tb + 22
	T(c, title, cx, top + 24, { size: 26, weight: 700 })
	if (sub) T(c, sub, cx, top + 54, { size: 18, weight: 500, fill: C.cobalt400 })
	if (app) appTag(g, x, y + tb, 24, app)
	return { g: c, x: cx, y: top + (sub ? 84 : 54), w: x + w - cx - 24, r: x + w - 24, b: y + h, titleY: top + 24 }
}

/** A dialog card (the boards' modals): a cobalt-900 title bar and a white body. Returns the content box. */
function dialog(g, { x, y, w, h, title, app }) {
	el('rect', { x, y: y + 12, width: w, height: h, rx: 12, fill: C.cobalt900, 'fill-opacity': 0.3 }, g)
	const c = clipped(g, x, y, w, h, 12)
	rect(c, x, y, w, h, C.white)
	rect(c, x, y, w, 48, C.cobalt900)
	T(c, title, x + 24, y + 31, { size: 21, weight: 700, fill: C.white })
	for (let i = 0; i < 3; i++) el('circle', { cx: x + w - 28 - i * 24, cy: y + 24, r: 5, fill: C.cobalt600 }, c)
	if (app) appTag(g, x, y + 48, 22, app)
	return { g: c, x: x + 28, y: y + 48 + 34, w: w - 56, r: x + w - 28, b: y + h }
}

/** A table: cols [{ h, w (share), align }], rows of strings. Returns the y under the last row. */
function table(g, x, y, w, cols, rows, { size = 18, rowH = 30, strong = -1 } = {}) {
	let cx = x
	const pos = cols.map((c) => { const p = { x: cx, r: cx + c.w * w, align: c.align || 'start' }; cx = p.r; return p })
	cols.forEach((c, i) => T(g, c.h, pos[i].align === 'end' ? pos[i].r : pos[i].x, y, { size: size - 2, weight: 600, fill: C.cobalt400, anchor: pos[i].align }))
	rect(g, x, y + 9, w, 1.5, C.cobalt200)
	rows.forEach((r, ri) => {
		const yy = y + rowH * (ri + 1)
		if (ri) rect(g, x, yy - rowH + 10, w, 1, C.cobalt100)
		r.forEach((v, i) => T(g, v, pos[i].align === 'end' ? pos[i].r : pos[i].x, yy, { size, weight: ri === strong ? 700 : 500, anchor: pos[i].align }))
	})
	return y + rowH * rows.length + 12
}

/** Key/value rows: the key in cobalt-400, the value in cobalt-900 at x + kw. */
function kv(g, x, y, kw, pairs, { size = 18, rowH = 32, maxWidth = Infinity } = {}) {
	pairs.forEach(([k, v], i) => {
		T(g, k, x, y + i * rowH, { size, weight: 500, fill: C.cobalt400 })
		T(g, v, x + kw, y + i * rowH, { size, weight: 600, maxWidth })
	})
	return y + pairs.length * rowH
}

/** A labelled button: 'primary' (cobalt) or 'ghost' (outlined). Returns its right edge. */
function btn(g, x, y, text, kind = 'primary', { size = 17, h = 38 } = {}) {
	const w = measure(text, { size, weight: 600 }) + 36
	if (kind === 'ghost') rect(g, x, y, w, h, C.white, 6, { stroke: C.cobalt200, 'stroke-width': 1.5 })
	else rect(g, x, y, w, h, C.cobalt, 6)
	T(g, text, x + w / 2, y + h / 2 + size * 0.36, { size, fill: kind === 'ghost' ? C.cobalt : C.white, anchor: 'middle' })
	return x + w
}

/** A text field box with a placeholder. */
function field(g, x, y, w, text, { h = 40 } = {}) {
	rect(g, x, y, w, h, C.white, 6, { stroke: C.cobalt200, 'stroke-width': 1.5 })
	T(g, text, x + 14, y + h / 2 + 6, { size: 17, weight: 500, fill: C.cobalt300 })
}

/** A step pill row: ok for done steps, frozen for the current one, neutral for the rest. */
function steps(g, x, cy, items, current) {
	let px = x
	items.forEach((s, i) => {
		const p = pill(g, { x: px, cy, label: s, tone: i < current ? 'ok' : i === current ? 'frozen' : 'neutral', size: 15 })
		px = p.x + p.w + 10
		if (i < items.length - 1) { rect(g, px, cy - 1, 14, 2, C.cobalt200); px += 24 }
	})
}

/** An elbow connector (right, then down) in cobalt-300, dashed: the path a value takes by hand. */
function elbow(g, x0, y0, x1, y1, { stroke = C.cobalt300 } = {}) {
	el('path', { d: `M${x0} ${y0}H${x1}V${y1}`, fill: 'none', stroke, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '10 10' }, g)
	el('circle', { cx: x0, cy: y0, r: 7, fill: stroke }, g)
	el('path', { d: `M${x1 - 10} ${y1 - 14}L${x1} ${y1}L${x1 + 10} ${y1 - 14}`, fill: 'none', stroke, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
}

/** A cobalt-600 card with an eyebrow, a title and lines (the two-things and where-it-wins panels). */
function card(g, x, y, w, h, { eyebrow: eb, title, lines, titleSize = 44, lineSize = 28, lineGap = 46 }) {
	rect(g, x, y, w, h, C.cobalt600, 10)
	if (eb) eyebrow(g, eb, { x: x + 40, y: y + 56, size: 22 })
	T(g, title, x + 40, y + (eb ? 118 : 70), { size: titleSize, weight: 700, fill: C.white })
	lines.forEach((l, i) => T(g, l, x + 40, y + (eb ? 180 : 126) + i * lineGap, { size: lineSize, weight: 500, fill: C.cobalt100, maxWidth: w - 80 }))
}

/* ---------- the boards ---------- */

export const act5to6 = [
	board('sanne', 'Sanne retypes every quote', {
		words: 'Sanne runs a twelve-person installation company. Every accepted quote, she retypes into her bookkeeping. The hours her team logs should become the invoice. No integrator, no second platform.',
		material: 'three windows land as a staircase, quote to hours to invoice, dashed elbows between them; PqOfferte, HuUrenstaat, ShFactuurGenereren',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			const g = ctx.g
			eyebrow(g, 'Act 5 · two angry citizens', { y: 380 })
			headline(g, 'Sanne *retypes*\nevery quote.', ink)
			body(g, 'A 12-person installation company. Quote, hours and invoice live in three apps, and she is the integration.', soft, { y: 700, size: 34, maxWidth: 680 })

			// PqOfferte: the quote with its lines and total.
			const q = appWin(g, { x: 860, y: 110, w: 640, h: 250, app: 'pipelinq', title: 'Quote OFF-2026-0042', navW: 130, items: 7, active: 3 })
			pill(q.g, { x: q.r, cy: q.titleY - 8, label: 'Accepted', tone: 'ok', size: 15, anchor: 'end' })
			table(q.g, q.x, q.y, q.w, [
				{ h: 'Product', w: 0.4 }, { h: 'Qty', w: 0.12, align: 'end' }, { h: 'Unit price', w: 0.23, align: 'end' }, { h: 'Line total', w: 0.25, align: 'end' },
			], [
				['Website, basic package', '1', '€ 2,400.00', '€ 2,400.00'],
				['Hosting, per month', '12', '€ 35.00', '€ 378.00'],
				['Total incl. 21% VAT', '', '', '€ 5,357.88'],
			], { size: 17, rowH: 30, strong: 2 })

			// HuUrenstaat: the week's timesheet.
			const t = appWin(g, { x: 1070, y: 400, w: 640, h: 250, app: 'humaniq', title: 'Timesheet week 41', navW: 130, items: 7, active: 2 })
			pill(t.g, { x: t.r, cy: t.titleY - 8, label: 'Draft', tone: 'neutral', size: 15, anchor: 'end' })
			table(t.g, t.x, t.y, t.w, [
				{ h: 'Case or project', w: 0.5 }, { h: 'Mon', w: 0.11, align: 'end' }, { h: 'Tue', w: 0.11, align: 'end' }, { h: 'Wed', w: 0.11, align: 'end' }, { h: 'Total', w: 0.17, align: 'end' },
			], [
				['Case 2026-0082, path lighting', '4', '3.5', '4', '11.5'],
				['Project Environment Act', '2.5', '3', '2.5', '14'],
				['Total per day', '6.5', '6.5', '6.5', '38.5'],
			], { size: 17, rowH: 30, strong: 2 })

			// ShFactuurGenereren: step 2, the hours that become the invoice.
			const f = appWin(g, { x: 1250, y: 690, w: 640, h: 240, app: 'shillinq', title: 'Generate invoices · step 2 of 3', navW: 130, items: 7, active: 1 })
			table(f.g, f.x, f.y, Math.min(f.w, 1800 - f.x), [
				{ h: 'Employee', w: 0.36 }, { h: 'Hours', w: 0.16, align: 'end' }, { h: 'Rate', w: 0.22, align: 'end' }, { h: 'Amount', w: 0.26, align: 'end' },
			], [
				['Joost Hendriks', '12.0', '€ 125.00', '€ 1,500.00'],
				['Fleur Bakker', '24.0', '€ 115.00', '€ 2,760.00'],
				['Ahmed Yilmaz', '36.0', '€ 95.00', '€ 3,420.00'],
			], { size: 17, rowH: 30 })

			// The hand-typed path from one window to the next.
			elbow(g, 1500, 235, 1560, 398)
			elbow(g, 1710, 525, 1770, 688)
		},
	}),

	board('yusuf', 'Yusuf runs leave out of his inbox', {
		words: 'Yusuf is an HR advisor at a municipality. Leave requests arrive by email and land in a spreadsheet. He wants to build the app by describing it. Next to Files and Mail, under the same login.',
		material: 'the leave request slides in, the department calendar lands in front of it; HuVerlofaanvraag, HuVerlofkalender',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'light')
			const g = ctx.g
			eyebrow(g, 'Act 5 · two angry citizens', { y: 380, fill: C.cobalt400 })
			headline(g, 'Yusuf runs leave\nout of his *inbox*.', ink)
			body(g, 'An HR advisor at a municipality. Requests arrive by email and land in a spreadsheet. This is what he wants instead.', soft, { y: 700, size: 34, maxWidth: 680 })

			// HuVerlofaanvraag: one request, its steps, the calculation and the HR decision.
			const r = appWin(g, { x: 880, y: 120, w: 700, h: 440, app: 'humaniq', title: 'Leave request VA-2026-0398', sub: 'Ilse van Dam · holiday leave · 21 to 23 October', navW: 150, items: 7, active: 2 })
			pill(r.g, { x: r.r, cy: r.titleY - 8, label: 'Waiting for HR', tone: 'frozen', size: 15, anchor: 'end' })
			steps(r.g, r.x, r.y - 6, ['Submitted', 'Manager', 'HR', 'Approved'], 2)
			kv(r.g, r.x, r.y + 46, 170, [
				['Leave type', 'Holiday leave, statutory first'],
				['From', 'Wednesday 21 October 2026'],
				['To', 'Friday 23 October 2026'],
				['Requested', '3 calendar days'],
				['Costs', '24.0 hours, from the work pattern'],
				['Reason', 'Family visit'],
			], { size: 17, rowH: 30 })
			const bx = btn(r.g, r.x, r.b - 60, 'Reject', 'ghost')
			btn(r.g, bx + 12, r.b - 60, 'Approve as HR')

			// HuVerlofkalender: the department's October, with the minimum staffing.
			const k = appWin(g, { x: 1120, y: 580, w: 820, h: 350, app: 'humaniq', title: 'Leave calendar, Public services', sub: 'October 2026 · 9 staff · minimum 7 per working day', navW: 150, items: 7, active: 2 })
			const days = ['12', '13', '14', '15', '16', '19', '20', '21', '22', '23']
			const names = ['I. van Dam', 'M. el Amrani', 'J. Verbeek', 'K. Hoogendoorn', 'A. Smit', 'R. Jacobs']
			const off = { '1,0': 1, '1,1': 1, '0,7': 2, '0,8': 2, '0,9': 2, '3,3': 1, '3,4': 1, '5,2': 3, '5,7': 1, '5,8': 1 }
			const present = ['8', '9', '8', '8', '7', '8', '7', '6', '6', '8']
			const dx = k.x + 150, cw = 26, rh = 24
			days.forEach((d, i) => T(k.g, d, dx + i * cw + cw / 2, k.y - 4, { size: 14, weight: 600, fill: C.cobalt400, anchor: 'middle' }))
			names.forEach((n, ri) => {
				const yy = k.y + 8 + ri * rh
				T(k.g, n, k.x, yy + 17, { size: 15, weight: 500 })
				days.forEach((_, ci) => {
					const kind = off[`${ri},${ci}`]
					const fill = kind === 1 ? C.cobalt : kind === 2 ? C.cobalt200 : kind === 3 ? C.cobalt400 : C.cobalt50
					rect(k.g, dx + ci * cw + 2, yy, cw - 4, rh - 4, fill, 3)
				})
			})
			const py = k.y + 8 + names.length * rh + 6
			T(k.g, 'Present, minimum 7', k.x, py + 17, { size: 15, weight: 600 })
			present.forEach((p, ci) => {
				const low = Number(p) < 7
				if (low) rect(k.g, dx + ci * cw + 2, py, cw - 4, rh - 4, C.cobalt700, 3)
				T(k.g, p, dx + ci * cw + cw / 2, py + 17, { size: 14, weight: 700, fill: low ? C.white : C.cobalt900, anchor: 'middle' })
			})
			const lg = py + rh + 14
			;[['Approved leave', C.cobalt], ['Requested', C.cobalt200], ['Absent', C.cobalt400], ['Below minimum', C.cobalt700]].forEach(([l, c], i) => {
				const lx = k.x + i * 125
				rect(k.g, lx, lg, 14, 14, c, 3)
				T(k.g, l, lx + 22, lg + 12, { size: 14, weight: 500, fill: C.cobalt400 })
			})
		},
	}),

	board('two-things', 'Empowering them takes two things', {
		words: 'Both know what they need. Both could describe it in five minutes. So why don\'t they? Empowering them takes two things. Trust, so they can start. A store, so it is worth finishing.',
		material: 'kinetic type; two cards rise, left then right, their lines on the beat',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			const g = ctx.g
			eyebrow(g, 'What empowering them takes', { y: 170 })
			headline(g, 'Empowering them takes *two* things.', ink, { y: 280, size: 84, wide: true })
			card(g, 120, 380, 800, 440, {
				eyebrow: '03 · so they can start', title: 'Trust and security',
				lines: ['A framework for the basics, so no app gets them wrong.', 'Apps as configuration, not code.', 'So an AI can build an app safely.', 'And IT dares to say yes.'], lineSize: 26,
			})
			card(g, 960, 380, 840, 440, {
				eyebrow: '04 · so it is worth finishing', title: 'A platform and a store',
				lines: ['Organisations can actually find the apps.', 'One good app gets reused, not rebuilt.', 'Developers get paid for what they make.', 'And the people with the idea get a stake.'], lineSize: 26,
			})
			body(g, 'Trust lets them start. The store makes it worth finishing.', soft, { y: 900, size: 34, maxWidth: 1600 })
		},
	}),

	board('section-03', '03 · Trust and security', {
		words: 'First: trust. IT will only say yes when a citizen-built app cannot break the basics.',
		material: 'section card; the number counts up to 03, the title cuts in, the lede rises',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			const g = ctx.g
			bigNumber(g, '03', { x: X, y: 420, size: 240, accent: true })
			headline(g, 'Trust and security.', ink, { y: 600, size: 112, wide: true })
			body(g, 'IT will only say yes when a citizen-built app cannot break the basics.', soft, { y: 700, size: 40, maxWidth: 1240 })
		},
	}),

	board('framework-basics', 'The basics come from the framework', {
		words: 'So take the basics out of the app. Login, permissions and the audit trail come from the workspace. Every write is validated twice. Lists and forms are shared components. Fix one, and all 21 apps get the fix.',
		material: 'three workspace layers stack up from the bottom, then the small citizen app lands on top; NcLogin, BqRechtenBeheren (permissions dialog), OrAuditTrails',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'light')
			const g = ctx.g
			eyebrow(g, 'Trust · a framework for the basics', { y: 200, fill: C.cobalt400 })
			headline(g, 'The basics come\nfrom the *framework*,\nnot from each app.', ink, { y: 400 })
			body(g, 'Built once, tested once. Every write is validated in the form and again in the API. Lists and forms are shared components. A security fix reaches every app at once.', soft, { y: 700, size: 30, maxWidth: 660 })

			const lx = 900, lw = 980
			// The citizen-built app on top: small, because it carries almost nothing itself.
			const a = appWin(g, { x: 1140, y: 100, w: 500, h: 170, app: 'humaniq', title: 'Leave requests', sub: 'built by Yusuf · 5 pages, 3 schemas, 0 lines of code', navW: 0 })
			;[0.7, 0.5, 0.6].forEach((f, i) => rect(a.g, a.x, a.y - 8 + i * 18, a.w * f, 8, C.cobalt100, 4))
			const layer = (y, label) => { panel(g, lx, y, lw, 190, 2, { stroke: C.cobalt200, r: 6 }); eyebrow(g, label, { x: lx + 28, y: y + 38, size: 18, fill: C.cobalt400 }); return y }
			const gapLine = (y0, y1) => rect(g, 1388, y0, 4, y1 - y0, C.cobalt200)
			gapLine(270, 290)

			// NcLogin: the workspace login.
			let y = layer(290, 'From the workspace · login')
			T(g, 'Log in to the workspace', lx + 28, y + 80, { size: 24, weight: 700 })
			T(g, 'For staff of Zuiddrecht municipality', lx + 28, y + 108, { size: 17, weight: 500, fill: C.cobalt400 })
			btn(g, lx + 28, y + 130, 'Log in with your municipal account')
			field(g, lx + 520, y + 74, 420, 'Username or email')
			field(g, lx + 520, y + 124, 420, 'Password')
			gapLine(480, 500)

			// BqRechtenBeheren: the permissions dialog, groups per role.
			y = layer(500, 'From the workspace · permissions')
			T(g, 'Permissions · who may view, edit or manage this app', lx + 28, y + 80, { size: 24, weight: 700 })
			;[['Owners (full control)', ['admin', 'Functional management']], ['Editors (can save drafts)', ['KCC team leads', 'Information management']], ['Readers (read only)', ['KCC staff']]].forEach(([h, groups], i) => {
				const cx = lx + 28 + i * 320
				T(g, h, cx, y + 118, { size: 16, weight: 600, fill: C.cobalt400 })
				let px = cx
				groups.forEach((gr) => { const p = pill(g, { x: px, cy: y + 152, label: gr, tone: 'neutral', size: 15 }); px = p.x + p.w + 8 })
			})
			gapLine(690, 710)

			// OrAuditTrails: every change, read and admin action, hash-chained.
			y = layer(710, 'From the workspace · audit trail')
			T(g, 'Audit trails · 48,211 rows · hash chain verified, last check today 08:00', lx + 28, y + 80, { size: 22, weight: 700 })
			table(g, lx + 28, y + 110, lw - 56, [
				{ h: 'Time', w: 0.08 }, { h: 'User', w: 0.2 }, { h: 'Action', w: 0.16 }, { h: 'Record or setting', w: 0.56 },
			], [
				['10:12', 'Anouk Bakker', 'Changed', 'MOR-2026-04812 · category: Sewerage to Paving'],
				['09:31', 'Sanne Visser', 'Admin action', 'Role Handler got write access on Report'],
			], { size: 16, rowH: 26 })
		},
	}),

	board('describe-review-use', 'Describe it, review the change, use it', {
		words: 'The app is not code. It is one file that says what the app is. You describe it. You review the change and approve it. Then it appears next to Files and Mail, with your permissions, logged.',
		material: 'stands in for the live demo: three Buildiq dialogs cut in left to right on the beat; BqGenererenMetAI, BqNieuweAppControleren, BqApp',
		draw(ctx) {
			const { ink } = ground(ctx)
			const g = ctx.g
			eyebrow(g, 'Trust · apps as configuration · Buildiq', { y: 170 })
			headline(g, 'An app is *data*, so anyone who\ncan edit data can build one.', ink, { y: 270, size: 80, wide: true })
			const ys = 440, hs = 490, ws = 520
			const xs = [120, 700, 1280]
			;['1 · Describe it', '2 · Review the change', '3 · Use it'].forEach((s, i) => eyebrow(g, s, { x: xs[i], y: ys - 22, size: 22, fill: C.cobalt200 }))

			// BqGenererenMetAI: describe the app in two sentences, get a proposal.
			const d = dialog(g, { x: xs[0], y: ys, w: ws, h: hs, title: 'Generate an app with AI', app: 'buildiq' })
			T(d.g, 'Describe your app', d.x, d.y, { size: 16, weight: 600, fill: C.cobalt400 })
			rect(d.g, d.x, d.y + 12, d.w, 112, C.cobalt50, 6, { stroke: C.cobalt200, 'stroke-width': 1.5 })
			T(d.g, 'A desk where associations apply for grants. A staff member assesses the application, asks for documents if needed and decides on an amount.', d.x + 14, d.y + 38, { size: 16, weight: 500, maxWidth: d.w - 28, lineHeight: 1.4 })
			T(d.g, 'Proposal · made in 9 seconds', d.x, d.y + 160, { size: 18, weight: 700 })
			kv(d.g, d.x, d.y + 194, 96, [
				['Schemas', 'application (12 fields), association (8), assessment (6), decision (5)'],
				['Pages', 'Applications list, Application detail, New application form, Associations list, Dashboard'],
				['Menu', 'Dashboard, Applications, Associations'],
			], { size: 16, rowH: 54, maxWidth: d.w - 96 })
			const b1 = btn(d.g, d.x, d.b - 62, 'Regenerate', 'ghost')
			btn(d.g, b1 + 12, d.b - 62, 'Create app')

			// BqNieuweAppControleren: step 4 of 4, review and create.
			const r = dialog(g, { x: xs[1], y: ys, w: ws, h: hs, title: 'New app · step 4 of 4 · Review and create', app: 'buildiq' })
			T(r.g, 'Create makes the app, one register per version and the default schemas in one go.', r.x, r.y, { size: 15, weight: 500, fill: C.cobalt400, maxWidth: r.w })
			kv(r.g, r.x, r.y + 52, 130, [
				['Name', 'Grant desk'],
				['Slug', 'grant-desk'],
				['Description', 'Grant applications, assessed and decided.'],
				['Icon', 'light and dark'],
			], { size: 16, rowH: 34, maxWidth: r.w - 130 })
			T(r.g, 'Version chain', r.x, r.y + 236, { size: 16, weight: 500, fill: C.cobalt400 })
			steps(r.g, r.x, r.y + 266, ['Development', 'Acceptance', 'Production'], 3)
			kv(r.g, r.x, r.y + 312, 130, [['Registers', '4, one per version'], ['Owner', 'you; group permissions afterwards']], { size: 16, rowH: 30 })
			const b2 = btn(r.g, r.x, r.b - 62, 'Back', 'ghost')
			btn(r.g, b2 + 12, r.b - 62, 'Create app')

			// BqApp: the app page, next to Files and Mail, with permissions and an audit count.
			const u = appWin(g, { x: xs[2], y: ys, w: ws, h: hs, app: 'buildiq', title: 'Grant desk', sub: 'Apps / grant-desk · version 0.1.0 in production', navW: 0 })
			let px = u.r
			;[['Owner', 'neutral'], ['Published', 'ok'], ['Virtual', 'neutral']].forEach(([l, tone]) => { const p = pill(u.g, { x: px, cy: u.titleY - 8, label: l, tone, size: 14, anchor: 'end' }); px = p.x - 8 })
			;[['Pages', '5'], ['Schemas', '4'], ['Menu', '3'], ['Versions', '1']].forEach(([l, v], i) => {
				const sx = u.x + i * 118
				T(u.g, v, sx, u.y + 30, { size: 34, weight: 500, family: MONO })
				T(u.g, l, sx, u.y + 54, { size: 14, weight: 600, fill: C.cobalt400 })
			})
			rect(u.g, u.x, u.y + 76, u.w, 1.5, C.cobalt100)
			T(u.g, 'Usage, last 30 days', u.x, u.y + 108, { size: 16, weight: 700 })
			kv(u.g, u.x, u.y + 136, 150, [['Active users', '12'], ['Objects', '48'], ['Audit rows', '312, every step logged']], { size: 16, rowH: 28 })
			T(u.g, 'Groups and users', u.x, u.y + 246, { size: 16, weight: 700 })
			kv(u.g, u.x, u.y + 274, 150, [['Owner', 'admin'], ['Editor', 'Grants team'], ['Reader', 'Associations desk']], { size: 16, rowH: 28 })
			btn(u.g, u.r - measure('Open app', { size: 17, weight: 600 }) - 36, u.b - 62, 'Open app')
		},
	}),

	board('manifest', 'A whole app in one file', {
		words: 'This is a whole app in one file. Only the schema and the version are required. Pages are a grid of widgets, and each widget binds to the API. A typo fails validation, not production.',
		material: 'the manifest types in line by line; the grid fills with four widgets, then the arrows to the API draw on; slide "src/manifest.json" and slide "Pages"',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'white')
			const g = ctx.g
			eyebrow(g, 'Manifesting · src/manifest.json', { y: 200, fill: C.cobalt400 })
			headline(g, 'A whole app\nin one *file*.', ink)
			body(g, 'Two keys are required. The rest renders, onboards and runs the app. A typo is a validation error, not a blank page in production.', soft, { y: 700, size: 30, maxWidth: 640 })

			// The code panel: the top level of a manifest.
			const px = 870, py = 120, pw = 630, ph = 810
			rect(g, px, py, pw, ph, C.cobalt900, 12)
			eyebrow(g, 'src/manifest.json', { x: px + 28, y: py + 46, size: 16, fill: C.cobalt300 })
			const K = C.cobalt200, V = C.white
			const lines = [
				['{', V], ['  "$schema": ".../app-manifest-v2.schema.json",', K, 'required'], ['  "version": "1.4.0",', K, 'required'], ['  "dependencies": [ ... ],', K],
				['', V], ['  "menu":  [ ... ],', K, 'render'], ['  "pages": [ ... ],', K, 'render'],
				['', V], ['  "setup":       { ... },', K, 'onboard'], ['  "walkthrough": { ... },', K, 'onboard'],
				['', V], ['  "adminSettings": [ ... ],', K, 'run'], ['  "schedules":     [ ... ]', K, 'run'], ['}', V],
			]
			lines.forEach(([txt, fill, tag], i) => {
				const ly = py + 100 + i * 40
				code(g, txt, px + 28, ly, { size: 20, fill })
				if (tag && (i === 2 || i === 6 || i === 9 || i === 12)) eyebrow(g, tag, { x: px + pw - 28, y: ly, size: 15, fill: C.cobalt400, anchor: 'end' })
			})
			T(g, 'Validated against a JSON Schema before anything renders. The schema is at version 2.33.', px + 28, py + ph - 72, { size: 17, weight: 500, fill: C.cobalt300, maxWidth: pw - 56 })

			// Pages: components on a 12-column grid, bound to the API.
			const gx = 1540, gy = 120, gw = 340
			panel(g, gx, gy, gw, 470, 2, { stroke: C.cobalt200, r: 6 })
			T(g, 'Components on a grid,\nbound to the API', gx + 24, gy + 44, { size: 22, weight: 700, lineHeight: 1.2 })
			T(g, '12 columns · 46 widgets', gx + 24, gy + 112, { size: 15, weight: 500, fill: C.cobalt400 })
			const cols = 12, cw = (gw - 48) / cols, g0 = gy + 136
			for (let i = 0; i < cols; i++) rect(g, gx + 24 + i * cw + 2, g0, cw - 4, 310, C.cobalt50, 2)
			const widget = (c0, span, y, h, label) => {
				rect(g, gx + 24 + c0 * cw + 2, y, span * cw - 4, h, C.cobalt100, 4, { stroke: C.cobalt200, 'stroke-width': 1.5 })
				T(g, label, gx + 24 + (c0 + span / 2) * cw, y + h / 2 + 6, { size: 16, weight: 600, fill: C.cobalt700, anchor: 'middle' })
			}
			widget(0, 8, g0 + 10, 110, 'table')
			widget(8, 4, g0 + 10, 110, 'detail')
			widget(0, 5, g0 + 134, 100, 'chart')
			widget(5, 7, g0 + 134, 160, 'form')
			// Two arrows down and up between the grid and the API.
			const ax = gx + gw / 2
			;[-14, 14].forEach((o, i) => {
				const x = ax + o, y0 = gy + 470 + 16, y1 = gy + 470 + 86
				rect(g, x - 2, y0, 4, y1 - y0, C.cobalt400)
				const tip = i === 0 ? y1 : y0
				const dir = i === 0 ? -12 : 12
				el('path', { d: `M${x - 9} ${tip + dir}L${x} ${tip}L${x + 9} ${tip + dir}`, fill: 'none', stroke: C.cobalt400, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g)
			})
			rect(g, gx, gy + 574, gw, 72, C.cobalt, 8)
			appTag(g, gx + 40, gy + 610, 22, 'openregister', { ringW: 4 })
			T(g, 'OpenRegister API', gx + 76, gy + 618, { size: 22, weight: 700, fill: C.white })
			T(g, 'A table is told which register and schema to show, and fetches, sorts and filters by itself. Plain CRUD needs no controller.', gx, gy + 686, { size: 17, weight: 500, fill: C.cobalt400, maxWidth: gw, lineHeight: 1.35 })
		},
	}),

	board('one-data-layer', 'Shared objects mean apps don\'t need integrating', {
		words: 'One schema builds the storage and the logic. And every app reads and writes the same objects. The project app logs hours, bookkeeping invoices them. Nothing to integrate.',
		material: 'five app cells light up, the object band draws through, the leaves land below; slide "One data layer"',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			const g = ctx.g
			eyebrow(g, 'Backend · one data layer · one schema builds the storage and the logic', { y: 170 })
			headline(g, 'Shared objects mean apps\ndon\'t need *integrating*.', ink, { y: 270, size: 88, wide: true })
			const apps = ['CRM', 'ERP', 'Booking', 'Project', 'Bookkeeping']
			const ax = apps.map((_, i) => 400 + i * 280)
			ax.forEach((x, i) => { rect(g, x - 2, 580, 4, 64, C.cobalt400); cell(g, x, 520, 66, apps[i], { size: 24 }) })
			strip(g, 'Contact · Hours · Document · Case · ...', { y: 644, h: 84, lead: 'every app reads and writes the same objects', size: 30 })
			const leaves = [['xwiki', 'XWiki', 'knowledge'], ['openproject', 'OpenProject', 'projects'], ['files', 'Files', 'documents'], ['calendar', 'Calendar', 'events'], [null, 'Deck', 'tasks']]
			leaves.forEach(([id, name, what], i) => {
				const x = ax[i], cy = 812
				rect(g, x - 2, 728, 4, 40, C.cobalt400)
				if (id) { cell(g, x, cy, 46, '', { fill: C.white }); integration(g, id, x - 26, cy - 26, 52) } else cell(g, x, cy, 46, name, { fill: C.cobalt600, size: 22 })
				T(g, `${name} · ${what}`, x, 898, { size: 22, weight: 600, fill: soft, anchor: 'middle' })
			})
		},
	}),

	board('evidence', 'Same pages, a fraction of the code', {
		words: 'These are real commits. Pipelinq lost 1,742 lines of Vue for 178 lines of manifest. Larpinq lost its whole app shell. Measured in September.',
		material: 'counters count down from 0 to the negative numbers; slide "Evidence", real migration commits',
		draw(ctx) {
			const { ink } = ground(ctx)
			eyebrow(ctx.g, 'Evidence · measured September 2026 · real migration commits, not estimates', { y: 200 })
			headline(ctx.g, 'Same pages,\na fraction of the code.', ink, { y: 320, size: 96 })
			statRow(ctx.g, [
				{ value: '−1,742', label: 'lines of Vue, Pipelinq', sub: 'Client and contact pages, now 178 lines of manifest.', accent: true },
				{ value: '−1,901', label: 'lines of Vue, Larpinq', sub: 'The whole app shell, now 288 lines. The app has 6 .vue files left.' },
				{ value: '−541', label: 'lines of Vue, Stackiq', sub: 'One organisations list, now 16 lines of manifest.' },
			], ink, { y: 700, size: 150 })
		},
	}),

	board('common-core', 'Tailor any app, keep a common core', {
		words: 'The same works for apps that already exist. An admin adds a field and saves. We store only the difference. When version two arrives, your changes land on top again.',
		material: 'the base lands first, the admin layer and your layer stack on it, then the result strip; BqManifestlagen, BqEigenLaagBewerken',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'light')
			const g = ctx.g
			eyebrow(g, 'Tailor without forking · Buildiq layers', { y: 200, fill: C.cobalt400 })
			headline(g, 'Tailor any app,\nkeep a *common* core.', ink)
			body(g, 'An admin adds a field or a page and saves. Only the difference is stored. When version two arrives from the store, it lands on top again.', soft, { y: 700, size: 30, maxWidth: 660 })

			const lx = 900, lw = 900
			const layerCard = (y, h, eb, title, status, tone) => {
				panel(g, lx, y, lw, h, 2, { stroke: C.cobalt200, r: 6 })
				eyebrow(g, eb, { x: lx + 28, y: y + 38, size: 17, fill: C.cobalt400 })
				T(g, title, lx + 28, y + 76, { size: 24, weight: 700 })
				pill(g, { x: lx + lw - 28, cy: y + 66, label: status, tone, size: 15, anchor: 'end' })
			}
			const sign = (y, s) => textBlock(g, s, { x: 1350, y, size: 44, weight: 500, family: MONO, fill: C.cobalt400, anchor: 'middle', clip: false })

			// BqEigenLaagBewerken: your layer, the difference as JSON.
			layerCard(130, 220, '3 · your layer · made by users · stored as the difference', 'Pipelinq, your adjustment', 'Valid JSON, 2 changes', 'ok')
			;['{ "pages": { "Tickets": { "config": {', '    "columns": ["title", "status", "assignee", "deadline"],', '    "defaultView": "board" } } },', '  "menu": { "hide": ["Leads"] } }'].forEach((l, i) => code(g, l, lx + 28, 130 + 118 + i * 26, { size: 17, fill: C.cobalt700 }))
			sign(386, '+')
			// BqManifestlagen: the admin layer for the whole municipality.
			layerCard(394, 180, '2 · admin layer · made by admins · shared, version 1.1.0', 'Admin layer', 'Published', 'neutral')
			T(g, '14 pages changed, 3 added, menu rearranged. Draft 1.1.1 has 6 changes that are not live yet.', lx + 28, 394 + 118, { size: 17, weight: 500, fill: C.cobalt400, maxWidth: lw - 56 })
			sign(610, '+')
			// BqManifestlagen: the base, read only, from the app store.
			layerCard(618, 140, '1 · base · from the app store · common core', 'pipelinq 0.5.7 · 53 pages, 28 menu items, 131 schemas', 'Read only', 'frozen')
			T(g, 'An update replaces this layer; your layers stay.', lx + 28, 618 + 112, { size: 17, weight: 500, fill: C.cobalt400 })
			sign(800, '=')
			strip(g, 'keeps receiving updates · no fork to maintain', { x: lx, y: 814, w: lw, h: 76, fill: C.cobalt, lead: 'your app', size: 28 })
		},
	}),

	board('honest-limits', 'Where it stops, honestly', {
		words: 'Where it stops, honestly. Kanban boards, checkouts and wizards are still code. Our own CRM has 53 custom pages out of 104. One rule: that number may only go down.',
		material: 'four strips slide in; the 53 counts up and stays; slide "Honest limits"',
		draw(ctx) {
			const { ink } = ground(ctx)
			const g = ctx.g
			eyebrow(g, 'Honest limits', { y: 200 })
			headline(g, 'Where it stops, *honestly*.', ink, { y: 330, size: 112, wide: true })
			;[
				['still code', 'Kanban boards, checkout screens and wizards are still custom code.'],
				['our own crm', 'Pipelinq still has 53 custom pages out of 104.'],
				['stays php', 'Integrations and heavy business logic stay in PHP.'],
				['one rule', 'The number of custom pages per app may only go down.'],
			].forEach(([lead, text], i) => strip(g, text, { y: 440 + i * 104, w: 1140, lead, size: 27, fill: i === 3 ? C.cobalt700 : C.cobalt600 }))
			bigNumber(g, '53', { x: 1400, y: 650, size: 220, fill: ink })
			eyebrow(g, 'custom pages out of 104', { x: 1400, y: 712, fill: C.cobalt200, size: 24 })
			body(g, 'Not a success story yet. Custom pages must explain themselves.', C.cobalt300, { x: 1400, y: 770, size: 28, maxWidth: 400 })
		},
	}),

	board('where-it-wins', 'Where it wins: the trust promises hold', {
		words: 'So where it wins: the trust promises hold. The framework handles the basics. Apps are configuration. An AI writes a manifest, and a wrong one fails before it runs. IT can say yes.',
		material: 'four cards rise in reading order, a white hex lights on each as it is kept; slide "Where it wins"',
		draw(ctx) {
			const { ink } = ground(ctx)
			const g = ctx.g
			eyebrow(g, 'Where it wins · back to trust and security', { y: 170 })
			headline(g, 'The trust promises *hold*.', ink, { y: 280, size: 96, wide: true })
			const items = [
				['The framework handles the basics.', 'Login, permissions and the audit trail come from the workspace, in every app.'],
				['Apps are configuration, not code.', 'Client and contact pages went from 1,742 lines of Vue to 178 lines of manifest.'],
				['An AI can build an app safely.', 'It writes a manifest, and a wrong manifest fails validation before anything runs.'],
				['IT can say yes.', 'A security fix in the framework reaches every app at once.'],
			]
			items.forEach(([title, text], i) => {
				const x = 120 + (i % 2) * 860, y = 380 + Math.floor(i / 2) * 270, w = 820, h = 240
				rect(g, x, y, w, h, C.cobalt600, 10)
				hex(g, x + 54, y + 60, 16, C.white, 2)
				T(g, title, x + 90, y + 72, { size: 34, weight: 700, fill: C.white })
				T(g, text, x + 40, y + 134, { size: 27, weight: 500, fill: C.cobalt100, maxWidth: w - 80, lineHeight: 1.35 })
			})
		},
	}),
]
