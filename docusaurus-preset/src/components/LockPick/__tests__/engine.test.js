/**
 * engine.test.js — the lock-pick rules.
 *
 * Two properties carry the game. Every lock must be openable by
 * feeling for it, which is what makes this deduction rather than a
 * lottery: the feedback has to get stronger as the pick gets closer,
 * on every lock, at every difficulty. And a snapped pick must not cost
 * the player the lock they had almost worked out.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, setPosition, nudge, give, turn, summarise, POSITIONS, DEFAULTS,
} = require('../engine.js');

/** Play a lock the way a person would: halve the range by feel. */
function pickByFeel(state, maxTurns = 40) {
  let s = state;
  let low = 0;
  let high = POSITIONS - 1;
  const opened = s.opened;
  for (let i = 0; i < maxTurns && !s.over && s.opened === opened; i++) {
    const mid = Math.round((low + high) / 2);
    s = setPosition(s, mid);
    const before = give(s);
    s = turn(s);
    if (s.opened > opened || s.over) break;
    /* Feel left and right of the guess, and walk towards the stronger
       side. This is what a player does with graded feedback. */
    const left = give(setPosition(s, Math.max(low, mid - 5)));
    const right = give(setPosition(s, Math.min(high, mid + 5)));
    if (left > before && left >= right) high = mid;
    else if (right > before) low = mid;
    else { low = Math.max(low, mid - 10); high = Math.min(high, mid + 10); }
  }
  return s;
}

test('a game starts with three picks, a whole pick, and a lock', () => {
  const s = createGame({seed: 1});
  assert.equal(s.picks, DEFAULTS.picks);
  assert.equal(s.durability, DEFAULTS.durability);
  assert.equal(s.lock.tolerance, DEFAULTS.toleranceStart);
  assert.equal(s.over, false);
});

test('the sweet spot is never against either end of the dial', () => {
  for (let seed = 1; seed <= 50; seed++) {
    let s = createGame({seed});
    for (let lock = 0; lock < 8; lock++) {
      const {sweet, tolerance} = s.lock;
      assert.ok(sweet - tolerance > 0, `seed ${seed}: a lock opens at the very start of the dial`);
      assert.ok(sweet + tolerance < POSITIONS - 1, `seed ${seed}: a lock opens at the very end`);
      s = turn(setPosition(s, sweet));
    }
  }
});

test('the pick moves, and the dial does not wrap', () => {
  const s = createGame({seed: 2});
  assert.equal(setPosition(s, -5).position, 0);
  assert.equal(setPosition(s, 999).position, POSITIONS - 1);
  assert.equal(nudge(setPosition(s, 10), -1).position, 9);
  assert.equal(nudge(setPosition(s, 0), -1).position, 0);
});

test('the cylinder gives more the closer the pick gets, on every lock', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const s = createGame({seed});
    const {sweet} = s.lock;
    let previous = -1;
    /* Walk in from a long way out on whichever side has room: the dial
       does not wrap, so on a lock near one end the far distances all
       clamp to the same position and would compare equal. */
    const towardsEnd = sweet > POSITIONS / 2 ? -1 : 1;
    for (const distance of [40, 30, 20, 14, 10]) {
      const at = sweet + towardsEnd * distance;
      assert.ok(at >= 0 && at < POSITIONS, `seed ${seed}: walked off the dial at ${distance}`);
      const value = give(setPosition(s, at));
      assert.ok(value > previous, `seed ${seed}: the feel did not improve at ${distance} away`);
      previous = value;
    }
    assert.equal(give(setPosition(s, sweet)), 1);
  }
});

test('turning on the sweet spot opens the lock and pays for the pick that is left', () => {
  const s = createGame({seed: 3});
  const opened = turn(setPosition(s, s.lock.sweet));
  assert.equal(opened.opened, 1);
  assert.ok(opened.score >= DEFAULTS.pointsPerLock);
  assert.equal(opened.last.result, 'opened');
  assert.equal(opened.picks, DEFAULTS.picks, 'opening a lock cost a pick');
  assert.equal(opened.durability, DEFAULTS.durability, 'the next lock started on a worn pick');
});

