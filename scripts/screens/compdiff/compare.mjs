import { parseColour } from './colour.mjs'
import { pageComponent } from './pagebg.mjs'

// Pairing and property comparison for compdiff. Pure functions over the extractor's output.

// Backgrounds use a tighter colour threshold: the work-ground grey #f5f6f8 against white is a channel delta of 10.
export const THRESHOLDS = { spacing: 2, font: 0.5, size: 8, color: 12, background: 4, weight: 100 }

const CARDLIKE = new Set(['card', 'dialog-card', 'dialog'])
const group = (c) => (CARDLIKE.has(c.role) ? 'card' : c.role)

export function norm (s) {
	return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[0-9]+/g, ' ').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim()
}
const tokens = (s) => new Set(norm(s).split(' ').filter((t) => t.length > 1))
function titleSimilarity (a, b) {
	const na = norm(a), nb = norm(b)
	if (!na || !nb) return 0
	if (na === nb) return 1
	if ((na.length >= 4 && nb.includes(na)) || (nb.length >= 4 && na.includes(nb))) return 0.8
	const ta = tokens(a), tb = tokens(b)
	const inter = [...ta].filter((t) => tb.has(t)).length
	return inter / (ta.size + tb.size - inter || 1)
}
const TITLED = (c) => CARDLIKE.has(c.role) && c.title

