/**
 * Learniq app film, direction C ("Proof"), on the shared app-film template.
 * 16:9, 1920 x 1080 since 2026-09-27: the captions sit in the type column and
 * the drawUI functions below draw into the hook window's mock space (u = 2.5,
 * main column geom.x to geom.r, about 855 px, first row on geom.anchor.y), the
 * same geometry the approved 9:16 stills used, now shown at 0.8 on the right.
 * The opening frame gives its one orange to the rule that falls short, so the
 * Learniq hex on the loop anchor is cobalt there.
 *
 * Every word and moment is in Learniq 0.3.0, the stable app-store release
 * (tag v0.3.0 = 2f84a83), per ds-connext-film-review/apps/learniq/research.json:
 *   hook    regulations with live coverage: what share of people finished each
 *           rule's mandatory training, the one falling short in orange
 *   proof 1 a certificate with its expiry date; every certificate shows valid,
 *           expiring soon or expired, and the holder is warned 30 days ahead
 *   proof 2 outside training recorded with evidence and approved by a compliance
 *           officer, after which it counts
 *   general the notification: a reminder before the due date, and the manager and HR
 *           told when a mandatory course is overdue (the shared notification layer)
 *   outro   the honeycomb round the Nextcloud workspace, Learniq singled out
 *
 * Never shown (research.json never_claim): attendance marking, gradebook, bulk enrol,
 * audit-pack export (empty in 0.3.0), the Leerplicht warning, managers getting
 * certificate warnings (the learner gets them), AI over learner data, Calendar,
 * ready-made flows, screens from the development build.
 */
import { C } from '../../../_lib/brand.js'
import { appFilm } from '../../../_lib/appfilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, hex, panel, statusPill, idlePill, fileRow, button } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker and X Numbers', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A short caption over the product UI and the hex that grows out of a UI element into the next scene.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Push into the UI only until the detail reads, hold, never cut on a word.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A small logo over the type, the type in its own column beside the product UI, one orange per scene.' },
]

/** A coverage bar: cobalt-100 track, forest fill (on track) or the scene's orange (short of the bar you set). */
function coverage(w, x, cy, width, p, u, short = false) {
	const h = 6 * u
	rect(w, x, cy - h / 2, width, h, C.cobalt100, h / 2)
	rect(w, x, cy - h / 2, width * p, h, short ? C.orange : C.forest, h / 2)
	rect(w, x + width * 0.8, cy - h, u, 2 * h, C.cobalt400)
}

/**
 * The 'expiring soon' status: the status pill's shape with orange ink on white
 * and an orange edge. Orange is never a box behind a label, greeked or not.
 */
function soonPill(w, x, cy, u) {
	const pw = 43 * u, h = 11 * u
	rect(w, x, cy - h / 2, pw, h, C.white, h / 2, { stroke: C.orange, 'stroke-width': 1.2 * u })
	hex(w, x + 9 * u, cy, 3.5 * u, C.orange)
	bar(w, x + 15 * u, cy - 1.5 * u, 22 * u, 3 * u, C.orange)
}

/** Hook: the regulations list, each rule's coverage against the threshold you set. */
function regulationsUI(w, geom) {
	const { u } = geom
	const rows = [{ w: 150, p: 0.94 }, { w: 190, p: 0.88 }, { w: 170, p: 0.61, short: true }, { w: 210, p: 0.97 }, { w: 160, p: 0.83 }, { w: 180, p: 0.9 }]
	const top = geom.anchor.y - 50
	const width = geom.r - geom.x
	panel(w, geom.x, top, width, 12 + rows.length * 80 + 12, u)
	rows.forEach((row, i) => {
		const cy = geom.anchor.y + i * 80
		if (i > 0) rect(w, geom.x + 24, cy - 40, width - 48, u, C.cobalt50)
		hex(w, geom.x + 76, cy, 22, C.cobalt300, 3)
		bar(w, geom.x + 116, cy - 12, row.w, 10, C.cobalt900)
		bar(w, geom.x + 116, cy + 8, row.w * 0.55, 7, C.cobalt300)
		coverage(w, geom.x + 440, cy, 300, row.p, u, row.short)
	})
}

/** Proof 1: a certificate with its expiry, and the list of certificates by status. */
function certificateUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60
	// The certificate: a document with a seal and a valid-until line.
	panel(w, x, top, 420, 520, u)
	rect(w, x, top, 420, 8 * u, C.cobalt, 0)
	hex(w, x + 330, top + 110, 46, C.cobalt, 6)
	hex(w, x + 330, top + 110, 26, C.white, 4)
	bar(w, x + 40, top + 80, 200, 16, C.cobalt900)
	bar(w, x + 40, top + 116, 150, 10, C.cobalt300)
	for (let i = 0; i < 5; i++) bar(w, x + 40, top + 200 + i * 34, 340 - i * 30, 8, C.cobalt100)
	bar(w, x + 40, top + 420, 90, 9, C.cobalt400)
	bar(w, x + 40, top + 446, 160, 14, C.cobalt900)
	// The status list: valid, expiring soon (the one orange), valid.
	const lx = x + 450, lw = geom.r - lx
	panel(w, lx, top, lw, 12 + 3 * 92 + 12, u)
	;[{ s: 'valid' }, { s: 'soon' }, { s: 'valid' }].forEach((row, i) => {
		const cy = top + 58 + i * 92
		if (i > 0) rect(w, lx + 20, cy - 46, lw - 40, u, C.cobalt50)
		hex(w, lx + 50, cy, 18, C.cobalt200, 3)
		bar(w, lx + 84, cy - 10, 120, 9, C.cobalt900)
		if (row.s === 'soon') soonPill(w, lx + 84, cy + 18, u)
		else statusPill(w, lx + 84, cy + 18, u)
	})
}

