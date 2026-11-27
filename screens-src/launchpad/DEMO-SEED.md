# Launchpad demo seed

What the demo environment needs so that every launchpad board on
[identity.conduction.nl/screens](https://identity.conduction.nl/screens/) can be reproduced in a running
instance. One section per board: the dashboard it shows, the widgets on it with their configuration, and the
demo data behind them. A build agent implements this as the launchpad demo seed (`occ launchpad:demo:load` or
the setup wizard step Voorbeelden). Dates are relative to the demo day, Monday 5 October 2026, 10:47.

The boards are the UI canon. Where the seed and a board disagree, the board wins and the seed is amended.

## Rules that every board follows

- No left menu. Launchpad has no app side bar, no "Menu" button, no "Startpagina aanpassen" and no Bewerken
  button in the page header. The header holds one action: Meer.
- One Meer menu, identical on every dashboard (board LpMeer):
  - Left column, Dashboards: the user's favourite dashboards, marked standaard, gedeeld or groep, each with
    a filled yellow star; at the bottom Meer, which turns the column in place into the scrolling list of
    every dashboard the user can open (board LpMeerAlle), each row with a star: filled yellow is a
    favourite, empty is not, a click toggles it, stored per user; Minder closes the list again. Als
    standaard instellen stays a separate action on the right.
  - Right column, Dit dashboard: Bewerken (enters edit mode), Widget toevoegen, Delen, Link naar dit dashboard
    kopiëren, Kopie maken als nieuw dashboard, Downloaden, Als standaard instellen, then Verwijderen in the
    error colour above a rule.
  - Footer under both columns: the logos Powered by sendent and Conduction. No left side bar with
    dashboards and no Downloaden button in the page header: both live in this menu only.
  - Instellingen: one expandable item at the bottom of the right column, under Verwijderen and a second rule,
    that unfolds in place: Persoonlijke instellingen, Beheerinstellingen, Marktplaats, Sjablonen, Rapporten,
    Flows, Koppelingen, Documentatie, Functies en roadmap. Under 960 px the menu is one column: Dashboards,
    Dit dashboard, Instellingen last.
  - Not in the menu: Versies (a tab of the dashboard settings), Inplannen and Publicatie intrekken (tab
    Publicatie), and a separate Instellingen entry under Dit dashboard.
- Edit mode shows the edit bar (LpBewerken): the draft pill (Concept · n wijzigingen), Kolommen, Widget
  toevoegen (tiles too: there is no separate Tegels toevoegen button), Dashboardinstellingen (opens the
  settings modal with the tabs Details, Talen, Delen, Publicatie, Exports, Versies), Annuleren and
  Opslaan. Changes stay a draft until Opslaan; leaving edit mode with unsaved changes asks Wijzigingen
  opslaan? with Niet opslaan, Verder bewerken and Opslaan. There is no hint that changes are saved at once.
- No buildiq control anywhere.
- The grid sits on the page ground (`--sc-work-ground`), widgets are white cards, app tiles are coloured squares.
- Every application is its own widget on the dashboard grid: one grid cell, square, solid tile colour, one
  white icon at about 45% of the tile, no printed label. Same grid unit and gaps as every other widget,
  individually movable and resizable in edit mode, with its own drag handle and widget menu. There is no
  Apps container, no shared header and no "Alle apps" link bound to the tiles. The app name is the
  accessible name and the tooltip. Optional overlays: a count
  badge (white pill, top right), a pin (top left) and a red outage dot (top right, replaces the badge).
- Tile colours are the eight theme tokens, so they follow the design system: `--sc-primary`,
  `--sc-primary-deep`, `--sc-accent`, `--sc-accent-deep`, `--sc-work-ink`, `--sc-work-text`,
  `--sc-work-muted`, `--sc-work-field`. White on each of them meets the 3:1 non-text contrast minimum. The
  Zuiddrecht token set has no green, teal or purple; when a theme adds those tokens the palette grows.
- A heading above tiles or widgets is a **Tussenkop** widget: its own full-width grid placement with a title and
  one line of explanation, no card. Tile groups ("Mijn apps", "Samenwerken") are a Tussenkop placement
  followed by one tile placement per app.
- The picker (Widget toevoegen, board LpWidgetKiezen) is the one place where widgets are added, tiles
  included. It is 1120 px wide and every card carries a miniature of the widget: its real parts, scaled
  down, with sample data, never a static image. One widget App- of linktegel (LpTegelToevoegen,
  LpTegelBewerken) replaces the app tile and the link tile: its form opens with the choice app (pick the
  app, with its icon and count of new items) or link (webadres, titel, pictogram); tile colour, text colour
  (theme colours plus white and black, white by default, with a WCAG AA contrast check), what is on the
  tile and pin apply to both. The multi-tile widget is gone: tiles are grouped with the widgets Container
  and Tabbladen. Default tiles (Conduction, Nextcloud, sendent) show the white logo on the brand colour,
  without payoff.
- The first dashboard of a new user is called "Mijn werkplek".
- Launchpad's admin page is /settings/admin/launchpad, inside Nextcloud's settings framework (ADR-004,
  ADR-079; boards LpBeheer*): Nextcloud's admin menu on the left, the version card first, then one settings
  section per feature; every former admin tab is a tab of that page. It is not launchpad's app shell: no
  launchpad header, no menu Meer, nothing buildiq can customise. /apps/launchpad/admin is gone. Users who
  manage announcements without being admins reach it as a delegated admin setting.
- Announcements are managed from settings, not from the widget (boards LpAankondiging, LpLeesbevestigingen):
  the tab Aankondigingen of that admin page, linked from Instellingen in the menu Meer (entry Aankondigingen)
  for users who may manage them and from the Aankondigingen widget (link Beheren) for those same users, does
  all create, edit, schedule, end and delete of news and maintenance notices, and shows per announcement who
  saw it and who confirmed reading it. There is no separate window. A reader confirms by pressing the check or the x on the announcement, or on the notice banner
  at the top; both count. The widget shows announcements with the check and the x only; likes, comments
  and follow live in the announcement's own view behind Openen.

## Users and groups

| User | Display name | Groups | Role |
|---|---|---|---|
| `pieter` | Pieter Jansen | `vergunningen`, `medewerkers` | Medewerker (default role) |
| `marieke` | Marieke Jansen | `vergunningen`, `teamleiders`, `medewerkers` | shares Team Vergunningen |
| `sanne` | Sanne de Vries | `vergunningen`, `medewerkers` | |
| `thomas` | Thomas Brouwer | `vergunningen`, `bestuurszaken`, `medewerkers` | |
| `yasmina` | Yasmina El Amrani | `vergunningen`, `medewerkers` | starts next Monday |
| `hanneke` | Hanneke Visser | `directie`, `medewerkers` | gemeentesecretaris |
| `communicatie` | Team Communicatie | `communicatie`, `medewerkers` | owns Intranet Zuiddrecht |
| `beheer` | Functioneel beheerder | `admin`, `launchpad-beheer` | admin boards |
| `nieuw` | Noor Nieuw | `medewerkers` | no dashboard yet (LpEersteKeer) |

## App tiles (shared catalogue)

Every tile below exists once in the tile catalogue; dashboards reference them. Health pings run against the
demo stubs; `Raadsinformatie` is configured to fail so the outage dot shows.

| App | Icon (MDI) | Colour token | Target | Badge source | Pinned |
|---|---|---|---|---|---|
| Zaaksysteem | briefcase | `--sc-primary` | dossiq, Mijn zaken | open cases: 14 | yes |
| Outlook web | email | `--sc-primary-deep` | SSO link outlook.office.com | unread mail: 3 | yes |
| TOPdesk | headset | `--sc-accent` | SSO link | none | |
| Raadsinformatie | gavel | `--sc-work-field` | web link, health check fails since 09:12 | outage | |
| Kadasterviewer | map | `--sc-work-muted` | web link | none | |
| Declaraties | receipt | `--sc-work-text` | web link | none | |
| Talk | forum | `--sc-work-ink` | Nextcloud Talk | unread conversations: 2 | |
| Agenda | calendar | `--sc-primary` | Nextcloud Calendar | none | |
| Word | microsoft-word style office icon | `--sc-primary-deep` | Office tile, new document | none | |
| Bestanden | folder | `--sc-work-muted` | Nextcloud Files | none | |
| Smoelenboek | account-group | `--sc-accent-deep` | Nextcloud Contacts | none | |
| Verlof en rooster | airplane | `--sc-work-text` | web link | none | |
| Personeelsgids | book | `--sc-work-text` | personeelsgids.zuiddrecht.nl (allowed site) | none | |

## Shared demo data

- **dossiq, register Zaken**: 312 cases. Status split: In behandeling 138, Wacht op aanvrager 74, Wacht op
  advies 46, Afgerond deze maand 54. Per zaaktype: Omgevingsvergunning 96, Woo-verzoek 54, Melding openbare
  ruimte 72, Bezwaar 31, Subsidie 25, Parkeervergunning 34. Per month, April to September, applications
  112, 98, 130, 121, 142, 136 and decisions 95, 104, 118, 110, 125, 140. Assigned to `pieter` (14 open):
  Z-2026-0412 Kapvergunning Molenweg 4 (Omgevingsvergunning, In behandeling, deadline today),
  Z-2026-0398 Woo-verzoek bomenkap Lindelaan (Beslissing opstellen, tomorrow),
  Z-2026-0431 Evenement Stadshaven (Evenementenvergunning, Wacht op advies, Thursday 8 October),
  Z-2026-0440 Dakkapel Kerkstraat 12 (Omgevingsvergunning, Wacht op aanvrager, 21 October); counts for
  Pieter: 6 in behandeling, 5 wachten op aanvrager, 3 termijn deze week.
- **OpenProject**: project Havenpark with work packages Welstandsadvies verwerken (In uitvoering, due today,
  Pieter), Planning inspraakavond 14 oktober (Nieuw, tomorrow, Sanne), Verkeersbesluit Havenkade (Wacht op
  reactie, Friday 9 October, Thomas), Collegevoorstel Havenpark (In uitvoering, 13 October, Marieke); project
  Stadshaven fase 2 with Raming herinrichting Stadshaven (Wacht op reactie, Friday 9 October, Pieter); project
  Mobiliteit 2026 with Evaluatie pilot deelauto's (In uitvoering, 16 October, Pieter). Pieter has 5 open.
- **XWiki**, space Kennisbank Zuiddrecht and space Vergunningen: pages Werkinstructie kapvergunningen,
  Termijnen Omgevingswet, Sjablonen besluiten, Toetsingskader welstand 2026, Checklist volledigheid aanvraag,
  Welstand: toetsingskader 2026 (edited today), Legesverordening 2026 (yesterday), Onboarding team
  Vergunningen (Friday), Agenda casusoverleg 7 oktober (today). Favourites of `pieter`: the first three.
- **Mail** for `pieter`: 3 unread (Marieke Jansen, Welstandsadvies Havenpark 10:21; M. de Graaf, Re:
  aanvullende stukken kapvergunning Molenweg 4 09:48; Omgevingsdienst Zuid-Holland Zuid, Advies geluid
  evenement Stadshaven, Friday).
- **Calendar** for `pieter`, demo day: 09:30 Weekstart team Woo en informatie (kamer 2.14), 11:00 Overleg
  vergunningverlening Havenpark (Talk, 4 participants), 13:00 Bellen met M. de Graaf, 13:30 Spreekuur bouwen
  en wonen (balie 3), 15:00 Voorbereiding collegevergadering, 15:30 Bellen met M. de Graaf. Team calendar
  `vergunningen`: Mon 09:00 Weekstart, Wed 09:30 Casusoverleg, Thu 14:00 Welstandscommissie, Fri 15:30
  Taart: 1.000e omgevingsvergunning.
- **Files**, folder Vergunningen shared with `vergunningen`: Besluit kapvergunning Molenweg 4.docx (10:12),
  Advies welstand Havenpark.pdf (Friday), Checklist omgevingsvergunning.xlsx (28 Sep), Planning Havenpark
  Q4.xlsx (25 Sep).
- **Weather**: Zuiddrecht 13°, bewolkt, wind 4 zuidwest, forecast di 15°, wo 12°, do 14°; Utrecht 12°, buien.
- **Announcements**: Nieuwe werkwijze Woo-verzoeken vanaf 1 november (team Informatie, verplicht,
  read receipt due Friday 9 October, 128 of 164 confirmed, 24 likes, 6 reactions); maintenance banner
  Zaaksysteem in onderhoud zaterdag 10 oktober 08:00 tot 12:00.

## Boards

### LpEersteKeer: first visit

- User `nieuw`, no dashboard, tour not yet seen.
- Empty state offers "Maak mijn eerste dashboard (met startwidgets)" and "Leeg beginnen". The first creates
  the personal dashboard **Mijn werkplek** with six starter widgets: Apps (one tile per app from the user's
  tile catalogue), Agenda, Mail, Bestanden, Weer Zuiddrecht, Nieuws van de organisatie.
- Tour step 1 of 5 points at the Meer button.

### LpVandaag: start page

- Dashboard **Vandaag**, personal dashboard of `pieter`, marked as default (opens first), full-width start
  page without page scroll at 1440×900.
- Widgets: Vandaag eerst (attention items from dossiq and pipelinq), Mijn werk (four counters: dossiq 14
  open, pipelinq 5 open, decidiq 2, and one more), Tussenkop **Mijn apps**, then six separate tile
  placements in a 2 column block (Zaaksysteem, Outlook web, TOPdesk, Raadsinformatie, Kadasterviewer,
  Talk), Agenda vandaag, Verder waar u was (recent items). Below the frame, as a separate example: dossiq
  widget Mijn open werk.
- Meer menu open with Instellingen collapsed.

### LpWerkplek: personal workplace

- Dashboard **Mijn werkplek** of `pieter`, 3 column layout, last changed Friday.
- Tussenkop **Mijn apps** followed by six tile placements (Zaaksysteem, Outlook web, TOPdesk,
  Raadsinformatie, Kadasterviewer, Declaraties), Tussenkop **Samenwerken** followed by six tile placements
  (Talk, Agenda, Word, Bestanden, Smoelenboek, Verlof en rooster).
- Meer menu open with Instellingen expanded.
- Widgets: Klok, Zoeken op internet (DuckDuckGo), Mail (3), Weer Zuiddrecht, Agenda, Bestanden (map
  Vergunningen), Bladwijzers (three groups), **Wiki** (XWiki, space Kennisbank Zuiddrecht: search, three
  favourites, three recent pages), **Mijn werkpakketten** (OpenProject, assignee = current user, sorted by
  due date, 4 shown), **Mijn zaken** (dossiq, assignee = current user, counts per status and 4 cases with
  deadline and status), Assistent, Snelkoppelingen, Notities, Snel beginnen (Word in map Vergunningen),
  Organisatiemenu (menu widget as a grid widget), footer.
- Notification toast: Marieke Jansen shared Team Vergunningen.

### LpIntranet: group dashboard

- Dashboard **Intranet Zuiddrecht**, group dashboard of `communicatie`, shared with `medewerkers`, members
  may add widgets, languages nl and en, two widgets hidden by the user.
- Widgets in order: welcome header, Tussenkop **Samenwerken** followed by eight tile placements (Talk,
  Agenda, Bestanden, Word, Smoelenboek, Personeelsgids, Verlof en rooster, Declaraties), announcement with
  read receipt, Van de gemeentesecretaris (text), Tussenkop **Nieuws en media**, Nieuws (zuiddrecht.nl RSS),
  Video, Afbeelding, Tussenkop **Collega's**, Nieuwe collega's, Verjaardagen, Vind een collega op expertise,
  Tussenkop **Wegwijs**, **Menu** widget titled Intranetmenu (intranet section navigation: Werken bij
  Zuiddrecht, Faciliteiten, Organisatie), Personeelsgids (embedded page, allowed site), Werken op het
  stadskantoor (Markdown text), Nieuws van het oude intranet (SharePoint), Community Digitaal werken,
  reaction bar.
- Maintenance banner from the announcement data.

### LpAfdeling: department page

- Dashboard **Team Vergunningen**, shared by `marieke` with group `vergunningen`, members may add widgets.
- Widgets: Tussenkop **Apps van het team** followed by seven tile placements (Zaaksysteem, Kadasterviewer,
  TOPdesk, Raadsinformatie, Word, Bestanden, Talk), **Menu** widget "Wegwijs Vergunningen" (groups Werkafspraken, Overleg, Hulp, three
  links each), Van de teamleider (text, with read count 12 of 14 and 8 likes), Mijn zaken (dossiq), Werkpakketten
  van het team (OpenProject project Havenpark, all assignees), Wiki van het team (XWiki space Vergunningen),
  Teamagenda (calendar `vergunningen`, this week), Collega's (group members with availability), Teambestanden
  (folder Vergunningen).

### LpManagement: management information

- Dashboard **Managementinformatie**, group dashboard of `bedrijfsvoering`, view only for `pieter`, period
  selector, cross filter Zaaktype: Omgevingsvergunning active.
- Widgets: container Vergunningen deze maand (four KPI tiles from dossiq), **Cirkeldiagram** "Zaken per
  status" (source: register query dossiq Zaken grouped by status; donut, legend with value and percentage,
  total 312 in the centre; follows the cross filter), **Grafiek** "Aanvragen en besluiten per maand" (source:
  register query dossiq Zaken per month April to September; bars = aanvragen, line = besluiten, y axis 0 to
  150, legend), Lopende zaken per zaaktype (bar rows, clickable, sets the filter), Wachttijd KCC (live value,
  refresh 5 min), Uitgaven per afdeling, Compliance, Rapport Sociaal domein (Power BI embed), Beveiliging en
  toegang, Meldingen (map widget, PDOK), Koppelingen van dit dashboard.
