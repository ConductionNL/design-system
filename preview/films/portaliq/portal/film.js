/**
 * The Portaliq film (Round 29 and 29b, Ruben, 2026-09-29): the citizen and customer portal films folded
 * into one, told to the functional admins of municipalities and housing corporations (storyboard
 * preview/films/portaliq/boards/portal). Built on the Dossiq casework film's template.
 *
 *   0 to 5.63 s       the shared Conduction opening (_lib/scenes/opening.js), 3 bars
 *   5.63 to 43.13 s   the body, 20 bars, promise first (the storyboard's times, board.js promiseFirst):
 *                     promise "What if clients (or citizens) did it themselves?", then
 *                     builder, in Nextcloud (in: #1 the orange Portaliq cell opens as a hex),
 *                     overview, the first client page (in: the canvas grows into the live page, #10 tiles merge),
 *                     status (in: #1 the tickets tile opens as a hex), actions (in: #9 bands on the held page),
 *                     inbox (in: #11 whip), profile (in: #5 stepped hexes), mobile (in: the page shrinks into
 *                     the phone), forms: the form on the portal page, Tables in Nextcloud (in: vertical whip)
 *   43.13 to 50.63 s  the shared closing piece, Built on Nextcloud (the C, the family ring, the re-zoom)
 *   50.63 to 56.25 s  the shared install board (no wire)
 *
 * Round 29b: only the builder and Tables are Nextcloud windows (ncWindow); the pages clients see are
 * standalone web pages (pageFrame), with no Nextcloud chrome and no Portaliq tag.
 * Rules (rounds 26 to 28l): each small mark is the scene's section title; every hex flips in, never
 * pops or scales in; no wire; a used screen is gone when its scene ends. 1920 x 1080, 24 fps, 30 bars
 * at 128 BPM (1350 frames). Every frame is a pure function of time.
 */
import { Film, loadFonts, el, textBlock } from '../../_lib/stage.js'
import { C, FONTS } from '../../_lib/brand.js'
import { loadBrandAssets } from '../../_lib/assets.js'
import { ease, inv, clamp, rand, hexPath, lerp } from '../../_lib/core.js'
import { addOpening } from '../../_lib/scenes/opening.js'
import { builtOnScene, installScene, BUILT_ON_DUR, INSTALL_DUR } from '../../_lib/scenes/closing.js'
import { hexCut, SPB, BAR, FPS, BPM } from '../../_lib/appfilm.js'
import { LOOP_ANCHOR } from '../../_lib/scenes/general.js'
import { promiseFrame } from '../../_lib/audiencefilm.js'
import { TYPE, rect, appMark, fitCaptionSize } from '../../_lib/ui.js'
import {
	overviewUI, statusUI, actionsUI, inboxUI, profileUI, phoneUI, PHONE, builderUI, collectScene, answerChip,
	ncWindow, pageFrame, toStage, WIN, boards as BOARDS,
} from '../boards/portal/board.js'

const APP = 'portaliq'
const F = (n) => n / FPS
const S16 = SPB / 4
const OPEN = 3 * BAR
const BODY = 20 * BAR
const BUILT = BUILT_ON_DUR // 4 bars
const INSTALL = INSTALL_DUR // 3 bars
const DURATION = OPEN + BODY + BUILT + INSTALL // 56.25 s
const RISE = 0.24
const EXIT = F(4)

const q = new URLSearchParams(location.search)
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: FPS, duration: DURATION, bpm: BPM, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

/* ---------- the opening, with its handover ---------- */
const bodyAt = addOpening(film, { at: 0 })
if (Math.abs(bodyAt - OPEN) > 1e-6) console.error(`opening ends at ${bodyAt}, expected ${OPEN}`)

