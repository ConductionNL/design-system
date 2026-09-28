/**
 * Pipelinq, audience film: municipal contact centres (KCC). Direction C on the app-film
 * template, wrapped by _lib/audiencefilm.js. Reworked in Round 8 (Ruben, 2026-09-28): the
 * ID-lookup log and the holiday-skipping callback are out (weak); these are the strong
 * moments he named. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     the phone rings, a call pop-up slides in at the right, one click opens the
 *            citizen dashboard (Round 8 note)
 *   proof 1  the 360 view of the citizen: cases, products, invoices and permits (Round 8
 *            note; positioning sp-360-timeline)
 *   proof 2  related knowledge items appear while the agent types the contact moment (the
 *            knowledge graph; Round 8 note)
 *            and, Round 9, every letter and chat on the same view (the contacts tile)
 *   general  notifications, carrying the hand-offs (Round 9): refer to a colleague, a note, a
 *            callback, a task; the colleague hears at once
 *   promise  "The whole citizen, one click"
 *
 * Techniques (refs/techniques.md): #1 dot-grows-to-fill as an upright hex (the pop-up's
 * open button becomes the dashboard), #9 text-swap on a held card (the hand-offs), #10 loose-shape cluster-to-container merge (cases,
 * products, invoices and permits gather into the 360 view), #4 typewriter (the contact
 * moment typed while the knowledge items land).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene; typed characters.' },
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together and merge into one container.' },
]

/** Hook: the agent's queue, and the call pop-up at the right edge with its open button. */
function callUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The agent's work behind it: a quiet list of contact moments.
	panel(w, x, top, width, 12 + 5 * 80 + 12, u)
	;[220, 180, 240, 200, 170].forEach((lw, i) => {
		const cy = geom.anchor.y - 8 + i * 80
		if (i > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		circle(w, x + 64, cy, 18, C.cobalt200)
		bar(w, x + 100, cy - 10, lw, 10, C.cobalt300)
		bar(w, x + 100, cy + 8, lw * 0.5, 7, C.cobalt100)
	})
	// The call pop-up, slid in at the right: caller, a ringing pip, and Open (the one orange, as a ring).
	const pw = 420, px = geom.r - pw + 30, py = top + 250
	rect(w, px + 10, py + 12, pw, 250, C.cobalt200, 6 * u)
	panel(w, px, py, pw, 250, u)
	rect(w, px, py, pw, 10 * u, C.cobalt, 0)
	use(w, 'icon-contacts', px + 34, py + 60, 44, 44, C.cobalt)
	bar(w, px + 100, py + 64, 190, 16, C.cobalt900)
	bar(w, px + 100, py + 94, 130, 9, C.cobalt300)
	hex(w, px + pw - 50, py + 80, 12, C.mint, 2)
	button(w, px + 34, py + 160, 150, 56, u, { kind: 'ghost' })
	button(w, px + 204, py + 160, 180, 56, u, { kind: 'accent' })
}

