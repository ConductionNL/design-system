# Taalgebruik

The verbal half of the Conduction brand. This file is the **source of truth** for tone, person, sentence shape, slogan formulas, vocabulary, and microcopy. It governs everything we publish: page copy, deck text, contract templates, README intros, taglines, button labels, error states, the design-system pages themselves.

> **Where things live**
> - `brand/taalgebruik.md` (this file): canonical, in English, the spec people cite.
> - [`preview/identity/voice.html`](../preview/identity/voice.html): Dutch-rendered "MKB-direct. Concreet. Kort." page with the seven rules, registers and rewrite recipes. Visual reference; this file is authoritative when they disagree.
> - [`preview/identity/slogans.html`](../preview/identity/slogans.html): working slogan inventory in NL + EN, one card per slogan with a *why*.
> - [`preview/identity/audience.html`](../preview/identity/audience.html): full audience definition; this file gives only the short version.
> - [`CLAUDE.md`](../CLAUDE.md): working rules for the design-system repo, including a condensed Writing-Style section that points back here.

---

## 1. Where this voice came from

The current voice is a deliberate move away from the original `conduction.nl` Docusaurus site (the one preserved at `.github/website/`). Reading them side by side makes the rules concrete:

| | Old site (`.github/website/`) | Current site (`conduction-website` / sites/www) |
|---|---|---|
| Identity | "Conduction is driven by a vision … democratic, inclusive, transparent, understandable, and affordable software." | "We are Conduction. We build open-source apps that plug into Nextcloud." |
| Goal | "By 2035, Conduction ensures that all residents of the Netherlands automatically receive the government services they are entitled to." | "Tech to serve people. One workspace. Twelve apps." |
| Audience framing | Audience-segmented intro for *employees, clients, IT companies, competitors* (300+ words). | "Pick the framing." Two doors, one paragraph each. |
| Headers | Title Case + emoji decoration ("🧙 Who is Conduction?", "🌈 Join Our Team"). | Sentence case, no emoji, ends with a period ("Who we are.", "What we believe."). |
| CTAs | "Explore Our Documentation →", "Learn How We Work". | "Install from Nextcloud app store", "Run a local demo", "View on GitHub". |
| Sentence shape | One claim = one paragraph, multi-clause. Average ~ 28 words. | One claim = one sentence. Average ~ 12 words, often fragments. |
| Vocabulary | "ambitious", "comprehensive", "innovative", "holistic", "synergetic". | "two-minute install", "EUPL-1.2", "no procurement track". |
| Slogan structure | Single full-sentence promise: "Make the digital world a better place …" | Two or three fragments, each self-contained: "Pick an app. Install it. Done." |

The corporate-aspirational voice is retired. We don't translate the old site verbatim into Dutch and call it a day; we rewrote it.

The **anchor slogan** is `Tech to serve people / Tech in dienst van mensen`. Everything below makes that slogan operational.

---

## 2. Audience (short version)

We write for three tiers, in this order:

1. **Primary: MKB beslisser / IT-lead.** 10–500 people, finds us via Google, decides in days. Concrete problem, no roadmap, no prior knowledge of Conduction. Wants a clear answer and a route to *install from the Nextcloud app store*.
2. **Secondary: Overheid-beslisser.** Municipalities and joint arrangements; majority of the existing customer base. Comes via relationships, decides in months through procurement, needs compliance signals (BIO, WOO, AVG).
3. **Tertiary: developer / integrator.** OSS contributors, system integrators. Lands via GitHub or `docs.conduction.nl`, wants the API spec and the licence in one click, has zero patience for marketing copy.

We write for the primary, never alienate the secondary, get out of the way of the tertiary. Full version: [`preview/identity/audience.html`](../preview/identity/audience.html).

---

## 3. Languages

**Dutch and English are both required, equal in weight.** Every public surface ships an NL form and an EN form. For the docusaurus-based sites, NL lives under `i18n/nl/` and EN under `src/pages/`. NL is canonical for MKB and government audiences; EN is canonical for developers and international partners.

Don't translate one as an afterthought. Write both with the same care, then read each one out loud on its own. If the EN version reads like a translation, rewrite it in English. If the NL version reads like a translation, rewrite it in Dutch. The two forms can, and often should, pick different metaphors and rhythms.

### Person and address

- **NL: address the reader as `je` / `jij`. Never `u`.** Government-formal `u` belongs in the inkoop register, which we do not use.
- **EN: second person (`you`).** No royal `we` aimed at the reader.
- **First-person plural (`we / wij`)** for the company. Singular `I` only on personal blog posts and signed essays.
- **Subject is a person, never a system.** `Je`, `jij`, `we` beats `de Oplossing` or `het systeem` every time. Even when the system does the work, write from the user.

### Spelling

- **EN: pick American or British, stick to it within a page.** Don't mix `organisation` and `organize` on one page.
- **NL: Nederlandse spelling 2005, Groene Boekje.** No Vlaamse alternatives unless the audience is explicitly Belgian. `e-mail` (not `email`), `online`, `app store` (two words, lowercase).

### Loanwords and English in Dutch copy

The market we write to has absorbed a chunk of English into daily Dutch IT speech. We use those loanwords where they read natural to a Dutch IT-lead, and translate where they don't.

| Keep in English (in NL copy) | Translate to Dutch |
|---|---|
| `app store`, `dashboard`, `workspace`, `audit log`, `webhook`, `commit`, `pull request`, `lock-in`, `open source` | `aanbestedingstraject` (not `procurement track`), `inkoop` (not `procurement`), `overheid` (not `government`), `gemeente` (not `municipality`), `inwoner` (not `citizen` when the context is Dutch civil law) |
| Brand and product names, never translated: `OpenRegister`, `OpenCatalogi`, `OpenConnector`, `DocuDesk`, `MyDash`, `ZaakAfhandelApp`, `ConNext`, `Common Ground+`, `Nextcloud` | Compliance frameworks, keep the Dutch acronym in NL: `Woo` (NL) / `WOO` (EN), `BIO`, `AVG` (NL) / `GDPR` (EN) |

