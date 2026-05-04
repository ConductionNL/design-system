# Component coverage map

Tracks which `preview/components/*.html` patterns ship as React components
in `@conduction/docusaurus-preset`. The file started as a gap list during
the connext landing port; it now reads as a coverage map. Anything still
missing lives in **Open gaps** at the bottom.

## Atomic primitives (Batch 1)

Every higher-level component composes from these. Each one was extracted
when its CSS rule appeared in three or more component files.

- **HexBullet** — `primitives/HexBullet.jsx`. Three sizes (sm 8×9, md 12×14, lg 44×50) of the pointy-top clip-path hex. Used in eyebrows, pill bullets, status badges, footer triad.
- **Eyebrow** — `primitives/Eyebrow.jsx`. Uppercase Plex Mono caption with optional leading HexBullet.
- **Section** — `primitives/Section.jsx`. The 1280px-max wrapper. Background variants (default, tinted, inverse), spacing variants (default, tight, flush).
- **SectionHead** — `primitives/SectionHead.jsx`. Eyebrow + h2 + lede in a 1.1fr/1fr split, stacked under 900px.
- **Card** — `primitives/Card.jsx`. White / cobalt-100 / radius-lg. Tones: surface (default), ghost (dashed), inverse (cobalt-900).
- **Pill** — `primitives/Pill.jsx`. Mono-caps chip with optional bullet. Status badges, app tags, sector labels.
- **Button** — `primitives/Button.jsx`. Primary / secondary / ghost + on-dark variants for cobalt CTA panels.

## Composite components (Batches 2–3)

Most consume one or more primitives.

- **Hero** — `Hero/Hero.jsx`. Two-column landing hero. Composes Eyebrow + Button.
- **StatsStrip** — `StatsStrip/StatsStrip.jsx`. Four-up cobalt-50 stats band.
- **CtaBanner** — `CtaBanner/CtaBanner.jsx`. Cobalt CTA panel. Composes ConductionBg + on-dark Button.
- **PlatformOverview** — `PlatformOverview/PlatformOverview.jsx`. Section-head + diagram wrapper.
- **PlatformDiagram** — `PlatformDiagram/PlatformDiagram.jsx`. Typed wrapper around the bespoke `<platform-diagram>` web component. Pass workspace + lists + flows as data.
- **AppsPreview / AppCard** — `AppsPreview/AppsPreview.jsx`. Static 3-up apps grid. Composes SectionHead + HexBullet.
- **AppsGrid** — `AppsGrid/AppsGrid.jsx`. Filterable apps catalogue with category chips. Reuses AppCard.
- **SolutionCard / SolutionGrid** — `SolutionCard/SolutionCard.jsx`. Sector-tinted solution cards. Composes Pill.
- **PartnerCard / PartnerGrid / BecomePartner** — `PartnerCard/PartnerCard.jsx`. Three tiers (partner, certified, strategic).
- **ReferenceCard / ReferenceGrid** — `ReferenceCard/ReferenceCard.jsx`. Customer-reference cards on partner-detail pages.
- **PairCard / PairRow** — `PairCard/PairCard.jsx`. Compact "related item" cards on app- and solution-detail pages.
- **EmployeeCard / TeamGrid** — `EmployeeCard/EmployeeCard.jsx`. Three variants (compact, photo, detail) for the /about team grid.
- **FeatureList / FeatureItem** — `FeatureList/FeatureList.jsx`. Single-column USPs with hex glyphs.
- **FeatureGrid / FeatureGridItem / FeatureGridGroup** — `FeatureGrid/FeatureGrid.jsx`. Compact spec list with hover-tooltip and stable/beta/soon status hexes.
- **HowSteps / HowStep** — `HowSteps/HowSteps.jsx`. Numbered process-step row.
- **Pipeline / PipelineStep** — `Pipeline/Pipeline.jsx`. Horizontal hex-numbered pipeline with chevron flow lines and optional source/consumer end-boxes.
- **DetailHero** — `DetailHero/DetailHero.jsx`. Shared 1fr/360px hero pattern between app/solution/partner detail pages.
- **FacetedFilters / FilterChip** — `FacetedFilters/FacetedFilters.jsx`. Sidebar facet checkbox panel + active-chip strip.
- **ConductionBg** — `ConductionBg/ConductionBg.jsx`. Parallax honeycomb background. Real component with self-contained runtime hook.
- **HexRain** — `HexRain/HexRain.jsx`. The "twelve apps" mini-game in the hero column. Lazy-loads the runtime via Head.
- **GameModal** — `GameModal/GameModal.jsx`. End-of-game dialog with cross-game progress tracking. Subscribes to `connext:gameend` events.
- **CookieCli** — `CookieCli/CookieCli.jsx`. Terminal-styled cookie consent banner with localStorage persistence.

## Site chrome (theme swizzles)

- **Navbar** — `theme/Navbar/index.jsx`. Replaces Docusaurus's default Infima navbar. Items come from `themeConfig.navbar`.
- **Footer canal scene** — `theme/Footer/index.jsx`. Full canal scene (Amsterdam trapgevel skyline, kade with bikes/cars, cobalt canal with orange boats, brand block + link grid riding on the water). Templates injected via `dangerouslySetInnerHTML` so the runtime can `.content`-clone them.

## Open gaps

All the major patterns from the kit now have React equivalents. Remaining
gaps are all "polish" rather than "missing":

- **Locale switcher integration on the kit's static landing.html** — the top-navbar.html now ships an NL/EN switcher (querystring driven), but the kit's individual pages don't yet have a translation dictionary so the switch is cosmetic on those pages. The connext site already has full Docusaurus i18n; the kit is one round of NL copy away from full parity.
- **PartnerCard.OtherCard variant** — the kit's partner-cards.css has a small `.other-card` (mini-avatar + name + why) used at the bottom of partner-detail. Today the connext partner-detail uses PairCard for that slot, which is close but not identical. Worth folding into PartnerCard as `variant="other"` if the page ever needs the smaller, denser footprint.
- **Diagram set web components** — `<cn-hex>`, `<cn-hex-prism>`, `<cn-platform>`, `<cn-domain-tree>`. These are framework-agnostic web components, not preset React components, but a thin React wrapper for each (similar to PlatformDiagram) would make them easier to use from MDX.
- **Brand citation utilities** — the `<span className="next-blue">` brand-citation pattern is global CSS in `brand.css`. A `<NextBlue>` / `<CgYellow>` / `<KnvbOrange>` component triplet would type-check the citation usage against the brand and let consumers compose them without remembering the global class name.
