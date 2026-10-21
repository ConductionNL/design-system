// node --test scripts/screens/compdiff/extract.test.mjs
// Needs a playwright package (PLAYWRIGHT_MODULE) and Chrome (CHROME); skips without them.
// The extractor measures a toolbar line that no element boxes (CnActionsBar's board layout: a wrapping flex bar
// whose row wrappers are `display: contents`), and reads a table's head from its first labelled header cell, not
// from a selection column's empty cell.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseColour } from './colour.mjs'

const require = createRequire(import.meta.url)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const EXTRACT = `${parseColour.toString()}\n` + fs.readFileSync(path.join(HERE, 'extract.js'), 'utf8')
const CHROME = process.env.CHROME || '/opt/google/chrome/chrome'

let chromium = null
try {
	chromium = require(process.env.PLAYWRIGHT_MODULE || 'playwright').chromium
} catch {
	chromium = null
}
const skip = !chromium || !fs.existsSync(CHROME) ? 'no playwright or Chrome' : false

/**
 * Measures a page made of the given body.
 *
 * @param {string} body The HTML of the page body.
 * @return {Promise<object>} The extractor's result.
 */
async function measure(body) {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
		await page.setContent(`<!doctype html><html><body style="margin:0;font:14px sans-serif">${body}</body></html>`)
		await page.addScriptTag({ content: EXTRACT })
		return await page.evaluate(() => window.__compdiffExtract())
	} finally {
		await browser.close()
	}
}

const btn = (label) => `<button style="height:38px">${label}</button>`

test('a wrapping bar with display: contents rows is measured as one toolbar line', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:1100px">
		<div class="bar" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
			<div style="display:contents">
				<div style="display:flex;gap:8px">${btn('Alles')}${btn('Met geheimhouding')}</div>
				<div style="display:flex;gap:8px;margin-left:auto">${btn('Filter')}${btn('Lijst')}</div>
			</div>
			<div style="display:flex;flex:0 0 100%;gap:8px"><input type="search" style="height:40px;width:360px">${btn('Wissen')}</div>
		</div></div>`)
	const toolbars = r.components.filter((c) => c.role === 'toolbar')
	const line = toolbars.find((t) => t.rect.y === 200)
	assert.ok(line, JSON.stringify(toolbars.map((t) => t.rect)))
	assert.equal(line.rect.w, 1100)
	assert.equal(line.rect.x, 300)
	assert.equal(line.controls, 4)
	// The chip group inside the line is not a toolbar of its own.
	assert.equal(toolbars.filter((t) => t.rect.y === 200).length, 1)
})

test('a table head is read from its first labelled header cell', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:800px"><table style="width:800px">
		<thead><tr><th style="width:28px"></th><th style="font-weight:600">Naam</th></tr></thead>
		<tbody><tr><td><input type="checkbox"></td><td>Pieter</td></tr></tbody></table></div>`)
	const table = r.components.find((c) => c.role === 'table')
	assert.equal(table.head.fontWeight, 600)
})
