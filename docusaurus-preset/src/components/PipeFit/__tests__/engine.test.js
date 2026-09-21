/**
 * engine.test.js — the pipe-fit rules.
 *
 * The property everything rests on: every route dealt can actually be
 * finished. The route is built from a working line and then scrambled,
 * so a solution exists by construction, and the test proves it by
 * finding one. An unsolvable puzzle on a clock reads as a broken game,
 * and the player has no way to tell the difference.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, turn, step, connected, openings, clockMs, remaining, summarise,
  PORTS, DEFAULTS,
} = require('../engine.js');

/**
 * Let go of a finished route: a solved line is held on screen for a
 * beat, and only the clock deals the next one.
 */
function resume(state) {
  return state.cleared ? step(state, state.cleared.until) : state;
}

/**
 * Solve a route by walking it: each piece has exactly one turn that
 * meets what is carried in, so the line settles in one pass.
 */
function solve(state, now = 0) {
  /* Nothing turns while the route before it is still being shown. */
  let s = resume(state);
  const finished = s.routes;
  for (let i = 0; i < s.route.pieces.length; i++) {
    /* Whatever the piece before it hands over. */
    let carry = s.route.source;
    for (let k = 0; k < i; k++) carry = openings(s.route.pieces[k]).right;

    for (let t = 0; t < PORTS; t++) {
      if (openings(s.route.pieces[i]).left === carry) break;
      s = turn(s, i, now);
      /* The last turn of a route replaces it with the next one, so
         stop here: carrying on would solve a route nobody asked for,
         which is how this walk first read as a failure. */
      if (s.over || s.routes > finished) return s;
    }
  }
  return s;
}

test('a route is dealt, out of true, with a source and a target', () => {
  const s = createGame({seed: 1, now: 0});
  assert.equal(s.route.pieces.length, DEFAULTS.lengthStart);
  assert.ok(s.route.source >= 0 && s.route.source < PORTS);
  assert.ok(s.route.target >= 0 && s.route.target < PORTS);
  assert.equal(connected(s.route), false, 'the route was dealt already finished');
});

test('every route dealt can be finished', () => {
  /* Thirty seeds, several routes each: an unsolvable deal shows up as
     one route in dozens, not as every route. */
  for (let seed = 1; seed <= 30; seed++) {
    let s = createGame({seed, now: 0});
    for (let round = 0; round < 4; round++) {
      const before = s.routes;
      s = solve(s, round * 10);
      assert.equal(s.routes, before + 1, `seed ${seed}: a route could not be finished`);
    }
  }
});

test('turning moves both openings together, which is the whole puzzle', () => {
  const piece = {shape: {left: 0, right: 1}, turn: 0};
  const before = openings(piece);
  const after = openings({...piece, turn: 1});
  assert.equal(after.left, (before.left + 1) % PORTS);
  assert.equal(after.right, (before.right + 1) % PORTS);
});

test('a line is only connected when every join meets and it reaches the target', () => {
  const route = {
    source: 0,
    target: 2,
    pieces: [{shape: {left: 0, right: 1}, turn: 0}, {shape: {left: 1, right: 2}, turn: 0}],
  };
  assert.equal(connected(route), true);

  const broken = {...route, pieces: [{...route.pieces[0], turn: 1}, route.pieces[1]]};
  assert.equal(connected(broken), false, 'a broken join read as connected');

  const wrongTarget = {...route, target: 0};
  assert.equal(connected(wrongTarget), false, 'a line that ends nowhere read as connected');
});

test('finishing a route pays a bonus, is held on screen, then deals the next one', () => {
  let s = createGame({seed: 3, now: 0});
  s = solve(s, 0);
  assert.equal(s.routes, 1);
  assert.ok(s.score >= DEFAULTS.pointsPerRoute, 'the bonus waited for the hold');
  assert.ok(s.cleared, 'the finished route was not held');
  assert.equal(connected(s.route), true, 'the finished route was taken away at once');
  assert.equal(s.lives, DEFAULTS.lives, 'finishing a route cost a life');

  /* Still held a tick before the beat is up. */
  assert.equal(step(s, s.cleared.until - 1), s);

  const next = step(s, s.cleared.until);
  assert.equal(next.cleared, null);
  assert.ok(next.route, 'no next route arrived');
  assert.equal(connected(next.route), false);
});

