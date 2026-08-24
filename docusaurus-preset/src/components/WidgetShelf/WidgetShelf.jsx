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
 *     lede="Install Dossiq and your team gets these widgets..."
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
 * Widgets without an explicit `panel` get an auto-generated mini
 * panel: the title is hashed into one of four token-built archetypes
 * (KPI tile, mini bar chart, list rows, donut gauge) with a
 * deterministically chosen accent family, so long carousels look
 * alive without hand-built mocks. An explicit `panel` always wins.
 * Same abstraction level as <AppMock>: greeked bars, no real words.
 *
 * Controls: the carousel renders a pause/play toggle and prev/next
 * buttons (cobalt ghost styling). Prev/next nudge the track by one
 * card with a smooth ease; auto-scroll resumes afterwards unless
 * paused. Server-side and before hydration the track runs on the
 * pure-CSS marquee; after mount a rAF loop drives the same transform
 * so the buttons can steer it. Under reduced motion the controls are
 * hidden along with the marquee.
 *
 * Props (beyond eyebrow/title/lede/widgets/columns/className):
 *   - carousel: boolean (default true) — false renders the static grid
 *   - speed:    number — seconds per full carousel loop. Default is
 *               derived from the widget count (6s per card, min 30s)
 *               so the per-card reading pace stays constant no matter
 *               how many widgets a page declares.
 */

import React, {useEffect, useRef, useState} from 'react';
import styles from './WidgetShelf.module.css';

/* Seconds each card takes to traverse its own width — the per-card
   reading pace. A 15-widget shelf loops in 90s, a 30-widget one in
   180s; both feel identical to the reader. */
const SECONDS_PER_CARD = 6;
const MIN_LOOP_SECONDS = 30;
const NUDGE_MS = 450;

/* Accent families available to auto-generated panels — exactly the
   hex-family policy roster from tokens.css: lavender, mint, forest,
   terracotta, plus workspaceblue. Coral (KNVB orange) and gold are
   reserved (one orange per component — the shelf's eyebrow already
   spends it; gold is the Certified mark only). */
const AUTO_FAMILIES = ['mint', 'lavender', 'forest', 'terracotta', 'workspaceblue'];

/* djb2-xor string hash with a murmur3-style finalizer — stable across
   renders and platforms, so the same title always draws the same
   panel. The finalizer avalanches the bits: without it, titles that
   differ only in their last character ("Lead 1" / "Lead 2") land in
   the same accent family because the family picker discards low bits. */
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Auto-generated mini panel for widgets without an explicit `panel`.
 * Deterministic: archetype and accent family both derive from the
 * hash of the seed (the widget title). Token-built, greeked, no
 * words — the card below already shows the real title.
 */
