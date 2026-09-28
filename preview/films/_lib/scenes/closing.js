/**
 * The shared closing modules of every film (Ruben, round 4, 2026-09-27; restyled in
 * round 5 and round 6, 2026-09-28).
 *
 * Films are modular: the shared Conduction opening, the film's own body, then these
 * two pieces, the same in every film. Each is a SCENE (a pure function of its own
 * local time, with its sound cues) and a FRAME (the scene at its key time), so an
 * approved storyboard still is exactly what the film passes through:
 *
 *   builtOnScene(ctx, p)   BRAND  2 bars. "Built on ConNext": the common data layer in the
 *   builtOnFrame(ctx, p)          middle, Nextcloud as the ground it stands on, the Nextcloud
 *                                 apps it links a record to round it, the film's app on top
 *   installScene(ctx, p)   BRAND  3 bars. The install board as slogans (round 5): "Install
 *   installFrame(ctx, p)          the app" (orange: the call) / "Use the app" / "Own your data"
 *                                 and "Always 100% open source and free to use"; round 6: no
 *                                 full stops, the Conduction wordmark as the header and the
 *                                 Conduction avatar where the Nextcloud cell was
 *
 *   film.scene('builtOn', t0, t0 + CLOSING.builtOn.dur, (ctx) => builtOnScene(ctx, { app }))
 *   film.scene('install', t1, t1 + CLOSING.install.dur, (ctx) => installScene(ctx, { app }))
 *
 * Round 5 (Ruben): no green and no Nextcloud-coloured tiles in the closing piece. It uses
 * the app design: white cells with cobalt glyphs and icons, and the data layer as the one
 * cobalt hex (white ring, white glyph); Nextcloud is a white cell with its cobalt mark. The
 * install board drops the SLA line and the long install call for the slogans.
 *
 * What the cluster shows is what ships (round4/facts.json, fact a): OpenRegister 2.1.0,
 * its latest stable release, links a record to Nextcloud Files, Mail, Calendar, Contacts,
 * Talk, Deck and Tasks (IntegrationRegistry providers, Application::
 * bootBuiltinIntegrationProviders), and to more Nextcloud apps (Activity, Polls, Photos,
 * Forms, among others): those four sit in the outer ring at half strength, there are more
 * and we do not count them. Nextcloud Notes is NOT shown (OpenRegister's "Notes" are
 * comments on the record, not the Notes app).
 *
 * Brand (bible): 16:9; type in the left column (x 120 to 840, inside the safe box y 96 to
 * 930), picture right; pointy-top hexes only, never rotated (a cell pops by scale, never
 * turns); no terracotta; orange is text or one shape, one per frame (on the cobalt ground
 * the app hex and the call may both be orange); the ConNext wordmark is the real symbol,
 * never live type; icons are real symbols (#nc-* and #icon-*, _lib/assets.js), never drawn.
 *
 * Depends only on the engine (stage, core, brand, assets), so every film can import it.
 */
import { el, textBlock, measure, nextId } from '../stage.js'
import { hexPath, SQRT3, ease, spring, inv, clamp, lerp } from '../core.js'
import { C } from '../brand.js'
import { APP_NAMES, MARK_BOX } from '../assets.js'

/* ---------- the grid (128 BPM, 24 fps), module-local ---------- */

const SPB = 60 / 128
const G = (bar, beat = 1, s16 = 0) => ((bar - 1) * 4 + (beat - 1)) * SPB + (s16 * SPB) / 4
const F = (n) => n / 24
const RISE = F(4)
const EXIT = F(4)

/**
 * The pieces' lengths and their beats, in local seconds. Round 6: the closing piece builds at
 * once (Ruben: "tighten the nearly empty half second"): the data layer drops three frames in,
 * the words rise on the second frame, the apps start popping on the second beat.
 */
