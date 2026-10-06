#!/usr/bin/env node
/**
 * Checks a film against the beat grid and the reading rules, from what the film declares about itself.
 *
 *   node grid-check.mjs --root <repo> --page preview/films/<slug>/index.html [--json out.json] [--pixels]
 *   node grid-check.mjs --dump timeline.json            (a window.__timeline dump, or a film.mjs cues export)
 *
 * What it reads (in this order, all optional): window.__timeline (from _lib/timeline.js), any
 * window.__<film> object with a `captions` array ({ text, up, out }), the transitions page's board caps,
 * and window.__film (scenes, cues, duration, bpm, fps).
 *
 * What it flags:
 *   cuts off the grid     a cut (a frame where one scene ends and another starts) whose frame is not the rounded frame of an 8th (128 BPM, 24 fps:
 *                         an 8th is 5.625 frames; grid times round to the nearest frame, ties up)
 *                         layer boundaries (a scene starting or ending on its own) are listed, not judged
 *   sections off the bar  a scene named opening, builtOn or install that does not start on a bar line
 *   dead bars             a bar with no event in it: no cut, no caption in or out, no sound cue. With
 *                         --pixels the bar is also sampled on every 8th and counts as dead only when no
 *                         sample differs visibly from the one before (more than 0.2% of pixels moved)
 *   word budget           more than 35 on-screen words per 30 s, as a rate and in any 30 s window
 *   short captions        a caption held fully up for less than max(1.5 s, 0.4 s per word); held time is
 *                         out - exit - (up + rise), rise 0.24 s and exit 4 frames unless the film says otherwise
 *
 * It does not change a film. A film that exposes no captions gets the cut and dead-bar checks only,
 * and the report says so. Exit code 0 always: the report is the result.
 */
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve, normalize } from 'node:path'
import { homedir } from 'node:os'

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i++) {
	const k = argv[i].replace(/^--/, '')
	if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) args[k] = true
	else args[k] = argv[++i]
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' }
const serve = (root) => new Promise((ok) => {
	const base = resolve(root)
	const server = createServer(async (req, res) => {
		const file = join(base, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)))
		if (!file.startsWith(base)) { res.writeHead(403).end(); return }
		try { res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(await readFile(file)) } catch { res.writeHead(404).end() }
	})
	server.listen(0, '127.0.0.1', () => ok(server))
})
function chromePath() {
	const dir = join(homedir(), '.cache/ms-playwright')
	for (const v of ['1243', '1234', '1228']) {
		const p = join(dir, `chromium_headless_shell-${v}/chrome-headless-shell-linux64/chrome-headless-shell`)
		if (existsSync(p)) return p
	}
	throw new Error('No chromium headless shell found under ~/.cache/ms-playwright')
}

/* ---------- read the film ---------- */

async function fromPage() {
	const server = await serve(args.root || process.cwd())
	const page0 = args.page.replace(/^\//, '')
	const url = `http://127.0.0.1:${server.address().port}/${page0}${page0.includes('?') ? '&' : '?'}capture`
	const browser = await chromium.launch({ executablePath: chromePath() })
	const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
	await page.goto(url)
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 })
	const data = await page.evaluate(() => {
		const plain = (x) => JSON.parse(JSON.stringify(x ?? null))
		const film = plain(window.__film)
		let captions = null, source = null
		if (window.__timeline?.captions?.length) { captions = window.__timeline.captions; source = 'window.__timeline' }
		if (!captions) {
			for (const k of Object.keys(window)) {
				if (!k.startsWith('__') || ['__film', '__timeline', '__render', '__ready'].includes(k)) continue
				const v = window[k]
				if (v && Array.isArray(v.captions) && v.captions.length && v.captions[0].text !== undefined) { captions = plain(v.captions); source = `window.${k}.captions`; break }
			}
		}
		if (!captions && film?.board?.caps?.length) {
			// The transitions page: caps carry the board id, t0 (rise start), t1 (out) and the hold it measured.
			captions = film.board.caps.map((c) => ({ id: c.id, text: null, up: c.t0, out: c.t1, hold: c.hold, need: c.need }))
			source = '__film.board.caps'
		}
		return { film, timeline: plain(window.__timeline), captions: plain(captions), source }
	})
	let pixels = null
	if (args.pixels) pixels = await samplePixels(browser, page, data.film)
	await browser.close()
	server.close()
	return { ...data, pixels }
}

