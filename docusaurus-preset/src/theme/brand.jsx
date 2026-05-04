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
    label: 'Common Ground',
    wordmark: (
      <>
        Common <span className="cg-yellow">Ground</span>
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
