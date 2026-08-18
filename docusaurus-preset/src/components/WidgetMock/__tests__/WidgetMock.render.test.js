/**
 * WidgetMock.render.test.js — renders the real <WidgetMock> JSX to
 * static markup (the SSR path Docusaurus takes at build time) and
 * asserts on the output: every kind renders, the wave-5 `running`
 * plumbing puts `.static` on the frame, the ten list-shaped variants
 * carry the shared list-refresh scope (`.wmLive`) + unread badge,
 * the non-list variants opt out, and the anonymise dropzone exposes
 * its marching-ants + file-drop hooks.
 *
 * Uses the same esbuild-bundle-then-renderToStaticMarkup technique
 * as AppMock.render.test.js. CSS modules are stubbed with an identity
 * proxy (styles.foo → 'foo').
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

const COMPONENT = path.resolve(__dirname, '..', 'WidgetMock.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-widget-mock-test');

/* Must stay in sync with the VARIANTS map in WidgetMock.jsx. */
const LIST_KINDS = [
  'docudesk-pending-sign', 'procest-werkvoorraad', 'procest-due-today',
  'opencatalogi-publications', 'openconnector-runs', 'decidesk-actions',
  'pipelinq-deals', 'nextcloud-mail', 'nextcloud-files', 'nextcloud-rss',
];
const NON_LIST_KINDS = [
  'docudesk-anonymise', 'openregister-activity', 'nextcloud-calendar',
  'nextcloud-decks',
];
const KINDS = [...LIST_KINDS, ...NON_LIST_KINDS];

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

let WidgetMock;

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
  WidgetMock = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(WidgetMock, props));
}

test('SSR smoke: every kind renders a frame, none falls through to Unknown widget', () => {
  for (const kind of KINDS) {
    const html = render({kind});
    assert.match(html, /wmFrame/, `${kind}: frame missing`);
    assert.doesNotMatch(html, /Unknown widget/, `${kind}: fell through to the unknown branch`);
  }
});

test('running={false} adds the static class to the frame; default omits it', () => {
  for (const kind of KINDS) {
    assert.match(render({kind, running: false}), /wmFrame[^"]*static/, `${kind}: no static frame`);
    assert.doesNotMatch(render({kind}), /\bstatic\b/, `${kind}: static leaked into a running frame`);
  }
});

test('the ten list variants carry the wmLive refresh scope and the unread badge', () => {
  for (const kind of LIST_KINDS) {
    const html = render({kind});
    assert.match(html, /wmFrame[^"]*wmLive/, `${kind}: missing wmLive scope`);
    assert.match(html, /class="wmBadge"/, `${kind}: missing unread badge`);
    assert.match(html, /class="list"/, `${kind}: wmLive on a variant without a .list`);
  }
});

test('non-list variants opt out of the refresh primitive', () => {
  for (const kind of NON_LIST_KINDS) {
    const html = render({kind});
    assert.doesNotMatch(html, /wmLive/, `${kind}: wmLive on a non-list variant`);
    assert.doesNotMatch(html, /wmBadge/, `${kind}: badge on a non-list variant`);
  }
});

test('docudesk-anonymise: the dropzone carries the zoneLive scope and the dropping file hex', () => {
  const html = render({kind: 'docudesk-anonymise'});
  assert.match(html, /w w-upload zoneLive/);
  assert.match(html, /class="zoneFile"/);
  assert.match(html, /class="zone"/);
});

test('caption renders the variant label', () => {
  assert.match(render({kind: 'procest-werkvoorraad', caption: true}), /Procest · Werkvoorraad/);
});
