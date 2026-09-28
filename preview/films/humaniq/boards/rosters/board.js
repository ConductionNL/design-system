/**
 * Humaniq, audience film: rosters (care providers and shift employers). Direction C on the
 * app-film template, wrapped by _lib/audiencefilm.js. Round 7: specs and positioning count as
 * built. Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 * The three proof USPs are thin in the positioning: no "only we", no "compliant"; each line says
 * what the roster or the clock checks. Payroll is out of every Humaniq claim.
 *
 *   hook     every roster checked against the Working Hours Act before it is published
 *            (usp-working-hours-act; spec rostering)
 *   proof 1  a shift only takes someone with the certificate it needs
 *            (usp-competence-gated-rostering; spec rostering)
 *   proof 2  clock in at the work site, nowhere else (usp-geofenced-clockin; spec time-attendance)
 *   general  the data layer: every change shows who and when (COPY.dataLayer D1)
 *   promise  "Rosters that know the rules"
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the check runs over the roster in a
 * wave), #9 text-swap on a held diagram (the candidate list holds; only who may take the shift
 * changes), #1 dot-grows-to-fill as an upright hex (the site zone grows into the phone's clock).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, button, phone, statusPill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping in waves, read as a check running.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only one state changes.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark grows to fill the frame and becomes the next scene.' },
]

/** Hook: the week's roster; the check has run and flagged one shift; Publish waits. */
function rosterUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	const gx = x + 190, cols = 7, cw = (width - 220) / cols
	for (let c = 0; c < cols; c++) bar(w, gx + c * cw + cw / 2 - 14, top + 30, 28, 8, C.cobalt300)
	const shifts = ['1101100', '0110110', '1011001', '1101011', '0111100', '1010110']
	shifts.forEach((row, r) => {
		const cy = top + 90 + r * 70
		circle(w, x + 50, cy, 18, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 80, cy - 6, 90 - (r % 3) * 14, 10, C.cobalt900)
		for (let c = 0; c < cols; c++) {
			if (row[c] !== '1') continue
			const flag = r === 3 && c === 3
			rect(w, gx + c * cw + 5, cy - 22, cw - 10, 44, flag ? C.lavender : C.cobalt100, 4 * u)
		}
	})
	// The flagged shift: too little rest between two shifts; ringed (the one orange).
	rect(w, gx + 3 * cw - 2, top + 90 + 3 * 70 - 30, cw + 4, 60, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// Publish waits until the roster passes: a ghost button at the foot.
	button(w, x + width - 220, top + 520, 190, 52, u, { kind: 'ghost' })
}

