/**
 * engine.test.js — the deadline-defender rules.
 *
 * Four things are worth protecting.
 *
 * A person who can read can play. The suite carries a reader model —
 * a player with a words-per-second rate who always picks the right
 * lane — and plays whole runs with it, without ever looking at the
 * answer any faster than a person could. The old clock reached a pace
 * nobody could read at by the twenty-third case and no test noticed,
 * because no test had a reading speed. Now "I cannot keep up with
 * any of them" fails the suite rather than the player.
 *
 * Difficulty arrives as more paperwork, not as less time for the same
 * paperwork: the clock is priced per word, and its ramp counts cases
 * handled rather than points scored, so the streak bonus cannot
 * compound it.
 *
 * Every situation has exactly one correct lane, and all four lanes
 * are reachable — including the one for cases that take no next step,
 * without which the board can be played by elimination.
 *
 * And every outcome is held long enough to be read, with the lane it
 * should have gone to still on it.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, step, route, clockMs, caseWords, noiseCount, remaining,
  marginLeft, summarise,
  SUBJECTS, STAGES, NOISE, LANES, INTAKE, REVIEW, DECISION, OFF, DEFAULTS,
} = require('../engine.js');

/** Roll time forward until a case is on the desk, or the run is over. */
function toCase(state, now, stepMs = 20) {
  let s = state;
  let t = now;
  for (let i = 0; i < 5000; i++) {
    s = step(s, t);
    if (s.over || s.current) return {state: s, now: t};
    t += stepMs;
  }
  throw new Error('no case ever arrived');
}

/**
 * Play a whole run as a person would: read every word at `wps` words
 * a second, spend `reactMs` deciding and reaching the key, then pick
 * the lane the case actually needs. The model never reads faster than
 * the case is long, which is the point of it.
 */
function playReader({seed, wps, reactMs = 250, cases = 60}) {
  let s = createGame({seed, now: 0});
  let now = 0;
  for (let i = 0; i < cases; i++) {
    const at = toCase(s, now);
    s = at.state;
    now = at.now;
    if (s.over) break;
    const c = s.current;
    now += (caseWords(c) / wps) * 1000 + reactMs;
    s = step(s, now);
    /* If the deadline went while we were reading, the case is gone
       and step() has already charged for it. */
    if (s.current) s = route(s, c.needs, now);
  }
  return s;
}

/** Play perfectly and instantly, to get a state a given number of cases in. */
function playPerfect(seed, cases) {
  let s = createGame({seed, now: 0});
  let now = 0;
  const dealt = [];
  for (let i = 0; i < cases; i++) {
    const at = toCase(s, now);
    s = at.state;
    now = at.now;
    dealt.push(s.current);
    now += 50;
    s = route(s, s.current.needs, now);
  }
  return {state: s, dealt, now};
}

/* ---------------------------------------------------------------- */
/* the board                                                         */
/* ---------------------------------------------------------------- */

test('every stage routes to exactly one real lane, and every lane is reachable', () => {
  for (const stage of STAGES) {
    assert.ok(LANES.includes(stage.needs), `${stage.key} routes nowhere`);
  }
  for (const lane of LANES) {
    assert.ok(STAGES.some((s) => s.needs === lane), `nothing ever goes to ${lane}`);
  }
});

test('the fourth lane is real: some cases take no next step', () => {
  const off = STAGES.filter((s) => s.needs === OFF);
  assert.ok(off.length >= 2, 'one "off the queue" case would be a tell in itself');
});

test('every clause carries the word count the clock is priced against', () => {
  for (const list of [SUBJECTS, STAGES, NOISE]) {
    for (const item of list) {
      assert.ok(Number.isInteger(item.words) && item.words > 0, `${item.key} has no word count`);
    }
  }
});

/* ---------------------------------------------------------------- */
/* composition — the case cannot be memorised                        */
/* ---------------------------------------------------------------- */

