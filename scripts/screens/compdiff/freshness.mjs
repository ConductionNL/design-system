import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Whether a flattened board (preview/screens/boards/<Key>.html) still matches its source: scripts/screens/board_fresh.py
// flattens the board in memory from screens-src/ (with every board it imports, such as DqKop) and compares the result
// with the file. A stale preview draws an old board, and a measurement against it reports differences the source has
// already fixed. File and commit times cannot tell: a checkout gives every file the same mtime, and a rebuild that
// writes identical output commits nothing, so the preview's last commit stays older than its source's.

/**
 * Run the checker for one board.
 *
 * @param {string} root The repo root.
 * @param {string} key The board key (the preview's file name without .html).
 * @return {string} 'fresh', 'stale' or 'unknown'.
 */
export function runChecker (root, key) {
	const out = execFileSync('python3', [path.join(root, 'scripts', 'screens', 'board_fresh.py'), key], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] })
	return JSON.parse(out)[key]
}

/**
 * Whether a flattened board matches its source.
 *
 * @param {string} boardFile Absolute path of preview/screens/boards/<Key>.html.
 * @param {string} root The repo root that holds scripts/screens/board_fresh.py and screens-src/.
 * @param {(root: string, key: string) => string} [check] The checker (runChecker).
 * @return {{ state: 'fresh'|'stale'|'unknown'|'unchecked', reason?: string }} 'unknown': the index names no source for
 *   the board; 'unchecked': the check could not run (no checker in that tree, or it failed), with the reason.
 */
export function boardFreshness (boardFile, root, check = runChecker) {
	if (!fs.existsSync(path.join(root, 'scripts', 'screens', 'board_fresh.py'))) return { state: 'unchecked', reason: 'no scripts/screens/board_fresh.py next to the boards' }
	const key = path.basename(boardFile).replace(/\.html$/, '')
	try {
		const state = check(root, key)
		return ['fresh', 'stale', 'unknown'].includes(state) ? { state } : { state: 'unchecked', reason: `checker answered ${state}` }
	} catch (e) {
		return { state: 'unchecked', reason: String(e.message).split('\n')[0] }
	}
}
