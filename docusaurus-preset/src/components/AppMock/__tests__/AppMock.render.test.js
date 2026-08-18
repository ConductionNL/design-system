/**
 * AppMock.render.test.js — renders the real <AppMock> JSX to static
 * markup (the SSR path Docusaurus takes at build time) and asserts on
 * the output: every variant slug renders, the P0 `running` prop
 * plumbing puts `.static` on the frame, the animated variants expose
 * their animation hooks, the `openwoo` slug aliases to the
 * OpenCatalogi mock, and no rendered inline style reaches for the
 * reserved coral/gold families.
 *
 * Uses the same esbuild-bundle-then-renderToStaticMarkup technique as
 * KanbanMock.render.test.js. CSS modules are stubbed with an identity
 * proxy (styles.foo → 'foo'), so class assertions read as the source
 * class names.
 */

'use strict';

const test = require('node:test');
const {before, after} = test;
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {build} = require('esbuild');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const COMPONENT = path.resolve(__dirname, '..', 'AppMock.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-app-mock-test');

/* Must stay in sync with the VARIANTS map in AppMock.jsx. */
const SLUGS = [
  'launchpad', 'launchpad-tiles', 'launchpad-bi', 'launchpad-widgets',
  'openbuild', 'opencatalogi', 'openconnector', 'openregister',
  'procest', 'decidesk', 'docudesk', 'larpingapp', 'nldesign',
  'openwoo', 'pipelinq', 'softwarecatalog', 'zaakafhandelapp',
  'hermiq', 'portaliq', 'scholiq', 'shillinq', 'doriath', 'planix',
  'hrmq', 'app-versions',
];

const cssModuleStub = {
  name: 'css-module-stub',
  setup(b) {
    b.onResolve({filter: /\.module\.css$/}, (args) => ({path: args.path, namespace: 'css-stub'}));
    b.onLoad({filter: /.*/, namespace: 'css-stub'}, () => ({
      contents: 'export default new Proxy({}, {get: (_, p) => p});',
      loader: 'js',
    }));
  },
};

let AppMock;

before(async () => {
  await fs.mkdir(SCRATCH, {recursive: true});
  const tmpDir = await fs.mkdtemp(path.join(SCRATCH, 'run-'));
  const outFile = path.join(tmpDir, 'bundle.cjs');
  await build({
    entryPoints: [COMPONENT],
    outfile: outFile,
    bundle: true,
    format: 'cjs',
    jsx: 'automatic',
    jsxImportSource: 'react',
    tsconfigRaw: {compilerOptions: {jsx: 'react-jsx', jsxImportSource: 'react'}},
    platform: 'node',
    external: ['react'],
    plugins: [cssModuleStub],
    logLevel: 'warning',
  });
  delete require.cache[require.resolve(outFile)];
  AppMock = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(AppMock, props));
}

test('SSR smoke: every variant slug renders a frame, none falls through to Unknown app', () => {
  for (const app of SLUGS) {
    const html = render({app});
    assert.match(html, /class="frame size-md"/, `${app}: frame missing`);
    assert.doesNotMatch(html, /Unknown app/, `${app}: fell through to the unknown-variant branch`);
  }
});

test('P0 plumbing: running={false} adds the static class to the frame; default omits it', () => {
  assert.match(render({app: 'portaliq', running: false}), /class="frame size-md static"/);
  assert.doesNotMatch(render({app: 'portaliq'}), /\bstatic\b/);
});

test('P0 plumbing: static frame works on every variant slug', () => {
  for (const app of SLUGS) {
    assert.match(render({app, running: false}), /class="frame size-md static"/, `${app}: no static frame`);
  }
});

test('openwoo slug is an alias for the OpenCatalogi mock', () => {
  const openwoo = render({app: 'openwoo'});
  const opencatalogi = render({app: 'opencatalogi'});
  assert.equal(openwoo, opencatalogi);
  assert.equal(
    render({app: 'openwoo', caption: true}).match(/<figcaption[^>]*>([^<]*)</)[1],
    'OpenCatalogi'
  );
});

test('portaliq: form fields, fills, submit, confirm sweep, and the arriving inbox row are all present', () => {
  const html = render({app: 'portaliq'});
  assert.match(html, /class="body decidesk portaliq"/);
  assert.match(html, /field field-1/);
  assert.match(html, /field field-2/);
  assert.match(html, /field field-3 tall/);
  assert.equal((html.match(/class="fieldFill"/g) || []).length, 3);
  assert.match(html, /btn submit/);
  assert.match(html, /class="confirmSweep"/);
  assert.match(html, /item newItem/);
});

test('scholiq: staggered progress fills (inline delays) and the credential chip', () => {
  const html = render({app: 'scholiq'});
  assert.equal((html.match(/class="progressFill"/g) || []).length, 6);
  for (const d of [0, 250, 500, 750, 1000, 1250]) {
    assert.match(html, new RegExp(`animation-delay:${d}ms`), `missing ${d}ms bar delay`);
  }
  assert.match(html, /class="credChip"/);
});

