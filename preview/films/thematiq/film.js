/**
 * The Thematiq film (Round 23: the portfolio animation pass; storyboard thematiq/boards/government,
 * Round 22 story order). 1920 x 1080, 24 fps, 20 bars at 128 BPM, 37.5 s.
 *
 *   0 to 5.63 s       the shared Conduction opening, handing over on its field
 *   5.63 to 24.38 s   the body, ONE take through ONE honeycomb grid (tkfilm/lib.js; Round 28c: no second grid,
 *                     no parallax layer, the camera moves the one solid grid):
 *                     story (Round 28b), word art under "Ownership is a style": "You pick your car's colour",
 *                       "You choose your clothing", a cell turning over into a brand tone with each; the camera
 *                       slides right and a third cell turns over into stock Nextcloud blue as "Why not design your
 *                       workspace?" lands in orange (a match cut on the grid);
 *                     the push INTO that cell: its blue drains to the ground and the real token editor is inside it
 *                       (the core, scene 3): the rows ripple in, the first swatch turns to the house colour, and a
 *                       stepped hex wipe repaints the whole workspace from Nextcloud blue into the house style;
 *                     a zoom-through the swatch into the store's template card of the same green;
 *                     a whip-pan to the NL Design System screen: the set list steps, the upload, the imported set;
 *                     the pull back: the three screens in their cells and the Thematiq cell turning over into
 *                       orange exactly where Built on's lead flips in, a hard cut on the bar;
 *   24.38 to 31.88 s  the shared Built on Nextcloud piece (closing.js, 4 bars)
 *   31.88 to 37.5 s   the shared install board (closing.js, 3 bars)
 *
 * Every frame is a pure function of time. Sound cues sit next to the motion that causes them; accents are
 * clicks (dry where they must stay a click). Round 28: no current anywhere, no wire, no electric sound. No bell.
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { FONTS } from '../_lib/brand.js'
import { loadBrandAssets, MARK_BOX } from '../_lib/assets.js'
import { addOpening } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene } from '../_lib/scenes/closing.js'
import { TYPE, fitCaptionSize } from '../_lib/ui.js'
import { bezier } from '../_lib/core.js'
import { rest, take, glue, glueAttr } from '../connext/lib/camera.js'
import { caption } from '../connext/lib/type.js'
import { repaint } from './ui.js'
import { tokensUI, storeUI, nldesignUI } from './boards/government/board.js'
import {
	C, el, textBlock, ease, inv, clamp, lerp, mix, spring, hexPath, pop, F, R, ROUND, cellXY, toScreen, worldTf,
	CAM_HO, HO_RATE, camOn, drawField, screenIn, drawScreen, windowTag, flip, flipIn, flipTf, FLIP,
} from '../tkfilm/lib.js'

const APP = 'thematiq'
const BPM = 128
const SPB = 60 / BPM
const BAR = 4 * SPB
const S16 = SPB / 4
const OPEN = 3 * BAR
const BODY = 10 * BAR
const T_BUILT = OPEN + BODY // 24.375
const BUILT = 4 * BAR
const INSTALL = 3 * BAR
const DURATION = T_BUILT + BUILT + INSTALL // 37.5
const RISE = F(4)
const EXIT = F(4)
/** Body time in beats from the start of the body (beat 0 = 5.625 s). */
const B = (beat) => OPEN + beat * SPB

const q = new URLSearchParams(location.search)
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: DURATION, bpm: BPM, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
const bodyAt = addOpening(film, { at: 0 })
if (Math.abs(bodyAt - OPEN) > 1e-6) console.error(`opening ends at ${bodyAt}, expected ${OPEN}`)
const cue = (t, kind, o = {}) => film.cue(t, kind, o)

/* ============================================================ the world and its cells */

// Round 27c: every hex is a cell of the grid. The three story cells turn over into the brand's own tones; the colours
// cell IS the workspace cell (it turns over into Nextcloud blue), the screens sit in the row under the Thematiq cell.
const CELL = {
	a: [5, -1], b: [4, 0], c: [4, 1], // story: car, clothing, the workspace (the board's STORY_CELLS)
	nc: [4, 1], // story 2 and scene 3: the third cell turned stock Nextcloud blue, then the token editor inside it
	store: [5, 1], // scene 4
	nld: [6, 1], // scene 5
	app: [5, 0], // the Thematiq cell, where Built on's lead lands
}
const FILLS = { a: C.cobalt300, b: C.cobalt200, c: C.white }
const XY = Object.fromEntries(Object.entries(CELL).map(([k, v]) => [k, cellXY(...v)]))
const SC = { tokens: screenIn(...CELL.nc), store: screenIn(...CELL.store), nld: screenIn(...CELL.nld) }

