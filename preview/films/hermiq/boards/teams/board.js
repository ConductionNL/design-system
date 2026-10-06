/**
 * Hermiq, audience film: teams at work (mid-size companies running an assistant for their staff).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7: specs and
 * positioning count as built. Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 * Hermiq is the agent app. The honesty rule of this lane: the agent only does what a person
 * allowed, shown on screen (tools granted by switch, the approval card). No autonomy claims.
 *
 *   hook     give an agent exactly the tools it needs, nothing more
 *            (sp-tools; specs agent-tool-governance, agent-capability-profile)
 *   proof 1  the agent runs on its own schedule and posts its output in Talk
 *            (sp-schedules, sp-channels; specs agent-schedule, talk-delivery)
 *   proof 2  a skill is tested against cases, with and without it, before you trust it
 *            (usp-skills-that-prove-themselves, verified; specs agent-evals, skill-maturity)
 *   general  the assistant: ask about your records, it asks first (COPY.ai A1 + A2;
 *            spec human-approval-gate)
 *   promise  asked as a question (Round 19): "What if AI followed your rules?" (was "AI within your rules")
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (the tool list holds, only the
 * switches flip), #1 dot-grows-to-fill as an upright hex (the schedule slot becomes the Talk
 * message), #3 grid-cell ripple (the test cases light in waves as they run).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { textBlock } from '../../../_lib/stage.js'
import { rect, bar, circle, hex, panel, toggle, bubble, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only one element changes.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves, read as processing.' },
]

/** Hook: the agent's tools, each with a switch; only the ones it needs are on. */
function toolsUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	bar(w, x + 30, top + 34, 220, 16, C.cobalt900)
	const on = [true, false, true, false, false, true]
	on.forEach((v, i) => {
		const cy = top + 110 + i * 80
		if (i > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		rect(w, x + 44, cy - 18, 36, 36, v ? C.cobalt : C.cobalt100, 4 * u)
		bar(w, x + 100, cy - 12, 200 - (i % 3) * 30, 12, v ? C.cobalt900 : C.cobalt300)
		bar(w, x + 100, cy + 10, 130, 7, C.cobalt200)
		toggle(w, x + width - 110, cy, u, v)
	})
	// The switch just turned on: the one orange, as a ring.
	const ry = top + 110 + 5 * 80
	rect(w, x + width - 124, ry - 26, 22 * u + 28, 52, 'none', 26, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the agent's schedule on the left, its output posted in a Talk room on the right. */
function scheduleUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The schedule: a week grid with the agent's runs.
	const sw = 400
	panel(w, x, top, sw, 560, u)
	bar(w, x + 30, top + 34, 160, 14, C.cobalt900)
	for (let d = 0; d < 5; d++) {
		const dx = x + 30 + d * 70
		bar(w, dx + 12, top + 80, 36, 8, C.cobalt300)
		for (let h = 0; h < 5; h++) rect(w, dx, top + 110 + h * 84, 60, 70, h === 1 ? C.lavender300 : C.cobalt50, 3 * u)
	}
	// Today's run: ringed (the one orange).
	rect(w, x + 30 + 2 * 70 - 6, top + 110 + 84 - 6, 72, 82, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The Talk room: Nextcloud's own app in Nextcloud blue, the agent's post on top.
	const tx = x + sw + 24, tw = width - sw - 24
	panel(w, tx, top, tw, 560, u)
	rect(w, tx, top, tw, 70, C.nextcloud, 0)
	use(w, 'nc-talk', tx + 24, top + 15, 40, 40, C.white)
	textBlock(w, 'Talk', { x: tx + 78, y: top + 47, size: 32, weight: 600, fill: C.white, clip: false })
	bubble(w, tx + 24, top + 100, tw - 90, 190, u, { side: 'agent' })
	hex(w, tx + 60, top + 136, 18, C.cobalt, 2)
	bar(w, tx + 90, top + 128, 120, 10, C.cobalt900)
	for (let l = 0; l < 4; l++) bar(w, tx + 48, top + 172 + l * 24, (tw - 150) * [0.9, 0.75, 0.85, 0.5][l], 8, C.cobalt300)
	bubble(w, tx + tw - 24 - 200, top + 320, 200, 60, u, { side: 'user' })
	bar(w, tx + tw - 200, top + 346, 140, 8, C.cobalt700)
}

/** Proof 2: the test cases, run with and without the skill; the verdict row. */
function evalUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	bar(w, x + 30, top + 34, 220, 16, C.cobalt900)
	// Two columns of case cells: without the skill, with the skill (pass mint, fail cobalt-400).
	const cols = [['without', 'MFMMFFMMFM'], ['with', 'MMMMMFMMMM']]
	cols.forEach(([, res], c) => {
		const cx = x + 40 + c * ((width - 80) / 2)
		bar(w, cx, top + 90, 90, 9, C.cobalt400)
		for (let i = 0; i < res.length; i++) {
			const r = Math.floor(i / 5), k = i % 5
			rect(w, cx + k * 78, top + 120 + r * 78, 64, 64, res[i] === 'M' ? C.mint : C.cobalt400, 4 * u)
		}
		// The score bar under each column.
		const f = res.split('').filter((v) => v === 'M').length / res.length
		rect(w, cx, top + 300, (width - 80) / 2 - 40, 22, C.cobalt50, 11)
		rect(w, cx, top + 300, ((width - 80) / 2 - 40) * f, 22, c ? C.mint : C.cobalt300, 11)
	})
	// The verdict: the skill earns its place. Ringed (the one orange).
	const vy = top + 380
	rect(w, x + 30, vy, width - 60, 80, C.cobalt50, 4 * u)
	hex(w, x + 74, vy + 40, 18, C.mint, 2)
	bar(w, x + 110, vy + 30, 260, 16, C.cobalt900)
	rect(w, x + 24, vy - 6, width - 48, 92, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'hermiq',
	audience: { slug: 'teams', name: 'Teams at work', persona: 'Bas Mulder, IT director of a professional-services company, and the staff who use the assistant' },
	promise: 'What if AI followed\nyour rules?',
	promiseLine: 'Agents your team can use every day, that only do what you allow',
	title: 'Hermiq for teams',
	record: { one: 'agent', many: 'agents' },
	logline: 'For a company that wants an assistant its staff can use: switch on only the tools an agent needs, let it run on its own schedule and post in Talk, test a skill on cases before you trust it, and ask about your records while it asks before it changes anything. Honest AI: it only does what you allow.',
	references: REFS,
	// Round 27c: the section title each scene's small mark shows (not the app name).
	sections: {'promise': 'Team assistant', 'hook': 'Tools', 'schedule': 'Schedules', 'tested': 'Testing', 'general-ai': 'Assistant'},
	// Round 26: the designed hand-offs into each body board (preview/films/_lib/transitions.js).
	transitions: {
		hook: { type: 'grow', fromName: 'the orange Hermiq cell', toName: 'the tool list', note: 'the app cell opens into the agent\'s tools (#1)' },
		schedule: { type: 'match', fromName: 'the switch just turned on', toName: 'today\'s run', note: 'the tool switched on is what runs today: the orange carries from the switch to the slot' },
		tested: { type: 'zoom', fromName: 'the posted report', toName: 'the test cases', note: 'we push into the agent\'s skill and come out on the cases it is tested on: same agent, closer' },
		'general-ai': { type: 'hexWipe', fromName: 'the test scores', toName: 'the assistant chat', note: 'a chapter change from setting up the agent to asking it, a stepped wipe on the beat (#5)' },
	},
	techniques: ['#9 text-swap on a held diagram (the switches)', '#1 dot-grows-to-fill (as a hex, schedule slot into Talk)', '#3 grid-cell ripple (the test cases)'],
	neighbours: [],
	builtOnApps: [],
	hook: {
		title: 'Only the tools it needs',
		caption: 'Only the tools\nit needs',
		ui: { drawUI: toolsUI, tagFill: 'cobalt' },
		source: 'positioning hermiq sp-tools ("Grant an agent exactly the tools it needs, nothing more."); specs agent-tool-governance, agent-capability-profile',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the agent\'s tool list, the Hermiq hex (cobalt) on the loop anchor. Technique #9, text-swap on a held diagram: the list holds still; switches flip one per beat (two on, one left off), and on beat 5 the last needed tool turns on and takes the orange ring. Nothing else moves.',
		sound: 'A dry switch click per flip, a pluck on the ringed one.',
	},
	proofs: [
		{
			id: 'schedule',
			title: 'Scheduled reports, posted to your chat',
			caption: 'Scheduled reports,\nposted to your chat',
			source: 'positioning hermiq sp-schedules ("Give an agent its own schedule, down to the minute.") and sp-channels ("Send an agent\'s output straight to email or chat."); specs agent-schedule, talk-delivery ("Deliver run output to Nextcloud Talk")',
			motion: 'A hex grows from the ringed switch (hexCut) into the week. The runs fill their slots (lavender) a sixteenth apart; today\'s slot takes the orange ring. Technique #1: that slot grows as an upright hex across to the Talk room and shrinks into the agent\'s post, which types on (greeked lines). Round 18: the caption says "your chat" in plain words; the Talk header is Nextcloud blue and carries the small label "Talk".',
			sound: 'Ticks as the slots fill, a whoosh through the hex, a soft pop as the post lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Scheduled reports,\nposted to your chat', drawUI: scheduleUI, tagFill: 'cobalt' }),
		},
		{
			id: 'tested',
			title: 'Tested on real cases, then trusted',
			caption: 'Tested on real cases,\nthen trusted',
			source: 'positioning hermiq usp-skills-that-prove-themselves, verified ("See a skill tested against real cases before you trust it."; "it runs against test cases with and without it first"); specs agent-evals, skill-maturity',
			motion: 'Technique #3, grid-cell ripple: the cases in both columns step from 20% to full in waves, left column first (without the skill), then right (with it); the score bars grow as the waves pass. On the last beat the verdict row lands and takes the orange ring.',
			sound: 'Two ripples of ticks, a pluck as the verdict lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Tested on real cases,\nthen trusted', drawUI: evalUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'ai',
		title: 'Ask about your data, it asks first',
		caption: 'Ask about your data,\nit asks first',
		source: 'COPY.ai A1 ("Ask about {many}. Get the answer.") and A2 ("It asks before it changes anything", sourced to Hermiq\'s approval gates); spec human-approval-gate',
		params: {
			permission: { toggles: [true, false, true], ask: true },
		},
		sound: 'A pluck per answer row, silence under the waiting ring.',
	},
}

export const { meta, boards } = audienceFilm(content)