/** Proof 1: an open shift that needs a certificate; only the people who hold it can take it. */
function certUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The open shift, top: its time and the certificate it needs (a lavender hex badge).
	panel(w, x, top, width, 120, u)
	rect(w, x + 30, top + 30, 60, 60, C.cobalt100, 4 * u)
	bar(w, x + 110, top + 38, 200, 14, C.cobalt900)
	bar(w, x + 110, top + 66, 120, 8, C.cobalt300)
	hex(w, x + width - 70, top + 60, 22, C.lavender, 3)
	// The people: those with the badge can take it; the others are dimmed.
	const people = [true, false, true, false, false]
	panel(w, x, top + 150, width, 460, u)
	people.forEach((ok, i) => {
		const cy = top + 200 + i * 86
		if (i > 0) rect(w, x + 24, cy - 43, width - 48, u, C.cobalt50)
		circle(w, x + 60, cy, 20, ok ? C.cobalt300 : C.cobalt100)
		bar(w, x + 96, cy - 12, 200 - (i % 3) * 30, 12, ok ? C.cobalt900 : C.cobalt200)
		bar(w, x + 96, cy + 10, 110, 7, ok ? C.cobalt300 : C.cobalt100)
		hex(w, x + width - 180, cy, 14, ok ? C.lavender : C.cobalt100, 2)
		button(w, x + width - 140, cy - 22, 110, 44, u, { kind: ok ? 'primary' : 'ghost' })
	})
	// The one who takes it: ringed (the one orange).
	rect(w, x + 14, top + 200 - 38, width - 28, 76, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the work site as a hex zone, the employee's position inside it, and the clock-in on the phone. */
function clockUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The site: blocks of a plan (abstract), the zone an upright hex outline, the position a dot.
	const zx = x + 230, zy = top + 270
	panel(w, x, top, width, 600, u, { fill: C.cobalt50 })
	;[[40, 40, 160, 110], [230, 30, 120, 90], [60, 420, 200, 120], [380, 440, 140, 100]].forEach(([bx, by, bw, bh]) => rect(w, x + bx, top + by, bw, bh, C.cobalt100, 4 * u))
	hex(w, zx, zy, 170, C.white, 6, { stroke: C.cobalt300, 'stroke-width': 2 * u })
	rect(w, zx - 70, zy - 50, 140, 100, C.cobalt200, 4 * u)
	circle(w, zx + 30, zy + 70, 16, C.cobalt)
	// The position inside the zone: ringed (the one orange).
	circle(w, zx + 30, zy + 70, 30, 'none', { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The phone: the clock-in, accepted.
	const p = phone(w, x + width - 330, top + 20, 300, 600)
	bar(p.screen, p.x + 40, p.y + 90, 140, 12, C.cobalt900)
	bar(p.screen, p.x + 40, p.y + 116, 90, 8, C.cobalt300)
	circle(p.screen, p.x + p.w / 2, p.y + 280, 80, C.cobalt)
	circle(p.screen, p.x + p.w / 2, p.y + 280, 34, 'none', { stroke: C.white, 'stroke-width': 6 })
	rect(p.screen, p.x + p.w / 2 - 3, p.y + 256, 6, 27, C.white, 3)
	rect(p.screen, p.x + p.w / 2 - 3, p.y + 277, 20, 6, C.white, 3)
	statusPill(p.screen, p.x + p.w / 2 - 60, p.y + 420, u)
}

const content = {
	app: 'humaniq',
	audience: { slug: 'rosters', name: 'Rosters', persona: 'Wendy Scholten, roster planner in care; Kevin de Groot, operations manager at a shift employer' },
	promise: 'Rosters that\nknow the rules',
	promiseLine: 'Rosters that know the rules: the Working Hours Act, the certificates a shift needs, a clock-in at the work site',
	title: 'Humaniq for rosters',
	record: { one: 'shift', many: 'shifts' },
	logline: 'For roster planners in care and shift work: the roster is checked against the Working Hours Act before it goes out, a shift only takes someone with the certificate it needs, clocking in only works at the work site, and every change shows who and when. No payroll in this film.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the roster check)', '#9 text-swap on a held diagram (who may take the shift)', '#1 dot-grows-to-fill (as a hex, site zone into the phone)'],
	neighbours: ['filinq', 'portaliq'],
	builtOnApps: ['filinq'],
	hook: {
		title: 'Every roster, checked against the law',
		caption: 'Every roster, checked\nagainst the law',
		ui: { drawUI: rosterUI, tagFill: 'cobalt' },
		source: 'positioning humaniq usp-working-hours-act, thin ("A roster gets checked against the Working Hours Act before you publish it."; "the roster warns you before you publish a breach"); spec rostering. Thin: no "only we".',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the week\'s roster, the Humaniq hex (cobalt) on the loop anchor, Publish as a ghost button. Technique #3, grid-cell ripple: the check runs over the roster in a wave, day by day, each shift stepping 40% to full; it stops on one shift that leaves too little rest, which turns lavender and takes the orange ring on beat 5. Publish stays a ghost.',
		sound: 'A ripple of ticks, a low double tick on the flagged shift.',
	},
	proofs: [
		{
			id: 'certified',
			title: 'Only certified staff on the shift',
			caption: 'Only certified staff\non the shift',
			source: 'positioning humaniq usp-competence-gated-rostering, thin ("A shift only accepts someone who holds the certificate it needs."); spec rostering. Thin: no "only we".',
			motion: 'A hex grows from the flagged shift (hexCut) into the open shift and its people. Technique #9, text-swap on a held diagram: the list holds; the certificate badge on the shift pulses and only the rows that hold the same badge light up, the others dim; on beat 4 the first one takes the shift and the orange ring.',
			sound: 'A soft pulse, ticks as rows light, a pluck as the shift is taken.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Only certified staff\non the shift', drawUI: certUI, tagFill: 'cobalt' }),
		},
		{
			id: 'clock',
			title: 'Clock in at work, nowhere else',
			caption: 'Clock in at work,\nnowhere else',
			source: 'positioning humaniq usp-geofenced-clockin, thin ("Clocking in only works from the work location itself."); spec time-attendance. Thin: no "only we".',
			motion: 'The site plan lands; the work zone draws as an upright hex outline and the employee\'s dot walks into it (ease.brand); the orange ring lands round the dot as it crosses the edge. Technique #1: the zone grows as an upright hex over the phone and shrinks into its clock button, which fills; the pill turns mint.',
			sound: 'Soft footstep ticks, a pluck as the dot enters the zone, a click as the clock-in is accepted.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Clock in at work,\nnowhere else', drawUI: clockUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Every change shows who and when',
		caption: 'Every change shows\nwho and when',
		source: 'COPY.dataLayer D1 (story.json mechanics[0]); Humaniq specs rostering, time-attendance (roster changes and punches kept on the record)',
		params: {
			record: { avatar: 'person', title: 230, sub: 150, status: 'mint' },
			links: ['nc-calendar', 'nc-files'],
		},
		sound: 'Ticks as the history rows land, a pluck on the new row.',
	},
}

export const { meta, boards } = audienceFilm(content)