**Each language stands alone. Don't mix.** EN copy is pure English; NL copy is pure Dutch (with the IT loanwords above, which are how Dutch IT-leads actually talk). Don't drop Dutch nouns into English prose for local flavour, and don't sprinkle marketing English (*insights, journey, streamlined*) into Dutch text. If a Dutch concept needs to appear in English copy, describe it in plain English: *gemeente* becomes *municipality*, *inwoner* becomes *citizen* or *resident*, *overheid* becomes *government*. The exceptions are tiny and listed in §4.5.

---

## 4. What Conduction sounds like (the positive markers)

The earlier sections explain why the spec exists. This section is the *target*. If a piece of copy hits these markers, it's recognisably Conduction. If it hits none of them, it's not yet brand copy, no matter how clean the punctuation.

The thread that runs through every marker below is **directheid**: concrete, plain, to the point, no decoration. That's not a marketing choice, it's a Dutch one. The reader we are writing for talks this way at lunch and expects to be talked to this way on a website. A Conduction page sounds like an MKB-IT-lead in Amsterdam explaining their stack across the table. Make the copy match.

The markers are observable in the live site today. Use them as a checklist before publishing.

### 4.1 Concrete + dismiss

Almost every Conduction lede pairs a specific number or fact with a refusal of the alternative.

- *"Same code, same licence, no procurement track required."*
- *"Open-source, no consultancy track, no lock-in."*
- *"Two-minute install. Admin required."*
- *"Free apps. Optional support. No upgrade nags."*

State what you get, then list what you don't have to do. The dismissal is doing as much work as the offer; the reader hears *"I have an objection, they already knew it"*. This is the single most reliable Conduction signature.

When you write a new lede, name the procurement-team objection and dismiss it.

### 4.2 The fragment-stop rhythm

Three short fragments, each a complete thought, ending with a hard stop.

- *"Pick an app. Install it. Done."*
- *"Tech to serve people. One workspace. Twelve apps."*
- *"Find us, write us, drop by."*
- *"Geen workshop. Geen lock-in."*

Length: 3–7 words per fragment, 2–4 fragments total. The rhythm is musical; you can read it as iambs. If it stumbles when you say it out loud, it isn't done yet.

### 4.3 Numbers as default

We default to digits where competitors default to adjectives. *Twelve apps*, *2 minutes*, *€0*, *€250 per component per month*, *73 member municipalities*, *1016 RR Amsterdam*, *EUPL-1.2*, *ISO 27001:2022*. Compliance frameworks always cite the version year.

A Conduction page reads like a product spec sheet wearing marketing clothes. If a section has zero numbers, it's probably hiding behind adjectives. Add at least one quantifier per section.

### 4.4 The anti-funnel voice

The most identity-defining trait we have is the open refusal of the standard sales-marketing playbook.

- *"We don't send sales after an issue, only a commit."*
- *"Use Conduction without ever talking to Conduction."*
- *"Demo's doen partners, niet Conduction."*
- *"We're small on purpose. Every app has a named owner."*

This tone is unusual in Dutch government IT and rare in MKB SaaS. It is a feature, not a bug. When in doubt, write the sentence the marketing team would never approve, then check it against the rules.

### 4.5 Each language stands alone

NL copy is pure Dutch. EN copy is pure English. We do not sprinkle Dutch nouns into English prose for local flavour, and we do not drop English marketing words into Dutch text beyond the established IT loanwords listed in §3.

If an English-language reader hits an unexplained Dutch word in our copy, we have failed. The exceptions are tiny:

- **Brand and product names** (§7.5) keep their original form in both languages: *OpenWoo*, *ZaakAfhandelApp*, *Nextcloud*, *Common Ground+*, *ConNext*.
- **Compliance acronyms** (§7.4) function as proper nouns: *WOO*, *BIO*, *AVG* (NL only) / *GDPR* (EN only). On first NL use, expand once: *Wet open overheid (Woo)*. On first EN use, expand once: *Open Government Act (WOO)*.
- **Direct quotes from official Dutch documents** stay in Dutch, in italics, with a one-line English summary on first reference. We are quoting; we are not borrowing.

What this rules out:

- *"We focus on the gemeentesecretaris's perspective."* becomes *"We focus on the municipal secretary's perspective."*
- *"Every Dutch gemeente runs the same registers."* becomes *"Every Dutch municipality runs the same registers."*
- *"It supports Common Ground's principles, like data aan de bron."* becomes *"It supports the Common Ground principle of single-source data."*

NL follows the inverse rule. *"Onze cutting-edge solution biedt deep insights"* is not Dutch and not English. It is brochure-speak. Use *"oplossing"* (only as a customer-side translation, see §7.1), *"inzicht"*, *"resultaat"*. Marketing English isn't a Dutch loanword.

### 4.6 Person-named ownership

Bios use first names, direct phone numbers, and a one-line personality.

- *"Curious by default. Tests every market move and keeps the rest of the team sharp on what users actually want."*
- *"He gets things done."*
- *"Sharp eye, dedicated developer. Loves puzzling through code until the answer is the right one."*

The same applies to support copy: *"Mail and phone are covered Monday through Friday, 9:00 to 17:00. Most questions get a same-day reply."* A reader should be able to picture who answers the email.

### 4.7 Compliance as offhand fact, not headline

*"Open-source, GDPR-compliant, free to install from the Nextcloud app store."* The compliance claim sits in the third clause, between commas, never as the lead.

