# Conduction Design System, `theme-conduction-2026`

The design system for **Conduction**, a Dutch open-source product company that builds an ecosystem of cooperating Nextcloud apps. **ConNext** is Conduction's public product brand for the platform.

> *"ConNext is a Conduction proposition for Nextcloud."*

This kit documents how Conduction looks, sounds, and behaves on every surface, website, app UIs, presentations, print. Use it as the source of truth for any new artifact.

---

## TL;DR, what makes this brand different

- **Cobalt-first**, not navy. The Dutch flag's official blue (`#21468B`), heavier than legacy SaaS blues, lighter than bank navy. Fills 20% of any surface.
- **KNVB orange as accent** (`#F36C21`), capped at ~8%. Warm Dutch identity *without* the Rijkshuisstijl government feel. One orange accent per screen, never a primary fill.
- **Hexagon as a system, not just a logo wrapper.** Bullets, pagination, status badges, avatars, dividers, timeline beads, anywhere a shape *means* something. Functional containers (inputs, buttons, cards) stay rectangular.
- **Always pointy-top.** No flat-top hexes anywhere in the brand.
- **Figtree + IBM Plex Mono.** Round, calm, humanist. No serif display, no ligatures.
- **Nextcloud blue is a guest color**, only in ConNext context (the wordmark, the workspace hex, brand-citation in copy).
- **Product-first tone.** MKB-direct ("je", concrete outcomes), not government-formal ("u", abstract ambition).

---

## When you use this kit

The kit is the visual spine for:

- **`connext.conduction.nl`**, the ConNext public product site (primary surface)
- **App UIs** built on Nextcloud (OpenRegister, OpenCatalogi, OpenConnector, DocuDesk, MyDash, etc.)
- **`docs.conduction.nl`**, technical documentation
- **Presentations, offers, print**, the same palette, type, and hex motif apply

Three brands are visible across these surfaces, each with a defined role:

| Brand | Role | Mark |
|---|---|---|
| **Conduction** | The Dutch OSS product company building everything. Always visible on About, footer, contracts. | Hexagon avatar |
| **ConNext** | Public product brand for the Nextcloud-app ecosystem. Primary on `connext.conduction.nl`. | Wordmark only |
| **Nextcloud** | Host platform. Cited (not claimed), its blue + name appear in ConNext context. |, |

---

## Browse the system

| Section | What's in it |
|---|---|
| [`tokens.css`](./tokens.css) | All design tokens (color, type, spacing, radii, shadows, hex clip-paths) as CSS custom properties. Drop-in. |
| [`brand/tokens.json`](./brand/tokens.json) | Same tokens in W3C DTCG format, for Style Dictionary, Tokens Studio, Figma plugins. |
| [`brand/assets/`](./brand/assets) | Conduction hexagon avatar (3 variants: cobalt-on-white, white-on-cobalt, transparent). |
| [`preview/`](./preview) | Visual cards showing every token in context, type ramp, color, spacing, components, brand. **Start here:** [`preview/index.html`](./preview/index.html). |
| [`preview/components/`](./preview/components) | Section-level building blocks (hero, platform overview, apps grid, pipeline flow, stats strip). Gallery: [`preview/components.html`](./preview/components.html). |
| [`preview/pages/`](./preview/pages) | Full-page layouts composed from components (apps catalogue, apps grid, solution page). Gallery: [`preview/pages.html`](./preview/pages.html). |
| [`preview/identity/`](./preview/identity) | Verbal brand foundation, values, audience, products, voice, visual rationale. Gallery: [`preview/identity/index.html`](./preview/identity/index.html). |

---

## Content fundamentals

### Voice, product-first, MKB-direct

We shifted from *consultancy* to *product company*, and from *government-first* to *MKB-first*. The voice follows.

| Avoid | Prefer |
|---|---|
| Formal "u", third-person | Direct "je", "jij" |
| Abstract ambition ("digital transformation") | Concrete outcome ("install OpenCatalogi in 2 minutes") |
| Process-centric ("our implementation methodology") | Result-centric ("this app solves this problem") |
| Service-provider language | Self-aware product language ("we built X, and it works") |
| Jargon as competence-signal | Jargon only when truly necessary, with explanation |
| Long, complete sentences | Short sentences, white space, scannable |

**Banned phrases** (untranslatable Dutch consultancy clichés): *digitale transformatie*, *ketensamenwerking*, *waardevolle inzichten*, *samen werken we aan*. If you write one, delete the sentence and rewrite as a concrete result.

### Apps vs Solutions, terminology

This distinction holds across all communication:

- **App** = software we build and ship. Concrete, installable. *OpenCatalogi*, *OpenRegister*, *DocuDesk*.
- **Solution** = what a customer achieves with one or more apps. *WOO compliance*, *zaakafhandeling*, *softwarecatalog*.