export function pairComponents (board, live, H) {
	// Every card pairs, including each card of a deck (a column of same-width widgets is a deck too). Only the cards
	// past a deck's first that find no counterpart are left out: how many cards a deck holds follows the data.
	const pairs = []
	const usedB = new Set(), usedL = new Set()
	const take = (b, l, by) => { usedB.add(b); usedL.add(l); pairs.push({ board: b, live: l, by, name: b.title && b.role !== 'tabs' && b.role !== 'table' && b.role !== 'toolbar' && b.role !== 'pager' && b.role !== 'map' ? b.title : `${b.role}@${Math.round(b.rect.x)},${Math.round(b.rect.y)}` }) }
	const pos = (b, l) => {
		const cx = (r) => r.x + r.w / 2
		// A popup's nesting follows where the library mounts it (NcActions teleports its menu out of the panel), not the
		// page, so two popups are not kept apart by their depth.
		const depth = b.popup && l.popup ? 0 : Math.abs((b.depth || 0) - (l.depth || 0))
		return Math.abs(cx(b.rect) - cx(l.rect)) / 1440 + 0.5 * Math.abs(b.rect.y - l.rect.y) / H + Math.abs(b.rect.w - l.rect.w) / 1440 + 0.2 * depth
	}
	// 1. The page header pairs with the page header.
	const bh = board.find((c) => c.role === 'pageHeader'), lh = live.find((c) => c.role === 'pageHeader')
	if (bh && lh) take(bh, lh, 'role')
	// A lone pager pairs with the lone pager: it sits under a list whose length follows the data.
	const bp = board.filter((c) => c.role === 'pager'), lp = live.filter((c) => c.role === 'pager')
	if (bp.length === 1 && lp.length === 1) take(bp[0], lp[0], 'role')
	// 2. Title text, exact then fuzzy; ties broken by position.
	for (const minSim of [1, 0.5]) {
		const cand = []
		for (const b of board) {
			if (usedB.has(b) || !TITLED(b)) continue
			for (const l of live) {
				if (usedL.has(l) || !TITLED(l) || group(b) !== group(l)) continue
				// The same title in another column is another widget (a side panel's "Alle zaken" against the page's).
				const overlap = Math.min(b.rect.x + b.rect.w, l.rect.x + l.rect.w) - Math.max(b.rect.x, l.rect.x)
				if (overlap <= 0) continue
				const s = titleSimilarity(b.title, l.title)
				if (s >= minSim) cand.push({ b, l, cost: (1 - s) + pos(b, l) })
			}
		}
		cand.sort((x, y) => x.cost - y.cost)
		for (const { b, l } of cand) if (!usedB.has(b) && !usedL.has(l)) take(b, l, minSim === 1 ? 'title' : 'title~')
	}
	// 3. Role and position for the rest. A titled component only pairs by position with an untitled one or a
	// near neighbour, so two different widgets are not compared as one.
	const cand = []
	for (const b of board) {
		if (usedB.has(b)) continue
		for (const l of live) {
			if (usedL.has(l) || group(b) !== group(l)) continue
			// A toolbar starts where the row starts; how far it reaches follows what the row holds, so its width and centre
			// do not keep it from its counterpart on the same line.
			if (b.role === 'toolbar' && Math.abs(b.rect.y - l.rect.y) > 24 && Math.abs(b.rect.w - l.rect.w) > 8) continue
			let cost = b.role === 'toolbar' && Math.abs(b.rect.y - l.rect.y) <= 24 ? Math.abs(b.rect.x - l.rect.x) / 1440 + 0.5 * Math.abs(b.rect.y - l.rect.y) / H : pos(b, l)
			if (!!b.record !== !!l.record) cost += 0.15
			// An open menu is not the row it opened from: a popup pairs by position only with a popup.
			if (!!b.popup !== !!l.popup) continue
			// A table in a titled card is that card's table: it pairs with a table in a card of the same title.
			// Two cards of one family ("StUF-ZKN-endpoints", "StUF-ZKN-auditlog") share words, not a title.
			if (b.role === 'table' && b.inCard && l.inCard && titleSimilarity(b.inCard, l.inCard) < 0.8) continue
			// Tables whose columns share no name are two tables (one missing on a side), however they sit in order.
			if (b.role === 'table' && b.headText && l.headText) {
				const sim = titleSimilarity(b.headText, l.headText)
				if (sim < 0.2) continue
				cost += (1 - sim) * 0.1
			}
			if (b.title && l.title && CARDLIKE.has(b.role)) cost += 0.12
			// Two cards with different titles are a pair only as near neighbours or in the same grid slot (a board column
			// titled by its data); a titled card and an untitled one only within a card's height of each other.
			if (CARDLIKE.has(b.role) && (b.title || l.title)) {
				const dy = Math.abs(b.rect.y - l.rect.y)
				const slot = Math.abs(b.rect.x - l.rect.x) <= 4 && Math.abs(b.rect.w - l.rect.w) <= 2
				if (b.title && l.title ? dy > 48 && !slot : dy > Math.max(48, b.rect.h, l.rect.h)) continue
			}
			if (cost <= 0.2) cand.push({ b, l, cost })
		}
	}
	cand.sort((x, y) => x.cost - y.cost)
	for (const { b, l } of cand) if (!usedB.has(b) && !usedL.has(l)) take(b, l, 'position')
	// A component that starts below the captured frame is measured only as a counterpart: unpaired, it is not counted.
	const counted = (c) => (!c.record || c.record.index === 0) && !c.belowFrame
	// An untitled card that only frames a paired table (and its pager) is that table's frame: one side may draw the
	// frame as a card, the other as the table's own border. It is neither missing nor extra.
	const hugs = (o, i) => i.x >= o.x - 4 && i.x + i.w <= o.x + o.w + 4 && i.y >= o.y - 4 && i.y + i.h <= o.y + o.h + 4
	const frameOnly = (c, side) => {
		if (c.role !== 'card' || c.title) return false
		const inner = pairs.map((p) => p[side]).filter((x) => hugs(c.rect, x.rect))
		const table = inner.find((x) => x.role === 'table')
		if (!table || inner.some((x) => !['table', 'pager', 'toolbar'].includes(x.role))) return false
		const bottom = Math.max(...inner.map((x) => x.rect.y + x.rect.h))
		// Under the table the frame may hold a count line ("6 van 6 · 20 per pagina") where the other side draws a pager.
		const others = (side === 'board' ? board : live).filter((x) => x !== c && x.role !== 'card' && hugs(c.rect, x.rect) && !inner.includes(x))
		return table.rect.w >= c.rect.w - 8 && table.rect.y - c.rect.y <= 24 && c.rect.y + c.rect.h - bottom <= 72 && others.length === 0
	}
	// A pager right under a paired table belongs to it: whether a list has page links follows how many rows it holds.
	const tablePager = (c, side) => c.role === 'pager' && pairs.some((p) => p[side].role === 'table'
		&& Math.abs(c.rect.y - (p[side].rect.y + p[side].rect.h)) <= 24 && Math.abs(c.rect.x - p[side].rect.x) <= 8)
	return {
		pairs,
		missing: board.filter((c) => !usedB.has(c) && counted(c) && !frameOnly(c, 'board') && !tablePager(c, 'board')),
		extra: live.filter((c) => !usedL.has(c) && counted(c) && !frameOnly(c, 'live') && !tablePager(c, 'live')),
	}
}

