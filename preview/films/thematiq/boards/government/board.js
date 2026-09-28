/**
 * Thematiq, ONE audience film (Round 20: brands folded into government), reworked in Round 22
 * (Ruben's page notes, 2026-09-28). Speaks to the house-style coordinator of a municipality, the
 * Rijkshuisstijl programme manager, shared-service platform admins and a company's head of marketing.
 * Positioning and the story research: ds-connext-film-review/audiences/positioning-tk.md (Round 22).
 * Real screens: ds-connext-film-review/apps/thematiq/screens/ (screens.md), read from the Thematiq repo
 * on development (templates/settings/admin.php, docs/img, img).
 *
 *   story 1  word art: "Your car, your house, your colours" (the promise slot; Round 22 replaces the
 *            question with a small story about ownership: control makes it feel yours)
 *   story 2  word art: "Your workspace, not your style?" (the hook slot)
 *   scene 3  THE CORE: Custom Token Overrides, the real token editor (four tabs, a row per token with
 *            its CSS variable, swatch, hex field and reset): "Adjust 53 design tokens"
 *   scene 4  share your templates through the store (Round 21), in the Nextcloud app store's look
 *   scene 5  for Dutch organisations: the real "NL Design System Theme" section, its design token set
 *            list and the custom token set upload: "Bring your NL Design tokens along" (replaces the
 *            old organisation-picker hook; takes the general slot's time)
 *   No data-layer scene (Round 22).
 *
 * Techniques (refs/techniques.md): #2 sentence build as word art (the story), #3 grid-cell ripple
 * (token rows, store cards), #9 text-swap on a held diagram (the list selection, the upload).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { el, textBlock } from '../../../_lib/stage.js'
import { rect, bar, circle, hex, panel, use, button, appMark } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The sentence builds as the camera pulls back.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells light in waves.' },
]

const T = (g, text, x, y, size, o = {}) => textBlock(g, text, { x, y, size, weight: o.weight ?? 700, fill: o.fill ?? C.cobalt900, family: o.family ?? 'Figtree', clip: false, tracking: o.tracking ?? -0.01 })

/* ---------- the story: word art ---------- */

/** Story 1: three everyday things you style yourself; the last word is the scene's one orange. */
function storyOne(ctx) {
	const g = el('g', {}, ctx.g)
	appMark(g, 'thematiq')
	T(g, 'Your car,', 120, 560, 150, { fill: C.white, tracking: -0.03 })
	T(g, 'your house,', 300, 720, 150, { fill: C.white, tracking: -0.03 })
	T(g, 'your colours', 120, 910, 190, { fill: C.orange, tracking: -0.03 })
	// three solid colour hexes, one per thing you pick yourself (three families)
	;[[1560, 420, C.lavender], [1690, 590, C.mint], [1560, 760, C.forest]].forEach(([cx, cy, f]) => hex(g, cx, cy, 90, f, 12))
}

/** Story 2: the workspace in stock Nextcloud blue, the question with "your style" in orange. */
function storyTwo(ctx) {
	const g = el('g', {}, ctx.g)
	appMark(g, 'thematiq')
	T(g, 'Your workspace,', 120, 600, 150, { fill: C.white, tracking: -0.03 })
	// the accent: textBlock sets *...* in the accent colour
	textBlock(g, 'not *your* *style?*', { x: 120, y: 860, size: 180, weight: 700, fill: C.white, accent: C.orange, tracking: -0.03, clip: false })
	// the stock workspace: one Nextcloud-blue hex with the Nextcloud mark, the same for everyone
	hex(g, 1620, 300, 150, C.nextcloud, 18)
	const w = 150 * 1.12
	use(g, 'nextcloud-logo', 1620 - w / 2, 300 - w * 0.25, w, w * 0.5, C.white)
}

/* ---------- scene 3: the real token editor ---------- */

/** Custom Token Overrides (token-editor-*.png): header with Download and Upload, four tabs, token rows. */
/**
 * st (the film's animation state; the defaults are the approved still): sw0 the first swatch's colour,
 * ring 0..1, dot 0..1 (the custom badge).
 */
