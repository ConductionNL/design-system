/**
 * <PartnerSidecard />
 *
 * Narrow info panel for the partner detail page right column. Three
 * stacked sections:
 *   1. Tier badge.       Pulls the same colour treatment as <PartnerCard>
 *                        (Partner = cobalt-50 pill, Certified = gold pill
 *                        with a small gold Conduction avatar to read as a
 *                        Conduction-issued credential, Strategic = white
 *                        pill on a cobalt-fill card).
 *   2. Apps supported.   Chip row from partner.apps.
 *   3. Solutions shipped. Chip row from solutionsBySlugs(partner.solutions),
 *                        each linking to its /solutions/<slug> page.
 *
 * Optional `cta` renders a primary button at the bottom of the card —
 * usually the same "Talk to {partner}" target as the hero's primary CTA,
 * so the rail is self-sufficient when the user scrolls past the hero.
 *
 * The card itself doesn't position-stick. The consuming page wraps a
 * 2-col layout (main + rail) and applies the sticky behaviour to the
 * column wrapper, so the rail starts after the hero and trails the
 * scrolling body content.
 *
 * Usage:
 *
 *   import {PARTNERS} from '@site/src/data/partners-catalog';
 *   import {solutionsBySlugs} from '@site/src/data/solutions-catalog';
 *
 *   const partner = PARTNERS.find(p => p.name === 'Acato');
 *   const solutions = solutionsBySlugs(partner.solutions);
 *
 *   <PartnerSidecard
 *     partner={partner}
 *     solutions={solutions}
 *     cta={{label: 'Talk to Acato', href: 'mailto:hello@acato.nl'}}
 *   />
 */

import React from 'react';
import styles from './PartnerSidecard.module.css';

const TIER_LABELS = {
  partner: 'Partner',
  certified: 'Certified',
  strategic: 'Strategic',
};

const TIER_BLURB = {
  partner:
    'Partner-tier teams have shipped Conduction in production at one or two clients. Listed in the directory, on the community Slack, joining quarterly office hours.',
  certified:
    'Certified per app by Conduction. Joint go-to-market on tenders and a higher SLA on shared customers. Carries the Conduction credential.',
  strategic:
    'Strategic partner with shared roadmap commitments and joint engineering. By invitation. Co-sale on government tenders, co-branded hosting offerings.',
};

export default function PartnerSidecard({
  partner,
  solutions = [],
  cta,
  className,
}) {
  if (!partner) return null;
  const tier = partner.tier || 'partner';
  const tierLabel = TIER_LABELS[tier] || tier;
  const composed = [styles.rail, styles[`tier-${tier}`], className].filter(Boolean).join(' ');

  return (
    <aside className={composed}>
      <div className={styles.tierCard}>
        {tier === 'certified' && (
          <img
            className={styles.tierBadge}
            src="/img/brand/avatar-conduction-gold-on-white.svg"
            alt="Conduction-certified mark"
            width="44"
            height="44"
          />
        )}
        <div className={styles.tierLabel}>{tier === 'partner' ? 'Partner' : `${tierLabel} partner`}</div>
        <p className={styles.tierBlurb}>{TIER_BLURB[tier]}</p>
      </div>

      {partner.apps && partner.apps.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Apps they ship</h4>
          <div className={styles.chipRow}>
            {partner.apps.map((app) => (
              <span key={app} className={styles.chip}>{app}</span>
            ))}
          </div>
        </div>
      )}

      {solutions.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Solutions they deliver</h4>
          <div className={styles.chipColumn}>
            {solutions.map((s) => (
              <a key={s.slug} href={s.href} className={styles.solutionLink}>
                <span className={styles.solutionIcon} aria-hidden="true">{s.icon}</span>
                <span className={styles.solutionTitle}>{s.shortTitle || s.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {cta && (
        <a href={cta.href} className={styles.cta}>
          {cta.label}
        </a>
      )}
    </aside>
  );
}
