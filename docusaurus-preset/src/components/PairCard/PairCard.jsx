/**
 * <PairCard /> + <PairRow />
 *
 * Compact "related item" card from preview/components/pair-cards.html.
 * Used as the "Pairs well with" / "See also" row on app and solution
 * detail pages. Smaller and denser than <AppCard/>.
 *
 * Visual: cobalt icon-hex on the left, name + why on the right.
 *
 * Usage:
 *
 *   <PairRow>
 *     <PairCard
 *       href="/apps/opencatalogi"
 *       icon={<svg>...</svg>}
 *       name="OpenCatalogi"
 *       why="Surfaces every register as a public, searchable catalog entry."
 *     />
 *   </PairRow>
 */

import React from 'react';
import styles from './PairCard.module.css';

export function PairRow({columns = 3, children, className}) {
  const composed = [styles.row, styles['cols-' + columns], className].filter(Boolean).join(' ');
  return <div className={composed}>{children}</div>;
}

export default function PairCard({href, icon, name, why, className}) {
  const Tag = href ? 'a' : 'div';
  return (
    <Tag href={href} className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.iconWrap}>{icon}</div>
      <div>
        {name && <div className={styles.name}>{name}</div>}
        {why && <div className={styles.why}>{why}</div>}
      </div>
    </Tag>
  );
}
