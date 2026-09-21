/**
 * engine.test.js — the reconciliation rules.
 *
 * Two properties carry this one. Every sheet must be solvable: each
 * genuine payment settles exactly one invoice, and the lines that
 * settle nothing settle none, or the right answer is unknowable and
 * the player is being asked to guess. And crying wolf must cost,
 * because a game that only punished missing the stray line would teach
 * you to flag every line.
 *
 * The third property is newer: the reference has to matter. A sheet
 * where every amount is unique is a sheet that can be cleared without
 * reading the half of each line that says which invoice it is for.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, match, flag, step, clockMs, invoiceCount, remaining,
  sheetDone, sameLine, stray, summarise, DEFAULTS, REFERENCES,
} = require('../engine.js');

const lines = (s) => s.sheet.payments;
const open = (s) => s.sheet.payments.filter((p) => !p.done);
const strays = (s) => open(s).filter((p) => stray(s, p));
const genuine = (s) => open(s).filter((p) => !stray(s, p));
const invoiceFor = (s, payment) => s.sheet.invoices.find((i) => !i.settled && sameLine(i, payment));

/** Let whatever beat is running finish. */
function settle(state) {
  return state.hold ? step(state, state.hold.until) : state;
}

/**
 * Clear the sheet on the table properly, and stop on the beat that
 * follows it — the caller decides when to take the next sheet.
 *
 * Flagging before matching on purpose: with a doubled line, matching
 * first would leave the other copy needing a flag anyway, so doing it
 * in this order proves the flag-first route works too.
 */
function clearSheet(state) {
  let s = state;
  let guard = 0;
  while (!s.hold && !s.over && guard++ < 40) {
    const odd = strays(s)[0];
    if (odd) {
      s = flag(s, odd.id, 0);
      continue;
    }
    const payment = genuine(s)[0];
    s = match(s, payment.id, invoiceFor(s, payment).id, 0);
  }
  return s;
}

test('every genuine payment settles exactly one invoice', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame({seed, now: 0});
    for (const payment of lines(s)) {
      const hits = s.sheet.invoices.filter((i) => sameLine(i, payment));
      assert.ok(hits.length <= 1, `seed ${seed}: a payment matched ${hits.length} invoices`);
    }
    for (const invoice of s.sheet.invoices) {
      const hits = lines(s).filter((p) => sameLine(p, invoice));
      assert.ok(hits.length >= 1, `seed ${seed}: invoice ${invoice.reference} had no payment`);
    }
  }
});

test('the reference decides, because the amounts collide', () => {
  /* If every amount on a sheet were unique the reference would be
     decoration and the game would be number-pairing. */
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame({seed, now: 0});
    const amounts = s.sheet.invoices.map((i) => i.amount);
    assert.ok(
      new Set(amounts).size < amounts.length,
      `seed ${seed}: no two invoices shared an amount`,
    );
    /* And references stay unique, or "exactly one invoice" could not
       hold in the first place. */
    const refs = s.sheet.invoices.map((i) => i.reference);
    assert.equal(new Set(refs).size, refs.length, `seed ${seed}: a reference was reused`);
  }
});

test('a line that belongs to nobody is not given away by its own shape', () => {
  /* The old giveaway: the stray line carried a 2026-9XX reference
     while every real one was 2026-0XX, so it could be flagged without
     ever looking at the invoice column. */
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame({seed, now: 0});
    for (const payment of strays(s)) {
      assert.ok(
        REFERENCES.includes(payment.reference),
        `seed ${seed}: ${payment.reference} came from outside the pool the invoices draw from`,
      );
    }
  }
});

test('a line that belongs to nobody usually wears a familiar amount', () => {
  /* The other shortcut: if the unknown line always carried an amount
     no invoice had, it could be found by scanning the amounts and the
     reference would go unread again. Deterministic over fixed seeds,
     so this measures the generator, not luck. */
  let unknowns = 0;
  let familiar = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const s = createGame({seed, now: 0});
    for (const payment of strays(s)) {
      if (s.sheet.invoices.some((i) => sameLine(i, payment))) continue;
      unknowns++;
      if (s.sheet.invoices.some((i) => i.amount === payment.amount)) familiar++;
    }
  }
  assert.ok(unknowns > 20, `only ${unknowns} unknown lines over 200 sheets`);
  assert.ok(
    familiar / unknowns > 0.5,
    `only ${familiar} of ${unknowns} unknown lines hid behind a familiar amount`,
  );
});

