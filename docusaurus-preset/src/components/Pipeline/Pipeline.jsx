/**
 * <Pipeline /> + <PipelineStep />
 *
 * Horizontal pipeline of hex-prism steps, mirroring
 * preview/components/pipeline-flow.html. Each step renders as a 3D
 * hex-prism (top + left + right faces) coloured by family, with the
 * "01" number, uppercase kicker, app name and caption stacked
 * above/below. Steps are separated by dotted flow lines. Optional
 * `start` / `end` slots take source / consumer end-boxes.
 *
 * Family palette mirrors the kit's pipeline-flow.html exactly so the
 * website and kit read as one diagram. Family is auto-detected from
 * the step's name (OpenConnector → mint, OpenRegister → gray,
 * OpenCatalogi → coral, MyDash → lavender, Nextcloud → cobalt) and
 * can be overridden per-step via the `family` prop.
 *
 * Usage in MDX:
 *
 *   <Pipeline
 *     start={{label: 'Sources', items: ['XLNS', 'Joomla', 'OpenZaak', 'RX']}}
 *     steps={[
 *       {number: '01', kicker: 'Ingest',    name: 'OpenConnector', caption: 'Pulls Woo-records from your DMS.'},
 *       {number: '02', kicker: 'Store',     name: 'OpenRegister',  caption: 'One typed register per category.'},
 *       {number: '03', kicker: 'Catalogue', name: 'OpenCatalogi',  caption: 'Indexes every register.'},
 *     ]}
 *     end={{label: 'Consumers', items: ['Open Tilburg portal', 'Residents', 'open.overheid.nl']}}
 *   />
 */

import React from 'react';
import styles from './Pipeline.module.css';

/* Family palette, kit-identical. Each preset has top (lightest), left
   (mid), right (darkest), edge (outline + body text). Cobalt is the
   workspace family; its text is white + edge is white-translucent. */
const FAMILY_COLORS = {
  mint:     { top: '#DCF1E6', left: '#87CFA8', right: '#2E9866', edge: '#155234', text: '#155234' },
  gray:     { top: '#ECEEF2', left: '#B7BDC9', right: '#6B7280', edge: '#3A4150', text: '#3A4150' },
  coral:    { top: '#FFE4DA', left: '#FAB29C', right: '#F36C21', edge: '#9B3A0E', text: '#9B3A0E' },
  lavender: { top: '#ECE6F8', left: '#B7A7E3', right: '#7E66C9', edge: '#483982', text: '#483982' },
  cobalt:   { top: '#21468B', left: '#4D69A4', right: '#152D5C', edge: 'rgba(255,255,255,0.25)', text: '#FFFFFF' },
};

function inferFamily(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('connector')) return 'mint';
  if (n.includes('register')) return 'gray';
  if (n.includes('catalog')) return 'coral';
  if (n.includes('mydash') || n.includes('dashboard')) return 'lavender';
  if (n.includes('nextcloud') || n.includes('workspace') || n.includes('platform')) return 'cobalt';
  return 'gray';
}

/* Strip the "Open" prefix so the prism face shows a 7-9 char label
   (Connector / Register / Catalogi) that fits the 72px-wide top face.
   Falls back to the original name if it's already short. */
function shortName(name) {
  if (!name) return '';
  if (/^Open[A-Z]/.test(name)) return name.slice(4);
  return name;
}

/* Family label rendered as the secondary line inside the prism. Kept
   short, uppercase mono; meant to match the kicker character of the
   kit hero diagram (INTEGRATIONS / SCHEMAS / DATA / VIEWS). */
const FAMILY_LABEL = {
  mint:     'INTEGRATIONS',
  gray:     'SCHEMAS',
  coral:    'DATA',
  lavender: 'VIEWS',
  cobalt:   'WORKSPACE',
};

function HexPrism({name, family}) {
  const c = FAMILY_COLORS[family] || FAMILY_COLORS.gray;
  const display = shortName(name);
  const sub = FAMILY_LABEL[family];
  return (
    <svg viewBox="0 0 120 132" className={styles.prism} aria-hidden="true">
      <polygon points="60,4 96,24 96,62 60,82 24,62 24,24" fill={c.top} />
      <polygon points="60,42 24,62 24,108 60,128" fill={c.left} />
      <polygon points="60,42 96,62 96,108 60,128" fill={c.right} />
      <polyline points="60,42 24,62 60,82 96,62 60,42" stroke={c.edge} strokeWidth="1.25" fill="none" opacity="0.18" />
      <polyline points="60,82 60,128" stroke={c.edge} strokeWidth="1.25" fill="none" opacity="0.18" />
      <text x="60" y="46" textAnchor="middle" fontSize="11" fontWeight="700" fill={c.text}>{display}</text>
      {sub && (
        <text x="60" y="60" textAnchor="middle" fontFamily="ui-monospace, Menlo, monospace" fontSize="7" letterSpacing="1.4" fill={c.text}>
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
      <HexPrism name={name} family={fam} />
      {name && <div className={styles.name}>{name}</div>}
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}

function EndBox({label, items = [], side}) {
  return (
    <div className={[styles.end, styles['end-' + side]].join(' ')}>
      {label && <div className={styles.endLabel}>{label}</div>}
      <ul className={styles.endList}>
        {items.map((it, i) => <li key={i}>{it}</li>)}
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
