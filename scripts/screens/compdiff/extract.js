// Runs inside a page (board or live). Finds the styled components and returns their measured properties.
// The same code runs on both sides, so every number is measured the same way.
// Exposed as window.__compdiffExtract() -> { viewport, components: [...] }
window.__compdiffExtract = function () {
	const VW = window.innerWidth
	const px = (v) => parseFloat(v) || 0
	const round = (v) => Math.round(v * 10) / 10
	const rgba = (c) => {
		const m = (c || '').match(/rgba?\(([^)]+)\)/)
		if (!m) return null
		const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
		return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]
	}
	const opaque = (c) => { const v = rgba(c); return !!v && v[3] > 0.05 }
	const visible = (el) => {
		const r = el.getBoundingClientRect()
		if (r.width < 1 || r.height < 1) return false
		const cs = getComputedStyle(el)
		return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05
	}
	const rect = (el) => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) } }
	const bgBehind = (el) => {
		for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (opaque(c)) return c }
		return 'rgb(255, 255, 255)'
	}
	const SIDES = ['Top', 'Right', 'Bottom', 'Left']
	const borders = (cs) => Object.fromEntries(SIDES.map((s) => [s.toLowerCase(), cs['border' + s + 'Style'] === 'none' || cs['border' + s + 'Style'] === 'hidden' || !opaque(cs['border' + s + 'Color']) ? 0 : px(cs['border' + s + 'Width'])]))
	const box = (cs, prop) => Object.fromEntries(SIDES.map((s) => [s.toLowerCase(), px(cs[prop + s])]))
	const lineHeight = (cs) => (cs.lineHeight === 'normal' ? round(px(cs.fontSize) * 1.2) : px(cs.lineHeight))
	const font = (el) => {
		const cs = getComputedStyle(el)
		return { fontSize: px(cs.fontSize), fontWeight: Number(cs.fontWeight), lineHeight: lineHeight(cs), color: cs.color, letterSpacing: cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing), textTransform: cs.textTransform, fontFamily: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() }
	}
	// The element that holds an element's first rendered text (title text often sits in a nested span).
	const textEl = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.trim() && n.parentElement && visible(n.parentElement)) return n.parentElement; return el }
	const textRect = (el) => {
		// Box of the rendered glyphs of an element's text, not of its (possibly stretched) element box.
		const range = document.createRange()
		let r = null
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (!n.textContent.trim() || !n.parentElement || !visible(n.parentElement)) continue
			range.selectNodeContents(n)
			for (const q of range.getClientRects()) {
				if (q.width < 1) continue
				r = r ? { x: Math.min(r.x, q.left), y: Math.min(r.y, q.top), r: Math.max(r.r, q.right), b: Math.max(r.b, q.bottom) } : { x: q.left, y: q.top, r: q.right, b: q.bottom }
			}
		}
		return r && { x: round(r.x), y: round(r.y), w: round(r.r - r.x), h: round(r.b - r.y) }
	}
	// The app top bar and the left navigation are chrome around every page; they are not page components.
	const outOfScope = (el) => {
		if (el.closest('header[data-sc-header], #header, #app-navigation, #app-navigation-vue, .app-navigation, #appmenu')) return true
		const r = el.getBoundingClientRect()
		return (r.x < 250 && r.right < 300) || r.bottom <= 70
	}
	const all = [...document.body.querySelectorAll('*')].filter((el) => !['SCRIPT', 'STYLE', 'LINK', 'META', 'svg', 'path', 'TR', 'TD', 'TH', 'THEAD', 'TBODY', 'BR', 'OPTION'].includes(el.tagName))
	const INTERACTIVE = 'button, input, select, textarea, a, label, [role=button], [role=tab], [role=option], [role=combobox], [role=checkbox], [role=switch]'

	// 1. Cards: a framed box (3+ borders, a shadow, or a background unlike what is behind it), big enough to hold content.
	const framed = (el, cs) => {
		const b = borders(cs)
		const nb = Object.values(b).filter((v) => v > 0).length
		if (nb >= 3) return 'border'
		if (cs.boxShadow !== 'none' && !/^rgba\(0, 0, 0, 0\)/.test(cs.boxShadow)) return 'shadow'
		if (opaque(cs.backgroundColor) && el.parentElement && cs.backgroundColor !== bgBehind(el.parentElement)) return 'background'
		return null
	}
	let cards = []
	for (const el of all) {
		// Links can be cards (a KPI tile is often one big <a>); other controls are not.
		if ((el.matches(INTERACTIVE) && el.tagName !== 'A') || el.matches('[role=tablist], table, ul[role=listbox]')) continue
		if (!visible(el) || outOfScope(el)) continue
		const r = el.getBoundingClientRect()
		if (r.width < 140 || r.height < 48) continue
		const cs = getComputedStyle(el)
		if ((cs.position === 'fixed' || cs.position === 'absolute') && r.width >= VW * 0.9) continue
		if (r.width >= VW * 0.75 && r.height >= window.innerHeight * 0.6) continue
		const kind = framed(el, cs)
		if (!kind) continue
		cards.push({ el, kind })
	}
	// Collapse wrappers that draw the same box (grid item around widget wrapper): keep the one with the most border sides, else the inner one.
	const same = (a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.x - q.x) <= 3 && Math.abs(p.y - q.y) <= 3 && Math.abs(p.right - q.right) <= 3 && Math.abs(p.bottom - q.bottom) <= 3 }
	const nBorders = (el) => Object.values(borders(getComputedStyle(el))).filter((v) => v > 0).length
	cards = cards.filter((c) => !cards.some((d) => d !== c && same(c.el, d.el) && ((c.el.contains(d.el) && nBorders(d.el) >= nBorders(c.el)) || (d.el.contains(c.el) && nBorders(d.el) > nBorders(c.el)))))
	const cardEls = new Set(cards.map((c) => c.el))
	const ownerCard = (el) => { for (let e = el.parentElement; e; e = e.parentElement) if (cardEls.has(e)) return e; return null }
	const ownedBy = (node, card) => { const p = node.nodeType === 1 ? node : node.parentElement; if (!card.contains(p)) return false; for (let e = p; e && e !== card; e = e.parentElement) if (cardEls.has(e)) return false; return true }

	// Content leaves of a card: text runs, plus icons, images, inputs and coloured dots/bars.
	const leavesOf = (card) => {
		const out = []
		const range = document.createRange()
		const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (!n.textContent.trim() || !n.parentElement || !visible(n.parentElement) || !ownedBy(n, card)) continue
			range.selectNodeContents(n)
			const q = [...range.getClientRects()].find((x) => x.width >= 1)
			if (q) out.push({ node: n.parentElement, x: q.left, y: q.top, r: q.right, b: q.bottom, text: true })
		}
		for (const el of card.querySelectorAll('svg, img, input, select, textarea, progress, canvas, button, [role=progressbar], span, i, div')) {
			if (!ownedBy(el, card) || !visible(el)) continue
			const isMedia = el.matches('svg, img, input, select, textarea, progress, canvas, [role=progressbar]')
			const cs = getComputedStyle(el)
			const isDot = !el.children.length && !el.textContent.trim() && opaque(cs.backgroundColor)
			if (!isMedia && !isDot) continue
			if (el.closest('svg') && el.tagName !== 'svg') continue
			const q = el.getBoundingClientRect()
			if (q.width < 3 || q.height < 3) continue
			out.push({ node: el, x: q.left, y: q.top, r: q.right, b: q.bottom, text: false })
		}
		return out
	}

	const headingIn = (card, cr) => {
		const hs = [...card.querySelectorAll('h1, h2, h3, h4, h5, h6, [role=heading], legend')].filter((h) => ownedBy(h, card) && visible(h) && h.textContent.trim())
		const top = hs.find((h) => h.getBoundingClientRect().top - cr.top < Math.max(90, cr.height * 0.4))
		if (top) return top
		// No heading element: a bold run of text at the top of the card serves as its title.
		const range = document.createRange()
		const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (!n.textContent.trim() || !n.parentElement || !visible(n.parentElement) || !ownedBy(n, card)) continue
			range.selectNodeContents(n)
			const q = range.getBoundingClientRect()
			if (q.top - cr.top > 64) break
			const cs = getComputedStyle(n.parentElement)
			if (Number(cs.fontWeight) >= 600 && px(cs.fontSize) >= 13 && !n.parentElement.closest(INTERACTIVE)) return n.parentElement
			break
		}
		return null
	}

	const describeCard = (card, role) => {
		const cs = getComputedStyle(card)
		const cr = card.getBoundingClientRect()
		const comp = { el: card, role, rect: rect(card), frame: framed(card, cs), depth: 0 }
		for (let e = ownerCard(card); e; e = ownerCard(e)) comp.depth++
		comp.props = {
			padding: box(cs, 'padding'), margin: box(cs, 'margin'), border: borders(cs), borderColor: cs.borderTopColor,
			borderRadius: px(cs.borderTopLeftRadius), background: bgBehind(card), boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow,
			gap: /flex|grid/.test(cs.display) ? px(cs.rowGap) : null,
		}
		const leaves = leavesOf(card)
		const title = headingIn(card, cr)
		let headerRow = null, titleBox = null
		if (title) {
			comp.title = title.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)
			titleBox = textRect(title) || rect(title)
			headerRow = title
			// Climb to the header row: the widest ancestor that still holds only the title line.
			for (let p = title.parentElement; p && p !== card && card.contains(p); p = p.parentElement) {
				const pr = p.getBoundingClientRect()
				if (pr.height > titleBox.h + 56) break
				if (leaves.some((l) => p.contains(l.node) && l.y > titleBox.y + titleBox.h + 4)) break
				headerRow = p
			}
			const hcs = getComputedStyle(headerRow)
			const actions = [...headerRow.querySelectorAll('a, button, [role=button]')].filter((a) => visible(a) && !title.contains(a) && ownedBy(a, card))
			comp.header = {
				...font(textEl(title)),
				titleInsetLeft: round(titleBox.x - cr.left), titleInsetTop: round(titleBox.y - cr.top),
				rowPadding: headerRow === title ? null : box(hcs, 'padding'),
				rowBorderBottom: headerRow === title ? 0 : borders(hcs).bottom,
				rowHeight: round(headerRow.getBoundingClientRect().height),
				actions: actions.length,
			}
		}
		const below = titleBox ? titleBox.y + titleBox.h - 1 : -Infinity
		const content = leaves.filter((l) => !(headerRow && headerRow.contains(l.node)) && l.y >= below)
		if (content.length) {
			const top = Math.min(...content.map((l) => l.y))
			const firstRow = content.filter((l) => l.y <= top + 6)
			comp.content = {
				firstRowInsetLeft: round(Math.min(...firstRow.map((l) => l.x)) - cr.left),
				minInsetLeft: round(Math.min(...content.map((l) => l.x)) - cr.left),
				gapBelowTitle: titleBox ? round(top - (titleBox.y + titleBox.h)) : null,
				insetTop: titleBox ? null : round(top - cr.top),
				// Centred content (an empty state, a lone chart) has no meaningful left inset.
				centred: (() => { const l = Math.min(...content.map((c) => c.x)) - cr.left, r = cr.right - Math.max(...content.map((c) => c.r)); return l > 40 && Math.abs(l - r) < 12 })(),
			}
			const fr = firstRow.find((l) => l.text)
			if (fr) comp.content.firstRowFont = font(fr.node)
		}
		// Separator between the title and the body: any line spanning most of the card in that band.
		if (titleBox) {
			const lo = titleBox.y + titleBox.h - 2
			const hi = content.length ? Math.min(...content.map((l) => l.y)) + 2 : titleBox.y + titleBox.h + 60
			let sep = null
			for (const el of [card, ...card.querySelectorAll('*')]) {
				if (el !== card && !ownedBy(el, card)) continue
				if (!visible(el)) continue
				// A list row's own border is not a header separator: skip boxes holding some but not all of the body.
				if (el !== card && content.length) { const n = content.filter((l) => el.contains(l.node)).length; if (n > 0 && n < content.length) continue }
				const r = el.getBoundingClientRect()
				if (r.width < cr.width * 0.6) continue
				const ecs = getComputedStyle(el)
				const b = borders(ecs)
				if (el !== card && b.bottom > 0 && r.bottom >= lo && r.bottom <= hi) sep = { width: b.bottom, color: ecs.borderBottomColor, on: el.className?.baseVal ?? el.className }
				else if (el !== card && b.top > 0 && r.top >= lo && r.top <= hi) sep = { width: b.top, color: ecs.borderTopColor, on: el.className?.baseVal ?? el.className }
				else if ((el.tagName === 'HR' || (r.height <= 2 && opaque(ecs.backgroundColor))) && r.top >= lo && r.top <= hi) sep = { width: Math.max(1, Math.round(r.height)), color: ecs.backgroundColor, on: el.tagName }
				if (sep) break
			}
			comp.header.separator = sep ? sep.width : 0
			comp.header.separatorColor = sep ? sep.color : null
		}
		return comp
	}

	const components = []
	for (const c of cards) components.push(describeCard(c.el, c.el.closest('[role=dialog]') ? 'dialog-card' : 'card'))

	// 2. Dialogs: the visible dialog box (a full-screen role=dialog mask is narrowed to its framed child).
	for (const d of document.querySelectorAll('[role=dialog], [role=alertdialog]')) {
		if (!visible(d)) continue
		let boxEl = d
		if (d.getBoundingClientRect().width >= VW * 0.9) {
			boxEl = [...d.querySelectorAll('*')].filter((e) => visible(e) && framed(e, getComputedStyle(e)) && e.getBoundingClientRect().width < VW * 0.9 && e.getBoundingClientRect().width > 240).sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0]
		}
		if (!boxEl) continue
		const i = components.findIndex((c) => c.el === boxEl)
		cardEls.add(boxEl)
		const comp = describeCard(boxEl, 'dialog')
		comp.buttons = [...boxEl.querySelectorAll('button')].filter(visible).length
		components.push(comp)
		if (i >= 0) components.splice(i, 1)
	}
	// Dialog boxes were also found as cards: drop the card duplicate.
	const dialogs = components.filter((c) => c.role === 'dialog')
	for (let i = components.length - 1; i >= 0; i--) {
		const c = components[i]
		if (c.role !== 'dialog' && dialogs.some((d) => Math.abs(d.rect.x - c.rect.x) < 3 && Math.abs(d.rect.y - c.rect.y) < 3 && Math.abs(d.rect.w - c.rect.w) < 3)) components.splice(i, 1)
	}

	const headerButton = (b) => {
		const bcs = getComputedStyle(b)
		return { label: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), h: round(b.getBoundingClientRect().height), borderRadius: px(bcs.borderTopLeftRadius), paddingLeft: px(bcs.paddingLeft), paddingRight: px(bcs.paddingRight), fontSize: px(bcs.fontSize), fontWeight: Number(bcs.fontWeight), background: bgBehind(b), border: borders(bcs).top, color: bcs.color }
	}
	// 3. Page header: the first visible h1 and the buttons on its line.
	const h1 = [...document.querySelectorAll('h1')].find((h) => visible(h) && !outOfScope(h) && !h.closest('[role=dialog]'))
	if (h1) {
		let container = h1
		for (let p = h1.parentElement; p && p !== document.body; p = p.parentElement) {
			const pr = p.getBoundingClientRect()
			if (pr.height > 150 || cardEls.has(p)) break
			container = p
		}
		window.__compdiffPageHeader = container
		const tb = textRect(h1) || rect(h1)
		const btns = [...container.querySelectorAll('button, a')].filter((b) => {
			// Tabs drawn inside the header area are a tab strip, compared as 'tabs', not header buttons.
			if (!visible(b) || h1.contains(b) || b.matches('[role=tab]') || b.closest('[role=tablist]')) return false
			const bcs = getComputedStyle(b)
			return b.tagName === 'BUTTON' || opaque(bcs.backgroundColor) || nBorders(b) >= 3
		})
		const sub = [...container.querySelectorAll('p, span, div')].find((e) => visible(e) && !e.children.length && e.textContent.trim() && e.getBoundingClientRect().top > tb.y + tb.h - 2 && !e.closest('button, a'))
		components.push({
			role: 'pageHeader', title: h1.textContent.trim().replace(/\s+/g, ' ').slice(0, 80), rect: rect(container),
			header: { ...font(textEl(h1)), titleX: tb.x, titleY: tb.y, actions: btns.length },
			subtitle: sub ? { ...font(sub), gapBelowTitle: round(sub.getBoundingClientRect().top - (tb.y + tb.h)) } : null,
			buttons: btns.map(headerButton),
			quickActions: { separate: false },
		})
	}

	// 4. Tab strips.
	for (const tl of document.querySelectorAll('[role=tablist]')) {
		if (!visible(tl) || outOfScope(tl)) continue
		const tabs = [...tl.querySelectorAll('[role=tab]')].filter(visible)
		if (!tabs.length) continue
		const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]
		const inactive = tabs.find((t) => t !== active)
		const tabProps = (t) => {
			if (!t) return null
			const tcs = getComputedStyle(t), after = getComputedStyle(t, '::after'), before = getComputedStyle(t, '::before')
			const pseudo = [after, before].find((p) => p.content !== 'none' && p.content !== 'normal' && opaque(p.backgroundColor) && px(p.height) <= 6)
			return {
				...font(textEl(t)),
				h: round(t.getBoundingClientRect().height), padding: box(tcs, 'padding'), borderRadius: px(tcs.borderTopLeftRadius),
				background: tcs.backgroundColor, indicator: borders(tcs).bottom || (pseudo ? px(pseudo.height) : 0) || (/inset 0px -\d/.test(tcs.boxShadow) ? Number(tcs.boxShadow.match(/inset 0px -(\d+)/)[1]) : 0),
			}
		}
		const gaps = tabs.slice(1).map((t, i) => round(t.getBoundingClientRect().left - tabs[i].getBoundingClientRect().right))
		const tcs = getComputedStyle(tl)
		components.push({ role: 'tabs', title: 'tabs', rect: rect(tl), tabCount: tabs.length, gap: gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : null, borderBottom: borders(tcs).bottom || borders(getComputedStyle(tl.parentElement)).bottom, active: tabProps(active), inactive: tabProps(inactive) })
	}

	// 5. Tables (and ARIA grids).
	for (const t of document.querySelectorAll('table, [role=table], [role=grid]')) {
		if (!visible(t) || outOfScope(t)) continue
		const th = t.querySelector('th, [role=columnheader]')
		const td = t.querySelector('tbody td, [role=row] [role=cell], [role=gridcell]')
		const hr = th && (th.closest('tr, [role=row]') || th)
		const dr = td && (td.closest('tr, [role=row]') || td)
		const cell = (c) => { if (!c) return null; const ccs = getComputedStyle(c); return { ...font(c), paddingLeft: px(ccs.paddingLeft), paddingTop: px(ccs.paddingTop), borderBottom: borders(ccs).bottom || (c.parentElement ? borders(getComputedStyle(c.parentElement)).bottom : 0), background: bgBehind(c) } }
		components.push({ role: 'table', title: 'table', rect: rect(t), head: cell(th), headRowHeight: hr ? round(hr.getBoundingClientRect().height) : null, cell: cell(td), rowHeight: dr ? round(dr.getBoundingClientRect().height) : null })
	}

	// 6. Toolbars: a row (not a card header, not the page header) that holds 2+ controls.
	const ctrl = 'button, input:not([type=hidden]), select, [role=combobox], [role=searchbox]'
	const headerBox = window.__compdiffPageHeader
	const used = new Set()
	for (const el of all) {
		if (!visible(el) || outOfScope(el) || el.closest('[role=tablist], table, thead')) continue
		const cs = getComputedStyle(el)
		if (!/flex|grid/.test(cs.display)) continue
		const r = el.getBoundingClientRect()
		if (r.height > 72 || r.width < 300) continue
		const ctrls = [...el.querySelectorAll(ctrl)].filter((c) => visible(c) && c.getBoundingClientRect().height >= 24)
		if (ctrls.length < 2) continue
		if ([...el.querySelectorAll('h1, h2, h3, h4, [role=heading]')].some(visible)) continue
		if (el.querySelector('[role=tablist]')) continue
		if ([...used].some((u) => u.contains(el))) continue
		if (headerBox && (headerBox.contains(el) || el.contains(headerBox))) continue
		used.add(el)
		const c0 = ctrls[0], c0cs = getComputedStyle(c0)
		components.push({ role: 'toolbar', title: 'toolbar', rect: rect(el), gap: px(cs.columnGap), padding: box(cs, 'padding'), controls: ctrls.length, controlHeight: round(c0.getBoundingClientRect().height), controlRadius: px(c0cs.borderTopLeftRadius), controlBorder: borders(c0cs).top, controlBorderColor: c0cs.borderTopColor, controlFontSize: px(c0cs.fontSize) })
	}
	// A quick-actions row drawn as its own element beside or just under the page header (CnDetailPage) belongs to the
	// header: its buttons count toward the header's buttons, and its offset from the title is reported on its own.
	const ph = components.find((c) => c.role === 'pageHeader')
	if (ph && headerBox) {
		const hb = headerBox.getBoundingClientRect()
		for (const el of used) {
			const r = el.getBoundingClientRect()
			if (r.top > hb.bottom + 60 || r.bottom < hb.top) continue
			const qb = [...el.querySelectorAll('button, a')].filter((b) => visible(b) && !b.closest('[role=tablist]') && (b.tagName === 'BUTTON' || opaque(getComputedStyle(b).backgroundColor) || nBorders(b) >= 3))
			ph.buttons.push(...qb.map(headerButton))
			ph.header.actions = ph.buttons.length
			ph.quickActions = { separate: true, offsetTop: round(r.top - ph.header.titleY), offsetRight: round(window.innerWidth - r.right) }
			const i = components.findIndex((c) => c.role === 'toolbar' && Math.abs(c.rect.x - r.x) < 1 && Math.abs(c.rect.y - r.y) < 1)
			if (i >= 0) components.splice(i, 1)
		}
	}
	// The component's own classes (and its nearest cn-* ancestor), used to tell a library defect from an app one.
	const clsOf = (r) => { const el = document.elementFromPoint(r.x + Math.min(8, r.w / 2), r.y + Math.min(8, r.h / 2)); let lib = null; for (let e = el; e; e = e.parentElement) { const c = [...(e.classList || [])].find((k) => /^cn-|^nc-|^app-content|^modal|^dialog/.test(k)); if (c) { lib = c; break } } return lib }
	for (const c of components) { if (c.el) c.cls = [...(c.el.classList || [])].slice(0, 2).join('.') || c.el.tagName.toLowerCase(); c.libClass = clsOf(c.rect) }
	return { viewport: { w: VW, h: window.innerHeight }, scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }, components: components.map(({ el, ...c }) => c) }
}
