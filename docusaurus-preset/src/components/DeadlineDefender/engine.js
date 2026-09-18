/**
 * Deadline defender — the rules, with no DOM and no clock of its own.
 *
 * Dossiq's game. A case arrives with a legal deadline already running,
 * and the only question is which step it goes to next. Send it to the
 * right one before the clock runs out. Send it to the wrong one and
 * you have moved a case backwards in front of a resident who can see
 * their own file.
 *
 * One case at a time, on purpose: the stamp-rush board is six things
 * at once, and two games with the same shape would be one game twice.
 * Here the pressure is the clock on a single decision, which is the
 * pressure the app is about.
 *
 * Time and randomness are injected. The component owns the clock.
 */

export const INTAKE = 'intake';
export const REVIEW = 'review';
export const DECISION = 'decision';
export const LANES = [INTAKE, REVIEW, DECISION];

/* Each case is one of these situations. `needs` is the only correct
   lane; the text is what the player reads to work that out, which is
   why every situation reads as a sentence from a real case file. */
export const SITUATIONS = [
  {key: 'permitReceived', needs: INTAKE},
  {key: 'objectionReceived', needs: INTAKE},
  {key: 'complaintReceived', needs: INTAKE},
  {key: 'documentsComplete', needs: REVIEW},
  {key: 'siteVisitDone', needs: REVIEW},
  {key: 'adviceReturned', needs: REVIEW},
  {key: 'assessmentDone', needs: DECISION},
  {key: 'objectionAssessed', needs: DECISION},
  {key: 'enforcementReady', needs: DECISION},
];

export const DEFAULTS = {
  lives: 3,
  /* A case has to be read before it can be routed, so the first ones
     get three seconds. The floor is the point where a fast reader can
     still finish the sentence. */
  clockStartMs: 3200,
  clockFloorMs: 1300,
  rampPerPoint: 3,
  /* The beat between finishing one case and the next arriving. Long
     enough to see what happened, short enough to keep the queue
     breathing down your neck. */
  gapMs: 320,
  pointsPerCase: 10,
  comboBonus: 2,
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

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const state = {
    cfg,
    random: mulberry32(seed),
    current: null,
    nextAt: now,
    score: 0,
    lives: cfg.lives,
    combo: 0,
    bestCombo: 0,
    handled: 0,
    missed: 0,
    misrouted: 0,
    last: null,
    over: false,
  };
  return state;
}

/** How long the current difficulty gives you to read and route. */
export function clockMs(state) {
  const {cfg, score} = state;
  return Math.max(cfg.clockFloorMs, cfg.clockStartMs - score * cfg.rampPerPoint);
}

function loseLife(state, reason) {
  const lives = state.lives - 1;
  return {
    ...state,
    lives,
    combo: 0,
    last: {result: reason, at: state.nextAt},
    over: lives <= 0,
  };
}

function deal(state, now) {
  const pick = SITUATIONS[Math.floor(state.random() * SITUATIONS.length)];
  /* The case number is cosmetic, but a case without one does not read
     as a case. */
  const year = 2026;
  const seq = 100 + Math.floor(state.random() * 900);
  return {
    ...state,
    current: {
      ...pick,
      id: `${year}-${seq}`,
      bornAt: now,
      expiresAt: now + clockMs(state),
    },
  };
}

/**
 * Advance to `now`: let an unanswered case run out of time, then deal
 * the next one once the gap has passed.
 */
export function step(state, now) {
  if (state.over) return state;
  let next = state;

  if (next.current && now >= next.current.expiresAt) {
    next = {...loseLife(next, 'missed'), current: null, missed: next.missed + 1, nextAt: now + next.cfg.gapMs};
    if (next.over) return next;
  }

  if (!next.current && now >= next.nextAt) {
    next = deal(next, now);
  }

  return next;
}

/**
 * Route the case on the desk to `lane`.
 *
 * Routing to the wrong step costs a life. There is no partial credit:
 * a case in the wrong queue is not half-handled, it is lost until
 * somebody notices.
 */
export function route(state, lane, now) {
  if (state.over || !state.current) return state;
  if (!LANES.includes(lane)) return state;

  const correct = state.current.needs === lane;
  if (!correct) {
    return {
      ...loseLife(state, 'misrouted'),
      current: null,
      misrouted: state.misrouted + 1,
      nextAt: now + state.cfg.gapMs,
    };
  }

  const combo = state.combo + 1;
  const gained = state.cfg.pointsPerCase + (combo - 1) * state.cfg.comboBonus;
  return {
    ...state,
    current: null,
    nextAt: now + state.cfg.gapMs,
    score: state.score + gained,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    handled: state.handled + 1,
    last: {result: 'handled', points: gained, at: now},
  };
}

/** How much of the deadline is left, 1 to 0, for the countdown bar. */
export function remaining(state, now) {
  if (!state.current) return 0;
  const total = state.current.expiresAt - state.current.bornAt;
  if (total <= 0) return 0;
  const left = (state.current.expiresAt - now) / total;
  return Math.min(1, Math.max(0, left));
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.handled)} zaken op tijd · reeks ${n(state.bestCombo)}`
    : `${n(state.handled)} cases on time · streak ${n(state.bestCombo)}`;
}
