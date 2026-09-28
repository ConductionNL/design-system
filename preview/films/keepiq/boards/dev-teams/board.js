/**
 * Keepiq, ONE audience film (Round 20, Ruben 2026-09-28): the software-teams and public-sector IT
 * films merged, built from the software-teams film. Speaks to the DevOps engineer and the
 * municipal system administrator; the head of engineering, the CISO or the information manager
 * buys. Positioning: ds-connext-film-review/audiences/positioning-tk.md. Sources:
 * ~/memcap-work/positioning/mi/positioning/keepiq.json (sp-cicd-machine-secrets,
 * usp-ask-once-fill-once (verified), usp-own-certificate-authority (verified)) and Keepiq's specs
 * on development (machine-secret-leases, secret-store-api, keepiq-cli, secret-requests,
 * certificate-lifecycle, secret-audit-trail).
 *
 *   story 1  Round 25b, word art, the sister of Thematiq's story: "The key to your own house?", the lock
 *            cell popping into the field (the promise slot; replaces the Round 19 question)
 *   story 2  word art: "Kept by someone else's app?", the lock leaving the honeycomb for a plain outside
 *            box (someone else's app, an outside system, so a box, and no name) (the hook slot)
 *   proof 1  Round 22b: request a password or a certificate from a partner organisation (or a
 *            colleague) by fill-in link; a small sourced "NIS2 · BIO2" label, context only
 *   proof 2  Round 22b: a one-time link: the value can be read once, then the link is gone
 *   general  a usage dashboard, not the change log (Round 20): for each password, who used it
 *            (a person or an app), when, where and what for
 *   CUT (Round 25b): "Apps use passwords without reading them" (the pipeline): with the two story cards
 *            the body would be 34 words; the proofs that answer the story (request, one-time link, every
 *            use visible) stay. The pipeline UI stays in this file, unused.
 *   CUT (Round 22b): "Your certificates renew themselves". With the two new scenes the body came to 34
 *            words, over the bible's 30, and this lane's template has no 3-proof (12-bar) plan; the
 *            certificate request stays in the picture of proof 1.
 *
 * Techniques (refs/techniques.md): #2 sentence build as word art (the story), #4 typewriter (the masked value), #9 text-swap
 * on a held diagram (the burned link), #3 grid-cell ripple as rows (the usage rows).
 */
import { C } from '../../../_lib/brand.js'
import { el, textBlock } from '../../../_lib/stage.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, panel, statusPill, use, flowNode, appTag, appMark, button, chrome, honeyField, layout } from '../../../_lib/ui.js'
import { ease, hexPath } from '../../../_lib/core.js'
import { current } from '../../../tkfilm/lib.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Text typed live under the UI.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A fast move on the beat between held shots.' },
	{ name: 'Claude mobile tools reel', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
]

/** Hook: a pipeline run; the fetch step pulls the secret into memory, the disk slot stays empty. */
/** st (the film's state; defaults are the still): steps 0..4 done, ring 0..1, log 0..5 lines typed, dots 0..8, lease 0..1 left. */
export function pipelineUI(w, geom, st = {}) {
	const { u } = geom
	const { steps = 2, ring = 1, log = 5, dots = 8, lease = 0.35 } = st
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 190, u)
	const nw = 160, nh = 86, gap = 30, y = top + 52
	for (let i = 0; i < 4; i++) {
		const nx = x + 40 + i * (nw + gap)
		if (i > 0) rect(w, nx - gap, y + nh / 2 - 1.5 * u, gap, 3 * u, C.cobalt300)
		flowNode(w, nx, y, nw, nh, u, { kind: i === 0 ? 'trigger' : 'step' })
		if (i < steps) statusPill(w, nx + nw - 70, y + nh - 20, u)
	}
	// the fetch step: ringed in orange, a lock on it
	const fx = x + 40 + 2 * (nw + gap)
	use(w, 'icon-lock', fx + nw - 50, y + 12, 32, 32, C.cobalt)
	if (ring > 0) rect(w, fx - 8, y - 8, nw + 16, nh + 16, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, 'stroke-opacity': ring })
	// the run log: dark, typed line by line, the secret masked and held in memory only
	const ly = top + 220
	rect(w, x, ly, width, 330, C.cobalt900, 5 * u)
	const lines = [0.5, 0.7, 0.4, 0.62, 0.55]
	lines.forEach((p, i) => {
		const typed = Math.min(1, Math.max(0, log - i))
		if (typed <= 0) return
		const cy = ly + 50 + i * 50
		bar(w, x + 30, cy - 4, 16, 8, i === 2 ? C.mint300 : C.cobalt400)
		bar(w, x + 60, cy - 4, (width - 120) * p * typed, 8, C.cobalt300)
		if (i === 2 && typed >= 1) for (let k = 0; k < Math.min(8, Math.floor(dots)); k++) circle(w, x + 60 + (width - 120) * p + 30 + k * 20, cy, 6, C.white)
	})
	// the lease: a short timer bar, counting down
	rect(w, x + 30, ly + 290, width - 60, 10, C.cobalt700, 5)
	if (lease > 0) rect(w, x + 30, ly + 290, (width - 60) * lease, 10, C.mint, 5)
}

