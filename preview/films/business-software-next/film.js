/**
 * "Business software is next": the film of Ruben's talk, as ONE movie (Ruben, 30 Oct 2026, after test60).
 * English, 16:9, 24 fps, 128 BPM, no voice-over, reading pace.
 *
 *   0 to 5.625 s     the shared Conduction opening (_lib/scenes/opening.js)
 *   body             the storyboard's 37 content boards and the four chapters, in one continuous world: no
 *                    screens, no frame edges. The approved stills are the vocabulary; every frame is a moment
 *                    in one move. Scenes hand over by zoom-through, pull-out, motion match, morph, hex wipe and
 *                    the wilded step that grows into the title; every cut carries something across.
 *   then             Built on Nextcloud (lead Buildiq) and the install board (_lib/scenes/closing.js)
 *
 * The device is the hero hex, "you": born from the word "you" in "Do you write code?", it builds every
 * scene (each element appears where it goes) and always rests in a place that means something there:
 * the word "you", a headline's full stop, the marker on the number it counted, the bullet of a strip,
 * the cell it plugs into, the button it presses, the step on a timeline, finally the lead cell of Built
 * on Nextcloud. It is each scene's one orange, so the stills' orange words are white here.
 *
 * Reading pace: a line is readable for 1 s + 0.35 s per word (at least 2 s) after it is up; a UI window
 * is a glance (at most 3.5 s). The plan is computed from the stills themselves (a measuring pass reads
 * each board's slots and words), so the timing follows the storyboard. Every frame is a pure function of
 * time. No rotation, no bounce, no gradients, no shadows.
 */
import { Film, loadFonts, el, textBlock } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene, BUILT_ON_DUR, INSTALL_DUR } from '../_lib/scenes/closing.js'
import { timeline, wordCount } from '../_lib/timeline.js'
import { inv, lerp, mix, hexPath, ease } from '../_lib/core.js'
import { curve, F } from '../_lib/motion.js'
import { hex, honeyAt } from '../_lib/ui.js'
import { boards } from './boards/talk/board.js'
import { animateBoard, parseNum, formatNum } from './animate.js'

const SLUG = 'business-software-next'
const BOARD = Object.fromEntries(boards.map((b) => [b.id, b]))
const camera = curve('camera'), rest = curve('rest'), leave = curve('leave')
const CX = 960, CY = 540
const ZOOM_R = 1300 // a nested scene sits in a hex this big in its own coordinates: it covers the frame
const G0 = timeline({ bpm: 128, fps: 24 }).grid
const ceilBeat = (t) => G0.beatAt(Math.ceil(t / G0.spb - 1e-6))
const ceilBar = (t) => G0.barAt(Math.ceil(t / G0.bar - 1e-6))
const readFor = (words) => Math.max(2, 1 + 0.35 * words)
const GROUND = { cobalt: C.cobalt, light: C.cobalt50, white: C.white }
const CLOSE = { lead: 'buildiq', lang: 'en' }

/* ---------- the scenes in order: how the hero builds and rests, and the seam that brings each in ---------- */
const at = (cx, cy, r, gap) => honeyAt(cx, cy, r, gap)
const cellOf = (h, q, r, rad) => { const [x, y] = h(q, r); return { x, y, r: rad } }
const WHO = at(1460, 560, 46, 8)
const OPEN_WS = at(1400, 540, 112, 14)
const SUITE_WS = at(1400, 540, 62, 12)
const CORE = { x: 1560, y: 300, r: 40, gap: 6 }
// selectors for the pieces a seam carries across (B is a built scene)
const sel = {
	number: (i) => (B) => B.byKind('number')[i],
	strip: (i) => (B) => B.pieces.filter((p) => p.kind === 'rect' && p.box.height <= 100 && p.box.width >= 500)[i],
	rectNear: (x, y) => (B) => B.pieces.filter((p) => p.kind === 'rect' && p.area > 20000).sort((a, b) => Math.hypot(a.box.x - x, a.box.y - y) - Math.hypot(b.box.x - x, b.box.y - y))[0],
	hexNear: (x, y) => (B) => B.pieces.filter((p) => p.kind === 'hex').sort((a, b) => Math.hypot(a.cx - x, a.cy - y) - Math.hypot(b.cx - x, b.cy - y))[0],
}
// describe-review-use: each dialog's primary button (Create app, Create app, Open app), as the board draws them
const BUTTONS = [{ x: 356, y: 887, r: 14 }, { x: 888, y: 887, r: 14 }, { x: 1714, y: 887, r: 16 }]

