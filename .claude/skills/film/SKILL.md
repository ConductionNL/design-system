---
name: film
description: "Conduction's motion design method: how a film is planned, timed, built, scored, reviewed and delivered on the engine in preview/films/_lib. Covers the five laws, the gated workflow (brief, treatment with logline and beat sheet, three style frames, timeline, build, sound, render, review, deliver), the 128 BPM / 24 fps grid and how we snap to it, the named motion tokens, kinetic type including type timed to a voice, transitions, the house bans from BIBLE.md, sound, and the review loop with its rubric. Use it with the brand-film skill for every film, sting, kinetic type piece or voice-over. Trigger on 'make a film', 'motion design', 'kinetic type', 'animate this line', 'voice-over film', 'time it to the voice', 'review this film', 'film brief', 'maak een film', 'animatie op de stem'."
---

# film

A Conduction film is a web page whose every frame is a pure function of time. This skill is the
method: what to decide, in which order, and how to check it. The [brand-film](../brand-film/SKILL.md)
skill holds the storyboard and artifact mechanics; [BIBLE.md](../../../preview/films/BIBLE.md) holds
every decision Ruben has made about our films, rounds 1 to 29c. Where this skill and the bible
disagree, the bible wins and the drift is a finding.

## When to use it

- A new film, a sting, a loop or a kinetic type piece.
- A voice-over that the picture has to follow.
- A review of a film or a storyboard, before or after a render.
- A brief for someone else to build from.

## The five laws

1. **One idea that fits one sentence.** If the logline needs "and", it is two films.
2. **One device that travels.** Pick the thing the eye follows (a hex, a record, the app tag) and
   carry it through every scene. It never blinks out at a cut; transitions hand it on.
3. **One orange that means one thing.** Per scene, orange is the answer. Never a fill, never a box
   behind text, never a hex family.
4. **One house motion system.** Moves come from the named tokens in
   [`_lib/motion.js`](../../../preview/films/_lib/motion.js), and every time comes from the film's
   timeline. No inline cubic-bezier, no magic numbers.
5. **Measure, never guess.** Times from the grid or the voice alignment, positions from the layout,
   holds from the word count, loudness from the meter. A check that did not run is not a pass.

## The workflow, with gates

Each step writes something down. Do not start a step before the gate above it is passed.

| Step | Writes | Gate |
|---|---|---|
| 1 Brief | the brief ([template](references/brief-template.md)): audience, the one idea, the claim and its source, the call to action, length in bars | Ruben or the requester confirms the idea and the claim |
| 2 Treatment | logline, story device, beat sheet on bars, words per scene (35 per 30 s at most) | the beat sheet adds up to whole bars and the word budget holds |
| 3 Style frames | three key frames, drawn with the engine (`boards/<v>/board.js`), shown as one artifact | the user picks; nothing animates before this |
| 4 Timeline | the film's timeline: scenes, captions, cues and voice takes in one place ([`_lib/timeline.js`](../../../preview/films/_lib/timeline.js)) | `grid-check.mjs` reports no cut off the grid |
| 5 Build | `preview/films/<slug>/film.js`, scenes around the approved frames | a contact sheet (`film.mjs sheet`) shows the frames you approved |
| 6 Sound | cues next to the motion that causes them, `film.music` for the bed and the voice | every cue has a visible cause; mix at -14 LUFS, true peak -1.5 dBTP |
| 7 Render | a proof at `--scale 0.5`, then the master | the review loop has passed on the proof |
| 8 Review | the scored rubric, P0/P1/P2 findings ([review loop](references/review-loop.md)) | no P0, no P1, mean at least 4.2 |
| 9 Deliver | the master under `brand/assets/films/`, `sources.json`, the PR | Ruben has watched it |

## The grid: 128 BPM at 24 fps

| Unit | Seconds | Frames |
|---|---|---|
| bar | 1.875 | 45 |
| beat | 0.46875 | 11.25 |
| 8th | 0.234375 | 5.625 |
| 16th | 0.1171875 | 2.8125 |

