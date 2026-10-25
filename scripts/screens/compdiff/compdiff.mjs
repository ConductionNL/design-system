#!/usr/bin/env node
// Component-level comparison of a live Nextcloud page against its drawn board.
//
// node compdiff.mjs --board DqMijnWerk --url '/apps/dossiq/?view=mine' --out <dir>
//   [--base http://localhost:8080] [--boards <dir with Board.html>] [--skip-first-run dossiq]
//   [--click "<css>"] [--clicks "a|b"] [--fills "<sel>=><value>||..."] [--settle 8000] [--wait-for "<css>"]
//   [--steps '<JSON array>' | --steps @<file.json>]   ordered click/fill/type/press/wait steps (steps.mjs), played
//   after --click, --clicks and --fills; REVIEW/boards.json keeps the same list per board
//   [--login none|<role>]   measure without a login, or as COMPDIFF_<ROLE>_USER (live.mjs accountFor)
//   [--ignore "<sel>|<sel>"]   elements on either side to leave out, like the app's own chrome
//   [--storage <path>]   keep the login in <path>-<user>.json and reuse it, so a batch logs in once
//   [--settle-mode quiet|fixed]   quiet (default): measure once requests and layout hold still for 1.5 s, at most
//   --settle ms; fixed: wait the full --settle, as before
// Environment: COMPDIFF_USER and COMPDIFF_PASSWORD (the board user), CHROME (browser binary),
// PLAYWRIGHT_MODULE (path to a playwright package when it is not resolvable from here).
//
// Measures both pages with the same extractor (extract.js), pairs their components (title first, then role and
// position), compares the styling properties, and writes <out>/<board>.json and <out>/<board>.md.
// It compares look and feel only: text, values and row counts are not compared.
// It starts its own headless Chrome; it never touches the browser-N MCP connections. Exit 2 on a setup error.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pairComponents, compareProps, scoreComponent, pairElements, compareElement } from './compare.mjs'
import { pageBackground } from './pagebg.mjs'
import { parseColour } from './colour.mjs'
import { parseSteps, parseWidth, playSteps } from './steps.mjs'
import { accountFor, markIgnored, parkPointer, readPosts, sessionEntries, trackRequests, waitForQuiet, waitForTables } from './live.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
	if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? 'true' : all[i + 1]])
	return acc
}, []))
const BOARDS = args.boards || path.join(HERE, '..', '..', '..', 'preview', 'screens', 'boards')
const base = args.base || 'http://localhost:8080'
const board = args.board
const out = args.out || path.join(process.cwd(), 'compdiff-out')
let width
try {
	width = parseWidth(args.width)
} catch (e) {
	console.error(e.message)
	process.exit(2)
}
const settle = Number(args.settle || 8000)
const settleMode = args['settle-mode'] || 'quiet'
// An element crop above this mismatch % with no property flagged is reported as visually different.
const CROP_FLAG = Number(args['crop-flag'] || 30)
const slim = (e) => ({ kind: e.kind, label: e.label, inControl: e.inControl, inRow: e.inRow, count: e.count, repeated: e.repeated, rect: e.rect, props: e.props })
if (!board || !args.url) {
	console.error('usage: COMPDIFF_USER=... COMPDIFF_PASSWORD=... node compdiff.mjs --board <Name> --url </apps/...> [--out dir] [--width px]')
	process.exit(2)
}
let account
try {
	account = accountFor(args.login, process.env)
} catch (e) {
	console.error(e.message)
	process.exit(2)
}
let steps = []
try {
	steps = args.steps ? parseSteps(args.steps) : []
} catch (e) {
	console.error(`bad --steps: ${e.message}`)
	process.exit(2)
}
const boardFile = path.join(BOARDS, `${board}.html`)
if (!fs.existsSync(boardFile)) {
	console.error(`board not found: ${boardFile}`)
	process.exit(2)
}
fs.mkdirSync(out, { recursive: true })
// The extractor runs in the page, so it gets the colour parser as source ahead of it (a function declaration, so a
// second injection into the same page does not throw).
const EXTRACT = `${parseColour.toString()}\n` + fs.readFileSync(path.join(HERE, 'extract.js'), 'utf8')
const measure = async (page) => {
	await page.evaluate(() => document.fonts.ready)
	await page.addScriptTag({ content: EXTRACT })
	return page.evaluate(() => window.__compdiffExtract())
}

