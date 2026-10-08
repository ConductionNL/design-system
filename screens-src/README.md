# Screens: the editable sources

Every screen on [identity.conduction.nl/screens](https://identity.conduction.nl/screens/) is built from the files in this folder. They are the sources. Edit them here, never the generated HTML under `preview/screens/`.

## What is here

- `zuiddrecht/`: the demo municipality Zuiddrecht, 657 boards (`*.dc.html`), drawn in the Zuiddrecht house style. The gallery can redraw these in another design system.
  - `canvas1.json` and `canvas2.json`: the two canvases (deel 1 and deel 2). They hold each board's title, size and the capability note.
  - `rows1.json` and `rows2.json`: the row order on the gallery. One entry per row: key, title, and the boards in columns.
  - `capability-rows.json` and `capability-rows-extra.json`: the capabilities and the "what you see" line per board, used when a canvas note is missing.
  - `blobs.json`: maps the canvas image ids (`/_blob/...`) to the logo files.
  - `logos/`: `logo.svg`, `logo-wit.svg`, `emblem.svg`, `emblem-grijs.svg`.
- `wilgenboom/`, `vaartveld/`, `esdoornveen/`, `warmtepompacademie/`: the four school portals, 30 boards each, drawn in their own house style. These are never redrawn.
  - `canvas.json`: titles, sizes and the board order.
  - `STATE.md`: the asset line from the canvas, the source for `blobs.json`.
  - `logos/`: `logo.svg`, `logo-wit.svg`, `emblem.svg`, `emblem-wit.svg`.

## A board file

A `.dc.html` board is a canvas artboard. The markup sits inside `<x-dc>`, uses inline styles, and can contain `{{ holes }}`, `<sc-for>`, `<sc-if>` and `<dc-import name="Kop">` (a shared component such as the header). Its data comes from the `renderVals()` method in the `<script>` block at the bottom.

## Rebuild

```
python3 scripts/screens/build.py                # everything
python3 scripts/screens/build.py --only Home    # one board
```

See [scripts/screens/README.md](../scripts/screens/README.md) for the details.
