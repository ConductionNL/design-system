/**
 * <WidgetShelf />
 *
 * Section that lists the dashboard widgets a Conduction app ships
 * for Nextcloud. Each widget gets a small token-built preview, a
 * headline, and a one-sentence description. Used on every app
 * detail page to show "what widgets you get on the home screen
 * the moment this app is installed".
 *
 * Each Conduction app that registers a Nextcloud-dashboard widget
 * shows up automatically in LaunchPad; this section makes that promise
 * concrete by drawing the widgets the app actually contributes.
 *
 * Usage in MDX:
 *
 *   <WidgetShelf
 *     eyebrow="Widgets we ship"
 *     title="On every Nextcloud dashboard."
 *     lede="Install Procest and your team gets these widgets..."
 *     widgets={[
 *       {
 *         title: 'Werkvoorraad',
 *         desc: 'Active cases for the logged-in case-worker...',
 *         panel: <div className="w w-werkvoorraad">...</div>,
 *       },
 *       ...
 *     ]}
 *   />
 *
 * Layout: by default a single-row carousel that auto-scrolls slowly
 * (marquee-style, seamless loop via a duplicated track), pausing on
 * hover and on keyboard focus. The duplicate copy is aria-hidden so
 * assistive tech reads each widget once; the first copy keeps normal
 * semantics. `prefers-reduced-motion: reduce` collapses the carousel
 * to the static wrapping grid, which is also what `carousel={false}`
 * renders: 2 or 3 columns depending on widget count, responsive to
 * viewport. Each card has the panel (preview) at the top, title +
 * description below.
 *
 * Props (beyond eyebrow/title/lede/widgets/columns/className):
 *   - carousel: boolean (default true) — false renders the static grid
 *   - speed:    number — seconds per full carousel loop (default 45)
 */

import React from 'react';
import styles from './WidgetShelf.module.css';

export default function WidgetShelf({
  eyebrow,
  title,
  lede,
  widgets = [],
  columns,
  carousel = true,
  speed = 45,
  className,
}) {
  const cols = columns || (widgets.length >= 4 ? 3 : Math.min(widgets.length, 3));
  const cards = widgets.map((w, i) => (
    <article key={i} className={styles.card}>
      <div className={styles.panel}>{w.panel}</div>
      {w.title && <h3 className={styles.cardTitle}>{w.title}</h3>}
      {w.desc && <p className={styles.cardDesc}>{w.desc}</p>}
    </article>
  ));
  return (
    <section className={[styles.shelf, carousel && styles.carousel, className].filter(Boolean).join(' ')}>
      {(eyebrow || title || lede) && (
        <header className={styles.head}>
          {eyebrow && <div className={styles.eyebrow}><span className={styles.h}></span>{eyebrow}</div>}
          {title && <h2 className={styles.title}>{title}</h2>}
          {lede && <p className={styles.lede}>{lede}</p>}
        </header>
      )}
      {carousel ? (
        <div className={styles.viewport}>
          <div
            className={styles.track}
            style={{'--ws-speed': `${speed}s`}}
          >
            <div className={[styles.group, styles[`cols-${cols}`]].join(' ')}>
              {cards}
            </div>
            {/* Seamless-loop duplicate. Hidden from assistive tech so
                each widget is announced once; under reduced motion the
                CSS removes it entirely and the first group becomes the
                static grid. */}
            <div className={[styles.group, styles.dup].join(' ')} aria-hidden="true">
              {widgets.map((w, i) => (
                <article key={i} className={styles.card}>
                  <div className={styles.panel}>{w.panel}</div>
                  {w.title && <h3 className={styles.cardTitle}>{w.title}</h3>}
                  {w.desc && <p className={styles.cardDesc}>{w.desc}</p>}
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={[styles.grid, styles[`cols-${cols}`]].join(' ')}>
          {cards}
        </div>
      )}
    </section>
  );
}
