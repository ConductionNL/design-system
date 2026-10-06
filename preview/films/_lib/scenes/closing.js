/**
 * ROUND 21 (Ruben, 2026-09-28), the default for every film from now on:
 *   builtOnScene / builtOnFrame  "Built on Nextcloud" as the ConNext film's component connection
 *                                section (the A19 s1 scene): the film's app is the LEAD cell (orange),
 *                                the Nextcloud apps load one by one into the grid below it, each on its
 *                                own orthogonal connector, while one line under the headline swaps
 *                                "verb + name" (the name in Nextcloud cyan). 3 bars (was 2).
 *                                Options: app (the lead), apps (up to two white cells beside the lead),
 *                                lead ('openregister' for the OpenRegister films; litLayer: true means
 *                                the same), lang ('en' | 'nl': "Gebouwd op Nextcloud" and Dutch lines),
 *                                caption / markText (override the two headline lines), label, sound.
 *   installScene / installFrame  "Install it" / "Use it" / "Own it", the orange moving line by line and
 *                                landing on "Own it", then "The code stays open source, your data stays
 *                                yours" on two lines; NL "Installeer het" / "Gebruik het" / "Bezit het",
 *                                "De code blijft open source, je data blijft van jou". 3 bars. Options:
 *                                lang, slogans, line (overrides), app.
 *   Pass legacy: true to either for the round-6 pieces (the finished ConNext film and the rendered
 *   Dossiq film use it, so their masters stay reproducible). CLOSING.connect / CLOSING.install21 hold
 *   the new lengths; CLOSING.builtOn / CLOSING.install the legacy ones. BUILT_ON_DUR and INSTALL_DUR
 *   give the lengths a film must reserve for the default pieces.
 *
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
 *                                 and "Always 100% open source" (round 15: no "free"); round 6: no
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
import { hexPath, SQRT3, ease, spring, inv, clamp, lerp, mix, axialRing } from '../core.js'
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
 *   litLayer false (default) keeps the data layer cobalt. true (Round 14, the OpenRegister films) lights
 *            the data layer itself: its cell turns orange (the frame's one orange, so pass no `app`),
 *            labelled "OpenRegister" beside it; the top row then carries the apps built on it, in white
 */
