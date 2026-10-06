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
import { textBlock, measure } from './stage.js'
import { SQRT3 } from './core.js'
import { C } from './brand.js'
import { APP_NAMES } from './assets.js'
import { appBoards, appMeta, wordBudget, wordCount, holdFor, BAR, SPB, SIXTEENTH, RISE, CLEAR, FPS, snap, beatT, barBeat, PLANS, DURATION as BODY } from './appfilm.js'
import { LOOP_ANCHOR, MOTION } from './scenes/general.js'
import { chrome, workspaceCluster, CORNERS, clearFieldUnder } from './ui.js'
import { buildOpening, OPENING } from './scenes/opening.js'
import { builtOnFrame, installFrame, INSTALL, CLOSING, BUILT_ON_DUR, INSTALL_DUR as INSTALL21_DUR, closingWords } from './scenes/closing.js'
import { TRANSITIONS, describe } from './transitions.js'

export const OPEN = OPENING.duration // 5.625 s, 3 bars
// Round 21: the new Built on piece is 3 bars, the install board 3 bars.
export const BUILT = BUILT_ON_DUR
export const INSTALL_DUR = INSTALL21_DUR
export const TOTAL = OPEN + BODY + BUILT + INSTALL_DUR // 33.75 s, 18 bars, for a 10-bar body
/** The body length for a film with n proofs: 18.75 s on the 10-bar plans, 22.5 s on the 12-bar plan. */
export const bodyLength = (n) => beatT(PLANS[n].at(-1).to)

const s2 = (t) => `${t.toFixed(2)} s`

