#!/usr/bin/env node
/**
 * Builds the storyboard review page for a film: three (or more) variants side by
 * side, one engine-rendered still per scene, with a pick and per-scene notes kept
 * in the artifact's db capability.
 *
 *   node storyboard.mjs --variants variants.json --film film.json --out <dir>
 *
 * variants.json: { variants: [{ variant, title, logline, references, words_total,
 *   scenes: [{ id, title, start, end, bars, words, motion, sound, apps, borrow, still }] }] }
 * film.json: { title, eyebrow, headline, lede, spec: [..], footer, bpm, fps, duration }
 *
 * Writes <dir>/index.html and <dir>/stills/<variant>/<file>.png, and prints the
 * `files` map to pass to the Artifact tool (publish with capabilities { db: {} }).
 * Read the picks back with ArtifactData: picks/current and the notes collection.
 */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1]
for (const k of ['variants', 'film', 'out']) if (!args[k]) { console.error(`missing --${k}`); process.exit(2) }

const here = dirname(fileURLToPath(import.meta.url))
const template = await readFile(join(here, 'storyboard/template.html'), 'utf8')
const { variants } = JSON.parse(await readFile(resolve(args.variants), 'utf8'))
const film = JSON.parse(await readFile(resolve(args.film), 'utf8'))
const out = resolve(args.out)
const files = {}

const repo = resolve(here, '../..')
for (const v of variants) {
	// An app film shows the app's real glyph in its header hex, read from the brand's glyph file.
	// A film that is not one app (the ConNext film) can name any brand mark instead: glyphFile, relative to brand/assets.
	if ((v.app || v.glyphFile) && !v.glyph) {
		const file = v.glyphFile ? join(repo, 'brand/assets', v.glyphFile) : join(repo, 'brand/assets/apps/glyphs', `${v.app}.svg`)
		const svg = await readFile(file, 'utf8')
		const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 24 24'
		const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/g, '').replace(/<!--[\s\S]*?-->/g, '')
			.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"').trim()
		v.glyph = { viewBox, inner }
	}
	await mkdir(join(out, 'stills', v.variant), { recursive: true })
	for (const s of v.scenes) {
		const rel = `stills/${v.variant}/${s.id}-${basename(s.still)}`
		await copyFile(s.still, join(out, rel))
		files[rel] = join(out, rel)
		s.still = rel
	}
}

const data = JSON.stringify({ film, variants }).replace(/</g, '\\u003c')
const html = template.replace('__TITLE__', film.title.replace(/[<&]/g, '')).replace('__DATA__', data)
await writeFile(join(out, 'index.html'), html)
console.log(JSON.stringify({ page: join(out, 'index.html'), files }, null, 2))
