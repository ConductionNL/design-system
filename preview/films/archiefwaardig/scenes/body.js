/**
 * Archiefwaardig (nl), the body: eleven handelingscasussen, each a pure function of its local time, each
 * move started by the word that says it (the onsets come from ./plan.js, which reads the voice takes).
 *
 *   netwerkschijf  a network drive fills with "definitief_v3_echt" files; every row gets a question mark
 *   vraag          held window, text-swap (#9): the rows step off, one file stays (the device)
 *   opslaan        card flip into Word: Sanne writes, saves, answers one question, the fields fill in
 *   weigeren       card flip back to the explorer: delete; the refusal runs down the chain and stops at storage
 *   blokkade       scroll-whip: the dossier gets a legal hold and every file in it freezes
 *   terugdraaien   scroll-whip: a day to take it back, then the key is gone and the content scrambles
 *   verplaatsen    scroll-whip: the file moves P: to I:, the shared link resolves to the new place
 *   versleuteld    whip-pan: two viewers, one dossier; the colleague sees only that it exists
 *   overal         the same file in four plain windows, each landing on its spoken name
 *   architectuur   held windows, camera dive: Nextcloud, the register and object storage under them
 *   claim          the stack holds, the camera comes back up to the windows, they turn over and out
 *
 * The device: the one file ("Besluit subsidie.docx") that stays in the question, is written in Word,
 * refused, moved, and shown in every window. Brand: solid fills, one orange per scene as a ring, a hex or
 * the caption's hero word (never a box behind text), hexes flip in, lines draw on, nothing pops.
 * Systems are boxes, apps are hexes. The UI is generic window chrome in the brand's own tokens: no
 * third-party logos, no colours from the source demo.
 */
import { el, textBlock } from '../../_lib/stage.js'
import { inv } from '../../_lib/core.js'
import { C } from '../../_lib/brand.js'
import { curve, F, durationFor, minDurationFor } from '../../_lib/motion.js'
import { handoverGround } from '../../_lib/scenes/opening.js'
import { kineticText } from '../../_lib/scenes/kinetic.js'
import { clipped, fitCaptionSize, hex, use, TYPE } from '../../_lib/ui.js'
import {
	windowFrame, fileRow, statusPill, lockMark, holdMark, cryptBadge, refusalChain, versionStack,
	propertiesPane, revocationClock, shredLines, progress, turnScale, turned, risen,
} from '../../_lib/atoms/records.js'
import { BEAT } from './plan.js'

const arrive = curve('arrive'), leave = curve('leave'), rest = curve('rest'), drift = curve('drift'), camera = curve('camera')

/** The picture's home: right of the type column (bible: type x 120 to 840, picture x 900 to 1800). */
export const WIN = { x: 960, y: 170, w: 840, h: 690 }
const DOC = 'Besluit subsidie.docx'
const DRIVES = ['P: Projecten', 'I: Afdeling', 'W: Archief', 'Z: Persoonlijk']
const TURN = F(4)
const WHIP = F(6)

/** Duration of a move of px: from distance, and never over the speed ceiling. */
const moveDur = (px, fn = arrive, kind = 'element') => Math.max(durationFor(px, kind), minDurationFor(fn, px))

/* ------------------------------------------------------------------ type */

/** The section title: rises in on the scene's second frame, leaves with the caption. */
function markUpdate(g, S) {
	const h = TYPE.markH
	const size = Math.round(h * 0.8)
	const blk = textBlock(g, S.mark, { x: TYPE.x, y: TYPE.markY + h * 0.75, size, weight: 700, fill: C.cobalt200, tracking: -0.02, clip: true })
	const d = size * 1.35
	return (t) => {
		const p = progress(t, F(2), 6)
		const q = inv(S.out - F(4), S.out, t)
		const dy = q > 0 ? -d * leave(q) : d * (1 - p)
		g.setAttribute('display', t >= S.out ? 'none' : 'inline')
		for (const it of blk.items) it.node.setAttribute('transform', Math.abs(dy) > 1e-3 ? `translate(0 ${dy.toFixed(2)})` : '')
	}
}

/** The caption spec for a scene (scene-local times), shared with the film's timeline. */
export function captionSpec(S) {
	const text = S.lines.map((l) => l.map((i) => S.capWords[i].word.replace(/[.,;:]+$/u, '')).join(' ')).join('\n')
	const size = Math.min(TYPE.size, fitCaptionSize(text))
	return { recipe: S.hero != null ? 'hero' : 'lock', hero: S.hero, words: S.capWords, lines: S.lines, out: S.out, x: TYPE.x, y: TYPE.y1, size, lineHeight: 1.07 }
}

/** Wraps a picture function into a scene builder with its section title and kinetic caption. */
function scene(S, picture) {
	return (ctx) => {
		const pic = el('g', { 'data-layer': `${S.id}-picture` }, ctx.g)
		const markG = el('g', { 'data-role': 'mark' }, ctx.g)
		const capG = el('g', { 'data-role': 'caption' }, ctx.g)
		const mark = markUpdate(markG, S)
		const cap = kineticText(capG, captionSpec(S))
		return (T) => {
			const t = Math.max(0, Math.min(S.dur, T - ctx.start))
			pic.replaceChildren()
			picture(pic, t, S)
			mark(t)
			cap.update(t)
		}
	}
}

/* ------------------------------------------------------------------ window moves */

