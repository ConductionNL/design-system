#!/usr/bin/env node
// node summarize.mjs <rundir>
// Reads every <Board>.json in <rundir> and writes:
//   fleet-summary.md   properties that differ the same way across many components (library candidates)
//   boards.md / boards.tsv   per board: components flagged, the 3 worst components with their flagged deltas
import fs from 'node:fs'
import path from 'node:path'
import { compareProps, scoreComponent, normalizeLegacy, addPage, elementRows, isRepeated, markListElements } from './compare.mjs'

const dir = process.argv[2]
const files = fs.readdirSync(dir).filter((f) => /^[A-Z][A-Za-z0-9]+\.json$/.test(f)).sort()
const groups = new Map()
const perBoard = []
const roleGroup = (c) => (c.role.startsWith('element') ? c.role : c.role === 'card' && c.board.title ? (c.board.depth ? 'card (nested, titled)' : 'widget/card (titled)') : c.role === 'card' ? (c.board.depth ? 'card (nested)' : 'card/tile (untitled)') : c.role)
// Generic property name: page-header button keys collapse to "btn.*".
const genericProp = (p) => p.replace(/^btn\.[^.]+\./, 'btn.*.')
const source = (c) => {
	if (c.role.startsWith('element')) return 'element (not attributed)'
	const lc = c.live.libClass || '', cls = c.live.cls || ''
	if (/^cn-|^nc-|^modal|^dialog/.test(cls) || /^cn-/.test(lc)) return 'library (nextcloud-vue ' + (cls.match(/cn-[a-z-]+/)?.[0] || lc) + ')'
	if (/^nc-|^modal|^dialog/.test(lc)) return 'library (' + lc + ')'
	return 'dossiq (' + (cls || 'unclassed') + ')'
}
for (const f of files) {
	const r = markListElements(addPage(normalizeLegacy(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))))
	// A toolbar row that holds a tab strip is the tab strip's row, already compared as 'tabs'.
	const inside = (o, i) => i.x >= o.x - 2 && i.y >= o.y - 2 && i.x + i.w <= o.x + o.w + 2 && i.y + i.h <= o.y + o.h + 2
	const tabsB = (r.components || []).filter((c) => c.role === 'tabs')
	r.components = (r.components || []).filter((c) => c.role !== 'toolbar' || !tabsB.some((t) => inside(c.board.rect, t.board.rect) || inside(c.live.rect, t.live.rect)))
	const comps = r.components || []
	// Re-apply the current comparison rules to the stored measurements, so a rule change needs no re-measure.
	for (const c of comps) {
		c.rows = compareProps(c.board, c.live)
		c.flagged = c.rows.filter((x) => x.flag).length
		c.score = scoreComponent(c.rows)
		if (c.live.title && c.board.title && c.live.title !== c.board.title && !['tabs', 'table', 'toolbar', 'pager', 'map'].includes(c.role)) c.name = `${c.board.title} ~ ${c.live.title}`
	}
	const els = (r.elements || []).map((e) => {
		const rows = elementRows(e)
		return { ...e, role: `element ${e.kind}`, name: `${e.kind} "${e.label || ''}"${e.inControl ? ` in "${e.inControl}"` : ''}`, rows, flagged: rows.filter((x) => x.flag).length, score: scoreComponent(rows) }
	})
	r.elements = els
	r.counts.flaggedComponents = comps.filter((c) => c.flagged).length
	r.counts.flaggedElements = els.filter((e) => e.flagged).length
	fs.writeFileSync(path.join(dir, f.replace(/\.json$/, '.md')), renderTable(r))
	for (const c of [...comps, ...els]) {
		for (const row of c.rows) {
			if (!row.flag) continue
			let dir
			if (/absent|extra/.test(row.flag)) dir = row.flag
			else if (typeof row.delta === 'number') dir = row.delta > 0 ? 'larger on live' : 'smaller on live'
			else dir = 'differs'
			const key = `${roleGroup(c)} | ${genericProp(row.prop)} | ${dir}`
			if (!groups.has(key)) groups.set(key, { key, role: roleGroup(c), prop: genericProp(row.prop), dir, comps: 0, boards: new Set(), pairs: new Map(), sources: new Map(), deltas: [] })
			const g = groups.get(key)
			g.comps++
			g.boards.add(r.board)
			const pv = `${fmt(row.board)} -> ${fmt(row.live)}`
			g.pairs.set(pv, (g.pairs.get(pv) || 0) + 1)
			const s = source(c)
			g.sources.set(s, (g.sources.get(s) || 0) + 1)
			if (typeof row.delta === 'number') g.deltas.push(row.delta)
		}
	}
	const worst = [...comps, ...els].sort((a, b) => b.score - a.score).slice(0, 3).filter((c) => c.score > 0)
	perBoard.push({ board: r.board, paired: r.counts.paired, flagged: r.counts.flaggedComponents + (r.counts.flaggedElements || 0), missing: r.missingOnLive.length + (r.missingElements || []).length, extra: r.extraOnLive.length + (r.extraElements || []).length, notMeasured: r.notMeasured ? r.notMeasured.length : null, worst })
}
const top = (m, n = 2) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`).join('; ')
const median = (a) => { if (!a.length) return ''; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const list = [...groups.values()].filter((g) => g.boards.size >= 3).sort((a, b) => b.boards.size - a.boards.size || b.comps - a.comps)
const lines = [`# Component diff: fleet summary (${files.length} boards)`, '', 'Systematic differences: the same property differing the same way on 3+ boards. Look and feel only; insets and gaps are measured from the card edge to rendered text, so they hold whatever DOM element carries the padding.', '',
	'| component | property | direction | components | boards | median delta | most common board -> live | likely source |', '|---|---|---|---|---|---|---|---|']
