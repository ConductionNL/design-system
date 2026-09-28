/**
 * The Keepiq film (Round 23: the portfolio animation pass; storyboard keepiq/boards/dev-teams, Round 25b
 * ownership story). 1920 x 1080, 24 fps, 20 bars at 128 BPM, 37.5 s. The sister of the Thematiq film:
 * the same one-take honeycomb, the same word-art language, the same current.
 *
 *   0 to 5.63 s       the shared Conduction opening, handing over on its field
 *   5.63 to 24.38 s   the body, ONE take (tkfilm/lib.js):
 *                     story 1, word art on the opening's field: "The key to" "your own house?", a white
 *                       house-cell with its lock popping into the field as "key" lands, "own" in orange;
 *                     story 2: the lock lifts out of the house (the cell left as a dashed outline) and
 *                       travels up and out of the honeycomb into a plain outside box that pops in to take
 *                       it: "Kept by someone else's app?";
 *                     the answer: a current runs from the box back down to the house, the lock comes home
 *                       and the cell turns into Keepiq's own; the push INTO it: the request, the fill-in
 *                       link powered on, the current carrying it out to the partner's box, the masked
 *                       value typing itself in there and running back into the vault;
 *                     a fly to the next cell: a link that vanishes after one view, the recipient's card
 *                       opening once and then breaking into small hexes that step off;
 *                     a fly to the usage dashboard: the day bars growing, the uses rippling in, the
 *                       newest (by an app) powered on;
 *                     the pull back: the house cell turns orange exactly where Built on's lead lands,
 *                       a hard cut on the bar;
 *   24.38 to 31.88 s  the shared Built on Nextcloud piece (closing.js, 4 bars)
 *   31.88 to 37.5 s   the shared install board (closing.js, 3 bars)
 *
 * No competitor is named: someone else's app is a plain outside box. Accents are clicks; the current sounds
 * as charge, crackle, arc and click. No bell.
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene } from '../_lib/scenes/closing.js'
import { TYPE, layout, fitCaptionSize, use } from '../_lib/ui.js'
import { bezier } from '../_lib/core.js'
import { rest, take, glue, glueAttr } from '../connext/lib/camera.js'
import { caption } from '../connext/lib/type.js'
import { partnerRequestUI, onceLinkUI, usageContent, outsideBox } from './boards/dev-teams/board.js'
import {
	C, el, textBlock, ease, inv, clamp, lerp, mix, spring, hexPath, pop, F, R, ROUND, cellXY, toScreen,
	CAM_HO, HO_RATE, camOn, drawField, drawFar, drawNear, screenIn, drawScreen, windowTag, current, flip, flipIn, flipTf, FLIP,
} from '../tkfilm/lib.js'

const APP = 'keepiq'
const BPM = 128
const SPB = 60 / BPM
const BAR = 4 * SPB
const S16 = SPB / 4
const OPEN = 3 * BAR
const BODY = 10 * BAR
const T_BUILT = OPEN + BODY
const BUILT = 4 * BAR
const INSTALL = 3 * BAR
const DURATION = T_BUILT + BUILT + INSTALL
const EXIT = F(4)
const B = (beat) => OPEN + beat * SPB

const q = new URLSearchParams(location.search)
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: DURATION, bpm: BPM, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
const bodyAt = addOpening(film, { at: 0 })
if (Math.abs(bodyAt - OPEN) > 1e-6) console.error(`opening ends at ${bodyAt}, expected ${OPEN}`)
const cue = (t, kind, o = {}) => film.cue(t, kind, o)

/* ============================================================ the world */

const CELL = { house: [4, 0], once: [5, 0], usage: [4, 1] }
const XY = Object.fromEntries(Object.entries(CELL).map(([k, v]) => [k, cellXY(...v)]))
const SC = { request: screenIn(...CELL.house), once: screenIn(...CELL.once) }
/** The usage dashboard in its cell: general-scene local coordinates (x 120 to 780, y 640 to 1240) at 0.2 world units each. */
const UI0 = layout(1920, 1080).ui
const US = 0.2
const U_AT = [XY.usage[0] - 70, XY.usage[1] - 62] // world point of local (120, 640)
const U_KEY = camOn(U_AT[0], U_AT[1], UI0.x, UI0.y, 1.25 / US)
/** The outside box, in world units (story 2): top right of the story's framing, outside the lattice's lit cells. */
const BOX = (() => {
	// the storyboard's box, top right, placed so that after the handover camera's slow push it sits near (1420, 150)
	const z = CAM_HO.z
	const x = (1360 - CAM_HO.px) / z, y = (200 - CAM_HO.py) / z
	return { x, y, w: 320 / z, h: 250 / z }
})()

