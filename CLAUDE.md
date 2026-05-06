# Conduction Design System

The visual and verbal brand kit for **Conduction** (the Dutch OSS product company) and **ConNext** (its public product brand for the Nextcloud-app ecosystem). This kit is the source of truth for tone, type, color, motif, and component patterns across `connext.conduction.nl`, the apps, docs, decks, and print.

The repo is statically served from `main` via GitHub Pages. **Commit and push to `main` after each task** so changes are immediately reviewable in the live preview.

## Repo layout

- [tokens.css](tokens.css): single source of truth for colors, type, spacing, radii, shadows, hex clip-paths
- [brand/](brand/): token JSON, logo and hex assets
- [preview/](preview/): every page in the kit, browsable as standalone HTML
  - [preview/identity/](preview/identity/): the verbal brand: foundation, audience, products, voice, system rationale
  - [preview/components/](preview/components/): reusable building blocks (hero, footer, apps-grid, etc.)
  - [preview/pages/](preview/pages/): full pages composed from components
- [briefs/](briefs/): design briefs and rationale documents
- [README.md](README.md): public-facing introduction; mirrors the in-repo identity pages

## Working rules

- **Edit existing pages over creating new ones.** Most surfaces already have a home in `preview/`.
- **No scripted edits to HTML/CSS** (no sed, awk, scripts). Use the Edit or Write tool.
- **Tokens, not hardcoded values.** Reference `var(--c-cobalt-700)`, `var(--space-5)`, `var(--radius-lg)`. Add new tokens to [tokens.css](tokens.css) before using them.
- **Pointy-top hexes only.** No flat-top hexes anywhere.
- **One orange accent per screen.** KNVB orange (`--c-orange-knvb`) is for highlights, never primary fills.
- **Partner and client logos on white.** Third-party logos are designed against white and lose contrast on tinted surfaces. Always render them on a white tile, never on cobalt-50 or cobalt-100. If the surrounding surface is tinted, place the logo inside a white frame: a hex (preferred, via `<HexNetwork/>`), a card, or a small white plate. The brand-anchor center hex (Conduction) is the only solid-fill exception.
- **Sub-brand icon hexes use the brand's own colour, not cobalt.** When a hex represents a partner brand (Nextcloud, Common Ground+) instead of a Conduction surface, the hex fill is the brand's own colour and the glyph inside is the brand's logo:
  - **ConNext / Nextcloud** — Nextcloud logo (`fill: currentColor`, white) on a hex filled with `var(--c-nextcloud-blue)`.
  - **Common Ground+** — Common Ground logo (`fill: currentColor`, cobalt-900 ink for AA on yellow) on a hex filled with `var(--c-commonground-yellow)`.
  - In `<PairCard/>`, pass `iconBg` + `iconColor` to switch from the default cobalt-on-white icon to the brand variant. The card auto-switches to the filled-mark SVG rules instead of the stroke-only glyph.
  - The Conduction cobalt hex is the default for our own apps and surfaces; reserve brand colour-fills for the two sub-brands above.

---

# Writing style

This applies to **everything we publish**: page copy, deck text, contract templates, README intros, taglines, microcopy, and the design-system pages themselves. The visual kit is opinionated for a reason; the words have to match.

## Target audience

Three tiers, in order. We write for the primary; we don't alienate the secondary; we get out of the way of the tertiary.

1. **Primary · MKB-beslisser / IT-lead.** Small or mid-sized business, 10–500 people, limited budget, decides in days or weeks, finds us via Google. Comes with a concrete problem, no roadmap, no prior knowledge of Conduction. Wants a clear answer and a route to "install from the Nextcloud app store."
2. **Secondary · Overheid-beslisser.** Municipalities and joint arrangements; the majority of our existing customer base. Comes via existing relationships, decides in months through formal procurement, needs compliance signals (BIO, WOO) and a discreet route to Services. We do not lead with this audience but never hide it.
3. **Tertiair · Developer / integrator.** OSS contributors and system integrators. Lands via GitHub or `docs.conduction.nl`, wants the API spec and the license in one click, has zero patience for marketing copy. Send them direct links and step out of the way.

The full version lives in [preview/identity/audience.html](preview/identity/audience.html).

## Languages

**Dutch and English are both required**, and equal in weight. Every page, tagline, and button label needs an NL and EN form. The NL is the canonical version for the MKB and government audiences; the EN is canonical for developers and international partners. Don't translate one as an afterthought: write both with the same care, then check that each works standalone.

