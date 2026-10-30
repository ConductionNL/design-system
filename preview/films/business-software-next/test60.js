/**
 * "Business software is next", the one-movie test (Ruben, 30 Oct): the hook and the precedent, from
 * who-codes to the title, behind the shared Conduction opening. No voice-over; reading pace.
 *
 * One world, no screens: the approved stills are the vocabulary, but every frame is a moment in one
 * continuous move. The device is the hero hex, one orange cell that is "you": born in who-codes, it
 * survives every cut and changes role (the cursor after a line, the marker on the counters, the bullet
 * on the headline strips, the core of the ecosystem, the last step of the timeline, the title's full
 * stop). It is each scene's one orange, so the stills' orange words are white here.
 *
 * Every cut carries something across, and the seams vary:
 *   who-codes > who-patched       the honeycomb stays; the question swaps in place
 *   who-patched > fun-week        zoom-through: the camera pushes into a cell of the honeycomb, the next scene is inside it
 *   fun-week (within)             a hard cut on the beat, the hero slides to the new line's end
 *   fun-week > wordpress-week     motion match: the world slides up, the next scene rises from below at the same speed
 *   wordpress-week > headlines    motion match: exit left, enter from the right
 *   headlines > core-vs-ecosystem pull-out: the scene turns out to be the core cell of an ecosystem honeycomb
 *   core-vs-ecosystem > share     morph: the three numbers roll and slide into the next three, the words swap
 *   share > wilded                motion match: the world slides up again
 *   wilded > title                the timeline's last step, "Business software", grows into the title
 * Every cut overlaps: the next scene's first element moves before the last one has left.
 *
 * Every frame is a pure function of time. No rotation, no bounce, no gradients.
 */
import { Film, loadFonts, el, textBlock } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'
import { inv, lerp, mix, hexPath, ease } from '../_lib/core.js'
import { curve, F } from '../_lib/motion.js'
import { hex, honeyAt } from '../_lib/ui.js'
import { boards } from './boards/talk/board.js'
import { animateBoard, parseNum, formatNum } from './animate.js'

const BOARD = Object.fromEntries(boards.map((b) => [b.id, b]))
const camera = curve('camera'), rest = curve('rest'), leave = curve('leave'), drift = curve('drift')
const CX = 960, CY = 540
const ZOOM_R = 1300 // a nested scene sits in a hex this big in its own coordinates: it covers the frame
const DURATION = 75

/* ---------- the plan (film seconds): scene windows, clocks, seams, reading times ---------- */
// A scene's clock is its own time 0; animate.js starts its first line rising 3 frames before it.
const S = {
	s1: { id: 'who-codes', from: 5.625, to: 9.47, clock: 5.75 + F(3) },
	s2: { id: 'who-patched', from: 9.375, to: 15.47, clock: 9.37 + F(3) },
	s3: { id: 'fun-week', from: 14.06, to: 21.5625, clock: 14.7 + F(3) },
	s4: { id: 'wordpress-week', from: 20.625, to: 29.0625, clock: 20.5 },
	s5: { id: 'headlines', from: 28.125, to: 40.31, clock: 28.0 },
	s6: { id: 'core-vs-ecosystem', from: 38.9, to: 51.33, clock: 40.0 + F(3) },
	s7: { id: 'wordpress-share', from: 50.39, to: 57.1875, clock: 50.6 + F(3) },
	s8: { id: 'wilded', from: 56.25, to: 66.09, clock: 56.1 },
	s9: { id: 'title', from: 65.16, to: DURATION, clock: 66.09 - F(1) },
}
const ANCHOR_IN = { q: -4, r: 0 } // the cell of who-patched's honeycomb that fun-week is inside
const CORE = { x: 1560, y: 300, r: 40, gap: 6 } // the core cell of core-vs-ecosystem's honeycomb
const SEAMS = [
	{ type: 'swap', a: 's1', b: 's2', t0: 9.14, t1: 9.47 },
	{ type: 'zoomIn', a: 's2', b: 's3', t0: 14.06, t1: 15.47 },
	{ type: 'pan', a: 's3', b: 's4', t0: 20.625, t1: 21.5625, dir: [0, 1] },
	{ type: 'pan', a: 's4', b: 's5', t0: 28.125, t1: 29.0625, dir: [1, 0] },
	{ type: 'zoomOut', a: 's5', b: 's6', t0: 38.9, t1: 40.31 },
	{ type: 'morph', a: 's6', b: 's7', t0: 50.39, t1: 51.33 },
	{ type: 'pan', a: 's7', b: 's8', t0: 56.25, t1: 57.1875, dir: [0, 1] },
	{ type: 'grow', a: 's8', b: 's9', t0: 65.16, t1: 66.09 },
]
const local = (k, t) => t - S[k].clock
const L = (k, t) => +(t - S[k].clock).toFixed(4) // a film time as scene k's clock time, for the slot table

