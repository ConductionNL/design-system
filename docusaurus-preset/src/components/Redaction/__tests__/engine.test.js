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
 *
 * The third is that the page grows. A player who is good at this gets
 * handed more paperwork, not less time to read the same paragraph, so
 * the clock is measured per word and the difficulty arrives as clauses
 * stapled to the page.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, black, publish, step, clockMs, clauseCount, remaining, summarise,
  DOCUMENTS, CLAUSES, DEFAULTS,
} = require('../engine.js');

/** Black out every secret in the current document. */
function redactAll(state) {
  let s = state;
  s.doc.tokens.forEach((token, i) => { if (token.secret) s = black(s, i); });
  return s;
}

/**
 * Publish the page and sit out whatever beat follows it.
 *
 * Every published document is held on screen before the next is dealt,
 * so a test that wants the next document has to let the hold run —
 * exactly as the component's clock does.
 */
function settle(state, now) {
  const out = publish(state, now);
  return out.hold ? step(out, out.hold.until) : out;
}

/** Redact the page properly, publish it, and take the next one. */
function clear(state, now) {
  return settle(redactAll(state), now);
}

/** How long the document on the table was given. */
function span(state) {
  return state.doc.expiresAt - state.doc.startedAt;
}

test('every document has something to find, and something that must stay', () => {
  for (const doc of DOCUMENTS) {
    const secrets = doc.base.filter((t) => t.secret).length;
    const plain = doc.base.filter((t) => !t.secret).length;
    assert.ok(secrets > 0, `${doc.key}: nothing to redact`);
    assert.ok(plain > 0, `${doc.key}: nothing but secrets`);
  }
});

test('a full-size page always adds something to black out', () => {
  /* Filler clauses are there so an extra paragraph is not a tell. If
     there were enough of them to fill a page on their own, a player at
     full size could be handed four clauses with nothing in them. */
  const filler = CLAUSES.filter((c) => !c.tokens.some((t) => t.secret)).length;
  assert.ok(filler > 0, 'every clause hides something, so counting paragraphs wins');
  assert.ok(filler < DEFAULTS.maxClauses, 'a full page could be all filler');
});

test('a game starts with a document, a clock and three lives', () => {
  const s = createGame({seed: 1, now: 0});
  assert.ok(s.doc);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(span(s), s.doc.tokens.length * DEFAULTS.msPerToken);
  assert.equal(remaining(s, 0), 1);
});

test('publishing with every secret blacked out is clean, and pays', () => {
  let s = createGame({seed: 2, now: 0});
  const secrets = s.doc.tokens.filter((t) => t.secret).length;
  const page = s.doc.key;
  s = publish(redactAll(s), 100);
  assert.equal(s.published, 1);
  assert.equal(s.clean, 1);
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.score, secrets * DEFAULTS.pointsPerSecret + DEFAULTS.pointsPerClean);

  /* The page is held for its beat, then the next one comes. */
  assert.equal(s.hold.result, 'clean');
  assert.equal(s.doc.key, page, 'the cleared page was swept off before it was shown');
  s = step(s, s.hold.until);
  assert.equal(s.hold, null);
  assert.ok(s.doc, 'no next document was dealt');
});

