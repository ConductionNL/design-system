/**
 * <FeaturesPage />
 *
 * Route component used by the `conduction-features-page` plugin. Renders the
 * app's commercial capability list, sourced (in priority order) from a curated
 * `openspec/features.overlay.json` or, as a fallback, hardened spec derivation
 * from `openspec/specs/` (see plugins/extractFeatures.js).
 *
 * Each entry maps to a single `<FeatureItem>` inside `<FeatureGrid>`, coloured
 * by its maturity: stable (mint), beta (blue), soon (orange).
 *
 * Locale-aware: on the Dutch site each entry shows `title_nl` / `summary_nl`
 * when present, falling back to the English `title` / `summary`. A
 * `providedBy` capability (e.g. surfaced from OpenRegister) is credited inline
 * so cross-app functionality reads as real and attributed.
 *
 * Receives one prop module from the plugin via `addRoute({modules})`:
 *
 *   data: {
 *     features: Array<{slug,title,summary,status,docsUrl,providedBy?,title_nl?,summary_nl?}>,
 *     title:    string,
 *     intro:    string | null,
 *   }
 */

import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import FeatureGrid from '../FeatureGrid/FeatureGrid.jsx';

// Display name + localized "powered by" lead-in for a providedBy app id.
const PROVIDER_NAMES = {
  openregister: 'OpenRegister',
  opencatalogi: 'OpenCatalogi',
  openconnector: 'OpenConnector',
  docudesk: 'DocuDesk',
  nldesign: 'NLDesign',
};

function providerCredit(providedBy, locale) {
  if (!providedBy) return '';
  const name = PROVIDER_NAMES[String(providedBy).toLowerCase()] || providedBy;
  return locale === 'nl' ? `Draait op ${name}.` : `Powered by ${name}.`;
}

export default function FeaturesPage({data}) {
  const {features = [], title = 'Features', intro = null} = data || {};
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const items = features.map((f) => {
    const label = (locale === 'nl' && f.title_nl) || f.title || f.slug;
    const summary = (locale === 'nl' && f.summary_nl) || f.summary || '';
    const credit = providerCredit(f.providedBy, locale);
    const tip = [summary, credit].filter(Boolean).join(' ');
    return {
      label,
      tip,
      status: f.status || 'stable',
      href: f.docsUrl || undefined,
    };
  });

  return (
    <Layout
      title={title}
      description={intro || `Capabilities shipped in this app.`}
    >
      <main className="container margin-vert--lg">
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
        {items.length === 0 ? (
          <p>No features documented yet.</p>
        ) : (
          <FeatureGrid items={items} legend withDescriptions />
        )}
      </main>
    </Layout>
  );
}
