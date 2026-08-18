/**
 * Portaliq abstract — external portal, seen from the visitor's side.
 *
 * Inferred from the app role (public-facing portals on top of the
 * workspace): a slim public header instead of the full Nextcloud icon
 * row, then a submission form card next to a message inbox list. No
 * left nav — the visitor gets one page, not an admin surface. Tones:
 * cobalt for the frame, mint for the delivered/confirmed states.
 *
 * Animated (8s loop, --am-dur): a visitor works the form — focus ring
 * and greeked value fill each field in turn, the submit button
 * presses, a mint confirmation band sweeps the form card, and the
 * message lands as a new row (mint avatar) at the top of the inbox.
 * `running={false}` / prefers-reduced-motion show the static end
 * state: filled form, delivered row. Keyframes live in
 * AppMock.module.css (`.portaliq` section). No orange.
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
      <div className={[styles.body, styles.decidesk, styles.portaliq].filter(Boolean).join(' ')}>
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
            {/* Submission form card. Each .field carries a .fieldFill
                bar that greeks the typed value; the sweep is the mint
                confirmation band after submit. */}
            <div className={[styles.panel, styles.formPanel].join(' ')}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.row + ' ' + styles.head} style={{width: '25%', height: 4}}></div>
              <div className={[styles.field, styles['field-1']].join(' ')}><span className={styles.fieldFill}></span></div>
              <div className={styles.row + ' ' + styles.head} style={{width: '30%', height: 4}}></div>
              <div className={[styles.field, styles['field-2']].join(' ')}><span className={styles.fieldFill}></span></div>
              <div className={styles.row + ' ' + styles.head} style={{width: '20%', height: 4}}></div>
              <div className={[styles.field, styles['field-3'], styles.tall].join(' ')}><span className={styles.fieldFill}></span></div>
              <div className={styles.actions} style={{justifyContent: 'flex-end', marginTop: 2}}>
                <div className={[styles.btn, styles.submit].join(' ')}></div>
              </div>
              <span className={styles.confirmSweep} aria-hidden="true"></span>
            </div>
            {/* Message inbox list — the .newItem row is the submitted
                message arriving (mint avatar = delivered). */}
            <div className={[styles.panel, styles['w-mail']].join(' ')}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.list}>
                <div className={[styles.item, styles.newItem].join(' ')}><div className={styles.av}></div><div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div></div>
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
