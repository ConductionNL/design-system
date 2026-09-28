/**
 * The Conduction opening, storyboard A: "Conduction".
 *
 * Six key frames of the sting that opens every Conduction film (Ruben, round
 * 4, 2026-09-27: a ripple to the hex with all the app icons, a second ripple
 * that turns them away, the company name, and the sound of electricity
 * connecting). Every frame is drawn by the opening's own builder
 * (../../../_lib/scenes/opening.js) at its key time, so an approved still is
 * the frame the animation passes through.
 *
 *   board.html?film=opening&v=A   (board i sits at t = i + 0.5; 16:9, 1920 x 1080)
 *
 * Times below are opening-local seconds; bars and beats count from 1.
 */
import { C } from '../../../_lib/brand.js'
import { buildOpening, OPENING, G } from '../../../_lib/scenes/opening.js'

const { T } = OPENING
const s = (t) => t.toFixed(2)
const SPB = 60 / OPENING.bpm
const bb = (t) => { const b = Math.floor(t / SPB + 1e-6); return `${Math.floor(b / 4) + 1}.${(b % 4) + 1}` }
const span = (a, b) => `${bb(a)}-${bb(b - 1e-4)}`

export const meta = {
	id: 'A',
	format: '16x9',
	fps: OPENING.fps,
	bpm: OPENING.bpm,
	bars: OPENING.bars,
	duration: OPENING.duration,
	timing: `${OPENING.duration} s = ${OPENING.bars} bars at ${OPENING.bpm} BPM, ${OPENING.fps} fps (135 frames, 45 per bar). Big moments on bars (the heart on 2.1, the name on 3.1), the turn on the sixteenths from the "and" of 2.3.`,
	words: 1,
	title: 'Conduction',
	logline: 'A calm honeycomb holds 20 apps, asleep. A current runs in from the edges of the frame, lighting every cell it passes, and reaches the apps ring by ring until their heart turns orange on the downbeat. A second ripple runs out and turns every app over; the backs of the tiles carry the Conduction avatar and name, which power on, whole and white, on the next downbeat and hold for 1.5 s; then the tiles turn back and leave the plain field for the film to build on.',
	layer: 'brand',
	references: [
		{ name: 'ConNext film (preview/films/connext/)', url: 'preview/films/connext/scenes/world.js', borrow: 'The house cell vocabulary: ghost cells in cobalt-600, white app hexes with cobalt glyphs, one orange active cell, stepped state changes on whole frames, and cells stepping off in sequence before the mark holds.' },
		{ name: 'Conduction background (preview/conduction-bg.html)', url: 'preview/conduction-bg.html', borrow: 'The honeycomb field that breathes: depth from opacity, never rotation; a few cells drifting a tone lighter on slow cycles.' },
		{ name: 'Canonical lockup (preview/print/business-cards.html, banner.html)', url: 'preview/print/business-cards.html', borrow: 'The avatar flush left of the wordmark on one line, wordmark 1/1.92 of the avatar height, gap 0.295 of it: the end frame is that lockup, centred.' },
		{ name: 'Split-flap departure boards', url: '', borrow: 'A message revealed by tiles turning over in reading order; here the tiles are honeycomb cells and the turn is a width scaling to nothing and back.' },
	],
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
}

const at = (key) => (ctx) => {
	const update = buildOpening(ctx.g, { defs: ctx.defs })
	return () => update(key)
}