test('launchpad-widgets: seven widgets arrive on a 900ms stagger', () => {
  const html = render({app: 'launchpad-widgets'});
  assert.match(html, /class="body launchpad lpWidgets"/);
  for (const d of [0, 900, 1800, 2700, 3600, 4500, 5400]) {
    assert.match(html, new RegExp(`animation-delay:${d}ms`), `missing ${d}ms widget delay`);
  }
});

test('launchpad-bi: the line chart stroke carries pathLength="1" for the draw animation', () => {
  const html = render({app: 'launchpad-bi'});
  assert.match(html, /class="body launchpad lpBi"/);
  assert.match(html, /class="stroke" pathLength="1"/);
  assert.equal((html.match(/class="biDelta"/g) || []).length, 3);
});

test('pipelinq: the closing deal (dealGone) and the won card (dealWon) are both in the board', () => {
  const html = render({app: 'pipelinq'});
  assert.match(html, /class="body decidesk plq"/);
  assert.match(html, /card dealGone/);
  assert.match(html, /card dealWon/);
});

test('nldesign: selected swatch, type row, and the actions wrapper around the preview buttons', () => {
  const html = render({app: 'nldesign'});
  assert.match(html, /class="body openregister nldesign"/);
  assert.equal((html.match(/class="swatch(?: |")/g) || []).length, 8);
  assert.match(html, /swatch swatchSel/);
  assert.match(html, /class="typeRow"/);
  // The preview buttons need the .actions parent to be styled at all.
  assert.match(html, /class="actions"[^>]*><div class="btn"><\/div><div class="btn ghost">/);
});

test('larpingapp: the scene timeline renders five steps (was an empty shell)', () => {
  const html = render({app: 'larpingapp'});
  assert.match(html, /class="procest"/);
  assert.match(html, /class="timeline"/);
  assert.equal((html.match(/class="step[ "]/g) || []).length, 5);
  assert.equal((html.match(/step now/g) || []).length, 1, 'exactly one active (orange) step');
});

/* ---- Wave 2 — storytelling animation hooks ---- */

test('docudesk: word-level rows with five ordered PII marks, and the live drop-zone', () => {
  const html = render({app: 'docudesk'});
  assert.match(html, /class="body opencatalogi docudesk"/);
  assert.equal((html.match(/class="words"/g) || []).length, 5, 'five word-bar rows');
  for (const n of [1, 2, 3, 4, 5]) {
    assert.match(html, new RegExp(`word mark mark-${n}`), `mark-${n} missing`);
  }
  assert.match(html, /w w-upload zoneLive/);
  assert.match(html, /class="zoneFile"/);
});

test('shillinq: bank line, reconciling row 3, ledger totals, and the KPI grow hook', () => {
  const html = render({app: 'shillinq'});
  assert.match(html, /class="body decidesk shillinq"/);
  assert.match(html, /class="bankLine"/);
  assert.equal((html.match(/item inv/g) || []).length, 5, 'five invoice rows');
  assert.equal((html.match(/item inv reconciling/g) || []).length, 1, 'exactly one reconciling row');
  // The reconciling row is row 3: two plain rows precede it.
  assert.match(html, /item inv"[\s\S]*?item inv"[\s\S]*?item inv reconciling/);
  assert.equal((html.match(/tick open/g) || []).length, 1, 'one still-open tick (row 5)');
  assert.match(html, /class="totNet"/);
  assert.match(html, /kpi kpiGrow/);
});

test('doriath: key hex, both mask layers, value, and the countdown hairline', () => {
  const html = render({app: 'doriath'});
  assert.match(html, /class="body decidesk doriath"/);
  assert.match(html, /class="keyHex"/);
  assert.match(html, /class="vMask"/);
  assert.match(html, /class="vValue"/);
  assert.match(html, /class="vCountdown"/);
  assert.equal((html.match(/class="maskDots"/g) || []).length, 5, 'five locked list entries keep their dot masks');
});

