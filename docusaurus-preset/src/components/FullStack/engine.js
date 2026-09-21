/**
 * Full stack — the rules, with no DOM and no clock of its own.
 *
 * Connext's game, and Connext's pitch: a stack is only worth anything
 * when the pieces of it fit together. Groups of app tiles fall into a
 * well, you turn and place them, and a layer that runs the full width
 * of the stack is done and comes out.
 *
 * It is a falling-block puzzle, which is a genre rather than a game —
 * and the genre is where we are allowed to be. The rules of one are
 * not protectable; the particular look of the famous one is, and a
 * 2012 case (Tetris Holding v. Xio) turned on exactly that, against a
 * defendant who had written all its own code. So every choice here
 * that could have been that game's is deliberately not:
 *
 *   - the well is seven across and fourteen down, not ten by twenty;
 *   - the piece set is one, two, three, four and five tiles, and is
 *     NOT the seven four-tile shapes — no S, no Z, no J, no L, no
 *     four-in-a-line, and there are single tiles and a five-tile plus
 *     that the other game has never had;
 *   - every tile carries an app's own glyph and the palette is the
 *     Conduction token layer, never that game's piece colours;
 *   - rotation is a plain matrix turn clamped into the well, with no
 *     kick table;
 *   - and a full layer is only the start of the scoring: a layer of
 *     one app, or a layer of seven different ones, is what the game is
 *     actually about, and is nobody else's rule.
 *
 * Time and randomness are injected; the component owns the clock.
 */

/** The apps whose tiles fall. Seven, so a full layer can hold one of
 *  each and "the whole stack in one layer" is a thing that can happen. */
export const APPS = [
  'opencatalogi',
  'openregister',
  'openconnector',
  'docudesk',
  'shillinq',
  'launchpad',
  'zaakafhandelapp',
];

/**
 * The pieces, as tile offsets from the top-left of their own box.
 *
 * Sizes one to five on purpose. A set of the seven four-tile shapes is
 * the one thing a falling-block game must not be.
 */
export const PIECES = {
  dot: [[0, 0]],
  pair: [[0, 0], [0, 1]],
  bend: [[0, 0], [0, 1], [1, 0]],
  line3: [[0, 0], [0, 1], [0, 2]],
  square: [[0, 0], [0, 1], [1, 0], [1, 1]],
  tee: [[0, 0], [0, 1], [0, 2], [1, 1]],
  plus: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
};

export const KINDS = Object.keys(PIECES);

