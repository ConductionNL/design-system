/**
 * <SidebarMock />
 *
 * Token-painted abstract of the Nextcloud right-side detail panel.
 * Each Conduction app registers tabs into specific Nextcloud
 * sidebars (Procest adds xWiki + Timeline tabs to the case sidebar,
 * DocuDesk adds Signatures + PII Map to the document sidebar, and
 * so on). A SidebarMock variant represents one such sidebar with
 * one tab active.
 *
 * Markup matches the existing .detail.rich pattern that already
 * lived in the AppMock kit anatomy: a .sb-head row (icon + meta of
 * title + description + close), a .sb-tabs strip (one per registered
 * tab, active marker on the current one), and a .sb-body. All
 * styles live in AppMock.module.css under .am .detail.rich; the
 * body atoms (smKv / smPerson / smStage / smLog / smPii) live in
 * SidebarMock.module.css under .am .sb-body so they only apply
 * inside a sidebar.
 *
 * Two render modes:
 *
 *   STANDALONE (default): wraps the .detail.rich panel in
 *   <div class="am sm"> + .smFrame so it reads as a card on the
 *   kit page. Use in marketing copy that talks about a single
 *   sidebar surface in isolation.
 *
 *     <SidebarMock kind="procest-xwiki" />
 *
 *   EMBEDDED: drops the .smFrame wrapper, leaving just
 *   <div class="detail rich">…</div>. Slots into the .body flex
 *   layout of an AppMock variant as a sibling of .col, taking the
 *   detail-rail position. Set automatically by AppMock when the
 *   `sidebar` prop is a SidebarMock JSX element.
 *
 *     <AppMock app="procest" sidebar={<SidebarMock kind="procest-xwiki" />} />
 *
 * Status colour map matches WidgetMock and AppMock atoms:
 *   mint     = stable / done / signed
 *   orange   = active / pending / due soon
 *   red      = blocked / overdue / failed
 *   cobalt-200 = upcoming / idle / no action
 *
 * Props:
 *   - kind:     one of VARIANTS keys      (required)
 *   - embedded: boolean (default false)   — drop the standalone
 *                                           .smFrame chrome so the
 *                                           panel slots into
 *                                           AppMock's .body layout
 *   - className: string
 */

import React from 'react';
import styles from './SidebarMock.module.css';
import amStyles from '../AppMock/AppMock.module.css';

import ProcestXWiki                  from './variants/ProcestXWiki.jsx';
import ProcestTimeline               from './variants/ProcestTimeline.jsx';
import DocuDeskSignatures            from './variants/DocuDeskSignatures.jsx';
import DocuDeskPiiMap                from './variants/DocuDeskPiiMap.jsx';
import OpenRegisterMetadata          from './variants/OpenRegisterMetadata.jsx';
import OpenCatalogiPublicationHistory from './variants/OpenCatalogiPublicationHistory.jsx';
import OpenConnectorRunDetail        from './variants/OpenConnectorRunDetail.jsx';
import DeciDeskDecision              from './variants/DeciDeskDecision.jsx';
import NextcloudActivity             from './variants/NextcloudActivity.jsx';

/**
 * Each VARIANTS entry carries:
 *   Component: the JSX that fills the .sb-body
 *   label:     human-readable name (used in caption / kit page)
 *   tabs:      ordered list of tabs with one .active. The id is
 *              decorative (rendered as a placeholder bar in .sb-tab .l)
 *              but the active flag drives the highlight.
 */
