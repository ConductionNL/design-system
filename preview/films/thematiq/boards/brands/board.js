/**
 * Thematiq, audience film: brands (private-sector organisations with their own identity).
 * Positioning: ds-connext-film-review/audiences/positioning-tk.md. Sources:
 * ~/memcap-work/positioning/mi/positioning/thematiq.json (sp-runtime-rebrand, sp-token-editor,
 * usp-trial-without-touching-everyone (verified), sp-audit-trail) and Thematiq's specs on
 * development (admin-settings, token-editor-ui, theme-preview, theming-audit).
 *
 *   hook     HERO: save the new brand in the settings screen and the whole workspace repaints
 *            at once, from the save button outward (an upright hex grows to fill)
 *   proof 1  a colour picker for every value, grouped in tabs
 *   proof 2  trial it in your own session with a banner and a way back; a colleague still sees
 *            the old look
 *   general  the data layer: every change shows who and when
 *   promise  "Your new brand, live on launch day"
 *
 * Techniques (refs/techniques.md): #1 dot-grows-to-fill as an upright hex (the repaint), #11
 * whip-pan on the beat (the picker's tabs), #9 text-swap on a held diagram (the trial: only the
 * banner changes on the held windows).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, panel, button, widgetTile, topbar } from '../../../_lib/ui.js'
import { repaint } from '../../ui.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next state.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A fast move on the beat between held shots.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only one element changes.' },
]

const BRAND = [C.lavender, C.lavender300]

/** Hook: the brand settings screen; the new brand spreads from the save button as a growing hex. */
function rebrandUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	const body = (g, fill, tint) => {
		panel(g, x, top, width, 420, u)
		bar(g, x + 36, top + 36, 220, 14, C.cobalt900)
		// three brand fields: label, value, swatch in the current colour
		;[fill, tint, C.cobalt900].forEach((sw, i) => {
			const cy = top + 110 + i * 80
			bar(g, x + 36, cy - 5, 120, 9, C.cobalt400)
			rect(g, x + 190, cy - 24, width - 330, 48, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
			bar(g, x + 210, cy - 5, 160, 10, C.cobalt900)
			rect(g, x + width - 120, cy - 24, 84, 48, sw, 4, { stroke: C.cobalt100, 'stroke-width': u })
		})
		// the logo slot
		rect(g, x + 36, top + 340, 140, 56, tint, 4 * u)
		circle(g, x + 70, top + 368, 16, fill)
		bar(g, x + 96, top + 362, 60, 10, fill)
		// the workspace below: tiles whose heads carry the brand
		const ty = top + 450, tw = (width - 44) / 3
		for (let i = 0; i < 3; i++) {
			widgetTile(g, x + i * (tw + 22), ty, tw, 280, u, ['nc-files', 'nc-calendar', 'nc-talk'][i], (bx, by, bw) => {
				for (let k = 0; k < 4; k++) bar(g, bx, by + k * 34, bw * [0.9, 0.7, 0.8, 0.5][k], 8, C.cobalt200)
			})
			rect(g, x + i * (tw + 22), ty, tw, 10, fill, 2)
		}
	}
	const bx = x + width / 2 - 105, by = top + 342
	repaint(w, geom, { mode: 'hex', cx: bx + 105, cy: by + 26, r: 400, to: BRAND, content: body })
	// the save button, where the new brand starts: the one orange is its ring
	button(w, bx, by, 210, 52, u, { kind: 'accent' })
	rect(w, bx, by, 210, 52, C.lavender, 4 * u)
	bar(w, bx + 60, by + 22, 90, 8, C.white)
}

/** Proof 1: the token editor: tabs, value rows, and a picker of solid swatches open on one. */
function pickerUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 620, u)
	// tabs, the second active
	for (let i = 0; i < 5; i++) {
		bar(w, x + 40 + i * 150, top + 36, 100, 10, i === 1 ? C.cobalt900 : C.cobalt300)
		if (i === 1) rect(w, x + 34 + i * 150, top + 60, 112, 4 * u / 2, C.cobalt)
	}
	rect(w, x + 24, top + 72, width - 48, u, C.cobalt100)
	const vals = [C.lavender, C.lavender300, C.cobalt900, C.white, C.mint]
	vals.forEach((sw, i) => {
		const cy = top + 130 + i * 66
		bar(w, x + 40, cy - 5, [180, 150, 200, 130, 170][i], 10, C.cobalt700)
		rect(w, x + 330, cy - 20, 40, 40, sw, 4, { stroke: C.cobalt200, 'stroke-width': u })
	})
	// the picker popover beside the first value: solid swatches only, the chosen one ringed
	const px = x + 400, py = top + 96, pw = width - 440, ph = 330
	rect(w, px, py + 10, pw, ph, C.cobalt100, 6)
	panel(w, px, py, pw, ph, u)
	const sw = [C.lavender, C.lavender300, C.cobalt, C.cobalt300, C.mint, C.mint300, C.forest, C.forest300, C.nextcloud, C.cobalt900, C.gray500, C.gray300]
	const cs = (pw - 60) / 6
	sw.forEach((c, i) => {
		const col = i % 6, row = Math.floor(i / 6)
		rect(w, px + 30 + col * cs, py + 30 + row * (cs + 6), cs - 12, cs - 12, c, 4)
	})
	rect(w, px + 30 - 6, py + 30 - 6, cs, cs, 'none', 5, { stroke: C.orange, 'stroke-width': 2.5 * u })
	rect(w, px + 30, py + 2 * (cs + 6) + 44, pw - 60, 44, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	bar(w, px + 50, py + 2 * (cs + 6) + 62, 120, 9, C.cobalt900)
}

