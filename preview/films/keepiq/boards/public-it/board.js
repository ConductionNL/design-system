/**
 * Keepiq, audience film: public-sector IT (the municipal system administrator and the CISO).
 * Positioning: ds-connext-film-review/audiences/positioning-tk.md. Sources:
 * ~/memcap-work/positioning/mi/positioning/keepiq.json (sp-team-folder-roles,
 * usp-ask-once-fill-once (verified), sp-siem-forwarding, usp-decoy-credentials (verified)) and
 * Keepiq's specs on development (team-folder-sharing, folder-permission-grades, secret-requests,
 * siem-audit-export, honey-credentials).
 *
 *   hook     a shared folder with a role per person: view, edit or manage
 *   proof 1  request a password by link: one field, filled in once, straight into the vault
 *   proof 2  every vault event forwarded to the SIEM the team already watches
 *   general  notifications, carrying the decoy: a decoy login is touched and you hear at once
 *   promise  "Your team's secrets, on your Nextcloud"
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (the roles swap on the held
 * folder), #4 typewriter (the masked value types itself in), #3 grid-cell ripple as rows (the
 * event log streams in waves), #2 zoom-out sentence build (the promise).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, panel, statusPill, idlePill, use, button } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only one element changes.' },
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Letters typed live under the UI.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Rows lighting in waves read as activity.' },
]

/** A role pill: view (cobalt-100), edit (lavender-300), manage (cobalt). */
function rolePill(w, x, cy, role, u) {
	const [bg, ink, lw] = { view: [C.cobalt100, C.cobalt700, 50], edit: [C.lavender300, C.cobalt900, 44], manage: [C.cobalt, C.white, 70] }[role]
	rect(w, x, cy - 18, 120, 36, bg, 18)
	bar(w, x + (120 - lw) / 2, cy - 4, lw, 8, ink)
}

