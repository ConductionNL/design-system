/**
 * Archiefwaardig (nl): Nextcloud as the only DMS where the storage itself enforces the retention period,
 * in the windows people already use. Eleven handelingscasussen on a Dutch voice-over, each one action by
 * Sanne (fictional) and the system's answer. ANIMATIC: timed storyboard with voice, for review.
 *
 * Story and screens adapted from the demo 'Archiefwaardige opslag voor de medewerker' by Erik Hoekstra
 * (Gemeente Haarlem), EUPL-1.2, https://github.com/EHa-1999/XENA
 * (Redrawn in Conduction's own tokens and type; no colours, logos or names from the demo appear on screen.)
 *
 *   bars 1 to 3        the shared Conduction opening (_lib/scenes/opening.js), no voice
 *   body               eleven scenes (./scenes/body.js), each as long as its voice take and its caption's
 *                      reading hold need, in whole beats (./scenes/plan.js computes it from the alignments)
 *   4 bars             "Gebouwd op Nextcloud", verrijkt door Conduction (the shared Built on piece, lang nl), no voice
 *   3 bars             the shared install board, "Installeer het / Gebruik het / Bezit het"
 *
 * 1920 x 1080, 24 fps, 128 BPM. The voice is master: every caption word and every move in a scene is
 * started by the word that says it; the bed and the effects duck under the voice (score.mjs music.voice).
 * The voice takes are generated takes only (provisional voice, see the film skill); the voice model and
 * the recordings stay private.
 */
import { Film, loadFonts } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { addOpening, OPENING } from '../_lib/scenes/opening.js'
import { builtOnScene, installScene, BUILT_ON_DUR, INSTALL_DUR, CLOSING } from '../_lib/scenes/closing.js'
import { timeline } from '../_lib/timeline.js'
import { planKinetic } from '../_lib/scenes/kinetic.js'
import { SCENES, BODY, BODY_BARS, TAKES, BAR } from './scenes/plan.js'
import { builder, cuesFor, captionSpec } from './scenes/body.js'

const q = new URLSearchParams(location.search)
const O = OPENING.duration // 3 bars
const OPEN_BARS = Math.round(O / BAR), BUILT_BARS = Math.round(BUILT_ON_DUR / BAR), INST_BARS = Math.round(INSTALL_DUR / BAR)
const TOTAL_BARS = OPEN_BARS + BODY_BARS + BUILT_BARS + INST_BARS
const START = { body: O, builtOn: O + BODY, install: O + BODY + BUILT_ON_DUR }
const VOICE = (n) => `preview/films/archiefwaardig/voice/nl-${n}.mp3`

// No voice over the shared opening and closing pieces (bible, round 30): the takes live in the body only.

const TL = timeline({
	bpm: 128, fps: 24, bars: TOTAL_BARS,
	scenes: [
		{ id: 'opening', from: { s: 0 }, to: { s: O } },
		...SCENES.map((S) => ({ id: S.id, from: { s: O + S.start }, to: { s: O + S.end } })),
		{ id: 'builtOn', from: { s: START.builtOn }, to: { s: START.install } },
		{ id: 'install', from: { s: START.install }, to: { s: START.install + INSTALL_DUR } },
	],
	voice: [
		...SCENES.map((S) => ({ id: S.id, src: VOICE(S.take), at: +(O + S.start + S.vo).toFixed(4), words: TAKES[S.take].words })),
	],
})
if (Math.abs(TL.duration - (START.install + INSTALL_DUR)) > 1e-6) console.error(`archiefwaardig: duration mismatch ${TL.duration} vs ${START.install + INSTALL_DUR}`)

/* ---------- captions (film time), for the timeline and grid-check ---------- */
const PLANS = Object.fromEntries(SCENES.map((S) => [S.id, planKinetic(captionSpec(S))]))
for (const S of SCENES) {
	const p = PLANS[S.id], t0 = O + S.start
	TL.captions.push({ id: S.id, text: p.items.map((it) => it.display).join(' '), up: t0 + p.items[0].t0, out: t0 + p.out, rise: p.lastUp - p.items[0].t0, exit: p.exit })
}

