/**
 * <Clients />
 *
 * Public-sector and ecosystem logo wall. Trust-signal section for the
 * Conduction landing, separate from <PartnerCard /> which is the
 * commercial implementation-partner row on /partners.
 *
 * Two variants:
 *   - "grid"    (default): static columns, used for the partners row
 *                          and any short logo set
 *   - "marquee": three pointy-top hex rows, honeycomb stagger, all
 *                lanes scroll right-to-left at the same speed so the
 *                rows read as one continuous wall. Logos default to
 *                grayscale and restore colour on hover; the lane pauses
 *                on hover and respects prefers-reduced-motion. Below
 *                720px it collapses to a single lane.
 *
 * Logos live in sites/www/static/img/clients/ and ship via the brand
 * assets folder; the kit's downloads page mirrors the same set.
 */

import React from 'react';
import Head from '@docusaurus/Head';
import SectionHead from '../primitives/SectionHead';
import {useLazyScript} from '../../utils/lazyScript';
import styles from './Clients.module.css';

const LOGO_MEMORY_BASE = '/lib';

export const DEFAULT_CLIENTS = [
  {name: 'Albrandswaard',     src: '/img/clients/albrandswaard.png'},
  {name: 'Alkmaar',           src: '/img/clients/alkmaar.png'},
  {name: 'Amsterdam',         src: '/img/clients/amsterdam.png'},
  {name: 'Baarn',             src: '/img/clients/baarn.png'},
  {name: 'Barendrecht',       src: '/img/clients/barendrecht.png'},
  {name: 'Barneveld',         src: '/img/clients/barneveld.svg'},
  {name: 'Beek',              src: '/img/clients/beek.svg'},
  {name: 'Breda',             src: '/img/clients/breda.png'},
  {name: 'Buren',             src: '/img/clients/buren.png'},
  {name: 'DBP',               src: '/img/clients/dbp.svg'},
  {name: 'De Bilt',           src: '/img/clients/de-bilt.svg'},
  {name: 'Delft',             src: '/img/clients/delft.png'},
  {name: 'Dinkelland',        src: '/img/clients/dinkelland.png'},
  {name: 'Edam-Volendam',     src: '/img/clients/edam-volendam.png'},
  {name: 'Ede',               src: '/img/clients/ede.svg'},
  {name: 'Epe',               src: '/img/clients/epe.png'},
  {name: 'Gooise Meren',      src: '/img/clients/gooise-meren.svg'},
  {name: 'Gouda',             src: '/img/clients/gouda.png'},
  {name: 'Hoeksche Waard',    src: '/img/clients/hoeksche-waard.png'},
  {name: 'Hof van Twente',    src: '/img/clients/hof-van-twente.svg'},
  {name: 'Kansspelautoriteit', src: '/img/clients/ksa.svg'},
  {name: 'Lansingerland',     src: '/img/clients/lansingerland.svg'},
  {name: 'Meppel',            src: '/img/clients/meppel.svg'},
  {name: 'Moerdijk',          src: '/img/clients/moerdijk.svg'},
  {name: 'Molenlanden',       src: '/img/clients/molenlanden.png'},
  {name: 'Noaberkracht',      src: '/img/clients/noaberkracht.svg'},
  {name: 'Noordwijk',         src: '/img/clients/noordwijk.svg'},
  {name: 'ODMH',              src: '/img/clients/odmh.svg'},
  {name: 'Oude IJsselstreek', src: '/img/clients/oude-ijsselstreek.png'},
  {name: 'Overbetuwe',        src: '/img/clients/over-betuwe.svg'},
  {name: 'Provincie Zeeland', src: '/img/clients/provincie-zeeland.svg'},
  {name: 'Ridderkerk',        src: '/img/clients/ridderkerk.png'},
  {name: 'Rijswijk',          src: '/img/clients/rijswijk.png'},
  {name: 'Roosendaal',        src: '/img/clients/roosendaal.svg'},
  {name: 'Rotterdam',         src: '/img/clients/rotterdam.png'},
  {name: 'Soest',             src: '/img/clients/soest.svg'},
  {name: 'Stichtse Vecht',    src: '/img/clients/stichtse-vecht.svg'},
  {name: 'SURF',              src: '/img/clients/surf.svg'},
  {name: 'Tilburg',           src: '/img/clients/tilburg.png'},
  {name: 'Tubbergen',         src: '/img/clients/tubbergen.png'},
  {name: 'VNG',               src: '/img/clients/vng.png'},
  {name: 'Zutphen',           src: '/img/clients/zutphen.svg'},
  {name: 'Zwolle',            src: '/img/clients/zwolle.svg'},
];

