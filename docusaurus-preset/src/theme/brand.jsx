/**
 * Sub-brand detection for the Conduction hub.
 *
 * The hub at conduction.nl hosts ConNext and Common Ground vanity
 * sections at /connext and /commonground (with locale-prefixed twins
 * at /nl/connext and /nl/commonground). When a visitor is browsing
 * inside a sub-brand section, the navbar wordmark and the footer
 * brand block both switch to that sub-brand's mark. Outside any
 * sub-brand section the default (Conduction, or whatever
 * navbar.title is set to) wins.
 *
 * Both the Navbar and Footer swizzles import from here so the
 * regex, wordmark JSX, and label stay in one place.
 */

import React from 'react';

export const SUB_BRANDS = [
  {
    name: 'connext',
    match: /^(?:\/nl)?\/connext(?:\/|$)/,
    home: '/connext',
    label: 'ConNext',
    wordmark: (
      <>
        Con<span className="next-blue">Next</span>
      </>
    ),
  },
  {
    name: 'commonground',
    match: /^(?:\/nl)?\/commonground(?:\/|$)/,
    home: '/commonground',
    label: 'Common Ground+',
    wordmark: (
      <>
        <span className="cg-plus-common">Common</span>{' '}
        <span className="cg-yellow">Ground</span>
        <span className="cg-plus-plus">+</span>
      </>
    ),
  },
];

/**
 * Pick the sub-brand active for a pathname. Falls back to title-based
 * detection so a site whose primary brand IS a sub-brand (e.g. its
 * navbar.title is set to 'ConNext') still gets the styled wordmark.
 *
 * Returns the matched SUB_BRANDS entry, or null if no match (default
 * means the consumer should fall back to its own default text).
 */
export function brandFor(pathname, title) {
  for (const b of SUB_BRANDS) {
    if (b.match.test(pathname)) return {...b, source: 'path'};
  }
  if (title) {
    for (const b of SUB_BRANDS) {
      if (b.label === title) return {...b, source: 'title'};
    }
  }
  return null;
}

/**
 * Conduction product-app wordmark patterns. The brand convention,
 * codified in preview/apps.html, is to render the prefix syllable in
 * cobalt-400 / regular weight and the rest in blue-cobalt / bold:
 *
 *   <span class="light">Open</span>Register
 *   <span class="light">Docu</span>Desk
 *   <span class="light">My</span>Dash
 *
 * This list covers the prefixes used across the Conduction fleet.
 * Sites whose wordmark doesn't start with one of these (e.g. Shillinq,
 * Decidesk) keep the whole wordmark in blue-cobalt unless they pass
 * an explicit `navbar.brandPrefix` to override.
 */
const PRODUCT_PREFIXES = [
  'OpenAI',    /* must precede 'Open' so 'OpenAI Bridge' splits as OpenAI/Bridge */
  'Open',
  'Docu',
  'My',
  'Pipe',
  'Pro',
  'Decid',
  'Schol',
  'Larping',
];

/**
 * Split a wordmark into (prefix, rest) so the prefix can render in the
 * cobalt-400 "light" treatment. `brandPrefix` (optional) overrides
 * auto-detection — sites with a non-standard wordmark pass it
 * explicitly. Returns `null` when no split applies (single-word
 * wordmarks or unrecognised prefixes); callers should render the
 * wordmark as-is in that case.
 */
export function productWordmark(title, brandPrefix) {
  if (!title) return null;
  if (brandPrefix && title.startsWith(brandPrefix) && title.length > brandPrefix.length) {
    return {prefix: brandPrefix, rest: title.slice(brandPrefix.length)};
  }
  for (const p of PRODUCT_PREFIXES) {
    if (title.startsWith(p) && title.length > p.length) {
      return {prefix: p, rest: title.slice(p.length)};
    }
  }
  return null;
}
