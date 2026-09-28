/**
 * Archiving (nl): the first Dutch film (Round 10, Ruben, 2026-09-28). Not an app film but an
 * answer to a government question: how a Nextcloud workspace, with Conduction's apps and the
 * ZGW and ZDS standards, keeps you in line with MDTO and the Archiefwet. Core idea: pick
 * Nextcloud as your workspace and archiving stops being a verb and becomes the default.
 *
 * Dutch on screen for this film only. Claims and sources: ds-connext-film-review/archiving/research.json.
 *
 *   opening  BRAND  the shared Conduction opening, 3 bars
 *   hook     the record manager's worry: "Is dit straks wel archiefwaardig?"  (mark: Archiefwet)
 *   proof 1  metadata written as the document is made                        (mark: MDTO)
 *   proof 2  the retention period follows the case type                       (mark: Selectielijst)
 *   proof 3  destroyed or transferred, with proof                              (mark: e-Depot)
 *   proof 4  every case system speaks the same language                       (mark: ZGW en ZDS)
 *   promise  "Archiefwaardig vanaf het begin"                                 (mark: Nextcloud)
 *   builtOn  BRAND  "Built on Nextcloud", on screen in Dutch: "Gebouwd op Nextcloud"
 *   install  BRAND  the shared install board, its slogans in Dutch
 *
 * The body runs 12 bars (48 beats): the hook 7 beats, four proofs of 8, the promise 9. Modular
 * durations sit on bar boundaries (Round 4), so the body is longer than the template's 10 bars.
 * Opening 3 + body 12 + built on 2 + install 3 = 20 bars, 37.5 s.
 *
 * The chapter mark above each caption names the standard or law the scene answers to (the slot
 * where an app film puts the app's name); the caption says what it does for you.
 *
 * Techniques (refs/techniques.md): #4 typewriter (the metadata types itself), #3 grid-cell
 * ripple (the selectielijst lights up to the case type's row), #1 dot-grows-to-fill as an upright
 * hex (into the e-Depot), #9 text-swap on a held diagram (the standards swap on the wires).
 */
import { C } from '../../../_lib/brand.js'
import { el, textBlock } from '../../../_lib/stage.js'
import { SQRT3 } from '../../../_lib/core.js'
import { BAR, beatT, snap, RISE, CLEAR, holdFor, wordCount, SAFE } from '../../../_lib/appfilm.js'
import { LOOP_ANCHOR, WINDOW } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, docPage, clipped, topbar, nav, appTag, ncTag, fitCaption, layout, TYPE, workspaceCluster, CORNERS } from '../../../_lib/ui.js'
import { buildOpening, OPENING } from '../../../_lib/scenes/opening.js'
import { builtOnFrame, installFrame } from '../../../_lib/scenes/closing.js'

const U = 2.5
const OPEN = OPENING.duration
const BODY = 12 * BAR
const BUILT = 2 * BAR
const INSTALL_DUR = 3 * BAR
const TOTAL = OPEN + BODY + BUILT + INSTALL_DUR

/** The Dutch closing words (the shared pieces take them as options, closing.js). */
const BUILT_ON = { caption: 'Gebouwd op', markText: 'Nextcloud' }
const INSTALL_NL = { slogans: ['Installeer de app', 'Gebruik de app', 'Je data blijft van jou'], line: 'Altijd 100% open source en gratis' }

/* ---------- the frame every body scene shares ---------- */

/** The chapter mark: live type where an app film puts the app's name (same place, size and weight as appMark). */
function chapter(g, text) {
	const h = TYPE.markH
	return textBlock(g, text, { x: TYPE.x, y: TYPE.markY + h * 0.75, size: Math.round(h * 0.8), weight: 700, fill: C.white, tracking: -0.02, clip: false })
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

/** Hook: the document is done, its archival fields are empty: the worry, ringed. */
const hookUI = (w, geom) => docWithMeta(w, geom, { filled: 0, ringPanel: true })

/** Proof 1: the same document, the fields filling as it is made; the last one types on. */
const mdtoUI = (w, geom) => docWithMeta(w, geom, { filled: 0.75, ringField: 4, standard: 'NEN-ISO 16175' })

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

/** Proof 3: on the date, one record is destroyed with a certificate, the other goes to the e-Depot; below, the trail. */
function edepotUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	const bw = (width - 30) / 2
	// Left: the verklaring van vernietiging, a page with a seal.
	panel(w, x, top, bw, 330, u)
	mono(w, 'vernietigd', x + 28, top + 44, 28, C.cobalt700)
	docPage(w, x + 40, top + 70, bw - 80, 230, { k: 0.4, values: [96, 72], lastOrange: false, shadow: null })
	hex(w, x + bw - 80, top + 260, 26, C.forest, 3)
	// Right: the e-Depot, the package arriving (stacked cells: the SIP), the one orange where it lands.
	const rx = x + bw + 30
	panel(w, rx, top, bw, 330, u)
	mono(w, 'overgebracht', rx + 28, top + 44, 28, C.cobalt700)
	rect(w, rx + 40, top + 90, bw - 80, 200, C.cobalt50, 6 * u)
	;[[0, 0], [1, 0], [0.5, -0.86]].forEach(([c, r]) => hex(w, rx + bw / 2 - 30 + c * 60, top + 210 + r * 52, 28, C.cobalt, 3))
	hex(w, rx + bw / 2 + 60, top + 150, 18, C.orange, 2)
	// The trail: rows chained by a line through small hexes, nothing to rewrite.
	const ty = top + 360
	panel(w, x, ty, width, 260, u)
	rect(w, x + 50 - 1.5 * u, ty + 40, 3 * u, 180, C.cobalt200)
	for (let i = 0; i < 4; i++) {
		const cy = ty + 44 + i * 58
		hex(w, x + 50, cy, 13, C.cobalt400, 2)
		bar(w, x + 84, cy - 6, [260, 220, 300, 240][i], 11, C.cobalt900)
		bar(w, x + width - 230, cy - 5, 190, 9, C.cobalt200)
	}
}