/* ============================================================ the timeline (film seconds) */

const T = {
	mark: OPEN + F(3),
	// Round 28b story 1: nine words, one every two frames, so the card is up with its full reading hold
	// (0.4 s a word, 3.6 s) before it leaves; a cell turns over as "colour" and as "clothing" land
	w1: Array.from({ length: 5 }, (_, i) => OPEN + F(2) + i * F(2)), // "You pick your car's colour"
	w2: Array.from({ length: 4 }, (_, i) => OPEN + F(12) + i * F(2)), // "You choose your clothing"
	cells: { a: OPEN + F(10), b: OPEN + F(18) },
	s1Out: OPEN + F(18) + 0.25 + 3.6, // 10.22 s
	// story 2: the question lands in orange and carries its own hold (5 words, 2 s)
	pan: [B(8.2), B(9.4)],
	nc: OPEN + F(18) + 0.25 + 3.6 + F(4), // the third cell turns over into stock Nextcloud blue as the question comes
	w3: Array.from({ length: 5 }, (_, i) => OPEN + F(18) + 0.25 + 3.6 + F(6) + i * F(2)), // "Why not design your workspace?"
	s2Out: OPEN + F(18) + 0.25 + 3.6 + F(6) + F(8) + 0.25 + 2.0, // 13.05 s
	push: [B(15.7), B(16.55)], // into the workspace cell
	// scene 3, tokens (13.125 to 16.875)
	tag3: B(16.5),
	rows: B(16.75),
	swatch: B(17.9),
	wipe: [B(18.5), B(20)],
	// scene 4, the store
	// Round 26 zoom-through: the push into the house-colour swatch until it fills the frame, the cut on the bar line into the
	// store's first template card (the same forest), and the pull out of it
	zin: [B(23), B(23.8)], // the push into the swatch; it fills the frame two frames before the bar line
	cut: B(24),
	zout: [B(24) + F(2), B(24.9)],
	tag4: B(24.9),
	cards: B(25),
	share: B(26.3),
	// scene 5, NL Design
	// Round 26 whip-pan: a six-frame snap to the next cell (render --blur 4)
	whip: [B(31.6), B(31.6) + F(7)],
	tag5: B(32.1),
	sel: B(32.5),
	name: [B(33.2), B(33.9)],
	file: [B(34), B(34.6)],
	upload: B(35),
	landed: B(35.5),
	pull: [B(38.3), B(39.9)], // after the last caption and the mark have left: nothing crosses the words
	capOut: B(38.1),
	appOn: B(38.9),
}

/* ============================================================ the camera */

