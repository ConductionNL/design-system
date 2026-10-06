---
name: brand-film
description: "Make a short Conduction or ConNext motion film (social reel, product explainer) in code, from storyboard to rendered MP4 with sound. Covers the context pack (brand, product truth, real app icons, references), three storyboard variants presented to the user as an artifact with one still frame per scene, building scenes on the time-driven engine in preview/films/_lib, director notes, the brand-rule and voice review, scoring, rendering and the sources ledger. Trigger on 'make a film', 'motion graphics video', 'social video for <app>', 'product explainer video', 'showreel', 'maak een filmpje', 'animatie voor LinkedIn'."
---

# brand-film

> The [film](../film/SKILL.md) skill holds the motion method (laws, gates, grid, motion tokens,
> kinetic type, sound, review rubric). Use both. Where they differ, for example "land it harder"
> below, which no longer means `outBack` (the no-pop rule), the film skill and the bible win.

A film is a web page whose every frame is a pure function of time. The engine in
[`preview/films/_lib/`](../../../preview/films/_lib/) draws it, the tools in
[`scripts/films/`](../../../scripts/films/) capture, score and encode it, and each
film lives in `preview/films/<slug>/`, published on `identity.conduction.nl/films/<slug>/`.

The first film is [`preview/films/connext/`](../../../preview/films/connext/). Copy
its structure for every product film that follows.

## Why it works this way

Everyone has the same model. What makes a film look like ours, and look made, is the
context it is given and the checkpoints before anything moves. Without them the
output falls back to the default look: centred text, a gradient, everything fading
in, one idea stretched over fifteen seconds. Our brand bans the gradient outright;
this process bans the rest.

## The process

Six steps. Do not skip one because the request says "just make a video".

### 1 · Build the context pack