test('the beat on a clean page is an animation, not a pause', () => {
  /* If clearing a document ever costs as much time as botching one,
     the game has started charging for playing it well. */
  assert.ok(DEFAULTS.cleanHoldMs < DEFAULTS.breachHoldMs / 4);
  assert.ok(DEFAULTS.cleanHoldMs < DEFAULTS.floorMsPerToken);

  let s = createGame({seed: 21, now: 0});
  s = publish(redactAll(s), 100);
  /* And it does not eat into the next document's clock: the next page
     is dealt when the beat ends, and timed from there. */
  const next = step(s, s.hold.until);
  assert.equal(next.doc.startedAt, s.hold.until);
  assert.equal(remaining(next, s.hold.until), 1);
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

test('an over-redacted page is held with the ink marked as liftable', () => {
  let s = createGame({seed: 22, now: 0});
  const plain = s.doc.tokens.findIndex((t) => !t.secret);
  const page = s.doc.key;
  s = black(redactAll(s), plain);

  s = publish(s, 100);
  assert.equal(s.hold.result, 'overRedacted');
  assert.equal(s.hold.over, 1);
  assert.equal(s.doc.key, page, 'the page was swept off before it was shown');
  assert.equal(s.lives, DEFAULTS.lives, 'over-redaction cost a life');

  /* The bar that should not have been there is the one marked, and
     nothing that had to go is. */
  const marked = s.doc.tokens.filter((t) => t.overRedacted);
  assert.equal(marked.length, 1);
  assert.equal(marked[0].blacked, true);
  assert.equal(Boolean(marked[0].secret), false);
  assert.equal(s.doc.tokens.filter((t) => t.secret && t.overRedacted).length, 0);
  assert.equal(s.doc.tokens.filter((t) => t.missed).length, 0, 'a breach mark on a safe page');

  /* Held, unworkable, and then gone with its marks. */
  assert.equal(black(s, plain), s);
  s = step(s, 100 + DEFAULTS.overHoldMs - 1);
  assert.equal(s.doc.key, page, 'the hold ended early');
  s = step(s, 100 + DEFAULTS.overHoldMs);
  assert.equal(s.hold, null);
  assert.equal(s.doc.tokens.some((t) => t.overRedacted), false, 'the mark came along');
});

test('a clean page is marked with nothing, because there is nothing to show', () => {
  let s = createGame({seed: 23, now: 0});
  s = publish(redactAll(s), 100);
  assert.equal(s.hold.result, 'clean');
  assert.equal(s.hold.over, 0);
  assert.equal(s.doc.tokens.some((t) => t.overRedacted || t.missed), false);
});

test('the three verdicts are held for three different lengths', () => {
  /* Nothing to look at is quickest, something to learn is longer, and
     the one that cost a life is longest. If those ever came level the
     game would be pausing the same amount for every outcome, which is
     the same as telling the player nothing. */
  assert.ok(DEFAULTS.cleanHoldMs < DEFAULTS.overHoldMs);
  assert.ok(DEFAULTS.overHoldMs < DEFAULTS.breachHoldMs);
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
  let t = 0;
  for (let i = 0; i < 3; i++) {
    /* Publish with nothing blacked out, then sit out the hold. */
    s = publish(s, t);
    t += DEFAULTS.breachHoldMs + 1;
    s = step(s, t);
  }
  assert.equal(s.over, true);
  assert.equal(s.lives, 0);
  assert.equal(publish(s, 999).score, s.score);
  assert.equal(black(s, 0), s);
});

test('a breach holds the page up with what was missed marked on it', () => {
  let s = createGame({seed: 15, now: 0});
  /* Catch all but the first secret: one field left readable. */
  const secrets = s.doc.tokens.map((t, i) => (t.secret ? i : -1)).filter((i) => i >= 0);
  secrets.slice(1).forEach((i) => { s = black(s, i); });
  const page = s.doc.key;

  s = publish(s, 100);
  assert.ok(s.hold, 'the page was swept off the table');
  assert.equal(s.hold.missed, 1);
  assert.equal(s.last.result, 'breach');
  assert.equal(s.doc.key, page, 'a different document was on screen');
  assert.equal(s.lives, DEFAULTS.lives - 1, 'the counter waited for the hold');

  const marked = s.doc.tokens.filter((t) => t.missed);
  assert.equal(marked.length, 1, 'the missed field was not marked');
  assert.equal(marked[0].secret, true);
  assert.equal(marked[0].blacked, false);
  /* And the ones that were caught still read as caught. */
  assert.equal(s.doc.tokens.filter((t) => t.blacked && t.missed).length, 0);
});

test('the held page cannot be worked on, and moves off on its own', () => {
  let s = createGame({seed: 16, now: 0});
  s = publish(s, 100);
  const held = s.doc;

  /* Blacking it out afterwards does not undo it, and neither does
     publishing it a second time. */
  assert.equal(black(s, s.doc.tokens.findIndex((t) => t.missed)), s);
  assert.equal(publish(s, 200), s);
  /* And its clock is frozen where it stopped, rather than draining
     through the beat as if there were still something to finish. */
  assert.equal(remaining(s, 200), remaining(s, 2000), 'the clock ran on a page that is out');
  assert.equal(remaining(s, 999), remaining({...s, hold: null}, 100));

  /* The hold runs on the game clock, so it survives a quiet tick. */
  s = step(s, 100 + DEFAULTS.breachHoldMs - 1);
  assert.equal(s.doc, held, 'the hold ended early');

  s = step(s, 100 + DEFAULTS.breachHoldMs);
  assert.equal(s.hold, null);
  assert.ok(s.doc, 'no next document was dealt');
  assert.equal(s.doc.tokens.some((t) => t.missed), false, 'the mark came along');
  assert.equal(s.over, false);
});

test('the last breach shows itself before the run ends', () => {
  let s = createGame({seed: 17, now: 0, config: {lives: 1}});
  s = publish(s, 100);
  assert.equal(s.lives, 0);
  assert.equal(s.over, false, 'the run ended before the player saw why');
  assert.ok(s.doc.tokens.some((t) => t.missed));

  s = step(s, 100 + DEFAULTS.breachHoldMs);
  assert.equal(s.over, true);
  assert.equal(s.doc, null);
});

test('the clock tightens with the score, down to a readable floor', () => {
  const fresh = createGame({seed: 10, now: 0});
  const words = fresh.doc.tokens.length;
  assert.equal(clockMs(fresh), words * DEFAULTS.msPerToken);
  assert.ok(clockMs({...fresh, score: 50}) < clockMs(fresh));
  assert.equal(clockMs({...fresh, score: 5000}), words * DEFAULTS.floorMsPerToken);
});

test('a longer page is given longer to read, at the same score', () => {
  /* The pace tightens with the score; the arithmetic does not. Two
     clauses of extra paperwork are two clauses of extra time, or the
     reward for playing well would be an unreadable page. */
  const s = createGame({seed: 10, now: 0});
  assert.ok(clockMs(s, 20) > clockMs(s, 10));
  assert.equal(clockMs({...s, score: 5000}, 20), 20 * DEFAULTS.floorMsPerToken);
});

test('the countdown runs full to empty and never past either end', () => {
  const s = createGame({seed: 11, now: 0});
  const total = span(s);
  assert.equal(remaining(s, 0), 1);
  assert.ok(Math.abs(remaining(s, total / 2) - 0.5) < 0.01);
  assert.equal(remaining(s, total * 4), 0);
});

test('a careful player clears documents rather than losing lives', () => {
  let s = createGame({seed: 12, now: 0});
  let t = 0;
  for (let i = 0; i < 12 && !s.over; i++) {
    s = clear(s, t);
    t += 1000;
  }
  assert.equal(s.lives, DEFAULTS.lives);
  assert.equal(s.published, 12);
  assert.ok(s.score > 0);
});

test('the page grows with the score, and stops growing', () => {
  const cfg = DEFAULTS;
  assert.equal(clauseCount({cfg, score: 0}), 0);
  assert.equal(clauseCount({cfg, score: cfg.pointsPerClause - 1}), 0);
  assert.equal(clauseCount({cfg, score: cfg.pointsPerClause}), 1);
  assert.equal(clauseCount({cfg, score: cfg.pointsPerClause * 3}), 3);
  assert.equal(clauseCount({cfg, score: 99999}), cfg.maxClauses);
});

test('a player who keeps publishing clean gets handed a thicker page', () => {
  let s = createGame({seed: 20, now: 0});
  const first = s.doc.tokens.length;
  let t = 0;
  for (let i = 0; i < 16 && !s.over; i++) {
    s = clear(s, t);
    t += 1000;
  }
  assert.ok(
    s.score >= DEFAULTS.pointsPerClause * DEFAULTS.maxClauses,
    'sixteen clean documents did not reach full size',
  );
  assert.equal(s.doc.clauses.length, DEFAULTS.maxClauses);
  assert.ok(s.doc.tokens.length > first, 'the page never got any longer');
  assert.ok(
    s.doc.tokens.some((token) => token.secret),
    'a full-size page with nothing on it to redact',
  );
});

test('a clause never asks for a secret the document already carries', () => {
  /* Two different citizen numbers on one permit is a rendering
     accident, not a harder document. */
  for (let seed = 1; seed <= 40; seed++) {
    let s = createGame({seed, now: 0, config: {pointsPerClause: 1}});
    s = clear(s, 100);
    const doc = DOCUMENTS.find((d) => d.key === s.doc.key);
    const taken = doc.base.filter((t) => t.secret).map((t) => t.t);
    const extra = s.doc.tokens.slice(doc.base.length).filter((t) => t.secret).map((t) => t.t);
    for (const t of extra) {
      assert.ok(!taken.includes(t), `${doc.key}: asked for ${t} twice`);
    }
  }
});

test('the same dossier is never dealt twice running', () => {
  let s = createGame({seed: 13, now: 0});
  let t = 0;
  for (let i = 0; i < 30 && !s.over; i++) {
    const before = s.doc.key;
    s = clear(s, t);
    t += 1000;
    assert.notEqual(s.doc.key, before, 'the same document came round again');
  }
});

test('every field is dealt a value, and the deal is repeatable', () => {
  const s = createGame({seed: 14, now: 0});
  for (const token of s.doc.tokens) {
    assert.equal(typeof token.pick, 'number');
    assert.ok(token.pick >= 0 && token.pick < 1, `pick out of range: ${token.pick}`);
  }
  /* Same seed, same page: the copy is picked from the same numbers. */
  const again = createGame({seed: 14, now: 0});
  assert.deepEqual(again.doc.tokens, s.doc.tokens);
});

test('one document is about one case, one department, one person', () => {
  /* A field that turns up twice on a page is the same field twice, so
     it reads as one dossier rather than as a shuffled pile. */
  for (let seed = 1; seed <= 40; seed++) {
    let s = createGame({seed, now: 0, config: {pointsPerClause: 1}});
    s = clear(s, 100);
    const seen = new Map();
    for (const token of s.doc.tokens) {
      if (seen.has(token.t)) {
        assert.equal(seen.get(token.t), token.pick, `${s.doc.key}: ${token.t} was dealt twice over`);
      }
      seen.set(token.t, token.pick);
    }
  }
});

test('two runs do not read the same document', () => {
  /* Nine dossiers and pooled values: the point of both is that the
     second run is not the first one from memory. */
  const pages = new Set();
  for (let seed = 1; seed <= 12; seed++) {
    const s = createGame({seed, now: 0});
    pages.add(s.doc.tokens.map((t) => `${t.t}:${Math.floor(t.pick * 100)}`).join('|'));
  }
  assert.ok(pages.size > 8, `twelve runs dealt only ${pages.size} different pages`);
});

test('the summary reads as a sentence in both locales', () => {
  const s = {published: 7, clean: 5};
  assert.match(summarise(s, 'en'), /7 documents out · 5 clean/);
  assert.match(summarise(s, 'nl'), /7 documenten uit · 5 schoon/);
});
