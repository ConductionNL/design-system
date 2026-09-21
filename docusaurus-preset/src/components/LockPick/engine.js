/**
 * Lock pick — the rules, with no DOM and no clock of its own.
 *
 * Keepiq's game, and the one everybody already knows how to play: set
 * the pick, lean on the cylinder, feel how far it gives. Close to the
 * sweet spot it turns; far from it the pick strains and eventually
 * snaps. Three picks and the lock wins.
 *
 * ## Why torque is held rather than pressed
 *
 * This has been both ways round. The first version answered one press
 * with one reading and one lump of wear, and it played as a guessing
 * game with a cost per guess: you could not sweep the lock, so you
 * poked at it and lost picks learning nothing. The second showed the
 * reading live as the dial moved, which fixed the sweeping but gave
 * the answer away for free — the picks stopped breaking and the run
 * stopped being able to end.
 *
 * So the cost is time under load, which is how the lock everybody is
 * thinking of works. Moving the pick is free and tells you nothing.
 * Torque turns the cylinder as far as it will go, and holds it there
 * for as long as you dare: the reading is free to glance at and
 * expensive to stare at. Strain is the square of how far the cylinder
 * refuses to move, per second, so a hair off the spot you can lean on
 * it half a minute and at the far end of the dial you have about a
 * second. Letting go keeps both the pick and what you learned.
 *
 * On the spot there is no strain at all, only the time the lock takes
 * to give. That is the reward for deduction, and the reason a careful
 * player finishes a run on the pick they started with.
 *
 * Time is injected; the component owns the clock.
 */

export const POSITIONS = 100;

export const DEFAULTS = {
  picks: 3,
  /* How far off the sweet spot the pick may be and still open the
     lock, as positions on the dial. Narrows each time a lock opens,
     down to a floor that is still findable by halving the range. */
  /* The first lock is wide open — thirty-odd positions out of a
     hundred — because the first one is where you learn to read the
     cylinder, not where you prove anything. It closes up a step per
     lock down to a floor that two or three readings still find.
     This started at 9 and the first lock was already a needle: you
     could take four good readings and still not have it. */
  toleranceStart: 16,
  toleranceFloor: 6,
  toleranceStep: 2,
  durability: 100,
  /* Turning costs nothing: the cylinder coming round is the lock
     working, not the pick suffering. Wear starts the moment it stops,
     which is the moment you are pushing something that has already
     refused.

     This was readMs plus a beat, and the beat was the problem — a
     push shorter than the grace cost literally nothing, so most
     attempts were free and the pick never moved. It is exactly readMs
     now: free while it turns, charged the instant it does not. */
  graceMs: 170,
  /* Wear per second once the cylinder has refused, in two parts.

     `strainBase` is charged for any failed push whatever the angle.
     Without it a near miss cost almost nothing — the distance term is
     a power curve, so at nine tenths of the way round it was under a
     point a second and the bar did not visibly move. A push that does
     not open the lock should always cost something you can see.

     `strainPerSecond` is the part that scales with how far the
     cylinder refused, and the exponent is what makes a wild guess
     expensive without making a near miss free. It was squared, which
     was too forgiving in the top half of the range.

     Together: about 92/s at the far end of the dial and 24/s a hair
     off the spot, so a fresh pick has roughly a second at the worst
     angle and four at the best. On the spot there is no wear at all,
     because that path opens the lock instead. */
  strainBase: 22,
  strainPerSecond: 70,
  strainFalloff: 1.5,
  /* How long the cylinder takes to reach the angle it will hold.
     graceMs matches it: the free part of a push is exactly the part
     where something is still moving. */
  readMs: 170,
  /* And how long the sweet spot must be held before the lock gives.
     Short: once you are on it the game is over, and making someone
     wait out a second to be told so is only suspense the first time. */
  openMs: 400,
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
    /* Under load right now, since when, and for how long so far. */
    turning: false,
    turnStartedAt: 0,
    heldMs: 0,
    last: null,
    over: false,
  };
  return {...base, lock: newLock(base)};
}

/**
 * Move the pick. Free, silent, and not while the lock is under load:
 * the pick is wedged against the cylinder, and being able to slide it
 * along while torqued would be the live readout all over again.
 */
export function setPosition(state, position) {
  if (state.over || state.turning) return state;
  const clamped = Math.min(POSITIONS - 1, Math.max(0, Math.round(position)));
  return clamped === state.position ? state : {...state, position: clamped};
}

