/**
 * Dossiq, audience film: municipal casework (municipalities and the social domain).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7: matrix
 * features count as built. Research: ds-connext-film-review/apps/dossiq/research.json;
 * positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     every case with its legal deadline counting down (usp-deadlines-real)
 *   proof 1  a deadline near its end escalates itself to the manager (usp-deadlines-real)
 *   proof 2  a handler is away and the named stand-in sees their cases (usp-stand-in)
 *   general  the assistant reads the case, proposes the next step, asks first (usp-assistant)
 *   promise  "Every case on time"
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (hook to proof 1),
 * #5 stepped hex wipe (into the stand-in), #11 whip-pan on the beat (into the assistant).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The list holds while the caption swaps.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'A stepped wipe of flat shapes between chapters.' },
]

/** A term track: how much of the legal term is used, with the escalation mark two steps before the end. */
function term(w, x, cy, width, p, u, { near = false } = {}) {
	const h = 6 * u
	rect(w, x, cy - h / 2, width, h, C.cobalt100, h / 2)
	rect(w, x, cy - h / 2, width * p, h, near ? C.orange : C.cobalt400, h / 2)
	rect(w, x + width * 0.8, cy - h, u, 2 * h, C.cobalt700)
}

/** The case list: case type hex, title, handler, term used. */
function caseList(w, geom, { near = 2, rows = 6, dim = false } = {}) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 50, width = geom.r - geom.x
	panel(w, x, top, width, 12 + rows * 80 + 12, u)
	const data = [{ w: 200, p: 0.35 }, { w: 170, p: 0.55 }, { w: 230, p: 0.86 }, { w: 190, p: 0.2 }, { w: 160, p: 0.62 }, { w: 210, p: 0.44 }]
	data.slice(0, rows).forEach((r, i) => {
		const cy = geom.anchor.y + i * 80
		if (i > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		hex(w, x + 76, cy, 22, i === near ? C.lavender : C.cobalt300, 3)
		bar(w, x + 116, cy - 12, r.w, 10, C.cobalt900)
		bar(w, x + 116, cy + 8, r.w * 0.5, 7, C.cobalt300)
		circle(w, x + 420, cy, 16, i % 2 ? C.cobalt200 : C.cobalt300)
		term(w, x + 470, cy, 300, r.p, u, { near: !dim && i === near })
	})
}

/** Hook: every case, every deadline. */
function casesUI(w, geom) { caseList(w, geom) }

