/**
 * Act 2, 3 and 4: the precedent (WordPress and what got wilded), suite versus
 * workspace, and the math that changed (Power Platform, the buyout, the CLOUD
 * Act, Nextcloud's users). Sources are Ruben's deck of 29 Oct 2026.
 */
import { C } from '../../../_lib/brand.js'
import { hex, rect, honeyAt } from '../../../_lib/ui.js'
import { textBlock } from '../../../_lib/stage.js'
import { rand } from '../../../_lib/core.js'
import { ground, eyebrow, headline, body, bigNumber, statRow, strip, field, cell, integration, board, X, W, MONO } from './kit.js'

/** A text cell whose label may span several lines (`\n`), centred in the hex. */
function textCell(g, cx, cy, r, label, { fill = C.cobalt600, ink = C.white, size = 28, stroke } = {}) {
	hex(g, cx, cy, r, fill, r * 0.08, stroke ? { stroke, 'stroke-width': 4 } : {})
	const n = label.split('\n').length
	const lh = 1.08
	const y0 = cy + size * 0.35 - ((n - 1) * size * lh) / 2
	textBlock(g, label, { x: cx, y: y0, size, weight: 700, fill: ink, anchor: 'middle', lineHeight: lh, tracking: -0.01, clip: false })
}

/** A white hex with a kit integration mark and its name underneath. */
function markCell(g, cx, cy, r, id, label, size = 26) {
	hex(g, cx, cy, r, C.white, r * 0.08)
	const s = r * 0.82
	integration(g, id, cx - s / 2, cy - r * 0.62, s)
	textBlock(g, label, { x: cx, y: cy + r * 0.62, size, weight: 700, fill: C.cobalt, anchor: 'middle', tracking: -0.01, clip: false })
}

/** A dated row for a list of facts: mono date, then the fact. */
function factRow(g, x, y, w, date, text, ink, soft) {
	rect(g, x, y - 58, w, 2, C.cobalt400)
	eyebrow(g, date, { x, y: y - 14, size: 22, fill: C.cobalt300 })
	body(g, text, ink, { x, y: y + 30, size: 32, maxWidth: w })
	void soft
}

/** The long tail of business software: cells that get smaller and fainter to the right. */
function longTail(g, x0, y0, seed) {
	const at = honeyAt(x0, y0, 22, 6)
	const r = rand(seed)
	for (let q = 0; q < 17; q++) {
		for (let rr = 0; rr < 6; rr++) {
			const [x, y] = at(q - Math.floor(rr / 2), rr)
			if (x > 1790 || y > 880) continue
			const fade = Math.max(0.08, 1 - q / 17 - rr * 0.07 + (r() - 0.5) * 0.1)
			hex(g, x, y, 22, C.cobalt400, 2, { 'fill-opacity': fade })
		}
	}
}

