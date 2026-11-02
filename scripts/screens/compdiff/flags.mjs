/**
 * The flags compdiff.mjs reads. A flag outside this list is refused, so a spec row written for a newer compdiff (or
 * with a typo) is never measured with part of its state silently dropped.
 */
export const KNOWN_FLAGS = [
	'allow-stale-board', 'base', 'board', 'board-frame', 'boards', 'click', 'clicks', 'clock', 'crop-flag', 'fills', 'ignore',
	'inject-css', 'inject-js', 'keep-scroll', 'list-flags', 'load-wait', 'login', 'out', 'read-post', 'session', 'settle',
	'settle-mode', 'skip-first-run', 'steps', 'storage', 'url', 'wait-for', 'width',
]

/**
 * The flags on a command line that compdiff does not read.
 *
 * @param {Array<string>} argv The arguments after the script name.
 * @return {Array<string>} Each unknown flag as written, in order.
 */
export function unknownFlags(argv) {
	const out = []
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (!a.startsWith('--')) continue
		if (!KNOWN_FLAGS.includes(a.slice(2))) out.push(a)
		// The next word is this flag's value, whatever it starts with.
		if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) i++
	}
	return out
}