export function nudge(state, delta) {
  return setPosition(state, state.position + delta);
}

/**
 * How far the cylinder would turn at the current position, 0 to 1.
 *
 * Inside the tolerance it is 1: the lock opens. Outside, it falls away
 * with distance, and that number is both the reading the player takes
 * and the inverse of the strain the pick is under while taking it.
 */
export function give(state) {
  const distance = Math.abs(state.position - state.lock.sweet);
  if (distance <= state.lock.tolerance) return 1;
  const reach = POSITIONS / 2;
  return Math.max(0, 1 - (distance - state.lock.tolerance) / reach);
}

/**
 * How far the cylinder has actually come round, right now.
 *
 * Zero unless torque is on, and it takes readMs to get there — which
 * is what makes a reading cost something. The picture is drawn from
 * this, never from give(), or the dial would tell on the lock again.
 */
export function cylinderTurn(state) {
  if (!state.turning) return 0;
  const ramp = Math.min(1, state.heldMs / state.cfg.readMs);
  return give(state) * ramp;
}

function snap(state) {
  const picks = state.picks - 1;
  return {
    ...state,
    picks,
    snapped: state.snapped + 1,
    durability: state.cfg.durability,
    turning: false,
    heldMs: 0,
    last: {result: 'snapped', give: give(state), attempts: state.lock.attempts},
    over: picks <= 0,
  };
}

function openLock(state) {
  const bonus = Math.round(state.durability / state.cfg.durabilityBonusDivisor);
  const opened = {
    ...state,
    score: state.score + state.cfg.pointsPerLock + bonus,
    opened: state.opened + 1,
    turning: false,
    heldMs: 0,
    last: {result: 'opened', points: state.cfg.pointsPerLock + bonus, attempts: state.lock.attempts},
  };
  /* A fresh lock, but the same pick, in whatever state you have left
     it. It used to hand out a new one with every lock, which meant a
     pick could only ever be lost inside a single lock and the wear
     bar jumped back to full as a reward — so the thing the whole game
     is spent managing reset every time you succeeded. Carrying it
     over is what makes three picks a run rather than three chances,
     and what makes the bonus for a barely-used pick worth chasing. */
  return {...opened, lock: newLock(opened), position: Math.floor(POSITIONS / 2)};
}

/** Lean on the cylinder. Costs a nick straight away. */
export function beginTurn(state, now = 0) {
  if (state.over || state.turning) return state;
  return {
    ...state,
    turns: state.turns + 1,
    lock: {...state.lock, attempts: state.lock.attempts + 1},
    turning: true,
    turnStartedAt: now,
    heldMs: 0,
    last: {result: 'turning'},
  };
}

/**
 * Keep leaning. Advances the hold to `now`, wears the pick for the
 * time that passed, and opens the lock once the sweet spot has been
 * held long enough.
 */
export function holdTurn(state, now) {
  if (state.over || !state.turning) return state;

  const heldMs = Math.max(state.heldMs, now - state.turnStartedAt);
  const dt = heldMs - state.heldMs;
  if (dt <= 0) return state;

  const turned = give(state);

  if (turned >= 1) {
    /* No strain on the spot however long it takes: the cylinder is
       turning, and turning is the lock working. */
    if (heldMs < state.cfg.openMs) return {...state, heldMs};
    return openLock({...state, heldMs});
  }

  /* Only the part of this tick that falls past the grace counts. The
     cylinder spends graceMs coming round and stopping, and none of
     that is the pick's problem — the wear is the pushing you do after
     it has refused. */
  const charged = Math.min(dt, heldMs - state.cfg.graceMs);
  if (charged <= 0) return {...state, heldMs};

  const rate = state.cfg.strainBase
    + state.cfg.strainPerSecond * (1 - turned) ** state.cfg.strainFalloff;
  const strain = rate * (charged / 1000);
  const durability = state.durability - strain;
  if (durability > 0) return {...state, heldMs, durability};
  return snap({...state, heldMs});
}

/** Let go. Keeps the pick, and tells you what the cylinder did. */
export function releaseTurn(state) {
  if (!state.turning) return state;
  return {
    ...state,
    turning: false,
    heldMs: 0,
    last: {result: 'held', give: give(state), attempts: state.lock.attempts},
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.opened)} sloten open · ${n(state.turns)} pogingen`
    : `${n(state.opened)} locks opened · ${n(state.turns)} turns`;
}