function drawBuiltOn(g, t, p, W = 1920) {
	const { app = null, apps = [], caption = 'Built on', label = true, on = 'connext', litLayer = false } = p
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
		cell(g, lx, ly + dy, L.size - 5, litLayer ? C.orange : C.cobalt, { glyph: 'openregister', color: C.white, ring: 5, s: off(t, offAt.layer) })
	}
	// Round 14: the lit data layer carries its name, left of the ring, level with it.
	if (litLayer && label && t >= K.layer) {
		const [tx] = cellAt(L.ring.talk)
		const size = 34
		risingText(g, APP_NAMES.openregister, { x: tx - (SQRT3 / 2) * L.size - 22, y: ly + size * 0.36, anchor: 'end', size, weight: 600, fill: C.white, tracking: -0.02 }, inv(K.layer, K.layer + RISE, t), leaving ? inv(K.out, K.out + EXIT, t) : 0)
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
function legacyBuiltOnScene(ctx, p = {}) {
	const layer = el('g', { 'data-layer': 'built-on' }, ctx.g)
	if (ctx.cue && p.sound !== false) builtOnCues((t, kind, o) => ctx.cue(ctx.start + t, kind, o))
	return (t) => {
		layer.replaceChildren()
		drawBuiltOn(layer, clamp(t - ctx.start, 0, CLOSING.builtOn.dur), p, ctx.W)
	}
}

/** The storyboard key frame: the scene at its key time (or p.at). */
function legacyBuiltOnFrame(ctx, p = {}) {
	drawBuiltOn(el('g', {}, ctx.g), p.at ?? CLOSING.builtOn.key, p, ctx.W)
	return { cells: Object.fromEntries(Object.entries(BUILT_ON.ring).map(([k, v]) => [k, cellAt(v)])), size: BUILT_ON.size }
}

/* ---------- BRAND: the install board, as slogans (round 5; round 6: Conduction, no full stops) ---------- */

/** The words (round 6: no full stop at the end of any line), and why each is true (story.json facts). */
export const INSTALL = {
	slogans: ['Install the app', 'Use the app', 'Own your data'],
	// Round 15 (Ruben): no "free" anywhere; the line is the licence only.
	line: 'Always 100% open source',
	/** Kept for boards that read the call: the first slogan is the call now. */
	call: 'Install the app',
	sources: {
		'Install the app / Use the app': 'Ruben, round 5; every core app but Humaniq and Planninq has a release in the Nextcloud app store (story.json facts, apps.json fetched 2026-09-27)',
		'Own your data': 'story.json mechanics[0]: all your apps keep their records in one place, on your own server; bible truth 10 (your own server)',
		'Always 100% open source': 'story.json facts: licence EUPL-1.2 (verified)',
	},
}

/**
 * Type sizes, measured: the Conduction wordmark as the header, the slogans at headline size,
 * the line at 72 px (round 6: "clearly larger", it reads in a phone feed; round 15 shortened it to
 * "Always 100% open source", well inside
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

function legacyInstallScene(ctx, p = {}) {
	const layer = el('g', { 'data-layer': 'install' }, ctx.g)
	if (ctx.cue && p.sound !== false) installCues((t, kind, o) => ctx.cue(ctx.start + t, kind, o))
	return (t) => {
		layer.replaceChildren()
		drawInstall(layer, clamp(t - ctx.start, 0, CLOSING.install.dur), p, ctx.W)
	}
}

function legacyInstallFrame(ctx, p = {}) {
	drawInstall(el('g', {}, ctx.g), p.at ?? CLOSING.install.key, p, ctx.W)
	return { type: INSTALL_TYPE }
}

/** Board-free check: every word the pieces put on screen, for a word count. */
export const CLOSING_WORDS = { builtOn: 'Built on', install: [...INSTALL.slogans, INSTALL.line].join(' ') }


/* ================================================================== ROUND 21 / 22 ============ */

/**
 * ROUND 22 (Ruben, 2026-09-28) on top of Round 21:
 *   Built on  after the seven Nextcloud apps connect, the camera zooms out and the rest of the
 *             Conduction family comes into view round them, each connected by a line to the lead
 *             (the lead stays orange); the swapping line ends on "Enhanced by Conduction"
 *             (NL "Verrijkt door Conduction"); no white neighbour cells beside the lead any more.
 *             Every hex in the piece (the field, the Nextcloud apps, the lead, the family) is drawn by
 *             one function at one radius, so app cells and dark field cells are exactly the same size.
 *             4 bars (was 3): the last component line holds 1.88 s, the zoom takes two beats.
 *   Install   three concepts were made (p.concept 'lock' | 'current' | 'split'); 'current' is the
 *             default. No Conduction wordmark header. Line: "The code stays open source, the data
 *             stays yours" (NL "De code blijft open source, de data blijft van jou").
 */

/** The lengths and beats (local seconds). Round 27: see the ROUND 27 note above CONNECT. */
CLOSING.connect = {
	bars: 4, dur: G(5),
	lead: F(2), // the lead cell flips in on the second frame
	typeIn: F(2), // "Built on" rises, "Nextcloud" a sixteenth behind
	// The nine Nextcloud cells flip in one a beat round the C, top arm first, each as its line arrives.
	// Round 28j: the C builds quicker, two cells a beat (on the eighths), each line drawn on in 0.16 s.
	loads: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => G(1, 2) + i * (SPB / 2)),
	linkDur: 0.16,
	// Round 28j: ONE line, "Works with <app>" (NL "Werkt met <app>"). "Works with" stays up the whole time;
	// the app name (Nextcloud cyan) rolls up to the next, a slot-roll (#7) of two frames, on each cell that
	// lands on a beat: Mail, Contacts, Files, Deck, Polls (the eighth cells between roll past). Each name is
	// still for 0.39 s (a beat less the roll); the last, Polls, holds 2.81 s, to "Enhanced by Conduction".
	names: [0, 2, 4, 6, 8],
	roll: F(2),
	enhanced: G(3, 4),
	zoom: [G(4, 1), G(4, 3)], // two beats: the camera pulls back and the family ring flips in round the C
	// Round 27b: the re-zoom. The camera comes back in on the last beat while every cell turns over and
	// becomes the install board's field; the lead turns over into the Conduction avatar.
	rezoom: [G(4, 4), G(5)],
	out: G(5) - EXIT - F(4), // the type leaves over four frames, four frames before the bar line
	key: G(4, 3) + F(4),
}
CLOSING.install21 = {
	bars: 3, dur: G(4),
	// Round 27b: no wire. The field and the avatar are already there (Built on turned them over); the
	// words rise one a beat from the fifth frame (eight clear frames after Built on's type), the orange
	// moving to each and landing on "Own it", then the line.
	words: [F(4), G(1, 2), G(1, 3)],
	line: G(1, 4) + F(2),
	key: 4.6,
}
export const BUILT_ON_DUR = CLOSING.connect.dur
export const INSTALL_DUR = CLOSING.install21.dur

/** The words, English and Dutch. The component lines are what the data layer links a record to (NC_LINKS). */
export const CLOSING_TEXT = {
	en: {
		builtOn: ['Built on', 'Nextcloud'],
		enhanced: 'Enhanced by Conduction',
		worksWith: 'Works with',
		names: { mail: 'Mail', calendar: 'Calendar', contacts: 'Contacts', tasks: 'Tasks', files: 'Files', talk: 'Talk', deck: 'Deck', activity: 'Activity', polls: 'Polls' },
		loads: { mail: ['Reply from', 'Mail'], calendar: ['Plan in', 'Calendar'], contacts: ['Save to', 'Contacts'], files: ['Share in', 'Files'], talk: ['Chat in', 'Talk'], tasks: ['Follow up in', 'Tasks'], deck: ['Manage from', 'Deck'] },
		slogans: ['Install it', 'Use it', 'Own it'],
		line: 'The code stays open source,\nthe data stays yours',
	},
	nl: {
		builtOn: ['Gebouwd op', 'Nextcloud'],
		enhanced: 'Verrijkt door Conduction',
		worksWith: 'Werkt met',
		names: { mail: 'Mail', calendar: 'Agenda', contacts: 'Contacten', tasks: 'Taken', files: 'Bestanden', talk: 'Talk', deck: 'Deck', activity: 'Activiteit', polls: 'Peilingen' },
		loads: { mail: ['Antwoord vanuit', 'Mail'], calendar: ['Plan in', 'Agenda'], contacts: ['Bewaar in', 'Contacten'], files: ['Deel in', 'Bestanden'], talk: ['Chat in', 'Talk'], tasks: ['Volg op in', 'Taken'], deck: ['Beheer vanuit', 'Deck'] },
		slogans: ['Installeer het', 'Gebruik het', 'Bezit het'],
		line: 'De code blijft open source,\nde data blijft van jou',
	},
}
/** The Conduction family, as the opening's cluster holds it (Buildiq is out of the films). */
const FAMILY = ['openregister', 'pipelinq', 'opencatalogi', 'filinq', 'integriq', 'launchpad', 'portaliq', 'dossiq', 'shillinq', 'thematiq', 'learniq', 'decidiq', 'hermiq', 'zaakafhandelapp', 'stackiq', 'keepiq', 'humaniq', 'planninq', 'versioniq', 'larpinq']

