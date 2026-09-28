/**
 * Portaliq, audience film: the citizen portal (municipalities). Direction C on the app-film
 * template, wrapped by _lib/audiencefilm.js (promise first, the current motif). Round 25 (Ruben,
 * 2026-09-28): rebuilt around what a resident does in the portal, on the 12-bar plan (three proofs):
 *
 *   promise  "What if everything was in one place?"
 *   hook     view and pay your invoices (Shillinq invoices in the portal, paid from their row:
 *            openspec/changes/contribution-pay-screen, intake-pay-on-submit; usp-fleet-data-in-your-portal)
 *   proof 1  check your current products and update them yourself (a sibling app's records and
 *            actions in the portal: usp-fleet-data-in-your-portal; self-service: usp-self-service-corrections)
 *   proof 2  send a message and add a file to your case (inbox-reply-with-attachments, sp-unified-inbox)
 *   proof 3  change your own details (identity-profile-page)
 *   general  see who viewed your data (the data layer's log of who and when; OpenRegister's audit trail,
 *            Dossiq avg-verwerkingenlogging; sp-multitenant-admin-audit)
 *
 * Dropped in Round 25: "withdraw it yourself" and the anonymous report (the six asked-for proofs fill
 * the 12 bars; withdrawing lives on as one of the self-service actions on the products scene).
 *
 * Techniques: #10 cluster-to-container merge (the invoices gather from the council's apps), #4
 * typewriter (the message and the changed detail), #9 text-swap on the held window (products).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button, use, bubble } from '../../../_lib/ui.js'

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

/** Hook: your invoices from the council's apps, one row ringed with its pay button. */
function invoicesUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	panel(w, x, y, width, 420, u)
	bar(w, x + 40, y + 36, 200, 14, C.cobalt900)
	;[['shillinq', 210, 'due'], ['shillinq', 180, 'paid'], ['dossiq', 200, 'paid'], ['shillinq', 160, 'paid']].forEach(([id, lw, st], i) => {
		const cy = y + 100 + i * 78
		if (i > 0) rect(w, x + 24, cy - 39, width - 48, u, C.cobalt50)
		hex(w, x + 60, cy, 20, C.cobalt, 3)
		use(w, `g-${id}`, x + 47, cy - 13, 26, 26, C.white)
		bar(w, x + 100, cy - 10, lw, 10, C.cobalt900)
		bar(w, x + 100, cy + 8, lw * 0.5, 7, C.cobalt300)
		bar(w, x + width - 330, cy - 5, 90, 11, C.cobalt700)
		if (st === 'due') button(w, x + width - 190, cy - 26, 150, 52, u, { kind: 'accent' })
		else statusPill(w, x + width - 160, cy, u)
	})
}

/** Proof 1: your current products (a permit, a subscription, a container pass), each with its status and a change button. */
function productsUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	const cw = (width - 20) / 2, ch = 190
	;[0, 1, 2, 3].forEach((i) => {
		const cx = x + (i % 2) * (cw + 20), cy = y + Math.floor(i / 2) * (ch + 20)
		panel(w, cx, cy, cw, ch, u)
		hex(w, cx + 44, cy + 44, 20, i === 1 ? C.lavender : C.cobalt300, 3)
		bar(w, cx + 80, cy + 36, 150, 12, C.cobalt900)
		bar(w, cx + 80, cy + 60, 100, 8, C.cobalt300)
		if (i === 1) idlePill(w, cx + cw - 110, cy + 44, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
		else statusPill(w, cx + cw - 140, cy + 44, u)
		button(w, cx + 30, cy + ch - 76, 130, 50, u, { kind: i === 1 ? 'accent' : 'ghost' })
	})
}

