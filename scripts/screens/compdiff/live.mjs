// Helpers for the live side of a measurement: who logs in, what to leave out, and when the tables are ready.

/**
 * The account a board is measured as. `--login none` measures the page without logging in (a public site, as a
 * visitor sees it). `--login <role>` logs in as COMPDIFF_<ROLE>_USER / COMPDIFF_<ROLE>_PASSWORD, for instance a
 * user who is not an editor of the site. Without --login it is COMPDIFF_USER / COMPDIFF_PASSWORD.
 *
 * @param {string|undefined} login The --login value.
 * @param {object} env The environment.
 * @return {{user: string, password: string}|null} The account, or null for no login.
 */
export function accountFor(login, env) {
	if (login === 'none') return null
	const prefix = login ? `COMPDIFF_${login.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_` : 'COMPDIFF_'
	const user = env[`${prefix}USER`], password = env[`${prefix}PASSWORD`]
	if (!user || !password) throw new Error(`no account: set ${prefix}USER and ${prefix}PASSWORD`)
	return { user, password }
}

/**
 * The session storage a spec seeds on the live page before it loads (--session, a JSON object of key to value), for
 * state a browser session keeps: a detail page that asks once per session why the reader opens a record
 * (CnDetailPage's access purpose) cannot be answered by a step, because compdiff refuses the write that records it.
 * A string value is stored as is; any other value as its JSON.
 *
 * @param {string|undefined} raw The --session value.
 * @param {string|null} [id] The record id the route ends in, put where the value says `{routeId}`.
 * @return {Array<[string, string]>} The entries, in order.
 * @throws {Error} When the value is not a JSON object.
 */
