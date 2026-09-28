/**
 * Filinq, audience film: notaries, law firms and insurers (cg-judiciary-legal,
 * cg-professional-services). Direction C on the app-film template, wrapped by
 * _lib/audiencefilm.js. Lane L1, 2026-09-28. Positioning:
 * ds-connext-film-review/audiences/positioning-l1.md.
 *
 * Every Filinq USP has confidence `thin`: no "only we" claim. The one USP used (template
 * governance) is shown as a plain feature.
 *
 *   hook     pick a template and the document fills itself from the record
 *            (sp-generate-from-record; spec document-creatie-sjablonen)
 *   proof 1  signed on a phone, the same day (sp-e-signing; specs document-signing,
 *            portal-signing-surface)
 *   proof 2  lock the template and see every change (usp-template-governance, thin; spec
 *            template-management REQ-TMPL-09 version diff)
 *   general  flows: signed, and a flow you drew takes over (platform draw-your-flows, medium;
 *            sp-app-integrations); the customer draws the flow, never "pre-built"
 *   promise  "The right version, signed and filed"
 *
 * Techniques (refs/techniques.md): #10 cluster-to-container merge (the record's details drift
 * into the document's slots), #11 whip-pan on the beat (to the signer's phone), #4 typewriter
 * (the changed clause types into the new version).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { el } from '../../../_lib/stage.js'
import { rect, bar, circle, hex, panel, statusPill, phone, button, docPage, toggle } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A fast move on the beat between two held shots.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Letters typed one by one under a UI push-in.' },
]

/** Hook: the client's record and the template list on the left, the document filling itself on the right. */
function generateUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const lw = 330
	// The record: a person and their details.
	panel(w, x, top, lw, 250, u)
	circle(w, x + 90, top + 70, 30, C.cobalt300)
	bar(w, x + 136, top + 56, 150, 14, C.cobalt900)
	for (let k = 0; k < 3; k++) { bar(w, x + 40, top + 130 + k * 36, 60, 8, C.cobalt400); bar(w, x + 116, top + 128 + k * 36, 130 - k * 20, 10, C.cobalt700) }
	// The templates: one picked.
	panel(w, x, top + 280, lw, 300, u)
	for (let k = 0; k < 4; k++) {
		const ty = top + 310 + k * 66
		rect(w, x + 20, ty, lw - 40, 52, k === 1 ? C.cobalt100 : C.cobalt50, 4 * u)
		rect(w, x + 40, ty + 12, 22, 28, C.white, 2, { stroke: C.cobalt300, 'stroke-width': u })
		bar(w, x + 80, ty + 20, 150 - (k % 2) * 30, 10, C.cobalt900)
	}
	// The document, filled from the record: its last value is the scene's one orange (docPage lastOrange).
	const dx = x + lw + 40, dw = width - lw - 40
	const slots = docPage(w, dx, top, dw, 700, { k: dw / 500, values: [118, 96, 72] })
	// Square wires from the record's details to the page edge, level with the slots they fill.
	slots.forEach((s, i) => {
		const ry = top + 132 + i * 36
		rect(w, x + lw, ry - 1.5 * u, 20 + i * 10, 3 * u, C.cobalt300)
		rect(w, x + lw + 20 + i * 10 - 1.5 * u, Math.min(ry, s.cy), 3 * u, Math.abs(s.cy - ry), C.cobalt300)
		rect(w, x + lw + 20 + i * 10, s.cy - 1.5 * u, dx - x - lw - 20 - i * 10, 3 * u, C.cobalt300)
	})
}

