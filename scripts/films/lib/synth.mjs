/**
 * Conduction motion sound: an offline synthesiser for film cues.
 *
 * Everything renders into stereo Float32 buffers at 48 kHz, deterministically
 * (seeded noise), so the same cue list always produces the same file. No
 * samples, no licensed audio: every sound here is built from oscillators,
 * noise and filters.
 */

export const SR = 48000

export function makeBus(seconds) {
	const n = Math.ceil(seconds * SR)
	return { L: new Float32Array(n), R: new Float32Array(n), n }
}

/** Seeded white noise source. */
export function noise(seed = 1) {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
	}
}

/** RBJ biquad. Call .set(type, freq, q) any time (per sample is fine), then .run(x). */
export function biquad() {
	let b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0
	return {
		set(type, freq, q = 0.707, gainDb = 0) {
			const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR
			const cos = Math.cos(w), sin = Math.sin(w), alpha = sin / (2 * q)
			const A = Math.pow(10, gainDb / 40)
			let n0, n1, n2, d0, d1, d2
			if (type === 'lowpass') { n0 = (1 - cos) / 2; n1 = 1 - cos; n2 = n0; d0 = 1 + alpha; d1 = -2 * cos; d2 = 1 - alpha }
			else if (type === 'highpass') { n0 = (1 + cos) / 2; n1 = -(1 + cos); n2 = n0; d0 = 1 + alpha; d1 = -2 * cos; d2 = 1 - alpha }
			else if (type === 'bandpass') { n0 = alpha; n1 = 0; n2 = -alpha; d0 = 1 + alpha; d1 = -2 * cos; d2 = 1 - alpha }
			else if (type === 'peak') { n0 = 1 + alpha * A; n1 = -2 * cos; n2 = 1 - alpha * A; d0 = 1 + alpha / A; d1 = -2 * cos; d2 = 1 - alpha / A }
			else throw new Error('biquad type ' + type)
			b0 = n0 / d0; b1 = n1 / d0; b2 = n2 / d0; a1 = d1 / d0; a2 = d2 / d0
			return this
		},
		run(x) {
			const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
			x2 = x1; x1 = x; y2 = y1; y1 = y
			return y
		},
	}
}

/** Band-limited sawtooth via polyBLEP. Returns a stateful stepper for a frequency function. */
export function saw() {
	let ph = 0
	return (freq) => {
		const dt = freq / SR
		ph += dt
		if (ph >= 1) ph -= 1
		let v = 2 * ph - 1
		if (ph < dt) { const t = ph / dt; v -= t + t - t * t - 1 }
		else if (ph > 1 - dt) { const t = (ph - 1) / dt; v -= t * t + t + t + 1 }
		return v
	}
}

export const midi = (m) => 440 * Math.pow(2, (m - 69) / 12)

/** Adds a mono signal into a bus with constant-power pan (-1..1) and gain. */
function write(bus, i, v, pan, gain) {
	if (i < 0 || i >= bus.n) return
	const a = ((pan + 1) * Math.PI) / 4
	bus.L[i] += v * Math.cos(a) * gain
	bus.R[i] += v * Math.sin(a) * gain
}

/* ---------- Instruments. Each takes (bus, t0 seconds, opts). ---------- */

export function kick(bus, t0, { gain = 0.9, pitch = 150, end = 44, decay = 0.42, click = 0.25 } = {}) {
	const n = Math.floor(decay * 1.6 * SR), s0 = Math.floor(t0 * SR)
	let ph = 0
	const nz = noise(7)
	for (let i = 0; i < n; i++) {
		const t = i / SR
		const f = end + (pitch - end) * Math.exp(-t * 32)
		ph += (2 * Math.PI * f) / SR
		const amp = Math.exp(-t / decay * 2.2)
		const body = Math.tanh(Math.sin(ph) * 1.6) * amp
		const clk = i < 0.004 * SR ? nz() * click * (1 - i / (0.004 * SR)) : 0
		write(bus, s0 + i, body + clk, 0, gain)
	}
}

export function hat(bus, t0, { gain = 0.12, decay = 0.045, pan = 0.25, seed = 3 } = {}) {
	const n = Math.floor(decay * 6 * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), hp = biquad().set('highpass', 7500, 0.8), bp = biquad().set('peak', 10500, 1.2, 6)
	for (let i = 0; i < n; i++) write(bus, s0 + i, bp.run(hp.run(nz())) * Math.exp(-(i / SR) / decay), pan, gain)
}

