/**
 * Dice duel — the rules, with no DOM and no clock of its own.
 *
 * Larpinq's game, and the one app where a game needs no excuse. A
 * monster blocks the path. You have a handful of dice and a choice
 * every round: swing with what you rolled, or push your luck and
 * reroll the weak ones.
 *
 * The whole game is that choice. A roll you keep is certain and
 * usually small; a reroll is the only way to a big hit and the only
 * way to lose the round. Nothing here is a reflex, so it is the one
 * game on the site you can play badly while thinking hard.
 *
 * There is no clock anywhere in it: pushing your luck is not a thing
 * you should be hurried through.
 */

export const DICE = 4;
export const FACES = 6;

export const MONSTERS = [
  {key: 'goblin', hp: 12, bite: 3},
  {key: 'troll', hp: 20, bite: 5},
  {key: 'wyrm', hp: 30, bite: 7},
  {key: 'lich', hp: 42, bite: 9},
];

export const DEFAULTS = {
  hearts: 3,
  /* A reroll costs nothing but the round's safety: the monster bites
     when you reroll and roll worse than you already had. That is the
     push-your-luck deal, and it is the only way to be hurt. */
  rerollsPerRound: 2,
  /* Sixes are worth more than their pips, so a good roll feels good
     rather than merely numerical. */
  critBonus: 3,
  pointsPerKill: 25,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rollDie(state) {
  return 1 + Math.floor(state.random() * FACES);
}

function rollAll(state) {
  return Array.from({length: DICE}, () => rollDie(state));
}

/** What a set of dice is worth: pips, plus a bonus for every six. */
export function damageOf(dice) {
  const pips = dice.reduce((sum, d) => sum + d, 0);
  const sixes = dice.filter((d) => d === FACES).length;
  return pips + sixes * DEFAULTS.critBonus;
}

function nextMonster(state, index) {
  const spec = MONSTERS[index % MONSTERS.length];
  return {key: spec.key, hp: spec.hp, maxHp: spec.hp, bite: spec.bite, index};
}

export function createGame({seed = Date.now(), config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    hearts: cfg.hearts,
    score: 0,
    felled: 0,
    rounds: 0,
    last: null,
    over: false,
  };
  const withMonster = {...base, monster: nextMonster(base, 0)};
  return {
    ...withMonster,
    dice: rollAll(withMonster),
    kept: Array.from({length: DICE}, () => false),
    rerollsLeft: cfg.rerollsPerRound,
  };
}

/** Hold or release one die between rerolls. */
export function toggleKeep(state, index) {
  if (state.over) return state;
  if (!Number.isInteger(index) || index < 0 || index >= DICE) return state;
  const kept = [...state.kept];
  kept[index] = !kept[index];
  return {...state, kept};
}

/**
 * Reroll everything not held.
 *
 * Rolling worse than you had is what the monster punishes: that is the
 * push, and without it holding dice would be free and the game would
 * have no decision in it.
 */
export function reroll(state) {
  if (state.over || state.rerollsLeft <= 0) return state;
  if (state.kept.every(Boolean)) return state;

  const before = damageOf(state.dice);
  const dice = state.dice.map((die, i) => (state.kept[i] ? die : rollDie(state)));
  const after = damageOf(dice);

  if (after >= before) {
    return {
      ...state,
      dice,
      rerollsLeft: state.rerollsLeft - 1,
      last: {result: 'rerollUp', from: before, to: after},
    };
  }

  const hearts = state.hearts - 1;
  return {
    ...state,
    dice,
    rerollsLeft: state.rerollsLeft - 1,
    hearts,
    last: {result: 'bitten', from: before, to: after, by: state.monster.key},
    over: hearts <= 0,
  };
}

/**
 * Swing with what is on the table.
 *
 * Always safe, always ends the round. A monster that survives heals
 * nothing: the damage stays on it, so a careful player wins slowly and
 * a lucky one wins fast.
 */
export function strike(state) {
  if (state.over) return state;

  const damage = damageOf(state.dice);
  const hp = state.monster.hp - damage;
  const rounds = state.rounds + 1;

  if (hp > 0) {
    const wounded = {...state, monster: {...state.monster, hp}, rounds, score: state.score + damage};
    return {
      ...wounded,
      dice: rollAll(wounded),
      kept: Array.from({length: DICE}, () => false),
      rerollsLeft: wounded.cfg.rerollsPerRound,
      last: {result: 'hit', damage, left: hp},
    };
  }

  const felled = {
    ...state,
    rounds,
    score: state.score + damage + state.cfg.pointsPerKill,
    felled: state.felled + 1,
    last: {result: 'felled', damage, what: state.monster.key},
  };
  const withMonster = {...felled, monster: nextMonster(felled, felled.monster.index + 1)};
  return {
    ...withMonster,
    dice: rollAll(withMonster),
    kept: Array.from({length: DICE}, () => false),
    rerollsLeft: withMonster.cfg.rerollsPerRound,
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.felled)} monsters geveld · ${n(state.rounds)} beurten`
    : `${n(state.felled)} monsters felled · ${n(state.rounds)} rounds`;
}
