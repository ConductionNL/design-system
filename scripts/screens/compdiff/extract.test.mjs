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
import { compareElement, compareProps, pairComponents } from './compare.mjs'

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

test('a wrapper around a form row is not the toolbar: the row and its gap are', { skip }, async () => {
	// DqTermijnen's quarter form: a widget box (flex column, gap 8) holding the form (flex row, gap 16).
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:1000px">
		<div class="box" style="display:flex;flex-direction:column;gap:8px">
			<form style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px"><input style="height:40px;width:130px">${btn('Rapport laden')}${btn('CSV exporteren')}</form>
		</div></div>`)
	const bars = r.components.filter((c) => c.role === 'toolbar')
	assert.equal(bars.length, 1)
	assert.equal(bars[0].gap, 16)
})

test('a table head is read from its first labelled header cell', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:800px"><table style="width:800px">
		<thead><tr><th style="width:28px"></th><th style="font-weight:600">Naam</th></tr></thead>
		<tbody><tr><td><input type="checkbox"></td><td>Pieter</td></tr></tbody></table></div>`)
	const table = r.components.find((c) => c.role === 'table')
	assert.equal(table.head.fontWeight, 600)
})

test('a table cell takes the type of its text, not of the cell around it', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:800px"><table style="width:800px">
		<thead><tr><th style="font-weight:600">Naam</th></tr></thead>
		<tbody><tr><td style="padding:11px 12px;font-weight:400"><a href="#" style="font-size:15px;font-weight:600">Bouwkosten</a></td></tr></tbody></table></div>`)
	const table = r.components.find((c) => c.role === 'table')
	assert.equal(table.cell.fontWeight, 600)
	assert.equal(table.cell.fontSize, 15)
	assert.equal(table.cell.paddingLeft, 12)
})

test('a table cell is read from the first labelled cell of the row, not a selection cell', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:800px"><table style="width:800px">
		<thead><tr><th style="width:28px"></th><th style="font-weight:600">Naam</th></tr></thead>
		<tbody><tr><td style="padding:14px 20px"><input type="checkbox" style="margin:0"></td><td style="padding:14px 16px">Pieter</td></tr></tbody></table></div>`)
	const table = r.components.find((c) => c.role === 'table')
	assert.equal(table.cell.paddingLeft, 16)
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
		<span>8 van 23</span><nav aria-label="Pagination" style="display:flex;gap:16px"><span style="display:flex;gap:6px">${btn('1')}${btn('2')}${btn('3')}${btn('Volgende')}</span></nav></div>`)
	for (const r of [board, live]) {
		const roles = r.components.map((c) => c.role)
		assert.deepEqual(roles, ['pager'], JSON.stringify(roles))
		assert.equal(r.components[0].rect.w, 1118)
		assert.equal(r.components[0].borderTop, 1)
		assert.ok(r.elements.filter((e) => e.label === '2').every((e) => e.inControl === 'pager'))
		assert.equal(r.components[0].gap, 6)
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

test('an unstyled input stretched over its label is measured as the icon that draws the switch', { skip }, async () => {
	const r = await measure(`<span class="checkbox-radio-switch" style="position:absolute;left:300px;top:200px;width:300px;height:36px;display:flex;align-items:center">
		<input type="checkbox" style="appearance:none;position:absolute;inset:0;margin:0;width:100%;height:36px;border:0">
		<span class="checkbox-content__icon" style="display:inline-flex"><svg width="18" height="18"><rect width="18" height="18"/></svg></span><span>Openbaar</span></span>`)
	const t = r.elements.find((e) => e.kind === 'toggle')
	assert.equal(t.props.h, 18)
})

test('a map is measured as a map, for place and size only, and its attribution is left out', { skip }, async () => {
	const board = await measure(`<div style="position:absolute;left:700px;top:300px;width:344px">
		<div role="img" aria-label="Kaart met een pin op de Lindelaan" style="height:120px;border-radius:8px;background:#e3f1f3"></div></div>`)
	const live = await measure(`<div style="position:absolute;left:700px;top:300px;width:344px">
		<div class="leaflet-container" style="position:relative;height:260px;background:#edeff2">
			<div class="leaflet-control-attribution" style="position:absolute;right:0;bottom:0;padding:0 5px;background:rgba(255,255,255,.8);border:1px solid #ccc;border-radius:4px;font-size:11px">Leaflet | © OpenStreetMap contributors</div></div></div>`)
	for (const r of [board, live]) {
		assert.deepEqual(r.components.map((c) => c.role), ['map'])
		assert.deepEqual(Object.keys(r.components[0]).sort(), ['libClass', 'rect', 'role', 'title'].concat(r.components[0].cls ? ['cls'] : []).sort())
	}
	assert.equal(live.elements.length, 0, JSON.stringify(live.elements.map((e) => e.label)))
})

test('a card is named by its own library class, not by an icon in its corner', { skip }, async () => {
	const r = await measure(`<aside class="app-sidebar" style="position:absolute;left:1050px;top:68px;width:388px;height:600px;background:#f5f6f8">
		<div class="cn-index-sidebar__header-icon" style="position:absolute;left:0;top:0;width:40px;height:40px"></div>
		<h2 style="margin:0;padding:13px 21px">Alle zaken</h2><p style="padding:0 21px">Filters</p></aside>`)
	const card = r.components.find((c) => c.title === 'Alle zaken')
	assert.equal(card.libClass, 'app-sidebar')
})

test('a control border under a card title is not a separator', { skip }, async () => {
	const r = await measure(`<section style="position:absolute;left:860px;top:420px;width:268px;background:#eceef1;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:12px">
		<h2 style="margin:0;font-size:15px">Besluit</h2>
		<button style="height:34px;border:1px dashed #828a95;border-radius:8px;background:transparent">Toon 7 meer</button></section>`)
	const card = r.components.find((c) => c.title === 'Besluit')
	assert.equal(card.header.separator, 0)
	assert.ok(!/divider/.test(card.structure || ''), card.structure)
})

test('a checkbox or radio is named by the first line of its label, not by its value', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:560px">
		<label style="display:flex;flex-direction:column;padding:12px"><span style="display:flex;gap:12px"><input type="radio" name="ls" value="gesture:suspend"><span style="display:flex;flex-direction:column"><strong>Opschorten</strong><span>De termijn staat stil</span></span></span></label>
		<span class="checkbox-radio-switch"><input id="pub" type="checkbox" value="deels_openbaar"><label for="pub" class="checkbox-radio-switch__content"><span>Deels openbaar</span></label></span>
		<label><input type="checkbox"> Ontvangstbevestiging sturen</label></div>`)
	assert.deepEqual(r.elements.filter((e) => e.kind === 'toggle').map((e) => e.label), ['Opschorten', 'Deels openbaar', 'Ontvangstbevestiging sturen'])
})

test('a list row drawn by the full-width button inside it is measured on that button', { skip }, async () => {
	const board = await measure(`<ul style="position:absolute;left:300px;top:200px;width:300px;list-style:none;margin:0;padding:0">
		<li style="display:flex;padding:8px 10px;border-radius:8px;font-size:14px;height:20px"><span>Fysiek domein</span></li></ul>`)
	const live = await measure(`<ul style="position:absolute;left:300px;top:200px;width:300px;list-style:none;margin:0;padding:0">
		<li class="cn-folder-tree__node"><button class="cn-folder-tree__item" style="display:flex;width:100%;height:36px;padding:8px 10px;border:0;border-radius:8px;background:transparent;font-size:14px">Fysiek domein</button></li></ul>`)
	const menu = await measure(`<ul role="tree" style="position:absolute;left:300px;top:200px;width:300px;list-style:none;margin:0;padding:0">
		<li role="treeitem" class="cn-menu-tree-node"><div class="cn-menu-tree-node__row" style="padding:8px 10px;border-radius:8px"><a href="#" style="display:block">Fysiek domein</a></div></li></ul>`)
	for (const r of [board, live, menu]) {
		const rows = r.elements.filter((e) => e.label === 'Fysiek domein')
		assert.deepEqual(rows.map((e) => e.kind), ['row'])
		assert.equal(rows[0].props.borderRadius, 8)
		assert.equal(rows[0].props.paddingLeft, 10)
	}
})

test('a button hidden from assistive tech (NcSelect chevron) is not an element or a control', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:600px;display:flex;gap:8px;align-items:center">
		${btn('Filter')}<div class="v-select" style="display:flex;align-items:center;border:1px solid #888;height:36px;width:240px">
		<input type="search" aria-label="Zaaktype" style="border:0;flex:1"><button type="button" class="vs__open-indicator-button" aria-hidden="true" tabindex="-1" style="width:20px;height:20px">v</button></div>
		<span aria-hidden="true"><button style="height:30px">x</button></span></div>`)
	assert.deepEqual(r.elements.filter((e) => e.kind === 'button' || e.kind === 'pill').map((e) => e.label), ['Filter'])
})

test('a disabled "Volgende" drawn as a span in a pager is a page link, not a badge', { skip }, async () => {
	const r = await measure(`<div class="cn-pagination" style="position:absolute;left:293px;top:600px;width:1118px;box-sizing:border-box;display:flex;justify-content:space-between;padding:12px 16px;border-top:1px solid #eee">
		<span>1 van 1</span><nav aria-label="Pagination" style="display:flex;gap:6px">${btn('1')}
		<span aria-disabled="true" style="display:inline-flex;align-items:center;height:36px;padding:0 12px;border:1px solid #e4e6ea;border-radius:8px;background:#fff">Volgende</span></nav></div>`)
	const v = r.elements.find((e) => e.label === 'Volgende')
	assert.equal(v.kind, 'button')
	assert.equal(r.elements.find((e) => e.label === '1').interactive, true)
})

test('a settings-section description beside its title is part of the header, as it is in a wrapper', { skip }, async () => {
	const table = '<table style="width:100%"><tr><td style="padding:0 12px">Bron</td></tr></table>'
	const board = await measure(`<section style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:14px">
		<div style="display:flex;flex-direction:column;gap:2px"><h2 style="margin:0">Koppelingen</h2><span>Een koppeling staat uit.</span></div>${table}</section>`)
	const live = await measure(`<div class="settings-section" style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px">
		<h2 style="margin:0 0 2px">Koppelingen</h2><p class="settings-section__desc" style="margin:0 0 14px">Een koppeling staat uit.</p>${table}</div>`)
	const inset = (r) => r.components.find((c) => c.title === 'Koppelingen').content.firstRowInsetLeft
	assert.equal(inset(live), inset(board))
})

test('a native radio or checkbox has no background to compare, checked, disabled or not', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;display:flex;gap:20px">
		<label><input type="radio" name="a" checked> Openbaar</label><label><input type="checkbox" disabled> Deels</label>
		<label><input type="checkbox" style="appearance:none;width:18px;height:18px;background:#3669a5"> Eigen</label></div>`)
	const t = Object.fromEntries(r.elements.filter((e) => e.kind === 'toggle').map((e) => [e.label, e.props]))
	assert.equal(t.Openbaar.background, null)
	assert.equal(t.Deels.background, null)
	assert.notEqual(t.Eigen.background, null)
})

test('a bordered or filled label (a choice card) is a card', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:400px;top:200px;width:592px;display:flex;flex-direction:column;gap:12px">
		<label style="display:flex;gap:12px;padding:12px 14px;border:1px solid #828a95;border-radius:10px"><input type="radio" name="s"><span><strong>Opschorten</strong><br>De termijn staat stil</span></label>
		<label style="display:flex;gap:12px;padding:12px 14px;min-height:52px;border-radius:10px;background:#eaf0f7"><input type="checkbox"><span>Sanne de Vries laten weten dat de zaak is overgedragen</span></label></div>`)
	assert.equal(r.components.filter((c) => c.role === 'card').length, 2, JSON.stringify(r.components.map((c) => c.role)))
	assert.ok(!r.unmeasured.some((u) => u.tag === 'label' || /^label/.test(u.tag || u.el || '')), JSON.stringify(r.unmeasured))
})

test('a row is not measured on a bar or a first-line link that does not hold the whole row', { skip }, async () => {
	const r = await measure(`<ol style="position:absolute;left:300px;top:200px;width:660px;display:flex;gap:8px;list-style:none;margin:0;padding:0">
		<li style="flex:1;display:flex;flex-direction:column;gap:6px;height:40px"><span style="height:6px;background:#cc0000;border-radius:3px"></span><span>Beoordeling</span></li></ol>
		<ul style="position:absolute;left:300px;top:400px;width:600px;list-style:none;margin:0;padding:0">
		<li style="height:63px"><a href="#" style="display:block;padding:0 12px;border-radius:8px;background:#eaf0f7;height:34px">Advies verlichting fietspad</a><span>PDF · 1,2 MB</span></li></ul>`)
	const step = r.elements.find((e) => e.label === 'Beoordeling')
	assert.equal(step.props.h, 40)
	const file = r.elements.find((e) => e.kind === 'row' && /Advies/.test(e.label))
	assert.equal(file.props.h, 63)
})

test('a link that wrapped under the title in a narrow card is still a header action', { skip }, async () => {
	const r = await measure(`<section style="position:absolute;left:300px;top:200px;width:316px;background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:6px">
		<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:10px 16px"><div style="flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:3px"><h2 style="margin:0;font-size:17px;font-weight:700">Vastgelopen zaken</h2></div>
		<div style="flex:none;display:flex;flex-wrap:wrap;gap:8px"><a href="#" style="font-size:14px;font-weight:600">Alles bekijken</a></div></div>
		<ul style="margin:0;padding:0;list-style:none"><li>Zaak 1</li><li>Zaak 2</li></ul></section>`)
	const card = r.components.find((c) => c.title === 'Vastgelopen zaken')
	assert.equal(card.header.actions, 1)
})

test('a heading block with a subtitle under the title still makes the row with its actions the header', { skip }, async () => {
	const r = await measure(`<section style="position:absolute;left:292px;top:200px;width:800px;background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px">
		<div class="cn-timeline-manage__header" style="display:flex;justify-content:space-between;align-items:flex-start">
			<div class="cn-timeline-manage__heading"><h3 style="margin:0;font-size:17px">Historie van de zaak</h3><p style="margin:4px 0 0;font-size:13px">Alles wat er met deze zaak is gebeurd</p></div>
			<div style="display:flex;gap:8px">${btn('Een notitie toevoegen')}${btn('Exporteren')}</div></div>
		<ul style="margin:16px 0 0;padding:0;list-style:none"><li>Zaak aangemaakt</li><li>Status gewijzigd</li></ul></section>`)
	const card = r.components.find((c) => c.title === 'Historie van de zaak')
	assert.equal(card.header.actions, 2)
})

test('a list row holding its open button and row menu is not a toolbar', { skip }, async () => {
	const row = (name) => `<li style="display:flex;align-items:center;gap:4px;height:40px">${btn(name).replace('height:38px', 'height:34px;flex:1')}<button aria-label="Acties" style="width:34px;height:34px">…</button></li>`
	const r = await measure(`<section style="position:absolute;left:1100px;top:200px;width:310px"><ul style="list-style:none;margin:0;padding:0">
		${row('Aan mij toegewezen')}${row('AVG-verzoeken')}${row('Mijn zaken, deze week')}</ul>
		<ul style="list-style:none;margin:0;padding:0"><li style="display:flex;flex-direction:column"><div style="display:flex;align-items:center;gap:8px;width:300px">${btn('Wacht op inwoner')}<button aria-label="Beheer" style="width:34px;height:34px">…</button></div></li></ul></section>`)
	assert.deepEqual(r.components.filter((c) => c.role === 'toolbar'), [])
})

test('a select field has the chevron its wrapper draws beside the input as its icon', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:400px">
		<div class="v-select" style="display:flex;align-items:center;width:360px;height:40px;border:1px solid #828a95;border-radius:8px">
		<input role="combobox" aria-label="Register" style="flex:1;border:0;height:36px">
		<span class="vs__actions" style="display:flex"><svg width="20" height="20"><path d="M7 10l5 5 5-5z"/></svg></span></div></div>`)
	assert.equal(r.elements.find((e) => e.label === 'Register').props.icon, true)
	const native = await measure(`<label style="position:absolute;left:300px;top:200px">Soort bericht <select style="width:280px;height:40px"><option>Bericht</option></select></label>`)
	assert.equal(native.elements.find((e) => e.kind === 'field').props.icon, true)
})

