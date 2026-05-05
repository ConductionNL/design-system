/**
 * <ContentCard /> + <ContentCardGrid />
 *
 * Card for an academy entry: blog post, guide, case study, webinar,
 * tutorial. Two-column card with a hex thumbnail panel on the left
 * and meta + title + tags on the right.
 *
 * Mirrors the "Keep learning…" cards in preview/components/academy.html
 * and the academy.conduction.nl landing.
 *
 * Visual structure:
 *
 *   ┌────────────────────────────────────────────┐
 *   │  ┌────────┐                                │
 *   │  │  hex   │   Author · Date                │
 *   │  │  thumb │   Title goes here.             │
 *   │  │        │   Optional summary line.       │
 *   │  └────────┘   ⬢ Type  ⬢ Tag  ⬢ Tag         │
 *   └────────────────────────────────────────────┘
 *
 * Card becomes an <a> when href is provided.
 *
 * Usage in MDX:
 *
 *   <ContentCardGrid columns={2}>
 *     <ContentCard
 *       href="/posts/install-opencatalogi"
 *       contentType="guide"
 *       title="Install OpenCatalogi in two minutes."
 *       summary="From app store to first register, no terminal required."
 *       author={{ name: "Ruben van der Linde" }}
 *       date="2026-05-05"
 *       tags={["OpenCatalogi", "Install"]}
 *       thumbnail={{ icon: <svg>...</svg>, tone: 'cobalt-deep' }}
 *     />
 *   </ContentCardGrid>
 */

import React from 'react';
import HexThumbnail from '../primitives/HexThumbnail';
import AuthorByline from '../primitives/AuthorByline';
import Pill from '../primitives/Pill';
import {
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_BULLET_COLOR,
} from '../ContentTypeFilter/contentTypes';
import styles from './ContentCard.module.css';

export function ContentCardGrid({columns = 2, children, className}) {
  const composed = [
    styles.grid,
    styles['cols-' + columns],
    className,
  ].filter(Boolean).join(' ');
  return <div className={composed}>{children}</div>;
}

export default function ContentCard({
  href,
  contentType,
  contentTypeLabel,
  title,
  summary,
  author,
  date,
  dateLabel,
  locale,
  tags = [],
  thumbnail,
  className,
  ...rest
}) {
  const Tag = href ? 'a' : 'div';
  const composed = [styles.card, className].filter(Boolean).join(' ');

  const thumbProps = thumbnail || {};
  const panelToneClass = thumbProps.panelTone
    ? styles['panel-' + thumbProps.panelTone]
    : styles['panel-cobalt-deep'];

  const typeLabel = contentTypeLabel
    || (contentType && CONTENT_TYPE_LABELS[contentType])
    || null;
  const typeBullet = contentType
    ? CONTENT_TYPE_BULLET_COLOR[contentType]
    : undefined;

  return (
    <Tag href={href} className={composed} {...rest}>
      <div className={[styles.thumbPanel, panelToneClass].join(' ')}>
        {thumbProps.src
          ? <HexThumbnail size={thumbProps.size || 'md'} tone={thumbProps.tone || 'cobalt'} src={thumbProps.src} alt={thumbProps.alt} />
          : <HexThumbnail size={thumbProps.size || 'md'} tone={thumbProps.tone || 'cobalt'}>{thumbProps.icon}</HexThumbnail>}
      </div>

      <div className={styles.body}>
        {(author || date) && (
          <AuthorByline
            name={author && author.name}
            avatarSrc={author && author.avatarSrc}
            initials={author && author.initials}
            date={date}
            dateLabel={dateLabel}
            locale={locale}
          />
        )}

        {title && <h3 className={styles.title}>{title}</h3>}
        {summary && <p className={styles.summary}>{summary}</p>}

        {(typeLabel || tags.length > 0) && (
          <div className={styles.tags}>
            {typeLabel && (
              <Pill bullet bulletColor={typeBullet}>
                {typeLabel}
              </Pill>
            )}
            {tags.map((tag, i) => (
              <Pill key={i} bullet bulletColor="var(--c-cobalt-300)">{tag}</Pill>
            ))}
          </div>
        )}
      </div>
    </Tag>
  );
}