export function sessionEntries(raw, id = null) {
	if (!raw) return []
	if (raw.includes('{routeId}')) {
		if (!id) throw new Error('--session uses {routeId}, but the route ends in no record id')
		raw = raw.split('{routeId}').join(id)
	}
	let parsed
	try {
		parsed = JSON.parse(raw)
	} catch {
		throw new Error('--session needs a JSON object of key to value')
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('--session needs a JSON object of key to value')
	return Object.entries(parsed).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
}

/**
 * The POST requests a spec declares as reads (--read-post, path globs joined by `|`, `*` for one path segment): a
 * duplicate check or a search that asks with a POST body but writes nothing. Those pass through; every other write
 * stays refused, so a step that reaches a save still cannot create anything. The path is matched without
 * `/index.php` and without the query.
 *
 * @param {string|undefined} raw The --read-post value.
 * @return {(method: string, url: string) => boolean} Whether a request may pass as a read.
 */
export function readPosts(raw) {
	const globs = (raw || '').split('|').map((x) => x.trim()).filter(Boolean)
	const patterns = globs.map((g) => new RegExp('^' + g.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+') + '$'))
	return (method, url) => {
		if (method !== 'POST' || patterns.length === 0) return false
		let pathName
		try {
			pathName = new URL(url).pathname.replace(/^\/index\.php(?=\/)/, '')
		} catch {
			return false
		}
		return patterns.some((re) => re.test(pathName))
	}
}

/**
 * Scrolls the document and every scrolled container back to the top-left, so the capture starts where the board
 * does. A spec hash (`#section-kadaster`) or a step can scroll an app's inner scroll area (Nextcloud's settings
 * content, `#app-content`), and the page header and tabs above it then read as missing. `--keep-scroll` skips it for
 * a board that is drawn scrolled.
 *
 * @param {object} page A playwright page.
 * @return {Promise<number>} How many elements were scrolled back.
 */
export async function resetScroll(page) {
	return page.evaluate(() => {
		let n = 0
		for (const el of [document.scrollingElement, ...document.querySelectorAll('*')]) {
			if (el && (el.scrollTop > 0 || el.scrollLeft > 0)) {
				el.scrollTop = 0
				el.scrollLeft = 0
				n++
			}
		}
		return n
	})
}

/**
 * Moves the pointer off whatever a click step left it on, to a spot over no control, so the capture does not read a
 * hover ground (DqZaakMeer: "Meer" read 240 grey under the pointer that opened it, white once the pointer left).
 *
 * @param {object} page A playwright page.
 * @return {Promise<{x: number, y: number}|null>} Where the pointer went, or null when no free spot was found.
 */
export async function parkPointer(page) {
	const spot = await page.evaluate(() => {
		const W = window.innerWidth, H = window.innerHeight
		const free = (x, y) => {
			const el = document.elementFromPoint(x, y)
			return !el || !el.closest('a, button, input, select, textarea, label, summary, [role=button], [role=tab], [role=link], [role=menuitem], [role=option], [tabindex], [onclick]')
		}
		const candidates = [[W - 2, H - 2], [W - 2, Math.round(H / 2)], [Math.round(W / 2), H - 2], [2, H - 2], [W - 2, 2], [2, 2]]
		for (let y = H - 2; y > 0; y -= 97) for (let x = W - 2; x > 0; x -= 131) candidates.push([x, y])
		const hit = candidates.find(([x, y]) => free(x, y))
		return hit ? { x: hit[0], y: hit[1] } : null
	})
	if (spot) await page.mouse.move(spot.x, spot.y)
	return spot
}

/**
 * Marks the elements a spec leaves out (--ignore, selectors joined by `|`), so the extractor treats them as chrome.
 *
 * @param {object} page A playwright page.
 * @param {string|undefined} ignore The --ignore value.
 * @return {Promise<number>} How many elements were marked.
 */
export async function markIgnored(page, ignore) {
	let n = 0
	for (const sel of (ignore || '').split('|').map((x) => x.trim()).filter(Boolean)) {
		n += await page.locator(sel).evaluateAll((els) => { els.forEach((e) => e.setAttribute('data-compdiff-ignore', '')); return els.length })
	}
	return n
}

/**
 * Runs in the page: the column shape of every visible table, and whether each head has as many columns as its first
 * body row (a selection column renders after the rest, in the head and the rows at different moments).
 *
 * @return {{ready: boolean, key: string}} The shape.
 */
export function tableShape() {
	const span = (row) => [...row.children].reduce((n, c) => n + (Number(c.getAttribute('colspan')) || 1), 0)
	const shapes = [...document.querySelectorAll('table, [role=table], [role=grid]')].filter((t) => t.getBoundingClientRect().width > 0).map((t) => {
		const head = t.querySelector('thead tr') || [...t.querySelectorAll('[role=row]')].find((r) => r.querySelector('[role=columnheader]'))
		const body = t.querySelector('tbody tr') || [...t.querySelectorAll('[role=row]')].find((r) => r.querySelector('[role=cell], [role=gridcell]'))
		return [head ? span(head) : 0, body ? span(body) : 0]
	})
	return { ready: shapes.every(([h, b]) => !h || !b || h === b), key: JSON.stringify(shapes) }
}

/**
 * Waits until every table has its full head (as many columns as its rows) and its shape held still for `still` ms.
 *
 * @param {object} page A playwright page.
 * @param {{timeout?: number, still?: number, interval?: number}} [opts] Limits in milliseconds.
 * @return {Promise<boolean>} Whether the tables settled before the timeout.
 */
export async function waitForTables(page, { timeout = 20000, still = 1000, interval = 250 } = {}) {
	const start = Date.now()
	let last = null, since = 0
	while (Date.now() - start < timeout) {
		const s = await page.evaluate(tableShape)
		if (s.key !== last) { last = s.key; since = Date.now() }
		if (s.ready && Date.now() - since >= still) return true
		await page.waitForTimeout(interval)
	}
	return false
}

/**
 * Runs in the page: the loading indicators on screen (a spinner, a skeleton, a busy region). A widget that fills from
 * another app (the Kaarten card asking Deck) shows one until its data is in. A status line that
 * names what is still loading (CnRelatedObjectsWidget's "Nog aan het laden: Objecten") is one: the card around it is
 * not filled yet.
 *
 * @return {Array<string>} A short description of each indicator: its first class or tag, and its text.
 */
export function loadingIndicators() {
	const sel = '[aria-busy="true"], .icon-loading, .icon-loading-small, .loading-icon, [class*="loading-icon"], [class*="skeleton"], [class*="--loading"], [class*="__loading"], [data-testid$="-pending"], [role="status"]'
	const pending = /^(nog aan het laden|still loading|bezig met laden|laden\s*(…|\.\.\.)|loading\s*(…|\.\.\.))/i
	// A map widget's Leaflet mount point that Leaflet has not loaded into yet (it is imported lazily).
	const unmounted = (e) => !e.classList.contains('leaflet-container') && [...e.classList].some((c) => /(^|__)leaflet$/.test(c))
	return [...document.querySelectorAll(`${sel}, [class*="leaflet"]`)].filter((e) => {
		const r = e.getBoundingClientRect(), cs = getComputedStyle(e)
		if (!(r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05)) return false
		if (!e.matches(sel)) return unmounted(e)
		return !e.matches('[role="status"]') || e.matches(sel.replace(', [role="status"]', '')) || pending.test(e.textContent.trim())
	}).map((e) => `${e.classList[0] || e.tagName.toLowerCase()}${e.textContent.trim() ? ` "${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}"` : ''}`)
}

/**
 * Waits until no loading indicator is on screen and the layout has held still, so a widget that fills seconds after
 * the page (an integration card) is measured filled, not in its loading state.
 *
 * @param {object} page A Playwright page.
 * @param {{timeout?: number, still?: number, interval?: number}} [opts] The longest wait, how long the page must hold
 *   still without indicators, and the poll interval (ms).
 * @return {Promise<boolean>} False when it gave up, still loading.
 */
export async function waitForLoaded(page, { timeout = 20000, still = 1000, interval = 250 } = {}) {
	const start = Date.now()
	let last = null, since = Date.now()
	while (Date.now() - start < timeout) {
		const [n, sig] = await page.evaluate(`[(${loadingIndicators.toString()})().length, (${layoutSignature.toString()})()]`)
		if (n > 0 || sig !== last) { last = sig; since = Date.now() }
		if (n === 0 && Date.now() - since >= still) return true
		await page.waitForTimeout(interval)
	}
	return false
}

/**
 * Runs in the page: a signature of what is laid out, the size and place of every element in the document. It
 * changes while widgets render, load data or animate in, and holds still once the page has settled.
 *
 * @return {string} The layout signature.
 */
export function layoutSignature() {
	let n = 0, sum = 0
	for (const el of document.body.querySelectorAll('*')) {
		const r = el.getBoundingClientRect()
		if (!r.width && !r.height) continue
		n++
		sum = (sum + Math.round(r.x) * 3 + Math.round(r.y) * 7 + Math.round(r.width) * 11 + Math.round(r.height) * 13) % 1000000007
	}
	return `${n}:${sum}:${document.body.scrollHeight}`
}

/**
 * Tracks a page's requests, so a wait can tell a quiet page from a busy one. A request open longer than `longPoll`
 * ms is a long poll (notifications, push) that never ends: it does not keep the page busy.
 *
 * @param {object} page A playwright page.
 * @param {{longPoll?: number}} [opts] The long-poll age in milliseconds.
 * @return {{lastActivity: () => number, busy: () => boolean}} The tracker.
 */
export function trackRequests(page, { longPoll = 4000 } = {}) {
	const open = new Map()
	let last = Date.now()
	page.on('request', (r) => { open.set(r, Date.now()); last = Date.now() })
	const done = (r) => { open.delete(r); last = Date.now() }
	page.on('requestfinished', done)
	page.on('requestfailed', done)
	return {
		lastActivity: () => last,
		busy: () => [...open.values()].some((t) => Date.now() - t < longPoll),
	}
}

/**
 * Waits until the page is quiet: no request in flight (long polls aside) and the layout unchanged, both for `quiet`
 * ms, after at least `min` ms and never longer than `max` ms. A quiet page is measured within seconds; a page that
 * keeps changing waits the full `max`, as the fixed settle did.
 *
 * @param {object} page A playwright page.
 * @param {{lastActivity: () => number, busy: () => boolean}} requests The page's request tracker (trackRequests).
 * @param {{min?: number, max?: number, quiet?: number, interval?: number}} [opts] Limits in milliseconds.
 * @return {Promise<{quiet: boolean, waited: number}>} Whether it went quiet before `max`, and how long it waited.
 */
export async function waitForQuiet(page, requests, { min = 1000, max = 8000, quiet = 1500, interval = 250 } = {}) {
	const start = Date.now()
	let sig = null, since = start
	while (Date.now() - start < max) {
		const s = await page.evaluate(layoutSignature).catch(() => null)
		if (s !== sig) { sig = s; since = Date.now() }
		const now = Date.now()
		if (now - start >= min && !requests.busy() && now - requests.lastActivity() >= quiet && now - since >= quiet) return { quiet: true, waited: now - start }
		await page.waitForTimeout(interval)
	}
	return { quiet: false, waited: Date.now() - start }
}

/**
 * The record id a route ends in: its last path segment when that is a uuid or a number, before any query or hash.
 *
 * @param {string} route The route, with its lookups resolved.
 * @return {string|null} The id, or null.
 */
export function routeId(route) {
	const last = String(route).split(/[?#]/)[0].split('/').filter(Boolean).pop() || ''
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last) || /^\d+$/.test(last) ? last : null
}

/**
 * The environment the measuring Chrome runs in: Dutch, so a native date or time input shows 28-10-2026, 10:00 as on
 * a Dutch desktop and as the boards draw it. Chrome takes that format from LANG, not from --lang or the page locale.
 *
 * @param {object} env The process environment.
 * @return {object} The environment for the browser.
 */
export function browserEnv(env) {
	return { ...env, LANG: 'nl_NL.UTF-8', LANGUAGE: 'nl_NL', LC_ALL: 'nl_NL.UTF-8' }
}

/**
 * Runs `fn`, and once more when it throws: a login page that times out under load usually answers the second time.
 * A second failure is thrown, so a run never loops on a page that does not answer.
 *
 * @param {Function} fn The step, an async function.
 * @param {(error: Error) => void} [onRetry] Told the first error before the retry.
 * @return {Promise<*>} What `fn` returned.
 */
export async function retryOnce(fn, onRetry = () => {}) {
	try {
		return await fn()
	} catch (e) {
		onRetry(e)
		return fn()
	}
}

/**
 * Slices a list into chunks of at most `size` items, in order.
 *
 * @param {Array} list The items.
 * @param {number} size The largest chunk.
 * @return {Array<Array>} The chunks.
 */
export function chunks(list, size) {
	const out = []
	for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
	return out
}

/**
 * Leaves a select whose list is closed again: picking an option in an NcSelect closes the list but keeps the focus in
 * its search input, which a board draws at rest. An open select keeps its focus, as the board draws it open.
 *
 * @param {object} page A Playwright page.
 * @return {Promise<boolean>} Whether a closed select was left.
 */
export function leaveClosedSelect(page) {
	return page.evaluate(() => {
		const a = document.activeElement
		if (!a || !a.matches('input') || !a.closest('.v-select') || a.closest('.v-select.vs--open')) return false
		a.blur()
		return true
	})
}

/**
 * Runs in the page: takes the keyboard focus rings off the focused control and its wrappers, so a field typed into is
 * measured and pictured as drawn, without the theme's rings round it. A ring is what a `:focus`, `:focus-visible` or
 * `:focus-within` rule draws on an element it matches now: its outline, and the zero-offset, unblurred spread rings in
 * its box shadow. A drop shadow, and a ring the element draws without such a rule, stay.
 *
 * @return {number} How many elements lost a ring.
 */
export function focusRingsOff() {
	const FOCUS = /:focus(?:-visible|-within)?(?![-\w])/
	const topLevel = (s) => {
		const parts = []
		let depth = 0, from = 0
		for (let i = 0; i < s.length; i++) {
			if (s[i] === '(') depth++
			else if (s[i] === ')') depth--
			else if (s[i] === ',' && depth === 0) { parts.push(s.slice(from, i).trim()); from = i + 1 }
		}
		parts.push(s.slice(from).trim())
		return parts.filter(Boolean)
	}
	const ringed = new Map()
	const walk = (rules) => {
		for (const r of rules) {
			if (r.cssRules && r.cssRules.length) walk(r.cssRules)
			if (!r.selectorText || !r.style || !FOCUS.test(r.selectorText)) continue
			const outline = !!(r.style.getPropertyValue('outline-style') || r.style.getPropertyValue('outline-width') || r.style.getPropertyValue('outline'))
			const shadow = !!r.style.getPropertyValue('box-shadow')
			if (!outline && !shadow) continue
			for (const sel of topLevel(r.selectorText).filter((x) => FOCUS.test(x))) {
				let els = []
				try { els = document.querySelectorAll(sel) } catch { continue }
				for (const el of els) {
					const was = ringed.get(el) || { outline: false, shadow: false }
					ringed.set(el, { outline: was.outline || outline, shadow: was.shadow || shadow })
				}
			}
		}
	}
	for (const sheet of document.styleSheets) {
		try { walk(sheet.cssRules) } catch { /* a stylesheet from another origin cannot be read */ }
	}
	let n = 0
	for (const [el, what] of ringed) {
		const cs = getComputedStyle(el)
		let changed = false
		if (what.outline && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) { el.style.setProperty('outline', 'none', 'important'); changed = true }
		if (what.shadow && cs.boxShadow !== 'none') {
			const keep = topLevel(cs.boxShadow).filter((s) => {
				if (/\binset\b/.test(s)) return true
				const len = s.replace(/[a-z-]+\([^)]*\)/gi, ' ').match(/-?[\d.]+px/g) || []
				return !(len.length === 4 && parseFloat(len[0]) === 0 && parseFloat(len[1]) === 0 && parseFloat(len[2]) === 0 && parseFloat(len[3]) > 0)
			})
			if (keep.length < topLevel(cs.boxShadow).length) { el.style.setProperty('box-shadow', keep.length ? keep.join(', ') : 'none', 'important'); changed = true }
		}
		if (changed) { el.style.setProperty('transition', 'none', 'important'); n++ }
	}
	return n
}

/**
 * Waits, at most `max` ms, until the page's finite transitions and animations have ended, so a colour is read at its
 * end value and not halfway (a button's ground fading in). A spinner that turns for ever is not waited for.
 *
 * @param {object} page A Playwright page.
 * @param {number} [max] The longest wait in milliseconds.
 * @return {Promise<void>}
 */
export function waitForTransitions(page, max = 3000) {
	return page.evaluate((ms) => Promise.race([
		Promise.all(document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => null))),
		new Promise((resolve) => setTimeout(resolve, ms)),
	]).then(() => undefined), max)
}

