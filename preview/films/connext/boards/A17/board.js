/**
 * Variant A17: the modular ConNext film (Ruben, round 4, 2026-09-27, after
 * watching the animated round-3 film). Copied from A16, which stays untouched.
 *
 * The film is four modules, each a whole number of bars (./timing.js):
 *
 *   opening   the shared Conduction opening (another agent builds it in
 *             preview/films/opening/; here one placeholder board)
 *   body      the ConNext one take, revised: the approved round-3 take up to
 *             the signature, then two new beats. FLOWS: the camera pulls up out
 *             of the portal to the lane under the story row, where the customer
 *             draws the flow that ties it together (the signing completes, a task
 *             for the right person, a notification into Nextcloud). The bell then
 *             rings as the result of that flow. ASSISTANT, reworked so the
 *             mechanism shows: the apps hand the assistant their records and
 *             their actions (with a switch each: what you allow), you ask, it
 *             answers and proposes a change, and the change waits for you.
 *   builtOn   the shared "Built on ConNext" piece (_lib/scenes/closing.js)
 *   install   the shared install board (_lib/scenes/closing.js)
 *
 * Every body board draws the SAME world (./world.js) through one camera; the
 * modules are their own scenes. Captions keep the left column (x 120 to 840,
 * inside the safe box y 96 to 930); the picture owns the right 55 to 60%.
 *
 * Claims: the verified facts are in round4/facts.json (the data layer's links in
 * OpenRegister 2.1.0; what the assistant is in shipped code and where asking first
 * is enforced). Every board names its source in claim_source.
 */
import { el, textBlock } from '../../../_lib/stage.js'
import { hexPath } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { MARK_BOX } from '../../../_lib/assets.js'
import { builtOnFrame, installFrame, INSTALL, NC_LINKS } from '../../../_lib/scenes/closing.js'
import { RING, appCell, ghost, drawWorld, camOn, camAt, cellXY, hexDist } from './world.js'
import { PAGE, contractPage, portalPhone, ncDesk, assistantDesk, flowLane } from './ui.js'
import { T, BO, IN, BPM, FPS, BAR, BARS, DURATION, MODULES, START, LEN, at, CAPTIONS, words } from './timing.js'

/** Film time of a body / built-on / install moment, formatted. */
const b = (t) => at('body', t)
const s = (t) => t.toFixed(2)
const sb = (t) => s(b(t))
/** Bar.beat of a film time, as the storyboard writes it; a scene's end is exclusive. */
const bb = (t) => { const k = Math.floor(t / (60 / BPM) + 1e-6); return `${Math.floor(k / 4) + 1}.${(k % 4) + 1}` }
const span = (a, e) => `${bb(a)}-${bb(e - 1e-4)}`
const WORDS = CAPTIONS.reduce((a, c) => a + words(c.text), 0)

