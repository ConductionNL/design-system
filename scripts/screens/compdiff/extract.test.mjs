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
import { compareProps, pairComponents } from './compare.mjs'

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

test('with a modal dialog open, only what is inside it is measured', { skip }, async () => {
	const page = `<div style="position:absolute;left:300px;top:100px;width:800px">
		<h1>Zaak</h1>
		<section style="border:1px solid #ccc;padding:20px;height:120px"><h2>Zaakgegevens</h2>${btn('Bewerken')}</section></div>`
	const scrim = (inner) => `<div style="position:fixed;inset:0;background:rgba(0,0,0,.45)">${inner}</div>`
	const dialog = `<div role="dialog" aria-modal="true" style="position:absolute;left:400px;top:90px;width:600px;background:#fff;border-radius:12px;padding:20px">
		<h2>Locatie toevoegen</h2><input style="height:40px;width:400px">${btn('Opslaan')}</div>`
	// The board puts aria-modal on the dialog box; NcModal puts it on the full-screen mask.
	for (const body of [page + scrim(dialog), page + `<div aria-modal="true" role="dialog" style="position:fixed;inset:0;background:rgba(0,0,0,.45)">${dialog.replace(' role="dialog" aria-modal="true"', '')}</div>`]) {
		const r = await measure(body)
		assert.deepEqual(r.components.filter((c) => c.role !== 'dialog').map((c) => c.title), [])
		assert.equal(r.components.filter((c) => c.role === 'dialog').length, 1)
		assert.deepEqual(r.elements.map((e) => e.label).sort(), ['', 'Opslaan'])
	}
})

test('the tab underline is read where it is drawn, on a bar around the tablist', { skip }, async () => {
	const tabs = '<div role="tablist" style="display:flex;gap:4px"><button role="tab" aria-selected="true" style="height:44px">Een</button><button role="tab" style="height:44px">Twee</button></div>'
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:900px">
		<div class="cn-tabs__bar" style="border-bottom:1px solid #e4e6ea"><div class="strip"><div class="nav">${tabs}</div></div></div>
		<div style="height:400px"></div></div>`)
	assert.equal(r.components.find((c) => c.role === 'tabs').borderBottom, 1)
	// A border far below the strip (the page around it) is not the strip's underline.
	const far = await measure(`<div style="position:absolute;left:300px;top:200px;width:900px;border-bottom:1px solid #000">${tabs}<div style="height:400px"></div></div>`)
	assert.equal(far.components.find((c) => c.role === 'tabs').borderBottom, 0)
})

test('a field border drawn as a ring or on a wrapper is the field border', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:700px">
		<input aria-label="Ring" style="height:40px;width:400px;border:0;border-radius:8px;box-shadow:0 0 0 1px rgb(138, 146, 158)">
		<div style="margin-top:40px;border:2px solid rgb(35, 74, 120);border-radius:8px;width:440px"><input aria-label="Wrapped" style="height:36px;width:400px;border:0;outline:0"></div>
		<div style="margin-top:40px;border:1px solid #000;padding:40px"><input aria-label="Bare" style="height:36px;width:400px;border:0"></div></div>`)
	const f = (label) => r.elements.find((e) => e.label === label).props
	assert.deepEqual([f('Ring').border, f('Ring').borderColor], [1, 'rgb(138, 146, 158)'])
	assert.deepEqual([f('Wrapped').border, f('Wrapped').borderColor], [2, 'rgb(35, 74, 120)'])
	// A box around more than the field (a card, a form section) is not the field's border.
	assert.equal(f('Bare').border, 0)
})

test('every card of a deck is measured, with its elements', { skip }, async () => {
	const sec = (t) => `<section style="border:1px solid #ccc;padding:20px;height:100px"><h2 style="margin:0">${t}</h2>${btn(t + ' bewerken')}</section>`
	const r = await measure(`<div style="position:absolute;left:300px;top:100px;width:800px;display:flex;flex-direction:column;gap:20px">${sec('Het verzoek')}${sec('Zaakgegevens')}${sec('Zaakplan')}</div>`)
	const cards = r.components.filter((c) => c.role === 'card')
	assert.deepEqual(cards.map((c) => c.record.index), [0, 1, 2])
	assert.ok(cards.every((c) => c.structure))
	assert.deepEqual(r.elements.map((e) => e.label), ['Het verzoek bewerken', 'Zaakgegevens bewerken', 'Zaakplan bewerken'])
})

