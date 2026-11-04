// Regions a board marks as left out of the comparison. A board element that carries `data-compdiff-exempt="<kind>"`
// (a space-separated list of kinds) is taken out of the layout on both sides before anything is measured, when its
// kind is on: the board then reads as if it drew the page without that region, and what sat below it moves up.
// Only the marker decides; no element is exempted for its role, colour or place.
//
// Kinds:
//   banner        an inline state banner on the main screen (a success, refusal or partial-result notice in a card,
//                 a dialog or the page) that only shows after an action. On by default: a read-only measurement
//                 never runs the action, so live shows the page without it.
//   side-states   a panel at the foot of a board that draws other states of the page side by side. Off by default.

export const EXEMPT_KINDS = ['banner', 'side-states']
export const DEFAULT_EXEMPT = ['banner']

/**
 * The kinds of marked region to leave out, from the --exempt value.
 *
 * @param {string|undefined} value The --exempt value: kinds joined by `|`, or `none`. Absent means the default.
 * @return {Array<string>} The kinds.
 */
export function parseExempt(value) {
	if (value === undefined) return [...DEFAULT_EXEMPT]
	if (value === 'none') return []
	const kinds = value.split('|').map((k) => k.trim()).filter(Boolean)
	if (value === 'true' || kinds.length === 0) throw new Error(`--exempt needs a value: ${EXEMPT_KINDS.join(', ')} (joined by |) or none`)
	const unknown = kinds.filter((k) => !EXEMPT_KINDS.includes(k))
	if (unknown.length) throw new Error(`--exempt ${unknown.join(', ')}: unknown kind; known: ${EXEMPT_KINDS.join(', ')}, none`)
	return [...new Set(kinds)]
}

/**
 * Runs in the page: takes every element marked with one of the kinds out of the layout and says what it took out.
 *
 * @param {Array<string>} kinds The kinds that are on.
 * @return {Array<{kind: string, text: string, rect: {x: number, y: number, w: number, h: number}}>} The regions,
 * with their place before they were taken out.
 */
export function collapseExempt(kinds) {
	const out = []
	for (const el of document.querySelectorAll('[data-compdiff-exempt]')) {
		const kind = (el.getAttribute('data-compdiff-exempt') || '').split(/\s+/).find((k) => kinds.includes(k))
		if (!kind) continue
		const r = el.getBoundingClientRect()
		out.push({ kind, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } })
	}
	for (const el of document.querySelectorAll('[data-compdiff-exempt]')) {
		if ((el.getAttribute('data-compdiff-exempt') || '').split(/\s+/).some((k) => kinds.includes(k))) el.style.setProperty('display', 'none', 'important')
	}
	return out
}