/**
 * ROUND 27 (Ruben, from the Keepiq render):
 *   - the Nextcloud cells form a C on the grid (the Conduction C: the ring two out from the lead, open to
 *     the right), with the orange lead at its heart; the connector lines run FROM the lead TO each cell;
 *   - after the zoom-out the white family cells form a hexagonal ring round it (Round 27d: the ring FOUR
 *     out, so exactly one ring of dark field cells lies between the C and the family; 24 cells: the apps
 *     spread evenly round it, blank white cells between them (27e), and no lines inward);
 *   - Round 27d: every app cell appears by its own field cell turning over into it (the dark face
 *     squashes shut, the app face opens), so no hole opens where a cell appears: the C, the ring, the lead;
 *   - no app-name label beside the lead;
 *   - every hex FLIPS in (turns over by squashing, like the opening), never pops or scales in; lines are
 *     drawn on; every hex is one grid cell at the one grid radius (HEX_R, also the install avatar);
 *   - Round 27b: the hand-off into the install board is the cells turning over while the camera zooms
 *     back in: they become the install board's field, and the lead becomes the Conduction avatar.
 * World space: the lead's cell is the origin of the grid.
 */
const LOAD_ORDER = ['mail', 'calendar', 'contacts', 'tasks', 'files', 'talk', 'deck', 'activity', 'polls']
const C_CELLS = [[2, -2], [1, -2], [0, -2], [-1, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2], [0, 2]] // top tip round to the bottom tip
export const CONNECT = {
	size: 92, gap: 14,
	cells: Object.fromEntries(LOAD_ORDER.map((id, i) => [id, C_CELLS[i]])),
	line: { width: 7 },
	cam: { start: { at: [1482, 538], z: 1 }, out: { at: [1362, 513], z: 0.55 } }, // Round 27d: ring four fits the safe box right of the type
	type: { markY: 250, markH: 60, first: 420, size: 112, lh: 118, lineY: 668, lineSize: 72 },
}
const HEX_R = CONNECT.size
const HEX_ROUND = CONNECT.size * 0.1
const cxy = ([q, r]) => axial(0, 0, q, r, CONNECT.size, CONNECT.gap)
const iconOf = (id) => NC_LINKS.find((l) => l.id === id).icon
const hexDist = (a, b) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[0] + a[1] - b[0] - b[1])) / 2
/** The install board's avatar: one grid cell, at the grid radius (Round 27b), top right. */
const AVATAR = { x: 1560, y: 330 }
/** The install board's quiet field: grid cells top right, shaded by their distance from the avatar. */
function installShade(q, r, W = 1920) {
	const [wx, wy] = cxy([q, r])
	const x = AVATAR.x + wx, y = AVATAR.y + wy
	const d = hexDist([q, r], [0, 0])
	if (d === 0 || d > 4 || x < 1180 || y > 700 || x > W + HEX_R || y < -HEX_R) return null
	return Math.max(0.25, 1 - d * 0.2)
}

/** The camera at local time t: out to the family, then back in onto the install board's avatar. */
function camAt(t) {
	const K = CLOSING.connect, S = CONNECT.cam.start, O = CONNECT.cam.out
	const kOut = ease.brand(inv(K.zoom[0], K.zoom[1], t))
	const kIn = ease.inOutCubic(inv(K.rezoom[0], K.rezoom[1], t))
	let z = lerp(S.z, O.z, kOut), at = [lerp(S.at[0], O.at[0], kOut), lerp(S.at[1], O.at[1], kOut)]
	z = lerp(z, 1, kIn)
	at = [lerp(at[0], AVATAR.x, kIn), lerp(at[1], AVATAR.y, kIn)]
	return { z, apply: (x, y) => [at[0] + z * x, at[1] + z * y], transform: `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${z.toFixed(4)})` }
}

/** A flip in: the cell turns over by squashing (x scale 0 to 1), never a pop, never a rotation. */
const flipIn = (t, t0, dur = F(4)) => (t < t0 ? 0 : ease.outCubic(inv(t0, t0 + dur, t)))
/**
 * Round 27d: an app cell appears by its field cell turning over into it at tApp. Returns the x scales of
 * the dark field face and of the app face (one of them 0 at any frame).
 */
