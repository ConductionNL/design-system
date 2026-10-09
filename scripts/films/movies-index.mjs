#!/usr/bin/env node
/**
 * Builds preview/movies/movies.json, the overview behind identity.conduction.nl/movies.
 *
 *   node scripts/films/movies-index.mjs        (from the repo root, after board-stills.mjs)
 *
 * One entry per folder in preview/films (an app or a brand piece). Each has directions: one per
 * storyboard (preview/films/<slug>/boards/<direction>/), with the slides board-stills.mjs drew
 * (preview/movies/boards.json). A film page, preview/films/<slug>[/<direction>]/index.html, is the
 * playable film; it belongs to the direction of the same name, or to the only direction there is.
 * Videos are preview/movies/media/<key>-<cut>.mp4 with <key> the page path, "/" as "-"
 * (dossiq/casework is dossiq-casework), and <cut> one of nl-voice, nl-novoice, en-voice, en-novoice,
 * animatic or 1080p. A poster is preview/movies/media/<key>.jpg.
 */
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FILMS = 'preview/films'
const MEDIA = 'preview/movies/media'
const isDir = (p) => existsSync(p) && statSync(p).isDirectory()
const meta = (html, re) => (html.match(re) || [])[1]?.trim() || ''
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const CUTS = ['nl-voice', 'nl-novoice', 'en-voice', 'en-novoice', '1080p', 'animatic']
const media = isDir(MEDIA) ? readdirSync(MEDIA).sort() : []
const boards = existsSync('preview/movies/boards.json') ? JSON.parse(readFileSync('preview/movies/boards.json', 'utf8')) : {}

function page(path) {
	const html = readFileSync(join(FILMS, path, 'index.html'), 'utf8')
	const key = path.replace(/\//g, '-')
	return {
		key, path,
		title: unescape(meta(html, /<title>([^<]+)<\/title>/)),
		description: unescape(meta(html, /<meta name="description" content="([^"]*)"/)),
		lang: meta(html, /<html lang="([^"]+)"/) || 'en',
		play: `../films/${path}/index.html`,
		brief: existsSync(join(FILMS, path, 'BRIEF.md')) ? `../films/${path}/BRIEF.md` : null,
		sources: existsSync(join(FILMS, path, 'sources.json')) ? `../films/${path}/sources.json` : null,
		poster: media.includes(`${key}.jpg`) ? `media/${key}.jpg` : null,
		videos: media.filter((f) => f.endsWith('.mp4') && f.startsWith(`${key}-`)).map((f) => ({ file: `media/${f}`, cut: f.slice(key.length + 1, -4), bytes: statSync(join(MEDIA, f)).size })).sort((a, b) => CUTS.indexOf(a.cut) - CUTS.indexOf(b.cut)),
	}
}

const films = []
for (const slug of readdirSync(FILMS).sort()) {
	if (slug.startsWith('_') || !isDir(join(FILMS, slug))) continue
	const dir = join(FILMS, slug)
	const pages = [
		...(existsSync(join(dir, 'index.html')) ? [page(slug)] : []),
		...readdirSync(dir).sort().filter((d) => existsSync(join(dir, d, 'index.html'))).map((d) => page(`${slug}/${d}`)),
	]
	const names = isDir(join(dir, 'boards')) ? readdirSync(join(dir, 'boards')).sort().filter((v) => existsSync(join(dir, 'boards', v, 'board.js'))) : []
	const directions = names.map((v) => {
		const b = boards[`${slug}-${v}`] || {}
		return { direction: v, title: b.title || v, audience: b.audience || null, persona: b.persona || null, format: b.format || '16x9', storyboard: `../films/board.html?film=${slug}&v=${v}`, frames: b.frames || [] }
	})
	// A page belongs to the direction it is named after, or to the only direction there is.
	const loose = []
	for (const p of pages) {
		const d = directions.find((x) => p.path === `${slug}/${x.direction}`) || (p.path === slug && directions.length === 1 ? directions[0] : null)
		if (d) d.film = p
		else loose.push(p)
	}
	if (!pages.length && !directions.length) continue
	const brief = existsSync(join(dir, 'BRIEF.md')) ? `../films/${slug}/BRIEF.md` : null
	films.push({ slug, title: pages[0]?.title || slug[0].toUpperCase() + slug.slice(1), brief, directions, films: loose })
}

writeFileSync('preview/movies/movies.json', JSON.stringify({ films }, null, 1) + '\n')
const n = (f) => films.reduce((s, x) => s + f(x), 0)
console.log(`${films.length} films, ${n((f) => f.directions.length)} directions, ${n((f) => f.directions.reduce((s, d) => s + d.frames.length, 0))} slides, ${n((f) => f.films.length + f.directions.filter((d) => d.film).length)} playable, ${media.filter((m) => m.endsWith('.mp4')).length} videos`)
