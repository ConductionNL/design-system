/**
 * Keepiq, ONE audience film (Round 20, Ruben 2026-09-28): the software-teams and public-sector IT
 * films merged, built from the software-teams film. Speaks to the DevOps engineer and the
 * municipal system administrator; the head of engineering, the CISO or the information manager
 * buys. Positioning: ds-connext-film-review/audiences/positioning-tk.md. Sources:
 * ~/memcap-work/positioning/mi/positioning/keepiq.json (sp-cicd-machine-secrets,
 * usp-ask-once-fill-once (verified), usp-own-certificate-authority (verified)) and Keepiq's specs
 * on development (machine-secret-leases, secret-store-api, keepiq-cli, secret-requests,
 * certificate-lifecycle, secret-audit-trail).
 *
 *   question "What if apps shared your team's vault?" (Round 19: the promise as a question,
 *            from "Human and machine passwords, one vault")
 *   hook     apps use passwords without reading them: the pipeline fetches its password at run
 *            time, masked, on a short lease, nothing written to disk (Ruben's line, Round 20)
 *   proof 1  request a password by link: one field, filled in once (the public-IT film's proof)
 *   proof 2  the vault's own certificate authority renews a certificate before it lapses
 *   general  a usage dashboard, not the change log (Round 20): for each password, who used it
 *            (a person or an app), when, where and what for
 *
 * Techniques (refs/techniques.md): #4 typewriter (the run log, the masked value), #11 whip-pan
 * on the beat (into the certificates), #3 grid-cell ripple as rows (the usage rows), #2 zoom-out
 * sentence build (the question).
 */
import { C } from '../../../_lib/brand.js'
import { el, textBlock } from '../../../_lib/stage.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, panel, statusPill, use, flowNode, appTag, button, chrome, honeyField, layout } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Text typed live under the UI.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A fast move on the beat between held shots.' },
	{ name: 'Claude mobile tools reel', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
]

/** Hook: a pipeline run; the fetch step pulls the secret into memory, the disk slot stays empty. */
function pipelineUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 190, u)
	const nw = 160, nh = 86, gap = 30, y = top + 52
	for (let i = 0; i < 4; i++) {
		const nx = x + 40 + i * (nw + gap)
		if (i > 0) rect(w, nx - gap, y + nh / 2 - 1.5 * u, gap, 3 * u, C.cobalt300)
		flowNode(w, nx, y, nw, nh, u, { kind: i === 0 ? 'trigger' : 'step' })
		if (i < 2) statusPill(w, nx + nw - 70, y + nh - 20, u)
	}
	// the fetch step: ringed in orange, a lock on it
	const fx = x + 40 + 2 * (nw + gap)
	use(w, 'icon-lock', fx + nw - 50, y + 12, 32, 32, C.cobalt)
	rect(w, fx - 8, y - 8, nw + 16, nh + 16, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// the run log: dark, typed line by line, the secret masked and held in memory only
	const ly = top + 220
	rect(w, x, ly, width, 330, C.cobalt900, 5 * u)
	const lines = [0.5, 0.7, 0.4, 0.62, 0.55]
	lines.forEach((p, i) => {
		const cy = ly + 50 + i * 50
		bar(w, x + 30, cy - 4, 16, 8, i === 2 ? C.mint300 : C.cobalt400)
		bar(w, x + 60, cy - 4, (width - 120) * p, 8, C.cobalt300)
		if (i === 2) for (let k = 0; k < 8; k++) circle(w, x + 60 + (width - 120) * p + 30 + k * 20, cy, 6, C.white)
	})
	// the lease: a short timer bar, counting down
	rect(w, x + 30, ly + 290, width - 60, 10, C.cobalt700, 5)
	rect(w, x + 30, ly + 290, (width - 60) * 0.35, 10, C.mint, 5)
}

