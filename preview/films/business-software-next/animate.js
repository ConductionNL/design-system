/**
 * Animates an approved storyboard still into place. The board draws its key frame once, exactly as
 * board.html draws it; this module wraps every piece the draw made in an empty <g> of its own (so the
 * paint order never changes), reads what each piece is (a headline, a number, a card, a hex, a field),
 * and moves it into place over the first seconds of the scene. Once a piece has landed its wrapper is
 * bare again and every attribute it touched is restored, so the resting frame IS the approved still.
 *
 *   animateBoard(ctx, board, plan) -> update(t)
 *     plan: { dur, lead, voice, wordAt(re) -> local seconds, spec }
 *
 * Entrances (house language): words rise out of their line mask, numbers count up from 0 in IBM Plex
 * Mono, hexes flip in (a squash of the width, never a rotation), cards and windows rise, strips slide
 * in from the left, connectors draw on. Depth by opacity only; no scale-in, no bounce, no overshoot.
 * Every frame is a pure function of t.
 */
import { el, nextId } from '../_lib/stage.js'
import { inv, rand, lerp, ease } from '../_lib/core.js'
import { curve, F } from '../_lib/motion.js'
import { grid } from '../_lib/timeline.js'

const G = grid({ bpm: 128, fps: 24 })
const arrive = curve('arrive')
const camera = curve('camera')
const rest = curve('rest')
const W = 1920, H = 1080

/* ---------- reading the still ---------- */

const isHexBox = (b) => b.height > 8 && Math.abs(b.width / b.height - 0.866) < 0.04
function bbox(n) {
	try { const b = n.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height } } catch { return { x: 0, y: 0, width: 0, height: 0 } }
}
function textInfo(n) {
	const t = n.tagName === 'text' ? n : n.querySelector('text')
	if (!t) return null
	return { size: +t.getAttribute('font-size'), family: t.getAttribute('font-family') || '', weight: +t.getAttribute('font-weight'), str: n.textContent }
}
function classify(n) {
	const tag = n.tagName
	const b = bbox(n)
	const p = { node: n, box: b, cx: b.x + b.width / 2, cy: b.y + b.height / 2, area: b.width * b.height }
	if (tag === 'g') {
		const all = [...n.querySelectorAll('*')]
		if (n.hasAttribute('data-step')) return { ...p, kind: 'step' }
		if (all.length && all.every((e) => e.tagName === 'g' || e.tagName === 'text') && n.querySelector('text')) {
			const ti = textInfo(n)
			const mono = /Mono/.test(ti.family)
			const kind = mono && ti.size >= 80 && /[\d∞]/.test(ti.str) ? 'number' : mono && ti.size < 40 ? 'eyebrow' : ti.weight >= 700 && ti.size >= 64 && !mono ? 'headline' : 'copy'
			return { ...p, kind, text: ti }
		}
		const paths = all.filter((e) => e.tagName === 'path')
		if (paths.length >= 3 && paths.length === all.length) return { ...p, kind: 'field' }
		if (n.firstElementChild?.tagName === 'path' && isHexBox(b)) return { ...p, kind: 'hex' }
		return { ...p, kind: 'group' }
	}
	if (tag === 'path') {
		const fill = n.getAttribute('fill')
		if (!fill || fill === 'none') return { ...p, kind: 'line' }
		return { ...p, kind: isHexBox(b) ? 'hex' : 'shape' }
	}
	if (tag === 'rect') return { ...p, kind: 'rect' }
	if (tag === 'circle') return { ...p, kind: 'dot' }
	return { ...p, kind: 'image' }
}
const overlap = (a, b) => {
	const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
	const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
	return w > 0 && h > 0 ? w * h : 0
}
const isContainer = (p) => (p.kind === 'rect' && p.box.width >= 200 && p.box.height >= 56 && p.area < 0.9 * W * H)
	|| (p.kind === 'hex' && p.box.height >= 100)
	|| (p.kind === 'group' && p.area >= 120000)
const isStrip = (p) => p.kind === 'rect' && p.box.height <= 100 && p.box.width >= 500

/* ---------- number formatting for the count-up ---------- */