const SCENES = [
	{ id: 'who-codes', rest: { word: 'you' }, seam: { type: 'open' } },
	{ id: 'who-patched', rest: { word: 'you' }, seam: { type: 'swap' }, spec: { bg: 'hold' } },
	{ id: 'fun-week', rest: { stop: true }, seam: { type: 'zoomIn', anchor: { ...cellOf(WHO, -4, 0, 46), tint: 0.35, tintFill: C.cobalt400 } } },
	{ id: 'wordpress-week', rest: { marker: 0 }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'headlines', rest: { bullet: 0 }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'core-vs-ecosystem', rest: { marker: 1 }, seam: { type: 'zoomOut', target: { x: CORE.x, y: CORE.y, r: CORE.r, fill: C.cobalt600 } }, cluster: true, caption: 'Citizen coders will not patch every week. The platform has to do it for them', noVisit: (s) => s.kind === 'run' || s.items[0].kind === 'copy' },
	{ id: 'wordpress-share', rest: { marker: 0 }, seam: { type: 'morph' }, spec: { skip: (p) => p.kind === 'number' } },
	{ id: 'wilded', rest: { orangeCell: true }, seam: { type: 'carry', from: sel.number(0), to: sel.hexNear(290, 560) } },
	{ id: 'title', rest: { stop: true }, seam: { type: 'grow' } },
	{ id: 'suite-vs-workspace', chapter: 'section-01', rest: { orangeCell: true }, seam: { type: 'zoomIn', anchor: { fromRest: true, r: 14, portal: true } }, memberVisits: true },
	{ id: 'office-landscape', rest: { stop: true }, seam: { type: 'zoomIn', anchor: { ...cellOf(SUITE_WS, -1, 1, 62), tint: 0.25, tintFill: C.white } }, runVisits: true },
	{ id: 'workspace-landscape', rest: { stop: true }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'gates-quote', rest: { stop: true }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'open-workspace', rest: { stop: true }, seam: { type: 'zoomOut', target: { ...cellOf(OPEN_WS, 0, -1, 112), fill: mix(C.cobalt, C.white, 0.15) } }, runVisits: true },
	{ id: 'office-vs-business', rest: { stop: true }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'power-platform', chapter: 'section-02', rest: { marker: 2 }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'buyout', rest: { bullet: 1 }, seam: { type: 'carry', from: sel.number(2), to: sel.strip(0) } },
	{ id: 'cloud-act', rest: { stop: true }, seam: { type: 'wipe' } },
	{ id: 'out-hire', rest: { marker: 2 }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'angry-citizens', rest: { stop: true }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'sanne', rest: { point: { x: 1770, y: 688, r: 14 } }, seam: { type: 'zoomIn', anchor: { x: 1620, y: 300, r: 72, tint: 0.06, tintFill: C.cobalt400 } } },
	{ id: 'yusuf', rest: { stop: true }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'two-things', rest: { stop: true }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'framework-basics', chapter: 'section-03', rest: { point: { x: 1140, y: 134, r: 26 } }, seam: { type: 'wipe' } },
	{ id: 'describe-review-use', rest: { point: BUTTONS[2] }, seam: { type: 'carry', from: sel.rectNear(900, 290), to: sel.rectNear(120, 452) }, visitAt: { 3: BUTTONS[0], 4: BUTTONS[1], 5: BUTTONS[2] }, noVisit: (s) => s.items.every((p) => p.kind === 'eyebrow') },
	{ id: 'manifest', rest: { stop: true }, seam: { type: 'zoomIn', anchor: { ...BUTTONS[2], r: 30, portal: true } }, memberVisits: true },
	{ id: 'one-data-layer', rest: { point: { x: 86, y: 686, r: 12 } }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'evidence', rest: { marker: 0 }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'common-core', rest: { point: { x: 866, y: 852, r: 12 } }, seam: { type: 'carry', from: sel.number(2), to: sel.rectNear(900, 130) } },
	{ id: 'honest-limits', rest: { marker: 0 }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'where-it-wins', rest: { point: { x: 1034, y: 710, r: 16 } }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'store-growth', chapter: 'section-04', rest: { point: { x: 1462, y: 512, r: 16 } }, seam: { type: 'pan', dir: [0, 1] }, steps: true },
	{ id: 'store-find', rest: { stop: true }, seam: { type: 'zoomIn', anchor: { x: 1540, y: 820, r: 36, tint: 0.5, tintFill: C.cobalt400 } } },
	{ id: 'who-pays', rest: { point: { x: 739, y: 602, r: 12 } }, seam: { type: 'wipe' } },
	{ id: 'ip-stake', rest: { stop: true }, seam: { type: 'pan', dir: [0, 1] } },
	{ id: 'three-questions', rest: { stop: true }, seam: { type: 'pan', dir: [1, 0] } },
	{ id: 'final-line', rest: { stop: true }, seam: { type: 'pan', dir: [0, 1] } },
]
SCENES.forEach((s, i) => { s.board = BOARD[s.id]; s.k = `s${i}`; s.i = i; s.ground = 'cobalt' })
const SEAM_DUR = { open: 0, swap: 0.33, zoomIn: 1.41, zoomOut: 1.41, pan: 0.94, morph: 0.94, wipe: 1.17, grow: 0.94, carry: 1.17 }

/* ---------- changes the film makes to a still before it is read (the storyboard never sees them) ---------- */
const isOrange = (n) => (n.getAttribute('fill') || '').toUpperCase() === C.orange.toUpperCase()
const isFill = (n, c) => (n.getAttribute('fill') || '').toUpperCase() === c.toUpperCase()
const unlight = (n) => { n.setAttribute('fill', C.cobalt400); n.setAttribute('fill-opacity', 0.35); n.removeAttribute('data-anim') }
const DARK_INK = [C.cobalt, C.cobalt900, C.cobalt800, C.cobalt700]
/**
 * A still drawn on a light or white ground is moved onto the one cobalt world: its ground goes, its
 * loose type turns to the cobalt-ground inks, cobalt shapes turn cobalt-600. Product windows, panels
 * and white cells keep their own colours (they are things on the ground, not the ground).
 */
function toCobalt(cam) {
	const first = cam.firstElementChild
	if (!(first?.tagName === 'rect' && +first.getAttribute('width') >= 1920 && (isFill(first, C.white) || isFill(first, C.cobalt50)))) return false
	first.remove()
	const kids = [...cam.children]
	const panels = kids.filter((n) => (n.tagName === 'rect' || n.tagName === 'path') && (isFill(n, C.white) || isFill(n, C.cobalt50)) && n.getBBox().width >= 120 && n.getBBox().height >= 60).map((n) => ({ n, b: n.getBBox(), i: kids.indexOf(n) }))
	const inPanel = (n) => { const b = n.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2, i = kids.indexOf(n); return panels.some((p) => p.i < i && cx >= p.b.x && cx <= p.b.x + p.b.width && cy >= p.b.y && cy <= p.b.y + p.b.height) }
	for (const n of kids) {
		if (n.tagName === 'clipPath' || inPanel(n)) continue
		const isText = n.tagName === 'g' && n.querySelector('text') && [...n.querySelectorAll('*')].every((e) => e.tagName === 'g' || e.tagName === 'text')
		if (isText) {
			for (const t of n.querySelectorAll('text')) {
				if (DARK_INK.some((c) => isFill(t, c))) t.setAttribute('fill', C.white)
				else if (isFill(t, C.cobalt400)) t.setAttribute('fill', C.cobalt200)
			}
		} else if ((n.tagName === 'rect' || n.tagName === 'path') && isFill(n, C.cobalt)) n.setAttribute('fill', C.cobalt600)
	}
	return true
}
function afterDraw(sc) {
	return (cam) => {
		toCobalt(cam)
		// an orange word takes the ink of its own line
		for (const n of cam.querySelectorAll('text')) {
			if (!isOrange(n)) continue
			const block = n.parentNode?.parentNode
			const sib = block && [...block.querySelectorAll('text')].find((x) => !isOrange(x))
			n.setAttribute('fill', sib ? sib.getAttribute('fill') : C.white)
		}
		for (const p of cam.querySelectorAll('path')) {
			if (!isOrange(p)) continue
			if (sc.id === 'who-codes' || sc.id === 'who-patched') unlight(p)
			else p.setAttribute('fill-opacity', 0) // the hero takes this cell's place
		}
		// ip-stake: the hero is the bullet, so the drawn bullets go
		if (sc.id === 'ip-stake') for (const p of cam.querySelectorAll(':scope > path')) { const b = p.getBBox(); if (b.height < 24) p.setAttribute('fill-opacity', 0) }
		if (sc.rest.stop) {
			// the hero is the headline's full stop
			const heads = [...cam.querySelectorAll('text')].filter((n) => +n.getAttribute('font-weight') === 700 && +n.getAttribute('font-size') >= 64)
			const last = heads[heads.length - 1]
			if (last && /\.$/.test(last.textContent)) last.textContent = last.textContent.slice(0, -1)
		}
		if (sc.cluster) {
			const h = honeyAt(CORE.x, CORE.y, CORE.r, CORE.gap)
			for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
				const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))
				if (d > 2) continue
				const [x, y] = h(q, r)
				hex(cam, x, y, CORE.r, d === 0 ? C.cobalt600 : C.cobalt400, CORE.r * 0.1, { 'fill-opacity': d === 0 ? 1 : 0.5 - d * 0.12 })
			}
		}
		if (sc.caption) textBlock(cam, sc.caption, { x: 120, y: 930, size: 36, weight: 600, fill: C.cobalt200, tracking: -0.01, maxWidth: 1600, lineHeight: 1.2, clip: false })
	}
}

