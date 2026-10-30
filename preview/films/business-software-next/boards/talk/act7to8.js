/**
 * Act 7 and 8: the store and the close. Section 05 (a platform and a store),
 * the store growing from 600 to 6,000 to 60,000 to no limit, the Buildiq store
 * redrawn, who the store pays, the IP stake, the three questions for the viewer,
 * the final line, then the two fixed brand pieces from _lib/scenes/closing.js.
 */
import { C } from '../../../_lib/brand.js'
import { el, textBlock } from '../../../_lib/stage.js'
import { hex, honeyAt, rect, topbar, nav, panel, bar, button, idlePill } from '../../../_lib/ui.js'
import { rand } from '../../../_lib/core.js'
import { builtOnFrame, installFrame, closingWords } from '../../../_lib/scenes/closing.js'
import { ground, eyebrow, headline, body, bigNumber, strip, cell, board, X, W, MONO } from './kit.js'

/** The two closing pieces as the talk's film plays them: Buildiq is the lead cell, English words. */
const CLOSE = { lead: 'buildiq', lang: 'en' }

/** A honeycomb patch of `rings` rings round (cx, cy); every cell the same weight, no fade. */
function comb(g, cx, cy, r, gap, rings, { fill = C.cobalt400, alpha = 0.6, clip } = {}) {
	const at = honeyAt(cx, cy, r, gap)
	for (let q = -rings; q <= rings; q++) {
		for (let rr = -rings; rr <= rings; rr++) {
			if (Math.max(Math.abs(q), Math.abs(rr), Math.abs(q + rr)) > rings) continue
			const [x, y] = at(q, rr)
			if (clip && (x < clip.x0 || x > clip.x1 || y < clip.y0 || y > clip.y1)) continue
			hex(g, x, y, r, fill, r * 0.1, { 'fill-opacity': alpha })
		}
	}
}

/** Plain copy at a given size: Figtree 600 for a lead line, 500 for a sub line. */
function line(g, text, { x = X, y, size = 40, weight = 500, fill = C.white, maxWidth = 1500, lineHeight = 1.3, anchor = 'start' } = {}) {
	return textBlock(g, text, { x, y, size, weight, fill, lineHeight, tracking: -0.01, maxWidth, anchor, clip: false })
}

/** A card of the store: title and tag in live type, the description greeked, a count line and a button. */
function storeCard(g, x, y, w, h, u, { title, tag, count }) {
	panel(g, x, y, w, h, u)
	const px = x + 12 * u
	textBlock(g, title, { x: px, y: y + 22 * u, size: 11 * u, weight: 700, fill: C.cobalt700, tracking: -0.01, clip: false })
	bar(g, px, y + 31 * u, w * 0.58, 4 * u, C.cobalt400)
	bar(g, px, y + 41 * u, w - 24 * u, 3 * u, C.cobalt200)
	bar(g, px, y + 48 * u, (w - 24 * u) * 0.72, 3 * u, C.cobalt200)
	textBlock(g, count, { x: px, y: y + 63 * u, size: 7.5 * u, weight: 500, family: MONO, fill: C.cobalt300, clip: false })
	textBlock(g, tag.toUpperCase(), { x: px, y: y + 74 * u, size: 6.5 * u, weight: 500, family: MONO, fill: C.cobalt300, tracking: 0.08, clip: false })
	button(g, px, y + h - 24 * u, 62 * u, 16 * u, u, { kind: 'primary', label: 0.6 })
}

/**
 * The Buildiq store, redrawn from /screens BqStore: topbar, the nav rail with
 * Store active, the header with "Install from GitHub", the three kind tabs, the
 * filter chips, and the built-in templates as a card grid. English labels.
 */
