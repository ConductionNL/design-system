# @conduction/docusaurus-preset

Brand-default Docusaurus 3 config for Conduction sites. Tokens, theme, navbar, footer, four-locale i18n (nl / en / de / fr), all pre-wired.

## Status

Pre-release, lives inside the [design-system monorepo](https://github.com/ConductionNL/design-system) as a workspace. Not yet on npm; sites consume it via `"@conduction/docusaurus-preset": "workspace:*"`.

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

## License

EUPL-1.2 + MIT.
