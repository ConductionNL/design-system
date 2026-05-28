# ODF source template — slide deck

The OpenDocument Presentation working copy of the Conduction deck template.
The HTML version at [`../template.html`](../template.html) stays the design
source of truth; this `.odp` is the editable working copy for whoever prefers
LibreOffice Impress or PowerPoint.

The download chip on [`preview/print/index.html`](../../print/index.html) and
the **"Download .odp"** button on [`preview/decks/index.html`](../index.html)
both link to `template.odp` in this folder. **Right now those links 404** —
the file has not yet been exported.

## To produce `template.odp`

1. Open [`../template.html`](../template.html) in a browser, walk the 12
   layouts (title, agenda, content, two-column, full-bleed quote, app
   spotlight, comparison, customer logo wall, stats strip, section divider,
   closing, contact).
2. Rebuild each layout as a slide in [LibreOffice Impress](https://www.libreoffice.org/). 16:9 landscape.
3. Match the [tokens](../../../tokens.css) — Figtree body, IBM Plex Mono code,
   cobalt as the dominant fill, KNVB orange used **once** per slide max.
4. Save as **OpenDocument Presentation (.odp)** — *not* .pptx.
5. Drop here as `template.odp`. Commit + push.
