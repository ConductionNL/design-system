/**
 * <AtomZones />
 *
 * The "Five atoms, one chassis" visual reference. Renders five
 * zone cards, each focusing on one atom of the canonical Conduction
 * app chassis: Topbar, Left navigation, Main column, Page header,
 * Sidebar. The focused atom is outlined in KNVB orange; everything
 * else fades to 25% opacity so the reader sees *where* the atom
 * sits in context.
 *
 * Mirrors the static-HTML reference at
 *   preview/components/app-mock.html#five-atoms
 * so the React surface and the design-system kit page stay aligned.
 *
 * Used by Docusaurus consumers (nextcloud-vue.conduction.nl,
 * procest.conduction.nl, openregister.conduction.nl) to teach the
 * chassis-plus-atoms pattern on architecture pages.
 *
 * Self-contained: bundles its own chassis JSX + zone-focus styles
 * via :global() in AtomZones.module.css. Doesn't reuse <AppMock/>'s
 * variants — those intentionally skip the .pageHeader atom — so
 * the page-header zone can render correctly.
 *
 * No props today. A future `app="..."` prop could re-tint the body
 * accent (cobalt/mint/lavender), but the zone-focus story is
 * inherently chassis-level, not variant-level.
 */

import React from 'react';
import styles from './AtomZones.module.css';

