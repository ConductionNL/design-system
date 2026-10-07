/**
 * The Keepiq film (Round 23: the portfolio animation pass; storyboard keepiq/boards/dev-teams, Round 25b
 * ownership story; Round 28e story cards; Round 28k "Use"). 1920 x 1080, 24 fps, 24 bars at 128 BPM, 45 s. The sister
 * of the Thematiq film: the same one-take honeycomb (one solid grid, Round 28c), the same word-art language.
 *
 *   0 to 5.63 s       the shared Conduction opening, handing over on its field
 *   5.63 to 31.88 s   the body, ONE take (tkfilm/lib.js, 14 bars):
 *                     story 1: "If somebody else owns and holds your key for you", the lock lifting out of its house
 *                       into a plain outside box, then "is it still your house?" in orange;
 *                     story 2: "Store your passwords where you keep your data" as the lock flies home and the cell turns
 *                       over into Keepiq's own, then "Local, safe and yours" in orange; the push INTO it: the request,
 *                       the fill-in link ringed, the partner's page filling in the masked value;
 *                     a whip-pan to the next cell: a link that vanishes after one view;
 *                     Round 28k: a slide one cell along the grid, matched on the Keepiq tag (it holds its place on
 *                       screen): the browser offers the matching login at the field and fills it, the phone beside it
 *                       copies it with a tap;
 *                     the pull back, a wave of grid cells turning over, and the push into the usage dashboard;
 *                     the pull back: the house cell turns over into orange exactly where Built on's lead
 *                       flips in, a hard cut on the bar;
 *   31.88 to 39.38 s  the shared Built on Nextcloud piece (closing.js, 4 bars)
 *   39.38 to 45 s     the shared install board (closing.js, 3 bars)
 *
 * No competitor is named: someone else's app is a plain outside box. Accents are clicks. Round 28: no current
 * anywhere, no wire, no electric sound. No bell.
 */
import { Film, loadFonts, measure } from '../_lib/stage.js'
import { FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene } from '../_lib/scenes/closing.js'
import { TYPE, layout, fitCaptionSize, use } from '../_lib/ui.js'
import { bezier } from '../_lib/core.js'
import { rest, take, glue, glueAttr } from '../connext/lib/camera.js'
import { caption } from '../connext/lib/type.js'
import { partnerRequestUI, onceLinkUI, useUI, usageContent, outsideBox } from './boards/dev-teams/board.js'
import {
	C, el, textBlock, ease, inv, clamp, lerp, mix, spring, hexPath, pop, F, R, ROUND, cellXY, toScreen,
	CAM_HO, HO_RATE, camOn, drawField, screenIn, drawScreen, windowTag, flip, flipIn, flipTf, FLIP,
} from '../tkfilm/lib.js'
import { appTag } from '../_lib/ui.js'
import { WINDOW } from '../_lib/scenes/general.js'

const APP = 'keepiq'
const BPM = 128
const SPB = 60 / BPM
const BAR = 4 * SPB
const S16 = SPB / 4
const OPEN = 3 * BAR
const BODY = 14 * BAR // Round 28e: two more bars for Ruben's story cards; Round 28k: two more for "Use"
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

