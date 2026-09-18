/**
 * engine.test.js — the redaction rules.
 *
 * The asymmetry is the game: missing something costs a life, blacking
 * out too much costs points. A version that scored both the same would
 * teach people to black out the whole page, which is the other way of
 * failing at this job.
 *
 * The second property is that every document has something to find. A
 * document with no secrets in it is a free life the player cannot tell
 * apart from a trap.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, black, publish, step, clockMs, remaining, summarise,
  DOCUMENTS, DEFAULTS,
} = require('../engine.js');

/** Black out every secret in the current document. */
function redactAll(state) {
  let s = state;
  s.doc.tokens.forEach((token, i) => { if (token.secret) s = black(s, i); });
  return s;
}

test('every document has something to find, and something that must stay', () => {
  for (const doc of DOCUMENTS) {
    const secrets = doc.tokens.filter((t) => t.secret).length;
    const plain = doc.tokens.filter((t) => !t.secret).length;
    assert.ok(secrets > 0, `${doc.key}: nothing to redact`);
    assert.ok(plain > 0, `${doc.key}: nothing but secrets`);
  }
});

test('a game starts with a document, a clock and three lives', () => {
  const s = createGame({seed: 1, now: 0});
  assert.ok(s.doc);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.doc.expiresAt - s.doc.startedAt, DEFAULTS.clockStartMs);
  assert.equal(remaining(s, 0), 1);
});

test('publishing with every secret blacked out is clean, and pays', () => {
  let s = createGame({seed: 2, now: 0});
  const secrets = s.doc.tokens.filter((t) => t.secret).length;
  s = publish(redactAll(s), 100);
  assert.equal(s.published, 1);
  assert.equal(s.clean, 1);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.score, secrets * DEFAULTS.pointsPerSecret + DEFAULTS.pointsPerClean);
  assert.ok(s.doc, 'no next document was dealt');
});

test('leaving one secret visible is a breach, whatever else was right', () => {
  let s = createGame({seed: 3, now: 0});
  const secretIndexes = s.doc.tokens.map((t, i) => (t.secret ? i : -1)).filter((i) => i >= 0);
  /* Catch all but the last one: the player did almost everything. */
  secretIndexes.slice(0, -1).forEach((i) => { s = black(s, i); });
  const before = s.score;
  s = publish(s, 100);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.breaches, 1);
  assert.equal(s.score, before, 'a breach still paid for the ones that were caught');
  assert.equal(s.published, 0, 'a breach counted as a published document');
});

test('blacking out ordinary text costs points, not a life', () => {
  let s = createGame({seed: 4, now: 0});
  const plain = s.doc.tokens.findIndex((t) => !t.secret);
  s = black(redactAll(s), plain);
  const secrets = s.doc.tokens.filter((t) => t.secret).length;
  s = publish(s, 100);
  assert.equal(s.lives, DEFAULTS.lives, 'over-redaction cost a life');
  assert.equal(s.overRedacted, 1);
  assert.equal(s.clean, 0, 'a striped page counted as clean');
  assert.equal(
    s.score,
    secrets * DEFAULTS.pointsPerSecret + DEFAULTS.pointsPerClean - DEFAULTS.overRedactionPenalty,
  );
});

test('a badly over-redacted page never costs more points than it earned', () => {
  let s = createGame({seed: 5, now: 0, config: {pointsPerSecret: 1, pointsPerClean: 1, overRedactionPenalty: 50}});
  s = redactAll(s);
  s.doc.tokens.forEach((token, i) => { if (!token.secret) s = black(s, i); });
  s = publish(s, 100);
  assert.ok(s.score >= 0, 'the score went negative');
});

test('blacking out the same word twice changes nothing', () => {
  let s = createGame({seed: 6, now: 0});
  const i = s.doc.tokens.findIndex((t) => t.secret);
  s = black(s, i);
  const once = JSON.stringify(s.doc.tokens);
  s = black(s, i);
  assert.equal(JSON.stringify(s.doc.tokens), once);
  assert.equal(black(s, 9999), s, 'a word that does not exist was blacked out');
});

test('the clock publishes the document for you, exactly as it would', () => {
  let s = createGame({seed: 7, now: 0});
  const expires = s.doc.expiresAt;
  /* Do nothing: the secrets are still visible when it goes out. */
  s = step(s, expires + 1);
  assert.equal(s.lives, DEFAULTS.lives - 1);
  assert.equal(s.breaches, 1);
});

test('a document finished in time is not published twice by the clock', () => {
  let s = createGame({seed: 8, now: 0});
  const expires = s.doc.expiresAt;
  s = publish(redactAll(s), 100);
  const published = s.published;
  s = step(s, expires + 1);
  assert.equal(s.published, published, 'the clock published the next document early');
});

test('three breaches end the run, and nothing publishes afterwards', () => {
  let s = createGame({seed: 9, now: 0});
  for (let i = 0; i < 3; i++) s = publish(s, 100 * i);
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);
  assert.equal(publish(s, 999).score, s.score);
  assert.equal(black(s, 0), s);
});

test('the clock tightens with the score, down to a readable floor', () => {
  const fresh = createGame({seed: 10, now: 0});
  assert.equal(clockMs(fresh), DEFAULTS.clockStartMs);
  assert.ok(clockMs({...fresh, score: 50}) < DEFAULTS.clockStartMs);
  assert.equal(clockMs({...fresh, score: 5000}), DEFAULTS.clockFloorMs);
});

test('the countdown runs full to empty and never past either end', () => {
  const s = createGame({seed: 11, now: 0});
  assert.equal(remaining(s, 0), 1);
  assert.ok(Math.abs(remaining(s, DEFAULTS.clockStartMs / 2) - 0.5) < 0.01);
  assert.equal(remaining(s, DEFAULTS.clockStartMs * 4), 0);
});

test('a careful player clears documents rather than losing lives', () => {
  let s = createGame({seed: 12, now: 0});
  let t = 0;
  for (let i = 0; i < 12 && !s.over; i++) {
    s = publish(redactAll(s), t);
    t += 200;
  }
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.published, 12);
  assert.ok(s.score > 0);
});

test('the summary reads as a sentence in both locales', () => {
  const s = {published: 7, clean: 5};
  assert.match(summarise(s, 'en'), /7 documents out · 5 clean/);
  assert.match(summarise(s, 'nl'), /7 documenten uit · 5 schoon/);
});