test('some sheets have no stray line at all, and some have two', () => {
  const counts = new Set();
  for (let seed = 1; seed <= 120; seed++) {
    counts.add(strays(createGame({seed, now: 0})).length);
  }
  assert.ok(counts.has(0), 'every sheet had something to flag');
  assert.ok(counts.has(1), 'no sheet had a single stray');
  assert.ok(counts.has(2), 'no sheet had two strays');
});

test('a sheet starts with a clock, a margin and no beat running', () => {
  const s = createGame({seed: 1, now: 0});
  assert.ok(s.sheet);
  assert.equal(s.hold, null);
  assert.equal(s.margin, DEFAULTS.margin);
  assert.equal(s.sheet.expiresAt - s.sheet.startedAt, lines(s).length * DEFAULTS.msPerLine);
  assert.equal(remaining(s, 0), 1);
});

test('matching a payment to its invoice pays and settles both sides', () => {
  let s = createGame({seed: 2, now: 0});
  const payment = genuine(s)[0];
  const invoice = invoiceFor(s, payment);
  s = match(s, payment.id, invoice.id, 100);
  assert.equal(s.score, DEFAULTS.pointsPerMatch);
  assert.equal(s.matched, 1);
  assert.equal(s.margin, DEFAULTS.margin);
  assert.equal(s.sheet.payments.find((p) => p.id === payment.id).done, true);
  assert.equal(s.sheet.invoices.find((i) => i.id === invoice.id).settled, true);
});

test('the same amount on the wrong invoice is still wrong', () => {
  /* The collision, from the player's side: two invoices at one amount,
     and only the reference says which. */
  for (let seed = 1; seed <= 40; seed++) {
    let s = createGame({seed, now: 0});
    const payment = genuine(s).find((p) => (
      s.sheet.invoices.filter((i) => i.amount === p.amount).length > 1
    ));
    if (!payment) continue;
    const twin = s.sheet.invoices.find((i) => i.amount === payment.amount && !sameLine(i, payment));
    s = match(s, payment.id, twin.id, 100);
    assert.equal(s.last.result, 'mismatch', `seed ${seed}: the amount alone settled it`);
    assert.equal(s.margin, DEFAULTS.margin - DEFAULTS.cost.mismatch);
    return;
  }
  assert.fail('no sheet offered a same-amount pair to test');
});

test('paying a line that belongs to nobody costs four typos', () => {
  for (let seed = 1; seed <= 40; seed++) {
    let s = createGame({seed, now: 0});
    const odd = strays(s).find((p) => !s.sheet.invoices.some((i) => sameLine(i, p)));
    if (!odd) continue;
    s = match(s, odd.id, s.sheet.invoices[0].id, 100);
    assert.equal(s.last.result, 'paidUnknown');
    assert.equal(s.margin, DEFAULTS.margin - DEFAULTS.cost.paidUnknown);
    assert.equal(DEFAULTS.cost.paidUnknown, DEFAULTS.cost.mismatch * 4);
    assert.equal(s.sheet.payments.find((p) => p.id === odd.id).mark, 'wrong');
    return;
  }
  assert.fail('no sheet offered an unknown line to test');
});

test('paying the same line twice is the expensive mistake it is', () => {
  for (let seed = 1; seed <= 60; seed++) {
    let s = createGame({seed, now: 0});
    const copy = strays(s).find((p) => s.sheet.invoices.some((i) => sameLine(i, p)));
    if (!copy) continue;
    /* Settle it once, properly, then pay it again. */
    const invoice = invoiceFor(s, copy);
    s = settle(match(s, copy.id, invoice.id, 100));
    const second = open(s).find((p) => sameLine(p, copy));
    assert.ok(second, 'the doubled line vanished with its twin');
    s = match(s, second.id, invoice.id, 200);
    assert.equal(s.last.result, 'paidTwice');
    assert.equal(s.margin, DEFAULTS.margin - DEFAULTS.cost.paidTwice);
    return;
  }
  assert.fail('no sheet offered a doubled line to test');
});

