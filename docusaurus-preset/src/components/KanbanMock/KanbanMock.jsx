/**
 * <KanbanMock />
 *
 * Token-built abstract of the pipelinq kanban board with a looping
 * drag animation: a cursor picks up the top lead card in the first
 * column (the card lifts), drags it to the second column, drops it,
 * and at the drop moment the column counts nudge (3→2, 2→3) and the
 * per-lane € KPI tiles above the board shift the moved deal's value
 * (€ 48k→€ 30k, € 27k→€ 45k; the third lane stays € 64k). Loops
 * every ~7 seconds and resets cleanly at loop start. Pipelinq's
 * hero/panel illustration.
 *
 * Named KanbanMock rather than PipelineMock because the preset
 * already ships a `Pipeline` component (the hex-numbered process
 * strip) and a `cn-pipeline` diagram; this one is the *board*.
 *
 * Same abstraction level as <AppMock>: greeked cards, tokens only,
 * short labels at most, no orange. `prefers-reduced-motion: reduce`
 * (and `running={false}`) renders the static board — no cursor, no
 * lift, the card resting in its origin column.
 *
 * Usage:
 *
 *   <KanbanMock />
 *   <KanbanMock size="sm" caption />
 *   <KanbanMock running={false} />
 *
 * Props:
 *   - size:      'sm' | 'md' (default)  — frame width, as AppMock
 *   - caption:   string | true          — small label below the frame;
 *                `true` renders the default "Pipeline board"
 *   - running:   boolean (default true) — false freezes the board
 *   - className: string
 */

import React from 'react';
import styles from './KanbanMock.module.css';

function CardGreek({wide, dot}) {
  return (
    <>
      <span className={styles.cardTop}>
        <span className={styles.cardBar} style={{width: wide ? '72%' : '55%'}} />
        {dot && <span className={styles.cardDot} />}
      </span>
      <span className={styles.cardLine} />
      <span className={styles.cardLine} style={{width: '58%'}} />
    </>
  );
}

function Count({from, to}) {
  /* Two stacked digits crossfading on the shared timeline: `from`
     shows until the drop settles (54%), `to` after it, back again for
     the next loop. Static renderings show `from`. */
  return (
    <span className={styles.count}>
      <span className={styles.countBefore}>{from}</span>
      <span className={styles.countAfter}>{to}</span>
    </span>
  );
}

function Kpi({from, to}) {
  /* Small € tile above a lane. Reuses the count crossfade classes so
     the value swaps at the same drop moment as the column counts and
     shows `from` in static renderings. A `to` of undefined renders a
     lane whose total never changes. */
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiBar} />
      <span className={styles.kpiValue}>
        {to != null ? (
          <>
            <span className={styles.countBefore}>{from}</span>
            <span className={styles.countAfter}>{to}</span>
          </>
        ) : (
          <span className={styles.kpiStill}>{from}</span>
        )}
      </span>
    </div>
  );
}

export default function KanbanMock({size = 'md', caption, running = true, className}) {
  return (
    <div className={styles.km}>
      <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
        <div
          className={[styles.frame, styles[`size-${size}`], !running && styles.static].filter(Boolean).join(' ')}
          role="img"
          aria-label="Abstract kanban board: a lead card is dragged from the first column to the second; the column counts and the lane value totals update at the drop."
        >
          <div className={styles.board}>
            <div className={styles.kpis}>
              <Kpi from="€ 48k" to="€ 30k" />
              <Kpi from="€ 27k" to="€ 45k" />
              <Kpi from="€ 64k" />
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>
                <span className={styles.colBar} />
                <Count from="3" to="2" />
              </div>
              {/* The top slot belongs to the dragged card (rendered
                  absolutely so it can travel); it reads as an empty
                  gap while the card is away. */}
              <div className={styles.slotGap} />
              <div className={styles.card}><CardGreek wide /></div>
              <div className={styles.card}><CardGreek /></div>
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>
                <span className={styles.colBar} />
                <Count from="2" to="3" />
              </div>
              <div className={styles.slotGap} />
              <div className={styles.card}><CardGreek /></div>
              <div className={styles.card}><CardGreek wide /></div>
            </div>
            <div className={styles.col}>
              <div className={styles.colHead}>
                <span className={styles.colBar} />
                <span className={styles.countStatic}>4</span>
              </div>
              <div className={styles.card}><CardGreek /></div>
              <div className={styles.card}><CardGreek wide /></div>
              <div className={styles.card}><CardGreek /></div>
            </div>
          </div>

          {/* The travelling lead card. */}
          <div className={styles.mover}><CardGreek wide dot /></div>

          {/* The cursor doing the drag. */}
          <svg className={styles.cursor} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </div>
        {caption && (
          <figcaption className={styles.caption}>
            {caption === true ? 'Pipeline board' : caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
