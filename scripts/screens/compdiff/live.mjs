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