test('either copy of a doubled line may be flagged, but never both', () => {
  for (let seed = 1; seed <= 60; seed++) {
    let s = createGame({seed, now: 0});
    const copy = strays(s).find((p) => s.sheet.invoices.some((i) => sameLine(i, p)));
    if (!copy) continue;
    const pair = open(s).filter((p) => sameLine(p, copy));
    assert.equal(pair.length, 2);

    s = settle(flag(s, pair[0].id, 100));
    assert.equal(s.last.result, 'caught');
    assert.equal(s.caught, 1);

    /* The survivor is an ordinary payment now, and flagging it is
       crying wolf. */
    const left = open(s).find((p) => sameLine(p, copy));
    assert.equal(stray(s, left), false);
    s = flag(s, left.id, 200);
    assert.equal(s.last.result, 'flaggedGood');
    return;
  }
  assert.fail('no sheet offered a doubled line to test');
});

test('crying wolf costs, and shows what the line was for', () => {
  let s = createGame({seed: 3, now: 0});
  const payment = genuine(s)[0];
  const owed = invoiceFor(s, payment);
  s = flag(s, payment.id, 100);
  assert.equal(s.last.result, 'flaggedGood');
  assert.equal(s.margin, DEFAULTS.margin - DEFAULTS.cost.flaggedGood);
  assert.equal(s.sheet.payments.find((p) => p.id === payment.id).mark, 'wrong');
  assert.equal(s.sheet.invoices.find((i) => i.id === owed.id).mark, 'right');
});

test('a fumbled drop says which invoice it should have been', () => {
  let s = createGame({seed: 4, now: 0});
  const payment = genuine(s)[0];
  const owed = invoiceFor(s, payment);
  const wrong = s.sheet.invoices.find((i) => !i.settled && i.id !== owed.id);
  s = match(s, payment.id, wrong.id, 100);
  assert.equal(s.last.result, 'mismatch');
  assert.equal(s.sheet.invoices.find((i) => i.id === owed.id).mark, 'right');
  assert.equal(s.sheet.invoices.find((i) => i.id === wrong.id).mark, 'wrong');
  assert.equal(s.sheet.payments.find((p) => p.id === payment.id).done, false, 'a slip consumed the line');
});

test('a mistake holds the sheet, and the beat is not charged for', () => {
  let s = createGame({seed: 5, now: 0});
  const payment = genuine(s)[0];
  const wrong = s.sheet.invoices.find((i) => !sameLine(i, payment));
  const deadline = s.sheet.expiresAt;

  s = match(s, payment.id, wrong.id, 1000);
  assert.ok(s.hold, 'the sheet carried on as if nothing happened');
  assert.equal(s.hold.resume, true);
  assert.equal(match(s, payment.id, invoiceFor(s, payment).id, 1100), s, 'the hold was clickable');
  assert.equal(flag(s, payment.id, 1100), s, 'the hold was clickable');
  assert.equal(remaining(s, 1100), remaining(s, 3000), 'the clock ran during the beat');

  const spent = s.hold.until - s.hold.at;
  s = step(s, s.hold.until);
  assert.equal(s.hold, null);
  assert.equal(s.sheet.expiresAt, deadline + spent, 'the beat was charged to the player');
  assert.equal(s.sheet.invoices.some((i) => i.mark), false, 'the marks came along');
  assert.equal(s.over, false);
});

test('a cleared sheet is held up before the next one is dealt', () => {
  let s = createGame({seed: 6, now: 0});
  const opened = s.sheet.startedAt;
  s = clearSheet(s);
  assert.equal(s.hold.result, 'sheet');
  assert.equal(s.hold.resume, false);
  /* Still the sheet that was just cleared, with every line handled. */
  assert.equal(sheetDone(s), true);
  assert.equal(s.sheet.startedAt, opened, 'the cleared sheet was swept off before it was seen');
  assert.ok(s.hold.until - s.hold.at < DEFAULTS.slipHoldMs, 'a clean sheet paused like a mistake');

  s = step(s, s.hold.until);
  assert.equal(sheetDone(s), false, 'no next sheet was dealt');
  assert.equal(s.sheets, 1);
});

