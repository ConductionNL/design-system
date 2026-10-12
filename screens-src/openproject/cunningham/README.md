# OpenProject example theme for Cunningham

Cunningham is the token system behind La Suite (Docs, Messages, Meet). This folder holds an example theme that gives a Cunningham app the look of the OpenProject application.

It is an example, not an official OpenProject theme. The OpenProject name and logo belong to OpenProject GmbH.

## Files

- `openproject.ts`: the theme as a Cunningham config. Merge it into your `cunningham.ts`.
- `openproject.css`: the same values as CSS variables under `.cunningham-theme--openproject`, for a page that does not run the Cunningham build.
- `../logos/`: the logo set used by the screens gallery.

## Use it

```ts
import deepmerge from "deepmerge";
import { cunninghamConfig } from "@gouvfr-lasuite/ui-components";
import { openproject } from "./openproject";

export default deepmerge(cunninghamConfig, { themes: { openproject } });
```

Then set `theme="openproject"` on the `CunninghamProvider`.

## Where the values come from

Measured on 12 October 2026 with computed styles, not by eye.

| Value | Source | Used as |
|---|---|---|
| `#1A67A3` | header background, community.openproject.org | `brand-550` |
| `#175A8E` | accent and link colour | `brand-600` |
| `#124872`, `#0E3655` | accent major 1 and 2 | `brand-700`, `brand-800` |
| `#D1DEE8`, `#A2BDD2`, `#749CBB` | accent minor 1, minor 2 and the dark mode accent | `brand-100`, `brand-200`, `brand-300` |
| `#EBF3F7` | light surface, openproject.org | `brand-050` |
| `#042737` | footer gradient end, openproject.org | `brand-950` |
| `#1F883D`, `#197032` | primary button and its hover | `success-550`, `success-600` |
| `#D2E7D8`, `#A5CFB1`, `#79B88B` | primary button minor 1, minor 2 and dark mode | `success-100`, `success-200`, `success-300` |
| `#1F2328` | body text | `gray-850` |
| `#59636E` | muted text | `gray-550` |
| `#D1D9E0`, `#EAEAEA` | input border, menu and row lines | `gray-200`, `gray-150` |
| system font stack, 14 px | body | `font.families`, `font.sizes.md` |
| 2 px, 6 px | button radius, input radius | component radii |
| 34 px | button height | `button.medium-height` |

Steps between two measured values are interpolated in sRGB.

## One difference to know about

Cunningham paints its primary button in the brand colour. OpenProject keeps blue for navigation and links and uses green for the one main action on a page. `openprojectRoles` in `openproject.ts` names that split, so an app can point its main action at `success-550`.