- Both chart widgets also accept manual values (label, value, colour) as an alternative source.

### LpBewerken: edit mode

- Dashboard Mijn werkplek of `pieter` in edit mode, 12 columns, `marieke` editing at the same time (edit lock
  notice). The edit bar holds Kolommen, Widget toevoegen, Dashboardinstellingen and Klaar. Twelve app tile
  widgets in rows 1 and 2 (columns 1 to 6), each with its own drag handle and menu, the tile Talk being
  dragged above the dashed spot it came from, Klok and Weer Zuiddrecht in columns 7 to 12,
  then Mail, Weer Utrecht, Agenda, Assistent (selected, keyboard move panel), Bestanden (actions menu open),
  Notities, Snelkoppelingen, and the free spot for a new widget.

### LpMobiel: on the phone

- Mijn werkplek of `pieter` at 390 px: PWA install banner, notice that two widgets are hidden on a phone,
  Tussenkop Mijn apps and tile placements four per row (Zaaksysteem, Outlook web, TOPdesk, Raadsinformatie, Talk,
  Agenda, Bestanden, Verlof en rooster), Agenda, Mail, Klok, Weer, Bestanden, Notities.

### LpWidgetKiezen: widget picker

- Opened from Mijn werkplek. Categories with counts: Alles 52, Inhoud 12, Tegels en links 17, Mensen 3,
  Gegevens en grafieken 8, Uit andere apps 10, Office 4.
