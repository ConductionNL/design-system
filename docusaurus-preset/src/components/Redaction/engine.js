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
   supplies the words.

   A document is its `base` — the sentence it always is — plus clauses
   stapled on from the shared pool below as the score climbs. Nine
   dossiers, and none of them the same paperwork: a permit is three
   fields on one line, a health note is one sentence that should
   arguably never have been in the pile at all. */
export const DOCUMENTS = [
  {
    key: 'permit',
    base: [
      {t: 'permitIntro'}, {t: 'name', secret: true}, {t: 'permitMiddle'},
      {t: 'address', secret: true}, {t: 'permitTail'}, {t: 'bsn', secret: true},
      {t: 'permitEnd'},
    ],
  },
  {
    key: 'invoice',
    base: [
      {t: 'invoiceIntro'}, {t: 'company'}, {t: 'invoiceMiddle'},
      {t: 'iban', secret: true}, {t: 'invoiceTail'}, {t: 'amount'},
      {t: 'invoiceEnd'}, {t: 'email', secret: true},
    ],
  },
  {
    key: 'objection',
    base: [
      {t: 'objectionIntro'}, {t: 'name', secret: true}, {t: 'objectionMiddle'},
      {t: 'birthdate', secret: true}, {t: 'objectionTail'}, {t: 'caseNumber'},
      {t: 'objectionEnd'},
    ],
  },
  {
    key: 'report',
    base: [
      {t: 'reportIntro'}, {t: 'department'}, {t: 'reportMiddle'},
      {t: 'phone', secret: true}, {t: 'reportTail'}, {t: 'name', secret: true},
      {t: 'reportEnd'}, {t: 'policy'},
    ],
  },
  {
    key: 'subsidy',
    base: [
      {t: 'subsidyIntro'}, {t: 'amount'}, {t: 'subsidyMiddle'}, {t: 'company'},
      {t: 'subsidyTail'}, {t: 'iban', secret: true}, {t: 'subsidyEnd'},
      {t: 'decisionDate'},
    ],
  },
  {
    key: 'woo',
    base: [
      {t: 'wooIntro'}, {t: 'name', secret: true}, {t: 'wooMiddle'}, {t: 'policy'},
      {t: 'wooTail'}, {t: 'email', secret: true}, {t: 'wooEnd'}, {t: 'department'},
    ],
  },
  {
    key: 'incident',
    base: [
      {t: 'incidentIntro'}, {t: 'location'}, {t: 'incidentMiddle'},
      {t: 'plate', secret: true}, {t: 'incidentTail'}, {t: 'name', secret: true},
      {t: 'incidentEnd'}, {t: 'role'},
    ],
  },
  {
    key: 'benefit',
    base: [
      {t: 'benefitIntro'}, {t: 'name', secret: true}, {t: 'benefitMiddle'},
      {t: 'benefit', secret: true}, {t: 'benefitTail'}, {t: 'role'},
      {t: 'benefitEnd'}, {t: 'policy'},
    ],
  },
  {
    key: 'health',
    base: [
      {t: 'healthIntro'}, {t: 'name', secret: true}, {t: 'healthMiddle'},
      {t: 'medical', secret: true}, {t: 'healthTail'}, {t: 'department'},
      {t: 'healthEnd'}, {t: 'caseNumber'},
    ],
  },
];

/**
 * The clauses a document grows by, in the order they read.
 *
 * Any of them can follow any dossier, which is why they are shared
 * rather than written per document: a real file gets a correspondence
 * address stapled to it whatever kind of file it is.
 *
 * Three of the twelve carry nothing secret, deliberately. If every
 * extra clause hid a name, a player would stop reading the page and
 * start counting paragraphs.
 */
