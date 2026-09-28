/**
 * Variant A19: the timing of the modular ConNext film after Ruben's round-6 notes
 * (2026-09-28). Copied from A18 (the round-5 record, left as it was).
 *
 * Four modules, each a whole number of bars at 128 BPM, 24 fps (a bar is 45 frames):
 *
 *   opening   the shared Conduction opening (_lib/scenes/opening.js, addOpening): 3 bars
 *   body      the ConNext one take: 14 bars (s1 grows to 3 bars: the Nextcloud components
 *             load one by one into the grid, each with its line under "Start a lead"; the
 *             assistant gets two captions)
 *   builtOn   the shared "Built on ConNext" piece (_lib/scenes/closing.js): 2 bars
 *   install   the shared install board (_lib/scenes/closing.js): 3 bars
 *
 * Everything after s2 is A18's timing moved two bars later, so every beat still lands
 * where the music has it. G(bar, beat, sixteenth) counts from 1; F(n) is frame n of the
 * module; at(module, t) is film time.
 *
 * Caption hand-over (round 3, unchanged): a caption rises (4 frames) once its ground is
 * settled, holds at least max(1.5 s, 0.4 s x words) once fully up, leaves through its clip
 * before the world moves over it, and the next rises at least 2 clear frames later. The
 * one exception is s1's line under the headline: it is one line whose words change, a
 * masked swap in one clip box (the old words leave upward as the new ones rise, 4 frames),
 * one component per beat; the reading budget for it is in board.js s1 and the storyboard.
 *
 * Round 6: no full stop at the end of any on-screen line.
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
/** The swap of s1's line: the old words leave and the new rise in the same four frames. */
export const SWAP = F(4)

