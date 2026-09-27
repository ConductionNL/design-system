/**
 * Pipelinq app film, direction C ("Proof"), on the shared app-film template.
 *
 * Every word and moment is in Pipelinq 0.5.1, the stable app-store release
 * (tag v0.5.1 = 6dd0bde), per ds-connext-film-review/apps/pipelinq/research.json:
 *   hook    the pipeline board: every deal a card in its stage column
 *   proof 1 drag a deal on; the sales overview (weighted forecast) updates itself
 *   proof 2 a contract enters its renewal window, so a renewal deal opens itself
 *           and the account owner is told
 *   general the client page: deals, requests, contracts, mail, files and calendar on
 *           one record, with its history (the common data layer; no Talk, which
 *           Pipelinq does not link)
 *   outro   the honeycomb round the Nextcloud workspace, Pipelinq singled out
 *
 * Never shown (research.json never_claim): a quote document or PDF, time tracking
 * in Pipelinq, "send to billing" (off by default), Talk on records, demo numbers.
 */
import { C } from '../../../_lib/brand.js'
import { appFilm } from '../../../_lib/appfilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, panel, statusPill, idlePill } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker and X Numbers', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A short caption over the product UI and the hex that grows out of a UI element into the next scene.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Push into the UI only until the detail reads, hold, never cut on a word.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'Type in the top third, UI below, one orange per scene.' },
]

/** A deal card on the board. */
function card(w, x, y, cw, u, { lw = 180, lifted = false, accent = false } = {}) {
	const h = 110
	if (lifted) rect(w, x + 10, y + 12, cw, h, C.cobalt200, 4 * u)
	panel(w, x, y, cw, h, u, { stroke: accent ? C.orange : C.cobalt100 })
	if (accent) rect(w, x, y, cw, h, 'none', 4 * u, { stroke: C.orange, 'stroke-width': 3 * u })
	bar(w, x + 24, y + 30, lw * 0.9, 10, C.cobalt900)
	bar(w, x + 24, y + 54, lw * 0.6, 7, C.cobalt300)
	circle(w, x + cw - 38, y + h - 30, 14, C.cobalt200)
	bar(w, x + 24, y + h - 34, 60, 8, accent ? C.orange : C.cobalt400)
}

/** Board columns (stage lanes) from x, with card widths per column. */
function lanes(w, geom, cols, { skip = [] } = {}) {
	const { u } = geom
	const cw = 270, gap = 20, top = geom.anchor.y - 55
	cols.forEach((cards, c) => {
		const x = geom.x + c * (cw + gap)
		rect(w, x, top - 70, cw, 520, C.cobalt50, 4 * u)
		bar(w, x + 20, top - 46, 110, 10, C.cobalt700)
		rect(w, x + cw - 56, top - 52, 36, 22, C.cobalt100, 11)
		cards.forEach((lw, i) => { if (!skip.includes(`${c},${i}`)) card(w, x + 12, top + i * 126, cw - 24, u, { lw }) })
	})
	return { cw, gap, top }
}

/** Proof 1: a deal lifted mid-drag into the next stage, and the forecast answering below. */
function forecastUI(w, geom) {
	const { u } = geom
	const { cw, gap, top } = lanes(w, geom, [[200, 160], [170], [190, 150]], { skip: [] })
	// The dragged deal: lifted between lane 2 and 3, the scene's one orange.
	card(w, geom.x + (cw + gap) * 1 + 150, top + 118, cw - 24, u, { lw: 190, lifted: true, accent: true })
	// The sales overview: weighted forecast bars, the newest one taller.
	const py = top + 400
	panel(w, geom.x, py, geom.r - geom.x, 360, u)
	bar(w, geom.x + 30, py + 30, 170, 14, C.cobalt700)
	const bars = [0.42, 0.55, 0.5, 0.68, 0.86]
	bars.forEach((v, i) => {
		const bh = 220 * v, bx = geom.x + 40 + i * 110
		rect(w, bx, py + 320 - bh, 70, bh, i === bars.length - 1 ? C.cobalt : C.cobalt200, 3 * u)
	})
	for (let i = 0; i < 3; i++) {
		bar(w, geom.x + 620, py + 90 + i * 70, 90, 10, C.cobalt300)
		bar(w, geom.x + 620, py + 112 + i * 70, 150 - i * 20, 18, C.cobalt900)
	}
}

