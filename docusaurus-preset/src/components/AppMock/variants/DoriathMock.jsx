/**
 * Doriath abstract — secrets vault.
 *
 * Inferred from the app role (storing and sharing secrets): a list of
 * locked entries — key hex, name, masked value rendered as a dot
 * pattern — next to one unlocked detail card on a cobalt-900 surface
 * with the revealed value in light. Tones: cobalt-900 for the vault
 * interior, lavender for the keys.
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function DoriathMock() {
  const mask = (n) => (
    <div style={{display: 'flex', gap: 2, flexShrink: 0}}>
      {Array.from({length: n}).map((_, i) => (
        <div key={i} style={{width: 3, height: 3, borderRadius: '50%', background: 'var(--c-cobalt-400)'}}></div>
      ))}
    </div>
  );
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
          {[true, false, false, false].map((active, i) => (
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
              <div className={styles.btn + ' ' + styles.ghost}></div>
              <div className={styles.btn}></div>
            </div>
          </div>
          <div className={styles.panelRow} style={{gridTemplateColumns: '1.4fr 1fr'}}>
            {/* Locked entries — key hex + name + masked value */}
            <div className={styles.panel}>
              <div className={styles.head}><div className={styles.title}></div></div>
              <div className={styles.stack}>
                {[6, 5, 7, 5, 6].map((dots, i) => (
                  <div key={i} className={styles.item}>
                    <div style={{width: 10, height: 11, clipPath: 'var(--hex-pointy-top)', background: 'var(--c-lavender-500)', flexShrink: 0}}></div>
                    <div className={styles.lines}><div className={styles.l1}></div></div>
                    {mask(dots)}
                  </div>
                ))}
              </div>
            </div>
            {/* Unlocked entry — vault-dark card, value revealed */}
            <div className={styles.panel} style={{background: 'var(--c-cobalt-900)', borderColor: 'var(--c-cobalt-900)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
                <div style={{width: 12, height: 14, clipPath: 'var(--hex-pointy-top)', background: 'var(--c-lavender-300)', flexShrink: 0}}></div>
                <div style={{height: 6, width: '45%', background: 'var(--c-lavender-300)', borderRadius: 1}}></div>
              </div>
              <div style={{height: 3, width: '60%', background: 'rgba(255,255,255,0.25)', borderRadius: 1}}></div>
              <div style={{height: 10, width: '85%', background: 'rgba(255,255,255,0.9)', borderRadius: 2}}></div>
              <div style={{height: 3, width: '50%', background: 'rgba(255,255,255,0.25)', borderRadius: 1}}></div>
              <div style={{height: 3, width: '70%', background: 'rgba(255,255,255,0.25)', borderRadius: 1}}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
