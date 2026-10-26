// node --test scripts/screens/compdiff/freshness.test.mjs
// A flattened board older than its source, or than a board it imports, is stale; one built with or after them is not.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { staleSources } from './freshness.mjs'

const git = (root, ...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' })
const commit = (root, when, msg) => {
	git(root, 'add', '-A')
	execFileSync('git', ['-C', root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', msg], { env: { ...process.env, GIT_COMMITTER_DATE: when, GIT_AUTHOR_DATE: when } })
}
const write = (root, rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text) }

function repo () {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'freshness-'))
	git(root, 'init', '-q')
	write(root, 'preview/screens/screens.json', JSON.stringify({ boards: { a: { file: 'boards/DqZaken.html', src: 'screens-src/zuiddrecht/DqZaken.dc.html' } } }))
	write(root, 'screens-src/zuiddrecht/DqZaken.dc.html', '<dc-import name="DqKop" app="Dossiq"></dc-import><main>v1</main>')
	write(root, 'screens-src/zuiddrecht/DqKop.dc.html', '<header>kop</header>')
	write(root, 'preview/screens/boards/DqZaken.html', '<main>v1</main>')
	commit(root, '2026-10-25T10:00:00Z', 'build')
	return root
}
const board = (root) => path.join(root, 'preview/screens/boards/DqZaken.html')

test('a board built in the same commit as its source is fresh', () => {
	const root = repo()
	assert.deepEqual(staleSources(board(root), root).stale, [])
})

test('a source committed after the flattened board makes it stale', () => {
	const root = repo()
	write(root, 'screens-src/zuiddrecht/DqZaken.dc.html', '<dc-import name="DqKop"></dc-import><main>v2</main>')
	commit(root, '2026-10-25T12:00:00Z', 'edit source only')
	assert.deepEqual(staleSources(board(root), root).stale.map((s) => s.file), ['screens-src/zuiddrecht/DqZaken.dc.html'])
})

test('an imported board committed after the flattened board makes it stale', () => {
	const root = repo()
	write(root, 'screens-src/zuiddrecht/DqKop.dc.html', '<header>kop v2</header>')
	commit(root, '2026-10-25T12:00:00Z', 'edit import only')
	assert.deepEqual(staleSources(board(root), root).stale.map((s) => s.file), ['screens-src/zuiddrecht/DqKop.dc.html'])
})

test('a rebuild after the source edit is fresh again', () => {
	const root = repo()
	write(root, 'screens-src/zuiddrecht/DqZaken.dc.html', '<main>v2</main>')
	commit(root, '2026-10-25T12:00:00Z', 'edit source')
	write(root, 'preview/screens/boards/DqZaken.html', '<main>v2</main>')
	commit(root, '2026-10-25T13:00:00Z', 'rebuild')
	assert.deepEqual(staleSources(board(root), root).stale, [])
})

test('an uncommitted source edit counts by its modification time', () => {
	const root = repo()
	const src = path.join(root, 'screens-src/zuiddrecht/DqZaken.dc.html')
	fs.writeFileSync(src, '<main>local edit</main>')
	assert.equal(staleSources(board(root), root).stale.length, 1)
})

test('a board screens.json names no source for is not checked', () => {
	const root = repo()
	write(root, 'preview/screens/boards/Losse.html', '<main></main>')
	assert.deepEqual(staleSources(path.join(root, 'preview/screens/boards/Losse.html'), root), { src: null, stale: [], built: null })
})
