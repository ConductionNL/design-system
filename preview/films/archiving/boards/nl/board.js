/**
 * Archiving (nl), rounds 10 to 28f. The storyboard is drawn from the film's own scene builders
 * (../../scenes/body.js) at each scene's key time, so a still is exactly a frame of the film.
 *
 *   opening        BRAND  the shared Conduction opening, 3 bars (Round 28d: its hexes flip out behind the name)
 *   hook           "Nooit meer archiveren?" over two worlds                (Soevereine werkplek)
 *   answer         "Als de werkplek ook DMS en archief is" (Round 28f)       (Soevereine werkplek)
 *   mdto           "Compliant waar je werkt, niet achteraf"                  (Metadata)
 *   integratie     "Bestaand archief binnen via Integriq" (Round 28f)        (Integratie)
 *   selectielijst  "Alles krijgt vanzelf een bewaartermijn" (Round 28f)      (Bewaartermijn)
 *   vernietiging   "Vernietigd met akkoord en spoor"                         (Vernietiging)
 *   standards      "Je werkplek is het DMS voor elk systeem"                 (Standaarden)
 *   builtOn        BRAND  "Gebouwd op Nextcloud, verrijkt door Conduction", 4 bars
 *   install        BRAND  "Installeer het / Gebruik het / Bezit het", 3 bars
 *
 * Opening 3 + body 14 + built on 4 + install 3 = 24 bars, 45 s. Claims and sources:
 * ds-connext-film-review/archiving/research.json.
 */
import { C } from '../../../_lib/brand.js'
import { buildOpening, OPENING } from '../../../_lib/scenes/opening.js'
import { builtOnFrame, installFrame, BUILT_ON_DUR, INSTALL_DUR as INSTALL21_DUR, closingWords } from '../../../_lib/scenes/closing.js'
import { SAFE, holdFor, wordCount } from '../../../_lib/appfilm.js'
import { SCENES, BODY, BUILDERS, BAR, RISE, leaveAt } from '../../scenes/body.js'

const OPEN = OPENING.duration
const BUILT = BUILT_ON_DUR
const INSTALL_DUR = INSTALL21_DUR
const TOTAL = OPEN + BODY + BUILT + INSTALL_DUR
const CLOSE = { lang: 'nl', lead: 'openregister' }
const NL = closingWords('nl')
const s2 = (t) => `${t.toFixed(2)} s`
const barOf = (t) => Math.floor(t / BAR + 1e-6) + 1

const REFS = [
	{ name: 'X Ticker', url: 'https://whatships.com/videos/x-ticker/', borrow: 'Captions typed on letter by letter (#4).' },
	{ name: 'Firecrawl Free Keyless', url: 'https://whatships.com/videos/firecrawl-free-keyless/', borrow: 'Grid cells stepping through opacity in waves (#3).' },
	{ name: 'Replit Parallel Agents', url: 'https://whatships.com/videos/replit-parallel-agents/', borrow: 'The picture holds; only the words change (#9).' },
]