const TX = (g, text, x, y, size, o = {}) => textBlock(g, text, { x, y, size, weight: o.weight ?? 600, fill: o.fill ?? C.cobalt900, clip: false, tracking: -0.01 })

/**
 * Proof 1 (Round 22b): request a password or a certificate from a partner organisation. The partner is an
 * outside system, so a plain box on the left; the request (spec secret-requests: requestable fields, a
 * fill-in link, values encrypted on receipt with the requester's certificate, optional expiry) on the right.
 */
/** st: ticks 0..2 (fields ticked), link 0..1 (the link typing in), ring 0..1, wire 0..1 (the link out to the partner), fill 0..8 (the partner's masked value), back 0..1 (the value back into the vault). */
export function partnerRequestUI(w, geom, st = {}) {
	const { u } = geom
	const { ticks = 2, link = 1, ring = 1, wire = 1, fill = 8, back = 1 } = st
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	// the partner organisation: a plain box with its own people, the fill-in page open on its side
	const bw = 250
	rect(w, x, top + 190, bw, 360, C.cobalt50, 5 * u, { stroke: C.cobalt200, 'stroke-width': u })
	for (let k = 0; k < 3; k++) { circle(w, x + 40, top + 240 + k * 50, 14, [C.cobalt300, C.cobalt200, C.cobalt300][k]); bar(w, x + 66, top + 236 + k * 50, [120, 90, 110][k], 8, C.cobalt400) }
	panel(w, x + 20, top + 400, bw - 40, 120, u)
	for (let i = 0; i < Math.min(8, Math.floor(fill)); i++) circle(w, x + 50 + i * 20, top + 442, 6, C.cobalt900)
	rect(w, x + 40, top + 470, 90, 28, C.cobalt, 3 * u)
	// the wire: the fill-in link out, the value back into the vault (straight, square corners)
	// the wire (Round 24 current): out to the partner with the link, back with the value
	const rx0 = x + bw + 60
	current(w, [[rx0 + 30, top + 528], [rx0 - 30, top + 528], [rx0 - 30, top + 370], [x + bw, top + 370]], wire, { w: 3 * u, spark: 10, stroke: C.cobalt300 })
	if (back > 0 && back < 1) current(w, [[x + bw, top + 390], [rx0 - 14, top + 390], [rx0 - 14, top + 130], [rx0, top + 130]], back, { w: 3 * u, spark: 10, stroke: C.mint300 })
	// the request
	const rx = x + bw + 60, rw = width - bw - 60
	panel(w, rx, top, rw, 600, u)
	use(w, 'icon-lock', rx + 30, top + 26, 36, 36, C.cobalt)
	TX(w, 'Request', rx + 80, top + 54, 24)
	// the small, sourced label (docs/FEATURES.md, spec compliance-reporting): context, not a claim
	rect(w, rx + rw - 150, top + 24, 124, 38, C.cobalt50, 19)
	TX(w, 'NIS2 · BIO2', rx + rw - 136, top + 50, 17, { fill: C.cobalt })
	// the requestable fields: a password and a certificate, both ticked
	;[['Password', ticks >= 1], ['Certificate', ticks >= 2], ['Username', false]].forEach(([t, on], i) => {
		const cy = top + 120 + i * 62
		rect(w, rx + 30, cy - 16, 32, 32, on ? C.mint : C.white, 4, on ? {} : { stroke: C.cobalt300, 'stroke-width': u })
		if (on) use(w, 'icon-check', rx + 34, cy - 12, 24, 24, C.white)
		TX(w, t, rx + 80, cy + 7, 20, { weight: 500 })
	})
	// to whom, and until when
	bar(w, rx + 30, top + 320, 90, 8, C.cobalt400)
	rect(w, rx + 30, top + 336, rw - 60, 48, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u })
	bar(w, rx + 46, top + 356, 190, 9, C.cobalt900)
	bar(w, rx + 30, top + 408, 70, 8, C.cobalt400)
	rect(w, rx + 30, top + 424, 170, 44, C.cobalt50, 3 * u)
	bar(w, rx + 46, top + 442, 100, 8, C.cobalt700)
	// the fill-in link, the scene's one orange
	rect(w, rx + 30, top + 500, rw - 60, 56, C.cobalt50, 3 * u)
	for (let i = 0; i < Math.round(12 * link); i++) rect(w, rx + 50 + i * 22, top + 520, i % 5 === 4 ? 8 : 15, 15, C.cobalt700, 2)
	if (ring > 0) rect(w, rx + 22, top + 492, rw - 44, 72, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, 'stroke-opacity': ring })
}

