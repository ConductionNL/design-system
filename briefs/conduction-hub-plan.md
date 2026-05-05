# Conduction hub site plan

The `sites/www` Docusaurus build is replacing the old standalone `connext.conduction.nl` site as the unified Conduction company hub at `conduction.nl`, with vanity entry points for ConNext and Common Ground. This document tracks the full programme; pick up wherever a checkbox is unticked.

Audience for this doc: a future agent (or human) walking in cold. It states what was decided, what is already done, what is left, and where the assets and decisions live.

## Status snapshot

- **Live preview:** `https://connext.conduction.nl` (build deploys from `main` via GitHub Pages until cutover)
- **Production target:** `https://conduction.nl`
- **Default locale:** `en`. Secondary locale `nl` at `/nl/...`
- **Single Docusaurus build** at `sites/www/`, deployed via GitHub Pages on `main`
- **Vanity domains** (post-cutover, Phase 5): `connext.conduction.nl`, `commonground.conduction.nl`. Cloudflare Worker 301-redirects them to `/connext` and `/commonground` paths on the canonical domain, with `Accept-Language` locale awareness.

## Architecture decisions taken

- `sites/connext/` was renamed to `sites/www/`. Single Docusaurus app, marketing-first, blog kept for release notes, docs plugin disabled.
- Three landings live at `/`, `/connext`, `/commonground`. The marketing content underneath them all (apps catalogue, solution pages, partners, about, demo, install, support) is shared. Only the landing copy and brand framing differ.
- Brand switch follows pathname via `docusaurus-preset/src/theme/brand.jsx`. Both `theme/Navbar` (wordmark + home href) and `theme/Footer` (wordmark + triad row) consume the same helper. Adding a sub-brand is a one-entry change in `SUB_BRANDS`.
- Apps vs solutions split per `CLAUDE.md`: an app is installable software with a version number; a solution is an outcome built on apps.
- All copy follows the design-system `CLAUDE.md` voice rules: no em-dashes, sentence case headings, ≤16 words per sentence, no banned words list.
- Legal pages are EN at the canonical URL, with a header pointer to the Dutch version at `/nl/<slug>` as the legally binding text. NL canonical translations come in Phase 4.
- Pricing rule: Conduction sells managed Common Ground components as SaaS at `commonground.nu` for **€250/month per app**. A solution that combines N apps is N × €250/month at SaaS pricing, partner-rate for custom or per-user deployments.

## Done so far

### Phase 1: structural rename
- [x] Rename `sites/connext` → `sites/www`, update root `package.json` workspace scripts (`dev`/`build`/`serve`), update Dockerfile + docker-compose service to `www`
- [x] Drop `sites/www/docs/` and `sites/www/sidebars.js`
- [x] Drop the orphan repo-root `CNAME`
- [x] Rewrite `sites/www/docusaurus.config.js`: `title: 'Conduction'`, `tagline`, `i18n: { defaultLocale: 'en', locales: ['en','nl'] }`, `presets[0].docs: false`
- [x] Swizzle Navbar wordmark + home-href by pathname (preset `theme/Navbar/index.jsx`)
- [x] Swizzle Footer wordmark + triad to follow Navbar (preset `theme/Footer/index.jsx`)
- [x] Extract pathname matcher to `theme/brand.jsx` so Navbar and Footer share one source of truth

### Phase 2: split landings
- [x] Move existing `index.mdx` → `connext.mdx` (the existing ConNext-flavoured landing keeps its rightful URL)
- [x] Draft Conduction `index.mdx` with two-door pivot (light stub, copy for review)
- [x] Draft `commonground.mdx` (gov-flavoured stub, copy for review)
- [x] Fix nested `<p>` warning by using `Section` + `SectionHead` primitives
- [x] Fix `CtaBanner` flush-to-previous-section by adding symmetric vertical padding

