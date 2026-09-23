/**
 * prism-theme.test.js — every syntax colour must be readable on the
 * block it is painted on.
 *
 * The brand syntax theme is a plain object serialised into inline
 * styles at build time, so nothing downstream can correct it: not the
 * colour-role lint, which reads CSS declarations and never sees this
 * file, and not a stylesheet rule, because inline styles win. The
 * a11y sweep would catch a regression, but only on a page that happens
 * to contain a code block using that token type, and only if someone
 * runs it.
 *
 * So the contrast is asserted here instead, against the theme's own
 * declared background. A token added later without a reading fails this
 * test rather than shipping quietly.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {prismTheme} = require('../prism-theme.js');

/** WCAG relative luminance for an #rrggbb string. */
function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const chan = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan((n >> 16) & 255) + 0.7152 * chan((n >> 8) & 255) + 0.0722 * chan(n & 255);
}

function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

const GROUND = prismTheme.plain.backgroundColor;

test('the theme declares its own ground, so the readings mean something', () => {
  assert.match(GROUND, /^#[0-9A-Fa-f]{6}$/, 'plain.backgroundColor must be an #rrggbb literal');
  assert.match(prismTheme.plain.color, /^#[0-9A-Fa-f]{6}$/);
});

test('plain code clears AA on the block ground', () => {
  const r = contrast(prismTheme.plain.color, GROUND);
  assert.ok(r >= 4.5, `plain code is ${r.toFixed(2)}:1 on ${GROUND}, needs 4.5:1`);
});

test('every token colour clears AA on the block ground', () => {
  const failures = [];
  for (const entry of prismTheme.styles) {
    const colour = entry.style && entry.style.color;
    assert.ok(colour, `token ${entry.types.join('/')} sets no colour`);
    assert.match(colour, /^#[0-9A-Fa-f]{6}$/, `token ${entry.types.join('/')} must be an #rrggbb literal, not ${colour}`);
    const r = contrast(colour, GROUND);
    if (r < 4.5) failures.push(`${entry.types.join('/')}: ${colour} is ${r.toFixed(2)}:1`);
  }
  assert.deepEqual(failures, [], `token colours under 4.5:1 on ${GROUND}`);
});

test('no token sets a background, which would move the ground out from under the readings', () => {
  for (const entry of prismTheme.styles) {
    assert.ok(
      !entry.style || entry.style.backgroundColor === undefined,
      `token ${entry.types.join('/')} sets a backgroundColor; every other reading in this file assumes ${GROUND}`,
    );
  }
});

test('comments are the dimmest thing in the block, but still readable', () => {
  const comment = prismTheme.styles.find((s) => s.types.includes('comment'));
  assert.ok(comment, 'the theme must style comments; whatever it omits renders as plain code');
  const r = contrast(comment.style.color, GROUND);
  assert.ok(r >= 4.5, `comments are ${r.toFixed(2)}:1, needs 4.5:1`);
  const plain = contrast(prismTheme.plain.color, GROUND);
  assert.ok(
    r < plain,
    `comments (${r.toFixed(2)}:1) must read as subordinate to code (${plain.toFixed(2)}:1)`,
  );
});

test('the token types Prism actually emits are all covered', () => {
  /* Not every Prism type, just the ones a miss would be visible in: a
     type this theme does not name falls back to plain code, so a YAML
     key and its value would render identically. */
  const required = [
    'comment', 'punctuation', 'keyword', 'string', 'number',
    'function', 'class-name', 'property', 'attr-name', 'operator',
    'boolean', 'tag', 'attr-value', 'deleted', 'inserted',
  ];
  const covered = new Set(prismTheme.styles.flatMap((s) => s.types));
  const missing = required.filter((t) => !covered.has(t));
  assert.deepEqual(missing, [], 'token types with no colour of their own');
});