test('a case is composed, and carries a number, a subject and one stage clause', () => {
  const {state} = playPerfect(2, 1);
  const {dealt} = playPerfect(2, 1);
  const c = dealt[0];
  assert.match(c.id, /^\d{4}-\d{3}$/);
  assert.ok(SUBJECTS.includes(c.subject), 'the subject is not one of the pool');
  const stages = c.clauses.filter((cl) => cl.kind === 'stage');
  assert.equal(stages.length, 1, 'a case must have exactly one clause that decides the lane');
  assert.equal(c.needs, stages[0].needs);
  assert.equal(state.handled, 1);
});

test('the same subject turns up in front of different lanes', () => {
  const {dealt} = playPerfect(11, 120);
  const seen = new Map();
  for (const c of dealt) {
    if (!seen.has(c.subject.key)) seen.set(c.subject.key, new Set());
    seen.get(c.subject.key).add(c.needs);
  }
  const multi = [...seen.values()].filter((lanes) => lanes.size > 1);
  assert.ok(
    multi.length >= 3,
    'if a subject only ever appeared in one lane, the label would be the answer',
  );
});

test('the governing clause is not always in the same place', () => {
  const {dealt} = playPerfect(5, 120);
  const positions = new Set();
  for (const c of dealt) {
    if (c.clauses.length < 2) continue;
    positions.add(c.clauses.findIndex((cl) => cl.kind === 'stage'));
  }
  assert.ok(
    positions.size >= 2,
    'a stage clause always in the same position could be read on its own',
  );
});

test('the case grows with the run instead of the clock shrinking around it', () => {
  const early = createGame({seed: 3, now: 0});
  assert.equal(noiseCount({...early, handled: 0}), 0);
  assert.equal(noiseCount({...early, handled: DEFAULTS.noiseSteps[0]}), 1);
  assert.equal(noiseCount({...early, handled: DEFAULTS.noiseSteps[1]}), 2);
  assert.equal(noiseCount({...early, handled: 500}), DEFAULTS.maxNoise, 'noise must be capped');

  const {dealt} = playPerfect(7, 20);
  assert.equal(dealt[0].clauses.length, 1);
  assert.ok(
    dealt[dealt.length - 1].clauses.length > dealt[0].clauses.length,
    'a later case should be more to read, not less time to read it',
  );
});

/* ---------------------------------------------------------------- */
/* the clock                                                         */
/* ---------------------------------------------------------------- */

test('a longer case gets a longer deadline', () => {
  const s = createGame({seed: 1, now: 0});
  const short = {subject: {key: 'x', words: 1}, clauses: [{words: 5}]};
  const long = {subject: {key: 'x', words: 1}, clauses: [{words: 5}, {words: 12}]};
  assert.ok(clockMs(s, long) > clockMs(s, short), 'more words must buy more time');
  assert.equal(caseWords(short), 6);
  assert.equal(caseWords(long), 18);
});

test('the ramp counts cases handled, not points scored', () => {
  const base = createGame({seed: 1, now: 0});
  const c = {subject: {key: 'x', words: 1}, clauses: [{words: 11}]};
  /* Two states the same number of cases in, one of them on a long
     streak. The streak bonus must not buy a tighter clock. */
  const plain = {...base, handled: 8, score: 80};
  const streaking = {...base, handled: 8, score: 800};
  assert.equal(clockMs(plain, c), clockMs(streaking, c), 'the score must not touch the pace');
  assert.ok(clockMs({...base, handled: 0}, c) > clockMs(plain, c), 'the pace must still tighten');
});

test('the deadline never asks for a reading speed nobody has', () => {
  const s = createGame({seed: 1, now: 0});
  const c = {subject: {key: 'x', words: 2}, clauses: [{words: 13}]};
  const deep = clockMs({...s, handled: 10000}, c);
  const wordsPerSecond = caseWords(c) / ((deep - DEFAULTS.reactMs) / 1000);
  assert.ok(
    wordsPerSecond <= 6.5,
    `the floor demands ${wordsPerSecond.toFixed(1)} words a second, which is past reading`,
  );
});

