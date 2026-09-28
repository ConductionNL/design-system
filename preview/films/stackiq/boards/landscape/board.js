/**
 * Stackiq, audience film: government enterprise and portfolio architects and CIOs
 * (municipalities, provinces and waterschappen, central government). Direction C on the
 * app-film template, wrapped by _lib/audiencefilm.js. Lane L1, 2026-09-28. One film: the three
 * customer groups ask the same question at different scales. Positioning:
 * ds-connext-film-review/audiences/positioning-l1.md.
 *
 *   hook     every application with its owner and supplier (sp-landscape-register; spec
 *            application-lifecycle-tracking)
 *   proof 1  every connection it has, before you touch it (sp-dependency-mapping; spec
 *            archimate-import)
 *   proof 2  checked against every BIO measure (usp-bio-compliance, verified; spec
 *            bio-compliance-assessment)
 *   general  notifications: a contract nears expiry and the owner hears (sp-contract-lifecycle;
 *            spec softwarecatalog-notifications, the contract-expiry rule)
 *   promise  "Everything you run, one list" (Round 18 copy pass)
 *
 * The thin USPs (vulnerability to version, AI Act, licence position, organisation merge) are not
 * used. Applications in the customer's landscape are drawn as rectangles: hexes are installable
 * apps (bible), and these are the customer's systems.
 *
 * Techniques (refs/techniques.md): #10 cluster-to-container merge (the landscape gathers into
 * one list), #2 zoom-out (from one row out to its connections), #3 grid-cell ripple (the BIO
 * matrix fills in waves).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { textBlock } from '../../../_lib/stage.js'
import { rect, bar, circle, panel } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Claude mobile tools', url: 'https://whatships.com/videos/claude-mobile-tools-figma-canva-amplitude/', borrow: 'Loose shapes drift together into one container.' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The camera pulls back on ease.brand as the picture grows.' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping in waves.' },
]

/** An application: a square icon (the customer's system, not an installable app hex). */
const appIcon = (w, x, y, s, fill) => rect(w, x, y, s, s, fill, s * 0.22)

