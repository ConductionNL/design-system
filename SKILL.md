# SKILL — Conduction Design System

This is the Conduction Design System (`theme-conduction-2026`). Use it for any new artifact that needs to *look like Conduction*: marketing pages on `connext.conduction.nl`, app UIs on Nextcloud, docs on `docs.conduction.nl`, presentations, offers, print materials.

## Before you do anything

1. **Read [`README.md`](./README.md).** All the rules — voice, brand triad, visual proportion, hex motif system — live there. Don't shortcut this.
2. **Browse [`preview/index.html`](./preview/index.html)** to see the system in context: type ramp, color, spacing, components, brand.
3. **Look at [`preview/components/`](./preview/components/), [`preview/pages/`](./preview/pages/), and [`preview/identity/`](./preview/identity/)** before you build something new. There's already a hero, platform overview, pipeline-flow, stats strip, partner cards, employee cards, apps catalogue, apps grid, and solution page you can lift from. The verbal brand (values, audience, products, voice, visual rationale) lives under identity. Galleries: [`preview/components.html`](./preview/components.html), [`preview/pages.html`](./preview/pages.html), [`preview/identity/index.html`](./preview/identity/index.html).

## How to use the tokens

Drop one line into your HTML:

```html
<link rel="stylesheet" href="path/to/tokens.css">
```

You now have:

- All Conduction colors as `--c-*` (primitives) and `--conduction-color-*` (semantic).
- Figtree + IBM Plex Mono auto-loaded from Google Fonts (OFL).
- A 12-step spacing scale (`--space-1` through `--space-24`).
- Five radii, three cobalt-tinted shadows.
- The pointy-top hex clip-path: `var(--hex-pointy-top)`.

For Style Dictionary / Tokens Studio / Figma plugins, use [`brand/tokens.json`](./brand/tokens.json) — same tokens in W3C DTCG format.

## The five rules you must not break

1. **Cobalt is the primary fill.** `#21468B`. Not navy, not Inter-blue, not "tech blue".
2. **One orange accent per screen.** `#F36C21`. Never as a primary button fill. Capped at ~8% of any surface.
3. **Pointy-top hexes only.** No flat-top variants anywhere in the brand.
4. **Functional containers stay rectangular.** Buttons, inputs, cards, modals, tables. Hexagons *indicate* (status, order, category) — they don't *contain* interaction.
5. **The "Next" in ConNext is always Nextcloud-blue** (`#0082C9`). So is the brand-word "Nextcloud" in copy. Never on functional "next" (next page, next year).

## Voice — product-first, MKB-direct

- "Je", not "u". Concrete outcomes, not abstract ambition.
- Primary CTA on every product page: **"Install from Nextcloud app store."** Never "Get started", "Sign up", "Start trial".
- "App" = software we ship (OpenCatalogi, OpenRegister). "Solution" = what a customer achieves (WOO compliance). Don't conflate.
- Banned phrases: *digitale transformatie*, *ketensamenwerking*, *waardevolle inzichten*, *samen werken we aan*.

## Brand triad — who shows up where

| Brand | Mark | Where |
|---|---|---|
| **Conduction** | Hex avatar | About, Footer, Contracts, GitHub org |
| **ConNext** | Wordmark only | `connext.conduction.nl`, marketing |
| **Nextcloud** | Cited, not claimed | Brand citation in copy, workspace hex on diagrams |

## Imagery

- **Flat pointy-top hex style** for all illustrations. No rotation, no isometric depth, no 3D prisms (the prism mechanism was removed in v3.0.0).
- No people, no faces, no characters.
- No stock photos, no 3D renders, no gradient backgrounds. Solid fills only, no exceptions.
- Lucide icons (line, stroke 2, 24px) for UI iconography.
- App glyphs go inside the pointy-top hex wrapper; cobalt or white, never orange.

## Hex families — what each colour means

The locked policy lives in [`tokens.css`](./tokens.css) (2026-04, updated 2026-05). Every hex in a diagram, every category chip in a thumbnail, every pastel surface picks from this list. **Don't reach for a colour because it looks nice — pick it because the thing it represents has that meaning.** Repeat-matching across a scene is fine; mis-categorising is what breaks the system. The canonical reference is [`preview/colors.html`](./preview/colors.html); this table is the short version.

