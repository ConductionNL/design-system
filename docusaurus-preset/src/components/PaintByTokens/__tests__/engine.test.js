/**
 * engine.test.js — the paint-by-tokens rules.
 *
 * The property that matters most is the dullest: every picture must be
 * exactly ROWS × COLS cells of tokens that exist. A picture with a
 * short row or a stray digit renders as a hole in the grid and a cell
 * nobody can ever fill, which ends the run through no fault of the
 * player.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, paint, select, step, timeLeft, remaining, summarise,
  TOKENS, PICTURES, COLS, ROWS, DEFAULTS,
} = require('../engine.js');

/** Fill the current picture correctly, selecting each token as needed. */
function finishPicture(state, now = 0) {
  let s = state;
  for (let i = 0; i < s.cells.length; i++) {
    if (s.cells[i].painted) continue;
    s = select(s, s.cells[i].token);
    s = paint(s, i, now);
    if (s.over) break;
    /* The picture is replaced the moment it is finished, so stop
       walking this one as soon as the cell count resets. */
    if (remaining(s) === COLS * ROWS) break;
  }
  return s;
}

test('every picture is a full grid of tokens that exist', () => {
  for (const picture of PICTURES) {
    assert.equal(picture.rows.length, ROWS, `${picture.name}: wrong number of rows`);
    for (const row of picture.rows) {
      assert.equal(row.length, COLS, `${picture.name}: a row is not ${COLS} cells`);
      for (const ch of row) {
        const token = Number(ch);
        assert.ok(Number.isInteger(token), `${picture.name}: "${ch}" is not a token`);
        assert.ok(token >= 0 && token < TOKENS.length, `${picture.name}: token ${token} does not exist`);
      }
    }
  }
});

test('a game starts with a full picture, a clock and nothing painted', () => {
  const s = createGame({seed: 1, now: 0});
  assert.equal(s.cells.length, COLS * ROWS);
  assert.equal(remaining(s), COLS * ROWS);
  assert.equal(timeLeft(s, 0), DEFAULTS.startMs);
  assert.equal(s.over, false);
});

test('painting a cell with the token it asks for fills it and scores', () => {
  let s = createGame({seed: 2, now: 0});
  s = select(s, s.cells[0].token);
  s = paint(s, 0, 10);
  assert.equal(s.cells[0].painted, true);
  assert.equal(s.score, DEFAULTS.pointsPerCell);
  assert.equal(s.last.result, 'painted');
});

test('the wrong token costs time, leaves the cell empty, and says what was wanted', () => {
  let s = createGame({seed: 3, now: 0});
  const wanted = s.cells[0].token;
  const wrong = (wanted + 1) % TOKENS.length;
  const deadline = s.endsAt;
  s = select(s, wrong);
  s = paint(s, 0, 20);
  assert.equal(s.cells[0].painted, false);
  assert.equal(s.endsAt, deadline - DEFAULTS.penaltyMs);
  assert.equal(s.wrong, 1);
  assert.equal(s.last.wanted, wanted);
  assert.equal(s.last.used, wrong);
});

test('painting over a finished cell is a slip, not a mistake', () => {
  let s = createGame({seed: 4, now: 0});
  s = select(s, s.cells[0].token);
  s = paint(s, 0, 10);
  const deadline = s.endsAt;
  const score = s.score;
  s = paint(s, 0, 20);
  assert.equal(s.endsAt, deadline, 'a second click on a filled cell cost time');
  assert.equal(s.score, score, 'a second click on a filled cell scored again');
});

test('an unknown token cannot be selected, and an unknown cell cannot be painted', () => {
  const s = createGame({seed: 5, now: 0});
  assert.equal(select(s, 99).selected, s.selected);
  assert.equal(select(s, -1).selected, s.selected);
  assert.equal(paint(s, 9999, 10), s);
});

test('finishing a picture scores, buys time and deals the next one', () => {
  let s = createGame({seed: 6, now: 0});
  const first = s.picture;
  const deadline = s.endsAt;
  s = finishPicture(s, 0);
  assert.equal(s.finished, 1);
  assert.ok(s.score >= DEFAULTS.pointsPerPicture);
  assert.ok(s.endsAt > deadline, 'finishing a picture bought no time');
  assert.equal(remaining(s), COLS * ROWS, 'the next picture started part-painted');
  assert.notEqual(s.picture, first, 'the same picture was dealt twice in a row');
});

test('every picture in the rotation can actually be finished', () => {
  let s = createGame({seed: 7, now: 0});
  const seen = new Set();
  for (let i = 0; i < PICTURES.length + 1; i++) {
    seen.add(s.picture);
    s = finishPicture(s, 0);
    assert.equal(s.over, false, `run ended while finishing picture ${i}`);
  }
  assert.equal(seen.size, PICTURES.length, 'the rotation does not reach every picture');
  assert.equal(s.finished, PICTURES.length + 1);
});

test('the clock ends the run, and nothing paints afterwards', () => {
  let s = createGame({seed: 8, now: 0});
  s = step(s, DEFAULTS.startMs + 1);
  assert.equal(s.over, true);
  const frozen = paint(select(s, s.cells[0].token), 0, DEFAULTS.startMs + 5);
  assert.equal(frozen.score, s.score);
});

test('a penalty that empties the clock ends the run there and then', () => {
  let s = createGame({seed: 9, now: 0, config: {startMs: 2000}});
  const wrong = (s.cells[0].token + 1) % TOKENS.length;
  s = paint(select(s, wrong), 0, 100);
  assert.equal(s.over, true);
  assert.equal(timeLeft(s, 100), 0);
});

test('the same seed opens on the same picture, a different one need not', () => {
  const first = (seed) => createGame({seed, now: 0}).picture;
  assert.equal(first(21), first(21));
  const spread = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(first));
  assert.ok(spread.size > 1, 'every seed opens on the same picture');
});

test('the summary reads as a sentence in both locales', () => {
  const s = {finished: 3, wrong: 2};
  assert.match(summarise(s, 'en'), /3 themes finished · 2 wrong fills/);
  assert.match(summarise(s, 'nl'), /3 thema's af · 2 keer misgetikt/);
});