const ZONES = [
  {
    code: '.topbar',
    title: 'Topbar',
    applies: <><strong>App</strong> &middot; <strong>Desk</strong> &middot; always</>,
    body:
      "The Nextcloud chrome row. Sits across every page unconditionally because every Conduction app lives inside Nextcloud's workspace. The shelf icons are the cross-app navigation; per-app links never go here.",
    focus: 'focusTopbar',
    facts: [
      ['Inside', <>logo, 14 app-shelf icons, spacer, optional pill, bell, avatar</>],
      ['Tokens', <><code>--c-blue-cobalt</code> bg; whites at <code>0.4</code> / <code>0.7</code> / <code>1.0</code> alpha</>],
      ['Height', <><code>24px</code> fixed; <code>flex-shrink: 0</code></>],
    ],
    tips: [
      { text: "The shelf shows other Nextcloud apps, never this app's own pages" },
      { text: 'Avatar is the only solid white circle, top-right' },
      { text: "Don't add a per-app logo here; the body handles that", dont: true },
    ],
  },
  {
    code: '.nav',
    title: 'Left navigation',
    applies: <><strong>App</strong> &middot; required &middot; <em className={styles.never}>Desk: never</em></>,
    body:
      "The per-app sidebar. Carries this app's own primary navigation, plus a footer pinned to the bottom for global access (Settings, Feedback). The active item is the only place cobalt-100 backgrounds a row.",
    focus: 'focusNav',
    facts: [
      ['Inside', <>navHead (cobalt-blue card with hex glyph + label), 5&ndash;9 nav items (one with <code>.active</code>), and a <code>.footer</code> with Settings + Feedback pinned to the bottom</>],
      ['Width', <><code>22%</code>, min <code>100px</code>; <code>flex-shrink: 0</code></>],
      ['Tokens', <><code>--c-cobalt-50</code> bg; <code>--c-cobalt-100</code> right border + active bg + footer divider; <code>--c-orange-knvb</code> on the navHead hex</>],
    ],
    tips: [
      { text: 'Always exactly one .active item; never zero, never two' },
      { text: 'Footer always carries Settings + Feedback, anchored bottom via margin-top: auto' },
      { text: "Don't add per-app sign-out here; the user's avatar in the topbar handles identity", dont: true },
    ],
  },
  {
    code: '.col',
    title: 'Main column',
    applies: <><strong>App</strong> &middot; <strong>Desk</strong> &middot; always</>,
    body:
      'The work surface. In an App pattern, the column opens with a .pageHeader (title + actions), then KPI strip and panels. In a Desk pattern, .col nests inside .grid to become a full-bleed widget canvas with no page header.',
    focus: 'focusCol',
    facts: [
      ['Inside', <>App pattern: <code>.pageHeader</code> + <code>.kpiRow</code> + <code>.panelRow</code>s + tables. Desk pattern: <code>.grid</code> with <code>.w</code> widgets (no pageHeader)</>],
      ['Width', <><code>flex: 1</code>; <code>min-width: 0</code>; <code>overflow: hidden</code></>],
      ['Tokens', <>White bg; tokens scope to inner panels (<code>--c-cobalt-100</code> borders, <code>--c-mint-500</code> / <code>--c-orange-knvb</code> KPI accents)</>],
    ],
    tips: [
      { text: 'The single orange accent of the variant lives somewhere in here, never in the rails' },
      { text: "KPI strip is the most-recognisable App-pattern signature; use it when there's a number worth surfacing" },
      { text: "Don't let panels overflow horizontally; min-width: 0 is load-bearing", dont: true },
    ],
  },
  {
    code: '.pageHeader',
    title: 'Page header',
    applies: <><strong>Index</strong> &middot; <strong>Detail</strong> &middot; <em className={styles.never}>Desk: never</em></>,
    body:
      "The first row of .col on every Index and Detail template. Carries the page title (left) and exactly two action buttons (right): one ghost (border-only, secondary action) and one primary (filled cobalt). The header tracks .col's width: when the sidebar is open the header constrains; when the sidebar is closed it spans full-width.",
    focus: 'focusPageHeader',
    facts: [
      ['Inside', <>title-bar (left, cobalt-blue rounded rect with the page title), spacer, then exactly two action buttons: <code>.btn.ghost</code> (white with cobalt border, secondary) on the left of the pair, then <code>.btn</code> (filled cobalt, primary)</>],
      ['Height', <><code>14&ndash;16px</code> band, sits flush with <code>.col</code>'s top padding</>],
      ['Width', <>tracks <code>.col</code>: full-spread when sidebar closed, constrained when sidebar open</>],
      ['Tokens', <><code>--c-blue-cobalt</code> for the title-bar and primary button; <code>--c-cobalt-200</code> border on ghost button; white bg on ghost</>],
    ],
    tips: [
      { text: 'Identical anatomy on Index and Detail; only the title changes' },
      { text: 'Exactly two buttons, never one, never three. If you need a third action, group into an "Actions…" dropdown behind the ghost button' },
      { text: "Don't render the page title as plain text inside a panel; the page header IS the title", dont: true },
    ],
  },
  {
    code: '.detail',
    title: 'Sidebar',
    applies: <><strong>App</strong> &middot; optional &middot; <em className={styles.never}>Desk: never</em></>,
    body:
      'The right-hand sidebar. Optional, dismissible, anchored to the active record or the active view. Carries an icon + title + description in a header, then a tabbed body (Search / Columns by default). Class stays .detail for code; we call it the Sidebar in copy.',
    focus: 'focusDetail',
    facts: [
      ['Inside', <><code>.sb-head</code> (icon + title + description + close), <code>.sb-tabs</code> (2&ndash;3 tabs, one <code>.active</code>), then a <code>.sb-body</code> of inputs / filters / pinned metadata</>],
      ['Width', <><code>26%</code>, min <code>130px</code>; <code>flex-shrink: 0</code></>],
      ['Tokens', <>White bg; <code>--c-cobalt-100</code> left border; <code>--c-blue-cobalt</code> active-tab underline; <code>--c-cobalt-50</code> on the icon background</>],
    ],
    tips: [
      { text: "Sidebar should be dismissible; it's a drawer, not a permanent rail" },
      { text: 'Default tabs on an Index page: Search + Columns. Default on Detail: Overview + Activity' },
      { text: "Don't put global navigation here; that's .nav's job. The sidebar is scoped to the current view.", dont: true },
    ],
  },
];

/**
 * Reference chassis with all five atoms: topbar, nav (with footer),
 * col (with pageHeader + kpiRow + panelRow), and detail.rich.
 *
 * Class names are emitted as global strings so the chassis renders
 * with the same selectors used in the design-system kit page; the
 * AtomZones.module.css uses :global(...) to target them. This means
 * one source of styling for the chassis, regardless of whether it's
 * loaded inside a CSS-Modules pipeline (preset consumers) or via the
 * static kit page.
 */
function ChassisFrame({ focus }) {
  return (
    <div className={`${styles.zoneFrame} ${styles[focus]}`}>
      <div className="am-frame">
        <div className="am-topbar">
          <div className="am-logo"></div>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="am-icon"></div>
          ))}
          <div className="am-spacer"></div>
          <div className="am-bell"></div>
          <div className="am-avatar"></div>
        </div>
        <div className="am-body">
          <div className="am-nav">
            <div className="am-navHead">
              <div className="am-h"></div>
              <div className="am-l"></div>
            </div>
            {[true, false, false, false, false].map((active, i) => (
              <div
                key={i}
                className={`am-item ${active ? 'am-active' : ''}`}
              >
                <div className="am-ico"></div>
                <div className="am-l"></div>
              </div>
            ))}
            <div className="am-footer">
              <div className="am-item">
                <div className="am-ico"></div>
                <div className="am-l"></div>
              </div>
              <div className="am-item">
                <div className="am-ico"></div>
                <div className="am-l"></div>
              </div>
            </div>
          </div>
          <div className="am-col">
            <div className="am-pageHeader">
              <div className="am-title-bar"></div>
              <div className="am-spacer"></div>
              <div className="am-actions">
                <div className="am-btn am-ghost"></div>
                <div className="am-btn"></div>
              </div>
            </div>
            <div className="am-kpiRow">
              <div className="am-kpi">
                <div className="am-ico"></div>
                <div className="am-meta">
                  <div className="am-num"></div>
                  <div className="am-label"></div>
                </div>
              </div>
              <div className="am-kpi am-forest">
                <div className="am-ico"></div>
                <div className="am-meta">
                  <div className="am-num"></div>
                  <div className="am-label"></div>
                </div>
              </div>
              <div className="am-kpi am-amber">
                <div className="am-ico"></div>
                <div className="am-meta">
                  <div className="am-num"></div>
                  <div className="am-label"></div>
                </div>
              </div>
            </div>
            <div className="am-panelRow">
              <div className="am-panel">
                <div className="am-head">
                  <div className="am-title"></div>
                </div>
                <div className="am-stack">
                  <div className="am-item">
                    <div className="am-lines">
                      <div className="am-l1"></div>
                    </div>
                  </div>
                  <div className="am-item">
                    <div className="am-lines">
                      <div className="am-l1"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="am-panel">
                <div className="am-head">
                  <div className="am-title"></div>
                </div>
                <div className="am-stack">
                  <div className="am-item">
                    <div className="am-av am-b"></div>
                    <div className="am-lines">
                      <div className="am-l1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="am-detail am-rich">
            <div className="am-sb-head">
              <div className="am-ico"></div>
              <div className="am-meta">
                <div className="am-title"></div>
                <div className="am-desc"></div>
              </div>
              <div className="am-close"></div>
            </div>
            <div className="am-sb-tabs">
              <div className="am-sb-tab am-active">
                <div className="am-ico"></div>
                <div className="am-l"></div>
              </div>
              <div className="am-sb-tab">
                <div className="am-ico"></div>
                <div className="am-l"></div>
              </div>
            </div>
            <div className="am-sb-body">
              <div className="am-sb-input"></div>
              <div className="am-sb-filter">
                <div className="am-lbl"></div>
                <div className="am-field"></div>
              </div>
              <div className="am-sb-filter">
                <div className="am-lbl"></div>
                <div className="am-field"></div>
              </div>
              <div className="am-sb-filter">
                <div className="am-lbl"></div>
                <div className="am-field"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoneCard({ zone }) {
  return (
    <div className={styles.zoneCard}>
      <div className={styles.zoneHead}>
        <code>{zone.code}</code>
        <h3>{zone.title}</h3>
        <span className={styles.applies}>{zone.applies}</span>
      </div>
      <p className={styles.lede}>{zone.body}</p>
      <ChassisFrame focus={zone.focus} />
      <dl className={styles.facts}>
        {zone.facts.map(([term, def], i) => (
          <React.Fragment key={i}>
            <dt>{term}</dt>
            <dd>{def}</dd>
          </React.Fragment>
        ))}
      </dl>
      <ul className={styles.tips}>
        {zone.tips.map((tip, i) => (
          <li key={i} className={tip.dont ? styles.dont : undefined}>
            {tip.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AtomZones() {
  return (
    <div className={styles.zones}>
      {ZONES.map((zone) => (
        <ZoneCard key={zone.code} zone={zone} />
      ))}
    </div>
  );
}
