/**
 * Direction A, "One take", re-composed for 16:9 (1920 x 1080) after Ruben's
 * decisions of 2026-09-27: one continuous camera move through a single
 * honeycomb, no hard cuts, with two more beats (the right person hears about
 * it, in the Nextcloud bell; ask about your clients, and it asks first), no
 * brown anywhere, and the install call as orange text.
 *
 * Round 3 (approved for animation, 2026-09-27): the film runs 18.75 s = 10
 * bars at 128 BPM, 24 fps (every bar exactly 45 frames); the hops get air
 * (moves of 0.6 to 0.9 s instead of third-of-a-second whips); the assistant
 * beat adds "It asks first." (a second key frame, s6b, in the same cell); the
 * install call is one whole line of orange text ("Nextcloud" orange there
 * too), so the end card becomes a lockup along the foot of the frame; the
 * bell is the Lucide bell (#icon-bell). All times come from ./timing.js,
 * which the film reads too.
 *
 * Every board draws the same world (./world.js); only the camera and the cell
 * states change, so the key frames are the camera stops the animation glides
 * between. The product UI lives in the world (./ui.js), inside the cells of
 * the apps that show it. The landscape frame gives the take one long lateral
 * move: after the push into Filinq the camera travels east along one row of
 * the honeycomb, cell by cell (Filinq, Portaliq, Nextcloud, Hermiq), then
 * pulls out to the whole honeycomb and pushes back in on the client.
 *
 * Layout: every caption sits in the left column (x 120 to about 840, inside
 * the safe box y 96 to 930); the world and its UI own the right 55 to 60%.
 * The end card's install call is the one line that runs wider: it sits along
 * the foot of the safe box, under the honeycomb.
 *
 * boards/A (the approved 9:16 record) is left untouched.
 */
import { el, textBlock } from '../../../_lib/stage.js'
import { C } from '../../../_lib/brand.js'
import { MARK_BOX } from '../../../_lib/assets.js'
import { RING, WIDER, appCell, ghost, drawWorld, camOn, camAt, cellXY, hexDist } from './world.js'
import { PAGE, contractPage, portalPhone, ncDesk, assistantChat } from './ui.js'
import { T, BPM, FPS, DURATION, BAR, BARS, CAPTIONS, words } from './timing.js'

const s = (t) => t.toFixed(2)
/** Bar.beat of a time, as the storyboard writes it; a scene's end is exclusive. */
const bb = (t) => { const b = Math.floor(t / (60 / BPM) + 1e-6); return `${Math.floor(b / 4) + 1}.${(b % 4) + 1}` }
const span = (a, b) => `${bb(a)}-${bb(b - 1e-4)}`
const WORDS = CAPTIONS.reduce((a, c) => a + words(c.text), 0)

