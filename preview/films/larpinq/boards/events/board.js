/**
 * Larpinq, audience film: commercial LARP event producers. Direction C on the app-film
 * template, wrapped by _lib/audiencefilm.js. Round 7: specs and positioning count as built.
 * Positioning: ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   hook     tickets priced by role, and you see who has paid (sp-registration-payment;
 *            positioning, counted as built)
 *   proof 1  check players in at the gate and their XP follows (sp-run-events; specs
 *            event-checkin-roster, event-xp-awards)
 *   proof 2  every character sheet printed in your own layout (sp-printing; spec pdf-export)
 *   general  flows: you decide what happens once a ticket is paid (story.json mechanic 7;
 *            the customer draws the flow, never "pre-built")
 *   promise  "Your event, from ticket to gate"
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the paid cells filling across the
 * roles), #11 whip-pan on the beat (from the gate roster to the print run), #5 stepped hex
 * wipe (into the flow editor).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, idlePill, statusPill, docPage } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves; a stepped wipe of flat shapes.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A fast whip between held shots, on the beat.' },
]

/** Hook: the ticket types by role with their prices, and the registrations with their paid status. */
function ticketUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// Ticket types: one card per role (player, crew, monster), each with its price.
	const n = 3, cw = (width - 64 - (n - 1) * 16) / n
	for (let i = 0; i < n; i++) {
		const cx = x + 64 + i * (cw + 16)
		panel(w, cx, top, cw, 130, u)
		hex(w, cx + 34, top + 40, 14, [C.cobalt, C.lavender, C.cobalt400][i], 2)
		bar(w, cx + 60, top + 34, 110, 11, C.cobalt900)
		rect(w, cx + 24, top + 76, 90, 34, C.cobalt50, 3 * u)
		bar(w, cx + 38, top + 88, 56, 10, C.cobalt700)
	}
	// Registrations: name, role, and paid (mint) or not yet (idle).
	panel(w, x, top + 154, width, 450, u)
	for (let r = 0; r < 6; r++) {
		const cy = top + 204 + r * 68
		if (r > 0) rect(w, x + 20, cy - 34, width - 40, u, C.cobalt50)
		circle(w, x + 50, cy, 18, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 80, cy - 5, 150 - (r % 3) * 20, 9, C.cobalt900)
		hex(w, x + 330, cy, 11, [C.cobalt, C.lavender, C.cobalt400][r % 3], 2)
		bar(w, x + 352, cy - 4, 70, 8, C.cobalt300)
		if (r === 3) idlePill(w, x + width - 150, cy, u, { w: 40 })
		else statusPill(w, x + width - 150, cy, u)
	}
	// The one still unpaid: ringed (the scene's one orange), the one the treasurer chases.
	rect(w, x + 12, top + 204 + 3 * 68 - 32, width - 24, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the gate roster: players checked in, and the XP that follows on the row just checked. */
function gateUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 610, u)
	;[x + 30, x + 330, x + width - 200].forEach((hx) => bar(w, hx, top + 30, 80, 8, C.cobalt400))
	for (let r = 0; r < 7; r++) {
		const cy = top + 94 + r * 74
		if (r > 0) rect(w, x + 20, cy - 37, width - 40, u, C.cobalt50)
		circle(w, x + 50, cy, 18, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 80, cy - 5, 150 - (r % 3) * 20, 9, C.cobalt900)
		hex(w, x + 340, cy, 11, [C.cobalt, C.lavender, C.cobalt400][r % 3], 2)
		const checked = r < 3
		rect(w, x + width - 200, cy - 16, 32, 32, checked ? C.mint : C.white, 4 * u, checked ? {} : { stroke: C.cobalt200, 'stroke-width': u })
		// The XP that follows the check-in.
		if (checked) { rect(w, x + width - 150, cy - 16, 80, 32, C.lavender300, 16); bar(w, x + width - 132, cy - 4, 44, 8, C.cobalt900) }
	}
	// The player just checked in: ringed.
	rect(w, x + 12, top + 94 + 2 * 74 - 34, width - 24, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the print run: character sheets in the club's own layout, stacked (offset, never rotated). */
function printUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	rect(w, x, top, width, 640, C.cobalt50, 4 * u)
	const k = 0.82, pw = 480 * k, ph = 620 * k
	;[0, 1, 2].forEach((i) => docPage(w, x + 60 + i * 150, top + 40 + i * 36, pw, ph, { k, values: [118, 96, 72], lastOrange: i === 2, rule: [C.cobalt, C.lavender, C.cobalt][i] }))
}