export const DEFAULT_PARTNERS = [
  {name: 'Nextcloud',          src: '/img/clients/nextcloud.png'},
  {name: 'iO',                 src: '/img/clients/io.webp'},
  {name: 'Ritense',            src: '/img/clients/ritense.png'},
  {name: 'Shift2',             src: '/img/clients/Shift2.png'},
  {name: 'Open Webconcept',    src: '/img/clients/open_webconcept.png'},
  {name: 'SIDN Fonds',         src: '/img/clients/SIDN.png'},
  {name: 'BCT',                src: '/img/clients/bct.png'},
];

function splitIntoRows(items, rowCount) {
  const rows = Array.from({length: rowCount}, () => []);
  items.forEach((item, i) => rows[i % rowCount].push(item));
  return rows;
}

/* ClientsMarquee
 *
 * Marquee variant body, factored out so it can lazy-load the Logo
 * Memory runtime via useLazyScript. The runtime listens for clicks on
 * any .hex inside [data-memory-marquee] and starts the memory minigame
 * (12 random logo pairs, centred 4-5-6-5-4 honeycomb cluster, flip on
 * Conduction back). Game-end fires `connext:gameend` for the gaming-
 * modal cookie.
 */
function ClientsMarquee({head, clients, title, className}) {
  const rows = splitIntoRows(clients, 3);
  useLazyScript(LOGO_MEMORY_BASE + '/logo-memory.js', 'logo-memory');
  React.useEffect(() => {
    if (window.LogoMemory?.hydrate) window.LogoMemory.hydrate();
  });
  return (
    <>
      <Head>
        <link rel="stylesheet" href={LOGO_MEMORY_BASE + '/logo-memory.css'} />
      </Head>
      <section
        className={[styles.section, className].filter(Boolean).join(' ')}
        data-logo-memory
      >
        <div className={styles.inner}>{head}</div>
        <div
          className={styles.marquee}
          data-memory-marquee
          role="region"
          aria-label={typeof title === 'string' ? title : 'Clients'}
        >
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={[styles.row, styles[`row${rowIdx + 1}`]].join(' ')}
            >
              <div className={styles.track}>
                {row.map((c, i) => (
                  <HexTile key={`a-${i}`} client={c} ariaHidden={false} />
                ))}
                {row.map((c, i) => (
                  <HexTile key={`b-${i}`} client={c} ariaHidden={true} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function HexTile({client, ariaHidden}) {
  return (
    <a
      className={styles.hex}
      href="#"
      aria-label={ariaHidden ? undefined : client.name}
      aria-hidden={ariaHidden ? 'true' : undefined}
      tabIndex={ariaHidden ? -1 : 0}
      onClick={e => e.preventDefault()}
    >
      <img
        src={client.src}
        alt={ariaHidden ? '' : client.name}
        title={ariaHidden ? undefined : client.name}
        loading="lazy"
        className={styles.hexLogo}
      />
    </a>
  );
}

export default function Clients({
  eyebrow = 'Who we work with',
  title = 'Public sector, ecosystem, partners.',
  lede,
  clients = DEFAULT_CLIENTS,
  variant = 'grid',
  className,
}) {
  const head = (
    <SectionHead
      eyebrow={eyebrow}
      title={title}
      align="stack"
      lede={lede}
    />
  );

  if (variant === 'marquee') {
    return (
      <ClientsMarquee
        head={head}
        clients={clients}
        title={title}
        className={className}
      />
    );
  }

  return (
    <section className={[styles.section, className].filter(Boolean).join(' ')}>
      <div className={styles.inner}>
        {head}
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
