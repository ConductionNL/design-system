/**
 * <Pipeline /> + <PipelineStep />
 *
 * Horizontal pipeline of hex-prism steps, mirroring
 * preview/components/pipeline-flow.html. Each step renders as a 3D
 * hex-prism (top + left + right faces) coloured by family. The "01"
 * stage number and uppercase kicker sit above the prism; nothing
 * sits below — pure hexes only. Steps are separated by an animated
 * dotted flow line. Optional `start` / `end` slots take source /
 * consumer end-boxes (plain text list, no icons).
 *
 * Family palette follows the locked PRISM-FAMILY POLICY in tokens.css:
 *   mint        integrate / connect    (OpenConnector)
 *   forest      data / registers       (OpenRegister)
 *   terracotta  documents / search     (OpenCatalogi)
 *   lavender    process / views        (MyDash)
 *   workspace   Nextcloud workspace    (centre platform hex)
 *
 * Coral, gray, and gold are reserved for non-prism use and are not
 * available as families here. Family is auto-detected from the step's
 * name, override per-step via the `family` prop.
 *
 * Usage in MDX:
 *
 *   <Pipeline
 *     start={{label: 'Sources', items: ['XLNS', 'Joomla', 'OpenZaak', 'RX']}}
 *     steps={[
 *       {number: '01', kicker: 'Ingest',    name: 'OpenConnector'},
 *       {number: '02', kicker: 'Store',     name: 'OpenRegister'},
 *       {number: '03', kicker: 'Catalogue', name: 'OpenCatalogi'},
 *     ]}
 *     end={{label: 'Consumers', items: ['Open Tilburg portal', 'Residents', 'open.overheid.nl']}}
 *   />
 */

import React from 'react';
import styles from './Pipeline.module.css';

/* Locked PRISM-FAMILY POLICY palette (tokens.css 2026-04). Each preset
   has top (lit, 100), left (mid, 300), right (deep, 500), and ink (700)
   for outline + body text. Cobalt is brand chrome, NOT a prism family,
   so the workspace hex uses the workspace-blue family instead. */
const FAMILY_COLORS = {
  mint:       { top: '#DCF1E6', left: '#87CFA8', right: '#2E9866', ink: '#155234' },
  forest:     { top: '#D7E8D6', left: '#7DAA7C', right: '#3D7C3A', ink: '#1E461C' },
  terracotta: { top: '#F4DCD3', left: '#DA9D8A', right: '#B25E48', ink: '#6E2A1C' },
  lavender:   { top: '#ECE6F8', left: '#B7A7E3', right: '#7E66C9', ink: '#483982' },
  workspace:  { top: '#C8E5F5', left: '#67BEEA', right: '#0082C9', ink: '#014C77' },
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

/* Family label rendered as the secondary line inside the prism. Short,
   uppercase mono. Maps the family role to a single-word descriptor. */
const FAMILY_LABEL = {
  mint:       'INTEGRATE',
  forest:     'DATA',
  terracotta: 'SEARCH',
  lavender:   'VIEWS',
  workspace:  'WORKSPACE',
};

function HexPrism({name, family}) {
  const c = FAMILY_COLORS[family] || FAMILY_COLORS.forest;
  const sub = FAMILY_LABEL[family];
  return (
    <svg viewBox="0 0 120 132" className={styles.prism} aria-hidden="true">
      <polygon points="60,4 96,24 96,62 60,82 24,62 24,24" fill={c.top} />
      <polygon points="60,42 24,62 24,108 60,128" fill={c.left} />
      <polygon points="60,42 96,62 96,108 60,128" fill={c.right} />
      <polyline points="60,42 24,62 60,82 96,62 60,42" stroke={c.ink} strokeWidth="1.25" fill="none" opacity="0.18" />
      <polyline points="60,82 60,128" stroke={c.ink} strokeWidth="1.25" fill="none" opacity="0.18" />
      <text x="60" y="48" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={c.ink} letterSpacing="-0.02em">{name}</text>
      {sub && (
        <text x="60" y="62" textAnchor="middle" fontFamily="ui-monospace, Menlo, monospace" fontSize="7" letterSpacing="1.4" fill={c.ink}>
          {sub}
        </text>
      )}
    </svg>
  );
}

export function PipelineStep({number, kicker, name, family, className}) {
  const fam = family || inferFamily(name);
  return (
    <div className={[styles.step, className].filter(Boolean).join(' ')}>
      {number && <div className={styles.num}>{number}</div>}
      {kicker && <div className={styles.kicker}>{kicker}</div>}
      <HexPrism name={name} family={fam} />
    </div>
  );
}

function EndBox({label, items = [], side}) {
  return (
    <div className={[styles.end, styles['end-' + side]].join(' ')}>
      {label && <div className={styles.endLabel}>{label}</div>}
      <ul className={styles.endList}>
        {items.map((it, i) => {
          const item = typeof it === 'string' ? {label: it} : (it || {});
          return <li key={i}>{item.label}</li>;
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

      <div className={styles.steps}>
        {React.Children.map(stepNodes, (step, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={styles.flow} aria-hidden="true" />}
            {step}
          </React.Fragment>
        ))}
      </div>

      {end && <EndBox {...end} side="end" />}
    </div>
  );
}
