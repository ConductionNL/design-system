/**
 * Archiving film (nl), "Archiefwaardig vanaf het begin": the round-12 storyboard (boards/nl/)
 * animated. Dutch on screen, for this film only (bible, Round 10).
 *
 *   0 to 5.63 s        the shared Conduction opening (_lib/scenes/opening.js), 3 bars, handing over on its field
 *   5.63 to 31.88 s    the body (./scenes/body.js), 14 bars, rounds 19 to 28f: the question, its answer, Metadata,
 *                      Integratie, Bewaartermijn, Vernietiging, Standaarden; designed hand-offs, no promise card
 *   31.88 to 39.38 s   "Gebouwd op Nextcloud", verrijkt door Conduction: the shared connection piece (lang nl, rounds 27 to 28d), 4 bars
 *   39.38 to 45.00 s   the shared install board (Round 27b/28, no wire), "Installeer het / Gebruik het / Bezit het", 3 bars
 *
 * 1920 x 1080, 24 fps, 24 bars at 128 BPM (1080 frames, 45 a bar). The master rendered at 7689c5e used the round-6 closing (37.5 s). No loop; the install board holds
 * to the last frame and the bed resolves on D. No bell anywhere: clicks (Round 5).
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene, BUILT_ON_DUR, INSTALL_DUR } from '../_lib/scenes/closing.js'
import { SCENES, BODY, BODY_BARS, BUILDERS, SPB, BAR, FPS, TYPE_AT_EXPORT, MOVES } from './scenes/body.js'

// Round 22: Built on is 4 bars, the install board 3 (the shared closing.js).
const BUILT = BUILT_ON_DUR
const INSTALL = INSTALL_DUR
const DURATION = OPENING.duration + BODY + BUILT + INSTALL // 45
const film = new Film({
	mount: document.getElementById('film'),
	format: '16x9',
	fps: FPS,
	duration: DURATION,
	bpm: 128,
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
})
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

const O = addOpening(film, { at: 0 }) // 5.625
const START = { body: O, builtOn: O + BODY, install: O + BODY + BUILT }
if (Math.abs(START.install + INSTALL - DURATION) > 1e-6) console.error('duration mismatch')

for (const sc of SCENES) film.scene(sc.id, O + sc.start, O + sc.end, BUILDERS[sc.id])
const CLOSE = { lang: 'nl', lead: 'openregister', apps: ['dossiq', 'filinq'] }
film.scene('builtOn', START.builtOn, START.install, (ctx) => builtOnScene(ctx, CLOSE))
film.scene('install', START.install, DURATION, (ctx) => installScene(ctx, CLOSE), { post: 0.001 })

/* ---------- sound cues, next to the motion that causes them (film seconds) ---------- */
const sc = (id) => SCENES.find((s) => s.id === id)
const at = (id, b) => O + sc(id).start + b * SPB
const L = (id, t) => O + sc(id).start + t
const end = (id) => O + sc(id).end
const cue = (t, kind, o = {}) => film.cue(t, kind, o)
// question: the window slides in, the document is re-filed (two dull ticks), typed again, the ring draws, a dry click (Round 28: no current)
cue(at('hook', 0.2), 'whoosh', { dur: 0.5, from: 500, to: 2200, panFrom: 0.6, panTo: 0.1, gain: 0.08 })
cue(L('hook', MOVES.q.arrow), 'tick', { freq: 660, gain: 0.1, decay: 0.1 })
cue(L('hook', MOVES.q.arch), 'tick', { freq: 587.33, gain: 0.1, decay: 0.1 })
for (let k = 0; k < 6; k++) cue(L('hook', MOVES.q.type) + k * 0.1, 'tick', { freq: 3000 + 120 * (k % 3), gain: 0.03, decay: 0.02, pan: 0.4 })
cue(L('hook', MOVES.q.ring), 'tick', { freq: 880, gain: 0.12, decay: 0.12 })
cue(L('hook', MOVES.q.click), 'click', { gain: 0.2, freq: 2800, seed: 91, dry: true, pan: 0.4 })
// answer: the separate archive turns out and the workspace panel turns in (two dry clicks, a soft pluck)
cue(L('answer', MOVES.turn[0]), 'click', { gain: 0.18, freq: 3000, seed: 72, dry: true, pan: 0.4 })
cue(L('answer', MOVES.turn[1]), 'click', { gain: 0.22, freq: 2600, seed: 73, dry: true, pan: 0.4 })
cue(L('answer', MOVES.turn[2]), 'pluck', { freq: 1174.66, gain: 0.16 })
// mdto: key ticks, a pluck per field, the scroll-whip out
TYPE_AT_EXPORT.forEach(({ t0, pairs }, i) => {
	for (let k = 0; k < pairs; k++) cue(L('mdto', t0) + k * 0.1, 'tick', { freq: 3200 + 150 * ((k * 7) % 5), gain: 0.035, decay: 0.02, pan: 0.35 })
	cue(L('mdto', t0) + pairs * 0.1, 'pluck', { freq: [987.77, 1108.73, 1174.66, 1318.51, 1479.98][i], gain: i === 4 ? 0.22 : 0.15 })
})
cue(end('mdto') - MOVES.scroll - 0.05, 'whoosh', { dur: 0.4, from: 900, to: 3600, panFrom: 0.3, panTo: 0.3, gain: 0.13 })
// integratie: the connector turns over (click), the lines draw on (hiss), a tick as each record leaves and a pluck as it lands; scroll-whip out
cue(L('integratie', MOVES.int.hex), 'click', { gain: 0.24, freq: 2600, seed: 79, dry: true })
cue(L('integratie', MOVES.int.wires[0]), 'whoosh', { dur: 0.5, from: 5000, to: 3000, panFrom: -0.4, panTo: 0.4, gain: 0.05 })
MOVES.int.cards.forEach((c, i) => {
	cue(L('integratie', c), 'tick', { freq: 1318.51 + i * 110, gain: 0.08, pan: -0.4 })
	cue(L('integratie', c + MOVES.int.run), 'pluck', { freq: [987.77, 1108.73, 1174.66, 1318.51][i], gain: 0.14, pan: 0.4 })
})
cue(end('integratie') - MOVES.scroll - 0.05, 'whoosh', { dur: 0.4, from: 900, to: 3600, panFrom: 0.3, panTo: 0.3, gain: 0.12 })
// selectielijst: a tick as each item's term lands, a click as the last (orange) lands, the card flip out
MOVES.terms.forEach((t0, i) => cue(L('selectielijst', t0), 'tick', { freq: [1174.66, 1318.51, 1479.98, 1567.98, 1760][i], gain: 0.1 }))
cue(L('selectielijst', MOVES.terms[4] + 0.3), 'click', { gain: 0.22, freq: 2600, seed: 77, dry: true })
cue(L('selectielijst', MOVES.terms[4] + 0.3), 'pluck', { freq: 1318.51, gain: 0.2 })
cue(end('selectielijst') - MOVES.flip, 'whoosh', { dur: 0.35, from: 2400, to: 900, panFrom: 0.5, panTo: 0.2, gain: 0.1 })
cue(end('selectielijst'), 'click', { gain: 0.24, freq: 2400, seed: 78, dry: true, pan: 0.3 })
// vernietiging: ticks as the list rows land, a crisp click on the approval, a tick per trail row, a low thud as the seal turns over; the whip out
for (let i = 0; i < 4; i++) cue(at('vernietiging', 0.75 + i * 0.25), 'tick', { freq: [1174.66, 1318.51, 1479.98, 1567.98][i], gain: 0.08, pan: -0.3 })
cue(at('vernietiging', 2.5), 'click', { gain: 0.3, freq: 2600, seed: 76 })
for (let i = 0; i < 4; i++) cue(at('vernietiging', 3.5 + i * 0.6), 'tick', { freq: 1760 + i * 110, gain: 0.09, pan: -0.2 })
cue(at('vernietiging', 5.5), 'impact', { gain: 0.18, from: 120, to: 50, decay: 0.4 })
cue(end('vernietiging') - MOVES.whip - 0.03, 'whoosh', { dur: 0.35, from: 3200, to: 600, panFrom: 0.7, panTo: -0.6, gain: 0.16 })
// standards: the wires draw on (a hiss), the junction turns over, a pluck per outside system
cue(at('standards', 1), 'whoosh', { dur: 0.45, from: 5000, to: 3000, panFrom: -0.2, panTo: 0.3, gain: 0.05 })
cue(at('standards', 1.5), 'tick', { freq: 1479.98, gain: 0.12 })
;[987.77, 1108.73, 1174.66, 1318.51, 1479.98].forEach((f, i) => cue(at('standards', 2.5 + i * 0.35), 'pluck', { freq: f, gain: 0.13, pan: -0.4 + i * 0.2 }))
cue(START.builtOn - 0.02, 'click', { gain: 0.26, freq: 2600, seed: 75 })