const T = {
	mark: OPEN + F(3),
	w1: [B(0.5), B(0.5) + S16, B(0.5) + 2 * S16], // "The key to"
	house: B(0.5) + S16, // the house cell with its lock, as "key" lands
	w2: [B(1.5), B(1.5) + S16, B(1.5) + 2 * S16], // "your own house?" (all up with its 2.4 s reading hold)
	s1Out: B(8.6),
	lift: [B(8.6), B(9.4)], // the lock leaves the house for the box
	box: B(8.8),
	w3: [B(9.3), B(9.3) + S16], // "Kept by"
	w4: [B(10.2), B(10.2) + S16, B(10.2) + 2 * S16], // "someone else's app?" (all up with its 2 s hold)
	ret: [B(14.4), B(15.2)], // Round 26: the lock flies back out of the box into its house (the story's own element carries the hand-off)
	home: B(15.2), // the lock comes home; the cell turns into Keepiq's
	s2Out: B(15.6),
	push: [B(15.45), B(16.3)],
	// scene 3, the request (13.125 to 16.875)
	tag3: B(16.2),
	ticks: [B(16.6), B(16.6) + S16],
	link: [B(17), B(17.8)],
	ring3: B(17.8),
	out: [B(18.1), B(18.9)], // the current out to the partner with the link
	fill: [B(19), B(20.2)], // the partner types the value
	back: [B(20.4), B(21.3)], // the value back into the vault
	stored: B(21.3),
	// scene 4, the one-time link
	// Round 26 whip-pan: a seven-frame snap to the next cell (render --blur 4)
	whip: [B(23.6), B(23.6) + F(7)],
	tag4: B(24),
	views: B(24.9),
	link4: [B(25.3), B(26)],
	open: B(26.4),
	burn: [B(28.2), B(29.2)],
	// scene 5, every use
	// Round 27c: the pull back from the link, a wave of cells turning over on the grid toward the dashboard, the push in
	out: [B(30.7), B(31.4)],
	wave: [B(30.9), B(31.9)],
	in: [B(31.5), B(32.4)],
	bars: [B(32.4), B(33.4)],
	rows: B(33.5),
	cur5: [B(34.4), B(35.1)],
	ring5: B(35.1),
	pull: [B(38.3), B(39.9)], // after the last caption and the mark have left: nothing crosses the words
	capOut: B(38.1),
	appOn: B(38.9),
}

/* ============================================================ the camera */

const END = camOn(...XY.house, 1330, 236, 118 / 150)
const PUSH = bezier(0.62, 0, 0.12, 1)
const MID = camOn(...XY.once.map((v, i) => (v + XY.usage[i]) / 2), 1300, 560, 1.15)
const camera = take([
	rest(CAM_HO, OPEN, { k: HO_RATE, pivot: [960, 540] }),
	rest(SC.request.key, T.push[1], { k: 0.006, pivot: [1300, 520] }),
	rest(SC.once.key, T.whip[1], { k: 0.006, pivot: [1300, 520] }),
	rest(MID, T.out[1], { k: 0.02, pivot: [1300, 560] }),
	rest(U_KEY, T.in[1], { k: 0.008, pivot: [1300, 560] }),
	rest(END, T.pull[1], { k: -0.01, pivot: [1330, 400] }),
], [
	{ from: T.push[0], to: T.push[1], ease: PUSH, blend: 'pivot' },
	{ from: T.whip[0], to: T.whip[1], ease: ease.snap, blend: 'pivot' },
	{ from: T.out[0], to: T.out[1], ease: ease.brand, blend: 'pivot' },
	{ from: T.in[0], to: T.in[1], ease: PUSH, blend: 'pivot' },
	{ from: T.pull[0], to: T.pull[1], ease: ease.brand, blend: 'pivot' },
])

/* ============================================================ pieces */

