/**
 * <LockPick />
 *
 * Keepiq's mini-game, and the one everybody has played before: set the
 * pick, lean on the cylinder, feel how far it comes round. Close to
 * the sweet spot it turns; far from it the pick strains and eventually
 * snaps. Three picks, and each lock you open is narrower than the last.
 *
 * The rules live in ./engine.js with no DOM and no clock of their own.
 * There is one here, and only one thing uses it: torque is held rather
 * than pressed, and wear is time under load, so the frame loop exists
 * to advance the hold. Nothing else in the game is timed — a lock is
 * still a puzzle you reason your way into, and the clock measures your
 * nerve, not your speed.
 *
 * Usage on a product page:
 *
 *   <LockPick />
 *
 * Fires the shared `connext:gameend` event when the last pick snaps,
 * and listens for `connext:gamereplay`.
 *
 * Accessibility: the dial is a real slider, so arrow keys, Home and End
 * work without any code of ours, and the feedback after every turn is
 * a sentence rather than a bar. A player who cannot see the dial can
 * pick every lock in the game from the feedback alone, which is the
 * property the engine tests pin.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  createGame, setPosition, cylinderTurn, beginTurn, holdTurn, releaseTurn,
  summarise, POSITIONS,
} from './engine';
import styles from './LockPick.module.css';

const GAME_ID = 'lock-pick';

/* What the last turn felt like, in words. The thresholds match the
   engine's `give`, so the sentence and the strain always agree. */
function feelCopy(value) {
  if (value >= 0.97) {
    return translate({id: 'preset.lockPick.feel.almost', message: 'It almost turns. You are within a hair of it.', description: 'Lock-pick feedback when the pick is very close to the sweet spot'});
  }
  if (value >= 0.85) {
    return translate({id: 'preset.lockPick.feel.close', message: 'The cylinder turns a good way, then stops.', description: 'Lock-pick feedback when the pick is close'});
  }
  if (value >= 0.6) {
    return translate({id: 'preset.lockPick.feel.some', message: 'It gives a little.', description: 'Lock-pick feedback when the pick is somewhere near'});
  }
  if (value >= 0.3) {
    return translate({id: 'preset.lockPick.feel.barely', message: 'Barely anything. You are a long way off.', description: 'Lock-pick feedback when the pick is far from the sweet spot'});
  }
  return translate({id: 'preset.lockPick.feel.nothing', message: 'Nothing. The cylinder does not move at all.', description: 'Lock-pick feedback when the pick is nowhere near the sweet spot'});
}

