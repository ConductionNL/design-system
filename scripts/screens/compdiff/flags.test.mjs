// node --test scripts/screens/compdiff/flags.test.mjs
// compdiff refuses a flag it does not read, so a spec row is never measured with part of its state dropped.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { unknownFlags } from './flags.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

test('every flag compdiff reads is known; any other is named', () => {
	assert.deepEqual(unknownFlags(['--board', 'DqTaken', '--url', '/apps/dossiq/tasks', '--steps', '[]', '--allow-stale-board', '--inject-css', 'a.css']), [])
	assert.deepEqual(unknownFlags(['--board', 'X', '--tab', 'Historie', '--stepz', '[]']), ['--tab', '--stepz'])
	// A value that starts with two dashes belongs to its flag ("--steps" "[...]"); only flag positions are checked.
	assert.deepEqual(unknownFlags(['--clock', '2026-11-02T09:00:00']), [])
})

test('compdiff exits 2 on a flag it does not read, before it starts a browser', () => {
	const r = spawnSync(process.execPath, [path.join(HERE, 'compdiff.mjs'), '--board', 'DqTaken', '--url', '/apps/dossiq/tasks', '--tab', 'Historie'], { encoding: 'utf8', env: { ...process.env, COMPDIFF_USER: 'x', COMPDIFF_PASSWORD: 'x' } })
	assert.equal(r.status, 2)
	assert.match(r.stderr, /unknown flag.*--tab/)
})

test('runall.sh refuses a spec row with a flag compdiff does not read, and says which', () => {
	const os = spawnSync('mktemp', ['-d'], { encoding: 'utf8' }).stdout.trim()
	const specs = path.join(os, 'specs.tsv')
	spawnSync('bash', ['-c', `printf 'DqTaken\\t/apps/dossiq/tasks\\t--tab\\tHistorie\\n' > ${specs}`])
	const r = spawnSync('bash', [path.join(HERE, 'runall.sh'), os, specs], { encoding: 'utf8', env: { ...process.env, COMPDIFF_LOCK_DIR: '', COMPDIFF_HEALTH: '' } })
	assert.match(r.stdout, /DqTaken refused \(unknown flag --tab\)/)
	spawnSync('rm', ['-rf', os])
})