export const MODULES = [
	{ id: 'opening', bars: 3 },
	{ id: 'body', bars: 14 },
	{ id: 'builtOn', bars: 2 },
	{ id: 'install', bars: 3 },
]
export const BARS = MODULES.reduce((a, m) => a + m.bars, 0) // 22
export const DURATION = BARS * BAR // 41.25
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
 * s1: the Nextcloud components load one by one into the grid under the lead, each with a
 * line under "Start a lead" pairing an action with the component. Every pairing is what
 * the common data layer links a record to (round4/facts.json, fact a): a record's mails
 * (EmailProvider), its meetings (CalendarProvider), its contacts (ContactsProvider; the
 * Pipelinq client is provisioned into the address book first, story.json mechanics[2]),
 * its files (FilesProvider), its chats (TalkProvider), its to-dos (TasksProvider, CalDAV)
 * and its Deck cards (DeckProvider). The first gets two beats to set the pattern, then one
 * a beat; the last (Deck, Ruben's own example) holds.
 */
export const LOADS = [
	{ id: 'nc-mail', at: G(1, 2), verb: 'Reply from', name: 'Mail' },
	{ id: 'nc-calendar', at: G(1, 4), verb: 'Plan in', name: 'Calendar' },
	{ id: 'nc-contacts', at: G(2, 1), verb: 'Save to', name: 'Contacts' },
	{ id: 'nc-files', at: G(2, 2), verb: 'Share in', name: 'Files' },
	{ id: 'nc-talk', at: G(2, 3), verb: 'Chat in', name: 'Talk' },
	{ id: 'nc-tasks', at: G(2, 4), verb: 'Follow up in', name: 'Tasks' },
	{ id: 'nc-deck', at: G(3, 1), verb: 'Manage from', name: 'Deck' },
]
/** How long a component's line takes to run from the lead to its cell (it arrives on the load). */
export const LINK_DUR = 0.22

export const T = {
	/* s1 · start a lead: the components load into the grid, one line each */
	// The handover (the opening's last frame is ground and field only, _lib/scenes/opening.js HANDOVER):
	// the body's first frame is that field, the lead pops in on one of its cells, the caption rises, and
	// the camera carries on the opening's slow push, then settles into the s1 framing.
	handIn: [0, 1.2], // the camera: from the handover field to the s1 framing
	fieldBlend: [0, 1.0], // the field's shading: from the opening's (screen distance) to the world's (distance from the lead)
	leadPop: 0,
	key1: 4.8,
	openOut: G(4, 1), // 5.63: "Start a lead" and the last line leave together
	/* s2 · the links draw back into the lead; the story row lands east of it */
	retract: [G(4, 1), G(4, 2)],
	pull: [G(4, 1), G(4, 1) + 0.875],
	land: { '1,0': G(4, 3), '2,0': G(4, 3), '3,0': G(4, 3, 1), '4,0': G(4, 3, 1) },
	wmIn: F(146), // 6.08
	orange: [G(4, 3, 1), G(4, 3, 3)],
	key2: 6.85,
	/* s3 · inside Filinq (A18 + 2 bars) */
	push: [G(4, 3, 3), 7.7],
	s3In: F(177),
	fill: [G(5, 1), G(5, 2), G(5, 3)],
	amountLands: G(5, 4),
	key3: 8.95,
	/* s4 · inside Portaliq */
	hop1: [F(229), G(6, 2, 3)],
	s4In: F(241),
	tap: G(6, 4),
	sig: G(6, 4) + 0.24,
	key4: 11.2,
	/* s5 · flows: the last step drops in fluidly (round 6) */
	flowOut: [F(281), G(7, 3, 2)], // 11.71 to 12.42
	s5In: F(297),
	trig: G(7, 4), // 12.66
	edge1: [G(7, 4, 2), G(8, 1)],
	task: G(8, 1), // 13.13
	lift: G(8, 2), // 13.59: the notify step is picked up...
	slot: G(8, 3), // 14.06: ...its slot shows while it travels...
	drop: G(8, 4), // 14.53: ...and it settles into it: one continuous move, no stall, no snap
	into: [G(8, 4, 2), G(9, 1)],
	keyFlows: 14.25,
	s5Out: F(353), // 14.71
	/* s6 · instant notifications, desktop and mobile (round 6: two beats longer than A18) */
	pushNc: [G(9, 1), G(9, 3)], // 15.0 to 15.94
	s6In: F(377), // 15.71
	badge: G(9, 4), // 16.41: the badge on the bell
	toast: G(10, 1), // 16.88: the desktop notification slides in, bottom left
	phone: G(10, 2), // 17.34: the phone rises into the frame...
	pushMsg: G(10, 3), // 17.81: ...and the push message lands on its lock screen
	key6: 18.6,
	hop3: [F(462), G(11, 3, 2)], // 19.25 to 19.92
	/* s7 · ask the Nextcloud Assistant; it prepares actions and suggestions (round 6) */
	s7aIn: F(481), // 20.04
	rail: [G(11, 4), G(11, 4, 2)], // 20.16, 20.39
	ask: G(12, 1), // 20.63
	answer: G(12, 2), // 21.09
	rows: [G(12, 2, 1), G(12, 2, 2)],
	key7a: 22.0,
	s7aOut: F(543), // 22.63 (3 frames)
	propose: G(13, 1, 3), // 22.85: the prepared action and the suggestion land, waiting for you
	s7bIn: F(549), // 22.88: two clear frames after s7a's 3-frame exit (its line 1 leads by a frame)
	key7b: 24.3,
	s7bOut: F(601), // 25.04
	pullEnd: [F(605), G(15, 1)], // 25.21 to 26.25: pull out; the honeycomb steps off into the closing piece
}

export const BO = CLOSING.builtOn
export const IN = CLOSING.install

const b = (t) => at('body', t)
const bo = (t) => at('builtOn', t)
const ins = (t) => at('install', t)
/** Every caption, film time: fully up, starts to leave, exit length. s1's line: one entry per component. */
export const CAPTIONS = [
	{ id: 's1', module: 'body', text: 'Start a lead', up: b(RISE), out: b(T.openOut), exit: EXIT },
	...LOADS.map((l, i) => ({ id: `s1-${l.name.toLowerCase()}`, module: 'body', text: `${l.verb} ${l.name}`, up: b(l.at + SWAP), out: b(i < LOADS.length - 1 ? LOADS[i + 1].at : T.openOut), exit: i < LOADS.length - 1 ? SWAP : EXIT, swap: i < LOADS.length - 1 })),
	{ id: 's3', module: 'body', text: 'The contract\nfills itself in', up: b(T.s3In + RISE), out: b(T.hop1[0]), exit: EXIT },
	{ id: 's4', module: 'body', text: 'Your client\nsigns', up: b(T.s4In + RISE), out: b(T.flowOut[0]), exit: EXIT },
	{ id: 's5', module: 'body', text: 'Draw what\nhappens next', up: b(T.s5In + RISE), out: b(T.s5Out), exit: EXIT },
	{ id: 's6', module: 'body', text: 'Instant notifications,\ndesktop and mobile', up: b(T.s6In + RISE), out: b(T.hop3[0]), exit: EXIT },
	{ id: 's7a', module: 'body', text: 'Ask Nextcloud Assistant\nabout your data', up: b(T.s7aIn + RISE), out: b(T.s7aOut), exit: EXIT3 },
	{ id: 's7b', module: 'body', text: 'It prepares actions\nand suggestions', up: b(T.s7bIn + RISE), out: b(T.s7bOut), exit: EXIT },
	{ id: 'bo', module: 'builtOn', text: 'Built on', up: bo(BO.typeIn + RISE), out: bo(BO.out), exit: EXIT },
	{ id: 'slogan1', module: 'install', text: 'Install the app', up: ins(IN.slogans[0] + RISE), out: DURATION, exit: 0 },
	{ id: 'slogan2', module: 'install', text: 'Use the app', up: ins(IN.slogans[1] + RISE), out: DURATION, exit: 0 },
	{ id: 'slogan3', module: 'install', text: 'Own your data', up: ins(IN.slogans[2] + RISE), out: DURATION, exit: 0 },
	{ id: 'line', module: 'install', text: 'Always 100% open source and free to use', up: ins(IN.line + RISE), out: DURATION, exit: 0 },
]
export const words = (text) => text.split(/\s+/).filter(Boolean).length
export const budget = (text) => Math.max(1.5, 0.4 * words(text))
