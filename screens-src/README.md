# Changing the screens

Every screen on [identity.conduction.nl/screens](https://identity.conduction.nl/screens/) is built from a board in this folder. Edit the board here. Never edit the generated HTML under `preview/screens/`: the next build overwrites it.

The boards are the UI canon. An app is built to match its board, not the other way round. When a decision changes how a screen looks or works, amend the board in the same round, so the canon and the decision never disagree.

## Before you start

You need python3 with Pillow (`pip install pillow`), node, and Chrome or Chromium. Set `CHROME=/path/to/chrome` if it is not at `/opt/google/chrome/chrome`.

## Change one board

1. **Find the source.** A board with the id `dossiq/DqZaakTaken` lives in `screens-src/zuiddrecht/DqZaakTaken.dc.html`. School boards live in `screens-src/<school>/<Name>.dc.html`. The `src` field of the board in `preview/screens/screens.json` gives the exact path.
2. **Edit it.** A shared part (header, footer, side bar) is a board of its own, for example `Kop.dc.html`. Every board that imports it changes with it.
3. **Build that board.**

   ```bash
   python3 scripts/screens/build.py --only DqZaakTaken
   ```

   For a school board use its key, for example `--only wilgenboom-Home`. Changed a shared part? Leave out `--only` and build everything.
4. **Check it locally** (see below).
5. **Commit the source and what the build wrote** (see the next section).

## What the build changes

| File | What it is |
|---|---|
| `screens-src/<set>/<Name>.dc.html` | your edit, the source |
| `preview/screens/boards/<Name>.html` | the flattened board the gallery shows |
| `preview/screens/thumbs/<Name>.webp` | the thumbnail, a Chrome screenshot scaled to 480 px wide |
| `scripts/screens/heights.json` | the measured height, when it changed |
| `preview/screens/screens.json` | the gallery index: the new height, title or note |

A file the build rewrote with the same content does not show up in `git status`. Commit only what belongs to your boards. If `screens.json` shows changes to boards you did not touch, those are other people's sources that were never rebuilt. Leave them out of your commit, or rebuild them in a separate PR.

Some apps (mail, calendar, tasks and OpenProject) also get a styled thumbnail under `preview/screens/thumbs/<system>/`. The build writes it in the same run.

## The repo and spec fields in screens.json

Each board in `screens.json` also carries `repo`, `repoUrl`, `repos`, `capIds`, `matrixCapIds` and `specs`. `build.py` cannot compute those: [`capabilities.py`](../scripts/screens/capabilities.py) reads them from the OpenSpec folders of all 20 app checkouts.

`build.py` keeps the stored fields of every board whose source did not move. So a build of one board changes only that board's lines. Run `capabilities.py` when:

- you added a new board, which has no stored fields yet;
- you changed a board's capability note and want its specs to follow.

```bash
python3 scripts/screens/capabilities.py             # needs the app checkouts next to this repo
python3 scripts/screens/capabilities.py --no-fetch  # use what the checkouts already have
```

Without the app checkouts, leave the fields off a new board. The next full run adds them.

## English

The boards are drawn in Dutch. `?lang=en` translates a board in the browser from `preview/screens/i18n/en/<Name>.json`, which maps every Dutch string on the board to English.

```bash
python3 scripts/screens/i18n.py extract --app dossiq   # add new strings as "", drop removed ones
python3 scripts/screens/i18n.py check                  # valid JSON, no em-dashes
python3 scripts/screens/i18n.py index                  # English titles and coverage
```

`extract` rewrites every catalogue of the app and `_common.json`. Fill the empty values in your board's catalogue, then keep only that file (and `_common.json` or `index.json` if your change needs them). Restore the rest with `git checkout -- <file>`. Use the terms in [`i18n/glossary.json`](i18n/glossary.json), so every board says the same thing. Names, addresses, dates and amounts stay Dutch.

## Check it locally

Serve the repo root and open the board:

```bash
python3 -m http.server 8000
```

- The board: `http://localhost:8000/preview/screens/board.html?id=dossiq/DqZaakTaken`
- In English: add `&lang=en`
- The gallery, with your new thumbnail: `http://localhost:8000/preview/screens/`

## Live apps are measured against the boards

[`compdiff`](../scripts/screens/compdiff/README.md) loads a page of a live app and its board side by side. It reports, component by component, which styling differs. So a change to a board changes what counts as a defect in the app. Say so in your PR when the app will need to follow.

## Publishing

Open a PR against `main`. Once it merges, the Pages workflow deploys identity.conduction.nl, because the build output sits under `preview/`. A merge that touches only `screens-src/` or `scripts/` does not deploy anything.

## Add a board

Add `screens-src/<set>/<Name>.dc.html` and register it, then build it with `--only`. A Zuiddrecht board goes in its app's own file `screens-src/zuiddrecht/apps/<app>.json`. A school board goes in that school's `canvas.json`. [scripts/screens/README.md](../scripts/screens/README.md#add-a-screen) has the exact shapes.

## What is here

- `zuiddrecht/`: the demo municipality Zuiddrecht and the app boards, drawn in the Zuiddrecht house style. The gallery can redraw these in another design system.
  - `apps/<app>.json`: one registration file per app (rows, board titles and sizes, capability notes).
  - `canvas1.json`, `canvas2.json`, `rows1.json`, `rows2.json`: the older registrations of titles, sizes and row order.
  - `capability-rows.json` and `capability-rows-extra.json`: the capabilities and the "what you see" line per board, used when a canvas note is missing.
  - `blobs.json`: maps the canvas image ids (`/_blob/...`) to the logo files.
  - `logos/`: `logo.svg`, `logo-wit.svg`, `emblem.svg`, `emblem-grijs.svg`.
- `wilgenboom/`, `vaartveld/`, `esdoornveen/`, `warmtepompacademie/`: the four school portals, 30 boards each, in their own house style. These are never redrawn.
  - `canvas.json`: titles, sizes and the board order.
  - `logos/`: the school's logos.
- `i18n/glossary.json`: the fixed English for government and UI terms.
- `app-blurbs.json`: the one-line description per app on the gallery.

## A board file

A `.dc.html` board is a canvas artboard. The markup sits inside `<x-dc>`, uses inline styles, and can contain `{{ holes }}`, `<sc-for>`, `<sc-if>` and `<dc-import name="Kop">` (a shared component such as the header). Its data comes from the `renderVals()` method in the `<script>` block at the bottom.

[scripts/screens/README.md](../scripts/screens/README.md) explains every build step, the design-system tokens and the other scripts.
