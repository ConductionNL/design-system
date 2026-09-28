/**
 * Learniq, audience film: compliance training (businesses and public bodies with NIS2
 * duties). Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7:
 * matrix features count as built. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     every rule on one page, live coverage against your own lines (usp-compliance-coverage)
 *   proof 1  a signed attestation locks, the export proves nobody edited it (usp-tamper-proof-records)
 *   proof 2  a certificate goes into the learner's own wallet (usp-eu-wallet-credentials)
 *   general  notifications: a mandatory course goes overdue and the manager hears
 *   promise  "Ready before the inspector asks"
 *   (Round 15: the promise opens the body, straight after the opening; the body ends on the
 *   general scene and the app name returns in Built on Nextcloud)
 *
 * Techniques (refs/techniques.md): #1 dot-grows-to-fill as an upright hex (the short rule's
 * orange bar becomes the seal), #6 hard diagonal wipe on the beat (into the wallet).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, hex, panel, statusPill, phone } from '../../../_lib/ui.js'
import { regulationsUI } from '../C/board.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A dot on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A hard diagonal wipe on the beat between chapters.' },
]

/** Proof 1: the signed attestation, locked, and the export that proves it. */
function sealedUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The attestation: a statement, the signature, the lock hex (the scene's one orange as a ring).
	panel(w, x, top, 460, 540, u)
	rect(w, x, top, 460, 8 * u, C.cobalt, 0)
	bar(w, x + 40, top + 70, 220, 16, C.cobalt900)
	for (let i = 0; i < 5; i++) bar(w, x + 40, top + 130 + i * 32, 370 - i * 40, 8, C.cobalt100)
	// The signature: a stepped line (no curves drawn freehand), on its rule.
	const sy = top + 400
	;[[0, 0, 40], [40, -14, 30], [70, 6, 36], [106, -10, 44], [150, 4, 30]].forEach(([dx, dy, lw]) => rect(w, x + 40 + dx, sy + dy, lw, 5, C.cobalt700, 2))
	rect(w, x + 40, sy + 30, 260, 3, C.cobalt300)
	hex(w, x + 370, sy + 10, 44, C.cobalt, 6)
	hex(w, x + 370, sy + 10, 58, 'none', 7, { stroke: C.orange, 'stroke-width': 2.5 * u })
	rect(w, x + 356, sy + 4, 28, 22, C.white, 3)
	rect(w, x + 362, sy - 8, 16, 14, 'none', 7, { stroke: C.white, 'stroke-width': 4 })
	// The export: the file, and its check that nothing changed since the signature.
	const ex = x + 490, ew = width - 490
	panel(w, ex, top, ew, 250, u)
	rect(w, ex + 30, top + 40, 70, 90, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	rect(w, ex + 30, top + 40, 70, 12, C.cobalt, 0)
	bar(w, ex + 124, top + 58, 180, 12, C.cobalt900)
	bar(w, ex + 124, top + 84, 120, 8, C.cobalt300)
	statusPill(w, ex + 30, top + 180, u)
	bar(w, ex + 150, top + 176, 150, 8, C.cobalt200)
}

/** Proof 2: the certificate on the left, and the same credential in the learner's own wallet. */
function walletUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60
	panel(w, x, top, 400, 480, u)
	rect(w, x, top, 400, 8 * u, C.cobalt, 0)
	hex(w, x + 310, top + 100, 42, C.cobalt, 6)
	hex(w, x + 310, top + 100, 24, C.white, 4)
	bar(w, x + 40, top + 76, 180, 16, C.cobalt900)
	bar(w, x + 40, top + 110, 130, 10, C.cobalt300)
	for (let i = 0; i < 4; i++) bar(w, x + 40, top + 190 + i * 34, 320 - i * 36, 8, C.cobalt100)
	statusPill(w, x + 40, top + 420, u)
	// Steps from certificate to wallet.
	for (let i = 0; i < 3; i++) hex(w, x + 440 + i * 26, top + 240, 7, i === 2 ? C.orange : C.cobalt300, 1)
	// The wallet on a phone: a stack of credential cards, the new one on top.
	const p = phone(w, x + 540, top - 40, 320, 640)
	const cx = p.x + 24, cw = p.w - 48
	rect(p.screen, cx, p.y + 250, cw, 150, C.cobalt200, 8 * u)
	rect(p.screen, cx, p.y + 200, cw, 150, C.cobalt300, 8 * u)
	rect(p.screen, cx, p.y + 110, cw, 170, C.cobalt, 8 * u)
	hex(p.screen, cx + cw - 50, p.y + 160, 22, C.white, 3)
	bar(p.screen, cx + 24, p.y + 150, 130, 12, C.white)
	bar(p.screen, cx + 24, p.y + 176, 90, 8, C.cobalt200)
	bar(p.screen, cx + 24, p.y + 240, 160, 8, C.cobalt200)
}