/* ---------- the measuring pass: each still's slots and words, so the plan reads the storyboard ---------- */
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: 600, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
film.langs = ['en']
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

const textWords = (p) => wordCount([p, ...(p.members || [])].map((q) => q.node.textContent && q.node.querySelectorAll ? [...q.node.querySelectorAll('text')].map((n) => n.textContent).join(' ') : '').join(' '))
const probe = el('g', {}, film.root)
for (const sc of SCENES) {
	const g = el('g', {}, probe)
	const ctx = { g, film, W: 1920, H: 1080, defs: film.defs, cue: () => {} }
	const a = animateBoard(ctx, sc.board, { start: 0, dur: 30, lead: 0.5, voice: 20, wordAt: () => null, spec: { ...(sc.spec || {}), skip: undefined }, orange: C.orange, afterDraw: afterDraw(sc) })
	sc.introWords = a.intro.filter((p) => p.kind === 'headline').reduce((n, p) => n + p.node.querySelectorAll('text').length, 0)
	sc.introEndL = a.introEnd
	sc.slotRead = a.slotList.map((s) => {
		const big = s.items.some((p) => (p.members || []).length > 6 || p.area > 250000)
		const words = s.items.reduce((n, p) => n + textWords(p), 0)
		const run = s.kind === 'run'
		const sizes = s.items.flatMap((p) => [...p.node.querySelectorAll('text')].map((n) => +n.getAttribute('font-size')))
		const small = sizes.length && Math.max(...sizes) <= 34 // supporting copy: read at a glance, not word by word
		return run ? 1.4 : big ? Math.min(3, readFor(words)) : small ? Math.min(4, Math.max(2, 1 + 0.22 * words)) : Math.min(5, readFor(words))
	})
	g.remove()
}
probe.remove()

/* ---------- the plan: seam, clock, slot times and when the scene can leave ---------- */
let t = OPENING.duration
const LAST = SCENES.length - 1
SCENES.forEach((sc, i) => {
	const D = SEAM_DUR[sc.seam.type]
	sc.seam.t0 = i === 0 ? t : t
	sc.seam.t1 = t + D
	sc.from = sc.seam.t0
	// the scene's own time 0: it starts building while it travels in, so it is never seen empty
	const lead = { open: -F(2), swap: 0.5, zoomIn: D * 0.35, zoomOut: D * 0.75, pan: 0.15, morph: 0.1, wipe: 0, grow: D - F(1), carry: D * 0.5 }[sc.seam.type]
	sc.clock = t + lead
	const introRead = sc.introWords ? readFor(sc.introWords) : 0
	let tl = Math.max(0.4, sc.introEndL - F(2)) // local time of the first slot
	sc.slotAt = sc.slotRead.map((r) => { const s = tl; tl += Math.min(1.5, Math.max(0.55, r * 0.3)); return s })
	let ready = Math.max(0.6 + introRead, ...sc.slotAt.map((s, j) => s + 0.35 + sc.slotRead[j]))
	if (sc.id === 'who-codes') { sc.birth = 1.1; ready = Math.max(ready, 3.2) }
	if (sc.id === 'who-patched') ready = Math.max(ready, 4.0)
	if (sc.id === 'fun-week') { sc.cut = 0.6 + readFor(4) ; ready = sc.cut + 2.2 }
	if (sc.id === 'one-data-layer') ready = Math.min(ready, 12)
	if (sc.id === 'final-line') ready = Math.min(ready, Math.max(0.6 + introRead, 4.2))
	if (sc.steps) { sc.slotAt = sc.slotAt.map((s, j) => 0.9 + j * 1.6); ready = 0.9 + 3 * 1.6 + 3.2 }
	sc.restAt = (sc.slotAt.length ? sc.slotAt[sc.slotAt.length - 1] + 0.7 : Math.max(0.5, sc.introEndL))
	ready = Math.max(ready, sc.restAt + 1.2)
	t = ceilBeat(sc.clock + ready)
	if (i === LAST) t = ceilBar(t + 0.6)
	sc.to = t
})
const BODY_END = SCENES[LAST].to
SCENES.forEach((sc, i) => {
	const next = SCENES[i + 1]
	sc.out = next ? next.seam : null
	sc.until = next ? next.seam.t1 : BODY_END
})
const DURATION = BODY_END + BUILT_ON_DUR + INSTALL_DUR
film.duration = DURATION

/* ---------- each scene's camera: a slow lateral drift while it is read, the seams around it ---------- */
function drift(sc, t) {
	const a = sc.seam.t1, b = sc.out ? sc.out.t0 : sc.to
	const u = inv(a, b, t)
	const s = 1 + 0.012 * Math.sin(Math.PI * u) ** 2
	const dx = -26 * (u - 0.5) * Math.sin(Math.PI * u) ** 2 * 2 // drifts left and back to rest at the seams
	return { X: CX - s * CX + dx, Y: CY - s * CY, s }
}
const compose = (m, n) => ({ X: m.X + m.s * n.X, Y: m.Y + m.s * n.Y, s: m.s * n.s })
const apply = (m, x, y) => [m.X + m.s * x, m.Y + m.s * y]
const ID = { X: 0, Y: 0, s: 1 }
function zoomPair(e, anchor, innerDrift) {
	const Z = ZOOM_R / anchor.r
	const z = Math.pow(Z, e)
	const px = lerp(anchor.x, CX, e), py = lerp(anchor.y, CY, e)
	return { outer: { X: px - z * anchor.x, Y: py - z * anchor.y, s: z }, inner: compose({ X: px - (z / Z) * CX, Y: py - (z / Z) * CY, s: z / Z }, innerDrift) }
}
function sceneMap(sc, t) {
	const m = drift(sc, t)
	const o = sc.out, inn = sc.seam
	const isA = o && t >= o.t0 && t < o.t1
	const seam = isA ? o : t >= inn.t0 && t < inn.t1 ? inn : null
	if (!seam) return m
	const u = inv(seam.t0, seam.t1, t)
	if (seam.type === 'pan') {
		const e = camera(u)
		const D = seam.dir[1] ? 1280 : 2120
		const dx = seam.dir[0] * D, dy = seam.dir[1] * D
		return isA ? compose({ X: -dx * e, Y: -dy * e, s: 1 }, m) : compose({ X: dx * (1 - e), Y: dy * (1 - e), s: 1 }, m)
	}
	if (seam.type === 'zoomIn') {
		const { outer, inner } = zoomPair(camera(u), seam.anchor, ID)
		return isA ? compose(outer, m) : inner
	}
	if (seam.type === 'zoomOut') {
		const { outer, inner } = zoomPair(1 - camera(u), seam.target, isA ? m : ID)
		return isA ? inner : outer
	}
	return m
}

