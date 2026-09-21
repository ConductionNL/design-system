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
  createGame, paint, select, step, timeLeft, remaining, summarise, bonusFor,
  TOKENS, PICTURES, MARK, COLS, ROWS, DEFAULTS,
} = require('../engine.js');

/**
 * Let go of a finished picture: it is held up to be looked at, and
 * only the clock puts the next one on.
 */
function release(state) {
  return state.cleared ? step(state, state.cleared.until) : state;
}

/**
 * Fill the current picture correctly, selecting each token as needed.
 * Returns the run still holding the finished picture, which is where
 * the engine leaves it; `release` moves on to the next.
 */
function finishPicture(state, now = 0) {
  /* Nothing paints while the picture before it is still up. */
  let s = release(state);
  for (let i = 0; i < s.cells.length; i++) {
    if (s.cells[i].painted) continue;
    s = select(s, s.cells[i].token);
    s = paint(s, i, now);
    if (s.over || s.cleared) break;
  }
  return s;
}

test('every picture is a full grid of tokens that exist', () => {
  for (const picture of [...PICTURES, MARK]) {
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

test('finishing a picture scores, buys time, is held up, then the next one comes', () => {
  let s = createGame({seed: 6, now: 0});
  const first = s.picture;
  const deadline = s.endsAt;

  s = finishPicture(s, 0);
  assert.equal(s.finished, 1);
  assert.ok(s.score >= DEFAULTS.pointsPerPicture);
  assert.ok(s.endsAt > deadline, 'finishing a picture bought no time');
  assert.ok(s.cleared, 'the finished picture was not held up');
  assert.equal(remaining(s), 0, 'the finished picture was taken away before it could be seen');
  assert.equal(s.picture, first, 'the next picture arrived on top of the finished one');

  /* Still held a tick before the beat is up. */
  assert.equal(step(s, s.cleared.until - 1), s);

  const next = step(s, s.cleared.until);
  assert.equal(next.cleared, null);
  assert.equal(remaining(next), COLS * ROWS, 'the next picture started part-painted');
  assert.notEqual(next.picture, first, 'the same picture was dealt twice in a row');
});

test('nothing paints while a picture is held up', () => {
  let s = createGame({seed: 6, now: 0});
  s = finishPicture(s, 0);
  const picked = select(s, 0);
  assert.equal(paint(picked, 0, s.cleared.at + 1), picked, 'a held picture could still be painted on');
});

test('the beat is free: a held picture neither times out nor spends the clock', () => {
  /* A hold deliberately longer than the clock it is holding, which is
     the only way to catch the pause charging for itself. */
  let s = createGame({seed: 6, now: 0, config: {startMs: 2000, bonusMs: 0, clearedHoldMs: 5000}});
  s = finishPicture(s, 0);
  const owed = timeLeft(s, 0);

  /* Past the deadline, still inside the beat: the run is alive. */
  const held = step(s, 3000);
  assert.equal(held.over, false, 'the run ended while a finished picture was on screen');
  assert.equal(timeLeft(held, 3000), owed, 'the clock ran on under the beat');

  /* And it comes back out with exactly what it went in with. */
  const next = step(s, 5000);
  assert.equal(next.over, false);
  assert.equal(timeLeft(next, 5000), owed, 'the beat spent the time it was meant to give');
});

test('every picture in the rotation can actually be finished', () => {
  /* The mark is switched off here so this stays a test of the
     rotation; it gets its own below. The opener is still the mark, so
     it is finished first and then the rotation is walked. */
  let s = release(finishPicture(createGame({seed: 7, now: 0, config: {markChance: 0}}), 0));

  const seen = new Set();
  for (let i = 0; i < PICTURES.length; i++) {
    seen.add(s.picture);
    s = release(finishPicture(s, 0));
    assert.equal(s.over, false, `run ended while finishing picture ${i}`);
  }
  assert.equal(seen.size, PICTURES.length, 'the rotation does not reach every picture');
  assert.equal(s.finished, PICTURES.length + 1);
});

test('every run opens on the house mark', () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    assert.equal(createGame({seed, now: 0}).picture, MARK.name, `seed ${seed} opened on something else`);
  }
});

test('the mark can be finished, and hands back to the rotation where it left off', () => {
  /* markChance 1 so the roll is not what is under test: the guard is. */
  let s = createGame({seed: 11, now: 0, config: {markChance: 1}});
  const cursor = s.pictureIndex;

  s = release(finishPicture(s, 0));
  assert.equal(s.over, false, 'the mark could not be finished');
  assert.notEqual(s.picture, MARK.name, 'the mark followed itself');
  assert.equal(s.pictureIndex, cursor + 1, 'the rotation did not move on after the mark');

  /* And with the guard clear, it comes round again. */
  s = release(finishPicture(s, 0));
  assert.equal(s.picture, MARK.name, 'the mark never came back');
  assert.equal(s.pictureIndex, cursor + 1, 'the mark ate a place in the rotation');
});

test('the mark stays out of the rotation when it is switched off', () => {
  let s = release(finishPicture(createGame({seed: 12, now: 0, config: {markChance: 0}}), 0));
  for (let i = 0; i < 12; i++) {
    assert.notEqual(s.picture, MARK.name, `the mark turned up on picture ${i} at zero chance`);
    s = release(finishPicture(s, 0));
  }
});

test('the bonus shrinks with every picture, down to a floor', () => {
  const s = createGame({seed: 20, now: 0});
  assert.equal(bonusFor(s), DEFAULTS.bonusMs, 'the first picture did not pay the full bonus');
  assert.equal(bonusFor({...s, finished: 1}), DEFAULTS.bonusMs - DEFAULTS.bonusRampMs);
  assert.ok(bonusFor({...s, finished: 5}) < bonusFor({...s, finished: 4}), 'the bonus stopped shrinking');
  assert.equal(bonusFor({...s, finished: 9000}), DEFAULTS.bonusFloorMs, 'the bonus fell through its floor');
});

test('each finish pays less than the one before, and says what it paid', () => {
  let s = createGame({seed: 21, now: 0});
  const paid = [];
  for (let i = 0; i < 4; i++) {
    /* Measured out of the beat: releasing a hold also hands back the
       time the beat took, which would otherwise read as bonus. */
    s = release(s);
    const before = s.endsAt;
    s = finishPicture(s, 0);
    paid.push({reported: s.last.bonusMs, added: s.endsAt - before});
  }

  assert.equal(paid[0].reported, DEFAULTS.bonusMs, 'the first picture did not pay the full bonus');
  for (const p of paid) assert.equal(p.added, p.reported, 'the clock got something other than the bonus reported');
  for (let i = 1; i < paid.length; i++) {
    assert.equal(paid[i].reported, paid[i - 1].reported - DEFAULTS.bonusRampMs, `finish ${i} did not shrink`);
  }
});

/**
 * Play a whole run at a fixed pace, and say how far it got.
 *
 * `msPerPicture` is the time the painting itself takes. The beat
 * after a finish is free, so it only moves the clock forward.
 */
function playAt(msPerPicture, seed = 22) {
  let s = createGame({seed, now: 0});
  let t = 0;
  let pictures = 0;

  while (pictures < 1000) {
    t += msPerPicture;
    s = step(s, t);
    if (s.over) break;
    s = finishPicture(s, t);
    if (s.over) break;
    pictures++;
    t = s.cleared.until;
    s = step(s, t);
  }
  return {over: s.over, pictures};
}

test('the run ends at any pace a person can actually paint at', () => {
  /* What the ramp is for. The bonus floor is 4s for a 56-cell
     picture — 0.07s a cell — so every pace a human can reach loses
     ground in the end, and the run has a bottom.

     A run that painted in literally no time would still never end,
     which is why the floor is the thing to tune, not the ramp. */
  const quick = playAt(12000);
  assert.equal(quick.over, true, 'a fast run never ended');
  assert.ok(quick.pictures > 8, `a fast run ended after only ${quick.pictures} pictures`);

  const steady = playAt(20000);
  assert.equal(steady.over, true, 'a steady run never ended');
  assert.ok(steady.pictures < quick.pictures, 'painting faster bought no more pictures than painting slowly');
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

test('the same seed plays the same run, a different one need not', () => {
  /* Every run opens on the mark now, so the variety the seed buys
     shows up in what follows it rather than in the first board. */
  const second = (seed) => release(finishPicture(createGame({seed, now: 0, config: {markChance: 0}}), 0)).picture;
  assert.equal(second(21), second(21));
  const spread = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(second));
  assert.ok(spread.size > 1, 'every seed plays the same rotation');
});

test('the summary reads as a sentence in both locales', () => {
  const s = {finished: 3, wrong: 2};
  assert.match(summarise(s, 'en'), /3 themes finished · 2 wrong fills/);
  assert.match(summarise(s, 'nl'), /3 thema's af · 2 keer misgetikt/);
});
