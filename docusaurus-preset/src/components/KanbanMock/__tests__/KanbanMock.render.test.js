/**
 * KanbanMock.render.test.js — renders the real <KanbanMock> JSX to
 * static markup (the SSR path Docusaurus takes at build time) and
 * asserts on the output: the KPI row above the lanes with its
 * before/after € values, the column counts, and the static mode.
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

const COMPONENT = path.resolve(__dirname, '..', 'KanbanMock.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-kanban-mock-test');

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

let KanbanMock;

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
  KanbanMock = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(KanbanMock, props));
}

test('SSR smoke: renders the board with three lanes and the travelling card', () => {
  const html = render({});
  assert.equal((html.match(/class="col"/g) || []).length, 3);
  assert.match(html, /class="mover"/);
});

test('KPI row: one € tile per lane, before/after values on the two lanes the deal moves between', () => {
  const html = render({});
  assert.match(html, /class="kpis"/);
  assert.equal((html.match(/class="kpi"/g) || []).length, 3);
  // Source lane loses the €18k deal, target lane gains it.
  assert.match(html, /class="countBefore">€ 48k</);
  assert.match(html, /class="countAfter">€ 30k</);
  assert.match(html, /class="countBefore">€ 27k</);
  assert.match(html, /class="countAfter">€ 45k</);
  // Third lane never changes: a still value, no crossfade spans.
  assert.match(html, /class="kpiStill">€ 64k</);
});

test('KPI arithmetic: the moved deal value leaving lane 1 equals the value entering lane 2', () => {
  const html = render({});
  const nums = [...html.matchAll(/class="count(Before|After)">€ (\d+)k</g)].map((m) => Number(m[2]));
  assert.equal(nums.length, 4, 'expected two crossfading € tiles (2 values each)');
  // Order in markup: lane1 before, lane1 after, lane2 before, lane2 after.
  const [l1From, l1To, l2From, l2To] = nums;
  assert.equal(l1From - l1To, l2To - l2From, 'the deal value must shift lanes, not appear or vanish');
  assert.ok(l1From - l1To > 0, 'source lane must decrement');
});

test('column counts: source lane 3→2, target lane 2→3, third lane static 4', () => {
  const html = render({});
  assert.match(html, /class="count"><span class="countBefore">3<\/span><span class="countAfter">2<\/span>/);
  assert.match(html, /class="count"><span class="countBefore">2<\/span><span class="countAfter">3<\/span>/);
  assert.match(html, /class="countStatic">4</);
});

test('aria-label names the counts and lane totals updating at the drop', () => {
  const html = render({});
  assert.match(html, /aria-label="[^"]*column counts and the lane value totals update at the drop[^"]*"/);
});

test('running={false} renders the static frame class', () => {
  const html = render({running: false});
  assert.match(html, /class="frame size-md static"/);
});
