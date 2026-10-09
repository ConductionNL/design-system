#!/usr/bin/env node
/**
 * Renders a film in each language and with or without the voice-over, in one go.
 *
 *   node variants.mjs --root <repo> --page preview/films/<slug>/index.html --outdir <dir>
 *                     [--lang nl,en] [--voice on,off] [--name <slug>] [--check 1]
 *                     [--scale 0.5] [--blur 4] [--workers 6] [--bitrate 10M]
 *
 * --lang and --voice take one value or both; the default is all four: nl and en, each with and
 * without the voice-over. Without the voice-over every written word stays on screen and the music
 * no longer ducks. Each variant gets its own cue list and mix, then its render:
 *
 *   <outdir>/<name>-<lang>-voice.mp4     <outdir>/<name>-<lang>-novoice.mp4
 *
 * The page reads ?lang= and ?voice=0 (see variant() in preview/films/_lib/stage.js). A language the
 * film does not list in film.langs is skipped and reported, never rendered in the wrong language.
 * --check 1 only exports the cue lists, so you can see which variants exist before a long render.
 * Variants render one after the other, so the memory a render needs is the memory of one render.
 */
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1]
if (!args.page || !args.outdir) {
	console.error('usage: variants.mjs --root <repo> --page <path> --outdir <dir> [--lang nl,en] [--voice on,off] [--check 1]')
	process.exit(2)
}

const HERE = dirname(fileURLToPath(import.meta.url))
const root = resolve(args.root || process.cwd())
const outdir = resolve(args.outdir)
const name = args.name || basename(dirname(args.page))
const langs = (args.lang || 'nl,en').split(',').map((s) => s.trim()).filter(Boolean)
const voices = (args.voice || 'on,off').split(',').map((s) => s.trim() === 'on')
const PASS = ['scale', 'blur', 'shutter', 'workers', 'bitrate', 'preset', 'fps']

const node = (script, a) => new Promise((ok, fail) => {
	const p = spawn(process.execPath, [join(HERE, script), ...a], { stdio: ['ignore', 'pipe', 'inherit'] })
	let out = ''
	p.stdout.on('data', (d) => { out += d })
	p.on('close', (c) => (c === 0 ? ok(out.trim()) : fail(new Error(`${script} exited ${c}`))))
})

await mkdir(outdir, { recursive: true })
const done = [], skipped = []
for (const lang of langs) {
	for (const voice of voices) {
		const id = `${name}-${lang}-${voice ? 'voice' : 'novoice'}`
		const page = `${args.page}${args.page.includes('?') ? '&' : '?'}lang=${lang}${voice ? '' : '&voice=0'}`
		const cues = join(outdir, `${id}.cues.json`)
		await node('film.mjs', ['cues', '--root', root, '--page', page, '--out', cues])
		const meta = JSON.parse(await readFile(cues, 'utf8'))
		if (!(meta.langs || []).includes(lang)) {
			skipped.push({ id, reason: `the film has ${(meta.langs || []).join(', ') || 'no listed language'}, not ${lang}` })
			continue
		}
		if (args.check) { done.push({ id, cues }); continue }
		const mix = join(outdir, `${id}.wav`)
		const out = join(outdir, `${id}.mp4`)
		process.stderr.write(`${id}: scoring\n`)
		await node('score.mjs', ['--cues', cues, '--out', mix, '--root', root])
		process.stderr.write(`${id}: rendering\n`)
		const pass = PASS.flatMap((k) => (args[k] ? [`--${k}`, args[k]] : []))
		await node('film.mjs', ['render', '--root', root, '--page', page, '--out', out, '--audio', mix, ...pass])
		done.push({ id, out, mix })
	}
}
await writeFile(join(outdir, `${name}.variants.json`), JSON.stringify({ page: args.page, done, skipped }, null, 2))
console.log(JSON.stringify({ done: done.map((d) => d.out || d.cues), skipped }, null, 2))
if (!done.length) process.exit(1)
