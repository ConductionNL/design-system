/**
 * FeaturedCard.visual.test.js — the `visual` prop puts a node in the
 * card's right-hand column instead of the hex thumbnail.
 *
 * The regression half matters more than the feature half: every
 * academy card and every featured post renders through this
 * component, so a card that passes no `visual` has to render exactly
 * what it rendered before, satellites and all.
 *
 * Same esbuild-bundle-then-renderToStaticMarkup technique as the
 * other render tests; CSS modules are stubbed with an identity proxy.
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

const COMPONENT = path.resolve(__dirname, '..', 'FeaturedCard.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-featured-card-test');

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

const docusaurusStub = {
  name: 'docusaurus-stub',
  setup(b) {
    b.onResolve({filter: /^@docusaurus\/Translate$/}, () => ({path: 'docusaurus-translate', namespace: 'docusaurus-stub'}));
    b.onLoad({filter: /^docusaurus-translate$/, namespace: 'docusaurus-stub'}, () => ({
      contents: `import React from 'react';
        export function translate(o, v) {
          return String(o.message).replace(/\\{(\\w+)\\}/g, (_, k) => (v && v[k] !== undefined ? v[k] : ''));
        }
        export default function Translate({children}) { return React.createElement(React.Fragment, null, children); }`,
      loader: 'jsx',
    }));
  },
};

let FeaturedCard;

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
    plugins: [cssModuleStub, docusaurusStub],
    logLevel: 'warning',
  });
  delete require.cache[require.resolve(outFile)];
  FeaturedCard = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

const BASE = {title: 'La Frankendesk', lede: 'One finish, mixed parts.', href: '/academy/x'};

function render(props) {
  return renderToStaticMarkup(React.createElement(FeaturedCard, {...BASE, ...props}));
}

const marker = React.createElement('div', {'data-visual': 'seam'}, 'scene');

test('without a visual the card renders the hex thumbnail and its satellites, as before', () => {
  const html = render({thumbnail: {icon: React.createElement('svg', null), tone: 'cobalt'}});
  assert.match(html, /thumb/, 'no hex thumbnail rendered');
  assert.equal((html.match(/satellite/g) || []).length > 0, true, 'satellites missing');
  assert.doesNotMatch(html, /visualNode/);
});

test('a visual takes the column and stands the satellites down', () => {
  const html = render({visual: marker});
  assert.match(html, /data-visual="seam"/, 'the passed node did not render');
  assert.match(html, /visualNode/);
  assert.doesNotMatch(html, /satellite/, 'satellites still frame a node that is not a hex');
  assert.doesNotMatch(html, /thumb/, 'the hex thumbnail rendered alongside the visual');
});

test('the copy column is untouched by the visual', () => {
  const html = render({visual: marker, eyebrow: 'blog', durationMinutes: 20});
  assert.match(html, /La Frankendesk/);
  assert.match(html, /One finish, mixed parts\./);
  assert.match(html, /20 min read/);
});