export function clap(bus, t0, { gain = 0.35, pan = 0, seed = 11 } = {}) {
	const n = Math.floor(0.35 * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), bp = biquad().set('bandpass', 1500, 1.1)
	for (let i = 0; i < n; i++) {
		const t = i / SR
		const bursts = [0, 0.011, 0.022].reduce((a, o) => a + (t >= o ? Math.exp(-(t - o) / 0.006) : 0), 0)
		const tail = Math.exp(-t / 0.12) * 0.5
		write(bus, s0 + i, bp.run(nz()) * (bursts + tail), pan, gain)
	}
}

/** A short pitched blip for a hex landing or a UI snap. */
export function tick(bus, t0, { gain = 0.28, freq = 1760, decay = 0.07, pan = 0 } = {}) {
	const n = Math.floor(decay * 7 * SR), s0 = Math.floor(t0 * SR)
	let ph = 0, ph2 = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		ph += (2 * Math.PI * freq) / SR
		ph2 += (2 * Math.PI * freq * 2.01) / SR
		const v = (Math.sin(ph) + 0.25 * Math.sin(ph2) * Math.exp(-t / 0.01)) * Math.exp(-t / decay) * Math.min(1, i / 48)
		write(bus, s0 + i, v, pan, gain)
	}
}

/** Two-operator FM pluck, marimba-like; the musical voice of the UI. */
export function pluck(bus, t0, { gain = 0.3, freq = 880, decay = 0.35, index = 2.2, ratio = 4, pan = 0 } = {}) {
	const n = Math.floor(decay * 6 * SR), s0 = Math.floor(t0 * SR)
	let pc = 0, pm = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		pm += (2 * Math.PI * freq * ratio) / SR
		const I = index * Math.exp(-t / (decay * 0.18))
		pc += (2 * Math.PI * freq) / SR
		const v = Math.sin(pc + I * Math.sin(pm)) * Math.exp(-t / decay) * Math.min(1, i / 24)
		write(bus, s0 + i, v, pan, gain)
	}
}

/** FM bell: the sonic logo voice. Inharmonic ratio, long tail. */
export function bell(bus, t0, { gain = 0.3, freq = 660, decay = 1.8, pan = 0 } = {}) {
	const n = Math.floor(decay * 4 * SR), s0 = Math.floor(t0 * SR)
	let pc = 0, pm = 0, pc2 = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		pm += (2 * Math.PI * freq * 3.5) / SR
		pc += (2 * Math.PI * freq) / SR
		pc2 += (2 * Math.PI * freq * 2) / SR
		const I = 3 * Math.exp(-t / 0.25)
		const v = (Math.sin(pc + I * Math.sin(pm)) * 0.8 + Math.sin(pc2) * 0.2 * Math.exp(-t / 0.4)) * Math.exp(-t / decay) * Math.min(1, i / 64)
		write(bus, s0 + i, v, pan, gain)
	}
}

/** Filtered noise sweep with a pan move. dir 'up' rises into t0 + dur; 'down' falls from t0. */
export function whoosh(bus, t0, { gain = 0.3, dur = 0.45, from = 400, to = 5000, panFrom = -0.6, panTo = 0.6, q = 1.4, seed = 5 } = {}) {
	const n = Math.floor(dur * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), bp = biquad(), bp2 = biquad()
	for (let i = 0; i < n; i++) {
		const p = i / n
		const f = from * Math.pow(to / from, p)
		if (i % 32 === 0) { bp.set('bandpass', f, q); bp2.set('bandpass', f * 1.5, q) }
		const env = Math.sin(Math.PI * Math.pow(p, 0.7)) ** 2
		write(bus, s0 + i, (bp.run(nz()) + 0.5 * bp2.run(nz())) * env, panFrom + (panTo - panFrom) * p, gain)
	}
}

