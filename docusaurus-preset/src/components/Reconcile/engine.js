/**
 * Reconcile — the rules, with no DOM and no clock of its own.
 *
 * Shillinq's game. The bank statement is in and the invoices are open.
 * Match each payment to the invoice it settles, before the month
 * closes.
 *
 * Amounts are not enough to do that, and that is the whole game. Two
 * invoices on a sheet carry the same amount, so the reference is the
 * only thing that says which of them a payment settles. A statement
 * read by amount alone is a statement half read.
 *
 * Two kinds of line settle nothing. One belongs to nobody: a reference
 * no open invoice carries, which can only be found by looking at the
 * invoices rather than at the line. The other is a payment that is
 * already on the sheet twice, and paying it twice is how money
 * actually leaves. Either one gets flagged instead of matched, and
 * some sheets have neither — a bookkeeper who cries wolf at every line
 * is one nobody listens to.
 *
 * Mistakes cost a margin rather than a life, and they cost what they
 * are worth: paying a line that belongs to nobody empties the margin
 * four times faster than dropping a payment on the wrong invoice.
 *
 * Time and randomness are injected; the component owns the clock.
 */

/* Round amounts in whole euros: the game is about matching, not about
   arithmetic with cents. Enough references for seven invoices and two
   lines that settle nothing, with spares. */
export const AMOUNTS = [120, 240, 360, 480, 750, 900, 1240, 1600, 2100, 3400];
export const REFERENCES = [
  '2026-014', '2026-027', '2026-031', '2026-048', '2026-052', '2026-066',
  '2026-071', '2026-088', '2026-094', '2026-103', '2026-117', '2026-125',
  '2026-138', '2026-146',
];

export const DEFAULTS = {
  /* What a run can afford to get wrong, and what each mistake takes
     off it. The engine's own thesis, finally priced: money out of the
     door costs four times a typo, and crying wolf sits between them.
     Three careless payments end a run; ten fumbled drops do not. */
  margin: 100,
  cost: {
    paidUnknown: 40,
    paidTwice: 40,
    monthClosed: 30,
    flaggedGood: 20,
    mismatch: 10,
  },

  /* The sheet grows with the score, rather than the clock shrinking
     around a sheet that never does. A cleared four-line sheet pays
     about 50, so the fifth invoice lands two sheets in and the
     seventh around the fifth. */
  linesStart: 4,
  linesMax: 7,
  pointsPerLine: 90,

  /* And the whole clock is measured per statement line — the budget,
     the ramp and the floor — so a longer sheet is harder because it is
     longer, not because it is rushed. Five lines at 4800 is the 24
     seconds this game always opened with, and 1800 is the floor a line
     always came down to.

     The ramp is per line per point for the same reason. Taken off the
     sheet as a whole it looked gentle and was not: a seven-line sheet
     earns twice what a four-line one does, so the score ran away from
     it and every sheet past the fourth sat on the floor. Three
     milliseconds a point puts the floor around a score of 1000, which
     is a dozen sheets in rather than four. */
  msPerLine: 4800,
  floorMsPerLine: 1800,
  rampPerPoint: 3,

  pointsPerMatch: 8,
  pointsPerCatch: 20,
  pointsPerSheet: 12,

  /* Three beats, because a cleared sheet, a fumbled drop and money out
     of the door are not the same news. A sheet cleared needs no
     reading: the player knows. A mistake gets long enough to see which
     invoice it should have been, and the expensive mistakes get
     longest. The clock is pushed back by whatever the beat spends, so
     a beat never costs the time it takes. */
  sheetHoldMs: 520,
  slipHoldMs: 1400,
  costlyHoldMs: 2200,
};

/* Which mistakes are worth the long beat: the ones where money left. */
const COSTLY = new Set(['paidUnknown', 'paidTwice', 'monthClosed']);

/* A mistake that leaves the sheet to carry on, rather than closing it. */
const RESUMES = new Set(['paidUnknown', 'paidTwice', 'mismatch', 'flaggedGood']);

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