- Widgets van Launchpad: Tekst, **Tussenkop**, Afbeelding, Nieuws, Weer, Live gegevens, Ingesloten pagina (not allowed for
  role Medewerker), Power BI-rapport (not allowed), Collega's, **Cirkeldiagram**, **Grafiek**.
- **App-tegels**: one entry per app from the tile catalogue, drawn in the tile colour, plus "Eigen tegel".
- Uit andere Nextcloud-apps: Bestanden, Agenda, Talk, Deck, Recente activiteit (legacy), **Wiki**, **Mijn
  werkpakketten**, **Mijn zaken**.
- Assistant suggestion: Weer for Zuiddrecht, 3 columns, top right next to Agenda.

### LpTegelBewerken: edit a tile

- Tile Zaaksysteem: kind, internal address, open target, icon, **colour** (radio group of the eight theme
  tokens, white icon preview), sort order, health check.

### LpWidgetInstellen, LpZichtbaarheid, LpTegelToevoegen, LpDashboardInstellingen, LpDelen, LpVersies, LpAankondiging, LpLeesbevestigingen

- All open over Mijn werkplek of `pieter`. LpDashboardInstellingen shows the tabs Details, Talen, Delen,
  Publicatie, Exports and Versies; LpVersies is the same modal on the tab Versies; there are no saved views. The data they need is the shared demo data above plus:
  three dashboard versions (Friday by Pieter, Thursday by Marieke, 28 September by Pieter), one public link
  with password and expiry, one scheduled PDF export per Monday 07:00 by mail, and the announcement with its
  read receipts (164 recipients, 128 confirmed).

