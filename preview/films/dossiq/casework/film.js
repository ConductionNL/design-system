/**
 * The Dossiq film, municipal casework (storyboard preview/films/dossiq/boards/casework, round 10:
 * no AI, knowledge beside the letter, CMMN, OIO and ZGW, Built on Nextcloud).
 *
 *   0 to 5.63 s       the shared Conduction opening (_lib/scenes/opening.js), 3 bars, handing over
 *                     on its field, which the hook builds on
 *   5.63 to 24.38 s   the body, 10 bars on the app-film template (appfilm.js plan(2)):
 *                     hook "Your team's work, one backlog" (#10 cluster merge, #1 hex cut out),
 *                     letter "Drafted in Word, the answers appear" (#4 typewriter, #5 stepped wipe out),
 *                     standards "CMMN, OIO, ZGW: every case fits" (wires, boxes one per beat),
 *                     flows "Draw flows, share them in the store" (general: the flow builder),
 *                     promise "The whole team, every case"
 *   24.38 to 28.13 s  the shared closing piece, "Built on Nextcloud" (closing.js, on: 'nextcloud'), 2 bars
 *   28.13 to 33.75 s  the shared install board (closing.js), 3 bars
 *
 * 1920 x 1080, 24 fps, 18 bars at 128 BPM (810 frames, 45 a bar). No loop. Every frame is a pure
 * function of time: each body scene redraws its layer from its local time. The board's UI
 * functions take an animation state whose defaults are the approved still, so a scene at rest
 * is exactly its storyboard frame.
 */
import { Film, loadFonts, el, textBlock } from '../../_lib/stage.js'
import { C, FONTS } from '../../_lib/brand.js'
import { loadBrandAssets } from '../../_lib/assets.js'
import { ease, inv, clamp, lerp, spring, rand, hexPath } from '../../_lib/core.js'
import { addOpening, handoverGround } from '../../_lib/scenes/opening.js'
import { builtOnScene, installScene } from '../../_lib/scenes/closing.js'
import { plan, hexCut, SPB, BAR, FPS, BPM } from '../../_lib/appfilm.js'
import { FRAMES, WINDOW, LOOP_ANCHOR } from '../../_lib/scenes/general.js'
import { promiseFrame } from '../../_lib/audiencefilm.js'
import { TYPE, layout, rect, clipped, topbar, nav, appTag, appMark, fitCaptionSize, bar } from '../../_lib/ui.js'
import { backlogUI, letterUI, standardsUI } from '../boards/casework/board.js'

const APP = 'dossiq'
const U = 2.5
const F = (n) => n / FPS
const OPEN = 3 * BAR
const BODY = 10 * BAR
const BUILT = 2 * BAR
const INSTALL = 3 * BAR
const DURATION = OPEN + BODY + BUILT + INSTALL // 33.75 s
const RISE = 0.24
const EXIT = F(4)

const q = new URLSearchParams(location.search)
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: FPS, duration: DURATION, bpm: BPM, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

/* ---------- the opening, with its handover ---------- */
const bodyAt = addOpening(film, { at: 0 })
if (Math.abs(bodyAt - OPEN) > 1e-6) console.error(`opening ends at ${bodyAt}, expected ${OPEN}`)

/* ---------- the slots, in film time ---------- */
const P = plan(2).map((s) => ({ ...s, start: s.start + OPEN, end: s.end + OPEN }))
const [S_HOOK, S_LETTER, S_STD, S_FLOWS, S_PROMISE] = P

/* ---------- shared pieces ---------- */

const W0 = layout(1920, 1080).win
const CONTENT_X = (WINDOW.nav + 14) * U
/** Mock-space point -> stage point (the window is drawn at W0.s from W0.x, W0.y). */
const toStage = (mx, my) => [W0.x + W0.s * mx, W0.y + W0.s * my]

/**
 * The app window, as hookFrame draws it (general.js) but without the chrome, so the caption and
 * the mark animate on their own. `land` 0..1 lands it (rises 60 px, fades in); `push` scales the
 * UI inside the window about `about` (mock space); drawUI(w, geom) draws the content.
 */
