#!/usr/bin/env node
// node verdict.mjs <rundir> [--inventory <inventory.tsv>] [--tag "<text for the [..] suffix>"]
// The layout-match verdict per board, from the component measurements. A board MATCHES only if:
//   1. every board component is paired on live, and live has no extra components (app top bar and navigation are
//      out of scope already);
//   2. every pair sits within 4px in x and y of its board position, both measured from the content area's origin
//      (the page header's box, else the top-left of all components), and is within 8px in width; height is data;
//   3. no pair has a flagged styling property (spacing 2px, font size 0.5px, border presence, weight, colour, chrome).
// Writes <rundir>/verdicts.tsv and verdicts.md. With --inventory it appends one row per board in the screens
// inventory format (board, kind, route, status, mismatchPct, notes); later rows win, so earlier rows stay as history.
// The status and page mismatch % are carried over from the board's last valid row there.
import fs from 'node:fs'
import path from 'node:path'
import { compareProps, normalizeLegacy, addPage } from './compare.mjs'

const POS = 4, WIDTH = 8
const argv = process.argv.slice(2)
const dir = argv[0]
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null }
const files = fs.readdirSync(dir).filter((f) => /^Dq.*\.json$/.test(f) || /^[A-Z][a-z]+[A-Z].*\.json$/.test(f)).filter((f) => !/^(verdicts|results)/.test(f)).sort()

const origin = (r, side) => {
	const ph = r.components.find((c) => c.role === 'pageHeader')
	if (ph) return { x: ph[side].rect.x, y: ph[side].rect.y }
	const rects = r.components.map((c) => c[side].rect).concat(side === 'board' ? r.missingOnLive.map((c) => c.rect) : r.extraOnLive.map((c) => c.rect))
	return { x: Math.min(...rects.map((q) => q.x)), y: Math.min(...rects.map((q) => q.y)) }
}
const label = (c) => `${c.role}${c.title && !['tabs', 'table', 'toolbar'].includes(c.role) ? ' "' + c.title.slice(0, 40) + '"' : ''}`

const verdicts = []
for (const f of files) {
	const r = addPage(normalizeLegacy(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))))
	// A board that draws only the app's top bar or navigation has no component in scope: no verdict.
	if (!r.components || (r.components.filter((c) => c.role !== 'page').length === 0 && r.missingOnLive.length === 0)) continue
	const ob = origin(r, 'board'), ol = origin(r, 'live')
	const failing = []
	for (const c of r.components) {
		const reasons = []
		// The page header defines the origin; its own position is its title's, already compared as titleX/titleY.
		if (c.role === 'page') {
			// The page itself has no position; only its styling counts.
		} else if (c.role !== 'pageHeader' && c.role !== 'dialog' && c.role !== 'dialog-card') {
			const dx = Math.round(((c.live.rect.x - ol.x) - (c.board.rect.x - ob.x)) * 10) / 10
			const dy = Math.round(((c.live.rect.y - ol.y) - (c.board.rect.y - ob.y)) * 10) / 10
			if (Math.abs(dx) > POS) reasons.push(`x ${dx > 0 ? '+' : ''}${dx}`)
			if (Math.abs(dy) > POS) reasons.push(`y ${dy > 0 ? '+' : ''}${dy}`)
		} else if (c.role !== 'pageHeader') {
			// A dialog is placed in the viewport, not in the content area.
			const dx = Math.round((c.live.rect.x - c.board.rect.x) * 10) / 10, dy = Math.round((c.live.rect.y - c.board.rect.y) * 10) / 10
			if (Math.abs(dx) > POS) reasons.push(`x ${dx > 0 ? '+' : ''}${dx}`)
			if (Math.abs(dy) > POS) reasons.push(`y ${dy > 0 ? '+' : ''}${dy}`)
		}
		const rows = compareProps(c.board, c.live)
		for (const x of rows) {
			if (x.prop === 'rect.w' && Math.abs(x.delta) > WIDTH) { reasons.push(`width ${x.board}>${x.live}`); continue }
			if (x.flag && x.prop !== 'rect.w') reasons.push(`${x.prop} ${fmt(x.board)}>${fmt(x.live)}`)
		}
		if (reasons.length) failing.push({ comp: label(c.board), reasons, positionOnly: reasons.every((s) => /^[xy] /.test(s)) })
	}
	for (const m of r.missingOnLive) failing.push({ comp: label(m), reasons: ['missing on live'] })
	for (const e of r.extraOnLive) failing.push({ comp: label(e), reasons: ['extra on live'] })
	verdicts.push({ board: r.board, route: r.url, match: failing.length === 0, failing, components: r.components.length + r.missingOnLive.length })
}

const matched = verdicts.filter((v) => v.match).length
const tsv = ['board\tverdict\tfailing\tcomponents\tfailing_detail']
const md = [`# Component-measured layout verdicts`, '', `${matched} of ${verdicts.length} boards match. A board matches only when every component pairs, sits within ${POS}px (x, y from the content origin) and ${WIDTH}px (width), and passes every styling threshold.`, '', '| board | verdict | failing / components | failing components |', '|---|---|---|---|']
for (const v of verdicts) {
	const detail = v.failing.map((x) => `${x.comp}: ${x.reasons.slice(0, 4).join(', ')}${x.reasons.length > 4 ? ` (+${x.reasons.length - 4})` : ''}`)
	tsv.push([v.board, v.match ? 'MATCH' : 'NO-MATCH', v.failing.length, v.components, detail.join(' | ')].join('\t'))
	md.push(`| ${v.board} | ${v.match ? 'MATCH' : 'NO-MATCH'} | ${v.failing.length} / ${v.components} | ${detail.join('<br>')} |`)
}
fs.writeFileSync(path.join(dir, 'verdicts.tsv'), tsv.join('\n') + '\n')
fs.writeFileSync(path.join(dir, 'verdicts.md'), md.join('\n') + '\n')

const inv = opt('inventory')
if (inv) {
	const tag = opt('tag') || ''
	const last = {}
	for (const line of fs.readFileSync(inv, 'utf8').split('\n')) {
		const c = line.split('\t')
		if (c.length >= 4 && ['built', 'partial', 'missing', 'accepted', 'measured', 'done'].includes(c[3].trim())) last[c[0]] = c
	}
	const out = []
	for (const v of verdicts) {
		const prev = last[v.board]
		if (!prev) continue
		const note = v.match
			? `layout match: component-measured: all ${v.components} components pair within ${POS}px and pass the styling thresholds`
			: `no layout match: component-measured: ${v.failing.length} components: ${v.failing.map((x) => `${x.comp} (${x.reasons.slice(0, 3).join(', ')})`).join('; ')}`
		out.push([v.board, prev[1], prev[2], prev[3], prev[4] ?? '', `${note.replace(/[\t\n]/g, ' ')}${tag ? ` [${tag}]` : ''}`].join('\t'))
	}
	if (out.length) fs.appendFileSync(inv, out.join('\n') + '\n')
	console.log(`inventory: appended ${out.length} rows to ${inv}`)
}
console.log(`verdict: ${matched} of ${verdicts.length} boards match`)
function fmt (v) { return v === null || v === undefined ? '-' : typeof v === 'object' ? JSON.stringify(v) : String(v) }