### Phase 2.5/A: legal + footer plumbing
- [x] `/privacy` ported from conduction-website (EN translation, NL canonical pointer)
- [x] `/terms` drafted (legal-review-pending stub, NL canonical pointer)
- [x] `/iso` drafted (ISO 9001:2015 and 27001:2022 sections, related compliance signals: ISAE 3402, BIO, DigiD, NEN-7510)
- [x] Footer phone-icon social link (`tel:+31853036840`)
- [x] Footer legal-link row (Privacy · Terms · ISO)
- [x] Footer typography ISO badges linking to `/iso`
- [x] ISO certificate PNGs available at `sites/www/static/img/certificates/iso-9001-2015.png` and `iso-27001-2022.png` for use on the `/iso` page

## Phase 2.5/B: company hub (complete)

The live `conduction.nl` is heavier than our new site: services breakdown, customer logo wall, contact form, legal pages. We are porting the procurement-relevant parts and reframing as Public Tech.

### Beheer page (managed services)
- [x] Create `sites/www/src/pages/beheer.mdx`
  - Headline: Common Ground components hosted as SaaS at `commonground.nu`, **€250/month per app**
  - Partner CTA for multi-tenant deployments, custom integrations, per-user pricing
  - SLA / support hours / incident response (placeholder, fill from Procolix terms or leave as "neem contact op")
  - Mention which apps are available as managed components today

### Build page (formerly projecten)
- [x] Create `sites/www/src/pages/build.mdx` (URL `/build`; rename to `/develop` if it reads better)
  - Audience: tertiary tier per CLAUDE.md (developer / integrator)
  - Topics: scaffolding from OpenRegister-as-backend, NLDesign Theme, EUPL-1.2 release pipeline, Docker dev env, app-store submission flow
  - Heavy GitHub + `docs.conduction.nl` links, get-out-of-their-way tone

### Solution: zaakafhandeling
- [x] Update `sites/www/src/pages/solutions/zaakafhandeling.mdx` to make the 4-app composition explicit:
  - **OpenRegister** — typed data store with audit trail
  - **PipelinQ** — citizen / stakeholder CRM
  - **Procest** — case management
  - **Windmill** — workflow engine
  - Pricing line: "4 × €250 = €1000/maand als SaaS via commonground.nu, of partner-rate voor maatwerk."
  - Keep the existing ZGW / archive-koppelvlak / audit-trail framing

### Solution: archief
- [x] Add `sites/www/src/pages/solutions/archief.mdx`:
  - **OpenRegister** stores current data
  - **OpenConnector** ships records to central archive storage (KSL / e-Depot / etc.)
  - Compliance signals: NEN-2082, Wet hergebruik, eIDAS-AdES sealed exports
  - Pricing line: "2 × €250 = €500/maand als SaaS via commonground.nu, of partner-rate voor maatwerk."

### Clients component
- [x] Design + implement `docusaurus-preset/src/components/Clients/Clients.jsx` + `Clients.module.css`
  - Public-sector / customer logo wall (separate concept from `/partners`, which stays commercial-only)
  - Visual: grayscale logo grid, columns adapt mobile, no captions, no hover detail
  - 16 logos to source from `ConductionNL/conduction-website/static/img/`:
    VNG, Gemeente Alkmaar, 's-Hertogenbosch, Eindhoven, Rotterdam, Tilburg, Utrecht, Hoorn, Nextcloud, iO, Yard, Ritense, Shift2, Open Webconcept, SIDN Fonds, BCT
  - Drop assets into `sites/www/static/img/clients/`
  - Add export to `docusaurus-preset/src/components/index.js`
  - **Asset blocker:** logos need to be downloaded from the source repo before the component can be wired

### About page (absorbs over-ons + contact)
- [x] Restructure `sites/www/src/pages/about.mdx`
  1. "Public Tech / Tech to serve people" hero
  2. Company story, mission, "Digital Socials" framing
  3. ISO 9001 + 27001 callout block linking to `/iso`
  4. Optional team strip (`EmployeeCard` from preset, fed from `brand/assets/team/*.png`)
  5. Contact block: form (name, organisation, email, phone, message) OR a clean mailto + tel + map link triplet
  6. Office details: hours, KvK 76741850, BTW NL860784241B01, Lauriergracht 14h Amsterdam
- [x] Decide: real contact form (needs a submit endpoint, e.g. Formspree, Netlify Functions, or an OpenConnector endpoint) or a mailto-only block. **Decision: mailto + tel + map link triplet, no form backend yet.**
- [x] Drop the standalone `/over-ons` and `/contact` URLs; `/about` is the single front door

