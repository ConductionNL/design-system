/**
 * Blueprint rush — the rules, with no DOM and no clock of its own.
 *
 * Buildiq's game. An app is a flow: records have to exist before you
 * can describe them, a description has to exist before anyone can
 * fill one in, and nothing can be sent about a step that has not been
 * built yet. The shelf holds this app's parts and nothing else. Lay
 * them left to right in an order that works, before the clock runs
 * out.
 *
 * The puzzle is the order, and only the order. Every part says what
 * it needs, so a part whose needs are already on the rail can always
 * be laid — there is no second, invisible reason for a refusal.
 *
 * The shelf used to carry a couple of parts belonging to other apps.
 * It was a fair mechanic on paper and a bad one in the hand: a card
 * states what it needs, a player reads that, sees the need met, and
 * is charged for a rule the card had no way to express. Cards are
 * the only thing anybody reads, so anything a card cannot say cannot
 * be a rule.
 *
 * The player lays parts at the next empty place on the rail rather
 * than anywhere on it. That is deliberate: choosing arbitrary gaps
 * lets someone strand themselves with a legal-looking rail and no
 * legal move left, and an unsolvable puzzle on a clock reads to the
 * player as a broken game.
 *
 * A rail can still arrive with parts already on it, at any place
 * along its length — which is where the variety comes from, since
 * the set of parts alone made every early flow look the same. Those
 * sit at their own index in a working order, so what the player has
 * to fit around them always has a solution.
 *
 * Time and randomness are injected. The component owns the clock.
 */

/**
 * Every part an app can be made of, and what has to come before it.
 *
 * A directed graph with no cycles, so every set drawn from it can be
 * laid in at least one working order. The deepest chain is five —
 * register, schema, form, flow, notification — which is what gives
 * the later blueprints somewhere to grow into.
 */
export const PARTS = {
  register: {needs: []},
  /* Rights are granted over something, so this cannot precede the
     thing it governs. It was briefly a second root, to stop every
     flow opening the same way — but that bought variety by letting
     the rail spell out "a group and its rights, then a register",
     which is not an app anybody has ever built. The head start does
     that job now, and does it without lying about the domain. */
  permission: {needs: ['register']},
  schema: {needs: ['register']},
  form: {needs: ['schema']},
  view: {needs: ['schema']},
  flow: {needs: ['form']},
  widget: {needs: ['view']},
  notification: {needs: ['flow']},
};

export const PART_KEYS = Object.keys(PARTS);

