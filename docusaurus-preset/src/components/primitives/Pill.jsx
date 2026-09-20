/**
 * <Pill />
 *
 * Inline-flex pill chip with optional leading <HexBullet/>. Used for
 * status badges (STABLE / BETA), built-on app tags, sector labels,
 * version tags. Recurs in reference-cards.css, solution-cards.css,
 * partner-cards.css, apps-grid.css, app-card meta line.
 *
 * Tones:
 *   - default:  cobalt-50 bg, cobalt-700 text, mono caps
 *   - status:   colored hex bullet (green=stable, orange=beta, blue=soon)
 *   - solid:    colored bg fill (used for sector tags)
 *
 * Usage:
 *
 *   <Pill bullet>STABLE</Pill>
 *   <Pill bullet bulletColor="var(--c-orange-knvb)">BETA</Pill>
 *   <Pill tone="solid" color="var(--c-mkb)">MKB</Pill>
 */

import React from 'react';
import HexBullet from './HexBullet';
import styles from './Pill.module.css';

export default function Pill({
  bullet = false,
  bulletColor,
  tone = 'default',
  color,
  className,
  style,
  children,
  ...rest
}) {
  const composed = [styles.pill, styles['tone-' + tone], className].filter(Boolean).join(' ');
  /* `style` is taken as its own prop and MERGED, not left in `...rest`.
     Spread after the computed style it replaced the whole object, so a
     caller writing `<Pill tone="solid" color="var(--c-gold-500)"
     style={{color: '...'}}>` silently lost the gold background and fell back
     to the blue-cobalt fill in .tone-solid. Measured on /nl/support/
     2026-09-20: the intended dark-on-gold badge rendered as cobalt-900 on
     blue at 1.97:1, and the `color` prop looked like it was being ignored
     when it was in fact being discarded.

     The caller's own declarations win, which is what lets a solid pill on a
     light fill (gold, mint) carry dark ink: white is only a default, and on
     those fills it does not reach 4.5:1. */
  const base = tone === 'solid' && color ? {background: color, color: 'white'} : null;
  const merged = base || style ? {...base, ...style} : undefined;
  return (
    <span className={composed} style={merged} {...rest}>
      {bullet && <HexBullet size="sm" color={bulletColor} />}
      <span className={styles.label}>{children}</span>
    </span>
  );
}
