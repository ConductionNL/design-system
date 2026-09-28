/**
 * Keepiq, audience film: software teams (DevOps and platform teams at software vendors).
 * Positioning: ds-connext-film-review/audiences/positioning-tk.md. Sources:
 * ~/memcap-work/positioning/mi/positioning/keepiq.json (sp-cicd-machine-secrets,
 * usp-own-certificate-authority (verified), usp-apps-share-your-vault (verified)) and Keepiq's
 * specs on development (machine-secret-leases, secret-store-api, keepiq-cli,
 * certificate-lifecycle, secret-audit-trail).
 *
 *   hook     the pipeline fetches its secret at run time; nothing is written to disk
 *   proof 1  the vault's own certificate authority renews a certificate before it lapses
 *   proof 2  your other apps keep their connection keys in the same vault (Integriq is the
 *            evidenced one and the only app hex drawn; the rest are outside systems, boxes)
 *   general  the data layer: every change to a secret shows who and when
 *   promise  "Human and machine secrets, one vault"
 *
 * Techniques (refs/techniques.md): #4 typewriter (the pipeline log types itself), #11 whip-pan
 * on the beat (into the certificates), #10 loose-shape cluster-to-container merge (the keys drift
 * into the vault), #2 zoom-out sentence build (the promise).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, panel, statusPill, use, flowNode, appTag } from '../../../_lib/ui.js'

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

/** Proof 2: Integriq and two outside systems hand their keys to the vault (sources left, the vault right). */
function appKeysUI(w, geom) {
	const { u } = geom
	const x = geom.x, width = geom.r - geom.x, top = geom.anchor.y - 60
	const vx = x + width * 0.46, vw = width * 0.54
	// sources: Integriq (a real app hex) and two outside systems (boxes)
	appTag(w, x + 94, top + 210, 56, 'integriq', { ringW: 0 })
	rect(w, x + 34, top + 330, 120, 90, C.cobalt50, 5 * u, { stroke: C.cobalt200, 'stroke-width': u })
	for (let k = 0; k < 3; k++) bar(w, x + 54, top + 352 + k * 22, 80 - k * 16, 7, C.cobalt300)
	rect(w, x + 34, top + 470, 120, 90, C.cobalt50, 5 * u, { stroke: C.cobalt200, 'stroke-width': u })
	for (let k = 0; k < 3; k++) bar(w, x + 54, top + 492 + k * 22, 70 - k * 12, 7, C.cobalt300)
	// the keys in flight: small key chips drifting toward their slots
	;[[250, 190], [290, 350], [240, 500]].forEach(([kx, ky], i) => {
		rect(w, x + kx, top + ky - 16, 90, 32, i === 0 ? C.cobalt : C.cobalt400, 16)
		circle(w, x + kx + 20, top + ky, 7, C.white)
		bar(w, x + kx + 36, top + ky - 3, 40, 6, C.white)
	})
	// the vault: one list, one row per key, each with its owner
	panel(w, vx, top, vw, 600, u)
	use(w, 'icon-lock', vx + 30, top + 30, 40, 40, C.cobalt)
	bar(w, vx + 86, top + 40, 200, 14, C.cobalt900)
	for (let i = 0; i < 6; i++) {
		const cy = top + 120 + i * 76
		if (i > 0) rect(w, vx + 20, cy - 38, vw - 40, u, C.cobalt50)
		if (i === 0) appTag(w, vx + 50, cy, 20, 'integriq', { ringW: 0 })
		else rect(w, vx + 32, cy - 18, 36, 36, i % 2 ? C.cobalt100 : C.cobalt50, 4)
		bar(w, vx + 90, cy - 10, [170, 140, 190, 120, 160, 150][i], 9, C.cobalt900)
		for (let k = 0; k < 6; k++) circle(w, vx + 90 + k * 16, cy + 12, 4, C.cobalt300)
	}
	rect(w, vx + 12, top + 120 - 32, vw - 24, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'keepiq',
	audience: { slug: 'dev-teams', name: 'Software teams', persona: 'The DevOps engineer at a 40-person software vendor (Sanne de Groot); the head of engineering or platform lead buys' },
	promise: 'Human and machine\nsecrets, one vault',
	promiseLine: 'Human and machine secrets in one vault, on your own server',
	title: 'Keepiq for software teams',
	record: { one: 'secret', many: 'secrets' },
	logline: 'For software teams: pipelines fetch their secrets with nothing on disk, your own certificates renew themselves, your apps keep their keys in the same vault, and every change is on record.',
	references: REFS,
	techniques: ['#4 typewriter caption (the run log)', '#11 whip-pan on the beat', '#10 loose-shape cluster-to-container merge', '#2 zoom-out sentence build'],
	neighbours: ['integriq', 'openregister'],
	builtOnApps: ['integriq'],
	hook: {
		title: 'Pipelines fetch it, nothing on disk',
		caption: 'Pipelines fetch it,\nnothing on disk',
		ui: { drawUI: pipelineUI, tagFill: 'cobalt' },
		source: 'keepiq.json sp-cicd-machine-secrets: "Fetch a secret in your pipeline without writing it to disk." Specs machine-secret-leases (short-lived lease per fetch), secret-store-api, keepiq-cli.',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, a pipeline run with its four steps, the fetch step ringed. Technique #4, typewriter: the run log types itself line by line under the steps (0.1 s per character block); on the fetch line the secret arrives as masked dots and the lease bar below starts counting down. Out: the hex match cut from the lock on the fetch step.',
		sound: 'Quick key ticks under the log, a soft lock click on the fetch, a low tick as the lease starts.',
	},
	proofs: [
		{
			id: 'certificates',
			title: 'Your certificates renew themselves',
			caption: 'Your certificates\nrenew themselves',
			source: 'keepiq.json usp-own-certificate-authority (verified): "Your vault runs its own certificate authority that renews itself." Spec certificate-lifecycle (inventory, expiry monitoring, guided renewal, CA health).',
			motion: 'Technique #11, whip-pan on the beat: a 5-frame whip (ease.snap, --blur 4) lands on the certificate list. The third certificate\'s time-left track is almost empty; on beat 3 it refills to full in mint, its row takes the orange ring and a mint pill. The authority\'s health pill stays mint above.',
			sound: 'A whoosh on the whip, a rising tick as the track refills, a pluck on the pill.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Your certificates\nrenew themselves', drawUI: certUI, tagFill: 'cobalt' }),
		},
		{
			id: 'app-keys',
			title: 'Your apps keep their keys here',
			caption: 'Your apps keep\ntheir keys here',
			apps: ['keepiq', 'integriq'],
			source: 'keepiq.json usp-apps-share-your-vault (verified): "Your other apps keep their own connection keys in this vault too." Integration evidenced for Integriq (OpenConnector doriath:// integration, machine-secret-leases spec).',
			motion: 'Technique #10, loose-shape cluster-to-container merge: key chips leave Integriq\'s hex and two outside-system boxes on the left, drift on seeded paths and settle into their rows in the vault panel on the right within one beat (ease.brand). The Integriq row takes the orange ring as it lands.',
			sound: 'Soft ticks as each key settles, a pluck on the ring.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Your apps keep\ntheir keys here', drawUI: appKeysUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Every change shows\nwho and when',
		source: 'Keepiq spec secret-audit-trail and secret-version-history; COPY.dataLayer',
		params: {
			record: { avatar: 'square', title: 220, sub: 150, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
			history: [{ av: C.cobalt300, w: 180 }, { av: C.cobalt200, w: 150 }, { av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 130 }],
			links: ['nc-files', 'nc-talk'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15). Straight after the opening\'s handover, on its plain field, the Keepiq cell lands on the loop anchor and turns orange, the Nextcloud hex settles. Under "Keepiq" the promise builds one word per sixteenth from two frames after the handover while the type column eases back. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Keepiq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
