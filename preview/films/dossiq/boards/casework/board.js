/**
 * Dossiq, audience film: municipal casework (municipalities and the social domain).
 * ROUND 21 (Ruben): the whole pitch is a decision-making tool: the right decision, when it is needed and
 * the way it is needed, on the right information from the whole workspace. Question "What if every
 * decision was right, on time?"; the backlog shows every decision due, the case holds the whole
 * workspace, guidance appears as you decide, the standards stay, the flow follows your decision, and
 * the share scene becomes the decision's trail ("Every decision, on the record").
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Reworked in Round 8
 * (no AI: the general slot is the flow builder) and Round 9 (Ruben, 2026-09-28): the knowledge
 * graph is back, a standards beat is added, and "You decide who sees this case" is dropped as
 * the weakest beat. Positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     the team's work backlog: every case in lanes, working as a team (Round 8 note;
 *            Dossiq specs my-work, add-work-queue, werkvoorraad-intelligent-queue)
 *   (Round 15: the letter-and-knowledge scene is split in two; the body grows to 12 bars, 32 words)
 *   proof 1  documents: a case's attached documents edited right in the case, in Nextcloud's own
 *            office editor, or created from a template (Round 8 and 15 notes; Dossiq specs
 *            document-zaakdossier, template-library, beschikking-generatie)
 *   proof 2  knowledge: related knowledge (the knowledge graph) lands while you work the case, the
 *            same device as the Pipelinq contact-centre film (Round 9 and 15 notes)
 *   proof 3  standards: CMMN (international), ZGW (Dutch), OIO Sag og Dokument (Danish; added
 *            to the specs in ConductionNL/dossiq#3174, Ruben 2026-09-28). Sources:
 *            procest origin/development openspec/specs/case-management/spec.md:17 and
 *            case-types/spec.md:27 ("Standards: CMMN 1.1 ... ZGW"); positioning dossiq.md:96,
 *            104, 290 ("speak the ZGW case standard")
 *   general  flows: draw flows, share in the store (Round 8 note)
 *   promise  "The whole team, every case"
 *
 * Techniques (refs/techniques.md): #10 loose-shape cluster-to-container merge (the backlog),
 * #1 dot-grows-to-fill as an upright hex (into the documents), #4 typewriter with knowledge items
 * landing (as in the Pipelinq contact-centre film), #5 stepped hex wipe (into the standards).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { el, textBlock, measure } from '../../../_lib/stage.js'
import { ease } from '../../../_lib/core.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, docPage, button, dotCanvas, flowNode } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'A stepped wipe of flat shapes between chapters.' },
]

/**
 * Hook: the backlog in team lanes (new, mine, the team's), each case with its type and owner.
 * `a` is the film's animation state (defaults = the resting frame the storyboard shows):
 * a.card(c, i) -> { dx, dy, o } for each card, a.ring 0..1 for the picked-up card's ring.
 */
