/**
 * Act 0 and 1: the opening sting and the hook, to one viewer. Do you write code, did you
 * patch, how was your week, and WordPress's week (Wordfence weekly reports 5 to 18 Oct
 * 2026, Patchstack State of WordPress Security 2026).
 */
import { C } from '../../../_lib/brand.js'
import { el } from '../../../_lib/stage.js'
import { hex, honeyAt } from '../../../_lib/ui.js'
import { rand } from '../../../_lib/core.js'
import { ground, eyebrow, headline, body, statRow, strip, board, X, W } from './kit.js'

/**
 * Everyone who writes code, as a honeycomb; the one orange cell is you, the viewer. `patched` lights
 * that share of the others white (the few who patched last week). `youLights` and `patchLights` add
 * data-anim hints that only steer the film's animation (the cell turns over into its colour); they draw nothing.
 */
const YOU = [0, 0]
function coders(g, { patched = 0, seed = 11, youLights = false, patchLights = false } = {}) {
	const at = honeyAt(1460, 560, 46, 8)
	const r = rand(seed)
	const off = { 'data-off-fill': C.cobalt400, 'data-off-opacity': 0.35 }
	for (let q = -7; q <= 7; q++) {
		for (let rr = -6; rr <= 6; rr++) {
			const [x, y] = at(q, rr)
			if (x < 980 || x > W - 40 || y < 80 || y > 1040) continue
			const lit = r() < patched
			if (q === YOU[0] && rr === YOU[1]) {
				hex(g, x, y, 46, C.orange, 4, youLights ? { 'data-anim': 'light', ...off } : {})
				continue
			}
			hex(g, x, y, 46, lit ? C.white : C.cobalt400, 4, { 'fill-opacity': lit ? 1 : 0.35, ...(lit && patchLights ? { 'data-anim': 'light', ...off } : {}) })
		}
	}
}

export const act1 = [
	board('opening', 'Conduction opening', {
		words: '',
		material: 'fixed brand piece, _lib/scenes/opening.js (three bars), never voiced',
		draw(ctx) {
			const { ink, mute } = ground(ctx)
			eyebrow(ctx.g, 'Fixed brand piece', { y: 470 })
			headline(ctx.g, 'Conduction opening sting', ink, { y: 580, size: 96 })
			body(ctx.g, 'The same three bars in front of every film.', mute, { y: 660 })
		},
	}),
	board('who-codes', 'Do you write code?', {
		words: 'Do you write code?',
		material: 'kinetic type; everyone who writes code as a honeycomb, one cell turns orange: you',
		draw(ctx) {
			const { ink } = ground(ctx)
			coders(ctx.g, { youLights: true })
			headline(ctx.g, 'Do you\nwrite code?', ink)
		},
	}),
	board('who-patched', 'Did you patch something last week?', {
		words: 'Did you patch something last week?',
		material: 'kinetic type; the same honeycomb, you stay orange, a few others light up: the ones who patched',
		draw(ctx) {
			const { ink } = ground(ctx)
			coders(ctx.g, { patched: 0.2, patchLights: true })
			headline(ctx.g, 'Did you patch\nsomething\nlast week?', ink, { y: 400 })
		},
	}),
	board('fun-week', 'How was your week?', {
		words: 'How was your week? Mine sucked.',
		material: 'kinetic type; "How was your week?" alone, then after the silence a hard cut within the card to "Mine sucked."',
		draw(ctx) {
			const { ink } = ground(ctx)
			// The first beat of the card: hidden in the still, shown by the film until the hard cut.
			const before = el('g', { 'data-beat': 'before', display: 'none' }, ctx.g)
			headline(before, 'How was your week?', ink, { y: 580, size: 150, wide: true })
			headline(ctx.g, 'Mine *sucked.*', ink, { y: 580, size: 150, wide: true })
		},
	}),
	board('wordpress-week', 'WordPress had 497 new holes', {
		words: 'WordPress had a worse one. In one week: 497 new vulnerabilities. 176 high or critical. 69 with no fix at all.',
		material: 'counters count up from 0; Wordfence Intelligence weekly report, 12 to 18 Oct 2026',
		draw(ctx) {
			const { ink } = ground(ctx)
			eyebrow(ctx.g, 'Last week · 12 to 18 October 2026 · Wordfence', { y: 200 })
			headline(ctx.g, 'WordPress\'s week was worse.', ink, { y: 330, size: 96, wide: true })
			statRow(ctx.g, [
				{ value: '497', label: 'new vulnerabilities', sub: 'in 327 plugins and 23 themes', accent: true },
				{ value: '176', label: 'high or critical', sub: '19 of them scored 9.8 out of 10' },
				{ value: '69', label: 'with no fix at all', sub: 'no patch when the hole went public' },
			], ink, { y: 640 })
		},
	}),
	board('headlines', 'And then the rest of the week happened', {
		words: 'And then the rest of the week happened. The update itself shipped a backdoor. Stolen keys pushed malware onto patched sites. A million installs, open without a login. And a hole in PHP itself.',
		material: 'four type strips slide in on the beat; no logos, no screenshots of news sites',
		draw(ctx) {
			const { ink } = ground(ctx)
			headline(ctx.g, 'And then the rest\nof the week happened.', ink, { y: 260, size: 96 })
			const rows = [
				['15–16 Oct', 'Rank Math SEO Pro: the update itself shipped a backdoor.'],
				['17–18 Oct', 'UpdraftCentral: stolen keys pushed malware onto patched sites.'],
				['20 Oct', 'Duplicator: over a million installs, open without a login.'],
				['21–22 Oct', 'PHP2Shell: a hole in PHP itself, 74,000 attacks in a day.'],
			]
			rows.forEach(([lead, text], i) => strip(ctx.g, text, { y: 480 + i * 104, lead, fill: i === 0 ? C.cobalt700 : C.cobalt600 }))
		},
	}),
	board('core-vs-ecosystem', 'The core is safe. The ecosystem is not.', {
		words: 'The core had six holes last year. The ecosystem had over eleven thousand. Attackers move in five hours. We cannot expect citizen coders to patch every week. The platform has to do it for them.',
		material: 'counters; Patchstack State of WordPress Security in 2026 (2025 data)',
		draw(ctx) {
			const { ink } = ground(ctx)
			eyebrow(ctx.g, 'WordPress security · 2025 · Patchstack', { y: 200 })
			headline(ctx.g, 'The core is safe.\nThe ecosystem is not.', ink, { y: 320, size: 96 })
			statRow(ctx.g, [
				{ value: '6', label: 'holes in core', sub: 'all of 2025, all low priority' },
				{ value: '11,334', label: 'holes in total', sub: '91% in plugins, almost half unfixed at disclosure', accent: true },
				{ value: '5 hrs', label: 'to the first attack', sub: 'median, for the flaws attackers want most' },
			], ink, { y: 700 })
		},
	}),
]
