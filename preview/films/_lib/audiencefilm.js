/**
 * The audience film: one app told to one audience (Round 7, Ruben, 2026-09-28). The
 * app-film template (appfilm.js, direction C "proof") is the body; the shared modules
 * sit round it, so every audience film has the same modular shape:
 *
 *   opening   BRAND    the shared Conduction opening, 3 bars (_lib/scenes/opening.js)
 *   hook      APP      proof moment 1, legible on frame 1 of the body
 *   proof x2  APP      proof moments 2 and 3
 *   general   GENERAL  one shared capability, filled with this audience's content
 *   promise   BRAND    the app's cell lands in the honeycomb round Nextcloud; the app
 *                      name and the film's ONE promise in the type column. It replaces
 *                      the template's outro: the install call is said once, on the
 *                      shared install board, not twice
 *   builtOn   BRAND    the shared closing piece as "Built on Nextcloud" (Round 10: no ConNext in
 *                      app and audience films), 2 bars, this app on top
 *   install   BRAND    the shared install board, 3 bars
 *
 * Opening 3 + body 10 + built on 2 + install 3 = 18 bars, 33.75 s at 128 BPM, 24 fps.
 * The body keeps the template's slot plan and reading budget; only the times shift by
 * the opening's 5.625 s.
 *
 *   export const { meta, boards } = audienceFilm({ ...appFilmContent, audience, promise, techniques })
 */
import { textBlock } from './stage.js'
import { SQRT3 } from './core.js'
import { C } from './brand.js'
import { APP_NAMES } from './assets.js'
import { appBoards, appMeta, wordBudget, wordCount, holdFor, BAR, DURATION as BODY } from './appfilm.js'
import { LOOP_ANCHOR } from './scenes/general.js'
import { chrome, workspaceCluster, CORNERS } from './ui.js'
import { buildOpening, OPENING } from './scenes/opening.js'
import { builtOnFrame, installFrame, INSTALL, CLOSING } from './scenes/closing.js'

export const OPEN = OPENING.duration // 5.625 s, 3 bars
export const BUILT = 2 * BAR
export const INSTALL_DUR = 3 * BAR
export const TOTAL = OPEN + BODY + BUILT + INSTALL_DUR // 33.75 s, 18 bars

const s2 = (t) => `${t.toFixed(2)} s`
const barOf = (t) => Math.round(t / BAR) + 1
/** bar.beat of a film time, as the plan labels it (1-based). */
const bb = (t) => { const k = Math.round(t / (BAR / 4)); return `${Math.floor(k / 4) + 1}.${(k % 4) + 1}` }

/**
 * The promise card: the template's outro cluster (the app cell up-left of the
 * Nextcloud workspace hex, on LOOP_ANCHOR, orange: the app icon exception on
 * cobalt), with the app's name as the chapter mark and the promise as the caption.
 * White type only: the orange is the app cell.
 */
export function promiseFrame(ctx, { app, promise, neighbours = [] }) {
	const g = ctx.g
	chrome(ctx, { text: promise, app })
	const r = 80, gap = 8
	const s = r + gap / SQRT3
	const cx = LOOP_ANCHOR.x + 1.5 * SQRT3 * s
	const cy = LOOP_ANCHOR.y + 1.5 * s
	const n = Math.min(neighbours.length, 4)
	const slots = [[], [CORNERS.se], [CORNERS.ne, CORNERS.s], [CORNERS.ne, CORNERS.se, CORNERS.sw], [CORNERS.ne, CORNERS.se, CORNERS.s, CORNERS.sw]][n]
	const ring = [{ ...CORNERS.nw, id: app, fill: C.orange, glyph: C.white }, ...neighbours.slice(0, n).map((id, i) => ({ ...slots[i], id }))]
	workspaceCluster(g, cx, cy, r, gap, { ring, open: [], fieldTop: -Infinity, fieldScale: 0.5, W: ctx.W, H: ctx.H })
	return { textBlock }
}

