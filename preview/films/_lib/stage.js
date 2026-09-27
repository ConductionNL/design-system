/**
 * Conduction motion stage: an SVG scene graph driven by a single clock.
 *
 * A film is a list of scenes on a beat grid. Each scene builds its SVG once and
 * gets an update(t) call per frame, where t is film time in seconds. The page
 * exposes window.__render(t) so the capture tool can step it frame by frame,
 * and a small player (play, scrub, frame step, safe-zone overlay) otherwise.
 */
import { clamp, inv } from './core.js'

export const NS = 'http://www.w3.org/2000/svg'

export function set(node, attrs) {
	for (const k in attrs) {
		const v = attrs[k]
		if (v === null || v === undefined || v === false) node.removeAttribute(k)
		else node.setAttribute(k, v)
	}
	return node
}
export function el(tag, attrs = {}, parent) {
	const n = document.createElementNS(NS, tag)
	set(n, attrs)
	if (parent) parent.appendChild(n)
	return n
}
/** translate + uniform scale about the element origin. No rotation helper on purpose: hexes stay pointy-top. */
export const tf = (x = 0, y = 0, s = 1) => `translate(${x.toFixed(2)} ${y.toFixed(2)})` + (s === 1 ? '' : ` scale(${Math.max(s, 0.0001).toFixed(4)})`)
/** Scale about a pivot point. */
export const tfAbout = (px, py, s, dx = 0, dy = 0) => `translate(${(px + dx).toFixed(2)} ${(py + dy).toFixed(2)}) scale(${Math.max(s, 0.0001).toFixed(4)}) translate(${(-px).toFixed(2)} ${(-py).toFixed(2)})`

let uid = 0
export const nextId = (p = 'n') => `${p}${++uid}`

/* ---------- Fonts and glyphs ---------- */

export async function loadFonts(faces) {
	await Promise.all(faces.map(async (f) => {
		const face = new FontFace(f.family, `url(${f.url})`, { weight: String(f.weight), style: f.style || 'normal' })
		await face.load()
		document.fonts.add(face)
	}))
	await document.fonts.ready
}

/**
 * Loads single-colour SVG files into <symbol>s inside defs. The files use
 * currentColor, so a <use> takes its colour from the `color` attribute.
 */
