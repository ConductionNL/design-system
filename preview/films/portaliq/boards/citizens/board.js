/**
 * Portaliq, audience film: the citizen portal (municipalities). Direction C on the app-film
 * template, wrapped by _lib/audiencefilm.js. Round 7: matrix features count as built.
 * Research: ds-connext-film-review/apps/portaliq/research.json; positioning:
 * ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     a resident signs in with the government login and sees their case, its status
 *            and the decision letter (sp-gov-identity-signin, sp-case-status-tracking),
 *            cases from the municipality's other apps in the same portal (usp-fleet-data-in-your-portal)
 *   proof 1  they withdraw their own request, no phone call (usp-self-service-corrections)
 *   proof 2  a report without an account, and a receipt code to follow it (usp-anonymous-reporting)
 *   general  notifications: a new request, and the right colleague hears at once
 *   promise  "The portal answers, not the phone"
 *   (Round 15: the promise opens the body, straight after the opening; the body ends on the
 *   general scene and the app name returns in Built on Nextcloud)
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (the hook:
 * cases from several apps merge into one portal page), #4 typewriter (the receipt code),
 * #6 hard diagonal wipe on the beat (into the colleague's side).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Characters typed one by one.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A hard diagonal wipe on the beat.' },
]

/** The portal's own header: the organisation's house style (a solid band, its crest hex, the signed-in person). */
function portalHead(w, geom, { signedIn = true } = {}) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 80, width = geom.r - geom.x
	rect(w, x, top, width, 90, C.cobalt700, 4 * u)
	hex(w, x + 100, top + 45, 24, C.white, 3)
	bar(w, x + 140, top + 38, 160, 14, C.white)
	if (signedIn) {
		circle(w, x + width - 50, top + 45, 22, C.cobalt300)
		bar(w, x + width - 200, top + 40, 120, 10, C.cobalt200)
	}
	return top + 110
}

/** A status stepper: done steps mint, the current one ringed, the rest idle. */
function stepper(w, x, cy, width, current, u, { accent = true } = {}) {
	const n = 4, step = width / (n - 1)
	rect(w, x, cy - 3, width, 6, C.cobalt100, 3)
	rect(w, x, cy - 3, step * current, 6, C.mint, 3)
	for (let i = 0; i < n; i++) {
		const cx = x + i * step
		hex(w, cx, cy, 18, i < current ? C.mint : i === current ? C.cobalt : C.cobalt100, 3)
		if (i === current && accent) hex(w, cx, cy, 28, 'none', 4, { stroke: C.orange, 'stroke-width': 2.5 * u })
		bar(w, cx - 30, cy + 40, 60, 7, C.cobalt300)
	}
}

/** Hook: signed in, the case with its status and its decision letter; more cases below from other apps. */
function caseUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	panel(w, x, y, width, 300, u)
	bar(w, x + 40, y + 40, 260, 16, C.cobalt900)
	bar(w, x + 40, y + 70, 170, 9, C.cobalt300)
	stepper(w, x + 70, y + 150, width - 420, 2, u)
	// The decision letter, attached: a page with a cobalt rule.
	const lx = x + width - 250
	rect(w, lx, y + 60, 180, 210, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	rect(w, lx, y + 60, 180, 14, C.cobalt, 0)
	for (let i = 0; i < 6; i++) bar(w, lx + 20, y + 100 + i * 24, 130 - (i % 3) * 20, 6, C.cobalt200)
	// More of what is theirs, from the municipality's other apps: each row carries its app's glyph.
	const ry = y + 330
	panel(w, x, ry, width, 12 + 3 * 76 + 12, u)
	;[['dossiq', 220], ['shillinq', 180], ['filinq', 200]].forEach(([id, lw], i) => {
		const cy = ry + 50 + i * 76
		if (i > 0) rect(w, x + 24, cy - 38, width - 48, u, C.cobalt50)
		hex(w, x + 60, cy, 20, C.cobalt, 3)
		use(w, `g-${id}`, x + 47, cy - 13, 26, 26, C.white)
		bar(w, x + 100, cy - 10, lw, 10, C.cobalt900)
		bar(w, x + 100, cy + 8, lw * 0.5, 7, C.cobalt300)
		if (i === 1) statusPill(w, x + width - 160, cy, u)
		else idlePill(w, x + width - 150, cy, u)
	})
}

/** Proof 1: the request, withdrawn by the resident: the ghost button pressed, the case marked withdrawn. */
function withdrawUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	panel(w, x, y, width, 420, u)
	bar(w, x + 40, y + 40, 260, 16, C.cobalt900)
	bar(w, x + 40, y + 70, 170, 9, C.cobalt300)
	idlePill(w, x + width - 150, y + 55, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	for (let i = 0; i < 3; i++) bar(w, x + 40, y + 130 + i * 34, 420 - i * 60, 9, C.cobalt100)
	// The confirm step: Keep it (ghost) and Withdraw (primary, ringed: the tap).
	rect(w, x + 40, y + 250, width - 80, u, C.cobalt50)
	bar(w, x + 40, y + 290, 240, 10, C.cobalt700)
	button(w, x + width - 460, y + 320, 190, 64, u, { kind: 'ghost' })
	button(w, x + width - 250, y + 320, 210, 64, u, { kind: 'accent' })
}