const content = {
	app: 'larpinq',
	audience: { slug: 'events', name: 'LARP event producers', persona: 'Bram de Vries, operations lead at Grimveld Events, a 400-ticket LARP weekend; the owner or operations lead buys' },
	promise: 'Your event,\nfrom ticket to gate',
	promiseLine: 'Your LARP event from ticket to gate in one place: tickets by role, who paid, check-in with XP, the print run',
	title: 'Larpinq for event producers',
	record: { one: 'player', many: 'players' },
	logline: 'For the company that runs a LARP weekend: tickets priced by role with who has paid, players checked in at the gate with their XP following, and every sheet printed in your own layout. What happens after a payment is a flow you draw.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (paid status across the roles)', '#11 whip-pan on the beat (gate to print run)', '#5 stepped hex wipe (into the flow editor)'],
	neighbours: [],
	builtOnApps: [],
	hook: {
		title: 'Tickets by role, see who paid',
		caption: 'Tickets by role,\nsee who paid',
		ui: { drawUI: ticketUI, tagFill: 'cobalt' },
		source: 'positioning larpinq sp-registration-payment ("Sell tickets by role and see who has paid."; counted as built, Round 7)',
		motion: 'Out of the promise the app cell stays on the loop anchor and the window builds round it; the frame reads: caption, the three ticket roles with their prices, the registrations, the Larpinq hex (cobalt) on the loop anchor. Technique #3, grid-cell ripple: the paid pills step on in waves down the list (20%, 40%, full); one row stays idle and takes the orange ring on beat 4.',
		sound: 'Gentle open. A ripple of soft ticks with the paid pills, a low tick on the unpaid row.',
	},
	proofs: [
		{
			id: 'gate',
			title: 'Checked in? Their XP follows',
			caption: 'Checked in?\nTheir XP follows',
			source: 'positioning larpinq sp-run-events ("Record who actually showed up and let their experience follow from that."); specs event-checkin-roster, event-xp-awards',
			motion: 'Hard cut on the beat to the gate roster. Rows are checked one by one (the box fills mint with a quick scale), and a beat later the lavender XP pill slides out beside each. The third row is the one just checked: its ring closes (the one orange).',
			sound: 'A dry click per check, a pluck as each XP pill arrives.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Checked in?\nTheir XP follows', drawUI: gateUI, tagFill: 'cobalt' }),
		},
		{
			id: 'print',
			title: 'Every sheet printed in your layout',
			caption: 'Every sheet printed\nin your layout',
			source: 'positioning larpinq sp-printing ("Print every character sheet in the layout your club already uses."); spec pdf-export',
			motion: 'Technique #11, whip-pan: a 5-frame move to the right on ease.snap (render --blur 4) from the roster to the print tray. The sheets drop onto the stack one a sixteenth, offset down and right (never rotated), each in the club\'s layout; the top sheet\'s last field fills in orange as it lands.',
			sound: 'A whip on the pan, three soft paper thuds as the sheets land.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every sheet printed\nin your layout', drawUI: printUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'flows',
		title: 'Paid? You decide what happens next',
		caption: 'Paid? You decide\nwhat happens next',
		source: 'story.json mechanic 7 (the customer draws each flow; no flow comes pre-built); COPY.flows F1; positioning larpinq sp-registration-payment (payment status)',
		motion: 'Technique #5, stepped hex wipe: three pointy-top hexes step in from the right edge and cut to the flow editor. The trigger node (a ticket paid) is placed, then the next steps a sixteenth apart, each dropped in by hand; the last settles into its slot. No run is shown, never "pre-built".',
		sound: 'Three clicks with the wipe, a tick as each node is placed, a pluck as the last settles.',
	},
}

export const { meta, boards } = audienceFilm(content)
