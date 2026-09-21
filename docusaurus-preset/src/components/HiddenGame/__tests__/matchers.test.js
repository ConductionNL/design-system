/**
 * matchers.test.js — how a hidden game gets found.
 *
 * These are the only thing standing between a game nobody can reach
 * and a game that opens by accident, so both halves are pinned: the
 * intended input opens it, and the near misses do not.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createSequenceMatcher, createWordMatcher, createClickCounter,
  createHoldTimer, createSelectionWatcher, KONAMI,
} = require('../matchers.js');

/** Feed a list of keys, returning how many times it fired. */
function feed(matcher, keys) {
  return keys.reduce((hits, k) => hits + (matcher.push(k) ? 1 : 0), 0);
}

test('the Konami code opens it, once', () => {
  const m = createSequenceMatcher(KONAMI);
  assert.equal(feed(m, KONAMI), 1);
  assert.equal(m.progress, 0, 'the sequence did not reset after firing');
});

test('a wrong key resets the sequence, but a repeat of the first key restarts it', () => {
  const m = createSequenceMatcher(['ArrowUp', 'ArrowDown', 'b']);
  assert.equal(feed(m, ['ArrowUp', 'x', 'ArrowDown', 'b']), 0, 'a wrong key did not break the run');

  /* "up up down b" has to work: the second up is a fresh start, not a
     failure, or nobody ever lands a sequence that repeats a key. */
  m.reset();
  assert.equal(feed(m, ['ArrowUp', 'ArrowUp', 'ArrowDown', 'b']), 1);
});

test('the sequence ignores case, the way the Konami b and a are typed', () => {
  const m = createSequenceMatcher(KONAMI);
  const shouted = KONAMI.map((k) => (k.length === 1 ? k.toUpperCase() : k));
  assert.equal(feed(m, shouted), 1);
});

test('a typed word opens it, even when the typing was messy before it', () => {
  const m = createWordMatcher('build');
  assert.equal(feed(m, 'buil'.split('')), 0);
  assert.equal(feed(m, 'd'.split('')), 1);

  m.reset();
  assert.equal(feed(m, 'bbuild'.split('')), 1, 'a stutter before the word broke it');
  m.reset();
  assert.equal(feed(m, 'xxbuild'.split('')), 1, 'typing near it first broke it');
});

test('a typed word ignores keys that are not characters', () => {
  const m = createWordMatcher('d20');
  assert.equal(feed(m, ['d', 'Shift', '2', 'ArrowLeft', '0']), 1);
});

test('a word that is only half typed stays shut', () => {
  const m = createWordMatcher('hunter2');
  assert.equal(feed(m, 'hunter'.split('')), 0);
  assert.equal(m.buffer, 'hunter');
});

test('several spellings all open it, spaces and all', () => {
  const words = ['nat20', 'natural20', 'nat 20', 'natural 20'];
  for (const typed of words) {
    const m = createWordMatcher(words);
    assert.equal(feed(m, typed.split('')), 1, `"${typed}" did not open it`);
  }

  /* And a near miss still does not. */
  const m = createWordMatcher(words);
  assert.equal(feed(m, 'natural2'.split('')), 0);
});

test('a short spelling swallows every longer one ending in it', () => {
  /* Worth pinning because it is surprising: the buffer is as long as
     the longest word and fires on any suffix, so "20" matches part
     way through "nat20" and the longer spellings never get their own
     turn. Harmless here — same game either way — but it means a
     two-character word opens on anything ending in those two. */
  const m = createWordMatcher(['20', 'nat20', 'natural20']);
  assert.equal(feed(m, 'nat20'.split('')), 1, 'it fired more than once for one word');
  m.reset();
  assert.equal(feed(m, '2024'.split('')), 1, '"20" no longer fires inside a longer number');
});

test('a word list with nothing usable in it never fires', () => {
  const m = createWordMatcher(['', null, undefined]);
  assert.equal(feed(m, 'anything at all'.split('')), 0);
});

test('three clicks in a row open it; three clicks spread out do not', () => {
  const quick = createClickCounter({count: 3, windowMs: 1500});
  assert.equal(quick.push(0), false);
  assert.equal(quick.push(300), false);
  assert.equal(quick.push(600), true);

  const slow = createClickCounter({count: 3, windowMs: 1500});
  assert.equal(slow.push(0), false);
  assert.equal(slow.push(5000), false);
  assert.equal(slow.push(10000), false, 'clicks a whole visit apart were counted together');
});

test('the click window slides rather than resetting, so a fourth click still lands', () => {
  const c = createClickCounter({count: 3, windowMs: 1000});
  assert.equal(c.push(0), false);
  assert.equal(c.push(1800), false, 'the first click should have aged out');
  assert.equal(c.push(2000), false);
  assert.equal(c.push(2400), true);
});

test('a hold has to last, and a cancelled hold counts for nothing', () => {
  const h = createHoldTimer({holdMs: 1200});
  h.start(0);
  assert.equal(h.check(900), false);
  assert.equal(h.check(1300), true);

  h.start(2000);
  h.cancel();
  assert.equal(h.check(9000), false, 'a hold that left the element still opened it');
  assert.equal(h.holding, false);
});

test('a selection has to settle before it counts', () => {
  const s = createSelectionWatcher({minLength: 10, settleMs: 900});
  assert.equal(s.push('a permit application', 0), false, 'fired on the first frame of a drag');
  assert.equal(s.push('a permit application', 500), false);
  assert.equal(s.push('a permit application', 1000), true);
});

test('a growing selection keeps restarting the clock, and a short one never starts it', () => {
  const s = createSelectionWatcher({minLength: 10, settleMs: 900});
  s.push('a permit app', 0);
  s.push('a permit application', 800);
  assert.equal(s.push('a permit application', 1200), false, 'the clock did not restart when the drag grew');
  assert.equal(s.push('a permit application', 1800), true);

  s.reset();
  assert.equal(s.push('short', 0), false);
  assert.equal(s.push('short', 5000), false, 'a tiny selection opened it');
});