const VARIANTS = {
  'procest-xwiki': {
    Component: ProcestXWiki,
    label: 'Procest · Case sidebar, xWiki tab',
    tabs: [
      { id: 'activity',  active: false },
      { id: 'xwiki',     active: true  },
      { id: 'timeline',  active: false },
      { id: 'documents', active: false },
    ],
  },
  'procest-timeline': {
    Component: ProcestTimeline,
    label: 'Procest · Case sidebar, Timeline tab',
    tabs: [
      { id: 'activity',  active: false },
      { id: 'xwiki',     active: false },
      { id: 'timeline',  active: true  },
      { id: 'documents', active: false },
    ],
  },
  'docudesk-signatures': {
    Component: DocuDeskSignatures,
    label: 'DocuDesk · Document sidebar, Signatures tab',
    tabs: [
      { id: 'activity',      active: false },
      { id: 'signatures',    active: true  },
      { id: 'pii',           active: false },
      { id: 'versions',      active: false },
    ],
  },
  'docudesk-pii-map': {
    Component: DocuDeskPiiMap,
    label: 'DocuDesk · Document sidebar, PII map tab',
    tabs: [
      { id: 'activity',      active: false },
      { id: 'signatures',    active: false },
      { id: 'pii',           active: true  },
      { id: 'versions',      active: false },
    ],
  },
  'openregister-metadata': {
    Component: OpenRegisterMetadata,
    label: 'OpenRegister · Object sidebar, Metadata tab',
    tabs: [
      { id: 'activity', active: false },
      { id: 'metadata', active: true  },
      { id: 'audit',    active: false },
    ],
  },
  'opencatalogi-publication-history': {
    Component: OpenCatalogiPublicationHistory,
    label: 'OpenCatalogi · Publication sidebar, History tab',
    tabs: [
      { id: 'activity', active: false },
      { id: 'history',  active: true  },
      { id: 'sources',  active: false },
    ],
  },
  'openconnector-run-detail': {
    Component: OpenConnectorRunDetail,
    label: 'OpenConnector · Run sidebar, Logs tab',
    tabs: [
      { id: 'activity', active: false },
      { id: 'logs',     active: true  },
      { id: 'mapping',  active: false },
    ],
  },
  'decidesk-decision': {
    Component: DeciDeskDecision,
    label: 'DeciDesk · Decision sidebar, Detail tab',
    tabs: [
      { id: 'activity', active: false },
      { id: 'detail',   active: true  },
      { id: 'actions',  active: false },
    ],
  },
  'nextcloud-activity': {
    Component: NextcloudActivity,
    label: 'Nextcloud · Stock activity feed',
    tabs: [
      { id: 'activity', active: true  },
      { id: 'comments', active: false },
    ],
  },
};

export default function SidebarMock({ kind, embedded = false, className }) {
  const variant = VARIANTS[kind];
  if (!variant) {
    return (
      <div className={[amStyles.am, styles.sm].filter(Boolean).join(' ')}>
        <div className={styles.smFrame}>
          <div style={{ padding: 12, color: 'var(--c-cobalt-400)', fontSize: 11 }}>Unknown sidebar: {kind}</div>
        </div>
      </div>
    );
  }
  const { Component, tabs } = variant;
  const panel = (
    <div className={[amStyles.detail, amStyles.rich].join(' ')}>
      <div className={amStyles['sb-head']}>
        <div className={amStyles.ico}></div>
        <div className={amStyles.meta}>
          <div className={amStyles.title}></div>
          <div className={amStyles.desc}></div>
        </div>
        <div className={amStyles.close}></div>
      </div>
      {tabs && tabs.length > 0 && (
        <div className={amStyles['sb-tabs']}>
          {tabs.map((t, i) => (
            <div key={t.id || i} className={[amStyles['sb-tab'], t.active && amStyles.active].filter(Boolean).join(' ')}>
              <div className={amStyles.ico}></div>
              <div className={amStyles.l}></div>
            </div>
          ))}
        </div>
      )}
      <div className={amStyles['sb-body']}>
        <Component />
      </div>
    </div>
  );

  if (embedded) return panel;

  return (
    <div className={[amStyles.am, styles.sm, className].filter(Boolean).join(' ')}>
      <div className={styles.smFrame}>
        {panel}
      </div>
    </div>
  );
}