test('a switch whose real input is hidden is measured on the icon that draws it', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:400px">
		<span class="checkbox-radio-switch" style="position:relative;display:flex;align-items:center;gap:8px">
		<input id="besluit" class="checkbox-radio-switch__input" type="checkbox" style="position:absolute;opacity:0;width:20px;height:34px;margin:0">
		<label for="besluit" style="display:flex;gap:8px;align-items:center"><span class="checkbox-content__icon"><svg width="20" height="20"><rect width="20" height="20"/></svg></span><span>Dit is een besluit</span></label></span></div>`)
	const t = r.elements.filter((e) => e.kind === 'toggle')
	assert.deepEqual(t.map((e) => e.label), ['Dit is een besluit'])
	assert.equal(t[0].props.h, 20)
	// The glyph is the switch itself, as a native checkbox is: it has no icon of its own.
	assert.equal(t[0].props.icon, false)
})

test('a plain line of smaller text right under a card title is its description on both sides', { skip }, async () => {
	const field = '<div style="margin-top:10px"><span>Register</span><div role="combobox" aria-label="Register" style="height:40px;border:1px solid #888"></div></div>'
	const board = await measure(`<section style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 24px;display:flex;flex-direction:column;gap:6px">
		<h2 style="margin:0;font-size:17px">Configuratie</h2><p style="margin:0;font-size:14px;color:#5e6168">In welk register Dossiq zaken bewaart.</p>${field}</section>`)
	const live = await measure(`<div class="settings-section" style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 24px">
		<h2 style="margin:0 0 6px;font-size:17px">Configuratie</h2><p class="settings-section__desc" style="margin:0;padding-bottom:6px;font-size:14px">In welk register Dossiq zaken bewaart.</p>${field}</div>`)
	const gap = (r) => r.components.find((c) => c.title === 'Configuratie').content.gapBelowTitle
	assert.ok(gap(board) > 30, `board gap ${gap(board)}`)
	assert.ok(Math.abs(gap(board) - gap(live)) <= 4, `board ${gap(board)} vs live ${gap(live)}`)
})

test('a 1px border with a 1px ring of the same colour reads as the 2px border people see', { skip }, async () => {
	const row = (style) => `<div style="position:absolute;left:400px;top:200px;width:592px;display:flex;flex-direction:column;gap:12px">
		<label style="display:flex;gap:12px;padding:12px 14px;border-radius:10px;${style}"><input type="radio" name="s" checked><span><strong>Briefsjabloon</strong><br>Met huisstijl</span></label>
		<label style="display:flex;gap:12px;padding:12px 14px;border-radius:10px;border:1px solid #828a95"><input type="radio" name="s"><span><strong>Leeg</strong><br>Zonder sjabloon</span></label></div>`
	const board = await measure(row('border:2px solid rgb(54, 105, 165)'))
	const live = await measure(row('border:1px solid rgb(54, 105, 165);box-shadow:inset 0 0 0 1px rgb(54, 105, 165)'))
	const chosen = (r) => r.components.find((c) => c.role === 'card' && /Briefsjabloon/.test(c.title || JSON.stringify(c.elements || '')) ) || r.components.filter((c) => c.role === 'card')[0]
	assert.deepEqual(chosen(live).props.border, chosen(board).props.border)
	assert.equal(chosen(live).props.border.top, 2)
	// The ring is the border, not a shadow: no "shadow extra on live".
	assert.equal(chosen(live).props.boxShadow, 'none')
})

test('a button set on the title line outside the title\'s own row is a header action (NcSettingsSection)', { skip }, async () => {
	const board = await measure(`<section style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px">
		<div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Inspectiechecklists</h2>${btn('Checklist toevoegen')}</div>
		<p style="margin:14px 0 0">Brandveiligheid</p></section>`)
	const live = await measure(`<div class="settings-section" style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px">
		<h2 style="margin:0">Inspectiechecklists</h2>
		<div class="actions" style="position:absolute;right:22px;top:16px">${btn('Checklist toevoegen')}</div>
		<p style="margin:14px 0 0">Brandveiligheid</p></div>`)
	const actions = (r) => r.components.find((c) => c.title === 'Inspectiechecklists').header.actions
	assert.equal(actions(board), 1)
	assert.equal(actions(live), 1)
})

test('a button lower in the card is not a header action', { skip }, async () => {
	const r = await measure(`<div class="settings-section" style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px">
		<h2 style="margin:0">Legesregels</h2><p style="margin:14px 0">Bouwen</p>${btn('Regel toevoegen')}</div>`)
	assert.equal(r.components.find((c) => c.title === 'Legesregels').header.actions, 0)
})

test('a grid of bordered tiles under a card title is content, whether or not a tile reads as a card of its own', { skip }, async () => {
	const tile = (t) => `<li style="display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid #e4e6ea;border-radius:8px;min-width:0"><span style="width:14px;height:14px;border-radius:7px;background:#369"></span><span style="flex:1">${t}</span><span style="color:#5e6168">Start</span></li>`
	const r = await measure(`<section style="position:absolute;left:300px;top:200px;width:800px;border:1px solid #ddd;padding:20px 22px">
		<div style="display:flex;flex-direction:column;gap:14px">
			<div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;font-size:17px">Statussen</h2>${btn('Bewerken')}</div>
			<ul style="margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px">${tile('Ontvangen')}${tile('Aanvullende gegevens gevraagd voor de beoordeling van de aanvraag')}${tile('In behandeling')}${tile('Besluit')}</ul>
		</div><p style="margin:14px 0 0;font-size:13px">Kleur en volgorde gelden in lijsten.</p></section>`)
	const card = r.components.find((c) => c.title === 'Statussen')
	assert.ok(card.content.gapBelowTitle < 40, `gap ${card.content.gapBelowTitle}`)
	// The tile whose name wraps to two lines is as much a row as the others.
	assert.equal(r.components.filter((c) => c.role === 'card').length, 1, JSON.stringify(r.components.map((c) => [c.role, c.rect.h])))
})

test('an icon set beside the first line, a few px lower than its text, still leads the first row', { skip }, async () => {
	const icon = (top) => `<svg width="20" height="20" style="flex:none;margin-top:${top}px"><rect width="20" height="20"/></svg>`
	const card = (top) => `<div style="position:absolute;left:300px;top:200px;width:600px;border:1px solid #ddd;padding:12px 14px">
		<h3 style="margin:0 0 10px">Let op</h3>
		<div style="display:flex;gap:10px;align-items:flex-start;line-height:1.5">${icon(top)}<p style="margin:0">Heeft iemand zich afgemeld voor berichten, dan krijgt die alleen nog wat de wet verplicht.</p></div></div>`
	const board = await measure(card(0))
	const live = await measure(card(9))
	const inset = (r) => r.components.find((c) => c.title === 'Let op').content.firstRowInsetLeft
	assert.equal(inset(live), inset(board))
})

test('chips on a toolbar row are not counted as its controls, as buttons or as spans', { skip }, async () => {
	const chip = (t, tag) => `<${tag} style="height:34px;padding:0 12px;border-radius:17px;border:1px solid #ccc;display:inline-flex;align-items:center">${t}</${tag}>`
	const bar = (tag) => `<div style="position:absolute;left:300px;top:200px;width:900px;display:flex;gap:8px;align-items:center">
		${btn('Lijst')}${btn('Kaarten')}${chip('Vandaag', tag)}${chip('Deze week', tag)}${chip('Later', tag)}</div>`
	const controls = (r) => r.components.find((c) => c.role === 'toolbar').controls
	assert.equal(controls(await measure(bar('button'))), 2)
	assert.equal(controls(await measure(bar('span'))), 2)
})

test('a rule drawn above the first row is the separator under the title, as a header border is', { skip }, async () => {
	const rows = (first) => ['Woo-verzoek Lindelaan', 'Bezwaar Kerkplein', 'Melding Molenweg'].map((t, i) => `<li style="padding:10px 0;${i === 0 ? first : 'border-top:1px solid #e4e6ea'}">${t}</li>`).join('')
	const board = await measure(`<section style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px">
		<h2 style="margin:0;padding-bottom:12px;border-bottom:1px solid #e4e6ea">Zaken die u volgt</h2><ul style="margin:0;padding:0;list-style:none">${rows('')}</ul></section>`)
	const live = await measure(`<section style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px">
		<h2 style="margin:0 0 12px">Zaken die u volgt</h2><ul style="margin:0;padding:0;list-style:none">${rows('border-top:1px solid #e4e6ea')}</ul></section>`)
	const sep = (r) => r.components.find((c) => c.title === 'Zaken die u volgt').header.separator
	assert.equal(sep(board), 1)
	assert.equal(sep(live), 1)
})

test('a dialog\'s close button is not a header action, wherever each side places it', { skip }, async () => {
	const x = (style) => `<button aria-label="Sluiten" style="width:36px;height:36px;${style}">×</button>`
	const dialog = (close, extra = '') => `<div role="dialog" aria-modal="true" style="position:absolute;left:400px;top:90px;width:600px;background:#fff;border-radius:12px;padding:20px">
		<div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Overdragen</h2>${extra}${close.inRow ? x('') : ''}</div>
		${close.inRow ? '' : x('position:absolute;right:8px;top:8px')}<p>Aan wie geeft u de zaak?</p><input style="height:40px;width:400px">${btn('Overdragen')}</div>`
	const inRow = await measure(dialog({ inRow: true }))
	const corner = await measure(dialog({ inRow: false }))
	const actions = (r) => r.components.find((c) => c.role === 'dialog').header.actions
	assert.equal(actions(inRow), 0)
	assert.equal(actions(corner), 0)
	// Another button in the title row still counts.
	assert.equal(actions(await measure(dialog({ inRow: true }, btn('Help')))), 1)
})

test('a chart right under a card title is content, not its description, as an svg or a canvas', { skip }, async () => {
	const chart = (kind) => kind === 'svg'
		? '<svg viewBox="0 0 900 250" width="100%" height="250" role="img" aria-label="Doorlooptijd per maand"><line x1="40" x2="880" y1="40" y2="40" stroke="#eee"/><text x="40" y="244" font-size="13">jan</text></svg>'
		: '<canvas width="900" height="250" style="width:100%;height:250px"></canvas>'
	const card = (kind) => `<section style="position:absolute;left:300px;top:200px;width:900px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:8px">
		<div><h2 style="margin:0;font-size:17px">Gemiddelde doorlooptijd per maand</h2></div>${chart(kind)}<span style="font-size:13px">Grafiek van de analyselaag.</span></section>`
	const gap = (r) => r.components.find((c) => /per maand/.test(c.title || '')).content.gapBelowTitle
	const svg = gap(await measure(card('svg')))
	const canvas = gap(await measure(card('canvas')))
	assert.ok(svg < 40, `svg gap ${svg}`)
	assert.ok(Math.abs(svg - canvas) <= 2, `svg ${svg} vs canvas ${canvas}`)
})

test('facts, a pill row or a list of rows right under a card title is content, not its description', { skip }, async () => {
	const bodies = {
		facts: '<dl style="margin:0;display:grid;grid-template-columns:130px 1fr;gap:8px 16px;font-size:14px"><dt>Prioriteit</dt><dd style="margin:0">Hoog</dd><dt>Reden</dt><dd style="margin:0">Raadsvraag</dd></dl>',
		pills: '<div style="font-size:13px"><span style="padding:2px 8px;border-radius:10px;background:#eaf0f7">Programma Fietsroutes</span> <span style="padding:2px 8px;border-radius:10px;background:#eaf0f7">3 zaken</span></div>',
		rows: '<div style="font-size:14px"><div style="display:flex;justify-content:space-between;padding:8px 0">Woo-verzoek<span>12</span></div><div style="display:flex;justify-content:space-between;padding:8px 0">Bezwaar<span>4</span></div><div style="display:flex;justify-content:space-between;padding:8px 0">Melding<span>9</span></div></div>',
	}
	for (const [name, body] of Object.entries(bodies)) {
		const r = await measure(`<section style="position:absolute;left:300px;top:200px;width:400px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:10px">
			<div><h2 style="margin:0;font-size:17px">Kaart</h2></div>${body}<span style="font-size:13px;color:#5e6168">Voetnoot onder de kaart.</span></section>`)
		const gap = r.components.find((c) => c.title === 'Kaart').content.gapBelowTitle
		assert.ok(gap < 20, `${name}: gap ${gap}`)
	}
	// A plain muted line of smaller text right under the title is still the description.
	const r = await measure(`<section style="position:absolute;left:300px;top:200px;width:400px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:6px">
		<div><h2 style="margin:0;font-size:17px">Kaart</h2></div><p style="margin:0;font-size:14px;color:#5e6168">Wie wat mag bij dit zaaktype</p><div style="margin-top:20px">Inhoud</div></section>`)
	assert.ok(r.components.find((c) => c.title === 'Kaart').content.gapBelowTitle > 30)
	// A 15px line in the title's own ink is content (an empty-state sentence), not a description.
	const empty = await measure(`<section style="position:absolute;left:300px;top:200px;width:400px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
		<h2 style="margin:0;font-size:17px">Programma</h2><p style="margin:0;font-size:15px">Deze zaak hangt niet onder een programma.</p><div>${btn('Aan een programma koppelen')}</div></section>`)
	assert.ok(empty.components.find((c) => c.title === 'Programma').content.gapBelowTitle < 20)
})

test('a drawn map as an svg named as a map is measured as a map, not as the card around it', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:311px;top:327px;width:655px;height:601px;border:1px solid #ddd;border-radius:12px;overflow:hidden">
		<svg viewBox="0 0 640 520" width="100%" height="100%" role="img" aria-label="Kaart van Zuiddrecht met 5 genummerde zaken"><rect width="640" height="520" fill="#f1efe9"/></svg></div>`)
	assert.equal(r.components.filter((c) => c.role === 'map').length, 1, JSON.stringify(r.components.map((c) => c.role)))
	assert.equal(r.components.filter((c) => c.role === 'card').length, 0)
})

test('a chart\'s own texts are one chart part of the card structure, as svg or as canvas', { skip }, async () => {
	const svg = '<svg width="600" height="200" role="img"><text x="10" y="20" font-size="12">Doorlooptijd (dagen)</text><text x="10" y="190" font-size="12">0-10</text><text x="100" y="190" font-size="12">11-20</text></svg>'
	const canvas = '<canvas width="600" height="200" style="width:600px;height:200px"></canvas>'
	const one = (title, chart) => `<section style="width:700px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:12px">
		<h2 style="margin:0;font-size:17px">${title}</h2>${chart}<span style="font-size:13px;color:#5e6168">Uit de analyselaag</span></section>`
	// Three cards of one width are a deck, whose cards carry a structure.
	const card = (chart) => `<div style="position:absolute;left:300px;top:20px;display:flex;flex-direction:column;gap:16px">${one('Verdeling doorlooptijd', chart)}${one('SLA-trend', chart)}${one('Doorstroom', chart)}</div>`
	const s = async (chart) => (await measure(card(chart))).components.find((c) => c.title === 'Verdeling doorlooptijd').structure
	assert.equal(await s(svg), await s(canvas))
	assert.match(await s(svg), /chart/)
})

test('a table\'s first head cell is not the title of the card that frames the table', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:300px;top:200px;width:1074px;border:1px solid #ddd;border-radius:12px">
		<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:10px 12px;font-weight:600">Zaaktype</th><th style="text-align:left;padding:10px 12px;font-weight:600">Open</th></tr></thead>
		<tbody><tr><td style="padding:11px 12px">Woo-verzoek</td><td style="padding:11px 12px">12</td></tr><tr><td style="padding:11px 12px">Bezwaar</td><td style="padding:11px 12px">4</td></tr></tbody></table></div>`)
	const card = r.components.find((c) => c.role === 'card')
	assert.ok(!card || !card.title, JSON.stringify(card && card.title))
})

test('the buttons on the page title\'s line are header buttons, not a toolbar, when they sit beside the title block', { skip }, async () => {
	const r = await measure(`<main style="position:absolute;left:292px;top:92px;width:1120px">
		<div class="detail__header" style="display:flex;justify-content:space-between;align-items:flex-start;height:180px">
			<div class="detail__header-left"><div class="detail__title-row"><h1 style="margin:0;font-size:28px">Verlichting fietspad Lindelaan</h1></div></div>
			<div class="detail__header-actions" style="display:flex;gap:8px">${btn('Bericht')}${btn('Document')}${btn('Contact vastleggen')}${btn('Bewerken')}${btn('Meer')}</div>
		</div></main>`)
	assert.equal(r.components.filter((c) => c.role === 'toolbar').length, 0, JSON.stringify(r.components.map((c) => c.role)))
	assert.deepEqual(r.components.find((c) => c.role === 'pageHeader').buttons.map((b) => b.label), ['Bericht', 'Document', 'Contact vastleggen', 'Bewerken', 'Meer'])
})

test('a small heading over a larger bold line is a kicker: the larger line is the card title, as heading or as paragraph', { skip }, async () => {
	const board = await measure(`<section style="position:absolute;left:292px;top:200px;width:1120px;border:1px solid #ddd;padding:20px 24px"><div style="display:flex;flex-direction:column;gap:6px">
		<h2 style="margin:0;font-size:13px;font-weight:700;color:#a30000">Vandaag eerst</h2><strong style="font-size:20px;font-weight:700">Parkeervergunningen binnenstad</strong><span style="font-size:15px">2026-0061 · Woo-verzoek</span></div></section>`)
	const live = await measure(`<section style="position:absolute;left:292px;top:200px;width:1120px;border:1px solid #ddd;padding:20px 24px"><div style="display:flex;flex-direction:column;gap:6px">
		<p style="margin:0;font-size:13px;font-weight:700;color:#a30000">Vandaag eerst</p><h3 style="margin:0;font-size:20px;font-weight:700">Parkeervergunningen binnenstad</h3><span style="font-size:15px">2026-0061 · Woo-verzoek</span></div></section>`)
	const title = (r) => r.components.find((c) => c.role === 'card').title
	assert.equal(title(board), 'Parkeervergunningen binnenstad')
	assert.equal(title(live), 'Parkeervergunningen binnenstad')
})

test('a framed band of bulk actions is one card, not also a toolbar of the same box', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:292px;top:384px;width:1120px;height:54px;box-sizing:border-box;display:flex;gap:8px;align-items:center;padding:0 16px;border:1px solid #ddd;border-radius:12px;background:#eaf0f7">
		<strong style="font-size:15px">Met de geselecteerde zaken</strong>${btn('Toewijzen')}${btn('Status wijzigen')}${btn('Exporteren')}</div>`)
	const at = (role) => r.components.filter((c) => c.role === role && Math.abs(c.rect.y - 384) < 3)
	assert.equal(at('card').length, 1, JSON.stringify(r.components.map((c) => [c.role, c.rect])))
	assert.equal(at('toolbar').length, 0)
})

test('a record card titled by a bold line inside a plain link carries that title', { skip }, async () => {
	const card = (t) => `<div style="width:265px;border:1px solid #ddd;border-radius:12px;padding:14px"><a href="#" style="color:inherit;text-decoration:none"><strong style="font-size:15px">${t}</strong></a><div style="font-size:13px;margin-top:6px">2026-0082 · Woo-verzoek</div></div>`
	const r = await measure(`<div style="position:absolute;left:292px;top:369px;display:grid;grid-template-columns:repeat(4,265px);gap:20px">${card('Verlichting fietspad Lindelaan')}${card('Melding afval')}${card('Parkeervergunningen')}${card('Terrasoverkapping')}</div>`)
	const titles = r.components.filter((c) => c.role === 'card').map((c) => c.title)
	assert.ok(titles.includes('Verlichting fietspad Lindelaan'), JSON.stringify(titles))
	// A button's label is still no title.
	const b = await measure(`<div style="position:absolute;left:292px;top:369px;width:265px;border:1px solid #ddd;padding:14px"><button style="font-weight:700;font-size:15px">Oppakken</button><div style="margin-top:6px">Tekst</div></div>`)
	assert.ok(!b.components.find((c) => c.role === 'card')?.title)
})

test('a 15px intro in a second dark text colour under a card title is content; a muted grey line is the description', { skip }, async () => {
	const card = (color) => `<section style="position:absolute;left:292px;top:200px;width:800px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:8px">
		<h2 style="margin:0;font-size:17px;color:#1b1c1d">Contactmomenten in het klantbeeld</h2><p style="margin:0;font-size:15px;color:${color}">Uit pipelinq: elk contactmoment dat op deze zaak staat.</p><p style="margin:0">Nog geen contactmomenten</p></section>`
	const gap = async (color) => (await measure(card(color))).components.find((c) => /klantbeeld/.test(c.title || '')).content.gapBelowTitle
	assert.ok(await gap('#3d4047') < 12)
	assert.ok(await gap('#5e6168') > 20)
})

test('cards wrapped one per grid cell are a deck, as bare sibling cards are', { skip }, async () => {
	const card = (t) => `<div class="cell"><a href="#" style="display:block;border:1px solid #ddd;border-radius:12px;padding:14px;height:200px;box-sizing:border-box"><strong style="font-size:17px">${t}</strong></a></div>`
	const r = await measure(`<div style="position:absolute;left:292px;top:400px;width:1120px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px">${['Melding afval', 'Parkeervergunningen', 'Terrasoverkapping', 'Openbare verlichting', 'Kapvergunning'].map(card).join('')}</div>`)
	const cards = r.components.filter((c) => c.role === 'card')
	assert.equal(cards.length, 5)
	assert.ok(cards.every((c) => c.record && c.record.count === 5), JSON.stringify(cards.map((c) => c.record)))
})