export const DEFAULTS = {
  /* Long enough to read a rail and a tray on the first flow, with the
     bonus keeping a good player alive rather than the start being
     generous. */
  startMs: 30000,
  penaltyMs: 2500,
  /* What an app buys, and how that runs down.

     A flat bonus is why this could go on for ever: seven seconds for
     work that takes three is a profit on every app, and a growing
     rail does not fix it — a wider rail is more clicks but it is also
     more apps' worth of time. The floor sits below the fastest anyone
     can lay a full six-part rail, so the last few apps cost more than
     they pay however well they are played. */
  bonusMs: 7000,
  bonusRampMs: 600,
  bonusFloorMs: 1500,
  /* Asking which part is ready costs less than getting it wrong, so
     a player who does not know the order yet has a way to find out
     that is cheaper than guessing. It still costs: a free hint is
     just the answer printed on the card, which is what this game had
     before and what made it play itself. */
  hintMs: 1500,
  /* The rail grows as the player gets going, which is what stops the
     fiftieth app being the fourth app again. Capped because the tray
     has to stay readable at a glance. */
  startSlots: 3,
  maxSlots: 6,
  growEvery: 3,
  /* How much of a flow can arrive already built. */
  headStartMax: 2,
  /* A finished flow stays up to be looked at before the next one
     replaces it. Laying the last part and having the board blank
     itself on the same tick is the reward for finishing being the
     thing you finished disappearing. */
  clearedHoldMs: 1300,
  pointsPerPart: 4,
  pointsPerApp: 25,
  /* A streak pays more, but not without limit. Uncapped it is
     quadratic in the length of the run — the fiftieth app in a row
     was worth two hundred and seventy — which put a good run an
     order of magnitude above every other game on the site, and the
     arcade adds them all together. */
  comboBonus: 5,
  comboCap: 10,
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

/** How many places the rail has, this far into a run. */
export function slotsFor(cfg, built) {
  return Math.min(cfg.maxSlots, cfg.startSlots + Math.floor(built / cfg.growEvery));
}

/**
 * What finishing an app is worth now.
 *
 * `built` is the count before this one, so the first app pays the
 * full bonus and the ramp starts biting from the second.
 */
export function bonusFor(state) {
  return Math.max(state.cfg.bonusFloorMs, state.cfg.bonusMs - state.built * state.cfg.bonusRampMs);
}

/**
 * Choose the parts this app is made of.
 *
 * Grown outward from what is already in, never picked at random: a
 * set drawn by chance can ask for a form with no schema anywhere,
 * which is a blueprint nobody can finish. Growing it this way means
 * the set is closed under `needs` by construction, and the order it
 * came out in is proof that at least one working order exists.
 */
function chooseParts(random, size) {
  const chosen = [];
  while (chosen.length < size) {
    const ready = PART_KEYS.filter(
      (p) => !chosen.includes(p) && PARTS[p].needs.every((n) => chosen.includes(n)),
    );
    if (!ready.length) break;
    chosen.push(ready[Math.floor(random() * ready.length)]);
  }
  return chosen;
}

function dealFlow(state, now) {
  const size = slotsFor(state.cfg, state.built);
  /* A working order, which is also where each part belongs. */
  const needed = chooseParts(state.random, size);

  /* Some flows arrive part-built, at any place along the rail rather
     than only at the front. Two reasons: it varies an opening that
     was otherwise the same three parts every time, and a rail with
     something already on it reads as a flow somebody started rather
     than a form to fill in.

     Anything pre-laid sits at its own index in a working order, so
     it can never contradict what the player has to put around it,
     and at least two places are always left to lay — a flow that
     deals itself nearly finished is not a puzzle. */
  const laid = new Array(size).fill(null);
  const free = Math.max(0, Math.min(state.cfg.headStartMax, size - 2));
  const count = free ? Math.floor(state.random() * (free + 1)) : 0;
  for (const i of shuffled([...needed.keys()], state.random).slice(0, count)) {
    laid[i] = needed[i];
  }

  const toLay = needed.filter((p, i) => laid[i] === null);

  return {
    ...state,
    flow: {
      needed,
      /* The rail, left to right. `null` is a place not yet laid. */
      laid,
      tray: shuffled(toLay, state.random),
      /* The part the last hint pointed at, until something lands. */
      hinted: null,
      /* Parts tried and refused since the last one that stuck. These
         come back when the rail moves, because "too early" stops
         being true the moment something lands. */
      rejected: [],
      startedAt: now,
    },
  };
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    flow: null,
    score: 0,
    built: 0,
    wrong: 0,
    combo: 0,
    bestCombo: 0,
    endsAt: now + cfg.startMs,
    last: null,
    /* `{at, until}` while a finished flow is being shown. */
    cleared: null,
    over: false,
  };
  return dealFlow(base, now);
}

/** Milliseconds left on the clock, never negative. */
export function timeLeft(state, now) {
  /* The clock stops on a finished flow: the beat spent looking at
     something that works should not be charged to the player. */
  const at = state.cleared ? state.cleared.at : now;
  return Math.max(0, state.endsAt - at);
}

/**
 * Advance to `now`: end the beat on a finished flow, or end the run
 * on one that never got finished.
 */
export function step(state, now) {
  if (state.over) return state;

  if (state.cleared) {
    if (now < state.cleared.until) return state;
    /* Hand back the wall-clock time the beat took. Freezing what
       `timeLeft` reports is not enough on its own — `endsAt` is
       absolute, so without this the pause quietly spends part of
       the bonus it just paid out. */
    const back = {...state, endsAt: state.endsAt + (now - state.cleared.at), cleared: null};
    return dealFlow(back, now);
  }

  if (timeLeft(state, now) > 0) return state;
  return {...state, over: true, last: {result: 'timeout', at: now}};
}

/** What is on the rail, in order, ignoring the places still empty. */
export function laidParts(state) {
  return state.flow ? state.flow.laid.filter(Boolean) : [];
}

/** The next place a part would go, or -1 when the rail is full. */
export function nextSlot(state) {
  return state.flow ? state.flow.laid.indexOf(null) : -1;
}

/**
 * Can this part be laid right now?
 *
 * Returns null when it can, or why it cannot — which the component
 * uses both to explain a refusal and to show, before anybody drags
 * anything, which parts are ready and which are waiting on something.
 */
