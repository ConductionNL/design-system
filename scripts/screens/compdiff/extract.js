// Runs inside a page (board or live). Finds the styled components and returns their measured properties.
// The same code runs on both sides, so every number is measured the same way.
// Exposed as window.__compdiffExtract() -> { viewport, components: [...] }
window.__compdiffExtract = function () {
	const VW = window.innerWidth
	const px = (v) => parseFloat(v) || 0
	const round = (v) => Math.round(v * 10) / 10
	// colour.mjs's parseColour, injected ahead of this file by compdiff.mjs: it also reads the CSS Color 4 forms
	// (color(srgb ...), oklch(...)) that a color-mix() computes to. Without it every such colour read as transparent.
	if (typeof parseColour !== 'function') throw new Error('compdiff: parseColour is not injected (load extract.js through compdiff.mjs)')
	const rgba = parseColour
	const opaque = (c) => { const v = rgba(c); return !!v && v[3] > 0.05 }
	// Visible means people can see it: a screen-reader-only element (a 1px box that clips its content, such as
	// NcDialog's h2.dialog__name) is not, though it has a box.
	const visible = (el) => {
		const r = el.getBoundingClientRect()
		if (r.width < 1 || r.height < 1) return false
		const cs = getComputedStyle(el)
		if ((r.width <= 2 || r.height <= 2) && (cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto') || cs.overflow === 'hidden')) return false
		return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05
	}
	// Hidden from assistive tech (NcSelect's chevron button, aria-hidden with tabindex -1): decoration, not a control.
	const ariaHidden = (el) => !!el.closest('[aria-hidden="true"]')
	const rect = (el) => { const r = el.getBoundingClientRect(); return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) } }
	const bgBehind = (el) => {
		for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (opaque(c)) return c }
		return 'rgb(255, 255, 255)'
	}
	// The colour painted under an element: its ground laid over the grounds behind it, so a 10% tint over a blue circle
	// (NcAvatar's initials over its painted disc) reads as the blue people see, not as the tint.
	const painted = (el) => {
		const layers = []
		for (let e = el; e; e = e.parentElement) {
			const v = rgba(getComputedStyle(e).backgroundColor)
			if (v && v[3] > 0) { layers.push(v); if (v[3] >= 0.999) break }
		}
		let c = [255, 255, 255]
		for (let i = layers.length - 1; i >= 0; i--) { const [r, g, b, a] = layers[i]; c = [r * a + c[0] * (1 - a), g * a + c[1] * (1 - a), b * a + c[2] * (1 - a)] }
		return `rgb(${c.map(Math.round).join(', ')})`
	}
	const SIDES = ['Top', 'Right', 'Bottom', 'Left']
	const borders = (cs) => Object.fromEntries(SIDES.map((s) => [s.toLowerCase(), cs['border' + s + 'Style'] === 'none' || cs['border' + s + 'Style'] === 'hidden' || !opaque(cs['border' + s + 'Color']) ? 0 : px(cs['border' + s + 'Width'])]))
	// A box-shadow ring (0 0 0 <spread> <colour>) draws a border without a border property.
	const ring = (cs) => {
		for (const m of cs.boxShadow.matchAll(/((?:rgba?|color|oklch|oklab|lab|lch)\([^)]*\)|#[0-9a-f]{3,8})\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\s+([\d.]+)px/gi)) {
			if (+m[2] === 0 && +m[3] === 0 && +m[4] === 0 && +m[5] > 0 && opaque(m[1])) return { width: +m[5], color: m[1] }
		}
		return null
	}
	// The border people see: a ring of the border's own colour (or with no border at all) thickens it, so a 1px border
	// with a 1px inset ring reads as the 2px border a board draws (a chosen choice row).
	const seenBorders = (cs) => {
		const b = borders(cs)
		const g = ring(cs)
		if (!g) return b
		const same = (c) => { const x = rgba(c), y = rgba(g.color); return !!x && !!y && x.slice(0, 3).every((v, i) => Math.abs(v - y[i]) <= 4) }
		const none = Object.values(b).every((v) => v === 0)
		return Object.fromEntries(SIDES.map((side) => {
			const key = side.toLowerCase()
			if (none) return [key, g.width]
			return [key, b[key] > 0 && same(cs['border' + side + 'Color']) ? b[key] + g.width : b[key]]
		}))
	}
	// The box shadow left once a ring that seenBorders() read as border is taken out: 'none' when the ring was all of it.
	const shadowBeyondRing = (cs) => {
		if (cs.boxShadow === 'none') return 'none'
		const g = ring(cs)
		if (!g) return cs.boxShadow
		const parts = cs.boxShadow.split(/,(?![^(]*\))/).map((x) => x.trim())
		const rest = parts.filter((x) => !/^\S.*\)\s+0px\s+0px\s+0px\s+[\d.]+px(\s+inset)?$|^(inset\s+)?\S.*\)\s+0px\s+0px\s+0px\s+[\d.]+px$/.test(x))
		return rest.length ? rest.join(', ') : 'none'
	}
	// The colour of the border people see: the border's own, or the ring's when only a ring draws one.
	const seenBorderColour = (cs) => (Object.values(borders(cs)).some((v) => v > 0) || !ring(cs) ? cs.borderTopColor : ring(cs).color)
	// The border people see around a field: its own (3+ sides) or ring, else that of a wrapper that hugs it (NcInputField
	// and NcSelect draw theirs on a wrapper, not on the inner input).
	const fieldBorder = (el) => {
		const r0 = el.getBoundingClientRect()
		for (let e = el, i = 0; e && e !== document.body && i < 5; e = e.parentElement, i++) {
			const r = e.getBoundingClientRect()
			if (i > 0 && (r.height > r0.height + 12 || r.width > r0.width + 64 || r.left > r0.left + 1 || r.top > r0.top + 1 || r.right < r0.right - 1 || r.bottom < r0.bottom - 1)) break
			const cs = getComputedStyle(e)
			const b = borders(cs)
			if (Object.values(b).filter((v) => v > 0).length >= 3) return { width: b.top || b.bottom || b.left, color: cs.borderTopColor }
			const g = ring(cs)
			if (g) return g
		}
		return { width: 0, color: null }
	}
	// The box people see as the field: the outermost wrapper that hugs it (NcSelect draws its chevron beside the input,
	// inside that wrapper).
	const fieldBox = (el) => {
		const r0 = el.getBoundingClientRect()
		let boxEl = el
		for (let e = el.parentElement, i = 1; e && e !== document.body && i < 5; e = e.parentElement, i++) {
			const r = e.getBoundingClientRect()
			if (r.height > r0.height + 12 || r.width > Math.max(r0.width + 64, r0.width * 1.6) || r.left > r0.left + 1 || r.top > r0.top + 1 || r.right < r0.right - 1 || r.bottom < r0.bottom - 1) break
			boxEl = e
		}
		return boxEl
	}
	const box = (cs, prop) => Object.fromEntries(SIDES.map((s) => [s.toLowerCase(), px(cs[prop + s])]))
	// The top-left corner radius as drawn: a percentage resolves against the box, and radii larger than the box
	// shrink the way CSS shrinks them, so 50%, 18px and 999px on a 36px circle all read 18.
	// A transparent border the ground is not painted under (background-clip: padding-box; a switch's hit area) is not
	// where the part is drawn: its widths, to take off the box.
	const hitArea = (cs) => (cs.backgroundClip !== 'border-box' && !opaque(cs.borderTopColor)
		? { top: px(cs.borderTopWidth), right: px(cs.borderRightWidth), bottom: px(cs.borderBottomWidth), left: px(cs.borderLeftWidth) }
		: { top: 0, right: 0, bottom: 0, left: 0 })
	const radius = (el, cs) => {
		const r = el.getBoundingClientRect()
		const len = (v, side) => (/%$/.test(v) ? (parseFloat(v) / 100) * side : px(v))
		const corner = (c) => { const [h, v = h] = cs['border' + c + 'Radius'].split(' '); return [len(h, r.width), len(v, r.height)] }
		const [tl, tr, br, bl] = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(corner)
		const f = Math.min(1, ...[[r.width, tl[0] + tr[0]], [r.width, bl[0] + br[0]], [r.height, tl[1] + bl[1]], [r.height, tr[1] + br[1]]].map(([side, sum]) => (sum > 0 ? side / sum : 1)))
		return round(Math.min(tl[0], tl[1]) * f)
	}
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
	// A box on a line: its vertical middle lies well inside the line's run of text, 3px clear of its top and bottom (a
	// pill centred beside a due date that wrapped to two lines). A box centred between two separate lines (beside a
	// title and its meta line) is on neither, however tight the two lines are set.
	const sameLine = (line, b) => { const mid = (b.y + (b.b ?? b.y)) / 2; return mid >= line.y + 3 && mid <= (line.lb ?? line.b ?? line.y) - 3 }
	// An open modal dialog covers the page with its scrim: only what is inside the dialog is in view.
	const modals = [...document.querySelectorAll('[aria-modal=true]')].filter(visible)
	// The app top bar and the left navigation are chrome around every page; they are not page components. A spec can
	// mark more chrome to leave out (compdiff --ignore), such as an editor's own button on a public site.
	const outOfScope = (el) => {
		if (el.closest('header[data-sc-header], #header, #app-navigation, #app-navigation-vue, .app-navigation, #appmenu, [data-compdiff-ignore]')) return true
		// A map's attribution is the tile provider's credit, not part of the page.
		if (el.closest('.leaflet-control-attribution, .maplibregl-ctrl-attrib, .mapboxgl-ctrl-attrib, .ol-attribution')) return true
		// A select's listbox appended to the body (NcSelect) belongs to the dialog that opened it.
		if (modals.length && !modals.some((m) => m.contains(el)) && !el.closest('[role=listbox]')) return true
		// The content of a closed disclosure is laid out but not shown: Chrome keeps its boxes.
		const closed = el.closest('details:not([open])')
		if (closed && !el.closest('summary') && el !== closed) return true
		const r = el.getBoundingClientRect()
		// A floating launcher pinned to the window's lower right corner (the AI assistant button) is app chrome: it
		// sits over the content and follows the window, not the page.
		if (r.width <= 72 && r.height <= 72 && r.right >= window.innerWidth - 120 && r.bottom >= window.innerHeight - 140 && !el.closest('[role=dialog]')) {
			for (let e = el, i = 0; e && i < 4; e = e.parentElement, i++) if (/fixed|sticky/.test(getComputedStyle(e).position) || (getComputedStyle(e).position === 'absolute' && e.getBoundingClientRect().bottom >= window.innerHeight - 140)) return true
		}
		return (r.x < 250 && r.right < 300) || r.bottom <= 70
	}
	const all = [...document.body.querySelectorAll('*')].filter((el) => !['SCRIPT', 'STYLE', 'LINK', 'META', 'svg', 'path', 'TR', 'TD', 'TH', 'THEAD', 'TBODY', 'BR', 'OPTION'].includes(el.tagName))
	// Tab strips: a tablist, or a nav of page links whose current page carries aria-current (nc-vue's page tabs, which
	// navigate and so are links, not role=tab) laid out on one row. A breadcrumb trail is not a tab strip.
	const isCurrent = (e) => e.getAttribute('aria-selected') === 'true' || /^(page|true|location)$/.test(e.getAttribute('aria-current') || '')
	const tabItems = (s) => [...s.querySelectorAll(s.matches('[role=tablist]') ? '[role=tab]' : 'a, [role=link]')].filter(visible)
	const isPageTabs = (n) => {
		if (n.closest('[role=tablist]') || n.querySelector('[role=tablist]') || outOfScope(n)) return false
		if (/breadcrumb|kruimel|paginat|paginer|pager/i.test(`${n.className} ${n.getAttribute('aria-label') || ''}`)) return false
		const items = tabItems(n)
		if (!items.length) return false
		const top = items[0].getBoundingClientRect().top
		if (items.some((i) => Math.abs(i.getBoundingClientRect().top - top) > 4)) return false
		return /page-tabs/.test(n.className) || (n.matches('nav[aria-label]') && items.length >= 2 && items.some(isCurrent))
	}
	const pageTabs = [...document.querySelectorAll('nav[aria-label], [class*=page-tabs]')].filter((n) => visible(n) && isPageTabs(n))
	const tabStrips = [...document.querySelectorAll('[role=tablist]'), ...pageTabs.filter((n) => !pageTabs.some((o) => o !== n && o.contains(n)))]
	const inTabStrip = (el) => tabStrips.some((s) => s.contains(el))
	const CONTROL_BOX = 'button, [role=button], input, select, textarea'
	// An icon-only control drawn as an aria-labelled span (a row menu inside a card that is one link, where a button
	// would be invalid HTML) is a control as a button is: no text, an icon, the size of a button.
	const iconControl = (e) => {
		if (ariaHidden(e) || e.textContent.trim() || !e.querySelector('svg, img, [class*=icon]')) return false
		const r = e.getBoundingClientRect()
		return r.width >= 16 && r.width <= 48 && r.height >= 16 && r.height <= 48
	}
	const ACTION = 'a, button, [role=button], span[aria-label], div[aria-label]'
	const INTERACTIVE = 'button, input, select, textarea, a, label, [role=button], [role=tab], [role=option], [role=combobox], [role=checkbox], [role=switch]'

	// 1. Cards: a framed box (3+ borders, a shadow, or a background unlike what is behind it), big enough to hold content.
	const framed = (el, cs) => {
		const b = borders(cs)
		const nb = Object.values(b).filter((v) => v > 0).length
		if (nb >= 3) return 'border'
		if (cs.boxShadow !== 'none' && !/^rgba\(0, 0, 0, 0\)/.test(cs.boxShadow)) return 'shadow'
		if (opaque(cs.backgroundColor) && el.parentElement && cs.backgroundColor !== bgBehind(el.parentElement)) return 'background'
		// A side panel docked at the right edge, ruled off by its left border only (NcAppSidebar: white inside a white
		// app container, beside the grey work ground), is the panel a board draws as a white box on the work ground.
		const r = el.getBoundingClientRect()
		if (b.left > 0 && !b.right && r.right >= VW - 2 && r.width >= 240 && r.width <= VW * 0.4 && r.height >= window.innerHeight * 0.6 && opaque(cs.backgroundColor)) return 'side'
		return null
	}
	// A map: a map library's container, or a drawn placeholder (role=img named as a map). It is measured for its place
	// and size only: tiles, a placeholder's tint and its corners are not styling to compare.
	const MAPLIB = '.leaflet-container, .maplibregl-map, .mapboxgl-map, .ol-viewport'
	// A widget's Leaflet mount point (CnMapWidget's `__leaflet` box) is the map's box before Leaflet has loaded into it.
	const mapMount = (el) => [...el.classList].some((c) => /(^|__)leaflet$/.test(c))
	const isMap = (el) => el.matches(MAPLIB) || mapMount(el) || (el.matches('[role=img]') && /^kaart\b|\bmap\b/i.test(el.getAttribute('aria-label') || ''))
	// A drawn map is often an svg (role=img), which `all` leaves out, so those are looked at too.
	const mapCandidates = [...all, ...document.querySelectorAll('svg[role=img]')]
	const maps = mapCandidates.filter((el) => visible(el) && !outOfScope(el) && isMap(el) && !mapCandidates.some((o) => o !== el && o.contains(el) && isMap(o)))
	const inMap = (el) => maps.some((m) => m.contains(el))
	// The frame around a map that holds nothing else is the map's own edge, not a card.
	const framesMap = (el) => maps.some((m) => {
		if (!el.contains(m) || el === m) return false
		const a = el.getBoundingClientRect(), b = m.getBoundingClientRect()
		return Math.abs(a.left - b.left) <= 4 && Math.abs(a.top - b.top) <= 4 && Math.abs(a.right - b.right) <= 4 && Math.abs(a.bottom - b.bottom) <= 4
	})
	const pageTitle = [...document.querySelectorAll('h1')].find((h) => visible(h) && !outOfScope(h) && !h.closest('[role=dialog]')) || null
	let cards = []
	for (const el of all) {
		// Links can be cards (a KPI tile is often one big <a>), and so can a framed label (a choice card, a checkbox
		// box); other controls are not.
		if ((el.matches(INTERACTIVE) && el.tagName !== 'A' && el.tagName !== 'LABEL') || el.matches('table, ul[role=listbox]') || tabStrips.includes(el)) continue
		if (!visible(el) || outOfScope(el) || inMap(el) || framesMap(el)) continue
		const r = el.getBoundingClientRect()
		// A notice band (role note, status or alert) is a card at one line of text too: whether its words wrap to a
		// second line follows the data.
		const band = el.matches('[role=note], [role=status], [role=alert]') && r.height >= 32
		if (r.width < 140 || r.height < 32 || (r.height < 48 && !band && r.width < 400)) continue
		const cs = getComputedStyle(el)
		// Under 48px only a notice band is a card: one with that role, or a wide tinted line of text with no control in
		// it (a board's info note, a live banner widget), framed by its ground or by a border around its ground.
		const tinted = opaque(cs.backgroundColor) && el.parentElement && cs.backgroundColor !== bgBehind(el.parentElement)
		if (r.height < 48 && !band && !((framed(el, cs) === 'background' || (framed(el, cs) === 'border' && tinted)) && el.textContent.trim() && !el.querySelector(INTERACTIVE))) continue
		if ((cs.position === 'fixed' || cs.position === 'absolute') && r.width >= VW * 0.9) continue
		if (r.width >= VW * 0.75 && r.height >= window.innerHeight * 0.6) continue
		// The column that holds the page's title is the page (narrowed by an open side panel), not a card on it.
		if (pageTitle && el.contains(pageTitle) && r.height >= window.innerHeight * 0.6) continue
		const kind = framed(el, cs)
		if (!kind) continue
		cards.push({ el, kind })
	}
	// A framed item among framed siblings of the same kind that are too short to be cards is a row of that list, not
	// a card: whether one tile reaches 48px depends on how its text wraps (a long status name), not on what it is.
	// The frame can sit on an element that fills a list item (live's status tiles draw it inside the li), so the
	// item is read at the outermost element with the same box, and a sibling counts when it or the element filling it
	// is framed.
	const sameBox = (a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.x - q.x) <= 1 && Math.abs(p.y - q.y) <= 1 && Math.abs(p.right - q.right) <= 1 && Math.abs(p.bottom - q.bottom) <= 1 }
	const itemOf = (el) => { let e = el; while (e.parentElement && e.parentElement !== document.body && sameBox(e, e.parentElement)) e = e.parentElement; return e }
	const framedFill = (s) => { for (let e = s; e; e = [...e.children].find((k) => sameBox(k, s)) || null) if (framed(e, getComputedStyle(e))) return true; return false }
	// A short framed sibling that holds a field or a control (a 40px input box) is a form part, not a row of a list.
	const formPart = (s) => s.matches('input, select, textarea, button, [role=combobox]') || !!s.querySelector('input:not([type=hidden]), select, textarea, button, [role=combobox]')
	const rowSibling = (el) => { const item = itemOf(el); return !!item.parentElement && [...item.parentElement.children].some((s) => s !== item && s.tagName === item.tagName && visible(s) && framedFill(s) && s.getBoundingClientRect().height < 48 && !formPart(s)) }
	cards = cards.filter((c) => !c.el.parentElement || !rowSibling(c.el))
	// Collapse wrappers that draw the same box (grid item around widget wrapper): keep the one with the most border sides, else the inner one.
	const same = (a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.x - q.x) <= 3 && Math.abs(p.y - q.y) <= 3 && Math.abs(p.right - q.right) <= 3 && Math.abs(p.bottom - q.bottom) <= 3 }
	const nBorders = (el) => Object.values(borders(getComputedStyle(el))).filter((v) => v > 0).length
	cards = cards.filter((c) => !cards.some((d) => d !== c && same(c.el, d.el) && ((c.el.contains(d.el) && nBorders(d.el) >= nBorders(c.el)) || (d.el.contains(c.el) && nBorders(d.el) > nBorders(c.el)))))
	// A frame drawn in two boxes: a box open at the bottom (a table container) closed by the box right under it at the
	// same x and width (its pager). People see one card; it takes the lower box's bottom border, and the lower box is
	// not a card of its own.
	const continuation = new Map()
	for (const c of cards) {
		const b = borders(getComputedStyle(c.el))
		if (b.bottom || !b.left || !b.right) continue
		const r = c.el.getBoundingClientRect()
		const d = cards.find((o) => o !== c && !c.el.contains(o.el) && !o.el.contains(c.el) && (() => { const q = o.el.getBoundingClientRect(); const ob = borders(getComputedStyle(o.el)); return Math.abs(q.left - r.left) <= 1 && Math.abs(q.width - r.width) <= 1 && Math.abs(q.top - r.bottom) <= 1 && ob.bottom > 0 && ob.left > 0 && ob.right > 0 })())
		if (d) continuation.set(c.el, d.el)
	}
	cards = cards.filter((c) => ![...continuation.values()].includes(c.el))
	const cardEls = new Set(cards.map((c) => c.el))
	const ownerCard = (el) => { for (let e = el.parentElement; e; e = e.parentElement) if (cardEls.has(e)) return e; return null }
	const ownedBy = (node, card) => { const p = node.nodeType === 1 ? node : node.parentElement; if (!card.contains(p)) return false; for (let e = p; e && e !== card; e = e.parentElement) if (cardEls.has(e)) return false; return true }

	// Content leaves of a card: text runs, plus icons, images, inputs and coloured dots/bars.
	const pseudoBox = (el) => ['::before', '::after'].some((w) => {
		const ps = getComputedStyle(el, w)
		if (!ps.content || ps.content === 'none' || ps.display === 'none') return false
		const box = opaque(ps.backgroundColor) || Object.values(borders(ps)).some((v) => v > 0)
		return box && px(ps.width) >= 8 && px(ps.height) >= 8
	})
	const leavesOf = (card) => {
		const out = []
		const range = document.createRange()
		const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (!n.textContent.trim() || !n.parentElement || !visible(n.parentElement) || !ownedBy(n, card) || inMap(n.parentElement)) continue
			range.selectNodeContents(n)
			const q = [...range.getClientRects()].find((x) => x.width >= 1)
			// Text placed off the page (an off-screen live region or a skip label at left -10000px) is not seen.
			if (q && (q.right < 0 || q.left > VW || q.bottom < 0)) continue
			// lb: the bottom of the whole run, past the first line when it wraps.
			if (q) out.push({ node: n.parentElement, x: q.left, y: q.top, r: q.right, b: q.bottom, lb: range.getBoundingClientRect().bottom, text: true })
		}
		// A map is one part, at its own box: its tiles carry no text, and its overlay controls (zoom buttons) are the
		// map's, not the card's first row.
		for (const m of maps) {
			if (m === card || !ownedBy(m, card)) continue
			const q = m.getBoundingClientRect()
			out.push({ node: m, x: q.left, y: q.top, r: q.right, b: q.bottom, text: false })
		}
		for (const el of card.querySelectorAll('svg, img, input, select, textarea, progress, canvas, button, [role=progressbar], span, i, div')) {
			if (!ownedBy(el, card) || !visible(el) || inMap(el)) continue
			const isMedia = el.matches('svg, img, input, select, textarea, progress, canvas, [role=progressbar]')
			const cs = getComputedStyle(el)
			// A coloured dot may hold an element nobody sees (a 0x0 overlay image placed off screen): still a dot. So is a
			// small filled box without text that holds parts of its own (a switch's track with its knob, an icon tile), and a
			// square tile up to 48px with initials in it: the tile is what people see first, whether its corners are set as
			// 16px or as 50%, and whether its row sets it level with the name's top or centred on two lines.
			const box = el.getBoundingClientRect()
			const filled = opaque(cs.backgroundColor) && cs.backgroundColor !== bgBehind(el.parentElement || el)
			const isDot = filled && (!el.textContent.trim()
				? (![...el.children].some(visible) || (box.height <= 48 && box.width <= 96))
				: box.height >= 16 && box.height <= 48 && Math.abs(box.width - box.height) <= 4 && el.textContent.trim().length <= 3)
			// A box drawn by a pseudo-element (NcCheckboxRadioSwitch's checkbox as a ::before on .checkbox-content__icon)
			// is a part where its element sits.
			// So is an empty box drawn by its border alone (a board's checkbox as a bordered span), as the svg glyph that
			// draws the same box on live is.
			const isFrame = !el.textContent.trim() && ![...el.children].some(visible) && box.height <= 48 && box.width <= 48 && nBorders(el) >= 3
			if (!isMedia && !isDot && !isFrame && !pseudoBox(el)) continue
			if (el.closest('svg') && el.tagName !== 'svg') continue
			// A transparent border its ground is not painted under (a switch's hit area) is not where the part is drawn.
			const b = hitArea(cs)
			const q0 = el.getBoundingClientRect()
			const q = { left: q0.left + b.left, top: q0.top + b.top, right: q0.right - b.right, bottom: q0.bottom - b.bottom, width: q0.width - b.left - b.right, height: q0.height - b.top - b.bottom }
			if (q.width < 3 || q.height < 3 || q.right < 0 || q.left > VW || q.bottom < 0) continue
			out.push({ node: el, x: q.left, y: q.top, r: q.right, b: q.bottom, text: false })
		}
		// What starts below the captured frame is in neither picture: a card that runs on past it (a side column made
		// taller by its data) is measured on the part people see in the capture.
		return card.getBoundingClientRect().top < window.innerHeight ? out.filter((l) => l.y < window.innerHeight) : out
	}

	const headingIn = (card, cr, role) => {
		// Skip visually hidden headings (NcDialog's 1px h2.dialog__name): measure the title people see.
		const hs = [...card.querySelectorAll('h1, h2, h3, h4, h5, h6, [role=heading], legend')].filter((h) => ownedBy(h, card) && visible(h) && h.textContent.trim() && h.getBoundingClientRect().width > 4 && h.getBoundingClientRect().height > 4)
		// A dialog's title sits at its top: a section heading further down is not it, however tall the dialog.
		const top = hs.find((h) => h.getBoundingClientRect().top - cr.top < (role === 'dialog' ? 90 : Math.max(90, cr.height * 0.4)))
		// A small heading over a much larger bold line is a kicker (an eyebrow: "Vandaag eerst" over the case title):
		// the larger line is the card's title, as it is where the kicker is set as a paragraph.
		if (top && px(getComputedStyle(top).fontSize) <= 13) {
			const tr = top.getBoundingClientRect(), size = px(getComputedStyle(top).fontSize)
			const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
			const range = document.createRange()
			for (let n = walker.nextNode(); n; n = walker.nextNode()) {
				if (!n.textContent.trim() || !n.parentElement || top.contains(n) || !visible(n.parentElement) || !ownedBy(n, card) || n.parentElement.closest(INTERACTIVE)) continue
				range.selectNodeContents(n)
				const q = range.getBoundingClientRect()
				if (q.top < tr.bottom - 1) continue
				if (q.top - tr.bottom > 40) break
				const cs = getComputedStyle(n.parentElement)
				if (Number(cs.fontWeight) >= 600 && px(cs.fontSize) >= size * 1.4) return n.parentElement
			}
		}
		if (top) return top
		// No heading element: a bold run of text at the top of the card serves as its title. In a dialog the top can
		// hold an eyebrow over the title, so there the largest bold line near the top is the title. A card keeps the
		// first one: its second line is often a bigger value (a KPI), not a title.
		const range = document.createRange()
		const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
		let first = null, best = null, bestSize = 0
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (!n.textContent.trim() || !n.parentElement || !visible(n.parentElement) || !ownedBy(n, card)) continue
			range.selectNodeContents(n)
			const q = range.getBoundingClientRect()
			if (first === null) {
				if (q.top - cr.top > 64) break
				first = q.top
			} else if (q.top - first > 40) break
			const cs = getComputedStyle(n.parentElement)
			// A table's head cell is the table's, not the title of the card that frames it.
			// A control's label is no title, but a plain link around the title text (a record card's title links to the
			// record) is: it is drawn as text, without a button's ground or border.
			// A card that is itself one link (a record card) is no control around its own title.
			const ctl = n.parentElement.closest(INTERACTIVE)
			const own = ctl && (ctl === card || ctl.contains(card))
			// So is a button drawn as text around it (a map list's name, which a board sets as a link).
			const plainLink = ctl && (ctl.tagName === 'A' || (ctl.tagName === 'BUTTON' && !ctl.querySelector('svg, img') && px(cs.fontSize) >= 15)) && !opaque(getComputedStyle(ctl).backgroundColor) && !Object.values(borders(getComputedStyle(ctl))).some((v) => v > 0)
			// A choice row's label (a radio or checkbox with its option title, nested in the option's card beside its
			// details) carries the option's title, as it does when the label is the whole card.
			const choiceLabel = ctl && ctl.tagName === 'LABEL' && !!ctl.querySelector('input[type=radio], input[type=checkbox], [role=radio], [role=checkbox]')
			// A pill in the card's head row (a status, a priority) comes before the title; it is not the title. Nor is an
			// avatar's initial (a filled circle up to 44px).
			const inPill = (() => { for (let e = n.parentElement; e && e !== card; e = e.parentElement) { const ecs = getComputedStyle(e), er = e.getBoundingClientRect(); if ((er.height <= 30 || (er.height <= 44 && Math.abs(er.width - er.height) <= 2)) && er.width <= 200 && opaque(ecs.backgroundColor) && ecs.backgroundColor !== getComputedStyle(card).backgroundColor && px(ecs.borderTopLeftRadius) >= er.height / 2 - 1) return true } return false })()
			if (inPill) continue
			if (Number(cs.fontWeight) < 600 || px(cs.fontSize) < 13 || (ctl && !own && !plainLink && !choiceLabel) || n.parentElement.closest('th, thead, [role=columnheader]')) {
				// A record number in a head row (2026-0082 beside a pill) does not end the search for the title under it;
				// any other plain line does (a KPI tile's label above its bigger value).
				if (best === null && !/^[A-Z]{0,4}[\s-]?\d{2,4}[-./]\d{2,6}$/.test(n.textContent.trim())) break
				continue
			}
			// A card's small bold kicker (13px or less: "Offline · gesynchroniseerd" over "Vandaag") gives way to a larger
			// bold line of words right under it, as a heading kicker does; a larger figure (a KPI's value) does not.
			if (best && role !== 'dialog' && !/\p{L}{3}/u.test(n.textContent)) break
			const kicker = best && role !== 'dialog' && bestSize <= 13
			if (kicker ? px(cs.fontSize) >= bestSize * 1.4 : px(cs.fontSize) > bestSize) { best = n.parentElement; bestSize = px(cs.fontSize) }
			if (role !== 'dialog' && (bestSize > 13 || best !== n.parentElement)) break
		}
		return best
	}

	// The padding people see: a card that pads its header and body rows (cn-widget-wrapper) instead of itself has its
	// top from the first row, its bottom from the last, and its sides from the rows that span its full width.
	const cardPadding = (card, cs) => {
		const own = box(cs, 'padding')
		const cr = card.getBoundingClientRect()
		const rows = [...card.children].filter((c) => visible(c) && !/absolute|fixed/.test(getComputedStyle(c).position))
		const inner = cr.width - own.left - own.right - px(cs.borderLeftWidth) - px(cs.borderRightWidth)
		if (!rows.length || rows.some((c) => c.getBoundingClientRect().width < inner - 1)) return own
		const pad = rows.map((c) => box(getComputedStyle(c), 'padding'))
		return {
			top: own.top || pad[0].top, bottom: own.bottom || pad[pad.length - 1].bottom,
			left: own.left || Math.min(...pad.map((p) => p.left)), right: own.right || Math.min(...pad.map((p) => p.right)),
		}
	}
	// A popup: a menu, or a card placed over the page (absolute or fixed, stacked with a z-index) with a shadow. The
	// placing and the shadow may sit on wrappers
	// (NcActions' popover: an absolutely placed .v-popper__popper around a static .v-popper__inner that draws the card),
	// so the card and its ancestors up to the nearest placed one are looked at, the card itself included.
	const popupOf = (card) => {
		if (card.matches('[role=menu], [role=listbox]')) return true
		let shadow = false
		for (let e = card; e && e !== document.body; e = e.parentElement) {
			const ecs = getComputedStyle(e)
			if (ecs.boxShadow !== 'none' && !/^rgba\(0, 0, 0, 0\)/.test(ecs.boxShadow)) shadow = true
			if (/absolute|fixed/.test(ecs.position)) return shadow && ecs.zIndex !== 'auto' && e.getBoundingClientRect().width < VW * 0.5
		}
		return false
	}
	const titleBoxes = new Map()
	const describeCard = (card, role, record = false) => {
		const cs = getComputedStyle(card)
		const cr = card.getBoundingClientRect()
		const comp = { el: card, role, rect: rect(card), frame: framed(card, cs), depth: 0 }
		// A menu or a floating panel (placed over the page with a shadow) is a popup: it pairs only with a popup.
		if (role === 'card' && popupOf(card)) comp.popup = true
		for (let e = ownerCard(card); e; e = ownerCard(e)) comp.depth++
		comp.props = {
			padding: cardPadding(card, cs), margin: box(cs, 'margin'), border: continuation.has(card) ? { ...seenBorders(cs), bottom: seenBorders(getComputedStyle(continuation.get(card))).bottom } : seenBorders(cs), borderColor: seenBorderColour(cs),
			borderRadius: radius(card, cs), background: bgBehind(card), boxShadow: shadowBeyondRing(cs),
			gap: /flex|grid/.test(cs.display) ? px(cs.rowGap) : null,
		}
		const leaves = leavesOf(card)
		const title = headingIn(card, cr, role)
		let headerRow = null, titleBox = null
		if (title) {
			comp.title = title.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)
			titleBox = textRect(title) || rect(title)
			titleBoxes.set(card, titleBox)
			headerRow = title
			// Climb to the header row: the widest ancestor that still holds only the title line.
			for (let p = title.parentElement; p && p !== card && card.contains(p); p = p.parentElement) {
				const pr = p.getBoundingClientRect()
				// A wrapping header row whose actions wrapped under the title in a narrow card is still the header row.
				const wraps = getComputedStyle(p).flexWrap === 'wrap'
				const inAction = (l) => { const e = l.node.nodeType === 1 ? l.node : l.node.parentElement; return !!(e && e.closest('a, button, [role=button]')) }
				// A subtitle set right under the title in the same heading block (CnTimelineManage's title + description)
				// belongs to the title, so the row with the heading's actions is still the header row.
				const titleSize = px(getComputedStyle(textEl(title)).fontSize)
				const subtitle = (l) => !record && l.text && l.y <= titleBox.y + titleBox.h + 32 && px(getComputedStyle(l.node.nodeType === 1 ? l.node : l.node.parentElement).fontSize) < titleSize
				// A row taller than a title line is past the header, unless all it holds under the title is a subtitle
				// (one that wraps to a second line, CnWidgetWrapper on DqZaaktypeVelden "Velden") and the actions beside it.
				// Actions that wrapped under the subtitle (DqZaaktype "Fasen en taken") end the header at the subtitle.
				const titleAndSubtitle = leaves.every((l) => !p.contains(l.node) || l.y <= titleBox.y + titleBox.h + 4 || subtitle(l) || (inAction(l) && l.x >= titleBox.x + titleBox.w))
				if (pr.height > titleBox.h + 56 && !titleAndSubtitle) break
				// In a record card a line of text under the title (its number line) is a row of its own, however tight; a link
				// or button there ("Alles bekijken" under a widget's title) stays in the header, as its action.
				const ownControl = (l) => { const e = l.node.nodeType === 1 ? l.node : l.node.parentElement; const c = e && e.closest('a, button, [role=button]'); return !!c && c !== card && card.contains(c) }
				// So is one line of links or buttons stacked right under the title in the title's own block (CnWidgetWrapper's
				// title stack with "Alles bekijken" under the title), when that block holds nothing else.
				const under = leaves.filter((l) => p.contains(l.node) && l.y > titleBox.y + titleBox.h + 4)
				const rowOf = (l) => (l.node.nodeType === 1 ? l.node : l.node.parentElement).closest('li, tr, [role=row], [role=listitem]')
				const stackedAction = under.length > 0 && under.every((l) => ownControl(l) && !rowOf(l) && l.y <= titleBox.y + titleBox.h + 16 && Math.abs(l.y - under[0].y) <= 4)
				if (!stackedAction && leaves.some((l) => p.contains(l.node) && l.y > titleBox.y + titleBox.h + (record && l.text && !ownControl(l) ? -1 : 4) && !(wraps && inAction(l)) && !subtitle(l))) break
				headerRow = p
			}
			const hcs = getComputedStyle(headerRow)
			const actions = [...headerRow.querySelectorAll(ACTION)].filter((a) => visible(a) && !title.contains(a) && ownedBy(a, card) && (!a.matches('[aria-label]:not(a, button, [role=button])') || iconControl(a))).filter((a, _, all) => !all.some((o) => o !== a && o.contains(a)))
			// A button set on the title's line from outside the title's row (NcSettingsSection puts its actions in a
			// sibling placed in the title row) is a header action too: what counts is the line it sits on.
			const titleMid = titleBox.y + titleBox.h / 2
			for (const a of card.querySelectorAll(ACTION)) {
				if (a.matches('[aria-label]:not(a, button, [role=button])') && !iconControl(a)) continue
				if (actions.includes(a) || !visible(a) || title.contains(a) || !ownedBy(a, card) || actions.some((b) => b.contains(a) || a.contains(b))) continue
				const ar = a.getBoundingClientRect()
				if (ar.left >= titleBox.x + titleBox.w && Math.abs((ar.top + ar.bottom) / 2 - titleMid) <= Math.max(ar.height, titleBox.h) / 2) actions.push(a)
			}
			// A dialog's close button is the dialog's own chrome, drawn by both sides in their own place (in the title
			// row, or in the corner by NcDialog): it is not a header action of the dialog's content.
			if (role === 'dialog' || role === 'dialog-card') {
				const closing = (a) => /^(sluiten|close|dialoog sluiten|close dialog|annuleren|cancel)$/i.test((a.getAttribute('aria-label') || a.getAttribute('title') || '').trim()) || /(^|[_-])close\b/i.test(String(a.className))
				for (let i = actions.length - 1; i >= 0; i--) if (closing(actions[i])) actions.splice(i, 1)
			}
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
		// A description set beside the title rather than in a wrapper with it (NcSettingsSection's flat
		// h2 + .settings-section__desc) belongs to the header, as it does when a wrapper holds both.
		// So is a plain line of smaller text set right under the title (a board's h2 + p): a description, not content.
		const next = headerRow && headerRow.nextElementSibling
		const plainLine = (e) => {
			// A chart or picture is content, though an svg chart holds text (its axis labels).
			if (!e || !visible(e) || !e.textContent.trim() || e.matches('svg, canvas, img, picture, figure, [role=img]') || e.querySelector(INTERACTIVE + ', [role=combobox], table, ul, ol, img, svg, canvas')) return false
			// Facts, a row of pills or a list of rows is content: a description is plain text, at most two lines, with no
			// boxed part (a pill or a framed row) and no term list.
			if (e.matches('dl') || e.querySelector('dl, dt, li')) return false
			const ecs = getComputedStyle(e)
			const lh = px(ecs.lineHeight) || px(ecs.fontSize) * 1.25
			if (e.getBoundingClientRect().height > lh * 2 + 2) return false
			if ([...e.querySelectorAll('*')].some((d) => { const dcs = getComputedStyle(d); return opaque(dcs.backgroundColor) || Object.values(borders(dcs)).some((v) => v > 0) })) return false
			const top = e.getBoundingClientRect().top - (titleBox.y + titleBox.h)
			// A description reads as one: smaller than the title and either 14px or less, or muted. A 15px line in the
			// title's own ink ("Deze zaak hangt niet onder een programma.") is the card's content.
			const tcs = getComputedStyle(textEl(title))
			// Muted means a grey well lighter than the title's ink (#5e6168 against #1b1c1d), not a second dark text
			// colour (#3d4047), which reads as body text.
			const mean = (c) => { const v = rgba(c); return v ? (v[0] + v[1] + v[2]) / 3 : 0 }
			const muted = mean(ecs.color) - mean(tcs.color) > 50
			// On a card a line in a dark text colour is content however small ("Laatst gewijzigd op 3 oktober door ..." over
			// its Historie link, which the app sets as a facts row); a dialog's head may set its description in ink.
			return top >= -1 && top <= 12 && px(ecs.fontSize) < px(tcs.fontSize) && (muted || (role !== 'card' && px(ecs.fontSize) <= 14))
		}
		// A record card's line under its title (number, type, handler) is its first row, not a description: the card's
		// height follows the row it sits in, so a gap measured past that line lands on a footer pinned to the bottom.
		// A line marked as a description (a settings section's __desc) stays one in a column of such cards.
		// A marked line belongs to the header only when it sits right under the title: set below a category line or an
		// icon row taller than the title (a catalogue card, a module card), it is the card's body text.
		const marked = (e) => e.matches('.settings-section__desc, [class*="__desc"], [class*="subtitle"], [class*="description"]') && (!titleBox || e.getBoundingClientRect().top - (titleBox.y + titleBox.h) <= 12)
		const desc = next && (marked(next) || (!record && plainLine(next))) ? next : null
		// A title read from the first row of a list card (a queue row's "6 dagen") takes that whole row with it: what
		// follows the title in its own row (the row's checkbox, its name and meta line) is not the card's content.
		let titleRows = []
		const titleRow = (() => {
			if (!title) return null
			for (let r = title.parentElement; r && r !== card && card.contains(r); r = r.parentElement) {
				const { width: w, height: h } = r.getBoundingClientRect()
				if (w < cr.width * 0.8) continue
				if (h > 160) return null
				const alike = r.parentElement ? [...r.parentElement.children].filter((s) => {
					const sr = s.getBoundingClientRect()
					return s !== r && s.tagName === r.tagName && s.children.length === r.children.length && visible(s) && Math.abs(sr.width - w) <= 2 && sr.height >= h * 0.6 && sr.height <= h * 1.6
				}) : []
				if (alike.length < 2) return null
				titleRows = alike
				return r
			}
			return null
		})()
		const inHeader = (n) => (headerRow && headerRow.contains(n)) || (desc && desc.contains(n)) || (titleRow && titleRow.contains(n))
		const content = leaves.filter((l) => !inHeader(l.node) && l.y >= below)
		if (content.length) {
			const top = Math.min(...content.map((l) => l.y))
			// An icon set beside the first line, a few px lower than its text (centred on a taller line), is still part
			// of that row: it starts inside the line's box.
			const lineBottom = Math.min(...content.filter((l) => l.y <= top + 6).map((l) => l.b))
			// A part centred on the first line is in the first row too, though it starts lower than the line's top (a pill
			// beside a due date that wrapped to two lines).
			const lead = content.filter((l) => l.y <= top + 6)
			// A control or icon in the same list row as the first line, set in the row's upper half (a drag handle centred on
			// a two-line name), is part of that row too.
			const ROWEL = 'li, [role=listitem], [role=row], [role=option]'
			const leadRow = lead.map((f) => (f.node.nodeType === 1 ? f.node : f.node.parentElement).closest(ROWEL)).find(Boolean)
			const inLeadRow = (l) => { if (!leadRow || l.text) return false; const rr = leadRow.getBoundingClientRect(); return leadRow.contains(l.node) && l.y < rr.top + rr.height / 2 }
			// In a list card titled by its first row, the first content row is the next row, all of it: its parts are
			// centred on the row, so a two-line name starts higher than the checkbox and the label beside it.
			const leadSibling = titleRows.find((s) => lead.some((f) => s.contains(f.node)))
			const firstRow = content.filter((l) => l.y <= top + 6 || (!l.text && l.y < lineBottom) || lead.some((f) => sameLine(f, l)) || inLeadRow(l) || (leadSibling && leadSibling.contains(l.node)))
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
				// A control's own border (a dashed "Toon meer" button under the title) is not a separator.
				if (!visible(el) || (el !== card && el.closest(CONTROL_BOX))) continue
				// A list row's own border is not a header separator: skip boxes holding some but not all of the body. The
				// first row's rule above it is the exception: it is drawn where a header's bottom border would be, and
				// reads the same (a record list's ruleAbove).
				const r = el.getBoundingClientRect()
				if (el !== card && content.length) {
					const n = content.filter((l) => el.contains(l.node)).length
					const firstTop = Math.min(...content.map((l) => l.y))
					const ruleAbove = borders(getComputedStyle(el)).top > 0 && r.top >= lo && r.top <= hi && content.some((l) => l.y <= firstTop + 1 && el.contains(l.node))
					if (n > 0 && n < content.length && !ruleAbove) continue
				}
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

	// Record cards: a card with two or more siblings of about its width (a deck, a card grid or a column of widgets).
	// Each is compared, with the order and placement of its parts as its structure; the count follows the data.
	// The text people read in an element: a glyph hidden from assistive tech (a menu toggle's "⋯") is an icon. A
	// control holding only such a glyph is no pill; an avatar's hidden initials still draw one.
	const readText = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t = ''; for (let n = w.nextNode(); n; n = w.nextNode()) if (n.parentElement && !ariaHidden(n.parentElement)) t += n.textContent; return t.trim() }
	const PILLISH = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); return r.height >= 12 && r.height <= 44 && r.width <= 320 && (el.matches('button, [role=button]') ? readText(el) : el.textContent.trim()) && ((opaque(cs.backgroundColor) && cs.backgroundColor !== bgBehind(el.parentElement)) || nBorders(el) >= 3) }
	const DATE = /\b\d{1,2}\s(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)|vandaag|morgen|gisteren|\bdag(en)?\b|\bweken?\b|over \d|nog \d|verlopen|termijn/i
	const NUMBER = /^[A-Z]{1,6}-?\d{2,}|^\d{4}[-/]\d+|^#?\d{3,}$|^ZK|^Z-\d/
	const structureOf = (card) => {
		const cr = card.getBoundingClientRect()
		const parts = []
		const seen = new Set()
		// A table is one part, compared as a table of its own: its rows follow the data. It counts whether the card
		// holds it directly or in a frame of its own (an object table's bordered wrapper).
		for (const t of card.querySelectorAll('table, [role=table], [role=grid]')) {
			if (!visible(t) || [...seen].some((s) => s.contains(t))) continue
			const r = t.getBoundingClientRect()
			parts.push({ t: 'table', y: r.top, b: r.bottom, x: r.left })
			seen.add(t)
		}
		for (const el of card.querySelectorAll('*')) {
			if (!visible(el) || !ownedBy(el, card)) continue
			if ([...seen].some((s) => s.contains(el))) continue
			const r = el.getBoundingClientRect()
			// A map is one part, drawn as an svg or by a map library with its tiles and controls.
			if (maps.includes(el)) { parts.push({ t: 'map', y: r.top, b: r.bottom, x: r.left }); seen.add(el); continue }
			const ecs = getComputedStyle(el)
			// A rule on top of what follows a framed head (a column frame's "Vandaag" head) is that head's bottom rule, as a
			// board draws it on the head itself: not a divider of the frame.
			const headRule = (y) => [...cardEls].some((h) => h !== card && card.contains(h) && Math.abs(h.getBoundingClientRect().bottom - y) <= 2)
			if (!el.closest(CONTROL_BOX) && (el.tagName === 'HR' || (r.height <= 2 && r.width > cr.width * 0.5 && opaque(ecs.backgroundColor)) || (borders(ecs).top > 0 && r.width > cr.width * 0.6 && r.top > cr.top + 4 && !headRule(r.top)))) { parts.push({ t: 'divider', y: r.top, b: r.top, x: r.left }); if (el.tagName === 'HR' || r.height <= 2) continue }
			if (PILLISH(el)) { parts.push({ t: DATE.test(el.textContent) ? 'pill:deadline' : 'pill', y: r.top, b: r.bottom, x: r.left }); seen.add(el); continue }
			// A chart is one part, whether it is drawn as an svg (whose axis labels are text) or on a canvas.
			if (el.matches('svg, canvas') && r.height >= 60 && r.width >= 120) { parts.push({ t: 'chart', y: r.top, b: r.bottom, x: r.left }); seen.add(el); continue }
		}
		const range = document.createRange()
		const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
		const texts = []
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			const t = n.textContent.trim()
			// Text hidden from assistive tech is a glyph drawn as text (a menu toggle's "⋯"), not a part of the card.
			if (!t || !n.parentElement || !visible(n.parentElement) || !ownedBy(n, card) || ariaHidden(n.parentElement) || [...seen].some((s) => s.contains(n.parentElement))) continue
			range.selectNodeContents(n)
			const q = range.getBoundingClientRect()
			// A text that wraps starts on its first line box and ends on its last.
			const lines = [...range.getClientRects()].filter((l) => l.width >= 1)
			// A text with no line box (a textarea's value, drawn by the field) is no part of the card.
			if (!lines.length) continue
			const first = lines[0], last = lines[lines.length - 1]
			const ecs = getComputedStyle(n.parentElement)
			// Runs of one line in one type, split over spans ("2026-0110", " · ", "Woo-verzoek"), are one text, as they
			// are when a board writes them as one string. So is such a run that wraps onto a next line.
			const prev = texts[texts.length - 1]
			const fs = px(ecs.fontSize), fw = Number(ecs.fontWeight)
			if (prev && prev.fs === fs && prev.fw === fw && Math.abs(prev.ly - first.top) <= 2 && first.left - prev.r >= -1 && first.left - prev.r <= fs * 1.2) { prev.t += ' ' + t; prev.r = last.right; prev.ly = last.top; prev.b = Math.max(prev.b, q.bottom); continue }
			texts.push({ t, y: q.top, b: q.bottom, x: q.left, r: last.right, ly: last.top, fs, fw })
		}
		const maxFs = Math.max(0, ...texts.filter((x) => x.fw >= 600).map((x) => x.fs))
		// A figure (a KPI tile's 76, 311 or 1.284, 12,5 %) is a number like a record number, however many digits it has.
		const FIGURE = /^\d{1,3}([.,\s]\d{3})*([.,]\d+)?\s?%?$/
		// A time of day ("15.00", "9:30") is a meta line, not a figure.
		const TIME = /^([01]?\d|2[0-3])[.:][0-5]\d$/
		for (const x of texts) parts.push({ t: TIME.test(x.t) ? 'meta' : NUMBER.test(x.t) || FIGURE.test(x.t) ? 'number' : DATE.test(x.t) ? 'deadline' : x.fw >= 600 && x.fs >= maxFs ? 'title' : 'meta', y: x.y, b: x.b, x: x.x })
		if (cr.top < window.innerHeight) for (let i = parts.length - 1; i >= 0; i--) if (parts[i].y >= window.innerHeight) parts.splice(i, 1)
		parts.sort((a, b) => a.y - b.y || a.x - b.x)
		// One row is one line: parts whose tops are close, or a box centred on a line of text (a pill beside a due date
		// that wrapped to two lines starts a few px lower than it; a 28px avatar starts higher than the name beside it).
		// A box centred between two lines of text (beside a title and its meta line) is on neither. The order in a row is
		// left to right.
		const rows = []
		for (const p of parts) {
			const box = /^(pill|chart|map)/.test(p.t)
			const row = rows.find((r) => Math.abs(r.y - p.y) <= 6 || (r.ty !== undefined && !box && Math.abs(r.ty - p.y) <= 6) || (box && r.b > r.y && sameLine(r, p)) || (!box && p.t !== 'divider' && r.parts.every((q) => /^(pill|chart|map)/.test(q.t)) && sameLine(p, r)))
			// ty: the top of the row's first text, the line later text lines up with.
			if (row) { row.parts.push(p); if (p.t !== 'divider') row.b = Math.max(row.b, p.b); if (!box && p.t !== 'divider' && row.ty === undefined) row.ty = p.y } else rows.push({ y: p.y, b: p.t === 'divider' ? p.y : p.b, parts: [p], ty: box || p.t === 'divider' ? undefined : p.y })
		}
		const out = []
		for (const r of rows) {
			const items = []
			for (const p of r.parts.sort((a, b) => a.x - b.x)) if (items[items.length - 1] !== p.t) items.push(p.t)
			const k = items.join(' ')
			if (out[out.length - 1] !== k) out.push(k)
		}
		return out.join(' / ')
	}
	const deckOf = new Map()
	// A card's slot: the card, or the wrapper around it that holds nothing else (a grid cell, a list item), so cards
	// wrapped one per cell are siblings as much as bare ones.
	const slotOf = (el) => { let s = el; while (s.parentElement && s.parentElement !== document.body && s.parentElement.children.length === 1) s = s.parentElement; return s }
	const cardIn = (slot) => (cardEls.has(slot) ? slot : [...cardEls].find((e) => slot.contains(e) && slotOf(e) === slot) || null)
	for (const c of components) {
		if (c.role !== 'card' || !c.el.parentElement) continue
		const slot = slotOf(c.el)
		const row = slot.parentElement
		if (!row) continue
		const sibs = [...row.children].map(cardIn).filter((e) => e && Math.abs(e.getBoundingClientRect().width - c.rect.w) < c.rect.w * 0.1)
		if (sibs.length < 3) continue
		if (!deckOf.has(row)) deckOf.set(row, deckOf.size + 1)
		c.record = { deck: deckOf.get(row), index: sibs.indexOf(c.el), count: sibs.length }
		// A record card proper (a card of a grid of cards, a link, a draggable or listed item) reads the line under its
		// title as its first row; a column of widgets or settings sections keeps its descriptions.
		// A card alone in the last row of a grid is a grid card too: the deck is a grid when any two of its cards stand side by side.
		const sideBySide = (a) => sibs.some((e) => e !== a && Math.abs(e.getBoundingClientRect().top - a.getBoundingClientRect().top) <= 4)
		const grid = sibs.some(sideBySide)
		if (grid || c.el.matches('a, [role=listitem], [draggable=true]') || c.el.closest('a, [role=listitem], [draggable=true]') !== null) {
			const asRecord = describeCard(c.el, 'card', true)
			c.content = asRecord.content
			c.header = asRecord.header
		}
		c.structure = structureOf(c.el)
	}

	// 2. Dialogs: the visible dialog box (a full-screen role=dialog mask is narrowed to its framed child).
	for (const d of document.querySelectorAll('[role=dialog], [role=alertdialog]')) {
		if (!visible(d)) continue
		// With a modal open, a non-modal dialog outside it (an incoming-call card) is behind it, as the page is.
		if (modals.length && !modals.some((m) => m.contains(d) || d.contains(m))) continue
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
		return { label: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), h: round(b.getBoundingClientRect().height), borderRadius: radius(b, bcs), paddingLeft: px(bcs.paddingLeft), paddingRight: px(bcs.paddingRight), fontSize: px(bcs.fontSize), fontWeight: Number(bcs.fontWeight), background: bgBehind(b), border: borders(bcs).top, color: bcs.color }
	}
	// 3. Page header: the first visible h1 and the buttons on its line.
	const h1 = [...document.querySelectorAll('h1')].find((h) => visible(h) && !outOfScope(h) && !h.closest('[role=dialog]'))
	if (h1) {
		let container = h1, scope = null
		for (let p = h1.parentElement; p && p !== document.body; p = p.parentElement) {
			const pr = p.getBoundingClientRect()
			if (pr.height > 150 || cardEls.has(p)) {
				// A header block that also holds the chips and the status stepper under the title (CnDetailPage) is
				// taller than one line, but the buttons on the title's line are still the header's.
				for (let q = p; q && q !== document.body && q.getBoundingClientRect().height <= 300 && !cardEls.has(q); q = q.parentElement) {
					if (q.matches('header, [class*=header]')) scope = q
				}
				break
			}
			container = p
		}
		scope = scope || container
		window.__compdiffPageHeader = container
		window.__compdiffPageHeaderScope = scope
		const tb = textRect(h1) || rect(h1)
		const btns = [...scope.querySelectorAll('button, a')].filter((b) => {
			// Tabs drawn inside the header area are a tab strip, compared as 'tabs', not header buttons.
			if (!visible(b) || ariaHidden(b) || h1.contains(b) || b.matches('[role=tab]') || inTabStrip(b) || b.closest('nav, [class*=breadcrumb]')) return false
			// Only the title's own row: a status stepper or chip row under the title is not a header action.
			const br = b.getBoundingClientRect(), hr = h1.getBoundingClientRect()
			if (br.top + br.height / 2 > hr.bottom + 24 || br.bottom < hr.top - 24) return false
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
	for (const tl of tabStrips) {
		if (!visible(tl) || outOfScope(tl)) continue
		const tabs = tabItems(tl)
		if (!tabs.length) continue
		const active = tabs.find(isCurrent) || tabs[0]
		const inactive = tabs.find((t) => t !== active)
		const tabProps = (t) => {
			if (!t) return null
			const tcs = getComputedStyle(t), after = getComputedStyle(t, '::after'), before = getComputedStyle(t, '::before')
			const pseudo = [after, before].find((p) => p.content !== 'none' && p.content !== 'normal' && opaque(p.backgroundColor) && px(p.height) <= 6)
			return {
				...font(textEl(t)),
				h: round(t.getBoundingClientRect().height), padding: box(tcs, 'padding'), borderRadius: radius(t, tcs),
				background: tcs.backgroundColor, indicator: borders(tcs).bottom || (pseudo ? px(pseudo.height) : 0) || (/inset 0px -\d/.test(tcs.boxShadow) ? Number(tcs.boxShadow.match(/inset 0px -(\d+)/)[1]) : 0),
			}
		}
		// The line under the strip, as drawn: on the tablist or on a bar around it (such as .cn-tabs__bar) whose bottom
		// is the strip's bottom, as a border, a thin pseudo-element or an inset shadow.
		const underline = () => {
			const tr = tl.getBoundingClientRect()
			for (let e = tl; e && e !== document.body; e = e.parentElement) {
				const r = e.getBoundingClientRect()
				if (r.height > tr.height + 16 || Math.abs(r.bottom - tr.bottom) > 4) break
				const ecs = getComputedStyle(e)
				if (borders(ecs).bottom) return borders(ecs).bottom
				for (const which of ['::after', '::before']) {
					const p = getComputedStyle(e, which)
					if (p.content === 'none' || p.content === 'normal') continue
					if (opaque(p.backgroundColor) && px(p.height) > 0 && px(p.height) <= 3 && px(p.width) >= r.width * 0.6) return px(p.height)
					if (borders(p).bottom && px(p.width) >= r.width * 0.6) return borders(p).bottom
				}
				const inset = ecs.boxShadow.match(/inset 0px -(\d+(?:\.\d+)?)px 0px 0px/) || ecs.boxShadow.match(/0px -(\d+(?:\.\d+)?)px 0px 0px [^,]*inset/)
				if (inset) return Number(inset[1])
			}
			return 0
		}
		const gaps = tabs.slice(1).map((t, i) => round(t.getBoundingClientRect().left - tabs[i].getBoundingClientRect().right))
		components.push({ role: 'tabs', title: 'tabs', rect: rect(tl), tabCount: tabs.length, gap: gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : null, borderBottom: underline(), active: tabProps(active), inactive: tabProps(inactive) })
	}

	for (const m of maps) components.push({ el: m, role: 'map', title: 'map', rect: rect(m) })

	// 5. Tables (and ARIA grids).
	// A month calendar (seven weekday column heads) is a date picker, not a list of records: a board draws it as a plain
	// grid of day boxes, the library as an ARIA grid. Neither side measures it as a table.
	const WEEKDAYS = /^(ma|di|wo|do|vr|za|zo|mon?|tue?|wed?|thu?|fri?|sat?|sun?)\.?$/i
	const calendarGrid = (t) => { const hs = [...t.querySelectorAll('th, [role=columnheader]')].slice(0, 7); return hs.length === 7 && hs.every((h) => WEEKDAYS.test(h.textContent.trim())) }
	for (const t of document.querySelectorAll('table, [role=table], [role=grid]')) {
		if (!visible(t) || outOfScope(t) || calendarGrid(t)) continue
		// The head is read from the first header cell with a label: a selection column's empty cell takes no weight
		// of its own (a board's falls back to the browser's bold th), so it does not stand for the head's type.
		const heads = [...t.querySelectorAll('th, [role=columnheader]')]
		const th = heads.find((h) => visible(h) && h.textContent.trim()) || heads[0]
		// The cell is read the same way: a selection cell holding only a checkbox is inset by its checkbox (a board's
		// native box carries a 4px margin, the app's cell pads the same 4px), so it does not stand for the row's cells.
		// A row's header cell (th scope=row, holding the row's name) is one of its cells, as a board's plain td is.
		const firstCell = t.querySelector('tbody td, tbody th[scope=row], [role=row] [role=cell], [role=row] [role=rowheader], [role=gridcell]')
		const firstRow = firstCell && (firstCell.closest('tr, [role=row]') || firstCell)
		const rowCells = firstRow && firstRow !== firstCell ? [...firstRow.querySelectorAll('td, th[scope=row], [role=cell], [role=rowheader], [role=gridcell]')] : []
		const td = rowCells.find((c) => visible(c) && c.textContent.trim()) || firstCell
		const hr = th && (th.closest('tr, [role=row]') || th)
		const dr = firstRow
		// A `display: contents` row (an ARIA grid row) has no box: its height is that of its tallest cell.
		const rowH = (row) => { const h = row.getBoundingClientRect().height; return round(h || Math.max(0, ...[...row.children].map((c) => c.getBoundingClientRect().height))) }
		// A cell's type is that of its text (a name in a bold link inside a plain cell reads bold); its padding is the cell's.
		// textInsetLeft: where the cell's text starts from the table's left edge, whatever draws the space before it (the
		// cell's padding, an icon inside the cell, an icon column of its own, or an empty corner cell). The table's edge,
		// not the row's: an ARIA grid may set its cells straight in the grid with no row element.
		const tableLeft = t.getBoundingClientRect().left
		const rowLeft = () => tableLeft
		const cell = (c) => { if (!c) return null; const ccs = getComputedStyle(c); const tr = textRect(c); return { ...font(textEl(c)), paddingLeft: px(ccs.paddingLeft), paddingTop: px(ccs.paddingTop), textInsetLeft: tr ? round(tr.x - rowLeft(c)) : null, borderBottom: borders(ccs).bottom || (c.parentElement ? borders(getComputedStyle(c.parentElement)).bottom : 0), background: bgBehind(c) } }
		// The titled card a table sits in: two tables pair only within cards of the same title.
		const holder = ownerCard(t)
		const inCard = holder ? (components.find((c) => c.el === holder) || {}).title || null : null
		// The head's words: two tables pair by what their columns are called, not by order on the page.
		const headText = heads.filter(visible).map((h) => h.textContent.trim()).filter(Boolean).slice(0, 5).join(' ').slice(0, 120) || null
		components.push({ role: 'table', title: 'table', rect: rect(t), inCard, headText, head: cell(th), headRowHeight: hr ? rowH(hr) : null, cell: cell(td), rowHeight: dr ? rowH(dr) : null })
	}

	// 6. Toolbars: a row (not a card header, not the page header) that holds 2+ controls.
	const FIELD = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea, [role=combobox], [role=searchbox]'
	const controlBorder = (c) => {
		const b = c.matches(FIELD) ? fieldBorder(c) : { width: borders(getComputedStyle(c)).top, color: getComputedStyle(c).borderTopColor }
		return { controlBorder: b.width, controlBorderColor: b.color }
	}
	// An NcButton with an href renders as a link (`a.button-vue`): it is a control of the bar it sits in.
	const ctrl = 'button, a.button-vue, a[role=button], input:not([type=hidden]), select, [role=combobox], [role=searchbox]'
	// A chip (a fully rounded pill of 40px or less: a quick filter, a shortcut or an active-filter tag) is not a toolbar control: which chips a
	// bar shows follows the data, and a board draws them as buttons where the library may draw spans.
	// Up to 40px: a 38px chip row and a 36px one are the same row of chips (their 2px is measured on the chips).
	const chip = (c) => { const r = c.getBoundingClientRect(); return r.height <= 40 && radius(c, getComputedStyle(c)) >= r.height / 2 - 1 }
	// A row of labelled fields (a form row: label over input, with perhaps the button that acts on them) is a form, not
	// a toolbar: a board draws it as one flex row, the library as a grid of field wrappers, and neither is an action bar.
	const labelledAbove = (c) => {
		if (!c.matches(FIELD)) return false
		const by = (c.getAttribute('aria-labelledby') || '').split(/\s+/).map((id) => id && document.getElementById(id)).filter(Boolean)
		const ls = by.length ? by : [...(c.labels || [])]
		const cr = c.getBoundingClientRect()
		if (ls.some((l) => visible(l) && l.textContent.trim() && l.getBoundingClientRect().bottom <= cr.top + 2)) return true
		// A label that wraps its field sets its caption over the field inside it (humaniq's "Uren" row).
		const captionOver = (l) => [...l.querySelectorAll('*')].some((t) => !t.contains(c) && !c.contains(t) && !t.children.length && visible(t) && t.textContent.trim() && t.getBoundingClientRect().bottom <= cr.top + 2)
		if (ls.some((l) => l.contains(c) && visible(l) && captionOver(l))) return true
		// A board names the field with aria-label and sets the same words as a caption over it in its wrapper, or sets a
		// label element right over it without tying it to the field (no for, not wrapping it).
		const name = (c.getAttribute('aria-label') || '').trim()
		const over = (t) => visible(t) && t.textContent.trim() && t.getBoundingClientRect().bottom <= cr.top + 2 && cr.top - t.getBoundingClientRect().bottom <= 24 && t.getBoundingClientRect().left < cr.right && t.getBoundingClientRect().right > cr.left
		for (let w = c.parentElement, i = 0; w && i < 3; w = w.parentElement, i++) {
			if (name && [...w.querySelectorAll('span, div, p, strong, b, legend')].some((t) => !t.children.length && t.textContent.trim() === name && visible(t) && t.getBoundingClientRect().bottom <= cr.top + 2)) return true
			if ([...w.querySelectorAll('label, legend')].some((t) => !t.contains(c) && over(t))) return true
		}
		return false
	}
	const formRow = (cs) => cs.filter(labelledAbove).length * 2 >= cs.length
	// A card's title-line buttons ("Notitie toevoegen", "Exporteren" beside Historie) are its header actions, wherever
	// the markup puts them: not a toolbar.
	const headerActions = (el) => {
		for (let e = el.parentElement; e; e = e.parentElement) {
			if (!titleBoxes.has(e)) continue
			const t = titleBoxes.get(e), r = el.getBoundingClientRect()
			return r.top < t.y + t.h && r.bottom > t.y
		}
		return false
	}
	// The buttons that close a dialog or a form card (Annuleren, Volgende; Dag afsluiten) are its footer: nothing of the
	// card follows them. A board draws them as a plain row, a dialog library as an actions bar: neither is a toolbar.
	// An open listbox (a select's or a search field's suggestions) is a component of its own, placed over the page: its
	// box, its frame and the height of its options. What it covers is not part of the card or dialog under it.
	const listboxEls = new Set()
	for (const lb of document.querySelectorAll('[role=listbox]')) {
		if (!visible(lb) || outOfScope(lb)) continue
		const opts = [...lb.querySelectorAll('[role=option]')].filter(visible)
		const lr = lb.getBoundingClientRect()
		if (!opts.length || lr.height < 40) continue
		listboxEls.add(lb)
		const lcs = getComputedStyle(lb)
		components.push({ el: lb, role: 'listbox', title: 'listbox', popup: true, rect: rect(lb), props: { padding: box(lcs, 'padding'), border: seenBorders(lcs), borderRadius: radius(lb, lcs), background: bgBehind(lb) }, optionHeight: round(opts[0].getBoundingClientRect().height) })
	}
	const actionFooter = (el, cs) => {
		if (!cs.every((c) => c.matches('button, [role=button], a'))) return false
		const owner = el.closest('[role=dialog]') || (() => { for (let e = el.parentElement; e; e = e.parentElement) if (cardEls.has(e)) return e; return null })()
		if (!owner) return false
		const bottom = el.getBoundingClientRect().bottom
		return ![...owner.querySelectorAll('*')].some((d) => !el.contains(d) && !d.contains(el) && ![...listboxEls].some((lb) => lb.contains(d)) && visible(d) && d.getBoundingClientRect().top >= bottom - 1 && (d.textContent.trim() || d.matches(CONTROL_BOX)) && !d.children.length)
	}
	const headerBox = window.__compdiffPageHeader
	// The page header's buttons are counted from its whole header block (scope), so a row of them beside the title
	// block, on the title's line, is the header's and not a toolbar; counting it as both doubled the buttons or left an
	// extra toolbar on live (CnDetailPage's header actions).
	const headerScope = window.__compdiffPageHeaderScope
	const onTitleLine = (el) => {
		if (!headerBox || !headerScope || !headerScope.contains(el)) return false
		const r = el.getBoundingClientRect(), hb = headerBox.getBoundingClientRect()
		return r.top < hb.bottom && r.bottom > hb.top
	}
	const used = new Set()
	// Pager rows: the row around a pagination nav (its page links or buttons and the count beside them). Measured as a
	// pager on both sides, never as a toolbar: a board draws its pages as links, the library as buttons.
	const PAGER = 'nav[aria-label], [class*=paginat], [class*=pager]'
	const pagerRows = []
	for (const nav of document.querySelectorAll(PAGER)) {
		if (!visible(nav) || outOfScope(nav) || !/paginat|paginer|pager/i.test(`${nav.className} ${nav.getAttribute('aria-label') || ''}`)) continue
		if ([...used].some((u) => u.contains(nav))) continue
		let row = nav
		for (let p = nav.parentElement; p && p !== document.body && !cardEls.has(p); p = p.parentElement) {
			const pr = p.getBoundingClientRect()
			if (pr.height > 80 || pr.width < row.getBoundingClientRect().width) break
			row = p
		}
		const links = [...nav.querySelectorAll('a, button')].filter((c) => visible(c) && !ariaHidden(c) && c.getBoundingClientRect().height >= 20)
		if (!links.length) continue
		used.add(row)
		pagerRows.push(row)
		const rcs = getComputedStyle(row), c0 = links[0], c0cs = getComputedStyle(c0)
		components.push({ role: 'pager', title: 'pager', rect: rect(row), padding: box(rcs, 'padding'), borderTop: borders(rcs).top, gap: links[1] ? round(links[1].getBoundingClientRect().left - links[0].getBoundingClientRect().right) : null, pages: links.length, controlHeight: round(c0.getBoundingClientRect().height), controlRadius: radius(c0, c0cs), controlFontSize: px(c0cs.fontSize) })
	}
	// The items of a drawn line (below): their own rows are part of that toolbar, not toolbars of their own.
	const lineItems = new Set()
	// A wrapping flex row whose row wrappers are `display: contents` (CnActionsBar's board layout) draws its first
	// line as one toolbar, though no element boxes that line: the line spans the container's width and holds the
	// flattened items whose boxes overlap the first item's vertically.
	const flatItems = (el) => [...el.children].flatMap((c) => (getComputedStyle(c).display === 'contents' ? flatItems(c) : [c]))
	const firstLine = (el) => {
		const items = flatItems(el).filter(visible)
		if (!items.length) return null
		const top = Math.min(...items.map((i) => i.getBoundingClientRect().top))
		const first = items.filter((i) => i.getBoundingClientRect().top === top)
		const bottom = Math.max(...first.map((i) => i.getBoundingClientRect().bottom))
		const line = items.filter((i) => i.getBoundingClientRect().top < bottom)
		return { items: line, top, bottom: Math.max(...line.map((i) => i.getBoundingClientRect().bottom)) }
	}
	for (const el of all) {
		if (!visible(el) || outOfScope(el) || inTabStrip(el) || el.closest('table, thead')) continue
		const cs = getComputedStyle(el)
		if (!/flex|grid/.test(cs.display)) continue
		const r = el.getBoundingClientRect()
		if (r.width >= 300 && /flex/.test(cs.display) && cs.flexWrap === 'wrap' && [...el.children].some((c) => getComputedStyle(c).display === 'contents')
			&& ![...used].some((u) => u.contains(el)) && !(headerBox && (headerBox.contains(el) || el.contains(headerBox) || onTitleLine(el)))) {
			const line = firstLine(el)
			const lctrls = line ? line.items.flatMap((i) => (i.matches(ctrl) ? [i] : [...i.querySelectorAll(ctrl)])).filter((c) => visible(c) && !ariaHidden(c) && c.getBoundingClientRect().height >= 24 && !chip(c)) : []
			if (line && lctrls.length >= 2 && line.bottom - line.top <= 72 && !formRow(lctrls) && !headerActions(el) && !actionFooter(el, lctrls)) {
				line.items.forEach((i) => lineItems.add(i))
				const c0 = lctrls[0], c0cs = getComputedStyle(c0)
				components.push({ role: 'toolbar', title: 'toolbar', rect: { x: round(r.x), y: round(line.top), w: round(r.width), h: round(line.bottom - line.top) }, gap: px(cs.columnGap), padding: box(cs, 'padding'), controls: lctrls.length, controlHeight: round(c0.getBoundingClientRect().height), controlRadius: radius(c0, c0cs), ...controlBorder(c0), controlFontSize: px(c0cs.fontSize) })
				continue
			}
		}
		// A wrapping row of short items (chips, Filter, a view switch) that wrapped onto a second or third line is still
		// one toolbar: whether it wraps follows how many chips the data brings.
		// A stack of one item per line (an Acties button over a search field, wrapping because each takes the full width) is
		// no toolbar: a wrapped toolbar has a line with two or more items. A line that is a flex row of two or more
		// controls of its own (CnActionsBar's Filter + view switch unit, wrapped under the lens chips) is such a line.
		const kids = flatItems(el).filter(visible)
		const rowOfControls = (c) => /flex|grid/.test(getComputedStyle(c).display) && [...c.querySelectorAll(ctrl)].filter((k) => visible(k) && !ariaHidden(k) && k.getBoundingClientRect().height >= 24 && !chip(k)).length >= 2
		const wrapped = r.height > 72 && r.height <= 160 && /flex/.test(cs.display) && cs.flexWrap === 'wrap' && !cardEls.has(el)
			&& kids.every((c) => c.getBoundingClientRect().height <= 48)
			&& (kids.some((c) => kids.some((d) => d !== c && Math.abs(d.getBoundingClientRect().top - c.getBoundingClientRect().top) <= 4)) || kids.some(rowOfControls))
		if ((r.height > 72 && !wrapped) || r.width < 300) continue
		// A list row with its open button and its row menu (the saved-views list), or the line inside one, is a row,
		// not a toolbar.
		if (el.closest('li, [role=listitem], [role=row], [role=option], tr')) continue
		const ctrls = [...el.querySelectorAll(ctrl)].filter((c) => visible(c) && !ariaHidden(c) && c.getBoundingClientRect().height >= 24 && !chip(c))
		if (ctrls.length < 2) continue
		if (formRow(ctrls) || headerActions(el) || actionFooter(el, ctrls)) continue
		// A row of steps (CnStepper: done steps are buttons to jump back, the rest spans; a board draws them all as spans)
		// is a progress indicator, not a toolbar.
		if (el.querySelector('[aria-current=step]') || (el.closest('ol') && el.closest('ol').querySelector('[aria-current=step]'))) continue
		if ([...el.querySelectorAll('h1, h2, h3, h4, [role=heading]')].some(visible)) continue
		if (tabStrips.some((s) => el.contains(s))) continue
		// A wrapper whose one visible child is itself the flex or grid row of these controls (a form inside a widget
		// box) is not the toolbar: the row is, and its gap is the one the controls stand apart by.
		// A caption set over that row ("Richting" over a segmented control) is the row's label, not part of the toolbar.
		const caption = (c) => !c.querySelector(ctrl) && !c.matches(ctrl) && c.getBoundingClientRect().bottom <= Math.min(...ctrls.map((k) => k.getBoundingClientRect().top)) + 1
		const shown = [...el.children].filter(visible).filter((c, i, a) => !(a.length > 1 && caption(c)))
		if (shown.length === 1 && /flex|grid/.test(getComputedStyle(shown[0]).display) && ctrls.every((c) => shown[0].contains(c))) continue
		if ([...used].some((u) => u.contains(el)) || [...lineItems].some((u) => u.contains(el))) continue
		if (headerBox && (headerBox.contains(el) || el.contains(headerBox) || onTitleLine(el))) continue
		used.add(el)
		const c0 = ctrls[0], c0cs = getComputedStyle(c0)
		components.push({ role: 'toolbar', title: 'toolbar', rect: rect(el), ...(wrapped ? { wrapped: true } : {}), gap: px(cs.columnGap), padding: box(cs, 'padding'), controls: ctrls.length, controlHeight: round(c0.getBoundingClientRect().height), controlRadius: radius(c0, c0cs), ...controlBorder(c0), controlFontSize: px(c0cs.fontSize) })
	}
	// A quick-actions row drawn as its own element beside or just under the page header (CnDetailPage) belongs to the
	// header: its buttons count toward the header's buttons, and its offset from the title is reported on its own.
	const ph = components.find((c) => c.role === 'pageHeader')
	if (ph && headerBox) {
		const hb = headerBox.getBoundingClientRect()
		for (const el of used) {
			const r = el.getBoundingClientRect()
			if (r.top >= hb.bottom || r.bottom <= hb.top) continue
			const qb = [...el.querySelectorAll('button, a')].filter((b) => visible(b) && !ariaHidden(b) && !inTabStrip(b) && (b.tagName === 'BUTTON' || opaque(getComputedStyle(b).backgroundColor) || nBorders(b) >= 3))
			ph.buttons.push(...qb.map(headerButton))
			ph.header.actions = ph.buttons.length
			ph.quickActions = { separate: true, offsetTop: round(r.top - ph.header.titleY), offsetRight: round(window.innerWidth - r.right) }
			const i = components.findIndex((c) => c.role === 'toolbar' && Math.abs(c.rect.x - r.x) < 1 && Math.abs(c.rect.y - r.y) < 1)
			if (i >= 0) components.splice(i, 1)
		}
	}
	// A toolbar that is the same box as a card (a framed bulk-action band) is that card's content: one component.
	for (let i = components.length - 1; i >= 0; i--) {
		const t = components[i]
		if (t.role !== 'toolbar') continue
		if (components.some((c) => (c.role === 'card' || c.role === 'dialog-card') && Math.abs(c.rect.x - t.rect.x) <= 3 && Math.abs(c.rect.y - t.rect.y) <= 3 && Math.abs(c.rect.w - t.rect.w) <= 3 && Math.abs(c.rect.h - t.rect.h) <= 3)) components.splice(i, 1)
	}
	// The component's own classes (and its nearest cn-* ancestor), used to tell a library defect from an app one.
	// 7. Every visible UI element, not a whitelist: controls, fields, toggles, chips and pills, badges and tags, list
	// rows. Each carries its own styling; compare.mjs pairs them by label, then by repeated group and order.
	const containerIds = new Map()
	const containerOf = (el) => {
		for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
			if (cardEls.has(e) || e.matches('ul, ol, [role=list], [role=listbox], tbody, [role=grid], [role=toolbar], [role=group], nav, form') || /flex|grid/.test(getComputedStyle(e).display) && e.children.length >= 3) {
				if (!containerIds.has(e)) containerIds.set(e, containerIds.size + 1)
				return containerIds.get(e)
			}
		}
		return 0
	}
	const TOGGLE = 'input[type=checkbox], input[type=radio], [role=checkbox], [role=switch], [role=radio]'
	// A box around a radio or checkbox, or beside one (NcCheckboxRadioSwitch's content next to its hidden input): the
	// option the toggle belongs to.
	const isOptionBox = (el) => !!(el.querySelector(TOGGLE) || (el.parentElement && [...el.parentElement.children].some((c) => c !== el && c.matches(TOGGLE))))
	// The filled ground of a toggle's option (the chosen row of a radio list), from the boxed option around the toggle or
	// beside its input, or null when the option draws none. The box is the toggle's state, so it is not measured again.
	const optionGrounds = new Set()
	const optionGround = (toggle) => {
		const boxes = []
		for (let a = toggle.parentElement, i = 0; a && a !== document.body && i < 3; a = a.parentElement, i++) {
			boxes.push(a, ...[...a.children].filter((c) => c !== toggle && !c.contains(toggle)))
			if (a.matches('label, .checkbox-radio-switch')) break
		}
		// A toggle in a table cell takes the ground of its row, however deep the library sets it in the cell (a board's
		// bare input in the th, NcCheckboxRadioSwitch's label and wrapper in it), whether the row paints it or each of its
		// cells does (the files browser's tinted th): the row holds the text.
		const cell = toggle.closest('td, th, [role=cell], [role=gridcell], [role=columnheader]')
		const row = cell && cell.closest('tr, [role=row]')
		if (row && row.textContent.trim() && row.getBoundingClientRect().height <= 80 && !row.querySelectorAll(TOGGLE)[1]) {
			const painted = [cell, row].find((b) => { const c = getComputedStyle(b).backgroundColor; return opaque(c) && c !== bgBehind(b.parentElement) })
			if (painted) { optionGrounds.add(painted); return getComputedStyle(painted).backgroundColor }
		}
		const box = boxes.find((b) => {
			const cs = getComputedStyle(b), r = b.getBoundingClientRect()
			// An option's ground holds its text: a switch track or radio ring beside the input draws the toggle itself.
			// A box beside this toggle that holds a toggle of its own (a selected sibling row) is that toggle's option.
			if (!b.contains(toggle) && b.querySelector(TOGGLE)) return false
			return visible(b) && r.height <= 80 && b.textContent.trim() && isOptionBox(b) && b.parentElement && opaque(cs.backgroundColor) && cs.backgroundColor !== bgBehind(b.parentElement) && !b.querySelectorAll(TOGGLE)[1]
		})
		if (!box) return null
		optionGrounds.add(box)
		return getComputedStyle(box).backgroundColor
	}
	const kindOf = (el, cs, r) => {
		if (el.matches(FIELD)) return 'field'
		if (el.matches(TOGGLE)) return 'toggle'
		const ownBg = opaque(cs.backgroundColor) && el.parentElement && cs.backgroundColor !== bgBehind(el.parentElement)
		const boxed = ownBg || nBorders(el) >= 3
		// A pager's boxed items are its page links, including a disabled "Volgende" drawn as a span. The pager's own row,
		// boxed around them, is not one.
		if (boxed && pagerRows.some((p) => p.contains(el)) && !pagerRows.includes(el) && !el.querySelector('a, button, [role=button]')) return 'button'
		// A disclosure's summary is the button that opens it, however it is drawn (a native summary has no box of its own).
		if (el.tagName === 'SUMMARY') return 'button'
		// A button drawn as a plain text link (no ground of its own, no border, no icon: "Alles wissen", NcButton's
		// tertiary "Toon ze in de tabel" painted the card's white) is read as a plain link is: not an element.
		// An icon wrapper left empty or hidden (NcButton's .button-vue__icon without an icon) draws no icon.
		if (el.matches('button, [role=button]') && !boxed && !el.querySelector('svg, img') && ![...el.querySelectorAll('[class*=icon]')].some((i) => visible(i) && i.getBoundingClientRect().width >= 4)) return null
		if (el.matches('button, [role=button]') || (el.tagName === 'A' && boxed)) return radius(el, cs) >= r.height / 2 - 1 && r.height <= 44 ? 'pill' : 'button'
		// A filled label around a radio or checkbox, or beside one (NcCheckboxRadioSwitch fills the content next to its
		// input on the checked row), is that toggle's state, not a badge.
		if (boxed && isOptionBox(el)) return null
		// A list row is a row, highlighted (the chosen folder) or not: a board's tinted li is no badge. A narrow tinted li
		// (a tag in a list of tags) stays a pill.
		if (el.matches('li, [role=listitem], [role=option], [role=row]') && !el.closest('table') && r.height >= 24 && r.height <= 160 && r.width >= 160) return 'row'
		// A count or tag inside a button ("1 actief" on Filter) is that button's badge, not an element of its own.
		if (boxed && el.parentElement && el.parentElement.closest('button, [role=button]')) return null
		if (boxed && r.height >= 12 && r.height <= 44 && r.width <= 320 && el.textContent.trim()) return radius(el, cs) >= r.height / 2 - 1 ? 'pill' : 'badge'
		return null
	}
	// A focused field whose ring is drawn on a wrapper around it (NcTextField's .input-field__main-wrapper: 2px around a
	// 1px input) is seen as that wrapper: its height and its ring are the field's, as on a board that draws the ring as
	// the input's own border. An outline is not: a keyboard focus outline (thematiq's :focus-visible, vue-select's
	// :focus-within) lies outside the layout and is not the field's frame.
	const focusRing = (el) => {
		const a = document.activeElement
		if (!a || (a !== el && !el.contains(a))) return null
		const own = fieldBorder(el).width
		const r0 = el.getBoundingClientRect()
		let best = null
		for (let e = el, i = 0; e && e !== document.body && i < 5; e = e.parentElement, i++) {
			const r = e.getBoundingClientRect()
			if (r.left < r0.left - 6 || r.top < r0.top - 6 || r.right > r0.right + 6 || r.bottom > r0.bottom + 6) break
			if (i === 0) continue
			const ecs = getComputedStyle(e), b = borders(ecs), g = ring(ecs)
			const w = Math.max(Object.values(b).filter((v) => v > 0).length >= 3 ? b.top : 0, g ? g.width : 0)
			if (w > own && (!best || w > best.width)) best = { width: w, color: g && g.width >= b.top ? g.color : ecs.borderTopColor, h: r.height, el: e }
		}
		return best
	}
	// A select library that frames its whole control (NcSelect's multiple .vs__dropdown-toggle: 2px main-text when open)
	// draws the field people see: its box and its frame, not those of the search input inside it.
	const selectFrame = (el) => {
		const t = el.closest('.vs__dropdown-toggle')
		if (!t || t === el) return null
		const tcs = getComputedStyle(t), b = borders(tcs), g = ring(tcs)
		const nb = Object.values(b).filter((v) => v > 0).length
		if (nb < 3 && !g) return null
		return nb >= 3 ? { width: b.left || b.top, color: opaque(tcs.borderLeftColor) ? tcs.borderLeftColor : tcs.borderTopColor, h: t.getBoundingClientRect().height, el: t } : { width: g.width, color: g.color, h: t.getBoundingClientRect().height, el: t }
	}
	// The frame people see around a field: the select's frame, a focus ring drawn around it, or its own border. A line
	// of another colour inside that frame (the input's own primary line inside the select's dark ring) is its innerBorder.
	const fieldFrame = (el) => {
		const outer = selectFrame(el) || focusRing(el)
		const own = fieldBorder(el)
		if (!outer) return { ...own, inner: { width: 0, color: null } }
		const ca = rgba(own.color), cb = rgba(outer.color)
		const apart = own.width > 0 && ca && cb && Math.max(...[0, 1, 2].map((i) => Math.abs(ca[i] - cb[i]))) > 12
		return { ...outer, inner: apart ? own : { width: 0, color: null } }
	}
	const elementBorder = (el, kind, cs) => {
		if (kind === 'field') { const f = fieldFrame(el); return { border: f.width, borderColor: f.width ? f.color : null, innerBorder: f.inner.width, innerBorderColor: f.inner.width ? f.inner.color : null } }
		// A keyboard focus ring drawn as a box shadow on the focused control is not part of its look.
		const focusShown = el.matches(':focus-visible')
		const seen = focusShown ? borders(cs) : seenBorders(cs)
		const three = Object.values(seen).filter((v) => v > 0).length >= 3
		return { border: three ? seen.top : 0, borderColor: three ? (focusShown ? cs.borderTopColor : seenBorderColour(cs)) : null }
	}
	// The switch people see. A native checkbox or radio draws a square glyph centred in its box, so a box stretched by
	// its row is not the switch; an unstyled input stretched over its label (NcCheckboxRadioSwitch) is drawn by the
	// icon beside it.
	const drawnHeight = (el, kind, cs, r) => {
		if (kind === 'toggle' && !el.matches('input')) { const h = hitArea(cs); return r.height - h.top - h.bottom }
		if (kind !== 'toggle' || !el.matches('input')) return r.height
		if (cs.appearance !== 'none') return Math.min(r.width, r.height)
		const host = el.closest('label, [class*=checkbox], [class*=switch]')
		const icon = host && [...host.querySelectorAll('svg, [class*=icon]')].find((i) => visible(i) && i.getBoundingClientRect().height <= 40)
		return icon ? icon.getBoundingClientRect().height : r.height
	}
	const nativeToggle = (el, kind, cs) => (kind === 'toggle' && el.matches('input') && cs.appearance !== 'none') || (kind === 'field' && el.matches('select, input[type=date], input[type=time], input[type=datetime-local], input[type=month], input[type=week]') && cs.appearance !== 'none')
	const elements = []
	const elementEls = new Set()
	const recordEls = new Set(components.filter((c) => c.record).map((c) => c.el))
	// The title of the innermost titled card around an element: a list row pairs only with a row of the same card.
	const cardTitleOf = (el) => {
		let best = null
		for (const c of components) if (c.el && c.title && c.el !== el && c.el.contains(el) && (!best || best.el.contains(c.el))) best = c
		return best ? best.title : null
	}
	const inRecord = (el) => { for (let e = el; e; e = e.parentElement) if (recordEls.has(e)) return true; return false }
	// A field's name from its markup: aria-labelledby, then a <label for> or a wrapping <label>. A textarea's text is
	// its value, not its name.
	// A checkbox or radio takes the first line of its label (an option's title, not its description): it has no
	// value text of its own, and its value attribute ("on", "ending:archive") is not a name.
	const fieldLabel = (el) => {
		const toggle = el.matches(TOGGLE)
		if (!toggle && !el.matches(FIELD)) return ''
		const by = (el.getAttribute('aria-labelledby') || '').split(/\s+/).map((id) => id && document.getElementById(id)).filter(Boolean)
		// A drawn checkbox (a span with role=checkbox) has no .labels: the label that wraps it names it.
		const named = by.length ? by : el.labels && el.labels.length ? [...el.labels] : el.parentElement && el.parentElement.closest('label') ? [el.parentElement.closest('label')] : []
		// Only the label's own visible text: a wrapping label also holds the control and the value it shows.
		const text = (l) => {
			const w = document.createTreeWalker(l, NodeFilter.SHOW_TEXT)
			const parts = []
			for (let n = w.nextNode(); n; n = w.nextNode()) {
				const p = n.parentElement
				let inControl = false
				for (let e = p; e && e !== l; e = e.parentElement) if ((!toggle && e.contains(el)) || e.matches(FIELD)) { inControl = true; break }
				if (n.textContent.trim() && p && !inControl && visible(p)) parts.push(n.textContent.trim())
			}
			return toggle ? parts[0] || '' : parts.join(' ')
		}
		// NcSelect inside a wrapping label carries a second, inner label with the same name.
		const own = [...new Set(named.map(text).filter(Boolean))].join(' ')
		if (own || toggle || el.getAttribute('aria-label')) return own
		// A field with no label of its own takes the caption set right over it in its wrapper (a board's "Zichtbaarheid"
		// over a select), not the text of the option it shows.
		const cr = el.getBoundingClientRect()
		const above = (t) => !t.contains(el) && !t.closest(FIELD) && t.textContent.trim() && visible(t) && t.getBoundingClientRect().bottom <= cr.top + 2 && cr.top - t.getBoundingClientRect().bottom <= 24
		for (let w = el.parentElement, i = 0; w && i < 3; w = w.parentElement, i++) {
			// A label element over the field is its name whole ("Bericht (niet verplicht)"), muted parts included.
			const lab = [...w.querySelectorAll('label, legend')].find(above)
			if (lab) return lab.textContent.trim().replace(/\s+/g, ' ')
			const cap = [...w.querySelectorAll('span, div, p, strong, b, legend, label')].find((t) => !t.children.length && !t.closest(FIELD) && t.textContent.trim() && visible(t) && t.getBoundingClientRect().bottom <= cr.top + 2 && cr.top - t.getBoundingClientRect().bottom <= 24)
			if (cap) return cap.textContent.trim()
		}
		return ''
	}
	// An element's own label, without the text of a count badge or tag nested inside it. A tag set on a ground of its own
	// in the same colour as its row (a "Persoon" pill on a highlighted option) is still a tag: fully rounded, filled.
	const tagShaped = (e) => { const ecs = getComputedStyle(e), r = e.getBoundingClientRect(); return r.height >= 12 && r.height <= 30 && r.width <= 160 && opaque(ecs.backgroundColor) && radius(e, ecs) >= r.height / 2 - 1 }
	const ownLabel = (el) => {
		const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
		const parts = [], tags = []
		for (let n = w.nextNode(); n; n = w.nextNode()) {
			let nested = false, tag = false
			for (let e = n.parentElement; e && e !== el; e = e.parentElement) { if (PILLISH(e)) { nested = true; break } if (tagShaped(e)) tag = true }
			if (!nested && n.textContent.trim()) (tag ? tags : parts).push(n.textContent.trim())
		}
		// Text that is all in such a tag is the element's own (a chip drawn as a rounded span inside its button).
		const text = (parts.length ? parts : tags).join(' ')
		return (el.getAttribute('aria-label') || fieldLabel(el) || text || el.getAttribute('placeholder') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 50)
	}
	// A list row drawn by a full-width box inside it (cn-folder-tree: an unstyled li around a button; cn-menu-tree: a
	// treeitem around a padded row div) is measured on that box, which is then not an element of its own.
	const drawnBy = new Set()
	// A radius alone draws nothing (NcActions rounds the focused item's li, `action active`, and fills its button).
	const styled = (cs) => opaque(cs.backgroundColor) || Object.values(borders(cs)).some((v) => v > 0) || px(cs.paddingLeft) > 0
	const rowDrawer = (row, rcs, rr) => {
		if (styled(rcs)) return null
		return [...row.querySelectorAll('*')].find((c) => {
			const q = c.getBoundingClientRect()
			// The box must hold the row: a step bar at its top, or a link on its first line above a meta line, does not.
			return q.width >= rr.width * 0.9 && q.top - rr.top < 4 && q.height >= rr.height * 0.8 && c.textContent.trim() && visible(c) && styled(getComputedStyle(c))
				&& c.closest('li, [role=treeitem], [role=listitem], [role=option], [role=row]') === row
		}) || null
	}
	// A checkbox or switch whose real input is hidden (NcCheckboxRadioSwitch) is drawn by its icon: measure that.
	const toggleIcon = (input) => {
		const host = input.parentElement && input.parentElement.closest('.checkbox-radio-switch, label, [class*="checkbox"], [class*="switch"]')
		const fits = (i) => visible(i) && i.getBoundingClientRect().height >= 8 && i.getBoundingClientRect().height <= 40
		// A board draws it as a plain box with no text (a switch track with its knob, a radio ring with its dot).
		const drawnBox = (i) => fits(i) && i.getBoundingClientRect().width <= 60 && !i.textContent.trim() && (opaque(getComputedStyle(i).backgroundColor) || nBorders(i) >= 3)
		return host ? [...host.querySelectorAll('svg')].find(fits) || [...host.querySelectorAll('[class*="icon"]')].find(fits) || [...host.querySelectorAll('span, div, i')].find(drawnBox) || null : null
	}
	// A ::before or ::after that draws text on a filled ground of its own, lower than the element it sits in.
	const pseudoBadge = (c, ground, height) => ['::before', '::after'].some((p) => {
		const ps = getComputedStyle(c, p)
		const text = ps.content.replace(/^["']|["']$/g, '').trim()
		return ps.display !== 'none' && ps.content !== 'none' && ps.content !== 'normal' && !!text && opaque(ps.backgroundColor) && ps.backgroundColor !== ground && px(ps.height) < height
	})
	const withGround = (toggle) => { const g = optionGround(toggle); return g ? { optionGround: g } : {} }
	// A toggle drawn by an svg glyph (a radio's circle icon, a drawn checkbox's 20px icon in a span that paints nothing)
	// has no corner radius to read: its shape is the glyph's. Its ground is the glyph's fill.
	const paintsBox = (e) => { const ecs = getComputedStyle(e); return opaque(ecs.backgroundColor) || nBorders(e) >= 3 || !!ring(ecs) }
	const fillingGlyph = (e) => {
		const r = e.getBoundingClientRect()
		return [...e.querySelectorAll('svg')].find((i) => visible(i) && Math.abs(i.getBoundingClientRect().width - r.width) <= 4 && Math.abs(i.getBoundingClientRect().height - r.height) <= 4) || null
	}
	const glyphFill = (svg) => { const f = getComputedStyle(svg.querySelector('path, circle, rect, polygon, ellipse') || svg).fill; return opaque(f) ? f : null }
	const glyphToggle = (e, kind) => kind === 'toggle' && !e.matches('input') && !paintsBox(e) ? fillingGlyph(e) : null
	for (const el0 of all) {
		if (drawnBy.has(el0)) continue
		const hiddenToggle = el0.matches('input[type=checkbox], input[type=radio]') && !visible(el0) && !outOfScope(el0) ? toggleIcon(el0) : null
		if (hiddenToggle) {
			drawnBy.add(hiddenToggle)
			const ir = hiddenToggle.getBoundingClientRect()
			elementEls.add(hiddenToggle)
			elements.push({
				inRow: !!el0.closest('li, [role=row], [role=listitem], [role=option], tr'), kind: 'toggle', label: ownLabel(el0), inControl: inRecord(el0) ? 'record card' : null,
				interactive: true, container: containerOf(hiddenToggle), rect: rect(hiddenToggle), ...(ir.top >= window.innerHeight ? { belowFrame: true } : {}),
				props: { h: round(ir.height), borderRadius: paintsBox(hiddenToggle) ? radius(hiddenToggle, getComputedStyle(hiddenToggle)) : null, border: 0, borderColor: null, background: null, color: getComputedStyle(hiddenToggle).color, fontSize: px(getComputedStyle(hiddenToggle).fontSize), fontWeight: Number(getComputedStyle(hiddenToggle).fontWeight), paddingLeft: 0, paddingRight: 0, icon: false, text: false, badge: false, gapNext: null, ...withGround(el0) },
			})
			continue
		}
		// Hidden from assistive tech is no reason to skip what people see: an initials tile marked aria-hidden is still a
		// drawn tile. Only a hidden control (NcSelect's chevron button) is decoration.
		if (!visible(el0) || (ariaHidden(el0) && el0.matches(INTERACTIVE)) || outOfScope(el0) || inTabStrip(el0) || el0.matches('[role=tab], th, td, tr') || cardEls.has(el0)) continue
		const r0 = el0.getBoundingClientRect()
		if (r0.width < 6 || r0.height < 6) continue
		const cs0 = getComputedStyle(el0)
		const kind = kindOf(el0, cs0, r0)
		if (!kind) continue
		// A tree row that holds its own sub-list (a folder with its children) is measured on its own line, not on the
		// box that wraps the children too.
		const ownLine = kind === 'row' && el0.querySelector(':scope > ul, :scope > ol, :scope > [role=group]')
			? [...el0.children].find((c) => visible(c) && !c.matches('ul, ol, [role=group]') && c.textContent.trim()) : null
		const drawer = kind === 'row' ? (ownLine ? (styled(getComputedStyle(ownLine)) ? ownLine : rowDrawer(el0, cs0, ownLine.getBoundingClientRect()) || ownLine) : rowDrawer(el0, cs0, r0)) : null
		if (drawer) drawnBy.add(drawer)
		const el = drawer || el0, cs = drawer ? getComputedStyle(drawer) : cs0, r = drawer ? drawer.getBoundingClientRect() : r0
		// Inner parts of a control (the input inside a combobox, a button inside a button) are the control itself.
		if ([...elementEls].some((e) => e !== el && e.contains(el) && (e.matches(FIELD) || ((kind === 'button' || kind === 'field') && e.matches('button, [role=button], a'))))) continue
		// The chosen value a select shows beside its search input (NcSelect's .vs__selected: an avatar chip and a name)
		// is the field's content, as it is inside a board's drawn combobox.
		if (kind !== 'field' && el.closest('.vs__selected, .vs__selected-options')) continue
		// A tag drawn in two layers of one box (NcAvatar: a painted disc, and the initials over it on a 10% tint) is one
		// tag: named by its text, coloured by what the layers paint together.
		if (kind === 'pill' || kind === 'badge') {
			const host = elements.find((x) => (x.kind === 'pill' || x.kind === 'badge') && x.el && x.el !== el && x.el.contains(el) && Math.abs(x.rect.x - r.x) <= 1 && Math.abs(x.rect.y - r.y) <= 1 && Math.abs(x.rect.w - r.width) <= 1 && Math.abs(x.rect.h - r.height) <= 1)
			if (host) {
				if (!host.label.trim()) host.label = ownLabel(el)
				host.props.background = painted(el)
				elementEls.add(el)
				continue
			}
		}
		elementEls.add(el)
		const parentCtl = el.parentElement && el.parentElement.closest('button, [role=button], a')
		const label = ownLabel(el)
		const next = el.nextElementSibling && visible(el.nextElementSibling) ? el.nextElementSibling.getBoundingClientRect() : null
		const te = textEl(el)
		const tcs = te ? getComputedStyle(te) : cs
		const tr = kind === 'row' || kind === 'button' ? textRect(el) : null
		// A switch's transparent hit-area border is not where it is drawn: its box is the track.
		const ha = kind === 'toggle' ? hitArea(cs) : { top: 0, right: 0, bottom: 0, left: 0 }
		const box0 = rect(el)
		const ground = bgBehind(el)
		const glyph = glyphToggle(el, kind)
		elements.push({
			el,
			inRow: !!el0.closest('li, [role=row], [role=listitem], [role=option], tr') && !el0.matches('li, [role=row], [role=listitem], [role=option]'),
			// Page links pair with page links: a lone "2" elsewhere on the page is not the pager's.
			kind, label, inControl: inRecord(el) ? 'record card' : pagerRows.some((p) => p.contains(el)) ? 'pager' : parentCtl && parentCtl !== el && !cardEls.has(parentCtl) ? ownLabel(parentCtl) : null,
			interactive: el.matches('button, a[href], [role=button], [role=link], [role=tab], [role=menuitem]'),
			container: containerOf(el), ...(kind === 'row' && cardTitleOf(el) ? { inCard: cardTitleOf(el) } : {}), rect: { x: round(box0.x + ha.left), y: round(box0.y + ha.top), w: round(box0.w - ha.left - ha.right), h: round(box0.h - ha.top - ha.bottom) }, ...(r.top >= window.innerHeight ? { belowFrame: true } : {}), ...(el.closest('th, [role=columnheader]') ? { inHead: true } : {}),
			props: {
				h: round(kind === 'field' && (selectFrame(el) || focusRing(el)) ? (selectFrame(el) || focusRing(el)).h : drawnHeight(el, kind, cs, r)), borderRadius: glyph ? null : kind === 'toggle' ? Math.max(0, radius(el, cs) - hitArea(cs).top) : radius(el, cs), ...elementBorder(el, kind, cs),
				// A native checkbox or radio draws its own glyph: its computed background (grey when disabled, the accent
				// when checked) is not painted anywhere, so it has none to compare.
				// A translucent ground reads as what it paints over what is behind it.
				background: glyph ? glyphFill(glyph) : nativeToggle(el, kind, cs) ? null : (rgba(ground) || [0, 0, 0, 1])[3] < 0.999 ? painted(el) : ground, native: nativeToggle(el, kind, cs) || undefined, color: tcs.color, fontSize: px(tcs.fontSize), fontWeight: Number(tcs.fontWeight),
				paddingLeft: px(cs.paddingLeft), paddingRight: px(cs.paddingRight),
				// Where the text starts from the element's left edge, whatever places it (a padding, a dot beside it).
				...(tr ? { textInsetLeft: round(tr.x - r.left) } : {}),
				// A native select draws its own arrow.
				// A select library's open indicator sits in its own actions box beside the input (NcSelect's .vs__actions).
				// A native select's arrow and a native date or time input's picker button are drawn by the browser, not by an element.
				// A drawn checkbox whose glyph fills its own box (a board's span[role=checkbox] around a 20px svg) is that glyph,
				// as a hidden input drawn by its icon is: no icon of its own.
				icon: (el.matches('select, input[type=date], input[type=time], input[type=datetime-local], input[type=month], input[type=week]') && cs.appearance !== 'none') || [...(kind === 'field' ? (el.closest('.cn-search-select') || el.closest('.vs__dropdown-toggle, .v-select') || fieldBox(el)) : el).querySelectorAll('svg, img, .material-design-icon, [class*="icon"]')].some((i) => visible(i) && i.getBoundingClientRect().width >= 6 && !(kind === 'toggle' && Math.abs(i.getBoundingClientRect().width - r.width) <= 4 && Math.abs(i.getBoundingClientRect().height - r.height) <= 4)),
				text: !!(te && te !== el ? te.textContent.trim() : [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())),
				// A count pill in a list row (a folder's "120") is its badge, as it is in a button drawn as that row.
				// A count drawn as a ::before or ::after (the Filter menu's active-filter count) is a badge as well.
				badge: !!(kind === 'button' || kind === 'pill' || kind === 'row') && ([...el.querySelectorAll('*')].some((c) => c !== te && visible(c) && c.textContent.trim() && opaque(getComputedStyle(c).backgroundColor) && getComputedStyle(c).backgroundColor !== bgBehind(el) && c.getBoundingClientRect().height < r.height)
					|| [el, ...el.querySelectorAll('*')].some((c) => visible(c) && pseudoBadge(c, bgBehind(el), r.height))),
				gapNext: next && Math.abs(next.top - r.top) < 6 && next.left >= r.right ? round(next.left - r.right) : null,
				...(kind === 'toggle' ? withGround(el0) : {}),
			},
		})
	}

	// Coverage: board elements with a box of their own (ground, border or rounded ground) that no component or element
	// above accounts for. Reported as "not measured", never read as "no differences".
	const measuredEls = new Set([...cardEls, ...elementEls, ...optionGrounds])
	// Small buttons fixed over the page (the AI chat button in the corner) lie over whatever scrolls under them.
	// A fixed box inside another such button is part of it; a fixed app content box around it (#content) is not one.
	const floating = all.filter((el) => { if (!visible(el) || getComputedStyle(el).position !== 'fixed') return false; const q = el.getBoundingClientRect(); return q.width >= 24 && q.height >= 24 && q.width <= 120 && q.height <= 120 })
	const floaters = floating.filter((el) => !floating.some((f) => f !== el && f.contains(el))).map(rect)
	const unmeasured = []
	const icons = []
	const iconTile = (el, r) => {
		if (r.width > 64 || r.height > 64 || el.matches('button, a, [role=button], input, select, textarea')) return false
		const text = el.textContent.trim()
		if (text && !(el.matches('[role=img]') && text.length <= 3)) return false
		return [...el.querySelectorAll('*')].every((d) => !visible(d) || d.matches('svg, svg *, img, [class*="icon"], [class*="icon"] *') || !d.textContent.trim())
	}
	for (const el of all) {
		if (!visible(el) || outOfScope(el) || measuredEls.has(el)) continue
		const r = el.getBoundingClientRect()
		if (r.width < 8 || r.height < 8 || r.width >= VW * 0.75) continue
		const cs = getComputedStyle(el)
		const ownBg = opaque(cs.backgroundColor) && el.parentElement && cs.backgroundColor !== bgBehind(el.parentElement)
		if (!ownBg && nBorders(el) < 3) continue
		// A map is measured for its place and size: its tint and what is drawn on it (a parcel, a road) are the map.
		if (inMap(el)) continue
		if (inTabStrip(el) || el.closest('table, [role=dialog] > *:first-child:empty') || [...elementEls].some((e) => e.contains(el)) || [...cardEls].some((c) => c === el)) continue
		if (el.matches('svg, svg *, img, canvas, [role=progressbar], progress, hr') || (!el.textContent.trim() && r.height <= 16)) continue
		// A box around controls that are each measured (a view switch's track around its icon buttons) is accounted for
		// by them.
		const kids = [...el.children].filter(visible)
		if (kids.length >= 2 && kids.every((k) => measuredEls.has(k) || listboxEls.has(k))) continue
		if (listboxEls.has(el)) continue
		// A tile that only draws an icon, a step marker or a logo's initials (a KPI's tinted disc around its glyph, a done
		// step's check, an empty step ring) is an icon of what it sits in, seen in that component's crop.
		if (iconTile(el, r)) { icons.push({ tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 4), rect: rect(el) }); continue }
		unmeasured.push({ tag: el.tagName.toLowerCase(), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), rect: rect(el) })
	}

	const LIBCLS = /^cn-|^nc-|^app-content|^app-sidebar|^modal|^dialog/
	const clsOf = (r) => { const el = document.elementFromPoint(r.x + Math.min(8, r.w / 2), r.y + Math.min(8, r.h / 2)); let lib = null; for (let e = el; e; e = e.parentElement) { const c = [...(e.classList || [])].find((k) => LIBCLS.test(k)); if (c) { lib = c; break } } return lib }
	// The library class of the component itself or the nearest ancestor that has one; a point probe at the corner only
	// when the component has no element of its own (it can land on an icon inside it).
	const ownLib = (el) => { for (let e = el; e; e = e.parentElement) { const c = [...(e.classList || [])].find((k) => LIBCLS.test(k)); if (c) return c } return null }
	for (const c of components) { if (c.el) c.cls = [...(c.el.classList || [])].slice(0, 2).join('.') || c.el.tagName.toLowerCase(); c.libClass = (c.el && ownLib(c.el)) || clsOf(c.rect) }
	// The capture is the viewport, as tall as the board: a component that starts below it (the rows of a side panel
	// that scrolls on past the page) is in neither picture. It is kept, marked, so that a component the board draws
	// inside its frame can still find its counterpart on a taller live page; unpaired, it is neither missing nor extra.
	for (const c of components) if (c.rect && c.rect.y >= window.innerHeight) c.belowFrame = true
	return { viewport: { w: VW, h: window.innerHeight }, scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }, components: components.map(({ el, ...c }) => c), elements: elements.map(({ el, ...e }) => e), unmeasured, icons, floaters }
}
