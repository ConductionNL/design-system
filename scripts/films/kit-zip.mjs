#!/usr/bin/env node
/**
 * Packs the film kit for download from identity.conduction.nl/movies: the film skill, the film bible,
 * the engine, the template and these scripts, as browsable files and as one zip.
 *
 *   node scripts/films/kit-zip.mjs <site-dir>      (run from the repo root; stage-site.mjs calls it)
 *
 * Writes <site-dir>/movies/kit/<path> for every file and <site-dir>/movies/conduction-film-kit.zip.
 * Node built-ins only, so the site build needs no extra install. Ruben's voice model, his recordings
 * and the training data are not in this repository and so can never end up in the kit.
 */
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { deflateRawSync, crc32 } from 'node:zlib'

const site = process.argv[2] || '_site'
const SOURCES = ['.claude/skills/film', 'preview/films/BIBLE.md', 'preview/films/_lib', 'preview/films/_template', 'scripts/films']
const SKIP = new Set(['node_modules', 'storyboard'])

const files = []
const walk = (p) => {
	const st = statSync(p, { throwIfNoEntry: false })
	if (!st) return
	if (st.isDirectory()) { for (const n of readdirSync(p).sort()) if (!SKIP.has(n) && !n.startsWith('.')) walk(join(p, n)) }
	else files.push(p)
}
SOURCES.forEach(walk)

// A plain zip (deflate, no zip64): every entry is small and the kit is a few hundred files.
const local = [], central = []
let offset = 0
for (const path of files) {
	const data = readFileSync(path)
	const out = join(site, 'movies/kit', path)
	mkdirSync(dirname(out), { recursive: true })
	writeFileSync(out, data)
	const packed = deflateRawSync(data, { level: 9 })
	const name = Buffer.from(`conduction-film-kit/${path}`)
	const crc = crc32(data)
	const head = Buffer.alloc(30)
	head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(8, 8)
	head.writeUInt32LE(0, 10); head.writeUInt32LE(crc, 14); head.writeUInt32LE(packed.length, 18); head.writeUInt32LE(data.length, 22)
	head.writeUInt16LE(name.length, 26); head.writeUInt16LE(0, 28)
	local.push(head, name, packed)
	const cen = Buffer.alloc(46)
	cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(8, 10)
	cen.writeUInt32LE(0, 12); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(packed.length, 20); cen.writeUInt32LE(data.length, 24)
	cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(offset, 42)
	central.push(cen, name)
	offset += head.length + name.length + packed.length
}
const cenSize = central.reduce((n, b) => n + b.length, 0)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10)
end.writeUInt32LE(cenSize, 12); end.writeUInt32LE(offset, 16)
const zip = Buffer.concat([...local, ...central, end])
mkdirSync(join(site, 'movies'), { recursive: true })
writeFileSync(join(site, 'movies/conduction-film-kit.zip'), zip)
writeFileSync(join(site, 'movies/kit/files.json'), JSON.stringify(files))
console.log(`Film kit: ${files.length} files, ${(zip.length / 1024).toFixed(0)} KiB zip`)