/* ---------- the camera of each scene: a slow breath while it is read, the seams around it ---------- */
const incoming = (k) => SEAMS.find((s) => s.b === k)
const outgoing = (k) => SEAMS.find((s) => s.a === k)
const anchorIn = (() => { const at = honeyAt(1460, 560, 46, 8); const [x, y] = at(ANCHOR_IN.q, ANCHOR_IN.r); return { x, y, r: 46 } })()

/** Affine map of a scene at time t: screen = (X, Y) + s * p. */
function breathe(k, t) {
	const i = incoming(k), o = outgoing(k)
	const a = i ? i.t1 : S[k].from, b = o ? o.t0 : S[k].to
	const u = inv(a, b, t)
	const s = 1 + 0.014 * Math.sin(Math.PI * u) ** 2 // 1.4 % in and back out: never still, and identity at both seams
	return { X: CX - s * CX, Y: CY - s * CY, s }
}
const compose = (m, n) => ({ X: m.X + m.s * n.X, Y: m.Y + m.s * n.Y, s: m.s * n.s }) // m after n
const apply = (m, x, y) => [m.X + m.s * x, m.Y + m.s * y]

function zoomPair(e, anchor, innerDrift) {
	// straight-line zoom about the anchor cell, which travels to the frame centre; one ease, in log space
	const Z = ZOOM_R / anchor.r
	const z = Math.pow(Z, e)
	const px = lerp(anchor.x, CX, e), py = lerp(anchor.y, CY, e)
	const outer = { X: px - z * anchor.x, Y: py - z * anchor.y, s: z }
	const inner = compose({ X: px - (z / Z) * CX, Y: py - (z / Z) * CY, s: z / Z }, innerDrift)
	return { outer, inner }
}

function sceneMap(k, t) {
	let m = breathe(k, t)
	const o = outgoing(k), i = incoming(k)
	const seam = o && t >= o.t0 && t < o.t1 ? o : i && t >= i.t0 && t < i.t1 ? i : null
	if (!seam) return m
	const u = inv(seam.t0, seam.t1, t)
	const isA = seam.a === k
	if (seam.type === 'pan') {
		const e = camera(u)
		const D = seam.dir[1] ? 1280 : 2120
		const dx = seam.dir[0] * D, dy = seam.dir[1] * D
		return isA ? compose({ X: -dx * e, Y: -dy * e, s: 1 }, m) : compose({ X: dx * (1 - e), Y: dy * (1 - e), s: 1 }, m)
	}
	if (seam.type === 'zoomIn') {
		const e = camera(u)
		const anchor = { ...anchorIn }
		const { outer, inner } = zoomPair(e, anchor, { X: 0, Y: 0, s: 1 })
		return isA ? compose(outer, m) : inner
	}
	if (seam.type === 'zoomOut') {
		const e = 1 - camera(u)
		const { outer, inner } = zoomPair(e, CORE, isA ? m : { X: 0, Y: 0, s: 1 })
		return isA ? inner : outer
	}
	return m
}

