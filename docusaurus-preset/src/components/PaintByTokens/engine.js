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

/* Portrait, at the mark's own proportions. The avatar's viewBox is
   173.2 x 200, so 7/8 = 0.875 lands within a hair of it. The odd
   width is what buys a centred apex and a five-cell interior, which
   is the least the C fits into with a gap on both sides. */
export const COLS = 7;
export const ROWS = 8;

/* Each picture is a row-per-string map of token indexes. They are
   deliberately readable as pictures in the source, because a picture
   nobody can see while editing is a picture nobody notices breaking. */
export const PICTURES = [
  {
    name: 'hex',
    rows: [
      '0011100',
      '0144410',
      '1422241',
      '1422241',
      '1422241',
      '1422241',
      '0144410',
      '0011100',
    ],
  },
  {
    name: 'stack',
    rows: [
      '0000000',
      '1111111',
      '1333331',
      '1111111',
      '1222221',
      '1111111',
      '1444441',
      '1111111',
    ],
  },
  {
    name: 'record',
    rows: [
      '0111110',
      '0133310',
      '0122210',
      '0122210',
      '0122210',
      '0122210',
      '0133310',
      '0111110',
    ],
  },
  {
    name: 'flow',
    rows: [
      '4000004',
      '0400040',
      '0044400',
      '0022200',
      '0022200',
      '0044400',
      '0400040',
      '4000004',
    ],
  },
];

/**
 * The house mark: the Conduction hexagon with its C inside, at the
 * coarsest resolution it still survives.
 *
 * Ring and C are both `accent`, because the real mark is drawn in one
 * colour and a two-tone version would be a different logo. `muted`
 * fills the hex interior so the ring reads as a ring, and it also
 * holds the one-cell gap that keeps the C from fusing to the ring on
 * the left — without that gap the whole left half paints as a single
 * block and the C disappears. `surface` is the ground outside the hex.
 *
 * Every run opens on it, and it turns up again now and then in place
 * of the next picture in the rotation.
 */
export const MARK = {
  name: 'mark',
  rows: [
    '0011100',
    '0133310',
    '1311131',
    '1313331',
    '1313331',
    '1311131',
    '0133310',
    '0011100',
  ],
};

export const DEFAULTS = {
  startMs: 60000,
  /* Set against a real run rather than a guess: a quick player paints
     a picture in about 25s, so a bonus below that has them losing
     from the first one and no ramp can soften it. At 26s the first
     few pictures roughly pay for themselves, which is what makes the
     ramp the thing the player feels rather than the opening. */
  bonusMs: 26000,
  /* A wrong fill costs time rather than a life: the mistake in theming
     is picking by eye, and the cost of that is rework, not disaster. */
  penaltyMs: 3000,
  pointsPerCell: 2,
  pointsPerPicture: 30,
  /* How often the mark turns up in place of the next picture in the
     rotation. Roughly one theme in four, and never twice running. */
  markChance: 0.25,
  /* A finished picture stays up, whole, before the next one replaces
     it. Painting one cell at a time you never see the thing you are
     making; this is the beat where you do. */
  clearedHoldMs: 1400,
  /* What a finished picture buys, and how that shrinks.

     A flat bonus is why a run could go on for ever: a player quick
     enough to paint a picture in less than the bonus gains time on
     every one, and nothing ever catches up with them. Taking a slice
     off each time turns that around — the pace that was breaking even
     at picture one is losing by picture ten — and the floor keeps the
     last few from being over before they are read. */
  bonusRampMs: 900,
  bonusFloorMs: 4000,
};

/**
 * What finishing a picture is worth now.
 *
 * `finished` is the count before this one, so the first picture pays
 * the full bonus and the ramp starts biting from the second.
 */
export function bonusFor(state) {
  return Math.max(state.cfg.bonusFloorMs, state.cfg.bonusMs - state.finished * state.cfg.bonusRampMs);
}

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
 * Put a picture on the board. `index` is where the rotation stands,
 * which is not the same as which picture is showing: the mark leaves
 * the cursor where it found it.
 */
function show(state, picture, index) {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const token = Number(picture.rows[r][c]);
      cells.push({token, painted: false});
    }
  }
  /* A picture that has just gone up is never the one being looked at. */
  return {...state, picture: picture.name, cells, pictureIndex: index, cleared: null};
}

function fromRotation(state, index) {
  return show(state, PICTURES[index % PICTURES.length], index);
}

/**
 * What comes after a finished picture: usually the next one in the
 * rotation, now and then the house mark.
 *
 * The mark never follows itself — a surprise that repeats is not one —
 * and it does not move the rotation on, so it interrupts the sequence
 * rather than eating a place in it.
 */
function nextPicture(state) {
  if (state.picture !== MARK.name && state.random() < state.cfg.markChance) {
    return show(state, MARK, state.pictureIndex);
  }
  return fromRotation(state, state.pictureIndex + 1);
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
    /* `{at, until}` while a finished picture is being shown, else null. */
    cleared: null,
    over: false,
  };
  /* Every run opens on the house mark. The rotation cursor is still
     seeded, so which picture follows it varies from run to run. */
  return show(base, MARK, Math.floor(random() * PICTURES.length));
}

export function timeLeft(state, now) {
  /* The clock stops while a finished picture is being looked at: the
     beat is a reward, and a reward that costs time is a penalty. */
  const at = state.cleared ? state.cleared.at : now;
  return Math.max(0, state.endsAt - at);
}

export function select(state, token) {
  if (state.over) return state;
  if (!Number.isInteger(token) || token < 0 || token >= TOKENS.length) return state;
  return {...state, selected: token};
}

/**
 * The clock, one tick at a time: it ends the beat on a finished
 * picture, and it ends the run on an unfinished one.
 */
export function step(state, now) {
  if (state.over) return state;

  /* A finished picture is held, not timed out: nobody loses a run
     while looking at a theme they already completed. */
  if (state.cleared) {
    if (now < state.cleared.until) return state;
    /* Give back the wall-clock time the beat took. Freezing what the
       HUD reports is not enough on its own: `endsAt` is absolute, so
       without this the pause quietly spends the bonus it just paid. */
    return nextPicture({...state, endsAt: state.endsAt + (now - state.cleared.at)});
  }

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
  if (state.over || state.cleared) return state;
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

  /* Picture finished: score it, buy time, and hold it up to be looked
     at. `step` puts the next one on once the beat is over. */
  const bonus = bonusFor(next);
  return {
    ...next,
    score: next.score + next.cfg.pointsPerPicture,
    finished: next.finished + 1,
    endsAt: next.endsAt + bonus,
    /* The bonus goes in the feedback because it is now a number worth
       watching: seeing it come down is the warning that the run has
       an end, and the only one the player gets. */
    last: {result: 'finished', at: now, bonusMs: bonus},
    cleared: {at: now, until: now + next.cfg.clearedHoldMs},
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.finished)} thema's af · ${n(state.wrong)} keer misgetikt`
    : `${n(state.finished)} themes finished · ${n(state.wrong)} wrong fills`;
}