/* ---------- the film ---------- */
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: TL.duration, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

addOpening(film, { at: 0 })
for (const S of SCENES) film.scene(S.id, O + S.start, O + S.end, builder(S))
const CLOSE = { lang: 'nl', lead: 'openregister' }
film.scene('builtOn', START.builtOn, START.install, (ctx) => builtOnScene(ctx, CLOSE))
film.scene('install', START.install, TL.duration, (ctx) => installScene(ctx, CLOSE), { post: 0.001 })

/* ---------- sound: cues next to the moves that cause them; the voice wins ---------- */
for (const S of SCENES) {
	const t0 = O + S.start
	for (const { t, kind, ...o } of cuesFor(S)) TL.cue({ s: t0 + t }, kind, o)
	// The hero word's click, when it is fully turned (kinetic recipe `hero`).
	for (const it of PLANS[S.id].items) if (it.role === 'hero') TL.cue({ s: t0 + it.up }, 'click', { gain: 0.14, freq: 2900, seed: 211, dry: true })
}
TL.cue({ s: START.builtOn - 0.02 }, 'click', { gain: 0.2, freq: 2600, seed: 75 })
TL.cuesInto(film)

/**
 * The bed, in D, one chord a bar (bars from 0, ranges [from, to)). The opening has no bed; the pad
 * enters on the hook, the offbeat bass from the first proof, a soft kick under the middle proofs; it
 * thins to pad and bass for the closing pieces and resolves on D. Ducked 15 dB under the voice (Ruben, round 30: the voice must sit clearly on top).
 */
const D = [50, 54, 57, 62], Dmaj9 = [50, 54, 61, 64], Bm9 = [47, 54, 57, 61], Gmaj9 = [47, 50, 54, 57], Aadd9 = [49, 52, 57, 59], Em9 = [50, 54, 55, 59], Fsm7 = [49, 52, 54, 57]
const CYCLE = [Gmaj9, Aadd9, Dmaj9, Bm9, Gmaj9, Aadd9, Fsm7, Bm9, Em9, Gmaj9, Aadd9, Dmaj9]
const ROOTS = new Map([[Gmaj9, 43], [Aadd9, 45], [Dmaj9, 38], [Bm9, 35], [Fsm7, 42], [Em9, 40], [D, 38]])
const bodyChords = Array.from({ length: BODY_BARS }, (_, i) => CYCLE[i % CYCLE.length])
const chords = [D, D, D, ...bodyChords, Dmaj9, Bm9, Aadd9, Gmaj9, Gmaj9, Aadd9, D]
if (chords.length !== TOTAL_BARS) console.error(`archiefwaardig: ${chords.length} chords for ${TOTAL_BARS} bars`)
const BODY_END = OPEN_BARS + BODY_BARS
film.music = {
	bars: TOTAL_BARS,
	chords,
	bass: chords.map((c) => ROOTS.get(c)),
	parts: { pad: [[OPEN_BARS, TOTAL_BARS]], bass: [[OPEN_BARS + 4, TOTAL_BARS - 1]], kick: [[OPEN_BARS + 10, BODY_END - 4]], hat: [[OPEN_BARS + 18, BODY_END - 6]] },
	loop: false,
	duckDb: 15,
	voice: TL.voice.map(({ src, at, gain }) => ({ src, at, gain })),
}

film.board = { film: 'archiefwaardig', variant: 'nl', meta: { title: 'Archiefwaardig', words: TL.captions.map((c) => c.text).join(' '), animatic: true } }
window.__archiefwaardig = {
	scenes: SCENES.map((S) => ({ id: S.id, take: S.take, beats: S.beats, bars: S.beats / 4, start: +(O + S.start).toFixed(4), end: +(O + S.end).toFixed(4), need: S.need, caption: PLANS[S.id].items.map((it) => it.display).join(' ') })),
	start: START, duration: TL.duration, bars: TOTAL_BARS,
}
TL.expose()
if (q.has('dump')) console.log(JSON.stringify(window.__archiefwaardig))
film.start()
