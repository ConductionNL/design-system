/**
 * Dossiq, audience film: municipal casework (municipalities and the social domain).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Reworked in Round 8
 * (no AI: the general slot is the flow builder) and Round 9 (Ruben, 2026-09-28): the knowledge
 * graph is back, a standards beat is added, and "You decide who sees this case" is dropped as
 * the weakest beat. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     the team's work backlog: every case in lanes, working as a team (Round 8 note;
 *            Dossiq specs my-work, add-work-queue, werkvoorraad-intelligent-queue)
 *   proof 1  one take, two beats: the letter drafts itself and is edited as a Word file inside
 *            Nextcloud, and related knowledge (the knowledge graph) lands beside it while you
 *            work, the same device as the Pipelinq contact-centre film (Round 8 and 9 notes;
 *            Dossiq specs beschikking-generatie, template-library, document-zaakdossier)
 *   proof 2  standards: every case speaks CMMN (international) and ZGW (Dutch). Sources:
 *            procest origin/development openspec/specs/case-management/spec.md:17 and
 *            case-types/spec.md:27 ("Standards: CMMN 1.1 ... ZGW"); positioning dossiq.md:96,
 *            104, 290 ("speak the ZGW case standard"). A Danish standard is not named in any
 *            source, so none is shown (unresolved, see PROGRESS.md)
 *   general  flows: draw flows, share them in the store (Round 8 note)
 *   promise  "The whole team, every case"
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (the backlog),
 * #1 dot-grows-to-fill as an upright hex (into the letter), #4 typewriter with knowledge items
 * landing (as in the Pipelinq contact-centre film), #5 stepped hex wipe (into the standards).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { textBlock } from '../../../_lib/stage.js'
import { rect, bar, circle, hex, panel, statusPill, docPage } from '../../../_lib/ui.js'

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

/** Proof 1: the letter open in Word inside Nextcloud, and related knowledge landing beside it as you work. */
function letterUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The editor: a Nextcloud-blue toolbar (Nextcloud's own office editing), the drafted letter in it,
	// a cursor in the line being edited.
	const ew = 500
	panel(w, x, top, ew, 580, u)
	rect(w, x, top, ew, 56, C.nextcloud, 0)
	for (let i = 0; i < 6; i++) rect(w, x + 24 + i * 44, top + 16, 28, 24, C.white, 3, { opacity: 0.85 })
	docPage(w, x + 30, top + 80, ew - 60, 600, { k: (ew - 60) / 500, values: [118, 96, 72], lastOrange: false, shadow: null })
	rect(w, x + 30 + 44 * ((ew - 60) / 500) + 330, top + 80 + 172 * ((ew - 60) / 500), 3 * u, 22, C.cobalt)
	// The knowledge beside it: related items linked in a small graph, the best match ringed (the one orange).
	const kx = x + ew + 30, kw = width - ew - 30
	panel(w, kx, top, kw, 580, u)
	bar(w, kx + 30, top + 40, 120, 10, C.cobalt400)
	rect(w, kx + 70 - 1.5 * u, top + 130, 3 * u, 240, C.cobalt200)
	;[[top + 130, C.cobalt], [top + 250, C.cobalt300], [top + 370, C.cobalt300]].forEach(([ny, f], i) => {
		hex(w, kx + 70, ny, 22, f, 3)
		bar(w, kx + 114, ny - 14, kw - 170 - i * 30, 11, C.cobalt900)
		bar(w, kx + 114, ny + 8, (kw - 170) * 0.6, 7, C.cobalt300)
	})
	rect(w, kx + 14, top + 90, kw - 28, 82, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: one case, kept in two standards: the international case model and the Dutch case standard. */
function standardsUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The case.
	panel(w, x, top, width, 130, u)
	hex(w, x + 64, top + 65, 28, C.lavender, 4)
	bar(w, x + 120, top + 44, 260, 16, C.cobalt900)
	bar(w, x + 120, top + 76, 170, 9, C.cobalt300)
	statusPill(w, x + width - 160, top + 65, u)
	// Square-cornered wires down to the two standards.
	const bw = (width - 30) / 2, by = top + 220
	rect(w, x + 64 - 1.5 * u, top + 130, 3 * u, 50, C.cobalt300)
	rect(w, x + 64, top + 178, bw + 30 + bw / 2 - 64, 3 * u, C.cobalt300)
	rect(w, x + bw / 2 - 1.5 * u, top + 178, 3 * u, by - top - 178, C.cobalt300)
	rect(w, x + bw + 30 + bw / 2 - 1.5 * u, top + 178, 3 * u, by - top - 178, C.cobalt300)
	// Where the one case splits into both standards: the scene's one orange.
	hex(w, x + bw + 15, top + 178 + 1.5 * u, 16, C.orange, 2)
	// Left: the international case model, a plan of stages and tasks.
	const box = (bx, label) => {
		panel(w, bx, by, bw, 360, u)
		rect(w, bx, by, bw, 64, C.cobalt50, 0)
		textBlock(w, label, { x: bx + 28, y: by + 44, size: 36, weight: 600, fill: C.cobalt, clip: false })
	}
	box(x, 'CMMN 1.1')
	rect(w, x + 30, by + 100, bw - 60, 220, 'none', 12 * u, { stroke: C.cobalt300, 'stroke-width': u })
	;[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([c, r]) => rect(w, x + 60 + c * ((bw - 120) / 2 + 20), by + 130 + r * 90, (bw - 140) / 2, 60, C.cobalt100, 6 * u))
	// Right: the Dutch case standard, its fields filled.
	box(x + bw + 30, 'ZGW')
	for (let i = 0; i < 4; i++) {
		const fy = by + 110 + i * 60
		bar(w, x + bw + 60, fy, 90, 8, C.cobalt400)
		bar(w, x + bw + 170, fy - 2, 140 - i * 16, 11, C.cobalt900)
	}
}

const content = {
	app: 'dossiq',
	audience: { slug: 'casework', name: 'Municipal casework', persona: 'Mireille Hendriks, case handler; Femke van Dijk, social-domain consultant; the manager of public services buys' },
	promise: 'The whole team,\nevery case',
	promiseLine: 'Your team works every case from one backlog, with its letters and knowledge at hand, kept in international and Dutch case standards, on the Nextcloud you already run',
	title: 'Dossiq for municipal casework',
	record: { one: 'case', many: 'cases' },
	logline: 'For municipal and social-domain casework: one backlog the whole team works from, a letter drafted in Word inside Nextcloud with the related knowledge beside it, every case in CMMN and ZGW, and flows you draw once and share through the store. No AI in this film.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge', '#1 dot-grows-to-fill (as a hex)', '#4 typewriter (as in the Pipelinq contact-centre film)', '#5 stepped hex wipe'],
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
			title: 'Drafted in Word, the answers appear',
			caption: 'Drafted in Word,\nthe answers appear',
			source: 'Ruben, Round 8 ("automatic document creation and editing documents (Word files) from inside the case through Nextcloud") and Round 9 ("related knowledge appears while you work the case", the knowledge graph); Dossiq specs beschikking-generatie, template-library, document-zaakdossier',
			motion: 'One take carrying two beats. Technique #1: the picked-up case\'s ring becomes an upright hex that grows past the frame (hexCut, ease.snap, one beat) and lands as the letter, open in Word under Nextcloud\'s blue toolbar; its values fill a sixteenth apart (the draft). Then technique #4, as in the Pipelinq contact-centre film: the edited line types on (greeked characters one pair per 0.1 s, hard on and off, a cursor), and the related knowledge items land in the panel on the right one per beat, linked by a thin line; the best match takes the orange ring.',
			sound: 'A whoosh through the hex, three plucks as the draft fills, soft key ticks under the typing, a pluck as each knowledge item lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Drafted in Word,\nthe answers appear', drawUI: letterUI, tagFill: 'cobalt' }),
		},
		{
			id: 'standards',
			title: 'Every case speaks CMMN and ZGW',
			caption: 'Every case speaks\nCMMN and ZGW',
			source: 'Dossiq specs on development: case-management/spec.md:17 "Standards: CMMN 1.1 (CasePlanModel), Schema.org (Project), ZGW (Zaak)"; case-types/spec.md:27 "Standards: CMMN 1.1 (CaseDefinition), ZGW Catalogi API (ZaakType)"; positioning dossiq.md:96,104 ("speak the ZGW case standard"). A Danish standard is not named in any source: unresolved, not shown.',
			motion: 'Technique #5, stepped hex wipe in: four upright cobalt hexes at rising scale step in from the right edge 70 ms apart and cut at full cover. The case lands on top; on the next beat square-cornered wires run down to two boxes, splitting at one orange hex, and they fill one per beat: left the international case model (its plan of stages and tasks), right the Dutch case standard (its fields). The labels CMMN 1.1 and ZGW sit in the boxes\' heads as small labels.',
			sound: 'Four dry clicks on the wipe, a line-draw hiss, a pluck as each box fills.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every case speaks\nCMMN and ZGW', drawUI: standardsUI, tagFill: 'cobalt' }),
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
