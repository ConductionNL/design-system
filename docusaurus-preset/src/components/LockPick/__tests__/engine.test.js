/**
 * engine.test.js — the lock-pick rules.
 *
 * The properties the game rests on: that a reading costs time under
 * load rather than nothing, that being on the spot costs no wear at
 * all, and that three picks is a real ceiling. The mechanic has been
 * reworked twice, and each version failed one of those — the free
 * live readout in particular meant a pick could not break and a run
 * could not end. These are the lines that keep it honest.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, setPosition, nudge, give, cylinderTurn,
  beginTurn, holdTurn, releaseTurn, summarise,
  POSITIONS, DEFAULTS,
} = require('../engine.js');

/** Lean on the lock for `ms`, then let go unless it resolved itself. */
function torque(state, ms, {release = true} = {}) {
  let s = beginTurn(state, 0);
  /* In steps, the way a frame loop would, so wear integrates the same
     way it does in the browser. */
  for (let t = 16; t <= ms && s.turning && !s.over; t += 16) s = holdTurn(s, t);
  if (s.turning && !s.over) s = holdTurn(s, ms);
  return release && s.turning ? releaseTurn(s) : s;
}

/** Hold the spot until it gives. */
function pick(state, position) {
  return torque(setPosition(state, position), DEFAULTS.openMs + 50);
}

/**
 * Lean until the pick goes, however long that takes.
 *
 * Not a fixed duration: how fast a pick wears depends on how far the
 * cylinder refuses to move, and the worst position on the dial is
 * only "nothing at all" when the sweet spot is near an end. For a
 * lock whose answer sits mid-dial even the far end gives something
 * back, and a fixed four seconds quietly stopped snapping when the
 * wear was eased off. Hold until it happens, and cap it so a test can
 * still fail rather than hang.
 */
function leanUntilItSnaps(state, position) {
  let s = setPosition(state, position);
  const picks = s.picks;
  for (let i = 0; i < 20 && s.picks === picks && !s.over; i++) {
    s = torque(s, 20000, {release: false});
    if (s.turning) s = releaseTurn(s);
  }
  return s;
}

test('a game starts with three picks, a whole pick, and a lock', () => {
  const s = createGame({seed: 1});
  assert.equal(s.picks, DEFAULTS.picks);
  assert.equal(s.durability, DEFAULTS.durability);
  assert.equal(s.turning, false);
  assert.equal(s.over, false);
  assert.ok(s.lock.sweet >= 0 && s.lock.sweet < POSITIONS);
});

test('the sweet spot is never against either end of the dial', () => {
  for (let seed = 1; seed <= 40; seed++) {
    let s = createGame({seed});
    for (let i = 0; i < 4 && !s.over; i++) {
      assert.ok(s.lock.sweet > s.lock.tolerance, `seed ${seed}: the answer is at the bottom end`);
      assert.ok(s.lock.sweet < POSITIONS - 1 - s.lock.tolerance, `seed ${seed}: the answer is at the top end`);
      s = pick(s, s.lock.sweet);
    }
  }
});

test('the pick moves, and the dial does not wrap', () => {
  const s = createGame({seed: 2});
  assert.equal(setPosition(s, -5).position, 0);
  assert.equal(setPosition(s, 999).position, POSITIONS - 1);
  assert.equal(nudge(setPosition(s, 10), 5).position, 15);
});

/* ------------------------------------------------------------------
   The reading costs time under load, and nothing else does
   ------------------------------------------------------------------ */

test('the cylinder does not move until torque is on, however close the pick is', () => {
  const s = setPosition(createGame({seed: 3}), createGame({seed: 3}).lock.sweet);
  assert.equal(cylinderTurn(s), 0, 'the lock gave up its answer for free');
  assert.equal(s.durability, DEFAULTS.durability, 'and it charged for the move');
});

test('the cylinder comes round over readMs once torque is on, not instantly', () => {
  const fresh = createGame({seed: 3});
  const s = beginTurn(setPosition(fresh, fresh.lock.sweet), 0);
  const early = holdTurn(s, DEFAULTS.readMs / 2);
  assert.ok(cylinderTurn(early) > 0, 'nothing moved at all');
  assert.ok(cylinderTurn(early) < 1, 'it was all the way round immediately');
  assert.equal(cylinderTurn(holdTurn(early, DEFAULTS.readMs)), 1);
});

test('the pick cannot be slid along while the lock is under load', () => {
  const s = beginTurn(createGame({seed: 4}), 0);
  assert.equal(setPosition(s, 3).position, s.position, 'the pick moved while torqued');
});

