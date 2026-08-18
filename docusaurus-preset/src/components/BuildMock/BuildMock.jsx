/**
 * <BuildMock />
 *
 * Token-built abstract of the OpenBuild "make it yours" moment: the
 * orange edit button gets pressed, a small component palette opens, a
 * widget is picked and dragged onto the page, and it snaps into the
 * empty layout slot. Loops every ~8 seconds. Used on every app's
 * Make-it-yours card.
 *
 * Same abstraction level as <AppMock>: greeked content, tokens only.
 * The orange FAB is this component's single orange accent (it *is*
 * the OpenBuild edit button).
 *
 * `prefers-reduced-motion: reduce` (and `running={false}`) renders
 * the static end state: palette closed, cursor gone, the dragged
 * component already snapped into the layout.
 *
 * Usage:
 *
 *   <BuildMock />
 *   <BuildMock size="sm" caption />
 *   <BuildMock running={false} />
 *
 * Props:
 *   - size:      'sm' | 'md' (default)  — frame width, as AppMock
 *   - caption:   string | true          — small label below the frame;
 *                `true` renders the default "Make it yours"
 *   - running:   boolean (default true) — false freezes to the end state
 *   - className: string
 */

import React from 'react';
import styles from './BuildMock.module.css';

function MiniTile({wide}) {
  return (
    <span className={styles.miniTile}>
      <span className={styles.miniBar} style={{width: wide ? '70%' : '50%'}} />
      <span className={styles.miniLine} />
      <span className={styles.miniLine} style={{width: '60%'}} />
    </span>
  );
}

export default function BuildMock({size = 'md', caption, running = true, className}) {
  return (
    <div className={styles.bm}>
      <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
        <div
          className={[styles.frame, styles[`size-${size}`], !running && styles.static].filter(Boolean).join(' ')}
          role="img"
          aria-label="Abstract page editor: the edit button opens a component palette and a widget is dragged into the page layout."
        >
          <div className={styles.page}>
            <div className={styles.pageHead}>
              <span className={styles.headGreek} />
            </div>
            <div className={styles.pageGrid}>
              <div className={styles.tile}><MiniTile wide /></div>
              <div className={styles.tile}><MiniTile /></div>
              <div className={styles.slot}>
                {/* The component the drag delivers. Fades in when the
                    ghost lands; permanently visible in the static /
                    reduced-motion end state. */}
                <div className={styles.snapTile}><MiniTile wide /></div>
              </div>
              <div className={styles.tile}><MiniTile /></div>
            </div>
          </div>

          {/* Component palette, opened by the FAB press. */}
          <div className={styles.palette}>
            <span className={styles.paletteTile} />
            <span className={[styles.paletteTile, styles.paletteTileActive].join(' ')} />
            <span className={styles.paletteTile} />
          </div>

          {/* The OpenBuild edit button — the one orange accent. */}
          <div className={styles.fab}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>

          {/* The dragged component ghost. */}
          <div className={styles.ghost}><MiniTile wide /></div>

          {/* The cursor driving the loop. */}
          <svg className={styles.cursor} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </div>
        {caption && (
          <figcaption className={styles.caption}>
            {caption === true ? 'Make it yours' : caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