/* ---------- the film ---------- */
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: DURATION, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
film.langs = ['en']
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
addOpening(film, { at: 0 })

const hexClip = el('clipPath', { id: 'bsn-zoom-clip' }, film.defs)
el('path', { d: hexPath(CX, CY, ZOOM_R, 0) }, hexClip)

const BUILT = {}
const isOrange = (n) => (n.getAttribute('fill') || '').toUpperCase() === C.orange.toUpperCase()
const recolourText = (cam, fix) => { for (const n of cam.querySelectorAll('text')) if (isOrange(n)) { n.setAttribute('fill', C.white); if (fix) n.textContent = fix(n.textContent) } }
const unlight = (n) => { n.setAttribute('fill', C.cobalt400); n.setAttribute('fill-opacity', 0.35); n.removeAttribute('data-anim') }
const pathAt = (cam, x, y) => [...cam.querySelectorAll('path')].find((p) => { const b = p.getBBox(); return Math.abs(b.x + b.width / 2 - x) < 2 && Math.abs(b.y + b.height / 2 - y) < 2 })

/** What each scene changes in its still, and its slot times (scene clock seconds). */
const SETUP = {
	s1: { afterDraw: (cam) => { for (const p of cam.querySelectorAll('path')) if (isOrange(p)) unlight(p) }, spec: { bgSpread: 0.5 } },
	s2: {
		afterDraw: (cam) => {
			for (const p of cam.querySelectorAll('path')) if (isOrange(p)) unlight(p)
			const a = pathAt(cam, anchorIn.x, anchorIn.y)
			if (a) unlight(a)
		},
		spec: { bg: 'hold', lightAt: L('s2', 10.3), lightSpan: 1.2 },
	},
	s3: { afterDraw: (cam) => recolourText(cam, (s) => s.replace(/\.$/, '')), spec: { beatWord: 'Mine' }, wordAt: (w) => (w === 'Mine' ? L('s3', 18.28) + F(1) : null) },
	s4: { afterDraw: (cam) => recolourText(cam), spec: { at: [L('s4', 22.5), L('s4', 23.4), L('s4', 24.4)] } },
	s5: { spec: { at: [L('s5', 29.9), L('s5', 31.4), L('s5', 32.8), L('s5', 34.2)] } },
	s6: {
		afterDraw: (cam) => {
			recolourText(cam)
			// the ecosystem as a small honeycomb; its core cell is where the headlines scene lands
			const at = honeyAt(CORE.x, CORE.y, CORE.r, CORE.gap)
			for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
				const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))
				if (d > 2) continue
				const [x, y] = at(q, r)
				hex(cam, x, y, CORE.r, d === 0 ? C.cobalt600 : C.cobalt400, CORE.r * 0.1, { 'fill-opacity': d === 0 ? 1 : 0.5 - d * 0.12 })
			}
			textBlock(cam, 'Citizen coders will not patch every week. The platform has to do it for them', { x: 120, y: 930, size: 36, weight: 600, fill: C.cobalt200, tracking: -0.01, maxWidth: 1600, lineHeight: 1.2, clip: false })
		},
		spec: { at: [L('s6', 41.0), L('s6', 41.9), L('s6', 42.8), L('s6', 38.75), L('s6', 44.6)], runSpan: 0.6, runOrder: 'draw' },
	},
	s7: { afterDraw: (cam) => recolourText(cam), spec: { skip: (p) => p.kind === 'number', at: [L('s7', 51.2), L('s7', 51.5), L('s7', 51.8)] } },
	s8: {
		afterDraw: (cam) => { for (const p of cam.querySelectorAll('path')) if (isOrange(p)) p.setAttribute('fill-opacity', 0) },
		spec: { at: [L('s8', 57.4), L('s8', 57.9), L('s8', 58.6), L('s8', 59.3), L('s8', 60.0), L('s8', 60.7)] },
	},
	s9: { afterDraw: (cam) => recolourText(cam, (s) => s.replace(/\.$/, '')), spec: { at: [L('s9', 66.8)] } },
}