const CELL = { house: [4, 0], once: [5, 0], use: [5, 1], usage: [4, 1] }
const XY = Object.fromEntries(Object.entries(CELL).map(([k, v]) => [k, cellXY(...v)]))
const SC = { request: screenIn(...CELL.house), once: screenIn(...CELL.once), use: screenIn(...CELL.use) }
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
	// Round 28e card 1: "If somebody else owns and holds your key for you", a clear pause, "is it still your house?"
	// in orange; one word every two frames, each line held its reading time (0.4 s a word) before the card leaves
	w1: Array.from({ length: 10 }, (_, i) => OPEN + F(2) + i * F(2)),
	house: OPEN + F(2), // the house cell with its lock turns over as the card starts
	box: OPEN + F(4), // the outside box, as "somebody" lands
	lift: [OPEN + F(12), OPEN + F(12) + 0.42], // the lock leaves the house for the box as "holds" lands
	w2: Array.from({ length: 5 }, (_, i) => OPEN + F(20) + 0.6 + i * F(2)), // after the pause: "is it still your house?"
	s1Out: 12.2,
	// card 2: "Store your passwords where you keep your data", then "Local, safe and yours" in orange
	w3: Array.from({ length: 8 }, (_, i) => 12.45 + i * F(2)),
	ret: [12.75, 13.3], // the lock flies home out of the box as "where you keep your data" lands
	home: 13.3, // it comes home; the cell turns over into Keepiq's own
	w4: Array.from({ length: 4 }, (_, i) => 13.55 + i * F(2)),
	s2Out: 16.7,
	push: [B(23.65), B(24.5)],
	// scene 3, the request (from 16.875; everything after the story moves two bars later)
	tag3: B(24.2),
	ticks: [B(24.6), B(24.6) + S16],
	link: [B(25), B(25.8)],
	ring3: B(25.8),
	send: [B(26.1), B(26.9)], // the link goes out to the partner (Round 28: no wire drawn)
	fill: [B(27), B(28.2)], // the partner types the value
	back: [B(28.4), B(29.3)], // the value back into the vault
	stored: B(29.3),
	// scene 4, the one-time link
	// Round 26 whip-pan: a seven-frame snap to the next cell (render --blur 4)
	whip: [B(31.6), B(31.6) + F(7)],
	tag4: B(32),
	views: B(32.9),
	link4: [B(33.3), B(34)],
	open: B(34.4),
	burn: [B(36.2), B(37.2)],
	// Round 28k, scene 5: use them from browser and mobile (8 beats); everything after it moves 8 beats later.
	// In: a match on the Keepiq tag: the camera slides one cell along the grid while the tag holds its place on screen.
	slide: [B(38.9), B(38.9) + 0.5],
	tagU: B(40.2), // the small Keepiq tag flips in at the username field
	cand: B(40.5), // the login that matches the address drops open under it
	ringU: B(41),
	fillU: [B(41.4), B(42.3)], // chosen: the username, then the password as dots
	signed: B(42.5),
	phone: B(43), // the phone rises in beside the browser
	tap: B(43.9), // copy, inside the tap
	copied: B(44.1),
	// scene 6, every use
	// Round 27c: the pull back, a wave of cells turning over on the grid toward the dashboard, the push in
	out: [B(46.7), B(47.4)],
	wave: [B(46.9), B(47.9)],
	in: [B(47.5), B(48.4)],
	bars: [B(48.4), B(49.4)],
	rows: B(49.5),
	ring5: B(51.1),
	pull: [B(54.3), B(55.9)], // after the last caption and the mark have left: nothing crosses the words
	capOut: B(54.1),
	appOn: B(54.9),
}

/* ============================================================ the camera */

