/**
 * The Conduction opening on its own: the sting that opens every Conduction
 * film (Ruben, round 4, 2026-09-27). The motion and its sound cues live in
 * ../_lib/scenes/opening.js, so a film prepends exactly this with
 * addOpening(film, { at: 0 }).
 *
 * 1920 x 1080, 24 fps, 3 bars at 128 BPM (5.625 s, 135 frames).
 * Storyboard: boards/A/board.js (board.html?film=opening&v=A).
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'

const film = new Film({
	mount: document.getElementById('film'),
	format: '16x9',
	fps: 24,
	duration: OPENING.duration,
	bpm: 128,
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
})
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
addOpening(film, { at: 0 })

/** No bed: the opening's sound is the electricity itself (hum, crackle, arcs, power-on). */
film.music = { bars: OPENING.bars, parts: {} }
film.board = { film: 'opening', variant: 'A', meta: { title: 'Conduction opening', words: 1 } }
window.__opening = OPENING
film.start()
