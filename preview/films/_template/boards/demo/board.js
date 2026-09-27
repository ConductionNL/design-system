/**
 * Template demo: the six shared key frames (hook, data layer, notification,
 * flows, assistant, outro), each drawn twice with two clearly different
 * parameter sets, to prove the parameterisation. Parameters follow
 * apps/divide.md (Pipelinq 0.5.1, Learniq 0.3.0): Pipelinq links mail, files
 * and calendar, no Talk; Learniq links Talk and files, no Calendar; flows are
 * a capability in both; Learniq's assistant only looks up courses, read-only.
 *
 *   A  CRM-like     app pipelinq, a client record (person avatar), detail hook
 *   B  course-like  app learniq, a course record (hex avatar), list hook
 *
 * LAYOUT PROOFS, NOT CLAIMS. The captions are the copy templates of
 * scenes/general.js filled with sample words; the notification events
 * ("Renewal due", "Course overdue") paraphrase divide.md and the app-specific
 * hook UI is a placeholder until each film's storyboard supplies sourced content.
 *
 *   board.html?film=_template&v=demo   (board i sits at t = i + 0.5; 16:9, 1920 x 1080)
 *
 * It also runs appFilm() on both sets (with stub proofs) and puts the resolved
 * slot plan and the word budget in meta.plans, so `film.mjs cues` can read them.
 */
import { C } from '../../../_lib/brand.js'
import { FRAMES, COPY, fill } from '../../../_lib/scenes/general.js'
import { appFilm, CTA, FORMAT, SAFE } from '../../../_lib/appfilm.js'

const tpl = (mod, id) => COPY[mod].templates.find((t) => t.id === id).text

/* ---------- parameter set A: CRM-like ---------- */

const A = {
	app: 'pipelinq',
	record: { one: 'client', many: 'clients' },
	hook: {
		caption: fill(tpl('dataLayer', 'D2'), { one: 'client' }),
		ui: {
			pattern: 'detail',
			record: { avatar: 'person', title: 230, sub: 320, status: 'mint' },
			tiles: [{ icon: 'nc-calendar', body: 'calendar' }, { icon: 'nc-mail', body: 'mail' }, { icon: 'nc-files', body: 'files' }, { icon: 'g-pipelinq', body: 'deck' }, { icon: 'nc-activity', body: 'mail' }],
		},
	},
	dataLayer: {
		caption: tpl('dataLayer', 'D1'),
		record: { avatar: 'person', title: 230, sub: 170, status: 'mint', fields: [[56, 150], [56, 120], [64, 170], [48, 96]] },
		history: [{ av: C.cobalt300, w: 170 }, { av: C.cobalt200, w: 140 }, { av: C.cobalt300, w: 160 }, { av: C.cobalt200, w: 120 }],
		links: ['nc-mail', 'nc-files', 'nc-calendar'],
	},
	notify: {
		caption: fill(tpl('notify', 'N2'), { Event: 'Renewal due' }),
		record: { avatar: 'person', title: 230, sub: 150, status: 'idle' },
		event: { stage: 2, stages: 4 },
		notices: [{ app: 'pipelinq' }, { icon: 'nc-files' }, { icon: 'nc-talk' }],
		recipients: [C.cobalt300],
	},
	flows: {
		caption: tpl('flows', 'F1'),
		trigger: { app: 'pipelinq' },
	},
	ai: {
		caption: fill(tpl('ai', 'A1'), { many: 'clients' }),
		question: { w: 330, lines: [0.78, 0.5] },
		answer: { rows: [{ avatar: 'person', w: 190, trail: 'idle' }, { avatar: 'person', w: 160, trail: 'idle' }, { avatar: 'person', w: 210, trail: 'mint' }] },
		permission: { ask: true },
	},
	outro: { neighbours: ['portaliq', 'filinq', 'shillinq'] },
}

/* ---------- parameter set B: course-like ---------- */

