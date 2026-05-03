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
 * lives in sites/connext/static/lib/hex-rain.js (266 lines of canvas-
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

const ASSET_BASE = '/lib';

export default function HexRain({ariaLabel = 'Twelve apps mini-game, click each falling icon to collect the app', className}) {
  const isBrowser = useIsBrowser();
  const ref = useRef(null);

  useEffect(() => {
    if (!isBrowser) return;
    /* Runtime is loaded via Head; once it's evaluated it registers
       window.HexRain.hydrate(). Polling-free wait: try immediately,
       and fall back to a single rAF tick if the script hasn't
       registered yet. */
    if (window.HexRain?.hydrate) {
      window.HexRain.hydrate();
      return;
    }
    const id = requestAnimationFrame(() => {
      if (window.HexRain?.hydrate) window.HexRain.hydrate();
    });
    return () => cancelAnimationFrame(id);
  }, [isBrowser]);

  return (
    <>
      <Head>
        <link rel="stylesheet" href={ASSET_BASE + '/hex-rain.css'} />
        <script src={ASSET_BASE + '/hex-rain.js'} defer />
      </Head>
      <div
        ref={ref}
        className={['hex-rain', className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
      />
    </>
  );
}
