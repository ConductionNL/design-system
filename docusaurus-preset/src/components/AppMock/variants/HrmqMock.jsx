/**
 * HRMQ abstract — people administration.
 *
 * Inferred from the app role (HR: employees, contracts, leave): a
 * people list with hex avatars next to a leave-balance card of
 * labelled horizontal bars. Tone: mint — the team is in order.
 */

import React from 'react';
import styles from '../AppMock.module.css';

const PEOPLE = ['var(--c-mint-500)', 'var(--c-mint-300)', 'var(--c-forest-300)', 'var(--c-mint-300)', 'var(--c-mint-500)'];
const BALANCES = [
  {fill: '72%', shade: 'var(--c-mint-500)'},
  {fill: '45%', shade: 'var(--c-mint-500)'},
  {fill: '88%', shade: 'var(--c-mint-300)'},
  {fill: '20%', shade: 'var(--c-mint-300)'},
];

export default function HrmqMock() {
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
          {[true, false, false, false, false].map((active, i) => (
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
              <div className={styles.btn}></div>
            </div>
          </div>
          <div className={styles.panelRow} style={{gridTemplateColumns: '1.2fr 1fr'}}>
            {/* People list — hex avatars */}
            <div className={styles.panel}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.stack}>
                {PEOPLE.map((shade, i) => (
                  <div key={i} className={styles.item}>
                    <div style={{width: 13, height: 15, clipPath: 'var(--hex-pointy-top)', background: shade, flexShrink: 0}}></div>
                    <div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Leave-balance card — labelled bars */}
            <div className={styles.panel}>
              <div className={styles.head}><div className={styles.title}></div></div>
              {BALANCES.map(({fill, shade}, i) => (
                <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 3}}>
                  <div className={styles.row + ' ' + styles.short} style={{height: 3}}></div>
                  <div style={{height: 5, background: 'var(--c-cobalt-100)', borderRadius: 2}}>
                    <div style={{width: fill, height: 5, background: shade, borderRadius: 2}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
