/**
 * OpenRegister, audience film: software vendors and integrators building for government
 * (cg-govtech-vendors). Direction C on the app-film template, wrapped by _lib/audiencefilm.js.
 * Lane L1, 2026-09-28. Positioning: ds-connext-film-review/audiences/positioning-l1.md.
 *
 * Round 14 (Ruben, 2026-09-28): it closes on the Built on Nextcloud piece with OpenRegister itself
 * lit as the data layer (closing.js litLayer, via builtOnLit), not on a Built on piece with this app
 * on top; 18 bars, 33.75 s like every audience film.
 *
 *   hook     change a record type and the existing records move with it (usp-live-model,
 *            verified; spec schema-migration)
 *   proof 1  any other system reads and writes the same records, filtered to what it may see
 *            (sp-any-system-connects; specs objects-crud, api-authorization)
 *   proof 2  read another organisation's records live, without a copy (usp-connect-registers,
 *            verified; spec federation)
 *   general  the data layer: audit trail and retention already built in (platform
 *            every-change-logged, strong; usp-archive-destroy, verified)
 *   promise  "What if you never built a database?" (Round 19: the promise asked as a question; no answer card, the proofs answer it)
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the new column steps through the
 * existing records), #1 dot-grows-to-fill as an upright hex (from the store into the other
 * organisation's records), #9 text-swap on a held diagram (the systems diagram holds while
 * each consumer's filter chip swaps in).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping in waves.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only the labels change on the beat.' },
]

/** Hook: the record type gains a field, and every existing record gains its column. */
function liveModelUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The type: its fields as chips in one row, the new one at the end.
	panel(w, x, top, width, 120, u)
	bar(w, x + 90, top + 30, 180, 14, C.cobalt900)
	const chips = [130, 110, 150, 120]
	let cx = x + 90
	chips.forEach((cw) => { rect(w, cx, top + 62, cw, 32, C.cobalt100, 16); cx += cw + 14 })
	rect(w, cx, top + 62, 130, 32, C.lavender300, 16)
	rect(w, cx - 7, top + 55, 144, 46, 'none', 23, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The records: a table; the last column is the new field, filled in every row.
	const ty = top + 150
	panel(w, x, ty, width, 560, u)
	const cols = [x + 90, x + 330, x + 500, x + 670]
	cols.forEach((hx) => bar(w, hx, ty + 30, 80, 8, C.cobalt400))
	bar(w, cols[3], ty + 30, 80, 8, C.lavender)
	for (let r = 0; r < 7; r++) {
		const cy = ty + 90 + r * 66
		if (r) rect(w, x + 20, cy - 33, width - 40, u, C.cobalt50)
		hex(w, x + 56, cy, 16, C.cobalt300, 2)
		bar(w, cols[0], cy - 6, 190 - (r % 3) * 30, 10, C.cobalt900)
		bar(w, cols[1], cy - 5, 110, 8, C.cobalt300)
		bar(w, cols[2], cy - 5, 90 + (r % 2) * 30, 8, C.cobalt300)
		rect(w, cols[3] - 6, cy - 16, 150, 32, C.lavender300, 4 * u)
		bar(w, cols[3] + 10, cy - 4, 90 - (r % 3) * 16, 8, C.lavender)
	}
}