function appWindow(g, { drawUI, land = 1, push = 1, about = [900, 600], header = true, tag = 1 }) {
	const visR = (1920 - W0.x) / W0.s
	const visB = (1080 - W0.y) / W0.s
	const dy = 60 * (1 - ease.brand(land))
	const outer = el('g', { opacity: clamp(land * 2).toFixed(3), transform: `translate(0 ${dy.toFixed(1)})` }, g)
	const view = el('g', { transform: `translate(${W0.x} ${W0.y}) scale(${W0.s})` }, outer)
	const FW = 720 * U, FH = visB + 60
	const win = clipped(view, 0, 0, FW, FH, 10 * U)
	rect(win, 0, 0, FW, FH, C.white)
	topbar(win, 0, 0, FW, U, { fill: C.cobalt900 })
	const NW = WINDOW.nav * U
	nav(win, 0, 24 * U, NW, FH - 24 * U, U, { items: 7, active: 1 })
	rect(win, (720 - 187) * U, 24 * U, U, FH, C.cobalt100)
	const geom = { x: CONTENT_X, r: Math.min((720 - 187 - 14) * U, visR - 48 / W0.s), top: 24 * U, Y0: 0, u: U, anchor: { x: CONTENT_X, y: WINDOW.row1 }, visB }
	// The page's content, pushed in about a point in mock space (the header stays put).
	const inner = el('g', { transform: `translate(${about[0]} ${about[1]}) scale(${push.toFixed(4)}) translate(${-about[0]} ${-about[1]})` }, win)
	if (header) {
		bar(inner, geom.x, 95, 250, 35, C.cobalt)
		rect(inner, geom.r - 95, 95, 95, 35, C.cobalt, 3 * U)
		rect(inner, geom.r - 200, 95, 95, 35, C.white, 3 * U, { stroke: C.cobalt200, 'stroke-width': U })
	}
	const out = drawUI(inner, geom) || {}
	// The app tag on the loop anchor: pops in with the window.
	const ts = tag >= 1 ? 1 : Math.max(0, tag)
	if (ts > 0.001) {
		const a = LOOP_ANCHOR
		const tg = el('g', { transform: `translate(${a.x} ${a.y + dy}) scale(${ts.toFixed(3)}) translate(${-a.x} ${-a.y})` }, g)
		appTag(tg, a.x, a.y, a.r, APP, { fill: C.cobalt })
	}
	return { geom, out, push, about }
}

/**
 * A caption on the type grid, fitted like chrome() does, rising word by word (every word in within
 * RISE of `up`) and leaving upward over EXIT, ending at `out`. Returns true when fully up.
 */