/** Proof 2: the contracts list with one entering its renewal window, and the renewal deal that opened itself. */
function renewalUI(w, geom) {
	const { u } = geom
	const top = geom.anchor.y - 50
	const width = geom.r - geom.x
	panel(w, geom.x, top, width, 12 + 4 * 76 + 12, u)
	const rows = [{ w: 230, s: 'mint' }, { w: 200, s: 'renew' }, { w: 250, s: 'mint' }, { w: 170, s: 'mint' }]
	rows.forEach((row, i) => {
		const cy = geom.anchor.y + i * 76
		if (i > 0) rect(w, geom.x + 24, cy - 38, width - 48, u, C.cobalt50)
		rect(w, geom.x + 56, cy - 20, 40, 40, C.cobalt300, 4 * u)
		bar(w, geom.x + 116, cy - 12, row.w, 10, C.cobalt900)
		bar(w, geom.x + 116, cy + 8, row.w * 0.6, 7, C.cobalt300)
		if (row.s === 'renew') idlePill(w, geom.x + 560, cy, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
		else statusPill(w, geom.x + 548, cy, u)
		bar(w, geom.x + 690, cy - 4, 100, 8, C.cobalt200)
	})
	// The renewal deal that opened itself, landing in the first stage lane below.
	const ly = top + 12 + 4 * 76 + 60
	rect(w, geom.x, ly, 270, 470, C.cobalt50, 4 * u)
	bar(w, geom.x + 20, ly + 24, 110, 10, C.cobalt700)
	card(w, geom.x + 12, ly + 60, 246, u, { lw: 190, accent: true })
	card(w, geom.x + 12, ly + 186, 246, u, { lw: 150 })
	// A thin link from the renewing contract to its new deal.
	rect(w, geom.x + 76, geom.anchor.y + 76 + 22, 3 * u, ly + 60 - (geom.anchor.y + 76 + 22), C.cobalt300)
}

const content = {
	app: 'pipelinq',
	title: 'Pipelinq film',
	record: { one: 'client', many: 'clients' },
	logline: 'Pipelinq in 15 seconds: every deal on one board, a forecast that follows the drag, a renewal deal that opens itself, and the client page where it all comes together, then Pipelinq settles into the ConNext honeycomb.',
	references: REFS,
	hook: {
		title: 'Every deal on one board',
		caption: 'Every deal\non one board.',
		ui: { pattern: 'board', columns: [[200, 160, 180], [170, 210], [190, 150, 170]] },
		source: 'research.json feature "Lead pipeline board with drag and drop" (v0.5.1)',
		motion: 'Frame 1 is this frame: the pipeline board already on screen, caption set, the Pipelinq hex (orange) on the loop anchor. A slow push in across the first two beats (scale 1.00 to 1.04), cards settling one frame apart. On 2.3 the first card of lane 2 lifts: that is the hand-off into proof 1.',
		sound: 'Gentle open: pad and offbeat bass only, no stinger on frame 1. Soft ticks as the cards settle.',
	},
	proofs: [
		{
			id: 'forecast',
			title: 'The forecast updates itself',
			caption: 'The forecast\nupdates itself.',
			apps: ['pipelinq'],
			source: 'research.json scene "The Monday pipeline" and feature "Sales and operational dashboards" (v0.5.1)',
			motion: 'Continuous from the hook: the lifted card is dragged right into the next lane (ease.snap, one beat), lands with a small spring, and on the landing beat the camera pulls down to the sales overview, where the newest forecast bar grows to its new height. Caption rises on 2.3 as the drag starts.',
			sound: 'Whoosh on the drag, a tick as the card lands, a rising pluck as the forecast bar grows. Kick enters on bar 3.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'The forecast\nupdates itself.', drawUI: forecastUI, tagFill: 'cobalt' }),
		},
		{
			id: 'renewal',
			title: 'A renewal deal opens itself',
			caption: 'Renewal due?\nA deal opens.',
			apps: ['pipelinq'],
			source: 'research.json scene "Contract renewal" and feature "Contracts and renewals" (v0.5.1): the nightly check marks the contract as expiring and opens a renewal deal',
			motion: 'Hex match cut from the forecast: a hex grows out of the new bar and shrinks into the contracts list. The second contract steps into its renewal window (its pill turns to "renew"), a thin line draws down from it, and a new deal card drops into the first lane with the orange edge. Caption rises as the card lands.',
			sound: 'Whoosh through the hex cut. Two plucks as the pill changes and the line draws, a tick as the deal lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Renewal due?\nA deal opens.', drawUI: renewalUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Open a client.\nIt\'s all there.',
		source: 'story.json mechanics 0 and 1; research.json: client page with deals, requests, contracts, mail, files, calendar and notes; History tab (v0.5.1)',
		params: {
			record: { avatar: 'person', title: 230, sub: 170, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 140 }, { av: C.cobalt300, w: 160 }, { av: C.cobalt200, w: 120 }],
			links: ['nc-mail', 'nc-files', 'nc-calendar'],
		},
		sound: 'A pluck as each Nextcloud app links in (mail, files, calendar), a tick on the newest history entry.',
	},
	outro: { neighbours: ['portaliq', 'filinq', 'shillinq'] },
}

export const { meta, boards } = appFilm(content)
