/**
 * The address compdiff opens a flattened board at. A board translates itself and takes its design system from the
 * query (`?lang=en&ds=zuiddrecht`, read by preview/screens/theme.js), as the gallery opens it, so a live page in
 * English is measured against the board in English.
 */
import { pathToFileURL } from 'node:url'

export const LANGS = ['nl', 'en']

/**
 * @param {string} file The board's path on disk.
 * @param {{lang?: string, ds?: string}} options The language and the design system, both optional.
 * @return {string} The file URL, with a query only for what was asked.
 */
export function boardUrl(file, { lang, ds } = {}) {
	if (lang !== undefined && !LANGS.includes(lang)) throw new Error(`--lang ${lang}: a board is drawn in ${LANGS.join(' or ')}`)
	if (ds !== undefined && !/^[a-z0-9-]+$/.test(ds)) throw new Error(`--ds ${ds}: a design system id is lower case letters, digits and dashes`)
	const url = pathToFileURL(file)
	if (lang) url.searchParams.set('lang', lang)
	if (ds) url.searchParams.set('ds', ds)
	return url.href
}
