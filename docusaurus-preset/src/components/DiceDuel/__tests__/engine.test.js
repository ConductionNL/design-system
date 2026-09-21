/**
 * engine.test.js — the dice-duel rules.
 *
 * The monster's answer is the only thing in the game that costs
 * health, and it comes after a swing it survived. Three rules hang
 * off that, and all three are pinned below:
 *
 *   - it answers every round it lives through, which is what stops a
 *     patient player being immortal and is the only thing giving the
 *     duel an end;
 *   - it never answers a round that killed it, or a kill would cost
 *     exactly as much as a miss;
 *   - a reroll never draws blood, so pushing your luck cannot end a
 *     run on the spot. A bad push is paid for by the weaker swing it
 *     leaves you with and the extra round that buys the monster.
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

/**
 * The weakest hand in the game, and the weakest one possible.
 *
 * Four distinct low dice: no set bonus and the lowest pips that can
 * avoid one. Anything with a pair in it scores at least eleven, and
 * four of a kind — which reads as feeble — is worth thirty-six. Tests
 * that want a swing to bounce off have to use this one.
 */
const FEEBLE = [1, 2, 3, 4];

test('a duel opens with a monster, a handful of dice and rerolls in hand', () => {
  const s = createGame({seed: 1});
  assert.equal(s.dice.length, DICE);
  assert.ok(s.dice.every((d) => d >= 1 && d <= FACES), 'a die landed off its own faces');
  assert.equal(s.hp, DEFAULTS.heroHp);
  assert.equal(s.maxHp, DEFAULTS.heroHp);
  assert.equal(s.rerollsLeft, DEFAULTS.rerollsPerRound);
  assert.equal(s.monster.hp, MONSTERS[0].hp);
});

test('damage is the pips, plus sixes, plus whatever matches', () => {
  /* Nothing matches: pips only. */
  assert.equal(damageOf([1, 2, 3, 4]), 10);

  /* A six on its own is worth more than six, and the three ones are
     a set of their own. */
  assert.equal(damageOf([6, 1, 1, 1]), 9 + DEFAULTS.critBonus + DEFAULTS.sets[3]);

  /* Four sixes: every bonus in the game at once. */
  assert.equal(damageOf([6, 6, 6, 6]), 24 + 4 * DEFAULTS.critBonus + DEFAULTS.sets[4]);

  /* Only the biggest group counts, so two pair scores as one pair. */
  assert.equal(damageOf([2, 2, 5, 5]), 14 + DEFAULTS.sets[2]);
});

test('matching dice are worth chasing, which is the reason to hold any', () => {
  /* The game only has a decision in it if improving a set beats
     keeping the pips you already have. A pair of twos is worth less
     in pips than a spread of high dice, and has to out-damage it. */
  assert.ok(damageOf([2, 2, 2, 2]) > damageOf([3, 4, 5, 6]), 'four of a kind lost to a spread');
  assert.ok(damageOf([3, 3, 3, 1]) > damageOf([3, 3, 4, 1]), 'a triple lost to a pair with better pips');
  assert.ok(DEFAULTS.sets[3] > DEFAULTS.sets[2] && DEFAULTS.sets[4] > DEFAULTS.sets[3], 'the set bonuses do not rise');
});

test('a swing always lands, and the wound stays on the monster', () => {
  let s = createGame({seed: 2});
  s = withDice(s, FEEBLE);
  const before = s.monster.hp;
  s = strike(s);
  assert.equal(s.monster.hp, before - damageOf(FEEBLE));
  assert.equal(s.last.result, 'hit');
  assert.equal(s.rerollsLeft, DEFAULTS.rerollsPerRound, 'the new round started without rerolls');
});

test('anything still standing at the end of a round swings back', () => {
  let s = createGame({seed: 2});
  /* Ten damage leaves the goblin on its feet, so it gets a turn. */
  s = withDice(s, FEEBLE);
  s = strike(s);
  assert.ok(s.monster.hp > 0, 'the monster died, so this proves nothing');
  assert.ok(s.last.bite > 0, 'a surviving monster did not swing back');
  assert.equal(s.hp, DEFAULTS.heroHp - s.last.bite, 'the bite and the health lost disagree');
  assert.equal(s.hp, s.last.hp);
});

test('a monster felled on the swing never gets its blow in, and the next one does not inherit it', () => {
  let s = createGame({seed: 3});
  s = withDice(s, [6, 6, 6, 6]);
  const before = s.hp;
  s = strike(s);
  assert.equal(s.last.result, 'felled');
  assert.equal(s.hp, before, 'killing it still cost health');
  assert.equal(s.last.bite, undefined, 'a dead monster swung back');
  assert.equal(s.monster.hp, s.monster.maxHp, 'the next monster arrived already wounded');
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
  s = withDice(s, FEEBLE);
  const before = s.hp;
  s = reroll(s);
  assert.equal(s.rerollsLeft, DEFAULTS.rerollsPerRound - 1);
  /* FEEBLE is the lowest-scoring hand there is, so no reroll can
     come back worse and this can only be an improvement. */
  assert.equal(s.hp, before, 'an improving reroll cost health');
  assert.equal(s.last.result, 'rerollUp');
});

test('a reroll that lands worse costs the hand, and nothing else on the spot', () => {
  /* Start from the best hand there is: every reroll is worse. The
     punishment is the weaker swing that follows, not a bite bolted
     onto the throw — a reroll must never be able to end a run. */
  let s = createGame({seed: 5});
  s = withDice(s, [6, 6, 6, 6]);
  const before = s.hp;
  s = reroll(s);
  assert.equal(s.last.result, 'rerollDown');
  assert.ok(s.last.to < s.last.from, 'the hand did not actually get worse');
  assert.equal(s.hp, before, 'a bad reroll took health');
  assert.equal(s.last.bite, undefined, 'something bit on a reroll');
  assert.equal(s.over, false);
});

