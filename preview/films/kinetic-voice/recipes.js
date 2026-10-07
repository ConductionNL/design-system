/**
 * The three kinetic type recipes (_lib/scenes/kinetic.js) as two-bar loops, timed on the grid instead
 * of a voice. The brand kit's Film section plays them; ?r=lock | slam | hero picks one.
 *
 *   lock   "Apps that truly work together"   a word every 8th from beat 2, the line locks
 *   slam   "Install / Use / Own"             one word per line, each stopping dead on a beat, a click each
 *   hero   "Make Nextcloud your workspace"   the line locks, "workspace" flips in in orange
 *
 * 1920 x 1080, 24 fps, 128 BPM, 2 bars (90 frames). Every frame is a pure function of time.
 */
import { Film, loadFonts, textBlock } from '../_lib/stage.js'
import { C, FONTS } from '../_lib/brand.js'
import { loadBrandAssets } from '../_lib/assets.js'
import { timeline } from '../_lib/timeline.js'
import { kineticText, planKinetic } from '../_lib/scenes/kinetic.js'
import { TYPE } from '../_lib/ui.js'

const q = new URLSearchParams(location.search)
const r = ['lock', 'slam', 'hero'].includes(q.get('r')) ? q.get('r') : 'lock'
const TL = timeline({ bpm: 128, fps: 24, bars: 2, scenes: [{ id: r, from: '1.1', to: '3.1' }] })
const G = TL.grid
const SPECS = {
	lock: { recipe: 'lock', text: 'Apps that truly work together', start: G.at('1.2'), stagger: G.eighthLen, lines: [[0, 1, 2], [3, 4]] },
	slam: { recipe: 'slam', text: 'Install Use Own', start: G.at('1.2'), stagger: G.spb, size: 150 },
	hero: { recipe: 'hero', text: 'Make Nextcloud your workspace', hero: 'workspace', start: G.at('1.2'), stagger: G.eighthLen, lines: [[0, 1], [2, 3]] },
}
const spec = { x: TYPE.x, y: 470, size: 112, lineHeight: 1.07, ...SPECS[r] }
// Slam words end their rise on the onset, so the stagger is measured onset to onset: on beats 2, 3 and 4.
const plan = planKinetic(spec)
TL.captions.push({ id: r, text: plan.items.map((it) => it.display).join(' '), up: plan.items[0].t0, out: plan.out, rise: plan.lastUp - plan.items[0].t0, exit: plan.exit })

const film = new Film({ mount: document.getElementById('film'), format: '16x9', fps: 24, duration: TL.duration, bpm: 128, background: C.cobalt, safe: { top: 96, bottom: 150, left: 120, right: 120 } })
await loadFonts(FONTS)
await loadBrandAssets(film.defs)
film.scene('mark', 0, TL.duration, (ctx) => {
	textBlock(ctx.g, 'Kinetic type', { x: TYPE.x, y: TYPE.markY - 20, size: 58, weight: 700, fill: C.white, tracking: -0.02, clip: false })
	textBlock(ctx.g, `Recipe: ${r}`, { x: TYPE.x, y: TYPE.markY + 34, size: 30, weight: 500, family: 'IBM Plex Mono', fill: C.cobalt200, tracking: 0, clip: false })
})
let made
film.scene(r, 0, TL.duration, (ctx) => {
	made = kineticText(ctx.g, spec)
	return (t) => made.update(t)
})
for (const { t, kind, ...o } of made.cues) TL.cue({ s: t }, kind, o)
TL.cuesInto(film)
film.music = { bars: 2, parts: {}, loop: true }
film.board = { film: 'kinetic-recipes', meta: { title: `Kinetic type, ${r}` } }
window.__kineticRecipe = { recipe: r, plan }
TL.expose()
film.start()
