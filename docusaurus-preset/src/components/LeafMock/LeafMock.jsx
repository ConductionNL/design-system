/**
 * <LeafMock />
 *
 * Token-built abstract of one workspace integration leaf: the small
 * panels that show *what an app plugs into* — contacts, the meetings
 * calendar, mail, files. Used on Showcase items and app detail pages
 * that previously reused a generic <AppMock> for every leaf.
 *
 * Same abstraction level as <AppMock> (honeycomb.io/technologies/*):
 * greeked content, tokens only, no real text beyond short labels.
 * Four variants, each with a small looping animation on the shared
 * 6s timeline (--lm-dur):
 *
 *   - contacts: address-book rows with pointy-top hex avatars and a
 *     mint sync arrow to a phone silhouette. The arrow pulses and the
 *     phone rows arrive in a stagger (the sync lands on the phone)
 *   - calendar: mini month grid with one highlighted day and a
 *     linked-event chip (lavender bar). The day pops highlighted,
 *     then the event chip slides in beneath
 *   - mail:     message list with one highlighted row carrying a
 *     mint "create from email" action chip. The row highlights, then
 *     the chip pops with an overshoot
 *   - files:    folder/file rows with a link-to-record chip (forest).
 *     The linked row slides in, the chip pops, and its link icon
 *     draws itself (pathLength dash technique)
 *
 * `running={false}` (the `.static` frame class) and the user's
 * prefers-reduced-motion setting freeze each leaf to its meaningful
 * end state: synced rows, highlighted day + chip, highlighted mail
 * row + chip, linked file row.
 *
 * Usage:
 *
 *   <LeafMock leaf="contacts" />
 *   <LeafMock leaf="calendar" caption size="sm" />
 *   <LeafMock leaf="mail" running={false} />
 *
 * Props:
 *   - leaf:      'contacts' | 'calendar' | 'mail' | 'files' (required)
 *   - size:      'sm' | 'md' (default)  — frame width
 *   - caption:   string | true          — small label below the frame;
 *                `true` uses the variant's default label
 *   - running:   boolean (default true) — false freezes the leaf
 *   - className: string
 */

import React from 'react';
import styles from './LeafMock.module.css';

function Greek({w, tone = 'sub'}) {
  return <span className={[styles.greek, styles[`greek-${tone}`]].join(' ')} style={{width: w}} />;
}

function ContactsLeaf() {
  return (
    <div className={styles.contacts}>
      <div className={styles.contactList}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.contactRow}>
            <span className={[styles.hexAvatar, styles[`hexAvatar-${i}`]].join(' ')} />
            <span className={styles.contactLines}>
              <Greek w="64%" tone="title" />
              <Greek w="44%" />
            </span>
          </div>
        ))}
      </div>
      <svg className={styles.syncArrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h13m0 0l-3.5-3.5M17 9l-3.5 3.5M20 15H7m0 0l3.5-3.5M7 15l3.5 3.5" />
      </svg>
      <div className={styles.phone}>
        <div className={styles.phoneScreen}>
          <span className={styles.phoneRow} />
          <span className={styles.phoneRow} />
          <span className={styles.phoneRow} />
        </div>
      </div>
    </div>
  );
}

function CalendarLeaf() {
  /* 7×4 mini month; day 10 (index 9) is the highlighted, linked day. */
  const days = Array.from({length: 28}, (_, i) => i);
  return (
    <div className={styles.calendar}>
      <div className={styles.monthGrid}>
        {days.map((i) => (
          <span key={i} className={[styles.day, i === 9 && styles.dayActive].filter(Boolean).join(' ')} />
        ))}
      </div>
      <div className={styles.eventChip}>
        <span className={styles.eventBar} />
        <span className={styles.eventLines}>
          <Greek w="70%" tone="title" />
          <Greek w="46%" />
        </span>
        <svg className={styles.linkIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1.5 1.5M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6L12.5 17.5" />
        </svg>
      </div>
    </div>
  );
}

function MailLeaf() {
  return (
    <div className={styles.mail}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={[styles.mailRow, i === 1 && styles.mailRowActive].filter(Boolean).join(' ')}>
          <span className={styles.mailDot} />
          <span className={styles.mailLines}>
            <Greek w="58%" tone="title" />
            <Greek w="82%" />
          </span>
          {i === 1 && (
            <span className={styles.actionChip}>
              <svg className={styles.plusIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <Greek w="26px" tone="chip" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function FilesLeaf() {
  return (
    <div className={styles.files}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.fileRow}>
          <span className={[styles.fileIcon, i === 0 && styles.folderIcon].filter(Boolean).join(' ')} />
          <span className={styles.fileLines}>
            <Greek w={i === 1 ? '72%' : '54%'} tone="title" />
          </span>
          {i === 1 && (
            <span className={[styles.actionChip, styles.recordChip].join(' ')}>
              <svg className={styles.linkIcon} viewBox="0 0 24 24" aria-hidden="true">
                {/* pathLength="1" so the draw animation's dash
                    arithmetic is geometry-independent. */}
                <path pathLength="1" d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1.5 1.5M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6L12.5 17.5" />
              </svg>
              <Greek w="26px" tone="chip" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

const VARIANTS = {
  contacts: {Component: ContactsLeaf, label: 'Contacts leaf'},
  calendar: {Component: CalendarLeaf, label: 'Calendar leaf'},
  mail:     {Component: MailLeaf,     label: 'Mail leaf'},
  files:    {Component: FilesLeaf,    label: 'Files leaf'},
};

export default function LeafMock({leaf, size = 'md', caption, running = true, className}) {
  const variant = VARIANTS[leaf];
  if (!variant) {
    return (
      <div className={styles.lm}>
        <div className={[styles.frame, styles[`size-${size}`], className].filter(Boolean).join(' ')}>
          <div className={styles.empty}>Unknown leaf: {leaf}</div>
        </div>
      </div>
    );
  }
  const {Component, label} = variant;
  return (
    <div className={styles.lm}>
      <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
        <div className={[styles.frame, styles[`size-${size}`], !running && styles.static].filter(Boolean).join(' ')}>
          <Component />
        </div>
        {caption && (
          <figcaption className={styles.caption}>
            {caption === true ? label : caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
