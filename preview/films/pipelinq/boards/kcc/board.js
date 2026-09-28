/**
 * Pipelinq, audience film: municipal contact centres (KCC). Direction C on the
 * app-film template, wrapped in the shared modules by _lib/audiencefilm.js.
 *
 * Round 7 (Ruben, 2026-09-28): release film for the future; features in the positioning
 * matrix count as built. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     one citizen, one timeline (sp-360-timeline)
 *   proof 1  every ID lookup logged and pseudonymised (usp-citizen-data-lawful)
 *   proof 2  the callback deadline skips the public holiday (usp-legal-deadlines)
 *   general  the assistant sorts incoming mail into the right request, and asks first
 *            (usp-mail-triage; platform assistant-asks-first)
 *   promise  "Answer on the first call"
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (hook),
 * #4 typewriter (proof 1, the ID typed then masked), #1 dot-grows-to-fill match cut as an
 * upright hex (proof 2 into the assistant).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together and merge into one container.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Typed characters, and a dot that grows to fill the frame as the cut.' },
]

/** A timeline entry: a channel pip on the rail, a line of text, a trailing pill. */
function entry(w, x, cy, lw, u, { pip = C.cobalt300, icon = null, pill = 'idle' } = {}) {
	hex(w, x + 30, cy, 22, pip, 3)
	if (icon) use(w, icon, x + 17, cy - 13, 26, 26, C.white)
	bar(w, x + 74, cy - 12, lw, 10, C.cobalt900)
	bar(w, x + 74, cy + 8, lw * 0.5, 7, C.cobalt300)
	if (pill === 'mint') statusPill(w, x + 700, cy, u)
	else idlePill(w, x + 710, cy, u)
}

/** Hook: the citizen page, every contact on one timeline. */
function timelineUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The citizen: avatar, name, the masked ID, status.
	panel(w, x, top, width, 150, u)
	circle(w, x + 70, top + 75, 40, C.cobalt300)
	bar(w, x + 130, top + 50, 260, 18, C.cobalt900)
	for (let i = 0; i < 9; i++) circle(w, x + 138 + i * 18, top + 100, 5, C.cobalt300)
	statusPill(w, x + width - 150, top + 75, u)
	// The timeline: a call, a mail, a request, a complaint, a callback.
	const ty = top + 180
	panel(w, x, ty, width, 12 + 5 * 92 + 12, u)
	rect(w, x + 58, ty + 40, 3 * u, 5 * 92 - 60, C.cobalt100)
	const rows = [
		{ lw: 240, icon: 'icon-contacts', pill: 'mint' },
		{ lw: 200, icon: 'nc-mail' },
		{ lw: 280, pip: C.lavender, pill: 'mint' },
		{ lw: 220, icon: 'nc-talk' },
		{ lw: 180, icon: 'nc-calendar' },
	]
	rows.forEach((r, i) => entry(w, x + 28, ty + 58 + i * 92, r.lw, u, r))
}

/** Proof 1: the lookup, typed then masked, and the log row it writes. */
function lookupUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 250, u)
	bar(w, x + 40, top + 44, 150, 10, C.cobalt400)
	// The ID field: three digits still typed, the rest already masked (typewriter, then mask).
	rect(w, x + 40, top + 76, 520, 80, C.white, 4 * u, { stroke: C.cobalt300, 'stroke-width': u })
	for (let i = 0; i < 3; i++) rect(w, x + 66 + i * 34, top + 98, 20, 36, C.cobalt900, 3)
	for (let i = 3; i < 9; i++) circle(w, x + 76 + i * 34, top + 116, 8, C.cobalt400)
	rect(w, x + 66 + 9 * 34, top + 94, 3 * u, 44, C.cobalt)
	rect(w, x + width - 230, top + 84, 190, 64, C.cobalt, 4 * u)
	bar(w, x + width - 180, top + 112, 90, 9, C.white)
	bar(w, x + 40, top + 196, 300, 8, C.cobalt200)
	// The lookup log: the new row on top with the scene's one orange, who and when.
	const ly = top + 280
	panel(w, x, ly, width, 12 + 4 * 84 + 12, u)
	;[{ w: 250, pip: C.orange }, { w: 210 }, { w: 270 }, { w: 190 }].forEach((r, i) => {
		const cy = ly + 54 + i * 84
		if (i > 0) rect(w, x + 24, cy - 42, width - 48, u, C.cobalt50)
		circle(w, x + 60, cy, 18, i % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 96, cy - 12, r.w, 10, C.cobalt900)
		for (let k = 0; k < 6; k++) circle(w, x + 102 + k * 14, cy + 12, 4, C.cobalt300)
		bar(w, x + width - 170, cy - 4, 110, 8, C.cobalt200)
		if (r.pip) hex(w, x + width - 40, cy, 11, r.pip, 2)
	})
}

