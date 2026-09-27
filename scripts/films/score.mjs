#!/usr/bin/env node
/**
 * Scores a film: turns its cue list and music declaration into a mixed,
 * loudness-normalised WAV.
 *
 *   node score.mjs --cues cues.json --out mix.wav [--lufs -14] [--tp -1] [--spectrum mix.png]
 *
 * cues.json is what `film.mjs cues` exports from a film page:
 *   { duration, bpm, cues: [{ t, kind, ...params }], music: { ... } }
 *
 * Sound-effect kinds: tick, pluck, bell, whoosh, riser, impact, kick, clap, hat.
 * Electricity (the Conduction opening): crackle, arc, hum, charge, powerOn (see lib/synth.mjs).
 *   hum plays on a dry bus that the kicks, impacts and power-ons duck, with no reverb send.
 * music (all optional): { bars, chords: [[midi, ...] per bar], bass: [midi per bar],
 *   parts: { kick: [[fromBar, toBar]], hat: [...], clap: [...], bass: [...], pad: [...] }, loop }
 * loop: true folds the tails past the end onto the start (and skips the first bar's slow pad attack),
 *   for a film whose last frame flows into frame 1.
 * Bars count from 0; ranges are [from, to) in bars.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import ffmpegPath from 'ffmpeg-static'
import * as S from './lib/synth.mjs'

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1]

const run = (bin, a) => new Promise((ok, fail) => {
	const p = spawn(bin, a, { stdio: ['ignore', 'pipe', 'pipe'] })
	let out = ''
	p.stdout.on('data', (d) => { out += d })
	p.stderr.on('data', (d) => { out += d })
	p.on('close', (c) => (c === 0 ? ok(out) : fail(new Error(out.slice(-3000)))))
})

const data = JSON.parse(await readFile(resolve(args.cues), 'utf8'))
const { duration, bpm = 128, cues = [] } = data
const music = data.music || {} // a film without a bed may export music: null
const spb = 60 / bpm
const bar = (n) => n * 4 * spb
const inRange = (ranges, b) => (ranges || []).some(([f, t]) => b >= f && b < t)

const tail = 1.2
const drums = S.makeBus(duration + tail)
const musicBus = S.makeBus(duration + tail)
const sfx = S.makeBus(duration + tail)
const dry = S.makeBus(duration + tail) // ducked like the music, never sent to the reverb (a reverberant hum is mud)
const kickTimes = []

/* ---- Music bed ---- */
const bars = music.bars || Math.round(duration / bar(1))
const parts = music.parts || {}
for (let b = 0; b < bars; b++) {
	for (let beat = 0; beat < 4; beat++) {
		const t = bar(b) + beat * spb
		if (inRange(parts.kick, b)) { S.kick(drums, t, { gain: 0.85 }); kickTimes.push(t) }
		if (inRange(parts.hat, b)) S.hat(drums, t + spb / 2, { gain: 0.1, seed: b * 4 + beat + 1, pan: beat % 2 ? 0.3 : -0.2 })
		if (inRange(parts.clap, b) && (beat === 1 || beat === 3)) S.clap(drums, t, { gain: 0.28, seed: 20 + b * 4 + beat })
	}
	const chord = music.chords?.[b % music.chords.length]
	if (chord && inRange(parts.pad, b)) S.pad(musicBus, bar(b), { notes: chord, dur: bar(1), gain: 0.05, cutoff: 1500, attack: b === 0 && !music.loop ? 0.8 : 0.05, release: 0.4 })
	const root = music.bass?.[b % music.bass.length]
	if (root !== undefined && inRange(parts.bass, b)) {
		// Offbeat eighths: the pulse that gives a 128 BPM bed its lift.
		for (let e = 0; e < 8; e++) if (e % 2 === 1) S.bass(musicBus, bar(b) + e * spb / 2, { note: root, dur: spb / 2 * 0.8, gain: 0.22 })
	}
}