function flatten (obj, prefix = '', out = {}) {
	if (obj === null || obj === undefined) { if (prefix) out[prefix] = null; return out }
	if (Array.isArray(obj)) return out
	if (typeof obj !== 'object') { out[prefix] = obj; return out }
	for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
	return out
}
const SKIP = /^(role|title|depth|frame|cls|libClass|legacyQuickActions|belowFrame|popup|inCard|headText)$|^record\.|content\.centred|^rect\.(x|y)$|firstRowFont|rowPadding|header\.rowHeight|separatorColor|subtitle\.(color|lineHeight)$|\.label$|^quickActions\.offset/
// Properties whose value follows the data (row counts, text length), reported but never flagged.
const DATA = /^rect\.h$|^pages$|^cell\.background$|^head\.background$/
// Card padding and gap depend on where the DOM puts its padding (card vs header vs body); the effective insets
// (header.titleInset*, content.*Inset*, content.gapBelowTitle) measure what the eye sees and carry the flags.
const STRUCTURAL = /^props\.(padding\.|gap$|margin\.)|^header\.rowBorderBottom$/

function kind (p) {
	if (/^quickActions\.separate$/.test(p)) return 'placement'
	if (p === 'structure') return 'structure'
	if (/(^|\.)(actions|tabCount|controls|buttons)$/.test(p)) return 'chrome'
	if (/[cC]olor$|background/.test(p)) return 'color'
	if (/boxShadow/.test(p)) return 'shadow'
	if (/(^|\.)border\.|borderBottom$|rowBorderBottom$|separator$|indicator$|controlBorder$|^props\.border/.test(p) && !/[Rr]adius/.test(p)) return 'border'
	if (/fontSize|letterSpacing/.test(p)) return 'font'
	if (/fontWeight/.test(p)) return 'weight'
	if (/textTransform|fontFamily/.test(p)) return 'category'
	if (/^rect\.(w|h)$/.test(p)) return 'size'
	return 'spacing'
}
const rgba = parseColour

