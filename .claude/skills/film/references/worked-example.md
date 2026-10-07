# Worked example: Dossiq, municipal casework

The film is at [`preview/films/dossiq/casework/`](../../../../preview/films/dossiq/casework/), its
storyboard at `preview/films/board.html?film=dossiq&v=casework`. It was built before this skill
existed; this page walks it through the skill's steps to show what each gate looks like.

## 1 · Brief

- Audience: the people who run casework in a municipality.
- The one idea (round 21): Dossiq is a decision-making tool. Make the right decisions, when they are
  needed and the way they are needed, on the right information.
- Claims and sources: the flow builder, the knowledge graph, documents from inside the case, team
  backlogs, case standards (rounds 8 to 15; `audiences/positioning.md`).
- No AI in this film: it scares this audience (round 8).
- Length: 24 bars, 45 s. English.

## 2 · Treatment

Logline: "Every decision in a case is made on time, with the right information."
Story device: the case card. It is picked up in the backlog and carries the viewer from scene to scene.

| Bars | Scene | Words on screen | Transition in |
|---|---|---|---|
| 1 to 3 | Conduction opening | none | |
| 4 to 5 | promise | What if every decision / was right, on time? | the opening's handover |
| 6 to 7 | hook | Decisions due, / one backlog | cluster to container (#10) |
| 8 to 9 | documents | The whole workspace, / in the case | grow (#1) from the picked-up case |
| 10 to 11 | knowledge | Guidance appears / as you decide | text-swap on a held window (#9) |
| 12 to 13 | standards | International and local / standards, built in | stepped hex wipe (#5) |
| 14 to 15 | automate | You decide, / the flow follows | whip-pan (#11) |
| 16 to 17 | trail | Every decision, / on the record | zoom-through the step that ran |
| 18 to 21 | Built on Nextcloud | shared | the app tag travels in |
| 22 to 24 | install board | shared | flipping hexes and a re-zoom |

Words in the body: 39. Every scene is two bars, and every cut sits on a bar line.

## 3 · Style frames

Each scene has a key frame in `dossiq/boards/casework/board.js`, drawn with the film's own engine.
The film imports the same UI functions (`backlogUI`, `documentsUI`, ...) so the approved still is
exactly what gets animated.

## 4 · Timeline

The film takes its slots from the board (`start` and `end` per board), so film and storyboard share
one timing. Captions are recorded in `window.__dossiq.captions`, which is what `grid-check.mjs` reads.
A new film would declare the same plan with `_lib/timeline.js`.

## 5 to 7 · Build, sound, render

Scenes are drawn per frame from local time. Each hex flips in. Cues sit next to the motion that causes
them: a click on each landing, ticks as rows land, a pluck on the promise. The bed is declared in
`film.music` (pad from the body, kick and hats under the proofs, thinning for the closing).

## 8 · Review: what grid-check says today

`node scripts/films/grid-check.mjs --root <repo> --page preview/films/dossiq/casework/index.html --pixels`

- Cuts: 9, all on bar lines. Good.
- Dead bars: 23 and 24, the install board holding still at the end. A P1 for the next pass: give the
  last two bars a visible change, or end the film two bars earlier.
- Words: 39 caption words in the body, 26 per 30 s over the film, but 39 in the 30 s from the
  promise on: over the 35 word budget in that window. A P1: trim a caption or spread the body.
- Captions: every caption holds its reading time.

## 9 · Deliver

Not yet delivered: the master MP4 goes under `brand/assets/films/` once Ruben has watched the final
render (bible round 4).