const scaled = (g, x, y, s) => el('g', Math.abs(s - 1) > 1e-4 ? { transform: `translate(${x} ${y}) scale(${Math.max(s, 0.0001).toFixed(4)}) translate(${-x} ${-y})` } : {}, g)
function lockGlyph(g, x, y, size, color) {
	el('use', { href: '#g-keepiq', x: x - size / 2, y: y - size / 2, width: size, height: size, color }, g)
}
/** The house cell: white with the lock (story), a dashed outline when the lock has left, Keepiq's own cobalt cell once it is home. */
function houseCell(g, x, y, t) {
	if (t < T.house) return
	// Round 27: it turns over from the ghost field (back face) into the white house with its lock
	const f = flip(t, T.house)
	if (!f.front) return el('path', { d: hexPath(x, y, R, ROUND), fill: C.cobalt600 }, el('g', flipTf(x, y, f.sx), g))
	const hg = el('g', flipTf(x, y, f.sx), g)
	const gone = t >= T.lift[0] && t < T.home
	const home = t >= T.home
	if (gone) {
		el('path', { d: hexPath(x, y, R, ROUND), fill: 'none', stroke: C.cobalt300, 'stroke-width': 4, 'stroke-dasharray': '14 12' }, hg)
	} else if (home) {
		const drain = ease.inOutCubic(inv(T.push[0], T.push[0] + 0.55, t))
		// the lock comes home: the dashed cell turns over into Keepiq's own
		const fh = flip(t, T.home - FLIP / 2)
		const hh = el('g', flipTf(x, y, fh.sx), hg)
		if (!fh.front) return el('path', { d: hexPath(x, y, R, ROUND), fill: 'none', stroke: C.cobalt300, 'stroke-width': 4, 'stroke-dasharray': '14 12' }, hh)
		// Keepiq's own cell: cobalt with a white ring (the app tag's look), draining into the ground on the push
		if (drain < 1) el('path', { d: hexPath(x, y, R + 8, ROUND + 1), fill: mix(C.white, C.cobalt600, drain) }, hh)
		el('path', { d: hexPath(x, y, R, ROUND), fill: mix(C.cobalt, C.cobalt600, drain) }, hh)
		if (drain < 1) lockGlyph(hh, x, y, R * 0.84, mix(C.white, C.cobalt600, drain))
	} else {
		el('path', { d: hexPath(x, y, R, ROUND), fill: C.white }, hg)
		lockGlyph(hg, x, y, R * 0.84, C.cobalt)
	}
}
/** The lock in flight (story 2): from the house up into the box. */
function lockInFlight(g, t) {
	const back = t >= T.ret[0] && t < T.ret[1] + F(1)
	if (!back && (t < T.lift[0] || t >= T.lift[1] + F(2))) return
	const u = back ? 1 - ease.snap(inv(...T.ret, t)) : ease.snap(inv(...T.lift, t))
	const [hx, hy] = XY.house
	const bx = BOX.x + BOX.w / 2, by = BOX.y + BOX.h / 2 + 10
	const x = lerp(hx, bx, u), y = lerp(hy, by, u) - 60 * Math.sin(Math.PI * u)
	lockGlyph(g, x, y, lerp(R * 0.84, 90 / CAM_HO.z * 0.9, u), lerp(1, 0, 0) ? C.white : C.white)
}

const MOCK = { x: 310, top: 145, width: 987.5 }

/* ============================================================ the world scene */

const NEAR = [[1400, -800, 520], [2800, 200, 640], [500, 1000, 460], [3600, -800, 560]]