/* ---------- the hex wipe: the scene's own cells turn over from the hero, cover, and turn back in the next ground ---------- */
const WIPE_R = 84
const wipeLattice = (() => {
	const cells = []
	const h = honeyAt(CX, CY, WIPE_R, 0)
	for (let r = -8; r <= 8; r++) for (let q = -14; q <= 14; q++) {
		const [x, y] = h(q, r)
		if (x < -WIPE_R || x > 1920 + WIPE_R || y < -WIPE_R || y > 1080 + WIPE_R) continue
		cells.push({ x, y })
	}
	return cells
})()

/* ---------- build the scenes ---------- */
const BUILT = {}
const hexClip = el('clipPath', { id: 'bsn-zoom-clip' }, film.defs)
el('path', { d: hexPath(CX, CY, ZOOM_R, 0) }, hexClip)
addOpening(film, { at: 0 })

const drawOrder = [...SCENES]
// a scene that shrinks into the next one draws above it
for (let i = 0; i < SCENES.length - 1; i++) if (SCENES[i + 1].seam.type === 'zoomOut') { const a = drawOrder.indexOf(SCENES[i]), b = drawOrder.indexOf(SCENES[i + 1]); drawOrder.splice(a, 1); drawOrder.splice(b, 0, SCENES[i]) }

for (const sc of drawOrder) {
	film.scene(sc.k, sc.from, sc.until, (ctx) => {
		ctx.g.setAttribute('display', 'inline')
		const xf = el('g', { 'data-scene-xf': sc.id }, ctx.g)
		const backdrop = el('path', { d: hexPath(CX, CY, ZOOM_R, 0), fill: GROUND[sc.ground], display: 'none' }, xf)
		const holder = el('g', {}, xf)
		const spec = { ...(sc.spec || {}), at: sc.slotAt }
		if (sc.id === 'who-patched') Object.assign(spec, { lightAt: 1.2, lightSpan: 1.4 })
		if (sc.id === 'final-line') Object.assign(spec, { lightAt: 0.6, lightSpan: 1.6, bgSpread: 0.5 })
		const wordAt = (w) => (sc.id === 'fun-week' && w === 'Mine' ? sc.cut + F(1) : null)
		if (sc.id === 'fun-week') spec.beatWord = 'Mine'
		if (sc.steps) spec.stepWords = ['a', 'b', 'c', 'd']
		const stepAt = (w) => ({ a: sc.slotAt[0], b: sc.slotAt[1], c: sc.slotAt[2], d: sc.slotAt[3] }[w] ?? null)
		const anim = animateBoard(Object.assign(Object.create(ctx), { g: holder }), sc.board, {
			start: sc.clock, dur: sc.to - sc.clock, lead: 0.5, voice: sc.to - sc.clock - 1, wordAt: sc.steps ? stepAt : wordAt,
			spec, orange: C.orange, seed: Math.round(sc.clock * 100), afterDraw: afterDraw(sc),
		})
		for (const { at: a, kind, ...o } of anim.cues) film.cue(sc.clock + a, kind, o)
		const B = { xf, backdrop, holder, anim, pieces: anim.pieces, byKind: (kind) => anim.pieces.filter((p) => p.kind === kind) }
		BUILT[sc.k] = B
		// a chapter is a label in the world: its number and title sit at the top of the row's first scene, built with it
		let chapter = null
		if (sc.chapter) {
			const [num, ...rest] = BOARD[sc.chapter].title.split(' · ')
			const cg = el('g', { 'data-part': 'chapter' }, xf)
			const n = textBlock(cg, num, { x: 120, y: 120, size: 44, weight: 500, family: 'IBM Plex Mono', fill: C.white, tracking: -0.02, clip: false })
			const tb = textBlock(cg, rest.join(' · '), { x: 120 + n.width + 30, y: 120, size: 34, weight: 600, fill: C.cobalt200, tracking: -0.01, clip: false })
			chapter = [...n.items, ...tb.items]
		}
		// a scene's words and panels leave before the camera zooms through it, so nothing flies past or flashes white
		const words = anim.pieces.filter((p) => !['hex', 'field', 'step'].includes(p.kind)).flatMap((p) => [p, ...(p.members || [])]) // everything but the honeycomb the camera dives into
		ctx.g.removeAttribute('display')
		return (tt) => {
			anim.update(tt - sc.clock)
			if (sc.out && sc.out.type === 'zoomIn') leaveAll(words, sc.out.t0 - 0.35, tt)
			if (chapter) chapter.forEach((it, i) => {
				const e = curve('arrive')(inv(sc.clock - F(3) + i * F(1), sc.clock - F(3) + i * F(1) + F(8), tt))
				if (e >= 1) it.node.removeAttribute('transform')
				else it.node.setAttribute('transform', `translate(0 ${((1 - e) * 40).toFixed(2)})`)
				it.node.setAttribute('opacity', Math.min(1, e * 1.5).toFixed(3))
			})
			const m = sceneMap(sc, tt)
			xf.setAttribute('transform', `translate(${m.X.toFixed(2)} ${m.Y.toFixed(2)}) scale(${m.s.toFixed(5)})`)
			// nested in a cell during a zoom: clipped to the cell, on a ground that turns from the cell's colour to its own
			const zin = sc.seam.type === 'zoomIn' && tt >= sc.seam.t0 && tt < sc.seam.t1 ? sc.seam : null
			const zout = sc.out && sc.out.type === 'zoomOut' && tt >= sc.out.t0 && tt < sc.out.t1 ? sc.out : null
			if (zin || zout) {
				const s = zin || zout
				const u = inv(s.t0, s.t1, tt)
				xf.setAttribute('clip-path', 'url(#bsn-zoom-clip)')
				backdrop.removeAttribute('display')
				if (zin) {
					const cell = zin.anchor.portal ? GROUND[sc.ground] : mix(GROUND[SCENES[sc.i - 1].ground], zin.anchor.tintFill, zin.anchor.tint)
					backdrop.setAttribute('fill', mix(cell, GROUND[sc.ground], Math.min(1, camera(u) * 1.4)))
					holder.removeAttribute('opacity')
				} else {
					// shrinking into the next scene's cell: it settles into that cell's colour, its content goes quiet
					const p = camera(u)
					backdrop.setAttribute('fill', mix(GROUND[sc.ground], zout.target.fill, Math.min(1, Math.max(0, (p - 0.35) / 0.55))))
					holder.setAttribute('opacity', (1 - Math.min(1, Math.max(0, (p - 0.45) / 0.45))).toFixed(3))
				}
			} else {
				xf.removeAttribute('clip-path')
				backdrop.setAttribute('display', 'none')
				holder.removeAttribute('opacity')
			}
			// a hex wipe: hide this scene once the cells cover it (outgoing), or until they do (incoming)
			const hidIn = sc.seam.type === 'wipe' && tt < (sc.seam.t0 + sc.seam.t1) / 2
			const hidOut = (sc.out && sc.out.type === 'wipe' && tt >= (sc.out.t0 + sc.out.t1) / 2) || (sc.out && sc.out.type === 'carry' && tt >= sc.out.t1)
			if (hidIn || hidOut) xf.setAttribute('display', 'none')
			else xf.removeAttribute('display')
			B.after?.(tt)
		}
	})
}

