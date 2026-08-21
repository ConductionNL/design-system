/**
 * Decidiq abstract — left nav + centre with action row, KPI strip,
 * vote tally, and decision row. Reference: localhost:8080/apps/decidesk.
 *
 * Hero of the centre is the trio of primary buttons (New Decision /
 * Action Item / Minutes) rendered as accent-pill rows top right.
 *
 * Content rework (wave 4): the two former placeholder panels (a bare
 * accent row / a bare short row) are now the app's actual story — a
 * vote tally (for / against / abstain bars with a quorum line) and a
 * decision row whose status flips pending → adopted. The tally fills,
 * the "for" bar crosses the quorum line (which ticks mint), and the
 * decision pill flips to adopted. Base styles are the adopted end
 * state. The KPI strip keeps its single amber cell as the variant's
 * one orange; the pending pill replays via the shared beta-pill
 * coral/orange styling only transiently.
 */

import React from 'react';
import styles from '../AppMock.module.css';

/* for / against / abstain — fill widths of the tally tracks. The
   "for" bar carries the quorum line and crosses it as it fills. */
const TALLY = [
  {cls: 'for', fill: '72%'},
  {cls: 'against', fill: '30%'},
  {cls: 'abstain', fill: '16%'},
];

export default function DeciDeskMock() {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.decidesk].filter(Boolean).join(' ')}>
        <div className={styles.nav}>
          <div className={styles.navHead}>
            <div className={styles.h}></div><div className={styles.l}></div>
          </div>
          {[true, false, false, false, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.l}></div>
            </div>
          ))}
        </div>
        <div className={styles.col}>
          <div className={styles.head}>
            <div className={styles.row + ' ' + styles.head} style={{width: 25}}></div>
            <div className={styles.actions}>
              <div className={styles.btn}></div>
              <div className={styles.btn}></div>
              <div className={styles.btn}></div>
            </div>
          </div>
          <div className={styles.kpiRow}>
            <div className={[styles.kpi, styles.amber].join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={[styles.kpi, styles.lavender].join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
          </div>
          <div className={styles.panelRow}>
            {/* Vote tally — for / against / abstain with quorum line */}
            <div className={[styles.panel, styles.tally].join(' ')}>
              <div className={styles.head}><div className={styles.title}></div></div>
              {TALLY.map(({cls, fill}, i) => (
                <div key={i} className={[styles.tallyRow, styles[cls]].join(' ')}>
                  <div className={styles.tLabel}></div>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{width: fill}}></div>
                    {cls === 'for' && <div className={styles.quorum}></div>}
                  </div>
                </div>
              ))}
            </div>
            {/* Decision row — pending → adopted flip */}
            <div className={[styles.panel, styles.decision].join(' ')}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={[styles.item, styles.decisionRow].join(' ')}>
                <div className={styles.dIco}></div>
                <div className={styles.lines}>
                  <div className={styles.l1}></div>
                  <div className={styles.l2}></div>
                </div>
                {/* Base pill = adopted (mint). The keyframes replay the
                    pending (beta-coloured) phase before the flip. */}
                <div className={[styles.statusPill, styles.adoptFlip].join(' ')}>
                  <div className={styles.h}></div><div className={styles.t}></div>
                </div>
              </div>
              <div className={styles.row}></div>
              <div className={styles.row + ' ' + styles.short}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