/** A group for the window: turned (card flip) and shifted (whip). */
function moving(g, { sx = 1, dx = 0, dy = 0 } = {}) {
	const tg = turned(g, WIN.x + WIN.w / 2, sx)
	if (!tg) return null
	return dx || dy ? el('g', { transform: `translate(${dx.toFixed(2)} ${dy.toFixed(2)})` }, tg) : tg
}
const turnIn = (t) => arrive(inv(0, TURN, t))
const turnOut = (t, dur) => 1 - leave(inv(dur - TURN, dur, t))
const whipIn = (t) => 1300 * (1 - arrive(inv(0, WHIP, t)))
const whipOut = (t, dur) => -1300 * leave(inv(dur - WHIP, dur, t))
/** Scroll-whip of a window's content: in from below at the start, out the top at the end. */
const scrollIn = (t) => 640 * (1 - arrive(inv(0, F(5), t)))
const scrollOut = (t, dur) => -640 * leave(inv(dur - F(5), dur, t))

/** The explorer window with a clipped content area; returns { box, body } (body is the clipped group). */
function explorer(g, { title = 'Verkenner', active = 0, path, h = WIN.h, y = WIN.y, x = WIN.x, w = WIN.w, kind = 'explorer', nav = DRIVES, scroll = 0 } = {}) {
	const box = windowFrame(g, { x, y, w, h, title, kind, nav, active })
	const body = clipped(g, box.x, box.y, box.w, box.h - 14, 0)
	const inner = scroll ? el('g', { transform: `translate(0 ${scroll.toFixed(2)})` }, body) : body
	if (path) textBlock(inner, path, { x: box.x + 24, y: box.y + 40, size: 20, weight: 500, family: 'IBM Plex Mono', fill: C.cobalt400, clip: false })
	return { box, body: inner }
}

/* ------------------------------------------------------------------ 1 netwerkschijf */

const MESS = [
	['Nieuwe map (4)', 'folder'], ['oud', 'folder'], ['definitief_v3_echt.docx', 'doc'], ['besluit_DEF_nieuw.docx', 'doc'],
	['kopie van kopie (2).xlsx', 'sheet'], ['notulen_final_final.docx', 'doc'], ['Scan0034.pdf', 'pdf'], ['NIET WEGGOOIEN', 'folder'],
	['besluit_v2_oud.docx', 'doc'], ['temp', 'folder'], [DOC, 'doc'], ['lijst (oud).xlsx', 'sheet'],
]
const KEEP = 10 // the device: the row that stays in the question

function netwerkschijf(g, t, S) {
	const fa = 1 - drift(inv(0, 0.5, t))
	if (fa > 0.001) handoverGround(el('g', { opacity: fa.toFixed(3) }, g))
	const slide = moveDur(900)
	const dx = 900 * (1 - arrive(inv(F(2), F(2) + slide, t)))
	const wg = moving(g, { dx })
	const rowsAt = S.onset(5) // "vol mappen": the rows flood in, one an 8th
	const scroll = -300 * drift(inv(S.onset(7), S.dur, t)) // the list keeps going past the window, to the cut
	const { box, body } = explorer(wg, { path: t >= S.onset(4) - F(2) ? 'P: Projecten  ›  Algemeen  ›  oud  ›  oud (2)' : '', scroll })
	MESS.forEach(([name, kind], i) => {
		const at = rowsAt + i * (BEAT / 2) * 0.5
		const ask = S.onset(8) + i * F(2) // "niemand weet": every row gets its question mark
		fileRow(body, { x: box.x + 8, y: box.y + 64 + i * 64, w: box.w - 16, name, kind, t, at, marks: [{ type: 'pill', label: '?', tone: 'unknown', at: ask }] })
	})
}
const netwerkschijfCues = (S) => [
	{ t: F(2), kind: 'whoosh', dur: 0.5, from: 500, to: 2200, panFrom: 0.6, panTo: 0.2, gain: 0.08 },
	...MESS.map((_, i) => ({ t: S.onset(5) + i * (BEAT / 4), kind: 'tick', freq: 1200 + (i % 4) * 120, gain: 0.04, pan: 0.35 })),
]

/* ------------------------------------------------------------------ 2 vraag */

/** The rows step off one an eighth from beat 2; the device comes to rest after the last. */
const STEP_OFF = BEAT / 2
const REST_AT = BEAT + (MESS.length - 1) * STEP_OFF + F(4)

