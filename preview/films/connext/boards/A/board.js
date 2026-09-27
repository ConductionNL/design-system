/**
 * Direction A, "One take": one continuous camera move through a single
 * honeycomb, no hard cuts. Every board draws the same world (./world.js) and
 * only the camera and the cell states change, so the approved key frames are
 * the camera stops the animation glides between. The product UI lives in the
 * world too (./ui.js), inside the cells of the apps that show it, so every
 * push reveals UI that was already there at ring scale.
 *
 * Grid: 128 BPM, beat 0.46875 s, bar 1.875 s. Scene times are the grid times
 * snapped to the nearest 25 fps frame.
 */
import { el, textBlock } from '../../../_lib/stage.js'
import { hexPath } from '../../../_lib/core.js'
import { C } from '../../../_lib/brand.js'
import { MARK_BOX } from '../../../_lib/assets.js'
import { RING, appCell, ghost, drawWorld, camOn, camAt, cellXY } from './world.js'
import { PAGE, contractPage, portalPhone } from './ui.js'

export const meta = {
	id: 'A',
	title: 'One take',
	logline: 'One unbroken camera move: it opens on your client in Nextcloud, pulls back as their files, mail, calendar and chats settle round them, pushes into Filinq to watch the contract fill itself in from the client\'s details, glides next door into Portaliq where your client signs on their phone, and pulls out to ConNext and where to install it.',
	references: [
		{ name: 'Claude mobile tools: Figma, Canva, Amplitude', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'The one-take glide: no cuts, the camera pushes into a card until the UI is large, holds, pulls back and glides to the next; never cuts on a word; a phone-centred proof.' },
		{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells that step between states, one orange active cell, and a stepped cell front that wipes the frame before the logo resolves left to right.' },
		{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A centre record with partners settling into the first ring as the camera pulls back; a push through the ring into UI proof; a short caption set directly under the phone UI.' },
	],
	background: C.cobalt,
	safe: { top: 288, bottom: 672, left: 120, right: 300 },
}

/* ---------- Shared layout: one type anchor for the whole take ---------- */

const TX = 120

function headline(g, text, { fill = C.white, size = 96, y = 410, lineHeight = 1.04 } = {}) {
	return textBlock(g, text, { x: TX, y, size, weight: 700, fill, lineHeight, tracking: -0.02 })
}

function wordmark(g, y, h = 96) {
	const [mw, mh] = MARK_BOX['wordmark-connext-white']
	el('use', { href: '#wordmark-connext-white', x: TX - 3, y, width: (mw * h) / mh, height: h }, g)
}

/* ---------- Camera stops (world.js: world point x,y lands on screen px,py at zoom z) ---------- */

const [FX, FY] = cellXY(-1, 1) // Filinq: the contract
const [PX, PY] = cellXY(0, 1) // Portaliq: the portal

const CAM = {
	s1: camOn(0, 0, 620, 1060, 2.4), // close on the client cell; its top point sits at y 700, under the type
	s2: camOn(0, 0, 450, 940, 0.8), // pulled back: the first ring fits the text box under the headline
	s3: camAt(FX + PAGE.x, FY + PAGE.y, 116, 540, 24), // inside Filinq: the page's top-left corner under the headline, value bars 96 px tall
	s4: camAt(PX, PY, 415.5, 1485.5, 24.5), // inside Portaliq: the phone fills the frame under the headline, the sign button 152 px tall
	s5: camAt(PX, PY, 625.5, 650, 9.23), // eased back: the whole phone, its sources on the left, room for the caption below
	s6: camOn(0, 0, 470, 840, 0.82), // pulled out past the ring, drifting left to leave room for the front
}
CAM.s7 = { ...CAM.s1 } // the end card IS frame 1's picture: the loop only swaps the type

/**
 * Cell states. The ring is the story; everything else is quiet honeycomb.
 * page / phone are the UI inside Filinq and Portaliq for that moment.
 */
function ring({ active = false, page = {}, phone = {}, extra = {} } = {}) {
	return (q, r, { k, d }) => {
		const id = RING[k] || extra[k]
		if (!id) return ghost(d)
		if (id === 'filinq') return appCell(id, { inner: (g, wx, wy) => contractPage(g, wx, wy, page) })
		if (id === 'portaliq') return appCell(id, { inner: (g, wx, wy) => portalPhone(g, wx, wy, phone) })
		return appCell(id, { active: active && k === '0,0' })
	}
}
const onlyClient = (q, r, { k, d }) => (k === '0,0' ? appCell('pipelinq') : ghost(d))

/** More apps that light up as the camera pulls out in s6 (all in the Nextcloud app store). */
const WIDER = { '0,-2': 'integriq', '1,-2': 'decidiq', '-1,2': 'buildiq' }

export const boards = [
	/* ------------------------------------------------------------------ s1 */
	{
		id: 's1',
		title: 'Close on your client',
		start: 0.0,
		end: 1.88,
		bars: '1.1-1.4',
		words: 'Open a client\nin Nextcloud.',
		motion: 'Frame 1 is already this frame, and so is the last frame of the film: headline set, camera close on one white cell (the client, Pipelinq glyph), its neighbours only dark honeycomb bleeding off the edges. No fade in. The camera never rests: a slow push in (zoom 2.40 to 2.52) across the bar, the same speed the end card was pushing at, so the loop is one move. The line holds from 0.00 to 2.00 (five words, 2.0 s). Out: on the downbeat of bar 2 the push reverses into a fast pull back (ease.brand), no cut; at 2.00 the line slides up out of its clips in two frames.',
		sound: 'Pad bed only, gentle, no stinger on frame 1; the pad tail from the end card carries across the loop point. Whoosh from 1.4 into the pull back.',
		apps: ['pipelinq'],
		borrow: 'X Ticker: the centre record, before the ring arrives. Claude mobile tools: the camera is already moving on frame 1.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s1, onlyClient)
			headline(g, 'Open a client\nin Nextcloud.', { size: 110, y: 470, lineHeight: 1.03 })
		},
	},

	/* ------------------------------------------------------------------ s2 */
	{
		id: 's2',
		title: 'Their files, mail, calendar and chats settle round them',
		start: 1.88,
		end: 3.76,
		bars: '2.1-2.4',
		words: 'Your apps\nwork together.',
		motion: 'A fast pull back from zoom 2.4 to 0.8 in one beat (1.88 to 2.34, ease.brand) while the camera drifts up left, then a slow drift on, so the ring lands inside the text box, every slot below the headline by 2.11. On the half beats from 2.1 to 2.3 the cells fly in oversized along their own row from the nearest frame edge, never across the type, and pop into the first ring with a small overshoot (spring, zeta 0.6): Nextcloud Files (2.11), Mail (2.34), Calendar (2.58) and Talk (2.81), the client\'s files, mails, meetings and chats, then Filinq and Portaliq together, as the pair the story needs (3.05). Each app already holds its UI: the Filinq glyph\'s page is the white contract, the Portaliq square holds a phone. On 2.4, with the ring closed, the client cell steps from white to orange: the one active cell. The ConNext wordmark rises into the eyebrow slot on 2.1; the two lines rise out of their clips at 2.00 and 2.04, complete by 2.16, and hold to 3.76 (1.6 s). Out: on bar 3 the lines and wordmark slide up out of their clips in two frames as the camera turns into a push, aimed at the Filinq cell (bottom left of the ring); the client cell steps back to white as the orange is handed on.',
		sound: 'Whoosh through the pull. Five ticks as the apps land on the half beats from the and of 2.1 to the and of 2.3, pitched up the scale, the last one doubled for Filinq and Portaliq. Pluck on 2.4 as the centre turns orange. Offbeat bass enters.',
		apps: ['pipelinq', 'nc-files', 'nc-mail', 'nc-calendar', 'nc-talk', 'filinq', 'portaliq', 'shillinq'],
		borrow: 'X Ticker: partners fly in oversized and settle into the first ring of six as the camera pulls back. Firecrawl: one orange active cell.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s2, ring({ active: true }))
			wordmark(g, 288)
			headline(g, 'Your apps\nwork together.', { y: 480 })
		},
	},

	/* ------------------------------------------------------------------ s3 */
	{
		id: 's3',
		title: 'Inside Filinq: the contract fills itself in',
		start: 3.76,
		end: 6.08,
		bars: '3.1-4.1',
		words: 'The contract\nfills itself in.',
		motion: 'On bar 3 the camera pushes into the Filinq cell, fast out of the ring and then a long decelerating crawl (zoom 0.8 to 24, ease.brand on log zoom). The push never leaves the world: the white page of the Filinq glyph grows into the contract, the terracotta interior becomes the ground, and the glyph\'s outline fades as the cell fills the frame. The headline rises at 3.84 and 3.88, complete by 4.00, and holds to 6.08 (2.08 s). The rows fill one per beat, each value arriving behind the Pipelinq glyph of the client it came from: the name on 3.2 (4.20), the address on 3.3 (4.68), the amount starts typing on 3.4 (5.16) and its last digits land with the orange caret on bar 4 (5.64), where the camera stops with the value bars 96 px tall and the caret near the frame\'s centre. Hold, with the empty signature field waiting below. Out: on 4.2 the camera hops right into the next cell, a pull back to about zoom 3 over the cobalt wall between the cells and straight back in (a whip that eases, never a cut); the headline rides out left with the world.',
		sound: 'Kick enters on bar 3. Whoosh on the push. Three plucks as the rows fill (3.2, 3.3, 3.4), rising, and a soft tick as the caret lands on bar 4.',
		apps: ['filinq', 'pipelinq'],
		borrow: 'Claude mobile tools: push into one card until its content is large, hold, never cut on a word. X Ticker: the push through the ring into UI proof.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s3, ring({ page: { filled: 3, caret: true } }))
			headline(g, 'The contract\nfills itself in.', { y: 380 })
		},
	},

	/* ------------------------------------------------------------------ s4 */
	{
		id: 's4',
		title: 'Inside Portaliq: your client signs',
		start: 6.08,
		end: 7.96,
		bars: '4.2-5.1',
		words: 'Your client\nsigns.',
		motion: 'The hop from s3 lands one cell east, inside Portaliq, on 4.3: the ground passes from terracotta through the cobalt cell wall to white, and the camera pushes into the phone that sat in the Portaliq square all along, until the sign button is 152 px tall. The two lines ride in from the right edge with the glide, moving with the world, line 2 a frame behind line 1, and settle at x 120 by 6.40; they hold to 7.96 (1.56 s). In the client\'s portal (their own header) the contract waits with an empty signature box. On bar 5 the tap: the cobalt button presses (scale 0.97 and back) and two hex outlines step out from the tap point; 0.25 s later the signature lands in the box, the one orange. Out: on 5.2 the two lines slide up out of their clips and the camera eases back out of the phone.',
		sound: 'Whoosh on the hop. Riser from 4.3 into bar 5. Impact plus a bright pluck on the tap (bar 5), then a tick as the signature lands.',
		apps: ['filinq', 'shillinq'],
		borrow: 'Claude mobile tools: glide to the next card, phone-centred, push in and hold.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s4, ring({ page: { filled: 3 }, phone: { view: 'sign', signed: true, tap: true } }))
			headline(g, 'Your client\nsigns.', { fill: C.cobalt, y: 384 })
		},
	},

	/* ------------------------------------------------------------------ s5 */
	{
		id: 's5',
		title: 'One portal, fed by every app',
		start: 7.96,
		end: 10.32,
		bars: '5.2-6.2',
		words: 'One portal for\nyour clients.',
		motion: 'The camera eases back from zoom 24.5 to 9.2 and up, until the whole phone stands above the caption line. As it does, the signing view closes into the portal\'s list: the contract just signed sits first, marked by the orange rule, then an invoice, a quote and a request. From the left edge the apps that supply them slide in as hexes (Filinq, Shillinq, Pipelinq) and a line draws from each into its rows, one per beat from 5.3 to 6.2; Shillinq feeds two rows from one hex. The caption rises under the phone on 5.2 (lines at 7.96 and 8.00, complete by 8.16) and holds to 10.32 (2.16 s). Out: on 6.3 the camera pulls straight out; the sources slide back into the cell, the phone shrinks back into the Portaliq square, the cell into the ring and the ring into a wider honeycomb.',
		sound: 'Whoosh on the ease back. Four ticks as the lines connect, claps enter on bar 6. Pad swells on 6.2 into the pull out.',
		apps: ['filinq', 'shillinq', 'pipelinq'],
		borrow: 'X Ticker: a short caption set directly under the phone UI. Claude mobile tools: pull back out of the card and hold on the whole screen. Firecrawl: rows light in sequence to read as work arriving.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s5, ring({ page: { filled: 3 }, phone: { view: 'list', sources: true } }))
			headline(g, 'One portal for\nyour clients.', { fill: C.cobalt, y: 1120 })
		},
	},

	/* ------------------------------------------------------------------ s6 */
	{
		id: 's6',
		title: 'Pull out, glide on, stepped wipe',
		start: 10.32,
		end: 12.2,
		bars: '6.3-7.2',
		words: '',
		motion: 'No words: fast picture. The pull out keeps going past the ring (zoom 9.2 to 0.82) and, as the ring comes back into view with the client orange again, three more apps ripple on around it cell by cell (Integriq, Decidiq, Buildiq): the honeycomb is wider than the story we just saw. The camera glides on, down and to the right. On bar 7 a stepped cell front enters from the right edge as a chevron: each cell it reaches flashes pale (cobalt 200) for one step, then switches off (cobalt 800), in about 0.3 s ripples, so the frame reads as lit honeycomb, one pale stepped edge, dark wedge. Behind the front the dark cells step back up to the resting empty state; the client cell is the last to go and steps from orange back to white instead. Out: the front leaves the frame on 7.2 and the camera turns into a push in on the lone white client cell.',
		sound: 'Whoosh on the pull out, a fast run of ticks as the extra apps ripple on. Riser into bar 7, then the front as a cascade of hat ticks, one per cell column.',
		apps: ['pipelinq', 'nc-files', 'nc-mail', 'nc-calendar', 'nc-talk', 'filinq', 'portaliq', 'shillinq', 'integriq', 'decidiq', 'buildiq'],
		borrow: 'Firecrawl: cells ripple between states, and a stepped cell front sweeps the frame as the final wipe. Claude mobile tools: pull back out and glide on.',
		draw(ctx) {
			const { g } = ctx
			// The front as it is halfway across: a chevron, tip at the ring's centre row.
			const tipX = 600, tipY = 840, slope = 0.62, col = 200
			const lit = ring({ active: true, page: { filled: 3 }, phone: { view: 'list', accent: false }, extra: WIDER })
			drawWorld(g, CAM.s6, (q, r, info) => {
				const { k, sx, sy } = info
				const past = sx - (tipX + slope * Math.abs(sy - tipY))
				if (past >= 0 && k !== '0,0') {
					if (past < col) return { fill: C.cobalt200 } // the leading edge flashes pale
					return { fill: C.cobalt800 } // switched off; steps back up to the resting ghost as the front leaves
				}
				return lit(q, r, info)
			})
		},
	},

	/* ------------------------------------------------------------------ s7 */
	{
		id: 's7',
		title: 'ConNext, and where to install it',
		start: 12.2,
		end: 15.0,
		bars: '7.3-8.4',
		words: 'Install from the\nNextcloud app store',
		motion: 'From 7.2 the camera pushes in on the lone white client cell until it sits exactly where frame 1 has it (zoom 2.25 by 7.4), then keeps a slow push to 2.40 at 15.00, the speed frame 1 continues at. All the type sits above the cell\'s top point. On 7.3 (12.20) the ConNext wordmark resolves left to right behind a moving clip and both CTA lines rise with it, 0.12 s apart, complete by 12.48; the orange hex marker steps in on 7.4 (12.64). Nothing leaves before 15.00: the CTA holds 2.52 s. Loop: the last frame is frame 1\'s picture, the same cell at the same centre and zoom; only the type swaps to "Open a client in Nextcloud." No fade at the end.',
		sound: 'Impact on 7.3 as the wordmark resolves. Bell (sonic logo) on bar 8. Bed drops to pad for the hold; the pad tail carries across the loop point.',
		apps: ['pipelinq'],
		borrow: 'Firecrawl: after the stepped wipe the wordmark resolves left to right and holds. X Ticker: the centre record we started on is the last thing lit.',
		draw(ctx) {
			const { g } = ctx
			drawWorld(g, CAM.s7, onlyClient)
			wordmark(g, 300)
			// The primary CTA's orange, as the design system's eyebrow marker.
			el('path', { d: hexPath(TX + 17.3, 430, 20, 2), fill: C.orange }, g)
			textBlock(g, 'Install from the\nNextcloud app store', { x: TX, y: 530, size: 72, weight: 700, fill: C.white, lineHeight: 1.1, tracking: -0.02 })
		},
	},
]