export function compareProps (b, l) {
	const role = b.role
	const [bb, lb] = pairButtons(b, l)
	const fb = flatten(bb), fl = flatten(lb)
	const rows = []
	// A legacy measurement whose quick actions sat in a separate row has no button count for them: skip the count.
	if (b.legacyQuickActions || l.legacyQuickActions) { delete fb.buttons; delete fl.buttons }
	// Chrome presence: a title row on one side only.
	if (CARDLIKE.has(role) && !!b.header !== !!l.header) rows.push({ prop: 'header (title row)', board: b.header ? 'present' : 'absent', live: l.header ? 'present' : 'absent', delta: null, flag: 'chrome' })
	const keys = [...new Set([...Object.keys(fb), ...Object.keys(fl)])]
	for (const p of keys) {
		if (SKIP.test(p)) continue
		// The page header's container box and its action count repeat what its buttons already show.
		if (role === 'pageHeader' && /^rect\.|^header\.actions$/.test(p)) continue
		const vb = fb[p], vl = fl[p]
		if (vb === undefined && vl === undefined) continue
		const k = kind(p)
		let delta = null, flag = null
		if (typeof vb === 'number' && typeof vl === 'number') delta = Math.round((vl - vb) * 10) / 10
		if (CARDLIKE.has(role) && STRUCTURAL.test(p)) {
			flag = null
		} else if (vb === undefined || vl === undefined || vb === null || vl === null) {
			// Only one side has this property (no title row, no content); presence is reported through the chrome row.
			if (k === 'border' && (vb || vl)) flag = 'border'
		} else if (k === 'chrome') {
			if (role === 'card' || role === 'dialog-card' || role === 'dialog') { if ((vb > 0) !== (vl > 0)) flag = 'chrome' } else if (vb !== vl) flag = 'chrome'
		} else if (k === 'border') {
			if ((vb > 0) !== (vl > 0)) flag = 'border' + (vb > 0 ? ' absent on live' : ' extra on live')
			else if (Math.abs(delta) > 0.5) flag = 'border'
		} else if (k === 'color') {
			const cb = rgba(vb), cl = rgba(vl)
			if (cb && cl) {
				const transparentB = cb[3] < 0.05, transparentL = cl[3] < 0.05
				if (!(transparentB && transparentL) && (transparentB !== transparentL || Math.max(...[0, 1, 2].map((i) => Math.abs(cb[i] - cl[i]))) > (/background/i.test(p) ? THRESHOLDS.background : THRESHOLDS.color) || Math.abs(cb[3] - cl[3]) > 0.15)) flag = 'color'
			}
		} else if (k === 'shadow') {
			if ((vb === 'none') !== (vl === 'none')) flag = 'shadow' + (vb === 'none' ? ' extra on live' : ' absent on live')
		} else if (k === 'structure') {
			if (foldStructure(vb) !== foldStructure(vl)) flag = 'structure differs'
		} else if (k === 'placement') {
			if (vb !== vl) flag = 'chrome placement'
		} else if (k === 'category') {
			if (String(vb).toLowerCase() !== String(vl).toLowerCase()) flag = 'style'
		} else if (CARDLIKE.has(role) && STRUCTURAL.test(p)) {
			flag = null
		} else if (typeof delta === 'number' && !DATA.test(p)) {
			const t = k === 'font' ? THRESHOLDS.font : k === 'weight' ? THRESHOLDS.weight - 1 : k === 'size' ? THRESHOLDS.size : THRESHOLDS.spacing
			if (Math.abs(delta) > t) flag = k
		}
		rows.push({ prop: p, board: vb ?? null, live: vl ?? null, delta, flag })
	}
	// Text placed off-card (screen-reader-only text at -10000px) is not a rendered inset.
	for (const r of rows) if (/^content\./.test(r.prop) && ((typeof r.board === 'number' && r.board < -4) || (typeof r.live === 'number' && r.live < -4))) r.flag = null
	// A cell's padding is how one side places its text; where the text starts is what people see. When the text starts
	// at the same place (the board pads the name cell around its icon, the app gives the icon a column of its own), the
	// padding is reported but not flagged; textInsetLeft carries the flag when the text moves.
	for (const part of ['cell', 'head']) {
		const tb = fb[`${part}.textInsetLeft`], tl = fl[`${part}.textInsetLeft`]
		if (typeof tb !== 'number' || typeof tl !== 'number' || Math.abs(tb - tl) > THRESHOLDS.spacing) continue
		for (const r of rows) if (r.prop === `${part}.paddingLeft`) r.flag = null
	}
	// Content insets mean nothing when either side centres its content (empty state): report, do not flag.
	if (fb['content.centred'] || fl['content.centred']) for (const r of rows) if (/^content\.(firstRowInsetLeft|minInsetLeft|gapBelowTitle|insetTop)$/.test(r.prop)) r.flag = null
	// A border colour only matters where both sides draw that border: a zero-width border has no colour to see.
	for (const r of rows) {
		if (!r.flag || !/[bB]orderColor$/.test(r.prop)) continue
		const width = borderWidthKey(r.prop, fb, fl)
		if (!width || !(fb[width] > 0 && fl[width] > 0)) r.flag = null
	}
	return rows
}
// The width that goes with a border colour property: props.borderColor -> props.border.top, controlBorderColor ->
// controlBorder, x.borderColor -> x.border.
function borderWidthKey (prop, fb, fl) {
	const stem = prop.replace(/[cC]olor$/, '')
	const capital = stem.endsWith('Border')
	for (const k of capital ? [stem] : [`${stem}.top`, stem, `${stem}Top`]) if (k in fb || k in fl) return k
	return null
}
// Page-header buttons pair by label (labels are only used to pair, never compared), the rest by order from the right.
function pairButtons (b, l) {
	if (!Array.isArray(b.buttons) || !Array.isArray(l.buttons)) return [b, l]
	const bb = { ...b, btn: {}, buttons: b.buttons.length }, lb = { ...l, btn: {}, buttons: l.buttons.length }
	const restL = [...l.buttons], restB = []
	for (const x of b.buttons) {
		const i = restL.findIndex((y) => norm(y.label) && norm(y.label) === norm(x.label))
		if (i >= 0) { const { label, ...vx } = x; const { label: _l, ...vy } = restL.splice(i, 1)[0]; bb.btn[norm(label).replace(/ /g, '_')] = vx; lb.btn[norm(label).replace(/ /g, '_')] = vy } else restB.push(x)
	}
	// Icon-only buttons (app launchers, overflow menus) have no reliable counterpart: only labelled ones pair by order.
	restB.splice(0, restB.length, ...restB.filter((x) => norm(x.label))); restL.splice(0, restL.length, ...restL.filter((x) => norm(x.label)))
	// Buttons with different labels are different buttons: they only count, they are not compared with each other.
	return [bb, lb]
}