/**
 * Proof 2 (Round 22b): a one-time link. Specs ephemeral-send (burn after read, default one view, optional
 * expiry and password, no account needed) and link-sharing (usage limit, auto-deletion). Left: the send
 * being made, "1 view" ringed. Right: the recipient's side, opened once, then gone.
 */
/** st: views ('' or '1'), ring 0..1, link 0..1, open 0..1 (the recipient reads it), burn 0..1 (the link is gone). */
export function onceLinkUI(w, geom, st = {}) {
	const { u } = geom
	const { views = '1', ring = 1, link = 1, open = 1, burn = 0 } = st
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	const lw = width * 0.58
	panel(w, x, top, lw, 600, u)
	TX(w, 'Send by link', x + 110, top + 54, 24)
	// the value, masked
	rect(w, x + 30, top + 100, lw - 60, 56, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u })
	for (let i = 0; i < 12; i++) circle(w, x + 60 + i * 22, top + 128, 7, C.cobalt900)
	// max views and expiry
	TX(w, 'Max views', x + 30, top + 206, 18, { weight: 500, fill: C.cobalt700 })
	rect(w, x + 30, top + 220, 150, 50, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u })
	if (views) TX(w, views, x + 50, top + 254, 24)
	if (ring > 0) rect(w, x + 22, top + 212, 166, 66, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, 'stroke-opacity': ring })
	TX(w, 'Expires', x + 230, top + 206, 18, { weight: 500, fill: C.cobalt700 })
	rect(w, x + 230, top + 220, lw - 260, 50, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u })
	bar(w, x + 250, top + 241, 110, 9, C.cobalt900)
	// the link
	rect(w, x + 30, top + 320, lw - 60, 56, C.cobalt50, 3 * u)
	for (let i = 0; i < Math.round(12 * link); i++) rect(w, x + 50 + i * 22, top + 340, i % 5 === 4 ? 8 : 15, 15, burn > 0 ? C.cobalt200 : C.cobalt700, 2)
	button(w, x + lw - 210, top + 520, 180, 52, u)
	// the recipient: opened once, then the link is gone
	const rx = x + lw + 24, rw = width - lw - 24
	if (open > 0) {
		const oy = 40 * (1 - ease.brand(open))
		const og = el('g', { opacity: Math.min(1, open * 2).toFixed(3), transform: `translate(0 ${oy.toFixed(1)})` }, w)
		panel(og, rx, top + 60, rw, 220, u)
		for (let i = 0; i < 8; i++) circle(og, rx + 40 + i * 22, top + 130, 6, C.cobalt900)
		bar(og, rx + 30, top + 180, rw - 100, 8, C.cobalt300)
		statusPill(og, rx + 30, top + 236, u)
	}
	// the second visit: the link is gone (burn 1)
	if (burn > 0) {
		const bg = el('g', { opacity: Math.min(1, burn * 2).toFixed(3) }, w)
		panel(bg, rx, top + 320, rw, 160, u, { fill: C.cobalt50 })
		bar(bg, rx + 30, top + 380, rw - 90, 10, C.cobalt200)
		bar(bg, rx + 30, top + 410, rw - 150, 8, C.cobalt100)
	}
}

/**
 * General slot, Round 20: the usage dashboard. Drawn in the shared general scenes' local
 * coordinates (x 170 to 780, y 640 to 1240, scale 1.25) so it sits where every general scene
 * sits. Top: one password, its uses per day. Below: its uses, newest first, in four columns with
 * small labels: who (a person's avatar or an app's hex: Integriq, OpenRegister), when, where
 * (the Nextcloud app or pipeline it was used from) and what for. The newest use, by an app, is
 * the one orange ring.
 */
