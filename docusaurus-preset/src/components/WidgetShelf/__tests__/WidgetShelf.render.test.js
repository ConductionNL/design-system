/**
 * WidgetShelf.render.test.js — renders the real <WidgetShelf> JSX to
 * static markup (the SSR path Docusaurus takes at build time) and
 * asserts on the output: derived carousel speed, auto-generated
 * panels for widgets without an explicit `panel`, and the carousel
 * controls with their accessible names.
 *
 * Uses the same esbuild-bundle-then-renderToStaticMarkup technique as
 * AiDisclosure.render.test.js / scripts/build-kit.mjs. CSS modules
 * are stubbed with an identity proxy (styles.foo → 'foo'), so class
 * assertions read as the source class names.
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

const COMPONENT = path.resolve(__dirname, '..', 'WidgetShelf.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-widget-shelf-test');

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

let WidgetShelf;

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
  WidgetShelf = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(WidgetShelf, props));
}

function makeWidgets(n) {
  return Array.from({length: n}, (_, i) => ({
    title: `Widget number ${i}`,
    desc: `Description ${i}`,
  }));
}

test('SSR smoke: carousel renders every widget twice (live group + aria-hidden dup)', () => {
  const html = render({title: 'Shelf', widgets: makeWidgets(5)});
  assert.equal((html.match(/Widget number 3/g) || []).length, 2);
  assert.match(html, /aria-hidden="true"/);
});

test('default loop duration derives from widget count at 6s per card', () => {
  const html = render({widgets: makeWidgets(15)});
  assert.match(html, /--ws-speed:90s/);
});

test('default loop duration never drops below the 30s floor', () => {
  const html = render({widgets: makeWidgets(3)});
  assert.match(html, /--ws-speed:30s/);
});

test('an explicit speed prop overrides the derived duration', () => {
  const html = render({widgets: makeWidgets(15), speed: 45});
  assert.match(html, /--ws-speed:45s/);
});

test('a widget without a panel gets an auto-generated mini panel', () => {
  const html = render({widgets: [{title: 'Werkvoorraad', desc: 'x'}]});
  assert.match(html, /class="auto auto(Kpi|Bars|List|Donut)"/);
});

test('an explicit panel always wins over the auto panel', () => {
  const html = render({
    widgets: [{title: 'Custom', desc: 'x', panel: React.createElement('div', {className: 'w w-custom'})}],
  });
  assert.match(html, /w-custom/);
  assert.doesNotMatch(html, /class="auto /);
});

test('auto panels are deterministic: same input, same markup', () => {
  const props = {widgets: makeWidgets(8)};
  assert.equal(render(props), render(props));
});

test('auto panels vary: 8 distinct titles hit at least two archetypes and two accent families', () => {
  const html = render({widgets: makeWidgets(8)});
  const kinds = new Set(
    (html.match(/class="auto auto(Kpi|Bars|List|Donut)"/g) || []).map((m) => m),
  );
  assert.ok(kinds.size >= 2, `expected >=2 archetypes, saw ${[...kinds].join(', ')}`);
  const families = new Set(
    (html.match(/--wsa:var\(--c-([a-z]+)-500\)/g) || []).map((m) => m),
  );
  assert.ok(families.size >= 2, `expected >=2 accent families, saw ${[...families].join(', ')}`);
});

test('auto panels never use reserved accent families (coral/orange, gold)', () => {
  // 64 distinct titles sweep the family picker; the hex-family policy
  // reserves coral (KNVB orange) and gold, so neither may ever appear.
  const html = render({widgets: makeWidgets(64)});
  assert.doesNotMatch(html, /--c-coral|--c-gold|--c-orange/);
});

test('carousel renders pause/play and prev/next controls with accessible names', () => {
  const html = render({widgets: makeWidgets(4)});
  assert.match(html, /aria-label="Previous widgets"/);
  assert.match(html, /aria-label="Next widgets"/);
  assert.match(html, /aria-label="Pause"/);
  assert.match(html, /<button type="button"/);
});

test('the static grid (carousel={false}) has no controls and no duplicate group', () => {
  const html = render({widgets: makeWidgets(4), carousel: false});
  assert.doesNotMatch(html, /aria-label="Previous widgets"/);
  assert.doesNotMatch(html, /aria-label="Pause"/);
  assert.equal((html.match(/Widget number 3/g) || []).length, 1);
});
