// node --test scripts/screens/compdiff/crop.test.mjs
// The crop comparison reads text set a fraction of a pixel apart as the same and a different shape as different
// (r32: DqCatalogus table heads read 33% different from a 1.5px offset; DqZaakDoel's filled radio row stays flagged).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { covered, cropFlag, cropMismatch, pixelsFlag, wholePixels } from './crop.mjs'

const W = 20, H = 10
const image = (paint) => {
	const d = new Array(W * H * 4).fill(250)
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (paint(x, y)) { const p = (y * W + x) * 4; d[p] = d[p + 1] = d[p + 2] = 90 }
	return d
}
const stem = (x0, y0) => image((x, y) => x >= x0 && x < x0 + 2 && y >= y0 && y < y0 + 6)

test('a glyph stem one pixel lower reads the same', () => {
	assert.ok(cropMismatch(stem(5, 2), stem(5, 3), W, H, 0) > 0)
	assert.equal(cropMismatch(stem(5, 2), stem(5, 3), W, H), 0)
})

test('a filled box against an empty one reads different', () => {
	const filled = image(() => true)
	assert.equal(cropMismatch(filled, image(() => false), W, H), 100)
})

test('a rect is cut at whole pixels', () => {
	assert.deepEqual(wholePixels({ x: 328.4, y: 273.5, w: 88.2, h: 17 }), { x: 328, y: 274, w: 88, h: 17 })
})

test('a small element or a rescaled crop needs a larger share to flag: a half pixel or a glyph metric is a third of it', () => {
	assert.equal(cropFlag({ w: 18, h: 18 }, { w: 18, h: 18 }, 30), 45)
	assert.equal(cropFlag({ w: 58, h: 15 }, { w: 58, h: 15 }, 30), 45)
	assert.equal(cropFlag({ w: 153.7, h: 34 }, { w: 149.7, h: 34 }, 30), 40)
	assert.equal(cropFlag({ w: 150, h: 34 }, { w: 150.5, h: 34 }, 30), 30)
	// A different width beyond the tolerance is a property row's business; the crop keeps its own threshold.
	assert.equal(cropFlag({ w: 150, h: 34 }, { w: 170, h: 34 }, 30), 30)
})

test('a column head\'s sort button is not flagged by its crop alone: label and chevron sit apart, its props are read', () => {
	const e = (inHead) => ({ rect: { w: 120, h: 34 }, ...(inHead ? { inHead } : {}) })
	assert.equal(pixelsFlag(e(true), e(true), 34, 30), false)
	assert.equal(pixelsFlag(e(false), e(false), 34, 30), true)
	assert.equal(pixelsFlag(e(false), e(false), null, 30), false)
})

test('a crop an open menu lies over part of is not flagged; an element inside the menu still is', () => {
	const menu = { x: 1100, y: 560, w: 260, h: 200 }
	const pill = { rect: { x: 1050, y: 580, w: 90, h: 24 } }
	assert.equal(covered(pill.rect, [menu]), true)
	assert.equal(pixelsFlag(pill, pill, 52.4, 30, { board: [menu], live: [] }), false)
	const item = { rect: { x: 1110, y: 600, w: 200, h: 40 } }
	assert.equal(covered(item.rect, [menu]), false)
	assert.equal(pixelsFlag(item, item, 52.4, 30, { board: [menu], live: [] }), true)
})
