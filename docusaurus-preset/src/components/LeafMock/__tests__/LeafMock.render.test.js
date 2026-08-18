/**
 * LeafMock.render.test.js — SSR-renders the real <LeafMock> for each
 * of its four leaves and asserts the animation hooks and the P0
 * `running` prop plumbing (static class on the frame). Same
 * esbuild-bundle-then-renderToStaticMarkup harness as
 * KanbanMock.render.test.js; CSS modules stubbed to identity.
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

const COMPONENT = path.resolve(__dirname, '..', 'LeafMock.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-leaf-mock-test');

const LEAVES = ['contacts', 'calendar', 'mail', 'files'];

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

let LeafMock;

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
  LeafMock = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(LeafMock, props));
}

test('SSR smoke: every leaf renders a frame, none falls through to Unknown leaf', () => {
  for (const leaf of LEAVES) {
    const html = render({leaf});
    assert.match(html, /class="frame size-md"/, `${leaf}: frame missing`);
    assert.doesNotMatch(html, /Unknown leaf/, `${leaf}: fell through`);
  }
});

test('P0 plumbing: running={false} adds the static class on every leaf; default omits it', () => {
  for (const leaf of LEAVES) {
    assert.match(render({leaf, running: false}), /class="frame size-md static"/, `${leaf}: no static frame`);
    assert.doesNotMatch(render({leaf}), /\bstatic\b/, `${leaf}: static leaked into the running frame`);
  }
});

test('contacts: sync arrow and three phone rows (the staggered landing targets)', () => {
  const html = render({leaf: 'contacts'});
  assert.match(html, /class="syncArrow"/);
  assert.equal((html.match(/class="phoneRow"/g) || []).length, 3);
});

test('calendar: active day and the sliding event chip', () => {
  const html = render({leaf: 'calendar'});
  assert.match(html, /day dayActive/);
  assert.match(html, /class="eventChip"/);
});

test('mail: highlighted row carries the popping action chip', () => {
  const html = render({leaf: 'mail'});
  assert.match(html, /mailRow mailRowActive/);
  assert.match(html, /class="actionChip"/);
});

test('files: the record chip link icon carries pathLength="1" for the draw animation', () => {
  const html = render({leaf: 'files'});
  assert.match(html, /actionChip recordChip/);
  assert.match(html, /pathLength="1"/);
});