test('a component that starts below the captured frame is not measured', { skip }, async () => {
	const r = await measure(`<aside style="position:absolute;left:1108px;top:0;width:307px">
		<div style="height:920px"></div>${['Status', 'Zaaktype', 'Behandelaar'].map((t) => `<div style="height:50px;margin-top:20px;border:1px solid #ddd;border-radius:8px;padding:10px">${t} <b>filter</b></div>`).join('')}</aside>
		<section style="position:absolute;left:292px;top:200px;width:700px;border:1px solid #ddd;padding:20px"><h2 style="margin:0">Zichtbaar</h2><p>Inhoud</p></section>`)
	assert.deepEqual(r.components.filter((c) => c.role === 'card' && !c.belowFrame).map((c) => c.title), ['Zichtbaar'])
	// The rows below the frame are kept only as counterparts: unpaired, they are not extra.
	const { extra } = pairComponents(r.components.filter((c) => c.title === 'Zichtbaar'), r.components, 900)
	assert.deepEqual(extra, [])
})

test('a table the board draws inside its frame pairs with the same table drawn lower on a taller live page', { skip }, async () => {
	const page = (top) => `<section style="position:absolute;left:315px;top:${top}px;width:540px"><table style="width:540px;border-collapse:collapse"><thead><tr><th style="padding:8px">Zaak</th><th>Dagen</th></tr></thead><tbody><tr><td style="padding:8px">2026-0110</td><td>12</td></tr></tbody></table></section>`
	const board = await measure(page(700))
	const live = await measure(page(1000))
	const { pairs, missing, extra } = pairComponents(board.components, live.components, 900)
	assert.equal(pairs.filter((p) => p.board.role === 'table').length, 1)
	assert.deepEqual(missing.filter((c) => c.role === 'table'), [])
	assert.deepEqual(extra, [])
})

test('a card footer is one row when its due date wraps to two lines beside the pill', { skip }, async () => {
	const card = (due) => `<a href="#" style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:10px;text-decoration:none;color:#1b1c1d">
		<span style="display:flex;gap:8px;align-items:center"><span style="margin-left:auto;display:inline-block;padding:3px 10px;border-radius:12px;background:#fcedec;font-size:13px;font-weight:600">Kritiek</span><span style="font-size:13px;color:#5e6168">2026-4836</span></span>
		<strong style="font-size:17px;font-weight:700">Bezwaar parkeerboete</strong><span style="font-size:14px;color:#5e6168">Bezwaar · R. Yilmaz</span>
		<span style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:10px;border-top:1px solid #eef0f3"><span style="display:inline-block;padding:3px 10px;border-radius:12px;background:#e8e6f6;font-size:13px;font-weight:600;white-space:nowrap">In behandeling</span><span style="font-size:14px;font-weight:600;${due}">Termijn vandaag</span></span></a>`
	const r = await measure(`<div style="position:absolute;left:292px;top:400px;display:grid;grid-template-columns:repeat(4,265px);gap:20px">${card('')}${card('width:70px')}${card('')}</div>`)
	const cards = r.components.filter((c) => c.role === 'card').sort((a, b) => a.rect.x - b.rect.x)
	assert.equal(cards.length, 3)
	assert.equal(cards[1].structure, cards[0].structure)
	assert.match(cards[0].structure, /divider \/ pill deadline$/)
	assert.equal(cards[1].content.firstRowInsetLeft, cards[0].content.firstRowInsetLeft)
})

test('a side panel docked at the right edge is a card, ruled off by its left border inside a white container or drawn on the work ground', { skip }, async () => {
	const panel = '<aside style="position:absolute;right:0;top:68px;width:360px;height:820px;background:#fff;border-left:1px solid #e4e6ea;box-sizing:border-box;padding:20px"><h2 style="margin:0;font-size:20px">Alle zaken</h2><p>8 zaken, 8 op deze pagina</p></aside>'
	const live = await measure(`<div style="position:fixed;inset:68px 0 0 0;background:#fff"><main style="position:absolute;left:264px;top:0;width:816px;height:820px;background:#f5f6f8"></main>${panel}</div>`)
	const board = await measure(`<div style="position:fixed;inset:68px 0 0 0;background:#f5f6f8">${panel}</div>`)
	for (const r of [live, board]) {
		const c = r.components.find((x) => x.title === 'Alle zaken')
		assert.ok(c, JSON.stringify(r.components.map((x) => x.title)))
		assert.equal(c.rect.w, 360)
	}
	// A narrow ruled column inside the page is no side panel.
	const col = await measure('<div style="position:absolute;left:300px;top:100px;width:300px;height:800px;background:#fff;border-left:1px solid #ddd"><h2>Kolom</h2><p>tekst</p></div>')
	assert.ok(!col.components.find((x) => x.title === 'Kolom'))
})

test('a row menu drawn as an aria-labelled icon span in a record card\'s title row is a header action, as a button is', { skip }, async () => {
	const dots = '<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/></svg>'
	const card = (menu) => `<a href="#" style="display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:10px;background:#fff;border:1px solid #e4e6ea;text-decoration:none;width:244px">
		<span style="display:flex;align-items:flex-start;gap:8px"><strong style="flex:1;font-size:15px">Verlichting fietspad Lindelaan</strong>${menu}</span>
		<span style="font-size:13px;color:#5e6168">2026-0110 · Sanne de Vries</span><span style="font-size:13px">Termijn 8 nov</span></a>`
	const deck = (menu) => `<div style="position:absolute;left:300px;top:300px;display:flex;flex-direction:column;gap:10px">${card(menu)}${card(menu)}${card(menu)}</div>`
	const board = await measure(deck(`<span aria-label="Acties" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px">${dots}</span>`))
	const live = await measure(deck('<button type="button" aria-label="Acties voor Verlichting" style="width:28px;height:28px;padding:0"><span aria-hidden="true" style="font-size:20px;font-weight:700">⋯</span></button>'))
	const first = (r) => r.components.filter((c) => c.role === 'card').sort((a, b) => a.rect.y - b.rect.y)[0]
	assert.equal(first(board).header.actions, 1)
	assert.equal(first(live).header.actions, 1)
	// The toggle's text glyph is decoration: the card reads the same on both sides.
	assert.equal(first(live).structure, first(board).structure)
	// A label-only span with no icon (a drawn checkbox named "Selecteren") is not an action.
	const box = await measure(deck('<span aria-label="Selecteren" style="flex:none;width:18px;height:18px;border:2px solid #3669a5;border-radius:4px"></span>'))
	assert.equal(first(box).header.actions, 0)
})

test('a line under the card title split over spans reads as the one line a board writes as one string', { skip }, async () => {
	const card = (sub) => `<article style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:10px;width:200px">
		<strong style="font-size:17px">Verlichting fietspad Lindelaan</strong>${sub}<span style="font-size:14px">Pieter Jansen</span></article>`
	const deck = (sub) => `<div style="position:absolute;left:300px;top:300px;display:grid;grid-template-columns:repeat(3,250px);gap:20px">${card(sub)}${card(sub)}${card(sub)}</div>`
	const board = await measure(deck('<span style="font-size:14px;color:#5e6168">2026-0110 · Woo-verzoek</span>'))
	const live = await measure(deck('<p style="margin:0;font-size:14px;color:#5e6168"><span>2026-0110</span><span aria-hidden="true"> · </span><span>Woo-verzoek</span></p>'))
	const first = (r) => r.components.find((c) => c.role === 'card').structure
	assert.equal(first(live), first(board))
	assert.match(first(board), /title \/ number \/ meta/)
})

test('a line split over spans that wraps onto a second line is still the one line a board writes as one string', { skip }, async () => {
	const card = (sub) => `<article style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;width:180px">
		<strong style="font-size:15px">Losliggende stoeptegels Kerkplein</strong>${sub}<span style="font-size:13px">Termijn 8 nov</span></article>`
	const deck = (sub) => `<div style="position:absolute;left:300px;top:300px;display:grid;grid-template-columns:repeat(3,212px);gap:20px">${card(sub)}${card(sub)}${card(sub)}</div>`
	const board = await measure(deck('<span style="font-size:13px">2026-4870 · Melding openbare ruimte</span>'))
	const live = await measure(deck('<p style="margin:0;font-size:13px"><span>2026-4870</span><span> · </span><span>Melding openbare ruimte</span></p>'))
	const first = (r) => r.components.find((c) => c.role === 'card').structure
	assert.equal(first(live), first(board))
	// A run that continues on another line, not where the last one ended, is a part of its own.
	const apart = await measure(deck('<p style="margin:0;font-size:13px"><span>2026-4870</span><br><span>Melding openbare ruimte</span></p>'))
	assert.match(first(apart), /number \/ meta/)
})

test('a map widget\'s Leaflet mount point is the map before Leaflet has loaded into it, not an untitled card', { skip }, async () => {
	const card = (map) => `<section style="position:absolute;left:702px;top:1110px;width:390px;box-sizing:border-box;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px"><h2 style="margin:0 0 12px;font-size:17px">Locaties</h2>${map}<p style="margin:12px 0 0">Lindelaan 4</p></section>`
	const r = await measure(card('<div class="cn-map-widget"><div class="cn-map-widget__leaflet cn-map-widget__leaflet--captioned" style="width:344px;height:200px;background:#edeff2"></div></div>'))
	assert.deepEqual(r.components.filter((c) => c.role === 'map').map((c) => [c.rect.w, c.rect.h]), [[344, 200]])
	assert.deepEqual(r.components.filter((c) => c.role === 'card').map((c) => c.title), ['Locaties'])
	// A tinted box that is no map mount point is still a card of its own.
	const box = await measure(card('<div class="cn-note"><div class="cn-note__body" style="width:344px;height:200px;background:#edeff2"><p>Geen locatie</p></div></div>'))
	assert.equal(box.components.filter((c) => c.role === 'map').length, 0)
})

test('a map in a card is its first row at its own box, not the zoom control laid over it', { skip }, async () => {
	const card = (map) => `<section style="position:absolute;left:292px;top:300px;width:420px;border:1px solid #ddd;border-radius:12px;padding:20px 22px"><h2 style="margin:0 0 12px;font-size:17px">Locaties</h2>${map}<p style="margin:12px 0 0">Lindelaan 4</p></section>`
	const board = await measure(card('<svg role="img" aria-label="Kaart met de locatie" width="374" height="200" style="display:block"><rect width="374" height="200" fill="#e9eef3"/><text x="20" y="40">Lindelaan</text></svg>'))
	const live = await measure(card(`<div class="leaflet-container" style="position:relative;width:374px;height:200px;background:#ddd;overflow:hidden"><div class="leaflet-tile-pane"></div>
		<div class="leaflet-control-zoom" style="position:absolute;right:12px;top:12px;display:flex;flex-direction:column"><a href="#" style="width:30px;height:30px;background:#fff;text-align:center">+</a><a href="#" style="width:30px;height:30px;background:#fff;text-align:center">−</a></div></div>`))
	const card0 = (r) => r.components.find((c) => c.title === 'Locaties')
	assert.equal(card0(live).content.firstRowInsetLeft, card0(board).content.firstRowInsetLeft)
	assert.equal(card0(live).content.gapBelowTitle, card0(board).content.gapBelowTitle)
	assert.equal(card0(board).content.firstRowInsetLeft, 23)
})

test('a chosen option\'s title in a choice row label nested beside its details is the option card\'s title', { skip }, async () => {
	const fields = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 16px 56px"><label>Reden<input type="text" style="display:block;width:100%;height:36px"></label><label>Dagen<input type="number" style="display:block;width:100%;height:36px"></label></div>'
	const title = '<span style="display:flex;flex-direction:column"><span style="font-size:15px;font-weight:600">Opschorten</span><span style="font-size:13px;color:#5e6168">De termijn staat stil tot het antwoord er is.</span></span>'
	const box = 'position:absolute;left:400px;top:300px;width:600px;border:2px solid #3669a5;border-radius:12px;background:#fff'
	const board = await measure(`<label style="${box};display:block"><span style="display:flex;gap:12px;align-items:center;padding:16px"><input type="radio" checked>${title}</span>${fields}</label>`)
	const live = await measure(`<div style="${box}"><label style="display:flex;gap:12px;align-items:center;padding:16px"><input type="radio" checked>${title}</label>${fields}</div>`)
	const opt = (r) => r.components.find((c) => c.rect.x === 400 && c.rect.y === 300)
	assert.equal(opt(board).title, 'Opschorten')
	assert.equal(opt(live).title, 'Opschorten')
	assert.equal(opt(live).content.firstRowInsetLeft, opt(board).content.firstRowInsetLeft)
})

test('a row header cell holding the row\'s name is the row\'s first labelled cell, as a board\'s plain cell is', { skip }, async () => {
	const table = (name) => `<table style="position:absolute;left:495px;top:600px;width:600px;border-collapse:collapse"><thead><tr><th style="padding:8px 4px;text-align:left">Gebeurtenis</th><th>Mail</th></tr></thead>
		<tbody><tr>${name}<td style="padding:8px 4px"><input type="checkbox"></td></tr></tbody></table>`
	const board = await measure(table('<td style="padding:12px 0">Zaak toegewezen</td>'))
	const live = await measure(table('<th scope="row" style="padding:12px 0;text-align:left;font-weight:400">Zaak toegewezen</th>'))
	const cell = (r) => r.components.find((c) => c.role === 'table').cell
	assert.equal(cell(live).paddingLeft, cell(board).paddingLeft)
	assert.equal(cell(live).fontWeight, 400)
})

test('a small bold kicker set as a paragraph over a larger bold line gives the card its title from the larger line', { skip }, async () => {
	const panel = (head) => `<div style="position:absolute;left:300px;top:200px;width:330px;border:10px solid #1b1c1d;border-radius:36px;background:#f5f6f8;height:500px"><div style="padding:14px 18px 10px;background:#fff;border-bottom:1px solid #e4e6ea;display:flex;flex-direction:column;gap:6px">${head}</div><p style="padding:14px">Vandaag geen inspecties gepland</p></div>`
	const board = await measure(panel('<span style="font-size:13px;color:#7a4f00;font-weight:600">Offline · gesynchroniseerd om 07:42</span><strong style="font-size:20px">Vandaag</strong>'))
	const live = await measure(panel('<span style="font-size:13px;color:#7a4f00;font-weight:600">Offline · eerder gesynchroniseerd</span><h2 style="margin:0;font-size:20px">Vandaag</h2>'))
	const titles = (r) => r.components.filter((c) => c.role === 'card').map((c) => c.title)
	assert.ok(titles(board).includes('Vandaag') && !titles(board).some((t) => /Offline/.test(t || '')), JSON.stringify(titles(board)))
	assert.ok(titles(live).includes('Vandaag'), JSON.stringify(titles(live)))
	// A KPI tile's label keeps the title: its larger bold value is a figure, not a line of words.
	const kpi = await measure('<div style="position:absolute;left:300px;top:200px;width:260px;border:1px solid #ddd;padding:16px"><span style="font-size:13px;font-weight:600">Geanalyseerde zaken</span><strong style="display:block;font-size:28px">1.284</strong></div>')
	assert.equal(kpi.components.find((c) => c.role === 'card').title, 'Geanalyseerde zaken')
})

test('a coloured dot leads its row though it holds an off-screen 0x0 image', { skip }, async () => {
	const card = (inner) => `<section style="position:absolute;left:300px;top:200px;width:400px;border:1px solid #ddd;padding:20px 22px"><h2 style="margin:0 0 12px;font-size:17px">Recente activiteit</h2>
		<div style="display:flex;gap:12px;align-items:center"><span style="width:10px;height:10px;border-radius:5px;background:#3669a5">${inner}</span><span>Zaak 2026-0110 toegewezen</span></div></section>`
	const plain = await measure(card(''))
	const live = await measure(card('<img alt="" style="position:absolute;left:-1092px;width:0;height:0">'))
	const inset = (r) => r.components.find((c) => c.title === 'Recente activiteit').content.firstRowInsetLeft
	assert.equal(inset(plain), 23)
	assert.equal(inset(live), 23)
})

test('an avatar\'s initial in a 32px circle is not the title of the row card that holds it', { skip }, async () => {
	const r = await measure(`<div role="dialog" aria-modal="true" style="position:absolute;left:400px;top:88px;width:640px;border:1px solid #ddd;background:#fff;padding:24px"><h2 style="margin:0 0 16px">Weergave delen</h2>
		<div style="display:flex;align-items:center;gap:12px;height:52px;padding:0 14px;border-radius:12px;background:#f0f1f3"><span style="width:32px;height:32px;border-radius:16px;background:#3669a5;color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center">Z</span><span style="font-weight:600">Zuiddrecht behandelaars</span></div></div>`)
	const row = r.components.find((c) => c.role === 'dialog-card')
	assert.equal(row.title, 'Zuiddrecht behandelaars')
})

test('a table in a widget is one part of its structure, held directly or in a frame of its own', { skip }, async () => {
	const rows = ['Ontvangst', 'Beoordeling', 'Besluit'].map((t, i) => `<tr><td>${t}</td><td>${i + 3} dagen</td></tr>`).join('')
	const table = `<table style="width:100%"><thead><tr><th>Fase</th><th>Doorlooptijd</th></tr></thead><tbody>${rows}</tbody></table>`
	const widget = (inner, title) => `<section style="border:1px solid #ddd;padding:20px;width:1000px"><h2 style="margin:0 0 8px;font-size:17px">${title}</h2><p style="margin:0 0 12px;font-size:14px">Waar zaken het langst wachten</p>${inner}</section>`
	const col = (inner) => `<div style="position:absolute;left:300px;top:100px;display:flex;flex-direction:column;gap:16px">${['Knelpuntenranglijst', 'Doorlooptijd per behandelaar', 'Dagen per fase'].map((t) => widget(inner, t)).join('')}</div>`
	const board = await measure(col(table))
	const live = await measure(col(`<div style="border:1px solid #e4e6ea;border-radius:8px;padding:4px">${table}</div>`))
	const s = (r) => r.components.find((c) => c.title === 'Knelpuntenranglijst').structure
	assert.equal(s(live), s(board))
	assert.match(s(board), /table$/)
})

test('a footer avatar taller than the name beside it is on the name\'s line', { skip }, async () => {
	const card = (size) => `<article style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:10px;width:200px">
		<strong style="font-size:17px">Verlichting fietspad Lindelaan</strong><span style="font-size:14px;color:#5e6168">Woo-verzoek</span>
		<div style="display:flex;justify-content:space-between;align-items:center;font-size:14px;padding-top:10px;border-top:1px solid #eef0f3"><span style="display:flex;align-items:center;gap:8px"><span style="width:${size}px;height:${size}px;border-radius:50%;background:#eaf0f7;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">PJ</span>Pieter Jansen</span><span>8 nov</span></div></article>`
	const deck = (size) => `<div style="position:absolute;left:300px;top:300px;display:grid;grid-template-columns:repeat(3,250px);gap:20px">${card(size)}${card(size)}${card(size)}</div>`
	const s = async (size) => (await measure(deck(size))).components.find((c) => c.role === 'card').structure
	assert.equal(await s(36), await s(20))
	assert.match(await s(36), /divider \/ pill meta deadline$/)
})

