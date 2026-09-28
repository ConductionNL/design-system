/**
 * Larpinq, audience film: LARP organisers, clubs and commercial event producers in one film
 * (Round 17, Ruben, 2026-09-28: fold the event producers into the clubs film and keep the
 * strongest three proofs across both). Direction C on the app-film template, wrapped by
 * _lib/audiencefilm.js; promise first (Round 15). Positioning:
 * ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   promise  "Your campaign, all in one place"
 *   hook     campaign continuity: open any stat and see which skill, item or condition caused
 *            it (usp-stat-breakdown, verified; specs game-mechanics, larping-skill-widget)
 *   proof 1  every experience (XP) award with who gave it and why (usp-xp-accountability,
 *            verified; spec event-xp-awards)
 *   proof 2  tickets to gate: paid by role, checked in at the gate, XP follows
 *            (sp-registration-payment, sp-run-events; specs event-checkin-roster,
 *            event-xp-awards)
 *   general  notifications: a player submits a sheet and the game masters hear (spec
 *            notifications: a created character notifies the gamemasters group)
 *
 * Dropped in the merge: the rules engine (clubs), the print run and the flow slot (events).
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (the stat breakdown holds
 * while the caption swaps), #2 zoom-out (from the stat out to the XP history), #11 whip-pan on
 * the beat (from the XP history to the gate roster).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds still while only the caption changes; a camera that pulls back as the picture grows.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A fast whip between held shots, on the beat.' },
]

/** Hook: the character sheet's stat, and the breakdown of what caused it (straight lines, right angles). */
function statUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	// The character head: portrait, name, class.
	circle(w, x + 90, top + 70, 34, C.cobalt300)
	bar(w, x + 140, top + 52, 220, 16, C.cobalt900)
	bar(w, x + 140, top + 80, 130, 8, C.cobalt300)
	// Stats down the left; the opened one is ringed (the scene's one orange).
	const sx = x + 40
	for (let i = 0; i < 5; i++) {
		const cy = top + 170 + i * 80
		rect(w, sx, cy - 30, 210, 60, i === 1 ? C.cobalt50 : C.white, 4 * u, { stroke: C.cobalt100, 'stroke-width': u })
		bar(w, sx + 20, cy - 5, 90, 9, C.cobalt400)
		rect(w, sx + 150, cy - 18, 42, 36, C.cobalt100, 3 * u)
		bar(w, sx + 160, cy - 4, 22, 9, C.cobalt900)
	}
	rect(w, sx - 8, top + 250 - 38, 226, 76, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The breakdown: a trunk from the stat, one branch per cause: a skill (lavender hex),
	// an item (cobalt square), a condition (cobalt ring), each with its plus or minus.
	const tx = sx + 260, cyS = top + 250
	rect(w, sx + 218, cyS - u, 42, 2 * u, C.cobalt300)
	const rows = [top + 170, top + 250, top + 330]
	rect(w, tx - u, rows[0], 2 * u, rows[2] - rows[0], C.cobalt300)
	rows.forEach((ry, i) => {
		rect(w, tx, ry - u, 40, 2 * u, C.cobalt300)
		const bx = tx + 40
		panel(w, bx, ry - 30, width - (bx - x) - 30, 60, u)
		if (i === 0) hex(w, bx + 32, ry, 14, C.lavender, 2)
		if (i === 1) rect(w, bx + 20, ry - 12, 24, 24, C.cobalt, 3 * u)
		if (i === 2) circle(w, bx + 32, ry, 12, 'none', { stroke: C.cobalt, 'stroke-width': 1.6 * u })
		bar(w, bx + 64, ry - 5, 150 - i * 30, 9, C.cobalt700)
		rect(w, x + width - 110, ry - 14, 56, 28, i === 2 ? C.cobalt100 : C.mint300, 14)
	})
}

