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
2. Register it. Zuiddrecht: add `"<Name>.dc.html"` to a column in `rows1.json` or `rows2.json`, and an entry under `boards` in `canvas1.json` or `canvas2.json` with `title`, `w` and `h`. Add the capability note as `notes.cap_<Name>.text` ("Capabilities: a, b.\nWat je ziet: ..."). School: add it to `order` and `boards` in that school's `canvas.json`.
3. Rebuild that board with `--only`.

## What the build does

For every board:

1. **Index.** `preview/screens/screens.json` lists the sets, rows and boards. Every board has a stable id `<app>/<Name>`, for example `portaliq/MijnZaken` or `wilgenboom/Home`. A school board whose name is also used elsewhere gets its set as a prefix in its key and file name (`wilgenboom-Home`), never in its id.
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
   | site-border | #d3d8df | work-field | #c4c7cb |
   | site-ground | #f4f6f9 | | |

   Every other colour (for example buildiq orange #e2611a) stays as drawn. The school sets are not tokenized.
4. **Measure.** Chrome loads the board at its width and reports the content height. Heights are kept in `scripts/screens/heights.json` and written into `screens.json`. `--no-measure` keeps the stored heights.
5. **Thumbnail.** A headless Chrome screenshot at the board's size, scaled to 480 px wide, saved as `preview/screens/thumbs/<Key>.webp` (quality 80, lower when needed to stay under about 60 KB).

Options: `--only Key` (repeatable), `--index-only`, `--no-thumbs`, `--no-measure`, `--jobs N` (default 3). Every run rewrites its outputs, so running it twice gives the same result. It exits 1 and names the board when one fails.

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