/** Proof 1: the case near its end, and the escalation landing with the manager. */
function escalateUI(w, geom) {
	const { u } = geom
	caseList(w, geom, { rows: 3 })
	const x = geom.x, width = geom.r - geom.x
	// A square-cornered line from the near row down to the manager's card.
	const y0 = geom.anchor.y + 2 * 80 + 30, my = y0 + 190
	rect(w, x + 470 + 300 * 0.86 - 1.5 * u, y0, 3 * u, 110, C.cobalt300)
	rect(w, x + 200, y0 + 110 - 1.5 * u, 470 + 300 * 0.86 - 200, 3 * u, C.cobalt300)
	rect(w, x + 200 - 1.5 * u, y0 + 110, 3 * u, my - y0 - 110, C.cobalt300)
	// The manager's card: avatar, the escalated case, a waiting pill.
	panel(w, x, my, width, 170, u)
	circle(w, x + 80, my + 85, 36, C.cobalt300)
	hex(w, x + 104, my + 110, 14, C.lavender, 2)
	bar(w, x + 140, my + 58, 240, 16, C.cobalt900)
	bar(w, x + 140, my + 92, 170, 9, C.cobalt300)
	idlePill(w, x + width - 150, my + 85, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
}

/** Proof 2: My work, covering for an away colleague: the stand-in badge, their cases already listed. */
function standInUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The colleague who is away, and the badge that says you work on their behalf (orange ring).
	panel(w, x, top, width, 150, u)
	circle(w, x + 80, top + 75, 38, C.cobalt300)
	circle(w, x + 130, top + 100, 26, C.cobalt200, { stroke: C.white, 'stroke-width': 6 })
	bar(w, x + 180, top + 52, 220, 16, C.cobalt900)
	rect(w, x + 180, top + 84, 210, 36, C.lavender300, 18)
	bar(w, x + 200, top + 98, 150, 8, C.cobalt900)
	rect(w, x + 172, top + 76, 226, 52, 'none', 26, { stroke: C.orange, 'stroke-width': 2.5 * u })
	idlePill(w, x + width - 150, top + 75, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	// Their cases, already on your list.
	const ly = top + 180
	panel(w, x, ly, width, 12 + 4 * 80 + 12, u)
	;[210, 170, 240, 190].forEach((lw, i) => {
		const cy = ly + 52 + i * 80
		if (i > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		hex(w, x + 70, cy, 20, C.cobalt300, 3)
		bar(w, x + 108, cy - 12, lw, 10, C.cobalt900)
		bar(w, x + 108, cy + 8, lw * 0.5, 7, C.cobalt300)
		circle(w, x + width - 200, cy, 14, C.cobalt200)
		if (i === 0) statusPill(w, x + width - 160, cy, u)
		else idlePill(w, x + width - 150, cy, u)
	})
}

const content = {
	app: 'dossiq',
	audience: { slug: 'casework', name: 'Municipal casework', persona: 'Mireille Hendriks, case handler; Femke van Dijk, social-domain consultant; the manager of public services buys' },
	promise: 'Every case\non time',
	promiseLine: 'Every case decided on time, even when its handler is away',
	title: 'Dossiq for municipal casework',
	record: { one: 'case', many: 'cases' },
	logline: 'For municipal and social-domain casework: every case with its legal deadline, a case that escalates itself before the term breaks, a stand-in who already sees an away colleague\'s cases, and an assistant that proposes the next step and asks first.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram', '#5 stepped hex wipe', '#11 whip-pan on the beat'],
	neighbours: ['portaliq', 'filinq'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'Every case, every deadline',
		caption: 'Every case,\nevery deadline',
		ui: { drawUI: casesUI, tagFill: 'cobalt' },
		source: 'positioning dossiq usp-deadlines-real: "A legal deadline never quietly falls on a public holiday." (verified)',
		motion: 'Frame 1 reads: caption, the case list in the window, the Dossiq hex (cobalt: the one orange is the case near its term) on the loop anchor. The term tracks fill left to right one frame apart; the third case\'s track fills past the escalation mark and turns orange. Slow push in (1.00 to 1.05). The list is the held diagram for technique #9.',
		sound: 'Gentle open: pad and offbeat bass only. A soft tick per track; a low pluck as the third turns.',
	},
	proofs: [
		{
			id: 'escalate',
			title: 'Deadline near, it escalates itself',
			caption: 'Deadline near?\nIt escalates itself',
			source: 'research.json dossiq usp-deadlines-real and proof moment "the case escalates itself to a manager two steps before the term ends"',
			motion: 'Technique #9: no cut. The list holds; only the caption swaps in its clip box (4 frames). The rows under the third fold away (ease.exit), and from its orange track a square-cornered line runs down (90-degree corners, no dots, 0.3 s) to the manager\'s card, which drops in as the line arrives, the case\'s lavender hex pinned to it. Out on the last beat: technique #5, four upright hexes step in from the right edge 70 ms apart and cut at full cover.',
			sound: 'A line-draw hiss, a tick as the manager\'s card lands, four dry clicks on the wipe steps.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Deadline near?\nIt escalates itself', drawUI: escalateUI, tagFill: 'cobalt' }),
		},
		{
			id: 'stand-in',
			title: 'Away? Your stand-in takes over',
			caption: 'Away? Your stand-in\ntakes over',
			source: 'positioning dossiq usp-stand-in: "Name a stand-in who sees your cases while you\'re away." (verified); every action logged as done on their behalf',
			motion: 'The wipe lands on My work. The away colleague\'s avatar tucks in under yours, the on-behalf badge slides out beside it and the orange ring steps out once; their four cases drop into your list a sixteenth apart, the first already moving (mint). Out on the last beat: technique #11, a 5-frame whip-pan right (ease.snap, --blur 4) into the assistant.',
			sound: 'A soft whoosh as the badge slides, four ticks as the cases land, a short whoosh on the whip.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Away? Your stand-in\ntakes over', drawUI: standInUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'ai',
		caption: 'It asks before\nit changes anything',
		source: 'positioning dossiq usp-assistant: "An assistant proposes the next step and waits for your yes." (verified); story.json mechanic 12',
		params: {
			question: { w: 330, lines: [0.8, 0.46] },
			answer: { rows: [{ avatar: 'hex', w: 220, trail: 'mint' }, { avatar: 'hex', w: 170, trail: 'idle' }, { avatar: 'person', w: 190, trail: 'idle' }] },
			permission: { ask: true },
		},
		sound: 'A soft pop on the question, ticks as the answer rows land, a dry click as the approval card waits.',
	},
}

export const { meta, boards } = audienceFilm(content)
