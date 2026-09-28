/**
 * Thematiq, audience film: government (municipalities and central government; shared-service
 * providers folded in). Positioning: ds-connext-film-review/audiences/positioning-tk.md.
 * Sources: ~/memcap-work/positioning/mi/positioning/thematiq.json (usp-government-house-styles,
 * usp-see-before-you-switch, usp-prove-the-contrast, sp-audit-trail; all confidence verified)
 * and Thematiq's specs on development (token-sets, token-set-apply-dialog, token-set-contrast-audit,
 * compliance-evidence, theming-audit).
 *
 *   hook     HERO: pick your organisation, and the Nextcloud workspace repaints from Nextcloud
 *            blue into your house style (a stepped hex wipe crosses the window)
 *   proof 1  see every value that will change, tick which ones to take (apply dialog)
 *   proof 2  WCAG contrast proven: every colour pair checked, the evidence report downloads
 *   general  the data layer: every change shows who and when
 *   promise  "Your house style, live and accessible"
 *
 * Techniques (refs/techniques.md): #5 stepped hex wipe (the repaint), #3 grid-cell ripple (the
 * contrast pairs pass in waves), #2 zoom-out sentence build (the promise).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
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
	bar(w, x + 56, top + 48, 260, 12, C.cobalt900)
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

/** Proof 1: the apply dialog: current value, new value, a tick per change. */
function applyUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 600, u)
	bar(w, x + 40, top + 40, 300, 16, C.cobalt900)
	bar(w, x + 40, top + 72, 420, 9, C.cobalt300)
	const rows = [[C.nextcloud, C.forest, true], [C.cobalt50, C.forest300, true], [C.cobalt900, C.cobalt900, false], [C.white, C.cobalt50, true], [C.nextcloud, C.forest, true]]
	rows.forEach(([from, to, on], i) => {
		const cy = top + 140 + i * 76
		if (i > 0) rect(w, x + 24, cy - 38, width - 48, u, C.cobalt50)
		rect(w, x + 40, cy - 16, 32, 32, on ? C.mint : C.white, 4, on ? {} : { stroke: C.cobalt300, 'stroke-width': u })
		if (on) use(w, 'icon-check', x + 44, cy - 12, 24, 24, C.white)
		bar(w, x + 100, cy - 5, [240, 200, 260, 180, 220][i], 10, C.cobalt700)
		rect(w, x + width - 300, cy - 20, 60, 40, from, 4, { stroke: C.cobalt200, 'stroke-width': u })
		bar(w, x + width - 220, cy - 1.5, 40, 3, C.cobalt300)
		rect(w, x + width - 160, cy - 20, 60, 40, to, 4, { stroke: C.cobalt200, 'stroke-width': u })
	})
	button(w, x + width - 460, top + 520, 180, 56, u, { kind: 'ghost' })
	button(w, x + width - 250, top + 520, 210, 56, u, { kind: 'accent' })
}

