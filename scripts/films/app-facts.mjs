#!/usr/bin/env node
/**
 * What an app can do and which screens show it, as one short digest for a film brief.
 *
 *   node app-facts.mjs <app> [--root <repo>] [--status built] [--screens 1] [--json 1]
 *
 * Reads preview/screens/capabilities.json and preview/screens/screens.json from --root when they are
 * there, else the live copies on identity.conduction.nl (the same files behind /capabilities and
 * /screens). Those files are 5.5 MB and 1.9 MB; never read them whole into a conversation, run this.
 *
 * --status   which capabilities to list: built (default), building, specified, all
 * --screens  1 lists every screen of the app with its page and thumbnail
 * --json     1 prints the digest as JSON instead of text
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [app, ...rest] = process.argv.slice(2)
const args = {}
for (let i = 0; i < rest.length; i += 2) args[rest[i].replace(/^--/, '')] = rest[i + 1]
if (!app || app.startsWith('--')) {
	console.error('usage: app-facts.mjs <app> [--root <repo>] [--status built|building|specified|all] [--screens 1] [--json 1]')
	process.exit(2)
}

const SITE = 'https://identity.conduction.nl'
async function load(file) {
	const local = args.root && join(resolve(args.root), 'preview/screens', file)
	if (local && existsSync(local)) return JSON.parse(await readFile(local, 'utf8'))
	const res = await fetch(`${SITE}/screens/${file}`)
	if (!res.ok) throw new Error(`${SITE}/screens/${file}: HTTP ${res.status}`)
	return res.json()
}

const [caps, screens] = await Promise.all([load('capabilities.json'), load('screens.json')])
const meta = caps.apps[app]
if (!meta) {
	console.error(`no app "${app}"; known: ${Object.keys(caps.apps).join(', ')}`)
	process.exit(1)
}
const status = args.status || 'built'
const capList = Object.values(caps.capabilities).filter((c) => c.app === app && (status === 'all' || c.status === status))
const boards = Object.values(screens.boards).filter((b) => b.app === app)
const boardById = Object.fromEntries(boards.map((b) => [b.id, b]))
const features = Object.values(caps.features)
	.filter((f) => f.app === app && f.slug !== '_internal')
	.map((f) => ({ title: f.title, titleNl: f.titleNl, caps: capList.filter((c) => c.feature === `${app}/${f.slug}`) }))
	.filter((f) => f.caps.length)

const digest = {
	app, repo: meta.repoUrl, generated: caps.generated, status,
	counts: { capabilities: capList.length, features: features.length, screens: boards.length },
	features: features.map((f) => ({
		title: f.title, titleNl: f.titleNl,
		caps: f.caps.map((c) => ({ id: c.id, title: c.title, screens: c.screens.filter((s) => boardById[s]) })),
	})),
	screens: args.screens ? boards.map((b) => ({ id: b.id, title: b.title, blurb: b.blurb, page: `${SITE}/screens/${b.file}`, thumb: `${SITE}/screens/${b.thumb}` })) : undefined,
}

if (args.json) {
	console.log(JSON.stringify(digest, null, 1))
} else {
	const out = [`${app}  ${meta.repoUrl}  (capabilities.json of ${caps.generated})`,
		`${digest.counts.capabilities} ${status} capabilities in ${digest.counts.features} features; ${digest.counts.screens} screens`, '']
	for (const f of digest.features) {
		out.push(`## ${f.title}${f.titleNl && f.titleNl !== f.title ? ` / ${f.titleNl}` : ''}`)
		for (const c of f.caps) out.push(`- ${c.title}${c.screens.length ? `  [${c.screens.join(', ')}]` : ''}`)
		out.push('')
	}
	if (digest.screens) {
		out.push('## Screens (page, thumbnail)')
		for (const s of digest.screens) out.push(`- ${s.id}  ${s.title}: ${s.page}  ${s.thumb}`)
	}
	out.push(`Open a screen: ${SITE}/screens/board.html?id=<id>; the thumbnails are enough to see the layout.`)
	console.log(out.join('\n'))
}