test('an open row menu pairs with an open menu, never with a flat row card where the other side left it shut', { skip }, async () => {
	const row = '<div style="position:absolute;left:1107px;top:379px;width:307px;height:52px;background:#eaf0f7;border-radius:8px;padding:8px"><b>Termijn deze week</b><br><small>Mijn zaken</small></div>'
	const menu = '<div role="menu" style="position:absolute;left:1134px;top:379px;width:264px;height:280px;background:#fff;border:1px solid #e4e6ea;border-radius:10px;box-shadow:0 8px 24px rgba(27,28,29,.16)"><button role="menuitem">Bewerken</button><button role="menuitem">Delen</button></div>'
	const board = await measure(row + menu)
	const live = await measure(row)
	const { pairs, missing } = pairComponents(board.components, live.components, 900)
	assert.ok(!pairs.some((p) => p.board.popup && !p.live.popup))
	assert.ok(missing.some((c) => c.popup))
})

test('a menu drawn in a placed popover wrapper is a popup and pairs with the board\'s menu, not with the row it opened from', { skip }, async () => {
	const row = '<div style="position:absolute;left:1107px;top:379px;width:307px;height:52px;background:#eaf0f7;border-radius:8px;padding:8px"><b>Termijn deze week</b><br><small>Mijn zaken</small></div>'
	const items = '<button role="menuitem">Bewerken</button><button role="menuitem">Delen</button><button role="menuitem">Verwijderen</button>'
	// The board draws the menu inside the side panel card; the library mounts it at the end of the body.
	const board = await measure(`<aside style="position:absolute;right:0;top:68px;width:360px;height:820px;background:#fff;border:1px solid #e4e6ea;box-sizing:border-box"><h2>Alle zaken</h2>${row.replace('position:absolute;', 'position:absolute;margin-left:-1080px;')}<div role="menu" style="position:absolute;left:54px;top:311px;z-index:2;width:264px;height:280px;background:#fff;border:1px solid #e4e6ea;border-radius:10px;box-shadow:0 8px 24px rgba(27,28,29,.16)">${items}</div></aside>`)
	const live = await measure(row + `<div class="v-popper__popper" style="position:absolute;left:1176px;top:452px;z-index:10000"><div class="v-popper__wrapper"><div class="v-popper__inner" style="width:264px;height:327px;background:#fff;border-radius:8px;box-shadow:0 0 10px rgba(77,77,77,.5)"><div><ul role="menu" style="margin:0;padding:4px">${items}</ul></div></div></div></div>`)
	const pop = live.components.find((c) => c.role === 'card' && c.rect.x === 1176)
	assert.ok(pop && pop.popup, JSON.stringify(live.components.map((c) => [c.role, c.rect, c.popup])))
	const { pairs } = pairComponents(board.components, live.components, 900)
	assert.ok(pairs.some((p) => p.board.popup && p.live.popup))
	// A shadowed card in a placed layout column with no stacking order is no popup.
	const col = await measure('<div style="position:absolute;left:300px;top:100px;width:300px"><div style="height:120px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.1)"><h3>Kolom</h3><p>tekst</p></div></div>')
	assert.ok(!col.components.find((c) => c.role === 'card').popup)
})

test('a 14px line in a dark text colour under a card title is content; muted grey is the description', { skip }, async () => {
	const card = (color) => `<section style="position:absolute;left:1100px;top:300px;width:300px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:8px">
		<h2 style="margin:0;font-size:17px;color:#1b1c1d">Historie</h2><span style="font-size:14px;color:${color}">Laatst gewijzigd op 3 oktober door Pieter Jansen</span><a href="#">Historie bekijken</a></section>`
	const gap = async (color) => (await measure(card(color))).components.find((c) => c.title === 'Historie').content.gapBelowTitle
	assert.ok(await gap('#3d4047') < 12)
	assert.ok(await gap('#5e6168') > 30)
})

test('a month calendar is no table, drawn as an ARIA grid or as a plain grid of day boxes', { skip }, async () => {
	const days = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
	const aria = `<div role="grid" style="position:absolute;left:885px;top:400px;width:500px">${'<div role="row" style="display:flex">' + days.map((d) => `<span role="columnheader" style="flex:1">${d}</span>`).join('') + '</div>'}${[0, 1].map((w) => '<div role="row" style="display:flex">' + days.map((_, i) => `<span role="gridcell" style="flex:1;height:34px">${w * 7 + i + 1}</span>`).join('') + '</div>').join('')}</div>`
	const live = await measure(aria)
	assert.deepEqual(live.components.filter((c) => c.role === 'table'), [])
	// A table of records with a weekday column is still a table.
	const rec = await measure('<table style="position:absolute;left:300px;top:300px;width:600px"><thead><tr><th>Dag</th><th>Zaak</th></tr></thead><tbody><tr><td>ma</td><td>2026-0110</td></tr></tbody></table>')
	assert.equal(rec.components.filter((c) => c.role === 'table').length, 1)
})

test('a name cell padded around its icon and a name cell after an icon column start their text at the same place', { skip }, async () => {
	const icon = '<span style="display:inline-block;width:24px;height:24px;background:#eaf0f7;vertical-align:middle"></span>'
	const board = await measure(`<table style="position:absolute;left:293px;top:309px;width:800px;border-collapse:collapse"><thead><tr><th style="padding:8px 16px;text-align:left">Naam</th><th>Plaats</th></tr></thead><tbody><tr><td style="padding:12px 16px">${icon}<span style="margin-left:8px">CloudGemeente</span></td><td>Zuiddrecht</td></tr></tbody></table>`)
	const live = await measure(`<table style="position:absolute;left:293px;top:309px;width:800px;border-collapse:collapse;table-layout:fixed"><thead><tr><th style="width:40px;box-sizing:border-box;padding:8px 0 8px 16px"></th><th style="padding:8px 0 8px 12px;text-align:left">Naam</th><th>Plaats</th></tr></thead><tbody><tr><td style="width:24px;padding:12px 0 12px 16px">${icon}</td><td style="padding:12px 0 12px 12px"><span style="margin-left:-4px">CloudGemeente</span></td><td>Zuiddrecht</td></tr></tbody></table>`)
	const t = (r) => r.components.find((c) => c.role === 'table')
	const rows = compareProps(t(board), t(live))
	assert.ok(!rows.some((r) => r.prop === 'cell.paddingLeft' && r.flag), JSON.stringify([t(board).cell, t(live).cell]))
	// Text that really moves still flags.
	const moved = await measure(`<table style="position:absolute;left:293px;top:309px;width:800px;border-collapse:collapse"><thead><tr><th style="padding:8px 16px;text-align:left">Naam</th><th>Plaats</th></tr></thead><tbody><tr><td style="padding:12px 24px">${icon}<span style="margin-left:8px">CloudGemeente</span></td><td>Zuiddrecht</td></tr></tbody></table>`)
	assert.ok(compareProps(t(board), t(moved)).some((r) => r.flag && /^cell\.(paddingLeft|textInsetLeft)$/.test(r.prop)))
})

test('a table pairs with the table in the card of the same title, not with the one in the next card down', { skip }, async () => {
	const tbl = (n) => `<table style="width:100%"><thead><tr><th>Naam</th></tr></thead><tbody>${Array.from({ length: n }, (_, i) => `<tr><td style="height:${40}px">Rij ${i}</td></tr>`).join('')}</tbody></table>`
	const card = (title, body) => `<section style="border:1px solid #ddd;padding:20px;margin-bottom:16px"><h2 style="margin:0 0 12px;font-size:17px">${title}</h2>${body}</section>`
	const page = (cards) => `<div style="position:absolute;left:300px;top:100px;width:900px">${cards}</div>`
	const board = await measure(page(card('Resultaten', tbl(2)) + card('Documenttypen', tbl(2))))
	const live = await measure(page(card('Resultaten', '<p>Nog geen resultaten</p>') + card('Documenttypen', tbl(2))))
	const { pairs } = pairComponents(board.components, live.components, 900)
	const tp = pairs.filter((p) => p.board.role === 'table')
	assert.equal(tp.length, 1)
	assert.equal(tp[0].board.inCard, 'Documenttypen')
})

test('a KPI tile\'s big figure is a number on both sides, whatever its digits', { skip }, async () => {
	const tile = (n) => `<div style="background:#fff;border:1px solid #ddd;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:4px"><span style="font-size:14px;color:#5e6168">Geanalyseerde zaken</span><strong style="font-size:28px">${n}</strong></div>`
	const row = (a, b, c) => `<div style="position:absolute;left:292px;top:780px;width:1120px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${tile(a)}${tile(b)}${tile(c)}</div>`
	const s = async (a, b, c) => (await measure(row(a, b, c))).components.find((x) => x.role === 'card').structure
	assert.equal(await s('1.284', '9', '12'), await s('76', '9', '12'))
	assert.equal(await s('76', '9', '12'), 'meta / number')
})

test('a switch track with its knob leads the row it sits in, as an icon does', { skip }, async () => {
	const card = (sw) => `<section style="position:absolute;left:300px;top:200px;width:700px;border:1px solid #ddd;padding:20px 22px"><h2 style="margin:0 0 12px;font-size:17px">AI-ondersteunde verwerking</h2>
		<label style="display:flex;align-items:center;gap:10px">${sw}<span>Samenvattingen voorstellen</span></label></section>`
	const track = '<span style="position:relative;width:38px;height:22px;border-radius:11px;background:#3669a5"><span style="position:absolute;right:3px;top:3px;width:16px;height:16px;border-radius:8px;background:#fff"></span></span>'
	const r = await measure(card(track))
	assert.equal(r.components.find((c) => c.title === 'AI-ondersteunde verwerking').content.firstRowInsetLeft, 23)
})

test('an initials tile leads its row, set with 16px corners or with 50%, level with the name or centred', { skip }, async () => {
	const card = (tile, align) => `<section style="position:absolute;left:292px;top:600px;width:800px;border:1px solid #ddd;padding:20px 22px"><h2 style="margin:0 0 12px;font-size:17px">Notities</h2>
		<div style="display:flex;gap:12px;align-items:${align}">${tile}<div><b style="font-size:15px">Pieter Jansen</b><div style="font-size:13px;color:#5e6168">vandaag 09:12</div></div></div></section>`
	const tile = (r) => `<span style="flex:none;width:32px;height:32px;border-radius:${r};background:#eaf0f7;color:#234a78;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center">PJ</span>`
	const inset = async (r, a) => (await measure(card(tile(r), a))).components.find((c) => c.title === 'Notities').content.firstRowInsetLeft
	assert.equal(await inset('16px', 'flex-start'), 23)
	assert.equal(await inset('50%', 'center'), 23)
})

test('a matrix head\'s text inset is read from the table\'s edge, with or without row elements', { skip }, async () => {
	const heads = ['Gevolg A: gering', 'Gevolg B: aanzienlijk'].map((h) => `<span role="columnheader" style="padding:6px">${h}</span>`).join('')
	const board = await measure(`<div role="table" style="position:absolute;left:315px;top:399px;width:760px;display:grid;grid-template-columns:170px repeat(2,1fr);gap:4px"><span></span>${heads}<span role="rowheader" style="padding:10px 6px">Gedrag 1</span><span role="cell">Herstelactie</span><span role="cell">Waarschuwing</span></div>`)
	const live = await measure(`<div role="table" style="position:absolute;left:315px;top:399px;width:760px"><div role="row" style="display:grid;grid-template-columns:170px repeat(2,1fr);gap:4px"><span role="columnheader"></span>${heads}</div><div role="row" style="display:grid;grid-template-columns:170px repeat(2,1fr);gap:4px"><span role="rowheader" style="padding:10px 6px">Gedrag 1</span><span role="cell">Herstelactie</span><span role="cell">Waarschuwing</span></div></div>`)
	const t = (r) => r.components.find((c) => c.role === 'table')
	assert.equal(t(board).head.textInsetLeft, t(live).head.textInsetLeft)
	assert.equal(t(board).head.textInsetLeft, 180)
})

test('a record card\'s line under its title is its first row: the footer a stretched card pins down is not', { skip }, async () => {
	const card = (h) => `<a href="#" style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:10px;height:${h}px;box-sizing:border-box;text-decoration:none;color:#1b1c1d">
		<strong style="font-size:17px">Bezwaar parkeerboete</strong><span style="font-size:14px;color:#5e6168">Bezwaar · R. Yilmaz</span>
		<span style="margin-top:auto;display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #eef0f3"><span style="padding:3px 10px;border-radius:12px;background:#e8e6f6;font-size:13px">In behandeling</span><span>Termijn 8 nov</span></span></a>`
	const deck = (h) => `<div style="position:absolute;left:292px;top:400px;display:grid;grid-template-columns:repeat(3,265px);gap:20px">${card(h)}${card(h)}${card(h)}</div>`
	const gap = async (h) => (await measure(deck(h))).components.find((c) => c.role === 'card').content.gapBelowTitle
	assert.equal(await gap(210), await gap(250))
	assert.ok(await gap(210) < 16)
})

test('the column holding the page title is the page, not a card, when a side panel narrows it', { skip }, async () => {
	const r = await measure(`<div style="position:fixed;inset:68px 0 0 264px;background:#fff"><main style="position:absolute;left:0;top:0;width:816px;height:820px;background:#f5f6f8;padding:24px 28px;box-sizing:border-box"><h1 style="margin:0">Alle zaken</h1><section style="margin-top:40px;background:#fff;border:1px solid #ddd;height:300px"><h2>Lijst</h2><p>rij</p></section></main></div>`)
	assert.deepEqual(r.components.filter((c) => c.role === 'card').map((c) => c.title), ['Lijst'])
})

test('a row of 38px chips is chips, as a row of 36px chips is: no toolbar without other controls', { skip }, async () => {
	const row = (h) => `<div style="position:absolute;left:292px;top:230px;width:760px;display:flex;gap:8px">${['Alles', 'Mijn zaken', 'Termijn deze week'].map((t) => `<button style="height:${h}px;border-radius:${h / 2}px;border:1px solid #ccc;padding:0 14px">${t}</button>`).join('')}<button style="height:36px;border-radius:8px">Filter</button></div>`
	for (const h of [36, 38]) assert.deepEqual((await measure(row(h))).components.filter((c) => c.role === 'toolbar'), [], `chips ${h}px`)
})

test('a card that runs on past the captured frame is measured on the part inside it', { skip }, async () => {
	const rows = Array.from({ length: 6 }, (_, i) => `<div style="padding:10px 0;border-top:1px solid #eee"><span>Toestemming gewijzigd</span> <span style="color:#5e6168">${20 + i} okt</span></div>`).join('')
	const r = await measure(`<section style="position:absolute;left:1112px;top:700px;width:300px;border:1px solid #ddd;padding:12px 22px"><h2 style="margin:0 0 10px;font-size:17px">Historie</h2>${rows}<button style="margin-left:-6px;margin-top:12px;padding:0;border:0;background:none">Alles weergeven (7)</button></section>`)
	const c = r.components.find((x) => x.title === 'Historie')
	assert.equal(c.content.minInsetLeft, 23)
})

test('a notice band is a card whether its words take one line or two', { skip }, async () => {
	const band = (text) => `<div role="note" style="position:absolute;left:315px;top:685px;width:754px;box-sizing:border-box;padding:10px 42px;background:#eaf0f7;border-radius:8px;font-size:14px;line-height:1.5"><strong>Advies: last onder dwangsom</strong> ${text}</div>`
	for (const text of ['met een begunstigingstermijn.', 'met een begunstigingstermijn van vier weken, volgens de matrix Bouw- en woningtoezicht 2026 en de afspraken met de omgevingsdienst.']) {
		const r = await measure(band(text))
		assert.ok(r.components.some((c) => c.role === 'card' && c.title === 'Advies: last onder dwangsom'), text)
	}
})

test('a record card\'s number line is its first row whether it sits in the title\'s wrapper or beside it', { skip }, async () => {
	const card = (head) => `<article style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:10px">${head}
		<div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #eef0f3"><span>Pieter Jansen</span><span>8 nov</span></div></article>`
	const deck = (head) => `<div style="position:absolute;left:300px;top:300px;display:grid;grid-template-columns:repeat(3,250px);gap:20px">${card(head)}${card(head)}${card(head)}</div>`
	const t = '<a href="#" style="font-size:17px;font-weight:700;text-decoration:none;color:#1b1c1d">Verlichting fietspad Lindelaan</a>', n = '<span style="font-size:14px;color:#5e6168">2026-0110 · Woo-verzoek</span>'
	const c = async (head) => (await measure(deck(head))).components.find((x) => x.role === 'card')
	const wrapped = await c(`<div style="display:flex;flex-direction:column;gap:2px">${t}${n}</div>`)
	const flat = await c(`<h3 style="margin:0">${t}</h3>${n}`)
	assert.ok(wrapped.content.gapBelowTitle < 16 && flat.content.gapBelowTitle < 16, `wrapped ${wrapped.content.gapBelowTitle}, flat ${flat.content.gapBelowTitle}`)
	assert.equal(wrapped.header.separator, flat.header.separator)
})

test('a card wholly below the frame keeps its rows, measured as a counterpart', { skip }, async () => {
	const r = await measure('<section style="position:absolute;left:300px;top:1200px;width:700px;border:1px solid #ddd;padding:20px"><h2 style="margin:0 0 8px">Knelpuntenranglijst</h2><p style="margin:0;color:#5e6168;font-size:14px">Waar zaken wachten</p><table><tr><td>a</td></tr></table></section><section style="position:absolute;left:300px;top:1500px;width:700px;border:1px solid #ddd;padding:20px"><h2 style="margin:0 0 8px">Doorlooptijd</h2><p style="margin:0;color:#5e6168;font-size:14px">Per behandelaar</p><table><tr><td>b</td></tr></table></section><section style="position:absolute;left:300px;top:1800px;width:700px;border:1px solid #ddd;padding:20px"><h2 style="margin:0 0 8px">Derde</h2><p>x</p></section>')
	const c = r.components.find((x) => x.title === 'Knelpuntenranglijst')
	assert.ok(c.belowFrame && c.content && c.content.gapBelowTitle !== undefined)
})

