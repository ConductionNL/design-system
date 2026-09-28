/**
 * Round 22: the install board concepts, each on its own 3-bar page for a preview render.
 *   ?c=current (the pick, the default) | lock | split     ?nl for the Dutch words
 * Round 26: ?handoff plays Built on Nextcloud (4 bars) into the install board, to check the hand-off
 * (render a window of it with film.mjs --from/--to). ?app=<id> sets the lead.
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { installScene, builtOnScene, INSTALL_DUR, BUILT_ON_DUR } from '../_lib/scenes/closing.js'

const q = new URLSearchParams(location.search)
const concept = q.get('c') || 'current'
const handoff = q.has('handoff')
// ?from=<s>&to=<s> plays a window of the page (the hand-off only), so a short mp4 can be rendered of it.
const from = +(q.get('from') || 0)
const B = (handoff ? BUILT_ON_DUR : 0) - from
const to = q.has('to') ? +q.get('to') - from : B + INSTALL_DUR
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: to, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
const lang = q.has('nl') ? 'nl' : 'en'
if (handoff) film.scene('builtOn', -from, B, (ctx) => builtOnScene(ctx, { app: (q.get('app') || 'pipelinq').replace(/[^a-z]/g, ''), on: 'nextcloud', lang }))
film.scene('install', B, B + INSTALL_DUR, (ctx) => installScene(ctx, { concept, lang }), { post: 0.001 })
// The bed of a closing: pad and bass, resolving on D.
const bars = Math.ceil(to / (4 * 60 / 128))
for (let i = film.cues.length - 1; i >= 0; i--) if (film.cues[i].t < 0 || film.cues[i].t > to) film.cues.splice(i, 1)
film.music = handoff
	? { bars, chords: [[50, 54, 57, 62], [47, 50, 54, 57], [43, 47, 50, 55], [45, 49, 52, 57], [47, 50, 54, 57], [49, 52, 57, 59], [50, 54, 57, 62]], bass: [38, 35, 31, 33, 43, 45, 38], parts: { pad: [[0, bars]], bass: [[0, bars]] }, loop: false }
	: { bars: 3, chords: [[47, 50, 54, 57], [49, 52, 57, 59], [50, 54, 57, 62]], bass: [43, 45, 38], parts: { pad: [[0, 3]], bass: [[0, 3]] }, loop: false }
film.board = { film: 'closing-concepts', meta: { title: `Install board, concept ${concept}` } }
film.start()
