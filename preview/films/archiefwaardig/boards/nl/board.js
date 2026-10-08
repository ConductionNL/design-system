/**
 * Archiefwaardig (nl), the storyboard. Each body board is drawn by the film's own scene builder
 * (../../scenes/body.js) at a key time near the end of the scene's hold, so a still is exactly a frame
 * of the film. Open with preview/films/board.html?film=archiefwaardig&v=nl
 *
 * Story and screens adapted from the demo 'Archiefwaardige opslag voor de medewerker' by Erik Hoekstra
 * (Gemeente Haarlem), EUPL-1.2, https://github.com/EHa-1999/XENA
 */
import { C } from '../../../_lib/brand.js'
import { buildOpening, OPENING } from '../../../_lib/scenes/opening.js'
import { builtOnFrame, installFrame, BUILT_ON_DUR, INSTALL_DUR, closingWords } from '../../../_lib/scenes/closing.js'
import { SAFE } from '../../../_lib/appfilm.js'
import { SCENES, BODY, BAR } from '../../scenes/plan.js'
import { builder, captionSpec } from '../../scenes/body.js'

const O = OPENING.duration
const TOTAL = O + BODY + BUILT_ON_DUR + INSTALL_DUR
const CLOSE = { lang: 'nl', lead: 'openregister' }
const NL = closingWords('nl')
const barOf = (t) => Math.floor(t / BAR + 1e-6) + 1

/** What each body board shows, in one line (the times come from the voice, see plan.js). */
const NOTES = {
	netwerkschijf: 'A network drive fills with definitief_v3_echt files on "vol mappen"; every row gets a question mark on "niemand weet".',
	vraag: 'Held window, text-swap: the rows step off; one file stays and comes to rest (the device). Hero word "archiveren" flips in orange.',
	opslaan: 'Card flip into Word: lines type while Sanne writes; the assistant pane slides in on "opslaan"; "Zakelijk" rings orange on the word; the metadata fields fill in, each tagged voorgesteld.',
	weigeren: 'Card flip back: delete from the context menu; the refusal lights Verkenner, Nextcloud, Register, Opslag on the words and stops at the storage with an orange ring and the lock.',
	blokkade: 'Scroll-whip: the dossier gets a legal hold (orange ring) on "rechtszaak"; every file freezes on "bevriest"; the admin is refused too.',
	terugdraaien: 'Scroll-whip: a 24-hour ring runs down; one file is taken back on "terug"; the other loses its key on "informatiebeheer" and its content scrambles.',
	verplaatsen: 'Scroll-whip: the file is dragged from P: to I:; the shared link (orange ring) resolves through the resolver to the new place; "link werkt".',
	versleuteld: 'Whip-pan: the dossier gets its own key (orange ring); the colleague sees the dossier but no names: "je ziet dat het bestaat".',
	overal: 'Four plain windows, each turning over on its spoken name: Verkenner, SharePoint, Teams, Word. The same file and marks in each.',
	architectuur: 'Camera dive under the windows: Nextcloud, the register, object storage with versions and Object Lock (orange lock on "dwingt").',
	claim: 'The stack holds; hero word "bewaartermijn" in orange; on "vensters" the camera returns to the windows, which turn over and out into Built on.',
}

function bodyBoard(S) {
	const spec = captionSpec(S)
	const key = Math.max(0, S.out - 0.4)
	return {
		id: S.id, layer: 'body', title: S.mark, start: O + S.start, end: O + S.end,
		bars: `${barOf(O + S.start)} to ${barOf(O + S.end - 1e-3)} (${S.beats} beats)`,
		words: S.lines.map((l) => l.map((i) => spec.words[i].word.replace(/[.,;:]+$/u, '')).join(' ')).join('\n'),
		voice: S.text, motion: NOTES[S.id],
		draw(ctx) {
			const update = builder(S)(ctx)
			update(ctx.start + key)
			return () => update(ctx.start + key)
		},
	}
}

export const boards = [
	{
		id: 'opening', layer: 'brand', title: 'Conduction opening (shared)', start: 0, end: O, bars: '1 to 3', words: '',
		draw(ctx) { const up = buildOpening(ctx.g, { defs: ctx.defs }); const k = OPENING.T.powerOn + 0.9; up(k); return () => up(k) },
	},
	...SCENES.map(bodyBoard),
	{
		id: 'builtOn', layer: 'brand', title: 'Gebouwd op Nextcloud, verrijkt door Conduction (shared, lang nl)', start: O + BODY, end: O + BODY + BUILT_ON_DUR,
		bars: `${barOf(O + BODY)} to ${barOf(O + BODY) + 3}`, words: NL.builtOn, voice: 'Gebouwd op Nextcloud. Verrijkt door Conduction.',
		draw: (ctx) => { builtOnFrame(ctx, CLOSE) },
	},
	{
		id: 'install', layer: 'brand', title: 'Installeer het, gebruik het, bezit het (shared)', start: O + BODY + BUILT_ON_DUR, end: TOTAL,
		bars: `${barOf(O + BODY + BUILT_ON_DUR)} to ${barOf(TOTAL - 1e-3)}`, words: NL.install,
		draw: (ctx) => { installFrame(ctx, CLOSE) },
	},
]

export const meta = {
	id: 'archiefwaardig-nl',
	title: 'Archiefwaardig (nl)',
	language: 'nl',
	logline: 'Nextcloud becomes the only DMS where the storage itself enforces the retention period, in the windows people already use.',
	format: '16x9',
	background: C.cobalt,
	safe: { ...SAFE },
	duration: TOTAL,
	animatic: true,
}
