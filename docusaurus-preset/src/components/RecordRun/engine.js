/**
 * Record run — the rules, with no DOM and no clock of its own.
 *
 * Connext's game. A record travels down the stack, and the stack is
 * where records get stuck: a format nothing can read, a permission
 * nobody granted, a connector that is not there. Move the record out
 * of the way of what would stop it, and pick up the apps that move it
 * along.
 *
 * The board is three lanes and a queue of rows moving towards the
 * record. That makes it the only one of the four games with a position
 * to steer rather than a thing to choose, which is the point: three
 * games about picking the right answer would be one game three times.
 *
 * The grid is the whole state, so a run is replayable from a seed and
 * every rule below is a pure function of it.
 */

export const LANES = 3;

/* What a row can hold in a lane. */
export const CLEAR = 'clear';
export const BLOCK = 'block';
export const APP = 'app';

/* The three ways a record gets stuck, and the apps that carry it on.
   The component turns these into words; the engine only cares that a
   block stops the record and an app is worth collecting. */
export const BLOCKS = ['format', 'permission', 'connector'];
export const APPS = ['register', 'catalogue', 'portal'];

export const DEFAULTS = {
  lives: 3,
  rows: 6,
  /* How long a row takes to travel one step towards the record. Falls
     with the score, down to a floor a person can still react inside. */
  stepStartMs: 620,
  stepFloorMs: 240,
  rampPerPoint: 1.6,
  pointsPerRow: 2,
  pointsPerApp: 8,
  /* Two lanes blocked at once is a dead end when the record is already
     committed, so a row never carries more than one block. */
  blockChance: 0.55,
  appChance: 0.3,
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

/**
 * Build one row: at most one block, optionally one app, and never a
 * board the record cannot get through.
 */
function makeRow(state) {
  const cells = Array.from({length: LANES}, () => ({kind: CLEAR}));

  if (state.random() < state.cfg.blockChance) {
    const lane = Math.floor(state.random() * LANES);
    cells[lane] = {kind: BLOCK, what: BLOCKS[Math.floor(state.random() * BLOCKS.length)]};
  }

  if (state.random() < state.cfg.appChance) {
    const free = cells.map((c, i) => (c.kind === CLEAR ? i : -1)).filter((i) => i >= 0);
    if (free.length) {
      const lane = free[Math.floor(state.random() * free.length)];
      cells[lane] = {kind: APP, what: APPS[Math.floor(state.random() * APPS.length)]};
    }
  }

  return {cells, id: `r${state.spawned}`};
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  let state = {
    cfg,
    random: mulberry32(seed),
    lane: 1,
    rows: [],
    spawned: 0,
    score: 0,
    lives: cfg.lives,
    collected: 0,
    blocked: 0,
    travelled: 0,
    nextStepAt: now + cfg.stepStartMs,
    last: null,
    over: false,
  };
  /* Start with a full board so the first rows are visible before they
     matter, rather than the record meeting a row it never saw. */
  for (let i = 0; i < cfg.rows; i++) {
    state = {...state, rows: [...state.rows, makeRow(state)], spawned: state.spawned + 1};
  }
  return state;
}

/** How long a row currently takes to advance one step. */
export function stepMs(state) {
  const {cfg, score} = state;
  return Math.max(cfg.stepFloorMs, cfg.stepStartMs - score * cfg.rampPerPoint);
}

/** Move the record. Lanes do not wrap: the edges are edges. */
export function move(state, delta) {
  if (state.over) return state;
  const lane = Math.min(LANES - 1, Math.max(0, state.lane + delta));
  return lane === state.lane ? state : {...state, lane};
}

export function moveTo(state, lane) {
  if (state.over) return state;
  if (!Number.isInteger(lane) || lane < 0 || lane >= LANES) return state;
  return {...state, lane};
}

/**
 * Advance the board if the step is due.
 *
 * The row nearest the record is the one it meets. A block in the
 * record's lane costs a life; an app in it is collected; an empty lane
 * is worth the small points that keep a careful player moving.
 */
export function step(state, now) {
  if (state.over || now < state.nextStepAt) return state;

  const rows = [...state.rows];
  const arriving = rows.pop();
  let next = {...state, rows, travelled: state.travelled + 1};

  const cell = arriving ? arriving.cells[state.lane] : {kind: CLEAR};

  if (cell.kind === BLOCK) {
    const lives = next.lives - 1;
    next = {
      ...next,
      lives,
      blocked: next.blocked + 1,
      last: {result: 'blocked', what: cell.what, at: now},
      over: lives <= 0,
    };
  } else if (cell.kind === APP) {
    next = {
      ...next,
      score: next.score + next.cfg.pointsPerApp,
      collected: next.collected + 1,
      last: {result: 'collected', what: cell.what, at: now},
    };
  } else {
    next = {...next, score: next.score + next.cfg.pointsPerRow, last: {result: 'through', at: now}};
  }

  if (next.over) return next;

  /* Refill from the far end, so the board is always full and the
     player can read what is coming. */
  const fresh = makeRow(next);
  return {
    ...next,
    rows: [fresh, ...next.rows],
    spawned: next.spawned + 1,
    nextStepAt: now + stepMs(next),
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.travelled)} stappen · ${n(state.collected)} apps onderweg`
    : `${n(state.travelled)} hops · ${n(state.collected)} apps picked up`;
}
