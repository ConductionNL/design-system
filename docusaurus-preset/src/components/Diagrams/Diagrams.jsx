/**
 * Thin React wrappers for the framework-agnostic diagram web
 * components in @conduction/diagrams: <cn-hex>, <cn-hex-prism>,
 * <cn-platform>, <cn-domain-tree>, etc.
 *
 * Why React wrappers around already-working web components?
 *   - Type-checked prop names (no remembering "size" vs "scale")
 *   - Lazy-imports the runtime so MDX pages don't have to remember
 *     the @conduction/diagrams import in <Hero/>'s useEffect
 *   - Auto-conversion of camelCase props to dashed HTML attributes
 *     where needed (e.g. brandColor → brand-color)
 *
 * Slot-based content (icon, label, etc.) is passed through as
 * children with `slot="..."` attributes, so callers compose like
 * regular React components.
 *
 * Usage in MDX:
 *
 *   import {Hex, HexPrism} from '@conduction/docusaurus-preset/components';
 *
 *   <Hex color="cobalt" size="md" variant="solid">
 *     <span slot="kicker">DATA</span>
 *     OpenRegister
 *   </Hex>
 *
 *   <HexPrism family="coral" size="lg" state="hover">
 *     <span slot="kicker">CATALOG</span>
 *     OpenCatalogi
 *   </HexPrism>
 *
 * The runtime is lazy-loaded once, then customElements.define guards
 * keep subsequent imports a no-op. If the package isn't installed
 * (non-Conduction sites), the import fails silently and the elements
 * render as plain unknown HTML, which the browser tolerates.
 */

import React, {useEffect} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';

let runtimeImported = false;
function ensureRuntime() {
  if (typeof window === 'undefined' || runtimeImported) return;
  runtimeImported = true;
  import('@conduction/diagrams').catch(() => {
    /* Package may not be installed in non-Conduction sites; that's OK.
       Fall back to plain unknown-element rendering. */
    runtimeImported = false;
  });
}

/* Lazy-runtime hook shared by every diagram wrapper. */
function useDiagramRuntime() {
  const isBrowser = useIsBrowser();
  useEffect(() => { if (isBrowser) ensureRuntime(); }, [isBrowser]);
}

/* Strip undefined props before forwarding so we don't emit empty
   attributes on the custom element. */
function attrs(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === false) continue;
    out[k] = v;
  }
  return out;
}

/* ============================================================
   <Hex /> wraps <cn-hex>
   Observed: color, size, variant, layout, interactive
   ============================================================ */
export function Hex({color, size, variant, layout, interactive, children, ...rest}) {
  useDiagramRuntime();
  return (
    <cn-hex {...attrs({color, size, variant, layout, interactive: interactive ? '' : undefined})} {...rest}>
      {children}
    </cn-hex>
  );
}

/* ============================================================
   <HexPrism /> wraps <cn-hex-prism>
   Observed: family, size, state
   ============================================================ */
export function HexPrism({family, size, state, children, ...rest}) {
  useDiagramRuntime();
  return (
    <cn-hex-prism {...attrs({family, size, state})} {...rest}>
      {children}
    </cn-hex-prism>
  );
}

/* ============================================================
   <Platform /> wraps <cn-platform>
   Slot-based: a centre apex + surrounding hexes/prisms as children.
   Optional ground={true} adds the cobalt ground line. The component's
   own attributes are loose; pass through verbatim.
   ============================================================ */
export function Platform({ground, children, ...rest}) {
  useDiagramRuntime();
  return (
    <cn-platform {...attrs({ground: ground ? '' : undefined})} {...rest}>
      {children}
    </cn-platform>
  );
}

/* ============================================================
   <DomainTree /> wraps <cn-domain-tree>
   Pass children with slot="apex" / slot="branch" / slot="leaf" to
   build the hierarchy.
   ============================================================ */
export function DomainTree({children, ...rest}) {
  useDiagramRuntime();
  return <cn-domain-tree {...rest}>{children}</cn-domain-tree>;
}

/* ============================================================
   <Pipeline /> wraps <cn-pipeline>  (note: NOT the layout-grid
   <Pipeline/> from components/Pipeline; this one is the SVG-driven
   web-component version).
   Re-exported as DiagramPipeline to avoid the name collision; if
   you import it, alias on use.
   ============================================================ */
export function DiagramPipeline({children, ...rest}) {
  useDiagramRuntime();
  return <cn-pipeline {...rest}>{children}</cn-pipeline>;
}

/* ============================================================
   <SideBox /> wraps <cn-side-box>
   ============================================================ */
export function SideBox({children, ...rest}) {
  useDiagramRuntime();
  return <cn-side-box {...rest}>{children}</cn-side-box>;
}

/* ============================================================
   <HoneycombBg /> wraps <cn-honeycomb-bg>
   Honeycomb-pattern background as a web component (alongside the
   React <ConductionBg/>; this one is for plain-HTML surfaces).
   ============================================================ */
export function HoneycombBg(props) {
  useDiagramRuntime();
  return <cn-honeycomb-bg {...props} />;
}
