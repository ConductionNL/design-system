# Kinetic type

The scene type is [`preview/films/_lib/scenes/kinetic.js`](../../../../preview/films/_lib/scenes/kinetic.js).
The recipes play as loops at `preview/films/kinetic-voice/recipes.html?r=lock|slam|hero`, and the voice
demo at `preview/films/kinetic-voice/`.

## Rules

1. **Animate words, not letters.** A letter sweep spells other words on the way ("Conduct" on the way
   to "Conduction") and reads as a typewriter. We have no letter reveal at all.
2. **One reveal system per role.** Fixed in `ROLES`, frozen:

   | Role | Reveal | Curve | Frames | Used for |
   |---|---|---|---|---|
   | `line` | rise out of the line's mask | `arrive` | 6 | running words |
   | `hero` | flip: the word turns over about its centre, like a hex | `arrive` | 5 | the one word that matters, in orange |
   | `slam` | rise, accelerating, stopping dead | `contact` | 4 | single big words on beats |

3. **Nothing pops.** No scale-in, no back() overshoot, no bouncing spring, no beat pulse.
4. **Layout first.** The whole line is laid out before the first word moves, so nothing reflows while
   it builds. Lines of five words or fewer at 1920 x 1080, in the left type column (x 120 to about 840).
5. **No full stop at the end of a line**, and a comma that ends a line goes too (round 6).
6. **Hold.** max(1.5 s, 0.4 s per word) after the last word is fully up. Then the line leaves upward
   together over four frames on `leave`.
7. **Reading speed.** About three words a second; 35 words per 30 s at most across a film.

## Recipes

| Recipe | Roles | What happens | Sound |
|---|---|---|---|
| `lock` | line | every word rises into its final place on its onset; the line locks together | none of its own |
| `slam` | slam | one word per line, big; each stops dead on its onset (a beat). At most three words | a dry click on each contact frame |
| `hero` | line, hero | the line locks; one hero word in orange flips in on its onset | a dry click when the hero word is fully turned |

```js
import { kineticText, kineticScene, wordsAt } from '../_lib/scenes/kinetic.js'
// on the grid: a word every 8th from beat 2
kineticScene(film, 'tagline', { recipe: 'hero', text: 'Make Nextcloud your workspace', hero: 'workspace', start: G.at('1.2'), stagger: G.eighthLen, lines: [[0, 1], [2, 3]] })
```

## The voice recipe

The voice is the clock. Every word lands on the frame it is heard.

1. **Write the line** in the Conduction voice. One claim, under 16 words, sentence case.
2. **Generate the take** with the cloned voice (`~/voice-lab`, private). Keep only the generated take.
3. **Align it.** WhisperX gives `{ word, start, end }` per word. Check the transcript against the
   text: a wrong word means a wrong onset.
4. **Place the take on the grid.** Offset it so its first word lands on a beat:
   `at = G.beatAt(n) - words[0].start`. The audio itself may start between frames; the reveals snap.
5. **Time the words.** `wordsAt(words, at)` shifts them to film time. Each word starts its reveal two
   frames (`LEAD`) before its onset, so it is readable on the onset frame. The hold is computed from
   the word count; the line's out time can be set to a bar line.
6. **Mix.** Put the take in `film.music.voice` as `{ src, at, gain }`. `score.mjs --root <repo>`
   places it, ducks the bed and the effects by 9 dB under it, and normalises to -14 LUFS, true peak
   -1.5 dBTP.
7. **Check sync by eye** on a contact sheet of the muxed render, frame by frame round each onset, and
   against the audio energy per frame.

**Privacy.** The voice model, the reference recordings, the training data and any checkpoint stay in
a private repository (ConductionNL/voice-ruben). Only generated takes and their word timings may enter
this public repo.

**Provisional.** The demo uses the clean-reference run of Ruben's cloned voice. Ruben has not yet
picked between it and the trained voice. When he does, replace the mp3 and the words JSON; the film
retimes itself from the alignment.