export function scoreComponent (rows) {
	let s = 0
	for (const r of rows) {
		if (!r.flag) continue
		if (/chrome|border|shadow/.test(r.flag)) s += 3
		else s += 1 + Math.min(Math.abs(r.delta || 0) / 8, 2)
	}
	return Math.round(s * 10) / 10
}

// Measurements taken before the header-count fixes: tab buttons inside the header area were counted as header
// buttons, and a quick-actions row next to the page header came out as a missing or extra toolbar. Correct both
// from the stored data. Measurements that carry quickActions are already right and pass unchanged.
export function normalizeLegacy (r) {
	const ph = (r.components || []).find((c) => c.role === 'pageHeader')
	if (!ph || ph.board.quickActions || ph.live.quickActions) return r
	const within = (o, i) => i.x >= o.x - 2 && i.y >= o.y - 2 && i.x + i.w <= o.x + o.w + 2 && i.y + i.h <= o.y + o.h + 2
	for (const side of ['board', 'live']) {
		const h = ph[side]
		for (const t of r.components.filter((c) => c.role === 'tabs')) {
			if (within(h.rect, t[side].rect) && Array.isArray(h.buttons) && h.buttons.length >= t[side].tabCount) h.buttons = h.buttons.slice(0, h.buttons.length - t[side].tabCount)
		}
		h.quickActions = { separate: false }
	}
	const near = (h, t) => t.role === 'toolbar' && t.rect.y < h.rect.y + h.rect.h && t.rect.y + t.rect.h > h.rect.y
	if (r.extraOnLive.some((t) => near(ph.live, t))) {
		r.extraOnLive = r.extraOnLive.filter((t) => !near(ph.live, t))
		ph.live.quickActions = { separate: true }
		ph.live.legacyQuickActions = true
	}
	if (r.missingOnLive.some((t) => near(ph.board, t))) {
		r.missingOnLive = r.missingOnLive.filter((t) => !near(ph.board, t))
		ph.board.legacyQuickActions = true
	}
	return r
}

// Adds the page background, when measured, as a component of its own (once).
export function addPage (r) {
	if (!r.page || (r.components || []).some((c) => c.role === 'page')) return r
	const c = pageComponent(r.page, r.height)
	if (c) r.components.push(c)
	return r
}

// ---- Elements: every visible control, field, chip, badge and list row -------------------------------------------
const EGROUP = { button: 'ctl', pill: 'ctl', badge: 'ctl', field: 'field', toggle: 'toggle', row: 'row' }
// Sitting in a record card is not a control: a widget's button pairs by its label whether or not its column of widgets
// reads as a deck on one side.
const ekey = (e) => `${EGROUP[e.kind]}|${e.inControl === 'record card' ? '' : norm(e.inControl || '')}|${norm(e.label)}`
const styleKey = (e) => [e.kind, Math.round(e.props.h / 4), e.props.borderRadius, e.props.background, e.props.border, e.props.fontSize].join('|')

// Pairs elements: by label (within control, field, toggle or row), then repeated groups (same container and style)
// by kind and order, so row and chip counts that follow the data do not count as missing or extra.
// Elements pair by order or position only when they play the same part: a count nested in a chip does not stand for
// a chip, and a control (the "Volgen" button) does not stand for a status tag. Stored runs without the flag pass.
const nested = (e) => !!e.inControl && e.inControl !== 'record card'
const sameRole = (b, l) => nested(b) === nested(l) && (b.interactive === undefined || l.interactive === undefined || b.interactive === l.interactive)

