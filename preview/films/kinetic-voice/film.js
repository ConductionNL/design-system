/**
 * Kinetic type on a voice: one line in Dutch, then the same line in English, each word arriving on
 * the frame it is spoken.
 *
 *   0 to 5.63 s     bars 1 to 3   "Gebouwd op Nextcloud, verrijkt door Conduction." (take nl-04)
 *   5.63 to 11.25 s bars 4 to 6   "Built on Nextcloud, enhanced by Conduction." (take en-04)
 *
 * The voice is master: each take is placed so its first word lands on beat 2 of its section, and the
 * words come from the take's WhisperX alignment (voice/*.words.json), not from the grid. The recipe is
 * `hero` (_lib/scenes/kinetic.js): the line locks word by word and "Conduction" flips in in orange,
 * the one orange of the scene. On the right, a field cell turns over into the Nextcloud hex as
 * "Nextcloud" is heard, and the next one into the Conduction hex as "Conduction" is heard. At the
 * end of each section the line leaves and both cells turn back, so the last frame flows into frame 1.
 *
 * PROVISIONAL VOICE. The takes are generated from Ruben's cloned voice (VoxCPM2, the clean-reference
 * run, take 04). Ruben has not yet picked between this voice and the trained one; when he does, swap
 * the mp3 and the words JSON, and the film retimes itself. Only generated takes live in this public
 * repo; the voice model and the recordings stay in a private repository (ConductionNL/voice-ruben).
 *
 * Every frame is a pure function of time. 1920 x 1080, 24 fps, 128 BPM, 6 bars (270 frames).
 */
import { Film, loadFonts, el, textBlock } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets, MARK_BOX } from '../_lib/assets.js'
import { inv, hexPath, ease } from '../_lib/core.js'
import { timeline } from '../_lib/timeline.js'
import { kineticText, wordsAt, planKinetic } from '../_lib/scenes/kinetic.js'
import { honeyAt, FIELD_ALPHA, TYPE } from '../_lib/ui.js'
import { F, CURVES } from '../_lib/motion.js'

const q = new URLSearchParams(location.search)
const takes = {}
for (const lang of ['nl', 'en']) {
	const res = await fetch(new URL(`./voice/${lang}-04.words.json`, import.meta.url))
	takes[lang] = await res.json()
}

/* ---------- the timeline: every time in this film comes from here ---------- */
const BEAT = 60 / 128
// Each take sits so its first spoken word lands on beat 2 of its section (bar 1 and bar 4).
const AT = {
	nl: 1 * BEAT - takes.nl.words[0].start,
	en: 13 * BEAT - takes.en.words[0].start,
}
const LINES = [[0, 1], [2], [3, 4], [5]] // "Gebouwd op / Nextcloud / verrijkt door / Conduction": at most 2 words a line in the type column
const OUT = { nl: '4.1', en: { s: 11.25 - F(2) } } // the NL line is gone on the bar line; the EN line clears two frames before the loop point
const WORDS = { nl: wordsAt(takes.nl.words, AT.nl), en: wordsAt(takes.en.words, AT.en) }
const TL = timeline({
	bpm: 128, fps: 24, bars: 6,
	scenes: [{ id: 'nl', from: '1.1', to: '4.1' }, { id: 'en', from: '4.1', to: '7.1' }],
	voice: [
		{ id: 'nl', src: 'preview/films/kinetic-voice/voice/nl-04.mp3', at: AT.nl, words: takes.nl.words },
		{ id: 'en', src: 'preview/films/kinetic-voice/voice/en-04.mp3', at: AT.en, words: takes.en.words },
	],
})
const G = TL.grid
const outOf = (lang) => G.at(OUT[lang])
const SPEC = Object.fromEntries(['nl', 'en'].map((lang) => [lang, {
	recipe: 'hero', hero: 'Conduction', words: WORDS[lang], lines: LINES, out: outOf(lang),
	x: TYPE.x, y: 470, size: 112, lineHeight: 1.07,
}]))
const PLAN = { nl: planKinetic(SPEC.nl), en: planKinetic(SPEC.en) }
for (const lang of ['nl', 'en']) {
	const p = PLAN[lang]
	TL.captions.push({ id: lang, text: p.items.map((it) => it.display).join(' '), up: p.items[0].t0, out: p.out, rise: p.lastUp - p.items[0].t0, exit: p.exit })
}

/* ---------- the film ---------- */
const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: TL.duration, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)

/* The field on the right: one honeycomb, solid, never a second grid (round 28c). Two of its cells turn over. */
const HC = { x: 1390, y: 500, r: 104, gap: 12 }
const at = honeyAt(HC.x, HC.y, HC.r, HC.gap)
const CELL = { nextcloud: [0, 0], conduction: [1, 0] }
const fieldFill = (d) => ({ fill: C.cobalt400, 'fill-opacity': (FIELD_ALPHA[d] ?? 0.05) + (d <= 1 ? 0.14 : 0) })
const isCell = (q, r) => Object.values(CELL).some(([a, b]) => a === q && b === r)
/** When each cell turns over: the face swaps on the frame the word is heard, so the flip ends one frame later. */
const FLIP = 6 // frames for a whole turn: 3 to squash the old face, 3 to open the new one
function cellTimes(lang) {
	const items = PLAN[lang].items
	const word = (re) => items.find((it) => re.test(it.word))
	return {
		nextcloud: { on: word(/^Nextcloud/).onset, off: PLAN[lang].out - F(4) },
		conduction: { on: word(/^Conduction/).onset, off: PLAN[lang].out - F(3) },
	}
}
const TIMES = { nl: cellTimes('nl'), en: cellTimes('en') }