function AutoPanel({seed}) {
  const h = hashString(seed);
  const family = AUTO_FAMILIES[(h >>> 4) % AUTO_FAMILIES.length];
  const vars = {
    '--wsa': `var(--c-${family}-500)`,
    '--wsa-soft': `var(--c-${family}-300)`,
  };
  const kind = h % 4;

  if (kind === 0) {
    /* KPI number tile. */
    const value = 12 + (h % 88);
    const trendW = 32 + ((h >>> 8) % 40);
    return (
      <div className={[styles.auto, styles.autoKpi].join(' ')} style={vars} aria-hidden="true">
        <span className={styles.autoHex} />
        <span className={styles.autoKpiValue}>{value}</span>
        <span className={styles.autoKpiBar} style={{width: `${trendW}%`}} />
      </div>
    );
  }

  if (kind === 1) {
    /* Mini bar chart. */
    const hi = (h >>> 8) % 6;
    return (
      <div className={[styles.auto, styles.autoBars].join(' ')} style={vars} aria-hidden="true">
        {Array.from({length: 6}, (_, i) => {
          const height = Math.round(30 + (((h >>> (i * 4)) & 15) / 15) * 65);
          return (
            <span
              key={i}
              className={[styles.autoBar, i === hi && styles.autoBarHi].filter(Boolean).join(' ')}
              style={{height: `${height}%`}}
            />
          );
        })}
      </div>
    );
  }

  if (kind === 2) {
    /* List rows. */
    const hot = (h >>> 8) % 3;
    return (
      <div className={[styles.auto, styles.autoList].join(' ')} style={vars} aria-hidden="true">
        {Array.from({length: 3}, (_, i) => {
          const w = Math.round(34 + (((h >>> (i * 5)) & 31) / 31) * 30);
          return (
            <span key={i} className={styles.autoRow}>
              <span className={[styles.autoDot, i === hot && styles.autoDotHi].filter(Boolean).join(' ')} />
              <span className={styles.autoRowBars}>
                <span className={styles.autoRowBar} style={{width: `${w}%`}} />
                <span className={styles.autoRowLine} />
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  /* Donut gauge. Circumference of r=15.9155 is 100, so the dasharray
     reads directly as a percentage. */
  const pct = 34 + ((h >>> 6) % 52);
  return (
    <div className={[styles.auto, styles.autoDonut].join(' ')} style={vars} aria-hidden="true">
      <svg viewBox="0 0 42 42" className={styles.autoRing} aria-hidden="true" focusable="false">
        <circle cx="21" cy="21" r="15.9155" className={styles.autoRingTrack} />
        <circle
          cx="21"
          cy="21"
          r="15.9155"
          className={styles.autoRingFill}
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeDashoffset="25"
        />
      </svg>
      <span className={styles.autoDonutBars}>
        <span className={styles.autoRowBar} style={{width: '64%'}} />
        <span className={styles.autoRowLine} />
      </span>
    </div>
  );
}

function ControlIcon({kind}) {
  if (kind === 'prev') {
    return (
      <svg viewBox="0 0 24 24" className={styles.chev} aria-hidden="true" focusable="false">
        <path d="M15 4l-8 8 8 8" />
      </svg>
    );
  }
  if (kind === 'next') {
    return (
      <svg viewBox="0 0 24 24" className={styles.chev} aria-hidden="true" focusable="false">
        <path d="M9 4l8 8-8 8" />
      </svg>
    );
  }
  if (kind === 'pause') {
    return (
      <svg viewBox="0 0 24 24" className={styles.glyph} aria-hidden="true" focusable="false">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    );
  }
  /* play */
  return (
    <svg viewBox="0 0 24 24" className={styles.glyph} aria-hidden="true" focusable="false">
      <path d="M8 4.5l12 7.5-12 7.5z" />
    </svg>
  );
}

export default function WidgetShelf({
  eyebrow,
  title,
  lede,
  widgets = [],
  columns,
  carousel = true,
  speed,
  className,
}) {
  const cols = columns || (widgets.length >= 4 ? 3 : Math.min(widgets.length, 3));
  const loopSeconds = speed != null ? speed : Math.max(MIN_LOOP_SECONDS, widgets.length * SECONDS_PER_CARD);

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const groupRef = useRef(null);
  /* Marquee state lives in a ref: the rAF loop writes the transform
     directly, so no React re-render per frame. */
  const marquee = useRef({offset: 0, groupW: 0, step: 0, hover: false, nudge: null});

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!carousel || widgets.length === 0) return undefined;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    /* Reduced motion: the CSS already collapses the carousel to the
       static grid and hides the controls; nothing to drive. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const viewport = viewportRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!viewport || !track || !group) return undefined;

    const m = marquee.current;
    const measure = () => {
      /* offsetWidth includes the trailing padding-right gap, so it is
         exactly the seamless-loop period. */
      m.groupW = group.offsetWidth;
      const cards = group.children;
      m.step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : group.offsetWidth;
    };
    measure();

    /* Take over from the pure-CSS marquee (which covers SSR/no-JS). */
    track.classList.add(styles.jsDriven);

    const onEnter = () => { m.hover = true; };
    const onLeave = () => { m.hover = false; };
    viewport.addEventListener('mouseenter', onEnter);
    viewport.addEventListener('mouseleave', onLeave);
    viewport.addEventListener('focusin', onEnter);
    viewport.addEventListener('focusout', onLeave);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(group);

    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (m.nudge) {
        const t = Math.min((now - m.nudge.start) / m.nudge.dur, 1);
        /* ease-in-out cubic */
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        m.offset = m.nudge.from + (m.nudge.to - m.nudge.from) * e;
        if (t >= 1) m.nudge = null;
      } else if (!pausedRef.current && !m.hover) {
        m.offset += (m.groupW / loopSeconds) * dt;
      }
      if (m.groupW > 0) {
        /* Content repeats every groupW px, so wrapping is invisible. */
        m.offset = ((m.offset % m.groupW) + m.groupW) % m.groupW;
      }
      track.style.transform = `translate3d(${-m.offset}px, 0, 0)`;
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      viewport.removeEventListener('mouseenter', onEnter);
      viewport.removeEventListener('mouseleave', onLeave);
      viewport.removeEventListener('focusin', onEnter);
      viewport.removeEventListener('focusout', onLeave);
      track.classList.remove(styles.jsDriven);
      track.style.transform = '';
      m.nudge = null;
    };
  }, [carousel, widgets.length, loopSeconds]);

  const nudge = (dir) => {
    const m = marquee.current;
    if (!m.step) return;
    /* Rapid clicks accumulate: continue from the pending target. */
    const base = m.nudge ? m.nudge.to : m.offset;
    m.nudge = {from: m.offset, to: base + dir * m.step, start: performance.now(), dur: NUDGE_MS};
  };

  const renderCard = (w, i) => (
    <article key={i} className={styles.card}>
      <div className={styles.panel}>
        {w.panel || <AutoPanel seed={w.title ? String(w.title) : `widget-${i}`} />}
      </div>
      {w.title && <h3 className={styles.cardTitle}>{w.title}</h3>}
      {w.desc && <p className={styles.cardDesc}>{w.desc}</p>}
    </article>
  );

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
        <>
          <div className={styles.viewport} ref={viewportRef}>
            <div
              className={styles.track}
              ref={trackRef}
              style={{'--ws-speed': `${loopSeconds}s`}}
            >
              <div className={[styles.group, styles[`cols-${cols}`]].join(' ')} ref={groupRef}>
                {widgets.map(renderCard)}
              </div>
              {/* Seamless-loop duplicate. Hidden from assistive tech so
                  each widget is announced once; under reduced motion the
                  CSS removes it entirely and the first group becomes the
                  static grid. */}
              <div className={[styles.group, styles.dup].join(' ')} aria-hidden="true">
                {widgets.map(renderCard)}
              </div>
            </div>
          </div>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.ctrl}
              aria-label="Previous widgets"
              onClick={() => nudge(-1)}
            >
              <ControlIcon kind="prev" />
            </button>
            <button
              type="button"
              className={styles.ctrl}
              aria-label={paused ? 'Play' : 'Pause'}
              onClick={() => setPaused((p) => !p)}
            >
              <ControlIcon kind={paused ? 'play' : 'pause'} />
            </button>
            <button
              type="button"
              className={styles.ctrl}
              aria-label="Next widgets"
              onClick={() => nudge(1)}
            >
              <ControlIcon kind="next" />
            </button>
          </div>
        </>
      ) : (
        <div className={[styles.grid, styles[`cols-${cols}`]].join(' ')}>
          {widgets.map(renderCard)}
        </div>
      )}
    </section>
  );
}
