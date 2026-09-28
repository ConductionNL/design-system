/**
 * OpenCatalogi, audience film: Woo publishing (municipalities, provinces, waterschappen,
 * universities). Direction C on the app-film template, wrapped by _lib/audiencefilm.js.
 * Round 7: specs and positioning count as built. Positioning:
 * ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   hook     the disclosure (Woo) decision deadline flags itself before it is due (usp-woo-deadline,
 *            verified; spec woo-transparency)
 *   proof 1  the national index picks the publication up by itself, its fields already right
 *            (sp-woo-index, usp-index-language verified; specs dcat-ap-harvest,
 *            structured-data-discoverability)
 *   proof 2  residents search everything published, no account needed (sp-public-search;
 *            specs search, catalogs)
 *   general  the data layer: every publish shows who and when (sp-publish-and-track; D1)
 *   question "What if no disclosure ever ran late?" (Round 19: the promise card as a question, from "Disclosed on time, easy to find"; the proofs answer it)
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the publication's fields tick in
 * waves before the index takes it), #1 dot-grows-to-fill as an upright hex (from the index
 * row into the public reading room), #4 typewriter (the resident's search).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, idlePill } from '../../../_lib/ui.js'
import { textBlock } from '../../../_lib/stage.js'

/** Round 27c: no hex floats over another; a marker that would sit under the app tag (on geom.anchor, window px) steps out. */
const clearOfTag = (hx, hy, a) => !a || Math.hypot(hx - a.x, hy - a.y) > 90

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark grows to fill the frame and becomes the next scene; a line typed letter by letter.' },
]