function vraag(g, t, S) {
	const sx = turnOut(t, S.dur)
	const wg = moving(g, { sx })
	if (!wg) return
	const { box, body } = explorer(wg, { path: 'P: Projecten  ›  Algemeen  ›  oud  ›  oud (2)', scroll: -300 })
	const keepY0 = box.y + 64 + KEEP * 64 - 300, keepY1 = box.y + 64 + 300
	MESS.forEach(([name, kind], i) => {
		if (i === KEEP) return
		// The rows step off, one an eighth, from the second beat; each drops a little and clears.
		const off = BEAT + (i < KEEP ? i : i - 1) * STEP_OFF
		const q = leave(inv(off, off + F(5), t))
		if (q >= 1) return
		const rg = el('g', q > 0 ? { transform: `translate(0 ${(40 * q).toFixed(2)})`, opacity: (1 - q).toFixed(3) } : {}, body)
		fileRow(rg, { x: box.x + 8, y: box.y + 64 + i * 64 - 300, w: box.w - 16, name, kind, marks: [{ type: 'pill', label: '?', tone: 'unknown' }] })
	})
	// The device stays and comes to rest at the top of the cleared window.
	const k = rest(inv(REST_AT, REST_AT + moveDur(keepY0 - keepY1, rest), t))
	fileRow(body, { x: box.x + 8, y: keepY0 + (keepY1 - keepY0) * k + 300, w: box.w - 16, name: DOC, kind: 'doc', selected: k > 0.5, marks: [{ type: 'pill', label: '?', tone: 'unknown', off: REST_AT }] })
}
const vraagCues = (S) => [
	...MESS.filter((_, i) => i !== KEEP).map((_, k) => ({ t: BEAT + k * STEP_OFF, kind: 'tick', freq: 1568 - (k % 4) * 110, gain: 0.03, pan: 0.35 })),
	{ t: REST_AT, kind: 'whoosh', dur: 0.4, from: 1200, to: 600, panFrom: 0.3, panTo: 0.3, gain: 0.05 },
	{ t: S.dur - TURN, kind: 'click', gain: 0.16, freq: 2800, seed: 31, dry: true, pan: 0.4 },
]

/* ------------------------------------------------------------------ 3 opslaan */

const FIELDS = [
	{ label: 'Dossier', value: 'Subsidies 2026' },
	{ label: 'Informatiecategorie', value: 'Besluit' },
	{ label: 'Bewaartermijn', value: '10 jaar' },
	{ label: 'Vertrouwelijkheid', value: 'Intern' },
]

function opslaan(g, t, S) {
	const sx = Math.min(turnIn(t), turnOut(t, S.dur))
	const wg = moving(g, { sx })
	if (!wg) return
	const box = windowFrame(wg, { ...WIN, title: `Word  ·  ${DOC}`, kind: 'word' })
	// The page: lines type on while Sanne writes (a bar grows in steps of a tenth of a second).
	const px = box.x + 30, py = box.y + 26, pw = 400, ph = box.h - 52
	el('rect', { x: px, y: py, width: pw, height: ph, rx: 6, fill: C.white, stroke: C.cobalt100, 'stroke-width': 2 }, wg)
	el('rect', { x: px + 34, y: py + 40, width: 220, height: 16, rx: 5, fill: C.cobalt700 }, wg)
	const w0 = S.onset(1), w1 = S.onset(5)
	for (let i = 0; i < 9; i++) {
		const lw = [300, 320, 280, 330, 210, 310, 290, 320, 180][i]
		const t0 = w0 + (i * (w1 - w0)) / 9
		const typed = t < t0 ? 0 : Math.min(lw, Math.floor((t - t0) / 0.1 + 1) * 70)
		if (typed > 0) el('rect', { x: px + 34, y: py + 90 + i * 34, width: typed, height: 10, rx: 5, fill: C.cobalt300 }, wg)
	}
	// The assistant pane slides in on "opslaan".
	const ax = box.x + 450, aw = box.w - 474
	const k = rest(inv(S.onset(7), S.onset(7) + moveDur(aw + 40, rest), t))
	if (k <= 0) return
	const pane = el('g', { transform: `translate(${((1 - k) * (aw + 60)).toFixed(2)} 0)` }, clipped(wg, ax - 10, box.y, aw + 34, box.h - 14, 0))
	el('rect', { x: ax, y: box.y + 16, width: aw, height: box.h - 46, rx: 10, fill: C.cobalt50 }, pane)
	textBlock(pane, 'Assistent', { x: ax + 22, y: box.y + 58, size: 24, weight: 700, fill: C.cobalt900, clip: false })
	const swap = S.onset(16) - F(3) // "metagegevens": the question gives way to the fields (text-swap in the pane)
	if (t < swap) {
		const qg = risen(pane, t, S.onset(10) - F(2))
		if (qg) {
			textBlock(qg, 'Zakelijk of', { x: ax + 22, y: box.y + 130, size: 30, weight: 700, fill: C.cobalt900, clip: false })
			textBlock(qg, 'persoonlijk?', { x: ax + 22, y: box.y + 168, size: 30, weight: 700, fill: C.cobalt900, clip: false })
		}
		const chosen = S.onset(12) // "zakelijk"
		statusPill(pane, { x: ax + 22, cy: box.y + 240, label: 'Zakelijk', tone: t >= chosen ? 'answer' : 'neutral', t, at: S.onset(11), size: 24 })
		statusPill(pane, { x: ax + 168, cy: box.y + 240, label: 'Persoonlijk', tone: 'neutral', t, at: S.onset(11) + F(2), size: 24 })
		return
	}
	propertiesPane(pane, { x: ax + 10, y: box.y + 84, w: aw - 20, title: 'Metagegevens', fields: FIELDS, at: FIELDS.map((_, i) => S.onset(16) + i * (BEAT / 2)), t, rowH: 92 })
}
const opslaanCues = (S) => [
	{ t: 0, kind: 'click', gain: 0.14, freq: 2600, seed: 32, dry: true, pan: 0.4 },
	{ t: S.onset(7), kind: 'whoosh', dur: 0.35, from: 900, to: 2400, panFrom: 0.6, panTo: 0.3, gain: 0.06 },
	{ t: S.onset(12), kind: 'click', gain: 0.18, freq: 2900, seed: 33, dry: true, pan: 0.4 },
	...FIELDS.map((_, i) => ({ t: S.onset(16) + i * (BEAT / 2), kind: 'pluck', freq: [987.77, 1108.73, 1174.66, 1318.51][i], gain: 0.08, pan: 0.4 })),
	{ t: S.dur - TURN, kind: 'click', gain: 0.14, freq: 2800, seed: 34, dry: true, pan: 0.4 },
]