| Family | Token | Means | Use for |
|---|---|---|---|
| **Cobalt** | `--c-blue-cobalt` | Brand chrome, the workspace itself | The workspace hex (Nextcloud), brand hexes, primary fills. Not a category. |
| **Workspace blue** | `--c-workspace-500` (= `--c-nextcloud-blue`) | Nextcloud as platform | The single workspace hex in any platform diagram. Always solid `#0082C9`, never a gradient. |
| **Lavender** | `--c-lavender-500` | Process / workflow | Integriq, Dossiq, ZaakAfhandelApp, anything orchestration-flavoured |
| **Mint** | `--c-mint-500` | Integrate / connect | Integration adapters, "stable" status pill, anything that signals *connected and OK* |
| **Forest** | `--c-forest-500` | Data / trustworthy / NLDS-compliant | OpenRegister-flavoured hexes, register thumbnails, compliance-strong surfaces |
| **Terracotta** | `--c-terracotta-500` | Documents / human work | Filinq-flavoured hexes, document thumbnails, human-craft surfaces |
| **Coral / KNVB orange** | `--c-orange-knvb` | Single-use accent (focus, hover, the *one* highlight per scene) | Capped at ~8% of any surface. Never as a primary fill. Never as a hex family. |
| **Gold** | `--c-gold-500` | "Conduction Certified" trustmark | Reserved. Don't use for generic UI. |
| **Gray** | `--c-gray-500` | Neutral surfaces, side-box chrome | Strokes, dividers, side-box bodies. Not a category. |

Banned as hex families: **coral, gold, gray, red-vermillion**. They have specific jobs and using them as a category breaks recognisability everywhere else.

## Hex composition

Pulled from [`preview/diagrams/`](./preview/diagrams/) usage. The web components (`<cn-hex>`, `<cn-platform>`, `<cn-pipeline>`, `<cn-side-box>`, `<cn-honeycomb-bg>`, `<cn-domain-tree>`) handle the geometry; you pick the families and the count.

- **Hexes = installable apps. Side-boxes = everything else.** A hex is a Conduction app (OpenRegister, Filinq). A side-box is a source, sink, integration, or external system. The shape is the hierarchy — hexes are the *thing*, side-boxes are *around the thing*.
- **One workspace hex per scene, max.** Cobalt is the workspace; if the scene shows multiple Nextcloud installs, federate them through side-boxes, don't duplicate the cobalt hex.
- **One orange element per scene.** Same as Imagery rule. The orange is *the answer* of the scene — the active step, the new feature, the thing the eye should land on.
- **Family count: 3–4 per scene.** A pipeline diagram with cobalt + lavender + mint + a coral accent is the canonical density. More than four families and the categories stop reading.
- **Sources go left, consumers go right.** Side-boxes flanking a hex row are conventionally `source · hex · hex · hex · consumer`. Don't reverse without reason.
- **Sizes**: `sm` for inline-density rows, `md` for canonical scenes, `lg` for hero illustrations. One size per scene.
- **Shadows are 2D, never 3D.** `var(--shadow-2)` for lifted hexes, `var(--shadow-1)` for ambient. No drop-shadow blur > 16px, no "depth" rendering.

## App glyphs

The glyph is the app's real icon: its `img/app.svg` on the `development` branch. Use the same glyph everywhere the app appears.

- **Files.** Single-colour copies live in [`brand/assets/apps/glyphs/<id>.svg`](./brand/assets/apps/glyphs/), one per current app id, with `fill="currentColor"` on the root. Portaliq is the one exception. Its file is the store icon, because its `img/app.svg` is still the template placeholder.
- **Preview.** [`preview/apps.html`](./preview/apps.html) shows all 21 apps in every treatment, as `g-<id>` symbols copied from those files.
- **Code.** `docusaurus-preset/src/data/app-glyphs.json` feeds the `AppGlyph` component. It is generated by [`scripts/build-app-glyphs.mjs`](./scripts/build-app-glyphs.mjs), which also keeps the old app ids as aliases. Run it after any change to a glyph file.
- **Never hand-draw a glyph.** When an app's icon changes, copy its new `img/app.svg` into the glyphs folder as a single-colour file. Set `fill="currentColor"` on the root, then remove the XML prolog, comments and `<g>` wrappers (the raw files use `fill="#fff"`, and the script refuses them). Update its symbol in `apps.html`, then run the script.
- **Legacy keys.** Four keys in the JSON have no glyph file and are carried over from the existing JSON: `openanonymiser` (the ExApp, still used by the website), `deskdesk`, `financeq` and `purchaseq` (archived). Do not delete the JSON before running the script, or they are lost.

