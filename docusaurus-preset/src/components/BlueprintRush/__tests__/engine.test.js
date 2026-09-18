/**
 * engine.test.js — the blueprint-rush rules.
 *
 * The one that matters: the tray must always contain every part the
 * blueprint asks for. A deal that is missing one is unwinnable, and an
 * unwinnable board in a timed game reads to the player as the game
 * being broken, which it would be.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {createGame, step, place, timeLeft, summarise, PARTS, DEFAULTS} = require('../engine.js');

/** Complete the current blueprint correctly. */
function build(state, now = 0) {
  let s = state;
  for (const part of [...s.blueprint.needed]) s = place(s, part, now);
  return s;
}

test('a game opens with a blueprint, a tray and a clock', () => {
  const s = createGame({seed: 1, now: 0});
  assert.equal(s.blueprint.needed.length, DEFAULTS.slots);
  assert.equal(s.blueprint.filled.length, 0);
  assert.equal(timeLeft(s, 0), DEFAULTS.startMs);
  assert.equal(s.over, false);
});

test('the tray always holds every part the blueprint asks for, plus the distractors', () => {
  /* Twenty deals, because a shuffle bug shows up as one bad board in
     a handful, not as every board. */
  for (let seed = 1; seed <= 20; seed++) {
    let s = createGame({seed, now: 0});
    for (let round = 0; round < 3; round++) {
      const {needed, tray} = s.blueprint;
      for (const part of needed) {
        assert.ok(tray.includes(part), `seed ${seed}: tray cannot complete the blueprint`);
      }
      assert.equal(tray.length, DEFAULTS.slots + DEFAULTS.distractors);
      assert.equal(new Set(tray).size, tray.length, 'a part appears twice in the tray');
      for (const part of tray) assert.ok(PARTS.includes(part), `unknown part ${part}`);
      s = build(s, 100 * round);
    }
  }
});

test('placing a needed part fills its slot without scoring yet', () => {
  let s = createGame({seed: 3, now: 0});
  const first = s.blueprint.needed[0];
  s = place(s, first, 10);
  assert.deepEqual(s.blueprint.filled, [first]);
  assert.equal(s.score, 0);
  assert.equal(s.built, 0);
});

test('completing a blueprint scores, buys time and deals the next one', () => {
  let s = createGame({seed: 4, now: 0});
  const before = timeLeft(s, 0);
  const firstNeeded = [...s.blueprint.needed];
  s = build(s, 0);
  assert.equal(s.built, 1);
  assert.equal(s.score, DEFAULTS.pointsPerApp);
  assert.equal(timeLeft(s, 0), before + DEFAULTS.bonusMs);
  assert.equal(s.blueprint.filled.length, 0, 'the next blueprint started already filled');
  assert.equal(s.blueprint.needed.length, DEFAULTS.slots);
  assert.notDeepEqual(s.blueprint.needed, firstNeeded, 'the same blueprint was dealt twice in a row');
});

test('a streak of finished apps pays more each time', () => {
  let s = createGame({seed: 5, now: 0});
  s = build(s, 0);
  const first = s.score;
  s = build(s, 10);
  assert.equal(s.score - first, DEFAULTS.pointsPerApp + DEFAULTS.comboBonus);
  assert.equal(s.bestCombo, 2);
});

test('a part from some other app costs seconds, not a life', () => {
  let s = createGame({seed: 6, now: 0});
  const wrong = s.blueprint.tray.find((p) => !s.blueprint.needed.includes(p));
  const before = timeLeft(s, 0);
  s = place(s, wrong, 20);
  assert.equal(timeLeft(s, 0), before - DEFAULTS.penaltyMs);
  assert.equal(s.wrong, 1);
  assert.equal(s.over, false, 'a wrong part ended the run');
  assert.equal(s.blueprint.filled.length, 0);
});

test('placing the same part twice is a mistake, and the slot stays filled once', () => {
  let s = createGame({seed: 7, now: 0});
  const part = s.blueprint.needed[0];
  s = place(s, part, 10);
  /* Compare the deadline, not the time left: the clock moves between
     the two reads and would hide or invent a penalty of its own. */
  const deadlineBefore = s.endsAt;
  s = place(s, part, 20);
  assert.deepEqual(s.blueprint.filled, [part]);
  assert.equal(s.endsAt, deadlineBefore - DEFAULTS.penaltyMs);
  assert.equal(s.last.result, 'duplicate');
});

test('a wrong part breaks the streak', () => {
  let s = createGame({seed: 8, now: 0});
  s = build(s, 0);
  assert.equal(s.combo, 1);
  const wrong = s.blueprint.tray.find((p) => !s.blueprint.needed.includes(p));
  s = place(s, wrong, 10);
  assert.equal(s.combo, 0);
  assert.equal(s.bestCombo, 1, 'the best streak was forgotten');
});

test('the clock ends the run, and nothing scores afterwards', () => {
  let s = createGame({seed: 9, now: 0});
  s = step(s, DEFAULTS.startMs + 1);
  assert.equal(s.over, true);
  assert.equal(timeLeft(s, DEFAULTS.startMs + 1), 0);

  const frozen = place(s, s.blueprint.needed[0], DEFAULTS.startMs + 10);
  assert.equal(frozen.score, s.score);
  assert.equal(frozen.built, s.built);
});

test('a penalty that empties the clock ends the run there and then', () => {
  let s = createGame({seed: 10, now: 0, config: {startMs: 2000}});
  const wrong = s.blueprint.tray.find((p) => !s.blueprint.needed.includes(p));
  s = place(s, wrong, 100);
  assert.equal(s.over, true, 'the run kept going on an empty clock');
  assert.equal(timeLeft(s, 100), 0);
});

test('the clock never reads negative', () => {
  const s = createGame({seed: 11, now: 0});
  assert.equal(timeLeft(s, DEFAULTS.startMs * 10), 0);
});

test('the same seed deals the same blueprints, a different one does not', () => {
  const deals = (seed) => {
    let s = createGame({seed, now: 0});
    const out = [];
    for (let i = 0; i < 4; i++) { out.push(s.blueprint.needed.join(',')); s = build(s, i); }
    return out.join('|');
  };
  assert.equal(deals(42), deals(42));
  assert.notEqual(deals(42), deals(43));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {built: 6, bestCombo: 3};
  assert.match(summarise(s, 'en'), /6 apps built · streak 3/);
  assert.match(summarise(s, 'nl'), /6 apps gebouwd · reeks 3/);
});
