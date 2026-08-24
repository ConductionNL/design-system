/**
 * <FlowMock />
 *
 * Token-built abstract representation of the flow editor: white node
 * cards on a dotted canvas, a coloured 4px left bar per node (mint =
 * trigger, lavender = steps, vermillion = end), greeked title +
 * mono subtitle lines, and curved grey edges with small pill labels
 * between the nodes. Same abstraction level as <AppMock> (reference:
 * honeycomb.io/technologies/*) — recognisable as the flow canvas,
 * never a literal screenshot.
 *
 * Five nodes: trigger → two parallel steps → approval (join) → end.
 * A mint run-line travels the trigger → step → approval → end route
 * on a slow loop, with a subtle halo pulse on each node as the line
 * passes. At the approval node the run HOLDS for ~600ms while an
 * orange halo flashes — a human decides here. `prefers-reduced-motion:
 * reduce` (and `running={false}`) renders the full route as a static
 * mint path with no animation and no flash.
 *
 * Tokens only; no images; rectangles (the nodes *do* work, so no
 * hexes); the approval hold flash is the single orange accent.
 *
 * Usage:
 *
 *   <FlowMock />
 *   <FlowMock size="sm" caption="Automate" />
 *   <FlowMock running={false} />
 *
 * Props:
 *   - size:      'sm' | 'md' (default)      — frame width, as AppMock
 *   - caption:   string | true              — small caption below the
 *                frame; `true` renders the default "Flow editor"
 *   - running:   boolean (default true)     — false freezes the
 *                run-line to the static full mint path
 *   - className: string
 */

import React from 'react';
import styles from './FlowMock.module.css';

/* The run-line route: trigger right port, up along the first edge,
   across step A, down to the approval join, across it, into the end
   node. pathLength="1" normalises the dash arithmetic so the CSS
   animation is geometry-independent. */
const RUN_PATH =
  'M164,211 C205,211 200,91 240,91 L380,91 C420,91 416,211 456,211 L596,211 C614,211 618,211 636,211';

/* Grey edges, drawn separately from the run-line so the second
   (parallel) branch and the join edge stay visible under it. */
const EDGES = [
  'M164,211 C205,211 200,91 240,91',   /* trigger → step A */
  'M164,211 C205,211 200,331 240,331', /* trigger → step B */
  'M380,91 C420,91 416,211 456,211',   /* step A → approval */
  'M380,331 C420,331 416,211 456,211', /* step B → approval */
  'M596,211 C614,211 618,211 636,211', /* approval → end */
];

/* Small pill labels sitting mid-edge, greeked (a bar, not words). */
const PILLS = [
  {cx: 202, cy: 151},
  {cx: 202, cy: 271},
  {cx: 418, cy: 151},
  {cx: 418, cy: 271},
];

/* Node cards. kind drives the left-bar colour class; pulse marks the
   nodes the run-line passes (trigger, step A, approval, end). */
const NODES = [
  {x: 24,  y: 176, w: 140, h: 70, kind: 'trigger',  label: 'Trigger',  pulse: 0},
  {x: 240, y: 56,  w: 140, h: 70, kind: 'step',     label: 'Step',     pulse: 1},
  {x: 240, y: 296, w: 140, h: 70, kind: 'step',     label: 'Step'},
  {x: 456, y: 172, w: 140, h: 78, kind: 'approval', label: 'Approval', pulse: 2},
  {x: 636, y: 183, w: 62,  h: 56, kind: 'end',      label: 'End',      pulse: 3},
];

function Node({node}) {
  const {x, y, w, h, kind, label, pulse} = node;
  const pad = 12;
  const compact = w < 100;
  return (
    <g>
      {pulse !== undefined && (
        <rect
          className={[styles.halo, styles[`halo-${pulse}`]].join(' ')}
          x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={10}
        />
      )}
      <rect className={styles.card} x={x} y={y} width={w} height={h} rx={8} />
      <rect className={[styles.bar, styles[`bar-${kind}`]].join(' ')} x={x + 3} y={y + 6} width={4} height={h - 12} rx={2} />
      <text className={styles.kindLabel} x={x + pad} y={y + 18}>{label}</text>
      {!compact && (
        <>
          <rect className={styles.titleGreek} x={x + pad} y={y + 26} width={w * 0.55} height={5} rx={1.5} />
          <rect className={styles.subGreek} x={x + pad} y={y + 40} width={w * 0.68} height={3} rx={1} />
          <rect className={styles.subGreek} x={x + pad} y={y + 48} width={w * 0.44} height={3} rx={1} />
        </>
      )}
      {compact && (
        <rect className={styles.subGreek} x={x + pad} y={y + 28} width={w - pad * 2} height={3} rx={1} />
      )}
    </g>
  );
}

export default function FlowMock({size = 'md', caption, running = true, className}) {
  /* Unique pattern id per instance so several mocks on one page
     don't collide on the dot-grid <pattern>. */
  const dotsId = `fm-dots-${React.useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <div className={styles.fm}>
      <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
        <div className={[styles.frame, styles[`size-${size}`], !running && styles.static].filter(Boolean).join(' ')}>
          <svg
            className={styles.canvas}
            viewBox="0 0 720 450"
            role="img"
            aria-label="Abstract flow-editor canvas: a trigger fans out to two parallel steps, joins at an approval, and ends."
          >
            <defs>
              <pattern id={dotsId} width="16" height="16" patternUnits="userSpaceOnUse">
                <circle className={styles.dot} cx="2" cy="2" r="1" />
              </pattern>
            </defs>
            <rect className={styles.surface} x="0" y="0" width="720" height="450" />
            <rect fill={`url(#${dotsId})`} x="0" y="0" width="720" height="450" />

            {EDGES.map((d, i) => (
              <path key={i} className={styles.edge} d={d} />
            ))}

            <path className={styles.runline} d={RUN_PATH} pathLength="1" />

            {PILLS.map((p, i) => (
              <g key={i}>
                <rect className={styles.pill} x={p.cx - 17} y={p.cy - 7} width={34} height={14} rx={7} />
                <rect className={styles.pillGreek} x={p.cx - 9} y={p.cy - 1.5} width={18} height={3} rx={1} />
              </g>
            ))}

            {NODES.map((n, i) => (
              <Node key={i} node={n} />
            ))}
          </svg>
        </div>
        {caption && (
          <figcaption className={styles.caption}>
            {caption === true ? 'Flow editor' : caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