/** Screenshots every 8th at 1/8 scale and measures the share of pixels that moved since the last sample. */
async function samplePixels(browser, page, film) {
	const cdp = await page.context().newCDPSession(page)
	const step = 60 / film.bpm / 2
	const shots = []
	for (let t = 0; t < film.duration - 1e-6; t += step) {
		const ft = Math.round(t * film.fps) / film.fps
		await page.evaluate((x) => window.__render(x), ft)
		const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: film.width, height: film.height, scale: 0.125 } })
		shots.push({ t: ft, data })
	}
	const diff = await browser.newPage()
	const moved = await diff.evaluate(async (list) => {
		const load = async (b64) => {
			const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob())
			const c = new OffscreenCanvas(img.width, img.height)
			const x = c.getContext('2d')
			x.drawImage(img, 0, 0)
			return x.getImageData(0, 0, img.width, img.height).data
		}
		const out = [0]
		let prev = await load(list[0])
		for (let i = 1; i < list.length; i++) {
			const cur = await load(list[i])
			let n = 0
			for (let j = 0; j < cur.length; j += 4) if (Math.abs(cur[j] - prev[j]) + Math.abs(cur[j + 1] - prev[j + 1]) + Math.abs(cur[j + 2] - prev[j + 2]) > 48) n++
			out.push(n / (cur.length / 4))
			prev = cur
		}
		return out
	}, shots.map((s) => s.data))
	await diff.close()
	return shots.map((s, i) => ({ t: s.t, moved: moved[i] }))
}

/* ---------- the checks ---------- */

