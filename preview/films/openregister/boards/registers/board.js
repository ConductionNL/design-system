/**
 * OpenRegister, audience film: government register keepers (municipal, provincial and ZBO
 * registers). Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Lane L1,
 * 2026-09-28. Positioning: ds-connext-film-review/audiences/positioning-l1.md.
 *
 * Round 14 (Ruben, 2026-09-28): it closes on the Built on Nextcloud piece with OpenRegister itself
 * lit as the data layer (closing.js litLayer, via builtOnLit), not on a Built on piece with this app
 * on top; 18 bars, 33.75 s like every audience film.
 *
 *   hook     add a new record type yourself, no developer (sp-model-without-code; specs
 *            no-code-app-builder, runtime-schema-api)
 *   proof 1  a record is destroyed on its retention date, once approved (usp-archive-destroy,
 *            verified; specs archival-destruction-workflow, retention-management)
 *   proof 2  a privacy request answered straight from the record (usp-gdpr-subject-rights,
 *            verified; spec gdpr-data-subject-rights)
 *   general  the data layer: every change shows who and when (platform every-change-logged,
 *            strong; spec audit-trail-immutable), here OpenRegister's own proof
 *   promise  "What if every record kept its history?" (Round 19: the promise asked as a question; no answer card, the proofs answer it)
 *
 * Techniques (refs/techniques.md): #4 typewriter (the new field's name types itself),
 * #3 grid-cell ripple (records due for destruction flag themselves in a wave),
 * #10 cluster-to-container merge (the privacy request's data gathers into one export).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A caption typed letter by letter under a UI push-in.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping in waves to read as the system at work.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
]

/** Hook: the record type editor: its fields down the left, the live form it makes on the right; the new field ringed. */
function typeEditorUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const lw = 470
	panel(w, x, top, lw, 640, u)
	bar(w, x + 90, top + 34, 200, 14, C.cobalt900)
	const kinds = [C.cobalt300, C.lavender300, C.cobalt300, C.mint300, C.cobalt300]
	const names = [180, 150, 210, 130, 170]
	for (let i = 0; i < 6; i++) {
		const ry = top + 90 + i * 84
		const isNew = i === 5
		rect(w, x + 20, ry, lw - 40, 68, isNew ? C.white : C.cobalt50, 4 * u, isNew ? { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': '10 8' } : {})
		rect(w, x + 40, ry + 18, 32, 32, isNew ? C.lavender : kinds[i], 3 * u)
		bar(w, x + 90, ry + 24, isNew ? 120 : names[i], 12, C.cobalt900)
		if (isNew) rect(w, x + 90 + 124, ry + 18, 3 * u, 26, C.cobalt)
		rect(w, x + lw - 140, ry + 20, 90, 28, C.cobalt100, 14)
	}
	// The field being added: the scene's one orange, as a ring.
	rect(w, x + 12, top + 90 + 5 * 84 - 8, lw - 24, 84, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The form the type makes, live: one input per field, the new one appearing last.
	const fx = x + lw + 24, fw = width - lw - 24
	panel(w, fx, top, fw, 640, u)
	bar(w, fx + 30, top + 34, 150, 12, C.cobalt700)
	for (let i = 0; i < 6; i++) {
		const fy = top + 90 + i * 84
		bar(w, fx + 30, fy + 6, 90 - (i % 3) * 14, 8, C.cobalt400)
		rect(w, fx + 30, fy + 24, fw - 60, 38, i === 5 ? C.lavender300 : C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	}
	button(w, fx + fw - 170, top + 590, 140, 34, u)
}

/** Proof 1: records with their retention date; the ones due flag themselves, and one waits for approval. */
function retentionUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 560, u)
	;[x + 90, x + 420, x + 640].forEach((hx) => bar(w, hx, top + 30, 90, 8, C.cobalt400))
	const due = [1, 2, 4, 6]
	for (let r = 0; r < 7; r++) {
		const cy = top + 90 + r * 66
		if (r) rect(w, x + 20, cy - 33, width - 40, u, C.cobalt50)
		hex(w, x + 56, cy, 16, C.cobalt300, 2)
		bar(w, x + 90, cy - 6, 250 - (r % 3) * 40, 10, C.cobalt900)
		const d = due.includes(r)
		rect(w, x + 420, cy - 16, 150, 32, d ? C.lavender300 : C.cobalt50, 16)
		bar(w, x + 442, cy - 4, 100, 8, d ? C.lavender : C.cobalt300)
		if (d) idlePill(w, x + 640, cy, u, { w: 40 })
		else statusPill(w, x + 640, cy, u)
	}
	// The approval card under the list, the approve button ringed (the one orange).
	const ay = top + 590
	panel(w, x + width - 420, ay, 420, 150, u)
	bar(w, x + width - 390, ay + 34, 220, 12, C.cobalt900)
	bar(w, x + width - 390, ay + 62, 150, 8, C.cobalt300)
	button(w, x + width - 190, ay + 92, 150, 36, u)
	rect(w, x + width - 198, ay + 84, 166, 52, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the privacy request, and everything tied to that one record gathered into one export. */
function privacyUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The request: a person and the request type.
	panel(w, x, top, width, 120, u)
	circle(w, x + 110, top + 60, 34, C.cobalt300)
	bar(w, x + 164, top + 38, 240, 16, C.cobalt900)
	bar(w, x + 164, top + 70, 150, 9, C.cobalt300)
	rect(w, x + width - 230, top + 44, 190, 32, C.lavender300, 16)
	// Their data across record types: four cards, square wires into one export.
	const cw = 190, cy0 = top + 170
	const kinds = [C.cobalt300, C.cobalt300, C.lavender300, C.cobalt300]
	for (let i = 0; i < 4; i++) {
		const cx = x + i * (cw + 25)
		panel(w, cx, cy0, cw, 170, u)
		hex(w, cx + 36, cy0 + 40, 14, kinds[i], 2)
		bar(w, cx + 60, cy0 + 34, 100, 10, C.cobalt900)
		for (let k = 0; k < 3; k++) bar(w, cx + 24, cy0 + 80 + k * 26, cw - 60 - k * 20, 8, C.cobalt100)
		rect(w, cx + cw / 2 - 1.5 * u, cy0 + 170, 3 * u, 70, C.cobalt300)
	}
	rect(w, x + cw / 2, cy0 + 240, 3 * (cw + 25), 3 * u, C.cobalt300)
	const ex = x + 1.5 * (cw + 25) + cw / 2
	rect(w, ex - 1.5 * u, cy0 + 240, 3 * u, 50, C.cobalt300)
	// The export: one package, the request's answer (ringed, the one orange).
	const ew = 380, ey = cy0 + 290
	panel(w, ex - ew / 2, ey, ew, 190, u)
	rect(w, ex - ew / 2, ey, ew, 12, C.cobalt, 0)
	for (let k = 0; k < 4; k++) { rect(w, ex - ew / 2 + 30, ey + 42 + k * 34, 22, 22, C.cobalt100, 3); bar(w, ex - ew / 2 + 66, ey + 48 + k * 34, 200 - k * 24, 9, C.cobalt700) }
	statusPill(w, ex + ew / 2 - 110, ey + 60, u)
	rect(w, ex - ew / 2 - 8, ey - 8, ew + 16, 206, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'openregister',
	audience: { slug: 'registers', name: 'Government register keepers', persona: 'Sanne de Groot, Beheerder Basisregistraties (municipality); Willem Jansen, informatiearchitect (province); Renate Visser, registerbeheerder (ZBO); the manager informatiebeheer buys' },
	promise: 'What if every record\nkept its history?',
	promiseLine: 'Keep every record your organisation holds, with its full history intact',
	title: 'OpenRegister for register keepers',
	record: { one: 'record', many: 'records' },
	logline: 'For the people who keep a government register: add a record type yourself, let each record flag its own destruction date and wait for your approval, answer a privacy request from the record itself, and see who changed what and when. It closes on Built on Nextcloud with OpenRegister lit as the data layer.',
	references: REFS,
	techniques: ['#4 typewriter (the new field)', '#3 grid-cell ripple (records due flag themselves)', '#10 cluster-to-container merge (the privacy export)'],
	neighbours: ['dossiq', 'portaliq', 'integriq'],
	hook: {
		title: 'New field? No developer needed',
		caption: 'New field?\nNo developer needed',
		ui: { drawUI: typeEditorUI, tagFill: 'cobalt' },
		source: 'positioning openregister sp-model-without-code ("Add a new record type yourself, with no developer needed."); specs no-code-app-builder, runtime-schema-api',
		motion: 'In behind the app hex the question leaves on the loop anchor, the key frame reads: caption, the record type editor (its fields on the left, the form it makes on the right), the OpenRegister hex (cobalt: the one orange is the new field\'s ring) on the loop anchor. Technique #4, typewriter: in the dashed new row the field name types itself (greeked characters one pair per 0.1 s, hard on and off, a cursor), its type chip drops in, the row fills and takes the orange ring, and on the same beat its input appears last in the live form on the right. Out: a hard cut on the beat.',
		sound: 'Soft key ticks under the typing, a pluck as the input appears in the form.',
	},
	proofs: [
		{
			id: 'retention',
			title: 'Old records destroyed once you approve',
			caption: 'Old records destroyed\nonce you approve',
			source: 'positioning openregister usp-archive-destroy, verified ("A record destroys itself on its retention date, once approved."; scene: "The record already knows its own retention date and flags itself."); specs archival-destruction-workflow, retention-management',
			motion: 'Technique #3, grid-cell ripple: the list of records holds; their retention date chips step from 20% to 40% to full in a wave down the list, and the ones past their date turn lavender and flag themselves (the pill goes idle). On beat 4 the approval card rises under the list and its button takes the orange ring; nothing is destroyed before the approve. The caption rises as the wave starts.',
			sound: 'A ripple of soft ticks with the wave, a dry click on the approve.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Old records destroyed\nonce you approve', drawUI: retentionUI, tagFill: 'cobalt' }),
		},
		{
			id: 'privacy',
			title: 'Privacy requests, one export away',
			caption: 'Privacy requests,\none export away',
			source: 'positioning openregister usp-gdpr-subject-rights, verified ("A citizen\'s data request pulls straight from their own record."; scene: "One export area gathers everything tied to that record."); spec gdpr-data-subject-rights',
			motion: 'Technique #10, cluster-to-container merge: the request lands on top (a person, the request type in lavender); the four cards holding their data start as loose hexes scattered over the window and tween into place on ease.brand; then square-cornered wires run down from each and join, and the export package builds at the join and takes the orange ring as its status turns mint.',
			sound: 'Four soft ticks as the cards land, a line-draw hiss down the wires, a pluck as the export completes.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Privacy requests,\none export away', drawUI: privacyUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Every change shows who and when',
		caption: 'Every change shows\nwho and when',
		source: 'positioning openregister platform every-change-logged, strong ("Every record keeps who created it, who changed which field and when, in a trail that cannot be quietly edited"); spec audit-trail-immutable',
		params: {
			record: { avatar: 'hex', title: 240, sub: 160, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 190 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-files', 'nc-mail', 'nc-talk'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	builtOnLit: true,
	builtOnApps: ['dossiq', 'portaliq', 'integriq'],
	builtOnMotion: 'The shared piece with the Round 14 option (_lib/scenes/closing.js, on: \'nextcloud\', litLayer: true): Nextcloud lands low right, the data layer drops onto it and this time it is the lit cell, orange with the OpenRegister glyph, its name rising beside it; "Built on" rises with "Nextcloud" a sixteenth behind and the white Nextcloud mark above them; the Nextcloud apps pop in round it one a sixteenth; on its second bar Dossiq, Portaliq and Integriq, the apps that keep their records in it, land on top in white. OpenRegister is not repeated on top: it is the layer.',
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15), asked as a question (Round 19: no answer card follows, the proofs answer it). Straight after the opening\'s handover, on its plain field, the OpenRegister cell lands on the loop anchor and turns orange (the app icon exception on cobalt), the apps that keep their records in it (Dossiq, Portaliq, Integriq) lock in white round the Nextcloud hex. Under "OpenRegister" the question builds one word per sixteenth from two frames after the handover, each word slamming in large while the type column\'s camera eases back (ease.brand) so the line always just fits; at rest it is the key frame. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the OpenRegister cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
