// node --test scripts/screens/compdiff/compare.test.mjs
// The pairing and comparison rules on hand-made measurements: every card of a deck pairs, and a border colour is only
// compared where both sides draw that border.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareElement, compareProps, pairComponents, pairElements, positionReasons } from './compare.mjs'

const card = (title, y, record) => ({ role: 'card', title, rect: { x: 292, y, w: 800, h: 100 }, depth: 0, header: { fontSize: 18 }, ...(record ? { record } : {}) })

test('every card of a deck pairs, not only the first', () => {
	// The board draws the case page's main column as a deck of same-width siblings; live wraps each card on its own.
	const titles = ['Het verzoek', 'Zaakgegevens', 'Zaakplan', 'Termijn en betaling', 'Flows']
	const board = titles.map((t, i) => card(t, 400 + i * 120, { deck: 1, index: i, count: titles.length }))
	const live = titles.map((t, i) => card(t, 410 + i * 120))
	const { pairs, missing, extra } = pairComponents(board, live, 1400)
	assert.equal(pairs.length, 5)
	assert.deepEqual(extra, [])
	assert.deepEqual(missing, [])
})

test('cards past the first of a deck that find no counterpart are data, not missing or extra', () => {
	const deck = (n, y0, d) => Array.from({ length: n }, (_, i) => card(null, y0 + i * 110, { deck: d, index: i, count: n }))
	const { pairs, missing, extra } = pairComponents(deck(3, 300, 1), deck(6, 300, 1), 1400)
	assert.equal(pairs.length, 3)
	assert.deepEqual(missing, [])
	assert.deepEqual(extra, [])
})

test('a border colour on a zero-width border is not flagged', () => {
	const tb = (border, color) => ({ role: 'toolbar', title: 'toolbar', rect: { x: 0, y: 0, w: 800, h: 40 }, controlBorder: border, controlBorderColor: color })
	const rows = compareProps(tb(0, 'rgb(27, 28, 29)'), tb(1, 'rgb(228, 230, 234)'))
	assert.equal(rows.find((r) => r.prop === 'controlBorderColor').flag, null)
	assert.equal(rows.find((r) => r.prop === 'controlBorder').flag, 'border extra on live')
	const both = compareProps(tb(1, 'rgb(130, 138, 149)'), tb(1, 'rgb(228, 230, 234)'))
	assert.equal(both.find((r) => r.prop === 'controlBorderColor').flag, 'color')
	const c = (top, color) => ({ ...card('A', 0), props: { border: { top, right: top, bottom: top, left: top }, borderColor: color } })
	assert.equal(compareProps(c(0, 'rgb(0, 0, 0)'), c(0, 'rgb(255, 0, 0)')).find((r) => r.prop === 'props.borderColor').flag, null)
	assert.equal(compareProps(c(1, 'rgb(0, 0, 0)'), c(1, 'rgb(255, 0, 0)')).find((r) => r.prop === 'props.borderColor').flag, 'color')
})

test('a button in a deck card pairs by label with the same button outside a deck', () => {
	const el = (inControl) => ({ kind: 'button', label: 'Bewerken', inControl, container: 1, rect: { x: 900, y: 600, w: 90, h: 34 }, props: { h: 34 } })
	const { pairs } = pairElements([el('record card')], [el(null)], 1400)
	assert.equal(pairs.length, 1)
	assert.equal(pairs[0].by, 'label')
})