export async function loadSymbols(defs, map, { recolor = false } = {}) {
	await Promise.all(Object.entries(map).map(async ([id, url]) => {
		const res = await fetch(url)
		if (!res.ok) throw new Error(`symbol ${id}: ${url} returned ${res.status}`)
		const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml')
		const svg = doc.documentElement
		const sym = el('symbol', { id, viewBox: svg.getAttribute('viewBox') || '0 0 24 24' }, defs)
		// The glyph files put fill="currentColor" on the root <svg>; carry it over or the paths render black.
		for (const a of ['fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) {
			if (svg.hasAttribute(a)) sym.setAttribute(a, svg.getAttribute(a))
		}
		for (const child of [...svg.childNodes]) {
			if (child.nodeType !== 1 || ['title', 'desc', 'metadata'].includes(child.localName)) continue
			sym.appendChild(document.importNode(child, true))
		}
		// recolor: a single-colour mark (avatar, Nextcloud logo) takes its colour from `color` like a glyph.
		if (recolor) {
			for (const n of sym.querySelectorAll('[fill]')) if (n.getAttribute('fill') !== 'none') n.setAttribute('fill', 'currentColor')
			for (const n of sym.querySelectorAll('[stroke]')) if (n.getAttribute('stroke') !== 'none') n.setAttribute('stroke', 'currentColor')
		}
	}))
}

/* ---------- Text ---------- */

const measureCtx = document.createElement('canvas').getContext('2d')
export function measure(text, { size, weight = 600, family = 'Figtree', tracking = 0 }) {
	measureCtx.font = `${weight} ${size}px ${family}`
	return measureCtx.measureText(text).width + tracking * size * Math.max(0, [...text].length - 1)
}

/**
 * Lays out text as one <text> per word (or per character), grouped per line,
 * each line clipped to its own box so words can rise into view from below the
 * baseline. Markup: *word* takes `accent`, _word_ takes `accent2`.
 *
 * Returns { group, lines: [{ group, clip, y, width, items }], items, width, height }.
 */
export function textBlock(parent, text, opts) {
	const {
		x = 0, y = 0, size = 96, weight = 700, family = 'Figtree', fill = '#fff', accent, accent2,
		anchor = 'start', lineHeight = 1.05, tracking = -0.02, maxWidth = Infinity, split = 'word', clip = true,
	} = opts
	const group = el('g', {}, parent)
	const spaceW = measure(' ', { size, weight, family })
	const rawLines = []
	for (const para of text.split('\n')) {
		const words = para.split(' ').filter(Boolean)
		let line = []
		let w = 0
		for (const word of words) {
			const clean = word.replace(/[*_]/g, '')
			const ww = measure(clean, { size, weight, family, tracking })
			if (line.length && w + spaceW + ww > maxWidth) {
				rawLines.push(line)
				line = []
				w = 0
			}
			line.push({ word, clean, w: ww })
			w += (line.length > 1 ? spaceW : 0) + ww
		}
		rawLines.push(line)
	}
	const lines = []
	const items = []
	const lh = size * lineHeight
	rawLines.forEach((words, li) => {
		const width = words.reduce((a, w, i) => a + w.w + (i ? spaceW : 0), 0)
		const ly = y + li * lh
		let lx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
		const lg = el('g', {}, group)
		let clipRect = null
		if (clip) {
			const cid = nextId('clip')
			const cp = el('clipPath', { id: cid }, lg)
			clipRect = el('rect', { x: lx - size * 0.2, y: ly - size * 1.0, width: width + size * 0.4, height: size * 1.32 }, cp)
			set(lg, { 'clip-path': `url(#${cid})` })
		}
		const line = { group: lg, clip: clipRect, y: ly, x: lx, width, items: [] }
		words.forEach((w, wi) => {
			const color = w.word.startsWith('*') ? accent : w.word.startsWith('_') ? accent2 : fill
			const pieces = split === 'char' ? [...w.clean] : [w.clean]
			let px = lx
			for (const piece of pieces) {
				const pw = split === 'char' ? measure(piece, { size, weight, family }) + tracking * size : w.w
				const node = el('text', {
					x: px.toFixed(2), y: ly.toFixed(2), fill: color || fill, 'font-family': family, 'font-weight': weight,
					'font-size': size, 'letter-spacing': split === 'char' ? 0 : `${tracking}em`,
				}, lg)
				node.textContent = piece
				const item = { node, x: px, y: ly, w: pw, text: piece, line: li, word: wi, index: items.length }
				items.push(item)
				line.items.push(item)
				px += pw
			}
			lx += w.w + spaceW
		})
		lines.push(line)
	})
	return { group, lines, items, width: Math.max(0, ...lines.map((l) => l.width)), height: lines.length * lh, lineHeight: lh }
}

/* ---------- The film ---------- */

export const FORMATS = {
	'9x16': { width: 1080, height: 1920 },
	'4x5': { width: 1080, height: 1350 },
	'1x1': { width: 1080, height: 1080 },
	'16x9': { width: 1920, height: 1080 },
}

export class Film {
	constructor({ mount, format = '9x16', fps = 60, duration = 15, bpm = 128, background = '#21468B', safe = {} }) {
		this.format = format
		Object.assign(this, FORMATS[format])
		this.fps = fps
		this.duration = duration
		this.bpm = bpm
		this.background = background
		this.safe = { top: 0, bottom: 0, left: 0, right: 0, ...safe }
		this.scenes = []
		this.cues = []
		/** Optional data the tools read back: music (see scripts/films/score.mjs) and board (storyboard metadata). */
		this.music = null
		this.board = null
		this.svg = el('svg', { xmlns: NS, width: this.width, height: this.height, viewBox: `0 0 ${this.width} ${this.height}`, id: 'stage' }, mount)
		this.defs = el('defs', {}, this.svg)
		this.bg = el('rect', { width: this.width, height: this.height, fill: background }, this.svg)
		this.root = el('g', {}, this.svg)
		this.overlay = el('g', { 'pointer-events': 'none', display: 'none' }, this.svg)
	}

	/** Seconds per beat, and time of beat n / bar n (4/4) on the grid. */
	get spb() { return 60 / this.bpm }
	beat(n) { return n * this.spb }
	bar(n) { return n * 4 * this.spb }

	/** The box inside the platform UI overlays, in stage pixels. */
	get box() {
		const s = this.safe
		return { x: s.left, y: s.top, w: this.width - s.left - s.right, h: this.height - s.top - s.bottom, cx: (s.left + this.width - s.right) / 2, cy: (s.top + this.height - s.bottom) / 2 }
	}

	/**
	 * Adds a scene visible in [start - pre, end + post). build(ctx) creates its
	 * SVG under ctx.g and returns update(t, local, p) called every frame while visible.
	 */
	scene(name, start, end, build, { pre = 0, post = 0 } = {}) {
		const g = el('g', { 'data-scene': name, display: 'none' }, this.root)
		const ctx = { g, film: this, name, start, end, W: this.width, H: this.height, box: this.box, defs: this.defs, cue: (t, kind, o) => this.cue(t, kind, o) }
		const update = build(ctx) || (() => {})
		this.scenes.push({ name, start, end, pre, post, g, update })
		return ctx
	}

	/** Records a sound cue. Cues are data; the audio tool turns them into sound. */
	cue(t, kind, opts = {}) {
		this.cues.push({ t: +t.toFixed(4), kind, ...opts })
	}

	render(t) {
		t = clamp(t, 0, this.duration)
		for (const s of this.scenes) {
			const on = t >= s.start - s.pre && t < s.end + s.post
			s.g.setAttribute('display', on ? 'inline' : 'none')
			if (on) s.update(t, t - s.start, inv(s.start, s.end, t))
		}
		this.t = t
	}

	/** Draws the platform safe zones and the beat grid, for the player only. */
	drawOverlay() {
		const { width: W, height: H, safe } = this
		const tint = { fill: '#AE1C28', 'fill-opacity': 0.28 }
		el('rect', { x: 0, y: 0, width: W, height: safe.top, ...tint }, this.overlay)
		el('rect', { x: 0, y: H - safe.bottom, width: W, height: safe.bottom, ...tint }, this.overlay)
		el('rect', { x: 0, y: safe.top, width: safe.left, height: H - safe.top - safe.bottom, ...tint }, this.overlay)
		el('rect', { x: W - safe.right, y: safe.top, width: safe.right, height: H - safe.top - safe.bottom, ...tint }, this.overlay)
		el('rect', { x: safe.left, y: safe.top, width: W - safe.left - safe.right, height: H - safe.top - safe.bottom, fill: 'none', stroke: '#fff', 'stroke-dasharray': '12 10', 'stroke-width': 2 }, this.overlay)
	}

	/** Exposes the capture hooks, then mounts the player unless ?capture is set. */
	start() {
		const q = new URLSearchParams(location.search)
		window.__film = { duration: this.duration, fps: this.fps, width: this.width, height: this.height, bpm: this.bpm, format: this.format, cues: this.cues, music: this.music, board: this.board, safe: this.safe, scenes: this.scenes.map(({ name, start, end }) => ({ name, start, end })) }
		window.__render = (t) => this.render(t)
		this.drawOverlay()
		const t0 = q.has('t') ? parseFloat(q.get('t')) : 0
		this.render(t0)
		if (q.has('safe')) this.overlay.setAttribute('display', 'inline')
		if (!q.has('capture')) mountPlayer(this, t0, q)
		window.__ready = true
	}
}

/* ---------- Player (preview only; never part of a captured frame) ---------- */

function mountPlayer(film, t0, q) {
	document.body.classList.add('player')
	const bar = document.createElement('div')
	bar.className = 'player-bar'
	bar.innerHTML = `
		<button data-a="play" aria-label="Play">Play</button>
		<input type="range" min="0" max="${film.duration}" step="${1 / film.fps}" value="${t0}" aria-label="Scrub">
		<output>0.000 s</output>
		<button data-a="safe" aria-pressed="false">Safe zones</button>
		<button data-a="sound" aria-pressed="false" hidden>Sound</button>`
	document.body.appendChild(bar)
	const range = bar.querySelector('input')
	const out = bar.querySelector('output')
	const playBtn = bar.querySelector('[data-a=play]')
	const soundBtn = bar.querySelector('[data-a=sound]')
	let playing = false
	let startWall = 0
	let startT = t0
	let audio = null
	const audioUrl = q.get('audio') || film.audioUrl
	if (audioUrl) {
		audio = new Audio(audioUrl)
		audio.preload = 'auto'
		soundBtn.hidden = false
	}
	const show = (t) => {
		film.render(t)
		range.value = t
		const beat = Math.floor(t / film.spb)
		out.textContent = `${t.toFixed(3)} s · bar ${Math.floor(beat / 4) + 1}.${(beat % 4) + 1}`
	}
	const fit = () => {
		const avail = window.innerHeight - bar.offsetHeight - 24
		const s = Math.min(avail / film.height, (window.innerWidth - 24) / film.width)
		film.svg.style.width = `${film.width * s}px`
		film.svg.style.height = `${film.height * s}px`
	}
	const tick = (now) => {
		if (!playing) return
		let t = startT + (now - startWall) / 1000
		if (audio && !audio.paused) t = audio.currentTime
		if (t >= film.duration) {
			t = 0
			startT = 0
			startWall = now
			if (audio && !audio.muted) { audio.currentTime = 0; audio.play() }
		}
		show(t)
		requestAnimationFrame(tick)
	}
	const play = (on) => {
		playing = on
		playBtn.textContent = on ? 'Pause' : 'Play'
		if (on) {
			startT = parseFloat(range.value) >= film.duration ? 0 : parseFloat(range.value)
			startWall = performance.now()
			if (audio && soundBtn.getAttribute('aria-pressed') === 'true') { audio.currentTime = startT; audio.play() }
			requestAnimationFrame(tick)
		} else if (audio) audio.pause()
	}
	playBtn.onclick = () => play(!playing)
	range.oninput = () => { play(false); show(parseFloat(range.value)) }
	bar.querySelector('[data-a=safe]').onclick = (e) => {
		const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'
		e.currentTarget.setAttribute('aria-pressed', on)
		film.overlay.setAttribute('display', on ? 'inline' : 'none')
	}
	soundBtn.onclick = (e) => {
		const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'
		e.currentTarget.setAttribute('aria-pressed', on)
		if (!on && audio) audio.pause()
		if (on && playing && audio) { audio.currentTime = parseFloat(range.value); audio.play() }
	}
	window.addEventListener('keydown', (e) => {
		if (e.target.tagName === 'INPUT' && e.key !== ' ') return
		const step = e.shiftKey ? film.spb : 1 / film.fps
		if (e.key === ' ') { e.preventDefault(); play(!playing) }
		if (e.key === 'ArrowRight') { play(false); show(Math.min(film.duration, parseFloat(range.value) + step)) }
		if (e.key === 'ArrowLeft') { play(false); show(Math.max(0, parseFloat(range.value) - step)) }
	})
	window.addEventListener('resize', fit)
	fit()
	show(t0)
	if (q.has('autoplay')) play(true)
}
