/**
 * disclosure.test.js — unit tests for the ai-content-disclosure
 * resolver, asset mapping, locale coverage, and no-compliance-claim
 * copy denylist.
 *
 * Runs on Node's built-in test runner (no bundler, no React needed -
 * see disclosure.js's header for why the pure logic lives apart from
 * the JSX component). Run with `npm test` from docusaurus-preset/, or
 * `node --test src` from the same directory.
 *
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-5.1
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-5.2
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-5.3
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-5.4
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  AI_KINDS,
  LOCALES,
  VIEWBOX,
  ICONS_BASE_PATH,
  isValidKind,
  resolveAiFrontmatter,
  getIconFilename,
  getIconPath,
  getViewBox,
  getCopy,
} = require('../disclosure');

// Icons are vendored as plain static files (not a webpack `.svg`
// import - see disclosure.js's ICONS_BASE_PATH comment) so the tests
// resolve them against static/img/ai-disclosure/ directly.
const ICONS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'static', 'img', 'ai-disclosure');

// -- 5.1: frontmatter resolver -- present / absent / misspelled / empty --

test('resolver: present and valid resolves to the kind, no warning', () => {
  for (const kind of AI_KINDS) {
    const {kind: resolved, warning} = resolveAiFrontmatter(kind, 'docs/foo.md');
    assert.equal(resolved, kind);
    assert.equal(warning, null);
  }
});

test('resolver: absent key resolves to no kind and no warning', () => {
  const {kind, warning} = resolveAiFrontmatter(undefined, 'docs/foo.md');
  assert.equal(kind, null);
  assert.equal(warning, null);
});

test('resolver: misspelled value resolves to no kind and warns, naming file/value/permitted', () => {
  const {kind, warning} = resolveAiFrontmatter('genrated', 'docs/foo.md');
  assert.equal(kind, null);
  assert.match(warning, /docs\/foo\.md/);
  assert.match(warning, /genrated/);
  for (const permitted of AI_KINDS) {
    assert.match(warning, new RegExp(permitted));
  }
});

test('resolver: empty value resolves to no kind and warns', () => {
  const {kind, warning} = resolveAiFrontmatter('', 'docs/foo.md');
  assert.equal(kind, null);
  assert.ok(warning);
  assert.match(warning, /docs\/foo\.md/);
});

test('resolver: never falls back to a mark for an unrecognised value', () => {
  const {kind} = resolveAiFrontmatter('fully-generated', 'docs/foo.md');
  assert.notEqual(kind, 'generated');
  assert.equal(kind, null);
});

// -- 5.2: kind -> vendored-asset mapping + preserved aspect ratio --

test('mapping: generated maps to an ai-generated-* asset', () => {
  assert.equal(getIconFilename('generated', 'black'), 'ai-generated-black.svg');
  assert.equal(getIconFilename('generated', 'white'), 'ai-generated-white.svg');
});

test('mapping: modified maps to an ai-modified-* asset', () => {
  assert.equal(getIconFilename('modified', 'black'), 'ai-modified-black.svg');
});

test('mapping: assisted maps to the basic mark (neither ai-generated-* nor ai-modified-*)', () => {
  const filename = getIconFilename('assisted', 'black');
  assert.equal(filename, 'ai-black.svg');
  assert.doesNotMatch(filename, /^ai-generated-/);
  assert.doesNotMatch(filename, /^ai-modified-/);
});

test('mapping: every kind x treatment resolves to a file that actually exists on disk', () => {
  const treatments = ['black', 'white', 'black-transparent', 'white-transparent'];
  for (const kind of AI_KINDS) {
    for (const treatment of treatments) {
      const filename = getIconFilename(kind, treatment);
      const filePath = path.join(ICONS_DIR, filename);
      assert.ok(fs.existsSync(filePath), `expected vendored asset at ${filePath}`);
    }
  }
});

test('mapping: getIconPath is base-relative (no leading slash) so useBaseUrl can prefix it', () => {
  const p = getIconPath('generated', 'black');
  assert.equal(p, `${ICONS_BASE_PATH}/ai-generated-black.svg`);
  assert.ok(!p.startsWith('/'));
});

test('aspect ratio: getViewBox matches the vendored SVG viewBox within 1% tolerance', () => {
  for (const kind of AI_KINDS) {
    const filename = getIconFilename(kind, 'black');
    const svg = fs.readFileSync(path.join(ICONS_DIR, filename), 'utf8');
    const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    assert.ok(match, `${filename} has no parseable viewBox`);
    const sourceRatio = Number(match[1]) / Number(match[2]);
    const {width, height} = getViewBox(kind);
    const declaredRatio = width / height;
    const tolerance = sourceRatio * 0.01;
    assert.ok(
      Math.abs(sourceRatio - declaredRatio) <= tolerance,
      `${kind}: source ratio ${sourceRatio} vs declared ${declaredRatio} (VIEWBOX=${JSON.stringify(VIEWBOX[kind])})`,
    );
  }
});

test('aspect ratio: the three marks are not forced into a uniform box', () => {
  const ratios = AI_KINDS.map((kind) => {
    const {width, height} = getViewBox(kind);
    return width / height;
  });
  assert.ok(new Set(ratios.map((r) => r.toFixed(3))).size > 1, 'expected differing ratios across marks');
});

// -- 5.3: locale coverage --

test('locale coverage: nl, en, de, fr all present, nl is the default', () => {
  assert.deepEqual(new Set(LOCALES), new Set(['nl', 'en', 'de', 'fr']));
});

test('locale coverage: every locale has distinct, non-empty copy for all three kinds', () => {
  for (const locale of LOCALES) {
    const strings = AI_KINDS.map((kind) => getCopy(kind, locale));
    for (const [i, s] of strings.entries()) {
      assert.ok(typeof s === 'string' && s.trim().length > 0, `${locale}/${AI_KINDS[i]} missing or empty`);
    }
    assert.equal(new Set(strings).size, strings.length, `${locale}: two kinds share one string`);
  }
});

test('locale coverage: no locale silently falls back to another locale\'s string', () => {
  const seenAcrossLocales = new Map();
  for (const locale of LOCALES) {
    for (const kind of AI_KINDS) {
      const s = getCopy(kind, locale);
      const key = `${kind}:${s}`;
      if (locale !== 'nl') {
        // Same (kind, string) pair appearing under two different
        // locales would mean one locale leaked another's copy.
        assert.ok(!seenAcrossLocales.has(key) || seenAcrossLocales.get(key) === locale, `duplicate string across locales for ${key}`);
      }
      seenAcrossLocales.set(key, locale);
    }
  }
});

// -- 5.4: no compliance / Code-of-Practice claim, in any locale --

const COMPLIANCE_DENYLIST = [
  /compliant/i,
  /compliance/i,
  /conform/i,
  /voldoet aan/i,
  /naleving/i,
  /in accordance with the ai act/i,
  /in Übereinstimmung mit/i,
  /conforme (à|au|aux)/i,
  /code of practice/i,
  /gedragscode/i,
  /code de bonne pratique/i,
  /verhaltenskodex/i,
  /signatory/i,
  /signataire/i,
  /unterzeichner/i,
];

test('copy: no locale/kind combination contains a compliance or Code-of-Practice claim', () => {
  const offenders = [];
  for (const locale of LOCALES) {
    for (const kind of AI_KINDS) {
      const text = getCopy(kind, locale);
      for (const pattern of COMPLIANCE_DENYLIST) {
        if (pattern.test(text)) {
          offenders.push(`${locale}/${kind}: "${text}" matched ${pattern}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, []);
});

// -- isValidKind guard used by the component for both frontmatter and inline props --

test('isValidKind rejects anything outside the three permitted values', () => {
  assert.equal(isValidKind('generated'), true);
  assert.equal(isValidKind('modified'), true);
  assert.equal(isValidKind('assisted'), true);
  assert.equal(isValidKind('basic'), false);
  assert.equal(isValidKind(''), false);
  assert.equal(isValidKind(undefined), false);
  assert.equal(isValidKind(null), false);
});
