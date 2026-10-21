// Parses a CSS colour as the browser returns it from getComputedStyle into [r, g, b, a]: r, g and b on 0-255
// (sRGB, clipped to the gamut), a on 0-1. Returns null for anything it cannot read, never a guess.
//
// Chrome returns rgb()/rgba() for legacy colours, but keeps the CSS Color 4 form of a colour it cannot write as
// legacy sRGB: `color(srgb 0.97 0.98 0.98)` for a color-mix() in srgb, `oklch(...)`, `oklab(...)`, `lab(...)`,
// `lch(...)` and `color(<space> ...)` for the other predefined spaces. The extractor runs this same function in the
// page (compdiff.mjs injects its source), so it must stay self-contained: no references outside its own body.
export function parseColour (input) {
	const s = String(input == null ? '' : input).trim().toLowerCase()
	if (s === '') return null
	if (s === 'transparent') return [0, 0, 0, 0]
	const clamp01 = (v) => Math.min(1, Math.max(0, v))
	const out = (r, g, b, a) => [r, g, b].some((v) => !Number.isFinite(v)) || !Number.isFinite(a)
		? null
		: [clamp01(r) * 255, clamp01(g) * 255, clamp01(b) * 255, clamp01(a)].map((v, i) => (i < 3 ? Math.round(v * 1000) / 1000 : Math.round(v * 10000) / 10000))
	// sRGB transfer functions.
	const encode = (v) => { const a = Math.abs(v); const e = a <= 0.0031308 ? 12.92 * a : 1.055 * Math.pow(a, 1 / 2.4) - 0.055; return v < 0 ? -e : e }
	const decode = (v) => { const a = Math.abs(v); const d = a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4); return v < 0 ? -d : d }
	const mul = (m, v) => [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2])
	const XYZ65_TO_LSRGB = [[3.2409699419045226, -1.537383177570094, -0.4986107602930034], [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559], [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]]
	const D50_TO_D65 = [[0.955473421488075, -0.02309845494876471, 0.06325924320057072], [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323], [0.012314014864481998, -0.020507649298898964, 1.330365926242124]]
	const fromLinear = (lin, a) => out(encode(lin[0]), encode(lin[1]), encode(lin[2]), a)
	const fromXyz65 = (xyz, a) => fromLinear(mul(XYZ65_TO_LSRGB, xyz), a)

	if (s[0] === '#') {
		const h = s.slice(1)
		if (!/^[0-9a-f]+$/.test(h) || ![3, 4, 6, 8].includes(h.length)) return null
		const full = h.length <= 4 ? h.split('').map((c) => c + c).join('') : h
		const n = (i) => parseInt(full.slice(i, i + 2), 16)
		return out(n(0) / 255, n(2) / 255, n(4) / 255, full.length === 8 ? n(6) / 255 : 1)
	}

	const m = s.match(/^([a-z-]+)\((.*)\)$/)
	if (!m) return null
	const fn = m[1]
	// Split "a b c / alpha" and the legacy "a, b, c, alpha" alike.
	let body = m[2].trim()
	let alphaText = null
	if (body.includes('/')) {
		const parts = body.split('/')
		if (parts.length !== 2) return null
		body = parts[0].trim()
		alphaText = parts[1].trim()
	}
	const tokens = body.split(/[\s,]+/).filter(Boolean)
	// A number, a percentage (scaled so 100% is `pct`), or `none` (0).
	const num = (t, pct) => {
		if (t === undefined) return NaN
		if (t === 'none') return 0
		if (t.endsWith('%')) return (parseFloat(t) / 100) * pct
		if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/.test(t)) return NaN
		return parseFloat(t)
	}
	const hue = (t) => {
		if (t === 'none') return 0
		const v = parseFloat(t)
		if (t.endsWith('turn')) return v * 360
		if (t.endsWith('grad')) return v * 0.9
		if (t.endsWith('rad')) return (v * 180) / Math.PI
		return v
	}
	const alpha = (t) => (t === null || t === undefined ? 1 : num(t, 1))

	if (fn === 'rgb' || fn === 'rgba') {
		const a = alphaText !== null ? alpha(alphaText) : alpha(tokens[3])
		if (tokens.length < 3) return null
		return out(num(tokens[0], 255) / 255, num(tokens[1], 255) / 255, num(tokens[2], 255) / 255, a)
	}
	if (fn === 'hsl' || fn === 'hsla') {
		if (tokens.length < 3) return null
		const a = alphaText !== null ? alpha(alphaText) : alpha(tokens[3])
		const H = ((hue(tokens[0]) % 360) + 360) % 360, S = num(tokens[1], 100) / 100, L = num(tokens[2], 100) / 100
		const f = (n) => { const k = (n + H / 30) % 12; return L - S * Math.min(L, 1 - L) * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
		return out(f(0), f(8), f(4), a)
	}
	if (fn === 'hwb') {
		if (tokens.length < 3) return null
		const H = ((hue(tokens[0]) % 360) + 360) % 360
		const W = num(tokens[1], 100) / 100, B = num(tokens[2], 100) / 100
		if (W + B >= 1) { const g = W / (W + B); return out(g, g, g, alpha(alphaText)) }
		const f = (n) => { const k = (n + H / 30) % 12; return 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
		return out(...[f(0), f(8), f(4)].map((v) => v * (1 - W - B) + W), alpha(alphaText))
	}
	if (fn === 'oklab' || fn === 'oklch') {
		if (tokens.length < 3) return null
		const L = num(tokens[0], 1)
		let A, Bv
		if (fn === 'oklab') { A = num(tokens[1], 0.4); Bv = num(tokens[2], 0.4) } else {
			const C = num(tokens[1], 0.4), H = (hue(tokens[2]) * Math.PI) / 180
			A = C * Math.cos(H); Bv = C * Math.sin(H)
		}
		const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * Bv, 3)
		const mm = Math.pow(L - 0.1055613458 * A - 0.0638541728 * Bv, 3)
		const sv = Math.pow(L - 0.0894841775 * A - 1.2914855480 * Bv, 3)
		return fromLinear([
			4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * sv,
			-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * sv,
			-0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * sv,
		], alpha(alphaText))
	}
	if (fn === 'lab' || fn === 'lch') {
		if (tokens.length < 3) return null
		const L = num(tokens[0], 100)
		let A, Bv
		if (fn === 'lab') { A = num(tokens[1], 125); Bv = num(tokens[2], 125) } else {
			const C = num(tokens[1], 150), H = (hue(tokens[2]) * Math.PI) / 180
			A = C * Math.cos(H); Bv = C * Math.sin(H)
		}
		const k = 24389 / 27, e = 216 / 24389
		const fy = (L + 16) / 116, fx = A / 500 + fy, fz = fy - Bv / 200
		const xr = Math.pow(fx, 3) > e ? Math.pow(fx, 3) : (116 * fx - 16) / k
		const yr = L > k * e ? Math.pow(fy, 3) : L / k
		const zr = Math.pow(fz, 3) > e ? Math.pow(fz, 3) : (116 * fz - 16) / k
		const d50 = [xr * 0.3457 / 0.3585, yr, zr * (1 - 0.3457 - 0.3585) / 0.3585]
		return fromXyz65(mul(D50_TO_D65, d50), alpha(alphaText))
	}
	if (fn === 'color') {
		const space = tokens[0]
		const c = tokens.slice(1, 4).map((t) => num(t, 1))
		if (c.length < 3) return null
		const a = alpha(alphaText)
		if (space === 'srgb') return out(c[0], c[1], c[2], a)
		if (space === 'srgb-linear') return fromLinear(c, a)
		if (space === 'display-p3') {
			return fromXyz65(mul([[0.4865709486482162, 0.26566769316909306, 0.1982172852343625], [0.2289745640697488, 0.6917385218365064, 0.079286914093745], [0, 0.04511338185890264, 1.043944368900976]], c.map(decode)), a)
		}
		if (space === 'rec2020') {
			const lin = c.map((v) => { const x = Math.abs(v); const r = x < 0.081242858298635 ? x / 4.5 : Math.pow((x + 0.0992968268094) / 1.0992968268094, 1 / 0.45); return v < 0 ? -r : r })
			return fromXyz65(mul([[0.6369580483012914, 0.14461690358620832, 0.1688809751641721], [0.2627002120112671, 0.6779980715188708, 0.05930171646986196], [0, 0.028072693049087428, 1.060985057710791]], lin), a)
		}
		if (space === 'xyz' || space === 'xyz-d65') return fromXyz65(c, a)
		if (space === 'xyz-d50') return fromXyz65(mul(D50_TO_D65, c), a)
		return null
	}
	return null
}
