/**
 * engine.test.js — the full-stack rules.
 *
 * Two properties carry this one. The well must never lie: a piece may
 * only ever sit where it fits, and a finished layer must come out
 * leaving everything above it exactly one row lower.
 *
 * The third is not about play at all. This is a falling-block puzzle,
 * a genre whose rules are free and whose most famous member's LOOK is
 * not, so the shape of the game is a legal boundary as much as a
 * design one. The tests at the bottom hold that boundary: the well is
 * not ten by twenty and the piece set is not the seven four-tile
 * shapes. If either ever drifts, they fail.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGame, step, down, shift, rotate, slam, turn, fits, cellsOf,
  dropMs, height, summarise, PIECES, KINDS, APPS, DEFAULTS,
} = require('../engine.js');

/** Let the clear beat finish. */
function settle(state, now) {
  return state.hold ? step(state, state.hold.until) : state;
}

/** Drop the current piece to rest and settle whatever that finished. */
function drop(state, now = 0) {
  return settle(slam(state, now), now);
}

/** A well with a row all but one cell full, for testing a clear. */
function primed(config) {
  const s = createGame({seed: 1, now: 0, config});
  const well = s.well.map((row) => [...row]);
  const last = s.cfg.rows - 1;
  for (let c = 0; c < s.cfg.cols - 1; c++) well[last][c] = {app: APPS[c % APPS.length]};
  return {...s, well};
}

test('a new game has a piece, one waiting, and an empty well', () => {
  const s = createGame({seed: 1, now: 0});
  assert.ok(s.piece);
  assert.ok(s.next);
  assert.equal(s.score, 0);
  assert.equal(s.layers, 0);
  assert.equal(s.over, false);
  assert.equal(s.well.length, DEFAULTS.rows);
  assert.equal(s.well[0].length, DEFAULTS.cols);
  assert.ok(s.well.every((row) => row.every((cell) => cell === null)));
});

test('every app comes round before any of them comes round twice', () => {
  /* A layer holding all seven apps is the point of the game, so the
     apps are dealt from a bag rather than rolled: seven different ones,
     then seven more. A deep well, because this is about the deal and a
     normal one fills before three bags are out. */
  for (let seed = 1; seed <= 20; seed++) {
    let s = createGame({seed, now: 0, config: {rows: 60}});
    const order = [];
    let guard = 0;
    while (order.length < APPS.length * 3 && s.piece && guard++ < 400) {
      order.push(s.piece.app);
      s = drop(s, guard * 100);
    }
    assert.ok(order.length >= APPS.length * 3, `seed ${seed}: only ${order.length} pieces`);
    for (let i = 0; i + APPS.length <= order.length; i += APPS.length) {
      const bag = order.slice(i, i + APPS.length);
      assert.equal(
        new Set(bag).size, APPS.length,
        `seed ${seed}: a run of seven repeated an app — ${bag.join(', ')}`,
      );
    }
  }
});

test('the shape is not bagged with the app', () => {
  /* The apps come round in sevens; the shapes must not, or the piece
     sequence becomes the other game's randomiser for no reason. */
  let s = createGame({seed: 3, now: 0, config: {rows: 60}});
  const kinds = [];
  let guard = 0;
  while (kinds.length < 60 && s.piece && guard++ < 400) {
    kinds.push(s.piece.kind);
    s = drop(s, guard * 100);
  }
  let repeatedWithinSeven = 0;
  for (let i = 0; i + KINDS.length <= kinds.length; i += KINDS.length) {
    if (new Set(kinds.slice(i, i + KINDS.length)).size < KINDS.length) repeatedWithinSeven++;
  }
  assert.ok(repeatedWithinSeven > 0, 'the shapes were dealt as a bag of seven too');
});

test('every tile of a piece carries one app, and it is a real glyph slug', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const s = createGame({seed, now: 0});
    assert.ok(APPS.includes(s.piece.app), `seed ${seed}: ${s.piece.app} is not one of the apps`);
    assert.ok(KINDS.includes(s.piece.kind));
    assert.ok(s.piece.tiles.length >= 1);
  }
});

test('a piece only ever sits where it fits', () => {
  const s = createGame({seed: 2, now: 0});
  assert.equal(fits(s, {...s.piece, col: -1}), false, 'a piece hung off the left');
  assert.equal(fits(s, {...s.piece, col: s.cfg.cols}), false, 'a piece hung off the right');
  assert.equal(fits(s, {...s.piece, row: s.cfg.rows}), false, 'a piece fell through the floor');
  /* And shifting refuses rather than clamping, so the well is never lied to. */
  let far = s;
  for (let i = 0; i < 20; i++) far = shift(far, -1);
  assert.ok(cellsOf(far.piece).every(([, c]) => c >= 0));
  assert.equal(shift(far, -1), far, 'the wall gave way');
});

