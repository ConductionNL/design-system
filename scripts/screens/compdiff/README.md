# Component diff

`compdiff` compares a live Nextcloud page with its drawn board, one component at a time. A whole-page pixel score mixes layout, data and spacing. A real defect, such as a wrong padding or an extra header border, gets lost in that noise. This tool measures each card, header, tab strip, table, toolbar and dialog on both sides and reports which styling properties differ.

## Needs

- node 18 or later
- a `playwright` package. Put it on the module path, or set `PLAYWRIGHT_MODULE=/path/to/node_modules/playwright`
- Chrome or Chromium. Set `CHROME=/path/to/chrome` if it is not at `/opt/google/chrome/chrome`
- a user on the live instance that can see the pages: `COMPDIFF_USER` and `COMPDIFF_PASSWORD`

The script reads the boards from `preview/screens/boards/` in this repo. Pass `--boards <dir>` to read them from somewhere else.

## Measure one board

```sh
export COMPDIFF_USER=... COMPDIFF_PASSWORD=...
node scripts/screens/compdiff/compdiff.mjs --board DqMijnWerk --url '/apps/dossiq/?view=mine' \
  --out /tmp/compdiff --skip-first-run dossiq
```

Options:

- `--base http://localhost:8080` sets the live instance.
- `--click "<css>"` and `--clicks "a|b"` open a menu or a dialog before the measurement.
- `--fills "<sel>=><value>||..."` types values into fields.
- `--settle 8000` sets how many milliseconds to wait before measuring.
- `--wait-for "<css>"` waits for an element.

It writes `<Board>.json` with every measurement and `<Board>.md` with a table per component: property, board, live, delta, flag. It also writes `<Board>-board.png` and `<Board>-live.png`.

## Measure a set of boards

`runall.sh <outdir> <specs.tsv>` measures one board per row. A row is `board<TAB>route`, optionally followed by `<TAB>--flag<TAB>value` pairs. Then summarise:

```sh
scripts/screens/compdiff/runall.sh /tmp/compdiff specs.tsv
node scripts/screens/compdiff/summarize.mjs /tmp/compdiff
```

`summarize.mjs` writes these files:

- `fleet-summary.md`: the properties that differ the same way on 3 or more boards. These are usually library fixes.
- `boards.md` and `boards.tsv`: the flagged component count per board and its 3 worst components.

It applies the current comparison rules to the stored measurements again. After you change a rule in `compare.mjs`, run the summary again. You do not need to measure again.

`runall.sh` reads these optional variables:

| variable | does |
|---|---|
| `COMPDIFF_HEALTH` | runs a command that must succeed before each board, and waits up to 30 minutes for it |
| `COMPDIFF_STAMP_FILE` | reads a file whose first line names the live build. A board measured while it changed is measured again |
| `COMPDIFF_LOCK_DIR` | shares two run slots (`pixel-1.lock`, `pixel-2.lock`) with other screen runs |
| `COMPDIFF_SLICE` | runs each browser in that systemd user slice, capped at 2 GB |
| `COMPDIFF_SKIP_FIRST_RUN` | suppresses the first-run dialogs of these app ids, except on `/settings/` routes |

## Layout verdict

`node verdict.mjs <rundir> [--inventory <inventory.tsv> --tag "<branch and build>"]` decides per board: MATCH or NO-MATCH. A board matches only when all of these hold:

- every board component pairs with one on live, and live has no extra components
- every pair sits within 4 px in x and y of its board position, measured from the content area, and within 8 px in width. Height is data, so it does not count
- no pair has a flagged styling property, and the page background behind the cards is the same colour (channel delta 4 or less)

It writes `verdicts.tsv` and `verdicts.md`. With `--inventory` it appends one row per board to a screens inventory, with notes that start with `layout match: component-measured` or `no layout match: component-measured`. The status and the page mismatch % come from the board's last row there.

## Track findings across builds

`track.sh <statedir> <specs.tsv>` measures everything again when the build in `COMPDIFF_STAMP_FILE` has changed. It then updates `<statedir>/findings.md`. A finding is `open` while a run still shows it, `fixed` once a run no longer shows it, and `verified` after two runs without it.

## What it compares

It compares look and feel only:

- spacing: padding, margin, gap
- borders on each side, and border radius
- typography: size, weight, line height, colour, letter spacing, case
- sizes and background colours
- whether the chrome is there and in what order: title rows, header actions, buttons, tabs

Text, values, row counts and empty or filled lists are never compared. The rules that keep data out:

- Insets are measured from the card edge to the rendered text. The number stays the same whether the padding sits on the card, the header or the body.
- Card height follows the data, so the table shows it but never flags it.
- When either side centres its content, as an empty state does, the content insets are not flagged.
- Labels only pair the buttons and the cards with each other. They are never compared.

Components pair by their title text first, exact and then fuzzy. The rest pair by role and position. A pair matched on position with two different titles is named `board title ~ live title`, so you can spot a wrong pair. Each pair also gets a pixel mismatch percentage of its own crop. Treat that number as secondary, because different content changes the pixels.

Flags fire when a value goes past one of these limits:

- spacing more than 2 px apart
- font size more than 0.5 px apart
- a border drawn on one side only
- a width more than 8 px apart
- a colour channel more than 12 apart
- a font weight 100 or more apart

## Read-only

On the live side the script only reads. It answers every request except GET, HEAD, OPTIONS and the login POST with a 403 and does not pass it to the server. Each `<Board>.json` lists those blocked requests under `blockedWrites`. Nothing is written to the instance, and the script never switches or builds the app under test.

To start, measure one board you changed and read its `<Board>.md`, worst component first.