function turnInto(t, tField, tApp) {
	const fm = tApp + F(2)
	if (t < tApp) return { field: flipIn(t, tField), app: 0 }
	if (t < fm) return { field: flipIn(t, tField) * (1 - ease.inCubic(inv(tApp, fm, t))), app: 0 }
	return { field: 0, app: ease.outCubic(inv(fm, fm + F(2), t)) }
}
const fieldAt = (d) => F(1) + Math.min(d, 9) * F(1)
// Round 27d: ring 3, the one field ring between the C and the family, is shaded like ring 2 so it reads
// when zoomed out (same colour, a touch more contrast).
const fieldShade = (d) => (d === 3 ? 0.75 : Math.max(0.18, 0.9 - d * 0.12))
/**
 * The re-zoom's turn-over for a cell d steps from the lead: the front squashes shut, then the back
 * opens. Returns { front, back } x scales (one of them 0).
 */
function turnOver(t, d) {
	const K = CLOSING.connect
	const f0 = K.rezoom[0] + d * F(1) * 0.5, f1 = f0 + F(6), fm = (f0 + f1) / 2
	if (t < f0) return { front: 1, back: 0 }
	if (t < fm) return { front: 1 - ease.inCubic(inv(f0, fm, t)), back: 0 }
	return { front: 0, back: ease.outCubic(inv(fm, f1, t)) }
}

/** One grid cell at world (x, y), squashed to sx (0 to 1). */
function unit(g, x, y, fill, { icon = null, glyph = null, color = C.cobalt, box = null, sx = 1, opacity = 1 } = {}) {
	if (sx <= 0.001 || opacity <= 0.001) return
	const attrs = {}
	// Round 28c: a shaded cell is a solid mix with the cobalt ground, never a see-through layer.
	if (opacity < 1) fill = mix(C.cobalt, fill, opacity)
	if (Math.abs(sx - 1) > 1e-4) attrs.transform = `translate(${x} ${y}) scale(${sx.toFixed(4)} 1) translate(${-x} ${-y})`
	const cg = el('g', attrs, g)
	el('path', { d: hexPath(x, y, HEX_R, HEX_ROUND), fill, 'data-hex': 'unit' }, cg)
	const id = icon || (glyph ? `g-${glyph}` : null)
	if (id) {
		const [w, h] = box || (icon ? [HEX_R * 0.8, HEX_R * 0.8] : [HEX_R * 0.92, HEX_R * 0.92])
		el('use', { href: `#${id}`, x: x - w / 2, y: y - h / 2, width: w, height: h, color }, cg)
	}
}
/** The install board's field cell and avatar, drawn at world (x, y) (so the re-zoom can turn them over). */
function fieldCell(g, x, y, shade, sx = 1) {
	unit(g, x, y, C.cobalt600, { sx, opacity: shade })
}
function avatarAt(g, x, y, sx = 1) {
	if (sx <= 0.001) return
	const [aw, ah] = MARK_BOX['avatar-conduction']
	const h = 2 * HEX_R, w = (h * aw) / ah
	const fg = el('g', Math.abs(sx - 1) > 1e-4 ? { transform: `translate(${x} ${y}) scale(${sx.toFixed(4)} 1) translate(${-x} ${-y})` } : {}, g)
	el('use', { href: '#avatar-conduction', x: x - w / 2, y: y - h / 2, width: w, height: h, color: C.white }, fg)
}

/**
 * The family ring (Round 27d/27e): the ring four out, one full hexagon of white cells, clockwise from the
 * top left. The apps are spread evenly round it; the cells between them are blank white. No lines inward.
 */
function familyCells(lead) {
	const fam = FAMILY.filter((id) => id !== lead)
	const all = axialRing(4)
	const at = new Map(fam.map((id, i) => [Math.floor((i * all.length) / fam.length), id]))
	return all.map((c, i) => ({ id: at.get(i) || null, q: c[0], r: c[1] }))
}