/** Per scene: what the board says about it (the words and times come from body.js). */
const NOTES = {
	hook: {
		title: 'The question: never archive again?', gloss: 'Never archive again?', apps: ['nextcloud'],
		motion: 'Transition in: the window slides in over the opening\'s handover field (the one grid), which fades out under it. Left the finished document in the workspace; a square-cornered arrow draws on and re-files it into a second, grey system, the separate archive, where the same fields are typed a second time; the orange ring draws round the fields typed twice. Round 28: no current wire; a dry click where it used to arrive.',
		sound: 'Gentle open, no stinger. A whoosh as the window arrives, two dull ticks as the arrow re-files, soft key ticks, a low tick as the ring draws, a dry click.',
		source: 'Ruben, Rounds 16, 19 and 21: the question up front, the two worlds under it; section title Round 20/27c.',
	},
	answer: {
		title: 'The answer: when the workspace is also the DMS and the archive', gloss: 'When the workspace is also the DMS and the archive (Ruben: "Als we van de werkplek ook DMS en archief maken", cut to 8 words for one card)', apps: ['nextcloud', 'openregister'],
		motion: 'Transition in: text-swap on the held picture (#9): the question leaves, the answer rises, the two worlds stay. Then the two worlds become one: the arrow fades, the separate archive turns over and out (a width turn-over), and the workspace\'s own metadata panel turns over in on the same spot, its fields still empty.',
		sound: 'Two dry clicks as the archive turns out and the panel turns in, a soft pluck as it settles.',
		source: 'Ruben, Round 28f. Workspace as DMS and archive: research.json c0 (procest document-zaakdossier spec:14, openregister object-interactions spec:154, archivering-vernietiging spec:529) and c8.',
	},
	mdto: {
		title: 'Compliant where you work, not afterwards', gloss: 'Compliant where you work, not afterwards', apps: ['openregister', 'filinq'],
		motion: 'Transition in: held picture, text-swap (#9): the same window stays, the page header becomes "MDTO · ISO 16175 · Archiefwet". Technique #4, typewriter: the workspace\'s empty fields fill top to bottom, each value typing on a greeked character pair per 0.1 s, a cursor after it, the field being typed ringed in orange. Out: the page scrolls up out of the window in 5 frames (scroll-whip).',
		sound: 'Soft key ticks under the typing, a pluck as each field completes, a whoosh on the scroll.',
		source: 'research.json c1 and c9 (MDTO metadata on creation; "compliant" is Ruben\'s word, the sources stop short of a certification).',
	},
	integratie: {
		title: 'Bring the existing archive in with Integriq', gloss: 'Existing archive brought in via Integriq (Ruben: "Haal je bestaande archief binnen met de Integriq-connector", cut to fit two lines)', apps: ['integriq', 'nextcloud'],
		motion: 'Round 28f, placed after the metadata (log: first the workspace describes what it makes, then it takes in what already exists, then everything gets its term). Transition in: the scroll-whip\'s second half, the page arriving from below. Left an existing archive in another system\'s grey chrome; in the middle the Integriq connector cell flips in (cobalt, white glyph; the orange is the word Integriq in the caption), the lines draw on either side; the records travel out of the archive, through the connector, and land one by one in the workspace list on the right, each row\'s hex flipping in. Out: scroll-whip up.',
		sound: 'A dry click as the connector turns over, a hiss as the lines draw on, a tick as each record leaves and a pluck as it lands, a whoosh on the scroll.',
		source: 'openconnector (Integriq) openspec/specs/document-cms-connectors/spec.md: external DMS adapters (SharePoint, OneDrive, Google Drive, Alfresco, Documentum, M-Files, Box, OnBase, Nuxeo) persist fetched documents into Nextcloud Files; SharePoint is the reference adapter, the rest backlog (counted as built under Round 7). Positioning integriq.md: the StUF and ZGW bridge for case systems.',
	},
	selectielijst: {
		title: 'Everything gets its retention period automatically', gloss: 'Everything gets a retention period automatically (dossier, case, document, chat and calendar item as labels)', apps: ['dossiq', 'openregister'],
		motion: 'Transition in: the scroll-whip\'s second half. The page header reads "Selectielijst". Five rows, labelled dossier, zaak, document, chat and agenda-item; technique #3, a ripple runs down the list and each item\'s term lands in its pill ("bewaren tot" and the date, drawn on), the last one, the agenda item, marked by an orange hex that flips in. Out: the window turns over like a card (4 frames).',
		sound: 'A tick up the scale as each term lands, a click and a pluck on the last, a whoosh and a dry click on the card flip.',
		source: 'research.json c2 (retention by case type and selectielijst). Documents, dossiers and cases: sources. Mail: docudesk email-ingestion (EmailArchivalService). Chat and calendar items: not in the specs (a gap, shown on Ruben\'s word, Round 28f).',
	},
	vernietiging: {
		title: 'Destroyed with approval and a trail', gloss: 'Destroyed with approval and a trail', apps: ['openregister'],
		motion: 'Transition in: the window turns back over from edge-on (the card flip\'s second half). Left the destruction list, rows landing one a sixteenth; right the approval, a person, the approved pill and the orange hex flipping in on the approve step; under both the verklaring van vernietiging and the trail, chained row by row, the seal turning over last. Out: a whip-pan to the left.',
		sound: 'Ticks as the list rows land, a crisp click on the approval, a tick per trail row, a low thud as the seal turns over, a whoosh on the whip.',
		source: 'research.json c3 (retention-management spec:108, :136, :174, :189; archivering-vernietiging spec:529; audit-hash-chain spec:34).',
	},
	standards: {
		title: 'Your workspace is the DMS for every system', gloss: 'Your workspace is the DMS for every system', apps: ['dossiq', 'filinq'],
		motion: 'Transition in: the whip-pan\'s second half, the window arriving from the right in 5 frames. The workspace case on top; square-cornered lines draw on down to five outside systems, splitting at an orange hex that flips in; the five boxes land one after another, headed ZGW, ZDS, StUF, OIO and CMMN, their fields filling. The diagram then holds. Out: a cut on the bar into Built on.',
		sound: 'A hiss as the lines draw on, a tick as the junction turns over, a pluck per outside system.',
		source: 'research.json c4 and c8 (document-projection spec:4, :72; ZGW, StUF, ZDS, CMMN; OIO only as ZGW ObjectInformatieObject).',
	},
}

