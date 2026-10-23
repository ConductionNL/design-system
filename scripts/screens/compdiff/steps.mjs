// Steps that bring the live page into the board's state before it is measured: open a menu, pick an option, fill a
// field. They play in the order given, so a step can depend on the one before it (type into a search, then click the
// option it found). The same list is what REVIEW/boards.json keeps per board.
//
// A step is one of:
//   { "click": "<selector>" }
//   { "fill": "<selector>", "value": "<text>" }      replaces the field's value at once
//   { "type": "<selector>", "value": "<text>" }      types key by key, for a field that searches as you type
//   { "press": "<selector>", "key": "<key>" }        one key, such as Enter or ArrowDown
//   { "wait": <milliseconds> }
//   { "waitFor": "<selector>" }
//   { "goto": "<route>" }                            opens a route of the live instance, such as /apps/keepiq/lock
// A fill or type value of the form ${NAME} is read from the environment variable NAME when the step plays, so a
// secret such as a vault password stays out of boards.json.
// Nothing here writes: compdiff refuses every write request to the live instance, and a step that would submit a
// form only meets that refusal.
import fs from 'node:fs'

const KINDS = ['click', 'fill', 'type', 'press', 'wait', 'waitFor', 'goto']

/**
 * Check one step and return it in its plain form.
 *
 * @param {object} step The step.
 * @param {number} index Its place in the list, for the error.
 * @return {{kind: string, selector?: string, value?: string, key?: string, ms?: number}} The step.
 */
export function normaliseStep(step, index = 0) {
	if (!step || typeof step !== 'object' || Array.isArray(step)) {
		throw new Error(`step ${index + 1}: not an object`)
	}
	const kinds = KINDS.filter((k) => k in step)
	if (kinds.length !== 1) {
		throw new Error(`step ${index + 1}: needs exactly one of ${KINDS.join(', ')}`)
	}
	const kind = kinds[0]
	if (kind === 'wait') {
		const ms = Number(step.wait)
		if (!Number.isFinite(ms) || ms < 0) throw new Error(`step ${index + 1}: wait needs a number of milliseconds`)
		return { kind, ms }
	}
	const selector = step[kind]
	if (kind === 'goto') {
		if (typeof selector !== 'string' || !selector.startsWith('/')) throw new Error(`step ${index + 1}: goto needs a route starting with /`)
		return { kind, route: selector }
	}
	if (typeof selector !== 'string' || selector.trim() === '') {
		throw new Error(`step ${index + 1}: ${kind} needs a selector`)
	}
	if (kind === 'fill' || kind === 'type') {
		if (typeof step.value !== 'string') throw new Error(`step ${index + 1}: ${kind} needs a value`)
		return { kind, selector, value: step.value }
	}
	if (kind === 'press') {
		if (typeof step.key !== 'string' || step.key === '') throw new Error(`step ${index + 1}: press needs a key`)
		return { kind, selector, key: step.key }
	}
	return { kind, selector }
}

/**
 * A step value, or the environment variable it names as ${NAME}.
 *
 * @param {string} value The step value.
 * @param {object} env The environment.
 * @return {string} The value to type.
 */
export function fromEnv(value, env) {
	const m = /^\$\{([A-Z0-9_]+)\}$/.exec(value)
	if (!m) return value
	if (env[m[1]] === undefined) throw new Error(`step value needs the environment variable ${m[1]}`)
	return env[m[1]]
}

/**
 * Read a --width argument: the viewport both pages are measured at, so a phone board (MobielZaak, 390px) is compared
 * with the live page at a phone's width. Unset, 1440, the width every desktop board is drawn at.
 *
 * @param {string|undefined} arg The argument.
 * @return {number} The width in pixels.
 */
export function parseWidth(arg) {
	if (arg === undefined) return 1440
	const width = Number(arg)
	if (!Number.isInteger(width) || width < 320 || width > 2560) throw new Error('--width must be a whole number from 320 to 2560')
	return width
}

/**
 * Read a --steps argument: a JSON array, or `@<file>` holding one.
 *
 * @param {string} arg The argument.
 * @return {Array<object>} The checked steps.
 */
export function parseSteps(arg) {
	const text = arg.startsWith('@') ? fs.readFileSync(arg.slice(1), 'utf8') : arg
	const list = JSON.parse(text)
	if (!Array.isArray(list)) throw new Error('--steps must be a JSON array')
	return list.map(normaliseStep)
}

/**
 * Play the steps on a Playwright page, in order. A click or a wait that fails stops the run, because the page is
 * then not in the state the board draws; a fill that fails is reported and skipped, as --fills always did.
 *
 * @param {object} page A Playwright page.
 * @param {Array<object>} steps Checked steps.
 * @param {(message: string) => void} [warn] Where a skipped fill is reported.
 * @return {Promise<void>}
 */
export async function playSteps(page, steps, warn = (m) => console.error(m), { base = '', env = process.env } = {}) {
	for (let step of steps) {
		if (step.kind === 'goto') {
			await page.goto(base + step.route, { waitUntil: 'load', timeout: 180000 }).catch(() => {})
			await page.waitForTimeout(1500)
			continue
		}
		if (step.kind === 'fill' || step.kind === 'type') step = { ...step, value: fromEnv(step.value, env) }
		if (step.kind === 'click') {
			await page.click(step.selector, { timeout: 60000 })
			await page.waitForTimeout(1500)
		} else if (step.kind === 'fill') {
			try {
				await page.fill(step.selector, step.value, { timeout: 15000 })
			} catch (e) {
				warn(`fill skipped: ${step.selector} ${String(e.message).split('\n')[0]}`)
			}
			await page.waitForTimeout(500)
		} else if (step.kind === 'type') {
			await page.locator(step.selector).pressSequentially(step.value, { delay: 40, timeout: 30000 })
			await page.waitForTimeout(1500)
		} else if (step.kind === 'press') {
			await page.press(step.selector, step.key, { timeout: 15000 })
			await page.waitForTimeout(500)
		} else if (step.kind === 'wait') {
			await page.waitForTimeout(step.ms)
		} else if (step.kind === 'waitFor') {
			await page.waitForSelector(step.selector, { timeout: 60000 })
		}
	}
}