### LpPersoonlijk and LpInstellen

- LpPersoonlijk: the user settings dialog of launchpad, opened over Intranet Zuiddrecht, section
  Samenvatting per e-mail active. LpInstellen: the setup wizard at step 3 of 5 (Voorbeelden) for `beheer`.

### LpBeheerAlgemeen, LpBeheerSjablonen, LpBeheerRollen, LpBeheerDelen, LpBeheerOnderhoud, LpBeheerAnalyse, LpBeheerNavigatie

- The admin pages of launchpad for `beheer`, full width with tabs, no left navigation. Settings: default
  permission level Alleen toevoegen, personal dashboards on, maximum 10 dashboards per person and 40
  widgets per dashboard, launchpad as default app, allowed sites www.zuiddrecht.nl, app.powerbi.com,
  kcc-api.zuiddrecht.nl, www.youtube-nocookie.com, personeelsgids.zuiddrecht.nl; two templates rolled out to
  groups; roles Medewerker, Teamleider, Communicatie, Beheer; usage data for 30 days; the organisation menu
  tree (Organisatie, Werken bij, Hulp) and the footer (Over Zuiddrecht, Personeelsgids, Privacy,
  Toegankelijkheid, Ondernemingsraad, service desk line).

### LpPubliek, LpKiosk, LpStore

