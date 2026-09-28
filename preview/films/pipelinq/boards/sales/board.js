/**
 * Pipelinq, audience film: sales teams (SMB sales and service, professional services).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Reworked in Round 8
 * (Ruben, 2026-09-28): no "no seat fee" and no flat-cost claim anywhere (the Nextcloud SLA
 * price grows with the organisation); the new USP is your data in Nextcloud Tables, with your
 * own dashboards and flows on it. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     every deal a card on one board (sp-pipeline-board)
 *   proof 1  drag a deal on, the forecast follows (sp-reporting-dashboard)
 *   proof 2  all your deals in Nextcloud Tables, as rows you can sort and filter (Round 8 note)
 *   general  flows: build your own dashboards and flows on that data (Round 8 note)
 *   promise  "Your data, your own dashboards"
 *   (Round 15: the promise opens the body, straight after the opening; the body ends on the
 *   general scene and the app name returns in Built on Nextcloud)
 *
 * The Tables app has no icon in brand/assets (nc-* holds files, mail, calendar, talk, decks,
 * activity), so none is drawn: the table sits under a Nextcloud-blue header and the name
 * "Tables" is set in Nextcloud cyan in the caption (round 6 rule for Nextcloud app names).
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (hook to proof 1),
 * #11 whip-pan on the beat (proof 1 to proof 2), #10 cluster-to-container merge (the deal
 * cards drop into table rows), #2 zoom-out sentence build (the promise).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, panel } from '../../../_lib/ui.js'
import { forecastUI } from '../C/board.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds while the caption swaps; the sentence builds as the camera pulls back.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A whip on the beat between two held shots.' },
]

/** Proof 2: the deals as a Nextcloud Tables table: a Nextcloud-blue header, columns, rows, one filter chip. */
function tablesUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 600, u)
	rect(w, x, top, width, 70, C.nextcloud, 0)
	bar(w, x + 30, top + 30, 160, 12, C.white)
	rect(w, x + width - 230, top + 20, 200, 32, C.white, 16)
	bar(w, x + width - 210, top + 32, 120, 8, C.nextcloud)
	// Filter chips: one active, the scene's one orange as its ring.
	rect(w, x + 30, top + 96, 130, 38, C.cobalt50, 19)
	rect(w, x + 172, top + 96, 150, 38, C.cobalt50, 19)
	rect(w, x + 166, top + 90, 162, 50, 'none', 25, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// The grid: header row, then deal rows with stage, value and owner columns.
	const gy = top + 160, cols = [30, 290, 470, 640], rh = 62
	rect(w, x + 20, gy, width - 40, 44, C.cobalt50, 3 * u)
	cols.forEach((cx) => bar(w, x + cx + 10, gy + 18, 80, 8, C.cobalt400))
	for (let r = 0; r < 6; r++) {
		const cy = gy + 44 + r * rh + rh / 2
		rect(w, x + 20, cy + rh / 2 - u, width - 40, u, C.cobalt50)
		bar(w, x + cols[0] + 10, cy - 6, 200 - (r % 3) * 30, 11, C.cobalt900)
		rect(w, x + cols[1] + 10, cy - 14, 110, 28, [C.lavender300, C.cobalt100, C.mint300][r % 3], 14)
		bar(w, x + cols[2] + 10, cy - 6, 90, 11, C.cobalt700)
		circle(w, x + cols[3] + 26, cy, 16, r % 2 ? C.cobalt200 : C.cobalt300)
	}
}

const content = {
	app: 'pipelinq',
	audience: { slug: 'sales', name: 'Sales teams', persona: 'Tom Jansen, office manager and sales lead; Fatima Yildiz, practice owner' },
	promise: 'Know which deals\nwill close',
	promiseLine: 'Know which deals will close: every deal on one board, a forecast that follows the drag, your data in Nextcloud Tables and flows that act on it',
	title: 'Pipelinq for sales teams',
	record: { one: 'client', many: 'clients' },
	logline: 'For the sales team of a 10 to 500 person business: every deal on one board, a forecast that follows the drag, all your deals as rows in Nextcloud Tables, and your own dashboards and flows built on them.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram', '#11 whip-pan on the beat', '#10 cluster-to-container merge', '#2 zoom-out sentence build'],
	neighbours: ['shillinq', 'portaliq'],
	builtOnApps: ['shillinq'],
	hook: {
		title: 'Every deal, one board',
		caption: 'Every deal,\none board',
		ui: { pattern: 'board', columns: [[200, 160, 180], [170, 210], [190, 150, 170]] },
		source: 'positioning pipelinq sp-pipeline-board: "Drag a lead from one pipeline stage to the next."',
		motion: 'In behind the app hex the promise leaves on the loop anchor: the board already on screen, caption set, the Pipelinq hex (orange) on the loop anchor. Cards settle one frame apart; a slow push in (1.00 to 1.04). Technique #9 starts here: the board is the held diagram for the next scene.',
		sound: 'Gentle open: pad and offbeat bass only. Soft ticks as the cards settle.',
	},
	proofs: [
		{
			id: 'forecast',
			title: 'Drag a deal, the forecast follows',
			caption: 'Drag a deal,\nthe forecast follows',
			source: 'positioning pipelinq sp-reporting-dashboard ("See how sales are going at a glance.") and sp-pipeline-board',
			motion: 'Technique #9, text-swap on a held diagram: no cut. The board stays exactly where it was; only the caption swaps in its clip box (old words leave upward, new rise, 4 frames). Then one card lifts and is dragged a lane right (ease.snap, one beat), lands with a small spring, and the camera pulls down to the forecast, where the newest bar grows. Out: technique #11, a 5-frame whip-pan left (ease.snap, render --blur 4) into proof 2.',
			sound: 'Whoosh on the drag, a tick as the card lands, a rising pluck as the bar grows, a short whoosh on the whip.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Drag a deal,\nthe forecast follows', drawUI: forecastUI, tagFill: 'cobalt', header: false }),
		},
		{
			id: 'tables',
			title: 'Your data in Nextcloud Tables',
			caption: 'Sort and filter\nin Nextcloud _Tables_',
			source: 'Ruben, Round 8: "all your data in Nextcloud Tables, build your own dashboards and flows on it"',
			motion: 'The whip lands on the Tables view. Technique #10, cluster-to-container merge: the deal cards from the board drift in as loose shapes and each drops into its row (ease.brand, all within one beat), the stage pill, value and owner filling a sixteenth later. On the next beat one filter chip is tapped and its orange ring steps out; the rows re-sort. "Tables" is set in Nextcloud cyan in the caption.',
			sound: 'A short whoosh landing from the whip, a run of ticks as the rows fill, a dry click on the chip.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Sort and filter\nin Nextcloud _Tables_', captionOpts: { accent2: C.nextcloudCyan }, drawUI: tablesUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'flows',
		title: 'Quote accepted? Your flow does the rest',
		caption: 'Quote accepted?\nYour flow does the rest',
		source: 'Ruben, Round 8 (dashboards and flows on your own data); story.json mechanic 7 (the customer draws each flow, never pre-built)',
		sound: 'A tick as each node is placed, a pluck as the last settles into its slot.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build. The Pipelinq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Pipelinq" the promise builds one word per eighth note, each word slamming in large and the type column\'s camera easing back (ease.brand) so the line always just fits: "Know", "which", "deals" then "will close" on the second line; at rest it is the key frame. Round 15: the body opens on this card, straight after the opening\'s handover; out on the bar line the cluster steps out and the app cell shrinks on the loop anchor to the hook\'s tag.',
}

export const { meta, boards } = audienceFilm(content)