function storeWindow(g, x, y, w, h, u) {
	rect(g, x, y, w, h, C.white, 10 * u)
	topbar(g, x, y, w, u)
	const navW = Math.round(w * 0.22)
	const top = y + 24 * u
	nav(g, x, top, navW, h - 24 * u, u, { items: 7, active: 5 })
	// The nav labels, as the board names them: Dashboard, Apps, Schemas, Pages, Versions and exports, Store, My views.
	const labels = ['Dashboard', 'Apps', 'Schemas', 'Pages', 'Versions', 'Store', 'My views']
	let py = top + 10 * u + 19 * u + 9 * u
	labels.forEach((l, i) => {
		const on = i === 5
		// The label replaces the atom's greeked bar: cover the bar with the row's own ground first.
		rect(g, x + 8 * u + 17 * u, py + 3 * u, navW - 16 * u - 23 * u, 10 * u, on ? C.cobalt100 : C.cobalt50)
		textBlock(g, l, { x: x + 8 * u + 18 * u, y: py + 11 * u, size: 7 * u, weight: on ? 700 : 500, fill: on ? C.cobalt700 : C.cobalt400, clip: false })
		py += 21 * u
	})
	// The main column.
	const mx = x + navW + 14 * u
	const mw = w - navW - 28 * u
	let my = top + 16 * u
	textBlock(g, 'Store', { x: mx, y: my + 12 * u, size: 16 * u, weight: 700, fill: C.cobalt700, tracking: -0.02, clip: false })
	button(g, mx + mw - 78 * u, my, 78 * u, 16 * u, u, { kind: 'ghost', label: 0.7 })
	my += 26 * u
	textBlock(g, 'Start from a template that ships with Buildiq, or install an app from GitHub. You always get your own copy to change.', { x: mx, y: my + 6 * u, size: 6.5 * u, weight: 500, fill: C.cobalt400, maxWidth: mw, lineHeight: 1.35, clip: false })
	my += 26 * u
	// The three kinds.
	const kinds = [['Templates', '5'], ['Blocks', '12'], ['Forms', '6']]
	const kw = (mw - 2 * 6 * u) / 3
	kinds.forEach(([k, n], i) => {
		const kx = mx + i * (kw + 6 * u)
		rect(g, kx, my, kw, 18 * u, i === 0 ? C.cobalt : C.cobalt50, 3 * u)
		textBlock(g, k, { x: kx + 8 * u, y: my + 11.5 * u, size: 7 * u, weight: 600, fill: i === 0 ? C.white : C.cobalt700, clip: false })
		textBlock(g, n, { x: kx + kw - 8 * u, y: my + 11.5 * u, size: 7 * u, weight: 500, family: MONO, fill: i === 0 ? C.cobalt200 : C.cobalt300, anchor: 'end', clip: false })
	})
	my += 28 * u
	// The filter chips: All 8, Built in 4, From your organisation 1, On GitHub 3.
	const chips = ['All 8', 'Built in 4', 'From your organisation 1', 'On GitHub 3']
	let cx = mx
	chips.forEach((c, i) => {
		const cw = (c.length * 3.6 + 14) * u
		rect(g, cx, my, cw, 11 * u, i === 0 ? C.cobalt100 : C.white, 5.5 * u, { stroke: C.cobalt100, 'stroke-width': u })
		textBlock(g, c, { x: cx + cw / 2, y: my + 7.5 * u, size: 6 * u, weight: 600, fill: C.cobalt700, anchor: 'middle', clip: false })
		cx += cw + 4 * u
	})
	idlePill(g, mx + mw - 34 * u, my + 5.5 * u, u)
	my += 22 * u
	textBlock(g, 'Built-in templates', { x: mx, y: my + 8 * u, size: 8.5 * u, weight: 700, fill: C.cobalt700, clip: false })
	textBlock(g, 'Ship with Buildiq 0.7.15, plus the templates of your organisation', { x: mx, y: my + 17 * u, size: 6 * u, weight: 500, fill: C.cobalt400, clip: false })
	my += 26 * u
	const cards = [
		{ title: 'Permit tracking', tag: 'Services', count: '4 pages · 2 schemas' },
		{ title: 'Resident consultation', tag: 'Participation', count: '5 pages · 3 schemas' },
		{ title: 'Staff onboarding', tag: 'Operations', count: '4 pages · 3 schemas' },
		{ title: 'Incident reports', tag: 'Field service', count: '3 pages · 2 schemas' },
	]
	const cw = (mw - 8 * u) / 2
	const ch = 106 * u
	cards.forEach((c, i) => storeCard(g, mx + (i % 2) * (cw + 8 * u), my + Math.floor(i / 2) * (ch + 8 * u), cw, ch, u, c))
}

