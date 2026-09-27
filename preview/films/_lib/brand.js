/**
 * Conduction brand constants for motion, mirrored from tokens.css.
 *
 * A film cannot read CSS custom properties per frame cheaply, so the values
 * live here too. When tokens.css changes, change this file in the same commit.
 */

export const C = {
	cobalt: '#21468B', // --c-blue-cobalt, the primary fill
	cobalt50: '#EEF2F8',
	cobalt100: '#DCE3F0',
	cobalt200: '#B6C2DD',
	cobalt300: '#8095BD',
	cobalt400: '#4D69A4',
	cobalt600: '#1B3A75',
	cobalt700: '#152D5C',
	cobalt800: '#102246',
	cobalt900: '#0A172F',
	orange: '#F36C21', // --c-orange-knvb, one per scene, never a hex family
	coral600: '#C64E0B', // text-safe orange
	white: '#FFFFFF',
	nextcloud: '#0082C9', // --c-nextcloud-blue: the workspace hex, and "Next" in ConNext
	nextcloudCyan: '#1CAFFF', // the Nextcloud citation on cobalt-900 grounds
	lavender: '#7E66C9', // process / workflow
	lavender300: '#B7A7E3',
	mint: '#2E9866', // integrate / connect
	mint300: '#87CFA8',
	forest: '#3D7C3A', // data / trustworthy
	forest300: '#7DAA7C',
	terracotta: '#B25E48', // documents / human work
	terracotta300: '#DA9D8A',
	gray300: '#B7BDC9',
	gray500: '#6B7280',
}

/** The four category families a component hex may take. Cobalt is chrome, not a category. */
export const FAMILY = { process: C.lavender, integrate: C.mint, data: C.forest, documents: C.terracotta }

/**
 * Brand asset root, resolved from this module rather than the page, so any page
 * depth works. preview/films/_lib/ -> repo root locally; on identity.conduction.nl
 * preview/ is the site root and brand/ is published at /brand/, and the extra ../
 * clamps at the root, so the same path resolves there too.
 */
export const BRAND_BASE = new URL('../../../brand/assets/', import.meta.url).href
export const FONT_BASE = BRAND_BASE + 'fonts'
export const FONTS = [400, 500, 600, 700].flatMap((w) => [
	{ family: 'Figtree', weight: w, url: `${FONT_BASE}/figtree/woff2/Figtree-${w}-latin.woff2` },
]).concat([
	{ family: 'IBM Plex Mono', weight: 500, url: `${FONT_BASE}/ibm-plex-mono/woff2/IBMPlexMono-500-latin.woff2` },
])

/** App glyphs: the app's own img/app.svg, normalised to currentColor. */
export const GLYPH_BASE = BRAND_BASE + 'apps/glyphs'
export const glyphUrl = (id) => `${GLYPH_BASE}/${id}.svg`
