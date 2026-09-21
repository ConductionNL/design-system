/**
 * Pipe fit — the rules, with no DOM and no clock of its own.
 *
 * Integriq's game. A record is leaving one system for another and the
 * route between them is half built. Turn each connector until the line
 * runs end to end, before the payload arrives and finds a gap.
 *
 * A route is a row of connectors, each with an opening on its left and
 * its right. Turning one moves both openings together, so fixing the
 * join on one side can break the join on the other. Some are also
 * wired to the connectors either side of them and take those round as
 * well, which is the difference between a puzzle and a formality —
 * see assignCoupled for why nothing weaker works.
 *
 * Time and randomness are injected; the component owns the clock.
 */

/* The three heights a connector can open at. A join works when the
   right-hand opening of one meets the left-hand opening of the next. */
export const PORTS = 3;

export const DEFAULTS = {
  lives: 3,
  lengthStart: 4,
  lengthMax: 7,
  /* A route grows every few clears rather than every one: a puzzle
     that gets longer each time outruns the clock before it gets
     interesting. */
  growEvery: 2,
  /* How many connectors drag their neighbours round with them, and
     how many routes go by before any of them do. The first few
     routes are the ones somebody is learning on, and a rule that
     only bites sometimes is a rule nobody works out while also
     reading a board for the first time. Once it starts, it leaves
     about half of routes still falling to a simple walk. */
  coupled: 1,
  coupledFrom: 3,
  /* Tighter than it reads. A route is a few clicks of work, so the
     clock has to be the thing that ends a run rather than a
     formality it comfortably outlasts. */
  clockStartMs: 19000,
  clockFloorMs: 7500,
  rampPerPoint: 70,
  pointsPerTurn: 1,
  pointsPerRoute: 20,
  /* A finished route stays on screen for a beat before the next one
     is dealt. Without it the reward for solving a puzzle is the
     puzzle vanishing, which reads as a glitch rather than a win. */
  clearedHoldMs: 900,
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
 * Which connectors drag their neighbours round with them.
 *
 * This is the only thing in the game that asks the player to think.
 * Without it a route falls to a walk: go left to right, turn each
 * connector until it meets the one before, and stop. Every piece
 * has exactly one rotation that fits what is handed to it, so the
 * walk never fails and never has to go back — measured over four
 * hundred routes it took 3.1 clicks and five per cent of the clock.
 *
 * Two things that look like they would fix that do not. Wiring two
 * connectors to one setting changes nothing, because fixing either
 * one sets the pair right together. Making a connector drag only
 * the one before it changes nothing either, because the same walk
 * run right to left then solves every route instead — a trick to be
 * learned once, not a puzzle.
 *
 * Dragging BOTH neighbours is what breaks it, and breaks it evenly:
 * about half of routes still fall to a walk in either direction, and
 * the other half need working out. Optimal play stays near five
 * clicks, so what was added is thought, not grinding.
 */
function assignCoupled(state, length) {
  const coupled = new Array(length).fill(false);
  /* Nothing is wired to anything for the opening routes. */
  if (state.routes < state.cfg.coupledFrom) return coupled;
  const bag = Array.from({length}, (_, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(state.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  for (let n = 0; n < Math.min(state.cfg.coupled, length); n++) coupled[bag[n]] = true;
  return coupled;
}

/** Everything one click moves: the connector, and its neighbours if
    it is one of the coupled ones. */
export function movedBy(route, index) {
  if (!route.coupled[index]) return [index];
  return [index - 1, index, index + 1].filter((i) => i >= 0 && i < route.pieces.length);
}

function spin(pieces, coupled, index) {
  const hit = coupled[index]
    ? [index - 1, index, index + 1].filter((i) => i >= 0 && i < pieces.length)
    : [index];
  return pieces.map((p, i) => (hit.includes(i) ? {...p, turn: (p.turn + 1) % PORTS} : p));
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

  const coupled = assignCoupled(state, length);
  const route = {source, target: carry, pieces, coupled, startedAt: now, expiresAt: now + clockMs(state)};

  /* Scramble with the moves the player has, rather than by setting
     every turn at random. Once a connector drags its neighbours, a
     random arrangement need not be reachable at all, and an
     unsolvable puzzle on a clock reads to the player as a broken
     game. Every click can be undone by two more, so anything
     reached this way can be worked back. */
  let scrambled = route;
  for (let attempt = 0; attempt < 8; attempt++) {
    let turned = route.pieces;
    for (let m = 0; m < length * 3; m++) {
      turned = spin(turned, coupled, Math.floor(state.random() * length));
    }
    scrambled = {...route, pieces: turned};
    if (!connected(scrambled)) break;
  }
  /* A fresh route is never the one being celebrated. */
  return {...state, route: scrambled, cleared: null};
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
    /* `{at, until}` while a finished route is being shown, else null. */
    cleared: null,
    over: false,
  };
  return deal(base, now, cfg.lengthStart);
}

export function remaining(state, now) {
  if (!state.route) return 0;
  const total = state.route.expiresAt - state.route.startedAt;
  if (total <= 0) return 0;
  /* The clock stops on a finished route: the beat spent looking at a
     line that works should not be charged to the player. */
  const at = state.cleared ? state.cleared.at : now;
  return Math.min(1, Math.max(0, (state.route.expiresAt - at) / total));
}

function nextLength(state) {
  const grown = state.cfg.lengthStart + Math.floor((state.routes + 1) / state.cfg.growEvery);
  return Math.min(state.cfg.lengthMax, grown);
}

/**
 * Turn one connector.
 *
 * Completing the route scores and holds it on screen; `step` deals the
 * next one once the hold is up. Turning is never punished: the mistake
 * this game is about is the route that was never finished, not the
 * fiddling on the way there.
 */
export function turn(state, index, now) {
  if (state.over || !state.route || state.cleared) return state;
  if (!Number.isInteger(index) || index < 0 || index >= state.route.pieces.length) return state;

  /* A coupled connector takes its neighbours with it, which is the
     point: a setting is rarely wired to one thing only. */
  const pieces = spin(state.route.pieces, state.route.coupled, index);
  const route = {...state.route, pieces};
  const turned = {...state, route, turns: state.turns + 1, score: state.score + state.cfg.pointsPerTurn};

  if (!connected(route)) return {...turned, last: {result: 'turned', at: now}};

  /* The route stays as the player left it, whole, until the hold is
     up. Scoring happens now so the HUD moves on the click that earned
     it rather than a second later. */
  return {
    ...turned,
    score: turned.score + turned.cfg.pointsPerRoute,
    routes: turned.routes + 1,
    last: {result: 'connected', at: now},
    cleared: {at: now, until: now + turned.cfg.clearedHoldMs},
  };
}

/**
 * The clock, one tick at a time: it ends the beat on a finished route,
 * and it takes a life off one that was never finished.
 */
export function step(state, now) {
  if (state.over || !state.route) return state;

  /* A finished route is held, not expired: the countdown cannot take a
     life off a line that already works. */
  if (state.cleared) {
    if (now < state.cleared.until) return state;
    return deal(state, now, nextLength(state));
  }

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
