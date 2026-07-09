# Commercial /features page standard

Every Conduction docs site renders a `/features` page from the
`conduction-features-page` plugin. This is a **commercial surface**: a buyer,
often mid-procurement, scans it to decide whether the app does what they need.
It is not an engineering backlog. This document is the single standard the
generator and every app must satisfy.

The generator (`plugins/extractFeatures.js`, mirrored by the org-wide
`scripts/extract-features.py`) builds the list from two sources, in priority
order:

1. **`openspec/features.overlay.json`** — the curated, authoritative list.
   Use it for any app that is actually sold. See the schema below.
2. **`openspec/specs/<slug>/spec.md`** — hardened fallback derivation, for apps
   without an overlay yet.

---

## Honesty (non-negotiable)

- Only real, verified capabilities appear as `stable`. Verified = a service or
  controller exists **and** there is a UI or API a buyer can reach. Spec
  frontmatter alone is never proof of "shipped".
- Provider-dependent or stub features are never `stable`. They are `beta`
  (works when wired) or `soon` (not usable yet).
- Genuine market gaps appear as honest `soon` rows. Never imply they ship
  today; never silently omit a must-have a competitor will demo.

## Three maturities (exactly three)

| status   | colour  | meaning |
|----------|---------|---------|
| `stable` | mint    | shipped, has a UI/API a buyer can use today, verified in code |
| `beta`   | blue    | works but partial, admin/backend-only, or depends on an external provider being configured |
| `soon`   | orange  | roadmap, honestly not usable yet; never priced or sold |

## Cross-app capability (provenance)

Many capabilities a consuming app surfaces are **provided by OpenRegister**:
the AI assistants, the content **leaves** (knowledge → XWiki, event → Calendar,
file → Files, task → Deck, per ADR-022), RBAC, audit trail, archiving, and the
MCP bridge. These are real, shipped features of the consuming app even though
the backing code lives in OpenRegister. Surface them on the page and set
`providedBy: "openregister"` so they are honestly attributed ("Powered by
OpenRegister" / "Draait op OpenRegister"). The same applies to other providers
(`opencatalogi`, `openconnector`, ...). A provided capability is `stable` only
if it is actually wired and reachable in the consuming app; otherwise `beta`.

## Titles

- Sentence case, never Title Case. No em-dashes (use a period, comma, colon, or
  parenthesis).
- A human capability name, never the raw slug, never a `Spec:` / `Delta Spec:`
  prefix.
- Names the buyer outcome. "App" = installable software; "solution" = an
  outcome built on apps. Never "de Oplossing" as our product term.

## Benefit lines

- One claim per item. Result before motivation. Subject is a person, active
  verbs, under 16 words.
- Lead with what the feature does for the buyer, never a tender percentage or
  spec rationale.
- Banned words: digitale transformatie, ketensamenwerking, toekomstbestendig,
  state-of-the-art, "platform dat…", oplossing (as our term), synergie, kernel.
- Provide **both NL and EN**; each reads standalone and benefit-first in its own
  language. NL addresses the reader as "je"/"jij", never "u".

## Feed filtering (fallback path)

When derived from specs, the generator drops internal/process specs by slug
segment (refactor, migration, test, e2e, docs, manifest, plumbing, scaffold,
chore, cleanup, rename, bump, deps, lint, coverage, gate, seed, fixture, spike,
poc, tooling, ...) and strips engineering artifacts (`@e2e`, `#<pr>`,
`Spec:`, em-dashes, `` `code` ``, `TBD`/`TODO`) from titles and summaries. Set
`commercial: true` on a spec to force-include an otherwise-filtered slug, or
`commercial: false` to hide one. An overlay always wins over this path.

## Coverage

- Every decisive differentiator for the app's category is a headline item, not
  buried.
- Category must-haves we have are present; must-haves we lack appear as `soon`.

---

## `features.overlay.json` schema

A JSON array (or `{ "features": [ ... ] }`). Each entry:

```jsonc
{
  "slug": "ai-assistant",            // stable id; defaults from title if omitted
  "title": "AI assistant",           // EN, sentence case, required
  "title_nl": "AI-assistent",        // NL (optional but expected for sold apps)
  "summary": "Ask questions about your data in plain language.",  // EN benefit line
  "summary_nl": "Stel vragen over je gegevens in gewone taal.",   // NL benefit line
  "status": "stable",                // stable | beta | soon (required)
  "providedBy": "openregister",      // optional cross-app provenance
  "docsUrl": "openspec/specs/ai-assistant/spec.md"  // optional deep link
}
```

Order in the file is the order on the page. Put your strongest differentiators
first. Keep the list scannable: collapse near-duplicate specs into one buyer
capability rather than listing every spec.

The machine-readable JSON Schema lives at
`design-system/schemas/features-overlay.schema.json`.
