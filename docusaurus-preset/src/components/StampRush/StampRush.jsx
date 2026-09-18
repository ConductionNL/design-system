/**
 * <StampRush />
 *
 * Decidiq's mini-game. Decisions land on the desk faster than you can
 * read them; adopt the ones that carry quorum, hold back the ones that
 * do not. Stamping a decision that has no quorum, or one you should
 * have declared an interest in, costs a life. Holding one back costs
 * nothing, which is the only way a game can reward restraint.
 *
 * The rules live in ./engine.js with no DOM and no clock, so they are
 * tested rather than observed. This file owns the clock, the keyboard
 * and the paint.
 *
 * Usage on a product page:
 *
 *   <StampRush />
 *
 * On game over it fires the same `connext:gameend` event every other
 * mini-game fires, so the shared <GameModal/> records the score and
 * offers to post it, and it listens for `connext:gamereplay` so the
 * dialog's "Play again" restarts it in place.
 *
 * Accessibility: every desk slot is a real button, reachable by tab and
 * by the number keys 1 to 6. Score, lives and each decision's state are
 * announced as text, never by colour alone. Nothing moves until the
 * player starts the game, so `prefers-reduced-motion` only quiets the
 * card entrance and the stamp flash.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, step, stamp, summarise, SLOTS, READY, NO_QUORUM, CONFLICT} from './engine';
import styles from './StampRush.module.css';

const GAME_ID = 'stamp-rush';
const TICK_MS = 100;

function cardCopy(card) {
  if (!card) return null;
  if (card.kind === READY) {
    return {
      title: translate({id: 'preset.stampRush.card.ready.title', message: 'Ready to adopt', description: 'Stamp-rush card that the player should stamp'}),
      note: translate(
        {id: 'preset.stampRush.card.ready.note', message: 'Quorum {have} of {need}', description: 'Quorum line on a stamp-rush card. {have} present, {need} required.'},
        {have: card.quorum.have, need: card.quorum.need},
      ),
    };
  }
  if (card.kind === NO_QUORUM) {
    return {
      title: translate({id: 'preset.stampRush.card.noQuorum.title', message: 'No quorum', description: 'Stamp-rush card the player must hold back because too few members are present'}),
      note: translate(
        {id: 'preset.stampRush.card.noQuorum.note', message: 'Quorum {have} of {need}', description: 'Quorum line on a stamp-rush card that lacks quorum.'},
        {have: card.quorum.have, need: card.quorum.need},
      ),
    };
  }
  return {
    title: translate({id: 'preset.stampRush.card.conflict.title', message: 'Interest declared', description: 'Stamp-rush card the player must hold back because of a declared conflict of interest'}),
    note: translate({id: 'preset.stampRush.card.conflict.note', message: 'You may not vote', description: 'Second line on the conflict-of-interest card'}),
  };
}

export default function StampRush({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [flash, setFlash] = useState(null);
  /* The run is kept in a ref as well, because the tick and the
     game-over dispatch both read it outside React's render cycle. */
  const gameRef = useRef(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;

  const begin = useCallback(() => {
    endedRef.current = false;
    startedAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31), now: 0});
    gameRef.current = fresh;
    setGame(fresh);
    setFlash(null);
  }, []);

  /* The clock. One interval for the whole board: cards expire and
     spawn on the same tick, so nothing can drift apart. */
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;
      const next = step(gameRef.current, now);
      gameRef.current = next;
      setGame(next);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  /* Game over: tell the shared dialog once, with a line it can post. */
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
        title: translate({id: 'preset.stampRush.over.title', message: 'The meeting ran out of patience.', description: 'Headline on the game-over dialog after a stamp-rush run'}),
        subtitle: translate({id: 'preset.stampRush.over.subtitle', message: 'Three bad stamps and the chair takes the pen back.', description: 'Subtitle on the game-over dialog after a stamp-rush run'}),
      },
    }));
  }, [game, locale]);

  /* "Play again" in the dialog restarts this game in place. */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const hit = useCallback((slot) => {
    if (!gameRef.current || gameRef.current.over) return;
    const card = gameRef.current.slots[slot];
    if (!card) return;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;
    const next = stamp(gameRef.current, slot, now);
    gameRef.current = next;
    setGame(next);
    setFlash({slot, good: card.kind === READY, at: now});
  }, []);

  /* Number keys 1 to 6, so the game is playable without a mouse and
     fast enough to be worth playing that way. */
  useEffect(() => {
    if (!running || typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= SLOTS) {
        e.preventDefault();
        hit(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, hit]);

  const lives = game ? game.lives : 3;
  const score = game ? game.score : 0;

  return (
    <section className={[styles.rush, className].filter(Boolean).join(' ')} aria-labelledby="stamp-rush-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.stampRush.eyebrow', message: 'Mini-game', description: 'Eyebrow above the stamp-rush game on a product page'})}
          </p>
          <h3 className={styles.title} id="stamp-rush-title">
            {translate({id: 'preset.stampRush.title', message: 'Stamp rush', description: 'Name of the Decidiq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.stampRush.lede', message: 'Adopt what has quorum. Hold back what does not. Three bad stamps and the chair takes the pen back.', description: 'One-line explanation of the stamp-rush rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudScore}>
            {translate({id: 'preset.stampRush.hud.score', message: 'Score {score}', description: 'Score readout on the stamp-rush HUD'}, {score: Number(score).toLocaleString(locale)})}
          </span>
          <span className={styles.hudLives}>
            {translate({id: 'preset.stampRush.hud.lives', message: 'Stamps left {lives}', description: 'Remaining-lives readout on the stamp-rush HUD'}, {lives})}
          </span>
        </div>
      </header>

      <div className={styles.desk}>
        {Array.from({length: SLOTS}).map((_, i) => {
          const card = game ? game.slots[i] : null;
          const copy = cardCopy(card);
          const isFlash = flash && flash.slot === i;
          return (
            <button
              key={i}
              type="button"
              className={[
                styles.slot,
                card && styles.slotFull,
                card && card.kind === READY && styles.slotReady,
                card && card.kind !== READY && styles.slotHold,
                isFlash && (flash.good ? styles.flashGood : styles.flashBad),
              ].filter(Boolean).join(' ')}
              onClick={() => hit(i)}
              onAnimationEnd={() => setFlash((f) => (f && f.slot === i ? null : f))}
              disabled={!running}
              aria-label={copy
                ? translate(
                    /* States the decision and nothing else. An
                       earlier version ended "Stamp it", which told a
                       screen-reader user to stamp the very cards the
                       game exists to hold back. */
                    {id: 'preset.stampRush.slot.full', message: 'Desk {n}: {state}, {note}', description: 'Accessible label for an occupied stamp-rush desk slot. {state} is the decision state, {note} its quorum line.'},
                    {n: i + 1, state: copy.title, note: copy.note},
                  )
                : translate({id: 'preset.stampRush.slot.empty', message: 'Desk {n}: empty', description: 'Accessible label for an empty stamp-rush desk slot'}, {n: i + 1})}>
              <span className={styles.slotIndex} aria-hidden="true">{i + 1}</span>
              {copy && (
                <span className={styles.card}>
                  <span className={styles.cardTitle}>{copy.title}</span>
                  <span className={styles.cardNote}>{copy.note}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.stampRush.restart', message: 'Restart', description: 'Button that restarts the stamp-rush game'})
            : translate({id: 'preset.stampRush.start', message: 'Take the pen', description: 'Button that starts the stamp-rush game'})}
        </button>
        <p className={styles.hint}>
          {translate({id: 'preset.stampRush.hint', message: 'Click a desk, or press its number. Adopting is worth more each time you get it right in a row.', description: 'Hint under the stamp-rush board explaining the controls and the streak bonus'})}
        </p>
      </footer>
    </section>
  );
}
