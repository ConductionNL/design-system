/**
 * app-mock.variants.jsx — JSX source for the kit page's variant
 * catalogue. Rendered to static HTML by scripts/build-kit.mjs and
 * spliced into preview/components/app-mock.html between the
 * <!-- BUILD:variant-catalogue --> markers.
 *
 * This is the only place where the per-app chassis HTML is owned.
 * Editing a variant means editing the JSX under
 * docusaurus-preset/src/components/AppMock/variants/ (NOT this file
 * directly). Re-running `npm run build:kit` regenerates this section
 * of the kit page from the same React component the published
 * preset ships, eliminating drift between identity.conduction.nl
 * and conduction.nl.
 *
 * Surrounding chrome on the kit page (hero, anatomy, zones, atoms,
 * frame-sizes, divider, status note, tab-swap script) stays as
 * authored HTML in app-mock.html — those parts are not driven by
 * React components and have no drift surface.
 *
 * The catalogue itself: thirteen <AppMock> instances, one per app.
 * MyDash carries four variants behind a tab strip; the rest are
 * single-variant. Clicking a tab toggles which .variant-pane is
 * .is-active inside the same .specimen-card, wired by the inline
 * <script> at the bottom of app-mock.html.
 */

import React from 'react';
import AppMock from '../../docusaurus-preset/src/components/AppMock/AppMock.jsx';