/* ---------- the slots, in film time (from the storyboard, so film and board keep one timing) ---------- */
const B = Object.fromEntries(BOARDS.map((b) => [b.id, { slot: b.id, start: b.start, end: b.end }]))
const IDS = ['promise', 'hook', 'overview', 'status', 'actions', 'inbox', 'profile', 'mobile', 'forms']
const P = IDS.map((k) => B[k])
if (P.some((s) => !s)) console.error(`missing slots: ${IDS.filter((k) => !B[k]).join(', ')}`)
const [S_PROMISE, S_BUILDER, S_OVERVIEW, S_STATUS, S_ACTIONS, S_INBOX, S_PROFILE, S_MOBILE, S_FORMS] = P
const WORDS = Object.fromEntries(BOARDS.map((b) => [b.id, b.id === 'promise' ? (b.words || '').split('\n').slice(1).join('\n') : b.words]))
const SECT = Object.fromEntries(BOARDS.map((b) => [b.id, b.section]))
const sectionMark = (g, id) => appMark(g, SECT[id] || 'Portal')
if (Math.abs(S_FORMS.end - (OPEN + BODY)) > 1e-6) console.error(`body ends at ${S_FORMS.end}, expected ${OPEN + BODY}`)

/* ---------- shared pieces ---------- */

/** The page frame's visible rect on the stage (where the app window sits, bleeding off right and bottom). */
const PAGE_RECT = { x: WIN.x, y: WIN.y, w: 1920 - WIN.x + 40, h: 1080 - WIN.y + 40, r: 20 }

/**
 * A caption on the type grid, rising word by word (every word in within RISE of `up`) and leaving
 * upward over EXIT, ending at `out`. _Word_ takes Nextcloud cyan (a Nextcloud app's name, round 6).
 */
