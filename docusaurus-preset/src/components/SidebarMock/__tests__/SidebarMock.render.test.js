/**
 * SidebarMock.render.test.js — renders the real <SidebarMock> JSX to
 * static markup and asserts on the wave-5 animation plumbing: the
 * panel carries the `.sbLive` scope, `running={false}` puts `.static`
 * on the panel itself (both standalone and embedded), and the
 * travelling active-tab underline is present with the `--sb-ix` /
 * `--sb-n` / `--sb-from` custom properties derived from the
 * variant's active tab index.
 *
 * Same esbuild-bundle-then-renderToStaticMarkup technique as
 * AppMock.render.test.js; CSS modules stubbed with an identity proxy.
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

const COMPONENT = path.resolve(__dirname, '..', 'SidebarMock.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-sidebar-mock-test');

/* Must stay in sync with the VARIANTS map in SidebarMock.jsx.
   activeIx mirrors each variant's active-tab index. */
const KINDS = {
  'procest-xwiki': 1,
  'procest-timeline': 2,
  'docudesk-signatures': 1,
  'docudesk-pii-map': 2,
  'openregister-metadata': 1,
  'opencatalogi-publication-history': 1,
  'openconnector-run-detail': 1,
  'decidesk-decision': 1,
  'nextcloud-activity': 0,
};

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

let SidebarMock;

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
  SidebarMock = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(SidebarMock, props));
}

test('SSR smoke: every kind renders the live panel, none falls through to Unknown sidebar', () => {
  for (const kind of Object.keys(KINDS)) {
    const html = render({kind});
    assert.match(html, /detail rich sbLive/, `${kind}: missing sbLive panel scope`);
    assert.doesNotMatch(html, /Unknown sidebar/, `${kind}: fell through to the unknown branch`);
  }
});

test('running={false} puts static on the panel — standalone and embedded', () => {
  assert.match(render({kind: 'procest-xwiki', running: false}), /detail rich sbLive static/);
  assert.match(render({kind: 'procest-xwiki', running: false, embedded: true}), /detail rich sbLive static/);
  assert.doesNotMatch(render({kind: 'procest-xwiki'}), /\bstatic\b/);
});

test('the travelling underline carries --sb-ix / --sb-n / --sb-from per variant', () => {
  for (const [kind, ix] of Object.entries(KINDS)) {
    const html = render({kind});
    assert.match(html, /class="sb-underline"/, `${kind}: underline missing`);
    assert.match(html, new RegExp(`--sb-ix:${ix}[;"]`), `${kind}: wrong active index`);
    assert.match(html, /--sb-n:[0-9]/, `${kind}: tab count missing`);
    const from = ix > 0 ? '-100%' : '100%';
    assert.match(html, new RegExp(`--sb-from:${from}`), `${kind}: wrong travel origin`);
  }
});

test('embedded mode drops the standalone frame but keeps the live panel', () => {
  const html = render({kind: 'openregister-metadata', embedded: true});
  assert.doesNotMatch(html, /smFrame/);
  assert.match(html, /detail rich sbLive/);
  assert.match(html, /class="sb-underline"/);
});