**How we snap.** A grid time is computed from its index from zero, in exact seconds, then rounded to
the nearest frame, ties rounding up. Never add rounded steps to each other. The 8ths of a bar land on
frames 0, 6, 11, 17, 23, 28, 34, 39, and the next bar on 45, never more than half a frame (21 ms) off
the music. `grid().at('3.2')` and the other helpers in `timeline.js` do this for you.

**Where things go.**
- Sections (opening, body, Built on, install) change on bar lines.
- Cuts inside a section land on an 8th, preferably a beat.
- Big moments land on a downbeat.
- A visible change about every half second; no bar without one (a dead bar).
- With a voice, the voice is the clock: words land on their spoken onsets, and the grid places the
  takes (a take starts so its first word lands on a beat).

Check it: `node scripts/films/grid-check.mjs --root <repo> --page preview/films/<slug>/index.html --pixels`.
It flags cuts off the grid, sections off the bar, dead bars, the word budget and short captions.

## Motion tokens

Use the token, say the role. Values and numbers are in [references/motion-tokens.md](references/motion-tokens.md).

| Token | Role |
|---|---|
| `arrive` | arrivals: a word, a card, a window landing in place (the house `ease.brand`) |
| `leave` | exits: a caption clearing, a card stepping down (the house `ease.exit`) |
| `whip` | whips and hex cuts, cutting at peak speed (the house `ease.snap`) |
| `drift` | slow drifts and colour changes |
| `contact` | moving into a hit: it accelerates and stops dead on the contact frame |
| `rest` | a thing already on screen moving to a new place and ending fully still |
| `camera` | pushes and pull-backs: a gentle start, a long settle |
| springs `firm`, `soft`, `snap` | critically damped: UI pieces, heavy panels, small pips |
| spring `land` | the one real bounce, for an object dropping onto a surface; rare, never an entrance |

Three rules come with them:
- **Duration grows with distance.** `durationFor(px)` for elements, `durationFor(px, 'camera')` for
  the camera, snapped up to whole frames.
- **Speed ceiling.** No move faster than 96 px per frame (`withinCeiling`), whips excepted.
- **Range.** In a scene the slowest move is at least three times the fastest (`rangeOk`).

## Kinetic type

Words move as words. The scene type is [`_lib/scenes/kinetic.js`](../../../preview/films/_lib/scenes/kinetic.js);
the detail is in [references/kinetic-type.md](references/kinetic-type.md).

- **Whole words only.** Never letters, so a reveal never spells another word on the way.
- **One reveal per role.** Running words rise out of their line mask. The hero word flips in, like a
  hex. A slam word rises on `contact` and stops dead. A recipe picks roles; it never changes a reveal.
- **No pops.** Nothing scales in, nothing bounces. Everything flips or rises in.
- **Lines of five words or fewer**, in the left type column; the layout is fixed before the first word moves.
- **Hold.** A line holds max(1.5 s, 0.4 s per word) after its last word is up, then leaves upward.
- **Recipes.** `lock` (each word rises into its final place), `slam` (one word a line, at most
  three, a click on each contact frame), `hero` (lock plus one orange word that flips in).

**The voice recipe.** Generate the take, align it with WhisperX (`{ word, start, end }`), place the
take on the grid, and pass the words to `kineticText` with `wordsAt(words, offset)`. Each word starts
two frames before its spoken onset, so it is readable on the frame it is heard. Drop the full stop and
the comma that ends a line. The demo is [`preview/films/kinetic-voice/`](../../../preview/films/kinetic-voice/).

**The voice is provisional.** The demo uses Ruben's cloned voice from the clean-reference run. Ruben
has not yet picked between that voice and the trained one. Only generated takes go into this public
repo. The voice model and the recordings stay in a private repository (ConductionNL/voice-ruben);
never copy a reference recording, training data or a checkpoint here.

## Transitions

A seam is designed, never a cross-fade. The registry is [`_lib/transitions.js`](../../../preview/films/_lib/transitions.js):
match cut, grow, zoom-through, stepped hex wipe, whip-pan, text-swap on a held window, cluster to
container, and the hex flip wave as the fallback. Each entry has its lead, tail, caption rule and
sound.

