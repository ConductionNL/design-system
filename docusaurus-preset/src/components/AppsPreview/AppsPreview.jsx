/**
 * <AppsPreview />
 *
 * Featured apps section: 3-up app cards + "browse all" link.
 * Section-head pattern (eyebrow + h2 + lede) above the cards.
 *
 * Mirrors the .apps-preview section in preview/pages/landing.html,
 * with .app-card cards from preview/components/apps-grid.css.
 *
 * Usage in MDX:
 *
 *   <AppsPreview
 *     eyebrow="Most installed"
 *     title="Three apps that ship the most outcomes."
 *     lede={<>Start with the apps that solve a concrete problem ...</>}
 *     apps={[
 *       {
 *         name: 'OpenCatalogi',
 *         tagline: 'Public software catalog. Every app, dataset...',
 *         status: 'STABLE',
 *         version: 'v2.4 · NL · EN',
 *         href: '/apps/opencatalogi',
 *         icon: <svg>...</svg>,
 *       },
 *       ...
 *     ]}
 *     seeAll={{label: 'Browse all twelve apps', href: '/apps'}}
 *   />
 */

import React from 'react';
import styles from './AppsPreview.module.css';

function AppCard({app}) {
  const statusColor = (app.status || '').toLowerCase() === 'beta'
    ? 'var(--c-orange-knvb)'
    : 'var(--c-mint-500)';

  return (
    <a href={app.href || '#'} className={styles.card}>
      <div className={styles.iconWrap}>{app.icon}</div>
      <div className={styles.name}>{app.name}</div>
      <div className={styles.tagline}>{app.tagline}</div>
      <div className={styles.meta}>
        {app.status && (
          <span className={styles.badge}>
            <span className={styles.badgeHex} style={{background: statusColor}} aria-hidden="true"></span>
            {app.status}
          </span>
        )}
        {app.version && <span className={styles.ver}>{app.version}</span>}
      </div>
    </a>
  );
}

export default function AppsPreview({eyebrow, title, lede, apps = [], seeAll}) {
  return (
    <section className={styles.section}>
      {(eyebrow || title || lede) && (
        <div className={styles.head}>
          <div>
            {eyebrow && (
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowHex} aria-hidden="true"></span>
                {eyebrow}
              </div>
            )}
            {title && <h2 className={styles.title}>{title}</h2>}
          </div>
          {lede && <p className={styles.lede}>{lede}</p>}
        </div>
      )}

      <div className={styles.row}>
        {apps.map((app, i) => (
          <AppCard key={i} app={app} />
        ))}
      </div>

      {seeAll && (
        <a href={seeAll.href || '#'} className={styles.seeAll}>
          {seeAll.label} →
        </a>
      )}
    </section>
  );
}

export {AppCard};
