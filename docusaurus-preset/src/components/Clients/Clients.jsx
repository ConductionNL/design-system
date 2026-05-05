/**
 * <Clients />
 *
 * Public-sector and ecosystem logo wall. Trust-signal section for the
 * Conduction landing, separate from <PartnerCard /> which is the
 * commercial implementation-partner row on /partners.
 *
 * The default `clients` set ships with the Conduction reference
 * customers (VNG, gemeenten, foundations, ecosystem peers), all
 * sourced from sites/www/static/img/clients/. Pages can override the
 * `clients` prop to render their own logo set.
 *
 * Visual:
 *   - 1280px-wide grid, columns adapt to viewport
 *   - logos rendered grayscale at rest, full colour on hover
 *   - no captions, no links by default (the /partners page is for
 *     "where do I learn more about implementation"; this is just the
 *     "who works with Conduction" trust signal)
 *
 * Usage in MDX:
 *
 *   <Clients
 *     eyebrow="Who we work with"
 *     title="From VNG to your gemeente."
 *     lede="Sixteen years of public-sector and Common Ground work."
 *   />
 */

import React from 'react';
import SectionHead from '../primitives/SectionHead';
import styles from './Clients.module.css';

export const DEFAULT_CLIENTS = [
  {name: 'VNG',                src: '/img/clients/vng.png'},
  {name: 'Gemeente Almere',    src: '/img/clients/almere.png'},
  {name: "'s-Hertogenbosch",   src: '/img/clients/denbosch.png'},
  {name: 'Gemeente Eindhoven', src: '/img/clients/eindhoven.png'},
  {name: 'Gemeente Rotterdam', src: '/img/clients/rotterdam.png'},
  {name: 'Gemeente Tilburg',   src: '/img/clients/tilburg.png'},
  {name: 'Gemeente Utrecht',   src: '/img/clients/utrecht.png'},
  {name: 'Gemeente Hoorn',     src: '/img/clients/hoorn.png'},
  {name: 'Nextcloud',          src: '/img/clients/nextcloud.png'},
  {name: 'iO',                 src: '/img/clients/io.webp'},
  {name: 'Ritense',            src: '/img/clients/ritense.png'},
  {name: 'Shift2',             src: '/img/clients/Shift2.png'},
  {name: 'Open Webconcept',    src: '/img/clients/open_webconcept.png'},
  {name: 'SIDN Fonds',         src: '/img/clients/SIDN.png'},
  {name: 'BCT',                src: '/img/clients/bct.png'},
];

export default function Clients({
  eyebrow = 'Who we work with',
  title = 'Public sector, ecosystem, partners.',
  lede,
  clients = DEFAULT_CLIENTS,
  className,
}) {
  return (
    <section className={[styles.section, className].filter(Boolean).join(' ')}>
      <div className={styles.inner}>
        <SectionHead
          eyebrow={eyebrow}
          title={title}
          align="stack"
          lede={lede}
        />
        <div className={styles.grid} role="list">
          {clients.map((c, i) => (
            <div key={i} className={styles.cell} role="listitem">
              <img
                src={c.src}
                alt={c.name}
                title={c.name}
                loading="lazy"
                className={styles.logo}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
