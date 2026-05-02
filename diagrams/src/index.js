/**
 * @conduction/diagrams
 *
 * Brand-strict diagram primitives as web components.
 * Importing this module registers every <cn-*> element on the page.
 *
 * Usage (no build step):
 *   <script type="module" src="../diagrams/src/index.js"></script>
 *   <cn-hex color="cobalt" size="lg">Connect</cn-hex>
 *   <cn-hex-prism family="coral" size="lg">Catalogi</cn-hex-prism>
 *
 * Components:
 *   <cn-hex>          — pointy-top hex primitive (label + icon)
 *   <cn-hex-prism>    — 3D isometric prism, the atomic unit for platform diagrams
 *   <cn-domain-tree>  — vertical apex-and-branches layout for domain maps
 *
 * Planned:
 *   <cn-platform>, <cn-pipeline>, <cn-side-box>, <cn-honeycomb-bg>
 */

export * from './cn-hex.js';
export * from './cn-hex-prism.js';
export * from './cn-domain-tree.js';
