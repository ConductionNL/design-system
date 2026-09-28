/**
 * Learniq, audience film: schools (primary and secondary). Direction C on the app-film
 * template, wrapped by _lib/audiencefilm.js. Round 7: matrix features count as built.
 * Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     the attendance register: every lesson, every absence (sp-statutory-attendance)
 *   proof 1  a parent sends an excuse, the register updates itself (sp-statutory-attendance)
 *   proof 2  a pupil crosses the 16-hour line and the report goes out on time
 *            (sp-statutory-attendance: the Leerplichtwet threshold)
 *   general  the data layer as the pupil dossier: one pupil, one dossier, the class's Talk
 *            and files linked (sp-learner-support-dossier)
 *   promise  "Absence reported on time"
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the register fills in waves),
 * #4 typewriter (the parent's excuse), #5 stepped hex wipe (into the 16-hour scene).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, phone, bubble } from '../../../_lib/ui.js'

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

/** Hook: the register, a lesson's column filling. */
function registerUI(w, geom) { register(w, geom) }

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

/** Proof 2: a pupil's hours against the 16-hour line, and the report sent in time. */
function thresholdUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 330, u)
	circle(w, x + 70, top + 70, 26, C.cobalt300)
	bar(w, x + 116, top + 56, 220, 16, C.cobalt900)
	bar(w, x + 116, top + 84, 140, 9, C.cobalt300)
	// Hours missed: a track, the threshold mark at 16 of 20, the bar just past it (the one orange).
	const tx = x + 40, tw = width - 80, ty = top + 190
	rect(w, tx, ty, tw, 30, C.cobalt50, 15)
	rect(w, tx, ty, tw * 0.84, 30, C.orange, 15)
	rect(w, tx + tw * 0.8 - 3, ty - 30, 6, 90, C.cobalt900)
	hex(w, tx + tw * 0.8, ty - 44, 12, C.cobalt900, 2)
	for (let i = 0; i <= 4; i++) bar(w, tx + (tw * i) / 4 - 10, ty + 60, 20, 7, C.cobalt300)
	// The report, filled in and sent: a document row with its sent pill.
	const ry = top + 360
	panel(w, x, ry, width, 170, u)
	rect(w, x + 40, ry + 36, 70, 96, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	rect(w, x + 40, ry + 36, 70, 12, C.cobalt, 0)
	for (let i = 0; i < 4; i++) bar(w, x + 52, ry + 64 + i * 14, 46 - i * 6, 5, C.cobalt200)
	bar(w, x + 140, ry + 58, 260, 14, C.cobalt900)
	bar(w, x + 140, ry + 88, 180, 9, C.cobalt300)
	statusPill(w, x + width - 160, ry + 85, u)
}

const content = {
	app: 'learniq',
	audience: { slug: 'schools', name: 'Schools', persona: 'Marloes ten Berge, learning support coordinator; the school board\'s ICT coordinator buys' },
	promise: 'Absence reported\non time',
	promiseLine: 'Absence reported the way the law expects, on time, from the school\'s own server',
	title: 'Learniq for schools',
	record: { one: 'pupil', many: 'pupils' },
	logline: 'For schools: the register counts every absence, a parent\'s excuse updates it, a pupil who crosses the 16-hour line is reported in time, and each pupil has one dossier.',
	references: REFS,
	techniques: ['#3 grid-cell ripple', '#4 typewriter', '#5 stepped hex wipe'],
	neighbours: ['portaliq'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'Every lesson, every absence',
		caption: 'Every lesson,\nevery absence',
		ui: { drawUI: registerUI },
		source: 'positioning learniq sp-statutory-attendance: "Persistent absence reaches the authority without anyone chasing paperwork."',
		motion: 'Technique #3, grid-cell ripple. Frame 1 reads: caption, the register in the window, the Learniq hex (orange) on the loop anchor. From beat 2 a wave runs across the register column by column (each cell steps 20% to 40% to full opacity in 0.3 s, staggered by distance from the first lesson), then a second, quicker wave settles it: a morning\'s lessons being marked. Absences stay the darker cells.',
		sound: 'Gentle open: pad and offbeat bass only. A soft ripple of ticks that follows the wave.',
	},
	proofs: [
		{
			id: 'excuse',
			title: 'A parent excuses, the register updates',
			caption: 'A parent excuses,\nthe register updates',
			source: 'positioning learniq sp-statutory-attendance scene: "The register updates itself the moment a guardian sends an excuse."',
			motion: 'Technique #4, typewriter. The parent\'s phone rises into the window\'s right side; the excuse types itself in the bubble (one greeked character pair per 0.1 s, hard on and off) with a cursor, then sends (the pill turns mint). On the send beat the absent cell in row 5 turns lavender (excused) and takes the orange edge. The caption rises as the typing starts.',
			sound: 'Tiny key clicks under the typing, a soft send swoosh, a pluck as the cell changes.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'A parent excuses,\nthe register updates', drawUI: excuseUI, tagFill: 'cobalt' }),
		},
		{
			id: 'threshold',
			title: '16 hours missed, reported on time',
			caption: '16 hours missed?\nReported on time',
			source: 'positioning learniq sp-statutory-attendance: the Leerplichtwet 16-hour threshold, reported through the national absence desk within five working days',
			motion: 'Technique #5, stepped hex wipe in: four upright cobalt hexes at rising scale step in from the right edge 70 ms apart and cut the moment they cover the frame. On the new scene the pupil\'s hours bar grows left to right and crosses the 16-hour mark (orange from the crossing), and on the next beat the report row drops in below with its mint pill: sent.',
			sound: 'Four dry clicks on the wipe steps, a rising pluck as the bar grows, a low tick as it crosses the line, a soft thud as the report lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: '16 hours missed?\nReported on time', drawUI: thresholdUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'One pupil, one dossier',
		caption: 'One pupil,\none dossier',
		source: 'positioning learniq sp-learner-support-dossier ("Start a support plan from a template and add the everyday note in the same place."); story.json mechanics 0 and 1',
		params: {
			record: { avatar: 'person', title: 220, sub: 150, status: 'mint', fields: [[56, 150], [56, 110], [64, 160], [48, 90]] },
			history: [{ av: C.lavender300, w: 170 }, { av: C.cobalt200, w: 140 }, { av: C.cobalt300, w: 160 }, { av: C.cobalt200, w: 120 }],
			links: ['nc-talk', 'nc-files'],
		},
		sound: 'A pluck as Talk and Files link in, a tick on the newest note.',
	},
}

export const { meta, boards } = audienceFilm(content)
