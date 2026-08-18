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

test('reserved accent families: no variant inline-styles coral or gold', () => {
  // SKILL.md reserves the coral and gold families; the one-orange rule
  // is enforced per component by review, but coral/gold must never
  // appear at all. Class-based colours live in the stylesheet; this
  // guards the inline styles the variants set directly.
  for (const app of SLUGS) {
    assert.doesNotMatch(render({app}), /--c-coral|--c-gold/, `${app}: reserved family in inline style`);
  }
});