/** Proof 2: outside training with its evidence, and the officer's approval that makes it count. */
function outsideTrainingUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 50, width = geom.r - geom.x
	panel(w, x, top, width, 560, u)
	hex(w, x + 70, top + 64, 26, C.cobalt300, 4)
	bar(w, x + 116, top + 48, 260, 16, C.cobalt900)
	bar(w, x + 116, top + 78, 170, 9, C.cobalt300)
	idlePill(w, x + width - 140, top + 64, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	// Evidence: the certificate from elsewhere, attached.
	bar(w, x + 40, top + 150, 110, 9, C.cobalt400)
	fileRow(w, x + 40, top + 190, 320, u)
	fileRow(w, x + 40, top + 236, 240, u)
	// The officer's decision: reject (ghost) and approve (primary).
	rect(w, x + 40, top + 320, width - 80, u, C.cobalt50)
	bar(w, x + 40, top + 360, 180, 9, C.cobalt400)
	button(w, x + width - 420, top + 420, 170, 64, u, { kind: 'ghost' })
	button(w, x + width - 230, top + 420, 190, 64, u, { kind: 'primary' })
	// The tap, the scene's one orange: two hex outlines stepping out from the approve button.
	hex(w, x + width - 135, top + 452, 40, 'none', 4, { stroke: C.orange, 'stroke-width': 3 * u })
	hex(w, x + width - 135, top + 452, 62, 'none', 6, { stroke: C.orange, 'stroke-width': 1.5 * u, opacity: 0.6 })
}

const content = {
	app: 'learniq',
	title: 'Learniq film',
	record: { one: 'course', many: 'courses' },
	logline: 'Learniq in 15 seconds: who finished the mandatory training, rule by rule; certificates that warn before they expire; outside training that counts once an officer approves it; and the reminder that reaches the right person, then Learniq settles into the ConNext honeycomb.',
	references: REFS,
	hook: {
		title: 'Coverage per rule',
		// Shortened in round 3 so it sets at headline size; the coverage bars per rule carry "mandatory".
		caption: 'Who finished\nthe training?',
		// The rule that falls short is the scene's one orange, so the app hex stays cobalt here.
		ui: { drawUI: regulationsUI, tagFill: 'cobalt' },
		source: 'research.json feature "Regulations with live coverage percentage and red/amber/green" (v0.3.0) and scene 1',
		motion: 'Frame 1 is this frame: the question set in the type column, the regulations list in the window, the Learniq hex (cobalt: the one orange is the rule that falls short) on the loop anchor. The coverage bars fill left to right one frame apart over the first beat; the rule short of its bar fills orange last. Slow push in across the bar.',
		sound: 'Gentle open: pad and offbeat bass only, no stinger on frame 1. A soft rising pluck per bar as they fill.',
	},
	proofs: [
		{
			id: 'certificate',
			title: 'Certificates warn before they expire',
			caption: 'Certificates warn\nbefore they expire.',
			apps: ['learniq'],
			source: 'research.json features "Certificate issued on course completion" and "Certificate expiry status and 30-day warning" (v0.3.0): the holder is warned 30 days ahead',
			motion: 'Hex match cut from the short rule: a hex grows out of its orange bar and shrinks into the certificate seal. The certificate settles, the status list slides in beside it, and the middle row steps from valid to expiring soon (orange) on 3.1. Caption rises as the seal lands.',
			sound: 'Whoosh through the hex cut, a tick as the seal lands, a pluck as the status changes. Kick enters on bar 3.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Certificates warn\nbefore they expire.', drawUI: certificateUI, tagFill: 'cobalt' }),
		},
		{
			id: 'outside-training',
			title: 'Outside training counts',
			caption: 'Outside training\ncounts too.',
			apps: ['learniq'],
			source: 'research.json feature "External training records with officer verification" (v0.3.0) and scene 3',
			motion: 'Push down from the certificate to the outside-training record: the evidence file drops in, the camera eases to the officer\'s buttons, the approve button presses (scale 0.97 and back) and two hex outlines step out from the tap. The pending pill turns verified. Caption rises with the push.',
			sound: 'A soft whoosh on the push, a tick as the file lands, an impact plus a bright pluck on the tap.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Outside training\ncounts too.', drawUI: outsideTrainingUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		// Shortened in round 3; 0.3.0 tells the manager and HR when a mandatory course is overdue.
		caption: 'Course overdue?\nManagers hear.',
		source: 'story.json mechanic 8; research.json notifications (v0.3.0): a reminder 3 days before a mandatory course is due, the manager and HR told when it is overdue',
		params: {
			record: { avatar: 'hex', title: 260, sub: 120, status: 'none' },
			event: { stage: 1, stages: 3 },
			notices: [{ app: 'learniq' }, { icon: 'nc-talk' }, { icon: 'nc-files' }],
			recipients: [C.lavender300, C.cobalt300],
		},
		sound: 'A bell-like pluck as the notification lands in the Nextcloud bell, a tick for each person who gets it.',
	},
	outro: { neighbours: ['portaliq'] },
}

export const { meta, boards } = appFilm(content)