const USAGE_CAPTION = 'Every use: who,\nwhen, where, why'
function usageFrame(ctx) {
	chrome(ctx, { text: USAGE_CAPTION, app: 'keepiq' })
	honeyField(ctx.g, ctx.W * 0.62, ctx.H + 150, 80, 10, { top: ctx.H * 0.61, scale: 0.7, W: ctx.W, H: ctx.H, alpha: { 0: 0.5, 1: 0.46, 2: 0.4, 3: 0.3, 4: 0.2, 5: 0.12, 6: 0.07 } })
	const { ui } = layout(ctx.W, ctx.H)
	const g = el('g', { transform: `translate(${ui.x - 1.25 * 120} ${ui.y - 1.25 * 640}) scale(1.25)` }, ctx.g)
	usageContent(g)
}

/** The dashboard itself, in the general local coordinates. st: bars 0..1 (the day bars growing), rows 0..5, ring 0..1, tag 0..1. */
export function usageContent(g, st = {}) {
	const U = 2.5
	const { bars = 1, rows: nRows = 5, ring = 1, tag = 1 } = st
	// the password and its uses per day
	const x = 170, w = 610
	panel(g, x, 640, w, 170, U)
	use(g, 'icon-lock', x + 70, 664, 32, 32, C.cobalt)
	bar(g, x + 116, 672, 200, 14, C.cobalt900)
	const days = [0.3, 0.5, 0.4, 0.7, 0.45, 0.6, 0.35, 0.8, 0.55, 0.65, 0.5, 0.9]
	days.forEach((h, i) => { const k = Math.max(0, Math.min(1, bars * days.length - i)); if (k > 0) rect(g, x + 70 + i * 43, 790 - 70 * h * k, 26, 70 * h * k, i === days.length - 1 ? C.mint : C.cobalt300, 3) })
	if (tag > 0) appTag(g, x, 700, 40 * tag, 'keepiq', { ringW: 5 })
	// the uses: who, when, where, what for
	const ty = 830
	panel(g, x, ty, w, 410, U)
	const cols = [[x + 40, 'Who'], [x + 150, 'When'], [x + 290, 'Where'], [x + 450, 'What for']]
	cols.forEach(([cx, t]) => textBlock(g, t, { x: cx, y: ty + 44, size: 22, weight: 600, fill: C.cobalt700, clip: false }))
	rect(g, x + 24, ty + 62, w - 48, U / 2, C.cobalt100)
	const rows = [['app', 'integriq', 'nc-files', C.lavender300], ['person', C.cobalt300, 'nc-mail', C.mint300], ['app', 'openregister', 'nc-activity', C.lavender300], ['person', C.cobalt200, 'nc-talk', C.cobalt100], ['person', C.cobalt300, 'nc-files', C.mint300]]
	rows.forEach(([kind, who, where, why], i) => {
		if (i >= nRows) return
		const cy = ty + 104 + i * 62
		if (i > 0) rect(g, x + 24, cy - 31, w - 48, U / 2, C.cobalt50)
		if (kind === 'app') appTag(g, x + 62, cy, 20, who, { ringW: 0 })
		else circle(g, x + 62, cy, 18, who)
		bar(g, x + 150, cy - 4, [90, 70, 100, 80, 60][i], 8, C.cobalt700)
		use(g, where, x + 290, cy - 14, 28, 28, C.cobalt)
		bar(g, x + 330, cy - 4, [70, 90, 60, 80, 70][i], 8, C.cobalt400)
		rect(g, x + 450, cy - 15, 120, 30, why, 15)
		bar(g, x + 472, cy - 3, 76, 6, C.cobalt900)
	})
	if (ring > 0) rect(g, x + 14, ty + 104 - 28, w - 28, 56, 'none', 5 * U, { stroke: C.orange, 'stroke-width': 2.5 * U, 'stroke-opacity': ring })
}

/* ---------- the story (Round 25b): word art, the sister of Thematiq's ---------- */

const WA = (g, text, x, y, size, o = {}) => textBlock(g, text, { x, y, size, weight: 700, fill: o.fill ?? C.white, accent: C.orange, tracking: -0.03, clip: false, split: o.split })