export function tokensUI(w, geom, st = {}) {
	const { u } = geom
	const { sw0 = C.forest, ring = 1, dot = 1 } = st
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 610, u)
	// the grey header bar
	rect(w, x, top, width, 76, C.cobalt50, 4 * u)
	T(w, 'Custom Token Overrides', x + 110, top + 48, 24)
	T(w, 'Download', x + width - 230, top + 48, 22, { fill: C.cobalt })
	rect(w, x + width - 104, top + 20, 84, 38, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	T(w, 'Upload', x + width - 94, top + 46, 17, { weight: 500 })
	// the four tabs, the first active
	const tabs = [['Login page & Branding', 222], ['Content area', 136], ['Buttons & Status', 172], ['Typography', 124]]
	let tx = x + 16
	tabs.forEach(([t, tw], i) => {
		rect(w, tx, top + 92, tw, 42, i === 0 ? C.cobalt100 : C.cobalt50, 3 * u)
		T(w, t, tx + 12, top + 120, 17, { fill: i === 0 ? C.cobalt : C.cobalt900 })
		tx += tw + 8
	})
	rect(w, x, top + 146, width, u / 2, C.cobalt100)
	// one row per token: label, its CSS variable, swatch, hex field, reset
	const rows = [['Primary color', sw0, true], ['Primary text color', C.white, false], ['Primary hover color', C.forest300, false], ['Primary element color', C.forest, false], ['Primary element hover', C.cobalt900, false]]
	rows.forEach(([label, sw, custom], i) => {
		const cy = top + 196 + i * 82
		if (i > 0) rect(w, x + 16, cy - 41, width - 32, u / 2, C.cobalt50)
		T(w, label, x + 30, cy - 4, 19, { weight: 500 })
		if (custom && dot > 0) circle(w, x + 30 + label.length * 9.6 + 12, cy - 10, 6 * dot, C.cobalt)
		bar(w, x + 30, cy + 14, [130, 160, 170, 180, 210][i], 6, C.cobalt300)
		rect(w, x + width - 300, cy - 22, 44, 44, C.white, 3 * u, { stroke: C.cobalt400, 'stroke-width': u })
		rect(w, x + width - 290, cy - 14, 24, 28, sw, 2, sw === C.white ? { stroke: C.cobalt300, 'stroke-width': u / 2 } : {})
		rect(w, x + width - 244, cy - 22, 120, 44, C.white, 3 * u, { stroke: C.cobalt400, 'stroke-width': u })
		bar(w, x + width - 230, cy - 4, 80, 8, C.cobalt900)
		rect(w, x + width - 100, cy - 20, 50, 40, C.cobalt50, 4 * u)
		circle(w, x + width - 75, cy, 9, 'none', { stroke: C.cobalt, 'stroke-width': u })
	})
	// the token being adjusted, the scene's one orange: the swatch of the first row
	if (ring > 0) rect(w, x + width - 308, top + 196 - 30, 60, 60, 'none', 4 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, 'stroke-opacity': ring })
}

/* ---------- scene 4: the store ---------- */