test('a spec can leave elements out (data-compdiff-ignore)', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:700px">${btn('Zoeken')}<button data-compdiff-ignore style="height:48px">Deze site bewerken</button></div>`)
	assert.deepEqual(r.elements.map((e) => e.label), ['Zoeken'])
})

test('a nav of page links marked aria-current is a tab strip, measured like a tablist', { skip }, async () => {
	const link = (label, current) => `<a href="#${label}"${current ? ' aria-current="page"' : ''} style="display:inline-block;height:44px;line-height:44px;padding:0 12px;${current ? 'font-weight:600;border-bottom:2px solid #234a78' : ''}">${label}</a>`
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:900px">
		<nav aria-label="Pagina's" class="cn-index-page__page-tabs" style="display:flex;gap:4px;border-bottom:1px solid #e4e6ea">${link('Contracten', true)}${link('Leveranciers')}${link('Archief')}</nav>
		<div style="height:400px"></div></div>`)
	const tabs = r.components.filter((c) => c.role === 'tabs')
	assert.equal(tabs.length, 1)
	assert.equal(tabs[0].tabCount, 3)
	assert.equal(tabs[0].borderBottom, 1)
	assert.equal(tabs[0].gap, 4)
	assert.equal(tabs[0].active.fontWeight, 600)
	assert.equal(tabs[0].active.indicator, 2)
	assert.equal(tabs[0].inactive.indicator, 0)
	// The links are the strip's items, not elements or a toolbar of their own.
	assert.deepEqual(r.elements.map((e) => e.label), [])
	assert.deepEqual(r.components.filter((c) => c.role === 'toolbar'), [])
})

test('a breadcrumb nav or a vertical nav is not a tab strip', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:900px">
		<nav aria-label="Kruimelpad" class="breadcrumbs" style="display:flex;gap:8px"><a href="#a">Zaken</a><a href="#b" aria-current="page">Zaak 12</a></nav>
		<nav aria-label="Secties" style="display:flex;flex-direction:column"><a href="#c" aria-current="true">Een</a><a href="#d">Twee</a></nav></div>`)
	assert.deepEqual(r.components.filter((c) => c.role === 'tabs'), [])
})

test("the board's tablist pairs with live's page-tab nav and is compared property by property", { skip }, async () => {
	const style = (on) => `height:44px;padding:0 12px;border:0;background:none;font:${on ? 600 : 400} 14px sans-serif${on ? ';border-bottom:2px solid #234a78' : ''}`
	const board = await measure(`<div style="position:absolute;left:300px;top:200px;width:900px"><div role="tablist" style="display:flex;gap:4px;border-bottom:1px solid #e4e6ea">
		<button role="tab" aria-selected="true" style="${style(true)}">Contracten</button><button role="tab" style="${style(false)}">Leveranciers</button></div></div>`)
	const live = await measure(`<div style="position:absolute;left:300px;top:200px;width:900px"><nav aria-label="Pagina's" style="display:flex;gap:4px;border-bottom:1px solid #e4e6ea">
		<a href="#c" aria-current="page" style="display:inline-block;line-height:44px;${style(true)}">Contracten</a><a href="#l" style="display:inline-block;line-height:44px;${style(false)}">Leveranciers</a></nav></div>`)
	const { pairs, missing, extra } = pairComponents(board.components, live.components, 900)
	assert.deepEqual([missing, extra], [[], []])
	const pair = pairs.find((p) => p.board.role === 'tabs')
	assert.ok(pair)
	const rows = compareProps(pair.board, pair.live)
	assert.equal(rows.find((r) => r.prop === 'active.fontWeight').live, 600)
	assert.equal(rows.find((r) => r.prop === 'active.indicator').flag, null)
})

