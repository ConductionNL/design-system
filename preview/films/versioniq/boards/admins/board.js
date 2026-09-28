/**
 * Versioniq, audience film: the people who run Nextcloud (government, hosting providers,
 * hospitals, schools). Direction C on the app-film template, wrapped by _lib/audiencefilm.js.
 * Round 7: specs and positioning count as built. Positioning:
 * ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   hook     an advisory lands and you see at once whether the branch you run is exposed
 *            (sp-advisory-match, usp-ncsc-nextcloud-advisories verified; spec
 *            security-advisory-correlation)
 *   proof 1  a bad update rolled back in one action (usp-rollback-one-action, verified; specs
 *            version-management, migration-safety)
 *   proof 2  a pinned app stays pinned, drift is flagged (usp-pin-with-drift-alert, verified;
 *            spec version-pinning)
 *   general  notifications: users hear what is about to change, in their own language
 *            (usp-advance-notice-language, verified; spec changelog-visibility)
 *   promise  "Every app on your chosen version" (Round 18 copy pass)
 *
 * No fleet claim across many instances (not in the specs).
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the advisory check running down the
 * app list), #6 hard diagonal wipe (the rollback, on the beat), #9 text-swap on a held
 * diagram (the pin list holds while the drift is flagged).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button, toggle } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves, read as the system at work.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A flat diagonal wipe across the frame in 0.2 s, on the beat.' },
]

/** The installed apps: hex, name, the version pill. Returns the row centres. */
function appRows(w, x, top, width, u, n, { from = 0 } = {}) {
	const ys = []
	for (let r = 0; r < n; r++) {
		const cy = top + r * 70
		if (r > 0) rect(w, x + 20, cy - 35, width - 40, u, C.cobalt50)
		hex(w, x + 50, cy, 16, C.cobalt, 2)
		bar(w, x + 84, cy - 5, 140 - ((r + from) % 3) * 24, 10, C.cobalt900)
		rect(w, x + 300, cy - 15, 88, 30, C.cobalt50, 15)
		bar(w, x + 316, cy - 4, 56, 8, C.cobalt700)
		ys.push(cy)
	}
	return ys
}

/** Hook: the advisory, matched to the exact branch it hits; every other app checked clean. */
function advisoryUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The advisory card: a published notice, its affected branch.
	rect(w, x + 64, top, width - 64, 110, C.lavender300, 4 * u)
	hex(w, x + 104, top + 55, 18, C.lavender, 2)
	bar(w, x + 140, top + 36, 260, 14, C.cobalt900)
	bar(w, x + 140, top + 64, 160, 9, C.cobalt700)
	panel(w, x, top + 134, width, 490, u)
	const ys = appRows(w, x, top + 184, width, u, 7)
	ys.forEach((cy, r) => { if (r === 3) rect(w, x + width - 170, cy - 15, 120, 30, C.lavender300, 15); else statusPill(w, x + width - 160, cy, u) })
	// The straight line from the advisory to the one branch it hits, and that row ringed.
	const hit = ys[3]
	rect(w, x + width - 110 - u, top + 110, 2 * u, hit - 15 - top - 110, C.cobalt300)
	rect(w, x + 12, hit - 32, width - 24, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the app's version history; the bad update on top, one action back to the last clean install. */
function rollbackUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	hex(w, x + 104, top + 50, 20, C.cobalt, 2)
	bar(w, x + 140, top + 38, 220, 16, C.cobalt900)
	// The versions down a spine: the top one is the bad update, the next the last clean install.
	const sx = x + 100
	rect(w, sx - u, top + 130, 2 * u, 400, C.cobalt200)
	for (let i = 0; i < 5; i++) {
		const cy = top + 150 + i * 90
		circle(w, sx, cy, 12, i === 0 ? C.cobalt400 : i === 1 ? C.mint : C.cobalt200)
		bar(w, sx + 36, cy - 12, 90, 11, C.cobalt900)
		bar(w, sx + 36, cy + 8, 150, 7, C.cobalt300)
		if (i === 1) statusPill(w, sx + 230, cy, u)
	}
	// The one action: roll back (ringed, the scene's one orange), and what the downgrade would leave behind (none).
	button(w, x + width - 300, top + 126, 240, 50, u, { kind: 'accent', label: 0.5 })
	panel(w, x + width - 300, top + 200, 240, 120, u, { fill: C.cobalt50 })
	bar(w, x + width - 280, top + 226, 120, 8, C.cobalt400)
	statusPill(w, x + width - 280, top + 280, u)
}

