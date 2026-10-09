#!/usr/bin/env node
/**
 * Captures a time-driven film page frame by frame and encodes it.
 *
 *   node film.mjs render --root <dir> --page <path> --out film.mp4 [--format 16x9] [--fps 25]
 *                        [--blur 4] [--shutter 0.5] [--scale 1] [--workers 6] [--audio mix.wav]
 *   node film.mjs stills --root <dir> --page <path> --times 0.5,1,2 --outdir dir [--scale 0.5]
 *   node film.mjs sheet  --root <dir> --page <path> --every 0.5 --out sheet.png [--cols 6] [--scale 0.25]
 *   node film.mjs cues   --root <dir> --page <path> --out cues.json
 *
 * The page must expose window.__ready, window.__render(t) and window.__film
 * ({ duration, fps, width, height, cues }). See lib/stage.js.
 */
import { chromium } from 'playwright-core'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, mkdir, rm, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve, normalize } from 'node:path'
import { homedir, cpus } from 'node:os'

const [cmd, ...rest] = process.argv.slice(2)
const args = {}
for (let i = 0; i < rest.length; i += 2) args[rest[i].replace(/^--/, '')] = rest[i + 1]

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' }

function serve(root) {
	const base = resolve(root)
	const server = createServer(async (req, res) => {
		const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
		const file = join(base, path)
		if (!file.startsWith(base)) { res.writeHead(403).end(); return }
		try {
			const body = await readFile(file)
			res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(body)
		} catch { res.writeHead(404).end() }
	})
	return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)))
}

function chromePath() {
	const dir = join(homedir(), '.cache/ms-playwright')
	for (const v of ['1243', '1234', '1228']) {
		const p = join(dir, `chromium_headless_shell-${v}/chrome-headless-shell-linux64/chrome-headless-shell`)
		if (existsSync(p)) return p
	}
	throw new Error('No chromium headless shell found under ~/.cache/ms-playwright')
}

async function openPage(browser, url, width, height) {
	const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
	const errors = []
	page.on('pageerror', (e) => errors.push(String(e)))
	page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
	page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
	await page.goto(url)
	try {
		await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 })
	} catch (e) {
		throw new Error(`page never set __ready: ${errors.join(' | ') || e.message}`)
	}
	const cdp = await page.context().newCDPSession(page)
	return { page, cdp, errors }
}

async function grab({ page, cdp }, t, width, height, scale) {
	await page.evaluate((t) => window.__render(t), t)
	const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width, height, scale } })
	return Buffer.from(data, 'base64')
}

function run(bin, argv) {
	return new Promise((ok, fail) => {
		const p = spawn(bin, argv, { stdio: ['ignore', 'ignore', 'pipe'] })
		let err = ''
		p.stderr.on('data', (d) => { err += d })
		p.on('close', (code) => (code === 0 ? ok() : fail(new Error(`${bin} exited ${code}\n${err.slice(-2000)}`))))
	})
}

async function setup() {
	const root = args.root || process.cwd()
	const server = await serve(root)
	const port = server.address().port
	const page = args.page.replace(/^\//, '')
	const url = `http://127.0.0.1:${port}/${page}${page.includes('?') ? '&' : '?'}capture${args.format ? `&format=${args.format}` : ''}`
	const browser = await chromium.launch({ executablePath: chromePath(), args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] })
	const probe = await openPage(browser, url, 1080, 1920)
	const meta = await probe.page.evaluate(() => JSON.parse(JSON.stringify(window.__film)))
	await probe.page.close()
	return { server, browser, url, meta }
}

