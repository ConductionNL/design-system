/**
 * Archiving film (nl), "Archiefwaardig vanaf het begin": the round-12 storyboard (boards/nl/)
 * animated. Dutch on screen, for this film only (bible, Round 10).
 *
 *   0 to 5.63 s        the shared Conduction opening (_lib/scenes/opening.js), 3 bars, handing over on its field
 *   5.63 to 28.13 s    the body (./scenes/body.js), 12 bars: two worlds (a separate archive?), MDTO, selectielijst,
 *                      vernietiging, ZGW en ZDS, the promise: je werkplek is het archief (Round 16)
 *   28.13 to 35.63 s   "Gebouwd op Nextcloud", verrijkt door Conduction: the shared Round 22 connection piece (lang nl), 4 bars
 *   35.63 to 41.25 s   the shared Round 22 install board (the current), "Installeer het / Gebruik het / Bezit het", 3 bars
 *
 * 1920 x 1080, 24 fps, 22 bars at 128 BPM (990 frames, 45 a bar). The master rendered at 7689c5e used the round-6 closing (37.5 s). No loop; the install board holds
 * to the last frame and the bed resolves on D. No bell anywhere: clicks (Round 5).
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene, BUILT_ON_DUR, INSTALL_DUR } from '../_lib/scenes/closing.js'
import { SCENES, BODY, BUILDERS, SPB, BAR, FPS, TYPE_AT_EXPORT } from './scenes/body.js'

// Round 22: Built on is 4 bars, the install board 3 (the shared closing.js).
const BUILT = BUILT_ON_DUR
const INSTALL = INSTALL_DUR
const DURATION = OPENING.duration + BODY + BUILT + INSTALL // 41.25
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
const at = (id, b) => O + SCENES.find((s) => s.id === id).start + b * SPB
const cue = (t, kind, o = {}) => film.cue(t, kind, o)
// hook: the window slides in, the document is re-filed (two dull ticks), typed again, the ring draws
cue(at('hook', 0.2), 'whoosh', { dur: 0.5, from: 500, to: 2200, panFrom: 0.6, panTo: 0.1, gain: 0.08 })
cue(at('hook', 1.25), 'tick', { freq: 660, gain: 0.1, decay: 0.1 })
cue(at('hook', 1.75), 'tick', { freq: 587.33, gain: 0.1, decay: 0.1 })
for (let k = 0; k < 6; k++) cue(at('hook', 2) + k * 0.1, 'tick', { freq: 3000 + 120 * (k % 3), gain: 0.03, decay: 0.02, pan: 0.4 })
cue(at('hook', 3.5), 'tick', { freq: 880, gain: 0.12, decay: 0.12 })
// mdto: the tag turns over (dry click), soft key ticks while each field types, a pluck as each completes
cue(at('mdto', 0), 'click', { gain: 0.16, freq: 3000, seed: 72, dry: true, pan: 0.3 })
TYPE_AT_EXPORT.forEach(({ t0, pairs }, i) => {
	for (let k = 0; k < pairs; k++) cue(at('mdto', 0) + t0 + k * 0.1, 'tick', { freq: 3200 + 150 * ((k * 7) % 5), gain: 0.035, decay: 0.02, pan: 0.35 })
	cue(at('mdto', 0) + t0 + pairs * 0.1, 'pluck', { freq: [987.77, 1108.73, 1174.66, 1318.51, 1479.98][i], gain: i === 4 ? 0.22 : 0.15 })
})
// selectielijst: a hard click on the cut, rising ticks under the ripple, a pluck as the row locks and the result lands, the hex grows (whoosh)
cue(at('selectielijst', 0), 'click', { gain: 0.3, freq: 2600, seed: 71 })
for (let d = 0; d < 4; d++) cue(at('selectielijst', 1.25) + d * 0.3, 'tick', { freq: [1174.66, 1318.51, 1479.98, 1760][d], gain: 0.1 })
cue(at('selectielijst', 3), 'pluck', { freq: 880, gain: 0.18 })
cue(at('selectielijst', 4), 'pluck', { freq: 1318.51, gain: 0.22 })
cue(at('selectielijst', 7), 'whoosh', { dur: 0.5, from: 700, to: 4200, panFrom: 0.4, panTo: -0.2, gain: 0.14 })
// vernietiging: ticks as the list rows land, a crisp click on the approval, a tick per trail row, a thud as the seal lands
for (let i = 0; i < 4; i++) cue(at('vernietiging', 1 + i * 0.25), 'tick', { freq: [1174.66, 1318.51, 1479.98, 1567.98][i], gain: 0.08, pan: -0.3 })
cue(at('vernietiging', 2.5), 'click', { gain: 0.3, freq: 2600, seed: 76 })
for (let i = 0; i < 4; i++) cue(at('vernietiging', 3.5 + i * 0.75), 'tick', { freq: 1760 + i * 110, gain: 0.09, pan: -0.2 })
cue(at('vernietiging', 5.75), 'impact', { gain: 0.18, from: 120, to: 50, decay: 0.4 })
// standards: the whip, the wires draw, a pluck per box, a dry click on the swap
cue(at('standards', 0) - 0.05, 'whoosh', { dur: 0.3, from: 3000, to: 600, panFrom: 0.7, panTo: -0.1, gain: 0.16 })
cue(at('standards', 1), 'whoosh', { dur: 0.45, from: 5000, to: 3000, panFrom: -0.2, panTo: 0.3, gain: 0.05 })
cue(at('standards', 2), 'tick', { freq: 1479.98, gain: 0.12 })
cue(at('standards', 2.5), 'pluck', { freq: 987.77, gain: 0.16 })
cue(at('standards', 3.25), 'pluck', { freq: 1174.66, gain: 0.16 })
cue(at('standards', 5), 'click', { gain: 0.22, freq: 2800, seed: 74, dry: true })
// promise: a low thud as the Nextcloud hex lands, a pluck as OpenRegister lands, ticks for Dossiq and Filinq, a click on the bar line
cue(at('promise', 0), 'impact', { gain: 0.28, from: 96, to: 40, decay: 0.7 })
cue(at('promise', 0.5), 'pluck', { freq: 1174.66, gain: 0.24 })
cue(at('promise', 1), 'tick', { freq: 1479.98, gain: 0.12 })
cue(at('promise', 1.25), 'tick', { freq: 1760, gain: 0.12 })
cue(START.builtOn - 0.02, 'click', { gain: 0.26, freq: 2600, seed: 75 })

/**
 * The bed, in D, 20 bars (bars count from 0, ranges [from, to)). The opening has no bed; the pad
 * enters with the question on bar 3, the offbeat bass under MDTO, the kick from the selectielijst,
 * hats from the destruction round, claps under the standards; it thins to pad and bass for the closing
 * pieces and resolves on D for the last bar.
 */