Never write "our WOO app", there isn't one. Write "our WOO solution, built on OpenCatalogi and OpenConnector."

### CTA hierarchy, download-pressure, not upgrade-pressure

The primary CTA on every product page is **"Install from Nextcloud app store."** Always. Never "Get started", "Sign up", "Start trial". No urgency tactics, no exit-intent popups, no upgrade nags. All apps are free; Support is optional and lives outside the marketing site.

| Rank | CTA |
|---|---|
| 1 | Install from Nextcloud app store |
| 2 | Try the demo |
| 3 | Read the docs |
| 4 | View on GitHub |
| 5 | View Support tiers & pricing |
| 6 | Contact us *(footer only)* |

---

## Visual foundations

### Color proportion (the 70/20/8/2 rule)

| Share | Color | Use |
|---|---|---|
| **70%** | White `#FFFFFF` | Background, breathing room |
| **20%** | Cobalt `#21468B` | Brand, structure, body text, primary CTAs |
| **8%**  | KNVB orange `#F36C21` | Accents, focus rings, hover, one badge per screen |
| **2%**  | Vermillion `#AE1C28` | Errors, destructive only |

**Plus** Nextcloud blue `#0082C9` (~5% in ConNext context only): the *Next* in the wordmark, brand-citation of "Nextcloud" in copy, the workspace hex on platform diagrams.

Cobalt-on-white = **9.05:1 contrast (WCAG AAA)**, yes, you can use cobalt for body text.

### Hexagon as a system

The hexagon is not just the logo wrapper, it's a recurring shape that signs every Conduction surface.

| Use a hex for | Keep rectangular |
|---|---|
| List bullets | Inputs, textareas, selects |
| Pagination, step indicators | Buttons (with subtle radius) |
| Status badges (stable / beta / experimental) | Modals, dialogs, drawers |
| Category tags, filter chips | Content cards (the *content* gets the hex; the card stays rectangular) |
| Avatars (hex-clipped portraits) | Tables |
| Section dividers (line broken by a hex) | Code blocks |
| Timeline beads, ratings, empty-state icons | |

**Rule**: shapes that *indicate* (status, order, category) are hex. Shapes that *do* (typed in, clicked, read inside) are rectangular.

**Orientation**: always **pointy-top**. No flat-top variants anywhere.

### Typography

| Role | Font | Weights |
|---|---|---|
| Body + headings | **Figtree** | 400 / 500 / 600 / 700 |
| Code + monospace | **IBM Plex Mono** | 400 / 500 |

Both OFL-licensed via Google Fonts. Headings 600/700, body 400, line-height 1.5 for body and 1.2 for headings. No italics for emphasis, use weight or color. No second display font; Figtree 700 is enough.

Type ramp (px): `12 / 14 / 16 / 18 / 20 / 24 / 32 / 40 / 48`.

### Illustration style, flat-isometric hex-prism

All illustrations across all surfaces use the **flat-isometric hex-prism** style (reference: honeycomb.io platform diagrams). Hexagons extruded into prisms from a ~30° isometric angle, flat color faces (no gradients, no lighting), cobalt-dominant with KNVB-orange accents and pastel category colors. **No people, no faces, no characters.** White background, subtle 2D drop-shadow for depth.

For diagrams that need humans (About, testimonials), prefer text-only or abstract hex-figures, never stock-photo-style filled vector characters.

### What we never do visually

