/**
 * DocuDesk · Anonymise drop widget.
 *
 * Drop a document into the dashboard tile, get back a redacted copy.
 * Visual: dashed cobalt drop-zone with a hex glyph. Status-pill is
 * absent: this widget is action-first, not status-first.
 *
 * Animation (wave 5, `.zoneLive`): the dashed border marches, a file
 * hex drops into the zone, and the zone flashes mint as the redacted
 * copy is confirmed. Static frames show the resting dropzone.
 */
import React from 'react';
import styles from '../../AppMock/AppMock.module.css';

export default function DocuDeskAnonymise() {
  return (
    <div className={[styles.w, styles['w-upload'], styles.zoneLive].join(' ')}>
      <div className={styles.wHead}>
        <div className={styles.h}></div>
        <div className={styles.t}></div>
      </div>
      <div className={styles.zone}>
        <div className={styles.zoneFile}></div>
        <div className={styles.ico}></div>
        <div className={styles.label}></div>
      </div>
    </div>
  );
}
