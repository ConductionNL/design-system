/**
 * LaunchPad, audience film: the staff start screen (local government, mid-size companies,
 * school boards, hospital groups). Direction C on the app-film template, wrapped by
 * _lib/audiencefilm.js. Round 7: specs and positioning count as built. Positioning:
 * ds-connext-film-review/audiences/positioning-l3.md.
 *
 *   hook     your whole day on one screen: tiles with a live status dot, a live figure,
 *            calendar and mail from the apps you run (bible fact 7; sp-tiles-launch,
 *            sp-content-widgets; specs tiles, live-data-tile-widget, calendar-widget)
 *   proof 1  staff confirm they have read an announcement, right there (usp-proof-of-read,
 *            verified; spec dashboard-acknowledgements)
 *   proof 2  one template change pushed to every dashboard, merged the way you choose
 *            (usp-rollout-at-scale, verified; specs admin-templates, dashboard-cascade-events)
 *   general  your dashboards on your own server (COPY.dataLayer D3; bible 10). Round 18: REDRAWN so the
 *            picture shows the claim: the staff start screens wired down into your own server rack,
 *            Nextcloud on it, the rack ringed (it replaces the shared data-layer picture of the history)
 *   promise  "One start screen for everyone"
 *
 * No assistant: the AI widget (launchpad-ai-dashboard-assistant) exists, but this film also
 * speaks to local government (Round 8 spirit).
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (the app tiles
 * drift together into the start screen), #3 grid-cell ripple (the read confirmations tick on
 * across the staff), #5 stepped hex wipe (the template change crossing into every dashboard).
 */
import { C } from '../../../_lib/brand.js'
import { el } from '../../../_lib/stage.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, widgetTile, calendarGrid, personRow, button, chrome, honeyField, layout, appTag, ncTag } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves; a stepped wipe of flat shapes.' },
]

/** Hook: the start screen: a row of app tiles with status dots, then calendar, mail and a live figure. */
function startUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// App tiles: coloured squares with a live status dot (mint up, one amber-free idle in cobalt-300).
	// The row starts clear of the app tag, which sits on the window's first content row.
	const n = 6, tx0 = x + 64, tw = (width - 64 - (n - 1) * 16) / n
	for (let i = 0; i < n; i++) {
		const tx = tx0 + i * (tw + 16)
		panel(w, tx, top, tw, 120, u)
		rect(w, tx + tw / 2 - 26, top + 22, 52, 52, [C.cobalt, C.lavender, C.cobalt400, C.forest, C.cobalt700, C.lavender300][i], 6 * u)
		bar(w, tx + tw / 2 - 34, top + 90, 68, 8, C.cobalt400)
		circle(w, tx + tw - 18, top + 18, 7, i === 3 ? C.cobalt300 : C.mint)
	}
	const cw = (width - 20) / 2
	widgetTile(w, x, top + 144, cw, 250, u, 'nc-calendar', (bx, by, bw) => calendarGrid(w, bx, by, bw, 3, u, '1,3', ['0,1', '1,4', '2,2', '0,5'], { todayFill: C.cobalt }))
	widgetTile(w, x + cw + 20, top + 144, cw, 250, u, 'nc-mail', (bx, by, bw) => { personRow(w, bx, by, bw, u, C.cobalt200, 120); personRow(w, bx, by + 56, bw, u, C.cobalt300, 90); personRow(w, bx, by + 112, bw, u, C.cobalt200, 140) })
	// The live figure: a number and its bars, refreshing on its own (ringed: the scene's one orange).
	const fy = top + 418
	panel(w, x, fy, width, 190, u)
	bar(w, x + 36, fy + 34, 120, 10, C.cobalt700)
	rect(w, x + 36, fy + 70, 150, 56, C.cobalt900, 4 * u)
	const hs = [50, 72, 60, 96, 84, 110, 120]
	hs.forEach((h, i) => rect(w, x + 260 + i * 70, fy + 160 - h, 40, h, i === hs.length - 1 ? C.cobalt : C.cobalt200, 3 * u))
	rect(w, x - 8, fy - 8, width + 16, 206, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: an announcement on the start screen, the read button, and the staff who confirmed. */
function readUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 300, u)
	hex(w, x + 50, top + 50, 20, C.lavender, 2)
	bar(w, x + 86, top + 38, 300, 16, C.cobalt900)
	bar(w, x + 86, top + 66, 160, 8, C.cobalt300)
	for (let i = 0; i < 3; i++) bar(w, x + 40, top + 112 + i * 30, width - 120 - i * 90, 9, C.cobalt200)
	// "I have read this": the button just pressed (the scene's one orange, as a ring round it).
	button(w, x + 40, top + 216, 230, 50, u, { kind: 'accent', label: 0.6 })
	// Who confirmed: a grid of staff, most ticked mint (the ripple lands here), a few still open.
	const cols = 10, rows = 3, cs = (width - 40) / cols
	panel(w, x, top + 330, width, 90 + rows * cs * 0.8, u)
	bar(w, x + 30, top + 360, 140, 10, C.cobalt700)
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const cx = x + 20 + c * cs + cs / 2, cy = top + 420 + r * cs * 0.8
		const open = (r * cols + c) % 7 === 5
		circle(w, cx, cy, cs * 0.3, open ? C.cobalt100 : C.cobalt300)
		if (!open) circle(w, cx + cs * 0.22, cy + cs * 0.2, cs * 0.12, C.mint)
	}
}

