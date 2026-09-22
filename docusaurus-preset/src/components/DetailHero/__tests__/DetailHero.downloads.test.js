/**
 * DetailHero.downloads.test.js — the per-app download counter only
 * appears once an app has real traction.
 *
 * A freshly published app sits on a handful of downloads for weeks,
 * and "5 downloads" beside the title argues against the app it is
 * meant to recommend. The counter is therefore gated on
 * MIN_DISPLAYED_DOWNLOADS, and the gate covers the schema.org
 * InteractionCounter as well: a number the page hides must not reach
 * search results through the structured data.
 *
 * Renders the real <DetailHero> JSX to static markup with the same
 * esbuild-bundle-then-renderToStaticMarkup technique the other render
 * tests use (AppMock, AiDisclosure). Docusaurus-only modules are
 * stubbed, since this runs outside a Docusaurus build.
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

const {MIN_DISPLAYED_DOWNLOADS} = require('../../../data/app-downloads.js');

const COMPONENT = path.resolve(__dirname, '..', 'DetailHero.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-detail-hero-test');

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

/* <Head> renders its children inline here, which is what lets the test
   read the JSON-LD out of the same markup string. */
const docusaurusStub = {
  name: 'docusaurus-stub',
  setup(b) {
    b.onResolve({filter: /^@docusaurus\/Head$/}, () => ({path: 'docusaurus-head', namespace: 'docusaurus-stub'}));
    b.onResolve({filter: /^@docusaurus\/useDocusaurusContext$/}, () => ({path: 'docusaurus-context', namespace: 'docusaurus-stub'}));
    b.onResolve({filter: /^@docusaurus\/Link$/}, () => ({path: 'docusaurus-link', namespace: 'docusaurus-stub'}));
    b.onResolve({filter: /^@docusaurus\/useBaseUrl$/}, () => ({path: 'docusaurus-base-url', namespace: 'docusaurus-stub'}));
    b.onResolve({filter: /^@docusaurus\/Translate$/}, () => ({path: 'docusaurus-translate', namespace: 'docusaurus-stub'}));
    b.onLoad({filter: /^docusaurus-head$/, namespace: 'docusaurus-stub'}, () => ({
      contents: `import React from 'react';
        export default function Head({children}) { return React.createElement(React.Fragment, null, children); }`,
      loader: 'jsx',
    }));
    b.onLoad({filter: /^docusaurus-context$/, namespace: 'docusaurus-stub'}, () => ({
      contents: `export default function useDocusaurusContext() {
        return {i18n: {currentLocale: 'en'}, siteConfig: {url: 'https://conduction.nl', baseUrl: '/'}};
      }`,
      loader: 'js',
    }));
    b.onLoad({filter: /^docusaurus-link$/, namespace: 'docusaurus-stub'}, () => ({
      contents: `import React from 'react';
        export default function Link({to, href, children, ...rest}) {
          return React.createElement('a', {href: to || href, ...rest}, children);
        }`,
      loader: 'jsx',
    }));
    b.onLoad({filter: /^docusaurus-base-url$/, namespace: 'docusaurus-stub'}, () => ({
      contents: `export default function useBaseUrl(p) { return p; }`,
      loader: 'js',
    }));
    b.onLoad({filter: /^docusaurus-translate$/, namespace: 'docusaurus-stub'}, () => ({
      contents: `import React from 'react';
        export function translate(o, v) { return o.message; }
        export default function Translate({children}) { return React.createElement(React.Fragment, null, children); }`,
      loader: 'jsx',
    }));
  },
};

let DetailHero;

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
  DetailHero = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(
    React.createElement(DetailHero, {title: 'Buildiq', appId: 'openbuild', ...props}),
  );
}

/* The counter and the "View on GitHub" chip share the downloadsBadge
   class, so the counter is identified by its own data attribute and by
   the word it prints. Asserting on the shared class would fail on a
   page that correctly shows only the GitHub chip. */
test('a count under the threshold renders no counter at all', () => {
  const html = render({downloads: MIN_DISPLAYED_DOWNLOADS - 1});
  assert.doesNotMatch(html, /downloads</, 'the counter text is on the page');
  assert.doesNotMatch(html, /data-app-downloads/, 'the counter element is on the page');
  assert.match(html, /View on GitHub/, 'the GitHub chip went down with the counter');
});

test('zero downloads renders no counter', () => {
  assert.doesNotMatch(render({downloads: 0}), /data-app-downloads/);
});

test('a count on the threshold renders the counter, formatted', () => {
  const html = render({downloads: MIN_DISPLAYED_DOWNLOADS});
  assert.match(html, /1,000 downloads/);
  assert.match(html, /data-app-downloads/);
});

test('a large count keeps rendering', () => {
  assert.match(render({downloads: 9079}), /9,079 downloads/);
});

/**
 * Pull the SoftwareApplication JSON-LD out of the rendered markup and parse it.
 *
 * The raw string cannot be matched with a regex containing quotes. This test
 * stubs <Head> as a passthrough fragment, so React renders the JSON as a text
 * child of <script> and `renderToStaticMarkup` escapes every quote to &quot;.
 * That is an artefact of the stub, not of the product: on the real site
 * Docusaurus's Head puts the JSON through Helmet and the published markup is
 * valid, verified against /apps/openregister/ on 2026-09-22.
 *
 * Asserting on the parsed object rather than on the serialised text keeps the
 * test about what is published, and survives whatever the harness does to the
 * quotes.
 */
function softwareApplicationLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [, raw] of blocks) {
    const decoded = raw
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    const parsed = JSON.parse(decoded);
    if (parsed['@type'] === 'SoftwareApplication') return parsed;
  }
  return null;
}

test('the structured data follows the chip, so a hidden number is not published', () => {
  const low = render({downloads: MIN_DISPLAYED_DOWNLOADS - 1});
  assert.doesNotMatch(low, /InteractionCounter/, 'JSON-LD advertises a count the page hides');

  const high = render({downloads: MIN_DISPLAYED_DOWNLOADS});
  assert.match(high, /InteractionCounter/);

  const ld = softwareApplicationLd(high);
  assert.ok(ld, 'a SoftwareApplication block should be published');
  assert.equal(
    ld.interactionStatistic.userInteractionCount,
    MIN_DISPLAYED_DOWNLOADS,
    'the published count should be the one the chip shows',
  );
  assert.equal(ld.interactionStatistic['@type'], 'InteractionCounter');
});

test('the rest of the badge row survives a suppressed counter', () => {
  /* The row itself is conditional, so hiding the counter must not take
     the version badge or the GitHub chip down with it. */
  const html = render({downloads: 5, version: 'v0.10'});
  assert.match(html, /v0\.10/);
  assert.match(html, /View on GitHub/);
});
