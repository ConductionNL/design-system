/**
 * Portaliq, the one Portaliq film (Round 29 and 29b, Ruben, 2026-09-29): the citizen portal film and
 * the customer portal film folded into one, told to the functional admins of municipalities and
 * housing corporations. The admin designs the portal first; then the film shows what clients (or
 * citizens) do on it, and how a form on it feeds a table in Nextcloud.
 *
 *   promise   "What if clients (or citizens) did it themselves?" (the admin's question)
 *   hook      the page builder, inside Nextcloud: blocks dragged onto a grid, a portal page assembling
 *   login     the client logs in to the portal (Round 29c: the turn from the admin's side to the client's)
 *   overview  one view: every ticket (case), product and invoice
 *   status    clients follow every ticket, step by step
 *   actions   open a ticket on a product, add a file to a ticket, pay an invoice
 *   inbox     every mail, letter and chat, in one inbox
 *   profile   clients update their own address and bank details
 *   mobile    all of it on the phone (from the customer film)
 *   forms     a Nextcloud Forms form on the portal page; the answers land as rows in Nextcloud Tables
 *
 * Round 29b: only the page builder and Tables run inside Nextcloud (ncWindow: the dark top bar and
 * the app nav). The pages clients see stand on their own (pageFrame: a browser bar and the
 * organisation's own head). Naming: "clients (or citizens)" and "ticket (case)" on first mention,
 * then "clients" and "tickets"; no "residents".
 *
 * 22-bar body (appfilm PLANS[8], promise first): promise 8 beats, builder 10, login 8, overview 10,
 * status 8, actions 10, inbox 8, profile 8, mobile 8, forms 10. The old citizens and customers boards stay in
 * the repo; the storyboard page carries this one.
 *
 * Sources: the Portaliq boards citizens (round 25) and customers (round 7); Portaliq positioning
 * usp-fleet-data-in-your-portal, sp-case-status-tracking, sp-unified-inbox,
 * usp-self-service-corrections; openspec changes contribution-pay-screen, inbox-reply-with-attachments,
 * identity-profile-page; Ruben's round-29 brief (page builder, Forms and Tables). Round 7: features in
 * the specs count as built.
 *
 * Every UI function draws in a screen's mock space (u = 2.5) and takes an animation state `a`
 * whose defaults are the resting frame the storyboard shows.
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { el } from '../../../_lib/stage.js'
import { ease } from '../../../_lib/core.js'
import { chrome, rect, bar, circle, hex, panel, statusPill, idlePill, button, use, phone, docPage, clipped, topbar, nav, appTag } from '../../../_lib/ui.js'

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const lerp = (a, b, p) => a + (b - a) * p

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'A mark on a UI element grows to fill the frame and becomes the next scene.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A whip on the beat between two held shots.' },
]

/** The portal's own header: the organisation's house style (a solid band, its crest hex, the signed-in person). */
export function portalHead(w, geom, { signedIn = 1 } = {}) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 80, width = geom.r - geom.x
	rect(w, x, top, width, 90, C.cobalt700, 4 * u)
	hex(w, x + 100, top + 45, 24, C.white, 3)
	bar(w, x + 140, top + 38, 160, 14, C.white)
	// The signed-in person (Round 29c: it appears when the client signs in).
	const s = Math.max(0, Math.min(1, +signedIn))
	if (s > 0.001) {
		const g = el('g', { opacity: s.toFixed(3) }, w)
		circle(g, x + width - 50, top + 45, 22 * (0.6 + 0.4 * ease.brand(s)), C.cobalt300)
		bar(g, x + width - 200, top + 40, 120, 10, C.cobalt200)
	}
	return top + 110
}

/**
 * Login (Round 29c): the portal's own login page, before the client is signed in. a.user 0..1 types
 * the username, a.pass 0..1 the password (dots), a.ring 0..1 rings the sign-in button, a.press 0..1
 * presses it, a.signed 0..1 the signed-in person appears in the head, a.card 1..0 the login card fades.
 */
export function loginUI(w, geom, a = {}) {
	const A = { user: 1, pass: 1, ring: 1, press: 0, signed: 0, card: 1, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom, { signedIn: A.signed })
	if (A.card <= 0.001) return
	const cw = 560, cx = x + (width - cw) / 2, cy = y + 50, ch = 560
	const g = el('g', { opacity: A.card.toFixed(3), transform: `translate(0 ${(-30 * (1 - A.card)).toFixed(1)})` }, w)
	panel(g, cx, cy, cw, ch, u)
	hex(g, cx + cw / 2, cy + 64, 26, C.cobalt700, 3)
	bar(g, cx + cw / 2 - 110, cy + 110, 220, 14, C.cobalt900)
	// The username, typed in steps, and the password as dots.
	const fx = cx + 50, fw = cw - 100
	bar(g, fx, cy + 170, 120, 8, C.cobalt400)
	rect(g, fx, cy + 188, fw, 60, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	const tw = 240 * Math.floor(clamp01(A.user) * 10) / 10
	if (tw > 0) bar(g, fx + 20, cy + 212, tw, 11, C.cobalt900)
	if (A.user > 0 && A.user < 1) rect(g, fx + 26 + tw, cy + 202, 3 * u, 28, C.cobalt)
	bar(g, fx, cy + 280, 100, 8, C.cobalt400)
	rect(g, fx, cy + 298, fw, 60, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
	const dots = Math.floor(clamp01(A.pass) * 10)
	for (let i = 0; i < dots; i++) circle(g, fx + 30 + i * 26, cy + 328, 7, C.cobalt900)
	if (A.pass > 0 && A.pass < 1) rect(g, fx + 20 + dots * 26 + 4, cy + 312, 3 * u, 28, C.cobalt)
	// Sign in: the one orange is its ring; the press sinks it a little.
	const bx = fx, by = cy + 400, bw = fw, bh = 66
	const k = A.press > 0 && A.press < 1 ? 1 - 0.05 * Math.sin(Math.PI * A.press) : 1
	const bg = el('g', { transform: `translate(${bx + bw / 2} ${by + bh / 2}) scale(${k.toFixed(3)}) translate(${-(bx + bw / 2)} ${-(by + bh / 2)})` }, g)
	rect(bg, bx, by, bw, bh, A.press >= 1 ? C.cobalt600 : C.cobalt, 4 * u)
	bar(bg, bx + bw / 2 - 50, by + bh / 2 - 5, 100, 10, C.white)
	if (A.ring > 0.001) rect(g, bx - 10, by - 10, bw + 20, bh + 20, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: Math.min(1, A.ring * 2).toFixed(3) })
	bar(g, cx + cw / 2 - 70, cy + ch - 40, 140, 8, C.cobalt300)
}

/** A glyph on a small cobalt hex (an app's records in the portal), or a plain hex when id is null. */
function glyphHex(w, cx, cy, r, id, fill = C.cobalt) {
	hex(w, cx, cy, r, fill, 3)
	if (id) use(w, `g-${id}`, cx - r * 0.62, cy - r * 0.62, r * 1.24, r * 1.24, C.white)
}

/**
 * A status stepper with progress: `p` 0..1 runs the mint track to the current step; steps turn
 * mint as the track passes them; the current step is ringed when `ring` > 0.
 */
function stepper(w, x, cy, width, current, u, { n = 4, p = 1, ring = 1 } = {}) {
	const step = width / (n - 1)
	rect(w, x, cy - 3, width, 6, C.cobalt100, 3)
	const reach = step * current * p
	if (reach > 0.5) rect(w, x, cy - 3, reach, 6, C.mint, 3)
	for (let i = 0; i < n; i++) {
		const cx = x + i * step
		const passed = i * step <= reach + 0.5
		hex(w, cx, cy, 18, i < current && passed ? C.mint : i === current && passed ? C.cobalt : C.cobalt100, 3)
		if (i === current && ring > 0.001) hex(w, cx, cy, 28 + 10 * (1 - ring), 'none', 4, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: Math.min(1, ring * 2).toFixed(3) })
		bar(w, cx - 30, cy + 40, 60, 7, C.cobalt300)
	}
}

