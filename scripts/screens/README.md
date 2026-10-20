# Screens build

`build.py` turns the boards in `screens-src/` into the static files the gallery at `preview/screens/` reads.

## Needs

- python3 with Pillow (`pip install pillow`)
- node (runs each board's `renderVals()`)
- Chrome or Chromium; set `CHROME=/path/to/chrome` if it is not at `/opt/google/chrome/chrome`

No npm packages.

## Edit a screen

1. Edit the board in `screens-src/<set>/<Name>.dc.html`. A shared part (header, footer, side bar) lives in its own board, for example `Kop.dc.html`, and every board that imports it changes with it.
2. Rebuild that board: `python3 scripts/screens/build.py --only Name`. For a school board use its key, for example `--only wilgenboom-Home`. Changed a shared part? Rebuild everything.
3. Open `preview/screens/boards/Name.html` in a browser, or the gallery with `python3 -m http.server` in `preview/`.
4. Commit the source, the board, the thumbnail, `screens.json` and `scripts/screens/heights.json`.

## Add a screen

1. Add `screens-src/<set>/<Name>.dc.html`.
2. Register it. A Zuiddrecht board of one app: add it to that app's own file `screens-src/zuiddrecht/apps/<app>.json` (`{"rows": [["row<App>", "<row title>", [["<Name>.dc.html"]]]], "boards": {"<Name>.dc.html": {"title": ..., "w": 1440, "h": 1200}}, "notes": {"cap_<Name>": {"text": "Capabilities: a, b.\nWat je ziet: ..."}}}`), so work on different apps never edits the same file. The older boards are registered the other way: add `"<Name>.dc.html"` to a column in `rows1.json` or `rows2.json` (a row there is `[key, title, columns]`, with an optional fourth element: a blurb of its own, shown under the title instead of the app's line; the pipelinq journey rows use it), and an entry under `boards` in `canvas1.json` or `canvas2.json` with `title`, `w` and `h`. Add the capability note as `notes.cap_<Name>.text` ("Capabilities: a, b.\nWat je ziet: ..."). School: add it to `order` and `boards` in that school's `canvas.json`.
3. Rebuild that board with `--only`.

## What the build does

For every board:

1. **Index.** `preview/screens/screens.json` lists the sets, rows and boards. Every board has a stable id `<app>/<Name>`, for example `portaliq/MijnZaken` or `wilgenboom/Home`. A school board whose name is also used elsewhere gets its set as a prefix in its key and file name (`wilgenboom-Home`), never in its id. An app listed under `OWN_SETS` in `build.py` (OpenProject) is drawn and tokenized like Zuiddrecht but becomes a set of its own with a `gallery` page: `preview/openproject/` shows it through the same `gallery.js` (`data-set="openproject"`), `/screens` hides it and sends its old anchors there, and `board.html` links back to it.
2. **Flatten.** `flatten.py` runs `renderVals()` in node and expands holes, `sc-for`, `sc-if` and `dc-import` into a standalone document at `preview/screens/boards/<Key>.html`. Links to other boards point at their flattened file. Canvas images map to `preview/screens/assets/<set>/`.
3. **Tokenize (Zuiddrecht only).** Every Zuiddrecht colour in CSS becomes `var(--sc-<role>, <literal>)`, the body font becomes `var(--sc-font, 'Fira Sans')`, and each logo gets `data-sc-logo="logo|logo-wit|emblem|emblem-grijs"`. Each board loads `../screens.css` and `../theme.js`, which set those variables and logos from `?ds=` or the stored choice. Visible text such as a hex code on a token board is left alone. The roles:

   | role | literal | role | literal |
   |---|---|---|---|
   | primary | #3669a5 | work-ink | #1b1c1d |
   | primary-deep | #234a78 | work-text | #3d4047 |
   | primary-light | #eaf0f7 | work-muted | #5e6168 |
   | accent | #cc0000 | work-line | #e4e6ea |
   | accent-deep | #a30000 | work-soft | #eef0f3 |
   | site-ink | #1a1a1a | work-ground | #f5f6f8 |
   | site-muted | #4a4a4a | work-chip | #f0f1f3 |
   | site-border | #d3d8df | work-field | #828a95 |
   | site-ground | #f4f6f9 | | |

   Every other colour (for example buildiq orange #e2611a) stays as drawn. The school sets are not tokenized.

   A system built on an NL Design System token set does not type its variables: `python3 scripts/screens/sc_from_thematiq.py <system>` reads thematiq's `css/tokens/<set>.css` (the system's `set`, from the development branch or a path you pass) and writes the roles above from the `--nldesign-*` tokens with the mapping thematiq's `overrides.css` uses for a Nextcloud page; the script records the source under `source` in `design-systems.json`. Such a system also sets `"look": "nldesign"`, which `theme.js` puts on `<html data-sc-look>` and `screens.css` turns into the element layer (squared controls, bold button labels, a visible field edge, underlined prose links, a black focus ring). The Rijkshuisstijl example is the first.

   Two more hooks are written in the source, not by the build: `data-sc-org` on the element that shows the organisation name (the line above the app name in `DqKop.dc.html`), which `theme.js` fills with the design system's `orgName`, and `data-sc-header="app"` on the app header, which `screens.css` restyles for a system with a `headerStyle` (the Rijkshuisstijl example wears `lint`: a bar in the primary colour on the far left with the white emblem in it).