const RISE = 0.24
const wordCount = (s) => (s || '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
const holdFor = (n) => Math.max(1.5, 0.4 * n)

function check({ film, timeline, captions, source, pixels }) {
	const fps = film?.fps ?? timeline?.fps ?? 24
	const bpm = film?.bpm ?? timeline?.bpm ?? 128
	const duration = film?.duration ?? timeline?.duration
	const spb = 60 / bpm, barLen = 4 * spb, eighth = spb / 2
	const frame = (t) => Math.round(t * fps)
	const gridFrame = (t, len) => Math.round(Math.round(t / len) * len * fps)
	const classify = (t) => (gridFrame(t, barLen) === frame(t) ? 'bar' : gridFrame(t, spb) === frame(t) ? 'beat' : gridFrame(t, eighth) === frame(t) ? '8th' : 'off')
	const scenes = film?.scenes || timeline?.scenes?.map((s) => ({ name: s.id, start: s.start, end: s.end })) || []
	// A cut is a frame where one scene ends and another starts. A layer that starts or ends on its own
	// (a caption layer over a held picture) is a layer boundary, reported apart and not held to the grid.
	const bounds = [...new Set(scenes.flatMap((s) => [s.start, s.end]).map((t) => +t.toFixed(5)))].filter((t) => t > 1e-6 && t < duration - 1e-6).sort((a, b) => a - b)
	const isCut = (t) => scenes.some((s) => frame(s.end) === frame(t)) && scenes.some((s) => frame(s.start) === frame(t))
	const cutTimes = bounds.filter(isCut)
	const describe = (t) => ({ t, frame: frame(t), on: classify(t), off8: frame(t) - gridFrame(t, eighth), names: scenes.filter((s) => frame(s.start) === frame(t) || frame(s.end) === frame(t)).map((s) => s.name) })
	const cuts = cutTimes.map(describe)
	const layers = bounds.filter((t) => !isCut(t)).map(describe)
	const offGrid = cuts.filter((c) => c.on === 'off')
	const sections = scenes.filter((s) => /^(opening|builtOn|install)$/.test(s.name) && classify(s.start) !== 'bar' && s.start > 0).map((s) => ({ name: s.name, start: s.start, on: classify(s.start) }))

	// Events per bar: cuts, caption in and out, sound cues.
	const events = [...bounds, ...(film?.cues || timeline?.cues || []).map((c) => c.t), ...(captions || []).flatMap((c) => [c.up, c.out])]
	const bars = Math.round(duration / barLen)
	const dead = []
	for (let b = 0; b < bars; b++) {
		const a = b * barLen, z = a + barLen
		const n = events.filter((t) => t >= a - 1e-6 && t < z - 1e-6).length
		let still = null
		if (pixels) {
			const s = pixels.filter((p) => p.t > a + 1e-6 && p.t <= z + 1e-6)
			still = s.every((p) => p.moved < 0.002)
		}
		if (n === 0 && (still === null || still)) dead.push({ bar: b + 1, from: +a.toFixed(3), events: n, still })
		else if (pixels && still) dead.push({ bar: b + 1, from: +a.toFixed(3), events: n, still, note: 'events but no visible change' })
	}

	// Words and holds.
	let words = null, short = [], windows = null
	if (captions?.length) {
		const caps = captions.map((c) => {
			const n = c.text != null ? wordCount(c.text.replace(/[*_]/g, '')) : null
			const rise = c.rise ?? RISE
			const exit = c.exit ?? 4 / fps
			const held = c.hold ?? +(c.out - exit - (c.up + rise)).toFixed(3)
			const need = c.need ?? (n != null ? holdFor(n) : null)
			return { id: c.id ?? c.key, text: c.text, words: n, up: c.up, out: c.out, held, need }
		})
		short = caps.filter((c) => c.need != null && c.held + 1e-6 < c.need)
		if (caps.every((c) => c.words != null)) {
			const total = caps.reduce((a, c) => a + c.words, 0)
			let worst = 0, at = 0
			for (const c0 of caps) {
				const n = caps.filter((c) => c.up >= c0.up - 1e-6 && c.up < c0.up + 30).reduce((a, c) => a + c.words, 0)
				if (n > worst) { worst = n; at = c0.up }
			}
			words = { total, per30: +((total / duration) * 30).toFixed(1), worstWindow: { from: +at.toFixed(2), words: worst } }
			windows = worst > 35 || words.per30 > 35
		}
	}
	return {
		duration, bpm, fps, bars,
		captionsFrom: source || null,
		cuts: { total: cuts.length, onBar: cuts.filter((c) => c.on === 'bar').length, onBeat: cuts.filter((c) => c.on === 'beat').length, on8th: cuts.filter((c) => c.on === '8th').length, off: offGrid.map(({ t, frame, off8, names }) => ({ t, frame, off8, names })) },
		layerBoundaries: { total: layers.length, offGrid: layers.filter((c) => c.on === 'off').map(({ t, off8, names }) => ({ t, off8, names })) },
		sectionsOffBar: sections,
		deadBars: dead,
		words, wordBudgetOver: windows,
		shortCaptions: short.map(({ id, text, words, held, need }) => ({ id, text, words, held, need })),
	}
}

let input
if (args.dump) {
	const j = JSON.parse(await readFile(resolve(args.dump), 'utf8'))
	// A timeline dump, or a film.mjs cues export ({ duration, bpm, fps, scenes, cues }).
	input = j.cuts ? { film: null, timeline: j, captions: j.captions, source: 'dump (timeline)' } : { film: j, timeline: null, captions: j.captions || null, source: j.captions ? 'dump' : null }
} else if (args.page) input = await fromPage()
else { console.error('usage: grid-check.mjs --root <repo> --page <path> [--pixels] [--json out.json] | --dump file.json'); process.exit(2) }
const report = { page: args.page || args.dump, ...check(input) }
if (args.json) await writeFile(resolve(args.json), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