test('a settings section\'s marked description stays its description in a column of sections', { skip }, async () => {
	const sec = (t) => `<div class="settings-section" style="border:1px solid #ddd;padding:20px 24px;margin-bottom:16px"><h2 style="margin:0 0 6px;font-size:17px">${t}</h2><p class="settings-section__desc" style="margin:0 0 12px;font-size:14px;color:#5e6168">Uitleg bij ${t}.</p><p style="margin:0">Inhoud</p></div>`
	const r = await measure(`<div style="position:absolute;left:316px;top:200px;width:1073px">${sec('Beslistabellen (DMN)')}${sec('Archivering')}${sec('Zoekindex')}</div>`)
	const c = r.components.find((x) => x.title === 'Beslistabellen (DMN)')
	assert.ok(c.record, 'a column of sections is a deck')
	assert.ok(c.content.gapBelowTitle > 20, `gap ${c.content.gapBelowTitle}`)
	// The board writes the same sections with a plain muted line: still a description.
	const plain = await measure(`<div style="position:absolute;left:316px;top:200px;width:1073px">${['A', 'B', 'C'].map((t) => sec(t).replace(' class="settings-section__desc"', '')).join('')}</div>`)
	assert.ok(plain.components.find((x) => x.title === 'A').content.gapBelowTitle > 20)
})

test('a list card drawn as a table box open at the bottom, closed by its pager box, is one card with a bottom border', { skip }, async () => {
	const rows = '<table style="width:100%"><thead><tr><th>Naam</th></tr></thead><tbody><tr><td>Vergunningen</td></tr><tr><td>Handhaving</td></tr></tbody></table>'
	const pager = '<nav aria-label="Paginering" style="display:flex;gap:8px;padding:12px;height:61px;box-sizing:border-box"><button>1</button><button>2</button></nav>'
	const board = await measure(`<div style="position:absolute;left:622px;top:381px;width:790px;border:1px solid #e4e6ea;border-radius:12px">${rows}${pager}</div>`)
	const live = await measure(`<div style="position:absolute;left:622px;top:366px;width:790px"><div style="border:1px solid #e4e6ea;border-bottom:0;border-radius:12px 12px 0 0;background:#fff">${rows}</div><div style="border:1px solid #e4e6ea;border-radius:0 0 12px 12px;background:#fff">${pager}</div></div>`)
	const cards = (r) => r.components.filter((c) => c.role === 'card')
	assert.equal(cards(live).length, 1, JSON.stringify(cards(live).map((c) => c.rect)))
	assert.equal(cards(live)[0].props.border.bottom, cards(board)[0].props.border.bottom)
})

test('a drag handle centred on a two-line row name leads that row', { skip }, async () => {
	const grip = '<button aria-label="Verslepen" style="width:28px;height:34px;padding:4px;border:0;background:none"><svg width="20" height="20" viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="18"/></svg></button>'
	const row = (desc) => `<li style="display:flex;align-items:center;gap:12px;padding:2px 12px;border-bottom:1px solid #eee">${grip}<span aria-hidden="true">1</span><span style="display:flex;flex-direction:column"><b>Termijn deze week</b>${desc}</span></li>`
	const card = (desc) => `<div role="dialog" aria-modal="true" style="position:absolute;left:470px;top:88px;width:700px;background:#fff;padding:24px"><h2>Weergaven</h2><ol style="list-style:none;margin:0;padding:0;border:1px solid #ddd;border-radius:8px;width:611px">${row(desc)}${row(desc)}</ol></div>`
	const one = await measure(card('<span>Behandelaar @me</span>'))
	const two = await measure(card('<span style="width:200px">Behandelaar @me, termijn binnen 7 dagen, status niet afgehandeld</span>'))
	const list = (r) => r.components.find((c) => c.role === 'dialog-card')
	assert.equal(list(two).content.firstRowInsetLeft, list(one).content.firstRowInsetLeft)
})

test('an initials tile marked aria-hidden is still the tile people see, measured whole', { skip }, async () => {
	const tile = (hidden) => `<div style="position:absolute;left:400px;top:300px;display:flex;gap:12px;align-items:center"><span ${hidden ? 'aria-hidden="true"' : ''} style="width:40px;height:40px;border-radius:50%;background:#edeff2;display:inline-flex;align-items:center;justify-content:center;font-weight:700">MV</span><b>Marieke Visser</b></div>`
	const h = async (hidden) => (await measure(tile(hidden))).elements.filter((e) => e.label === 'MV').map((e) => e.props.h)
	assert.deepEqual(await h(true), [40])
	assert.deepEqual(await h(false), [40])
})

test('a button drawn as a plain text link is read as the plain link a board draws: no element on either side', { skip }, async () => {
	const r = await measure('<div style="position:absolute;left:300px;top:300px;display:flex;gap:12px"><a href="#" style="font-weight:600">Alles wissen</a><button style="background:none;border:0;padding:0;font-weight:600;color:#3669a5;text-decoration:underline;border-radius:8px">Alles wissen</button></div>')
	assert.deepEqual(r.elements.filter((e) => e.label === 'Alles wissen'), [])
})

test('a folder row holding its sub-list is measured on its own line', { skip }, async () => {
	const line = '<button style="display:flex;width:100%;height:34px;padding:0 10px;border:0;border-radius:8px;background:#eaf0f7;align-items:center">Alle</button>'
	const sub = '<ul style="list-style:none;margin:0;padding-left:16px">' + ['Vergunningen', 'Handhaving', 'Woo'].map((t) => `<li style="height:34px">${t}</li>`).join('') + '</ul>'
	const r = await measure(`<ul style="position:absolute;left:300px;top:300px;width:280px;list-style:none;margin:0;padding:0"><li>${line}${sub}</li></ul>`)
	const row = r.elements.find((e) => e.kind === 'row' && e.label.startsWith('Alle'))
	assert.ok(row, JSON.stringify(r.elements.map((e) => [e.kind, e.label])))
	assert.equal(row.props.h, 34)
})

test('a tall tile among short framed list rows is a row when the frame sits on an element inside the li', { skip }, async () => {
	const tile = (h, t) => `<li style="list-style:none;margin:0 0 8px"><div style="height:${h}px;border:1px solid #ccc;border-radius:8px;padding:0 12px;box-sizing:border-box">${t}</div></li>`
	const r = await measure(`<section style="position:absolute;left:300px;top:100px;width:800px;border:1px solid #ccc;padding:20px">
		<h2 style="margin:0 0 12px">Statussen</h2>
		<ul style="margin:0;padding:0">${tile(52, 'Ontvangen')}${tile(35, 'In behandeling')}${tile(39, 'Besluit')}</ul></section>`)
	const cards = r.components.filter((c) => c.role === 'card')
	assert.deepEqual(cards.map((c) => c.title), ['Statussen'], JSON.stringify(cards.map((c) => [c.title, c.rect])))
	assert.ok(cards[0].content.gapBelowTitle < 20, `gap ${cards[0].content.gapBelowTitle}`)
})

test('a header whose subtitle wraps to two lines keeps its centred button as a header action', { skip }, async () => {
	const r = await measure(`<div class="card" style="position:absolute;left:292px;top:262px;width:800px;border:1px solid #ccc;border-radius:12px">
		<div style="display:flex;align-items:center;gap:8px;padding:20px 22px 0">
			<div style="flex:1;display:flex;flex-direction:column;gap:3px"><h2 style="margin:0;font-size:17px">Velden</h2>
				<span style="font-size:14px;line-height:1.2;color:#5e6168;width:420px">Het gegevensschema van dit zaaktype. Sleep om de volgorde te wijzigen. Velden van het moedertype zijn paars en daarom anders.</span></div>
			<button style="height:34px">Veld toevoegen</button></div>
		<table style="margin:22px"><tbody><tr><td>Bouwkosten</td><td>Nummer</td></tr><tr><td>Soort</td><td>Keuzelijst</td></tr></tbody></table></div>`)
	const c = r.components.find((x) => x.title === 'Velden')
	assert.equal(c.header.actions, 1, JSON.stringify(c.header))
	assert.ok(c.content.gapBelowTitle > 10, JSON.stringify(c.content))
})

test('a bar of a link drawn as a button and a button is a toolbar (NcButton with an href)', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:315px;top:336px;width:754px">
		<div style="display:inline-flex;gap:8px;width:325px"><a class="button-vue" href="#" style="display:flex;align-items:center;height:34px;padding:0 14px;border:1px solid #828a95;border-radius:8px">Bekijken als flow</a>${btn('Taak toevoegen')}</div>
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px"><section>Fase 1</section><section>Fase 2</section></div></div>`)
	const toolbars = r.components.filter((c) => c.role === 'toolbar')
	assert.equal(toolbars.length, 1, JSON.stringify(r.components.map((c) => c.role)))
	assert.equal(toolbars[0].controls, 2)
})

test('a filled label around a checked radio is the toggle, not a badge', { skip }, async () => {
	const r = await measure(`<fieldset style="position:absolute;left:464px;top:280px;border:0;padding:0;display:flex;flex-direction:column;gap:2px">
		<label style="display:flex;align-self:flex-start;gap:10px;align-items:center;min-height:34px;padding:0 9px 0 7px;border-radius:8px;background:#dce6f2"><input type="radio" name="d" checked style="width:20px;height:20px;margin:0">Behandeling van de zaak</label>
		<label style="display:flex;gap:10px;align-items:center;min-height:34px"><input type="radio" name="d" style="width:20px;height:20px;margin:0">Overig</label></fieldset>`)
	assert.deepEqual(r.elements.filter((e) => e.kind === 'badge').map((e) => e.label), [])
	assert.equal(r.elements.filter((e) => e.kind === 'toggle').length, 2)
})

test('the filled label of a checked radio is measured as its toggle\'s option ground, not left unmeasured', { skip }, async () => {
	const r = await measure(`<fieldset style="position:absolute;left:464px;top:280px;border:0;padding:0;display:flex;flex-direction:column;gap:2px">
		<label style="display:flex;align-self:flex-start;gap:10px;align-items:center;min-height:34px;padding:0 9px 0 7px;border-radius:8px;background:#dce6f2"><input type="radio" name="d" checked style="width:20px;height:20px;margin:0">Behandeling van de zaak</label>
		<label style="display:flex;gap:10px;align-items:center;min-height:34px"><input type="radio" name="d" style="width:20px;height:20px;margin:0">Overig</label></fieldset>`)
	assert.deepEqual(r.unmeasured, [])
	const toggles = r.elements.filter((e) => e.kind === 'toggle')
	assert.deepEqual(toggles.map((e) => e.props.optionGround || null), ['rgb(220, 230, 242)', null])
})

test('the filled content beside a checked hidden radio is its option ground (NcCheckboxRadioSwitch)', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:464px;top:280px;display:flex;flex-direction:column;gap:2px">
		<span class="checkbox-radio-switch" style="display:flex"><input type="radio" name="d" checked style="position:absolute;opacity:0;width:1px;height:1px"><span style="display:flex;gap:10px;align-items:center;min-height:34px;padding:0 9px 0 7px;border-radius:8px;background:#dce6f2"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#3669a5"/></svg>Behandeling van de zaak</span></span>
		<span class="checkbox-radio-switch" style="display:flex"><input type="radio" name="d" style="position:absolute;opacity:0;width:1px;height:1px"><span style="display:flex;gap:10px;align-items:center;min-height:34px"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#333"/></svg>Overig</span></span></div>`)
	assert.deepEqual(r.unmeasured, [])
	assert.deepEqual(r.elements.filter((e) => e.kind === 'toggle').map((e) => e.props.optionGround || null), ['rgb(220, 230, 242)', null])
})

test('a filled box holding several radios is not one option\'s ground', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:464px;top:280px;padding:4px;background:#fde2e2;display:flex;gap:8px;height:40px;align-items:center">
		<label><input type="radio" name="d" checked>Ja</label><label><input type="radio" name="d">Nee</label></div>`)
	assert.deepEqual(r.elements.filter((e) => e.kind === 'toggle').map((e) => e.props.optionGround || null), [null, null])
})

test('a count drawn as a filled ::after on a button\'s label is the button\'s badge (CnActionsBar filter menu)', { skip }, async () => {
	const css = `<style>.counted .t::after{content:var(--n);display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;margin-inline-start:6px;padding:0 6px;border-radius:10px;background:#3669a5;color:#fff;font-size:12px}</style>`
	const b = (cls, n) => `<button class="${cls}" style="--n:${n};display:flex;align-items:center;height:40px;padding:0 14px;border:1px solid #888;border-radius:8px;background:#fff"><span class="t">Filter</span></button>`
	const r = await measure(`${css}<div style="position:absolute;left:300px;top:200px;display:flex;gap:300px">${b('counted', "'2'")}</div><div style="position:absolute;left:300px;top:400px">${b('', '')}</div><div style="position:absolute;left:300px;top:600px">${b('counted', "''")}</div>`)
	const filters = r.elements.filter((e) => e.label === 'Filter').sort((x, y) => x.rect.y - y.rect.y)
	assert.deepEqual(filters.map((e) => e.props.badge), [true, false, false])
})

test('buttons that wrapped under a subtitle in the header row are not header actions', { skip }, async () => {
	const r = await measure(`<section style="position:absolute;left:292px;top:268px;width:800px;box-sizing:border-box;border:1px solid #ccc;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:14px">
		<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px">
			<div style="flex:1 1 600px;display:flex;flex-direction:column;gap:2px"><h2 style="margin:0;font-size:17px">Fasen en taken</h2><span style="font-size:14px">Elke taak heeft een eigen rol, termijn en formulier.</span></div>
			<div style="display:flex;gap:8px">${btn('Bekijken als flow')}${btn('Taak toevoegen')}</div></div>
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><section style="padding:14px;background:#f5f6f8">Fase 1</section><section style="padding:14px;background:#f5f6f8">Fase 2</section></div></section>`)
	const c = r.components.find((x) => x.title === 'Fasen en taken')
	assert.equal(c.header.actions, 0, JSON.stringify(c.header))
})