/** The house-hex with its lock: the Keepiq glyph on a white cell (the key to your own house). */
export function lockCell(g, cx, cy, r = 150, { fill = C.white, glyph = C.cobalt, s = 1 } = {}) {
	if (s <= 0.001) return
	const t = el('g', Math.abs(s - 1) > 1e-4 ? { transform: `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})` } : {}, g)
	el('path', { d: hexPath(cx, cy, r, r * 0.08), fill }, t)
	const sz = r * 0.84
	use(t, 'g-keepiq', cx - sz / 2, cy - sz / 2, sz, sz, glyph)
}

/** Someone else's app: an outside system, so a plain box (never a hex), with no name, the key inside it. */
export function outsideBox(g, x, y, w = 300, h = 240, { s = 1 } = {}) {
	if (s <= 0.001) return
	const cx = x + w / 2, cy = y + h / 2
	const t = el('g', Math.abs(s - 1) > 1e-4 ? { transform: `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})` } : {}, g)
	rect(t, x, y, w, h, C.cobalt50, 14, { stroke: C.cobalt200, 'stroke-width': 3 })
	rect(t, x, y, w, 44, C.cobalt200, 14)
	rect(t, x, y + 30, w, 14, C.cobalt200)
	for (let i = 0; i < 3; i++) circle(t, x + 26 + i * 22, y + 22, 6, C.white)
	use(t, 'icon-lock', cx - 45, cy - 18, 90, 90, C.cobalt300)
}

/** Story 1: "The key to your own house?", "own" the scene's one orange, the lock cell on the right. */
function storyOne(ctx) {
	const g = el('g', {}, ctx.g)
	appMark(g, 'keepiq')
	WA(g, 'The key to', 120, 580, 140)
	WA(g, 'your *own* house?', 120, 820, 170)
	lockCell(g, 1560, 560, 170)
}

/** Story 2: "Kept by someone else's app?", "someone else's" in orange; the lock gone from its cell into an outside box. */
function storyTwo(ctx) {
	const g = el('g', {}, ctx.g)
	appMark(g, 'keepiq')
	WA(g, 'Kept by', 120, 600, 150)
	WA(g, '*someone* *else\'s* app?', 120, 860, 160)
	el('path', { d: hexPath(1560, 560, 170, 14), fill: 'none', stroke: C.cobalt300, 'stroke-width': 4, 'stroke-dasharray': '14 12' }, g)
	outsideBox(g, 1440, 120, 320, 250)
}

