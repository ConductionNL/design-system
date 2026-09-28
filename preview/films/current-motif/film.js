/**
 * Round 24: a preview of the current as a motif, over an audience film's body. Each body board holds
 * for 2 s (its approved still, without the still's wire); at the start of each the current runs from the
 * previous scene's key element (the first from the frame's centre, where the opening powered on) to this
 * scene's key element and powers it on. ?film=pipelinq&v=kcc
 */
import { Film, loadFonts, el } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { CURRENT, keyElement, landing, sceneCurrent, currentCues } from '../_lib/current.js'
import { LOOP_ANCHOR } from '../_lib/scenes/general.js'

const q = new URLSearchParams(location.search)
const slug = (q.get('film') || 'pipelinq').replace(/[^a-z]/g, '')
const variant = (q.get('v') || 'kcc').replace(/[^a-z-]/g, '')
const mod = await import(`../${slug}/boards/${variant}/board.js`)
const body = mod.boards.filter((b) => !['opening', 'builtOn', 'install'].includes(b.module))
const HOLD = 2
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: body.length * HOLD, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
const anchors = []
body.forEach((b, i) => {
	film.scene(b.id, i * HOLD, (i + 1) * HOLD, (ctx) => {
		const base = el('g', {}, ctx.g)
		const up = b.drawBase(Object.assign(Object.create(ctx), { g: base }))
		const layer = el('g', {}, ctx.g)
		let key = null
		return (t) => {
			if (typeof up === 'function') up(t)
			if (!key) {
				key = keyElement(base, { exclude: b.id === 'promise' ? [] : [[LOOP_ANCHOR.x, LOOP_ANCHOR.y]] })
				if (key) anchors[i] = [key.x, key.y]
			}
			layer.replaceChildren()
			if (!key) return
			const from = i === 0 ? CURRENT.origin : (anchors[i - 1] || CURRENT.origin)
			sceneCurrent(layer, t - ctx.start, { from, to: landing(key, from), element: key, headColor: C.nextcloudCyan, t0: 0.15 })
		}
	}, i === body.length - 1 ? { post: 0.001 } : {})
	currentCues((t, kind, o) => film.cue(t, kind, o), i * HOLD + 0.15)
})
film.music = { bars: Math.ceil((body.length * HOLD) / (4 * 60 / 128)), chords: [[50, 54, 61, 64], [47, 54, 57, 61], [47, 50, 54, 57], [49, 52, 57, 59], [47, 50, 54, 57], [50, 54, 57, 62]], bass: [38, 35, 43, 45, 43, 38], parts: { pad: [[0, 6]], bass: [[0, 6]] }, loop: false }
film.board = { film: 'current-motif', meta: { title: `The current over ${slug} ${variant}` } }
film.start()