- NL: address the reader as **"je" / "jij"**, never "u". Government-formal `u` belongs in the inkoop register, which we do not use.
- EN: plain, concrete English. American or British spelling is fine; pick one per page and stick to it.

## Tone: MKB-direct, concrete, short

The full discussion lives in [preview/identity/voice.html](preview/identity/voice.html). The seven rules:

1. **Subject is a person, never a system.** "Je", "jij", "we" beats "de Oplossing" or "het systeem". Even when the system does the work, write from the user.
2. **Verbs are actions, not nominalisations.** "Genereer" beats "biedt documentcreatiefunctionaliteit". Active voice always.
3. **Result before motivation.** Drop the "Als gebruiker wil ik X zodat Y" template. Lead with Y. Keep Z if it adds something.
4. **Under 16 words per sentence.** If a sentence runs longer, split it. Two short sentences read faster than one long one, and each claim becomes individually verifiable.
5. **Jargon needs context.** WOO-coördinator? Fine, but explain on first mention. SAML? Fine in a tech context. "Ketensamenwerking"? Never.
6. **Abbreviations: full on first use, abbreviated after.** "Wet open overheid (Woo)" the first time, "Woo" thereafter. Don't make readers Google.
7. **One claim per sentence.** Marketing strings like "snel, schaalbaar, veilig en betrouwbaar" get skipped. One claim, one sentence.

## Banned words

These signal that a sentence is hiding behind generic language. If you can delete the word and the sentence still works, it was noise.

`Digitale transformatie` · `Ketensamenwerking` · `Waardevolle inzichten` · `Toekomstbestendig` · `State-of-the-art` · `Platform dat…` · `Oplossing` · `Synergie` · `Proactief meedenken` · `Kernel`

Exception: **"Oplossing"** is fine as a customer-side translation of "solution". It is never our generic product term. We have **apps** and **solutions**, never "de Oplossing".

Replacement: **"Kernel" → "workspace"**. Kernel reads as tech-jargon (OS / Linux kernel) and locks out MKB readers. Nextcloud already calls itself a workspace; we cite that. Use *"six apps, one workspace, all open-source"*, not *"one kernel"*. In API names, the centre slot is `slot="apex"` (same convention as `cn-domain-tree`), never `slot="kernel"`.

## Apps versus solutions

- **App**: software we build and ship. Concrete, installable, has a version number. (OpenCatalogi, OpenRegister, DocuDesk, …)
- **Solution**: a concrete outcome (WOO compliance, a procurement workflow, a public catalogue) built **on** apps. A goal, not a download.

Never write "onze WOO-app": there isn't one. Write "onze WOO-solution, gebouwd op OpenCatalogi, OpenConnector en DocuDesk."

## Punctuation and capitalisation rules (the AI tells)

These rules exist because they are the dead giveaways of LLM-generated copy. Conduction copy reads like a person wrote it, so:

- **No em-dashes (`—`).** Replace with a period, comma, colon, or parenthesis. A short follow-up sentence is almost always better than an em-dashed aside.
- **No double-dashes (`--`) in prose.** They only belong in CSS variable names and code comments.
- **En-dashes (`–`) only in numeric ranges.** "10–500 medewerkers", "32–56 px". Never as a sentence-level pause.
- **Sentence case for headings**, not Title Case. Write "Build dashboards from your own data", not "Build Dashboards From Your Own Data". Capitalise only proper nouns and the first word.
- **No ALL-CAPS body copy.** Eyebrows and code labels can be uppercased via CSS (`text-transform: uppercase`); the underlying text stays sentence case.
- **Straight quotes in HTML source**, curly quotes only when the surface explicitly calls for them. Don't mix on a single page.
- **One claim per bullet.** Bullets that join three claims with commas or "and" should be split or rewritten as a sentence.

## Rewrite recipes

Tender / requirement source → Conduction website:

- "De Oplossing ondersteunt het opslaan van zoekopdrachten." → "Sla je zoekopdrachten op en gebruik ze later opnieuw."
- "De Oplossing heeft één centrale beheeromgeving waarin autorisaties kunnen worden beheerd." → "Beheer alle autorisaties op één plek."
- "Het systeem moet historische jaarrekeningen permanent archiveren." → "Jaarrekeningen worden automatisch gearchiveerd, voorgoed vindbaar."
- "De Oplossing biedt documentcreatiefunctionaliteit om documenten en e-mails op basis van sjablonen te creëren." → "Genereer documenten en e-mails uit sjablonen, direct, zonder plug-in."

Note that the rewrite uses commas where an em-dash would have been the AI-default. Short, comma-separated clauses keep the rhythm without the em-dash tell.