test('a filled content box beside a checked radio is the toggle, not a badge (NcCheckboxRadioSwitch)', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:464px;top:280px;display:flex;flex-direction:column;gap:2px">
		<span class="checkbox-radio-switch" style="display:flex"><input type="radio" name="d" checked style="position:absolute;opacity:0;width:1px;height:1px"><span style="display:flex;gap:10px;align-items:center;min-height:34px;padding:0 9px 0 7px;border-radius:8px;background:#dce6f2"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#3669a5"/></svg>Behandeling van de zaak</span></span>
		<span class="checkbox-radio-switch" style="display:flex"><input type="radio" name="d" style="position:absolute;opacity:0;width:1px;height:1px"><span style="display:flex;gap:10px;align-items:center;min-height:34px">Overig</span></span></div>`)
	assert.deepEqual(r.elements.filter((e) => e.kind === 'badge').map((e) => e.label), [])
})

test('a menu row whose li is only rounded (NcActions focus) is still measured on its button', { skip }, async () => {
	const row = (cls, t) => `<li class="${cls}" style="border-radius:${cls ? 6 : 0}px"><button style="display:flex;align-items:center;width:100%;min-height:36px;padding:0 10px;border:0;border-radius:6px;background:${cls ? '#eceef1' : 'transparent'}">${t}</button></li>`
	const r = await measure(`<ul role="menu" style="position:absolute;left:1014px;top:140px;width:258px;list-style:none;margin:0;padding:6px">${row('action active', 'Zaaktype importeren uit bestand')}${row('', 'Sjablonen opnieuw laden')}</ul>`)
	const rows = r.elements.filter((e) => /importeren|Sjablonen/.test(e.label))
	assert.deepEqual(rows.map((e) => [e.kind, e.props.paddingLeft]), [['row', 10], ['row', 10]], JSON.stringify(rows.map((e) => [e.kind, e.label, e.props.paddingLeft])))
})

test('what sits in a closed disclosure is not measured; its summary is', { skip }, async () => {
	const r = await measure('<details style="position:absolute;left:300px;top:300px;width:600px"><summary>Een regel proberen op een zaak</summary><div style="display:flex;gap:8px"><input aria-label="Regel" style="height:40px"><button style="height:40px;border:1px solid #888;border-radius:8px">Probeer het</button></div></details>')
	assert.deepEqual(r.elements.filter((e) => /Regel|Probeer/.test(e.label)), [])
})

test('a launcher pinned to the window\'s lower right corner is chrome, not an element', { skip }, async () => {
	const r = await measure('<button aria-label="AI-chat openen" style="position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:28px;background:#3669a5;border:0"><svg width="24" height="24"><rect width="24" height="24"/></svg></button><button style="position:absolute;left:300px;top:300px;height:40px;border:1px solid #888">Opslaan</button>')
	assert.deepEqual(r.elements.map((e) => e.label), ['Opslaan'])
})

test('a meta line that is only a time of day reads as meta, not as a number', { skip }, async () => {
	const card = (meta) => `<a href="#" style="display:flex;flex-direction:column;gap:6px;border:1px solid #ddd;border-radius:12px;padding:12px 14px;text-decoration:none;color:#1b1c1d"><strong style="font-size:15px">Havenstraat, speeltuin</strong><span style="font-size:13px;color:#5e6168">${meta}</span></a>`
	const deck = (meta) => `<div style="position:absolute;left:300px;top:300px;width:300px;display:flex;flex-direction:column;gap:12px">${card(meta)}${card(meta)}${card(meta)}</div>`
	const s = async (meta) => (await measure(deck(meta))).components.find((c) => c.role === 'card').structure
	assert.equal(await s('15.00'), await s('15.00 · 12 vragen'))
})

test('a count inside a button is the button\'s badge, not a pill of its own', { skip }, async () => {
	const r = await measure('<button style="position:absolute;left:300px;top:300px;height:36px;border:1px solid #3669a5;border-radius:8px;display:inline-flex;gap:8px;align-items:center">Filter<span aria-label="1 actief" style="min-width:20px;height:20px;border-radius:10px;background:#3669a5;color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center">1</span></button>')
	assert.deepEqual(r.elements.map((e) => e.label), ['Filter'])
	assert.equal(r.elements[0].props.badge, true)
})

test('a tinted list row is a row, not a badge, as the library draws the chosen folder', { skip }, async () => {
	const r = await measure('<ul style="position:absolute;left:300px;top:300px;width:280px;list-style:none;margin:0;padding:0"><li style="height:34px;padding:0 10px;border-radius:8px;background:#eaf0f7;line-height:34px">Vergunningen</li><li style="height:34px;padding:0 10px">Handhaving</li></ul>')
	assert.equal(r.elements.find((e) => e.label === 'Vergunningen').kind, 'row')
})

test('a card\'s title-line buttons and a closing button pair are not toolbars', { skip }, async () => {
	const card = '<section style="position:absolute;left:764px;top:500px;width:600px;border:1px solid #ddd;padding:20px"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;font-size:17px">Historie</h2></div><div style="position:absolute;right:20px;top:18px;width:320px;display:flex;gap:8px;justify-content:flex-end"><button style="height:36px;border:1px solid #888;border-radius:8px">Notitie toevoegen</button><button style="height:36px;border:1px solid #888;border-radius:8px">Exporteren</button></div><p>Rij een</p><p>Rij twee</p><div style="display:flex;gap:8px;justify-content:flex-end;width:100%"><button style="height:40px;border:1px solid #888;border-radius:8px">Annuleren</button><button style="height:40px;border:1px solid #3669a5;border-radius:8px">Dag afsluiten</button></div></section>'
	const r = await measure(card)
	assert.deepEqual(r.components.filter((c) => c.role === 'toolbar'), [])
	// A toolbar of controls in the body, with content after it, still is one.
	const bar = await measure('<section style="position:absolute;left:300px;top:300px;width:700px;border:1px solid #ddd;padding:20px"><h2 style="margin:0">Zaken</h2><div style="display:flex;gap:8px;width:660px"><input type="search" style="height:40px;width:300px"><button style="height:40px;border:1px solid #888;border-radius:8px">Filter</button></div><p>rij</p></section>')
	assert.equal(bar.components.filter((c) => c.role === 'toolbar').length, 1)
})

test('two tables pair by their columns\' names, not by their order, when one is missing on a side', { skip }, async () => {
	const t = (top, cols) => `<table style="position:absolute;left:315px;top:${top}px;width:1000px"><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody><tr>${cols.map(() => '<td>x</td>').join('')}</tr></tbody></table>`
	const ing = ['Zaak', 'Ingebrekestelling', 'Verstuurd'], kw = ['Kwartaal', 'Afgehandeld', 'Binnen termijn']
	const board = await measure(t(600, ing) + t(800, kw))
	const live = await measure(t(600, kw))
	const { pairs, missing } = pairComponents(board.components, live.components, 900)
	assert.equal(pairs.find((p) => p.board.role === 'table').board.headText, live.components.find((c) => c.role === 'table').headText)
	assert.match(missing.find((c) => c.role === 'table').headText, /Ingebrekestelling/)
})

test('a wide tinted line of text is a notice card on both sides, whatever its role', { skip }, async () => {
	const r = await measure('<div style="position:absolute;left:292px;top:1064px;width:1120px;box-sizing:border-box;padding:10px 14px;background:#eaf0f7;border-radius:10px">Binnen termijn ziet alleen wie controleert of beheert.</div>')
	assert.equal(r.components.filter((c) => c.role === 'card').length, 1)
	// A tinted narrow row is no card.
	const row = await measure('<div style="position:absolute;left:292px;top:400px;width:300px;padding:10px 14px;background:#eaf0f7">Wacht op inwoner</div>')
	assert.equal(row.components.filter((c) => c.role === 'card').length, 0)
})

test('a focused field drawn with its ring on a wrapper reads like a board input with a 2px border', { skip }, async () => {
	const live = await measure('<div class="wrap" style="position:absolute;left:424px;top:300px;width:400px;border:2px solid #3669a5;border-radius:10px"><input aria-label="Delen met" style="display:block;width:396px;box-sizing:border-box;height:40px;border:1px solid #828a95;border-radius:8px"></div><script>document.querySelector("input").focus()</script>')
	const f = live.elements.find((e) => e.label === 'Delen met')
	assert.deepEqual([f.props.h, f.props.border], [44, 2])
	// Not focused, the field is its own 40px box and 1px line.
	const rest = await measure('<div style="position:absolute;left:424px;top:300px;width:400px;border:2px solid #3669a5;border-radius:10px"><input aria-label="Delen met" style="display:block;width:396px;box-sizing:border-box;height:40px;border:1px solid #828a95;border-radius:8px"></div>')
	assert.deepEqual([rest.elements[0].props.h, rest.elements[0].props.border], [40, 1])
})

test('a select with no label of its own is named by the caption over it, not by its chosen option', { skip }, async () => {
	const r = await measure('<div style="position:absolute;left:300px;top:300px;display:flex;flex-direction:column;gap:6px;width:300px"><span style="font-weight:600">Zichtbaarheid</span><select style="height:40px"><option>Intern en openbaar</option></select></div>')
	assert.equal(r.elements.find((e) => e.kind === 'field').label, 'Zichtbaarheid')
})

test('a note card beside 40px field boxes is a card: the field boxes are form parts, not rows of a list', { skip }, async () => {
	const field = '<div style="height:40px;border:1px solid #828a95;border-radius:8px"><textarea aria-label="Reden" style="border:0;width:100%;height:36px"></textarea></div>'
	const r = await measure(`<div role="dialog" aria-modal="true" style="position:absolute;left:400px;top:88px;width:640px;background:#fff;padding:24px;box-sizing:border-box"><h2>Zaak archiveren</h2><div>${field}<div style="margin-top:16px;padding:14px 20px;background:#eaf0f7;border-radius:8px"><p style="margin:0;font-weight:600">Daarna alleen lezen</p><p style="margin:0">De zaak is dicht.</p></div>${field}</div></div>`)
	assert.ok(r.components.some((c) => c.role === 'dialog-card' && c.title === 'Daarna alleen lezen'), JSON.stringify(r.components.map((c) => [c.role, c.title])))
})

test('a link right under a widget title is its header action in a grid of widgets, wrapped there or set in the title stack', { skip }, async () => {
	const rows = '<ul style="margin:0;padding:0;list-style:none">' + ['Uitbouw keuken', 'Dakkapel'].map((t) => `<li style="padding:12px 0;border-top:1px solid #eef0f3">${t}</li>`).join('') + '</ul>'
	const live = (t) => `<section style="border:1px solid #ddd;border-radius:12px;padding:20px 22px"><div><div style="display:flex;flex-direction:column;gap:2px"><h2 style="margin:0;font-size:17px">${t}</h2><a href="#" style="font-size:14px;font-weight:600">Alles bekijken</a></div></div>${rows}</section>`
	const board = (t) => `<section style="border:1px solid #ddd;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 16px"><div style="flex:1 1 260px"><h2 style="margin:0;font-size:17px">${t}</h2></div><div style="flex:none"><a href="#" style="font-size:14px;font-weight:600">Alles bekijken</a></div></div>${rows}</section>`
	const grid = (card) => `<div style="position:absolute;left:292px;top:600px;width:1120px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${['Zaken die u volgt', 'Recent geopend', 'Vastgelopen zaken'].map(card).join('')}</div>`
	const h = async (html) => (await measure(html)).components.find((c) => c.title === 'Zaken die u volgt').header.actions
	assert.equal(await h(grid(live)), 1)
	assert.equal(await h(grid(board)), 1)
})

test('a link stacked 10px under a widget title is its header action, and the first row\'s rule under it is the header separator', { skip }, async () => {
	const li = (t, rule) => `<li style="padding:12px 0;border-top:1px solid ${rule}"><strong style="font-size:15px">${t}</strong><br><span style="font-size:13px">8 dagen stil</span></li>`
	const rows = (rule) => `<ul style="margin:0;padding:0;list-style:none">${li('Dakkapel Kerkstraat 12', rule)}${li('Schuur Molenweg 3', rule)}</ul>`
	const live = (t) => `<div style="border:1px solid #e4e6ea;border-radius:12px"><div style="padding:20px 22px 0"><div style="display:flex;flex-direction:column;gap:10px"><h2 style="margin:0;font-size:17px;line-height:21px">${t}</h2><a href="#" style="font-size:14px;font-weight:600">Alles bekijken</a></div></div><div style="padding:6px 22px 20px">${rows('#e4e6ea')}</div></div>`
	const board = (t) => `<section style="border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 16px"><div style="flex:1 1 260px"><h2 style="margin:0;font-size:17px;line-height:21px">${t}</h2></div><div style="flex:none"><a href="#" style="font-size:14px;font-weight:600">Alles bekijken</a></div></div>${rows('#eef0f3')}</section>`
	const grid = (card) => `<div style="position:absolute;left:292px;top:600px;width:1120px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${['Zaken die u volgt', 'Recent geopend', 'Vastgelopen zaken'].map(card).join('')}</div>`
	const head = async (html) => { const c = (await measure(html)).components.find((x) => x.title === 'Vastgelopen zaken'); return [c.header.actions, c.header.separator, c.content.gapBelowTitle] }
	const b = await head(grid(board))
	const l = await head(grid(live))
	assert.deepEqual(l.slice(0, 2), [1, 1])
	assert.deepEqual(l.slice(0, 2), b.slice(0, 2))
	assert.ok(Math.abs(l[2] - b[2]) <= 3, JSON.stringify([b, l]))
	// A widget with no link under its title still has no header action, so a link the board draws and live lacks fails.
	const bare = await head(grid((t) => live(t).replace('<a href="#" style="font-size:14px;font-weight:600">Alles bekijken</a>', '')))
	assert.equal(bare[0], 0)
})

test('a text button drawn on the ground it stands on (a white NcButton on a white card) is a plain link, not a pill', { skip }, async () => {
	const r = await measure('<div style="position:absolute;left:985px;top:600px;width:400px;background:#fff;padding:12px"><p>Twee zaken staan niet op de kaart.</p><button style="height:17px;padding:0;border:0;border-radius:8px;background:#fff;color:#234a78;font-weight:600;text-decoration:underline">Toon ze in de tabel</button></div>')
	assert.deepEqual(r.elements.filter((e) => /Toon ze/.test(e.label)), [])
})

test('NcSelect\'s caret in its actions box is the field\'s icon, as a board select\'s chevron is', { skip }, async () => {
	const live = await measure('<div class="v-select select" style="position:absolute;left:400px;top:300px;width:240px"><div class="vs__dropdown-toggle" style="display:flex;height:40px;border:1px solid #828a95;border-radius:8px"><div class="vs__selected-options" style="flex:1"><input class="vs__search" role="combobox" aria-label="Zaaktype:" style="border:0;height:36px;width:100%"></div><div class="vs__actions" style="display:flex;align-items:center;padding:0 8px"><button class="vs__open-indicator-button" aria-hidden="true" tabindex="-1" style="border:0;background:none;padding:0"><svg width="20" height="20"><path d="M7 10l5 5 5-5z"/></svg></button></div></div></div>')
	assert.equal(live.elements.find((e) => e.kind === 'field').props.icon, true)
})

test('a caption over a segmented control is not part of the toolbar: the control is, as live draws it', { skip }, async () => {
	const seg = '<div style="display:flex;gap:2px;padding:3px;background:#f0f1f3;border-radius:10px;width:300px;box-sizing:border-box"><button style="flex:1;height:34px;border:0;border-radius:8px;background:#fff">Oplopend</button><button style="flex:1;height:34px;border:0;border-radius:8px;background:none">Aflopend</button></div>'
	const board = await measure(`<div style="position:absolute;left:1101px;top:372px;width:315px;display:flex;flex-direction:column;gap:6px"><span style="font-weight:600">Richting</span>${seg}</div>`)
	const t = board.components.find((c) => c.role === 'toolbar')
	assert.deepEqual([t.rect.h, t.gap], [40, 2])
})

test('a wrapping row of chips and controls is one toolbar, on one line or wrapped onto two', { skip }, async () => {
	const chip = (t) => `<button aria-pressed="false" style="height:38px;padding:0 14px;border:1px solid #ddd;border-radius:19px;background:#fff">${t}</button>`
	const row = (w, chips) => `<div style="position:absolute;left:292px;top:322px;width:${w}px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">${chips.map(chip).join('')}<span style="flex:1"></span><button style="height:40px;border:1px solid #888;border-radius:8px">Filter</button><div role="group" style="display:flex;gap:2px"><button aria-label="Lijst" style="width:40px;height:40px;border:1px solid #888;border-radius:8px"></button><button aria-label="Kaarten" style="width:40px;height:40px;border:1px solid #888;border-radius:8px"></button></div></div>`
	const one = await measure(row(800, ['Alle typen 3', 'Woo-verzoek 3']))
	const two = await measure(row(800, ['Alle typen 12', 'Woo-verzoek 4', 'Omgevingsvergunning 3', 'Bezwaar 2', 'Melding openbare ruimte 3']))
	assert.equal(one.components.filter((c) => c.role === 'toolbar').length, 1)
	assert.equal(two.components.filter((c) => c.role === 'toolbar').length, 1)
	// A grid of cards that wraps is no toolbar.
	const cards = await measure(`<div style="position:absolute;left:292px;top:322px;width:800px;display:flex;flex-wrap:wrap;gap:16px">${[1, 2, 3, 4].map((i) => `<div style="width:380px;height:120px;border:1px solid #ddd"><button>Open ${i}</button><button>Meer ${i}</button></div>`).join('')}</div>`)
	assert.equal(cards.components.filter((c) => c.role === 'toolbar').length, 0)
})

test('a switch\'s transparent hit-area border is not where it is drawn: the inset reads the track', { skip }, async () => {
	const card = (sw) => `<section style="position:absolute;left:300px;top:300px;width:400px;border:1px solid #ddd;padding:16px 22px"><h2 style="margin:0 0 8px">Opgeslagen zoekopdracht</h2><div style="display:flex;gap:10px;align-items:center">${sw}<span>Melden bij nieuwe resultaten</span></div></section>`
	const board = await measure(card('<span style="display:inline-block;width:36px;height:20px;border:6px solid transparent;margin:-6px;background:#3669a5;background-clip:padding-box;border-radius:16px"></span>'))
	const live = await measure(card('<span style="display:inline-block;width:36px;height:20px;background:#3669a5;border-radius:10px"></span>'))
	assert.equal(board.components[0].content.minInsetLeft, live.components[0].content.minInsetLeft)
})

test('a switch inside a transparent hit-area border not painted under is measured on its drawn track', { skip }, async () => {
	const sw = (style) => `<button role="switch" aria-checked="true" aria-label="Melden vanaf een aantal" style="position:absolute;left:300px;top:300px;${style}"></button>`
	const board = await measure(sw('width:38px;height:22px;border:6px solid transparent;background:#3669a5;background-clip:padding-box;box-sizing:content-box;margin:-6px;padding:0;border-radius:17px'))
	const live = await measure(sw('width:38px;height:22px;border:0;padding:0;background:#3669a5;border-radius:11px'))
	const p = (r) => [r.elements[0].props.h, r.elements[0].props.borderRadius]
	assert.deepEqual(p(board), p(live))
	// Painted under (the background shorthand set after the clip resets it to border-box), the border is drawn: 34px.
	const painted = await measure(sw('width:38px;height:22px;border:6px solid transparent;background-clip:padding-box;background:#3669a5;box-sizing:content-box;padding:0;border-radius:17px'))
	assert.equal(painted.elements[0].props.h, 34)
})

test('a disclosure\'s summary is the button that opens it, as a board draws it', { skip }, async () => {
	const r = await measure('<details style="position:absolute;left:400px;top:300px;width:500px"><summary>Bundeling en testbericht</summary><p>Inhoud</p></details>')
	assert.deepEqual(r.elements.map((e) => [e.kind, e.label]), [['button', 'Bundeling en testbericht']])
})

test('a native date input counts its picker button as its icon, as a board draws the calendar glyph', { skip }, async () => {
	const r = await measure('<label style="position:absolute;left:400px;top:300px">Geplande einddatum <input type="date" style="height:40px"></label>')
	assert.equal(r.elements.find((e) => e.kind === 'field').props.icon, true)
})

test('a sort button in a column head is marked as in the head', { skip }, async () => {
	const r = await measure('<table style="position:absolute;left:300px;top:300px;width:600px"><thead><tr><th aria-sort="none"><button style="height:34px;border:0;background:none">Grondslag<svg width="16" height="16"><path d="M7 10l5 5 5-5z"/></svg></button></th><th>Bedrag</th></tr></thead><tbody><tr><td>a</td><td>b</td></tr></tbody></table>')
	assert.equal(r.elements.find((e) => e.label === 'Grondslag').inHead, true)
})

test('a view switch\'s track around measured icon buttons is accounted for, not "not measured"', { skip }, async () => {
	const btn = (l, on) => `<button aria-label="${l}" aria-pressed="${on}" style="width:40px;height:34px;border:0;border-radius:6px;background:${on ? '#fff' : 'transparent'}"><svg width="18" height="18"><rect width="18" height="18"/></svg></button>`
	const r = await measure(`<div role="group" aria-label="Weergave" style="position:absolute;left:1240px;top:188px;display:flex;gap:2px;padding:3px;border-radius:8px;background:#eceef1">${btn('Tabel', true)}${btn('Kaarten', false)}${btn('Bord', false)}${btn('Kaart', false)}</div>`)
	assert.deepEqual(r.unmeasured, [])
	assert.equal(r.elements.length, 4)
})

test('an open listbox is a component of its own, and a dialog footer under it is still the footer, not a toolbar', { skip }, async () => {
	const opt = (t) => `<li role="option" style="height:44px;display:flex;align-items:center;padding:0 10px">${t}</li>`
	const r = await measure(`<div role="dialog" aria-modal="true" style="position:absolute;left:400px;top:120px;width:640px;background:#fff"><h2 style="margin:24px">Weergave delen</h2><div style="position:relative;margin:0 24px"><input aria-label="Delen met" style="width:100%;height:40px;box-sizing:border-box"><ul role="listbox" style="position:absolute;top:100%;left:0;right:0;z-index:2;margin:0;padding:4px 6px;list-style:none;border:1px solid #1b1c1d;border-radius:0 0 8px 8px;background:#fff">${opt('Hanna Bos')}${opt('Hanneke de Boer')}${opt('Juridische zaken')}${opt('Team Vergunningen')}${opt('Wijkteam Oost')}${opt('Woo-team')}${opt('Beheer')}</ul></div><p style="margin:24px">Mag gebruiken: ziet de weergave.</p><div style="display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #eef0f3"><button style="height:40px;border:1px solid #828a95;border-radius:8px">Annuleren</button><button style="height:40px;border:0;border-radius:8px;background:#3669a5;color:#fff">Delen opslaan</button></div></div>`)
	assert.deepEqual(r.components.filter((c) => c.role === 'toolbar'), [])
	const lb = r.components.find((c) => c.role === 'listbox')
	assert.deepEqual([lb.popup, lb.optionHeight], [true, 44])
	assert.deepEqual(r.unmeasured, [])
})

test('a checkbox drawn as a ::before starts its row, as a board\'s svg box does', { skip }, async () => {
	const row = (box) => `<section style="position:absolute;left:300px;top:300px;width:400px;border:1px solid #ddd;padding:16px 22px"><h2 style="margin:0 0 12px">Checklist</h2><label style="display:flex;gap:10px;align-items:center">${box}<span>Situatie ter plaatse bekeken</span></label></section>`
	const board = await measure(row('<svg width="20" height="20"><rect width="20" height="20" fill="#3669a5"/></svg>'))
	const live = await measure('<style>.checkbox-content__icon{display:inline-block;width:20px;height:20px;position:relative}.checkbox-content__icon::before{content:"";position:absolute;inset:0;width:16px;height:16px;border:2px solid #3669a5;border-radius:4px}</style>' + row('<span class="checkbox-content__icon"></span>'))
	assert.equal(live.components[0].content.firstRowInsetLeft, board.components[0].content.firstRowInsetLeft)
})