This is deliberate. Government-IT competitors lead with compliance because it is the only thing they ship. We lead with the install verb because compliance is table stakes for us. The framing tells the reader where compliance sits in our priorities: ground floor, not penthouse.

When you write a compliance-heavy page (ISO, BIO, WOO), keep the lede on what the reader does. The compliance evidence comes after, on its own line.

### 4.8 The recognisability test

Before publishing, cover the logo and the URL. Read the first paragraph. If a stranger could plausibly attribute it to a generic Dutch IT vendor, it is not yet Conduction copy. Rewrite until at least two of §4.1–§4.7 are present.

Two markers per page is the minimum target. Hero pages and the homepage typically hit five or six.

---

## 5. The seven rules of tone

These exist on the rendered voice page; they are repeated here because this file is the spec. The rendered version may add visual examples; this list is authoritative if they diverge.

1. **Subject is a person, never a system.** *"Je"*, *"jij"*, *"we"* beats *"de Oplossing"* or *"het systeem"*.
2. **Verbs are actions, not nominalisations.** *"Genereer documenten"* beats *"biedt documentcreatiefunctionaliteit"*. Active voice always.
3. **Result before motivation.** Drop the *"Als gebruiker wil ik X zodat Y"* template. Lead with the result. Keep the motivation only when it adds something.
4. **Under 16 words per sentence.** If a sentence runs longer, split it. Two short sentences read faster than one long one, and each claim is individually verifiable.
5. **Jargon needs context.** *WOO-coördinator?* Fine, but explain on first mention. *SAML?* Fine in a tech context. *Ketensamenwerking?* Never.
6. **Abbreviations: full on first use, abbreviated after.** *"Wet open overheid (Woo)"* the first time, *"Woo"* thereafter. Don't make readers Google.
7. **One claim per sentence.** Strings like *"snel, schaalbaar, veilig en betrouwbaar"* get skipped. One claim, one sentence, in any order the reader can verify.

The eighth rule, sometimes treated as part of the set, lives in §11 (Punctuation): no em-dashes, no Title Case, no double-dashes in prose.

---

## 6. Sentence and paragraph rules

- **≤ 16 words per sentence.** Hard limit at 24. If you need more, you have two ideas, split them.
- **Average paragraph 2–4 sentences.** Long paragraphs hide claims. Short paragraphs let the reader land between them.
- **Active voice always.** *"OpenConnector validates the input"*, not *"the input is validated by OpenConnector"*. Passive voice belongs in legal copy.
- **No nominalisations.** Replace *"the configuration of the application"* with *"configuring the app"*; *"het uitvoeren van de installatie"* with *"installeren"*.
- **Concrete numbers beat adjectives.** *"twelve apps"* beats *"a comprehensive suite"*. *"€250 per component per month"* beats *"affordable"*. *"two-minute install"* beats *"easy to set up"*.
- **Lead with the verb where you can.** *"Install from the Nextcloud app store"* beats *"You can install it from the Nextcloud app store if you want to"*.
- **No throat-clearing openers.** Cut *"It is worth noting that…"*, *"In today's fast-paced world…"*, *"As we all know…"*. Full pattern list in §12.3.
- **Hedging adverbs are rationed.** *"Perhaps"*, *"potentially"*, *"arguably"*, *"essentially"*, *"fundamentally"*, *"notably"*. One per page is generous; one per paragraph is a tell. Full list and replacements in §12.4.

---

## 7. Vocabulary

### 7.1 Banned words

These signal that a sentence is hiding behind generic language. If you can delete the word and the sentence still works, it was noise.

`Digitale transformatie` · `Ketensamenwerking` · `Waardevolle inzichten` · `Toekomstbestendig` · `State-of-the-art` · `Platform dat…` · `Synergie` · `Proactief meedenken` · `Kernel` · `Holistic` · `Cutting-edge` · `Best-of-breed` · `Empower` · `Seamless` · `Robuust` · `Schaalbaar` (as standalone claim).

Two notes:

- **`Oplossing`** is fine as the customer-side translation of *"solution"*. It is never our generic product term. We have **apps** and **solutions**, never *"de Oplossing"* as a stand-in for *"our product"*.
- **`Kernel` → `workspace`.** *Kernel* reads as OS jargon and locks out MKB readers. Nextcloud already calls itself a workspace; we cite that. Use *"twelve apps, one workspace, all open-source"*, not *"twelve apps · one kernel"*. In API names, the centre slot is `slot="apex"`.

### 7.2 Apps versus solutions

Two different things, two different words. Mixing them is the most common copy bug we ship.

- **App**: software we build and ship. Concrete, installable, has a version number, has a status (Stable, Beta, Coming soon). *OpenCatalogi, OpenRegister, OpenConnector, DocuDesk, MyDash, ZaakAfhandelApp.*
- **Solution**: a concrete outcome built on apps. A goal, not a download. *WOO compliance, citizen case status, software catalogue, BI on registers.*

Never write *"onze WOO-app"*. There isn't one. Write *"onze WOO-solution, gebouwd op OpenCatalogi, OpenConnector en DocuDesk"*.

### 7.3 Brand glossary

