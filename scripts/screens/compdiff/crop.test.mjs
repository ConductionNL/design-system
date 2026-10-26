// node --test scripts/screens/compdiff/crop.test.mjs
// The crop comparison reads text set a fraction of a pixel apart as the same and a different shape as different
// (r32: DqCatalogus table heads read 33% different from a 1.5px offset; DqZaakDoel's filled radio row stays flagged).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cropMismatch, wholePixels } from './crop.mjs'

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
