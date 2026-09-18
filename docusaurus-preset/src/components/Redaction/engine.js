/**
 * Redaction — the rules, with no DOM and no clock of its own.
 *
 * Filinq's game. A document is about to be published. Black out
 * everything in it that may not go out, before it does. A name, a
 * citizen number, an address, a bank account, a date of birth: leave
 * one in and it is a data breach, black out the whole thing and you
 * have published a page of stripes.
 *
 * Both mistakes cost, and they cost differently, which is the point.
 * Missing something is a breach and ends the document. Over-redacting
 * is a nuisance: it costs points, not the run.
 *
 * Time and randomness are injected. The component owns the clock.
 */

/* Every document is a list of tokens. `secret` marks what may not be
   published; everything else is the sentence around it. The component
   supplies the words. */
export const DOCUMENTS = [
  {
    key: 'permit',
    tokens: [
      {t: 'permitIntro'}, {t: 'name', secret: true}, {t: 'permitMiddle'},
      {t: 'address', secret: true}, {t: 'permitTail'}, {t: 'bsn', secret: true},
      {t: 'permitEnd'},
    ],
  },
  {
    key: 'invoice',
    tokens: [
      {t: 'invoiceIntro'}, {t: 'company'}, {t: 'invoiceMiddle'},
      {t: 'iban', secret: true}, {t: 'invoiceTail'}, {t: 'amount'},
      {t: 'invoiceEnd'}, {t: 'email', secret: true},
    ],
  },
  {
    key: 'objection',
    tokens: [
      {t: 'objectionIntro'}, {t: 'name', secret: true}, {t: 'objectionMiddle'},
      {t: 'birthdate', secret: true}, {t: 'objectionTail'}, {t: 'caseNumber'},
      {t: 'objectionEnd'},
    ],
  },
  {
    key: 'report',
    tokens: [
      {t: 'reportIntro'}, {t: 'department'}, {t: 'reportMiddle'},
      {t: 'phone', secret: true}, {t: 'reportTail'}, {t: 'name', secret: true},
      {t: 'reportEnd'}, {t: 'policy'},
    ],
  },
];

export const DEFAULTS = {
  lives: 3,
  /* Reading a document takes longer than judging a card, and the whole
     game is reading. The floor is where a fast reader still finishes
     the page. */
  clockStartMs: 14000,
  clockFloorMs: 6000,
  rampPerPoint: 45,
  pointsPerSecret: 10,
  pointsPerClean: 15,
  overRedactionPenalty: 5,
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

/** How long this document gives you, at the current score. */
export function clockMs(state) {
  return Math.max(state.cfg.clockFloorMs, state.cfg.clockStartMs - state.score * state.cfg.rampPerPoint);
}

function deal(state, now) {
  const doc = DOCUMENTS[Math.floor(state.random() * DOCUMENTS.length)];
  return {
    ...state,
    doc: {
      key: doc.key,
      tokens: doc.tokens.map((token) => ({...token, blacked: false})),
      startedAt: now,
      expiresAt: now + clockMs(state),
    },
  };
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    doc: null,
    score: 0,
    lives: cfg.lives,
    published: 0,
    clean: 0,
    breaches: 0,
    overRedacted: 0,
    last: null,
    over: false,
  };
  return deal(base, now);
}

export function remaining(state, now) {
  if (!state.doc) return 0;
  const total = state.doc.expiresAt - state.doc.startedAt;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (state.doc.expiresAt - now) / total));
}

/** Black out one token. Blacking out the same one twice is a no-op. */
export function black(state, index) {
  if (state.over || !state.doc) return state;
  const token = state.doc.tokens[index];
  if (!token || token.blacked) return state;
  const tokens = [...state.doc.tokens];
  tokens[index] = {...token, blacked: true};
  return {...state, doc: {...state.doc, tokens}};
}

function loseLife(state, reason, now) {
  const lives = state.lives - 1;
  return {...state, lives, last: {result: reason, at: now}, over: lives <= 0};
}

/**
 * Publish what is on the screen.
 *
 * Everything secret blacked out is a clean publication and pays a
 * bonus. Anything secret left visible is a breach: a life, whatever
 * else was done right. Blacking out ordinary text costs points per
 * word, because a page of stripes is not a published document either.
 */
export function publish(state, now) {
  if (state.over || !state.doc) return state;

  const missed = state.doc.tokens.filter((t) => t.secret && !t.blacked).length;
  const over = state.doc.tokens.filter((t) => !t.secret && t.blacked).length;
  const caught = state.doc.tokens.filter((t) => t.secret && t.blacked).length;

  if (missed > 0) {
    const hit = {...loseLife(state, 'breach', now), breaches: state.breaches + 1, missed};
    return hit.over ? {...hit, doc: null} : deal({...hit, doc: null}, now);
  }

  const gained = caught * state.cfg.pointsPerSecret
    + state.cfg.pointsPerClean
    - over * state.cfg.overRedactionPenalty;

  const next = {
    ...state,
    /* A document can score badly, but publishing correctly never costs
       points overall: the floor is zero for the page. */
    score: state.score + Math.max(0, gained),
    published: state.published + 1,
    clean: over === 0 ? state.clean + 1 : state.clean,
    overRedacted: state.overRedacted + over,
    last: {result: over === 0 ? 'clean' : 'overRedacted', over, points: Math.max(0, gained), at: now},
  };
  return deal(next, now);
}

/** Let the clock run out: the document publishes itself, as it would. */
export function step(state, now) {
  if (state.over || !state.doc) return state;
  if (now < state.doc.expiresAt) return state;
  return publish(state, now);
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.published)} documenten uit · ${n(state.clean)} schoon`
    : `${n(state.published)} documents out · ${n(state.clean)} clean`;
}
