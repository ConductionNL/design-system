/**
 * OpenCatalogi abstract — federated catalogue grid.
 *
 * Inferred from the app description ("publication catalogue, federated
 * search across registers"): centre is a 3×2 grid of catalogue cards,
 * each with a hex glyph in a different family colour to signal the
 * categorical mix. Left nav for catalogues / publications / sources.
 *
 * Animation (wave 2): a query types into the search bar, the grid
 * dims, the three matching cards snap back to full strength, and
 * their status pills tick mint. Base styles are the filtered end
 * state (non-matches dimmed); keyframes replay the unfiltered
 * before-state and the search.
 */

import React from 'react';
import styles from '../AppMock.module.css';

/* Cards 1, 3 and 5 (indices 0/2/4) match the query; the others dim. */
const CARDS = [
  {tone: '', match: true},
  {tone: 'b', match: false},
  {tone: 'c', match: true},
  {tone: 'd', match: false},
  {tone: 'e', match: true},
  {tone: '', match: false},
];

export default function OpenCatalogiMock() {
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
          <div className={styles.navHead}>
            <div className={styles.h}></div><div className={styles.l}></div>
          </div>
          {[true, false, false, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.l}></div>
            </div>
          ))}
        </div>
        <div className={styles.col}>
          <div className={styles.head}>
            <div className={styles.row + ' ' + styles.head} style={{width: 30}}></div>
            {/* Federated search bar — the query types in, the grid filters */}
            <div className={styles.search}>
              <div className={styles.sIco}></div>
              <div className={styles.q}></div>
            </div>
            <div className={styles.actions}>
              <div className={styles.btn}></div>
            </div>
          </div>
          <div className={styles.grid}>
            {CARDS.map(({tone, match}, i) => (
              <div key={i} className={[styles.card, tone && styles[tone], match ? styles.match : styles.dim].filter(Boolean).join(' ')}>
                <div className={styles.ico}></div>
                <div className={styles.row + ' ' + styles.head}></div>
                <div className={styles.row}></div>
                <div className={styles.row + ' ' + styles.short}></div>
                <div className={styles.statusPill}>
                  <div className={styles.h}></div><div className={styles.t}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