async function render() {
	const { server, browser, url, meta } = await setup()
	const fps = +(args.fps || meta.fps)
	const blur = +(args.blur || 1)
	const shutter = +(args.shutter || 0.5)
	const scale = +(args.scale || 1)
	const workers = +(args.workers || Math.max(2, Math.min(8, cpus().length - 2)))
	const n = Math.round(meta.duration * fps)
	const total = n * blur
	const dir = resolve(args.frames || `${args.out}.frames`)
	await rm(dir, { recursive: true, force: true })
	await mkdir(dir, { recursive: true })
	const t0 = Date.now()
	let done = 0
	const timeOf = (j) => {
		const i = Math.floor(j / blur), k = j % blur
		const off = blur > 1 ? ((k + 0.5) / blur - 0.5) * (shutter / fps) : 0
		return Math.min(meta.duration - 1e-4, Math.max(0, i / fps + off))
	}
	const chunk = Math.ceil(total / workers)
	const allErrors = []
	await Promise.all(Array.from({ length: workers }, async (_, w) => {
		const from = w * chunk, to = Math.min(total, from + chunk)
		if (from >= to) return
		const p = await openPage(browser, url, meta.width, meta.height)
		for (let j = from; j < to; j++) {
			const png = await grab(p, timeOf(j), meta.width, meta.height, scale)
			await writeFile(join(dir, String(j).padStart(6, '0') + '.png'), png)
			done++
			if (done % 200 === 0) process.stderr.write(`  ${done}/${total} frames, ${((Date.now() - t0) / done).toFixed(0)} ms each\n`)
		}
		allErrors.push(...p.errors)
		await p.page.close()
	}))
	await browser.close()
	server.close()
	if (allErrors.length) console.error('page errors:', [...new Set(allErrors)].slice(0, 10))
	// Social delivery recipe (see the film's sources.json): H.264 High@4.1, two-pass VBR
	// 10 Mbps, closed GOP of 2 s, BT.709 tags, AAC-LC 48 kHz 192 kbps, moov first.
	const blurVf = blur > 1 ? [`tmix=frames=${blur}:weights=${Array(blur).fill(1).join(' ')}`, `select='eq(mod(n\\,${blur})\\,${blur - 1})'`, `setpts=N/(${fps}*TB)`] : []
	const encode = async (out, crop) => {
		const vf = [...blurVf, ...(crop ? [crop] : []), `fps=${fps}`, 'format=yuv420p'].join(',')
		const log = join(dir, `x264-${crop ? 'feed' : 'main'}`)
		const common = ['-framerate', String(fps * blur), '-i', join(dir, '%06d.png')]
		const v = ['-vf', vf, '-c:v', 'libx264', '-preset', args.preset || 'slow', '-profile:v', 'high', '-level:v', '4.1', '-b:v', args.bitrate || '10M', '-maxrate', '12M', '-bufsize', '24M', '-g', String(fps * 2), '-keyint_min', String(fps), '-bf', '2', '-x264-params', 'open-gop=0', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-passlogfile', log]
		await run(ffmpegPath, ['-y', ...common, ...v, '-pass', '1', '-an', '-f', 'mp4', '/dev/null'])
		const a = args.audio ? ['-i', args.audio] : []
		const aOut = args.audio ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', String(meta.duration)] : []
		await run(ffmpegPath, ['-y', ...common, ...a, ...v, '-pass', '2', ...aOut, '-movflags', '+faststart', resolve(out)])
	}
	await encode(args.out)
	// 4:5 feed cut from the same frames: the window at y 120-1470 keeps the unified safe box intact.
	const even = (v) => Math.round(v / 2) * 2 // yuv420p needs even dimensions, also at proof scales
	if (args.feed && meta.height === 1920) await encode(args.feed, `crop=${even(1080 * scale)}:${even(1350 * scale)}:0:${even(120 * scale)}`)
	if (!args.keep) await rm(dir, { recursive: true, force: true })
	const s = await stat(resolve(args.out))
	console.log(JSON.stringify({ out: resolve(args.out), feed: args.feed ? resolve(args.feed) : undefined, frames: n, blur, fps, seconds: (Date.now() - t0) / 1000, bytes: s.size }))
}

async function stills() {
	const { server, browser, url, meta } = await setup()
	const scale = +(args.scale || 0.5)
	const outdir = resolve(args.outdir)
	await mkdir(outdir, { recursive: true })
	const p = await openPage(browser, url, meta.width, meta.height)
	const times = args.times.split(',').map(Number)
	const files = []
	for (const t of times) {
		const f = join(outdir, `t${t.toFixed(3).replace('.', '_')}.png`)
		await writeFile(f, await grab(p, t, meta.width, meta.height, scale))
		files.push(f)
	}
	await browser.close()
	server.close()
	if (p.errors.length) console.error('page errors:', [...new Set(p.errors)].slice(0, 10))
	console.log(JSON.stringify({ files }))
}

async function sheet() {
	const { server, browser, url, meta } = await setup()
	const every = +(args.every || 0.5)
	const scale = +(args.scale || 0.25)
	const cols = +(args.cols || 6)
	const tmp = resolve(`${args.out}.tmp`)
	await rm(tmp, { recursive: true, force: true })
	await mkdir(tmp, { recursive: true })
	const p = await openPage(browser, url, meta.width, meta.height)
	const times = []
	for (let t = +(args.from || 0); t <= +(args.to || meta.duration) - 1e-6; t += every) times.push(+t.toFixed(4))
	let i = 0
	// The time stamp is drawn inside the page (the bundled ffmpeg has no drawtext filter).
	const stamp = (t) => p.page.evaluate((t) => {
		let n = document.getElementById('__sheet_stamp')
		if (!n) {
			n = document.createElement('div')
			n.id = '__sheet_stamp'
			n.style.cssText = 'position:fixed;left:0;top:0;padding:6px 10px;background:#000;color:#fff;font:600 28px/1 monospace;z-index:99'
			document.body.appendChild(n)
		}
		n.textContent = t.toFixed(3) + ' s'
	}, t)
	for (const t of times) {
		await p.page.evaluate((t) => window.__render(t), t)
		await stamp(t)
		const { data } = await p.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: meta.width, height: meta.height, scale } })
		await writeFile(join(tmp, String(i++).padStart(4, '0') + '.png'), Buffer.from(data, 'base64'))
	}
	await browser.close()
	server.close()
	const rows = Math.ceil(times.length / cols)
	await run(ffmpegPath, ['-y', '-framerate', '1', '-i', join(tmp, '%04d.png'), '-vf', `pad=iw+6:ih+6:3:3:color=white,tile=${cols}x${rows}`, '-frames:v', '1', resolve(args.out)])
	await rm(tmp, { recursive: true, force: true })
	if (p.errors.length) console.error('page errors:', [...new Set(p.errors)].slice(0, 10))
	console.log(JSON.stringify({ out: resolve(args.out), frames: times.length, cols, rows }))
}

async function cues() {
	const { server, browser, meta } = await setup()
	await browser.close()
	server.close()
	await writeFile(resolve(args.out), JSON.stringify({ variant: meta.variant, langs: meta.langs, duration: meta.duration, bpm: meta.bpm, fps: meta.fps, width: meta.width, height: meta.height, safe: meta.safe, scenes: meta.scenes, cues: meta.cues, music: meta.music, board: meta.board }, null, 2))
	console.log(JSON.stringify({ out: resolve(args.out), cues: meta.cues.length }))
}

const commands = { render, stills, sheet, cues }
if (!commands[cmd]) {
	console.error('usage: film.mjs render|stills|sheet|cues --root <dir> --page <path> ...')
	process.exit(2)
}
commands[cmd]().catch((e) => { console.error(e.stack || e.message); process.exit(1) })
