/**
 * Planninq, audience film: school timetables (secondary and vocational schools; universities
 * fold in). Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7:
 * specs and positioning count as built (timetabling lives in planix
 * openspec/changes/school-timetable-target and timetable-draft-review on development).
 * Positioning: ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   hook     the timetable generated from teachers, rooms and your rules
 *            (sp-generate-timetable; changes/school-timetable-target)
 *   proof 1  an exam booked with its room and invigilator in one pass (sp-exam-room-booking)
 *   proof 2  a teacher is ill: free colleagues are asked at once, the first yes covers
 *            (usp-cover-absence; thin, so shown as a feature, never an only-we claim)
 *   general  the data layer: every change shows who and when (COPY.dataLayer D1)
 *   question "What if your timetable kept up?" (Round 19: the promise card as a question, from "A timetable that keeps up"; the proofs answer it)
 *
 * The absence register (usp-attendance-register) stays with Learniq, which tells that story.
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the timetable filling itself in
 * waves), #9 text-swap on a held diagram (the exam's three links hold while the caption
 * reads), #1 dot-grows-to-fill as an upright hex (from the ill teacher's lesson into the
 * cover request).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves, read as the system at work.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds still while only the caption changes.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark grows to fill the frame and becomes the next scene.' },
]

/** A week grid: five days across, eight periods down; lessons in cobalt tints, one subject family in lavender. */
function week(w, x, top, width, u, { rows = 8, highlight = null, ill = null } = {}) {
	const gx = x + 80, cw = (width - 100) / 5, ch = 58
	for (let d = 0; d < 5; d++) bar(w, gx + d * cw + cw / 2 - 24, top + 20, 48, 8, C.cobalt400)
	for (let r = 0; r < rows; r++) {
		bar(w, x + 24, top + 60 + r * ch + ch / 2 - 4, 30, 8, C.cobalt300)
		for (let d = 0; d < 5; d++) {
			const k = (r * 7 + d * 3) % 11
			const fill = k === 0 ? C.white : k < 3 ? C.lavender300 : [C.cobalt100, C.cobalt200, C.cobalt50][k % 3]
			const cx = gx + d * cw + 4, cy = top + 50 + r * ch + 4
			rect(w, cx, cy, cw - 8, ch - 8, ill === `${r},${d}` ? C.lavender : fill, 3 * u, fill === C.white ? { stroke: C.cobalt100, 'stroke-width': u } : {})
			if (fill !== C.white) bar(w, cx + 12, cy + 14, cw * 0.4, 7, C.cobalt700)
			if (highlight === `${r},${d}`) rect(w, cx - 5, cy - 5, cw + 2, ch + 2, 'none', 4 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
		}
	}
	return { gx, cw, ch }
}

/** Hook: the rules on the left (teachers, rooms, constraints), the generated week on the right. */
function generateUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const lw = 230
	panel(w, x, top + 80, lw, 520, u)
	for (let i = 0; i < 6; i++) {
		const cy = top + 130 + i * 76
		;[circle, (g, cx, cy2, r, f) => rect(g, cx - r, cy2 - r, 2 * r, 2 * r, f, 3 * u), (g, cx, cy2, r, f) => hex(g, cx, cy2, r, f, 2)][i % 3](w, x + 40, cy, 14, C.cobalt300)
		bar(w, x + 66, cy - 5, 120 - (i % 2) * 30, 9, C.cobalt700)
		rect(w, x + lw - 44, cy - 10, 24, 20, C.mint, 10)
	}
	panel(w, x + lw + 20, top, width - lw - 20, 600, u)
	week(w, x + lw + 20, top, width - lw - 20, u, { rows: 9, highlight: '3,2' })
}

/** Proof 1: the exam, and the room and invigilator booked with it: three linked slots, straight lines. */
function examUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	// The exam card, ringed (the one orange).
	const ex = x + 64, ey = top + 60, ew = 330, eh = 150
	panel(w, ex, ey, ew, eh, u)
	hex(w, ex + 44, ey + 50, 20, C.lavender, 2)
	bar(w, ex + 80, ey + 40, 180, 14, C.cobalt900)
	bar(w, ex + 80, ey + 66, 120, 8, C.cobalt300)
	rect(w, ex + 30, ey + 100, 120, 28, C.cobalt50, 14)
	rect(w, ex - 8, ey - 8, ew + 16, eh + 16, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The trunk down, then a branch right to the room and one to the invigilator.
	const tx = ex + 60, rows = [top + 330, top + 480]
	rect(w, tx - u, ey + eh, 2 * u, rows[1] - ey - eh, C.cobalt300)
	rows.forEach((ry, i) => {
		rect(w, tx, ry - u, 80, 2 * u, C.cobalt300)
		const bx = tx + 80, bw = width - (bx - x) - 40
		panel(w, bx, ry - 50, bw, 100, u)
		if (i === 0) rect(w, bx + 26, ry - 20, 40, 40, C.cobalt, 4 * u)
		else circle(w, bx + 46, ry, 20, C.cobalt300)
		bar(w, bx + 90, ry - 14, 200 - i * 40, 12, C.cobalt900)
		bar(w, bx + 90, ry + 10, 120, 8, C.cobalt300)
		statusPill(w, bx + bw - 120, ry, u)
	})
}