/** Rising build: noise and a detuned saw pair under an opening filter. Peaks exactly at t0 + dur. */
export function riser(bus, t0, { gain = 0.22, dur = 1.8, root = 50, seed = 9 } = {}) {
	const n = Math.floor(dur * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), lp = biquad(), s1 = saw(), s2 = saw()
	for (let i = 0; i < n; i++) {
		const p = i / n
		if (i % 32 === 0) lp.set('lowpass', 300 * Math.pow(40, p), 2.5)
		const f = midi(root + 12 * p)
		const v = lp.run(nz() * 0.6 + 0.3 * (s1(f) + s2(f * 1.006)))
		write(bus, s0 + i, v * Math.pow(p, 2.2), Math.sin(p * 9) * 0.3, gain)
	}
}

/** Low impact: sine drop plus a noise thud. For the big reveal. */
export function impact(bus, t0, { gain = 0.8, from = 90, to = 32, decay = 1.1, seed = 13 } = {}) {
	const n = Math.floor(decay * 2 * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), lp = biquad().set('lowpass', 900, 0.7)
	let ph = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		ph += (2 * Math.PI * (to + (from - to) * Math.exp(-t * 6))) / SR
		const v = Math.tanh(Math.sin(ph) * 1.3) * Math.exp(-t / (decay * 0.5)) + lp.run(nz()) * Math.exp(-t / 0.09) * 0.7
		write(bus, s0 + i, v, 0, gain)
	}
}

/** Warm pad: detuned saws per chord note, slow attack, lowpass. */
export function pad(bus, t0, { gain = 0.07, dur = 2, notes = [50, 57, 62, 66], cutoff = 1400, attack = 0.4, release = 0.8 } = {}) {
	const n = Math.floor((dur + release) * SR), s0 = Math.floor(t0 * SR)
	notes.forEach((m, k) => {
		const oscs = [saw(), saw(), saw()]
		const det = [1, 1.0045, 0.9962]
		const lp = biquad().set('lowpass', cutoff, 0.6)
		const pan = (k / Math.max(1, notes.length - 1)) * 1.2 - 0.6
		for (let i = 0; i < n; i++) {
			const t = i / SR
			const env = Math.min(1, t / attack) * (t > dur ? Math.exp(-(t - dur) / (release * 0.4)) : 1)
			const f = midi(m)
			const v = lp.run(oscs.reduce((a, o, j) => a + o(f * det[j]), 0) / 3)
			write(bus, s0 + i, v * env, pan, gain)
		}
	})
}

/** Plucked bass: saw + sub sine through an enveloped lowpass. */
export function bass(bus, t0, { gain = 0.28, note = 38, dur = 0.4, cutoff = 900 } = {}) {
	const n = Math.floor((dur + 0.1) * SR), s0 = Math.floor(t0 * SR)
	const o = saw(), lp = biquad()
	let ph = 0
	const f = midi(note)
	for (let i = 0; i < n; i++) {
		const t = i / SR
		if (i % 16 === 0) lp.set('lowpass', 120 + cutoff * Math.exp(-t / 0.09), 1.1)
		ph += (2 * Math.PI * f) / SR
		const env = Math.min(1, i / 96) * (t < dur ? 1 : Math.exp(-(t - dur) / 0.025))
		write(bus, s0 + i, (lp.run(o(f)) * 0.7 + Math.sin(ph) * 0.6) * env, 0, gain)
	}
}

/* ---------- Electricity: the Conduction opening's voices (crackle, arc, hum, charge, powerOn) ---------- */

const clamp1 = (x) => Math.max(-1, Math.min(1, x))

/** One spark impulse: a click and a short resonant ring at pitch f, panned. */
function spark(bus, t0, { amp, freq, ring, pan, nz, phase }) {
	const n = Math.floor((ring * 6 + 0.002) * SR), s0 = Math.floor(t0 * SR)
	for (let i = 0; i < n; i++) {
		const t = i / SR
		const v = 0.6 * Math.sin(2 * Math.PI * freq * t + phase) * Math.exp(-t / ring) + 0.4 * nz() * Math.exp(-t / 0.00035)
		write(bus, s0 + i, v * Math.min(1, i / 6), pan, amp)
	}
}

/**
 * Electric crackle: sparse, seeded impulses, each a click plus a short resonant
 * ring at a random pitch between freqLo and freqHi, with now and then a lower,
 * longer snap for body. Two ways to drive it:
 *   events: [[t, pan, amp], ...]  times relative to t0; every event fires a
 *     burst of 1 to `burst` impulses there, so the crackle follows the picture
 *     (the opening sends one event per cell its front charges, at that cell's pan);
 *   dur + density: a plain texture of `density` impulses a second at `pan`.
 */
