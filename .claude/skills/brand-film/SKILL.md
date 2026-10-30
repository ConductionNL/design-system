---
name: brand-film
description: "The production side of a Conduction film: the context pack, one storyboard per direction (an audience and a use of the app), the modular film (shared opening, body, Built on Nextcloud, install board), the app and audience film templates, director notes mapped to engine changes, the brand, voice and mute reviews, the sources ledger, and getting slides and videos onto identity.conduction.nl/movies. Use it with the film skill, which holds the motion method. Trigger on 'make a film', 'motion graphics video', 'social video for <app>', 'product explainer video', 'storyboard for <app>', 'a film for <audience>', 'showreel', 'maak een filmpje', 'animatie voor LinkedIn'."
---

# brand-film

Two skills make a film. The [film](../film/SKILL.md) skill is the motion method: the five laws, the
gated workflow, the grid, the motion tokens, kinetic type, sound, variants and the review rubric.
This skill is the production side: what goes into a film, how it is put together from shared pieces,
how a storyboard gets approved, and where everything is recorded.

[BIBLE.md](../../../preview/films/BIBLE.md) holds every decision Ruben has made about our films. Read
it before a storyboard. Later rounds supersede earlier text in the same file: the opening sections
describe the first ConNext film, and rounds 4 to 31 changed much of it (the closing, the install
board, "free", the current line). Where this skill, the film skill and the bible disagree, the bible's
latest round wins and the drift is a finding.

## Why it works this way

Everyone has the same model. What makes a film look like ours, and look made, is the context it is
given and the checkpoints before anything moves. Without them the output falls back to the default
look: centred text, a gradient, everything fading in, one idea stretched over fifteen seconds. Our
brand bans the gradient outright; this process bans the rest.

## What a film is made of

Every film is modular (bible round 4). Four pieces, played in this order:

| Piece | Layer | Lives in | Notes |
|---|---|---|---|
| Conduction opening | brand | [`_lib/scenes/opening.js`](../../../preview/films/_lib/scenes/opening.js) | 3 bars, the same sting in front of every film. Never voiced. |
| Body | app | `preview/films/<slug>/film.js` | the film's own scenes. A product film opens on a question, "What if ...?" (NL "Wat als ...?"), with no answer card; the proofs answer it (rounds 15 and 19). |
| Built on Nextcloud | brand | [`_lib/scenes/closing.js`](../../../preview/films/_lib/scenes/closing.js) `builtOnScene` | the film's app is the orange lead cell; the Nextcloud apps flip in and connect; "Works with <app>" rolls the name. Never voiced. |
| Install board | brand | `closing.js` `installScene` | "Install it" / "Use it" / "Own it", the orange landing on "Own it", then the open source line. Never voiced. |

Reserve `BUILT_ON_DUR` and `INSTALL_DUR` from `closing.js` for the two closing pieces. `legacy: true`
draws the round-6 pieces, so old masters stay reproducible; never use it for a new film.

The body comes from one of two templates:

- **App film** ([`_lib/appfilm.js`](../../../preview/films/_lib/appfilm.js)): direction C, "proof". Slots
  with a layer each: the hook and the proofs (**app**, drawn per app), one **general** scene every app
  shares (data layer, notifications, flows or the assistant, from
  [`_lib/scenes/general.js`](../../../preview/films/_lib/scenes/general.js), filled with this app's
  content), and the brand outro. `appFilm(content)` returns `{ meta, boards }`.
- **Audience film** ([`_lib/audiencefilm.js`](../../../preview/films/_lib/audiencefilm.js)): one app told
  to one audience. The app-film body with the promise first and the shared pieces round it.
  `audienceFilm({ ...content, audience, promise, techniques })`.

A film that is not about one app (the ConNext film, the archiving film) writes its body by hand on the
same engine and still closes with Built on and the install board, unless the bible says otherwise for
that film.

## One movie, not a collection of screens

