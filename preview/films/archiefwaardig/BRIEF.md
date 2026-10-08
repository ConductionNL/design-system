# Archiefwaardig (nl)

Story and screens adapted from the demo 'Archiefwaardige opslag voor de medewerker' by Erik Hoekstra (Gemeente Haarlem), EUPL-1.2, https://github.com/EHa-1999/XENA

The film redraws the demo's ideas in Conduction's own tokens, type and cobalt world. No colours, logos, names or places from the demo appear on screen. The attribution lives here and in the film.js header, not on screen.

Status: **animatic** (timed storyboard with voice, half-scale proof). Not a master.

## Context
- Who watches it: information managers and IT leads at a Dutch municipality, and the employees they work for
- Where it plays: product page and event screens, sound on; it also reads muted
- Length: 49 bars at 128 BPM (91.875 s), 24 fps, 1920 x 1080
- Language: Dutch (on screen and voice)

## The one idea
- Logline: Nextcloud becomes the only DMS where the storage itself enforces the retention period, in the windows people already use.
- The question card: "Wat als opslaan al archiveren is?"
- The claim: "Het enige DMS waar de opslag zelf de bewaartermijn afdwingt". Source: the demo above (register plus S3 Object Lock under Nextcloud). Ruben to confirm the "only DMS" wording before the master.

## Story device
- What travels: one file, "Besluit subsidie.docx". It stays in the question, is written in Word, refused, moved and shown in every window.
- How it crosses each cut: held window with a text-swap (1 to 2), card flips (2 to 3, 3 to 4), scroll-whips (4 to 5 to 6 to 7), a whip-pan (7 to 8), a turn-over (8 to 9), a camera dive (9 to 10 to 11), then the windows turn over and out into Built on.

## Voice
- Calm, concrete, one handelingscasus per line. Sanne is fictional. A neutral "gemeente", never a real one.
- Voice-over: twelve generated Dutch takes in ./voice (provisional voice), aligned with WhisperX. The voice is master: every caption word and every move in a scene starts on the word that says it.
- Banned here: real municipalities, real people other than Sanne, third-party logos (SharePoint, Teams and Word are plain labelled windows).

## Structure (beat sheet)
Scene lengths come from the voice: ./scenes/plan.js puts each take's first word on beat 2 of its scene and sizes the scene to the whole beats that fit the take plus a breath, and the caption plus its reading hold. Cuts land on beats; sections land on bars.

| Bars (film) | Scene | Beats | On screen | Voice |
|---|---|---|---|---|
| 1 to 3 | Conduction opening | 12 | shared | |
| 4.1 to 8.2 | Netwerkschijven | 18 | Niemand weet wat / bewaard moet blijven | 01 |
| 8.3 to 11.1 | Archiefwaardig (question) | 11 | Wat als opslaan al / *archiveren* is? | 02 |
| 11.2 to 15.2 | Opslaan in Word | 17 | Metagegevens staan / al klaar | 03 |
| 15.3 to 18.2 | Bewaartermijn | 12 | De opslag zelf / weigert | 04 |
| 18.3 to 21.3 | Juridische blokkade | 13 | Dan bevriest het / hele dossier | 05 |
| 21.4 to 25.2 | Herroepen | 15 | Binnen een dag / zelf terugdraaien | 06 |
| 25.3 to 28.4 | Verplaatsen | 14 | De gedeelde link / blijft werken | 07 |
| 29.1 to 32.2 | Versleuteling | 14 | Vertrouwelijke stukken / een eigen sleutel | 08 |
| 32.3 to 35.2 | Overal | 12 | Overal waar je / al werkt | 09 |
| 35.3 to 38.4 | Onder de motorkap | 14 | Daaronder draait / Nextcloud | 10 |
| 39 to 42 | Het enige DMS | 16 | Opslag dwingt de / *bewaartermijn* af | 11 |
| 43 to 46 | Gebouwd op Nextcloud | 16 | shared (lang nl) | 12, "Verrijkt" on its rise |
| 47 to 49 | Install board | 12 | shared | |

Caption words in the body: 53 (17.3 per 30 s; worst 30 s window 29).

## Build
- Page: preview/films/archiefwaardig/ (index.html, film.js, scenes/plan.js, scenes/body.js, boards/nl/board.js)
- Reusable atoms: preview/films/_lib/atoms/records.js (window frame, file row, status pill, lock, legal hold, encryption badge, refusal chain, version stack, properties pane, revocation clock, shredded lines)
- Storyboard: preview/films/board.html?film=archiefwaardig&v=nl

## Gotchas
- The brief asked for the refusal to stop "red" at the storage. The palette has no red; the stop is the scene's one orange (the answer).
- "Register" appears as a small layer label in the architecture scene because the brief asks for it; the bible lists "register" as a platform internal to keep off screen. Ruben to decide.
- Take 04 transcribes as "Je probeert", take 07 as "Plaats je": check the audio before the master.
