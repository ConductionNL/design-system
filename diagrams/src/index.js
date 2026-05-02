/**
 * @conduction/diagrams
 *
 * Brand-strict diagram primitives as web components.
 * Importing this module registers every <cn-*> element on the page.
 *
 * Usage (no build step):
 *   <script type="module" src="../diagrams/src/index.js"></script>
 *   <cn-hex color="cobalt" size="lg">Connect</cn-hex>
 *
 * Components:
 *   <cn-hex>  — pointy-top hex primitive (label + icon)
 *
 * Planned:
 *   <cn-hex-prism>, <cn-platform>, <cn-pipeline>,
 *   <cn-side-box>, <cn-honeycomb-bg>, <cn-domain-tree>
 */

export * from './cn-hex.js';
