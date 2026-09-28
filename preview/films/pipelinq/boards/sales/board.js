/**
 * Pipelinq, audience film: sales teams (SMB sales and service, professional services).
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7: matrix
 * features count as built. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     every deal a card on one board (sp-pipeline-board)
 *   proof 1  drag a deal on, the forecast follows (sp-reporting-dashboard)
 *   proof 2  paste an email signature and the contact fills itself in, the company
 *            number checked (usp-clean-company-data)
 *   general  the data layer: open a client, mail, files and meetings are right there
 *   promise  "No seat fee as you grow"
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (hook to proof 1: the
 * board holds, only the caption changes), #11 whip-pan on the beat (proof 1 to proof 2),
 * #2 zoom-out sentence build (the promise).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill } from '../../../_lib/ui.js'
import { forecastUI } from '../C/board.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds while the caption swaps; the sentence builds as the camera pulls back.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A whip on the beat between two held shots.' },
]

/** Proof 2: the pasted signature on the left, the contact's fields filling themselves on the right. */
function pasteUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The pasted signature: a dashed box of greeked lines (a name, a role, a company, a number, a phone).
	const sw = 360
	rect(w, x, top, sw, 430, C.cobalt50, 4 * u, { stroke: C.cobalt300, 'stroke-width': u, 'stroke-dasharray': '10 8' })
	;[[220, 14, C.cobalt900], [160, 9, C.cobalt400], [200, 11, C.cobalt700], [150, 9, C.cobalt400], [170, 9, C.cobalt400], [130, 9, C.cobalt400]].forEach(([lw, h, f], i) => bar(w, x + 36, top + 50 + i * 56, lw, h, f))
	// Steps from the signature to the form: the fields it fills.
	for (let i = 0; i < 3; i++) hex(w, x + sw + 36 + i * 22, top + 215, 6, C.cobalt300, 1)
	// The contact form.
	const fx = x + sw + 110, fw = width - sw - 110
	panel(w, fx, top, fw, 560, u)
	const fields = [[190, true], [150, true], [210, true], [170, true, 'check'], [140, false]]
	fields.forEach(([lw, filled, check], i) => {
		const fy = top + 40 + i * 100
		bar(w, fx + 30, fy, 90, 8, C.cobalt400)
		rect(w, fx + 30, fy + 20, fw - 60, 52, C.white, 3 * u, { stroke: i === 2 ? C.orange : C.cobalt200, 'stroke-width': i === 2 ? 2.5 * u : u })
		if (filled) bar(w, fx + 50, fy + 40, lw, 11, C.cobalt900)
		if (check) statusPill(w, fx + fw - 170, fy + 46, u)
	})
	// The company avatar the pasted company became.
	circle(w, fx + fw - 70, top + 66, 22, C.cobalt200)
}

const content = {
	app: 'pipelinq',
	audience: { slug: 'sales', name: 'Sales teams', persona: 'Tom Jansen, office manager and sales lead; Fatima Yildiz, practice owner' },
	promise: 'No seat fee\nas you grow',
	promiseLine: 'Run your whole pipeline in the Nextcloud you already have, with no seat fee as the team grows',
	title: 'Pipelinq for sales teams',
	record: { one: 'client', many: 'clients' },
	logline: 'For the sales team of a 10 to 500 person business: every deal on one board, a forecast that follows the drag, a contact that fills itself in from a pasted signature, and the client page where it all comes together.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram', '#11 whip-pan on the beat', '#2 zoom-out sentence build'],
	neighbours: ['shillinq', 'portaliq'],
	builtOnApps: ['shillinq'],
	hook: {
		title: 'Every deal, one board',
		caption: 'Every deal,\none board',
		ui: { pattern: 'board', columns: [[200, 160, 180], [170, 210], [190, 150, 170]] },
		source: 'positioning pipelinq sp-pipeline-board: "Drag a lead from one pipeline stage to the next."',
		motion: 'Frame 1 is this frame: the board already on screen, caption set, the Pipelinq hex (orange) on the loop anchor. Cards settle one frame apart; a slow push in (1.00 to 1.04). Technique #9 starts here: the board is the held diagram for the next scene.',
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
			id: 'paste',
			title: 'Paste a signature, skip the typing',
			caption: 'Paste a signature,\nskip the typing',
			source: 'positioning pipelinq usp-clean-company-data: "Paste a signature and the contact fills itself in." (verified)',
			motion: 'The whip lands on the new contact form. The dashed signature block drops in on the left (a paste: it appears whole, no build), and three small hexes step right to the form; the fields fill top to bottom a sixteenth apart, the company number field takes the orange edge as it is checked and its pill turns mint. Caption rises as the paste lands.',
			sound: 'A crisp paste click, four quick ticks as the fields fill, a pluck on the check.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Paste a signature,\nskip the typing', drawUI: pasteUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Open a client,\nit\'s all there',
		source: 'story.json mechanics 0 and 1; positioning pipelinq sp-360-timeline and usp-nextcloud-workspace',
		params: {
			record: { avatar: 'person', title: 230, sub: 170, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 140 }, { av: C.cobalt300, w: 160 }, { av: C.cobalt200, w: 120 }],
			links: ['nc-mail', 'nc-files', 'nc-calendar'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build. The Pipelinq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Pipelinq" the promise builds one word per eighth note, each word slamming in large and the type column\'s camera easing back (ease.brand) so the line always just fits: "No", "seat", "fee", then "as you grow" on the second line; at rest it is the key frame. Holds to the bar line, then the cells step toward Nextcloud for Built on.',
}

export const { meta, boards } = audienceFilm(content)
