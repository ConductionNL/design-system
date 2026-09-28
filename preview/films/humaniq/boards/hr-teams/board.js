/**
 * Humaniq, audience film: HR teams (municipalities, semi-public employers, small and mid-size
 * employers). Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7:
 * specs and positioning count as built. Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 * Payroll is out of every Humaniq claim (positioning notes, orchestrator decision; bible: payroll
 * never shown). Six of eight USPs are thin: no "only we", and no "compliant": the lines say what
 * the app keeps track of.
 *
 *   hook     sick leave: every Gatekeeper Act (Wet verbetering poortwachter) step on time
 *            (sp-sickness-poortwachter; spec verzuim-wvp)
 *   proof 1  a new hire's address fills itself in from citizen records
 *            (usp-dutch-identity-checks, verified; spec onboarding-wizard)
 *   proof 2  one record, one signed contract (sp-employee-file; specs offer-esign,
 *            humaniq-docudesk-documents)
 *   general  notifications: a leave request and the manager hears (sp-leave-calendar;
 *            specs leave-calendar-nc, leave-management)
 *   promise  "Dutch HR rules, built into the work"
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the Gatekeeper milestones light in a
 * wave up to the next one due), #4 typewriter (the address types itself into the form),
 * #10 loose-shape cluster-to-container merge (the record's details merge into the contract).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, docPage } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Cells stepping on in a wave.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Characters typed on one at a time.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together and merge into one container.' },
]

/** Hook: one sickness case: the Gatekeeper milestones on a line, the next one due, and its task. */
function sickUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	circle(w, x + 64, top + 64, 30, C.cobalt300)
	bar(w, x + 110, top + 46, 220, 16, C.cobalt900)
	bar(w, x + 110, top + 74, 140, 8, C.cobalt300)
	// The milestones: a line with six hexes; done mint, next lavender, later cobalt-100.
	const ly = top + 200, lx0 = x + 60, lx1 = x + width - 60
	rect(w, lx0, ly - 1.5 * u, lx1 - lx0, 3 * u, C.cobalt100)
	rect(w, lx0, ly - 1.5 * u, (lx1 - lx0) * 0.4, 3 * u, C.mint)
	const state = ['done', 'done', 'done', 'next', 'later', 'later']
	state.forEach((s, i) => {
		const mx = lx0 + (i * (lx1 - lx0)) / 5
		hex(w, mx, ly, s === 'next' ? 26 : 20, s === 'done' ? C.mint : s === 'next' ? C.lavender : C.cobalt100, 3)
		bar(w, mx - 26, ly + 44, 52, 8, C.cobalt300)
	})
	// The next milestone: ringed (the one orange).
	const nx = lx0 + (3 * (lx1 - lx0)) / 5
	hex(w, nx, ly, 40, 'none', 4, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// Its task and the ones done, under the line.
	;[['next', 260], ['done', 220], ['done', 200]].forEach(([s, lw], i) => {
		const cy = top + 330 + i * 80
		rect(w, x + 30, cy - 30, width - 60, 60, s === 'next' ? C.cobalt50 : C.white, 4 * u, { stroke: C.cobalt100, 'stroke-width': u })
		hex(w, x + 64, cy, 12, s === 'next' ? C.lavender : C.mint, 2)
		bar(w, x + 90, cy - 6, lw, 11, C.cobalt900)
		if (s === 'next') idlePill(w, x + width - 110, cy, u, { w: 40 })
		else statusPill(w, x + width - 160, cy, u)
	})
}

