# Component coverage map

Tracks which `preview/components/*.html` patterns ship as React components
in `@conduction/docusaurus-preset`. The file started as a gap list during
the connext landing port; it now reads as a coverage map. Anything still
missing lives in **Open gaps** at the bottom.

## Atomic primitives (Batch 1)

Every higher-level component composes from these. Each one was extracted
when its CSS rule appeared in three or more component files.

- **HexBullet** — `primitives/HexBullet.jsx`. Three sizes (sm 8×9, md 12×14, lg 44×50) of the pointy-top clip-path hex. Used in eyebrows, pill bullets, status badges, footer triad.
- **HexThumbnail** — `primitives/HexThumbnail.jsx`. Single pointy-top hex tile holding an icon, photo (clip-path masked), or illustration. Four sizes (sm 56×64, md 88×100, lg 160×184, xl 240×280), six tones. Used by every academy card and hero.
- **AuthorByline** — `primitives/AuthorByline.jsx`. Avatar (initials or photo) + name + bullet separator + formatted date. Three tones (default, on-dark, muted). Used on every academy card and detail page.
- **Eyebrow** — `primitives/Eyebrow.jsx`. Uppercase Plex Mono caption with optional leading HexBullet.
- **Section** — `primitives/Section.jsx`. The 1280px-max wrapper. Background variants (default, tinted, inverse), spacing variants (default, tight, flush).
- **SectionHead** — `primitives/SectionHead.jsx`. Eyebrow + h2 + lede in a 1.1fr/1fr split, stacked under 900px.
- **Card** — `primitives/Card.jsx`. White / cobalt-100 / radius-lg. Tones: surface (default), ghost (dashed), inverse (cobalt-900).
- **Pill** — `primitives/Pill.jsx`. Mono-caps chip with optional bullet. Status badges, app tags, sector labels.
- **Button** — `primitives/Button.jsx`. Primary / secondary / ghost + on-dark variants for cobalt CTA panels.
- **NextBlue / CgYellow / KnvbOrange** — `primitives/BrandCitation.jsx`. Type-checked wrappers around the global `next-blue` / `cg-yellow` / `knvb-orange` CSS classes. Replaces ad-hoc `<span className="next-blue">Nextcloud</span>` with `<NextBlue>Nextcloud</NextBlue>`.

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
- **PartnerCard / PartnerGrid / BecomePartner** — `PartnerCard/PartnerCard.jsx`. Three tiers (partner, certified, strategic). Plus `variant="other"` for the compact mini-avatar card used on partner-detail pages.
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
- **ComposeBlock** — `ComposeBlock/ComposeBlock.jsx`. Branded code block (cobalt-900 + Plex Mono + filename pill + copy button). For docker-compose, bash recipes, and any verbatim copy-paste content. Used on `/demo`.

## Academy components (Batch 4)

Card-and-chrome patterns for academy.conduction.nl. One feed of blogs,
guides, case studies, webinars, and tutorials, distinguished by a
`contentType:` frontmatter. Mirrors `preview/components/academy.html`.

- **ContentCard / ContentCardGrid** — `ContentCard/ContentCard.jsx`. The "Keep learning…" card: hex-thumb panel on the left, author byline + title + summary + tag pills on the right. Three column counts, drops to single-column under 700px. Composes HexThumbnail, AuthorByline, Pill.
- **FeaturedCard** — `FeaturedCard/FeaturedCard.jsx`. Cobalt-900 hero spot with body copy left and a large pointy-top hex flanked by two satellite hexes right. The single KNVB orange satellite is the page's one orange accent (override with `accent="cobalt"` if a screen already burns its orange budget).
- **ContentTypeFilter** — `ContentTypeFilter/ContentTypeFilter.jsx`. Top-of-page chip row driven by `?type=`. Controlled mode (`value` + `onChange`) or uncontrolled link mode (`hrefForType`). The taxonomy lives in `ContentTypeFilter/contentTypes.js` so chips, card pills, and detail-hero pills all draw from one list.
- **NewsletterCta** — `NewsletterCta/NewsletterCta.jsx`. Cobalt-50 (or inverse cobalt-900) panel with title, lede, email input, submit, fineprint. Form is unwired by default; pass `action` or `onSubmit` to connect it.
- **RelatedPosts** — `RelatedPosts/RelatedPosts.jsx`. Bottom-of-detail-page block with a "Keep learning…" heading, a "View all" pill on the right, and a content-card grid below. Accepts `items` for data-driven render or children for hand-composed.
- **ContentDetailHero** — `ContentDetailHero/ContentDetailHero.jsx`. Header for individual posts. Crumb, content-type chip + tags, h1, summary, author byline, optional duration, then a 16:9 cover region. Distinct from `<DetailHero/>` which is for app/solution/partner pages with a 360px right-side hex.

## Diagram-set web-component wrappers

Thin React wrappers around the framework-agnostic web components in `@conduction/diagrams`. Lazy-import the runtime, type-checked observed-attribute props, slot-based children pass through.

- **Hex** wraps `<cn-hex>` (color, size, variant, layout, interactive)
- **HexPrism** wraps `<cn-hex-prism>` (family, size, state)
- **Platform** wraps `<cn-platform>` (ground)
- **DomainTree** wraps `<cn-domain-tree>`
- **DiagramPipeline** wraps `<cn-pipeline>` (renamed from Pipeline to avoid the components/Pipeline name collision)
- **SideBox** wraps `<cn-side-box>`
- **HoneycombBg** wraps `<cn-honeycomb-bg>`

## Theme swizzles

- **Navbar** — `theme/Navbar/index.jsx`. Replaces Docusaurus's default Infima navbar. Items come from `themeConfig.navbar`.
- **Footer canal scene** — `theme/Footer/index.jsx`. Full canal scene (Amsterdam trapgevel skyline, kade with bikes/cars, cobalt canal with orange boats, brand block + link grid riding on the water). Templates injected via `dangerouslySetInnerHTML` so the runtime can `.content`-clone them.
- **MDXPage** — `theme/MDXPage/index.jsx`. Drops the Docusaurus default `col col--8 col--offset-2` wrapper for pages with `hide_table_of_contents: true`, so marketing surfaces render full-width. Adds the `marketing-page` class on `<main>` so `brand.css` can zero-out stray top margins (no gap between navbar and hero).

## Open gaps

All the major patterns from the kit now have React equivalents. Remaining
gaps are all "polish" rather than "missing":

- **Locale switcher integration on the kit's static landing.html** — the top-navbar.html now ships an NL/EN switcher (querystring driven), but the kit's individual pages don't yet have a translation dictionary so the switch is cosmetic on those pages. The connext site already has full Docusaurus i18n; the kit is one round of NL copy away from full parity.
- **PartnerCard.OtherCard variant** — the kit's partner-cards.css has a small `.other-card` (mini-avatar + name + why) used at the bottom of partner-detail. Today the connext partner-detail uses PairCard for that slot, which is close but not identical. Worth folding into PartnerCard as `variant="other"` if the page ever needs the smaller, denser footprint.
- **Diagram set web components** — `<cn-hex>`, `<cn-hex-prism>`, `<cn-platform>`, `<cn-domain-tree>`. These are framework-agnostic web components, not preset React components, but a thin React wrapper for each (similar to PlatformDiagram) would make them easier to use from MDX.
- **Brand citation utilities** — the `<span className="next-blue">` brand-citation pattern is global CSS in `brand.css`. A `<NextBlue>` / `<CgYellow>` / `<KnvbOrange>` component triplet would type-check the citation usage against the brand and let consumers compose them without remembering the global class name.
