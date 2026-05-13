#!/usr/bin/env python3
"""
scripts/build-odf.py
====================

Build the OpenDocument working-copy templates that live in
preview/print/odf/*.odt and preview/decks/odf/template.odp.

These are the files the download chips on preview/print/index.html link to.
Before this script existed those links 404'd; running this once writes a
real .odt / .odp for every print artefact, so the chips resolve.

Each .odt is generated from the matching HTML page in preview/print/. We
extract the headings + paragraphs + lists with html.parser (stdlib), then
emit an ODF v1.3 ZIP archive with mimetype-first-uncompressed, manifest,
styles, and content. Tokens — Figtree-fallback typography, cobalt
#21468B for headings, KNVB orange #F36C21 for accents — are baked into
styles.xml so the look matches the HTML source.

The output is intentionally simple: a fully-editable Writer / OnlyOffice
document with the page's actual copy as the starting point, plus a
footer note pointing back to the canonical HTML for layout reference.
This is a working copy, not a pixel-perfect reproduction.

Usage:
    python3 scripts/build-odf.py

No external dependencies, stdlib only.
"""

from __future__ import annotations

import datetime
import html
import io
import os
import sys
import zipfile
from html.parser import HTMLParser
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PRINT_DIR = REPO_ROOT / "preview" / "print"
ODT_OUT_DIR = PRINT_DIR / "odf"
DECK_OUT_DIR = REPO_ROOT / "preview" / "decks" / "odf"
SITE_BASE = "https://design-system.conduction.nl/preview/print"

# Files to export, mirrors preview/print/odf/README.md
ODT_TARGETS = [
    ("business-cards.html", "business-cards.odt"),
    ("letterhead.html",     "letterhead.odt"),
    ("envelope.html",       "envelope.odt"),
    ("cover-letter.html",   "cover-letter.odt"),
    ("reminder.html",       "reminder.odt"),
    ("order-confirmation.html", "order-confirmation.odt"),
    ("nda.html",            "nda.odt"),
    ("sla.html",            "sla.odt"),
    ("report.html",         "report.odt"),
    ("quotation.html",      "quotation.odt"),
    ("invoice.html",        "invoice.odt"),
    ("one-pager.html",      "one-pager.odt"),
    ("app-factsheet.html",  "app-factsheet.odt"),
]


# ----------------------------- extraction -----------------------------