export const meta = {
	id: 'A16',
	format: '16x9',
	fps: FPS,
	bpm: BPM,
	bars: BARS,
	duration: DURATION,
	timing: `${DURATION} s = ${BARS} bars at ${BPM} BPM, ${FPS} fps (450 frames, 45 per bar). Captions on frames, picture on the grid; every caption held max(1.5 s, 0.4 s x words).`,
	words: WORDS,
	title: 'One take (16:9)',
	logline: 'One unbroken camera move through a honeycomb of apps: it opens on your client in Nextcloud, pulls back as their files, mail, calendar and chats settle round them, pushes into Filinq to watch the contract fill itself in, then travels east along one row, cell by cell: into Portaliq where your client signs, into Nextcloud where the right colleague hears about it in the bell, into Hermiq where you ask about your clients and it asks first, and pulls out to the whole honeycomb and where to install it, landing back on frame 1.',
	references: [
		{ name: 'Claude mobile tools: Figma, Canva, Amplitude', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'The one-take glide: no cuts, the camera pushes into a card until the UI is large, holds, glides to the next card; never cuts on a word.' },
		{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells that step between states, one orange active cell, and cells stepping off in sequence before the logo holds.' },
		{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A centre record with partners settling into the first ring as the camera pulls back; a push through the ring into UI proof.' },
	],
	background: C.cobalt,
	// The bible's text safe box: x 120 to 1800, y 96 to 930 (the bottom 150 px stay free of words).
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
}

/* ---------- Shared layout: one type anchor for the whole take ---------- */

export const TX = 120
const HEAD = 96

/** Every caption's type, as the film sets it too: text, size, first baseline, line height, colour. */
export const TYPE = {
	s1: { text: 'Open a client\nin Nextcloud.', size: 110, y: 500, lineHeight: 1.03, fill: C.white },
	s3: { text: 'The contract\nfills itself in.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s4: { text: 'Your client\nsigns.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	s5: { text: 'The right person\nhears about it.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.white },
	s6: { text: 'Ask about\nyour clients.', size: HEAD, y: 480, lineHeight: 1.04, fill: C.cobalt },
	// One line, set on the optical centre of the two-line captions it follows.
	s6b: { text: 'It asks first.', size: HEAD, y: 530, lineHeight: 1.04, fill: C.cobalt },
	// The install call: all orange, Nextcloud included (round 3), on two lines at headline size so the
	// orange passes contrast as large text and reads as the payoff in a phone feed.
	cta: { text: 'Install from the\nNextcloud app store', size: 88, y: 800, lineHeight: 1.06, fill: C.orange },
}
/** The ConNext wordmark: in s2 (left column) and in the end card's lockup, above the install call. */
export const MARK = { s2: { y: 480, h: 120 }, end: { y: 606, h: 100 } }

function headline(g, key) {
	const { text, size, y, lineHeight, fill } = TYPE[key]
	return textBlock(g, text, { x: TX, y, size, weight: 700, fill, lineHeight, tracking: -0.02 })
}

function wordmark(g, y, h) {
	const [mw, mh] = MARK_BOX['wordmark-connext-white']
	el('use', { href: '#wordmark-connext-white', x: TX - 3, y, width: (mw * h) / mh, height: h }, g)
}

/**
 * The end card's type, identical in s7 and s8 because it holds still from
 * the pull out to 18.21 s: the wordmark, and under it the install call as
 * one line of orange text (no box, no marker, "Nextcloud" orange too). The
 * orange text is the frame's one orange.
 */
function endCard(g) {
	wordmark(g, MARK.end.y, MARK.end.h)
	headline(g, 'cta')
}

/* ---------- Camera stops (world point x,y lands on screen px,py at zoom z) ---------- */

const [FX, FY] = cellXY(-1, 1) // Filinq: the contract

/** Every close-up is at zoom 12, with the UI in the right 55 to 60% of the frame. */
const Z = 12

export const CAM = {
	s1: camOn(0, 0, 1320, 540, 2.3), // close on the client cell, right of the caption
	s2: camOn(0, 0, 1100, 540, 0.85), // pulled back: the ring and the story row fill the right of the frame
	s3: camAt(FX, FY, 960 + -PAGE.x * Z, 196 + -PAGE.y * Z, Z), // inside Filinq: the page's left edge at x 960, its top at y 196
	s4: camOn(0, 1, 1370, 540, 13), // one cell east, inside Portaliq: the phone stands right of the caption, a touch closer
	s5: camOn(1, 1, 1390, 590, Z), // one cell east, inside Nextcloud: its header across the top, the bell's popover right
	s6: camOn(2, 1, 1390, 540, Z), // one cell east, inside Hermiq: the chat right of the caption
	s7: camOn(0, 0, 1200, 530, 0.68), // pulled out: the whole honeycomb, right of the lockup and above the install call
}
/**
 * Rest drifts the film uses (log-zoom rate per second about the cell centre), so a key frame that
 * sits later in the same rest is the film's exact frame: the loop push (zoom 2.30 to 2.36 across a
 * bar) and the slow push into the assistant.
 */
export const DRIFT = { loop: Math.log(2.36 / 2.3) / BAR, s6: 0.02 }
CAM.s6b = { ...CAM.s6, z: CAM.s6.z * Math.exp(DRIFT.s6 * (T.key6b - T.key6)) } // the same cell, pushed a touch further: only the chat and the caption move on
CAM.s8 = { ...CAM.s1, z: CAM.s1.z * Math.exp(DRIFT.loop * (T.key8 - DURATION)) } // frame 1's picture, 0.65 s before the loop point: the loop only swaps the type

/**
 * Cell states. The ring and the story row are the story; everything else is
 * quiet honeycomb. page / phone / desk / chat are the UI inside Filinq,
 * Portaliq, Nextcloud and Hermiq for that moment.
 */
function world({ active = false, page = {}, phone = {}, desk = {}, chat = {}, extra = {} } = {}) {
	return (q, r, { k, d }) => {
		const id = RING[k] || extra[k]
		if (!id) return ghost(d)
		if (id === 'filinq') return appCell(id, { keepGlyph: true, innerOver: true, inner: (g, wx, wy) => contractPage(g, wx, wy, page) })
		if (id === 'portaliq') return appCell(id, { inner: (g, wx, wy) => portalPhone(g, wx, wy, phone) })
		if (id === 'nextcloud') return appCell(id, { innerIn: [260, 460], inner: (g, wx, wy) => ncDesk(g, wx, wy, desk) })
		if (id === 'hermiq') return appCell(id, { innerIn: [260, 460], inner: (g, wx, wy) => assistantChat(g, wx, wy, chat) })
		return appCell(id, { active: active && k === '0,0' })
	}
}
const onlyClient = (q, r, { k, d }) => (k === '0,0' ? appCell('pipelinq') : ghost(d))

/** Where the one orange sits in each close-up (the others are drawn without it). */
const QUIET = { page: { filled: 3 }, phone: { signed: true, accent: false }, desk: { badge: false }, chat: { accent: false } }

const L = T.land
export const boards = [
	/* ------------------------------------------------------------------ s1 */
	{
		id: 's1',
		title: 'Close on your client',
		start: 0.0,
		end: T.openOut,
		key: 0,
		bars: span(0, T.openOut),
		words: TYPE.s1.text,
		motion: `Frame 1 is already this frame, and so is the last frame of the film: the caption set in the left column, the camera close on one white cell on the right (the client, Pipelinq glyph, centre x 1320, zoom 2.30), its neighbours only dark honeycomb bleeding off the edges. No fade in. The camera never rests: a slow push about the cell centre (zoom 2.30 to 2.36 across a bar), the speed the end pushes at, so the loop is one move. The caption holds from 0.00 to ${s(T.openOut)} (five words, 2.0 s needed). Out: at ${s(T.openOut)}, the sixteenth after the bar 2 downbeat, the caption leaves upward through its line clips in 4 frames as the push turns into the pull back; in 16:9 the world moves on the right and never crosses the type.`,
		sound: 'Pad bed only, gentle, no stinger on frame 1; the pad from the end carries across the loop point. A whoosh from 1.70 swells into the pull back.',
		apps: ['pipelinq'],
		borrow: 'X Ticker: the centre record, before the ring arrives. Claude mobile tools: the camera is already moving on frame 1.',
		layer: 'general',
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
		start: T.openOut,
		end: T.push[0],
		key: T.key2,
		bars: span(T.openOut, T.push[0]),
		words: '',
		motion: `No caption: fast picture, and the brand. The pull back runs ${s(T.pull[0])} to ${s(T.pull[1])} (zoom 2.30 to 0.85 on log zoom, eased in so the opener has gone before the ground moves, then settling hard) while the client drifts left from x 1320 to 1100, so the ring and the row east of it land in the right of the frame, clear of the type column. On the sixteenths from ${s(L['0,-1'])} the cells fly in oversized along a honeycomb axis from the nearest frame edge that is not the type column, and pop into place with a small overshoot (spring, zeta 0.6): Nextcloud Files from the top (${s(L['0,-1'])}), Mail (${s(L['1,-1'])}) and Calendar (${s(L['1,0'])}) from the right, Talk from the top (${s(L['-1,0'])}), Filinq and Portaliq together from below (${s(L['-1,1'])}), then the Nextcloud workspace hex and Hermiq as one train along the story row from the right (${s(L['1,1'])}): the row the camera will travel. Each app already holds its UI: the Filinq glyph's page is the contract, the Portaliq square holds a phone. As the story row lands (${s(T.orange[0])}), with the ring closed, the client cell steps from white to orange: the one active cell. The ConNext wordmark (h 120) rises out of its clip in the left column at ${s(T.wmIn)}, once the pull back has all but settled. Out: on the last sixteenth of 2.3 (${s(T.push[0])}) the camera turns into a push, aimed at the Filinq cell (bottom left of the ring); the wordmark rides out with the world (it sits on empty honeycomb left of the ring, so it grows and leaves the left edge in about four frames, and no cell ever crosses it); the client cell steps back to white as the orange is handed on.`,
		sound: 'Whoosh through the pull. Six ticks as the apps land on the sixteenths, pitched up the scale, the last two doubled for the pairs. Pluck on 2.3 as the centre turns orange. Offbeat bass enters on bar 2.',
		apps: ['pipelinq', 'nc-files', 'nc-mail', 'nc-calendar', 'nc-talk', 'filinq', 'portaliq', 'nextcloud', 'hermiq'],
		borrow: 'X Ticker: partners fly in oversized and settle into the first ring as the camera pulls back. Firecrawl: one orange active cell.',
		layer: 'general',
		claim_source: 'Truth 2: open a client and their files, mails, meetings and chats are right there. The Nextcloud workspace hex is the bible\'s one workspace hex per scene.',
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
		start: T.push[0],
		end: T.hop1[0],
		key: T.key3,
		bars: span(T.push[0], T.hop1[0]),
		words: TYPE.s3.text,
		motion: `On the last sixteenth of 2.3 (${s(T.push[0])}) the camera pushes into the Filinq cell, fast out of the ring and then a long decelerating crawl (zoom 0.85 to 11.3 by ${s(T.push[1])}, ease.brand on log zoom, then on to 12 by ${s(T.key3)}). The push never leaves the world: the white Filinq hex becomes the ground, and its cobalt glyph grows with it until the glyph's document border frames the page on the right (page left edge at x 960, top at y 196) and the page is the contract. The caption rises in cobalt on the white ground at ${s(T.s3In)}, both lines together, once the hex has covered the type column, and holds to ${s(T.hop1[0])} (2.0 s). The rows fill one per beat, each value arriving next to the Pipelinq glyph of the client it came from (the glyph pops, the value grows out beside it): the name on bar 3 (${s(T.fill[0])}) as the kick enters, the address on 3.2 (${s(T.fill[1])}), the amount starts typing on 3.3 (${s(T.fill[2])}), a digit a sixteenth, and its last digit lands with the orange caret on 3.4 (${s(T.amountLands)}). The empty signature field waits below. Out: at ${s(T.hop1[0])} the caption leaves through its clips, riding with the world, and the camera hops east into the next cell along the row: a van Wijk hop that lifts to about zoom 3.4, so the two cells and the cobalt wall between them are in view for a moment, and dives straight back in, ${s(T.hop1[1] - T.hop1[0])} s, never a cut.`,
		sound: 'Kick enters on bar 3. Whoosh on the push. Three plucks as the rows fill (3.1, 3.2, 3.3), rising, soft ticks as the digits type, and a tick as the caret lands on 3.4.',
		apps: ['filinq', 'pipelinq'],
		borrow: 'Claude mobile tools: push into one card until its content is large, hold, never cut on a word. X Ticker: the push through the ring into UI proof.',
		layer: 'general',
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
		start: T.hop1[0],
		end: T.hop2[0],
		key: T.key4,
		bars: span(T.hop1[0], T.hop2[0]),
		words: TYPE.s4.text,
		motion: `The hop lands one cell east, inside Portaliq, at ${s(T.hop1[1])}: white hex to white hex through the cobalt wall, and the camera settles on the phone that sat in the Portaliq square all along (zoom 13, phone centre x 1370, sign button 81 px tall), then keeps a slow push about the button. The caption rises at ${s(T.s4In)}, as soon as the white Portaliq ground fills the type column, and holds to ${s(T.hop2[0])} (1.5 s). In the client's portal (their own header) the contract waits with an empty signature box; below it, what else the client sees in the same portal: an invoice and a quote from Shillinq and a request from Pipelinq (truth 4, carried by the picture). On 4.4 (${s(T.tap)}) the tap: the cobalt button presses (scale 0.97 and back) and two hex outlines step out from the tap point, one frame apart; 0.24 s later (${s(T.sig)}) the signature is drawn into the box in three frames, the one orange. Out: at ${s(T.hop2[0])} the caption leaves through its clips and the camera hops east again (${s(T.hop2[1] - T.hop2[0])} s).`,
		sound: 'Whoosh on the hop. Riser from the landing into the tap. Impact plus a bright pluck on the tap (4.4), then a tick as the signature lands.',
		apps: ['portaliq', 'filinq', 'shillinq', 'pipelinq'],
		borrow: 'Claude mobile tools: glide to the next card, phone-centred, push in and hold.',
		layer: 'general',
		claim_source: 'Truth 6: the client gets a link and signs in their portal on their phone (Filinq + Portaliq). Truth 4: one portal shows items from every app you run (Portaliq + Filinq, Shillinq, Pipelinq), shown, not captioned.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s4, world({ ...QUIET, phone: { signed: true, tap: true } }))
			headline(g, 's4')
		},
	},

	/* ------------------------------------------------------------------ s5 */
	{
		id: 's5',
		title: 'Inside Nextcloud: the right person hears about it',
		start: T.hop2[0],
		end: T.hop3[0],
		key: T.key5,
		bars: span(T.hop2[0], T.hop3[0]),
		words: TYPE.s5.text,
		motion: `The hop lands one cell east at ${s(T.hop2[1])}, inside the one Nextcloud workspace hex: the white Nextcloud mark grows past the frame and fades as a colleague's Nextcloud comes up in its place (the UI fades in with the zoom, screen radius 260 to 460 px, so it is already there as the camera arrives). Nextcloud's own header runs across the top on its own blue: the app shelf left, the bell (the Lucide bell) and who is signed in right. The caption rises in white on the workspace blue (4.2:1, headline size) at ${s(T.s5In)}, once the blue fills the type column, and holds to ${s(T.hop3[0])} (2.42 s). On 5.4 (${s(T.badge)}) the bell's badge pops (a small orange hex, 1.3x and settle: the one orange) and the popover drops open under the bell (0.2 s); on bar 6 (${s(T.notice)}) the new notice slides in on top, marked with the Filinq glyph (the contract just signed), pushing a shared file and a chat mention down: the same bell they already use. The camera drifts slowly toward the popover. Out: at ${s(T.hop3[0])} the caption leaves through its clips and the camera hops east again (${s(T.hop3[1] - T.hop3[0])} s).`,
		sound: 'Whoosh on the hop. A small bell as the badge pops (5.4), a soft tick as the notice slides in (bar 6). Claps enter on bar 6.',
		apps: ['nextcloud', 'filinq', 'nc-files', 'nc-talk'],
		borrow: 'Claude mobile tools: glide to the next card and hold on the proof. Firecrawl: one orange active cell, here the badge.',
		layer: 'general',
		claim_source: 'story.json ecosystem_mechanics[8]: "The right colleague hears about it in the same Nextcloud notification bell where they see a shared file or a chat mention" (shipped, openregister v2.1.0 AnnotationNotificationDispatcher; Filinq declares notification rules). A signature notifying someone is a rule or flow the customer sets up once (mechanics[7], truth 8); nothing here says pre-built.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s5, world({ ...QUIET, desk: { badge: true, fresh: true } }))
			headline(g, 's5')
		},
	},

	/* ------------------------------------------------------------------ s6 */
	{
		id: 's6',
		title: 'Inside Hermiq: ask about your clients',
		start: T.hop3[0],
		end: T.s6Out,
		key: T.key6,
		bars: span(T.hop3[0], T.s6Out),
		words: TYPE.s6.text,
		motion: `The hop lands one cell east at ${s(T.hop3[1])}, inside Hermiq: the white hex again, the sparkle glyph fading as the assistant comes up in its place (UI fades in with the zoom). The caption rises in cobalt at ${s(T.s6In)}, both lines together, once the white ground fills the column, and holds to ${s(T.s6Out)} (1.63 s). Your question is already in its bubble, right; the typing dots run while the camera lands; a sixteenth after 7.2 (${s(T.answer)}) the answer grows, left, its three rows landing a sixteenth apart, each a client with the Pipelinq glyph: read from your client records. The header shows what the assistant may do, as switches, one of them off. No orange yet: the answer is the proof.`,
		sound: 'Whoosh on the hop. A soft pluck as the answer lands, a tick per row.',
		apps: ['hermiq', 'pipelinq'],
		borrow: 'Claude mobile tools: glide to the next card, push in and hold on the proof.',
		layer: 'general',
		claim_source: 'story.json ecosystem_mechanics[12]: "Ask a question about your clients or quotes and get the answer instead of a report to build." (shipped: openregister v2.1.0 ObjectsToolProvider; Pipelinq declares 9 actions). Not shipped, never said: every app works with the assistant.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s6, world({ ...QUIET, chat: { answer: true, approval: false } }))
			headline(g, 's6')
		},
	},

	/* ----------------------------------------------------------------- s6b */
	{
		id: 's6b',
		title: 'Inside Hermiq: it asks first',
		start: T.s6Out,
		end: T.pullOut[0],
		key: T.key6b,
		bars: span(T.s6Out, T.pullOut[0]),
		words: TYPE.s6b.text,
		motion: `The same cell, the same camera, still pushing in slowly: the second half of the assistant beat. On bar 8 (${s(T.approval)}) the last turn lands under the answer: a change it asks you to allow, its pending pip the one orange, a ghost button and a cobalt primary beside it, nothing pressed. "Ask about your clients." leaves upward through its clips at ${s(T.s6Out)} (3 frames); two clear frames later "It asks first." rises in its place, one line on the column's optical centre (${s(T.s6bIn)}), and holds to ${s(T.s6bOut)} (1.5 s). Out: at ${s(T.s6bOut)} the caption leaves through its clips, and once it has gone (${s(T.pullOut[0])}) the camera pulls straight out of the cell (ease.brand on log zoom).`,
		sound: 'A held note on bar 8 as the approval waits, unresolved. Riser into the pull out.',
		apps: ['hermiq', 'pipelinq'],
		borrow: 'Claude mobile tools: hold on the proof; the caption changes, the camera does not.',
		layer: 'general',
		claim_source: 'story.json ecosystem_mechanics[12]: "The assistant only does what you allow and asks before it changes anything." (shipped: hermiq v0.2.0 ToolOversightController approval gates). Ruben, round 3: "It asks first."',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s6b, world({ ...QUIET, chat: { answer: true, approval: true, accent: true } }))
			headline(g, 's6b')
		},
	},

	/* ------------------------------------------------------------------ s7 */
	{
		id: 's7',
		title: 'Pull out: the whole honeycomb, and where to install it',
		start: T.pullOut[0],
		end: T.step[0],
		key: T.key7,
		bars: span(T.pullOut[0], T.step[0]),
		words: TYPE.cta.text,
		motion: `The pull out from ${s(T.pullOut[0])} keeps going past the ring (zoom 12 to 0.68 by ${s(T.pullOut[1])}) and the whole take is in view: the client in the middle, the ring round it and the row the camera just travelled. As it comes into view four more apps ripple on round it on the sixteenths after 9.2 (Integriq ${s(T.ripple[0])}, Decidiq ${s(T.ripple[1])}, Shillinq ${s(T.ripple[2])}, Buildiq ${s(T.ripple[3])}, filling the open cell in the story row): the honeycomb is wider than the story we saw. Every lit cell sits right of x 920 and above y 810, clear of the type. At ${s(T.ctaIn)}, once the cells travelling out from the left have passed the type, the end card rises out of its clips: the ConNext wordmark, and under it the install call as one line of orange text along the foot of the safe box, "Nextcloud" orange too, no box. It holds to ${s(T.ctaOut)} (2.42 s, six words). The call is the one orange (the client cell stays white; the approval pip handed it on as the call rose, when Hermiq was a few pixels wide).`,
		sound: 'Whoosh on the pull out, a fast run of ticks as the extra apps ripple on. Impact as the end card rises.',
		apps: ['pipelinq', 'nc-files', 'nc-mail', 'nc-calendar', 'nc-talk', 'filinq', 'portaliq', 'nextcloud', 'hermiq', 'integriq', 'decidiq', 'shillinq', 'buildiq'],
		borrow: 'Claude mobile tools: pull back out of the card and hold on the whole screen. Firecrawl: cells ripple between states.',
		layer: 'brand',
		claim_source: 'The bible\'s fixed CTA; every app shown has a release in the Nextcloud app store (story.json facts: 19 of 21, all but Humaniq and Planninq)',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s7, world({ ...QUIET, extra: WIDER }))
			endCard(g)
		},
	},

	/* ------------------------------------------------------------------ s8 */
	{
		id: 's8',
		title: 'The honeycomb steps off, back to your client',
		start: T.step[0],
		end: DURATION,
		key: T.key8,
		bars: span(T.step[0], DURATION),
		words: TYPE.cta.text,
		motion: `On bar 10 (${s(T.step[0])}) the lit cells step off in rings toward the centre, one ring per sixteenth (the outer cells ${s(T.step[0])}, the second ring ${s(T.step[1])}, the first ring ${s(T.step[2])}): each flashes pale (cobalt 200) for one step, dims for one, then settles to the resting dark cell, so the honeycomb empties inward onto the client, the last cell lit. Once the first ring has stepped off (10.2, ${s(T.pushIn[0])}) the camera pushes in on the client until it sits where frame 1 has it (centre x 1320, zoom 2.30 at the loop point, by ${s(T.pushIn[1])}), then keeps the slow push frame 1 continues at, so no lit cell is ever carried under the type. The end card holds still (the call clears the client cell by about 30 px). At ${s(T.ctaOut)} the end card leaves upward through its clips (3 frames); two clear frames later "Open a client in Nextcloud." rises into the left column (${s(T.openIn)}), fully up for the last frames. Loop: the last frame is frame 1's picture, the same cell at the same centre and zoom, pushing at the same speed, with the same caption. No fade at the end.`,
		sound: 'Bell (the sonic logo) on bar 10 as the rings step off, a hat tick per ring. The bed drops to pad for the hold; the pad carries across the loop point.',
		apps: ['pipelinq'],
		borrow: 'Firecrawl: cells step off in sequence and the logo holds. X Ticker: the centre record we started on is the last thing lit.',
		layer: 'brand',
		claim_source: 'The bible\'s fixed CTA; truth 10 (free, your own server) is implied by installing from the app store',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s8, onlyClient)
			endCard(g)
		},
	},
]

/** For the checks: the key cameras, and which cells a board lights. */
export const _debug = { CAM, hexDist }
