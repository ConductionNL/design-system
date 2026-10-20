#!/usr/bin/env node
// Writes runall.sh specs rows from a REVIEW boards.json, so a run measures each board with the steps that list keeps
// for it, in their order (compdiff --steps).
//
// node specs-from-boards.mjs <boards.json> [--keep <specs.tsv>] > specs.tsv
//
// A row is board<TAB>route[<TAB>--steps<TAB><JSON>]. The route is the liveUrl without its origin and without
// Nextcloud's /index.php front controller, the form runall.sh matches a /settings/ route by. With --keep, the
// rows of an existing specs file whose board boards.json does not list are kept after the generated ones.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normaliseStep } from './steps.mjs'

/**
 * The route of a liveUrl: its path and query, without the origin and the /index.php front controller.
 *
 * @param {string} url The liveUrl.
 * @return {string} The route.
 */
export function routeOf(url) {
	const u = new URL(url, 'http://localhost')
	return u.pathname.replace(/^\/index\.php(?=\/)/, '') + u.search + u.hash
}

/**
 * The specs rows for the boards, then the kept rows of boards not among them. A board without a liveUrl has no live
 * page to measure (a sheet of dialogs side by side) and gets no row.
 *
 * @param {Array<{board: string, liveUrl: string, steps?: Array<object>}>} boards The boards.json entries.
 * @param {Array<string>} [keep] Rows of an existing specs file.
 * @return {Array<string>} The rows.
 */
export function specRows(boards, keep = []) {
	const measured = boards.filter((entry) => entry.liveUrl)
	const rows = measured.map((entry) => {
		const steps = (entry.steps || []).map((step, i) => {
			normaliseStep(step, i)
			return step
		})
		const route = routeOf(entry.liveUrl)
		const json = JSON.stringify(steps)
		if (json.includes('\t') || json.includes('\n')) throw new Error(`${entry.board}: a step holds a tab or a newline`)
		return steps.length ? [entry.board, route, '--steps', json].join('\t') : [entry.board, route].join('\t')
	})
	const listed = new Set(boards.map((entry) => entry.board))
	return [...rows, ...keep.filter((row) => row.trim() !== '' && !listed.has(row.split('\t')[0]))]
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [file, ...rest] = process.argv.slice(2)
	if (!file) {
		console.error('usage: node specs-from-boards.mjs <boards.json> [--keep <specs.tsv>]')
		process.exit(2)
	}
	const data = JSON.parse(fs.readFileSync(file, 'utf8'))
	const boards = Array.isArray(data) ? data : data.boards
	const k = rest.indexOf('--keep')
	const keep = k >= 0 ? fs.readFileSync(rest[k + 1], 'utf8').split('\n') : []
	process.stdout.write(specRows(boards, keep).join('\n') + '\n')
}
