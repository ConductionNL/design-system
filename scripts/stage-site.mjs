// Assemble the static brand-kit artifact into _site/, ready for
// `wrangler deploy`. Mirrors the staging the legacy GitHub Pages workflow
// did: preview/ is the site root, with brand/, diagrams/dist, the linked
// docusaurus-preset static+src, and the root token stylesheets layered in.
//
// Run via `npm run deploy` (stage + deploy) or standalone with
// `node scripts/stage-site.mjs`.
import { cpSync, mkdirSync, writeFileSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

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

// The film kit (skill, bible, engine, scripts) as files and a zip under /movies.
execFileSync(process.execPath, ['scripts/films/kit-zip.mjs', '_site'], { stdio: 'inherit' });

// Custom-domain claim (harmless under Workers) + disable Jekyll processing.
writeFileSync('_site/CNAME', 'identity.conduction.nl\n');
writeFileSync('_site/.nojekyll', '');

// Workers assets refuse any file over 25 MiB and then deploy nothing at all (the
// ConNext film master is 35.5 MiB). List those files in .assetsignore so the rest
// of the site still deploys, and say which ones were left out.
const LIMIT = 25 * 1024 * 1024;
const tooLarge = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path);
    else if (st.size > LIMIT) tooLarge.push(relative('_site', path));
  }
};
walk('_site');
if (tooLarge.length) {
  writeFileSync('_site/.assetsignore', tooLarge.join('\n') + '\n');
  console.log(`Left out (over 25 MiB, Workers cannot serve them): ${tooLarge.join(', ')}`);
}

console.log('Staged _site/');
