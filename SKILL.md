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

- **Flat-isometric hex-prism style** for all illustrations (reference: honeycomb.io platform diagrams).
- No people, no faces, no characters.
- No stock photos, no 3D renders, no gradient backgrounds (except Nextcloud's official cyan-blue gradient on the workspace hex).
- Lucide icons (line, stroke 2, 24px) for UI iconography.
- App glyphs go inside the pointy-top hex wrapper; cobalt or white, never orange.

## When in doubt

The README is the source of truth. The preview cards show every rule applied. The website UI kit shows real pages built from the kit. Read them. Don't guess.