/** Proof 2: the ill teacher's lesson, and the cover request to free colleagues: the first yes takes it. */
function coverUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The lesson that needs cover, on top.
	panel(w, x + 64, top, width - 64, 120, u)
	rect(w, x + 94, top + 30, 60, 60, C.lavender, 4 * u)
	bar(w, x + 180, top + 40, 200, 14, C.cobalt900)
	bar(w, x + 180, top + 68, 140, 8, C.cobalt300)
	// The free colleagues, asked at once: one said yes first (mint, ringed), the rest are closed.
	panel(w, x, top + 150, width, 460, u)
	for (let r = 0; r < 5; r++) {
		const cy = top + 210 + r * 84
		if (r > 0) rect(w, x + 20, cy - 42, width - 40, u, C.cobalt50)
		circle(w, x + 56, cy, 22, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 94, cy - 6, 170 - (r % 3) * 30, 10, C.cobalt900)
		bar(w, x + 300, cy - 4, 120, 8, C.cobalt200)
		if (r === 1) statusPill(w, x + width - 170, cy, u)
		else idlePill(w, x + width - 170, cy, u, { w: 44 })
	}
	rect(w, x + 12, top + 210 + 84 - 38, width - 24, 76, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'planninq',
	audience: { slug: 'timetables', name: 'School timetables', persona: 'Emma Visser, roostermaker at a 1,100-student school in Arnhem; Daan Willems, roosteraar at a hogeschool; the head of education logistics buys' },
	promise: 'What if your\ntimetable kept up?',
	promiseLine: 'A timetable that keeps up: generated from your rules, exams booked with room and invigilator, cover found when a teacher is ill',
	title: 'Planninq for school timetables',
	record: { one: 'lesson', many: 'lessons' },
	logline: 'For the school\'s timetable planner: the timetable is generated from teachers, rooms and your rules, an exam is booked with its room and invigilator in one pass, and when a teacher is ill the free colleagues are asked at once and the first yes covers. Every change shows who and when.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the timetable generating)', '#9 text-swap on a held diagram (the exam links)', '#1 dot-grows-to-fill as an upright hex (into the cover request)'],
	neighbours: ['learniq'],
	// Round 27c: the section title above each caption (never the app name).
	sections: {promise: 'Timetables', hook: 'Scheduling', exam: 'Exams', cover: 'Cover', 'general-dataLayer': 'Audit trail'},
	// Round 26: the designed hand-off into each body board (preview/films/_lib/transitions.js).
	transitions: {
		hook: {type: 'cluster', fromName: 'the orange Planninq cell', toName: 'the timetable', note: 'the rules gather into one timetable (#10)'},
		exam: {type: 'match', fromName: 'the orange lesson', toName: 'the exam', note: 'the lesson in the timetable is the slot the exam takes: its orange carries over'},
		cover: {type: 'grow', fromName: 'the ill teacher\'s lesson', toName: 'the cover request', note: 'the lesson opens out as a hex and the cover request is inside it (#1)'},
		'general-dataLayer': {'type': 'hexWipe', 'fromName': 'the cover request', 'toName': 'the change history', 'note': 'a chapter change from the app\'s own screens to the shared capability; the stepped wipe marks the new chapter (#5)'},
	},
	builtOnApps: ['learniq'],
	hook: {
		title: 'Timetable built from your rules',
		caption: 'Timetable built\nfrom your rules',
		ui: { drawUI: generateUI, tagFill: 'cobalt' },
		source: 'positioning planninq sp-generate-timetable ("Generate a whole timetable from teachers and rooms."; "the generator builds it from your constraints"); planix openspec/changes/school-timetable-target',
		motion: 'Out of the question the app cell stays on the loop anchor and the window builds round it; the frame reads: caption, the rules on the left (teachers, rooms, constraints, each switched on), the empty week on the right, the Planninq hex (cobalt) on the loop anchor. Technique #3, grid-cell ripple: the week fills itself in diagonal waves from the top left, each cell stepping 20% to 40% to full; one lesson takes the orange ring as the last wave lands.',
		sound: 'Gentle open. A long ripple of soft ticks as the week fills, a pluck on the ringed lesson.',
	},
	proofs: [
		{
			id: 'exam',
			title: 'Exam booked with room and invigilator',
			caption: 'Exam booked with\nroom and invigilator',
			source: 'positioning planninq sp-exam-room-booking ("Schedule an exam with its room and invigilators together."; "books the room and the invigilator in one pass")',
			motion: 'Hard cut on the beat to the exam. The trunk line drops and branches right at right angles: the room lands, then the invigilator, a sixteenth apart, each with its mint booked pill. Technique #9: the three linked slots then hold still while only the caption reads.',
			sound: 'A tick per branch, a pluck per booked pill, then quiet under the hold.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Exam booked with\nroom and invigilator', drawUI: examUI, tagFill: 'cobalt' }),
		},
		{
			id: 'cover',
			title: 'Teacher ill? The first yes covers',
			caption: 'Teacher ill?\nThe first yes covers',
			source: 'positioning planninq usp-cover-absence (thin: shown as a feature, no only-we claim): "Ask several free teachers for cover and give it to the first yes."',
			motion: 'Technique #1 as an upright hex: the ill teacher\'s lesson (lavender) grows past the frame (ease.snap, one beat) and lands as the cover request. The free colleagues drop in together (asked at once); the second answers first: its pill turns mint and its ring closes (the one orange); the others close to idle a sixteenth later.',
			sound: 'A whoosh through the hex, a soft chord of ticks as all are asked, a pluck on the first yes.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Teacher ill?\nThe first yes covers', drawUI: coverUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Every change shows who and when',
		caption: 'Every change shows\nwho and when',
		source: 'COPY.dataLayer D1 (story.json mechanics[0]): every change is logged with who did it and when',
		params: {
			record: { avatar: 'square', title: 230, sub: 150, status: 'mint' },
			links: ['nc-calendar', 'nc-mail'],
		},
		sound: 'Ticks as the history rows land, a pluck on the newest (the cover).',
	},
}

export const { meta, boards } = audienceFilm(content)
