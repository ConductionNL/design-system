/**
 * <BlueprintRush />
 *
 * Buildiq's mini-game. A blueprint asks for the parts an app needs,
 * in the reader's words rather than ours: where the records live, what
 * one looks like, how people fill it in, who may see it. The tray
 * offers those parts plus a few that belong to some other app. Fit the
 * blueprint before the clock runs out; every finished app buys time.
 *
 * A puzzle rather than a reaction test, on purpose: the other two
 * games are about speed, and a third one of those would be the same
 * game a third time. Here the clock is the only pressure and the work
 * is reading.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage on a product page:
 *
 *   <BlueprintRush />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`, like every other mini-game.
 *
 * Accessibility: the tray is a row of buttons, each labelled with the
 * part it places, and the slots are a list that says what is still
 * missing. Nothing depends on position or colour.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, step, place, timeLeft, summarise} from './engine';
import styles from './BlueprintRush.module.css';

const GAME_ID = 'blueprint-rush';
const TICK_MS = 100;

/* What the blueprint asks for, and what the tray offers, in the words
   a business owner would use. The part key is never shown. */
function partCopy(part) {
  switch (part) {
    case 'register':
      return {
        slot: translate({id: 'preset.blueprintRush.slot.register', message: 'Somewhere to keep the records', description: 'Blueprint slot asking for a register'}),
        tray: translate({id: 'preset.blueprintRush.tray.register', message: 'A register', description: 'Tray part: a register'}),
      };
    case 'schema':
      return {
        slot: translate({id: 'preset.blueprintRush.slot.schema', message: 'What one record looks like', description: 'Blueprint slot asking for a schema'}),
        tray: translate({id: 'preset.blueprintRush.tray.schema', message: 'A set of fields', description: 'Tray part: a schema'}),
      };
    case 'form':
      return {
        slot: translate({id: 'preset.blueprintRush.slot.form', message: 'How people fill one in', description: 'Blueprint slot asking for a form'}),
        tray: translate({id: 'preset.blueprintRush.tray.form', message: 'A form', description: 'Tray part: a form'}),
      };
    case 'view':
      return {
        slot: translate({id: 'preset.blueprintRush.slot.view', message: 'How people find one back', description: 'Blueprint slot asking for a list view'}),
        tray: translate({id: 'preset.blueprintRush.tray.view', message: 'A list with search', description: 'Tray part: a list view'}),
      };
    case 'flow':
      return {
        slot: translate({id: 'preset.blueprintRush.slot.flow', message: 'What happens after someone saves', description: 'Blueprint slot asking for a flow'}),
        tray: translate({id: 'preset.blueprintRush.tray.flow', message: 'A flow', description: 'Tray part: a flow'}),
      };
    case 'permission':
      return {
        slot: translate({id: 'preset.blueprintRush.slot.permission', message: 'Who is allowed to see it', description: 'Blueprint slot asking for permissions'}),
        tray: translate({id: 'preset.blueprintRush.tray.permission', message: 'A group and its rights', description: 'Tray part: permissions'}),
      };
    case 'widget':
      return {
        slot: translate({id: 'preset.blueprintRush.slot.widget', message: 'What the manager sees on Monday', description: 'Blueprint slot asking for a dashboard widget'}),
        tray: translate({id: 'preset.blueprintRush.tray.widget', message: 'A dashboard widget', description: 'Tray part: a dashboard widget'}),
      };
    default:
      return {
        slot: translate({id: 'preset.blueprintRush.slot.notification', message: 'Who hears about it', description: 'Blueprint slot asking for a notification'}),
        tray: translate({id: 'preset.blueprintRush.tray.notification', message: 'A notification', description: 'Tray part: a notification'}),
      };
  }
}

