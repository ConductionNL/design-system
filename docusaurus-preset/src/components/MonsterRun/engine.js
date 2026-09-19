/**
 * Monster run — the rules, with no DOM and no clock of its own.
 *
 * La Frankendesk's game, and the only one that belongs to a blog post
 * rather than an app. The monster the post assembles goes for a run:
 * jump the forks, duck the patch sets, and pick up the parts it was
 * stitched together from.
 *
 * The joke is the obstacles. A fork is what a maintenance bill looks
 * like, a patch set is what you carry forever, and a release train
 * arrives whether you are ready or not. The things worth collecting
 * are the ones the post argues are already shared: a token, a
 * protocol, a component.
 *
 * Two inputs, jump and duck, which is what makes it a runner rather
 * than a fourth game about picking the right answer. Time and
 * randomness are injected; the component owns the clock.
 */

/* Where a thing sits, which decides what gets you past it. */
export const LOW = 'low';    // on the ground: jump it
export const HIGH = 'high';  // overhead: duck under it

export const OBSTACLES = [
  {key: 'fork', lane: LOW},
  {key: 'patchset', lane: HIGH},
  {key: 'releaseTrain', lane: LOW},
  {key: 'designLanguage', lane: HIGH},
];

export const PARTS = ['token', 'protocol', 'component'];

/* The track is a line of columns. The monster stands at column 0 and
   the world walks towards it. */
export const TRACK = 14;

export const DEFAULTS = {
  lives: 3,
  stepStartMs: 300,
  stepFloorMs: 120,
  rampPerPoint: 0.9,
  /* Airborne and crouched both last a couple of steps, so timing is a
     decision rather than a reflex: commit early and you land in it. */
  jumpSteps: 2,
  duckSteps: 2,
  obstacleChance: 0.42,
  partChance: 0.26,
  /* Never two obstacles back to back: the monster cannot be in the air
     and crouched at once, and a run that kills you whatever you do is
     the fastest way to make a player stop. */
  minGap: 2,
  /* The first stretch is always empty. The track is filled before the
     run starts so obstacles are visible before they arrive, but that
     fill can put one at the monster's feet: the run then costs a life
     in its first second, before the player has touched a key. */
  leadIn: 5,
  pointsPerStep: 1,
  pointsPerPart: 6,
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

/** What the far end of the track should hold next. */
function spawn(state) {
  if (state.sinceObstacle < state.cfg.minGap) {
    /* Too soon for another obstacle, but a part is welcome. */
    if (state.random() < state.cfg.partChance) {
      return {kind: 'part', what: PARTS[Math.floor(state.random() * PARTS.length)], lane: state.random() < 0.5 ? LOW : HIGH};
    }
    return null;
  }
  if (state.random() < state.cfg.obstacleChance) {
    const pick = OBSTACLES[Math.floor(state.random() * OBSTACLES.length)];
    return {kind: 'obstacle', what: pick.key, lane: pick.lane};
  }
  if (state.random() < state.cfg.partChance) {
    return {kind: 'part', what: PARTS[Math.floor(state.random() * PARTS.length)], lane: state.random() < 0.5 ? LOW : HIGH};
  }
  return null;
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  let state = {
    cfg,
    random: mulberry32(seed),
    track: Array.from({length: TRACK}, () => null),
    posture: 'run',      // run | jump | duck
    postureFor: 0,       // steps left in the current posture
    lives: cfg.lives,
    score: 0,
    distance: 0,
    collected: 0,
    hits: 0,
    sinceObstacle: cfg.minGap,
    nextStepAt: now + cfg.stepStartMs,
    last: null,
    over: false,
  };
  /* Fill the track so the first obstacles are visible before they
     arrive, rather than appearing under the monster's feet. */
  for (let i = 0; i < TRACK; i++) {
    const cell = spawn(state);
    state = {
      ...state,
      track: [...state.track.slice(1), cell],
      sinceObstacle: cell && cell.kind === 'obstacle' ? 0 : state.sinceObstacle + 1,
    };
  }
  /* Then clear the run-up, so the first thing to answer is one the
     player watched coming. */
  const track = [...state.track];
  for (let i = 0; i < Math.min(cfg.leadIn, track.length); i++) track[i] = null;
  return {...state, track};
}

export function stepMs(state) {
  return Math.max(state.cfg.stepFloorMs, state.cfg.stepStartMs - state.score * state.cfg.rampPerPoint);
}

/** Jump, if the monster has its feet on the ground. */
export function jump(state) {
  if (state.over || state.posture !== 'run') return state;
  return {...state, posture: 'jump', postureFor: state.cfg.jumpSteps};
}

/** Duck, same rule: no changing your mind mid-air. */
export function duck(state) {
  if (state.over || state.posture !== 'run') return state;
  return {...state, posture: 'duck', postureFor: state.cfg.duckSteps};
}

/** Does the current posture get the monster past this cell? */
export function clears(posture, cell) {
  if (!cell || cell.kind !== 'obstacle') return true;
  if (cell.lane === LOW) return posture === 'jump';
  return posture === 'duck';
}

/**
 * Advance one step: the world moves one column closer, the monster
 * meets whatever arrives at its own column, and its posture wears off.
 */
export function step(state, now) {
  if (state.over || now < state.nextStepAt) return state;

  const arriving = state.track[0];
  let next = {...state, distance: state.distance + 1};

  if (arriving && arriving.kind === 'obstacle' && !clears(state.posture, arriving)) {
    const lives = next.lives - 1;
    next = {...next, lives, hits: next.hits + 1, last: {result: 'hit', what: arriving.what, at: now}, over: lives <= 0};
  } else if (arriving && arriving.kind === 'part') {
    /* A part is taken by running into it, whatever the posture: the
       monster is made of these, it does not have to reach. */
    next = {
      ...next,
      score: next.score + next.cfg.pointsPerPart,
      collected: next.collected + 1,
      last: {result: 'part', what: arriving.what, at: now},
    };
  } else {
    next = {...next, score: next.score + next.cfg.pointsPerStep, last: {result: 'clear', at: now}};
  }

  if (next.over) return next;

  const postureFor = Math.max(0, next.postureFor - 1);
  const cell = spawn(next);
  return {
    ...next,
    posture: postureFor === 0 ? 'run' : next.posture,
    postureFor,
    track: [...next.track.slice(1), cell],
    sinceObstacle: cell && cell.kind === 'obstacle' ? 0 : next.sinceObstacle + 1,
    nextStepAt: now + stepMs(next),
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.distance)} stappen · ${n(state.collected)} onderdelen`
    : `${n(state.distance)} strides · ${n(state.collected)} parts`;
}