export function parseNum(s) {
	const m = s.match(/^(\D*?)([-−]?)(\d[\d,]*)(\.\d+)?(.*)$/s)
	if (!m) return null
	const [, pre, sign, int, dec = '', post] = m
	return { pre, sign, post, value: parseFloat(int.replace(/,/g, '') + dec), decimals: dec ? dec.length - 1 : 0, commas: int.includes(','), pad: int.startsWith('0') ? int.length : 0 }
}
export function formatNum(f, v) {
	let s = Math.abs(v).toFixed(f.decimals)
	if (f.commas) { const [a, b] = s.split('.'); s = a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : '') }
	if (f.pad) s = s.padStart(f.pad, '0')
	return f.pre + (f.sign && v !== 0 ? f.sign : '') + s + f.post
}

/* ---------- entrances: each returns update(local) that is a no-op at rest ---------- */

/** Masked rise, per line, or per word for a headline. */
function rise(p, t0, { perWord = false, wordGap = F(2), lineGap = F(3), dur = F(8) } = {}) {
	const lines = p.node.tagName === 'text' ? [{ g: p.node, items: [p.node] }] : [...p.node.children].map((g) => ({ g, items: [...g.querySelectorAll('text')] }))
	const size = p.text?.size || 40
	const jobs = []
	let k = 0
	lines.forEach((L, li) => {
		const b = bbox(L.g)
		const pad = size * 0.3
		const clipId = nextId('rise')
		const cp = el('clipPath', { id: clipId }, L.g.ownerSVGElement.querySelector('defs'))
		// wide to the sides: only the bottom edge masks the rise, so no word of the line is ever cut off
		el('rect', { x: b.x - pad - size, y: b.y - pad, width: b.width + 2 * pad + 2 * size, height: b.height + 2 * pad }, cp)
		const drop = b.height + 2 * pad
		L.items.forEach((it) => {
			const at = t0 + (perWord ? k * wordGap : li * lineGap)
			jobs.push({ it, at, drop, g: L.g, clipId })
			k++
		})
	})
	const end = Math.max(t0, ...jobs.map((j) => j.at)) + dur
	return {
		end,
		update(l) {
			const done = l >= end
			for (const L of new Set(jobs.map((j) => j.g))) {
				const j0 = jobs.find((j) => j.g === L)
				if (done) L.removeAttribute('clip-path')
				else L.setAttribute('clip-path', `url(#${j0.clipId})`)
			}
			for (const j of jobs) {
				const e = arrive(inv(j.at, j.at + dur, l))
				if (e >= 1) j.it.removeAttribute('transform')
				else j.it.setAttribute('transform', `translate(0 ${((1 - e) * j.drop).toFixed(2)})`)
			}
		},
	}
}

/** A count-up on the number's first digit-bearing word, under a masked rise. */
function count(p, t0, { from = 0, dur = 1.1 } = {}) {
	const r = rise(p, t0, { dur: F(8) })
	const node = [...p.node.querySelectorAll('text')].find((n) => /\d/.test(n.textContent))
	const f = node && parseNum(node.textContent)
	const original = node?.textContent
	if (!f) return r
	const end = Math.max(r.end, t0 + dur)
	return {
		end,
		land: t0 + dur,
		update(l) {
			r.update(l)
			if (l >= end) { node.textContent = original; return }
			const e = arrive(inv(t0, t0 + dur, l))
			node.textContent = e >= 1 ? original : formatNum(f, lerp(from, f.value, e))
		},
	}
}

/** Flip in: the width opens from nothing about the hex's own centre. */
function flipStyle(w, cx, s) {
	if (s >= 1) w.removeAttribute('transform')
	else w.setAttribute('transform', `translate(${cx.toFixed(2)} 0) scale(${Math.max(s, 1e-4).toFixed(4)} 1) translate(${(-cx).toFixed(2)} 0)`)
}
const FLIP = F(5)
const flipAt = (l, t0) => (l < t0 ? 0 : ease.outCubic(inv(t0, t0 + FLIP, l)))