film.scene('world', OPEN, T_BUILT, (ctx) => {
	const layer = el('g', { 'data-layer': 'world' }, ctx.g)
	return (t) => {
		layer.replaceChildren()
		const cam = camera(t)
		drawFar(layer, cam, { alpha: 0.5 * clamp(1.4 - cam.z / 8, 0.25, 1) })
		const look = (qq, rr, info) => {
			const k = info.k
			if (k === CELL.house.join() && t >= T.house) return { draw: (g, x, y) => {
				if (t >= T.appOn) return glyphApp(g, x, y, t)
				houseCell(g, x, y, t)
				if (t >= T.push[0] && t < T.appOn + 0.2) {
					const inner = drawScreen(g, SC.request, (w, geom) => partnerRequestUI(w, geom, {
						ticks: (t >= T.ticks[0] ? 1 : 0) + (t >= T.ticks[1] ? 1 : 0),
						link: ease.outCubic(inv(...T.link, t)),
						ring: t < T.ring3 ? 0 : 1,
						wire: ease.inOutCubic(inv(...T.out, t)),
						fill: 8 * inv(...T.fill, t),
						back: t >= T.back[1] + 0.3 ? 0 : ease.inOutCubic(inv(...T.back, t)) || 0,
					}))
					windowTag(inner, APP, { sx: flipIn(t, T.tag3) })
					inner.setAttribute('opacity', ease.outCubic(inv(T.push[0], T.push[0] + 0.3, t)).toFixed(3))
				}
			} }
			if (k === CELL.once.join() && t >= T.whip[0] - 0.4) return { draw: (g, x, y) => {
				el('path', { d: hexPath(x, y, R, ROUND), fill: C.cobalt600 }, g)
				const inner = drawScreen(g, SC.once, (w, geom) => {
					const burnt = inv(...T.burn, t)
					// Round 27: after its one view the recipient's card turns over to nothing (width to zero), and the link is gone
					const cardSx = burnt <= 0 ? 1 : Math.max(0, Math.cos(Math.PI / 2 * ease.inCubic(clamp(burnt * 1.6))))
					onceLinkUI(w, geom, { views: t < T.views ? '' : '1', ring: t < T.views ? 0 : 1, link: ease.outCubic(inv(...T.link4, t)), open: ease.brand(inv(T.open, T.open + 0.35, t)), cardSx, burn: ease.outCubic(inv(T.burn[0] + 0.3, T.burn[1], t)) })
				})
				windowTag(inner, APP, { sx: flipIn(t, T.tag4) })
			} }
			if (k === CELL.usage.join() && t >= T.wave[1]) return { draw: (g, x, y) => {
				el('path', { d: hexPath(x, y, R, ROUND), fill: C.cobalt600 }, g)
				const ug = el('g', { transform: `translate(${U_AT[0]} ${U_AT[1]}) scale(${US}) translate(-120 -640)` }, g)
				usageContent(ug, { bars: ease.outCubic(inv(...T.bars, t)), rows: clamp((t - T.rows) / S16 + 1, 0, 5), ring: t < T.ring5 ? 0 : 1, tag: flipIn(t, T.bars[0]) })
				// the current into the newest use, from the day bars' today (local coords)
				current(ug, [[800, 720], [800, 934], [794, 934]], ease.inOutCubic(inv(...T.cur5, t)), { w: 5, spark: 11 })
			} }
			// Round 27c: once to usage is a wave of cells turning over on the grid itself, from the link's cell to the dashboard's
			if (t >= T.wave[0] && t < T.wave[1] + FLIP * 2) {
				const [ox, oy] = XY.once, [ux, uy] = XY.usage
				const [wx, wy] = cellXY(qq, rr)
				const dx = ux - ox, dy = uy - oy, L = Math.hypot(dx, dy)
				const along = ((wx - ox) * dx + (wy - oy) * dy) / (L * L) // 0 at the link's cell, 1 at the dashboard's
				const across = Math.abs((wx - ox) * dy - (wy - oy) * dx) / L
				if (along > -1.2 && along < 2.2 && across < 700) {
					const t0 = lerp(T.wave[0], T.wave[1] - FLIP * 2, clamp((along + 1.2) / 3.4))
					if (t >= t0 && t < t0 + FLIP * 2) return { draw: (g, x, y) => {
						const f = flip(t, t0, FLIP * 2)
						// the back is the ghost; the face that passes is cobalt-200, and it turns back into the ghost
						const face = f.u < 0.5 ? (f.u < 0.25 ? C.cobalt600 : C.cobalt200) : (f.u < 0.75 ? C.cobalt200 : C.cobalt600)
						el('path', { d: hexPath(x, y, R, ROUND), fill: face }, el('g', flipTf(x, y, f.sx), g))
					} }
				}
			}
			return undefined
		}
		const wg = drawField(layer, cam, look)
		// story 2: the box, the lock in flight, the current home
		if (t >= T.box && t < T.home + 0.4) {
			const s = t < T.home + 0.1 ? pop(t - T.box, { freq: 2.8, zeta: 0.55 }) : 1 - ease.inCubic(inv(T.home + 0.1, T.home + 0.35, t))
			const bg = el('g', { transform: `translate(${BOX.x} ${BOX.y}) scale(${(1 / CAM_HO.z).toFixed(4)})` }, wg)
			outsideBox(bg, 0, 0, 320, 250, { s, lock: t >= T.lift[1] && t < T.ret[0] })
		}
		lockInFlight(wg, t)
		const fade = (a) => 1 - inv(a, a + 0.3, t)
		const wire = (pts, span, o) => { const f = fade(span[1] + 0.05); if (f <= 0) return; const cg = el('g', { opacity: f.toFixed(3) }, wg); current(cg, pts, ease.inOutCubic(inv(...span, t)), o) }
		drawNear(layer, cam, NEAR, { alpha: 0.07 * clamp((2.2 - cam.z) / 1.2) })
	}
}, { post: 0.001 })