/** Proof 2: your own session trying the draft (banner, a way back) beside a colleague's, unchanged. */
function trialUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	const mini = (mx, my, mw, mh, fill, draft) => {
		panel(w, mx, my, mw, mh, u)
		topbar(w, mx, my, mw, u * 0.7, { fill })
		let y = my + 24 * u * 0.7
		if (draft) {
			rect(w, mx, y, mw, 56, C.lavender300)
			bar(w, mx + 24, y + 24, 200, 9, C.cobalt900)
			button(w, mx + mw - 150, y + 10, 130, 36, u * 0.7, { kind: 'ghost' })
			rect(w, mx + mw - 156, y + 4, 142, 48, 'none', 5, { stroke: C.orange, 'stroke-width': 2.5 * u })
			y += 56
		}
		rect(w, mx, y, 90, mh - (y - my), C.cobalt50)
		rect(w, mx + 12, y + 16, 66, 26, fill, 3)
		for (let k = 0; k < 4; k++) bar(w, mx + 120, y + 30 + k * 40, (mw - 170) * [0.8, 0.6, 0.7, 0.5][k], 9, C.cobalt200)
		rect(w, mx + 120, y + 200, 150, 44, fill, 3 * u)
	}
	mini(x, top, width * 0.64, 520, BRAND[0], true)
	circle(w, x + width * 0.64 - 30, top + 560, 22, C.cobalt300)
	mini(x + width * 0.68, top + 120, width * 0.32, 400, C.nextcloud, false)
	circle(w, x + width - 30, top + 560, 22, C.cobalt200)
}

const content = {
	app: 'thematiq',
	audience: { slug: 'brands', name: 'Brands', persona: 'The head of marketing and communications at a 300-person company (Iris Bakker)' },
	promise: 'Your brand,\nlive on launch day',
	promiseLine: 'Your new brand on every screen staff use, on launch day',
	title: 'Thematiq for brands',
	record: { one: 'brand', many: 'brands' },
	logline: 'For companies: rebrand every screen of the workspace at once, set each colour with a picker, try it yourself before anyone sees, and every change is on record.',
	references: REFS,
	techniques: ['#1 dot-grows-to-fill (as a hex)', '#11 whip-pan on the beat', '#9 text-swap on a held diagram', '#2 zoom-out sentence build'],
	neighbours: ['launchpad', 'portaliq'],
	builtOnApps: ['launchpad'],
	hook: {
		title: 'New brand, every screen at once',
		caption: 'New brand,\nevery screen at once',
		ui: { drawUI: rebrandUI, tagFill: 'cobalt' },
		source: 'thematiq.json sp-runtime-rebrand: "Rebrand the whole workspace from a settings screen, live at once." Spec admin-settings.',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the brand settings screen in Nextcloud blue. On beat 2 the save button is pressed (orange ring, a tick). Technique #1, dot-grows-to-fill as an upright hex: a hex in the new brand colour opens from the button and grows past the window edge in one beat (ease.snap), and everything inside it is already the new brand: topbar, nav, fields, tiles. Two thin stepped rings trail its edge. The still is the hex at mid-growth. Out: the hex keeps growing into the editor scene.',
		sound: 'A click on save, a soft rising whoosh under the growing hex, a low thud as it passes the frame.',
	},
	proofs: [
		{
			id: 'picker',
			title: 'Change any colour yourself',
			caption: 'Change any colour\nyourself',
			source: 'thematiq.json sp-token-editor: "Open a colour picker for each value, already grouped in tabs." Spec token-editor-ui.',
			motion: 'Technique #11, whip-pan on the beat: the camera whips across two tabs (5 frames each, ease.snap, --blur 4) and lands on the colour tab. The picker opens on the first value; the chosen swatch takes the orange ring and the value row\'s swatch follows it.',
			sound: 'Two short whooshes on the whips, a pluck as the picker opens, a tick on the swatch.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Change any colour\nyourself', drawUI: pickerUI, tagFill: 'cobalt' }),
		},
		{
			id: 'trial',
			title: 'Trial it before anyone sees',
			caption: 'Trial it before\nanyone sees',
			source: 'thematiq.json usp-trial-without-touching-everyone (verified): "Trial a house style in your own session with a banner and a way back." Spec theme-preview (per-user preview, instance untouched).',
			motion: 'Technique #9, text-swap on a held diagram: two windows hold still, yours and a colleague\'s. Only yours changes: the draft banner drops in with its way-back button (orange ring) and your window takes the new brand; the colleague\'s stays Nextcloud blue the whole time.',
			sound: 'A soft pluck as the banner drops, silence on the held window.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Trial it before\nanyone sees', drawUI: trialUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Every change shows\nwho and when',
		source: 'thematiq.json sp-audit-trail; spec theming-audit; COPY.dataLayer',
		params: {
			record: { avatar: 'square', title: 220, sub: 150, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 180 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-files', 'nc-mail'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15). Straight after the opening\'s handover, on its plain field, the Thematiq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Thematiq" the promise builds one word per sixteenth from two frames after the handover while the type column eases back. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Thematiq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
