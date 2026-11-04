// --present-as <role>: a second user has the measured record open while the board is measured. A page that shows who
// else is looking (CnDetailPage's "kijkt nu ook naar deze zaak" row, OpenRegister object presence) draws that row only
// while another reader beats on the record, so the board's second reader is logged in, in a browser context of its
// own, and kept on the page until the capture is done.
import { logIn, retryOnce } from './live.mjs'

const PRESENCE = /^\/apps\/openregister\/api\/objects\/[^/]+\/[^/]+\/[^/]+\/presence$/

/**
 * Whether a request is a reader's presence on a record: the beat (PUT), the departure (DELETE) or the departure a
 * closing tab sends as a beacon (POST). Presence is a heartbeat the server forgets after a minute, and the beat's
 * answer is how a page learns who else is there, so with --present-as these pass in both browser contexts. Every
 * other write stays refused. The path is matched without `/index.php` and without the query.
 *
 * @param {string} method The request method.
 * @param {string} url The request url.
 * @return {boolean} Whether the request is a presence beat or departure.
 */
export function presenceWrite(method, url) {
	if (!['PUT', 'DELETE', 'POST'].includes(method)) return false
	let pathName
	try {
		pathName = new URL(url).pathname.replace(/^\/index\.php(?=\/)/, '')
	} catch {
		return false
	}
	return PRESENCE.test(pathName)
}

/**
 * Opens the record as a second user, in a browser context of its own, and waits for that user's first presence beat
 * to be answered. The context refuses every write but the login and presence; what it refused is listed.
 *
 * @param {object} browser A playwright browser.
 * @param {object} opts The second reader.
 * @param {string} opts.base The instance, e.g. http://localhost:8080.
 * @param {string} opts.target The full url of the measured page.
 * @param {{user: string, password: string}} opts.account The second reader's account.
 * @param {number} [opts.wait] The longest wait for the first beat (ms).
 * @param {(msg: string) => void} [opts.log] Where a warning goes.
 * @return {Promise<{beats: number, blocked: Array<string>, close: () => Promise<void>}>} The beats answered so far,
 *   the writes refused, and a close that ends the second reader's visit.
 */
export async function presentAs(browser, { base, target, account, wait = 60000, log = console.error }) {
	const ctx = await browser.newContext({ locale: 'nl-NL' })
	const origin = new URL(base).origin
	const blocked = []
	await ctx.route((u) => u.origin === origin, (route) => {
		const req = route.request()
		const m = req.method()
		if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS' || /\/login(\?|$)/.test(req.url()) || presenceWrite(m, req.url())) return route.fallback()
		blocked.push(`${m} ${req.url().replace(origin, '')}`)
		return route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"compdiff is read-only"}' })
	})
	const page = await ctx.newPage()
	const there = { beats: 0, blocked, close: () => ctx.close().catch(() => {}) }
	page.on('response', (res) => {
		if (res.request().method() === 'PUT' && presenceWrite('PUT', res.url()) && res.ok()) there.beats++
	})
	await retryOnce(() => logIn(page, base, account), (e) => log(`--present-as login failed, trying once more: ${e.message.split('\n')[0]}`))
	const beat = page.waitForResponse((res) => res.request().method() === 'PUT' && presenceWrite('PUT', res.url()) && res.ok(), { timeout: wait }).catch(() => null)
	await page.goto(target, { waitUntil: 'load', timeout: 180000 }).catch(() => {})
	if (!(await beat)) log(`--present-as ${account.user}: no presence beat answered within ${wait / 1000} s; measuring without the second reader`)
	return there
}