- ❌ Stock photos of "diverse team meeting", handshakes, whiteboards
- ❌ 3D renders, gradient backgrounds (except Nextcloud's official cyan-blue gradient, only on the workspace hex)
- ❌ Other shades of blue on the logo
- ❌ Orange as a primary button fill (cobalt owns that)
- ❌ Two orange accents on the same screen
- ❌ Flat-top hexagons
- ❌ Emoji as decoration in product UI
- ❌ Italics for emphasis
- ❌ "Get started", "Sign up", trial-urgency CTAs
- ❌ Inter, Roboto, Arial, Fraunces, system-font stacks (we have Figtree)

---

## Iconography

**Lucide** ([lucide.dev](https://lucide.dev)) is the standard icon library, ISC-licensed, line-style, broad peer adoption. Use stroke-width 2, 24px default size, `currentColor` for tinting. Icons are visual aids, not load-bearing, every icon-only button gets an `aria-label`.

For app icons specifically: each app gets its own glyph **inside the pointy-top hexagon wrapper** in `brand/assets/`. App glyph hex fill is **cobalt**, **cobalt-700**, **white-on-cobalt outline**, or **vermillion**. Never orange (orange is accent, not container). Never the Nextcloud cyan-blue gradient, that's a *guest color* reserved for the brand-word "Nextcloud" in copy and the workspace hex on platform diagrams, not for Conduction-built apps.

---

## Brand citation: "Next" in Nextcloud-blue

The `.next-blue { color: var(--conduction-color-brand-nextcloud); }` utility colors three (and only three) things:

1. The **"Next"** half of the **ConNext** wordmark, always.
2. The brand-word **"Nextcloud"** wherever it appears in copy.
3. Idiomatic **"next"** when it's directly about Nextcloud-as-platform (*"take Nextcloud to the [next] level"*).

**Do not** apply it to functional "next" (next page, next year, next step) or letter-strings inside other words (index, annexed). Brand citation must remain deliberate.

---

## Index of files

```
conduction-design-system/
├─ README.md                          ← this file
├─ tokens.css                         ← CSS custom properties (drop-in)
├─ brand/
│  ├─ tokens.json                     ← DTCG format (Style Dictionary, Tokens Studio)
│  └─ assets/
│     ├─ avatar-conduction.svg            ← cobalt, transparent bg
│     ├─ avatar-conduction-on-white.svg   ← cobalt on white (default)
│     └─ avatar-conduction-on-blue.svg    ← white on cobalt (inverse)
├─ preview/
│  ├─ index.html                      ← live overview of all design system cards
│  ├─ type.html                       ← Figtree + IBM Plex Mono ramp
│  ├─ colors.html                     ← palette swatches with usage rules
│  ├─ spacing.html                    ← spacing scale, radii, shadows, hex shapes
│  ├─ components.html                 ← buttons, badges, app cards, hex pagination + page-level components
│  ├─ brand.html                      ← logos, ConNext wordmark, brand citation
│  ├─ pages.html                      ← gallery of full-page layouts
│  ├─ components/                     ← page-level component HTML files
│  │  ├─ hero.html                        ← hero w/ hex-prism ecosystem cluster
│  │  ├─ platform-overview.html           ← platform-as-honeycomb visual
│  │  ├─ apps-grid.html                   ← filterable apps grid
│  │  ├─ pipeline-flow.html               ← horizontal hex-prism pipeline
│  │  └─ stats-strip.html                 ← four-up headline numbers band
│  ├─ pages/                          ← full-page HTML layouts
│  │  ├─ apps-catalog.html                ← filterable apps catalogue page
│  │  ├─ apps-grid.html                   ← compact apps grid alternative
│  │  └─ solution-page.html               ← long-form solution writeup w/ sticky aside + solution hex
│  └─ identity/                       ← verbal brand foundation
│     ├─ index.html                       ← identity gallery
│     ├─ foundation.html                  ← values, what we build, the triad
│     ├─ audience.html                    ← MKB / Gov / Dev tiers
│     ├─ products.html                    ← apps × solutions, taglines, architecture
│     ├─ voice.html                       ← registers, rewrite recipes, banned phrases
│     └─ system.html                      ← visual rationale (why cobalt / Figtree / hex)
└─ SKILL.md                           ← how to invoke this design system
```

---

## Local development

The site is plain static HTML, no build step, no runtime. To work on it locally with the same paths as production (`https://designsystem.conduction.nl/` redirects to `preview/`), serve the folder over a local HTTP server. Don't open files via `file://`, the root redirect and a couple of relative paths only behave correctly under HTTP.

**Recommended, VS Code Live Server.** Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (Ritwick Dey), then right-click [`index.html`](./index.html) → **"Open with Live Server"** (or click **"Go Live"** in the status bar). The browser opens at `http://127.0.0.1:5500/` and auto-reloads on every save.

**One-line alternatives if you don't use VS Code:**

```bash
python3 -m http.server 8000     # zero install on most Linux/macOS
npx serve -l 8000               # if you have Node
php -S localhost:8000           # if you have PHP
```

Then open `http://localhost:8000/`. Live reload only with VS Code's extension or `npx live-server`.

**Notes:**
- Google Fonts (Figtree + IBM Plex Mono) are CDN-loaded by [`tokens.css`](./tokens.css). Offline they fall back to system fonts.
- The site is published from `main` via GitHub Pages, push to `main` and changes go live within ~30 seconds.

---

## Provenance

Built from the canonical Conduction brand sources:

- [`BRAND.md`](https://github.com/ConductionNL/.github/blob/feature/brand-2026/BRAND.md), what & how
- [`DESIGN.md`](https://github.com/ConductionNL/.github/blob/feature/brand-2026/DESIGN.md), why (rationale, color comparison tables, font choices)
- [`brand/tokens.json`](https://github.com/ConductionNL/.github/blob/feature/brand-2026/brand/tokens.json), DTCG tokens
- [`briefs/website/visual-motifs.md`](https://github.com/ConductionNL/.github/blob/feature/brand-2026/briefs/website/visual-motifs.md), hex motif catalog, illustration style, per-section treatments

Theme version: `theme-conduction-2026` · Scope A (color + typography) · Spacing/radii/shadows proposed in this kit, not yet ratified upstream.
