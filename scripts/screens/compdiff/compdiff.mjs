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
//   --url may name a record by a lookup, {task:title=...} or {object:<register>/<schema>:<field>=<value>}, resolved
//   through the OpenRegister API at run time (lookup.mjs)
//   [--settle-mode quiet|fixed]   quiet (default): measure once requests and layout hold still for 1.5 s, at most
//   --settle ms; fixed: wait the full --settle, as before
//   [--board-frame "<css>"]   measure only that element of the board, as the whole board (one of several frames)
//   [--allow-stale-board]   measure a flattened board that no longer matches its source (refused by default)
//   [--load-wait 30000]   the longest wait for loading indicators to clear after the settle (ms)
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
import { cropMismatch, pixelsFlag, wholePixels } from './crop.mjs'
import { parseClock, parseSteps, parseWidth, playSteps } from './steps.mjs'
import { parseLookups, resolveRoute } from './lookup.mjs'
import { boardFreshness } from './freshness.mjs'
import { cropToFrame } from './frame.mjs'
import { accountFor, browserEnv, chunks, focusRingsOff, leaveClosedSelect, loadingIndicators, markIgnored, parkPointer, readPosts, resetScroll, retryOnce, routeId, sessionEntries, trackRequests, waitForLoaded, waitForQuiet, waitForTables, waitForTransitions } from './live.mjs'

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
let width, clock
try {
	width = parseWidth(args.width)
	clock = parseClock(args.clock)
} catch (e) {
	console.error(e.message)
	process.exit(2)
}
const settle = Number(args.settle || 8000)
const settleMode = args['settle-mode'] || 'quiet'
// An element crop above this mismatch % with no property flagged is reported as visually different.
const CROP_FLAG = Number(args['crop-flag'] || 30)
// The longest wait for loading indicators to clear after the settle (ms).
const loadWait = Number(args['load-wait'] || 30000)
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
// A flattened board that no longer matches its source (or a board it imports) draws an old board: refuse it, unless
// asked. A check that cannot run is reported, and the board is measured.
const fresh = boardFreshness(boardFile, path.resolve(BOARDS, '..', '..', '..'))
if (fresh.state === 'stale') {
	const msg = `board ${board}.html does not match its source in screens-src: rebuild it with scripts/screens/build.py --only ${board}`
	if (args['allow-stale-board'] !== 'true') {
		console.error(`stale board: ${msg}, or pass --allow-stale-board`)
		process.exit(2)
	}
	console.error(`warning: ${msg}`)
} else if (fresh.state === 'unchecked') {
	console.error(`warning: board freshness not checked (${fresh.reason})`)
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
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--lang=nl-NL'], env: browserEnv(process.env) })
try {
	lap('launch')
	const bctx = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: 1 })
	const bpage = await bctx.newPage()
	// The board is a local file, but its fonts and images load slowly on a busy box: 90 seconds, and once more.
	await retryOnce(() => bpage.goto('file://' + boardFile, { waitUntil: 'load', timeout: 90000 }), (e) => console.error(`board load failed, trying once more: ${e.message.split('\n')[0]}`))
	await bpage.waitForTimeout(800)
	// --board-frame: a board that draws several frames side by side (three phone screens on one canvas) is measured on
	// one of them, as if it were the whole board.
	if (args['board-frame']) {
		const found = await bpage.evaluate(cropToFrame, args['board-frame'])
		if (!found) throw new Error(`--board-frame ${args['board-frame']} matches nothing on the board`)
		await bpage.waitForTimeout(300)
	}
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
	// A board drawn on a fixed date: the live page's clock reads that moment (timers keep running).
	if (clock) await lctx.clock.setFixedTime(clock)
	const lpage = await lctx.newPage()
	const requests = trackRequests(lpage)
	if (args['skip-first-run']) {
		const apps = args['skip-first-run'].split(',')
		await lctx.addInitScript((list) => {
			try { for (const a of list) { localStorage.setItem(`cn-support-dialog-shown:${a}`, '1'); localStorage.setItem(`cn-walkthrough-seen:${a}`, '999.0.0') } } catch (e) {}
		}, apps)
		for (const a of apps) await lctx.route(new RegExp(`/apps/${a}/api/setup/status`), (route) => route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"skip-first-run"}' }))
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
	let liveRoute = args.url
	const onLogin = () => /\/login(\?|$)/.test(new URL(lpage.url()).pathname + new URL(lpage.url()).search)
	// Under load the login page can take minutes to answer: each action gets 90 s, and a failed login is tried once more.
	const login = () => retryOnce(async () => {
		await lpage.goto(base + '/login', { waitUntil: 'domcontentloaded', timeout: 180000 })
		// A session that is still valid is sent on from /login: there is nothing to fill.
		if (!onLogin()) return
		await lpage.fill('#user', account.user, { timeout: 90000 })
		await lpage.fill('#password', account.password, { timeout: 90000 })
		// Logged in once the browser leaves /login; the app it lands on need not finish loading.
		await Promise.all([lpage.waitForURL((u) => !/\/login(\?|$)/.test(u.pathname + u.search), { waitUntil: 'commit', timeout: 180000 }), lpage.press('#password', 'Enter', { timeout: 90000 })])
		// Written whole and renamed into place: parallel slots of a batch may read it at any moment.
		if (storage) { const tmp = `${storage}.${process.pid}`; fs.writeFileSync(tmp, JSON.stringify(await lctx.storageState())); fs.renameSync(tmp, storage) }
	}, (e) => console.error('login failed, trying once more:', e.message.split('\n')[0]))
	if (account && !kept) await login()
	// A route that names a record by a lookup gets its uuid now, as the measuring user. A kept login can have expired:
	// then the lookup is answered by the login page, so log in again and retry once.
	if (parseLookups(args.url).length) {
		const getJson = async (p) => {
			const res = await lctx.request.get(base + p, { headers: { Accept: 'application/json', 'OCS-APIRequest': 'true' } })
			if (!res.ok()) throw new Error(`GET ${p} answered ${res.status()}`)
			return res.json()
		}
		try {
			liveRoute = await resolveRoute(args.url, getJson)
		} catch (e) {
			if (!account) throw e
			console.error(`lookup failed, logging in again: ${e.message.split('\n')[0]}`)
			await login()
			liveRoute = await resolveRoute(args.url, getJson)
		}
		console.error(`route ${args.url} -> ${liveRoute}`)
	}
	const target = /^https?:\/\//.test(liveRoute) ? liveRoute : base + liveRoute
	// Session storage is seeded before the page loads; `{routeId}` in a value is the record id the route ends in, so
	// a seed keyed by the record (CnDetailPage's access purpose) follows a route found by a lookup.
	const session = sessionEntries(args.session, routeId(liveRoute))
	if (session.length) {
		await lctx.addInitScript((entries) => {
			try { for (const [k, v] of entries) sessionStorage.setItem(k, v) } catch (e) {}
		}, session)
	}
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
	if (steps.length) { await parkPointer(lpage); await leaveClosedSelect(lpage) }
	lap('steps')
	if (settleMode === 'fixed') await lpage.waitForTimeout(settle)
	else await waitForQuiet(lpage, requests, { min: 1500, max: settle, quiet: 1500 })
	lap('settle')
	// A table's selection column can render after the settle: measure the head once it holds every column.
	if (!(await waitForTables(lpage))) console.error('tables did not settle; measuring as they are')
	if (!(await waitForLoaded(lpage, { timeout: loadWait }))) {
		const still = await lpage.evaluate(loadingIndicators).catch(() => [])
		console.error(`a widget was still loading after ${loadWait / 1000} s; measuring as it is: ${still.join('; ') || '(nothing named)'}`)
		await waitForQuiet(lpage, requests, { min: 500, max: 10000, quiet: 1500 })
	}
	lap('tables')
	if (args['keep-scroll'] !== 'true' && (await resetScroll(lpage)) > 0) await lpage.waitForTimeout(500)
	await waitForTransitions(lpage).catch(() => {})
	await markIgnored(lpage, args.ignore)
	// The keyboard focus rings round a field typed into are the theme's, kept in the apps (Ruben, 30 Oct); a board draws
	// the field without them.
	await lpage.evaluate(focusRingsOff).catch(() => 0)
	const livePng = path.join(out, `${board}-live.png`)
	await lpage.screenshot({ path: livePng, clip: { x: 0, y: 0, width, height: boardHeight } })
	lap('screenshot')
	const L = await measure(lpage)
	lap('extract')
	// Both pages are measured: free them before the crops, which decode two page-sized pictures.
	await lctx.close().catch(() => {})
	await bpage.close().catch(() => {})

	const { pairs, missing, extra } = pairComponents(B.components, L.components, boardHeight)
	const ep = pairElements(B.elements, L.elements, boardHeight)

	// Per-pair pixel mismatch: the live crop is scaled to the board crop's size. Secondary to the properties.
	const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')
	const cropList = [...pairs, ...ep.pairs].map((p) => ({ br: p.board.rect, lr: p.live.rect }))
	const cropFns = `${cropMismatch.toString()}\n${wholePixels.toString()}`
	// Crops are taken a chunk at a time on two reused canvases, so a page with hundreds of pairs does not hold a canvas
	// per pair. A chunk whose page crashes gets no crop scores (null) and the run goes on with a fresh page.
	let dpage = await bctx.newPage()
	const crops = []
	for (const list of chunks(cropList, 40)) {
		const got = await dpage.evaluate(async ({ a, b, H, list, fns }) => {
			const { cropMismatch, wholePixels } = new Function(`${fns}; return { cropMismatch, wholePixels }`)()
			const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src })
			window.__crops = window.__crops || await Promise.all([load(a), load(b)])
			const [ia, ib] = window.__crops
			const ca = document.createElement('canvas'), cb = document.createElement('canvas')
			const xa = ca.getContext('2d', { willReadFrequently: true }), xb = cb.getContext('2d', { willReadFrequently: true })
			return list.map(({ br: bf, lr: lf }) => {
				const ok = (r) => r.w >= 4 && r.h >= 4 && r.x >= 0 && r.y >= 0 && r.x + r.w <= 1441 && r.y + r.h <= H + 1
				if (!ok(bf) || !ok(lf)) return null
				const br = wholePixels(bf), lr = wholePixels(lf)
				const w = br.w, h = br.h
				ca.width = w; ca.height = h; cb.width = w; cb.height = h
				xa.drawImage(ia, br.x, br.y, br.w, br.h, 0, 0, w, h)
				xb.drawImage(ib, lr.x, lr.y, lr.w, lr.h, 0, 0, w, h)
				return cropMismatch(xa.getImageData(0, 0, w, h).data, xb.getImageData(0, 0, w, h).data, w, h)
			})
		}, { a: b64(boardPng), b: b64(livePng), H: boardHeight, list, fns: cropFns }).catch((e) => {
			console.error(`crops skipped for ${list.length} pairs: ${e.message.split('\n')[0]}`)
			return null
		})
		if (!got) { await dpage.close().catch(() => {}); dpage = await bctx.newPage() }
		crops.push(...(got || list.map(() => null)))
	}

	const pageBg = { board: await pageBackground(dpage, boardPng, fs), live: await pageBackground(dpage, livePng, fs) }
	// Element pairs: properties first; a crop that differs while no property fired is flagged as unidentified
	// (pixelsFlag: not on a column head's sort button).
	lap('compare')
	// Open menus and popovers on each side: a crop they lie over is not compared.
	const covers = { board: [...B.components.filter((c) => c.popup).map((c) => c.rect), ...(B.floaters || []).map((f) => ({ ...f, float: true }))], live: [...L.components.filter((c) => c.popup).map((c) => c.rect), ...(L.floaters || []).map((f) => ({ ...f, float: true }))] }
	const elementResults = ep.pairs.map((p, i) => {
		const rows = compareElement(p.board, p.live)
		const crop = crops[pairs.length + i]
		if (!rows.some((r) => r.flag) && p.by === 'label' && pixelsFlag(p.board, p.live, crop, CROP_FLAG, covers)) rows.push({ prop: 'pixels', board: null, live: crop, delta: null, flag: 'visually differs, property not identified' })
		return { kind: p.board.kind, label: p.board.label || p.live.label, inControl: p.board.inControl, matchedBy: p.by, board: p.board, live: p.live, cropMismatchPct: crop, rows, flagged: rows.filter((r) => r.flag).length }
	})
	const results = pairs.map((p, i) => {
		const rows = compareProps(p.board, p.live)
		return { name: p.name, role: p.board.role, matchedBy: p.by, board: p.board, live: p.live, cropMismatchPct: crops[i], rows, flagged: rows.filter((r) => r.flag).length, score: scoreComponent(rows) }
	})
	const report = {
		board, url: liveRoute, ...(liveRoute !== args.url ? { urlSpec: args.url } : {}), height: boardHeight, measuredAt: new Date().toISOString(),
		...(fresh.state === 'stale' ? { staleBoard: true } : {}),
		counts: { boardComponents: B.components.length, liveComponents: L.components.length, paired: pairs.length, missingOnLive: missing.length, extraOnLive: extra.length, flaggedComponents: results.filter((r) => r.flagged).length },
		page: pageBg,
		components: results,
		elements: elementResults,
		missingElements: ep.missing.map(slim),
		extraElements: ep.extra.map(slim),
		notMeasured: B.unmeasured || [],
		icons: B.icons || [],
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
