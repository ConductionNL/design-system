/**
 * integration-icons.variants.jsx — kit gallery for the
 * IntegrationIcon registry, rendered to static HTML by
 * scripts/build-kit.mjs and spliced into integration-icons.html
 * between the BUILD:integration-gallery markers.
 *
 * Renders one section per category with the icons as cards. Source
 * of truth is the registry; if a new icon lands in registry.js it
 * appears here automatically on next build.
 */

import React from 'react';
import IntegrationIcon from '../../docusaurus-preset/src/components/IntegrationIcon/IntegrationIcon.jsx';
import { INTEGRATIONS, INTEGRATION_CATEGORIES } from '../../docusaurus-preset/src/components/IntegrationIcon/registry.js';

export default function IntegrationGallery() {
  // Group registry by category, preserving insertion order from
  // INTEGRATION_CATEGORIES so the layout reads top-to-bottom in the
  // intended order.
  const byCategory = {};
  for (const cat of Object.keys(INTEGRATION_CATEGORIES)) byCategory[cat] = [];
  for (const [name, entry] of Object.entries(INTEGRATIONS)) {
    if (byCategory[entry.category]) byCategory[entry.category].push({ name, ...entry });
  }

  return (
    <>
      {Object.entries(INTEGRATION_CATEGORIES).map(([catKey, catMeta]) => (
        <section className="cat-section" key={catKey}>
          <h2>{catMeta.label}</h2>
          <p className="cat-desc">{catMeta.desc}</p>
          <div className="icon-grid">
            {byCategory[catKey].map(item => (
              <div className="icon-card" key={item.name}>
                <div className="glyph">
                  <IntegrationIcon name={item.name} size="lg" />
                </div>
                <div className="name">{item.label}</div>
                <div className="slug"><code>{item.name}</code></div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
