/**
 * Archiving (nl): the first Dutch film (Round 10, Ruben, 2026-09-28), reworked in Round 16 around
 * one premise: store correctly in Nextcloud, the workspace people already use, and you no longer
 * need a separate DMS or archiving tool. Archiving happens where people work. The e-Depot is no
 * longer a proof (Round 16: not a strong sale).
 *
 * Dutch on screen for this film only. Claims and sources: ds-connext-film-review/archiving/research.json.
 *
 *   opening  BRAND  the shared Conduction opening, 3 bars
 *   hook     the question (Round 21): "Nooit meer archiveren?", two worlds under it (mark: Soevereine werkplek)
 *   proof 1  compliant where you work, not afterwards                         (mark: MDTO · ISO 16175 · Archiefwet)
 *   proof 2  the retention period follows the case type                       (mark: Selectielijst)
 *   proof 3  destroyed on time, with approval and a trail, from the workspace  (mark: Vernietiging)
 *   proof 4  your workspace is the DMS for every system                        (mark: ZGW · ZDS · StUF · OIO · CMMN)
 *            no promise card (Round 19): the proofs answer the question
 *   builtOn  BRAND  "Built on Nextcloud", on screen in Dutch: "Gebouwd op Nextcloud"
 *   install  BRAND  the shared install board, its slogans in Dutch
 *
 * The body runs 12 bars (48 beats): the question 12 beats, four proofs of 9 (Round 19). Modular
 * durations sit on bar boundaries (Round 4), so the body is longer than the template's 10 bars.
 * Opening 3 + body 12 + built on 4 + install 3 = 22 bars, 41.25 s (Round 22: Built on 4 bars).
 *
 * The chapter mark above each caption names the standard or law the scene answers to (the slot
 * where an app film puts the app's name); the caption says what it does for you.
 *
 * Techniques (refs/techniques.md): #4 typewriter (the metadata types itself), #3 grid-cell
 * ripple (the selectielijst lights up to the case type's row), #1 dot-grows-to-fill as an upright
 * hex (into the destruction round), #9 text-swap on a held diagram (the standards swap on the wires).
 */
import { C } from '../../../_lib/brand.js'
import { el, textBlock, measure } from '../../../_lib/stage.js'
import { SQRT3 } from '../../../_lib/core.js'
import { BAR, beatT, snap, RISE, CLEAR, holdFor, wordCount, SAFE } from '../../../_lib/appfilm.js'
import { LOOP_ANCHOR, WINDOW } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, docPage, clipped, topbar, nav, appTag, ncTag, fitCaption, layout, TYPE, workspaceCluster, CORNERS } from '../../../_lib/ui.js'
import { buildOpening, OPENING } from '../../../_lib/scenes/opening.js'
import { builtOnFrame, installFrame, BUILT_ON_DUR, INSTALL_DUR as INSTALL21_DUR, closingWords } from '../../../_lib/scenes/closing.js'

const U = 2.5
const OPEN = OPENING.duration
const BODY = 12 * BAR
// Round 22: Built on is 4 bars, the install board 3 (the shared closing.js).
const BUILT = BUILT_ON_DUR
const INSTALL_DUR = INSTALL21_DUR
const TOTAL = OPEN + BODY + BUILT + INSTALL_DUR

/** The Dutch closing words (the shared pieces take them as options, closing.js). */
/** The closing pieces in Dutch (Round 21: lang 'nl'), OpenRegister as the lead, Dossiq and Filinq beside it. */
const CLOSE = { lang: 'nl', lead: 'openregister', apps: ['dossiq', 'filinq'] }
const NL = closingWords('nl')

/* ---------- the frame every body scene shares ---------- */

