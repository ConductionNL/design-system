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
 * way to end up with less than you started the round with.
 *
 * Nothing bites you for pushing. The monster's only turn comes after
 * your swing, and only if your swing left it standing — so every
 * round you fail to finish it is a round it gets paid for, and a bad
 * push is expensive because of what survives it, not because of what
 * it costs on the spot. Nothing here is a reflex, so it is the one
 * game on the site you can play badly while thinking hard.
 *
 * There is no clock anywhere in it: pushing your luck is not a thing
 * you should be hurried through.
 */

export const DICE = 4;
export const FACES = 6;

/**
 * What stands in the path, and how hard it hits back.
 *
 * `biteDice` is how many dice the monster rolls when it bites, scored
 * by the same `damageOf` the player's swing uses — sixes and all. A
 * bite is a roll, not a fixed toll, for the same reason a swing is:
 * a duel where only one side has luck is not a duel.
 */
export const MONSTERS = [
  {key: 'goblin', hp: 12, biteDice: 1},
  {key: 'troll', hp: 20, biteDice: 2},
  {key: 'wyrm', hp: 30, biteDice: 2},
  {key: 'lich', hp: 42, biteDice: 3},
];

export const DEFAULTS = {
  /* The player gets a health bar of their own rather than three
     lives. Three bites from a lich used to be the whole run, which
     read as losing to the dice rather than to a decision; a pool you
     can watch going down is a thing you can play around.

     Sixty, against a bite that can never be more than fifteen: no
     single blow takes more than a quarter of the bar, so a run ends
     from a series of decisions rather than from one bad roll. */
  heroHp: 40,
  /* What a bite can come to, however the monster's dice land. The
     ceiling is the point — a lich rolling three sixes would otherwise
     take half the bar in one go, which reads as the game cheating
     rather than as a monster being dangerous. */
  biteMin: 1,
  biteMax: 15,
  /* A reroll risks nothing but the hand you had. The cost of losing
     it is the round it buys the monster, which is the only thing in
     the game that hurts you. */
  rerollsPerRound: 2,
  /* Sixes are worth more than their pips, so a good roll feels good
     rather than merely numerical. */
  critBonus: 3,
  /* What matching dice add, by the size of the biggest group. These
     are deliberately steep: they have to be worth more than the pips
     you give up to chase them, or holding a pair is never right and
     the reroll button is decoration. */
  sets: {2: 4, 3: 14, 4: 32},
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

/**
 * What a handful of dice is worth: pips, a bonus for every six, and a
 * much larger one for matching dice.
 *
 * The matching bonus is the reason to hold anything. On pips alone a
 * reroll moves the total by a point or two and swinging straight away
 * is nearly as good, which is a push-your-luck game with nothing to
 * push for. A pair you can throw two dice at changes the shape of the
 * round.
 *
 * Only the biggest group counts. Scoring two pair as two pairs makes
 * the arithmetic on the table harder than the decision it exists to
 * support.
 */
export function damageOf(dice) {
  const pips = dice.reduce((sum, d) => sum + d, 0);
  const sixes = dice.filter((d) => d === FACES).length;

  const counts = new Map();
  for (const d of dice) counts.set(d, (counts.get(d) || 0) + 1);
  const biggest = Math.max(...counts.values());

  return pips + sixes * DEFAULTS.critBonus + (DEFAULTS.sets[biggest] || 0);
}

function nextMonster(state, index) {
  const spec = MONSTERS[index % MONSTERS.length];
  return {key: spec.key, hp: spec.hp, maxHp: spec.hp, biteDice: spec.biteDice, index};
}

/** What the monster's bite comes to this time. Its roll, its luck. */
function biteOf(state) {
  const rolled = damageOf(Array.from({length: state.monster.biteDice}, () => rollDie(state)));
  return Math.min(state.cfg.biteMax, Math.max(state.cfg.biteMin, rolled));
}

/**
 * Which dice just moved, so the table can show them tumbling and
 * leave the held ones alone. `rollId` changes on every throw, which
 * is what lets the same die animate twice running.
 */
function thrown(state, tumbled) {
  return {...state, tumbled, rollId: (state.rollId || 0) + 1};
}

export function createGame({seed = Date.now(), config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    hp: cfg.heroHp,
    maxHp: cfg.heroHp,
    score: 0,
    felled: 0,
    rounds: 0,
    last: null,
    rollId: 0,
    over: false,
  };
  const withMonster = {...base, monster: nextMonster(base, 0)};
  return thrown({
    ...withMonster,
    dice: rollAll(withMonster),
    kept: Array.from({length: DICE}, () => false),
    rerollsLeft: cfg.rerollsPerRound,
  }, Array.from({length: DICE}, () => true));
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
 * Nothing bites you here. A reroll that lands worse costs you the
 * hand you had, and that is the whole punishment: you swing for less,
 * the monster lives another round, and it takes its turn. The price
 * of a bad push is paid by the monster surviving to collect it rather
 * than by a bite bolted onto the throw.
 */
export function reroll(state) {
  if (state.over || state.rerollsLeft <= 0) return state;
  if (state.kept.every(Boolean)) return state;

  const before = damageOf(state.dice);
  const dice = state.dice.map((die, i) => (state.kept[i] ? die : rollDie(state)));
  const after = damageOf(dice);
  /* Everything that was not held went back in the cup. */
  const tumbled = state.kept.map((held) => !held);

  return thrown({
    ...state,
    dice,
    rerollsLeft: state.rerollsLeft - 1,
    last: {result: after >= before ? 'rerollUp' : 'rerollDown', from: before, to: after},
  }, tumbled);
}

/**
 * Swing with what is on the table.
 *
 * Always lands, always ends the round. A monster that survives heals
 * nothing — the damage stays on it — and then swings back, because a
 * fight in which only one side can be hurt is not a fight. Kill it on
 * the swing and it never gets the blow in; the one that walks up
 * behind it does not inherit the turn.
 */
export function strike(state) {
  if (state.over) return state;

  const damage = damageOf(state.dice);
  const hp = state.monster.hp - damage;
  const rounds = state.rounds + 1;

  if (hp > 0) {
    const wounded = {...state, monster: {...state.monster, hp}, rounds, score: state.score + damage};
    const bite = biteOf(wounded);
    const heroHp = Math.max(0, wounded.hp - bite);
    const traded = {...wounded, hp: heroHp, over: heroHp <= 0};
    return thrown({
      ...traded,
      dice: rollAll(traded),
      kept: Array.from({length: DICE}, () => false),
      rerollsLeft: traded.cfg.rerollsPerRound,
      last: {result: 'hit', damage, left: hp, bite, hp: heroHp},
    }, Array.from({length: DICE}, () => true));
  }

  const felled = {
    ...state,
    rounds,
    score: state.score + damage + state.cfg.pointsPerKill,
    felled: state.felled + 1,
    last: {result: 'felled', damage, what: state.monster.key},
  };
  const withMonster = {...felled, monster: nextMonster(felled, felled.monster.index + 1)};
  return thrown({
    ...withMonster,
    dice: rollAll(withMonster),
    kept: Array.from({length: DICE}, () => false),
    rerollsLeft: withMonster.cfg.rerollsPerRound,
  }, Array.from({length: DICE}, () => true));
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.felled)} monsters geveld · ${n(state.rounds)} beurten`
    : `${n(state.felled)} monsters felled · ${n(state.rounds)} rounds`;
}
