/**
 * Thematiq, ONE audience film (Round 20, Ruben 2026-09-28): the brands film merged into the
 * government film. Speaks to the house-style coordinator of a municipality (Sanne Willems), the
 * Rijkshuisstijl programme manager (Bram de Groot), shared-service platform admins and a company's
 * head of marketing (Iris Bakker). Positioning: ds-connext-film-review/audiences/positioning-tk.md.
 * Sources: ~/memcap-work/positioning/mi/positioning/thematiq.json (usp-government-house-styles,
 * sp-token-editor, usp-prove-the-contrast, sp-audit-trail) and Thematiq's repo on development
 * (docs/features/token-editor.md: "4 category tabs grouping the 53 editable tokens"; specs
 * token-sets, nl-design, custom-token-sets, token-editor-ui, token-set-contrast-audit,
 * theming-audit; change catalogue-theme-gallery: an opt-in gallery of community and supplier
 * token sets, each with its contrast result, installed by an administrator).
 *
 *   question "What if Nextcloud had your house style?" (Round 19, from "Nextcloud in your own
 *            house style")
 *   hook     HERO: pick your organisation from the NL Design System themes (labelled for Dutch
 *            government) and Nextcloud repaints into your house style (a stepped hex wipe)
 *   proof 1  your house-style templates (manage, upload, activate) and all 53 design tokens you
 *            can adjust, in four tabs
 *   proof 2  share house styles through the gallery: sets from other organisations and
 *            suppliers, each with its contrast result (WCAG), one installed
 *   general  the data layer: every change shows who and when
 *
 * Round 20 USPs Ruben missed, all in the picture: template management (proof 1, left), the
 * number of design tokens (proof 1, caption and label), sharing templates through the store
 * (proof 2; the specs call it the theme gallery), NL Design System themes for Dutch government
 * (the hook's picker label).
 *
 * Techniques (refs/techniques.md): #5 stepped hex wipe (the repaint), #3 grid-cell ripple (the
 * token rows, the gallery cards), #2 zoom-out sentence build (the question).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { textBlock } from '../../../_lib/stage.js'
import { rect, bar, circle, panel, statusPill, use, docPage, button, widgetTile } from '../../../_lib/ui.js'
import { repaint } from '../../ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'A stepped shape crosses the frame in flat steps; grid cells light in waves.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The sentence builds as the camera pulls back.' },
]

/** Hook: the organisation picker open over a workspace that is half repainted. */
function styleUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	const body = (g, fill, tint) => {
		// the dashboard behind the picker: three widget tiles whose heads carry the style
		const ty = top + 330
		const tw = (width - 44) / 3
		for (let i = 0; i < 3; i++) {
			widgetTile(g, x + i * (tw + 22), ty, tw, 300, u, ['nc-files', 'nc-calendar', 'nc-mail'][i], (bx, by, bw) => {
				for (let k = 0; k < 4; k++) bar(g, bx, by + k * 34, bw * [0.9, 0.7, 0.8, 0.5][k], 8, C.cobalt200)
			})
			rect(g, x + i * (tw + 22), ty, tw, 10, fill, 2)
		}
		rect(g, x, ty + 330, width, 200, tint, 4 * u)
		button(g, x + 40, ty + 400, 180, 60, u)
		rect(g, x + 40, ty + 400, 180, 60, fill, 4 * u)
		bar(g, x + 80, ty + 426, 100, 9, C.white)
	}
	repaint(w, geom, { mode: 'wipe', at: 600, content: body })
	// The picker: a field and its open list of organisations, each with its palette.
	panel(w, x, top, width, 300, u)
	rect(w, x + 30, top + 26, width - 60, 56, C.white, 4 * u, { stroke: C.cobalt200, 'stroke-width': u })
	// Round 20: the themes are NL Design System's, labelled for Dutch government
	textBlock(w, 'NL Design System · Dutch government', { x: x + 110, y: top + 64, size: 26, weight: 600, fill: C.cobalt900, clip: false })
	const pals = [[C.cobalt, C.cobalt300], [C.forest, C.forest300], [C.lavender, C.lavender300], [C.mint, C.mint300]]
	pals.forEach(([a, b], i) => {
		const cy = top + 122 + i * 44
		if (i === 1) rect(w, x + 30, cy - 21, width - 60, 42, C.cobalt50, 3 * u)
		bar(w, x + 56, cy - 5, [230, 280, 200, 250][i], 10, i === 1 ? C.cobalt900 : C.cobalt700)
		rect(w, x + width - 150, cy - 12, 24, 24, a, 3)
		rect(w, x + width - 118, cy - 12, 24, 24, b, 3)
		rect(w, x + width - 86, cy - 12, 24, 24, C.white, 3, { stroke: C.cobalt200, 'stroke-width': u })
	})
	// the chosen organisation: the scene's one orange, a ring round its row
	rect(w, x + 24, top + 122 + 44 - 26, width - 48, 52, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: your templates on the left (one active, one uploading); the token editor on the right, 4 tabs, 53 tokens. */
function tokensUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	const lw = 300
	// templates: your house styles, each with its swatches; the active one ticked
	panel(w, x, top, lw, 600, u)
	textBlock(w, 'Templates', { x: x + 110, y: top + 54, size: 26, weight: 600, fill: C.cobalt900, clip: false })
	const sets = [[C.forest, C.forest300], [C.cobalt, C.cobalt300], [C.lavender, C.lavender300], [C.mint, C.mint300]]
	sets.forEach(([a, b2], i) => {
		const cy = top + 120 + i * 84
		if (i === 0) rect(w, x + 14, cy - 34, lw - 28, 68, C.cobalt50, 3 * u)
		rect(w, x + 30, cy - 16, 28, 28, a, 3)
		rect(w, x + 62, cy - 16, 28, 28, b2, 3)
		bar(w, x + 108, cy - 5, [120, 100, 130, 90][i], 9, C.cobalt700)
		if (i === 0) { rect(w, x + lw - 64, cy - 16, 32, 32, C.mint, 4); use(w, 'icon-check', x + lw - 60, cy - 12, 24, 24, C.white) }
	})
	button(w, x + 30, top + 500, lw - 60, 56, u, { kind: 'ghost' })
	// the token editor: 4 tabs, the count, one row per token with its colour
	const ex = x + lw + 24, ew = width - lw - 24
	panel(w, ex, top, ew, 600, u)
	for (let i = 0; i < 4; i++) {
		bar(w, ex + 30 + i * 78, top + 36, 54, 10, i === 1 ? C.cobalt900 : C.cobalt300)
		if (i === 1) rect(w, ex + 24 + i * 78, top + 60, 66, 2 * u, C.cobalt)
	}
	textBlock(w, '53 tokens', { x: ex + ew - 140, y: top + 50, size: 26, weight: 600, fill: C.cobalt900, clip: false })
	rect(w, ex + 20, top + 72, ew - 40, u, C.cobalt100)
	const vals = [C.forest, C.forest300, C.cobalt900, C.white, C.mint, C.cobalt50]
	vals.forEach((sw, i) => {
		const cy = top + 124 + i * 72
		if (i > 0) rect(w, ex + 20, cy - 36, ew - 40, u, C.cobalt50)
		bar(w, ex + 30, cy - 5, [170, 140, 190, 120, 160, 130][i], 9, C.cobalt700)
		rect(w, ex + ew - 150, cy - 20, 40, 40, sw, 4, { stroke: C.cobalt200, 'stroke-width': u })
		bar(w, ex + ew - 96, cy - 4, 64, 8, C.cobalt300)
	})
	// the token being adjusted: the scene's one orange
	rect(w, ex + 14, top + 124 + 72 - 30, ew - 28, 60, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the gallery: house styles other organisations and suppliers shared, each with its contrast result; one installing. */
function galleryUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 610, u)
	textBlock(w, 'Gallery', { x: x + 110, y: top + 54, size: 26, weight: 600, fill: C.cobalt900, clip: false })
	button(w, x + width - 200, top + 22, 170, 50, u, { kind: 'ghost' })
	const pals = [[C.forest, C.forest300], [C.lavender, C.lavender300], [C.cobalt, C.cobalt300], [C.mint, C.mint300]]
	const cw = (width - 90) / 2, ch = 240
	pals.forEach(([a, b2], i) => {
		const cx = x + 30 + (i % 2) * (cw + 30), cy = top + 96 + Math.floor(i / 2) * (ch + 20)
		panel(w, cx, cy, cw, ch, u)
		rect(w, cx, cy, cw * 0.5, 56, a, 0)
		rect(w, cx + cw * 0.5, cy, cw * 0.3, 56, b2, 0)
		rect(w, cx + cw * 0.8, cy, cw * 0.2, 56, C.white, 0)
		bar(w, cx + 24, cy + 84, [180, 150, 200, 140][i], 11, C.cobalt900)
		bar(w, cx + 24, cy + 112, 120, 8, C.cobalt300)
		// the contrast result, the small WCAG label on a mint pill
		rect(w, cx + 24, cy + 150, 110, 36, C.mint300, 18)
		textBlock(w, 'WCAG', { x: cx + 44, y: cy + 176, size: 20, weight: 600, fill: C.cobalt900, clip: false })
		button(w, cx + cw - 164, cy + ch - 70, 140, 48, u, { kind: i === 0 ? 'primary' : 'ghost' })
	})
	// installing the first: the scene's one orange
	const cx0 = x + 30, cy0 = top + 96
	rect(w, cx0 + cw - 172, cy0 + ch - 78, 156, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'thematiq',
	audience: { slug: 'government', name: 'Government and brands', persona: 'The house-style coordinator of a municipality (Sanne Willems) and the Rijkshuisstijl programme manager (Bram de Groot); shared-service platform admins (Youssef El Idrissi) and a company\'s head of marketing (Iris Bakker) folded in (Round 20: one Thematiq film)' },
	promise: 'What if Nextcloud\nhad your\nhouse style?',
	promiseLine: "Nextcloud in your government's own house style, checked for accessibility first",
	title: 'Thematiq',
	record: { one: 'house style', many: 'house styles' },
	logline: 'What if Nextcloud had your house style? Pick your organisation from the NL Design System themes and Nextcloud repaints, manage your own templates and adjust 53 design tokens, share house styles through the gallery with their contrast result, and every change is on record.',
	references: REFS,
	techniques: ['#5 stepped hex wipe', '#3 grid-cell ripple (token rows, gallery cards)', '#2 zoom-out sentence build (the question)'],
	neighbours: ['portaliq', 'launchpad'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'Pick your organisation, the style loads',
		caption: 'Pick your organisation,\nthe style loads',
		ui: { drawUI: styleUI, tagFill: 'cobalt' },
		source: 'thematiq.json usp-government-house-styles (verified): "Pick your organisation and the exact house style loads." Specs token-sets (shipped sets in token-sets.json: Rijkshuisstijl, VNG, provinces, municipalities; no count on screen).',
		motion: 'In behind the app hex the question leaves on the loop anchor, the key frame reads: caption, the organisation picker open with its NL Design System label (for Dutch government), the workspace still in Nextcloud blue. On beat 2 the chosen row takes its orange ring with a tick. Technique #5, stepped hex wipe: a column of pointy-top hexes in three stepped sizes enters the window from the left edge and crosses it on ease.snap in four flat steps (one per eighth), and everything behind it repaints: the topbar, the nav head, the title bar, the tile heads and the primary button turn from Nextcloud blue into the house style. The still is the wipe at mid-window. Out: the hex match cut from the wipe column into the templates.',
		sound: 'A tick as the row is picked, four dry clicks as the wipe steps, a soft whoosh behind it.',
	},
	proofs: [
		{
			id: 'tokens',
			title: 'Adjust 53 design tokens',
			caption: 'Adjust 53\ndesign tokens',
			source: 'Round 20 (template management, the number of tokens). Thematiq docs/features/token-editor.md on development: "4 category tabs grouping the 53 editable tokens by area"; specs token-editor-ui, custom-token-sets (upload, manage and activate your own house-style sets), token-sets; thematiq.json sp-token-editor.',
			motion: 'The hex lands as the templates list on the left and the token editor on the right. The templates drop in a sixteenth apart, the active one ticking mint. Technique #3, grid-cell ripple: the token rows step 20% to 40% to full from the top; the "53 tokens" label sits by the tabs. On beat 3 the second row takes the orange ring and its colour swaps in place.',
			sound: 'A soft pluck per template, a ripple of ticks with the rows, a click as the colour swaps.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Adjust 53\ndesign tokens', drawUI: tokensUI, tagFill: 'cobalt' }),
		},
		{
			id: 'gallery',
			title: 'Share house styles through the gallery',
			caption: 'Share house styles\nthrough the gallery',
			source: 'Round 20 (sharing templates through the store). Thematiq change catalogue-theme-gallery on development: an opt-in gallery of community and supplier token sets with name, organisation, swatches, licence, source and the contrast result; a contribution guide for getting a set in; installing is an administrator\'s choice. Contrast: spec token-set-contrast-audit, thematiq.json usp-prove-the-contrast.',
			motion: 'Hard cut on the beat to the gallery. Technique #3, grid-cell ripple: the four house-style cards step in from 20% to full in waves, swatches first, each settling its mint WCAG pill (the contrast result). On beat 3 the first card\'s install button takes the orange ring and fills.',
			sound: 'A ripple of ticks per wave, a pluck per WCAG pill, a click on install.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Share house styles\nthrough the gallery', drawUI: galleryUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Every change shows\nwho and when',
		source: 'thematiq.json sp-audit-trail ("See exactly who touched a theme setting last"); spec theming-audit; COPY.dataLayer',
		params: {
			record: { avatar: 'square', title: 240, sub: 150, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 180 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-files', 'nc-mail'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	promiseMotion: 'Round 19: the promise card is a question, and the proofs answer it (no answer card). Technique #2, zoom-out sentence build, the body\'s opening statement. Straight after the opening\'s handover, on its plain field, the Thematiq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Thematiq" the question builds one word per sixteenth from two frames after the handover, each word slamming in large while the type column eases back (ease.brand) so the line always just fits. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Thematiq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
