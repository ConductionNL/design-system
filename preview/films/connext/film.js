/**
 * ConNext film, round 5: the modular film (storyboard A18, Ruben's notes of 2026-09-28).
 *
 *   0 to 5.63 s      the shared Conduction opening (_lib/scenes/opening.js, addOpening), 3 bars
 *   5.63 to 26.25 s  the body: one unbroken camera through a honeycomb of apps (./scenes/world.js):
 *                    a lead and its line diagram to the Nextcloud apps (in Nextcloud blue), which
 *                    fly up round it; the contract fills itself in (Filinq); the client signs
 *                    (Portaliq); you draw what happens next (the flow lane); the right person hears
 *                    about it (the bell, in an app window); the assistant only does what you allow
 *                    (Hermiq); the pull out. 11 bars
 *   26.25 to 30 s    the shared "Built on ConNext" piece (_lib/scenes/closing.js), 2 bars
 *   30 to 35.63 s    the shared install board, as slogans (_lib/scenes/closing.js), 3 bars
 *
 * 1920 x 1080, 24 fps, 19 bars at 128 BPM (855 frames, 45 a bar). No loop: the film opens on
 * the Conduction opening, so its end does not flow into frame 1; the install board holds to the
 * last frame and the sound resolves (music.loop false). Key frames, layout and times:
 * boards/A18/ (board.js, timing.js), shared with the storyboard. Round 3's film is kept in the
 * review folder (round5/round3-film/).
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene } from '../_lib/scenes/closing.js'
import { DURATION, FPS, BPM, T, START, LEN, BARS } from './boards/A18/timing.js'
import { meta } from './boards/A18/board.js'
import { buildWorld, camera, groundAt, KEYS, rests } from './scenes/world.js'
import { buildType } from './scenes/type.js'

const q = new URLSearchParams(location.search)
const film = new Film({
	mount: document.getElementById('film'),
	format: '16x9',
	fps: FPS,
	duration: DURATION,
	bpm: BPM,
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
})
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

// The opening, then the body on the next downbeat.
const bodyAt = addOpening(film, { at: 0 })
if (Math.abs(bodyAt - START.body) > 1e-6) console.error(`opening ends at ${bodyAt}, the storyboard expects ${START.body}`)

film.scene('world', START.body, START.body + LEN.body, buildWorld)
// ?notype draws the world alone, for checking what sits behind a caption.
const captions = q.has('notype') ? [] : buildType(film, camera)

// The closing pieces, each its own scene, the same in every film. The ConNext film puts the apps of its story on top.
film.scene('builtOn', START.builtOn, START.install, (ctx) => builtOnScene(ctx, { apps: ['pipelinq', 'filinq', 'portaliq'] }))
film.scene('install', START.install, DURATION, (ctx) => installScene(ctx, {}), { post: 0.001 })

/**
 * The bed, in D, across all 19 bars (bars count from 0, ranges [from, to)). The opening has
 * no bed (its sound is the electricity itself); the pad enters with the body on bar 3, the
 * offbeat bass a bar later, the kick with the contract (bar 5), hats from the signature,
 * claps under the flow, the bell scene and the assistant; the bed thins to pad and bass for
 * the closing pieces and resolves on D for the last bar. No loop.
 */
film.music = {
	bars: BARS,
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62], // 0-2 the opening (no pad)
		[50, 54, 61, 64], // 3 Dmaj9: start a lead
		[47, 54, 57, 61], // 4 Bm9: the apps fly up round it
		[47, 50, 54, 57], // 5 Gmaj9: the contract
		[49, 52, 57, 59], // 6 A add9: the signature
		[49, 52, 54, 57], // 7 F#m7: the lane, the trigger
		[47, 50, 54, 61], // 8 Bm add9: you place the step
		[47, 50, 54, 59], // 9 Gmaj7: into Nextcloud, the badge
		[50, 54, 55, 59], // 10 Em9: the notice; the hop
		[47, 50, 54, 57], // 11 Gmaj9: the assistant
		[50, 54, 55, 59], // 12 Em9: the change waits
		[50, 52, 57, 59], // 13 A sus4 add9: allowed; the pull out
		[50, 54, 61, 64], // 14 Dmaj9: built on
		[47, 54, 57, 61], // 15 Bm9
		[47, 50, 54, 57], // 16 Gmaj9: install the app
		[49, 52, 57, 59], // 17 A add9: use it, own your data
		[50, 54, 57, 62], // 18 D: always open source, free
	],
	bass: [38, 38, 38, 38, 35, 43, 45, 42, 35, 43, 40, 43, 40, 45, 38, 35, 43, 45, 38],
	parts: { pad: [[3, 19]], bass: [[4, 18]], kick: [[5, 14]], hat: [[6, 14]], clap: [[7, 13]] },
	loop: false,
}

film.board = { film: 'connext', variant: 'A18', keys: Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, START.body + v])), meta: { title: meta.title, words: meta.words } }
/** For the checks: the camera, the rests, the ground under a screen point, and the timing. */
window.__connext = { camera, rests, groundAt, KEYS, T, START, LEN, captions: captions.length }
film.start()