export const DEFAULTS = {
  cols: 7,
  /* Twelve deep, not fourteen: the well is a 1:2 picture either way, and
     on a laptop at 100% it is the height that runs out first. Twelve
     still leaves room to dig out of a bad corner. */
  rows: 12,

  /* The pace comes off how many pieces have landed rather than off the
     score, so playing well never speeds the well up as a side effect
     of playing well. */
  dropStartMs: 720,
  dropFloorMs: 180,
  rampPerPiece: 9,

  /* A full layer pays, and more of them at once pays more. Placing a
     piece pays nothing at all: surviving is not an achievement. */
  pointsPerLayer: 10,
  extraLayerBonus: 8,
  /* What the game is actually about. */
  oneAppBonus: 25,
  wholeStackBonus: 40,

  /* A cleared layer is held on screen before it comes out, because a
     layer that vanishes on the tick that completed it is the reward
     for finishing being the thing you finished disappearing. */
  clearHoldMs: 480,
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

function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Turn a tile list a quarter turn clockwise, back against its corner. */
export function turn(tiles) {
  const maxRow = Math.max(...tiles.map(([r]) => r));
  const spun = tiles.map(([r, c]) => [c, maxRow - r]);
  const minRow = Math.min(...spun.map(([r]) => r));
  const minCol = Math.min(...spun.map(([, c]) => c));
  return spun.map(([r, c]) => [r - minRow, c - minCol]);
}

function emptyWell(cfg) {
  return Array.from({length: cfg.rows}, () => Array.from({length: cfg.cols}, () => null));
}

/** Where a piece's tiles actually sit in the well. */
export function cellsOf(piece) {
  return piece.tiles.map(([r, c]) => [piece.row + r, piece.col + c]);
}

/** Can this piece sit here? */
export function fits(state, piece) {
  return cellsOf(piece).every(([r, c]) => (
    c >= 0 && c < state.cfg.cols && r < state.cfg.rows && (r < 0 || state.well[r][c] === null)
  ));
}

/**
 * Draw the next piece, and hand back the bag it came from.
 *
 * The apps come out of a bag: all seven are dealt, in a shuffled
 * order, before any of them comes round again. Drawn independently
 * they clump, and a run could go a dozen pieces without seeing an
 * app it needed — which makes a layer of all seven a matter of luck
 * rather than of planning, and that layer is the point of the game.
 *
 * Only the app is bagged. The shape stays an independent draw, so the
 * sequence of pieces is not itself a bag of seven — that is the other
 * game's randomiser, and this one has no reason to borrow it.
 */
function draw(state) {
  const kind = KINDS[Math.floor(state.random() * KINDS.length)];
  const bag = state.bag && state.bag.length ? state.bag : shuffled(APPS, state.random);
  return {drawn: {kind, app: bag[0]}, bag: bag.slice(1)};
}

/** Put a drawn piece at the top, centred. */
function place(state, drawn) {
  const tiles = PIECES[drawn.kind];
  const width = Math.max(...tiles.map(([, c]) => c)) + 1;
  return {
    kind: drawn.kind,
    app: drawn.app,
    tiles,
    row: 0,
    col: Math.floor((state.cfg.cols - width) / 2),
  };
}

/** How long the piece has before it falls one row. */
export function dropMs(state) {
  return Math.max(
    state.cfg.dropFloorMs,
    state.cfg.dropStartMs - state.landed * state.cfg.rampPerPiece,
  );
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    well: emptyWell(cfg),
    piece: null,
    next: null,
    bag: [],
    score: 0,
    layers: 0,
    landed: 0,
    oneApp: 0,
    wholeStack: 0,
    best: 0,
    hold: null,
    nextDropAt: now + cfg.dropStartMs,
    last: null,
    over: false,
  };
  /* Two draws off the same bag: the piece in play, then the one after. */
  const opening = draw(base);
  const following = draw({...base, bag: opening.bag});
  const seeded = {...base, bag: following.bag, next: following.drawn};
  return {...seeded, piece: place(seeded, opening.drawn)};
}

/** Move the piece sideways. A held well is not playable. */
export function shift(state, delta) {
  if (state.over || state.hold || !state.piece) return state;
  const moved = {...state.piece, col: state.piece.col + Math.sign(delta)};
  return fits(state, moved) ? {...state, piece: moved} : state;
}

/**
 * Turn the piece.
 *
 * A plain matrix turn, nudged back inside the well if it would hang
 * over an edge, and refused if it still does not fit. No kick table:
 * the clever recovery rotations of the famous one are part of what
 * makes that game that game.
 */
export function rotate(state) {
  if (state.over || state.hold || !state.piece) return state;
  const tiles = turn(state.piece.tiles);
  const width = Math.max(...tiles.map(([, c]) => c)) + 1;
  const col = Math.min(state.piece.col, state.cfg.cols - width);
  const spun = {...state.piece, tiles, col: Math.max(0, col)};
  return fits(state, spun) ? {...state, piece: spun} : state;
}

/** Drop the piece as far as it will go, and land it there. */
export function slam(state, now) {
  if (state.over || state.hold || !state.piece) return state;
  let piece = state.piece;
  while (fits(state, {...piece, row: piece.row + 1})) piece = {...piece, row: piece.row + 1};
  return land({...state, piece}, now);
}

