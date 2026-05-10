/**
 * <MockScene />
 *
 * Marketing-surface composition. A SidebarMock anchors the centre,
 * three to five WidgetMocks float around it on a tinted cobalt-50
 * surface with a soft hex-network watermark. Reach for this when a
 * card or hero needs to show "data surfaced across the whole
 * workspace": one sidebar + several widgets, each carrying a real
 * integration icon, all lit on the same surface.
 *
 * Sibling to AppMock + WidgetMock + SidebarMock in the mock family.
 * AppMock paints a single product surface with chassis chrome.
 * WidgetMock paints a single dashboard tile. SidebarMock paints a
 * single detail panel. MockScene paints the overlap.
 *
 * Usage:
 *
 *   <MockScene
 *     sidebar={<SidebarMock kind="openregister-metadata" />}
 *     widgets={[
 *       { node: <WidgetMock kind="nextcloud-mail" />,     pos: 'top-left' },
 *       { node: <WidgetMock kind="nextcloud-files" />,    pos: 'top-right' },
 *       { node: <WidgetMock kind="openregister-activity" />, pos: 'bottom-right' },
 *     ]}
 *   />
 *
 * Each widget entry is { node, pos } where `pos` selects a corner of
 * the stage:
 *   'top-left' | 'top-right' |
 *   'middle-left' | 'middle-right' |
 *   'bottom-left' | 'bottom-right'
 *
 * Default rotations and offsets give each widget a slight tilt so
 * the composition reads as playfully arranged rather than gridded.
 *
 * Props:
 *   - sidebar: ReactNode                      (typically <SidebarMock />)
 *   - widgets: Array<{node: ReactNode, pos: string}>
 *   - compact: boolean (default false)        — tighter scene for use
 *                                               inside a card
 *   - className: string
 */

import React from 'react';
import styles from './MockScene.module.css';
import amStyles from '../AppMock/AppMock.module.css';

export default function MockScene({ sidebar, widgets = [], compact = false, className }) {
  return (
    <div className={[amStyles.am, styles.scene, className].filter(Boolean).join(' ')}>
      <div className={[styles.sceneFrame, compact && styles.compact].filter(Boolean).join(' ')}>
        <div className={styles.sceneStage}>
          {widgets.map((w, i) => (
            <div key={i} className={styles.sceneFloat} data-pos={w.pos || 'top-left'}>
              {w.node}
            </div>
          ))}
          {sidebar && (
            <div className={styles.sceneCenter}>
              {sidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
