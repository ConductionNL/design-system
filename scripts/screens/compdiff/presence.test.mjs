// node --test scripts/screens/compdiff/presence.test.mjs
// --present-as: a second user has the record open while the board is measured, so a page that shows who else is
// looking ("kijkt nu ook naar deze zaak") is measured with that row. The browser test needs PLAYWRIGHT_MODULE and
// Chrome, and skips without them.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { presenceWrite, presentAs } from './presence.mjs'

const require = createRequire(import.meta.url)
const CHROME = process.env.CHROME || '/opt/google/chrome/chrome'
let chromium = null
try {
	chromium = require(process.env.PLAYWRIGHT_MODULE || 'playwright').chromium
} catch {
	chromium = null
}
const skip = !chromium || !fs.existsSync(CHROME) ? 'no playwright or Chrome' : false

test('only a record\'s presence beat and departure pass as presence writes', () => {
	const at = (p) => `http://localhost:8080${p}`
	assert.equal(presenceWrite('PUT', at('/index.php/apps/openregister/api/objects/dossiq/case/710d44a4/presence')), true)
	assert.equal(presenceWrite('PUT', at('/apps/openregister/api/objects/dossiq/case/710d44a4/presence')), true)
	assert.equal(presenceWrite('DELETE', at('/index.php/apps/openregister/api/objects/dossiq/case/710d44a4/presence')), true)
	assert.equal(presenceWrite('POST', at('/index.php/apps/openregister/api/objects/dossiq/case/710d44a4/presence?_method=DELETE')), true)
	assert.equal(presenceWrite('PUT', at('/index.php/apps/openregister/api/objects/dossiq/case/710d44a4')), false)
	assert.equal(presenceWrite('POST', at('/index.php/apps/openregister/api/objects/dossiq/case')), false)
	assert.equal(presenceWrite('PATCH', at('/index.php/apps/openregister/api/objects/dossiq/case/710d44a4/presence')), false)
	assert.equal(presenceWrite('PUT', at('/index.php/apps/dossiq/api/objects/dossiq/case/710d44a4/presence')), false)
	assert.equal(presenceWrite('PUT', 'not a url'), false)
})

test('the second user logs in, opens the record and beats; every other write stays refused', { skip }, async () => {
	const seen = []
	const server = http.createServer((req, res) => {
		seen.push(`${req.method} ${req.url}`)
		const loggedIn = (req.headers.cookie || '').includes('who=anouk')
		if (req.url === '/login' && req.method === 'GET') {
			res.writeHead(200, { 'content-type': 'text/html' })
			return res.end('<form method="post" action="/login"><input id="user" name="user"><input id="password" name="password" type="password"><button type="submit">Inloggen</button></form>')
		}
		if (req.url === '/login' && req.method === 'POST') {
			let body = ''
			req.on('data', (c) => { body += c })
			return req.on('end', () => {
				const ok = body.includes('user=anouk') && body.includes('password=secret')
				res.writeHead(303, ok ? { 'set-cookie': 'who=anouk; Path=/', location: '/apps/dashboard/' } : { location: '/login' })
				res.end()
			})
		}
		if (!loggedIn) {
			res.writeHead(303, { location: '/login' })
			return res.end()
		}
		if (req.method === 'GET' && req.url !== '/apps/dossiq/cases/c1') {
			res.writeHead(200, { 'content-type': 'text/html' })
			return res.end('<p>dashboard</p>')
		}
		if (req.method === 'GET') {
			res.writeHead(200, { 'content-type': 'text/html' })
			return res.end(`<p>case</p><script>
				fetch('/index.php/apps/openregister/api/objects/dossiq/case/c1/presence', { method: 'PUT' })
				fetch('/index.php/apps/dossiq/api/cases/c1/read', { method: 'POST' })
			</script>`)
		}
		res.writeHead(200, { 'content-type': 'application/json' })
		res.end('{"present":[]}')
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	const base = `http://127.0.0.1:${server.address().port}`
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const there = await presentAs(browser, { base, target: `${base}/apps/dossiq/cases/c1`, account: { user: 'anouk', password: 'secret' }, wait: 10000 })
		// The page's other write runs beside the beat: give its refusal a moment to land.
		await new Promise((resolve) => setTimeout(resolve, 500))
		assert.equal(there.beats, 1)
		assert.ok(seen.includes('PUT /index.php/apps/openregister/api/objects/dossiq/case/c1/presence'))
		assert.ok(!seen.includes('POST /index.php/apps/dossiq/api/cases/c1/read'))
		assert.deepEqual(there.blocked, ['POST /index.php/apps/dossiq/api/cases/c1/read'])
		await there.close()
	} finally {
		await browser.close()
		server.close()
	}
})