4. **Measure.** Chrome loads the board at its width and reports the content height. Heights are kept in `scripts/screens/heights.json` and written into `screens.json`. `--no-measure` keeps the stored heights.
5. **Thumbnail.** A headless Chrome screenshot at the board's size, scaled to 480 px wide, saved as `preview/screens/thumbs/<Key>.webp` (quality 80, lower when needed to stay under about 60 KB).

6. **Styled thumbnail.** A board of an app listed under `THUMB_STYLES` in `build.py` (mail, calendar and tasks, drawn for OpenProject) gets a second thumbnail in that design system at `preview/screens/thumbs/<system>/<Key>.webp`, listed as `thumbs` in `screens.json`. The gallery shows it when that design system is chosen. The build serves the boards over http for these, because the theme is fetched.

Options: `--only Key` (repeatable), `--index-only`, `--no-thumbs`, `--no-measure`, `--jobs N` (default 3). Every run rewrites its outputs, so running it twice gives the same result. It exits 1 and names the board when one fails.

## English

The boards are drawn in Dutch. In English (`?lang=en`, or the NL/EN switch, kept in localStorage) `theme.js` translates a board document in the browser from a catalogue: `preview/screens/i18n/en/<Key>.json` maps every Dutch string on the board to its English text, and `_common.json` holds the strings that three or more boards share (menus, buttons, footer). An empty value, or no catalogue, leaves the Dutch; the board page then shows a Nederlands badge. Names, addresses, dates and amounts have no translation by decision: the demo municipality is Dutch. Set and row titles and app blurbs are in `_gallery.json`; a board's English title and capability note come from its catalogue (`_title`, `_note`) through `index.json`. The fixed English for government and UI terms is in `screens-src/i18n/glossary.json`; use it so every board says the same thing.

```
python3 scripts/screens/i18n.py extract --app dossiq --app portaliq   # write or refresh the catalogues of these apps
python3 scripts/screens/i18n.py index                                 # index.json: titles, notes and coverage per board
python3 scripts/screens/i18n.py check                                 # keys on the board, valid JSON, no em-dashes
python3 scripts/screens/i18n.py stats                                 # per app: boards, strings, chars, done
python3 scripts/screens/i18n_merge.py chunk_*.json                    # merge translated work chunks into the catalogues
```

`extract` keeps existing translations, adds new strings with `""` and drops strings no longer on the board, so run it again after a board changes and translate what is new. A string in `_common.json` that means something else on one board gets an override: add it to that board's catalogue by hand and `extract` keeps it there; the board's value wins, and `""` keeps the Dutch (a token-set name in a picker, for example). A translator gets a chunk file (`[{"board", "field", "nl", "en"}]`), fills `en` and `i18n_merge.py` puts it back. Commit the catalogues, `_common.json` and `index.json`.

## Build status

`build_status.py` writes `preview/screens/build-status.json`: per board how far it is built in its app and how well it matches the board. The gallery shows a badge per screen and a progress line per row, and `board.html` a Bouwstatus panel. Without the file both pages work as before.

```
python3 scripts/screens/build_status.py ~/memcap-work/screens/round6/INV-*/inventory*.tsv ~/memcap-work/screens/round6/LIVE-*/inventory.tsv
```

Each input is a TSV with the header `board kind route status mismatchPct notes`. Rows from a file in a `LIVE-*` directory (live verdicts on builder branches) win over every other row for the same board. A board without a row is shown as not measured yet. The script's docstring has the rules for `layoutMatch` and `measuredOn`.

## Components used in the app, and the match per component

`app_components.py` writes `preview/screens/app-components.json`: per board which nextcloud-vue components the live app renders on the board's route, next to what the drawn board is built from (`components.json`). `board.html` shows both lists in its components panel and flags what is on one side only; `components.html` lists per component every screen that uses it, grouped by app, with a badge per screen (board, app, or both). Without the file both pages show the board side only.

