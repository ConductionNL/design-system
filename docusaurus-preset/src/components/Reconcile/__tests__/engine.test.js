/**
 * engine.test.js — the reconciliation rules.
 *
 * Two properties carry this one. Every sheet must be solvable: each
 * genuine payment matches exactly one invoice, and the odd line out
 * matches none, or the right answer is unknowable and the player is
 * being asked to guess. And crying wolf must cost, because a game that
 * only punished missing the fraud would teach you to flag every line.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, match, flag, step, clockMs, remaining, sheetDone, summarise, DEFAULTS,
} = require('../engine.js');

const fraudOf = (s) => s.sheet.payments.find((p) => p.fraud);
const genuine = (s) => s.sheet.payments.filter((p) => !p.fraud);
const invoiceFor = (s, payment) => s.sheet.invoices.find((i) => i.amount === payment.amount);

/** Clear a sheet properly: match everything, flag the odd one out. */
function clearSheet(state, now = 0) {
  let s = state;
  for (const payment of genuine(s)) {
    s = match(s, payment.id, invoiceFor(s, payment).id, now);
  }
  const odd = fraudOf(s);
  return odd ? flag(s, odd.id, now) : s;
}

test('a sheet always has one payment too many, and it is the fraud', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = createGame({seed, now: 0});
    assert.equal(s.sheet.invoices.length, DEFAULTS.invoices);
    assert.equal(s.sheet.payments.length, DEFAULTS.invoices + 1);
    assert.equal(s.sheet.payments.filter((p) => p.fraud).length, 1, `seed ${seed}: not exactly one fraud line`);
  }
});

test('every genuine payment settles exactly one invoice, and the fraud settles none', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = createGame({seed, now: 0});
    for (const payment of genuine(s)) {
      const hits = s.sheet.invoices.filter((i) => i.amount === payment.amount);
      assert.equal(hits.length, 1, `seed ${seed}: a payment matched ${hits.length} invoices`);
    }
    const odd = fraudOf(s);
    assert.equal(
      s.sheet.invoices.filter((i) => i.amount === odd.amount).length,
      0,
      `seed ${seed}: the fraud line matches a real invoice, so it cannot be told apart`,
    );
  }
});

test('matching a payment to its invoice pays and settles both sides', () => {
  let s = createGame({seed: 2, now: 0});
  const payment = genuine(s)[0];
  const invoice = invoiceFor(s, payment);
  s = match(s, payment.id, invoice.id, 10);
  assert.equal(s.matched, 1);
  assert.equal(s.score, DEFAULTS.pointsPerMatch);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.sheet.payments.find((p) => p.id === payment.id).done, true);
  assert.equal(s.sheet.invoices.find((i) => i.id === invoice.id).settled, true);
});

test('sending a payment to the wrong invoice costs a life', () => {
  let s = createGame({seed: 3, now: 0});
  const payment = genuine(s)[0];
  const wrong = s.sheet.invoices.find((i) => i.amount !== payment.amount);
  s = match(s, payment.id, wrong.id, 20);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.last.result, 'mismatch');
});

test('paying the fraud line costs a life wherever it is sent', () => {
  let s = createGame({seed: 4, now: 0});
  const odd = fraudOf(s);
  s = match(s, odd.id, s.sheet.invoices[0].id, 20);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.last.result, 'paidFraud');
});

test('catching the fraud pays more than a match', () => {
  let s = createGame({seed: 5, now: 0});
  s = flag(s, fraudOf(s).id, 30);
  assert.equal(s.caught, 1);
  assert.equal(s.score, DEFAULTS.pointsPerFraud);
  assert.ok(DEFAULTS.pointsPerFraud > DEFAULTS.pointsPerMatch);
});

test('crying wolf at a genuine payment costs a life', () => {
  let s = createGame({seed: 6, now: 0});
  s = flag(s, genuine(s)[0].id, 30);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.last.result, 'flaggedGood');
});

test('a handled line cannot be handled twice', () => {
  let s = createGame({seed: 7, now: 0});
  const payment = genuine(s)[0];
  s = match(s, payment.id, invoiceFor(s, payment).id, 10);
  const score = s.score;
  s = match(s, payment.id, invoiceFor(s, payment).id, 20);
  assert.equal(s.score, score, 'the same line paid twice');
  assert.equal(s.lives, DEFAULTS.lives, 'a duplicate click was punished');
});

test('clearing a sheet pays a bonus and deals the next one', () => {
  let s = createGame({seed: 8, now: 0});
  s = clearSheet(s, 0);
  assert.equal(s.sheets, 1);
  assert.ok(s.sheet, 'no next sheet arrived');
  assert.equal(sheetDone(s), false, 'the next sheet arrived already finished');
  assert.equal(s.lives, DEFAULTS.lives);
});

test('the month closing on an unfinished sheet costs a life', () => {
  let s = createGame({seed: 9, now: 0});
  const closes = s.sheet.expiresAt;
  s = step(s, closes + 1);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.last.result, 'monthClosed');
  assert.ok(s.sheet, 'no fresh sheet after the month closed');
});

test('three mistakes end it, and nothing moves afterwards', () => {
  let s = createGame({seed: 10, now: 0});
  for (let i = 0; i < DEFAULTS.lives; i++) {
    const good = genuine(s).find((p) => !p.done);
    s = flag(s, good.id, 10 * i);
  }
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);
  const frozen = s.sheet ? match(s, genuine(s)[0].id, s.sheet.invoices[0].id, 99) : s;
  assert.equal(frozen.score, s.score);
});

test('the clock tightens with the score, down to a readable floor', () => {
  const fresh = createGame({seed: 11, now: 0});
  assert.equal(clockMs(fresh), DEFAULTS.clockStartMs);
  assert.ok(clockMs({...fresh, score: 60}) < DEFAULTS.clockStartMs);
  assert.equal(clockMs({...fresh, score: 9000}), DEFAULTS.clockFloorMs);
});

test('the countdown runs full to empty and no further', () => {
  const s = createGame({seed: 12, now: 0});
  assert.equal(remaining(s, 0), 1);
  assert.equal(remaining(s, DEFAULTS.clockStartMs * 3), 0);
});

test('a careful bookkeeper clears sheet after sheet without losing a life', () => {
  let s = createGame({seed: 13, now: 0});
  for (let i = 0; i < 8 && !s.over; i++) s = clearSheet(s, i * 100);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.sheets, 8);
  assert.ok(s.score > 0);
});

test('the summary reads as a sentence in both locales', () => {
  const s = {matched: 12, caught: 3};
  assert.match(summarise(s, 'en'), /12 lines matched · 3 caught out/);
  assert.match(summarise(s, 'nl'), /12 regels gematcht · 3 keer fraude gevonden/);
});
