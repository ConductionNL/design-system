/**
 * <PaintByTokens />
 *
 * Thematiq's mini-game. Paint by numbers, where the numbers are the
 * tokens a theme is made of: surface, accent, ink, muted, line. Pick a
 * token, fill the cells that ask for it, finish the picture before the
 * clock runs out.
 *
 * The swatch is never the answer. Each cell says which token it wants,
 * and what colour that token is depends on the theme the page is
 * wearing, which is the habit the app exists to teach.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage on a product page:
 *
 *   <PaintByTokens />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`.
 *
 * Accessibility: every cell is a button that says which token it wants
 * and whether it is filled, and the palette is a radio-style row on the
 * number keys. Nothing here needs colour to be played, which is a
 * strange thing to say about a painting game and the reason it works.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, paint, select, step, timeLeft, remaining, summarise, TOKENS, COLS} from './engine';
import styles from './PaintByTokens.module.css';

const GAME_ID = 'paint-by-tokens';
const TICK_MS = 100;

function tokenLabel(token) {
  switch (TOKENS[token]) {
    case 'surface':
      return translate({id: 'preset.paintByTokens.token.surface', message: 'surface', description: 'Name of the surface token in the paint-by-tokens game'});
    case 'accent':
      return translate({id: 'preset.paintByTokens.token.accent', message: 'accent', description: 'Name of the accent token in the paint-by-tokens game'});
    case 'ink':
      return translate({id: 'preset.paintByTokens.token.ink', message: 'ink', description: 'Name of the ink token in the paint-by-tokens game'});
    case 'muted':
      return translate({id: 'preset.paintByTokens.token.muted', message: 'muted', description: 'Name of the muted token in the paint-by-tokens game'});
    default:
      return translate({id: 'preset.paintByTokens.token.line', message: 'line', description: 'Name of the line token in the paint-by-tokens game'});
  }
}

export default function PaintByTokens({className}) {
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
        title: translate({id: 'preset.paintByTokens.over.title', message: 'Time, and the theme is half painted.', description: 'Headline on the game-over dialog after a paint-by-tokens run'}),
        subtitle: translate({id: 'preset.paintByTokens.over.subtitle', message: 'Every finished picture bought you time. Painting by eye spent it.', description: 'Subtitle on the game-over dialog after a paint-by-tokens run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const pick = useCallback((token) => {
    if (!gameRef.current) return;
    const next = select(gameRef.current, token);
    gameRef.current = next;
    setGame(next);
  }, []);

  const fill = useCallback((index) => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = paint(gameRef.current, index, t);
    gameRef.current = next;
    setGame(next);
    setSeconds(Math.ceil(timeLeft(next, t) / 1000));
  }, []);

  useEffect(() => {
    if (!running || typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= TOKENS.length) {
        e.preventDefault();
        pick(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, pick]);

  const cells = game ? game.cells : [];
  const selected = game ? game.selected : 0;
  const last = game ? game.last : null;

  return (
    <section className={[styles.pbt, className].filter(Boolean).join(' ')} aria-labelledby="paint-by-tokens-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.paintByTokens.eyebrow', message: 'Mini-game', description: 'Eyebrow above the paint-by-tokens game on a product page'})}
          </p>
          <h3 className={styles.title} id="paint-by-tokens-title">
            {translate({id: 'preset.paintByTokens.title', message: 'Paint by tokens', description: 'Name of the Thematiq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.paintByTokens.lede', message: 'Paint by numbers, except the numbers are tokens. Every cell says which one it wants, and what colour that is depends on the theme, not on your eye.', description: 'One-line explanation of the paint-by-tokens rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.paintByTokens.hud.score', message: 'Score {score}', description: 'Score readout on the paint-by-tokens HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={[styles.hudPill, running && seconds <= 5 && styles.hudLow].filter(Boolean).join(' ')}>
            {translate({id: 'preset.paintByTokens.hud.time', message: '{seconds}s left', description: 'Remaining-time readout on the paint-by-tokens HUD'}, {seconds: running ? seconds : 0})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.paintByTokens.hud.left', message: '{left} cells to go', description: 'Remaining-cells readout on the paint-by-tokens HUD'}, {left: game ? remaining(game) : 0})}
          </span>
        </div>
      </header>

      <div className={styles.palette} role="group" aria-label={translate({id: 'preset.paintByTokens.paletteLabel', message: 'Tokens', description: 'Accessible name for the paint-by-tokens palette'})}>
        {TOKENS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={[styles.swatch, styles[`tone${i}`], i === selected && styles.swatchOn].filter(Boolean).join(' ')}
            onClick={() => pick(i)}
            disabled={!running}
            aria-pressed={i === selected}>
            <span className={styles.swatchKey} aria-hidden="true">{i + 1}</span>
            <span className={styles.swatchName}>{tokenLabel(i)}</span>
          </button>
        ))}
      </div>

      <div className={styles.grid} style={{gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`}}>
        {cells.map((cell, i) => (
          <button
            key={i}
            type="button"
            className={[
              styles.cell,
              cell.painted && styles.cellPainted,
              cell.painted && styles[`tone${cell.token}`],
            ].filter(Boolean).join(' ')}
            onClick={() => fill(i)}
            disabled={!running || cell.painted}
            aria-label={cell.painted
              ? translate({id: 'preset.paintByTokens.cell.done', message: 'Filled with {token}', description: 'Accessible label for a painted cell'}, {token: tokenLabel(cell.token)})
              : translate({id: 'preset.paintByTokens.cell.open', message: 'Wants {token}', description: 'Accessible label for an unpainted cell'}, {token: tokenLabel(cell.token)})}>
            <span aria-hidden="true">{cell.painted ? '' : cell.token + 1}</span>
          </button>
        ))}
        {!game && (
          <p className={styles.idle}>
            {translate({id: 'preset.paintByTokens.idle', message: 'An empty theme, and five tokens to fill it with.', description: 'Placeholder before the paint-by-tokens game starts'})}
          </p>
        )}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.paintByTokens.restart', message: 'Restart', description: 'Button that restarts the paint-by-tokens game'})
            : translate({id: 'preset.paintByTokens.start', message: 'Open a theme', description: 'Button that starts the paint-by-tokens game'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'finished' && translate({id: 'preset.paintByTokens.feedback.finished', message: 'Theme done. That bought you twenty seconds.', description: 'Feedback after finishing a picture'})}
          {last && last.result === 'wrong' && translate(
            {id: 'preset.paintByTokens.feedback.wrong', message: 'That cell wanted {wanted}, not {used}. Three seconds gone.', description: 'Feedback after filling a cell with the wrong token'},
            {wanted: tokenLabel(last.wanted), used: tokenLabel(last.used)},
          )}
          {(!last || last.result === 'painted' || last.result === 'timeout') && translate({id: 'preset.paintByTokens.hint', message: 'Pick a token with the number keys, then fill every cell that asks for it.', description: 'Hint under the paint-by-tokens board'})}
        </p>
      </footer>
    </section>
  );
}
