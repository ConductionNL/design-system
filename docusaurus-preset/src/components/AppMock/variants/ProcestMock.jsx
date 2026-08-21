/**
 * Dossiq abstract — case management with process timeline.
 *
 * Inferred from app role (ZGW case-management for VTH and citizen
 * processes): centre shows a canonical case detail with the timeline
 * of stages running across the top (two done, one active, two to-do)
 * plus a list of recent cases below. Left nav for cases, types,
 * roles, decisions, archive.
 *
 * Animation (wave 2): the case advances one stage — ghost hexes
 * overlaid on steps 2 and 3 replay the before-state (step 2 still
 * orange-active, step 3 still to-do) and fade away to reveal the
 * advanced base state; the advanced case's list row re-sorts to the
 * top. Base styles are the advanced end state throughout.
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function ProcestMock({ sidebar = null }) {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.procest].filter(Boolean).join(' ')}>
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
            <div className={styles.row + ' ' + styles.head} style={{width: 35}}></div>
            <div className={styles.actions}>
              <div className={styles.btn + ' ' + styles.ghost}></div>
              <div className={styles.btn}></div>
            </div>
          </div>
          {/* Base = advanced state: done, done, now, todo, todo.
              Ghost hexes on steps 2+3 replay the before-state. */}
          <div className={styles.timeline}>
            <div className={styles.step}>
              <div className={styles.h}></div>
              <div className={styles.label}></div>
            </div>
            <div className={[styles.step, styles.advanceFrom].join(' ')}>
              <div className={styles.h}></div>
              <div className={[styles.ghost, styles.ghostNow].join(' ')}></div>
              <div className={styles.label}></div>
            </div>
            <div className={[styles.step, styles.now, styles.advanceTo].join(' ')}>
              <div className={styles.h}></div>
              <div className={[styles.ghost, styles.ghostTodo].join(' ')}></div>
              <div className={styles.label}></div>
            </div>
            <div className={[styles.step, styles.todo].join(' ')}>
              <div className={styles.h}></div>
              <div className={styles.label}></div>
            </div>
            <div className={[styles.step, styles.todo].join(' ')}>
              <div className={styles.h}></div>
              <div className={styles.label}></div>
            </div>
          </div>
          <div className={styles.panel}>
            <div className={styles.head}><div className={styles.title}></div></div>
            <div className={styles.stack}>
              {/* DOM order = end state: the advanced case (status pill,
                  .sortUp) sits on top; the row it overtook (.sortDown)
                  is second. The keyframes replay the pre-sort order. */}
              <div className={[styles.item, styles.sortUp].join(' ')}>
                <div className={[styles.av, styles.b].join(' ')}></div>
                <div className={styles.lines}>
                  <div className={styles.l1}></div>
                  <div className={styles.l2}></div>
                </div>
                <div className={styles.statusPill}>
                  <div className={styles.h}></div><div className={styles.t}></div>
                </div>
              </div>
              <div className={[styles.item, styles.sortDown].join(' ')}>
                <div className={[styles.av, styles.a].filter(Boolean).join(' ')}></div>
                <div className={styles.lines}>
                  <div className={styles.l1}></div>
                  <div className={styles.l2}></div>
                </div>
              </div>
              {['d','c','a'].map((cls, i) => (
                <div key={i} className={styles.item}>
                  <div className={[styles.av, styles[cls]].join(' ')}></div>
                  <div className={styles.lines}>
                    <div className={styles.l1}></div>
                    <div className={styles.l2}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Optional sidebar (typically a <SidebarMock kind="..." />)
            renders here as a flex sibling of .col, taking the .detail
            slot. Dossiq's case detail view doesn't ship a default
            detail rail, so without the prop nothing extra renders. */}
        {sidebar}
      </div>
    </>
  );
}
