/**
 * Stamp rush — the rules, with no DOM and no clock of its own.
 *
 * Decidiq's game. Decisions land on your desk faster than you can read
 * them, and the whole job is telling apart the ones you may adopt from
 * the ones you may not. Stamping a decision that has no quorum, or one
 * you should have declared an interest in, is the mistake the app
 * exists to prevent, so here it costs you.
 *
 * Time and randomness are injected. The component owns the clock; this
 * file owns the rules, which is what makes them testable and what
 * keeps the arcade from being the only place they are written down.
 *
 *   let s = createGame({seed: 7});
 *   s = step(s, now);          // expire what is stale, spawn what is due
 *   s = stamp(s, slotIndex, now);
 */

export const SLOTS = 6;

/* Card kinds. Only `ready` may be stamped; the other two are the
   decisions a secretary is supposed to hold back. */
export const READY = 'ready';
export const NO_QUORUM = 'noQuorum';
export const CONFLICT = 'conflict';

export const DEFAULTS = {
  lives: 3,
  /* Spawn cadence and card lifetime both tighten as the score climbs,
     which is the whole difficulty curve. The floors are what a person
     can still react to: under about 400ms between cards the board
     stops being readable, and a card that lives under 900ms cannot be
     read before it has to be judged. */
  spawnStartMs: 1100,
  spawnFloorMs: 420,
  lifeStartMs: 1900,
  lifeFloorMs: 900,
  rampPerPoint: 1.4,
  /* Two in five cards must be held back. Fewer and the game is a
     clicking exercise; more and it is mostly waiting. */
  badShare: 0.4,
  pointsPerAdopt: 10,
  comboBonus: 2,
};

/* A small deterministic generator, so a test can pin a run and a
   player still gets a different board every time. */
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
  return {
    cfg,
    random: mulberry32(seed),
    slots: Array.from({length: SLOTS}, () => null),
    score: 0,
    lives: cfg.lives,
    combo: 0,
    bestCombo: 0,
    adopted: 0,
    held: 0,
    mistakes: 0,
    startedAt: now,
    nextSpawnAt: now + cfg.spawnStartMs,
    /* Where and when a decision was last let lapse, so the board can
       show the life it cost. Null until one is. */
    lastMiss: null,
    over: false,
  };
}

/** Interval and lifetime at the current score. */
export function tempo(state) {
  const {cfg, score} = state;
  const shed = score * cfg.rampPerPoint;
  return {
    spawnMs: Math.max(cfg.spawnFloorMs, cfg.spawnStartMs - shed),
    lifeMs: Math.max(cfg.lifeFloorMs, cfg.lifeStartMs - shed),
  };
}

function loseLife(state) {
  const lives = state.lives - 1;
  return {...state, lives, combo: 0, mistakes: state.mistakes + 1, over: lives <= 0};
}

/**
 * Advance the board to `now`: expire cards whose time is up, then
 * spawn at most one card per call into a free slot.
 *
 * Letting a ready decision expire costs a life. Letting one of the
 * others expire is the correct call and costs nothing, which is the
 * only way the game can reward restraint.
 */
export function step(state, now) {
  if (state.over) return state;
  let next = {...state, slots: [...state.slots]};

  for (let i = 0; i < next.slots.length; i++) {
    const card = next.slots[i];
    if (!card || now < card.expiresAt) continue;
    next.slots[i] = null;
    if (card.kind === READY) {
      next = {...loseLife(next), slots: next.slots};
      /* Say where it happened and when. Letting a decision lapse
         costs exactly what a bad stamp costs, but the player did
         nothing, so without a record of it the life just goes and
         the board looks the same as a card timing out harmlessly. */
      next.lastMiss = {slot: i, at: now};
      if (next.over) return next;
    } else {
      next.held = next.held + 1;
    }
  }

  if (now >= next.nextSpawnAt) {
    const free = [];
    for (let i = 0; i < next.slots.length; i++) if (!next.slots[i]) free.push(i);
    if (free.length) {
      const {spawnMs, lifeMs} = tempo(next);
      const slot = free[Math.floor(next.random() * free.length)];
      const roll = next.random();
      const kind = roll < next.cfg.badShare
        ? (roll < next.cfg.badShare / 2 ? NO_QUORUM : CONFLICT)
        : READY;
      next.slots[slot] = {
        kind,
        id: `${slot}-${Math.round(now)}`,
        bornAt: now,
        expiresAt: now + lifeMs,
        /* Shown on the card so the player has something to read
           rather than a colour to memorise. */
        quorum: kind === NO_QUORUM
          ? {have: 2 + Math.floor(next.random() * 3), need: 7}
          : {have: 7, need: 7},
      };
      next.nextSpawnAt = now + spawnMs;
    } else {
      /* Board full: try again shortly rather than skipping a beat. */
      next.nextSpawnAt = now + 120;
    }
  }

  return next;
}

/**
 * Stamp the card in `slot`.
 *
 * Stamping an empty slot is not punished: the game is about judging
 * what is in front of you, and a jumpy hand is not the mistake being
 * taught here.
 */
export function stamp(state, slot, now) {
  if (state.over) return state;
  const card = state.slots[slot];
  if (!card) return state;

  const slots = [...state.slots];
  slots[slot] = null;

  if (card.kind !== READY) {
    return {...loseLife({...state, slots}), slots};
  }

  const combo = state.combo + 1;
  const gained = state.cfg.pointsPerAdopt + (combo - 1) * state.cfg.comboBonus;
  return {
    ...state,
    slots,
    score: state.score + gained,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    adopted: state.adopted + 1,
    lastGain: {slot, points: gained, at: now},
  };
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.adopted)} besluiten vastgesteld · reeks ${n(state.bestCombo)}`
    : `${n(state.adopted)} decisions adopted · streak ${n(state.bestCombo)}`;
}
