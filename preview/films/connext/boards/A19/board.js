/**
 * Variant A19: the modular ConNext film after Ruben's round-6 notes (2026-09-28).
 * Copied from A18 (the round-5 record, left as it was).
 *
 *   opening   the shared Conduction opening (_lib/scenes/opening.js, 3 bars; it now ends
 *             on a dry click)
 *   body      the ConNext one take, 14 bars:
 *               s1   a lead; the Nextcloud components load one by one into the grid under it,
 *                    each on its own square-cornered line, each with a line under "Start a
 *                    lead" pairing an action with its name (the name in Nextcloud cyan)
 *               s2   the links draw back; the story row lands east of the lead
 *               s3   the contract fills itself in (Filinq)
 *               s4   your client signs (Portaliq)
 *               s5   draw what happens next (the last step now drops in on one continuous ease)
 *               s6   instant notifications, desktop and mobile: the app window, a desktop toast
 *                    bottom left and a push on a phone's lock screen
 *               s7   ask the Nextcloud Assistant about your data; it prepares actions and
 *                    suggestions, waiting for your approval (Hermiq hex kept)
 *   builtOn   the shared closing piece, now building from its second frame
 *   install   the shared install board: the Conduction wordmark and avatar, slogans, no full
 *             stops, the last line at 72 px
 *
 * Round 6 across the board: no full stop at the end of any on-screen line; Nextcloud's own
 * apps in Nextcloud blue, their names as text in Nextcloud cyan (#1CAFFF) on cobalt.
 * Claims: round4/facts.json; every board names its source.
 */
import { el, textBlock } from '../../../_lib/stage.js'
import { mix, inv } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { MARK_BOX } from '../../../_lib/assets.js'
import { builtOnFrame, installFrame, INSTALL, NC_LINKS } from '../../../_lib/scenes/closing.js'
import { buildOpening, OPENING } from '../../../_lib/scenes/opening.js'
import { RING, STORY, SLOT, appCell, ghost, drawWorld, camOn, camAt, cellXY, hexDist } from './world.js'
import { PAGE, contractPage, portalPhone, assistantDesk, flowLane, ncWindow, ncNotify, leadLinks, dropEase } from './ui.js'
import { T, BO, IN, BPM, FPS, BARS, DURATION, MODULES, START, LEN, at, CAPTIONS, words, LOADS, LINK_DUR } from './timing.js'

const b = (t) => at('body', t)
const s = (t) => t.toFixed(2)
const sb = (t) => s(b(t))
const bb = (t) => { const k = Math.floor(t / (60 / BPM) + 1e-6); return `${Math.floor(k / 4) + 1}.${(k % 4) + 1}` }
const span = (a, e) => `${bb(a)}-${bb(e - 1e-4)}`
const WORDS = CAPTIONS.reduce((a, c) => a + words(c.text), 0)
const F4 = 4 / FPS

