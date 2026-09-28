/**
 * Shillinq, audience film: accountancy and bookkeeping practices. Direction C on the app-film
 * template, wrapped by _lib/audiencefilm.js. Round 7: specs and positioning count as built.
 * Positioning: ds-connext-film-review/audiences/positioning-l2.md.
 *
 *   hook     all your clients, one login: the practice's own access to every client's books
 *            (sp-audit; specs accountant-portal, bookkeeping-multi-administratie)
 *   proof 1  group eliminations generated from the postings (usp-group-consolidation, verified;
 *            specs bookkeeping-intercompany-elimination, bookkeeping-gr-consolidation)
 *   proof 2  R&D hours tagged, ready for the WBSO claim (usp-corporate-tax-positions, verified;
 *            specs wbso-uren-tagging-and-export, bookkeeping-wbso-sno-administratie)
 *   general  the data layer: every change shows who and when (COPY.dataLayer D1; spec
 *            bookkeeping-audit-trail)
 *   promise  "Every client's books, one clear trail"
 *
 * Techniques (refs/techniques.md): #8 one-take glide across cards (the camera glides down the
 * client list and pushes into one), #1 dot-grows-to-fill as an upright hex (the client's group
 * opens into its two ledgers), #3 grid-cell ripple (the timesheet's R&D hours tag in waves).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'One unbroken camera move gliding from card to card.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark grows to fill the frame and becomes the next scene.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping on in waves.' },
]

/** Hook: the practice's own login, and every client's administration under it. */
function clientsUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	// The one login: the practice's avatar, top.
	circle(w, x + 150, top + 56, 26, C.cobalt300)
	bar(w, x + 190, top + 42, 180, 14, C.cobalt900)
	bar(w, x + 190, top + 66, 110, 8, C.cobalt300)
	for (let i = 0; i < 5; i++) {
		const cy = top + 150 + i * 94
		rect(w, x + 30, cy - 38, width - 60, 76, C.cobalt50, 4 * u)
		hex(w, x + 70, cy, 20, C.cobalt, 2)
		bar(w, x + 106, cy - 14, 200 - (i % 3) * 30, 12, C.cobalt900)
		bar(w, x + 106, cy + 8, 120, 7, C.cobalt300)
		// Where each client stands: period closed, open, or a question waiting.
		if (i === 1) idlePill(w, x + width - 110, cy, u, { w: 40 })
		else statusPill(w, x + width - 180, cy, u)
	}
	// The client opened next: ringed (the one orange).
	rect(w, x + 24, top + 150 + 2 * 94 - 44, width - 48, 88, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: two group companies' ledgers; their intercompany lines paired and the elimination generated between them. */
function elimUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const lw = 290
	;[0, 1].forEach((k) => {
		const lx = k ? x + width - lw : x
		panel(w, lx, top, lw, 560, u)
		hex(w, lx + 40, top + 40, 16, C.cobalt, 2)
		bar(w, lx + 66, top + 34, 140, 12, C.cobalt900)
		for (let i = 0; i < 6; i++) {
			const cy = top + 110 + i * 70
			const ic = i === 2 || i === 4
			bar(w, lx + 30, cy - 5, 150 - (i % 3) * 20, 10, ic ? C.lavender : C.cobalt700)
			bar(w, lx + lw - 110, cy - 5, 80, 10, ic ? C.lavender : C.cobalt400)
		}
	})
	// The elimination, generated between them: two lines that net to nothing.
	const ex = x + lw + 30, ew = width - 2 * lw - 60
	panel(w, ex, top + 150, ew, 260, u)
	bar(w, ex + 24, top + 180, ew - 80, 10, C.cobalt900)
	for (let i = 0; i < 2; i++) {
		hex(w, ex + 34, top + 240 + i * 60, 10, C.lavender, 1)
		bar(w, ex + 54, top + 234 + i * 60, ew - 90, 10, C.cobalt700)
	}
	bar(w, ex + 24, top + 364, ew - 48, 3 * u, C.cobalt300)
	// Square-cornered wires from each intercompany line to the entry.
	;[top + 110 + 2 * 70, top + 110 + 4 * 70].forEach((y) => {
		rect(w, x + lw, y - 1.5 * u, 30, 3 * u, C.lavender300)
		rect(w, ex + ew, y - 1.5 * u, 30, 3 * u, C.lavender300)
	})
	// The generated entry: ringed (the one orange).
	rect(w, ex - 8, top + 142, ew + 16, 276, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the week's timesheet by project; R&D hours tagged; the WBSO export ready. */
function wbsoUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 620, u)
	const gx = x + 230, cols = 5, cw = (width - 260) / cols
	for (let c = 0; c < cols; c++) bar(w, gx + c * cw + cw / 2 - 14, top + 34, 28, 8, C.cobalt300)
	const rows = ['11011', '10111', '01101', '11110', '10011']
	const rd = [true, false, true, false, true]
	rows.forEach((row, r) => {
		const cy = top + 100 + r * 76
		hex(w, x + 44, cy, 14, rd[r] ? C.lavender : C.cobalt200, 2)
		bar(w, x + 70, cy - 6, 130 - (r % 3) * 20, 11, C.cobalt900)
		for (let c = 0; c < cols; c++) if (row[c] === '1') rect(w, gx + c * cw + 6, cy - 22, cw - 12, 44, rd[r] ? C.lavender300 : C.cobalt100, 4 * u)
	})
	// The export, ready: the accent button (an orange ring round it, the one orange).
	button(w, x + width - 260, top + 520, 220, 56, u, { kind: 'accent' })
	bar(w, x + 30, top + 540, 240, 12, C.cobalt700)
}