export const meta = {
	id: 'A17',
	format: '16x9',
	fps: FPS,
	bpm: BPM,
	bars: BARS,
	duration: DURATION,
	modules: MODULES.map((m) => ({ ...m, start: START[m.id], end: START[m.id] + LEN[m.id] })),
	timing: `${DURATION} s = ${BARS} bars at ${BPM} BPM, ${FPS} fps (45 frames a bar): opening ${MODULES[0].bars} bars (placeholder), body ${MODULES[1].bars}, built on ConNext ${MODULES[2].bars}, install ${MODULES[3].bars}. Captions on frames, picture on the grid; every caption held max(1.5 s, 0.4 s x words).`,
	words: WORDS,
	title: 'Modular: opening, one take, built on ConNext, install (16:9)',
	logline: 'After the shared Conduction opening, one unbroken camera move through a honeycomb of apps: it opens on your client in Nextcloud, pulls back as their files, mail, calendar and chats settle round them, pushes into Filinq to watch the contract fill itself in, travels east into Portaliq where your client signs, then lifts out to the lane under the row, where you draw what happens next: the signing done, a task for the right person, a notification. The camera follows that line into Nextcloud, where the right person hears about it, and on into the assistant, where your apps hand it their records and their actions: you ask, it answers and proposes a change, and the change waits until you allow it. The shared closing pieces follow: everything built on ConNext, and where to install it.',
	references: [
		{ name: 'Claude mobile tools: Figma, Canva, Amplitude', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'The one-take glide: no cuts, the camera pushes into a card until the UI is large, holds, glides to the next card; never cuts on a word.' },
		{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells that step between states, one orange active cell; the built-on cluster assembling cell by cell.' },
		{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A centre record with partners settling into the first ring as the camera pulls back; the data layer with its links settling round it in the closing piece.' },
	],
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
}

/* ---------- Shared layout: one type anchor for the whole take ---------- */

export const TX = 120
const HEAD = 96

/** Every body caption's type, as the film sets it too. */
export const TYPE = {
	s1: { text: 'Open a client\nin Nextcloud.', size: 110, y: 500, lineHeight: 1.03, fill: C.white },
	s3: { text: 'The contract\nfills itself in.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s4: { text: 'Your client\nsigns.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s5: { text: 'You draw what\nhappens next.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.white },
	s6: { text: 'The right person\nhears about it.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.white },
	s7: { text: 'Ask. It answers\nand acts for you.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s7b: { text: 'It only does\nwhat you allow.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
}
export const MARK = { s2: { y: 480, h: 120 } }

function headline(g, key) {
	const { text, size, y, lineHeight, fill } = TYPE[key]
	return textBlock(g, text, { x: TX, y, size, weight: 700, fill, lineHeight, tracking: -0.02 })
}

function wordmark(g, y, h, id = 'wordmark-connext-white') {
	const [mw, mh] = MARK_BOX[id]
	el('use', { href: `#${id}`, x: TX - 3, y, width: (mw * h) / mh, height: h }, g)
}

/* ---------- Camera stops (world point x,y lands on screen px,py at zoom z) ---------- */

const [FX, FY] = cellXY(-1, 1)
const Z = 12

export const CAM = {
	s1: camOn(0, 0, 1320, 540, 2.3),
	s2: camOn(0, 0, 1100, 540, 0.85),
	s3: camAt(FX, FY, 960 + -PAGE.x * Z, 196 + -PAGE.y * Z, Z),
	s4: camOn(0, 1, 1370, 540, 13),
	// Flows: the story row and the lane under it fill the right of the frame; the client sits above.
	s5: camAt(137, 0, 1360, 230, 1.1),
	s6: camOn(1, 1, 1390, 590, Z),
	// The assistant a touch further out than the other close-ups (zoom 10.8), so the rail and the chat
	// both fit right of the caption (the card starts at x 893); the white hex still covers the whole
	// left of the frame (its left side at x -13).
	s7: camOn(2, 1, 1390, 540, 10.8),
}
export const DRIFT = { s7: 0.012 }
CAM.s7b = { ...CAM.s7, z: CAM.s7.z * Math.exp(DRIFT.s7 * (T.key7b - T.key7)) }

/**
 * Cell states. page / phone / desk / chat are the UI inside Filinq, Portaliq,
 * Nextcloud and Hermiq for that moment; quiet dims every cell the flow does not
 * touch (the flows beat).
 */
function world({ active = false, page = {}, phone = {}, desk = {}, chat = {}, quiet = null } = {}) {
	return (q, r, { k, d }) => {
		const id = RING[k]
		if (!id) return ghost(d)
		const dim = quiet && !quiet.includes(id) ? 0.22 : undefined
		if (id === 'filinq') return appCell(id, { keepGlyph: true, innerOver: true, dim, inner: (g, wx, wy) => contractPage(g, wx, wy, page) })
		if (id === 'portaliq') return appCell(id, { dim, inner: (g, wx, wy) => portalPhone(g, wx, wy, phone) })
		if (id === 'nextcloud') return appCell(id, { innerIn: [260, 460], dim, inner: (g, wx, wy) => ncDesk(g, wx, wy, desk) })
		if (id === 'hermiq') return appCell(id, { innerIn: [260, 460], dim, inner: (g, wx, wy) => assistantDesk(g, wx, wy, chat) })
		return appCell(id, { active: active && k === '0,0', dim })
	}
}
const onlyClient = (q, r, { k, d }) => (k === '0,0' ? appCell('pipelinq') : ghost(d))

/** Where the one orange sits in each close-up (the others are drawn without it). */
const QUIET = { page: { filled: 3 }, phone: { signed: true, accent: false }, desk: { badge: false }, chat: { accent: false, appr: 0 } }

const L = T.land
const O = START.body
/** A caption's rise, in seconds (4 frames). */
const F4 = 4 / FPS

export const boards = [
	/* ------------------------------------------------------------ opening */
	{
		id: 'op',
		title: 'Conduction opening (shared module)',
		start: 0,
		end: START.body,
		key: 1.9,
		bars: span(0, START.body),
		words: '',
		motion: `Placeholder. The shared Conduction opening is being built by another agent (preview/films/opening/), the same sting in front of every film: a hex canvas in Conduction's identity; a ripple runs to a hex holding all the app icons, a second ripple turns them away (stepped, scaled or faded off, never rotated) and the company name appears. Its length here is ${MODULES[0].bars} bars (${s(LEN.opening)} s) until that module lands; every later time on this board moves by the difference, in whole bars. Hand-over: the opening ends on the Conduction cobalt, which is the body's ground, so the body's first frame (the caption and the client cell) can rise on the next downbeat without a fade.`,
		sound: 'Set by the opening module: electricity connecting (crackle, arc, hum, power-on). The body\'s pad enters on its first downbeat.',
		apps: [],
		borrow: 'Set by the opening module.',
		layer: 'brand',
		module: 'opening',
		claim_source: 'No claim: the company name only.',
		draw(ctx) {
			const { g } = ctx
			el('rect', { width: ctx.W, height: ctx.H, fill: C.cobalt900 }, g)
			for (let q = -9; q <= 9; q++) for (let r = -5; r <= 5; r++) {
				const [x, y] = [960 + 104 * 1.732 * (q + r / 2), 540 + 104 * 1.5 * r]
				if (x < -100 || x > 2020 || y < -100 || y > 1180) continue
				el('path', { d: hexPath(x, y, 96, 9), fill: C.cobalt800 }, g)
			}
			const [mw, mh] = MARK_BOX['wordmark-conduction-white']
			const h = 110
			el('use', { href: '#wordmark-conduction-white', x: 960 - (mw * h) / mh / 2, y: 420, width: (mw * h) / mh, height: h }, g)
			textBlock(g, 'Placeholder: the shared Conduction opening module', { x: 960, y: 640, anchor: 'middle', size: 34, weight: 500, family: 'IBM Plex Mono', fill: C.cobalt200, tracking: 0, clip: false })
		},
	},

	/* ------------------------------------------------------------------ s1 */
	{
		id: 's1',
		title: 'Close on your client',
		start: O,
		end: b(T.openOut),
		key: O + 0,
		bars: span(O, b(T.openOut)),
		words: TYPE.s1.text,
		motion: `The body's first frame, on the downbeat after the opening: the caption set in the left column, the camera close on one white cell on the right (the client, Pipelinq glyph, centre x 1320, zoom 2.30), its neighbours only dark honeycomb bleeding off the edges. It arrives on the downbeat after the opening as a cut, with the caption already set (round 3's frame 1, unchanged), unless the opening module hands over with a hex cut; either way the caption is fully up on the body's first frame, so its 2.0 s hold starts there. The camera never rests: a slow push about the cell centre (zoom 2.30 to 2.36 across a bar). The caption holds from ${sb(0)} to ${sb(T.openOut)} (five words, 2.0 s needed). Out: at ${sb(T.openOut)} the caption leaves upward through its line clips in 4 frames as the push turns into the pull back; the world moves on the right and never crosses the type.`,
		sound: 'Pad bed enters on the downbeat, gentle after the opening\'s power-on. A whoosh from ' + sb(1.7) + ' swells into the pull back.',
		apps: ['pipelinq'],
		borrow: 'X Ticker: the centre record, before the ring arrives. Claude mobile tools: the camera is already moving on the first frame.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 2 (open a client) and truth 10 (it runs in your own Nextcloud)',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s1, onlyClient)
			headline(g, 's1')
		},
	},

	/* ------------------------------------------------------------------ s2 */
	{
		id: 's2',
		title: 'Their files, mail, calendar and chats settle round them',
		start: b(T.openOut),
		end: b(T.push[0]),
		key: b(T.key2),
		bars: span(b(T.openOut), b(T.push[0])),
		words: '',
		motion: `Unchanged from round 3. No caption: fast picture, and the brand. The pull back runs ${sb(T.pull[0])} to ${sb(T.pull[1])} (zoom 2.30 to 0.85 on log zoom) while the client drifts left from x 1320 to 1100. On the sixteenths from ${sb(L['0,-1'])} the cells fly in oversized along a honeycomb axis and pop into place (spring, zeta 0.6): Nextcloud Files (${sb(L['0,-1'])}), Mail (${sb(L['1,-1'])}), Calendar (${sb(L['1,0'])}), Talk (${sb(L['-1,0'])}), Filinq and Portaliq (${sb(L['-1,1'])}), then the Nextcloud workspace hex and Hermiq as one train along the story row (${sb(L['1,1'])}). As the story row lands the client cell steps from white to orange: the one active cell. The ConNext wordmark (h 120) rises in the left column at ${sb(T.wmIn)}. Out: at ${sb(T.push[0])} the camera turns into a push, aimed at the Filinq cell; the wordmark rides out with the world; the client cell steps back to white as the orange is handed on.`,
		sound: 'Whoosh through the pull. Six ticks as the apps land, pitched up the scale. Pluck as the centre turns orange. Offbeat bass enters.',
		apps: ['pipelinq', 'nc-files', 'nc-mail', 'nc-calendar', 'nc-talk', 'filinq', 'portaliq', 'nextcloud', 'hermiq'],
		borrow: 'X Ticker: partners fly in oversized and settle into the first ring as the camera pulls back. Firecrawl: one orange active cell.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 2: open a client and their files, mails, meetings and chats are right there (story.json mechanics[1]; OpenRegister 2.1.0 links a record to Files, Mail, Calendar and Talk, round4/facts.json fact a).',
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
		motion: `Unchanged from round 3. At ${sb(T.push[0])} the camera pushes into the Filinq cell (zoom 0.85 to 11.3 by ${sb(T.push[1])}, then on to 12). The white Filinq hex becomes the ground and its glyph's document border frames the page on the right. The caption rises in cobalt at ${sb(T.s3In)}, both lines together, and holds to ${sb(T.hop1[0])} (2.0 s). The rows fill one per beat, each value arriving next to the Pipelinq glyph of the client it came from: the name (${sb(T.fill[0])}), the address (${sb(T.fill[1])}), the amount typing from ${sb(T.fill[2])}, its last digit landing with the orange caret (${sb(T.amountLands)}). Out: at ${sb(T.hop1[0])} the caption leaves and the camera hops east into the next cell along the row (lift to about zoom 3.4, ${s(T.hop1[1] - T.hop1[0])} s).`,
		sound: 'Kick enters. Whoosh on the push. Three plucks as the rows fill, soft ticks as the digits type, a tick as the caret lands.',
		apps: ['filinq', 'pipelinq'],
		borrow: 'Claude mobile tools: push into one card until its content is large, hold, never cut on a word.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 5: pick a client and a template and the contract fills itself in, from the client\'s details (Filinq + Pipelinq)',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s3, world({ ...QUIET, page: { filled: 3, caret: true }, phone: { signed: false } }))
			headline(g, 's3')
		},
	},

	/* ------------------------------------------------------------------ s4 */
	{
		id: 's4',
		title: 'Inside Portaliq: your client signs, in one portal',
		start: b(T.hop1[0]),
		end: b(T.flowOut[0]),
		key: b(T.key4),
		bars: span(b(T.hop1[0]), b(T.flowOut[0])),
		words: TYPE.s4.text,
		motion: `Unchanged from round 3 until its exit. The hop lands inside Portaliq at ${sb(T.hop1[1])} and settles on the phone (zoom 13). The caption rises at ${sb(T.s4In)} and holds to ${sb(T.flowOut[0])} (1.5 s). In the client's portal the contract waits with an empty signature box; below it an invoice and a quote from Shillinq and a request from Pipelinq. At ${sb(T.tap)} the tap; at ${sb(T.sig)} the signature is drawn into the box in three frames, the one orange. Out, new: at ${sb(T.flowOut[0])} the caption leaves and the camera does not hop east; it pulls straight up and out of the cell to the flow lane under the story row (next board).`,
		sound: 'Riser from the landing into the tap. Impact plus a bright pluck on the tap, a tick as the signature lands.',
		apps: ['portaliq', 'filinq', 'shillinq', 'pipelinq'],
		borrow: 'Claude mobile tools: glide to the next card, phone-centred, push in and hold.',
		layer: 'general',
		module: 'body',
		claim_source: 'Truth 6: the client gets a link and signs in their portal on their phone (Filinq + Portaliq). Truth 4: one portal shows items from every app you run, shown, not captioned.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s4, world({ ...QUIET, phone: { signed: true, tap: true } }))
			headline(g, 's4')
		},
	},

	/* ------------------------------------------------------------------ s5 */
	{
		id: 's5',
		title: 'FLOWS: you draw what happens next',
		start: b(T.flowOut[0]),
		end: b(T.pushNc[0]),
		key: b(T.keyFlows),
		bars: span(b(T.flowOut[0]), b(T.pushNc[0])),
		words: TYPE.s5.text,
		motion: `New in round 4. From ${sb(T.flowOut[0])} the camera pulls straight up and out of Portaliq (zoom 13 to 1.1 by ${sb(T.flowOut[1])}, ease.brand on log zoom) until the story row sits across the middle of the right of the frame, the client above it, and under the row an empty lane. As it settles, every cell the flow will not touch dims to a fifth (a step, not a fade: two frames), so Filinq and the Nextcloud workspace hex stand lit. The caption rises in white on the cobalt at ${sb(T.s5In)}, both lines together, and holds to ${sb(T.s5Out)} (${s(T.s5Out - T.s5In - F4)} s, five words need 2.0). Then the customer draws, in the design system's FlowMock language: on ${bb(b(T.trig))} (${sb(T.trig)}) the trigger node (mint kind bar, Filinq's glyph: the signing is complete) drops onto the lane under Filinq and a short edge draws up to Filinq's foot, a mint dot where it meets; its edge draws along the lane (${sb(T.edge1[0])} to ${sb(T.edge1[1])}) and on ${bb(b(T.task))} the task node lands (lavender, an avatar: the task for the right person). On ${bb(b(T.lift))} the next step is picked up, the bell on its card, and carried along the lane with a flat 2D shadow; on ${bb(b(T.slot))} its dashed slot shows under the Nextcloud hex, the one orange (you decide what happens next); on ${bb(b(T.drop))} it drops in with a tick, the dashed edge turns solid, the orange goes, and from ${sb(T.into[0])} its edge climbs into the Nextcloud hex (a mint dot at its foot on ${bb(b(T.into[1]))}). Nothing runs in this beat and nothing is pre-built: we watch it being drawn. Out: at ${sb(T.s5Out)} the caption leaves through its clips; on ${bb(b(T.pushNc[0]))} the dimmed cells step back up and the camera follows the new edge up into the Nextcloud hex.`,
		sound: 'Whoosh on the pull up. A soft thud as each node lands (trigger, task), a pencil-light scratch as each edge draws, a lift swish as the step is picked up, a tick as it drops into its slot, a rising pluck as the edge climbs into Nextcloud. Claps enter on the drop.',
		apps: ['filinq', 'nextcloud', 'portaliq', 'pipelinq'],
		borrow: 'Firecrawl: cells step between states (the untouched cells dim to a fifth). Claude mobile tools: the camera pulls back out of a card and glides on without a cut.',
		layer: 'general',
		module: 'body',
		claim_source: 'story.json ecosystem_mechanics[7] and bible truth 8: set it up once; when something happens the next task lands on the right desk and the right person gets a message; no flow comes pre-built, the customer draws each one (openregister v2.1.0 flow engine: TriggerObjectNode, UserTaskNode, SendNotificationNode). The trigger watches a real record event: Filinq v0.2.0 keeps signing requests as records with status COMPLETED (lib/Settings/filinq_register.json). round4/facts.json c.',
		draw(ctx) {
			const { g } = ctx
			const wg = drawWorld(g, CAM.s5, world({ ...QUIET, phone: { signed: true, accent: false }, quiet: ['filinq', 'nextcloud'] }))
			flowLane(wg, { lift: 0.35, slot: 1, into: 0 })
			headline(g, 's5')
		},
	},

	/* ------------------------------------------------------------------ s6 */
	{
		id: 's6',
		title: 'Inside Nextcloud: the right person hears about it',
		start: b(T.pushNc[0]),
		end: b(T.hop3[0]),
		key: b(T.key6),
		bars: span(b(T.pushNc[0]), b(T.hop3[0])),
		words: TYPE.s6.text,
		motion: `The round-3 bell, now reached by the flow. From ${sb(T.pushNc[0])} the camera pushes up along the new edge into the Nextcloud workspace hex (zoom 1.1 to 12 by ${sb(T.pushNc[1])}): the white Nextcloud mark grows past the frame and fades as a colleague's Nextcloud comes up in its place (the UI fades in with the zoom). Nextcloud's own header runs across the top on its own blue: the app shelf left, the bell (the Lucide bell) and who is signed in right. The caption rises in white on the workspace blue at ${sb(T.s6In)}, once the blue fills the column, and holds to ${sb(T.hop3[0])} (2.42 s). On ${bb(b(T.badge))} (${sb(T.badge)}) the bell's badge pops (a small orange hex: the one orange) and the popover drops open; on ${bb(b(T.notice))} (${sb(T.notice)}) the new notice slides in on top, marked with the Filinq glyph, pushing a shared file and a chat mention down: the same bell they already use. Out: at ${sb(T.hop3[0])} the caption leaves and the camera hops east into the assistant (${s(T.hop3[1] - T.hop3[0])} s).`,
		sound: 'Whoosh on the push. A small bell as the badge pops, a soft tick as the notice slides in.',
		apps: ['nextcloud', 'filinq', 'nc-files', 'nc-talk'],
		borrow: 'Claude mobile tools: glide to the next card and hold on the proof. Firecrawl: one orange active cell, here the badge.',
		layer: 'general',
		module: 'body',
		claim_source: 'story.json ecosystem_mechanics[8]: the right colleague hears about it in the same Nextcloud notification bell (shipped, openregister v2.1.0 AnnotationNotificationDispatcher and the flow\'s SendNotificationNode). The Filinq glyph on the notice is now explained on screen: it is the flow the customer drew in s5.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s6, world({ ...QUIET, desk: { badge: true, fresh: true } }))
			headline(g, 's6')
		},
	},

	/* ------------------------------------------------------------------ s7 */
	{
		id: 's7',
		title: 'The assistant: your apps hand it their records and their actions; you ask',
		start: b(T.hop3[0]),
		end: b(T.s7Out),
		key: b(T.key7),
		bars: span(b(T.hop3[0]), b(T.s7Out)),
		words: TYPE.s7.text,
		motion: `Reworked in round 4 so the mechanism shows. The hop lands one cell east at ${sb(T.hop3[1])}, inside the assistant, a little further out than the other close-ups (zoom 10.8) so both of its panels fit right of the caption. The caption rises in cobalt at ${sb(T.s7In)} and holds to ${sb(T.s7Out)} (2.83 s, seven words need 2.8). Left, on cobalt-50, the rail: what your apps hand the assistant. On ${bb(b(T.rail[0]))} (${sb(T.rail[0])}) Pipelinq's glyph flies in from the left edge of the frame (where the ring was) and lands at the top of the rail, its records (a small table) and its actions (two pills, each with a switch, both on) stepping in under it a sixteenth apart; a sixteenth later (${sb(T.rail[1])}) Filinq's block lands the same way (one action on, one off). Right, the chat: on ${bb(b(T.ask))} your question pops in; typing dots for two sixteenths; on ${bb(b(T.answer))} the answer grows, two client rows with the Pipelinq glyph landing a sixteenth apart: read from the records the rail just showed. No orange yet: the answer is the proof. On ${bb(b(T.propose))} (${sb(T.propose)}) the next turn starts to land (next board).`,
		sound: 'Whoosh on the hop. Two soft thuds as the app blocks land, a click per switch. A soft pluck as the answer lands, a tick per row.',
		apps: ['hermiq', 'pipelinq', 'filinq'],
		borrow: 'Claude mobile tools: glide to the next card, push in and hold on the proof.',
		layer: 'general',
		module: 'body',
		claim_source: 'round4/facts.json fact b: records reach the assistant as tools (openregister v2.1.0 ObjectsToolProvider) and apps hand it actions as #[McpTool] methods (Pipelinq 0.5.1: 9, among them createLead and logContactmoment; Filinq 0.2.0: 17). Only apps that declare actions are in the rail (Shillinq, Dossiq and Decidiq declare none). No assistant is named in the copy; the Hermiq hex carries the picture, the app that ships the approval gate (and that Nextcloud\'s own Assistant runs on when an admin picks it).',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s7, world({ ...QUIET, chat: { appr: 0, accent: false } }))
			headline(g, 's7')
		},
	},

	/* ----------------------------------------------------------------- s7b */
	{
		id: 's7b',
		title: 'The assistant: the change waits until you allow it',
		start: b(T.s7Out),
		end: START.builtOn,
		key: b(T.key7b),
		bars: span(b(T.s7Out), START.builtOn),
		words: TYPE.s7b.text,
		motion: `The same cell, the same camera, pushing in slowly. On ${bb(b(T.propose))} (${sb(T.propose)}) the change it wants to make lands under the answer: its pending pip, a line of greeked text, Not now (ghost) and Allow (cobalt primary) with an orange ring round it, the one orange, waiting. As it lands, the action it would use lights in the rail (Pipelinq's first action gets a cobalt ring) and a dotted line ties the two: it can only reach for what your apps handed it and you switched on. "Ask. It answers and acts for you." leaves at ${sb(T.s7Out)} (3 frames); two clear frames later "It only does what you allow." rises in its place (${sb(T.s7bIn)}) and holds to ${sb(T.s7bOut)} (2.42 s). On ${bb(b(T.allow))} (${sb(T.allow)}) you allow it: Allow presses (scale 0.96), the ring goes; on ${bb(b(T.done))} the change lands, its pip steps to mint, the buttons fold away and a new row with a mint pip appears in Pipelinq's records in the rail: it acted where you allowed it. Out: at ${sb(T.s7bOut)} the caption leaves, and from ${sb(T.pullEnd[0])} the camera pulls straight out of the assistant, past the ring, as the whole honeycomb comes into view and settles by ${s(START.builtOn)}: the hand-over to the closing piece, which opens on the same cobalt.`,
		sound: 'A held note as the change waits, unresolved. A soft click as Allow presses, a resolving pluck as the change lands. Riser into the pull out.',
		apps: ['hermiq', 'pipelinq', 'filinq'],
		borrow: 'Claude mobile tools: hold on the proof; the caption changes, the camera does not.',
		layer: 'general',
		module: 'body',
		claim_source: 'round4/facts.json fact b: Hermiq 0.2.0 offers an agent only the tools its owner granted and holds any write it was not granted for a person\'s approval (lib/Service/Engine/FacadeToolInvoker.php:448-492, :975-986, :1079-1132); OpenRegister runs every call as the signed-in user. "It only does what you allow." is the part that is always true. Ruben\'s "it always asks before it changes anything" is not what ships (a granted write runs without a prompt), so the ask is shown, not captioned. story.json mechanics[12].',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s7b, world({ ...QUIET, chat: { appr: 1, accent: true } }))
			headline(g, 's7b')
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
		motion: `The shared closing piece, its own scene, the same in every film (_lib/scenes/closing.js builtOnFrame). It opens on the cobalt the body ended on. On the downbeat (${s(at('builtOn', BO.nextcloud))}) the Nextcloud workspace hex lands low on the right at 1.4x and settles in 0.2 s, and the ground rows of the honeycomb step on either side of it, dark, off the foot of the frame: the ground. On the next beat (${s(at('builtOn', BO.layer))}) the common data layer (a forest hex, the data family, with its glyph and no name) drops onto it from above and settles two rows up. "Built on" rises in the left column (${s(at('builtOn', BO.typeIn))}) and the ConNext wordmark a sixteenth behind it, held to the end of the piece (${s(LEN.builtOn - BO.typeIn - F4)} s; two words need 1.5). From ${s(at('builtOn', BO.ring[0]))} the Nextcloud apps the data layer links a record to pop in round it one a sixteenth (Files, Mail, Calendar, Deck, Contacts, Talk), then Tasks (${s(at('builtOn', BO.tasks))}), then four quieter outer cells at half strength (Activity, Polls, Photos, Forms): there are more, and we do not count them. On ${bb(at('builtOn', BO.top))} the film's app lands on top, above the data layer: in an app film its hex is orange (the one orange) with its name as a small label; the ConNext film puts the apps of its story there (Pipelinq, Filinq, Portaliq) as cobalt cells with a white ring, and has no orange here. Out: on the next downbeat the cluster shrinks toward the top right, where the install board keeps the Nextcloud hex, and everything but that hex steps off.`,
		sound: 'A low thud as Nextcloud lands, a second as the data layer settles on it, a rising run of ticks as the apps pop in round it, a bright pluck as the top row lands.',
		apps: ['nextcloud', 'openregister', ...NC_LINKS.map((l) => `nc-${l.id}`), 'pipelinq', 'filinq', 'portaliq'],
		borrow: 'X Ticker: a centre with partners settling round it. Firecrawl: cells stepping on in sequence.',
		layer: 'brand',
		module: 'builtOn',
		claim_source: 'round4/facts.json fact a: OpenRegister 2.1.0 (latest stable) links a record to Nextcloud Files, Mail, Calendar, Contacts, Talk, Deck and Tasks, and more (Activity, Polls, Photos, Forms, ...) through its IntegrationRegistry providers (lib/AppInfo/Application.php:4300-4397). Each switches on when its Nextcloud app is installed. Nextcloud Notes is not shown (OpenRegister\'s Notes are comments on the record). story.json mechanics[0] (all apps keep their records in one place, on your own server).',
		draw(ctx) {
			builtOnFrame(ctx, { apps: ['pipelinq', 'filinq', 'portaliq'] })
		},
	},

	/* ------------------------------------------------------------------ in */
	{
		id: 'in',
		title: 'Install from the Nextcloud app store (shared install board)',
		start: START.install,
		end: DURATION,
		key: at('install', IN.key),
		bars: span(START.install, DURATION),
		words: `${INSTALL.call}\n${INSTALL.line}`,
		motion: `The shared install board, its own scene, the same in every film (_lib/scenes/closing.js installFrame). The Nextcloud hex from the closing piece arrives top right in a quiet honeycomb (in an app film the app's hex sits on it, orange: on cobalt the app hex and the call may both be orange). The ConNext wordmark holds top left. The install call rises at ${s(at('install', IN.call))}, orange text at headline size on two lines, "Nextcloud" orange too, line 2 a sixteenth behind: the frame's one orange. On ${bb(at('install', IN.line1))} (${s(at('install', IN.line1))}) "100% open source. Free to use." rises under it in white, smaller; on ${bb(at('install', IN.line2))} (${s(at('install', IN.line2))}) "Pay for an SLA when your company grows." All three hold to the end, ${s(DURATION)} (the call up ${s(LEN.install - IN.call - F4)} s for 2.4 needed; line 1 ${s(LEN.install - IN.line1 - F4)} s for 2.4; line 2 ${s(LEN.install - IN.line2 - F4)} s for 3.2). No fade at the end.`,
		sound: 'Impact as the call rises, the bell (the sonic logo) on the second line, the pad resolving to the end.',
		apps: ['nextcloud'],
		borrow: 'Claude mobile tools: hold on the end card. Firecrawl: the logo holds while the honeycomb is quiet.',
		layer: 'brand',
		module: 'install',
		claim_source: `The bible's fixed CTA. ${Object.entries(INSTALL.sources).map(([k, v]) => `"${k}": ${v}`).join(' ')}. Each sentence is under 16 words (3, 3 and 8).`,
		draw(ctx) {
			installFrame(ctx, {})
		},
	},
]
/** For the checks: the key cameras. */
export const _debug = { CAM, hexDist }
