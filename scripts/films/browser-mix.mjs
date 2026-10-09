#!/usr/bin/env node
/**
 * Writes the sound for film pages played in the browser: mix.mp3 beside each page, plus
 * mix-novoice.mp3 when the film has a voice-over. The player in _lib/stage.js picks them up.
 *
 *   node browser-mix.mjs --root <repo> [--only dossiq/casework,archiefwaardig]
 *
 * Each mix comes from the page's own cue list through score.mjs, so it is the sound of the render.
 * Run it again after changing a film's cues, music or voice takes.
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1]
const HERE = dirname(fileURLToPath(import.meta.url))
const root = resolve(args.root || join(HERE, '../..'))
const FILMS = join(root, 'preview/films')
const tmp = join(root, '.browser-mix.tmp')

const run = (bin, a) => new Promise((ok, fail) => {
	const p = spawn(bin, a, { stdio: ['ignore', 'ignore', 'pipe'] })
	let err = ''
	p.stderr.on('data', (d) => { err += d })
	p.on('close', (c) => (c === 0 ? ok() : fail(new Error(err.slice(-600)))))
})

const pages = []
for (const a of readdirSync(FILMS).sort()) {
	if (a.startsWith('_') || a.includes('.')) continue
	if (existsSync(join(FILMS, a, 'index.html'))) pages.push(a)
	for (const b of readdirSync(join(FILMS, a))) if (existsSync(join(FILMS, a, b, 'index.html'))) pages.push(`${a}/${b}`)
}
const only = args.only ? new Set(args.only.split(',')) : null
mkdirSync(tmp, { recursive: true })
for (const path of pages) {
	if (only && !only.has(path)) continue
	try {
		let hadVoice = false
		for (const voice of [true, false]) {
			if (!voice && !hadVoice) break // no voice-over, so no second mix
			const page = `preview/films/${path}/index.html${voice ? '' : '?voice=0'}`
			const cues = join(tmp, 'cues.json'), wav = join(tmp, 'mix.wav')
			await run(process.execPath, [join(HERE, 'film.mjs'), 'cues', '--root', root, '--page', page, '--out', cues])
			if (voice) hadVoice = (JSON.parse(readFileSync(cues, 'utf8')).music?.voice || []).length > 0
			await run(process.execPath, [join(HERE, 'score.mjs'), '--cues', cues, '--out', wav, '--root', root])
			const name = voice ? 'mix.mp3' : 'mix-novoice.mp3'
			await run(ffmpegPath, ['-y', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', join(FILMS, path, name)])
			console.log(`${path}: ${name}`)
		}
	} catch (e) {
		console.error(`${path}: ${e.message.split('\n')[0]}`)
	}
}
rmSync(tmp, { recursive: true, force: true })