export const CLAUSES = [
  {key: 'questions', tokens: [{t: 'clauseQuestions'}, {t: 'email', secret: true}]},
  {key: 'reference', tokens: [{t: 'clauseReference'}, {t: 'bsn', secret: true}]},
  {key: 'payment', tokens: [{t: 'clausePayment'}, {t: 'iban', secret: true}, {t: 'clausePaymentTail'}, {t: 'amount'}]},
  {key: 'handled', tokens: [{t: 'clauseHandled'}, {t: 'role'}, {t: 'clauseHandledTail'}, {t: 'department'}]},
  {key: 'post', tokens: [{t: 'clausePost'}, {t: 'address', secret: true}]},
  {key: 'reachable', tokens: [{t: 'clauseReachable'}, {t: 'phone', secret: true}]},
  {key: 'born', tokens: [{t: 'clauseBorn'}, {t: 'birthdate', secret: true}]},
  {key: 'vehicle', tokens: [{t: 'clauseVehicle'}, {t: 'plate', secret: true}]},
  {key: 'filed', tokens: [{t: 'clauseFiled'}, {t: 'policy'}, {t: 'clauseFiledTail'}, {t: 'caseNumber'}]},
  {key: 'published', tokens: [{t: 'clausePublished'}, {t: 'decisionDate'}, {t: 'clausePublishedTail'}, {t: 'location'}]},
  {key: 'cosigned', tokens: [{t: 'clauseCosigned'}, {t: 'name', secret: true}]},
  {key: 'health', tokens: [{t: 'clauseHealth'}, {t: 'medical', secret: true}]},
];

