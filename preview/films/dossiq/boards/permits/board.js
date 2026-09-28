/**
 * ROUND 21 (Ruben): recast as a decision-making tool (the right decision, on time, on the right
 * information from the whole workspace).
 * Dossiq, audience film: permits, supervision and enforcement (VTH). Direction C on the
 * app-film template, wrapped by _lib/audiencefilm.js. Round 7: matrix features count as
 * built. Research: ds-connext-film-review/apps/dossiq/research.json; positioning:
 * ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     the permit case goes straight into the national permit system, and its reply
 *            lands on the case (usp-omgevingswet)
 *   proof 1  a paragraph redacted in place, inside the case (usp-redact-objection)
 *   proof 2  the objection file builds itself from the case (usp-redact-objection)
 *   general  the data layer: every change shows who and when
 *   promise  "Permit to objection, one case"
 *   (Round 15: the promise opens the body, straight after the opening; the body ends on the
 *   general scene and the app name returns in Built on Nextcloud)
 *
 * Techniques (refs/techniques.md): #1 dot-grows-to-fill as an upright hex (the redaction bar
 * becomes the objection scene's ground), #10 loose-shape cluster-to-container merge (the
 * objection file gathers its pieces).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, fileRow } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together and merge into one container.' },
]

/** Hook: the permit case on the left, the national system as a side box on the right, and the reply. */
function nationalUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The case.
	panel(w, x, top, 470, 520, u)
	bar(w, x + 90, top + 44, 230, 16, C.cobalt900)
	bar(w, x + 90, top + 74, 150, 9, C.cobalt300)
	for (let i = 0; i < 4; i++) {
		const cy = top + 150 + i * 72
		bar(w, x + 40, cy - 4, 80, 8, C.cobalt400)
		bar(w, x + 150, cy - 6, 200 - i * 24, 12, C.cobalt900)
	}
	statusPill(w, x + 40, top + 460, u)
	// The national system: a side box (outside systems are rectangles, not hexes).
	const bx = x + 600, bw = width - 600
	rect(w, bx, top + 120, bw, 280, C.cobalt50, 4 * u, { stroke: C.cobalt300, 'stroke-width': u })
	rect(w, bx, top + 120, bw, 50, C.cobalt700, 0)
	bar(w, bx + 24, top + 140, 110, 10, C.white)
	for (let i = 0; i < 3; i++) bar(w, bx + 24, top + 210 + i * 40, bw - 60 - i * 30, 9, C.cobalt300)
	// Square-cornered wires: the case out, the reply back (the reply is the one orange).
	rect(w, x + 470, top + 200, 130, 3 * u, C.cobalt300)
	rect(w, x + 470, top + 330, 130, 3 * u, C.orange)
	hex(w, x + 470 + 14, top + 334, 12, C.orange, 2)
}

/** Proof 1: the document on the case, a paragraph blacked out in place. */
function redactUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	// The toolbar of the document view.
	rect(w, x, top, width, 70, C.cobalt50, 0)
	for (let i = 0; i < 5; i++) rect(w, x + 30 + i * 60, top + 18, 40, 34, i === 3 ? C.cobalt : C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	// The page: lines, and a paragraph redacted (solid cobalt-900 bars), the cursor ring on the last bar.
	const px = x + 60
	bar(w, px, top + 110, 300, 16, C.cobalt900)
	const lines = [520, 560, 490, 540, 500, 560, 380, 530, 470]
	lines.forEach((lw, i) => {
		const y = top + 160 + i * 42
		const redacted = i >= 3 && i <= 5
		rect(w, px, y, redacted ? lw : lw, redacted ? 24 : 9, redacted ? C.cobalt900 : C.cobalt200, redacted ? 2 : 4)
	})
	rect(w, px + 500 - 6, top + 160 + 5 * 42 - 8, 72, 40, 'none', 4, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The case the document belongs to, still on screen: its sidebar.
	rect(w, x + width - 230, top + 90, 200, 480, C.cobalt50, 3 * u)
	for (let i = 0; i < 5; i++) bar(w, x + width - 206, top + 120 + i * 50, 140 - (i % 2) * 30, 9, C.cobalt300)
}

/** Proof 2: the objection file, its pieces already in it, the redacted page on top. */
function objectionUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 150, u)
	hex(w, x + 70, top + 75, 30, C.lavender, 4)
	bar(w, x + 130, top + 50, 260, 16, C.cobalt900)
	bar(w, x + 130, top + 84, 170, 9, C.cobalt300)
	idlePill(w, x + width - 150, top + 75, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	// The file: the redacted page (mini, its black bars), the decision, the case history, the hearing date.
	const fy = top + 180
	panel(w, x, fy, width, 420, u)
	const mini = (mx, my, redacted) => {
		rect(w, mx, my, 150, 200, C.white, 3 * u, { stroke: redacted ? C.orange : C.cobalt200, 'stroke-width': redacted ? 2.5 * u : u })
		for (let i = 0; i < 7; i++) rect(w, mx + 18, my + 28 + i * 22, 110 - (i % 3) * 16, redacted && i >= 2 && i <= 3 ? 12 : 5, redacted && i >= 2 && i <= 3 ? C.cobalt900 : C.cobalt200, 2)
	}
	mini(x + 40, fy + 40, true)
	mini(x + 220, fy + 40, false)
	mini(x + 400, fy + 40, false)
	fileRow(w, x + 40, fy + 300, 320, u)
	fileRow(w, x + 40, fy + 346, 240, u)
	circle(w, x + width - 120, fy + 140, 44, C.cobalt50)
	bar(w, x + width - 150, fy + 128, 60, 10, C.cobalt700)
	bar(w, x + width - 140, fy + 148, 40, 8, C.cobalt300)
}

