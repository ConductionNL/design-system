// node --test scripts/screens/compdiff/live.test.mjs
// The live side: which account a board is measured as, elements a spec leaves out, and the wait for a table whose
// selection column renders late. The browser tests need PLAYWRIGHT_MODULE and Chrome, and skip without them.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { accountFor, markIgnored, tableShape, waitForTables } from './live.mjs'

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
