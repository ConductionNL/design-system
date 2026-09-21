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
 * Three things the rest of the arcade learned first, applied here.
 *
 * The case is COMPOSED rather than drawn from a list. A subject, one
 * stage clause that decides the lane, and — as the score climbs — one
 * or two true but irrelevant clauses shuffled in among it. Nine fixed
 * sentences could be learned in a minute, and were: the tell sat in
 * the second clause of every one of them. Here the governing clause
 * can be anywhere in the paragraph and the same subject turns up in
 * every lane, so the sentence has to be read to the end.
 *
 * The clock is measured PER WORD, and its ramp counts cases handled
 * rather than points scored. A long case gets the time to read it, so
 * what tightens with the score is the pace and not the arithmetic —
 * and the streak bonus no longer compounds the ramp, which is how the
 * old clock reached a speed nobody could read at by the twenty-third
 * case.
 *
 * And every outcome is HELD, long enough to see which lane the case
 * should have gone to. A margin that drops without saying why teaches
 * nothing.
 *
 * Time and randomness are injected. The component owns the clock.
 */

export const INTAKE = 'intake';
export const REVIEW = 'review';
export const DECISION = 'decision';
/* The fourth answer: a case that takes no next step at all. Without
   it three buttons can be played by elimination — rule out two and
   the third is free. */
export const OFF = 'off';
export const LANES = [INTAKE, REVIEW, DECISION, OFF];

/* The subject is a label on the file, not a hint: every subject can
   turn up in front of every stage, so recognising the word "objection"
   tells you nothing about where the case goes. `words` is the length
   of the English label, which is what the clock is priced against. */
export const SUBJECTS = [
  {key: 'permit', words: 2},
  {key: 'objection', words: 1},
  {key: 'complaint', words: 1},
  {key: 'enforcement', words: 2},
  {key: 'subsidy', words: 2},
];

/* The one clause that decides the lane. Every stage reads as a state
   the file is in rather than an instruction, because the player is
   meant to work out the step, not be told it. */
export const STAGES = [
  {key: 'justArrived', needs: INTAKE, words: 13},
  {key: 'notLogged', needs: INTAKE, words: 10},
  {key: 'fileComplete', needs: REVIEW, words: 11},
  {key: 'adviceBack', needs: REVIEW, words: 12},
  {key: 'draftWritten', needs: DECISION, words: 10},
  {key: 'awaitingSignature', needs: DECISION, words: 11},
  {key: 'withdrawn', needs: OFF, words: 10},
  {key: 'alreadyDecided', needs: OFF, words: 11},
  {key: 'otherAuthority', needs: OFF, words: 8},
];

/* True of the case, and irrelevant to where it goes. These are the
   difficulty: the clock pays for the words, so what they cost is the
   search for the clause that governs. */
export const NOISE = [
  {key: 'calledTwice', words: 7},
  {key: 'filedOnPaper', words: 10},
  {key: 'thickFile', words: 6},
  {key: 'pressAsked', words: 9},
  {key: 'sameStreet', words: 9},
  {key: 'handlerAway', words: 8},
];

export const DEFAULTS = {
  /* What a run can afford to get wrong. A margin rather than three
     lives, so one fumble is a quarter of the run instead of a third,
     and so the bar can show the damage draining rather than a heart
     vanishing. The two failures are priced the same on purpose: in a
     real queue a case in the wrong step and a case past its date both
     end up somewhere nobody is looking. */
  margin: 100,
  cost: {
    misrouted: 30,
    missed: 30,
  },

  /* The clock, per word of the case in front of you. It opens at
     380ms a word — a little over two and a half words a second, an
     unhurried read — and comes down to 165, which is six a second:
     brisk, and still a speed people read at. The old floor asked for
     fourteen words a second, which only recognition can serve, and
     that is the whole bug this replaces.

     The ramp counts cases handled, not points scored. Off the score
     it compounded, because the streak bonus makes the score grow as
     the square of the streak, so the pace collapsed exactly as the
     player got good at it. Six milliseconds a case reaches the floor
     at case thirty-six.

     Set against a reader model that also spends 250ms deciding and
     pressing: 2.5 words a second runs out around case four, three
     around twelve, four around twenty-five, five around thirty-three.
     Past about five and a half the clock stops being what ends a run
     and the margin takes over, which is the right way round — a fast
     reader should lose to a case they misjudged, not to a bar they
     cannot outrun. */
  msPerWord: 380,
  floorMsPerWord: 165,
  rampPerCase: 6,
  /* Reading is not the whole job — deciding and reaching the key is
     the rest, and it does not get shorter for a short case. */
  reactMs: 700,
  /* The counts above are the English ones. A locale whose words take
     longer to read says so here rather than being quietly rushed —
     see the component, which sets it per locale. */
  wordScale: 1,

  /* The case grows instead of the clock shrinking: one irrelevant
     clause once six cases are behind you, a second after fourteen. */
  noiseSteps: [6, 14],
  maxNoise: 2,

  /* Every outcome is held on screen for a beat of its own length.

     A mistake gets long enough to read the lane it should have gone
     to, which is the only moment in the game that can teach the rule.

     A hit needs no reading, but it does need landing: at the 420ms
     this started on, the green was gone before it registered as
     anything, and a run of correct answers felt like nothing
     happening. Long enough to see the lane light up and the points
     land, short enough that a good streak still feels quick. */
  hitHoldMs: 800,
  missHoldMs: 1600,
  wrongHoldMs: 1900,

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
  const cfg = {...DEFAULTS, ...config, cost: {...DEFAULTS.cost, ...(config.cost || {})}};
  const state = {
    cfg,
    random: mulberry32(seed),
    current: null,
    /* The outcome being held on screen, or null while a case is live. */
    verdict: null,
    nextAt: now,
    score: 0,
    margin: cfg.margin,
    combo: 0,
    bestCombo: 0,
    handled: 0,
    missed: 0,
    misrouted: 0,
    over: false,
  };
  return state;
}