| Term | Meaning | Notes |
|---|---|---|
| **Conduction** | The Dutch open-source product company. Lauriergracht 14h, Amsterdam. | The umbrella brand. Speaks to government, MKB, partners, and the OSS world equally. |
| **Public Tech** | Conduction's positioning eyebrow. *Tech to serve people.* | Eyebrow on heroes, not a product name. |
| **Tech to serve people / Tech in dienst van mensen** | The anchor slogan. | Cite this whenever a stakeholder asks for a tagline. |
| **ConNext** | The Conduction product brand for the Nextcloud-app ecosystem, MKB-flavoured. | Always written `Con` + a `Next` in `--c-nextcloud-blue` (use `<span className="next-blue">Next</span>`). |
| **Common Ground+** | The same apps, framed for Dutch government with WOO and BIO compliance signals up front. The "+" is the workspace layer the official model leaves blank. | The plus sign is part of the name; render it via `<CommonGroundPlus />`. |
| **Common Ground** | The VNG-led architecture for Dutch local-government IT, six principles, five layers, governed by VNG Realisatie. We respect it as the predecessor and cite it accurately. | When we say *"Common Ground+"* we are extending it; never replace it with *"Common Ground 2"* or *"Common Ground Next"*. |
| **Technical Core** | The category of apps that hold typed data, integrations, document handling, theming, dashboarding. | OpenRegister, OpenCatalogi, OpenConnector, DocuDesk, NLDesign Theme, MyDash. |
| **Workspace Apps** | Per-team productivity apps. PipelinQ, Procest, DeciDesk, ShillinQ, LarpingApp, SoftwareCatalog. |
| **Solutions** | Pre-configured outcomes (WOO publication, citizen case status, software catalogue, …). |
| **Integrated Apps** | Third-party open source we ship as ExApps next to Nextcloud (OpenTalk, Matrix, Mattermost, n8n, Windmill, OpenProject, XWiki, GitLab, …). Written exactly as the upstream project writes itself. |
| **Digital Socials** | What we call ourselves internally and on `/about`. *We started Conduction in 2019 to bring open-source thinking to Dutch government IT. We call ourselves Digital Socials.* | Use sparingly and always with the *why* attached. |

### 7.4 Compliance terms (NL ↔ EN)

| NL | EN | Use as |
|---|---|---|
| Woo (Wet open overheid) | WOO (Open Government Act) | Capitalised in EN; lowercase-acronym `Woo` in NL after first use. |
| AVG (Algemene Verordening Gegevensbescherming) | GDPR | Always GDPR in EN, never *"the AVG"*. |
| BIO (Baseline Informatiebeveiliging Overheid) | BIO | The acronym is identical in both languages; expand on first NL use. |
| ISO 27001:2022 / ISO 9001:2015 / ISAE 3402 / NEN 7510 | Same | Always cite the version year. |
| EUPL-1.2 | Same | Our default licence; spell it `EUPL-1.2`, never *"EUPL"* alone. |
| Programmaplan Common Ground 2025 | Same | Don't translate official document titles. |

### 7.5 Brand and product names

- **Capitalised exactly as the source spells them.** *OpenCatalogi*, *OpenRegister*, *Nextcloud* (one word, capital N), *GitLab*, *Mattermost*, *XWiki*, *Keycloak*. Never *Open Catalogi*, *Next Cloud*, *Git Lab*.
- **Never translate them.** *OpenWoo* stays *OpenWoo* in EN; *ZaakAfhandelApp* stays *ZaakAfhandelApp* in EN. The product name is the product name.
- **Acronyms in product names**: *ZaakAfhandelApp* (`ZAA`), *KlantContactApp* (`CSA`), *DocuDesk*, *MyDash*, *PipelinQ* (one word, no space, capital Q at the end).
- **`Nextcloud` always renders in brand blue** in HTML/MDX surfaces: `<span className="next-blue">Nextcloud</span>`. In plain markdown / READMEs, leave it as plain text.

---

## 8. Slogan rules

Slogans are the most-quoted form of the brand. They appear on heroes, CTA banners, eyebrows, business cards, decks, and tender summaries. The constraint is brutal: a slogan that fails the rules below leaks the AI-generic voice we are trying to shed.

### 8.1 The formula

A Conduction slogan is **two or three self-contained fragments, each ending with a period or strong stop, building from concrete to evocative**.

```
[concrete action / count]. [container or context]. [outcome or stop].
```

Worked examples (all live in production today):

- *Pick an app. Install it. Done.*
- *Tech to serve people. One workspace. Twelve apps.*
- *Twelve apps. All open source.*
- *An eight-year-old vision. A two-minute install.*
- *Install your stack. In two minutes.*
- *Find us, write us, drop by.*
- *Schemas you write once.* (one fragment, where the noun does enough work)
- *Geen workshop. Geen lock-in.* (NL, same shape)

### 8.2 Length

- **Hero title slogan:** ≤ 8 words per fragment, ≤ 18 words total.
- **Eyebrow:** ≤ 7 words, sentence-cased or lowercase-with-middot (`Public Tech · open-source apps for Nextcloud`).
- **CTA banner title:** ≤ 12 words.
- **Business-card / stationery tagline:** ≤ 6 words. *"Tech to serve people."*

### 8.3 Construction rules

- **One claim per fragment.** *"Fast, secure, scalable, and trusted"* fails. That's four claims. Pick one and prove it later.
- **Concrete > abstract.** *"two minutes"* beats *"quickly"*; *"€0"* beats *"affordable"*; *"twelve apps"* beats *"comprehensive"*.
- **No throat-clearing.** No *"At Conduction we believe…"*, no *"Imagine a world where…"*.
- **No future-perfect promises.** The 2035 vision tagline from the old site (*"By 2035, Conduction ensures…"*) is retired. We promise things we can ship this week.
- **No alliterative gimmicks.** *"Powerful, performant, public"* reads like a stock-photo banner.
- **Rhythm matters.** Read the slogan out loud. If it stumbles, rewrite it.
- **NL ≠ verbatim EN.** A slogan that works in NL may need a different image in EN. *"Geen workshop. Geen lock-in."* maps to *"No methodology workshop. No lock-in."*: same shape, slightly different word count.

### 8.4 Where each kind of slogan goes

