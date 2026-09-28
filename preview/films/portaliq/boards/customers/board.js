/**
 * Portaliq, audience film: the customer portal (housing corporations, associations). Schools
 * are not in this film (Ruben, Round 7 decisions): the parent side lives in the Learniq schools film.
 * Direction C on the app-film template, wrapped by _lib/audiencefilm.js. Round 7: matrix
 * features count as built. Research: ds-connext-film-review/apps/portaliq/research.json;
 * positioning: ds-connext-film-review/audiences/positioning.md.
 *
 *   hook     a tenant reports a repair from the portal on their phone (sp-case-status-tracking)
 *   proof 1  the fitter is booked and the tenant sees it live (sp-case-status-tracking)
 *   proof 2  a member fixes their own details, no ticket (usp-self-service-corrections)
 *   general  the data layer: every change shows who and when, the written trail
 *   promise  "A written trail, not a phone queue"
 *   (Round 15: the promise opens the body, straight after the opening; the body ends on the
 *   general scene and the app name returns in Built on Nextcloud)
 *
 * Techniques (refs/techniques.md): #9 text-swap on a held diagram (hook to proof 1: the phone
 * holds, the caption swaps and the status grows under it), #11 whip-pan on the beat (proof 1
 * to proof 2), #2 zoom-out sentence build (the promise).
 */
import { C } from '../../../_lib/brand.js'
import { audienceFilm } from '../../../_lib/audiencefilm.js'
import { FRAMES } from '../../../_lib/scenes/general.js'
import { rect, bar, circle, hex, panel, statusPill, idlePill, button, phone } from '../../../_lib/ui.js'

const REFS = [
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The picture holds while the caption swaps; the promise builds as the camera pulls back.' },
	{ name: 'Yoya', url: 'https://whatships.com/videos/yoya/', borrow: 'A whip on the beat between two held shots.' },
]

/** The tenant's phone in the window: the portal in house style, a repair report. */
function tenantPhone(w, geom, { booked = false } = {}) {
	const { u } = geom
	const px = geom.x + 40, py = geom.anchor.y - 70, pw = 360, ph = 760
	const p = phone(w, px, py, pw, ph)
	const s = p.screen, x = p.x, width = p.w
	rect(s, x, p.y + 60, width, 90, C.cobalt700)
	hex(s, x + 44, p.y + 105, 18, C.white, 3)
	bar(s, x + 76, p.y + 99, 110, 12, C.white)
	// The repair: a photo tile, the kind of repair as chips, the description.
	rect(s, x + 24, p.y + 176, width - 48, 170, C.cobalt50, 4 * u)
	hex(s, x + width / 2, p.y + 261, 30, C.cobalt200, 4)
	;[90, 70, 100].forEach((cw, i) => rect(s, x + 24 + [0, 100, 180][i], p.y + 370, cw, 36, i === 1 ? C.cobalt : C.white, 18, { stroke: C.cobalt200, 'stroke-width': u }))
	for (let i = 0; i < 2; i++) bar(s, x + 24, p.y + 440 + i * 26, width - 90 - i * 60, 8, C.cobalt200)
	if (!booked) {
		button(s, x + 24, p.y + 530, width - 48, 60, u, { kind: 'accent' })
		return p
	}
	// Booked: the status on the phone, the fitter's slot.
	statusPill(s, x + 24, p.y + 530, u)
	return p
}

/** Hook: the repair report on the phone, the send button waiting. */
function reportUI(w, geom) { tenantPhone(w, geom) }

/** Proof 1: the phone holds; beside it the status grows: reported, booked (the fitter, the date), done. */
function bookedUI(w, geom) {
	const { u } = geom
	tenantPhone(w, geom, { booked: true })
	const x = geom.x + 460, top = geom.anchor.y - 40, width = geom.r - x
	panel(w, x, top, width, 520, u)
	const steps = [{ s: 'done' }, { s: 'now' }, { s: 'next' }]
	steps.forEach((st, i) => {
		const cy = top + 80 + i * 150
		if (i < 2) rect(w, x + 58, cy + 22, 3 * u, 106, i === 0 ? C.mint : C.cobalt100)
		hex(w, x + 60, cy, 22, st.s === 'done' ? C.mint : st.s === 'now' ? C.cobalt : C.cobalt100, 3)
		if (st.s === 'now') hex(w, x + 60, cy, 32, 'none', 4, { stroke: C.orange, 'stroke-width': 2.5 * u })
		bar(w, x + 110, cy - 12, 170 - i * 20, 12, C.cobalt900)
		bar(w, x + 110, cy + 10, 110, 8, C.cobalt300)
		if (st.s === 'now') {
			// The fitter and the date.
			circle(w, x + 130, cy + 60, 20, C.cobalt300)
			rect(w, x + 170, cy + 42, 120, 36, C.cobalt50, 18)
			bar(w, x + 186, cy + 56, 88, 8, C.cobalt700)
		}
	})
}