/** Round 15: the promise opens the body, 9 beats (the outro's length), and every other slot moves 9 beats later. */
export const PROMISE_BEATS = 9
/** The promise's words start rising 2 frames after the opening's handover and build one word per sixteenth. */
export const PROMISE_LEAD = 2 / FPS
/** How every 10-bar body ends (Round 15, the same in every film, as in the tk, l1 and l2 clones). */
export const BODY_END = 'Body end (Round 15, the same in every film): this last proof holds its caption to four frames before the bar line and no card follows. On the bar line its cards step down and the app tag lifts off and travels into Built on Nextcloud, where the app name returns in its own cell.'
/** The Built on piece picks the tag up (Round 15). */
export const BUILT_IN = 'In (Round 15): the app tag from the body\'s last proof travels in over the step-down and settles in the app\'s own cell, so the app name returns without a card of its own.'
const barOf = (t) => Math.round(t / BAR) + 1

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
	const BODY = bodyLength((content.proofs || []).length)
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
		motion: content.promiseMotion || `On ${s2(last.start)} (bar ${barOf(last.start)}) the app tag from the general scene lifts off its card and lands in its cell up-left of the Nextcloud hex, on the loop anchor, and turns orange (the app icon exception on cobalt); the neighbour cells flip in white and the Nextcloud workspace hex flips in a beat later (every hex turns over by squashing, never pops or scales in: Round 27), the field flipping in outward ring by ring on 16ths. "${name}" sits as the chapter mark; the promise rises under it in a quick stagger (every word in by ${s2(last.shows)}) and holds to ${s2(promiseClears)}. Out on the bar line: the cells step toward the Nextcloud hex, which the Built on piece picks up as its ground, no cut.`,
		sound: content.promiseSound || 'A pluck as the app cell lands, a low thud under the Nextcloud hex, a soft pad swell under the promise. A crisp click on the bar line into Built on.',
		draw: (ctx) => promiseFrame(ctx, { app, promise, neighbours }),
	}

	// Round 15, the default for every 10-bar audience film (matching the tk, l1 and l2 clones): the
	// promise opens the body (9 beats), hook, proofs and the general scene follow 9 beats later, and
	// the body ends on the general scene; the app name returns in Built on (BODY_END, BUILT_IN).
	if (!content.promiseFirst) {
		const pr = boards.pop()
		const beatOf = (t) => Math.round((t - OPEN) / SPB)
		const timed = (b, from, to, shows) => {
			const start = OPEN + beatT(from), end = OPEN + beatT(to)
			const clears = OPEN + snap(beatT(to) - CLEAR)
			return { ...b, start, end, bars: `${barBeat(from + 12)}-${barBeat(to - 1 + 12)}`, shows, clears, hold: +(clears - shows).toFixed(2) }
		}
		const promiseWords = wordCount(promise)
		const pb = timed(pr, 0, PROMISE_BEATS, OPEN + snap(PROMISE_LEAD + RISE + (promiseWords - 1) * SIXTEENTH))
		const P = { from: s2(OPEN), shows: s2(pb.shows), clears: s2(pb.clears), out: s2(pb.end) }
		pb.motion = content.promiseMotion || `Round 15, the body opens here. On ${P.from}, straight after the opening's handover on its plain field, the app cell lands up-left of the Nextcloud hex, on the loop anchor, and turns orange (the app icon exception on cobalt); the neighbour cells flip in white and the Nextcloud workspace hex flips in a beat later (every hex turns over by squashing, never pops or scales in: Round 27), the field flipping in outward ring by ring on 16ths. "${name}" sits as the chapter mark; the promise, asked as a "What if ...?" question (Round 19: no answer card, the proofs answer it), rises under it from two frames after the handover, one word per sixteenth (every word in by ${P.shows}), and holds to ${P.clears}. Out on ${P.out}: the field, the neighbours and the Nextcloud hex step out on 16ths and the app cell shrinks in place on the loop anchor to the hook's tag (turning cobalt when the hook's tag is cobalt) while the hook's window lays in behind it.`
		pb.sound = content.promiseSound || 'The body\'s bed enters gently under the promise (pad and offbeat bass, no stinger): a pluck as the app cell lands, a low thud under the Nextcloud hex. A short whoosh as the cluster steps out into the hook.'
		const rest = boards.map((b) => {
			const from = beatOf(b.start) + PROMISE_BEATS, to = beatOf(b.end) + PROMISE_BEATS
			const r = timed(b, from, to, OPEN + snap(beatT(from) + RISE))
			if (b.id === 'hook') {
				// No longer frame 1 of the body: it comes in behind the app cell the promise leaves on the loop anchor.
				r.motion = (content.hook?.motion || MOTION.hook({ from, to })).replace(/Frame 1 is (this key frame exactly|this frame)/, 'In behind the app hex the promise leaves on the loop anchor, the key frame is exactly this').replace(/\s*Frame 1 reads:/, ' In behind the app hex the promise leaves on the loop anchor:')
				if (!content.hook?.sound) r.sound = 'A soft pluck as the push starts; a tick on the cell that becomes the hex; whoosh under the fill.'
			}
			if (b === boards[boards.length - 1]) {
				// The body ends here (BODY_END): the hand-off to the outro cluster is replaced.
				const base = (b.motion || '').replace(/ Out on [^:]*: (?:(?!\. ).)*?outro cluster.*?\./, '').replace(/ Out: the (cards?|canvas) steps? down and the app tag (lifts off the record and )?travels to its cell in the (outro|promise) cluster\.?/, '')
				r.motion = `${base} ${BODY_END}`
			}
			return r
		})
		boards.splice(0, boards.length, pb, ...rest)
	}

	// Round 15 (Ruben): a product film opens its body on the promise, straight after the opening's
	// handover, and the proofs follow. The promise and the first proof take 8 beats each (the
	// template's 7 + 9), so the body keeps its length; every caption keeps its rise and clear.
	if (content.promiseFirst) {
		const pr = boards.pop()
		boards.unshift(pr)
		const beatsOf = (b, i) => Math.round((b.end - b.start) / SPB)
		const lens = boards.map(beatsOf)
		const total = lens.reduce((a, v) => a + v, 0)
		lens[0] = 8
		lens[1] = total - 8 - lens.slice(2).reduce((a, v) => a + v, 0)
		let beat = 0
		boards.forEach((b, i) => {
			const start = OPEN + beatT(beat), end = OPEN + beatT(beat + lens[i])
			const shows = start + 0.24, clears = end - 0.16
			Object.assign(b, { start, end, shows, clears, hold: +(clears - shows).toFixed(2), bars: `${barBeat(beat + 12)}-${barBeat(beat + lens[i] - 1 + 12)}` })
			beat += lens[i]
		})
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
		bars: `${barOf(t0)}.1-${barOf(t0) + Math.round(BUILT / BAR) - 1}.4`,
		words: closingWords('en').builtOn,
		apps: ['nextcloud', 'openregister', app, ...builtOnApps],
		motion: `${content.builtOnMotion || `Round 27 (_lib/scenes/closing.js builtOnScene, 4 bars): ${name} flips in orange (every hex turns over by squashing; nothing pops or scales in); "Built on" and "Nextcloud" rise under the white Nextcloud mark, no name label by the cell. Nine Nextcloud apps flip in one a beat, in Nextcloud blue, round ${name} on the ring two out, open to the right: a C, the Conduction C, with ${name} at its heart; each gets a line drawn on FROM ${name} out to it, a Nextcloud-cyan head riding the line's front. The line under the headline names two of them, each held its reading time ("Reply from Mail", then "Share in Files", the name in Nextcloud cyan). A beat before bar 4 it becomes "Enhanced by Conduction"; on bar 4 the camera pulls back over two beats and the Conduction family flips in as a hexagonal ring round the C (the ring three out), each linked to its nearest cell, ${name} still the one orange. On the last beat the camera comes back in while every cell turns over, ring by ring from ${name}: they become the install board's quiet field and ${name} turns over into the Conduction avatar. The type leaves four frames before the bar line. Every hex is one grid cell at one radius.`}${content.promiseFirst ? '' : ` ${BUILT_IN}`}`,
		sound: 'A dry click and a low thud as the lead flips in, a tick up the scale for each app that loads, a long whoosh and a scatter of ticks as the family comes into view, a pluck on Enhanced by Conduction, a whoosh and soft ticks as the cells turn over, a dry click as the lead becomes the avatar.',
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
		words: closingWords('en').install,
		apps: ['conduction'],
		motion: 'Transition in (Round 27b): Built on\'s cells have turned over into this board\'s quiet field, top right, and its lead into the Conduction avatar, one grid cell at the grid radius; nothing pops in. The type is clear for eight frames. Round 22/27b (_lib/scenes/closing.js installScene, concept current, no wire, 3 bars): "Install it", "Use it" and "Own it" rise out of their lines one a beat, the orange moving to each and landing on "Own it". Then "The code stays open source, the data stays yours" rises on two lines and holds to the end. No header.',
		sound: 'A dry click as each word rises, a low thud under "Own it", a pluck on the line, the pad resolves.',
		source: 'Shared module: INSTALL.sources in closing.js.',
		draw: (ctx) => { installFrame(ctx, {}) },
	}
	withSections(boards, content)
	withTransitions(boards, content)
	withCurrent(boards, content)
	return [opening, ...boards, built, install]
}

