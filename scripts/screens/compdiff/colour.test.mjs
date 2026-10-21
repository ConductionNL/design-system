// node --test scripts/screens/compdiff/colour.test.mjs
// The colour parser reads every form getComputedStyle returns. Before it, `color(srgb ...)` (what a color-mix() in
// srgb computes to) read as no colour: the extractor walked past the element to the white card behind it, and
// compdiff reported a #fafbfc table header as white on 19 boards.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { parseColour } from './colour.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const near = (actual, expected, tolerance = 1) => {
	assert.ok(actual, `parsed nothing, expected ${expected}`)
	expected.forEach((v, i) => assert.ok(Math.abs(actual[i] - v) <= (i < 3 ? tolerance : 0.001), `channel ${i}: ${actual[i]} vs ${v} (${actual})`))
}

test('legacy rgb() and rgba(), comma and space syntax', () => {
	assert.deepEqual(parseColour('rgb(250, 251, 252)'), [250, 251, 252, 1])
	assert.deepEqual(parseColour('rgba(0, 0, 0, 0)'), [0, 0, 0, 0])
	assert.deepEqual(parseColour('rgba(255, 255, 255, 0.8)'), [255, 255, 255, 0.8])
	assert.deepEqual(parseColour('rgb(10 20 30 / 50%)'), [10, 20, 30, 0.5])
	assert.deepEqual(parseColour('rgb(100% 0% 0%)'), [255, 0, 0, 1])
})

test('color(srgb ...) from a color-mix(), with and without alpha', () => {
	near(parseColour('color(srgb 0.976471 0.978039 0.981176)'), [249, 249.4, 250.2, 1], 0.1)
	near(parseColour('color(srgb 0.304706 0.306078 0.307451 / 0.5)'), [77.7, 78.05, 78.4, 0.5], 0.1)
	near(parseColour('color(srgb 1 1 1 / 0)'), [255, 255, 255, 0])
})

test('the other predefined spaces', () => {
	near(parseColour('color(srgb-linear 1 0 0)'), [255, 0, 0, 1])
	near(parseColour('color(srgb-linear 0.214 0.214 0.214)'), [128, 128, 128, 1])
	near(parseColour('color(display-p3 1 1 1)'), [255, 255, 255, 1])
	near(parseColour('color(display-p3 0.5 0.5 0.5)'), [128, 128, 128, 1])
	near(parseColour('color(rec2020 1 1 1)'), [255, 255, 255, 1])
	near(parseColour('color(xyz-d65 0.9505 1 1.089)'), [255, 255, 255, 1])
	near(parseColour('color(xyz-d50 0.9642 1 0.8251)'), [255, 255, 255, 1])
	assert.equal(parseColour('color(prophoto-rgb 1 1 1)'), null)
})

test('oklab, oklch, lab and lch', () => {
	near(parseColour('oklab(1 0 0)'), [255, 255, 255, 1])
	near(parseColour('oklab(0 0 0)'), [0, 0, 0, 1])
	near(parseColour('oklch(0.6 0.15 250)'), [39, 132, 213, 1], 2)
	near(parseColour('oklch(62.8% 0.2577 29.23)'), [255, 0, 0, 1], 2)
	near(parseColour('oklch(0.5 0 none / 0.25)'), [99, 99, 99, 0.25], 1)
	near(parseColour('lab(50 0 0)'), [119, 119, 119, 1])
	near(parseColour('lch(100 0 0)'), [255, 255, 255, 1])
	near(parseColour('lab(54.29 80.8 69.89)'), [255, 0, 0, 1], 2)
})

test('hex, hsl, hwb and transparent', () => {
	assert.deepEqual(parseColour('#fafbfc'), [250, 251, 252, 1])
	assert.deepEqual(parseColour('#fff'), [255, 255, 255, 1])
	near(parseColour('#00000080'), [0, 0, 0, 0.502])
	assert.deepEqual(parseColour('transparent'), [0, 0, 0, 0])
	near(parseColour('hsl(0 100% 50%)'), [255, 0, 0, 1])
	near(parseColour('hsla(120, 100%, 25%, 0.5)'), [0, 128, 0, 0.5])
	near(parseColour('hwb(0 0% 0%)'), [255, 0, 0, 1])
	near(parseColour('hwb(0 60% 60%)'), [128, 128, 128, 1])
})

test('anything else is no colour, never a guess', () => {
	for (const c of ['', null, undefined, 'none', 'currentcolor', 'foo(1 2 3)', 'rgb(1 2)', 'color(srgb 1 1)', '#12345', 'color(srgb 1 2 3 / 4 / 5)']) {
		assert.equal(parseColour(c), null, String(c))
	}
})

test('runs as injected source, with nothing from its module (the extractor calls it in the page)', () => {
	const sandbox = {}
	vm.runInNewContext(`${parseColour.toString()}\nresult = parseColour('color(srgb 1 0 0 / 0.5)')`, sandbox)
	near(sandbox.result, [255, 0, 0, 0.5])
})

test('the extractor reads a color-mix() ground through the parser', () => {
	const extract = fs.readFileSync(path.join(HERE, 'extract.js'), 'utf8')
	assert.match(extract, /const rgba = parseColour/)
	assert.doesNotMatch(extract, /match\(\/rgba\?/)
	const compdiff = fs.readFileSync(path.join(HERE, 'compdiff.mjs'), 'utf8')
	assert.match(compdiff, /const EXTRACT = `\$\{parseColour\.toString\(\)\}/)
})
