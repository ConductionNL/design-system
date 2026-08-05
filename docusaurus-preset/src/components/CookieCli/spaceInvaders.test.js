/**
 * The one rule this game has: you cannot lose it.
 *
 * It is an easter egg inside a cookie banner. Someone opened that banner to
 * set a preference, so ending their game with GAME OVER is a worse outcome
 * than letting them play forever. Both original death paths are covered
 * here, because they were separate: bombs draining lives, and the swarm
 * reaching the floor, which ended the run outright no matter how many lives
 * were left.
 *
 * These assertions were checked against the previous engine before being
 * committed: nine of the ten fail on it. A test for the absence of
 * behaviour is worth very little until you have watched it fail.
 *
 * Runs under `npm test` (node --test) with no DOM: the engine guards its
 * window access, and stop() lets the tick be driven by hand instead of a
 * timer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import SpaceInvaders, {ROWS} from './spaceInvaders.js';

function newGame() {
  const frames = [];
  const game = new SpaceInvaders({
    onFrame: (f) => frames.push(f),
    onExit: () => assert.fail('the game exited on its own'),
  });
  game.stop(); // drive tick() manually
  return {game, frames};
}

test('bombs landing on the player never end the run', () => {
  const {game} = newGame();
  game.graceTicks = 0;
  /* Drop each bomb one row above the player and tick twice, which is how a
     bomb actually arrives: it descends every other tick, and the collision
     check runs in the same tick as the move. Injecting one directly onto
     the player's row instead tests nothing, because on a move tick it
     advances to ROWS and is filtered as off-screen before the check. */
  for (let i = 0; i < 6; i++) {
    game.bombs.push({x: game.player.x + 1, y: ROWS - 2});
    game.tick();
    game.tick();
  }
  assert.ok(game.hits >= 6, `all six bombs should register a hit, got ${game.hits}`);
  assert.equal(game.lives, undefined, 'there should be no lives counter to run out');
  assert.equal(game.gameOver, undefined, 'there should be no game-over flag');
});

test('the swarm reaching the floor rolls into a new wave', () => {
  const {game} = newGame();
  const before = game.wave;
  game.ufos.forEach((u) => { u.alive = true; u.y = ROWS - 1; });
  game.tick();
  assert.equal(game.wave, before + 1, 'the wave should advance');
  assert.equal(game.ufos.filter((u) => u.alive).length, 18, 'a fresh swarm should spawn');
  assert.equal(game.landed, 1, 'the landing should be counted');
});

test('clearing a wave advances it', () => {
  const {game} = newGame();
  const before = game.wave;
  game.ufos.forEach((u) => { u.alive = false; u.exploding = 0; });
  game.tick();
  assert.equal(game.wave, before + 1);
  assert.equal(game.cleared, 1);
});

test('no frame ever renders a GAME OVER', () => {
  const {game, frames} = newGame();
  game.graceTicks = 0;
  for (let i = 0; i < 40; i++) {
    game.bombs.push({x: game.player.x + 1, y: ROWS - 1});
    game.tick();
  }
  const bad = frames.filter((f) => /GAME OVER|YOU WIN/i.test(f.footer));
  assert.equal(bad.length, 0, 'the footer should never announce an ending');
  assert.ok(frames.at(-1).hud.includes('∞'), 'the HUD should show an infinite shield');
});

/* GameModal records discovery from `connext:gameend`. That used to fire on
   game over, so removing game over would have silently stopped the game
   from ever being marked as found. It now fires on the first wave cleared,
   and this is the test that keeps it honest. */
test('clearing the first wave still reports the game as found', () => {
  const events = [];
  const priorWindow = globalThis.window;
  globalThis.window = {
    addEventListener() {}, removeEventListener() {},
    dispatchEvent: (e) => { events.push(e); return true; },
  };
  globalThis.CustomEvent = globalThis.CustomEvent || class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
  try {
    const game = new SpaceInvaders({onFrame() {}, onExit() {}});
    game.stop();
    game.ufos.forEach((u) => { u.alive = false; u.exploding = 0; });
    game.tick();
    const end = events.filter((e) => e.type === 'connext:gameend');
    assert.equal(end.length, 1, 'exactly one gameend should fire');
    assert.equal(end[0].detail.id, 'invaders');
    assert.equal(end[0].detail.won, true);

    // and only once per run
    game.ufos.forEach((u) => { u.alive = false; u.exploding = 0; });
    game.tick();
    assert.equal(events.filter((e) => e.type === 'connext:gameend').length, 1);
  } finally {
    globalThis.window = priorWindow;
  }
});
