/**
 * Filinq, audience film: government Woo and records teams (municipalities, central government
 * and provinces). Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Lane L1,
 * 2026-09-28. Positioning: ds-connext-film-review/audiences/positioning-l1.md.
 *
 * Every Filinq USP has confidence `thin`: this film makes no "only we" claim and is built on the
 * sales points.
 *
 *   hook     every document scanned for a BSN, an IBAN or a name (sp-detect-personal-data; spec
 *            anonymization)
 *   proof 1  you check each match and it is removed for real, not covered (sp-review-and-redact;
 *            spec anonymization-entity-review)
 *   proof 2  one screen carries the Woo request from intake to publication
 *            (sp-woo-request-end-to-end; specs dossier-register, anonymisation-grondslagen-summary)
 *   general  the data layer: who redacted what, and when (platform every-change-logged, strong)
 *   promise  "Publish safely, from your server" (own-server, strong: the data never leaves)
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the scan runs down the page in a wave),
 * #9 text-swap on a held diagram (the page holds while each match turns from found to removed),
 * #5 stepped hex wipe (into the request screen).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { textBlock } from '../../../_lib/stage.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Cells stepping in waves; a stepped wipe of flat shapes between chapters.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The picture holds; only the states change on the beat.' },
]

/** The document page: body lines with the found spans marked. `state` per span: 'found' (lavender) or 'gone' (the text is cut out). */
function page(w, x, y, pw, u, spans, { ring = -1 } = {}) {
	panel(w, x, y, pw, 700, u)
	rect(w, x, y, pw, 12, C.cobalt, 0)
	bar(w, x + 40, y + 50, 240, 16, C.cobalt700)
	const lines = [420, 380, 440, 300, 410, 390, 360, 430, 280, 400, 370, 330]
	const at = { 1: [140, 110], 3: [60, 150], 5: [220, 120], 8: [30, 130], 10: [180, 140] }
	let si = 0
	lines.forEach((lw, i) => {
		const ly = y + 110 + i * 46
		const span = at[i]
		if (!span) { bar(w, x + 40, ly, Math.min(lw, pw - 80), 10, C.cobalt100); return }
		const [sx, sw] = span
		const st = spans[si] || 'plain'
		bar(w, x + 40, ly, sx, 10, C.cobalt100)
		bar(w, x + 40 + sx + sw + 12, ly, Math.max(0, Math.min(lw, pw - 80) - sx - sw - 12), 10, C.cobalt100)
		if (st === 'found') rect(w, x + 40 + sx + 4, ly - 8, sw, 26, C.lavender300, 4, { stroke: C.lavender, 'stroke-width': u })
		else if (st === 'gone') rect(w, x + 40 + sx + 4, ly - 8, sw, 26, 'none', 4, { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': '6 5' })
		else bar(w, x + 40 + sx + 4, ly, sw, 10, C.cobalt100)
		if (si === ring) rect(w, x + 40 + sx - 4, ly - 16, sw + 16, 42, 'none', 6, { stroke: C.orange, 'stroke-width': 2.5 * u })
		si++
	})
}

/** A match in the side list: its kind as a small label, the found text, and its state. */
function match(w, x, y, mw, u, label, state) {
	rect(w, x, y, mw, 78, C.cobalt50, 4 * u)
	rect(w, x + 14, y + 14, 130, 50, C.lavender300, 25)
	textBlock(w, label, { x: x + 32, y: y + 52, size: 36, weight: 600, fill: C.cobalt, clip: false })
	bar(w, x + 160, y + 34, mw - 290, 10, C.cobalt900)
	if (state === 'gone') statusPill(w, x + mw - 110, y + 39, u)
	else if (state === 'found') idlePill(w, x + mw - 100, y + 39, u, { w: 40 })
}

/** Hook: the page scanned; every BSN, IBAN and name found and listed. */
function detectUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	page(w, x, top, 500, u, ['found', 'found', 'found', 'found', 'found'], { ring: 2 })
	const lx = x + 530, lw = width - 530
	panel(w, lx, top, lw, 520, u)
	bar(w, lx + 30, top + 34, 140, 12, C.cobalt700)
	;['BSN', 'IBAN', 'Name', 'Name'].forEach((l, i) => match(w, lx + 20, top + 80 + i * 96, lw - 40, u, l, 'found'))
}

/** Proof 1: each match checked; the accepted ones are cut out of the text, not covered. */
function redactUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	page(w, x, top, 500, u, ['gone', 'gone', 'found', 'plain', 'gone'])
	const lx = x + 530, lw = width - 530
	panel(w, lx, top, lw, 620, u)
	bar(w, lx + 30, top + 34, 140, 12, C.cobalt700)
	;[['BSN', 'gone'], ['IBAN', 'gone'], ['Name', 'found'], ['Name', 'gone']].forEach(([l, s], i) => match(w, lx + 20, top + 80 + i * 96, lw - 40, u, l, s))
	// Accept or reject the open match: the accept button is the one orange, as a ring.
	const by = top + 80 + 4 * 96 + 20
	button(w, lx + lw - 200, by, 170, 44, u)
	button(w, lx + lw - 390, by, 170, 44, u, { kind: 'ghost' })
	rect(w, lx + lw - 208, by - 8, 186, 60, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the Woo request on one screen: its steps from intake to publication, its documents and their state. */
function wooUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 150, u)
	bar(w, x + 90, top + 32, 260, 16, C.cobalt900)
	rect(w, x + width - 240, top + 26, 200, 32, C.lavender300, 16)
	// Five steps on one line, square: intake, collect, assess, redact, publish. The current one is an orange hex.
	const sx = x + 90, step = (width - 180) / 4, sy = top + 104
	rect(w, sx, sy - 1.5 * u, 4 * step, 3 * u, C.cobalt200)
	for (let i = 0; i < 5; i++) {
		if (i === 3) hex(w, sx + i * step, sy, 20, C.orange, 3)
		else circle(w, sx + i * step, sy, 14, i < 3 ? C.mint : C.cobalt100)
	}
	// The documents of the request, each with its state.
	panel(w, x, top + 180, width, 440, u)
	for (let r = 0; r < 5; r++) {
		const cy = top + 240 + r * 80
		if (r) rect(w, x + 20, cy - 40, width - 40, u, C.cobalt50)
		rect(w, x + 40, cy - 22, 36, 44, C.cobalt100, 3)
		bar(w, x + 96, cy - 12, 260 - (r % 3) * 40, 10, C.cobalt900)
		bar(w, x + 96, cy + 8, 140, 7, C.cobalt300)
		if (r < 3) statusPill(w, x + width - 150, cy, u)
		else idlePill(w, x + width - 150, cy, u, { w: 40 })
		rect(w, x + width - 330, cy - 14, 120, 28, r < 3 ? C.lavender300 : C.cobalt50, 14)
	}
}

