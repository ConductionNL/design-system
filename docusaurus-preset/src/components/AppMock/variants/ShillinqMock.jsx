/**
 * Shillinq abstract — bookkeeping ledger.
 *
 * Inferred from the app role (invoices, VAT, bank reconciliation):
 * a VAT/summary KPI strip over an invoice table — document icon,
 * description, two amount columns (net / VAT), and a reconciliation
 * tick column where a mint hex = matched against the bank and a
 * muted pip = still open. Tone: terracotta — documents, human work.
 *
 * Animation (wave 2): a bank statement line slides down onto invoice
 * row 3, both tick mint (reconciled), the totals line and the first
 * KPI grow to absorb the match. Base styles are the reconciled end
 * state; keyframes replay the unmatched before-state and the slide.
 */

import React from 'react';
import styles from '../AppMock.module.css';

/* Row 3 (index 2) is the row the bank line reconciles: its tick is
   mint in the base (end) state and the amShqTick keyframe replays
   the open cobalt-200 before-state. Row 5 stays open. */
const INVOICES = [
  {amount: 26, vat: 16, matched: true},
  {amount: 20, vat: 12, matched: true},
  {amount: 30, vat: 18, matched: true, reconciling: true},
  {amount: 22, vat: 14, matched: true},
  {amount: 18, vat: 10, matched: false},
];

export default function ShillinqMock() {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.decidesk, styles.shillinq].filter(Boolean).join(' ')}>
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
            <div className={styles.row + ' ' + styles.head} style={{width: '30%'}}></div>
            <div className={styles.actions}>
              <div className={styles.btn + ' ' + styles.ghost}></div>
              <div className={styles.btn}></div>
            </div>
          </div>
          {/* VAT / summary strip. The first KPI's number widens when
              the reconciliation lands. */}
          <div className={styles.kpiRow}>
            <div className={[styles.kpi, styles.kpiGrow].join(' ')}>
              <div className={[styles.ico, styles.terra].join(' ')}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={[styles.ico, styles.terraSoft].join(' ')}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
          </div>
          {/* Invoice table: doc · description · net · VAT · reconciled */}
          <div className={[styles.panel, styles.ledger].join(' ')}>
            <div className={styles.head}><div className={styles.title}></div></div>
            {/* Bank statement line — slides onto row 3 and dissolves
                into the mint tick. Hidden at rest and in static frames. */}
            <div className={styles.bankLine}>
              <div className={styles.bIco}></div>
              <div className={styles.bBar}></div>
              <div className={styles.bAmt}></div>
            </div>
            <div className={styles.stack}>
              {INVOICES.map(({amount, vat, matched, reconciling}, i) => (
                <div key={i} className={[styles.item, styles.inv, reconciling && styles.reconciling].filter(Boolean).join(' ')}>
                  <div className={styles.doc}></div>
                  <div className={styles.lines}><div className={styles.l1}></div></div>
                  <div className={styles.net} style={{width: amount}}></div>
                  <div className={styles.vat} style={{width: vat}}></div>
                  {/* Bank-reconciliation tick: mint hex = matched */}
                  <div className={[styles.tick, !matched && styles.open].filter(Boolean).join(' ')}></div>
                </div>
              ))}
            </div>
            {/* Totals line — grows when the match lands */}
            <div className={styles.totals}>
              <div className={styles.totNet}></div>
              <div className={styles.totVat}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