/** Proof 2: pinned apps, one drifted: flagged, with restore one action away. */
function pinUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	;[x + 30, x + 300, x + width - 250].forEach((hx) => bar(w, hx, top + 30, 80, 8, C.cobalt400))
	const ys = appRows(w, x, top + 94, width, u, 7, { from: 1 })
	ys.forEach((cy, r) => {
		toggle(w, x + width - 250, cy, u, r !== 5)
		if (r === 2) {
			// Drifted: pinned version and the one it runs now, flagged, with restore.
			hex(w, x + 440, cy, 12, C.lavender, 2)
			rect(w, x + 470, cy - 15, 88, 30, C.lavender300, 15)
			button(w, x + width - 160, cy - 20, 120, 40, u, { kind: 'primary', label: 0.5 })
		} else idlePill(w, x + width - 160, cy, u, { w: 30 })
	})
	rect(w, x + 12, ys[2] - 32, width - 24, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'versioniq',
	audience: { slug: 'admins', name: 'Nextcloud admins', persona: 'Willem Dekker, CISO at a municipality; Femke Jansen, Nextcloud service manager at a hosting provider; Marieke Vos, IT-beheerder at a hospital; Bas Willemsen, ICT-beheerder at a school board' },
	promise: 'Every app on\nyour chosen version',
	promiseLine: 'Every app on the version you choose: advisories matched to what you run, a bad update undone in one action, pins that hold',
	title: 'Versioniq for Nextcloud admins',
	record: { one: 'app', many: 'apps' },
	logline: 'For whoever runs Nextcloud: an advisory lands and you see whether your branch is exposed, a bad update rolls back in one action, and a pinned app stays pinned with drift flagged. Your users hear what is about to change, in their own language.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the advisory check)', '#6 hard diagonal wipe (the rollback)', '#9 text-swap on a held diagram (the pin list)'],
	neighbours: [],
	builtOnApps: [],
	hook: {
		title: 'Security advisory? See what it hits',
		caption: 'Security advisory?\nSee what it hits',
		ui: { drawUI: advisoryUI, tagFill: 'cobalt' },
		source: 'positioning versioniq usp-ncsc-nextcloud-advisories (verified): "Advisories are matched to the exact branch an app runs, not just its name."; sp-advisory-match; spec security-advisory-correlation',
		motion: 'Out of the promise the app cell stays on the loop anchor and the window builds round it; the frame reads: caption, the advisory card over the installed apps, the Versioniq hex (cobalt) on the loop anchor. Technique #3, grid-cell ripple: the check runs down the list, each row stepping 20% to full and its mint pill popping; on the fourth row the pill turns lavender, the straight line drops from the advisory to it and the row takes the orange ring.',
		sound: 'Gentle open. A ripple of ticks down the list, a low tick on the match.',
	},
	proofs: [
		{
			id: 'rollback',
			title: 'Bad update? One action back',
			caption: 'Bad update?\nOne action back',
			source: 'positioning versioniq usp-rollback-one-action (verified): "One action rolls an app back to its last cleanly finished install."; usp-downgrade-migration-safe; specs version-management, migration-safety',
			motion: 'Technique #6, hard diagonal wipe: a flat cobalt-900 band crosses the frame in 0.2 s on the beat and the version history is there. The roll back button is pressed (ring closes, the one orange); the top version fades to cobalt-400, the mint dot on the last clean install pulses once, and the side panel confirms nothing is left behind.',
			sound: 'A hard swish on the wipe, a dry click on the press, a soft settle.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Bad update?\nOne action back', drawUI: rollbackUI, tagFill: 'cobalt' }),
		},
		{
			id: 'pin',
			title: 'Pins hold, drift gets flagged',
			caption: 'Pins hold,\ndrift gets flagged',
			source: 'positioning versioniq usp-pin-with-drift-alert (verified): "A drifted pin gets flagged and restoring it takes one action."; sp-pin-unpin; spec version-pinning',
			motion: 'Hard cut to the pinned apps, toggles on. Technique #9: the list holds still; only the third row changes: its version pill turns lavender with the flag hex, the restore button slides in and the row takes the orange ring. Nothing else moves while the caption reads.',
			sound: 'A low tick on the flag, then quiet under the hold.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Pins hold,\ndrift gets flagged', drawUI: pinUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Change coming? Your users hear first',
		caption: 'Change coming?\nYour users hear first',
		source: 'positioning versioniq usp-advance-notice-language (verified): "People using an app hear what is about to change, in their own language."; spec changelog-visibility; story.json mechanic 8',
		motion: 'The app\'s record reaches its "update scheduled" stage; the notice drops to the users before the update runs, in two languages side by side (the notice rows stacked).',
		params: {
			record: { avatar: 'square', title: 230, sub: 150, status: 'idle' },
			event: { stage: 1, stages: 3 },
			notices: [{ app: 'versioniq' }, { icon: 'nc-mail' }],
			recipients: [C.cobalt300, C.lavender300],
		},
		sound: 'A low tick as the update is scheduled, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
