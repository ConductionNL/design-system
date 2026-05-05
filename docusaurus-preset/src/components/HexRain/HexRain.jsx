/**
 * <HexRain />
 *
 * The "Twelve apps" mini-game from preview/pages/landing.html. A
 * decorative continuous spawn loop drops orange hexes from the top of
 * the column; first click on any hex starts a 60-second collect-the-
 * apps game (12 unique apps to find, score = unique apps collected).
 * Game-end fires a `connext:gameend` event that the gaming-modal
 * component picks up to update its cookie and reveal the cross-site
 * progress panel.
 *
 * Mirrors preview/pages/landing.html .hex-rain. The actual game logic
 * lives in sites/www/static/lib/hex-rain.js (266 lines of canvas-
 * style imperative work that earns its place in plain JS, not JSX).
 * This React wrapper:
 *   - Renders the mount point with the right class names so the
 *     runtime's selector matches
 *   - Lazy-loads the runtime CSS+JS via Head (idempotent across SPA
 *     route changes — the IIFE registers itself on first import,
 *     window.HexRain.hydrate() picks up new nodes)
 *   - Hooks into the runtime via useEffect so freshly-mounted nodes
 *     hydrate even when the SPA navigates between routes
 *
 * Usage in MDX:
 *
 *   <Hero
 *     eyebrow="..."
 *     title="..."
 *     primaryCta={{...}}
 *   >
 *     <HexRain />
 *   </Hero>
 */

import React, {useEffect, useRef} from 'react';
import Head from '@docusaurus/Head';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {useLazyScript} from '../../utils/lazyScript';

const ASSET_BASE = '/lib';

export default function HexRain({ariaLabel = 'Twelve apps mini-game, click each falling icon to collect the app', className}) {
  const isBrowser = useIsBrowser();
  const ref = useRef(null);

  /* hex-rain.js is loaded post-hydration via this hook so the runtime's
     DOM mutations don't trip React's hydration mismatch. See
     utils/lazyScript.js. */
  useLazyScript(ASSET_BASE + '/hex-rain.js', 'hex-rain');

  /* The runtime exposes window.HexRain.hydrate() once it has registered
     itself. Poll one rAF tick per frame until it's there, then call it
     to attach the spawn loop to this mount point. */
  useEffect(() => {
    if (!isBrowser) return;
    let cancelled = false;
    function tryHydrate() {
      if (cancelled) return;
      if (window.HexRain?.hydrate) {
        window.HexRain.hydrate();
        return;
      }
      requestAnimationFrame(tryHydrate);
    }
    tryHydrate();
    return () => { cancelled = true; };
  }, [isBrowser]);

  return (
    <>
      <Head>
        <link rel="stylesheet" href={ASSET_BASE + '/hex-rain.css'} />
      </Head>
      <div
        ref={ref}
        className={['hex-rain', className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
      />
    </>
  );
}
