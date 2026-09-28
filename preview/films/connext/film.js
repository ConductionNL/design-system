/**
 * ConNext film, round 6: the modular film (storyboard A19, Ruben's round-6 notes of 2026-09-28;
 * round 5 was A18, kept in the review folder round6/round5-film/).
 *
 *   0 to 5.63 s        the shared Conduction opening (_lib/scenes/opening.js, addOpening), 3 bars
 *   5.63 to 31.88 s    the body: one unbroken camera through a honeycomb of apps (./scenes/world.js):
 *                      a lead, its Nextcloud components loading one by one into the grid under it
 *                      (each with its line under "Start a lead"); the story row lands; the contract
 *                      fills itself in (Filinq); the client signs (Portaliq); you draw what happens
 *                      next (the flow lane); instant notifications, desktop and mobile; ask the
 *                      Nextcloud Assistant, it prepares actions and suggestions (Hermiq); the pull
 *                      out. 14 bars
 *   31.88 to 35.63 s   the shared "Built on ConNext" piece (_lib/scenes/closing.js), 2 bars
 *   35.63 to 41.25 s   the shared install board (_lib/scenes/closing.js), 3 bars
 *
 * 1920 x 1080, 24 fps, 22 bars at 128 BPM (990 frames, 45 a bar). No loop: the film opens on
 * the Conduction opening, so its end does not flow into frame 1; the install board holds to the
 * last frame and the sound resolves (music.loop false). Key frames, layout and times:
 * boards/A19/ (board.js, timing.js), shared with the storyboard. Round 3's film is kept in the
 * review folder (round5/round3-film/), round 5's in round6/round5-film/.
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene } from '../_lib/scenes/closing.js'
import { DURATION, FPS, BPM, T, START, LEN, BARS } from './boards/A19/timing.js'
import { meta } from './boards/A19/board.js'
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
 * The bed, in D, across all 22 bars (bars count from 0, ranges [from, to)). The opening has
 * no bed (its sound is the electricity itself, ending on a dry click); the pad enters with the
 * body on bar 3, the offbeat bass a bar later, the kick with the contract, hats from the
 * signature, claps under the flow, the notifications and the assistant; the bed thins to pad
 * and bass for the closing pieces and resolves on D for the last bar. No loop.
 */
film.music = {
	bars: BARS,
	chords: [
		[50, 54, 57, 62], [50, 54, 57, 62], [50, 54, 57, 62], // 0-2 the opening (no pad)
		[50, 54, 61, 64], // 3 Dmaj9: start a lead
		[47, 54, 57, 61], // 4 Bm9: the components load
		[47, 50, 54, 57], // 5 Gmaj9: the last one holds
		[49, 52, 57, 59], // 6 A add9: the links draw back; the row lands; the push
		[47, 50, 54, 57], // 7 Gmaj9: the contract
		[49, 52, 57, 59], // 8 A add9: the signature
		[49, 52, 54, 57], // 9 F#m7: the lane, the trigger
		[47, 50, 54, 61], // 10 Bm add9: the step drops in
		[47, 50, 54, 59], // 11 Gmaj7: into Nextcloud, the badge
		[50, 54, 55, 59], // 12 Em9: desktop and mobile
		[47, 50, 54, 57], // 13 Gmaj9: the assistant
		[50, 54, 55, 59], // 14 Em9: the answer
		[47, 50, 54, 57], // 15 Gmaj9: it prepares
		[50, 52, 57, 59], // 16 A sus4 add9: waiting; the pull out
		[50, 54, 61, 64], // 17 Dmaj9: built on
		[47, 54, 57, 61], // 18 Bm9
		[47, 50, 54, 57], // 19 Gmaj9: install the app
		[49, 52, 57, 59], // 20 A add9: use it, own your data
		[50, 54, 57, 62], // 21 D: always open source and free
	],
	bass: [38, 38, 38, 38, 35, 43, 45, 43, 45, 42, 35, 43, 40, 43, 40, 43, 45, 38, 35, 43, 45, 38],
	parts: { pad: [[3, 22]], bass: [[4, 21]], kick: [[7, 17]], hat: [[8, 17]], clap: [[9, 16]] },
	loop: false,
}

film.board = { film: 'connext', variant: 'A19', keys: Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, START.body + v])), meta: { title: meta.title, words: meta.words } }
/** For the checks: the camera, the rests, the ground under a screen point, and the timing. */
window.__connext = { camera, rests, groundAt, KEYS, T, START, LEN, captions: captions.length }
film.start()
