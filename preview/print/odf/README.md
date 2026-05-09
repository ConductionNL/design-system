# ODF source templates — print artefacts

This folder is the home for the **OpenDocument** working copies of every print
artefact in [`preview/print/`](../). The HTML pages stay the design source of
truth (tokens-driven, always up-to-date); the `.odt` here is the editable
working copy for whoever prefers a document editor over markup.

The download chip on each tile of [`preview/print/index.html`](../index.html)
links into this folder. **Right now those links 404** — the files have not yet
been exported. To add one:

1. Open the matching HTML page in [LibreOffice Writer](https://www.libreoffice.org/) (paste the rendered preview into a fresh document, or rebuild the layout natively).
2. Match the [tokens](../../../tokens.css) — Figtree body, IBM Plex Mono code, KNVB orange used **once** per page.
3. Save as **OpenDocument Text (.odt)** — *not* .docx, *not* .doc.
4. Drop the file in this folder using the filename below.
5. Commit + push.

## Files to export

| File | Source page | Notes |
| --- | --- | --- |
| `business-cards.odt` | [business-cards.html](../business-cards.html) | 85×55mm custom page size; Draw/.odg also fine |
| `letterhead.odt`     | [letterhead.html](../letterhead.html)         | A4 portrait, header + hex-line footer |
| `envelope.odt`       | [envelope.html](../envelope.html)             | C5 / C4 / DL custom page sizes |
| `cover-letter.odt`   | [cover-letter.html](../cover-letter.html)     | NL + EN, sits on letterhead |
| `reminder.odt`       | [reminder.html](../reminder.html)             | 3 escalation levels in one file |
| `order-confirmation.odt` | [order-confirmation.html](../order-confirmation.html) | NL + EN |
| `nda.odt`            | [nda.html](../nda.html)                       | Mutual NDA, NL + EN |
| `sla.odt`            | [sla.html](../sla.html)                       | Multi-page, NL canonical |
| `report.odt`         | [report.html](../report.html)                 | Cover + body + back |
| `quotation.odt`      | [quotation.html](../quotation.html)           | NL + EN |
| `invoice.odt`        | [invoice.html](../invoice.html)               | NL + EN |
| `one-pager.odt`      | [one-pager.html](../one-pager.html)           | A4 double-sided |
| `app-factsheet.odt`  | [app-factsheet.html](../app-factsheet.html)   | One per app |

The `.odp` slide-deck template lives next door at
[`preview/decks/odf/template.odp`](../../decks/odf/) — see that folder's
README for that one.

## Why ODF and not .docx?

OpenDocument is **ISO/IEC 26300**, the open standard the Dutch government has
on the *"pas toe of leg uit"* list. The format opens in LibreOffice,
OnlyOffice, and Microsoft Office without conversion. Anyone — partner,
customer, contractor — can edit the templates without a Conduction account or
a paid licence. That matches the rest of the kit, which is OSS-first.