test('a drawn checkbox wrapped by its label is named by that label', { skip }, async () => {
	const r = await measure('<label style="position:absolute;left:300px;top:300px;display:inline-flex;gap:8px"><span role="checkbox" aria-checked="false" style="display:inline-flex"><svg width="20" height="20"><rect width="20" height="20"/></svg></span>Ook wie de zaak las</label>')
	assert.equal(r.elements.find((e) => e.kind === 'toggle').label, 'Ook wie de zaak las')
})

test('a field under a label with a muted part is named by the whole label', { skip }, async () => {
	const r = await measure('<div style="position:absolute;left:424px;top:450px;width:592px;display:flex;flex-direction:column;gap:6px"><label style="font-weight:600">Bericht <span style="font-weight:400;color:#5e6168">(niet verplicht)</span></label><input type="text" style="height:40px"></div>')
	assert.equal(r.elements.find((e) => e.kind === 'field').label, 'Bericht (niet verplicht)')
})

test('a search select\'s magnifier is its field\'s icon', { skip }, async () => {
	const r = await measure('<div class="cn-search-select" style="position:absolute;left:400px;top:300px;width:400px;display:flex;align-items:center;border:1px solid #828a95;border-radius:8px"><span class="cn-search-select__magnifier" style="padding:0 8px"><svg width="18" height="18"><circle cx="9" cy="9" r="6"/></svg></span><div class="v-select" style="flex:1"><div class="vs__dropdown-toggle"><input class="vs__search" role="combobox" aria-label="Adres zoeken" style="border:0;height:38px;width:100%"></div></div></div>')
	assert.equal(r.elements.find((e) => e.kind === 'field').props.icon, true)
})

test('a native date-time input is marked native, so its picker glyph is not compared as an icon', { skip }, async () => {
	const r = await measure('<label style="position:absolute;left:400px;top:300px">Wanneer <input type="datetime-local" style="height:40px"></label>')
	assert.equal(r.elements.find((e) => e.kind === 'field').props.native, true)
})

test('a one-line warning note with a border around its tinted ground is a card, not a divider in the card around it', { skip }, async () => {
	const card = (note) => `<section style="position:absolute;left:292px;top:300px;width:1120px;box-sizing:border-box;border:1px solid #ddd;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:12px"><h2 style="margin:0;font-size:17px">AI-ondersteunde verwerking</h2><p style="margin:0">Kies welke functies AI mogen gebruiken.</p>${note}<h3 style="margin:0;font-size:16px">Verbindingstest</h3><p style="margin:0">Laatste test geslaagd.</p></section>`
	const board = await measure(card('<p style="margin:0;padding:12px 14px;border:1px solid #f0c987;border-radius:10px;background:#fff4e5;font-size:14px;line-height:1.5">Een DPIA is verplicht voordat je AI-functies met persoonsgegevens gebruikt.</p>'))
	const live = await measure(card('<div style="padding:12px 14px;border-radius:10px;background:#fff4e5;font-size:14px;line-height:1.5">Een DPIA is verplicht voordat je AI-functies met persoonsgegevens gebruikt.</div>'))
	const s = (r) => r.components.find((c) => c.title === 'AI-ondersteunde verwerking').structure
	assert.equal(s(board), s(live))
	assert.equal(board.components.length, live.components.length)
})

test('a listbox a dialog\'s select appended to the body is measured with the dialog', { skip }, async () => {
	const opt = (t) => `<li role="option" style="height:44px;display:flex;align-items:center;padding:0 10px">${t}</li>`
	const r = await measure(`<div role="dialog" aria-modal="true" style="position:absolute;left:400px;top:120px;width:640px;height:400px;background:#fff"><h2 style="margin:24px">Weergave delen</h2><input aria-label="Delen met" style="margin:0 24px;width:592px;height:40px"></div><ul role="listbox" style="position:absolute;left:424px;top:250px;width:592px;margin:0;padding:4px;list-style:none;border:1px solid #1b1c1d;background:#fff;z-index:9">${opt('Hanna Bos')}${opt('Hanneke de Boer')}${opt('Hanneke Postma')}</ul>`)
	assert.equal(r.components.filter((c) => c.role === 'listbox').length, 1)
})

test('a rule drawn on top of the list under a framed head is the head\'s rule, as a board draws it on the head', { skip }, async () => {
	const col = (live) => `<section style="width:300px;height:500px;border:1px solid #ddd;border-radius:12px;overflow:hidden"><div style="height:72px;padding:12px 16px;box-sizing:border-box;background:#f5f6f8;${live ? '' : 'border-bottom:1px solid #ddd'}"><h3 style="margin:0">Vandaag</h3><span>4 adressen</span></div><ul style="margin:0;padding:12px;list-style:none;${live ? 'border-top:1px solid #ddd' : ''}"><li>Molenweg 4</li></ul></section>`
	const frames = (live) => `<div style="position:absolute;left:300px;top:200px;display:flex;gap:20px">${col(live)}${col(live)}${col(live)}</div>`
	const s = async (live) => (await measure(frames(live))).components.filter((c) => c.role === 'card' && !c.title).map((c) => c.structure).join('|')
	assert.equal(await s(true), await s(false))
})

test('text placed off the page (a live region at left -10000px) does not set a card\'s insets', { skip }, async () => {
	const card = (extra) => `<section style="position:absolute;left:294px;top:413px;width:796px;border:1px solid #ddd;padding:16px 20px"><h2 style="margin:0 0 8px">Wachtrij</h2><p style="margin:0">Geen zaken</p>${extra}</section>`
	const a = await measure(card(''))
	const b = await measure(card('<div style="position:absolute;left:-10000px;top:60px;width:200px;height:20px">3 zaken geladen</div>'))
	assert.deepEqual(b.components[0].content, a.components[0].content)
})

test('an open multiple NcSelect is read on its frame: the toggle\'s box and ring, and the input\'s own line inside it', { skip }, async () => {
	const sel = (toggle) => `<label style="position:absolute;left:424px;top:200px;width:592px;display:flex;flex-direction:column;gap:6px"><span>Delen met</span><div class="v-select select vs--multiple vs--open"><div class="vs__dropdown-toggle" style="display:flex;box-sizing:border-box;height:44px;padding:2px;${toggle}"><div class="vs__selected-options" style="flex:1"><div class="vs__search"><input aria-label="Delen met" style="box-sizing:border-box;width:100%;height:36px;border:1px solid #3669a5;border-radius:8px"></div></div><div class="vs__actions"><svg width="20" height="20"><path d="M7 10l5 5 5-5z"/></svg></div></div></div></label>`
	const live = await measure(sel('border:2px solid #1b1c1d;border-radius:8px'))
	const f = live.elements.find((e) => e.kind === 'field').props
	assert.deepEqual([f.h, f.border, f.borderColor, f.innerBorder, f.innerBorderColor], [44, 2, 'rgb(27, 28, 29)', 1, 'rgb(54, 105, 165)'])
	// Control: a toggle with no frame of its own leaves the input's border as the field's.
	const bare = await measure(sel('border:0'))
	const g = bare.elements.find((e) => e.kind === 'field').props
	assert.deepEqual([g.border, g.borderColor, g.innerBorder], [1, 'rgb(54, 105, 165)', 0])
})

test('an avatar drawn as a painted disc under a tinted initials layer is one pill, coloured by what it paints', { skip }, async () => {
	const live = await measure('<div style="position:absolute;left:450px;top:420px;display:flex;gap:8px;align-items:center"><div class="avatardiv" style="width:32px;height:32px;border-radius:50%;background:#3669a5"><div class="avatardiv__initials-wrapper" style="width:32px;height:32px;border-radius:50%;background:rgba(121, 90, 171, 0.1);display:flex;align-items:center;justify-content:center;color:#fff">B</div></div><span>behandelaars</span></div>')
	const pills = live.elements.filter((e) => e.kind === 'pill')
	assert.deepEqual(pills.map((p) => [p.label, p.props.background]), [['B', 'rgb(61, 104, 166)']])
	// Control: a disc painted another colour still reads as that colour.
	const other = await measure('<div style="position:absolute;left:450px;top:420px;display:flex;gap:8px;align-items:center"><div style="width:32px;height:32px;border-radius:50%;background:#795aab"><div style="width:32px;height:32px;border-radius:50%;background:rgba(121, 90, 171, 0.1);display:flex;align-items:center;justify-content:center;color:#fff">B</div></div><span>behandelaars</span></div>')
	assert.deepEqual(other.elements.filter((e) => e.kind === 'pill').map((p) => p.props.background), ['rgb(121, 90, 171)'])
})

test('the chosen value a select shows beside its search input is the field\'s content, not a pill of its own', { skip }, async () => {
	const chip = '<span style="width:26px;height:26px;border-radius:13px;background:#3669a5;color:#fff;display:inline-flex;align-items:center;justify-content:center">PJ</span>'
	const live = await measure(`<label style="position:absolute;left:730px;top:600px;width:324px">Toegewezen aan<div class="v-select"><div class="vs__dropdown-toggle" style="display:flex;height:40px"><div class="vs__selected-options" style="display:flex;flex:1;align-items:center"><span class="vs__selected" style="display:flex;gap:6px;align-items:center">${chip}Pieter Jansen</span><input class="vs__search" aria-label="Toegewezen aan" style="border:1px solid #828a95;height:38px;flex:1"></div></div></div></label>`)
	assert.deepEqual(live.elements.filter((e) => e.kind === 'pill'), [])
	// Control: the same chip outside a select is a pill.
	const out = await measure(`<div style="position:absolute;left:730px;top:600px;display:flex;gap:6px;align-items:center">${chip}Pieter Jansen</div>`)
	assert.equal(out.elements.filter((e) => e.kind === 'pill').length, 1)
})

test('a pager\'s boxed row is not a page link: its page buttons are', { skip }, async () => {
	const r = await measure('<div style="position:absolute;left:0;top:0;width:1440px;height:900px;background:#f5f6f8"><div style="position:absolute;left:622px;top:100px;width:790px;height:300px;box-sizing:border-box;border:1px solid #ddd;border-bottom:0;background:#fff"><p style="margin:16px">Medewerkers</p></div><div class="cn-pagination" style="position:absolute;left:622px;top:400px;width:790px;height:61px;box-sizing:border-box;border:1px solid #ddd;border-top:0;padding:0 16px;display:flex;align-items:center;justify-content:space-between;background:#fff;color:#5e6168"><span>5 van 5</span><nav aria-label="Paginering" style="display:flex;gap:6px"><button aria-current="page" style="width:34px;height:34px;border:0;border-radius:8px;background:#3669a5;color:#fff">1</button><button style="height:36px;border:1px solid #e4e6ea;border-radius:8px;background:#fff">Volgende</button></nav></div></div>')
	const pager = r.elements.filter((e) => e.inControl === 'pager')
	assert.deepEqual(pager.map((e) => [e.label, e.props.h]), [['1', 34], ['Volgende', 36]])
})

test('a count pill in a list row is the row\'s badge, as it is in a button drawn as that row', { skip }, async () => {
	const row = (pill) => `<ul style="position:absolute;left:307px;top:540px;width:280px;margin:0;padding:0;list-style:none"><li style="display:flex;justify-content:space-between;align-items:center;height:36px;padding:0 10px 0 28px;border-radius:8px">Sociaal domein${pill}</li></ul>`
	const board = await measure(row('<span style="height:20px;padding:0 6px;border-radius:10px;background:#eceef1">120</span>'))
	assert.equal(board.elements.find((e) => e.kind === 'row').props.badge, true)
	// Control: a row with no count pill has no badge.
	const bare = await measure(row(''))
	assert.equal(bare.elements.find((e) => e.kind === 'row').props.badge, false)
})

test('a stack of one item per line that wraps is no toolbar (the wrapping chip row above stays one)', { skip }, async () => {
	const r = await measure('<div style="position:absolute;left:292px;top:187px;width:1120px;display:flex;flex-wrap:wrap;gap:20px"><div style="flex:0 0 100%"><button style="height:40px;border:1px solid #888;border-radius:8px">Acties</button></div><div style="flex:0 0 360px"><input type="search" aria-label="Zoeken" style="height:40px;width:360px;box-sizing:border-box"></div></div>')
	assert.deepEqual(r.components.filter((c) => c.role === 'toolbar'), [])
})

test('a row of steps is a progress indicator, not a toolbar; a row of buttons beside it still is', { skip }, async () => {
	const step = (n, done) => `<li style="display:flex;align-items:center;gap:8px"${n === 4 ? ' aria-current="step"' : ''}>${done ? `<button style="height:28px;border:0;border-radius:14px;background:#1f7a3a;color:#fff">${n}</button>` : `<span style="width:28px;height:28px;border-radius:14px;border:2px solid #888">${n}</span>`}<span>Stap ${n}</span></li>`
	const r = await measure(`<div style="position:absolute;left:384px;top:175px;width:672px"><ol style="display:flex;gap:12px;margin:0;padding:0;list-style:none">${[1, 2, 3, 4, 5].map((n) => step(n, n < 4)).join('')}</ol></div>`)
	assert.deepEqual(r.components.filter((c) => c.role === 'toolbar'), [])
	const bar = await measure(`<div style="position:absolute;left:384px;top:175px;width:672px;display:flex;gap:8px"><button style="height:36px">Vorige</button><button style="height:36px">Volgende</button></div>`)
	assert.equal(bar.components.filter((c) => c.role === 'toolbar').length, 1)
})

test('a row of fields each under a label that is not tied to it is a form row, not a toolbar', { skip }, async () => {
	const field = (l, labelled) => `<div style="display:flex;flex-direction:column;gap:6px">${labelled ? `<label style="font-weight:600">${l}</label>` : ''}<input type="text" style="height:40px;box-sizing:border-box"></div>`
	const row = (labelled) => `<div style="position:absolute;left:315px;top:558px;width:1074px;display:grid;grid-template-columns:repeat(4, 1fr);gap:14px">${['Naam van de organisatie', 'Plaats van de gemeente', 'Naam van de app', 'Thema'].map((l) => field(l, labelled)).join('')}</div>`
	assert.deepEqual((await measure(row(true))).components.filter((c) => c.role === 'toolbar'), [])
	// Control: the same row without labels is still a toolbar.
	assert.equal((await measure(row(false))).components.filter((c) => c.role === 'toolbar').length, 1)
})

test('a tag drawn in its row\'s own colour is not part of the row\'s name', { skip }, async () => {
	const r = await measure('<ul role="listbox" style="position:absolute;left:424px;top:300px;width:592px;margin:0;padding:4px;list-style:none;border:1px solid #1b1c1d;background:#fff"><li role="option" style="display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 14px;background:#f0f1f3">Hanna Bos<span style="height:18px;padding:0 8px;border-radius:9px;background:#f0f1f3;font-size:12px">Persoon</span></li><li role="option" style="display:flex;align-items:center;height:48px;padding:0 14px">Hanneke de Boer</li></ul>')
	assert.equal(r.elements.find((e) => e.kind === 'row' && /^Hanna /.test(e.label)).label, 'Hanna Bos')
	// Control: a chip whose only text sits in such a span keeps that text as its name.
	const chip = await measure('<button style="position:absolute;left:300px;top:300px;height:30px;border:0;border-radius:15px;background:#eceef1;padding:0"><span style="display:inline-block;height:24px;line-height:24px;padding:0 10px;border-radius:12px;background:#eceef1">Woo</span></button>')
	assert.equal(chip.elements[0].label, 'Woo')
})

test('a drawn checkbox whose svg glyph fills its box has no icon of its own, as a hidden input drawn by that glyph has none', { skip }, async () => {
	const board = await measure('<label style="position:absolute;left:315px;top:300px;display:inline-flex;gap:8px"><span role="checkbox" aria-checked="false" style="display:inline-flex"><svg width="20" height="20"><rect x="2" y="2" width="16" height="16" fill="none" stroke="#000"/></svg></span>Ook wie de zaak las</label>')
	const live = await measure('<span class="checkbox-radio-switch" style="position:absolute;left:315px;top:300px"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="position:absolute;opacity:0;width:1px;height:1px"><span class="checkbox-content__icon"><svg width="20" height="20"><rect x="2" y="2" width="16" height="16" fill="none" stroke="#000"/></svg></span><span>Ook wie de zaak las</span></label></span>')
	const icon = (r) => r.elements.find((e) => e.kind === 'toggle').props.icon
	assert.deepEqual([icon(board), icon(live)], [false, false])
	// Control: a switch with a separate glyph inside its track (smaller than the box) still has an icon.
	const sw = await measure('<button role="switch" aria-checked="true" aria-label="Melden" style="position:absolute;left:300px;top:400px;width:44px;height:24px;border:0;border-radius:12px;background:#3669a5;padding:0"><svg width="12" height="12"><path d="M1 6l3 3 7-7"/></svg></button>')
	assert.equal(icon(sw), true)
})

test('a switch inside a transparent hit-area border is cropped at its drawn track', { skip }, async () => {
	const sw = (style) => `<button role="switch" aria-checked="true" aria-label="Melden vanaf een aantal" style="position:absolute;left:300px;top:300px;${style}"></button>`
	const board = await measure(sw('width:38px;height:22px;border:6px solid transparent;background-color:#3669a5;background-clip:padding-box;box-sizing:content-box;padding:0;border-radius:17px'))
	assert.deepEqual(board.elements[0].rect, { x: 306, y: 306, w: 38, h: 22 })
	// Control: painted under its border, the switch is the whole 50x34 box.
	const painted = await measure(sw('width:38px;height:22px;border:6px solid transparent;background:#3669a5;box-sizing:content-box;padding:0;border-radius:17px'))
	assert.deepEqual(painted.elements[0].rect, { x: 300, y: 300, w: 50, h: 34 })
})

test('a checkbox or switch drawn beside its hidden input below the captured frame is marked below it, as other elements are', { skip }, async () => {
	const sw = (top) => `<span class="checkbox-radio-switch" style="position:absolute;left:495px;top:${top}px"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="position:absolute;opacity:0;width:1px;height:1px"><span class="checkbox-content__icon" style="display:inline-block;width:38px;height:22px;border-radius:11px;background:#3669a5"></span><span>Stuur me elke dag een overzicht</span></label></span>`
	const below = await measure(`<div style="height:1600px"></div>${sw(1289)}`)
	assert.equal(below.elements.find((e) => e.kind === 'toggle').belowFrame, true)
	// Control: in the frame it is not.
	const inFrame = await measure(sw(400))
	assert.equal(inFrame.elements.find((e) => e.kind === 'toggle').belowFrame, undefined)
})