Before any storyboard, collect and write down (in the film's `sources.json`):

| Input | Where it comes from | Rule |
|---|---|---|
| Brand | `tokens.css`, `brand/assets/`, [README](../../../README.md), this repo's [SKILL.md](../../../SKILL.md) | Tokens only. Marks are loaded as symbols, never redrawn. |
| App icons | `brand/assets/apps/glyphs/<id>.svg`, taken from each app's `img/app.svg` on its **development** branch | Check the app's `<id>` in `appinfo/info.xml` first. Names move per app. |
| Product truth | the app's `info.xml` summary, its docs, the identity `products` and `slogans` pages | Every on-screen claim is shipped today and has a source. No invented numbers. |
| Real UI | the design system's own mock components: `preview/components/app-mock.html`, `widget-mock`, `sidebar-mock`, `flow-mock`, `mock-scene`, `platform-overview` | Never invent a product UI. Rebuild these faithfully in SVG, or embed their markup in a `foreignObject`. |
| References | 1 to 3 reference films, named as a style ("Swiss kinetic type, masked rise, hard cuts on the beat") | A named reference beats a described one. Record the URL and what is borrowed. |
| Platform | the social specs and safe zones in the film's `sources.json` | Design for mute. Text inside the unified safe zone. |

### 2 · Three storyboard variants

Ask for three directions that differ in kind, not in colour. For the ConNext film they
were: one continuous camera move through the honeycomb; kinetic type that states the
problem then answers it; product proof with UI push-ins and hard cuts.

Each variant is a module `preview/films/<slug>/boards/<V>/board.js` exporting `meta`
and `boards`: one key frame per scene, drawn with the same engine as the film. Render
the stills:

```bash
cd scripts/films && npm install   # once
node film.mjs stills --root <repo> --page 'preview/films/<slug>/boards/board.html?v=A' --times 0.5,1.5,2.5 --outdir <review>/A --scale 0.5
```

### 3 · Present the storyboard as an artifact

Publish one storyboard page with the three variants side by side: per scene the still,
its bar and beat timing, the on-screen words, the motion in camera language, the sound
cue and the reference it borrows from. The page declares the `db` capability so the
user can pick a variant and leave a note per scene; read both back with `ArtifactData`
before building. Fixing a still costs seconds. Fixing a render costs a render.

Do not build before the user has picked.

Build the page with `node scripts/films/storyboard.mjs --variants <json> --film <json> --out <dir>`
(`film.mode: 'approve-each'` for app films, where each film is approved on its own; add a
`layer` and, for shared scenes, a `module` to every scene, and a `film.divide` table). An
artifact belongs to the account that published it: after an account switch the old link stops
working for the new account. Keep the generated `<dir>` (it is the record), republish it as a
new artifact from a fresh folder, and write the new link into the film's `sources.json`.

### 4 · Build the picked variant

The approved stills become the scenes' resting frames; animation is added around
them. Work on the beat grid (see *The grid*). One scene per file under
`preview/films/<slug>/scenes/` when a film has more than a handful of scenes.

### 5 · Director notes

Take notes in camera words and map them to engine changes. Vague notes ("make it pop")
get random changes; these get exact ones:

| Note | Engine change |
|---|---|
| "push in on X" | scale the scene's camera group about X's centre, `ease.brand` |
| "pull out" / "reveal" | the same, scale down from a close start |
| "hard cut here" | end the scene on the beat with no `post` overlap and no exit tween |
| "match cut to Y" | end scene N with a shape at Y's exact position and size in scene N+1 |
| "whip to" | 4 to 6 frame move with `ease.snap`, render with `--blur 4` |
| "hold N beats" | extend the resting frame by N × 60/bpm seconds, shift later scenes |
| "slow every zoom to 0.7x" | multiply every camera scale segment's duration by 1/0.7 |
| "on the beat" | move the event to the nearest `film.beat(n)` |
| "stagger tighter" | reduce the `stagger()` spread |
| "land it harder" | shorter in-duration, `outBack` or a spring with lower `zeta`, add a tick or kick cue |

### 6 · Review, score, render, record

- **Brand review** of the contact sheet (`film.mjs sheet`): one orange per scene, no
  gradient, no rotated or flat-top hex, solid fills, marks unaltered, 3 to 4 hex
  families per scene, Next in ConNext is Nextcloud blue.
- **Voice review** of every on-screen word with the hydra `writing` skill in REVIEW mode:
  no em-dashes, sentence case, one claim per line, banned words (including
  "ecosystem" and "platform that"), CTA exactly *Install from the Nextcloud app store*.
- **Mute review**: each line stays on screen for its reading time; the story reads
  with sound off; the first frame already says something (it is the thumbnail).
- **Score**: `film.mjs cues` then `score.mjs` (see *Sound*).
- **Render** the master and the feed cut, and write every source and decision into
  `sources.json`.

## House rules decided for films (Ruben, 2026-09-27)

- **16:9 landscape, 1920 x 1080.** Text safe box x 120 to 1800, y 96 to 930 (the bottom
  150 px hold the player's controls). Type sits in a left column, picture and UI on the right.
  A vertical cut is a separate decision, not the default.
- **No terracotta (brown).** Not as a ground, a hex or a file pip. App hexes are cobalt.
- **Orange is text, never a box behind text.** The accent word and the install call are
  KNVB orange at headline size (64 px or more, weight 700): 3.0:1 on cobalt, 5.9:1 on
  cobalt-900. Black or white text in an orange box reads dated. Orange shapes are still fine,
  and orange text counts as the scene's one orange.
- **The word Nextcloud stays white** in copy. Nextcloud blue (#0082C9) is 2.2:1 on cobalt;
  it stays on the "Next" of the ConNext wordmark and on the workspace hex.

## Which direction for which film

Decided by Ruben on 2026-09-27, after the first three-variant storyboard:

| Film | Direction | Why |
|---|---|---|
| ConNext film (the whole set of apps) | **A · One take**: one unbroken camera move through the honeycomb, pushing into one app's UI and gliding to the next | Apps working together is a move from one cell to the next; one camera shows it without a cut |
| Every app film (Pipelinq, Learniq, ...) | **C · Proof**: true product moments shown as the app's UI, each carrying the app hexes behind it, joined by hex match cuts | An app film has to show the product working; C shows it most plainly on a phone |

An app film is built on the shared template in `preview/films/_lib/appfilm.js`: fixed slots on
the grid, each with a layer. **App** slots (the hook, the proof) are drawn per app.
**General** slots show the capabilities every app shares (the common data layer, flows, AI)
through shared scene modules in `_lib/scenes/general.js`, filled with the app's own content.
**Brand** slots (the outro) are the same frame for every app with its own glyph and name.
Storyboards for app films carry a `layer` per scene, and the review page shows the divide.

## The grid

A film runs on a musical grid so cuts land on beats. 128 BPM makes 15 seconds exactly
8 bars of 1.875 s (a beat is 0.46875 s). Put scene changes on beats and the big moments
on bars. `film.beat(n)` and `film.bar(n)` give the times.

## Engine

| File | What it gives you |
|---|---|
| `_lib/core.js` | `ease` (house curves `brand`, `snap`, `exit`), `bezier`, `spring`, `seg`, `envelope`, `stagger`, seeded `rand`, colour `mix`, pointy-top `hexPath`, `axialToPixel`, `axialRing` |
| `_lib/stage.js` | `Film` (scenes, cues, beat grid, safe box, player), `el`/`set`/`tf`/`tfAbout`, `textBlock` (per-word or per-character text in per-line clip boxes, `*accent*` markup), `loadFonts`, `loadSymbols` |
| `_lib/brand.js` | colour constants mirrored from `tokens.css`, font files |
| `_lib/assets.js` | `loadBrandAssets(defs)`: every app glyph `g-<id>`, Nextcloud bundled apps `nc-*`, `nextcloud-logo`, `avatar-conduction`, both wordmarks |

Rules the engine enforces by omission: there is no rotation helper and no gradient
helper. Do not add them.

A page exposes `window.__render(t)`, `window.__ready` and `window.__film`. `?capture`
hides the player; `?t=3.2` opens at a time; `?safe` shows the safe zones.

## Tools

```bash
cd scripts/films
node film.mjs render --root <repo> --page preview/films/<slug>/index.html --out <slug>.mp4 --blur 4 --audio mix.wav
node film.mjs sheet  --root <repo> --page preview/films/<slug>/index.html --every 0.25 --out sheet.png
node film.mjs cues   --root <repo> --page preview/films/<slug>/index.html --out cues.json
node score.mjs --cues cues.json --out mix.wav --spectrum mix.png
```

`render` splits frames over parallel pages, optionally averages sub-frames for motion
blur, and encodes H.264 High with `+faststart`. `--scale 0.5` renders a quick proof.

## Sound

Sound is designed for the viewer who turns it on; the film never depends on it. The
score is synthesised in code (`scripts/films/lib/synth.mjs`), so there is no licence to
track. A film declares a music bed (`film.music`: chords, bass, which parts play in which
bars) and sound cues (`film.cue(t, kind, params)`) next to the motion that causes them,
so every hit lands on its frame. `score.mjs` mixes, ducks the bed under kicks and
impacts, and normalises to the social loudness target.

## Sources ledger

`preview/films/<slug>/sources.json` records, for every film: each asset path and the
repo ref it came from, each on-screen claim and its source, each reference and what was
borrowed, each brand rule that decided something, and each deviation (for the ConNext
film: English only, where the brand asks for NL and EN).