/** The same line: both halves, never just the amount. */
export function sameLine(a, b) {
  return a.amount === b.amount && a.reference === b.reference;
}

/**
 * How long a sheet of `lines` statement lines gives you, at this score.
 *
 * Without a count it answers for the sheet on the table, which is what
 * a caller with a running game usually means.
 */
export function clockMs(state, lines) {
  const n = lines || (state.sheet ? state.sheet.payments.length : 0);
  const perLine = Math.max(
    state.cfg.floorMsPerLine,
    state.cfg.msPerLine - state.score * state.cfg.rampPerPoint,
  );
  return n * perLine;
}

/** How many invoices the next sheet carries, at this score. */
export function invoiceCount(state) {
  const grown = state.cfg.linesStart + Math.floor(state.score / state.cfg.pointsPerLine);
  return Math.min(state.cfg.linesMax, grown);
}

/**
 * How many lines on the next sheet settle nothing, and of which kind.
 *
 * Often one, sometimes two, and sometimes none at all. The none is the
 * point: if every sheet held exactly one, a player who could not find
 * it would flag by elimination and never have to read anything.
 */
function strays(random) {
  const roll = random();
  const count = roll < 0.2 ? 0 : (roll < 0.75 ? 1 : 2);
  const kinds = [];
  for (let i = 0; i < count; i++) kinds.push(random() < 0.5 ? 'unknown' : 'double');
  return kinds;
}

/**
 * Deal a sheet.
 *
 * The invoices come first, with a forced collision or two so that at
 * least one amount appears twice and the reference has to be read.
 * Every invoice gets the payment that settles it, and then the lines
 * that settle nothing are laid on top:
 *
 *   - `unknown` carries a reference no invoice on this sheet has, and
 *     an amount that may well match one. Nothing about the line itself
 *     gives it away; it is found by looking down the invoice column.
 *   - `double` is a second copy of a payment that is already there,
 *     identical in both halves.
 *
 * Both columns are shuffled afterwards, so the collision is never in
 * the same place twice.
 */
function deal(state, now) {
  const wanted = invoiceCount(state);
  const references = shuffled(REFERENCES, state.random);
  const amounts = shuffled(AMOUNTS, state.random).slice(0, wanted);

  /* Force the collisions the game is built on. */
  const pairs = wanted >= 6 ? 2 : 1;
  for (let k = 0; k < pairs && 2 * k + 1 < amounts.length; k++) {
    amounts[2 * k + 1] = amounts[2 * k];
  }

  const invoices = amounts.map((amount, i) => ({
    id: `inv-${i}`,
    reference: references[i],
    amount,
    settled: false,
    mark: null,
  }));

  const payments = invoices.map((invoice, i) => ({
    id: `pay-${i}`,
    amount: invoice.amount,
    reference: invoice.reference,
    done: false,
    mark: null,
  }));

  const spare = references.slice(invoices.length);
  const doubled = new Set();
  strays(state.random).forEach((kind, i) => {
    if (kind === 'unknown' && spare.length) {
      /* Usually an amount that IS on the sheet, so the line cannot be
         picked out by scanning the amounts either: it carries a figure
         you recognise under a reference nobody opened. */
      const familiar = state.random() < 0.75;
      const amount = familiar
        ? invoices[Math.floor(state.random() * invoices.length)].amount
        : AMOUNTS[Math.floor(state.random() * AMOUNTS.length)];
      payments.push({
        id: `pay-x${i}`,
        amount,
        reference: spare.shift(),
        done: false,
        mark: null,
      });
      return;
    }
    /* A line already on the sheet, a second time. Never the same one
       twice over: two copies is the mistake, three is a puzzle. */
    const free = invoices.filter((inv) => !doubled.has(inv.id));
    if (!free.length) return;
    const source = free[Math.floor(state.random() * free.length)];
    doubled.add(source.id);
    payments.push({
      id: `pay-x${i}`,
      amount: source.amount,
      reference: source.reference,
      done: false,
      mark: null,
    });
  });

  const lines = shuffled(payments, state.random);
  return {
    ...state,
    sheet: {
      invoices: shuffled(invoices, state.random),
      payments: lines,
      startedAt: now,
      expiresAt: now + clockMs(state, lines.length),
    },
  };
}