/** Hook: the landscape: every application with its owner, its supplier and its lifecycle phase. */
function landscapeUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 640, u)
	const cols = [x + 90, x + 380, x + 520, x + 700]
	cols.forEach((hx) => bar(w, hx, top + 30, 80, 8, C.cobalt400))
	const phase = [C.mint300, C.mint300, C.lavender300, C.mint300, C.cobalt100, C.mint300, C.lavender300, C.mint300]
	for (let r = 0; r < 8; r++) {
		const cy = top + 86 + r * 68
		if (r) rect(w, x + 20, cy - 34, width - 40, u, C.cobalt50)
		appIcon(w, x + 36, cy - 18, 36, r % 3 ? C.cobalt300 : C.cobalt200)
		bar(w, cols[0], cy - 6, 220 - (r % 3) * 40, 10, C.cobalt900)
		circle(w, cols[1] + 16, cy, 16, r % 2 ? C.cobalt200 : C.cobalt300)
		bar(w, cols[1] + 42, cy - 4, 60, 8, C.cobalt300)
		bar(w, cols[2], cy - 5, 120 - (r % 2) * 30, 10, C.cobalt700)
		rect(w, cols[3], cy - 15, 110, 30, phase[r], 15)
	}
	// The application the next scene opens: its row ringed, the one orange.
	rect(w, x + 12, top + 86 + 2 * 68 - 32, width - 24, 64, 'none', 5 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 1: the application in the middle and every application it connects to, on square wires. */
function dependencyUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 660, u)
	const cx = x + width / 2, cy = top + 340
	const node = (nx, ny, main) => {
		rect(w, nx - 110, ny - 44, 220, 88, main ? C.white : C.cobalt50, 4 * u, { stroke: main ? C.cobalt : C.cobalt200, 'stroke-width': main ? 2 * u : u })
		appIcon(w, nx - 90, ny - 18, 36, main ? C.cobalt : C.cobalt300)
		bar(w, nx - 40, ny - 10, 120, 10, C.cobalt900)
		bar(w, nx - 40, ny + 10, 70, 7, C.cobalt300)
	}
	const around = [[x + 170, top + 120], [x + width - 170, top + 120], [x + 170, top + 560], [x + width - 170, top + 560], [x + 170, cy], [x + width - 170, cy]]
	around.forEach(([nx, ny]) => {
		// Square corners: out horizontally from the centre node, then vertically to the other's level.
		const midX = nx < cx ? cx - 170 : cx + 170
		rect(w, Math.min(cx, midX), cy - 1.5 * u, Math.abs(midX - cx), 3 * u, C.cobalt300)
		rect(w, midX - 1.5 * u, Math.min(cy, ny), 3 * u, Math.abs(ny - cy), C.cobalt300)
		const ex = nx < cx ? nx + 110 : nx - 110
		rect(w, Math.min(midX, ex), ny - 1.5 * u, Math.abs(ex - midX), 3 * u, C.cobalt300)
	})
	around.forEach(([nx, ny]) => node(nx, ny, false))
	node(cx, cy, true)
	rect(w, cx - 122, cy - 56, 244, 112, 'none', 6 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

/** Proof 2: the BIO matrix: applications down, measures across; verified (mint), claimed (lavender), missing (open). */
function bioUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 640, u)
	textBlock(w, 'BIO', { x: x + 90, y: top + 50, size: 36, weight: 700, fill: C.cobalt, clip: false })
	const gx = x + 300, cols = 8, cw = (width - 330) / cols
	for (let c = 0; c < cols; c++) bar(w, gx + c * cw + cw / 2 - 14, top + 84, 28, 8, C.cobalt300)
	const grid = ['vvvcvvmv', 'vcvvvvvv', 'vvmvcvvc', 'vvvvvvvv', 'cvvvmvvv', 'vvvcvvvm', 'vmvvvcvv']
	grid.forEach((row, r) => {
		const cy = top + 140 + r * 68
		appIcon(w, x + 36, cy - 18, 36, r % 3 ? C.cobalt300 : C.cobalt200)
		bar(w, x + 90, cy - 5, 170 - (r % 3) * 30, 10, C.cobalt900)
		;[...row].forEach((s, c) => {
			const fx = gx + c * cw + 6, fw = cw - 12
			if (s === 'v') rect(w, fx, cy - 22, fw, 44, C.mint300, 3 * u)
			else if (s === 'c') rect(w, fx, cy - 22, fw, 44, C.lavender300, 3 * u)
			else rect(w, fx, cy - 22, fw, 44, C.white, 3 * u, { stroke: C.cobalt300, 'stroke-width': u, 'stroke-dasharray': '6 5' })
		})
	})
	// The missing measure the architect acts on first: the one orange, as a ring.
	rect(w, gx + 2 * cw + 1, top + 140 + 2 * 68 - 27, cw - 2, 54, 'none', 4 * u, { stroke: C.orange, 'stroke-width': 2.5 * u })
}