test('each lock opened narrows the next one, down to a floor', () => {
  let s = createGame({seed: 4});
  const seen = [];
  for (let i = 0; i < 12; i++) {
    seen.push(s.lock.tolerance);
    s = turn(setPosition(s, s.lock.sweet));
  }
  assert.equal(seen[0], DEFAULTS.toleranceStart);
  assert.ok(seen[3] < seen[0], 'the locks never got harder');
  assert.equal(Math.min(...seen), DEFAULTS.toleranceFloor, 'the difficulty never reached its floor');
  assert.ok(seen.every((t) => t >= DEFAULTS.toleranceFloor), 'a lock got harder than the floor');
});

test('a turn well off the spot strains the pick, and a wild one costs far more', () => {
  const s = createGame({seed: 5});
  const near = turn(setPosition(s, s.lock.sweet + s.lock.tolerance + 4));
  const far = turn(setPosition(s, s.lock.sweet > 50 ? 0 : POSITIONS - 1));

  assert.equal(near.last.result, 'held');
  assert.ok(near.durability < DEFAULTS.durability);

  /* The wild turn must hurt more but must not be fatal on its own:
     the pick has to survive long enough for the player to read the
     feedback it just gave them. */
  assert.equal(far.last.result, 'held', 'one wild turn snapped a fresh pick');
  assert.ok(
    DEFAULTS.durability - far.durability > DEFAULTS.durability - near.durability,
    'a wild guess cost no more than a near miss',
  );
});

test('two wild turns in a row do end a pick', () => {
  let s = createGame({seed: 5});
  const wild = s.lock.sweet > 50 ? 0 : POSITIONS - 1;
  s = turn(setPosition(s, wild));
  assert.equal(s.picks, DEFAULTS.picks);
  s = turn(setPosition(s, wild));
  assert.equal(s.last.result, 'snapped');
  assert.equal(s.picks, DEFAULTS.picks - 1);
});

test('a snapped pick costs a pick but never the lock', () => {
  let s = createGame({seed: 6});
  const {sweet, tolerance} = s.lock;
  const wild = sweet > 50 ? 0 : POSITIONS - 1;
  while (s.picks === DEFAULTS.picks && !s.over) s = turn(setPosition(s, wild));
  assert.equal(s.picks, DEFAULTS.picks - 1);
  assert.equal(s.last.result, 'snapped');
  assert.equal(s.durability, DEFAULTS.durability, 'the new pick started already worn');
  assert.equal(s.lock.sweet, sweet, 'the lock was re-dealt under the player');
  assert.equal(s.lock.tolerance, tolerance);
});

test('three snapped picks end the run, and nothing moves afterwards', () => {
  let s = createGame({seed: 7});
  const wild = s.lock.sweet > 50 ? 0 : POSITIONS - 1;
  for (let i = 0; i < 200 && !s.over; i++) s = turn(setPosition(s, wild));
  assert.equal(s.over, true);
  assert.equal(s.picks, 0);
  assert.equal(s.snapped, 3);
  assert.equal(turn(s).turns, s.turns, 'the lock still turned after the last pick snapped');
  assert.equal(setPosition(s, 5).position, s.position, 'the pick still moved after game over');
});

test('a player who feels for it opens locks rather than running out of picks', () => {
  /* Twenty seeds, played the way the feedback asks to be played. If
     this fails the game is a lottery, whatever it looks like. */
  let openedTotal = 0;
  for (let seed = 1; seed <= 20; seed++) {
    let s = createGame({seed});
    for (let lock = 0; lock < 3 && !s.over; lock++) s = pickByFeel(s);
    assert.ok(s.opened >= 1, `seed ${seed}: feeling for the spot never opened a single lock`);
    openedTotal += s.opened;
  }
  assert.ok(openedTotal >= 40, `expected most locks to fall to deduction, got ${openedTotal}`);
});

test('the same seed sets the same locks, a different one does not', () => {
  const spots = (seed) => {
    let s = createGame({seed});
    const out = [];
    for (let i = 0; i < 6; i++) { out.push(s.lock.sweet); s = turn(setPosition(s, s.lock.sweet)); }
    return out.join(',');
  };
  assert.equal(spots(11), spots(11));
  assert.notEqual(spots(11), spots(12));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {opened: 5, turns: 23};
  assert.match(summarise(s, 'en'), /5 locks opened · 23 turns/);
  assert.match(summarise(s, 'nl'), /5 sloten open · 23 pogingen/);
});
