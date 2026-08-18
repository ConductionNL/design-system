/**
 * LarpingApp abstract — character + scene workshop.
 *
 * Inferred from the app role (LARP setting management, character sheets,
 * scenes, NPCs, factions): centre shows a character grid (3×2 cards
 * with hex avatars in different family tones) plus a scene timeline
 * across the top so a session organiser can move stages forward. Left
 * nav for characters / scenes / NPCs / factions / rules / archive.
 *
 * Animation (wave 4, the XP ripple): the second character card lifts,
 * an XP hex token rises from it to the scene timeline's active stage,
 * the stage hex pulses as it absorbs the token, and every character
 * card's text rows grow in a stagger — the whole party levelling from
 * the played scene. Base styles are the settled (post-XP) end state.
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function LarpingAppMock() {
  const charTones = ['', 'b', 'c', 'd', 'e', 'b'];
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.opencatalogi, styles.larping].filter(Boolean).join(' ')}>
        <div className={styles.nav}>
          <div className={styles.navHead}><div className={styles.h}></div><div className={styles.l}></div></div>
          {[true, false, false, false, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={styles.ico}></div>
              <div className={styles.l}></div>
            </div>
          ))}
        </div>
        <div className={styles.col}>
          {/* Scene timeline (one done, one active in orange — the
              variant's single orange — three to-do). Reuses the
              procest timeline atoms; the wrapper div provides the
              `.procest` scope those styles require. The previous
              markup here was an empty w-graph-bar shell that rendered
              nothing but its header. */}
          <div className={styles.procest}>
            <div className={styles.timeline}>
              <div className={styles.step}>
                <div className={styles.h}></div><div className={styles.label}></div>
              </div>
              <div className={[styles.step, styles.now].join(' ')}>
                <div className={styles.h}></div><div className={styles.label}></div>
              </div>
              <div className={[styles.step, styles.todo].join(' ')}>
                <div className={styles.h}></div><div className={styles.label}></div>
              </div>
              <div className={[styles.step, styles.todo].join(' ')}>
                <div className={styles.h}></div><div className={styles.label}></div>
              </div>
              <div className={[styles.step, styles.todo].join(' ')}>
                <div className={styles.h}></div><div className={styles.label}></div>
              </div>
            </div>
          </div>
          {/* Character grid. Card 2 (.xpSource) lifts and releases the
              XP token that travels up to the timeline's active stage. */}
          <div className={styles.grid}>
            {charTones.map((cls, i) => (
              <div key={i} className={[styles.card, cls && styles[cls], i === 1 && styles.xpSource].filter(Boolean).join(' ')}>
                <div className={styles.ico}></div>
                <div className={styles.row + ' ' + styles.head}></div>
                <div className={styles.row + ' ' + styles.short}></div>
                <div className={styles.statusPill}>
                  <div className={styles.h}></div><div className={styles.t}></div>
                </div>
              </div>
            ))}
          </div>
          {/* XP token — travels from the lifted card to the timeline.
              Hidden at rest and in static frames. */}
          <div className={styles.xpToken}></div>
        </div>
      </div>
    </>
  );
}
