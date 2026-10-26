// node --test scripts/screens/compdiff/live.test.mjs
// The live side: which account a board is measured as, elements a spec leaves out, and the wait for a table whose
// selection column renders late. The browser tests need PLAYWRIGHT_MODULE and Chrome, and skip without them.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { accountFor, markIgnored, parkPointer, readPosts, resetScroll, routeId, sessionEntries, tableShape, loadingCount, trackRequests, waitForLoaded, waitForQuiet, waitForTables } from './live.mjs'

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

test('--session seeds the live page\'s session storage: a string as is, anything else as JSON', () => {
	assert.deepEqual(sessionEntries(undefined), [])
	assert.deepEqual(sessionEntries('{"cn-access-purposes":["cn-access-purpose:dossiq-case:e0b3"],"tab":"vth"}'), [
		['cn-access-purposes', '["cn-access-purpose:dossiq-case:e0b3"]'],
		['tab', 'vth'],
	])
	assert.throws(() => sessionEntries('[1,2]'), /--session/)
	assert.throws(() => sessionEntries('not json'), /--session/)
})

test('--read-post lets a POST that only reads through, by path glob; every other write stays refused', () => {
	const allowed = readPosts('/apps/openregister/api/objects/*/case/dedup-check|/apps/dossiq/api/search')
	assert.equal(allowed('POST', 'http://localhost:8080/index.php/apps/openregister/api/objects/dossiq/case/dedup-check'), true)
	assert.equal(allowed('POST', 'http://localhost:8080/apps/dossiq/api/search?q=x'), true)
	assert.equal(allowed('POST', 'http://localhost:8080/index.php/apps/openregister/api/objects/dossiq/case'), false)
	assert.equal(allowed('PUT', 'http://localhost:8080/index.php/apps/openregister/api/objects/dossiq/case/dedup-check'), false)
	assert.equal(readPosts(undefined)('POST', 'http://localhost:8080/apps/dossiq/api/search'), false)
})

test('the document and an inner scroll area scrolled by a hash are scrolled back to the top', { skip }, async () => {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
		await page.setContent(`<div id="app-content" style="height:400px;overflow:auto"><h1>Instellingen</h1><div style="height:1200px"></div><section id="section-kadaster">Kadaster</section></div><div style="height:2000px"></div>`)
		await page.evaluate(() => { document.getElementById('section-kadaster').scrollIntoView(); window.scrollTo(0, 300) })
		assert.ok(await page.evaluate(() => document.getElementById('app-content').scrollTop > 0))
		assert.equal(await resetScroll(page), 2)
		assert.deepEqual(await page.evaluate(() => [document.getElementById('app-content').scrollTop, document.scrollingElement.scrollTop]), [0, 0])
	} finally {
		await browser.close()
	}
})

test('after a click the pointer is parked over no control, so a hover ground is not measured', { skip }, async () => {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
		await page.setContent(`<style>button{background:#fff}button:hover{background:rgb(240,241,243)}</style><button id="meer" style="position:absolute;left:600px;top:20px;height:40px">Meer</button><button style="position:absolute;right:0;bottom:0;width:40px;height:40px">AI</button>`)
		await page.click('#meer')
		const bg = () => page.evaluate(() => getComputedStyle(document.getElementById('meer')).backgroundColor)
		assert.equal(await bg(), 'rgb(240, 241, 243)')
		const spot = await parkPointer(page)
		assert.ok(spot)
		assert.equal(await bg(), 'rgb(255, 255, 255)')
		assert.equal(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y).closest('button'), spot), false)
	} finally {
		await browser.close()
	}
})

test('a session seed keyed by the record follows the route\'s record id ({routeId}), so a lookup route keeps it', () => {
	const id = 'e0b306d2-c523-5938-9b5c-3474d292dc01'
	assert.equal(routeId(`/apps/dossiq/cases/${id}?tab=x`), id)
	assert.equal(routeId('/apps/dossiq/cases'), null)
	assert.deepEqual(sessionEntries('{"cn-access-purposes":["cn-access-purpose:case:{routeId}"]}', id), [['cn-access-purposes', `["cn-access-purpose:case:${id}"]`]])
	assert.throws(() => sessionEntries('{"k":"{routeId}"}', null), /no record id/)
})

test('waits for a widget that fills seconds after the page, until no loading indicator shows', { skip }, async () => {
	await withPage('<section><h2>Kaarten</h2><div class="cn-widget__loading"><span class="loading-icon" style="display:inline-block;width:20px;height:20px"></span></div></section>', async (page) => {
		await page.evaluate(() => setTimeout(() => { document.querySelector('.cn-widget__loading').outerHTML = '<ul><li><a href="#">Hoorzitting voorbereiden</a></li></ul>' }, 1200))
		assert.ok(await page.evaluate(loadingCount) > 0)
		assert.equal(await waitForLoaded(page, { timeout: 6000, still: 300 }), true)
		assert.equal(await page.evaluate(() => document.querySelectorAll('li').length), 1)
	})
	await withPage('<span class="loading-icon" style="display:inline-block;width:20px;height:20px"></span>', async (page) => {
		assert.equal(await waitForLoaded(page, { timeout: 600, still: 100 }), false)
	})
})