/** Proof 2: one template on the left, pushed into every dashboard on the right, with the merge choice. */
function rolloutUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const tw = width * 0.34
	// The template, and its merge choice (keep their changes / replace).
	panel(w, x, top, tw, 560, u)
	bar(w, x + 26, top + 30, 140, 12, C.cobalt900)
	;[[0, 0, 2, 1], [2, 0, 1, 1], [0, 1, 1, 1], [1, 1, 2, 1]].forEach(([c, r, cw, rh]) => rect(w, x + 26 + c * ((tw - 52) / 3), top + 70 + r * 110, cw * ((tw - 52) / 3) - 10, rh * 100, C.cobalt100, 3 * u))
	for (let i = 0; i < 2; i++) {
		const cy = top + 330 + i * 60
		circle(w, x + 40, cy, 12, i === 0 ? C.cobalt : C.white, { stroke: C.cobalt, 'stroke-width': 1.4 * u })
		bar(w, x + 64, cy - 5, 150 - i * 30, 9, C.cobalt700)
	}
	button(w, x + 26, top + 470, tw - 52, 50, u, { kind: 'primary', label: 0.4 })
	// Straight line out to the dashboards (one right angle), and the grid of dashboards taking it.
	rect(w, x + tw, top + 495 - u, 50, 2 * u, C.cobalt300)
	const gx = x + tw + 50, gw = width - tw - 50, n = 4, m = 4, dw = (gw - (n - 1) * 12) / n, dh = 120
	rect(w, gx - u, top + 60, 2 * u, 435, C.cobalt300)
	for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
		const dx = gx + 12 + c * (dw + 12) - 12, dy = top + r * (dh + 14)
		panel(w, dx + 12, dy, dw - 12, dh, u)
		rect(w, dx + 22, dy + 12, (dw - 32) * 0.6, 40, C.cobalt100, 2 * u)
		rect(w, dx + 22 + (dw - 32) * 0.62, dy + 12, (dw - 32) * 0.38, 40, C.cobalt50, 2 * u)
		rect(w, dx + 22, dy + 60, dw - 32, 44, C.cobalt50, 2 * u)
		if (r * n + c < 11) circle(w, dx + dw - 18, dy + dh - 14, 8, C.mint)
	}
}

/**
 * General slot, Round 18: "Your dashboards, on your own server" drawn as what it says. Local
 * coordinates of the shared general scenes (x 170 to 780, y 640 to 1240, scale 1.25), so the
 * picture sits where every other film's general scene sits. Three staff start screens (the
 * LaunchPad tag pinned to the first) wire straight down into a server rack of four units with
 * mint status lights; the Nextcloud hex sits on the rack (it runs there); the one orange is the
 * ring round the rack: your own server is the answer of the scene.
 */
