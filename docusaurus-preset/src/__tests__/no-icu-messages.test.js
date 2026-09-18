/**
 * no-icu-messages.test.js — no translatable string may use ICU plural
 * or select syntax.
 *
 * Docusaurus's `translate()` and `<Translate>` substitute
 * `{placeholder}` and nothing else. An ICU message therefore does not
 * fail, does not warn, and does not fall back: it renders to the
 * reader verbatim, braces and keywords and all, in every locale. It
 * shipped that way in the game-over modal and was reported from the
 * live site.
 *
 * The fix is two messages chosen in JS. This test is the reason nobody
 * has to remember that.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const SRC = path.resolve(__dirname, '..');
/* `{name, plural, ...}` / `{count, select, ...}`, the two ICU forms
   that render raw. Deliberately loose: any argument name, any spacing. */
const ICU = /\{\s*\w+\s*,\s*(plural|select|selectordinal)\s*,/;

function sourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      out.push(...sourceFiles(full));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

test('no component ships an ICU plural or select message', () => {
  const offenders = [];
  for (const file of sourceFiles(SRC)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      /* Skip the comment that explains the rule. */
      if (/^\s*(\*|\/\/|\/\*)/.test(line)) return;
      if (ICU.test(line)) offenders.push(`${path.relative(SRC, file)}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(
    offenders,
    [],
    'ICU syntax renders verbatim to the reader; use two messages picked in JS:\n' + offenders.join('\n'),
  );
});
