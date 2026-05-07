/**
 * <Prerequisites /> + <PrerequisiteItem />
 *
 * Tinted card with a checklist of things the reader needs before
 * starting an academy tutorial. Replaces the ad-hoc "What you need"
 * h2 + bullet list pattern that was duplicated across tutorials.
 *
 * Each item renders with a small hex-bullet on the left so the list
 * reads as a checklist instead of generic prose. The card uses the
 * cobalt-50 tinted-surface tone, matching <FeatureList/> and
 * <FAQ/> on academy pages.
 *
 * Usage:
 *
 *   <Prerequisites title="Wat je nodig hebt">
 *     <PrerequisiteItem>
 *       Een werkend Woo-register. Volg eerst <a href="...">Een Woo-register opzetten</a> als je dat nog niet hebt.
 *     </PrerequisiteItem>
 *     <PrerequisiteItem>Een publicatie-object met bekende UUID</PrerequisiteItem>
 *     <PrerequisiteItem><code>curl</code>, basisauth, en een paar testbestanden</PrerequisiteItem>
 *   </Prerequisites>
 *
 * Mirrors the .prerequisites section in
 * preview/components/prerequisites.html.
 */

import React from 'react';
import styles from './Prerequisites.module.css';

export function PrerequisiteItem({children, className}) {
  const composed = [styles.item, className].filter(Boolean).join(' ');
  return (
    <li className={composed}>
      <span className={styles.bullet} aria-hidden="true" />
      <span className={styles.body}>{children}</span>
    </li>
  );
}

export default function Prerequisites({title = 'What you need', children, className}) {
  const composed = [styles.card, className].filter(Boolean).join(' ');
  return (
    <aside className={composed}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <ul className={styles.list}>{children}</ul>
    </aside>
  );
}
