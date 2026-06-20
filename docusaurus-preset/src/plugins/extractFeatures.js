/**
 * @conduction/docusaurus-preset/plugins/extractFeatures
 *
 * Build-time port of the org-wide `scripts/extract-features.py`
 * (https://codeberg.org/Conduction/.github). Derives the published feature
 * list directly from an app's `openspec/specs/<slug>/spec.md` files so the
 * docs `/features` page is ALWAYS generated from the current specs — the
 * committed `docs/features.json` is no longer a hand-maintained source of
 * truth that can drift.
 *
 * Only specs whose YAML frontmatter declares `status: done` are emitted
 * (the canonical "shipped" status). Each entry: { slug, title, summary,
 * docsUrl } — identical shape and ordering (sorted by slug) to the Python
 * extractor, so docs output matches CI output byte-for-byte.
 *
 * Returns null when the directory is absent or holds no done specs, so the
 * caller can fall back to a committed file on deploys that ship without
 * `openspec/`.
 */

const fs = require('fs');
const path = require('path');

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?\n)---\s*\n([\s\S]*)$/;

function parseSpec(specPath, slug) {
  let text;
  try {
    text = fs.readFileSync(specPath, 'utf8');
  } catch (e) {
    return null;
  }

  const fm = FRONTMATTER_RE.exec(text);
  if (fm === null) return null;
  const front = fm[1];
  const body = fm[2];

  const statusMatch = front.match(/^status:\s*(.+?)\s*$/m);
  const status = statusMatch ? statusMatch[1].trim().replace(/^["']|["']$/g, '').toLowerCase() : '';
  if (status !== 'done') return null;

  const titleMatch = body.match(/^#\s+(.+?)\s*$/m);
  const rawTitle = titleMatch ? titleMatch[1].trim() : slug;
  const title = rawTitle.replace(/\s+specification\s*$/i, '').trim();

  let summary = '';
  const purposeHeading = body.match(/^##\s+Purpose\s*$/m);
  if (purposeHeading) {
    const rest = body.slice(purposeHeading.index + purposeHeading[0].length);
    const nextHeadingIdx = rest.search(/\n##\s/);
    const section = (nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx)).trim();
    const firstPara = section.split(/\n\s*\n/)[0] || '';
    summary = firstPara.trim().split(/\s+/).join(' ');
  }

  return {
    slug,
    title,
    summary,
    docsUrl: `openspec/specs/${slug}/spec.md`,
  };
}

/**
 * @param {string} specsDir Absolute path to `<app>/openspec/specs`.
 * @returns {Array<{slug,title,summary,docsUrl}>|null}
 */
function extractFeatures(specsDir) {
  let slugs;
  try {
    if (!fs.statSync(specsDir).isDirectory()) return null;
    slugs = fs.readdirSync(specsDir).sort();
  } catch (e) {
    return null;
  }

  const entries = [];
  for (const slug of slugs) {
    const specPath = path.join(specsDir, slug, 'spec.md');
    let entry = null;
    try {
      if (fs.statSync(specPath).isFile()) {
        entry = parseSpec(specPath, slug);
      }
    } catch (e) {
      entry = null;
    }
    if (entry !== null) entries.push(entry);
  }

  return entries.length > 0 ? entries : null;
}

module.exports = { extractFeatures };