function drawConnect(g, t, p, W = 1920) {
	const K = CLOSING.connect
	const T = CLOSING_TEXT[p.lang === 'nl' ? 'nl' : 'en']
	const lead = p.lead || (p.litLayer ? 'openregister' : p.app) || 'openregister'
	const qType = t >= K.out ? inv(K.out, K.out + EXIT, t) : 0
	const cam = camAt(t)
	const world = el('g', { transform: cam.transform }, g)
	const fam = familyCells(lead)
	const taken = new Set([[0, 0], ...C_CELLS, ...fam.map((f) => [f.q, f.r])].map((c) => c.join(',')))
	const unlink = 1 - inv(K.rezoom[0], K.rezoom[0] + F(4), t) // the lines draw off as the cells turn over
	const visible = (x, y) => { const [sx, sy] = cam.apply(x, y), rr = HEX_R * cam.z; return !(sx < -rr || sx > W + rr || sy < -rr || sy > 1080 + rr) }
	/** A cell's back face after the re-zoom: the install field, the avatar, or nothing. */
	const back = (q, r, x, y, sx) => {
		if (sx <= 0) return
		if (q === 0 && r === 0) return avatarAt(world, x, y, sx)
		const sh = installShade(q, r, W)
		if (sh != null) fieldCell(world, x, y, sh, sx)
	}

	// The quiet field: unlit grid cells, the same hex as every app cell, shaded by distance from the lead.
	// App cells get the field face here too (it turns over into them below, Round 27d).
	const appAt = new Map([['0,0', K.lead], ...LOAD_ORDER.map((id, i) => [CONNECT.cells[id].join(','), K.loads[i]]), ...fam.map((f, i) => [`${f.q},${f.r}`, K.zoom[0] + 0.3 + i * (F(1) * 0.45)])])
	// Round 27e: the field covers the whole frame at every camera position (no holes anywhere in view).
	for (let r = -12; r <= 12; r++) {
		for (let q = -20; q <= 14; q++) {
			if (taken.has(`${q},${r}`)) {
				const [x, y] = cxy([q, r]), d = hexDist([q, r], [0, 0])
				if (!visible(x, y)) continue
				const sx = turnInto(t, fieldAt(d), appAt.get(`${q},${r}`)).field
				if (sx > 0.001) unit(world, x, y, C.cobalt600, { sx, opacity: fieldShade(d) })
				continue
			}
			const [x, y] = cxy([q, r])
			const d = hexDist([q, r], [0, 0])
			const inSoon = visible(x, y), fin = installShade(q, r, W) != null
			if (!inSoon && !fin) continue
			const o = turnOver(t, d)
			// The ring round the lead stays clear ground, so its lines out to the C read on the cobalt.
			const s = flipIn(t, fieldAt(d)) * o.front // Round 27e: the field is complete, the ring round the lead too
			if (s > 0.001 && inSoon) unit(world, x, y, C.cobalt600, { sx: s, opacity: fieldShade(d) })
			back(q, r, x, y, o.back)
		}
	}
	const lineAttrs = { fill: 'none', stroke: C.cobalt200, 'stroke-width': CONNECT.line.width, 'stroke-linecap': 'butt' }
	// The connectors: from the lead out to each Nextcloud cell, drawn on as the cell flips in (a line, no
	// spark: Round 27c, no hex floats over the grid).
	LOAD_ORDER.forEach((id, i) => {
		const t0 = K.loads[i] - K.linkDur
		// Round 28g: the lines draw off back into the lead as the white ring flips in, so the zoomed-out
		// view has no lines, only the C, the field ring and the white ring.
		const r0 = K.zoom[0] + 0.3, r1 = r0 + 24 * F(1) * 0.45
		const pr = inv(t0, K.loads[i], t) * unlink * (1 - ease.inOutCubic(inv(r0, r1, t)))
		if (pr <= 0.001) return
		const [x, y] = cxy(CONNECT.cells[id])
		const L = Math.hypot(x, y), ux = x / L, uy = y / L
		const a = HEX_R * 0.9, b = L - HEX_R * 0.9
		const e = lerp(a, b, pr)
		el('line', { x1: ux * a, y1: uy * a, x2: ux * e, y2: uy * e, ...lineAttrs }, world)
	})
	// The Nextcloud apps, in Nextcloud blue with white icons, flipping in; they turn over at the re-zoom.
	LOAD_ORDER.forEach((id, i) => {
		const [q, r] = CONNECT.cells[id], [x, y] = cxy([q, r])
		const o = turnOver(t, 2)
		unit(world, x, y, C.nextcloud, { icon: iconOf(id), color: C.white, sx: turnInto(t, 0, K.loads[i]).app * o.front })
		back(q, r, x, y, o.back)
	})
	// The family: one full ring of white cells, apps with their glyphs and blank white between, each
	// turning over out of its field cell as the camera pulls back (Round 27e: no lines inward).
	fam.forEach((f, i) => {
		const [x, y] = cxy([f.q, f.r])
		const o = turnOver(t, 4)
		unit(world, x, y, C.white, { glyph: f.id, color: C.cobalt, sx: turnInto(t, 0, K.zoom[0] + 0.3 + i * (F(1) * 0.45)).app * o.front })
		back(f.q, f.r, x, y, o.back)
	})
	// The lead: the film's app (or OpenRegister), the frame's one orange; it turns over into the avatar.
	const o = turnOver(t, 0)
	unit(world, 0, 0, C.orange, { glyph: lead, color: C.white, sx: turnInto(t, 0, K.lead).app * o.front })
	back(0, 0, 0, 0, o.back)

	// The type column: the Nextcloud mark, "Built on" / "Nextcloud", and the one swapping line that ends
	// on "Enhanced by Conduction".
	const Y = CONNECT.type
	const [c1, c2] = [p.caption || T.builtOn[0], p.markText || T.builtOn[1]]
	risingMark(g, TX, Y.markY, Y.markH, inv(K.typeIn, K.typeIn + RISE, t), qType, 'nextcloud-logo', { color: C.white, inset: 0 })
	risingText(g, c1, { x: TX, y: Y.first, size: Y.size, weight: 700, fill: C.white, tracking: -0.02 }, inv(K.typeIn, K.typeIn + RISE, t), qType)
	const m0 = K.typeIn + SPB / 4
	risingText(g, c2, { x: TX, y: Y.first + Y.lh, size: Y.size, weight: 700, fill: C.white, tracking: -0.02 }, inv(m0, m0 + RISE, t), qType)
	// Round 28j: "Works with" stays; the name rolls, slot-machine style, through the apps in load order.
	// The line rises as the first cell lands, so Mail is fully up from its cell's frame (0.39 s still, like the rest).
	const L0 = K.loads[K.names[0]] - RISE, L1 = K.enhanced
	if (t >= L0 && t < L1 + EXIT) {
		const q1 = inv(L1, L1 + EXIT, t)
		const lead = `${T.worksWith} `
		risingText(g, T.worksWith, { x: TX, y: Y.lineY, size: Y.lineSize, weight: 600, fill: C.white, tracking: -0.01 }, inv(L0, L0 + RISE, t), q1)
		// The name column: every app in load order, one line apart; its position steps to each named cell's
		// index over the roll, so the cells between pass by.
		let pos = K.names[0]
		K.names.forEach((i, j) => { if (j) pos = lerp(pos, i, ease.inOutCubic(inv(K.loads[i] - K.roll, K.loads[i], t))) })
		const nx = TX + measure(lead, { size: Y.lineSize, weight: 600, tracking: -0.01 })
		const step = Y.lineSize * 1.3
		const id = nextId('roll')
		const cp = el('clipPath', { id }, g)
		el('rect', { x: nx - 10, y: Y.lineY - Y.lineSize * 1.0, width: 900, height: Y.lineSize * 1.32 }, cp)
		const rg = el('g', { 'clip-path': `url(#${id})` }, g)
		const inner = el('g', { transform: `translate(0 ${(-(pos - K.names[0]) * step).toFixed(2)})` }, rg)
		LOAD_ORDER.forEach((app, i) => {
			const dy = (i - K.names[0]) * step
			if (Math.abs(i - pos) >= 1) return // at rest only the current name; in a roll the ones passing
			risingText(inner, T.names[app], { x: nx, y: Y.lineY + dy, size: Y.lineSize, weight: 600, fill: C.nextcloudCyan, tracking: -0.01 }, inv(L0, L0 + RISE, t), q1)
		})
	}
	risingText(g, T.enhanced, { x: TX, y: Y.lineY, size: Y.lineSize, weight: 600, fill: C.white, tracking: -0.01 }, inv(K.enhanced, K.enhanced + RISE, t), qType)
}

