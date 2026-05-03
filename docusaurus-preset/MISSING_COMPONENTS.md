# Component gaps surfaced during the connext landing-page port

This is a living checklist of `preview/components/*.html` patterns that
do not yet have a React equivalent in `@conduction/docusaurus-preset`.
Each entry names the source HTML, its current status, and what's
missing on the React side.

## Already React-shipped

- **Hero** — `preview/components/hero.html` → `Hero/Hero.jsx`
- **StatsStrip** — `preview/components/stats-strip.html` → `StatsStrip/StatsStrip.jsx`
- **CtaBanner** — `preview/components/_brand-block.html` (cta-banner partial in `landing.html`) → `CtaBanner/CtaBanner.jsx` (now with `conduction-bg`)
- **PlatformOverview** — wraps the bespoke `<platform-diagram>` web component → `PlatformOverview/PlatformOverview.jsx`
- **AppsPreview / AppCard** — `preview/components/apps-grid.html` → `AppsPreview/AppsPreview.jsx`

## Required for landing.html parity (next pass)

- **TopNavbar** — `preview/components/top-navbar.html`. Custom nav with logo + section links + locale dropdown + ghost Partners + primary Install CTA. Currently using Docusaurus default Navbar swizzle, which renders a similar layout but the locale-dropdown duplicates entries and the CTA pill styling is approximate. Needs a proper preset Navbar swizzle that mirrors top-navbar.html exactly.
- **Footer canal scene** — `preview/components/footer.html` (445 lines), `footer.css` (391 lines), `footer.js`. Animated water + canal + skyline + boats + swimmer + mini-game. Currently the preset Footer swizzle ships only the structural chrome (link grid + brand block). The full scene needs to be ported as a `<CanalScene />` component that mounts above the link grid.
- **ConductionBg** — `preview/conduction-bg.{css,js}` is now copied to `static/lib/` and wired into `CtaBanner`, but it should be a real React component (`<ConductionBg theme="on-light" count={18} />`) with auto-imported runtime so callers don't have to remember the `<Head>` boilerplate.

## Surfaced needs that are not on landing.html yet but live in the kit

- **FeatureList** — `preview/components/feature-list.html`. Two-column eyebrow/title + bulleted feature blocks with hex bullets.
- **FeatureGrid** — `preview/components/feature-grid.html`. Responsive grid of feature cards with brand-coloured icons.
- **SolutionCards** — `preview/components/solution-cards.html`. Cards with KNVB-orange corner hex and outcome bullets, used on `/solutions`.
- **PartnerCards** — `preview/components/partner-cards.html`. Logo + region + speciality + CTA, used on `/partners`.
- **EmployeeCards** — `preview/components/employee-cards.html`. Photo + name + role + contact, used on `/about`.
- **ReferenceCards** — `preview/components/reference-cards.html`. Customer reference quotes with logo + metrics.
- **PairCards** — `preview/components/pair-cards.html`. Two-up comparison cards (Conduction vs. competitor, app A vs. app B).
- **PlatformDiagram (React)** — wrap the bespoke `<platform-diagram>` web component as a React component with typed `apps` prop instead of raw `<pd-list><pd-item>...` JSX. Avoids inlining 13 SVGs in MDX.
- **HexBullet** — `<span class="hex">` (12×14, `clip-path: var(--hex-pointy-top)`, `--c-orange-knvb`). Used inside eyebrows, pill badges, status dots. Today every component duplicates the CSS.
- **Eyebrow** — uppercase 12px Plex Mono caption with hex bullet, used as a section sub-title across pages. Currently inlined as `<div class="eyebrow"><span class="h"/>...</div>` inside Hero, PlatformOverview, AppsPreview, etc.
- **PipelineFlow** — `preview/components/pipeline-flow.html`. Horizontal pipeline of step cards with arrow connectors.
- **FacetedFilters** — `preview/components/faceted-filters.html`. Filter sidebar for the apps catalogue and solutions catalogue.
- **GameModal** — `preview/components/game-modal.html`. The "win" modal that fires from the hex-rain hero mini-game; today it lives in the static lib instead of being a real React component.
- **CookieCli** — `preview/components/cookie-cli.html`. Conduction's Plex-Mono terminal-styled cookie banner.

## Site-wide chrome

- **NL/EN locale switcher** that flips both the URL prefix and the rendered copy. Today `localeDropdown` shows all four configured locales but only one is built; landing.html has no switcher at all. Needs a paired update on the design-system preview pages so the kit can show the pattern.
- **Inner wrapper / .section width tokens** — `preview/pages/landing.html` uses `max-width: 1280px; padding: 96px 64px;` consistently across sections. Each React component currently re-declares these, drifting easily. A shared `<Section>` wrapper (or CSS custom-property tokens `--section-max` / `--section-pad`) would prevent the drift the user already noticed.
