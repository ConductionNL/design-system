# Component diff

`compdiff` compares a live Nextcloud page with its drawn board, one component at a time. A whole-page pixel score mixes layout, data and spacing. A real defect, such as a wrong padding or an extra header border, gets lost in that noise. This tool measures each card, header, tab strip, table, toolbar, pager, map and dialog on both sides and reports which styling properties differ.

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
- `--settle 8000` sets the longest wait before measuring. The page is measured as soon as no request is in flight (long polls aside) and its layout has held still for 1.5 seconds. `--settle-mode fixed` waits the full time instead.
- `--storage <path>` keeps the login in `<path>-<user>.json`, so the boards of a batch log in once. `runall.sh` sets it to a private directory that it removes when the batch ends.
- `--wait-for "<css>"` waits for an element.
- `--steps '<JSON array>'` (or `--steps @file.json`) plays steps in their order, after the options above: `{"click": sel}`, `{"fill": sel, "value": text}`, `{"type": sel, "value": text}` (key by key, for a field that searches as you type), `{"press": sel, "key": "Enter"}`, `{"wait": ms}`, `{"waitFor": sel}` and `{"dragFiles": sel, "files": [names]}` (drags empty files over a drop zone and holds them there, never dropping, for a board that draws the drop state). A step can rest on the one before it: type a team into a search, then click the option it found. `--clicks` and `--fills` cannot, because every click runs before every fill. A failed click stops the run; a failed fill is reported and skipped.
- `--login none` measures the live page without logging in, as a visitor sees it. `--login viewer` logs in as `COMPDIFF_VIEWER_USER` and `COMPDIFF_VIEWER_PASSWORD` (any role name works the same way), for a page that looks different to an editor, such as a site that shows "Deze site bewerken" to its editors.
- `--ignore "<sel>|<sel>"` leaves elements out on both sides, as chrome.
- After the steps the pointer is moved to a spot over no control, so a button the last click step left the pointer on is not measured in its hover state.
- After the steps and before the capture, the document and every scrolled container are scrolled back to the top: a spec hash such as `#section-kadaster` scrolls Nextcloud's settings content, and the page header above it would read as missing. `--keep-scroll` keeps the scroll for a board that is drawn scrolled.
- `--clock <ISO date>` sets the live page's clock to that moment (timers keep running), for a board drawn on a fixed date, such as a calendar opened on December 2026.
- `--read-post "<path>|<path>"` lets POST requests to these paths through (`*` stands for one path segment, `/index.php` and the query are left out of the match). For a read that asks with a POST body, such as OpenRegister's `dedup-check` behind New case's duplicate dialog. Every other write stays refused, so a step that reaches a save still creates nothing.
- `--session '<JSON object>'` seeds the live page's session storage before it loads, for state a browser session keeps. CnDetailPage asks once per session why the reader opens a record with special categories of personal data, and compdiff refuses the write that records the answer, so a spec seeds `cn-access-purposes` instead of answering. A string value is stored as is, any other value as its JSON.
- `--width <px>` measures both the board and the live page at that viewport width (320 to 2560, default 1440), for a phone board such as MobielZaak at 390.

The live page is opened at its load event, not at network idle: Nextcloud keeps polling, so the network rarely goes idle and that wait ran into its timeout on most pages. Each report holds a `timings` object with the time spent per phase.

After the settle the script waits, up to 20 seconds, until every table's head has as many columns as its first row and has held still for a second, so a selection column that renders late is in the measurement.

It writes `<Board>.json` with every measurement and `<Board>.md` with a table per component: property, board, live, delta, flag. It also writes `<Board>-board.png` and `<Board>-live.png`.

## Measure a set of boards

`runall.sh <outdir> <specs.tsv>` measures one board per row. A row is `board<TAB>route`, optionally followed by `<TAB>--flag<TAB>value` pairs. Given a REVIEW `boards.json` in place of the specs file, it first writes `<outdir>/specs.tsv` from it with `specs-from-boards.mjs`: one row per board, its route without the origin and `/index.php`, its steps as `--steps`, its `login` and `ignore` as `--login` and `--ignore`, and its `width` as `--width`; a board with no `liveUrl` (a sheet with no live page) gets no row. `node specs-from-boards.mjs <boards.json> --keep <specs.tsv>` also keeps the rows of boards the list does not hold. Then summarise:

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
| `COMPDIFF_LOCK_DIR` | shares the run slots (`pixel-1.lock`, `pixel-2.lock`, ...) with other screen runs |
| `COMPDIFF_SLOTS` | how many slots there are (default 2). Three are safe on a 24 GB box, but the live instance is the limit: each board then loads more slowly |
| `COMPDIFF_SLICE` | runs each browser in that systemd user slice, capped at 2 GB |
| `COMPDIFF_SKIP_FIRST_RUN` | suppresses the first-run dialogs of these app ids, except on `/settings/` routes |

