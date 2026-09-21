/**
 * engine.test.js — the blueprint-rush rules.
 *
 * The property everything else rests on: every flow dealt can be
 * built. The parts are grown outward from what is already in, so the
 * set is closed under `needs` by construction — and the tests below
 * prove it by finding an order rather than by trusting the comment.
 *
 * The other half is that the order is the puzzle. A part whose needs
 * are not on the rail has to be refused, or the game is a list of
 * names again and the dependency graph is decoration.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, place, step, hint, timeLeft, refuse, laidParts, nextSlot, slotsFor, bonusFor, summarise,
  PARTS, PART_KEYS, DEFAULTS,
} = require('../engine.js');

/**
 * Let go of a finished flow: it is held up to be looked at, and only
 * the clock puts the next one on.
 */
function release(state) {
  return state.cleared ? step(state, state.cleared.until) : state;
}

/**
 * Lay the flow in a working order, one ready part at a time. Returns
 * the run still holding the finished flow, which is where the engine
 * leaves it; `release` moves on to the next.
 */
function build(state, now = 0) {
  let s = release(state);
  const before = s.built;
  for (let guard = 0; guard < 20 && s.built === before && !s.over; guard++) {
    const ready = s.flow.tray.find((p) => refuse(s, p) === null);
    if (!ready) break;
    s = place(s, ready, now);
  }
  return s;
}

/** A run dealt without head starts, for the tests that count places. */
const PLAIN = {headStartMax: 0};

test('the parts form a graph with no cycles and no dangling needs', () => {
  for (const [part, spec] of Object.entries(PARTS)) {
    for (const need of spec.needs) {
      assert.ok(PARTS[need], `${part} needs "${need}", which is not a part`);
    }
  }

  /* Every part has to be reachable from something with no needs, or
     it could be dealt into a set that can never be laid. */
  const settled = new Set(PART_KEYS.filter((p) => !PARTS[p].needs.length));
  for (let pass = 0; pass < PART_KEYS.length; pass++) {
    for (const p of PART_KEYS) {
      if (PARTS[p].needs.every((n) => settled.has(n))) settled.add(p);
    }
  }
  assert.equal(settled.size, PART_KEYS.length, 'a part can never have its needs met');
});

test('a flow is dealt closed under its own needs', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame({seed, now: 0});
    const {needed, laid, tray} = s.flow;

    assert.equal(laid.length, slotsFor(DEFAULTS, 0));
    for (const part of needed) {
      for (const need of PARTS[part].needs) {
        assert.ok(needed.includes(need), `seed ${seed}: ${part} was dealt without ${need}`);
      }
    }

    /* Anything already on the rail sits where it belongs in the
       working order, and the tray holds exactly the rest. */
    laid.forEach((part, i) => {
      if (part) assert.equal(part, needed[i], `seed ${seed}: a head start sat in the wrong place`);
    });
    const toLay = needed.filter((p, i) => laid[i] === null);
    assert.equal(tray.length, toLay.length, 'the shelf held something this app does not need');
    for (const part of toLay) assert.ok(tray.includes(part), `seed ${seed}: ${part} was not in the tray`);
  }
});

test('a head start never leaves less than two places to lay', () => {
  /* A flow dealt nearly finished is not a puzzle, and one dealt
     complete would score itself. */
  for (let seed = 1; seed <= 200; seed++) {
    const s = createGame({seed, now: 0});
    const empty = s.flow.laid.filter((x) => x === null).length;
    assert.ok(empty >= 2, `seed ${seed}: only ${empty} places were left to lay`);
  }
});

test('flows do not all open the same way', () => {
  /* With one root part in the graph the first thing laid was forced
     on every single flow, and the opening never varied. */
  const openings = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const s = createGame({seed, now: 0});
    openings.add(`${s.flow.needed.join(',')}|${s.flow.laid.map((x) => x || '_').join(',')}`);
  }
  assert.ok(openings.size > 10, `only ${openings.size} different openings in sixty seeds`);
});

test('every flow dealt can actually be built, over and over', () => {
  for (let seed = 1; seed <= 30; seed++) {
    let s = createGame({seed, now: 0});
    for (let app = 0; app < 6; app++) {
      const before = s.built;
      s = build(s, 0);
      assert.equal(s.built, before + 1, `seed ${seed}: flow ${app} could not be built`);
    }
  }
});