/** Proof 1: the records in the middle; outside systems as side boxes read and write them, each through its own filter. */
function anySystemUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const midX = x + width / 2, sw = 300, sx = midX - sw / 2, sy = top + 150
	// The store: one table of records.
	panel(w, sx, sy, sw, 400, u)
	rect(w, sx, sy, sw, 12, C.cobalt, 0)
	for (let r = 0; r < 6; r++) { hex(w, sx + 40, sy + 60 + r * 56, 12, C.cobalt300, 2); bar(w, sx + 66, sy + 54 + r * 56, 170 - (r % 3) * 30, 10, C.cobalt900) }
	// Systems: sources on the left, consumers on the right (bible), square-cornered wires.
	const box = (bx, by) => { rect(w, bx, by, 200, 110, C.cobalt50, 4 * u, { stroke: C.cobalt200, 'stroke-width': u }); bar(w, bx + 24, by + 30, 110, 12, C.cobalt700); bar(w, bx + 24, by + 58, 70, 8, C.cobalt300) }
	const L = [[x, top + 160], [x, top + 420]], R = [[x + width - 200, top + 100], [x + width - 200, top + 300], [x + width - 200, top + 500]]
	L.forEach(([bx, by]) => { box(bx, by); rect(w, bx + 200, by + 55 - 1.5 * u, sx - bx - 200, 3 * u, C.cobalt300) })
	R.forEach(([bx, by], i) => {
		box(bx, by)
		const wy = by + 55
		rect(w, sx + sw, wy - 1.5 * u, bx - sx - sw, 3 * u, C.cobalt300)
		// Each consumer reads through its own filter: a chip on its wire.
		const fx = sx + sw + (bx - sx - sw) / 2 - 36
		rect(w, fx, wy - 18, 72, 36, i === 1 ? C.lavender300 : C.cobalt100, 18)
		hex(w, fx + 20, wy, 8, i === 1 ? C.lavender : C.cobalt300, 1)
		if (i === 1) rect(w, fx - 7, wy - 25, 86, 50, 'none', 25, { stroke: C.orange, 'stroke-width': 2.5 * u })
	})
}

/** Proof 2: your records beside another organisation's, read live: linked rows, no copy. */
function federationUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const pw = (width - 60) / 2
	// Yours (left) and theirs (right, a dashed edge: it lives on their server).
	panel(w, x, top, pw, 600, u)
	rect(w, x + pw + 60, top, pw, 600, C.white, 4 * u, { stroke: C.cobalt300, 'stroke-width': u, 'stroke-dasharray': '12 10' })
	bar(w, x + 90, top + 34, 150, 12, C.cobalt900)
	rect(w, x + pw + 90, top + 26, 30, 30, C.cobalt300, 4)
	bar(w, x + pw + 134, top + 34, 150, 12, C.cobalt700)
	for (let r = 0; r < 6; r++) {
		const cy = top + 110 + r * 78
		const theirs = r === 2 || r === 4
		// Their rows show in your list with a link mark and a dashed outline: read live, never copied.
		rect(w, x + 20, cy - 26, pw - 40, 52, theirs ? C.white : C.cobalt50, 4 * u, theirs ? { stroke: C.cobalt300, 'stroke-width': u, 'stroke-dasharray': '8 6' } : {})
		hex(w, x + 52, cy, 12, theirs ? C.mint : C.cobalt300, 2)
		bar(w, x + 80, cy - 5, 170 - (r % 3) * 30, 10, C.cobalt900)
		rect(w, x + pw + 80, cy - 26, pw - 40, 52, C.cobalt50, 4 * u)
		hex(w, x + pw + 112, cy, 12, C.cobalt300, 2)
		bar(w, x + pw + 140, cy - 5, 150 - (r % 2) * 30, 10, C.cobalt900)
		if (theirs) rect(w, x + pw - 20, cy - 1.5 * u, 100, 3 * u, C.mint)
	}
	// The live row just read in: the one orange, as a ring.
	rect(w, x + 12, top + 110 + 2 * 78 - 34, pw - 24, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	statusPill(w, x + pw - 110, top + 40, u)
}