/** Proof 1: the certificate list, one certificate renewing itself before it lapses; the authority healthy. */
function certUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	panel(w, x, top, width, 120, u)
	use(w, 'icon-lock', x + 110, top + 36, 48, 48, C.cobalt)
	bar(w, x + 180, top + 40, 240, 16, C.cobalt900)
	statusPill(w, x + width - 140, top + 60, u)
	panel(w, x, top + 150, width, 450, u)
	const left = [0.8, 0.9, 0.08, 0.6, 0.7]
	left.forEach((p, i) => {
		const cy = top + 200 + i * 86
		if (i > 0) rect(w, x + 24, cy - 43, width - 48, u, C.cobalt50)
		rect(w, x + 40, cy - 22, 44, 44, C.cobalt50, 4)
		use(w, 'icon-lock', x + 48, cy - 14, 28, 28, C.cobalt400)
		bar(w, x + 110, cy - 12, [220, 180, 240, 160, 200][i], 10, C.cobalt900)
		bar(w, x + 110, cy + 8, 120, 7, C.cobalt300)
		// the time left: a track; the third was nearly out and has just been renewed to full
		const tx = x + 420, tw = width - 620
		rect(w, tx, cy - 6, tw, 12, C.cobalt100, 6)
		rect(w, tx, cy - 6, tw * (i === 2 ? 1 : p), 12, i === 2 ? C.mint : C.cobalt400, 6)
		if (i === 2) statusPill(w, x + width - 150, cy, u)
	})
	rect(w, x + 24, top + 200 + 2 * 86 - 36, width - 48, 72, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
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

/**
 * General slot, Round 20: the usage dashboard. Drawn in the shared general scenes' local
 * coordinates (x 170 to 780, y 640 to 1240, scale 1.25) so it sits where every general scene
 * sits. Top: one password, its uses per day. Below: its uses, newest first, in four columns with
 * small labels: who (a person's avatar or an app's hex: Integriq, OpenRegister), when, where
 * (the Nextcloud app or pipeline it was used from) and what for. The newest use, by an app, is
 * the one orange ring.
 */
const USAGE_CAPTION = 'Every use: who,\nwhen, where and why'
function usageFrame(ctx) {
	const U = 2.5
	chrome(ctx, { text: USAGE_CAPTION, app: 'keepiq' })
	honeyField(ctx.g, ctx.W * 0.62, ctx.H + 150, 80, 10, { top: ctx.H * 0.61, scale: 0.7, W: ctx.W, H: ctx.H, alpha: { 0: 0.5, 1: 0.46, 2: 0.4, 3: 0.3, 4: 0.2, 5: 0.12, 6: 0.07 } })
	const { ui } = layout(ctx.W, ctx.H)
	const g = el('g', { transform: `translate(${ui.x - 1.25 * 120} ${ui.y - 1.25 * 640}) scale(1.25)` }, ctx.g)
	// the password and its uses per day
	const x = 170, w = 610
	panel(g, x, 640, w, 170, U)
	use(g, 'icon-lock', x + 70, 664, 32, 32, C.cobalt)
	bar(g, x + 116, 672, 200, 14, C.cobalt900)
	const days = [0.3, 0.5, 0.4, 0.7, 0.45, 0.6, 0.35, 0.8, 0.55, 0.65, 0.5, 0.9]
	days.forEach((h, i) => rect(g, x + 70 + i * 43, 790 - 70 * h, 26, 70 * h, i === days.length - 1 ? C.mint : C.cobalt300, 3))
	appTag(g, x, 700, 40, 'keepiq', { ringW: 5 })
	// the uses: who, when, where, what for
	const ty = 830
	panel(g, x, ty, w, 410, U)
	const cols = [[x + 40, 'Who'], [x + 150, 'When'], [x + 290, 'Where'], [x + 450, 'What for']]
	cols.forEach(([cx, t]) => textBlock(g, t, { x: cx, y: ty + 44, size: 22, weight: 600, fill: C.cobalt700, clip: false }))
	rect(g, x + 24, ty + 62, w - 48, U / 2, C.cobalt100)
	const rows = [['app', 'integriq', 'nc-files', C.lavender300], ['person', C.cobalt300, 'nc-mail', C.mint300], ['app', 'openregister', 'nc-activity', C.lavender300], ['person', C.cobalt200, 'nc-talk', C.cobalt100], ['person', C.cobalt300, 'nc-files', C.mint300]]
	rows.forEach(([kind, who, where, why], i) => {
		const cy = ty + 104 + i * 62
		if (i > 0) rect(g, x + 24, cy - 31, w - 48, U / 2, C.cobalt50)
		if (kind === 'app') appTag(g, x + 62, cy, 20, who, { ringW: 0 })
		else circle(g, x + 62, cy, 18, who)
		bar(g, x + 150, cy - 4, [90, 70, 100, 80, 60][i], 8, C.cobalt700)
		use(g, where, x + 290, cy - 14, 28, 28, C.cobalt)
		bar(g, x + 330, cy - 4, [70, 90, 60, 80, 70][i], 8, C.cobalt400)
		rect(g, x + 450, cy - 15, 120, 30, why, 15)
		bar(g, x + 472, cy - 3, 76, 6, C.cobalt900)
	})
	rect(g, x + 14, ty + 104 - 28, w - 28, 56, 'none', 5 * U, { stroke: C.orange, 'stroke-width': 2.5 * U })
}

const content = {
	app: 'keepiq',
	audience: { slug: 'dev-teams', name: 'IT and software teams', persona: 'The DevOps engineer at a 40-person software vendor (Sanne de Groot) and the municipal system administrator (Bas Kuiper); the head of engineering, the CISO or the information manager buys (Round 20: one Keepiq film)' },
	promise: 'What if apps shared\nyour team\'s vault?',
	promiseLine: 'Human and machine passwords in one vault, on your own server',
	title: 'Keepiq',
	record: { one: 'password', many: 'passwords' },
	logline: 'What if apps shared your team\'s vault? Apps use passwords without reading them, colleagues fill in a password by link, your own certificates renew themselves, and every use shows who, when, where and why.',
	references: REFS,
	techniques: ['#4 typewriter caption (the run log, the masked value)', '#11 whip-pan on the beat', '#3 grid-cell ripple (the usage rows)', '#2 zoom-out sentence build (the question)'],
	neighbours: ['integriq', 'openregister'],
	builtOnApps: ['integriq'],
	hook: {
		title: 'Apps use passwords without reading them',
		caption: 'Apps use passwords\nwithout reading them',
		ui: { drawUI: pipelineUI, tagFill: 'cobalt' },
		source: 'Ruben, Round 20 ("Apps use passwords without reading them"). keepiq.json sp-cicd-machine-secrets: "Fetch a secret in your pipeline without writing it to disk." Specs machine-secret-leases (short-lived lease per fetch), secret-store-api, keepiq-cli.',
		motion: 'In behind the app hex the question leaves on the loop anchor, the key frame reads: caption, an app\'s pipeline run with its four steps, the fetch step ringed. Technique #4, typewriter: the run log types itself line by line under the steps (0.1 s per character block); on the fetch line the password arrives only as masked dots, never in clear, and the lease bar below starts counting down: the app uses it and nobody reads it. Out: the hex match cut from the lock on the fetch step.',
		sound: 'Quick key ticks under the log, a soft lock click on the fetch, a low tick as the lease starts.',
	},
	proofs: [
		{
			id: 'request',
			title: 'Request passwords by link',
			caption: 'Request passwords\nby link',
			source: 'From the public-IT film (Round 20 merge). keepiq.json usp-ask-once-fill-once (verified): "Ask a colleague for one value that gets filled in once." Spec secret-requests (fill-in link, encrypted on receipt, write without read).',
			motion: 'The hex lands as the request. The link runs in block by block; the fill-in page drops under it. Technique #4, typewriter: the masked value types itself into the one field, a dot every 0.1 s inside the orange ring, the cursor blinking after the last. The send button lands and the page closes into the vault row.',
			sound: 'Key ticks under the dots, a soft lock click as it is sent.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Request passwords\nby link', drawUI: requestUI, tagFill: 'cobalt' }),
		},
		{
			id: 'certificates',
			title: 'Your certificates renew themselves',
			caption: 'Your certificates\nrenew themselves',
			source: 'keepiq.json usp-own-certificate-authority (verified): "Your vault runs its own certificate authority that renews itself." Spec certificate-lifecycle (inventory, expiry monitoring, guided renewal, CA health).',
			motion: 'Technique #11, whip-pan on the beat: a 5-frame whip (ease.snap, --blur 4) lands on the certificate list. The third certificate\'s time-left track is almost empty; on beat 3 it refills to full in mint, its row takes the orange ring and a mint pill. The authority\'s health pill stays mint above.',
			sound: 'A whoosh on the whip, a rising tick as the track refills, a pluck on the pill.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Your certificates\nrenew themselves', drawUI: certUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		title: 'Every use: who, when, where and why',
		caption: 'Every use: who,\nwhen, where and why',
		source: 'Ruben, Round 20 (a dashboard of when, where, what for and by whom, person or app, each password was used). Spec secret-audit-trail (every read recorded with timestamp, actor: user, application, system or link visitor, and event type; per-secret activity view, admin audit view with filters). "Where" and "what for" go beyond the fields that spec names today.',
		motion: 'Round 20, the usage dashboard replaces the change log. The hex fill lands as the cobalt ground; the password card drops in on the right (0.35 s, ease.brand) with its uses per day, the bars growing left to right, today\'s in mint. On the next beat the uses table lays in under it; its four small column labels (Who, When, Where, What for) land first, then technique #3, grid-cell ripple as rows: the uses step 20% to 40% to full from the top, each with a person\'s avatar or an app\'s hex (Integriq, OpenRegister), the time, the Nextcloud app it came from and a purpose pill. The newest, by an app, takes the orange ring. The honeycomb field pops in from the bottom edge. Out: the cards step down (0.85, ease.exit) and the app tag travels into Built on Nextcloud.',
		params: {},
		sound: 'Rising ticks as the day bars grow, a soft ripple of ticks per row, a click on the ring.',
	},
	promiseMotion: 'Round 19: the promise card is a question, and the proofs answer it (no answer card). Technique #2, zoom-out sentence build, the body\'s opening statement. Straight after the opening\'s handover, on its plain field, the Keepiq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Keepiq" the question builds one word per sixteenth from two frames after the handover while the type column eases back. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Keepiq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

const film = audienceFilm(content)
// Round 20: the general slot draws the usage dashboard instead of the shared change log.
film.boards.find((b) => b.id === 'general-dataLayer').draw = usageFrame
export const { meta, boards } = film