/** The end: the house cell is Keepiq's, in orange, on Built on's lead. */
function glyphApp(g, x, y, t) {
	// Round 27: Keepiq's cell turns over into orange on Built on's lead
	const f = flip(t, T.appOn)
	const hg = el('g', flipTf(x, y, f.sx), g)
	if (!f.front) return el('path', { d: hexPath(x, y, R, ROUND), fill: C.cobalt600 }, hg)
	el('path', { d: hexPath(x, y, R, ROUND), fill: C.orange }, hg)
	lockGlyph(hg, x, y, R * 0.84, C.white)
}

/* ============================================================ the words */

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
const artOut = (g, t, t0) => {
	if (t < t0) return
	const p = inv(t0, t0 + EXIT, t)
	g.setAttribute('transform', `translate(0 ${(-90 * p * p).toFixed(1)})`)
	g.setAttribute('opacity', (1 - p).toFixed(3))
}

// Round 27c: the mark is a SECTION TITLE, never the app name (it lives in the lead cell); off for each transition
;[['Ownership', T.mark, T.s2Out], ['Requests', B(16) + F(6), B(23.3)], ['One-time links', B(24.5), B(30.6)], ['Usage', B(32.5), T.capOut]].forEach(([title, rise, leave], i) => {
	film.scene(`t-mark-${i}`, rise - F(1), leave + EXIT, (ctx) => {
		const c = caption(ctx.g, { text: title, size: 58, y: TYPE.markY + 54, lineHeight: 1, fill: C.white }, { rise, leave, camera })
		return (t) => c.set(t)
	})
})

film.scene('t-story1', OPEN, T.s1Out + EXIT + F(1), (ctx) => {
	const g = el('g', {}, ctx.g)
	const a = textBlock(g, 'The key to', { x: 120, y: 580, size: 140, weight: 700, fill: C.white, tracking: -0.03, clip: false })
	const b = textBlock(g, 'your *own* house?', { x: 120, y: 820, size: 170, weight: 700, fill: C.white, accent: C.orange, tracking: -0.03, clip: false })
	return (t) => {
		slamItems(a.items, T.w1, t)
		slamItems(b.items, T.w2, t, { from: 1.7 })
		artOut(g, t, T.s1Out)
	}
})
film.scene('t-story2', T.w3[0] - F(1), T.s2Out + EXIT + F(1), (ctx) => {
	const g = el('g', {}, ctx.g)
	const a = textBlock(g, 'Kept by', { x: 120, y: 600, size: 150, weight: 700, fill: C.white, tracking: -0.03, clip: false })
	const b = textBlock(g, '*someone* *else\'s* app?', { x: 120, y: 860, size: 160, weight: 700, fill: C.white, accent: C.orange, tracking: -0.03, clip: false })
	return (t) => {
		slamItems(a.items, T.w3, t)
		slamItems(b.items, T.w4, t, { from: 1.7 })
		artOut(g, t, T.s2Out)
	}
})

const CAPS = [
	['request', 'Request passwords\nfrom partners', B(16) + F(6), B(23.3)],
	['once', 'Links that vanish\nafter one view', B(24.5), B(30.6)],
	['usage', 'Every use: who,\nwhen, where, why', B(32.5), T.capOut],
]
for (const [id, text, rise, leave] of CAPS) {
	film.scene(`t-${id}`, rise - F(1), leave + EXIT, (ctx) => {
		const c = caption(ctx.g, { text, size: fitCaptionSize(text), y: TYPE.y1, lineHeight: TYPE.lh / TYPE.size, fill: C.white }, { rise, leave, camera })
		return (t) => c.set(t)
	})
}

/* ============================================================ sound */