/** The chapter mark: live type where an app film puts the app's name (same place, size and weight as appMark). */
function chapter(g, text) {
	const h = TYPE.markH
	// Round 20: a mark may carry several labels (MDTO · ISO 16175 · Archiefwet); it shrinks to stay in the type column.
	let size = Math.round(h * 0.8)
	const w = measure(text, { size, weight: 700, tracking: -0.02 })
	if (w > TYPE.col - TYPE.x) size = Math.floor((size * (TYPE.col - TYPE.x)) / w)
	return textBlock(g, text, { x: TYPE.x, y: TYPE.markY + h * 0.75, size, weight: 700, fill: C.white, tracking: -0.02, clip: false })
}

/**
 * archFrame: hookFrame's composition (the AppMock window on the right, the caption in the type
 * column, a tag hex on the loop anchor) with the chapter mark free, so it can name a standard.
 */
function archFrame(ctx, { mark, caption, drawUI, tag = { app: 'openregister' } }) {
	const g = ctx.g
	chapter(g, mark)
	fitCaption(g, caption, C.white)
	const w0 = layout(ctx.W, ctx.H).win
	const view = el('g', { transform: `translate(${w0.x} ${w0.y}) scale(${w0.s})` }, g)
	const visR = (ctx.W - w0.x) / w0.s
	const visB = (ctx.H - w0.y) / w0.s
	const FW = 720 * U, FH = visB + 60
	const win = clipped(view, 0, 0, FW, FH, 10 * U)
	rect(win, 0, 0, FW, FH, C.white)
	topbar(win, 0, 0, FW, U, { fill: C.cobalt900 })
	nav(win, 0, 24 * U, WINDOW.nav * U, FH - 24 * U, U, { items: 7, active: 2 })
	const x = (WINDOW.nav + 14) * U
	const geom = { x, r: Math.min((720 - 187 - 14) * U, visR - 48 / w0.s), u: U, top: WINDOW.row1 + 60, visB }
	rect(win, (720 - 187) * U, 24 * U, U, FH, C.cobalt100)
	bar(win, geom.x, 95, 250, 35, C.cobalt)
	rect(win, geom.r - 95, 95, 95, 35, C.cobalt, 3 * U)
	drawUI(win, geom)
	const a = LOOP_ANCHOR
	if (tag.nc) ncTag(g, a.x, a.y, a.r)
	else appTag(g, a.x, a.y, a.r, tag.app, { fill: C.cobalt })
}

/** Small mono label inside the mock (a field name), IBM Plex Mono 500. */
const mono = (w, text, x, y, size = 30, fill = C.cobalt400) => textBlock(w, text, { x, y, size, weight: 500, family: 'IBM Plex Mono', fill, clip: false })

/* ---------- the UIs, in the window's mock space (u = 2.5, main column geom.x to geom.r) ---------- */

