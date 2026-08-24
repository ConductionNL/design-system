/**
 * MockScene.render.test.js — SSR-renders the real <MockScene> and
 * asserts the landing-stagger wiring: inline left/top positioning is
 * preserved untouched (the animation is transform-only), each item
 * carries its 220ms-stagger animation-delay, the loop period --ms-dur
 * derives from the item count, and running={false} puts the static
 * class on the scene frame. Same esbuild harness as
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

const COMPONENT = path.resolve(__dirname, '..', 'MockScene.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-mock-scene-test');

const ITEMS = [
  {type: 'widget', kind: 'nextcloud-mail', x: 0, y: 0, size: 'sm'},
  {type: 'sidebar', kind: 'openregister-metadata', x: 220, y: 30, size: 'md'},
  {type: 'widget', kind: 'openregister-activity', x: 540, y: 80, size: 'md'},
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

let MockScene;

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
  MockScene = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(MockScene, props));
}

test('SSR smoke: renders the scene frame with one wrapper per item', () => {
  const html = render({items: ITEMS});
  assert.match(html, /class="sceneFrame"/);
  assert.equal((html.match(/class="sceneItem"/g) || []).length, ITEMS.length);
});

test('positioning: inline left/top from item x/y are preserved (animation is transform-only)', () => {
  const html = render({items: ITEMS});
  assert.match(html, /left:220px;top:30px/);
  assert.match(html, /left:540px;top:80px/);
});

test('landing stagger: each item carries its 220ms-step animation-delay', () => {
  const html = render({items: ITEMS});
  for (let i = 0; i < ITEMS.length; i++) {
    assert.match(html, new RegExp(`animation-delay:${i * 220}ms`), `item ${i}: missing delay`);
  }
});

test('loop period: --ms-dur on the frame derives from the item count (+ hold)', () => {
  const html = render({items: ITEMS});
  assert.match(html, new RegExp(`--ms-dur:${ITEMS.length * 220 + 5600}ms`));
});

test('P0 plumbing: running={false} adds the static class to the scene frame; default omits it', () => {
  assert.match(render({items: ITEMS, running: false}), /class="sceneFrame static"/);
  assert.doesNotMatch(render({items: ITEMS}), /sceneFrame static/);
});