/** Which layers are full, and what they are made of. */
function fullLayers(well, cfg) {
  const out = [];
  well.forEach((row, i) => {
    if (row.every((cell) => cell !== null)) {
      const apps = new Set(row.map((cell) => cell.app));
      out.push({row: i, apps, oneApp: apps.size === 1, wholeStack: apps.size === cfg.cols});
    }
  });
  return out;
}

/**
 * Settle the piece into the well, and work out what that finished.
 *
 * A layer of one app, or a layer with every app in it, is where the
 * points are: a merely full layer is the floor, not the goal.
 */
function land(state, now) {
  const well = state.well.map((row) => [...row]);
  for (const [r, c] of cellsOf(state.piece)) {
    if (r < 0) continue;
    well[r][c] = {app: state.piece.app};
  }

  const done = fullLayers(well, state.cfg);
  const landed = state.landed + 1;

  if (!done.length) {
    const next = {...state, well, landed, piece: null, last: {result: 'landed', at: now}};
    return open(next, now);
  }

  const oneApp = done.filter((l) => l.oneApp).length;
  const wholeStack = done.filter((l) => l.wholeStack).length;
  const gained = done.length * state.cfg.pointsPerLayer
    + (done.length - 1) * state.cfg.extraLayerBonus
    + oneApp * state.cfg.oneAppBonus
    + wholeStack * state.cfg.wholeStackBonus;

  return {
    ...state,
    well,
    landed,
    piece: null,
    score: state.score + gained,
    layers: state.layers + done.length,
    oneApp: state.oneApp + oneApp,
    wholeStack: state.wholeStack + wholeStack,
    best: Math.max(state.best, done.length),
    last: {
      result: 'cleared',
      layers: done.length,
      oneApp,
      wholeStack,
      points: gained,
      at: now,
    },
    hold: {
      result: 'cleared',
      at: now,
      until: now + state.cfg.clearHoldMs,
      rows: done.map((l) => l.row),
    },
  };
}

/** Take the finished layers out and let the rest of the stack down. */
function collapse(state, now) {
  const going = new Set(state.hold.rows);
  const kept = state.well.filter((_, i) => !going.has(i));
  const fresh = Array.from({length: state.cfg.rows - kept.length}, () => (
    Array.from({length: state.cfg.cols}, () => null)
  ));
  return open({...state, well: [...fresh, ...kept], hold: null}, now);
}

/** Bring on the next piece, or find there is no room for it. */
function open(state, now) {
  const piece = place(state, state.next);
  const {drawn, bag} = draw(state);
  const next = {...state, next: drawn, bag, nextDropAt: now + dropMs(state)};
  if (!fits(next, piece)) {
    return {...next, piece: null, over: true, last: {result: 'full', at: now}};
  }
  return {...next, piece};
}

/** Nudge the piece down one row, landing it if it cannot go. */
export function down(state, now) {
  if (state.over || state.hold || !state.piece) return state;
  const moved = {...state.piece, row: state.piece.row + 1};
  if (fits(state, moved)) {
    return {...state, piece: moved, nextDropAt: now + dropMs(state)};
  }
  return land(state, now);
}

/** The clock, one tick at a time. */
export function step(state, now) {
  if (state.over) return state;
  if (state.hold) return now < state.hold.until ? state : collapse(state, now);
  if (!state.piece) return open(state, now);
  if (now < state.nextDropAt) return state;
  return down(state, now);
}

/** How high the stack has got, as a fraction of the well. */
export function height(state) {
  const first = state.well.findIndex((row) => row.some((cell) => cell !== null));
  return first < 0 ? 0 : (state.cfg.rows - first) / state.cfg.rows;
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.layers)} lagen af · ${n(state.oneApp)} op één app · ${n(state.wholeStack)} met de hele stack`
    : `${n(state.layers)} layers out · ${n(state.oneApp)} on one app · ${n(state.wholeStack)} whole-stack`;
}