export function backlogUI(w, geom, a = {}) {
	const root = w
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const lw = (width - 40) / 3
	const lanes = [[190, 160, 210, 170], [200, 150], [180, 220, 160]]
	lanes.forEach((cards, c) => {
		const lx = x + c * (lw + 20)
		rect(w, lx, top, lw, 560, C.cobalt50, 4 * u)
		bar(w, lx + 20, top + 26, 100, 10, C.cobalt700)
		rect(w, lx + lw - 56, top + 20, 36, 22, C.cobalt100, 11)
		cards.forEach((cw, i) => {
			const m = a.card ? a.card(c, i) : null
			if (m && m.o <= 0.001) return
			const cg = m ? el('g', { transform: `translate(${m.dx.toFixed(1)} ${m.dy.toFixed(1)})`, opacity: m.o.toFixed(3) }, w) : w
			w = cg
			const cy = top + 66 + i * 118
			panel(w, lx + 12, cy, lw - 24, 104, u)
			hex(w, lx + 44, cy + 34, 14, i === 0 && c === 0 ? C.lavender : C.cobalt300, 2)
			bar(w, lx + 70, cy + 26, Math.min(cw, lw - 110), 10, C.cobalt900)
			bar(w, lx + 70, cy + 46, Math.min(cw, lw - 110) * 0.5, 7, C.cobalt300)
			circle(w, lx + lw - 50, cy + 74, 14, c === 1 ? C.cobalt400 : C.cobalt200)
			// Round 18: every case shows its deadline, a term track (how much of the term is used).
			const dl = [0.3, 0.55, 0.8, 0.45][(i + c) % 4]
			rect(w, lx + 30, cy + 70, 120, 8, C.cobalt100, 4)
			rect(w, lx + 30, cy + 70, 120 * dl, 8, dl > 0.75 ? C.lavender : C.cobalt400, 4)
			w = root
		})
	})
	// The case just picked up by a colleague: its card ringed, the scene's one orange.
	const ring = a.ring ?? 1
	if (ring > 0.001) {
		const rs = 1 + 0.12 * (1 - ring), rcx = x + (lw + 20) + lw / 2, rcy = top + 60 + 118 + 58
		const rg = el('g', { transform: `translate(${rcx} ${rcy}) scale(${rs.toFixed(3)}) translate(${-rcx} ${-rcy})`, opacity: Math.min(1, ring * 2).toFixed(3) }, w)
		rect(rg, x + (lw + 20) + 6, top + 60 + 118, lw - 12, 116, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	}
	return { ringCentre: [x + (lw + 20) + lw / 2, top + 60 + 118 + 58] }
}

/**
 * Proof 1: documents. The case's attached documents on the left; one is open in Nextcloud's own
 * office editor on the right, being edited right there, and a new one comes from a template.
 * a.open 0..1 the editor slides in, a.fill 0..1 the template's values fill, a.edit 0..1 the edited
 * line types on (stepped), a.ring 0..1 the open document's row ringed.
 */
export function documentsUI(w, geom, a = {}) {
	const A = { open: 1, fill: 1, edit: 1, ring: 1, ...a }
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The case's documents: file rows, the open one ringed (the one orange), a template chip.
	const lw = 300
	panel(w, x, top, lw, 580, u)
	bar(w, x + 30, top + 40, 120, 10, C.cobalt400)
	;[190, 150, 170, 130].forEach((fw, i) => {
		const cy = top + 110 + i * 70
		// Round 21: the case's items come from the whole workspace: a mail, a document, a meeting, a chat.
		const src = ['nc-mail', 'nc-files', 'nc-calendar', 'nc-talk'][i]
		rect(w, x + 26, cy - 20, 40, 40, C.nextcloud, 4)
		el('use', { href: `#${src}`, x: x + 32, y: cy - 14, width: 28, height: 28, color: C.white }, w)
		bar(w, x + 76, cy - 10, fw * 0.9, 10, C.cobalt900)
		bar(w, x + 76, cy + 8, fw * 0.5, 7, C.cobalt300)
	})
	// The second row, clear of the app tag on the loop anchor.
	if (A.ring > 0.001) rect(w, x + 14, top + 180 - 34, lw - 28, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: A.ring.toFixed(3) })
	// New from a template: a dashed row with a plus.
	rect(w, x + 30, top + 420, lw - 60, 60, 'none', 4 * u, { stroke: C.cobalt300, 'stroke-width': u, 'stroke-dasharray': '10 8' })
	rect(w, x + 50, top + 448, 24, 4, C.cobalt400)
	rect(w, x + 60, top + 438, 4, 24, C.cobalt400)
	bar(w, x + 90, top + 445, 120, 9, C.cobalt400)
	// The editor: Nextcloud's own office editing, the document open in it.
	const ex = x + lw + 30, ew = width - lw - 30
	const eg = el('g', { transform: `translate(${(60 * (1 - A.open)).toFixed(1)} 0)`, opacity: Math.min(1, A.open * 2).toFixed(3) }, w)
	panel(eg, ex, top, ew, 580, u)
	const k = (ew - 60) / 500
	docPage(eg, ex + 30, top + 80, ew - 60, 600, { k, values: [118, 96, 72].map((v, i) => v * Math.max(0, Math.min(1, A.fill * 3 - i))), lastOrange: false, shadow: null })
	const tw = 250 * k * Math.floor(A.edit * 12) / 12
	if (tw > 0) bar(eg, ex + 30 + 44 * k, top + 80 + 190 * k, tw, 10 * k, C.cobalt900)
	rect(eg, ex + 30 + 44 * k + tw + 4, top + 80 + 184 * k, 3 * u, 22, C.cobalt)
	rect(eg, ex, top, ew, 56, C.nextcloud, 0)
	for (let i = 0; i < 6; i++) rect(eg, ex + 24 + i * 44, top + 16, 28, 24, C.white, 3, { opacity: 0.85 })
}

