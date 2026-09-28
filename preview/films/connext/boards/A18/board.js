/**
 * Variant A18: the modular ConNext film after Ruben's round-5 notes (2026-09-28).
 * Copied from A17 (the round-4 record, left as it was).
 *
 *   opening   the shared Conduction opening, real now (_lib/scenes/opening.js, 3 bars)
 *   body      the ConNext one take, 11 bars. New in round 5: it starts on a lead, and a
 *             line diagram draws down from it to the Nextcloud apps it links to, drawn in
 *             Nextcloud's colours; they then fly up into the ring round it. The bell sits in
 *             an app window on the cobalt, as the app films draw an app, not on a blue frame.
 *             The assistant keeps one caption, "It only does what you allow.", and the
 *             Hermiq hex. The flow's trigger stays the signed contract.
 *   builtOn   the shared closing piece, restyled: no green, no Nextcloud-blue tiles
 *   install   the shared install board as slogans
 *
 * Words: about 45 (Ruben): 27 in the body, 2 in the closing piece, 17 on the install board.
 * Buildiq is out of every honeycomb. No bell sound anywhere: the accents are clicks.
 *
 * Claims: round4/facts.json (the data layer's links in OpenRegister 2.1.0; the assistant
 * and where asking first is enforced; the flow parts). Every board names its source.
 */
import { el, textBlock } from '../../../_lib/stage.js'
import { mix, inv } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { MARK_BOX } from '../../../_lib/assets.js'
import { builtOnFrame, installFrame, INSTALL, NC_LINKS } from '../../../_lib/scenes/closing.js'
import { buildOpening, OPENING } from '../../../_lib/scenes/opening.js'
import { RING, appCell, ghost, drawWorld, camOn, camAt, cellXY, hexDist } from './world.js'
import { PAGE, contractPage, portalPhone, assistantDesk, flowLane, leadDiagram, ncWindow } from './ui.js'
import { T, BO, IN, BPM, FPS, BARS, DURATION, MODULES, START, LEN, at, CAPTIONS, words, DIAGRAM } from './timing.js'

const b = (t) => at('body', t)
const s = (t) => t.toFixed(2)
const sb = (t) => s(b(t))
const bb = (t) => { const k = Math.floor(t / (60 / BPM) + 1e-6); return `${Math.floor(k / 4) + 1}.${(k % 4) + 1}` }
const span = (a, e) => `${bb(a)}-${bb(e - 1e-4)}`
const WORDS = CAPTIONS.reduce((a, c) => a + words(c.text), 0)
const F4 = 4 / FPS

