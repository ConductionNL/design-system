/**
 * Integriq, audience film: government integration teams (municipal integration specialists,
 * provincial integration architects, vendors building for government). Direction C on the
 * app-film template, wrapped by _lib/audiencefilm.js. Lane L1, 2026-09-28. One film: the three
 * customer groups buy the same story at different scales. Positioning:
 * ds-connext-film-review/audiences/positioning-l1.md.
 *
 *   hook     the citizen read live from the base registry, no copy kept (usp-registry-live-read,
 *            verified; spec connector-catalog: the BRP HaalCentraal source)
 *   proof 1  StUF to ZGW, bridged (usp-case-system-bridge, verified; specs stuf-zkn-bridge,
 *            zgw-version-translation)
 *   proof 2  sign in with DigiD, ready to use (usp-citizen-login, verified; spec
 *            digid-eherkenning-auth-adapter)
 *   general  notifications: a source starts failing, Integriq stops calling it and you hear first
 *            (usp-self-healing-sync, verified: http-call-engine REQ-008 per-source circuit breaker;
 *            sp-watch-every-call; spec openconnector-notifications)
 *   promise  "Every outside system, connected to Nextcloud" (the positioning one-liner)
 *
 * Techniques (refs/techniques.md): #3 grid-cell ripple (the live read fills the record in a
 * wave, techniques.md names it for Integriq's feed), #9 text-swap on a held diagram (the bridge
 * holds while the messages swap), #11 whip-pan on the beat (into the sign-in).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { textBlock } from '../../../_lib/stage.js'
import { rect, bar, circle, hex, panel, statusPill, phone, button, use } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping in waves to read as a live feed.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The diagram holds; only the labels change on the beat.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A fast move on the beat between two held shots.' },
]

/** A labelled side box (an outside system: a rectangle, never a hex). */
function sideBox(w, x, y, bw, bh, label, u) {
	rect(w, x, y, bw, bh, C.cobalt50, 4 * u, { stroke: C.cobalt200, 'stroke-width': u })
	textBlock(w, label, { x: x + 24, y: y + 52, size: 36, weight: 600, fill: C.cobalt, clip: false })
	bar(w, x + 24, y + bh - 34, bw - 90, 8, C.cobalt300)
}

/** Hook: the base registry as a side box on the left; the citizen's record on the right, filled live on a wire. */
function liveReadUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	sideBox(w, x, top + 140, 220, 150, 'BRP', u)
	const rx = x + 330, rw = width - 330
	panel(w, rx, top, rw, 620, u)
	circle(w, rx + 70, top + 70, 34, C.cobalt300)
	bar(w, rx + 124, top + 50, 220, 16, C.cobalt900)
	bar(w, rx + 124, top + 80, 130, 9, C.cobalt300)
	statusPill(w, rx + rw - 120, top + 70, u)
	// The fields, filled from the source as it is read (no copy is kept: the values are the live read).
	for (let k = 0; k < 6; k++) {
		const fy = top + 150 + k * 74
		bar(w, rx + 40, fy + 10, 90 - (k % 3) * 12, 8, C.cobalt400)
		rect(w, rx + 170, fy - 6, rw - 210, 42, k < 4 ? C.mint300 : C.cobalt50, 3 * u)
		bar(w, rx + 190, fy + 8, 180 - (k % 2) * 50, 10, k < 4 ? C.mint : C.cobalt200)
	}
	// The wire from the source: square corners; the live read, the one orange, a hex on the wire.
	const wy = top + 215
	rect(w, x + 220, wy - 1.5 * u, 110, 3 * u, C.cobalt300)
	hex(w, x + 275, wy, 16, C.orange, 2)
}

/** Proof 1: the old case system (StUF) on the left, the new one (ZGW) on the right, Integriq in between translating. */
function bridgeUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	const bw = 240, by = top + 120, bh = 420
	sideBox(w, x, by, bw, bh, 'StUF', u)
	sideBox(w, x + width - bw, by, bw, bh, 'ZGW', u)
	// Messages inside each box: the old one as XML-like lines, the new one as fields.
	for (let k = 0; k < 4; k++) {
		bar(w, x + 24 + (k % 2) * 20, by + 100 + k * 44, 150 - (k % 2) * 40, 8, C.cobalt400)
		bar(w, x + width - bw + 24, by + 100 + k * 44, 70, 8, C.cobalt400)
		bar(w, x + width - bw + 106, by + 100 + k * 44, 100 - k * 10, 8, C.cobalt700)
	}
	// Integriq in the middle: its app hex (cobalt, the app), square wires both ways.
	const mx = x + width / 2, my = by + bh / 2
	rect(w, x + bw, my - 1.5 * u, mx - x - bw - 60, 3 * u, C.cobalt300)
	rect(w, mx + 60, my - 1.5 * u, x + width - bw - mx - 60, 3 * u, C.cobalt300)
	hex(w, mx, my, 64, C.cobalt, 6)
	use(w, 'g-integriq', mx - 34, my - 34, 68, 68, C.white)
	// The translated message arriving in the new system: the one orange, as a ring.
	rect(w, x + width - bw + 8, by + 80, bw - 16, 180, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
	// Two message tokens on the wires.
	rect(w, x + bw + 40, my - 22, 60, 44, C.white, 4 * u, { stroke: C.cobalt300, 'stroke-width': u })
	rect(w, mx + 90, my - 22, 60, 44, C.mint300, 4 * u)
}

