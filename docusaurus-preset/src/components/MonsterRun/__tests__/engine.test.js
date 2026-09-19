/**
 * engine.test.js — the monster-run rules.
 *
 * The property the whole game rests on: obstacles never arrive so close
 * together that no posture gets past both. The monster cannot be in the
 * air and crouched at once, so a pair like that is a death the player
 * could not have avoided, and an arcade game that kills you for nothing
 * is one nobody plays twice.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, step, jump, duck, clears, stepMs, summarise,
  TRACK, LOW, HIGH, OBSTACLES, PARTS, DEFAULTS,
} = require('../engine.js');

/** Play the run properly: jump what is low, duck what is high. */
function playWell(state, steps) {
  let s = state;
  let t = s.nextStepAt;
  for (let i = 0; i < steps && !s.over; i++) {
    const incoming = s.track[0];
    if (incoming && incoming.kind === 'obstacle') {
      s = incoming.lane === LOW ? jump(s) : duck(s);
    }
    s = step(s, t);
    t = s.nextStepAt;
  }
  return s;
}

test('a run starts on a full track, upright and alive', () => {
  const s = createGame({seed: 1, now: 0});
  assert.equal(s.track.length, TRACK);
  assert.equal(s.posture, 'run');
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.over, false);
});

test('the run starts on empty road, so nothing is hit before a key is touched', () => {
  /* Found by playing it: the initial fill could drop an obstacle at
     the monster's feet, and the run cost a life in its first second. */
  for (let seed = 1; seed <= 30; seed++) {
    const s = createGame({seed, now: 0});
    const runUp = s.track.slice(0, DEFAULTS.leadIn);
    assert.ok(
      runUp.every((cell) => cell === null),
      `seed ${seed}: the run starts with something already in the way`,
    );
  }
});

test('a run that is left alone survives its own lead-in', () => {
  let s = createGame({seed: 9, now: 0});
  for (let i = 0; i < DEFAULTS.leadIn; i++) s = step(s, s.nextStepAt);
  assert.equal(s.lives, DEFAULTS.lives, 'a life went before the player could react');
  assert.equal(s.over, false);
});

test('obstacles never arrive without room to answer the one before', () => {
  /* Forty seeds, a few hundred steps each. A bad pair shows up as one
     run in dozens, not as every run. */
  for (let seed = 1; seed <= 40; seed++) {
    let s = createGame({seed, now: 0});
    let sinceObstacle = DEFAULTS.minGap;
    let t = s.nextStepAt;
    for (let i = 0; i < 300 && !s.over; i++) {
      const incoming = s.track[0];
      if (incoming && incoming.kind === 'obstacle') {
        assert.ok(
          sinceObstacle >= DEFAULTS.minGap,
          `seed ${seed}: two obstacles ${sinceObstacle} steps apart, which no posture clears`,
        );
        sinceObstacle = 0;
        s = incoming.lane === LOW ? jump(s) : duck(s);
      } else {
        sinceObstacle += 1;
      }
      s = step(s, t);
      t = s.nextStepAt;
    }
  }
});

test('jumping clears what is on the ground, ducking clears what is overhead', () => {
  assert.equal(clears('jump', {kind: 'obstacle', lane: LOW}), true);
  assert.equal(clears('run', {kind: 'obstacle', lane: LOW}), false);
  assert.equal(clears('duck', {kind: 'obstacle', lane: LOW}), false, 'crouching under a fork');

  assert.equal(clears('duck', {kind: 'obstacle', lane: HIGH}), true);
  assert.equal(clears('jump', {kind: 'obstacle', lane: HIGH}), false, 'jumping into the thing overhead');
  assert.equal(clears('run', {kind: 'obstacle', lane: HIGH}), false);
});

test('an empty track and a part are cleared by any posture', () => {
  for (const posture of ['run', 'jump', 'duck']) {
    assert.equal(clears(posture, null), true);
    assert.equal(clears(posture, {kind: 'part', what: 'token'}), true);
  }
});

test('running into what you did not clear costs a life and names it', () => {
  let s = createGame({seed: 3, now: 0});
  s = {...s, track: [{kind: 'obstacle', what: 'fork', lane: LOW}, ...s.track.slice(1)]};
  s = step(s, s.nextStepAt);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.hits, 1);
  assert.equal(s.last.result, 'hit');
  assert.equal(s.last.what, 'fork');
});

