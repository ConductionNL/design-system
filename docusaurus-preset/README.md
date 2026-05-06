# @conduction/docusaurus-preset

Brand-default Docusaurus 3 config for Conduction sites. Tokens, theme, navbar, footer, four-locale i18n (nl / en / de / fr), all pre-wired.

## Status

Source lives inside the [design-system monorepo](https://github.com/ConductionNL/design-system); published to npm under the `@conduction` scope as a single package. Install in any product site with `npm i @conduction/docusaurus-preset`. The diagram web-component runtime (`<cn-hex>`, `<cn-platform>`, etc.) ships inside this same package under `@conduction/docusaurus-preset/diagrams` — no separate install needed.

## What it gives you

- **Brand CSS** — tokens (cobalt palette, KNVB orange, Plex Mono, hex clip-paths, Common Ground yellow) auto-applied to Docusaurus's Infima theme variables. Navbar, footer, sidebar, buttons, code blocks all inherit the brand without a single swizzle.
- **i18n config** — four locales pinned: NL default at the URL root, EN/DE/FR at `/en/`, `/de/`, `/fr/`. `htmlLang` per locale, `trailingSlash: true`, locale dropdown ready.
- **Brand-default navbar** — locale-dropdown + GitHub link. Sites override `items[]` for site-specific navigation.
- **Brand-default footer** — three-column link grid + Conduction-tells (KvK, BTW, address). Sites override per page or globally.
- **Sensible defaults** — `trailingSlash`, `onBrokenLinks: 'warn'`, `respectPrefersColorScheme`, dark-mode brand mapping.

## Usage

```js
// docusaurus.config.js
const { createConfig } = require('@conduction/docusaurus-preset');

module.exports = createConfig({
  title: 'Conduction',
  tagline: 'Open-source apps for the Nextcloud workspace.',
  url: 'https://conduction.nl',
  baseUrl: '/',
  organizationName: 'ConductionNL',
  projectName: 'design-system',

  // Optional overrides
  navbar: {
    items: [
      { to: '/docs/intro', label: 'Docs', position: 'left' },
      { to: '/blog', label: 'Blog', position: 'left' },
      // brand-default items (locale dropdown, GitHub) are merged in
    ],
  },

  // Site-specific CSS appended after brand.css
  customCss: ['./src/css/site.css'],
});
```

The function returns a complete Docusaurus config with brand defaults pre-applied. Override any field by passing it in or merging after.

## API

`createConfig(opts)` — returns a Docusaurus config object.

| Option | Required | Default | Purpose |
| --- | --- | --- | --- |
| `title` | ✓ | — | Site title (also used as the navbar title and footer reference). |
| `tagline` |  | `''` | Site tagline. |
| `url` | ✓ | — | Production URL, e.g. `https://connext.conduction.nl`. |
| `baseUrl` |  | `'/'` | Path under the URL. Almost always `/` since each site has its own subdomain. |
| `favicon` |  | `'img/favicon.svg'` | Favicon path under `static/`. |
| `organizationName` |  | `'ConductionNL'` | GitHub org. |
| `projectName` |  | `'design-system'` | GitHub repo. |
| `i18n` |  | nl / en / de / fr, NL default | Override the brand-default i18n block. |
| `navbar` |  | locale dropdown + GitHub | Merged into the brand-default navbar object. |
| `footer` |  | three-column link grid | Replaces the brand-default footer. |
| `customCss` |  | `[]` | Site-specific CSS, appended to `brand.css`. |
| `presets` |  | `[['classic', …]]` | Replaces the default preset list. |
| `plugins` |  | `[]` | Docusaurus plugins. |
| `themeConfig` |  | `{}` | Merged into the brand-default `themeConfig`. |
| `editUrl` |  | undefined | Edit-this-doc link. |
| `blog` |  | enabled | Set `false` to disable the blog plugin. |

Also exported: `I18N`, `baseNavbar(siteName)`, `baseFooter()` for sites that want to compose manually.

## Brand CSS exports

| Path | Purpose |
| --- | --- |
| `@conduction/docusaurus-preset/css/brand.css` | The default. Imported by `createConfig()` automatically. |
| `@conduction/docusaurus-preset/css/tokens.css` | Just the tokens, no Infima mapping. Use if you swizzle the entire theme. |

## OpenCatalogi content plugin

A future `@conduction/docusaurus-plugin-opencatalogi` will pull pages from a Nextcloud OpenCatalogi register at build time. The shape:

```js
// docusaurus.config.js
module.exports = createConfig({
  title: 'Conduction',
  url: 'https://conduction.nl',
  plugins: [
    [
      '@conduction/docusaurus-plugin-opencatalogi',
      {
        // Where to fetch from (production: a public read-only API; local: localhost)
        apiUrl: process.env.OPENCATALOGI_URL || 'http://localhost:8080/index.php/apps/openregister/api',
        register: 'connext-content',
        schema: 'page',
        // Where to drop the generated Markdown
        output: 'i18n/{locale}/docusaurus-plugin-content-pages',
        // Pull translations per locale; fall back to defaultLocale where missing
        locales: ['nl', 'en', 'de', 'fr'],
      },
    ],
  ],
});
```

The plugin runs during `docusaurus build`, fetches OpenCatalogi objects, writes Markdown files per locale into the i18n folders, and Docusaurus picks them up as if they were committed. End result: editors update content in the Nextcloud OpenCatalogi UI, push triggers a build, the static site is regenerated. No runtime API calls; the production site stays a static deploy.

That plugin is not yet built. Until it lands, sites use plain Markdown in `docs/` and `i18n/<locale>/`.

## Local development against a local Nextcloud

Once the OpenCatalogi plugin is built, the dev workflow becomes:

```bash
# Start the local Nextcloud (Conduction's docker-compose dev environment)
cd ~/nextcloud-docker-dev && docker compose up -d

# Start Docusaurus, pointing at localhost:8080
cd ~/.../sites/www
OPENCATALOGI_URL=http://localhost:8080/index.php/apps/openregister/api npm start
```

`npm start` runs Docusaurus's hot-reload dev server. The plugin re-fetches on each rebuild so editing in the Nextcloud UI shows up after a save.

## Consume from a product site

```bash
npm i @conduction/docusaurus-preset @docusaurus/core @docusaurus/preset-classic react react-dom
```

Then use `createConfig()` in your `docusaurus.config.js` as shown in [Usage](#usage) above. The diagram web components register themselves on the client when `<Hero/>` or `<Diagrams/>` mount — no extra import needed in MDX. To register them eagerly (e.g. for a docs page that uses `<cn-hex>` directly without a wrapper), import the runtime module:

```js
// site src/clientModules/diagrams.js
import '@conduction/docusaurus-preset/diagrams';
```

This is how product sites such as `mydash.conduction.nl/docs/...` adopt the brand without copying CSS or theme code, and stay in sync as the design-system evolves.

## Releasing

Releases auto-publish on push to `main`. The [.github/workflows/publish-packages.yml](../.github/workflows/publish-packages.yml) workflow compares the version in this `package.json` against what's on `registry.npmjs.org`. Bump the version, push, the workflow publishes. No bump means no publish — the workflow exits cleanly. Tag pushes (`v*`) and manual `workflow_dispatch` runs (with an optional dry-run flag) are accepted for explicit republishes and emergency holds.

The diagram primitives ship inside the same tarball under `src/diagrams/`, so there is exactly one npm release per push.

**One-time setup** (per repo, since Conduction keeps secrets repo-local):

1. Sign in to npm with an account that's a member of the `@conduction` org and has publish rights on the scope. (`npm login` from the CLI, or via [npmjs.com](https://www.npmjs.com/login).)
2. Create an automation token under your *user* settings (npm tokens are user-level, not org-level): npmjs.com → avatar dropdown → "Access Tokens" → "Generate New Token" → **Automation**. Copy the value.
3. Add it as a repo secret: <https://github.com/ConductionNL/design-system/settings/secrets/actions> → "New repository secret" → name `NPM_TOKEN`, paste the token.
4. (Optional) Verify the workflow with a dry run: Actions → "Publish packages" → Run workflow → leave "dry_run" checked. Watch for `+ @conduction/docusaurus-preset@…` in the logs without an actual upload.

The token publishes **on behalf of the user account**, not the org, so anyone with the right org-level permission can generate the token. Rotate by replacing the secret; no need to redeploy or amend the workflow.

**Per release:**

```bash
# Bump the preset version. The diagrams source ships inside the preset,
# so there is one version to bump.
$EDITOR docusaurus-preset/package.json   # "version": "0.2.0"

git add docusaurus-preset/package.json
git commit -m "Bump @conduction/docusaurus-preset to 0.2.0"
git push origin main   # the workflow detects the bump and publishes
```

The workflow runs `npm publish --workspace @conduction/docusaurus-preset --access public`. Watch the run on the Actions tab. If it fails, fix the issue, bump the patch (`0.2.1`), push again — npm rejects re-publishing the same version, so a single failed run can't block a corrected re-bump.

## License

EUPL-1.2 + MIT.
