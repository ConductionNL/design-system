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
