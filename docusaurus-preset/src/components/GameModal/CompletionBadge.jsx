/**
 * <CompletionBadge />
 *
 * The rosette on the score card: a ribbon with the Conduction mark in
 * the middle, grey while games are still hidden and in full colour
 * once every one has been found.
 *
 * It is always on the card, not only at the end. A badge that appears
 * on completion is a surprise; a badge that has been sitting there in
 * grey the whole time is a thing to earn, which is the job Steam's
 * "you have unlocked all achievements" rosette actually does.
 *
 * It states nothing in words. The line beside it already reads
 * "16 / 16 mini-games found, 100%" and the copy below it already says
 * "All 16 found", so a caption here would be the same fact three
 * times. The state goes out through the accessible name instead, and
 * the shape carries it for everyone else.
 *
 * The mark is the one from static/img/logo.svg, inlined rather than
 * loaded: three polygons is less than the request that would fetch
 * them, and inline is the only way the colours can move between the
 * grey and the earned state. Its middle polygon is the plate it sits
 * on rather than white, so the mark reads on a dark card too.
 */

import React from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './CompletionBadge.module.css';

/* A sixteen-pointed star, built rather than written out: thirty-two
   points of hand-kept path data is a transcription error waiting to
   happen, and the shape is one line of trigonometry. */
const POINTS = 16;
const CX = 32;
const CY = 30;

function rosette(outer, inner) {
  const pts = [];
  for (let i = 0; i < POINTS * 2; i++) {
    const angle = (i / (POINTS * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(CX + Math.cos(angle) * r).toFixed(2)},${(CY + Math.sin(angle) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

const STAR = rosette(28, 23);

export default function CompletionBadge({found = 0, total = 0, className}) {
  const complete = total > 0 && found >= total;

  const label = complete
    ? translate(
      {
        id: 'preset.gameModal.badge.complete',
        message: 'Every game found: all {total} of them.',
        description: 'Accessible name of the score-card rosette once every mini-game has been discovered. {total} is how many games there are.',
      },
      {total},
    )
    : translate(
      {
        id: 'preset.gameModal.badge.locked',
        message: 'Rosette for finding every game. Still locked: {found} of {total}.',
        description: 'Accessible name of the score-card rosette while games are still hidden. {found} is how many are found, {total} how many there are.',
      },
      {found, total},
    );

  return (
    <div className={[styles.badge, complete && styles.complete, className].filter(Boolean).join(' ')}>
      <svg viewBox="0 0 64 80" role="img" aria-label={label} className={styles.art}>
        {/* Tails first, so the rosette sits on top of them. Mirrored
            about x=32 rather than drawn twice by eye. */}
        <polygon className={styles.ribbon} points="24,44 32,44 32,78 26,71 19,76" />
        <polygon className={styles.ribbon} points="40,44 32,44 32,78 38,71 45,76" />

        <polygon className={styles.rosette} points={STAR} />
        <circle className={styles.ring} cx={CX} cy={CY} r="20" />
        <circle className={styles.plate} cx={CX} cy={CY} r="16" />

        {/* The house mark, from logo.svg. Its own viewBox is
            -86.6 -100 173.2 200 and it is centred on the origin, so it
            only needs moving to the middle and scaling down. */}
        <g transform={`translate(${CX} ${CY}) scale(0.145)`}>
          <polygon className={styles.mark} points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50" />
          <polygon className={styles.markInner} points="0,-74.5 64.5,-37.3 64.5,37.3 0,74.5 -64.5,37.3 -64.5,-37.3" />
          <polygon className={styles.mark} points="-0.2,-25.2 20.1,-13.5 43.7,-27.1 -0.2,-52.4 -45.6,-26.2 -45.6,26.2 -0.2,52.4 43.7,27.1 20.1,13.5 -0.2,25.2 -22,12.6 -22,-12.6" />
        </g>
      </svg>
    </div>
  );
}
