#!/usr/bin/env node
// node noise.mjs <runA> <runB>
// The tool's own noise: the same live page measured twice (two runs of the same boards on the same build) should read
// the same. Prints, per property kind, how far the live values of the two runs drift apart, so the flag thresholds in
// compare.mjs (THRESHOLDS.spacing: 2px) can be checked against what the measurement itself varies by.
import fs from 'node:fs'
import path from 'node:path'

const [a, b] = process.argv.slice(2)
if (!a || !b) {
	console.error('usage: node noise.mjs <runA> <runB>')
	process.exit(2)
}

/**
 * Every numeric property of a measured component, by dotted path.
 *
 * @param {object} o The component side.
 * @param {string} [pre] The path so far.
 * @param {object} [out] The map being filled.
 * @return {Record<string, number>} The values.
 */
function flat(o, pre = '', out = {}) {
	if (o && typeof o === 'object' && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) flat(v, pre ? `${pre}.${k}` : k, out)
	else if (typeof o === 'number') out[pre] = o
	return out
}

const kindOf = (p) => (/Inset|padding/.test(p) ? 'inset' : /gap/i.test(p) ? 'gap' : /Height|^h$|\.h$/.test(p) ? 'height' : null)
const read = (dir, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } catch { return null } }
const drift = { inset: [], gap: [], height: [] }
for (const f of fs.readdirSync(a).filter((x) => /\.json$/.test(x) && fs.existsSync(path.join(b, x)))) {
	const ra = read(a, f), rb = read(b, f)
	if (!ra?.components || !rb?.components) continue
	const key = (c) => `${c.board.role}|${c.board.title || ''}|${Math.round(c.board.rect.x)},${Math.round(c.board.rect.y)}`
	const lb = new Map(rb.components.filter((c) => c.live).map((c) => [key(c), flat(c.live)]))
	for (const c of ra.components.filter((c) => c.live)) {
		const other = lb.get(key(c))
		if (!other) continue
		for (const [p, v] of Object.entries(flat(c.live))) {
			const k = kindOf(p)
			if (k && typeof other[p] === 'number') drift[k].push({ d: Math.abs(other[p] - v), where: `${f} ${c.board.title || c.board.role} ${p}` })
		}
	}
}
for (const [k, list] of Object.entries(drift)) {
	list.sort((x, y) => y.d - x.d)
	const max = list.length ? list[0].d : 0
	console.log(`${k}: ${list.length} values, max drift ${Math.round(max * 10) / 10}px${list.length && max > 0 ? ` (${list[0].where})` : ''}`)
}
