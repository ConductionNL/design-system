/**
 * <DetailHero />
 *
 * Hero pattern shared by app-detail, solution-page, and partner-detail
 * pages. Two-column layout: title + supporting copy on the left,
 * an optional illustration (typically an <AppMock>) on the right.
 *
 * The page-subject icon renders as a small leading hex inline with
 * the H1 title, *not* as a giant right-side panel. That frees the
 * right column for an illustration that shows the product itself.
 *
 *     [crumb]
 *     [status badges]
 *     [hex] [Title]                        [    illustration    ]
 *     tagline
 *     [primary] [secondary] [tertiary]
 *
 * If no illustration is passed, the hero collapses to a single
 * column and the title row stays inline-hex + h1.
 *
 * Usage:
 *
 *   <DetailHero
 *     appId="mydash"
 *     crumb={[{label: 'Apps', href: '/apps'}, 'MyDash']}
 *     status={{label: 'Beta', color: 'var(--c-orange-knvb)'}}
 *     version="v0.9"
 *     locales="NL · EN"
 *     title="MyDash"
 *     tagline="..."
 *     primaryCta={{label: 'Install from app store', href: '/install'}}
 *     icon={<svg>...</svg>}
 *     iconColor="var(--c-blue-cobalt)"
 *     illustration={<AppMock app="mydash" />}
 *   />
 *
 * Each cta object also accepts `tone: "orange"` to flip the primary
 * (or secondary) variant to the KNVB-orange accent. Reserved for
 * product pages with an orange-leaning brand identity (mydash).
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
  illustration,
  className,
  appId,
  downloads,
}) {
  const dlCount = downloads != null ? downloads : (appId ? downloadsForApp(appId) : 0);
  const hasIllustration = Boolean(illustration);

  return (
    <section className={[styles.head, hasIllustration && styles.withIllustration, className].filter(Boolean).join(' ')}>
      {crumb && Array.isArray(crumb) && (
        <div className={styles.crumb}>
          {crumb.map((c, i) => {
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

          {title && (
            <h1 className={styles.title}>
              {icon && (
                <span
                  className={styles.titleIcon}
                  style={iconColor ? {background: iconColor} : undefined}
                  aria-hidden="true"
                >
                  {icon}
                </span>
              )}
              <span className={styles.titleText}>{title}</span>
            </h1>
          )}
          {tagline && <p className={styles.tagline}>{tagline}</p>}

          {(primaryCta || secondaryCta || tertiaryCta) && (
            <div className={styles.actions}>
              {primaryCta && (
                <Button
                  variant="primary"
                  tone={primaryCta.tone}
                  href={primaryCta.href}
                >
                  {primaryCta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  variant="secondary"
                  tone={secondaryCta.tone}
                  href={secondaryCta.href}
                >
                  {secondaryCta.label}
                </Button>
              )}
              {tertiaryCta && <Button variant="ghost" href={tertiaryCta.href}>{tertiaryCta.label} →</Button>}
            </div>
          )}
        </div>

        {hasIllustration && (
          <div className={styles.illustration}>{illustration}</div>
        )}
      </div>
    </section>
  );
}
