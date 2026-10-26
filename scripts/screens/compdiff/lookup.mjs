// A spec route can name a record by a lookup instead of its uuid, because an example set reinstalled with --refresh
// gives its records new uuids and a route with the old one opens "Niet gevonden". The lookup is resolved through the
// OpenRegister API when the board is measured:
//
//   {task:<field>=<value>}                       an engine task (/api/flow-tasks), e.g. {task:title=Hoorzitting inplannen}
//                                                or {task:key=hoorzitting-inplannen} (the example-set key; the
//                                                "example-set:<app>/" prefix may be left out)
//   {object:<register>/<schema>:<field>=<value>}  an object, e.g. {object:dossiq/case:title=Verlichting fietspad Lindelaan}
//
// A lookup that finds no record, or more than one, is an error: measuring some other record is worse than not measuring.

const LOOKUP = /\{(task|object):([^{}]+?)\}/g

/**
 * The lookups in a route.
 *
 * @param {string} route The route, as written in the spec.
 * @return {Array<{ text: string, kind: string, register?: string, schema?: string, field: string, value: string }>}
 */
export function parseLookups (route) {
	const out = []
	for (const m of route.matchAll(LOOKUP)) {
		const [text, kind, body] = m
		let where = body
		const item = { text, kind }
		if (kind === 'object') {
			const at = body.indexOf(':')
			const rs = at > 0 ? body.slice(0, at).split('/') : []
			if (rs.length !== 2 || !rs[0] || !rs[1]) throw new Error(`lookup ${text}: an object lookup is {object:<register>/<schema>:<field>=<value>}`)
			item.register = rs[0]
			item.schema = rs[1]
			where = body.slice(at + 1)
		}
		const eq = where.indexOf('=')
		if (eq <= 0 || eq === where.length - 1) throw new Error(`lookup ${text}: needs <field>=<value>`)
		item.field = where.slice(0, eq).trim()
		item.value = decodeURIComponent(where.slice(eq + 1).trim())
		out.push(item)
	}
	return out
}

const matches = (record, item) => {
	const v = record[item.field]
	if (v === undefined || v === null) return false
	if (String(v) === item.value) return true
	// An example-set key is stored as "example-set:<app>/<key>"; the spec may name only <key>.
	return item.kind === 'task' && item.field === 'key' && String(v).endsWith(`/${item.value}`)
}

/**
 * Replace every lookup in a route by the uuid it finds.
 *
 * @param {string} route The route with lookups.
 * @param {(path: string) => Promise<object>} getJson GETs a path on the instance (as the measuring user) and returns
 *   the parsed body.
 * @return {Promise<string>} The route with uuids.
 */
export async function resolveRoute (route, getJson) {
	let resolved = route
	for (const item of parseLookups(route)) {
		const found = []
		if (item.kind === 'task') {
			// The task list ignores filters, so it is paged through and matched here.
			for (let offset = 0; offset < 5000; offset += 100) {
				const page = await getJson(`/index.php/apps/openregister/api/flow-tasks?limit=100&offset=${offset}`)
				const rows = page.results || []
				found.push(...rows.filter((r) => matches(r, item)))
				if (rows.length < 100 || (typeof page.total === 'number' && offset + rows.length >= page.total)) break
			}
		} else {
			const q = `${encodeURIComponent(item.field)}=${encodeURIComponent(item.value)}&_limit=5`
			const page = await getJson(`/index.php/apps/openregister/api/objects/${encodeURIComponent(item.register)}/${encodeURIComponent(item.schema)}?${q}`)
			found.push(...(page.results || []).filter((r) => matches(r, item)))
		}
		if (found.length !== 1) throw new Error(`lookup ${item.text} found ${found.length} records, needs exactly 1`)
		const id = found[0].uuid || found[0].id || (found[0]['@self'] && found[0]['@self'].id)
		if (!id) throw new Error(`lookup ${item.text}: the record has no uuid`)
		resolved = resolved.replace(item.text, id)
	}
	return resolved
}
