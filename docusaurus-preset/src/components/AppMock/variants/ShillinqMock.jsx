/**
 * Shillinq abstract — bookkeeping ledger.
 *
 * Inferred from the app role (invoices, VAT, bank reconciliation):
 * a VAT/summary KPI strip over an invoice table — document icon,
 * description, two amount columns (net / VAT), and a reconciliation
 * tick column where a mint hex = matched against the bank and a
 * muted pip = still open. Tone: terracotta — documents, human work.
 */

import React from 'react';
import styles from '../AppMock.module.css';

const INVOICES = [
  {amount: 26, vat: 16, matched: true},
  {amount: 20, vat: 12, matched: true},
  {amount: 30, vat: 18, matched: false},
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
            <div className={styles.row + ' ' + styles.head} style={{width: '30%'}}></div>
            <div className={styles.actions}>
              <div className={styles.btn + ' ' + styles.ghost}></div>
              <div className={styles.btn}></div>
            </div>
          </div>
          {/* VAT / summary strip */}
          <div className={styles.kpiRow}>
            <div className={styles.kpi}>
              <div className={styles.ico} style={{background: 'var(--c-terracotta-500)'}}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.ico} style={{background: 'var(--c-terracotta-300)'}}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.ico}></div>
              <div className={styles.meta}><div className={styles.num}></div><div className={styles.label}></div></div>
            </div>
          </div>
          {/* Invoice table: doc · description · net · VAT · reconciled */}
          <div className={styles.panel} style={{flex: 1}}>
            <div className={styles.head}><div className={styles.title}></div></div>
            <div className={styles.stack}>
              {INVOICES.map(({amount, vat, matched}, i) => (
                <div key={i} className={styles.item}>
                  <div style={{width: 11, height: 13, clipPath: 'var(--hex-pointy-top)', background: 'var(--c-terracotta-300)', flexShrink: 0}}></div>
                  <div className={styles.lines}><div className={styles.l1}></div></div>
                  <div style={{width: amount, height: 4, background: 'var(--c-cobalt-700)', borderRadius: 1, flexShrink: 0}}></div>
                  <div style={{width: vat, height: 4, background: 'var(--c-cobalt-300)', borderRadius: 1, flexShrink: 0}}></div>
                  {/* Bank-reconciliation tick: mint hex = matched */}
                  <div style={{width: 9, height: 10, clipPath: 'var(--hex-pointy-top)', background: matched ? 'var(--c-mint-500)' : 'var(--c-cobalt-200)', flexShrink: 0}}></div>
                </div>
              ))}
            </div>
            {/* Totals line */}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 6, paddingTop: 4, borderTop: '1px solid var(--c-cobalt-100)'}}>
              <div style={{width: 32, height: 6, background: 'var(--c-cobalt-900)', borderRadius: 1}}></div>
              <div style={{width: 20, height: 6, background: 'var(--c-cobalt-400)', borderRadius: 1}}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