## Status palette

For "stable / beta / preview" pills inside an app card, app-store row, or AppMock chrome. Defined by usage in [`preview/components.html`](./preview/components.html):

| Status | Hex token | When |
|---|---|---|
| **Stable** | `--c-mint-500` | App is shipped, in production, supported |
| **Beta** | `--c-orange-knvb` | Public, working, API may move (counts as the page's one orange element) |
| **Preview** | `--c-gold-300` | Behind a feature flag or partner-only |
| **Experimental** | `--c-cobalt-300` | Internal, may disappear without notice |
| **Deprecated** | `--c-red-vermillion` | On the way out, do not adopt |

Render as `<span class="hex-badge"><span class="h" style="background: …"></span>Stable</span>`.

## Thumbnails

Hub tiles in [`preview/index.html`](./preview/index.html), [`preview/print/index.html`](./preview/print/index.html), [`preview/identity/index.html`](./preview/identity/index.html), [`preview/decks/index.html`](./preview/decks/index.html) all carry a small `.tile .visual` block that hints at the section's contents. **No screenshots, no images. Build the hint from token-styled `<div>`s and `<span>`s.** A tile that links to "Print" gets a tiny rotated card + page + slide. A tile that links to "Diagrams" gets a graduated row of hex shapes. A tile that links to "Type" gets a big "Aa" + a weight ramp. The pattern reads in 200ms, ages without rework, and updates the moment a token changes.

### The four archetypes

Almost every thumbnail in the kit is one of these. Pick by what the section *is*, not by what looks busy.

| Archetype | When to use | Example |
|---|---|---|
| **Token specimen** | Section is *about* a token family (type, colour, spacing, radii). Drop the tokens themselves at glanceable size. | Type tile (big "Aa" + weight row), Colors tile (`.swatch-row`), Spacing tile (5 cobalt squares of growing size + radius). |
| **Shrunk artefact** | Section ships a real component or asset. Render the actual component at thumbnail scale. | Components tile (real `<button>` + status pill), Brand tile (real avatar SVG + wordmark). |
| **Hex-glyph row** | Section is a list of items. Use 3–7 pointy-top hexes in token colours, optionally with a Lucide glyph inside. | Apps (5 app-hexes with icons), Downloads (7 coloured hexes wrapping), Diagrams (graduated 40→72→40px hex pyramid). |
| **Abstract paper** | Section ships paper / page / deck artefacts. Build a tiny mock from divs styled as cards, pages, slides. | Print tile (`.mock-card` + `.mock-paper` + `.mock-slide`), Pages tile (two mini wireframes), Chassis tile (card / hub / chrome wireframes). |

### Constraints — apply to every thumbnail

- **Height ladder.** `80px` default (`.tile .visual`), `100px` when shapes need air, `110px` when something rotates or extends down. Set on the `.visual` inline; don't invent values in between.
- **Gap ladder.** `var(--space-2)` for tight rows (default), `var(--space-3)` for chunkier compositions, `var(--space-4)` for wireframes that need to breathe. Mirror what the existing tiles use.
- **One orange element max.** KNVB orange (`var(--c-orange-knvb)`) draws the eye exactly once per thumbnail. A foot-rule on a paper, the highlighted slide-page-pill, the active hex in a row. Never two.
- **Tokens only.** Every colour is `var(--c-*)`, every radius `var(--radius-*)`, every shadow `var(--shadow-*)`, every hex `var(--hex-pointy-top)`. No raw hex codes, no `rgba()` (except where transparency-on-cobalt is the design — see `.mock-slide` ms-d hex dots).
- **No SVG except for icon/logo content.** Lucide-style icons inside an app hex are fine. Decorative shapes are `<div>`/`<span>` with `clip-path` or `border-radius`.
- **Trailing meta label.** When a thumbnail benefits from a verbal hint (`13 artefacts · 13 deck layouts`, `2 layouts`, `card · hub · chrome`), append a `.thumb-meta` span at the end of `.visual`. Never use it as the *only* visual element.
- **Rotation, sparingly.** A `transform: rotate(-3deg)` on a card adds life without breaking the grid. One rotated element per tile, max.

### Available classes — reach for these before inventing

All defined in [`preview/preview.css`](./preview/preview.css) under "Thumbnails". Use them directly inside `.tile .visual`.

| Class | Renders | Sub-elements |
|---|---|---|
| `.thumb-meta` | code-style 11px caption, cobalt-400, auto-aligned to centre right | — |
| `.swatch-row` | full-width row of equal-flex colour swatches | child `<div>`s with `background: var(--c-...)` |
| `.type-stack` | vertical type specimen | `<span>`s with explicit `font-size` / `font-weight` |
| `.hex-row` | horizontal row of pointy-top hexes | `.h` children sized 36×42 |
| `.mock-card` | 92×56 cobalt business card with shadow + slight bottom alignment | `.mc-name`, `.mc-role`, `.mc-qr` |
| `.mock-paper` | 56×76 white A4 mini-page with top-bar + line stack + orange foot | `.mp-h` (header bar), `.mp-l` (text line), `.mp-foot` (orange accent) |
| `.mock-env` | 100×60 envelope with triangular flap (CSS pseudo) | — |
| `.mock-banner` | 32×76 vertical banner with white hex on cobalt | direct `<span>` for hex |
| `.mock-slide` | 100×56 16:9 cobalt-900 slide with title + hex pagination dots | `.ms-t` (title), `.ms-d` + `<span>`s (page dots, first one orange) |
| `.mock-sig` | full-width email signature with hex avatar + 3-line text | `.ms-av`, `.ms-text` + `.l1` / `.l2` / `.l3` |

For one-off shapes that don't fit any class, inline-style with tokens. **If you find yourself writing the same shape twice across two tiles, lift it into [`preview.css`](./preview/preview.css) and document it here.** Future Claude sessions read this table first; if the recipe isn't here, they'll guess differently.

### Recipe — adding a new thumbnail

1. **Pick the archetype** from the table above. Don't blend two.
2. **Set `.visual` height** explicitly: `style="height: 80px"` (default), `100px`, or `110px`. Match a sibling tile.
3. **Compose** with `.mock-*` / `.swatch-row` / `.type-stack` / `.hex-row` first. Inline-style only what's not in the vocabulary.
4. **Audit the orange.** Count `var(--c-orange-knvb)` references in the thumbnail. Cap at one.
5. **Add a `.thumb-meta`** if a verbal hint helps (count, format list, version). Skip if the shapes carry the meaning.
6. **Cross-check** against an existing tile in the same hub before committing — if your new thumbnail looks heavier or lighter than its neighbours, it'll read as broken.

## Films

Motion films (social reels, product explainers) are built in code, frame by frame, and live in [`preview/films/<slug>/`](./preview/films/), published at `identity.conduction.nl/films/<slug>/`. The engine is [`preview/films/_lib/`](./preview/films/_lib/); the capture, scoring and storyboard tools are in [`scripts/films/`](./scripts/films/).

Follow the [`brand-film`](./.claude/skills/brand-film/SKILL.md) skill for every film: context pack, three storyboard variants presented as an artifact with one still per scene, the user's pick, the build, director notes, review, score and render. Each film keeps a `sources.json` ledger of every asset, claim, reference and decision.

The brand rules apply to motion without exception: solid fills, pointy-top hexes that never rotate, one orange per scene, real app glyphs and marks only. The engine has no rotation and no gradient helper on purpose.

## When in doubt

The README is the source of truth. The preview cards show every rule applied. The website UI kit shows real pages built from the kit. Read them. Don't guess.