export const meta = {
	id: 'A19',
	format: '16x9',
	fps: FPS,
	bpm: BPM,
	bars: BARS,
	duration: DURATION,
	modules: MODULES.map((m) => ({ ...m, start: START[m.id], end: START[m.id] + LEN[m.id] })),
	timing: `${DURATION} s = ${BARS} bars at ${BPM} BPM, ${FPS} fps (45 frames a bar): opening ${MODULES[0].bars} bars, body ${MODULES[1].bars}, built on ConNext ${MODULES[2].bars}, install ${MODULES[3].bars}. Captions on frames, picture on the grid; every caption held max(1.5 s, 0.4 s x words), s1's rotating line excepted (see s1).`,
	words: WORDS,
	title: 'Modular, round 6: opening, one take from a lead, built on ConNext, install (16:9)',
	logline: 'After the Conduction opening, a lead starts, and one by one the Nextcloud components it links to load into the grid under it, each on its own line: reply from Mail, plan in Calendar, save to Contacts, share in Files, chat in Talk, follow up in Tasks, manage from Deck. One camera then pushes into Filinq, where the contract fills itself in, travels to Portaliq, where your client signs, lifts to the lane where you draw what happens next, follows that line into Nextcloud, where the notification arrives at once on the desktop and on the phone, and on into the Nextcloud Assistant, which answers from your data and prepares actions and suggestions for you to approve. Then what it is built on, and the slogans.',
	references: [
		{ name: 'Claude mobile tools: Figma, Canva, Amplitude', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'The one-take glide: no cuts, the camera pushes into a card until the UI is large, holds, glides to the next card; never cuts on a word.' },
		{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells that step between states, one at a time, one orange active cell; the built-on cluster assembling cell by cell.' },
		{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A centre record with its partners loading round it, one by one, a line of copy changing with each.' },
	],
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
}

/* ---------- type ---------- */

export const TX = 120
const HEAD = 96
/** Round 6: no full stop at the end of any line. s6 and s7 are set smaller to keep two lines inside the column. */
export const TYPE = {
	s1: { text: 'Start a lead', size: 110, y: 470, lineHeight: 1.03, fill: C.white },
	s3: { text: 'The contract\nfills itself in', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s4: { text: 'Your client\nsigns', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s5: { text: 'Draw what\nhappens next', size: HEAD, y: 480, lineHeight: 1.04, fill: C.white },
	s6: { text: 'Instant notifications,\ndesktop and mobile', size: 78, y: 490, lineHeight: 1.1, fill: C.white },
	s7a: { text: 'Ask Nextcloud Assistant\nabout your data', size: 70, y: 500, lineHeight: 1.12, fill: C.cobalt },
	s7b: { text: 'It prepares actions\nand suggestions', size: 70, y: 500, lineHeight: 1.12, fill: C.cobalt },
}
/**
 * s1's line under the headline: the action in white, the component's name in Nextcloud cyan
 * (#1CAFFF, 3.7:1 on cobalt at this size; Nextcloud blue text would be 2.2:1). 72 px, one clip box.
 */
export const LINE = { size: 72, y: 572, fill: C.white, accent: C.nextcloudCyan }
export const lineText = (l) => `${l.verb} *${l.name}*`
export const MARK = { s2: { y: 480, h: 120 } }

function headline(g, key) {
	const { text, size, y, lineHeight, fill } = TYPE[key]
	return textBlock(g, text, { x: TX, y, size, weight: 700, fill, lineHeight, tracking: -0.02 })
}
function subline(g, l) {
	return textBlock(g, lineText(l), { x: TX, y: LINE.y, size: LINE.size, weight: 700, fill: LINE.fill, accent: LINE.accent, tracking: -0.02 })
}
function wordmark(g, y, h) {
	const [mw, mh] = MARK_BOX['wordmark-connext-white']
	el('use', { href: '#wordmark-connext-white', x: TX - 3, y, width: (mw * h) / mh, height: h }, g)
}

/* ---------- cameras ---------- */

const [FX, FY] = cellXY(...STORY.filinq)
const [PX, PY] = cellXY(...STORY.portaliq)
const Z = 12
export const CAM = {
	// The lead near the top of the right of the frame, its components in the grid under it.
	s1: camAt(0, 0, 1330, 225, 0.88),
	// The lead, the story row east of it, the components below, all right of the type column.
	s2: camOn(0, 0, 1150, 360, 0.62),
	s3: camAt(FX, FY, 960 + -PAGE.x * Z, 196 + -PAGE.y * Z, Z),
	s4: camOn(...STORY.portaliq, 1370, 540, 13),
	// Right of A18's framing and a touch further out: the lead now sits left of Filinq on the row, and must stay clear of the caption.
	s5: camAt(PX, PY - 239, 1480, 230, 1.0),
	s6: camOn(...STORY.nextcloud, 1390, 590, Z),
	// A touch further right than A18, so the smaller two-line captions keep 35 px of white before the card.
	s7: camOn(...STORY.hermiq, 1410, 540, 10.8),
}
export const DRIFT = { s1: 0.012, s7: 0.012 }
CAM.s7b = { ...CAM.s7, z: CAM.s7.z * Math.exp(DRIFT.s7 * (T.key7b - T.key7a)) }

/** The Nextcloud cell's fill by its size on screen: blue from afar, cobalt once you are inside it (round 5). */
export const ncFill = (sr) => mix(C.nextcloud, C.cobalt, inv(420, 700, sr))
/** The flow's last step, travelling on one continuous ease (round 6); shared with the film. */
export const flowLift = (tb) => dropEase(inv(T.lift, T.drop, tb))

const NC_CELLS = Object.fromEntries(Object.entries(SLOT).map(([id, k]) => [id, k.split(',').map(Number)]))

function world({ active = false, page = {}, phone = {}, desk = {}, note = {}, chat = {}, quiet = null, only = null } = {}) {
	return (q, r, { k, d, sr }) => {
		const id = RING[k]
		if (!id || (only && !only.includes(id))) return ghost(d)
		const dim = quiet && !quiet.includes(id) ? 0.22 : undefined
		if (id === 'filinq') return appCell(id, { keepGlyph: true, innerOver: true, dim, inner: (g, wx, wy) => contractPage(g, wx, wy, page) })
		if (id === 'portaliq') return appCell(id, { dim, inner: (g, wx, wy) => portalPhone(g, wx, wy, phone) })
		if (id === 'nextcloud') return appCell(id, { innerIn: [260, 460], dim, fill: ncFill(sr), inner: (g, wx, wy) => { ncWindow(g, wx, wy, { open: 0, ...desk }); ncNotify(g, wx, wy, note) } })
		if (id === 'hermiq') return appCell(id, { innerIn: [260, 460], dim, inner: (g, wx, wy) => assistantDesk(g, wx, wy, chat) })
		return appCell(id, { active: active && k === '0,0', dim })
	}
}
const QUIET = { page: { filled: 3 }, phone: { signed: true, accent: false }, desk: { badge: false }, note: { toast: 0, phone: 0, push: 0 }, chat: { accent: false, appr: 0 } }
const O = START.body
const LEAD_AND_NC = ['pipelinq', ...LOADS.map((l) => l.id)]
const LAST = LOADS[LOADS.length - 1]

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
		motion: `The shared opening, imported as it is (_lib/scenes/opening.js addOpening, 3 bars, ${s(LEN.opening)} s; its own agent owns it; round 6: it ends on a dry click). It hands over on a plain field (its last frame, frame 134, is ground and field only), and the body builds on that field from the next downbeat (${s(START.body)}), no cut.`,
		sound: 'The opening\'s own: hum, crackle, arcs, a low thud on the heart, sparks, the power-on ending on a dry click. The film\'s bed enters with the body.',
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
		title: 'Start a lead: its Nextcloud components load one by one, each with a line',
		start: O,
		end: b(T.openOut),
		key: b(T.key1),
		bars: span(O, b(T.openOut)),
		words: `${TYPE.s1.text}\n${LOADS.map((l) => `${l.verb} ${l.name}`).join(' / ')}`,
		motion: `Reworked in round 6. No cut from the opening: its last frame (frame 134) is ground and field only (_lib/scenes/opening.js HANDOVER: this world at zoom 0.85, cell for cell), and the body's first frame (${sb(0)}, frame 135) is that same field, the camera still carrying the opening's slow push. On it the lead pops in on one of the field's cells, high on the right (the handover cell 4,-2), and "Start a lead" rises in the left column; over the first ${s(T.handIn[1])} s the camera settles into the s1 framing (centre x 1330, y 225, zoom 0.88) and in the first second the field's shading hands over from the opening's (by distance from the frame centre) to the world's (by distance from the lead). Then the Nextcloud components load one by one into the honeycomb under it, three in the row below and four under those, in Nextcloud blue with their white icons. Each gets its own line from the lead with square 90-degree corners (down from the lead's foot, along the quiet row, down the gap between cells into the component's top point; mitred joins, no dots), running out in ${LINK_DUR} s and arriving as the cell pops in (spring). With each, the line under the headline swaps in one clip box (the old words leave upward as the new rise, 4 frames): ${LOADS.map((l) => `"${l.verb} ${l.name}" (${sb(l.at)})`).join(', ')}; the action in white, the name in Nextcloud cyan. The last holds to ${sb(T.openOut)}, when both lines leave. Reading budget: "Start a lead" is up for ${s(T.openOut - F4)} s (1.5 needed). The component lines are one line whose words change, not seven captions: the first gets two beats (0.94 s) to set the pattern, the others one beat each (0.47 s, about 0.3 s fully still), which is enough to take in the cyan name (one word, the same colour family as the cell popping in at that moment) while the verb repeats a known shape; the last, "${LAST.verb} ${LAST.name}", holds ${s(T.openOut - LAST.at - F4)} s (1.5 needed). They count as ${LOADS.reduce((a, l) => a + words(`${l.verb} ${l.name}`), 0)} on-screen words.`,
		sound: 'The bed enters on the cut: pad, and a soft pluck as the lead settles. For each component a short light scratch as its line runs out and a tick as it pops in, one a beat, pitched up the scale.',
		apps: ['pipelinq', ...LOADS.map((l) => l.id)],
		borrow: 'Firecrawl: cells stepping on one at a time. X Ticker: the centre record, its partners arriving round it, a line of copy changing with each.',
		layer: 'general',
		module: 'body',
		claim_source: 'round4/facts.json fact a: OpenRegister 2.1.0 links a record to Nextcloud Mail (EmailProvider), Calendar (CalendarProvider, "Meetings"), Contacts (ContactsProvider; a Pipelinq client is provisioned into the address book first, story.json mechanics[2]), Files (FilesProvider), Talk (TalkProvider, "Chat"), Tasks (TasksProvider, CalDAV to-dos) and Deck (DeckProvider, "Cards"). Each verb is what you do with that linked item in that app: reply to a mail, plan a meeting, save a contact, share a file, chat, follow up a to-do, manage a card.',
		draw(ctx) {
			const { g } = ctx
			const wg = drawWorld(g, CAM.s1, world({ only: LEAD_AND_NC }))
			leadLinks(wg, NC_CELLS)
			headline(g, 's1')
			subline(g, LAST)
		},
	},

	/* ------------------------------------------------------------------ s2 */
	{
		id: 's2',
		title: 'The links draw back; the story row lands east of the lead',
		start: b(T.openOut),
		end: b(T.push[0]),
		key: b(T.key2),
		bars: span(b(T.openOut), b(T.push[0])),
		words: '',
		motion: `No caption: fast picture, and the brand. On bar ${bb(b(T.retract[0]))} the lines draw back into the lead (${sb(T.retract[0])} to ${sb(T.retract[1])}) and the camera eases back and left (to zoom 0.62, the lead at x 1150, y 360), so the components stay where they loaded, in the grid under the lead. Then the story row flies in from the right along the lead's own row: Filinq and Portaliq (${sb(T.land['1,0'])}), the Nextcloud workspace hex and Hermiq (${sb(T.land['3,0'])}), the row the camera will travel. As it lands the lead steps from white to orange, the one active cell. The ConNext wordmark rises at ${sb(T.wmIn)}. Out: at ${sb(T.push[0])} the camera turns into the push into Filinq; the wordmark rides out with the world.`,
		sound: 'A soft whoosh as the lines draw back and the camera eases out; a tick per pair as the row lands; a pluck as the lead turns orange. Offbeat bass enters.',
		apps: ['pipelinq', ...LOADS.map((l) => l.id), 'filinq', 'portaliq', 'nextcloud', 'hermiq'],
		borrow: 'X Ticker: the camera pulls back as the partners settle. Firecrawl: one orange active cell.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 2 and round4/facts.json fact a (the same seven Nextcloud components). No Buildiq anywhere.',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s2, world({ active: true, ...QUIET, page: { filled: 0 }, phone: { signed: false } }))
			wordmark(ctx.g, MARK.s2.y, MARK.s2.h)
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
		motion: `Round 3, unchanged but for the full stop. At ${sb(T.push[0])} the camera pushes into Filinq (zoom 0.62 to 12); its glyph's document border frames the page. The caption rises at ${sb(T.s3In)} and holds to ${sb(T.hop1[0])} (2.0 s). The rows fill one per beat from ${sb(T.fill[0])}; the amount types and its last digit lands with the orange caret (${sb(T.amountLands)}). Out: the camera hops east into Portaliq.`,
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
		motion: `Round 3, unchanged but for the full stop. The hop lands in Portaliq at ${sb(T.hop1[1])}; the caption rises at ${sb(T.s4In)} and holds to ${sb(T.flowOut[0])} (1.5 s). The tap at ${sb(T.tap)}; the signature at ${sb(T.sig)}, the one orange. Out: the camera pulls up out of the cell to the flow lane.`,
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
		title: 'Flows: draw what happens next (the last step drops in fluidly)',
		start: b(T.flowOut[0]),
		end: b(T.pushNc[0]),
		key: b(T.keyFlows),
		bars: span(b(T.flowOut[0]), b(T.pushNc[0])),
		words: TYPE.s5.text,
		motion: `From ${sb(T.flowOut[0])} the camera pulls up out of Portaliq to the lane under the story row; the cells the flow will not touch step down to a fifth. The caption rises at ${sb(T.s5In)} and holds to ${sb(T.s5Out)}. The trigger lands under Filinq on ${bb(b(T.trig))} (the contract is signed); the task on ${bb(b(T.task))}. Round 6: the last step travels in one piece. It appears in the hand on ${bb(b(T.lift))} and moves to its slot on one continuous ease (smootherstep: it starts and settles with zero speed, no hold on the way, no snap at the end) until ${sb(T.drop)}; its dashed slot (the one orange) shows on ${bb(b(T.slot))} while it travels and fades as the card covers it; the edge from the task follows the card all the way and simply straightens; the card's flat shadow closes in as it lands. Then its edge climbs into the Nextcloud hex. Nothing runs, nothing is pre-built.`,
		sound: 'Whoosh on the pull up; a soft thud as each node lands, a light scratch as each edge draws; one long soft swish under the whole carry and a dry click as it settles.',
		apps: ['filinq', 'nextcloud', 'portaliq', 'pipelinq'],
		borrow: 'Firecrawl: cells step between states. Claude mobile tools: a drag that eases into place.',
		layer: 'general',
		module: 'body',
		claim_source: 'story.json mechanics[7] and bible truth 8 (the customer draws each flow; openregister v2.1.0 TriggerObjectNode, UserTaskNode, SendNotificationNode); the trigger is a Filinq signing request reaching COMPLETED (filinq v0.2.0 register).',
		draw(ctx) {
			const wg = drawWorld(ctx.g, CAM.s5, world({ ...QUIET, phone: { signed: true, accent: false }, quiet: ['filinq', 'nextcloud'] }))
			flowLane(wg, { lift: flowLift(T.keyFlows), slot: 1, into: 0 })
			headline(ctx.g, 's5')
		},
	},

	/* ------------------------------------------------------------------ s6 */
	{
		id: 's6',
		title: 'Instant notifications, desktop and mobile',
		start: b(T.pushNc[0]),
		end: b(T.hop3[0]),
		key: b(T.key6),
		bars: span(b(T.pushNc[0]), b(T.hop3[0])),
		words: TYPE.s6.text,
		motion: `Round 6: say what it is, and show it. From ${sb(T.pushNc[0])} the camera follows the flow's edge up into the Nextcloud hex; inside, the app window of round 5 (white, its top bar cobalt-900 with Nextcloud's shelf, the bell and who is signed in; the Files app under it) on the cobalt ground. The caption rises at ${sb(T.s6In)} and holds to ${sb(T.hop3[0])}. On ${bb(b(T.badge))} the bell's badge pops (the one orange). On ${bb(b(T.toast))} the desktop notification slides in at the bottom left of the window (a white card with a flat shadow, the Nextcloud mark, a title and a line); on ${bb(b(T.phone))} a phone rises into the frame in front of the window's right side, its lock screen dark, and on ${bb(b(T.pushMsg))} the push message drops onto it (the Nextcloud mark, a title, a line). Out: the camera hops east into the assistant.`,
		sound: 'Whoosh on the push; a crisp click as the badge pops; a soft swish and a tick as the desktop notification slides in; a low whoosh as the phone rises; a bright short tick and a dry click as the push lands.',
		apps: ['nextcloud', 'filinq'],
		borrow: 'The app films\' notification scene (general.js notifyFrame): the app window, Nextcloud\'s own header with the bell.',
		layer: 'general',
		module: 'body',
		claim_source: 'story.json mechanics[8] (the notice reaches the Nextcloud bell: openregister v2.1.0 AnnotationNotificationDispatcher, NcNotificationSender, and the flow\'s SendNotificationNode, whose docblock says "Web-push rides along with the nc-notification channel"). Mobile: Nextcloud\'s own apps carry its notifications to the phone (Nextcloud is cited, not claimed). "Instant" rests on push delivery; see open questions.',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s6, world({ ...QUIET, desk: { badge: true }, note: { toast: 1, phone: 1, push: 1 } }))
			headline(ctx.g, 's6')
		},
	},

	/* ----------------------------------------------------------------- s7a */
	{
		id: 's7a',
		title: 'Ask the Nextcloud Assistant about your data',
		start: b(T.hop3[0]),
		end: b(T.s7aOut),
		key: b(T.key7a),
		bars: span(b(T.hop3[0]), b(T.s7aOut)),
		words: TYPE.s7a.text,
		motion: `Round 6: say what it does. The hop lands in the Hermiq cell at ${sb(T.hop3[1])} (zoom 10.8). The caption rises at ${sb(T.s7aIn)} and holds to ${sb(T.s7aOut)} (2.42 s). Pipelinq's block lands in the rail on ${bb(b(T.rail[0]))} (its records, its actions with a switch each), Filinq's a sixteenth later; your question pops in on ${bb(b(T.ask))}; typing dots; on ${bb(b(T.answer))} the answer grows, two client rows from the records. No orange yet.`,
		sound: 'Whoosh on the hop; two soft thuds as the app blocks land, a click per switch; a tick as the question pops; a pluck as the answer lands.',
		apps: ['hermiq', 'pipelinq', 'filinq'],
		borrow: 'Claude mobile tools: glide to the next card, push in and hold on the proof.',
		layer: 'general',
		module: 'body',
		claim_source: 'round4/facts.json fact b: Hermiq 0.2.0 registers as the provider of Nextcloud Assistant\'s agent chat (TaskProcessing core:contextagent:interaction, ContextAgentProvider "Hermiq (governed agents)"); records reach it as tools (ObjectsToolProvider). "Nextcloud Assistant" holds when an admin picks Hermiq as that provider: see open questions.',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s7, world({ ...QUIET, chat: { appr: 0, prepared: 0, accent: false } }))
			headline(ctx.g, 's7a')
		},
	},

	/* ----------------------------------------------------------------- s7b */
	{
		id: 's7b',
		title: 'It prepares actions and suggestions, waiting for you',
		start: b(T.s7aOut),
		end: START.builtOn,
		key: b(T.key7b),
		bars: span(b(T.s7aOut), START.builtOn),
		words: TYPE.s7b.text,
		motion: `The same cell, pushing in slowly. On ${sb(T.propose)} its prepared work lands under the answer in one bubble: the action it prepared (pending pip, a line, Not now and Allow, Allow ringed in orange: the one orange), tied by a dotted line to the action in the rail it would use, and under it a suggestion (a lighter row with a ghost button). The first caption leaves at ${sb(T.s7aOut)} (3 frames); "It prepares actions and suggestions" rises two clear frames later (${sb(T.s7bIn)}) and holds to ${sb(T.s7bOut)}. Nothing is pressed: it waits for you. Out: the caption leaves; from ${sb(T.pullEnd[0])} the camera pulls straight out past the row and the honeycomb steps off toward the lead, the lead last, on the cut to the closing piece (${s(START.builtOn)}).`,
		sound: 'A pluck as the prepared work lands, a held note while it waits. A riser and a whoosh into the pull out; a hat per ring as the honeycomb steps off.',
		apps: ['hermiq', 'pipelinq', 'filinq'],
		borrow: 'Claude mobile tools: hold on the proof; the caption changes, the camera does not.',
		layer: 'general',
		module: 'body',
		claim_source: 'round4/facts.json fact b: apps hand the assistant actions as #[McpTool] methods (Pipelinq 9, Filinq 17); Hermiq offers only granted tools and holds any write it was not granted for a person\'s approval (FacadeToolInvoker): a prepared action waiting. Suggestions are the assistant\'s own text, nothing it does on its own.',
		draw(ctx) {
			drawWorld(ctx.g, CAM.s7b, world({ ...QUIET, chat: { appr: 0, prepared: 1, accent: true } }))
			headline(ctx.g, 's7b')
		},
	},

	/* ------------------------------------------------------------------ bo */
	{
		id: 'bo',
		title: 'Built on ConNext (shared closing piece)',
		start: START.builtOn,
		end: START.install,
		key: at('builtOn', BO.key),
		bars: span(START.builtOn, START.install),
		words: 'Built on [ConNext wordmark]',
		motion: `Round 6: nothing to add (Ruben), and it now builds at once. Its own scene (_lib/scenes/closing.js builtOnScene). On the downbeat the Nextcloud cell lands low on the right and the ground rows step on round it; three frames in the data layer (the one cobalt hex) drops onto it and "Built on" rises with the wordmark; from the second beat (${s(at('builtOn', BO.ring[0]))}) the Nextcloud apps pop in round it one a sixteenth, then Tasks and the four quieter cells; on bar ${bb(at('builtOn', BO.top))} the story's apps land on top. On ${bb(at('builtOn', BO.out))} the type leaves and the cells step off from the outside in; the Nextcloud cell stays for the install board.`,
		sound: 'A low thud as Nextcloud lands, a second as the data layer settles, a run of ticks as the apps pop in, a pluck as the top row lands, a soft whoosh out.',
		apps: ['nextcloud', 'openregister', ...NC_LINKS.map((l) => `nc-${l.id}`), 'pipelinq', 'filinq', 'portaliq'],
		borrow: 'X Ticker: a centre with partners settling round it. Firecrawl: cells stepping on in sequence.',
		layer: 'brand',
		module: 'builtOn',
		claim_source: 'round4/facts.json fact a (OpenRegister 2.1.0 links a record to Files, Mail, Calendar, Contacts, Talk, Deck, Tasks and more). No Nextcloud Notes. story.json mechanics[0].',
		draw(ctx) {
			builtOnFrame(ctx, { apps: ['pipelinq', 'filinq', 'portaliq'] })
		},
	},

	/* ------------------------------------------------------------------ in */
	{
		id: 'in',
		title: 'Install the app, use the app, own your data (shared install board)',
		start: START.install,
		end: DURATION,
		key: at('install', IN.key),
		bars: span(START.install, DURATION),
		words: `${INSTALL.slogans.join('\n')}\n${INSTALL.line}`,
		motion: `Round 6: Conduction, not ConNext and Nextcloud, and no full stops. Its own scene (_lib/scenes/closing.js installScene). The Nextcloud cell travels from the closing piece to the top right (0 to 0.42 s local) and turns over into the Conduction avatar (a scale flip about its vertical axis, the opening's own device, never a rotation), a quiet honeycomb stepping on round it. The Conduction wordmark rises top left as the header; the slogans rise one under the other at headline size: "Install the app" in orange (the call, the one orange) at ${s(at('install', IN.slogans[0]))}, "Use the app" on ${bb(at('install', IN.slogans[1]))}, "Own your data" on ${bb(at('install', IN.slogans[2]))}; on ${bb(at('install', IN.line))} "Always 100% open source" (round 15: no "free") rises under them in white at 72 px (was 64). All hold to the end, ${s(DURATION)}. No fade, no loop.`,
		sound: 'A soft whoosh as Nextcloud travels, a dry click as it turns into the avatar; a crisp click and a low impact on "Install the app"; soft ticks on the next two; a pluck on the line; the pad resolves.',
		apps: ['conduction'],
		borrow: 'Claude mobile tools: hold on the end card.',
		layer: 'brand',
		module: 'install',
		claim_source: Object.entries(INSTALL.sources).map(([k, v]) => `"${k}": ${v}`).join(' '),
		draw(ctx) {
			installFrame(ctx, {})
		},
	},
]

export const _debug = { CAM, hexDist }
