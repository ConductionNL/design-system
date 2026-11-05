// One region of a board measured against one component of the live page. A board marks the regions it draws apart
// from the page itself: a side-state panel carries `data-compdiff-region="<name>"` (its aria-label, as written), and
// each state card in it `data-compdiff-state="<card title>"`. A panel that draws a single state carries both. Inside a
// state card, the card's caption strip and the grey sentence under the drawing say what the state is: they carry
// `data-compdiff-exempt="state-note"` and leave the layout when a state card is measured.
//
//   --board-region "<name>"   the region, by its data-compdiff-region or its aria-label
//   --state-card "<title>"    one state card inside it, by its data-compdiff-state
//   --live-region "<selector>"   the live component to compare it with (a Playwright selector, first match), found
//                                after the steps put live into the state
//
// Both sides are measured whole, as usual; then only what lies inside the region on the board and inside the live
// component is kept, each placed from its own region's top left, and the crops are cut from region screenshots.

/**
 * The region flags, checked.
 *
 * @param {object} args The parsed command line.
 * @return {{region: string, state: string|null, live: string}|null} The region to measure, or null for the whole board.
 */
export function parseRegion(args) {
	const given = (k) => args[k] !== undefined
	if (!given('board-region')) {
		if (given('state-card')) throw new Error('--state-card needs --board-region: the panel the state card sits in')
		if (given('live-region')) throw new Error('--live-region needs --board-region: the board region to compare it with')
		return null
	}
	const value = (k) => {
		if (args[k] === 'true' || String(args[k]).trim() === '') throw new Error(`--${k} needs a value`)
		return args[k]
	}
	const region = value('board-region')
	const state = given('state-card') ? value('state-card') : null
	if (!given('live-region')) throw new Error('--board-region needs --live-region: the live component to compare the region with')
	return { region, state, live: value('live-region') }
}

/**
 * The exempt kinds for a region run. What lies outside the region is cut off anyway, and inside it a banner or a
 * side-state panel is the state being measured, so neither leaves; a state card's notes do.
 *
 * @param {Array<string>} kinds The kinds from --exempt.
 * @param {{state: string|null}|null} region The region, or null.
 * @return {Array<string>} The kinds to apply.
 */
export function regionExemptKinds(kinds, region) {
	if (!region) return kinds
	return region.state ? ['state-note'] : []
}

/**
 * The name a region run is reported and written under: `<Board>~<slug>`, so the states of one board do not overwrite
 * each other.
 *
 * @param {string} board The board.
 * @param {{region: string, state: string|null}|null} region The region, or null.
 * @return {string} The name.
 */
export function regionId(board, region) {
	if (!region) return board
	const slug = (region.state || region.region).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
	return `${board}~${slug || 'region'}`
}

/**
 * Runs in the board page: finds the marked region, and the state card in it when one is named.
 *
 * @param {{region: string, state: string|null}} want The region and state card.
 * @return {{rect: {x: number, y: number, w: number, h: number}}|{error: string}} Its place on the page, or why not.
 */
export function findBoardRegion(want) {
	const all = [...document.querySelectorAll('[data-compdiff-region]')]
	const hits = all.filter((el) => el.getAttribute('data-compdiff-region') === want.region || el.getAttribute('aria-label') === want.region)
	const names = () => all.map((el) => `"${el.getAttribute('data-compdiff-region')}"`).join(', ') || 'none'
	if (hits.length === 0) return { error: `--board-region "${want.region}" matches no marked region; the board marks ${names()}` }
	if (hits.length > 1) return { error: `--board-region "${want.region}" matches ${hits.length} marked regions` }
	let el = hits[0]
	if (want.state) {
		const cards = [el, ...el.querySelectorAll('[data-compdiff-state]')].filter((c) => c.hasAttribute('data-compdiff-state'))
		const found = cards.filter((c) => c.getAttribute('data-compdiff-state') === want.state)
		if (found.length !== 1) {
			const titles = cards.map((c) => `"${c.getAttribute('data-compdiff-state')}"`).join(', ') || 'none'
			return { error: `--state-card "${want.state}" matches ${found.length} state cards in "${want.region}"; it has ${titles}` }
		}
		el = found[0]
	}
	const r = el.getBoundingClientRect()
	if (r.width < 1 || r.height < 1) return { error: `"${want.state || want.region}" is not shown on the board` }
	return { rect: { x: Math.round(r.x + window.scrollX), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) } }
}

/**
 * Keeps what lies inside a region and places it from the region's top left.
 *
 * @param {Array<{rect: {x: number, y: number, w: number, h: number}}>} items Measured items, each with its rect.
 * @param {{x: number, y: number, w: number, h: number}} region The region.
 * @param {number} slack How far (px) an item may stick out of the region and still count as inside.
 * @return {Array<object>} The items inside, with their rect shifted.
 */
export function within(items = [], region, slack = 2) {
	const inside = (r) => r.x >= region.x - slack && r.y >= region.y - slack && r.x + r.w <= region.x + region.w + slack && r.y + r.h <= region.y + region.h + slack
	return items.filter((i) => i && i.rect && inside(i.rect)).map((i) => ({ ...i, rect: { ...i.rect, x: i.rect.x - region.x, y: i.rect.y - region.y } }))
}

/**
 * One side's measurement cut to a region: components, elements and the board's unmeasured parts, icons and
 * floating layers.
 *
 * @param {object} m The extractor's result.
 * @param {{x: number, y: number, w: number, h: number}} region The region.
 * @return {object} The same shape, cut.
 */
export function cutToRegion(m, region) {
	const rects = (list = []) => within(list.map((r) => ({ rect: r })), region).map((i) => i.rect)
	return { ...m, components: within(m.components, region), elements: within(m.elements, region), unmeasured: within(m.unmeasured, region), icons: within(m.icons, region), floaters: rects(m.floaters) }
}