test('nothing turns, and no life is lost, while a finished route is held', () => {
  let s = createGame({seed: 3, now: 0});
  s = solve(s, 0);
  assert.equal(turn(s, 0, s.cleared.at + 1), s, 'a held route could still be fiddled with');

  /* The countdown had run out under the hold; it must not bite. */
  const late = step(s, Math.max(s.route.expiresAt, s.cleared.until) + 1);
  assert.equal(late.lives, DEFAULTS.lives, 'a finished route spilled');
  assert.equal(late.routes, 1);
});

test('the clock stops while a finished route is held', () => {
  let s = createGame({seed: 3, now: 0});
  s = solve(s, 0);
  assert.equal(remaining(s, s.cleared.at), remaining(s, s.cleared.until));
});

test('routes get longer, but never longer than a person will finish', () => {
  let s = createGame({seed: 4, now: 0});
  const lengths = [s.route.pieces.length];
  for (let i = 0; i < 12 && !s.over; i++) {
    s = solve(s, i * 10);
    lengths.push(s.route.pieces.length);
  }
  assert.ok(Math.max(...lengths) > DEFAULTS.lengthStart, 'the routes never grew');
  assert.ok(Math.max(...lengths) <= DEFAULTS.lengthMax, 'a route grew past its own ceiling');
});

test('turning is never punished, only the route that is never finished', () => {
  let s = createGame({seed: 5, now: 0});
  for (let i = 0; i < 20; i++) {
    s = resume(s);
    s = turn(s, i % s.route.pieces.length, 10);
  }
  assert.equal(s.lives, DEFAULTS.lives, 'fiddling with the connectors cost a life');
  assert.ok(s.turns >= 20);
});

test('a connector that does not exist is ignored', () => {
  const s = createGame({seed: 6, now: 0});
  assert.equal(turn(s, 99, 0), s);
  assert.equal(turn(s, -1, 0), s);
});

test('the payload arriving on an unfinished route costs a life', () => {
  let s = createGame({seed: 7, now: 0});
  const arrives = s.route.expiresAt;
  s = step(s, arrives + 1);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.last.result, 'spilled');
  assert.ok(s.route, 'no fresh route after the spill');
});

test('three spills end it, and nothing turns afterwards', () => {
  let s = createGame({seed: 8, now: 0});
  let t = 0;
  for (let i = 0; i < DEFAULTS.lives; i++) {
    t = s.route.expiresAt + 1;
    s = step(s, t);
  }
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);
  assert.equal(turn(s, 0, t + 10).turns, s.turns);
  assert.equal(step(s, t + 10000).lives, 0);
});

test('nothing spills before the payload is due', () => {
  const s = createGame({seed: 9, now: 0});
  assert.equal(step(s, s.route.expiresAt - 1).lives, DEFAULTS.lives);
});

test('the clock tightens with the score, down to a workable floor', () => {
  const fresh = createGame({seed: 10, now: 0});
  assert.equal(clockMs(fresh), DEFAULTS.clockStartMs);
  assert.ok(clockMs({...fresh, score: 80}) < DEFAULTS.clockStartMs);
  assert.equal(clockMs({...fresh, score: 9000}), DEFAULTS.clockFloorMs);
});

test('the countdown runs full to empty and no further', () => {
  const s = createGame({seed: 11, now: 0});
  assert.equal(remaining(s, 0), 1);
  assert.equal(remaining(s, DEFAULTS.clockStartMs * 3), 0);
});

test('the same seed deals the same routes, a different one does not', () => {
  const shape = (seed) => {
    const s = createGame({seed, now: 0});
    return `${s.route.source}>${s.route.pieces.map((p) => `${p.shape.left}${p.shape.right}:${p.turn}`).join(',')}>${s.route.target}`;
  };
  assert.equal(shape(21), shape(21));
  assert.notEqual(shape(21), shape(22));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {routes: 5, turns: 34};
  assert.match(summarise(s, 'en'), /5 routes connected · 34 turns/);
  assert.match(summarise(s, 'nl'), /5 koppelingen gelegd · 34 keer gedraaid/);
});