/** Proof 1: the citizen dashboard, a 360 view: cases, products, invoices, permits round the person. */
function viewUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 140, u)
	circle(w, x + 70, top + 70, 40, C.cobalt300)
	bar(w, x + 130, top + 46, 260, 18, C.cobalt900)
	bar(w, x + 130, top + 80, 170, 9, C.cobalt300)
	statusPill(w, x + width - 150, top + 70, u)
	// Four tiles: each a kind of thing the citizen has, with its app glyph and two rows.
	const tiles = [['dossiq', 'cases'], ['shillinq', 'invoices'], ['dossiq', 'permits'], [null, 'contacts']]
	const tw = (width - 20) / 2, th = 200
	tiles.forEach(([id], i) => {
		const tx = x + (i % 2) * (tw + 20), ty = top + 170 + Math.floor(i / 2) * (th + 20)
		panel(w, tx, ty, tw, th, u)
		if (id) {
			hex(w, tx + 44, ty + 44, 22, C.cobalt, 3)
			use(w, `g-${id}`, tx + 30, ty + 30, 28, 28, C.white)
		} else {
			// Every contact with the citizen: letters (files), mail and chat, Nextcloud's own apps in Nextcloud blue.
			;['nc-files', 'nc-mail', 'nc-talk'].forEach((ic, k) => { hex(w, tx + 44 + k * 50, ty + 44, 20, C.nextcloud, 3); use(w, ic, tx + 32 + k * 50, ty + 32, 24, 24, C.white) })
		}
		bar(w, tx + (id ? 82 : 186), ty + 38, 110, 12, C.cobalt700)
		rect(w, tx + tw - 70, ty + 30, 44, 28, C.cobalt50, 14)
		for (let k = 0; k < 2; k++) {
			bar(w, tx + 30, ty + 100 + k * 44, tw * 0.5 - k * 40, 10, C.cobalt900)
			if (i === 3 && k === 0) statusPill(w, tx + tw - 150, ty + 104, u)
			else idlePill(w, tx + tw - 110, ty + 104 + k * 44, u)
		}
	})
	// The contacts, the last tile to land: ringed, the scene's one orange.
	const px = x + tw + 20, py = top + 170 + th + 20
	rect(w, px - 6, py - 6, tw + 12, th + 12, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the contact moment being typed, and the related knowledge items landing beside it. */
function knowledgeUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const fw = 470
	panel(w, x, top, fw, 520, u)
	bar(w, x + 36, top + 40, 150, 10, C.cobalt400)
	// The note, typed: two full lines and a third still going, with the cursor.
	rect(w, x + 36, top + 70, fw - 72, 220, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u })
	bar(w, x + 56, top + 98, 330, 10, C.cobalt900)
	bar(w, x + 56, top + 128, 300, 10, C.cobalt900)
	bar(w, x + 56, top + 158, 140, 10, C.cobalt900)
	rect(w, x + 56 + 148, top + 150, 3 * u, 26, C.cobalt)
	// Channel and subject chips, a save button.
	rect(w, x + 36, top + 320, 110, 36, C.cobalt50, 18)
	rect(w, x + 158, top + 320, 140, 36, C.lavender300, 18)
	button(w, x + fw - 196, top + 430, 160, 56, u)
	// The knowledge items: related articles appear as you type, linked to each other (a small graph).
	const kx = x + fw + 30, kw = width - fw - 30
	panel(w, kx, top, kw, 520, u)
	bar(w, kx + 30, top + 40, 120, 10, C.cobalt400)
	const nodes = [[kx + 70, top + 130], [kx + 70, top + 250], [kx + 70, top + 370]]
	rect(w, kx + 70 - 1.5 * u, top + 130, 3 * u, 240, C.cobalt200)
	nodes.forEach(([nx, ny], i) => {
		hex(w, nx, ny, 22, i === 0 ? C.cobalt : C.cobalt300, 3)
		bar(w, nx + 44, ny - 14, kw - 150 - i * 30, 11, C.cobalt900)
		bar(w, nx + 44, ny + 8, (kw - 150) * 0.6, 7, C.cobalt300)
	})
	rect(w, kx + 14, top + 90, kw - 28, 82, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'pipelinq',
	audience: { slug: 'kcc', name: 'Municipal contact centres', persona: 'Sanne de Wit, KCC officer; the head of the contact centre buys' },
	promise: 'The whole citizen,\none click',
	promiseLine: 'The whole citizen in one click: every case, invoice, permit and contact, the answer at hand while you talk, and nothing dropped when you hand it on',
	title: 'Pipelinq for contact centres',
	record: { one: 'citizen', many: 'citizens' },
	logline: 'For the municipal contact centre: the phone rings and one click opens the citizen; cases, invoices, permits, letters and chats in one view; the right knowledge appears while you type; and refer, note, call back or hand a task to a colleague, who hears at once.',
	references: REFS,
	techniques: ['#1 dot-grows-to-fill (as a hex)', '#10 cluster-to-container merge', '#4 typewriter', '#9 text-swap on a held card'],
	neighbours: ['dossiq', 'shillinq'],
	builtOnApps: ['dossiq'],
	hook: {
		title: 'The phone rings, the citizen opens',
		caption: 'The phone rings,\nthe citizen opens',
		ui: { drawUI: callUI, tagFill: 'cobalt' },
		source: 'Ruben, Round 8: "a call pop-up at the right of the screen that opens the citizen dashboard in one click"',
		motion: 'Frame 1 reads: caption, the agent\'s list in the window, the Pipelinq hex (cobalt: the one orange is the Open ring) on the loop anchor. On beat 2 the call pop-up slides in from the right edge (0.3 s, ease.brand) with a small flat shadow; its ringing pip pulses twice (scale 1.0 to 1.3, on the beat). On beat 5 Open presses (scale 0.97 and back). Out: technique #1, the Open button becomes an upright hex that grows past the frame (hexCut, ease.snap, one beat); its fill is the citizen dashboard\'s ground.',
		sound: 'Gentle open. Two soft ring pulses (a synth pluck, not a bell) as the pip beats, a dry click on Open, a whoosh through the hex.',
	},
	proofs: [
		{
			id: 'view',
			title: 'Cases, invoices, letters, chats, one view',
			caption: 'Cases, invoices, letters,\nchats, one view',
			source: 'Ruben, Round 8: "360° citizen view (all cases, products, invoices, permits)" and "every contact with the citizen (letters, mail, chat) on that dashboard"; positioning pipelinq sp-360-timeline',
			motion: 'Technique #10, cluster-to-container merge. The hex shrinks into the citizen\'s avatar. Four loose hexes (cases, invoices, permits, and the contacts carrying Nextcloud\'s Files, Mail and Talk in Nextcloud blue) sit scattered over the window, then each tweens into its tile on ease.brand, all landing within one beat; the tiles\' rows drop in a sixteenth apart, and the contacts tile, the last to land, takes the orange ring.',
			sound: 'Four ticks as the tiles land, a pluck as the last tile is ringed.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Cases, invoices, letters,\nchats, one view', drawUI: viewUI, tagFill: 'cobalt' }),
		},
		{
			id: 'knowledge',
			title: 'Start typing, the answer appears',
			caption: 'Start typing,\nthe answer appears',
			source: 'Ruben, Round 8: "related knowledge items (xWiki knowledge graph) appear while typing a contact moment"',
			motion: 'Push down to the contact moment. Technique #4, typewriter: the note types itself (greeked characters one pair per 0.1 s, hard on and off, a cursor). After the first line, related knowledge items land in the panel on the right one per beat, linked by a thin line (a small graph), and the best match takes the orange ring. The caption rises as the typing starts.',
			sound: 'Soft key ticks under the typing, a pluck as each item lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Start typing,\nthe answer appears', drawUI: knowledgeUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'Refer, note, call back, nobody drops it',
		caption: 'Refer, note, call back:\nnobody drops it',
		source: 'Ruben, Round 8 and 9: "refer to a colleague, callback note, notes on cases, tasks for colleagues"; story.json mechanic 8 (the right colleague hears in the Nextcloud notifications)',
		motion: 'Technique #9, text-swap on a held card: the citizen\'s record card holds on the right; its action chip swaps one per beat (refer, note, call back, task: the old chip leaves upward as the new rises, 4 frames), and on the last the stage marker steps on, a pulse runs down the wire to the Nextcloud header and the colleague\'s notice drops in on top of the list. The caption holds whole. Out: the card steps down and the app tag travels to its cell in the promise cluster.',
		params: {
			record: { avatar: 'person', title: 240, sub: 150, status: 'none' },
			event: { stage: 2, stages: 4 },
			notices: [{ app: 'pipelinq' }, { icon: 'nc-mail' }, { icon: 'nc-talk' }],
			recipients: [C.cobalt300, C.lavender300],
		},
		sound: 'Four soft clicks as the chip swaps, a dry click as the notice lands (no bell).',
	},
}

export const { meta, boards } = audienceFilm(content)