/** A row of three cards with a title and three claims each, on a cobalt ground. */
function threeCards(g, items, { y, h }) {
	const gap = 32
	const w = (W - 2 * X - 2 * gap) / 3
	items.forEach((it, i) => {
		const x = X + i * (w + gap)
		rect(g, x, y, w, h, C.cobalt600, 8)
		eyebrow(g, it.eyebrow, { x: x + 36, y: y + 60, size: 22 })
		textBlock(g, it.title, { x: x + 36, y: y + 122, size: 48, weight: 700, fill: C.white, tracking: -0.02, clip: false })
		it.lines.forEach((l, j) => {
			hex(g, x + 48, y + 182 + j * 80, 9, C.cobalt300, 1)
			textBlock(g, l, { x: x + 76, y: y + 192 + j * 80, size: 28, weight: 500, fill: C.cobalt200, tracking: -0.005, maxWidth: w - 100, clip: false })
		})
	})
}

export const act7to8 = [
	board('section-04', '04 · A platform and a store', {
		words: 'Trust lets them start. The store makes it worth finishing.',
		material: 'section card; the number 04 in mono, the headline rises, the field grows in on the right',
		draw(ctx) {
			const { ink, mute } = ground(ctx)
			comb(ctx.g, 1560, 560, 64, 10, 5, { alpha: 0.22, clip: { x0: 1080, x1: 1990, y0: -80, y1: 1160 } })
			bigNumber(ctx.g, '04', { x: X, y: 330, size: 150, accent: true })
			headline(ctx.g, 'A platform\nand a store.', ink, { y: 520, size: 112 })
			body(ctx.g, 'An app nobody can find helps one organisation. An app in a store helps all of them, and pays the people who made it.', mute, { y: 790, size: 36, maxWidth: 940 })
		},
	}),
	board('store-growth', 'From 600 to 6,000 apps. And why stop there?', {
		words: 'Nextcloud wants to grow its store from 600 to 6,000 apps. WordPress has 60,000 plugins. So why stop there? Ten times more apps will not come from ten times more developers. They come from contributors.',
		material: 'one number morphs step by step, 600 to 6,000 to 60,000 to no limit, on the beat; the honeycomb under it multiplies at each step and runs off the frame at the last',
		note: 'The one orange is the last step, no limit: the answer of the scene ("why stop there?"). 6,000 stays white as Nextcloud\'s stated goal.',
		draw(ctx) {
			const { ink } = ground(ctx)
			eyebrow(ctx.g, 'Nextcloud app store · why stop there?', { y: 180 })
			headline(ctx.g, 'From 600 to 6,000 apps.\nAnd why stop there?', ink, { y: 290, size: 84, wide: true })
			const steps = [
				{ value: '600', label: 'today', rings: 0 },
				{ value: '6,000', label: "Nextcloud's goal", rings: 1 },
				{ value: '60,000', label: 'WordPress plugins today', rings: 2 },
				{ value: '∞', label: 'why stop there?', rings: 5, accent: true },
			]
			const step = (W - 2 * X) / 4
			// IBM Plex Mono advances 0.6 em per character: one size for the row, set by the longest number.
			const size = Math.min(120, Math.floor((step - 110) / (0.6 * 6)))
			steps.forEach((s, i) => {
				const x = X + i * step
				const r = 36
				// One group per step, so the film can morph the number from step to step (draws nothing itself).
				const sg = el('g', { 'data-step': i }, ctx.g)
				comb(sg, x + step / 2 - 50, 820, r, 8, s.rings, { alpha: s.accent ? 0.5 : 0.6, clip: { x0: x - 20, x1: x + step - 70, y0: 660, y1: 1160 } })
				bigNumber(sg, s.value, { x, y: 540, size, fill: ink, accent: s.accent })
				eyebrow(sg, s.label, { x, y: 596, fill: s.accent ? C.orange : C.cobalt200, size: 24 })
				if (i < 3) textBlock(sg, '→', { x: x + step - 56, y: 536, size: 64, weight: 500, family: MONO, fill: C.cobalt300, anchor: 'middle', clip: false })
			})
		},
	}),
	board('store-find', 'Organisations need to find what others already built', {
		words: 'Today a good municipal app stays in a drawer. The next municipality builds it again. Organisations need to find what others already built.',
		material: 'the Buildiq store, redrawn from /screens BqStore (English labels): the camera settles on the template grid; the headline rises on the left',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'light')
			headline(ctx.g, 'Organisations\nneed to *find*\nwhat others\nalready built.', ink, { y: 330, size: 80 })
			body(ctx.g, 'Today a good municipal app stays in a drawer, and the next municipality builds it again.', soft, { y: 720, size: 34, maxWidth: 700 })
			storeWindow(ctx.g, 940, 160, 980, 1000, 2.4)
		},
	}),
	board('who-pays', 'The store pays developers. Who pays the idea?', {
		words: 'A store pays developers. Finally a market for open-source apps. But who pays the idea? The workflow design, the prototype built with AI? There is almost no model. And users are the moat.',
		material: 'three cards slide in left to right, one a beat; the orange is "idea?" in the headline; the strip at the foot comes last',
		draw(ctx) {
			const { ink } = ground(ctx)
			eyebrow(ctx.g, 'The store · get paid', { y: 170 })
			headline(ctx.g, 'The store pays developers. Who pays the *idea?*', ink, { y: 280, size: 80, wide: true })
			threeCards(ctx.g, [
				{ eyebrow: 'A model that works', title: 'The developer', lines: ['Sells, hosts or supports apps', 'Finally a market for open-source apps'] },
				{ eyebrow: 'Almost no model', title: 'The idea', lines: ['A feature idea, a workflow design', 'Often the most valuable part'] },
				{ eyebrow: 'No model either', title: 'The citizen coder', lines: ['A working prototype, built with AI', 'Not traditional code'] },
			], { y: 420, h: 330 })
			strip(ctx.g, 'Users are the moat. If the citizen-developer wave means anything, they need a reason to contribute.', { y: 810, fill: C.cobalt700, size: 30 })
		},
	}),
	board('ip-stake', 'A stake, not a donation', {
		words: 'One idea we are testing. Assign the IP of a feature to the people who submit it, developer or not. A stake, not a donation. The code stays open. This is a test, not a policy. Tell us where it breaks.',
		material: 'white ground; the IP cell lands in the cluster, the three lines rise one by one; the test line comes last in mono',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'white')
			eyebrow(ctx.g, 'One idea we are testing', { y: 180, fill: C.cobalt400 })
			headline(ctx.g, 'A stake, not\na *donation.*', ink, { y: 330, size: 104 })
			body(ctx.g, 'Assign the IP of a contributed feature to the people who submit it, developer or not.', ink, { y: 560, size: 36, maxWidth: 820 })
			const rows = ['A feature idea, a workflow design or an AI-built prototype all count.', 'The contributor holds a stake in what they brought.', 'The software stays open source for everyone.']
			rows.forEach((t, i) => {
				hex(ctx.g, X + 12, 690 + i * 66, 10, C.cobalt, 1)
				line(ctx.g, t, { x: X + 44, y: 700 + i * 66, size: 28, weight: 500, fill: C.cobalt400, maxWidth: 900 })
			})
			eyebrow(ctx.g, 'This is a test, not a policy. Tell us where it breaks.', { y: 912, fill: C.cobalt400, size: 22 })
			// The cluster: the contributor's cell at the heart, the open-source neighbours round it.
			const at = honeyAt(1460, 540, 78, 12)
			for (let q = -3; q <= 3; q++) for (let rr = -3; rr <= 3; rr++) {
				const d = Math.max(Math.abs(q), Math.abs(rr), Math.abs(q + rr))
				if (d === 0 || d > 3) continue
				const [x, y] = at(q, rr)
				if (x < 1040 || x > 1960 || y < 60 || y > 1040) continue
				hex(ctx.g, x, y, 78, d === 1 ? C.cobalt200 : d === 2 ? C.cobalt100 : C.cobalt50, 8)
			}
			cell(ctx.g, 1460, 540, 78, 'IP', { fill: C.cobalt, ink: C.white, size: 48 })
			void soft
		},
	}),
	board('three-questions', 'Now you', {
		words: 'Now you. What really stops them? What would make them try? And is IP the right incentive, or is there a better one?',
		material: 'kinetic type; the three questions rise one a bar, the numbers in mono; the camera holds on the last',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			eyebrow(ctx.g, 'Three questions for you', { y: 180 })
			headline(ctx.g, 'Now *you.*', ink, { y: 330, size: 136, wide: true })
			const qs = [
				['What really stops them?', 'The threshold that keeps a small business owner or civil servant from building their first app on open infrastructure.'],
				['What would make them try?', 'One thing, this year, that gets them over that threshold.'],
				['Is IP the right incentive?', 'Is ownership what makes non-developers contribute, or is there a better one?'],
			]
			qs.forEach(([q, sub], i) => {
				const y = 470 + i * 150
				bigNumber(ctx.g, String(i + 1), { x: X, y: y + 40, size: 88, fill: C.cobalt300 })
				line(ctx.g, q, { x: X + 120, y, size: 46, weight: 700, fill: ink, maxWidth: 1500 })
				line(ctx.g, sub, { x: X + 120, y: y + 50, size: 28, weight: 500, fill: soft, maxWidth: 1500 })
			})
		},
	}),
	board('final-line', 'Thousands of angry citizens. Let\'s empower them.', {
		words: 'The browser got wilded. The web got wilded. Publishing got wilded. Business software is next, if we are willing to do it. We have thousands of angry citizens. Let\'s empower them.',
		material: 'kinetic type, hard cuts on "wilded"; the honeycomb of the opening comes back with most cells lit: everyone empowered; the follow-along line in mono at the foot',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			// The honeycomb of the opening, most cells lit now: everyone empowered.
			const at = honeyAt(1520, 600, 46, 8)
			const r = rand(7)
			for (let q = -6; q <= 6; q++) for (let rr = -6; rr <= 6; rr++) {
				const [x, y] = at(q, rr)
				if (x < 1180 || x > W - 40 || y < 80 || y > 1040) continue
				const up = r() < 0.72
				const hint = up ? { 'data-anim': 'light', 'data-off-fill': C.cobalt400, 'data-off-opacity': 0.35 } : {}
				hex(ctx.g, x, y, 46, up ? C.white : C.cobalt400, 4, { 'fill-opacity': up ? 1 : 0.35, ...hint })
			}
			headline(ctx.g, 'Thousands of\nangry citizens.\nLet\'s *empower*\nthem.', ink, { y: 300, size: 96 })
			body(ctx.g, 'The browser got wilded. The web got wilded. Publishing got wilded. Business software is next, if we are willing to do it.', soft, { y: 760, size: 32, maxWidth: 960 })
			eyebrow(ctx.g, 'Follow along · linkedin.com/in/rubenlinde · @Rubenlinde@fosstodon.org', { y: 912, size: 22 })
		},
	}),
	board('built-on', 'Built on Nextcloud', {
		words: '',
		material: `fixed brand piece, _lib/scenes/closing.js builtOnScene (lead ${CLOSE.lead}, ${CLOSE.lang}), never voiced; on screen: ${closingWords(CLOSE.lang).builtOn.replace(/\n/g, ' / ')}`,
		draw: (ctx) => { builtOnFrame(ctx, CLOSE) },
	}),
	board('install', 'Install it, use it, own it', {
		words: '',
		material: `fixed brand piece, _lib/scenes/closing.js installScene (${CLOSE.lang}), never voiced; on screen: ${closingWords(CLOSE.lang).install.replace(/\n/g, ' / ')}`,
		draw: (ctx) => { installFrame(ctx, CLOSE) },
	}),
]
