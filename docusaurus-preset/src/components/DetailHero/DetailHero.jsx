/**
 * <DetailHero />
 *
 * Hero pattern shared by app-detail, solution-page, and partner-detail
 * pages from preview/pages/*. Two-column 1fr/360px grid: badge row +
 * title + tagline + actions on the left, a 360x416 cobalt hex with
 * the page subject's icon on the right.
 *
 * Mirrors the .head section in preview/pages/app-detail.html (and the
 * near-identical heads on solution-page.html / partner-detail.html).
 *
 * Usage:
 *
 *   <DetailHero
 *     crumb={[{label: 'Apps', href: '/apps'}, 'OpenRegister']}
 *     status={{label: 'Stable', color: 'var(--c-mint-500)'}}
 *     version="v3.1"
 *     locales="NL · EN"
 *     title="OpenRegister"
 *     tagline="Schemas, registers, structured data objects, the typed-data backbone for every other Conduction app."
 *     primaryCta={{label: 'Install from app store', href: '/install'}}
 *     secondaryCta={{label: 'Read the docs', href: '/docs/openregister'}}
 *     tertiaryCta={{label: 'View on GitHub', href: 'https://github.com/...'}}
 *     icon={<svg>...</svg>}
 *     iconColor="var(--c-blue-cobalt)"
 *   />
 */

import React from 'react';
import HexBullet from '../primitives/HexBullet';
import Button from '../primitives/Button';
import {downloadsForApp, formatDownloads} from '../../data/app-downloads';
import styles from './DetailHero.module.css';

export default function DetailHero({
  crumb,
  status,
  version,
  locales,
  title,
  tagline,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  icon,
  iconColor,
  className,
  appId,
  downloads,
}) {
  const dlCount = downloads != null ? downloads : (appId ? downloadsForApp(appId) : 0);

  return (
    <section className={[styles.head, className].filter(Boolean).join(' ')}>
      {crumb && Array.isArray(crumb) && (
        <div className={styles.crumb}>
          {crumb.map((c, i) => {
            const last = i === crumb.length - 1;
            const sep = i < crumb.length - 1 ? <span className={styles.sep}>/</span> : null;
            if (typeof c === 'string') {
              return <React.Fragment key={i}>{c}{sep}</React.Fragment>;
            }
            return (
              <React.Fragment key={i}>
                {c.href
                  ? <a href={c.href}>{c.label}</a>
                  : <span>{c.label}</span>}
                {sep}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className={styles.headInner}>
        <div className={styles.copy}>
          {(status || version || locales || dlCount > 0) && (
            <div className={styles.badgeRow}>
              {status && (
                <span className={styles.badge}>
                  <HexBullet size="md" color={status.color || 'var(--c-mint-500)'} />
                  {status.label}
                </span>
              )}
              {version && <span className={[styles.badge, styles.versionBadge].join(' ')}>{version}</span>}
              {locales && <span className={[styles.badge, styles.versionBadge].join(' ')}>{locales}</span>}
              {dlCount > 0 && (
                <span
                  className={[styles.badge, styles.downloadsBadge].join(' ')}
                  title="Total release-asset downloads from GitHub. Updated weekdays at 09:00."
                  data-app-downloads={appId || ''}
                >
                  <svg className={styles.downloadIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/>
                  </svg>
                  {formatDownloads(dlCount)} downloads
                </span>
              )}
            </div>
          )}

          {title && <h1 className={styles.title}>{title}</h1>}
          {tagline && <p className={styles.tagline}>{tagline}</p>}

          {(primaryCta || secondaryCta || tertiaryCta) && (
            <div className={styles.actions}>
              {primaryCta && <Button variant="primary" href={primaryCta.href}>{primaryCta.label}</Button>}
              {secondaryCta && <Button variant="secondary" href={secondaryCta.href}>{secondaryCta.label}</Button>}
              {tertiaryCta && <Button variant="ghost" href={tertiaryCta.href}>{tertiaryCta.label} →</Button>}
            </div>
          )}
        </div>

        {icon && (
          <div className={styles.appHex} style={iconColor ? {background: iconColor} : undefined}>
            {icon}
          </div>
        )}
      </div>
    </section>
  );
}
