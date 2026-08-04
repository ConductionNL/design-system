---
kind: code
---

## Why

The EU AI Act's transparency tier (Article 50) starts being enforced on **2 August 2026**. It obliges the discloser of AI-generated or AI-modified content to say so. On **10 June 2026** the European Commission published a set of icons for exactly this, as Section 2 of the Code of Practice on Transparency of AI-Generated Content: three marks (Basic, Fully AI-Generated, Partially AI-Modified), each in four colour treatments, free to use without attribution.

Conduction's documentation, guides and tutorials are written with substantial AI assistance. Today none of it says so. We want that to be visible, per page, without an author having to hand-assemble a banner and without the label ever landing on a page a human wrote unaided.

`@conduction/docusaurus-preset` is the brand-default Docusaurus config that every Conduction site consumes, so this belongs here rather than in any one site: adding it once labels the whole estate.

Two constraints from the Commission's own text shape the design, and both are easy to get wrong:

1. **The icons do not create compliance.** Their use is *optional*; the Article 50 obligation is not. The Commission states that using them "does not establish legal compliance" on its own. Our copy must therefore state a fact about the page, not claim conformity.
2. **Do not imply Code-of-Practice adherence.** The Commission asks that non-signatories' use of the icons not signal adherence to the Code. Unless Conduction signs it, the wording must stay factual.

There is a third risk that is ours, not the Commission's: a disclosure system that over-labels is worse than none. If a human-written page acquires an AI label — through a site-wide default, a careless fallback, or a typo silently resolving to "generated" — we would be publishing a false statement about our own authorship. The design is therefore opt-in per page and fails loudly on anything it does not understand.

## What Changes

- **New `AiDisclosure` component** in the preset, rendering the appropriate official EU icon plus a short factual line of copy. It is exported so authors can also place it inline in MDX where a page needs a mark somewhere other than the top.
- **New `ai` frontmatter key** on docs and blog pages. `ai: generated | modified | assisted` renders the banner at the top of that page. **Absent means no banner** — never a default, never inherited.
- **EU icons vendored** into the preset (12 SVGs: 3 marks × 4 colour treatments) with a `PROVENANCE.md` recording source, licence, the meaning of each mark, and the aspect-ratio and no-compliance-claim constraints. Vendored rather than fetched because `ec.europa.eu` is not on the pipeline's egress allowlist — a build-time fetch would fail closed.
- **Four-locale copy** (nl/en/de/fr) matching the preset's existing i18n block, NL default.
- **Theme-aware colour treatment** — the light and dark treatments the Commission ships exist precisely so the mark stays legible on either background.
- **Loud failure on an unknown value** — a typo'd `ai:` value raises a build-time warning naming the file and the permitted values, and renders no banner. It must never silently resolve to a label.

## Capabilities

### New Capabilities

- `ai-content-disclosure`: per-page, opt-in disclosure that a documentation page was generated or modified with AI, rendered with the official EU icons, in four locales, theme-aware, and worded so it states a fact without claiming legal compliance or Code-of-Practice adherence.

## Out of scope

- **Signing the Code of Practice.** That is an organisational decision, not a code change. Until it happens the copy must not imply it.
- **Machine-readable provenance (C2PA / watermarking).** Article 50 also has a machine-readable marking limb for synthetic media. That is a separate concern from a human-visible label on documentation and warrants its own change.
- **Retro-labelling existing pages.** This ships the mechanism. Deciding which of the existing pages carry which label is an editorial pass, and doing it automatically is exactly the over-labelling risk called out above.
- **Site-wide defaults or opt-out models.** Rejected on purpose — see the third risk in *Why*.
