/**
 * Shillinq, audience film: small and mid-size businesses and freelancers. Direction C on the
 * app-film template, wrapped by _lib/audiencefilm.js. Round 7: specs and positioning count as
 * built. Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 *   hook     your bank feed matches itself to your invoices (sp-bank; specs
 *            bookkeeping-bank-reconciliation, bookkeeping-bank-connectors)
 *   proof 1  the VAT return fills itself in from your own books (sp-vat; spec bookkeeping-vat-btw-filing)
 *   proof 2  an invoice names another account number than the one on file: stopped before you
 *            pay (usp-spend-controls, verified; specs payment-control-guards, bookkeeping-ccm-rule-engine)
 *   general  notifications: an invoice goes overdue and the right person hears (bible fact 8;
 *            spec bookkeeping-credit-control-dunning)
 *   promise  "Books that follow your country's rules"
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (bank lines drop onto
 * their invoices), #4 typewriter (the VAT boxes fill), #6 hard diagonal wipe (into the payment
 * check), #9 text-swap on a held diagram (the payment list holds; one row stops).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together and merge into their containers.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Characters typed on one at a time.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A flat diagonal wipe on the beat.' },
]

/** Hook: bank lines on the left, open invoices on the right, matched pairs joined. */
function bankUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const cw = (width - 90) / 2
	panel(w, x, top, cw, 600, u)
	panel(w, x + cw + 90, top, cw, 600, u)
	bar(w, x + 30, top + 30, 140, 12, C.cobalt700)
	bar(w, x + cw + 120, top + 30, 140, 12, C.cobalt700)
	const matched = [true, true, false, true, true]
	matched.forEach((m, i) => {
		const cy = top + 100 + i * 100
		// Bank line: date, payer, amount.
		bar(w, x + 30, cy - 12, 60, 9, C.cobalt300)
		bar(w, x + 30, cy + 6, 150 - (i % 3) * 20, 11, C.cobalt900)
		bar(w, x + cw - 110, cy - 6, 80, 12, C.cobalt700)
		// Invoice: number, client, amount, status.
		const ix = x + cw + 90
		bar(w, ix + 30, cy - 12, 70, 9, C.cobalt300)
		bar(w, ix + 30, cy + 6, 140 - (i % 2) * 20, 11, C.cobalt900)
		if (m) statusPill(w, ix + cw - 150, cy, u)
		else idlePill(w, ix + cw - 90, cy, u, { w: 40 })
		// The join between them, square-cornered.
		if (m) rect(w, x + cw, cy - 1.5 * u, 90, 3 * u, C.mint)
	})
	// The pair that just matched: the one orange, as a ring round the join.
	const ry = top + 100 + 4 * 100
	rect(w, x + cw - 130, ry - 34, 90 + 260, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the VAT return, its boxes filled from the books; the amount to pay at the foot. */
function vatUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	bar(w, x + 30, top + 34, 200, 16, C.cobalt900)
	statusPill(w, x + width - 170, top + 42, u)
	for (let i = 0; i < 5; i++) {
		const cy = top + 110 + i * 78
		if (i > 0) rect(w, x + 24, cy - 39, width - 48, u, C.cobalt50)
		rect(w, x + 30, cy - 16, 44, 32, C.cobalt100, 4 * u)
		bar(w, x + 90, cy - 6, 260 - (i % 3) * 40, 11, C.cobalt700)
		// Two amounts per box: the base and the tax, typed in from the books.
		rect(w, x + width - 380, cy - 20, 160, 40, C.white, 4 * u, { stroke: C.cobalt200, 'stroke-width': u })
		rect(w, x + width - 200, cy - 20, 160, 40, C.white, 4 * u, { stroke: C.cobalt200, 'stroke-width': u })
		bar(w, x + width - 350, cy - 5, 100, 10, C.cobalt900)
		bar(w, x + width - 170, cy - 5, i === 4 ? 40 : 90, 10, C.cobalt900)
		if (i === 4) rect(w, x + width - 124, cy - 12, 3 * u, 24, C.cobalt)
	}
	// The total, at the foot: ringed (the one orange).
	const ty = top + 520
	rect(w, x + 30, ty, width - 60, 64, C.cobalt50, 4 * u)
	bar(w, x + 60, ty + 26, 200, 12, C.cobalt900)
	bar(w, x + width - 200, ty + 24, 120, 16, C.cobalt900)
	rect(w, x + 24, ty - 6, width - 48, 76, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the payment run; one invoice names another account than the one on file, and it stops. */
function guardUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	bar(w, x + 30, top + 34, 200, 16, C.cobalt900)
	for (let i = 0; i < 5; i++) {
		const cy = top + 110 + i * 80
		if (i > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		const stop = i === 2
		rect(w, x + 30, cy - 18, 36, 36, stop ? C.white : C.cobalt, 4 * u, stop ? { stroke: C.cobalt200, 'stroke-width': u } : {})
		bar(w, x + 90, cy - 12, 180 - (i % 3) * 30, 12, C.cobalt900)
		bar(w, x + 90, cy + 10, 120, 7, C.cobalt300)
		bar(w, x + width - 180, cy - 5, 120, 11, C.cobalt700)
	}
	// The stopped invoice, opened below: the account on file and the one on the invoice, side by side.
	const dy = top + 110 + 2 * 80 + 50
	const dw = (width - 90) / 2
	;[[C.cobalt, 'file'], [C.lavender, 'invoice']].forEach(([f], k) => {
		const dx = x + 30 + k * (dw + 30)
		rect(w, dx, dy + 180, dw, 90, C.cobalt50, 4 * u)
		hex(w, dx + 36, dy + 225, 14, f, 2)
		bar(w, dx + 64, dy + 208, 90, 8, C.cobalt400)
		bar(w, dx + 64, dy + 228, dw - 110, 12, k ? C.lavender : C.cobalt900)
	})
	// The stopped row: ringed (the one orange).
	rect(w, x + 14, top + 110 + 2 * 80 - 34, width - 28, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'shillinq',
	audience: { slug: 'business', name: 'Businesses and freelancers', persona: 'Wouter de Groot, office manager of a small business; Daan Willemsen, a freelancer billing his own clients' },
	promise: 'Books that follow\nyour country\'s rules',
	promiseLine: 'Books that follow your country\'s rules and keep up by themselves: the bank matched, the VAT return filled in, a wrong payment stopped',
	title: 'Shillinq for businesses',
	record: { one: 'invoice', many: 'invoices' },
	logline: 'For the office manager and the freelancer: the bank feed matches itself to the invoices, the VAT return fills itself in from the books, an invoice naming another account number is stopped before it is paid, and the right person hears when an invoice goes overdue.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge (bank lines onto invoices)', '#4 typewriter (the VAT boxes)', '#6 hard diagonal wipe', '#9 text-swap on a held diagram (one payment stops)'],
	neighbours: ['pipelinq', 'portaliq'],
	builtOnApps: ['pipelinq'],
	hook: {
		title: 'Your bank feed matches itself',
		caption: 'Your bank feed\nmatches itself',
		ui: { drawUI: bankUI, tagFill: 'cobalt' },
		source: 'positioning shillinq sp-bank ("Have your bank feed matched to invoices on its own."); specs bookkeeping-bank-reconciliation, bookkeeping-bank-connectors',
		motion: 'Frame 1 reads: caption, the bank lines and the open invoices, the Shillinq hex (cobalt) on the loop anchor. Technique #10: the bank lines arrive as loose bars from the left edge and each settles against its invoice (ease.brand, within one beat), a mint join drawing between them and the invoice pill turning mint; one stays open (no match yet). On beat 5 the last pair joins and takes the orange ring.',
		sound: 'Gentle open. A tick per join, a pluck on the last.',
	},
	proofs: [
		{
			id: 'vat',
			title: 'The VAT return fills itself in',
			caption: 'The VAT return\nfills itself in',
			source: 'positioning shillinq sp-vat ("See the VAT return filled in from your own books."); spec bookkeeping-vat-btw-filing',
			motion: 'A hex grows from the last join (hexCut) into the return. Technique #4, typewriter: the boxes fill top to bottom, each amount typed in greeked pairs 0.1 s apart, a cursor in the last one; the total at the foot adds up on the bar line and takes the orange ring.',
			sound: 'Soft key ticks, a low pluck on the total.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'The VAT return\nfills itself in', drawUI: vatUI, tagFill: 'cobalt' }),
		},
		{
			id: 'stopped',
			title: 'Account changed? Payment on hold',
			caption: 'Account changed?\nPayment on hold',
			source: 'positioning shillinq usp-spend-controls, verified ("Get warned when an invoice names a different account than the one on file."; "the mismatch gets flagged before the payment goes out"); specs payment-control-guards, bookkeeping-ccm-rule-engine',
			motion: 'Technique #6: a flat cobalt-700 diagonal wipe crosses on the beat into the payment run. Technique #9: the list holds; the rows tick off one per 16th, and the third one stops: its check stays empty, the two accounts slide open under it (the one on file, the one on the invoice in lavender), and the orange ring lands round the row.',
			sound: 'A percussive swish, ticks per row, a dry double tick as the row stops.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Account changed?\nPayment on hold', drawUI: guardUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Invoice overdue? The right person hears',
		caption: 'Invoice overdue?\nThe right person hears',
		source: 'bible "What is true" 8 ("when a quote is accepted or an invoice goes overdue, the right person gets the task and a notification"); spec bookkeeping-credit-control-dunning; COPY.notify N2',
		params: {
			record: { avatar: 'square', title: 230, sub: 150, status: 'idle' },
			event: { stage: 2, stages: 3 },
			notices: [{ app: 'shillinq' }, { icon: 'nc-mail' }, { icon: 'nc-files' }],
			recipients: [C.cobalt300],
		},
		sound: 'A low tick as the due date passes, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