/** Proof 1: the XP history: who awarded it, how much, and the reason on every row. */
function xpUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 610, u)
	;[x + 30, x + 200, x + 320].forEach((hx) => bar(w, hx, top + 30, 80, 8, C.cobalt400))
	for (let r = 0; r < 7; r++) {
		const cy = top + 94 + r * 74
		if (r > 0) rect(w, x + 20, cy - 37, width - 40, u, C.cobalt50)
		circle(w, x + 50, cy, 18, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 78, cy - 5, 90, 9, C.cobalt700)
		rect(w, x + 200, cy - 16, 76, 32, C.lavender300, 16)
		bar(w, x + 218, cy - 4, 40, 8, C.cobalt900)
		bar(w, x + 320, cy - 5, 220 + ((r * 67) % 200), 9, C.cobalt200)
	}
	// The newest award, with its reason: ringed.
	rect(w, x + 12, top + 94 - 34, width - 24, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the gate roster: each player's ticket paid, checked in at the gate, and the XP that follows. */
function gateUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 610, u)
	;[x + 30, x + 300, x + width - 330, x + width - 200].forEach((hx) => bar(w, hx, top + 30, 70, 8, C.cobalt400))
	for (let r = 0; r < 7; r++) {
		const cy = top + 94 + r * 74
		if (r > 0) rect(w, x + 20, cy - 37, width - 40, u, C.cobalt50)
		circle(w, x + 50, cy, 18, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 80, cy - 5, 150 - (r % 3) * 20, 9, C.cobalt900)
		// The ticket's role.
		hex(w, x + 310, cy, 11, [C.cobalt, C.lavender, C.cobalt400][r % 3], 2)
		bar(w, x + 332, cy - 4, 60, 8, C.cobalt300)
		// Paid.
		statusPill(w, x + width - 330, cy, u)
		// Checked in at the gate, and the XP that follows.
		const checked = r < 3
		rect(w, x + width - 200, cy - 16, 32, 32, checked ? C.mint : C.white, 4 * u, checked ? {} : { stroke: C.cobalt200, 'stroke-width': u })
		if (checked) { rect(w, x + width - 150, cy - 16, 80, 32, C.lavender300, 16); bar(w, x + width - 132, cy - 4, 44, 8, C.cobalt900) }
	}
	// The player just checked in: ringed (the scene's one orange).
	rect(w, x + 12, top + 94 + 2 * 74 - 34, width - 24, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'larpinq',
	audience: { slug: 'clubs', name: 'LARP clubs and event producers', persona: 'Anne Verhoeven, chair and game master of Ravensteijn, a 60-member association; Bram de Vries, operations lead at Grimveld Events, a 400-ticket weekend; the club board or the event owner buys' },
	promise: 'Your campaign,\nall in one place',
	promiseLine: 'Your whole campaign in one place, from the character sheet to the gate: every stat explained, every XP award with its reason, tickets and check-in on the same record',
	title: 'Larpinq for clubs and event producers',
	record: { one: 'character', many: 'characters' },
	logline: 'For whoever runs a LARP, a club or an event company: open any stat and see what caused it, every XP award carries who gave it and why, and a player who paid and checked in at the gate gets their XP. When a player submits a sheet, the game masters hear.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram (the stat breakdown)', '#2 zoom-out (stat to the XP history)', '#11 whip-pan on the beat (XP history to the gate)'],
	neighbours: [],
	builtOnApps: [],
	hook: {
		title: 'Every stat shows its cause',
		caption: 'Every stat\nshows its cause',
		ui: { drawUI: statUI, tagFill: 'cobalt' },
		source: 'positioning larpinq usp-stat-breakdown (verified): "Open any stat and see which skill, item or condition caused it."; specs game-mechanics, larping-skill-widget',
		motion: 'Out of the promise the app cell stays on the loop anchor and the window builds round it; the frame reads: caption, the character sheet with its stats, the Larpinq hex (cobalt) on the loop anchor. On beat 2 the second stat is opened: its ring closes (the one orange) and the trunk line draws out at right angles to three causes, a skill, an item and a condition, each landing a sixteenth apart with its plus or minus. Technique #9: the diagram then holds still while the caption alone swaps in; nothing else moves for a beat.',
		sound: 'Gentle open. A pluck as the stat opens, three ticks as the causes land, then quiet under the hold.',
	},
	proofs: [
		{
			id: 'xp',
			title: 'Every XP award with its reason',
			caption: 'Every XP award\nwith its reason',
			source: 'positioning larpinq usp-xp-accountability (verified): "See every experience award with its reason attached."; spec event-xp-awards',
			motion: 'Technique #2, zoom-out: the camera pulls back from the stat (ease.brand) and the sheet slides into the XP history of the character. The award rows drop in from the top, a sixteenth apart; the newest (who gave it, how much, the reason) takes the orange ring as it lands.',
			sound: 'A long soft whoosh on the pull-back, a tick per award row, a pluck on the newest.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every XP award\nwith its reason', drawUI: xpUI, tagFill: 'cobalt' }),
		},
		{
			id: 'gate',
			title: 'Paid, checked in, XP follows',
			caption: 'Paid, checked in,\nXP follows',
			source: 'positioning larpinq sp-registration-payment ("Sell tickets by role and see who has paid.") and sp-run-events ("Record who actually showed up and let their experience follow from that."); specs event-checkin-roster, event-xp-awards',
			motion: 'Technique #11, whip-pan: a 5-frame move to the right on ease.snap (render --blur 4) from the XP history to the gate roster. Every row already carries its ticket role and a mint paid pill; rows are checked one by one (the box fills mint with a quick scale) and a beat later the lavender XP pill slides out beside each. The third row, just checked, takes the orange ring.',
			sound: 'A whip on the pan, a dry click per check, a pluck as each XP pill arrives.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Paid, checked in,\nXP follows', drawUI: gateUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Sheet submitted? Game masters hear',
		caption: 'Sheet submitted?\nGame masters hear',
		source: 'Larpinq spec notifications ("notify the gamemasters group on character submission", trigger created); story.json mechanic 8 (the right person hears)',
		params: {
			record: { avatar: 'person', title: 230, sub: 150, status: 'idle' },
			event: { stage: 1, stages: 3 },
			notices: [{ app: 'larpinq' }, { icon: 'nc-mail' }],
			recipients: [C.cobalt300, C.lavender300],
		},
		sound: 'A low tick as the sheet is submitted, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
