/**
 * Hermiq, audience film: regulated organisations (government, banks and insurers, care).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7: specs and
 * positioning count as built. Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 * Hermiq is the agent app. Round 8 bans AI only in government casework films; here the rule is
 * honesty: the agent only does what a person allowed, and every frame shows the permission.
 * No autonomy claims, no accuracy numbers, no model names.
 *
 *   hook     every agent carries its AI Act risk class from the moment it is made
 *            (usp-ai-act-paperwork, verified; specs agent-lifecycle-governance,
 *            ai-feature-governance, algoritmeregister-publication)
 *   proof 1  sensitive data only reaches a model cleared for it
 *            (usp-sensitivity-routing, verified; spec tenant-model-policy)
 *   proof 2  open any run and see each step it took (sp-observability; specs run-audit-log,
 *            run-replay-and-dry-run)
 *   general  the assistant: it asks before it changes anything; the approval card waits
 *            (sp-oversight-baseline; specs human-approval-gate, talk-approval-reactions)
 *   promise  "AI that does only what you allow" (Round 18: AI may be said on screen)
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the risk scale steps in waves until the
 * class settles), #6 hard diagonal wipe (into the routing), #4 typewriter (the run's steps land
 * line by line), #1 dot-grows-to-fill as an upright hex (the step's marker becomes the chat).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping between opacities in waves.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A flat diagonal wipe on the beat between chapters.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Lines typed on under the UI; a mark that grows into the next scene.' },
]

/** Hook: the agents, each with its risk class on a four-step scale; the new agent's class just set. */
function agentsUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	const classes = [1, 0, 2, 1, 2]
	classes.forEach((k, i) => {
		const cy = top + 70 + i * 104
		if (i > 0) rect(w, x + 24, cy - 52, width - 48, u, C.cobalt50)
		hex(w, x + 64, cy, 24, i === 4 ? C.lavender : C.cobalt, 3)
		bar(w, x + 106, cy - 14, 200 - (i % 3) * 30, 13, C.cobalt900)
		bar(w, x + 106, cy + 10, 120, 7, C.cobalt300)
		// The risk scale: four small hexes, the class filled up to its step.
		for (let s = 0; s < 4; s++) hex(w, x + width - 260 + s * 44, cy, 15, s <= k ? (k === 2 ? C.lavender : C.cobalt400) : C.cobalt100, 2)
		idlePill(w, x + width - 70, cy, u, { w: 30 })
	})
	// The agent just made: its class, set on creation, ringed (the one orange).
	const ry = top + 70 + 4 * 104
	rect(w, x + width - 290, ry - 30, 4 * 44 + 16, 60, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: records on the left, models on the right; the sensitive record's wire goes only to the cleared model. */
function routingUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The records: three cards, the middle one marked sensitive (lavender).
	const rw = 330
	;[0, 1, 2].forEach((i) => {
		const ry = top + 40 + i * 180
		panel(w, x, ry, rw, 140, u)
		circle(w, x + 50, ry + 50, 20, i === 1 ? C.lavender300 : C.cobalt200)
		bar(w, x + 84, ry + 38, 180, 12, C.cobalt900)
		bar(w, x + 84, ry + 62, 120, 7, C.cobalt300)
		if (i === 1) { hex(w, x + 44, ry + 104, 12, C.lavender, 2); bar(w, x + 66, ry + 99, 110, 10, C.lavender300) }
	})
	// The models: boxes on the right; only the cleared one (mint, locked) takes the sensitive record.
	const mx = x + width - 300, mw = 300
	;[0, 1, 2].forEach((i) => {
		const my = top + 40 + i * 180
		const cleared = i === 1
		panel(w, mx, my, mw, 140, u, { fill: cleared ? C.white : C.cobalt50 })
		hex(w, mx + 50, my + 70, 24, cleared ? C.mint : C.cobalt200, 3)
		if (cleared) use(w, 'icon-lock', mx + 36, my + 56, 28, 28, C.white)
		bar(w, mx + 90, my + 58, 150, 12, cleared ? C.cobalt900 : C.cobalt300)
		bar(w, mx + 90, my + 80, 90, 7, C.cobalt200)
	})
	// Square-cornered wires: ordinary records may go to any model; the sensitive one only to the cleared one.
	const gx = x + rw, sx = mx
	const midX = gx + (sx - gx) / 2
	;[0, 2].forEach((i) => rect(w, gx, top + 40 + i * 180 + 70 - 1.5 * u, sx - gx, 3 * u, C.cobalt200))
	rect(w, gx, top + 40 + 180 + 70 - 2 * u, sx - gx, 4 * u, C.lavender)
	// The gate on the sensitive wire: an orange hex (the one orange).
	hex(w, midX, top + 40 + 180 + 70, 22, C.orange, 3)
}

