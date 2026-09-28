/**
 * Learniq, audience film: schools and parents (primary and secondary). Direction C on the
 * app-film template, wrapped by _lib/audiencefilm.js. Round 7: matrix features count as built.
 * Reworked in Round 11 (Ruben, 2026-09-28): the body opens on the student file, then one
 * integrated view for teachers, claimed honestly (the same work, easier to carry; never "less
 * admin"). Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     the student file: one pupil, everything about them in one place
 *            (sp-learner-support-dossier)
 *   proof 1  one integrated view for the teacher: the class, attendance, marks and notes
 *            together (Round 11 note; sp-grade-your-way, sp-statutory-attendance)
 *   proof 2  a parent excuses their child from the phone, the register updates itself
 *            (sp-statutory-attendance)
 *   general  notifications: a pupil crosses the 16-hour line and the report goes out on time,
 *            the attendance officer hears (sp-statutory-attendance, Leerplichtwet)
 *   promise  "The same work, easier to carry"
 *   (Round 15: the promise opens the body, straight after the opening; the body ends on the
 *   general scene and the app name returns in Built on Nextcloud)
 *
 * Both Round 11 keepers fit (29 words): the parent excuse is proof 2 and the 16-hour report
 * moves into the notification slot, since the student file now carries the dossier.
 *
 * Techniques (refs/techniques.md): #2 zoom-out (from the student file out to the teacher's
 * integrated view: the file shrinks into its row), #4 typewriter (the parent's excuse),
 * #3 grid-cell ripple (the register cells in the teacher view step on in waves).
 */
import { C } from '../../../_lib/brand.js'
import { textBlock } from '../../../_lib/stage.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, phone, bubble, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping in waves; a stepped wipe between chapters.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A caption typed letter by letter under a phone.' },
]

/** The register: pupils down, lessons across; present cobalt-100, absent cobalt-400, excused lavender. */
function register(w, geom, { excused = null, accent = null, rows = 7, cols = 10 } = {}) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 60 + rows * 64 + 20, u)
	const gx = x + 250, cw = (width - 280) / cols
	for (let c = 0; c < cols; c++) bar(w, gx + c * cw + cw / 2 - 12, top + 26, 24, 8, C.cobalt300)
	const absent = { '1,2': 1, '1,3': 1, '3,6': 1, '4,1': 1, '4,2': 1, '4,3': 1, '4,7': 1, '6,5': 1 }
	for (let r = 0; r < rows; r++) {
		const cy = top + 76 + r * 64
		circle(w, x + 70, cy, 18, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 104, cy - 6, 110 - (r % 3) * 18, 10, C.cobalt900)
		for (let c = 0; c < cols; c++) {
			const key = `${r},${c}`
			let fill = absent[key] ? C.cobalt400 : C.cobalt100
			if (excused === key) fill = C.lavender
			rect(w, gx + c * cw + 6, cy - 20, cw - 12, 40, fill, 3 * u)
			if (accent === key) rect(w, gx + c * cw + 1, cy - 25, cw - 2, 50, 'none', 4 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
		}
	}
	return { gx, cw, top }
}