const content = {
	app: 'learniq',
	audience: { slug: 'compliance', name: 'Compliance training', persona: 'Robert de Groot, compliance officer; the HR and L&D manager co-buys' },
	promise: 'What if training proof\nwas always ready?',
	promiseLine: 'Training proof, ready for inspectors: every rule\'s coverage on one page, signed records, certificates in staff phone wallets',
	title: 'Learniq for compliance training',
	record: { one: 'course', many: 'courses' },
	logline: 'For the compliance officer: every rule\'s coverage live on one page, a signed record nobody can quietly edit, a certificate in the learner\'s own wallet, and the manager told when training runs overdue.',
	references: REFS,
	techniques: ['#1 dot-grows-to-fill (as a hex)', '#6 hard diagonal wipe'],
	neighbours: ['humaniq', 'portaliq'],
	builtOnApps: ['humaniq'],
	hook: {
		title: 'Every rule\'s coverage, one page',
		caption: 'Every rule\'s coverage,\none page',
		ui: { drawUI: regulationsUI, tagFill: 'cobalt' },
		source: 'positioning learniq usp-compliance-coverage: "Set your own red and amber line for every rule\'s coverage." (verified)',
		motion: 'In behind the app hex the promise leaves on the loop anchor: caption, the regulations list, the Learniq hex (cobalt: the one orange is the rule that falls short) on the loop anchor. The coverage bars fill left to right one frame apart; the threshold ticks drop onto each track; the rule short of its line fills orange last. Out: technique #1, the short rule\'s orange bar end becomes an upright hex that grows past the frame (hexCut, ease.snap, one beat) and shrinks into the attestation\'s lock.',
		sound: 'Gentle open: pad and offbeat bass. A rising pluck per bar as they fill, a whoosh through the hex.',
	},
	proofs: [
		{
			id: 'sealed',
			title: 'Signed once, nobody edits it',
			caption: 'Signed once,\nnobody edits it',
			source: 'positioning learniq usp-tamper-proof-records: "The export proves nobody edited the record after it was signed." (verified)',
			motion: 'The hex lands as the lock on the attestation. The signature draws itself in steps (five flat strokes, a sixteenth apart), the lock closes (its shackle drops 6 px), the orange ring steps out once. On the next beat the export card slides in on the right and its pill turns mint: unchanged since signing. Out on the last beat: technique #6, a full-frame cobalt-900 diagonal wipe crosses left to right in 5 frames, cutting as it passes centre.',
			sound: 'Five soft ticks for the signature, a dry click as the lock closes, a percussive hit on the wipe.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Signed once,\nnobody edits it', drawUI: sealedUI, tagFill: 'cobalt' }),
		},
		{
			id: 'wallet',
			title: 'Certificates in staff phone wallets',
			caption: 'Certificates in\nstaff phone wallets',
			source: 'positioning learniq usp-eu-wallet-credentials: "Sign a certificate and push it to a digital wallet. A withdrawal follows it there." (verified)',
			motion: 'The wipe reveals the certificate. Three small hexes step right from its seal (the last orange), the phone rises into the window, and the new credential drops onto the top of the wallet stack (spring), pushing the older cards down 50 px.',
			sound: 'Three plucks up the scale as the hexes step, a soft thud as the card lands in the wallet.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Certificates in\nstaff phone wallets', drawUI: walletUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		caption: 'Training overdue?\nThe manager hears',
		source: 'story.json mechanic 8; positioning learniq platform notifications; Learniq declares the manager and HR told when a mandatory course is overdue',
		params: {
			record: { avatar: 'hex', title: 260, sub: 120, status: 'none' },
			event: { stage: 1, stages: 3 },
			notices: [{ app: 'learniq' }, { icon: 'nc-talk' }, { icon: 'nc-files' }],
			recipients: [C.lavender300, C.cobalt300],
		},
		sound: 'A dry click as the notice lands (no bell), a tick for each person who gets it.',
	},
}

export const { meta, boards } = audienceFilm(content)