/* ------------------------------------------------------------------ 4 weigeren */

const CHAIN = ['Verkenner', 'Nextcloud', 'Register', 'Opslag']

function weigeren(g, t, S) {
	const sx = turnIn(t)
	const dy = scrollOut(t, S.dur)
	const wg = moving(g, { sx })
	if (!wg) return
	const H = 400
	const { box, body } = explorer(wg, { path: 'P: Projecten  ›  Subsidies 2026', h: H, scroll: dy })
	const rows = [[DOC, 'doc'], ['Aanvraag.pdf', 'pdf'], ['Notulen overleg.docx', 'doc']]
	const sel = S.onset(3) // "besluit"
	rows.forEach(([name, kind], i) => fileRow(body, { x: box.x + 8, y: box.y + 60 + i * 64, w: box.w - 16, name, kind, selected: i === 0 && t >= sel, marks: [{ type: 'pill', label: 'zakelijk', tone: 'neutral' }] }))
	// The context menu: "Verwijderen", on the word.
	const mg = risen(body, t, S.onset(5) - F(3), { dy: 16 })
	if (mg) {
		const mx = box.x + 330, my = box.y + 104
		el('rect', { x: mx, y: my, width: 250, height: 112, rx: 10, fill: C.white, stroke: C.cobalt200, 'stroke-width': 2 }, mg)
		textBlock(mg, 'Openen', { x: mx + 22, y: my + 40, size: 22, weight: 500, fill: C.cobalt700, clip: false })
		el('rect', { x: mx + 8, y: my + 58, width: 234, height: 44, rx: 6, fill: C.cobalt100 }, mg)
		textBlock(mg, 'Verwijderen', { x: mx + 22, y: my + 88, size: 22, weight: 700, fill: C.cobalt900, clip: false })
	}
	statusPill(body, { x: box.x + box.w - 24, cy: box.y + 30, label: 'Verwijderen lukt niet', tone: 'frozen', t, at: S.onset(7), anchor: 'end', size: 19 })
	// The refusal runs down the chain on the words, and stops at the storage on "weigert".
	const cy = WIN.y + H + 60 + dy
	refusalChain(wg, { x: WIN.x, y: cy, w: WIN.w, h: 84, nodes: CHAIN, at: [S.onset(6), S.onset(8), S.onset(9), S.onset(10)], refused: S.onset(12) - F(2), t, gap: 30, size: 22 })
	statusPill(wg, { x: WIN.x + WIN.w, cy: cy + 150, label: 'bewaren tot 2036', tone: 'neutral', t, at: S.onset(15) - F(2), anchor: 'end', size: 22 })
}
const weigerenCues = (S) => [
	{ t: 0, kind: 'click', gain: 0.14, freq: 2600, seed: 35, dry: true, pan: 0.4 },
	...[6, 8, 9, 10].map((i, k) => ({ t: S.onset(i), kind: 'tick', freq: [1174.66, 1318.51, 1479.98, 1567.98][k], gain: 0.07, pan: 0.2 + k * 0.1 })),
	{ t: S.onset(12) - F(2) + F(ATOM_DRAW), kind: 'click', gain: 0.24, freq: 2400, seed: 36, dry: true, pan: 0.5 },
	{ t: S.dur - F(5), kind: 'whoosh', dur: 0.35, from: 900, to: 3600, panFrom: 0.3, panTo: 0.3, gain: 0.08 },
]
const ATOM_DRAW = 8

/* ------------------------------------------------------------------ 5 blokkade */

const DOSSIER = [['Bezwaarschrift.pdf', 'pdf'], ['Besluit op bezwaar.docx', 'doc'], ['Hoorzitting verslag.docx', 'doc'], ['Correspondentie.pdf', 'pdf'], ['Bijlagen', 'folder']]

