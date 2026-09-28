/**
 * Decidiq, audience film: governing boards and membership associations (works councils fold in).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7: specs and
 * positioning count as built. Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 *   hook     a member declares a conflict of interest and sits that vote out
 *            (usp-conflict-of-interest, verified; spec conflict-of-interest)
 *   proof 1  the minutes are drafted from the agenda and the decisions taken, item by item
 *            (sp-minutes-approval; specs resolution-minutes, p2-minutes-and-decisions). No AI.
 *   proof 2  the meeting closes into one sealed, tamper-evident file
 *            (usp-proof-package, verified; spec resolution-minutes)
 *   general  notifications: an action's due date passes and its owner hears
 *            (sp-action-items; specs action-item-board-via-deck-leaf, decidesk-notifications)
 *   promise  "Every decision, on the record"
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (the vote list holds, only the
 * conflicted member's row changes), #4 typewriter (the minutes fill item by item), #10 loose-shape
 * cluster-to-container merge (agenda, papers, votes and minutes merge into the sealed file),
 * #5 stepped hex wipe (into the seal).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, idlePill, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only one line changes under it.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Characters typed on one at a time.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together and merge into one container.' },
]

/** Hook: the members on this vote; one declared a conflict and sits it out (lavender, no vote), the count one short. */
function conflictUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	bar(w, x + 30, top + 34, 260, 16, C.cobalt900)
	for (let r = 0; r < 6; r++) {
		const cy = top + 110 + r * 80
		if (r > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		const out = r === 3
		circle(w, x + 64, cy, 20, out ? C.cobalt100 : r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 100, cy - 12, 180 - (r % 3) * 24, 12, out ? C.cobalt200 : C.cobalt900)
		bar(w, x + 100, cy + 10, 110, 7, out ? C.cobalt100 : C.cobalt300)
		if (out) {
			// Declared: the process hex and an empty vote slot.
			hex(w, x + width - 230, cy, 14, C.lavender, 2)
			bar(w, x + width - 204, cy - 5, 70, 10, C.lavender300)
			rect(w, x + width - 110, cy - 20, 70, 40, 'none', 4 * u, { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': '6 6' })
		} else {
			rect(w, x + width - 110, cy - 20, 70, 40, r === 5 ? C.cobalt400 : C.mint, 4 * u)
		}
	}
	// The conflicted member's row: the scene's one orange, as a ring.
	rect(w, x + 14, top + 110 + 3 * 80 - 36, width - 28, 72, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the agenda with its decisions on the left, the minutes drafting item by item on the right. */
function minutesUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const aw = 360
	panel(w, x, top, aw, 600, u)
	for (let i = 0; i < 5; i++) {
		const cy = top + 60 + i * 100
		hex(w, x + 44, cy, 16, C.cobalt, 2)
		bar(w, x + 76, cy - 12, 210 - (i % 3) * 30, 12, C.cobalt900)
		// The decision taken on this item: a mint pip (carried) or idle.
		if (i < 4) hex(w, x + 86, cy + 20, 7, i === 1 ? C.cobalt300 : C.mint, 1)
		bar(w, x + 102, cy + 16, 90, 7, C.cobalt300)
	}
	// The minutes: a page whose items fill in order; the one being drafted has a cursor.
	const mx = x + aw + 24, mw = width - aw - 24
	panel(w, mx, top, mw, 620, u)
	bar(w, mx + 30, top + 34, 200, 14, C.cobalt900)
	for (let i = 0; i < 4; i++) {
		const iy = top + 90 + i * 128
		hex(w, mx + 40, iy + 8, 10, C.cobalt, 1)
		bar(w, mx + 62, iy, 180, 11, C.cobalt700)
		const lines = i < 3 ? 3 : 1
		for (let l = 0; l < lines; l++) bar(w, mx + 62, iy + 28 + l * 22, (mw - 110) * [0.95, 0.8, 0.6][l], 8, C.cobalt300)
		if (i === 3) rect(w, mx + 62 + (mw - 110) * 0.95 + 6, iy + 22, 3 * u, 20, C.cobalt)
	}
	// The item being drafted now: the one orange.
	rect(w, mx + 14, top + 90 + 3 * 128 - 22, mw - 28, 84, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the sealed file: agenda, papers, votes and minutes in one file, locked. */
function sealUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 10, width = geom.r - geom.x
	const fw = 560, fx = x + (width - fw) / 2
	panel(w, fx, top + 20, fw, 560, u)
	rect(w, fx, top + 20, fw, 90, C.cobalt, 0)
	use(w, 'icon-lock', fx + 30, top + 40, 50, 50, C.white)
	bar(w, fx + 100, top + 50, 220, 14, C.white)
	bar(w, fx + 100, top + 76, 140, 8, C.cobalt200)
	;[C.cobalt, C.cobalt300, C.mint, C.cobalt].forEach((f, i) => {
		const py = top + 140 + i * 100
		rect(w, fx + 30, py, fw - 60, 80, C.cobalt50, 4 * u)
		hex(w, fx + 70, py + 40, 18, f, 2)
		bar(w, fx + 106, py + 26, 200 - i * 20, 12, C.cobalt900)
		bar(w, fx + 106, py + 48, 130, 7, C.cobalt300)
		idlePill(w, fx + fw - 140, py + 40, u, { w: 40 })
	})
	// The seal: an orange hex ring on the file's corner (the one orange; a shape, no text in it).
	hex(w, fx + fw - 10, top + 20, 58, 'none', 4, { stroke: C.orange, 'stroke-width': 3 * u })
	hex(w, fx + fw - 10, top + 20, 42, C.cobalt, 3)
	use(w, 'icon-lock', fx + fw - 34, top - 4, 48, 48, C.white)
}

const content = {
	app: 'decidiq',
	audience: { slug: 'boards', name: 'Boards and associations', persona: 'Wouter de Groot, board secretary; Anke Willems, association secretary; Sandra de Boer, works council secretary' },
	promise: 'Every decision,\non the record',
	promiseLine: 'Every decision defensible: conflicts kept out of the vote, minutes from what was decided, the whole meeting sealed in one file',
	title: 'Decidiq for boards and associations',
	record: { one: 'decision', many: 'decisions' },
	logline: 'For board, association and works council secretaries: a member who declares a conflict sits that vote out, the minutes are drafted from what was decided, the meeting closes into one sealed file, and an action\'s owner hears when it falls due. The promise: every decision on the record.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram (the vote list)', '#4 typewriter (the minutes)', '#10 cluster-to-container merge (into the sealed file)', '#5 stepped hex wipe'],
	neighbours: ['filinq', 'portaliq'],
	builtOnApps: ['filinq'],
	hook: {
		title: 'Conflicted? You sit this vote out',
		caption: 'Conflicted? You sit\nthis vote out',
		ui: { drawUI: conflictUI, tagFill: 'cobalt' },
		source: 'positioning decidiq usp-conflict-of-interest, verified ("Declare a conflict of interest and the system keeps you out of that vote."); spec conflict-of-interest. Not an "only we" line.',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the members on this vote, the Decidiq hex (cobalt) on the loop anchor. Technique #9, text-swap on a held diagram: the list holds still; on beat 3 only row 4 changes: its vote slot empties to a dashed outline, the lavender "declared" pip pops in, the row dims, and the orange ring lands round it.',
		sound: 'One soft tick as the slot empties, a low pluck as the ring lands.',
	},
	proofs: [
		{
			id: 'minutes',
			title: 'Minutes drafted from what was decided',
			caption: 'Minutes drafted from\nwhat was decided',
			source: 'positioning decidiq sp-minutes-approval ("The minutes draft themselves from the agenda and the decisions taken."); specs resolution-minutes, p2-minutes-and-decisions. Built from the record, no AI.',
			motion: 'A hex grows from the ringed row (hexCut) into the minutes view. Technique #4, typewriter: each agenda item\'s decision pip pulses in turn and its minutes item types on beside it (greeked character pairs 0.1 s apart, hard on and off), item by item; the fourth is still typing when the orange ring settles on it.',
			sound: 'Soft key ticks under the typing, a pluck per finished item.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Minutes drafted from\nwhat was decided', drawUI: minutesUI, tagFill: 'cobalt' }),
		},
		{
			id: 'sealed',
			title: 'Every meeting, sealed in one file',
			caption: 'Every meeting,\nsealed in one file',
			source: 'positioning decidiq usp-proof-package, verified ("Every meeting closes into one sealed, tamper-evident file."); spec resolution-minutes',
			motion: 'Technique #5, stepped hex wipe in: four upright cobalt hexes step in from the right edge 70 ms apart and cut at full cover. Technique #10: the agenda, papers, votes and minutes drift in as loose cards and each drops into its slot in the file (ease.brand, within one beat); the header closes with the lock, and on the bar line the orange hex ring seals the corner.',
			sound: 'Four dry clicks on the wipe, ticks as the parts land, a solid click as it seals.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every meeting,\nsealed in one file', drawUI: sealUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Action overdue? The owner hears',
		caption: 'Action overdue?\nThe owner hears',
		source: 'positioning decidiq sp-action-items ("Every decision becomes an action item with an owner and a date."; "a due date passes and someone actually gets flagged"); specs action-item-board-via-deck-leaf, decidesk-notifications',
		params: {
			record: { avatar: 'hex', title: 230, sub: 150, status: 'idle' },
			event: { stage: 3, stages: 4 },
			notices: [{ app: 'decidiq' }, { icon: 'nc-decks' }, { icon: 'nc-files' }],
			recipients: [C.cobalt300],
		},
		sound: 'A low tick as the date passes, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
