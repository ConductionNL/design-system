/**
 * build-kit.mjs — render JSX kit pages to static HTML.
 *
 * Phase 1 of the AppMock-family unification: kit pages that consume
 * React components (AppMock today; WidgetMock + SidebarMock next)
 * stop hand-coding the chassis HTML and start composing from the
 * same React source as the published preset. Other kit pages stay
 * as authored HTML — they have no JSX counterpart to drift from.
 *
 * Mechanism: marker-based splice.
 *
 *   <!-- BUILD:variant-catalogue (rendered from <jsx-source> by scripts/build-kit.mjs) -->
 *   ... auto-generated content lives here ...
 *   <!-- /BUILD:variant-catalogue -->
 *
 * The script:
 *   1. esbuild-bundles each JSX entry to a node-runnable ESM string.
 *      CSS-module imports are stubbed (styles.foo → 'foo'); plain CSS
 *      imports are externalised (the kit page references the same
 *      module.css via <link rel="stylesheet">, so we don't need to
 *      bundle CSS into the JS).
 *   2. Loads the bundle via `import('data:text/javascript;base64,...')`.
 *   3. Renders the default export with renderToStaticMarkup.
 *   4. Reads the target HTML file, finds the matching BUILD marker,
 *      replaces the body between markers with the rendered output,
 *      writes back. Markers stay in place so re-running is idempotent.
 *
 * Add a new page by extending the PAGES array below.
 *
 * Usage: `npm run build:kit` from the design-system root.
 */

import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import beautify from 'js-beautify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const PAGES = [
  {
    jsx:    'preview/components/app-mock.variants.jsx',
    target: 'preview/components/app-mock.html',
    marker: 'variant-catalogue',
  },
];

// Stub CSS-module imports: styles.foo → 'foo'. Works because every
// AppMock rule is scoped under a `.am` parent class, so we don't need
// hashed identifiers to avoid global collisions.
const cssModuleStub = {
  name: 'css-module-stub',
  setup(b) {
    b.onResolve({ filter: /\.module\.css$/ }, args => ({
      path: args.path,
      namespace: 'css-stub',
    }));
    b.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({
      contents: 'export default new Proxy({}, { get: (_, p) => p });',
      loader: 'js',
    }));
  },
};

// Plain .css imports are kit-side only (referenced via <link>); skip in JS bundle.
const cssIgnore = {
  name: 'css-ignore',
  setup(b) {
    b.onResolve({ filter: /\.css$/ }, () => ({ path: 'noop', namespace: 'css-stub' }));
  },
};

async function renderJsx(jsxPath, tmpDir) {
  // Write the bundled ESM into design-system/.tmp-build-kit/ so dynamic
  // import resolves bare specifiers like 'react' against the local
  // node_modules (data: URLs can't, file: URLs in our tree can).
  const outFile = resolve(tmpDir, 'page-' + Math.random().toString(36).slice(2) + '.mjs');
  await build({
    entryPoints: [resolve(repoRoot, jsxPath)],
    outfile: outFile,
    bundle: true,
    format: 'esm',
    jsx: 'automatic',
    jsxImportSource: 'react',
    // Inline tsconfig to block esbuild from inheriting any tsconfig
    // higher up the tree (the Nextcloud monorepo at /workspace/server
    // sets jsxImportSource: 'vue' via @vue/tsconfig, which would
    // otherwise override our React preset and break the build).
    tsconfigRaw: { compilerOptions: { jsx: 'react-jsx', jsxImportSource: 'react' } },
    platform: 'node',
    external: ['react', 'react-dom', 'react-dom/server'],
    plugins: [cssModuleStub, cssIgnore],
    logLevel: 'warning',
  });
  const mod = await import(pathToFileURL(outFile).href);
  const raw = renderToStaticMarkup(React.createElement(mod.default));
  // Pretty-print so future diffs of the generated section are reviewable.
  // The generated block sits inline in app-mock.html, so 2-space indent
  // matches the surrounding hand-coded HTML style.
  return beautify.html(raw, {
    indent_size: 2,
    wrap_line_length: 0,
    preserve_newlines: false,
    inline: ['code', 'span', 'b', 'i', 'a'],
    end_with_newline: false,
  });
}

function spliceMarker(html, marker, replacement) {
  const startRe = new RegExp(`<!--\\s*BUILD:${marker}[^>]*-->`);
  const endRe = new RegExp(`<!--\\s*/BUILD:${marker}\\s*-->`);
  const startMatch = html.match(startRe);
  const endMatch = html.match(endRe);
  if (!startMatch || !endMatch) {
    throw new Error(`Marker BUILD:${marker} not found in HTML (need both opening and closing tags).`);
  }
  const startIdx = startMatch.index + startMatch[0].length;
  const endIdx = endMatch.index;
  return html.slice(0, startIdx) + '\n' + replacement + '\n' + html.slice(endIdx);
}

const tmpDir = resolve(repoRoot, '.tmp-build-kit');
await mkdir(tmpDir, { recursive: true });

let exitCode = 0;
try {
  for (const page of PAGES) {
    try {
      const rendered = await renderJsx(page.jsx, tmpDir);
      const targetPath = resolve(repoRoot, page.target);
      const html = await readFile(targetPath, 'utf8');
      const updated = spliceMarker(html, page.marker, rendered);
      await writeFile(targetPath, updated);
      console.log(`✓ built ${page.target} (from ${page.jsx}, marker ${page.marker}, ${rendered.length} chars)`);
    } catch (err) {
      console.error(`✗ failed ${page.target}: ${err.message}`);
      exitCode = 1;
    }
  }
} finally {
  await rm(tmpDir, { recursive: true, force: true });
}
process.exit(exitCode);