function blokkade(g, t, S) {
	const dy = scrollIn(t) + scrollOut(t, S.dur)
	const { box, body } = explorer(g, { path: 'P: Projecten  ›  Bezwaar 2026-031', scroll: dy })
	const holdAt = S.onset(3) // "rechtszaak"
	const freezeAt = S.onset(5) // "bevriest"
	fileRow(body, { x: box.x + 8, y: box.y + 60, w: box.w - 16, name: 'Bezwaar 2026-031', kind: 'folder', selected: true, marks: [{ type: 'hold', at: holdAt, ring: true }, { type: 'pill', label: 'juridische blokkade', tone: 'frozen', at: holdAt + F(3) }] })
	DOSSIER.forEach(([name, kind], i) => {
		const fz = freezeAt + i * F(2)
		fileRow(body, { x: box.x + 8, y: box.y + 140 + i * 64, w: box.w - 16, name, kind, frozen: t >= fz, marks: [{ type: 'hold', at: fz }] })
	})
	// "Ook een beheerder": the admin's change is refused too.
	const ag = risen(body, t, S.onset(11) - F(2))
	if (ag) {
		const ay = box.y + 140 + DOSSIER.length * 64 + 40
		el('rect', { x: box.x + 16, y: ay, width: box.w - 32, height: 76, rx: 10, fill: C.cobalt50 }, ag)
		statusPill(ag, { x: box.x + 36, cy: ay + 38, label: 'Beheerder', tone: 'locked', size: 20 })
		textBlock(ag, 'wijzigen, verwijderen', { x: box.x + 200, y: ay + 46, size: 22, weight: 500, fill: C.cobalt700, clip: false })
		lockMark(ag, { cx: box.x + box.w - 60, cy: ay + 38, r: 22, t, at: S.onset(14) })
	}
}
const blokkadeCues = (S) => [
	{ t: S.onset(3), kind: 'click', gain: 0.22, freq: 2500, seed: 37, dry: true, pan: 0.4 },
	...DOSSIER.map((_, i) => ({ t: S.onset(5) + i * F(2), kind: 'tick', freq: 1760 - i * 110, gain: 0.05, pan: 0.35 })),
	{ t: S.onset(14), kind: 'click', gain: 0.16, freq: 2800, seed: 38, dry: true, pan: 0.5 },
	{ t: S.dur - F(5), kind: 'whoosh', dur: 0.35, from: 900, to: 3600, panFrom: 0.3, panTo: 0.3, gain: 0.08 },
]

/* ------------------------------------------------------------------ 6 terugdraaien */

function terugdraaien(g, t, S) {
	const dy = scrollIn(t) + scrollOut(t, S.dur)
	const { box, body } = explorer(g, { path: 'P: Projecten  ›  Subsidies 2026', scroll: dy })
	const back = S.onset(11) // "terug"
	fileRow(body, { x: box.x + 8, y: box.y + 60, w: box.w - 16, name: 'Boodschappen.docx', kind: 'doc', marks: [{ type: 'pill', label: t >= back ? 'persoonlijk' : 'zakelijk', tone: t >= back ? 'ok' : 'neutral', at: t >= back ? back : -1 }] })
	// The second file was not taken back: after the window its key is destroyed and its content scrambles.
	const keyGone = S.onset(14) // "informatiebeheer"
	const shred = S.onset(16) // "inhoud"
	fileRow(body, { x: box.x + 8, y: box.y + 124, w: box.w - 16, name: 'Foto rijbewijs.docx', kind: 'doc', shredAt: shred, marks: [{ type: 'crypt', off: keyGone }, { type: 'pill', label: 'zakelijk', tone: 'neutral' }] })
	// The revocation window: a day, running down from "Binnen een dag" to "Daarna".
	const cx = box.x + 170, cy = box.y + 360
	const cg = risen(body, t, S.onset(4) - F(2))
	if (cg) revocationClock(cg, { cx, cy, r: 92, t, from: S.onset(6), to: S.onset(12), label: t < S.onset(12) ? '24 uur' : '0 uur', sub: 'herroepen', ink: C.cobalt900, track: C.cobalt100 })
	statusPill(body, { x: cx - 92, cy: cy + 150, label: 'Terugdraaien', tone: t >= back ? 'locked' : 'neutral', t, at: S.onset(7) - F(2), size: 22 })
	// The preview: the content, then unreadable.
	const pg = risen(body, t, S.onset(12) - F(4))
	if (pg) {
		const qx = box.x + 360, qy = box.y + 230, qw = box.w - 390
		el('rect', { x: qx, y: qy, width: qw, height: 300, rx: 10, fill: C.white, stroke: C.cobalt100, 'stroke-width': 2 }, pg)
		textBlock(pg, 'Foto rijbewijs.docx', { x: qx + 24, y: qy + 44, size: 22, weight: 700, fill: C.cobalt900, clip: false })
		shredLines(pg, { x: qx + 24, y: qy + 84, w: qw - 48, lines: 6, lineH: 34, t, at: shred, seed: 11 })
		statusPill(pg, { x: qx + qw - 20, cy: qy + 272, label: 'onleesbaar', tone: 'frozen', t, at: S.onset(17), anchor: 'end', size: 18 })
	}
}
const terugdraaienCues = (S) => [
	{ t: S.onset(11), kind: 'click', gain: 0.18, freq: 2800, seed: 39, dry: true, pan: 0.4 },
	{ t: S.onset(14), kind: 'impact', gain: 0.12, from: 140, to: 60, decay: 0.3 },
	{ t: S.onset(16), kind: 'whoosh', dur: 0.25, from: 5000, to: 2500, panFrom: 0.4, panTo: 0.4, gain: 0.05 },
	{ t: S.dur - F(5), kind: 'whoosh', dur: 0.35, from: 900, to: 3600, panFrom: 0.3, panTo: 0.3, gain: 0.08 },
]

/* ------------------------------------------------------------------ 7 verplaatsen */

