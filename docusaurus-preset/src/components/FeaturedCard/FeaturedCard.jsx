/**
 * <FeaturedCard />
 *
 * Hero spot at the top of the academy landing. Cobalt-900 ground, body
 * copy on the left, a large pointy-top hex with two satellite hexes on
 * the right. Used to surface one editorial pick per page.
 *
 * Mirrors the .featured-card section in preview/components/academy.html.
 *
 * Per huisstijl, the satellite-3 hex is the page's single KNVB orange
 * accent; the rest is solid cobalt + white. Pass `accent="cobalt"` to
 * suppress the orange accent on screens that already use orange
 * elsewhere.
 *
 * Usage in MDX:
 *
 *   <FeaturedCard
 *     href="/posts/install-opencatalogi"
 *     eyebrow="Featured guide"
 *     title="Install OpenCatalogi in two minutes."
 *     lede="From app store to first register, no terminal required."
 *     ctaLabel="Read the guide"
 *     author={{ name: "Ruben van der Linde" }}
 *     date="2026-05-05"
 *     thumbnail={{ icon: <svg>...</svg> }}
 *   />
 */

import React from 'react';
import HexThumbnail from '../primitives/HexThumbnail';
import HexBullet from '../primitives/HexBullet';
import AuthorByline from '../primitives/AuthorByline';
import styles from './FeaturedCard.module.css';

export default function FeaturedCard({
  href,
  eyebrow,
  title,
  lede,
  ctaLabel = 'Read more',
  author,
  date,
  dateLabel,
  locale,
  thumbnail,
  accent = 'orange',
  className,
}) {
  const Tag = href ? 'a' : 'div';
  const composed = [styles.card, className].filter(Boolean).join(' ');
  const thumbProps = thumbnail || {};

  return (
    <Tag href={href} className={composed}>
      <div className={styles.body}>
        {eyebrow && (
          <span className={styles.eyebrow}>
            <HexBullet size="md" color="var(--c-orange-knvb)" />
            <span>{eyebrow}</span>
          </span>
        )}
        {title && <h2 className={styles.title}>{title}</h2>}
        {lede && <p className={styles.lede}>{lede}</p>}

        {(author || date) && (
          <div className={styles.meta}>
            <AuthorByline
              name={author && author.name}
              avatarSrc={author && author.avatarSrc}
              initials={author && author.initials}
              date={date}
              dateLabel={dateLabel}
              locale={locale}
              tone="on-dark"
            />
          </div>
        )}

        {ctaLabel && (
          <span className={styles.cta}>
            <span>{ctaLabel}</span>
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>

      <div className={styles.visual} aria-hidden="true">
        {thumbProps.src
          ? <HexThumbnail size="xl" tone="cobalt" src={thumbProps.src} alt={thumbProps.alt} />
          : <HexThumbnail size="xl" tone={thumbProps.tone || 'cobalt'}>{thumbProps.icon}</HexThumbnail>}
        <span className={[styles.satellite, styles.s1].join(' ')} />
        <span className={[styles.satellite, styles.s2].join(' ')} />
        <span className={[
          styles.satellite,
          styles.s3,
          accent === 'orange' ? styles.s3Orange : styles.s3Cobalt,
        ].join(' ')} />
      </div>
    </Tag>
  );
}
