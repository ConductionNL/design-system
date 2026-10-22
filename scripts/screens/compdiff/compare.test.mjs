// node --test scripts/screens/compdiff/compare.test.mjs
// The pairing and comparison rules on hand-made measurements: every card of a deck pairs, and a border colour is only
// compared where both sides draw that border.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareElement, compareProps, pairComponents, pairElements } from './compare.mjs'

const card = (title, y, record) => ({ role: 'card', title, rect: { x: 292, y, w: 800, h: 100 }, depth: 0, header: { fontSize: 18 }, ...(record ? { record } : {}) })

test('every card of a deck pairs, not only the first', () => {
	// The board draws the case page's main column as a deck of same-width siblings; live wraps each card on its own.
	const titles = ['Het verzoek', 'Zaakgegevens', 'Zaakplan', 'Termijn en betaling', 'Flows']
	const board = titles.map((t, i) => card(t, 400 + i * 120, { deck: 1, index: i, count: titles.length }))
	const live = titles.map((t, i) => card(t, 410 + i * 120))
	const { pairs, missing, extra } = pairComponents(board, live, 1400)
	assert.equal(pairs.length, 5)
	assert.deepEqual(extra, [])
	assert.deepEqual(missing, [])
})

test('cards past the first of a deck that find no counterpart are data, not missing or extra', () => {
	const deck = (n, y0, d) => Array.from({ length: n }, (_, i) => card(null, y0 + i * 110, { deck: d, index: i, count: n }))
	const { pairs, missing, extra } = pairComponents(deck(3, 300, 1), deck(6, 300, 1), 1400)
	assert.equal(pairs.length, 3)
	assert.deepEqual(missing, [])
	assert.deepEqual(extra, [])
})

test('a border colour on a zero-width border is not flagged', () => {
	const tb = (border, color) => ({ role: 'toolbar', title: 'toolbar', rect: { x: 0, y: 0, w: 800, h: 40 }, controlBorder: border, controlBorderColor: color })
	const rows = compareProps(tb(0, 'rgb(27, 28, 29)'), tb(1, 'rgb(228, 230, 234)'))
	assert.equal(rows.find((r) => r.prop === 'controlBorderColor').flag, null)
	assert.equal(rows.find((r) => r.prop === 'controlBorder').flag, 'border extra on live')
	const both = compareProps(tb(1, 'rgb(130, 138, 149)'), tb(1, 'rgb(228, 230, 234)'))
	assert.equal(both.find((r) => r.prop === 'controlBorderColor').flag, 'color')
	const c = (top, color) => ({ ...card('A', 0), props: { border: { top, right: top, bottom: top, left: top }, borderColor: color } })
	assert.equal(compareProps(c(0, 'rgb(0, 0, 0)'), c(0, 'rgb(255, 0, 0)')).find((r) => r.prop === 'props.borderColor').flag, null)
	assert.equal(compareProps(c(1, 'rgb(0, 0, 0)'), c(1, 'rgb(255, 0, 0)')).find((r) => r.prop === 'props.borderColor').flag, 'color')
})

test('a button in a deck card pairs by label with the same button outside a deck', () => {
	const el = (inControl) => ({ kind: 'button', label: 'Bewerken', inControl, container: 1, rect: { x: 900, y: 600, w: 90, h: 34 }, props: { h: 34 } })
	const { pairs } = pairElements([el('record card')], [el(null)], 1400)
	assert.equal(pairs.length, 1)
	assert.equal(pairs[0].by, 'label')
})

