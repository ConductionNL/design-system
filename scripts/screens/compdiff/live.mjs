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
 * @return {Array<[string, string]>} The entries, in order.
 * @throws {Error} When the value is not a JSON object.
 */
export function sessionEntries(raw) {
	if (!raw) return []
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
