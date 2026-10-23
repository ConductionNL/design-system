// node --test scripts/screens/compdiff/live.test.mjs
// The live side: which account a board is measured as, elements a spec leaves out, and the wait for a table whose
// selection column renders late. The browser tests need PLAYWRIGHT_MODULE and Chrome, and skip without them.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { accountFor, allowedWrite, markIgnored, tableShape, trackRequests, waitForQuiet, waitForTables } from './live.mjs'
import { parseSteps, playSteps } from './steps.mjs'

const require = createRequire(import.meta.url)
const CHROME = process.env.CHROME || '/opt/google/chrome/chrome'
let chromium = null
try {
	chromium = require(process.env.PLAYWRIGHT_MODULE || 'playwright').chromium
} catch {
	chromium = null
}
const skip = !chromium || !fs.existsSync(CHROME) ? 'no playwright or Chrome' : false

/**
 * Runs a test body against a page made of the given body.
 *
 * @param {string} body The HTML of the page body.
 * @param {Function} fn Receives the page.
 * @return {Promise<void>}
 */
async function withPage(body, fn) {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage()
		await page.setContent(`<!doctype html><html><body>${body}</body></html>`)
		await fn(page)
	} finally {
		await browser.close()
	}
}

test('a board is measured as the default user, a named role, or nobody', () => {
	const env = { COMPDIFF_USER: 'pieter', COMPDIFF_PASSWORD: 'p', COMPDIFF_VIEWER_USER: 'bezoeker', COMPDIFF_VIEWER_PASSWORD: 'v' }
	assert.deepEqual(accountFor(undefined, env), { user: 'pieter', password: 'p' })
	assert.deepEqual(accountFor('viewer', env), { user: 'bezoeker', password: 'v' })
	assert.equal(accountFor('none', env), null)
	assert.throws(() => accountFor('editor', env), /COMPDIFF_EDITOR_USER/)
})

test('waits for a selection column that renders after the rest of the table', { skip }, async () => {
	const table = '<table><thead><tr><th>Naam</th><th>Status</th></tr></thead><tbody><tr><td>A</td><td>B</td></tr></tbody></table>'
	await withPage(table, async (page) => {
		// The rows get their checkbox cell first, the head its column 600 ms later.
		await page.evaluate(() => {
			document.querySelector('tbody tr').insertAdjacentHTML('afterbegin', '<td><input type="checkbox"></td>')
			setTimeout(() => document.querySelector('thead tr').insertAdjacentHTML('afterbegin', '<th></th>'), 600)
		})
		assert.equal((await page.evaluate(tableShape)).ready, false)
		assert.equal(await waitForTables(page, { timeout: 5000, still: 300 }), true)
		assert.equal(await page.evaluate(() => document.querySelectorAll('thead th').length), 3)
	})
})

test('gives up on a table that never settles, and does not wait on a page without tables', { skip }, async () => {
	await withPage('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>', async (page) => {
		assert.equal(await waitForTables(page, { timeout: 600, still: 100 }), false)
	})
	await withPage('<p>geen tabel</p>', async (page) => {
		assert.equal(await waitForTables(page, { timeout: 600, still: 0 }), true)
	})
})

test('marks the elements a spec leaves out', { skip }, async () => {
	await withPage('<button>Zoeken</button><button>Deze site bewerken</button>', async (page) => {
		assert.equal(await markIgnored(page, 'button:has-text("Deze site bewerken") | #nothing'), 1)
		assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('[data-compdiff-ignore]')].map((e) => e.textContent)), ['Deze site bewerken'])
		assert.equal(await markIgnored(page, undefined), 0)
	})
})

test('a quiet page is measured within seconds, not after the full settle', { skip }, async () => {
	await withPage('<main><p>Klaar</p></main>', async (page) => {
		const r = await waitForQuiet(page, trackRequests(page), { min: 300, max: 8000, quiet: 500 })
		assert.equal(r.quiet, true)
		assert.ok(r.waited < 2000, `waited ${r.waited} ms`)
	})
})