const S2 = camOn(...XY.nc, 1620, 300, 1.0)
const END = camOn(...XY.app, 1482, 538, 92 / 150) // Round 27: where Built on's lead flips in (closing.js CONNECT.cam.start, radius 92)
const PUSH = bezier(0.62, 0, 0.12, 1)
/** Mock px inside a screen to world. */
const inScreen = (sc, mx, my) => [sc.at[0] + sc.s * mx, sc.at[1] + sc.s * my]
// the zoom-through: the token row's swatch (mock 1007.5 + 12, 327 + 14) and the store's first card swatch (mock 510 + 101, 241 + 30)
const SW_A = inScreen(SC.tokens, 1019.5, 341)
const SW_B = inScreen(SC.store, 611, 271)
const Z_A = camOn(...SW_A, 960, 540, 1700) // 1.7 x 2.0 world units of forest fill the frame
const Z_B = camOn(...SW_B, 960, 540, 380) // the card's 14.2 x 4.2 world units of forest fill it too
const WHIP_TO = { ...SC.nld.key }
const takeA = take([
	rest(CAM_HO, OPEN, { k: HO_RATE, pivot: [960, 540] }),
	rest(S2, T.pan[1], { k: 0.014, pivot: [1620, 300] }),
	rest(SC.tokens.key, T.push[1], { k: 0.006, pivot: [1300, 520] }),
	rest(Z_A, T.zin[1], { k: 0.2, pivot: [960, 540] }),
], [
	{ from: T.pan[0], to: T.pan[1], ease: ease.brand, blend: 'pivot' },
	{ from: T.push[0], to: T.push[1], ease: PUSH, blend: 'pivot' },
	{ from: T.zin[0], to: T.zin[1], ease: ease.inCubic, blend: 'pivot' },
])
const takeB = take([
	rest(Z_B, T.zout[0], { k: -0.2, pivot: [960, 540] }),
	rest(SC.store.key, T.zout[1], { k: 0.006, pivot: [1300, 520] }),
	rest(WHIP_TO, T.whip[1], { k: 0.006, pivot: [1300, 520] }),
	rest(END, T.pull[1], { k: -0.01, pivot: [1482, 538] }),
], [
	{ from: T.zout[0], to: T.zout[1], ease: ease.outCubic, blend: 'pivot' },
	{ from: T.whip[0], to: T.whip[1], ease: ease.snap, blend: 'pivot' },
	{ from: T.pull[0], to: T.pull[1], ease: ease.brand, blend: 'pivot' },
])
/** The one camera: take A to the bar line of the zoom-through, take B after it (the cut sits inside one colour). */
const camera = (t) => (t < T.cut ? takeA(t) : takeB(t))

/* ============================================================ cell looks */

/** A cell at the grid's size; sx is its width while it turns over (Round 27: hexes flip, never scale). */
const glyphCell = (g, wx, wy, fill, id, sx = 1, glyph = C.white) => {
	if (sx <= 0.001) return
	const t = el('g', flipTf(wx, wy, sx), g)
	el('path', { d: hexPath(wx, wy, R, ROUND), fill }, t)
	if (id === 'nextcloud') {
		const [bw, bh] = MARK_BOX['nextcloud-logo'], w = R * 1.12, h = (w * bh) / bw
		el('use', { href: '#nextcloud-logo', x: wx - w / 2, y: wy - h / 2, width: w, height: h, color: glyph }, t)
	} else if (id) {
		const sz = R * 0.84
		el('use', { href: `#g-${id}`, x: wx - sz / 2, y: wy - sz / 2, width: sz, height: sz, color: glyph }, t)
	}
}
/** A cell turning over from the ghost field into `front` at t0, and (if tBack) back into the ghost at tBack. */
function turnCell(g, x, y, t, t0, front, tBack = Infinity) {
	if (t < t0) return false
	const back = t >= tBack
	const f = back ? flip(t, tBack) : flip(t, t0)
	const showFront = back ? !f.front : f.front
	if (back && f.u >= 1) return false
	if (showFront) front(g, x, y, f.sx)
	else glyphCell(g, x, y, C.cobalt600, null, f.sx)
	return true
}

/** The token editor's state at film time t. */
function tokensState(t) {
	const sw = t < T.swatch ? C.nextcloud : C.forest
	return { sw0: sw, ring: t < T.swatch ? 0 : 1, dot: pop(t - T.swatch - 0.06) }
}
function storeState(t) {
	return { ring: t < T.share ? 0 : 1, pressed: t < T.share + 0.05 ? 0 : 1, stars: ease.outCubic(inv(T.cards + 0.3, T.cards + 1.0, t)) }
}
function nldState(t) {
	const steps = Math.floor(clamp((t - T.sel) / S16, 0, 3))
	return {
		sel: t < T.sel ? 0 : steps,
		name: ease.outCubic(inv(...T.name, t)),
		file: ease.outCubic(inv(...T.file, t)),
		ring: t < T.upload ? 0 : 1,
		landed: ease.brand(inv(T.landed, T.landed + 0.35, t)),
	}
}

/** Grid-cell ripple as overlays: each region steps 20%, 40%, full, one sixteenth apart. */
function ripple(g, regions, t0, t) {
	regions.forEach(([x, y, w, h], i) => {
		const s = t - (t0 + i * S16)
		const level = s < 0 ? 0 : s < F(1) ? 0.2 : s < F(2) ? 0.4 : 1
		if (level < 1) el('rect', { x, y, width: w, height: h, fill: C.white, 'fill-opacity': (1 - level).toFixed(2) }, g)
	})
}