test('a locale that needs more words gets more time for them', () => {
  const en = createGame({seed: 1, now: 0});
  const nl = createGame({seed: 1, now: 0, config: {wordScale: 1.12}});
  const c = {subject: {key: 'x', words: 2}, clauses: [{words: 12}]};
  assert.ok(clockMs(nl, c) > clockMs(en, c), 'Dutch runs longer and must not be quietly rushed');
});

/* ---------------------------------------------------------------- */
/* the reader model — the test the old clock would have failed       */
/* ---------------------------------------------------------------- */

test('a five-words-a-second reader gets a real run', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const s = playReader({seed, wps: 5, cases: 60});
    assert.ok(
      s.handled >= 25,
      `a 5 w/s reader only handled ${s.handled} cases on seed ${seed}`,
    );
    assert.equal(s.misrouted, 0, 'the model never picks the wrong lane');
  }
});

test('an unhurried reader still gets past the opening', () => {
  for (const seed of [1, 2, 3]) {
    const s = playReader({seed, wps: 3, cases: 40});
    assert.ok(s.handled >= 6, `a 3 w/s reader only handled ${s.handled} cases on seed ${seed}`);
  }
});

test('the clock still bites: a slow reader does not run forever', () => {
  const s = playReader({seed: 1, wps: 2, cases: 60});
  assert.ok(s.over, 'two words a second should eventually lose to the clock');
  assert.ok(s.missed > 0, 'and it should lose by running out of time, not otherwise');
});

/* ---------------------------------------------------------------- */
/* scoring, margin and verdicts                                      */
/* ---------------------------------------------------------------- */

test('routing correctly scores, and a streak pays more each time', () => {
  const {state} = playPerfect(4, 3);
  assert.equal(state.handled, 3);
  assert.equal(
    state.score,
    DEFAULTS.pointsPerCase * 3 + DEFAULTS.comboBonus * 3,
    'ten, then twelve, then fourteen',
  );
  assert.equal(state.bestCombo, 3);
  assert.equal(state.margin, DEFAULTS.margin, 'a clean run must not cost margin');
});

test('the wrong step charges the margin and says which step was right', () => {
  const at = toCase(createGame({seed: 6, now: 0}), 0);
  const s = at.state;
  const right = s.current.needs;
  const wrong = LANES.find((l) => l !== right);
  const after = route(s, wrong, at.now + 100);

  assert.equal(after.margin, DEFAULTS.margin - DEFAULTS.cost.misrouted);
  assert.equal(after.score, s.score, 'a misroute must not also pay');
  assert.equal(after.misrouted, 1);
  assert.equal(after.combo, 0);
  assert.equal(after.current, null);

  assert.ok(after.verdict, 'a wrong answer must be answered');
  assert.equal(after.verdict.result, 'misrouted');
  assert.equal(after.verdict.sentTo, wrong);
  assert.equal(after.verdict.shouldHaveBeen, right, 'the player has to be told the lane');
  assert.ok(after.verdict.case, 'the case has to stay on the desk to be read against it');
});

test('letting the deadline run out costs the same as misrouting it', () => {
  const at = toCase(createGame({seed: 6, now: 0}), 0);
  const s = at.state;
  const after = step(s, s.current.expiresAt + 1);

  assert.equal(after.margin, DEFAULTS.margin - DEFAULTS.cost.missed);
  assert.equal(DEFAULTS.cost.missed, DEFAULTS.cost.misrouted, 'both end the same way in a real queue');
  assert.equal(after.missed, 1);
  assert.equal(after.verdict.result, 'missed');
  assert.equal(after.verdict.shouldHaveBeen, s.current.needs);
});

test('the margin buys four mistakes, not three', () => {
  let s = createGame({seed: 9, now: 0});
  let now = 0;
  for (let i = 1; i <= 4; i++) {
    const at = toCase(s, now);
    s = at.state;
    now = at.now + 10;
    const wrong = LANES.find((l) => l !== s.current.needs);
    s = route(s, wrong, now);
    if (i < 4) {
      assert.equal(s.over, false, `the run ended after ${i} mistakes`);
      now = s.verdict.until + 10;
    }
  }
  assert.equal(s.over, true, 'the fourth mistake has to end it');
  assert.equal(marginLeft(s), 0);
});