/* ---- Sound effects from cues ---- */
const kinds = {
	tick: (c) => S.tick(sfx, c.t, c),
	pluck: (c) => S.pluck(sfx, c.t, c),
	bell: (c) => S.bell(sfx, c.t, c),
	whoosh: (c) => S.whoosh(sfx, c.t, c),
	riser: (c) => S.riser(sfx, c.t, c),
	impact: (c) => { S.impact(sfx, c.t, c); kickTimes.push(c.t) },
	kick: (c) => { S.kick(drums, c.t, c); kickTimes.push(c.t) },
	clap: (c) => S.clap(sfx, c.t, c),
	hat: (c) => S.hat(sfx, c.t, c),
	crackle: (c) => S.crackle(sfx, c.t, c),
	arc: (c) => S.arc(sfx, c.t, c),
	charge: (c) => S.charge(sfx, c.t, c),
	hum: (c) => S.hum(dry, c.t, c),
	powerOn: (c) => { S.powerOn(sfx, c.t, c); kickTimes.push(c.t) },
}
const unknown = new Set()
for (const c of cues) {
	if (kinds[c.kind]) kinds[c.kind](c)
	else unknown.add(c.kind)
}
if (unknown.size) console.error('ignored cue kinds:', [...unknown].join(', '))

/* ---- Mix ---- */
S.duck(musicBus, kickTimes, { depth: 0.6, release: 0.18 })
S.duck(dry, kickTimes, { depth: 0.6, release: 0.18 })
const master = S.makeBus(duration + tail)
S.mixInto(master, drums, 1)
S.mixInto(master, musicBus, 1)
S.mixInto(master, sfx, 1)
S.mixInto(master, dry, 1)
const send = S.makeBus(duration + tail)
S.mixInto(send, musicBus, 0.5)
S.mixInto(send, sfx, 0.8)
S.mixInto(master, S.reverb(send, { room: 0.8, damp: 0.45 }), 0.35)
// music.loop (a film whose last frame flows into frame 1): fold everything that rings past the end (pad
// release, reverb, bell tail) back onto the start, so the bed carries across the loop point without a dip.
// Otherwise fade the last 80 ms so the loop point never clicks. Then trim to the film length.
const n = Math.round(duration * S.SR)
if (music.loop) {
	for (let i = n; i < master.n; i++) { master.L[i - n] += master.L[i]; master.R[i - n] += master.R[i] }
} else {
	const fade = Math.round(0.08 * S.SR)
	for (let i = 0; i < fade; i++) { const g = i / fade; master.L[n - 1 - i] *= g; master.R[n - 1 - i] *= g }
}
master.n = n
master.L = master.L.subarray(0, n)
master.R = master.R.subarray(0, n)
S.limit(master, { ceiling: 0.85 })

const raw = resolve(args.out).replace(/\.wav$/, '') + '.raw.wav'
await writeFile(raw, S.wav(master))

/* ---- Loudness: two-pass loudnorm to the social target ---- */
const lufs = args.lufs || '-14'
const tp = args.tp || '-1.5'
const probe = await run(ffmpegPath, ['-hide_banner', '-i', raw, '-af', `loudnorm=I=${lufs}:TP=${tp}:LRA=7:print_format=json`, '-f', 'null', '-'])
const m = JSON.parse(probe.slice(probe.lastIndexOf('{'), probe.lastIndexOf('}') + 1))
await run(ffmpegPath, ['-y', '-hide_banner', '-i', raw, '-af', `loudnorm=I=${lufs}:TP=${tp}:LRA=7:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`, '-c:a', 'pcm_s24le', '-t', String(duration), resolve(args.out)])
const check = await run(ffmpegPath, ['-hide_banner', '-i', resolve(args.out), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'])
const f = JSON.parse(check.slice(check.lastIndexOf('{'), check.lastIndexOf('}') + 1))
if (args.spectrum) await run(ffmpegPath, ['-y', '-hide_banner', '-i', resolve(args.out), '-lavfi', 'showspectrumpic=s=1600x600:legend=1:scale=log', resolve(args.spectrum)])
console.log(JSON.stringify({ out: resolve(args.out), cues: cues.length, integrated_lufs: +f.input_i, true_peak_db: +f.input_tp, lra: +f.input_lra }))