const order = ['s1', 's2', 's3', 's4', 's6', 's5', 's7', 's8', 's9'] // the headlines scene draws above the ecosystem it shrinks into
for (const k of order) {
	const sc = S[k], set = SETUP[k]
	film.scene(k, sc.from, sc.to, (ctx) => {
		ctx.g.setAttribute('display', 'inline')
		const xf = el('g', { 'data-scene-xf': sc.id }, ctx.g)
		const backdrop = el('path', { d: hexPath(CX, CY, ZOOM_R, 0), fill: C.cobalt, display: 'none' }, xf)
		const holder = el('g', {}, xf)
		const anim = animateBoard(Object.assign(Object.create(ctx), { g: holder }), BOARD[sc.id], {
			start: sc.clock, dur: sc.to - sc.clock, lead: 0.5, voice: sc.to - sc.clock - 1, wordAt: set.wordAt || (() => null),
			spec: set.spec || {}, orange: C.orange, seed: Math.round(sc.clock * 100), afterDraw: set.afterDraw,
		})
		for (const { at, kind, ...o } of anim.cues) film.cue(sc.clock + at, kind, o)
		BUILT[k] = { xf, backdrop, anim, pieces: anim.pieces, holder }
		const B = BUILT[k]
		B.byKind = (kind) => anim.pieces.filter((p) => p.kind === kind)
		ctx.g.removeAttribute('display')
		return (t) => {
			anim.update(local(k, t))
			const m = sceneMap(k, t)
			xf.setAttribute('transform', `translate(${m.X.toFixed(2)} ${m.Y.toFixed(2)}) scale(${m.s.toFixed(5)})`)
			// nested in a cell during a zoom: clipped to the cell, on a ground that turns from the cell's colour to its own
			const seam = SEAMS.find((s) => ((s.type === 'zoomIn' && s.b === k) || (s.type === 'zoomOut' && s.a === k)) && t >= s.t0 && t < s.t1)
			if (seam) {
				const u = inv(seam.t0, seam.t1, t)
				const p = seam.type === 'zoomIn' ? camera(u) : 1 - camera(u)
				const cell = seam.type === 'zoomIn' ? mix(C.cobalt, C.cobalt400, 0.35) : C.cobalt600
				xf.setAttribute('clip-path', 'url(#bsn-zoom-clip)')
				backdrop.removeAttribute('display')
				backdrop.setAttribute('fill', mix(cell, C.cobalt, Math.min(1, p * 1.4)))
			} else {
				xf.removeAttribute('clip-path')
				backdrop.setAttribute('display', 'none')
			}
			B.after?.(t)
		}
	})
}

/* ---------- exits, the morph and the grow: what the seams do to single pieces ---------- */
function exitPieces(pieces, t0, t) {
	const step = Math.min(F(1), 0.3 / Math.max(1, pieces.length))
	pieces.forEach((p, i) => {
		const e = leave(inv(t0 + i * step, t0 + i * step + F(8), t))
		if (e <= 0) return
		p.w.setAttribute('transform', `translate(0 ${(-44 * e).toFixed(2)})`)
		p.w.setAttribute('opacity', (1 - e).toFixed(3))
	})
}
const firstText = (p) => [...p.node.querySelectorAll('text')].find((n) => /\d/.test(n.textContent)) || p.node.querySelector('text')
const itemPos = (n) => ({ x: +n.getAttribute('x'), y: +n.getAttribute('y'), size: +n.getAttribute('font-size') })

// who-codes: its line leaves upward as who-patched's rises; the honeycomb under both is the same
BUILT.s1.after = (t) => exitPieces(BUILT.s1.pieces.filter((p) => p.kind === 'headline'), 9.14, t)

