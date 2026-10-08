# ConNext films: the bible

> **Revised 2026-09-27 after Ruben's decisions (supersedes the vertical version, kept as
> `bible-9x16.md`).** Every film is now **16:9 landscape, 1920 x 1080**. There is **no
> terracotta (brown)** anywhere. Accent words and the install call are **orange text, never
> black text in an orange box**. The word Nextcloud stays white. Portaliq uses its store icon.

## Decisions log (Ruben, 2026-09-27)

- Films: the ConNext film is direction A (one take); every app film is direction C (proof),
  built on the app-film template. All three storyboards were approved before the format change.
- The ConNext film also carries **a notification beat** (the right person hears about it) and
  **an assistant beat** (ask about your records, it only does what you allow).
- App films keep one general slot: Pipelinq shows the client page (data layer), Learniq the
  overdue reminder (notification).
- Learniq's opening frame gives the one orange to the rule that falls short.
- **Round 3 (Ruben, 2026-09-27, 16:9 storyboard):** the ConNext 16:9 storyboard (A16, 8
  scenes) is approved for animation. Films run **18.75 s (10 bars)**, not 15 s. The install call
  is **orange text as one whole line** (Nextcloud in orange there too; the white rule is for
  running copy). The notification beat keeps its full Nextcloud-blue frame. The assistant beat
  adds **"It asks first."** (the film may go to 32 words). The bell is the **Lucide bell**
  (`#icon-bell`). Learniq's two long lines are to be shortened. Animate ConNext first, then the
  app films.
- **Round 4 (Ruben, 2026-09-27, after watching the animated ConNext film):**
  - **Films are modular:** a shared **Conduction opening** (the same sting in front of every
    film), the film's own body, a shared **"Built on ConNext" closing piece** (the common data
    layer on Nextcloud and everything it connects to: Mail, Calendar, Tasks, Deck, Contacts,
    Files, Talk and more, only what really ships) and the shared **install board**, which adds
    "100% open source. Free to use. Pay for an SLA when your company grows." to the install call.
    Durations are set per module on bar boundaries; the 18.75 s total no longer binds.
  - **The opening:** a hex canvas in Conduction's identity; a ripple runs to a hex holding all the
    app icons, a second ripple turns them away (no rotation: step, scale or fade them off) and the
    company name appears. Its sound is electricity connecting (conduction): crackle, arc, hum,
    power-on. It is the showpiece.
  - **The ConNext body** gets a dedicated **flows** board (how you tie everything together: when
    this happens, do that, across apps; the customer draws the flow, never "pre-built") and a
    reworked **assistant** board: the apps give the assistant in Nextcloud both their data and the
    actions it may take, so you can act through your agent, and it always asks permission before it
    changes anything. Too high-level before; make the mechanism visible.
  - **App films** show the **app's own name** where the ConNext mark sits in the slides.
  - **Pipelinq's 16:9 storyboard is approved**; Learniq's is not yet.
  - The delivery master MP4 is committed under `brand/assets/films/` once a film is final.
- **Round 5 (Ruben, 2026-09-28, notes on the round-4 page):**
  - **No bell sound anywhere.** The sonic-logo bell (and the "boing" at the end of the opening)
    becomes a **click**: a crisp switch click. Every film, every module.
  - **Buildiq is out of the films** (it is being transferred to Nextcloud): not in the opening's
    app cluster, not in any honeycomb. The opening's heart is OpenRegister.
  - **"Open a client" (ConNext s1)** becomes a flow: a lead record starts, and a line diagram
    connects it to Mail, Calendar and the other Nextcloud apps at the bottom; the Nextcloud apps
    in Nextcloud colours.
  - **The notification scene** uses the same app-window design as Pipelinq, not a full
    Nextcloud-blue frame.
  - **Built on ConNext:** no green and no Nextcloud-coloured tiles (his note breaks off at "we
    should also"; ask what it was going to say).
  - **Install board as slogans:** "Install the app. Use the app. Own your data." and "Always 100%
    open source and free to use." No SLA line.
  - Assistant line "It only does what you allow.", Hermiq hex kept, flow trigger "contract
    signed", trim the ConNext film to about 45 words. Learniq still not approved. Push, then
    animate (ConNext first, then Pipelinq).
- **Round 6 (Ruben, 2026-09-28, notes on the round-5 film page):**
  - **No full stop at the end of any on-screen line**, in every film ("we don't do it anywhere else").
  - **Nextcloud's own apps may be drawn in Nextcloud blue** (Mail, Calendar, Contacts, Files, Talk,
    Deck, Tasks, ...); Conduction apps stay cobalt or white. Their names as text on cobalt use the
    brand's Nextcloud cyan #1CAFFF (3.7:1, headline size), because #0082C9 on cobalt is 2.2:1.
  - **Install board:** Conduction logo instead of the Nextcloud logo, a Conduction header (wordmark)
    instead of ConNext, no full stops. No store line.
  - **Start a lead:** straight corners on the line diagram (no rounded bends or dots); the Nextcloud
    components sit in the hex grid and load one by one; for each, a line under "Start a lead" with
    an action and the component, e.g. "Manage from Deck", the component name in Nextcloud cyan.
  - **Flows:** the final item must drop in fluidly.
  - **Notifications:** say what it is ("Instant notifications, desktop and mobile" or similar), and
    show a mobile push message and a desktop notification bottom left.
  - **Assistant:** say what it does: full Nextcloud Assistant integration; ask questions about your
    data, and the assistant prepares actions and suggestions (it only acts with your approval where
    the permission check applies; do not claim more than facts.json supports).
  - **Opening:** the final sound is a click, not a tonal ping ("boing").
  - Built on: nothing more to add. Enlarge "Always 100% open source and free to use"; tighten the
    empty half second before Built on builds.
