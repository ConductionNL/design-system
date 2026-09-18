/**
 * Paint by tokens — the rules, with no DOM and no clock of its own.
 *
 * Thematiq's game. Paint by numbers, except the numbers are the design
 * tokens a theme is made of: surface, accent, ink, muted, line. Pick a
 * token, fill the cells that ask for it, finish the picture before the
 * clock runs out.
 *
 * It is a theming game rather than a colouring game, and the
 * difference is that the swatch is never the answer: the cell says
 * which token it wants, and a token's colour is whatever the active
 * theme says it is. Painting by eye is exactly the habit the app
 * exists to break.
 *
 * Time and randomness are injected. The component owns the clock.
 */

/* The five token roles, in the order the palette shows them. Their
   colours belong to the theme, not to this file. */
export const TOKENS = ['surface', 'accent', 'ink', 'muted', 'line'];

export const COLS = 8;
export const ROWS = 6;

/* Each picture is a row-per-string map of token indexes. They are
   deliberately readable as pictures in the source, because a picture
   nobody can see while editing is a picture nobody notices breaking. */
export const PICTURES = [
  {
    name: 'hex',
    rows: [
      '00111100',
      '01444410',
      '14222241',
      '14222241',
      '01444410',
      '00111100',
    ],
  },
  {
    name: 'stack',
    rows: [
      '00000000',
      '11111111',
      '13333331',
      '11111111',
      '12222221',
      '11111111',
    ],
  },
  {
    name: 'record',
    rows: [
      '01111110',
      '01333310',
      '01222210',
      '01222210',
      '01333310',
      '01111110',
    ],
  },
  {
    name: 'flow',
    rows: [
      '40000004',
      '04000040',
      '00422400',
      '00422400',
      '04000040',
      '40000004',
    ],
  },
];

export const DEFAULTS = {
  startMs: 45000,
  bonusMs: 20000,
  /* A wrong fill costs time rather than a life: the mistake in theming
     is picking by eye, and the cost of that is rework, not disaster. */
  penaltyMs: 3000,
  pointsPerCell: 2,
  pointsPerPicture: 30,
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

function loadPicture(state, index) {
  const picture = PICTURES[index % PICTURES.length];
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const token = Number(picture.rows[r][c]);
      cells.push({token, painted: false});
    }
  }
  return {...state, picture: picture.name, cells, pictureIndex: index};
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const random = mulberry32(seed);
  const base = {
    cfg,
    random,
    selected: 0,
    score: 0,
    finished: 0,
    wrong: 0,
    endsAt: now + cfg.startMs,
    last: null,
    over: false,
  };
  return loadPicture(base, Math.floor(random() * PICTURES.length));
}

export function timeLeft(state, now) {
  return Math.max(0, state.endsAt - now);
}

export function select(state, token) {
  if (state.over) return state;
  if (!Number.isInteger(token) || token < 0 || token >= TOKENS.length) return state;
  return {...state, selected: token};
}

export function step(state, now) {
  if (state.over) return state;
  if (timeLeft(state, now) > 0) return state;
  return {...state, over: true, last: {result: 'timeout', at: now}};
}

/** How many cells of the current picture are still empty. */
export function remaining(state) {
  return state.cells.filter((c) => !c.painted).length;
}

/**
 * Fill one cell with the selected token.
 *
 * A cell that already carries paint is left alone and costs nothing:
 * clicking twice is a slip, not a mistake about the theme.
 */
export function paint(state, index, now) {
  if (state.over) return state;
  const cell = state.cells[index];
  if (!cell || cell.painted) return state;

  if (cell.token !== state.selected) {
    const out = {
      ...state,
      endsAt: state.endsAt - state.cfg.penaltyMs,
      wrong: state.wrong + 1,
      last: {result: 'wrong', wanted: cell.token, used: state.selected, at: now},
    };
    return timeLeft(out, now) > 0 ? out : {...out, over: true};
  }

  const cells = [...state.cells];
  cells[index] = {...cell, painted: true};
  const next = {
    ...state,
    cells,
    score: state.score + state.cfg.pointsPerCell,
    last: {result: 'painted', at: now},
  };

  if (cells.some((c) => !c.painted)) return next;

  /* Picture finished: score it, buy time, and deal the next one. */
  const done = {
    ...next,
    score: next.score + next.cfg.pointsPerPicture,
    finished: next.finished + 1,
    endsAt: next.endsAt + next.cfg.bonusMs,
    last: {result: 'finished', at: now},
  };
  return loadPicture(done, done.pictureIndex + 1);
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.finished)} thema's af · ${n(state.wrong)} keer misgetikt`
    : `${n(state.finished)} themes finished · ${n(state.wrong)} wrong fills`;
}
