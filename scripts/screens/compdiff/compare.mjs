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
	// One representative per record-card deck: the number of cards follows the data.
	board = board.filter((c) => !c.record || c.record.index === 0)
	live = live.filter((c) => !c.record || c.record.index === 0)
	const pairs = []
	const usedB = new Set(), usedL = new Set()
	const take = (b, l, by) => { usedB.add(b); usedL.add(l); pairs.push({ board: b, live: l, by, name: b.title && b.role !== 'tabs' && b.role !== 'table' && b.role !== 'toolbar' ? b.title : `${b.role}@${Math.round(b.rect.x)},${Math.round(b.rect.y)}` }) }
	const pos = (b, l) => {
		const cx = (r) => r.x + r.w / 2
		return Math.abs(cx(b.rect) - cx(l.rect)) / 1440 + 0.5 * Math.abs(b.rect.y - l.rect.y) / H + Math.abs(b.rect.w - l.rect.w) / 1440 + 0.2 * Math.abs((b.depth || 0) - (l.depth || 0))
	}
	// 1. The page header pairs with the page header.
	const bh = board.find((c) => c.role === 'pageHeader'), lh = live.find((c) => c.role === 'pageHeader')
	if (bh && lh) take(bh, lh, 'role')
	// 2. Title text, exact then fuzzy; ties broken by position.
	for (const minSim of [1, 0.5]) {
		const cand = []
		for (const b of board) {
			if (usedB.has(b) || !TITLED(b)) continue
			for (const l of live) {
				if (usedL.has(l) || !TITLED(l) || group(b) !== group(l)) continue
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
			let cost = pos(b, l)
			if (!!b.record !== !!l.record) cost += 0.15
			if (b.title && l.title && CARDLIKE.has(b.role)) cost += 0.12
			if (cost <= 0.2) cand.push({ b, l, cost })
		}
	}
	cand.sort((x, y) => x.cost - y.cost)
	for (const { b, l } of cand) if (!usedB.has(b) && !usedL.has(l)) take(b, l, 'position')
	return { pairs, missing: board.filter((c) => !usedB.has(c)), extra: live.filter((c) => !usedL.has(c)) }
}

function flatten (obj, prefix = '', out = {}) {
	if (obj === null || obj === undefined) { if (prefix) out[prefix] = null; return out }
	if (Array.isArray(obj)) return out
	if (typeof obj !== 'object') { out[prefix] = obj; return out }
	for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
	return out
}
const SKIP = /^(role|title|depth|frame|cls|libClass|legacyQuickActions)$|^record\.|content\.centred|^rect\.(x|y)$|firstRowFont|rowPadding|header\.rowHeight|separatorColor|subtitle\.(color|lineHeight)$|\.label$|^quickActions\.offset/
// Properties whose value follows the data (row counts, text length), reported but never flagged.
const DATA = /^rect\.h$|^cell\.background$|^head\.background$/
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
const rgba = (c) => { const m = (c || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1] }

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
	// Content insets mean nothing when either side centres its content (empty state): report, do not flag.
	if (fb['content.centred'] || fl['content.centred']) for (const r of rows) if (/^content\.(firstRowInsetLeft|minInsetLeft|gapBelowTitle|insetTop)$/.test(r.prop)) r.flag = null
	// Border colour only matters where both sides draw the border.
	for (const r of rows) if (r.prop === 'props.borderColor' && r.flag && !(fb['props.border.top'] > 0 && fl['props.border.top'] > 0)) r.flag = null
	return rows
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
	restB.reverse(); restL.reverse()
	for (let i = 0; i < Math.min(restB.length, restL.length); i++) { const { label, ...vx } = restB[i]; const { label: _l, ...vy } = restL[i]; bb.btn[`unlabelled${i}`] = vx; lb.btn[`unlabelled${i}`] = vy }
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
const ekey = (e) => `${EGROUP[e.kind]}|${norm(e.inControl || '')}|${norm(e.label)}`
const styleKey = (e) => [e.kind, Math.round(e.props.h / 4), e.props.borderRadius, e.props.background, e.props.border, e.props.fontSize].join('|')

// Pairs elements: by label (within control, field, toggle or row), then repeated groups (same container and style)
// by kind and order, so row and chip counts that follow the data do not count as missing or extra.
export function pairElements (B = [], L = [], H = 2000) {
	const pairs = [], usedB = new Set(), usedL = new Set()
	const byKey = new Map()
	for (const l of L) { if (!norm(l.label)) continue; const k = ekey(l); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(l) }
	for (const b of B) {
		if (!norm(b.label)) continue
		const list = byKey.get(ekey(b))
		const l = list && list.find((x) => !usedL.has(x))
		if (l) { usedB.add(b); usedL.add(l); pairs.push({ board: b, live: l, by: 'label' }) }
	}
	const groups = (list, used) => {
		const g = new Map()
		for (const e of list) { if (used.has(e)) continue; const k = `${e.container}|${styleKey(e)}`; if (!g.has(k)) g.set(k, []); g.get(k).push(e) }
		return [...g.values()].map((m) => ({ rep: m.sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)[0], count: m.length, members: m }))
	}
	const gb = groups(B, usedB), gl = groups(L, usedL)
	const cand = []
	for (const b of gb) {
		for (const l of gl) {
			if (EGROUP[b.rep.kind] !== EGROUP[l.rep.kind]) continue
			const cost = Math.abs(b.rep.rect.x - l.rep.rect.x) / 1440 + 0.5 * Math.abs(b.rep.rect.y - l.rep.rect.y) / H + (b.rep.kind === l.rep.kind ? 0 : 0.05)
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
	if (b.kind !== l.kind) add('kind', b.kind, l.kind, (b.kind === 'pill') !== (l.kind === 'pill') ? 'shape' : 'style')
	for (const k of ['h', 'borderRadius', 'paddingLeft', 'paddingRight', 'gapNext']) {
		if (pb[k] === null || pl[k] === null || pb[k] === undefined || pl[k] === undefined) continue
		// A label paired by order (different text) changes the width, never the paddings, radius or height.
		add(k, pb[k], pl[k], Math.abs(pl[k] - pb[k]) > THRESHOLDS.spacing ? (k === 'borderRadius' ? 'shape' : 'spacing') : null)
	}
	add('border', pb.border, pl.border, (pb.border > 0) !== (pl.border > 0) ? `border ${pb.border > 0 ? 'absent' : 'extra'} on live` : Math.abs(pl.border - pb.border) > 0.5 ? 'border' : null)
	if (pb.border > 0 && pl.border > 0) add('borderColor', pb.borderColor, pl.borderColor, colourDiff(pb.borderColor, pl.borderColor, THRESHOLDS.color) ? 'color' : null)
	add('background', pb.background, pl.background, !semantic && colourDiff(pb.background, pl.background, THRESHOLDS.background) ? 'color' : null)
	add('color', pb.color, pl.color, !semantic && colourDiff(pb.color, pl.color, THRESHOLDS.color) ? 'color' : null)
	add('fontSize', pb.fontSize, pl.fontSize, Math.abs(pl.fontSize - pb.fontSize) > THRESHOLDS.font ? 'font' : null)
	add('fontWeight', pb.fontWeight, pl.fontWeight, Math.abs(pl.fontWeight - pb.fontWeight) >= THRESHOLDS.weight ? 'weight' : null)
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
