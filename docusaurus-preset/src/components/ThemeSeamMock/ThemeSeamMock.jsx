/**
 * <ThemeSeamMock />
 *
 * One application, twice: the stock Conduction finish underneath, a
 * second design system stitched over the top of it. A seam travels
 * across the frame and the surface behind it changes finish, then the
 * loop hands the frame back.
 *
 * The mock makes one argument, and it is the argument Thematiq makes:
 * an application that paints from tokens rethemes when the tokens
 * change. Nothing here restyles a component. The themed layer is the
 * same <AppMock /> inside a wrapper that redefines the palette and
 * radius tokens, which is exactly what installing a token set does to
 * a Nextcloud.
 *
 * Usage:
 *
 *   <ThemeSeamMock app="openregister" theme="lasuite" />
 *   <ThemeSeamMock app="nldesign" size="sm" running={false} />
 *
 * Props:
 *   - app:     an AppMock slug (default 'openregister')
 *   - theme:   a key of THEMES (default 'lasuite') — the finish that
 *              is stitched over the stock one
 *   - size:    'sm' | 'md' (default) — forwarded to AppMock
 *   - running: boolean (default true). false renders the themed end
 *              state with the seam at rest, the same thing
 *              prefers-reduced-motion gives.
 *   - label:   optional caption under the frame
 *   - className: string
 *
 * Both layers run their own AppMock with `running={false}`: the
 * variant's own loop would compete with the seam for attention, and
 * the two layers have to stay in identical states or the wipe reveals
 * a different screen instead of a different finish.
 */

import React from 'react';
import AppMock from '../AppMock/AppMock.jsx';
import styles from './ThemeSeamMock.module.css';

/* Each theme is a class on the themed layer that redefines tokens.
   Adding one is a CSS block plus a line here, never a new component. */
const THEMES = {
  lasuite: {className: 'lasuite', label: 'La Suite'},
};

export default function ThemeSeamMock({
  app = 'openregister',
  theme = 'lasuite',
  size = 'md',
  running = true,
  label,
  className,
}) {
  const resolvedTheme = THEMES[theme] || THEMES.lasuite;
  const composed = [
    styles.seamScene,
    styles[`size-${size}`],
    !running && styles.static,
    className,
  ].filter(Boolean).join(' ');

  return (
    <figure className={composed}>
      <div className={styles.stack}>
        <div className={styles.layer}>
          <AppMock app={app} size={size} running={false} />
        </div>
        <div className={[styles.layer, styles.themed, styles[resolvedTheme.className]].join(' ')}>
          <AppMock app={app} size={size} running={false} />
        </div>
        {/* The seam itself: the stitch line the two halves meet on. */}
        <span className={styles.seam} aria-hidden="true" />
      </div>
      {label && <figcaption className={styles.caption}>{label}</figcaption>}
    </figure>
  );
}
