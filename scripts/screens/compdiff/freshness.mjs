import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Whether a flattened board (preview/screens/boards/<Key>.html) is older than the sources it is built from: its own
// screens-src/<set>/<Name>.dc.html and every board it imports (dc-import name="DqKop"), followed through their imports.
// A stale preview draws an old board, and a measurement against it reports differences the source has already fixed.

/**
 * When a file last changed: its last commit time when it is committed unchanged, else its modification time (a
 * fresh clone gives every file the same mtime, so the commit time is the one that orders them).
 *
 * @param {string} file Absolute path.
 * @param {string} root The git work tree it lives in.
 * @return {number|null} Seconds since the epoch, or null when the file does not exist.
 */
export function lastChange (file, root) {
	if (!fs.existsSync(file)) return null
	const mtime = Math.floor(fs.statSync(file).mtimeMs / 1000)
	try {
		const rel = path.relative(root, file)
		const dirty = execFileSync('git', ['-C', root, 'status', '--porcelain', '--', rel], { encoding: 'utf8' }).trim()
		if (dirty) return mtime
		const ct = execFileSync('git', ['-C', root, 'log', '-1', '--format=%ct', '--', rel], { encoding: 'utf8' }).trim()
		return ct ? Number(ct) : mtime
	} catch {
		return mtime
	}
}

/**
 * The sources a board's source imports, by name, resolved next to it.
 *
 * @param {string} src Absolute path of a .dc.html source.
 * @return {string[]} Absolute paths of the imported sources that exist.
 */
export function importsOf (src) {
	const html = fs.readFileSync(src, 'utf8')
	const names = [...new Set([...html.matchAll(/<dc-import\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]))]
	return names.map((n) => path.join(path.dirname(src), `${n}.dc.html`)).filter((f) => fs.existsSync(f))
}

/**
 * The sources of a flattened board that changed after it was built.
 *
 * @param {string} boardFile Absolute path of preview/screens/boards/<Key>.html.
 * @param {string} root The repo root (holds preview/screens/screens.json and screens-src/).
 * @return {{ src: string|null, stale: Array<{ file: string, changed: number }>, built: number|null }} `src` is null
 *   when screens.json names no source for the board (nothing to compare).
 */
export function staleSources (boardFile, root) {
	const index = path.join(root, 'preview', 'screens', 'screens.json')
	if (!fs.existsSync(index)) return { src: null, stale: [], built: null }
	const boards = Object.values(JSON.parse(fs.readFileSync(index, 'utf8')).boards || {})
	const key = `boards/${path.basename(boardFile)}`
	const entry = boards.find((b) => b.file === key)
	if (!entry || !entry.src) return { src: null, stale: [], built: null }
	const src = path.join(root, entry.src.startsWith('screens-src/') ? entry.src : path.join('screens-src', entry.src))
	if (!fs.existsSync(src)) return { src: null, stale: [], built: null }
	const built = lastChange(boardFile, root)
	const seen = new Set()
	const queue = [src]
	const stale = []
	while (queue.length) {
		const f = queue.shift()
		if (seen.has(f)) continue
		seen.add(f)
		const changed = lastChange(f, root)
		if (changed !== null && built !== null && changed > built) stale.push({ file: path.relative(root, f), changed })
		queue.push(...importsOf(f))
	}
	return { src: path.relative(root, src), stale, built }
}
