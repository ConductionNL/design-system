/**
 * Variant A17: the timing of the modular ConNext film (Ruben, round 4, 2026-09-27).
 *
 * The film is four modules, each a whole number of bars at 128 BPM, 24 fps
 * (a bar is exactly 45 frames, a beat 11.25, a sixteenth 2.8125):
 *
 *   opening   the shared Conduction opening (another agent builds it; its length is
 *             a placeholder here until that module lands: OPENING_BARS)
 *   body      the ConNext one take, revised: the round-3 take up to the signature, then
 *             the flows beat, the bell, and the reworked assistant (two captions)
 *   builtOn   the shared "Built on ConNext" closing piece (_lib/scenes/closing.js)
 *   install   the shared install board (_lib/scenes/closing.js)
 *
 * Times inside a module are module-relative: G(bar, beat, sixteenth) counts bars and
 * beats from 1 as the storyboard writes them ("6.3" is G(6, 3)); F(n) is frame n of
 * the module. at(module, t) turns a module time into film time. The storyboard prose
 * (board.js) and the film both read these numbers.
 *
 * Caption timing follows the director's handover rules from round 3: a caption rises
 * (4 frames) once the ground behind it is settled, holds at least
 * max(1.5 s, 0.4 s x words) from the frame it is fully up, and leaves through its
 * clip (4 frames, 3 where a hand-off is tight) before the world moves over it; the
 * next one rises at least 2 clear frames later.
 */
export const BPM = 128
export const FPS = 24
export const SPB = 60 / BPM
export const BAR = 4 * SPB
export const G = (bar, beat = 1, s16 = 0) => ((bar - 1) * 4 + (beat - 1)) * SPB + (s16 * SPB) / 4
export const F = (n) => n / FPS
export const RISE = F(4)
export const EXIT = F(4)
export const EXIT3 = F(3)

/** Module lengths in bars. The opening's is a placeholder until the shared opening lands. */
export const MODULES = [
	{ id: 'opening', bars: 2, placeholder: true },
	{ id: 'body', bars: 12 },
	{ id: 'builtOn', bars: 2 },
	{ id: 'install', bars: 3 },
]
export const BARS = MODULES.reduce((a, m) => a + m.bars, 0) // 19
export const DURATION = BARS * BAR // 35.625
/** Film time at which each module starts. */
export const START = (() => {
	const o = {}
	let b = 0
	for (const m of MODULES) { o[m.id] = b * BAR; b += m.bars }
	return o
})()
export const LEN = Object.fromEntries(MODULES.map((m) => [m.id, m.bars * BAR]))
/** A module time as film time. */
export const at = (module, t) => START[module] + t

/* ------------------------------------------------------------------ body */

export const T = {
	/* b1 · close on your client */
	openOut: F(48), // 2.00
	/* b2 · the ring settles, the brand */
	pull: [F(48), 2.75],
	land: {
		'0,-1': G(2, 2), // Files, from the top
		'1,-1': G(2, 2, 1), // Mail, from the right
		'1,0': G(2, 2, 2), // Calendar, from the right
		'-1,0': G(2, 2, 3), // Talk, from the top
		'-1,1': G(2, 3), // Filinq, from below
		'0,1': G(2, 3), // Portaliq, from below
		'1,1': G(2, 3, 1), // Nextcloud, along the story row from the right
		'2,1': G(2, 3, 1), // Hermiq, leading it
	},
	wmIn: F(59),
	orange: [G(2, 3, 1), G(2, 3, 3)],
	key2: 3.1,
	/* b3 · inside Filinq */
	push: [G(2, 3, 3), 3.95],
	s3In: F(87),
	fill: [G(3, 1), G(3, 2), G(3, 3)],
	amountLands: G(3, 4),
	key3: 5.2,
	/* b4 · inside Portaliq */
	hop1: [F(139), G(4, 2, 3)], // 5.79 to 6.45
	s4In: F(151),
	tap: G(4, 4), // 7.03
	sig: G(4, 4) + 0.24, // 7.27
	key4: 7.45,
	/* b5 · FLOWS: you draw what happens next (new in round 4) */
	flowOut: [F(191), G(5, 3, 2)], // 7.96 to 8.67: pull straight up out of Portaliq to the flow lane under the story row
	s5In: F(207), // 8.63: once the cobalt ground is back behind the column
	trig: G(5, 4), // 8.91: the trigger lands under Filinq (the signing is complete)
	edge1: [G(5, 4, 2), G(6, 1)], // its edge draws to the next slot
	task: G(6, 1), // 9.38: the task for the right person lands
	lift: G(6, 2), // 9.84: the notify step is picked up and carried toward the Nextcloud hex
	slot: G(6, 3), // 10.31: its dashed slot shows (the one orange: you place it)
	drop: G(6, 4), // 10.78: it drops into the slot, the dashed edge turns solid
	into: [G(6, 4, 2), G(7, 1)], // the edge climbs into the Nextcloud hex
	keyFlows: 10.5,
	s5Out: F(263), // 10.96
	/* b6 · inside Nextcloud: the right person hears about it */
	pushNc: [G(7, 1), G(7, 3)], // 11.25 to 12.19: push into the Nextcloud hex along the edge that just reached it
	s6In: F(287), // 11.96: once the blue fills the column
	badge: G(7, 4), // 12.66
	notice: G(8, 1), // 13.13
	key6: 13.6,
	hop3: [F(349), G(9, 1, 2)], // 14.54 to 15.23: hop east into the assistant
	/* b7 · the assistant: what the apps hand it, you ask, it asks */
	s7In: F(362), // 15.08
	rail: [G(9, 2), G(9, 2, 2)], // 15.47, 15.70: Pipelinq, then Filinq, land in the rail with their records and actions
	ask: G(9, 3), // 15.94: your question
	answer: G(9, 4), // 16.41: the answer grows, rows a sixteenth apart
	rows: [G(9, 4, 1), G(9, 4, 2), G(9, 4, 3)],
	key7: 16.8,
	propose: G(10, 1), // 16.88: the change it wants to make, waiting for you; the action it would use lights in the rail
	s7Out: F(434), // 18.08 (3 frames)
	s7bIn: F(439), // 18.29
	key7b: 19.3,
	allow: G(11, 3), // 19.69: you allow it
	done: G(11, 4), // 20.16: the change lands, its pip turns mint
	s7bOut: F(501), // 20.88
	pullEnd: [F(505), G(13, 1)], // 21.04 to 22.50: the camera pulls out of the assistant to the honeycomb: the hand-over to the closing piece
}

