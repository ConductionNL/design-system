/**
 * Archiefwaardig (nl): the plan. Every time in the body comes from here, and every time here comes from
 * the voice: the eleven WhisperX alignments in ../voice/nl-NN.words.json ({ word, start, end } per word).
 *
 * How a scene gets its length (measured, never guessed):
 *   - its take is placed so the first spoken word lands on beat `lead` of the scene (beat 2 by default);
 *   - the caption words are spoken words (by index into the take), so each word starts its reveal two
 *     frames before it is heard (kinetic-type LEAD) and is up four frames later;
 *   - the scene lasts the whole beats that fit both the voice plus a breath and the caption's last word
 *     plus its reading hold (max(1.5 s, 0.4 s per word)) plus its exit and two clear frames;
 *   - the body is padded to whole bars on the last scene, so Built on starts on a bar line.
 * Cuts therefore land on beats; sections (opening, Built on, install) on bars.
 *
 * Shared by film.js and boards/nl/board.js, so the storyboard stills are frames of the film.
 */
import { snapFrame, F } from '../../_lib/motion.js'
import { holdFor, wordCount } from '../../_lib/timeline.js'
import { wordsAt, LEAD } from '../../_lib/scenes/kinetic.js'

export const BPM = 128
export const FPS = 24
export const BEAT = 60 / BPM
export const BAR = 4 * BEAT
/** Seconds of quiet after a take before the cut. */
export const BREATH = 0.35
/** Frames the caption is gone before the cut. */
export const CLEAR = 2
const EXIT_F = 4

/**
 * The scenes, in order. `caption` lines list spoken words by index into the take; [display, index]
 * shows a different form of a spoken word at that word's onset. `hold` overrides the reading hold for a
 * long caption that is revealed word by word on the voice, so the viewer has read along (round 30). `hero` is the index (in caption order)
 * of the one orange word that flips in. `mark` is the section title above the caption (round 27c).
 */
export const SCENE_DEFS = [
	{ id: 'netwerkschijf', take: '01', mark: 'Netwerkschijven', caption: [[7, 8, 9], [10, 11, 12], [13, 14, 16, 17], [18, 19, 20]], hold: 2.5 },
	{ id: 'vraag', take: '02', mark: 'Archiefwaardig', caption: [[0, 1, 2, 3], [4, 5]], hero: 4 },
	{ id: 'opslaan', take: '03', mark: 'Opslaan in Word', caption: [[['Metagegevens', 16], 17], [18, 19]] },
	{ id: 'weigeren', take: '04', mark: 'Bewaartermijn', caption: [[9, 10, 11], [12]] },
	{ id: 'blokkade', take: '05', mark: 'Juridische blokkade', caption: [[4, 5, 6], [7, 8]] },
	{ id: 'terugdraaien', take: '06', mark: 'Herroepen', caption: [[4, 5, 6], [10, ['terugdraaien', 11]]] },
	{ id: 'verplaatsen', take: '07', mark: 'Verplaatsen', caption: [[8, 9, 10], [11, 13]] },
	{ id: 'versleuteld', take: '08', mark: 'Versleuteling', caption: [[0, 1], [3, 4, 5]] },
	{ id: 'overal', take: '09', mark: 'Overal', caption: [[['Overal', 2], 3, 4], [5, 6]] },
	{ id: 'architectuur', take: '10', mark: 'Onder de motorkap', caption: [[0, 1], [2]] },
	{ id: 'claim', take: '11', mark: 'Het enige DMS', caption: [[['Opslag', 8], ['dwingt', 9], 10], [11, ['af', 12]]], hero: 3 },
]

const takeUrl = (n) => new URL(`../voice/nl-${n}.words.json`, import.meta.url)
export const TAKES = Object.fromEntries(await Promise.all(SCENE_DEFS.map((s) => s.take).map(async (n) => {
	const res = await fetch(takeUrl(n))
	if (!res.ok) throw new Error(`archiefwaardig: voice take nl-${n}.words.json returned ${res.status}`)
	const j = await res.json()
	if (!Array.isArray(j.words) || !j.words.length || j.words.some((w) => typeof w.start !== 'number' || typeof w.end !== 'number')) throw new Error(`archiefwaardig: take nl-${n} has no usable word timings`)
	return [n, j]
})))

const beatsFor = (sec) => Math.ceil(sec / BEAT - 1e-6)

/** Resolves one scene's local timing: voice offset, word onsets, caption words, needed beats. */
function resolve(def) {
	const take = TAKES[def.take]
	const lead = def.lead ?? 1
	const vo = lead * BEAT - take.words[0].start // where the take starts, in scene seconds
	const words = wordsAt(take.words, vo) // scene-local
	const onset = (i) => {
		if (!words[i]) throw new Error(`archiefwaardig: scene ${def.id} asks for word ${i} of take nl-${def.take}, which has ${words.length}`)
		return snapFrame(words[i].start)
	}
	const flat = def.caption.flat()
	const capWords = flat.map((c) => {
		const [display, i] = Array.isArray(c) ? c : [null, c]
		const w = words[i]
		if (!w) throw new Error(`archiefwaardig: scene ${def.id} caption word index ${i} is not in take nl-${def.take}`)
		return { word: display ?? w.word, start: w.start, end: w.end, src: i }
	})
	let k = 0
	const lines = def.caption.map((l) => l.map(() => k++))
	const lastOnset = Math.max(...capWords.map((w) => snapFrame(w.start)))
	const n = wordCount(capWords.map((w) => w.word).join(' '))
	const needCaption = lastOnset - F(LEAD) + F(6) + (def.hold ?? holdFor(n)) + F(EXIT_F) + F(CLEAR)
	const needVoice = vo + take.words.at(-1).end + BREATH
	return { ...def, lead, vo, words, onset, capWords, lines, beats: beatsFor(Math.max(needCaption, needVoice)), need: { caption: +needCaption.toFixed(3), voice: +needVoice.toFixed(3) }, text: take.text }
}

const resolved = SCENE_DEFS.map(resolve)
// The body ends on a bar line: pad the last scene (the claim) up to the next bar.
const sum = resolved.reduce((a, s) => a + s.beats, 0)
resolved.at(-1).beats += (4 - (sum % 4)) % 4

let acc = 0
for (const s of resolved) {
	s.startBeat = acc
	s.start = snapFrame(acc * BEAT) // body-local seconds
	acc += s.beats
	s.end = snapFrame(acc * BEAT)
	s.dur = +(s.end - s.start).toFixed(6)
	s.out = snapFrame(s.dur - F(CLEAR)) // the caption is gone two frames before the cut
}
export const SCENES = resolved
export const BODY_BEATS = acc
export const BODY_BARS = acc / 4
export const BODY = snapFrame(acc * BEAT)
export const byId = (id) => SCENES.find((s) => s.id === id)