const SERVER_CAPTION = 'Your dashboards,\non your own server'
function ownServerFrame(ctx) {
	const U = 2.5
	chrome(ctx, { text: SERVER_CAPTION, app: 'launchpad' })
	honeyField(ctx.g, ctx.W * 0.62, ctx.H + 150, 80, 10, { top: ctx.H * 0.61, scale: 0.7, W: ctx.W, H: ctx.H, alpha: { 0: 0.5, 1: 0.46, 2: 0.4, 3: 0.3, 4: 0.2, 5: 0.12, 6: 0.07 } })
	const { ui } = layout(ctx.W, ctx.H)
	const g = el('g', { transform: `translate(${ui.x - 1.25 * 120} ${ui.y - 1.25 * 640}) scale(1.25)` }, ctx.g)
	// the staff start screens, each a small dashboard of tiles
	const sw = 190, gap = 20, sy = 640, sh = 170, ry = 900
	for (let i = 0; i < 3; i++) {
		const sx = 170 + i * (sw + gap)
		rect(g, sx + sw / 2 - 1.5, sy + sh, 3, ry - sy - sh, C.cobalt300)
		panel(g, sx, sy, sw, sh, U)
		rect(g, sx, sy, sw, 18, C.cobalt, 4)
		for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
			const tx = sx + 16 + c * 56, ty = sy + 34 + r * 64
			rect(g, tx, ty, 48, 52, r === 0 && c === 0 ? C.cobalt100 : C.cobalt50, 3)
			if (r === 1 || c === 2) circle(g, tx + 38, ty + 42, 5, C.mint)
		}
	}
	appTag(g, 170, sy + 18, 36, 'launchpad', { ringW: 5 })
	// your own server: a rack of four units, status lights mint
	const rx = 170, rw = 610, rh = 300
	panel(g, rx, ry, rw, rh, U)
	for (let k = 0; k < 4; k++) {
		const uy = ry + 26 + k * 66
		rect(g, rx + 40, uy, rw - 80, 52, C.cobalt900, 3 * U)
		for (let v = 0; v < 6; v++) rect(g, rx + 70 + v * 22, uy + 16, 10, 20, C.cobalt700, 2)
		bar(g, rx + 250, uy + 22, [150, 120, 170, 110][k], 8, C.cobalt400)
		circle(g, rx + rw - 110, uy + 26, 7, C.mint)
		circle(g, rx + rw - 84, uy + 26, 7, k === 2 ? C.cobalt400 : C.mint)
	}
	ncTag(g, rx, ry + rh / 2, 38, { ringW: 5 })
	// the answer: the ring round your own server
	rect(g, rx - 12, ry - 12, rw + 24, rh + 24, 'none', 6 * U, { stroke: C.orange, 'stroke-width': 2.5 * U })
}