## How large a difference counts

Insets, gaps and heights flag past 2px; font sizes past 0.5px; widths past 8px. The 2px is not a guess at noise:
`node noise.mjs <runA> <runB>` compares the live values of two runs of the same boards on the same build, and on
24 Oct (DqMijnWerk, DqOverdragen, DqOrganisaties, measured hours apart) all 194 inset, gap and height values read
the same, 0.0px apart. The board side is static HTML and reads the same every time. A difference of 3 or 4px is
therefore a real rendered difference, such as a 34px title-row button against a 40px one or a row padded 8px
instead of 11px. It is fixed in the code or the board, not hidden behind a wider threshold. Run `noise.mjs` again
after a change to the extractor or the browser, before you change a threshold.

## Layout verdict

`node verdict.mjs <rundir> [--inventory <inventory.tsv> --tag "<branch and build>"]` decides per board: MATCH or NO-MATCH. A board matches only when all of these hold:

- every board component pairs with one on live, and live has no extra components
- every pair sits within 4 px in x and y of its board position, measured from the content area, and within 8 px in width. Height is data, so it does not count. A dialog counts by its x only: Nextcloud fixes a dialog's top, and the boards put it anywhere from 88 to 120 px. What sits inside a dialog is placed from the dialog's own top
- no pair has a flagged styling property, and the page background behind the cards is the same colour (channel delta 4 or less)

It writes `verdicts.tsv` and `verdicts.md`. With `--inventory` it appends one row per board to a screens inventory, with notes that start with `layout match: component-measured` or `no layout match: component-measured`. The status and the page mismatch % come from the board's last row there.

## Track findings across builds

`track.sh <statedir> <specs.tsv>` measures everything again when the build in `COMPDIFF_STAMP_FILE` has changed. It then updates `<statedir>/findings.md`. A finding is `open` while a run still shows it, `fixed` once a run no longer shows it, and `verified` after two runs without it.

## Elements and coverage

Besides the components, the extractor lists every visible UI element in the page: buttons, links styled as buttons, fields, toggles, chips and pills, badges and tags, and list rows. Elements pair by label first. A label leaves out the text of a nested count badge, so "Filter" pairs with "Filter". A field is named by its `aria-label`, its `aria-labelledby`, a `<label for>` or a wrapping `<label>`, before its placeholder, so a textarea is not named by the text typed into it. Page links pair in order inside their pager, because the page count follows the data. A map is compared for its place and size only, and its attribution is left out. A corner radius is read as drawn, so 50% and 18px on a 36px circle are the same. The rest pair as repeated groups (same container, same style) in order, because the number of rows or chips follows the data. Per pair it compares radius, border, background, text colour, font size and weight, padding, height, icon, badge and the gap to the next sibling. An element whose crop differs by more than 30% while no property fired gets the flag "visually differs, property not identified". Board elements with no counterpart are listed as missing. Live elements with no counterpart, such as an extra sort select, are listed as extra.

An untitled card that only frames a paired table (with its pager or toolbar, or a count line such as "6 van 6 · 20 per pagina" under it) is that table's frame. A pager right under a paired table belongs to that table: whether a list draws page links follows how many rows it holds, so such a pager is neither missing nor extra. One side may draw the frame as a card and the other as the table's own border, so such a card is neither missing nor extra.

A framed item whose framed siblings of the same kind are too short to be cards (under 48px) is a row of that list, not a card: whether one tile reaches 48px depends on how its text wraps.

A deck is three or more sibling cards of the same width (a card wrapped alone in a grid cell or list item counts by its cell): a row of record cards, or a column of widgets. Every card of a deck pairs and is compared, including its structure: the order and rows of its parts (pill, number, title, meta, divider, deadline). A card past a deck's first that finds no counterpart is not reported as missing or extra, because how many cards a deck holds follows the data.

With a modal dialog open (`aria-modal="true"`, on the dialog box or on the mask around it), only what is inside the dialog is measured. The page under the scrim is ignored on both sides.

A tab strip is a `[role=tablist]`, or a `nav[aria-label]` (or an element with a `page-tabs` class) whose links sit on one row and mark the current page with `aria-current`: nc-vue's page tabs navigate between pages, so they are links, not `role=tab`. A breadcrumb trail is not a tab strip. Both kinds are measured the same way and pair with each other, the current item as the active tab. A tab strip's underline is read where it is drawn: on the tablist or on a bar around it whose bottom is the strip's bottom (such as `.cn-tabs__bar`), as a border, a thin pseudo-element or an inset shadow. A field's border is the one people see: its own, a `box-shadow` ring, or that of a wrapper that hugs it (NcInputField, NcSelect). A card's or an element's border is read the same way: a ring in the border's own colour thickens it, so a 1px border with a 1px inset ring reads as the 2px border a board draws (a chosen choice row), and a ring alone reads as a border.