/** The document and its metadata panel. filled: 0 none, 1 all, 0.75 the last one typing. */
function docWithMeta(w, geom, { filled, ringPanel = false, ringField = -1, standard = null }) {
	const { u } = geom
	const x = geom.x, top = geom.top, dw = 470
	docPage(w, x, top, dw, 600, { k: dw / 500, values: [118, 96, 72], lastOrange: false })
	const px = x + dw + 30, pw = geom.r - px
	panel(w, px, top, pw, 600, u)
	// Round 12: the panel's head names the standard the metadata follows (a label, never 'certified').
	if (standard) textBlock(w, standard, { x: px + 28, y: top + 50, size: 34, weight: 600, fill: C.cobalt, clip: false })
	else bar(w, px + 28, top + 36, 150, 14, C.cobalt700)
	const fields = ['waardering', 'bewaartermijn', 'informatiecategorie', 'archiefvormer', 'dekkingInTijd']
	const vals = [150, 110, 170, 130, 120]
	fields.forEach((f, i) => {
		const fy = top + 96 + i * 98
		mono(w, f, px + 28, fy + 8, 26)
		const sy = fy + 24, sw = pw - 56
		const on = filled >= 1 || (filled > 0 && i < fields.length - 1)
		rect(w, px + 28, sy, sw, 44, on ? C.cobalt50 : C.white, 6, on ? {} : { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': '10 8' })
		if (on) bar(w, px + 44, sy + 17, vals[i], 11, C.cobalt900)
		if (!on && filled > 0 && i === fields.length - 1) {
			// The typewriter: the last value half typed, the cursor after it.
			bar(w, px + 44, sy + 17, vals[i] * 0.55, 11, C.cobalt900)
			rect(w, px + 44 + vals[i] * 0.55 + 6, sy + 9, 3 * u, 26, C.cobalt)
		}
		if (i === ringField) rect(w, px + 18, fy - 22, pw - 36, 100, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	})
	if (ringPanel) rect(w, px - 8, top - 8, pw + 16, 616, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/**
 * Hook (Round 16): two worlds. The document done in the workspace (left, its metadata filled), and a
 * separate archive (right, a grey second system) where the same fields wait to be typed again. The
 * one orange rings the duplicate.
 */
function hookUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	const lw = 400
	docPage(w, x, top, lw, 560, { k: lw / 500, values: [118, 96, 72], lastOrange: false })
	// The re-filing: a square-cornered arrow from the workspace into the other system.
	const ax = x + lw + 10, ay = top + 250
	rect(w, ax, ay - 1.5 * u, 70, 3 * u, C.cobalt300)
	hex(w, ax + 76, ay, 10, C.cobalt300, 1)
	// The separate archive: another system's chrome (grey), the same fields again, half typed.
	const sx = ax + 100, sw = x + width - sx
	rect(w, sx, top, sw, 560, C.cobalt50, 6 * u, { stroke: C.gray300, 'stroke-width': u })
	rect(w, sx, top, sw, 56, C.gray300, 0)
	mono(w, 'apart archief', sx + 24, top + 38, 26, C.cobalt700)
	;['waardering', 'bewaartermijn', 'informatiecategorie', 'archiefvormer'].forEach((f, i) => {
		const fy = top + 96 + i * 104
		mono(w, f, sx + 24, fy + 8, 26)
		rect(w, sx + 24, fy + 24, sw - 48, 44, C.white, 6, { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': i < 1 ? 'none' : '10 8' })
		if (i < 1) bar(w, sx + 40, fy + 41, 120, 11, C.cobalt900)
		if (i === 1) rect(w, sx + 40, fy + 33, 3 * u, 26, C.cobalt)
	})
	// The one orange: the fields typed a second time.
	rect(w, sx + 12, top + 72, sw - 24, 196, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the same document, the fields filling as it is made; the last one types on. */
const mdtoUI = (w, geom) => docWithMeta(w, geom, { filled: 0.75, ringField: 4 })

/** Proof 2: the case, its type, and the selectielijst with the matching row lit; the date follows. */
function selectieUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	// The case and its type.
	panel(w, x, top, width, 120, u)
	hex(w, x + 60, top + 60, 28, C.lavender, 4)
	bar(w, x + 110, top + 40, 240, 16, C.cobalt900)
	mono(w, 'zaaktype', x + 110, top + 92, 26)
	bar(w, x + 250, top + 82, 180, 11, C.cobalt700)
	statusPill(w, x + width - 160, top + 60, u)
	// The list: rows of categories; the ripple has passed and one row stays lit.
	const ly = top + 160, lh = 440
	panel(w, x, ly, width, lh, u)
	mono(w, 'selectielijst', x + 28, ly + 44, 28, C.cobalt700)
	const lit = 3
	for (let i = 0; i < 6; i++) {
		const ry = ly + 76 + i * 58
		const rowFill = i === lit ? C.cobalt100 : [C.cobalt50, C.white][i % 2]
		rect(w, x + 16, ry, width - 32, 50, rowFill, 4)
		for (let c = 0; c < 4; c++) {
			const cx = x + 36 + c * ((width - 72) / 4)
			// Ripple residue: cells nearer the lit row stay a little brighter.
			const d = Math.abs(i - lit)
			bar(w, cx, ry + 20, [70, 150, 90, 110][c] - d * 6, 10, i === lit ? C.cobalt900 : C.cobalt300, { opacity: Math.max(0.35, 1 - d * 0.18) })
		}
	}
	// The lit row's result: keep or destroy, and the date it resolves to, marked with the scene's one orange.
	const ry = ly + 76 + lit * 58
	hex(w, x + width - 56, ry + 25, 16, C.orange, 2)
	// A square-cornered wire from the case type down to the lit row.
	rect(w, x + 60 - 1.5 * u, top + 120, 3 * u, ry - top - 120 + 25, C.cobalt300)
	rect(w, x + 60, ry + 25 - 1.5 * u, 40, 3 * u, C.cobalt300)
}

/**
 * Proof 3 (Round 16): destruction on time, from the same workspace. The records due today (left),
 * the approval (right: a person, an approved pill, the one orange on the approve step), and under
 * both the verklaring van vernietiging and the trail, chained row by row.
 */
function destroyUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	const bw = (width - 30) / 2
	// Left: the destruction list, records due on their date.
	panel(w, x, top, bw, 330, u)
	mono(w, 'vernietigingslijst', x + 28, top + 44, 28, C.cobalt700)
	for (let i = 0; i < 4; i++) {
		const ry = top + 80 + i * 58
		rect(w, x + 20, ry, bw - 40, 46, i % 2 ? C.white : C.cobalt50, 4)
		hex(w, x + 48, ry + 23, 12, C.lavender, 2)
		bar(w, x + 72, ry + 18, [150, 120, 170, 130][i], 10, C.cobalt900)
		bar(w, x + bw - 120, ry + 19, 70, 8, C.cobalt300)
	}
	// Right: the approval, a person and the approved step.
	const rx = x + bw + 30
	panel(w, rx, top, bw, 330, u)
	mono(w, 'akkoord', rx + 28, top + 44, 28, C.cobalt700)
	circle(w, rx + 70, top + 130, 34, C.cobalt300)
	bar(w, rx + 122, top + 112, 160, 12, C.cobalt900)
	bar(w, rx + 122, top + 138, 110, 8, C.cobalt300)
	statusPill(w, rx + 40, top + 230, u)
	hex(w, rx + bw - 60, top + 230, 18, C.orange, 2)
	// Under both: the verklaring and the trail, rows chained through small hexes.
	const ty = top + 360
	panel(w, x, ty, width, 260, u)
	docPage(w, x + width - 190, ty + 26, 160, 210, { k: 0.3, values: [96, 72], lastOrange: false, shadow: null })
	hex(w, x + width - 60, ty + 210, 18, C.forest, 3)
	rect(w, x + 50 - 1.5 * u, ty + 40, 3 * u, 180, C.cobalt200)
	for (let i = 0; i < 4; i++) {
		const cy = ty + 44 + i * 58
		hex(w, x + 50, cy, 13, C.cobalt400, 2)
		bar(w, x + 84, cy - 6, [260, 220, 300, 240][i], 11, C.cobalt900)
		bar(w, x + 400, cy - 5, 190, 9, C.cobalt200)
	}
}

/** Proof 4: one case, wires to the case systems; the standard names swap on the held wires (#9). */
function standardsUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	// The workspace: the case with its documents, the one store.
	panel(w, x, top, width, 130, u)
	hex(w, x + 64, top + 65, 28, C.lavender, 4)
	bar(w, x + 120, top + 44, 260, 16, C.cobalt900)
	bar(w, x + 120, top + 76, 170, 9, C.cobalt300)
	statusPill(w, x + width - 160, top + 65, u)
	// Square-cornered wires down to five outside systems, split at one orange hex.
	const n = 5, gap = 14, bw = (width - gap * (n - 1)) / n, by = top + 240
	const mid = x + width / 2
	rect(w, mid - 1.5 * u, top + 130, 3 * u, 60, C.cobalt300)
	rect(w, x + bw / 2, top + 188, width - bw, 3 * u, C.cobalt300)
	hex(w, mid, top + 188 + 1.5 * u, 16, C.orange, 2)
	;['ZGW', 'ZDS', 'StUF', 'OIO', 'CMMN'].forEach((label, i) => {
		const bx = x + i * (bw + gap)
		rect(w, bx + bw / 2 - 1.5 * u, top + 188, 3 * u, by - top - 188, C.cobalt300)
		panel(w, bx, by, bw, 330, u)
		rect(w, bx, by, bw, 60, C.cobalt50, 0)
		textBlock(w, label, { x: bx + bw / 2, y: by + 42, size: 30, weight: 600, fill: C.cobalt, anchor: 'middle', clip: false })
		for (let k = 0; k < 4; k++) bar(w, bx + 18, by + 100 + k * 56, bw - 36 - (k % 2) * 30, 10, k % 2 ? C.cobalt300 : C.cobalt900)
	})
}

/** The promise: the three apps that do the archiving round the Nextcloud hex, OpenRegister orange. */
function promiseFrame(ctx, { mark, text }) {
	chapter(ctx.g, mark)
	fitCaption(ctx.g, text, C.white)
	const r = 80, gap = 8
	const s = r + gap / SQRT3
	const cx = LOOP_ANCHOR.x + 1.5 * SQRT3 * s
	const cy = LOOP_ANCHOR.y + 1.5 * s
	const ring = [{ ...CORNERS.nw, id: 'openregister', fill: C.orange, glyph: C.white }, { ...CORNERS.ne, id: 'dossiq' }, { ...CORNERS.s, id: 'filinq' }]
	workspaceCluster(ctx.g, cx, cy, r, gap, { ring, open: [], fieldTop: -Infinity, fieldScale: 0.5, W: ctx.W, H: ctx.H })
}

/* ---------- the scenes ---------- */

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Captions typed on letter by letter (#4); a mark on a UI element grows to fill the frame (#1).' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping through opacity in waves (#3).' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only the words on it change (#9).' },
]

const BODY_SCENES = [
	{
		id: 'hook', from: 0, to: 12, mark: 'Soevereine werkplek', caption: 'Nooit meer\narchiveren?', tag: { nc: true }, ui: hookUI,
		title: 'The question: never archive again?',
		gloss: 'Never archive again? (Round 21)',
		apps: ['nextcloud'],
		motion: 'Round 19: the question opens the film, over the two-worlds picture. The window slides in over the opening\'s fading handover field. Left the finished document in the workspace; a square-cornered arrow carries it into a second, grey system on the right, the separate archive, where the same fields are typed again. On beat 5 the orange ring draws round the fields typed twice: the work the question asks away. The question holds 12 beats (5.6 s), since the promise card is gone.',
		sound: 'Gentle open, no stinger. Two dull ticks as the arrow re-files, a low tick as the orange ring draws.',
		source: 'Ruben, Rounds 16 and 19: the question up front, the two worlds under it. Chapter mark "Soevereine werkplek" (Round 20).',
	},
	{
		id: 'mdto', from: 12, to: 21, mark: 'MDTO · ISO 16175 · Archiefwet', caption: 'Compliant waar je\nwerkt, niet achteraf', tag: { app: 'filinq' }, ui: mdtoUI,
		title: 'Compliant where you work, not afterwards',
		gloss: 'Compliant where you work, not afterwards',
		apps: ['filinq', 'openregister'],
		motion: 'Technique #4, typewriter. No cut: the push-in holds on the panel and the dashed slots fill top to bottom, one per beat, each value typing on at one greeked character pair per 0.1 s with a hard on and off, a cursor after it. The field names are MDTO\'s own (waardering, bewaartermijn, informatiecategorie, archiefvormer, dekkingInTijd) as small mono labels. The slot being typed takes the orange ring. The panel head carries one small label, NEN-ISO 16175 (Round 12): the records-management standard the metadata follows, a label only, never "certified" or "compliant". Filinq\'s hex on the anchor: the document is Filinq\'s.',
		sound: 'Soft key ticks under the typing, a pluck as each field completes, a brighter pluck on the last.',
		source: 'research.json c1: openregister retention-management spec:12 (MDTO-compliant archival metadata, defaults on creation), tmlo-auto-populate spec:12, edepot-transfer spec:14 and :250 (dekkingInTijd emitted); archival-conformance proposal:255 (MDTO-XML 1.0.1 XSD test). NEN-ISO 16175 label: openregister archivering-vernietiging spec:665 (NEN-ISO 16175-1:2020, the successor to NEN 2082). Stored in the workspace: procest document-zaakdossier spec:14 (every document a Nextcloud file in the case\'s own folder); openregister object-interactions spec:154 (files stored in Nextcloud\'s filesystem via IRootFolder, linked to the record).',
	},
	{
		id: 'selectielijst', from: 21, to: 30, mark: 'Selectielijst', caption: 'Elk dossier krijgt\nvanzelf zijn termijn', tag: { app: 'dossiq' }, ui: selectieUI,
		title: 'Every file gets its retention period automatically',
		gloss: 'Every file (documents and cases) gets its retention period automatically',
		apps: ['dossiq', 'openregister'],
		motion: 'Hard cut on the downbeat. Then technique #3, grid-cell ripple: the case lands on top with its zaaktype, and a wave runs through the selectielijst below, cells stepping full, 40%, 20% in 0.3 s waves outward from the case type\'s row, which stays lit (cobalt-100). A square-cornered wire drops from the case type to that row, and its result hex lands in orange: keep or destroy, and when.',
		sound: 'A hard click on the cut, a rising run of ticks under the ripple, a pluck as the row locks.',
		source: 'research.json c2: procest archief-edepot-handover spec:14 (per-zaaktype retention: bewaartermijn, selectielijst categorie/versie, e-Depot bestemming, MDTO version); case-types spec:81 (archiefnominatie per result type); openregister retention-management spec:49 and :79; Filinq archiefwet-retention-engine proposal.',
	},
	{
		id: 'vernietiging', from: 30, to: 39, mark: 'Vernietiging', caption: 'Vernietigd met\nakkoord en spoor', tag: { app: 'openregister' }, ui: destroyUI,
		title: 'Destroyed on time, with approval and a trail, from the same workspace',
		gloss: 'Destroyed with approval and a trail (on time: the date comes from the selectielijst beat before)',
		apps: ['openregister'],
		motion: 'Technique #1, dot-grows-to-fill as an upright hex: the orange result hex from proof 2 grows past the frame (ease.snap, one beat) and the new window opens out of a hex at the approve step. Left the destruction list, records due on their date, rows landing one a sixteenth; right the approval, a person and the approved pill, the orange hex on the approve step; under both the verklaring van vernietiging lands with its seal and the trail builds row by row, chained through small hexes. All in the same workspace window: no second system.',
		sound: 'A whoosh through the hex, ticks as the list rows land, a crisp click on the approval, a tick per trail row.',
		source: 'research.json c3: openregister retention-management spec:108 (destruction lists via a background job), :136 (multi-step approval), :174 (destruction certificates), :189 (legal hold); archivering-vernietiging spec:529 (the file deletion logged as archival.file_destroyed); audit-hash-chain spec:34 (SHA-256 chain); positioning openregister usp-archive-destroy (verified). The e-Depot is no longer a proof (Round 16).',
	},
	{
		id: 'standards', from: 39, to: 48, mark: 'ZGW · ZDS · StUF · OIO · CMMN', caption: 'Je werkplek is het\nDMS voor elk systeem', tag: { app: 'dossiq' }, ui: standardsUI,
		title: 'Your workspace is the DMS for every system',
		gloss: 'Your workspace is the DMS for every system',
		apps: ['dossiq', 'filinq'],
		motion: 'Technique #9, text-swap on a held diagram. Whip in (4 frames, ease.snap). The workspace case sits on top; square-cornered wires split at the orange hex to five outside systems, one per beat, each headed by the standard it speaks: ZGW, ZDS, StUF, OIO, CMMN. The diagram then holds while the mark above the caption steps through the same five names, one per beat, and settles on all five.',
		sound: 'A whip whoosh, a line-draw hiss, a pluck per box, a dry click on the swap.',
		source: 'Workspace as DMS: procest document-projection spec:4, :72 (a document is a normal file in the case folder, and the ZGW DRC (Documenten) API still lists it for other systems); document-zaakdossier spec:14. ZGW: procest zgw-api-mapping, zgw-brc, zgw-autorisaties-api. StUF: procest stuf-integration, stuf-zkn-outbound. ZDS: docudesk generate-store-in-case-system. CMMN: procest case-management spec:17. OIO: in the sources only as ZGW ObjectInformatieObject (procest zgw-documenten-api proposal:23); the Danish OIO Sag og Dokument is not in the specs yet (dossiq#3174).',
	},
]

// Round 19: no promise card; the proofs answer the question and Gebouwd op Nextcloud follows.

const s2 = (t) => `${t.toFixed(2)} s`
const barOf = (t) => Math.floor(t / BAR + 1e-6) + 1

function bodyBoard(sc) {
	const start = OPEN + beatT(sc.from), end = OPEN + beatT(sc.to)
	const shows = sc.id === 'hook' ? start : snap(start + RISE)
	const clears = snap(end - CLEAR)
	return {
		id: sc.id, layer: 'app', title: sc.title, start, end,
		bars: `${barOf(start)}-${barOf(end - 0.01)}`,
		words: sc.caption, mark: sc.mark, gloss: sc.gloss, shows, clears, hold: +(clears - shows).toFixed(2),
		apps: sc.apps, motion: sc.motion, sound: sc.sound, source: sc.source,
		draw: (ctx) => archFrame(ctx, { mark: sc.mark, caption: sc.caption, drawUI: sc.ui, tag: sc.tag }),
	}
}


export const boards = [
	{
		id: 'opening', layer: 'brand', module: 'opening', title: 'Conduction opening (shared module)',
		start: 0, end: OPEN, bars: '1-3', words: '', apps: ['openregister'],
		motion: `The shared opening as it is (_lib/scenes/opening.js, 3 bars, ${s2(OPEN)}): hex canvas, ripple to the app cluster, the ripple that steps them off, the company name, the dry click.`,
		sound: 'The opening\'s own, ending on a dry click.', source: 'Shared module, no claim.',
		draw(ctx) { const up = buildOpening(ctx.g, { defs: ctx.defs }); const k = OPENING.T.powerOn + 0.9; up(k); return () => up(k) },
	},
	...BODY_SCENES.map(bodyBoard),
	{
		id: 'builtOn', layer: 'brand', module: 'builtOn', title: 'Gebouwd op Nextcloud, verrijkt door Conduction (shared closing piece, Round 22)',
		start: OPEN + BODY, end: OPEN + BODY + BUILT, bars: `${barOf(OPEN + BODY)}.1-${barOf(OPEN + BODY) + Math.round(BUILT / BAR) - 1}.4`,
		words: NL.builtOn, gloss: 'Built on Nextcloud / Reply from Mail / Plan in Calendar / Save to Contacts / Share in Files / Chat in Talk / Follow up in Tasks / Manage from Deck / Enhanced by Conduction',
		apps: ['openregister', 'dossiq', 'filinq', 'nextcloud'],
		motion: 'Rounds 21 and 22 (closing.js builtOnScene, lang nl, 4 bars): the ConNext film\'s component connection section with OpenRegister as the lead. OpenRegister pops in orange high on the right with Dossiq and Filinq beside it in white; "Gebouwd op" and "Nextcloud" rise under the white Nextcloud mark. The Nextcloud apps load one a beat into the grid below it, in Nextcloud blue, each on its own square-cornered connector, and the line under the headline swaps with each ("Antwoord vanuit Mail" ... "Beheer vanuit Deck", the name in Nextcloud cyan). On bar 4 the camera pulls back over two beats and the rest of the Conduction family comes into view round them, one ring out, each linked to its nearest cell, OpenRegister still the one orange; the line becomes "Verrijkt door Conduction". Every hex is the grid\'s own size. Everything leaves in the last four frames.',
		sound: 'A pluck and a low thud as the lead lands, a tick up the scale as each Nextcloud app connects, a soft whoosh as the camera pulls back to the family.',
		source: 'Shared module (closing.js at ds-connext-film 60b2036, Round 22); the component lines are what the data layer links a record to (NC_LINKS, round4/facts.json fact a).',
		draw: (ctx) => { builtOnFrame(ctx, CLOSE) },
	},
	{
		id: 'install', layer: 'brand', module: 'install', title: 'Installeer het, gebruik het, bezit het (shared install board, Round 22)',
		start: OPEN + BODY + BUILT, end: TOTAL, bars: `${barOf(OPEN + BODY + BUILT)}.1-${barOf(OPEN + BODY + BUILT) + 2}.4`,
		words: NL.install, gloss: 'Install it / Use it / Own it / The code stays open source, your data stays yours',
		apps: ['conduction'],
		motion: 'Round 22 (closing.js installScene, concept current, lang nl, 3 bars): "Installeer het", "Gebruik het" and "Bezit het" are laid in dim; a current runs in from the left edge down a square-cornered wire beside them and powers each word on as it reaches it, one a beat, the orange moving to each and landing on "Bezit het"; it runs on under "Bezit het" to the Conduction avatar top right, which powers on. Then "De code blijft open source, / de data blijft van jou" rises on two lines and holds to the end. No header.',
		sound: 'The current\'s crackle along the wire, a click as each word powers on, a power-on as the avatar lights, a pluck on the last line; the bed resolves.',
		source: 'Shared module (closing.js at ds-connext-film 60b2036, Round 22): CLOSING_TEXT.nl.',
		draw: (ctx) => { installFrame(ctx, CLOSE) },
	},
]

/** The body's reading budget (the bible: 20 to 30 words; hold max(1.5 s, 0.4 s x words); max 8 words and 2 lines a card). */
function budget() {
	const body = boards.filter((b) => !['opening', 'builtOn', 'install'].includes(b.id))
	const rows = body.map((b) => {
		const words = wordCount(b.words)
		const need = holdFor(words)
		const lines = b.words.split('\n').length
		const issues = []
		if (words > 8) issues.push(`${words} words on one card`)
		if (lines > 2) issues.push(`${lines} lines`)
		if (b.hold + 1e-6 < need) issues.push(`holds ${b.hold} s, needs ${need.toFixed(2)} s`)
		if (/[.]\s*$/m.test(b.words)) issues.push('a line ends in a full stop')
		if (/[—–]|--/.test(b.words)) issues.push('a dash')
		return { id: b.id, words, hold: b.hold, need: +need.toFixed(2), issues }
	})
	const total = rows.reduce((a, r) => a + r.words, 0)
	const filmIssues = total < 25 || total > 32 ? [`${total} words in the body (Round 16 brief: 25 to 32)`] : []
	return { total, ok: !filmIssues.length && rows.every((r) => !r.issues.length), filmIssues, rows }
}

export const meta = {
	id: 'archiving-nl',
	title: 'Je werkplek is het archief (nl)',
	language: 'nl',
	logline: 'A Dutch release film that opens on a question (Rounds 19 and 21): never archive again? The proofs answer it: you work compliant with MDTO, ISO 16175 and the Archiefwet where you work, not afterwards; every file gets its retention period automatically; destruction runs with approval and a trail from the same workspace; and the workspace is the document store other systems use over ZGW, ZDS, StUF, OIO and CMMN.',
	references: REFS,
	techniques: ['#4 typewriter (the metadata types itself)', '#3 grid-cell ripple (the selectielijst)', '#1 dot-grows-to-fill as an upright hex (into the destruction round)', '#9 text-swap on a held diagram (the standards)'],
	template: 'archiving (archFrame on the app-film grid)',
	format: '16x9',
	background: C.cobalt,
	safe: { ...SAFE },
	duration: TOTAL,
	budget: budget(),
}
