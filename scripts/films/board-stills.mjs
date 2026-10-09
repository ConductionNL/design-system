#!/usr/bin/env node
/**
 * Draws every storyboard frame (the slides) of every film as a JPEG for identity.conduction.nl/movies,
 * so a film can be judged on its slides before it is rendered.
 *
 *   node board-stills.mjs --root <repo> [--only pipelinq,dossiq] [--scale 0.3]
 *
 * For each preview/films/<slug>/boards/<direction>/board.js it writes
 * preview/movies/boards/<slug>-<direction>-<n>.jpg and records the board's meta (title, audience) and
 * each frame's title in preview/movies/boards.json. Run movies-index.mjs after it.
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1]
const HERE = dirname(fileURLToPath(import.meta.url))
const root = resolve(args.root || join(HERE, '../..'))
const FILMS = join(root, 'preview/films')
const OUT = join(root, 'preview/movies/boards')
const INDEX = join(root, 'preview/movies/boards.json')
const only = args.only ? new Set(args.only.split(',')) : null
const scale = args.scale || '0.3'
const tmp = join(root, '.board-stills.tmp')

const run = (bin, a) => new Promise((ok, fail) => {
	const p = spawn(bin, a, { stdio: ['ignore', 'pipe', 'pipe'] })
	let out = '', err = ''
	p.stdout.on('data', (d) => { out += d })
	p.stderr.on('data', (d) => { err += d })
	p.on('close', (c) => (c === 0 ? ok(out.trim()) : fail(new Error(`${a.slice(0, 2).join(' ')}: ${err.slice(-800)}`))))
})
const film = (a) => run(process.execPath, [join(HERE, 'film.mjs'), ...a])

const index = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : {}
mkdirSync(OUT, { recursive: true })
for (const slug of readdirSync(FILMS).sort()) {
	if (slug.startsWith('_') || (only && !only.has(slug)) || !existsSync(join(FILMS, slug, 'boards'))) continue
	for (const v of readdirSync(join(FILMS, slug, 'boards')).sort()) {
		if (!existsSync(join(FILMS, slug, 'boards', v, 'board.js'))) continue
		const page = `preview/films/board.html?film=${slug}&v=${v}`
		const key = `${slug}-${v}`
		try {
			rmSync(tmp, { recursive: true, force: true })
			mkdirSync(tmp, { recursive: true })
			await film(['cues', '--root', root, '--page', page, '--out', join(tmp, 'meta.json')])
			const { board } = JSON.parse(readFileSync(join(tmp, 'meta.json'), 'utf8'))
			const frames = board.boards
			const { files } = JSON.parse(await film(['stills', '--root', root, '--page', page, '--times', frames.map((b) => b.stillAt).join(','), '--outdir', tmp, '--scale', scale]))
			for (const f of readdirSync(OUT)) if (f.startsWith(`${key}-`)) rmSync(join(OUT, f))
			const shots = []
			for (let i = 0; i < files.length; i++) {
				const name = `${key}-${String(i + 1).padStart(2, '0')}.jpg`
				await run(ffmpegPath, ['-loglevel', 'error', '-y', '-i', files[i], '-q:v', '4', join(OUT, name)])
				const b = frames[i]
				shots.push({ file: `boards/${name}`, id: b.id, title: b.title || b.meta?.title || b.id, caption: typeof b.caption === 'string' ? b.caption : undefined })
			}
			const m = board.meta || {}
			index[key] = { slug, direction: v, title: m.title || slug, audience: m.audience?.name || null, persona: m.audience?.persona || null, lang: m.lang || null, format: m.format || '9x16', frames: shots }
			console.log(`${key}: ${shots.length} slides`)
		} catch (e) {
			console.error(`${key}: ${e.message.split('\n')[0]}`)
		}
	}
}
rmSync(tmp, { recursive: true, force: true })
writeFileSync(INDEX, JSON.stringify(index, null, 1) + '\n')