/** Proof 2: one run opened: each step it took, in order; the step that waited for approval marked. */
function runUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	bar(w, x + 30, top + 34, 240, 16, C.cobalt900)
	statusPill(w, x + width - 170, top + 42, u)
	// The steps: a spine with one node per step, square corners.
	const sx = x + 70
	rect(w, sx - 1.5 * u, top + 110, 3 * u, 440, C.cobalt200)
	const steps = [[C.cobalt, 260], [C.cobalt, 200], [C.lavender, 240], [C.cobalt, 180], [C.mint, 220]]
	steps.forEach(([f, lw], i) => {
		const cy = top + 110 + i * 110
		hex(w, sx, cy, 16, f, 2)
		bar(w, sx + 40, cy - 14, lw, 12, C.cobalt900)
		bar(w, sx + 40, cy + 8, lw * 0.6, 7, C.cobalt300)
		bar(w, x + width - 150, cy - 5, 90, 9, C.cobalt200)
	})
	// The step that waited for a person: lavender (process), a person's avatar beside it; ringed (the one orange).
	const ay = top + 110 + 2 * 110
	circle(w, x + width - 190, ay, 16, C.cobalt300)
	rect(w, x + 24, ay - 42, width - 48, 84, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'hermiq',
	audience: { slug: 'governance', name: 'Regulated organisations', persona: 'Marleen de Groot, algorithm register coordinator at a municipality; Rutger van Dijk, CISO at a bank; Aisha Boukhari, data protection officer in care' },
	promise: 'AI that does only\nwhat you allow',
	promiseLine: 'Agents that only do what you allow, with every step on the record',
	title: 'Hermiq for regulated organisations',
	record: { one: 'agent', many: 'agents' },
	logline: 'For government, banks, insurers and care: every agent carries its AI Act risk class from the start, sensitive data only reaches a model cleared for it, every run shows each step it took, and the assistant asks before it changes anything. Honest AI: nothing happens that a person did not allow.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the risk scale)', '#6 hard diagonal wipe (into the routing)', '#4 typewriter (the run\'s steps)', '#1 dot-grows-to-fill (as a hex, into the assistant)'],
	neighbours: [],
	builtOnApps: [],
	hook: {
		title: 'Every agent, its risk class',
		caption: 'Every agent,\nits risk class',
		ui: { drawUI: agentsUI, tagFill: 'cobalt' },
		source: 'positioning hermiq usp-ai-act-paperwork, verified ("Every agent gets its risk class the moment it\'s made."); specs agent-lifecycle-governance, ai-feature-governance, algoritmeregister-publication',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the agents with their risk scales, the Hermiq hex (cobalt) on the loop anchor. On beat 2 a new agent row slides in at the foot (ease.brand). Technique #3, grid-cell ripple: its four scale hexes step 20% to 40% to full in two quick waves and settle on its class; the orange ring lands round the scale on beat 5.',
		sound: 'A ripple of ticks with the waves, a pluck as the class settles.',
	},
	proofs: [
		{
			id: 'routing',
			title: 'Sensitive data, cleared models only',
			caption: 'Sensitive data,\ncleared models only',
			source: 'positioning hermiq usp-sensitivity-routing, verified ("Sensitive data only reaches a model cleared to see it."); spec tenant-model-policy (per-organisation model allowlist)',
			motion: 'Technique #6: a flat cobalt-700 diagonal wipe crosses the frame in 0.2 s on the beat. The records land left and the models right; the ordinary wires draw across (stroke reveal). The sensitive record\'s wire draws last in lavender, stops at the orange gate hex, then continues only to the cleared model, whose lock snaps shut.',
			sound: 'A percussive swish on the wipe, a line-draw hiss, a solid click at the lock.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Sensitive data,\ncleared models only', drawUI: routingUI, tagFill: 'cobalt' }),
		},
		{
			id: 'run',
			title: 'See every step an agent took',
			caption: 'See every step\nan agent took',
			source: 'positioning hermiq sp-observability ("Open any run and see each step it took."); specs run-audit-log, run-replay-and-dry-run',
			motion: 'A hex grows from the cleared model (hexCut) into the run view. Technique #4, typewriter: the steps land one per beat down the spine, each line typed on in greeked pairs 0.1 s apart; the third step, the one that waited for a person, holds a beat longer and takes the orange ring.',
			sound: 'Soft key ticks per line, a pluck on the ringed step.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'See every step\nan agent took', drawUI: runUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'ai',
		title: 'It asks before it changes anything',
		caption: 'It asks before it\nchanges anything',
		source: 'COPY.ai A2 ("It asks before it changes anything", sourced to Hermiq\'s approval gates); positioning hermiq sp-oversight-baseline ("Only a risky action waits for a person to approve."); specs human-approval-gate, talk-approval-reactions',
		motion: 'Technique #1: the ringed step\'s lavender marker grows as an upright hex past the frame and lands as the cobalt ground; the chat card drops in with the Hermiq tag and its switches (two on, one off: what it may do). The question pops in, the answer rows land a 16th apart, then the approval card lands and the orange ring round Allow waits. No press: nothing changes until a person approves.',
		params: {
			permission: { toggles: [true, false, true], ask: true },
		},
		sound: 'A whoosh through the hex, a pluck per answer row, silence under the waiting ring.',
	},
}

export const { meta, boards } = audienceFilm(content)