export const CLOSING = {
	builtOn: {
		bars: 2, dur: G(3),
		nextcloud: G(1, 1), // Nextcloud lands first, at 1.4x, settling in 0.2 s: the ground
		layer: F(3), // the data layer drops onto it straight away
		typeIn: F(2), // "Built on" rises, the wordmark a sixteenth behind
		ring: [G(1, 2), G(1, 2, 1), G(1, 2, 2), G(1, 2, 3), G(1, 3), G(1, 3, 1)], // the six nearest apps, one a sixteenth
		tasks: G(1, 3, 2),
		more: [G(1, 3, 3), G(1, 4), G(1, 4, 1), G(1, 4, 2)], // the quieter outer cells
		top: G(2, 1), // the film's app (or the story's apps) lands on top, on the bar
		out: G(2, 4), // the type leaves; the cells step off toward the Nextcloud cell, which the install board takes over
		key: 3.0,
	},
	install: {
		bars: 3, dur: G(4),
		travel: [0, 0.42], // the Nextcloud cell travels from the closing piece to its corner...
		flip: [0.42, 0.66], // ...and turns over, by scale, into the Conduction avatar (the opening's device; never a rotation)
		mark: F(2),
		slogans: [F(4), G(1, 2), G(1, 3)],
		line: G(2, 1),
		key: 4.6,
	},
}

/* ---------- what the data layer links to (fact a, round4/facts.json) ---------- */

/**
 * The Nextcloud apps a record links to, in OpenRegister 2.1.0, as the cluster shows
 * them. `icon` is the symbol id; `more` marks the outer, quieter cells. `provider`
 * names the file at the tag that ships it, so the board can be checked.
 */
export const NC_LINKS = [
	{ id: 'files', name: 'Files', icon: 'nc-files', provider: 'BuiltinProviders/FilesProvider.php' },
	{ id: 'mail', name: 'Mail', icon: 'nc-mail', provider: 'Providers/EmailProvider.php (requires mail)' },
	{ id: 'calendar', name: 'Calendar', icon: 'nc-calendar', provider: 'Providers/CalendarProvider.php (requires calendar)' },
	{ id: 'deck', name: 'Deck', icon: 'nc-decks', provider: 'Providers/DeckProvider.php (requires deck)' },
	{ id: 'contacts', name: 'Contacts', icon: 'icon-contacts', provider: 'Providers/ContactsProvider.php (requires contacts)' },
	{ id: 'talk', name: 'Talk', icon: 'nc-talk', provider: 'Providers/TalkProvider.php (requires spreed)' },
	{ id: 'tasks', name: 'Tasks', icon: 'icon-tasks', provider: 'BuiltinProviders/TasksProvider.php (CalDAV to-dos)' },
	{ id: 'activity', name: 'Activity', icon: 'nc-activity', provider: 'Providers/ActivityProvider.php (requires activity)', more: true },
	{ id: 'polls', name: 'Polls', icon: 'icon-polls', provider: 'Providers/PollsProvider.php (requires polls)', more: true },
	{ id: 'photos', name: 'Photos', icon: 'icon-photos', provider: 'Providers/PhotosProvider.php', more: true },
	{ id: 'forms', name: 'Forms', icon: 'icon-forms', provider: 'Providers/FormsProvider.php', more: true },
]

/* ---------- layout ---------- */

const TX = 120

function axial(cx, cy, q, r, size, gap) {
	const s = size + gap / SQRT3
	return [cx + s * SQRT3 * (q + r / 2), cy + s * 1.5 * r]
}

/**
 * Where everything sits round the data layer, in axial cells: the data layer at the
 * centre; Nextcloud two rows below it, under the ring's two lower cells, so the ring
 * stands on it; the six nearest Nextcloud apps in the first ring; Tasks and the quieter
 * "more" cells in the outer ring; the film's app (and, for the ConNext film, the apps of
 * its story) along the top, above the data layer.
 */