test('a field named by <label for> or a wrapping label carries that name, not its text', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:600px">
		<label for="reden">Reden</label><textarea id="reden" rows="2" style="width:500px">Besluit gepubliceerd</textarea>
		<label>Antwoord <input type="text" style="width:300px"></label>
		<span id="lb">Zoeken</span><input type="search" aria-labelledby="lb" style="width:300px"></div>`)
	const fields = r.elements.filter((e) => e.kind === 'field').map((e) => e.label)
	assert.deepEqual(fields.sort(), ['Antwoord', 'Reden', 'Zoeken'])
})

test('the buttons on the title line of a tall header block are header buttons', { skip }, async () => {
	const r = await measure(`<main style="position:absolute;left:290px;top:90px;width:1120px">
		<div class="detail__header" style="display:flex;justify-content:space-between;height:180px">
			<div class="detail__header-left"><h1 style="margin:0;font-size:28px">Verlichting fietspad</h1>
				<div style="margin-top:12px"><span>Woo-verzoek</span></div>
				<div style="margin-top:40px;height:40px">stepper</div></div>
			<div style="display:flex;gap:8px;align-items:flex-start">${btn('Document')}${btn('Bewerken')}${btn('Meer')}</div>
		</div></main>`)
	const ph = r.components.find((c) => c.role === 'pageHeader')
	assert.deepEqual(ph.buttons.map((b) => b.label), ['Document', 'Bewerken', 'Meer'])
})

test('an ARIA table with display: contents rows reads its row heights from the cells', { skip }, async () => {
	const r = await measure(`<div role="table" style="position:absolute;left:300px;top:200px;width:600px;display:grid;grid-template-columns:1fr 1fr">
		<div role="row" style="display:contents"><div role="columnheader" style="height:40px">Naam</div><div role="columnheader" style="height:40px">Fase</div></div>
		<div role="row" style="display:contents"><div role="cell" style="height:52px">Pieter</div><div role="cell" style="height:52px">Advies</div></div></div>`)
	const table = r.components.find((c) => c.role === 'table')
	assert.equal(table.headRowHeight, 40)
	assert.equal(table.rowHeight, 52)
})

test('a card that pads its header and body rows instead of itself reports that padding', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:400px">
		<section style="border:1px solid #ccc;border-radius:12px;padding:0">
			<div style="padding:20px 22px 0"><h3 style="margin:0">Locaties</h3></div>
			<div style="padding:10px 22px 20px">Nog geen locaties</div></section></div>`)
	const card = r.components.find((c) => c.title === 'Locaties')
	assert.deepEqual(card.props.padding, { top: 20, right: 22, bottom: 20, left: 22 })
})

test('a wrapping label is named by its own text, not by the value its control shows', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:600px">
		<label><span>Periode</span><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Periode</span>
			<div class="select"><span>Laatste 12 maanden</span><input id="p" type="search" style="width:200px"><label for="p">Periode</label></div></label></div>`)
	assert.deepEqual(r.elements.filter((e) => e.kind === 'field').map((e) => e.label), ['Periode'])
})

test('a pager row is a pager on both sides, never a toolbar or a tab strip', { skip }, async () => {
	const link = (t, cur) => `<a href="#"${cur ? ' aria-current="page"' : ''} style="display:inline-flex;min-width:34px;height:34px">${t}</a>`
	const board = await measure(`<div style="position:absolute;left:293px;top:600px;width:1118px;box-sizing:border-box;display:flex;justify-content:space-between;padding:12px 16px;border-top:1px solid #eee">
		<span>8 van 23</span><nav aria-label="Paginering" style="display:flex;gap:6px">${link('1', true)}${link('2')}${link('Volgende')}</nav></div>`)
	const live = await measure(`<div class="cn-pagination" style="position:absolute;left:293px;top:600px;width:1118px;box-sizing:border-box;display:flex;justify-content:space-between;padding:12px 16px;border-top:1px solid #eee">
		<span>8 van 23</span><nav aria-label="Pagination" style="display:flex;gap:6px">${btn('1')}${btn('2')}${btn('3')}${btn('Volgende')}</nav></div>`)
	for (const r of [board, live]) {
		const roles = r.components.map((c) => c.role)
		assert.deepEqual(roles, ['pager'], JSON.stringify(roles))
		assert.equal(r.components[0].rect.w, 1118)
		assert.equal(r.components[0].borderTop, 1)
	}
})

test('a native radio stretched by its row is measured as the glyph it draws', { skip }, async () => {
	const r = await measure(`<label style="position:absolute;left:300px;top:200px;display:flex;align-items:stretch;height:36px;width:400px">
		<input type="radio" name="a" style="margin:0"><span>Opschorten</span></label>`)
	const t = r.elements.find((e) => e.kind === 'toggle')
	assert.equal(t.rect.h, 36)
	assert.equal(t.props.h, t.rect.w)
})

test('a radius is read as drawn: 50%, 18px and 999px on a 36px circle all read 18', { skip }, async () => {
	const b = (rad) => `<button style="width:36px;height:36px;border:1px solid #888;border-radius:${rad}">x</button>`
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;display:flex;gap:40px">${b('50%')}${b('18px')}${b('999px')}</div>`)
	assert.deepEqual(r.elements.filter((e) => e.kind === 'pill').map((e) => e.props.borderRadius), [18, 18, 18])
})