/** Every board of an audience film, with film times, layers and modules. */
export function audienceBoards(content) {
	const { app, promise, neighbours = [], builtOnApps = [] } = content
	const name = content.name || APP_NAMES[app] || app
	const body = appBoards({ ...content, outro: { neighbours } })
	const shift = (b) => ({ ...b, start: b.start + OPEN, end: b.end + OPEN, shows: b.shows + OPEN, clears: b.clears + OPEN })
	const boards = body.map(shift)

	// The template's outro becomes the promise.
	const last = boards[boards.length - 1]
	const promiseClears = OPEN + BODY - 0.16
	boards[boards.length - 1] = {
		...last,
		id: 'promise',
		module: 'promise',
		title: `${name}: the promise`,
		words: `${name}\n${promise}`,
		clears: promiseClears,
		hold: +(promiseClears - last.shows).toFixed(2),
		motion: content.promiseMotion || `On ${s2(last.start)} (bar ${barOf(last.start)}) the app tag from the general scene lifts off its card and lands in its cell up-left of the Nextcloud hex, on the loop anchor, and turns orange (the app icon exception on cobalt); the neighbour cells lock in white and the Nextcloud workspace hex lands at 1.4x and settles to 1.0 a beat later, the field popping outward ring by ring on 16ths. "${name}" sits as the chapter mark; the promise rises under it in a quick stagger (every word in by ${s2(last.shows)}) and holds to ${s2(promiseClears)}. Out on the bar line: the cells step toward the Nextcloud hex, which the Built on piece picks up as its ground, no cut.`,
		sound: content.promiseSound || 'A pluck as the app cell lands, a low thud under the Nextcloud hex, a soft pad swell under the promise. A crisp click on the bar line into Built on.',
		draw: (ctx) => promiseFrame(ctx, { app, promise, neighbours }),
	}

	const opening = {
		id: 'opening',
		layer: 'brand',
		module: 'opening',
		title: 'Conduction opening (shared module)',
		start: 0,
		end: OPEN,
		bars: '1.1-3.4',
		words: '',
		apps: ['openregister'],
		motion: `The shared opening as it is (_lib/scenes/opening.js addOpening, 3 bars, ${s2(OPEN)}): the hex canvas, the ripple to the app cluster, the ripple that steps them off, the company name, the dry click. It hands over on a plain field; the body's hook frame builds on the next downbeat.`,
		sound: 'The opening\'s own: hum, crackle, arcs, sparks, power-on ending on a dry click. The body\'s bed enters with the hook.',
		source: 'Shared module, no claim.',
		draw(ctx) {
			const up = buildOpening(ctx.g, { defs: ctx.defs })
			const k = OPENING.T.powerOn + 0.9
			up(k)
			return () => up(k)
		},
	}
	const t0 = OPEN + BODY
	const built = {
		id: 'builtOn',
		layer: 'brand',
		module: 'builtOn',
		title: 'Built on Nextcloud (shared closing piece)',
		start: t0,
		end: t0 + BUILT,
		bars: `${barOf(t0)}.1-${barOf(t0) + 1}.4`,
		words: 'Built on\nNextcloud',
		apps: ['nextcloud', 'openregister', app, ...builtOnApps],
		motion: `The shared piece (_lib/scenes/closing.js builtOnScene, on: 'nextcloud'; Round 10): Nextcloud lands low right, the data layer drops onto it, "Built on" rises with "Nextcloud" a sixteenth behind and the white Nextcloud mark above them, the Nextcloud apps pop in round it one a sixteenth, and on its second bar ${name} lands on top in orange${builtOnApps.length ? `, with ${builtOnApps.map((a) => APP_NAMES[a] || a).join(' and ')} beside it in white` : ''}. Everything general (data layer, notifications, flows, the assistant) is told here, not in the body.`,
		sound: 'Thuds as Nextcloud and the data layer land, a run of ticks as the apps pop in, a pluck as the top row lands.',
		source: 'Shared module: round4/facts.json fact a.',
		draw: (ctx) => { builtOnFrame(ctx, { app, apps: builtOnApps, on: 'nextcloud' }) },
	}
	const t1 = t0 + BUILT
	const install = {
		id: 'install',
		layer: 'brand',
		module: 'install',
		title: 'Install the app, use the app, own your data (shared install board)',
		start: t1,
		end: t1 + INSTALL_DUR,
		bars: `${barOf(t1)}.1-${barOf(t1) + 2}.4`,
		words: `${INSTALL.slogans.join('\n')}\n${INSTALL.line}`,
		apps: ['conduction'],
		motion: 'The shared install board as it is (_lib/scenes/closing.js installScene): the Nextcloud cell travels to the corner and turns over into the Conduction avatar, the wordmark header, the three slogans ("Install the app" in orange), then the open-source line. Holds to the end, no fade.',
		sound: 'A dry click as the cell turns, a click and a low impact on "Install the app", ticks on the next two, the pad resolves.',
		source: 'Shared module: INSTALL.sources in closing.js.',
		draw: (ctx) => { installFrame(ctx, {}) },
	}
	// Round 15 (Ruben, 2026-09-28): every product film opens its body with the PROMISE right
	// after the Conduction opening, then the proofs. The promise keeps its slot length and its
	// reading offsets; the hook, proofs and general slot follow it, shifted by that length.
	const pr = boards.pop()
	const pDur = pr.end - pr.start
	const promiseFirst = {
		...pr,
		start: OPEN,
		end: OPEN + pDur,
		bars: `${bb(OPEN)}-${bb(OPEN + pDur - BAR / 4)}`,
		shows: +(OPEN + (pr.shows - pr.start)).toFixed(3),
		clears: +(OPEN + (pr.clears - pr.start)).toFixed(3),
		motion: content.promiseMotion || `On ${s2(OPEN)} (bar ${barOf(OPEN)}), straight out of the opening's plain field: the app cell lands up-left of the Nextcloud workspace hex, on the loop anchor, orange (the app icon exception on cobalt); the neighbour cells lock in white and the Nextcloud hex lands at 1.4x and settles to 1.0 a beat later, the field popping outward ring by ring on 16ths. "${name}" sits as the chapter mark; the promise rises under it in a quick stagger and holds to ${s2(OPEN + (pr.clears - pr.start))}. Out on the bar line: the honeycomb steps away and the app window builds round the app cell, which stays on the loop anchor and becomes the hook's app tag (match cut, no cut).`,
		sound: content.promiseSound || 'A pluck as the app cell lands, a low thud under the Nextcloud hex, a soft pad swell under the promise. The body\'s bed enters here, straight after the opening\'s click.',
	}
	const later = (b) => ({ ...b, start: b.start + pDur, end: b.end + pDur, shows: b.shows + pDur, clears: b.clears + pDur, bars: `${bb(b.start + pDur)}-${bb(b.end + pDur - BAR / 4)}` })
	return [opening, promiseFirst, ...boards.map(later), built, install]
}