/* ---------- pieces the seams move by hand ---------- */
const leaveAll = (roots, t0, t) => {
	const pieces = roots.flatMap((p) => [p, ...(p.members || [])].filter((q, i, a) => a.indexOf(q) === i))
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
const find = (id) => SCENES.find((s) => s.id === id)

// swap: who-codes' line leaves upward as who-patched's rises over the same honeycomb
{
	const a = find('who-codes'), b = find('who-patched')
	BUILT[a.k].after = (t) => leaveAll(BUILT[a.k].byKind('headline'), b.seam.t0 - 0.2, t)
}
// morph: core-vs-ecosystem's numbers roll and slide into wordpress-share's
{
	const a = find('core-vs-ecosystem'), b = find('wordpress-share'), seam = b.seam
	const A = BUILT[a.k], Bq = BUILT[b.k]
	const nA = A.byKind('number'), nB = Bq.byKind('number')
	const pairs = nA.map((p, i) => {
		const q = nB[i], na = firstText(p), nb = firstText(q)
		return { p, na, nb, from: itemPos(na), to: itemPos(nb), fa: parseNum(na.textContent), fb: parseNum(nb.textContent), others: [...p.node.querySelectorAll('text')].filter((n) => n !== na) }
	})
	A.after = (t) => {
		leaveAll(A.pieces.filter((p) => !nA.includes(p)), seam.t0 - 0.3, t)
		if (t < seam.t0) return
		const u = inv(seam.t0, seam.t1, t), e = rest(u)
		for (const pr of pairs) {
			const k = lerp(1, pr.to.size / pr.from.size, e)
			pr.p.w.setAttribute('transform', `translate(${lerp(pr.from.x, pr.to.x, e).toFixed(2)} ${lerp(pr.from.y, pr.to.y, e).toFixed(2)}) scale(${k.toFixed(4)}) translate(${(-pr.from.x).toFixed(2)} ${(-pr.from.y).toFixed(2)})`)
			pr.na.textContent = formatNum(pr.fb, lerp(pr.fa.value, pr.fb.value, ease.inOutCubic(u)))
			pr.others.forEach((n) => n.setAttribute('display', u > 0.3 ? 'none' : 'inline'))
		}
	}
	Bq.after = (t) => { for (const q of nB) q.w.setAttribute('display', t < seam.t1 ? 'none' : 'inline') }
}
// grow: wilded's last step, "Business software", grows into the title's first two words
{
	const a = find('wilded'), b = find('title'), seam = b.seam
	const A = BUILT[a.k], Bq = BUILT[b.k]
	const label = A.pieces.find((p) => p.node.textContent.replace(/\s/g, '') === 'Businesssoftware')
	const head = Bq.byKind('headline')[0]
	const from = [...label.node.querySelectorAll('text')]
	const to = [...head.node.querySelectorAll('text')].slice(0, 2)
	A.after = (t) => {
		leaveAll(A.pieces.filter((p) => p !== label), seam.t0 - 0.25, t)
		if (t < seam.t0) return
		const u = inv(seam.t0, seam.t1, t)
		const e1 = rest(inv(0, 0.35, u)), e2 = camera(inv(0.25, 1, u))
		const a0 = itemPos(from[0]), a1 = itemPos(from[1]), b0 = itemPos(to[0])
		const K = b0.size / a0.size
		const beside = { x: a0.x + (itemPos(to[1]).x - b0.x) / K, y: a0.y }
		const k = Math.exp(lerp(0, Math.log(K), e2))
		const ox = lerp(a0.x, b0.x, e2), oy = lerp(a0.y, b0.y, e2)
		from[0].setAttribute('transform', `translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${k.toFixed(4)}) translate(${(-a0.x).toFixed(2)} ${(-a0.y).toFixed(2)})`)
		const sx = lerp(a1.x, beside.x, e1), sy = lerp(a1.y, beside.y, e1)
		from[1].setAttribute('transform', `translate(${(ox + (sx - a0.x) * k).toFixed(2)} ${(oy + (sy - a0.y) * k).toFixed(2)}) scale(${k.toFixed(4)}) translate(${(-a1.x).toFixed(2)} ${(-a1.y).toFixed(2)})`)
	}
	Bq.after = (t) => to.forEach((n) => {
		if (t < seam.t1) n.setAttribute('display', 'none')
		else { n.removeAttribute('display'); n.removeAttribute('transform') }
	})
}

// carry: one element of a scene travels and becomes an element of the next; the rest leaves before it lands
for (const b of SCENES.filter((x) => x.seam.type === 'carry')) {
	const a = SCENES[b.i - 1], seam = b.seam
	const A = BUILT[a.k], Bq = BUILT[b.k]
	const from = seam.from(A), to = seam.to(Bq)
	if (!from || !to) { console.error('carry: no piece for', b.id); continue }
	const fc = { x: from.box.x + from.box.width / 2, y: from.box.y + from.box.height / 2 }, tc = { x: to.box.x + to.box.width / 2, y: to.box.y + to.box.height / 2 }
	const K = Math.min(4, Math.max(0.25, to.box.height / Math.max(1, from.box.height)))
	const prevA = A.after, prevB = Bq.after
	A.after = (t) => {
		prevA?.(t)
		leaveAll(A.pieces.filter((p) => p !== from && p.kind !== 'field'), seam.t0 - 0.3, t)
		if (t < seam.t0) return
		const e = rest(inv(seam.t0, seam.t1, t))
		const k = Math.exp(lerp(0, Math.log(K), e))
		for (const q of [from, ...(from.members || [])]) {
			q.w.setAttribute('transform', `translate(${lerp(fc.x, tc.x, e).toFixed(2)} ${lerp(fc.y, tc.y, e).toFixed(2)}) scale(${k.toFixed(4)}) translate(${(-fc.x).toFixed(2)} ${(-fc.y).toFixed(2)})`)
			q.w.setAttribute('opacity', (1 - inv(0.75, 1, inv(seam.t0, seam.t1, t))).toFixed(3))
		}
	}
	Bq.after = (t) => { prevB?.(t); if (t < seam.t1 - F(3)) to.w.setAttribute('display', 'none'); else to.w.removeAttribute('display') }
}

/* ---------- the hero: where it builds, where it rests ---------- */
const heroRest = (sc) => {
	const B = BUILT[sc.k], r = sc.rest
	const boxOf = (p) => p.box
	if (r.point) return r.point
	if (r.word) {
		const n = [...B.holder.querySelectorAll('text')].find((x) => x.textContent === r.word)
		const b = n.getBBox(), size = +n.getAttribute('font-size')
		return { x: b.x + b.width / 2, y: +n.getAttribute('y') - size * 0.34, r: size * 0.36, node: n }
	}
	if (r.stop) {
		const heads = B.byKind('headline')
		const h = heads[heads.length - 1]
		const items = [...h.node.querySelectorAll('text')]
		const last = items[items.length - 1]
		const size = +last.getAttribute('font-size')
		const bb = last.getBBox()
		return { x: bb.x + bb.width + size * 0.16, y: +last.getAttribute('y') - size * 0.13, r: Math.max(9, size * 0.11) }
	}
	if (r.marker != null) {
		const p = B.byKind('number')[r.marker]
		const b = boxOf(p)
		return { x: b.x + b.width + 20, y: b.y + b.height * 0.55, r: 14 }
	}
	if (r.bullet != null) {
		const strips = B.pieces.filter((p) => p.kind === 'rect' && p.box.height <= 100 && p.box.width >= 500)
		const b = strips[r.bullet].box
		return { x: b.x - 30, y: b.y + b.height / 2, r: 12 }
	}
	if (r.orangeCell) {
		const p = [...B.holder.querySelectorAll('path')].find((x) => x.getAttribute('fill-opacity') === '0' && (x.getAttribute('fill') || '').toUpperCase() === C.orange.toUpperCase())
		const b = p.getBBox()
		return { x: b.x + b.width / 2, y: b.y + b.height / 2, r: b.height / 2 }
	}
	return { x: 120, y: 900, r: 12 }
}
// measure while every scene is shown, untransformed
film.root.querySelectorAll('[data-scene]').forEach((g) => g.setAttribute('display', 'inline'))
const STOPS = []
for (const sc of SCENES) {
	const B = BUILT[sc.k]
	B.xf.removeAttribute('transform')
	const restP = heroRest(sc)
	sc.restP = restP
	// building: the hero goes to each element as it enters and touches it there, so each element appears where it goes
	const visits = []
	if (!['who-codes', 'who-patched', 'fun-week'].includes(sc.id)) B.anim.slotList.forEach((s, j) => {
		if (sc.noVisit?.(s)) return
		const at0 = sc.clock + s.at
		const push = (x, y, r, t) => { if (Number.isFinite(x) && Number.isFinite(y)) visits.push({ x, y, r, at: t }) }
		if (sc.visitAt?.[j]) { const v = sc.visitAt[j]; push(v.x, v.y, v.r, at0 + 0.35); return }
		const p = s.items[0]
		if (s.kind === 'step') {
			const ng = p.node.querySelector(':scope > g'); const b = ng.getBBox()
			push(b.x + b.width + 22, b.y + b.height * 0.55, 14, at0 + 0.6)
			return
		}
		if (s.kind === 'run') {
			const items = [...s.items].sort((a, b) => a.cx - b.cx || a.cy - b.cy)
			const span = Math.min(sc.spec?.runSpan ?? 1.4, items.length * F(1.5))
			const pick = sc.runVisits ? items.filter((_, k) => k % Math.max(1, Math.ceil(items.length / 7)) === 0) : [items[0]]
			pick.forEach((c) => push(c.cx, c.cy, Math.min(26, c.box.height * 0.22), at0 + (span * items.indexOf(c)) / items.length))
			return
		}
		if (p.kind === 'number') { push(p.box.x + p.box.width + 20, p.box.y + p.box.height * 0.55, 14, at0); return }
		if (p.kind === 'rect' && p.box.height <= 100 && p.box.width >= 500) { push(p.box.x - 30, p.box.y + p.box.height / 2, 12, at0); return }
		if (p.kind === 'rect' && p.box.height <= 8) { push(p.box.x, p.box.y + p.box.height / 2, 10, at0); return }
		const mem = p.members || []
		if (mem.length) {
			const fillGap = Math.min(F(2), 1.0 / mem.length)
			const dot = mem.find((m) => m.kind === 'hex' && m.box.height <= 40)
			if (dot) { push(dot.cx, dot.cy, dot.box.height / 2, at0 + F(10)); return }
			if (sc.memberVisits && mem.length >= 3) {
				const pick = mem.filter((_, k) => k % Math.max(1, Math.ceil(mem.length / 8)) === 0)
				pick.forEach((m) => {
					const k = mem.indexOf(m), mt = at0 + F(6) + k * fillGap
					const text = m.kind === 'copy' || m.kind === 'eyebrow' || m.kind === 'headline'
					push(text ? m.box.x + m.box.width + 12 : m.cx, m.cy, 11, mt)
				})
				return
			}
			push(p.box.x + 18, p.box.y + 18, 12, at0)
			return
		}
		if (p.kind === 'hex') { push(p.cx, p.cy, Math.min(30, p.box.height * 0.22), at0); return }
		const size = p.text?.size || 30
		push(Math.max(40, p.box.x - 24), p.box.y + Math.min(p.box.height, size) * 0.55, 10, at0)
	})
	visits.sort((a, b) => a.at - b.at)
	visits.forEach((v, j) => STOPS.push({ sc, p: v, t0: v.at, t1: visits[j + 1]?.at ?? sc.clock + sc.restAt }))
	const r0 = sc.id === 'who-codes' ? sc.clock + sc.birth : sc.id === 'fun-week' ? sc.clock + 0.9 : visits.length ? sc.clock + sc.restAt : Math.max(sc.seam.t1, sc.clock + sc.restAt)
	STOPS.push({ sc, p: restP, t0: r0, t1: sc.out ? sc.out.t0 + (sc.out.type === 'zoomIn' || sc.out.type === 'wipe' ? 0.15 : 0) : BODY_END, rest: true })
	if (sc.id === 'fun-week') {
		// two beats: the cursor after the question, then the full stop of the answer
		const before = B.pieces.find((p) => p.node.getAttribute('data-beat') === 'before')
		const items = [...before.node.querySelectorAll('text')]
		const last = items[items.length - 1], bb = last.getBBox(), size = +last.getAttribute('font-size')
		const how = { x: bb.x + bb.width + size * 0.16, y: +last.getAttribute('y') - size * 0.13, r: size * 0.11 }
		const restStop = STOPS.pop()
		STOPS.push({ sc, p: how, t0: sc.clock + 0.9, t1: sc.clock + sc.cut })
		STOPS.push({ ...restStop, t0: sc.clock + sc.cut + F(8) })
	}
}
film.root.querySelectorAll('[data-scene]').forEach((g) => g.setAttribute('display', 'none'))
// a zoom that goes through the hero's resting place starts from where it rests
for (const sc of SCENES) if (sc.seam.anchor?.fromRest) Object.assign(sc.seam.anchor, { x: SCENES[sc.i - 1].restP.x, y: SCENES[sc.i - 1].restP.y })
STOPS.sort((a, b) => a.t0 - b.t0)
// each move takes at most 8 frames, and never more than 60 % of the time to the next touch
for (let i = 0; i < STOPS.length - 1; i++) { const g = STOPS[i + 1].t0 - STOPS[i].t0; STOPS[i].t1 = Math.max(STOPS[i].t0, STOPS[i + 1].t0 - Math.min(F(8), g * 0.6)) }
const HERO_BORN = STOPS[0].t0
const BUILT_ON = { x: 1482, y: 538, r: 92 } // the lead cell of Built on Nextcloud at its first frame
function heroAt(t) {
	if (t < HERO_BORN) return null
	const at = (st, tt) => { const [x, y] = apply(sceneMap(st.sc, Math.min(tt, st.sc.until - 1e-4)), st.p.x, st.p.y); return { x, y, r: st.p.r } }
	for (let i = 0; i < STOPS.length; i++) {
		const s = STOPS[i], n = STOPS[i + 1]
		if (t >= s.t0 && t < s.t1) return at(s, t)
		if (n && t >= s.t1 && t < n.t0) {
			const e = rest(inv(s.t1, n.t0, t))
			const a = at(s, s.t1 - 1e-4), b = at(n, t)
			return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), r: lerp(a.r, b.r, e) }
		}
	}
	// after the last stop: into the lead cell of Built on Nextcloud, on the bar
	const last = STOPS[STOPS.length - 1]
	const a = at(last, last.t1 - 1e-4)
	const e = rest(inv(last.t1, BODY_END, t))
	if (t >= BODY_END + F(2)) return null
	return { x: lerp(a.x, BUILT_ON.x, e), y: lerp(a.y, BUILT_ON.y, e), r: lerp(a.r, BUILT_ON.r, e) }
}
STOPS[STOPS.length - 1].t1 = Math.min(STOPS[STOPS.length - 1].t1, BODY_END - 1.0)