/** Hook: the Woo requests with their decision deadlines; one flagged before it is due. */
function deadlineUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	const cD = x + width - 330
	;[x + 30, x + 250, cD].forEach((hx) => bar(w, hx, top + 30, 90, 8, C.cobalt400))
	const left = [0.8, 0.55, 0.12, 0.7, 0.4, 0.9, 0.65]
	left.forEach((p, r) => {
		const cy = top + 96 + r * 74
		if (r > 0) rect(w, x + 20, cy - 37, width - 40, u, C.cobalt50)
		if (clearOfTag(x + 50, cy, geom.anchor)) hex(w, x + 50, cy, 16, r === 2 ? C.lavender : C.cobalt200, 2)
		bar(w, x + 84, cy - 12, 150 - (r % 3) * 24, 10, C.cobalt900)
		bar(w, x + 84, cy + 6, 90, 7, C.cobalt300)
		bar(w, x + 250, cy - 5, 120 + ((r * 41) % 90), 10, C.cobalt200)
		// Days left before the decision deadline: the bar runs down.
		rect(w, cD, cy - 8, 240, 16, C.cobalt50, 8)
		rect(w, cD, cy - 8, 240 * p, 16, r === 2 ? C.lavender : C.cobalt300, 8)
		if (r !== 2) idlePill(w, cD + 256, cy, u, { w: 22 })
	})
	// The request whose deadline is close: flagged, its row ringed (the scene's one orange).
	const fy = top + 96 + 2 * 74
	hex(w, cD + 286, fy, 14, C.lavender, 2)
	rect(w, x + 12, fy - 34, width - 24, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the publication with its fields filled, and the national index (an outside system: a side box) taking it. */
function indexUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const pw = width * 0.48
	panel(w, x, top, pw, 600, u)
	bar(w, x + 30, top + 34, 220, 16, C.cobalt900)
	bar(w, x + 30, top + 64, 140, 8, C.cobalt300)
	// The fields the index reads, each ticked (the grid ripple lands on these).
	for (let i = 0; i < 7; i++) {
		const cy = top + 130 + i * 62
		bar(w, x + 30, cy - 5, 90, 8, C.cobalt400)
		rect(w, x + 140, cy - 16, pw - 230, 32, C.cobalt50, 3 * u)
		bar(w, x + 156, cy - 4, Math.min(80 + ((i * 53) % 150), pw - 280), 8, C.cobalt700)
		circle(w, x + pw - 50, cy, 12, C.mint)
	}
	// The national index: outside the app, so a rectangle on the right, its newest row ringed.
	const bx = x + pw + 70, bw = width - pw - 70
	rect(w, bx, top + 60, bw, 470, C.cobalt50, 4 * u, { stroke: C.cobalt200, 'stroke-width': u })
	// Round 17: a small two-part tag naming the Dutch law and its European counterpart the app
	// supports (the Open Data Directive, in spec dcat-ap-harvest: HVD per Implementing Regulation
	// (EU) 2023/138). A label, not the message: Figtree 600, about 28 px on stage.
	textBlock(w, 'Woo ·\nEU Open Data Directive', { x: bx + 24, y: top + 104, size: 30, weight: 600, fill: C.cobalt700, lineHeight: 1.1, clip: false })
	for (let i = 0; i < 5; i++) {
		const cy = top + 190 + i * 66
		rect(w, bx + 18, cy - 24, bw - 36, 48, C.white, 3 * u)
		bar(w, bx + 34, cy - 5, bw * 0.45 - (i % 2) * 30, 9, C.cobalt400)
	}
	// The line from the publication to the index: straight, one right angle.
	const ly = top + 190
	rect(w, x + pw, ly - u, 70, 2 * u, C.cobalt300)
	rect(w, bx + 12, top + 190 - 30, bw - 24, 60, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the public reading room: a search with no login, the results under it. */
function searchUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The search field, a query half typed with its cursor.
	rect(w, x, top, width, 76, C.white, 38, { stroke: C.cobalt200, 'stroke-width': u })
	circle(w, x + 44, top + 38, 12, 'none', { stroke: C.cobalt400, 'stroke-width': 1.6 * u })
	bar(w, x + 76, top + 32, 190, 12, C.cobalt900)
	rect(w, x + 272, top + 22, 1.2 * u, 32, C.cobalt)
	// Filters left, results right.
	for (let i = 0; i < 4; i++) { rect(w, x, top + 120 + i * 50, 22, 22, i === 1 ? C.cobalt : C.cobalt100, 3 * u); bar(w, x + 36, top + 127 + i * 50, 110, 8, C.cobalt400) }
	const rx = x + 200, rw = width - 200
	for (let i = 0; i < 5; i++) {
		const cy = top + 150 + i * 104
		panel(w, rx, cy - 44, rw, 90, u)
		rect(w, rx + 20, cy - 26, 40, 52, C.cobalt100, 3 * u)
		bar(w, rx + 80, cy - 20, 260 - (i % 3) * 40, 12, C.cobalt900)
		bar(w, rx + 80, cy + 4, 180, 8, C.cobalt300)
		bar(w, rx + rw - 130, cy - 4, 90, 8, C.cobalt200)
	}
	// The result the resident was after: ringed (the scene's one orange).
	rect(w, rx - 8, top + 150 - 52, rw + 16, 106, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'opencatalogi',
	audience: { slug: 'woo', name: 'Woo publishing', persona: 'Naomi Verhoeven, Woo coordinator at a municipality of 55,000; Bram Kuijpers, informatiebeheerder at a waterschap; the head of information management buys' },
	promise: 'What if no\ndisclosure\never ran late?',
	promiseLine: 'Everything you must disclose under the Woo, published on time and easy to find, on storage your organisation controls',
	title: 'OpenCatalogi for Woo publishing',
	record: { one: 'publication', many: 'publications' },
	logline: 'For every public body that must disclose, under the Dutch Wet open overheid (Woo) and the EU Open Data Directive: the decision deadline flags itself before it is due, the national index picks each publication up by itself with its fields right, and residents search what was published without an account. Every publish shows who and when.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the fields tick before the index takes them)', '#1 dot-grows-to-fill as an upright hex (index row to reading room)', '#4 typewriter (the resident\'s search)'],
	neighbours: ['filinq'],
	// Round 27c: the section title above each caption (never the app name).
	sections: {promise: 'Disclosure', hook: 'Deadlines', index: 'National index', search: 'Public access', 'general-dataLayer': 'Audit trail'},
	// Round 26: the designed hand-off into each body board (preview/films/_lib/transitions.js).
	transitions: {
		hook: {type: 'zoom', fromName: 'the orange OpenCatalogi cell', toName: 'the flagged deadline', note: 'the camera goes into the request list where the deadline sits'},
		index: {type: 'match', fromName: 'the flagged request', toName: 'the ringed index row', note: 'the request that was due is the publication that reaches the index'},
		search: {type: 'grow', fromName: 'the ringed index row', toName: 'the public reading room', note: 'the index row opens out as a hex and the reading room is inside it (#1)'},
		'general-dataLayer': {'type': 'hexWipe', 'fromName': 'the reading room', 'toName': 'the publication history', 'note': 'a chapter change from the app\'s own screens to the shared capability; the stepped wipe marks the new chapter (#5)'},
	},
	builtOnApps: ['filinq'],
	hook: {
		title: 'Disclosure deadline? Flagged in time',
		caption: 'Disclosure deadline?\nFlagged in time',
		ui: { drawUI: deadlineUI, tagFill: 'cobalt' },
		source: 'positioning opencatalogi usp-woo-deadline (verified): "The statutory decision deadline warns you before it passes."; spec woo-transparency. Round 17: "Woo" alone is not said on an English film; "disclosure deadline" covers the Dutch Woo and access-to-documents rules elsewhere',
		motion: 'Out of the question the app cell stays on the loop anchor and the window builds round it; the frame reads: caption, the Woo requests with their deadline bars, the OpenCatalogi hex (cobalt) on the loop anchor. The deadline bars run down a sixteenth apart; on beat 3 the third row\'s bar turns lavender, the flag hex pops beside it and the row takes the orange ring. Out: the ringed row slides up and becomes the publication header of the next scene (hex match cut).',
		sound: 'Gentle open. Soft ticks as the bars run down, a pluck as the flag lands.',
	},
	proofs: [
		{
			id: 'index',
			title: 'Every publication in the national index',
			caption: 'Every publication\nin the national index',
			source: 'positioning opencatalogi sp-woo-index ("The national index finds your publications on its own.") and usp-index-language (verified: "Publications carry the exact fields the national index reads."); specs dcat-ap-harvest, structured-data-discoverability',
			motion: 'A small tag on the index box reads "Woo · EU Open Data Directive" (the two regimes the feed serves: spec dcat-ap-harvest, DCAT-AP-NL for the national index and High-Value Dataset classification under the EU Open Data Directive, Implementing Regulation (EU) 2023/138). Technique #3, grid-cell ripple: the publication\'s fields step from 20% to 40% to full opacity in a wave top to bottom and each mint tick pops as its field lands. On the bar line the straight line runs out to the index box on the right (an outside system: a rectangle, never a hex) and the newest index row slides in and takes the orange ring. Nobody presses send.',
			sound: 'A ripple of ticks with the fields, a soft whoosh along the line, a pluck as the row lands in the index.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every publication\nin the national index', drawUI: indexUI, tagFill: 'cobalt' }),
		},
		{
			id: 'search',
			title: 'Residents search, no account needed',
			caption: 'Residents search,\nno account needed',
			source: 'positioning opencatalogi sp-public-search ("Search everything published without creating an account."); specs search, catalogs',
			motion: 'Technique #1 as an upright hex: the ringed index row\'s marker grows past the frame (ease.snap, one beat) and lands as the public reading room. No login bar, no avatar. Technique #4, typewriter: the resident\'s query types itself into the search field (greeked, one pair per 0.1 s, hard on and off) with a cursor; the results drop in a sixteenth apart and the first takes the orange ring.',
			sound: 'A whoosh through the hex, tiny key clicks under the typing, a tick per result.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Residents search,\nno account needed', drawUI: searchUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Every publish shows who and when',
		caption: 'Every publish shows\nwho and when',
		source: 'positioning opencatalogi sp-publish-and-track ("Every publish or withdraw keeps a record of who did it."); COPY.dataLayer D1 (story.json mechanics[0])',
		params: {
			record: { avatar: 'square', title: 240, sub: 150, status: 'mint' },
			links: ['nc-files', 'nc-mail'],
		},
		sound: 'Ticks as the history rows land, a pluck on the newest (the publish).',
	},
}

export const { meta, boards } = audienceFilm(content)