/**
 * One view: every ticket (case), product and invoice, in three tiles under the portal's head.
 */
const TILES = [
	{ id: 'dossiq', rows: [['progress', 230], ['idle', 180], ['mint', 200]] }, // tickets (cases), the full-width tile
	{ id: null, rows: [['mint', 160], ['idle', 190], ['mint', 140]] }, // products
	{ id: 'shillinq', rows: [['idle', 150], ['mint', 180], ['mint', 170]] }, // invoices
]
/** Hook of the client pages: tickets across the top, products and invoices under it; a.tile(i) -> { dx, dy, o }, a.ring 0..1 rings the tickets tile. */
export function overviewUI(w, geom, a = {}) {
	const root = w
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	const cw = (width - 20) / 2, ch = 300
	const boxes = [[x, y, width, ch], [x, y + ch + 20, cw, ch], [x + cw + 20, y + ch + 20, cw, ch]]
	TILES.forEach((tile, i) => {
		const m = a.tile ? a.tile(i) : null
		if (m && m.o <= 0.001) return
		w = m ? el('g', { transform: `translate(${m.dx.toFixed(1)} ${m.dy.toFixed(1)})`, opacity: m.o.toFixed(3) }, root) : root
		const [tx, ty, tw, th] = boxes[i]
		panel(w, tx, ty, tw, th, u)
		glyphHex(w, tx + 50, ty + 48, 22, tile.id, tile.id ? C.cobalt : C.lavender)
		bar(w, tx + 90, ty + 40, 140, 14, C.cobalt900)
		rect(w, tx + tw - 80, ty + 32, 50, 30, C.cobalt50, 15)
		bar(w, tx + tw - 66, ty + 43, 22, 8, C.cobalt700)
		tile.rows.forEach(([st, lw], k) => {
			const cy = ty + 120 + k * 58
			if (k > 0) rect(w, tx + 24, cy - 29, tw - 48, u, C.cobalt50)
			bar(w, tx + 34, cy - 10, lw, 10, C.cobalt900)
			bar(w, tx + 34, cy + 8, lw * 0.55, 7, C.cobalt300)
			if (st === 'mint') statusPill(w, tx + tw - 130, cy, u)
			else if (st === 'idle') idlePill(w, tx + tw - 110, cy, u)
			else {
				rect(w, tx + tw - 240, cy - 5, 200, 10, C.cobalt100, 5)
				rect(w, tx + tw - 240, cy - 5, 120, 10, C.cobalt400, 5)
			}
		})
		w = root
	})
	const ring = a.ring ?? 1
	const [bx, by, bw, bh] = boxes[0]
	const rc = [bx + bw * 0.5, by + bh / 2]
	if (ring > 0.001) {
		const rs = 1 + 0.05 * (1 - ring)
		const rg = el('g', { transform: `translate(${rc[0]} ${rc[1]}) scale(${rs.toFixed(3)}) translate(${-rc[0]} ${-rc[1]})`, opacity: Math.min(1, ring * 2).toFixed(3) }, w)
		rect(rg, bx - 8, by - 8, bw + 16, bh + 16, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	}
	return { ringCentre: rc }
}

/**
 * Status: a case and a ticket, each with its progress, and the case's timeline filling in.
 * a.fill 0..1 runs the steppers, a.rows 0..4 timeline rows landed, a.ring 0..1 rings the case's current step.
 */
export function statusUI(w, geom, a = {}) {
	const A = { fill: 1, rows: 4, ring: 1, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	// The case, its four steps, the current one ringed.
	panel(w, x, y, width, 290, u)
	glyphHex(w, x + 60, y + 56, 22, 'dossiq')
	bar(w, x + 100, y + 44, 260, 14, C.cobalt900)
	bar(w, x + 100, y + 68, 160, 8, C.cobalt300)
	rect(w, x + width - 190, y + 38, 150, 36, C.cobalt50, 18)
	bar(w, x + width - 170, y + 52, 110, 8, C.cobalt700)
	stepper(w, x + 90, y + 170, width - 180, 2, u, { p: A.fill, ring: A.ring })
	// The ticket, three of four steps done.
	const ty = y + 310
	panel(w, x, ty, width, 190, u)
	glyphHex(w, x + 60, ty + 56, 22, 'pipelinq')
	bar(w, x + 100, ty + 44, 220, 14, C.cobalt900)
	bar(w, x + 100, ty + 68, 140, 8, C.cobalt300)
	stepper(w, x + 90, ty + 128, width - 180, 3, u, { p: A.fill, ring: 0 })
	// The timeline: what happened, newest first, each with who and when.
	const ly = ty + 210
	panel(w, x, ly, width, 330, u)
	for (let i = 0; i < 4; i++) {
		const p = clamp01(A.rows - i)
		if (p <= 0.001) continue
		const cy = ly + 50 + i * 70
		const g = el('g', { transform: `translate(0 ${(-16 * (1 - ease.brand(p))).toFixed(1)})`, opacity: Math.min(1, p * 2).toFixed(3) }, w)
		if (i < 3) rect(g, x + 57, cy + 14, 2 * u, 42, C.cobalt100)
		hex(g, x + 60, cy, 12, i === 0 ? C.mint : C.cobalt300, 2)
		bar(g, x + 90, cy - 10, [260, 200, 230, 180][i], 10, C.cobalt900)
		bar(g, x + 90, cy + 8, 120, 7, C.cobalt300)
		bar(g, x + width - 150, cy - 4, 100, 8, C.cobalt200)
	}
}

/**
 * Actions: three things a client does themselves, one after the other.
 * a.focus 0..2 (which control holds the orange ring, fractional = moving), a.ticket, a.file, a.paid 0..1.
 */
export function actionsUI(w, geom, a = {}) {
	const A = { focus: 2, ticket: 1, file: 1, paid: 1, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	const ch = 180, gap = 22
	const rows = [0, 1, 2].map((i) => y + i * (ch + gap))
	const ctl = []
	// 1. A product (a permit, a container pass): open a ticket on it.
	{
		const cy = rows[0]
		panel(w, x, cy, width, ch, u)
		glyphHex(w, x + 60, cy + 60, 22, null, C.lavender)
		bar(w, x + 100, cy + 48, 230, 14, C.cobalt900)
		bar(w, x + 100, cy + 72, 150, 8, C.cobalt300)
		statusPill(w, x + 100, cy + 130, u)
		const bx = x + width - 260, by = cy + 56, bw = 210, bh = 60
		const t = ease.brand(A.ticket)
		if (t < 1) button(w, bx, by, bw, bh, u, { kind: 'ghost' })
		if (t > 0) {
			const g = el('g', { opacity: t.toFixed(3), transform: `translate(${(30 * (1 - t)).toFixed(1)} 0)` }, w)
			rect(g, bx, by, bw, bh, C.cobalt50, 30)
			glyphHex(g, bx + 34, by + bh / 2, 16, 'pipelinq')
			bar(g, bx + 62, by + bh / 2 - 5, 110, 10, C.cobalt700)
		}
		ctl.push([bx, by, bw, bh])
	}
	// 2. A case: add a file to it (the file drops into its slot).
	{
		const cy = rows[1]
		panel(w, x, cy, width, ch, u)
		glyphHex(w, x + 60, cy + 60, 22, 'dossiq')
		bar(w, x + 100, cy + 48, 250, 14, C.cobalt900)
		bar(w, x + 100, cy + 72, 170, 8, C.cobalt300)
		const zx = x + width - 330, zy = cy + 40, zw = 280, zh = 96
		const f = ease.brand(A.file)
		rect(w, zx, zy, zw, zh, f >= 1 ? C.cobalt50 : 'none', 4 * u, { stroke: C.cobalt300, 'stroke-width': u, 'stroke-dasharray': f >= 1 ? 'none' : '10 8' })
		const fy = zy + 22 - 140 * (1 - f)
		if (A.file > 0) {
			const g = el('g', { opacity: Math.min(1, A.file * 3).toFixed(3) }, w)
			rect(g, zx + 24, fy, zw - 48, 52, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
			rect(g, zx + 36, fy + 10, 32, 32, C.nextcloud, 4)
			use(g, 'nc-files', zx + 40, fy + 14, 24, 24, C.white)
			bar(g, zx + 80, fy + 21, 130, 10, C.cobalt900)
		} else {
			rect(w, zx + zw / 2 - 12, zy + zh / 2 - 2, 24, 4, C.cobalt400)
			rect(w, zx + zw / 2 - 2, zy + zh / 2 - 12, 4, 24, C.cobalt400)
		}
		ctl.push([zx, zy, zw, zh])
	}
	// 3. An invoice: pay it from its row.
	{
		const cy = rows[2]
		panel(w, x, cy, width, ch, u)
		glyphHex(w, x + 60, cy + 60, 22, 'shillinq')
		bar(w, x + 100, cy + 48, 200, 14, C.cobalt900)
		bar(w, x + 100, cy + 72, 130, 8, C.cobalt300)
		bar(w, x + width - 480, cy + 80, 110, 14, C.cobalt700)
		const bx = x + width - 260, by = cy + 56, bw = 210, bh = 60
		const p = ease.brand(A.paid)
		if (p < 1) button(w, bx, by, bw, bh, u, { kind: 'primary' })
		if (p > 0) {
			const g = el('g', { opacity: p.toFixed(3) }, w)
			rect(g, bx, by, bw, bh, C.white, 4 * u)
			statusPill(g, bx + 60, by + bh / 2, u)
		}
		ctl.push([bx, by, bw, bh])
	}
	// The one orange: a ring on the control being used, moving card to card.
	const f = Math.max(0, Math.min(2, A.focus))
	const i0 = Math.floor(f), i1 = Math.min(2, i0 + 1), k = ease.inOutCubic(f - i0)
	const [ax, ay, aw, ah] = ctl[i0], [bx, by, bw, bh] = ctl[i1]
	const rx = lerp(ax, bx, k), ry = lerp(ay, by, k), rw = lerp(aw, bw, k), rh = lerp(ah, bh, k)
	if (A.focus >= 0) rect(w, rx - 10, ry - 10, rw + 20, rh + 20, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/**
 * Inbox: every mail, letter and chat in one list, newest first; the letter opens beside it.
 * a.items 0..4 rows landed, a.ring 0..1 rings the newest, a.open 0..1 the reading pane.
 */
const INBOX = [
	{ icon: 'icon-document', fill: C.cobalt, w: 190 }, // a letter
	{ icon: 'nc-mail', fill: C.nextcloud, w: 220 },
	{ icon: 'nc-talk', fill: C.nextcloud, w: 170 },
	{ icon: 'nc-mail', fill: C.nextcloud, w: 200 },
	{ icon: 'icon-document', fill: C.cobalt, w: 160 },
]
export function inboxUI(w, geom, a = {}) {
	const A = { items: 5, ring: 1, open: 1, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	// The channel filter: all, mail, letters, chat.
	;[70, 60, 80, 56].forEach((cw, i) => {
		const cx = x + 90 + [0, 100, 190, 300][i]
		rect(w, cx, y, cw + 20, 40, i === 0 ? C.cobalt : C.white, 20, i === 0 ? {} : { stroke: C.cobalt200, 'stroke-width': u })
		bar(w, cx + 10 + (i === 0 ? 5 : 0), y + 16, cw - 10, 8, i === 0 ? C.white : C.cobalt400)
	})
	const lw = 400, ly = y + 60
	panel(w, x, ly, lw, 700, u)
	INBOX.forEach((m, i) => {
		// The newest lands last, at the top: rows land from the bottom of the list up.
		const p = clamp01(A.items - (INBOX.length - 1 - i))
		if (p <= 0.001) return
		const cy = ly + 70 + i * 120
		const g = el('g', { transform: `translate(0 ${(-30 * (1 - ease.brand(p))).toFixed(1)})`, opacity: Math.min(1, p * 2).toFixed(3) }, w)
		if (i > 0) rect(g, x + 20, cy - 60, lw - 40, u, C.cobalt50)
		rect(g, x + 26, cy - 24, 48, 48, m.fill, 5)
		use(g, m.icon, x + 34, cy - 16, 32, 32, C.white)
		bar(g, x + 92, cy - 20, m.w * 0.7, 10, C.cobalt900)
		bar(g, x + 92, cy + 2, m.w, 8, C.cobalt300)
		bar(g, x + 92, cy + 20, m.w * 0.5, 7, C.cobalt200)
		if (i === 0) circle(g, x + lw - 34, cy - 14, 8, C.cobalt)
	})
	if (A.ring > 0.001) rect(w, x + 10, ly + 12, lw - 20, 116, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: Math.min(1, A.ring * 2).toFixed(3) })
	// The reading pane: the letter, open.
	const o = ease.brand(A.open)
	if (o > 0.001) {
		const px = x + lw + 20, pw = width - lw - 20
		const g = el('g', { transform: `translate(${(40 * (1 - o)).toFixed(1)} 0)`, opacity: Math.min(1, o * 2).toFixed(3) }, w)
		panel(g, px, ly, pw, 700, u)
		const k = (pw - 60) / 500
		docPage(g, px + 30, ly + 30, pw - 60, 640, { k, values: [118, 96, 72], lastOrange: false, shadow: null })
	}
}

/**
 * Profile: the client's own details, the address changed and then the bank account.
 * a.e1, a.e2 0..1 type each new value on; a.s1, a.s2 0|1 saved; a.focus 1 or 2 (the field with the orange edge, 0 none).
 */
export function profileUI(w, geom, a = {}) {
	const A = { e1: 1, s1: 1, e2: 1, s2: 1, focus: 2, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	panel(w, x, y, width, 150, u)
	circle(w, x + 80, y + 75, 40, C.cobalt300)
	bar(w, x + 140, y + 56, 220, 16, C.cobalt900)
	bar(w, x + 140, y + 88, 150, 9, C.cobalt300)
	const fy = y + 170
	panel(w, x, fy, width, 440, u)
	const fields = [
		{ lw: 200 },
		{ lw: 260, edit: 1, old: 210 }, // the address
		{ lw: 180 },
		{ lw: 300, edit: 2, old: 240 }, // the bank account
	]
	fields.forEach((f, i) => {
		const cy = fy + 70 + i * 96
		bar(w, x + 40, cy - 30, 110, 8, C.cobalt400)
		const on = f.edit && A.focus === f.edit
		rect(w, x + 40, cy - 14, width - 280, 52, C.white, 3 * u, { stroke: on ? C.orange : C.cobalt100, 'stroke-width': on ? 2.5 * u : u })
		if (!f.edit) {
			bar(w, x + 60, cy + 6, f.lw, 11, C.cobalt900)
			idlePill(w, x + width - 190, cy + 12, u, { w: 30 })
			return
		}
		const e = f.edit === 1 ? A.e1 : A.e2
		const saved = f.edit === 1 ? A.s1 : A.s2
		const cl = clipped(w, x + 44, cy - 10, width - 288, 44, 2 * u)
		if (e <= 0) bar(cl, x + 60, cy + 6, f.old, 11, C.cobalt900)
		else {
			// The old value leaves upward in the first fifth; the new one types on in steps.
			const up = clamp01(e * 5)
			if (up < 1) bar(cl, x + 60, cy + 6 - 30 * up, f.old, 11, C.cobalt900, { opacity: (1 - up).toFixed(3) })
			const tw = f.lw * Math.floor(clamp01((e - 0.2) / 0.8) * 10) / 10
			if (tw > 0) bar(cl, x + 60, cy + 6, tw, 11, C.cobalt900)
			if (on && !saved) rect(cl, x + 60 + tw + 6, cy - 2, 3 * u, 28, C.cobalt)
		}
		if (saved) statusPill(w, x + width - 200, cy + 12, u)
		else idlePill(w, x + width - 190, cy + 12, u, { w: 30 })
	})
}

/**
 * Mobile: the same portal on a phone, in stage px. a.scroll 0..1 scrolls the page, a.tap 0..1 the
 * orange tap ring on Pay, a.paid 0..1. Returns the phone's screen box.
 */
export const PHONE = { x: 1170, y: 130, w: 390, h: 800 }
export function phoneUI(g, a = {}, box = PHONE) {
	const A = { scroll: 1, tap: 1, paid: 1, ...a }
	const p = phone(g, box.x, box.y, box.w, box.h)
	const s = p.screen, x = p.x, width = p.w, k = p.k
	// The page scrolls under the fixed head.
	const page = el('g', { transform: `translate(0 ${(-330 * k * ease.inOutCubic(A.scroll)).toFixed(1)})` }, s)
	let y = p.y + 160 * k
	// The overview tiles, stacked: tickets, products, invoices.
	TILES.forEach((tile, i) => {
		rect(page, x + 20 * k, y, width - 40 * k, 120 * k, C.cobalt50, 12 * k)
		glyphHex(page, x + 62 * k, y + 60 * k, 22 * k, tile.id, tile.id ? C.cobalt : C.lavender)
		bar(page, x + 100 * k, y + 42 * k, 150 * k, 13 * k, C.cobalt900)
		bar(page, x + 100 * k, y + 68 * k, 100 * k, 9 * k, C.cobalt300)
		if (i === 0) {
			rect(page, x + 100 * k, y + 92 * k, 230 * k, 8 * k, C.cobalt100, 4 * k)
			rect(page, x + 100 * k, y + 92 * k, 140 * k, 8 * k, C.mint, 4 * k)
		}
		y += 136 * k
	})
	// The invoice that is due, with its pay button.
	rect(page, x + 20 * k, y, width - 40 * k, 220 * k, C.white, 12 * k, { stroke: C.cobalt100, 'stroke-width': 2 * k })
	glyphHex(page, x + 62 * k, y + 56 * k, 22 * k, 'shillinq')
	bar(page, x + 100 * k, y + 40 * k, 170 * k, 13 * k, C.cobalt900)
	bar(page, x + 100 * k, y + 64 * k, 110 * k, 9 * k, C.cobalt300)
	const bx = x + 40 * k, by = y + 120 * k, bw = width - 80 * k, bh = 70 * k
	const paid = ease.brand(A.paid)
	if (paid < 1) {
		rect(page, bx, by, bw, bh, C.cobalt, 10 * k)
		bar(page, bx + bw / 2 - 50 * k, by + bh / 2 - 5 * k, 100 * k, 10 * k, C.white)
	}
	if (paid > 0) {
		const pg = el('g', { opacity: paid.toFixed(3) }, page)
		rect(pg, bx, by, bw, bh, C.mint300, 10 * k)
		bar(pg, bx + bw / 2 - 50 * k, by + bh / 2 - 5 * k, 100 * k, 10 * k, C.mint)
	}
	// Under it, the latest messages: a letter, a mail, a chat.
	const my = y + 240 * k
	rect(page, x + 20 * k, my, width - 40 * k, 260 * k, C.cobalt50, 12 * k)
	;[['icon-document', C.cobalt], ['nc-mail', C.nextcloud], ['nc-talk', C.nextcloud]].forEach(([icon, fill], i) => {
		const ry = my + 30 * k + i * 76 * k
		rect(page, x + 40 * k, ry, 48 * k, 48 * k, fill, 6 * k)
		use(page, icon, x + 48 * k, ry + 8 * k, 32 * k, 32 * k, C.white)
		bar(page, x + 104 * k, ry + 10 * k, [150, 180, 120][i] * k, 11 * k, C.cobalt900)
		bar(page, x + 104 * k, ry + 30 * k, [100, 120, 90][i] * k, 8 * k, C.cobalt300)
	})
	if (A.tap > 0.001 && A.tap < 1.999) {
		const t = Math.min(1, A.tap)
		rect(page, bx - 8 * k, by - 8 * k, bw + 16 * k, bh + 16 * k, 'none', 14 * k, { stroke: C.orange, 'stroke-width': 5 * k, opacity: Math.min(1, t * 2).toFixed(3) })
	}
	// The portal's head, fixed on top.
	rect(s, x, p.y, width, 150 * k, C.cobalt700)
	hex(s, x + 44 * k, p.y + 105 * k, 20 * k, C.white, 3)
	bar(s, x + 78 * k, p.y + 98 * k, 120 * k, 13 * k, C.white)
	circle(s, x + width - 44 * k, p.y + 104 * k, 18 * k, C.cobalt300)
	return p
}

/**
 * Builder: the portal's page builder. Blocks from the palette on the left are dragged onto the grid
 * canvas, where a portal page assembles. a.block(i) -> 0..1 the flight of block i (default landed),
 * a.ring 0..1 rings the last block, the form. Returns { formCentre } in mock space.
 */
const PALETTE = ['head', 'cases', 'invoices', 'text', 'form']
const BLOCKS = [
	{ kind: 'head', c: 0, r: 0, cw: 6, rh: 1 },
	{ kind: 'cases', c: 0, r: 1, cw: 3, rh: 3 },
	{ kind: 'invoices', c: 3, r: 1, cw: 3, rh: 2 },
	{ kind: 'text', c: 3, r: 3, cw: 3, rh: 1 },
	{ kind: 'form', c: 0, r: 4, cw: 6, rh: 2 },
]
export function builderUI(w, geom, a = {}) {
	const A = { ring: 1, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const top = geom.anchor.y - 80
	// The palette: one row per block type.
	const pw = 230
	panel(w, x, top, pw, 820, u)
	bar(w, x + 96, top + 30, 110, 10, C.cobalt400)
	// The rows start under the app tag on the loop anchor.
	const pal = PALETTE.map((kind, i) => {
		const py = top + 160 + i * 86
		rect(w, x + 16, py, pw - 32, 70, C.cobalt50, 3 * u)
		blockIcon(w, kind, x + 50, py + 35, 16)
		bar(w, x + 80, py + 30, 90, 9, C.cobalt700)
		return [x + 16, py, pw - 32, 70]
	})
	// The canvas: a six-column grid, dotted cells.
	const cx0 = x + pw + 24, cwid = width - pw - 24
	panel(w, cx0, top, cwid, 820, u, { fill: C.cobalt50 })
	const gap = 12, colW = (cwid - 40 - 5 * gap) / 6, rowH = 110
	const gx = cx0 + 20, gy = top + 24
	for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) rect(w, gx + c * (colW + gap), gy + r * (rowH + gap), colW, rowH, 'none', 3 * u, { stroke: C.cobalt200, 'stroke-width': u * 0.6, 'stroke-dasharray': '6 6' })
	const slot = (b) => [gx + b.c * (colW + gap), gy + b.r * (rowH + gap), b.cw * colW + (b.cw - 1) * gap, b.rh * rowH + (b.rh - 1) * gap]
	let formCentre = null
	BLOCKS.forEach((b, i) => {
		const p = a.block ? a.block(i) : 1
		const [sx, sy, sw, sh] = slot(b)
		if (b.kind === 'form') formCentre = [sx + sw / 2, sy + sh / 2]
		if (p <= 0) return
		// While it flies, its target lights up.
		if (p < 1) rect(w, sx, sy, sw, sh, C.cobalt100, 3 * u)
		const e = ease.brand(p)
		const [fx, fy, fw, fh] = pal[PALETTE.indexOf(b.kind)]
		const bx = lerp(fx, sx, e), by = lerp(fy, sy, e), bw = lerp(fw, sw, e), bh = lerp(fh, sh, e)
		drawBlock(w, b.kind, bx, by, bw, bh, u, p < 1)
	})
	if (A.ring > 0.001 && formCentre) {
		const [sx, sy, sw, sh] = slot(BLOCKS[4])
		rect(w, sx - 8, sy - 8, sw + 16, sh + 16, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: Math.min(1, A.ring * 2).toFixed(3) })
	}
	return { formCentre, canvas: [cx0, top, cwid, 820] }
}

/** A palette block's small mark: abstract, in the UI vocabulary (bars and hexes, no drawn icons). */
function blockIcon(w, kind, cx, cy, r) {
	if (kind === 'head') { rect(w, cx - r, cy - r * 0.6, 2 * r, 1.2 * r, C.cobalt700, 3); return }
	if (kind === 'form') { use(w, 'nc-forms', cx - r, cy - r, 2 * r, 2 * r, C.nextcloud); return }
	if (kind === 'text') { for (let i = 0; i < 3; i++) rect(w, cx - r, cy - r * 0.7 + i * r * 0.6, 2 * r - i * 6, 4, C.cobalt400, 2); return }
	hex(w, cx, cy, r, C.cobalt, 2)
	use(w, `g-${kind === 'cases' ? 'dossiq' : 'shillinq'}`, cx - r * 0.62, cy - r * 0.62, r * 1.24, r * 1.24, C.white)
}

/** A placed block on the canvas: the portal part it stands for, drawn to its box. */
function drawBlock(w, kind, x, y, bw, bh, u, lifted) {
	const g = el('g', {}, w)
	if (lifted) rect(g, x + 6, y + 10, bw, bh, C.cobalt200, 3 * u, { opacity: 0.6 })
	if (kind === 'head') {
		rect(g, x, y, bw, bh, C.cobalt700, 3 * u)
		if (bh > 50) { hex(g, x + 50, y + bh / 2, 22, C.white, 3); bar(g, x + 90, y + bh / 2 - 7, Math.min(150, bw * 0.3), 14, C.white) }
		return
	}
	rect(g, x, y, bw, bh, C.white, 3 * u, { stroke: C.cobalt100, 'stroke-width': u })
	if (bh < 60 || bw < 120) return
	if (kind === 'text') {
		for (let i = 0; i < 3; i++) bar(g, x + 24, y + 26 + i * 24, (bw - 60) * [1, 0.85, 0.6][i], 9, i ? C.cobalt200 : C.cobalt700)
		return
	}
	if (kind === 'form') {
		rect(g, x + 20, y + 20, 44, 44, C.nextcloud, 4)
		use(g, 'nc-forms', x + 28, y + 28, 28, 28, C.white)
		bar(g, x + 80, y + 34, 160, 12, C.cobalt900)
		const n = Math.floor((bw - 40) / 190)
		for (let i = 0; i < Math.max(1, Math.min(3, n)); i++) {
			bar(g, x + 20 + i * 190, y + 96, 80, 7, C.cobalt400)
			rect(g, x + 20 + i * 190, y + 112, 170, 40, C.white, 2 * u, { stroke: C.cobalt200, 'stroke-width': u })
		}
		if (bh > 200) rect(g, x + bw - 170, y + bh - 70, 150, 50, C.cobalt, 3 * u)
		return
	}
	// A list block (tickets or invoices): its app's glyph and three rows.
	glyphHex(g, x + 40, y + 40, 18, kind === 'cases' ? 'dossiq' : 'shillinq')
	bar(g, x + 72, y + 34, 110, 11, C.cobalt900)
	const n = Math.max(0, Math.min(4, Math.floor((bh - 80) / 56)))
	for (let i = 0; i < n; i++) {
		const cy = y + 100 + i * 56
		bar(g, x + 24, cy - 6, Math.min(170, bw - 150), 9, C.cobalt700)
		if (bw > 260) { if (i % 2) idlePill(g, x + bw - 100, cy - 2, u, { w: 26 }); else statusPill(g, x + bw - 120, cy - 2, u) }
	}
}


/* ---------- the two kinds of screen (Round 29b) ---------- */

/**
 * Where a screen sits on the stage: the app window's place and scale (layout().win), so a point in
 * mock space maps to the stage the same way for both kinds. U is the mock unit (stage px per CSS px).
 */
export const U = 2.5
export const WIN = { x: 940, y: 160, s: 0.8, nav: 110, row1: 205 }
const LOOP = { x: WIN.x + WIN.s * (WIN.nav + 14) * U, y: WIN.y + WIN.s * WIN.row1, r: 44 }
export const toStage = (mx, my, box = WIN) => [box.x + box.s * mx, box.y + box.s * my]
const outerGroup = (g, { land = 1, dx = 0, dy = 0 }) => {
	const y = 60 * (1 - ease.brand(land)) + dy
	return { y, outer: el('g', { opacity: Math.min(1, Math.max(0, land * 2)).toFixed(3), transform: `translate(${dx.toFixed(1)} ${y.toFixed(1)})` }, g) }
}
const pushGroup = (win, push, about) => el('g', { transform: `translate(${about[0]} ${about[1]}) scale(${push.toFixed(4)}) translate(${-about[0]} ${-about[1]})` }, win)

/**
 * A Nextcloud window (the AppMock: the dark top bar with its app dots and the app nav on the left).
 * Round 29b: only what runs inside Nextcloud uses it: the page builder and Tables. `tag` 0..1 flips
 * the Portaliq tag in on the loop anchor (off for Tables, which is Nextcloud's own app).
 */
export function ncWindow(g, { drawUI, land = 1, push = 1, about = [900, 600], tag = 1, dx = 0, dy = 0, app = 'portaliq' }) {
	const visR = (1920 - WIN.x) / WIN.s, visB = (1080 - WIN.y) / WIN.s
	const { y, outer } = outerGroup(g, { land, dx, dy })
	const view = el('g', { transform: `translate(${WIN.x} ${WIN.y}) scale(${WIN.s})` }, outer)
	const FW = 720 * U, FH = visB + 60
	const win = clipped(view, 0, 0, FW, FH, 10 * U)
	rect(win, 0, 0, FW, FH, C.white)
	topbar(win, 0, 0, FW, U, { fill: C.cobalt900 })
	nav(win, 0, 24 * U, WIN.nav * U, FH - 24 * U, U, { items: 7, active: 1 })
	rect(win, (720 - 187) * U, 24 * U, U, FH, C.cobalt100)
	const geom = { x: (WIN.nav + 14) * U, r: Math.min((720 - 187 - 14) * U, visR - 60), top: 24 * U, Y0: 0, u: U, anchor: { x: (WIN.nav + 14) * U, y: WIN.row1 }, visB }
	const out = drawUI(pushGroup(win, push, about), geom) || {}
	const ts = Math.max(0, Math.min(1, tag))
	if (ts > 0.001) {
		const tg = el('g', { transform: `translate(${LOOP.x + dx} ${LOOP.y + y}) scale(${ts.toFixed(3)} 1) translate(${-LOOP.x} ${-LOOP.y})` }, g)
		appTag(tg, LOOP.x, LOOP.y, LOOP.r, app, { fill: C.cobalt })
	}
	return { geom, out }
}

/**
 * A standalone web page (Round 29b): what clients see is the organisation's own site, not Nextcloud.
 * A browser-like frame (a light bar with three dots and an address pill), then the page: the portal's
 * own head and its content. No Nextcloud top bar, no app nav, no Portaliq tag. `box` places and sizes
 * it (stage x, y, scale; mock width W and height H; default: where the app window sits, bleeding off).
 */
export function pageFrame(g, { drawUI, land = 1, push = 1, about = [600, 600], dx = 0, dy = 0, box = WIN, W = null, H = null }) {
	const visR = (1920 - box.x) / box.s, visB = (1080 - box.y) / box.s
	const { outer } = outerGroup(g, { land, dx, dy })
	const view = el('g', { transform: `translate(${box.x} ${box.y}) scale(${box.s})` }, outer)
	const FW = W || 720 * U, FH = H || visB + 60
	const bleeds = !W
	if (!bleeds) rect(view, 0, 14, FW, FH, C.cobalt900, 10 * U, { opacity: 0.35 })
	const win = clipped(view, 0, 0, FW, FH, 10 * U)
	rect(win, 0, 0, FW, FH, C.white)
	rect(win, 0, 0, FW, 60, C.cobalt50)
	;[34, 62, 90].forEach((cx) => circle(win, cx, 30, 8, C.cobalt200))
	rect(win, 130, 14, Math.min(560, FW - 180), 32, C.white, 16)
	bar(win, 152, 26, 180, 8, C.cobalt200)
	const r = bleeds ? Math.min(FW, visR) - 60 : FW - 40
	const x = bleeds ? 60 : 40
	const geom = { x, r, top: 60, Y0: 0, u: U, anchor: { x, y: WIN.row1 }, visB }
	const out = drawUI(pushGroup(win, push, about), geom) || {}
	return { geom, out }
}

/**
 * Collect data, the portal side: a Nextcloud Forms form embedded on the organisation's page.
 * a.type 0..1 the answers type on, a.send 0..1 the submit press. Returns { submit } in mock space.
 */
export function formPageUI(w, geom, a = {}) {
	const A = { type: 1, send: 1, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const y = portalHead(w, geom)
	panel(w, x, y, width, 720, u)
	rect(w, x + 30, y + 30, 48, 48, C.nextcloud, 5)
	use(w, 'nc-forms', x + 38, y + 38, 32, 32, C.white)
	bar(w, x + 96, y + 46, 180, 13, C.cobalt900)
	const ans = [200, 150, 230]
	ans.forEach((lw, i) => {
		const cy = y + 130 + i * 150
		bar(w, x + 30, cy, 170, 10, C.cobalt700)
		rect(w, x + 30, cy + 26, width - 60, 60, C.white, 3 * u, { stroke: C.cobalt200, 'stroke-width': u })
		const typed = clamp01(A.type * 3 - i)
		const tw = lw * Math.floor(typed * 8) / 8
		if (tw > 0) bar(w, x + 50, cy + 50, tw, 11, C.cobalt900)
		if (typed > 0 && typed < 1) rect(w, x + 50 + tw + 6, cy + 42, 3 * u, 28, C.cobalt)
	})
	const sbx = x + width - 210, sby = y + 590, sbw = 180, sbh = 64
	const press = A.send > 0 && A.send < 1 ? 1 - 0.06 * Math.sin(Math.PI * A.send) : 1
	const sb = el('g', { transform: `translate(${sbx + sbw / 2} ${sby + sbh / 2}) scale(${press.toFixed(3)}) translate(${-(sbx + sbw / 2)} ${-(sby + sbh / 2)})` }, w)
	rect(sb, sbx, sby, sbw, sbh, A.send >= 1 ? C.cobalt600 : C.cobalt, 4 * u)
	bar(sb, sbx + 50, sby + 27, 80, 10, C.white)
	return { submit: [sbx + sbw / 2, sby + sbh / 2] }
}

/**
 * Collect data, the Nextcloud side: the Tables table the answers land in. a.row 0..1 the new top row
 * opens, a.cells 0..1 its cells fill, a.ring 0..1 rings it. Returns { rowCentre } in mock space.
 */
export function tablesUI(w, geom, a = {}) {
	const A = { row: 1, cells: 1, ring: 1, ...a }
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x
	const top = geom.anchor.y - 80
	panel(w, x, top, width, 900, u)
	rect(w, x, top, width, 90, C.nextcloud, 4 * u)
	rect(w, x, top + 70, width, 20, C.nextcloud)
	// Right of the form page that stands in front of this window's left side.
	use(w, 'nc-tables', x + 380, top + 25, 40, 40, C.white)
	bar(w, x + 436, top + 38, 150, 13, C.white)
	const cols = 5, colW = (width - 40) / cols, rowH = 76
	const hy = top + 110
	rect(w, x + 20, hy, width - 40, 50, C.cobalt50, 2 * u)
	for (let c = 0; c < cols; c++) bar(w, x + 36 + c * colW, hy + 20, colW * 0.5, 9, C.cobalt400)
	const r0 = hy + 60
	const open = ease.brand(A.row)
	const W5 = [0.6, 0.45, 0.7, 0.35, 0.5]
	const tb = clipped(w, x + 20, r0, width - 40, 900 - (r0 - top) - 20, 0)
	for (let i = 0; i < 8; i++) {
		const ry = r0 + (i + open) * rowH
		rect(tb, x + 20, ry + rowH - u, width - 40, u, C.cobalt50)
		for (let c = 0; c < cols; c++) bar(tb, x + 36 + c * colW, ry + rowH / 2 - 5, colW * W5[(c + i) % 5], 9, c === 0 ? C.cobalt700 : C.cobalt300)
	}
	if (open > 0) {
		const g = el('g', { opacity: Math.min(1, open * 2).toFixed(3) }, w)
		rect(g, x + 20, r0, width - 40, rowH * open, C.cobalt50)
		const cf = A.cells * cols
		for (let c = 0; c < cols; c++) {
			const p = clamp01(cf - c)
			if (p > 0 && open >= 1) bar(g, x + 36 + c * colW, r0 + rowH / 2 - 5, colW * W5[c] * p, 9, C.cobalt900)
		}
	}
	if (A.ring > 0.001) rect(w, x + 12, r0 - 8, width - 24, rowH + 16, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u, opacity: Math.min(1, A.ring * 2).toFixed(3) })
	return { rowCentre: [x + width * 0.62, r0 + rowH / 2] }
}

/** Where the form's page stands in the collect-data scene (over the Tables window's left side, clear of the caption). */
export const FORM_BOX = { x: 920, y: 290, s: 0.62 }
export const FORM_SIZE = { W: 640, H: 1060 }

/** The collect-data scene's picture: Tables in Nextcloud behind, the portal's form page in front. */
export function collectScene(g, a = {}, { tablesDy = 0, formDy = 0 } = {}) {
	const t = ncWindow(g, { tag: 0, dy: tablesDy, drawUI: (w, geom) => tablesUI(w, geom, a) })
	const f = pageFrame(g, { box: FORM_BOX, ...FORM_SIZE, dy: formDy, drawUI: (w, geom) => formPageUI(w, geom, a) })
	return { row: toStage(...t.out.rowCentre), submit: toStage(...f.out.submit, FORM_BOX), tablesDy, formDy }
}

/** The answer in flight, in stage px: a row-shaped chip from the form's submit button to the new table row. */
export function answerChip(g, from, to, p) {
	if (p <= 0 || p >= 1) return
	const e = ease.inOutCubic(p)
	const fx = lerp(from[0], to[0], e), fy = lerp(from[1], to[1], e) - 110 * Math.sin(Math.PI * e)
	const cw = lerp(110, 420, e), ch = lerp(40, 46, e)
	rect(g, fx - cw / 2, fy - ch / 2, cw, ch, C.cobalt100, 6, { stroke: C.cobalt300, 'stroke-width': 2 })
	for (let c = 0; c < 3; c++) bar(g, fx - cw / 2 + 14 + (c * cw) / 3, fy - 3, (cw / 3) * 0.5, 6, C.cobalt700)
}

/* ---------- the storyboard's frames (the film draws the same UI in motion) ---------- */

const onPage = (drawUI, caption) => (ctx) => { chrome(ctx, { text: caption, app: 'portaliq' }); pageFrame(ctx.g, { drawUI }) }
const inNextcloud = (drawUI, caption) => (ctx) => { chrome(ctx, { text: caption, app: 'portaliq' }); ncWindow(ctx.g, { drawUI }) }

/**
 * Round 29b naming: the first mention says "clients (or citizens)" and "ticket (case)", every later
 * one "clients" and "tickets"; no "residents".
 */
const CAPTIONS = {
	builder: 'You design\nthe portal',
	login: 'The client logs\nin to the portal',
	overview: 'Every ticket (case),\nproduct and invoice',
	status: 'Clients follow every\nticket, step by step',
	actions: 'Open tickets, add\nfiles, pay invoices',
	inbox: 'Mail, letters and chat\nin one inbox',
	profile: 'Clients update their\naddress and bank info',
	mobile: 'Everything works\non their phone',
	forms: 'Ask with _Forms_,\nanswers land in _Tables_',
}
export { CAPTIONS }

const content = {
	app: 'portaliq',
	audience: { slug: 'portal', name: 'Portal', persona: 'The functional admin of a municipality or a housing corporation: Willem Postma, head of digital services at a municipality; Esther Kuipers, customer contact manager at a housing corporation' },
	promise: 'What if clients\n(or citizens)\ndid it themselves?',
	promiseLine: 'Clients (or citizens) arrange it themselves in a portal you design: tickets, products and invoices in one view, progress, actions, one inbox, their own details, on any phone, and Forms and Tables to collect what you need',
	title: 'Portaliq, one portal your clients run themselves',
	record: { one: 'ticket', many: 'tickets' },
	logline: 'Round 29b: one Portaliq film for the functional admins of municipalities and housing corporations. Round 29c: the admin designs the portal in a grid page builder inside Nextcloud, then the client logs in to it; the portal pages clients (or citizens) see stand on their own, in the organisation\'s style: every ticket, product and invoice in one view, progress, their own actions, one inbox, their own details, on their phone; a Forms form on the portal feeds a Tables table in Nextcloud.',
	references: REFS,
	// Round 27c: the section title each scene's small mark shows (not the app name).
	sections: { promise: 'Self-service', hook: 'Page builder', login: 'Login', overview: 'One view', status: 'Progress', actions: 'Actions', inbox: 'Inbox', profile: 'Own details', mobile: 'Mobile', forms: 'Collect data' },
	transitions: {
		hook: { type: 'grow', fromName: 'the orange Portaliq cell', toName: 'the page builder', note: 'the app cell opens into its own page builder, inside Nextcloud: a hex grows out of the cell past the frame and the builder is inside it (#1)' },
		login: { type: 'match', fromName: 'the page just built', toName: 'the portal\'s login page', note: 'the turn from the admin to the client: the canvas the admin just filled leaves Nextcloud and grows into the standalone portal, its head carried across, now as the client sees it at its login' },
		overview: { type: 'cluster', fromName: 'the signed-in login', toName: 'one view', note: 'signed in: the person appears in the portal\'s head, the login card lifts away, and the tiles gather into the same page (#10)' },
		status: { type: 'grow', fromName: 'the ringed tickets tile', toName: 'the ticket and its steps', note: 'the tile opens into the ticket it holds: a hex grows out of it past the frame and its progress is inside (#1)' },
		actions: { type: 'swap', fromName: 'the progress', toName: 'the three actions', note: 'the portal page holds and the page under its head steps down in three bands: the same portal, the client acting in it (#9)' },
		inbox: { type: 'whip', fromName: 'the paid invoice', toName: 'the inbox', note: 'to the inbox on the beat: a whip reads as the client moving to the next page (#11)' },
		profile: { type: 'hexWipe', fromName: 'the open letter', toName: 'the client\'s details', note: 'from what you sent them to what they keep up to date: four hexes step in from the right and the details arrive behind them (#5)' },
		mobile: { type: 'match', fromName: 'the portal page', toName: 'the phone\'s screen', note: 'the page shrinks into the phone\'s screen: the same portal, now in a pocket' },
		forms: { type: 'whip', fromName: 'the phone', toName: 'the form and its table', note: 'a vertical whip: the phone lifts away and the form rises in on the portal page, with Tables behind it in Nextcloud' },
	},
	techniques: ['#1 dot-grows-to-fill (as a hex)', 'match cut', '#10 cluster-to-container merge', '#9 text-swap on a held window', '#11 whip-pan', '#5 stepped hex wipe'],
	maxWords: 64,
	promiseFirst: true,
	promiseMotion: 'Round 29b: the body opens here, straight after the opening\'s handover. The Portaliq cluster flips in on the field (it turns over by squashing, never pops or scales in), Portaliq orange on the loop anchor with Dossiq and Shillinq beside it. The small mark reads the section, "Self-service"; the admin\'s question rises under it, "What if clients (or citizens) did it themselves?" (8 words; no answer card, the scenes answer it). Out on the last beat: the orange Portaliq cell opens as a hex into the page builder.',
	neighbours: ['dossiq', 'shillinq'],
	builtOnApps: ['dossiq'],
	hook: {
		title: 'You design the portal',
		caption: CAPTIONS.builder,
		draw: inNextcloud(builderUI, CAPTIONS.builder),
		source: 'Ruben, round 29 scene 7 and round 29b (the builder comes first, and it is the one screen of the portal that runs inside Nextcloud): a grid page builder, design your own custom portal for citizens and clients',
		motion: 'Inside the hex from the Portaliq cell: Portaliq\'s page builder in its Nextcloud window, the palette of blocks on the left, the dotted six-column grid on the right. Blocks are dragged across one a beat (the head, a tickets list, an invoices list, a text block, a form) and snap into their cells, each target lighting up as its block flies; a portal page assembles. The form block, last, takes the orange ring.',
		sound: 'A whoosh through the hex, a soft whoosh per drag, a dry click as each block snaps in, a pluck on the ring.',
	},
	proofs: [
		{
			id: 'login',
			title: 'The client logs in to the portal',
			caption: CAPTIONS.login,
			source: 'Ruben, round 29c: a login in the animation makes the turn from the admin\'s side to the client\'s side clear; Portaliq openspec change identity-profile-page (the signed-in client and their details)',
			motion: 'Match cut out of the builder: the canvas the admin just filled leaves the Nextcloud window and grows into the standalone portal, its head carried across: the portal\'s own login page, as the client sees it. The username types on, the password fills in as dots, the sign-in button takes the orange ring and presses on the beat; the signed-in person appears in the portal\'s head and the login card lifts away.',
			sound: 'A soft whoosh as the page grows, key ticks under the username and the password, one dry click on Sign in, a pluck as the person appears.',
			draw: onPage(loginUI, CAPTIONS.login),
		},
		{
			id: 'overview',
			title: 'Every ticket (case), product and invoice, in one view',
			caption: CAPTIONS.overview,
			source: 'Portaliq positioning usp-fleet-data-in-your-portal (records and actions of the sibling apps in one portal); the citizens board\'s invoices and products; Ruben, round 29 scene 1 and round 29b (the portal pages stand on their own)',
			motion: 'Signed in, on the same standalone page (a browser bar, the organisation\'s own head with the client in it, no Nextcloud chrome). Three tiles (tickets, products, invoices) drift in and merge on ease.brand (#10). On beat 6 the tickets tile takes the orange ring; on the last beat it opens out as a hex (#1).',
			sound: 'A soft whoosh as the page grows, a run of soft ticks as the tiles merge, a pluck on the ring.',
			draw: onPage(overviewUI, CAPTIONS.overview),
		},
		{
			id: 'status',
			title: 'Clients follow every ticket, step by step',
			caption: CAPTIONS.status,
			source: 'Portaliq positioning sp-case-status-tracking ("Your case\'s status and its documents sit on one page."); the customer board\'s booked status; Ruben, round 29 scene 2',
			motion: 'Inside the hex from the tickets tile, on the portal page: a ticket and a second one, each with its steps. The mint track runs along both steppers, the steps turning done as it passes; the current step takes the orange ring; the timeline below fills a sixteenth apart, newest first.',
			sound: 'A rising tick per step passed, a pluck on the ring, soft ticks as the timeline fills.',
			draw: onPage(statusUI, CAPTIONS.status),
		},
		{
			id: 'actions',
			title: 'Open tickets, add files, pay invoices',
			caption: CAPTIONS.actions,
			source: 'Portaliq openspec changes contribution-pay-screen (pay from the row), inbox-reply-with-attachments (add a file), positioning usp-self-service-corrections; Ruben, round 29 scene 3',
			motion: 'Technique #9: the portal page holds while the page under its head steps down into three cards. The orange ring moves card to card, a beat apart: on the product it opens a ticket (the button turns into the ticket chip), on a ticket a file drops into its slot, on the invoice Pay presses and the row turns paid.',
			sound: 'A dry click per action, a soft thud as the file lands, a pluck as the invoice turns paid.',
			draw: onPage(actionsUI, CAPTIONS.actions),
		},
		{
			id: 'inbox',
			title: 'Every mail, letter and chat in one inbox',
			caption: CAPTIONS.inbox,
			source: 'Portaliq positioning sp-unified-inbox ("Every message about you lands in one inbox, with an alert."); Ruben, round 29 scene 4',
			motion: 'The whip lands on the inbox page: the channel filter on top, the messages landing one by one from the bottom up (a letter, mails, a chat, each with its channel mark; mail and chat in Nextcloud blue), the newest, a letter, ringed; it opens beside the list.',
			sound: 'A tick per message, a pluck as the letter opens.',
			draw: onPage(inboxUI, CAPTIONS.inbox),
		},
		{
			id: 'profile',
			title: 'Clients update their address and bank info',
			caption: CAPTIONS.profile,
			source: 'Portaliq openspec change identity-profile-page (see and change your own details); positioning usp-self-service-corrections; Ruben, round 29 scene 5 (address, payment information)',
			motion: 'The details page arrives behind the stepped hexes. The address field opens (its edge turns orange), the old value leaves upward and the new one types on, and its pill turns mint; the orange moves to the bank account, which changes the same way.',
			sound: 'Key ticks under each new value, a pluck as each saves.',
			draw: onPage(profileUI, CAPTIONS.profile),
		},
		{
			id: 'mobile',
			title: 'Everything works on their phone',
			caption: CAPTIONS.mobile,
			source: 'The customer board (round 7): the tenant\'s phone with the portal in house style; Portaliq positioning sp-case-status-tracking; Ruben, round 29 scene 6',
			motion: 'Match cut: the portal page shrinks into the phone\'s screen. The same portal on the phone: the head fixed, the page scrolls through the overview to the invoice that is due; a tap (the orange ring) on Pay and it turns paid. Out: the phone lifts away upward.',
			sound: 'A soft whoosh as the page shrinks, a hiss under the scroll, a dry click on the tap.',
			draw: (ctx) => { chrome(ctx, { text: CAPTIONS.mobile, app: 'portaliq' }); phoneUI(ctx.g) },
		},
		{
			id: 'forms',
			title: 'Ask with Forms, answers land in Tables',
			caption: CAPTIONS.forms,
			source: 'Ruben, round 29 scene 8 and round 29b: a Nextcloud Forms form on the portal page collects from clients; the answers land in Nextcloud Tables, inside Nextcloud. Glyphs: Forms img/forms.svg, Tables img/app.svg (both AGPL-3.0, Nextcloud)',
			motion: 'A vertical whip brings in two screens: Tables in its Nextcloud window behind, and in front, on the organisation\'s own page, the Forms form. The answers type on, Submit presses, the answer travels as a row chip across to the table, the rows step down and it lands as the new top row, its cells filling left to right; the new row takes the orange ring. The body ends here on the bar line.',
			sound: 'A whoosh as the screens rise, key ticks under the answers, a dry click on Submit, a whoosh under the travel, ticks as the cells fill, a pluck on the ring.',
			draw: (ctx) => { chrome(ctx, { text: CAPTIONS.forms, app: 'portaliq', captionOpts: { accent2: C.nextcloudCyan } }); collectScene(ctx.g) },
		},
	],
}

export const { meta, boards } = audienceFilm(content)
