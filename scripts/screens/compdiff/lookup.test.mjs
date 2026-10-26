// node --test scripts/screens/compdiff/lookup.test.mjs
// A spec route names a record by a lookup, so a --refresh that gives the example set new uuids does not break it.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseLookups, resolveRoute } from './lookup.mjs'

const tasks = [
	{ uuid: 't-1', key: 'example-set:dossiq/ontvangst-parkeervergunningen', title: 'Ontvangst bevestigen' },
	{ uuid: 't-2', key: 'example-set:dossiq/hoorzitting-inplannen', title: 'Hoorzitting inplannen' },
	{ uuid: 't-3', key: null, title: 'Dubbel' },
	{ uuid: 't-4', key: null, title: 'Dubbel' },
]
const fake = (calls = []) => async (p) => {
	calls.push(p)
	if (p.includes('/flow-tasks')) {
		const offset = Number(new URL(p, 'http://x').searchParams.get('offset'))
		return { results: tasks.slice(offset, offset + 100), total: tasks.length }
	}
	const u = new URL(p, 'http://x')
	return { results: u.searchParams.get('title') === 'Verlichting fietspad Lindelaan' ? [{ id: 'c-710', title: 'Verlichting fietspad Lindelaan' }] : [] }
}

test('a route without a lookup is left as it is, and asks nothing', async () => {
	const calls = []
	assert.equal(await resolveRoute('/apps/dossiq/tasks/3896709a', fake(calls)), '/apps/dossiq/tasks/3896709a')
	assert.equal(calls.length, 0)
})

test('a task is found by its title or by its example-set key, with or without the prefix', async () => {
	assert.equal(await resolveRoute('/apps/dossiq/tasks/{task:title=Hoorzitting inplannen}', fake()), '/apps/dossiq/tasks/t-2')
	assert.equal(await resolveRoute('/apps/dossiq/tasks/{task:key=hoorzitting-inplannen}', fake()), '/apps/dossiq/tasks/t-2')
	assert.equal(await resolveRoute('/apps/dossiq/tasks/{task:key=example-set:dossiq/hoorzitting-inplannen}', fake()), '/apps/dossiq/tasks/t-2')
})

test('an object is found by a field in its register and schema', async () => {
	const calls = []
	assert.equal(await resolveRoute('/apps/dossiq/cases/{object:dossiq/case:title=Verlichting fietspad Lindelaan}?tab=x', fake(calls)), '/apps/dossiq/cases/c-710?tab=x')
	assert.match(calls[0], /\/api\/objects\/dossiq\/case\?title=Verlichting%20fietspad%20Lindelaan/)
})

test('no match or two matches is an error, never another record', async () => {
	await assert.rejects(resolveRoute('/t/{task:title=Bestaat niet}', fake()), /found 0 records/)
	await assert.rejects(resolveRoute('/t/{task:title=Dubbel}', fake()), /found 2 records/)
})

test('a malformed lookup is refused before anything is asked', () => {
	assert.throws(() => parseLookups('/t/{task:title}'), /field>=<value/)
	assert.throws(() => parseLookups('/t/{object:case:title=x}'), /register>\/<schema>/)
})
