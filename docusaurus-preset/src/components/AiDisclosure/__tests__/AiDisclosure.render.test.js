/**
 * AiDisclosure.render.test.js — renders the real <AiDisclosure> JSX
 * to static markup and asserts on the output, so a broken import path
 * or a JSX mistake in AiDisclosure.jsx fails a test instead of only
 * surfacing the first time a consuming site runs `docusaurus build`.
 *
 * Uses the same esbuild-bundle-then-renderToStaticMarkup technique as
 * ../../../../scripts/build-kit.mjs (Rule 1: copy an existing pattern
 * rather than inventing new test tooling). Docusaurus-only modules
 * (`@docusaurus/theme-common`, `@docusaurus/useDocusaurusContext`,
 * `@docusaurus/useBaseUrl`) are stubbed via esbuild plugins since this
 * test runs outside an actual Docusaurus build; the useBaseUrl stub
 * prefixes a fake `/base/` the same way the real hook prefixes a
 * site's configured baseUrl, so the assertion is "the resolved icon
 * path for this kind/treatment was passed through base-url
 * resolution", not a snapshot of a real deployed URL.
 *
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-5.2
 */

'use strict';

const test = require('node:test');
const {after} = test;
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {build} = require('esbuild');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const COMPONENT = path.resolve(__dirname, '..', 'AiDisclosure.jsx');

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

function docusaurusStub({colorMode, locale}) {
  return {
    name: 'docusaurus-stub',
    setup(b) {
      b.onResolve({filter: /^@docusaurus\/theme-common$/}, () => ({path: 'docusaurus-theme-common', namespace: 'docusaurus-stub'}));
      b.onResolve({filter: /^@docusaurus\/useDocusaurusContext$/}, () => ({path: 'docusaurus-context', namespace: 'docusaurus-stub'}));
      b.onResolve({filter: /^@docusaurus\/useBaseUrl$/}, () => ({path: 'docusaurus-base-url', namespace: 'docusaurus-stub'}));
      b.onLoad({filter: /^docusaurus-theme-common$/, namespace: 'docusaurus-stub'}, () => ({
        contents: `export function useColorMode() { return {colorMode: ${JSON.stringify(colorMode)}}; }`,
        loader: 'js',
      }));
      b.onLoad({filter: /^docusaurus-context$/, namespace: 'docusaurus-stub'}, () => ({
        contents: `export default function useDocusaurusContext() { return {i18n: {currentLocale: ${JSON.stringify(locale)}}}; }`,
        loader: 'js',
      }));
      // Mirrors the real hook's job: prefix the site's baseUrl onto a
      // base-relative static path.
      b.onLoad({filter: /^docusaurus-base-url$/, namespace: 'docusaurus-stub'}, () => ({
        contents: `export default function useBaseUrl(path) { return "/base/" + path; }`,
        loader: 'js',
      }));
    },
  };
}

// Bundle output must live under a directory that can `require('react')`
// via normal node_modules walk-up (react is `external`, not bundled) -
// os.tmpdir() has no node_modules ancestor, so we use a scratch dir
// inside the package instead, mirroring build-kit.mjs's `.tmp-build-kit`.
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

async function renderAiDisclosure(props, {colorMode = 'light', locale = 'en'} = {}) {
  const scratchRoot = path.join(PRESET_ROOT, '.tmp-ai-disclosure-test');
  await fs.mkdir(scratchRoot, {recursive: true});
  const tmpDir = await fs.mkdtemp(path.join(scratchRoot, 'run-'));
  const outFile = path.join(tmpDir, 'bundle.cjs');
  try {
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
      plugins: [cssModuleStub, docusaurusStub({colorMode, locale})],
      logLevel: 'warning',
    });
    delete require.cache[require.resolve(outFile)];
    const mod = require(outFile);
    const Component = mod.default;
    return renderToStaticMarkup(React.createElement(Component, props));
  } finally {
    await fs.rm(tmpDir, {recursive: true, force: true});
  }
}

test('renders the generated mark + English copy in light mode', async () => {
  const html = await renderAiDisclosure({kind: 'generated'}, {colorMode: 'light', locale: 'en'});
  assert.match(html, /\/base\/img\/ai-disclosure\/ai-generated-black\.svg/);
  assert.match(html, /This page was generated with AI\./);
});

test('renders the white (light-ink-on-dark) treatment in dark mode', async () => {
  const html = await renderAiDisclosure({kind: 'modified'}, {colorMode: 'dark', locale: 'en'});
  assert.match(html, /\/base\/img\/ai-disclosure\/ai-modified-white\.svg/);
});

test('renders Dutch copy when the active locale is nl', async () => {
  const html = await renderAiDisclosure({kind: 'assisted'}, {colorMode: 'light', locale: 'nl'});
  assert.match(html, /Deze pagina is geschreven met hulp van AI\./);
});

test('renders nothing for an unrecognised kind', async () => {
  const html = await renderAiDisclosure({kind: 'basic'}, {colorMode: 'light', locale: 'en'});
  assert.equal(html, '');
});

after(async () => {
  await fs.rm(path.join(PRESET_ROOT, '.tmp-ai-disclosure-test'), {recursive: true, force: true});
});