// Phase timings (ms), written to the report so a run can be profiled.
const t0 = Date.now(), timings = {}
let tLast = t0
const lap = (name) => { const t = Date.now(); timings[name] = (timings[name] || 0) + (t - tLast); tLast = t }
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
try {
	lap('launch')
	const bctx = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: 1 })
	const bpage = await bctx.newPage()
	await bpage.goto('file://' + boardFile, { waitUntil: 'load' })
	await bpage.waitForTimeout(800)
	const boardHeight = await bpage.evaluate(() => Math.ceil((document.querySelector('[data-board]') || document.body).getBoundingClientRect().height) || 1070)
	await bpage.setViewportSize({ width, height: boardHeight })
	await bpage.waitForTimeout(300)
	await markIgnored(bpage, args.ignore)
	const boardPng = path.join(out, `${board}-board.png`)
	await bpage.screenshot({ path: boardPng, clip: { x: 0, y: 0, width, height: boardHeight } })
	const B = await measure(bpage)
	lap('board')

	// A login kept from an earlier board of the batch is reused; a stale one is replaced below.
	const storage = account && args.storage ? `${args.storage}-${account.user.replace(/[^A-Za-z0-9_-]/g, '_')}.json` : null
	let kept = null
	try { kept = storage && fs.existsSync(storage) ? JSON.parse(fs.readFileSync(storage, 'utf8')) : null } catch { kept = null }
	const lctx = await browser.newContext({ viewport: { width, height: boardHeight }, deviceScaleFactor: 1, locale: 'nl-NL', ...(kept ? { storageState: kept } : {}) })
	const lpage = await lctx.newPage()
	const requests = trackRequests(lpage)
	if (args['skip-first-run']) {
		const apps = args['skip-first-run'].split(',')
		await lctx.addInitScript((list) => {
			try { for (const a of list) { localStorage.setItem(`cn-support-dialog-shown:${a}`, '1'); localStorage.setItem(`cn-walkthrough-seen:${a}`, '999.0.0') } } catch (e) {}
		}, apps)
		for (const a of apps) await lctx.route(new RegExp(`/apps/${a}/api/setup/status`), (route) => route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"skip-first-run"}' }))
	}
	const session = sessionEntries(args.session)
	if (session.length) {
		await lctx.addInitScript((entries) => {
			try { for (const [k, v] of entries) sessionStorage.setItem(k, v) } catch (e) {}
		}, session)
	}
	const mayRead = readPosts(args['read-post'])
	const blocked = []
	// Read-only: refuse any write request to the live instance (login is the one allowed POST).
	const origin = new URL(base).origin
	await lctx.route((u) => u.origin === origin, (route) => {
		const m = route.request().method()
		if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS' || /\/login(\?|$)/.test(route.request().url()) || mayRead(m, route.request().url())) return route.fallback()
		blocked.push(`${m} ${route.request().url().replace(base, '')}`)
		return route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"compdiff is read-only"}' })
	})
	const target = /^https?:\/\//.test(args.url) ? args.url : base + args.url
	const onLogin = () => /\/login(\?|$)/.test(new URL(lpage.url()).pathname + new URL(lpage.url()).search)
	const login = async () => {
		await lpage.goto(base + '/login', { waitUntil: 'domcontentloaded', timeout: 180000 })
		await lpage.fill('#user', account.user)
		await lpage.fill('#password', account.password)
		// Logged in once the browser leaves /login; the app it lands on need not finish loading.
		await Promise.all([lpage.waitForURL((u) => !/\/login(\?|$)/.test(u.pathname + u.search), { waitUntil: 'commit', timeout: 180000 }), lpage.press('#password', 'Enter')])
		// Written whole and renamed into place: parallel slots of a batch may read it at any moment.
		if (storage) { const tmp = `${storage}.${process.pid}`; fs.writeFileSync(tmp, JSON.stringify(await lctx.storageState())); fs.renameSync(tmp, storage) }
	}
	if (account && !kept) await login()
	lap('login')
	// The page has loaded at its load event; what renders after is waited for below. Nextcloud keeps polling, so the
	// network is never idle for long and a networkidle wait runs into its timeout.
	await lpage.goto(target, { waitUntil: 'load', timeout: 180000 }).catch(() => {})
	if (account && onLogin()) {
		await login()
		await lpage.goto(target, { waitUntil: 'load', timeout: 180000 }).catch(() => {})
	}
	await waitForQuiet(lpage, requests, { min: 1000, max: 30000, quiet: 1500 })
	if (args['wait-for']) await lpage.waitForSelector(args['wait-for'], { timeout: 180000 })
	if (args.click) { await lpage.click(args.click, { timeout: 60000 }); await lpage.waitForTimeout(1500) }
	if (args.clicks) for (const sel of args.clicks.split('|')) { await lpage.click(sel.trim(), { timeout: 60000 }); await lpage.waitForTimeout(1500) }
	if (args.fills) {
		for (const pair of args.fills.split('||')) {
			const [sel, val] = pair.split('=>')
			try { await lpage.fill(sel.trim(), val, { timeout: 15000 }) } catch (e) { console.error('fill skipped:', sel.trim(), e.message.split('\n')[0]) }
			await lpage.waitForTimeout(500)
		}
	}
	lap('load')
	await playSteps(lpage, steps)
	if (steps.length) await parkPointer(lpage)
	lap('steps')
	if (settleMode === 'fixed') await lpage.waitForTimeout(settle)
	else await waitForQuiet(lpage, requests, { min: 1500, max: settle, quiet: 1500 })
	lap('settle')
	// A table's selection column can render after the settle: measure the head once it holds every column.
	if (!(await waitForTables(lpage))) console.error('tables did not settle; measuring as they are')
	lap('tables')
	await markIgnored(lpage, args.ignore)
	const livePng = path.join(out, `${board}-live.png`)
	await lpage.screenshot({ path: livePng, clip: { x: 0, y: 0, width, height: boardHeight } })
	lap('screenshot')
	const L = await measure(lpage)
	lap('extract')

	const { pairs, missing, extra } = pairComponents(B.components, L.components, boardHeight)
	const ep = pairElements(B.elements, L.elements, boardHeight)

	// Per-pair pixel mismatch: the live crop is scaled to the board crop's size. Secondary to the properties.
	const dpage = await bctx.newPage()
	const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')
	const crops = await dpage.evaluate(async ({ a, b, H, list }) => {
		const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src })
		const [ia, ib] = await Promise.all([load(a), load(b)])
		return list.map(({ br, lr }) => {
			const ok = (r) => r.w >= 4 && r.h >= 4 && r.x >= 0 && r.y >= 0 && r.x + r.w <= 1441 && r.y + r.h <= H + 1
			if (!ok(br) || !ok(lr)) return null
			const w = Math.round(br.w), h = Math.round(br.h)
			const ca = document.createElement('canvas'); ca.width = w; ca.height = h
			const xa = ca.getContext('2d'); xa.drawImage(ia, br.x, br.y, br.w, br.h, 0, 0, w, h)
			const cb = document.createElement('canvas'); cb.width = w; cb.height = h
			const xb = cb.getContext('2d'); xb.drawImage(ib, lr.x, lr.y, lr.w, lr.h, 0, 0, w, h)
			const da = xa.getImageData(0, 0, w, h).data, db = xb.getImageData(0, 0, w, h).data
			let n = 0
			for (let p = 0; p < da.length; p += 4) if (Math.max(Math.abs(da[p] - db[p]), Math.abs(da[p + 1] - db[p + 1]), Math.abs(da[p + 2] - db[p + 2])) > 24) n++
			return Math.round(n / (w * h) * 1000) / 10
		})
	}, { a: b64(boardPng), b: b64(livePng), H: boardHeight, list: [...pairs, ...ep.pairs].map((p) => ({ br: p.board.rect, lr: p.live.rect })) })

	const pageBg = { board: await pageBackground(dpage, boardPng, fs), live: await pageBackground(dpage, livePng, fs) }
	// Element pairs: properties first; a crop that differs while no property fired is flagged as unidentified.
	lap('compare')
	const elementResults = ep.pairs.map((p, i) => {
		const rows = compareElement(p.board, p.live)
		const crop = crops[pairs.length + i]
		if (!rows.some((r) => r.flag) && p.by === 'label' && crop !== null && crop > CROP_FLAG) rows.push({ prop: 'pixels', board: null, live: crop, delta: null, flag: 'visually differs, property not identified' })
		return { kind: p.board.kind, label: p.board.label || p.live.label, inControl: p.board.inControl, matchedBy: p.by, board: p.board, live: p.live, cropMismatchPct: crop, rows, flagged: rows.filter((r) => r.flag).length }
	})
	const results = pairs.map((p, i) => {
		const rows = compareProps(p.board, p.live)
		return { name: p.name, role: p.board.role, matchedBy: p.by, board: p.board, live: p.live, cropMismatchPct: crops[i], rows, flagged: rows.filter((r) => r.flag).length, score: scoreComponent(rows) }
	})
	const report = {
		board, url: args.url, height: boardHeight, measuredAt: new Date().toISOString(),
		counts: { boardComponents: B.components.length, liveComponents: L.components.length, paired: pairs.length, missingOnLive: missing.length, extraOnLive: extra.length, flaggedComponents: results.filter((r) => r.flagged).length },
		page: pageBg,
		components: results,
		elements: elementResults,
		missingElements: ep.missing.map(slim),
		extraElements: ep.extra.map(slim),
		notMeasured: B.unmeasured || [],
		missingOnLive: missing.map((c) => ({ role: c.role, title: c.title || null, rect: c.rect })),
		blockedWrites: blocked,
		extraOnLive: extra.map((c) => ({ role: c.role, title: c.title || null, rect: c.rect })),
	}
	fs.writeFileSync(path.join(out, `${board}.json`), JSON.stringify(report, null, 1))
	fs.writeFileSync(path.join(out, `${board}.md`), renderTable(report))
	lap('write')
	timings.total = Date.now() - t0
	report.timings = timings
	fs.writeFileSync(path.join(out, `${board}.json`), JSON.stringify(report, null, 1))
	console.log(JSON.stringify({ board, ...report.counts, ms: timings.total }))
} catch (e) {
	console.error('compdiff error:', e.stack || e.message)
	process.exitCode = 2
} finally {
	await browser.close()
}