// story 1
T.w1.forEach((t, i) => cue(t, i === 1 ? 'kick' : 'tick', i === 1 ? { gain: 0.26, pitch: 110, end: 48, decay: 0.2, click: 0.08 } : { freq: [1318.51, 0, 1479.98][i], gain: 0.13 }))
cue(T.house, 'pluck', { freq: 587.33, gain: 0.24, pan: 0.5 })
cue(T.house + 0.02, 'impact', { gain: 0.3, from: 80, to: 36, decay: 0.7 })
cue(T.w2[0], 'tick', { freq: 1567.98, gain: 0.13 })
cue(T.w2[1], 'click', { gain: 0.3, freq: 2400, seed: 121, dry: true })
cue(T.w2[2], 'tick', { freq: 1760, gain: 0.13 })
// story 2
cue(T.lift[0], 'whoosh', { dur: T.lift[1] - T.lift[0] + 0.1, from: 600, to: 3600, panFrom: 0.4, panTo: 0.7, gain: 0.16 })
cue(T.box, 'kick', { gain: 0.2, pitch: 90, end: 44, decay: 0.24, click: 0.05 })
cue(T.lift[1], 'click', { gain: 0.26, freq: 2000, seed: 122, dry: true, pan: 0.6 })
cue(T.w3[0], 'tick', { freq: 1174.66, gain: 0.13 })
cue(T.w3[1], 'tick', { freq: 1318.51, gain: 0.13 })
cue(T.w4[0], 'impact', { gain: 0.36, from: 90, to: 34, decay: 0.9 })
cue(T.w4[2], 'click', { gain: 0.24, freq: 2500, seed: 123, dry: true })
// the lock comes home: a whoosh down out of the box, a thud and a click as it lands
cue(T.ret[0], 'whoosh', { dur: T.ret[1] - T.ret[0] + 0.1, from: 3600, to: 600, panFrom: 0.7, panTo: 0.4, gain: 0.16 })
cue(T.home, 'kick', { gain: 0.24, pitch: 100, end: 45, decay: 0.22, click: 0.06 })
cue(T.home, 'click', { gain: 0.32, freq: 2800, seed: 124, dry: true, pan: 0.5 })
cue(T.push[0] - 0.05, 'whoosh', { dur: 0.9, from: 400, to: 4800, panFrom: 0.4, panTo: 0, gain: 0.24 })
// scene 3
cue(T.tag3, 'pluck', { freq: 587.33, gain: 0.2, pan: 0.2 })
T.ticks.forEach((t, i) => cue(t, 'tick', { freq: [1318.51, 1479.98][i], gain: 0.12, pan: 0.4 }))
for (let i = 0; i < 6; i++) cue(lerp(...T.link, i / 6), 'tick', { freq: 2637, gain: 0.05, decay: 0.03, pan: 0.3 })
cue(T.ring3, 'click', { gain: 0.3, freq: 2700, seed: 125, dry: true, pan: 0.3 })
cue(T.out[0], 'crackle', { dur: T.out[1] - T.out[0], density: 60, gain: 0.06, pan: -0.1 })
cue(T.out[1], 'arc', { gain: 0.1, pan: -0.2 })
cue(T.out[1], 'click', { gain: 0.22, freq: 2900, seed: 126, dry: true, pan: -0.2 })
for (let i = 0; i < 8; i++) cue(lerp(...T.fill, i / 8), 'tick', { freq: 2349.32, gain: 0.05, decay: 0.03, pan: -0.3 })
cue(T.back[0], 'crackle', { dur: T.back[1] - T.back[0], density: 55, gain: 0.06, pan: 0.2 })
cue(T.stored, 'click', { gain: 0.3, freq: 2600, seed: 127, dry: true, pan: 0.4 })
cue(T.stored + 0.03, 'pluck', { freq: 880, gain: 0.2, pan: 0.4 })
// scene 4
cue(T.whip[0] - 0.04, 'whoosh', { dur: 0.36, from: 1200, to: 7000, panFrom: -0.8, panTo: 0.8, gain: 0.26 })
cue(T.whip[1], 'click', { gain: 0.3, freq: 2400, seed: 128, dry: true, pan: 0.5 })
cue(T.tag4, 'pluck', { freq: 659.26, gain: 0.18, pan: 0.2 })
cue(T.views, 'arc', { gain: 0.1, pan: 0.1 })
cue(T.views, 'click', { gain: 0.32, freq: 2600, seed: 129, dry: true, pan: 0.1 })
cue(T.open, 'pluck', { freq: 1174.66, gain: 0.2, pan: 0.6 })
cue(T.burn[0], 'whoosh', { dur: 0.4, from: 5200, to: 900, panFrom: 0.6, panTo: 0.4, gain: 0.1, q: 2.5 })
cue(T.burn[0] + 0.3, 'click', { gain: 0.24, freq: 2000, seed: 51, dry: true, pan: 0.6 })
// scene 5
cue(T.out[0], 'whoosh', { dur: 0.7, from: 3000, to: 500, panFrom: 0.4, panTo: 0, gain: 0.16 })
for (let i = 0; i < 8; i++) cue(lerp(T.wave[0], T.wave[1] - FLIP, i / 8), 'click', { gain: 0.1, freq: 2200 + i * 90, seed: 60 + i, dry: true, pan: 0.6 - i * 0.15 })
cue(T.in[0], 'whoosh', { dur: 0.9, from: 400, to: 4600, panFrom: -0.2, panTo: 0.3, gain: 0.2 })
for (let i = 0; i < 6; i++) cue(lerp(...T.bars, i / 6), 'tick', { freq: 1174.66 * Math.pow(2, i / 12 * 2), gain: 0.07, pan: 0.3 })
for (let i = 0; i < 5; i++) cue(T.rows + i * S16, 'tick', { freq: [1318.51, 1479.98, 1567.98, 1760, 1975.53][i], gain: 0.09, pan: 0.2 })
cue(T.cur5[0], 'crackle', { dur: T.cur5[1] - T.cur5[0], density: 55, gain: 0.06, pan: 0.4 })
cue(T.ring5, 'arc', { gain: 0.1, pan: 0.3 })
cue(T.ring5, 'click', { gain: 0.3, freq: 2800, seed: 130, dry: true, pan: 0.3 })
cue(T.pull[0] - 0.05, 'whoosh', { dur: 1.1, from: 3200, to: 300, panFrom: 0.3, panTo: -0.2, gain: 0.2 })
cue(T.appOn, 'pluck', { freq: 587.33, gain: 0.24, pan: 0.4 })
cue(T.appOn, 'click', { gain: 0.26, freq: 2800, seed: 131, dry: true, pan: 0.4 })