A film that is a row of self-contained scenes reads as a slide deck, however good each frame is.
Ruben rejected two cuts of the "Business software is next" film for exactly this (Oct 2026): first
hard cuts between slide-like scenes, then a camera gliding over a wall of cards ("too much the same,
I see screens"). Plan continuity in the storyboard, not as an effect added afterwards.

- **One shared anchor per cut.** Every seam names the element that survives it: a shape, a word, a
  number or a position that carries into the next scene and changes role there (the 497 digits drop
  into hexes that tile the next honeycomb; a headline word becomes the next screen's label). Write
  the anchor in the board's `note`. A seam with no anchor is a hard cut and needs a reason.
- **A hero that never leaves.** One recurring element, usually the scene's single orange hex,
  travels the whole film and changes role (cursor, record, status, the answer). It ties the film
  together and keeps the one-orange rule.
- **One world, no screens.** No card edges, no visible frames, no dimmed neighbouring scenes, no
  ground that resets every scene. Scenes live in one space; the main seam is a zoom through a cell
  (push into a hex until it is the next scene, or pull out and the scene turns out to be one cell).
- **Vary the seams.** Zoom-through, morph (hex into panel), motion match (leave right, enter left at
  the same speed and height), wipes made of the scene's own hexes. The same seam everywhere is the
  slideshow again.
- **Overlap every cut.** The next scene's first element moves 0.25 to 0.5 s before the current one
  has left. Never fade everything out and rebuild from empty.
- **No dead holds.** While the viewer reads, keep a slow secondary motion: a 1 to 2 % drift, a
  ticking number.
- **Chapters live in the world.** A section slide is presentation furniture. In a film the chapter
  is a label on the world the camera passes, never its own screen.
- **A film of a talk speaks to one viewer.** "Do you write code?", never "Who here writes code?".
  Audience questions, hands and "this room" do not survive the move from stage to screen.
- **Without a voice, pace by reading.** Each line stays fully readable for 1 s plus 0.35 s per
  word (at least 2 s) after its entrance; entrances and exits take 8 to 12 frames; scene lengths
  snap to musical phrases and cuts land on downbeats.

References that do this well: the *Catch Me If You Can* titles (one figure through a flat graphic
world, scenes joined by graphic matches), the Eames' *Powers of Ten* (one continuous zoom), Buck's
*Good Books "Metamorphosis"* (every scene morphs into the next), and School of Motion's
[match cuts](https://www.schoolofmotion.com/blog/match-cuts) guide.

## The process

Seven steps. Do not skip one because the request says "just make a video". The gates are the film
skill's; this lists what each step produces.

### 1 · Build the context pack

Before any storyboard, collect and write down, in the film's `sources.json`:

| Input | Where it comes from | Rule |
|---|---|---|
| What the app does | `node scripts/films/app-facts.mjs <app> --screens 1` (the digest of `/capabilities` and `/screens`) | Claims come from `built` capabilities. Bible round 7 lets release films claim spec'd features; say so in the brief and get Ruben's yes. |
| Positioning | `positioning/<app>.json` in market-intelligence (each USP's `line`, `scene` and `confidence`) | Never an "only we" claim on a USP with `confidence: thin`. |
| Brand | `tokens.css`, `_lib/brand.js`, `brand/assets/`, this repo's [SKILL.md](../../../SKILL.md) | Colours from `C.*`, never raw hex. Marks are loaded as symbols, never redrawn. |
| App icons | `brand/assets/apps/glyphs/<id>.svg`, loaded by `loadBrandAssets` as `g-<id>` | Check the app's `<id>` in `appinfo/info.xml` first. Names move per app. |
| Real UI | the screen ids from `app-facts.mjs` (`/screens/board.html?id=<app>/<Board>`), redrawn with the atoms in [`_lib/ui.js`](../../../preview/films/_lib/ui.js) | Never paste a screenshot, never invent a product UI. |
| References | 1 to 3 reference films, named as a style ("Swiss kinetic type, masked rise, hard cuts on the beat") | A named reference beats a described one. Record the URL and what is borrowed. |

### 2 · One storyboard per direction

A direction is one audience and one use of the app: pipelinq for contact centres, pipelinq for sales
teams. Each has its own storyboard module at `preview/films/<app>/boards/<direction>/board.js`,
exporting `meta` and `boards`: one key frame per scene, drawn with the same engine as the film. Copy
[`_template/boards/demo/board.js`](../../../preview/films/_template/boards/demo/board.js) to start.
Open it at `preview/films/board.html?film=<app>&v=<direction>` (board i sits at t = i + 0.5).

For a new kind of film, draw three style frames that differ in kind, not in colour (the film skill's
step 3). For the ConNext film they were: one continuous camera move through the honeycomb; kinetic
type that states the problem then answers it; product proof with UI push-ins and hard cuts.

### 3 · Show the storyboard

The storyboard is approved before anything animates. Fixing a still costs seconds; fixing a render
costs a render.

- **On /movies.** `node scripts/films/board-stills.mjs --root <repo> --only <slug>` draws the slides,
  `node scripts/films/movies-index.mjs` adds them to the overview. Every direction shows there from its
  first storyboard.
- **For notes and a pick.** When Ruben should choose between variants or leave a note per scene, build
  a review page with `node scripts/films/storyboard.mjs --variants <json> --film <json> --out <dir>` and
  publish it as an artifact with the `db` capability; read the pick and the notes back with
  `ArtifactData`. An artifact belongs to the account that published it, so keep `<dir>` (it is the
  record) and write the link into `sources.json`. After an account switch, republish from `<dir>`.

Do not build before the storyboard is approved.

### 4 · Build the approved direction

The approved stills become the scenes' resting frames; animation is added around them, and the
seams join them into one movie (see "One movie, not a collection of screens"): each still is a
moment in one world, not a slide. The film page
is `preview/films/<slug>[/<direction>]/index.html` with its `film.js`. Times come from the film's
timeline and the grid ([`_lib/timeline.js`](../../../preview/films/_lib/timeline.js)), moves from the
motion tokens ([`_lib/motion.js`](../../../preview/films/_lib/motion.js)), seams from the transitions
registry ([`_lib/transitions.js`](../../../preview/films/_lib/transitions.js)). Keep every on-screen
string in a `{ nl, en }` table and set `film.langs`, so the four variants are a lookup.

### 5 · Director notes

Take notes in camera words and map them to engine changes. Vague notes ("make it pop") get random
changes; these get exact ones:

| Note | Engine change |
|---|---|
| "push in on X" | scale the scene's camera group about X's centre with the `camera` token, `durationFor(px, 'camera')` |
| "pull out" / "reveal" | the same, scaling down from a close start |
| "hard cut here" | end the scene on the beat with no overlap and no exit tween |
| "match cut to Y" | end scene N with a shape at Y's exact place, size and colour in scene N+1 |
| "whip to" | the `whip` token into the cut, `arrive` out of it; render with `--blur 4` |
| "hold N beats" | extend the resting frame by N beats on the timeline; later scenes move with it |
| "slow every zoom to 0.7x" | multiply every camera segment's duration by 1/0.7, snapped to whole frames |
| "on the beat" | move the event to the nearest `grid().beatAt(n)` |
| "stagger tighter" | reduce the `stagger()` spread |
| "land it harder" | the `contact` token (it stops dead on the contact frame) and a dry click on that frame; never a bounce or an overshoot |
| "no transition here" | the hex flip wave, the registry's fallback |

### 6 · Review

The film skill's review loop scores the film. On top of it, three checks that are about our brand:

- **Brand review** of the contact sheet (`film.mjs sheet`): one orange per scene, orange as text or a
  shape and never a box behind text, no terracotta, no gradient, pointy-top hexes that flip in and
  never rotate or pop, one solid honeycomb and every hex on a cell, used screens gone before the next
  camera move, marks unaltered, the small mark above a caption a section title.
- **Voice review** of every on-screen word with the hydra `writing` skill in REVIEW mode: sentence
  case, no em-dashes, no full stop at the end of a line, one claim per line, every caption clear on
  its own (round 18), the bible's banned words. Never "free" or "gratis" (say "100% open source"),
  never a seat-fee or flat-cost claim, no app counts. The closing words come from `closing.js`; do not
  retype them.
- **Mute review**: each line stays on screen for its reading time; the story reads with the sound off;
  the first frame of the body already says something.

### 7 · Render, deliver, record

Render the four variants and publish them on [/movies](https://identity.conduction.nl/movies/) as the
film skill describes (Variants, Publish). Then complete `sources.json`.

## Sources ledger

`preview/films/<slug>/sources.json` records, for every film: each asset path and the repo ref it came
from, each on-screen claim and its source (a capability, a positioning USP, a bible round), each
reference and what was borrowed, each brand rule that decided something, the storyboard and review
artifact links, and each deviation (for the first ConNext film: English only).

## Engine

| File | What it gives you |
|---|---|
| `_lib/core.js` | `ease` (house curves), `bezier`, `spring`, `seg`, `envelope`, `stagger`, seeded `rand`, colour `mix`, pointy-top `hexPath`, `axialToPixel`, `axialRing` |
| `_lib/motion.js` | the named motion tokens, `durationFor`, `withinCeiling`, `rangeOk` |
| `_lib/timeline.js` | `grid()` (bars, beats, snapping), `timeline()`, `holdFor`, `wordCount` |
| `_lib/stage.js` | `Film` (scenes, cues, music, player), `variant()` for `?lang` and `?voice`, `el`/`set`/`tf`/`tfAbout`, `textBlock` with `*accent*` markup, `loadFonts`, `loadSymbols` |
| `_lib/transitions.js` | the seam registry, from match cut to the hex flip wave, with cues and caption rules |
| `_lib/ui.js`, `_lib/atoms/` | the product UI vocabulary: AppMock, WidgetMock, SidebarMock, FlowMock and record atoms in SVG |
| `_lib/brand.js`, `_lib/assets.js` | colour constants mirrored from `tokens.css`, fonts, and `loadBrandAssets(defs)`: `g-<id>`, `nc-*`, `nextcloud-logo`, `avatar-conduction`, the wordmarks |
| `_lib/appfilm.js`, `_lib/audiencefilm.js` | the two body templates |
| `_lib/scenes/` | `opening.js`, `closing.js`, `general.js`, `kinetic.js` |
| `_lib/current.js` | retired (round 28): the current line draws nothing; do not build on it |

The engine has no rotation helper and no gradient helper, on purpose. Do not add them.

A page exposes `window.__render(t)`, `window.__ready` and `window.__film`. `?capture` hides the
player, `?t=3.2` opens at a time, `?safe` shows the safe zones, `?lang=nl|en` and `?voice=0` pick the
variant.
