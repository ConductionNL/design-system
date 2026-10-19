// Page background: the colour of the content area behind the cards, read from a screenshot.
// It samples the strip between the app navigation and the content (x 268-288, the content area's own padding) from
// below the top bar to the bottom, and returns the most common colour there. Shared by compdiff.mjs (new runs) and
// pagebg-backfill.mjs (stored runs).
export const STRIP = { x0: 268, x1: 288, y0: 80 }

export async function pageBackground (page, pngPath, fs) {
	const src = 'data:image/png;base64,' + fs.readFileSync(pngPath).toString('base64')
	return page.evaluate(async ({ src, strip }) => {
		const img = await new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.src = src })
		const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
		const x = c.getContext('2d'); x.drawImage(img, 0, 0)
		const h = img.height - strip.y0 - 10
		if (h < 10) return null
		const d = x.getImageData(strip.x0, strip.y0, strip.x1 - strip.x0, h).data
		const count = new Map()
		for (let p = 0; p < d.length; p += 4) { const k = `rgb(${d[p]}, ${d[p + 1]}, ${d[p + 2]})`; count.set(k, (count.get(k) || 0) + 1) }
		const [colour, n] = [...count.entries()].sort((a, b) => b[1] - a[1])[0]
		return { background: colour, share: Math.round(n / (d.length / 4) * 100) }
	}, { src, strip: STRIP })
}

// The page background as a pseudo-component, so it is compared, summarised and judged like any other component.
export function pageComponent (page, height) {
	if (!page || !page.board || !page.live) return null
	const side = (p) => ({ role: 'page', title: 'page background', rect: { x: 0, y: 0, w: 1440, h: height }, background: p.background })
	return { name: 'page background', role: 'page', matchedBy: 'role', board: side(page.board), live: side(page.live), cropMismatchPct: null }
}
