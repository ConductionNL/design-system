import React from 'react';
import Link from '@docusaurus/Link';
import styles from './SeriesNav.module.css';

/**
 * <SeriesNav /> — linear navigation for a multi-part tutorial series.
 *
 * Renders a compact strip that shows where the reader is in a series
 * ("Part 2 of 4"), the ordered list of every part as links with the
 * current one highlighted, and explicit Previous / Next buttons.
 *
 * It is normally injected automatically by the brand
 * theme/BlogPostItem/Footer swizzle, which reads the series grouping
 * built by the `blog-series` plugin from each post's `series` +
 * `partNumber` frontmatter. It is also exported so a page can drop it
 * in by hand:
 *
 *   <SeriesNav
 *     parts={[{partNumber: 1, title: '…', permalink: '/academy/…'}, …]}
 *     currentPermalink="/academy/woo-upload-files"
 *   />
 *
 * Props:
 *   - parts:            ordered [{partNumber, title, permalink}]   (required)
 *   - currentPermalink: permalink of the part being viewed         (required)
 *   - label:            small heading above the strip (default 'Tutorial series')
 *   - className:        extra class on the wrapper
 */

function samePath(a, b) {
  const norm = (s) => String(s || '').replace(/\/+$/, '');
  return norm(a) === norm(b);
}

export default function SeriesNav({
  parts,
  currentPermalink,
  label = 'Tutorial series',
  className,
}) {
  if (!Array.isArray(parts) || parts.length < 2) {
    return null;
  }

  const ordered = [...parts].sort(
    (a, b) => (a.partNumber ?? 0) - (b.partNumber ?? 0),
  );
  const index = ordered.findIndex((p) => samePath(p.permalink, currentPermalink));
  if (index === -1) {
    return null;
  }

  const prev = ordered[index - 1];
  const next = ordered[index + 1];
  const total = ordered.length;

  return (
    <nav
      className={[styles.series, className].filter(Boolean).join(' ')}
      aria-label={label}
    >
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.counter}>
          Part {index + 1} of {total}
        </span>
      </div>

      <ol className={styles.steps}>
        {ordered.map((part, i) => {
          const isCurrent = i === index;
          return (
            <li
              key={part.permalink}
              className={[styles.step, isCurrent && styles.current]
                .filter(Boolean)
                .join(' ')}
            >
              <Link
                to={part.permalink}
                className={styles.stepLink}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <span className={styles.num}>{i + 1}</span>
                <span className={styles.stepTitle}>{part.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className={styles.pager}>
        {prev ? (
          <Link to={prev.permalink} className={styles.prev}>
            <span className={styles.dir}>← Previous</span>
            <span className={styles.pagerTitle}>{prev.title}</span>
          </Link>
        ) : (
          <span className={styles.spacer} />
        )}
        {next ? (
          <Link to={next.permalink} className={styles.next}>
            <span className={styles.dir}>Next →</span>
            <span className={styles.pagerTitle}>{next.title}</span>
          </Link>
        ) : (
          <span className={styles.spacer} />
        )}
      </div>
    </nav>
  );
}
