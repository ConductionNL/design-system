/**
 * engine.test.js — the deadline-defender rules.
 *
 * Two things are worth protecting. A case that runs out of time costs
 * the same as one sent to the wrong step, because in a real queue both
 * end the same way. And every situation the game deals has exactly one
 * correct lane, or the player is being asked to guess.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, step, route, clockMs, remaining, summarise,
  SITUATIONS, LANES, INTAKE, REVIEW, DECISION, DEFAULTS,
} = require('../engine.js');

/** Play correctly for a while, returning the state and what was dealt. */
function playPerfect(seed, cases, startAt = 0) {
  let s = createGame({seed, now: startAt});
  let t = startAt;
  const dealt = [];
  for (let i = 0; i < cases; i++) {
    s = step(s, t);
    if (!s.current) { t += 60; i--; continue; }
    dealt.push(s.current);
    t += 200;
    s = route(s, s.current.needs, t);
    t += DEFAULTS.gapMs + 20;
  }
  return {state: s, dealt};
}

test('every situation the game can deal has exactly one correct lane', () => {
  for (const sit of SITUATIONS) {
    assert.ok(LANES.includes(sit.needs), `${sit.key} routes nowhere`);
  }
  /* All three lanes have to be reachable, or one button is decoration. */
  for (const lane of LANES) {
    assert.ok(SITUATIONS.some((s) => s.needs === lane), `nothing ever goes to ${lane}`);
  }
});

test('a case is dealt, and it carries a number and a deadline', () => {
  let s = step(createGame({seed: 2, now: 0}), 0);
  assert.ok(s.current, 'no case arrived');
  assert.match(s.current.id, /^\d{4}-\d{3}$/);
  assert.equal(s.current.expiresAt - s.current.bornAt, DEFAULTS.clockStartMs);
});

test('routing correctly scores, and a streak pays more each time', () => {
  const {state} = playPerfect(4, 2);
  assert.equal(state.handled, 2);
  assert.equal(state.score, DEFAULTS.pointsPerCase * 2 + DEFAULTS.comboBonus);
  assert.equal(state.lives, DEFAULTS.lives);
  assert.equal(state.bestCombo, 2);
});

test('the wrong step costs a life and breaks the streak', () => {
  let s = step(createGame({seed: 6, now: 0}), 0);
  const wrong = LANES.find((l) => l !== s.current.needs);
  const before = s.score;
  s = route(s, wrong, 100);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.score, before, 'a misroute must not also pay');
  assert.equal(s.misrouted, 1);
  assert.equal(s.combo, 0);
  assert.equal(s.current, null, 'the misrouted case stayed on the desk');
});

test('letting the deadline run out costs the same as misrouting it', () => {
  let s = step(createGame({seed: 6, now: 0}), 0);
  s = step(s, DEFAULTS.clockStartMs + 1);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.missed, 1);
  assert.equal(s.current, null);
});

test('the next case waits for the gap, then arrives', () => {
  let s = step(createGame({seed: 8, now: 0}), 0);
  s = route(s, s.current.needs, 100);
  assert.equal(s.current, null);
  s = step(s, 100 + DEFAULTS.gapMs - 50);
  assert.equal(s.current, null, 'the queue skipped its own gap');
  s = step(s, 100 + DEFAULTS.gapMs + 10);
  assert.ok(s.current, 'the queue stalled');
});

test('three mistakes end the run, and nothing scores after it', () => {
  let s = createGame({seed: 9, now: 0});
  let t = 0;
  for (let i = 0; i < 3; i++) {
    s = step(s, t);
    const wrong = LANES.find((l) => l !== s.current.needs);
    t += 100;
    s = route(s, wrong, t);
    t += DEFAULTS.gapMs + 20;
  }
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);

  const frozen = {...s};
  assert.equal(step(frozen, t + 5000).score, s.score);
  assert.equal(route(frozen, INTAKE, t + 10).score, s.score);
});

test('an unknown lane is ignored rather than counted as a mistake', () => {
  let s = step(createGame({seed: 3, now: 0}), 0);
  const after = route(s, 'archive', 50);
  assert.equal(after.lives, s.lives);
  assert.equal(after.current, s.current);
});

test('routing an empty desk does nothing', () => {
  const s = createGame({seed: 3, now: 0});
  assert.equal(route(s, INTAKE, 10).lives, s.lives);
});

test('the deadline tightens with the score, down to a readable floor', () => {
  const fresh = createGame({seed: 1});
  assert.equal(clockMs(fresh), DEFAULTS.clockStartMs);
  assert.ok(clockMs({...fresh, score: 200}) < DEFAULTS.clockStartMs);
  assert.equal(clockMs({...fresh, score: 5000}), DEFAULTS.clockFloorMs);
});

test('the countdown runs from full to empty, and never past either end', () => {
  let s = step(createGame({seed: 5, now: 0}), 0);
  assert.equal(remaining(s, 0), 1);
  assert.ok(Math.abs(remaining(s, DEFAULTS.clockStartMs / 2) - 0.5) < 0.01);
  assert.equal(remaining(s, DEFAULTS.clockStartMs), 0);
  assert.equal(remaining(s, DEFAULTS.clockStartMs * 5), 0, 'the bar went negative');
  assert.equal(remaining({...s, current: null}, 0), 0);
});

test('a perfect player is never punished by the clock', () => {
  const {state} = playPerfect(40, 40);
  assert.equal(state.lives, DEFAULTS.lives);
  assert.equal(state.over, false);
  assert.ok(state.score > 0);
});

test('the deal is varied, and all three lanes turn up in a real run', () => {
  const {dealt} = playPerfect(13, 30);
  const lanes = new Set(dealt.map((c) => c.needs));
  assert.deepEqual([...lanes].sort(), [DECISION, INTAKE, REVIEW].sort());
  assert.ok(new Set(dealt.map((c) => c.key)).size >= 4, 'the same few cases keep coming back');
});

test('the same seed deals the same cases, a different one does not', () => {
  const a = playPerfect(21, 6).dealt.map((c) => c.key).join(',');
  const b = playPerfect(21, 6).dealt.map((c) => c.key).join(',');
  const c = playPerfect(22, 6).dealt.map((c) => c.key).join(',');
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('the summary reads as a sentence in both locales', () => {
  const s = {handled: 9, bestCombo: 4};
  assert.match(summarise(s, 'en'), /9 cases on time · streak 4/);
  assert.match(summarise(s, 'nl'), /9 zaken op tijd · reeks 4/);
});
