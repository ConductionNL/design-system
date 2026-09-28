/**
 * Variant A18: the timing of the modular ConNext film (Ruben, round 5, 2026-09-28).
 * Copied from A17, which stays as the round-4 record.
 *
 * Four modules, each a whole number of bars at 128 BPM, 24 fps (a bar is exactly
 * 45 frames, a beat 11.25, a sixteenth 2.8125):
 *
 *   opening   the shared Conduction opening (_lib/scenes/opening.js, addOpening): 3 bars
 *   body      the ConNext one take: a lead and the line diagram to its Nextcloud apps,
 *             the ring, the contract, the signature, the flow you draw, the bell (in an
 *             app window), the assistant (one caption): 11 bars
 *   builtOn   the shared "Built on ConNext" piece (_lib/scenes/closing.js): 2 bars
 *   install   the shared install board, as slogans (_lib/scenes/closing.js): 3 bars
 *
 * Times inside a module are module-relative: G(bar, beat, sixteenth) counts bars and
 * beats from 1 as the storyboard writes them; F(n) is frame n of the module. at(module, t)
 * turns a module time into film time. The storyboard (board.js) and the film read these.
 *
 * Caption hand-over (round 3, unchanged): a caption rises (4 frames) once the ground behind
 * it is settled, holds at least max(1.5 s, 0.4 s x words) from the frame it is fully up, and
 * leaves through its clip (4 frames, 3 where a hand-off is tight) before the world moves over
 * it; the next one rises at least 2 clear frames later.
 */
import { CLOSING } from '../../../_lib/scenes/closing.js'

export const BPM = 128
export const FPS = 24
export const SPB = 60 / BPM
export const BAR = 4 * SPB
export const S16 = SPB / 4
export const G = (bar, beat = 1, s16 = 0) => ((bar - 1) * 4 + (beat - 1)) * SPB + (s16 * SPB) / 4
export const F = (n) => n / FPS
export const RISE = F(4)
export const EXIT = F(4)
export const EXIT3 = F(3)

/** Module lengths in bars. The opening is the real shared module now (3 bars). */
export const MODULES = [
	{ id: 'opening', bars: 3 },
	{ id: 'body', bars: 11 },
	{ id: 'builtOn', bars: 2 },
	{ id: 'install', bars: 3 },
]
export const BARS = MODULES.reduce((a, m) => a + m.bars, 0) // 19
export const DURATION = BARS * BAR // 35.625
export const START = (() => {
	const o = {}
	let b = 0
	for (const m of MODULES) { o[m.id] = b * BAR; b += m.bars }
	return o
})()
export const LEN = Object.fromEntries(MODULES.map((m) => [m.id, m.bars * BAR]))
export const at = (module, t) => START[module] + t

/* ------------------------------------------------------------------ body */

/**
 * The line diagram under the lead (s1): the order the Nextcloud apps sit in along the
 * bottom, left to right, which is also the order of their ring slots from left to right,
 * so no two cross when they fly up into the ring (s2). Pops go centre out.
 */
export const DIAGRAM = ['nc-contacts', 'nc-talk', 'nc-files', 'nc-mail', 'nc-calendar', 'nc-deck', 'nc-tasks']

