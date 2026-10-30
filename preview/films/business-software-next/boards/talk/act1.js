/**
 * Act 0 and 1: the opening sting and the hook. Who writes code, who patched,
 * how was your week, and WordPress's week (Wordfence weekly reports 5 to 18 Oct
 * 2026, Patchstack State of WordPress Security 2026).
 */
import { C } from '../../../_lib/brand.js'
import { hex, honeyAt } from '../../../_lib/ui.js'
import { rand } from '../../../_lib/core.js'
import { ground, eyebrow, headline, body, statRow, strip, board, X, W } from './kit.js'

/**
 * The audience as a honeycomb: lit cells are raised hands. `was` is the share lit in the scene before
 * (the same seed, so its lit cells are a superset): the film turns those cells out. The data-anim hints
 * only steer the film's animation; they draw nothing.
 */
function hands(g, share, seed, was = share) {
	const at = honeyAt(1460, 560, 46, 8)
	const r = rand(seed)
	for (let q = -7; q <= 7; q++) {
		for (let rr = -6; rr <= 6; rr++) {
			const [x, y] = at(q, rr)
			if (x < 980 || x > W - 40 || y < 80 || y > 1040) continue
			const v = r()
			const up = v < share
			const hint = up && was === share ? { 'data-anim': 'light', 'data-off-fill': C.cobalt400, 'data-off-opacity': 0.35 }
				: !up && v < was ? { 'data-anim': 'out', 'data-on-fill': C.white, 'data-on-opacity': 1 } : {}
			hex(g, x, y, 46, up ? C.white : C.cobalt400, 4, { 'fill-opacity': up ? 1 : 0.35, ...hint })
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
	board('who-codes', 'Who here writes code?', {
		words: 'Who here writes code? Hands up.',
		material: 'kinetic type; the audience as a honeycomb, lit cells are raised hands',
		draw(ctx) {
			const { ink, mute } = ground(ctx)
			hands(ctx.g, 0.62, 11)
			headline(ctx.g, 'Who here\nwrites code?', ink)
			body(ctx.g, 'Hands up.', mute, { y: 780 })
		},
	}),
	board('who-patched', 'Keep your hand up if you patched', {
		words: 'Keep your hand up if you patched something last week.',
		material: 'kinetic type; most lit cells go out, a few stay lit',
		draw(ctx) {
			const { ink, mute } = ground(ctx)
			hands(ctx.g, 0.2, 11, 0.62)
			headline(ctx.g, 'Keep it up if\nyou patched\nsomething\nlast week.', ink, { y: 360 })
			body(ctx.g, 'How was your last week?', mute, { y: 880 })
		},
	}),
	board('fun-week', 'Had a fun week?', {
		words: 'Had a fun week? Mine sucked.',
		material: 'kinetic type, a hard cut on "Mine sucked."',
		draw(ctx) {
			const { ink } = ground(ctx)
			headline(ctx.g, 'Had a fun week?', ink, { y: 470, size: 150, wide: true })
			headline(ctx.g, 'Mine *sucked.*', ink, { y: 680, size: 150, wide: true })
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
