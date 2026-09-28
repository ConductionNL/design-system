/**
 * Dossiq, audience film: organisation cases (private sector). BEYOND POSITIONING: the
 * positioning names no private-sector Dossiq audience; Ruben asked for this film (Round 7
 * decisions, 2026-09-28). Built from Dossiq's own specs on development (procest clone):
 * case-types, visual-workflow-editor, complaint-management (numbering, configurable
 * categories with their own deadline and handler, frequency analysis), and the platform
 * audit trail. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     draw your own case process once: the steps of a complaint, HR or legal case
 *            (case-types, visual-workflow-editor)
 *   proof 1  every complaint arrives with a number, an owner and a deadline
 *            (complaint-management: sequential numbering, category default handler, SLA)
 *   proof 2  the same complaint keeps coming back and you see it (complaint-management:
 *            frequency analysis per subject)
 *   general  the data layer: every change shows who and when
 *   promise  "Your process, every case"
 *   (Round 15: the promise opens the body, straight after the opening; the body ends on the
 *   general scene and the app name returns in Built on Nextcloud)
 *
 * Techniques (refs/techniques.md): #1 dot-grows-to-fill as an upright hex (the new step
 * becomes the complaint scene), #3 grid-cell ripple (the pattern grid lights in waves),
 * #2 zoom-out sentence build (the promise).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, flowNode, dotCanvas } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells lighting in waves.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The sentence builds as the camera pulls back.' },
]

/** Hook: the case type's workflow canvas, four steps in a row and the new one dropping into its slot. */
function processUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 560, u)
	dotCanvas(w, x + 12, top + 12, width - 24, 536, u)
	const nw = 170, nh = 90, gap = 40, y = top + 110
	const xs = [0, 1, 2, 3].map((i) => x + 40 + i * (nw + gap))
	xs.forEach((nx, i) => {
		if (i > 0) rect(w, nx - gap, y + nh / 2 - 1.5 * u, gap, 3 * u, C.cobalt300)
		if (i < 3) flowNode(w, nx, y, nw, nh, u, { kind: i === 0 ? 'trigger' : 'step' })
	})
	// The fourth step: its slot dashed in orange, the node settling into it.
	rect(w, xs[3] - 6, y - 6, nw + 12, nh + 12, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2 * u, 'stroke-dasharray': '10 8' })
	flowNode(w, xs[3], y, nw, nh, u, { kind: 'step' })
	// A branch below: the second step splits to a review step (square corners).
	rect(w, xs[1] + nw / 2 - 1.5 * u, y + nh, 3 * u, 110, C.cobalt300)
	flowNode(w, xs[1], y + nh + 110, nw, nh, u, { kind: 'step' })
	// The step panel: what this step asks (a form, a due date, a role).
	const py = top + 400
	rect(w, x + 40, py, width - 80, 120, C.cobalt50, 4 * u)
	for (let i = 0; i < 3; i++) {
		bar(w, x + 70 + i * 240, py + 36, 80, 8, C.cobalt400)
		rect(w, x + 70 + i * 240, py + 56, 190, 40, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
		bar(w, x + 86 + i * 240, py + 72, 110 - i * 20, 9, C.cobalt900)
	}
}

/** Proof 1: the incoming complaint with its number, category, owner and deadline set on arrival. */
function intakeUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 190, u)
	hex(w, x + 70, top + 70, 30, C.lavender, 4)
	// The number, set on arrival: a mono-like run of blocks with the orange ring.
	rect(w, x + 130, top + 40, 230, 50, C.cobalt50, 4 * u)
	for (let i = 0; i < 9; i++) rect(w, x + 146 + i * 23, top + 54, i === 2 || i === 7 ? 8 : 16, 22, C.cobalt900, 2)
	rect(w, x + 124, top + 34, 242, 62, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	bar(w, x + 130, top + 124, 260, 12, C.cobalt700)
	idlePill(w, x + width - 150, top + 70, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	// Category, owner, deadline: the three facts the category fills in.
	const fy = top + 220
	panel(w, x, fy, width, 300, u)
	;[['cat', 170], ['owner', 150], ['due', 130]].forEach(([k, lw], i) => {
		const cy = fy + 60 + i * 84
		if (i > 0) rect(w, x + 24, cy - 42, width - 48, u, C.cobalt50)
		bar(w, x + 40, cy - 4, 100, 8, C.cobalt400)
		if (k === 'owner') circle(w, x + 200, cy, 18, C.cobalt300)
		if (k === 'cat') rect(w, x + 180, cy - 18, 170, 36, C.lavender300, 18)
		bar(w, x + (k === 'owner' ? 232 : k === 'cat' ? 200 : 180), cy - 6, lw, 12, C.cobalt900)
		if (k === 'due') {
			const tx = x + 420, tw = width - 480
			rect(w, tx, cy - 7, tw, 14, C.cobalt100, 7)
			rect(w, tx, cy - 7, tw * 0.1, 14, C.cobalt400, 7)
		}
		statusPill(w, x + width - 160, cy, u)
	})
}

/** Proof 2: complaints by subject and week; one subject lights up again and again. */
function patternUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 560, u)
	bar(w, x + 40, top + 40, 220, 14, C.cobalt700)
	const rows = 5, cols = 10, gx = x + 220, cw = (width - 260) / cols, ch = 76
	const hot = new Set(['2,4', '2,5', '2,6', '2,7', '2,8', '2,9'])
	const some = new Set(['0,1', '1,3', '3,2', '4,6', '0,7', '3,8', '1,9'])
	for (let r = 0; r < rows; r++) {
		const cy = top + 110 + r * ch
		bar(w, x + 40, cy + 20, 140 - (r % 3) * 20, 10, C.cobalt900)
		for (let c = 0; c < cols; c++) {
			const k = `${r},${c}`
			const fill = hot.has(k) ? C.cobalt : some.has(k) ? C.cobalt300 : C.cobalt50
			hex(w, gx + c * cw + cw / 2, cy + 24, Math.min(cw, ch) * 0.4, fill, 3)
		}
	}
	// The row that keeps coming back: ringed, with its count.
	const ry = top + 110 + 2 * ch
	rect(w, x + 24, ry - 10, width - 48, ch - 8, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	for (let i = 0; i < 10; i++) bar(w, gx + i * cw + cw / 2 - 12, top + 110 + rows * ch + 10, 24, 7, C.cobalt300)
}