test('no reroll can ever finish the player off, however badly it goes', () => {
  /* One point of health and the worst possible push, over and over. */
  for (let seed = 1; seed <= 80; seed++) {
    let s = createGame({seed, config: {heroHp: 1}});
    for (let i = 0; i < DEFAULTS.rerollsPerRound; i++) {
      s = withDice(s, [6, 6, 6, 6]);
      s = {...s, rerollsLeft: DEFAULTS.rerollsPerRound};
      s = reroll(s);
    }
    assert.equal(s.hp, 1, `seed ${seed}: pushing cost health`);
    assert.equal(s.over, false, `seed ${seed}: pushing ended the run`);
  }
});

test('no bite is ever bigger than the ceiling, or smaller than one', () => {
  /* Every monster, both ways it can bite, many throws: the lich rolls
     three dice with crits, which clears fifteen often enough that an
     unclamped version fails this on the first handful of seeds. */
  const seen = [];
  for (let i = 0; i < MONSTERS.length; i++) {
    for (let seed = 1; seed <= 150; seed++) {
      let s = createGame({seed});
      s = {...s, monster: {...s.monster, ...MONSTERS[i], maxHp: MONSTERS[i].hp, index: i}};

      /* Its turn, which is the only one it gets. */
      const swung = strike({...s, dice: FEEBLE, kept: [false, false, false, false]});
      if (swung.last.result === 'hit') seen.push(swung.last.bite);
    }
  }

  assert.ok(seen.length > 100, 'not enough bites landed to judge');
  assert.ok(Math.max(...seen) <= DEFAULTS.biteMax, `a bite came to ${Math.max(...seen)}`);
  assert.ok(Math.min(...seen) >= DEFAULTS.biteMin, `a bite came to ${Math.min(...seen)}`);
  assert.equal(Math.max(...seen), DEFAULTS.biteMax, 'nothing ever reached the ceiling, so it is not the ceiling');
});

test('the bite is rolled, not a fixed toll, and a bigger monster bites harder', () => {
  /* The same feeble swing over and over: if the answer were flat,
     every one of these would come to the same number. */
  const bites = (monsterIndex, runs) => {
    const out = [];
    for (let seed = 1; seed <= runs; seed++) {
      let s = createGame({seed});
      s = {...s, monster: {...s.monster, ...MONSTERS[monsterIndex], maxHp: MONSTERS[monsterIndex].hp, index: monsterIndex}};
      s = withDice(s, FEEBLE);
      s = strike(s);
      if (s.last.result === 'hit') out.push(s.last.bite);
    }
    return out;
  };

  const goblin = bites(0, 40);
  const lich = bites(3, 40);
  assert.ok(goblin.length > 10 && lich.length > 10, 'not enough bites landed to judge');
  assert.ok(new Set(goblin).size > 1, 'every goblin bite took exactly the same amount');

  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  assert.ok(mean(lich) > mean(goblin), 'a lich bit no harder than a goblin');
});

test('a bite cannot take you below nothing', () => {
  /* Two points of health against a lich's answer, which is worth
     rather more than two. */
  let s = createGame({seed: 12, config: {heroHp: 2}});
  s = {...s, monster: {...s.monster, ...MONSTERS[3], maxHp: MONSTERS[3].hp, index: 3}};
  s = withDice(s, FEEBLE);
  s = strike(s);
  assert.equal(s.last.result, 'hit');
  assert.equal(s.hp, 0, 'health went past zero');
  assert.equal(s.over, true);
});

test('the dice that moved are the ones that were not held', () => {
  let s = createGame({seed: 13});
  s = withDice(s, [6, 1, 1, 1]);
  s = toggleKeep(s, 0);
  const before = s.rollId;
  s = reroll(s);
  assert.deepEqual(s.tumbled, [false, true, true, true], 'the wrong dice were marked as thrown');
  assert.ok(s.rollId > before, 'the throw did not get its own id');

  /* A fresh round is a fresh throw: everything goes back in the cup. */
  s = strike(s);
  assert.deepEqual(s.tumbled, [true, true, true, true]);
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

test('enough bites end the duel, and nothing moves afterwards', () => {
  /* Feeble swings against a lich: it survives every round and
     answers every round, which is the only way health is ever lost. */
  let s = createGame({seed: 10});
  s = {...s, monster: {...s.monster, ...MONSTERS[3], maxHp: MONSTERS[3].hp, index: 3}};
  let rounds = 0;
  while (!s.over && rounds < 200) {
    s = withDice(s, FEEBLE);
    s = strike(s);
    rounds++;
  }
  assert.equal(s.over, true, 'two hundred rounds did not finish the player off');
  assert.equal(s.hp, 0);
  /* And it took more than the three it used to: a health bar is the
     point of the change, not a heart counter with a new name. */
  assert.ok(rounds > 3, `the duel ended after only ${rounds} rounds`);
  assert.equal(strike(s).score, s.score, 'the duel kept scoring after the last of the health');
  assert.equal(reroll(s).dice.join(','), s.dice.join(','));
});

test('a player who never pushes their luck still runs out', () => {
  /* Swinging used to be free forever, which meant a patient player
     could never lose. Now the monster answers every round it lives
     through, so the safe line is slow rather than endless — and the
     duel has a bottom. */
  let s = createGame({seed: 11});
  let swings = 0;
  while (!s.over && swings < 400) { s = strike(s); swings++; }
  assert.equal(s.over, true, 'four hundred swings and nothing could touch the player');
  assert.equal(s.hp, 0);
  assert.ok(s.felled > 0, 'the run ended without felling anything');
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