export default function BlueprintRush({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const gameRef = useRef(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;

  const begin = useCallback(() => {
    endedRef.current = false;
    startedAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31), now: 0});
    gameRef.current = fresh;
    setGame(fresh);
    setSeconds(Math.ceil(timeLeft(fresh, 0) / 1000));
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const t = now();
      const next = step(gameRef.current, t);
      gameRef.current = next;
      setGame(next);
      setSeconds(Math.ceil(timeLeft(next, t) / 1000));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

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
        title: translate({id: 'preset.blueprintRush.over.title', message: 'Time, and the blueprint is still open.', description: 'Headline on the game-over dialog after a blueprint-rush run'}),
        subtitle: translate({id: 'preset.blueprintRush.over.subtitle', message: 'Every finished app bought you seconds. The wrong parts spent them.', description: 'Subtitle on the game-over dialog after a blueprint-rush run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const put = useCallback((part) => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = place(gameRef.current, part, t);
    gameRef.current = next;
    setGame(next);
    setSeconds(Math.ceil(timeLeft(next, t) / 1000));
  }, []);

  const blueprint = game ? game.blueprint : null;
  const filled = blueprint ? blueprint.filled : [];
  const last = game && game.last ? game.last : null;

  return (
    <section className={[styles.br, className].filter(Boolean).join(' ')} aria-labelledby="blueprint-rush-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.blueprintRush.eyebrow', message: 'Mini-game', description: 'Eyebrow above the blueprint-rush game on a product page'})}
          </p>
          <h3 className={styles.title} id="blueprint-rush-title">
            {translate({id: 'preset.blueprintRush.title', message: 'Blueprint rush', description: 'Name of the Buildiq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.blueprintRush.lede', message: 'Every app needs the same few parts. Pick them off the shelf before the clock runs out, and skip the ones that belong to somebody else’s app.', description: 'One-line explanation of the blueprint-rush rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.blueprintRush.hud.score', message: 'Score {score}', description: 'Score readout on the blueprint-rush HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={[styles.hudPill, running && seconds <= 5 && styles.hudLow].filter(Boolean).join(' ')}>
            {translate({id: 'preset.blueprintRush.hud.time', message: '{seconds}s left', description: 'Remaining-time readout on the blueprint-rush HUD'}, {seconds: running ? seconds : 0})}
          </span>
        </div>
      </header>

      <div className={styles.board}>
        <ol className={styles.slots}>
          {(blueprint ? blueprint.needed : []).map((part) => {
            const done = filled.includes(part);
            const copy = partCopy(part);
            return (
              <li key={part} className={[styles.slot, done && styles.slotDone].filter(Boolean).join(' ')}>
                <span className={styles.slotMark} aria-hidden="true" />
                <span className={styles.slotText}>{copy.slot}</span>
                <span className={styles.slotState}>
                  {done
                    ? translate({id: 'preset.blueprintRush.slot.done', message: 'in place', description: 'State of a blueprint slot that has been filled'})
                    : translate({id: 'preset.blueprintRush.slot.open', message: 'open', description: 'State of a blueprint slot that is still empty'})}
                </span>
              </li>
            );
          })}
          {!blueprint && (
            <li className={styles.slot}>
              <span className={styles.slotText}>
                {translate({id: 'preset.blueprintRush.idle', message: 'An empty blueprint, and a shelf full of parts.', description: 'Placeholder on the blueprint before the game starts'})}
              </span>
            </li>
          )}
        </ol>

        <div className={styles.tray}>
          {(blueprint ? blueprint.tray : []).map((part) => {
            const done = filled.includes(part);
            return (
              <button
                key={part}
                type="button"
                className={[styles.part, done && styles.partUsed].filter(Boolean).join(' ')}
                onClick={() => put(part)}
                disabled={!running || done}>
                {partCopy(part).tray}
              </button>
            );
          })}
        </div>
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.blueprintRush.restart', message: 'Restart', description: 'Button that restarts the blueprint-rush game'})
            : translate({id: 'preset.blueprintRush.start', message: 'Open a blueprint', description: 'Button that starts the blueprint-rush game'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'built' && translate({id: 'preset.blueprintRush.feedback.built', message: 'App built. That bought you seven seconds.', description: 'Feedback after completing a blueprint'})}
          {last && last.result === 'wrong' && translate({id: 'preset.blueprintRush.feedback.wrong', message: 'That part belongs to another app. Two and a half seconds gone.', description: 'Feedback after picking a part the blueprint does not need'})}
          {last && last.result === 'duplicate' && translate({id: 'preset.blueprintRush.feedback.duplicate', message: 'That one is already in place.', description: 'Feedback after picking a part that is already on the blueprint'})}
          {(!last || last.result === 'placed' || last.result === 'timeout') && translate({id: 'preset.blueprintRush.hint', message: 'Read the blueprint, then take what it asks for. Each app in a row is worth more than the last.', description: 'Hint under the blueprint-rush board'})}
        </p>
      </footer>
    </section>
  );
}
