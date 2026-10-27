/**
 * Runs in the board page: leaves only the element a selector names, set at the page's top left, so a board that draws
 * several frames side by side (three phone screens with captions) is measured on one of them. The element keeps its
 * own styles; the page around it is emptied.
 *
 * @param {string} selector The frame's CSS selector.
 * @return {boolean} Whether the selector matched.
 */
export function cropToFrame(selector) {
	const frame = document.querySelector(selector)
	if (!frame) return false
	const keep = frame.cloneNode(true)
	keep.style.margin = '0'
	keep.style.position = 'relative'
	keep.style.left = '0'
	keep.style.top = '0'
	document.body.replaceChildren(keep)
	document.body.style.margin = '0'
	return true
}
