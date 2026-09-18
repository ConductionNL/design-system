/**
 * engine.test.js — the record-run rules.
 *
 * The rule that has to hold on every board: a row never blocks more
 * than one lane. Two blocks in one row can strand a record that was
 * already committed to a lane, and a death the player could not have
 * avoided is the fastest way to make an arcade game feel rigged.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, step, move, moveTo, stepMs, summarise,
  LANES, CLEAR, BLOCK, APP, BLOCKS, APPS, DEFAULTS,
} = require('../engine.js');

/** Force the row the record is about to meet. */
function withArriving(state, cells) {
  const rows = [...state.rows];
  rows[rows.length - 1] = {cells, id: 'forced'};
  return {...state, rows};
}
const clearRow = () => Array.from({length: LANES}, () => ({kind: CLEAR}));

test('a new game starts centred, alive, and with a full board', () => {
  const s = createGame({seed: 1, now: 0});
  assert.equal(s.lane, 1);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.rows.length, DEFAULTS.rows);
  assert.equal(s.over, false);
});

test('no row ever blocks more than one lane', () => {
  /* Fifty seeds, a hundred rows each: a generator bug shows up as one
     bad row in thousands, not as every row. */
  for (let seed = 1; seed <= 50; seed++) {
    let s = createGame({seed, now: 0});
    let t = 0;
    for (let i = 0; i < 100; i++) {
      for (const row of s.rows) {
        const blocks = row.cells.filter((c) => c.kind === BLOCK).length;
        assert.ok(blocks <= 1, `seed ${seed}: a row blocked ${blocks} lanes`);
      }
      t += stepMs(s);
      /* Stay on a lane that is clear, so the run does not end early. */
      const arriving = s.rows[s.rows.length - 1];
      const safe = arriving.cells.findIndex((c) => c.kind !== BLOCK);
      s = step(moveTo(s, safe), t);
      if (s.over) break;
    }
  }
});

test('every cell the generator produces is one of the kinds the board knows', () => {
  let s = createGame({seed: 7, now: 0});
  let t = 0;
  for (let i = 0; i < 200; i++) {
    for (const row of s.rows) {
      for (const cell of row.cells) {
        assert.ok([CLEAR, BLOCK, APP].includes(cell.kind), `unknown cell ${cell.kind}`);
        if (cell.kind === BLOCK) assert.ok(BLOCKS.includes(cell.what));
        if (cell.kind === APP) assert.ok(APPS.includes(cell.what));
      }
    }
    t += stepMs(s);
    const safe = s.rows[s.rows.length - 1].cells.findIndex((c) => c.kind !== BLOCK);
    s = step(moveTo(s, safe), t);
    if (s.over) break;
  }
});

test('the record moves between lanes, and the edges hold', () => {
  const s = createGame({seed: 2, now: 0});
  assert.equal(move(s, -1).lane, 0);
  assert.equal(move(move(s, -1), -1).lane, 0, 'the record walked off the left edge');
  assert.equal(move(s, 1).lane, 2);
  assert.equal(move(move(s, 1), 1).lane, 2, 'the record walked off the right edge');
  assert.equal(moveTo(s, 2).lane, 2);
  assert.equal(moveTo(s, 9).lane, s.lane, 'a lane that does not exist was accepted');
});

test('nothing happens until the step is due', () => {
  const s = createGame({seed: 3, now: 0});
  const early = step(s, s.nextStepAt - 1);
  assert.equal(early.travelled, 0);
  assert.equal(early.score, 0);
  const due = step(s, s.nextStepAt);
  assert.equal(due.travelled, 1);
});

test('an open lane pays a little, and keeps the board full', () => {
  let s = createGame({seed: 4, now: 0});
  s = withArriving(s, clearRow());
  const after = step(s, s.nextStepAt);
  assert.equal(after.score, DEFAULTS.pointsPerRow);
  assert.equal(after.lives, DEFAULTS.lives);
  assert.equal(after.rows.length, DEFAULTS.rows, 'the board ran out of rows');
});

test('an app in the lane is picked up and pays properly', () => {
  let s = createGame({seed: 5, now: 0});
  const cells = clearRow();
  cells[s.lane] = {kind: APP, what: 'register'};
  s = step(withArriving(s, cells), s.nextStepAt);
  assert.equal(s.score, DEFAULTS.pointsPerApp);
  assert.equal(s.collected, 1);
  assert.equal(s.last.result, 'collected');
});

test('a block in the lane costs a life and says what stopped it', () => {
  let s = createGame({seed: 6, now: 0});
  const cells = clearRow();
  cells[s.lane] = {kind: BLOCK, what: 'permission'};
  s = step(withArriving(s, cells), s.nextStepAt);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.blocked, 1);
  assert.equal(s.last.result, 'blocked');
  assert.equal(s.last.what, 'permission');
});

test('a block in another lane is not the record problem', () => {
  let s = createGame({seed: 6, now: 0});
  const cells = clearRow();
  cells[(s.lane + 1) % LANES] = {kind: BLOCK, what: 'format'};
  s = step(withArriving(s, cells), s.nextStepAt);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.score, DEFAULTS.pointsPerRow);
});

test('three blocks end the run, and nothing moves afterwards', () => {
  let s = createGame({seed: 8, now: 0});
  let t = 0;
  for (let i = 0; i < 3; i++) {
    const cells = clearRow();
    cells[s.lane] = {kind: BLOCK, what: 'connector'};
    t = s.nextStepAt;
    s = step(withArriving(s, cells), t);
  }
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);
  assert.equal(step(s, t + 10000).travelled, s.travelled);
  assert.equal(move(s, 1).lane, s.lane, 'the record still steered after game over');
});

test('the board speeds up with the score, down to a floor a person can react in', () => {
  const fresh = createGame({seed: 9, now: 0});
  assert.equal(stepMs(fresh), DEFAULTS.stepStartMs);
  assert.ok(stepMs({...fresh, score: 100}) < DEFAULTS.stepStartMs);
  assert.equal(stepMs({...fresh, score: 10000}), DEFAULTS.stepFloorMs);
});

test('a player who always takes a clear lane survives a long run', () => {
  let s = createGame({seed: 11, now: 0});
  let t = 0;
  for (let i = 0; i < 300; i++) {
    const arriving = s.rows[s.rows.length - 1];
    const safe = arriving.cells.findIndex((c) => c.kind !== BLOCK);
    assert.ok(safe >= 0, 'a row left the record nowhere to go');
    t = s.nextStepAt;
    s = step(moveTo(s, safe), t);
  }
  assert.equal(s.over, false);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.ok(s.score > 0);
});

test('the same seed runs the same board, a different one does not', () => {
  const shape = (seed) => {
    let s = createGame({seed, now: 0});
    let t = 0;
    const out = [];
    for (let i = 0; i < 10; i++) {
      out.push(s.rows.map((r) => r.cells.map((c) => c.kind[0]).join('')).join('|'));
      t = s.nextStepAt;
      const safe = s.rows[s.rows.length - 1].cells.findIndex((c) => c.kind !== BLOCK);
      s = step(moveTo(s, safe), t);
    }
    return out.join('//');
  };
  assert.equal(shape(31), shape(31));
  assert.notEqual(shape(31), shape(32));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {travelled: 42, collected: 7};
  assert.match(summarise(s, 'en'), /42 hops · 7 apps picked up/);
  assert.match(summarise(s, 'nl'), /42 stappen · 7 apps onderweg/);
});