const content = {
	app: 'keepiq',
	// Round 24: the current's key elements where the orange is word art: the lock cell, then the outside box.
	anchors: { promise: [1440, 560], hook: [1470, 245] },
	audience: { slug: 'dev-teams', name: 'IT and software teams', persona: 'The DevOps engineer at a 40-person software vendor (Sanne de Groot) and the municipal system administrator (Bas Kuiper); the head of engineering, the CISO or the information manager buys (Round 20: one Keepiq film)' },
	promise: 'The key to\nyour own house?',
	promiseLine: 'Human and machine passwords in one vault, on your own server',
	title: 'Keepiq',
	record: { one: 'password', many: 'passwords' },
	logline: 'An ownership story: the key to your own house, kept by someone else\'s app? Then the answer, on your own server: request passwords and certificates from partner organisations by link, share a value by a link that vanishes after one view, and every use shows who, when, where and why.',
	references: REFS,
	techniques: ['#2 sentence build as word art (the story)', '#4 typewriter (the masked value)', '#9 text-swap on a held diagram (the burned link)', '#3 grid-cell ripple (the usage rows)'],
	neighbours: ['integriq', 'openregister'],
	builtOnApps: ['integriq'],
	hook: {
		title: 'Story 2: Kept by someone else\'s app?',
		caption: 'Kept by\nsomeone else\'s app?',
		ui: { drawUI: () => {}, tagFill: 'cobalt' },
		source: 'Round 25b (Ruben): "Who is content with an external password app or a browser plugin? Can we be sovereign if we don\'t own the key to our own house?" No competitor named: someone else\'s app is a plain outside box.',
		motion: 'Word art, the story\'s turn. The lock glyph lifts out of its cell (the cell left as a dashed outline) and travels on ease.snap up and out of the honeycomb into a plain outside box top right, which pops in to take it; "Kept by" slams in at 150 px, then "someone else\'s app?" at 170 px, "someone else\'s" in orange (the scene\'s one orange). Holds; out: the camera turns back into the honeycomb, to the request.',
		sound: 'A soft whoosh as the lock leaves, a dull thud as the box closes on it, a hard tick per word, a short silence before the question.',
	},
	proofs: [
		{
			id: 'request',
			title: 'Request passwords from partners',
			caption: 'Request passwords\nfrom partners',
			source: 'Round 22b (Ruben: requesting passwords or certificates from other users or other organisations is critical to the process). Spec secret-requests on development: "A user or application can request that a secret be filled in by an external party"; requestable fields, a fill-in link, values encrypted on receipt with the requester\'s public certificate, optional expiry. keepiq.json usp-ask-once-fill-once (verified). Label: NIS2 / Cyberbeveiligingswet and BIO2 are named in Keepiq docs/FEATURES.md and spec compliance-reporting as the credential-hygiene drivers for Dutch government; the film names them as context only and claims no legal requirement.',
			motion: 'Out of the hook the vault turns to a request. The request panel builds on the right, "Password" and "Certificate" ticking mint one a sixteenth, the small "NIS2 · BIO2" label settling top right. On beat 2 the fill-in link runs in block by block and takes the orange ring; a straight wire carries it left into the partner organisation\'s box, where the fill-in page opens and a masked value types itself in (technique #4), then the value runs back along the wire into the vault.',
			sound: 'Ticks on the fields, a whoosh along the wire, key ticks under the dots, a soft lock click as it lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Request passwords\nfrom partners', drawUI: partnerRequestUI, tagFill: 'cobalt' }),
		},
		{
			id: 'once',
			title: 'Links that vanish after one view',
			caption: 'Links that vanish\nafter one view',
			source: 'Round 22b (Ruben: offering a one-time download or view link). Specs ephemeral-send ("The send burns after a configurable number of views (default 1), optionally expires, and can be revoked. Anyone with the link can read it once without an account.") and link-sharing (usage limit, auto-deletion when the limit is reached).',
			motion: 'Hard cut on the beat to "Send by link": the masked value, "Max views" set to 1 inside the orange ring, the expiry, the link. The recipient\'s card opens on the right, the value readable once with a mint pill; on beat 3 the card below fades to its burned state (technique #9, text-swap on a held diagram: only the recipient\'s card changes).',
			sound: 'A click on "1", a pluck as the recipient opens it, a soft dry puff as the link burns.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Links that vanish\nafter one view', drawUI: onceLinkUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Every use: who, when, where, why',
		caption: 'Every use: who,\nwhen, where, why',
		source: 'Ruben, Round 20 (a dashboard of when, where, what for and by whom, person or app, each password was used). Spec secret-audit-trail (every read recorded with timestamp, actor: user, application, system or link visitor, and event type; per-secret activity view, admin audit view with filters). "Where" and "what for" go beyond the fields that spec names today.',
		motion: 'Round 20, the usage dashboard replaces the change log. The hex fill lands as the cobalt ground; the password card drops in on the right (0.35 s, ease.brand) with its uses per day, the bars growing left to right, today\'s in mint. On the next beat the uses table lays in under it; its four small column labels (Who, When, Where, What for) land first, then technique #3, grid-cell ripple as rows: the uses step 20% to 40% to full from the top, each with a person\'s avatar or an app\'s hex (Integriq, OpenRegister), the time, the Nextcloud app it came from and a purpose pill. The newest, by an app, takes the orange ring. The honeycomb field pops in from the bottom edge. Out: the cards step down (0.85, ease.exit) and the app tag travels into Built on Nextcloud.',
		params: {},
		sound: 'Rising ticks as the day bars grow, a soft ripple of ticks per row, a click on the ring.',
	},
	promiseMotion: 'Round 25b: the question becomes a small ownership story in word art (story 1 of 2), the sister of Thematiq\'s. Straight after the opening\'s handover, on its plain field, "Keepiq" sits small as the chapter mark and the words slam in large, one word per sixteenth: "The key to" at 150 px, then "your own house?" at 170 px, "own" in orange (the scene\'s one orange), while a white cell with the lock pops into the field on the right as "key" lands. Holds to four frames before beat 9, then the story turns.',
	promiseSound: 'The body\'s bed enters gently under the story: a soft tick per word, a pluck and a low thud as the lock cell lands.',
}

const film = audienceFilm(content)
// Round 20: the general slot draws the usage dashboard instead of the shared change log.
film.boards.find((b) => b.id === 'general-dataLayer').drawBase = usageFrame
Object.assign(film.boards.find((b) => b.id === 'promise'), { title: 'Story 1: The key to your own house?', drawBase: storyOne })
film.boards.find((b) => b.id === 'hook').drawBase = storyTwo
export const { meta, boards } = film
