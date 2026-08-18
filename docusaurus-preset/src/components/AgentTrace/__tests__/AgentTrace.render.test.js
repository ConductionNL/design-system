/**
 * AgentTrace.render.test.js — SSR-renders the real <AgentTrace> and
 * asserts the typed-reveal wiring: per-line --at-d delays on the
 * 550ms stagger, the loop period --at-total derived from the line
 * count, the cursor delayed until after the last line, and the
 * `running` prop's static class. Same esbuild harness as
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

const COMPONENT = path.resolve(__dirname, '..', 'AgentTrace.jsx');
const PRESET_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SCRATCH = path.join(PRESET_ROOT, '.tmp-agent-trace-test');

const LINES = [
  {kind: 'note', bullet: 'done', text: 'Found the root cause.'},
  {kind: 'tool', text: 'openconnector - run_pipeline (MCP)'},
  {kind: 'expand', text: '+38 lines (ctrl+o to expand)'},
  {kind: 'continuation', text: 'register_slug: "zaak", limit: 50'},
  {kind: 'status', text: 'Synthesising…'},
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

let AgentTrace;

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
  AgentTrace = require(outFile).default;
});

after(async () => {
  await fs.rm(SCRATCH, {recursive: true, force: true});
});

function render(props) {
  return renderToStaticMarkup(React.createElement(AgentTrace, props));
}

test('SSR smoke: renders every line kind', () => {
  const html = render({lines: LINES, cursor: true, mode: 'accept edits on'});
  for (const cls of ['note', 'tool', 'expand', 'continuation', 'status', 'cursorLine', 'modeBar']) {
    assert.match(html, new RegExp(`class="[^"]*\\b${cls}\\b`), `missing ${cls}`);
  }
});

test('typed reveal: each line carries its --at-d delay on the 550ms stagger', () => {
  const html = render({lines: LINES});
  for (let i = 0; i < LINES.length; i++) {
    assert.match(html, new RegExp(`--at-d:${i * 550}ms`), `line ${i}: missing delay`);
  }
});

test('typed reveal: the loop period --at-total derives from the line count (+ hold)', () => {
  const html = render({lines: LINES});
  assert.match(html, new RegExp(`--at-total:${LINES.length * 550 + 2600}ms`));
});

test('cursor: delayed until after the last line', () => {
  const html = render({lines: LINES, cursor: true});
  assert.match(html, new RegExp(`--at-d:${LINES.length * 550}ms`));
});

test('indented lines keep their padding alongside the delay', () => {
  const html = render({lines: [{kind: 'note', text: 'x', indent: 2}]});
  assert.match(html, /padding-left:36px/);
  assert.match(html, /--at-d:0ms/);
});

test('P0 plumbing: running={false} adds the static class to the trace root; default omits it', () => {
  assert.match(render({lines: LINES, running: false}), /class="trace static"/);
  assert.doesNotMatch(render({lines: LINES}), /\bstatic\b/);
});
