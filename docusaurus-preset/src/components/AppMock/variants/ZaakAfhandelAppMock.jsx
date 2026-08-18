/**
 * ZaakAfhandelApp abstract — citizen + case-worker portal.
 *
 * Inferred from the app role (citizen-facing case portal, ZGW APIs,
 * archive interfaces): centre shows the active case-worker queue
 * (werkvoorraad widget) with stage pips, plus a citizen-side timeline
 * of recent submissions. Left nav for queue / archive / public portal /
 * audit / settings.
 *
 * Animation (wave 4): a citizen submission travels up from the
 * submissions list into the werkvoorraad — the ghost row rises, and
 * the new case row at the top of the queue gains its stage hex and
 * assignee avatar as it lands. The late row's red stage pip pulses
 * once per loop as the SLA reminder. Base styles are the assigned
 * end state (new case present, fully dressed).
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function ZaakAfhandelAppMock() {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.procest, styles.zaak].filter(Boolean).join(' ')}>
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
            <div className={styles.row + ' ' + styles.head} style={{width: '35%'}}></div>
            <div className={styles.actions}>
              <div className={styles.btn + ' ' + styles.ghost}></div>
              <div className={styles.btn}></div>
            </div>
          </div>
          {/* Case-worker werkvoorraad. The first row (.zkNew) is the
              citizen submission after landing: its stage hex and
              assignee avatar dress it as it arrives. */}
          <div className={[styles.w, styles['w-werkvoorraad']].join(' ')}>
            <div className={styles.wHead}>
              <div className={styles.h}></div><div className={styles.t}></div>
            </div>
            <div className={styles.list}>
              <div className={[styles.item, styles.zkNew].join(' ')}><div className={styles.stage}></div><div className={styles.l1}></div><div className={[styles.av, styles.b].join(' ')}></div></div>
              <div className={[styles.item, styles.now].join(' ')}><div className={styles.stage}></div><div className={styles.l1}></div><div className={styles.av}></div></div>
              <div className={styles.item}><div className={styles.stage}></div><div className={styles.l1}></div><div className={[styles.av, styles.b].join(' ')}></div></div>
              <div className={[styles.item, styles.late].join(' ')}><div className={styles.stage}></div><div className={styles.l1}></div><div className={[styles.av, styles.c].join(' ')}></div></div>
              <div className={styles.item}><div className={styles.stage}></div><div className={styles.l1}></div><div className={styles.av}></div></div>
            </div>
          </div>
          {/* Travelling submission ghost — rises from the submissions
              list into the werkvoorraad. Hidden at rest + static. */}
          <div className={styles.zkGhost}>
            <div className={styles.src}></div>
            <div className={styles.gBar}></div>
          </div>
          {/* Citizen-side recent submissions list */}
          <div className={[styles.w, styles['w-rss']].join(' ')}>
            <div className={styles.wHead}>
              <div className={styles.h}></div><div className={styles.t}></div>
            </div>
            <div className={styles.list}>
              <div className={[styles.item, styles.zkSent].join(' ')}><div className={styles.src}></div><div className={styles.title}></div><div className={styles.when}></div></div>
              <div className={styles.item}><div className={styles.src}></div><div className={styles.title}></div><div className={styles.when}></div></div>
              <div className={styles.item}><div className={styles.src}></div><div className={styles.title}></div><div className={styles.when}></div></div>
              <div className={styles.item}><div className={styles.src}></div><div className={styles.title}></div><div className={styles.when}></div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