export const T = {
	/* s1 · start a lead: the line diagram draws down to its Nextcloud apps */
	leadPop: 0, // the lead cell settles from 0.85 as the body cuts in
	trunk: [G(1, 1, 2), G(1, 2)], // 0.23 to 0.47: the line drops from the lead
	bus: [G(1, 2), G(1, 2, 2)], // 0.47 to 0.70: it spreads both ways along the bottom
	drops: { 'nc-mail': G(1, 2, 2), 'nc-files': G(1, 2, 3), 'nc-calendar': G(1, 2, 3), 'nc-talk': G(1, 3), 'nc-deck': G(1, 3), 'nc-contacts': G(1, 3, 1), 'nc-tasks': G(1, 3, 1) },
	key1: 1.6,
	openOut: G(2, 1), // 1.88: "Start a lead." leaves (it was up from the cut: 1.88 s for 1.5 needed)
	/* s2 · the Nextcloud apps fly up into the ring round the lead; the story row lands */
	fly: { 'nc-mail': G(2, 1), 'nc-files': G(2, 1, 1), 'nc-calendar': G(2, 1, 1), 'nc-talk': G(2, 1, 2), 'nc-deck': G(2, 1, 2), 'nc-contacts': G(2, 1, 3), 'nc-tasks': G(2, 1, 3) },
	flyDur: 0.42,
	retract: [G(2, 1), G(2, 2, 2)], // the lines draw back into the lead as their apps leave
	pull: [G(2, 1), 2.75], // the camera eases back from the diagram to the ring's framing
	land: { '-1,1': G(2, 3), '0,1': G(2, 3), '1,1': G(2, 3, 1), '2,1': G(2, 3, 1) }, // the story row, as round 3
	wmIn: F(59), // 2.46: the ConNext wordmark rises
	orange: [G(2, 3, 1), G(2, 3, 3)],
	key2: 3.1,
	/* s3 · inside Filinq (round 3) */
	push: [G(2, 3, 3), 3.95],
	s3In: F(87),
	fill: [G(3, 1), G(3, 2), G(3, 3)],
	amountLands: G(3, 4),
	key3: 5.2,
	/* s4 · inside Portaliq (round 3) */
	hop1: [F(139), G(4, 2, 3)],
	s4In: F(151),
	tap: G(4, 4),
	sig: G(4, 4) + 0.24,
	key4: 7.45,
	/* s5 · flows (round 4) */
	flowOut: [F(191), G(5, 3, 2)],
	s5In: F(207),
	trig: G(5, 4),
	edge1: [G(5, 4, 2), G(6, 1)],
	task: G(6, 1),
	lift: G(6, 2),
	slot: G(6, 3),
	drop: G(6, 4),
	into: [G(6, 4, 2), G(7, 1)],
	keyFlows: 10.5,
	s5Out: F(263),
	/* s6 · the bell, in an app window (round 5) */
	pushNc: [G(7, 1), G(7, 3)],
	s6In: F(287),
	badge: G(7, 4),
	notice: G(8, 1),
	key6: 13.6,
	hop3: [F(349), G(9, 1, 2)],
	/* s7 · the assistant: picture first, then its one caption with the change waiting */
	rail: [G(9, 2), G(9, 2, 2)],
	ask: G(9, 3),
	answer: G(9, 4),
	rows: [G(9, 4, 1), G(9, 4, 2)],
	propose: G(10, 1), // 16.88: the change lands, waiting; the caption rises with it
	s7In: F(405), // 16.88
	key7: 17.6,
	allow: G(10, 4), // 18.28: you allow it
	done: G(11, 1), // 18.75: it lands, its pip mint, a new row in Pipelinq's records
	s7Out: F(467), // 19.46
	pullEnd: [F(471), G(12, 1)], // 19.63 to 20.63: pull out of the assistant, the hand-over to the closing piece
}

/* ------------------------------------------- the closing pieces (their own timing) */

/** Built on ConNext and the install board keep their beats in the shared module, so every film agrees. */
export const BO = CLOSING.builtOn
export const IN = CLOSING.install

const b = (t) => at('body', t)
const bo = (t) => at('builtOn', t)
const ins = (t) => at('install', t)
/** Every caption, film time: fully up, starts to leave, exit length. */
export const CAPTIONS = [
	{ id: 's1', module: 'body', text: 'Start a lead.', up: b(0), out: b(T.openOut), exit: EXIT },
	{ id: 's3', module: 'body', text: 'The contract\nfills itself in.', up: b(T.s3In + RISE), out: b(T.hop1[0]), exit: EXIT },
	{ id: 's4', module: 'body', text: 'Your client\nsigns.', up: b(T.s4In + RISE), out: b(T.flowOut[0]), exit: EXIT },
	{ id: 's5', module: 'body', text: 'Draw what\nhappens next.', up: b(T.s5In + RISE), out: b(T.s5Out), exit: EXIT },
	{ id: 's6', module: 'body', text: 'The right person\nhears about it.', up: b(T.s6In + RISE), out: b(T.hop3[0]), exit: EXIT },
	{ id: 's7', module: 'body', text: 'It only does\nwhat you allow.', up: b(T.s7In + RISE), out: b(T.s7Out), exit: EXIT },
	{ id: 'bo', module: 'builtOn', text: 'Built on', up: bo(BO.typeIn + RISE), out: bo(BO.out), exit: EXIT },
	{ id: 'slogan1', module: 'install', text: 'Install the app.', up: ins(IN.slogans[0] + RISE), out: DURATION, exit: 0 },
	{ id: 'slogan2', module: 'install', text: 'Use the app.', up: ins(IN.slogans[1] + RISE), out: DURATION, exit: 0 },
	{ id: 'slogan3', module: 'install', text: 'Own your data.', up: ins(IN.slogans[2] + RISE), out: DURATION, exit: 0 },
	{ id: 'line', module: 'install', text: 'Always 100% open source and free to use.', up: ins(IN.line + RISE), out: DURATION, exit: 0 },
]
export const words = (text) => text.split(/\s+/).filter(Boolean).length
export const budget = (text) => Math.max(1.5, 0.4 * words(text))
