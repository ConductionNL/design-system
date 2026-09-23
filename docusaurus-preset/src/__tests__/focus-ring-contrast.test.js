/**
 * focus-ring-contrast.test.js — a focus ring must be visible against the
 * thing it is drawn around.
 *
 * This one bug class has now been found five separate times, each time by
 * measuring a rendered page rather than by review:
 *
 *   PartnerCard .become      box-shadow: none cancelled the halo   2.68:1
 *   ContentTypeFilter .chip  hardcoded cobalt ring on a cobalt fill 1.97:1
 *   HiddenGame .openerButton hardcoded cobalt ring on a cobalt band 1.97:1
 *   11 mini-game buttons     dark ring on their own cobalt fill     1.97:1
 *   DetailHero (citations)   same shape, different property
 *
 * The shape is always the same: a component picks a single ring colour
 * that suits the surface the author was looking at, and the component is
 * later placed on, or paints, a surface of similar luminance. 1.97:1 is
 * the signature of a dark ring on cobalt.
 *
 * The site-wide answer is two rings, an outline plus a halo of opposite
 * luminance, so one of them always has contrast. A rule that overrides
 * the global focus style with a SINGLE ring opts out of that guarantee,
 * so this test measures those against the element's own background.
 *
 * Rules that declare both rings are left alone: they carry the guarantee
 * themselves, and which ring wins depends on where the element is placed,
 * which no static check can know.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PRESET_SRC = path.join(__dirname, '..');
const TOKENS = path.join(__dirname, '..', '..', '..', 'tokens.css');

/* Light-theme token values. The dark theme redefines a subset, but a ring
   that fails in light is already a defect, and the :root block is the one
   both themes start from. */
const tokens = {};
{
  const src = fs.readFileSync(TOKENS, 'utf8');
  for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    if (!(m[1] in tokens)) tokens[m[1]] = m[2].trim();
  }
}

function resolveColour(value, depth = 0) {
  if (depth > 8 || !value) return null;
  const v = String(value).trim();
  const varRef = v.match(/var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/i);
  if (varRef) return resolveColour(tokens[varRef[1]] ?? varRef[2], depth + 1);
  const hex = v.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    return '#' + h.toUpperCase();
  }
  if (/^white\b/i.test(v)) return '#FFFFFF';
  if (/^black\b/i.test(v)) return '#000000';
  const rgb = v.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return '#' + [1, 2, 3].map((i) => Number(rgb[i]).toString(16).padStart(2, '0')).join('').toUpperCase();
  return null;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
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

function cssFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) cssFiles(p, out);
    else if (entry.name.endsWith('.css')) out.push(p);
  }
  return out;
}

/** Single-ring :focus-visible rules, paired with the element's own background. */
function singleRingRules() {
  const rules = [];
  for (const file of cssFiles(PRESET_SRC)) {
    const txt = fs.readFileSync(file, 'utf8');
    for (const m of txt.matchAll(/([^\n{}]*:focus-visible[^\n{}]*)\{([^}]*)\}/g)) {
      const selector = m[1].trim();
      const body = m[2];
      const outline = body.match(/\boutline\s*:\s*([^;]+)/);
      if (!outline || /\bnone\b/.test(outline[1])) continue;
      if (/\bbox-shadow\s*:/.test(body)) continue; /* declares both rings */
      const ringRaw = (outline[1].match(/(var\([^)]*\)|#[0-9a-fA-F]{3,8}|\bwhite\b|\bblack\b|currentColor)/) || [])[1];
      const ring = resolveColour(ringRaw);

      const cls = selector.replace(/:focus-visible.*/, '').trim().split(/\s+/).pop();
      const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const base = txt.match(new RegExp(`(^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm'));
      let background = null;
      if (base) {
        const bg = base[2].match(/\bbackground(?:-color)?\s*:\s*([^;]+)/);
        if (bg) background = resolveColour(bg[1]);
      }
      rules.push({
        file: path.relative(PRESET_SRC, file),
        selector,
        ring,
        background,
        ratio: ring && background ? contrast(ring, background) : null,
      });
    }
  }
  return rules;
}

test('the audit can see the stylesheets and resolve the kit tokens', () => {
  assert.ok(cssFiles(PRESET_SRC).length > 20, 'expected to find the component stylesheets');
  assert.equal(resolveColour('var(--c-blue-cobalt)'), '#21468B', 'token resolution is the basis of every reading below');
  assert.equal(resolveColour('var(--conduction-color-focus-ring)'), '#F36C21');
});

test('a single-ring focus indicator clears 3:1 on the surface it is drawn around', () => {
  const measured = singleRingRules().filter((r) => r.ratio !== null);
  assert.ok(measured.length > 0, 'nothing was measured, so a pass here would mean nothing');
  const failures = measured
    .filter((r) => r.ratio < 3)
    .map((r) => `${r.file} ${r.selector}: ring ${r.ring} on ${r.background} is ${r.ratio.toFixed(2)}:1`);
  assert.deepEqual(failures, [], 'single-ring focus indicators under 3:1 (SC 2.4.11). Give these the two-ring pair.');
});