- **Round 7 (Ruben, 2026-09-28): films are release films for the future.** Treat every
  feature in an app's specs (openspec), on development or in the positioning files as built.
  Unbuilt features MAY be claimed and shown. This supersedes the "only stable-release features"
  and "never show" rules for app and audience films. Brand and voice rules still apply.
  Apps get one film per audience where the story differs (plan in audiences/plan.md).


Every storyboard variant and every scene obeys this file. Sources are in
`story.json`, `social.json` (same folder) and the design-system clone at
`/home/rubenlinde/memcap-work/ds-connext-film`.

## The job

A 15-second vertical social film for ConNext by Conduction. It explains ConNext as
Nextcloud apps that work together, for the owner or IT lead of a business with 10 to
500 people (primary) and a government IT lead (secondary). Posted natively on LinkedIn
first, then Instagram Reels, TikTok, YouTube Shorts. English only for now.

It doubles as a showcase of motion design craft: choreography, timing, match cuts,
type that moves with intent. Not "everything fades in". Not "centred text on a
background". Every scene has a camera idea.

## Format and grid

- **1920 x 1080 (16:9), 24 fps, 18.75 s = 450 frames = 10 bars** per Ruben's round-3 decision.
  24 fps (the film standard) because 18.75 s at 25 fps is 468.75 frames; at 24 fps every bar is
  exactly 45 frames. 24 fps is accepted by LinkedIn (under 30), Meta and TikTok (23 to 60) and
  YouTube. No vertical or 4:5 cut.
- Musical grid: 128 BPM. A beat is 0.46875 s, a bar 1.875 s, and 18.75 s is exactly 10 bars.
  Cuts on beats, big moments on bars. Bars land exactly on frames (45 per bar); beats (11.25
  frames) snap to the nearest frame.
- **Text safe box: x 120 to 1800, y 96 to 930.** The bottom 150 px stay free of words for the
  player's controls and progress bar (LinkedIn, YouTube). Visuals may bleed full frame.
- **Layout grammar for 16:9:** type in a left column (x 120 to about 840, at most about 16
  characters per line at headline size), picture and UI in the right 55 to 60% (x 900 to
  1800). A one-take camera may centre the world, but a caption keeps its left column.
- Type: headlines 96 to 140 px, captions at least 64 px, Figtree 600 or 700, sentence case.
  A 1920-wide film plays at about 400 px wide in a phone feed: size for that.

## Mute first

- The story must read with the sound off. Sound is a bonus layer.
- Frame 1 is the hook and the thumbnail: a legible headline or subject on frame 1. No fade
  from black, no logo build-up.
- The brand (colours, a hex, the wordmark) is visible by 2 to 3 s, repeated on the end card.
- At least 3 shots or deliberate visual changes in the first 5 s, then a change every 1.5
  to 2.5 s (7 to 10 in total). Fast picture, slow text: a text line may span a shot change.
- Reading: hold each line for max(1.5 s, 0.4 s x words) after its last word is visible.
  At most 8 words and 2 lines per card. **20 to 30 on-screen words in the whole film,
  end card included.**
- Type: Figtree, 600 or 700, sentence case, tight tracking (-0.02 em). Contrast at least 4.5:1
  for body text (white on cobalt is 9.1:1); orange text only at headline size (see Brand).
- The loop: the last frame flows into frame 1 (same composition, colour or direction), so
  autoplay loops read as one move. No fade at either end.

## Brand rules (non-negotiable)

