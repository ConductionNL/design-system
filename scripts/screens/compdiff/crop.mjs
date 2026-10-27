// The share of a crop's pixels that differ between the board and live, for an element no property explains.
// Both crops are cut at whole pixels, so a rect on a half pixel is not resampled into a blur, and a pixel counts as
// matching when a pixel within `reach` of it on the other side does: text rasterised a fraction of a pixel apart
// (a table head 1.5px lower, a glyph stem on another subpixel) reads the same, a different glyph or fill does not.

/**
 * The mismatch of two equally sized RGBA crops.
 *
 * @param {Uint8ClampedArray|number[]} a The board crop, RGBA.
 * @param {Uint8ClampedArray|number[]} b The live crop, RGBA.
 * @param {number} w Width in pixels.
 * @param {number} h Height in pixels.
 * @param {number} [reach] How far a matching pixel may sit, in pixels.
 * @param {number} [tolerance] The largest channel difference that still matches.
 * @return {number} The share that differs, in percent with one decimal.
 */
export function cropMismatch(a, b, w, h, reach = 1, tolerance = 24) {
	const same = (p, q) => Math.abs(a[p] - b[q]) <= tolerance && Math.abs(a[p + 1] - b[q + 1]) <= tolerance && Math.abs(a[p + 2] - b[q + 2]) <= tolerance
	let n = 0
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const p = (y * w + x) * 4
			let hit = false
			for (let dy = -reach; dy <= reach && !hit; dy++) {
				for (let dx = -reach; dx <= reach && !hit; dx++) {
					const xx = x + dx, yy = y + dy
					if (xx >= 0 && xx < w && yy >= 0 && yy < h && same(p, (yy * w + xx) * 4)) hit = true
				}
			}
			if (!hit) n++
		}
	}
	return Math.round(n / (w * h) * 1000) / 10
}

/**
 * A rect at whole pixels.
 *
 * @param {{x: number, y: number, w: number, h: number}} r The rect.
 * @return {{x: number, y: number, w: number, h: number}} The rect rounded.
 */
export function wholePixels(r) {
	return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }
}

/**
 * The share above which a crop flags, for one element pair. A small element (under 24px on a side) set half a pixel
 * apart differs in a third of its pixels; a live crop rescaled to a board box a few pixels wider or narrower (the same
 * label in another build of the font) shifts every glyph column. Both need a larger share before the pixels speak.
 *
 * @param {{w: number, h: number}} br The board rect.
 * @param {{w: number, h: number}} lr The live rect.
 * @param {number} base The threshold for a crop of the same size.
 * @return {number} The threshold, in percent.
 */
export function cropFlag(br, lr, base) {
	if (Math.min(br.w, br.h) < 24) return base + 15
	const dw = Math.abs(br.w - lr.w)
	return dw > 1 && dw <= 8 ? base + 10 : base
}

/**
 * Whether an element pair's crop flags it as differing where no property does. A column head's sort button does not:
 * its label and chevron sit a few pixels apart on either side, and its properties are all read.
 *
 * @param {{rect: object, inHead?: boolean}} b The board element.
 * @param {{rect: object, inHead?: boolean}} l The live element.
 * @param {number|null} crop The crop mismatch, in percent.
 * @param {number} base The threshold for a crop of the same size.
 * @param {{board: Array, live: Array}} [covers] The overlays' rects per side.
 * @return {boolean} Whether the pixels flag the pair.
 */
export function pixelsFlag(b, l, crop, base, covers = { board: [], live: [] }) {
	return crop !== null && !(b.inHead || l.inHead) && !covered(b.rect, covers.board) && !covered(l.rect, covers.live) && crop > cropFlag(b.rect, l.rect, base)
}

/**
 * Whether an overlay (an open menu or popover) lies over part of a rect: its crop then shows the overlay, at a place
 * that differs per side, and says nothing about the element.
 *
 * @param {{x: number, y: number, w: number, h: number}} r The element's rect.
 * @param {Array<{x: number, y: number, w: number, h: number}>} overlays The overlays' rects on that side.
 * @return {boolean} Whether any overlay overlaps the rect without holding it whole.
 */
export function covered(r, overlays = []) {
	return overlays.some((o) => {
		const inside = r.x >= o.x - 1 && r.y >= o.y - 1 && r.x + r.w <= o.x + o.w + 1 && r.y + r.h <= o.y + o.h + 1
		const meets = r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y
		return meets && !inside
	})
}
