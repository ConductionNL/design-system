# sites/academy

`academy.conduction.nl`, the Conduction learning hub. One feed of
blogs, guides, case studies, webinars, and tutorials, all written as
MDX files with a `contentType:` frontmatter (see
[`docusaurus-preset/docs/academy-content-schema.md`](../../docusaurus-preset/docs/academy-content-schema.md)).

## Local dev

```sh
# from design-system repo root
docker compose up academy
# → http://localhost:3200
```

Or directly with npm (requires Node 20):

```sh
npm install
npm --workspace sites/academy run start
```

## Deploy

The site builds to `build/` via `docusaurus build`. GitHub Pages
serves it from the `main` branch with the [`CNAME`](static/CNAME)
redirecting `academy.conduction.nl` to the build output.

## Structure

- [`docusaurus.config.js`](docusaurus.config.js) — wiring (locale, navbar, footer, plugins)
- [`src/pages/index.mdx`](src/pages/index.mdx) — the academy landing page
- `src/css/site.css` — site-specific overrides on top of `@conduction/docusaurus-preset`
- `static/` — static assets (`CNAME`, future images)
- *(batch 3)* `blog/` — Docusaurus blog plugin content folder. Each post is one MDX file with `contentType:` frontmatter.

## Adding a post

When the blog plugin is wired (batch 3):

```sh
# Dutch (canonical for this post):
sites/academy/blog/2026-05-05-install-opencatalogi/index.mdx

# English translation (optional, can diverge):
sites/academy/i18n/en/docusaurus-plugin-content-blog/2026-05-05-install-opencatalogi/index.mdx
```

Frontmatter contract: see the academy content schema in the preset.