export function crackle(bus, t0, { events = null, dur = 1, density = 60, gain = 0.2, pan = 0, spread = 0.22, freqLo = 1200, freqHi = 7500, burst = 3, snaps = 0.12, seed = 21 } = {}) {
	const nz = noise(seed)
	const u = () => (nz() + 1) / 2
	let list = events
	if (!list) {
		list = []
		for (let t = 0; t < dur;) {
			t += -Math.log(1 - u() * 0.999) / density
			if (t < dur) list.push([t, pan, 1])
		}
	}
	for (const [te, pe = pan, ae = 1] of list) {
		const count = events ? 1 + Math.floor(u() * burst) : 1
		let tt = te
		for (let k = 0; k < count; k++) {
			if (k) tt += 0.002 + u() * 0.014
			const snap = u() < snaps
			spark(bus, t0 + tt, {
				amp: gain * ae * (snap ? 0.8 : 0.3 + 0.7 * u() * u()),
				freq: snap ? 350 + u() * 550 : freqLo * Math.pow(freqHi / freqLo, u()),
				ring: snap ? 0.004 + u() * 0.004 : 0.0007 + u() * 0.0024,
				pan: clamp1(pe + (u() * 2 - 1) * spread),
				nz,
				phase: u() * Math.PI * 2,
			})
		}
	}
}

/**
 * Arc: a spark jumping a gap. A short FM chirp that falls from `from` to `to`,
 * over a noise burst whose band follows the chirp, softly clipped. dur sets
 * the length of the fall (the tail rings about twice that).
 */
export function arc(bus, t0, { gain = 0.25, from = 4800, to = 600, dur = 0.08, index = 5, ratio = 1.41, noiseMix = 0.6, pan = 0, seed = 31 } = {}) {
	const n = Math.floor((dur * 2.4 + 0.01) * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), bp = biquad()
	let pc = 0, pm = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		const f = to + (from - to) * Math.exp(-t / (dur * 0.35))
		if (i % 16 === 0) bp.set('bandpass', Math.min(f * 1.2, 16000), 2.2)
		pm += (2 * Math.PI * f * ratio) / SR
		pc += (2 * Math.PI * f) / SR
		const I = index * Math.exp(-t / (dur * 0.5))
		// the arc flickers: a coarse amplitude buzz at about 140 Hz
		const flick = 0.78 + 0.22 * Math.sign(Math.sin(2 * Math.PI * 140 * t))
		const env = Math.min(1, i / (0.0006 * SR)) * Math.exp(-t / (dur * 0.42)) * flick
		const v = Math.tanh((Math.sin(pc + I * Math.sin(pm)) * (1 - noiseMix * 0.5) + bp.run(nz()) * noiseMix * 2.5) * 1.4)
		write(bus, s0 + i, v * env, pan, gain)
	}
}

/**
 * Mains hum: a fundamental (50 Hz by default; 49 sits on G, whose third
 * harmonic is the D of the house key) and its harmonics, driven into a soft
 * clip, through a lowpass that opens and closes with the charge. Stereo from
 * two filters a few percent apart. points: [[t, level 0..1, cutoff Hz], ...]
 * relative to t0, interpolated (level linearly, cutoff exponentially).
 */
export function hum(bus, t0, { dur = 4, base = 50, gain = 0.12, points = [[0, 1, 800]], drive = 2, width = 0.06, seed = 41 } = {}) {
	const n = Math.floor(dur * SR), s0 = Math.floor(t0 * SR)
	const lpL = biquad(), lpR = biquad(), hpL = biquad().set('highpass', 38, 0.7), hpR = biquad().set('highpass', 38, 0.7)
	const nz = noise(seed)
	const norm = Math.tanh(drive * 1.6)
	let ph = 0, seg = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		while (seg < points.length - 2 && t > points[seg + 1][0]) seg++
		const a = points[seg], b = points[Math.min(seg + 1, points.length - 1)]
		const p = b[0] > a[0] ? Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))) : 1
		const level = a[1] + (b[1] - a[1]) * p
		if (i % 32 === 0) {
			const cut = a[2] * Math.pow(b[2] / a[2], p)
			lpL.set('lowpass', cut * (1 - width), 0.9)
			lpR.set('lowpass', cut * (1 + width), 0.9)
		}
		ph += (2 * Math.PI * base * (1 + 0.002 * Math.sin(2 * Math.PI * 0.37 * t))) / SR
		const raw = Math.sin(ph) + 0.6 * Math.sin(2 * ph + 0.3) + 0.35 * Math.sin(3 * ph + 1.1) + 0.18 * Math.sin(5 * ph + 0.4)
		const v = Math.tanh(drive * raw) / norm + nz() * 0.015
		const i2 = s0 + i
		if (i2 < 0 || i2 >= bus.n) continue
		bus.L[i2] += hpL.run(lpL.run(v)) * level * gain
		bus.R[i2] += hpR.run(lpR.run(v)) * level * gain
	}
}

