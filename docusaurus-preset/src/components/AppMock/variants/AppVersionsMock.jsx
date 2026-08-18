/**
 * App Versions abstract — fleet version dashboard.
 *
 * Inferred from the app role (tracking installed app versions across
 * a workspace): a KPI strip over an app list — app hex, name, version
 * chip, and a status dot column where mint = up to date and
 * terracotta = an update is waiting. Tone: workspace-blue — this is
 * about the workspace itself.
 */

import React from 'react';
import styles from '../AppMock.module.css';

const APPS = [
  {upToDate: true},
  {upToDate: true},
  {upToDate: false, newChip: true},
  {upToDate: true},
  {upToDate: false, newChip: true},
  {upToDate: true},
];

export default function AppVersionsMock() {
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
          {[true, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.l}></div>
            </div>
          ))}
        </div>
        <div className={styles.col}>
          <div className={styles.head}>
            <div className={styles.row + ' ' + styles.head} style={{width: '30%'}}></div>
            <div className={styles.actions}>
              <div className={styles.btn + ' ' + styles.ghost}></div>
            </div>
          </div>
          <div className={styles.kpiRow}>
            <div className={styles.kpi}>
              <div className={styles.ico} style={{background: 'var(--c-workspaceblue-500)'}}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.ico} style={{background: 'var(--c-terracotta-300)'}}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
          </div>
          {/* App rows: hex · name · version chip(s) · status dot */}
          <div className={styles.panel} style={{flex: 1}}>
            <div className={styles.head}><div className={styles.title}></div></div>
            <div className={styles.stack}>
              {APPS.map(({upToDate, newChip}, i) => (
                <div key={i} className={styles.item}>
                  <div style={{width: 11, height: 13, clipPath: 'var(--hex-pointy-top)', background: upToDate ? 'var(--c-workspaceblue-500)' : 'var(--c-workspaceblue-300)', flexShrink: 0}}></div>
                  <div className={styles.lines}><div className={styles.l1}></div></div>
                  <div style={{width: 26, height: 9, borderRadius: 999, background: 'var(--c-cobalt-100)', flexShrink: 0}}></div>
                  {newChip && <div style={{width: 26, height: 9, borderRadius: 999, background: 'var(--c-workspaceblue-300)', flexShrink: 0}}></div>}
                  <div style={{width: 6, height: 6, borderRadius: '50%', background: upToDate ? 'var(--c-mint-500)' : 'var(--c-terracotta-500)', flexShrink: 0}}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