// who-codes: the word "you" folds into the hex; from then on "you" is the hex
{
	const sc = find('who-codes'), sp = find('who-patched')
	const word = sc.restP.node, word2 = sp.restP.node
	const tb = sc.clock + sc.birth
	BUILT[sc.k].after = ((prev) => (t) => {
		prev?.(t)
		const e = ease.inCubic(inv(tb - F(6), tb, t))
		if (t >= tb) word.setAttribute('display', 'none')
		else if (e > 0) {
			const b = { x: sc.restP.x, y: sc.restP.y }
			word.setAttribute('transform', `translate(${b.x} ${b.y}) scale(${(1 - e).toFixed(4)}) translate(${-b.x} ${-b.y})`)
		}
	})(BUILT[sc.k].after)
	BUILT[sp.k].after = ((prev) => (t) => { prev?.(t); word2.setAttribute('display', 'none') })(BUILT[sp.k].after)
}

film.scene('hero', HERO_BORN - F(6), BODY_END + F(3), (ctx) => {
	const path = el('path', { fill: C.orange }, ctx.g)
	return (t) => {
		let h = heroAt(t)
		if (!h && t >= HERO_BORN - F(6) && t < HERO_BORN) h = { ...STOPS[0].p }
		if (!h) { path.setAttribute('display', 'none'); return }
		path.removeAttribute('display')
		// born from the word: it grows out of the letters as they fold away
		const g = ease.outCubic(inv(HERO_BORN - F(4), HERO_BORN + F(2), t))
		const r = h.r * g
		if (r < 0.5) { path.setAttribute('display', 'none'); return }
		path.setAttribute('d', hexPath(h.x, h.y, r, r * 0.08))
	}
}, { post: 0.001 })