/* ============================================================ the closing pieces */
film.scene('builtOn', T_BUILT, T_BUILT + BUILT, (ctx) => builtOnScene(ctx, { app: APP, apps: ['integriq'], on: 'nextcloud' }))
film.scene('install', T_BUILT + BUILT, DURATION, (ctx) => installScene(ctx, {}), { post: 0.001 })

/** The bed, in B minor then D: silent under the opening, pad from the story, the kick from the request, resolving on D. */
film.music = {
	bars: 20,
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62], // 0-2 the opening
		[47, 54, 57, 61], // 3 Bm9: the key to
		[47, 50, 54, 57], // 4 Gmaj9: your own house?
		[45, 52, 57, 59], // 5 A sus: kept by
		[42, 49, 54, 57], // 6 F#m7: someone else's app?
		[50, 54, 61, 64], // 7 Dmaj9: the key comes home, the request
		[47, 50, 54, 57], // 8 Gmaj9: the partner fills it in
		[49, 52, 57, 59], // 9 A add9: one view
		[47, 50, 54, 61], // 10 Bm add9: gone
		[47, 50, 54, 59], // 11 Gmaj7: every use
		[49, 52, 57, 59], // 12 A add9: the pull back
		[50, 54, 61, 64], // 13 Dmaj9: built on
		[47, 54, 57, 61], // 14 Bm9
		[47, 50, 54, 57], // 15 Gmaj9
		[49, 52, 57, 59], // 16 A add9: enhanced by Conduction
		[47, 50, 54, 57], // 17 Gmaj9: install it
		[49, 52, 57, 59], // 18 A add9
		[50, 54, 57, 62], // 19 D: own it
	],
	bass: [38, 38, 38, 35, 43, 45, 42, 38, 43, 45, 35, 43, 45, 38, 35, 43, 45, 43, 45, 38],
	parts: { pad: [[3, 20]], bass: [[4, 19]], kick: [[7, 13]], hat: [[7, 13]], clap: [[9, 12]] },
	loop: false,
}

film.board = { film: 'keepiq', meta: { title: 'Keepiq' } }
window.__keepiq = { T, OPEN, BODY, BUILT, INSTALL, DURATION, CELL }
if (q.has('dump')) console.log(JSON.stringify(window.__keepiq))
film.start()