test('a piece falls one row a tick, and lands when it cannot', () => {
  let s = createGame({seed: 3, now: 0});
  const startRow = s.piece.row;
  s = step(s, s.nextDropAt - 1);
  assert.equal(s.piece.row, startRow, 'the piece fell early');
  s = step(s, s.nextDropAt);
  assert.equal(s.piece.row, startRow + 1);

  /* All the way down: the tiles end up in the well and a new piece comes. */
  const app = s.piece.app;
  s = drop(s, 100);
  assert.equal(s.landed, 1);
  assert.ok(s.piece, 'no next piece arrived');
  const filled = s.well.flat().filter((cell) => cell !== null);
  assert.ok(filled.length >= 1);
  assert.ok(filled.every((cell) => cell.app === app), 'a landed piece changed app');
});

test('landing a piece pays nothing; only a finished layer does', () => {
  let s = createGame({seed: 4, now: 0});
  s = drop(s, 100);
  assert.equal(s.score, 0, 'merely surviving paid');
  assert.equal(s.last.result, 'landed');
});

test('a full layer scores, is held, and then comes out', () => {
  /* One gap left in the bottom row, and a single tile to fill it. */
  let s = primed({});
  s = {...s, piece: {kind: 'dot', app: APPS[0], tiles: PIECES.dot, row: 0, col: s.cfg.cols - 1}};
  const before = s.well.flat().filter((c) => c !== null).length;

  s = slam(s, 100);
  assert.equal(s.last.result, 'cleared');
  assert.equal(s.last.layers, 1);
  assert.ok(s.score >= DEFAULTS.pointsPerLayer);
  /* Held, with the layer still on screen and still full. */
  assert.ok(s.hold);
  assert.deepEqual(s.hold.rows, [s.cfg.rows - 1]);
  assert.ok(s.well[s.cfg.rows - 1].every((c) => c !== null), 'the layer went before it was seen');
  assert.equal(step(s, s.hold.until - 1), s, 'the beat ended early');

  s = step(s, s.hold.until);
  assert.equal(s.hold, null);
  assert.equal(s.layers, 1);
  assert.ok(s.well[s.cfg.rows - 1].every((c) => c === null), 'the layer stayed');
  assert.equal(s.well.flat().filter((c) => c !== null).length, before + 1 - s.cfg.cols);
});

test('a layer of one app pays the bonus it is there for', () => {
  const s = createGame({seed: 5, now: 0});
  const last = s.cfg.rows - 1;
  const well = s.well.map((row) => [...row]);
  for (let c = 0; c < s.cfg.cols - 1; c++) well[last][c] = {app: 'shillinq'};
  const one = slam({
    ...s, well,
    piece: {kind: 'dot', app: 'shillinq', tiles: PIECES.dot, row: 0, col: s.cfg.cols - 1},
  }, 100);
  assert.equal(one.last.oneApp, 1);
  assert.equal(one.last.wholeStack, 0);
  assert.equal(one.last.points, DEFAULTS.pointsPerLayer + DEFAULTS.oneAppBonus);

  /* And a mixed layer does not. */
  const mixedWell = s.well.map((row) => [...row]);
  for (let c = 0; c < s.cfg.cols - 1; c++) mixedWell[last][c] = {app: APPS[c % 2]};
  const mixed = slam({
    ...s, well: mixedWell,
    piece: {kind: 'dot', app: APPS[0], tiles: PIECES.dot, row: 0, col: s.cfg.cols - 1},
  }, 100);
  assert.equal(mixed.last.oneApp, 0);
  assert.equal(mixed.last.points, DEFAULTS.pointsPerLayer);
});

test('a layer holding every app pays the most, and is reachable', () => {
  const s = createGame({seed: 6, now: 0});
  /* Seven apps and seven columns, so one of each is a thing that can
     happen — which is the only reason the bonus is honest. */
  assert.equal(APPS.length, DEFAULTS.cols);

  const last = s.cfg.rows - 1;
  const well = s.well.map((row) => [...row]);
  for (let c = 0; c < s.cfg.cols - 1; c++) well[last][c] = {app: APPS[c]};
  const out = slam({
    ...s, well,
    piece: {kind: 'dot', app: APPS[s.cfg.cols - 1], tiles: PIECES.dot, row: 0, col: s.cfg.cols - 1},
  }, 100);
  assert.equal(out.last.wholeStack, 1);
  assert.equal(out.last.points, DEFAULTS.pointsPerLayer + DEFAULTS.wholeStackBonus);
  assert.ok(DEFAULTS.wholeStackBonus > DEFAULTS.oneAppBonus, 'the harder layer pays less');
});

