/**
 * Planninq, audience film: project teams (public-sector project offices first, private
 * project teams folded in). Direction C on the app-film template, wrapped by
 * _lib/audiencefilm.js. Round 7: specs and positioning count as built. Positioning:
 * ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   hook     a blocked task is flagged the moment something upstream is not done
 *            (usp-trustworthy-schedule, verified; specs task-dependencies, kanban-board)
 *   proof 1  a contractor logs in and sees only their project (usp-contractor-portal,
 *            verified; specs portal-contribution, portal-identity)
 *   proof 2  every risk scored, with its countermeasure kept (usp-government-governance,
 *            verified; spec project-delivery)
 *   general  notifications: a task moves and the right person hears (spec task-notifications;
 *            COPY.notify N2)
 *   promise  "Plans the whole team trusts"
 *
 * Techniques (refs/techniques.md): #1 dot-grows-to-fill as an upright hex (from the blocked
 * badge into the contractor's view), #10 cluster-to-container merge (the other projects fall
 * away, one project stays), #3 grid-cell ripple (the risk grid scoring itself).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes and one container: many things, one view.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves.' },
]

/** Hook: the board in lanes; a card blocked by the one upstream of it, joined by a straight line. */
function boardUI(w, geom) {
	const { u } = geom
	const x = geom.x + 64, top = geom.anchor.y - 60, width = geom.r - x
	const lw = (width - 40) / 3
	const lanes = [[170, 200, 150], [190, 160], [210, 170, 150]]
	const cards = []
	lanes.forEach((cs, c) => {
		const lx = x + c * (lw + 20)
		rect(w, lx, top, lw, 560, C.cobalt50, 4 * u)
		bar(w, lx + 20, top + 26, 90, 10, C.cobalt700)
		cs.forEach((cw, i) => {
			const cy = top + 66 + i * 124
			panel(w, lx + 12, cy, lw - 24, 108, u)
			bar(w, lx + 32, cy + 26, Math.min(cw, lw - 80), 10, C.cobalt900)
			bar(w, lx + 32, cy + 48, Math.min(cw, lw - 80) * 0.5, 7, C.cobalt300)
			circle(w, lx + lw - 50, cy + 78, 14, C.cobalt200)
			cards.push({ c, i, lx, cy })
		})
	})
	// Upstream (lane 1, card 2) not done; downstream (lane 3, card 1) blocked: a lavender badge.
	const up = cards.find((k) => k.c === 0 && k.i === 1), dn = cards.find((k) => k.c === 2 && k.i === 0)
	const yA = up.cy + 54, yB = dn.cy + 54, midX = up.lx + lw + 10
	rect(w, up.lx + lw - 12, yA - u, 22, 2 * u, C.lavender)
	rect(w, midX - u, yB, 2 * u, yA - yB, C.lavender)
	rect(w, midX, yB - u, dn.lx + 12 - midX, 2 * u, C.lavender)
	rect(w, dn.lx + 32, dn.cy + 70, 90, 26, C.lavender300, 13)
	hex(w, dn.lx + 46, dn.cy + 83, 7, C.lavender)
	// The blocked card: ringed (the scene's one orange).
	rect(w, dn.lx + 6, dn.cy - 6, lw - 12, 120, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the contractor's view: their one project, its tasks and files; nothing else in sight. */
function contractorUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	// The contractor, signed in (their own login).
	circle(w, x + width - 60, top + 40, 20, C.cobalt300)
	bar(w, x + width - 200, top + 34, 110, 10, C.cobalt700)
	// Their project: header and progress.
	hex(w, x + 104, top + 50, 20, C.cobalt, 2)
	bar(w, x + 140, top + 38, 240, 16, C.cobalt900)
	rect(w, x + 40, top + 110, width - 80, 14, C.cobalt50, 7)
	rect(w, x + 40, top + 110, (width - 80) * 0.58, 14, C.cobalt, 7)
	// This week's tasks for them.
	for (let r = 0; r < 5; r++) {
		const cy = top + 180 + r * 74
		if (r > 0) rect(w, x + 20, cy - 37, width - 40, u, C.cobalt50)
		rect(w, x + 40, cy - 14, 28, 28, r < 2 ? C.mint : C.white, 4 * u, r < 2 ? {} : { stroke: C.cobalt200, 'stroke-width': u })
		bar(w, x + 90, cy - 5, 220 - (r % 3) * 40, 10, C.cobalt900)
		bar(w, x + width - 200, cy - 4, 110, 8, C.cobalt300)
	}
	// Their one project, ringed: the only one they see.
	rect(w, x + 24, top + 20, width - 280, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the risk log: a scored grid (likelihood by impact) and each risk with its countermeasure. */
function riskUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	// The scoring grid, 5 by 5, deeper cobalt as the score rises.
	const gs = 58, gx = x + 64, gy = top + 60
	const shade = [C.cobalt50, C.cobalt100, C.cobalt200, C.cobalt300, C.cobalt400]
	for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) rect(w, gx + c * (gs + 6), gy + r * (gs + 6), gs, gs, shade[Math.min(4, Math.floor((c + (4 - r)) / 2))], 3 * u)
	const dots = [[3, 1], [1, 3], [2, 2], [4, 0]]
	dots.forEach(([c, r]) => circle(w, gx + c * (gs + 6) + gs / 2, gy + r * (gs + 6) + gs / 2, 12, C.white, { stroke: C.cobalt900, 'stroke-width': 1.4 * u }))
	// The risks, each with its countermeasure (a mint pill when in place).
	const lx = gx + 5 * (gs + 6) + 40, lw = x + width - lx - 30
	for (let i = 0; i < 4; i++) {
		const cy = top + 80 + i * 100
		panel(w, lx, cy - 36, lw, 84, u)
		circle(w, lx + 30, cy - 8, 11, C.white, { stroke: C.cobalt900, 'stroke-width': 1.4 * u })
		bar(w, lx + 56, cy - 14, lw * 0.5, 10, C.cobalt900)
		bar(w, lx + 56, cy + 12, lw * 0.4, 7, C.cobalt300)
		if (i !== 2) statusPill(w, lx + lw - 110, cy + 16, u)
	}
	// The highest-scored risk, its cell ringed (the one orange).
	rect(w, gx + 4 * (gs + 6) - 5, gy - 5, gs + 10, gs + 10, 'none', 4 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'planninq',
	audience: { slug: 'projects', name: 'Project teams', persona: 'Sander de Boer, project leader at a municipal project office; Lisanne Mulder, project lead at an engineering consultancy; the programme director or portfolio manager buys' },
	promise: 'Plans the whole\nteam trusts',
	promiseLine: 'Plans the whole team can trust: blockers flagged on day one, contractors in their own lane, every risk scored and answered',
	title: 'Planninq for project teams',
	record: { one: 'task', many: 'tasks' },
	logline: 'For a project office that must be able to account for its plan: a blocked task is flagged the moment something upstream slips, a contractor logs in to see only their project, and every risk carries its score and its countermeasure. When a task moves, the right person hears.',
	references: REFS,
	techniques: ['#1 dot-grows-to-fill as an upright hex (blocked badge to the contractor view)', '#10 cluster-to-container merge (one project stays)', '#3 grid-cell ripple (the risk grid)'],
	neighbours: ['dossiq', 'portaliq'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'Blocked task? Flagged on day one',
		caption: 'Blocked task?\nFlagged on day one',
		ui: { drawUI: boardUI, tagFill: 'cobalt' },
		source: 'positioning planninq usp-trustworthy-schedule (verified): "See a blocked task flagged before it costs you a deadline."; specs task-dependencies, kanban-board',
		motion: 'Out of the promise the app cell stays on the loop anchor and the window builds round it; the frame reads: caption, the board in three lanes, the Planninq hex (cobalt) on the loop anchor. The cards land a sixteenth apart; on beat 3 the dependency line draws from the upstream card to the one waiting on it (straight, right angles, lavender), the blocked badge pops and the card takes the orange ring.',
		sound: 'Gentle open. Ticks as the cards land, a soft draw under the line, a low tick on the badge.',
	},
	proofs: [
		{
			id: 'contractor',
			title: 'Contractors see only their project',
			caption: 'Contractors see\nonly their project',
			source: 'positioning planninq usp-contractor-portal (verified): "Give an outside contractor a login that shows only their project."; specs portal-contribution, portal-identity',
			motion: 'Technique #1 as an upright hex: the blocked badge grows past the frame (ease.snap, one beat) and lands as the contractor\'s view. Technique #10 in reverse: the other projects\' cards scatter out of frame and one project stays, settling into the panel; its ring closes (the one orange). Their tasks drop in a sixteenth apart.',
			sound: 'A whoosh through the hex, soft ticks as the other cards scatter, a pluck as their project settles.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Contractors see\nonly their project', drawUI: contractorUI, tagFill: 'cobalt' }),
		},
		{
			id: 'risks',
			title: 'Every risk, scored and answered',
			caption: 'Every risk,\nscored and answered',
			source: 'positioning planninq usp-government-governance (verified): "Score every project risk and keep the countermeasure with it."; spec project-delivery',
			motion: 'Hard cut on the beat to the risk log. Technique #3, grid-cell ripple: the 5 by 5 grid steps on in a wave from low to high score; the risk dots drop into their cells; the risks on the right land with their countermeasure pills a sixteenth apart. The highest cell takes the orange ring last.',
			sound: 'A ripple of ticks with the grid, a pluck per countermeasure.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every risk,\nscored and answered', drawUI: riskUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Task moved? The right person hears',
		caption: 'Task moved?\nThe right person hears',
		source: 'Planninq spec task-notifications; COPY.notify N2; story.json mechanic 8',
		params: {
			record: { avatar: 'square', title: 230, sub: 150, status: 'idle' },
			event: { stage: 2, stages: 4 },
			notices: [{ app: 'planninq' }, { icon: 'nc-mail' }, { icon: 'nc-calendar' }],
			recipients: [C.cobalt300],
		},
		sound: 'A low tick as the task moves, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