test('a part whose needs are not on the rail is refused, and says what is missing', () => {
  /* Find a seed whose flow contains something with a prerequisite,
     and try to lay it first. */
  let found = false;
  for (let seed = 1; seed <= 40 && !found; seed++) {
    /* Nothing pre-laid, so a part with a prerequisite is genuinely
       too early rather than possibly already satisfied. */
    const s = createGame({seed, now: 0, config: PLAIN});
    const early = s.flow.needed.find((p) => PARTS[p].needs.length);
    if (!early) continue;
    found = true;

    assert.equal(refuse(s, early), 'early');
    const after = place(s, early, 100);
    assert.equal(after.last.result, 'early');
    assert.deepEqual(after.last.missing, PARTS[early].needs, 'the refusal did not name what it wanted');
    assert.equal(after.endsAt, s.endsAt - DEFAULTS.penaltyMs, 'laying too early was free');
    assert.deepEqual(after.flow.laid, s.flow.laid, 'a refused part went on the rail anyway');
  }
  assert.ok(found, 'no dealt flow had a part with a prerequisite');
});

test('the shelf only ever holds parts this app is made of', () => {
  /* The one rule a card cannot express is that it does not belong
     here, so there is no such card. Everything on the shelf can be
     laid once what it needs is down, and "not yet" is the only
     refusal the game has. */
  for (let seed = 1; seed <= 60; seed++) {
    const s = createGame({seed, now: 0});
    for (const part of s.flow.tray) {
      assert.ok(s.flow.needed.includes(part), `seed ${seed}: the shelf held ${part}, which is not in this app`);
      assert.notEqual(refuse(s, part), 'foreign', `seed ${seed}: ${part} could be refused for not belonging`);
    }
  }
});

test('a part already on the rail cannot be laid twice', () => {
  let s = createGame({seed: 4, now: 0});
  const first = s.flow.tray.find((p) => refuse(s, p) === null);
  s = place(s, first, 0);

  assert.equal(refuse(s, first), 'duplicate');
  const after = place(s, first, 50);
  assert.equal(after.last.result, 'duplicate');
  assert.equal(after.endsAt, s.endsAt - DEFAULTS.penaltyMs);
});

test('parts land left to right, so the rail can never strand itself', () => {
  /* No head start here, so every place in turn is the player's. */
  let s = createGame({seed: 5, now: 0, config: PLAIN});
  const size = s.flow.laid.length;

  for (let i = 0; i < size; i++) {
    assert.equal(nextSlot(s), i, 'a part landed somewhere other than the next place');
    const ready = s.flow.tray.find((p) => refuse(s, p) === null);
    assert.ok(ready, `nothing could be laid at place ${i}, which should be impossible`);
    s = place(s, ready, 0);
    if (s.built > 0) break;
  }
  assert.equal(s.built, 1);
});

test('everything on the rail has its needs behind it, never in front', () => {
  /* Read off the finished rail rather than the order the player
     clicked, so head starts are judged too — they are on the rail
     and a flow is only correct if the whole thing reads correctly. */
  for (let seed = 1; seed <= 25; seed++) {
    const s = build(createGame({seed, now: 0}), 0);
    assert.equal(s.built, 1, `seed ${seed}: the flow was not finished`);

    const rail = s.flow.laid;
    assert.ok(rail.every(Boolean), 'a finished flow had an empty place');
    rail.forEach((part, i) => {
      for (const need of PARTS[part].needs) {
        const where = rail.indexOf(need);
        assert.ok(where > -1 && where < i, `seed ${seed}: ${part} at ${i} has ${need} at ${where}`);
      }
    });
  }
});

test('finishing a flow scores, buys time and deals the next one', () => {
  let s = createGame({seed: 6, now: 0});
  const deadline = s.endsAt;
  s = build(s, 0);

  assert.equal(s.built, 1);
  assert.ok(s.score >= DEFAULTS.pointsPerApp);
  assert.equal(s.endsAt, deadline + DEFAULTS.bonusMs, 'the first app did not pay the full bonus');
  assert.equal(s.last.bonusMs, DEFAULTS.bonusMs, 'the finish did not say what it paid');
  assert.equal(s.last.result, 'built');

  /* The flow you just built is still on the rail, whole. */
  assert.ok(s.cleared, 'the finished flow was not held up');
  assert.ok(s.flow.laid.every(Boolean), 'the finished flow was cleared before it could be seen');
  assert.equal(step(s, s.cleared.until - 1), s, 'the hold ended early');

  const next = step(s, s.cleared.until);
  assert.equal(next.cleared, null);
  assert.ok(next.flow.laid.some((x) => x === null), 'the next flow arrived already finished');
});