test('two layers at once pay more than two layers one at a time', () => {
  const s = createGame({seed: 7, now: 0});
  const rows = s.cfg.rows;
  const well = s.well.map((row) => [...row]);
  /* Two rows with the same single gap, and a two-tall piece for it. */
  for (let c = 0; c < s.cfg.cols - 1; c++) {
    well[rows - 1][c] = {app: APPS[c]};
    well[rows - 2][c] = {app: APPS[(c + 1) % APPS.length]};
  }
  const out = slam({
    ...s, well,
    piece: {kind: 'pair', app: APPS[0], tiles: turn(PIECES.pair), row: 0, col: s.cfg.cols - 1},
  }, 100);
  assert.equal(out.last.layers, 2);
  assert.ok(out.last.points > 2 * DEFAULTS.pointsPerLayer, 'doubling up paid nothing extra');
  assert.equal(out.best, 2);
});

test('the stack above a cleared layer comes down exactly one row', () => {
  const s = createGame({seed: 8, now: 0});
  const rows = s.cfg.rows;
  const well = s.well.map((row) => [...row]);
  for (let c = 0; c < s.cfg.cols - 1; c++) well[rows - 1][c] = {app: APPS[0]};
  /* A marker sitting two rows up, in a column that is not the gap. */
  well[rows - 3][0] = {app: 'launchpad'};

  let out = slam({
    ...s, well,
    piece: {kind: 'dot', app: APPS[0], tiles: PIECES.dot, row: 0, col: s.cfg.cols - 1},
  }, 100);
  out = step(out, out.hold.until);
  assert.equal(out.well[rows - 2][0] && out.well[rows - 2][0].app, 'launchpad', 'the stack did not settle');
  assert.equal(out.well[rows - 3][0], null);
});

test('turning a piece keeps its tiles and stays inside the well', () => {
  for (const kind of KINDS) {
    const tiles = PIECES[kind];
    const spun = turn(tiles);
    assert.equal(spun.length, tiles.length, `${kind} lost a tile turning`);
    assert.ok(spun.every(([r, c]) => r >= 0 && c >= 0), `${kind} turned out of its box`);
    /* Four turns is where it started. */
    let round = tiles;
    for (let i = 0; i < 4; i++) round = turn(round);
    assert.deepEqual(
      [...round].sort().map(String), [...tiles].sort().map(String),
      `${kind} did not come back round`,
    );
  }

  /* And rotating against the right wall nudges in rather than hanging out. */
  let s = createGame({seed: 9, now: 0});
  s = {...s, piece: {kind: 'line3', app: APPS[0], tiles: PIECES.line3, row: 0, col: s.cfg.cols - 3}};
  for (let i = 0; i < 6; i++) {
    s = rotate(s);
    assert.ok(
      cellsOf(s.piece).every(([, c]) => c >= 0 && c < s.cfg.cols),
      'a turn put tiles outside the well',
    );
  }
});

test('the well fills up and the run ends', () => {
  let s = createGame({seed: 10, now: 0});
  let guard = 0;
  while (!s.over && guard++ < 4000) s = drop(s, guard * 100);
  assert.equal(s.over, true, 'dropping pieces on the spot never filled the well');
  assert.equal(s.last.result, 'full');
  /* And nothing moves afterwards. */
  assert.equal(shift(s, 1), s);
  assert.equal(rotate(s), s);
  assert.equal(down(s, 9999), s);
  assert.equal(step(s, 99999), s);
});

test('placing a piece beats not placing it', () => {
  /* Two crude players: one drops everything down the same column, the
     other always takes the shallowest. The second must do better on
     both counts, or the well is not asking anything. Compared against
     each other rather than against a number, so the property survives
     a change to the shape of the well. */
  const run = (seed, choose) => {
    let s = createGame({seed, now: 0});
    let guard = 0;
    while (!s.over && guard++ < 600) {
      const next = choose(s, guard * 100);
      if (next === s) break;
      s = next;
    }
    return s;
  };
  const blind = (s, t) => settle(slam({...s, piece: {...s.piece, col: 0}}, t), t);
  const placing = (s, t) => {
    let best = s;
    let lowest = Infinity;
    for (let col = 0; col < s.cfg.cols; col++) {
      const moved = {...s, piece: {...s.piece, col}};
      if (!fits(s, moved.piece)) continue;
      const after = settle(slam(moved, t), t);
      const h = height(after);
      if (h < lowest) { lowest = h; best = after; }
    }
    return best;
  };

  let blindLayers = 0;
  let blindPieces = 0;
  let placedLayers = 0;
  let placedPieces = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const a = run(seed, blind);
    const b = run(seed, placing);
    blindLayers += a.layers; blindPieces += a.landed;
    placedLayers += b.layers; placedPieces += b.landed;
  }
  assert.equal(blindLayers, 0, 'one column somehow finished a layer');
  assert.ok(placedLayers > 0, 'placing pieces finished no layers at all');
  assert.ok(placedPieces > blindPieces * 2, 'placing barely outlasted stacking blind');
});

