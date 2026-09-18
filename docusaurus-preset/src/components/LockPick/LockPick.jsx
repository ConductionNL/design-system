/**
 * <LockPick />
 *
 * Keepiq's mini-game, and the one everybody has played before: set the
 * pick, turn the cylinder, feel how far it gives. Close to the sweet
 * spot it turns; far from it the pick strains and eventually snaps.
 * Three picks, and each lock you open is narrower than the last.
 *
 * The rules live in ./engine.js with no DOM and no clock. There is no
 * clock here either: a lock is a puzzle you reason your way into, and
 * hurrying someone who is counting clicks would only make it a worse
 * version of the timed games.
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
import {createGame, setPosition, turn, give, summarise, POSITIONS} from './engine';
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
  const gameRef = useRef(null);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;

  const begin = useCallback(() => {
    endedRef.current = false;
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31)});
    gameRef.current = fresh;
    setGame(fresh);
  }, []);

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

  const tryTurn = useCallback(() => {
    if (!gameRef.current || gameRef.current.over) return;
    const next = turn(gameRef.current);
    gameRef.current = next;
    setGame(next);
  }, []);

  const position = game ? game.position : Math.floor(POSITIONS / 2);
  const last = game ? game.last : null;
  /* The cylinder answers the pick as it moves, which is how this game
     has always worked: you feel for the spot and only then commit. The
     first version showed the last turn's result instead, so the only
     way to learn anything was to turn, and every turn wore the pick
     down. Sweeping was impossible and the game became a guessing game
     with a cost per guess.

     The feel is deliberately coarse, five buckets wide, so the dial
     narrows the answer without handing it over: the last step is still
     a commitment. */
  const turned = game && running ? give(game) : 0;
  const liveFeel = game && running ? feelCopy(turned) : null;

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
            {translate({id: 'preset.lockPick.lede', message: 'Set the pick, turn the cylinder, feel how far it gives. Every turn tells you how close you were. Three picks, and each lock is tighter than the last.', description: 'One-line explanation of the lock-pick rules'})}
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
          className={styles.cylinder}
          role="img"
          aria-label={translate(
            {id: 'preset.lockPick.cylinder', message: 'The cylinder turns {percent} per cent where the pick is now', description: 'Accessible description of the lock cylinder. {percent} is how far it turns at the current pick position.'},
            {percent: Math.round(turned * 100)},
          )}>
          <div className={styles.cylinderFill} style={{transform: `rotate(${-90 + turned * 80}deg)`}} />
          <span className={styles.keyhole} aria-hidden="true" />
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
            {liveFeel || translate({id: 'preset.lockPick.feelIdle', message: 'Take a pick to start feeling for it.', description: 'Placeholder where the live feel line sits before the game starts'})}
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
              aria-valuenow={game ? game.durability : 100}>
              <span
                className={[styles.wearFill, game && game.durability <= 35 && styles.wearLow].filter(Boolean).join(' ')}
                style={{width: `${game ? game.durability : 100}%`}}
              />
            </span>
          </div>
        </div>
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.turn} onClick={tryTurn} disabled={!running}>
          {translate({id: 'preset.lockPick.turn', message: 'Turn the cylinder', description: 'Button that attempts to turn the lock'})}
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
          {!last && translate({id: 'preset.lockPick.hint', message: 'Move the pick with the slider or the arrow keys, then turn. Wild guesses cost the pick; near misses cost very little.', description: 'Hint under the lock-pick board before the first turn'})}
        </p>
      </footer>
    </section>
  );
}