export function createGame({seed = Date.now(), now = 0, config = {}} = {}) {
  const cfg = {...DEFAULTS, ...config, cost: {...DEFAULTS.cost, ...(config.cost || {})}};
  const base = {
    cfg,
    random: mulberry32(seed),
    sheet: null,
    hold: null,
    score: 0,
    margin: cfg.margin,
    matched: 0,
    caught: 0,
    mistakes: 0,
    sheets: 0,
    last: null,
    over: false,
  };
  return deal(base, now);
}

export function remaining(state, now) {
  if (!state.sheet) return 0;
  const total = state.sheet.expiresAt - state.sheet.startedAt;
  if (total <= 0) return 0;
  /* A held sheet's clock is frozen where it stopped. */
  const at = state.hold ? state.hold.at : now;
  return Math.min(1, Math.max(0, (state.sheet.expiresAt - at) / total));
}

/** Everything on this sheet handled? */
export function sheetDone(state) {
  return Boolean(state.sheet) && state.sheet.payments.every((p) => p.done);
}

/**
 * Is this line one that settles nothing, right now?
 *
 * One rule covers every case: a line should be flagged when there are
 * more unhandled payments carrying it than there are open invoices
 * that take it. A line that belongs to nobody has one payment and no
 * invoice. A payment that is on the sheet twice has two and one, so
 * flagging either copy is right — and once one of them is gone the
 * other is an ordinary payment again, which is exactly what makes
 * flagging it a second time crying wolf.
 */
export function stray(state, payment) {
  if (!state.sheet || !payment) return false;
  const open = state.sheet.payments.filter((p) => !p.done && sameLine(p, payment)).length;
  const owed = state.sheet.invoices.filter((i) => !i.settled && sameLine(i, payment)).length;
  return open > owed;
}

function mark(list, id, value) {
  return list.map((item) => (item.id === id ? {...item, mark: value} : item));
}

/**
 * A mistake: take it off the margin and hold the sheet up, with what
 * went wrong marked on it and, where there is one, where it belonged.
 *
 * The margin moves now, on the act that spent it; `step` ends the beat
 * and decides whether the run goes on.
 */
function slip(state, reason, sheet, now) {
  const cost = state.cfg.cost[reason] || 0;
  return {
    ...state,
    sheet,
    margin: Math.max(0, state.margin - cost),
    mistakes: state.mistakes + 1,
    last: {result: reason, cost, at: now},
    hold: {
      result: reason,
      at: now,
      until: now + (COSTLY.has(reason) ? state.cfg.costlyHoldMs : state.cfg.slipHoldMs),
      resume: RESUMES.has(reason),
    },
  };
}

function cleared(state, now) {
  return {
    ...state,
    score: state.score + state.cfg.pointsPerSheet,
    sheets: state.sheets + 1,
    last: {result: 'sheet', at: now},
    hold: {result: 'sheet', at: now, until: now + state.cfg.sheetHoldMs, resume: false},
  };
}

/**
 * Send a payment to an invoice.
 *
 * Three ways for that to be wrong, priced apart. The invoice is
 * already settled, so this is the second copy of a line and the money
 * goes out twice. The payment belongs to no invoice on the sheet at
 * all, so it goes to nobody. Or it belongs to a different invoice than
 * the one it was dropped on, which is a typo.
 */
