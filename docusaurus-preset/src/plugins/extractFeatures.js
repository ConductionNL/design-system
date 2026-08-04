/**
 * @conduction/docusaurus-preset/plugins/extractFeatures
 *
 * Build-time port of the org-wide `scripts/extract-features.py`
 * (https://codeberg.org/Conduction/.github). Derives the published feature
 * list for the docs `/features` page from two sources, in priority order:
 *
 *   1. Commercial overlay — `openspec/features.overlay.json` (optional). When
 *      present it is the AUTHORITATIVE curated list: honest maturity,
 *      brand-voiced NL/EN benefit copy, roadmap rows, and capabilities
 *      provided by another app (e.g. OpenRegister's AI assistants and content
 *      leaves surfaced through a consuming app, via `providedBy`).
 *   2. Spec derivation (fallback) — `openspec/specs/<slug>/spec.md`. Hardened:
 *      internal/process specs are filtered out, engineering artifacts
 *      (`@e2e`, `#<pr>`, `Spec:`, em-dashes, `TBD`) are stripped, and optional
 *      frontmatter fields (`commercial`, `maturity`, `title`, `summary`,
 *      `provided-by`, `*_nl`) let an author curate without an overlay.
 *
 * Maturity is one of stable (mint) / beta (blue) / soon (orange). Each entry:
 * { slug, title, summary, status, docsUrl } plus optional { providedBy,
 * title_nl, summary_nl }. Overlay order is preserved; spec-derived entries are
 * sorted by slug. Mirrors the Python extractor so docs output matches CI.
 *
 * Returns null when nothing is available, so the caller can fall back to a
 * committed `docs/features.json` on deploys shipped without `openspec/`.
 */

const fs = require('fs');
const path = require('path');

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?\n)---\s*\n([\s\S]*)$/;
const SLUGGY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;

// Fallback map: spec lifecycle status -> buyer-facing maturity. Used only when
// a spec has no explicit `maturity:` and the app has no overlay.
const STATUS_KIND = {
  done: 'stable', implemented: 'stable', reviewed: 'stable', active: 'stable', stable: 'stable',
  'in-progress': 'beta', implementing: 'beta', partial: 'beta', beta: 'beta',
  draft: 'soon', specified: 'soon', proposed: 'soon', planned: 'soon', 'coming-soon': 'soon', soon: 'soon',
};

const VALID_MATURITY = new Set(['stable', 'beta', 'soon']);

const ACRONYMS = new Set([
  'ai', 'api', 'ui', 'ux', 'or', 'bi', 'mcp', 'tmlo', 'mdto', 'dcat', 'woo',
  'vth', 'kcc', 'crm', 'pdf', 'csv', 'sepa', 'zgw', 'ztc', 'dso', 'rbac',
  'gdpr', 'avg', 'kvk', 'brp', 'sso', 'jwt', 'cli', 'ocr', 'ner', 'kpi',
  'saas', 'oas', 'json', 'xml', 'html', 'css', 'url', 'http', 'https', 'id',
  'pwa', 'sip', 'eml', 'sla', 'llm', 'rag', 'e2e', 'qr', 'vng',
]);

// Slug segments that mark an internal/process spec (filtered unless the spec
// sets `commercial: true` or an overlay re-includes it).
const INTERNAL_SEGMENTS = new Set([
  'refactor', 'refactoring', 'migrate', 'migration', 'migrations', 'migrated',
  'test', 'tests', 'testing', 'e2e', 'ci', 'cd', 'docs', 'documentation',
  'manifest', 'plumbing', 'scaffold', 'scaffolding', 'bootstrap', 'chore',
  'cleanup', 'rename', 'renaming', 'bump', 'deps', 'dependency',
  'dependencies', 'lint', 'linting', 'coverage', 'gate', 'gates', 'seed',
  'seeding', 'fixture', 'fixtures', 'spike', 'poc', 'tooling', 'devx',
  'internal',
]);

function field(front, key) {
  const re = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(.+?)\\s*$`, 'm');
  const m = front.match(re);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

function boolField(front, key) {
  const raw = field(front, key);
  if (raw === null) return null;
  return ['true', 'yes', '1'].includes(raw.trim().toLowerCase());
}

function titlecaseSlug(slug) {
  return slug
    .split('-')
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function stripArtifacts(text) {
  if (!text) return '';
  let t = text;
  t = t.replace(/@e2e\b[^\n.]*/gi, '');
  t = t.replace(/\(?#\d+\)?/g, '');
  t = t.replace(/\b(?:delta\s+)?spec:\s*/gi, '');
  t = t.replace(/`/g, '');
  t = t.replace(/\s*--\s*/g, ', ');
  t = t.replace(/\s*[—]\s*/g, '. ');
  t = t.replace(/\b(?:TODO|TBD)\b/gi, '');
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/\s+([.,;:])/g, '$1');
  t = t.replace(/\.\s*\./g, '.');
  return t.replace(/^[\s.,;:-]+|[\s.,;:-]+$/g, '');
}

