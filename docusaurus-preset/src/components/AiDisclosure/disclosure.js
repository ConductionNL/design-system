/**
 * disclosure.js — pure resolver + copy/asset tables for AiDisclosure.
 *
 * No React and no webpack-only imports (no `?url` SVG imports) live
 * here on purpose: this module is `require()`-able directly by
 * Node's built-in test runner, and `import`-able from the JSX
 * component via CommonJS/ESM interop. Keeping the decision logic and
 * the copy register out of the component is what makes tasks 5.1-5.4
 * testable without spinning up a bundler.
 *
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-1.2
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-2.1
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-2.2
 * @spec openspec/changes/ai-content-disclosure/tasks.md#task-3.3
 */

'use strict';

// The three values the `ai` frontmatter key accepts. Anything else -
// including an empty string - is an unrecognised value per the spec's
// "An unrecognised value fails loudly and renders nothing" requirement.
const AI_KINDS = ['generated', 'modified', 'assisted'];

// kind -> vendored icon filename prefix (see static/img/ai-disclosure/
// PROVENANCE.md). "assisted" maps to the Commission's Basic mark,
// whose vendored files carry no kind segment in the filename
// (`ai-black.svg`, not `ai-basic-black.svg`).
const KIND_TO_FILE_PREFIX = {
  generated: 'ai-generated',
  modified: 'ai-modified',
  assisted: 'ai',
};

const TREATMENTS = ['black', 'white', 'black-transparent', 'white-transparent'];

// Source viewBox dimensions per mark (icons/PROVENANCE.md). Each mark
// has its own aspect ratio; a single uniform box would stretch two of
// the three marks.
const VIEWBOX = {
  assisted: {width: 566.93, height: 566.93},
  modified: {width: 1700.79, height: 566.93},
  generated: {width: 1789.84, height: 566.93},
};

// Three kinds x four locales. Every string states a fact about the
// page and stops - no compliance claim, no Code-of-Practice claim.
// See design.md "The thing most likely to be got wrong".
const COPY = {
  nl: {
    generated: 'Deze pagina is gegenereerd met AI.',
    modified: 'Deze pagina is gedeeltelijk aangepast met AI.',
    assisted: 'Deze pagina is geschreven met hulp van AI.',
  },
  en: {
    generated: 'This page was generated with AI.',
    modified: 'This page was partially modified with AI.',
    assisted: 'This page was written with AI assistance.',
  },
  de: {
    generated: 'Diese Seite wurde mit KI erstellt.',
    modified: 'Diese Seite wurde teilweise mit KI bearbeitet.',
    assisted: 'Diese Seite wurde mit KI-Unterstützung geschrieben.',
  },
  fr: {
    generated: "Cette page a été générée avec l'IA.",
    modified: "Cette page a été partiellement modifiée avec l'IA.",
    assisted: "Cette page a été rédigée avec l'aide de l'IA.",
  },
};

const LOCALES = Object.keys(COPY);

function isValidKind(value) {
  return AI_KINDS.indexOf(value) !== -1;
}

/**
 * Resolve a page's `ai` frontmatter value.
 *
 * Absence (`undefined`) is the normal opt-out case: no banner, no
 * warning. A *present* but unrecognised value (unknown string, empty
 * string) is a defect - it warns, naming the file, the offending
 * value, and the permitted values, and still resolves to no kind. It
 * never falls back to a mark: a typo must not become a published
 * authorship claim.
 *
 * @param {string|undefined} rawValue - the page's frontmatter `ai` value
 * @param {string} sourcePath - the doc/blog source file, for the warning
 * @returns {{kind: string|null, warning: string|null}}
 */
function resolveAiFrontmatter(rawValue, sourcePath) {
  if (rawValue === undefined) {
    return {kind: null, warning: null};
  }
  if (isValidKind(rawValue)) {
    return {kind: rawValue, warning: null};
  }
  const file = sourcePath || 'unknown file';
  const shown = rawValue === '' ? '(empty)' : JSON.stringify(rawValue);
  const warning =
    `[ai-content-disclosure] ${file}: unrecognised "ai" frontmatter value ${shown} - ` +
    `permitted values are ${AI_KINDS.join(', ')}. Rendering no disclosure banner.`;
  return {kind: null, warning};
}

function getIconFilename(kind, treatment) {
  if (!isValidKind(kind)) {
    throw new Error(`getIconFilename: unknown kind "${kind}"`);
  }
  if (TREATMENTS.indexOf(treatment) === -1) {
    throw new Error(`getIconFilename: unknown treatment "${treatment}"`);
  }
  return `${KIND_TO_FILE_PREFIX[kind]}-${treatment}.svg`;
}

// Site-relative (no leading slash) path under `static/`. The marks are
// served as plain static files - not run through webpack's `.svg`
// pipeline - because this preset also enables @docusaurus/plugin-svgr
// (via the classic preset), which unconditionally turns any `.svg`
// imported from a JS/JSX/MDX file into a React component, regardless
// of a `?url` suffix. An inlined SVGR component would also reuse
// unscoped `.cls-N { fill: ... }` class names across every mark on the
// page (see static/img/ai-disclosure/PROVENANCE.md), so two different
// marks rendered together could bleed colours into each other. A
// plain `<img src>` pointed at an untouched static file avoids both
// problems and is the same mechanism this preset already uses for the
// favicon and the default og:image (see static/img/).
const ICONS_BASE_PATH = 'img/ai-disclosure';

function getIconPath(kind, treatment) {
  return `${ICONS_BASE_PATH}/${getIconFilename(kind, treatment)}`;
}

function getViewBox(kind) {
  if (!isValidKind(kind)) {
    throw new Error(`getViewBox: unknown kind "${kind}"`);
  }
  return VIEWBOX[kind];
}

/**
 * Copy for one kind in one locale. No fallback: every locale in
 * LOCALES must carry all three kinds (asserted by the locale-coverage
 * test), so an undefined return here means the COPY table itself is
 * incomplete, not that a reader silently sees a leaked English string.
 */
function getCopy(kind, locale) {
  if (!isValidKind(kind)) {
    throw new Error(`getCopy: unknown kind "${kind}"`);
  }
  const table = COPY[locale];
  return table ? table[kind] : undefined;
}

module.exports = {
  AI_KINDS,
  TREATMENTS,
  LOCALES,
  KIND_TO_FILE_PREFIX,
  VIEWBOX,
  COPY,
  ICONS_BASE_PATH,
  isValidKind,
  resolveAiFrontmatter,
  getIconFilename,
  getIconPath,
  getViewBox,
  getCopy,
};
