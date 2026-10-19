#!/usr/bin/env node
// node pagebg-backfill.mjs <rundir>
// Adds the page background (board and live) to stored measurements that predate it, from their screenshots.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { pageBackground } from './pagebg.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const dir = process.argv[2]
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
let n = 0
for (const f of fs.readdirSync(dir).filter((x) => /\.json$/.test(x) && !/^(results|verdicts|findings)/.test(x))) {
	const file = path.join(dir, f)
	const r = JSON.parse(fs.readFileSync(file, 'utf8'))
	if (!r.board || r.page) continue
	const b = path.join(dir, `${r.board}-board.png`), l = path.join(dir, `${r.board}-live.png`)
	if (!fs.existsSync(b) || !fs.existsSync(l)) continue
	r.page = { board: await pageBackground(page, b, fs), live: await pageBackground(page, l, fs) }
	fs.writeFileSync(file, JSON.stringify(r, null, 1))
	n++
}
await browser.close()
console.log(`page background added to ${n} boards`)
