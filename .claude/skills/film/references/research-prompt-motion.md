# Research: prompt-motion.com and motion-design skills (2026-10-06)

Input for the Conduction film skill and the Film section on identity.conduction.nl. Commit this file with the skill (it is a source, not a draft to throw away).

## What the gallery is

https://www.prompt-motion.com/ is a free gallery of about 227 motion videos made with Claude Opus 5.5, each with its prompt; filter "Prompt" or "Skill". Most prompts are one-liners (the showreel prompt "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out." recurs verbatim). Quality comes from the model plus the harness. No entry syncs motion to a voice-over or word timestamps.

Two detailed prompts worth reading:
- https://prompt-motion.com/twoclipping-5cba86: single HTML canvas, "pure time-based functions with spring physics", no CSS transitions, minimal overshoot, 8 to 12 UI states, ~120 BPM beat grid checked with preview frames, Playwright render with motion-blur subframes, last frame equals first.
- https://prompt-motion.com/notdwd-c2037d: 12 s keynote sting, 8 shots given as frame ranges, pure functions of the frame number, no randomness, SFX on named frames.

## The two skills that matter (both MIT)

**Cinetic** (https://github.com/Leonxlnx/cinetic, SKILL.md under skills/cinetic/, references/*.md):
- Workflow with gates and written artifacts: intake, concept (BRIEF.md, TREATMENT.md), brand, timeline file, build, sound, render, review, deliver.
- Five laws: one idea that fits a sentence; one story device that travels through every shot and never blinks out at a cut; one accent that means one thing; one house motion system (a few named curves and springs, each with a stated reason, every frame number from the timeline file); verify by measurement.
- One beat grid: section changes on downbeats, cuts inside a section on 8ths; music first, every cut lands on a musical event.
- Named motion tokens (references/motion-tokens.md): out (.16,1,.3,1) arrivals and word entrances; in (.7,0,.84,0) implosions; smooth (.65,0,.35,1) fades and drifts; contact (.55,0,.9,.55) accelerating into an impact; rest (.45,0,.1,1) moves that must end at rest; cam (.48,.1,0,.9) camera pushes. Springs: snap, land (a real bounce, rare), firm (critically damped workhorse), soft (weighty panels and large type). Duration grows with distance (0.35 s + 1.35 ms/px, clamped 0.6 to 2.4 s for camera moves). Slowest move at least 3x the fastest. Speed ceiling so motion blur does not streak.
- Kinetic type (references/copy-and-type.md): animate words, not letters (except a hero word); one reveal system per text role; word reveal per word with a short stagger, opacity plus a small rise; lines of 5 words or fewer at 1920x1080; hold a line at least a base time plus a time per word after it resolves; about 3 words per second reading speed; a reveal must never spell another word on the way (no letter sweeps through prefixes); named recipes: slam, locking words, tracking collapse, label roll.
- Transitions (references/transitions.md): a seam is a designed match; relay hand-off of the story device, velocity-matched cut, match cut on every property; accelerate out, cut at peak speed, decay in; no cross-fading copies, morph one object.
- Taste and slop (references/taste-and-slop.md): 91 tells in 12 categories; word budget (35 words per 30 s), a visible change about every 0.5 s, 8 to 10 beats per 30 s, fixed margins.
- Sound (references/sound.md): every sound needs a visible cause; sound only discrete state changes; cues come from the same timeline file as the picture; contact is the frame a spring reaches 1.0; text arrival is the readable frame, never the tween end; with a voice-over the voice wins and everything is timed around it; -14 LUFS, true peak -1 dBTP or lower, the payoff is the loudest moment.
- Review loop (references/review-loop.md): 11-dimension rubric scored 1 to 5 (each >= 3, finish and sync = 5, mean >= 4.2), max 5 rounds; four critic lenses (director, forensics, sound-sync, art/copy/UI); P0/P1/P2; scripts for forensics (pops, ghosts, banding, stalls), audio-video audit, beat-grid check with word budgets, nondeterminism lint, layout audit.

**product-film** (https://github.com/Rieranthony/product-film-skill, Remotion):
- Non-negotiables: their design wins; every frame is a pure function of time; measure, never guess (beats from the audio, positions from the DOM, colours from decoded pixels); show only what the product really does.
- Film brief template (templates/film-prompt.md): context, inputs, direction (voice in 3 lines), cast, structure beat by beat anchored to BPM and bars, build, gotchas. Starts from a beat sheet plus three style frames approved before building.
- Review (reference/review.md): something happens on every beat, no dead bar; last frame equals frame 0 for loops.

Voice sync outside the gallery: https://github.com/JagZ999/explainer-video has a vo-sync skill (voice-over with word timestamps, scene durations and cue times computed so visuals land on the spoken word, audio as master clock).

## Gap analysis against our engine and bible

Already ours: pure time-driven frames; ease.brand/snap/exit and closed-form springs in _lib/core.js; a beat constant (SPB, 128 BPM, 24 fps); a named transition registry in _lib/transitions.js (match cut, whip, zoom-through, flip-wave fallback) that carries a key element across a seam with a caption-clear rule and a sound note; round-based house rules in preview/films/BIBLE.md that are stricter than Cinetic's bans.

Missing, worth adding:
1. Named easing and spring tokens with stated roles (arrival, implosion, drift, contact, rest, camera; firm, soft, snap, one real landing), re-derived for 24 fps.
2. One timeline file per film that every frame number and sound cue comes from, plus a grid-check script (cuts on downbeats or 8ths, dead bars, word budget, hold per word).
3. Duration-from-distance and speed-ceiling rules; slowest move at least 3x the fastest.
4. A kinetic-type scene type driven by voice word timestamps (WhisperX from ~/voice-lab): reveal lands on the word onset, hold computed from the word count, one reveal system per role, no-prefix rule, recipes for slam, lock and hero word.
5. A film brief template (logline, beat sheet, story device, three style frames approved first).
6. A scored review rubric with lenses and P0/P1/P2, run on a contact sheet before the full render; a forensics pass for pops, stalls and ghost frames.
7. "Every sound needs a visible cause"; cue frames tied to the readable frame.

Do not adopt: Cinetic's bans on orange (our one accent) or serif; bouncy back() pop-ins and beat-pulse bounces (our no-pop rule); a random-pick technique library (our boards are curated); 60 fps frame counts (we run 24 fps; an 8th at 128 BPM is about 5.6 frames, so define how we snap); cross-fades; the retired current line; letter-by-letter reveals.

## Recommended structures

Skill: purpose and triggers; five laws (Conduction wording); workflow with gates; beat and timing grid at 24 fps; motion tokens; kinetic type (incl. the voice recipe); transitions; house language and bans (from BIBLE.md); sound; review loop; brief template and a worked example. Credit Cinetic and product-film (MIT) for adapted ideas.

Film section in the brand kit: principles with short clips; motion tokens plotted with live demos; transitions, one looping demo each with its sound note; kinetic type recipes plus word-timestamp sync with the spoken word highlighted (generated voice only, never Ruben's raw recordings); brief template; review checklist; gallery of finished films with their briefs.

## Ruben's decisions (2026-10-06)

- Merge the six film clones into one branch and open a PR on ConductionNL/design-system (done by a merge agent; branch feat/films).
- Build the full Conduction film skill.
- First Film section pages: principles and gallery, motion tokens and transitions, kinetic type and voice, brief template and review checklist.