export default function VariantCatalogue() {
  return (
    <div className="variant-grid">

      {/* ============================== 01 · MyDash (4 variants, tabbed) ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">01</span>
          <h3>MyDash</h3>
          <span className="tag">SCREENSHOT-BASED · 4 VARIANTS</span>
        </div>
        <ul className="variant-tabs">
          <li><button className="variant-tab is-active" data-target="mydash-default">Default</button></li>
          <li><button className="variant-tab" data-target="mydash-tiles">Tiles &amp; grids</button></li>
          <li><button className="variant-tab" data-target="mydash-bi">BI on registers</button></li>
          <li><button className="variant-tab" data-target="mydash-widgets">Widgets</button></li>
        </ul>
        <div className="variant-pane is-active" data-variant="mydash-default">
          <p>Personal home, full-bleed cobalt with a 4-column widget grid. Big primary tiles (Intranet, Calendar, Files) sit beside info widgets with avatar lists, empty states, and an upload drop-zone. Slug: <code>mydash</code>.</p>
          <AppMock app="mydash" />
        </div>
        <div className="variant-pane" data-variant="mydash-tiles">
          <p>Nextcloud-integration angle. Hex-icon launcher tiles deeplink into Nextcloud, external URLs, or sub-grids of further tiles. Mock pictures three launcher tiles, a 2&times;2 sub-grid, files list, calendar mini-grid, and a Decks board. Slug: <code>mydash-tiles</code>.</p>
          <AppMock app="mydash-tiles" />
        </div>
        <div className="variant-pane" data-variant="mydash-bi">
          <p>BI-graph angle. Any chart, drawn directly on a register without ETL. Mock shows a 2&times;2 grid of graph cards (bar, line, donut, second bar), KPI tiles, plus a ranked-list table widget. Slug: <code>mydash-bi</code>.</p>
          <AppMock app="mydash-bi" />
        </div>
        <div className="variant-pane" data-variant="mydash-widgets">
          <p>Cross-app widget angle. Any Conduction app that registers a Nextcloud dashboard widget shows up here: DocuDesk dropzone, Procest werkvoorraad, Mail, Calendar, Jira, RSS, video shortcut. Slug: <code>mydash-widgets</code>.</p>
          <AppMock app="mydash-widgets" />
        </div>
      </div>

      {/* ============================== 02 · OpenCatalogi ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">02</span>
          <h3>OpenCatalogi</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>Federated publication catalogue. Centre is a 3&times;2 grid of catalogue cards, each with a hex glyph in a different family colour to signal categorical mix. Slug: <code>opencatalogi</code>.</p>
        <AppMock app="opencatalogi" />
      </div>

      {/* ============================== 03 · OpenConnector ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">03</span>
          <h3>OpenConnector</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>Integration plane. Centre stage is a single canonical pipeline (lavender source &rarr; cobalt connector &rarr; forest target) with a recent-runs status table below. Slug: <code>openconnector</code>.</p>
        <AppMock app="openconnector" />
      </div>

      {/* ============================== 04 · OpenRegister ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">04</span>
          <h3>OpenRegister</h3>
          <span className="tag">SCREENSHOT-BASED</span>
        </div>
        <p>Three-pane admin: nav left, dashboard centre, detail rail right. KPI strip on top, two-by-two analytical panels below. The right rail carries Filter Statistics, Totals, and Orphaned Items. Slug: <code>openregister</code>.</p>
        <AppMock app="openregister" />
      </div>

      {/* ============================== 05 · Procest ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">05</span>
          <h3>Procest</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>Case management for ZGW processes. Centre runs the stage timeline across the top (one done, one active in orange, three to-do) above a recent-cases table with status pills. Slug: <code>procest</code>.</p>
        <AppMock app="procest" />
      </div>

      {/* ============================== 06 · DeciDesk ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">06</span>
          <h3>DeciDesk</h3>
          <span className="tag">SCREENSHOT-BASED</span>
        </div>
        <p>Decision and minutes tooling for boards. Left nav, action row top right (New Decision / Action Item / Minutes), KPI cards, two side-by-side tables for notulen and besluiten. Slug: <code>decidesk</code>.</p>
        <AppMock app="decidesk" />
      </div>

      {/* ============================== 07 · DocuDesk ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">07</span>
          <h3>DocuDesk</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>Document workshop. Template-driven generation, anonymisation, signing, archiving. Centre lists recent documents with status pips and an anonymise drop-zone widget below. Slug: <code>docudesk</code>.</p>
        <AppMock app="docudesk" />
      </div>

      {/* ============================== 08 · LarpingApp ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">08</span>
          <h3>LarpingApp</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>LARP setting management: characters, scenes, NPCs, factions. Centre shows a 3&times;2 character card grid with hex avatars in family tones, plus a scene timeline strip on top. Slug: <code>larpingapp</code>.</p>
        <AppMock app="larpingapp" />
      </div>

      {/* ============================== 09 · NLDesign ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">09</span>
          <h3>NLDesign</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>NL Design System theme settings panel. Centre shows a colour-swatch row, type specimen, and component preview panels stacked vertically. Slug: <code>nldesign</code>.</p>
        <AppMock app="nldesign" />
      </div>

      {/* ============================== 10 · OpenWoo ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">10</span>
          <h3>OpenWoo</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>Woo publication catalogue. Eleven Woo categories, citizen-search, audit log, federation to data.overheid.nl. Centre is a 3&times;2 grid of category cards in different family colours. Slug: <code>openwoo</code>.</p>
        <AppMock app="openwoo" />
      </div>

      {/* ============================== 11 · PipelinQ ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">11</span>
          <h3>PipelinQ</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>CRM with kanban deal-flow. Five-column board (lead, qualified, proposal, won, lost) with KPI strip on top (pipeline value, win rate, deals this week). Slug: <code>pipelinq</code>.</p>
        <AppMock app="pipelinq" />
      </div>

      {/* ============================== 12 · SoftwareCatalog ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">12</span>
          <h3>SoftwareCatalog</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>IT-asset inventory. Tabular app list with stable / update-available / end-of-life status pips, plus a licence-renewal timeline bar chart on top. Slug: <code>softwarecatalog</code>.</p>
        <AppMock app="softwarecatalog" />
      </div>

      {/* ============================== 13 · ZaakAfhandelApp ============================== */}
      <div className="specimen-card">
        <div className="head">
          <span className="num">13</span>
          <h3>ZaakAfhandelApp</h3>
          <span className="tag">INFERRED</span>
        </div>
        <p>Citizen plus case-worker portal. ZGW APIs, archive interfaces. Centre runs the active case-worker queue with stage pips on top of a citizen-side timeline of recent submissions. Slug: <code>zaakafhandelapp</code>.</p>
        <AppMock app="zaakafhandelapp" />
      </div>

    </div>
  );
}
