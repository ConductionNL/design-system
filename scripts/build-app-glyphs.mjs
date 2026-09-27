#!/usr/bin/env node
/**
 * build-app-glyphs.mjs: generate the AppGlyph data from the glyph files.
 *
 * Source of truth: brand/assets/apps/glyphs/<app id>.svg. Each file is a
 * single-colour copy of that app's img/app.svg on its development branch,
 * with fill="currentColor" on the root <svg>. Portaliq is the exception:
 * its file is the store icon, because its img/app.svg is still the
 * nextcloud-app-template placeholder.
 *
 * Output: docusaurus-preset/src/data/app-glyphs.json, the data behind the
 * published <AppGlyph app="..."/> component. Shape per key:
 *
 *   { "inner": "<path fill=\"currentColor\" d=\"...\"/>", "viewBox": "0 0 24 24" }
 *
 * `inner` is the file's shapes. A shape that relied on the root fill gets
 * fill="currentColor" of its own, so the markup renders the same wherever
 * it is inlined.
 *
 * Keys written:
 *   1. one per glyph file, named after the current app id (info.xml <id>);
 *   2. one alias per old app id (ALIASES below), pointing at the same glyph,
 *      so a consumer still calling <AppGlyph app="docudesk"/> keeps rendering;
 *   3. every key already in the JSON that 1 and 2 do not produce, kept as-is
 *      (deskdesk, financeq, purchaseq, openanonymiser). Removing a key makes
 *      AppGlyph return null for it, so this script never removes one.
 *
 * Keys are sorted, the JSON is indented by 2 spaces and ends with a newline.
 * The script refuses markup it does not understand (a <g>, a comment inside
 * a shape, a real stroke) instead of guessing: AppGlyph forces stroke off,
 * so a stroked glyph would silently lose its outline.
 *
 * Usage, from the design-system root:
 *   node scripts/build-app-glyphs.mjs
 */
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLYPH_DIR = join(ROOT, 'brand/assets/apps/glyphs');
const OUT = join(ROOT, 'docusaurus-preset/src/data/app-glyphs.json');

/** Old app id -> current app id. The fleet rename of 2026-08-21/22. */
const ALIASES = {
  openconnector: 'integriq',
  docudesk: 'filinq',
  nldesign: 'thematiq',
  softwarecatalog: 'stackiq',
  larpingapp: 'larpinq',
  procest: 'dossiq',
  scholiq: 'learniq',
  decidesk: 'decidiq',
  openbuild: 'buildiq',
  doriath: 'keepiq',
  hrmq: 'humaniq',
  'app-versions': 'versioniq',
  planix: 'planninq',
};

const SHAPES = new Set(['path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line']);

/** Attributes written first, in this order; the rest keep their file order. */
const LEADING = ['fill', 'fill-rule'];

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function parseAttrs(file, source) {
  const attrs = [];
  const rest = source.replace(/([\w:-]+)\s*=\s*"([^"]*)"/g, (_, name, value) => {
    attrs.push([name, value]);
    return '';
  });
  if (rest.trim() !== '') {
    fail(file, `cannot read attributes: ${JSON.stringify(rest.trim())}`);
  }
  return attrs;
}

function readGlyph(file) {
  const source = readFileSync(join(GLYPH_DIR, file), 'utf8')
    .replace(/<\?xml[^>]*\?>/, '')
    .trim();
  const root = source.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/);
  if (!root) {
    fail(file, 'expected one root <svg> element');
  }
  const rootAttrs = new Map(parseAttrs(file, root[1]));
  const viewBox = rootAttrs.get('viewBox');
  if (!viewBox) {
    fail(file, 'the root <svg> has no viewBox');
  }
  const rootFill = rootAttrs.get('fill');
  if (rootFill !== 'currentColor') {
    fail(file, `the root <svg> must carry fill="currentColor", found ${JSON.stringify(rootFill)}`);
  }

  const shapes = [];
  let body = root[2].trim();
  while (body !== '') {
    const shape = body.match(/^<([a-z]+)\b([^>]*?)\s*\/>/);
    if (!shape) {
      fail(file, `expected a self-closing shape, found ${JSON.stringify(body.slice(0, 40))}`);
    }
    const [whole, tag, attrSource] = shape;
    if (!SHAPES.has(tag)) {
      fail(file, `<${tag}> is not a shape this script copies`);
    }
    const attrs = parseAttrs(file, attrSource).filter(([name, value]) => {
      if (name === 'stroke' && value === 'none') {
        return false; // a filled glyph has no stroke; AppGlyph forces it off anyway
      }
      if (name === 'stroke' || name.startsWith('stroke-')) {
        fail(file, `<${tag}> has ${name}="${value}"; glyphs must be filled outlines`);
      }
      return true;
    });
    if (!attrs.some(([name]) => name === 'fill')) {
      attrs.push(['fill', rootFill]);
    }
    attrs.sort((a, b) => rank(a[0]) - rank(b[0]));
    shapes.push(`<${tag} ${attrs.map(([name, value]) => `${name}="${value}"`).join(' ')}/>`);
    body = body.slice(whole.length).trim();
  }
  if (shapes.length === 0) {
    fail(file, 'no shapes');
  }
  return {inner: shapes.join(''), viewBox};
}

function rank(name) {
  const index = LEADING.indexOf(name);
  return index === -1 ? LEADING.length : index;
}

const produced = {};
for (const file of readdirSync(GLYPH_DIR).filter((name) => name.endsWith('.svg')).sort()) {
  produced[file.slice(0, -'.svg'.length)] = readGlyph(file);
}
for (const [oldId, currentId] of Object.entries(ALIASES)) {
  if (produced[oldId]) {
    throw new Error(`alias ${oldId} collides with a glyph file of the same name`);
  }
  if (!produced[currentId]) {
    throw new Error(`alias ${oldId} points at ${currentId}, which has no glyph file`);
  }
  produced[oldId] = produced[currentId];
}

const existing = JSON.parse(readFileSync(OUT, 'utf8'));
const merged = {...existing, ...produced};
const sorted = {};
for (const key of Object.keys(merged).sort()) {
  sorted[key] = merged[key];
}
writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);

const kept = Object.keys(existing).filter((key) => !(key in produced));
const added = Object.keys(produced).filter((key) => !(key in existing));
console.log(`app-glyphs.json: ${Object.keys(sorted).length} keys`);
console.log(`  from glyph files: ${Object.keys(produced).length - Object.keys(ALIASES).length}`);
console.log(`  old-id aliases:   ${Object.keys(ALIASES).length}`);
console.log(`  kept as-is:       ${kept.length} (${kept.join(', ') || 'none'})`);
console.log(`  new keys:         ${added.length} (${added.join(', ') || 'none'})`);