test('the pace comes off pieces landed, not off the score', () => {
  const s = createGame({seed: 12, now: 0});
  assert.equal(dropMs(s), DEFAULTS.dropStartMs);
  assert.equal(dropMs({...s, score: 9999}), DEFAULTS.dropStartMs, 'scoring well sped the well up');
  assert.ok(dropMs({...s, landed: 20}) < DEFAULTS.dropStartMs);
  assert.equal(dropMs({...s, landed: 9999}), DEFAULTS.dropFloorMs);
});

test('the same seed deals the same pieces, a different one does not', () => {
  /* Slamming everything into the middle fills the well in well under
     twenty-five pieces, so the deal stops when the run does. */
  const deal = (seed) => {
    let s = createGame({seed, now: 0});
    const out = [];
    for (let i = 0; i < 25 && s.piece; i++) {
      out.push(`${s.piece.kind}:${s.piece.app}`);
      s = drop(s, i * 100);
    }
    return out;
  };
  assert.deepEqual(deal(5), deal(5));
  assert.notDeepEqual(deal(5), deal(6));
});

/* ---------------------------------------------------------------- *
 * The boundary. These are not gameplay properties — they are the
 * reason this game is allowed to exist, and they are asserted so that
 * a later tweak cannot quietly walk into the shape of the game whose
 * look is protected.
 * ---------------------------------------------------------------- */

test('the well is not the famous one', () => {
  assert.notEqual(DEFAULTS.cols, 10);
  assert.notEqual(DEFAULTS.rows, 20);
});

test('the piece set is not the seven four-tile shapes', () => {
  /* Sizes one to five, and more than one size, is the whole point. */
  const sizes = new Set(KINDS.map((k) => PIECES[k].length));
  assert.ok(sizes.size > 1, 'every piece became the same size');
  assert.ok(sizes.has(1), 'the single tile went');
  assert.ok(sizes.has(5), 'the five-tile piece went');
  assert.ok(![...sizes].every((n) => n === 4), 'the set became four-tile only');

  /* And specifically: none of the four-in-a-line, S, Z, J or L shapes,
     in any rotation. Those five with the square and the T are the set
     that case was about. */
  const fingerprint = (tiles) => {
    let best = null;
    let t = tiles;
    for (let i = 0; i < 4; i++) {
      const key = [...t].map(([r, c]) => `${r},${c}`).sort().join(' ');
      if (best === null || key < best) best = key;
      t = turn(t);
    }
    return best;
  };
  const forbidden = {
    line4: [[0, 0], [0, 1], [0, 2], [0, 3]],
    ess: [[0, 1], [0, 2], [1, 0], [1, 1]],
    zed: [[0, 0], [0, 1], [1, 1], [1, 2]],
    jay: [[0, 0], [1, 0], [1, 1], [1, 2]],
    ell: [[0, 2], [1, 0], [1, 1], [1, 2]],
  };
  const ours = new Set(KINDS.map((k) => fingerprint(PIECES[k])));
  for (const [name, tiles] of Object.entries(forbidden)) {
    assert.equal(ours.has(fingerprint(tiles)), false, `the piece set grew a ${name}`);
  }
});

test('a finished layer is not the whole of the scoring', () => {
  /* The rule that makes this game its own: what it is about is a layer
     of one app, or a layer of the whole stack, not a full row. */
  assert.ok(DEFAULTS.oneAppBonus > DEFAULTS.pointsPerLayer);
  assert.ok(DEFAULTS.wholeStackBonus > DEFAULTS.pointsPerLayer);
});

test('the summary reads as a sentence in both locales', () => {
  const s = {layers: 12, oneApp: 3, wholeStack: 1};
  assert.match(summarise(s, 'en'), /12 layers out · 3 on one app · 1 whole-stack/);
  assert.match(summarise(s, 'nl'), /12 lagen af · 3 op één app · 1 met de hele stack/);
});
