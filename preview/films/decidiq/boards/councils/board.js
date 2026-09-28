/**
 * Decidiq, audience film: municipal councils (the griffie). Direction C on the app-film
 * template, wrapped by _lib/audiencefilm.js. Round 7: specs and positioning count as built.
 * Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 *   hook     every paper on its agenda item: drag items into order, attach each paper
 *            (positioning sp-agenda-papers; spec agenda-builder)
 *   proof 1  members vote from their own seat and the count closes live
 *            (sp-vote-and-see-result; specs vote-casting, real-time-vote-tabulation)
 *   proof 2  click an agenda item and the recording jumps to that moment
 *            (sp-run-the-meeting; spec meeting-transcription)
 *   general  notifications: a motion carries and the right person hears
 *            (sp-action-items, sp-motion-tracking; spec decidesk-notifications)
 *   promise  "Every meeting, open to all" (sp-publish-transparency: the publishing click)
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (the papers drop
 * onto their items), #3 grid-cell ripple (the seats light in waves as the votes come in),
 * #1 dot-grows-to-fill as an upright hex (the clicked item's marker becomes the recording).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together and merge into one container.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
]

/** Hook: the agenda, each item with its papers attached; the paper just dropped on item 3 ringed. */
function agendaUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	const items = [[260, 2], [210, 1], [240, 3], [190, 1], [230, 2]]
	items.forEach(([lw, papers], i) => {
		const cy = top + 70 + i * 110
		if (i > 0) rect(w, x + 24, cy - 55, width - 48, u, C.cobalt50)
		// Drag handle, item number, title.
		for (let k = 0; k < 3; k++) rect(w, x + 30, cy - 12 + k * 10, 18, 4, C.cobalt200, 2)
		hex(w, x + 86, cy, 20, C.cobalt, 2)
		bar(w, x + 124, cy - 16, lw, 14, C.cobalt900)
		bar(w, x + 124, cy + 10, lw * 0.55, 8, C.cobalt300)
		// The papers attached to this item: small pages on the right.
		for (let p = 0; p < papers; p++) {
			const px = x + width - 90 - p * 64
			rect(w, px, cy - 34, 48, 64, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
			for (let l = 0; l < 3; l++) bar(w, px + 9, cy - 20 + l * 14, 30 - (l % 2) * 8, 5, C.cobalt300)
		}
	})
	// The paper that just landed on item 3: the scene's one orange, as a ring.
	const ry = top + 70 + 2 * 110
	rect(w, x + width - 90 - 2 * 64 - 8, ry - 42, 64, 80, 'none', 4 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the vote: seats lighting as members vote from their own device, the count closing. */
function voteUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	bar(w, x + 30, top + 34, 280, 16, C.cobalt900)
	statusPill(w, x + width - 170, top + 42, u)
	// The chamber as rows of seats (small hexes): for mint, against cobalt-400, not yet voted cobalt-100.
	const votes = 'FFAFFFAFFAFFFFAFFAFFFAFFAFFFAFFFFAAF'
	const cols = 12
	for (let i = 0; i < votes.length; i++) {
		const r = Math.floor(i / cols), c = i % cols
		const cx = x + 70 + c * ((width - 140) / (cols - 1)) + (r % 2 ? 18 : 0)
		const cy = top + 120 + r * 62
		const v = votes[i]
		hex(w, cx, cy, 22, i > 32 ? C.cobalt100 : v === 'F' ? C.mint : C.cobalt400, 2)
	}
	// The count: for and against bars, and the result.
	const by = top + 340
	;[[0.66, C.mint], [0.28, C.cobalt400]].forEach(([f, fill], i) => {
		bar(w, x + 30, by + i * 70, 90, 10, C.cobalt400)
		rect(w, x + 140, by - 8 + i * 70, width - 200, 26, C.cobalt50, 13)
		rect(w, x + 140, by - 8 + i * 70, (width - 200) * f, 26, fill, 13)
	})
	// The result line, closed: ringed (the one orange).
	const ry = by + 160
	rect(w, x + 30, ry, width - 60, 70, C.cobalt50, 4 * u)
	hex(w, x + 70, ry + 35, 16, C.mint, 2)
	bar(w, x + 104, ry + 26, 240, 16, C.cobalt900)
	rect(w, x + 24, ry - 6, width - 48, 82, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the recording, with the agenda beside it; the clicked item and its marker on the timeline. */
function recordingUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The agenda, narrow, left.
	const aw = 330
	panel(w, x, top, aw, 600, u)
	for (let i = 0; i < 5; i++) {
		const cy = top + 60 + i * 100
		hex(w, x + 44, cy, 16, i === 2 ? C.lavender : C.cobalt300, 2)
		bar(w, x + 76, cy - 12, 200 - (i % 3) * 30, 12, C.cobalt900)
		bar(w, x + 76, cy + 10, 110, 7, C.cobalt300)
	}
	// The clicked item: the one orange.
	rect(w, x + 12, top + 60 + 2 * 100 - 40, aw - 24, 80, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The player: a dark stage with the chamber drawn flat, a timeline under it with a marker per item.
	const vx = x + aw + 24, vw = width - aw - 24
	rect(w, vx, top, vw, 400, C.cobalt900, 4 * u)
	for (let s = 0; s < 3; s++) rect(w, vx + 60 + s * ((vw - 120) / 3), top + 250, (vw - 120) / 3 - 20, 60, C.cobalt700, 3 * u)
	circle(w, vx + vw / 2, top + 170, 44, C.cobalt600)
	const ty = top + 460
	rect(w, vx, ty, vw, 12, C.cobalt100, 6)
	const marks = [0.08, 0.27, 0.46, 0.7, 0.88]
	rect(w, vx, ty, vw * marks[2], 12, C.cobalt, 6)
	marks.forEach((m, i) => hex(w, vx + vw * m, ty + 6, i === 2 ? 16 : 10, i === 2 ? C.lavender : C.cobalt300, 2))
	for (let i = 0; i < 2; i++) bar(w, vx, ty + 50 + i * 30, vw * (0.7 - i * 0.25), 9, C.cobalt300)
}

const content = {
	app: 'decidiq',
	audience: { slug: 'councils', name: 'Municipal councils', persona: 'Marieke van Dijk, griffier, and the council office; the presidium signs off' },
	promise: 'Every meeting,\nopen to all',
	promiseLine: 'Every council meeting, from agenda to decision, open to the public the same day',
	title: 'Decidiq for councils',
	record: { one: 'meeting', many: 'meetings' },
	logline: 'For the griffie: every paper on its agenda item, members voting from their own seat with the count closing live, a click on an agenda item that jumps the recording to that moment, and the right person hearing when a motion carries. The promise: every meeting open to all.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge (papers onto items)', '#3 grid-cell ripple (seats lighting)', '#1 dot-grows-to-fill (as a hex, marker into the recording)'],
	neighbours: ['opencatalogi', 'filinq'],
	builtOnApps: ['filinq'],
	hook: {
		title: 'Every paper on its agenda item',
		caption: 'Every paper on\nits agenda item',
		ui: { drawUI: agendaUI, tagFill: 'cobalt' },
		source: 'positioning decidiq sp-agenda-papers ("Drag items into order and attach each paper to its slot."); spec agenda-builder, agenda-management',
		motion: 'Frame 1 reads: caption, the agenda in the window, the Decidiq hex (cobalt: the one orange is the landing paper\'s ring) on the loop anchor. Technique #10: loose page shapes drift in from the right over two beats and each drops onto its item (ease.brand), arriving within one beat. On beat 4 item 3 is dragged up one place (ease.snap, the rows below close up) and its last paper lands with the orange ring.',
		sound: 'Gentle open. A run of soft ticks as the papers land, a short slide as the item moves.',
	},
	proofs: [
		{
			id: 'vote',
			title: 'Vote from your seat, counted live',
			caption: 'Vote from your seat,\ncounted live',
			source: 'positioning decidiq sp-vote-and-see-result ("Cast your vote from your own device and see the count close live."); specs vote-casting, real-time-vote-tabulation, live-voting-projection',
			motion: 'A hex grows from the landed paper (hexCut) and becomes the ground; the chamber lands. Technique #3, grid-cell ripple: the seats step from 20% to 40% to full in waves from the chair outward as votes come in, mint for, cobalt for against; the two bars grow with them. On the last beat the last seats fill, the result line closes (the lavender pip turns mint) and takes the orange ring.',
			sound: 'A ripple of ticks with each wave, a low pluck as the count closes.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Vote from your seat,\ncounted live', drawUI: voteUI, tagFill: 'cobalt' }),
		},
		{
			id: 'moment',
			title: 'Click an item, watch that moment',
			caption: 'Click an item,\nwatch that moment',
			source: 'positioning decidiq sp-run-the-meeting ("Stream the meeting and jump straight to the moment it was discussed."); spec meeting-transcription, digital-meetings-and-recurrence',
			motion: 'Whip (technique #11 lite, 5 frames, ease.snap) onto the recording view. Item 3 in the agenda is clicked: its orange ring steps out; technique #1, its lavender marker on the timeline grows as an upright hex over the player and shrinks back, and the playhead has jumped to it, the progress filling to that point in one move.',
			sound: 'A click, a quick whoosh through the hex, a soft room tone as the recording picks up.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Click an item,\nwatch that moment', drawUI: recordingUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Motion carried? The right person hears',
		caption: 'Motion carried?\nThe right person hears',
		source: 'positioning decidiq sp-action-items and sp-motion-tracking; spec decidesk-notifications; story.json mechanic 8 (the right person hears); COPY.notify N2',
		params: {
			record: { avatar: 'hex', title: 240, sub: 150, status: 'none' },
			event: { stage: 2, stages: 4 },
			notices: [{ app: 'decidiq' }, { icon: 'nc-files' }, { icon: 'nc-talk' }],
			recipients: [C.cobalt300],
		},
		sound: 'A low tick as the motion reaches carried, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