/** Rise with opacity, for cards, windows and loose shapes. */
function lift(l, t0, dur, dy) {
	const e = arrive(inv(t0, t0 + dur, l))
	return { e, dy: (1 - e) * dy }
}
function liftStyle(w, l, t0, { dur = F(10), dy = 36, dx = 0 } = {}) {
	const { e } = lift(l, t0, dur, dy)
	if (e >= 1) { w.removeAttribute('transform'); w.removeAttribute('opacity'); return }
	w.setAttribute('transform', `translate(${((1 - e) * dx).toFixed(2)} ${((1 - e) * dy).toFixed(2)})`)
	w.setAttribute('opacity', Math.min(1, e * 1.6).toFixed(3))
}

/** Draw-on for connectors: a clip that opens left to right (or top to bottom for a tall shape). */
function wipe(p, w, t0, dur = F(9)) {
	const b = p.box, pad = 8
	const id = nextId('wipe')
	const cp = el('clipPath', { id }, w.ownerSVGElement.querySelector('defs'))
	const r = el('rect', { x: b.x - pad, y: b.y - pad, width: 0, height: b.height + 2 * pad }, cp)
	const tall = b.height > b.width
	return {
		end: t0 + dur,
		update(l) {
			const e = arrive(inv(t0, t0 + dur, l))
			if (e >= 1) { w.removeAttribute('clip-path'); w.removeAttribute('opacity'); return }
			if (tall) { r.setAttribute('width', b.width + 2 * pad); r.setAttribute('height', ((b.height + 2 * pad) * e).toFixed(2)) }
			else { r.setAttribute('width', ((b.width + 2 * pad) * e).toFixed(2)); r.setAttribute('height', b.height + 2 * pad) }
			w.setAttribute('clip-path', `url(#${id})`)
			if (l < t0) w.setAttribute('opacity', 0)
			else w.removeAttribute('opacity')
		},
	}
}

/* ---------- the plan of one scene ---------- */

/**
 * ctx: the scene context; board: the storyboard board; plan: timing (local seconds) and the scene spec.
 * Returns { update(t), cues: [{ at, kind, ...opts }] } with cue times in local seconds.
 */
