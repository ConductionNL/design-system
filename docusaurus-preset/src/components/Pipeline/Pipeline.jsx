/**
 * <Pipeline /> + <PipelineStep />
 *
 * Horizontal pipeline of flat hex tiles, family-coloured per step,
 * mirroring preview/components/pipeline-flow.html. Each step has a
 * stage number + uppercase kicker above the hex, and an explanatory
 * name + caption below. A single animated dotted flow line runs
 * full-width behind the hex row, threading through the hex equator
 * so the data-movement metaphor reads across the whole pipeline.
 *
 * Family palette follows the locked PRISM-FAMILY POLICY in tokens.css:
 *   mint        integrate / connect    (OpenConnector)
 *   forest      data / registers       (OpenRegister)
 *   terracotta  documents / search     (OpenCatalogi)
 *   lavender    process / views        (MyDash)
 *   workspace   Nextcloud workspace    (centre platform hex)
 *
 * Family is auto-detected from the step's name; override per-step
 * via `family`. Source / consumer end-boxes carry a list of items;
 * each item can be a plain string or {label, icon} for a custom glyph.
 *
 * Usage in MDX:
 *
 *   <Pipeline
 *     start={{label: 'Sources', items: ['XLNS', 'Joomla', 'OpenZaak', 'RX']}}
 *     steps={[
 *       {number: '01', kicker: 'Ingest',  name: 'OpenConnector',
 *         caption: 'Pulls schemas, REST, SOAP, files.'},
 *       {number: '02', kicker: 'Store',   name: 'OpenRegister',
 *         caption: 'Typed records, versioned, audit-logged.'},
 *       {number: '03', kicker: 'Present', name: 'OpenCatalogi',
 *         caption: 'Indexes every register, federates to data.overheid.nl.'},
 *     ]}
 *     end={{label: 'Consumers', items: ['Open Tilburg portal', 'Residents', 'open.overheid.nl']}}
 *   />
 */

import React from 'react';
import styles from './Pipeline.module.css';

/* Locked PRISM-FAMILY POLICY palette. fill = -300, ink = -700. */
const FAMILY_COLORS = {
  mint:       { fill: '#87CFA8', ink: '#155234' },
  forest:     { fill: '#7DAA7C', ink: '#1E461C' },
  terracotta: { fill: '#DA9D8A', ink: '#6E2A1C' },
  lavender:   { fill: '#B7A7E3', ink: '#483982' },
  workspace:  { fill: '#67BEEA', ink: '#014C77' },
};

function inferFamily(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('connector')) return 'mint';
  if (n.includes('register')) return 'forest';
  if (n.includes('catalog')) return 'terracotta';
  if (n.includes('mydash') || n.includes('dashboard')) return 'lavender';
  if (n.includes('nextcloud') || n.includes('workspace') || n.includes('platform')) return 'workspace';
  return 'forest';
}

const FAMILY_LABEL = {
  mint:       'INTEGRATE',
  forest:     'DATA',
  terracotta: 'SEARCH',
  lavender:   'VIEWS',
  workspace:  'WORKSPACE',
};

/* Flat pointy-top hex (no extruded sides). Geometry mirrors the kit's
   top face polygon so the silhouette matches the rest of the brand. */
function HexTile({name, family}) {
  const c = FAMILY_COLORS[family] || FAMILY_COLORS.forest;
  const sub = FAMILY_LABEL[family];
  return (
    <svg viewBox="0 0 120 86" className={styles.prism} aria-hidden="true">
      <polygon points="60,4 96,24 96,62 60,82 24,62 24,24" fill={c.fill} />
      <text x="60" y="42" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={c.ink} letterSpacing="-0.02em">{name}</text>
      {sub && (
        <text x="60" y="58" textAnchor="middle" fontFamily="ui-monospace, Menlo, monospace" fontSize="7" letterSpacing="1.4" fill={c.ink}>
          {sub}
        </text>
      )}
    </svg>
  );
}

export function PipelineStep({number, kicker, name, caption, family, className}) {
  const fam = family || inferFamily(name);
  return (
    <div className={[styles.step, className].filter(Boolean).join(' ')}>
      {number && <div className={styles.num}>{number}</div>}
      {kicker && <div className={styles.kicker}>{kicker}</div>}
      <HexTile name={name} family={fam} />
      {name && <div className={styles.name}>{name}</div>}
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}

/* Default rounded-square icon next to end-box items, matching the
   kit's `.endbox-icon` (cobalt-50 fill, cobalt-200 stroke, doc glyph). */
function DefaultEndIcon() {
  return (
    <svg viewBox="0 0 22 22" aria-hidden="true">
      <rect x="0.5" y="0.5" width="21" height="21" rx="3" fill="white" stroke="var(--c-cobalt-200)" strokeWidth="1" />
      <path d="M6 8h10 M6 11h10 M6 14h6" stroke="var(--c-cobalt-700)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function EndBox({label, items = [], side}) {
  return (
    <div className={[styles.end, styles['end-' + side]].join(' ')}>
      {label && <div className={styles.endLabel}>{label}</div>}
      <ul className={styles.endList}>
        {items.map((it, i) => {
          const item = typeof it === 'string' ? {label: it} : (it || {});
          return (
            <li key={i}>
              <span className={styles.endIcon}>
                {item.icon || <DefaultEndIcon />}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Pipeline({start, end, steps, children, className}) {
  const stepNodes = steps
    ? steps.map((s, i) => <PipelineStep key={i} {...s} />)
    : children;

  return (
    <div className={[styles.pipeline, className].filter(Boolean).join(' ')}>
      {start && <EndBox {...start} side="start" />}
      <div className={styles.steps}>{stepNodes}</div>
      {end && <EndBox {...end} side="end" />}
    </div>
  );
}