The rendered slogan inventory at [`preview/identity/slogans.html`](../preview/identity/slogans.html) groups the working set by surface. Reuse from there before inventing a new one. The categories:

1. **Triggers**, why an MKB-beslisser would click. Hero, lede, first eight seconds.
2. **Positioning**, why Conduction is Conduction. Hero, About, first paragraph.
3. **Products**, apps versus solutions. Section heads, navigation, taglines.
4. **App and solution heros**, concrete proposition per app. Detail-page H1.
5. **CTA buttons**, verb + object, no vague exhortations.

Adding a new slogan: under sixteen words, one claim, no banned words, NL + EN form, plus a short *why*. Append a card to `slogans.html` with the surfaces it's used on.

### 8.5 Banned slogan patterns

| Pattern | Example | Why we drop it |
|---|---|---|
| The future-perfect vision | *"By 2035, Conduction ensures that all residents of the Netherlands automatically receive the government services they are entitled to."* | Too long, too distant, too abstract, makes a promise we can't ship today. |
| The four-adjective stack | *"Democratic, inclusive, transparent, understandable, and affordable software."* | Five claims in one sentence, none individually verifiable. |
| The metaphor mash-up | *"State-of-the-art platform that drives synergy through holistic, future-proof workflows."* | All banned words at once. |
| The audience-segmented intro | *"Whether you're a potential employee, a client, an IT company, or even a competitor, we're glad you're here!"* | Reads like a corporate brochure; signals to the reader they're being marketed to. |
| The aspirational tagline with no object | *"Building a better digital world for citizens."* | "Better" carries no claim a reader can verify. Replace with a concrete action: *"Tech to serve people."* |

---

## 9. Headlines, eyebrows and section heads

Every section in the docusaurus sites has the same three-part shape, and the copy follows the same rules everywhere:

```
<eyebrow>     ← 1–4 words, sentence-case, no period, ALL-CAPS via CSS only
<title>       ← 3–10 words, sentence case, ends with period
<lede>        ← 1–3 sentences, sets up what's below
```

Examples from the live site:

| Eyebrow | Title | Lede |
|---|---|---|
| `Public Tech` | `Tech to serve people. Open-source, plain Dutch.` | *We started Conduction in 2019 to bring open-source thinking to Dutch government IT. (…)* |
| `What we believe` | `A few opinions, in order.` | *A platform earns its place by getting out of the way. These are the principles that drive how we build.* |
| `Compliance` | `ISO 9001:2015 and ISO 27001:2022.` | *Quality management and information security, audited yearly, recertified every three years.* |
| `Contact` | `Find us, write us, drop by.` | *The office sits on Lauriergracht in the canal belt. Mail and phone are covered Monday through Friday, 9:00 to 17:00.* |

### Rules

