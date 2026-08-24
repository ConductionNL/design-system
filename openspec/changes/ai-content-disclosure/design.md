---
status: pr-created
---

# Design — ai-content-disclosure

## Reuse analysis

The preset already has everything this needs; nothing new is introduced at the architectural level.

| Need | Existing thing to use | Notes |
|---|---|---|
| Component location | `src/components/<Name>/<Name>.jsx` + `<Name>.module.css` | 67 components already follow this; do not invent a new layout |
| Styling | CSS modules + brand tokens | No hardcoded colours — the preset owns the palette |
| i18n | the preset's existing four-locale block (`nl` default, `en`, `de`, `fr`) | Do not add a fifth mechanism; use what `createConfig()` already wires |
| Icons | `src/components/AiDisclosure/icons/` (vendored, 12 SVGs) | Already committed with `PROVENANCE.md`; do NOT re-download |

## Key decisions

### D1 — Frontmatter drives the banner; the component does the rendering

The frontmatter key is a *trigger*, not a second implementation. `ai: generated` resolves to the same component an author could write by hand. One rendering path, so the banner and the inline form cannot drift.

### D2 — Opt-in only, and the absence of a value is meaningful

No site default, no directory inheritance, no content sniffing. The absence of `ai` means "no claim is being made", which is different from "we don't know". Any mechanism that turns absence into a label is a defect, not a convenience.

### D3 — An unknown value renders nothing and warns

The tempting alternative — fall back to the Basic mark — is wrong: it converts a typo into a published statement about authorship. Warn, name the file, render nothing.

### D4 — Vendored icons, never fetched

`ec.europa.eu` is not on the pipeline's egress allowlist. A build-time fetch would fail closed in CI and, worse, would make the rendered output depend on a third party's uptime. The icons are free to redistribute, so vendoring costs nothing.

### D5 — Theme-awareness uses the four supplied treatments, not CSS filters

The Commission ships black and white treatments precisely so the mark stays legible. Recolouring the mark with a CSS `filter` or `currentColor` would alter an official mark; selecting the supplied treatment does not.

## The thing most likely to be got wrong

**Copy that claims compliance.** It is the natural thing to write — "Deze pagina voldoet aan de EU AI Act" reads like the point of the exercise. It is false on two counts: the icons do not establish compliance on their own, and the Code of Practice asks non-signatories not to signal adherence through them. The copy states what happened to the page and stops there.

A worked example of the register to aim for:

| kind | nl (default) | en |
|---|---|---|
| `generated` | "Deze pagina is gegenereerd met AI." | "This page was generated with AI." |
| `modified` | "Deze pagina is gedeeltelijk aangepast met AI." | "This page was partially modified with AI." |
| `assisted` | "Deze pagina is geschreven met hulp van AI." | "This page was written with AI assistance." |

Factual, per-page, no claim about the organisation.

## Testing notes

The scenarios in the spec are directly testable and should be:

- frontmatter present / absent / misspelled — three unit tests over the resolver
- value → asset mapping — assert the rendered `src` per kind
- aspect ratio preserved — compare rendered ratio against the source `viewBox` (they differ per mark; a single hardcoded box would fail this)
- locale coverage — assert copy exists for 3 kinds × 4 locales, with no fallback string leaking
- **copy contains no compliance claim** — assert the rendered strings against a denylist of compliance phrasings in all four locales; this is the requirement most likely to regress silently under a well-meaning copy edit

## Out of scope, restated

No C2PA/watermarking, no retro-labelling of existing pages, no site-wide default, and no change to whether Conduction signs the Code of Practice.