/** How many irrelevant clauses a case carries at this point in a run. */
export function noiseCount(state) {
  const {cfg, handled} = state;
  const earned = cfg.noiseSteps.filter((at) => handled >= at).length;
  return Math.min(cfg.maxNoise, earned);
}

/** Every word the player has to read to answer, subject line included. */
export function caseWords(c) {
  if (!c) return 0;
  return c.clauses.reduce((n, cl) => n + cl.words, c.subject.words);
}

/**
 * How long this case gives you. Per word, so a case that grew gets
 * the time to read it, plus a flat allowance for deciding.
 */
export function clockMs(state, c) {
  const {cfg, handled} = state;
  const perWord = Math.max(cfg.floorMsPerWord, cfg.msPerWord - handled * cfg.rampPerCase);
  return Math.round(perWord * caseWords(c) * cfg.wordScale) + cfg.reactMs;
}

/** Fisher-Yates against the injected stream, so a seed replays. */
function shuffled(list, random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

/** Compose the next case and put it on the desk. */
function deal(state, now) {
  const subject = pick(SUBJECTS, state.random);
  const stage = pick(STAGES, state.random);
  const wanted = noiseCount(state);
  const noise = shuffled(NOISE, state.random).slice(0, wanted);

  /* The stage clause is shuffled in with the noise rather than always
     leading, or the rest of the paragraph could be skipped. */
  const clauses = shuffled(
    [{...stage, kind: 'stage'}, ...noise.map((n) => ({...n, kind: 'noise'}))],
    state.random,
  );

  const year = 2026;
  const seq = 100 + Math.floor(state.random() * 900);
  const next = {
    ...state,
    current: {
      id: `${year}-${seq}`,
      subject,
      stage,
      clauses,
      needs: stage.needs,
      bornAt: now,
      expiresAt: 0,
    },
  };
  next.current.expiresAt = now + clockMs(state, next.current);
  return next;
}

function charge(state, reason, now, verdict) {
  const margin = Math.max(0, state.margin - state.cfg.cost[reason]);
  return {
    ...state,
    margin,
    combo: 0,
    current: null,
    verdict,
    nextAt: verdict.until,
    over: margin <= 0,
  };
}

/**
 * Advance to `now`: clear a verdict once its beat is up, let an
 * unanswered case run out of time, then deal the next one.
 */
export function step(state, now) {
  if (state.over) return state;
  let next = state;

  if (next.verdict && now >= next.verdict.until) {
    next = {...next, verdict: null};
  }

  if (next.current && now >= next.current.expiresAt) {
    const until = now + next.cfg.missHoldMs;
    next = charge({...next, missed: next.missed + 1}, 'missed', now, {
      result: 'missed',
      case: next.current,
      sentTo: null,
      shouldHaveBeen: next.current.needs,
      points: 0,
      until,
    });
    /* The beat still plays on the last case: the run is over, and the
       lane it should have gone to is the last thing the player sees. */
    if (next.over) return next;
  }

  if (!next.current && !next.verdict && now >= next.nextAt) {
    next = deal(next, now);
  }

  return next;
}

/**
 * Route the case on the desk to `lane`.
 *
 * There is no partial credit: a case in the wrong queue is not
 * half-handled, it is lost until somebody notices.
 */
export function route(state, lane, now) {
  if (state.over || !state.current) return state;
  if (!LANES.includes(lane)) return state;

  const c = state.current;

  if (c.needs !== lane) {
    const until = now + state.cfg.wrongHoldMs;
    return charge({...state, misrouted: state.misrouted + 1}, 'misrouted', now, {
      result: 'misrouted',
      case: c,
      sentTo: lane,
      shouldHaveBeen: c.needs,
      points: 0,
      until,
    });
  }

  const combo = state.combo + 1;
  const gained = state.cfg.pointsPerCase + (combo - 1) * state.cfg.comboBonus;
  const until = now + state.cfg.hitHoldMs;
  return {
    ...state,
    current: null,
    verdict: {
      result: 'handled',
      case: c,
      sentTo: lane,
      shouldHaveBeen: lane,
      points: gained,
      until,
    },
    nextAt: until,
    score: state.score + gained,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    handled: state.handled + 1,
  };
}

/** How much of the deadline is left, 1 to 0, for the countdown bar. */
export function remaining(state, now) {
  if (!state.current) return state.verdict ? 0 : 1;
  const total = state.current.expiresAt - state.current.bornAt;
  if (total <= 0) return 0;
  const left = (state.current.expiresAt - now) / total;
  return Math.min(1, Math.max(0, left));
}

/** How much of the margin is left, 1 to 0, for the damage bar. */
export function marginLeft(state) {
  if (!state.cfg.margin) return 0;
  return Math.min(1, Math.max(0, state.margin / state.cfg.margin));
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.handled)} zaken op tijd · reeks ${n(state.bestCombo)}`
    : `${n(state.handled)} cases on time · streak ${n(state.bestCombo)}`;
}
