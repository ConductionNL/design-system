// node --test scripts/screens/compdiff/steps.test.mjs
// compdiff --steps plays a board's steps in their order, so a step can rest on the one before it: DqOverdragen types
// a team into the search and then clicks the option the search found. --clicks and --fills could not: every click
// ran before every fill.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { normaliseStep, parseSteps, playSteps } from './steps.mjs'
import { routeOf, specRows } from './specs-from-boards.mjs'

/**
 * A page that records what is done to it, in order.
 *
 * @param {object} [fail] Selectors whose fill or click throws.
 * @return {{calls: Array<string>}} The page.
 */
function fakePage(fail = {}) {
	const calls = []
	return {
		calls,
		click: async (s) => { if (fail.click === s) throw new Error('no such element'); calls.push(`click ${s}`) },
		fill: async (s, v) => { if (fail.fill === s) throw new Error('not a field\nmore'); calls.push(`fill ${s}=${v}`) },
		press: async (s, k) => calls.push(`press ${s} ${k}`),
		locator: (s) => ({ pressSequentially: async (v) => calls.push(`type ${s}=${v}`) }),
		waitForTimeout: async () => {},
		waitForSelector: async (s) => calls.push(`waitFor ${s}`),
	}
}

const OVERDRAGEN = [
	{ click: 'main button:has-text("Meer")' },
	{ click: 'text=Aan een ander team geven' },
	{ fill: '[role=dialog] .cn-search-select input', value: 'Juridische zaken' },
	{ click: '[role=listbox] [role=option] >> nth=0' },
	{ fill: '[role=dialog] textarea', value: 'De mail van de aannemer raakt een lopend geschil.' },
]

test('plays clicks and fills interleaved, in the order given', async () => {
	const page = fakePage()
	await playSteps(page, parseSteps(JSON.stringify(OVERDRAGEN)))
	assert.deepEqual(page.calls, [
		'click main button:has-text("Meer")',
		'click text=Aan een ander team geven',
		'fill [role=dialog] .cn-search-select input=Juridische zaken',
		'click [role=listbox] [role=option] >> nth=0',
		'fill [role=dialog] textarea=De mail van de aannemer raakt een lopend geschil.',
	])
})

test('types, presses and waits', async () => {
	const page = fakePage()
	await playSteps(page, parseSteps('[{"type":"#q","value":"juri"},{"press":"#q","key":"Enter"},{"wait":200},{"waitFor":"[role=option]"}]'))
	assert.deepEqual(page.calls, ['type #q=juri', 'press #q Enter', 'waitFor [role=option]'])
})

test('a fill that fails is reported and skipped; a click that fails stops the run', async () => {
	const warnings = []
	const page = fakePage({ fill: '#gone' })
	await playSteps(page, parseSteps('[{"fill":"#gone","value":"x"},{"click":"#next"}]'), (m) => warnings.push(m))
	assert.deepEqual(page.calls, ['click #next'])
	assert.deepEqual(warnings, ['fill skipped: #gone not a field'])
	await assert.rejects(playSteps(fakePage({ click: '#menu' }), parseSteps('[{"click":"#menu"},{"click":"#after"}]')), /no such element/)
})

test('reads the steps from a file with @', () => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'steps-')), 'steps.json')
	fs.writeFileSync(file, JSON.stringify(OVERDRAGEN))
	assert.equal(parseSteps(`@${file}`).length, 5)
})

test('refuses a step it cannot play', () => {
	assert.throws(() => parseSteps('{"click":"#a"}'), /JSON array/)
	assert.throws(() => normaliseStep({ fill: '#a' }), /fill needs a value/)
	assert.throws(() => normaliseStep({ click: '#a', fill: '#b', value: 'x' }), /exactly one/)
	assert.throws(() => normaliseStep({ hover: '#a' }), /exactly one/)
	assert.throws(() => normaliseStep({ wait: 'soon' }), /milliseconds/)
	assert.throws(() => normaliseStep({ press: '#a' }), /needs a key/)
})

test('writes a specs row per board with its steps, the route without origin or /index.php', () => {
	const rows = specRows([
		{ board: 'DqOverdragen', liveUrl: 'http://localhost:8080/index.php/apps/dossiq/cases/710d', steps: OVERDRAGEN },
		{ board: 'DqZaken', liveUrl: 'http://localhost:8080/index.php/apps/dossiq/cases?view=mine', steps: [] },
		{ board: 'DqVth', liveUrl: 'http://localhost:8080/index.php/settings/admin/dossiq?tab=vth', steps: [] },
	], ['DqZaken\t/old', 'DqExtra\t/apps/dossiq/extra\t--clicks\ta', ''])
	const [board, route, flag, json] = rows[0].split('\t')
	assert.deepEqual([board, route, flag], ['DqOverdragen', '/apps/dossiq/cases/710d', '--steps'])
	assert.deepEqual(JSON.parse(json), OVERDRAGEN)
	assert.equal(rows[1], 'DqZaken\t/apps/dossiq/cases?view=mine')
	assert.equal(rows[2], 'DqVth\t/settings/admin/dossiq?tab=vth')
	assert.deepEqual(rows.slice(3), ['DqExtra\t/apps/dossiq/extra\t--clicks\ta'])
	assert.equal(routeOf('/apps/dossiq/tasks'), '/apps/dossiq/tasks')
})
