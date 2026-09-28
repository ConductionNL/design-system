/**
 * Larpinq, audience film: LARP clubs and associations (federations fold in). Direction C on
 * the app-film template, wrapped by _lib/audiencefilm.js. Round 7: specs and positioning
 * count as built. Positioning: ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   hook     open any stat and see which skill, item or condition caused it
 *            (usp-stat-breakdown, verified; specs game-mechanics, larping-skill-widget)
 *   proof 1  every experience (XP) award with who gave it and why (usp-xp-accountability,
 *            verified; spec event-xp-awards)
 *   proof 2  change a rule once and every sheet that uses it follows (usp-rules-engine,
 *            verified; spec rpg-system)
 *   general  notifications: a player submits a sheet and the game masters hear (spec
 *            notifications: a created character notifies the gamemasters group)
 *   promise  "Your whole campaign, in one place"
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (the stat breakdown holds
 * while the caption swaps), #2 zoom-out (from the stat out to the XP history of the whole
 * sheet), #3 grid-cell ripple (every sheet ticking as the rule change reaches it).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, idlePill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds still while only the caption changes; a camera that pulls back as the picture grows.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves.' },
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

/** Proof 2: one rule (the effect) on the left, the sheets that use it on the right, each ticked as it follows. */
function ruleUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const rw = width * 0.36
	panel(w, x, top, rw, 330, u)
	hex(w, x + 44, top + 46, 18, C.lavender, 2)
	bar(w, x + 76, top + 38, 160, 14, C.cobalt900)
	for (let i = 0; i < 3; i++) {
		const cy = top + 120 + i * 60
		bar(w, x + 30, cy - 4, 70, 8, C.cobalt400)
		rect(w, x + 120, cy - 18, rw - 150, 36, C.cobalt50, 3 * u)
		bar(w, x + 134, cy - 4, 60 + i * 30, 8, C.cobalt700)
	}
	// The value just changed: ringed (the one orange).
	rect(w, x + 112, top + 180 - 26, rw - 134, 52, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// Straight line to the sheets, then one sheet per row, each with its tick.
	const gx = x + rw + 60
	rect(w, x + rw, top + 180 - u, 30, 2 * u, C.cobalt300)
	rect(w, x + rw + 30 - u, top + 40, 2 * u, 520, C.cobalt300)
	const cols = 3, rows = 5, cw = (width - rw - 60) / cols
	for (let r = 0; r < rows; r++) {
		if (r < rows) rect(w, x + rw + 30, top + 40 + r * 110 + 40 - u, 30, 2 * u, C.cobalt300)
		for (let c = 0; c < cols; c++) {
			const cx = gx + c * cw, cy = top + 40 + r * 110
			panel(w, cx, cy, cw - 16, 90, u)
			circle(w, cx + 30, cy + 34, 16, C.cobalt200)
			bar(w, cx + 56, cy + 28, cw - 130, 8, C.cobalt700)
			bar(w, cx + 20, cy + 64, cw - 90, 6, C.cobalt100)
			if (r * cols + c !== 13) circle(w, cx + cw - 38, cy + 66, 9, C.mint)
			else idlePill(w, cx + cw - 70, cy + 66, u, { w: 18 })
		}
	}
}

const content = {
	app: 'larpinq',
	audience: { slug: 'clubs', name: 'LARP clubs', persona: 'Anne Verhoeven, chair and game master of Ravensteijn, a 60-member association running two campaigns a year; the club\'s board buys' },
	promise: 'Your campaign,\nall in one place',
	promiseLine: 'Characters, XP and rules that hold up between events, the whole campaign in one place on your club\'s own Nextcloud',
	title: 'Larpinq for clubs',
	record: { one: 'character', many: 'characters' },
	logline: 'For the game master of a LARP club: open any stat and see what caused it, every XP award carries who gave it and why, and a rule changed once reaches every sheet. When a player submits a sheet, the game masters hear.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram (the stat breakdown)', '#2 zoom-out (stat to the XP history)', '#3 grid-cell ripple (sheets following the rule)'],
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
			id: 'rules',
			title: 'One rule change, every sheet follows',
			caption: 'One rule change,\nevery sheet follows',
			source: 'positioning larpinq usp-rules-engine (verified): "Define a skill or item once and reuse it everywhere."; spec rpg-system',
			motion: 'Hard cut on the beat to the rule. The changed value is typed in and its ring closes (the one orange). The straight line runs out and down the spine; technique #3, grid-cell ripple: the sheets on the right step from 20% to full in waves, row by row, each mint tick popping as it follows. One sheet stays open (idle pill): it does not use this rule.',
			sound: 'A dry click on the change, a ripple of ticks down the sheets.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'One rule change,\nevery sheet follows', drawUI: ruleUI, tagFill: 'cobalt' }),
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