- LpPubliek: public start page of dashboard Openbare startpagina without login. LpKiosk: dashboard Vandaag in
  Zuiddrecht in kiosk mode, rotation 2 of 4. LpStore: the marketplace with the connected VNG dashboard
  register and four template cards. These need the public dashboard, the kiosk dashboard set and the store
  registry stub.

## What the app must build to match the boards

1. Remove the left navigation, the Menu button, Startpagina aanpassen and the Bewerken header button; one
   Meer menu as drawn on LpMeer, with Instellingen as an expandable item.
2. Remove the buildiq header control from every launchpad page.
3. App tiles as individual grid widgets (one cell, square, token colour, white icon, no label, accessible
   name and tooltip, badge, pin and outage overlays, own drag handle and menu in edit mode), the Tussenkop
   widget for headings, and the colour setting with the eight token swatches in the tile settings.
4. New widgets: Wiki (XWiki), Mijn werkpakketten (OpenProject), Mijn zaken (dossiq), Cirkeldiagram, Grafiek,
   each with a picker entry and a settings form that names its data source.
5. Picker section App-tegels with one entry per app and the entry Eigen tegel.
6. Menu widget on group and department dashboards, drawn as a card on the grid.
7. The edit bar with Widget toevoegen, Dashboardinstellingen and Klaar; Versies as a tab of the settings modal.
8. The demo seed above, including the department dashboard Team Vergunningen and the first-run user `nieuw`.
