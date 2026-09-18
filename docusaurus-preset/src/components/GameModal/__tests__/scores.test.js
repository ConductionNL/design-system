/**
 * scores.test.js — the mini-game score table.
 *
 * The migration case is the one that matters: every earlier build
 * wrote a flat `{id: true}` map, and a returning player whose
 * found-games progress silently reset to zero would read that as a
 * bug in the games, not in the storage format.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  migrate, recordResult, bestFor, foundCount, totalScore, readScores, writeScores,
  STORAGE_KEY, STORAGE_VERSION,
} = require('../scores.js');

function fakeStorage(initial) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_k, v) => { value = v; },
    read: () => value,
  };
}

test('migrates the version 1 flat map, keeping discovered games', () => {
  const state = migrate({hexrain: true, boats: true, invaders: false});
  assert.equal(state.version, STORAGE_VERSION);
  assert.equal(foundCount(state), 2);
  assert.deepEqual(state.games.hexrain, {found: true, best: null, plays: 0});
  assert.equal(state.games.invaders, undefined, 'a false entry is not a found game');
});

test('reads the current shape back unchanged', () => {
  const stored = {version: 2, games: {boats: {found: true, best: 18, plays: 3}}};
  assert.deepEqual(migrate(stored).games.boats, {found: true, best: 18, plays: 3});
});

test('survives junk in user-writable storage', () => {
  for (const junk of [null, undefined, 42, 'nope', [], {version: 2, games: null}, {version: 2, games: {a: 7}}]) {
    const state = migrate(junk);
    assert.equal(state.version, STORAGE_VERSION);
    assert.equal(typeof state.games, 'object');
  }
  assert.equal(foundCount(migrate({version: 2, games: {a: {found: true, best: 'ten'}}})), 1);
  assert.equal(bestFor(migrate({version: 2, games: {a: {found: true, best: 'ten'}}}), 'a'), null);
});

test('records a result, keeps the better score, and counts the play', () => {
  let state = migrate(null);
  state = recordResult(state, {id: 'boats', score: 12});
  assert.equal(bestFor(state, 'boats'), 12);

  state = recordResult(state, {id: 'boats', score: 18});
  assert.equal(bestFor(state, 'boats'), 18);

  state = recordResult(state, {id: 'boats', score: 3});
  assert.equal(bestFor(state, 'boats'), 18, 'a worse run overwrote the best');
  assert.equal(state.games.boats.plays, 3);
});

test('a game that reports no score still counts as found', () => {
  const state = recordResult(migrate(null), {id: 'kade-cyclist'});
  assert.equal(state.games['kade-cyclist'].found, true);
  assert.equal(bestFor(state, 'kade-cyclist'), null);
});

test('recordResult does not mutate the state it was given', () => {
  const before = migrate({version: 2, games: {boats: {found: true, best: 5, plays: 1}}});
  const snapshot = JSON.stringify(before);
  recordResult(before, {id: 'boats', score: 99});
  assert.equal(JSON.stringify(before), snapshot);
});

test('the total is the sum of the bests, ignoring games without one', () => {
  let state = migrate(null);
  state = recordResult(state, {id: 'boats', score: 18});
  state = recordResult(state, {id: 'invaders', score: 3400});
  state = recordResult(state, {id: 'kade-cyclist'});
  assert.equal(totalScore(state), 3418);
});

test('an empty table totals zero rather than NaN', () => {
  assert.equal(totalScore(migrate(null)), 0);
});

test('round-trips through storage under the documented key', () => {
  const store = fakeStorage(null);
  const state = recordResult(migrate(null), {id: 'boats', score: 7});
  writeScores(state, store);
  assert.match(store.read(), /"version":2/);
  assert.equal(bestFor(readScores(store), 'boats'), 7);
  assert.equal(STORAGE_KEY, 'conduction:minigames');
});

test('a throwing storage never takes the game-over dialog down with it', () => {
  const hostile = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.equal(foundCount(readScores(hostile)), 0);
  assert.doesNotThrow(() => writeScores(migrate(null), hostile));
});