const content = {
	app: 'shillinq',
	audience: { slug: 'accountants', name: 'Accountancy practices', persona: 'Hicham El Amrani, practice owner of a bookkeeping office' },
	promise: 'Every client\'s books,\none clear trail',
	promiseLine: 'Every client\'s books in one place, the group and tax work generated, one clear trail',
	title: 'Shillinq for accountancy practices',
	record: { one: 'client', many: 'clients' },
	logline: 'For the bookkeeping office: every client\'s books under the practice\'s own login, group eliminations generated from the postings, R&D hours tagged and ready for the WBSO claim, and every change showing who and when.',
	references: REFS,
	techniques: ['#8 one-take glide across cards (the client list)', '#1 dot-grows-to-fill (as a hex, client into its ledgers)', '#3 grid-cell ripple (the R&D hours)'],
	neighbours: ['pipelinq', 'portaliq'],
	builtOnApps: ['portaliq'],
	hook: {
		title: 'All your clients, one login',
		caption: 'All your clients,\none login',
		ui: { drawUI: clientsUI, tagFill: 'cobalt' },
		source: 'positioning shillinq sp-audit ("Give your accountant their own access to review the books."); cg-accounting-firms ("running many clients\' administrations from one office"); specs accountant-portal, bookkeeping-multi-administratie',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the practice\'s login and its clients, the Shillinq hex (cobalt) on the loop anchor. Technique #8, one-take glide: the camera glides down the client cards without a cut (ease.brand), settles on the third and pushes in slightly as the orange ring lands round it on beat 5.',
		sound: 'A soft slide under the glide, a pluck on the ring.',
	},
	proofs: [
		{
			id: 'eliminations',
			title: 'Group eliminations, generated for you',
			caption: 'Group eliminations,\ngenerated for you',
			source: 'positioning shillinq usp-group-consolidation, verified ("Have the group eliminations generated instead of executed by hand."); specs bookkeeping-intercompany-elimination, bookkeeping-gr-consolidation',
			motion: 'Technique #1: the ringed client\'s hex grows as an upright hex past the frame and splits into its two group companies\' ledgers. Their intercompany lines light lavender; square-cornered wires draw inward, and the elimination entry builds between them line by line, the two lines netting to a rule. The orange ring lands round the generated entry.',
			sound: 'A whoosh through the hex, a line-draw hiss, a low pluck as the entry nets.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Group eliminations,\ngenerated for you', drawUI: elimUI, tagFill: 'cobalt' }),
		},
		{
			id: 'wbso',
			title: 'R&D hours tagged, ready for WBSO',
			caption: 'R&D hours tagged,\nready for WBSO',
			source: 'positioning shillinq usp-corporate-tax-positions, verified ("Tag R&D hours and export them ready for the WBSO claim."); specs wbso-uren-tagging-and-export, bookkeeping-wbso-sno-administratie',
			motion: 'Technique #3, grid-cell ripple: the week\'s hours step on in a wave; the projects marked R&D tag lavender row by row, the rest stay cobalt-100. On the bar line the export button takes its orange ring: ready, not sent.',
			sound: 'A ripple of ticks, a pluck on the export.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'R&D hours tagged,\nready for WBSO', drawUI: wbsoUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Every change shows who and when',
		caption: 'Every change shows\nwho and when',
		source: 'COPY.dataLayer D1 (story.json mechanics[0]); Shillinq spec bookkeeping-audit-trail',
		params: {
			record: { avatar: 'square', title: 230, sub: 150, status: 'mint' },
			links: ['nc-files', 'nc-mail'],
		},
		sound: 'Ticks as the history rows land, a pluck on the new row.',
	},
}

export const { meta, boards } = audienceFilm(content)