/** Proof 2: two working weeks; the callback's deadline hops over the public holiday. */
function deadlineUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The promised callback.
	panel(w, x, top, width, 130, u)
	bar(w, x + 90, top + 44, 280, 16, C.cobalt900)
	bar(w, x + 90, top + 76, 180, 9, C.cobalt300)
	idlePill(w, x + width - 150, top + 65, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	// Ten working days, weekends dimmed, the holiday hatched; the deadline marker on the day after it.
	const cy0 = top + 170, cw = (width - 60) / 7, ch = 170
	panel(w, x, cy0, width, 2 * ch + 90, u)
	for (let d = 0; d < 7; d++) bar(w, x + 30 + d * cw + 14, cy0 + 26, 40, 8, C.cobalt300)
	for (let r = 0; r < 2; r++) {
		for (let d = 0; d < 7; d++) {
			const cx = x + 30 + d * cw, cy = cy0 + 60 + r * ch
			const weekend = d >= 5
			const holiday = r === 1 && d === 0
			const due = r === 1 && d === 1
			rect(w, cx + 4, cy, cw - 8, ch - 12, weekend ? C.cobalt50 : C.white, 3 * u, { stroke: C.cobalt100, 'stroke-width': u })
			bar(w, cx + 16, cy + 14, 22, 8, weekend ? C.cobalt200 : C.cobalt400)
			if (holiday) {
				rect(w, cx + 4, cy, cw - 8, ch - 12, C.cobalt50, 3 * u)
				for (let k = 0; k < 3; k++) rect(w, cx + 18, cy + 40 + k * 14, cw - 44, 5, C.cobalt200, 2)
			}
			if (due) {
				rect(w, cx + 4, cy, cw - 8, ch - 12, 'none', 3 * u, { stroke: C.orange, 'stroke-width': 3 * u })
				hex(w, cx + cw / 2, cy + 100, 22, C.orange, 3)
			}
		}
	}
	// Where the deadline would have fallen: a faint outline on the holiday, an arrow of steps to the new day.
	const hx = x + 30 + cw / 2, hy = cy0 + 60 + ch + 100
	hex(w, hx, hy, 22, 'none', 3, { stroke: C.cobalt300, 'stroke-width': 2 * u, 'stroke-dasharray': '6 6' })
	rect(w, hx + 28, hy - 2, cw - 56, 4, C.cobalt300)
}

const content = {
	app: 'pipelinq',
	audience: { slug: 'kcc', name: 'Municipal contact centres', persona: 'Sanne de Wit, KCC officer; the head of the contact centre buys' },
	promise: 'Answer on\nthe first call',
	promiseLine: 'Answer the citizen on the first call, and prove every lookup was lawful',
	title: 'Pipelinq for contact centres',
	record: { one: 'citizen', many: 'citizens' },
	logline: 'For the municipal contact centre: one citizen on one timeline, every ID lookup logged and masked, a callback deadline that skips the holiday, and mail sorted before anyone opens it.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge', '#4 typewriter', '#1 dot-grows-to-fill (as a hex)'],
	neighbours: ['portaliq', 'dossiq'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'One citizen, one timeline',
		caption: 'One citizen,\none timeline',
		ui: { drawUI: timelineUI },
		source: 'positioning pipelinq sp-360-timeline: "See every past contact with a client in one timeline."',
		motion: 'Technique #10, cluster-to-container merge. Frame 1 already reads: caption set, the timeline in the window, the Pipelinq hex (orange) on the loop anchor. Over the first two beats five loose shapes (a phone, a mail, a request, a chat, a date: small hexes scattered over the window at seeded positions) each tween into their row on the timeline (ease.brand), arriving within one beat, the rail drawing down behind them. Then a slow push in on the citizen header (1.00 to 1.06). Out on 2.3: the masked ID dots are the hand-off into proof 1.',
		sound: 'Gentle open: pad and offbeat bass only. Five soft ticks as the shapes land in their rows.',
	},
	proofs: [
		{
			id: 'lookup',
			title: 'Every ID lookup logged and masked',
			caption: 'Every ID lookup\nlogged and masked',
			source: 'positioning pipelinq usp-citizen-data-lawful: "Every BSN lookup gets logged and pseudonymised." (confidence verified)',
			motion: 'Technique #4, typewriter. Hex match cut from the header\'s masked ID into the lookup field. The ID types itself one digit per frame pair (0.08 s apart, hard on and off), and the moment the lookup runs each digit after the third flips to a dot, left to right, one per frame. On the next beat a new row pushes in on top of the lookup log with the orange pip: who looked, and when. The caption rises as the typing starts.',
			sound: 'Tiny key ticks under the typing (synth clicks, not a bell), a soft thud as the log row lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every ID lookup\nlogged and masked', drawUI: lookupUI, tagFill: 'cobalt' }),
		},
		{
			id: 'deadline',
			title: 'The callback date skips the holiday',
			caption: 'The callback date\nskips the holiday',
			source: 'positioning pipelinq usp-legal-deadlines: "Deadlines skip Dutch public holidays automatically." (confidence verified)',
			motion: 'Push down from the log to the promised callback. Its deadline marker lands on the hatched public holiday (dashed outline), holds a beat, then steps one day right on the beat (ease.snap) into the next working day, which takes the orange edge. Out on the last beat: technique #1 as an upright hex, the orange marker grows to fill the frame (hexCut, ease.snap) and its fill becomes the assistant scene\'s ground.',
			sound: 'A pluck as the marker lands on the holiday, a lower pluck as it steps off, a whoosh through the hex fill.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'The callback date\nskips the holiday', drawUI: deadlineUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'ai',
		title: 'Mail sorted before you open it',
		caption: 'Mail sorted\nbefore you open it',
		source: 'positioning pipelinq usp-mail-triage ("Incoming mail sorts itself into the right request.", verified), platform usp assistant-asks-first',
		params: {
			question: { w: 360, lines: [0.84, 0.6] },
			answer: { rows: [{ avatar: 'hex', w: 210, trail: 'mint' }, { avatar: 'hex', w: 170, trail: 'idle' }, { avatar: 'person', w: 190, trail: 'idle' }] },
			permission: { ask: true },
		},
		sound: 'A soft pop as the mail arrives, three ticks as it is sorted, a dry click as the approval card lands and waits.',
	},
}

export const { meta, boards } = audienceFilm(content)