/* ---------------------------------------------------------------- */
/* the verdict beat                                                  */
/* ---------------------------------------------------------------- */

test('a verdict is held, and nothing new is dealt underneath it', () => {
  const at = toCase(createGame({seed: 12, now: 0}), 0);
  let s = at.state;
  const right = s.current.needs;
  const wrong = LANES.find((l) => l !== right);
  const t = at.now + 100;
  s = route(s, wrong, t);

  const held = s.verdict.until;
  assert.ok(held - t >= DEFAULTS.wrongHoldMs, 'a mistake needs long enough to read');

  const midway = step(s, t + (held - t) / 2);
  assert.ok(midway.verdict, 'the verdict must survive its own beat');
  assert.equal(midway.current, null, 'a new case must not arrive on top of the answer');
  assert.equal(midway.verdict.shouldHaveBeen, right);

  const later = toCase(step(s, held + 1), held + 1);
  assert.ok(later.state.current, 'the next case has to arrive once the beat is up');
  assert.equal(later.state.verdict, null);
});

test('a hit is held too, but only for a beat', () => {
  const at = toCase(createGame({seed: 13, now: 0}), 0);
  let s = at.state;
  const t = at.now + 60;
  s = route(s, s.current.needs, t);

  assert.equal(s.verdict.result, 'handled');
  assert.ok(s.verdict.points > 0, 'the verdict should say what it paid');
  assert.ok(
    s.verdict.until - t < DEFAULTS.wrongHoldMs,
    'a hit needs no reading — the player already knows',
  );
});

test('the losing case is still on screen when the run ends', () => {
  let s = createGame({seed: 15, now: 0});
  let now = 0;
  for (let i = 0; i < 4; i++) {
    const at = toCase(s, now);
    s = at.state;
    now = at.now + 10;
    s = route(s, LANES.find((l) => l !== s.current.needs), now);
    if (!s.over) now = s.verdict.until + 10;
  }
  assert.equal(s.over, true);
  assert.ok(s.verdict, 'the run must not end on a blank desk');
  assert.ok(s.verdict.shouldHaveBeen, 'the last thing shown is the lane it should have gone to');
});

/* ---------------------------------------------------------------- */
/* readouts                                                          */
/* ---------------------------------------------------------------- */

test('the countdown reads full at the start of a case and empty at its end', () => {
  const at = toCase(createGame({seed: 8, now: 0}), 0);
  const s = at.state;
  assert.ok(remaining(s, s.current.bornAt) > 0.99);
  assert.equal(remaining(s, s.current.expiresAt), 0);
  assert.ok(remaining(s, (s.current.bornAt + s.current.expiresAt) / 2) > 0.4);
});

test('the margin bar reads the margin', () => {
  const s = createGame({seed: 1, now: 0});
  assert.equal(marginLeft(s), 1);
  assert.equal(marginLeft({...s, margin: DEFAULTS.margin / 2}), 0.5);
  assert.equal(marginLeft({...s, margin: 0}), 0);
});

test('a seed replays the same run', () => {
  const a = playPerfect(42, 12);
  const b = playPerfect(42, 12);
  assert.deepEqual(
    a.dealt.map((c) => [c.id, c.subject.key, c.clauses.map((cl) => cl.key).join('+')]),
    b.dealt.map((c) => [c.id, c.subject.key, c.clauses.map((cl) => cl.key).join('+')]),
  );
  assert.equal(a.state.score, b.state.score);
});

test('the summary names what the run did, in both locales', () => {
  const {state} = playPerfect(3, 5);
  assert.match(summarise(state, 'en'), /5 cases on time/);
  assert.match(summarise(state, 'nl'), /5 zaken op tijd/);
});
