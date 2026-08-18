/**
 * Scholiq abstract — learning environment.
 *
 * Inferred from the app role (courses, lessons, credentials): centre
 * shows a course-card grid, each card carrying a progress bar, with a
 * credential chip on the completed course. Left nav for courses /
 * lessons / learners / certificates. Tone: forest — data you can
 * trust a diploma to.
 */

import React from 'react';
import styles from '../AppMock.module.css';

const PROGRESS = [
  {ico: 'b', fill: '100%', done: true},
  {ico: 'b', fill: '65%'},
  {ico: null, fill: '40%'},
  {ico: 'b', fill: '80%'},
  {ico: 'e', fill: '25%'},
  {ico: 'b', fill: '10%'},
];

export default function ScholiqMock() {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.opencatalogi].filter(Boolean).join(' ')}>
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
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6}}>
            <div className={styles.row + ' ' + styles.head} style={{width: '30%'}}></div>
            <div className={styles.actions}>
              <div className={styles.btn}></div>
            </div>
          </div>
          {/* Course cards with progress bars */}
          <div className={styles.grid}>
            {PROGRESS.map(({ico, fill, done}, i) => (
              <div key={i} className={[styles.card, ico && styles[ico]].filter(Boolean).join(' ')}>
                <div className={styles.ico}></div>
                <div className={styles.row}></div>
                <div className={styles.row + ' ' + styles.short}></div>
                <div style={{height: 4, background: 'var(--c-cobalt-100)', borderRadius: 2}}>
                  <div style={{width: fill, height: 4, background: 'var(--c-forest-500)', borderRadius: 2}}></div>
                </div>
                {done && (
                  /* Credential chip — course completed, certificate issued */
                  <div style={{display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 999, background: 'var(--c-forest-300)', alignSelf: 'flex-start'}}>
                    <div style={{width: 6, height: 7, clipPath: 'var(--hex-pointy-top)', background: 'var(--c-forest-500)'}}></div>
                    <div style={{height: 3, width: 22, background: 'var(--c-forest-500)', borderRadius: 1}}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
