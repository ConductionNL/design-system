/**
 * Hermiq abstract — agent chat surface.
 *
 * Inferred from the app role (AI agents working inside the workspace):
 * left rail lists the available agents, centre shows a conversation —
 * user bubbles right, agent bubbles left — with a tool-call chip row
 * between agent turns and a prompt input at the bottom. Tones:
 * workspace-blue for the human side, mint for confirmed tool runs.
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
      <div className={[styles.body, styles.decidesk].filter(Boolean).join(' ')}>
        {/* Agent list rail */}
        <div className={styles.nav}>
          <div className={styles.navHead}><div className={styles.h}></div><div className={styles.l}></div></div>
          {[true, false, false, false].map((active, i) => (
            <div key={i} className={[styles.item, active && styles.active].filter(Boolean).join(' ')}>
              <div className={styles.ico} style={{borderRadius: '50%'}}></div>
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
          <div className={styles.panel} style={{flex: 1, gap: 8, justifyContent: 'flex-end'}}>
            {/* User asks */}
            <div style={{alignSelf: 'flex-end', width: '42%', height: 12, borderRadius: '8px 2px 8px 8px', background: 'var(--c-workspaceblue-300)'}}></div>
            {/* Agent answers */}
            <div style={{alignSelf: 'flex-start', width: '58%', height: 18, borderRadius: '2px 8px 8px 8px', background: 'var(--c-cobalt-50)', border: '1px solid var(--c-cobalt-100)'}}></div>
            {/* Tool-call chip row — mint = tool run confirmed */}
            <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
              <div className={styles.statusPill}>
                <div className={styles.h}></div>
                <div className={styles.t}></div>
              </div>
              <div style={{width: 34, height: 9, borderRadius: 999, background: 'var(--c-cobalt-100)'}}></div>
              <div style={{width: 26, height: 9, borderRadius: 999, background: 'var(--c-cobalt-100)'}}></div>
            </div>
            {/* Agent continues with the tool result */}
            <div style={{alignSelf: 'flex-start', width: '64%', height: 24, borderRadius: '2px 8px 8px 8px', background: 'var(--c-cobalt-50)', border: '1px solid var(--c-cobalt-100)'}}></div>
            {/* User follows up */}
            <div style={{alignSelf: 'flex-end', width: '34%', height: 12, borderRadius: '8px 2px 8px 8px', background: 'var(--c-workspaceblue-300)'}}></div>
          </div>
          {/* Prompt input */}
          <div className={styles.actions} style={{alignItems: 'center'}}>
            <div style={{flex: 1, height: 16, background: 'white', border: '1px solid var(--c-cobalt-200)', borderRadius: 8}}></div>
            <div className={styles.btn} style={{width: 28}}></div>
          </div>
        </div>
      </div>
    </>
  );
}