/** Proof 2: every colour pair checked against WCAG, and the evidence report coming out. */
function contrastUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, 470, 620, u)
	bar(w, x + 36, top + 36, 220, 14, C.cobalt900)
	const pairs = [[C.forest, C.white], [C.white, C.forest], [C.cobalt900, C.cobalt50], [C.forest, C.cobalt50], [C.cobalt900, C.forest300], [C.white, C.cobalt400]]
	pairs.forEach(([bg, ink], i) => {
		const cy = top + 104 + i * 80
		rect(w, x + 36, cy - 26, 92, 52, bg, 4, { stroke: C.cobalt100, 'stroke-width': u })
		bar(w, x + 54, cy - 5, 56, 10, ink)
		bar(w, x + 150, cy - 5, 120 - (i % 3) * 20, 9, C.cobalt700)
		statusPill(w, x + 470 - 120, cy, u)
	})
	// the report: a document page with the result, and the download ringed
	docPage(w, x + 510, top + 20, width - 510, 480, { k: 1.2, lastOrange: false, rule: C.forest })
	rect(w, x + 530, top + 540, width - 550, 60, C.cobalt50, 4 * u)
	use(w, 'nc-files', x + 548, top + 552, 36, 36, C.cobalt)
	bar(w, x + 600, top + 565, 160, 10, C.cobalt700)
	rect(w, x + 524, top + 534, width - 538, 72, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'thematiq',
	audience: { slug: 'government', name: 'Government', persona: 'The house-style coordinator of a municipality (Sanne Willems) and the Rijkshuisstijl programme manager (Bram de Groot); shared-service platform admins (Youssef El Idrissi) folded in' },
	promise: 'Your house style,\nlive and accessible',
	promiseLine: "Your government's house style goes live in Nextcloud, checked against WCAG first",
	title: 'Thematiq for government',
	record: { one: 'house style', many: 'house styles' },
	logline: 'For government: pick your organisation and Nextcloud turns into your own house style, see every change before you switch, prove the contrast in one download, and every change is on record.',
	references: REFS,
	techniques: ['#5 stepped hex wipe', '#3 grid-cell ripple', '#2 zoom-out sentence build'],
	neighbours: ['portaliq', 'launchpad'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'One pick, your house style',
		caption: 'One pick,\nyour house style',
		ui: { drawUI: styleUI, tagFill: 'cobalt' },
		source: 'thematiq.json usp-government-house-styles (verified): "Pick your organisation and the exact house style loads." Specs token-sets (shipped sets in token-sets.json: Rijkshuisstijl, VNG, provinces, municipalities; no count on screen).',
		motion: 'Frame 1 reads: caption, the organisation picker open, the workspace still in Nextcloud blue. On beat 2 the chosen row takes its orange ring with a tick. Technique #5, stepped hex wipe: a column of pointy-top hexes in three stepped sizes enters the window from the left edge and crosses it on ease.snap in four flat steps (one per eighth), and everything behind it repaints: the topbar, the nav head, the title bar, the tile heads and the primary button turn from Nextcloud blue into the house style. The still is the wipe at mid-window. Out: the hex match cut from the wipe column into the dialog.',
		sound: 'Gentle open, no stinger: pad and offbeat bass. A tick as the row is picked, four dry clicks as the wipe steps, a soft whoosh behind it.',
	},
	proofs: [
		{
			id: 'apply',
			title: 'See every change before you switch',
			caption: 'See every change\nbefore you switch',
			source: 'thematiq.json usp-see-before-you-switch (verified). Spec token-set-apply-dialog: the dialog lists every Nextcloud value that would change, current vs new, and writes only the checked ones.',
			motion: 'The hex lands as the dialog. Rows drop in a sixteenth apart, each with its current and new colour; the ticks fill in mint top to bottom, the third stays unticked (you keep that one). The confirm button takes the orange ring on the last beat.',
			sound: 'A soft pluck per row, a tick per checkbox, a click on the ring.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'See every change\nbefore you switch', drawUI: applyUI, tagFill: 'cobalt' }),
		},
		{
			id: 'contrast',
			title: 'Contrast proven, one WCAG report',
			caption: 'Contrast proven,\none WCAG report',
			source: 'thematiq.json usp-prove-the-contrast (verified): "Download a compliance report proving your active colours meet WCAG contrast." Specs token-set-contrast-audit, compliance-evidence.',
			motion: 'Technique #3, grid-cell ripple: the colour pairs step 20% to 40% to full opacity in waves from the top, and each pass settles its mint pill. On the last wave the report page slides out beside them, its rule in the house style, and the download row takes the orange ring.',
			sound: 'A ripple of ticks per wave, a paper slide, a click on the download.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Contrast proven,\none WCAG report', drawUI: contrastUI, tagFill: 'cobalt' }),
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
	promiseMotion: 'Technique #2, zoom-out sentence build. The Thematiq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Thematiq" the promise builds one word per eighth note, each word slamming in large while the type column eases back (ease.brand) so the line always just fits. Holds to the bar line, then the cells step toward Nextcloud for Built on.',
}

export const { meta, boards } = audienceFilm(content)
