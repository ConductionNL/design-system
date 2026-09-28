/**
 * Dossiq, audience film: municipal casework (municipalities and the social domain).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Reworked in Round 8
 * (Ruben, 2026-09-28): no AI in this film (it scares this audience), so the general slot is
 * the flow builder; the proofs are the strong ones he named. The deadline and stand-in beats
 * are out: at 25 to 30 words they no longer earn a slot over these.
 * Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     the team's work backlog: every case, who has it, working as a team (Round 8
 *            note; Dossiq specs my-work, add-work-queue, werkvoorraad-intelligent-queue)
 *   proof 1  the letter drafts itself from the case and opens as a Word file in Nextcloud,
 *            edited without leaving the case (Round 8 note; Dossiq specs beschikking-generatie,
 *            template-library, document-zaakdossier)
 *   proof 2  access rights per case: you decide who sees this case (Round 8 note; Dossiq spec
 *            people-on-the-case, role-routing-via-or-rbac)
 *   general  flows: draw the flow, share it through the store (Round 8 note: sharing case types
 *            and workflows through the store; Dossiq spec workflow-import-export)
 *   promise  "The whole team, every case"
 *
 * Kept in reserve: the knowledge graph (it carries the Pipelinq KCC film), deadlines, stand-in.
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (the backlog
 * gathers into team lanes), #1 dot-grows-to-fill as an upright hex (the template becomes the
 * letter), #5 stepped hex wipe (into access rights).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, toggle, docPage, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'A stepped wipe of flat shapes between chapters.' },
]

/** Hook: the backlog in team lanes (new, mine, the team's), each case with its type and owner. */
function backlogUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const lw = (width - 40) / 3
	const lanes = [[190, 160, 210, 170], [200, 150], [180, 220, 160]]
	lanes.forEach((cards, c) => {
		const lx = x + c * (lw + 20)
		rect(w, lx, top, lw, 560, C.cobalt50, 4 * u)
		bar(w, lx + 20, top + 26, 100, 10, C.cobalt700)
		rect(w, lx + lw - 56, top + 20, 36, 22, C.cobalt100, 11)
		cards.forEach((cw, i) => {
			const cy = top + 66 + i * 118
			panel(w, lx + 12, cy, lw - 24, 104, u)
			hex(w, lx + 44, cy + 34, 14, i === 0 && c === 0 ? C.lavender : C.cobalt300, 2)
			bar(w, lx + 70, cy + 26, Math.min(cw, lw - 110), 10, C.cobalt900)
			bar(w, lx + 70, cy + 46, Math.min(cw, lw - 110) * 0.5, 7, C.cobalt300)
			circle(w, lx + lw - 50, cy + 74, 14, c === 1 ? C.cobalt400 : C.cobalt200)
		})
	})
	// The case just picked up by a colleague: its card ringed, the scene's one orange.
	rect(w, x + (lw + 20) + 6, top + 60 + 118, lw - 12, 116, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the letter, drafted from the case, open in the office editor inside Nextcloud, beside the case. */
function letterUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The case, still there on the left: its fields, the ones that fill the letter.
	panel(w, x, top, 300, 560, u)
	hex(w, x + 50, top + 48, 18, C.lavender, 3)
	bar(w, x + 80, top + 40, 170, 12, C.cobalt900)
	for (let i = 0; i < 4; i++) {
		bar(w, x + 30, top + 110 + i * 70, 70, 7, C.cobalt400)
		bar(w, x + 30, top + 128 + i * 70, 180 - i * 24, 11, C.cobalt700)
	}
	// The editor: a Nextcloud-blue toolbar (Nextcloud's own office editing), the letter page in it.
	const ex = x + 330, ew = width - 330
	panel(w, ex, top, ew, 560, u)
	rect(w, ex, top, ew, 56, C.nextcloud, 0)
	for (let i = 0; i < 6; i++) rect(w, ex + 24 + i * 44, top + 16, 28, 24, C.white, 3, { opacity: 0.85 })
	docPage(w, ex + 40, top + 80, ew - 80, 600, { k: (ew - 80) / 500, values: [118, 96, 72], lastOrange: true, shadow: null })
}