for (const g of list) lines.push(`| ${g.role} | ${g.prop} | ${g.dir} | ${g.comps} | ${g.boards.size} | ${median(g.deltas)} | ${top(g.pairs)} | ${top(g.sources, 1)} |`)
fs.writeFileSync(path.join(dir, 'fleet-summary.md'), lines.join('\n') + '\n')

const bl = ['# Per board', '', '| board | paired | flagged | missing on live | extra on live | not measured | worst components (flagged deltas) |', '|---|---|---|---|---|---|---|']
const tsv = ['board\tpaired\tflagged\tmissing\textra\tworst']
for (const b of perBoard) {
	const w = b.worst.map((c) => `**${c.role}: ${c.name}** (${c.rows.filter((r) => r.flag).slice(0, 5).map((r) => `${r.prop} ${fmt(r.board)}→${fmt(r.live)}`).join(', ')})`).join('<br>')
	bl.push(`| ${b.board} | ${b.paired} | ${b.flagged} | ${b.missing} | ${b.extra} | ${b.notMeasured ?? 'unknown'} | ${w} |`)
	tsv.push([b.board, b.paired, b.flagged, b.missing, b.extra, b.worst.map((c) => `${c.role}:${c.name}[${c.rows.filter((r) => r.flag).slice(0, 4).map((r) => `${r.prop} ${fmt(r.board)}>${fmt(r.live)}`).join('; ')}]`).join(' || ')].join('\t'))
}
fs.writeFileSync(path.join(dir, 'boards.md'), bl.join('\n') + '\n')
fs.writeFileSync(path.join(dir, 'boards.tsv'), tsv.join('\n') + '\n')
console.log(`boards ${files.length}, systematic groups ${list.length}`)
function renderTable (r) {
	const L = [`# ${r.board}  (${r.url})`, '', `components: board ${r.counts.boardComponents}, live ${r.counts.liveComponents}, paired ${r.counts.paired}, flagged ${r.counts.flaggedComponents}`, '']
	for (const c of [...r.components].sort((a, b) => b.score - a.score)) {
		L.push(`## ${c.role}: ${c.name}  [${c.matchedBy}]  flags ${c.flagged}, crop mismatch ${c.cropMismatchPct ?? 'n/a'}%`, '', '| property | board | live | delta | flag |', '|---|---|---|---|---|')
		for (const x of c.rows) L.push(`| ${x.prop} | ${fmt(x.board)} | ${fmt(x.live)} | ${x.delta ?? ''} | ${x.flag ? 'FLAG ' + x.flag : ''} |`)
		L.push('')
	}
	if (r.missingOnLive.length) L.push('## Missing on live', '', ...r.missingOnLive.map((c) => `- ${c.role}: ${c.title || '(untitled)'} at ${c.rect.x},${c.rect.y} ${c.rect.w}x${c.rect.h}`), '')
	for (const e of (r.elements || []).filter((x) => x.flagged).sort((a, b) => b.score - a.score)) {
		L.push(`## ${e.name}  [${e.matchedBy}]  flags ${e.flagged}, crop mismatch ${e.cropMismatchPct ?? 'n/a'}%`, '', '| property | board | live | delta | flag |', '|---|---|---|---|---|')
		for (const x of e.rows) L.push(`| ${x.prop} | ${fmt(x.board)} | ${fmt(x.live)} | ${x.delta ?? ''} | ${x.flag ? 'FLAG ' + x.flag : ''} |`)
		L.push('')
	}
	if ((r.missingElements || []).length) L.push('## Elements missing on live', '', ...r.missingElements.map((e) => `- ${e.kind} "${e.label}"${e.inControl ? ` in "${e.inControl}"` : ''}${e.count > 1 ? ` (group of ${e.count})` : ''}${isRepeated(e) ? ' (data-dependent, not counted)' : ''}`), '')
	if ((r.extraElements || []).length) L.push('## Elements extra on live', '', ...r.extraElements.map((e) => `- ${e.kind} "${e.label}"${e.inControl ? ` in "${e.inControl}"` : ''}${e.count > 1 ? ` (group of ${e.count})` : ''}${isRepeated(e) ? ' (data-dependent, not counted)' : ''}`), '')
	L.push(r.notMeasured ? `## Not measured: ${r.notMeasured.length}` : '## Not measured: unknown (run without the element inventory)', '', ...(r.notMeasured || []).map((u) => `- ${u.tag} "${u.text}" at ${u.rect.x},${u.rect.y} ${u.rect.w}x${u.rect.h}`), '')
	if (r.extraOnLive.length) L.push('## Extra on live', '', ...r.extraOnLive.map((c) => `- ${c.role}: ${c.title || '(untitled)'} at ${c.rect.x},${c.rect.y} ${c.rect.w}x${c.rect.h}`), '')
	return L.join('\n')
}
function fmt (v) { return v === null || v === undefined ? '-' : typeof v === 'object' ? JSON.stringify(v) : String(v) }
