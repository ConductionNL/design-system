/**
 * Hermiq abstract — agent chat surface.
 *
 * Inferred from the app role (AI agents working inside the workspace):
 * left rail lists the available agents, centre shows a conversation —
 * user bubbles right, agent bubbles left — with a tool-call chip row
 * between agent turns and a prompt input at the bottom. Tones:
 * workspace-blue for the human side, mint for confirmed tool runs.
 *
 * Wave 4: the inline styles moved into AppMock.module.css (.hermiq
 * scope) so the surface can animate. The loop: the user's bubble
 * pops in, a typing indicator blinks, the agent's answer grows, the
 * tool chips light left-to-right, the approval chip — the variant's
 * single orange — ticks mint once approved, the tool-result bubble
 * grows, and the user follows up. Base styles are the approved end
 * state (all chips lit, approval mint).
 */

import React from 'react';
import styles from '../AppMock.module.css';

export default function HermiqMock() {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.decidesk, styles.hermiq].filter(Boolean).join(' ')}>
        {/* Agent list rail */}
        <div className={styles.nav}>
          <div className={styles.navHead}><div className={styles.h}></div><div className={styles.l}></div></div>
          {[true, false, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={[styles.ico, styles.round].join(' ')}></div>
              <div className={styles.l}></div>
            </div>
          ))}
        </div>
        {/* Conversation */}
        <div className={styles.col}>
          <div className={styles.head}>
            <div className={styles.row + ' ' + styles.head} style={{width: '30%'}}></div>
            <div className={styles.actions}>
              <div className={styles.btn + ' ' + styles.ghost}></div>
            </div>
          </div>
          <div className={[styles.panel, styles.convo].join(' ')}>
            {/* User asks */}
            <div className={[styles.bubble, styles.user, styles.turn1].join(' ')}></div>
            {/* Typing indicator — blinks while the agent thinks.
                Hidden at rest and in static frames. */}
            <div className={styles.typing}>
              <div className={styles.tDot}></div>
              <div className={styles.tDot}></div>
              <div className={styles.tDot}></div>
            </div>
            {/* Agent answers */}
            <div className={[styles.bubble, styles.agent, styles.turn2].join(' ')}></div>
            {/* Tool-call chip row — chips light L→R; the approval chip
                (the variant's one orange while pending) ticks mint. */}
            <div className={styles.chips}>
              <div className={[styles.statusPill, styles.chip1].join(' ')}>
                <div className={styles.h}></div>
                <div className={styles.t}></div>
              </div>
              <div className={[styles.chip, styles.chip2].join(' ')}></div>
              <div className={[styles.chip, styles.chip3].join(' ')}></div>
              <div className={[styles.statusPill, styles.approveChip].join(' ')}>
                <div className={styles.h}></div>
                <div className={styles.t}></div>
              </div>
            </div>
            {/* Agent continues with the tool result */}
            <div className={[styles.bubble, styles.agent, styles.tall, styles.turn3].join(' ')}></div>
            {/* User follows up */}
            <div className={[styles.bubble, styles.user, styles.narrow, styles.turn4].join(' ')}></div>
          </div>
          {/* Prompt input */}
          <div className={[styles.actions, styles.promptRow].join(' ')}>
            <div className={styles.promptField}></div>
            <div className={[styles.btn, styles.sendBtn].join(' ')}></div>
          </div>
        </div>
      </div>
    </>
  );
}