/* ---------- the wipe layer: cells from the hero, in the next ground ---------- */
film.scene('wipes', OPENING.duration, BODY_END, (ctx) => {
	const layer = el('g', {}, ctx.g)
	const wipes = SCENES.filter((s) => s.seam.type === 'wipe').map((s) => ({ s, prev: SCENES[s.i - 1] }))
	return (t) => {
		layer.replaceChildren()
		const w = wipes.find((x) => t >= x.s.seam.t0 && t < x.s.seam.t1)
		if (!w) return
		const { t0, t1 } = w.s.seam
		const tm = (t0 + t1) / 2
		const o = heroAt(t0) || { x: CX, y: CY }
		const cover = w.s.ground === 'cobalt' ? C.cobalt600 : GROUND[w.s.ground]
		const dmax = 2300
		for (const c of wipeLattice) {
			const d = Math.hypot(c.x - o.x, c.y - o.y) / dmax
			const inAt = t0 + d * (tm - t0 - F(4)), outAt = tm + d * (t1 - tm - F(4))
			let sx = 0, fill = cover
			if (t < tm) sx = ease.outCubic(inv(inAt, inAt + F(4), t))
			else { sx = 1 - ease.inCubic(inv(outAt, outAt + F(4), t)); fill = cover }
			if (sx <= 0.001) continue
			const tf = `translate(${c.x.toFixed(1)} 0) scale(${sx.toFixed(4)} 1) translate(${(-c.x).toFixed(1)} 0)`
			el('path', { d: hexPath(c.x, c.y, WIPE_R * 1.16, 0), fill: GROUND[w.s.ground], transform: tf }, layer)
			el('path', { d: hexPath(c.x, c.y, WIPE_R * 0.92, WIPE_R * 0.09), fill, transform: tf }, layer)
		}
	}
})

