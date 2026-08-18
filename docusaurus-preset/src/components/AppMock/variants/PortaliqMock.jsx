/**
 * Portaliq abstract — external portal, seen from the visitor's side.
 *
 * Inferred from the app role (public-facing portals on top of the
 * workspace): a slim public header instead of the full Nextcloud icon
 * row, then a submission form card next to a message inbox list. No
 * left nav — the visitor gets one page, not an admin surface. Tones:
 * cobalt for the frame, mint for the delivered/confirmed states.
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function PortaliqMock() {
  return (
    <>
      {/* Public header: logo + a few page links, no app-icon strip */}
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        <div className={styles.spacer}></div>
        {Array.from({length: 3}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.decidesk].filter(Boolean).join(' ')}>
        <div className={styles.col}>
          {/* Portal masthead */}
          <div className={styles.head}>
            <div className={styles.row + ' ' + styles.head} style={{width: '35%'}}></div>
            <div className={styles.statusPill}>
              <div className={styles.h}></div>
              <div className={styles.t}></div>
            </div>
          </div>
          <div className={styles.panelRow} style={{gridTemplateColumns: '1.2fr 1fr'}}>
            {/* Submission form card */}
            <div className={styles.panel}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.row + ' ' + styles.head} style={{width: '25%', height: 4}}></div>
              <div style={{height: 14, background: 'white', border: '1px solid var(--c-cobalt-200)', borderRadius: 3}}></div>
              <div className={styles.row + ' ' + styles.head} style={{width: '30%', height: 4}}></div>
              <div style={{height: 14, background: 'white', border: '1px solid var(--c-cobalt-200)', borderRadius: 3}}></div>
              <div className={styles.row + ' ' + styles.head} style={{width: '20%', height: 4}}></div>
              <div style={{height: 26, background: 'white', border: '1px solid var(--c-cobalt-200)', borderRadius: 3}}></div>
              <div className={styles.actions} style={{justifyContent: 'flex-end', marginTop: 2}}>
                <div className={styles.btn}></div>
              </div>
            </div>
            {/* Message inbox list */}
            <div className={[styles.panel, styles['w-mail']].join(' ')}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.list}>
                <div className={styles.item}><div className={styles.av}></div><div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div></div>
                <div className={styles.item}><div className={styles.av}></div><div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div></div>
                <div className={styles.item}><div className={styles.av}></div><div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div></div>
                <div className={styles.item}><div className={styles.av}></div><div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