const content = {
	app: 'filinq',
	audience: { slug: 'woo', name: 'Government Woo and records teams', persona: 'Marieke Jansen, Woo coordinator (municipality); Willem de Groot, jurist (central government)' },
	promise: 'Publish safely,\nfrom your server',
	promiseLine: 'Redact and publish on the Nextcloud you already run; the personal data never leaves your server',
	title: 'Filinq for Woo teams',
	record: { one: 'document', many: 'documents' },
	logline: 'For the teams that answer Woo requests: every document scanned for a BSN, an IBAN or a name, each match checked by a person and removed for real, the whole request on one screen, and who redacted what on record, all on the organisation\'s own server. No "only we" claim: every Filinq USP is thin.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the scan)', '#9 text-swap on a held diagram (found to removed)', '#5 stepped hex wipe (into the request)'],
	neighbours: ['dossiq', 'openregister', 'portaliq'],
	builtOnApps: ['dossiq'],
	hook: {
		title: 'BSN, IBAN, names: found for you',
		caption: 'BSN, IBAN, names:\nfound for you',
		ui: { drawUI: detectUI, tagFill: 'cobalt' },
		source: 'positioning filinq sp-detect-personal-data ("Every document gets scanned for a BSN, an IBAN or a name automatically."); spec anonymization',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the document page with its found spans in lavender, the list of matches on the right (BSN, IBAN, Name as small labels), the Filinq hex (cobalt) on the loop anchor. Technique #3, grid-cell ripple: the scan runs down the page line by line in a wave (each line stepping 20% to 40% to full), and each span it finds turns lavender while its match drops into the list on the same sixteenth. The third span takes the orange ring.',
		sound: 'A soft ripple of ticks with the scan, a pluck per match.',
	},
	proofs: [
		{
			id: 'redact',
			title: 'Checked by you, removed for real',
			caption: 'Checked by you,\nremoved for real',
			source: 'positioning filinq sp-review-and-redact ("Accept or reject each suggestion and get a real removal, not a cover box."); spec anonymization-entity-review',
			motion: 'Technique #9, text-swap on a held diagram: the page and the list hold; one match per beat turns from found to removed. In the page its span empties to a dashed outline (the text is cut out, not covered), in the list its pill turns mint. On the last beat the accept button takes the orange ring for the open match.',
			sound: 'A dry click per accepted match, a soft tick as each span empties.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Checked by you,\nremoved for real', drawUI: redactUI, tagFill: 'cobalt' }),
		},
		{
			id: 'request',
			title: 'One Woo request, one screen',
			caption: 'One Woo request,\none screen',
			source: 'positioning filinq sp-woo-request-end-to-end ("One screen carries a Woo request from collection to publication."); specs dossier-register (Woo Art. 5 grounds), anonymisation-grondslagen-summary',
			motion: 'Technique #5, stepped hex wipe in: four upright cobalt hexes at rising scale step in from the right edge 70 ms apart and cut at full cover. The request lands: its five steps on one square line, the done ones mint, the current step an orange hex; the documents drop in underneath one a sixteenth, each with its ground chip and state.',
			sound: 'Four dry clicks on the wipe, a tick per document.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'One Woo request,\none screen', drawUI: wooUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Who redacted what, and when',
		caption: 'Who redacted what,\nand when',
		source: 'positioning filinq platform every-change-logged, strong ("Every document, redaction and signature carries its own trail: who did it, when"); story.json mechanic 0',
		params: {
			record: { avatar: 'square', title: 240, sub: 160, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 190 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-files', 'nc-mail'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15). Straight after the opening\'s handover, on its plain field, the Filinq cell lands on the loop anchor and turns orange, Dossiq, OpenRegister and Portaliq lock in white round the Nextcloud hex. Under "Filinq" the promise builds one word per sixteenth from two frames after the handover while the type column\'s camera eases back; at rest it is the key frame. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Filinq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