test('the month closes on its own, and marks what it closed on', () => {
  let s = createGame({seed: 7, now: 0});
  const expires = s.sheet.expiresAt;
  s = step(s, expires + 1);
  assert.equal(s.last.result, 'monthClosed');
  assert.equal(s.margin, DEFAULTS.margin - DEFAULTS.cost.monthClosed);
  assert.ok(s.sheet.payments.some((p) => p.mark === 'open'));
  assert.equal(s.hold.resume, false, 'a closed month kept the same sheet');
  s = step(s, s.hold.until);
  assert.equal(s.sheets, 0, 'a closed month counted as a cleared sheet');
  assert.ok(s.sheet, 'no fresh sheet after the month closed');
});

test('a finished sheet is not closed by the clock as well', () => {
  let s = createGame({seed: 8, now: 0});
  const expires = s.sheet.expiresAt;
  s = clearSheet(s);
  const mistakes = s.mistakes;
  s = step(s, expires + 1);
  assert.equal(s.mistakes, mistakes, 'the clock closed a sheet that was already clear');
});

test('the margin runs out, and the last mistake is shown before it does', () => {
  let s = createGame({seed: 9, now: 0, config: {margin: DEFAULTS.cost.paidUnknown}});
  const odd = strays(s).find((p) => !s.sheet.invoices.some((i) => sameLine(i, p)))
    || genuine(s)[0];
  s = match(s, odd.id, s.sheet.invoices.find((i) => !sameLine(i, odd)).id, 100);
  assert.equal(s.margin, 0);
  assert.equal(s.over, false, 'the run ended before the player saw why');
  assert.ok(s.hold);
  s = step(s, s.hold.until);
  assert.equal(s.over, true);
  assert.equal(s.sheet, null);
  assert.equal(match(s, 'pay-0', 'inv-0', 999).score, s.score);
  assert.equal(flag(s, 'pay-0', 999).score, s.score);
});

test('a typo never ends a run on the spot', () => {
  /* Ten fumbled drops, and the margin is only just gone: one misclick
     used to be a third of the run. */
  assert.ok(DEFAULTS.cost.mismatch * 10 <= DEFAULTS.margin);
  assert.ok(DEFAULTS.cost.mismatch * 11 > DEFAULTS.margin);
});

test('the clock tightens with the score, down to a readable floor', () => {
  const s = createGame({seed: 10, now: 0});
  const n = lines(s).length;
  assert.equal(clockMs(s), n * DEFAULTS.msPerLine);
  assert.ok(clockMs({...s, score: 50}) < clockMs(s));
  assert.equal(clockMs({...s, score: 9999}), n * DEFAULTS.floorMsPerLine);
});

test('a longer sheet is given longer to read, at the same score', () => {
  const s = createGame({seed: 10, now: 0});
  assert.ok(clockMs(s, 9) > clockMs(s, 5));
  assert.equal(clockMs({...s, score: 9999}, 9), 9 * DEFAULTS.floorMsPerLine);
});

test('the sheet grows with the score, and stops growing', () => {
  const cfg = DEFAULTS;
  assert.equal(invoiceCount({cfg, score: 0}), cfg.linesStart);
  assert.equal(invoiceCount({cfg, score: cfg.pointsPerLine - 1}), cfg.linesStart);
  assert.equal(invoiceCount({cfg, score: cfg.pointsPerLine}), cfg.linesStart + 1);
  assert.equal(invoiceCount({cfg, score: 99999}), cfg.linesMax);
});

test('a bookkeeper who gets it right is handed a longer statement', () => {
  let s = createGame({seed: 12, now: 0});
  const first = s.sheet.invoices.length;
  for (let i = 0; i < 14 && !s.over; i++) {
    s = clearSheet(s);
    s = settle(s);
  }
  assert.equal(s.margin, DEFAULTS.margin, 'a careful run still lost margin');
  assert.equal(s.mistakes, 0);
  assert.equal(s.sheets, 14);
  assert.equal(s.sheet.invoices.length, DEFAULTS.linesMax);
  assert.ok(s.sheet.invoices.length > first, 'the statement never got any longer');
});

test('the summary reads as a sentence in both locales', () => {
  const s = {matched: 9, caught: 2};
  assert.match(summarise(s, 'en'), /9 lines matched · 2 caught out/);
  assert.match(summarise(s, 'nl'), /9 regels gematcht · 2 keer fraude gevonden/);
});