export function match(state, paymentId, invoiceId, now) {
  if (state.over || !state.sheet || state.hold) return state;
  const payment = state.sheet.payments.find((p) => p.id === paymentId);
  const invoice = state.sheet.invoices.find((i) => i.id === invoiceId);
  if (!payment || !invoice || payment.done) return state;

  if (invoice.settled) {
    return slip(state, 'paidTwice', {
      ...state.sheet,
      payments: mark(state.sheet.payments, payment.id, 'wrong'),
      invoices: mark(state.sheet.invoices, invoice.id, 'wrong'),
    }, now);
  }

  const belongs = state.sheet.invoices.find((i) => sameLine(i, payment));
  if (!belongs) {
    return slip(state, 'paidUnknown', {
      ...state.sheet,
      payments: mark(state.sheet.payments, payment.id, 'wrong'),
    }, now);
  }

  if (!sameLine(invoice, payment)) {
    return slip(state, 'mismatch', {
      ...state.sheet,
      payments: mark(state.sheet.payments, payment.id, 'wrong'),
      invoices: mark(mark(state.sheet.invoices, invoice.id, 'wrong'), belongs.id, 'right'),
    }, now);
  }

  const next = {
    ...state,
    sheet: {
      ...state.sheet,
      payments: state.sheet.payments.map((p) => (p.id === paymentId ? {...p, done: true} : p)),
      invoices: state.sheet.invoices.map((i) => (i.id === invoiceId ? {...i, settled: true} : i)),
    },
    score: state.score + state.cfg.pointsPerMatch,
    matched: state.matched + 1,
    last: {result: 'matched', at: now},
  };
  return sheetDone(next) ? cleared(next, now) : next;
}

/**
 * Flag a payment as one that settles nothing.
 *
 * Crying wolf at a genuine payment costs, and it is shown what the
 * line was actually for, because "that one was real" is only half the
 * lesson.
 */
export function flag(state, paymentId, now) {
  if (state.over || !state.sheet || state.hold) return state;
  const payment = state.sheet.payments.find((p) => p.id === paymentId);
  if (!payment || payment.done) return state;

  if (!stray(state, payment)) {
    const owed = state.sheet.invoices.find((i) => !i.settled && sameLine(i, payment));
    return slip(state, 'flaggedGood', {
      ...state.sheet,
      payments: mark(state.sheet.payments, payment.id, 'wrong'),
      invoices: owed ? mark(state.sheet.invoices, owed.id, 'right') : state.sheet.invoices,
    }, now);
  }

  const next = {
    ...state,
    sheet: {
      ...state.sheet,
      payments: state.sheet.payments.map((p) => (p.id === paymentId ? {...p, done: true} : p)),
    },
    score: state.score + state.cfg.pointsPerCatch,
    caught: state.caught + 1,
    last: {result: 'caught', at: now},
  };
  return sheetDone(next) ? cleared(next, now) : next;
}

/**
 * The clock, one tick at a time.
 *
 * It ends whichever beat is running, and otherwise closes the month on
 * a sheet that was never finished.
 */
export function step(state, now) {
  if (state.over || !state.sheet) return state;

  if (state.hold) {
    if (now < state.hold.until) return state;
    if (state.margin <= 0) return {...state, hold: null, sheet: null, over: true};

    /* A beat never costs the time it takes: the deadline moves back by
       exactly what the hold spent, or a player would be charged for
       being shown their own mistake. */
    const spent = state.hold.until - state.hold.at;
    if (state.hold.resume) {
      return {
        ...state,
        hold: null,
        sheet: {
          ...state.sheet,
          expiresAt: state.sheet.expiresAt + spent,
          payments: state.sheet.payments.map((p) => (p.mark ? {...p, mark: null} : p)),
          invoices: state.sheet.invoices.map((i) => (i.mark ? {...i, mark: null} : i)),
        },
      };
    }
    return deal({...state, hold: null, sheet: null}, now);
  }

  if (now < state.sheet.expiresAt) return state;

  /* Everything still open is marked, so the player sees what the month
     closed on rather than only that it closed. */
  return slip(state, 'monthClosed', {
    ...state.sheet,
    payments: state.sheet.payments.map((p) => (p.done ? p : {...p, mark: 'open'})),
    invoices: state.sheet.invoices.map((i) => (i.settled ? i : {...i, mark: 'open'})),
  }, now);
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.matched)} regels gematcht · ${n(state.caught)} keer fraude gevonden`
    : `${n(state.matched)} lines matched · ${n(state.caught)} caught out`;
}