function connectCues(cue) {
	const K = CLOSING.connect
	cue(K.lead, 'click', { gain: 0.24, freq: 2600, seed: 81, dry: true })
	cue(K.lead + 0.02, 'impact', { gain: 0.2, from: 110, to: 48, decay: 0.5 })
	const notes = [1174.66, 1318.51, 1479.98, 1567.98, 1760, 1975.53, 2217.46, 2349.32, 2637.02]
	K.loads.forEach((t, i) => cue(t, 'tick', { freq: notes[i], gain: 0.12, pan: -0.4 + i * 0.1 }))
	// Round 28j: a soft dry click as the name rolls, like a slot reel stopping.
	K.names.slice(1).forEach((i, j) => cue(K.loads[i], 'click', { gain: 0.1, freq: 2900, seed: 120 + j, dry: true, pan: -0.5 }))
	cue(K.zoom[0] - 0.02, 'whoosh', { dur: 0.9, from: 500, to: 3200, panFrom: -0.2, panTo: 0.3, gain: 0.12 })
	for (let i = 0; i < 8; i++) cue(K.zoom[0] + 0.3 + i * 0.05, 'tick', { freq: 2349.32 + i * 90, gain: 0.05, decay: 0.03, pan: -0.5 + i * 0.14 })
	cue(K.enhanced, 'pluck', { freq: 880, gain: 0.18, decay: 0.6 })
	// The re-zoom: a rising whoosh as the camera comes back in, soft ticks as the rings turn over, a dry
	// click as the lead turns into the avatar.
	cue(K.rezoom[0] - 0.02, 'whoosh', { dur: 0.5, from: 3000, to: 700, panFrom: 0.2, panTo: 0.4, gain: 0.1 })
	for (let d = 1; d <= 4; d++) cue(K.rezoom[0] + d * F(1) * 0.5 + F(3), 'tick', { freq: 1760 + d * 120, gain: 0.05, decay: 0.03, pan: 0.2 + d * 0.05 })
	cue(K.rezoom[0] + F(3), 'click', { gain: 0.26, freq: 3000, seed: 82, dry: true })
}

/* ---------- the install board: three concepts (Round 22); 'current' is the default ---------- */

/**
 * Type for the install board without a header: the three words at headline size, the line under them.
 * lineGap 140 keeps the air round the line in English and Dutch. The avatar is one grid cell (HEX_R).
 */