/**
 * Proof 2: knowledge, the same device as the Pipelinq contact-centre film: the case note being
 * typed on the left, related knowledge (the knowledge graph) landing in the panel on the right.
 * a.type 0..1 the note types on (stepped), a.items 0..3 items landed, a.ring 0..1 best match ringed.
 */
export function knowledgeUI(w, geom, a = {}) {
	const A = { type: 1, items: 3, ring: 1, ...a }
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const fw = 470
	panel(w, x, top, fw, 520, u)
	bar(w, x + 36, top + 40, 150, 10, C.cobalt400)
	rect(w, x + 36, top + 70, fw - 72, 220, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u })
	// The note, typed in steps: three lines' worth, the cursor at the end.
	const total = 330 + 300 + 140
	const done = total * Math.floor(A.type * 20) / 20
	const lines = [330, 300, 140]
	let rest = done, cx = x + 56, cy = top + 98
	lines.forEach((lw, i) => {
		const l = Math.max(0, Math.min(lw, rest))
		rest -= lw
		if (l > 0) bar(w, x + 56, top + 98 + i * 30, l, 10, C.cobalt900)
		if (l > 0) { cx = x + 56 + l; cy = top + 98 + i * 30 }
	})
	rect(w, cx + 8, cy - 8, 3 * u, 26, C.cobalt)
	rect(w, x + 36, top + 320, 110, 36, C.cobalt50, 18)
	rect(w, x + 158, top + 320, 140, 36, C.lavender300, 18)
	button(w, x + fw - 196, top + 430, 160, 56, u)
	const kx = x + fw + 30, kw = width - fw - 30
	panel(w, kx, top, kw, 520, u)
	bar(w, kx + 30, top + 40, 120, 10, C.cobalt400)
	rect(w, kx + 70 - 1.5 * u, top + 130, 3 * u, 240 * Math.min(1, A.items / 3), C.cobalt200)
	;[[top + 130, C.cobalt], [top + 250, C.cobalt300], [top + 370, C.cobalt300]].forEach(([ny, f], i) => {
		const p = Math.max(0, Math.min(1, A.items - i))
		if (p <= 0.001) return
		const ig = el('g', { transform: `translate(0 ${(24 * (1 - p)).toFixed(1)})`, opacity: p.toFixed(3) }, w)
		hex(ig, kx + 70, ny, 22, f, 3)
		bar(ig, kx + 114, ny - 14, kw - 150 - i * 30, 11, C.cobalt900)
		bar(ig, kx + 114, ny + 8, (kw - 150) * 0.6, 7, C.cobalt300)
	})
	if (A.ring > 0.001) rect(w, kx + 14, top + 90, kw - 28, 82, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: A.ring.toFixed(3) })
}

/**
 * Proof 2: one case, kept in three standards: the international case model, the Dutch and the Danish case standard.
 * a.wire 0..1 the wires draw down, a.split 0..1 the orange split hex pops, a.boxes 0..3 boxes landed.
 */