/** A body board: the film's own scene at its key time (the caption fully up, the picture complete). */
function bodyBoard(sc) {
	const n = NOTES[sc.id]
	const start = OPEN + sc.start, end = OPEN + sc.end
	const key = leaveAt(sc.dur) - 0.2
	const shows = sc.rise + 3 * RISE / 2, clears = leaveAt(sc.dur)
	return {
		id: sc.id, layer: 'app', title: n.title, start, end, bars: `${barOf(start)}-${barOf(end - 0.01)}`,
		words: sc.text.replace(/\*/g, ''), mark: sc.mark, gloss: n.gloss, hold: +(clears - shows).toFixed(2),
		apps: n.apps, motion: n.motion, sound: n.sound, source: n.source,
		draw(ctx) {
			const up = BUILDERS[sc.id]({ ...ctx, g: ctx.g, start: 0 })
			up(key)
			return () => up(key)
		},
	}
}

export const boards = [
	{
		id: 'opening', layer: 'brand', module: 'opening', title: 'Conduction opening (shared module)',
		start: 0, end: OPEN, bars: '1-3', words: '', apps: ['openregister'],
		motion: `The shared opening as it is (_lib/scenes/opening.js, 3 bars, ${s2(OPEN)}): hex canvas, ripple to the app cluster, the ripple that steps them off, the company name, the dry click.`,
		sound: 'The opening\'s own, ending on a dry click.', source: 'Shared module, no claim.',
		draw(ctx) { const up = buildOpening(ctx.g, { defs: ctx.defs }); const k = OPENING.T.powerOn + 0.9; up(k); return () => up(k) },
	},
	...SCENES.map(bodyBoard),
	{
		id: 'builtOn', layer: 'brand', module: 'builtOn', title: 'Gebouwd op Nextcloud, verrijkt door Conduction (shared closing piece, Round 22)',
		start: OPEN + BODY, end: OPEN + BODY + BUILT, bars: `${barOf(OPEN + BODY)}.1-${barOf(OPEN + BODY) + Math.round(BUILT / BAR) - 1}.4`,
		words: NL.builtOn, gloss: 'Built on Nextcloud / Works with <app, rolling> / Enhanced by Conduction',
		apps: ['openregister', 'dossiq', 'filinq', 'nextcloud'],
		motion: 'Round 27/28 (closing.js builtOnScene, lang nl, 4 bars): OpenRegister flips in orange (every hex turns over by squashing; nothing pops or scales in); "Gebouwd op" and "Nextcloud" rise under the white Nextcloud mark, no name label by the cell. Nine Nextcloud apps flip in one a beat, in Nextcloud blue, round OpenRegister on the ring two out, open to the right: a C, the Conduction C, with OpenRegister at its heart; each gets a line drawn on from OpenRegister out to it. Round 28j: one line under the headline, "Werkt met" held the whole time while the app name (Nextcloud cyan) rolls up on each cell that lands on a beat, a two-frame slot-roll: Mail, Contacten, Bestanden, Deck, Peilingen; the last holds to "Verrijkt door Conduction". A beat before bar 4 it becomes "Verrijkt door Conduction"; on bar 4 the camera pulls back over two beats and the Conduction family flips in as a full white hexagonal ring round the C, OpenRegister still the one orange. On the last beat the camera comes back in while every cell turns over, ring by ring from OpenRegister: they become the install board\'s quiet field and OpenRegister turns over into the Conduction avatar. One solid grid, one radius.',
		sound: 'A dry click and a low thud as the lead flips in, a tick up the scale for each app that loads, a long whoosh and a scatter of ticks as the family comes into view, a pluck on Verrijkt door Conduction, a whoosh and soft ticks as the cells turn over, a dry click as the lead becomes the avatar.',
		source: 'Shared module (closing.js at ds-connext-film 313b218, Rounds 27e to 28j); the component lines are what the data layer links a record to (NC_LINKS, round4/facts.json fact a).',
		draw: (ctx) => { builtOnFrame(ctx, CLOSE) },
	},
	{
		id: 'install', layer: 'brand', module: 'install', title: 'Installeer het, gebruik het, bezit het (shared install board, Round 22)',
		start: OPEN + BODY + BUILT, end: TOTAL, bars: `${barOf(OPEN + BODY + BUILT)}.1-${barOf(OPEN + BODY + BUILT) + 2}.4`,
		words: NL.install, gloss: 'Install it / Use it / Own it / The code stays open source, your data stays yours',
		apps: ['conduction'],
		motion: 'Transition in (Round 27b): Built on\'s cells have turned over into this board\'s quiet field, top right, and its lead into the Conduction avatar, one grid cell at the grid radius; nothing pops in. Round 27b/28 (closing.js installScene, lang nl, no wire, 3 bars): "Installeer het", "Gebruik het" and "Bezit het" rise out of their lines one a beat, the orange moving to each and landing on "Bezit het". Then "De code blijft open source, / de data blijft van jou" rises on two lines and holds to the end. No header.',
		sound: 'A dry click as each word rises, a low thud under "Bezit het", a pluck on the line, the pad resolves.',
		source: 'Shared module (closing.js at ds-connext-film d6a3290, Rounds 27e to 28d): CLOSING_TEXT.nl.',
		draw: (ctx) => { installFrame(ctx, CLOSE) },
	},
]