/** Proof 2: access per case: the people on this case, their switches, and who may not see it. */
function accessUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 130, u)
	hex(w, x + 64, top + 65, 28, C.lavender, 4)
	use(w, 'icon-lock', x + 48, top + 49, 32, 32, C.white)
	bar(w, x + 120, top + 44, 260, 16, C.cobalt900)
	bar(w, x + 120, top + 76, 170, 9, C.cobalt300)
	idlePill(w, x + width - 150, top + 65, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	const ly = top + 160
	panel(w, x, ly, width, 12 + 5 * 80 + 12, u)
	const people = [[190, true], [160, true], [210, true], [170, false], [150, false]]
	people.forEach(([lw, on], i) => {
		const cy = ly + 52 + i * 80
		if (i > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		circle(w, x + 64, cy, 20, on ? C.cobalt300 : C.cobalt100)
		bar(w, x + 100, cy - 10, lw, 10, on ? C.cobalt900 : C.cobalt300)
		bar(w, x + 100, cy + 8, lw * 0.5, 7, C.cobalt200)
		toggle(w, x + width - 110, cy, u, on)
	})
	// The switch just turned off: the scene's one orange as its ring.
	rect(w, x + width - 124, ly + 52 + 3 * 80 - 24, 22 * u + 28, 48, 'none', 24, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'dossiq',
	audience: { slug: 'casework', name: 'Municipal casework', persona: 'Mireille Hendriks, case handler; Femke van Dijk, social-domain consultant; the manager of public services buys' },
	promise: 'The whole team,\nevery case',
	promiseLine: 'Your team works every case from one backlog, with its letters and its access rights inside the case, on the Nextcloud you already run',
	title: 'Dossiq for municipal casework',
	record: { one: 'case', many: 'cases' },
	logline: 'For municipal and social-domain casework: one backlog the whole team works from, a letter that drafts itself and opens in Word inside Nextcloud, access set per case, and flows you draw once and share through the store. No AI in this film.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge', '#1 dot-grows-to-fill (as a hex)', '#5 stepped hex wipe'],
	neighbours: ['portaliq', 'filinq'],
	builtOnApps: ['filinq'],
	hook: {
		title: 'Your team\'s work, one backlog',
		caption: 'Your team\'s work,\none backlog',
		ui: { drawUI: backlogUI, tagFill: 'cobalt' },
		source: 'Ruben, Round 8: "work backlog, overview, working in teams"; Dossiq specs my-work, add-work-queue, werkvoorraad-intelligent-queue, reassignment-bulk-action',
		motion: 'Technique #10, cluster-to-container merge. Frame 1 reads: caption, the backlog in three lanes, the Dossiq hex (cobalt: the one orange is the picked-up case) on the loop anchor. Over the first two beats the case cards start as loose hexes scattered over the window and each tweens into its lane on ease.brand, arriving within one beat. On beat 5 one card moves from the team\'s lane to a colleague\'s (ease.snap) and takes the orange ring.',
		sound: 'Gentle open. A run of soft ticks as the cards land, a pluck as the case changes hands.',
	},
	proofs: [
		{
			id: 'letter',
			title: 'Drafted for you, edited in Word',
			caption: 'Drafted for you,\nedited in Word',
			source: 'Ruben, Round 8: "automatic document creation and editing documents (Word files) from inside the case through Nextcloud"; Dossiq specs beschikking-generatie, template-library, document-zaakdossier',
			motion: 'Technique #1: the picked-up case\'s ring becomes an upright hex that grows past the frame (hexCut, ease.snap, one beat) and lands as the letter page. The case\'s fields sit on the left; one by one their values fly into the letter\'s slots (a sixteenth apart, the last in orange), then the editor\'s Nextcloud-blue toolbar drops in above the page: the letter is open in Word, inside the case.',
			sound: 'A whoosh through the hex, three plucks as the values land, a soft click as the editor opens.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Drafted for you,\nedited in Word', drawUI: letterUI, tagFill: 'cobalt' }),
		},
		{
			id: 'access',
			title: 'You decide who sees this case',
			caption: 'You decide who\nsees this case',
			source: 'Ruben, Round 8: "case-specific access rights"; Dossiq specs people-on-the-case, role-routing-via-or-rbac, zgw-autorisaties-api',
			motion: 'Technique #5, stepped hex wipe in: four upright cobalt hexes at rising scale step in from the right edge 70 ms apart and cut at full cover. On the case\'s people list, the fourth person\'s switch turns off on beat 3 (its row dims to cobalt-100), and the orange ring steps out round the switch once.',
			sound: 'Four dry clicks on the wipe steps, a crisp switch click as access turns off.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'You decide who\nsees this case', drawUI: accessUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'flows',
		title: 'Draw flows, share them in the store',
		caption: 'Draw flows,\nshare them in the store',
		source: 'Ruben, Round 8: "flow builder" and "share case types and workflows through the store"; Dossiq specs visual-workflow-editor, workflow-import-export; story.json mechanic 7 (the customer draws each flow)',
		sound: 'A tick as each node is placed, a pluck as the last settles into its slot.',
	},
}

export const { meta, boards } = audienceFilm(content)
