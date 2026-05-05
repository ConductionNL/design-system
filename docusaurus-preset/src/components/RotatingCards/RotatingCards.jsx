/**
 * <RotatingCards />
 *
 * Auto-advancing card rotator. Reference: honeycomb.io home page
 * "What Honeycomb helps you do" — single card visible at a time, swaps
 * every few seconds, hex-pip pagination beneath. Pauses on hover so a
 * reader can stop to actually read the card they care about.
 *
 * Used for "What Conduction helps you do" on the home, on /connext,
 * and on /commonground. Same pattern, different copy per surface.
 *
 * Usage in MDX:
 *
 *   <RotatingCards
 *     eyebrow="What Conduction helps you do"
 *     title="Six things, in two minutes."
 *     interval={5000}
 *     cards={[
 *       {
 *         icon: <svg viewBox="0 0 24 24">...</svg>,
 *         eyebrow: 'Catalogue',
 *         title: 'Publish a public catalogue.',
 *         summary: 'Federated registers searchable from one URL...',
 *         cta: {label: 'See OpenCatalogi', href: '/apps/opencatalogi'},
 *       },
 *       ...
 *     ]}
 *   />
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import styles from './RotatingCards.module.css';

export default function RotatingCards({
  eyebrow,
  title,
  lede,
  cards = [],
  interval = 5000,
  className,
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const total = cards.length;

  const advance = useCallback((delta) => {
    setActive((cur) => (cur + delta + total) % total);
  }, [total]);

  useEffect(() => {
    if (paused || total <= 1) return undefined;
    timerRef.current = setInterval(() => advance(1), interval);
    return () => clearInterval(timerRef.current);
  }, [paused, interval, advance, total]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); advance(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); advance(-1); }
  };

  if (total === 0) return null;
  const card = cards[active];

  return (
    <section className={[styles.root, className].filter(Boolean).join(' ')}>
      {(eyebrow || title || lede) && (
        <header className={styles.head}>
          {eyebrow && <div className={styles.eyebrow}><span className={styles.h}></span>{eyebrow}</div>}
          {title && <h2 className={styles.title}>{title}</h2>}
          {lede && <p className={styles.lede}>{lede}</p>}
        </header>
      )}
      <div
        className={styles.stage}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={typeof title === 'string' ? title : 'Rotating cards'}
      >
        <div
          key={active /* re-mount triggers slide-in animation */}
          className={styles.card}
          aria-live="polite"
          aria-atomic="true"
        >
          {card.icon && (
            <div className={styles.icon} aria-hidden="true">{card.icon}</div>
          )}
          {card.eyebrow && <div className={styles.cardEyebrow}>{card.eyebrow}</div>}
          {card.title && <h3 className={styles.cardTitle}>{card.title}</h3>}
          {card.summary && <p className={styles.cardSummary}>{card.summary}</p>}
          {card.cta && (
            <a href={card.cta.href} className={styles.cardCta}>
              {card.cta.label}
            </a>
          )}
        </div>
      </div>
      {total > 1 && (
        <div className={styles.pips} role="tablist" aria-label="Select card">
          {cards.map((c, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Card ${i + 1}: ${c.title || ''}`}
              className={[styles.pip, i === active && styles.pipActive].filter(Boolean).join(' ')}
              onClick={() => setActive(i)}
              type="button"
            >
              <span className={styles.pipHex} aria-hidden="true"></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