/** Proof 1: the new hire's form; citizen records (a side box, left) fill the address fields. */
function hireUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The source: citizen records, a side box (rectangle: an outside system, sources left).
	const sw = 250
	rect(w, x, top + 160, sw, 200, C.cobalt50, 4 * u, { stroke: C.cobalt200, 'stroke-width': u })
	for (let l = 0; l < 4; l++) bar(w, x + 30, top + 200 + l * 36, sw - 60 - (l % 2) * 40, 10, C.cobalt300)
	// The form.
	const fx = x + sw + 90, fw = width - sw - 90
	panel(w, fx, top, fw, 600, u)
	bar(w, fx + 30, top + 34, 200, 16, C.cobalt900)
	const fields = [['typed', 0.6], ['typed', 0.4], ['filled', 0.7], ['filled', 0.5], ['filled', 0.35]]
	fields.forEach(([s, f], i) => {
		const fy = top + 90 + i * 96
		bar(w, fx + 30, fy, 110, 8, C.cobalt400)
		rect(w, fx + 30, fy + 20, fw - 60, 50, s === 'filled' ? C.mint300 : C.white, 4 * u, { stroke: C.cobalt200, 'stroke-width': u, 'fill-opacity': s === 'filled' ? 0.35 : 1 })
		bar(w, fx + 50, fy + 40, (fw - 120) * f, 10, C.cobalt900)
		if (s === 'filled') hex(w, fx + fw - 60, fy + 45, 10, C.mint, 1)
	})
	// Square-cornered wire from the source to the address block.
	rect(w, x + sw, top + 260 - 1.5 * u, 45, 3 * u, C.cobalt300)
	rect(w, x + sw + 45 - 1.5 * u, top + 260, 3 * u, 110, C.cobalt300)
	rect(w, x + sw + 45, top + 370 - 1.5 * u, 45, 3 * u, C.cobalt300)
	// The address block, filled: ringed (the one orange).
	rect(w, fx + 20, top + 90 + 2 * 96 - 10, fw - 40, 3 * 96 - 10, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the employee's record and the contract made from it, signed. */
function contractUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const rw = 360
	panel(w, x, top, rw, 560, u)
	circle(w, x + 60, top + 60, 28, C.cobalt300)
	bar(w, x + 104, top + 44, 180, 14, C.cobalt900)
	bar(w, x + 104, top + 70, 120, 8, C.cobalt300)
	for (let k = 0; k < 5; k++) {
		const fy = top + 140 + k * 76
		bar(w, x + 30, fy, 90, 8, C.cobalt400)
		bar(w, x + 30, fy + 22, 200 - (k % 3) * 30, 11, C.cobalt900)
	}
	// The contract: a document page filled from the record, the signature line at its foot.
	const dx = x + rw + 30, dw = width - rw - 30
	docPage(w, dx, top, dw, 560, { k: dw / 500, values: [118, 96, 72], lastOrange: false })
	const sy = top + 470
	rect(w, dx + 40, sy, dw * 0.45, 3 * u, C.cobalt300)
	bar(w, dx + 44, sy - 26, 120, 12, C.cobalt700)
	statusPill(w, dx + dw - 190, sy - 10, u)
	// The signature: ringed (the one orange).
	rect(w, dx + 28, sy - 48, dw - 56, 70, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'humaniq',
	audience: { slug: 'hr-teams', name: 'HR teams', persona: 'Marloes Bakker, HR adviser at a municipality; Youssef El Amrani, HR manager at a mid-size employer' },
	promise: 'Dutch HR rules,\nbuilt into the work',
	promiseLine: 'The Dutch HR rules in the daily work: sickness steps on time, new hires filled in, contracts signed from one record',
	title: 'Humaniq for HR teams',
	record: { one: 'employee', many: 'employees' },
	logline: 'For HR at a municipality or a growing employer: every Gatekeeper step of a sickness case on time, a new hire\'s address filled in from citizen records, a contract made and signed from one record, and the manager hearing about a leave request. No payroll in this film.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the milestones)', '#4 typewriter (the address)', '#10 cluster-to-container merge (details into the contract)'],
	neighbours: ['filinq', 'portaliq'],
	builtOnApps: ['filinq'],
	hook: {
		title: 'Sick leave, every step on time',
		caption: 'Sick leave, every\nstep on time',
		ui: { drawUI: sickUI, tagFill: 'cobalt' },
		source: 'positioning humaniq sp-sickness-poortwachter ("The app tracks every Gatekeeper milestone for you."); spec verzuim-wvp (Wet verbetering poortwachter)',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, one sickness case with its milestone line, the Humaniq hex (cobalt) on the loop anchor. Technique #3, grid-cell ripple: the milestone hexes step 20% to 40% to full in a wave from the left, the done ones turning mint, and the wave stops on the next one due, which pops to lavender; the orange hex ring lands round it on beat 5 and its task slides in at the top of the list.',
		sound: 'A ripple of ticks, a pluck on the next milestone.',
	},
	proofs: [
		{
			id: 'hire',
			title: 'New hire? Address filled in',
			caption: 'New hire?\nAddress filled in',
			source: 'positioning humaniq usp-dutch-identity-checks, verified ("A new hire\'s address fills itself in from citizen records."); spec onboarding-wizard',
			motion: 'A hex grows from the ringed milestone (hexCut) into the new hire\'s form. The name is typed by hand; then technique #4: the square-cornered wire draws from the citizen-records box and the address fields type themselves in, greeked pairs 0.1 s apart, each field turning pale mint with a check as it completes; the orange ring settles on the filled block.',
			sound: 'Key ticks for the typed name, a line-draw hiss, a quick run of ticks as the address fills.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'New hire?\nAddress filled in', drawUI: hireUI, tagFill: 'cobalt' }),
		},
		{
			id: 'contract',
			title: 'One record, one signed contract',
			caption: 'One record,\none signed contract',
			source: 'positioning humaniq sp-employee-file ("Generate a contract and have it signed from one record."); specs offer-esign, humaniq-docudesk-documents',
			motion: 'Technique #10: the record\'s fields lift off as loose bars, drift right and drop into the contract page\'s lines (ease.brand, within one beat). On beat 4 the signature line draws, the signed pill turns mint and the orange ring lands round the signature.',
			sound: 'Soft ticks as the fields land, a pen scratch, a pluck as it is signed.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'One record,\none signed contract', drawUI: contractUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Leave request? The manager hears',
		caption: 'Leave request?\nThe manager hears',
		source: 'positioning humaniq sp-leave-calendar ("A manager approves leave without opening a second system."); specs leave-calendar-nc, leave-management; story.json mechanic 8',
		params: {
			record: { avatar: 'person', title: 230, sub: 150, status: 'idle' },
			event: { stage: 1, stages: 3 },
			notices: [{ app: 'humaniq' }, { icon: 'nc-calendar' }, { icon: 'nc-files' }],
			recipients: [C.cobalt300],
		},
		sound: 'A low tick as the request is sent, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