export function pairElements (B = [], L = [], H = 2000) {
	const pairs = [], usedB = new Set(), usedL = new Set()
	const byKey = new Map()
	for (const l of L) { if (!norm(l.label)) continue; const k = ekey(l); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(l) }
	for (const b of B) {
		if (!norm(b.label)) continue
		const list = byKey.get(ekey(b))
		// Of the live elements with the same label, the nearest: in a deck of cards the same tag repeats on every card.
		const near = (x) => Math.abs(x.rect.x - b.rect.x) + Math.abs(x.rect.y - b.rect.y)
		const l = list && list.filter((x) => !usedL.has(x)).sort((x, y) => near(x) - near(y))[0]
		if (l) { usedB.add(b); usedL.add(l); pairs.push({ board: b, live: l, by: 'label' }) }
	}
	// Page links pair in order inside the pager; how many pages there are follows the data, so the rest is neither
	// missing nor extra.
	const pagerOf = (list, used) => list.filter((e) => e.inControl === 'pager' && !used.has(e)).sort((a, b) => a.rect.x - b.rect.x)
	const pb = pagerOf(B, usedB), pl = pagerOf(L, usedL)
	pb.forEach((b, i) => { if (pl[i]) pairs.push({ board: b, live: pl[i], by: 'pager' }) })
	pb.forEach((e) => usedB.add(e)); pl.forEach((e) => usedL.add(e))
	// A style that repeats three or more times on the page (one action button per list row, one tag per record) is a
	// list's element: its copies form one group page-wide, however the rows nest their containers.
	const groups = (list, used) => {
		const freq = new Map()
		for (const e of list) freq.set(styleKey(e), (freq.get(styleKey(e)) || 0) + 1)
		const g = new Map()
		// An element below the captured frame pairs by its label only: by place it would meet whatever of another card
		// sits there (a history row and an initials tile), and unpaired it is neither missing nor extra.
		for (const e of list) { if (used.has(e) || e.belowFrame) continue; const k = freq.get(styleKey(e)) >= 3 ? `*|${styleKey(e)}` : `${e.container}|${styleKey(e)}`; if (!g.has(k)) g.set(k, []); g.get(k).push(e) }
		return [...g.values()].map((m) => ({ rep: m.sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)[0], count: m.length, members: m }))
	}
	const gb = groups(B, usedB), gl = groups(L, usedL)
	const cand = []
	for (const b of gb) {
		for (const l of gl) {
			if (EGROUP[b.rep.kind] !== EGROUP[l.rep.kind] || !sameRole(b.rep, l.rep)) continue
			// Two lone elements with different labels are two different controls, not one control restyled.
			const cost = Math.abs(b.rep.rect.x - l.rep.rect.x) / 1440 + 0.5 * Math.abs(b.rep.rect.y - l.rep.rect.y) / H + (b.rep.kind === l.rep.kind ? 0 : 0.05)
			// An icon-only control shows no label: its name is for assistive tech ("Open AI chat", "AI-chat openen"), so two
			// icon-only controls in the same place are one control, whatever each side names it.
			const iconOnly = (e) => e.props && e.props.text === false && e.props.icon
			const samePlace = iconOnly(b.rep) && iconOnly(l.rep) && b.count === 1 && l.count === 1 && cost <= 0.02
			if (!samePlace && b.count === 1 && l.count === 1 && norm(b.rep.label) && norm(l.rep.label) && norm(b.rep.label) !== norm(l.rep.label)) continue
			// Nor do two buttons with different labels, unless both are a list's per-row action (three or more copies).
			if (!samePlace && b.rep.kind === 'button' && l.rep.kind === 'button' && Math.min(b.count, l.count) < 3 && norm(b.rep.label) && norm(l.rep.label) && norm(b.rep.label) !== norm(l.rep.label)) continue
			if (cost <= 0.12) cand.push({ b, l, cost })
		}
	}
	cand.sort((x, y) => x.cost - y.cost)
	const ub = new Set(), ul = new Set()
	for (const { b, l } of cand) {
		if (ub.has(b) || ul.has(l)) continue
		ub.add(b); ul.add(l)
		pairs.push({ board: b.rep, live: l.rep, by: b.count > 1 || l.count > 1 ? `group ${b.count}/${l.count}` : 'position' })
	}
	return {
		pairs,
		missing: gb.filter((g) => !ub.has(g)).map((g) => ({ ...g.rep, count: g.count, repeated: isRepeated(g.rep, g.count) })),
		extra: gl.filter((g) => !ul.has(g)).map((g) => ({ ...g.rep, count: g.count, repeated: isRepeated(g.rep, g.count) })),
	}
}