export default function LockPick({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  /* Bumped per run, and read with game.snapped to key the pick in the
     keyway. A new run or a fresh pick after a snap remounts it, which
     is what replays the going-in animation; without it the pick would
     only ever slide in once per page. */
  const [run, setRun] = useState(0);
  const gameRef = useRef(null);
  const endedRef = useRef(false);

  /* A beat of "that worked" or "that broke". Driven off the counters
     rather than off last.result, because last sticks around until the
     next action and a class that never goes away never replays. */
  const [flash, setFlash] = useState(null);
  const marksRef = useRef({opened: 0, snapped: 0});

  const running = Boolean(game) && !game.over;

  const begin = useCallback(() => {
    endedRef.current = false;
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31)});
    gameRef.current = fresh;
    /* Reset the marks with the run, or the first lock of run two is
       compared against run one's totals and never flashes. */
    marksRef.current = {opened: 0, snapped: 0};
    setFlash(null);
    setGame(fresh);
    setRun((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!game) return undefined;
    const seen = marksRef.current;
    const kind = game.opened > seen.opened ? 'opened'
      : game.snapped > seen.snapped ? 'snapped'
        : null;
    marksRef.current = {opened: game.opened, snapped: game.snapped};
    if (!kind) return undefined;
    setFlash(kind);
    /* Long enough to outlast the animation it drives, or the element
       carrying it unmounts halfway through. Kept beside the CSS
       durations: 900ms for the lock giving, 600ms for a pick coming
       apart. */
    const id = setTimeout(() => setFlash(null), kind === 'opened' ? 940 : 660);
    return () => clearTimeout(id);
  }, [game]);

  useEffect(() => {
    if (!game || !game.over || endedRef.current) return;
    endedRef.current = true;
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('connext:gameend', {
      detail: {
        id: GAME_ID,
        won: false,
        score: game.score,
        summary: summarise(game, locale),
        title: translate({id: 'preset.lockPick.over.title', message: 'That was the last pick.', description: 'Headline on the game-over dialog after a lock-pick run'}),
        subtitle: translate({id: 'preset.lockPick.over.subtitle', message: 'The lock is still shut, which is rather the point of a good one.', description: 'Subtitle on the game-over dialog after a lock-pick run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const moveTo = useCallback((value) => {
    if (!gameRef.current || gameRef.current.over) return;
    const next = setPosition(gameRef.current, value);
    gameRef.current = next;
    setGame(next);
  }, []);

  /* Torque is held, not pressed. The frame loop is the only clock in
     the game, and it exists for this: wear is time under load, so the
     rules have to be advanced while the button is down. */
  const holdingRef = useRef(false);
  const rafRef = useRef(0);
  const startedAtRef = useRef(0);
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;

  const letGo = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const next = releaseTurn(gameRef.current);
    gameRef.current = next;
    setGame(next);
  }, []);

  const leanOn = useCallback(() => {
    if (holdingRef.current || !gameRef.current || gameRef.current.over) return;
    holdingRef.current = true;
    startedAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const next = beginTurn(gameRef.current, 0);
    gameRef.current = next;
    setGame(next);
    /* The nick alone can finish a pick that was nearly gone. */
    if (!next.turning) { holdingRef.current = false; return; }

    const frame = () => {
      const advanced = holdTurn(gameRef.current, nowMs());
      if (advanced !== gameRef.current) {
        gameRef.current = advanced;
        setGame(advanced);
      }
      /* The lock opening or the pick snapping both end the hold from
         the rules' side; stop driving it and wait for the pointer. */
      if (!advanced.turning) { holdingRef.current = false; return; }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  /* Let go wherever the pointer ends up, including outside the button
     and outside the window: a pick left silently under load while the
     player is somewhere else would snap for nothing. */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('pointerup', letGo);
    window.addEventListener('pointercancel', letGo);
    window.addEventListener('blur', letGo);
    return () => {
      window.removeEventListener('pointerup', letGo);
      window.removeEventListener('pointercancel', letGo);
      window.removeEventListener('blur', letGo);
      cancelAnimationFrame(rafRef.current);
    };
  }, [letGo]);

  const position = game ? game.position : Math.floor(POSITIONS / 2);
  const last = game ? game.last : null;
  /* What the cylinder is actually doing, which is nothing at all
     unless torque is on. This used to read give() at the live dial
     position, so sliding the pick narrated your distance for free and
     no pick ever broke; before that a press bought one reading and a
     lump of wear, and the lock could not be swept at all. Holding is
     the answer to both: the reading is free to glance at and expensive
     to stare at, and the picture must come from the engine's own
     rotation or the dial starts telling on the lock again. */
  const turned = game ? cylinderTurn(game) : 0;
  const underLoad = Boolean(game && game.turning);
  /* Zero on the dial is hard left, 99 hard right, stopping short of
     flat so both ends of the dial read as ends. */
  const pickAngle = -85 + (position / (POSITIONS - 1)) * 170;

  return (
    <section className={[styles.lp, className].filter(Boolean).join(' ')} aria-labelledby="lock-pick-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.lockPick.eyebrow', message: 'Mini-game', description: 'Eyebrow above the lock-pick game on a product page'})}
          </p>
          <h3 className={styles.title} id="lock-pick-title">
            {translate({id: 'preset.lockPick.title', message: 'Lock pick', description: 'Name of the Keepiq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.lockPick.lede', message: 'Set the pick, then lean on the cylinder and watch how far it comes round. Letting go once it stops costs nothing. Keep pushing and the pick starts to go, faster the further off you are. Three picks for the whole run, and each lock is tighter than the last.', description: 'One-line explanation of the lock-pick rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.lockPick.hud.score', message: 'Score {score}', description: 'Score readout on the lock-pick HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.lockPick.hud.picks', message: 'Picks {picks}', description: 'Remaining-picks readout on the lock-pick HUD'}, {picks: game ? game.picks : 3})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.lockPick.hud.opened', message: 'Opened {opened}', description: 'Opened-locks readout on the lock-pick HUD'}, {opened: game ? game.opened : 0})}
          </span>
        </div>
      </header>

      <div className={styles.lock}>
        {/* The cylinder, turned as far as the last attempt managed. */}
        <div
          className={[
            styles.cylinder,
            underLoad && styles.cylinderShake,
            flash === 'opened' && styles.cylinderOpened,
          ].filter(Boolean).join(' ')}
          role="img"
          aria-label={translate(
            {id: 'preset.lockPick.cylinder', message: 'The cylinder has come round {percent} per cent', description: 'Accessible description of the lock cylinder. {percent} is how far it has actually turned under the torque being applied.'},
            {percent: Math.round(turned * 100)},
          )}>
          <div
            className={[styles.cylinderFill, underLoad && styles.cylinderLoaded].filter(Boolean).join(' ')}
            style={{transform: `rotate(${-90 + turned * 80}deg)`}}
          />
          <span className={styles.keyhole} aria-hidden="true" />
          {/* The pick, once there is one in your hand. Zero on the dial
              is hard left, 99 is hard right, and the sweep stops short
              of flat so both ends read as ends. An empty keyway before
              the first pick and after the last one is the whole state
              of the run, said without a word. */}
          {running && (
            <span
              key={`${run}-${game.snapped}`}
              className={[
                styles.pickArm,
                styles.pickIn,
                /* Mounted because one just broke, so it waits out the
                   snap and the pause before dropping in. */
                game.snapped > 0 && styles.pickAfterBreak,
                underLoad && styles.pickArmLoaded,
              ].filter(Boolean).join(' ')}
              aria-hidden="true"
              style={{transform: `rotate(${pickAngle}deg)`}}
            />
          )}
          {/* The one that just went, left at the angle it broke at
              while its replacement drops in behind it. */}
          {flash === 'snapped' && (
            <span
              key={`broke-${game.snapped}`}
              className={styles.pickBroken}
              aria-hidden="true"
              style={{'--lp-angle': `${pickAngle}deg`}}
            />
          )}
        </div>

        <div className={styles.dial}>
          <label className={styles.dialLabel} htmlFor="lock-pick-dial">
            {translate({id: 'preset.lockPick.dialLabel', message: 'Where the pick sits', description: 'Label for the lock-pick dial slider'})}
          </label>
          <input
            id="lock-pick-dial"
            className={styles.slider}
            type="range"
            min={0}
            max={POSITIONS - 1}
            step={1}
            value={position}
            disabled={!running}
            onChange={(e) => moveTo(Number(e.target.value))}
          />
          <p className={styles.feel} role="status" aria-live="polite">
            {underLoad
              ? translate({id: 'preset.lockPick.feelUnderLoad', message: 'Leaning on it. Let go when you have seen enough.', description: 'Line shown while the player is holding torque on the lock'})
              : (last && last.result === 'held' && feelCopy(last.give))
                || translate({id: 'preset.lockPick.feelIdle', message: 'Set the pick, then lean on the cylinder to feel for it.', description: 'Placeholder where the feel line sits before any torque has been applied'})}
          </p>

          <div className={styles.pickRow}>
            <span className={styles.pickLabel}>
              {translate({id: 'preset.lockPick.wear', message: 'This pick', description: 'Label for the lock-pick durability bar'})}
            </span>
            <span
              className={styles.wear}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={game ? game.durability : 100}
              aria-label={translate({id: 'preset.lockPick.wearLabel', message: 'How much of this pick is left', description: 'Accessible name of the bar showing the current pick condition'})}>
              <span
                className={[
                  styles.wearFill,
                  underLoad && styles.wearLive,
                  game && game.durability <= 35 && styles.wearLow,
                ].filter(Boolean).join(' ')}
                style={{width: `${Math.max(0, Math.round(game ? game.durability : 100))}%`}}
              />
            </span>
          </div>
        </div>
      </div>

      <footer className={styles.foot}>
        {/* Held, not clicked. Space and Enter hold too, with the
            auto-repeat ignored, so the lock is pickable from the
            keyboard on the same terms as from a mouse. */}
        <button
          type="button"
          className={[styles.turn, underLoad && styles.turnLoaded].filter(Boolean).join(' ')}
          disabled={!running}
          onPointerDown={(e) => { e.preventDefault(); leanOn(); }}
          onKeyDown={(e) => {
            if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
            e.preventDefault();
            leanOn();
          }}
          onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') letGo(); }}
          onBlur={letGo}>
          {translate({id: 'preset.lockPick.turn', message: 'Hold to turn the cylinder', description: 'Button the player presses and holds to put the lock under torque'})}
        </button>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.lockPick.restart', message: 'New lock', description: 'Button that restarts the lock-pick game'})
            : translate({id: 'preset.lockPick.start', message: 'Take a pick', description: 'Button that starts the lock-pick game'})}
        </button>
        <p className={styles.feedback} role="status" aria-live="polite">
          {last && last.result === 'opened' && translate(
            {id: 'preset.lockPick.feedback.opened', message: 'Open, in {attempts}. Worth {points}. The next one is tighter.', description: 'Feedback after opening a lock. {attempts} is how many turns it took, {points} what it scored.'},
            {attempts: last.attempts, points: last.points},
          )}
          {last && last.result === 'snapped' && translate({id: 'preset.lockPick.feedback.snapped', message: 'The pick snapped. The lock is where you left it, so keep going from there.', description: 'Feedback after a pick breaks'})}
          {last && last.result === 'held' && feelCopy(last.give)}
          {!last && translate({id: 'preset.lockPick.hint', message: 'Move the pick with the slider or the arrow keys. Sweep as much as you like: reading the lock is free, and only pushing a cylinder that has already stopped wears the pick. It does not heal between locks.', description: 'Hint under the lock-pick board before the first turn'})}
        </p>
      </footer>
    </section>
  );
}
