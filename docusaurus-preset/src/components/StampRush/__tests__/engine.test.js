/**
 * engine.test.js — the stamp-rush rules.
 *
 * The rule worth protecting is the asymmetry: adopting a decision that
 * has no quorum costs you, and holding one back costs you nothing. A
 * game that scored both the same would teach the opposite of what the
 * app does.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, step, stamp, tempo, summarise, SLOTS, READY, NO_QUORUM, CONFLICT, DEFAULTS,
} = require('../engine.js');

/** Run the clock forward in ticks, so spawns and expiries both fire. */
function run(state, fromMs, toMs, tick = 60) {
  let s = state;
  for (let t = fromMs; t <= toMs; t += tick) s = step(s, t);
  return s;
}

function put(state, slot, kind, now = 0, lifeMs = 1000) {
  const slots = [...state.slots];
  slots[slot] = {kind, id: `x${slot}`, bornAt: now, expiresAt: now + lifeMs, quorum: {have: 7, need: 7}};
  return {...state, slots};
}

test('a new game starts empty, alive and scoreless', () => {
  const s = createGame({seed: 1});
  assert.equal(s.slots.length, SLOTS);
  assert.equal(s.slots.filter(Boolean).length, 0);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.score, 0);
  assert.equal(s.over, false);
});

test('cards appear over time, and never two in one slot', () => {
  let s = run(createGame({seed: 3}), 0, 6000);
  const filled = s.slots.filter(Boolean);
  assert.ok(filled.length > 0, 'nothing ever spawned');
  assert.ok(filled.length <= SLOTS);
  const ids = new Set(filled.map((c) => c.id));
  assert.equal(ids.size, filled.length);
});

test('adopting a ready decision scores, and a streak pays more each time', () => {
  let s = createGame({seed: 5});
  s = put(s, 0, READY);
  s = stamp(s, 0, 10);
  const first = s.score;
  assert.equal(first, DEFAULTS.pointsPerAdopt);
  assert.equal(s.adopted, 1);
  assert.equal(s.combo, 1);

  s = put(s, 1, READY);
  s = stamp(s, 1, 20);
  assert.equal(s.score - first, DEFAULTS.pointsPerAdopt + DEFAULTS.comboBonus);
  assert.equal(s.bestCombo, 2);
});

test('stamping a decision without quorum costs a life and breaks the streak', () => {
  let s = createGame({seed: 5});
  s = put(s, 0, READY);
  s = stamp(s, 0, 10);
  s = put(s, 1, NO_QUORUM);
  const before = s.score;
  s = stamp(s, 1, 20);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.combo, 0);
  assert.equal(s.score, before, 'a mistake must not also pay');
  assert.equal(s.mistakes, 1);
});

test('a conflict of interest is judged exactly like a missing quorum', () => {
  let s = stamp(put(createGame({seed: 5}), 2, CONFLICT), 2, 10);
  assert.equal(s.lives, DEFAULTS.lives - 1);
});

test('holding a bad decision back costs nothing, and is counted', () => {
  let s = put(createGame({seed: 5}), 3, NO_QUORUM, 0, 500);
  s = step(s, 600);
  assert.equal(s.lives, DEFAULTS.lives, 'restraint was punished');
  assert.equal(s.held, 1);
  assert.equal(s.slots[3], null);
});

test('letting a ready decision expire costs a life', () => {
  let s = put(createGame({seed: 5}), 4, READY, 0, 500);
  s = step(s, 600);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.slots[4], null);
});

test('three mistakes end the run, and nothing scores after it', () => {
  let s = createGame({seed: 5});
  for (let i = 0; i < 3; i++) {
    s = put(s, i, NO_QUORUM);
    s = stamp(s, i, 10 * i);
  }
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);

  const after = stamp(put({...s, over: true}, 5, READY), 5, 99);
  assert.equal(after.score, s.score, 'the board kept scoring after game over');
});

test('stamping an empty slot is not a mistake', () => {
  const s = createGame({seed: 5});
  const after = stamp(s, 2, 10);
  assert.equal(after.lives, s.lives);
  assert.equal(after.score, s.score);
});

test('the board speeds up with the score, down to a floor a person can still read', () => {
  const slow = tempo(createGame({seed: 1}));
  const mid = tempo({...createGame({seed: 1}), score: 400});
  assert.ok(mid.spawnMs < slow.spawnMs, 'the game never got harder');
  assert.ok(mid.lifeMs < slow.lifeMs);
  /* 400 points is a good run, not an endless one, and the curve is
     deliberately still short of its floors there: the floors are the
     end of the ramp, not the middle of it. */
  assert.ok(mid.spawnMs > DEFAULTS.spawnFloorMs);
  assert.ok(mid.lifeMs > DEFAULTS.lifeFloorMs);

  const relentless = tempo({...createGame({seed: 1}), score: 5000});
  assert.equal(relentless.spawnMs, DEFAULTS.spawnFloorMs, 'the spawn rate never clamps');
  assert.equal(relentless.lifeMs, DEFAULTS.lifeFloorMs, 'card lifetime never clamps');
});

test('a full board does not skip its next spawn once a slot frees up', () => {
  let s = createGame({seed: 9, now: 0});
  for (let i = 0; i < SLOTS; i++) s = put(s, i, READY, 0, 100000);
  s = step(s, 5000);
  assert.equal(s.slots.filter(Boolean).length, SLOTS);
  s = stamp(s, 0, 5001);
  s = step(s, 5200);
  assert.ok(s.slots[0], 'the freed slot stayed empty');
});

test('the same seed plays the same game, a different one does not', () => {
  const a = run(createGame({seed: 42}), 0, 4000);
  const b = run(createGame({seed: 42}), 0, 4000);
  const c = run(createGame({seed: 43}), 0, 4000);
  const shape = (s) => s.slots.map((x) => (x ? x.kind : '-')).join(',');
  assert.equal(shape(a), shape(b));
  assert.notEqual(shape(a), shape(c));
});

test('both kinds of decision actually turn up over a long run', () => {
  let s = createGame({seed: 11});
  const seen = new Set();
  for (let t = 0; t < 60000; t += 50) {
    s = step(s, t);
    s.slots.forEach((c) => { if (c) seen.add(c.kind); });
    /* Keep it alive: adopt what is ready, hold the rest. */
    s.slots.forEach((c, i) => { if (c && c.kind === READY) s = stamp(s, i, t); });
    if (s.over) break;
  }
  assert.ok(seen.has(READY));
  assert.ok(seen.has(NO_QUORUM) || seen.has(CONFLICT));
});

test('a perfect player is never punished by the clock', () => {
  let s = createGame({seed: 21});
  for (let t = 0; t < 30000; t += 40) {
    s = step(s, t);
    s.slots.forEach((c, i) => { if (c && c.kind === READY) s = stamp(s, i, t); });
  }
  assert.equal(s.over, false, 'playing correctly still ended the run');
  assert.equal(s.lives, DEFAULTS.lives);
  assert.ok(s.score > 0);
});

test('the summary reads as a sentence in both locales', () => {
  const s = {adopted: 12, bestCombo: 5};
  assert.match(summarise(s, 'en'), /12 decisions adopted · streak 5/);
  assert.match(summarise(s, 'nl'), /12 besluiten vastgesteld · reeks 5/);
});