const content = {
	app: 'stackiq',
	audience: { slug: 'landscape', name: 'Government architects and CIOs', persona: 'Sanne de Boer, enterprise architect (municipality); Bas Kramer, portfolio architect (province); Maartje Hendriks, CIO (central government)' },
	promise: 'Everything you run,\none list',
	promiseLine: 'Every application your organisation runs, in one list',
	title: 'Stackiq for architects',
	record: { one: 'application', many: 'applications' },
	logline: 'For the architects who have to answer what the organisation runs: every application with its owner and supplier, every connection before you touch it, every application against the BIO, and the owner hears when a contract nears its end.',
	references: REFS,
	techniques: ['#10 cluster-to-container merge (the landscape)', '#2 zoom-out (row to connections)', '#3 grid-cell ripple (the BIO matrix)'],
	neighbours: ['openregister', 'opencatalogi', 'integriq'],
	builtOnApps: ['opencatalogi'],
	hook: {
		title: 'Every application, owner and supplier',
		caption: 'Every application,\nowner and supplier',
		ui: { drawUI: landscapeUI, tagFill: 'cobalt' },
		source: 'positioning stackiq sp-landscape-register ("Every application carries its own supplier and owner."); spec application-lifecycle-tracking (planned, in use, phasing out)',
		motion: 'In behind the app hex the promise leaves on the loop anchor, the key frame reads: caption, the landscape as one list (application, owner, supplier, lifecycle phase), the Stackiq hex (cobalt) on the loop anchor. Technique #10, cluster-to-container merge: over the first two beats the rows start as loose square icons scattered over the window (a shared drive, a catalogue, colleagues\' notes) and each tweens into its row on ease.brand, arriving within one beat; then owners, suppliers and phase pills fill a sixteenth apart. On beat 5 one row takes the orange ring.',
		sound: 'A run of soft ticks as the rows land, a pluck on the ringed row.',
	},
	proofs: [
		{
			id: 'dependencies',
			title: 'See every link before changing it',
			caption: 'See every link\nbefore changing it',
			source: 'positioning stackiq sp-dependency-mapping ("Every connection an application has shows on its own page and diagram."; so: "a retirement plan starts from evidence, not a guess"); spec archimate-import (elements and relationships)',
			motion: 'Technique #2, zoom-out: the camera pushes into the ringed row until it fills the window, then pulls back on ease.brand as its connections appear round it: square-cornered wires step out to six applications, one per eighth note, so the picture always just fits. The centre application keeps the orange ring.',
			sound: 'A soft whoosh on the push, a tick per connection as it lands.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'See every link\nbefore changing it', drawUI: dependencyUI, tagFill: 'cobalt' }),
		},
		{
			id: 'bio',
			title: 'Security rules checked per application',
			caption: 'Security rules checked\nper application',
			source: 'positioning stackiq usp-bio-compliance, verified ("Every application shows verified, claimed or missing against each BIO measure."; scene: "one matrix shows every application against every BIO measure"); spec bio-compliance-assessment',
			motion: 'Technique #3, grid-cell ripple: the matrix (applications down, measures across, BIO as a small label) fills in waves from the top-left cell by axial distance, each cell stepping 20% to 40% to full: verified mint, claimed lavender, missing left open with a dashed edge. On the last beat the first missing measure takes the orange ring.',
			sound: 'A ripple of soft ticks across the matrix, a low tick on the ringed cell.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Security rules checked\nper application', drawUI: bioUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'notify',
		title: 'A contract expiring? The owner hears',
		caption: 'A contract expiring?\nThe owner hears',
		source: 'positioning stackiq sp-contract-lifecycle ("a contract\'s status moves itself as its dates pass"); spec softwarecatalog-notifications (alerts on approaching contract expiry to record manage-ACL holders); story.json mechanic 8',
		params: {
			record: { avatar: 'square', title: 240, sub: 150, status: 'none' },
			event: { stage: 2, stages: 3 },
			notices: [{ app: 'stackiq' }, { icon: 'nc-mail' }, { icon: 'nc-calendar' }],
			recipients: [C.cobalt300],
		},
		sound: 'A low tick as the contract reaches its stage, a dry click as the notice lands (no bell).',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build, now the body\'s opening statement (Round 15). Straight after the opening\'s handover, on its plain field, the Stackiq cell lands on the loop anchor and turns orange, OpenRegister, OpenCatalogi and Integriq lock in white round the Nextcloud hex. Under "Stackiq" the promise builds one word per sixteenth from two frames after the handover while the type column\'s camera eases back; at rest it is the key frame. Holds to four frames before beat 9; then the field, the neighbours and the Nextcloud hex step out on 16ths and the Stackiq cell shrinks in place on the loop anchor to the hook\'s tag, turning cobalt, while the hook\'s window lays in behind it.',
}

export const { meta, boards } = audienceFilm(content)
