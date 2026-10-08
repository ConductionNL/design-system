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
