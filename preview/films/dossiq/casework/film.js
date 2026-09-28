/**
 * The Dossiq film, municipal casework (storyboard preview/films/dossiq/boards/casework, round 10:
 * no AI, knowledge beside the letter, CMMN, OIO and ZGW, Built on Nextcloud).
 *
 *   0 to 5.63 s       the shared Conduction opening (_lib/scenes/opening.js), 3 bars, handing over
 *                     on its field, which the hook builds on
 *   5.63 to 31.88 s   the body, 14 bars (Round 15 final; the storyboard's times, board.js promiseFirst):
 *                     promise "The whole team, every case", straight after the opening's handover,
 *                     backlog "Your team, one backlog" (#10 cluster merge, #1 hex cut out),
 *                     documents "Edited right in the case" (the editor opens beside the case's files),
 *                     knowledge "While you work, the answers appear" (#4 typewriter, #5 stepped wipe out),
 *                     standards "International and local standards, built in" (the archiving film's
 *                     design: whip in, wires, three tagged boxes, #9 swap ZGW to ZGW / StUF),
 *                     automate "Draw a flow, the work runs itself" (the shared capability),
 *                     share "Share your case types and flows"; the body ends here, a hard cut to Built on
 *   31.88 to 35.63 s  the shared closing piece, "Built on Nextcloud" (closing.js, on: 'nextcloud'), 2 bars
 *   35.63 to 41.25 s  the shared install board (closing.js), 3 bars
 *
 * 1920 x 1080, 24 fps, 22 bars at 128 BPM (990 frames, 45 a bar). No loop. Every frame is a pure
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
import { backlogUI, documentsUI, knowledgeUI, standardsUI, automateUI, shareUI, boards as BOARDS } from '../boards/casework/board.js'

const APP = 'dossiq'
const U = 2.5
const F = (n) => n / FPS
const OPEN = 3 * BAR
const BODY = 14 * BAR
const BUILT = 2 * BAR
const INSTALL = 3 * BAR
const DURATION = OPEN + BODY + BUILT + INSTALL // 41.25 s
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
// The slots come from the storyboard, so the film and its board keep one timing (promise first).
const B = Object.fromEntries(BOARDS.map((b) => [b.id, { slot: b.id, start: b.start, end: b.end }]))
const [S_PROMISE, S_HOOK, S_DOCS, S_KNOW, S_STD, S_AUTO, S_SHARE] = ['promise', 'hook', 'documents', 'knowledge', 'standards', 'automate', 'share'].map((k) => B[k])
const P = [S_PROMISE, S_HOOK, S_DOCS, S_KNOW, S_STD, S_AUTO, S_SHARE]
if (Math.abs(S_SHARE.end - (OPEN + BODY)) > 1e-6) console.error(`body ends at ${S_SHARE.end}, expected ${OPEN + BODY}`)

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
function appWindow(g, { drawUI, land = 1, push = 1, about = [900, 600], header = true, tag = 1, dx = 0 }) {
	const visR = (1920 - W0.x) / W0.s
	const visB = (1080 - W0.y) / W0.s
	const dy = 60 * (1 - ease.brand(land))
	const outer = el('g', { opacity: clamp(land * 2).toFixed(3), transform: `translate(${dx.toFixed(1)} ${dy.toFixed(1)})` }, g)
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
		const tg = el('g', { transform: `translate(${a.x + dx} ${a.y + dy}) scale(${ts.toFixed(3)}) translate(${-a.x} ${-a.y})` }, g)
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
	const c = cap('hook', 'Your team,\none backlog', s.start + RISE, s.start + cutAt)
	// Seeded scatter for the cards: each starts somewhere over the window and flies to its lane.
	const R = rand(71)
	const scatter = {}
	for (let ci = 0; ci < 3; ci++) for (let i = 0; i < 4; i++) scatter[`${ci},${i}`] = { dx: (R() - 0.5) * 900, dy: (R() - 0.7) * 700, d: R() * 0.25 }
	const RING_AT = 5 * SPB // beat 5: a colleague picks the case up
	let ringStage = null
	bodyScene('hook', s, (g, u, t) => {
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

/* ---------- 2 · documents: edited right in the case (the editor opens beside the case's files) ---------- */
{
	const s = S_DOCS, D = s.end - s.start
	const c = cap('documents', 'Edited right\nin the case', s.start + RISE, s.end - 0.16)
	bodyScene('documents', s, (g, u, t) => {
		appWindow(g, {
			land: inv(0, 0.35, u),
			push: 1 + 0.03 * ease.inOutCubic(inv(0.4, D, u)),
			about: [CONTENT_X + 500, WINDOW.row1 + 250],
			drawUI: (win, geom) => documentsUI(win, geom, {
				ring: ease.brand(inv(0.45, 0.65, u)),
				open: ease.brand(inv(0.7, 1.1, u)),
				fill: ease.brand(inv(1.2, 1.8, u)),
				edit: inv(1.9, 3.2, u),
			}),
		})
		appMark(g, APP)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0 + 0.45, 'tick', { freq: 1760, gain: 0.12, pan: -0.2 })
	cue(t0 + 0.7, 'click', { gain: 0.16, freq: 2800, pan: 0.3, seed: 81, dry: true })
	;[1.2, 1.4, 1.6].forEach((d, i) => cue(t0 + d, 'pluck', { freq: [880, 987.8, 1174.7][i], gain: 0.16, pan: 0.2 }))
	for (let k = 0; k < 12; k++) cue(t0 + 1.9 + (k * 1.3) / 12, 'tick', { freq: 3100 + (k % 3) * 200, gain: 0.05, decay: 0.02, pan: 0.2 })
}

/* ---------- 3 · knowledge: while you work, the answers appear (#4 typewriter, #5 stepped wipe out) ---------- */
{
	const s = S_KNOW, D = s.end - s.start
	const cutAt = D - SPB
	const c = cap('knowledge', 'While you work,\nthe answers appear', s.start + RISE, s.start + cutAt)
	const ITEMS = [1.3, 1.3 + SPB, 1.3 + 2 * SPB]
	bodyScene('knowledge', s, (g, u, t) => {
		appWindow(g, {
			land: inv(0, 0.35, u),
			push: 1 + 0.03 * ease.inOutCubic(inv(0.4, cutAt, u)),
			about: [CONTENT_X + 250, WINDOW.row1 + 250],
			drawUI: (win, geom) => knowledgeUI(win, geom, {
				type: inv(0.4, 2.6, u),
				items: ITEMS.reduce((a, t0) => a + ease.brand(inv(t0, t0 + 0.22, u)), 0),
				ring: ease.brand(inv(2.7, 2.9, u)),
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
	for (let k = 0; k < 16; k++) cue(t0 + 0.4 + (k * 2.2) / 16, 'tick', { freq: 3100 + (k % 3) * 200, gain: 0.05, decay: 0.02, pan: -0.1 })
	ITEMS.forEach((d, i) => cue(t0 + d, 'pluck', { freq: [1318.5, 1480, 1661.2][i], gain: 0.18, pan: 0.5 }))
	;[0, 1, 2, 3].forEach((i) => cue(t0 + cutAt + i * 0.07, 'click', { gain: 0.14, freq: 2400 + i * 300, pan: 0.6 - i * 0.2, seed: 90 + i, dry: true }))
}

/* ---------- 4 · standards: international and local (the archiving film's design, #9 swap) ---------- */
{
	const s = S_STD, D = s.end - s.start
	const c = cap('standards', 'International and local\nstandards, built in', s.start + RISE, s.end - 0.16)
	const b = (n) => n * SPB
	const BOX = [b(2.5), b(3), b(3.5)]
	const SWAP = b(5)
	bodyScene('standards', s, (g, u, t) => {
		// The whip: the window arrives from the right in 5 frames (ease.snap; the motion blur smears it).
		const dx = 520 * (1 - ease.snap(inv(0, F(5), u)))
		appWindow(g, {
			dx,
			push: 1 + 0.03 * ease.inOutCubic(inv(b(2.5), D, u)),
			about: [CONTENT_X + 376, WINDOW.row1 + 350],
			drawUI: (win, geom) => standardsUI(win, geom, {
				wire: inv(b(1), b(2.4), u),
				split: u < b(2) ? 0 : Math.min(1.2, spring(u - b(2), { freq: 2.6, zeta: 0.55 })),
				boxes: BOX.reduce((a, t0) => a + ease.brand(inv(t0, t0 + 0.35, u)), 0),
				fields: (i) => ease.brand(inv(BOX[i] + b(0.25), BOX[i] + b(1.25), u)),
				swap: inv(SWAP, SWAP + F(4), u),
			}),
		})
		appMark(g, APP)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0, 'whoosh', { dur: 0.3, from: 3000, to: 800, panFrom: 0.8, panTo: 0.1, gain: 0.12 })
	cue(t0 + b(1), 'whoosh', { dur: 0.5, from: 1200, to: 3200, panFrom: -0.2, panTo: 0.4, gain: 0.06 })
	cue(t0 + b(2), 'click', { gain: 0.18, freq: 3000, pan: 0.2, seed: 101, dry: true })
	BOX.forEach((d, i) => cue(t0 + d, 'pluck', { freq: [987.8, 1174.7, 1318.5][i], gain: 0.2, pan: -0.3 + i * 0.3 }))
	cue(t0 + SWAP, 'tick', { freq: 2349.3, gain: 0.14, pan: 0.5 })
}

/* ---------- 5 · automate (the shared capability): draw a flow, the work runs itself ---------- */
{
	const s = S_AUTO, D = s.end - s.start
	const c = cap('automate', 'Draw a flow,\nthe work runs itself', s.start + RISE, s.end - 0.16)
	const NODES = [0.45, 0.45 + SPB / 4, 0.45 + SPB / 2]
	const DONE = 0.45 + 3 * SPB
	bodyScene('automate', s, (g, u, t) => {
		appWindow(g, {
			land: inv(0, 0.35, u),
			// The camera eases down from the canvas to the case's steps once the flow is drawn.
			push: 1 + 0.04 * ease.inOutCubic(inv(1.4, D, u)),
			about: [CONTENT_X + 427, WINDOW.row1 + 150 + 250 * ease.inOutCubic(inv(1.4, 2.2, u))],
			drawUI: (win, geom) => automateUI(win, geom, {
				nodes: NODES.reduce((a, t0) => a + ease.brand(inv(t0, t0 + 0.2, u)), 0),
				edges: ease.inOutCubic(inv(0.75, 1.3, u)),
				done: u >= DONE ? 1 : 0,
				ring: ease.brand(inv(DONE, DONE + 0.2, u)),
			}),
		})
		appMark(g, APP)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	NODES.forEach((d, i) => cue(t0 + d, 'tick', { freq: [1760, 1975.5, 2217.5][i], gain: 0.12, pan: -0.3 + i * 0.3 }))
	cue(t0 + 0.75, 'whoosh', { dur: 0.5, from: 1200, to: 3200, panFrom: -0.4, panTo: 0.4, gain: 0.06 })
	cue(t0 + DONE, 'click', { gain: 0.2, freq: 3000, pan: 0.2, seed: 121, dry: true })
	cue(t0 + DONE + 0.02, 'pluck', { freq: 1318.5, gain: 0.18, pan: 0.2 })
}

/* ---------- 6 · share: your case types and flows, through the store to a second organisation ---------- */
{
	const s = S_SHARE, D = s.end - s.start
	const c = cap('share', 'Share your case types\nand flows', s.start + RISE, s.end - 0.16)
	const GO = 0.6, LAND = GO + 2 * SPB
	bodyScene('share', s, (g, u, t) => {
		appWindow(g, {
			land: inv(0, 0.35, u),
			push: 1 + 0.03 * ease.inOutCubic(inv(0.4, D, u)),
			about: [CONTENT_X + 376, WINDOW.row1 + 250],
			drawUI: (win, geom) => shareUI(win, geom, {
				go: ease.brand(inv(GO, GO + 0.7, u)),
				land: ease.brand(inv(LAND, LAND + 0.7, u)),
				ring: ease.brand(inv(LAND + 0.75, LAND + 0.95, u)),
			}),
		})
		appMark(g, APP)
		captionAt(g, c.text, t, c.up, c.out)
	})
	const t0 = s.start
	cue(t0 + GO, 'whoosh', { dur: 0.5, from: 600, to: 2400, panFrom: -0.5, panTo: 0, gain: 0.08 })
	cue(t0 + LAND, 'whoosh', { dur: 0.5, from: 800, to: 2800, panFrom: 0, panTo: 0.5, gain: 0.08 })
	cue(t0 + LAND + 0.75, 'pluck', { freq: 1174.66, gain: 0.2, pan: 0.5 })
}

/* ---------- 1 · promise, first (Round 15): the whole team, every case ---------- */
{
	const s = S_PROMISE
	const c = cap('promise', 'The whole team,\nevery case', s.start + RISE, s.end - 0.16)
	bodyScene('promise', s, (g, u, t) => {
		// The opening's field, fading out as the cluster lands on it: no cut from the opening.
		if (u < 0.8) { const hg = handoverGround(g); hg.setAttribute('opacity', (1 - ease.inOutCubic(inv(0, 0.8, u))).toFixed(3)) }
		const fg = el('g', {}, g)
		promiseFrame({ g: fg, W: 1920, H: 1080 }, { app: APP, promise: '', neighbours: ['portaliq', 'filinq'] })
		const kids = [...fg.childNodes].slice(1)
		const sc = u < 0.1 ? 0 : Math.min(1.08, spring(u - 0.1, { freq: 2.4, zeta: 0.6 }))
		const cx = 1450, cy = 480
		const body = el('g', { opacity: clamp((u - 0.1) / 0.2).toFixed(3), transform: `translate(${cx} ${cy}) scale(${(0.6 + 0.4 * sc).toFixed(4)}) translate(${-cx} ${-cy})` }, fg)
		for (const k of kids) body.appendChild(k)
		captionAt(g, c.text, t, c.up, c.out)
	})
	cue(s.start + 0.1, 'pluck', { freq: 1174.66, gain: 0.24, pan: 0.3 })
	cue(s.start + 0.12, 'impact', { gain: 0.35, from: 80, to: 36, decay: 0.8 })
}

/* ---------- the closing pieces: Built on Nextcloud, then the install board ---------- */
const T_BUILT = OPEN + BODY
film.scene('builtOn', T_BUILT, T_BUILT + BUILT, (ctx) => builtOnScene(ctx, { app: APP, apps: ['filinq'], on: 'nextcloud' }))
film.scene('install', T_BUILT + BUILT, DURATION, (ctx) => installScene(ctx, {}), { post: 0.001 })

/** The bed, in D: silent under the opening, pad from the body, kick and hats under the proofs, thinning for the closing, resolving on D. */
film.music = {
	bars: 22,
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62],
		[50, 54, 61, 64], // 3 Dmaj9: the backlog
		[47, 54, 57, 61], // 4 Bm9: documents
		[47, 50, 54, 57], // 5 Gmaj9: edited in the case
		[49, 52, 57, 59], // 6 A add9: knowledge
		[47, 50, 54, 57], // 7 Gmaj9: the answers
		[49, 52, 54, 57], // 8 F#m7: standards
		[47, 50, 54, 61], // 9 Bm add9: three boxes
		[47, 50, 54, 59], // 10 Gmaj7: automate
		[50, 54, 55, 59], // 11 Em9: the step runs itself
		[47, 50, 54, 57], // 12 Gmaj9: share
		[49, 52, 57, 59], // 13 A add9: landing at the other council
		[47, 50, 54, 59], // 14 Gmaj7: the promise
		[50, 52, 57, 59], // 15 A sus4 add9
		[50, 54, 61, 64], // 16 Dmaj9: built on
		[47, 54, 57, 61], // 17 Bm9
		[47, 50, 54, 57], // 18 Gmaj9: install the app
		[49, 52, 57, 59], // 19 A add9
		[47, 50, 54, 57], // 20 Gmaj9
		[50, 54, 57, 62], // 21 D
	],
	bass: [38, 38, 38, 38, 35, 43, 45, 43, 42, 35, 43, 40, 43, 45, 43, 45, 38, 35, 43, 45, 43, 38],
	parts: { pad: [[3, 22]], bass: [[4, 21]], kick: [[4, 15]], hat: [[5, 15]], clap: [[6, 14]] },
	loop: false,
}

film.board = { film: 'dossiq-casework', meta: { title: 'Dossiq, municipal casework' } }
window.__dossiq = { captions: CAPTIONS, slots: P.map(({ slot, index, start, end }) => ({ slot, index, start, end })), OPEN, BODY, BUILT, INSTALL, DURATION }
if (q.has('dump')) console.log(JSON.stringify(window.__dossiq))
film.start()