/** Charge: a capacitor whine that rises from `from` to `to` and stops dead at t0 + dur, where the circuit closes. */
export function charge(bus, t0, { gain = 0.06, dur = 1, from = 300, to = 2000, pan = 0 } = {}) {
	const n = Math.floor(dur * SR), s0 = Math.floor(t0 * SR)
	let ph = 0, pm = 0
	for (let i = 0; i < n; i++) {
		const p = i / n
		const f = from * Math.pow(to / from, Math.pow(p, 1.4))
		pm += (2 * Math.PI * f * 2) / SR
		ph += (2 * Math.PI * f) / SR
		const v = Math.sin(ph + 0.35 * Math.sin(pm)) * Math.pow(p, 1.8) * Math.min(1, (n - i) / (0.004 * SR))
		write(bus, s0 + i, v, pan, gain)
	}
}

/**
 * Power-on: the switch closing. A clean bright transient, the contact's short
 * thud, a low thump that falls from `from` to `to` (D1 by default), and a
 * short metallic ping at `ping`. Layer the house bell over it for a tone.
 */
export function powerOn(bus, t0, { gain = 0.6, from = 120, to = 36.7, decay = 0.6, ping = 2349.3, bright = 0.35, seed = 51 } = {}) {
	const n = Math.floor(decay * 2.5 * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), hp = biquad().set('highpass', 2500, 0.7), lp = biquad().set('lowpass', 380, 0.7)
	let ph = 0, pp = 0, pp2 = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		ph += (2 * Math.PI * (to + (from - to) * Math.exp(-t * 16))) / SR
		const thump = Math.tanh(1.4 * Math.sin(ph)) * Math.exp(-t / (decay * 0.45)) * Math.min(1, i / (0.0015 * SR))
		const click = hp.run(nz()) * Math.exp(-t / 0.0025) * 1.2
		const body = lp.run(nz()) * Math.exp(-t / 0.03) * 0.5
		pp += (2 * Math.PI * ping) / SR
		pp2 += (2 * Math.PI * ping * 2.76) / SR
		const tink = (Math.sin(pp) * Math.exp(-t / 0.09) + 0.35 * Math.sin(pp2) * Math.exp(-t / 0.025)) * bright
		write(bus, s0 + i, thump + click + body + tink, 0, gain)
	}
}

/**
 * Click: a crisp switch click, the house's accent sound since round 5 (it
 * replaces the bell everywhere; the bell stays in this file only for older
 * cue lists). Three layers, seeded:
 *   a broadband transient, 3 ms of highpassed noise (hard gate at `ms`);
 *   a short resonant body, a damped ring at `freq` (2 to 3 kHz) with a
 *     quieter inharmonic partial, decaying in `decay` seconds;
 *   a very small low thump (110 to 70 Hz) at `thump` of the level.
 */
export function click(bus, t0, { gain = 0.4, freq = 2600, decay = 0.008, ms = 3, body = 0.55, thump = 0.12, pan = 0, seed = 61 } = {}) {
	const n = Math.floor(0.07 * SR), s0 = Math.floor(t0 * SR)
	const nz = noise(seed), hp = biquad().set('highpass', 1500, 0.7)
	const gate = (ms / 1000) * SR
	let pb = 0, pb2 = 0, pt = 0
	for (let i = 0; i < n; i++) {
		const t = i / SR
		const tr = i < gate ? hp.run(nz()) * Math.exp(-t / 0.0009) * Math.min(1, (gate - i) / 24) : 0
		pb += (2 * Math.PI * freq) / SR
		pb2 += (2 * Math.PI * freq * 1.53) / SR
		const bd = (Math.sin(pb) + 0.35 * Math.sin(pb2 + 0.9)) * Math.exp(-t / decay) * body * Math.min(1, i / 8)
		pt += (2 * Math.PI * (70 + 40 * Math.exp(-t * 80))) / SR
		const th = Math.sin(pt) * Math.exp(-t / 0.016) * thump * Math.min(1, i / 48)
		write(bus, s0 + i, tr + bd + th, pan, gain)
	}
}

