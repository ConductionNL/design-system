# ODF source template — slide deck

The OpenDocument Presentation (`.odp`) working copy of the Conduction deck
template, for whoever prefers LibreOffice Impress or PowerPoint over HTML.

The HTML deck at [`../template.html`](../template.html) — built from the
`<cn-deck>` / `<cn-slide>` component library — stays the design source of
truth. `template.odp` is the editable, shareable export of that same deck.

The **"Download .odp"** chip on [`preview/decks/index.html`](../index.html)
links to `template.odp` in this folder.

## What `template.odp` is

The real-world example deck: the doelarchitectuur startsessie for Gemeente
Baarn. Sixteen slides, 16:9 landscape, the same content as
[`../template.html`](../template.html) slide-for-slide.

## Keeping it in sync

The HTML is canonical. When the deck changes:

1. Edit the slides in [`../template.html`](../template.html).
2. Re-export to `.odp` — rebuild in [LibreOffice Impress](https://www.libreoffice.org/),
   16:9 landscape, matching the [tokens](../../../tokens.css): Figtree body,
   IBM Plex Mono for code/numbers, cobalt as the dominant fill, KNVB orange
   used **once** per slide max.
3. Save as **OpenDocument Presentation (.odp)** — *not* .pptx — over
   `template.odp`. Commit + push.

> Fonts are not embedded; the `.odp` relies on the opener having Figtree and
> IBM Plex Mono installed. Without them it falls back to a system sans/mono.