/** Proof 2: the member's profile, one field edited inline and saved. */
function detailsUI(w, geom) {
	const { u } = geom
	const x = geom.x, top = geom.anchor.y - 60, width = geom.r - geom.x
	panel(w, x, top, width, 150, u)
	circle(w, x + 80, top + 75, 38, C.cobalt300)
	bar(w, x + 140, top + 52, 240, 16, C.cobalt900)
	bar(w, x + 140, top + 86, 150, 9, C.cobalt300)
	const fy = top + 180
	panel(w, x, fy, width, 440, u)
	;[[200, false], [260, true], [170, false], [220, false]].forEach(([lw, edit], i) => {
		const cy = fy + 60 + i * 96
		bar(w, x + 40, cy - 28, 100, 8, C.cobalt400)
		rect(w, x + 40, cy - 12, width - 280, 52, C.white, 3 * u, { stroke: edit ? C.orange : C.cobalt100, 'stroke-width': edit ? 2.5 * u : u })
		bar(w, x + 60, cy + 8, lw, 11, C.cobalt900)
		if (edit) {
			rect(w, x + 60 + lw + 8, cy, 3 * u, 30, C.cobalt)
			statusPill(w, x + width - 200, cy + 14, u)
		} else idlePill(w, x + width - 190, cy + 14, u, { w: 30 })
	})
}

const content = {
	app: 'portaliq',
	audience: { slug: 'customers', name: 'Customer portal', persona: 'Esther Kuipers, customer contact manager at a housing corporation; Anouk Terpstra, member services coordinator' },
	promise: 'A written trail,\nnot a phone queue',
	promiseLine: 'Repairs and memberships on one page, with a written trail instead of a phone queue',
	title: 'Portaliq for customers',
	record: { one: 'request', many: 'requests' },
	logline: 'For housing corporations and associations: a tenant reports a repair from their phone, sees the fitter booked, a member fixes their own details, and every change is on record.',
	references: REFS,
	techniques: ['#9 text-swap on a held diagram', '#11 whip-pan on the beat', '#2 zoom-out sentence build'],
	neighbours: ['pipelinq', 'planninq'],
	builtOnApps: ['pipelinq'],
	hook: {
		title: 'Report a repair from your phone',
		caption: 'Report a repair\nfrom your phone',
		ui: { drawUI: reportUI, tagFill: 'cobalt', header: false },
		source: 'positioning portaliq sp-case-status-tracking ("Your case\'s status and its documents sit on one page.") and customer group cg-housing-corporations; research.json proof moment "a tenant reports a repair"',
		motion: 'In behind the app hex the promise leaves on the loop anchor: caption, the tenant\'s phone with the portal in house style, the Portaliq hex (cobalt: the one orange is the send button\'s ring) on the loop anchor. The photo tile lands, a kind-of-repair chip turns cobalt (a tap), the description lines draw in; on beat 6 the send button presses. The phone is the held picture for technique #9.',
		sound: 'Gentle open. A tick on the chip, a dry click on send.',
	},
	proofs: [
		{
			id: 'booked',
			title: 'Watch your repair get booked',
			caption: 'Watch your repair\nget booked',
			source: 'positioning portaliq sp-case-status-tracking; research.json proof moment "sees a fitter get booked on screen, and the status updates live without a phone call"',
			motion: 'Technique #9: no cut. The phone holds where it was; only the caption swaps (4 frames), the phone\'s send button turns into its mint "sent" pill, and beside it the status grows top to bottom: reported (mint), booked (cobalt, the orange ring stepping out once) with the fitter and the date chip dropping in. Out on the last beat: technique #11, a 5-frame whip-pan left (ease.snap, --blur 4).',
			sound: 'A pluck as each step lands, a brighter one on booked, a short whoosh on the whip.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Watch your repair\nget booked', drawUI: bookedUI, tagFill: 'cobalt', header: false }),
		},
		{
			id: 'details',
			title: 'Members fix their own details',
			caption: 'Members fix their\nown details',
			source: 'positioning portaliq usp-self-service-corrections: "You fix, withdraw or undo your own request without calling anyone." (verified); research.json proof moment for cg-chambers-associations',
			motion: 'The whip lands on a member\'s profile. The second field opens for editing in place (its edge turns orange), the old value leaves upward and the new one types in, the cursor blinks twice, and the field\'s pill turns mint: saved, no ticket opened.',
			sound: 'Key clicks under the new value, a soft pluck as it saves.',
			draw: (ctx, api) => FRAMES.hook(ctx, { app: api.app, caption: 'Members fix their\nown details', drawUI: detailsUI, tagFill: 'cobalt' }),
		},
	],
	general: {
		module: 'dataLayer',
		caption: 'Every change shows\nwho and when',
		source: 'story.json mechanics 0; COPY.dataLayer D1; positioning portaliq sp-multitenant-admin-audit ("Editors and admins get separate rights that are always logged.")',
		params: {
			record: { avatar: 'person', title: 230, sub: 150, status: 'mint', fields: [[56, 140], [56, 120], [64, 160], [48, 96]] },
			history: [{ av: C.cobalt300, w: 180 }, { av: C.cobalt200, w: 140 }, { av: C.cobalt300, w: 160 }, { av: C.cobalt200, w: 120 }],
			links: ['nc-mail', 'nc-files', 'nc-calendar'],
		},
		sound: 'A pluck as each Nextcloud app links in, a tick on the newest history entry.',
	},
	promiseMotion: 'Technique #2, zoom-out sentence build. The Portaliq cell lands on the loop anchor and turns orange. Under "Portaliq" the promise builds one word per eighth note, each word slamming in large while the type column\'s camera eases back (ease.brand) so the line always just fits; at rest it is the key frame. Round 15: the body opens on this card, straight after the opening\'s handover; out on the bar line the cluster steps out and the app cell shrinks on the loop anchor to the hook\'s tag.',
}

export const { meta, boards } = audienceFilm(content)
