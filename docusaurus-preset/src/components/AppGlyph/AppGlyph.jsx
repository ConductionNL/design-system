import React from 'react';
import GLYPHS from '../../data/app-glyphs.json';

/**
 * AppGlyph — the single source of truth for Conduction app logos.
 *
 * Renders the canonical app glyph keyed by slug. The slug is the app's
 * current id (info.xml <id>); the old ids from the 2026-08 rename
 * (docudesk, procest, planix, ...) stay as aliases for the same glyph.
 * Every surface that shows an app mark (the /apps detail heroes, the
 * ConNext platform diagram, the apps catalogue grid) consumes this
 * component so the logo is the same everywhere instead of a
 * hand-drawn placeholder per page.
 *
 * Usage:
 *   import {AppGlyph} from '@conduction/docusaurus-preset/components';
 *   <AppGlyph app="opencatalogi" />
 *
 * Unknown slugs render nothing (returns null) so a consumer never
 * breaks over a missing glyph. src/data/app-glyphs.json is generated,
 * never hand-edited: the source is brand/assets/apps/glyphs/<id>.svg
 * (each app's img/app.svg, single colour). To add or update a glyph,
 * put the file there and run `node scripts/build-app-glyphs.mjs` from
 * the design-system root. Four legacy keys have no glyph file and are
 * carried over from the existing JSON: openanonymiser, deskdesk,
 * financeq and purchaseq.
 *
 * APP_GLYPH_SLUGS lists every key, so it includes the old-id aliases
 * (docudesk, procest, ...) next to the current ids. Do not use it as a
 * list of apps.
 *
 * The glyph inherits color via `fill: currentColor`, so wrap it in a
 * element with the desired `color` (the DetailHero hex, a catalogue
 * tile) to tint it.
 */
export const APP_GLYPH_SLUGS = Object.keys(GLYPHS);

export function hasAppGlyph(app) {
  return Boolean(app && GLYPHS[app]);
}

export default function AppGlyph({app, className, title, ...rest}) {
  const glyph = app && GLYPHS[app];
  if (!glyph) {
    return null;
  }
  return (
    <svg
      viewBox={glyph.viewBox}
      className={className}
      fill="currentColor"
      // These are FILLED brand glyphs. Force stroke off inline so a
      // container's line-icon rule (e.g. .iconWrap svg { stroke: currentColor;
      // stroke-width: 2 }) can't paint a 2px outline over the fill and bloat
      // the mark. Inline style beats module CSS, so this fixes every consumer
      // (apps grid, detail hero, cross-links, connext) in one place.
      style={{fill: 'currentColor', stroke: 'none'}}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      // Inner markup is verbatim brand-kit SVG (paths, circles, rects)
      // — render it raw rather than transcribing each path into JSX.
      dangerouslySetInnerHTML={{__html: glyph.inner}}
      {...rest}
    />
  );
}
