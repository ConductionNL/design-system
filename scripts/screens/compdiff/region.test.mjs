// node --test scripts/screens/compdiff/region.test.mjs
// One marked region of a board (a side-state panel, or one state card in it) measured against one live component.
// The browser tests need PLAYWRIGHT_MODULE and Chrome, and skip without them.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { collapseExempt, parseExempt } from './exempt.mjs'
import { unknownFlags } from './flags.mjs'
import { cutToRegion, findBoardRegion, parseRegion, regionExemptKinds, regionId, within } from './region.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const CHROME = process.env.CHROME || '/opt/google/chrome/chrome'
let chromium = null
try {
	chromium = require(process.env.PLAYWRIGHT_MODULE || 'playwright').chromium
} catch {
	chromium = null
}
const skip = !chromium || !fs.existsSync(CHROME) ? 'no playwright or Chrome' : false

test('no region flag measures the whole board; the region flags come together', () => {
	assert.equal(parseRegion({}), null)
	assert.deepEqual(parseRegion({ 'board-region': 'Standen in de wachtrij', 'live-region': 'main .notice' }), { region: 'Standen in de wachtrij', state: null, live: 'main .notice' })
	assert.deepEqual(parseRegion({ 'board-region': 'Standen in de wachtrij', 'state-card': 'Bron niet beschikbaar', 'live-region': 'main .notice' }).state, 'Bron niet beschikbaar')
	assert.throws(() => parseRegion({ 'state-card': 'Bron niet beschikbaar' }), /--state-card needs --board-region/)
	assert.throws(() => parseRegion({ 'live-region': 'main' }), /--live-region needs --board-region/)
	assert.throws(() => parseRegion({ 'board-region': 'Standen in de wachtrij' }), /needs --live-region/)
	assert.throws(() => parseRegion({ 'board-region': 'true', 'live-region': 'main' }), /--board-region needs a value/)
})

test('a region run keeps its banners and side-state panel in and takes the state card notes out', () => {
	assert.deepEqual(regionExemptKinds(['banner', 'side-states'], null), ['banner', 'side-states'])
	assert.deepEqual(regionExemptKinds(['banner', 'side-states'], { state: null }), [])
	assert.deepEqual(regionExemptKinds(['banner'], { state: 'Leeg' }), ['state-note'])
	assert.deepEqual(parseExempt('state-note'), ['state-note'])
})

test('a region run is written under the board and the state, so states of one board do not overwrite each other', () => {
	assert.equal(regionId('DqTeamwachtrij', null), 'DqTeamwachtrij')
	assert.equal(regionId('DqTeamwachtrij', { region: 'Standen in de wachtrij', state: 'Bron niet beschikbaar: taken uit pipelinq' }), 'DqTeamwachtrij~bron-niet-beschikbaar-taken-uit-pipelinq')
	assert.equal(regionId('DqDashboard', { region: 'Signaal voor de coördinator', state: null }), 'DqDashboard~signaal-voor-de-coordinator')
})

test('only what lies inside the region is kept, placed from its top left', () => {
	const r = { x: 100, y: 1000, w: 300, h: 200 }
	const items = [{ role: 'card', rect: { x: 100, y: 1000, w: 300, h: 200 } }, { role: 'button', rect: { x: 120, y: 1150, w: 80, h: 34 } }, { role: 'card', rect: { x: 0, y: 0, w: 1440, h: 80 } }, { role: 'card', rect: { x: 350, y: 1100, w: 200, h: 50 } }]
	assert.deepEqual(within(items, r).map((i) => [i.role, i.rect.x, i.rect.y]), [['card', 0, 0], ['button', 20, 150]])
	const cut = cutToRegion({ components: items, elements: [], unmeasured: [{ tag: 'p', rect: { x: 110, y: 1010, w: 10, h: 10 } }], icons: [], floaters: [{ x: 101, y: 1001, w: 5, h: 5 }, { x: 0, y: 0, w: 5, h: 5 }] }, r)
	assert.equal(cut.components.length, 2)
	assert.deepEqual(cut.unmeasured[0].rect, { x: 10, y: 10, w: 10, h: 10 })
	assert.deepEqual(cut.floaters, [{ x: 1, y: 1, w: 5, h: 5 }])
})