/** Proof 2: a report with no account: the form, and the receipt code being typed out. */
function receiptUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom, { signedIn: false })
	panel(w, x, y, width, 480, u)
	// The report, sent: a photo tile and two filled fields, ticked.
	rect(w, x + 40, y + 40, 200, 150, C.cobalt50, 3 * u)
	hex(w, x + 140, y + 115, 26, C.cobalt200, 3)
	for (let i = 0; i < 2; i++) {
		bar(w, x + 280, y + 50 + i * 80, 90, 8, C.cobalt400)
		rect(w, x + 280, y + 68 + i * 80, width - 320, 44, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
		bar(w, x + 296, y + 86 + i * 80, 220 - i * 60, 9, C.cobalt900)
	}
	statusPill(w, x + 40, y + 230, u)
	// The receipt code: eight slots, six typed, a cursor, the box ringed (the one orange).
	const cy = y + 330
	rect(w, x + 40, cy, width - 80, 110, C.cobalt50, 4 * u)
	rect(w, x + 34, cy - 6, width - 68, 122, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	const sw = (width - 160) / 8
	for (let i = 0; i < 8; i++) {
		const sx = x + 80 + i * sw
		rect(w, sx, cy + 20, sw - 14, 70, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
		if (i < 6) rect(w, sx + (sw - 14) / 2 - 10, cy + 38, 20, 34, C.cobalt900, 3)
		if (i === 6) rect(w, sx + 10, cy + 32, 3 * u, 46, C.cobalt)
	}
}

const content = {
	app: 'portaliq',
	audience: { slug: 'citizens', name: 'Citizen portal', persona: 'Willem Postma, head of digital services at a municipality' },
	promise: 'What if nobody\nhad to call?',
	promiseLine: 'One portal in your house style that answers, so the phone does not have to',
	title: 'Portaliq for citizens',
	record: { one: 'case', many: 'cases' },
	logline: 'For the municipality: residents sign in with the government login and see their case, its status and the decision letter; withdraw a request themselves; report without an account and keep a receipt code; and the right colleague hears about every new request.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge', '#4 typewriter', '#6 hard diagonal wipe'],
	neighbours: ['dossiq', 'pipelinq'],
	builtOnApps: ['dossiq'],
	hook: {
		title: 'Check your case without calling',
		caption: 'Check your case\nwithout calling',
		ui: { drawUI: caseUI, tagFill: 'cobalt', header: false },
		source: 'positioning portaliq sp-gov-identity-signin ("Residents and businesses already sign in with DigiD or eHerkenning."), sp-case-status-tracking ("Your case\'s status and its documents sit on one page."), usp-fleet-data-in-your-portal (verified)',
		motion: 'Technique #10, cluster-to-container merge. In behind the app hex the promise leaves on the loop anchor: caption, the portal page in the window, the Portaliq hex (cobalt: the one orange is the current step) on the loop anchor. Over the first two beats the three lower rows start as loose hexes carrying their apps\' glyphs (Dossiq, Shillinq, Filinq) scattered over the frame and each tweens into its row on ease.brand, arriving within one beat: what is theirs from every app, in one portal. The status stepper fills to the current step, which takes the orange ring.',
		sound: 'Gentle open. Three soft ticks as the rows land, a pluck on the current step.',
	},
	proofs: [
		{
			id: 'withdraw',
			title: 'Changed your mind? Withdraw it yourself',
			caption: 'Changed your mind?\nWithdraw it yourself',
			source: 'positioning portaliq usp-self-service-corrections: "You fix, withdraw or undo your own request without calling anyone." (verified)',
			motion: 'Hex match cut from the current step into the request\'s pill. The confirm row slides open, the withdraw button presses (scale 0.97 and back) inside its orange ring, and the pill turns to withdrawn. No staff step, no call.',
			sound: 'A soft whoosh as the row opens, a dry click on the press.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Changed your mind?\nWithdraw it yourself', drawUI: withdrawUI, tagFill: 'cobalt', header: false }),
		},
		{
			id: 'receipt',
			title: 'Report anonymously, keep a receipt code',
			caption: 'Report anonymously,\nkeep a receipt code',
			source: 'positioning portaliq usp-anonymous-reporting: "File a report with no account and keep a receipt code." (verified)',
			motion: 'Technique #4, typewriter. The portal header drops its signed-in person (nobody is signed in). The report is already sent (mint); in the ringed box below the receipt code types itself, one character every 0.1 s, hard on and off, with a cursor. Out on the last beat: technique #6, a cobalt-900 diagonal wipe crosses left to right in 5 frames into the colleague\'s side.',
			sound: 'Key clicks under the typing, a percussive hit on the wipe.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Report anonymously,\nkeep a receipt code', drawUI: receiptUI, tagFill: 'cobalt', header: false }),
		},
	],
	general: {
		module: 'notify',
		caption: 'New request?\nThe right person hears',
		source: 'story.json mechanic 8; positioning portaliq sp-unified-inbox and platform notifications',
		params: {
			record: { avatar: 'square', title: 250, sub: 140, status: 'none' },
			event: { stage: 1, stages: 4 },
			notices: [{ app: 'portaliq' }, { icon: 'nc-mail' }, { icon: 'nc-files' }],
			recipients: [C.cobalt300],
		},
		sound: 'A dry click as the notice lands (no bell), a tick for the colleague who gets it.',
	},
}

export const { meta, boards } = audienceFilm(content)
