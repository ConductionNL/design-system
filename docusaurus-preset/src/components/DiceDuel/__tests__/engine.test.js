/**
 * engine.test.js — the dice-duel rules.
 *
 * The decision is the game: a swing is safe and small, a reroll is the
 * only road to a big hit and the only way to be hurt. Both halves are
 * pinned here, because a version where rerolling is free has no
 * decision in it, and a version where swinging can hurt you has no
 * safe move at all.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, strike, reroll, toggleKeep, damageOf, summarise,
  DICE, FACES, MONSTERS, DEFAULTS,
} = require('../engine.js');

/** Put known dice on the table. */
function withDice(state, dice) {
  return {...state, dice, kept: dice.map(() => false)};
}

test('a duel opens with a monster, a handful of dice and rerolls in hand', () => {
  const s = createGame({seed: 1});
  assert.equal(s.dice.length, DICE);
  assert.ok(s.dice.every((d) => d >= 1 && d <= FACES), 'a die landed off its own faces');
  assert.equal(s.hearts, DEFAULTS.hearts);
  assert.equal(s.rerollsLeft, DEFAULTS.rerollsPerRound);
  assert.equal(s.monster.hp, MONSTERS[0].hp);
});

test('damage is the pips, and a six is worth more than six', () => {
  assert.equal(damageOf([1, 2, 3, 4]), 10);
  assert.equal(damageOf([6, 1, 1, 1]), 9 + DEFAULTS.critBonus);
  assert.equal(damageOf([6, 6, 6, 6]), 24 + 4 * DEFAULTS.critBonus);
});

test('a swing always lands, and the wound stays on the monster', () => {
  let s = createGame({seed: 2});
  s = withDice(s, [2, 2, 2, 2]);
  const before = s.monster.hp;
  s = strike(s);
  assert.equal(s.monster.hp, before - 8);
  assert.equal(s.hearts, DEFAULTS.hearts, 'swinging cost a heart');
  assert.equal(s.last.result, 'hit');
  assert.equal(s.rerollsLeft, DEFAULTS.rerollsPerRound, 'the new round started without rerolls');
});

test('enough damage fells the monster and brings the next one', () => {
  let s = createGame({seed: 3});
  s = withDice(s, [6, 6, 6, 6]);
  const first = s.monster.key;
  s = strike(s);
  assert.equal(s.felled, 1);
  assert.ok(s.score >= DEFAULTS.pointsPerKill);
  assert.notEqual(s.monster.key, first, 'the same monster came back');
  assert.equal(s.monster.hp, s.monster.maxHp, 'the next monster arrived already wounded');
});

test('the monsters get harder as they come', () => {
  const hp = MONSTERS.map((m) => m.hp);
  assert.deepEqual(hp, [...hp].sort((a, b) => a - b), 'the queue is not in rising order');
  assert.ok(MONSTERS.length >= 3);
});

test('a reroll that improves the hand costs nothing but the reroll', () => {
  let s = createGame({seed: 4});
  s = withDice(s, [1, 1, 1, 1]);
  const before = s.hearts;
  s = reroll(s);
  assert.equal(s.rerollsLeft, DEFAULTS.rerollsPerRound - 1);
  /* From four ones, no roll can be worse, so this can only go up. */
  assert.equal(s.hearts, before, 'an improving reroll cost a heart');
  assert.equal(s.last.result, 'rerollUp');
});

test('a reroll that lands worse is what the monster punishes', () => {
  /* Start from the best hand there is: every reroll is worse. */
  let s = createGame({seed: 5});
  s = withDice(s, [6, 6, 6, 6]);
  s = reroll(s);
  assert.equal(s.hearts, DEFAULTS.hearts - 1);
  assert.equal(s.last.result, 'bitten');
  assert.ok(s.last.to < s.last.from);
});

test('held dice are not rerolled', () => {
  let s = createGame({seed: 6});
  s = withDice(s, [6, 1, 1, 1]);
  s = toggleKeep(s, 0);
  s = reroll(s);
  assert.equal(s.dice[0], 6, 'a held die was thrown again');
});

test('holding everything leaves nothing to reroll, and the reroll is refused', () => {
  let s = createGame({seed: 7});
  s = withDice(s, [3, 3, 3, 3]);
  for (let i = 0; i < DICE; i++) s = toggleKeep(s, i);
  const before = s.rerollsLeft;
  s = reroll(s);
  assert.equal(s.rerollsLeft, before, 'a reroll with nothing to reroll was spent');
});

test('rerolls run out, and a spent reroll cannot be taken again', () => {
  let s = createGame({seed: 8});
  for (let i = 0; i < DEFAULTS.rerollsPerRound; i++) s = reroll(s);
  assert.equal(s.rerollsLeft, 0);
  const spent = s.dice.join(',');
  s = reroll(s);
  assert.equal(s.dice.join(','), spent, 'the dice moved with no rerolls left');
});

test('a bad die that does not exist is ignored', () => {
  const s = createGame({seed: 9});
  assert.equal(toggleKeep(s, 99), s);
  assert.equal(toggleKeep(s, -1), s);
});

test('three bites end the duel, and nothing moves afterwards', () => {
  let s = createGame({seed: 10});
  for (let i = 0; i < DEFAULTS.hearts; i++) {
    s = withDice(s, [6, 6, 6, 6]);
    s = {...s, rerollsLeft: DEFAULTS.rerollsPerRound};
    s = reroll(s);
  }
  assert.equal(s.over, true);
  assert.equal(s.hearts, 0);
  assert.equal(strike(s).score, s.score, 'the duel kept scoring after the last heart');
  assert.equal(reroll(s).dice.join(','), s.dice.join(','));
});

test('a player who never pushes their luck is never hurt', () => {
  /* The whole point of the safe move: it has to stay safe forever. */
  let s = createGame({seed: 11});
  for (let i = 0; i < 60; i++) s = strike(s);
  assert.equal(s.hearts, DEFAULTS.hearts);
  assert.equal(s.over, false);
  assert.ok(s.felled > 0, 'sixty swings felled nothing');
});

test('the same seed rolls the same duel, a different one does not', () => {
  const run = (seed) => {
    let s = createGame({seed});
    const out = [s.dice.join('')];
    for (let i = 0; i < 5; i++) { s = strike(s); out.push(s.dice.join('')); }
    return out.join('|');
  };
  assert.equal(run(21), run(21));
  assert.notEqual(run(21), run(22));
});

test('the summary reads as a sentence in both locales', () => {
  const s = {felled: 3, rounds: 11};
  assert.match(summarise(s, 'en'), /3 monsters felled · 11 rounds/);
  assert.match(summarise(s, 'nl'), /3 monsters geveld · 11 beurten/);
});
