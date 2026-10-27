// node --test scripts/screens/compdiff/frame.test.mjs
// --board-frame measures one frame of a board that draws several side by side, as if it were the whole board.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { cropToFrame } from './frame.mjs'

const require = createRequire(import.meta.url)
const CHROME = process.env.CHROME || '/opt/google/chrome/chrome'
let chromium = null
try { chromium = require(process.env.PLAYWRIGHT_MODULE || 'playwright').chromium } catch { chromium = null }
const skip = !chromium || !fs.existsSync(CHROME) ? 'no playwright or Chrome' : false

test('the named frame is left alone at the top left, the other frames and captions are gone', { skip }, async () => {
	const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
	try {
		const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
		const frame = (name, x) => `<section aria-label="${name}" style="position:absolute;left:${x}px;top:120px;width:375px;height:760px;box-sizing:border-box;border:1px solid #000"><h1>${name}</h1></section>`
		await page.setContent(`<body style="margin:0"><p>a Mijn werk · b Klant · c Bezoek</p>${frame('Mijn werk op een telefoon', 40)}${frame('Klant', 520)}${frame('Bezoek', 1000)}</body>`)
		assert.equal(await page.evaluate(cropToFrame, 'section[aria-label="Mijn werk op een telefoon"]'), true)
		const r = await page.evaluate(() => { const s = document.querySelector('section'); const q = s.getBoundingClientRect(); return { n: document.querySelectorAll('section').length, x: q.x, y: q.y, w: q.width, text: document.body.textContent.trim() } })
		assert.deepEqual(r, { n: 1, x: 0, y: 0, w: 375, text: 'Mijn werk op een telefoon' })
		assert.equal(await page.evaluate(cropToFrame, '#nope'), false)
	} finally {
		await browser.close()
	}
})
