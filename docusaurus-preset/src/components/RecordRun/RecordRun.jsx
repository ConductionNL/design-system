/**
 * <RecordRun />
 *
 * Connext's mini-game. A record travels down the stack, and the stack
 * is where records get stuck: a format nothing can read, a permission
 * nobody granted, a connector that was never built. Steer around what
 * would stop it, and pick up the apps that carry it further.
 *
 * The only one of the games with a position to steer rather than an
 * answer to choose, which is why it sits on the page about the stack
 * as a whole rather than on an app's own page.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage:
 *
 *   <RecordRun />
 *
 * Fires the shared `connext:gameend` event on game over and listens
 * for `connext:gamereplay`, like every other mini-game.
 *
 * Accessibility: three lane buttons, each usable by tab, by click and
 * by its number key (arrow keys work too). Every lane says in text
 * what is coming towards the record, so the board is readable without
 * seeing the grid, and the run is announced as it happens.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  createGame, step, move, moveTo, summarise, LANES, BLOCK, APP,
} from './engine';
import styles from './RecordRun.module.css';

const GAME_ID = 'record-run';
const TICK_MS = 60;

function blockCopy(what) {
  if (what === 'format') {
    return translate({id: 'preset.recordRun.block.format', message: 'Format nothing reads', description: 'Obstacle in the record-run game: an unreadable format'});
  }
  if (what === 'permission') {
    return translate({id: 'preset.recordRun.block.permission', message: 'Permission nobody granted', description: 'Obstacle in the record-run game: a missing permission'});
  }
  return translate({id: 'preset.recordRun.block.connector', message: 'Connector that is not there', description: 'Obstacle in the record-run game: a missing connector'});
}

function appCopy(what) {
  if (what === 'register') {
    return translate({id: 'preset.recordRun.app.register', message: 'Register', description: 'Pick-up in the record-run game: a register'});
  }
  if (what === 'catalogue') {
    return translate({id: 'preset.recordRun.app.catalogue', message: 'Catalogue', description: 'Pick-up in the record-run game: a catalogue'});
  }
  return translate({id: 'preset.recordRun.app.portal', message: 'Portal', description: 'Pick-up in the record-run game: a portal'});
}

function cellCopy(cell) {
  if (!cell || cell.kind === 'clear') return null;
  return cell.kind === BLOCK ? blockCopy(cell.what) : appCopy(cell.what);
}

export default function RecordRun({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
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
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const next = step(gameRef.current, now());
      if (next !== gameRef.current) {
        gameRef.current = next;
        setGame(next);
      }
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
        title: translate({id: 'preset.recordRun.over.title', message: 'The record got stuck.', description: 'Headline on the game-over dialog after a record-run run'}),
        subtitle: translate({id: 'preset.recordRun.over.subtitle', message: 'Three times, on the three things that always stop one.', description: 'Subtitle on the game-over dialog after a record-run run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const steer = useCallback((lane) => {
    if (!gameRef.current || gameRef.current.over) return;
    const next = moveTo(gameRef.current, lane);
    gameRef.current = next;
    setGame(next);
  }, []);

  useEffect(() => {
    if (!running || typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = move(gameRef.current, e.key === 'ArrowLeft' ? -1 : 1);
        gameRef.current = next;
        setGame(next);
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= LANES) {
        e.preventDefault();
        steer(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, steer]);

  const rows = game ? game.rows : [];
  const lane = game ? game.lane : 1;
  const last = game && game.last ? game.last : null;

  return (
    <section className={[styles.rr, className].filter(Boolean).join(' ')} aria-labelledby="record-run-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.recordRun.eyebrow', message: 'Mini-game', description: 'Eyebrow above the record-run game'})}
          </p>
          <h3 className={styles.title} id="record-run-title">
            {translate({id: 'preset.recordRun.title', message: 'Record run', description: 'Name of the Connext mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.recordRun.lede', message: 'One record, on its way through the stack. Steer around the three things that always stop one, and pick up the apps that carry it further.', description: 'One-line explanation of the record-run rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.recordRun.hud.score', message: 'Score {score}', description: 'Score readout on the record-run HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.recordRun.hud.lives', message: 'Retries {lives}', description: 'Remaining-lives readout on the record-run HUD'}, {lives: game ? game.lives : 3})}
          </span>
        </div>
      </header>

      <div className={styles.track} aria-hidden="true">
        {/* Furthest row first, so the board reads top to bottom the way
            it moves. */}
        {rows.map((row) => (
          <div className={styles.row} key={row.id}>
            {row.cells.map((cell, i) => (
              <span
                key={i}
                className={[
                  styles.cell,
                  cell.kind === BLOCK && styles.cellBlock,
                  cell.kind === APP && styles.cellApp,
                  i === lane && styles.cellLane,
                ].filter(Boolean).join(' ')}>
                {cellCopy(cell)}
              </span>
            ))}
          </div>
        ))}
        {!game && (
          <p className={styles.idle}>
            {translate({id: 'preset.recordRun.idle', message: 'A record, three lanes, and everything that gets in the way.', description: 'Placeholder on the record-run track before the game starts'})}
          </p>
        )}
      </div>

      <div className={styles.lanes}>
        {Array.from({length: LANES}).map((_, i) => {
          const incoming = rows.length ? rows[rows.length - 1].cells[i] : null;
          const what = cellCopy(incoming);
          return (
            <button
              key={i}
              type="button"
              className={[styles.lane, i === lane && styles.laneHere].filter(Boolean).join(' ')}
              onClick={() => steer(i)}
              disabled={!running}
              aria-pressed={i === lane}
              aria-label={translate(
                {id: 'preset.recordRun.laneLabel', message: 'Lane {n}. Coming next: {what}', description: 'Accessible label for a record-run lane button. {what} is what the next row holds in that lane.'},
                {n: i + 1, what: what || translate({id: 'preset.recordRun.laneClear', message: 'clear', description: 'What a record-run lane holds when the next row is empty there'})},
              )}>
              <span className={styles.laneKey} aria-hidden="true">{i + 1}</span>
              <span className={styles.laneWhat} aria-hidden="true">
                {what || translate({id: 'preset.recordRun.laneClear', message: 'clear', description: 'What a record-run lane holds when the next row is empty there'})}
              </span>
            </button>
          );
        })}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.recordRun.restart', message: 'Restart', description: 'Button that restarts the record-run game'})
            : translate({id: 'preset.recordRun.start', message: 'Send a record', description: 'Button that starts the record-run game'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'blocked' && translate(
            {id: 'preset.recordRun.feedback.blocked', message: 'Stuck on: {what}', description: 'Feedback after the record hits an obstacle. {what} is the obstacle.'},
            {what: blockCopy(last.what)},
          )}
          {last && last.result === 'collected' && translate(
            {id: 'preset.recordRun.feedback.collected', message: 'Picked up: {what}', description: 'Feedback after the record collects an app. {what} is the app.'},
            {what: appCopy(last.what)},
          )}
          {(!last || last.result === 'through') && translate({id: 'preset.recordRun.hint', message: 'Arrow keys, the number keys, or click a lane. Open lanes pay a little, apps pay more.', description: 'Hint under the record-run board explaining the controls'})}
        </p>
      </footer>
    </section>
  );
}