function budget() {
	const body = boards.filter((b) => !['opening', 'builtOn', 'install'].includes(b.id))
	const rows = body.map((b) => {
		const words = wordCount(b.words)
		const need = holdFor(words)
		const lines = b.words.split('\n').length
		const issues = []
		if (words > 8) issues.push(`${words} words on one card`)
		if (lines > 2) issues.push(`${lines} lines`)
		if (b.hold + 1e-6 < need) issues.push(`holds ${b.hold} s, needs ${need.toFixed(2)} s`)
		if (/[.]\s*$/m.test(b.words)) issues.push('a line ends in a full stop')
		if (/[—–]|--/.test(b.words)) issues.push('a dash')
		return { id: b.id, words, hold: b.hold, need: +need.toFixed(2), issues }
	})
	const total = rows.reduce((a, r) => a + r.words, 0)
	const filmIssues = total < 25 || total > 44 ? [`${total} words in the body (Round 28f: grown to 14 bars; readable per card)`] : []
	return { total, ok: !filmIssues.length && rows.every((r) => !r.issues.length), filmIssues, rows }
}

export const meta = {
	id: 'archiving-nl',
	title: 'Nooit meer archiveren? (nl)',
	language: 'nl',
	logline: 'A Dutch release film that asks a question and answers it (Rounds 19 to 28f): never archive again? When the workspace is also the DMS and the archive. You work compliant where you work, the existing archive comes in through the Integriq connector, everything gets its retention period, destruction runs with approval and a trail, and the workspace is the DMS for every other system.',
	references: REFS,
	techniques: ['#9 text-swap on a held picture (question to answer to metadata)', '#4 typewriter (the metadata)', '#3 ripple (the retention terms)', 'turn-over, scroll-whip, card flip and whip-pan as designed hand-offs (Round 26)'],
	template: 'archiving (drawn from the film\'s scene builders)',
	format: '16x9',
	background: C.cobalt,
	safe: { ...SAFE },
	duration: TOTAL,
	budget: budget(),
}
