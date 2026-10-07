# Motion tokens

The source of truth is [`preview/films/_lib/motion.js`](../../../../preview/films/_lib/motion.js). This page
mirrors it; when they disagree, the code wins. `tokenTable()` returns the same data for a page.

## Curves

| Token | cubic-bezier | Role | Why | Min frames |
|---|---|---|---|---|
| `arrive` | 0.2, 0, 0, 1 | arrivals: a word, a card or a window landing in place | decelerates hard, so the eye reads the thing at rest almost at once; the house curve since round 1 (`ease.brand`) | 6 |
| `leave` | 0.55, 0, 1, 0.45 | exits: a caption clearing, a card stepping down, an implosion | starts slow and leaves at speed, so the exit is short and never competes with the arrival (`ease.exit`) | exit |
| `whip` | 0.7, 0, 0.15, 1 | whips and hex cuts: a move that cuts at its fastest point | a whip in and a settle; the cut hides in the fast middle (`ease.snap`) | exit |
| `drift` | 0.65, 0, 0.35, 1 | drifts and colour changes | symmetric, so a slow move has no visible start or end | 2 |
| `contact` | 0.55, 0, 0.9, 0.55 | moving into a hit: a slam, a card landing on its sound | accelerates into the end and stops dead; the last frame is the contact frame | exit |
| `rest` | 0.45, 0, 0.1, 1 | things already on screen moving to a new place, ending fully still | eases out of rest and into rest, so nothing jumps at either end | 4 |
| `camera` | 0.6, 0, 0.1, 1 | camera pushes and pull-backs | a gentle start, so a push never reads as a cut, and a long settle | 3 |

**Min frames, and why we re-derived for 24 fps.** At 60 fps a curve that covers most of its travel
early still looks smooth. At 24 it pops: Cinetic's `out` (0.16, 1, 0.3, 1) moves 69% of the way in the
first frame of a 6-frame move. So every entrance curve carries the shortest move, in whole frames, in
which the first frame carries at most half the travel. The number is computed from the curve in code.
Exits are exempt: their last frames are fast on purpose and leave the mask or the frame.

## Springs

`spring(sec, token)` from `core.js`, or `springAt(name, sec)`.

| Token | freq | zeta | Role | Settles (frame) | Contact (frame) | Overshoot |
|---|---|---|---|---|---|---|
| `firm` | 2.2 Hz | 1 | the workhorse: UI pieces, cards, tags settling | 13 | 13 | 0 |
| `soft` | 1.2 Hz | 1 | weight: large panels, big type, the picture shifting | 24 | 24 | 0 |
| `snap` | 3.5 Hz | 1 | small, quick things: a pip, a badge, a toggle | 9 | 9 | 0 |
| `land` | 2.0 Hz | 0.6 | one real landing: an object dropping onto a surface, rare | 18 | 6 | 9% |

Every spring stays under 4 Hz, so one oscillation spans at least six frames and never aliases at
24 fps. The contact frame is where the sound lands (for a critically damped spring, the first frame
within 0.5% of rest). `land` is never an entrance: the bible's no-pop rule.

## Duration from distance

| Kind | Formula | Clamp |
|---|---|---|
| element | 0.25 s + 0.6 ms per px | 6 to 24 frames |
| camera | 0.35 s + 1.35 ms per px of travel | 0.6 to 2.4 s |

`durationFor(px, kind)` returns seconds, snapped up to whole frames. Examples: a card moving 300 px
takes 0.458 s (11 frames); a camera travelling 1500 px takes 2.375 s (57 frames).

## Speed ceiling

`SPEED_CEILING` is 96 px per frame, 5% of the 1920 stage width. With the renderer's 0.5 shutter a move
at the ceiling smears 48 px: motion blur, not a streak. `peakSpeed(fn, px, sec)` measures a move,
`withinCeiling(...)` checks it (whips exempt), `minDurationFor(fn, px)` gives the shortest duration
that stays under. Example: an 800 px move on `arrive` needs at least 1.375 s.

## Range

`rangeOk(durations)`: in a scene the slowest move is at least three times the fastest. Without that
contrast every move feels the same speed, and nothing reads as the important one.