/** Proof 4: one case, wires to the case systems; the standard names swap on the held wires (#9). */
function standardsUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.top, width = geom.r - geom.x
	panel(w, x, top, width, 130, u)
	hex(w, x + 64, top + 65, 28, C.lavender, 4)
	bar(w, x + 120, top + 44, 260, 16, C.cobalt900)
	bar(w, x + 120, top + 76, 170, 9, C.cobalt300)
	statusPill(w, x + width - 160, top + 65, u)
	const bw = (width - 30) / 2, by = top + 220
	rect(w, x + 64 - 1.5 * u, top + 130, 3 * u, 50, C.cobalt300)
	rect(w, x + 64, top + 178, bw + 30 + bw / 2 - 64, 3 * u, C.cobalt300)
	rect(w, x + bw / 2 - 1.5 * u, top + 178, 3 * u, by - top - 178, C.cobalt300)
	rect(w, x + bw + 30 + bw / 2 - 1.5 * u, top + 178, 3 * u, by - top - 178, C.cobalt300)
	hex(w, x + bw + 15, top + 178 + 1.5 * u, 16, C.orange, 2)
	const box = (bx, label) => {
		panel(w, bx, by, bw, 360, u)
		rect(w, bx, by, bw, 64, C.cobalt50, 0)
		textBlock(w, label, { x: bx + 28, y: by + 44, size: 36, weight: 600, fill: C.cobalt, clip: false })
		for (let i = 0; i < 4; i++) {
			const fy = by + 110 + i * 60
			bar(w, bx + 30, fy, 90, 8, C.cobalt400)
			bar(w, bx + 140, fy - 2, 150 - i * 16, 11, C.cobalt900)
		}
	}
	box(x, 'ZGW')
	box(x + bw + 30, 'StUF-ZDS')
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
		id: 'hook', from: 0, to: 7, mark: 'Archiefwet', caption: 'Is dit straks wel\narchiefwaardig?', tag: { nc: true }, ui: hookUI,
		title: 'The worry: will this hold up as a record?',
		gloss: 'Will this be fit for the archive later?',
		apps: ['nextcloud'],
		motion: 'Frame 1 is the thumbnail: the question in the type column, a finished document in Nextcloud on the right, its archival fields empty (dashed slots) and the panel ringed in orange: the worry. Nextcloud\'s own hex sits on the loop anchor. Two beats still, then the camera pushes in on the empty panel (1.0 to 1.6, ease.brand). On beat 6 the first empty slot blinks once: the cue for proof 1.',
		sound: 'Gentle open, no stinger: pad and offbeat bass. A soft low tick as the orange ring draws.',
		source: 'The record manager\'s question (Ruben, Round 10 brief). Nextcloud as the workspace: bible truth 10.',
	},
	{
		id: 'mdto', from: 7, to: 15, mark: 'MDTO', caption: 'Beschreven\nterwijl je het maakt', tag: { app: 'filinq' }, ui: mdtoUI,
		title: 'The metadata is written as the document is made',
		gloss: 'Described while you make it',
		apps: ['filinq', 'openregister'],
		motion: 'Technique #4, typewriter. No cut: the push-in holds on the panel and the dashed slots fill top to bottom, one per beat, each value typing on at one greeked character pair per 0.1 s with a hard on and off, a cursor after it. The field names are MDTO\'s own (waardering, bewaartermijn, informatiecategorie, archiefvormer, dekkingInTijd) as small mono labels. The slot being typed takes the orange ring. The panel head carries one small label, NEN-ISO 16175 (Round 12): the records-management standard the metadata follows, a label only, never "certified" or "compliant". Filinq\'s hex on the anchor: the document is Filinq\'s.',
		sound: 'Soft key ticks under the typing, a pluck as each field completes, a brighter pluck on the last.',
		source: 'research.json c1: openregister retention-management spec:12 (MDTO-compliant archival metadata, defaults on creation), tmlo-auto-populate spec:12, edepot-transfer spec:14 and :250 (dekkingInTijd emitted); archival-conformance proposal:255 (MDTO-XML 1.0.1 XSD test). NEN-ISO 16175 label: openregister archivering-vernietiging spec:665 (NEN-ISO 16175-1:2020, the successor to NEN 2082).',
	},
	{
		id: 'selectielijst', from: 15, to: 23, mark: 'Selectielijst', caption: 'Het zaaktype kent\nzijn bewaartermijn', tag: { app: 'dossiq' }, ui: selectieUI,
		title: 'The retention period follows the case type',
		gloss: 'The case type knows its retention period',
		apps: ['dossiq', 'openregister'],
		motion: 'Hard cut on the downbeat. Then technique #3, grid-cell ripple: the case lands on top with its zaaktype, and a wave runs through the selectielijst below, cells stepping full, 40%, 20% in 0.3 s waves outward from the case type\'s row, which stays lit (cobalt-100). A square-cornered wire drops from the case type to that row, and its result hex lands in orange: keep or destroy, and when.',
		sound: 'A hard click on the cut, a rising run of ticks under the ripple, a pluck as the row locks.',
		source: 'research.json c2: procest archief-edepot-handover spec:14 (per-zaaktype retention: bewaartermijn, selectielijst categorie/versie, e-Depot bestemming, MDTO version); case-types spec:81 (archiefnominatie per result type); openregister retention-management spec:49 and :79; Filinq archiefwet-retention-engine proposal.',
	},
	{
		id: 'edepot', from: 23, to: 31, mark: 'e-Depot', caption: 'Op tijd vernietigd\nof overgebracht', tag: { app: 'openregister' }, ui: edepotUI,
		title: 'Destroyed or transferred on time, with proof',
		gloss: 'Destroyed or transferred, on time (the proof is the trail on screen)',
		apps: ['openregister'],
		motion: 'Technique #1, dot-grows-to-fill as an upright hex: the orange result hex from proof 2 grows past the frame (hexCut, ease.snap, one beat) and shrinks into this scene\'s landing point in the e-Depot. Left the record goes out with its verklaring van vernietiging (a page with a seal); right the package lands in the e-Depot as three stacked cells. Under both, the trail builds row by row, each row chained to the last through a small hex: every step recorded, nothing to rewrite.',
		sound: 'A whoosh through the hex, a low thud as the package lands, a tick per trail row.',
		source: 'research.json c3: openregister retention-management spec:108, :136 (approval), :174 (certificate), :189 (legal hold); edepot-transfer spec:36 (SIP), :162 (read-only), :180 (trail); edepot-proof-of-transfer spec:37; audit-hash-chain spec:34 (SHA-256 chain); positioning openregister usp-archive-destroy (verified).',
	},
	{
		id: 'standards', from: 31, to: 39, mark: 'ZGW en ZDS', caption: 'Elk zaaksysteem\nspreekt dezelfde taal', tag: { app: 'dossiq' }, ui: standardsUI,
		title: 'Every case system speaks the same language',
		gloss: 'Every case system speaks the same language',
		apps: ['dossiq', 'filinq'],
		motion: 'Technique #9, text-swap on a held diagram. Whip in (4 frames, ease.snap). The case sits on top; square-cornered wires split at the orange hex to two boxes whose fields fill one per beat. The diagram then holds while only the box heads swap: ZGW stays, the second head steps from StUF-ZKN to StUF-ZDS on the next beat. Stillness after the busy e-Depot beat.',
		sound: 'A whip whoosh, a line-draw hiss, a pluck per box, a dry click on the swap.',
		source: 'research.json c4: procest zgw-api-mapping, zgw-brc, zgw-autorisaties-api, stuf-integration, stuf-zkn-outbound; docudesk generate-store-in-case-system (ZGW and StUF-ZDS sources). ZDS is named only in Filinq\'s change.',
	},
]

