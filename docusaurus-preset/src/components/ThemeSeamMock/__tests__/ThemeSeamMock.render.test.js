/**
 * ThemeSeamMock.render.test.js — renders the real <ThemeSeamMock> JSX
 * to static markup and asserts on the output.
 *
 * What matters about this mock is that both layers are the same
 * application frame and that the themed layer differs only by the
 * wrapper that redefines the tokens. A test that let the two layers
 * drift apart would be checking a screen change, not a finish change,
 * which is the opposite of the claim the component makes.
 *
 * Same esbuild-bundle-then-renderToStaticMarkup technique as
 * AppMock.render.test.js; CSS modules are stubbed with an identity
 * proxy, so class assertions read as the source class names.
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

const COMPONENT = path.resolve(__dirname, '..', 'ThemeSeamMock.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-theme-seam-test');

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

let ThemeSeamMock;

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
  ThemeSeamMock = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(ThemeSeamMock, props));
}

function frames(html) {
  return html.match(/class="frame size-\w+[^"]*"/g) || [];
}

test('renders two layers of the same app frame, plus the seam', () => {
  const html = render({app: 'openregister'});
  assert.equal(frames(html).length, 2, 'expected a stock layer and a themed layer');
  assert.match(html, /class="layer themed lasuite"/);
  assert.match(html, /class="seam"/);
  assert.doesNotMatch(html, /Unknown app/);
});

test('both layers render the identical frame, so the wipe changes finish and nothing else', () => {
  const html = render({app: 'procest'});
  /* Split on the themed wrapper: what follows must repeat what came
     before it, or the two layers are showing different screens. */
  const [stock, themed] = html.split('class="layer themed lasuite"');
  const bodyOf = (s) => (s.match(/<div class="body[^]*$/) || [''])[0].replace(/\s+/g, '');
  assert.ok(bodyOf(stock).length > 0, 'no stock layer body rendered');
  assert.equal(
    bodyOf(stock).slice(0, 400),
    bodyOf(themed).slice(0, 400),
    'the themed layer is not the same frame as the stock layer',
  );
});

test('the inner AppMocks never run their own loop, which would compete with the seam', () => {
  const html = render({app: 'openregister'});
  assert.equal(frames(html).filter((c) => c.includes('static')).length, 2);
});

test('running={false} freezes the scene on the themed end state', () => {
  assert.match(render({app: 'openregister', running: false}), /class="seamScene size-md static"/);
  assert.doesNotMatch(render({app: 'openregister'}), /seamScene size-md static/);
});

test('an unknown theme falls back to lasuite rather than rendering unthemed', () => {
  assert.match(render({app: 'openregister', theme: 'nope'}), /class="layer themed lasuite"/);
});

test('size is forwarded to both frames', () => {
  const html = render({app: 'openregister', size: 'sm'});
  assert.match(html, /class="seamScene size-sm"/);
  assert.equal(frames(html).filter((c) => c.includes('size-sm')).length, 2);
});

test('a label renders as the caption, and is absent otherwise', () => {
  assert.match(render({app: 'openregister', label: 'La Suite'}), /<figcaption class="caption">La Suite</);
  assert.doesNotMatch(render({app: 'openregister'}), /figcaption/);
});
