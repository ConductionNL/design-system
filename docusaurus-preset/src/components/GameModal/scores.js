/**
 * Mini-game scores.
 *
 * The score table lives in one localStorage key, on the player's own
 * machine. There is no account and no server: a score is a thing you
 * screenshot and post, not a row we hold. That is the whole storage
 * design, and it is why nothing here needs consent.
 *
 * Shape (version 2):
 *
 *   {
 *     version: 2,
 *     games: {
 *       hexrain: {found: true, best: 12, plays: 3},
 *       boats:   {found: true, best: 18, plays: 1},
 *     }
 *   }
 *
 * Version 1 was a flat `{id: true}` map of discovered games, written
 * by every earlier build. It is migrated on read rather than dropped,
 * because a returning player's found-games progress bar would
 * otherwise reset to zero and read as a bug.
 *
 * The total is the sum of the per-game bests. Games score in different
 * units (boats sunk, apps collected, points), so the total is a tally
 * rather than a rating, and a game with big numbers weighs more. That
 * is a deliberate choice: the alternative, normalising every game onto
 * the same range, makes a score impossible to explain in the one line
 * someone posts with it.
 */

export const STORAGE_KEY = 'conduction:minigames';
export const STORAGE_VERSION = 2;

function emptyState() {
  return {version: STORAGE_VERSION, games: {}};
}

/**
 * Normalise whatever is in storage into the current shape.
 * Exported for the tests; callers use readScores().
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return emptyState();

  if (raw.version === STORAGE_VERSION && raw.games && typeof raw.games === 'object') {
    /* Re-read every entry rather than trusting the stored shape: this
       is user-writable storage, and one hand-edited value should not
       be able to make the modal throw on open. */
    const games = {};
    for (const [id, entry] of Object.entries(raw.games)) {
      if (!entry || typeof entry !== 'object') continue;
      games[id] = {
        found: Boolean(entry.found),
        best: Number.isFinite(entry.best) ? entry.best : null,
        plays: Number.isFinite(entry.plays) ? entry.plays : 0,
      };
    }
    return {version: STORAGE_VERSION, games};
  }

  /* Version 1: a flat map of discovered games, no scores kept. */
  const games = {};
  for (const [id, value] of Object.entries(raw)) {
    if (value === true) games[id] = {found: true, best: null, plays: 0};
  }
  return {version: STORAGE_VERSION, games};
}

export function readScores(storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return emptyState();
  try {
    return migrate(JSON.parse(store.getItem(STORAGE_KEY)));
  } catch (e) {
    /* Unparseable or blocked storage: play on with an empty table
       rather than breaking the game-over dialog. */
    return emptyState();
  }
}

export function writeScores(state, storage) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {/* fail open: a full or blocked store must not end the run */}
}

/**
 * Fold one game-end result into the table.
 *
 * Returns a new state; never mutates. A run that scores worse than the
 * player's best leaves the best alone, so the number they posted last
 * week does not disappear because they played once more.
 */
export function recordResult(state, {id, score} = {}) {
  if (!id) return state;
  const prev = state.games[id] || {found: false, best: null, plays: 0};
  const scored = Number.isFinite(score);
  return {
    version: STORAGE_VERSION,
    games: {
      ...state.games,
      [id]: {
        /* Any game-end counts as found: a few games (the cyclist, the
           endless ones) never reach a clean win state. */
        found: true,
        best: scored ? Math.max(prev.best ?? -Infinity, score) : prev.best,
        plays: (prev.plays || 0) + 1,
      },
    },
  };
}

export function bestFor(state, id) {
  const entry = state.games[id];
  return entry && Number.isFinite(entry.best) ? entry.best : null;
}

export function foundCount(state) {
  return Object.values(state.games).filter((g) => g && g.found).length;
}

export function totalScore(state) {
  return Object.values(state.games)
    .reduce((sum, g) => sum + (g && Number.isFinite(g.best) ? g.best : 0), 0);
}

export function formatScore(n, locale = 'en') {
  return Number(n || 0).toLocaleString(locale);
}