function captionAt(g, text, t, up, out, opts = {}) {
	if (t < up || t >= out) return false
	const size = opts.size || fitCaptionSize(text)
	const lh = Math.round((size * TYPE.lh) / TYPE.size)
	const blk = textBlock(g, text, { x: TYPE.x, y: opts.y ?? TYPE.y1, size, weight: 700, fill: C.white, accent2: C.nextcloudCyan, lineHeight: lh / size, tracking: -0.02, clip: true })
	const n = blk.items.length
	const d = size * 1.35
	const qq = inv(out - EXIT, out, t)
	blk.items.forEach((it, i) => {
		const t0 = up + (n > 1 ? (i / (n - 1)) * (RISE * 0.6) : 0)
		const p = ease.brand(inv(t0, t0 + RISE * 0.6, t))
		const dy = qq > 0 ? -d * qq * qq : d * (1 - p)
		if (Math.abs(dy) > 1e-3) it.node.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`)
	})
	return t >= up + RISE && t < out - EXIT
}

/** Every caption of the body, for the audit: key, text, up, out (film seconds). */
const CAPTIONS = []
function cap(key, text, up, out) { CAPTIONS.push({ key, text, up, out }); return { key, text, up, out } }

/** A body scene: a layer redrawn every frame from local time. */
function bodyScene(name, slot, draw) {
	film.scene(name, slot.start, slot.end, (ctx) => {
		const layer = el('g', { 'data-layer': name }, ctx.g)
		return (t) => {
			layer.replaceChildren()
			draw(layer, t - slot.start, t)
		}
	})
}

/** The hex match cut (#1): a hex grows out of a point past the frame with a rim that thins; draw(inside) fills it. */
function hexOpen(g, id, u, at, from, rimColour, draw) {
	const h = hexCut({ at, dur: SPB, from })(u)
	if (!h) return
	const cp = el('clipPath', { id }, g)
	el('path', { d: hexPath(h.cx, h.cy, h.r) }, cp)
	const inside = el('g', { 'clip-path': `url(#${id})` }, g)
	el('path', { d: hexPath(h.cx, h.cy, h.r), fill: C.cobalt }, inside)
	draw(inside)
	const wd = 14 * (1 - inv(at, at + SPB, u))
	if (wd > 0.6) el('path', { d: hexPath(h.cx, h.cy, h.r + wd / 2), fill: 'none', stroke: rimColour, 'stroke-width': wd.toFixed(2) }, g)
}

const cue = (t, kind, o = {}) => film.cue(t, kind, o)
const sum = (ts, u, d) => ts.reduce((a, t0) => a + inv(t0, t0 + d, u), 0)

/* ---------- 0 · promise, first: the admin's question (out: #1 the Portaliq cell opens into the builder) ---------- */
{
	const s = S_PROMISE, D = s.end - s.start
	const cutAt = D - SPB
	const c = cap('promise', WORDS.promise, s.start + F(1), s.end - F(2))
	bodyScene('promise', s, (g, u, t) => {
		// Round 28c: one grid at a time; the promise field turns over in with the cluster.
		const fg = el('g', {}, g)
		promiseFrame({ g: fg, W: 1920, H: 1080 }, { app: APP, promise: '', neighbours: ['dossiq', 'shillinq'] })
		const m = fg.querySelector('[data-role=mark] text')
		if (m) m.textContent = SECT.promise
		const kids = [...fg.childNodes].slice(1)
		// The cluster flips in (turns over by squashing about its centre, Round 27), never pops or scales in.
		const sx = ease.outCubic(inv(0.1, 0.1 + F(5), u))
		const cx = 1450, cy = 480
		const body = el('g', { transform: `translate(${cx} ${cy}) scale(${Math.max(sx, 1e-4).toFixed(4)} 1) translate(${-cx} ${-cy})` }, fg)
		for (const k of kids) body.appendChild(k)
		// Out on the last beat: the orange Portaliq cell (on the loop anchor) opens as a hex, the page
		// builder inside it; its orange rim thins as it grows past the frame.
		if (u >= cutAt) hexOpen(g, 'promise-cut', u, cutAt, [LOOP_ANCHOR.x, LOOP_ANCHOR.y, 70], C.orange, (inside) => ncWindow(inside, { drawUI: (w, geom) => builderUI(w, geom, { block: () => 0, ring: 0 }) }))
		captionAt(g, c.text, t, c.up, c.out)
	})
	cue(s.start + 0.1, 'pluck', { freq: 1174.66, gain: 0.24, pan: 0.3 })
	cue(s.start + 0.12, 'impact', { gain: 0.35, from: 80, to: 36, decay: 0.8 })
	cue(s.start + cutAt, 'whoosh', { dur: 0.5, from: 400, to: 4200, panFrom: 0.2, panTo: -0.3, gain: 0.16 })
}

/* ---------- 1 · builder, in Nextcloud: design your own portal, block by block ---------- */
let CANVAS = null // the builder's canvas in mock space, for the match cut into the live page
{
	const s = S_BUILDER, D = s.end - s.start
	const c = cap('hook', WORDS.hook, s.start + RISE, s.end - F(3))
	const DROPS = [0, 1, 2, 3, 4].map((i) => 0.4 + i * SPB)
	const FLY = 0.4
	const RING = DROPS[4] + FLY + 0.15
	bodyScene('hook', s, (g, u, t) => {
		const w = ncWindow(g, {
			drawUI: (win, geom) => builderUI(win, geom, {
				block: (i) => inv(DROPS[i], DROPS[i] + FLY, u),
				ring: ease.brand(inv(RING, RING + 0.2, u)),
			}),
		})
		if (!CANVAS && w.out.canvas) CANVAS = w.out.canvas
		sectionMark(g, 'hook')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0, 'click', { gain: 0.22, freq: 2900, seed: 251, dry: true })
	DROPS.forEach((d, i) => {
		cue(t0 + d, 'whoosh', { dur: FLY, from: 900, to: 2200, panFrom: -0.3, panTo: 0.3, gain: 0.04 })
		cue(t0 + d + FLY, 'click', { gain: 0.16, freq: 2600 + i * 150, pan: 0.3, seed: 252 + i, dry: true })
	})
	cue(t0 + RING, 'pluck', { freq: 1174.66, gain: 0.2, pan: 0.2 })
}

/* ---------- 2 · overview, the first client page (in: the canvas grows into the live page; #10; out: #1) ---------- */
{
	const s = S_OVERVIEW, D = s.end - s.start
	const cutAt = D - SPB
	const MORPH = F(8)
	const c = cap('overview', WORDS.overview, s.start + RISE, s.end - F(3))
	const R = rand(29)
	const scatter = [0, 1, 2].map(() => ({ dx: (R() - 0.5) * 1000, dy: (R() - 0.3) * 800, d: R() * 0.2 }))
	const RING_AT = 6 * SPB
	const ABOUT = [600, 520]
	let ringMock = null
	bodyScene('overview', s, (g, u, t) => {
		if (u < MORPH) {
			// The page just built leaves Nextcloud: the canvas grows into the standalone page, its head band with it.
			const [mx, my, mw, mh] = CANVAS || [564, 125, 601, 820]
			const [sx0, sy0] = toStage(mx, my)
			const p = ease.inOutCubic(inv(0, MORPH, u))
			const L = (a, b) => lerp(a, b, p)
			const px = L(sx0, PAGE_RECT.x), py = L(sy0, PAGE_RECT.y), pw = L(mw * WIN.s, PAGE_RECT.w), ph = L(mh * WIN.s, PAGE_RECT.h)
			rect(g, px, py, pw, ph, C.white, L(10, PAGE_RECT.r))
			// The head block (the canvas's first row) becomes the portal's head.
			const [hx0, hy0] = toStage(mx + 20, my + 24), [hx1, hy1] = toStage(60, 125)
			rect(g, L(hx0, hx1), L(hy0, hy1), L((mw - 40) * WIN.s, (1165 - 60) * WIN.s), L(110 * WIN.s, 90 * WIN.s), C.cobalt700, 8)
		} else {
			const push = 1 + 0.04 * ease.inOutCubic(inv(1.0, cutAt, u))
			const w = pageFrame(g, {
				push,
				about: ABOUT,
				drawUI: (win, geom) => overviewUI(win, geom, {
					tile: (i) => {
						const sc = scatter[i]
						const p = ease.brand(inv(MORPH + sc.d, MORPH + 0.7 + sc.d, u))
						return { dx: sc.dx * (1 - p), dy: sc.dy * (1 - p), o: clamp(p * 3) }
					},
					ring: ease.brand(inv(RING_AT, RING_AT + 0.25, u)),
				}),
			})
			if (!ringMock && w.out.ringCentre) ringMock = w.out.ringCentre
			// Out on the last beat (#1): the ringed tickets tile opens as a hex, the ticket's progress inside.
			if (u >= cutAt && ringMock) {
				const [sx, sy] = toStage(ABOUT[0] + (ringMock[0] - ABOUT[0]) * push, ABOUT[1] + (ringMock[1] - ABOUT[1]) * push)
				hexOpen(g, 'overview-cut', u, cutAt, [sx, sy, 24], C.orange, (inside) => pageFrame(inside, { drawUI: (win, geom) => statusUI(win, geom, { fill: 0, rows: 0, ring: 0 }) }))
			}
		}
		sectionMark(g, 'overview')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0, 'whoosh', { dur: MORPH, from: 700, to: 2400, panFrom: 0.4, panTo: 0.1, gain: 0.1 })
	cue(t0 + MORPH, 'click', { gain: 0.2, freq: 2800, pan: 0.2, seed: 201, dry: true })
	scatter.forEach((sc, i) => cue(t0 + MORPH + 0.7 + sc.d, 'tick', { freq: [1318.5, 1480, 1661.2][i], gain: 0.11, pan: -0.3 + i * 0.3 }))
	cue(t0 + RING_AT, 'pluck', { freq: 1174.66, gain: 0.22, pan: 0.3 })
	cue(t0 + cutAt, 'whoosh', { dur: 0.5, from: 400, to: 4200, panFrom: 0.2, panTo: -0.3, gain: 0.16 })
}

/* ---------- 3 · status: every ticket, step by step (it arrived inside the hex) ---------- */
{
	const s = S_STATUS, D = s.end - s.start
	const c = cap('status', WORDS.status, s.start + RISE, s.end - F(3))
	const ROWS = [1.75, 1.75 + S16, 1.75 + 2 * S16, 1.75 + 3 * S16]
	bodyScene('status', s, (g, u, t) => {
		pageFrame(g, {
			push: 1 + 0.03 * ease.inOutCubic(inv(0.4, D, u)),
			about: [600, 400],
			drawUI: (win, geom) => statusUI(win, geom, {
				fill: ease.inOutCubic(inv(0.3, 1.4, u)),
				ring: ease.brand(inv(1.45, 1.65, u)),
				rows: sum(ROWS, u, 0.2),
			}),
		})
		sectionMark(g, 'status')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	;[0.55, 0.9, 1.25].forEach((d, i) => cue(t0 + d, 'tick', { freq: [1318.5, 1567.98, 1760][i], gain: 0.12, pan: 0.1 + i * 0.15 }))
	cue(t0 + 1.45, 'pluck', { freq: 1174.66, gain: 0.2, pan: 0.3 })
	ROWS.forEach((d, i) => cue(t0 + d, 'tick', { freq: 2349.3 - i * 110, gain: 0.07, pan: 0.3 }))
}

/* ---------- 4 · actions: open a ticket, add a file, pay (#9 bands step down on the held page) ---------- */
{
	const s = S_ACTIONS, D = s.end - s.start
	const c = cap('actions', WORDS.actions, s.start + F(1), s.end - F(5))
	const A0 = 0.5, A1 = 1.45, A2 = 2.4 // the three actions, two beats apart
	bodyScene('actions', s, (g, u, t) => {
		// In (#9): the page holds; the actions step down into it in three bands, a frame pair apart.
		const band = u < F(2) ? 1 : u < F(4) ? 2 : 3
		let host = g
		if (band < 3) {
			pageFrame(g, { push: 1.03, about: [600, 400], drawUI: (win, geom) => statusUI(win, geom, {}) })
			const id = `aband${band}`
			const cp = el('clipPath', { id }, g)
			el('rect', { x: 900, y: 0, width: 1020, height: (1080 * band) / 3 }, cp)
			host = el('g', { 'clip-path': `url(#${id})` }, g)
			el('rect', { x: 900, y: (1080 * band) / 3 - 2, width: 1020, height: 4, fill: C.cobalt300 }, g)
		}
		// Out (#11): the page whips out left in the last four frames, after the caption has gone.
		pageFrame(host, {
			dx: -2300 * ease.inCubic(inv(D - F(4), D, u)),
			push: 1 + 0.03 * ease.inOutCubic(inv(0.4, D, u)),
			about: [600, 500],
			drawUI: (win, geom) => actionsUI(win, geom, {
				focus: u < A0 - 0.2 ? -1 : inv(A1 - 0.3, A1 - 0.05, u) + inv(A2 - 0.3, A2 - 0.05, u),
				ticket: inv(A0 + 0.2, A0 + 0.45, u),
				file: inv(A1 + 0.1, A1 + 0.45, u),
				paid: inv(A2 + 0.25, A2 + 0.45, u),
			}),
		})
		sectionMark(g, 'actions')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0, 'click', { gain: 0.22, freq: 2600, seed: 206, dry: true })
	;[F(2), F(4)].forEach((d, i) => cue(t0 + d, 'tick', { freq: [1760, 1975.53][i], gain: 0.07, pan: 0.3 }))
	cue(t0 + A0 + 0.2, 'click', { gain: 0.2, freq: 2900, pan: 0.3, seed: 211, dry: true })
	cue(t0 + A0 + 0.3, 'pluck', { freq: 1174.66, gain: 0.16, pan: 0.3 })
	cue(t0 + A1 + 0.45, 'impact', { gain: 0.12, from: 120, to: 60, decay: 0.2 })
	cue(t0 + A1 + 0.46, 'tick', { freq: 1760, gain: 0.12, pan: 0.3 })
	cue(t0 + A2 + 0.25, 'click', { gain: 0.22, freq: 3000, pan: 0.3, seed: 213, dry: true })
	cue(t0 + A2 + 0.35, 'pluck', { freq: 1318.5, gain: 0.2, pan: 0.3 })
	cue(t0 + D - F(4), 'whoosh', { dur: 0.35, from: 3200, to: 700, panFrom: 0.6, panTo: -0.6, gain: 0.13 })
}

/* ---------- 5 · inbox: every mail, letter and chat (#11 whip in, #5 stepped hexes out) ---------- */
{
	const s = S_INBOX, D = s.end - s.start
	const cutAt = D - SPB
	const c = cap('inbox', WORDS.inbox, s.start + RISE, s.end - F(3))
	const ITEMS = [0.3, 0.3 + S16, 0.3 + 2 * S16, 0.3 + 3 * S16, 0.3 + 4 * S16]
	bodyScene('inbox', s, (g, u, t) => {
		pageFrame(g, {
			dx: 1920 * 0.7 * (1 - ease.outCubic(inv(0, F(5), u))),
			push: 1 + 0.03 * ease.inOutCubic(inv(1.2, D, u)),
			about: [400, 400],
			drawUI: (win, geom) => inboxUI(win, geom, {
				items: sum(ITEMS, u, 0.22),
				ring: ease.brand(inv(1.25, 1.45, u)),
				open: inv(1.45, 1.85, u),
			}),
		})
		// Out (#5): four upright hexes step in from the right edge, 70 ms apart.
		if (u >= cutAt) {
			;[260, 520, 900, 1500].forEach((r, i) => {
				const ti = cutAt + i * 0.07
				if (u < ti) return
				const p = ease.snap(inv(ti, ti + 0.12, u))
				el('path', { d: hexPath(1920 + 60 - r * 0.55 * p, 560, r * (0.6 + 0.4 * p)), fill: i % 2 ? C.cobalt : C.cobalt600 }, g)
			})
		}
		sectionMark(g, 'inbox')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0 - F(1), 'whoosh', { dur: 0.3, from: 3200, to: 700, panFrom: 0.6, panTo: -0.2, gain: 0.12 })
	cue(t0 + F(5), 'click', { gain: 0.22, freq: 3000, seed: 221, dry: true })
	ITEMS.forEach((d, i) => cue(t0 + d + 0.1, 'tick', { freq: [1318.5, 1480, 1661.2, 1760, 1975.5][i], gain: 0.1, pan: -0.2 + i * 0.1 }))
	cue(t0 + 1.45, 'pluck', { freq: 1174.66, gain: 0.2, pan: 0.4 })
	;[0, 1, 2, 3].forEach((i) => cue(t0 + cutAt + i * 0.07, 'click', { gain: 0.14, freq: 2400 + i * 300, pan: 0.6 - i * 0.2, seed: 230 + i, dry: true }))
}

/* ---------- 6 · profile: their own address and bank details ---------- */
{
	const s = S_PROFILE, D = s.end - s.start
	const c = cap('profile', WORDS.profile, s.start + F(1), s.end - F(3))
	const E1 = [0.45, 1.25], SAVE1 = 1.35, E2 = [1.95, 2.75], SAVE2 = 2.85
	bodyScene('profile', s, (g, u, t) => {
		// In: the page whips in from the right behind the stepped hexes, in five frames.
		pageFrame(g, {
			dx: 520 * (1 - ease.snap(inv(0, F(5), u))),
			push: 1 + 0.03 * ease.inOutCubic(inv(0.4, D, u)),
			about: [600, 500],
			drawUI: (win, geom) => profileUI(win, geom, {
				focus: u < 0.35 ? 0 : u < 1.85 ? 1 : 2,
				e1: inv(E1[0], E1[1], u), s1: u >= SAVE1 ? 1 : 0,
				e2: inv(E2[0], E2[1], u), s2: u >= SAVE2 ? 1 : 0,
			}),
		})
		sectionMark(g, 'profile')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0, 'whoosh', { dur: 0.3, from: 3000, to: 800, panFrom: 0.8, panTo: 0.1, gain: 0.1 })
	for (const [a, b] of [E1, E2]) for (let k = 0; k < 9; k++) cue(t0 + a + 0.16 + (k * (b - a - 0.16)) / 9, 'tick', { freq: 3100 + (k % 3) * 200, gain: 0.05, decay: 0.02, pan: 0.2 })
	cue(t0 + SAVE1, 'pluck', { freq: 1318.5, gain: 0.18, pan: 0.3 })
	cue(t0 + SAVE2, 'pluck', { freq: 1567.98, gain: 0.2, pan: 0.3 })
}

/* ---------- 7 · mobile: the same portal on their phone (in: the page shrinks into the phone) ---------- */
{
	const s = S_MOBILE, D = s.end - s.start
	const c = cap('mobile', WORDS.mobile, s.start + RISE, s.end - F(5))
	const MORPH = F(6)
	const inset = PHONE.w * 0.032
	const to = { x: PHONE.x + inset, y: PHONE.y + inset, w: PHONE.w - 2 * inset, h: PHONE.h - 2 * inset, r: PHONE.w * 0.15 - inset }
	bodyScene('mobile', s, (g, u, t) => {
		if (u < MORPH) {
			// Match cut: the page shrinks into the phone's screen.
			const p = ease.inOutCubic(inv(0, MORPH, u))
			const L = (k) => PAGE_RECT[k] + (to[k] - PAGE_RECT[k]) * p
			rect(g, L('x'), L('y'), L('w'), L('h'), C.white, L('r'))
		} else {
			// Out: the phone lifts away upward in the last five frames, after the caption has gone.
			const dy = -1300 * ease.inCubic(inv(D - F(5), D, u))
			const pg = el('g', { transform: `translate(0 ${dy.toFixed(1)})` }, g)
			phoneUI(pg, { scroll: inv(0.5, 1.7, u), tap: ease.brand(inv(2.0, 2.2, u)), paid: inv(2.3, 2.5, u) })
		}
		sectionMark(g, 'mobile')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0, 'whoosh', { dur: 0.3, from: 2600, to: 900, panFrom: 0.4, panTo: 0.2, gain: 0.1 })
	cue(t0 + MORPH, 'click', { gain: 0.2, freq: 2800, pan: 0.3, seed: 241, dry: true })
	cue(t0 + 0.5, 'whoosh', { dur: 1.1, from: 900, to: 2000, panFrom: 0.3, panTo: 0.3, gain: 0.05 })
	cue(t0 + 2.0, 'click', { gain: 0.22, freq: 3000, pan: 0.3, seed: 243, dry: true })
	cue(t0 + 2.3, 'pluck', { freq: 1318.5, gain: 0.2, pan: 0.3 })
	cue(t0 + D - F(5), 'whoosh', { dur: 0.3, from: 800, to: 3600, panFrom: 0.3, panTo: 0.3, gain: 0.12 })
}

/* ---------- 8 · forms: the form on the portal page, the answers land in Tables in Nextcloud (in: vertical whip) ---------- */
{
	const s = S_FORMS, D = s.end - s.start
	const c = cap('forms', WORDS.forms, s.start + RISE, s.end - F(3))
	const TYPE_AT = [0.5, 1.6], SEND = 1.7, FLY = [1.95, 2.45], ROW = [2.35, 2.6], CELLS = [2.6, 3.1], RING = 3.2
	bodyScene('forms', s, (g, u, t) => {
		const tablesDy = 1000 * (1 - ease.snap(inv(0, F(6), u)))
		const formDy = 1000 * (1 - ease.snap(inv(F(2), F(8), u)))
		const at = collectScene(g, {
			type: inv(TYPE_AT[0], TYPE_AT[1], u),
			send: inv(SEND, SEND + 0.2, u),
			row: inv(ROW[0], ROW[1], u),
			cells: inv(CELLS[0], CELLS[1], u),
			ring: ease.brand(inv(RING, RING + 0.2, u)),
		}, { tablesDy, formDy })
		answerChip(g, [at.submit[0], at.submit[1] + formDy], [at.row[0], at.row[1] + tablesDy], inv(FLY[0], FLY[1], u))
		sectionMark(g, 'forms')
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0, 'whoosh', { dur: 0.3, from: 700, to: 3000, panFrom: 0.3, panTo: 0.3, gain: 0.12 })
	cue(t0 + F(8), 'click', { gain: 0.22, freq: 2900, seed: 261, dry: true })
	for (let k = 0; k < 12; k++) cue(t0 + TYPE_AT[0] + (k * (TYPE_AT[1] - TYPE_AT[0])) / 12, 'tick', { freq: 3100 + (k % 3) * 200, gain: 0.05, decay: 0.02, pan: -0.2 })
	cue(t0 + SEND, 'click', { gain: 0.22, freq: 3000, pan: -0.2, seed: 263, dry: true })
	cue(t0 + FLY[0], 'whoosh', { dur: FLY[1] - FLY[0], from: 900, to: 2600, panFrom: -0.3, panTo: 0.4, gain: 0.08 })
	;[0, 1, 2, 3, 4].forEach((i) => cue(t0 + CELLS[0] + i * 0.1, 'tick', { freq: 1318.5 + i * 110, gain: 0.08, pan: 0.4 }))
	cue(t0 + RING, 'pluck', { freq: 1174.66, gain: 0.2, pan: 0.4 })
}

/* ---------- the closing pieces: Built on Nextcloud (the C, the family ring, the re-zoom) and the install board ---------- */
const T_BUILT = OPEN + BODY
film.scene('builtOn', T_BUILT, T_BUILT + BUILT, (ctx) => builtOnScene(ctx, { app: APP, on: 'nextcloud' }))
film.scene('install', T_BUILT + BUILT, DURATION, (ctx) => installScene(ctx, {}), { post: 0.001 })

/** The bed, in D: silent under the opening, pad from the body, kick and hats under the scenes, thinning for the closing, resolving on D. */
const Dmaj9 = [50, 54, 61, 64], Bm9 = [47, 54, 57, 61], Gmaj9 = [47, 50, 54, 57], Aadd9 = [49, 52, 57, 59], Fsm7 = [49, 52, 54, 57], Em9 = [50, 54, 55, 59], Gmaj7 = [47, 50, 54, 59], Asus = [50, 52, 57, 59], Dtriad = [50, 54, 57, 62]
film.music = {
	bars: 30,
	chords: [
		Dtriad, Dtriad, Dtriad, // opening
		Dmaj9, Bm9, // promise
		Gmaj9, Aadd9, Gmaj9, // builder
		Fsm7, Bm9, // overview
		Gmaj7, Em9, Aadd9, // status, actions
		Gmaj9, Aadd9, // actions, inbox
		Dmaj9, Bm9, // inbox, profile
		Gmaj9, Aadd9, // profile, mobile
		Fsm7, Bm9, // mobile, forms
		Em9, Asus, // forms
		Dmaj9, Bm9, Gmaj9, Aadd9, // built on
		Gmaj9, Aadd9, Dtriad, // install
	],
	bass: [38, 38, 38, 38, 35, 43, 45, 43, 42, 35, 43, 40, 45, 43, 45, 38, 35, 43, 45, 42, 35, 43, 40, 45, 38, 35, 43, 45, 43, 38],
	parts: { pad: [[3, 30]], bass: [[4, 29]], kick: [[4, 21]], hat: [[5, 21]], clap: [[6, 20]] },
	loop: false,
}
if (film.music.chords.length !== 30 || film.music.bass.length !== 30) console.error(`music: ${film.music.chords.length} chords, ${film.music.bass.length} bass notes, expected 30`)

film.board = { film: 'portaliq-portal', meta: { title: 'Portaliq, one portal your clients run themselves' } }
window.__portaliq = { captions: CAPTIONS, slots: P.map(({ slot, start, end }) => ({ slot, start, end })), sections: SECT, OPEN, BODY, BUILT, INSTALL, DURATION }
if (q.has('dump')) console.log(JSON.stringify(window.__portaliq))
film.start()