// core-vs-ecosystem > wordpress-share: the words leave, the three numbers roll and slide into the next three
{
	const A = BUILT.s6, Bq = BUILT.s7, seam = SEAMS.find((s) => s.type === 'morph')
	const nA = A.byKind('number'), nB = Bq.byKind('number')
	const stay = new Set(nA)
	const pairs = nA.map((p, i) => {
		const q = nB[i], na = firstText(p), nb = firstText(q)
		return { p, q, na, nb, from: itemPos(na), to: itemPos(nb), fa: parseNum(na.textContent), fb: parseNum(nb.textContent), others: [...p.node.querySelectorAll('text')].filter((n) => n !== na), original: na.textContent }
	})
	A.after = (t) => {
		exitPieces(A.pieces.filter((p) => !stay.has(p) && p.kind !== 'hex'), seam.t0 - 0.3, t)
		exitPieces(A.pieces.filter((p) => p.kind === 'hex'), seam.t0 - 0.3, t)
		const u = inv(seam.t0, seam.t1, t)
		for (const pr of pairs) {
			if (t < seam.t0) { pr.p.w.removeAttribute('transform'); continue }
			const e = rest(u)
			const k = lerp(1, pr.to.size / pr.from.size, e)
			const x = lerp(pr.from.x, pr.to.x, e), y = lerp(pr.from.y, pr.to.y, e)
			pr.p.w.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(4)}) translate(${(-pr.from.x).toFixed(2)} ${(-pr.from.y).toFixed(2)})`)
			pr.na.textContent = formatNum(pr.fb, lerp(pr.fa.value, pr.fb.value, ease.inOutCubic(u)))
			pr.others.forEach((n) => n.setAttribute('display', u > 0.3 ? 'none' : 'inline'))
			pr.na.setAttribute('fill', pr.nb.getAttribute('fill'))
		}
	}
	Bq.after = (t) => { for (const q of nB) q.w.setAttribute('display', t < seam.t1 ? 'none' : 'inline') }
}

// wilded > title: everything leaves but "Business software", which grows into the title's first two words
{
	const A = BUILT.s8, Bq = BUILT.s9, seam = SEAMS.find((s) => s.type === 'grow')
	const label = A.pieces.find((p) => p.node.textContent.replace(/\s/g, '') === 'Businesssoftware')
	const head = Bq.byKind('headline')[0]
	const from = [...label.node.querySelectorAll('text')]
	const to = [...head.node.querySelectorAll('text')].slice(0, 2)
	A.after = (t) => {
		exitPieces(A.pieces.filter((p) => p !== label), seam.t0 - 0.25, t)
		if (t < seam.t0) return
		// first "software" moves up beside "Business" (one line, label size), then the line grows into the title as one piece
		const u = inv(seam.t0, seam.t1, t)
		const e1 = rest(inv(0, 0.35, u)), e2 = camera(inv(0.25, 1, u))
		const a0 = itemPos(from[0]), a1 = itemPos(from[1]), b0 = itemPos(to[0])
		const K = b0.size / a0.size
		const beside = { x: a0.x + (itemPos(to[1]).x - b0.x) / K, y: a0.y }
		const k = Math.exp(lerp(0, Math.log(K), e2))
		const ox = lerp(a0.x, b0.x, e2), oy = lerp(a0.y, b0.y, e2)
		const place = (n, x, y) => n.setAttribute('transform', `translate(${(ox + (x - a0.x) * k).toFixed(2)} ${(oy + (y - a0.y) * k).toFixed(2)}) scale(${k.toFixed(4)}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})`)
		place(from[0], a0.x, a0.y)
		// "software" glyphs sit at (a1.x, a1.y); translate them to the beside slot first
		const sx = lerp(a1.x, beside.x, e1), sy = lerp(a1.y, beside.y, e1)
		from[1].setAttribute('transform', `translate(${(ox + (sx - a0.x) * k).toFixed(2)} ${(oy + (sy - a0.y) * k).toFixed(2)}) scale(${k.toFixed(4)}) translate(${(-a1.x).toFixed(2)} ${(-a1.y).toFixed(2)})`)
	}
	Bq.after = (t) => to.forEach((n) => {
		if (t < seam.t1) n.setAttribute('display', 'none')
		else { n.removeAttribute('display'); n.removeAttribute('transform') }
	})
}

/* ---------- the hero: one orange hex, "you", from who-codes to the title ---------- */
const box = (p) => p.box
const markerAfter = (p, r = 16) => ({ x: box(p).x + box(p).width + 30, y: box(p).y + box(p).height * 0.55, r })
const dotAfter = (p, size) => ({ x: box(p).x + box(p).width + size * 0.16, y: box(p).y + box(p).height - size * 0.2, r: size * 0.11 })
const H = {}
{
	const s3 = BUILT.s3.pieces
	const before = s3.find((p) => p.node.getAttribute('data-beat') === 'before')
	const mine = s3.find((p) => p.kind === 'headline' && p !== before)
	H.how = dotAfter(before, 150)
	H.mine = dotAfter(mine, 150)
	const n4 = BUILT.s4.byKind('number')
	H.n4 = n4.map((p) => markerAfter(p))
	H.bullets = [0, 1, 2, 3].map((i) => ({ x: 86, y: 518 + i * 104, r: 12 }))
	const n6 = BUILT.s6.byKind('number')
	H.n6 = markerAfter(n6[1])
	const n7 = BUILT.s7.byKind('number')
	H.n7 = markerAfter(n7[0])
	H.steps = [0, 1, 2, 3, 4].map((i) => ({ x: 290 + i * 340, y: 560, r: i === 4 ? 44 : 30 }))
	const head9 = BUILT.s9.byKind('headline')[0]
	H.title = dotAfter(head9, 140)
}
const HERO_BORN = 6.85
// stops: the hero sits on a point of a scene (so it moves with that scene's camera) from t0 to t1; between stops it travels
const STOPS = [
	{ k: 's1', p: { x: 1460, y: 560, r: 46 }, t0: HERO_BORN, t1: 9.3 },
	{ k: 's2', p: { x: 1460, y: 560, r: 46 }, t0: 9.3, t1: 14.06 },
	{ k: 's3', p: H.how, t0: 15.2, t1: 18.28 },
	{ k: 's3', p: H.mine, t0: 18.28 + F(8), t1: 20.625 },
	{ k: 's4', p: H.n4[0], t0: 21.5625, t1: 23.15 },
	{ k: 's4', p: H.n4[1], t0: 23.15 + F(8), t1: 24.15 },
	{ k: 's4', p: H.n4[2], t0: 24.15 + F(8), t1: 25.4 },
	{ k: 's4', p: H.n4[0], t0: 25.4 + F(12), t1: 28.125 },
	{ k: 's5', p: H.bullets[0], t0: 29.0625, t1: 31.1 },
	{ k: 's5', p: H.bullets[1], t0: 31.1 + F(8), t1: 32.5 },
	{ k: 's5', p: H.bullets[2], t0: 32.5 + F(8), t1: 33.9 },
	{ k: 's5', p: H.bullets[3], t0: 33.9 + F(8), t1: 40.31 },
	{ k: 's6', p: H.n6, t0: 41.6 + F(10), t1: 50.39 },
	{ k: 's7', p: H.n7, t0: 51.33, t1: 56.25 },
	...H.steps.map((p, i) => ({ k: 's8', p, t0: [57.9, 58.6, 59.3, 60.0, 60.7][i] + (i ? 0 : F(6)), t1: i < 4 ? [58.6, 59.3, 60.0, 60.7][i] - F(8) : 65.16 })),
	{ k: 's9', p: H.title, t0: 66.09, t1: DURATION },
]
function heroAt(t) {
	if (t < HERO_BORN) return null
	for (let i = 0; i < STOPS.length; i++) {
		const s = STOPS[i]
		const at = (st, tt) => { const [x, y] = apply(sceneMap(st.k, tt), st.p.x, st.p.y); return { x, y, r: st.p.r } }
		if (t >= s.t0 && t < s.t1) return at(s, t)
		const n = STOPS[i + 1]
		if (n && t >= s.t1 && t < n.t0) {
			const e = rest(inv(s.t1, n.t0, t))
			const a = at(s, s.t1 - 1e-4), b = at(n, t) // leave from where it was let go, land where the target is now
			return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), r: lerp(a.r, b.r, e) }
		}
	}
	const last = STOPS[STOPS.length - 1]
	const [x, y] = apply(sceneMap(last.k, t), last.p.x, last.p.y)
	return { x, y, r: last.p.r }
}
film.scene('hero', HERO_BORN - 0.01, DURATION, (ctx) => {
	const path = el('path', { fill: C.orange }, ctx.g)
	return (t) => {
		const h = heroAt(t)
		if (!h) { path.setAttribute('display', 'none'); return }
		path.removeAttribute('display')
		path.setAttribute('d', hexPath(h.x, h.y, h.r, h.r * 0.08))
		// born by turning over, like every hex
		const s = ease.outCubic(inv(HERO_BORN, HERO_BORN + F(5), t))
		if (s >= 1) path.removeAttribute('transform')
		else path.setAttribute('transform', `translate(${h.x.toFixed(2)} 0) scale(${Math.max(s, 1e-4).toFixed(4)} 1) translate(${(-h.x).toFixed(2)} 0)`)
	}
}, { post: 0.001 })

/* ---------- sound and bed ---------- */
film.cue(HERO_BORN, 'click', { gain: 0.2, freq: 2800, seed: 31, dry: true })
for (const s of SEAMS) {
	if (s.type === 'zoomIn') film.cue(s.t0, 'whoosh', { dur: s.t1 - s.t0, from: 400, to: 2600, gain: 0.08, panFrom: 0, panTo: 0 })
	if (s.type === 'zoomOut') film.cue(s.t0, 'whoosh', { dur: s.t1 - s.t0, from: 2600, to: 500, gain: 0.08, panFrom: 0, panTo: 0 })
	if (s.type === 'pan') film.cue(s.t0, 'whoosh', { dur: s.t1 - s.t0, from: 800, to: 2000, gain: 0.06, panFrom: s.dir[0] ? 0.6 : 0, panTo: s.dir[0] ? -0.6 : 0 })
	if (s.type === 'morph' || s.type === 'grow') film.cue(s.t1, 'click', { gain: 0.16, freq: 2600, seed: 33, dry: true })
}
const D = [50, 54, 57, 62], Dmaj9 = [50, 54, 61, 64], Bm9 = [47, 54, 57, 61], Gmaj9 = [47, 50, 54, 57], Aadd9 = [49, 52, 57, 59]
const BARS = Math.round(DURATION / (4 * 60 / 128))
const prog = [Bm9, Gmaj9, D, Aadd9, Gmaj9, Aadd9, Dmaj9, Bm9]
const chords = Array.from({ length: BARS }, (_, b) => (b < 3 ? D : b < 11 ? prog[(b - 3) % 4] : prog[4 + ((b - 11) % 4)]))
const ROOT = new Map([[D, 38], [Dmaj9, 38], [Bm9, 35], [Gmaj9, 43], [Aadd9, 45]])
film.music = { bars: BARS, chords, bass: chords.map((c) => ROOT.get(c)), parts: { pad: [[3, BARS]], bass: [[5, BARS]], kick: [[11, BARS - 2]], hat: [[11, BARS - 2]] }, loop: false, voice: [] }
film.board = { film: 'business-software-next', variant: 'test60', meta: { title: 'Business software is next: the one-movie test' } }
window.__test60 = { slots: Object.fromEntries(Object.entries(BUILT).map(([k, b]) => [k, b.anim.slots])), S, SEAMS, STOPS: STOPS.map(({ k, t0, t1 }) => ({ k, t0, t1 })) }
film.start()