/** Proof 2: the message thread with the council: their message, your reply with a file, and the file added to your case. */
function messagesUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	panel(w, x, y, width, 470, u)
	// The council's message, left.
	bubble(w, x + 30, y + 30, 460, 110, u, { side: 'agent' })
	bar(w, x + 56, y + 60, 300, 10, C.cobalt700)
	bar(w, x + 56, y + 86, 220, 8, C.cobalt300)
	// Your reply, right, with a file chip attached.
	bubble(w, x + width - 490, y + 170, 460, 150, u, { side: 'user' })
	bar(w, x + width - 464, y + 200, 280, 10, C.cobalt700)
	bar(w, x + width - 464, y + 224, 180, 8, C.cobalt700)
	rect(w, x + width - 464, y + 252, 240, 44, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	use(w, 'nc-files', x + width - 452, y + 262, 24, 24, C.nextcloud)
	bar(w, x + width - 418, y + 268, 150, 9, C.cobalt900)
	// Added to your case: the case row under the thread, its new file pip ringed.
	rect(w, x + 24, y + 360, width - 48, u, C.cobalt50)
	hex(w, x + 60, y + 410, 20, C.lavender, 3)
	bar(w, x + 100, y + 400, 240, 11, C.cobalt900)
	rect(w, x + width - 250, y + 392, 180, 36, C.cobalt50, 18)
	use(w, 'nc-files', x + width - 240, y + 398, 24, 24, C.nextcloud)
	bar(w, x + width - 206, y + 406, 110, 8, C.cobalt700)
	rect(w, x + width - 258, y + 384, 196, 52, 'none', 26, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 3: your own details, one being changed in place and saved. */
function profileUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	panel(w, x, y, width, 440, u)
	circle(w, x + 80, y + 70, 40, C.cobalt300)
	bar(w, x + 140, y + 56, 220, 16, C.cobalt900)
	bar(w, x + 140, y + 86, 150, 9, C.cobalt300)
	;[[200, false], [240, true], [170, false]].forEach(([lw, edit], i) => {
		const cy = y + 170 + i * 88
		bar(w, x + 40, cy - 26, 110, 8, C.cobalt400)
		rect(w, x + 40, cy - 10, width - 260, 52, C.white, 3 * u, { stroke: edit ? C.orange : C.cobalt100, 'stroke-width': edit ? 2.5 * u : u })
		bar(w, x + 60, cy + 10, lw, 11, C.cobalt900)
		if (edit) { rect(w, x + 60 + lw + 8, cy + 2, 3 * u, 30, C.cobalt); statusPill(w, x + width - 190, cy + 16, u) }
		else idlePill(w, x + width - 180, cy + 16, u, { w: 30 })
	})
}

const content = {
	app: 'portaliq',
	audience: { slug: 'citizens', name: 'Citizen portal', persona: 'Willem Postma, head of digital services at a municipality' },
	promise: 'What if everything\nwas in one place?',
	promiseLine: 'Everything a resident has with the council in one portal: invoices paid, products updated, messages and files on the case, their own details, and who viewed their data',
	title: 'Portaliq for citizens',
	record: { one: 'case', many: 'cases' },
	logline: 'Round 25: for the municipality, what a resident does in one portal: view and pay invoices, check and update current products, send a message and add a file to the case, change their own details, and see who viewed their data.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge', '#4 typewriter', '#9 text-swap on a held window'],
	maxWords: 40,
	neighbours: ['dossiq', 'shillinq'],
	builtOnApps: ['dossiq'],
	hook: {
		title: 'View and pay your invoices',
		caption: 'View and pay\nyour invoices',
		ui: { drawUI: invoicesUI, tagFill: 'cobalt', header: false },
		source: 'Portaliq openspec/changes/contribution-pay-screen (Shillinq invoices in the portal, paid from their row) and intake-pay-on-submit; positioning usp-fleet-data-in-your-portal',
		motion: 'Technique #10, cluster-to-container merge. In behind the app hex the promise leaves on the loop anchor: the portal in the council\'s house style lays in, and the invoice rows start as loose hexes carrying their apps\' glyphs (Shillinq, Dossiq) and tween into the list on ease.brand, arriving within one beat. The open invoice keeps its Pay button, ringed in orange; on beat 5 it presses and its row turns paid.',
		sound: 'Soft ticks as the rows land, a dry click on Pay.',
	},
	proofs: [
		{
			id: 'products',
			title: 'Check and update your products',
			caption: 'Check your products,\nupdate them yourself',
			source: 'Portaliq positioning usp-fleet-data-in-your-portal (a sibling app\'s records and actions in the portal) and usp-self-service-corrections (fix, withdraw or undo your own request yourself)',
			motion: 'Technique #9, text-swap on a held window: the portal head holds while the page under it swaps from invoices to products. Four cards (a permit, a subscription, a pass, a service) land a sixteenth apart; the second, due for renewal, holds its Change button in the orange ring and presses on the beat, its status turning current.',
			sound: 'A soft swish as the page swaps, a tick per card, a click on Change.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Check your products,\nupdate them yourself', drawUI: productsUI, tagFill: 'cobalt', header: false }),
		},
		{
			id: 'messages',
			title: 'Messages and files on your case',
			caption: 'Messages and files\non your case',
			source: 'Portaliq openspec/changes/inbox-reply-with-attachments (reply in the portal, attach a file) and positioning sp-unified-inbox ("Every message about you lands in one inbox, with an alert.")',
			motion: 'Technique #4, typewriter: the council\'s message sits left; the reply types itself on the right, a file chip drops onto it, it sends; on the next beat the file lands on the case row underneath, ringed in orange: added to your case.',
			sound: 'Key clicks under the reply, a soft send swoosh, a tick as the file lands on the case.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Messages and files\non your case', drawUI: messagesUI, tagFill: 'cobalt', header: false }),
		},
		{
			id: 'profile',
			title: 'Change your own details',
			caption: 'Change your\nown details',
			source: 'Portaliq openspec/changes/identity-profile-page (see and change your own portal details; PATCH /portal/api/identity/details)',
			motion: 'The profile lays in; the second field opens in place (its edge turns orange), the old value leaves upward and the new one types on, and its pill turns mint: saved, by the resident.',
			sound: 'Key clicks under the new value, a pluck as it saves.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Change your\nown details', drawUI: profileUI, tagFill: 'cobalt', header: false }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'See who viewed your data',
		caption: 'See who viewed\nyour data',
		source: 'The data layer logs who and when (story.json mechanics 0; OpenRegister audit trail); Dossiq specs avg-verwerkingenlogging; Portaliq positioning sp-multitenant-admin-audit ("Editors and admins get separate rights that are always logged.")',
		params: {
			record: { avatar: 'person', title: 230, sub: 150, status: 'mint', fields: [[56, 140], [56, 120], [64, 160], [48, 96]] },
			history: [{ av: C.cobalt300, w: 190 }, { av: C.lavender300, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-mail', 'nc-files', 'nc-talk'],
		},
		sound: 'A tick for each view in the log, the newest with a pluck.',
	},
}

export const { meta, boards } = audienceFilm(content)
