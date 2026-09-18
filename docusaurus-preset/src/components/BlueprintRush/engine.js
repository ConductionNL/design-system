/**
 * Blueprint rush — the rules, with no DOM and no clock of its own.
 *
 * Buildiq's game. A blueprint asks for the parts an app needs: where
 * the records live, what one looks like, how people fill it in, who
 * may see it. The tray offers the parts plus a few that belong to
 * some other app. Fit the blueprint before the clock runs out; every
 * finished app buys you more time.
 *
 * Unlike the other two games this one is a puzzle rather than a
 * reaction test: the pressure comes from reading four slots at once,
 * not from a card you have to hit in time. Picking a part that does
 * not belong costs seconds rather than a life, because in the builder
 * a wrong part is an undo, not a disaster.
 *
 * Time and randomness are injected. The component owns the clock.
 */

/* Every part an app can need. `slot` is what the blueprint asks for,
   in the reader's words; the component supplies the sentences. */
export const PARTS = [
  'register',
  'schema',
  'form',
  'view',
  'flow',
  'permission',
  'widget',
  'notification',
];

export const DEFAULTS = {
  /* Long enough to read four slots and a tray on the first blueprint,
     and the bonus keeps a good player alive rather than the start
     being generous. */
  startMs: 30000,
  bonusMs: 7000,
  penaltyMs: 2500,
  slots: 4,
  distractors: 2,
  pointsPerApp: 25,
  comboBonus: 5,
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

function dealBlueprint(state, now) {
  const pool = shuffled(PARTS, state.random);
  const needed = pool.slice(0, state.cfg.slots);
  const distractors = pool.slice(state.cfg.slots, state.cfg.slots + state.cfg.distractors);
  return {
    ...state,
    blueprint: {
      /* Slots keep the order they were dealt in; the tray is shuffled
         separately, so the answer is never "top to bottom". */
      needed,
      filled: [],
      tray: shuffled([...needed, ...distractors], state.random),
      startedAt: now,
    },
  };
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    blueprint: null,
    score: 0,
    built: 0,
    wrong: 0,
    combo: 0,
    bestCombo: 0,
    endsAt: now + cfg.startMs,
    last: null,
    over: false,
  };
  return dealBlueprint(base, now);
}

/** Milliseconds left on the clock, never negative. */
export function timeLeft(state, now) {
  return Math.max(0, state.endsAt - now);
}

/** Advance to `now`. The only thing the clock can do here is end it. */
export function step(state, now) {
  if (state.over) return state;
  if (timeLeft(state, now) > 0) return state;
  return {...state, over: true, last: {result: 'timeout', at: now}};
}

/**
 * Put `part` on the blueprint.
 *
 * A part the blueprint does not ask for, or one already placed, costs
 * seconds. Completing the blueprint scores, adds time and deals the
 * next one.
 */
export function place(state, part, now) {
  if (state.over || !state.blueprint) return state;

  const {needed, filled} = state.blueprint;
  const wanted = needed.includes(part);
  const already = filled.includes(part);

  if (!wanted || already) {
    const endsAt = state.endsAt - state.cfg.penaltyMs;
    const out = {
      ...state,
      endsAt,
      wrong: state.wrong + 1,
      combo: 0,
      last: {result: already ? 'duplicate' : 'wrong', part, at: now},
    };
    /* The penalty can end the run: check here rather than waiting for
       the next tick, so the game does not keep taking clicks after the
       clock has already gone. */
    return timeLeft(out, now) > 0 ? out : {...out, over: true};
  }

  const nextFilled = [...filled, part];
  const done = nextFilled.length === needed.length;

  if (!done) {
    return {
      ...state,
      blueprint: {...state.blueprint, filled: nextFilled},
      last: {result: 'placed', part, at: now},
    };
  }

  const combo = state.combo + 1;
  const gained = state.cfg.pointsPerApp + (combo - 1) * state.cfg.comboBonus;
  const built = {
    ...state,
    blueprint: {...state.blueprint, filled: nextFilled},
    score: state.score + gained,
    built: state.built + 1,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    endsAt: state.endsAt + state.cfg.bonusMs,
    last: {result: 'built', points: gained, at: now},
  };
  return dealBlueprint(built, now);
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.built)} apps gebouwd · reeks ${n(state.bestCombo)}`
    : `${n(state.built)} apps built · streak ${n(state.bestCombo)}`;
}