function verplaatsen(g, t, S) {
	const dy = scrollIn(t)
	const dx = whipOut(t, S.dur)
	const wg = moving(g, { dx })
	const H = 470
	const moveAt = S.onset(6) // "andere schijf"
	const moveDurS = moveDur(520, rest)
	const landed = t >= moveAt + moveDurS
	const { box, body } = explorer(wg, { path: landed ? 'I: Afdeling  ›  Subsidies' : 'P: Projecten  ›  Subsidies 2026', h: H, active: landed ? 1 : 0, scroll: dy })
	const other = landed ? [['Werkplan 2027.docx', 'doc'], ['Overzicht.xlsx', 'sheet']] : [['Aanvraag.pdf', 'pdf'], ['Notulen overleg.docx', 'doc']]
	other.forEach(([name, kind], i) => fileRow(body, { x: box.x + 8, y: box.y + 124 + i * 64, w: box.w - 16, name, kind }))
	// The device: selected on "bestand", dragged to the I: drive, landing in its list.
	const k = rest(inv(moveAt, moveAt + moveDurS, t))
	const nav = box.navRows[1]
	const fromX = box.x + 8, fromY = box.y + 60, toX = nav.x, toY = nav.y - 9
	const rx = landed ? fromX : fromX + (toX - fromX) * k, ry = landed ? fromY : fromY + (toY - fromY) * k
	const rw = landed ? box.w - 16 : (box.w - 16) * (1 - 0.45 * k)
	fileRow(landed ? body : wg, { x: rx, y: ry, w: rw, name: DOC, kind: 'doc', selected: t >= S.onset(3) - F(2), marks: k > 0.2 && !landed ? [] : [{ type: 'lock' }] })
	// The shared link resolves through the resolver to wherever the file is now.
	const ly = WIN.y + H + 90 + dy
	const lg = risen(wg, t, S.onset(9) - F(4))
	if (!lg) return
	const link = statusPill(lg, { x: WIN.x, cy: ly, label: 'gedeelde link  ·  /id/4f7a', tone: 'answer', size: 22 })
	const resX = link.x + link.w + 40
	el('rect', { x: link.x + link.w, y: ly - 2, width: 40, height: 4, fill: C.cobalt300 }, lg)
	el('rect', { x: resX, y: ly - 36, width: 170, height: 72, rx: 10, fill: C.cobalt700, stroke: C.cobalt400, 'stroke-width': 2 }, lg)
	textBlock(lg, 'Resolver', { x: resX + 85, y: ly + 8, size: 22, weight: 600, fill: C.white, anchor: 'middle', clip: false })
	const reroute = moveAt + moveDurS
	const dk = t < reroute ? 1 : progress(t, reroute, 8)
	el('rect', { x: resX + 170, y: ly - 2, width: 40 * dk, height: 4, fill: C.cobalt300 }, lg)
	const target = t < reroute ? 'P: Projecten' : 'I: Afdeling'
	statusPill(lg, { x: resX + 210, cy: ly, label: target, tone: 'neutral', t, at: t < reroute ? -1 : reroute, size: 22 })
	statusPill(lg, { x: WIN.x + WIN.w, cy: ly + 74, label: 'link werkt', tone: 'ok', t, at: S.onset(13) - F(2), anchor: 'end', size: 22 })
}
const verplaatsenCues = (S) => [
	{ t: S.onset(6), kind: 'whoosh', dur: 0.45, from: 700, to: 1800, panFrom: 0.5, panTo: -0.1, gain: 0.06 },
	{ t: S.onset(6) + moveDur(520, rest), kind: 'tick', freq: 1318.51, gain: 0.08, pan: 0 },
	{ t: S.onset(13) - F(2), kind: 'pluck', freq: 1174.66, gain: 0.1, pan: 0.4 },
	{ t: S.dur - WHIP, kind: 'whoosh', dur: 0.35, from: 3200, to: 600, panFrom: 0.7, panTo: -0.6, gain: 0.12 },
]

/* ------------------------------------------------------------------ 8 versleuteld */

const CONF = [['Melding.pdf', 'pdf'], ['Verslag gesprek.docx', 'doc'], ['Advies.docx', 'doc']]

function versleuteld(g, t, S) {
	const dx = whipIn(t)
	const sx = turnOut(t, S.dur)
	const wg = moving(g, { dx, sx })
	if (!wg) return
	const w2 = (WIN.w - 30) / 2
	const keyAt = S.onset(5) // "sleutel"
	const left = explorer(wg, { title: 'Sanne', kind: 'plain', w: w2, h: 520, nav: [] })
	fileRow(left.body, { x: left.box.x + 6, y: left.box.y + 20, w: left.box.w - 12, name: 'Integriteit 0412', kind: 'folder', size: 21, marks: [{ type: 'crypt', at: keyAt }] })
	CONF.forEach(([name, kind], i) => fileRow(left.body, { x: left.box.x + 6, y: left.box.y + 84 + i * 64, w: left.box.w - 12, name, kind, size: 21, marks: [{ type: 'crypt', at: keyAt + (i + 1) * F(2) }] }))
	// A ring round the dossier's key: the scene's one orange.
	if (t >= keyAt + F(4)) {
		const r = progress(t, keyAt + F(4), 8)
		el('rect', { x: left.box.x + 4, y: left.box.y + 22, width: left.box.w - 8, height: 60, rx: 10, fill: 'none', stroke: C.orange, 'stroke-width': 4, pathLength: 1, 'stroke-dasharray': `${r.toFixed(4)} 1` }, left.body)
	}
	// The colleague's window lands on "toegang" (round 30: mid-bar, so bar 32 is not still).
	const rg = risen(wg, t, S.onset(8) - F(2), { dy: 40 })
	if (!rg) return
	const right = explorer(rg, { title: 'Collega', kind: 'plain', x: WIN.x + w2 + 30, w: w2, h: 520, nav: [] })
	fileRow(right.body, { x: right.box.x + 6, y: right.box.y + 20, w: right.box.w - 12, name: 'Integriteit 0412', kind: 'folder', size: 21, marks: [{ type: 'crypt' }] })
	CONF.forEach(([name, kind], i) => fileRow(right.body, { x: right.box.x + 6, y: right.box.y + 84 + i * 64, w: right.box.w - 12, name, kind, hidden: true, marks: [{ type: 'lock', at: S.onset(9) + i * F(2) }] }))
	statusPill(right.body, { x: right.box.x + 16, cy: right.box.y + 330, label: 'je ziet dat het bestaat', tone: 'frozen', t, at: S.onset(10) - F(2), size: 19 })
}
const versleuteldCues = (S) => [
	{ t: 0, kind: 'whoosh', dur: 0.3, from: 2400, to: 700, panFrom: 0.8, panTo: 0.2, gain: 0.08 },
	{ t: S.onset(5), kind: 'click', gain: 0.2, freq: 2700, seed: 40, dry: true, pan: 0.2 },
	{ t: S.onset(8) - F(2), kind: 'whoosh', dur: 0.3, from: 900, to: 2000, panFrom: 0.6, panTo: 0.5, gain: 0.05 },
	...[0, 1, 2].map((i) => ({ t: S.onset(9) + i * F(2), kind: 'tick', freq: 1479.98 - i * 120, gain: 0.05, pan: 0.6 })),
	{ t: S.dur - TURN, kind: 'click', gain: 0.14, freq: 2800, seed: 41, dry: true, pan: 0.4 },
]