export function standardsUI(w, geom, a = {}) {
	// a.fields(i) 0..1 the rows of box i fill; a.swap 0..1 the Dutch head swaps "ZGW" for "ZGW / StUF"
	// on the held diagram (#9 text-swap, the archiving film's device).
	const A = { wire: 1, split: 1, boxes: 3, fields: () => 1, swap: 1, ...a }
	const { u } = geom
	// Narrower than the window's column, so every label and tag ends inside the text safe box
	// (x 1800 on stage; the window shows mock space at 0.8 from x 940).
	const x = geom.x, top = geom.anchor.y - 60, width = Math.min(geom.r - geom.x, 752)
	// The case.
	panel(w, x, top, width, 130, u)
	hex(w, x + 64, top + 65, 28, C.lavender, 4)
	bar(w, x + 120, top + 44, 260, 16, C.cobalt900)
	bar(w, x + 120, top + 76, 170, 9, C.cobalt300)
	statusPill(w, x + width - 160, top + 65, u)
	// Square-cornered wires down to the three standards, splitting at one orange hex.
	const gap = 20, bw = (width - 2 * gap) / 3, by = top + 220
	const cx = (i) => x + i * (bw + gap) + bw / 2
	// The wires draw in three legs: down from the case, along, then down into each box.
	const w1 = Math.min(1, A.wire * 3), w2 = Math.max(0, Math.min(1, A.wire * 3 - 1)), w3 = Math.max(0, Math.min(1, A.wire * 3 - 2))
	if (w1 > 0) rect(w, x + 64 - 1.5 * u, top + 130, 3 * u, 50 * w1, C.cobalt300)
	if (w2 > 0) rect(w, x + 64, top + 178, (cx(2) - x - 64) * w2, 3 * u, C.cobalt300)
	if (w3 > 0) for (let i = 0; i < 3; i++) rect(w, cx(i) - 1.5 * u, top + 178, 3 * u, (by - top - 178) * w3, C.cobalt300)
	if (A.split > 0.001) hex(w, cx(1), top + 178 + 1.5 * u, 16 * A.split, C.orange, 2)
	const root = w
	const box = (i, label, where) => {
		const p = Math.max(0, Math.min(1, A.boxes - i))
		w = p < 1 ? el('g', { transform: `translate(0 ${(40 * (1 - p)).toFixed(1)})`, opacity: p.toFixed(3) }, root) : root
		const bx = x + i * (bw + gap)
		panel(w, bx, by, bw, 360, u)
		rect(w, bx, by, bw, 130, C.cobalt50, 0)
		// A long name breaks over two lines inside its box head; under it, where the standard holds
		// (Round 15: one international standard, two local ones), as a small tag.
		const two = typeof label === 'string' && label.includes('\n')
		if (typeof label === 'string') textBlock(w, label, { x: bx + 18, y: by + 40, size: 34, weight: 600, fill: C.cobalt, lineHeight: 1.05, clip: false })
		else label(w, bx)
		const ty = by + (two ? 86 : 62)
		const tagW = measure(where, { size: 28, weight: 600 }) + 18
		rect(w, bx + 14, ty, tagW, 38, where === 'International' ? C.cobalt : C.cobalt200, 19)
		textBlock(w, where, { x: bx + 22, y: ty + 27, size: 28, weight: 600, fill: where === 'International' ? C.white : C.cobalt900, clip: false })
		return bx
	}
	// The international case model: a plan of stages and tasks.
	if (A.boxes <= 0.001) return
	const b0 = box(0, 'CMMN 1.1', 'International')
	rect(w, b0 + 22, by + 150, bw - 44, 180, 'none', 12 * u, { stroke: C.cobalt300, 'stroke-width': u })
	;[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([c, r], k) => { if (A.fields(0) * 4 - k > 0.001) rect(w, b0 + 42 + c * ((bw - 84) / 2 + 10), by + 170 + r * 76, (bw - 104) / 2, 52, C.cobalt100, 6 * u) })
	// The Dutch and the Danish case standards: their fields filled.
	// OIO sits in the middle box so its long label stays inside the text safe box (x 1800).
		// The Dutch head: "ZGW" swaps for "ZGW / StUF" in its clip (#9); at rest it names both.
	const dutch = (g, bx) => {
		const q = A.swap
		const words = q <= 0 ? [['ZGW', 0]] : q >= 1 ? [['ZGW / StUF', 0]] : [['ZGW', -40 * ease.exit(q)], ['ZGW / StUF', 40 * (1 - ease.brand(q))]]
		for (const [wd, dy] of words) {
			const blk = textBlock(g, wd, { x: bx + 18, y: by + 40, size: 34, weight: 600, fill: C.cobalt, clip: true })
			if (Math.abs(dy) > 1e-3) for (const it of blk.items) it.node.setAttribute('transform', `translate(0 ${dy.toFixed(2)})`)
		}
	}
	;[[1, 'OIO Sag og\nDokument', 'Denmark'], [2, dutch, 'Netherlands']].forEach(([i, label, where]) => {
		if (A.boxes - i <= 0.001) return
		const bx = box(i, label, where)
		for (let k = 0; k < 3; k++) {
			const fp = Math.max(0, Math.min(1, A.fields(i) * 3 - k))
			const fy = by + 176 + k * 56
			bar(w, bx + 22, fy, 70 * fp, 8, C.cobalt400)
			bar(w, bx + 108, fy - 2, (bw - 150 - k * 14) * fp, 11, C.cobalt900)
		}
	})
}