test('nothing lands, and the clock does not run, while a flow is held up', () => {
  const s = build(createGame({seed: 18, now: 0}), 0);
  assert.equal(place(s, s.flow.tray[0], s.cleared.at + 1), s, 'a held flow could still be laid on');
  assert.equal(hint(s, s.cleared.at + 1), s, 'a hint fired during the hold');
  assert.equal(timeLeft(s, s.cleared.at), timeLeft(s, s.cleared.until), 'the clock ran under the hold');

  /* And the beat hands back the wall-clock time it took. */
  const owed = timeLeft(s, s.cleared.at);
  const next = step(s, s.cleared.until);
  assert.equal(timeLeft(next, s.cleared.until), owed, 'the hold spent time it was meant to give');
});

test('a part laid too early is ruled out only until something lands', () => {
  /* Find a flow with something that has a prerequisite to break. */
  let s = null;
  let early = null;
  for (let seed = 1; seed <= 60 && !early; seed++) {
    s = createGame({seed, now: 0, config: PLAIN});
    early = s.flow.tray.find((p) => refuse(s, p) === 'early');
  }
  assert.ok(early, 'no dealt flow had a part that could be laid too early');

  s = place(s, early, 0);
  assert.deepEqual(s.flow.rejected, [early], 'the early part was not ruled out');

  /* Laying something that sticks forgives it: the rail moved, so
     "too early" may not be true any more. */
  const ready = s.flow.tray.find((p) => refuse(s, p) === null);
  s = place(s, ready, 0);
  assert.deepEqual(s.flow.rejected, [], 'a part that stuck did not clear the refusals');
});

test('each app buys less time than the one before, down to a floor', () => {
  const s = createGame({seed: 12, now: 0});
  assert.equal(bonusFor(s), DEFAULTS.bonusMs);
  assert.equal(bonusFor({...s, built: 1}), DEFAULTS.bonusMs - DEFAULTS.bonusRampMs);
  assert.equal(bonusFor({...s, built: 9000}), DEFAULTS.bonusFloorMs, 'the bonus fell through its floor');

  /* And the floor has to be below what a full rail costs to lay, or
     a quick player still profits on every app for ever. */
  assert.ok(DEFAULTS.bonusFloorMs < DEFAULTS.maxSlots * 400,
    'the floor is high enough that a fast player can farm it');
});

test('the run ends however well it is played', () => {
  /* Perfect play at a pace nobody can beat for long: the ramp has to
     catch up with it. Laying is free here, so this is the most
     generous run possible and a real one ends sooner. */
  const play = (msPerPart) => {
    let s = createGame({seed: 13, now: 0});
    let t = 0;
    for (let guard = 0; guard < 4000 && !s.over; guard++) {
      const ready = s.flow.tray.find((p) => refuse(s, p) === null);
      if (!ready) break;
      t += msPerPart;
      s = step(s, t);
      if (s.over) break;
      s = place(s, ready, t);
      /* Sit out the beat after a finished flow. */
      if (s.cleared) { t = s.cleared.until; s = step(s, t); }
    }
    return s;
  };

  const brisk = play(450);
  assert.equal(brisk.over, true, 'a brisk run never ended');
  assert.ok(brisk.built > 8, `it ended after only ${brisk.built} apps`);

  const steady = play(800);
  assert.equal(steady.over, true, 'a steady run never ended');
  assert.ok(steady.built < brisk.built, 'playing faster bought no more apps than playing slowly');
});

test('the rail grows as the run goes on, up to its ceiling', () => {
  assert.equal(slotsFor(DEFAULTS, 0), DEFAULTS.startSlots);
  assert.ok(slotsFor(DEFAULTS, DEFAULTS.growEvery) > DEFAULTS.startSlots, 'the rail never grew');
  assert.equal(slotsFor(DEFAULTS, 9000), DEFAULTS.maxSlots, 'the rail grew past its ceiling');

  /* And a real run sees it. */
  let s = createGame({seed: 7, now: 0});
  const widths = [s.flow.laid.length];
  for (let i = 0; i < DEFAULTS.growEvery * 2; i++) {
    s = release(build(s, 0));
    widths.push(s.flow.laid.length);
  }
  assert.ok(Math.max(...widths) > DEFAULTS.startSlots, 'the rail stayed the same all run');
  assert.ok(Math.max(...widths) <= DEFAULTS.maxSlots);
});

test('a streak pays more each app, and a wrong part ends it', () => {
  let s = createGame({seed: 8, now: 0});
  s = build(s, 0);
  const firstApp = s.score;
  s = build(s, 0);
  assert.ok(s.score - firstApp > firstApp, 'the second app in a row paid no more than the first');
  assert.equal(s.combo, 2);
  assert.equal(s.bestCombo, 2);

  /* Out of the beat first: nothing lands on a flow still being
     shown, so a wrong part laid there would be a no-op. Laying a
     part twice is the refusal that is always available now that
     nothing on the shelf is foreign. */
  s = release(s);
  const ready = s.flow.tray.find((p) => refuse(s, p) === null);
  s = place(place(s, ready, 0), ready, 0);
  assert.equal(s.combo, 0, 'a wrong part left the streak standing');
  assert.equal(s.bestCombo, 2, 'the best streak was forgotten');
});

