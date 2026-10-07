# The review loop

Review a contact sheet before you render the whole film. A fix on a still costs seconds; a fix after a
render costs a render.

## Order

1. **Contact sheet**: `film.mjs sheet --every 0.25` (or every 8th). Look at it yourself.
2. **Grid check**: `grid-check.mjs --pixels`. Cuts on the grid, no dead bars, words and holds.
3. **Proof render** at `--scale 0.5` with the scored audio. Watch it once with sound, once without.
4. **Score the rubric** below. Fix, then repeat from step 1. At most five rounds; if round five still
   fails, the brief or the treatment is wrong, not the build.
5. **Master render**, then Ruben watches it.

## The rubric

Score each dimension 1 to 5. Every dimension at least 3; finish and sync at 5; the mean at least 4.2.

| # | Dimension | 5 means |
|---|---|---|
| 1 | Idea | the logline is visible: one idea, readable in one viewing |
| 2 | Story device | one element travels through every scene and survives every cut |
| 3 | Rhythm | something changes on every beat that matters; no dead bar; slow and fast moves contrast (3x) |
| 4 | Grid | sections on bar lines, cuts on 8ths, big moments on downbeats |
| 5 | Motion | moves come from tokens; nothing pops, scales in or bounces; hexes flip in |
| 6 | Transitions | every seam is designed and carries the device; no cross-fade |
| 7 | Type | whole words, one reveal per role, lines of five words or fewer, holds met |
| 8 | Copy | the voice rules, no full stops at line ends, every caption makes sense on its own |
| 9 | Brand | solid fills, one orange per scene, pointy-top hexes, one solid grid, real glyphs |
| 10 | Sound and sync | every sound has a visible cause and lands on its frame; the voice wins; -14 LUFS, -1.5 dBTP |
| 11 | Finish | no ghost frames, no stalls, no flicker, no leftover screens, the loop point is clean |

## Four lenses

Read the sheet four times, once per lens. Each lens writes its own findings.

- **Director.** Does the film say its one idea? Is the device clear? Is there a camera idea per scene?
- **Forensics.** Frame by frame round every cut: pops (a jump of more than half a move in one frame),
  ghosts (two copies of one element), stalls (a move that stops and restarts), banding, leftovers.
- **Sound and sync.** Every cue against its visible cause; every word against its onset; the mix
  meter. A sound without a cause is a finding.
- **Art and copy.** Brand rules, the bible's rounds, the voice rules, the word budget.

## Severity

| Level | Means | Example |
|---|---|---|
| **P0** | blocks delivery: wrong, unsafe or off-brand | a claim the product cannot back, a rotated hex, a gradient, the voice model or a recording in the repo |
| **P1** | must fix before the master | a cut off the grid, a caption held too short, a pop, a sound with no cause, a dead bar in the body |
| **P2** | fix when cheap | a move a frame late, a slightly uneven stagger |

## Checklist for the sheet

- Frame 1 says something (it is the thumbnail). No fade from black.
- The brand shows by 2 to 3 s.
- Three changes in the first 5 s, then one every 1.5 to 2.5 s.
- Every caption: max(1.5 s, 0.4 s per word) after its last word is up.
- 20 to 30 words in the film; at most 35 per 30 s.
- One orange per scene, as text or a shape, never a box behind text.
- Hexes flip in; lines draw on; nothing pops.
- One honeycomb, solid; every hex on a cell.
- No full stop at a line end; sentence case; a section title above each caption.
- The last frame flows into frame 1 when the film loops.
- The mix: -14 LUFS integrated, true peak -1.5 dBTP, the payoff the loudest moment.