/**
 * Proof 4 (the shared capability, told in Dossiq's own UI): automate. A flow drawn on the canvas
 * (trigger, check, action, square edges), and below it the case step the flow now does.
 * a.nodes 0..3 nodes placed, a.edges 0..1 edges drawn, a.done 0..1 the step taken over, a.ring 0..1.
 */
export function automateUI(w, geom, a = {}) {
	const A = { nodes: 3, edges: 1, done: 1, ring: 1, ...a }
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The canvas.
	panel(w, x, top, width, 300, u)
	dotCanvas(w, x + 12, top + 12, width - 24, 276, u)
	const nw = 200, nh = 90, gap = (width - 60 - 3 * nw) / 2, ny = top + 105
	const nx = (i) => x + 30 + i * (nw + gap)
	for (let i = 0; i < 2; i++) {
		const e = Math.max(0, Math.min(1, A.edges * 2 - i))
		if (e > 0) rect(w, nx(i) + nw, ny + nh / 2 - 1.5 * u, gap * e, 3 * u, C.cobalt300)
	}
	for (let i = 0; i < 3; i++) {
		const p = Math.max(0, Math.min(1, A.nodes - i))
		if (p <= 0.001) continue
		const ng = el('g', { transform: `translate(0 ${(-30 * (1 - p)).toFixed(1)})`, opacity: p.toFixed(3) }, w)
		flowNode(ng, nx(i), ny, nw, nh, u, { kind: i === 0 ? 'trigger' : i === 2 ? 'end' : 'step' })
	}
	// The case's steps: the one the flow does is ticked, with the flow's mark beside it.
	const ly = top + 330
	panel(w, x, ly, width, 12 + 3 * 76 + 12, u)
	;[210, 170, 230].forEach((lw, i) => {
		const cy = ly + 50 + i * 76
		if (i > 0) rect(w, x + 24, cy - 38, width - 48, u, C.cobalt50)
		const taken = i === 1
		hex(w, x + 60, cy, 16, taken && A.done > 0.5 ? C.mint : C.cobalt200, 2)
		bar(w, x + 96, cy - 10, lw, 10, C.cobalt900)
		bar(w, x + 96, cy + 8, lw * 0.5, 7, C.cobalt300)
		if (taken && A.done > 0.5) statusPill(w, x + width - 160, cy, u)
		else idlePill(w, x + width - 150, cy, u)
		if (taken) {
			// The flow's small mark: three linked dots, the edge the step now runs on.
			for (let k = 0; k < 3; k++) circle(w, x + width - 270 + k * 22, cy, 6, C.lavender)
			rect(w, x + width - 270, cy - 1.5, 44, 3, C.lavender)
		}
	})
	if (A.ring > 0.001) rect(w, x + 14, ly + 50 + 76 - 34, width - 28, 68, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: A.ring.toFixed(3) })
}

/**
 * Proof 5: share. A council's case type and flow go to the store (a side box, not a hex: it is
 * not an app here) and land at a second organisation. a.go 0..1 the two cards travel to the store,
 * a.land 0..1 they land on the other side, a.ring 0..1 the arrival ringed.
 */