test('turning is free, however badly placed the pick is', () => {
  /* The cylinder coming round and stopping is the lock working, not
     the pick suffering. A player who leans, looks and lets go has
     spent nothing but time — which is what makes sweeping the dial a
     thing you are allowed to do. */
  const fresh = createGame({seed: 5});
  const wild = fresh.lock.sweet > 50 ? 0 : POSITIONS - 1;

  const glance = torque(setPosition(fresh, wild), DEFAULTS.graceMs);
  assert.equal(glance.durability, DEFAULTS.durability, 'a clean glance cost the pick something');
  assert.equal(glance.picks, DEFAULTS.picks);
  assert.equal(glance.last.result, 'held', 'and it did not report a reading');
});

test('pushing a cylinder that has already refused is what costs', () => {
  const fresh = createGame({seed: 5});
  const wild = fresh.lock.sweet > 50 ? 0 : POSITIONS - 1;

  const shove = torque(setPosition(fresh, wild), DEFAULTS.graceMs + 600);
  assert.ok(shove.durability < DEFAULTS.durability - 10, 'leaning past the jam was free');

  const stare = leanUntilItSnaps(fresh, wild);
  assert.equal(stare.picks, DEFAULTS.picks - 1, 'leaning on the worst position forever never broke it');
});

test('the same hold costs far less the closer the pick is', () => {
  const fresh = createGame({seed: 6});
  const near = torque(setPosition(fresh, fresh.lock.sweet + fresh.lock.tolerance + 3), 500);
  const far = torque(setPosition(fresh, fresh.lock.sweet > 50 ? 0 : POSITIONS - 1), 500);
  assert.ok(near.durability > far.durability, 'distance did not matter');
  assert.ok(DEFAULTS.durability - near.durability < (DEFAULTS.durability - far.durability) / 3,
    'being close was barely cheaper than being nowhere near');
});

test('letting go keeps the pick, and reports what the cylinder did', () => {
  const fresh = createGame({seed: 7});
  const s = torque(setPosition(fresh, fresh.lock.sweet + fresh.lock.tolerance + 5), 300);
  assert.equal(s.turning, false);
  assert.equal(s.last.result, 'held');
  assert.ok(s.last.give > 0 && s.last.give < 1, 'the reading was not a reading');
  assert.equal(s.picks, DEFAULTS.picks);
});

/* ------------------------------------------------------------------
   Opening, and the end of a run
   ------------------------------------------------------------------ */

test('holding the sweet spot opens the lock and costs nothing at all', () => {
  const fresh = createGame({seed: 8});
  const opened = pick(fresh, fresh.lock.sweet);
  assert.equal(opened.opened, 1);
  assert.equal(opened.last.result, 'opened');
  assert.ok(opened.last.points > DEFAULTS.pointsPerLock, 'the pick that was left paid nothing');
  assert.equal(opened.picks, DEFAULTS.picks, 'opening a lock cost a pick');
  assert.equal(opened.durability, DEFAULTS.durability, 'being right wore the pick down');
});

test('a pick carries its wear into the next lock, and is never handed back full', () => {
  /* The bar used to jump to 100% every time a lock opened, which made
     the one resource in the game reset on success — a pick could only
     ever be lost inside a single lock, and three picks meant three
     chances rather than one run. This is the line that keeps the
     ladder. */
  let s = createGame({seed: 14});
  const wild = s.lock.sweet > 50 ? 0 : POSITIONS - 1;

  s = torque(setPosition(s, wild), DEFAULTS.graceMs + 700);
  const worn = s.durability;
  assert.ok(worn < DEFAULTS.durability, 'the pick never got worn in the first place');

  s = pick(s, s.lock.sweet);
  assert.equal(s.opened, 1);
  assert.equal(s.durability, worn, 'opening a lock handed back a fresh pick');

  s = pick(s, s.lock.sweet);
  assert.equal(s.opened, 2);
  assert.equal(s.durability, worn, 'the wear healed itself over two locks');
});

test('the sweet spot has to be held, not tapped', () => {
  const fresh = createGame({seed: 9});
  const tapped = torque(setPosition(fresh, fresh.lock.sweet), DEFAULTS.openMs - 100);
  assert.equal(tapped.opened, 0, 'the lock gave before it was held long enough');
  assert.equal(tapped.last.result, 'held');
});

test('each lock opened narrows the next one, down to a floor', () => {
  let s = createGame({seed: 10});
  const seen = [];
  for (let i = 0; i < 10 && !s.over; i++) {
    seen.push(s.lock.tolerance);
    s = pick(s, s.lock.sweet);
  }
  assert.ok(seen[1] < seen[0], 'the second lock was no tighter than the first');
  assert.equal(Math.min(...seen), DEFAULTS.toleranceFloor);
  assert.ok(seen.every((t) => t >= DEFAULTS.toleranceFloor));
});