export const boards = [
	{
		id: 'o1',
		title: 'The canvas, and the apps asleep',
		start: 0,
		end: 0.4,
		key: 0,
		bars: span(0, 0.47),
		words: '',
		motion: 'Frame 1 is a composed frame, no fade in: a honeycomb of solid cobalt-600 cells on the cobalt ground, receding cell by cell toward the edges of the frame (opacity per cell, never a gradient), a fifth of them drifting a tone lighter on 11 to 18 s cycles. In the middle, the cluster of 20 apps (Buildiq is out of the films: it moves to Nextcloud), asleep: the two rings round the heart (rows of 3, 4, 5, 4 and 3) plus one cell at the right end of the middle row, where the name will be written; their real glyphs embossed in pale cobalt on dark cells, OpenRegister at the heart. The camera frames the cluster\'s centre of mass. The camera is already pushing in (zoom 0.62, accelerating toward 0.70 on the bar 2 downbeat).',
		sound: 'Silence opening into a mains hum (49 Hz and its harmonics) behind a closed filter: nothing on frame 1, no stinger.',
		apps: Object.values(OPENING.cluster),
		layer: 'brand',
		borrow: 'Conduction background: the field that breathes. ConNext film: the ghost cell.',
		draw: at(0),
	},
	{
		id: 'o2',
		title: 'The current runs in',
		start: 0.2,
		end: 1.5,
		key: 1.25,
		bars: span(0.2, 1.5),
		words: '',
		motion: 'From 0.2 s a current enters at the left edge and runs toward the heart: a front shaped like an ellipse with the heart at its focus (it touches the left of the frame first, wraps round and closes in), turning into a circle as it reaches the cluster. It is slow at the edges and accelerates inward. Every cell it passes charges on a whole frame: white for one frame, then cobalt-100, 200, 300 and 400 back down to the ghost over nine frames, so the front has a sharp edge and a decaying tail. Each cell dips to 0.9 and springs back with a small overshoot as it charges, and squashes a touch in the two frames before, while a white arc jumps the gap into it (a jagged line, re-drawn every frame, now and then with a branch). The fronts are circles, not hex rings: rings of pointy-top cells would outline a flat-top hexagon.',
		sound: 'A crackle along the front: every cell it charges fires a few seeded impulses (a click and a short ring, 1.2 to 7.5 kHz) at that cell\'s place in the stereo field, so the crackle starts on the left, spreads right and closes on the centre, growing denser and louder. The hum rises with the charge, its filter opening from 140 to 760 Hz; a capacitor whine rises under it from 0.9 s.',
		apps: [],
		layer: 'brand',
		borrow: 'ConNext film: the ripple on through a pale step, cells changing state on whole frames.',
		draw: at(1.25),
	},
	{
		id: 'o3',
		title: 'The apps light, ring by ring',
		start: 1.5,
		end: T.connect,
		key: 1.72,
		bars: span(1.5, T.connect),
		words: '',
		motion: `Near the cluster the front moves one ring per sixteenth, the speed the second ripple will leave at. The right end of the middle row lights first (${s(G(1, 4, 1))}), then the second ring (${s(G(1, 4, 2))}), then the first (${s(G(1, 4, 3))}), the cells of a ring a few frames apart (0 to 2, seeded), as if lit by hand: each app cell turns into a white hex with its cobalt glyph as the front arrives, dipping to 0.88 and springing to about 1.05. The heart is the last cell still dark; it squashes as the arcs close in on it.`,
		sound: 'An arc and a dry click per ring (no pitched ticks: no melody, nothing tonal). The crackle is at its densest; the whine peaks.',
		apps: Object.values(OPENING.cluster),
		layer: 'brand',
		borrow: 'ConNext film: apps landing on the sixteenths.',
		draw: at(1.72),
	},
	{
		id: 'o4',
		title: 'The heart connects: the network is live',
		start: T.connect,
		end: T.turn,
		key: 2.36,
		bars: span(T.connect, T.turn),
		words: '',
		motion: `On the bar 2 downbeat (${s(T.connect)}) the current reaches the heart and OpenRegister turns orange with a white glyph: the one orange, the cell every app keeps its records in. It springs from 0.84 to about 1.1 and settles; a small shock runs out through the lit cluster, one frame per ring, and the camera recoils 1.4% and springs home. Then the network holds for a bar and a half so all 20 glyphs can be read: sparks leak across the cluster's edge every few frames, three at once on each of two heartbeats (${s(T.pulse[0])}, ${s(T.pulse[1])}), when the cells swell 3% outward from the heart. The camera drifts in from 0.70 to 0.73.`,
		sound: 'On the downbeat the whine stops dead: a big arc falling from 7 kHz and a low thud on G, the hum jumping to full and bright (filter 2.2 kHz) and settling. Two short, dry heartbeat thuds that duck the hum; a small crackle per leaking spark.',
		apps: Object.values(OPENING.cluster),
		layer: 'brand',
		borrow: 'ConNext film: one orange active cell. Firecrawl (via the ConNext board): one orange cell in a grid of stepping cells.',
		draw: at(2.36),
	},
	{
		id: 'o5',
		title: 'A second ripple turns the apps away',
		start: T.turn,
		end: T.powerOn,
		key: 3.58,
		bars: span(T.turn, T.powerOn),
		words: 'Conduction (arriving)',
		motion: `The heart gathers (0.95) for three frames, then on the "and" of 2.3 (${s(T.turn)}) the second ripple leaves it. Every app cell it reaches turns over: its width goes to nothing and back over eight frames (in-out, quick through edge-on, the face darkening as it turns and the tile a touch taller edge-on), never a rotation. The heart turns first and its back is the Conduction avatar, its hex ring exactly one cell. Then the first ring, the second, the end, each ring's cells a few frames apart (0 to 2, seeded) and each turn 7 to 9 frames long, as if turned by hand, while the name tiles keep their exact sixteenths: the backs of the three cells right of the heart carry the wordmark, each cell its own piece of it, so the name arrives tile by tile in reading order (${s(G(2, 3, 3))}, ${s(G(2, 3, 4))}, ${s(G(2, 4, 1))}), pale until it powers on. Across the field the ripple is a discharge: a one-frame crest, then a trough a step darker than the ghost that recovers, so the field goes quiet behind the name. From beat 2.3 (${s(T.glide[0])}) the camera glides to the lockup, zoom 0.73 to 1.22 on log zoom while it pans the lockup to the centre, landing on the bar 3 downbeat.`,
		sound: 'A soft whoosh under the glide. A flutter of dry clicks, one per tile as it goes edge-on, like a split-flap board, varied a little in pitch and level so it never machine-guns or becomes a melody; the heart and the three name tiles a touch louder, each with a dry spark, panning right with the name; a crackle along the outgoing ripple, spreading wide. Nothing goes through the reverb that could ring as a tone.',
		apps: Object.values(OPENING.cluster),
		layer: 'brand',
		borrow: 'Split-flap boards: a message turned over tile by tile. ConNext film: cells stepping off in sequence before the mark holds.',
		draw: at(3.58),
	},
	{
		id: 'o6',
		title: 'The name powers on',
		start: T.powerOn,
		end: T.end,
		key: 4.6,
		bars: span(T.powerOn, T.end),
		words: 'Conduction',
		motion: `On the bar 3 downbeat (${s(T.powerOn)}) the name powers on: the tile pieces give way to the whole wordmark in one frame (the cuts at the cell gaps close), avatar and wordmark step from pale to white, and for two frames a spark jumps the gap in the avatar's C as the circuit closes. The avatar settles from 1.045, the wordmark from 1.03. The canonical lockup, centred, 43% of the frame wide, on a calm field that has recovered to the house ghost. It holds whole for 1.5 s (to ${s(T.exit)}) while the camera keeps a slow push (1.22 to 1.275) about the lockup's centre.`,
		sound: 'A dry power-on: a switch transient and a short, nearly flat thump (64 to 48 Hz), with a crisp dry click on top: no ping, no bell, no reverb tail. The hum settles clean (filter down to 380 Hz).',
		apps: [],
		layer: 'brand',
		borrow: 'Canonical lockup: the avatar flush left of the wordmark.',
		draw: at(4.6),
	},
	{
		id: 'o7',
		title: 'The handover: the tiles turn back, the film builds in',
		start: T.exit,
		end: T.end,
		key: 5.34,
		bars: span(T.exit, T.end),
		words: 'Conduction (leaving)',
		motion: `From ${s(T.exit)} (frame 126, the name whole for 1.5 s) the lockup's four tiles turn back the way they came, in reading order, a frame apart and 5 frames each: the avatar, then the three wordmark tiles, each to a plain ghost cell. The last one is done on frame 134, the opening's last frame; the few breathing cells settle to the plain ghost with them. What is left is the handover ground: cobalt with the house honeycomb seen at house zoom 0.85 (cells 127.5 px, gaps 13.6 px), no lit cells, the camera still pushing gently, so the film's first scene (${s(T.end)}) builds in on top without a cut. The contract is written at the top of opening.js and exported as HANDOVER. With handover: false (the standalone page) the lockup holds instead.`,
		sound: 'Four soft dry clicks as the tiles turn back; the hum fades on into the film. Nothing tonal.',
		apps: [],
		layer: 'brand',
		borrow: 'The reveal, reversed: the same tiles, the same turn, back to the field.',
		draw: at(5.34),
	},
]
