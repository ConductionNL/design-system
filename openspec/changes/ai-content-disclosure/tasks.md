# Tasks — ai-content-disclosure

The EU icons are ALREADY vendored, now at
`docusaurus-preset/static/img/ai-disclosure/` (12 SVGs + `PROVENANCE.md`;
moved here from `src/components/AiDisclosure/icons/` during implementation —
see PROVENANCE.md "Location" for why: `@docusaurus/plugin-svgr`, enabled by
the classic preset, unconditionally turns any `.svg` imported from a
JS/JSX/MDX file into an inlined React component regardless of a `?url`
suffix, and an inlined SVGR mark would leak unscoped `.cls-1`/`.cls-2` fill
classes across every mark rendered on the same page). Do not re-download
them — `ec.europa.eu` is not on the egress allowlist and the fetch will fail
closed. Read `PROVENANCE.md` before using them: the three marks have
different aspect ratios and one upstream filename is misspelled.

- [x] 1.1 Add the `AiDisclosure` component at `docusaurus-preset/src/components/AiDisclosure/AiDisclosure.jsx` following the existing component convention (JSX + CSS module, brand tokens, no hardcoded colours)
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Each value renders its corresponding official EU mark"
- [x] 1.2 Map the three kinds to the vendored assets and preserve each mark's source aspect ratio (Basic 1:1, Modified ~3:1, Generated ~3.16:1 — a single uniform box will fail the spec)
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Each value renders its corresponding official EU mark"
- [x] 1.3 Select the colour treatment from the active Docusaurus colour mode, updating live on toggle, using the supplied black/white treatments rather than a CSS filter
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Colour treatment follows the active theme"
- [x] 2.1 Add localised copy for 3 kinds × 4 locales (nl default, en, de, fr) through the preset's existing i18n mechanism, with distinct wording per kind
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Copy is localised across the preset's four locales"
- [x] 2.2 Verify every string states a fact about the page and contains no compliance or Code-of-Practice claim in any locale
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Copy states a fact and claims no compliance"
- [x] 3.1 Resolve the `ai` frontmatter key on docs and blog pages and render the banner at the top of the page, reusing the component rather than reimplementing it
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "The `ai` frontmatter key is opt-in and never defaulted"
- [x] 3.2 Ensure absence of the key renders nothing, with no site-wide default, no directory inheritance and no content inference
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "The `ai` frontmatter key is opt-in and never defaulted"
- [x] 3.3 Emit a build-time warning naming the file, the offending value and the three permitted values when the value is unrecognised or empty, and render no banner
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "An unrecognised value fails loudly and renders nothing"
- [x] 4.1 Export the component from the preset so it can be used inline in MDX, taking the kind as a prop and rendering identically to the banner
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "The component is exported for inline MDX use"
- [x] 5.1 Unit-test the frontmatter resolver: present, absent, misspelled, empty
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "An unrecognised value fails loudly and renders nothing"
- [x] 5.2 Unit-test the kind → vendored-asset mapping and the preserved aspect ratio per mark
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Each value renders its corresponding official EU mark"
- [x] 5.3 Unit-test locale coverage — 3 kinds × 4 locales, asserting no untranslated fallback string leaks through
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Copy is localised across the preset's four locales"
- [x] 5.4 Unit-test the copy against a denylist of compliance phrasings in all four locales (the requirement most likely to regress under a well-meaning copy edit)
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Copy states a fact and claims no compliance"
- [x] 6.1 Document the frontmatter key and the inline component in the preset's docs, including the explicit statement that the icons do not establish legal compliance
  - spec_ref: `specs/ai-content-disclosure/spec.md` → "Copy states a fact and claims no compliance"