- Solid fills only. No gradients, glows, blur-glass, radial vignettes, 3D, isometric depth,
  photos, people or faces.
- Pointy-top hexes only, never rotated, not even as movement. Depth comes from size and
  opacity. Shadows 2D, blur 16 px max.
- One orange (#F36C21) per scene: the answer of the scene. Never a hex category, never a
  large fill. Exception: on a cobalt ground the app icon hex and the CTA may both be orange.
- **Orange is text, not a box behind text.** The accent word and the install call are set in
  KNVB orange at headline size (64 px or more, weight 700): 3.0:1 on cobalt and 5.9:1 on
  cobalt-900, which passes as large text. Never black or white text in an orange box or pill.
  Orange shapes (a hex, a marker, a tap ring) are still fine; orange text counts as the
  scene's one orange.
- **No terracotta (brown) anywhere**: not as a ground, not as a hex, not as a file pip. The
  documents family is out of the films; Filinq's hex is cobalt like every app hex.
- Hexes are installable apps; side boxes (rectangles) are everything else (sources,
  outside systems). Sources left, consumers right.
- Hex colour means something: cobalt #21468B for app hexes and brand chrome; Nextcloud blue
  #0082C9 for the workspace hex, Nextcloud's own apps and the "Next" in ConNext (the word
  Nextcloud in running copy stays white: blue on cobalt fails contrast); lavender #7E66C9 process;
  mint #2E9866 integrate or connected; forest #3D7C3A data. No terracotta. 3 families per
  scene at most.
- App glyphs: always the real symbol `g-<id>` (white on a cobalt hex by default). Never
  draw an icon.
- The ConNext wordmark is `wordmark-connext-white` on cobalt (or `wordmark-connext` on
  white). Never set it in live type, never recolour it.
- Nextcloud is cited, not claimed. Never imply Nextcloud GmbH makes ConNext.
- Tokens: colours from `_lib/brand.js` (C.*), never raw hex in scene code.

## Voice (hydra writing skill, voice.md)

- Sentence case. No em-dashes, no double dashes. One claim per line. Under 16 words.
- Write from the reader: "you", "your". Verbs, not nouns.
- Banned: ecosystem, platform that, seamless, synergy, kernel, digital transformation,
  solution (for our product), future-proof, state-of-the-art.
- No platform internals on screen: OpenRegister, schema, register, MCP, JSON, endpoint,
  API. Say what it does for them. App names may appear only as small labels next to their
  hex (Figtree 600, 28 to 36 px, or IBM Plex Mono), never as the message.
- CTA, exactly: **Install from the Nextcloud app store**, in orange text (no box). Optional second line: conduction.nl.
  Never "Get started", "Book a demo", "Try it".
- No app count (sources conflict: 21, 22, 12, 36). No download figures. No customer claims.

## What is true (use only these; source in story.json)

Shipped today, safe to show:
1. **One place, every change logged.** All your apps keep their records in one place, on
   your own server. Every change shows who did it and when.
2. **Everything about a client in one view.** Open a client and their files, mails,
   meetings and chats are right there. Nobody copies between tabs.
3. **Your CRM client is your phone contact.** Change a number once and it is right on your
   phone too. (Pipelinq + Nextcloud Contacts)
4. **One portal for your clients.** Clients log in to one portal in your house style and
   see their invoices, quotes, requests and contracts from every app you run. (Portaliq +
   Pipelinq, Shillinq, Filinq, Dossiq and more)
5. **Documents fill themselves in.** Pick a client and a template and the contract fills
   itself in, from the client's details. (Filinq + Pipelinq)
6. **Sign on the phone.** The client gets a link and signs in their portal on their phone.
   Nothing to print, scan or chase. (Filinq + Portaliq)
7. **One start screen.** Your deals, tasks, calendar and mail from every app, arranged your
   way. (LaunchPad)
8. **The next task lands on the right desk.** Set it up once: when a quote is accepted or an
   invoice goes overdue, the right person gets the task and a notification. (The customer
   draws the flow; do not say "pre-built".)
9. **Outside systems feed the same records.** Your webshop or bookkeeping package feeds your
   records on a schedule; failed deliveries retry. (Integriq)
10. Free and open source (EUPL-1.2). Your own server.

**Not shipped, never show:** "enter a client once and every app updates"; "a signed quote
lands in your books"; "a CRM request becomes a case"; payroll; "every app works with the
assistant"; "pre-built automations"; any app count; download numbers.

Taglines already in use (may be reused): "Make Nextcloud your workspace." · "Apps that
truly work together." · "Pick an app. Install it. Done." · "Tech to serve people."

## Assets (never redraw)