/* ------------------------------------------------------------------ 9 overal */

/** The four windows, in a 2 x 2 grid, each with its kind and the word that names it. */
export const FOUR = [
	{ title: 'Verkenner', kind: 'explorer', word: 9 },
	{ title: 'SharePoint', kind: 'library', word: 11 },
	{ title: 'Teams', kind: 'channel', word: 13 },
	{ title: 'Word', kind: 'word', word: 16 },
]
const QW = (WIN.w - 24) / 2, QH = 318

function fourWindows(g, t, at, { leaveFrom = Infinity } = {}) {
	FOUR.forEach((f, i) => {
		const x = WIN.x + (i % 2) * (QW + 24), y = WIN.y + 10 + Math.floor(i / 2) * (QH + 24)
		const off = leaveFrom + i * F(1)
		const s = turnScale(t, at[i], off, 4)
		const wg = turned(g, x + QW / 2, s)
		if (!wg) return
		const box = windowFrame(wg, { x, y, w: QW, h: QH, title: f.title, kind: f.kind, nav: f.kind === 'explorer' ? ['P:', 'I:', 'W:'] : [], titleSize: 22 })
		const body = clipped(wg, box.x, box.y, box.w, box.h - 12, 0)
		fileRow(body, { x: box.x + 4, y: box.y + (f.kind === 'word' ? 20 : 34), w: box.w - 8, name: 'Besluit', kind: 'doc', size: 19, h: 58, marks: [{ type: 'lock' }, { type: 'pill', label: 'zakelijk', tone: 'neutral', size: 15 }] })
		el('rect', { x: box.x + 70, y: box.y + 130, width: box.w * 0.4, height: 9, rx: 4, fill: C.cobalt100 }, body)
		el('rect', { x: box.x + 70, y: box.y + 158, width: box.w * 0.3, height: 9, rx: 4, fill: C.cobalt100 }, body)
	})
}

function overal(g, t, S) {
	fourWindows(g, t, FOUR.map((f) => S.onset(f.word) - F(2)))
}
const overalCues = (S) => FOUR.map((f, i) => ({ t: S.onset(f.word) - F(2) + F(4), kind: 'click', gain: 0.12, freq: 2500 + i * 150, seed: 42 + i, dry: true, pan: 0.2 + 0.2 * (i % 2) }))

/* ------------------------------------------------------------------ 10 architectuur */

/** The layers under the windows, in world space (the camera moves the world up by DIVE). */
const DIVE = 560
const LAYERS = { nextcloud: 930, register: 1110, storage: 1290 }