/** Hook: the student file: the pupil, and everything about them in one place. */
function pupilFileUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 150, u)
	circle(w, x + 80, top + 75, 44, C.cobalt300)
	bar(w, x + 150, top + 50, 250, 18, C.cobalt900)
	bar(w, x + 150, top + 86, 170, 9, C.cobalt300)
	rect(w, x + width - 200, top + 58, 150, 34, C.lavender300, 17)
	// Four tiles: attendance, marks, the support plan with its notes, the parents.
	const tw = (width - 20) / 2, th = 200
	const tiles = [
		(tx, ty) => { for (let c = 0; c < 8; c++) rect(w, tx + 30 + c * ((tw - 60) / 8), ty + 90, (tw - 60) / 8 - 8, 36, c === 5 ? C.cobalt400 : C.cobalt100, 3 * u) },
		(tx, ty) => { ;[0.7, 0.55, 0.85].forEach((v, k) => { bar(w, tx + 30, ty + 84 + k * 36, 90, 8, C.cobalt400); rect(w, tx + 140, ty + 80 + k * 36, (tw - 190) * v, 16, C.cobalt300, 8) }) },
		(tx, ty) => { for (let k = 0; k < 3; k++) { hex(w, tx + 40, ty + 90 + k * 36, 8, k === 0 ? C.lavender : C.cobalt200, 1); bar(w, tx + 60, ty + 84 + k * 36, tw * 0.6 - k * 30, 10, C.cobalt900) } },
		(tx, ty) => { for (let k = 0; k < 2; k++) { circle(w, tx + 50, ty + 96 + k * 50, 18, C.cobalt200); bar(w, tx + 84, ty + 88 + k * 50, 150, 10, C.cobalt900) } },
	]
	tiles.forEach((draw, i) => {
		const tx = x + (i % 2) * (tw + 20), ty = top + 180 + Math.floor(i / 2) * (th + 20)
		panel(w, tx, ty, tw, th, u)
		bar(w, tx + 30, ty + 34, 120, 12, C.cobalt700)
		draw(tx, ty)
	})
	// The newest note in the support plan: the scene's one orange, as a ring.
	rect(w, x - 6, top + 180 + th + 20 - 6, tw + 12, th + 12, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the teacher's integrated view: the class with attendance, marks and notes side by side. */
function teacherUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	// Column heads: pupil, this week's attendance, marks, notes.
	const cA = x + 250, cM = x + 560, cN = x + width - 110
	;[x + 30, cA, cM, cN - 30].forEach((hx) => bar(w, hx, top + 30, 80, 8, C.cobalt400))
	for (let r = 0; r < 7; r++) {
		const cy = top + 90 + r * 70
		if (r > 0) rect(w, x + 20, cy - 35, width - 40, u, C.cobalt50)
		circle(w, x + 50, cy, 18, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 80, cy - 6, 130 - (r % 3) * 20, 10, C.cobalt900)
		for (let d = 0; d < 5; d++) rect(w, cA + d * 56, cy - 16, 46, 32, (r === 2 && d > 2) || (r === 5 && d === 1) ? C.cobalt400 : C.cobalt100, 3 * u)
		rect(w, cM, cy - 8, 60 + ((r * 37) % 120), 16, C.cobalt300, 8)
		if (r === 2 || r === 4) hex(w, cN, cy, 12, C.lavender, 2)
		else idlePill(w, cN - 20, cy, u, { w: 26 })
	}
	// The pupil whose file the hook opened: their row, ringed (the one orange).
	rect(w, x + 14, top + 90 + 2 * 70 - 32, width - 28, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the parent's excuse on the phone, and the register cell it turns to excused. */
function excuseUI(w, geom) {
	const { u } = geom
	register(w, geom, { excused: '4,3', accent: '4,3', rows: 7, cols: 7 })
	// The parent's phone, under the register: the excuse just sent (it bleeds off the frame's foot).
	const px = geom.x + 520, py = geom.anchor.y + 520
	const p = phone(w, px, py, 300, 600)
	bubble(p.screen, p.x + 60, p.y + 120, p.w - 80, 140, u, { side: 'user' })
	bar(p.screen, p.x + 84, p.y + 150, 150, 9, C.cobalt700)
	bar(p.screen, p.x + 84, p.y + 176, 110, 9, C.cobalt700)
	rect(p.screen, p.x + 84 + 114, p.y + 172, 3 * u, 18, C.cobalt)
	statusPill(p.screen, p.x + p.w - 150, p.y + 300, u)
}

const content = {
	app: 'learniq',
	audience: { slug: 'schools', name: 'Schools and parents', persona: 'Marloes ten Berge, learning support coordinator, and the parents who excuse their child from their phone; the school board\'s ICT coordinator buys' },
	promise: 'What if teachers had\nevery pupil\'s file?',
	promiseLine: 'Every pupil\'s file, for every teacher: one file per pupil and one class view, on the school\'s own server',
	title: 'Learniq for schools',
	record: { one: 'pupil', many: 'pupils' },
	logline: 'For schools, with the parent side in the film: the student file holds everything about one pupil, the teacher sees the class in one view, a parent excuses their child from their phone and the register updates, and the 16-hour report goes out on time. It does not remove the work; it makes it easier to carry.',
	references: REFS,
	// Round 27c: the section title each scene's small mark shows (not the app name).
	sections: { promise: 'Schools', hook: 'Pupil file', teacher: 'Class view', excuse: 'Attendance', 'general-notify': 'Reporting' },
	// Round 26: the designed hand-offs into each body board (preview/films/_lib/transitions.js).
	transitions: {
		hook: { type: 'grow', fromName: 'the orange Learniq cell', toName: 'the pupil\'s file', note: 'the app cell opens into one pupil\'s file: one shape becoming one file matches "One pupil, one file"' },
		teacher: { type: 'cluster', fromName: 'the pupil\'s file', toName: 'the class view', note: 'from one pupil to the whole class: the file breaks into many cells that settle as the class register (#10)' },
		excuse: { type: 'swap', fromName: 'the class view', toName: 'the updated register row', note: 'the register stays put and only the one row changes; holding the window proves the update happens in the same register (#9)' },
		'general-notify': { type: 'match', fromName: 'the orange absence', toName: 'the report to the attendance officer', note: 'the absence that just landed is what crosses the limit, so the same orange carries into the report' },
	},
	techniques: ['#2 zoom-out (student file to teacher view)', '#4 typewriter', '#3 grid-cell ripple'],
	neighbours: ['portaliq'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'One pupil, one file',
		caption: 'One pupil,\none file',
		ui: { drawUI: pupilFileUI, tagFill: 'cobalt' },
		source: 'Ruben, Round 11 (open on the student file, the leerlingdossier); positioning learniq sp-learner-support-dossier ("Start a support plan from a template and add the everyday note in the same place.")',
		motion: 'In behind the app hex the promise leaves on the loop anchor: caption, the student file in the window (the pupil, attendance, marks, the support plan, the parents), the Learniq hex (cobalt: the one orange is the newest note\'s ring) on the loop anchor. The tiles land a sixteenth apart; on beat 4 a new note drops into the support plan and its tile takes the orange ring. Out: technique #2, the camera pulls back (ease.brand) and the whole file shrinks into one row of the teacher\'s class view.',
		sound: 'Gentle open. Four soft ticks as the tiles land, a pluck as the note arrives, a long soft whoosh on the pull-back.',
	},
	proofs: [
		{
			id: 'teacher',
			title: 'Marks and absence, one class view',
			caption: 'Marks and absence,\none class view',
			source: 'Ruben, Round 11: "one integrated view of information for teachers"; claimed honestly (the work stays, it gets easier to carry); positioning learniq sp-grade-your-way, sp-statutory-attendance',
			motion: 'Continuous from the hook (technique #2, zoom-out): the file has become the ringed row; the class view settles round it. Technique #3, grid-cell ripple: the week\'s attendance cells step 20% to 40% to full opacity in waves across the class, row by row, then the marks bars grow and the note hexes pop. The caption rises as the pull-back ends. Nothing on screen says less work: the same rows, one view.',
			sound: 'A ripple of ticks with the attendance waves, a pluck as the marks land.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Marks and absence,\none class view', drawUI: teacherUI, tagFill: 'cobalt' }),
		},
		{
			id: 'excuse',
			title: 'Absence reported, the register updates',
			caption: 'Absence reported,\nthe register updates',
			source: 'positioning learniq sp-statutory-attendance scene: "The register updates itself the moment a guardian sends an excuse."',
			motion: 'Technique #4, typewriter. The parent\'s phone rises into the window; the excuse types itself in the bubble (one greeked character pair per 0.1 s, hard on and off) with a cursor, then sends (the pill turns mint). On the send beat the absent cell turns lavender (excused) and takes the orange edge. The caption rises as the typing starts.',
			sound: 'Tiny key clicks under the typing, a soft send swoosh, a pluck as the cell changes.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Absence reported,\nthe register updates', drawUI: excuseUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Absence limit hit, reported on time',
		caption: 'Absence limit hit?\nReported on time',
		source: 'positioning learniq sp-statutory-attendance: the Leerplichtwet 16-hour threshold, reported through the national absence desk within five working days; story.json mechanic 8 (the right person hears)',
		params: {
			record: { avatar: 'person', title: 240, sub: 150, status: 'none' },
			event: { stage: 2, stages: 3 },
			notices: [{ app: 'learniq' }, { icon: 'nc-mail' }, { icon: 'nc-files' }],
			recipients: [C.lavender300, C.cobalt300],
		},
		sound: 'A low tick as the pupil crosses the line, a dry click as the notice lands (no bell).',
	},
}

const film = audienceFilm(content)
// Round 18: the local term stays as a small label in the picture; the caption says it in plain words.
const gen = film.boards.find((b) => b.id === 'general-notify')
if (gen) {
	const draw = gen.draw
	gen.draw = (ctx) => {
		const r = draw(ctx)
		textBlock(ctx.g, 'Leerplichtwet · 16 hours', { x: 1090, y: 466, size: 28, weight: 500, family: 'IBM Plex Mono', fill: C.white, clip: false })
		return r
	}
}
export const { meta, boards } = film