Load with `loadBrandAssets(film.defs)` from `_lib/assets.js`; draw with
`<use href="#id" width height color>`:
`g-<app id>` for the 21 apps (APP_IDS, APP_NAMES), `nc-files`, `nc-mail`, `nc-calendar`,
`nc-talk`, `nc-decks`, `nc-activity` (Nextcloud's own apps, line icons), `nextcloud-logo`
(white on the #0082C9 workspace hex), `avatar-conduction`, `wordmark-connext(-white)`,
`wordmark-conduction(-white)`. Sizes in `MARK_BOX`.

Product UI: never invent it. The design system's own mock components are the reference:
`preview/components/app-mock.html`, `widget-mock.html`, `sidebar-mock.html`,
`flow-mock.html`, `mock-scene.html`, `platform-overview.html` (render them to look). Rebuild
their look faithfully in SVG with the same proportions and tokens, or keep UI abstract
(cards, rows, pills) in the same vocabulary. No placeholder boxes that pretend to be
screenshots.

## Engine

`preview/films/_lib/`: `core.js` (ease.brand, ease.snap, ease.exit, bezier, spring, seg,
envelope, stagger, rand, mix, hexPath, hexPoints, axialToPixel, axialRing), `stage.js`
(Film, el, set, tf, tfAbout, textBlock with *accent* markup, loadFonts, loadSymbols),
`brand.js` (C colours, FONTS), `assets.js`. Read them; they are short. No rotation helper
and no gradient helper exist on purpose.

## Sound (for the notes column)

Synthesised in code, no licensed music. 128 BPM bed (pad, offbeat bass, kick from bar 3,
hats, claps) plus cues: tick (hex lands), pluck (musical UI note), whoosh (move), riser
(build), impact (reveal), bell (sonic logo). Gentle first 3 s: no loud stinger on frame 1.

- **Positioning source (2026-09-28):** market-intelligence PR #195, `positioning/<app>.json`
  (clone ~/memcap-work/positioning/mi/positioning/). Film captions start from each USP's `line`
  and `scene`. Never make an "only we" claim on a USP whose `confidence` is `thin`.

- **Round 7 decisions (Ruben, 2026-09-28, audience storyboards):** body ends on the promise card,
  "Install the app" is said once on the install board. Dossiq gets a THIRD film, organisation cases
  (private sector, beyond the positioning). Portaliq for schools is not its own film: the parent side
  is told in the Learniq schools film, and schools leave the Portaliq customer film. Learniq
  placements, university credentials and the Pipelinq retail till stay parked.

- **Round 8 (Ruben, 2026-09-28, notes on the audience storyboards):**
  - Never promise "no seat fee" or cost that stays flat as you grow: the Nextcloud SLA price grows with the organisation.
  - No AI in government casework films (it scares that audience); use the flow builder instead.
  - Weak USPs, do not film: "every ID lookup logged", "callback skips the holiday".
  - Pipelinq KCC strong: 360° citizen view (all cases, products, invoices, permits); a call pop-up at the
    right of the screen that opens the citizen dashboard in one click; every contact with the citizen
    (letters, mail, chat) on that dashboard; related knowledge items (xWiki knowledge graph) appear while
    typing a contact moment; refer to a colleague, callback note, notes on cases, tasks for colleagues.
  - Pipelinq sales strong: all your data in Nextcloud Tables, build your own dashboards and flows on it.
  - Dossiq casework strong: flow builder; xWiki knowledge graph; automatic document creation and editing
    documents (Word files) from inside the case through Nextcloud; work backlog, overview, working in teams;
    case-specific access rights; share case types and workflows through the store.

- **Round 9 (Ruben, 2026-09-28, notes on the round-8 audience storyboards):**
  - Dossiq casework: the knowledge graph is back: related knowledge appears while you work the case,
    with the same technique as the Pipelinq contact-centre film so the two films rhyme.
  - Dossiq casework: a standards beat: every case is kept in an international standard and in local
    standards (for example ZGW in the Netherlands, the Danish case and document standard). Only names the
    sources state go on screen, cited in audiences/positioning.md. To fit, drop the weakest beat ("You
    decide who sees this case") and merge beats where the one-take can carry two; keep the flow builder.
  - Pipelinq contact centres: the hand-offs go back in (refer to a colleague, a callback note, notes on
    cases, tasks for colleagues), carried by one beat, within 30 words.

- **Round 10 (Ruben, 2026-09-28):**
  - Drop ConNext from the app and audience films: one more thing to explain. The shared closing piece
    says "Built on Nextcloud" instead of "Built on ConNext". (The finished ConNext film itself is not touched.)
  - First Dutch film: archiving. Not an app film but a government question: how Nextcloud, with our apps
    and the ZGW and ZDS standards, is made compliant with MDTO, the Archiefwet and the ISO archiving
    standards. Core idea: pick Nextcloud as the workspace and archiving stops being a verb and becomes
    the default. Dutch on screen for this film only; the English-only rule holds for the others.

- **Round 11 (Ruben, 2026-09-28, Learniq schools film only):**
  - The body opens on the student file (leerlingdossier): one pupil, everything about them in one place.
  - The next scene is one integrated view for teachers, claimed honestly: it does not remove the
    administrative work, it makes it easier to carry. Never "less admin" or "no more paperwork".
  - Keep the parent excuse and the 16-hour report if they fit 25 to 30 words; drop the weaker if not.

- **Round 12 (Ruben, 2026-09-28, archiving film NL):** tagline "Archiefwaardig vanaf het begin";
  Dutch closing "Gebouwd op Nextcloud"; one small NEN-ISO 16175 label on screen (no other ISO names,
  no "certified"); standards scene keeps "ZGW en ZDS". Orange rings/hexes are allowed (orange text
  never in a box), as on the Dossiq boards.

- **Round 13 (Ruben, 2026-09-28, Thematiq/Keepiq):** Keepiq nonprofits unfilmed; Thematiq shared-service
  providers fold into the government film; Thematiq repaints into abstract colours (no real house style);
  Keepiq app keys = one Integriq hex plus plain boxes. Boards stay as drawn.

- **Round 14 (Ruben, 2026-09-28, lanes L1/L2):** OpenRegister films close on a Built on piece with
  OpenRegister itself lit as the data layer; standard labels (BRP, StUF, ZGW, DigiD, BIO, BSN/IBAN) stay;
  Hermiq governance keeps municipalities (a film about controlling AI, not casework); no extra audience
  films for now (Shillinq municipalities, Humaniq payroll parked).

- **Round 15 (Ruben, 2026-09-28, Dossiq municipal casework):** "Drafted in Word, the answers appear"
  made no sense as one scene. Split it: (1) documents: edit a case's attached documents right from the
  workspace, or create them from templates, one short line; (2) knowledge: related knowledge appears
  while you work the case (the knowledge graph), the same device as the Pipelinq contact-centre
  knowledge scene. Other scenes stay. The body may grow to 12 bars; 25 to 32 words.

- **Round 15 (Ruben, 2026-09-28):**
  - Every product (app/audience) film opens its body with the PROMISE right after the Conduction opening,
    then the proofs. (The archiving film is not a product film; its order stays.)
  - No "free" anywhere: install board reads "Always 100% open source" (NL: "Altijd 100% open source").
    Applies to ALL films, including a re-render of the finished ConNext film.
  - Dossiq casework: documents and knowledge are two scenes; flows split into "automate" (draw a flow, the
    work runs itself) and "share" (case types and flows shared through the store); the standards scene uses
    the archiving film's ZGW/StUF diagram design (#9 text-swap on held wires) with CMMN 1.1 (International),
    ZGW/StUF (Netherlands), OIO Sag og Dokument (Denmark), and the caption says international and local
    standards. The archiving film keeps its own ZGW/ZDS scene.

- **Round 16 (Ruben, 2026-09-28, archiving film):** the film missed the point. The premise is: when you
  store correctly in Nextcloud (the user's own workspace, used as the DMS), you no longer need a separate
  DMS or archiving tool. Archiving happens where people already work. The e-Depot is not a strong sale;
  drop it as a proof. Rework the story around "no separate archive".
- **Round 16b (Ruben):** archiving tagline "Je werkplek is het archief"; no film render until Ruben's notes on the combined page.
- **Round 17 (Ruben, 2026-09-28, lane L3):** LaunchPad keeps AI out; Larpinq folds event producers into
  ONE film with clubs; Versioniq one film. OpenCatalogi: the Woo has a European counterpart, so the
  English film names the obligation in words that cover both (not "Woo" alone).

- **Round 18 (Ruben, 2026-09-28): copy test for every promise and every caption.**
  - Promise = "what would make a user want to buy this app": concrete, speaks to the user's own work.
  - Every caption must make sense on its own, readable by someone who does not know the app, concrete
    and clear (earlier examples: "Drafted in Word, the answers appear" and "Draw flows, share them in the
    store" failed; "CMMN, OIO, ZGW" meant nothing until it said international and local standards).
- **Round 18 answers (Ruben):** local terms on English films: say what it is in plain words, keep the
  acronym as a small label; Pipelinq sales promise leads with knowing which deals close; Learniq schools
  promise "every pupil's file, for every teacher"; Dossiq casework ADDS a deadline beat (in the backlog
  scene) and claims deadlines met; Filinq Woo softened ("personal data found before you publish" style);
  Keepiq says "passwords" in both films; Hermiq may say "AI" on screen (e.g. "AI that only does what you
  allow"); LaunchPad's last scene is REDRAWN to show its own-server line.

- **Round 19 (Ruben, 2026-09-28):** the promise card (right after the Conduction opening) becomes a
  QUESTION: "What if ...?" (NL: "Wat als ...?"), concrete, in the buyer's own terms, built from the
  film's promise. Question only: NO answer card; the proofs answer it. Archiving film: the question
  "Wat als we nooit meer hoefden te archiveren?" replaces the hook (the two-worlds picture stays under
  it) and the end promise card is dropped. Storyboards only; films are not re-rendered until Ruben says.

- **Round 20 (Ruben's page notes, 2026-09-28):**
  - Archiving: chapter mark over the opening "Archiefwet" → "Soevereine werkplek"; MDTO scene says you
    work MDTO-, ISO- and Archiefwet-compliant, not when you archive but where you work (replaces "Bewaard
    waar je werkt"); selectielijst: documents and cases are linked to a retention period automatically;
    standards: ZGW, ZDS, StUF, OIO and CMMN, and the workspace serves as the DMS for other systems.
  - Keepiq: merge the two films into ONE, built from the dev-teams film: hook "Apps use passwords without
    reading them"; the data-layer slot is not change logging but a dashboard of when, where, what for and
    by whom (person or app) each credential was used.
  - Thematiq: merge brands into government → ONE film; add the missing USPs: template management, the
    number of design tokens you can adjust, sharing templates through the store, loading NL Design System
    themes (for Dutch government).

- **Round 21 (Ruben, 2026-09-28):**
  - Archiving opening question: "Nooit meer archiveren?"; "compliant" stays in the MDTO scene.
  - Thematiq: templates are shared "through the store" (not "gallery").
  - Dossiq: rethink the WHOLE pitch (all Dossiq films) as a decision-making tool: make the correct
    decisions, when they are needed and the way they are needed, based on the correct information. That
    ties into Built on Nextcloud (the information comes from the whole workspace).
  - Built on Nextcloud (ALL films): replace the current matrix/board with the ConNext film's component
    connection section (the A19 s1 scene: lead app with the Nextcloud cells in the grid below it, orthogonal
    connectors, the rotating "verb + name" line), with the film's own app as the lead.
  - Install board (ALL films): "Install it", "Use it", "Own it" (the orange shifts line by line and lands
    on the last one), then "The code stays open source, your data stays yours". NL: "Installeer het",
    "Gebruik het", "Bezit het", then "De code blijft open source, je data blijft van jou". No full stops.

- **Round 22 (Ruben's page notes on Thematiq, 2026-09-28):**
  - SHARED closing, all films:
    - Built on: after the Nextcloud apps connect, ZOOM OUT so the other Conduction apps show too,
      connected with lines; set "Enhanced by Conduction" under "Built on Nextcloud"; no Portaliq neighbour;
      app hexes must be exactly the size of the dark-blue hexes (they read slightly larger now).
    - Install board: a genuinely great animation (explore several concepts and pick the best); the line
      is "The code stays open source, the data stays yours"; no Conduction header on the install board.
  - Thematiq film:
    - The question/promise becomes a small STORY about ownership and feeling, with word art: do you really
      own it if you can't style it your way? People pick their car colour and redesign their house; your
      clothes represent you, so should your style. Research it; this may take more time.
    - Order: token adjustment is the core and is scene 3; then "Share your templates" (the store); then,
      for Dutch organisations, import the NL Design tokens your organisation already has (replaces the old
      hook). Drop the data-layer slide for Thematiq.
    - Draw the screens from the real Thematiq admin screens on the local Nextcloud (localhost:8080).
- **Round 22b (Ruben, Keepiq):** add a section on requesting passwords or certificates from other users
  or organisations, and on offering a one-time download/view link. Both are critical to the process
  (Ruben: "nic proces", read as the NIS2/BIO security process; verify against the positioning) and a
  legal requirement for government organisations.
- **Round 23 (Ruben):** once the Thematiq and Keepiq storyboards are done, give both films a full
  animation pass at the level of the original ConNext film (it currently feels bare next to it): go all
  in, portfolio quality (camera, depth, transitions, the refs/techniques.md devices, sound), then render
  both films. Render after the round-22 shared closing is ported.

- **Round 24 (Ruben, 2026-09-28):** the install board uses the "current" concept (decided). The CURRENT
  LINE becomes a recurring theme in ALL films: the same square-cornered wire with a travelling current,
  from the Conduction opening (where it is born) through the body (it carries the hand-offs between
  scenes and powers each proof's key element on) to Built on (it runs the connectors) and the install
  board (it powers the words). One visual thread, one sound (charge, crackle, click), used sparingly
  so it reads as a motif, not decoration.
- **Round 25 (Ruben, Portaliq · citizen portal proofs):** add viewing and paying invoices; checking and
  updating current products; sending and receiving messages; adding things to cases or requests;
  changing your own data; seeing who viewed your data.
- **Round 25b (Ruben's page note, Keepiq promise):** flip it into an ownership story with word-art
  animation, like Thematiq: what is ownership if you don't own your passwords? Who is content with an
  external password app or a browser plugin? Can we be sovereign if we don't own the key to our own house?

- **Round 26 (Ruben, 2026-09-28):** the current thread is only a FALLBACK transition, used where a scene
  hand-off has no designed transition. The real work is scene transitions: design each hand-off properly
  (match cuts, a shape that becomes the next scene, zoom-through, hex wipes, whip-pans, text-swaps held on
  a diagram, from refs/techniques.md and beyond), per film. And restore the previous (round 21) transition
  from Built on Nextcloud into the install board (it was better), keeping the "current" install concept.

- **Round 27 (Ruben, Built on Nextcloud, from the Keepiq render):**
  - Drop the app-name label next to the lead cell.
  - DESIGN RULE, all films: hexes always FLIP in (turn over, as in the opening), never pop/scale in;
    lines are drawn on.
  - The connector lines come FROM the lead app (e.g. the Keepiq cell) to the Nextcloud apps, not from
    the Nextcloud cells.
  - Composition: the Nextcloud-blue app cells form a "C" (the Conduction C) and the white Conduction
    apps form a hexagonal ring around it; the lead (orange) sits in the C.
- **Round 27b (Ruben, install board, from the Keepiq render):** drop the electric line (the wire) on the
  install board; the Conduction avatar hex is drawn at the grid's hex size; the hand-off from Built on
  Nextcloud to the install board runs through FLIPPING HEXES and a RE-ZOOM (the camera zooms back in
  while the family/Nextcloud cells turn over into the install board's field and the Conduction cell).
  The words keep rising with the orange landing on "Own it".
- **Round 27c (Ruben, from the Thematiq render):**
  - Drop the off-palette colour hexes (purple/green) in the Thematiq story; stay in the brand palette.
  - DESIGN RULE, all films: the small mark above each caption is a SECTION TITLE (e.g. "Ownership",
    "Integrations", "Security", "Standards"), not the app name. The app name lives in the lead cell.
  - DESIGN RULE, all films: no floating hexes laid over the grid; every hex sits exactly on a grid cell.
- **Round 27d (Ruben, Built on):** the dark-blue field hexes FLIP INTO the app hexes (Nextcloud blue and
  white) instead of leaving empty space where a cell appears; and one ring of dark-blue field hexes sits
  between the Nextcloud-blue C and the white Conduction ring.
- **Round 27e (Ruben, 2026-09-29, Built on):** no missing dark-blue field hexes anywhere (the field grid is
  complete behind and around the C, the lead and the ring); the outer white Conduction ring has NO lines
  inward, and its spare cells are filled with EMPTY WHITE hexes so the ring reads as one full hexagon.
- **Round 28 (Ruben, 2026-09-29): the electric current line is RETIRED everywhere.** No connecting wire as
  a transition, motif or fallback in any film or storyboard (it reads as a bad transition). Where a hand-off
  has no designed transition, use a hex flip wave (field cells turning over) instead. Built on connectors
  from the lead to the Nextcloud apps stay (they are lines, not the travelling current).
- **Round 28b (Ruben, Thematiq story):** section title "Ownership is a style"; the story reads
  "You pick your car's colour" / "You choose your clothing" / "Why not design your workspace?"
  (the question lands in orange), replacing the car/house/colours and "not your style?" cards.
- **Round 28c (Ruben) DESIGN RULE, all films:** ONE honeycomb grid, always clear and solid ("material").
  No second grid laid over it, no translucent/see-through grid layers moving across each other, no
  parallax double grids or ghosted grids during camera moves. The camera moves the one grid.
- **Round 28d (Ruben, Conduction opening):** the wordmark on top of the grid reads oddly. Before
  "Conduction" appears, the field hexes behind the lockup FLIP OUT (clear ground behind the name); when
  the film continues (handover), they FLIP back IN and the grid is whole again.
- **Round 28e (Ruben, Keepiq story):** card 1 (section "Ownership"): "If somebody else owns and holds your
  key for you" [pause] "is it still your house?". Card 2 (section "Ownership"): "Store your passwords where
  you keep your data" / "Local, safe and yours" (orange). Later, "links" is too abstract: say "share links"
  (e.g. the one-time link scene and its section title).
- **Round 28f (Ruben, archiving film):** after "Nooit meer archiveren?" add the ANSWER card: "Als we van
  de werkplek ook DMS en archief maken". Add a new slide, section "Integratie": use the Integriq connector
  (Integriq in orange) to bring existing archives into Nextcloud, with a matching illustration.
  Retention covers "dossier, zaak, document, chat en agenda-item" (not only "dossier").
- **Round 28g (Ruben, Built on):** the lines from the lead to the Nextcloud-blue C cells retract/disappear
  as the white Conduction ring cells flip in (no lines remain in the zoomed-out family view).
- **Round 28h (Ruben, Thematiq):** "tokens" means nothing to end users and "53" is out of date. Say
  "style variables": 179 style variables across 33 visual components. Show real components being restyled
  in the film: buttons, forms, tables, modals, the login page.
- **Round 28i (Ruben, Keepiq section titles):** "Requests" → "Get passwords and certificates";
  "Share links" → "Share passwords and certificates".
- **Round 28j (Ruben, Built on):** the Nextcloud component set-up is quicker; ONE sub-sentence for all
  components with only the app name changing (e.g. "Works with Files"), and the name ROLLS (slot-roll,
  technique #7) to the next app each time a new component cell appears. The fixed part stays still.
- **Round 28k (Ruben, Keepiq):** insert a slide between "Share passwords and certificates" and "Usage":
  section title "Use", caption "Use your passwords from browser and mobile", with visuals (browser
  autofill and a phone app filling a login).
- Round 28j decided: keep the pace, names land on 5 of 9 cells (Mail, Contacts, Files, Deck, Polls). Keepiq phone = one-tap copy (no autofill).
- **Round 28l (Ruben, from the Thematiq end pull-back):** screens/windows that a scene has finished with
  must fade out (their cells return to plain field) right after use; no leftover screen may be visible in
  a later camera move, the pull-back or the end animation.

## Round 29 (2026-09-29): one Portaliq film
- The citizen portal and customer portal films fold into one Portaliq film (board preview/films/portaliq/boards/portal).
- Audience: the functional admins of municipalities and housing corporations, not the residents. The film says what the admin lets citizens and clients do.
- Scenes: an overview of tickets, cases, products and invoices; the status and progress of issues and cases; actions (open a ticket on a product, upload documents to a case, pay an invoice); every mail, letter and chat sent to you in one inbox; update your own details (address, payment information); mobile friendly (from the customer film); a grid page builder ("design your own portal for citizens and clients"); Nextcloud Forms and Tables collecting questions and data.
- The old citizens and customers boards stay only until the combined film is approved.

## Round 29b (2026-09-29, Ruben on the first Portaliq cut)
- The page builder moves up: right after the promise, before One view.
- Only the page builder (and the Tables side of collect data) runs inside Nextcloud. The portal pages residents and clients see stand on their own: draw them as standalone web pages with the organisation's own header, no Nextcloud top bar, no app nav.
- Naming: the first mention reads "clients (or citizens)", every later mention says "clients". Likewise "tickets (cases)" first, then "tickets". No "residents".
- The combined storyboard page carries the one Portaliq board; the old citizens and customers boards leave it.

## Round 29c (2026-09-29, Ruben): Portaliq, a clear hand-off from admin to client
- The page builder caption says who acts: "You design the portal".
- A new login scene follows it: "The client logs in to the portal". It shows the standalone portal's login page, the client signing in, then the portal opening onto One view. That login is the turn from the admin's side to the client's side.

## Round 30 (2026-10-08, Ruben): voice-over rules, from the archiefwaardig animatic
- **No voice over the shared pieces.** The Conduction opening at the start, and Built on plus the install board at the end, are never voiced. A voice-over lives in the body only. The music carries the opening and the closing.
- **The voice sits on top.** Under a voice the bed and the effects duck 15 dB (`film.music.duckDb`; `score.mjs` defaults to 9 dB for older films).
- **The voice sounds warm and lively, never sleepy.** The trained voice is generated in `--mode ref` with the style "warm, cheerful, upbeat, slightly faster", then sped up 8% with pitch kept (`atempo=1.08`), with the word timings scaled to match. A style prompt in the default `--mode both` is read aloud: never use it there.
- **Check every take by ear and by Whisper.** Words Whisper hears wrongly get a respelling in `~/voice-lab/pronounce.tsv` (so far: "metagegevens", "gedeelde", "DMS").