/* ---------- the closing pieces ---------- */
film.scene('builtOn', BODY_END, BODY_END + BUILT_ON_DUR, (ctx) => builtOnScene(ctx, CLOSE))
film.scene('install', BODY_END + BUILT_ON_DUR, DURATION, (ctx) => installScene(ctx, CLOSE), { post: 0.001 })
// the hero layer stays above the closing piece's first frames
film.root.appendChild(film.root.querySelector('[data-scene=hero]'))

/* ---------- sound: the seams, the hero's landings, and a bed whose phrases turn at the chapters ---------- */
for (const sc of SCENES) {
	const s = sc.seam
	if (s.type === 'zoomIn') film.cue(s.t0, 'whoosh', { dur: s.t1 - s.t0, from: 400, to: 2600, gain: 0.07 })
	if (s.type === 'zoomOut') film.cue(s.t0, 'whoosh', { dur: s.t1 - s.t0, from: 2600, to: 500, gain: 0.07 })
	if (s.type === 'pan') film.cue(s.t0, 'whoosh', { dur: s.t1 - s.t0, from: 800, to: 2000, gain: 0.05, panFrom: s.dir[0] ? 0.6 : 0, panTo: s.dir[0] ? -0.6 : 0 })
	if (s.type === 'wipe') for (let i = 0; i < 6; i++) film.cue(s.t0 + i * 0.09, 'tick', { freq: 1318.5 + i * 120, gain: 0.04, decay: 0.03, pan: -0.3 + i * 0.12 })
	if (s.type === 'morph' || s.type === 'grow') film.cue(s.t1, 'click', { gain: 0.16, freq: 2600, seed: 33, dry: true })
}
for (const st of STOPS) if (st.rest) film.cue(st.t0, 'pluck', { freq: 1174.66, gain: 0.09, decay: 0.5 })
film.cue(HERO_BORN, 'click', { gain: 0.22, freq: 2800, seed: 31, dry: true })

const D = [50, 54, 57, 62], Dmaj9 = [50, 54, 61, 64], Bm9 = [47, 54, 57, 61], Gmaj9 = [47, 50, 54, 57], Aadd9 = [49, 52, 57, 59], Fsm7 = [49, 52, 54, 57], Bmadd9 = [47, 50, 54, 61], Gmaj7 = [47, 50, 54, 59], Em9 = [50, 54, 55, 59], Asus = [50, 52, 57, 59]
const ROOT = new Map([[D, 38], [Dmaj9, 38], [Bm9, 35], [Gmaj9, 43], [Aadd9, 45], [Fsm7, 42], [Bmadd9, 35], [Gmaj7, 43], [Em9, 40], [Asus, 45]])
const startOf = (id) => find(id).from
const PHRASES = [
	{ at: OPENING.duration, prog: [Bm9, Gmaj9, D, Aadd9], pulse: false },
	{ at: startOf('wordpress-week'), prog: [Gmaj9, Aadd9, Dmaj9, Bm9], pulse: true },
	{ at: startOf('suite-vs-workspace'), prog: [Dmaj9, Bm9, Gmaj7, Asus], pulse: false },
	{ at: startOf('power-platform'), prog: [Em9, Gmaj9, Bm9, Aadd9], pulse: true },
	{ at: startOf('sanne'), prog: [Dmaj9, Bm9, Gmaj7, Asus], pulse: false },
	{ at: startOf('framework-basics'), prog: [Gmaj9, Aadd9, Fsm7, Bmadd9], pulse: true },
	{ at: startOf('store-growth'), prog: [Dmaj9, Aadd9, Bm9, Gmaj9], pulse: true },
	{ at: startOf('three-questions'), prog: [Gmaj9, Aadd9, Dmaj9, Dmaj9], pulse: false },
]
const BAR = G0.bar
const TOTAL_BARS = Math.round(DURATION / BAR)
const BODY_BAR0 = Math.round(OPENING.duration / BAR), BODY_BAR1 = Math.round(BODY_END / BAR)
const chords = [], kick = []
for (let b = 0; b < TOTAL_BARS; b++) {
	let ch
	if (b < BODY_BAR0) ch = D
	else if (b < BODY_BAR1) {
		let a = 0
		PHRASES.forEach((P, i) => { if (b * BAR + 1e-3 >= P.at) a = i })
		ch = PHRASES[a].prog[(b - Math.floor(PHRASES[a].at / BAR)) % 4]
		if (PHRASES[a].pulse) kick.push([b, b + 1])
	} else ch = [Dmaj9, Bm9, Aadd9, Gmaj9, Gmaj9, Aadd9, D][Math.min(6, b - BODY_BAR1)] || D
	chords.push(ch)
}
// the chapter seams land on a low hit
for (const sc of SCENES.filter((x) => x.chapter)) film.cue(sc.seam.t1, 'impact', { gain: 0.14, from: 110, to: 45, decay: 0.5 })
film.music = { bars: TOTAL_BARS, chords, bass: chords.map((c) => ROOT.get(c)), parts: { pad: [[BODY_BAR0, TOTAL_BARS]], bass: [[BODY_BAR0 + 2, TOTAL_BARS - 1]], kick, hat: kick }, loop: false, voice: [] }

/* ---------- what the tools read back ---------- */
const TL = timeline({
	bpm: 128, fps: 24, duration: DURATION,
	scenes: [
		{ id: 'opening', from: 0, to: OPENING.duration },
		...SCENES.map((s) => ({ id: s.id, from: { s: s.seam.t0 }, to: { s: s.to } })),
		{ id: 'builtOn', from: { s: BODY_END }, to: { s: BODY_END + BUILT_ON_DUR } },
		{ id: 'install', from: { s: BODY_END + BUILT_ON_DUR }, to: { s: DURATION } },
	],
})
film.board = { film: SLUG, variant: 'talk', meta: { title: 'Business software is next' } }
window.__bsn = {
	duration: DURATION, bodyEnd: BODY_END,
	scenes: SCENES.map((s) => ({ id: s.id, seam: s.seam.type, t0: +s.seam.t0.toFixed(3), clock: +s.clock.toFixed(3), to: +s.to.toFixed(3), rest: s.rest, restAt: +(s.clock + s.restAt).toFixed(3) })),
	stops: STOPS.map((s) => ({ id: s.sc.id, t0: +s.t0.toFixed(2), t1: +s.t1.toFixed(2), rest: !!s.rest })),
}
TL.expose()
film.start()
