// node --test scripts/screens/compdiff/freshness.test.mjs
// A flattened board is stale when flattening its source again gives another document; times do not decide it (a rebuild
// that writes identical output commits nothing, so the preview's last commit can be older than its source's).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { boardFreshness } from './freshness.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const board = (key) => path.join(ROOT, 'preview', 'screens', 'boards', `${key}.html`)
const checker = (...args) => JSON.parse(execFileSync('python3', [path.join(ROOT, 'scripts', 'screens', 'board_fresh.py'), ...args], { encoding: 'utf8' }))

test('a preview whose source was committed later but which flattens to the same document is fresh', () => {
	// DqTaak.html last changed in e449a9fc; DqTaak.dc.html in a later merge; a rebuild writes the same bytes.
	assert.equal(boardFreshness(board('DqTaak'), ROOT).state, 'fresh')
})

test('a preview that differs from what its source flattens to is stale', () => {
	const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-')), 'DqTaak.html')
	fs.writeFileSync(tmp, fs.readFileSync(board('DqTaak'), 'utf8').replace('</body>', '<p>oud</p></body>'))
	assert.deepEqual(checker('DqTaak', '--preview', tmp), { DqTaak: 'stale' })
})

test('a board the index does not know is unknown, not stale', () => {
	assert.deepEqual(checker('GeenBord'), { GeenBord: 'unknown' })
})

test('a check that cannot run is reported as unchecked, never as stale', () => {
	assert.equal(boardFreshness(board('DqTaak'), ROOT, () => { throw new Error('python3: not found') }).state, 'unchecked')
	assert.equal(boardFreshness('/elders/boards/DqTaak.html', '/elders').state, 'unchecked')
	assert.equal(boardFreshness(board('DqTaak'), ROOT, () => 'stale').state, 'stale')
})