const END = camOn(...XY.house, 1482, 538, 92 / 150) // Round 27: where Built on's lead flips in (closing.js CONNECT.cam.start, radius 92)
const PUSH = bezier(0.62, 0, 0.12, 1)
const MID = camOn(...XY.use.map((v, i) => (v + XY.usage[i]) / 2), 1300, 560, 1.15)
const camera = take([
	rest(CAM_HO, OPEN, { k: HO_RATE, pivot: [960, 540] }),
	rest(SC.request.key, T.push[1], { k: 0.006, pivot: [1300, 520] }),
	rest(SC.once.key, T.whip[1], { k: 0.006, pivot: [1300, 520] }),
	rest(SC.use.key, T.slide[1], { k: 0.006, pivot: [1300, 520] }),
	rest(MID, T.out[1], { k: 0.02, pivot: [1300, 560] }),
	rest(U_KEY, T.in[1], { k: 0.008, pivot: [1300, 560] }),
	rest(END, T.pull[1], { k: -0.01, pivot: [1482, 538] }),
], [
	{ from: T.push[0], to: T.push[1], ease: PUSH, blend: 'pivot' },
	{ from: T.whip[0], to: T.whip[1], ease: ease.snap, blend: 'pivot' },
	{ from: T.slide[0], to: T.slide[1], ease: ease.inOutCubic, blend: 'pivot' },
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

/**
 * Round 28l: a used screen fades out over six frames once its scene is done, and its cell is plain field again
 * (the house cell keeps only its drained Keepiq cell, which is field-coloured), so no used screen is left for a
 * later camera move, the pull back or the end to reveal.
 */
const DONE = { request: T.whip[1], once: T.slide[1], use: B(46.6), usage: T.capOut }
const left = (t, t0) => 1 - inv(t0, t0 + F(6), t)

/* ============================================================ the world scene */


film.scene('world', OPEN, T_BUILT, (ctx) => {
	const layer = el('g', { 'data-layer': 'world' }, ctx.g)
	return (t) => {
		layer.replaceChildren()
		const cam = camera(t)
		const look = (qq, rr, info) => {
			const k = info.k
			if (k === CELL.house.join() && t >= T.house) return { draw: (g, x, y) => {
				if (t >= T.appOn) return glyphApp(g, x, y, t)
				houseCell(g, x, y, t)
				if (t >= T.push[0] && left(t, DONE.request) > 0) {
					const inner = drawScreen(g, SC.request, (w, geom) => partnerRequestUI(w, geom, {
						ticks: (t >= T.ticks[0] ? 1 : 0) + (t >= T.ticks[1] ? 1 : 0),
						link: ease.outCubic(inv(...T.link, t)),
						ring: t < T.ring3 ? 0 : 1,
						wire: ease.inOutCubic(inv(...T.send, t)),
						fill: 8 * inv(...T.fill, t),
						back: t >= T.back[1] + 0.3 ? 0 : ease.inOutCubic(inv(...T.back, t)) || 0,
					}))
					windowTag(inner, APP, { sx: flipIn(t, T.tag3) })
					inner.setAttribute('opacity', (ease.outCubic(inv(T.push[0], T.push[0] + 0.3, t)) * left(t, DONE.request)).toFixed(3))
				}
			} }
			if (k === CELL.once.join() && t >= T.whip[0] - 0.4 && left(t, DONE.once) > 0) return { draw: (g, x, y) => {
				el('path', { d: hexPath(x, y, R, ROUND), fill: C.cobalt600 }, g)
				const inner = drawScreen(g, SC.once, (w, geom) => {
					const burnt = inv(...T.burn, t)
					// Round 27: after its one view the recipient's card turns over to nothing (width to zero), and the link is gone
					const cardSx = burnt <= 0 ? 1 : Math.max(0, Math.cos(Math.PI / 2 * ease.inCubic(clamp(burnt * 1.6))))
					onceLinkUI(w, geom, { views: t < T.views ? '' : '1', ring: t < T.views ? 0 : 1, link: ease.outCubic(inv(...T.link4, t)), open: ease.brand(inv(T.open, T.open + 0.35, t)), cardSx, burn: ease.outCubic(inv(T.burn[0] + 0.3, T.burn[1], t)) })
				})
				if (t < T.slide[0]) windowTag(inner, APP, { sx: flipIn(t, T.tag4) })
				inner.setAttribute('opacity', left(t, DONE.once).toFixed(3))
			} }
			// Round 28k: the use cell, a browser and a phone; its tag is the one that travelled with the camera
			if (k === CELL.use.join() && t >= T.slide[0] - 0.1 && left(t, DONE.use) > 0) return { draw: (g, x, y) => {
				el('path', { d: hexPath(x, y, R, ROUND), fill: C.cobalt600 }, g)
				const inner = drawScreen(g, SC.use, (w, geom) => useUI(w, geom, {
					tag: flipIn(t, T.tagU),
					cand: ease.outCubic(inv(T.cand, T.cand + 0.3, t)),
					ring: t < T.ringU ? 0 : 1,
					fill: inv(...T.fillU, t),
					signed: ease.outCubic(inv(T.signed, T.signed + 0.25, t)),
					phone: inv(T.phone, T.phone + 0.4, t),
					tap: t < T.tap ? 0 : 1,
					copied: ease.outCubic(inv(T.copied, T.copied + 0.25, t)),
				}))
				if (t >= T.slide[1]) windowTag(inner, APP)
				inner.setAttribute('opacity', left(t, DONE.use).toFixed(3))
			} }
			if (k === CELL.usage.join() && t >= T.wave[1] && left(t, DONE.usage) > 0) return { draw: (g, x, y) => {
				el('path', { d: hexPath(x, y, R, ROUND), fill: C.cobalt600 }, g)
				const ug = el('g', { transform: `translate(${U_AT[0]} ${U_AT[1]}) scale(${US}) translate(-120 -640)`, opacity: left(t, DONE.usage).toFixed(3) }, g)
				usageContent(ug, { bars: ease.outCubic(inv(...T.bars, t)), rows: clamp((t - T.rows) / S16 + 1, 0, 5), ring: t < T.ring5 ? 0 : 1, tag: flipIn(t, T.bars[0]) })
			} }
			// Round 27c (Round 28k: from the use cell): a wave of cells turning over on the grid itself, from the link's cell to the dashboard's
			if (t >= T.wave[0] && t < T.wave[1] + FLIP * 2) {
				const [ox, oy] = XY.use, [ux, uy] = XY.usage
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
		const wg = drawField(layer, cam, look, { solid: ease.inOutCubic(inv(OPEN, OPEN + 0.6, t)) }) // Round 28c: one clear, solid grid, no second layer
		// story 2: the box, the lock in flight, and home again
		if (t >= T.box && t < T.home + 0.4) {
			const s = t < T.home + 0.1 ? pop(t - T.box, { freq: 2.8, zeta: 0.55 }) : 1 - ease.inCubic(inv(T.home + 0.1, T.home + 0.35, t))
			const bg = el('g', { transform: `translate(${BOX.x} ${BOX.y}) scale(${(1 / CAM_HO.z).toFixed(4)})` }, wg)
			outsideBox(bg, 0, 0, 320, 250, { s, lock: t >= T.lift[1] && t < T.ret[0] })
		}
		lockInFlight(wg, t)
	}
}, { post: 0.001 })

/**
 * Round 28k: the match on the Keepiq tag. During the slide the window tags hand over to one tag on the stage: it starts
 * exactly where the share link's tag is on screen and ends exactly where the use window's tag will be, eased with the camera.
 */
const TAG_M = [(WINDOW.nav + 14) * 2.5, WINDOW.row1] // windowTag's mock-px anchor (tkfilm/lib.js, U 2.5), radius 55
function tagOnScreen(sc, t) {
	const cam = camera(t)
	const wx = sc.at[0] + sc.s * TAG_M[0], wy = sc.at[1] + sc.s * TAG_M[1]
	return [...toScreen(cam, wx, wy), cam.z * sc.s]
}
film.scene('t-tagmatch', T.slide[0], T.slide[1], (ctx) => {
	const g = el('g', {}, ctx.g)
	const a = tagOnScreen(SC.once, T.slide[0]), b = tagOnScreen(SC.use, T.slide[1])
	return (t) => {
		g.replaceChildren()
		const u = ease.inOutCubic(inv(...T.slide, t))
		const k = lerp(a[2], b[2], u)
		appTag(g, lerp(a[0], b[0], u), lerp(a[1], b[1], u), 55 * k, APP, { fill: C.cobalt, ringW: 6 * k })
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
;[['Ownership', T.mark, T.s2Out], ['Get passwords and certificates', B(24.6), B(31.3)], ['Share passwords and certificates', B(32.5), B(38.6)], ['Use', B(39.9), B(46.6)], ['Usage', B(48.5), T.capOut]].forEach(([title, rise, leave], i) => {
	// Round 28i: a long title shrinks until it ends by x 860 (column stretch, inside the safe box, clear of the window)
	const size = Math.min(58, Math.floor((58 * 740) / measure(title, { size: 58, weight: 700, tracking: -0.02 })))
	film.scene(`t-mark-${i}`, rise - F(1), leave + EXIT, (ctx) => {
		const c = caption(ctx.g, { text: title, size, y: TYPE.markY + 54, lineHeight: 1, fill: C.white }, { rise, leave, camera })
		return (t) => c.set(t)
	})
})

// Round 28e: card 1, the line in white, a clear pause, then the question in orange
film.scene('t-story1', OPEN, T.s1Out + EXIT + F(1), (ctx) => {
	const g = el('g', {}, ctx.g)
	const a = textBlock(g, 'If somebody else owns and\nholds your key for you', { x: 120, y: 450, size: 96, weight: 700, fill: C.white, tracking: -0.03, clip: false, lineHeight: 1.12 })
	const b = textBlock(g, 'is it still your house?', { x: 120, y: 740, size: 130, weight: 700, fill: C.orange, tracking: -0.03, clip: false })
	return (t) => {
		slamItems(a.items, T.w1, t)
		slamItems(b.items, T.w2, t, { from: 1.6 })
		artOut(g, t, T.s1Out)
	}
})
// card 2: where the passwords belong, then the answer in orange
film.scene('t-story2', T.w3[0] - F(1), T.s2Out + EXIT + F(1), (ctx) => {
	const g = el('g', {}, ctx.g)
	const a = textBlock(g, 'Store your passwords where\nyou keep your data', { x: 120, y: 460, size: 96, weight: 700, fill: C.white, tracking: -0.03, clip: false, lineHeight: 1.12 })
	const b = textBlock(g, 'Local, safe and yours', { x: 120, y: 760, size: 130, weight: 700, fill: C.orange, tracking: -0.03, clip: false })
	return (t) => {
		slamItems(a.items, T.w3, t)
		slamItems(b.items, T.w4, t, { from: 1.6 })
		artOut(g, t, T.s2Out)
	}
})

const CAPS = [
	['request', 'Request passwords\nfrom partners', B(24.6), B(31.3)],
	['once', 'Share links, gone\nafter one view', B(32.5), B(38.6)],
	['use', 'Use your passwords\nfrom browser\nand mobile', B(39.9), B(46.6)],
	['usage', 'Every use: who,\nwhen, where, why', B(48.5), T.capOut],
]
for (const [id, text, rise, leave] of CAPS) {
	film.scene(`t-${id}`, rise - F(1), leave + EXIT, (ctx) => {
		const c = caption(ctx.g, { text, size: fitCaptionSize(text), y: TYPE.y1, lineHeight: TYPE.lh / TYPE.size, fill: C.white }, { rise, leave, camera })
		return (t) => c.set(t)
	})
}

/* ============================================================ sound */

// story (Round 28e)
T.w1.forEach((t, i) => cue(t, 'tick', { freq: 1174.66 + i * 60, gain: 0.08, decay: 0.035 }))
cue(T.house + FLIP / 2, 'click', { gain: 0.2, freq: 2400, seed: 121, dry: true, pan: 0.5 })
cue(T.box, 'kick', { gain: 0.18, pitch: 90, end: 44, decay: 0.22, click: 0.05 })
cue(T.lift[0], 'whoosh', { dur: 0.5, from: 600, to: 3600, panFrom: 0.4, panTo: 0.7, gain: 0.14 })
cue(T.lift[1], 'click', { gain: 0.22, freq: 2000, seed: 122, dry: true, pan: 0.6 })
T.w2.forEach((t, i) => cue(t, i === 4 ? 'impact' : 'tick', i === 4 ? { gain: 0.36, from: 90, to: 34, decay: 0.9 } : { freq: 1318.51 + i * 90, gain: 0.12 }))
T.w3.forEach((t, i) => cue(t, 'tick', { freq: 1318.51 + i * 60, gain: 0.08, decay: 0.035 }))
T.w4.forEach((t, i) => cue(t, i === 3 ? 'click' : 'tick', i === 3 ? { gain: 0.28, freq: 2600, seed: 123, dry: true } : { freq: 1760 + i * 110, gain: 0.12 }))
// the lock comes home: a whoosh down out of the box, a thud and a click as it lands
cue(T.ret[0], 'whoosh', { dur: T.ret[1] - T.ret[0] + 0.1, from: 3600, to: 600, panFrom: 0.7, panTo: 0.4, gain: 0.16 })
cue(T.home, 'kick', { gain: 0.24, pitch: 100, end: 45, decay: 0.22, click: 0.06 })
cue(T.home + FLIP / 2, 'click', { gain: 0.26, freq: 2800, seed: 124, dry: true, pan: 0.5 })
cue(T.home, 'click', { gain: 0.32, freq: 2800, seed: 124, dry: true, pan: 0.5 })
cue(T.push[0] - 0.05, 'whoosh', { dur: 0.9, from: 400, to: 4800, panFrom: 0.4, panTo: 0, gain: 0.24 })
// scene 3
cue(T.tag3, 'pluck', { freq: 587.33, gain: 0.2, pan: 0.2 })
T.ticks.forEach((t, i) => cue(t, 'tick', { freq: [1318.51, 1479.98][i], gain: 0.12, pan: 0.4 }))
for (let i = 0; i < 6; i++) cue(lerp(...T.link, i / 6), 'tick', { freq: 2637, gain: 0.05, decay: 0.03, pan: 0.3 })
cue(T.ring3, 'click', { gain: 0.3, freq: 2700, seed: 125, dry: true, pan: 0.3 })
cue(T.out[1], 'click', { gain: 0.22, freq: 2900, seed: 126, dry: true, pan: -0.2 })
for (let i = 0; i < 8; i++) cue(lerp(...T.fill, i / 8), 'tick', { freq: 2349.32, gain: 0.05, decay: 0.03, pan: -0.3 })
cue(T.stored, 'click', { gain: 0.3, freq: 2600, seed: 127, dry: true, pan: 0.4 })
cue(T.stored + 0.03, 'pluck', { freq: 880, gain: 0.2, pan: 0.4 })
// scene 4
cue(T.whip[0] - 0.04, 'whoosh', { dur: 0.36, from: 1200, to: 7000, panFrom: -0.8, panTo: 0.8, gain: 0.26 })
cue(T.whip[1], 'click', { gain: 0.3, freq: 2400, seed: 128, dry: true, pan: 0.5 })
cue(T.tag4, 'pluck', { freq: 659.26, gain: 0.18, pan: 0.2 })
cue(T.views, 'click', { gain: 0.32, freq: 2600, seed: 129, dry: true, pan: 0.1 })
cue(T.open, 'pluck', { freq: 1174.66, gain: 0.2, pan: 0.6 })
cue(T.burn[0], 'whoosh', { dur: 0.4, from: 5200, to: 900, panFrom: 0.6, panTo: 0.4, gain: 0.1, q: 2.5 })
cue(T.burn[0] + 0.3, 'click', { gain: 0.24, freq: 2000, seed: 51, dry: true, pan: 0.6 })
// scene 5 (Round 28k): the slide on the tag, the browser fill, the phone's tap
cue(T.slide[0] - 0.04, 'whoosh', { dur: 0.55, from: 900, to: 3800, panFrom: 0.2, panTo: -0.2, gain: 0.18 })
cue(T.slide[1], 'click', { gain: 0.26, freq: 2500, seed: 132, dry: true, pan: 0.2 })
cue(T.tagU, 'pluck', { freq: 587.33, gain: 0.18, pan: 0.1 })
cue(T.cand, 'tick', { freq: 1479.98, gain: 0.1, pan: 0.1 })
cue(T.ringU, 'click', { gain: 0.3, freq: 2700, seed: 133, dry: true, pan: 0.1 })
for (let i = 0; i < 10; i++) cue(lerp(...T.fillU, i / 10), 'tick', { freq: 2349.32, gain: 0.05, decay: 0.03, pan: 0 })
cue(T.signed, 'pluck', { freq: 880, gain: 0.2, pan: 0 })
cue(T.phone, 'whoosh', { dur: 0.35, from: 600, to: 2400, panFrom: 0.5, panTo: 0.6, gain: 0.08 })
cue(T.tap, 'click', { gain: 0.3, freq: 2900, seed: 134, dry: true, pan: 0.6 })
cue(T.copied, 'pluck', { freq: 1174.66, gain: 0.18, pan: 0.6 })
// scene 6
cue(T.out[0], 'whoosh', { dur: 0.7, from: 3000, to: 500, panFrom: 0.4, panTo: 0, gain: 0.16 })
for (let i = 0; i < 8; i++) cue(lerp(T.wave[0], T.wave[1] - FLIP, i / 8), 'click', { gain: 0.1, freq: 2200 + i * 90, seed: 60 + i, dry: true, pan: 0.6 - i * 0.15 })
cue(T.in[0], 'whoosh', { dur: 0.9, from: 400, to: 4600, panFrom: -0.2, panTo: 0.3, gain: 0.2 })
for (let i = 0; i < 6; i++) cue(lerp(...T.bars, i / 6), 'tick', { freq: 1174.66 * Math.pow(2, i / 12 * 2), gain: 0.07, pan: 0.3 })
for (let i = 0; i < 5; i++) cue(T.rows + i * S16, 'tick', { freq: [1318.51, 1479.98, 1567.98, 1760, 1975.53][i], gain: 0.09, pan: 0.2 })
cue(T.ring5, 'click', { gain: 0.3, freq: 2800, seed: 130, dry: true, pan: 0.3 })
cue(T.pull[0] - 0.05, 'whoosh', { dur: 1.1, from: 3200, to: 300, panFrom: 0.3, panTo: -0.2, gain: 0.2 })
cue(T.appOn, 'pluck', { freq: 587.33, gain: 0.24, pan: 0.4 })
cue(T.appOn, 'click', { gain: 0.26, freq: 2800, seed: 131, dry: true, pan: 0.4 })

/* ============================================================ the closing pieces */
film.scene('builtOn', T_BUILT, T_BUILT + BUILT, (ctx) => builtOnScene(ctx, { app: APP, apps: ['integriq'], on: 'nextcloud' }))
film.scene('install', T_BUILT + BUILT, DURATION, (ctx) => installScene(ctx, {}), { post: 0.001 })

/** The bed, in B minor then D: silent under the opening, pad from the story, the kick from the request, resolving on D. */
film.music = {
	bars: 24, // Round 28e: 12-bar body; Round 28k: 14
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62], // 0-2 the opening
		[47, 54, 57, 61], // 3 Bm9: if somebody else holds your key
		[47, 50, 54, 57], // 4 Gmaj9: is it still your house?
		[45, 52, 57, 59], // 5 A sus: (the pause)
		[42, 49, 54, 57], // 6 F#m7: store your passwords where you keep your data
		[47, 50, 54, 57], // 7 Gmaj9: local, safe and yours
		[49, 52, 57, 59], // 8 A add9: the lock comes home, the push
		[50, 54, 61, 64], // 9 Dmaj9: the request
		[47, 50, 54, 57], // 10 Gmaj9: the partner fills it in
		[49, 52, 57, 59], // 11 A add9: share links
		[47, 50, 54, 61], // 12 Bm add9: gone after one view
		[50, 54, 61, 64], // 13 Dmaj9: use them from the browser (Round 28k)
		[45, 52, 57, 61], // 14 A: and from the phone
		[47, 50, 54, 59], // 13 Gmaj7: every use
		[49, 52, 57, 59], // 14 A add9: the pull back
		[50, 54, 61, 64], // 15 Dmaj9: built on
		[47, 54, 57, 61], // 16 Bm9
		[47, 50, 54, 57], // 17 Gmaj9
		[49, 52, 57, 59], // 18 A add9: enhanced by Conduction
		[47, 50, 54, 57], // 19 Gmaj9: install it
		[49, 52, 57, 59], // 20 A add9
		[50, 54, 57, 62], // 21 D: own it
	],
	bass: [38, 38, 38, 35, 43, 45, 42, 43, 45, 38, 43, 45, 35, 38, 45, 43, 45, 38, 35, 43, 45, 43, 45, 38],
	parts: { pad: [[3, 24]], bass: [[4, 23]], kick: [[9, 17]], hat: [[9, 17]], clap: [[11, 16]] },
	loop: false,
}

film.board = { film: 'keepiq', meta: { title: 'Keepiq' } }
window.__keepiq = { T, OPEN, BODY, BUILT, INSTALL, DURATION, CELL }
if (q.has('dump')) console.log(JSON.stringify(window.__keepiq))
film.start()
