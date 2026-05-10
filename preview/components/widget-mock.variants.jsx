/**
 * widget-mock.variants.jsx — JSX source for the WidgetMock kit
 * page's variant catalogue. Rendered to static HTML by
 * scripts/build-kit.mjs and spliced into widget-mock.html between
 * the <!-- BUILD:variant-catalogue --> markers.
 *
 * Same arrangement as app-mock.variants.jsx: this is the only place
 * the per-widget chassis HTML is owned. Editing a widget means
 * editing the JSX under
 * docusaurus-preset/src/components/WidgetMock/variants/, then
 * running `npm run build:kit` to regenerate this section.
 */

import React from 'react';
import WidgetMock from '../../docusaurus-preset/src/components/WidgetMock/WidgetMock.jsx';

const ITEMS = [
  { num: '01', label: 'DocuDesk · Anonymise drop',         tag: 'INFERRED', kind: 'docudesk-anonymise',
    desc: 'Drop a document into the tile, get back a redacted copy. Action-first widget; no status pip, no list, just the drop-zone.' },
  { num: '02', label: 'DocuDesk · Pending signatures',     tag: 'INFERRED', kind: 'docudesk-pending-sign',
    desc: 'Documents waiting on a signature, ranked by oldest. Pip colour shows how stuck each one is: orange waiting, red blocked, cobalt-200 idle.' },
  { num: '03', label: 'Procest · Werkvoorraad',            tag: 'INFERRED', kind: 'procest-werkvoorraad',
    desc: 'Your case queue. Stage pip on the left, case title in the middle, owner avatar on the right. Active stages glow orange, SLA breaches glow red.' },
  { num: '04', label: 'Procest · Due today',               tag: 'INFERRED', kind: 'procest-due-today',
    desc: 'A deadline-shaped take on the same atom. Cases that hit their deadline today or earlier, mostly red. Read it, then act.' },
  { num: '05', label: 'OpenRegister · Activity',           tag: 'INFERRED', kind: 'openregister-activity',
    desc: 'Read and write rate over the past N hours, drawn as a sparkline. The dot on the right is "now". Quick health glance for an admin.' },
  { num: '06', label: 'OpenCatalogi · Recent publications',tag: 'INFERRED', kind: 'opencatalogi-publications',
    desc: 'Last five items federated to the public catalogue. Type badge on the left, title in the middle, status pip on the right.' },
  { num: '07', label: 'OpenConnector · Recent runs',       tag: 'INFERRED', kind: 'openconnector-runs',
    desc: 'Last few integration runs with status pip: mint success, orange partial, red failed, cobalt-200 scheduled.' },
  { num: '08', label: 'DeciDesk · Action items',           tag: 'INFERRED', kind: 'decidesk-actions',
    desc: 'Action items the viewer owns, sorted by due date. Pip colour separates overdue, due-this-week, done, and upcoming.' },
  { num: '09', label: 'PipelinQ · Deals closing',          tag: 'INFERRED', kind: 'pipelinq-deals',
    desc: 'Deals expected to close this week, ranked by value. Avatar reads as the assigned rep, l1 the deal name, l2 value plus stage.' },
  { num: '10', label: 'Nextcloud · Important mail',        tag: 'STOCK',    kind: 'nextcloud-mail',
    desc: 'The stock Nextcloud Mail dashboard widget, framed for context. Shown so MKB readers can place where Conduction widgets sit.' },
  { num: '11', label: 'Nextcloud · Calendar',              tag: 'STOCK',    kind: 'nextcloud-calendar',
    desc: 'Stock Nextcloud calendar mini-grid: today in orange, events in cobalt-300, leading and trailing days muted.' },
  { num: '12', label: 'Nextcloud · Recent files',          tag: 'STOCK',    kind: 'nextcloud-files',
    desc: 'Stock recent-files widget. Type-coloured icons: orange folders, terracotta documents, forest sheets, plain images.' },
  { num: '13', label: 'Nextcloud · Decks',                 tag: 'STOCK',    kind: 'nextcloud-decks',
    desc: 'Stock Decks board. Three columns of cards with priority borders: orange urgent, mint done, plain default.' },
  { num: '14', label: 'Nextcloud · RSS feed',              tag: 'STOCK',    kind: 'nextcloud-rss',
    desc: 'Stock RSS reader. Source badge, title, when. No avatar, no pip; the metadata IS the status.' },
];

export default function WidgetCatalogue() {
  return (
    <div className="variant-grid">
      {ITEMS.map(item => (
        <div className="specimen-card" key={item.kind}>
          <div className="head">
            <span className="num">{item.num}</span>
            <h3>{item.label}</h3>
            <span className="tag">{item.tag}</span>
          </div>
          <p>{item.desc} Slug: <code>{item.kind}</code>.</p>
          <WidgetMock kind={item.kind} />
        </div>
      ))}
    </div>
  );
}