- **Sentence case for headlines, not Title Case.** Capitalise only proper nouns and the first word.
- **Headlines end with a period.** A title is a statement. The period closes it.
- **Eyebrows do not.** Eyebrows are labels.
- **No emoji in headers.** Decoration belongs to the design system, not the copy. Emoji-decorated headers (the old site's *"🧙 Who is Conduction?"*) are retired.
- **No questions as headlines** unless the page is a FAQ. *"Why Conduction?"* is allowed only in a FAQ context.
- **No ALL-CAPS body copy.** Eyebrows and code labels can be uppercased via CSS (`text-transform: uppercase`); the underlying text stays sentence case.

---

## 10. Body copy patterns

### 10.1 Lede

The first paragraph after a title. Sets up what's below in 1–3 sentences. Must work as a standalone summary if the rest of the section gets collapsed.

> *We are Conduction. We build open-source apps that plug into Nextcloud. Catalogs, registers, document handling, integrations. Install yourself, host with us as SaaS, or bring in a partner. Same code, same licence, no procurement track required.*

### 10.2 Bullets

- **One claim per bullet.** Bullets that join three claims with commas should be split or rewritten as a sentence.
- **Parallel structure.** Either every bullet starts with a verb, or every bullet starts with a noun. Don't mix within a list.
- **Bold the trigger word, then explain.** *"**Open by default.** Every app is EUPL-1.2 on GitHub. (…)"*
- **Six bullets is the practical maximum** before the reader skims past. If you have ten, you have two lists.

### 10.3 Tables

- **Use them when the data is two-dimensional**: layer + component + app + outcome; framework + NL + EN + use.
- **Header row in sentence case.** Don't title-case headers inside a table.
- **Left-align text columns; right-align numbers.**
- **Cite the source under the table** if the numbers come from outside (VNG, BinnenlandsBestuur, ConsultancyNL).

### 10.4 Pull quotes

- One sentence, attributed.
- Source on the same line or on a `<cite>` element directly below.
- No decorative quote marks unless the surrounding visual treatment calls for them.

```html
<blockquote className="cg-pullquote">
  "Vendor lock-in blijft bestaan."
  <cite>VNG, Programmaplan Common Ground 2025, risk register #9</cite>
</blockquote>
```

### 10.5 Numbers and dates

- **Years in full**: 2026, not '26.
- **Currency with the symbol prefixed and no space**: €250, not 250 €. Plural is *"€250 per component per month"*, not *"€250s"*.
- **Times in 24-hour, colon-separated**: 9:00 to 17:00. Never *"9 AM"*.
- **Phone numbers**: *+31 (0)85 303 6840* with the country code, the optional zero in parens, and groups of three digits.
- **Dates**: in NL `8 mei 2026`; in EN `8 May 2026` or `2026-05-08`. Never `05/08/2026` (ambiguous).
- **Counts**: spell out one through twelve in prose (*twelve apps*); use digits from 13 onwards (*73 member municipalities*). Statistics inside a `<StatsStrip>` always use digits regardless: `12`, `2 min`, `€0`.

---

## 11. Punctuation (the AI tells)

These rules exist because they are the dead giveaways of LLM-generated copy. Conduction copy reads like a person wrote it, so:

- **No em-dashes (`—`).** Replace with a period, comma, colon, or parenthesis. A short follow-up sentence is almost always better than an em-dashed aside. Example fix: *"This is the single most reliable AI tell — drop it."* becomes *"This is the single most reliable AI tell. Drop it."* (the em-dash is preserved in the *before* example because it's the violation we're showing).
- **No double-dashes (`--`) in prose.** They only belong in CSS variable names, code, and CLI flags.
- **En-dashes (`–`) only for numeric ranges.** *"10–500 medewerkers"*, *"32–56 px"*. Never as a sentence-level pause.
- **Sentence case for headings**, not Title Case.
- **No ALL-CAPS body copy** (see §9).
- **Straight quotes in HTML and MDX source** (`"..."`), curly quotes only when a typographic surface explicitly calls for them (print, decks). Don't mix on a single page.
- **Oxford comma is optional and follows EN convention on the page.** Pick once per page and stick to it.
- **Ellipses are three periods, no spaces** (`...`), used sparingly. Never as a stylistic trail-off.
- **Bullet points end with a period only if they are full sentences.** Fragment bullets do not.

---

## 12. AI vocabulary, phrases and rhythm

§11 catches the punctuation tells. This section catches the vocabulary, phrase patterns, and rhythm habits that have become shorthand for *"a language model wrote this"*. The list is current as of 2026; it will need updating as the underlying models drift.

If a sentence in your draft contains any item below, the burden of proof is on the sentence. Either rewrite, or be ready to defend the choice.

### 12.1 Banned LLM verbs

These verbs read as filler. They almost always stand in for a stronger, more specific verb. Pick the specific one.

| Banned | Use instead |
|---|---|
| `leverage` | use, with, build on, lean on |
| `navigate` (metaphorical: *navigate the complexities*) | handle, work through, deal with, get through |
| `unlock` (in *unlock value, unlock potential*) | open up, give access to, or just delete the verb |
| `foster` | build, grow, encourage |
| `harness` | use, run on, apply |
| `streamline` | simplify, shorten, cut |
| `optimize` (when not a measurable engineering term) | tune, improve, fix |
| `enhance` | improve, extend, add to |
| `facilitate` | help, run, host, support |
| `ensure` | make sure, guarantee, deliver |
| `elevate` | raise, lift, improve |
| `bolster` / `fortify` | strengthen, back up |
| `embark on` (a journey, a transformation) | start, begin |
| `delve` / `dive into` | look at, study, work through |
| `drive` (in *drive engagement, drive results*) | cause, produce, lead to |
| `deliver` (as filler in *deliver value*) | ship, build, give |
| `empower` | already banned in §7.1 |

`Optimize`, `harness` and `drive` are fine in their literal engineering meanings: *optimize for cache locality*, *harness GPU compute*, *drive an outcome through OpenConnector*. They become tells when they replace plain verbs in marketing prose.

### 12.2 Banned LLM nouns and adjectives

| Banned | Use instead |
|---|---|
| `robust` | reliable, tested, stable, or just give the metric |
| `vital` / `crucial` / `key` (as filler adjectives) | important, central, or delete |
| `comprehensive` | full, complete, or list the parts |
| `strategic` (as filler) | delete, or say what makes it strategic |
| `innovative` (as filler) | new, novel, or describe what changed |
| `realm` (in *the realm of X*) | the world of, or just `X` |
| `tapestry` (in *rich tapestry of*) | mix, range, or list |
| `landscape` (metaphorical: *the X landscape*) | the X market, the X scene, or list the players |
| `journey` (the X journey) | the X process, the X work, or describe the steps |
| `ecosystem` (when not concrete) | the apps, the tools, or list them |
| `complexities` / `intricacies` / `nuances` (as filler) | the details, the trade-offs, or describe one |
| `cutting-edge` / `state-of-the-art` | already banned in §7.1 |

### 12.3 Banned phrase patterns

These sentence shapes are AI signatures. Each one has a fix.

| Pattern | Why it fails | Replacement |
|---|---|---|
| *"Not just X, it's Y."* / *"Not merely X, but rather Y."* | The signature LLM pivot. Filler dressed as insight. | Just say Y. *"Not just an app, it's a workspace"* becomes *"It's a workspace."* |
| *"It's worth noting that…"* / *"It's important to note that…"* | Pure throat-clearing. The reader will note it without permission. | Drop the prefix. State the thing. |
| *"In essence,"* / *"At its core,"* / *"Fundamentally,"* | Signals the writer is about to say what they should have said three sentences ago. | Delete the prefix and tighten the previous sentence. |
| *"In conclusion,"* / *"Ultimately,"* / *"In short,"* | A summary the reader doesn't need; the section already ended. | Cut the closer. |
| *"In today's [adjective] world / landscape"* | Generic scene-setter, never adds information. | Cut, or name the actual change. *"In today's rapidly evolving digital landscape"* becomes nothing. |
| *"navigate the complexities of"* | Two banned words in five. | *"work through"*, or describe the specific complexity. |
| *"in the rapidly evolving X"* | Cliché framing; nothing rapidly evolves the same way for everyone. | Name the specific change and the year. |
| *"First, … Now let's turn to … Finally,"* | Signposting that belongs in slide notes, not prose. | Use headings. The structure is the signpost. |
| *"This isn't just about X, it's about Y."* | Cousin of the *not just* pivot. | Pick X or Y. Write one sentence. |
| Closing every paragraph with *"The result: …"*, *"This means …"*, *"In short …"* | Reads as a summary loop. Once is fine, every paragraph is a tell. | Trust the reader. Cut the takeaway when the paragraph already made the point. |

### 12.4 Hedging adverbs

Use sparingly, never as a habit. One hedge per page is generous; one per paragraph is a tell.

`perhaps` · `potentially` · `arguably` · `essentially` · `fundamentally` · `notably` · `indeed` · `certainly` · `truly` · `simply` · `clearly` (when used to dismiss debate)

If you need to hedge, prefer a concrete clause that explains *why* you are hedging: *"on most installs"*, *"in our experience with municipalities"*, *"under the current spec"*. These tell the reader something. Bare hedges tell them nothing.

### 12.5 Rhythm tells

A model trained on millions of articles falls into rhythms no human writes consistently. Read your draft out loud and watch for these:

- **Tricolon-on-everything.** *"Fast, simple, and reliable. Open, transparent, and free. Stable, audited, and trusted."* Three things in a row, every sentence. Break the pattern; vary the count.
- **Alternating short-long-short.** *"It works. The integration runs through OpenConnector with audit logging on every call. We tested it."* Once is fine. Three paragraphs in a row is a tell.
- **Bold-first-word-of-every-bullet.** Treats every list item as a labelled definition. Use bold only when the trigger word does real work; not as a default formatting style.
- **Identical sentence shape down a list.** *"OpenRegister handles X. OpenCatalogi handles Y. OpenConnector handles Z."* Vary the verb or the structure on at least one item.
- **Mirrored-clause closers.** *"Not for the procurement officer, but for the person who installs it."* / *"Not a methodology, but a workspace."* Fine occasionally; once per page, not once per section.
- **The takeaway-coda.** Most LLM paragraphs end with a one-line summary that restates the paragraph. Cut it. The reader caught it the first time.

### 12.6 The detection test

Before publishing, paste the first three paragraphs into [GPTZero](https://gptzero.me/) or a similar detector. The result is noisy, but useful as a tripwire: a 70%+ AI score on prose you wrote yourself means the rhythm is leaking through. Rewrite the highest-scoring paragraph by hand. Re-test.

Detectors miss things humans catch and catch things humans don't, so this is a tripwire, not a verdict.

---

## 13. CTA copy

CTAs carry more weight per word than any other surface. Get them wrong and the install button reads as marketing noise.

### Rules

- **Verb + object.** *"Install from the Nextcloud app store"*, not *"Get started"*. *"Read the ISO page"*, not *"Learn more"*.
- **Three-tier hierarchy on hero CTAs.** Primary (filled), secondary (outline), tertiary (ghost or link). A hero never has more than three.
- **Primary CTA is always the most concrete action.** Usually *"Install from app store"* or *"Talk to a partner"*. Never *"Contact us"*. That's a tertiary at best.
- **Tertiary CTA is for the developer audience.** *"View on GitHub"*, *"Read the docs"*, *"View the schema"*.
- **No "Submit", "Click here", "Continue".** They tell the reader nothing.
- **Match NL and EN exactly in shape.** *"Install from the Nextcloud app store"* ↔ *"Installeer uit de Nextcloud app store"*. The button length should be similar in both languages so the layout doesn't break.

### CTA verb canon

| EN verb | NL verb | Used for |
|---|---|---|
| Install | Installeer | App store, downloadable apps |
| Run | Start | Local demo, dev environments |
| View | Bekijk | GitHub, schema, certificate |
| Read | Lees | Docs, ISO page, blog post |
| Browse | Bekijk alle | Catalogues |
| Talk to | Praat met | Partners, support |
| Book | Boek | Demo (only via partner) |
| Apply | Aanmelden | Partner programme, careers |
| Open | Open | Maps, external resources |
| Mail | Mail | Direct email links |
| Call | Bel | Direct phone links |

---

## 14. Microcopy

The labels users hit dozens of times per day. Microcopy that drifts is worse than microcopy that's wrong, because nobody notices until a thousand pages are inconsistent.

### Status labels

Single-word, uppercase via CSS, always one of:

`STABLE` · `BETA` · `ALPHA` · `EXPERIMENTAL` · `DEPRECATED` · `COMING SOON`

In Dutch surfaces these stay in English (they're shipped status labels).

### Version pills

`v3.1 · NL · EN`: version, then locales. Locales separated by middot. Version always with a `v` prefix and a dot, never `V3` or `3.1.0` in user-facing copy (the latter is for changelogs).

### Empty / loading / error states

- **Empty:** state what's empty + the next step. *"No registers yet. Create one to get started."* / *"Geen registers. Maak er een aan om te beginnen."*
- **Loading:** active verb, no spinner-text. *"Loading…"* / *"Laden…"* are fine. *"Please wait while we fetch the data…"* is too much.
- **Error:** what went wrong + what the user can do. *"Couldn't reach the server. Check your connection or try again."* / *"Server niet bereikbaar. Controleer je verbinding of probeer het opnieuw."*. Never *"An unexpected error occurred"*.

### Tooltips and hint text

- ≤ 12 words.
- One sentence, no period.
- Tells the reader something the surrounding UI doesn't.

### Form labels

- Sentence case, no colon. *"Email address"*, not *"Email Address:"*.
- Required fields marked with `*` after the label.
- Helper text below the input, not inside it.

---

## 15. Accessibility and inclusivity

- **Plain language is an accessibility feature.** WCAG 2.2 doesn't mandate a specific reading age, but the seven rules in §5 keep us comfortably under B1 / 9th-grade level for both NL and EN. Use [`accessible.org/readability`](https://www.accessible.org/readability/) or `hemingwayapp.com` to check.
- **Don't address the reader by ability.** *"Even a beginner can use this"* lands as condescending. Just describe what the thing does.
- **Gender-neutral by default.**
  - EN: *"they / them"* for an unknown user. Avoid *"his/her"*.
  - NL: *"die / hun"* where it reads naturally. *"De gebruiker maakt zijn/haar account"* → *"Maak je account"* (second-person sidesteps the issue entirely, which is preferred).
- **Avoid metaphors that don't translate.** *"Hit a home run"*, *"in de zevende hemel"*, *"thuis komen op de fiets"*. Use plain verbs instead.
- **Image alt text follows the same voice rules.** Concrete, ≤ 16 words, describes what the image conveys, not what it depicts pixel-by-pixel. Decorative images get `alt=""`.
- **Link text is meaningful out of context.** *"Read the ISO page"*, not *"click here"*. Screen-reader users tab through link lists; *"click here"* lists give them nothing.

---

## 16. Page-level copy patterns

Every public page on the docusaurus sites is composed from the same handful of components. Each component has a copy contract; sticking to it is what keeps the brand voice coherent across twenty surfaces.

| Component | Required copy | Length | Voice |
|---|---|---|---|
| `<Hero>` | `eyebrow`, `title`, `lede`, `primaryCta`, optional `secondaryCta` + `tertiaryCta` | Title ≤ 18 words, lede ≤ 50 words | Slogan formula in title; lede explains who and what. |
| `<StatsStrip>` | 4–5 stats: `value` + 1–2 line `label` | Value ≤ 6 chars, label ≤ 8 words | Numbers, not adjectives. |
| `<SectionHead>` | `eyebrow`, `title`, `lede` | Title 3–10 words, lede 1–3 sentences | See §9. |
| `<AppsPreview>` | `eyebrow`, `title`, `lede`, three apps (each: `name`, `tagline`, `status`, `version`) | Tagline ≤ 16 words | Tagline is a slogan, not a feature list. |
| `<FeatureList>` / `<FeatureItem>` | `title` (sentence ending with period), body (1–2 sentences) | Title ≤ 6 words | One claim per feature. |
| `<PairCard>` | `name`, `why` | Why ≤ 24 words | Plain statement of what the link goes to. |
| `<CtaBanner>` | `title`, `lede`, `primaryCta`, optional `secondaryCta` | Title ≤ 12 words | Slogan formula. |
| `<EmployeeCard>` | `name`, `role`, `bio` (1–2 sentences) | Bio ≤ 30 words | Personal, what the person *does* + a one-line of personality. |
| `<DetailHero>` (app pages) | `crumb`, `status`, `version`, `locales`, `title`, `tagline`, three CTAs | Tagline ≤ 30 words | First sentence is the slogan; second adds the niche. |

When inventing a new component, give it a copy contract in the same shape and add the row to this table.

---

## 17. Old voice → new voice (worked examples)

These are real before/after pairs from the site rewrite. Read them as a calibration set; if a new piece of copy doesn't *feel* like the right column, rewrite it.

| Before (`.github/website/`) | After (`conduction-website`) |
|---|---|
| *"At Conduction, we are driven by a vision that sees the digitization of the world as an extraordinary opportunity. It's a chance to transform our world into something more democratic, inclusive, and transparent."* | *"We are Conduction. We build open-source apps that plug into Nextcloud."* |
| *"Make the digital world a better place for its citizens by creating democratic, inclusive, transparent, understandable, and affordable software for citizens."* | *"Tech to serve people."* |
| *"Comprehensive user manuals and organizational information to understand our processes, methodologies, and company culture."* | *"How we work. Plain Dutch, plain English."* |
| *"Our commitment to quality and security standards through ISO certification."* | *"ISO 9001:2015 and ISO 27001:2022. Audited yearly, recertified every three years."* |
| *"Explore our suite of components and services. Detailed documentation about our solutions, technical specifications, and implementation guides."* | *"Twelve open-source apps. Pick what you need from the app store."* |
| *"For potential employees, you'll discover our unique culture, values, and ambitious mission to transform government services."* | *"We're small on purpose. Every app has a named owner. Every customer talks to a person."* |
| *"Are you passionate about making the digital world more democratic, inclusive, and transparent?"* | *"Find us, write us, drop by."* |

The pattern: drop one or two adjectives from the before column. Replace with a concrete number, a verb, or a stop. Read it out loud. Done.

---

## 18. Maintenance

This file is not frozen. The voice tightens as the company finds its register, and the rules here should follow.

### When to edit

- A new rule is being applied repeatedly across PRs. Write it down here.
- An existing rule is being broken on purpose for a recurring case. Capture the exception.
- A banned word becomes useful in a specific context. Add the exception (see *"Oplossing"* and *"Kernel"* in §7.1 for the model).
- A new product or sub-brand ships. Add it to §7.3 and §7.5.

### When to *not* edit

- A single piece of copy violated a rule and the rule still feels right. Fix the copy, not the rule.
- A specific stakeholder pushed back on a banned word. Bring it to the brand owner before changing the spec.
- An external trend (a new word for *"workflow"*, a new word for *"AI"*). Wait three months, see if it sticks, then decide.

### How to edit

1. Open a PR against `design-system/main`. The repo's house rule is *"commit and push to main after each task"*, but for spec changes we still use a PR so the diff is reviewable.
2. Update the canonical example in [`preview/identity/voice.html`](../preview/identity/voice.html) or [`preview/identity/slogans.html`](../preview/identity/slogans.html) if the rule has a rendered counterpart.
3. Update the short version in [`CLAUDE.md`](../CLAUDE.md) under *Writing style*. Keep it as a digest pointing back here.
4. Re-run the Playwright check on the design-system pages (per the project rule: every page edit gets a screenshot before commit).

### Brand owner

For now: Ruben van der Linde (founder + architect). Disagreements about taalgebruik land at `ruben@conduction.nl`. The voice is opinionated on purpose; the rationale is meant to win the argument, not the sender.