test('a snapped pick costs a pick but never the lock', () => {
  const fresh = createGame({seed: 11});
  const wild = fresh.lock.sweet > 50 ? 0 : POSITIONS - 1;
  const s = leanUntilItSnaps(fresh, wild);
  assert.equal(s.last.result, 'snapped');
  assert.equal(s.picks, DEFAULTS.picks - 1);
  assert.equal(s.durability, DEFAULTS.durability, 'the next pick came out already worn');
  assert.equal(s.lock.sweet, fresh.lock.sweet, 'the lock was re-dealt and the deduction thrown away');
  assert.equal(s.over, false);
});

test('three snapped picks end the run, and nothing moves afterwards', () => {
  let s = createGame({seed: 12});
  const wild = s.lock.sweet > 50 ? 0 : POSITIONS - 1;
  for (let i = 0; i < 6 && !s.over; i++) s = leanUntilItSnaps(s, wild);
  assert.equal(s.over, true);
  assert.equal(s.picks, 0);

  const after = torque(s, 4000);
  assert.equal(after.turns, s.turns, 'the lock still turned after the last pick snapped');
  assert.equal(beginTurn(s, 0).turning, false);
  assert.equal(holdTurn(s, 1000), s);
});

test('a player who reads the lock finishes the run on the pick they started with', () => {
  /* Two readings triangulate: give() is a function of distance, so one
     hold tells you how far, and the second tells you which side. */
  for (const seed of [21, 22, 23]) {
    let s = createGame({seed});
    for (let lock = 0; lock < 5 && !s.over; lock++) {
      const before = s.opened;
      s = pick(s, s.lock.sweet);
      assert.equal(s.opened, before + 1, `seed ${seed}: the spot itself did not open the lock`);
    }
    assert.equal(s.picks, DEFAULTS.picks, `seed ${seed}: playing perfectly still cost a pick`);
    assert.equal(s.snapped, 0);
    assert.ok(s.score > 0);
  }
});

/**
 * Somebody who cannot see the answer, playing the way a person does.
 *
 * Sweeps the dial in five glances, goes to whichever gave the most,
 * then closes in by halving. Only ever reads what the cylinder did,
 * never state.lock.sweet — so if this cannot get in, neither can a
 * player, and "I do not get any lock open" is the bug it catches.
 */
function playByFeel(state, {glanceMs = 300} = {}) {
  let s = state;
  const readAt = (pos) => {
    s = torque(setPosition(s, pos), glanceMs);
    return s.last && s.last.result === 'held' ? s.last.give : 1;
  };

  let best = 50;
  let bestGive = -1;
  for (const pos of [10, 30, 50, 70, 90]) {
    if (s.over || s.opened > state.opened) return s;
    const g = readAt(pos);
    if (g >= 1) { s = pick(s, pos); return s; }
    if (g > bestGive) { bestGive = g; best = pos; }
  }

  /* Close in: try each side at a shrinking step and keep whichever
     reads better, which is all the direction the give function gives
     away. */
  for (let step = 16; step >= 2 && !s.over; step = Math.floor(step / 2)) {
    for (const cand of [best - step, best + step]) {
      if (cand < 0 || cand > 99 || s.over) continue;
      const g = readAt(cand);
      if (g >= 1) { s = pick(s, cand); return s; }
      if (g > bestGive) { bestGive = g; best = cand; }
    }
  }
  return pick(s, best);
}

test('a player who sweeps the dial and follows the reading gets in', () => {
  /* The difficulty knobs are only honest if this passes on every
     seed: tolerance, the give curve and the wear rate all have to
     leave room for the readings it takes to find the spot. */
  let broke = 0;
  for (let seed = 1; seed <= 25; seed++) {
    const s = playByFeel(createGame({seed}));
    assert.equal(s.opened, 1, `seed ${seed}: sweeping the whole dial never found the lock`);
    assert.equal(s.over, false, `seed ${seed}: the run ended before the first lock opened`);
    if (s.snapped > 0) broke += 1;
  }
  assert.ok(broke <= 3, `${broke} of 25 first locks cost a pick just to find — too punishing`);
});

test('the second and third locks are still findable the same way', () => {
  for (let seed = 31; seed <= 40; seed++) {
    let s = createGame({seed});
    for (let lock = 0; lock < 3; lock++) {
      const before = s.opened;
      s = playByFeel(s);
      assert.equal(s.opened, before + 1, `seed ${seed}: lock ${lock + 1} could not be found by feel`);
    }
    assert.equal(s.over, false, `seed ${seed}: three locks by feel used up every pick`);
  }
});

test('the same seed sets the same locks, a different one does not', () => {
  const shape = (seed) => {
    let s = createGame({seed});
    const out = [];
    for (let i = 0; i < 6; i++) { out.push(s.lock.sweet); s = pick(s, s.lock.sweet); }
    return out.join(',');
  };
  assert.equal(shape(41), shape(41));
  assert.notEqual(shape(41), shape(42));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {opened: 4, turns: 11};
  assert.match(summarise(s, 'en'), /4 locks opened · 11 turns/);
  assert.match(summarise(s, 'nl'), /4 sloten open · 11 pogingen/);
});