const content = {
	app: 'openregister',
	audience: { slug: 'vendors', name: 'Software vendors and integrators', persona: 'Bram Koster, integration specialist at a 40-person vendor building permit apps for municipalities (cg-govtech-vendors)' },
	promise: 'What if you never\nbuilt a database?',
	promiseLine: 'Build your app on a record store with the audit trail and retention already in it',
	title: 'OpenRegister for software vendors',
	record: { one: 'record', many: 'records' },
	logline: 'For vendors and integrators who build case, permit and citizen apps for government: change a record type and the records follow, let any system read and write the same records through its own filter, read another organisation\'s records live, and get the audit trail and retention a tender asks for without building them. It closes on Built on Nextcloud with OpenRegister lit as the data layer.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the new column)', '#9 text-swap on a held diagram (the filters)', '#1 dot-grows-to-fill (as a hex, into the other organisation)'],
	neighbours: ['dossiq', 'pipelinq', 'portaliq', 'integriq'],
	hook: {
		title: 'Change the model, records follow',
		caption: 'Change the model,\nrecords follow',
		ui: { drawUI: liveModelUI, tagFill: 'cobalt' },
		source: 'positioning openregister usp-live-model, verified ("Change a record type and existing records move with it."); spec schema-migration (typed changelog, version bump, objects stamped and migrated)',
		motion: 'In behind the app hex the question leaves on the loop anchor, the key frame reads: caption, the record type\'s fields as chips over the table of its records, the OpenRegister hex (cobalt) on the loop anchor. On beat 2 a new field chip pops in at the end of the row (lavender) and takes the orange ring. Technique #3, grid-cell ripple: its column steps into the table row by row, each new cell stepping 20% to 40% to full, top to bottom within one bar; nothing goes offline.',
		sound: 'A pluck as the chip lands, a run of soft ticks down the column.',
	},
	proofs: [
		{
			id: 'systems',
			title: 'Any system reads the same records',
			caption: 'Any system reads\nthe same records',
			source: 'positioning openregister sp-any-system-connects ("Any other system reads and writes to the same records."; scene: "It reads and writes the same records, filtered to what it may see."); specs objects-crud, api-authorization',
			motion: 'The records card lands in the middle; outside systems as side boxes (rectangles, not hexes: they are not apps) step in, sources on the left, consumers on the right, with square-cornered wires. Technique #9, text-swap on a held diagram: the diagram holds while a filter chip swaps onto each consumer wire one per beat; the middle one takes the orange ring. Pulses run both ways on the wires (read and write).',
			sound: 'Dry ticks as the boxes land, a click per filter chip.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Any system reads\nthe same records', drawUI: anySystemUI, tagFill: 'cobalt' }),
		},
		{
			id: 'federation',
			title: 'Another organisation\'s records, live, no copy',
			caption: 'Another organisation\'s\nrecords, live, no copy',
			source: 'positioning openregister usp-connect-registers, verified ("Read another organisation\'s records live, as if they were your own."; scene: "You read their records live, without copying a single row."); spec federation',
			motion: 'Technique #1, dot-grows-to-fill as an upright hex: the ringed filter chip becomes a hex that grows past the frame (ease.snap, one beat) and shrinks into the right panel, the other organisation\'s records behind a dashed edge. Their rows light up and appear in your list on mint wires, each with a dashed outline (read live, never copied); the newest takes the orange ring.',
			sound: 'A whoosh through the hex, a pluck per row that links in.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Another organisation\'s\nrecords, live, no copy', drawUI: federationUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Audit trail, retention: built in',
		caption: 'Audit trail, retention:\nbuilt in',
		source: 'positioning openregister platform every-change-logged, strong, and usp-archive-destroy, verified; cg-govtech-vendors buying trigger ("a client tender requiring an audit trail and a retention policy"); specs audit-trail-immutable, retention-management',
		params: {
			record: { avatar: 'hex', title: 240, sub: 160, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 190 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-files', 'nc-mail'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	builtOnLit: true,
	builtOnApps: ['dossiq', 'pipelinq', 'portaliq'],
	builtOnMotion: 'The shared piece with the Round 14 option (_lib/scenes/closing.js, on: \'nextcloud\', litLayer: true): Nextcloud lands low right, the data layer drops onto it and this time it is the lit cell, orange with the OpenRegister glyph, its name rising beside it; "Built on" rises with "Nextcloud" a sixteenth behind and the white Nextcloud mark above them; the Nextcloud apps pop in round it one a sixteenth; on its second bar Dossiq, Pipelinq and Portaliq, the apps that keep their records in it, land on top in white. OpenRegister is not repeated on top: it is the layer.',
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15), asked as a question (Round 19: no answer card follows, the proofs answer it). Straight after the opening\'s handover, on its plain field, the OpenRegister cell lands on the loop anchor and turns orange, the apps built on it (Dossiq, Pipelinq, Portaliq, Integriq) lock in white round the Nextcloud hex: the vendor\'s app would sit there too. Under "OpenRegister" the question builds one word per sixteenth from two frames after the handover while the type column\'s camera eases back; at rest it is the key frame. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the OpenRegister cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