class _Extractor(HTMLParser):
    """Pull title, headings, paragraphs, and bullet lists out of an HTML
    file. Drops everything else (style, script, mock visuals, classes,
    SVG, etc.). We are after the prose, not the layout."""

    # Note: 'head' is not skipped — we need to read <title>. Other head
    # children (meta, link) have no text content, so they're harmless.
    SKIP_TAGS = {"style", "script", "svg", "noscript"}
    BLOCK_TAGS = {"p", "li", "h1", "h2", "h3", "h4", "td", "th", "div"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title: str = ""
        self.blocks: list[tuple[str, str]] = []  # (kind, text)
        self._skip_depth = 0
        self._buf: list[str] = []
        self._current_tag: str = ""
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1
            return
        if tag == "title":
            self._in_title = True
            return
        if tag in self.BLOCK_TAGS:
            self._flush(self._current_tag)
            self._current_tag = tag

    def handle_endtag(self, tag: str) -> None:
        if tag in self.SKIP_TAGS:
            if self._skip_depth:
                self._skip_depth -= 1
            return
        if tag == "title":
            self._in_title = False
            return
        if tag in self.BLOCK_TAGS:
            self._flush(self._current_tag)
            self._current_tag = ""

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        if self._in_title:
            self.title += data
            return
        text = data.replace("\xa0", " ").strip()
        if text:
            self._buf.append(text)

    def _flush(self, kind: str) -> None:
        text = " ".join(self._buf).strip()
        self._buf.clear()
        if not text:
            return
        if kind in {"h1", "h2", "h3", "h4"}:
            self.blocks.append((kind, text))
        elif kind == "li":
            self.blocks.append(("li", text))
        elif kind in {"p", "td", "th"}:
            self.blocks.append(("p", text))
        elif kind == "div":
            # generic div, only keep if substantial and not duplicated
            if len(text) > 8:
                self.blocks.append(("p", text))


def extract(html_path: Path) -> tuple[str, list[tuple[str, str]]]:
    """Return (title, blocks) for an HTML file."""
    parser = _Extractor()
    parser.feed(html_path.read_text(encoding="utf-8"))
    title = (parser.title or html_path.stem).strip()
    # Dedupe consecutive identical blocks (common with overlapping nested divs)
    cleaned: list[tuple[str, str]] = []
    last: tuple[str, str] | None = None
    for block in parser.blocks:
        if block == last:
            continue
        cleaned.append(block)
        last = block
    return title, cleaned


# ----------------------------- ODF build ------------------------------

# Conduction tokens, mirrors tokens.css
COBALT      = "#21468B"
COBALT_700  = "#152D5C"
COBALT_400  = "#4D69A4"
COBALT_50   = "#EEF2F8"
ORANGE      = "#F36C21"


MIMETYPE_TEXT = "application/vnd.oasis.opendocument.text"
MIMETYPE_PRES = "application/vnd.oasis.opendocument.presentation"

MANIFEST_XML = """<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="{mime}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>
"""

META_XML = """<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                      xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
                      xmlns:dc="http://purl.org/dc/elements/1.1/"
                      office:version="1.3">
  <office:meta>
    <meta:generator>Conduction design-system / build-odf.py</meta:generator>
    <dc:title>{title}</dc:title>
    <dc:creator>Conduction B.V.</dc:creator>
    <meta:initial-creator>Conduction B.V.</meta:initial-creator>
    <dc:date>{date}</dc:date>
    <meta:creation-date>{date}</meta:creation-date>
  </office:meta>
</office:document-meta>
"""

STYLES_XML_WRITER = f"""<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                        xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
                        xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
                        office:version="1.3">
  <office:font-face-decls>
    <style:font-face style:name="Figtree" svg:font-family="Figtree, 'Helvetica Neue', Arial, sans-serif"
                     xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"/>
    <style:font-face style:name="IBM Plex Mono" svg:font-family="'IBM Plex Mono', Menlo, Consolas, monospace"
                     xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"/>
  </office:font-face-decls>
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:text-properties style:font-name="Figtree" fo:font-size="11pt" fo:color="{COBALT_700}"/>
      <style:paragraph-properties fo:line-height="150%" fo:margin-top="0cm" fo:margin-bottom="0.25cm"/>
    </style:default-style>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>

    <style:style style:name="Heading_20_1" style:display-name="Heading 1"
                 style:family="paragraph" style:next-style-name="Standard">
      <style:text-properties style:font-name="Figtree" fo:font-size="24pt" fo:font-weight="bold" fo:color="{COBALT}"/>
      <style:paragraph-properties fo:margin-top="0.6cm" fo:margin-bottom="0.3cm"/>
    </style:style>

    <style:style style:name="Heading_20_2" style:display-name="Heading 2"
                 style:family="paragraph" style:next-style-name="Standard">
      <style:text-properties style:font-name="Figtree" fo:font-size="16pt" fo:font-weight="bold" fo:color="{COBALT}"/>
      <style:paragraph-properties fo:margin-top="0.5cm" fo:margin-bottom="0.2cm"/>
    </style:style>

    <style:style style:name="Heading_20_3" style:display-name="Heading 3"
                 style:family="paragraph" style:next-style-name="Standard">
      <style:text-properties style:font-name="Figtree" fo:font-size="13pt" fo:font-weight="bold" fo:color="{COBALT_700}"/>
      <style:paragraph-properties fo:margin-top="0.4cm" fo:margin-bottom="0.15cm"/>
    </style:style>

    <style:style style:name="Subtitle" style:family="paragraph" style:next-style-name="Standard">
      <style:text-properties style:font-name="Figtree" fo:font-size="13pt" fo:color="{COBALT_400}" fo:font-style="italic"/>
      <style:paragraph-properties fo:margin-bottom="0.5cm"/>
    </style:style>

    <style:style style:name="Accent" style:family="text">
      <style:text-properties fo:color="{ORANGE}" fo:font-weight="bold"/>
    </style:style>

    <style:style style:name="List" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-left="0.6cm" fo:margin-bottom="0.15cm"/>
    </style:style>

    <style:style style:name="Footer" style:family="paragraph">
      <style:text-properties style:font-name="IBM Plex Mono" fo:font-size="9pt" fo:color="{COBALT_400}"/>
      <style:paragraph-properties fo:margin-top="1cm" fo:border-top="0.5pt solid {COBALT}"
                                   fo:padding-top="0.25cm"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PL1">
      <style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm"
                                    fo:margin-top="2.2cm" fo:margin-bottom="2cm"
                                    fo:margin-left="2.2cm" fo:margin-right="2.2cm"
                                    style:print-orientation="portrait"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="PL1"/>
  </office:master-styles>
</office:document-styles>
"""


def _xml_escape(text: str) -> str:
    return html.escape(text, quote=False)


def _content_xml(title: str, blocks: list[tuple[str, str]], source_url: str) -> str:
    """Build content.xml body from extracted blocks."""
    out: list[str] = []
    out.append('<?xml version="1.0" encoding="UTF-8"?>')
    out.append('<office:document-content '
               'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" '
               'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" '
               'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
               'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" '
               'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" '
               'office:version="1.3">')
    out.append('<office:body><office:text>')

    # Document title (h1, brand cobalt)
    out.append(f'<text:h text:style-name="Heading_20_1" text:outline-level="1">'
               f'{_xml_escape(title)}</text:h>')
    out.append('<text:p text:style-name="Subtitle">'
               'Working copy. Editable in LibreOffice, OnlyOffice, or Microsoft Word. '
               'For pixel-accurate layout, see the canonical HTML.</text:p>')

    # Blocks
    pending_list: list[str] = []
    def flush_list() -> None:
        if not pending_list:
            return
        out.append('<text:list>')
        for item in pending_list:
            out.append(f'<text:list-item><text:p text:style-name="List">'
                       f'{_xml_escape(item)}</text:p></text:list-item>')
        out.append('</text:list>')
        pending_list.clear()

    for kind, text in blocks:
        if kind != "li":
            flush_list()
        if kind == "h1":
            # Already used the doc title as h1; demote remaining h1 to h2.
            out.append(f'<text:h text:style-name="Heading_20_2" text:outline-level="2">'
                       f'{_xml_escape(text)}</text:h>')
        elif kind == "h2":
            out.append(f'<text:h text:style-name="Heading_20_2" text:outline-level="2">'
                       f'{_xml_escape(text)}</text:h>')
        elif kind in {"h3", "h4"}:
            out.append(f'<text:h text:style-name="Heading_20_3" text:outline-level="3">'
                       f'{_xml_escape(text)}</text:h>')
        elif kind == "li":
            pending_list.append(text)
        else:
            out.append(f'<text:p text:style-name="Standard">'
                       f'{_xml_escape(text)}</text:p>')
    flush_list()

    # Footer
    out.append('<text:p text:style-name="Footer">'
               f'Canonical layout: {_xml_escape(source_url)} '
               '· Conduction design system · tokens.css '
               f'· generated {datetime.date.today().isoformat()}'
               '</text:p>')

    out.append('</office:text></office:body></office:document-content>')
    return "".join(out)


def _pack_odt(path: Path, mimetype: str, manifest: str, meta: str,
              styles: str, content: str) -> None:
    """Write a valid ODF zip with mimetype first and uncompressed."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # mimetype: first, uncompressed, no extra fields. This is the
        # ODF rule that lets file-type sniffers identify the format.
        mt = zipfile.ZipInfo("mimetype")
        mt.compress_type = zipfile.ZIP_STORED
        zf.writestr(mt, mimetype)
        zf.writestr("META-INF/manifest.xml", manifest)
        zf.writestr("meta.xml", meta)
        zf.writestr("styles.xml", styles)
        zf.writestr("content.xml", content)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buf.getvalue())


def build_odt(html_path: Path, out_path: Path) -> None:
    title, blocks = extract(html_path)
    source_url = f"{SITE_BASE}/{html_path.name}"
    content = _content_xml(title, blocks, source_url)
    manifest = MANIFEST_XML.format(mime=MIMETYPE_TEXT)
    meta = META_XML.format(title=_xml_escape(title),
                           date=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"))
    _pack_odt(out_path, MIMETYPE_TEXT, manifest, meta, STYLES_XML_WRITER, content)


# ----------------------------- ODP build ------------------------------

STYLES_XML_IMPRESS = f"""<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                        xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
                        xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
                        xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
                        xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
                        office:version="1.3">
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:text-properties style:font-name="Figtree" fo:font-size="18pt" fo:color="{COBALT_700}"/>
    </style:default-style>
    <style:style style:name="TitleStyle" style:family="paragraph">
      <style:text-properties style:font-name="Figtree" fo:font-size="40pt" fo:font-weight="bold" fo:color="{COBALT}"/>
    </style:style>
    <style:style style:name="SubtitleStyle" style:family="paragraph">
      <style:text-properties style:font-name="Figtree" fo:font-size="20pt" fo:color="{COBALT_400}"/>
    </style:style>
    <style:style style:name="Accent" style:family="text">
      <style:text-properties fo:color="{ORANGE}" fo:font-weight="bold"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PL1">
      <style:page-layout-properties fo:page-width="25.4cm" fo:page-height="14.288cm"
                                    style:print-orientation="landscape"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <draw:layer-set/>
    <style:master-page style:name="Default" style:page-layout-name="PL1"/>
  </office:master-styles>
</office:document-styles>
"""

CONTENT_XML_IMPRESS = """<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                         xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
                         xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                         xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
                         xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
                         xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
                         xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
                         office:version="1.3">
  <office:body><office:presentation>
    <draw:page draw:name="Cover" draw:master-page-name="Default">
      <draw:frame svg:x="1.5cm" svg:y="3.5cm" svg:width="22cm" svg:height="3.5cm">
        <draw:text-box><text:p text:style-name="TitleStyle">Conduction · ConNext</text:p></draw:text-box>
      </draw:frame>
      <draw:frame svg:x="1.5cm" svg:y="7.5cm" svg:width="22cm" svg:height="2cm">
        <draw:text-box><text:p text:style-name="SubtitleStyle">Deck template · 16:9 · tokens-driven</text:p></draw:text-box>
      </draw:frame>
    </draw:page>
    <draw:page draw:name="Title-and-body" draw:master-page-name="Default">
      <draw:frame svg:x="1.5cm" svg:y="1cm" svg:width="22cm" svg:height="2cm">
        <draw:text-box><text:p text:style-name="TitleStyle">Slide title</text:p></draw:text-box>
      </draw:frame>
      <draw:frame svg:x="1.5cm" svg:y="4cm" svg:width="22cm" svg:height="9cm">
        <draw:text-box>
          <text:p text:style-name="SubtitleStyle">One claim per bullet.</text:p>
          <text:p text:style-name="SubtitleStyle">Subject is a person, never a system.</text:p>
          <text:p text:style-name="SubtitleStyle">Result before motivation.</text:p>
        </draw:text-box>
      </draw:frame>
    </draw:page>
    <draw:page draw:name="Closing" draw:master-page-name="Default">
      <draw:frame svg:x="1.5cm" svg:y="5cm" svg:width="22cm" svg:height="3cm">
        <draw:text-box><text:p text:style-name="TitleStyle">Vragen?</text:p></draw:text-box>
      </draw:frame>
      <draw:frame svg:x="1.5cm" svg:y="8.5cm" svg:width="22cm" svg:height="2cm">
        <draw:text-box><text:p text:style-name="SubtitleStyle">ruben@conduction.nl · conduction.nl</text:p></draw:text-box>
      </draw:frame>
    </draw:page>
  </office:presentation></office:body>
</office:document-content>
"""


def build_odp(out_path: Path) -> None:
    manifest = MANIFEST_XML.format(mime=MIMETYPE_PRES)
    meta = META_XML.format(title="Conduction deck template",
                           date=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"))
    _pack_odt(out_path, MIMETYPE_PRES, manifest, meta,
              STYLES_XML_IMPRESS, CONTENT_XML_IMPRESS)


# ----------------------------- main ----------------------------------

def main() -> int:
    ODT_OUT_DIR.mkdir(parents=True, exist_ok=True)
    DECK_OUT_DIR.mkdir(parents=True, exist_ok=True)

    built = 0
    for src, dst in ODT_TARGETS:
        src_path = PRINT_DIR / src
        out_path = ODT_OUT_DIR / dst
        if not src_path.exists():
            print(f"[skip] {src} (no source)", file=sys.stderr)
            continue
        build_odt(src_path, out_path)
        size = out_path.stat().st_size
        print(f"  + {dst:30s} {size:>6d} B   from {src}")
        built += 1

    deck_out = DECK_OUT_DIR / "template.odp"
    build_odp(deck_out)
    print(f"  + {deck_out.name:30s} {deck_out.stat().st_size:>6d} B   (deck template)")
    built += 1

    print(f"\nBuilt {built} ODF file(s) under preview/print/odf/ + preview/decks/odf/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