test('a pill paired with a button is told apart by radius and height, not by its kind as well', () => {
	const el = (kind, h, borderRadius) => ({ kind, props: { h, borderRadius, border: 0, background: 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)', fontSize: 14, fontWeight: 400, paddingLeft: 0, paddingRight: 0, icon: true, text: false, badge: false, gapNext: null } })
	const rows = compareElement(el('pill', 36, 18), el('button', 34, 8))
	assert.equal(rows.find((r) => r.prop === 'kind').flag, null)
	assert.equal(rows.find((r) => r.prop === 'borderRadius').flag, 'shape')
})

test('cards with different titles, or a titled and an untitled card far apart, do not pair by position', () => {
	const card = (title, y, h, x = 424, w = 592) => ({ role: 'dialog-card', title, rect: { x, y, w, h } })
	const grey = pairComponents([card(undefined, 1000, 59)], [card('Beoordeel eerst deze documenten.', 567, 208)], 1500)
	assert.equal(grey.pairs.length, 0)
	const choice = pairComponents([card('Daarna alleen lezen', 824, 95)], [card('Bewaring volgens het zaaktype', 770, 672, 440, 560)], 1500)
	assert.equal(choice.pairs.length, 0)
	const near = pairComponents([card(undefined, 300, 120)], [card('Zaakgegevens', 340, 160)], 1500)
	assert.equal(near.pairs.length, 1)
	const column = pairComponents([card('In behandeling19', 420, 772, 576, 268)], [card('Beoordeling ontvankelijkheid1', 468.5, 234, 576, 268)], 1500)
	assert.equal(column.pairs.length, 1)
})

test('a lone pager pairs with the lone pager, wherever the list above it ends', () => {
	const pager = (y) => ({ role: 'pager', title: 'pager', rect: { x: 293, y, w: 1118, h: 61 } })
	const r = pairComponents([pager(1084)], [pager(1646.5)], 1170)
	assert.equal(r.pairs.length, 1)
	assert.equal(r.missing.length + r.extra.length, 0)
})

test('page links pair in order inside the pager, and the page count is data', () => {
	const link = (label, x, inControl = 'pager') => ({ kind: 'button', label, inControl, container: 1, rect: { x, y: 1000, w: 36, h: 36 }, props: { h: 36, borderRadius: 8, background: 'rgb(255, 255, 255)', border: 1, fontSize: 14 } })
	const r = pairElements([link('1', 1186), link('2', 1226), link('3', 1268)], [link('1', 1037), link('2', 1077), link('3', 1119), link('4', 1161), link('13', 1268), { ...link('Open AI chat', 1340, null), props: { h: 60, borderRadius: 0, background: 'rgb(255, 255, 255)', border: 0, fontSize: 14 } }], 1170)
	const pagerPairs = r.pairs.filter((p) => p.by === 'pager')
	assert.deepEqual(pagerPairs.map((p) => [p.board.label, p.live.label]), [['1', '1'], ['2', '2'], ['3', '3']])
	assert.ok(!r.pairs.some((p) => p.live.label === 'Open AI chat'))
	assert.ok(!(r.extra || []).some((e) => e.inControl === 'pager'))
})

const pill = (label, x, y, h, extra = {}) => ({ kind: 'pill', label, inControl: null, interactive: false, container: 1, rect: { x, y, w: 80, h }, props: { h, borderRadius: h / 2, background: 'rgb(234, 240, 247)', border: 0, fontSize: 13 }, ...extra })

test('a chip does not pair with a count nested in another chip, nor the reverse', () => {
	const chip = pairElements([pill('Alle typen', 292, 318, 38, { interactive: true })], [pill('142', 345, 389, 16, { inControl: 'Alles' })], 1200)
	assert.equal(chip.pairs.length, 0)
	const count = pairElements([pill('11', 380, 329, 16, { inControl: 'Alle typen' })], [pill('Mijn zaken', 292, 380, 38, { interactive: true })], 1200)
	assert.equal(count.pairs.length, 0)
})

test('a status tag does not pair with the "Volgen" button, and a filter count not with a filter chip', () => {
	const status = pairElements([pill('In behandeling', 397, 158, 21)], [pill('Volgen', 292, 169, 28, { interactive: true })], 1200)
	assert.equal(status.pairs.length, 0)
	const filter = pairElements([pill('2', 1199, 198, 20, { inControl: 'Filter' })], [pill('Opgeschort', 1071, 184, 38, { interactive: true })], 1200)
	assert.equal(filter.pairs.length, 0)
	const remove = pairElements([pill('Filter Type: Woo-verzoek verwijderen', 1175, 300, 22, { interactive: true })], [pill('1 actief', 1199, 332, 20, { inControl: 'Filter' })], 1200)
	assert.equal(remove.pairs.length, 0)
})

test('a tag that repeats on every card pairs with the nearest one of the same label', () => {
	const tag = (x, y) => pill('Woo-verzoek', x, y, 21, { inControl: 'record card' })
	const r = pairElements([tag(603, 527), tag(319, 684)], [tag(319, 763), tag(319, 937), tag(603, 781)], 1500)
	const byBoardX = Object.fromEntries(r.pairs.map((p) => [p.board.rect.x, p.live.rect.x]))
	assert.deepEqual(byBoardX, { 603: 603, 319: 319 })
})

test('a native toggle is not compared on background', () => {
	const tog = (background, native) => ({ kind: 'toggle', props: { h: 13, borderRadius: 0, border: 0, background, color: 'rgb(0, 0, 0)', fontSize: 13, fontWeight: 400, paddingLeft: 0, paddingRight: 0, icon: false, text: false, badge: false, gapNext: null, native } })
	const rows = compareElement(tog('rgb(255, 255, 255)', true), tog('rgb(229, 229, 229)', true))
	assert.equal(rows.find((r) => r.prop === 'background').flag, null)
})
