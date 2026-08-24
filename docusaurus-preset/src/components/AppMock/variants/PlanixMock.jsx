/**
 * Planninq abstract — planning board.
 *
 * Inferred from the app role (scheduling people and work over time):
 * a week grid of five day columns with placed planning blocks at
 * varying heights, over a small capacity KPI strip. Tone: lavender —
 * process and workflow.
 */

import React from 'react';
import styles from '../AppMock.module.css';

/* Per day column: [height, shade] pairs; null = free slot spacer. */
const WEEK = [
  [[14, 500], [10, 300]],
  [[8, 300], [16, 500], [8, 300]],
  [[12, 300], null, [10, 500]],
  [[18, 500]],
  [[8, 300], [8, 300]],
];

export default function PlanixMock() {
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
          <div className={styles.navHead}><div className={styles.h}></div><div className={styles.l}></div></div>
          {[true, false, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.l}></div>
            </div>
          ))}
        </div>
        <div className={styles.col}>
          <div className={styles.head}>
            <div className={styles.row + ' ' + styles.head} style={{width: '25%'}}></div>
            <div className={styles.actions}>
              <div className={styles.btn + ' ' + styles.ghost}></div>
              <div className={styles.btn}></div>
            </div>
          </div>
          <div className={styles.kpiRow}>
            <div className={[styles.kpi, styles.lavender].join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
          </div>
          {/* Week grid with placed planning blocks */}
          <div className={styles.w} style={{flex: 1}}>
            <div className={styles.wHead}>
              <div className={styles.h}></div><div className={styles.t}></div>
            </div>
            <div style={{flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, minHeight: 60}}>
              {WEEK.map((day, i) => (
                <div key={i} style={{background: 'var(--c-cobalt-50)', borderRadius: 2, padding: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
                  {day.map((block, j) => block
                    ? <div key={j} style={{height: block[0], borderRadius: 1, background: `var(--c-lavender-${block[1]})`}}></div>
                    : <div key={j} style={{height: 8}}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
