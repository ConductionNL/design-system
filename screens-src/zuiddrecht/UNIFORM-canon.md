# Canon: one setup per pattern for every Zuiddrecht board (8 Oct, after the uniformity audit)

Source: `audit/laneA.md` to `audit/laneF.md` (659 boards). Decisions by Ruben on 8 Oct (evening): breadcrumb ends in the kenmerk; settings save bottom right per section stands (PqBeheer to be fixed); card grid 260px as a theme token stands (LijstKaarten to be fixed). Earlier decisions: buildiq is the orange icon square everywhere (BRIEF-app-pages line on the labelled detail button is withdrawn); decidiq's quick action is "Overleg en koppelingen"; dialog widths are 560 (confirmation), 640 (form), 720 (wizard or a dialog with a table). The index list family is the DqZaken setup everywhere (Ruben, 8 Oct, after `audit/lijst-vergelijking.html`).

## 1. Chrome
- App boards: `DqKop` import plus `AppZijbalk` (or the app's own sidebar import), never a hand copy of the top bar. One nav array per app, identical on every board of that app; module pages open from the Geavanceerd foldout, not as extra simple-menu entries. `active` is never empty.
- Admin settings: the Nextcloud admin settings chrome (settings nav, breadcrumb "Beheerinstellingen / App / Sectie"), never the app sidebar. Personal settings: the same chrome with the personal nav.
- Citizen boards: `Kop`, `MijnMenu` (import, never an inline copy), `Voet`. No buildiq square in the citizen header (drop `beheer=true` on MijnOverzicht and SessieVerloopt).
- Content padding 24px 28px. Sidebar footer: Help then Geavanceerd. No "Meer" group in any nav.

## 2. Header block
- Two rows on the grey ground, no wrapper. Row 1: h1 28 bold left, buttons right. Row 2: subtitle ("X van Y ...") or pills, breadcrumb, middle dot, meta.
- Index button order: Downloaden (outlined, icon plus label "Downloaden"), Acties (only where the manifest has header actions, labelled, icon plus text), buildiq square, primary. buildiq sits directly left of the primary.
- Detail button order: quick actions, Bewerken, buildiq square, Meer (labelled, never an icon-only dots button). Delete lives in Meer. No primary unless the page is an editor or the manifest names a main action. A "Wat nu?" card carries the next step; the header never does.
- Dashboard: h1 first, subtitle under it, buildiq plus primary right. Dashboard title is the page name ("Vandaag", "Dashboard"), the greeting or date goes in the subtitle.
- Tab counts are a grey circle badge after the label, never "(3)" or "Indeling 6" in the label text.

## 3. Index lists (decided 8 Oct: the DqZaken setup everywhere)
- Copy the toolbar markup and the `views`/`modes` code from `DqZaken.dc.html`. Saved-view chips sit on the grey ground above the card as pressed buttons with a grey count badge; Filter with count badge and the 4-mode switch (tabel, kaarten, bord, kaart, always all four, in that order) right; the search field and active filter chips with "Alles wissen" under them, always drawn.
- Table in a white card with a checkbox column and a bulk band (the band appears when rows are selected; draw it only on boards that show a selection). One "..." menu button per row in an "Acties" column; no hover icons, no inline text buttons per row. Row 1 may show the "..." open.
- Row menu (Ruben, 9 Oct): when the row opens a detail page, the "..." menu offers "Bewerken" (pencil icon), never "Bekijken", "Openen" or "Details", because clicking the row already views. If the menu has both, drop the view item. Objects without a detail page keep their view item. English boards use "Edit".
- Footer: "X van Y" left, numbered pagination (1 2 3 ›, "Volgende") right. No "Meer tonen".
- Card lists and catalogues keep their cards but get the same chips, Filter and switch above them, and the same footer.
- Also fixed: one labelled Filter button ("Filter" or "Filteren"); folder tabs above the toolbar where the page has tabs; a dialog's dimmed backdrop is an exact copy of the real index board; no annex sections on the board; empty state drawn, never described.

## 4. Detail pages
- Folder tabs with grey count badges, no icons, Overzicht first, Historie as the last tab (not a section), Acties button right of the strip, one strip per page, no overflow tab named "Meer".
- Tab and panel join (Ruben, 9 Oct): the panel card under the strip has its own full border with the radius `0 12px 12px 12px`; the strip has no underline and is `position: relative`, so the open tab (white, `margin-bottom: -1px`) paints over the card's top border and flows into it. No line under the open tab, no stray line above the top right corner. Copy it from `Tabs.dc.html`.
- Side column 300px of small cards (wie, deadline, gekoppeld), Historie card with the kenmerk line at the end.
- Stepper and "Wat nu?" card only where the manifest has nextStep. The "Wat nu?" card holds the one primary next-step button.
- No avatar in the title row; the last breadcrumb is the object's kenmerk (zaaknummer, ticketnummer) where the object has one, otherwise the title; the h1 carries the title (Ruben, 8 Oct); the aria-label of the tablist names the object.

## 5. Dialogs
- Dimmed page rgba(27,28,29,0.45), white, radius 12, title 20 bold with an eyebrow context line above it, round close X top right.
- Widths: 560 confirmation, 640 form, 720 wizard or table. Nothing else.
- Footer right aligned: optional tertiary far left, Annuleren (outlined secondary, never a text link, never "Sluiten" on a confirm step), primary rightmost with an icon and a specific verb (never "Bevestigen"). A read-only dialog ends with one secondary "Sluiten". An editor dialog ends with Annuleren plus Opslaan.
- Destructive: #a30000 filled; type-to-confirm keeps the red button disabled until the value matches. Never an inline confirmation inside a table row.
- Required fields: optional fields marked "(niet verplicht)" / "(optional)"; required fields unmarked; the sentence "Een veld zonder niet verplicht moet u invullen" on citizen forms; no asterisks.

## 6. Wizards and form steps
- Inline numbered steps (28px circles, green check when done, connector line) under the title; eyebrow "<context>, stap N van M"; footer Annuleren (secondary), Terug (secondary), primary Volgende or the finishing verb; width 720.
- Full-page forms end in a hairline footer inside the card: Annuleren or Vorige left as secondary, the primary right. Step buttons use chevrons, not arrows.

## 7. Dashboards
- KPI tile: label 14 grey, value 28 bold, note 13; icon chip only when the tile is a link to a filtered list. Grid auto-fit minmax 200px. Coloured meta only for a warning. Period as a segmented group. Bars as horizontal rows.
- "Vandaag eerst" card: blue bar, red only when overdue.

## 8. Kanban
- Toolbar as the index list on top. Columns minmax(240px, 1fr), gap 16, padding 12, ground #eceef1, horizontal scroll. Column header: dot, title, white count badge, optional sum line. Card: title, sub line, status pill, footer with due date and avatar. Dashed "Nog N tonen" when a column is cut. Primary in the header. Mini boards (DcOverleg, DcDashboard) keep their anatomy.

## 9. Settings pages
- Admin settings in the settings chrome; folder tabs with grey count badges where sections are many; one save per section as a primary at the bottom right of its card, or one header Opslaan plus the "Wijzigingen" side card when the page is one form. Never both. Documentatie is a secondary left of buildiq. Personal settings say "wordt direct opgeslagen" in the subtitle, or end with Annuleren plus Opslaan when they are a dialog.

## 10. Smaller patterns
- Empty state: inside the card, icon, one bold line, one grey sentence, optional button; dashed boxes only for drop zones.
- Case and catalogue cards: grid minmax(260px, 1fr), title link, status pill top right, short dl, one action at the bottom. Citizen case cards are the Den Haag folder card.
- Timeline: Historie as a tab with a chip filter on top; count badges grey #e4e6ea everywhere.
- Rooster: the teacher hour grid for every role, labelled Vorige, Deze week, Volgende, switch Week, Dag, Lijst.
- Reports: filter card above the report card, export labelled "Downloaden", "Rapport" pill before the breadcrumb.
- Copy: sentence case ("Point of sale", "My work"), no typed "+", no "›" in prose, no text glyph icons (SVG only), diaeresis in geüpload and geïmporteerd, "Functiehouders", "Historie".
- Boards must be tall enough for their footer (eight Mijn boards are cut off).
