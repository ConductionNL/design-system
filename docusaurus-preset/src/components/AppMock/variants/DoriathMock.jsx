/**
 * Doriath abstract — secrets vault.
 *
 * Inferred from the app role (storing and sharing secrets): a list of
 * locked entries — key hex, name, masked value rendered as a dot
 * pattern — next to one unlocked detail card on a cobalt-900 surface
 * with the revealed value in light. Tones: cobalt-900 for the vault
 * interior, lavender for the keys.
 *
 * Animation (wave 2): the key hex turns, the mask dots unmask, the
 * value wipes in, a mint countdown hairline runs out, and the entry
 * auto-relocks. Base styles are the revealed state (what static
 * frames show); the keyframes replay lock → unlock → countdown →
 * relock as one seamless loop.
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function DoriathMock() {
  const mask = (n) => (
    <div className={styles.maskDots}>
      {Array.from({length: n}).map((_, i) => (
        <div key={i} className={styles.dot}></div>
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
      <div className={[styles.body, styles.decidesk, styles.doriath].filter(Boolean).join(' ')}>
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
                    <div className={styles.keyChip}></div>
                    <div className={styles.lines}><div className={styles.l1}></div></div>
                    {mask(dots)}
                  </div>
                ))}
              </div>
            </div>
            {/* Unlocked entry — vault-dark card. The key turns, the
                masked dots unmask, the value wipes in, the countdown
                hairline runs out, and the card relocks. */}
            <div className={[styles.panel, styles.vaultCard].join(' ')}>
              <div className={styles.vHead}>
                <div className={styles.keyHex}></div>
                <div className={styles.vTitle}></div>
              </div>
              <div className={styles.vMeta}></div>
              <div className={styles.vSecret}>
                <div className={styles.vMask}>
                  {Array.from({length: 7}).map((_, i) => (
                    <div key={i} className={styles.dot}></div>
                  ))}
                </div>
                <div className={styles.vValue}></div>
              </div>
              <div className={styles.vCountdown}></div>
              <div className={styles.vMetaShort}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