function renderTable (r) {
	const lines = [`# ${r.board}  (${r.url})`, '', `components: board ${r.counts.boardComponents}, live ${r.counts.liveComponents}, paired ${r.counts.paired}, flagged ${r.counts.flaggedComponents}`, '']
	const sorted = [...r.components].sort((a, b) => b.score - a.score)
	for (const c of sorted) {
		lines.push(`## ${c.role}: ${c.name}  [${c.matchedBy}]  flags ${c.flagged}, crop mismatch ${c.cropMismatchPct ?? 'n/a'}%`, '')
		lines.push('| property | board | live | delta | flag |', '|---|---|---|---|---|')
		for (const row of c.rows) lines.push(`| ${row.prop} | ${fmt(row.board)} | ${fmt(row.live)} | ${row.delta ?? ''} | ${row.flag ? 'FLAG ' + row.flag : ''} |`)
		lines.push('')
	}
	if (r.missingOnLive.length) lines.push('## Missing on live', '', ...r.missingOnLive.map((c) => `- ${c.role}: ${c.title || '(untitled)'} at ${c.rect.x},${c.rect.y} ${c.rect.w}x${c.rect.h}`), '')
	if (r.extraOnLive.length) lines.push('## Extra on live', '', ...r.extraOnLive.map((c) => `- ${c.role}: ${c.title || '(untitled)'} at ${c.rect.x},${c.rect.y} ${c.rect.w}x${c.rect.h}`), '')
	return lines.join('\n')
}
function fmt (v) { return v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v) }
