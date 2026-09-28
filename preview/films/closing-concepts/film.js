/**
 * Round 22: the install board concepts, each on its own 3-bar page for a preview render.
 *   ?c=current (the pick, the default) | lock | split     ?nl for the Dutch words
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { installScene, INSTALL_DUR } from '../_lib/scenes/closing.js'

const q = new URLSearchParams(location.search)
const concept = q.get('c') || 'current'
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: INSTALL_DUR, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
film.scene('install', 0, INSTALL_DUR, (ctx) => installScene(ctx, { concept, lang: q.has('nl') ? 'nl' : 'en' }), { post: 0.001 })
// The bed of a closing: pad and bass, resolving on D.
film.music = { bars: 3, chords: [[47, 50, 54, 57], [49, 52, 57, 59], [50, 54, 57, 62]], bass: [43, 45, 38], parts: { pad: [[0, 3]], bass: [[0, 3]] }, loop: false }
film.board = { film: 'closing-concepts', meta: { title: `Install board, concept ${concept}` } }
film.start()