export const DEFAULTS = {
  lives: 3,
  /* Reading a document takes longer than judging a card, and the whole
     game is reading — so the clock is measured per word rather than
     per document. A page that grew by four clauses gets the time to
     read those clauses; what tightens with the score is the pace, not
     the arithmetic. The floor is where a fast reader still finishes
     the page they were handed. */
  msPerToken: 2000,
  floorMsPerToken: 850,
  rampPerPoint: 45,
  /* Every this many points, one more clause is stapled on, so the page
     grows with what the player has earned — up to `maxClauses`. A
     clean eight-word dossier pays about 45, which puts the first
     clause two good publications in. */
  pointsPerClause: 90,
  maxClauses: 4,
  pointsPerSecret: 10,
  pointsPerClean: 15,
  overRedactionPenalty: 5,
  /* Every published document is held on screen for a beat before the
     next one is dealt, and the two beats are deliberately unequal.

     A breach that vanishes on the same frame it happened teaches the
     player nothing: they saw the counter drop and never found out
     which field did it. So it is held long enough to read the page and
     find the thing, and short enough not to be a punishment on top of
     the life it already cost.

     An over-redacted page sits between them. It is a mistake and it
     has something to show — the ink coming back off a word that could
     have stayed — but it cost nobody anything, so it does not get the
     two seconds a breach gets.

     A clean page needs no reading: the player already knows they got
     it right, they only want to be told. So that one is an animation
     rather than a pause. The reward for being quick is being quick,
     and the mistakes are the ones worth dwelling on. */
  breachHoldMs: 2200,
  overHoldMs: 1200,
  cleanHoldMs: 420,
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

/**
 * How long a document of `words` tokens gives you, at this score.
 *
 * Without a count it answers for the document on the table, which is
 * what a caller with a running game usually means.
 */
export function clockMs(state, words) {
  const n = words || (state.doc ? state.doc.tokens.length : 0);
  const budget = n * state.cfg.msPerToken - state.score * state.cfg.rampPerPoint;
  return Math.max(n * state.cfg.floorMsPerToken, budget);
}

/** How many clauses the next document carries, at this score. */
export function clauseCount(state) {
  return Math.min(state.cfg.maxClauses, Math.floor(state.score / state.cfg.pointsPerClause));
}

function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pick `count` clauses for this document.
 *
 * A clause is skipped when the base already carries that kind of
 * secret: a permit that asked for a citizen number once should not ask
 * for a second, different one two lines down. Then back into declared
 * order, because the clauses are written to read one after another.
 */
function clausesFor(doc, count, random) {
  if (count <= 0) return [];
  const taken = new Set(doc.base.filter((tok) => tok.secret).map((tok) => tok.t));
  const pool = CLAUSES.filter((c) => !c.tokens.some((tok) => tok.secret && taken.has(tok.t)));
  const chosen = new Set(shuffled(pool, random).slice(0, count));
  return CLAUSES.filter((c) => chosen.has(c));
}

/* Which document comes next. Never the same dossier twice running:
   the second permit in a row gets read from memory rather than off
   the page, and reading the page is the game. */
function pickDocument(state) {
  const pool = DOCUMENTS.filter((d) => d.key !== state.lastKey);
  const list = pool.length ? pool : DOCUMENTS;
  return list[Math.floor(state.random() * list.length)];
}

function deal(state, now) {
  const doc = pickDocument(state);
  const clauses = clausesFor(doc, clauseCount(state), state.random);
  /* `pick` decides which name, which account, which address: a float
     the component turns into one of its pooled values. It is drawn
     here so that a seeded run deals the same page twice, and so the
     rules stay free of copy.

     One draw per kind of field, not per word, so a document is about
     one case at one department with one person on it. Two different
     case numbers on the same page read as a rendering accident, and a
     second, different name under a co-signature reads as two people
     who have never met. */
  const picks = {};
  const tokens = [...doc.base, ...clauses.flatMap((c) => c.tokens)]
    .map((token) => {
      if (!(token.t in picks)) picks[token.t] = state.random();
      return {...token, blacked: false, pick: picks[token.t]};
    });
  return {
    ...state,
    lastKey: doc.key,
    doc: {
      key: doc.key,
      clauses: clauses.map((c) => c.key),
      tokens,
      startedAt: now,
      expiresAt: now + clockMs(state, tokens.length),
    },
  };
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config};
  const base = {
    cfg,
    random: mulberry32(seed),
    doc: null,
    hold: null,
    lastKey: null,
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
  /* A held page's clock is frozen where it stopped. The document is
     out; a bar that carried on draining would be counting down
     nothing, and on a clean page it would spend the beat telling the
     player they were slower than they were. */
  const at = state.hold ? state.hold.at : now;
  return Math.min(1, Math.max(0, (state.doc.expiresAt - at) / total));
}

/** Black out one token. Blacking out the same one twice is a no-op. */
export function black(state, index) {
  if (state.over || !state.doc || state.hold) return state;
  const token = state.doc.tokens[index];
  if (!token || token.blacked) return state;
  const tokens = [...state.doc.tokens];
  tokens[index] = {...token, blacked: true};
  return {...state, doc: {...state.doc, tokens}};
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
  if (state.over || !state.doc || state.hold) return state;

  const missed = state.doc.tokens.filter((t) => t.secret && !t.blacked).length;
  const over = state.doc.tokens.filter((t) => !t.secret && t.blacked).length;
  const caught = state.doc.tokens.filter((t) => t.secret && t.blacked).length;

  if (missed > 0) {
    /* The page does not leave the table yet. What was missed is marked
       on it and the whole thing is held, so the player finds out which
       field cost them the life rather than only that one is gone. The
       counter drops now, on the act that earned it; `step` ends the
       hold and deals on, or ends the run if that was the last life. */
    const tokens = state.doc.tokens.map((token) => (
      token.secret && !token.blacked ? {...token, missed: true} : token
    ));
    return {
      ...state,
      lives: state.lives - 1,
      breaches: state.breaches + 1,
      doc: {...state.doc, tokens},
      hold: {result: 'breach', at: now, until: now + state.cfg.breachHoldMs, missed},
      last: {result: 'breach', missed, at: now},
    };
  }

  const gained = caught * state.cfg.pointsPerSecret
    + state.cfg.pointsPerClean
    - over * state.cfg.overRedactionPenalty;

  const result = over === 0 ? 'clean' : 'overRedacted';

  /* A bar that should not have been there is marked, so the beat can
     take the ink back off it and show the word underneath. Nothing is
     marked on a clean page: there is nothing to point at. */
  const tokens = over === 0 ? state.doc.tokens : state.doc.tokens.map((token) => (
    !token.secret && token.blacked ? {...token, overRedacted: true} : token
  ));

  const next = {
    ...state,
    doc: {...state.doc, tokens},
    /* A document can score badly, but publishing correctly never costs
       points overall: the floor is zero for the page. */
    score: state.score + Math.max(0, gained),
    published: state.published + 1,
    clean: over === 0 ? state.clean + 1 : state.clean,
    overRedacted: state.overRedacted + over,
    last: {result, over, points: Math.max(0, gained), at: now},
  };
  /* The page it went out as stays up for its beat, the way a breached
     one does — the score moves now, on the act that earned it, and
     `step` deals the next one. */
  return {
    ...next,
    hold: {
      result,
      at: now,
      until: now + (over === 0 ? state.cfg.cleanHoldMs : state.cfg.overHoldMs),
      over,
    },
  };
}

/**
 * The clock, one tick at a time.
 *
 * It ends the beat on a published document, and otherwise it publishes
 * the page for you when the time is up, exactly as it would.
 */
export function step(state, now) {
  if (state.over || !state.doc) return state;

  /* A held page is held, not expired: the countdown cannot take a life
     off a document that is already out, and a breach cannot take a
     second one off the same page. */
  if (state.hold) {
    if (now < state.hold.until) return state;
    const done = {...state, hold: null, doc: null};
    return done.lives <= 0 ? {...done, over: true} : deal(done, now);
  }

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