test('the region flags are flags compdiff reads, and a half-given region exits 2 before a browser starts', () => {
	assert.deepEqual(unknownFlags(['--board', 'DqTeamwachtrij', '--url', '/apps/dossiq/queue', '--board-region', 'Standen in de wachtrij', '--state-card', 'Leeg', '--live-region', 'main']), [])
	const r = spawnSync(process.execPath, [path.join(HERE, 'compdiff.mjs'), '--board', 'DqTeamwachtrij', '--url', '/apps/dossiq/queue', '--state-card', 'Leeg'], { encoding: 'utf8', env: { ...process.env, COMPDIFF_USER: 'x', COMPDIFF_PASSWORD: 'x' } })
	assert.equal(r.status, 2)
	assert.match(r.stderr, /--state-card needs --board-region/)
})

// A board with a main card and a side-state panel of two state cards, each with its caption strip and sentence.
const card = (title, body) => `<section data-compdiff-state="${title}" aria-label="${title}" style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;display:flex;flex-direction:column"><div data-compdiff-exempt="state-note" style="padding:10px 16px;font-size:13px;font-weight:700;color:#234a78">${title}</div><div style="padding:16px 18px;display:flex;flex-direction:column;gap:10px">${body}<p data-compdiff-exempt="state-note" style="margin:0;color:#5e6168">Uitleg bij deze stand.</p></div></section>`
const BOARD = `<!doctype html><html><body style="margin:0;font-family:sans-serif"><div data-board style="width:1440px;display:flex;flex-direction:column;gap:24px;padding:24px;box-sizing:border-box">
	<section aria-labelledby="t" style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px;height:300px"><h2 id="t">Wachtrij</h2></section>
	<section data-compdiff-exempt="side-states" data-compdiff-region="Standen in de wachtrij" aria-label="Standen in de wachtrij" style="display:flex;flex-direction:column;gap:14px"><h2 style="margin:0">Standen in de wachtrij</h2>
		<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start">
			${card('Lege wachtrij', '<div style="padding:28px 16px;text-align:center;border:1px dashed #d6d9de;border-radius:10px">Geen taken</div>')}
			${card('Bron niet beschikbaar', '<div role="status" style="padding:12px 14px;border-radius:10px;background:#fff4de;color:#7a4f00">Bron niet beschikbaar</div>')}
		</div>
	</section>
	<section data-compdiff-region="Signaal" data-compdiff-state="Signaal" aria-label="Signaal" style="height:80px">Signaal</section>
</div></body></html>`

/**
 * Runs a test body against a page made of the given HTML.
 *
 * @param {string} html The page.
 * @param {Function} fn Receives the page.
 * @return {Promise<void>}
 */
async function withPage(html, fn) {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
		await page.setContent(html)
		await fn(page)
	} finally {
		await browser.close()
	}
}

test('a region and a state card are found by their markers; a wrong name says what the board marks', { skip }, async () => {
	await withPage(BOARD, async (page) => {
		const panel = await page.evaluate(findBoardRegion, { region: 'Standen in de wachtrij', state: null })
		assert.ok(panel.rect.h > 100)
		const one = await page.evaluate(findBoardRegion, { region: 'Standen in de wachtrij', state: 'Bron niet beschikbaar' })
		assert.ok(one.rect.x > panel.rect.x && one.rect.w < panel.rect.w / 2)
		// A panel that is a single state carries both markers.
		assert.ok((await page.evaluate(findBoardRegion, { region: 'Signaal', state: 'Signaal' })).rect)
		assert.match((await page.evaluate(findBoardRegion, { region: 'Wachtrij', state: null })).error, /matches no marked region; the board marks "Standen in de wachtrij", "Signaal"/)
		assert.match((await page.evaluate(findBoardRegion, { region: 'Standen in de wachtrij', state: 'Leeg' })).error, /has "Lege wachtrij", "Bron niet beschikbaar"/)
	})
})