/** The store, in the Nextcloud app store's look (appstore-listing.png): blue bar, search, rail, template cards. */
/** st: ring 0..1, pressed 0..1 (the share button filling), stars 0..1 (the rating dots filling). */
export function storeUI(w, geom, st = {}) {
	const { u } = geom
	const { ring = 1, pressed = 1, stars = 1 } = st
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 610, u)
	// the store's own blue top bar: the Nextcloud mark, "App store", the search field
	rect(w, x, top, width, 70, C.nextcloud, 4 * u)
	use(w, 'nextcloud-logo', x + 96, top + 20, 60, 30, C.white)
	T(w, 'App store', x + 170, top + 45, 24, { fill: C.white })
	rect(w, x + width - 300, top + 16, 270, 38, C.white, 3 * u)
	circle(w, x + width - 278, top + 35, 7, 'none', { stroke: C.cobalt400, 'stroke-width': u })
	bar(w, x + width - 260, top + 31, 120, 8, C.cobalt200)
	// the category rail
	for (let i = 0; i < 7; i++) {
		rect(w, x + 24, top + 104 + i * 58, 22, 22, C.nextcloud, 3)
		bar(w, x + 58, top + 110 + i * 58, [90, 110, 70, 100, 80, 96, 76][i], 9, i === 1 ? C.nextcloud : C.cobalt300)
	}
	// the templates: house-style cards with swatches, organisation, rating; yours is being shared
	const gx = x + 200, cw = (width - 230 - 20) / 2, ch = 244
	const pals = [[C.forest, C.forest300], [C.lavender, C.lavender300], [C.cobalt, C.cobalt300], [C.mint, C.mint300]]
	pals.forEach(([a, b], i) => {
		const cx = gx + (i % 2) * (cw + 20), cy = top + 96 + Math.floor(i / 2) * (ch + 18)
		panel(w, cx, cy, cw, ch, u)
		rect(w, cx, cy, cw * 0.55, 60, a)
		rect(w, cx + cw * 0.55, cy, cw * 0.3, 60, b)
		rect(w, cx + cw * 0.85, cy, cw * 0.15, 60, C.white)
		bar(w, cx + 22, cy + 88, [170, 140, 190, 130][i], 11, C.cobalt900)
		bar(w, cx + 22, cy + 114, 110, 8, C.cobalt300)
		for (let k = 0; k < 5; k++) circle(w, cx + 30 + k * 22, cy + 150, 7, k < Math.round([5, 4, 4, 5][i] * stars) ? C.nextcloud : C.cobalt100)
		button(w, cx + cw - 150, cy + ch - 66, 128, 46, u, { kind: i === 0 && pressed >= 0.5 ? 'primary' : 'ghost' })
	})
	// yours: the share button on the first card, the scene's one orange
	if (ring > 0) rect(w, gx + cw - 158, top + 96 + ch - 74, 144, 62, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, 'stroke-opacity': ring })
}

/* ---------- scene 5: the NL Design import ---------- */

/** NL Design System Theme (admin-nl-design-panel.png, guide-dropdown-open.png) and the custom token set upload. */
/** st: sel (the selected row of the set list), name 0..1 and file 0..1 (the upload fields filling), ring 0..1, landed 0..1 (the imported set in the list). */
export function nldesignUI(w, geom, st = {}) {
	const { u } = geom
	const { sel = 0, name = 1, file = 1, ring = 1, landed = 1 } = st
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 620, u)
	T(w, 'NL Design System Theme', x + 110, top + 52, 30)
	// the small label for Dutch government, and the section's own description
	rect(w, x + width - 232, top + 24, 206, 38, C.cobalt50, 19)
	T(w, 'Dutch government', x + width - 216, top + 50, 18, { weight: 600, fill: C.cobalt })
	bar(w, x + 30, top + 92, width - 200, 9, C.cobalt300)
	bar(w, x + 30, top + 112, width - 420, 9, C.cobalt300)
	// the design token set list, open
	T(w, 'Design token set', x + 30, top + 162, 20)
	rect(w, x + 30, top + 178, 400, 214, C.white, 3 * u, { stroke: C.cobalt900, 'stroke-width': u })
	;['Rijkshuisstijl', 'Gemeente Amsterdam', 'Gemeente Den Haag', 'Gemeente Utrecht', 'Gemeente Rotterdam'].forEach((t, i) => {
		const ly = top + 214 + i * 38
		if (i === Math.round(sel)) rect(w, x + 34, ly - 26, 392, 36, C.cobalt50, 2)
		T(w, t, x + 50, ly, 18, { weight: 500 })
	})
	// custom token sets: upload your own NL Design CSS or W3C Design Tokens file
	T(w, 'Custom token sets', x + 470, top + 162, 20)
	T(w, 'Token set name', x + 470, top + 204, 16, { weight: 500, fill: C.cobalt700 })
	rect(w, x + 470, top + 216, width - 500, 44, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u })
	if (name > 0) bar(w, x + 486, top + 234, 150 * name, 8, C.cobalt900)
	rect(w, x + 470, top + 276, width - 500, 44, C.cobalt50, 3 * u)
	if (file > 0) bar(w, x + 486, top + 294, 180 * file, 8, C.cobalt400)
	rect(w, x + 470, top + 340, 250, 48, C.cobalt, 4 * u)
	T(w, 'Choose file and upload', x + 486, top + 371, 16, { fill: C.white, weight: 600 })
	// the upload, the scene's one orange
	if (ring > 0) rect(w, x + 462, top + 332, 266, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, 'stroke-opacity': ring })
	// below: the imported set lands in the list of custom sets
	panel(w, x + 30, top + 420, width - 60, 170, u)
	;[[C.forest, C.forest300], [C.cobalt, C.cobalt300]].forEach(([a, b], i) => {
		if (i === 0 && landed <= 0) return
		const ry = top + 470 + i * 64 - (i === 0 ? 30 * (1 - landed) : 0)
		rect(w, x + 56, ry - 16, 28, 28, a, 3)
		rect(w, x + 88, ry - 16, 28, 28, b, 3)
		bar(w, x + 136, ry - 4, [200, 150][i], 9, C.cobalt900)
		if (i === 0) { rect(w, x + width - 150, ry - 16, 90, 32, C.mint300, 16); bar(w, x + width - 128, ry - 3, 46, 6, C.mint) }
	})
}