/* ---------- Mix utilities ---------- */

export function mixInto(dst, src, gain = 1) {
	for (let i = 0; i < dst.n; i++) { dst.L[i] += src.L[i] * gain; dst.R[i] += src.R[i] * gain }
}

/** Sidechain pump: ducks a bus after each trigger time. */
export function duck(bus, times, { depth = 0.55, release = 0.22 } = {}) {
	const g = new Float32Array(bus.n).fill(1)
	for (const t of times) {
		const s0 = Math.floor(t * SR), n = Math.floor(release * 3 * SR)
		for (let i = 0; i < n && s0 + i < bus.n; i++) {
			const v = 1 - depth * Math.exp(-(i / SR) / release)
			g[s0 + i] = Math.min(g[s0 + i], v)
		}
	}
	for (let i = 0; i < bus.n; i++) { bus.L[i] *= g[i]; bus.R[i] *= g[i] }
}

/** Freeverb-style stereo reverb, returned as a new wet bus. */
export function reverb(bus, { room = 0.78, damp = 0.4, wet = 1 } = {}) {
	const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * SR) / 44100))
	const alls = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100))
	const out = makeBus(bus.n / SR)
	for (const [chan, spread] of [['L', 0], ['R', 23]]) {
		const src = bus[chan], dst = out[chan]
		const cb = combs.map((d) => ({ buf: new Float32Array(d + spread), i: 0, f: 0 }))
		const ab = alls.map((d) => ({ buf: new Float32Array(d + spread), i: 0 }))
		for (let n = 0; n < bus.n; n++) {
			const x = src[n] * 0.015
			let y = 0
			for (const c of cb) {
				const o = c.buf[c.i]
				c.f = o * (1 - damp) + c.f * damp
				c.buf[c.i] = x + c.f * room
				c.i = (c.i + 1) % c.buf.length
				y += o
			}
			for (const a of ab) {
				const o = a.buf[a.i]
				a.buf[a.i] = y + o * 0.5
				a.i = (a.i + 1) % a.buf.length
				y = o - y
			}
			dst[n] = y * wet
		}
	}
	return out
}

/** Soft-knee peak limiter with lookahead; keeps true peaks under ceiling before loudness normalisation. */
export function limit(bus, { ceiling = 0.89, release = 0.08, lookahead = 0.004 } = {}) {
	const la = Math.floor(lookahead * SR), rel = Math.exp(-1 / (release * SR))
	let g = 1
	const env = new Float32Array(bus.n)
	for (let i = 0; i < bus.n; i++) env[i] = Math.max(Math.abs(bus.L[i]), Math.abs(bus.R[i]))
	for (let i = 0; i < bus.n; i++) {
		let peak = 0
		for (let k = 0; k <= la && i + k < bus.n; k += 8) peak = Math.max(peak, env[i + k])
		const target = peak > ceiling ? ceiling / peak : 1
		g = target < g ? target : g * rel + target * (1 - rel)
		bus.L[i] *= g
		bus.R[i] *= g
	}
}

/** 24-bit PCM WAV. */
export function wav(bus) {
	const n = bus.n, bytes = 44 + n * 6
	const b = Buffer.alloc(bytes)
	b.write('RIFF', 0); b.writeUInt32LE(bytes - 8, 4); b.write('WAVE', 8); b.write('fmt ', 12)
	b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(SR, 24)
	b.writeUInt32LE(SR * 6, 28); b.writeUInt16LE(6, 32); b.writeUInt16LE(24, 34); b.write('data', 36); b.writeUInt32LE(n * 6, 40)
	let o = 44
	for (let i = 0; i < n; i++) {
		for (const v of [bus.L[i], bus.R[i]]) {
			const s = Math.max(-8388608, Math.min(8388607, Math.round(Math.max(-1, Math.min(1, v)) * 8388607)))
			b.writeIntLE(s, o, 3)
			o += 3
		}
	}
	return b
}