test('a part is picked up whatever the monster is doing', () => {
  let s = createGame({seed: 4, now: 0});
  s = {...s, track: [{kind: 'part', what: 'token', lane: HIGH}, ...s.track.slice(1)]};
  s = step(jump(s), s.nextStepAt);
  assert.equal(s.collected, 1);
  assert.equal(s.score, DEFAULTS.pointsPerPart);
});

test('a posture wears off, and cannot be changed mid-air', () => {
  let s = createGame({seed: 5, now: 0});
  s = jump(s);
  assert.equal(s.posture, 'jump');
  assert.equal(duck(s).posture, 'jump', 'the monster ducked while airborne');

  for (let i = 0; i < DEFAULTS.jumpSteps; i++) s = step(s, s.nextStepAt);
  assert.equal(s.posture, 'run', 'the jump never ended');
});

test('three hits end the run, and nothing moves afterwards', () => {
  let s = createGame({seed: 6, now: 0});
  for (let i = 0; i < 3; i++) {
    s = {...s, track: [{kind: 'obstacle', what: 'fork', lane: LOW}, ...s.track.slice(1)]};
    s = step(s, s.nextStepAt);
  }
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);
  assert.equal(step(s, s.nextStepAt + 10000).distance, s.distance);
  assert.equal(jump(s).posture, s.posture, 'the monster jumped after the run ended');
});

test('nothing happens between steps', () => {
  const s = createGame({seed: 7, now: 0});
  const early = step(s, s.nextStepAt - 1);
  assert.equal(early.distance, 0);
  assert.equal(step(s, s.nextStepAt).distance, 1);
});

test('the run speeds up with the score, down to a floor a person can react in', () => {
  const fresh = createGame({seed: 8, now: 0});
  assert.equal(stepMs(fresh), DEFAULTS.stepStartMs);
  assert.ok(stepMs({...fresh, score: 50}) < DEFAULTS.stepStartMs);
  assert.equal(stepMs({...fresh, score: 9000}), DEFAULTS.stepFloorMs);
});

test('a player who reads the track survives a long run', () => {
  for (const seed of [11, 12, 13]) {
    const s = playWell(createGame({seed, now: 0}), 250);
    assert.equal(s.over, false, `seed ${seed}: playing correctly still ended the run`);
    assert.equal(s.lives, DEFAULTS.lives);
    assert.ok(s.distance > 200);
    assert.ok(s.score > 0);
  }
});

test('the track deals both kinds of obstacle and something worth collecting', () => {
  const seen = new Set();
  let s = createGame({seed: 21, now: 0});
  let t = s.nextStepAt;
  for (let i = 0; i < 400 && !s.over; i++) {
    const incoming = s.track[0];
    if (incoming) seen.add(incoming.kind === 'obstacle' ? `o:${incoming.lane}` : 'part');
    if (incoming && incoming.kind === 'obstacle') s = incoming.lane === LOW ? jump(s) : duck(s);
    s = step(s, t);
    t = s.nextStepAt;
  }
  assert.ok(seen.has(`o:${LOW}`), 'nothing ever arrived on the ground');
  assert.ok(seen.has(`o:${HIGH}`), 'nothing ever arrived overhead');
  assert.ok(seen.has('part'), 'there was never anything to collect');
});

test('every obstacle and part the generator makes is one the game knows', () => {
  const obstacleKeys = OBSTACLES.map((o) => o.key);
  let s = createGame({seed: 31, now: 0});
  let t = s.nextStepAt;
  for (let i = 0; i < 300 && !s.over; i++) {
    for (const cell of s.track) {
      if (!cell) continue;
      if (cell.kind === 'obstacle') {
        assert.ok(obstacleKeys.includes(cell.what), `unknown obstacle ${cell.what}`);
        assert.ok([LOW, HIGH].includes(cell.lane));
      } else {
        assert.ok(PARTS.includes(cell.what), `unknown part ${cell.what}`);
      }
    }
    const incoming = s.track[0];
    if (incoming && incoming.kind === 'obstacle') s = incoming.lane === LOW ? jump(s) : duck(s);
    s = step(s, t);
    t = s.nextStepAt;
  }
});

test('the same seed runs the same track, a different one does not', () => {
  const shape = (seed) => createGame({seed, now: 0}).track
    .map((c) => (c ? `${c.kind[0]}${c.lane[0]}` : '-')).join('');
  assert.equal(shape(41), shape(41));
  assert.notEqual(shape(41), shape(42));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {distance: 240, collected: 9};
  assert.match(summarise(s, 'en'), /240 strides · 9 parts/);
  assert.match(summarise(s, 'nl'), /240 stappen · 9 onderdelen/);
});
