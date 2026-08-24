/**
 * OpenRegister abstract — three-pane admin: left nav + centre dashboard
 * + right detail rail. Reference: localhost:8080/apps/openregister.
 *
 * Centre is the canonical "Dashboard" view: KPI strip top, two
 * side-by-side tables ("Popular Search Terms" / "Objects by Register"),
 * second row of two more. Right rail shows Filter Statistics + Totals.
 *
 * Animation (wave 2): a new object row lands in the "Objects by
 * Register" table, the first KPI's number widens to absorb the count,
 * and the right-rail statistics rows repaint in a stagger — the
 * dashboard reacting to a write. Base styles are the landed end state.
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function OpenRegisterMock({ sidebar = null }) {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.openregister].filter(Boolean).join(' ')}>
        {/* Left nav */}
        <div className={styles.nav}>
          <div className={styles.navHead}>
            <div className={styles.h}></div>
            <div className={styles.l}></div>
          </div>
          {[true, false, false, false, false, false, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.l}></div>
            </div>
          ))}
        </div>
        {/* Centre */}
        <div className={styles.col}>
          {/* KPI strip */}
          <div className={styles.kpiRow}>
            <div className={[styles.kpi, styles.kpiGrow].join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={[styles.kpi, styles.forest].join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={[styles.kpi, styles.amber].join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={[styles.kpi, styles.lavender].join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
          </div>
          {/* Two rows × two tables */}
          <div className={styles.panelRow}>
            <div className={styles.panel}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.stack}>
                {[0,1,2].map(i => (
                  <div key={i} className={styles.item}>
                    <div className={styles.lines}><div className={styles.l1}></div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.panel}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.stack}>
                {/* The freshly-written object row: lands with a slide
                    when the loop fires. Present in static frames. */}
                <div className={[styles.item, styles.newObj].join(' ')}>
                  <div className={[styles.av, styles.d].join(' ')}></div>
                  <div className={styles.lines}><div className={styles.l1}></div></div>
                </div>
                {['b','d','c'].map((cls, i) => (
                  <div key={i} className={styles.item}>
                    <div className={[styles.av, styles[cls]].join(' ')}></div>
                    <div className={styles.lines}><div className={styles.l1}></div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Right detail rail. When AppMock passes a `sidebar` prop
            (typically a <SidebarMock kind="..." embedded />), it
            renders as the rich detail rail instead of the placeholder
            rows. */}
        {sidebar || (
          <div className={styles.detail}>
            <div className={styles.row + ' ' + styles.head}></div>
            <div className={styles.row}></div>
            <div className={styles.row + ' ' + styles.short}></div>
            <div style={{height: 8}}></div>
            <div className={styles.row + ' ' + styles.head}></div>
            <div className={styles.row + ' ' + styles.dark}></div>
            <div className={styles.row}></div>
            <div className={styles.row}></div>
            <div className={styles.row + ' ' + styles.short}></div>
            <div className={styles.row + ' ' + styles.accent}></div>
            <div className={styles.row + ' ' + styles.short}></div>
          </div>
        )}
      </div>
    </>
  );
}