const content = {
	app: 'dossiq',
	audience: { slug: 'permits', name: 'Permits and enforcement', persona: 'Bram Kuijpers, permit officer; the VTH department manager buys' },
	promise: 'What if every permit\ndecision stood firm?',
	promiseLine: 'Every permit decision stands firm: national data arrives in the permit case, redaction before publication, the objection file ready, and every decision showing who and when',
	title: 'Dossiq for permits and enforcement',
	record: { one: 'case', many: 'cases' },
	logline: 'Round 21: Dossiq as a decision-making tool for permits and enforcement. National data arrives in the permit case, you redact before you publish, the objection file builds itself, and every decision shows who and when.',
	references: REFS,
	// Round 26: the designed hand-offs into each body board (preview/films/_lib/transitions.js).
	transitions: {
		hook: { type: 'grow', fromName: 'the orange Dossiq cell', toName: 'the permit case', note: 'the app cell opens into the permit case with national data in it (#1)' },
		redact: { type: 'zoom', fromName: 'the case file', toName: 'the document to redact', note: 'we push into the case\'s document and come out on it being redacted: same file, closer' },
		objection: { type: 'match', fromName: 'the redacted passage', toName: 'the objection file', note: 'the published decision is what the objection is about, so its orange carries into the file that builds itself' },
		'general-dataLayer': { type: 'hexWipe', fromName: 'the objection file', toName: 'the record and its history', note: 'a chapter change to the shared data layer, a stepped wipe on the beat (#5)' },
	},
	techniques: ['#1 dot-grows-to-fill (as a hex)', '#10 cluster-to-container merge'],
	neighbours: ['filinq', 'decidiq'],
	builtOnApps: ['filinq'],
	hook: {
		title: 'National data, in the permit case',
		caption: 'National data,\nin the permit case',
		ui: { drawUI: nationalUI, tagFill: 'cobalt' },
		source: 'positioning dossiq usp-omgevingswet: "Send a permit request straight into the national Omgevingswet system." (verified)',
		motion: 'In behind the app hex the promise leaves on the loop anchor: caption, the permit case left and the national system as a side box right, the Dossiq hex (cobalt) on the loop anchor. On beat 2 a pulse runs out along the top wire (square corners, 0.3 s); on beat 4 the reply runs back along the lower wire in orange and its pip lands on the case, whose pill turns mint. Nothing is retyped: no form appears.',
		sound: 'Gentle open. A soft outgoing pluck on the send, a lower answering pluck as the reply lands.',
	},
	proofs: [
		{
			id: 'redact',
			title: 'Redact before you publish',
			caption: 'Redact before\nyou publish',
			source: 'positioning dossiq usp-redact-objection: "Redact a document without leaving the case it belongs to." (verified)',
			motion: 'Hex match cut from the reply pip into the document view. The redaction tool is on (its button cobalt); three lines are swept one after another into solid bars (each bar grows left to right in 6 frames), the orange ring following the cursor to the last. The case sidebar stays on screen: you never left it. Out: technique #1 as an upright hex, the last redaction bar grows to fill the frame (hexCut, ease.snap, one beat) and its cobalt-900 is the next ground for one frame before the objection scene lands.',
			sound: 'Three dry swipes, one per bar, a whoosh through the hex fill.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Redact before\nyou publish', drawUI: redactUI, tagFill: 'cobalt' }),
		},
		{
			id: 'objection',
			title: 'The objection file builds itself',
			caption: 'The objection file\nbuilds itself',
			source: 'positioning dossiq usp-redact-objection scene: "An objection hearing reads the file, not a reconstruction" (research.json proof moment: the objection panel shows the redacted page already attached)',
			motion: 'Technique #10, cluster-to-container merge: the redacted page, the decision, the history and the hearing date start as loose shapes scattered over the frame (seeded positions) and each tweens into its slot in the objection file on ease.brand, all arriving within one beat. The redacted page lands first and keeps the orange edge.',
			sound: 'Four soft ticks as the pieces land, a low thud as the file closes round them.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'The objection file\nbuilds itself', drawUI: objectionUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Every decision shows\nwho and when',
		source: 'story.json mechanics 0; COPY.dataLayer D1; positioning dossiq sp-search-access and platform audit trail',
		params: {
			record: { avatar: 'hex', title: 240, sub: 160, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 190 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-files', 'nc-mail', 'nc-calendar'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
}

export const { meta, boards } = audienceFilm(content)
