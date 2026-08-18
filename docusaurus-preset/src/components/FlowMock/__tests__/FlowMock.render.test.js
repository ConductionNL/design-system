/**
 * FlowMock.render.test.js — SSR-renders the real <FlowMock> and
 * asserts the canvas structure the approval-hold animation relies on:
 * the run-line with pathLength="1", the four halo rects (halo-2 being
 * the approval flash), and the `running` prop's static class. Same
 * esbuild harness as KanbanMock.render.test.js; CSS modules stubbed
 * to identity.
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

const COMPONENT = path.resolve(__dirname, '..', 'FlowMock.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-flow-mock-test');

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

let FlowMock;

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
  FlowMock = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(FlowMock, props));
}

test('SSR smoke: renders the canvas with the run-line on pathLength="1"', () => {
  const html = render({});
  assert.match(html, /class="canvas"/);
  assert.match(html, /class="runline"[^>]*pathLength="1"/);
});

test('halos: four pulse rects, halo-2 (the approval hold flash) among them', () => {
  const html = render({});
  for (const i of [0, 1, 2, 3]) {
    assert.match(html, new RegExp(`halo halo-${i}`), `missing halo-${i}`);
  }
});

test('running={false} renders the static frame class', () => {
  assert.match(render({running: false}), /class="frame size-md static"/);
  assert.doesNotMatch(render({}), /\bstatic\b/);
});