film.music = {
	bars: 22,
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62], // 0-2 the opening (no pad)
		[47, 50, 54, 57], // 3 Gmaj9 (open): two worlds
		[49, 52, 57, 59], // 4 A add9: still asking
		[50, 54, 61, 64], // 5 Dmaj9: MDTO, the fields type
		[47, 54, 57, 61], // 6 Bm9
		[47, 50, 54, 57], // 7 Gmaj9: the selectielijst
		[49, 52, 57, 59], // 8 A add9: the row locks
		[49, 52, 54, 57], // 9 F#m7: the destruction round
		[47, 50, 54, 61], // 10 Bm add9: the trail
		[47, 50, 54, 59], // 11 Gmaj7: ZGW en ZDS
		[50, 54, 55, 59], // 12 Em9: the swap
		[47, 50, 54, 57], // 13 Gmaj9: the promise
		[50, 52, 57, 59], // 14 A sus4 add9
		[50, 54, 61, 64], // 15 Dmaj9: gebouwd op Nextcloud
		[47, 54, 57, 61], // 16 Bm9
		[49, 52, 57, 59], // 17 A add9: the last component line holds
		[47, 50, 54, 57], // 18 Gmaj9: the pull back, verrijkt door Conduction
		[47, 50, 54, 57], // 19 Gmaj9: installeer het
		[49, 52, 57, 59], // 20 A add9: bezit het
		[50, 54, 57, 62], // 21 D: de code blijft open source
	],
	bass: [38, 38, 38, 43, 45, 38, 35, 43, 45, 42, 35, 43, 40, 43, 45, 38, 35, 45, 43, 43, 45, 38],
	parts: { pad: [[3, 22]], bass: [[5, 21]], kick: [[7, 15]], hat: [[9, 15]], clap: [[11, 14]] },
	loop: false,
}

film.board = { film: 'archiving', variant: 'nl', meta: { title: 'Je werkplek is het archief', words: SCENES.map((s) => s.mark + ' ' + s.text).join(' ') } }
window.__archiving = { SCENES: SCENES.map((s) => ({ ...s, start: O + s.start, end: O + s.end })), START, DURATION }
film.start()
