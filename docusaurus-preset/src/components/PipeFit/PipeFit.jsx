/**
 * <PipeFit />
 *
 * Integriq's game. A record is leaving one system for another and the
 * route between them is half built. Turn each connector until the line
 * runs end to end, before the payload arrives and finds a gap.
 *
 * Turning a connector moves both its openings at once, so fixing the
 * join on one side can break the join on the other. That is the whole
 * puzzle, and it is what connecting two systems actually feels like.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage:
 *
 *   <PipeFit />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`.
 *
 * Accessibility: every connector is a button that says which openings
 * it currently has and whether it meets its neighbour, so the route
 * can be read and solved without seeing the diagram.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, turn, step, openings, connected, remaining, summarise} from './engine';
import styles from './PipeFit.module.css';

const GAME_ID = 'pipe-fit';
const TICK_MS = 100;

/* Ports are heights, and heights have names: a route read aloud as
   "top meets middle" is one you can solve with your eyes shut. */
function portName(port) {
  if (port === 0) {
    return translate({id: 'preset.pipeFit.port.top', message: 'top', description: 'The upper opening of a connector'});
  }
  if (port === 1) {
    return translate({id: 'preset.pipeFit.port.middle', message: 'middle', description: 'The middle opening of a connector'});
  }
  return translate({id: 'preset.pipeFit.port.bottom', message: 'bottom', description: 'The lower opening of a connector'});
}

export default function PipeFit({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [left, setLeft] = useState(1);
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
    setLeft(1);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const t = now();
      const next = step(gameRef.current, t);
      gameRef.current = next;
      setGame(next);
      setLeft(remaining(next, t));
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
        title: translate({id: 'preset.pipeFit.over.title', message: 'It went nowhere.', description: 'Headline on the game-over dialog after a pipe-fit run'}),
        subtitle: translate({id: 'preset.pipeFit.over.subtitle', message: 'Three payloads into a gap. Somebody will notice next quarter.', description: 'Subtitle on the game-over dialog after a pipe-fit run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const rotate = useCallback((index) => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = turn(gameRef.current, index, t);
    gameRef.current = next;
    setGame(next);
    setLeft(remaining(next, t));
  }, []);

  const route = game ? game.route : null;
  const last = game ? game.last : null;
  const pct = Math.round(left * 100);

  /* What each piece is carrying in, so a join can be judged. */
  const carries = [];
  if (route) {
    let carry = route.source;
    for (const piece of route.pieces) {
      carries.push(carry);
      carry = openings(piece).right;
    }
  }

  return (
    <section className={[styles.pf, className].filter(Boolean).join(' ')} aria-labelledby="pipe-fit-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.pipeFit.eyebrow', message: 'Mini-game', description: 'Eyebrow above the pipe-fit game on a product page'})}
          </p>
          <h3 className={styles.title} id="pipe-fit-title">
            {translate({id: 'preset.pipeFit.title', message: 'Make the connection', description: 'Name of the Integriq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.pipeFit.lede', message: 'A record is on its way from one system to another and the route is half built. Turn the connectors until the line runs end to end. Turning one moves both its openings, which is the whole problem.', description: 'One-line explanation of the pipe-fit rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.pipeFit.hud.score', message: 'Score {score}', description: 'Score readout on the pipe-fit HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.pipeFit.hud.lives', message: 'Payloads left {lives}', description: 'Remaining-lives readout on the pipe-fit HUD'}, {lives: game ? game.lives : 3})}
          </span>
        </div>
      </header>

      {route ? (
        <>
          <div className={styles.route}>
            <span className={[styles.end, styles[`port-${route.source}`]].join(' ')}>
              {translate({id: 'preset.pipeFit.source', message: 'Source', description: 'The system a record leaves in the pipe-fit game'})}
            </span>

            {route.pieces.map((piece, i) => {
              const {left: inPort, right: outPort} = openings(piece);
              const joined = inPort === carries[i];
              return (
                <button
                  key={i}
                  type="button"
                  className={[styles.piece, joined ? styles.joined : styles.gap].join(' ')}
                  onClick={() => rotate(i)}
                  disabled={!running}
                  aria-label={translate(
                    {id: 'preset.pipeFit.piece', message: 'Connector {n}: opens {in} to {out}, {state}. Turn it.', description: 'Accessible label for one connector. {in} and {out} are openings, {state} says whether it meets the piece before it.'},
                    {
                      n: i + 1,
                      in: portName(inPort),
                      out: portName(outPort),
                      state: joined
                        ? translate({id: 'preset.pipeFit.piece.joined', message: 'meets the one before it', description: 'State of a connector that lines up'})
                        : translate({id: 'preset.pipeFit.piece.gap', message: 'does not meet the one before it', description: 'State of a connector that does not line up'}),
                    },
                  )}>
                  <span className={[styles.mouth, styles[`port-${inPort}`]].join(' ')} aria-hidden="true" />
                  <span className={styles.barrel} aria-hidden="true" />
                  <span className={[styles.mouth, styles[`port-${outPort}`]].join(' ')} aria-hidden="true" />
                </button>
              );
            })}

            <span className={[styles.end, styles[`port-${route.target}`]].join(' ')}>
              {translate({id: 'preset.pipeFit.target', message: 'Consumer', description: 'The system a record arrives at in the pipe-fit game'})}
            </span>
          </div>

          <div
            className={styles.clock}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={translate({id: 'preset.pipeFit.clock', message: 'Time before the payload arrives', description: 'Accessible name of the pipe-fit countdown'})}>
            <div className={[styles.clockFill, left < 0.3 && styles.clockLow].filter(Boolean).join(' ')} style={{width: `${pct}%`}} />
          </div>
        </>
      ) : (
        <p className={styles.idle}>
          {translate({id: 'preset.pipeFit.idle', message: 'Two systems, and nothing in between them yet.', description: 'Placeholder before the pipe-fit game starts'})}
        </p>
      )}

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.pipeFit.restart', message: 'Restart', description: 'Button that restarts the pipe-fit game'})
            : translate({id: 'preset.pipeFit.start', message: 'Send it', description: 'Button that starts the pipe-fit game'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'connected' && translate({id: 'preset.pipeFit.feedback.connected', message: 'Through. The next one is longer.', description: 'Feedback after completing a route'})}
          {last && last.result === 'spilled' && translate({id: 'preset.pipeFit.feedback.spilled', message: 'The payload arrived and found a gap.', description: 'Feedback after the clock runs out'})}
          {(!last || last.result === 'turned') && translate({id: 'preset.pipeFit.hint', message: 'Click a connector to turn it. Both of its openings move together.', description: 'Hint under the pipe-fit route'})}
        </p>
      </footer>
    </section>
  );
}