export const meta = {
	id: 'A18',
	format: '16x9',
	fps: FPS,
	bpm: BPM,
	bars: BARS,
	duration: DURATION,
	modules: MODULES.map((m) => ({ ...m, start: START[m.id], end: START[m.id] + LEN[m.id] })),
	timing: `${DURATION} s = ${BARS} bars at ${BPM} BPM, ${FPS} fps (45 frames a bar): opening ${MODULES[0].bars} bars, body ${MODULES[1].bars}, built on ConNext ${MODULES[2].bars}, install ${MODULES[3].bars}. Captions on frames, picture on the grid; every caption held max(1.5 s, 0.4 s x words).`,
	words: WORDS,
	title: 'Modular, round 5: opening, one take from a lead, built on ConNext, install as slogans (16:9)',
	logline: 'After the Conduction opening, a lead starts: a line diagram draws down from it to the Nextcloud apps it links to, in Nextcloud blue, and they fly up into a honeycomb round it. One camera then pushes into Filinq, where the contract fills itself in, travels to Portaliq, where your client signs, lifts to the lane where you draw what happens next, follows that line into Nextcloud, where the right person hears about it in the bell, and on into the assistant, which only does what you allow. Then everything it is built on, and the slogans: install the app, use the app, own your data.',
	references: [
		{ name: 'Claude mobile tools: Figma, Canva, Amplitude', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'The one-take glide: no cuts, the camera pushes into a card until the UI is large, holds, glides to the next card; never cuts on a word.' },
		{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells that step between states, one orange active cell; the built-on cluster assembling cell by cell.' },
		{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A centre record with partners settling into the first ring round it; the lead with its Nextcloud apps flying up round it.' },
	],
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
}

/* ---------- type ---------- */

export const TX = 120
const HEAD = 96
export const TYPE = {
	s1: { text: 'Start a lead.', size: 110, y: 520, lineHeight: 1.03, fill: C.white },
	s3: { text: 'The contract\nfills itself in.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s4: { text: 'Your client\nsigns.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s5: { text: 'Draw what\nhappens next.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.white },
	s6: { text: 'The right person\nhears about it.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.white },
	s7: { text: 'It only does\nwhat you allow.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
}
export const MARK = { s2: { y: 480, h: 120 } }

function headline(g, key) {
	const { text, size, y, lineHeight, fill } = TYPE[key]
	return textBlock(g, text, { x: TX, y, size, weight: 700, fill, lineHeight, tracking: -0.02 })
}
function wordmark(g, y, h) {
	const [mw, mh] = MARK_BOX['wordmark-connext-white']
	el('use', { href: '#wordmark-connext-white', x: TX - 3, y, width: (mw * h) / mh, height: h }, g)
}

/* ---------- cameras ---------- */

const [FX, FY] = cellXY(-1, 1)
const Z = 12
export const CAM = {
	// The lead near the top of the right of the frame, its line diagram under it, the row of apps at y 750.
	s1: camAt(0, 0, 1340, 300, 1.0),
	// The ring a little right of round 3's (1100), so Contacts' cell up-left of Talk clears the type column's text.
	s2: camOn(0, 0, 1180, 540, 0.85),
	s3: camAt(FX, FY, 960 + -PAGE.x * Z, 196 + -PAGE.y * Z, Z),
	s4: camOn(0, 1, 1370, 540, 13),
	s5: camAt(137, 0, 1360, 230, 1.1),
	s6: camOn(1, 1, 1390, 590, Z),
	s7: camOn(2, 1, 1390, 540, 10.8),
}
/** Rest drifts the film uses (log-zoom rate per second about the rest's own pivot). */
export const DRIFT = { s1: 0.012, s7: 0.012 }

/** The Nextcloud cell's fill by its size on screen: blue from afar, cobalt once you are inside it (round 5). */
export const ncFill = (sr) => mix(C.nextcloud, C.cobalt, inv(420, 700, sr))

function world({ active = false, page = {}, phone = {}, desk = {}, chat = {}, quiet = null } = {}) {
	return (q, r, { k, d, sr }) => {
		const id = RING[k]
		if (!id) return ghost(d)
		const dim = quiet && !quiet.includes(id) ? 0.22 : undefined
		if (id === 'filinq') return appCell(id, { keepGlyph: true, innerOver: true, dim, inner: (g, wx, wy) => contractPage(g, wx, wy, page) })
		if (id === 'portaliq') return appCell(id, { dim, inner: (g, wx, wy) => portalPhone(g, wx, wy, phone) })
		if (id === 'nextcloud') return appCell(id, { innerIn: [260, 460], dim, fill: ncFill(sr), inner: (g, wx, wy) => ncWindow(g, wx, wy, desk) })
		if (id === 'hermiq') return appCell(id, { innerIn: [260, 460], dim, inner: (g, wx, wy) => assistantDesk(g, wx, wy, chat) })
		return appCell(id, { active: active && k === '0,0', dim })
	}
}
const onlyClient = (q, r, { k, d }) => (k === '0,0' ? appCell('pipelinq') : ghost(d))
const QUIET = { page: { filled: 3 }, phone: { signed: true, accent: false }, desk: { badge: false }, chat: { accent: false, appr: 0 } }
const O = START.body
const DIAG_NAMES = { 'nc-contacts': 'Contacts', 'nc-talk': 'Talk', 'nc-files': 'Files', 'nc-mail': 'Mail', 'nc-calendar': 'Calendar', 'nc-deck': 'Deck', 'nc-tasks': 'Tasks' }

/** Ruben's round-5 note on the closing piece breaks off; the question stays visible on its board. */
export const BO_QUESTION = 'Ruben\'s note on this board breaks off at "we should also". What was the rest? Nothing here guesses it.'

export const boards = [
	/* ------------------------------------------------------------ opening */
	{
		id: 'op',
		title: 'Conduction opening (shared module)',
		start: 0,
		end: START.body,
		key: OPENING.T.powerOn + 0.9,
		bars: span(0, START.body),
		words: '',
		motion: `The shared opening, imported as it is (_lib/scenes/opening.js addOpening, 3 bars, ${s(LEN.opening)} s; its own agent owns it). A calm honeycomb holds the app cluster (Buildiq out, OpenRegister at the heart); a current runs in to the heart, which turns orange on bar 2; a second ripple turns the apps away and the name is revealed tile by tile; on bar 3 it powers on and holds a bar. The body cuts in on the next downbeat (${s(START.body)}).`,
		sound: 'The opening\'s own: hum, crackle, arcs, a low thud on the heart, sparks, the power-on with a crisp click (no bell). The film\'s bed enters with the body.',
		apps: ['openregister'],
		borrow: 'Set by the opening module.',
		layer: 'brand',
		module: 'opening',
		claim_source: 'No claim: the company name only.',
		draw(ctx) {
			const up = buildOpening(ctx.g, { defs: ctx.defs })
			const k = OPENING.T.powerOn + 0.9
			up(k)
			return () => up(k)
		},
	},

	/* ------------------------------------------------------------------ s1 */
	{
		id: 's1',
		title: 'Start a lead: the line diagram to its Nextcloud apps',
		start: O,
		end: b(T.openOut),
		key: b(T.key1),
		bars: span(O, b(T.openOut)),
		words: TYPE.s1.text,
		motion: `New in round 5. The body cuts in on the downbeat (${sb(0)}) with the caption already set in the left column and the lead on the right: the white Pipelinq cell high in the frame (centre x 1340, y 300, zoom 1.0), settling from 0.85 on the cut. From ${sb(T.trunk[0])} a line drops from its foot (to ${sb(T.trunk[1])}), spreads both ways along the bottom (${sb(T.bus[0])} to ${sb(T.bus[1])}) and drops again into a row of Nextcloud's own apps, each popping in (spring) as its line arrives, centre out on the sixteenths: Mail (${sb(T.drops['nc-mail'])}), Files and Calendar, Talk and Deck, Contacts and Tasks (${sb(T.drops['nc-tasks'])}). They are drawn in Nextcloud's colours: a Nextcloud-blue hex with its white icon. The camera drifts in slowly. The caption holds to ${sb(T.openOut)} (1.88 s; three words need 1.5) and leaves upward through its clip before anything moves.`,
		sound: 'The bed enters on the cut: pad and a soft pluck as the lead settles. A pencil-light scratch as the line draws, then a tick per app as it pops in, pitched up the scale, the pairs doubled and panned apart.',
		apps: ['pipelinq', ...DIAGRAM],
		borrow: 'X Ticker: the centre record first, its partners next. A line diagram, drawn on, not faded.',
		layer: 'general',
		module: 'body',
		claim_source: `Truth 2 (open a client and everything about it is there) and round4/facts.json fact a: OpenRegister 2.1.0 links a record to Nextcloud ${DIAGRAM.map((id) => DIAG_NAMES[id]).join(', ')} (IntegrationRegistry providers; Tasks are CalDAV to-dos). Pipelinq 0.5.1 keeps leads as records (divide.md).`,
		draw(ctx) {
			const { g } = ctx
			const wg = drawWorld(g, CAM.s1, onlyClient)
			leadDiagram(wg, DIAGRAM)
			headline(g, 's1')
		},
	},

	/* ------------------------------------------------------------------ s2 */
	{
		id: 's2',
		title: 'The Nextcloud apps fly up round the lead; the story row lands',
		start: b(T.openOut),
		end: b(T.push[0]),
		key: b(T.key2),
		bars: span(b(T.openOut), b(T.push[0])),
		words: '',
		motion: `No caption: fast picture, and the brand. On bar 2 (${sb(T.fly['nc-mail'])}) the lines draw back into the lead as the Nextcloud apps lift off the bottom row one a sixteenth, centre out, and fly up into their cells round it, growing to full size on a spring: Files, Mail and Calendar above and right, Talk left, Contacts up-left of Talk, Deck and Tasks on the right (their order along the bottom is their order in the ring, so none cross). The camera eases back and left (${sb(T.pull[0])} to ${sb(T.pull[1])}, zoom 1.0 to 0.85, the lead to x 1180, y 540). Then the story row flies in as in round 3: Filinq and Portaliq from below (${sb(T.land['-1,1'])}), the Nextcloud workspace hex and Hermiq along the row from the right (${sb(T.land['1,1'])}). As the row lands, the lead steps from white to orange, the one active cell. The ConNext wordmark rises in the left column at ${sb(T.wmIn)}. Out: at ${sb(T.push[0])} the camera turns into the push into Filinq; the wordmark rides out with the world.`,
		sound: 'A whoosh as the apps lift, a rising run of ticks as they land in the ring, two for the story row, a pluck as the lead turns orange. Offbeat bass enters on bar 2.',
		apps: ['pipelinq', ...DIAGRAM, 'filinq', 'portaliq', 'nextcloud', 'hermiq'],
		borrow: 'X Ticker: partners settle into the ring round the centre record as the camera pulls back. Firecrawl: one orange active cell.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 2 and round4/facts.json fact a (the same seven Nextcloud apps). No Buildiq anywhere (round 5).',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s2, world({ active: true, ...QUIET, page: { filled: 0 }, phone: { signed: false } }))
			wordmark(g, MARK.s2.y, MARK.s2.h)
		},
	},

	/* ------------------------------------------------------------------ s3 */
	{
		id: 's3',
		title: 'Inside Filinq: the contract fills itself in',
		start: b(T.push[0]),
		end: b(T.hop1[0]),
		key: b(T.key3),
		bars: span(b(T.push[0]), b(T.hop1[0])),
		words: TYPE.s3.text,
		motion: `Round 3, unchanged. At ${sb(T.push[0])} the camera pushes into the Filinq cell (zoom 0.85 to 12); its glyph's document border frames the page. The caption rises in cobalt at ${sb(T.s3In)} and holds to ${sb(T.hop1[0])} (2.0 s). The rows fill one per beat from ${sb(T.fill[0])}, each value next to the Pipelinq glyph it came from; the amount types and its last digit lands with the orange caret (${sb(T.amountLands)}). Out: the camera hops east into Portaliq.`,
		sound: 'Kick enters. Whoosh on the push; three plucks as the rows fill; soft ticks as the digits type; a tick as the caret lands.',
		apps: ['filinq', 'pipelinq'],
		borrow: 'Claude mobile tools: push into one card until its content is large, hold.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 5: pick a client and a template and the contract fills itself in (Filinq + Pipelinq).',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s3, world({ ...QUIET, page: { filled: 3, caret: true }, phone: { signed: false } }))
			headline(ctx.g, 's3')
		},
	},

	/* ------------------------------------------------------------------ s4 */
	{
		id: 's4',
		title: 'Inside Portaliq: your client signs',
		start: b(T.hop1[0]),
		end: b(T.flowOut[0]),
		key: b(T.key4),
		bars: span(b(T.hop1[0]), b(T.flowOut[0])),
		words: TYPE.s4.text,
		motion: `Round 3, unchanged. The hop lands in Portaliq at ${sb(T.hop1[1])}; the caption rises at ${sb(T.s4In)} and holds to ${sb(T.flowOut[0])} (1.5 s). The client's portal shows the contract waiting and, below it, an invoice, a quote and a request from other apps. The tap at ${sb(T.tap)}; the signature is drawn in at ${sb(T.sig)}, the one orange. Out: the camera pulls straight up out of the cell to the flow lane.`,
		sound: 'Riser into the tap; impact and a bright pluck on it; a tick as the signature lands.',
		apps: ['portaliq', 'filinq', 'shillinq', 'pipelinq'],
		borrow: 'Claude mobile tools: glide to the next card, push in and hold.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 6 (sign in the portal on the phone) and truth 4 (one portal, items from every app you run), shown, not captioned.',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s4, world({ ...QUIET, phone: { signed: true, tap: true } }))
			headline(ctx.g, 's4')
		},
	},

	/* ------------------------------------------------------------------ s5 */
	{
		id: 's5',
		title: 'Flows: draw what happens next',
		start: b(T.flowOut[0]),
		end: b(T.pushNc[0]),
		key: b(T.keyFlows),
		bars: span(b(T.flowOut[0]), b(T.pushNc[0])),
		words: TYPE.s5.text,
		motion: `Round 4, the caption trimmed. From ${sb(T.flowOut[0])} the camera pulls up out of Portaliq (zoom 13 to 1.1 by ${sb(T.flowOut[1])}) to the lane under the story row; the cells the flow will not touch step down to a fifth. The caption rises in white at ${sb(T.s5In)} and holds to ${sb(T.s5Out)} (2.17 s; four words need 1.6). The customer draws: the trigger lands under Filinq on ${bb(b(T.trig))} (the contract is signed) and wires up to it; the task for the right person lands on ${bb(b(T.task))}; the notify step (the bell on its card) is picked up on ${bb(b(T.lift))}, its dashed slot shows under the Nextcloud hex on ${bb(b(T.slot))} (the one orange: you decide), and it drops in on ${bb(b(T.drop))}; its edge climbs into the Nextcloud hex. Nothing runs, nothing is pre-built.`,
		sound: 'Whoosh on the pull up; a soft thud as each node lands, a light scratch as each edge draws, a lift swish, a click as the step drops into its slot. Claps enter.',
		apps: ['filinq', 'nextcloud', 'portaliq', 'pipelinq'],
		borrow: 'Firecrawl: cells step between states. Claude mobile tools: pull back out of a card and glide on without a cut.',
		layer: 'general',
		module: 'body',
		claim_source: 'story.json mechanics[7] and bible truth 8 (the customer draws each flow; openregister v2.1.0 TriggerObjectNode, UserTaskNode, SendNotificationNode); the trigger is a Filinq signing request reaching COMPLETED (filinq v0.2.0 register). round4/facts.json c.',
		draw(ctx) {
			const wg = drawWorld(ctx.g, CAM.s5, world({ ...QUIET, phone: { signed: true, accent: false }, quiet: ['filinq', 'nextcloud'] }))
			flowLane(wg, { lift: 0.35, slot: 1, into: 0 })
			headline(ctx.g, 's5')
		},
	},

	/* ------------------------------------------------------------------ s6 */
	{
		id: 's6',
		title: 'Inside Nextcloud: the right person hears about it (an app window)',
		start: b(T.pushNc[0]),
		end: b(T.hop3[0]),
		key: b(T.key6),
		bars: span(b(T.pushNc[0]), b(T.hop3[0])),
		words: TYPE.s6.text,
		motion: `Redrawn in round 5 in the app films' design. From ${sb(T.pushNc[0])} the camera follows the new edge up into the Nextcloud hex (zoom 1.1 to 12 by ${sb(T.pushNc[1])}). As it goes in, the white Nextcloud mark grows past the frame and fades, a colleague's Nextcloud comes up as an app window (white, its top bar cobalt-900: the logo pill, the app shelf, the bell and who is signed in; the Files app under it), and the cell's own blue steps down to the cobalt ground (by its size on screen), so the close-up is a white window on cobalt, not a blue frame. The caption rises in white at ${sb(T.s6In)}, once the cobalt fills the column, and holds to ${sb(T.hop3[0])} (2.42 s). On ${bb(b(T.badge))} the bell's badge pops (a small orange hex: the one orange) and the popover drops open; on ${bb(b(T.notice))} the new notice slides in on top, the Filinq glyph on it (the flow just drawn), over a shared file and a chat mention. Out: the camera hops east into the assistant.`,
		sound: 'Whoosh on the push; a crisp click as the badge pops (no bell); a soft tick as the notice slides in.',
		apps: ['nextcloud', 'filinq', 'nc-files', 'nc-talk'],
		borrow: 'The app films\' notification scene (general.js notifyFrame): an app window on the cobalt, Nextcloud\'s own header with the bell, the popover with the new notice on top.',
		layer: 'general',
		module: 'body',
		claim_source: 'story.json mechanics[8]: the right colleague hears about it in the same Nextcloud bell (openregister v2.1.0 AnnotationNotificationDispatcher and the flow\'s SendNotificationNode).',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s6, world({ ...QUIET, desk: { badge: true } }))
			headline(ctx.g, 's6')
		},
	},

	/* ------------------------------------------------------------------ s7 */
	{
		id: 's7',
		title: 'The assistant: it only does what you allow',
		start: b(T.hop3[0]),
		end: START.builtOn,
		key: b(T.key7),
		bars: span(b(T.hop3[0]), START.builtOn),
		words: TYPE.s7.text,
		motion: `Round 4's assistant, now with one caption. The hop lands in the Hermiq cell at ${sb(T.hop3[1])} (zoom 10.8). Fast picture first, no caption: on ${bb(b(T.rail[0]))} Pipelinq's block lands in the rail (its records, and its actions with a switch each), Filinq's a sixteenth later (one action off); on ${bb(b(T.ask))} your question pops in; on ${bb(b(T.answer))} the answer grows, two client rows from the records. On ${bb(b(T.propose))} (${sb(T.propose)}) the change it wants to make lands under the answer, Allow ringed in orange (the one orange), the action it would use lit in the rail and tied to it by a dotted line; the caption rises with it (${sb(T.s7In)}) and holds to ${sb(T.s7Out)} (2.42 s). On ${bb(b(T.allow))} you allow it (Allow presses, the ring goes); on ${bb(b(T.done))} the change lands, its pip mint, and a new row appears in Pipelinq's records in the rail. Out: the caption leaves; from ${sb(T.pullEnd[0])} the camera pulls straight out past the ring and the honeycomb settles by ${s(START.builtOn)}: the hand-over to the closing piece.`,
		sound: 'Whoosh on the hop; two soft thuds as the app blocks land, a click per switch; a pluck as the answer lands; a held note as the change waits; a click as Allow presses, a resolving pluck as it lands. Riser into the pull out.',
		apps: ['hermiq', 'pipelinq', 'filinq'],
		borrow: 'Claude mobile tools: glide to the next card, push in and hold on the proof.',
		layer: 'general',
		module: 'body',
		claim_source: 'round4/facts.json fact b: records reach the assistant as tools (ObjectsToolProvider), apps hand it actions as #[McpTool] methods (Pipelinq 9, Filinq 17); Hermiq 0.2.0 offers only granted tools and holds any write it was not granted for a person\'s approval (FacadeToolInvoker). "It only does what you allow." is the part that is always true (Ruben, round 5: kept, with the Hermiq hex).',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s7, world({ ...QUIET, chat: { appr: 1, accent: true } }))
			headline(ctx.g, 's7')
		},
	},

	/* ------------------------------------------------------------------ bo */
	{
		id: 'bo',
		title: 'Built on ConNext (shared closing piece) · OPEN QUESTION: "we should also ..."',
		open_question: BO_QUESTION,
		start: START.builtOn,
		end: START.install,
		key: at('builtOn', BO.key),
		bars: span(START.builtOn, START.install),
		words: 'Built on [ConNext wordmark]',
		motion: `Restyled in round 5: no green and no Nextcloud-blue tiles; the app design. Its own scene (_lib/scenes/closing.js builtOnScene), the same in every film. On the downbeat the Nextcloud cell (white, its cobalt mark) lands low on the right at 1.4x and settles, and the ground rows step on outward from it, dark, off the foot of the frame. On the next beat the common data layer drops onto it: the one cobalt hex, white ring, its glyph and no name. "Built on" rises in the left column (${s(at('builtOn', BO.typeIn))}), the wordmark a sixteenth behind. From ${s(at('builtOn', BO.ring[0]))} the Nextcloud apps it links a record to pop in round it (white cells, cobalt icons), one a sixteenth: Files, Mail, Calendar, Deck, Contacts, Talk, then Tasks, then four quieter cells at half strength (Activity, Polls, Photos, Forms). On ${bb(at('builtOn', BO.top))} the film's app lands on top (orange and labelled in an app film; in the ConNext film the story's apps, white, and no orange). On ${bb(at('builtOn', BO.out))} the type leaves and the cells step off from the outside in; the Nextcloud cell stays for the install board. ${BO_QUESTION}`,
		sound: 'A low thud as Nextcloud lands, a second as the data layer settles on it, a rising run of ticks as the apps pop in, a pluck as the top row lands, a soft whoosh out.',
		apps: ['nextcloud', 'openregister', ...NC_LINKS.map((l) => `nc-${l.id}`), 'pipelinq', 'filinq', 'portaliq'],
		borrow: 'X Ticker: a centre with partners settling round it. Firecrawl: cells stepping on in sequence.',
		layer: 'brand',
		module: 'builtOn',
		claim_source: 'round4/facts.json fact a: OpenRegister 2.1.0 links a record to Files, Mail, Calendar, Contacts, Talk, Deck, Tasks and more (lib/AppInfo/Application.php:4300-4397). No Nextcloud Notes (comments on the record, not the Notes app). story.json mechanics[0].',
		draw(ctx) {
			builtOnFrame(ctx, { apps: ['pipelinq', 'filinq', 'portaliq'] })
		},
	},

	/* ------------------------------------------------------------------ in */
	{
		id: 'in',
		title: 'Install the app. Use the app. Own your data. (shared install board)',
		start: START.install,
		end: DURATION,
		key: at('install', IN.key),
		bars: span(START.install, DURATION),
		words: `${INSTALL.slogans.join('\n')}\n${INSTALL.line}`,
		motion: `Rethought in round 5 as slogans. Its own scene (_lib/scenes/closing.js installScene), the same in every film. The Nextcloud cell travels from the closing piece to the top right (0 to 0.42 s local) and a quiet honeycomb steps on round it (in an app film the app's hex lands on it, orange). The wordmark rises top left; the slogans rise one under the other at headline size: "Install the app." in orange (the call, the frame's one orange) at ${s(at('install', IN.slogans[0]))}, "Use the app." on ${bb(at('install', IN.slogans[1]))}, "Own your data." on ${bb(at('install', IN.slogans[2]))}; on ${bb(at('install', IN.line))} (${s(at('install', IN.line))}) "Always 100% open source and free to use." rises under them in white at 64 px. All hold to the end, ${s(DURATION)} (the line ${s(LEN.install - IN.line - F4)} s for 3.2 needed). No fade, no loop: the film opens on the Conduction opening, so the end does not flow into frame 1. The long call "Install from the Nextcloud app store" is dropped: "Install the app." is the call now (open question).`,
		sound: 'A soft whoosh as the Nextcloud cell travels; a crisp click and a low impact on "Install the app." (the click is the sonic accent now, no bell); soft ticks on the next two; a pluck on the line; the pad resolves to the end.',
		apps: ['nextcloud'],
		borrow: 'Claude mobile tools: hold on the end card. Firecrawl: the logo holds while the honeycomb is quiet.',
		layer: 'brand',
		module: 'install',
		claim_source: Object.entries(INSTALL.sources).map(([k, v]) => `"${k}": ${v}`).join(' '),
		draw(ctx) {
			installFrame(ctx, {})
		},
	},
]

export const _debug = { CAM, hexDist }