const B = {
	app: 'learniq',
	record: { one: 'course', many: 'courses' },
	hook: {
		caption: fill(tpl('dataLayer', 'D2'), { one: 'course' }),
		ui: {
			pattern: 'list',
			nav: { items: 5, active: 0 },
			rows: [
				{ avatar: 'hex', w: 250, trail: 'progress', p: 0.8 }, { avatar: 'hex', w: 190, trail: 'progress', p: 0.35 }, { avatar: 'hex', w: 230, trail: 'progress', p: 0.6 },
				{ avatar: 'hex', w: 170, trail: 'progress', p: 1 }, { avatar: 'hex', w: 210, trail: 'progress', p: 0.15 }, { avatar: 'hex', w: 240, trail: 'progress', p: 0.5 },
			],
		},
	},
	dataLayer: {
		caption: fill(tpl('dataLayer', 'D3'), { many: 'courses' }),
		record: { avatar: 'hex', title: 280, sub: 120, status: 'idle', fields: [[70, 110], [50, 160], [60, 90], [70, 140]] },
		history: [{ av: C.lavender300, w: 150 }, { av: C.cobalt300, w: 180 }, { av: C.lavender300, w: 110 }],
		links: ['nc-talk', 'nc-files'],
	},
	notify: {
		caption: fill(tpl('notify', 'N2'), { Event: 'Course overdue' }),
		record: { avatar: 'hex', title: 260, sub: 120, status: 'none' },
		event: { stage: 1, stages: 3 },
		notices: [{ app: 'learniq' }, { icon: 'nc-talk' }, { icon: 'nc-files' }],
		recipients: [C.lavender300, C.cobalt300],
	},
	flows: {
		caption: tpl('flows', 'F1'),
		trigger: { app: 'learniq' },
	},
	ai: {
		caption: fill(tpl('ai', 'A1'), { many: 'courses' }),
		question: { w: 390, lines: [0.7, 0.42] },
		answer: { rows: [{ avatar: 'hex', w: 150, trail: 'idle' }, { avatar: 'hex', w: 200, trail: 'idle' }, { avatar: 'hex', w: 170, trail: 'idle' }] },
		permission: { ask: false },
	},
	outro: { neighbours: ['portaliq'] },
}

/* ---------- the boards: five frames x two sets ---------- */

const LAYER = { hook: 'app', dataLayer: 'general', notify: 'general', flows: 'general', ai: 'general', outro: 'brand' }
const TITLE = { hook: 'Hook', dataLayer: 'Data layer', notify: 'Notification', flows: 'Flows', ai: 'Assistant', outro: 'Outro' }

function board(mod, set, tag) {
	const p = mod === 'outro' ? { app: set.app, ...set.outro }
		: mod === 'hook' ? { app: set.app, caption: set.hook.caption, ...set.hook.ui }
		: { app: set.app, ...set[mod] }
	return {
		id: `${mod}-${tag}`,
		title: `${TITLE[mod]} · ${tag === 'A' ? 'CRM-like (pipelinq, client)' : 'course-like (learniq, course)'}`,
		layer: LAYER[mod],
		module: mod,
		words: mod === 'outro' ? CTA : p.caption,
		apps: [set.app],
		note: 'Layout proof, not a claim.',
		draw: (ctx) => FRAMES[mod](ctx, p),
	}
}

export const boards = ['hook', 'dataLayer', 'notify', 'flows', 'ai', 'outro'].flatMap((mod) => [board(mod, A, 'A'), board(mod, B, 'B')])

/* ---------- the content-object path, for the plan and budget readout ---------- */

const stub = (id, caption) => ({ id, title: id, caption, draw: () => {} })
const filmA = appFilm({
	app: A.app, record: A.record,
	hook: A.hook,
	proofs: [stub('proof1', 'Sample proof line here.'), stub('proof2', 'Second sample proof.')],
	general: { module: 'dataLayer', caption: A.dataLayer.caption, params: A.dataLayer },
	outro: A.outro,
})
const filmB = appFilm({
	app: B.app, record: B.record,
	hook: B.hook,
	proofs: [stub('proof1', 'One sample proof line, a bit longer.')],
	general: { module: 'notify', caption: tpl('notify', 'N1'), params: B.notify },
	outro: B.outro,
})
const strip = (f) => ({ budget: f.meta.budget, boards: f.boards.map(({ draw, motion, ...b }) => b) })

export const meta = {
	id: 'demo',
	title: 'App-film template: parameterisation proof',
	logline: 'The six shared key frames of every app film (hook, data layer, notification, flows, assistant, outro), each drawn twice: a CRM-like record and a course-like record. Layout proofs, not claims.',
	format: FORMAT,
	background: C.cobalt,
	safe: { ...SAFE },
	plans: { A: strip(filmA), B: strip(filmB) },
}