### Reframe Conduction landing as Public Tech
- [x] Restructure `sites/www/src/pages/index.mdx`
  1. Hero with "Public Tech" eyebrow, "Tech to serve people" tagline
  2. **Wat we doen** 3-up cards (the company-services row that the live site has):
     - Apps (link `/apps`)
     - Beheer (link `/beheer`)
     - Common Ground advisory (link `/commonground`)
  3. `<StatsStrip>` (existing 5 stats)
  4. `<Clients />` logo wall (new component)
  5. Two-door pivot to `/connext` and `/commonground` (existing PairRow, keep)
  6. `<AppsPreview>` (existing 3 apps)
  7. `<CtaBanner>`

Also done as part of this phase: navbar swapped Support → Beheer, footer Resources column added Beheer + Build, FeatureItem `<p>` nesting bug fix in the preset.

## Status of phases 3, 4, 5 (PRs in flight)

All three remaining phases are prepared as stacked PRs. Cutover happens by merging them in the order below.

- **Phase 3** ([design-system PR #4](https://github.com/ConductionNL/design-system/pull/4)) — brand-strip ConNext → Conduction across 28 MDX files. Branched off `main`. **Merge first.**
- **Phase 4** ([design-system PR #5](https://github.com/ConductionNL/design-system/pull/5)) — Dutch translations for every page + theme strings. Stacked on Phase 3 (`base: phase-3-brand-strip`). **Merge after Phase 3.**
- **Phase 5** ([design-system PR #6](https://github.com/ConductionNL/design-system/pull/6)) — Cloudflare Worker + cutover runbook + flip the `static/CNAME` from `connext.conduction.nl` to `conduction.nl`. Branched from `main`; needs a quick rebase after Phases 3 and 4 land. **Merge last** (this is the one that actually flips GitHub Pages to claim `conduction.nl`).
- **Companion PR** ([conduction-website PR #14](https://github.com/ConductionNL/conduction-website/pull/14)) — removes the legacy `static/CNAME` so GitHub Pages on the old marketing repo releases its claim on `www.conduction.nl`. Merge between Phase 4 and Phase 5 per the runbook.

The full cutover sequence (which PR to merge in which order, what to smoke-test, how to deploy the Worker, rollback path) is documented in [`briefs/cutover-runbook.md`](./cutover-runbook.md) on the `phase-5-cutover` branch.

## Phase 3: brand-strip pass

After Phase 2.5/B lands, sweep `ConNext` references out of the shared content. Approximately 52 occurrences across 28 MDX files. Replace with `Conduction` (company) or product-specific (when a real app is meant).

- [ ] Branch `phase-3-brand-strip` (one PR, target `main`, per the user's preferred review style for this scope)
- [ ] `apps.mdx` and 12 files in `apps/*.mdx`
- [ ] `solutions.mdx` and 6 files in `solutions/*.mdx`
- [ ] `partners.mdx` and 3 files in `partners/*.mdx`
- [ ] `about.mdx`, `demo.mdx`, `install.mdx`, `support.mdx`
- [ ] Footer config copy in `sites/www/docusaurus.config.js` (already partially clean, double-check)
- [ ] One PR with the full diff for review

## Phase 4: NL mirror and translations

- [ ] Create `sites/www/i18n/nl/docusaurus-plugin-content-pages/` mirror tree of every page in `src/pages/`
- [ ] Create `sites/www/i18n/nl/docusaurus-theme-classic/` for translated nav and footer labels
- [ ] First-pass translation via `claude -p` (per `feedback_always-use-claude-cli.md` memory; OAuth, no direct API key)
- [ ] PO refines via PR
- [ ] Verify `<Hero>` / `<SectionHead>` / `<DetailHero>` etc. work with NL prop strings (no React-prop-type issues with longer copy)
- [ ] Fill in NL canonical text for `/privacy`, `/terms`, `/iso` so those become legally binding versions

## Phase 5: cutover to conduction.nl

- [ ] Write a Cloudflare Worker (suggest `sites/www/cloudflare/worker.js`):
  - Routes: `connext.conduction.nl/*`, `commonground.conduction.nl/*`
  - Parse `Accept-Language` header → pick `en` or `nl`
  - 301 to `https://conduction.nl/<localePrefix><sectionPath>` where `localePrefix` is empty for EN, `/nl` for NL
  - `sectionPath` is `/connext` or `/commonground`
- [ ] DNS: `connext.conduction.nl` and `commonground.conduction.nl` → Cloudflare → Worker route binding
- [ ] Repoint `sites/www/static/CNAME` from `connext.conduction.nl` to `conduction.nl`
- [ ] Decommission `CNAME` on `ConductionNL/conduction-website` repo (currently claims `conduction.nl`); it points there today
- [ ] Smoke-test:
  - `https://conduction.nl/` → Conduction landing, navbar reads "Conduction"
  - `https://conduction.nl/connext` → ConNext landing, navbar reads "Con**Next**"
  - `https://conduction.nl/commonground` → Common Ground landing, navbar reads "Common **Ground**"
  - `https://connext.conduction.nl/...` → 301 → `https://conduction.nl/connext...` (or `/nl/connext...` for NL `Accept-Language`)
  - `https://commonground.conduction.nl/...` → 301 → `https://conduction.nl/commonground...` (or `/nl/commonground...`)

## Open assets, decisions, blockers

| Item | Status | Notes |
| --- | --- | --- |
| Client logo PNG/SVG assets (16 logos) | **Blocker for Clients component** | Download from `ConductionNL/conduction-website/static/img/`, save into `sites/www/static/img/clients/` |
| Distinct sub-brand SVG marks (ConNext, Common Ground) | Not blocking | Today the Conduction hex avatar is the universal mark; sub-brand differentiation is the wordmark text only. If distinct logos are produced later, drop into `sites/www/static/img/` and reference from `theme/brand.jsx` |
| Contact form backend | Decision pending | Mailto fallback OK initially. If a real form is required, pick a submit target (Formspree, Netlify Functions, OpenConnector endpoint) and add a submit URL |
| `/iso` certificate numbers and certifying body | Required before live | The `/iso` page has placeholders ("_Listed on the certificate, contact us for a copy_"). Fill in from current cert docs |
| Legal review on `/terms` | **Required before live** | Page is a working draft, flagged in body. The NL canonical version (Phase 4) is what becomes binding |
| `kwaliteitsbeleid` content | Decision: dropped | Quality-policy content is folded into `/iso` and `/terms`. If a separate page is needed later, add `/quality.mdx` |
| `/projecten` URL | Decision: replaced with `/build` | Live site has a project portfolio at `/projecten`; in the new site the equivalent surface is the developer-build page at `/build` |

## Style guide reminders

Follow `CLAUDE.md` (root) and the design-system `CLAUDE.md` exactly:

- **No em-dashes.** Period, comma, colon, parenthesis, or short follow-up sentence instead. Em-dashes are an LLM tell.
- **Sentence case headings.** Capitalise only the first word and proper nouns.
- **≤16 words per sentence.** Split otherwise.
- **No banned words.** `Digitale transformatie`, `Ketensamenwerking`, `Waardevolle inzichten`, `Toekomstbestendig`, `State-of-the-art`, `Platform dat…`, `Oplossing` (as our product noun), `Synergie`, `Proactief meedenken`, `Kernel` (always replace with `workspace`).
- NL uses `je` / `jij`, never `u`.
- Apps have version numbers and live in `/apps/*`. Solutions are outcomes built on apps and live in `/solutions/*`.

## Working notes

- Live preview deploys from `main` to `connext.conduction.nl` until cutover. Per the design-system convention, commit and push per task so the live preview keeps moving.
- Phase 3 (brand strip) and Phase 4 (NL mirror) are scoped as branches + PRs because of size; everything else commits direct to `main`.
- Dev server: `npm run dev` from the design-system root, or `docker compose up` (port 3100).
- Build: `npm run build`, output in `sites/www/build/`.
- The `static/CNAME` claim is `connext.conduction.nl` until Phase 5 cutover.
- Brand switch helper: `docusaurus-preset/src/theme/brand.jsx`. Test by navigating `/`, `/connext`, `/commonground`, `/nl/connext`, `/nl/commonground`. Wordmark and triad should swap on each.