const content = {
	app: 'dossiq',
	audience: { slug: 'organisations', name: 'Organisation cases (beyond positioning)', persona: 'The head of customer service, HR or legal at a company, who owns complaints, HR and legal cases; the operations or IT lead buys' },
	promise: 'What if every case\nfollowed your process?',
	promiseLine: 'Every case handled your way, every time: your own process, complaints numbered and owned, patterns spotted, on your own server',
	title: 'Dossiq for organisations',
	record: { one: 'case', many: 'cases' },
	logline: 'For companies: draw your own case process once, every complaint arrives with a number, an owner and a deadline, the complaint that keeps coming back shows itself, and every change is on record.',
	references: REFS,
	techniques: ['#1 dot-grows-to-fill (as a hex)', '#3 grid-cell ripple', '#2 zoom-out sentence build'],
	neighbours: ['pipelinq', 'humaniq'],
	builtOnApps: ['pipelinq'],
	hook: {
		title: 'Draw your process once',
		caption: 'Draw your\nprocess once',
		ui: { drawUI: processUI, tagFill: 'cobalt' },
		source: 'Dossiq specs case-types ("Case types are configurable definitions that control the behavior of cases": statuses, roles, fields, deadlines) and visual-workflow-editor ("build workflow definitions by placing status nodes and connecting them"). Beyond positioning.',
		motion: 'In behind the app hex the promise leaves on the loop anchor: caption, the case type\'s canvas with three steps placed, the Dossiq hex (cobalt: the one orange is the dashed slot) on the loop anchor. The edges draw between the steps (stroke reveal, 0.2 s each), the branch drops below step two; on beat 4 the fourth step lifts off (flat shadow steps out) and settles into its dashed orange slot with a tick, the step panel below filling its three fields. Out: technique #1, the new step\'s slot becomes an upright hex that grows past the frame (hexCut, ease.snap, one beat) into the complaint scene.',
		sound: 'Gentle open: pad and offbeat bass only. A soft tick per edge, a firmer tick as the step lands, a whoosh through the hex.',
	},
	proofs: [
		{
			id: 'intake',
			title: 'Every complaint numbered and owned',
			caption: 'Every complaint\nnumbered and owned',
			source: 'Dossiq spec complaint-management: "Complaint numbering is sequential per year"; categories carry "default handler (user or group), and SLA override (custom deadline)"; deadlines enforced. Beyond positioning.',
			motion: 'The hex fill lands as the complaint\'s header. The number types itself into its field one block per frame pair (inside the orange ring), then category, owner and deadline fill top to bottom a sixteenth apart, each pill turning mint as it lands; the deadline track starts at its first tenth.',
			sound: 'Quick key ticks under the number, three plucks as the facts land.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every complaint\nnumbered and owned', drawUI: intakeUI, tagFill: 'cobalt' }),
		},
		{
			id: 'pattern',
			title: 'Same complaint again? Spot the pattern',
			caption: 'Same complaint again?\nSpot the pattern',
			source: 'Dossiq spec complaint-management: "Frequency analysis MUST detect patterns in complaints ... recurring complaints about the same subject, department, or employee". Beyond positioning.',
			motion: 'Push down to the complaints by subject and week. Technique #3, grid-cell ripple: the hex grid steps 20% to 40% to full opacity in waves from the left, week by week (0.3 s per wave); one subject\'s row keeps lighting week after week, and on the last wave the row takes the orange ring.',
			sound: 'A soft ripple of ticks with each wave, a low pluck as the row is ringed.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Same complaint again?\nSpot the pattern', drawUI: patternUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Every change shows\nwho and when',
		source: 'story.json mechanics 0; COPY.dataLayer D1; Dossiq case-history-surface spec',
		params: {
			record: { avatar: 'hex', title: 240, sub: 160, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 180 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-mail', 'nc-files', 'nc-talk'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build. The Dossiq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Dossiq" the promise, asked as a question (Round 19; the proofs answer it), builds one word per eighth note, each word slamming in large while the type column\'s camera eases back (ease.brand) so the line always just fits; at rest it is the key frame. Round 15: the body opens on this card, straight after the opening\'s handover; out on the bar line the cluster steps out and the app cell shrinks on the loop anchor to the hook\'s tag.',
}

export const { meta, boards } = audienceFilm(content)