const PROMISE = { from: 39, to: 48, mark: 'Nextcloud', text: 'Archiefwaardig\nvanaf het begin' }

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

const pStart = OPEN + beatT(PROMISE.from)
const pShows = snap(pStart + RISE)
const pClears = snap(OPEN + BODY - CLEAR)

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
		id: 'promise', layer: 'brand', module: 'promise', title: 'The promise: fit for the archive from the start',
		start: pStart, end: OPEN + BODY, bars: `${barOf(pStart)}-${barOf(OPEN + BODY - 0.01)}`,
		words: PROMISE.text, mark: PROMISE.mark, gloss: 'Fit for the archive from the start',
		shows: pShows, clears: pClears, hold: +(pClears - pShows).toFixed(2),
		apps: ['openregister', 'dossiq', 'filinq', 'nextcloud'],
		motion: `The answer to the hook's question, in its own word. The three apps that do the archiving land round the Nextcloud workspace hex, OpenRegister in orange up-left on the loop anchor (the app icon exception on cobalt), Dossiq and Filinq in white; the Nextcloud hex lands at 1.4x and settles. "Nextcloud" as the chapter mark, the promise rises under it by ${s2(pShows)} and holds to ${s2(pClears)}. Out on the bar line: the cells step toward the Nextcloud hex, which Built on picks up, no cut.`,
		sound: 'A pluck as OpenRegister lands, a low thud under the Nextcloud hex, a soft pad swell under the promise. A crisp click on the bar line.',
		source: 'Ruben, Round 10: pick Nextcloud as the workspace and archiving becomes the default. The three apps: research.json appsDoingArchivingWork.',
		draw: (ctx) => promiseFrame(ctx, PROMISE),
	},
	{
		id: 'builtOn', layer: 'brand', module: 'builtOn', title: 'Built on Nextcloud (shared closing piece, Dutch words)',
		start: OPEN + BODY, end: OPEN + BODY + BUILT, bars: `${barOf(OPEN + BODY)}-${barOf(OPEN + BODY + BUILT - 0.01)}`,
		words: 'Gebouwd op\nNextcloud', gloss: 'Built on Nextcloud', apps: ['nextcloud', 'openregister', 'dossiq', 'filinq'],
		motion: 'The shared piece (closing.js builtOnScene) with Dutch live words in place of the wordmark: Nextcloud lands low right, the data layer drops onto it, "Gebouwd op" rises with "Nextcloud" a sixteenth behind, the Nextcloud apps pop in round it, and on the second bar Dossiq and Filinq land on the top row in white. The other lane is reworking this piece to "Built on Nextcloud"; this board only passes the Dutch words.',
		sound: 'Thuds as Nextcloud and the data layer land, a run of ticks as the apps pop in, a pluck on the top row.',
		source: 'Shared module; Round 10 (Built on Nextcloud).',
		draw: (ctx) => { builtOnFrame(ctx, { apps: ['dossiq', 'filinq'], ...BUILT_ON }) },
	},
	{
		id: 'install', layer: 'brand', module: 'install', title: 'Install board (shared, Dutch slogans)',
		start: OPEN + BODY + BUILT, end: TOTAL, bars: `${barOf(OPEN + BODY + BUILT)}-${barOf(TOTAL - 0.01)}`,
		words: [...INSTALL_NL.slogans, INSTALL_NL.line].join('\n'), gloss: 'Install the app / Use the app / Your data stays yours / Always 100% open source and free',
		apps: ['conduction'],
		motion: 'The shared install board as it is, with its slogans in Dutch: the Nextcloud cell travels to the corner and turns over into the Conduction avatar, the wordmark header, the three slogans ("Installeer de app" in orange), then the open-source line. Holds to the end, no fade.',
		sound: 'A dry click as the cell turns, a click and a low impact on the call, ticks on the next two, the pad resolves.',
		source: 'Shared module: INSTALL.sources in closing.js; Dutch wording by this lane.',
		draw: (ctx) => { installFrame(ctx, INSTALL_NL) },
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
	const filmIssues = total < 25 || total > 30 ? [`${total} words in the body (brief: 25 to 30)`] : []
	return { total, ok: !filmIssues.length && rows.every((r) => !r.issues.length), filmIssues, rows }
}

export const meta = {
	id: 'archiving-nl',
	title: 'Archiveren als standaard (nl)',
	language: 'nl',
	logline: 'A Dutch release film answering a government question: with Nextcloud as the workspace and OpenRegister, Dossiq and Filinq on it, a record is described in MDTO terms as it is made, keeps the retention period of its case type, is destroyed or transferred to the e-Depot on time with proof, and every case system reads it over ZGW or StUF-ZDS. Archiving stops being a task and becomes the default.',
	references: REFS,
	techniques: ['#4 typewriter (the metadata types itself)', '#3 grid-cell ripple (the selectielijst)', '#1 dot-grows-to-fill as an upright hex (into the e-Depot)', '#9 text-swap on a held diagram (the standards)'],
	template: 'archiving (archFrame on the app-film grid)',
	format: '16x9',
	background: C.cobalt,
	safe: { ...SAFE },
	duration: TOTAL,
	budget: budget(),
}
