# Film brief

Fill this in before anything is drawn. Short answers. If a field has no answer, the film is not ready.

```markdown
# <Film name>

## Context
- Who watches it: <one audience, in their own words>
- Where it plays: <LinkedIn feed, product page, event screen>; sound off by default? <yes/no>
- Length: <n> bars at 128 BPM (<seconds> s), 24 fps, 1920 x 1080
- Language: <English | Dutch> (one per film)

## The one idea
- Logline (one sentence, no "and"): <...>
- The question card (product films): "What if <...>?"
- The claim and its source: <claim> · <spec, positioning file or release note>

## Story device
- What travels through every scene: <the app tag, a record, a hex>
- How it crosses each cut: <match cut, grow, zoom-through, ...>

## Voice (three lines)
- How it sounds: <calm, direct, ...>
- Voice-over: <none | line(s) and language>; the voice is master if present
- Banned here: <words or claims to avoid for this audience>

## Cast
- Apps: <ids, as in appinfo/info.xml>
- Nextcloud apps: <Mail, Files, ...>
- Product UI: <which mock components to rebuild>

## Structure (beat sheet, on bars)
| Bars | Scene | Words on screen | What moves | Sound |
|---|---|---|---|---|
| 1 to 3 | Conduction opening | none | the shared sting | electricity, a click |
| 4 to 5 | Question | <...> | <...> | <...> |
| ... | ... | ... | ... | ... |
| last 7 | Built on Nextcloud, install board | shared | shared | shared |
Words in total: <n> (20 to 30; at most 35 per 30 s)

## Style frames
Three key frames, approved before the build: <links to the board stills>

## Build
- Page: preview/films/<slug>/
- Timeline: scenes, captions, cues and voice in film.js via _lib/timeline.js
- Transitions per seam: <...>

## Gotchas
- <anything the builder must not get wrong: a claim's exact wording, a colour, a name>
```

## Example answers

- Logline: "Every decision in a case is made on time, with the right information."
- Question card: "What if every decision was right, on time?"
- Story device: the case card; it is picked up from the backlog and grows into the next scene.
- Voice: calm, factual, no AI in a government casework film (round 8).