A toolbar is a row of two or more controls. A chip on it (a fully rounded pill of 36px or less: a quick filter, a shortcut, an active-filter tag) is not counted as a control: which chips a bar shows follows the data, and a board draws them as buttons where the library may draw links or spans. A wrapping flex bar whose row wrappers are `display: contents` (the board layout of CnActionsBar) draws its first line as a toolbar though no element boxes that line: the line takes the bar's width and holds the items on it. A table's head is read from its first header cell with a label, so an empty selection column does not stand for the head's type. Run the extractor's tests with `node --test scripts/screens/compdiff/extract.test.mjs` and the live side's with `live.test.mjs` (they need `PLAYWRIGHT_MODULE` and Chrome, and skip without them). The pairing rules' tests are `compare.test.mjs`.

A line of smaller text right under a card title is its description when it reads as one: plain text of at most two lines, 14px or less or muted, with no boxed part (a pill, a framed row) and no term list. Facts, a pill row, a list of rows, a 15px sentence in the title's ink (an empty state), a chart or a picture there is content.

A card's header actions are the buttons in its title row, and any button set on the title's line to the right of the title from outside that row, as NcSettingsSection places its actions. A button lower in the card is not one. A dialog's close button (named Sluiten or Close, or with a `close` class) is the dialog's own chrome and never a header action: the boards put it in the title row, NcDialog in the corner.

Every board element with a box of its own that nothing above accounts for is listed under "not measured", with a count in `verdicts.tsv`. A board with unmeasured elements never counts as a match.

## What it compares

It compares look and feel only:

- spacing: padding, margin, gap
- borders on each side, and border radius
- typography: size, weight, line height, colour, letter spacing, case
- sizes and background colours
- whether the chrome is there and in what order: title rows, header actions, buttons, tabs
- the separator under a card title: a header's bottom border, a rule, or the first row's own top border (a record list's rule above its first row), which reads the same

Text, values, row counts and empty or filled lists are never compared. The rules that keep data out:

- Insets are measured from the card edge to the rendered text. The number stays the same whether the padding sits on the card, the header or the body.
- Card height follows the data, so the table shows it but never flags it.
- When either side centres its content, as an empty state does, the content insets are not flagged.
- Labels only pair the buttons and the cards with each other. They are never compared.

A card with no heading element is titled by its first bold line near the top. A card that is itself one link or label (a record card, a choice) keeps that line as its title, a plain link around the title text does too, a pill in the head row is skipped, and a record number beside it (2026-0082) does not end the search; a button's label is never a title.

A small heading (13px or less) over a bold line 1.4 times its size is a kicker, an eyebrow such as "Vandaag eerst" over the case title: the larger line is the card's title, as it is where the kicker is set as a paragraph.

Components pair by their title text first, exact and then fuzzy. The rest pair by role and position. A pair matched on position with two different titles is named `board title ~ live title`, so you can spot a wrong pair. Each pair also gets a pixel mismatch percentage of its own crop. Treat that number as secondary, because different content changes the pixels.

Flags fire when a value goes past one of these limits:

- spacing more than 2 px apart
- font size more than 0.5 px apart
- a border drawn on one side only
- a width more than 8 px apart
- a colour channel more than 12 apart. A border colour counts only where both sides draw that border
- a font weight 100 or more apart

Colours are read by `colour.mjs`, in the page and in the comparison alike. It reads every form `getComputedStyle` returns: `rgb()`/`rgba()`, and the CSS Color 4 forms Chrome keeps for a `color-mix()` or a wide-gamut colour (`color(srgb ...)` and the other predefined spaces, `oklch()`, `oklab()`, `lab()`, `lch()`), all converted to sRGB 0-255. A colour it cannot read is no colour, never a guess. Run its tests with `node --test scripts/screens/compdiff/colour.test.mjs`; the steps' with `node --test scripts/screens/compdiff/steps.test.mjs`.

## Read-only

On the live side the script only reads. It answers every request except GET, HEAD, OPTIONS and the login POST with a 403 and does not pass it to the server. Each `<Board>.json` lists those blocked requests under `blockedWrites`. Nothing is written to the instance, and the script never switches or builds the app under test.

To start, measure one board you changed and read its `<Board>.md`, worst component first.
