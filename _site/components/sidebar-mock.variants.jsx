/**
 * sidebar-mock.variants.jsx — JSX source for the SidebarMock kit
 * page's two catalogues. Rendered to static HTML by
 * scripts/build-kit.mjs and spliced into sidebar-mock.html.
 *
 * Two named exports, two BUILD markers, one source file:
 *
 *   StandaloneCatalogue → BUILD:variant-catalogue
 *     A 3-column grid of nine specimen cards, each containing a
 *     SidebarMock rendered standalone (with the .smFrame chassis).
 *
 *   InContextCatalogue → BUILD:incontext-catalogue
 *     A 2-column grid of two AppMock + SidebarMock compositions
 *     showing the sidebar overlaid on the right side of the app it
 *     belongs to. Demonstrates the `sidebar` prop on AppMock.
 *
 * Editing a variant means editing the JSX under
 * docusaurus-preset/src/components/SidebarMock/variants/, then
 * running `npm run build:kit` to regenerate both sections of the
 * kit page from the same React component the published preset
 * ships.
 */

import React from 'react';
import SidebarMock from '../../docusaurus-preset/src/components/SidebarMock/SidebarMock.jsx';
import AppMock from '../../docusaurus-preset/src/components/AppMock/AppMock.jsx';

const STANDALONE_ITEMS = [
  { num: '01', kind: 'procest-xwiki',                   label: 'Procest · xWiki',                tag: 'INFERRED',
    desc: 'Pulls the case-handling protocol page out of xWiki and shows it next to the live case. Wiki text body, headings plus paragraphs plus a checklist.' },
  { num: '02', kind: 'procest-timeline',                label: 'Procest · Timeline',             tag: 'INFERRED',
    desc: 'Stage history vertical: one done, one active in orange, three to-do. Same .now / .late / .todo modifiers as the AppMock procest timeline.' },
  { num: '03', kind: 'docudesk-signatures',             label: 'DocuDesk · Signatures',          tag: 'INFERRED',
    desc: 'Recipients with status pip: signed (mint), pending (orange), declined (red). Avatar palette mix gives the team-of-five feel.' },
  { num: '04', kind: 'docudesk-pii-map',                label: 'DocuDesk · PII map',             tag: 'INFERRED',
    desc: 'Inline pills marking redacted (red) and suggested-to-redact (orange) spans within paragraphs, plus a count of detected PII categories.' },
  { num: '05', kind: 'openregister-metadata',           label: 'OpenRegister · Metadata',        tag: 'INFERRED',
    desc: 'Object frontmatter as a key/value list: register, schema, slug, created, updated. Plus the primary identifiers section below.' },
  { num: '06', kind: 'opencatalogi-publication-history',label: 'OpenCatalogi · History',         tag: 'INFERRED',
    desc: 'Version history of a publication. Avatar plus version label plus timestamp; mint pip for current, red pip for withdrawn.' },
  { num: '07', kind: 'openconnector-run-detail',        label: 'OpenConnector · Run logs',       tag: 'INFERRED',
    desc: 'Single run inspected: header, then a vertical log stream with severity-coded timestamps. Last line is a warn or an error so the eye lands on it.' },
  { num: '08', kind: 'decidesk-decision',               label: 'DeciDesk · Decision detail',     tag: 'INFERRED',
    desc: 'Decision summary, structured fields (date, source meeting, decision-maker), action-items section showing who owns the follow-up.' },
  { num: '09', kind: 'nextcloud-activity',              label: 'Nextcloud · Activity',           tag: 'STOCK',
    desc: 'The stock first-tab activity feed every Nextcloud sidebar carries. Framed for context so MKB readers see where Conduction tabs sit.' },
];

export function StandaloneCatalogue() {
  return (
    <div className="standalone-grid">
      {STANDALONE_ITEMS.map(item => (
        <div className="specimen-card" key={item.kind}>
          <div className="head">
            <span className="num">{item.num}</span>
            <h3>{item.label}</h3>
            <span className="tag">{item.tag}</span>
          </div>
          <p>{item.desc} Slug: <code>{item.kind}</code>.</p>
          <SidebarMock kind={item.kind} />
        </div>
      ))}
    </div>
  );
}

const INCONTEXT_ITEMS = [
  { num: '01', app: 'procest',      kind: 'procest-xwiki',         label: 'Procest with xWiki tab open',
    desc: 'A Procest case loaded in the main column, the xWiki tab of its sidebar pulled out on the right. The case-handling protocol page reads next to the live case, no app switch needed.' },
  { num: '02', app: 'openregister', kind: 'openregister-metadata', label: 'OpenRegister with Metadata tab open',
    desc: 'An OpenRegister object selected in the dashboard. Sidebar shows the object\'s frontmatter on the right: register, schema, slug, owner, identifiers.' },
];

export function InContextCatalogue() {
  return (
    <div className="incontext-grid">
      {INCONTEXT_ITEMS.map(item => (
        <div className="specimen-card" key={item.kind}>
          <div className="head">
            <span className="num">{item.num}</span>
            <h3>{item.label}</h3>
            <span className="tag">COMPOSED</span>
          </div>
          <p>{item.desc}</p>
          <AppMock app={item.app} sidebar={<SidebarMock kind={item.kind} />} />
        </div>
      ))}
    </div>
  );
}

// Default export is a noop; build-kit picks named exports per marker.
export default function () { return null; }