export const BUILT_ON = {
	size: 78,
	gap: 10,
	centre: [1340, 452],
	layer: [0, 0],
	nextcloud: [-1, 2],
	ring: { files: [0, -1], mail: [1, -1], calendar: [1, 0], deck: [0, 1], contacts: [-1, 1], talk: [-1, 0], tasks: [2, -1], activity: [-1, -1], polls: [2, 0], photos: [1, 1], forms: [-2, 1] },
	top: [[1, -2], [0, -2], [2, -2]],
	groundRows: [2, 3, 4],
}
const cellAt = ([q, r]) => axial(BUILT_ON.centre[0], BUILT_ON.centre[1], q, r, BUILT_ON.size, BUILT_ON.gap)
/** Where the Nextcloud cell sits in the closing piece; the install board picks it up there. */
export const NEXTCLOUD_AT = { x: cellAt(BUILT_ON.nextcloud)[0], y: cellAt(BUILT_ON.nextcloud)[1], r: BUILT_ON.size }
/** And where the install board puts it, turned over into the Conduction avatar: top right, in a quiet honeycomb. */
export const INSTALL_NC = { x: 1560, y: 300, r: 70, gap: 9 }

/** A hex with an icon or glyph centred in it, scaled about its centre by s. */
function cell(g, cx, cy, r, fill, { icon = null, glyph = null, color = C.cobalt, box = null, opacity = 1, ring = 0, ringFill = C.white, s = 1 } = {}) {
	if (s <= 0.001 || opacity <= 0.001) return null
	const attrs = {}
	if (opacity < 1) attrs.opacity = opacity.toFixed(3)
	if (Math.abs(s - 1) > 1e-4) attrs.transform = `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`
	const cg = el('g', attrs, g)
	if (ring) el('path', { d: hexPath(cx, cy, r + ring, (r + ring) * 0.1), fill: ringFill }, cg)
	el('path', { d: hexPath(cx, cy, r, r * 0.1), fill }, cg)
	const id = icon || (glyph ? `g-${glyph}` : null)
	if (id) {
		const [w, h] = box || (icon ? [r * 0.8, r * 0.8] : [r * 0.92, r * 0.92])
		el('use', { href: `#${id}`, x: cx - w / 2, y: cy - h / 2, width: w, height: h, color }, cg)
	}
	return cg
}

/** Nextcloud as the app design draws it (round 5): a white cell with its cobalt mark. */
function nextcloudCell(g, cx, cy, r, s = 1) {
	const [bw, bh] = MARK_BOX['nextcloud-logo']
	const w = r * 1.12
	return cell(g, cx, cy, r, C.white, { icon: 'nextcloud-logo', color: C.cobalt, box: [w, (w * bh) / bw], s })
}

/** A cell popping in on a spring: 0 before t0, overshooting a little, 1 when settled. */
const pop = (t, t0) => (t < t0 ? 0 : spring(t - t0, { freq: 2.6, zeta: 0.55 }))
/** A cell stepping off: 1 until t0, scaled to nothing over three frames. */
const off = (t, t0) => 1 - ease.outCubic(inv(t0, t0 + F(3), t))

