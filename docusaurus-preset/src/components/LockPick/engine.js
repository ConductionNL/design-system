/**
 * Lock pick — the rules, with no DOM and no clock of its own.
 *
 * Keepiq's game, and the one everybody already knows how to play: set
 * the pick, turn the cylinder, feel how far it gives. Close to the
 * sweet spot it turns; far from it the pick strains and eventually
 * snaps. Three picks and the lock wins.
 *
 * The feedback is graded rather than binary, which is what makes it a
 * game of deduction instead of a lottery: every turn tells you how
 * close you were, so the next one is a better guess. It also means the
 * lock is pickable without seeing anything, which matters more here
 * than the animation does.
 *
 * Nothing in here runs on a clock. A lock is a state machine, not a
 * race, and that is the difference between this game and the other
 * four.
 */

export const POSITIONS = 100;

export const DEFAULTS = {
  picks: 3,
  /* How far off the sweet spot the pick may be and still open the
     lock, as positions on the dial. Narrows each time a lock opens,
     down to a floor that is still findable by halving the range. */
  toleranceStart: 9,
  toleranceFloor: 3,
  toleranceStep: 1,
  /* A pick survives a few bad turns near the spot and one wild one.
     Strain is the square of how far off you were, so the punishment
     for a guess a long way out is what ends a pick, not patience. */
  durability: 100,
  strainScale: 2.4,
  /* No single turn may snap a fresh pick. Without this cap a guess at
     the far end of the dial costs a whole pick, so a player who has
     not found the spot yet loses all three before learning anything,
     and the graded feedback the game is built on never gets read. Two
     wild turns in a row still end a pick. */
  maxStrain: 55,
  pointsPerLock: 20,
  /* What is left of the pick when the lock opens is worth points: it
     rewards deduction over brute force, which is the whole game. */
  durabilityBonusDivisor: 5,
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

function newLock(state) {
  const tolerance = Math.max(
    state.cfg.toleranceFloor,
    state.cfg.toleranceStart - state.opened * state.cfg.toleranceStep,
  );
  /* Keep the sweet spot off the very edges: a lock whose answer is 0
     or 99 is opened by the two guesses everybody tries first. */
  const margin = tolerance + 2;
  const span = POSITIONS - 1 - margin * 2;
  return {
    sweet: margin + Math.floor(state.random() * (span + 1)),
    tolerance,
    attempts: 0,
  };
}

export function createGame({seed = Date.now(), config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    position: Math.floor(POSITIONS / 2),
    picks: cfg.picks,
    durability: cfg.durability,
    score: 0,
    opened: 0,
    snapped: 0,
    turns: 0,
    last: null,
    over: false,
  };
  return {...base, lock: newLock(base)};
}

/** Move the pick. The dial does not wrap: both ends are ends. */
export function setPosition(state, position) {
  if (state.over) return state;
  const clamped = Math.min(POSITIONS - 1, Math.max(0, Math.round(position)));
  return clamped === state.position ? state : {...state, position: clamped};
}

export function nudge(state, delta) {
  return setPosition(state, state.position + delta);
}

/**
 * How far the cylinder turns at the current position, 0 to 1.
 *
 * Inside the tolerance it is 1: the lock opens. Outside, it falls away
 * with distance, and that number is both the feedback the player reads
 * and the inverse of the strain the pick takes.
 */
export function give(state) {
  const distance = Math.abs(state.position - state.lock.sweet);
  if (distance <= state.lock.tolerance) return 1;
  const reach = POSITIONS / 2;
  return Math.max(0, 1 - (distance - state.lock.tolerance) / reach);
}

/**
 * Turn the cylinder.
 *
 * Opens the lock, or costs the pick some life. A pick that runs out
 * snaps, and the next one starts fresh on the same lock: the lock is
 * not re-dealt, because a player who has narrowed it down to two
 * positions should not lose that work to a broken pick.
 */
export function turn(state) {
  if (state.over) return state;

  const turned = give(state);
  const attempts = state.lock.attempts + 1;
  const base = {...state, turns: state.turns + 1, lock: {...state.lock, attempts}};

  if (turned >= 1) {
    const bonus = Math.round(base.durability / base.cfg.durabilityBonusDivisor);
    const opened = {
      ...base,
      score: base.score + base.cfg.pointsPerLock + bonus,
      opened: base.opened + 1,
      durability: base.cfg.durability,
      last: {result: 'opened', points: base.cfg.pointsPerLock + bonus, attempts},
    };
    /* A fresh lock, and a fresh pick with it: the run ends on the
       locks that beat you, not on wear from the ones you solved. */
    return {...opened, lock: newLock(opened), position: Math.floor(POSITIONS / 2)};
  }

  const strain = Math.min(
    base.cfg.maxStrain,
    Math.round((1 - turned) ** 2 * 100 * base.cfg.strainScale / 2) + 4,
  );
  const durability = base.durability - strain;

  if (durability > 0) {
    return {...base, durability, last: {result: 'held', give: turned, attempts}};
  }

  const picks = base.picks - 1;
  return {
    ...base,
    picks,
    snapped: base.snapped + 1,
    durability: base.cfg.durability,
    last: {result: 'snapped', give: turned, attempts},
    over: picks <= 0,
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.opened)} sloten open · ${n(state.turns)} pogingen`
    : `${n(state.opened)} locks opened · ${n(state.turns)} turns`;
}