test('with the notes out, a state card measures as the drawing alone', { skip }, async () => {
	await withPage(BOARD, async (page) => {
		const before = (await page.evaluate(findBoardRegion, { region: 'Standen in de wachtrij', state: 'Lege wachtrij' })).rect.h
		const out = await page.evaluate(collapseExempt, regionExemptKinds(parseExempt(undefined), { state: 'Lege wachtrij' }))
		assert.deepEqual(out.map((e) => e.kind), ['state-note', 'state-note', 'state-note', 'state-note'])
		const after = (await page.evaluate(findBoardRegion, { region: 'Standen in de wachtrij', state: 'Lege wachtrij' })).rect.h
		assert.ok(before - after > 40, `${before} -> ${after}`)
	})
})

/**
 * Runs compdiff without blocking this process, which serves the live page.
 *
 * @param {Array<string>} args The node arguments.
 * @return {Promise<{code: number, stdout: string, stderr: string}>} How it ended.
 */
function run(args) {
	const child = spawn(process.execPath, args, { env: { ...process.env, CHROME } })
	let stdout = '', stderr = ''
	child.stdout.on('data', (d) => { stdout += d })
	child.stderr.on('data', (d) => { stderr += d })
	return new Promise((resolve) => child.on('close', (code) => resolve({ code, stdout, stderr })))
}

test('compdiff measures one state card against the live component the steps open, and writes it as <board>~<state>', { skip, timeout: 120000 }, async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'compdiff-region-'))
	fs.mkdirSync(path.join(dir, 'boards'))
	fs.writeFileSync(path.join(dir, 'boards', 'DqProef.html'), BOARD)
	// The live page shows the source-down notice only after "Vernieuwen", as a state a fixture would bring about.
	const live = `<!doctype html><html><body style="margin:0;font-family:sans-serif"><main style="width:1440px;padding:24px;box-sizing:border-box;display:flex;flex-direction:column;gap:24px">
		<section style="background:#fff;border:1px solid #e4e6ea;border-radius:12px;padding:20px;height:300px"><h2>Wachtrij</h2><button id="vernieuwen" onclick="document.getElementById('bron').hidden=false">Vernieuwen</button></section>
		<div id="bron" hidden style="width:420px;box-sizing:border-box;padding:16px 18px;border:1px solid #e4e6ea;border-radius:12px"><div role="status" style="padding:12px 14px;border-radius:10px;background:#fff4de;color:#7a4f00">Bron niet beschikbaar</div></div>
	</main></body></html>`
	const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(live) })
	await new Promise((r) => server.listen(0, '127.0.0.1', r))
	const base = `http://127.0.0.1:${server.address().port}`
	try {
		const args = [path.join(HERE, 'compdiff.mjs'), '--board', 'DqProef', '--boards', path.join(dir, 'boards'), '--base', base, '--url', '/queue', '--login', 'none', '--out', path.join(dir, 'out'), '--settle', '2000', '--load-wait', '2000',
			'--steps', '[{"click":"#vernieuwen"}]', '--board-region', 'Standen in de wachtrij', '--state-card', 'Bron niet beschikbaar', '--live-region', '#bron']
		const { code, stdout, stderr } = await run(args)
		assert.equal(code, 0, stderr)
		assert.match(stdout, /"board":"DqProef~bron-niet-beschikbaar"/)
		const report = JSON.parse(fs.readFileSync(path.join(dir, 'out', 'DqProef~bron-niet-beschikbaar.json'), 'utf8'))
		assert.equal(report.region.state, 'Bron niet beschikbaar')
		assert.equal(report.region.liveRect.w, 420)
		// The notes left the card, the side-state panel stayed: the drawing and the notice pair, nothing outside them.
		assert.ok(report.exempted.board.every((e) => e.kind === 'state-note'))
		for (const c of report.components) assert.ok(c.board.rect.x >= -2 && c.board.rect.y >= -2 && c.live.rect.x >= -2 && c.live.rect.y >= -2)
		assert.ok(!report.missingOnLive.some((c) => c.title === 'Wachtrij'))
		assert.ok(fs.existsSync(path.join(dir, 'out', 'DqProef~bron-niet-beschikbaar-board.png')))
		// A live selector that finds nothing is a setup error.
		const bad = await run(args.map((a) => (a === '#bron' ? '#nergens' : a)))
		assert.equal(bad.code, 2)
		assert.match(bad.stderr, /--live-region #nergens matches nothing on the live page/)
	} finally {
		server.close()
		fs.rmSync(dir, { recursive: true, force: true })
	}
})