test('the streak bonus stops climbing, so a long run cannot run away with the arcade', () => {
  /* Uncapped this is quadratic in the length of the run, and every
     game's score goes into one total on the game-over card. */
  let s = createGame({seed: 14, now: 0});
  const paid = [];
  for (let i = 0; i < DEFAULTS.comboCap + 4; i++) {
    s = build(s, 0);
    paid.push(s.last.points);
  }

  const ceiling = DEFAULTS.pointsPerApp + DEFAULTS.comboCap * DEFAULTS.comboBonus;
  assert.equal(Math.max(...paid), ceiling, 'an app paid more than the ceiling');
  assert.equal(paid[paid.length - 1], ceiling, 'the last app did not reach the ceiling');
  assert.equal(paid[paid.length - 1], paid[paid.length - 2], 'the streak bonus was still climbing at the cap');
});

test('a hint points at something that can actually be laid, and charges for it', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const s = createGame({seed, now: 0});
    const asked = hint(s, 0);

    assert.equal(asked.last.result, 'hinted');
    assert.ok(asked.flow.hinted, `seed ${seed}: the hint pointed at nothing`);
    assert.equal(refuse(s, asked.flow.hinted), null, `seed ${seed}: the hint pointed at a part that cannot be laid`);
    assert.equal(asked.endsAt, s.endsAt - DEFAULTS.hintMs, 'the hint was free');
  }
});

test('asking costs less than guessing wrong, or nobody would ask', () => {
  assert.ok(DEFAULTS.hintMs < DEFAULTS.penaltyMs,
    'a hint costs at least as much as the mistake it saves you from');
});

test('a hint is not a mistake: it leaves the streak and the tally alone', () => {
  let s = createGame({seed: 15, now: 0});
  s = build(s, 0);
  const asked = hint(s, 0);
  assert.equal(asked.combo, s.combo, 'asking broke the streak');
  assert.equal(asked.wrong, s.wrong, 'asking counted as a wrong part');
});

test('a hint is spent as soon as anything lands', () => {
  let s = createGame({seed: 16, now: 0});
  s = hint(s, 0);
  const pointed = s.flow.hinted;
  assert.ok(pointed);
  s = place(s, pointed, 0);
  assert.equal(s.flow.hinted, null, 'the hint outlived the part it pointed at');
});

test('a hint that empties the clock ends the run there and then', () => {
  let s = createGame({seed: 17, now: 0, config: {startMs: 1000}});
  s = hint(s, 50);
  assert.equal(s.over, true);
  assert.equal(timeLeft(s, 50), 0);
});

test('the clock ends the run, and nothing lands afterwards', () => {
  let s = createGame({seed: 9, now: 0});
  s = step(s, DEFAULTS.startMs + 1);
  assert.equal(s.over, true);
  const frozen = place(s, s.flow.tray[0], DEFAULTS.startMs + 5);
  assert.equal(frozen.score, s.score);
});

test('a penalty that empties the clock ends the run there and then', () => {
  let s = createGame({seed: 10, now: 0, config: {startMs: 2000}});
  const ready = s.flow.tray.find((p) => refuse(s, p) === null);
  s = place(place(s, ready, 50), ready, 100);
  assert.equal(s.over, true);
  assert.equal(timeLeft(s, 100), 0);
});

test('laidParts reads the rail in order, ignoring the empty places', () => {
  let s = createGame({seed: 11, now: 0, config: PLAIN});
  assert.deepEqual(laidParts(s), []);
  const ready = s.flow.tray.find((p) => refuse(s, p) === null);
  s = place(s, ready, 0);
  assert.deepEqual(laidParts(s), [ready]);
});

test('the same seed deals the same run, a different one does not', () => {
  const shape = (seed) => {
    const s = createGame({seed, now: 0});
    return `${s.flow.needed.join(',')}|${s.flow.tray.join(',')}`;
  };
  assert.equal(shape(21), shape(21));
  assert.notEqual(shape(21), shape(22));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {built: 4, bestCombo: 3};
  assert.match(summarise(s, 'en'), /4 apps built · streak 3/);
  assert.match(summarise(s, 'nl'), /4 apps gebouwd · reeks 3/);
});
