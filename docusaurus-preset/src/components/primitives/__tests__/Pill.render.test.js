/**
 * Pill.render.test.js — renders the real <Pill> JSX to static markup.
 *
 * The case that matters here is the `style` prop. Pill computes an inline
 * style for `tone="solid"` and used to spread `...rest` after it, so a
 * caller's own `style` replaced the computed object wholesale and the
 * `color` fill was silently discarded. Measured on /nl/support/ 2026-09-20:
 * a badge written as a gold pill with dark ink rendered as cobalt-900 on the
 * blue-cobalt fallback fill from .tone-solid, at 1.97:1. The `color` prop
 * looked ignored when it was in fact being thrown away.
 *
 * Uses the same esbuild-bundle-then-renderToStaticMarkup technique as the
 * other render tests in this package.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {build} = require('esbuild');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const COMPONENT = path.resolve(__dirname, '..', 'Pill.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

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

async function renderPill(props) {
  const scratchRoot = path.join(PRESET_ROOT, '.tmp-pill-test');
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
      plugins: [cssModuleStub],
      logLevel: 'warning',
    });
    delete require.cache[require.resolve(outFile)];
    const Component = require(outFile).default;
    return renderToStaticMarkup(React.createElement(Component, props, 'CERTIFIED'));
  } finally {
    await fs.rm(tmpDir, {recursive: true, force: true});
  }
}

test('a solid pill paints the colour it was given', async () => {
  const html = await renderPill({tone: 'solid', color: 'var(--c-gold-500)'});
  assert.match(html, /background:\s*var\(--c-gold-500\)/, 'the color prop is the fill for a solid pill');
  assert.match(html, /color:\s*white/, 'white is the default ink');
});

test('a caller style is merged, not substituted for the computed fill', async () => {
  const html = await renderPill({
    tone: 'solid',
    color: 'var(--c-gold-500)',
    style: {color: 'var(--c-cobalt-900)'},
  });
  /* Without the merge this assertion fails: the caller's style replaced the
     computed one and the fill vanished, leaving the pill on .tone-solid's
     blue-cobalt with dark ink on it. */
  assert.match(html, /background:\s*var\(--c-gold-500\)/, 'the fill survives a caller-supplied style');
  assert.match(html, /color:\s*var\(--c-cobalt-900\)/, 'the caller wins on ink');
  assert.doesNotMatch(html, /color:\s*white/, 'the default ink is overridden, not appended');
});

test('a pill with no colour and no style carries no inline style at all', async () => {
  const html = await renderPill({});
  assert.doesNotMatch(html, /style="/, 'default tone stays entirely in CSS');
});
