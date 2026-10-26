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
		<h2 style="margin:0;font-size:17px">Configuratie</h2><p style="margin:0;font-size:14px">In welk register Dossiq zaken bewaart.</p>${field}</section>`)
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
	// A plain line of smaller text right under the title is still the description.
	const r = await measure(`<section style="position:absolute;left:300px;top:200px;width:400px;border:1px solid #ddd;padding:20px 22px;display:flex;flex-direction:column;gap:6px">
		<div><h2 style="margin:0;font-size:17px">Kaart</h2></div><p style="margin:0;font-size:14px">Wie wat mag bij dit zaaktype</p><div style="margin-top:20px">Inhoud</div></section>`)
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