- **Carry the device.** The key element of scene A becomes the key element of scene B: same place,
  size and colour across the cut.
- **Match the velocity.** Accelerate out, cut at peak speed, decelerate in (`whip` into the cut,
  `arrive` out of it). A move that stops before the cut and starts again after reads as two moves.
- **Morph one object.** Never two copies fading over each other.
- **Captions clear first.** Nothing crosses a visible caption; the next caption rises after the
  transition has left the type column.

Try one: `preview/films/transitions/index.html?film=pipelinq&v=kcc&hand=2&force=<type>`.

## House language and bans

The bible is binding. In short:

- 16:9, 1920 x 1080, 24 fps. Text inside x 120 to 1800, y 96 to 930; the type in a left column,
  picture on the right.
- Solid fills. No gradients, glows, blur, 3D, photos or faces.
- Pointy-top hexes, never rotated. A hex enters by flipping (turning over), never by popping or scaling.
- One honeycomb grid, solid; no second grid, no see-through layers. Every hex sits on a grid cell.
- Orange is text or a shape, never a box behind text. No terracotta anywhere.
- No full stop at the end of an on-screen line. Sentence case. The small mark above a caption is a
  section title, not the app name.
- The current line (the travelling wire) is retired. The fallback seam is the hex flip wave.
- No bell sound. The accent sound is a dry click.
- Products: a question first ("What if ...?"), then the proofs; "Built on Nextcloud" and the install
  board close every product film.
- Words: 20 to 30 on screen in a film, at most 35 per 30 s; every caption makes sense on its own.

Not adopted from the sources, on purpose: banning orange or serif, back() pop-ins and beat-pulse
bounces, a random technique library, 60 fps frame counts, cross-fades, the retired current line, and
letter-by-letter reveals.

## Sound

- **Every sound needs a visible cause.** A click where a hex lands, a whoosh under a move. No sound
  for nothing.
- **Cues come from the timeline**, next to the motion that causes them, so they cannot drift.
- **Text lands on its readable frame**, not at the end of its tween. A spring's sound lands on its
  contact frame (the `contact` field of a spring token).
- **The voice wins.** With a voice-over the bed and effects duck under it (`score.mjs` does this for
  `film.music.voice`), and words get no tick of their own.
- **Delivery.** `score.mjs` normalises to -14 LUFS integrated with the true peak at -1.5 dBTP. The
  payoff is the loudest moment. Mute first: the film must read with the sound off.

## Review

Run the [review loop](references/review-loop.md) on a contact sheet before any full render: the
rubric scored 1 to 5, four lenses (director, forensics, sound and sync, art and copy), findings as
P0, P1 or P2. Then `grid-check.mjs`, then the proof render, then the master.

## Brief and worked example

- [references/brief-template.md](references/brief-template.md): the brief, filled in before anything is drawn.
- [references/worked-example.md](references/worked-example.md): the Dossiq casework film, from logline to render.

## Tools

```bash
cd scripts/films
node film.mjs sheet  --root <repo> --page preview/films/<slug>/index.html --every 0.25 --out sheet.png
node grid-check.mjs  --root <repo> --page preview/films/<slug>/index.html --pixels
node film.mjs cues   --root <repo> --page preview/films/<slug>/index.html --out cues.json
node score.mjs       --cues cues.json --out mix.wav --root <repo>
node film.mjs render --root <repo> --page preview/films/<slug>/index.html --out <slug>.mp4 --audio mix.wav
```

Run heavy renders inside `systemd-run --user --scope -p MemoryMax=4G` and keep frames and masters
outside the repo until delivery.

## Credits

Ideas adapted, with thanks, from two MIT-licensed skills: **Cinetic** by Leonxlnx
(github.com/Leonxlnx/cinetic) for the gated workflow, the five laws, named motion tokens, kinetic type
recipes, sound rules and the review rubric; and **product-film** by Rieranthony
(github.com/Rieranthony/product-film-skill) for the film brief, the three style frames and the no
dead bar rule. The wording, the numbers and the house rules here are ours. The research behind this
skill is in [references/research-prompt-motion.md](references/research-prompt-motion.md).