test('opencatalogi: search bar with query fill; three matches and three dimmed cards', () => {
  const html = render({app: 'opencatalogi'});
  assert.match(html, /class="search"/);
  assert.match(html, /class="q"/);
  assert.equal((html.match(/class="card[^"]*match"/g) || []).length, 3, 'three matching cards');
  assert.equal((html.match(/class="card[^"]*dim"/g) || []).length, 3, 'three dimmed cards');
});

test('openconnector: two travel dots on the arrows and the inserted run row with mint tick', () => {
  const html = render({app: 'openconnector'});
  assert.match(html, /class="travelDotA"/);
  assert.match(html, /class="travelDotB"/);
  assert.match(html, /item newRun/);
  assert.match(html, /class="runTick"/);
});

test('procest: advanced base state (2 done, 1 now), two ghost overlays, and the re-sort pair', () => {
  const html = render({app: 'procest'});
  assert.match(html, /class="step"/, 'first step done');
  assert.match(html, /step advanceFrom/, 'second step advanced out of active');
  assert.match(html, /step now advanceTo/, 'third step is the newly active one');
  assert.equal((html.match(/step now/g) || []).length, 1, 'one active step');
  assert.equal((html.match(/step todo/g) || []).length, 2, 'two to-do steps');
  assert.match(html, /ghost ghostNow/);
  assert.match(html, /ghost ghostTodo/);
  assert.match(html, /item sortUp/);
  assert.match(html, /item sortDown/);
});

test('openregister: the landing object row and the KPI grow hook', () => {
  const html = render({app: 'openregister'});
  assert.match(html, /item newObj/);
  assert.match(html, /kpi kpiGrow/);
});

/* ---- Wave 4 — content reworks ---- */

test('decidesk: vote tally (for/against/abstain + quorum) and the adopt-flip decision row', () => {
  const html = render({app: 'decidesk'});
  assert.equal((html.match(/class="tallyRow /g) || []).length, 3, 'three tally rows');
  assert.match(html, /tallyRow for/);
  assert.match(html, /tallyRow against/);
  assert.match(html, /tallyRow abstain/);
  assert.equal((html.match(/class="quorum"/g) || []).length, 1, 'quorum line on the for-track only');
  assert.match(html, /item decisionRow/);
  assert.match(html, /statusPill adoptFlip/);
});

test('hrmq: reworked to a timesheet + approval surface (no people-list panels left)', () => {
  const html = render({app: 'hrmq'});
  assert.match(html, /class="body decidesk hrmq"/);
  assert.equal((html.match(/class="dayCol"/g) || []).length, 5, 'five day columns');
  assert.equal((html.match(/class="dayBar"/g) || []).length, 5, 'five hour bars');
  assert.match(html, /btn submitBtn/);
  assert.match(html, /item approveRow/);
  assert.match(html, /class="approvePip"/);
  assert.match(html, /class="payroll"/);
  assert.match(html, /class="pNum"/);
});

test('larpingapp: XP ripple — lifted source card, travelling token, timeline intact', () => {
  const html = render({app: 'larpingapp'});
  assert.match(html, /class="body opencatalogi larping"/);
  assert.match(html, /card b xpSource/);
  assert.match(html, /class="xpToken"/);
  assert.equal((html.match(/step now/g) || []).length, 1);
});

test('softwarecatalog: scan band, CVE-hit row 4, and the vermillion CVE bar (orange accent bar intact)', () => {
  const html = render({app: 'softwarecatalog'});
  assert.match(html, /class="body openregister swc"/);
  assert.match(html, /class="scanBand"/);
  assert.match(html, /item blocked cveHit/);
  assert.match(html, /bar cve/);
  assert.equal((html.match(/bar accent/g) || []).length, 1, 'exactly one orange accent bar');
});

test('zaakafhandelapp: travelling submission ghost and the dressed new case row', () => {
  const html = render({app: 'zaakafhandelapp'});
  assert.match(html, /class="body procest zaak"/);
  assert.match(html, /class="zkGhost"/);
  assert.match(html, /item zkNew/);
  assert.match(html, /item zkSent/);
  assert.equal((html.match(/item late/g) || []).length, 1, 'the SLA-late row survives the rework');
});

test('hermiq: inline styles moved to the module — bubbles, typing indicator, chips, approval', () => {
  const html = render({app: 'hermiq'});
  assert.match(html, /class="body decidesk hermiq"/);
  assert.equal((html.match(/bubble user/g) || []).length, 2, 'two user bubbles');
  assert.equal((html.match(/bubble agent/g) || []).length, 2, 'two agent bubbles');
  assert.match(html, /class="typing"/);
  assert.equal((html.match(/class="tDot"/g) || []).length, 3, 'three typing dots');
  assert.match(html, /statusPill chip1/);
  assert.match(html, /chip chip2/);
  assert.match(html, /chip chip3/);
  assert.match(html, /statusPill approveChip/);
  assert.match(html, /class="promptField"/);
  assert.match(html, /btn sendBtn/);
  // The wave-4 requirement: presentation no longer rides inline styles.
  assert.doesNotMatch(html, /style="[^"]*(background|border-radius|align-self)/, 'presentation styles must live in the module');
});

test('openbuild: template highlight, travelling ghost chip, landing app row, publish pulse', () => {
  const html = render({app: 'openbuild'});
  assert.match(html, /item tplSource/);
  assert.match(html, /class="buildGhost"/);
  assert.match(html, /item newApp/);
  assert.match(html, /kpi kpiGrow/);
  assert.match(html, /kpi forest publishedKpi/);
});

test('reserved accent families: no variant inline-styles coral or gold', () => {
  // SKILL.md reserves the coral and gold families; the one-orange rule
  // is enforced per component by review, but coral/gold must never
  // appear at all. Class-based colours live in the stylesheet; this
  // guards the inline styles the variants set directly.
  for (const app of SLUGS) {
    assert.doesNotMatch(render({app}), /--c-coral|--c-gold/, `${app}: reserved family in inline style`);
  }
});
