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
import {useColorMode} from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './AiDisclosure.module.css';
import {isValidKind, getCopy, getViewBox, getIconPath, AI_KINDS} from './disclosure';

export default function AiDisclosure({kind, className}) {
  const {colorMode} = useColorMode();
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const isKindValid = isValidKind(kind);
  // Dark-ink mark on light surfaces, light-ink mark on dark surfaces -
  // the opaque treatments (not the transparent ones) so the mark
  // reads correctly regardless of what sits behind the banner panel.
  const treatment = colorMode === 'dark' ? 'white' : 'black';
  // Served as a plain static file (static/img/ai-disclosure/), not a
  // webpack `.svg` import - see disclosure.js's ICONS_BASE_PATH
  // comment for why. useBaseUrl() must run unconditionally (React
  // hooks rule), so it's called even when kind is invalid; the result
  // is simply unused in that branch.
  const iconPath = useBaseUrl(getIconPath(isKindValid ? kind : 'assisted', treatment));

  if (!isKindValid) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[ai-content-disclosure] <AiDisclosure> received an unknown kind ${JSON.stringify(kind)}; ` +
          `expected one of ${AI_KINDS.join(', ')}. Rendering nothing.`,
      );
    }
    return null;
  }

  const {width, height} = getViewBox(kind);
  const copy = getCopy(kind, locale);

  return (
    <div className={[styles.disclosure, className].filter(Boolean).join(' ')} role="note">
      <img
        src={iconPath}
        alt=""
        className={styles.mark}
        style={{aspectRatio: `${width} / ${height}`}}
      />
      <p className={styles.copy}>{copy}</p>
    </div>
  );
}