export function shareUI(w, geom, a = {}) {
	const A = { go: 1, land: 1, ring: 1, ...a }
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = Math.min(geom.r - geom.x, 752)
	const cw = 220, ch = 110
	// Two organisations, left and right, each a column with its avatar and a list.
	const org = (ox, filled) => {
		panel(w, ox, top, cw + 40, 520, u)
		circle(w, ox + 50, top + 50, 24, C.cobalt300)
		bar(w, ox + 86, top + 42, 120, 12, C.cobalt900)
		for (let i = 0; i < 2; i++) rect(w, ox + 20, top + 110 + i * (ch + 20), cw, ch, filled ? C.white : 'none', 4 * u, filled ? { stroke: C.cobalt100, 'stroke-width': u } : { stroke: C.cobalt200, 'stroke-width': u, 'stroke-dasharray': '8 8' })
	}
	org(x, true)
	org(x + width - cw - 40, false)
	// The store in the middle: a side box with a shelf.
	const sx = x + cw + 40 + 30, sw = width - 2 * (cw + 40) - 60
	rect(w, sx, top + 150, sw, 220, C.cobalt50, 4 * u, { stroke: C.cobalt300, 'stroke-width': u })
	rect(w, sx, top + 150, sw, 44, C.cobalt700, 0)
	bar(w, sx + 20, top + 166, 70, 10, C.white)
	for (let i = 0; i < 3; i++) rect(w, sx + 20 + i * ((sw - 40) / 3), top + 230, (sw - 40) / 3 - 10, 90, C.white, 3 * u)
	// The two cards: a case type (lavender status dots) and a flow (three linked nodes).
	const card = (g, cx0, cy0, kind) => {
		panel(g, cx0, cy0, cw, ch, u)
		if (kind === 'type') { for (let k = 0; k < 4; k++) hex(g, cx0 + 30 + k * 40, cy0 + 36, 10, k < 2 ? C.lavender : C.cobalt200, 2); bar(g, cx0 + 20, cy0 + 70, 140, 10, C.cobalt900) }
		else { for (let k = 0; k < 3; k++) rect(g, cx0 + 20 + k * 66, cy0 + 26, 46, 30, C.cobalt100, 3 * u); rect(g, cx0 + 66, cy0 + 40, 20, 3, C.cobalt300); rect(g, cx0 + 132, cy0 + 40, 20, 3, C.cobalt300); bar(g, cx0 + 20, cy0 + 76, 120, 9, C.cobalt700) }
	}
	const lx = x + 20, rx = x + width - cw - 20
	;['type', 'flow'].forEach((kind, i) => {
		const cy0 = top + 110 + i * (ch + 20)
		card(w, lx, cy0, kind)
		// The copy: from the left column into the store, then out to the right column.
		const go = Math.max(0, Math.min(1, A.go * 1.6 - i * 0.6)), land = Math.max(0, Math.min(1, A.land * 1.6 - i * 0.6))
		if (go <= 0.001) return
		const midX = sx + sw / 2 - cw / 2, midY = top + 200 + i * 40
		const px = land > 0 ? midX + (rx - midX) * land : lx + (midX - lx) * go
		const py = land > 0 ? midY + (cy0 - midY) * land : cy0 + (midY - cy0) * go
		card(el('g', {}, w), px, py, kind)
	})
	if (A.ring > 0.001) rect(w, rx - 6, top + 110 - 6, cw + 12, 2 * ch + 20 + 12, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: A.ring.toFixed(3) })
}

/**
 * Proof 5 (Round 21): the decision and its trail. The decision card, signed and locked, and under it
 * the trail: who supplied which fact, who decided, when, each on its own row, the decision's row ringed.
 * a.rows 0..5 trail rows landed, a.sign 0..1 the signature drawn, a.ring 0..1.
 */
export function trailUI(w, geom, a = {}) {
	const A = { rows: 5, sign: 1, ring: 1, ...a }
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The decision: status decided (mint), the signature in steps, the lock.
	panel(w, x, top, width, 170, u)
	hex(w, x + 64, top + 60, 28, C.lavender, 4)
	bar(w, x + 120, top + 44, 260, 16, C.cobalt900)
	bar(w, x + 120, top + 76, 170, 9, C.cobalt300)
	statusPill(w, x + width - 160, top + 60, u)
	const steps = [[0, 0, 40], [40, -12, 30], [70, 6, 36], [106, -8, 44], [150, 4, 30]]
	steps.forEach(([dx, dy, lw], i) => { if (A.sign * 5 - i > 0) rect(w, x + 120 + dx, top + 126 + dy, lw * Math.min(1, A.sign * 5 - i), 5, C.cobalt700, 2) })
	rect(w, x + 120, top + 146, 220, 3, C.cobalt300)
	// The trail: each fact and step, who and when.
	const ty = top + 200
	panel(w, x, ty, width, 12 + 5 * 70 + 12, u)
	const rows = [['nc-mail', 200], ['nc-files', 170], ['nc-calendar', 150], [null, 210], [null, 180]]
	rows.forEach(([icon, lw], i) => {
		const p = Math.max(0, Math.min(1, A.rows - i))
		if (p <= 0.001) return
		const cy = ty + 47 + i * 70
		const rg = el('g', { opacity: p.toFixed(3), transform: `translate(0 ${(16 * (1 - p)).toFixed(1)})` }, w)
		if (i > 0) rect(rg, x + 24, cy - 35, width - 48, u, C.cobalt50)
		circle(rg, x + 60, cy, 18, i % 2 ? C.cobalt200 : C.cobalt300)
		if (icon) { rect(rg, x + 92, cy - 16, 32, 32, C.nextcloud, 4); el('use', { href: `#${icon}`, x: x + 97, y: cy - 11, width: 22, height: 22, color: C.white }, rg) }
		else hex(rg, x + 108, cy, 14, C.lavender, 2)
		bar(rg, x + 140, cy - 8, lw, 10, C.cobalt900)
		bar(rg, x + width - 170, cy - 4, 110, 8, C.cobalt200)
	})
	if (A.ring > 0.001) rect(w, x + 14, ty + 47 + 3 * 70 - 32, width - 28, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: A.ring.toFixed(3) })
}

