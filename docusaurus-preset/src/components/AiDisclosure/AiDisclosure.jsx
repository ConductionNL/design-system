/**
 * <AiDisclosure />
 *
 * Renders one of the three official EU Article-50 marks (Basic,
 * Partially AI-Modified, Fully AI-Generated) plus a short factual
 * line of copy. This is the single rendering path for the feature:
 * the `ai` frontmatter key (see the DocItem/Content and
 * BlogPostItem/Content theme swizzles) resolves to the same component
 * an author can drop inline in MDX, so the page-top banner and an
 * inline mark can never drift apart (design.md D1).
 *
 * The copy states what happened to the page and stops there - it
 * does not, and must not, claim EU AI Act compliance or Code-of-
 * Practice adherence (see disclosure.js COPY and
 * static/img/ai-disclosure/PROVENANCE.md). Do not hand-edit strings
 * here; edit the COPY table in ./disclosure.js so the denylist test
 * covers every value.
 *
 * Usage:
 *
 *   import { AiDisclosure } from '@conduction/docusaurus-preset/components';
 *
 *   <AiDisclosure kind="modified" />
 *
 * Props:
 *   - kind: 'generated' | 'modified' | 'assisted'   (required)
 *   - className: string
 *
 * An unrecognised `kind` warns via console.warn and renders nothing -
 * it never falls back to a mark (spec: "An unrecognised value fails
 * loudly and renders nothing").
 */

import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './AiDisclosure.module.css';
import {isValidKind, getCopy, getLinkText, LINK_HREF, AI_KINDS} from './disclosure';

// The Commission's own AI letterforms, lifted verbatim from the
// vendored Basic mark (static/img/ai-disclosure/ai-black.svg, paths 2
// and 3) so the glyph a reader recognises is unchanged. What is
// replaced is only the container: the Commission's black disc becomes
// Conduction's hexagon in neutral grey, matching the hex used for app
// glyphs across the design system.
//
// Both live in the mark's original 566.93 viewBox, so the letterforms
// keep their exact position and proportion inside the new container.
// The hexagon is regular, centred on the disc's own centre
// (272.03, 283.46) with a circumradius of 200 - larger than the disc's
// 182.74 because a hexagon's inradius is only 0.866 of its
// circumradius, and the letters need the vertical room.
const HEX_PATH =
  'M472.03,283.46 L372.03,456.67 L172.03,456.67 L72.03,283.46 L172.03,110.25 L372.03,110.25 Z';
const AI_LETTER_A =
  'M170.79,353.74c-1.08,0-2.05-.43-2.92-1.31-.88-.87-1.31-1.84-1.31-2.92,0-.67.07-1.27.2-1.81l47.34-129.32c.4-1.48,1.24-2.79,2.52-3.93,1.27-1.14,3.05-1.71,5.34-1.71h29.81c2.28,0,4.06.57,5.34,1.71,1.27,1.14,2.11,2.45,2.52,3.93l47.14,129.32c.27.54.4,1.14.4,1.81,0,1.08-.44,2.05-1.31,2.92s-1.91,1.31-3.12,1.31h-24.78c-2.01,0-3.52-.5-4.53-1.51-1.01-1.01-1.65-1.91-1.91-2.72l-7.86-20.55h-53.78l-7.65,20.55c-.27.81-.88,1.71-1.81,2.72-.94,1.01-2.55,1.51-4.83,1.51h-24.78ZM218.13,299.96h37.47l-18.93-53.18-18.53,53.18Z';
const AI_LETTER_I =
  'M328.11,353.74c-1.48,0-2.69-.47-3.63-1.41-.94-.94-1.41-2.15-1.41-3.63v-130.93c0-1.48.47-2.68,1.41-3.63s2.15-1.41,3.63-1.41h26.99c1.48,0,2.68.47,3.63,1.41.94.94,1.41,2.15,1.41,3.63v130.93c0,1.48-.47,2.69-1.41,3.63-.94.94-2.15,1.41-3.63,1.41h-26.99Z';

export default function AiDisclosure({kind, className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const isKindValid = isValidKind(kind);
  // useBaseUrl() must run unconditionally (React hooks rule), so it is
  // called even when kind is invalid; the result is unused in that branch.
  const href = useBaseUrl(LINK_HREF);

  if (!isKindValid) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[ai-content-disclosure] <AiDisclosure> received an unknown kind ${JSON.stringify(kind)}; ` +
          `expected one of ${AI_KINDS.join(', ')}. Rendering nothing.`,
      );
    }
    return null;
  }

  const copy = getCopy(kind, locale);
  const linkText = getLinkText(locale);

  return (
    <div className={[styles.disclosure, className].filter(Boolean).join(' ')} role="note">
      {/* One mark for all three kinds and both colour modes: the kind is
          stated in the copy, and grey-on-white reads the same as
          grey-on-dark, so there is no treatment to switch. */}
      <svg
        className={styles.mark}
        viewBox="0 0 566.93 566.93"
        role="img"
        aria-label="AI"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg">
        <path className={styles.markHex} d={HEX_PATH} />
        <path className={styles.markGlyph} fillRule="evenodd" d={AI_LETTER_A} />
        <path className={styles.markGlyph} d={AI_LETTER_I} />
      </svg>
      <p className={styles.copy}>
        {copy}{' '}
        <a className={styles.link} href={href}>
          {linkText}
        </a>
      </p>
    </div>
  );
}
