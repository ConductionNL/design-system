// node --test scripts/screens/compdiff/exempt.test.mjs
// Regions a board marks with data-compdiff-exempt: which kinds are on, and what taking one out does to the layout.
// The browser tests need PLAYWRIGHT_MODULE and Chrome, and skip without them.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { collapseExempt, parseExempt } from './exempt.mjs'
import { unknownFlags } from './flags.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
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
		await page.setContent(`<!doctype html><html><body style="margin: 0">${body}</body></html>`)
		await fn(page)
	} finally {
		await browser.close()
	}
}

test('banners are exempt by default, side states only when named', () => {
	assert.deepEqual(parseExempt(undefined), ['banner'])
	assert.deepEqual(parseExempt('none'), [])
	assert.deepEqual(parseExempt('side-states'), ['side-states'])
	assert.deepEqual(parseExempt('banner|side-states|banner'), ['banner', 'side-states'])
})

test('an unknown kind or a bare --exempt is refused', () => {
	assert.throws(() => parseExempt('toast'), /--exempt toast: unknown kind/)
	assert.throws(() => parseExempt('true'), /--exempt needs a value/)
	assert.throws(() => parseExempt('|'), /--exempt needs a value/)
})

test('--exempt is a flag compdiff reads, and a bad kind exits 2 before a browser starts', () => {
	assert.deepEqual(unknownFlags(['--board', 'DqZaken', '--url', '/apps/dossiq/cases', '--exempt', 'banner|side-states']), [])
	const r = spawnSync(process.execPath, [path.join(HERE, 'compdiff.mjs'), '--board', 'DqZaken', '--url', '/apps/dossiq/cases', '--exempt', 'toast'], { encoding: 'utf8', env: { ...process.env, COMPDIFF_USER: 'x', COMPDIFF_PASSWORD: 'x' } })
	assert.equal(r.status, 2)
	assert.match(r.stderr, /--exempt toast: unknown kind/)
})

const PAGE = `<main style="display: flex; flex-direction: column; gap: 10px; width: 600px">
	<div id="kop" style="height: 40px">Zaken</div>
	<div id="banner" role="status" data-compdiff-exempt="banner" style="height: 50px">2 zaken verplaatst</div>
	<div id="alert" role="alert" style="height: 30px">Altijd zichtbaar</div>
	<div id="lijst" style="height: 200px">Lijst</div>
	<section id="standen" aria-label="Meer tegels en hun lege standen" data-compdiff-exempt="side-states" style="height: 300px">Standen</section>
</main>`

test('a marked banner leaves the layout and what sits below it moves up; an unmarked alert stays', { skip }, async () => {
	await withPage(PAGE, async (page) => {
		const before = await page.evaluate(() => document.getElementById('lijst').getBoundingClientRect().y)
		const out = await page.evaluate(collapseExempt, ['banner'])
		assert.deepEqual(out.map((e) => [e.kind, e.text, e.rect.h]), [['banner', '2 zaken verplaatst', 50]])
		const after = await page.evaluate(() => ({ lijst: document.getElementById('lijst').getBoundingClientRect().y, alert: getComputedStyle(document.getElementById('alert')).display, standen: getComputedStyle(document.getElementById('standen')).display }))
		// The banner's 50px and the 10px gap after it are gone.
		assert.equal(before - after.lijst, 60)
		assert.equal(after.alert, 'block')
		assert.equal(after.standen, 'block')
	})
})

test('a side-state panel leaves the layout only when its kind is on', { skip }, async () => {
	await withPage(PAGE, async (page) => {
		const height = () => page.evaluate(() => document.querySelector('main').getBoundingClientRect().height)
		const full = await height()
		assert.deepEqual(await page.evaluate(collapseExempt, []), [])
		assert.equal(await height(), full)
		const out = await page.evaluate(collapseExempt, ['side-states'])
		assert.deepEqual(out.map((e) => e.kind), ['side-states'])
		assert.equal(full - await height(), 310)
	})
})

test('an element marked with two kinds leaves when either is on', { skip }, async () => {
	await withPage('<div id="x" data-compdiff-exempt="side-states banner" style="height: 20px">x</div>', async (page) => {
		const out = await page.evaluate(collapseExempt, ['banner'])
		assert.deepEqual(out.map((e) => e.kind), ['banner'])
		assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('x')).display), 'none')
	})
})