test('a page that keeps changing its layout waits the full maximum', { skip }, async () => {
	await withPage('<main><div id="g" style="height:10px"></div></main><script>let h = 10; setInterval(() => { h += 5; document.getElementById("g").style.height = h + "px" }, 200)</script>', async (page) => {
		const r = await waitForQuiet(page, trackRequests(page), { min: 300, max: 2500, quiet: 500 })
		assert.equal(r.quiet, false)
		assert.ok(r.waited >= 2500)
	})
})

test('a request in flight keeps the page busy, a long poll does not', { skip }, async () => {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage()
		// A slow data call answers after 1.5 s; the push call never answers.
		await page.route('http://compdiff.test/**', (route) => {
			const u = route.request().url()
			if (u.endsWith('/push')) return
			if (u.endsWith('/data')) return setTimeout(() => route.fulfill({ status: 200, body: '{}' }).catch(() => {}), 1500)
			return route.fulfill({ status: 200, contentType: 'text/html', body: '<main>Laden</main><script>fetch("/push"); setTimeout(() => fetch("/data"), 100)</script>' })
		})
		const requests = trackRequests(page, { longPoll: 2500 })
		await page.goto('http://compdiff.test/', { waitUntil: 'load' })
		const r = await waitForQuiet(page, requests, { min: 200, max: 6000, quiet: 500 })
		assert.equal(r.quiet, true)
		assert.ok(r.waited >= 1500, `measured after ${r.waited} ms, before the data call answered`)
		assert.ok(r.waited < 5000, `waited ${r.waited} ms for a long poll`)
	} finally {
		await browser.close()
	}
})

test('a named user logs in with the password from COMPDIFF_PASSWORD_<USER>', () => {
	assert.deepEqual(accountFor(undefined, { COMPDIFF_PASSWORD_DAAN_VERBEEK: 'x' }, 'daan.verbeek'), { user: 'daan.verbeek', password: 'x' })
	assert.throws(() => accountFor(undefined, {}, 'daan.verbeek'), /COMPDIFF_PASSWORD_DAAN_VERBEEK/)
	assert.equal(accountFor('none', {}, 'daan.verbeek'), null)
})

test('only a write on the allowlist goes through, with * as one path segment', () => {
	const allow = ['POST /apps/launchpad/api/dashboards/*/lock']
	assert.equal(allowedWrite('POST', 'http://localhost:8080/index.php/apps/launchpad/api/dashboards/0b4c-11/lock', allow), true)
	assert.equal(allowedWrite('POST', 'http://localhost:8080/apps/launchpad/api/dashboards/0b4c-11/unlock', allow), false)
	assert.equal(allowedWrite('DELETE', 'http://localhost:8080/apps/launchpad/api/dashboards/0b4c-11/lock', allow), false)
	assert.equal(allowedWrite('POST', 'http://localhost:8080/apps/launchpad/api/dashboards/a/b/lock', allow), false)
	assert.equal(allowedWrite('POST', 'http://localhost:8080/apps/launchpad/api/dashboards/1/lock', []), false)
})

test('pre-steps open a route, fill from the environment and press a key, in order', { skip }, async () => {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage()
		await page.route('http://compdiff.test/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<form onsubmit="event.preventDefault(); document.title = this.p.value"><input name="p" type="password"></form>' }))
		await playSteps(page, parseSteps('[{"goto":"/apps/keepiq/lock"},{"fill":"input[name=p]","value":"${KQ_VAULT}"},{"press":"input[name=p]","key":"Enter"}]'), undefined, { base: 'http://compdiff.test', env: { KQ_VAULT: 'geheim' } })
		assert.equal(await page.title(), 'geheim')
		assert.equal(new URL(page.url()).pathname, '/apps/keepiq/lock')
	} finally {
		await browser.close()
	}
})
