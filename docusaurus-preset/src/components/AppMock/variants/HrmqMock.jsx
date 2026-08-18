/**
 * HRMQ abstract — hours administration.
 *
 * Content rework (wave 4): the earlier people-list + leave-balance
 * pair misrepresented the app (HRMQ's daily surface is hours and
 * approval, not a personnel directory). The mock now shows the
 * timesheet week — five day columns of hour bars plus a submit
 * button — next to an approval card: the submitted week arriving as
 * a row, its pip ticking mint on approval, and a payroll counter
 * that grows when the approved hours land. Tone: mint — the team's
 * hours are in order.
 *
 * Animation: day bars fill in a stagger → submit press → the
 * approval row's pip ticks mint → the payroll counter widens.
 * Base styles are the approved end state.
 */

import React from 'react';
import styles from '../AppMock.module.css';

/* Hour-bar heights for the five day columns of the week. */
const WEEK = ['70%', '85%', '60%', '90%', '45%'];

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
      <div className={[styles.body, styles.decidesk, styles.hrmq].filter(Boolean).join(' ')}>
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
            {/* Timesheet — the week's hour bars + submit */}
            <div className={[styles.panel, styles.timesheet].join(' ')}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.week}>
                {WEEK.map((h, i) => (
                  <div key={i} className={styles.dayCol}>
                    <div className={styles.dayBar} style={{height: h}}></div>
                    <div className={styles.dayLabel}></div>
                  </div>
                ))}
              </div>
              <div className={styles.sheetFoot}>
                <div className={styles.sheetSum}></div>
                <div className={[styles.btn, styles.submitBtn].join(' ')}></div>
              </div>
            </div>
            {/* Approval + payroll — the submitted week arrives, is
                approved (mint tick), and the payroll counter grows. */}
            <div className={[styles.panel, styles.approval].join(' ')}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.stack}>
                <div className={[styles.item, styles.approveRow].join(' ')}>
                  <div className={styles.av}></div>
                  <div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div>
                  <div className={styles.approvePip}></div>
                </div>
                <div className={styles.item}>
                  <div className={[styles.av, styles.b].join(' ')}></div>
                  <div className={styles.lines}><div className={styles.l1}></div><div className={styles.l2}></div></div>
                  <div className={styles.donePip}></div>
                </div>
              </div>
              {/* Payroll counter — widens when the approval lands */}
              <div className={styles.payroll}>
                <div className={styles.pLabel}></div>
                <div className={styles.pNum}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