```
python3 scripts/screens/app_components.py                # every app with a checkout next to this repo
python3 scripts/screens/app_components.py --app dossiq   # one app
```

It reads the board's route from `build-status.json`, matches it to a page in the app's `src/manifest.json` plus `src/manifest.d/*.json`, and maps the page to components through the nextcloud-vue checkout (`../nextcloud-vue`): `pageTypes.js` for the page type, the page component's registered children filtered by the page config (`CHILD_RULES` in the script), the widget catalogue for every widget type, and the app's `src/registry.js` for custom pages, slots and sidebar tabs. The app checkout directory may carry the old app name (`APP_DIRS` in the script); `--apps-dir` points elsewhere. Every board of the app gets an entry, with `reason` when it has no route or no page matches. A `via` per component says how it gets there, `appComponents` lists the app's own components on the page, and `unresolved` names widget types and components the script could not place.

`component_status.py` writes `preview/screens/component-status.json`: per component how well the live component matches the board that draws its specimen, from the COMP lane's TSV (`component specimenBoard mismatchPct verdict notes`). Both pages colour it as a dot: green matches, blue differs, grey not measured yet. A missing or empty TSV still writes a valid file.

```
python3 scripts/screens/component_status.py ~/memcap-work/screens/round6/COMP/components.tsv
```

## Capabilities, specs and repositories

`capabilities.py` adds to the gallery what each screen delivers, which OpenSpec specs define it and which repository it lives in. Run it after `build.py`, because `build.py` rewrites `screens.json` without these fields.

```
python3 scripts/screens/capabilities.py             # git fetch each app checkout first
python3 scripts/screens/capabilities.py --no-fetch  # use what the checkouts already have
```

It reads all 20 app checkouts next to this repo (`../portaliq`, `../procest` for dossiq, `../scholiq` for learniq and so on; `--apps-dir` points elsewhere). It reads them at `origin/development`: `openspec/specs/`, `openspec/changes/`, `openspec/parity/capabilities.json` and `openspec/parity/gap-decisions.json`. When a fetch fails or `origin/development` is missing it reads the checkout's `HEAD` and lists that under `warnings` in the output. It needs no network beyond `git fetch`, and running it twice gives the same result. Apps without boards on the design canvas are listed too, without screens.

It writes:

- `preview/screens/capabilities.json`: one entry per capability under the key `<app>/<id>`, plus an `apps` block with counts per app. Every spec and every parity matrix row of every app is in it, with or without a screen.
- In the same file, a `features` block under the key `<app>/<feature>`: every capability sits under exactly one feature, and `/capabilities` shows one table row per feature. The matrix's own `features` list is the authority, and a row's `feature` field names its slug. A spec goes to the feature that lists it, else to the feature most of its rows are in. An app without a `features` list is grouped by its rows' old `feature` values or their area, and those groups are marked as not yet in the feature list. Whatever is left goes under `<app>/_none`, shown as not tied to a feature.
- `preview/screens/screens.json`: every board gets `repo`, `repoUrl`, `repos` (the school website boards also name portaliq), `src` (path in this repo), `capIds` (from the board's capability note), `matrixCapIds` (matrix rows whose `screen` field names the board) and `specs`.

How a token in a board's capability note is read: the part before the first space or bracket is the token, and anything in brackets is kept as a note. The token is looked up as a spec, then a matrix row, then an open change, first in the board's own app and then in the only other app that has it. Tokens starting with `of-` (Open Formulieren) or `oi-` (Open Inwoner), or starting with `NLDS` or `Den Haag`, are external references. Anything else is free text.

A capability is on a screen when a matrix row's `screen.board` (or `built.screen.board`) names a board, or a board's capability note names it. A row with `screen: {"board": null, "reason": "..."}` has no screen by nature (an API, a background job) and says why. A spec is on the screens of the rows that link it; a spec no row links can be placed with the matrix's top-level `specScreens`: `{"<spec>": {"board": ["<Board>"]}}` or `{"<spec>": {"board": null, "reason": "..."}}`. The run prints per app how many are on a screen, have a reason, or are missing one (decided-no left out); the page filters on the same three states.

What each status means:

| status | meaning |
|---|---|
| built | the matrix row says it ships (`built.state`) |
| building | the matrix row says work is under way |
| specified | specified but not built: a matrix row in that state, or a spec that no matrix row points at |
| decided-no | the matrix row was decided against (see `decision`) |
| in-flight | an open OpenSpec change under `openspec/changes/` |
| designed | only an external reference or free text, carried by at least one screen: drawn, not specified |
| external | an external reference that no screen carries |

A spec takes the most advanced state of the matrix rows that point at it (through the row's `feature`, or through a row id named in the spec's Purpose).