/* mock-space geometry of the window content (windowMock: contentX 310, anchor row 205, right 1297.5) */
const GX = 310, GTOP = 145, GW = 1297.5 - 310
const TOKEN_ROWS = [0, 1, 2, 3, 4].map((i) => [GX + 4, GTOP + 155 + i * 82, GW - 8, 82])
const STORE_CARDS = (() => { const gx = GX + 200, cw = (GW - 250) / 2, ch = 244; return [0, 1, 2, 3].map((i) => [gx + (i % 2) * (cw + 20) - 2, GTOP + 96 + Math.floor(i / 2) * (ch + 18) - 2, cw + 4, ch + 4]) })()

/* ============================================================ the world scene */


film.scene('world', OPEN, T_BUILT, (ctx) => {
	const layer = el('g', { 'data-layer': 'world' }, ctx.g)
	return (t) => {
		layer.replaceChildren()
		const cam = camera(t)
		const look = (qq, rr, info) => {
			const k = info.k
			// the Thematiq cell at the end: it turns over into orange on Built on's lead (checked first: it is story cell b)
			if (k === CELL.app.join() && t >= T.appOn) return { draw: (g, x, y) => turnCell(g, x, y, t, T.appOn, (gg, xx, yy, sx) => glyphCell(gg, xx, yy, C.orange, APP, sx)) }
			// story 1: the three cells turn over into the brand's tones as their words land; a and b turn back on the way out
			if (k === CELL.a.join() && t >= T.cells.a && t < T.s1Out + FLIP) return { draw: (g, x, y) => turnCell(g, x, y, t, T.cells.a, (gg, xx, yy, sx) => glyphCell(gg, xx, yy, FILLS.a, null, sx), T.s1Out) }
			if (k === CELL.b.join() && t >= T.cells.b && t < T.s1Out + F(1) + FLIP) return { draw: (g, x, y) => turnCell(g, x, y, t, T.cells.b, (gg, xx, yy, sx) => glyphCell(gg, xx, yy, FILLS.b, null, sx), T.s1Out + F(1)) }
			// the workspace cell: stock Nextcloud blue, drained into the ground on the push, the token editor inside
			if (k === CELL.nc.join() && t >= T.nc) {
				const drain = ease.inOutCubic(inv(T.push[0], T.push[0] + 0.55, t))
				return { draw: (g, x, y) => {
					// the third cell turns over from the field into stock Nextcloud blue with the Nextcloud mark
					const f = flip(t, T.nc)
					if (!f.front) glyphCell(g, x, y, C.cobalt600, null, f.sx)
					else glyphCell(g, x, y, mix(C.nextcloud, C.cobalt600, drain), drain < 1 ? 'nextcloud' : null, f.sx, mix(C.white, C.cobalt600, drain))
					if (t >= T.push[0]) {
						const inner = drawScreen(g, SC.tokens, (w, geom) => {
							// the stepped hex wipe: the whole workspace repaints from Nextcloud blue into the house style
							const at = lerp(1900, -120, ease.inOutCubic(inv(...T.wipe, t)))
							repaint(w, geom, { mode: 'wipe', at, from: [C.nextcloud, C.cobalt50], to: [C.forest, C.forest300] })
							tokensUI(w, geom, tokensState(t))
							ripple(w, TOKEN_ROWS, T.rows, t)
						})
						windowTag(inner, APP, { sx: flipIn(t, T.tag3) })
						inner.setAttribute('opacity', ease.outCubic(inv(T.push[0], T.push[0] + 0.3, t)).toFixed(3))
					}
				} }
			}
			if (k === CELL.store.join() && t >= T.cut) return { draw: (g, x, y) => {
				glyphCell(g, x, y, C.cobalt600, null, 1)
				const inner = drawScreen(g, SC.store, (w, geom) => { storeUI(w, geom, storeState(t)); ripple(w, STORE_CARDS.slice(1), T.cards, t) /* your template card is there from the cut: its swatch is the match */ })
				windowTag(inner, APP, { sx: flipIn(t, T.tag4) })
			} }
			if (k === CELL.nld.join() && t >= T.cut) return { draw: (g, x, y) => {
				glyphCell(g, x, y, C.cobalt600, null, 1)
				const inner = drawScreen(g, SC.nld, (w, geom) => {
					nldesignUI(w, geom, nldState(t))
				})
				windowTag(inner, APP, { sx: flipIn(t, T.tag5) })
			} }
			return undefined
		}
		const wg = drawField(layer, cam, look, { solid: ease.inOutCubic(inv(OPEN, OPEN + 0.6, t)) }) // Round 28c: one clear, solid grid, no second layer
		// Round 26/27c: story 1 to story 2 is a match cut on the grid itself: the colours cell stays where it is while the camera
		// slides right, and turns over into Nextcloud's stock blue (the other two turn back into the field).
	}
}, { post: 0.001 })