/** Hook: the team folder, its members and their roles; one member's role menu open. */
function folderUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 120, u)
	use(w, 'icon-lock', x + 110, top + 36, 48, 48, C.cobalt)
	bar(w, x + 180, top + 38, 260, 18, C.cobalt900)
	bar(w, x + 180, top + 72, 180, 10, C.cobalt300)
	idlePill(w, x + width - 150, top + 60, u, { w: 44, bg: C.cobalt100, ink: C.cobalt700 })
	panel(w, x, top + 150, width, 430, u)
	const roles = ['manage', 'edit', 'view', 'view', 'edit']
	roles.forEach((role, i) => {
		const cy = top + 200 + i * 80
		if (i > 0) rect(w, x + 24, cy - 40, width - 48, u, C.cobalt50)
		circle(w, x + 60, cy, 22, i % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, x + 100, cy - 10, [200, 170, 230, 150, 190][i], 10, C.cobalt900)
		bar(w, x + 100, cy + 8, 120, 7, C.cobalt300)
		rolePill(w, x + width - 170, cy, role, u)
	})
	// the role menu on the third member: view, edit, manage, "edit" chosen (the one orange)
	const mx = x + width - 190, my = top + 200 + 2 * 80 + 30
	rect(w, mx, my + 8, 170, 170, C.cobalt100, 6)
	panel(w, mx, my, 170, 170, u)
	;['view', 'edit', 'manage'].forEach((r, k) => rolePill(w, mx + 25, my + 34 + k * 52, r, u))
	rect(w, mx + 19, my + 34 + 52 - 24, 132, 48, 'none', 24, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the request link and the one field it asks for, masked as it is typed. */
function requestUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	// the request: who asks, the link, one expiry
	panel(w, x, top, width, 170, u)
	circle(w, x + 60, top + 60, 24, C.cobalt300)
	bar(w, x + 100, top + 48, 240, 12, C.cobalt900)
	rect(w, x + 40, top + 104, width - 240, 40, C.cobalt50, 4 * u)
	for (let i = 0; i < 14; i++) rect(w, x + 56 + i * 24, top + 116, i % 5 === 4 ? 8 : 16, 16, C.cobalt700, 2)
	button(w, x + width - 180, top + 100, 140, 48, u, { kind: 'ghost' })
	// the fill-in page: one field, masked dots typing in, the lock
	const fy = top + 210
	panel(w, x + 80, fy, width - 160, 330, u)
	use(w, 'icon-lock', x + 120, fy + 36, 44, 44, C.cobalt)
	bar(w, x + 180, fy + 50, 220, 14, C.cobalt900)
	bar(w, x + 120, fy + 120, 130, 9, C.cobalt400)
	rect(w, x + 120, fy + 144, width - 240, 60, C.white, 4 * u, { stroke: C.cobalt200, 'stroke-width': u })
	for (let i = 0; i < 11; i++) circle(w, x + 150 + i * 30, fy + 174, 8, C.cobalt900)
	rect(w, x + 150 + 11 * 30 - 6, fy + 158, 3, 32, C.cobalt400)
	rect(w, x + 114, fy + 138, width - 228, 72, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	rect(w, x + width - 300, fy + 250, 180, 52, C.cobalt, 4 * u)
	bar(w, x + width - 250, fy + 272, 80, 8, C.white)
}

/** Proof 2: the vault's event log streaming out to the team's SIEM (an outside system: a box, right). */
function siemUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	const lw = width * 0.62
	panel(w, x, top, lw, 600, u)
	bar(w, x + 30, top + 34, 180, 14, C.cobalt900)
	const kinds = [C.mint, C.cobalt300, C.lavender, C.cobalt300, C.mint, C.cobalt300, C.cobalt300]
	kinds.forEach((k, i) => {
		const cy = top + 100 + i * 70
		if (i === 0) rect(w, x + 12, cy - 30, lw - 24, 60, C.cobalt50, 3 * u)
		bar(w, x + 30, cy - 4, 56, 8, C.cobalt400)
		rect(w, x + 104, cy - 12, 24, 24, k, 4)
		bar(w, x + 146, cy - 10, [200, 160, 220, 140, 180, 170, 150][i], 9, C.cobalt900)
		bar(w, x + 146, cy + 6, 110, 6, C.cobalt300)
		// each row's wire to the SIEM box
		rect(w, x + lw - 6, cy - 1.5, width - lw - 24 + 6, 3, i === 0 ? C.cobalt400 : C.cobalt100)
	})
	rect(w, x + 6, top + 64, lw - 12, 72, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// the outside system: a plain box, dark, with its own feed of the same rows
	const bx = x + width - 24 - 0.3 * width, bw = 0.3 * width + 24
	rect(w, bx + 18, top + 60, bw - 18, 480, C.cobalt900, 5 * u)
	for (let i = 0; i < 8; i++) {
		bar(w, bx + 44, top + 100 + i * 52, 14, 8, i === 0 ? C.mint300 : C.cobalt400)
		bar(w, bx + 70, top + 100 + i * 52, (bw - 120) * [0.9, 0.6, 0.8, 0.7, 0.5, 0.8, 0.6, 0.7][i], 8, C.cobalt300)
	}
	statusPill(w, bx + bw - 110, top + 500, u)
}

const content = {
	app: 'keepiq',
	audience: { slug: 'public-it', name: 'Public-sector IT', persona: 'The municipal system administrator (Bas Kuiper); the CISO or information manager buys' },
	promise: "Your team's secrets,\non your Nextcloud",
	promiseLine: "Keep your team's secrets safe on the Nextcloud you already run",
	title: 'Keepiq for public-sector IT',
	record: { one: 'secret', many: 'secrets' },
	logline: 'For government IT: a role per person on every shared folder, passwords requested by link, every vault event in your SIEM, and a decoy login that tells you the moment it is touched.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram', '#4 typewriter caption (masked value)', '#3 grid-cell ripple (event rows)', '#2 zoom-out sentence build'],
	neighbours: ['integriq', 'openregister'],
	builtOnApps: ['integriq'],
	hook: {
		title: 'Shared logins, a role per person',
		caption: 'Shared logins,\na role per person',
		ui: { drawUI: folderUI, tagFill: 'cobalt' },
		source: 'keepiq.json sp-team-folder-roles: "Give a shared folder its own access level per person." Specs team-folder-sharing, folder-permission-grades.',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the team folder with its members and role pills. Technique #9, text-swap on a held diagram: the folder holds still; only the third member\'s role changes, the menu opening under it and "edit" taking the orange ring on beat 3, the pill swapping in place. Out: the hex match cut from the pill into the request scene.',
		sound: 'A pluck as the menu opens, a tick as the role swaps.',
	},
	proofs: [
		{
			id: 'request',
			title: 'Request a password by link',
			caption: 'Request a password\nby link',
			source: 'keepiq.json usp-ask-once-fill-once (verified): "Ask a colleague for one value that gets filled in once." Spec secret-requests (fill-in link, encrypted on receipt, write without read).',
			motion: 'The hex lands as the request. The link runs in block by block; the fill-in page drops under it. Technique #4, typewriter: the masked value types itself into the one field, a dot every 0.1 s inside the orange ring, the cursor blinking after the last. The send button lands and the page closes into the vault row.',
			sound: 'Key ticks under the dots, a soft lock click as it is sent.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Request a password\nby link', drawUI: requestUI, tagFill: 'cobalt' }),
		},
		{
			id: 'siem',
			title: 'Every vault event to your SIEM',
			caption: 'Every vault event\nto your SIEM',
			source: 'keepiq.json sp-siem-forwarding: "Forward every vault event to the SIEM your team already watches." Spec siem-audit-export (syslog and signed webhook sinks).',
			motion: 'Technique #3, grid-cell ripple, as rows: the event log fills in waves from the top, each row stepping 20% to 40% to full, and a pulse runs along its wire into the dark box on the right, where the same row lands. The newest row takes the orange ring.',
			sound: 'A soft ripple of ticks per wave, a low pulse along each wire.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Every vault event\nto your SIEM', drawUI: siemUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		caption: 'Decoy touched?\nYou hear at once',
		source: 'keepiq.json usp-decoy-credentials (verified): "Plant a decoy credential that alerts you the moment it\'s touched." Spec honey-credentials (high-severity alert to owner and admins). COPY.notify.',
		params: {
			record: { avatar: 'square', title: 220, sub: 150, status: 'idle' },
			event: { stage: 3, stages: 4 },
			notices: [{ app: 'keepiq' }, { icon: 'nc-files' }, { icon: 'nc-talk' }],
			recipients: [C.cobalt300, C.cobalt200],
		},
		motion: 'The decoy login card sits in the vault; someone opens it and its last stage lights lavender. A wire runs to the bell in Nextcloud\'s header, the badge lands (the one orange), and the Keepiq notice tops the popover for the owner and the admin, two avatars.',
		sound: 'A dry click as the decoy is opened, a pluck as the notice lands. No bell sound.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15). Straight after the opening\'s handover, on its plain field, the Keepiq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Keepiq" the promise builds one word per sixteenth from two frames after the handover while the type column eases back. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Keepiq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