test('a pill paired with a button is told apart by radius and height, not by its kind as well', () => {
	const el = (kind, h, borderRadius) => ({ kind, props: { h, borderRadius, border: 0, background: 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)', fontSize: 14, fontWeight: 400, paddingLeft: 0, paddingRight: 0, icon: true, text: false, badge: false, gapNext: null } })
	const rows = compareElement(el('pill', 36, 18), el('button', 34, 8))
	assert.equal(rows.find((r) => r.prop === 'kind').flag, null)
	assert.equal(rows.find((r) => r.prop === 'borderRadius').flag, 'shape')
})

test('cards with different titles, or a titled and an untitled card far apart, do not pair by position', () => {
	const card = (title, y, h, x = 424, w = 592) => ({ role: 'dialog-card', title, rect: { x, y, w, h } })
	const grey = pairComponents([card(undefined, 1000, 59)], [card('Beoordeel eerst deze documenten.', 567, 208)], 1500)
	assert.equal(grey.pairs.length, 0)
	const choice = pairComponents([card('Daarna alleen lezen', 824, 95)], [card('Bewaring volgens het zaaktype', 770, 672, 440, 560)], 1500)
	assert.equal(choice.pairs.length, 0)
	const near = pairComponents([card(undefined, 300, 120)], [card('Zaakgegevens', 340, 160)], 1500)
	assert.equal(near.pairs.length, 1)
	const column = pairComponents([card('In behandeling19', 420, 772, 576, 268)], [card('Beoordeling ontvankelijkheid1', 468.5, 234, 576, 268)], 1500)
	assert.equal(column.pairs.length, 1)
})

test('a lone pager pairs with the lone pager, wherever the list above it ends', () => {
	const pager = (y) => ({ role: 'pager', title: 'pager', rect: { x: 293, y, w: 1118, h: 61 } })
	const r = pairComponents([pager(1084)], [pager(1646.5)], 1170)
	assert.equal(r.pairs.length, 1)
	assert.equal(r.missing.length + r.extra.length, 0)
})

test('page links pair in order inside the pager, and the page count is data', () => {
	const link = (label, x, inControl = 'pager') => ({ kind: 'button', label, inControl, container: 1, rect: { x, y: 1000, w: 36, h: 36 }, props: { h: 36, borderRadius: 8, background: 'rgb(255, 255, 255)', border: 1, fontSize: 14 } })
	const r = pairElements([link('1', 1186), link('2', 1226), link('3', 1268)], [link('1', 1037), link('2', 1077), link('3', 1119), link('4', 1161), link('13', 1268), { ...link('Open AI chat', 1340, null), props: { h: 60, borderRadius: 0, background: 'rgb(255, 255, 255)', border: 0, fontSize: 14 } }], 1170)
	const pagerPairs = r.pairs.filter((p) => p.by === 'pager')
	assert.deepEqual(pagerPairs.map((p) => [p.board.label, p.live.label]), [['1', '1'], ['2', '2'], ['3', '3']])
	assert.ok(!r.pairs.some((p) => p.live.label === 'Open AI chat'))
	assert.ok(!(r.extra || []).some((e) => e.inControl === 'pager'))
})

const pill = (label, x, y, h, extra = {}) => ({ kind: 'pill', label, inControl: null, interactive: false, container: 1, rect: { x, y, w: 80, h }, props: { h, borderRadius: h / 2, background: 'rgb(234, 240, 247)', border: 0, fontSize: 13 }, ...extra })

test('a chip does not pair with a count nested in another chip, nor the reverse', () => {
	const chip = pairElements([pill('Alle typen', 292, 318, 38, { interactive: true })], [pill('142', 345, 389, 16, { inControl: 'Alles' })], 1200)
	assert.equal(chip.pairs.length, 0)
	const count = pairElements([pill('11', 380, 329, 16, { inControl: 'Alle typen' })], [pill('Mijn zaken', 292, 380, 38, { interactive: true })], 1200)
	assert.equal(count.pairs.length, 0)
})

test('a status tag does not pair with the "Volgen" button, and a filter count not with a filter chip', () => {
	const status = pairElements([pill('In behandeling', 397, 158, 21)], [pill('Volgen', 292, 169, 28, { interactive: true })], 1200)
	assert.equal(status.pairs.length, 0)
	const filter = pairElements([pill('2', 1199, 198, 20, { inControl: 'Filter' })], [pill('Opgeschort', 1071, 184, 38, { interactive: true })], 1200)
	assert.equal(filter.pairs.length, 0)
	const remove = pairElements([pill('Filter Type: Woo-verzoek verwijderen', 1175, 300, 22, { interactive: true })], [pill('1 actief', 1199, 332, 20, { inControl: 'Filter' })], 1200)
	assert.equal(remove.pairs.length, 0)
})

test('a tag that repeats on every card pairs with the nearest one of the same label', () => {
	const tag = (x, y) => pill('Woo-verzoek', x, y, 21, { inControl: 'record card' })
	const r = pairElements([tag(603, 527), tag(319, 684)], [tag(319, 763), tag(319, 937), tag(603, 781)], 1500)
	const byBoardX = Object.fromEntries(r.pairs.map((p) => [p.board.rect.x, p.live.rect.x]))
	assert.deepEqual(byBoardX, { 603: 603, 319: 319 })
})

test('a native toggle is not compared on background', () => {
	const tog = (background, native) => ({ kind: 'toggle', props: { h: 13, borderRadius: 0, border: 0, background, color: 'rgb(0, 0, 0)', fontSize: 13, fontWeight: 400, paddingLeft: 0, paddingRight: 0, icon: false, text: false, badge: false, gapNext: null, native } })
	const rows = compareElement(tog('rgb(255, 255, 255)', true), tog('rgb(229, 229, 229)', true))
	assert.equal(rows.find((r) => r.prop === 'background').flag, null)
})

test('a chosen option\'s filled ground is compared, and a missing one is flagged', () => {
	const tog = (optionGround) => ({ kind: 'toggle', props: { h: 20, borderRadius: 10, border: 0, background: null, color: 'rgb(0, 0, 0)', fontSize: 14, fontWeight: 400, paddingLeft: 0, paddingRight: 0, icon: false, text: false, badge: false, gapNext: null, ...(optionGround ? { optionGround } : {}) } })
	const same = compareElement(tog('rgb(220, 230, 242)'), tog('rgb(221, 230, 242)'))
	assert.equal(same.find((r) => r.prop === 'optionGround').flag, null)
	assert.equal(compareElement(tog('rgb(220, 230, 242)'), tog(null)).find((r) => r.prop === 'optionGround').flag, 'option ground absent on live')
	assert.equal(compareElement(tog('rgb(220, 230, 242)'), tog('rgb(255, 230, 200)')).find((r) => r.prop === 'optionGround').flag, 'color')
	assert.equal(compareElement(tog(null), tog(null)).find((r) => r.prop === 'optionGround'), undefined)
})

test('buttons with different labels do not pair by position or group, unless they are per-row actions', () => {
	const button = (label, x, y) => ({ kind: 'button', label, inControl: null, container: 1, rect: { x, y, w: 160, h: 34 }, props: { h: 34, borderRadius: 8, background: 'rgb(255, 255, 255)', border: 1, fontSize: 14 } })
	const r = pairElements([button('Testen met een zaak', 900, 300), button('Opslaan', 1080, 300)], [button('Stappen automatisch ordenen', 905, 302), button('Bewaren', 1080, 400), button('Annuleren', 1080, 440)], 1200)
	assert.equal(r.pairs.length, 0, JSON.stringify(r.pairs.map((p) => [p.board.label, p.live.label])))
	const rows = (n, y0) => Array.from({ length: n }, (_, i) => button(`Acties voor zaak ${i}`, 1300, y0 + i * 50))
	const listed = pairElements(rows(4, 300), rows(5, 320), 1200)
	assert.ok(listed.pairs.length >= 1)
})

test('a dialog is not placed by its top: the boards disagree on it and Nextcloud fixes it', () => {
	const dialog = (y) => ({ role: 'dialog', rect: { x: 520, y, w: 400, h: 300 } })
	const inner = (y) => ({ role: 'dialog-card', rect: { x: 544, y, w: 352, h: 80 } })
	const boardDialog = dialog(120), liveDialog = dialog(88)
	const origin = { x: 292, y: 90 }
	assert.deepEqual(positionReasons({ board: boardDialog, live: liveDialog }, origin, origin, { board: boardDialog, live: liveDialog }), [])
	// What sits inside the dialog is placed from the dialog's own top.
	assert.deepEqual(positionReasons({ board: inner(180), live: inner(148) }, origin, origin, { board: boardDialog, live: liveDialog }), [])
	assert.deepEqual(positionReasons({ board: inner(180), live: inner(158) }, origin, origin, { board: boardDialog, live: liveDialog }), ['y +10'])
	// Its x still counts.
	assert.deepEqual(positionReasons({ board: dialog(120), live: { ...dialog(88), rect: { x: 540, y: 88, w: 400, h: 300 } } }, origin, origin, null), ['x +20'])
})

test('a page component is placed from the content origin', () => {
	const c = (x, y) => ({ role: 'card', rect: { x, y, w: 800, h: 100 } })
	assert.deepEqual(positionReasons({ board: c(292, 300), live: c(292, 310) }, { x: 292, y: 90 }, { x: 292, y: 90 }, null), ['y +10'])
})

test('an untitled card that only frames a paired table is that table\'s frame, not an extra card', () => {
	const table = (y) => ({ role: 'table', rect: { x: 293, y, w: 1118, h: 440 } })
	const pager = (y) => ({ role: 'pager', rect: { x: 293, y, w: 1118, h: 61 } })
	const frame = { role: 'card', rect: { x: 292, y: 292.5, w: 1120, h: 504 } }
	const board = [table(309), pager(921)]
	const live = [table(293.5), pager(734.5), frame]
	const { pairs, extra } = pairComponents(board, live, 1400)
	assert.equal(pairs.length, 2)
	assert.deepEqual(extra, [])
	// A titled card, or one holding more than the table, still counts.
	const titled = { ...frame, title: 'Organisaties' }
	assert.equal(pairComponents(board, [table(293.5), pager(734.5), titled], 1400).extra.length, 1)
	const wide = { role: 'card', rect: { x: 292, y: 100, w: 1120, h: 900 } }
	assert.equal(pairComponents(board, [table(293.5), pager(734.5), wide], 1400).extra.length, 1)
})

test('a list card whose board side has no page links pairs as the table\'s frame, and live\'s pager under the table is not extra', () => {
	const table = (y, h) => ({ role: 'table', rect: { x: 293, y, w: 1118, h } })
	const board = [table(374, 445), { role: 'card', rect: { x: 292, y: 373, w: 1120, h: 489 } }]
	const live = [table(420.5, 1344.8), { role: 'pager', rect: { x: 293, y: 1765.3, w: 1118, h: 61 } }]
	const { pairs, missing, extra } = pairComponents(board, live, 1600)
	assert.equal(pairs.length, 1)
	assert.deepEqual(missing, [])
	assert.deepEqual(extra, [])
	// A pager far from any paired table still counts.
	assert.equal(pairComponents([table(374, 445)], [table(420.5, 300), { role: 'pager', rect: { x: 293, y: 1500, w: 1118, h: 61 } }], 1600).extra.length, 1)
})

test('the same title in another column does not pair; a toolbar pairs on its line whatever its width', () => {
	const side = { role: 'card', title: 'Alle zaken', rect: { x: 1080, y: 68, w: 360, h: 1072 } }
	const main = { role: 'card', title: 'Alle zaken', rect: { x: 264, y: 68, w: 816, h: 1072 } }
	const r = pairComponents([side], [main], 1200)
	assert.equal(r.pairs.length, 0)
	const tb = (w, y) => ({ role: 'toolbar', title: 'toolbar', rect: { x: 292, y, w, h: 40 } })
	const t = pairComponents([tb(1120, 188)], [tb(916.6, 184.5)], 1200)
	assert.equal(t.pairs.length, 1)
	// A narrower toolbar on another line does not pair.
	assert.equal(pairComponents([tb(1120, 188)], [tb(916.6, 600)], 1200).pairs.length, 0)
})

test('two icon-only buttons in the same place pair whatever each side names them; labelled ones still do not', () => {
	const fab = (label, text) => ({ kind: 'button', label, inControl: null, container: 0, rect: { x: 1340, y: 960, w: 56, h: 56 }, props: { h: 56, borderRadius: 28, background: 'rgb(54, 105, 165)', text, icon: true } })
	const r = pairElements([fab('AI-chat openen', false)], [fab('Open AI chat', false)], 1100)
	assert.equal(r.pairs.length, 1)
	assert.deepEqual([r.missing.length, r.extra.length], [0, 0])
	const t = pairElements([fab('Opslaan', true)], [fab('Bewaren', true)], 1100)
	assert.equal(t.pairs.length, 0)
})

test('a native radio or select is not compared on its border or inline padding against a drawn one', () => {
	const t = (native, border) => ({ kind: 'toggle', label: 'Verdagingsbrief', rect: { x: 0, y: 0, w: 20, h: 20 }, props: { h: 20, borderRadius: 10, border, background: null, native, color: 'rgb(0,0,0)', fontSize: 14, fontWeight: 400, paddingLeft: 0, paddingRight: 0, icon: false, text: false, badge: false } })
	assert.ok(!compareElement(t(true, 0), t(undefined, 2)).some((r) => r.flag))
	const f = (native, pr) => ({ kind: 'field', label: 'Filteren op zaaktype', rect: { x: 0, y: 0, w: 200, h: 40 }, props: { h: 40, borderRadius: 8, border: 1, borderColor: 'rgb(130,138,149)', background: null, native, color: 'rgb(0,0,0)', fontSize: 15, fontWeight: 400, paddingLeft: 10, paddingRight: pr, icon: true, text: true, badge: false } })
	assert.ok(!compareElement(f(true, 10), f(undefined, 30)).some((r) => r.flag))
	assert.ok(compareElement(f(undefined, 10), f(undefined, 30)).some((r) => r.flag))
})

test('an element below the captured frame pairs by label only, never by place, and is not extra unpaired', () => {
	const row = { kind: 'row', label: 'Inzage medisch verslag Fatma K', inControl: 'record card', container: 3, rect: { x: 1130, y: 1300, w: 260, h: 36 }, props: { h: 36, fontSize: 14 } }
	const tile = { kind: 'row', label: 'FK', inControl: 'record card', container: 3, rect: { x: 1130, y: 1500, w: 260, h: 56 }, props: { h: 56, fontSize: 12 }, belowFrame: true }
	const r = pairElements([row], [tile], 1417)
	assert.equal(r.pairs.length, 0)
	assert.equal(r.extra.length, 0)
})

test('a toolbar that wrapped is not compared on its control count: what wraps onto its lines follows the data', () => {
	const t = (controls, wrapped, h) => ({ role: 'toolbar', title: 'toolbar', rect: { x: 292, y: 234, w: 760, h }, ...(wrapped ? { wrapped } : {}), gap: 8, padding: { top: 0, right: 0, bottom: 0, left: 0 }, controls, controlHeight: 36, controlRadius: 8, controlFontSize: 14 })
	assert.ok(!compareProps(t(5, true, 86), t(6, true, 158)).some((r) => r.flag))
	assert.ok(compareProps(t(5, false, 40), t(6, false, 40)).some((r) => r.flag === 'chrome'))
})

test('a native checkbox is not compared on its icon or radius against a board\'s drawn square', () => {
	const t = (native, icon, borderRadius) => ({ kind: 'toggle', label: 'Een zaak wordt aan mij toegewezen', rect: { x: 0, y: 0, w: 18, h: 18 }, props: { h: 18, borderRadius, border: 0, background: null, native, color: 'rgb(0,0,0)', fontSize: 14, fontWeight: 400, paddingLeft: 0, paddingRight: 0, icon, text: false, badge: false } })
	assert.ok(!compareElement(t(undefined, true, 0), t(true, false, 8)).some((r) => r.flag))
	assert.ok(compareElement(t(undefined, true, 0), t(undefined, false, 0)).some((r) => r.flag))
})

test('a native date field is not compared on its icon against a board\'s text field', () => {
	const f = (native, icon) => ({ kind: 'field', label: 'Wanneer', rect: { x: 0, y: 0, w: 300, h: 40 }, props: { h: 40, borderRadius: 8, border: 1, borderColor: 'rgb(130,138,149)', background: null, native, color: 'rgb(0,0,0)', fontSize: 15, fontWeight: 400, paddingLeft: 12, paddingRight: 12, icon, text: true, badge: false } })
	assert.ok(!compareElement(f(undefined, false), f(true, true)).some((r) => r.flag))
})

test('a nav entry drawn as a button on the board and as a link row on live pairs by its label, without a kind flag', () => {
	const e = (kind) => ({ kind, label: 'Weergaven in mijn menu', inControl: null, container: 1, rect: { x: 284, y: 502, w: 182, h: 36 }, props: { h: 36, borderRadius: 8, border: 0, borderColor: null, background: 'rgb(234, 240, 247)', color: 'rgb(27, 28, 29)', fontSize: 15, fontWeight: 500, paddingLeft: 10, paddingRight: 10, icon: false, text: true, badge: false, gapNext: null } })
	const r = pairElements([e('button')], [e('row')], 1000)
	assert.deepEqual([r.pairs.length, r.pairs[0] && r.pairs[0].by], [1, 'label'])
	assert.ok(!compareElement(e('button'), e('row')).some((x) => x.flag))
})

test('a toolbar or listbox inside a dialog is placed from the dialog\'s top, as a dialog card is', () => {
	const dialog = (y) => ({ role: 'dialog', rect: { x: 400, y, w: 640, h: 707 } })
	const d = { board: dialog(120), live: dialog(88) }
	const origin = { x: 292, y: 90 }
	const tb = (y) => ({ role: 'toolbar', rect: { x: 424, y, w: 592, h: 75 } })
	assert.deepEqual(positionReasons({ board: tb(455), live: tb(422.5) }, origin, origin, d), [])
	// A listbox the select appended to the body runs on past the dialog's bottom: it starts inside it.
	const lb = (y) => ({ role: 'listbox', rect: { x: 424, y, w: 592, h: 900 } })
	assert.deepEqual(positionReasons({ board: lb(299), live: lb(264.5) }, origin, origin, d), [])
	// Control: a toolbar 10px lower in its dialog still fails.
	assert.deepEqual(positionReasons({ board: tb(455), live: tb(433) }, origin, origin, d), ['y +10'])
	// Control: outside the dialog on a side, the page origin still places it.
	assert.deepEqual(positionReasons({ board: tb(40), live: tb(8) }, origin, origin, d), ['y -32'])
})

test('a table at the same top-left corner pairs whatever its width, and its width difference is still reported', () => {
	const table = (w, h) => ({ role: 'table', title: 'table', rect: { x: 293, y: 309, w, h } })
	const r = pairComponents([table(1414.6, 655)], [table(1118, 1318)], 1200)
	assert.equal(r.pairs.length, 1)
	assert.ok(compareProps(r.pairs[0].board, r.pairs[0].live).some((x) => x.prop === 'rect.w' && Math.abs(x.delta) > 8))
	// Control: a table that starts elsewhere does not pair by its corner.
	const far = { role: 'table', title: 'table', rect: { x: 700, y: 309, w: 600, h: 600 } }
	assert.equal(pairComponents([table(1414.6, 655)], [far], 1200).pairs.length, 0)
})

test('a row\'s left padding is not flagged when its text starts at the same place; a moved text still flags', () => {
	const row = (paddingLeft, textInsetLeft) => ({ kind: 'row', label: 'Document beoordeeld', rect: { x: 315, y: 700, w: 753, h: 58 }, props: { h: 58, borderRadius: 0, border: 0, borderColor: null, background: 'rgb(255, 255, 255)', color: 'rgb(27, 28, 29)', fontSize: 15, fontWeight: 600, paddingLeft, paddingRight: 0, icon: true, text: true, badge: false, gapNext: null, textInsetLeft } })
	assert.ok(!compareElement(row(0, 48), row(48, 48)).some((r) => r.flag))
	assert.ok(compareElement(row(0, 48), row(48, 96)).some((r) => r.prop === 'paddingLeft' && r.flag))
	// Stored runs without the text start keep the padding rule.
	assert.ok(compareElement(row(0, undefined), row(48, undefined)).some((r) => r.prop === 'paddingLeft' && r.flag))
})

test('a line of another colour inside a field\'s frame on one side only is a border difference', () => {
	const f = (innerBorder, innerBorderColor) => ({ kind: 'field', label: 'Delen met', rect: { x: 424, y: 255, w: 592, h: 44 }, props: { h: 44, borderRadius: 8, border: 2, borderColor: 'rgb(27, 28, 29)', innerBorder, innerBorderColor, background: 'rgb(255, 255, 255)', color: 'rgb(27, 28, 29)', fontSize: 15, fontWeight: 400, paddingLeft: 8, paddingRight: 38, icon: true, text: false, badge: false, gapNext: null } })
	assert.ok(!compareElement(f(0, null), f(0, null)).some((r) => r.flag))
	assert.ok(compareElement(f(0, null), f(1, 'rgb(54, 105, 165)')).some((r) => r.prop === 'innerBorder' && r.flag))
})

test('a control named by an aria-label that starts with its visible text pairs with the board\'s control of that text', () => {
	const el = (label, x) => ({ kind: 'button', label, inControl: null, container: 1, interactive: true, rect: { x, y: 96, w: 140, h: 40 }, props: { h: 40, borderRadius: 20, background: 'rgb(231, 243, 234)', border: 0, fontSize: 14 } })
	const r = pairElements([el('Beschikbaar', 1000)], [el('Beschikbaar: routering stelt je in de wachtrij', 1004)], 900)
	assert.deepEqual([r.pairs.length, r.missing.length, r.extra.length], [1, 0, 0])
	// Control: a different control whose name only shares a first word ("Beschikbaarheid plannen") stays two controls.
	const c = pairElements([el('Beschikbaar', 1000)], [el('Beschikbaarheid plannen', 1004)], 900)
	assert.deepEqual([c.pairs.length, c.missing.length, c.extra.length], [0, 1, 1])
})

test('a tag in a list row does not stand for a chip outside the rows (an active-filter chip in the toolbar)', () => {
	const tag = (label, x, y, h, inRow, background) => ({ kind: 'pill', label, inControl: null, interactive: false, inRow, container: inRow ? 6 : 5, rect: { x, y, w: 60, h }, props: { h, borderRadius: h / 2, border: 0, background, color: 'rgb(0, 0, 0)', fontSize: 13, fontWeight: 600, paddingLeft: 10, paddingRight: 10, icon: false, text: true, badge: false, gapNext: null } })
	const chips = [tag('Soort: Verzoek', 713, 253, 30, false, 'rgb(234, 240, 247)'), tag('Status: Nieuw', 860, 253, 30, false, 'rgb(234, 240, 247)')]
	const rowTags = (y0) => ['Klacht', 'Verzoek', 'Vraag'].map((t, i) => tag(t, 709, y0 + i * 52, 21, true, 'rgb(252, 237, 236)'))
	const r = pairElements(chips, rowTags(374), 1400)
	assert.deepEqual(r.pairs.filter((p) => p.board.label === 'Soort: Verzoek'), [])
	// Control: tags in the rows on both sides pair as one group, whatever their values.
	const rows = pairElements(rowTags(380).map((t) => ({ ...t, label: `${t.label} x` })), rowTags(374), 1400)
	assert.equal(rows.pairs.filter((p) => p.by.startsWith('group')).length, 1)
})