export function compareElement (b, l, by = 'label') {
	// A status tag paired by group, not by label, takes its colour from its value (Aanwezig green, Afwezig amber):
	// compare its shape, size and type, not its colours.
	const semantic = by !== 'label' && (b.kind === 'pill' || b.kind === 'badge') && (l.kind === 'pill' || l.kind === 'badge')
	const rows = []
	const add = (prop, vb, vl, flag) => rows.push({ prop, board: vb, live: vl, delta: typeof vb === 'number' && typeof vl === 'number' ? Math.round((vl - vb) * 10) / 10 : null, flag })
	const pb = b.props, pl = l.props
	// Pill and button differ only by radius and height, which the rows below compare: the kind does not count twice.
	const shapeOnly = (b.kind === 'pill' && l.kind === 'button') || (b.kind === 'button' && l.kind === 'pill')
	if (b.kind !== l.kind) add('kind', b.kind, l.kind, shapeOnly ? null : (b.kind === 'pill') !== (l.kind === 'pill') ? 'shape' : 'style')
	// An icon-only button shows no text: its font, text colour and inline padding (often browser defaults) do not show.
	const iconOnly = (e) => e.props.text === false || (e.props.text === undefined && Math.abs(e.props.fontSize - 13.3333) < 0.01 && e.props.paddingLeft === 6)
	const textless = iconOnly(b) || iconOnly(l)
	// A native control draws its own glyph (a radio's circle, a select's arrow outside its padding): its border and
	// inline padding are not what people see against a library's drawn control.
	const native = pb.native || pl.native
	for (const k of ['h', 'borderRadius', 'paddingLeft', 'paddingRight', 'gapNext']) {
		if (textless && (k === 'paddingLeft' || k === 'paddingRight')) continue
		if (native && (k === 'paddingRight' || k === 'borderRadius')) continue
		if (pb[k] === null || pl[k] === null || pb[k] === undefined || pl[k] === undefined) continue
		// A label paired by order (different text) changes the width, never the paddings, radius or height.
		add(k, pb[k], pl[k], Math.abs(pl[k] - pb[k]) > THRESHOLDS.spacing ? (k === 'borderRadius' ? 'shape' : 'spacing') : null)
	}
	if (!native || b.kind !== 'toggle') add('border', pb.border, pl.border, (pb.border > 0) !== (pl.border > 0) ? `border ${pb.border > 0 ? 'absent' : 'extra'} on live` : Math.abs(pl.border - pb.border) > 0.5 ? 'border' : null)
	if (pb.border > 0 && pl.border > 0) add('borderColor', pb.borderColor, pl.borderColor, colourDiff(pb.borderColor, pl.borderColor, THRESHOLDS.color) ? 'color' : null)
	add('background', pb.background, pl.background, !semantic && !pb.native && !pl.native && colourDiff(pb.background, pl.background, THRESHOLDS.background) ? 'color' : null)
	if (!textless) {
		add('color', pb.color, pl.color, !semantic && colourDiff(pb.color, pl.color, THRESHOLDS.color) ? 'color' : null)
		add('fontSize', pb.fontSize, pl.fontSize, Math.abs(pl.fontSize - pb.fontSize) > THRESHOLDS.font ? 'font' : null)
		add('fontWeight', pb.fontWeight, pl.fontWeight, Math.abs(pl.fontWeight - pb.fontWeight) >= THRESHOLDS.weight ? 'weight' : null)
	}
	add('icon', pb.icon, pl.icon, pb.icon !== pl.icon ? `icon ${pb.icon ? 'absent' : 'extra'} on live` : null)
	add('badge', pb.badge, pl.badge, pb.badge !== pl.badge ? `badge ${pb.badge ? 'absent' : 'extra'} on live` : null)
	return rows
}
function colourDiff (a, b, t) {
	const ca = rgba(a), cb = rgba(b)
	if (!ca || !cb) return false
	if (ca[3] < 0.05 && cb[3] < 0.05) return false
	return Math.max(...[0, 1, 2].map((i) => Math.abs(ca[i] - cb[i]))) > t || Math.abs(ca[3] - cb[3]) > 0.15
}

