/**
 * The shared drawing kit for the "Business software is next" storyboard. Every
 * act file draws its key frames with these helpers only, so the film keeps one
 * hand across acts.
 *
 * Rules (bible + brand-film skill):
 *   - type sits in the column at x 120 (TYPE from _lib/ui.js), Figtree 700, sentence case
 *   - one orange per scene: `*word*` in a headline, one accent stat, or one cell
 *   - big numbers are IBM Plex Mono 500; labels are mono eyebrows in capitals
 *   - grounds are cobalt (default), cobalt-50 or white; depth from opacity, never blur
 *   - no gradients, no rotation, no screenshots: product UI is redrawn from /screens boards
 *   - third-party marks only from brand/assets/integrations; other brands are text cells
 */
import { el, textBlock, measure } from '../../../_lib/stage.js'
import { C, BRAND_BASE } from '../../../_lib/brand.js'
import { TYPE, rect, hex, honeyField, fitCaptionSize } from '../../../_lib/ui.js'

export const W = 1920
export const H = 1080
export const X = TYPE.x
export const MONO = 'IBM Plex Mono'

const INTEGRATIONS = {
	openproject: 'workflow/openproject.svg', xwiki: 'workflow/xwiki.svg', keycloak: 'workflow/keycloak.svg', n8n: 'workflow/n8n.svg',
	matrix: 'conduction-ext/matrix.svg', openexchange: 'conduction-ext/openexchange.svg',
	files: 'nextcloud-bundled/files.svg', mail: 'nextcloud-bundled/mail.svg', calendar: 'nextcloud-bundled/calendar.svg', talk: 'nextcloud-bundled/talk.svg',
}

/** The ground for a scene: 'cobalt' draws nothing (the stage colour), 'light' cobalt-50, 'white'. Returns the ink. */
export function ground(ctx, kind = 'cobalt') {
	if (kind === 'light') rect(ctx.g, 0, 0, W, H, C.cobalt50)
	if (kind === 'white') rect(ctx.g, 0, 0, W, H, C.white)
	return kind === 'cobalt' ? { ink: C.white, soft: C.cobalt200, mute: C.cobalt300, dark: false } : { ink: C.cobalt, soft: C.cobalt400, mute: C.cobalt300, dark: true }
}

/** A mono eyebrow, capitals, letter-spaced: the act or the source of a fact. */
export function eyebrow(g, text, { x = X, y = 200, fill = C.cobalt300, size = 26, anchor = 'start' } = {}) {
	return textBlock(g, text.toUpperCase(), { x, y, size, weight: 500, family: MONO, fill, tracking: 0.12, anchor, clip: false })
}

/** The scene headline on the type grid; `*word*` is the scene's one orange. Fits the column. */
export function headline(g, text, ink, { y = TYPE.y1, size, maxSize = TYPE.size, wide = false } = {}) {
	const s = size ?? (wide ? maxSize : fitCaptionSize(text, { size: maxSize }))
	return textBlock(g, text, { x: X, y, size: s, weight: 700, fill: ink, accent: C.orange, lineHeight: 1.07, tracking: -0.02, clip: false, maxWidth: wide ? W - 2 * X : Infinity })
}

/** Body copy under a headline: Figtree 500 at 40 px. */
export function body(g, text, fill, { x = X, y, size = 40, maxWidth = 900 } = {}) {
	return textBlock(g, text, { x, y, size, weight: 500, fill, lineHeight: 1.3, tracking: -0.005, maxWidth, clip: false })
}

/** A big number in IBM Plex Mono; `accent` makes it the scene's orange. */
export function bigNumber(g, value, { x, y, size = 200, fill = C.white, accent = false, anchor = 'start' } = {}) {
	return textBlock(g, value, { x, y, size, weight: 500, family: MONO, fill: accent ? C.orange : fill, tracking: -0.03, anchor, clip: false })
}

/**
 * A row of stats, left to right across the frame: [{ value, label, sub, accent }].
 * Numbers sit on one baseline at `y`; labels and subs below.
 */
export function statRow(g, items, ink, { y = 640, x0 = X, x1 = W - X, size = 168, labelFill = C.cobalt200, subFill = C.cobalt300 } = {}) {
	const step = (x1 - x0) / items.length
	items.forEach((it, i) => {
		const x = x0 + i * step
		// IBM Plex Mono advances 0.6 em per character; keep 80 px between numbers.
		const fit = Math.min(size, Math.floor((step - 80) / (0.6 * it.value.length)))
		bigNumber(g, it.value, { x, y, size: fit, fill: ink, accent: it.accent })
		if (it.label) eyebrow(g, it.label, { x, y: y + 70, fill: labelFill, size: 24 })
		if (it.sub) textBlock(g, it.sub, { x, y: y + 122, size: 30, weight: 500, fill: subFill, lineHeight: 1.3, maxWidth: step - 60, clip: false })
	})
}

/** The unlit honeycomb behind a scene (depth by opacity). */
export function field(g, { cx = 1500, cy = 540, r = 64, gap = 10, scale = 1, skip } = {}) {
	return honeyField(g, cx, cy, r, gap, { scale, skip, top: -Infinity })
}

/** A labelled hex cell: a text cell for a brand we hold no mark for, or an app cell. */
export function cell(g, cx, cy, r, label, { fill = C.cobalt600, ink = C.white, size, stroke } = {}) {
	hex(g, cx, cy, r, fill, r * 0.08, stroke ? { stroke, 'stroke-width': 4 } : {})
	if (!label) return
	const s = size ?? Math.min(34, Math.floor((r * 1.5) / Math.max(1, label.length * 0.52)))
	textBlock(g, label, { x: cx, y: cy + s * 0.35, size: s, weight: 700, fill: ink, anchor: 'middle', tracking: -0.01, clip: false })
}

/** A third-party or Nextcloud mark from brand/assets/integrations, drawn as an image. */
export function integration(g, id, x, y, size) {
	const href = BRAND_BASE + 'integrations/' + INTEGRATIONS[id]
	return el('image', { href, x, y, width: size, height: size, preserveAspectRatio: 'xMidYMid meet' }, g)
}

/** A mono strip, for a headline or a source line: a cobalt-600 band with mono text. */
export function strip(g, text, { x = X, y, w = W - 2 * X, h = 76, fill = C.cobalt600, ink = C.white, size = 30, lead } = {}) {
	rect(g, x, y, w, h, fill, 6)
	if (lead) textBlock(g, lead.toUpperCase(), { x: x + 28, y: y + h / 2 + size * 0.36, size: size * 0.8, weight: 500, family: MONO, fill: C.cobalt300, tracking: 0.08, clip: false })
	const lx = lead ? x + 28 + measure(lead.toUpperCase(), { size: size * 0.8, weight: 500, family: MONO, tracking: 0.08 }) + 28 : x + 28
	return textBlock(g, text, { x: lx, y: y + h / 2 + size * 0.36, size, weight: 600, fill: ink, tracking: -0.005, clip: false })
}

/** A storyboard board: id, title, the voice-over line (`words`), the on-screen material and a draw. */
export function board(id, title, { words, material = '', note = '', draw }) {
	return { id, title, layer: 'talk', module: 'talk', words, apps: [], note: [material && `Material: ${material}`, note].filter(Boolean).join(' · '), draw }
}