/* ============================================================ the words */

/** Word art: a word slams in (scale from 1.5 about its own baseline, overshoot, settle) and fades up in two frames. */
function slamItems(items, times, t, { from = 1.5 } = {}) {
	items.forEach((it, i) => {
		const t0 = times[Math.min(i, times.length - 1)]
		const s = t - t0
		if (s < 0) { it.node.setAttribute('opacity', '0'); return }
		const k = s < F(2) ? s / F(2) : 1
		const sc = 1 + (from - 1) * (1 - spring(s, { freq: 3.4, zeta: 0.5 })) * (1 - inv(0.16, 0.25, s))
		const cx = it.x, cy = it.y
		it.node.setAttribute('opacity', k.toFixed(3))
		Math.abs(sc - 1) > 1e-4 ? it.node.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${sc.toFixed(4)}) translate(${-cx.toFixed(1)} ${-cy.toFixed(1)})`) : it.node.removeAttribute('transform')
	})
}
/** The masked-style exit of a word-art block: it slides up and out in four frames. */
const artOut = (g, t, t0) => {
	if (t < t0) return g.removeAttribute('transform') || g.removeAttribute('opacity')
	const p = inv(t0, t0 + EXIT, t)
	g.setAttribute('transform', `translate(0 ${(-90 * p * p).toFixed(1)})`)
	g.setAttribute('opacity', (1 - p).toFixed(3))
}

// the chapter mark, the whole body
// Round 27c: the mark is a SECTION TITLE, never the app name (it lives in the lead cell); off for each transition
;[['Ownership is a style', T.mark, T.s2Out], ['Design tokens', B(16.6), B(23)], ['Store', B(25), B(31.4)], ['NL Design System', B(32.5), T.capOut]].forEach(([title, rise, leave], i) => {
	film.scene(`t-mark-${i}`, rise - F(1), leave + EXIT, (ctx) => {
		const c = caption(ctx.g, { text: title, size: 58, y: TYPE.markY + 54, lineHeight: 1, fill: C.white }, { rise, leave, camera })
		return (t) => c.set(t)
	})
})

// story 1: "Your car," "your house," "your colours"
// Round 28b: "You pick your car's colour" / "You choose your clothing", then "Why not design your workspace?" in orange
film.scene('t-story1', OPEN, T.s1Out + EXIT + F(1), (ctx) => {
	const g = el('g', {}, ctx.g)
	const a = textBlock(g, "You pick your car's colour", { x: 120, y: 500, size: 100, weight: 700, fill: C.white, tracking: -0.03, clip: false })
	const b = textBlock(g, 'You choose your clothing', { x: 120, y: 640, size: 100, weight: 700, fill: C.white, tracking: -0.03, clip: false })
	return (t) => {
		slamItems(a.items, T.w1, t)
		slamItems(b.items, T.w2, t)
		artOut(g, t, T.s1Out)
	}
})
T.w1.forEach((t, i) => cue(t, i === 4 ? 'click' : 'tick', i === 4 ? { gain: 0.2, freq: 2600, seed: 101, dry: true } : { freq: 1318.51 + i * 80, gain: 0.1, decay: 0.04 }))
T.w2.forEach((t, i) => cue(t, i === 3 ? 'click' : 'tick', i === 3 ? { gain: 0.2, freq: 2700, seed: 102, dry: true } : { freq: 1479.98 + i * 80, gain: 0.1, decay: 0.04 }))
cue(T.cells.a, 'pluck', { freq: 587.33, gain: 0.2, pan: 0.5 })
cue(T.cells.b, 'pluck', { freq: 739.99, gain: 0.2, pan: 0.6 })

film.scene('t-story2', T.w3[0] - F(1), T.s2Out + EXIT + F(1), (ctx) => {
	const g = el('g', {}, ctx.g)
	const a = textBlock(g, 'Why not design', { x: 120, y: 620, size: 150, weight: 700, fill: C.orange, tracking: -0.03, clip: false })
	const b = textBlock(g, 'your workspace?', { x: 120, y: 790, size: 150, weight: 700, fill: C.orange, tracking: -0.03, clip: false })
	return (t) => {
		slamItems(a.items, T.w3.slice(0, 3), t, { from: 1.7 })
		slamItems(b.items, T.w3.slice(3), t, { from: 1.7 })
		artOut(g, t, T.s2Out)
	}
})
// the match cut: the colours cell turns over into stock blue with a dry click
cue(T.nc + FLIP / 2, 'click', { gain: 0.28, freq: 2600, seed: 107, dry: true, pan: 0.5 })
cue(T.nc + FLIP / 2, 'kick', { gain: 0.18, pitch: 100, end: 45, decay: 0.2, click: 0.05 })
cue(T.nc, 'click', { gain: 0.3, freq: 2800, seed: 104, dry: true, pan: 0.5 })
cue(T.pan[0], 'whoosh', { dur: 0.8, from: 500, to: 2600, panFrom: -0.3, panTo: 0.4, gain: 0.14 })
T.w3.slice(0, 4).forEach((t, i) => cue(t, 'tick', { freq: 1174.66 + i * 100, gain: 0.12 }))
cue(T.w3[4], 'impact', { gain: 0.4, from: 90, to: 34, decay: 0.9 })
cue(T.w3[4], 'click', { gain: 0.24, freq: 2500, seed: 105, dry: true })

// the push into the workspace cell
cue(T.push[0] - 0.4, 'riser', { dur: 0.5, gain: 0.1, root: 50 })
cue(T.push[0] - 0.05, 'whoosh', { dur: 0.9, from: 400, to: 4800, panFrom: 0.4, panTo: 0, gain: 0.24 })

/* ---------- the three captions of the screens ---------- */
const CAPS = [
	['tokens', 'Adjust 53\ndesign tokens', B(16.6), B(23)],
	['store', 'Share your templates\nin the store', B(25), B(31.4)],
	['nld', 'Bring your\nNL Design tokens', B(32.5), T.capOut],
]
for (const [id, text, rise, leave] of CAPS) {
	film.scene(`t-${id}`, rise - F(1), leave + EXIT, (ctx) => {
		const c = caption(ctx.g, { text, size: fitCaptionSize(text), y: TYPE.y1, lineHeight: TYPE.lh / TYPE.size, fill: C.white }, { rise, leave, camera })
		return (t) => c.set(t)
	})
}

// scene 3: rows, the swatch, the wipe
cue(T.tag3, 'pluck', { freq: 587.33, gain: 0.2, pan: 0.2 })
for (let i = 0; i < 5; i++) cue(T.rows + i * S16, 'tick', { freq: [1174.66, 1318.51, 1479.98, 1567.98, 1760][i], gain: 0.1, pan: 0.3 })
cue(T.swatch, 'click', { gain: 0.32, freq: 2700, seed: 106, dry: true, pan: 0.6 })
cue(T.swatch + 0.1, 'pluck', { freq: 1174.66, gain: 0.18, pan: 0.6 })
cue(T.wipe[0], 'whoosh', { dur: T.wipe[1] - T.wipe[0], from: 300, to: 3600, panFrom: -0.5, panTo: 0.7, gain: 0.18 })
for (let i = 0; i < 4; i++) cue(lerp(T.wipe[0], T.wipe[1], (i + 0.5) / 4), 'click', { gain: 0.14, freq: 2200 + i * 200, seed: 110 + i, dry: true, pan: -0.3 + i * 0.3 })
// scene 4
cue(T.zin[0], 'riser', { dur: T.zin[1] - T.zin[0], gain: 0.12, root: 50 })
cue(T.zin[1] - 0.3, 'whoosh', { dur: 0.45, from: 400, to: 6000, panFrom: 0, panTo: 0, gain: 0.2 })
cue(T.cut, 'impact', { gain: 0.4, from: 90, to: 36, decay: 0.8 })
cue(T.zout[0] + 0.05, 'whoosh', { dur: 0.8, from: 5000, to: 500, panFrom: 0, panTo: 0.3, gain: 0.14 })
cue(T.tag4, 'pluck', { freq: 659.26, gain: 0.18, pan: 0.2 })
for (let i = 0; i < 4; i++) cue(T.cards + i * S16, 'tick', { freq: [1318.51, 1479.98, 1760, 1975.53][i], gain: 0.1, pan: -0.2 + i * 0.2 })
cue(T.share, 'click', { gain: 0.34, freq: 2600, seed: 115, dry: true, pan: 0.2 })
cue(T.share + 0.05, 'pluck', { freq: 1318.51, gain: 0.2, pan: 0.2 })
// scene 5
cue(T.whip[0] - 0.04, 'whoosh', { dur: 0.36, from: 1200, to: 7000, panFrom: -0.8, panTo: 0.8, gain: 0.26 })
cue(T.whip[1], 'click', { gain: 0.3, freq: 2400, seed: 116, dry: true, pan: 0.5 })
cue(T.tag5, 'pluck', { freq: 739.99, gain: 0.18, pan: 0.2 })
for (let i = 1; i <= 3; i++) cue(T.sel + i * S16, 'tick', { freq: 1567.98 + i * 100, gain: 0.08, pan: -0.3 })
cue(T.file[0], 'whoosh', { dur: 0.5, from: 800, to: 2400, panFrom: 0.2, panTo: 0.5, gain: 0.06 })
cue(T.upload, 'click', { gain: 0.32, freq: 2600, seed: 117, dry: true, pan: 0.2 })
cue(T.landed, 'pluck', { freq: 880, gain: 0.2, pan: 0 })
// the pull back and the Thematiq cell
cue(T.pull[0] - 0.05, 'whoosh', { dur: 1.1, from: 3200, to: 300, panFrom: 0.3, panTo: -0.2, gain: 0.2 })
cue(T.appOn, 'pluck', { freq: 587.33, gain: 0.24, pan: 0.4 })
cue(T.appOn, 'click', { gain: 0.26, freq: 2800, seed: 118, dry: true, pan: 0.4 })

/* ============================================================ the closing pieces */
film.scene('builtOn', T_BUILT, T_BUILT + BUILT, (ctx) => builtOnScene(ctx, { app: APP, apps: [], on: 'nextcloud' }))
film.scene('install', T_BUILT + BUILT, DURATION, (ctx) => installScene(ctx, {}), { post: 0.001 })

/** The bed, in D, 20 bars: silent under the opening, pad from the story, the kick from the token editor, resolving on D. */
film.music = {
	bars: 20,
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62], // 0-2 the opening
		[50, 54, 61, 64], // 3 Dmaj9: your car, your house
		[47, 54, 57, 61], // 4 Bm9: your colours
		[47, 50, 54, 57], // 5 Gmaj9: your workspace
		[49, 52, 57, 59], // 6 A add9: not your style?
		[47, 50, 54, 57], // 7 Gmaj9: the token editor
		[49, 52, 54, 57], // 8 F#m7: the repaint
		[47, 50, 54, 61], // 9 Bm add9: the store
		[47, 50, 54, 59], // 10 Gmaj7: shared
		[50, 54, 55, 59], // 11 Em9: NL Design
		[49, 52, 57, 59], // 12 A add9: the pull back
		[50, 54, 61, 64], // 13 Dmaj9: built on
		[47, 54, 57, 61], // 14 Bm9
		[47, 50, 54, 57], // 15 Gmaj9
		[49, 52, 57, 59], // 16 A add9: enhanced by Conduction
		[47, 50, 54, 57], // 17 Gmaj9: install it
		[49, 52, 57, 59], // 18 A add9
		[50, 54, 57, 62], // 19 D: own it
	],
	bass: [38, 38, 38, 38, 35, 43, 45, 43, 42, 35, 43, 40, 45, 38, 35, 43, 45, 43, 45, 38],
	parts: { pad: [[3, 20]], bass: [[4, 19]], kick: [[7, 13]], hat: [[7, 13]], clap: [[9, 12]] },
	loop: false,
}

film.board = { film: 'thematiq', meta: { title: 'Thematiq' } }
window.__thematiq = { T, OPEN, BODY, BUILT, INSTALL, DURATION, CELL }
if (q.has('dump')) console.log(JSON.stringify(window.__thematiq))
film.start()