/** The word budget of the body (hook to promise; the bible's 20 to 30), with the shared modules listed apart. */
export function audienceBudget(boards) {
	const body = boards.filter((b) => !['opening', 'builtOn', 'install'].includes(b.module))
	const rows = body.map((b) => {
		const words = wordCount(b.words)
		const card = b.id === 'promise' ? wordCount((b.words || '').split('\n').slice(1).join(' ')) : words
		const need = holdFor(card)
		const lines = (b.words || '').split('\n').filter(Boolean).length
		const issues = []
		if (card > 8) issues.push(`${card} words on one card (max 8)`)
		if (b.id !== 'promise' && lines > 2) issues.push(`${lines} lines (max 2)`)
		if (b.id !== 'promise' && b.maxWords && words > b.maxWords) issues.push(`${words} words in a slot that holds ${b.maxWords}`)
		if (b.hold + 1e-6 < need) issues.push(`holds ${b.hold} s, needs ${need.toFixed(2)} s`)
		if (/[.]\s*$/m.test(b.words || '')) issues.push('a line ends in a full stop')
		if (/[—–]|--/.test(b.words || '')) issues.push('a dash')
		return { id: b.id, words, hold: b.hold, need: +need.toFixed(2), issues }
	})
	const total = rows.reduce((a, r) => a + r.words, 0)
	const filmIssues = total < 20 || total > 30 ? [`${total} words in the body (bible: 20 to 30)`] : []
	return { total, ok: !filmIssues.length && rows.every((r) => !r.issues.length), filmIssues, rows }
}

/** export const { meta, boards } = audienceFilm(content) */
export function audienceFilm(content) {
	const boards = audienceBoards(content)
	const meta = {
		...appMeta(content),
		id: `${content.app}-${content.audience.slug}`,
		audience: content.audience,
		promise: content.promiseLine || content.promise,
		techniques: content.techniques || [],
		duration: TOTAL,
		budget: audienceBudget(boards),
	}
	return { meta, boards }
}

export { wordBudget }