test('a wrapped bar whose lines are rows of their own (CnActionsBar: lens chips, Filter + view switch, search) is one toolbar', { skip }, async () => {
	const chipEl = (t) => `<button style="height:38px;border-radius:19px;border:1px solid #888;padding:0 14px">${t}</button>`
	const r = await measure(`<div class="cn-actions-bar" style="position:absolute;left:292px;top:248px;width:1120px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">
		<div style="display:contents">
			<div style="display:flex;flex-wrap:wrap;gap:8px;flex:0 0 950px">${chipEl('Pieter Jansen')}${chipEl('Hanna Bos')}${chipEl('Anouk Bakker')}${chipEl('Fatma Yildiz')}${chipEl('Thomas Kuiper')}${chipEl('Tim Mulder')}</div>
			<div style="display:flex;gap:8px;margin-left:auto;width:292px"><button style="height:36px;border:1px solid #828a95;border-radius:8px">Filter</button><div style="display:flex"><button aria-label="Lijst" style="height:36px;width:40px;border:1px solid #828a95;border-radius:8px"></button><button aria-label="Kaarten" style="height:36px;width:40px;border:1px solid #828a95;border-radius:8px"></button></div></div>
		</div>
		<div style="display:flex;flex:0 0 100%;margin-top:12px"><input type="search" aria-label="Zoeken" style="height:40px;width:360px;box-sizing:border-box"></div>
	</div>`)
	const bars = r.components.filter((c) => c.role === 'toolbar')
	assert.equal(bars.length, 1, JSON.stringify(bars.map((b) => b.rect)))
	assert.equal(bars[0].rect.y, 248)
	// Control: a stack of lines that each hold one control (a row with an Acties button, a row with a search field) stays no toolbar.
	const stack = await measure('<div style="position:absolute;left:292px;top:187px;width:1120px;display:flex;flex-wrap:wrap;gap:20px"><div style="display:flex;flex:0 0 100%"><button style="height:40px;border:1px solid #888;border-radius:8px">Acties</button><span>3 geselecteerd</span></div><div style="display:flex;flex:0 0 360px"><input type="search" aria-label="Zoeken" style="height:40px;width:360px;box-sizing:border-box"></div></div>')
	assert.deepEqual(stack.components.filter((c) => c.role === 'toolbar'), [])
})

test('a card alone in the last row of a card grid is a record card, as its siblings are', { skip }, async () => {
	const card = (t) => `<article style="width:240px;box-sizing:border-box;border:1px solid #e4e6ea;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;flex-direction:column;gap:10px"><a href="#" style="font-size:17px;font-weight:700;color:#1b1c1d;text-decoration:none">${t}</a><span style="font-size:14px;color:#5e6168">2026-4871 · Woo-verzoek</span></div><div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #eef0f3;font-size:14px"><span>—</span><span>22 nov</span></div></article>`
	const r = await measure(`<div style="position:absolute;left:292px;top:200px;width:760px;display:grid;grid-template-columns:repeat(3, 240px);gap:16px">${['Afvalinzameling', 'Losliggende tegels', 'Lakken offerte', 'Kosten nieuw zwembad'].map(card).join('')}</div>`)
	const last = r.components.find((c) => c.title === 'Kosten nieuw zwembad')
	const first = r.components.find((c) => c.title === 'Afvalinzameling')
	assert.deepEqual([last.header.rowHeight, last.header.separator, last.content.gapBelowTitle], [first.header.rowHeight, first.header.separator, first.content.gapBelowTitle])
	assert.ok(last.header.rowHeight <= 21, String(last.header.rowHeight))
	// Control: a column of widgets (no two side by side) keeps the line under each title as its description.
	const col = await measure(`<div style="position:absolute;left:292px;top:200px;width:240px;display:flex;flex-direction:column;gap:16px">${['Een', 'Twee', 'Drie'].map(card).join('')}</div>`)
	assert.ok(col.components.find((c) => c.title === 'Een').header.rowHeight > 40)
})

test('a switch or radio drawn by a plain box beside its hidden input is measured on that box', { skip }, async () => {
	const r = await measure(`<div style="position:absolute;left:315px;top:300px;display:flex;flex-direction:column;gap:12px">
		<label style="display:flex;gap:12px;align-items:flex-start"><input type="checkbox" role="switch" checked style="position:absolute;opacity:0;width:1px;height:1px"><span aria-hidden="true" style="flex:none;display:inline-flex;align-items:center;width:38px;height:22px;border-radius:11px;background:#3669a5;justify-content:flex-end"><span style="width:18px;height:18px;border-radius:9px;background:#fff;margin:0 2px"></span></span><span>Mail op zaaknummer aan zaken koppelen</span></label>
		<label style="display:flex;gap:10px;align-items:flex-start"><span aria-hidden="true" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;box-sizing:border-box;border-radius:10px;border:2px solid #3669a5"><span style="width:10px;height:10px;border-radius:5px;background:#3669a5"></span></span><input type="radio" name="r1" checked style="position:absolute;opacity:0;width:1px;height:1px"><span>Elke dag</span></label>
	</div>`)
	const toggles = r.elements.filter((e) => e.kind === 'toggle')
	assert.deepEqual(toggles.map((t) => [t.label, t.rect.w, t.rect.h]), [['Mail op zaaknummer aan zaken koppelen', 38, 22], ['Elke dag', 20, 20]])
	assert.deepEqual(r.unmeasured, [])
})

test('a tile that only draws an icon, a step marker or initials is an icon of its component, not an unmeasured box', { skip }, async () => {
	const check = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>'
	const r = await measure(`<section style="position:absolute;left:300px;top:200px;width:600px;border:1px solid #ccc;padding:20px">
		<h2 style="margin:0">Open zaken</h2>
		<span style="width:32px;height:32px;border-radius:16px;background:#eaf0f7;display:inline-flex;align-items:center;justify-content:center">${check}</span>
		<ol style="display:flex;gap:12px;list-style:none;padding:0"><li style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;border-radius:14px;background:#1e6b2a;display:flex;align-items:center;justify-content:center">${check}</span>Organisatie</li><li style="display:flex;gap:8px;align-items:center"><span style="width:20px;height:20px;box-sizing:border-box;border-radius:10px;border:2px solid #3669a5"></span><strong>Stuur de waarschuwing</strong></li></ol>
		<span role="img" aria-label="Logo Zuiddrecht" style="width:56px;height:56px;border-radius:10px;background:#fcedec;display:flex;align-items:center;justify-content:center;font-weight:700">ZD</span>
	</section>`)
	assert.deepEqual(r.unmeasured, [])
	assert.deepEqual(r.icons.map((i) => [i.rect.w, i.text]), [[32, ''], [28, ''], [56, 'ZD']])
	// Control: a filled panel larger than a tile, with nothing in it, is still reported as not measured.
	const panel = await measure('<section style="position:absolute;left:300px;top:200px;width:600px;border:1px solid #ccc;padding:20px"><h2 style="margin:0">Kaart</h2><div style="width:120px;height:80px;background:#eaf0f7"></div></section>')
	assert.equal(panel.unmeasured.length, 1)
})

test('a small fixed button floating over the page (the AI chat button) is reported as a floater; a fixed header is not', { skip }, async () => {
	const fab = '<button aria-label="Open AI chat" style="position:fixed;right:44px;bottom:30px;width:56px;height:60px;border:0;background:#234a78"><span style="position:fixed;right:50px;bottom:40px;width:30px;height:30px"></span></button>'
	const r = await measure(`<header style="position:fixed;left:0;top:0;width:1440px;height:50px;background:#00679e"></header>${fab}`)
	assert.deepEqual(r.floaters, [{ x: 1340, y: 810, w: 56, h: 60 }])
	// Inside a fixed app content box (Nextcloud's #content), the button still floats over what scrolls in it.
	const inApp = await measure(`<div style="position:fixed;left:0;top:68px;width:1440px;height:832px">${fab}</div>`)
	assert.deepEqual(inApp.floaters, [{ x: 1340, y: 810, w: 56, h: 60 }])
})

test('the text a textarea holds is not a part of its card\'s structure: it has no line box of its own', { skip }, async () => {
	const card = (body) => `<section style="border:1px solid #ccc;padding:20px;display:flex;flex-direction:column;gap:10px"><h2 style="margin:0;font-size:17px">Gesprek met de inwoner</h2><span style="font-size:13px">Inkomend · 3 okt, 14:10</span>${body}</section>`
	const r = await measure(`<div style="position:absolute;left:300px;top:100px;width:800px;display:flex;flex-direction:column;gap:20px">${card('<textarea rows="2">U hoort binnen vijf dagen van ons, vandaag nog.</textarea>')}${card('')}${card('')}</div>`)
	const first = r.components.find((c) => c.role === 'card')
	assert.ok(first.structure.startsWith('title'), first.structure)
	// Control: the dated line under the title is still read as a deadline.
	assert.ok(/^title \/ deadline/.test(first.structure), first.structure)
})

test('a non-modal dialog card outside an open modal dialog is not measured, as nothing else outside it is', { skip }, async () => {
	const card = '<div role="dialog" aria-modal="false" style="position:fixed;left:1016px;top:102px;width:400px;height:265px;background:#fff;border:1px solid #e4e6ea;border-radius:12px;z-index:3000"><h2 style="margin:16px">Inkomend gesprek</h2>' + btn('Kies contact') + '</div>'
	const modal = `<div role="dialog" aria-modal="true" style="position:fixed;inset:0;background:rgba(0,0,0,.45)"><div style="position:absolute;left:520px;top:190px;width:400px;background:#fff;border-radius:8px;padding:12px"><h2>Gespreksuitkomst</h2><textarea></textarea>${btn('Opslaan en sluiten')}</div></div>`
	const r = await measure(card + modal)
	assert.deepEqual(r.components.filter((c) => /dialog/.test(c.role)).map((c) => c.title), ['Gespreksuitkomst'])
	// Control: with no modal open, the incoming-call card is measured as a dialog.
	const alone = await measure(card)
	assert.deepEqual(alone.components.filter((c) => /dialog/.test(c.role)).map((c) => c.title), ['Inkomend gesprek'])
})

test('a switch track drawn beside its hidden input is the switch, not the ground of its option', { skip }, async () => {
	const sw = (track) => `<label style="position:absolute;left:315px;top:300px;display:flex;gap:12px;align-items:flex-start"><input type="checkbox" role="switch" checked style="position:absolute;opacity:0;width:1px;height:1px">${track}<span>Mail op zaaknummer aan zaken koppelen</span></label>`
	const board = await measure(sw('<span aria-hidden="true" style="flex:none;display:inline-flex;align-items:center;width:38px;height:22px;border-radius:11px;background:#3669a5;justify-content:flex-end"><span style="width:18px;height:18px;border-radius:9px;background:#fff;margin:0 2px"></span></span>'))
	const live = await measure(`<span class="checkbox-radio-switch">${sw('<span class="checkbox-content__icon"><svg width="38" height="22" viewBox="0 0 38 22"><rect width="38" height="22" rx="11" fill="#3669a5"/></svg></span>')}</span>`)
	const tog = (r) => r.elements.find((e) => e.kind === 'toggle')
	assert.deepEqual([tog(board).props.optionGround, tog(live).props.optionGround], [undefined, undefined])
	assert.equal(compareElement(tog(board), tog(live)).filter((x) => x.flag).length, 0, JSON.stringify(compareElement(tog(board), tog(live)).filter((x) => x.flag)))
	// Control: a filled option beside a checked hidden radio, with the option's text, is still its ground.
	const chosen = await measure('<span class="checkbox-radio-switch" style="position:absolute;left:464px;top:280px;display:flex"><input type="radio" checked style="position:absolute;opacity:0;width:1px;height:1px"><span style="display:flex;gap:10px;align-items:center;min-height:34px;padding:0 9px 0 7px;border-radius:8px;background:#dce6f2"><svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="#3669a5"/></svg>Behandeling van de zaak</span></span>')
	assert.equal(tog(chosen).props.optionGround, 'rgb(220, 230, 242)')
})

test('a toggle drawn by an svg glyph has no corner radius to read: its shape is the glyph\'s', { skip }, async () => {
	const radio = (icon) => `<label style="position:absolute;left:315px;top:300px;display:flex;gap:10px;align-items:flex-start"><input type="radio" name="m" checked style="position:absolute;opacity:0;width:1px;height:1px">${icon}<span>Eenvoudig</span></label>`
	const board = await measure(radio('<span aria-hidden="true" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;box-sizing:border-box;border-radius:10px;border:2px solid #3669a5"><span style="width:10px;height:10px;border-radius:5px;background:#3669a5"></span></span>'))
	const live = await measure(`<span class="checkbox-radio-switch">${radio('<span class="checkbox-content__icon"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="#3669a5" d="M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg></span>')}</span>`)
	const tog = (r) => r.elements.find((e) => e.kind === 'toggle')
	assert.equal(tog(live).props.borderRadius, null)
	assert.equal(compareElement(tog(board), tog(live)).find((x) => x.prop === 'borderRadius'), undefined)
	// Control: the radio a board draws as a rounded box keeps that box's radius.
	assert.equal(tog(board).props.borderRadius, 10)
})

test('a checkbox drawn by its svg glyph is filled with the glyph\'s colour, not the ground behind it', { skip }, async () => {
	const glyph = (fill, d) => `<span role="checkbox" aria-checked="true" aria-label="Een zaak wordt aan mij toegewezen" style="display:inline-flex"><svg width="20" height="20" viewBox="0 0 24 24" style="fill:${fill}"><path d="${d}"/></svg></span>`
	const checked = 'M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z'
	const board = await measure(`<table style="position:absolute;left:600px;top:300px;background:#fff"><tr><td>Een zaak wordt aan mij toegewezen</td><td>${glyph('#3669a5', checked)}</td></tr></table>`)
	const live = await measure('<table style="position:absolute;left:600px;top:300px;background:#fff"><tr><td>Een zaak wordt aan mij toegewezen</td><td><input type="checkbox" checked aria-label="Een zaak wordt aan mij toegewezen" style="appearance:none;margin:0;width:24px;height:20px;padding:0 12px;box-sizing:border-box;border-radius:8px;background:#3669a5"></td></tr></table>')
	const tog = (r) => r.elements.find((e) => e.kind === 'toggle')
	assert.deepEqual([tog(board).props.background, tog(board).props.borderRadius], ['rgb(54, 105, 165)', null])
	assert.equal(compareElement(tog(board), tog(live)).filter((x) => x.flag).length, 0, JSON.stringify(compareElement(tog(board), tog(live)).filter((x) => x.flag)))
	// Control: a drawn checkbox that paints its own box (a filled, rounded span) is measured on that box.
	const box = await measure('<div style="position:absolute;left:600px;top:300px;background:#fff"><span role="checkbox" aria-checked="true" aria-label="Per e-mail" style="display:inline-block;width:20px;height:20px;border-radius:4px;background:#5e6168"></span></div>')
	assert.deepEqual([tog(box).props.background, tog(box).props.borderRadius], ['rgb(94, 97, 104)', 4])
})

test('a focus outline around a field is not its frame: the field is measured on its own box and line', { skip }, async () => {
	const page = (style) => `<style>#f:focus-visible{${style}} .vs__dropdown-toggle:focus-within{outline:2px solid #1b1c1d}</style><div style="position:absolute;left:424px;top:200px;width:592px;display:flex;flex-direction:column;gap:6px"><label for="f">Nieuw team</label><div class="v-select"><div class="vs__dropdown-toggle" style="display:flex;width:592px"><input id="f" style="flex:1;box-sizing:border-box;height:40px;border:1px solid #3669a5;border-radius:8px"></div></div></div><script>document.getElementById('f').focus()</script>`
	const live = await measure(page('outline:2px solid #1b1c1d !important;outline-offset:2px'))
	const f = live.elements.find((e) => e.kind === 'field').props
	assert.deepEqual([f.h, f.border, f.borderColor, f.innerBorder], [40, 1, 'rgb(54, 105, 165)', 0])
	// Control: a 2px line the field draws on a wrapper when focused is still its frame.
	const ring = await measure('<div style="position:absolute;left:424px;top:300px;width:400px;border:2px solid #3669a5;border-radius:10px"><input aria-label="Delen met" style="display:block;width:396px;box-sizing:border-box;height:40px;border:1px solid #828a95;border-radius:8px"></div><script>document.querySelector("input").focus()</script>')
	assert.deepEqual([ring.elements[0].props.h, ring.elements[0].props.border], [44, 2])
})

test('a keyboard focus ring drawn as a box shadow on a focused button is not its border', { skip }, async () => {
	const page = (focus) => `<style>.close:focus-visible{box-shadow:0 0 0 6px rgba(54, 105, 165, 0.5)} .ring{box-shadow:0 0 0 6px rgba(54, 105, 165, 0.5)}</style><div role="dialog" style="position:absolute;left:600px;top:200px;width:400px;height:300px;background:#fff"><button class="close${focus ? '' : ' ring'}" aria-label="Sluiten" style="position:absolute;right:8px;top:8px;width:36px;height:36px;border:0;border-radius:18px;background:#fff"><svg width="20" height="20"><path d="M2 2l16 16M18 2L2 18" stroke="#000"/></svg></button></div>${focus ? '<script>document.querySelector(".close").focus()</script>' : ''}`
	const focused = await measure(page(true))
	assert.equal(focused.elements.find((e) => e.label === 'Sluiten').props.border, 0)
	// Control: the same ring drawn without focus is the button's border.
	const drawn = await measure(page(false))
	assert.equal(drawn.elements.find((e) => e.label === 'Sluiten').props.border, 6)
})

test('a drawn map placeholder and the parcel drawn on it are the map, not unmeasured boxes', { skip }, async () => {
	const map = (label) => `<div style="position:absolute;left:384px;top:277px;width:460px"><div role="img" aria-label="${label}" style="position:relative;height:200px;border-radius:8px;background:#dfe8d8;overflow:hidden"><span style="position:absolute;left:0;right:0;top:90px;height:14px;background:#fff"></span><span style="position:absolute;left:120px;top:30px;width:110px;height:56px;border:2px dashed #4a3f8f;background:rgba(74,63,143,0.12)"></span></div></div>`
	const r = await measure(map('Kaart met het perceel Molenweg 4 en een pin'))
	assert.equal(r.components.filter((c) => c.role === 'map').length, 1)
	assert.deepEqual(r.unmeasured, [])
	// Control: the same boxes in a picture that is not a map are still reported.
	const other = await measure(map('Plattegrond van de verdieping'))
	assert.ok(other.unmeasured.length >= 1, JSON.stringify(other.unmeasured))
})

test('a selected row beside an unselected one is not the unselected row\'s option ground', { skip }, async () => {
	const row = (checked) => `<tr style="background:${checked ? '#f4f7fb' : '#fff'}"><td style="padding:12px 6px 12px 18px"><input type="checkbox" aria-label="Rij selecteren"${checked ? ' checked' : ''} style="width:18px;height:18px;margin:0"></td><td style="padding:12px">Losse stoeptegels</td></tr>`
	const r = await measure(`<table style="position:absolute;left:292px;top:300px;width:1000px;border-collapse:collapse;background:#fff"><tbody>${row(true)}${row(false)}${row(false)}</tbody></table>`)
	const grounds = r.elements.filter((e) => e.kind === 'toggle').map((e) => e.props.optionGround || null)
	assert.deepEqual(grounds.slice(1), [null, null])
	// Control: the selected row's own tint is its toggle's ground.
	assert.equal(grounds[0], 'rgb(244, 247, 251)')
})
