// Assemble the static brand-kit artifact into _site/, ready for
// `wrangler deploy`. Mirrors the staging the legacy GitHub Pages workflow
// did: preview/ is the site root, with brand/, diagrams/dist, the linked
// docusaurus-preset static+src, and the root token stylesheets layered in.
//
// Run via `npm run deploy` (stage + deploy) or standalone with
// `node scripts/stage-site.mjs`.
import { cpSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';

rmSync('_site', { recursive: true, force: true });
mkdirSync('_site', { recursive: true });

cpSync('preview', '_site', { recursive: true });

const layers = [
  ['brand', '_site/brand'],
  ['diagrams/dist', '_site/diagrams'],
  ['docusaurus-preset/static', '_site/docusaurus-preset/static'],
  ['docusaurus-preset/src', '_site/docusaurus-preset/src'],
];
for (const [src, dest] of layers) {
  if (existsSync(src)) cpSync(src, dest, { recursive: true });
}

for (const f of ['tokens.css', 'typography.css']) {
  if (existsSync(f)) cpSync(f, `_site/${f}`);
}

// Custom-domain claim (harmless under Workers) + disable Jekyll processing.
writeFileSync('_site/CNAME', 'identity.conduction.nl\n');
writeFileSync('_site/.nojekyll', '');

console.log('Staged _site/');
