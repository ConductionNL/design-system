/**
 * Round 26: an audience film's body, played as its approved stills with its designed scene hand-offs
 * (_lib/transitions.js). Each board holds its still; the hand-off into it is the one its board names
 * (transition: { type }), or the current where it names none.
 *
 *   ?film=pipelinq&v=kcc               the whole body
 *   &from=<s>&to=<s>                   a window of it, in body seconds (0 = the promise's first frame)
 *   &hand=<n>                          a window round hand-off n (1 = into the board after the promise)
 *   &force=<type>                      every hand-off as one type, to try a transition on a film
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { playBody, handOffs } from '../_lib/transitions.js'
import { LOOP_ANCHOR } from '../_lib/scenes/general.js'
import { holdFor, wordCount } from '../_lib/appfilm.js'

const q = new URLSearchParams(location.search)
const slug = (q.get('film') || 'pipelinq').replace(/[^a-z]/g, '')
const variant = (q.get('v') || 'kcc').replace(/[^a-z-]/g, '')
const mod = await import(`../${slug}/boards/${variant}/board.js`)
const body = mod.boards.filter((b) => !['opening', 'builtOn', 'install'].includes(b.module))
if (q.has('force')) body.forEach((b, i) => { if (i) b.transition = { type: q.get('force').replace(/[^a-zA-Z]/g, '') } })
const B0 = body[0].start, B1 = body.at(-1).end
let from = B0 + +(q.get('from') || 0), to = q.has('to') ? B0 + +q.get('to') : B1
if (q.has('hand')) {
	const h = handOffs(body)[+q.get('hand') - 1]
	from = h.start - 0.3
	to = h.end + 0.5
}
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: +(to - from).toFixed(4), bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
const need = (b) => holdFor(b.id === 'promise' ? wordCount((b.words || '').split('\n').slice(1).join(' ')) : wordCount(b.words))
const { hands, caps } = playBody(film, body, { t0: from, need, exclude: [[LOOP_ANCHOR.x, LOOP_ANCHOR.y]] })
const bars = Math.ceil(film.duration / (4 * 60 / 128))
film.music = { bars, chords: [[50, 54, 61, 64], [47, 54, 57, 61], [47, 50, 54, 57], [49, 52, 57, 59]], bass: [38, 35, 43, 45], parts: { pad: [[0, bars]], bass: [[0, bars]], hat: [[0, bars]] }, loop: false }
film.board = { film: 'transitions', meta: { title: `Scene transitions, ${slug} ${variant}` }, t0: from, hands: hands.map(({ tr, ...h }) => ({ ...h, note: tr.note || '' })), caps }
for (const c of caps) if (c.hold + 1e-6 < c.need) console.error(`caption ${c.id} holds ${c.hold} s, needs ${c.need} s`)
film.start()