/** Proof 1: the signer's phone: the document, the signature drawn, the sign button; signed, the same day. */
function signUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// Behind: the document's signing status, signers listed.
	panel(w, x, top, width, 520, u)
	bar(w, x + 90, top + 34, 240, 14, C.cobalt900)
	for (let r = 0; r < 3; r++) {
		const cy = top + 120 + r * 90
		circle(w, x + 70, cy, 22, r ? C.cobalt200 : C.cobalt300)
		bar(w, x + 110, cy - 6, 180 - r * 30, 10, C.cobalt900)
		if (r === 0) statusPill(w, x + 380, cy, u)
		else rect(w, x + 380, cy - 14, 80, 28, C.cobalt50, 14)
	}
	// The phone: the document, a signature line with the signature, the sign button (the one orange, as a ring).
	const p = phone(w, x + width - 380, top + 30, 340, 680)
	const sx = p.x + 30, sw = p.w - 60
	rect(p.screen, sx, p.y + 80, sw, 250, C.white, 4 * u, { stroke: C.cobalt100, 'stroke-width': u })
	for (let k = 0; k < 5; k++) bar(p.screen, sx + 24, p.y + 110 + k * 30, sw - 60 - (k % 2) * 40, 8, C.cobalt100)
	rect(p.screen, sx + 20, p.y + 400, sw - 40, 2 * u, C.cobalt300)
	el('path', { d: `M ${sx + 40} ${p.y + 390} l 30 -40 l 16 36 l 26 -52 l 20 50 l 34 -30 l 40 20`, fill: 'none', stroke: C.cobalt900, 'stroke-width': 3 * u, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, p.screen)
	button(p.screen, sx, p.y + 450, sw, 60, u)
	rect(p.screen, sx - 8, p.y + 442, sw + 16, 76, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the template locked while in use, and the change between two versions shown line by line. */
function templateUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The template's header: its name, in use, the lock switch on (ringed, the one orange).
	panel(w, x, top, width, 120, u)
	bar(w, x + 90, top + 36, 240, 16, C.cobalt900)
	rect(w, x + 90, top + 70, 110, 26, C.mint300, 13)
	toggle(w, x + width - 110, top + 60, u, true)
	rect(w, x + width - 124, top + 30, 83, 60, 'none', 30, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// Two versions side by side; the changed clause: removed (lavender) on the left, added (mint) on the right.
	const cw = (width - 30) / 2
	;[0, 1].forEach((c) => {
		const cx = x + c * (cw + 30)
		panel(w, cx, top + 150, cw, 480, u)
		rect(w, cx + 30, top + 180, 60, 28, C.cobalt100, 14)
		for (let k = 0; k < 8; k++) {
			const ly = top + 240 + k * 46
			const changed = k === 3 || k === 4
			if (changed) rect(w, cx + 16, ly - 12, cw - 32, 34, c ? C.mint300 : C.lavender300, 3)
			bar(w, cx + 30, ly, cw - 90 - ((k * 37) % 80), 10, changed ? (c ? C.mint : C.lavender) : C.cobalt100)
		}
	})
	rect(w, x + cw + 30 + 30 + cw - 150, top + 240 + 4 * 46 - 4, 3 * u, 18, C.cobalt)
}

const content = {
	app: 'filinq',
	audience: { slug: 'signing', name: 'Notaries, law firms and insurers', persona: 'Peter van Dijk, notaris (six-person office); Sanne Bakker, policy officer for customer letters at an insurer' },
	promise: 'The right version,\nsigned and filed',
	promiseLine: 'The right version of every document, filled from the record, signed and filed',
	title: 'Filinq for notaries and insurers',
	record: { one: 'document', many: 'documents' },
	logline: 'For the offices that send deeds, contracts and policy letters: pick a template and the document fills itself, the client signs on a phone the same day, the template is locked and every change shows, and a flow you drew takes the signed document on. No "only we" claim: every Filinq USP is thin.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge (details into the document)', '#11 whip-pan on the beat (to the phone)', '#4 typewriter (the changed clause)'],
	neighbours: ['pipelinq', 'portaliq', 'openregister'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'Pick a template, it fills itself',
		caption: 'Pick a template,\nit fills itself',
		ui: { drawUI: generateUI, tagFill: 'cobalt' },
		source: 'positioning filinq sp-generate-from-record ("Pick a template and a case and the letter fills itself."); spec document-creatie-sjablonen (merge data resolved from the record)',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the client\'s record and the template list on the left, the document on the right, the Filinq hex (cobalt) on the loop anchor. The picked template row lights. Technique #10, cluster-to-container merge: the record\'s details lift off as small loose shapes, drift along square wires and settle into the document\'s slots within one beat; the last value lands orange.',
		sound: 'A tick on the template pick, three plucks as the values land.',
	},
	proofs: [
		{
			id: 'sign',
			title: 'Signed on a phone, same day',
			caption: 'Signed on a phone,\nsame day',
			source: 'positioning filinq sp-e-signing ("Send a document to one or more people and follow it to a signature."; scene: "a signer opens it on a phone and signs there"; so: "a decision is signed the same day it was written"); specs document-signing, portal-signing-surface',
			motion: 'Technique #11, whip-pan: a 5-frame move on ease.snap (rendered with --blur 4) from the filled document to the signer\'s phone. The signature draws itself on the line in one stroke, the sign button takes the orange ring, and behind the phone the first signer\'s pill turns mint.',
			sound: 'A short whoosh on the whip, a scratch of pen under the stroke, a dry click on sign.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Signed on a phone,\nsame day', drawUI: signUI, tagFill: 'cobalt' }),
		},
		{
			id: 'template',
			title: 'Lock the template, see every change',
			caption: 'Lock the template,\nsee every change',
			source: 'positioning filinq usp-template-governance, confidence thin, shown as a feature only ("See what changed between versions and lock a template while it\'s in use."); spec template-management REQ-TMPL-09 (template version diff retrieval)',
			motion: 'The template header lands; its lock switch flips on and takes the orange ring. The two versions slide in side by side; technique #4, typewriter: the changed clause types itself into the new version (greeked characters one pair per 0.1 s, hard on and off, a cursor), and on the same beat the old clause turns lavender on the left and the new one mint on the right.',
			sound: 'A dry click on the lock, soft key ticks under the typing.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Lock the template,\nsee every change', drawUI: templateUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'flows',
		title: 'Signed? Your flow takes over',
		caption: 'Signed? Your flow\ntakes over',
		source: 'positioning filinq platform draw-your-flows, medium ("A document being created or changed can trigger a rule the organisation drew itself") and sp-app-integrations ("call other tools on a change"); story.json mechanic 7 (the customer draws each flow, never pre-built)',
		sound: 'A tick as each node is placed, a pluck as the last settles into its slot.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15). Straight after the opening\'s handover, on its plain field, the Filinq cell lands on the loop anchor and turns orange, Pipelinq, Portaliq and OpenRegister lock in white round the Nextcloud hex. Under "Filinq" the promise builds one word per sixteenth from two frames after the handover while the type column\'s camera eases back; at rest it is the key frame. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Filinq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