function stack(g, t, { ncAt, regAt, stAt, lockAt, lockOrange, newVerAt }) {
	const x = WIN.x, w = WIN.w
	// Lines between the layers, drawn on as each lands.
	const link = (y0, y1, at) => {
		const k = progress(t, at - F(6), 6)
		if (k > 0) el('rect', { x: x + w / 2 - 2, y: y0, width: 4, height: (y1 - y0) * k, fill: C.cobalt300 }, g)
	}
	link(WIN.y + 2 * QH + 34, LAYERS.nextcloud - 60, ncAt)
	link(LAYERS.nextcloud + 60, LAYERS.register - 60, regAt)
	link(LAYERS.register + 60, LAYERS.storage - 70, stAt)
	const ng = risen(g, t, ncAt - F(2), { dy: 30 })
	if (ng) {
		el('rect', { x, y: LAYERS.nextcloud - 60, width: w, height: 120, rx: 12, fill: C.nextcloud }, ng)
		hex(ng, x + 70, LAYERS.nextcloud, 44, C.white, 5)
		use(ng, 'nextcloud-logo', x + 70 - 32, LAYERS.nextcloud - 15, 64, 30, C.nextcloud)
		textBlock(ng, 'Nextcloud', { x: x + 136, y: LAYERS.nextcloud + 12, size: 34, weight: 700, fill: C.white, clip: false })
	}
	const rg = risen(g, t, regAt - F(2), { dy: 30 })
	if (rg) {
		el('rect', { x, y: LAYERS.register - 60, width: w, height: 120, rx: 12, fill: C.white }, rg)
		textBlock(rg, 'Register', { x: x + 30, y: LAYERS.register + 12, size: 34, weight: 700, fill: C.cobalt900, clip: false })
		;['dossier', 'bewaartermijn', 'blokkade', 'sleutel'].forEach((p, i) => statusPill(rg, { x: x + 240 + [0, 120, 300, 440][i], cy: LAYERS.register, label: p, tone: 'neutral', t, at: regAt + F(3) + i * F(2), size: 19 }))
	}
	const sg = risen(g, t, stAt - F(2), { dy: 30 })
	if (sg) {
		el('rect', { x, y: LAYERS.storage - 70, width: w, height: 160, rx: 12, fill: C.cobalt700 }, sg)
		textBlock(sg, 'Objectopslag', { x: x + 30, y: LAYERS.storage - 10, size: 34, weight: 700, fill: C.white, clip: false })
		textBlock(sg, 'Object Lock', { x: x + 30, y: LAYERS.storage + 32, size: 22, weight: 500, family: 'IBM Plex Mono', fill: C.cobalt200, clip: false })
		// A fourth version (the claim) lands in front; the first three keep their places.
		const more = newVerAt != null ? [newVerAt] : []
		versionStack(sg, { x: x + 470 - 16 * more.length, y: LAYERS.storage - 30 + 16 * more.length, w: 200, h: 92, at: [stAt, stAt + F(3), stAt + F(6), ...more], t, step: 16 })
		lockMark(sg, { cx: x + w - 60, cy: LAYERS.storage + 10, r: 34, t, at: lockAt, ring: lockOrange })
	}
}

function architectuur(g, t, S) {
	const dive = moveDur(DIVE, camera, 'camera')
	const k = camera(inv(BEAT, BEAT + dive, t))
	const world = el('g', { transform: `translate(0 ${(-DIVE * k).toFixed(2)})` }, g)
	fourWindows(world, t, [-1, -1, -1, -1])
	stack(world, t, { ncAt: S.onset(2), regAt: S.onset(4), stAt: S.onset(11), lockAt: S.onset(12), lockOrange: true })
}
const architectuurCues = (S) => [
	{ t: BEAT, kind: 'whoosh', dur: 0.9, from: 1800, to: 500, panFrom: 0, panTo: 0, gain: 0.07 },
	{ t: S.onset(2), kind: 'pluck', freq: 987.77, gain: 0.09 },
	{ t: S.onset(4), kind: 'pluck', freq: 1174.66, gain: 0.09 },
	{ t: S.onset(11), kind: 'pluck', freq: 1318.51, gain: 0.09 },
	{ t: S.onset(12) + F(5), kind: 'click', gain: 0.22, freq: 2500, seed: 46, dry: true },
]

/* ------------------------------------------------------------------ 11 claim */

function claim(g, t, S) {
	// Held on the stack; on "vensters" the camera comes back up to the windows, which turn over and out.
	const up = S.onset(15) - F(4)
	const back = moveDur(DIVE, camera, 'camera')
	const k = 1 - camera(inv(up, up + back, t))
	const world = el('g', { transform: `translate(0 ${(-DIVE * k).toFixed(2)})` }, g)
	fourWindows(world, t, [-1, -1, -1, -1], { leaveFrom: S.dur - F(8) })
	// On "DMS" a new version lands in the storage and locks: the storage enforces it (round 30, no dead bar).
	if (k > 0.001) stack(world, t, { ncAt: -1, regAt: -1, stAt: -1, lockAt: -1, lockOrange: false, newVerAt: S.onset(5) - F(2) })
}
const claimCues = (S) => [
	{ t: S.onset(5) - F(2), kind: 'tick', freq: 1174.66, gain: 0.07 },
	{ t: S.onset(5) + F(1), kind: 'click', gain: 0.12, freq: 2800, seed: 212, dry: true },
	{ t: S.onset(15) - F(4), kind: 'whoosh', dur: 0.8, from: 500, to: 1800, panFrom: 0, panTo: 0, gain: 0.06 },
	{ t: S.dur - F(8), kind: 'whoosh', dur: 0.3, from: 2400, to: 900, panFrom: 0.4, panTo: 0.2, gain: 0.06 },
]

/* ------------------------------------------------------------------ exports */

const PICTURES = { netwerkschijf, vraag, opslaan, weigeren, blokkade, terugdraaien, verplaatsen, versleuteld, overal, architectuur, claim }
const CUES = { netwerkschijf: netwerkschijfCues, vraag: vraagCues, opslaan: opslaanCues, weigeren: weigerenCues, blokkade: blokkadeCues, terugdraaien: terugdraaienCues, verplaatsen: verplaatsenCues, versleuteld: versleuteldCues, overal: overalCues, architectuur: architectuurCues, claim: claimCues }

/** The scene builder for a plan scene: (ctx) => update(T), with T in film (or board) time and ctx.start the scene's start. */
export const builder = (S) => scene(S, PICTURES[S.id])
/** The scene's sound cues, scene-local seconds, each next to the move that causes it. */
export const cuesFor = (S) => CUES[S.id](S)