export const act2to4 = [
	/* ---------------------------------------------------------------- Act 2 */
	board('wordpress-share', 'WordPress won the web without a plan', {
		words: 'WordPress won the web without a plan. Small core, large ecosystem, zero barrier. Now it is slowly losing it. Still four in ten websites.',
		material: 'counters count up; the share counts down from 43.6 to 39.6; W3Techs, WordPress 6.8 credits',
		draw(ctx) {
			const { ink } = ground(ctx)
			eyebrow(ctx.g, 'The precedent · publishing · W3Techs, October 2026', { y: 200 })
			headline(ctx.g, 'WordPress won the web without a plan.\nNow it is slowly losing it.', ink, { y: 320, size: 88, wide: true })
			statRow(ctx.g, [
				{ value: '39.6%', label: 'of all websites', sub: 'down from 43.6% in January 2025, four points in 22 months', accent: true },
				{ value: '60,000', label: 'free plugins', sub: 'roughly; the core stays small, the ecosystem does the rest' },
				{ value: '921', label: 'people on one release', sub: 'contributors to WordPress 6.8 alone, the largest group so far' },
			], ink, { y: 660 })
		},
	}),
	board('wilded', 'Every few years, something gets wilded', {
		words: 'Every few years, something gets wilded. The server. Knowledge. Publishing. The browser. Business software is the big one left. Still sold in boxes.',
		material: 'kinetic type; a timeline lights one step at a time, left to right; the fifth step is the orange',
		draw(ctx) {
			const { ink, soft, mute } = ground(ctx)
			eyebrow(ctx.g, 'The pattern', { y: 200 })
			headline(ctx.g, 'Every few years, something gets wilded.', ink, { y: 310, size: 88, wide: true })
			const steps = [
				['1991 · 1995', 'The server', 'Linux and Apache.\nThe web runs on software nobody owns.'],
				['2001', 'Knowledge', 'Wikipedia.\nAnyone can write the encyclopedia.'],
				['2003', 'Publishing', 'WordPress.\nAnyone can run a website.'],
				['2004', 'The browser', 'Firefox.\nThe window onto the web opens up.'],
				['Now?', 'Business\nsoftware', 'CRM, bookkeeping, cases, forms.\nStill sold in boxes.'],
			]
			const y = 560
			const x0 = 290
			const step = 340
			rect(ctx.g, x0, y - 2, step * (steps.length - 1), 4, C.cobalt400)
			steps.forEach(([year, name, sub], i) => {
				const x = x0 + i * step
				const last = i === steps.length - 1
				hex(ctx.g, x, y, last ? 44 : 32, last ? C.orange : C.cobalt200, 3)
				eyebrow(ctx.g, year, { x, y: y - 80, size: 24, fill: last ? ink : mute, anchor: 'middle' })
				textBlock(ctx.g, name, { x, y: y + 120, size: 40, weight: 700, fill: ink, anchor: 'middle', lineHeight: 1.05, tracking: -0.02, clip: false })
				textBlock(ctx.g, sub, { x, y: y + 176 + (name.includes('\n') ? 42 : 0), size: 26, weight: 500, fill: soft, anchor: 'middle', lineHeight: 1.3, maxWidth: step - 30, clip: false })
			})
		},
	}),
	board('title', 'Business software is next', {
		words: 'Not everyone writes code. But almost everyone knows exactly what software they need. Business software is next.',
		material: 'kinetic type, the title lands on "next"; the honeycomb fades up behind',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			field(ctx.g, { cx: 1560, cy: 420, r: 72, gap: 12, scale: 0.8 })
			eyebrow(ctx.g, 'Open source · business software · 2026', { y: 400 })
			headline(ctx.g, 'Business software is *next.*', ink, { y: 540, size: 140, wide: true })
			body(ctx.g, 'We have thousands of angry citizens. The only thing we need to do is empower them.', soft, { y: 660, size: 40, maxWidth: 1300 })
		},
	}),

	/* ---------------------------------------------------------------- Act 3 */
	board('section-01', '01 · A suite is not a workspace', {
		words: 'First, the distinction everything else rests on.',
		material: 'section card; the mono number counts in, the headline follows',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			bigNumber(ctx.g, '01', { x: X, y: 420, size: 260, accent: true })
			headline(ctx.g, 'A suite is not a workspace.', ink, { y: 640, size: 96, wide: true })
			body(ctx.g, 'The distinction sounds subtle. It decides who can win.', soft, { y: 760, size: 40, maxWidth: 1400 })
		},
	}),
	board('suite-vs-workspace', 'You buy a suite. You build on a workspace.', {
		words: 'A suite is a box. One vendor builds the tools and charges for the bundle. A workspace shares identity, permissions and data. The apps can come from anywhere.',
		material: 'a closed box of fixed tiles on the left; on the right cells fly into an open honeycomb, the orange one lands last',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			headline(ctx.g, 'You buy a suite. You build on a workspace.', ink, { y: 200, size: 72, wide: true })
			// The suite: a lidded box with six fixed tiles.
			eyebrow(ctx.g, 'A suite', { y: 310 })
			rect(ctx.g, X, 340, 680, 44, C.cobalt700, 6)
			rect(ctx.g, X, 384, 680, 346, C.cobalt600, 6)
			for (let i = 0; i < 6; i++) {
				const cx = X + 40 + (i % 3) * 210
				const cy = 420 + Math.floor(i / 3) * 150
				rect(ctx.g, cx, cy, 170, 120, C.cobalt400, 6)
			}
			body(ctx.g, 'A box of predetermined tools. One vendor builds and wires every one. Whatever is missing waits in their backlog.', soft, { y: 800, size: 32, maxWidth: 680 })
			// The workspace: an open honeycomb that cells fly into.
			const x0 = 1040
			eyebrow(ctx.g, 'A workspace', { x: x0, y: 310 })
			const at = honeyAt(1400, 540, 62, 12)
			hex(ctx.g, ...at(0, 0), 62, C.nextcloud, 5)
			const ring = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]
			ring.forEach(([q, r], i) => hex(ctx.g, ...at(q, r), 62, C.white, 5, { 'fill-opacity': i < 4 ? 1 : 0.25 }))
			const outer = [[2, -1], [2, -2], [1, -2], [-1, 2], [-2, 2], [-2, 1]]
			outer.forEach(([q, r], i) => hex(ctx.g, ...at(q, r), 62, C.white, 5, { 'fill-opacity': 0.12 + i * 0.03 }))
			hex(ctx.g, ...at(2, 0), 62, C.orange, 5)
			body(ctx.g, 'One identity, one permission model, one data layer. The apps can come from anywhere.', soft, { x: x0, y: 800, size: 32, maxWidth: 740 })
		},
	}),
	board('office-landscape', 'Anyone can build an office suite now', {
		words: 'Anyone can build an office suite now. Established projects, and four written with AI this month. Docs are becoming a commodity.',
		material: 'text cells only, no logos; the established cells settle first, the AI-written ones drop in last; TechRadar, Neowin, Oct 2026',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'light')
			eyebrow(ctx.g, 'Open-source office · 2026', { y: 330 })
			headline(ctx.g, 'Anyone can build\nan office suite *now.*', ink, { y: 450, size: 88 })
			body(ctx.g, 'Docs, sheets and slides are becoming a commodity. What is still missing is everything around them.', soft, { y: 700, size: 32, maxWidth: 660 })
			const at = honeyAt(1400, 570, 104, 12)
			const established = [
				[[-1, -2], 'LibreOffice'], [[0, -2], 'Apache\nOpenOffice'], [[1, -2], 'Collabora\nOnline'],
				[[-1, -1], 'OnlyOffice'], [[0, -1], 'CryptPad'], [[1, -1], 'Euro-Office'], [[2, -1], 'La Suite'],
			]
			const vibe = [[[-2, 0], 'The Craft\napps'], [[-1, 0], 'Tiny Little\nOffice'], [[0, 0], 'Starling\nOpenOffice'], [[1, 0], 'VibeOffice']]
			established.forEach(([[q, r], name]) => textCell(ctx.g, ...at(q, r), 104, name, { fill: C.cobalt, ink: C.white }))
			vibe.forEach(([[q, r], name]) => textCell(ctx.g, ...at(q, r), 104, name, { fill: C.white, ink: C.cobalt, stroke: C.cobalt200 }))
			eyebrow(ctx.g, 'Cobalt: established projects', { y: 830, size: 22, fill: C.cobalt400 })
			eyebrow(ctx.g, 'White: vibe-coded with AI, October 2026', { y: 870, size: 22, fill: C.cobalt400 })
		},
	}),
	board('workspace-landscape', 'A workspace is more than docs, mail and files', {
		words: 'A workspace is more than docs, mail and files. Germany ships one. The Netherlands pilots one. Nextcloud has an app store anyone can build on.',
		material: 'three text columns rise in turn; no logos; opendesk-edu.org, VNG and digitaleoverheid.nl, April 2026',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'white')
			eyebrow(ctx.g, 'Open-source workspaces · 2026', { y: 180 })
			headline(ctx.g, 'A workspace is *more* than docs, mail and files.', ink, { y: 290, size: 80, wide: true })
			const cols = [
				['openDesk', 'Germany · ZenDiS', 'Nextcloud files, Open-Xchange mail\nOpenProject for projects\nXWiki for knowledge\nElement chat, Jitsi video\nAn Edu edition for universities'],
				['MijnBureau', 'Netherlands · BZK', 'Combines parts of openDesk and La Suite\nRuns on Nextcloud\nPiloted in four municipalities until end 2026'],
				['Nextcloud Hub', 'Nextcloud', 'Files, Talk, mail and Office\nDeck, Tables and Flow\nAn app store anyone can build on'],
			]
			const cw = (W - 2 * X - 2 * 60) / 3
			cols.forEach(([name, origin, lines], i) => {
				const x = X + i * (cw + 60)
				rect(ctx.g, x, 400, cw, 4, C.cobalt)
				textBlock(ctx.g, name, { x, y: 480, size: 56, weight: 700, fill: ink, tracking: -0.02, clip: false })
				eyebrow(ctx.g, origin, { x, y: 530, size: 22, fill: C.cobalt400 })
				body(ctx.g, lines, soft, { x, y: 610, size: 30, maxWidth: cw })
			})
			body(ctx.g, 'Project management, a wiki, chat and data next to the office apps, each from its own community.', C.cobalt400, { y: 910, size: 30, maxWidth: 1600 })
		},
	}),
	board('gates-quote', 'A platform is when ...', {
		words: 'A platform is when the economic value of everybody that uses it exceeds the value of the company that creates it. By that test a suite is never a platform.',
		material: 'kinetic type, read slowly, one clause per beat; Stratechery, 2018',
		draw(ctx) {
			const { ink } = ground(ctx)
			textBlock(ctx.g, '“', { x: X - 10, y: 400, size: 300, weight: 500, family: MONO, fill: C.cobalt400, clip: false })
			headline(ctx.g, 'A platform is when the economic value of everybody that uses it *exceeds* the value of the company that creates it.', ink, { y: 500, size: 76, wide: true })
			eyebrow(ctx.g, 'Bill Gates, as recalled by Chamath Palihapitiya · via Ben Thompson, Stratechery, 2018', { y: 860, size: 24 })
		},
	}),
	board('open-workspace', 'The open workspace already exists', {
		words: 'This is not a plan, it runs today. Nextcloud is the ground. Office comes from several communities at once. OpenProject, XWiki and Matrix bring their own.',
		material: 'the ring fills one cell per beat, the empty cell stays open; marks from brand/assets/integrations; openDesk 1.18, August 2026',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			field(ctx.g, { cx: 1400, cy: 540, r: 112, gap: 14, scale: 0.7, skip: (q, r, d) => d < 2 })
			eyebrow(ctx.g, 'The open workspace · today', { y: 330 })
			headline(ctx.g, 'The open workspace\n*already* exists.', ink, { y: 450, size: 88 })
			body(ctx.g, 'Each app keeps its own community and roadmap. Germany\'s openDesk ships exactly this as one government workspace.', soft, { y: 700, size: 32, maxWidth: 660 })
			const at = honeyAt(1400, 540, 112, 14)
			cell(ctx.g, ...at(0, 0), 112, 'Nextcloud', { fill: C.nextcloud, size: 34 })
			markCell(ctx.g, ...at(1, -1), 112, 'openproject', 'OpenProject')
			markCell(ctx.g, ...at(1, 0), 112, 'xwiki', 'XWiki')
			markCell(ctx.g, ...at(0, 1), 112, 'matrix', 'Matrix')
			markCell(ctx.g, ...at(-1, 1), 112, 'openexchange', 'Open-Xchange', 21)
			textCell(ctx.g, ...at(-1, 0), 112, 'Office\nCollabora\nEuro-Office', { fill: C.cobalt600, size: 26 })
			hex(ctx.g, ...at(0, -1), 112, C.white, 9, { 'fill-opacity': 0.15 })
		},
	}),
	board('office-vs-business', 'Office is getting solved in the open. Business software is not.', {
		words: 'Office is the same for every organisation. One answer fits almost everyone. Business software is different in every organisation. Thousands of small apps nobody will build for you.',
		material: 'four equal cells on the left; on the right a long tail of small cells keeps growing off frame',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			headline(ctx.g, 'Office is getting solved in the open. Business software is *not.*', ink, { y: 200, size: 72, wide: true })
			eyebrow(ctx.g, 'Year one · office software', { y: 360 })
			const at = honeyAt(240, 600, 84, 12)
			;[[[0, -1], 'Documents'], [[1, -1], 'Mail'], [[0, 0], 'Calendar'], [[1, 0], 'Chat']].forEach(([[q, r], name]) => textCell(ctx.g, ...at(q, r), 84, name, { fill: C.cobalt600 }))
			body(ctx.g, 'The same for every organisation. Open alternatives exist, and governments are moving.', soft, { y: 860, size: 30, maxWidth: 640 })
			const x0 = 1000
			eyebrow(ctx.g, 'Year three · business software', { x: x0, y: 360 })
			const lead = ['CRM', 'Books', 'Cases', 'HR', 'Leave', 'Intake']
			lead.forEach((name, i) => textCell(ctx.g, x0 + 54 + i * 128, 470, 54, name, { fill: C.cobalt600, size: 24 }))
			longTail(ctx.g, x0 + 54, 590, 7)
			body(ctx.g, 'Different in every organisation. Thousands of small apps nobody will build for you.', soft, { x: x0, y: 860, size: 30, maxWidth: 760 })
		},
	}),

	/* ---------------------------------------------------------------- Act 4 */
	board('section-02', '02 · The math just changed', {
		words: 'Section two. Who builds the software from now on.',
		material: 'section card; the mono number counts in, the headline follows',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			bigNumber(ctx.g, '02', { x: X, y: 420, size: 260, accent: true })
			headline(ctx.g, 'The math just changed.', ink, { y: 640, size: 96, wide: true })
			body(ctx.g, 'Tomorrow\'s business software will not be built by product teams in Redmond. It will be built by the people who use it, with AI.', soft, { y: 760, size: 40, maxWidth: 1500 })
		},
	}),
	board('power-platform', 'Microsoft is betting on the people who use the software', {
		words: 'Power Platform went from 33 million users to 56 million in two years. Microsoft wants 500 million. The side with the most people building wins.',
		material: 'three counters climb a staircase; Microsoft earnings call April 2023, Power Platform Community Conference October 2025',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			eyebrow(ctx.g, 'The other side of the race · Power Platform', { y: 200 })
			headline(ctx.g, 'Microsoft is betting on the people\nwho use the software.', ink, { y: 310, size: 80, wide: true })
			const stairs = [
				[X, 780, 120, '33M', 'Monthly users · 2023', 'Reported on Microsoft\'s earnings call, April 2023.', false],
				[X + 540, 740, 160, '56M', 'Monthly users · 2025', 'Up from 48 million a year earlier, now with Copilot inside.', false],
				[X + 1080, 700, 200, '500M', 'The stated ambition', 'Charles Lamanna, Power Platform Community Conference, October 2025.', true],
			]
			stairs.forEach(([x, y, size, value, label, sub, accent]) => {
				bigNumber(ctx.g, value, { x, y, size, fill: ink, accent })
				eyebrow(ctx.g, label, { x, y: 840, size: 24, fill: C.cobalt200 })
				body(ctx.g, sub, soft, { x, y: 890, size: 26, maxWidth: 480 })
			})
		},
	}),
	board('buyout', 'Microsoft offered 30% of its staff money to leave', {
		words: 'This week Microsoft offered thirty percent of its staff money to leave. Their reasoning: AI builds the software now. Ours: so do your users.',
		material: 'kinetic type, a dry cut per line, the laugh lands on "so do your users"; Fortune, CNBC, 26 October 2026; a voluntary buyout, never "fired"',
		draw(ctx) {
			const { ink, soft } = ground(ctx, 'white')
			eyebrow(ctx.g, 'This week', { y: 200 })
			headline(ctx.g, 'Microsoft offered *30%* of its staff money to leave.', ink, { y: 320, size: 88, wide: true })
			strip(ctx.g, 'AI builds the software now.', { y: 560, fill: C.cobalt50, ink: C.cobalt, size: 34, h: 90, lead: 'Their reasoning' })
			strip(ctx.g, 'So do your users.', { y: 670, fill: C.cobalt, ink: C.white, size: 34, h: 90, lead: 'Ours' })
			body(ctx.g, 'They are already angry, they work for free, and none of them asked for a buyout.', soft, { y: 840, size: 32, maxWidth: 1400 })
			eyebrow(ctx.g, 'Fortune · CNBC · 26 October 2026 · a voluntary buyout offer to about 60,000 people', { y: 910, size: 22, fill: C.cobalt400 })
		},
	}),
	board('cloud-act', 'The door is closing on the fastest-moving segment', {
		words: 'Under the US CLOUD Act a US provider can be compelled to hand over data, wherever it is stored. Governments are moving. For their own workflows, the door is closing.',
		material: 'kinetic type; four dated facts step in on the right; French Senate hearing June 2025, Dutch motions March 2025, Schleswig-Holstein, the ICC',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			eyebrow(ctx.g, 'The procurement door · US CLOUD Act', { y: 240 })
			headline(ctx.g, 'The door is *closing*\non the fastest-moving\nsegment.', ink, { y: 360, size: 76 })
			body(ctx.g, 'A US provider can be compelled to hand over data, wherever it is stored. That legal risk keeps sensitive government work off US clouds.', soft, { y: 720, size: 30, maxWidth: 660 })
			const facts = [
				['June 2025', 'Microsoft France, under oath in the French Senate: it "cannot guarantee" otherwise.'],
				['March 2025', 'The Dutch parliament asked for a government cloud and an exit strategy.'],
				['October 2025', 'Schleswig-Holstein moved 40,000 mailboxes off Exchange.'],
				['2025', 'The International Criminal Court\'s prosecutor lost his Microsoft mailbox after US sanctions.'],
			]
			facts.forEach(([date, text], i) => factRow(ctx.g, 1000, 290 + i * 170, 800, date, text, ink, soft))
		},
	}),
	board('out-hire', 'Nextcloud cannot out-hire Microsoft. It doesn\'t need to.', {
		words: 'Nextcloud has around 170 people. Microsoft has 223,000. Nextcloud will never out-hire Microsoft. It doesn\'t have to. Its users can do the building.',
		material: 'counters; the two headcounts land first, the user numbers answer them; Nextcloud, March 2026',
		draw(ctx) {
			const { ink, soft } = ground(ctx)
			eyebrow(ctx.g, 'The open side', { y: 200 })
			headline(ctx.g, 'Nextcloud cannot out-hire Microsoft.\nIt doesn\'t *need* to.', ink, { y: 310, size: 88, wide: true })
			statRow(ctx.g, [
				{ value: '~170', label: 'people at Nextcloud', sub: 'the whole company' },
				{ value: '223,000', label: 'people at Microsoft', sub: 'minus whoever takes the buyout' },
				{ value: '2M+', label: 'new professional users', sub: 'added in 2025 alone (Nextcloud, March 2026)', accent: true },
				{ value: '1.2M', label: 'planned at one ministry', sub: 'French Ministry of Education, 400,000 already live' },
			], ink, { y: 640, size: 120 })
			body(ctx.g, 'The users are arriving. The question is whether they will build, or only consume.', soft, { y: 920, size: 30, maxWidth: 1400 })
		},
	}),
	board('angry-citizens', 'We have thousands of angry citizens', {
		words: 'We have thousands of angry citizens. The only thing we need to do is empower them. Yeah, I know, I already said that.',
		material: 'kinetic type, the same line as the title board, then two seconds of silence; the aside drops in small',
		draw(ctx) {
			const { ink, mute } = ground(ctx)
			field(ctx.g, { cx: 1620, cy: 300, r: 72, gap: 12, scale: 0.6 })
			textBlock(ctx.g, '“', { x: X - 10, y: 360, size: 300, weight: 500, family: MONO, fill: C.cobalt400, clip: false })
			headline(ctx.g, 'We have thousands of angry citizens. The only thing we need to do is *empower* them.', ink, { y: 470, size: 92, wide: true })
			body(ctx.g, 'Yeah, I know, I already said that.', mute, { y: 880, size: 34 })
		},
	}),
]
