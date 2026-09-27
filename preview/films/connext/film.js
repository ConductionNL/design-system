/**
 * ConNext film: direction A, "One take", 16:9 (storyboard A16, approved by
 * Ruben for animation on 2026-09-27, round 3).
 *
 * One unbroken camera move through a honeycomb of apps: close on a client in
 * Nextcloud, pull back as their files, mail, calendar and chats settle round
 * them, push into Filinq where the contract fills itself in, then travel east
 * along one row, cell by cell: Portaliq (your client signs), Nextcloud (the
 * right person hears about it), Hermiq (ask about your clients; it asks
 * first), pull out to the whole honeycomb and the install call, and push back
 * in on the client, so the last frame is frame 1.
 *
 * 1920 x 1080, 24 fps, 18.75 s = 10 bars at 128 BPM (450 frames, 45 a bar).
 * Key frames, layout and times: boards/A16/ (board.js, timing.js), shared
 * with the storyboard, so an approved still is what the film passes through.
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { DURATION, FPS, BPM, T } from './boards/A16/timing.js'
import { meta } from './boards/A16/board.js'
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

film.scene('world', 0, DURATION, buildWorld, { post: 0.001 })
// ?notype draws the world alone, for checking what sits behind a caption.
const captions = q.has('notype') ? [] : buildType(film, camera)

/**
 * The bed: a warm progression in D across the ten bars that resolves on the
 * loop (bar 10 is A sus, bar 1 is D). Pad alone for the first bar and the end
 * card's hold, offbeat bass from bar 2, kick from bar 3 (with the contract),
 * hats from bar 4, claps on bars 6 to 8 (the bell and the assistant), and the
 * bed drops to the pad on bar 10. Bars count from 0 here, ranges are
 * [from, to). loop: the pad and every tail carry across the loop point
 * instead of fading out (see scripts/films/score.mjs).
 */
film.music = {
	bars: 10,
	chords: [
		[50, 54, 61, 64], // 1 Dmaj9: open a client
		[47, 54, 57, 61], // 2 Bm9: the ring settles
		[47, 50, 54, 57], // 3 Gmaj9 (the bass has the G): the contract
		[49, 52, 57, 59], // 4 A add9: the signature
		[49, 52, 54, 57], // 5 F#m7: into Nextcloud
		[47, 50, 54, 61], // 6 Bm add9: the bell
		[47, 50, 54, 59], // 7 Gmaj7: ask
		[50, 54, 55, 59], // 8 Em9: it asks first
		[47, 50, 54, 57], // 9 Gmaj9: the whole honeycomb, the call
		[50, 52, 57, 59], // 10 A sus4 add9: back to D on frame 1
	],
	bass: [38, 35, 43, 45, 42, 35, 43, 40, 43, 45],
	parts: { pad: [[0, 10]], bass: [[1, 9]], kick: [[2, 9]], hat: [[3, 9]], clap: [[5, 8]] },
	loop: true,
}

film.board = { film: 'connext', variant: 'A16', keys: KEYS, meta: { title: meta.title, words: meta.words } }
/** For the checks: the camera, the rests, the ground under a screen point, and the timing. */
window.__connext = { camera, rests, groundAt, KEYS, T, captions: captions.length }
film.start()