/** 0..1 squash of a turning cell and which face shows, for a cell lit at `on` and turned back at `off`. */
function turn(t, on, off) {
	const half = F(FLIP / 2)
	if (t < on - half) return { s: 1, lit: false }
	if (t < on) return { s: 1 - ease.inCubic(inv(on - half, on, t)), lit: false }
	if (t < on + half) return { s: ease.outCubic(inv(on, on + half, t)), lit: true }
	if (t < off - half) return { s: 1, lit: true }
	if (t < off) return { s: 1 - ease.inCubic(inv(off - half, off, t)), lit: true }
	if (t < off + half) return { s: ease.outCubic(inv(off, off + half, t)), lit: false }
	return { s: 1, lit: false }
}

film.scene('field', 0, TL.duration, (ctx) => {
	const still = el('g', { 'data-part': 'field' }, ctx.g)
	for (let qq = -5; qq <= 5; qq++) {
		for (let rr = -5; rr <= 5; rr++) {
			const d = Math.max(Math.abs(qq), Math.abs(rr), Math.abs(qq + rr))
			const [x, y] = at(qq, rr)
			if (isCell(qq, rr) || x < 900 + HC.r || x > 1920 + HC.r || y < -HC.r || y > 1080 + HC.r) continue
			el('path', { d: hexPath(x, y, HC.r, HC.r * 0.1), ...fieldFill(d) }, still)
		}
	}
	const live = el('g', { 'data-part': 'cells' }, ctx.g)
	const [bw, bh] = MARK_BOX['nextcloud-logo']
	const [aw, ah] = MARK_BOX['avatar-conduction']
	return (t) => {
		live.replaceChildren()
		const lang = t < G.barAt(3) ? 'nl' : 'en'
		for (const [id, [qq, rr]] of Object.entries(CELL)) {
			const [x, y] = at(qq, rr)
			const d = Math.max(Math.abs(qq), Math.abs(rr), Math.abs(qq + rr))
			const { on, off } = TIMES[lang][id]
			const { s, lit } = turn(t, on, off)
			const g = el('g', { transform: `translate(${x.toFixed(2)} 0) scale(${Math.max(s, 1e-4).toFixed(4)} 1) translate(${(-x).toFixed(2)} 0)` }, live)
			if (!lit) { el('path', { d: hexPath(x, y, HC.r, HC.r * 0.1), ...fieldFill(d) }, g); continue }
			if (id === 'nextcloud') {
				el('path', { d: hexPath(x, y, HC.r, HC.r * 0.13), fill: C.nextcloud }, g)
				const w = HC.r * 1.12, h = (w * bh) / bw
				el('use', { href: '#nextcloud-logo', x: x - w / 2, y: y - h / 2, width: w, height: h, color: C.white }, g)
			} else {
				el('path', { d: hexPath(x, y, HC.r, HC.r * 0.13), fill: C.white }, g)
				const h = HC.r * 0.98, w = (h * aw) / ah
				el('use', { href: '#avatar-conduction', x: x - w / 2, y: y - h / 2, width: w, height: h, color: C.cobalt }, g)
			}
		}
	}
})

/* The section mark (round 27c: a section title, not the app name) and the provisional note. */
film.scene('mark', 0, TL.duration, (ctx) => {
	textBlock(ctx.g, 'Voice', { x: TYPE.x, y: TYPE.markY - 20, size: 58, weight: 700, fill: C.white, tracking: -0.02, clip: false })
	textBlock(ctx.g, 'Provisional voice', { x: TYPE.x, y: TYPE.markY + 34, size: 30, weight: 500, family: 'IBM Plex Mono', fill: C.cobalt200, tracking: 0, clip: false })
})

/* The two lines, each its own scene, words on the voice. */
const made = {}
for (const lang of ['nl', 'en']) {
	const s = TL.scene(lang)
	film.scene(`line-${lang}`, s.start, s.end, (ctx) => {
		made[lang] = kineticText(ctx.g, SPEC[lang])
		return (t) => made[lang].update(t)
	}, { post: 0.001 })
}

/* ---------- sound: the voice wins ---------- */
// The cell turns are the only visible causes besides the words: a soft tick on each face swap, the
// hero click from the recipe on "Conduction". Nothing on the other words: the voice carries them.
for (const lang of ['nl', 'en']) {
	TL.cue({ s: TIMES[lang].nextcloud.on }, 'tick', { freq: 1568, gain: 0.05, pan: 0.35 })
	for (const { t, kind, ...o } of made[lang].cues) TL.cue({ s: t }, kind, { ...o, gain: 0.12 })
	TL.cue({ s: TIMES[lang].conduction.off }, 'tick', { freq: 1318.5, gain: 0.03, pan: 0.35 })
}
TL.cuesInto(film)
film.music = {
	bars: 6,
	chords: [[50, 54, 57, 62], [47, 54, 57, 62], [55, 59, 62, 66], [57, 61, 64, 69]],
	bass: [38, 35, 43, 45],
	parts: { pad: [[0, 6]] },
	loop: true,
	voice: TL.voice.map(({ src, at, gain }) => ({ src, at: +at.toFixed(4), gain })),
}
film.audioUrl = new URL('./mix.mp3', import.meta.url).href
film.board = { film: 'kinetic-voice', meta: { title: 'Kinetic type on a voice', provisional: 'voice not final' } }
window.__kineticVoice = { plans: PLAN, at: AT, times: TIMES }
TL.expose()
if (q.has('dump')) console.log(JSON.stringify(window.__timeline))
film.start()
