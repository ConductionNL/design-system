/**
 * Loads every brand asset a film may use into <symbol>s, under stable ids.
 *
 *   g-<app id>                 the app's real icon (img/app.svg), currentColor
 *   nc-files, nc-mail, ...     Nextcloud's own bundled apps, line icons, currentColor
 *   nextcloud-logo             the Nextcloud mark, currentColor (white on a #0082C9 hex)
 *   icon-bell                  the notification bell (Lucide), stroke currentColor
 *   avatar-conduction          the Conduction hex avatar, currentColor
 *   wordmark-connext           "Con" cobalt + "Next" Nextcloud blue, for light grounds
 *   wordmark-connext-white     "Con" white + "Next" Nextcloud blue, for cobalt grounds
 *   wordmark-conduction(-white)
 *
 * Draw one with <use href="#id" width height color>. Never redraw a mark by hand.
 */
import { loadSymbols } from './stage.js'
import { BRAND_BASE } from './brand.js'

const BRAND = BRAND_BASE.replace(/\/$/, '')

/** The 21 core apps, by the <id> each ships in appinfo/info.xml on development. */
export const APP_IDS = [
	'openregister', 'opencatalogi', 'integriq', 'filinq', 'thematiq', 'launchpad', 'stackiq', 'larpinq',
	'zaakafhandelapp', 'dossiq', 'pipelinq', 'shillinq', 'learniq', 'portaliq', 'decidiq', 'buildiq',
	'keepiq', 'hermiq', 'humaniq', 'versioniq', 'planninq',
]

/** Display names as each app's info.xml spells them, for labels. */
export const APP_NAMES = {
	openregister: 'OpenRegister', opencatalogi: 'OpenCatalogi', integriq: 'Integriq', filinq: 'Filinq', thematiq: 'Thematiq',
	launchpad: 'LaunchPad', stackiq: 'Stackiq', larpinq: 'Larpinq', zaakafhandelapp: 'ZaakAfhandelApp', dossiq: 'Dossiq',
	pipelinq: 'Pipelinq', shillinq: 'Shillinq', learniq: 'Learniq', portaliq: 'Portaliq', decidiq: 'Decidiq', buildiq: 'Buildiq',
	keepiq: 'Keepiq', hermiq: 'Hermiq', humaniq: 'Humaniq', versioniq: 'Versioniq', planninq: 'Planninq',
}

export const NC_APPS = ['files', 'mail', 'calendar', 'talk', 'decks', 'activity']

export async function loadBrandAssets(defs) {
	await Promise.all([
		loadSymbols(defs, Object.fromEntries(APP_IDS.map((id) => [`g-${id}`, `${BRAND}/apps/glyphs/${id}.svg`]))),
		loadSymbols(defs, Object.fromEntries(NC_APPS.map((id) => [`nc-${id}`, `${BRAND}/integrations/nextcloud-bundled/${id}.svg`]))),
		loadSymbols(defs, {
			'wordmark-connext': `${BRAND}/wordmark-connext.svg`,
			'wordmark-connext-white': `${BRAND}/wordmark-connext-white.svg`,
			'wordmark-conduction': `${BRAND}/wordmark-conduction.svg`,
			'wordmark-conduction-white': `${BRAND}/wordmark-conduction-white.svg`,
		}),
		loadSymbols(defs, { 'avatar-conduction': `${BRAND}/avatar-conduction.svg`, 'nextcloud-logo': `${BRAND}/nextcloud-logo.svg` }, { recolor: true }),
		// UI icons (Lucide line icons, the brand's UI iconography): icon-bell for notifications.
		loadSymbols(defs, { 'icon-bell': `${BRAND}/icons/bell.svg` }, { recolor: true }),
	])
}

/** viewBox sizes, so a mark can be placed by height without measuring. */
export const MARK_BOX = {
	'wordmark-connext': [259, 80], 'wordmark-connext-white': [259, 80],
	'wordmark-conduction': [335, 80], 'wordmark-conduction-white': [335, 80],
	'avatar-conduction': [173.2, 200], 'nextcloud-logo': [130, 60],
}
