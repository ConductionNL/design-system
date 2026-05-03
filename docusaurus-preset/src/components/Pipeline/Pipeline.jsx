/**
 * <Pipeline /> + <PipelineStep />
 *
 * Horizontal pipeline of hex-numbered step cards, surfaced from
 * preview/components/pipeline-flow.html. Used wherever a flow needs
 * "data goes in here, transforms through these steps, lands there":
 *   - /apps/openregister "How it works"
 *   - /solutions/* "Pipeline" sections
 *   - /install onboarding (with HowSteps as the simpler alternative)
 *
 * Each step shows a numbered hex + uppercase kicker + name + caption.
 * Steps are connected by chevron-style flow lines between them; the
 * end-row at each side (optional `start`/`end` slots) takes the
 * sources / consumers labels.
 *
 * For the SVG-pixel-exact version that ships on the kit's hero pages,
 * use the markup directly from preview/components/pipeline-flow.html.
 * This component is the layout-grid version that scales cleanly to
 * any page width.
 *
 * Usage in MDX:
 *
 *   <Pipeline
 *     start={{label: 'Sources', items: ['Spreadsheets', 'Databases', 'REST / SOAP', 'Legacy']}}
 *     steps={[
 *       {number: '01', kicker: 'Ingest',   name: 'OpenConnector', caption: 'Pull data in from your existing systems.'},
 *       {number: '02', kicker: 'Validate', name: 'OpenRegister',  caption: 'Schema-validated, citation-stable storage.'},
 *       {number: '03', kicker: 'Surface',  name: 'OpenCatalogi',  caption: 'Federated public catalogue. WOO-ready.'},
 *       {number: '04', kicker: 'Render',   name: 'MyDash',        caption: 'Dashboards, reports, public-facing UI.'},
 *     ]}
 *     end={{label: 'Consumers', items: ['Citizens', 'Analysts', 'API clients', 'Partners']}}
 *   />
 */

import React from 'react';
import HexBullet from '../primitives/HexBullet';
import styles from './Pipeline.module.css';

export function PipelineStep({number, kicker, name, caption, icon, className}) {
  return (
    <div className={[styles.step, className].filter(Boolean).join(' ')}>
      {number && <div className={styles.num}>{number}</div>}
      {kicker && <div className={styles.kicker}>{kicker}</div>}
      {icon && <div className={styles.icon}>{icon}</div>}
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
