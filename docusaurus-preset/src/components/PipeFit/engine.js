/**
 * Pipe fit — the rules, with no DOM and no clock of its own.
 *
 * Integriq's game. A record is leaving one system for another and the
 * route between them is half built. Turn each connector until the line
 * runs end to end, before the payload arrives and finds a gap.
 *
 * A route is a row of connectors, each with an opening on its left and
 * its right. Turning one moves both openings together, so fixing the
 * join on one side can break the join on the other: that is the whole
 * puzzle, and it is exactly what integrating two systems feels like.
 *
 * Time and randomness are injected; the component owns the clock.
 */

/* The three heights a connector can open at. A join works when the
   right-hand opening of one meets the left-hand opening of the next. */
export const PORTS = 3;

export const DEFAULTS = {
  lives: 3,
  lengthStart: 3,
  lengthMax: 6,
  /* A route grows every few clears rather than every one: a puzzle
     that gets longer each time outruns the clock before it gets
     interesting. */
  growEvery: 2,
  clockStartMs: 26000,
  clockFloorMs: 11000,
  rampPerPoint: 55,
  pointsPerTurn: 1,
  pointsPerRoute: 20,
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

export function clockMs(state) {
  return Math.max(state.cfg.clockFloorMs, state.cfg.clockStartMs - state.score * state.cfg.rampPerPoint);
}

/**
 * A connector is `{shape, turn}`. `shape` is the pair of openings as
 * built, `turn` is how many times it has been turned; the openings
 * that count are the shape rotated by the turn.
 */
export function openings(piece) {
  return {
    left: (piece.shape.left + piece.turn) % PORTS,
    right: (piece.shape.right + piece.turn) % PORTS,
  };
}

/** Does the whole route line up, source to consumer? */
export function connected(route) {
  if (!route || !route.pieces.length) return false;
  let carry = route.source;
  for (const piece of route.pieces) {
    const {left, right} = openings(piece);
    if (left !== carry) return false;
    carry = right;
  }
  return carry === route.target;
}

/**
 * Build a route that is solvable, then turn the pieces out of true.
 *
 * Built from a working line rather than at random: a route assembled
 * by chance can be unsolvable, and an unsolvable puzzle on a clock
 * reads to the player as a broken game.
 */
function deal(state, now, length) {
  const source = Math.floor(state.random() * PORTS);
  let carry = source;
  const pieces = [];

  for (let i = 0; i < length; i++) {
    const right = Math.floor(state.random() * PORTS);
    /* The shape is stored as if unturned, so that turning it back is
       always possible. */
    pieces.push({shape: {left: carry, right}, turn: 0});
    carry = right;
  }

  const route = {source, target: carry, pieces, startedAt: now, expiresAt: now + clockMs(state)};

  /* Now scramble. Keep scrambling until it is actually out of true,
     or a route could be dealt already solved. */
  let scrambled = route;
  for (let attempt = 0; attempt < 8; attempt++) {
    scrambled = {
      ...route,
      pieces: route.pieces.map((p) => ({...p, turn: Math.floor(state.random() * PORTS)})),
    };
    if (!connected(scrambled)) break;
  }
  return {...state, route: scrambled};
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    route: null,
    score: 0,
    lives: cfg.lives,
    routes: 0,
    turns: 0,
    last: null,
    over: false,
  };
  return deal(base, now, cfg.lengthStart);
}

export function remaining(state, now) {
  if (!state.route) return 0;
  const total = state.route.expiresAt - state.route.startedAt;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (state.route.expiresAt - now) / total));
}

function nextLength(state) {
  const grown = state.cfg.lengthStart + Math.floor((state.routes + 1) / state.cfg.growEvery);
  return Math.min(state.cfg.lengthMax, grown);
}

/**
 * Turn one connector.
 *
 * Completing the route scores and deals the next one. Turning is never
 * punished: the mistake this game is about is the route that was never
 * finished, not the fiddling on the way there.
 */
export function turn(state, index, now) {
  if (state.over || !state.route) return state;
  if (!Number.isInteger(index) || index < 0 || index >= state.route.pieces.length) return state;

  const pieces = state.route.pieces.map((p, i) => (i === index ? {...p, turn: (p.turn + 1) % PORTS} : p));
  const route = {...state.route, pieces};
  const turned = {...state, route, turns: state.turns + 1, score: state.score + state.cfg.pointsPerTurn};

  if (!connected(route)) return {...turned, last: {result: 'turned', at: now}};

  const cleared = {
    ...turned,
    score: turned.score + turned.cfg.pointsPerRoute,
    routes: turned.routes + 1,
    last: {result: 'connected', at: now},
  };
  return deal(cleared, now, nextLength(cleared));
}

/** The payload arrives; an unfinished route costs a life. */
export function step(state, now) {
  if (state.over || !state.route) return state;
  if (now < state.route.expiresAt) return state;

  const lives = state.lives - 1;
  const hit = {...state, lives, last: {result: 'spilled', at: now}, over: lives <= 0};
  return hit.over ? {...hit, route: null} : deal(hit, now, state.route.pieces.length);
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.routes)} koppelingen gelegd · ${n(state.turns)} keer gedraaid`
    : `${n(state.routes)} routes connected · ${n(state.turns)} turns`;
}
