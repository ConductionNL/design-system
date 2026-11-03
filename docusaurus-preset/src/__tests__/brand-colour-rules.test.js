/**
 * brand-colour-rules.test.js — the two standing rulings about brand
 * colour and text, enforced rather than remembered.
 *
 *   1. Text is never Common Ground yellow.
 *   2. Text on orange is white.
 *
 * Both were ruled on 2026-09-24. Neither is a contrast rule, which is
 * exactly why they need a test: a reviewer measuring ratios would pass
 * both violations. Common Ground yellow reads 4.71:1 on a cobalt banner
 * and 8.14:1 on a cobalt-800 panel, and the preset shipped it as text in
 * both places for months on the strength of those numbers. A good
 * reading is not an exemption from a brand rule.
 *
 * Rule 1 also rules out a darkened stand-in. A #916600 citation colour
 * was derived on 2026-09-23 the way --c-coral-600 was derived for KNVB,
 * shipped, and ruled out the next day. The check is on the hue, not on
 * the exact brand hex, so the next well-meaning derivation fails here
 * instead of shipping.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PRESET_SRC = path.join(__dirname, '..');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const TOKENS = path.join(REPO_ROOT, 'tokens.css');

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
  const rgb = v.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return '#' + [1, 2, 3].map((i) => Number(rgb[i]).toString(16).padStart(2, '0')).join('').toUpperCase();
  return null;
}

/** Is this hex a Common Ground yellow, brand or darkened stand-in? */
function isCommonGroundYellow(hex) {
  if (!hex) return false;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  /* Two properties, both of which survive darkening, which is how a
     stand-in gets made: the Common Ground yellow has NO blue at all, and
     a green/red ratio of 0.703. #F6AD00 and the #916600 that was derived
     from it share that ratio exactly.

     Measured against every neighbouring token in the kit, the separation
     is not close: gold-500 is b=31 and 0.766, gold-300 is b=104, coral is
     0.444, terracotta 0.528.

     What this does not catch: a stand-in mixed toward grey rather than
     toward black picks up blue and escapes. That is the honest limit.
     This catches the derivation anyone would actually reach for. */
  if (b > 16) return false;
  if (r < 100) return false;
  const ratio = g / r;
  return ratio > 0.66 && ratio < 0.75;
}

function isWhite(hex) {
  return hex === '#FFFFFF';
}

function cssFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) cssFiles(p, out);
    else if (entry.name.endsWith('.css')) out.push(p);
  }
  return out;
}

/** Every declaration block, as {file, selector, body}. */
function blocks(files) {
  const out = [];
  for (const file of files) {
    const txt = fs.readFileSync(file, 'utf8');
    for (const m of txt.matchAll(/([^\n{}]+)\{([^}]*)\}/g)) {
      const lines = m[1].trim().split('\n');
      out.push({file, selector: lines[lines.length - 1].trim(), body: m[2]});
    }
  }
  return out;
}

const textColour = (body) => {
  const m = body.match(/(?<!-)\bcolor\s*:\s*([^;]*)/);
  return m ? resolveColour(m[1]) : null;
};
const fillColour = (body) => {
  const m = body.match(/\bbackground(?:-color)?\s*:\s*([^;]*)/);
  return m ? resolveColour(m[1]) : null;
};

test('the hue test recognises the brand yellow and its derivations, and nothing else', () => {
  assert.equal(isCommonGroundYellow('#F6AD00'), true, 'the brand yellow itself');
  assert.equal(isCommonGroundYellow('#916600'), true, 'the darkened stand-in that was ruled out');
  assert.equal(isCommonGroundYellow('#C99A1F'), false, 'gold-500 is a different colour and stays usable');
  assert.equal(isCommonGroundYellow('#F36C21'), false, 'KNVB orange');
  assert.equal(isCommonGroundYellow('#FFFFFF'), false, 'white');
  assert.equal(resolveColour('var(--c-commonground-yellow)'), '#F6AD00', 'token resolution backs every check below');
});

test('no rule paints TEXT in Common Ground yellow', () => {
  const found = blocks(cssFiles(PRESET_SRC))
    .filter((b) => isCommonGroundYellow(textColour(b.body)))
    .map((b) => `${path.relative(PRESET_SRC, b.file)}  ${b.selector}`);
  assert.deepEqual(found, [], 'Common Ground yellow used as a text colour. It is a fill; put cobalt-900 ink on it.');
});

test('text on an orange fill is white', () => {
  const ORANGE = ['#F36C21'];
  const found = blocks(cssFiles(PRESET_SRC))
    .filter((b) => {
      const bg = fillColour(b.body);
      const fg = textColour(b.body);
      return bg && ORANGE.includes(bg) && fg && !isWhite(fg);
    })
    .map((b) => `${path.relative(PRESET_SRC, b.file)}  ${b.selector}  ->  ${textColour(b.body)}`);
  assert.deepEqual(found, [], 'orange fills whose text is not white');
});

test('the published kit pages follow the same two rules', () => {
  const preview = path.join(REPO_ROOT, 'preview');
  const files = cssFiles(preview);
  const inline = [];
  if (fs.existsSync(preview)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith('.html')) inline.push(p);
      }
    };
    walk(preview);
  }
  if (!files.length && !inline.length) return; /* published package, no preview/ */
  const found = blocks([...files, ...inline])
    .filter((b) => isCommonGroundYellow(textColour(b.body)))
    .map((b) => `${path.relative(REPO_ROOT, b.file)}  ${b.selector}`);
  assert.deepEqual(found, [], 'Common Ground yellow as text in the published kit pages');
});