function captionAt(g, text, t, up, out, opts = {}) {
	if (t < up || t >= out) return false
	const size = opts.size || fitCaptionSize(text)
	const lh = Math.round((size * TYPE.lh) / TYPE.size)
	const blk = textBlock(g, text, { x: TYPE.x, y: opts.y ?? TYPE.y1, size, weight: 700, fill: C.white, lineHeight: lh / size, tracking: -0.02, clip: true })
	const n = blk.items.length
	const d = size * 1.35
	const q = inv(out - EXIT, out, t)
	blk.items.forEach((it, i) => {
		const t0 = up + (n > 1 ? (i / (n - 1)) * (RISE * 0.6) : 0)
		const p = ease.brand(inv(t0, t0 + RISE * 0.6, t))
		const dy = q > 0 ? -d * q * q : d * (1 - p)
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

/** The hex match cut: a pointy-top hex grows out of a point and covers the frame (never rotated). */
function hexOverlay(g, t, cut, fill = C.cobalt) {
	const h = cut(t)
	if (h) el('path', { d: hexPath(h.cx, h.cy, h.r), fill }, g)
}

const cue = (t, kind, o = {}) => film.cue(t, kind, o)

/* ---------- 1 · hook: the team's backlog (#10 cluster merge, #1 hex cut out) ---------- */
{
	const s = S_HOOK, D = s.end - s.start
	const cutAt = D - SPB
	const c = cap('hook', "Your team's work,\none backlog", s.start + RISE * 0 + 0.24, s.start + cutAt)
	// Seeded scatter for the cards: each starts somewhere over the window and flies to its lane.
	const R = rand(71)
	const scatter = {}
	for (let ci = 0; ci < 3; ci++) for (let i = 0; i < 4; i++) scatter[`${ci},${i}`] = { dx: (R() - 0.5) * 900, dy: (R() - 0.7) * 700, d: R() * 0.25 }
	const RING_AT = 5 * SPB // beat 5: a colleague picks the case up
	let ringStage = null
	bodyScene('hook', s, (g, u, t) => {
		// The opening's field, fading under the landing window: no cut from the opening.
		if (u < 0.6) { const hg = handoverGround(g); hg.setAttribute('opacity', (1 - ease.inOutCubic(inv(0, 0.6, u))).toFixed(3)) }
		const push = 1 + 0.05 * ease.inOutCubic(inv(1.0, cutAt, u))
		const w = appWindow(g, {
			land: inv(0, 0.45, u),
			tag: u < 0.25 ? 0 : spring(u - 0.25, { freq: 2.6, zeta: 0.55 }),
			push,
			about: [CONTENT_X + 427, WINDOW.row1 + 200],
			drawUI: (win, geom) => backlogUI(win, geom, {
				card: (ci, i) => {
					const sc = scatter[`${ci},${i}`]
					const p = ease.brand(inv(0.3 + sc.d, 0.95 + sc.d, u))
					return { dx: sc.dx * (1 - p), dy: sc.dy * (1 - p), o: clamp(p * 3) }
				},
				ring: ease.brand(inv(RING_AT, RING_AT + 0.25, u)),
			}),
		})
		if (!ringStage && w.out.ringCentre) {
			const [mx, my] = w.out.ringCentre
			ringStage = { mx, my }
		}
		// Out on the last beat: the ringed card becomes an upright hex that grows past the frame
		// (under the mark, which stays on every body frame).
		if (u >= cutAt && ringStage) {
			const [ax, ay] = [CONTENT_X + 427, WINDOW.row1 + 200]
			const mx = ax + (ringStage.mx - ax) * push, my = ay + (ringStage.my - ay) * push
			const [sx, sy] = toStage(mx, my)
			hexOverlay(g, u, hexCut({ at: cutAt, dur: SPB, from: [sx, sy, 24] }))
		}
		appMark(g, APP)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0 + 0.02, 'whoosh', { dur: 0.5, from: 500, to: 2600, panFrom: 0.6, panTo: 0.1, gain: 0.1 })
	;[0.62, 0.7, 0.78, 0.86, 0.95, 1.05].forEach((d, i) => cue(t0 + d, 'tick', { freq: [1318.5, 1480, 1661.2, 1760, 1975.5, 2217.5][i], gain: 0.11, pan: -0.3 + i * 0.12 }))
	cue(t0 + RING_AT, 'pluck', { freq: 1174.66, gain: 0.22, pan: 0.2 })
	cue(t0 + cutAt, 'whoosh', { dur: 0.5, from: 400, to: 4200, panFrom: 0.2, panTo: -0.3, gain: 0.16 })
}

/* ---------- 2 · letter: drafted in Word, the answers appear (#4 typewriter, #5 stepped wipe out) ---------- */
{
	const s = S_LETTER, D = s.end - s.start
	const cutAt = D - SPB
	const c = cap('letter', 'Drafted in Word,\nthe answers appear', s.start + RISE, s.start + cutAt)
	const ITEMS = [1.4, 1.4 + SPB, 1.4 + 2 * SPB]
	bodyScene('letter', s, (g, u, t) => {
		appWindow(g, {
			land: inv(0, 0.35, u),
			push: 1 + 0.03 * ease.inOutCubic(inv(0.4, cutAt, u)),
			about: [CONTENT_X + 250, WINDOW.row1 + 250],
			drawUI: (win, geom) => letterUI(win, geom, {
				bar: ease.brand(inv(0.3, 0.55, u)),
				fill: ease.brand(inv(0.5, 1.1, u)),
				type: inv(1.1, 2.7, u),
				items: ITEMS.reduce((a, t0) => a + ease.brand(inv(t0, t0 + 0.22, u)), 0),
				ring: ease.brand(inv(2.75, 2.95, u)),
			}),
		})
		// Out: technique #5, four upright hexes step in from the right edge, 70 ms apart.
		if (u >= cutAt) {
			const R = [260, 520, 900, 1500]
			R.forEach((r, i) => {
				const ti = cutAt + i * 0.07
				if (u < ti) return
				const p = ease.snap(inv(ti, ti + 0.12, u))
				el('path', { d: hexPath(1920 + 60 - (r * 0.55) * p, 560, r * (0.6 + 0.4 * p)), fill: i % 2 ? C.cobalt : C.cobalt600 }, g)
			})
		}
		appMark(g, APP)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0 + 0.3, 'click', { gain: 0.16, freq: 2800, pan: 0.3, seed: 81, dry: true })
	;[0.55, 0.75, 0.95].forEach((d, i) => cue(t0 + d, 'pluck', { freq: [880, 987.8, 1174.7][i], gain: 0.16, pan: 0.2 }))
	for (let k = 0; k < 14; k++) cue(t0 + 1.1 + (k * 1.6) / 14, 'tick', { freq: 3100 + (k % 3) * 200, gain: 0.05, decay: 0.02, pan: 0.1 })
	ITEMS.forEach((d, i) => cue(t0 + d, 'pluck', { freq: [1318.5, 1480, 1661.2][i], gain: 0.18, pan: 0.5 }))
	;[0, 1, 2, 3].forEach((i) => cue(t0 + cutAt + i * 0.07, 'click', { gain: 0.14, freq: 2400 + i * 300, pan: 0.6 - i * 0.2, seed: 90 + i, dry: true }))
}

/* ---------- 3 · standards: CMMN, OIO, ZGW (wires, boxes one per beat) ---------- */
{
	const s = S_STD, D = s.end - s.start
	const c = cap('standards', 'CMMN, OIO, ZGW:\nevery case fits', s.start + RISE, s.end - 0.16)
	const BOX = [1.2, 1.2 + SPB, 1.2 + 2 * SPB]
	bodyScene('standards', s, (g, u, t) => {
		// The wipe's last hex, shrinking back off to the right as the case lands under it.
		if (u < 0.3) el('path', { d: hexPath(1920 + 60 - 825, 560, 1500 * (1 - ease.brand(inv(0, 0.3, u)))), fill: C.cobalt }, g)
		appWindow(g, {
			land: inv(0.05, 0.4, u),
			push: 1 + 0.03 * ease.inOutCubic(inv(0.5, D, u)),
			about: [CONTENT_X + 427, WINDOW.row1 + 350],
			drawUI: (win, geom) => standardsUI(win, geom, {
				wire: ease.inOutCubic(inv(0.47, 1.0, u)),
				split: u < 1.0 ? 0 : Math.min(1.2, spring(u - 1.0, { freq: 2.6, zeta: 0.5 })),
				boxes: BOX.reduce((a, t0) => a + ease.brand(inv(t0, t0 + 0.3, u)), 0),
			}),
		})
		appMark(g, APP)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0 + 0.47, 'whoosh', { dur: 0.5, from: 1200, to: 3200, panFrom: -0.2, panTo: 0.4, gain: 0.07 })
	cue(t0 + 1.0, 'click', { gain: 0.18, freq: 3000, pan: 0.2, seed: 101, dry: true })
	BOX.forEach((d, i) => cue(t0 + d, 'pluck', { freq: [987.8, 1174.7, 1318.5][i], gain: 0.2, pan: -0.3 + i * 0.3 }))
}

/* ---------- 4 · flows (general): draw flows, share them in the store ---------- */
{
	const s = S_FLOWS, D = s.end - s.start
	const c = cap('flows', 'Draw flows,\nshare them in the store', s.start + RISE, s.end - 0.16)
	bodyScene('flows', s, (g, u, t) => {
		// The general frame without its caption; its first child is the app mark, which stays put.
		const fg = el('g', {}, g)
		FRAMES.flows({ g: fg, W: 1920, H: 1080 }, { app: APP, caption: '' })
		const kids = [...fg.childNodes].slice(1)
		const land = ease.brand(inv(0, 0.4, u))
		const drift = 0.02 * ease.inOutCubic(inv(0.4, D, u))
		const body = el('g', { opacity: clamp(land * 2).toFixed(3), transform: `translate(0 ${(80 * (1 - land)).toFixed(1)}) translate(1380 540) scale(${(1 + drift).toFixed(4)}) translate(-1380 -540)` }, fg)
		for (const k of kids) body.appendChild(k)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0 + 0.05, 'whoosh', { dur: 0.45, from: 600, to: 2400, panFrom: 0.5, panTo: 0, gain: 0.1 })
	;[0.5, 0.62, 0.74].forEach((d, i) => cue(t0 + d, 'tick', { freq: [1760, 1975.5, 2217.5][i], gain: 0.12, pan: 0.1 * i }))
	cue(t0 + 1.4, 'pluck', { freq: 1318.5, gain: 0.2, pan: 0.3 })
}

/* ---------- 5 · promise: the whole team, every case ---------- */
{
	const s = S_PROMISE
	const c = cap('promise', 'The whole team,\nevery case', s.start + RISE, s.end - 0.16)
	bodyScene('promise', s, (g, u, t) => {
		const fg = el('g', {}, g)
		promiseFrame({ g: fg, W: 1920, H: 1080 }, { app: APP, promise: '', neighbours: ['portaliq', 'filinq'] })
		const kids = [...fg.childNodes].slice(1)
		const sc = u < 0 ? 0 : Math.min(1.08, spring(u, { freq: 2.4, zeta: 0.6 }))
		const cx = 1450, cy = 480
		const body = el('g', { opacity: clamp(u / 0.2).toFixed(3), transform: `translate(${cx} ${cy}) scale(${(0.6 + 0.4 * sc).toFixed(4)}) translate(${-cx} ${-cy})` }, fg)
		for (const k of kids) body.appendChild(k)
		captionAt(g, c.text, t, c.up, c.out)
	})
	cue(s.start + 0.02, 'pluck', { freq: 1174.66, gain: 0.24, pan: 0.3 })
	cue(s.start + 0.05, 'impact', { gain: 0.35, from: 80, to: 36, decay: 0.8 })
	cue(s.end - 0.05, 'click', { gain: 0.2, freq: 2900, pan: 0, seed: 111, dry: true })
}

/* ---------- the closing pieces: Built on Nextcloud, then the install board ---------- */
const T_BUILT = OPEN + BODY
film.scene('builtOn', T_BUILT, T_BUILT + BUILT, (ctx) => builtOnScene(ctx, { app: APP, apps: ['filinq'], on: 'nextcloud' }))
film.scene('install', T_BUILT + BUILT, DURATION, (ctx) => installScene(ctx, {}), { post: 0.001 })

/** The bed, in D: silent under the opening, pad from the body, kick and hats under the proofs, thinning for the closing, resolving on D. */
film.music = {
	bars: 18,
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62],
		[50, 54, 61, 64], // 3 Dmaj9: the backlog
		[47, 54, 57, 61], // 4 Bm9: the letter
		[47, 50, 54, 57], // 5 Gmaj9: the answers
		[49, 52, 57, 59], // 6 A add9: the standards
		[47, 50, 54, 57], // 7 Gmaj9: the boxes
		[49, 52, 54, 57], // 8 F#m7: the flows
		[47, 50, 54, 61], // 9 Bm add9
		[47, 50, 54, 59], // 10 Gmaj7: the promise
		[50, 52, 57, 59], // 11 A sus4 add9
		[50, 54, 61, 64], // 12 Dmaj9: built on
		[47, 54, 57, 61], // 13 Bm9
		[47, 50, 54, 57], // 14 Gmaj9: install the app
		[49, 52, 57, 59], // 15 A add9
		[47, 50, 54, 57], // 16 Gmaj9
		[50, 54, 57, 62], // 17 D
	],
	bass: [38, 38, 38, 38, 35, 43, 45, 43, 42, 35, 43, 45, 38, 35, 43, 45, 43, 38],
	parts: { pad: [[3, 18]], bass: [[4, 17]], kick: [[4, 11]], hat: [[5, 11]], clap: [[6, 10]] },
	loop: false,
}

film.board = { film: 'dossiq-casework', meta: { title: 'Dossiq, municipal casework' } }
window.__dossiq = { captions: CAPTIONS, slots: P.map(({ slot, index, start, end }) => ({ slot, index, start, end })), OPEN, BODY, BUILT, INSTALL, DURATION }
if (q.has('dump')) console.log(JSON.stringify(window.__dossiq))
film.start()
