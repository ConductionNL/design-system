/**
 * <GameModal />
 *
 * The end-of-game dialog for the ConNext mini-games (hex-rain, the
 * canal-footer boats, future invaders / domino / hex-tetris). Mounts
 * once per page; listens for `connext:gameend` CustomEvents, opens
 * with the matching copy, tracks total games found in localStorage so
 * the cross-site progress bar is consistent.
 *
 * Mirrors preview/components/game-modal.html. The previous JS-only
 * version (game-modal.js) gets replaced by this component on any
 * Docusaurus surface that mounts <GameModal/>.
 *
 * Game payload shape, fired by the playing component:
 *
 *   window.dispatchEvent(new CustomEvent('connext:gameend', {
 *     detail: {
 *       id: 'hexrain',
 *       won: true,                 // or false
 *       score: 12,                 // numeric
 *       summary: '12 / 12 collected'
 *     }
 *   }));
 *
 * Usage in MDX (mount once on the layout, not per page):
 *
 *   import {GameModal} from '@conduction/docusaurus-preset/components';
 *   <GameModal />
 *
 * Custom games table (default covers the five planned mini-games):
 *
 *   <GameModal games={[
 *     {id: 'hexrain',  label: 'Twelve apps'},
 *     {id: 'boats',    label: 'Sink the boats'},
 *     {id: 'invaders', label: 'Hex-vaders'},
 *     {id: 'domino',   label: 'Hex-domino'},
 *     {id: 'tetris',   label: 'Hex-tris'},
 *   ]} />
 */

import React, {useEffect, useState, useCallback, useMemo} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import styles from './GameModal.module.css';

const STORAGE_KEY = 'conduction:minigames';

const DEFAULT_GAMES = [
  {id: 'hexrain',  label: 'Twelve apps · hex rain'},
  {id: 'boats',    label: 'Sink the boats · footer canal'},
  {id: 'invaders', label: 'Hex-vaders · TBD'},
  {id: 'domino',   label: 'Hex-domino · TBD'},
  {id: 'tetris',   label: 'Hex-tris · TBD'},
];

function readFound() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function writeFound(found) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  } catch (e) {/* fail open */}
}

export default function GameModal({games = DEFAULT_GAMES, className}) {
  const isBrowser = useIsBrowser();
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState(null);
  const [found, setFound] = useState({});

  /* On mount: read found-games table from localStorage and subscribe
     to the `connext:gameend` event. Each event opens the modal with
     the supplied copy and (if won) marks the game as found. */
  useEffect(() => {
    if (!isBrowser) return;
    setFound(readFound());

    function onEnd(e) {
      const detail = e.detail || {};
      setEvent(detail);
      setOpen(true);
      if (detail.won && detail.id) {
        setFound((prev) => {
          const next = {...prev, [detail.id]: true};
          writeFound(next);
          return next;
        });
      }
    }
    window.addEventListener('connext:gameend', onEnd);
    return () => window.removeEventListener('connext:gameend', onEnd);
  }, [isBrowser]);

  /* Escape closes the modal. */
  useEffect(() => {
    if (!isBrowser || !open) return;
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBrowser, open]);

  const close = useCallback(() => setOpen(false), []);
  const replay = useCallback(() => {
    /* Fire a `connext:gamereplay` event so the playing component (which
       listens for it) can re-init. We don't dispatch from inside an
       event handler that came from React, so use a microtask to keep
       the call stack clean. */
    if (event?.id) {
      Promise.resolve().then(() => {
        window.dispatchEvent(new CustomEvent('connext:gamereplay', {detail: {id: event.id}}));
      });
    }
    setOpen(false);
  }, [event]);

  const foundCount = useMemo(() => Object.values(found).filter(Boolean).length, [found]);
  const total = games.length;
  const percent = total > 0 ? Math.round((foundCount / total) * 100) : 0;

  if (!isBrowser || !open || !event) return null;

  const eyebrow = event.won ? 'Mini-game complete' : 'Game over';
  const title = event.title || (event.won ? 'Nice run.' : "That's all of them.");
  const subtitle = event.subtitle ||
    (event.won
      ? "You've cleared a hidden ConNext mini-game."
      : "Try again any time, the rain doesn't stop.");

  return (
    <div className={[styles.modal, className].filter(Boolean).join(' ')} role="dialog" aria-modal="true" aria-labelledby="gm-title">
      <div className={styles.overlay} onClick={close} />
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={close} aria-label="Close">×</button>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title} id="gm-title">{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        {typeof event.score !== 'undefined' && (
          <span className={styles.scorePill}>{event.summary || `score: ${event.score}`}</span>
        )}

        <div className={styles.progress}>
          <div className={styles.progressLabel}>
            <span><strong>{foundCount}</strong> / {total} mini-games found</span>
            <span>{percent}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{width: percent + '%'}} />
          </div>
        </div>

        <ul className={styles.grid}>
          {games.map((g) => (
            <li key={g.id} className={found[g.id] ? styles.gridItemFound : styles.gridItem}>
              <span className={styles.gridHex} aria-hidden="true" />
              <span>{g.label}</span>
            </li>
          ))}
        </ul>

        <p className={styles.cta}>
          {foundCount < total
            ? `${total - foundCount} more game${total - foundCount === 1 ? '' : 's'} hidden somewhere. Keep clicking.`
            : "All five found. You read the kit."}
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={close}>Close</button>
          <button type="button" className={styles.btnPrimary} onClick={replay}>Play again</button>
        </div>
      </div>
    </div>
  );
}
