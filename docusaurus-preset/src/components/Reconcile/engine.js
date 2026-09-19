/**
 * Reconcile — the rules, with no DOM and no clock of its own.
 *
 * Shillinq's game. The bank statement is in and the invoices are open.
 * Match each payment to the invoice it settles, before the month
 * closes. One of the lines on the statement matches nothing at all,
 * and sending that one to an invoice is how money goes missing
 * quietly.
 *
 * So there are three moves, not two: match it, or flag it as the one
 * that does not belong. Flagging a genuine payment is a mistake too,
 * because a bookkeeper who cries wolf at every line is a bookkeeper
 * nobody listens to.
 *
 * Time and randomness are injected; the component owns the clock.
 */

/* Round amounts in whole euros: the game is about matching, not about
   arithmetic with cents. */
const AMOUNTS = [120, 240, 360, 480, 750, 900, 1240, 1600, 2100, 3400];
const REFERENCES = ['2026-014', '2026-027', '2026-031', '2026-048', '2026-052', '2026-066'];

export const DEFAULTS = {
  lives: 3,
  invoices: 4,
  clockStartMs: 24000,
  clockFloorMs: 9000,
  rampPerPoint: 90,
  pointsPerMatch: 8,
  pointsPerFraud: 20,
  pointsPerSheet: 12,
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

export function clockMs(state) {
  return Math.max(state.cfg.clockFloorMs, state.cfg.clockStartMs - state.score * state.cfg.rampPerPoint);
}

/**
 * Deal a sheet: N invoices, N payments that settle them, and one more
 * payment that settles nothing.
 *
 * The odd one out is built from an amount no invoice carries, because
 * a fraud line that happens to equal a real invoice would make the
 * right answer unknowable.
 */
function deal(state, now) {
  const amounts = shuffled(AMOUNTS, state.random).slice(0, state.cfg.invoices);
  const references = shuffled(REFERENCES, state.random);

  const invoices = amounts.map((amount, i) => ({
    id: `inv-${i}`,
    reference: references[i % references.length],
    amount,
    settled: false,
  }));

  const payments = invoices.map((invoice, i) => ({
    id: `pay-${i}`,
    amount: invoice.amount,
    reference: invoice.reference,
    fraud: false,
    done: false,
  }));

  const spare = AMOUNTS.filter((a) => !amounts.includes(a));
  payments.push({
    id: 'pay-odd',
    amount: spare[Math.floor(state.random() * spare.length)],
    /* A reference nobody issued: close enough to look filed, wrong
       enough to be findable. */
    reference: `2026-${900 + Math.floor(state.random() * 90)}`,
    fraud: true,
    done: false,
  });

  return {
    ...state,
    sheet: {
      invoices,
      payments: shuffled(payments, state.random),
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
    sheet: null,
    score: 0,
    lives: cfg.lives,
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
  return Math.min(1, Math.max(0, (state.sheet.expiresAt - now) / total));
}

/** Everything on this sheet handled? */
export function sheetDone(state) {
  return Boolean(state.sheet) && state.sheet.payments.every((p) => p.done);
}

function loseLife(state, reason, now) {
  const lives = state.lives - 1;
  return {
    ...state,
    lives,
    mistakes: state.mistakes + 1,
    last: {result: reason, at: now},
    over: lives <= 0,
  };
}

function advance(state, now) {
  if (!sheetDone(state)) return state;
  const cleared = {
    ...state,
    score: state.score + state.cfg.pointsPerSheet,
    sheets: state.sheets + 1,
    last: {result: 'sheet', at: now},
  };
  return deal(cleared, now);
}

/**
 * Send a payment to an invoice.
 *
 * Right pays, wrong costs a life, and the fraud line costs a life
 * wherever it is sent: that is the mistake the app exists to prevent.
 */
export function match(state, paymentId, invoiceId, now) {
  if (state.over || !state.sheet) return state;
  const payment = state.sheet.payments.find((p) => p.id === paymentId);
  const invoice = state.sheet.invoices.find((i) => i.id === invoiceId);
  if (!payment || !invoice || payment.done || invoice.settled) return state;

  if (payment.fraud || payment.amount !== invoice.amount) {
    return loseLife(state, payment.fraud ? 'paidFraud' : 'mismatch', now);
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
  return advance(next, now);
}

/**
 * Flag a payment as the one that belongs to nobody.
 *
 * Crying wolf at a genuine payment costs a life too. A game that only
 * punished missing the fraud would teach you to flag everything.
 */
export function flag(state, paymentId, now) {
  if (state.over || !state.sheet) return state;
  const payment = state.sheet.payments.find((p) => p.id === paymentId);
  if (!payment || payment.done) return state;

  if (!payment.fraud) return loseLife(state, 'flaggedGood', now);

  const next = {
    ...state,
    sheet: {
      ...state.sheet,
      payments: state.sheet.payments.map((p) => (p.id === paymentId ? {...p, done: true} : p)),
    },
    score: state.score + state.cfg.pointsPerFraud,
    caught: state.caught + 1,
    last: {result: 'caught', at: now},
  };
  return advance(next, now);
}

/** The month closes on its own, and an unfinished sheet costs a life. */
export function step(state, now) {
  if (state.over || !state.sheet) return state;
  if (now < state.sheet.expiresAt) return state;
  const hit = loseLife(state, 'monthClosed', now);
  return hit.over ? {...hit, sheet: null} : deal(hit, now);
}

/** The line that goes on the game-over card and into the post. */
export function summarise(state, locale = 'en') {
  const n = (v) => Number(v || 0).toLocaleString(locale);
  return locale === 'nl'
    ? `${n(state.matched)} regels gematcht · ${n(state.caught)} keer fraude gevonden`
    : `${n(state.matched)} lines matched · ${n(state.caught)} caught out`;
}