/**
 * Round 27c: the small mark above each caption is the scene's SECTION TITLE, not the app name.
 * content.sections = { <board id>: 'Standards' } (sentence case, one or two words). A board without one
 * falls back to its shared module's section (SECTION_DEFAULTS), then to the audience's name; never the
 * app name. The mark keeps its place, size and weight; only its words change.
 */
export const SECTION_DEFAULTS = { dataLayer: 'Audit trail', notify: 'Notifications', flows: 'Automation', ai: 'Assistant' }
export function sectionOf(b, content) {
	return content.sections?.[b.id] || SECTION_DEFAULTS[b.module] || content.audience?.name || 'Overview'
}
function withSections(boards, content) {
	boards.forEach((b) => {
		b.section = sectionOf(b, content)
		const draw = b.draw
		b.draw = (ctx) => {
			const up = draw(ctx)
			const m = ctx.g.querySelector('[data-role=mark]')
			if (m) {
				const nodes = [...m.querySelectorAll('text')]
				if (nodes.length) { nodes[0].textContent = b.section; nodes.slice(1).forEach((n) => n.remove()) }
				// From the tk lane (Keepiq): a long section title is fitted to 740 px (inside the safe box and
				// 80 px clear of the app window at x 940); a short one keeps its size.
				if (nodes.length) {
					const size = +nodes[0].getAttribute('font-size') || 58
					const w = measure(b.section, { size, weight: 700, tracking: -0.02 })
					if (w > 740) nodes[0].setAttribute('font-size', Math.floor((size * 740) / w))
				}
			}
			// Round 27c: no hex floats over the field; on the first visible frame, the field cells under a tag go.
			let cleared = false
			return (t) => {
				if (typeof up === 'function') up(t)
				if (cleared || ctx.g.getAttribute('display') === 'none') return
				cleared = true
				clearFieldUnder(ctx.g)
			}
		}
	})
}

/**
 * Round 26: a designed hand-off into a body board. content.transitions = { <board id>: { type, from, to,
 * fromName, toName, note } } (type: one of transitions.js TRANSITIONS; from/to: optional stage-px anchors).
 * A board that names one carries it as b.transition and gets "Transition in: ..." at the head of its
 * director notes. A board that names none gets the fallback, the hex flip wave (Round 28: no wire).
 * The promise, the first body board, comes in from the opening's own handover.
 */
function withTransitions(boards, content) {
	boards.forEach((b, i) => {
		if (i === 0) return
		const tr = content.transitions?.[b.id]
		if (tr && !TRANSITIONS[tr.type]) console.error(`unknown transition '${tr.type}' into ${b.id}`)
		b.transition = tr && TRANSITIONS[tr.type] ? tr : null
		b.motion = `${describe(b.transition || { type: 'flip' })} ${b.motion || ''}`.trim()
	})
}

/**
 * Round 28 (Ruben): the current wire is retired, so no board draws a wire. Each board still gets
 * drawBase (its frame as drawn, for pages that animate hand-offs themselves) and currentAnchor
 * (content.anchors[id], an optional key-element override the transitions player honours).
 */
function withCurrent(boards, content) {
	boards.forEach((b) => {
		b.drawBase = b.draw
		b.currentAnchor = content.anchors?.[b.id] || null
	})
}

/** The word budget of the body (hook to promise; the bible's 20 to 30, or up to max), with the shared modules listed apart. */
export function audienceBudget(boards, max = 30) {
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
	const filmIssues = total < 20 || total > max ? [`${total} words in the body (bible: 20 to ${max})`] : []
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
		duration: OPEN + bodyLength((content.proofs || []).length) + BUILT + INSTALL_DUR,
		bars: 3 + Math.round(bodyLength((content.proofs || []).length) / BAR) + Math.round((BUILT + INSTALL_DUR) / BAR),
		budget: audienceBudget(boards, content.maxWords || 30),
	}
	return { meta, boards }
}

export { wordBudget }