export function refuse(state, part) {
  if (!state.flow) return 'foreign';
  if (laidParts(state).includes(part)) return 'duplicate';
  if (!state.flow.needed.includes(part)) return 'foreign';

  /* Only what sits behind the place this part would take counts.
     Measuring against the whole rail would let a part already laid
     further along satisfy a need, which is backwards: a flow runs
     left to right, and something downstream cannot feed something
     upstream of it. It matters because a rail can be dealt with
     parts already on it, anywhere along its length. */
  const at = nextSlot(state);
  if (at < 0) return 'duplicate';
  const behind = state.flow.laid.slice(0, at).filter(Boolean);

  const missing = PARTS[part] ? PARTS[part].needs.filter((n) => !behind.includes(n)) : [];
  return missing.length ? 'early' : null;
}

/**
 * Ask which part can go down next.
 *
 * Points at one that is ready and charges for it. This is the only
 * place the game will tell you an answer, and it is deliberately
 * cheaper than laying the wrong part: someone who has not learned
 * the order yet should find out by asking rather than by paying the
 * full penalty to be told the same thing.
 *
 * A hint is not a mistake, so it leaves the streak alone.
 */
export function hint(state, now) {
  if (state.over || !state.flow || state.cleared) return state;

  const ready = state.flow.tray.find((p) => refuse(state, p) === null);
  if (!ready) return state;

  const out = {
    ...state,
    endsAt: state.endsAt - state.cfg.hintMs,
    flow: {...state.flow, hinted: ready},
    last: {result: 'hinted', part: ready, at: now},
  };
  return timeLeft(out, now) > 0 ? out : {...out, over: true};
}

/**
 * Lay `part` at the next empty place on the rail.
 *
 * A part that belongs to another app, one already on the rail, or one
 * whose needs are not met yet all cost seconds and stay in the tray.
 * Finishing the flow scores, buys time and deals the next one.
 */
export function place(state, part, now) {
  if (state.over || !state.flow || state.cleared) return state;

  const why = refuse(state, part);
  if (why) {
    const at = nextSlot(state);
    const behind = at < 0 ? [] : state.flow.laid.slice(0, at).filter(Boolean);
    const missing = why === 'early'
      ? PARTS[part].needs.filter((n) => !behind.includes(n))
      : [];
    const out = {
      ...state,
      endsAt: state.endsAt - state.cfg.penaltyMs,
      wrong: state.wrong + 1,
      combo: 0,
      /* Ruled out until something lands. It stops taking clicks so
         one refusal cannot be paid for twice, and comes back the
         moment the rail moves, because "not yet" stops being true
         as soon as something goes down. */
      flow: {...state.flow, rejected: [...state.flow.rejected, part]},
      last: {result: why, part, missing, at: now},
    };
    /* The penalty can end the run: check here rather than waiting for
       the next tick, so the game does not keep taking parts after the
       clock has already gone. */
    return timeLeft(out, now) > 0 ? out : {...out, over: true};
  }

  const at = nextSlot(state);
  const laid = [...state.flow.laid];
  laid[at] = part;
  const done = laid.every(Boolean);
  const scored = {...state, score: state.score + state.cfg.pointsPerPart};

  if (!done) {
    return {
      ...scored,
      /* A hint is spent the moment anything lands, whether or not it
         was the part being pointed at, and every refusal is
         forgiven: the rail moved, so the reasons have changed. */
      flow: {...state.flow, laid, hinted: null, rejected: []},
      last: {result: 'laid', part, at: now, index: at},
    };
  }

  const combo = state.combo + 1;
  const gained = state.cfg.pointsPerApp
    + Math.min(combo - 1, state.cfg.comboCap) * state.cfg.comboBonus;
  const bonus = bonusFor(state);
  /* The finished flow stays up, whole, until the hold is over;
     `step` puts the next one on. Scoring happens now so the HUD
     moves on the click that earned it. */
  return {
    ...scored,
    flow: {...state.flow, laid, hinted: null, rejected: []},
    score: scored.score + gained,
    built: state.built + 1,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    endsAt: state.endsAt + bonus,
    cleared: {at: now, until: now + state.cfg.clearedHoldMs},
    last: {result: 'built', points: gained, bonusMs: bonus, at: now},
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.built)} apps gebouwd · reeks ${n(state.bestCombo)}`
    : `${n(state.built)} apps built · streak ${n(state.bestCombo)}`;
}