export function animateBoard(ctx, board, plan) {
	const spec = plan.spec || {}
	const root = ctx.g
	const cam = el('g', { 'data-part': 'camera' }, root)
	board.draw(Object.assign(Object.create(ctx), { g: cam }))
	// a film may adjust the drawn still before it is read (recolour, add a piece); the storyboard never sees this
	if (plan.afterDraw) plan.afterDraw(cam)
	const first = cam.firstElementChild
	if (first?.tagName === 'rect' && +first.getAttribute('width') >= W && +first.getAttribute('height') >= H) root.insertBefore(first, cam)

	// A two-beat card: its first beat is drawn hidden (the still shows the second); the film shows it until the cut.
	const beatG = cam.querySelector(':scope > [data-beat=before]')
	if (beatG) beatG.removeAttribute('display')

	// Measure with the scene shown, then give the display back to whoever owns it.
	const prevDisplay = root.getAttribute('display')
	root.setAttribute('display', 'inline')
	const pieces = []
	for (const n of [...cam.children]) {
		if (n.tagName === 'clipPath' || n.tagName === 'defs') continue
		const w = el('g', {})
		cam.insertBefore(w, n)
		w.appendChild(n)
		pieces.push({ ...classify(n), w })
	}
	// Containers and their members: a piece mostly inside an earlier container moves with it.
	pieces.forEach((p, i) => {
		for (let j = i - 1; j >= 0; j--) {
			const c = pieces[j]
			if (!isContainer(c) || c.kind === 'step') continue
			const inside = p.cx >= c.box.x && p.cx <= c.box.x + c.box.width && p.cy >= c.box.y && p.cy <= c.box.y + c.box.height
			const ov = overlap(p.box, c.box)
			// a piece mostly inside the container, or (a window's clipped content) one that covers it
			if (p.area > 0 && ((ov >= 0.85 * p.area && p.area <= c.area * 1.05) || (inside && ov >= 0.85 * c.area && c.kind !== 'hex'))) { p.parent = c.parent || c; break }
			// an app tag on a window's corner
			const near = p.cx >= c.box.x - 30 && p.cx <= c.box.x + c.box.width + 30 && p.cy >= c.box.y - 30 && p.cy <= c.box.y + c.box.height + 30
			if (p.kind === 'hex' && c.kind !== 'hex' && p.area < 0.05 * c.area && near) { p.parent = c.parent || c; break }
		}
	})
	pieces.forEach((p) => { if (p.parent) (p.parent.members ||= []).push(p) })
	// An empty piece (a field with no cell on the frame) draws nothing and takes no slot.
	const roots = pieces.filter((p) => !p.parent && (p.area > 0 || p.kind === 'step'))

	const jobs = []
	const cues = []
	const cue = (at, kind, o) => cues.push({ at, kind, ...o })
	const voiceEnd = plan.lead + plan.voice
	const R = rand(plan.seed || 7)

	/* background: fields and hex runs drawn before the first text */
	const firstText = roots.findIndex((p) => ['headline', 'eyebrow', 'copy', 'number'].includes(p.kind))
	const bg = roots.filter((p, i) => (p.kind === 'field') || (p.kind === 'hex' && i < firstText && !p.members))
	const bgHexes = bg.flatMap((p) => (p.kind === 'field' ? [...p.node.children].map((n) => ({ n, w: n, box: bbox(n) })) : [{ n: p.node, w: p.w, box: p.box }]))
	if (bgHexes.length) {
		const ccx = spec.bgFrom?.[0] ?? (bgHexes.reduce((a, h) => a + h.box.x + h.box.width / 2, 0) / bgHexes.length)
		const ccy = spec.bgFrom?.[1] ?? (bgHexes.reduce((a, h) => a + h.box.y + h.box.height / 2, 0) / bgHexes.length)
		const dmax = Math.max(1, ...bgHexes.map((h) => Math.hypot(h.box.x + h.box.width / 2 - ccx, h.box.y + h.box.height / 2 - ccy)))
		const spread = spec.bgSpread ?? 0.6
		// Raised hands: lit cells light up (turn over to white) in a seeded order across a window; cells
		// that were lit in the scene before turn out.
		const lightAt = spec.lightAt ?? 1.2, lightSpan = spec.lightSpan ?? 1.4
		bgHexes.forEach((h) => {
			const cx = h.box.x + h.box.width / 2
			const d = Math.hypot(cx - ccx, h.box.y + h.box.height / 2 - ccy)
			const t0 = spec.bg === 'hold' ? -1 : F(Math.round((d / dmax) * spread * 24) - 3)
			const anim = h.n.getAttribute('data-anim')
			const fill = h.n.getAttribute('fill'), op = h.n.getAttribute('fill-opacity')
			const swapAt = anim === 'light' ? lightAt + R() * lightSpan : anim === 'out' ? (spec.outAt ?? 1.0) + R() * (spec.outSpan ?? 1.2) : null
			const alt = anim === 'light' ? [h.n.getAttribute('data-off-fill'), h.n.getAttribute('data-off-opacity')] : anim === 'out' ? [h.n.getAttribute('data-on-fill'), h.n.getAttribute('data-on-opacity')] : null
			jobs.push({
				end: Math.max(t0 + FLIP, swapAt != null ? swapAt + FLIP : 0),
				update(l) {
					let s = flipAt(l, t0)
					if (swapAt != null) {
						const half = F(3)
						const before = l < swapAt
						if (l >= swapAt - half && l < swapAt) s = Math.min(s, 1 - ease.inCubic(inv(swapAt - half, swapAt, l)))
						else if (l >= swapAt && l < swapAt + half) s = Math.min(s, ease.outCubic(inv(swapAt, swapAt + half, l)))
						if (before) { h.n.setAttribute('fill', alt[0]); h.n.setAttribute('fill-opacity', alt[1]) } else { h.n.setAttribute('fill', fill); h.n.setAttribute('fill-opacity', op) }
					}
					flipStyle(h.w, cx, s)
				},
			})
		})
		if (spec.bg !== 'hold') cue(0, 'whoosh', { dur: spread + 0.2, from: 700, to: 1800, gain: 0.04, panFrom: 0.5, panTo: 0.3 })
		const swaps = bgHexes.filter((h) => h.n.hasAttribute('data-anim')).length
		if (swaps) {
			const at = bgHexes.some((h) => h.n.getAttribute('data-anim') === 'out') ? (spec.outAt ?? 1.0) : lightAt
			for (let i = 0; i < 6; i++) cue(at + i * 0.22, 'tick', { freq: 1568 + i * 90, gain: 0.04, decay: 0.03, pan: 0.4 })
		}
	}

	/* the intro: eyebrows and headlines at the top of the draw */
	const beatP = beatG ? roots.find((p) => p.node === beatG) : null
	const rest0 = beatP ? [beatP] : roots.filter((p) => !bg.includes(p))
	if (beatP) {
		// the hard cut within the card: the first beat leaves and the still's words are there, on the spoken word
		const w = plan.wordAt(spec.beatWord || '')
		const cut = Math.round(((w ?? plan.lead + plan.voice * 0.6) - F(1)) * 24) / 24
		const others = roots.filter((p) => p !== beatP && !bg.includes(p))
		jobs.push({ end: cut, update: (l) => { const after = l >= cut; beatP.w.setAttribute('display', after ? 'none' : 'inline'); for (const p of others) { if (after) p.w.removeAttribute('display'); else p.w.setAttribute('display', 'none') } if (after) beatP.w.setAttribute('display', 'none') } })
		cue(cut, 'click', { gain: 0.22, freq: 2600, seed: 47, dry: true })
	}
	// The cut lands inside the first move (the scene's first frame already shows its words rising), so no frame is empty.
	let t = -F(3)
	let introEnd = 0
	const intro = []
	for (const p of rest0) {
		const seenHead = intro.some((q) => q.kind === 'headline')
		if (p.kind === 'headline' || (p.kind === 'eyebrow' && !seenHead)) intro.push(p)
		else if (p.kind === 'copy' && p.text.str.trim() === '“' && !seenHead) intro.push(p)
		else if (p.kind === 'number' && intro.length === 0 && spec.numberFirst !== false) intro.push(p)
		else break
	}
	let headN = 0
	for (const p of intro) {
		if (p.kind === 'eyebrow' || p.kind === 'copy') { const r = rise(p, t, { dur: F(7) }); jobs.push(r); introEnd = Math.max(introEnd, r.end); t += F(1); continue }
		if (p.kind === 'number') {
			const r = count(p, t, { from: spec.from?.[p.text.str.trim()] ?? 0, dur: 0.9 })
			jobs.push(r); introEnd = Math.max(introEnd, r.end); cue(r.land ?? r.end, 'click', { gain: 0.16, freq: 2700, seed: 41, dry: true }); t += F(6); continue
		}
		let at = t
		if (headN > 0) {
			const firstWord = p.text.str.split(/\s+/)[0]
			const w = plan.wordAt(firstWord)
			if (w != null) at = Math.max(t, w - F(2))
		}
		const r = rise(p, at, { perWord: true })
		jobs.push(r)
		const orange = [...p.node.querySelectorAll('text')].some((n) => n.getAttribute('fill') === plan.orange)
		if (orange) cue(r.end - F(4), 'click', { gain: 0.12, freq: 2900, seed: 43, dry: true })
		introEnd = Math.max(introEnd, r.end)
		t = r.end - F(4)
		headN++
	}
	if (spec.after === 'hold') introEnd = Math.max(introEnd, spec.contentAt ?? 0)

	/* content: the rest, grouped into slots in draw order */
	const content = rest0.filter((p) => !intro.includes(p))
	const slots = []
	for (let i = 0; i < content.length; i++) {
		const p = content[i]
		if (p.kind === 'step') { slots.push({ kind: 'step', items: [p] }); continue }
		// a run of hexes
		if (p.kind === 'hex') {
			let j = i
			while (j + 1 < content.length && content[j + 1].kind === 'hex') j++
			if (j - i + 1 >= 3) { slots.push({ kind: 'run', items: content.slice(i, j + 1) }); i = j; continue }
		}
		// A slot is one item of a row or a list: a head (a hex, a number, a rule, a card) and the words that
		// sit under it or right beside it.
		const last = slots[slots.length - 1]
		const head = ['hex', 'number', 'rect', 'group', 'line', 'shape', 'image'].includes(p.kind) || isContainer(p)
		if (last && last.kind === 'col' && !head && last.items.length < 5 && !isContainer(last.items[0])) {
			const u = last.items.reduce((a, q) => ({ x0: Math.min(a.x0, q.box.x), y0: Math.min(a.y0, q.box.y), x1: Math.max(a.x1, q.box.x + q.box.width), y1: Math.max(a.y1, q.box.y + q.box.height) }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity })
			const b = p.box
			const hOver = Math.min(u.x1, b.x + b.width) - Math.max(u.x0, b.x) > 0 || Math.abs(b.x - u.x0) < 30
			const vOver = Math.min(u.y1, b.y + b.height) - Math.max(u.y0, b.y) > 0
			const below = hOver && b.y - u.y1 < 70 && b.y + b.height > u.y0 - 140
			const beside = vOver && b.x - u.x1 < 160 && b.x - u.x1 > -10
			if (below || beside) { last.items.push(p); continue }
		}
		slots.push({ kind: 'col', items: [p] })
	}

	const c0 = Math.max(introEnd - F(4), spec.contentAt ?? 0)
	const c1 = Math.max(c0, Math.min(plan.dur - 2.2, spec.contentEnd ?? (plan.lead + (spec.spread ?? 0.62) * plan.voice)))
	const n = slots.length
	const gap = n > 1 ? Math.min(Math.max((c1 - c0) / (n - 1), F(4)), 2 * G.spb) : 0
	// Slot times on the film's 8ths (plan.start is the scene's film time), or on the spoken word a spec names.
	const snap8 = (l) => G.eighthAt(Math.round((plan.start + l) / G.eighthLen)) - plan.start
	slots.forEach((s, i) => {
		let at = c0 + i * gap
		const word = spec.at?.[i]
		if (typeof word === 'number') at = word
		else if (word) { const w = plan.wordAt(word); if (w != null) at = w - F(3) }
		s.at = typeof word === 'number' ? word : Math.max(c0, snap8(at))
	})
	for (let i = 1; i < slots.length; i++) if (!spec.at?.[i] && slots[i].at < slots[i - 1].at) slots[i].at = slots[i - 1].at

	const enter = (p, at) => {
		if (spec.skip?.(p)) return at
		// returns the end time of this piece's entrance (members included)
		switch (p.kind) {
		case 'headline': case 'copy': case 'eyebrow': {
			const r = rise(p, at, { perWord: p.kind === 'headline' }); jobs.push(r); return r.end
		}
		case 'number': {
			const r = count(p, at, { from: spec.from?.[p.text.str.trim()] ?? 0 }); jobs.push(r)
			cue(r.land, 'tick', { freq: 1760, gain: 0.07, decay: 0.08 })
			return r.end
		}
		case 'hex': {
			const cx = p.cx
			const all = [p, ...(p.members || [])]
			jobs.push({ end: at + FLIP, update: (l) => { const s = flipAt(l, at); all.forEach((m) => flipStyle(m.w, cx, s)) } })
			return at + FLIP
		}
		case 'line': case 'shape': {
			const r = wipe(p, p.w, at); jobs.push(r); return r.end
		}
		default: {
			const strip = isStrip(p)
			const o = strip ? { dur: F(9), dy: 0, dx: -70 } : { dur: F(10), dy: Math.min(60, 20 + p.box.height * 0.05) }
			jobs.push({ end: at + o.dur, update: (l) => liftStyle(p.w, l, at, o) })
			if (strip) cue(at, 'whoosh', { dur: 0.3, from: 1200, to: 3000, gain: 0.045, panFrom: -0.4, panTo: 0.2 })
			let end = at + o.dur
			// members: the shell lands, then its content fills in order
			const mem = p.members || []
			if (mem.length) {
				const fillGap = Math.min(F(2), 1.0 / mem.length)
				mem.forEach((m, k) => {
					const mt = at + F(6) + k * fillGap
					let e
					if (m.kind === 'headline' || m.kind === 'copy' || m.kind === 'eyebrow' || m.kind === 'number') {
						if (m.kind === 'number' && m.text.size >= 80) { const r = count(m, mt); jobs.push(r); e = r.end } else { const r = rise(m, mt, { dur: F(6) }); jobs.push(r); e = r.end }
						// the member's wrapper also follows the shell's lift
						jobs.push({ end: at + o.dur, update: (l) => liftStyle(m.w, l, at, o) })
					} else if (m.kind === 'hex') {
						const ht = Math.max(mt, at + o.dur)
						jobs.push({ end: ht + FLIP, update: (l) => { m.w.removeAttribute('opacity'); flipStyle(m.w, m.cx, flipAt(l, ht)) } })
						e = ht + FLIP
					} else {
						jobs.push({ end: at + o.dur, update: (l) => liftStyle(m.w, l, at, o) })
						e = at + o.dur
					}
					end = Math.max(end, e)
				})
			}
			return end
		}
		}
	}

	let lastEnd = introEnd
	for (const s of slots) {
		if (s.kind === 'step') continue
		if (s.kind === 'run') {
			const items = [...s.items].sort((a, b) => (spec.runOrder === 'radial' ? 0 : a.cx - b.cx || a.cy - b.cy))
			const span = Math.min(spec.runSpan ?? 1.4, items.length * F(1.5))
			items.forEach((p, k) => { lastEnd = Math.max(lastEnd, enter(p, s.at + (span * k) / items.length)) })
			for (let k = 0; k < Math.min(5, items.length); k++) cue(s.at + (span * k) / 5, 'tick', { freq: 1318.5 + k * 110, gain: 0.04, decay: 0.03, pan: 0.3 })
			continue
		}
		s.items.forEach((p, k) => { lastEnd = Math.max(lastEnd, enter(p, s.at + k * F(2))) })
		if (!s.items.some((p) => p.kind === 'number' || isStrip(p))) cue(s.at, 'tick', { freq: 1174.66 + (slots.indexOf(s) % 5) * 110, gain: 0.035, decay: 0.04, pan: 0.25 })
	}

	/* store growth: one number morphs from step to step while the honeycomb under it multiplies */
	const steps = roots.filter((p) => p.kind === 'step')
	if (steps.length) {
		const words = spec.stepWords || []
		const st = steps.map((p, i) => {
			const kids = [...p.node.children]
			const hexes = kids.filter((k) => k.tagName === 'path')
			const texts = kids.filter((k) => k.tagName === 'g')
			const num = classify(texts[0]), label = classify(texts[1]), arrow = texts[2] ? classify(texts[2]) : null
			const w = plan.wordAt(words[i] || '')
			return { p, hexes, num, label, arrow, at: snap8(Math.max(introEnd - F(2) + i * 1.2, w != null ? w - F(2) : 0)) }
		})
		for (let i = 1; i < st.length; i++) st[i].at = Math.max(st[i].at, st[i - 1].at + 0.6)
		st.forEach((s, i) => {
			const prev = st[i - 1]
			const node = s.num.node.querySelector('text')
			const original = node.textContent
			const f = parseNum(original), pf = prev && parseNum(prev.num.node.querySelector('text').textContent)
			const travel = F(14)
			// the copy leaves from just right of the number before it, so the two never overlap
			const dx = prev ? prev.num.box.x + prev.num.box.width + 16 - s.num.box.x : 0
			const numG = s.num.node
			const ccx = s.hexes.length ? s.hexes.reduce((a, h) => a + bbox(h).x + bbox(h).width / 2, 0) / s.hexes.length : 0
			const hb = s.hexes.map((h) => ({ h, b: bbox(h) }))
			const cx0 = hb.length ? hb.reduce((a, x) => a + x.b.x + x.b.width / 2, 0) / hb.length : 0
			const cy0 = hb.length ? Math.min(...hb.map((x) => x.b.y + x.b.height / 2)) : 0
			const r0 = prev ? null : rise(s.num, s.at, { dur: F(8) })
			const lab = rise(s.label, s.at + travel - F(2), { dur: F(7) })
			const arr = s.arrow ? rise(s.arrow, (st[i + 1]?.at ?? s.at + 1) - F(6), { dur: F(6) }) : null
			const cellEnd = s.at + F(4) + 0.5
			jobs.push({
				end: Math.max(s.at + travel, lab.end, arr?.end ?? 0, cellEnd + FLIP),
				update(l) {
					// the number: before its step it is hidden; then it travels from the last number, counting
					if (r0) r0.update(l)
					else if (l < s.at) numG.setAttribute('opacity', 0)
					else {
						numG.removeAttribute('opacity')
						const e = rest(inv(s.at, s.at + travel, l))
						if (e >= 1) { numG.removeAttribute('transform'); node.textContent = original }
						else {
							const k = arrive(inv(s.at, s.at + travel, l))
							let sx = 1
							if (f) node.textContent = formatNum(f, lerp(pf.value, f.value, k))
							else {
								// no number to count to (the last step): it grows tenfold, then turns over into its sign
								node.textContent = k < 0.7 ? formatNum(pf, pf.value * Math.pow(10, k / 0.6)) : original
								sx = k < 0.55 ? 1 : k < 0.7 ? 1 - inv(0.55, 0.7, k) : inv(0.7, 0.85, k)
							}
							const nx = s.num.box.x + s.num.box.width / 2
							numG.setAttribute('transform', `translate(${((1 - e) * dx).toFixed(2)} 0)` + (sx < 1 ? ` translate(${nx.toFixed(2)} 0) scale(${Math.max(sx, 1e-4).toFixed(4)} 1) translate(${(-nx).toFixed(2)} 0)` : ''))
							numG.setAttribute('opacity', Math.min(1, inv(s.at, s.at + F(4), l)).toFixed(3))
						}
					}
					lab.update(l)
					if (arr) arr.update(l)
					// the honeycomb under it multiplies: cells flip in from its top cell outward
					const dmax = Math.max(1, ...hb.map((x) => Math.hypot(x.b.x + x.b.width / 2 - cx0, x.b.y + x.b.height / 2 - cy0)))
					hb.forEach(({ h, b }) => {
						const d = Math.hypot(b.x + b.width / 2 - cx0, b.y + b.height / 2 - cy0)
						flipStyle(h, b.x + b.width / 2, flipAt(l, s.at + F(4) + (d / dmax) * 0.5))
					})
				},
			})
			cue(s.at, prev ? 'whoosh' : 'tick', prev ? { dur: travel, from: 900, to: 2600, gain: 0.06, panFrom: -0.2, panTo: 0.3 } : { freq: 1318.5, gain: 0.08 })
			cue(s.at + travel, 'click', { gain: i === st.length - 1 ? 0.24 : 0.14, freq: 2600 + i * 150, seed: 60 + i, dry: true })
			void ccx
			lastEnd = Math.max(lastEnd, s.at + travel + F(8))
		})
	}

	/* the camera: a gentle push onto the scene's largest picture, settling before the voice ends */
	const big = roots.filter((p) => isContainer(p) && p.kind !== 'hex').sort((a, b) => b.area - a.area)[0]
	const camOn = spec.camera ?? false
	const camEnd = Math.min(plan.dur - 1, Math.max(lastEnd + 0.4, spec.cameraEnd ?? Math.min(plan.dur * 0.6, 4.5)))
	const pivot = spec.pivot || (big ? [big.cx, big.cy] : [W / 2, H / 2])
	const camFrom = spec.cameraFrom ?? 0.955
	if (camOn) {
		jobs.push({
			end: camEnd,
			update(l) {
				const e = camera(inv(0, camEnd, l))
				if (e >= 1) { cam.removeAttribute('transform'); return }
				const s = lerp(camFrom, 1, e)
				cam.setAttribute('transform', `translate(${pivot[0].toFixed(2)} ${pivot[1].toFixed(2)}) scale(${s.toFixed(5)}) translate(${(-pivot[0]).toFixed(2)} ${(-pivot[1]).toFixed(2)})`)
			},
		})
	}

	const end = Math.max(...jobs.map((j) => j.end), 0)
	if (prevDisplay === null) root.removeAttribute('display')
	else root.setAttribute('display', prevDisplay)
	return {
		end,
		cues,
		pieces: roots,
		slotList: slots,
		intro,
		introEnd,
		slots: slots.map((s) => ({ at: s.at, items: s.items.map((p) => p.kind + ':' + (p.text?.str || p.node.textContent || p.node.tagName).slice(0, 14)) })),
		update(l) { for (const j of jobs) j.update(l) },
	}
}