const INSTALL22 = { first: 400, size: 116, lh: 124, lineSize: 72, lineGap: 140, avatar: { x: AVATAR.x, y: AVATAR.y, r: HEX_R } }
const installWords = (p) => {
	const T = CLOSING_TEXT[p.lang === 'nl' ? 'nl' : 'en']
	return { slogans: p.slogans || T.slogans, line: p.line || T.line }
}
/** The orange sits on the word most recently powered on or landed; it ends on the last. */
const orangeOn = (t, i) => {
	const W = CLOSING.install21.words
	return t >= W[i] && (i === W.length - 1 || t < W[i + 1])
}
function installLine(g, t, line) {
	const K = CLOSING.install21, I = INSTALL22
	const y = I.first + 2 * I.lh + I.lineGap
	risingText(g, line, { x: TX, y, size: I.lineSize, weight: 600, fill: C.white, tracking: -0.01, lineHeight: 1.12 }, inv(K.line, K.line + RISE, t))
}
function quietComb(g, t, cx, cy, r, gap, W = 1920) {
	for (let qq = -4; qq <= 4; qq++) {
		for (let rr = -4; rr <= 3; rr++) {
			const [x, y] = axial(cx, cy, qq, rr, r, gap)
			const d = (Math.abs(qq) + Math.abs(rr) + Math.abs(qq + rr)) / 2
			if (y > 620 || x < 1200 || x > W + r || y < -r) continue
			if (qq === 0 && rr === 0) continue
			const s = pop(t, 0.05 + d * F(1))
			if (s <= 0.001) continue
			el('path', { d: hexPath(x, y, r * Math.min(1, s), r * 0.1), fill: C.cobalt600, 'fill-opacity': Math.max(0.25, 1 - d * 0.2).toFixed(3) }, g)
		}
	}
}
function avatarCell(g, x, y, r, s = 1, power = 1) {
	if (s <= 0.001) return
	const [aw, ah] = MARK_BOX['avatar-conduction']
	const h = 2 * r, w = (h * aw) / ah
	const fg = el('g', Math.abs(s - 1) > 1e-4 ? { transform: `translate(${x} ${y}) scale(${s.toFixed(4)}) translate(${-x} ${-y})` } : {}, g)
	el('use', { href: '#avatar-conduction', x: x - w / 2, y: y - h / 2, width: w, height: h, color: mix(C.cobalt300, C.white, power) }, fg)
}

/**
 * Concept 'current' (the pick; Round 27b drops its wire): the field and the Conduction avatar are already
 * in place, turned over from Built on's cells in the re-zoom (the same grid cells, the same shades), so
 * nothing pops in. "Install it", "Use it" and "Own it" rise out of their lines one a beat, the orange
 * moving to each and landing on "Own it", then the open-source line rises. Sound: a click per word, a
 * low thud under "Own it", a pluck on the line.
 */
function drawInstallCurrent(g, t, p, W = 1920) {
	const K = CLOSING.install21, I = INSTALL22
	const { slogans, line } = installWords(p)
	for (let r = -5; r <= 5; r++) {
		for (let q = -6; q <= 6; q++) {
			const sh = installShade(q, r, W)
			if (sh == null) continue
			const [x, y] = cxy([q, r])
			fieldCell(g, AVATAR.x + x, AVATAR.y + y, sh)
		}
	}
	avatarAt(g, AVATAR.x, AVATAR.y)
	slogans.forEach((s, i) => {
		const y = I.first + i * I.lh
		risingText(g, s, { x: TX, y, size: I.size, weight: 700, fill: orangeOn(t, i) ? C.orange : C.white, tracking: -0.02 }, inv(K.words[i], K.words[i] + RISE, t))
	})
	installLine(g, t, line)
}

/**
 * Concept 'lock': the three words land one a beat, and with each a hex flies in from off frame and
 * locks into a three-cell cluster on the right (a mechanical step, then a settle); the third cell is
 * the Conduction avatar, and the orange moves with the words and lands on "Own it".
 */
function drawInstallLock(g, t, p, W = 1920) {
	const K = CLOSING.install21, I = INSTALL22
	const { slogans, line } = installWords(p)
	const r = 96, gap = 12, cx = 1450, cy = 430
	const cells = [axial(cx, cy, 0, -1, r, gap), axial(cx, cy, 1, -1, r, gap), axial(cx, cy, 0, 0, r, gap)]
	const from = [[W + 200, cells[0][1] - 300], [W + 300, cells[1][1]], [cells[2][0], 1080 + 250]]
	quietComb(g, t, cx + 60, cy - 60, 70, 9, W)
	cells.forEach(([x, y], i) => {
		const t0 = K.words[i]
		const k = ease.snap(inv(t0 - 0.28, t0, t))
		if (k <= 0) return
		const s = 1 + 0.06 * (1 - spring(Math.max(0, t - t0), { freq: 3.4, zeta: 0.45 }))
		const px = lerp(from[i][0], x, k), py = lerp(from[i][1], y, k)
		if (i < 2) cell(g, px, py, r, i === 0 ? C.nextcloud : C.white, { icon: i === 0 ? 'nextcloud-logo' : null, glyph: i === 1 ? (p.app || 'openregister') : null, color: i === 0 ? C.white : C.cobalt, box: i === 0 ? [r * 1.1, r * 0.5] : null, s })
		else avatarCell(g, px, py, r, s, 1)
	})
	slogans.forEach((s, i) => {
		const y = I.first + i * I.lh
		risingText(g, s, { x: TX, y, size: I.size, weight: 700, fill: orangeOn(t, i) ? C.orange : C.white, tracking: -0.02 }, inv(K.words[i], K.words[i] + RISE, t))
	})
	installLine(g, t, line)
}

/**
 * Concept 'split': one orange cell pulses in the middle of the picture, then splits into three cells
 * that slide to their places in a column beside the words, one a beat, each word rising with its cell;
 * the orange travels with the newest and ends on "Own it"; the last cell turns into the avatar.
 */