const content = {
	app: 'thematiq',
	// Round 24: the current's key elements where the orange is word art (the wire must not cross the words):
	// story 1 lands on the forest colour cell's left point, story 2 on the stock Nextcloud hex's.
	anchors: { promise: [1500, 760], hook: [1526, 300] },
	audience: { slug: 'government', name: 'Government and brands', persona: 'The house-style coordinator of a municipality (Sanne Willems) and the Rijkshuisstijl programme manager (Bram de Groot); shared-service platform admins (Youssef El Idrissi) and a company\'s head of marketing (Iris Bakker) folded in (Round 20: one Thematiq film)' },
	promise: 'Your car,\nyour house,\nyour colours',
	promiseLine: 'Do you really own it if you cannot style it your way? Thematiq makes Nextcloud yours: your tokens, your templates, your NL Design house style',
	title: 'Thematiq',
	record: { one: 'house style', many: 'house styles' },
	logline: 'A small story about ownership: you pick your car\'s colour and your house\'s, so why not your workspace\'s? Then the answer on the real screens: adjust 53 design tokens, share your templates through the store, and bring the NL Design tokens your organisation already has.',
	references: REFS,
	techniques: ['#2 sentence build as word art (the story)', '#3 grid-cell ripple (token rows, store cards)', '#9 text-swap on a held diagram (the token set list, the upload)'],
	neighbours: ['launchpad'],
	builtOnApps: [],
	hook: {
		title: 'Story 2: Your workspace, not your style?',
		caption: 'Your workspace,\nnot your style?',
		ui: { drawUI: () => {}, tagFill: 'cobalt' },
		source: 'Round 22 (Ruben): "do you really own it if you can\'t style it your way?" Story research in positioning-tk.md (Round 22): psychological ownership, control makes it feel yours (Pierce, Kostova and Dirks 2001, 2003).',
		motion: 'Word art, the story\'s turn. Straight out of story 1 the three colour hexes step off on 16ths; "Your workspace," slams in at 150 px one word per sixteenth while a single Nextcloud-blue hex with the Nextcloud mark lands top right on ease.brand: the stock workspace, the same for everyone. On beat 3 "not your style?" slams in at 180 px, "your style?" in orange (the scene\'s one orange). Holds; out: the hex shrinks into the token editor\'s swatch (match cut).',
		sound: 'A low thud under the Nextcloud hex, a hard tick per word, a short silence before "not your style?".',
	},
	proofs: [
		{
			id: 'tokens',
			title: 'Adjust 53 design tokens',
			caption: 'Adjust 53\ndesign tokens',
			source: 'Real screen: Custom Token Overrides (docs/img/token-editor-*.png, import-export-buttons.png). docs/features/token-editor.md on development: "4 category tabs grouping the 53 editable tokens by area". Specs token-editor-ui, token-import-export.',
			motion: 'The core, scene 3. The hex lands as the swatch of the first row and the real token editor builds round it: the grey header with Download and Upload, the four tabs ("Login page & Branding" active), then technique #3, grid-cell ripple: the token rows step 20% to 40% to full from the top, each with its CSS variable, swatch, hex field and reset. On beat 3 the first swatch takes the orange ring, turns from Nextcloud blue to the house colour and the blue custom dot pops after "Primary color".',
			sound: 'A ripple of ticks with the rows, a click on the swatch, a pluck as the custom dot pops.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Adjust 53\ndesign tokens', drawUI: tokensUI, tagFill: 'cobalt' }),
		},
		{
			id: 'store',
			title: 'Share your templates in the store',
			caption: 'Share your templates\nin the store',
			source: 'Rounds 21 and 22 (Ruben: share your templates through the store). No real screen yet: change catalogue-theme-gallery (open) lists shared sets with name, organisation, swatches, licence, source and contrast result; drawn in the look of the Nextcloud app store (docs/img/appstore-listing.png).',
			motion: 'Hard cut on the beat to the store, in the Nextcloud app store\'s look: its blue bar with the Nextcloud mark, "App store" and the search field, the category rail. Technique #3: the house-style cards step in in waves, swatches first, their rating dots filling. Your template is the first card; on beat 3 its share button takes the orange ring and fills.',
			sound: 'A ripple of ticks per wave, a click on share.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Share your templates\nin the store', drawUI: storeUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Bring your NL Design tokens along',
		caption: 'Bring your NL Design\ntokens along',
		source: 'Real screen: NL Design System Theme (docs/img/admin-nl-design-panel.png, guide-dropdown-open.png; templates/settings/admin.php): "Select a Dutch government design token set as a base", the Design token set list, and Custom token sets: "Upload your own house style as a token set, either as an NL Design CSS file (--nldesign-* variables) or a W3C Design Tokens JSON file." Specs nl-design, token-sets, custom-token-sets.',
		motion: 'For Dutch organisations (Round 22; replaces the old organisation-picker hook). Hard cut on the beat to the real "NL Design System Theme" section, its small "Dutch government" label top right. Technique #9, text-swap on a held diagram: the Design token set list opens and the selection steps down it; beside it the Custom token sets upload fills in its name and file, and on beat 3 "Choose file and upload" takes the orange ring; the imported set drops into the list below with a mint pill. BODY END: holds its caption to four frames before the bar line; its cards step down and the app tag travels into Built on Nextcloud.',
		params: {},
		sound: 'A tick per list step, a soft paper slide as the file goes in, a click on upload, a pluck as the set lands.',
	},
	promiseMotion: 'Round 22: the question becomes a small story in word art (story 1 of 2). Straight after the opening\'s handover, on its plain field, "Thematiq" sits small as the chapter mark and technique #2 builds the words large and expressive, one word per sixteenth: "Your car," at 150 px, "your house," stepped in to the right, and "your colours" at 190 px in orange (the scene\'s one orange), while three solid colour hexes (lavender, mint, forest) pop in on the right, one per line. Holds to four frames before beat 9, then the story turns.',
	promiseSound: 'The body\'s bed enters gently under the story (pad and offbeat bass, no stinger): a soft tick per word, a pluck per colour hex.',
}

const film = audienceFilm(content)
// Round 22: the two story cards are word art, and the NL Design import takes the general slot's time
// as an app scene (there is no data-layer scene in this film).
const B = (id) => film.boards.find((b) => b.id === id)
Object.assign(B('promise'), { title: 'Story 1: Your car, your house, your colours', drawBase: storyOne })
Object.assign(B('hook'), { drawBase: storyTwo })
Object.assign(B('general-dataLayer'), { id: 'nldesign', layer: 'app', module: 'proof', drawBase: (ctx, api) => FRAMES.hook(ctx, { app: 'thematiq', caption: 'Bring your NL Design\ntokens along', drawUI: nldesignUI, tagFill: 'cobalt' }) })
export const { meta, boards } = film