// Element rows from a stored element pair: the property rules again, plus the stored pixel signal when no rule fired.
export function elementRows (e) {
	const rows = compareElement(e.board, e.live, e.matchedBy)
	const px = (e.rows || []).find((x) => x.prop === 'pixels')
	if (px && !rows.some((x) => x.flag)) rows.push(px)
	return rows
}

// An element that lives in a repeated structure (a list row, a record card, a run of same-style siblings) comes and
// goes with the data; when it has no counterpart it is reported as data-dependent, not as missing or extra chrome.
export function isRepeated (e, count = e.count || 1) {
	// A count badge nested in a control ("2" next to a group name) is a data value as well.
	return !!(e.repeated || count >= 2 || e.inControl === 'record card' || e.kind === 'row' || e.inRow || (e.inControl && /^\d+$/.test((e.label || '').trim())))
}

// A card's structure with repeated blocks folded (a list of rows inside a card), so row counts do not count.
export function foldStructure (s) {
	if (!s) return s
	let t = s.split(' / ')
	for (let changed = true; changed;) {
		changed = false
		for (let n = 1; n <= 4 && !changed; n++) {
			for (let i = 0; i + 2 * n <= t.length; i++) {
				if (t.slice(i, i + n).join('|') === t.slice(i + n, i + 2 * n).join('|')) { t.splice(i + n, n); changed = true; break }
			}
		}
	}
	return t.join(' / ')
}

// Stored runs keep only one representative per unpaired group, without its styling. A kind and height that repeat
// five or more times among a side's unpaired elements mark a list's elements (one per row) as data-dependent.
export function markListElements (r) {
	for (const key of ['missingElements', 'extraElements']) {
		const list = r[key] || []
		const freq = new Map()
		const k = (e) => `${e.kind}|${Math.round(e.rect.h)}`
		for (const e of list) freq.set(k(e), (freq.get(k(e)) || 0) + 1)
		for (const e of list) if (freq.get(k(e)) >= 5) e.repeated = true
	}
	return r
}

/**
 * Where a pair sits against its board position, as verdict reasons ("x +6", "y -10"), past `limit` px.
 *
 * A page component is placed from the content origin of its side. A dialog is placed in the viewport, by its x only:
 * the boards put a dialog's top anywhere from 88 to 120 px and Nextcloud fixes it, so its vertical position does not
 * count. What sits inside a dialog is placed from that dialog's top, so it still counts within the dialog.
 *
 * @param {{board: object, live: object}} c The pair.
 * @param {{x: number, y: number}} ob The board's content origin.
 * @param {{x: number, y: number}} ol The live content origin.
 * @param {{board: object, live: object}|null} dialog The paired dialog, if one is open.
 * @param {number} [limit] The tolerance in px.
 * @return {Array<string>} The reasons, empty when the pair sits within the tolerance.
 */
export function positionReasons(c, ob, ol, dialog, limit = 4) {
	const reasons = []
	const r1 = (v) => Math.round(v * 10) / 10
	const push = (axis, d) => { if (Math.abs(d) > limit) reasons.push(`${axis} ${d > 0 ? '+' : ''}${d}`) }
	const role = c.role || c.board.role
	if (role === 'page' || role === 'pageHeader') return reasons
	if (role === 'dialog') {
		push('x', r1(c.live.rect.x - c.board.rect.x))
		return reasons
	}
	if (role === 'dialog-card') {
		push('x', r1(c.live.rect.x - c.board.rect.x))
		if (dialog) push('y', r1((c.live.rect.y - dialog.live.rect.y) - (c.board.rect.y - dialog.board.rect.y)))
		return reasons
	}
	push('x', r1((c.live.rect.x - ol.x) - (c.board.rect.x - ob.x)))
	push('y', r1((c.live.rect.y - ol.y) - (c.board.rect.y - ob.y)))
	return reasons
}
