/**
 * handoff.test.js — the note the roster leaves for a game's page.
 *
 * The property that matters: it is good for exactly one arrival. The
 * behaviour it replaced was a localStorage record that opened the game
 * on every later visit, which is what made a product page stop being
 * one. A note that could be taken twice would bring that straight
 * back, one route change later.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {requestOpen, takeOpen, clearPending} = require('../handoff.js');

test.beforeEach(() => clearPending());

test('nothing is pending until something is asked for', () => {
  assert.equal(takeOpen('monster-run'), false);
});

test('the game that was asked for is told once, and only once', () => {
  requestOpen('monster-run');
  assert.equal(takeOpen('monster-run'), true);
  assert.equal(takeOpen('monster-run'), false, 'the note survived being taken');
});

test('a note is for one game, not for whoever mounts first', () => {
  requestOpen('monster-run');
  assert.equal(takeOpen('stamp-rush'), false, 'another game answered to it');
  assert.equal(takeOpen('monster-run'), true, 'and it was gone by the time the right one asked');
});

test('asking again replaces the note rather than queueing it', () => {
  requestOpen('monster-run');
  requestOpen('stamp-rush');
  assert.equal(takeOpen('monster-run'), false);
  assert.equal(takeOpen('stamp-rush'), true);
});

test('an uncollected note does not spring on a game with no id', () => {
  requestOpen('monster-run');
  assert.equal(takeOpen(undefined), false);
  assert.equal(takeOpen(''), false);
  assert.equal(takeOpen(null), false);
});

test('requesting nothing clears the note instead of arming an empty one', () => {
  requestOpen('monster-run');
  requestOpen(undefined);
  assert.equal(takeOpen('monster-run'), false);
});