function cleanTitle(rawTitle, slug) {
  let title = rawTitle.replace(/^\s*(?:delta\s+)?spec:\s*/i, '').replace(/\s+specification\s*$/i, '').trim();
  title = stripArtifacts(title);
  title = title.split('. ')[0].trim().replace(/\.$/, '');
  if (!title || title === slug || SLUGGY_RE.test(title)) title = titlecaseSlug(slug);
  return title;
}

function firstSentence(summary) {
  let s = stripArtifacts(summary);
  if (!s) return '';
  const m = s.match(/^as an? .*? so that (.+)$/i);
  if (m) s = m[1].trim();
  s = s.split('. ')[0].trim();
  if (!s || ['tbd', 'todo', 'purpose'].includes(s.toLowerCase())) return '';
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!s.endsWith('.')) s += '.';
  return s;
}

function isInternalSlug(slug) {
  return slug.split('-').some((seg) => INTERNAL_SEGMENTS.has(seg));
}

function attachOptional(entry, providedBy, titleNl, summaryNl) {
  if (providedBy) entry.providedBy = providedBy;
  if (titleNl) entry.title_nl = titleNl;
  if (summaryNl) entry.summary_nl = summaryNl;
  return entry;
}

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

  const commercial = boolField(front, 'commercial');
  if (commercial === false) return null;

  const status = (field(front, 'status') || '').toLowerCase();
  const maturity = (field(front, 'maturity') || '').toLowerCase();
  let kind = VALID_MATURITY.has(maturity) ? maturity : STATUS_KIND[status];
  if (!kind) kind = commercial === true ? 'beta' : null;
  if (!kind) return null;

  if (isInternalSlug(slug) && commercial !== true) return null;

  const titleOverride = field(front, 'title');
  let title;
  if (titleOverride) {
    title = stripArtifacts(titleOverride) || titlecaseSlug(slug);
  } else {
    const titleMatch = body.match(/^#\s+(.+?)\s*$/m);
    const rawTitle = titleMatch ? titleMatch[1].trim() : slug;
    title = cleanTitle(rawTitle, slug);
  }

  const summaryOverride = field(front, 'summary') || field(front, 'tagline');
  let summary = '';
  if (summaryOverride) {
    summary = firstSentence(summaryOverride);
  } else {
    const purposeHeading = body.match(/^##\s+Purpose\s*$/m);
    if (purposeHeading) {
      const rest = body.slice(purposeHeading.index + purposeHeading[0].length);
      const nextHeadingIdx = rest.search(/\n##\s/);
      const section = (nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx)).trim();
      const firstPara = section.split(/\n\s*\n/)[0] || '';
      summary = firstSentence(firstPara);
    }
  }

  const entry = {
    slug,
    title,
    summary,
    status: kind,
    docsUrl: `openspec/specs/${slug}/spec.md`,
  };
  return attachOptional(
    entry,
    field(front, 'provided-by') || field(front, 'providedBy'),
    field(front, 'title_nl'),
    firstSentence(field(front, 'summary_nl') || field(front, 'tagline_nl') || ''),
  );
}

function normalizeOverlayEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let slug = String(raw.slug || '').trim();
  let status = String(raw.status || '').trim().toLowerCase();
  if (!VALID_MATURITY.has(status)) status = STATUS_KIND[status] || 'stable';
  const title = String(raw.title || '').trim() || (slug ? titlecaseSlug(slug) : '');
  if (!title) return null;
  if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const entry = {
    slug,
    title,
    summary: String(raw.summary || '').trim(),
    status,
    docsUrl: String(raw.docsUrl || `openspec/specs/${slug}/spec.md`),
  };
  return attachOptional(
    entry,
    raw.providedBy,
    raw.title_nl ? String(raw.title_nl).trim() : null,
    raw.summary_nl ? String(raw.summary_nl).trim() : null,
  );
}

function loadOverlay(specsDir) {
  const overlayPath = path.resolve(specsDir, '..', 'features.overlay.json');
  let data;
  try {
    if (!fs.statSync(overlayPath).isFile()) return null;
    data = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
  } catch (e) {
    return null;
  }
  const rawList = Array.isArray(data) ? data : (data && data.features);
  if (!Array.isArray(rawList)) return null;
  const entries = rawList.map(normalizeOverlayEntry).filter((e) => e !== null);
  return entries.length > 0 ? entries : null;
}

/**
 * @param {string} specsDir Absolute path to `<app>/openspec/specs`.
 * @returns {Array<object>|null}
 */
function extractFeatures(specsDir) {
  const overlay = loadOverlay(specsDir);
  if (overlay !== null) return overlay;

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

module.exports = {extractFeatures};
