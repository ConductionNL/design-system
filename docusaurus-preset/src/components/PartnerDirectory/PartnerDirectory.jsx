/**
 * <PartnerDirectory />
 *
 * Filterable partner directory: composes <FacetedFilters/> (sidebar),
 * <PartnerGrid/>, <PartnerCard/>, and an optional <BecomePartner/> CTA.
 *
 * Facets are auto-derived from the partners array:
 *   - tier: Strategic / Certified / Partner (only shown when ≥1 partner)
 *   - app:  union of every partners[].apps[] value, sorted by count
 *
 * Filter logic: a partner is shown when it matches every active facet.
 * Within a facet, multiple selections are OR-ed (any-of). Across
 * facets, selections are AND-ed (all-of).
 *
 * Usage in MDX:
 *
 *   <PartnerDirectory
 *     partners={[
 *       {href: '/partners/acato', tier: 'strategic', name: 'Acato',
 *        logo: '/img/partners/acato.png',
 *        summary: <>Nederlandse open-source specialist…</>,
 *        apps: ['OpenRegister', 'OpenCatalogi', 'DocuDesk']},
 *       …
 *     ]}
 *     becomePartner={{
 *       href: '#become-a-partner',
 *       title: 'Ship Conduction to your customers.',
 *       body:  'Join as Partner, Certified, or Strategic.',
 *       ctaLabel: 'Apply below',
 *     }}
 *   />
 */

import React, {useState, useMemo} from 'react';
import FacetedFilters from '../FacetedFilters/FacetedFilters';
import PartnerCard, {PartnerGrid, BecomePartner} from '../PartnerCard/PartnerCard';
import styles from './PartnerDirectory.module.css';

const TIER_LABELS = {partner: 'Partner', certified: 'Certified', strategic: 'Strategic'};
const TIER_ORDER = ['strategic', 'certified', 'partner'];

function deriveFacets(partners) {
  const tierItems = TIER_ORDER
    .map(value => ({
      value,
      label: TIER_LABELS[value],
      count: partners.filter(p => p.tier === value).length,
    }))
    .filter(item => item.count > 0);

  const appCounts = {};
  for (const p of partners) {
    for (const a of p.apps || []) {
      appCounts[a] = (appCounts[a] || 0) + 1;
    }
  }
  const appItems = Object.entries(appCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({value, label: value, count}));

  const facets = [];
  if (tierItems.length > 0) facets.push({key: 'tier', label: 'Partner tier',     items: tierItems});
  if (appItems.length  > 0) facets.push({key: 'app',  label: 'Apps & services',  items: appItems});
  return facets;
}

function partnerMatches(partner, selected) {
  const tierFilter = selected.tier || [];
  if (tierFilter.length > 0 && !tierFilter.includes(partner.tier)) return false;

  const appFilter = selected.app || [];
  if (appFilter.length > 0) {
    const partnerApps = partner.apps || [];
    if (!appFilter.some(a => partnerApps.includes(a))) return false;
  }

  return true;
}

export default function PartnerDirectory({
  partners = [],
  becomePartner,
  gridColumns = 2,
  emptyState = 'No partners match the current filters.',
  className,
}) {
  const [selected, setSelected] = useState({});
  const facets = useMemo(() => deriveFacets(partners), [partners]);
  const filtered = useMemo(
    () => partners.filter(p => partnerMatches(p, selected)),
    [partners, selected],
  );

  return (
    <div className={[styles.layout, className].filter(Boolean).join(' ')}>
      <FacetedFilters
        facets={facets}
        selected={selected}
        onChange={setSelected}
      />
      <div className={styles.results}>
        {filtered.length > 0 ? (
          <PartnerGrid columns={gridColumns}>
            {filtered.map((p, i) => (
              <PartnerCard key={p.href || p.name || i} {...p} />
            ))}
            {becomePartner && <BecomePartner {...becomePartner} />}
          </PartnerGrid>
        ) : (
          <>
            <p className={styles.empty}>{emptyState}</p>
            {becomePartner && (
              <PartnerGrid columns={gridColumns}>
                <BecomePartner {...becomePartner} />
              </PartnerGrid>
            )}
          </>
        )}
      </div>
    </div>
  );
}