/** Proof 2: the resident signs in with DigiD on their phone; the portal behind it knows who they are. */
function signInUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	// The portal page behind, waiting for the sign-in.
	panel(w, x, top, width, 560, u)
	bar(w, x + 90, top + 34, 220, 14, C.cobalt900)
	for (let k = 0; k < 4; k++) { rect(w, x + 40, top + 100 + k * 100, width - 460, 80, C.cobalt50, 4 * u); bar(w, x + 70, top + 130 + k * 100, 200 - k * 20, 10, C.cobalt300) }
	// The phone: the DigiD sign-in, the code entered, the button.
	const p = phone(w, x + width - 380, top + 40, 330, 660)
	const sx = p.x + 30, sw = p.w - 60
	rect(p.screen, sx, p.y + 90, sw, 110, C.cobalt50, 4 * u)
	textBlock(p.screen, 'DigiD', { x: sx + 26, y: p.y + 160, size: 40, weight: 700, fill: C.cobalt, clip: false })
	for (let k = 0; k < 5; k++) circle(p.screen, sx + 40 + k * 46, p.y + 270, 14, k < 4 ? C.cobalt : C.cobalt100)
	button(p.screen, sx, p.y + 340, sw, 56, u)
	statusPill(p.screen, sx, p.y + 450, u)
	// The sign-in button: the one orange, as a ring.
	rect(p.screen, sx - 8, p.y + 332, sw + 16, 72, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'integriq',
	audience: { slug: 'integration', name: 'Government integration teams', persona: 'Daan Verhoeven, integratiespecialist (municipality); Renske Bakker, integratiearchitect (province); Youssef El Amrani, integration developer at a vendor' },
	promise: 'Outside systems,\nplugged in',
	promiseLine: 'Connect the base registries and every other outside system to your Nextcloud',
	title: 'Integriq for integration teams',
	record: { one: 'connection', many: 'connections' },
	logline: 'For the teams that connect a municipality, province or vendor product to the base registries and case systems: read the citizen live from the source, bridge StUF and ZGW, let residents sign in with DigiD, and hear first when a source starts failing, while Integriq stops calling it.',
	references: REFS,
	techniques: ['#3 grid-cell ripple (the live read)', '#9 text-swap on a held diagram (the bridge)', '#11 whip-pan on the beat (into the sign-in)'],
	neighbours: ['openregister', 'dossiq', 'portaliq'],
	builtOnApps: ['openregister'],
	hook: {
		title: 'The citizen, live from the source',
		caption: 'The citizen, live\nfrom the source',
		ui: { drawUI: liveReadUI, tagFill: 'cobalt' },
		source: 'positioning integriq usp-registry-live-read, verified ("Read a citizen or company straight from the source, live."; scene: "the lookup reads straight from the base itself"); spec connector-catalog (BRP HaalCentraal source, category "Government registers")',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the base registry as a side box on the left (BRP as a small label), the citizen\'s record on the right, the Integriq hex (cobalt) on the loop anchor. Technique #3, grid-cell ripple: an orange hex runs along the square wire (the live read) and the record\'s fields step from 20% to 40% to full mint in a wave, top to bottom, within one bar. No copy lands anywhere: when the read ends the wire stays live.',
		sound: 'A soft pulse along the wire, a ripple of ticks as the fields fill.',
	},
	proofs: [
		{
			id: 'bridge',
			title: 'StUF to ZGW, bridged for you',
			caption: 'StUF to ZGW,\nbridged for you',
			source: 'positioning integriq usp-case-system-bridge, verified ("Bridge an old case system and a new one automatically."; scene: "a bridge translates between the two versions for you"); specs stuf-zkn-bridge (StUF-ZKN 3.10), zgw-version-translation',
			motion: 'The old case system (StUF) and the new one (ZGW) stand as side boxes, the Integriq hex between them on square wires. Technique #9, text-swap on a held diagram: the diagram holds; message tokens leave the left box, pass through the hex and arrive on the right as fields, one per beat, and the box heads\' small labels stay put. The arriving message takes the orange ring on the last beat.',
			sound: 'A soft whoosh per message through the hex, a pluck as each lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'StUF to ZGW,\nbridged for you', drawUI: bridgeUI, tagFill: 'cobalt' }),
		},
		{
			id: 'signin',
			title: 'DigiD sign-in, ready to use',
			caption: 'DigiD sign-in,\nready to use',
			source: 'positioning integriq usp-citizen-login, verified ("Let a resident sign in the way the law already requires."; scene: "the sign-in flow the law requires ships out of the box"); spec digid-eherkenning-auth-adapter',
			motion: 'Technique #11, whip-pan: a 5-frame move on ease.snap (rendered with --blur 4) from the bridge to the resident\'s phone, over the portal page. The code dots fill one per sixteenth, the sign-in button takes the orange ring, the pill turns mint and the portal behind fills with their own items.',
			sound: 'A short whoosh on the whip, soft key ticks on the code, a dry click on sign-in.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'DigiD sign-in,\nready to use', drawUI: signInUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'A source fails? You hear first',
		caption: 'A source fails?\nYou hear first',
		source: 'positioning integriq usp-self-healing-sync, verified ("it cuts itself off and you switch it back on"; spec http-call-engine REQ-008 per-source circuit breaker) and sp-watch-every-call ("you get a message the moment it starts failing"); spec openconnector-notifications; story.json mechanic 8',
		params: {
			record: { avatar: 'square', title: 240, sub: 150, status: 'none' },
			event: { stage: 2, stages: 4 },
			notices: [{ app: 'integriq' }, { icon: 'nc-mail' }, { icon: 'nc-talk' }],
			recipients: [C.cobalt300],
		},
		sound: 'A low tick as the source trips, a dry click as the notice lands (no bell).',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15). Straight after the opening\'s handover, on its plain field, the Integriq cell lands on the loop anchor and turns orange, OpenRegister, Dossiq and Portaliq lock in white round the Nextcloud hex. Under "Integriq" the promise builds one word per sixteenth from two frames after the handover while the type column\'s camera eases back; at rest it is the key frame. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Integriq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
