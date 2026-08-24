/**
 * Filinq abstract — three-pane document workshop.
 *
 * Inferred from the app's role (template-driven document generation,
 * anonymisation, signing, archiving): centre stage shows a list of
 * recent documents with status pips (green = signed, amber = awaiting
 * sign, terra = anonymised, red = blocked) plus an anonymise drop-zone
 * widget. Left nav for templates / drafts / signed / archive.
 *
 * Animation (wave 2): the document rows are word-level bars; the
 * marked (PII) words black out one by one — the anonymiser working
 * through the open document set. Base styles are the redacted end
 * state; the keyframes replay the before-state and the black-out.
 * The drop-zone shares the `.zoneLive` marching-ants + file-drop
 * treatment with the docudesk-anonymise dashboard widget.
 */

import React from 'react';
import styles from '../AppMock.module.css';

/* Word-bar layout per document row: widths in px, `mark` = a PII word
   the anonymiser blacks out. Five rows, five marked words total, so
   the black-out cascade reads one word at a time across the list.
   markIndex orders the cascade (drives the amDdMark<N> keyframes). */
const DOC_ROWS = [
  {pip: '', words: [{w: 16}, {w: 10, mark: 1}, {w: 20}, {w: 12}]},
  {pip: 'review', words: [{w: 12}, {w: 18}, {w: 9, mark: 2}, {w: 14}]},
  {pip: '', words: [{w: 20}, {w: 12}, {w: 16}, {w: 8, mark: 3}]},
  {pip: 'todo', words: [{w: 10, mark: 4}, {w: 16}, {w: 12}, {w: 18}]},
  {pip: '', words: [{w: 14}, {w: 12, mark: 5}, {w: 18}, {w: 10}]},
];

export default function DocuDeskMock() {
  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.logo}></div>
        {Array.from({length: 14}).map((_, i) => <div key={i} className={styles.icon}></div>)}
        <div className={styles.spacer}></div>
        <div className={styles.bell}></div>
        <div className={styles.avatar}></div>
      </div>
      <div className={[styles.body, styles.opencatalogi, styles.docudesk].filter(Boolean).join(' ')}>
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
          {/* Document list — word bars with PII marks blacking out */}
          <div className={[styles.w, styles['w-jira']].join(' ')}>
            <div className={styles.wHead}>
              <div className={styles.h}></div><div className={styles.t}></div>
            </div>
            <div className={styles.list}>
              {DOC_ROWS.map(({pip, words}, i) => (
                <div key={i} className={[styles.item, pip && styles[pip]].filter(Boolean).join(' ')}>
                  <div className={styles.id}></div>
                  <div className={styles.words}>
                    {words.map(({w, mark}, j) => (
                      <div
                        key={j}
                        className={[styles.word, mark && styles.mark, mark && styles[`mark-${mark}`]].filter(Boolean).join(' ')}
                        style={{width: w}}
                      ></div>
                    ))}
                  </div>
                  <div className={styles.pip}></div>
                </div>
              ))}
            </div>
          </div>
          {/* Anonymise drop-zone — live marching ants + file drop */}
          <div className={[styles.w, styles['w-upload'], styles.zoneLive].join(' ')}>
            <div className={styles.wHead}>
              <div className={styles.h}></div><div className={styles.t}></div>
            </div>
            <div className={styles.zone}>
              <div className={styles.zoneFile}></div>
              <div className={styles.ico}></div>
              <div className={styles.label}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
