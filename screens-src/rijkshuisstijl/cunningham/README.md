# Rijkshuisstijl example theme for Cunningham

Cunningham is the token system behind La Suite (Docs, Messages, Meet). This folder holds an example theme that gives a Cunningham app the colours, type scale and spacing of the Dutch central government's house style.

It is an example, not an official theme. The Rijksoverheid logo, the wordmark and the fonts RijksoverheidSans and RijksoverheidSerif are reserved for the central government, so none of them is here. The text falls through to Fira Sans, which the community tokens name as their own fallback.

## Files

- `rijkshuisstijl.ts`: the theme as a Cunningham config. Merge it into your `cunningham.ts`.
- `rijkshuisstijl.css`: the same values as CSS variables under `.cunningham-theme--rijkshuisstijl`, for a page that does not run the Cunningham build.
- `../logos/`: the logo set used by the screens gallery: a classic crown of our own in the manner of an engraving (a jewelled band with a pearl rim and ermine tails, five arches set with pearls, an orb and cross) in lintblauw, white and grey. It is not the Rijksoverheid logo and not the state coat of arms, which only the central government may use.

In the gallery the app header wears the lint: a narrow lintblauw bar on the far left, from the top edge to past the header's foot, with the white crown near its foot, and beside it the organisation and the app name. The organisation is the fictional Ministerie van Voorbeeldzaken, never the Rijksoverheid.

## Use it

```ts
import deepmerge from "deepmerge";
import { cunninghamConfig } from "@gouvfr-lasuite/ui-components";
import { rijkshuisstijl } from "./rijkshuisstijl";

export default deepmerge(cunninghamConfig, { themes: { rijkshuisstijl } });
```

Then set `theme="rijkshuisstijl"` on the `CunninghamProvider`.

## Where the values come from

Package `@rijkshuisstijl-community/design-tokens` 18.0.1 on npm, theme `lintblauw` (`dist/lintblauw/root.css`), read on 17 October 2026. The package publishes its colours as `oklch()`; the values below are those colours converted to sRGB. Thematiq's `css/tokens/rijkshuisstijl.css` carries the same values.

| Value | Source token | Used as |
|---|---|---|
| `#154273` | `rhc.color.lintblauw.500` (core, primary) | `brand-550` |
| `#162F50`, `#162945` | `rhc.color.lintblauw.600`, `.700` (hover, active) | `brand-600`, `brand-700` |
| `#DCE3EA` to `#4F7196` | `rhc.color.lintblauw.50` to `.400` | `brand-050` to `brand-400` |
| `#01689B` | `rhc.color.donkerblauw.500` (`foreground.link`) | `info-550` |
| `#01496C`, `#163F5B` | `rhc.color.donkerblauw.600`, `.700` (link hover, active) | `info-600`, `info-700` |
| `#39870C`, `#2C5D12` | `rhc.color.groen.500`, `.600` (positive) | `success-550`, `success-600` |
| `#D52B1E`, `#9E1B16` | `rhc.color.rood.500`, `.600` (negative) | `danger-550`, `danger-600` |
| `#0F172A` | `rhc.color.cool-grey.900` (`foreground.default`) | `gray-900` |
| `#475569`, `#334155` | `rhc.color.cool-grey.600`, `.700` (`foreground.subtle`) | `gray-600`, `gray-700` |
| `#64748B`, `#94A3B8` | `rhc.color.cool-grey.500`, `.400` (`border.default`, `.subtle`) | `gray-500`, `gray-400` |
| `#F8FAFC` to `#CBD5E1` | `rhc.color.cool-grey.50` to `.300` | `gray-050` to `gray-300` |
| Fira Sans | `rhc.text.font-family.sans` minus the reserved RijksSansVF | `font.families` |
| 1 rem, 0.875 rem | `rhc.text.font-size.min.md`, `.min.sm` | `font.sizes.md`, `.sm` |
| 2 px, 4 px, 0 | `rhc.border-radius.sm`, `.md`, `.none` | button and input radii, alert and modal radii, checkbox |
| 48 px, 40 px | `rhc.size.pointer-target`, `rhc.size.min-lint` | button heights |

Steps the package does not publish (150, 250, 350, 450, 500, 650, 750 to 950) are interpolated in sRGB between the neighbouring published steps; the 950 step runs towards a near-black of the same hue.

## One difference to know about

The Rijkshuisstijl paints its primary button and its header in the same lintblauw, as Cunningham does. Links are a different blue, donkerblauw. `rijkshuisstijlRoles` in `rijkshuisstijl.ts` names that split, so an app can point its links at `info-550` while its buttons stay on `brand-550`.

## Contrast

Measured, not estimated: white on `#154273` 10.2 : 1, `#01689B` on white 6.1 : 1, `#0F172A` on white 17.9 : 1, `#475569` on white 7.6 : 1, white on `#39870C` 4.5 : 1, white on `#D52B1E` 5.0 : 1. Oranje `#E17000` is 3.2 : 1 on white and is not used for text.
