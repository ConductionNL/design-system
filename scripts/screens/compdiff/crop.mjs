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
