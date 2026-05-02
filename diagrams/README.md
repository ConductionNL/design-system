# @conduction/diagrams

Brand-strict diagram primitives for Conduction and ConNext, as framework-agnostic web components.

## Status

Pre-release, scaffolded inside the `design-system` repo. The future home is tracked in [design-system#2](https://github.com/ConductionNL/design-system/issues/2).

## Why

Every Conduction diagram follows the same brand rules: pointy-top hexes, fixed palette, one orange accent per scene, no gradients on shapes. Third-party diagram libraries (Mermaid, D3-based, drawio, etc.) all force compromises against those rules. We render shapes ourselves with inline SVG inside web components, so every diagram on every surface looks the same.

## Stack

- **Vanilla `customElements`** for component registration. No framework, no build step required.
- **Inline SVG + `clip-path`** for all shapes. No third-party shape library.
- **CSS + Web Animations API** for animation. Motion One (MIT, ~3kb) added when we orchestrate sequences.
- **Lit** added when reactive-prop complexity demands it (probably at `cn-platform`).

## Components

| Component | Status | Purpose |
| --- | --- | --- |
| `<cn-hex>` | Available | Pointy-top hex primitive. Supports label + icon, sizes, colour variants, interactive state. |
| `<cn-hex-prism>` | Planned | 3D isometric prism. The atomic unit for ConNext platform diagrams. |
| `<cn-platform>` | Planned | Nextcloud kernel + orbiting app hexes. |
| `<cn-pipeline>` | Planned | Horizontal flow with arrows between prisms. |
| `<cn-side-box>` | Planned | Rectangle-feed-prism pattern; one shape inside, another outside. |
| `<cn-honeycomb-bg>` | Planned | Parallax honeycomb backdrop. |
| `<cn-domain-tree>` | Planned | Domain / subdomain map for the identity pages. |

## Usage

No build step needed. Drop the module into any HTML page:

```html
<script type="module" src="../diagrams/src/index.js"></script>

<cn-hex color="cobalt" size="lg">Connect</cn-hex>

<cn-hex color="orange" size="lg" interactive>
  <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 7l9-4 9 4-9 4-9-4z"/>
    <path d="M3 12l9 4 9-4"/>
  </svg>
  Catalog
</cn-hex>
```

## `<cn-hex>` API

| Slot | Purpose |
| --- | --- |
| default | Label text. Optional. |
| `icon` | Icon SVG or `<img>`. Optional. Sits above the label by default; left of it with `layout="horizontal"`. |

| Attribute | Values | Default | Purpose |
| --- | --- | --- | --- |
| `color` | `cobalt`, `orange`, `mint`, `lavender`, `terracotta`, `forest`, `nextcloud`, `red` | `cobalt` | Brand colour. |
| `size` | `sm`, `md`, `lg`, `xl`, or any CSS length | `md` (64px) | Width of the hex. Height = width × 1.155. |
| `variant` | `solid`, `outline` | `solid` | Outline draws a stroke at the brand colour with a transparent body. |
| `layout` | `vertical`, `horizontal` | `vertical` | Icon-above-label vs icon-left-of-label. |
| `interactive` | boolean | absent | Adds hover scale, focus ring, click event, keyboard activation. |

## Brand rules

- Pointy-top only. No rotation. No flat-top hexes.
- Solid colours only. No gradients, no rgba on shapes.
- One orange accent per scene. KNVB orange for highlights, never primary fills.
- Backgrounds are hex polygons, never radial-gradient circles.

## Roadmap

See the planned components above. Built in this order: `cn-hex` ✅ → `cn-hex-prism` → `cn-domain-tree` (first real consumer on the new identity/domains.html page) → `cn-platform` → `cn-pipeline` → `cn-side-box` → `cn-honeycomb-bg`.