/**
 * The bed, in D, 20 bars (bars count from 0, ranges [from, to)). The opening has no bed; the pad
 * enters with the question on bar 3, the offbeat bass under MDTO, the kick from the selectielijst,
 * hats from the destruction round, claps under the standards; it thins to pad and bass for the closing
 * pieces and resolves on D for the last bar.
 */
const OPEN_BARS = 3, BODY_B = BODY_BARS, BUILT_B = Math.round(BUILT / BAR), INST_B = Math.round(INSTALL / BAR)
const TOTAL_BARS = OPEN_BARS + BODY_B + BUILT_B + INST_B // 24
const D = [50, 54, 57, 62], Dmaj9 = [50, 54, 61, 64], Bm9 = [47, 54, 57, 61], Gmaj9 = [47, 50, 54, 57], Aadd9 = [49, 52, 57, 59], Fsm7 = [49, 52, 54, 57], Bmadd9 = [47, 50, 54, 61], Gmaj7 = [47, 50, 54, 59], Em9 = [50, 54, 55, 59], Asus = [50, 52, 57, 59]
/**
 * The bed, in D, 24 bars (bars count from 0, ranges [from, to)). The opening has no bed; the pad enters
 * with the question on bar 3, the offbeat bass under the metadata, the kick from the integration, hats
 * from the retention, claps under the standards; it thins to pad and bass for the closing pieces and
 * resolves on D for the last bar.
 */
film.music = {
	bars: TOTAL_BARS,
	chords: [D, D, D,
		Gmaj9, Aadd9, Dmaj9, Bm9, Gmaj9, Aadd9, Fsm7, Bmadd9, Gmaj7, Em9, Gmaj9, Em9, Gmaj9, Asus, // 14 body bars
		Dmaj9, Bm9, Aadd9, Gmaj9, // built on
		Gmaj9, Aadd9, D], // install
	bass: [38, 38, 38, 43, 45, 38, 35, 43, 45, 42, 35, 43, 40, 43, 40, 43, 45, 38, 35, 45, 43, 43, 45, 38],
	parts: { pad: [[3, TOTAL_BARS]], bass: [[5, TOTAL_BARS - 1]], kick: [[9, 17]], hat: [[11, 17]], clap: [[14, 17]] },
	loop: false,
}

film.board = { film: 'archiving', variant: 'nl', meta: { title: 'Nooit meer archiveren?', words: SCENES.map((s) => s.mark + ' ' + s.text).join(' ') } }
window.__archiving = { SCENES: SCENES.map((s) => ({ ...s, start: O + s.start, end: O + s.end })), START, DURATION }
film.start()
