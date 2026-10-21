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
})