const content = {
	app: 'launchpad',
	audience: { slug: 'staff', name: 'Staff start screen', persona: 'Annemieke de Groot, ICT manager at a municipality; Thijs Verhagen, IT manager at a 140-person company; Esther van Dijk, head of communications at a hospital group' },
	promise: 'One start screen\nfor everyone',
	promiseLine: 'One start screen for all your staff, built from the apps you already run, on your own server',
	title: 'LaunchPad for your staff',
	record: { one: 'dashboard', many: 'dashboards' },
	logline: 'For any organisation that wants one start screen for its staff: the day on one screen, announcements staff confirm they have read, and one template change that reaches every dashboard. On your own server.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge (app tiles into the start screen)', '#3 grid-cell ripple (the read confirmations)', '#5 stepped hex wipe (the rollout)'],
	neighbours: ['pipelinq', 'dossiq'],
	builtOnApps: ['pipelinq'],
	hook: {
		title: 'Your whole day, on one screen',
		caption: 'Your whole day,\non one screen',
		ui: { drawUI: startUI, tagFill: 'cobalt' },
		source: 'bible "What is true" 7 ("One start screen. Your deals, tasks, calendar and mail from every app, arranged your way."); positioning launchpad sp-tiles-launch, sp-content-widgets; specs tiles, live-data-tile-widget, calendar-widget',
		motion: 'Out of the promise the app cell stays on the loop anchor and the window builds round it; the frame reads: caption, the start screen, the LaunchPad hex (cobalt) on the loop anchor. Technique #10: the app tiles, the calendar, the mail and the figure start as loose shapes scattered over the right of the frame and drift into their grid slots on ease.brand, all landing on beat 3; the status dots pop mint a sixteenth later; the live figure\'s last bar grows and the panel takes the orange ring.',
		sound: 'Gentle open. A soft whoosh as the shapes drift in, a tick per landing, a pluck on the live figure.',
	},
	proofs: [
		{
			id: 'read',
			title: 'Staff confirm they\'ve read it',
			caption: 'Staff confirm\nthey\'ve read it',
			source: 'positioning launchpad usp-proof-of-read (verified): "Staff confirm they\'ve read it, right there."; spec dashboard-acknowledgements',
			motion: 'Hard cut on the beat to the announcement card on the same grid. The read button is pressed (a quick scale 0.96 and back) and the orange ring round it closes. Technique #3, grid-cell ripple: the staff avatars below step from 20% to full opacity in waves and each mint tick pops as its colleague confirms; a few stay open.',
			sound: 'A dry click on the press, a ripple of ticks with the confirmations.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Staff confirm\nthey\'ve read it', drawUI: readUI, tagFill: 'cobalt' }),
		},
		{
			id: 'rollout',
			title: 'One change, every dashboard',
			caption: 'One change,\nevery dashboard',
			source: 'positioning launchpad usp-rollout-at-scale (verified): "You push the update and choose how it merges."; specs admin-templates, dashboard-cascade-events, dashboard-bulk-operations',
			motion: 'Technique #5, stepped hex wipe: three pointy-top hexes step in from the right edge (70 ms apart) and cut to the template view. The merge choice is ticked, the push button pressed, and the straight line runs out to the grid of dashboards; they take the new layout row by row and their mint dots pop. The scene\'s one orange is the LaunchPad tag itself (the app icon exception): the change comes from LaunchPad, not from a colleague.',
			sound: 'Three clicks with the wipe steps, a whoosh along the line, a run of ticks as the dashboards update.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'One change,\nevery dashboard', drawUI: rolloutUI, tagFill: 'orange' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Your dashboards, on your own server',
		caption: 'Your dashboards,\non your own server',
		source: 'COPY.dataLayer D3 ("Your {many}, on your own server.", story.json mechanics[0]); bible "What is true" 10',
		motion: 'Round 18, redrawn to show its own claim. The hex fill lands as the cobalt ground; three staff start screens drop in on the right a sixteenth apart (0.35 s, ease.brand), the LaunchPad tag pinned to the first. On the next beat a straight wire runs down from each screen and the server rack lands under them, its four units sliding in a sixteenth apart and their status lights popping mint; the Nextcloud hex lands on the rack\'s edge (Nextcloud runs there). On the third beat the orange ring closes round the rack: your own server. The honeycomb field pops in from the bottom edge. Out: the cards step down (0.85, ease.exit) and the app tag travels into Built on Nextcloud.',
		params: {
			record: { avatar: 'square', title: 230, sub: 150, status: 'mint' },
			links: ['nc-calendar', 'nc-mail', 'nc-files'],
		},
		sound: 'A tick per start screen, a low soft thud as the rack lands, a click as the ring closes.',
	},
}

const film = audienceFilm(content)
// Round 18: the general slot draws the own-server picture instead of the shared data-layer history.
film.boards.find((b) => b.id === 'general-dataLayer').draw = ownServerFrame
export const { meta, boards } = film