const content = {
	app: 'dossiq',
	audience: { slug: 'casework', name: 'Municipal casework', persona: 'Mireille Hendriks, case handler; Femke van Dijk, social-domain consultant; the manager of public services buys' },
	promise: 'What if every decision\nwas right, on time?',
	promiseLine: 'Right decisions, on time: decisions due in one backlog, the facts from the whole workspace in the case, guidance as you decide, international and local standards built in, a flow that follows your decision, and every decision on the record',
	title: 'Dossiq for municipal casework',
	record: { one: 'case', many: 'cases' },
	logline: 'Round 21: Dossiq as a decision-making tool for municipal and social-domain casework. Decisions due in one backlog with its deadline, the whole workspace (mail, files, meetings, chats) in the case, guidance as you decide, international and local standards built in, a flow that follows the decision, and every decision on the record. No AI in this film.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge', '#1 dot-grows-to-fill (as a hex)', '#4 typewriter (as in the Pipelinq contact-centre film)', '#5 stepped hex wipe'],
	maxWords: 40,
	promiseFirst: true,
	promiseMotion: 'Round 15: the body opens here, straight after the opening\'s handover. The Dossiq cell pops in on the opening\'s field, on the loop anchor, and turns orange; the neighbour cells lock in and the Nextcloud hex settles, while the field fades from the opening\'s shading. "Dossiq" sits as the chapter mark; the promise rises under it as a question, "What if every case met its deadline?" (Round 19: no answer card; the proofs answer it). Out on the bar line: a hard cut to the backlog.',
	neighbours: ['portaliq', 'filinq'],
	builtOnApps: ['filinq'],
	hook: {
		title: 'Decisions due, one backlog',
		caption: 'Decisions due,\none backlog',
		ui: { drawUI: backlogUI, tagFill: 'cobalt' },
		source: 'Ruben, Round 8: "work backlog, overview, working in teams"; Dossiq specs my-work, add-work-queue, werkvoorraad-intelligent-queue, reassignment-bulk-action',
		motion: 'Technique #10, cluster-to-container merge. In behind the app hex the promise leaves on the loop anchor: caption, the backlog in three lanes, each case with its deadline track (Round 18), the Dossiq hex (cobalt: the one orange is the picked-up case) on the loop anchor. Over the first two beats the case cards start as loose hexes scattered over the window and each tweens into its lane on ease.brand, arriving within one beat. On beat 5 one card moves from the team\'s lane to a colleague\'s (ease.snap) and takes the orange ring.',
		sound: 'Gentle open. A run of soft ticks as the cards land, a pluck as the case changes hands.',
	},
	proofs: [
		{
			id: 'documents',
			title: 'The whole workspace, in the case',
			caption: 'The whole workspace,\nin the case',
			source: 'Ruben, Round 8 ("automatic document creation and editing documents (Word files) from inside the case through Nextcloud") and Round 15 (edit a case\'s attached documents from the workspace, or create them from templates); Dossiq specs document-zaakdossier, template-library, beschikking-generatie',
			motion: 'Technique #1: the picked-up case\'s ring becomes an upright hex that grows past the frame (hexCut, ease.snap, one beat) and lands as the case\'s documents. The second document\'s row takes the orange ring and the editor slides in beside it under Nextcloud\'s blue toolbar; the template\'s values fill a sixteenth apart, then one line is edited on. No second window, no download: right in the case.',
			sound: 'A whoosh through the hex, a soft click as the editor opens, three plucks as the values fill, light key ticks.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'The whole workspace,\nin the case', drawUI: documentsUI, tagFill: 'cobalt' }),
		},
		{
			id: 'knowledge',
			title: 'Guidance appears as you decide',
			caption: 'Guidance appears\nas you decide',
			source: 'Ruben, Round 9 and 15: the knowledge graph, related knowledge appearing while you work the case, the same device as the Pipelinq contact-centre film ("Start typing, the answer appears")',
			motion: 'Technique #4, typewriter, as in the Pipelinq contact-centre film: the case note types itself on (greeked characters in steps, hard on and off, a cursor); after the first line the related knowledge items land in the panel on the right one per beat, linked by a thin line, and the best match takes the orange ring. Out: technique #5, four upright hexes step in from the right edge 70 ms apart.',
			sound: 'Soft key ticks under the typing, a pluck as each item lands, four dry clicks on the wipe.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Guidance appears\nas you decide', drawUI: knowledgeUI, tagFill: 'cobalt' }),
		},
		{
			id: 'standards',
			title: 'International and local standards, built in',
			caption: 'International and local\nstandards, built in',
			source: 'Dossiq specs: case-management/spec.md:17 and case-types/spec.md:27 (Standards: CMMN 1.1, ZGW; on origin/development), plus OIO Sag og Dokument (Denmark) added to the same two lines in ConductionNL/dossiq#3174 (Ruben, 2026-09-28, open, not merged); positioning dossiq.md:96,104 (ZGW).',
			motion: 'The archiving film\'s standards design (Round 15): the window whips in from the right in 5 frames (ease.snap); the case lands; square-cornered wires draw down, along, then down into three boxes, and the orange split hex pops as they split; the boxes land a half beat apart and their rows fill one per sixteenth. Each head names its standard with a small tag under it: CMMN 1.1 International, OIO Sag og Dokument Denmark, and the Dutch box, where technique #9 swaps the held head from "ZGW" to "ZGW / StUF" on beat 5 while the wires hold.',
			sound: 'Four dry clicks on the wipe, a line-draw hiss, a pluck as each box fills.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'International and local\nstandards, built in', drawUI: standardsUI, tagFill: 'cobalt' }),
		},
		{
			id: 'automate',
			title: 'You decide, the flow follows',
			caption: 'You decide,\nthe flow follows',
			source: 'Ruben, Round 8 (flow builder) and Round 15 (users automate their own work by drawing a flow; show the case step it takes over); Dossiq specs visual-workflow-editor, workflow-definitions-to-flow, automatic-actions; story.json mechanic 7 (the customer draws each flow, never pre-built)',
			motion: 'The shared capability, told in Dossiq\'s own window, as the decision\'s follow-through (Round 21). The canvas lands; the flow\'s three nodes are placed one per sixteenth (the decision taken, a check, the action), square-cornered edges draw between them. On the next beat the camera eases down to the case\'s steps: the step that follows the decision turns mint and done, the flow\'s mark beside it, and its row takes the orange ring. You decided; the flow did the rest.',
			sound: 'A tick per node, a soft hiss per edge, a crisp click as the step turns done.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'You decide,\nthe flow follows', drawUI: automateUI, tagFill: 'cobalt' }),
		},
		{
			id: 'trail',
			title: 'Every decision, on the record',
			caption: 'Every decision,\non the record',
			source: 'Ruben, Round 21 (the decision and its trail); story.json mechanics 0 (every change logged, who and when); Dossiq specs besluitvorming-workflow, beschikking-generatie, case-history-surface, libresign-besluit-signing',
			motion: 'The decision lands signed: the signature draws in five flat strokes, the status turns decided. Under it the trail fills a sixteenth apart, the facts it rested on first (a mail, a document, a meeting from the workspace), then the steps; on the beat the decision\'s own row takes the orange ring. The body ends here, a hard cut on the bar to Built on Nextcloud, where the workspace the facts came from is drawn.',
			sound: 'Five soft ticks for the signature, a run of ticks as the trail fills, a pluck as the decision is ringed.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every decision,\non the record', drawUI: trailUI, tagFill: 'cobalt' }),
		},
	],

}

export const { meta, boards } = audienceFilm(content)