function drawInstallSplit(g, t, p, W = 1920) {
	const K = CLOSING.install21, I = INSTALL22
	const { slogans, line } = installWords(p)
	const r = 70, cx0 = 1400, cy0 = 520
	quietComb(g, t, 1560, 300, 70, 9, W)
	const col = 1100
	const targets = slogans.map((_, i) => [col, I.first + i * I.lh - I.size * 0.34])
	const s0 = pop(t, 0)
	if (t < K.words[0]) cell(g, cx0, cy0, r, C.orange, { s: s0 * (1 + 0.05 * Math.sin(t * 18)) })
	slogans.forEach((s, i) => {
		const t0 = K.words[i]
		const k = ease.brand(inv(t0 - 0.2, t0 + 0.1, t))
		if (t < t0 - 0.2) return
		const [tx, ty] = targets[i]
		const x = lerp(cx0, tx, k), y = lerp(cy0, ty, k)
		const newest = orangeOn(t, i)
		if (i === 2 && t > t0 + 0.4) avatarCell(g, x, y, r, 1, 1)
		else cell(g, x, y, r, newest ? C.orange : C.white, { s: 1 })
		risingText(g, s, { x: TX, y: I.first + i * I.lh, size: I.size, weight: 700, fill: newest ? C.orange : C.white, tracking: -0.02 }, inv(t0, t0 + RISE, t))
	})
	installLine(g, t, line)
}

const INSTALL_CONCEPTS = { current: drawInstallCurrent, lock: drawInstallLock, split: drawInstallSplit }
export const INSTALL_DEFAULT = 'current'
/** The install concept for a name, falling back to the default (the name can come from a page's query string). */
const installConcept = (name) => (Object.hasOwn(INSTALL_CONCEPTS, name) ? INSTALL_CONCEPTS[name] : INSTALL_CONCEPTS[INSTALL_DEFAULT])

function install21Cues(cue, concept = INSTALL_DEFAULT) {
	const K = CLOSING.install21
	if (concept === 'current') {
		K.words.forEach((t, i) => cue(t, 'click', { gain: 0.24 + i * 0.05, freq: 2600 + i * 150, seed: 71 + i, dry: true }))
		cue(K.words[2], 'impact', { gain: 0.26, from: 90, to: 32, decay: 0.9 })
	} else {
		K.words.forEach((t, i) => cue(t, 'click', { gain: 0.24 + i * 0.05, freq: 2600 + i * 150, seed: 71 + i, dry: true }))
		if (concept === 'lock') K.words.forEach((t) => cue(t - 0.28, 'whoosh', { dur: 0.3, from: 3000, to: 900, gain: 0.07 }))
		else cue(K.words[0] - 0.2, 'whoosh', { dur: 0.4, from: 900, to: 2600, gain: 0.08 })
		cue(K.words[2], 'impact', { gain: 0.3, from: 90, to: 32, decay: 1.0 })
	}
	cue(K.line, 'pluck', { freq: 880, gain: 0.2, decay: 0.8 })
}

/* ---------- the exported pieces (Round 21/22 by default; legacy: true for the round-6 pieces) ---------- */

export function builtOnScene(ctx, p = {}) {
	if (p.legacy) return legacyBuiltOnScene(ctx, p)
	const layer = el('g', { 'data-layer': 'built-on' }, ctx.g)
	if (ctx.cue && p.sound !== false) connectCues((t, kind, o) => ctx.cue(ctx.start + t, kind, o))
	return (t) => {
		layer.replaceChildren()
		drawConnect(layer, clamp(t - ctx.start, 0, CLOSING.connect.dur), p, ctx.W)
	}
}

export function builtOnFrame(ctx, p = {}) {
	if (p.legacy) return legacyBuiltOnFrame(ctx, p)
	drawConnect(el('g', {}, ctx.g), p.at ?? CLOSING.connect.key, p, ctx.W)
	return { cells: Object.fromEntries(Object.entries(CONNECT.cells).map(([k, v]) => [k, cxy(v)])), size: HEX_R, cam: camAt(p.at ?? CLOSING.connect.key) }
}

export function installScene(ctx, p = {}) {
	if (p.legacy) return legacyInstallScene(ctx, p)
	const concept = Object.hasOwn(INSTALL_CONCEPTS, p.concept) ? p.concept : INSTALL_DEFAULT
	const draw = installConcept(concept)
	const layer = el('g', { 'data-layer': 'install' }, ctx.g)
	if (ctx.cue && p.sound !== false) install21Cues((t, kind, o) => ctx.cue(ctx.start + t, kind, o), concept)
	return (t) => {
		layer.replaceChildren()
		draw(layer, clamp(t - ctx.start, 0, CLOSING.install21.dur), p, ctx.W)
	}
}

export function installFrame(ctx, p = {}) {
	if (p.legacy) return legacyInstallFrame(ctx, p)
	installConcept(p.concept)(el('g', {}, ctx.g), p.at ?? CLOSING.install21.key, p, ctx.W)
	return { type: INSTALL22 }
}

/** The on-screen words of the Round 21/22 pieces, for a board's word list. */
export function closingWords(lang = 'en') {
	const T = CLOSING_TEXT[lang === 'nl' ? 'nl' : 'en']
	return { builtOn: `${T.builtOn.join('\n')}\n${T.worksWith} ${CLOSING.connect.names.map((i) => T.names[LOAD_ORDER[i]]).join(' / ')}\n${T.enhanced}`, install: `${T.slogans.join('\n')}\n${T.line}` }
}