/** Text that rises out of its line clip (p 0 to 1) and leaves upward out of it (q 0 to 1). */
function risingText(g, text, opts, p, q = 0) {
	if (p <= 0.001 || q >= 0.999) return
	const blk = textBlock(g, text, { ...opts, clip: true })
	const d = opts.size * 1.35
	const dy = q > 0 ? -d * q * q : d * (1 - ease.brand(p))
	if (Math.abs(dy) > 1e-3) for (const it of blk.items) it.node.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`)
}

/** A wordmark (ConNext by default) in a clip box, rising (p) or leaving (q) like a line of type. */
function risingMark(g, x, y, h, p, q = 0, id = 'wordmark-connext-white', { color, inset = 4.24 } = {}) {
	if (p <= 0.001 || q >= 0.999) return
	const [bw, bh] = MARK_BOX[id]
	const w = (h * bw) / bh
	const x0 = x - (inset * h) / bh
	const clipId = nextId('wmclip')
	const cp = el('clipPath', { id: clipId }, g)
	el('rect', { x: x0 - 12, y: y - 12, width: w + 24, height: h + 24 }, cp)
	const clipG = el('g', { 'clip-path': `url(#${clipId})` }, g)
	const dy = q > 0 ? -(h + 24) * q * q : (h + 24) * (1 - ease.brand(p))
	el('use', { href: `#${id}`, x: x0, y: y + dy, width: w, height: h, ...(color ? { color } : {}) }, clipG)
}

/* ---------- BRAND: built on ConNext ---------- */

/**
 * The piece at local time t. Options:
 *   app      optional app id: the film's app, on top, orange (the frame's one orange), labelled
 *   apps     optional app ids beside it on the top row (white cells, cobalt glyphs); the ConNext
 *            film passes the apps of its story; at most two with an app, three without
 *   caption  the live words before the wordmark (default 'Built on')
 *   label    false hides the app's name label (default true when app is set)
 *   on       'connext' (default: the ConNext wordmark after the words, as the ConNext film has it) or
 *            'nextcloud' (Round 10, app and audience films: "Built on Nextcloud" in live type, white,
 *            with the Nextcloud mark where a scene's chapter mark sits; no ConNext anywhere)
 */
function drawBuiltOn(g, t, p, W = 1920) {
	const { app = null, apps = [], caption = 'Built on', label = true, on = 'connext' } = p
	const K = CLOSING.builtOn
	const L = BUILT_ON
	const leaving = t >= K.out
	// Stepping off, from the outside in: the more cells, the ring, the top row, the data layer,
	// then the ground; Nextcloud stays for the install board.
	const offAt = { more: K.out, ring: K.out + F(1), top: K.out + F(2), layer: K.out + F(3), ground: K.out + F(4) }

	// The ground: the rows of the honeycomb under Nextcloud, dark and quiet, stepping on outward from it.
	const [nx, ny] = cellAt(L.nextcloud)
	for (const r of L.groundRows) {
		for (let q = -8; q <= 8; q++) {
			const [x, y] = cellAt([q, r])
			if (x < 900 - L.size || x > W + L.size) continue
			if (q === L.nextcloud[0] && r === L.nextcloud[1]) continue
			const d = Math.hypot(x - nx, y - ny) / (L.size * SQRT3)
			const s = pop(t, K.nextcloud + 0.06 + d * F(1)) * off(t, offAt.ground)
			if (s <= 0.001) continue
			el('path', { d: hexPath(x, y, L.size * Math.min(1, s), L.size * 0.1), fill: C.cobalt600, 'fill-opacity': Math.max(0.28, 1 - d * 0.16).toFixed(3) }, g)
		}
	}
	// Nextcloud: the ground the data layer stands on. It lands at 1.4x and settles.
	const ns = t < K.nextcloud ? 0 : 1 + 0.4 * (1 - ease.brand(inv(K.nextcloud, K.nextcloud + 0.2, t)))
	nextcloudCell(g, nx, ny, L.size, ns)

	// The common data layer: the one cobalt hex (white ring, white glyph), dropping onto Nextcloud.
	const [lx, ly] = cellAt(L.layer)
	if (t >= K.layer) {
		const dy = -180 * (1 - ease.brand(inv(K.layer, K.layer + 0.28, t)))
		cell(g, lx, ly + dy, L.size - 5, C.cobalt, { glyph: 'openregister', color: C.white, ring: 5, s: off(t, offAt.layer) })
	}

	// The Nextcloud apps it links a record to: white cells, cobalt icons, popping in one a sixteenth.
	const order = ['files', 'mail', 'calendar', 'deck', 'contacts', 'talk']
	for (const link of NC_LINKS) {
		const pos = L.ring[link.id]
		if (!pos) continue
		const t0 = link.id === 'tasks' ? K.tasks : link.more ? K.more[['activity', 'polls', 'photos', 'forms'].indexOf(link.id)] : K.ring[order.indexOf(link.id)]
		const s = pop(t, t0) * off(t, link.more ? offAt.more : offAt.ring)
		const [x, y] = cellAt(pos)
		cell(g, x, y, L.size, C.white, { icon: link.icon, color: C.cobalt, opacity: link.more ? 0.5 : 1, s })
	}

	// The top row: the film's app in the middle (orange), other story apps either side (white).
	const top = []
	if (app) top.push({ id: app, fill: C.orange, color: C.white })
	for (const id of apps.slice(0, app ? 2 : 3)) top.push({ id, fill: C.white, color: C.cobalt })
	top.forEach((c, i) => {
		const [x, y] = cellAt(L.top[i])
		cell(g, x, y, L.size, c.fill, { glyph: c.id, color: c.color, s: pop(t, K.top + i * F(2)) * off(t, offAt.top) })
	})
	if (app && label && t >= K.top) {
		const [, ay] = cellAt(L.top[0])
		const leftmost = Math.min(...top.map((_, i) => cellAt(L.top[i])[0]))
		const size = 34
		risingText(g, APP_NAMES[app] || app, { x: leftmost - (SQRT3 / 2) * L.size - 22, y: ay + size * 0.36, anchor: 'end', size, weight: 600, fill: C.white, tracking: -0.02 }, inv(K.top, K.top + RISE, t), leaving ? inv(K.out, K.out + EXIT, t) : 0)
	}

	// The type column: the live words, then the wordmark a sixteenth behind; both leave on K.out.
	const q = leaving ? inv(K.out, K.out + EXIT, t) : 0
	risingText(g, caption, { x: TX, y: 468, size: 112, weight: 700, fill: C.white, tracking: -0.02 }, inv(K.typeIn, K.typeIn + RISE, t), q)
	const m0 = K.typeIn + SPB / 4
	if (on === 'nextcloud') {
		// Round 10: "Built on Nextcloud". The word Nextcloud stays white (running copy); the Nextcloud
		// mark rises where a scene's chapter mark sits, white on the cobalt ground.
		risingText(g, 'Nextcloud', { x: TX, y: 588, size: 112, weight: 700, fill: C.white, tracking: -0.02 }, inv(m0, m0 + RISE, t), q)
		risingMark(g, TX, 300, 72, inv(K.typeIn, K.typeIn + RISE, t), q, 'nextcloud-logo', { color: C.white, inset: 0 })
	} else risingMark(g, TX, 506, 128, inv(m0, m0 + RISE, t), q)
}

/** The sound of the piece, in local seconds: thuds as the ground and the layer land, ticks up the scale as the apps pop in. */
function builtOnCues(cue) {
	const K = CLOSING.builtOn
	cue(K.nextcloud, 'impact', { gain: 0.3, from: 96, to: 40, decay: 0.7 })
	cue(K.layer + 0.2, 'impact', { gain: 0.22, from: 120, to: 55, decay: 0.45 })
	const notes = [1174.66, 1318.51, 1479.98, 1567.98, 1760, 1975.53]
	K.ring.forEach((t, i) => cue(t, 'tick', { freq: notes[i], gain: 0.14, pan: [-0.1, 0.2, 0.4, 0.3, -0.3, -0.4][i] }))
	cue(K.tasks, 'tick', { freq: 2349.32, gain: 0.13, pan: 0.5 })
	K.more.forEach((t, i) => cue(t, 'tick', { freq: 2637.02, gain: 0.06, decay: 0.04, pan: [-0.3, 0.5, 0.4, -0.5][i] }))
	cue(K.top, 'pluck', { freq: 1174.66, gain: 0.24 })
	cue(K.out - 0.05, 'whoosh', { dur: 0.5, from: 2600, to: 500, panFrom: -0.2, panTo: 0.4, gain: 0.12 })
}

/** The scene: builds nothing up front, redraws from local time every frame. Returns update(t). */
export function builtOnScene(ctx, p = {}) {
	const layer = el('g', { 'data-layer': 'built-on' }, ctx.g)
	if (ctx.cue && p.sound !== false) builtOnCues((t, kind, o) => ctx.cue(ctx.start + t, kind, o))
	return (t) => {
		layer.replaceChildren()
		drawBuiltOn(layer, clamp(t - ctx.start, 0, CLOSING.builtOn.dur), p, ctx.W)
	}
}

/** The storyboard key frame: the scene at its key time (or p.at). */
export function builtOnFrame(ctx, p = {}) {
	drawBuiltOn(el('g', {}, ctx.g), p.at ?? CLOSING.builtOn.key, p, ctx.W)
	return { cells: Object.fromEntries(Object.entries(BUILT_ON.ring).map(([k, v]) => [k, cellAt(v)])), size: BUILT_ON.size }
}

/* ---------- BRAND: the install board, as slogans (round 5; round 6: Conduction, no full stops) ---------- */

/** The words (round 6: no full stop at the end of any line), and why each is true (story.json facts). */
export const INSTALL = {
	slogans: ['Install the app', 'Use the app', 'Own your data'],
	line: 'Always 100% open source and free to use',
	/** Kept for boards that read the call: the first slogan is the call now. */
	call: 'Install the app',
	sources: {
		'Install the app / Use the app': 'Ruben, round 5; every core app but Humaniq and Planninq has a release in the Nextcloud app store (story.json facts, apps.json fetched 2026-09-27)',
		'Own your data': 'story.json mechanics[0]: all your apps keep their records in one place, on your own server; bible truth 10 (your own server)',
		'Always 100% open source and free to use': 'story.json facts: licence EUPL-1.2 (verified), price of the apps €0, support optional (verified)',
	},
}

/**
 * Type sizes, measured: the Conduction wordmark as the header, the slogans at headline size,
 * the line at 72 px (round 6: "clearly larger", it reads in a phone feed; 1310 px wide, inside
 * the safe box).
 */
const INSTALL_TYPE = { markY: 206, markH: 96, slogan: 104, sloganLh: 112, first: 420, lineSize: 72, gap: 70 }

function drawInstall(g, t, p, W = 1920) {
	const { app = null } = p
	const K = CLOSING.install
	const TY = INSTALL_TYPE

	// The Nextcloud cell travels from the closing piece to its corner, the quiet honeycomb stepping on round it.
	const k = ease.brand(inv(K.travel[0], K.travel[1], t))
	const N = INSTALL_NC
	const cx = lerp(NEXTCLOUD_AT.x, N.x, k), cy = lerp(NEXTCLOUD_AT.y, N.y, k), r = lerp(NEXTCLOUD_AT.r, N.r, k)
	for (let q = -4; q <= 4; q++) {
		for (let rr = -4; rr <= 3; rr++) {
			const [x, y] = axial(N.x, N.y, q, rr, N.r, N.gap)
			const d = (Math.abs(q) + Math.abs(rr) + Math.abs(q + rr)) / 2
			if (y > 560 || x < 1200 || x > W + N.r || y < -N.r) continue
			if (q === 0 && rr === 0) continue
			if (app && q === 0 && rr === -1) continue
			const s = pop(t, 0.2 + d * F(1))
			if (s <= 0.001) continue
			el('path', { d: hexPath(x, y, N.r * Math.min(1, s), N.r * 0.1), fill: C.cobalt600, 'fill-opacity': Math.max(0.25, 1 - d * 0.2).toFixed(3) }, g)
		}
	}
	// Round 6: the Nextcloud cell turns over into the Conduction avatar (a scale flip about its
	// vertical axis, the opening's own device: a pointy-top hex is never rotated).
	const [f0, f1] = K.flip, fm = (f0 + f1) / 2
	if (t < fm) {
		const sx = 1 - ease.inCubic(inv(f0, fm, t))
		if (sx > 0.001) {
			const fg = el('g', sx < 1 ? { transform: `translate(${cx} ${cy}) scale(${sx.toFixed(4)} 1) translate(${-cx} ${-cy})` } : {}, g)
			nextcloudCell(fg, cx, cy, r)
		}
	} else {
		const sx = ease.outCubic(inv(fm, f1, t))
		if (sx > 0.001) {
			const [aw, ah] = MARK_BOX['avatar-conduction']
			const h = 2 * N.r, w = (h * aw) / ah
			const fg = el('g', sx < 1 ? { transform: `translate(${N.x} ${N.y}) scale(${sx.toFixed(4)} 1) translate(${-N.x} ${-N.y})` } : {}, g)
			el('use', { href: '#avatar-conduction', x: N.x - w / 2, y: N.y - h / 2, width: w, height: h, color: C.white }, fg)
		}
	}
	if (app) {
		const [ax, ay] = axial(N.x, N.y, 0, -1, N.r, N.gap)
		cell(g, ax, ay, N.r, C.orange, { glyph: app, color: C.white, s: pop(t, K.flip[1]) })
	}

	// The type column: the Conduction wordmark as the header (round 6), the three slogans (the first
	// orange: the call), the line.
	risingMark(g, TX, TY.markY, TY.markH, inv(K.mark, K.mark + RISE, t), 0, 'wordmark-conduction-white')
	INSTALL.slogans.forEach((s, i) => {
		const t0 = K.slogans[i]
		risingText(g, s, { x: TX, y: TY.first + i * TY.sloganLh, size: TY.slogan, weight: 700, fill: i === 0 ? C.orange : C.white, tracking: -0.02 }, inv(t0, t0 + RISE, t))
	})
	const lineY = TY.first + 2 * TY.sloganLh + TY.gap + TY.lineSize
	risingText(g, INSTALL.line, { x: TX, y: lineY, size: TY.lineSize, weight: 600, fill: C.white, tracking: -0.01 }, inv(K.line, K.line + RISE, t))
}

/** The sound: a soft whoosh as Nextcloud travels, a dry click as it turns over into the avatar, a crisp click on the call, soft ticks on the next two, a pluck on the line. */
function installCues(cue) {
	const K = CLOSING.install
	cue(K.travel[0], 'whoosh', { dur: 0.45, from: 600, to: 2400, panFrom: -0.2, panTo: 0.5, gain: 0.1 })
	cue((K.flip[0] + K.flip[1]) / 2, 'click', { gain: 0.2, freq: 3000, pan: 0.5, seed: 72, dry: true })
	cue(K.slogans[0], 'click', { gain: 0.34, freq: 2600, seed: 71 })
	cue(K.slogans[0], 'impact', { gain: 0.32, from: 90, to: 32, decay: 1.0 })
	cue(K.slogans[1], 'tick', { freq: 1318.51, gain: 0.12 })
	cue(K.slogans[2], 'tick', { freq: 1479.98, gain: 0.12 })
	cue(K.line, 'pluck', { freq: 880, gain: 0.2, decay: 0.8 })
}

export function installScene(ctx, p = {}) {
	const layer = el('g', { 'data-layer': 'install' }, ctx.g)
	if (ctx.cue && p.sound !== false) installCues((t, kind, o) => ctx.cue(ctx.start + t, kind, o))
	return (t) => {
		layer.replaceChildren()
		drawInstall(layer, clamp(t - ctx.start, 0, CLOSING.install.dur), p, ctx.W)
	}
}

export function installFrame(ctx, p = {}) {
	drawInstall(el('g', {}, ctx.g), p.at ?? CLOSING.install.key, p, ctx.W)
	return { type: INSTALL_TYPE }
}

/** Board-free check: every word the pieces put on screen, for a word count. */
export const CLOSING_WORDS = { builtOn: 'Built on', install: [...INSTALL.slogans, INSTALL.line].join(' ') }