/* ------------------------------------------------------------ built on ConNext */

export const BO = {
	nextcloud: G(1, 1), // Nextcloud lands first, at 1.4x, settling in 0.2 s: the ground
	layer: G(1, 2), // the data layer drops onto it
	typeIn: F(8), // "Built on" rises, the wordmark a sixteenth behind
	ring: [G(1, 3), G(1, 3, 1), G(1, 3, 2), G(1, 3, 3), G(1, 4), G(1, 4, 1)], // the six nearest apps, one a sixteenth
	tasks: G(1, 4, 2),
	more: [G(1, 4, 3), G(2, 1), G(2, 1, 1), G(2, 1, 2)], // the quieter outer cells: there are more
	top: G(2, 2), // the film's app (or the story's apps) lands on top
	key: 3.1,
}

/* ------------------------------------------------------------------ install */

export const IN = {
	call: F(3), // the call rises, line 2 a sixteenth behind
	line1: G(1, 3), // "100% open source. Free to use."
	line2: G(2, 1), // "Pay for an SLA when your company grows."
	key: 4.6,
}

/** Every caption, film time: when it is fully up, when it starts to leave, how long the exit takes. */
const b = (t) => at('body', t)
const bo = (t) => at('builtOn', t)
const ins = (t) => at('install', t)
export const CAPTIONS = [
	{ id: 's1', module: 'body', text: 'Open a client\nin Nextcloud.', up: b(0), out: b(T.openOut), exit: EXIT },
	{ id: 's3', module: 'body', text: 'The contract\nfills itself in.', up: b(T.s3In + RISE), out: b(T.hop1[0]), exit: EXIT },
	{ id: 's4', module: 'body', text: 'Your client\nsigns.', up: b(T.s4In + RISE), out: b(T.flowOut[0]), exit: EXIT },
	{ id: 's5', module: 'body', text: 'You draw what\nhappens next.', up: b(T.s5In + RISE), out: b(T.s5Out), exit: EXIT },
	{ id: 's6', module: 'body', text: 'The right person\nhears about it.', up: b(T.s6In + RISE), out: b(T.hop3[0]), exit: EXIT },
	{ id: 's7', module: 'body', text: 'Ask. It answers\nand acts for you.', up: b(T.s7In + RISE), out: b(T.s7Out), exit: EXIT3 },
	{ id: 's7b', module: 'body', text: 'It only does\nwhat you allow.', up: b(T.s7bIn + RISE), out: b(T.s7bOut), exit: EXIT },
	{ id: 'bo', module: 'builtOn', text: 'Built on', up: bo(BO.typeIn + RISE), out: bo(LEN.builtOn), exit: 0 },
	{ id: 'call', module: 'install', text: 'Install from the\nNextcloud app store', up: ins(IN.call + RISE), out: DURATION, exit: 0 },
	{ id: 'line1', module: 'install', text: '100% open source. Free to use.', up: ins(IN.line1 + RISE), out: DURATION, exit: 0 },
	{ id: 'line2', module: 'install', text: 'Pay for an SLA when your company grows.', up: ins(IN.line2 + RISE), out: DURATION, exit: 0 },
]
export const words = (text) => text.split(/\s+/).filter(Boolean).length
export const budget = (text) => Math.max(1.5, 0.4 * words(text))
