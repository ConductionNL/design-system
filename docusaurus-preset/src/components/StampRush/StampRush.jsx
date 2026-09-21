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

/* How long a stamp takes: down, land, and the mark fading off the
   card. Matches the last animation in the stylesheet, and kept short
   because a slot can be refilled 420ms after it empties. */
const STAMP_MS = 700;

/* How long the lives readout stays lit after one is lost. */
const HURT_MS = 700;

/* And how long the last one is given before the run is scored, so
   the mark that ended it lands, the count reaches nought and both
   are on screen for a beat before the card covers the board. */
const OVER_AFTER_MS = 1400;
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
  /* {slot, kind, at} — the stamp or the lapse being shown. */
  const [flash, setFlash] = useState(null);
  /* Lit briefly after a life goes, whichever way it went. */
  const [hurt, setHurt] = useState(false);
  const livesRef = useRef(null);
  const missRef = useRef(null);
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
    setHurt(false);
    livesRef.current = fresh.lives;
    missRef.current = null;
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

  /* Game over: tell the shared dialog once, with a line it can post.

     Not on the tick the run ended. The stamp or the lapse that took
     the last life still has to land and the count still has to reach
     nought, and a card thrown up over the top of both leaves the
     player with no idea what finished them. Cleared on restart, so a
     quick replay never gets the old run's card. */
  const over = Boolean(game && game.over);
  useEffect(() => {
    if (!over || endedRef.current) return undefined;
    endedRef.current = true;
    if (typeof window === 'undefined') return undefined;
    const id = setTimeout(() => window.dispatchEvent(new CustomEvent('connext:gameend', {
      detail: {
        id: GAME_ID,
        won: false,
        score: game.score,
        summary: summarise(game, locale),
        title: translate({id: 'preset.stampRush.over.title', message: 'The meeting ran out of patience.', description: 'Headline on the game-over dialog after a stamp-rush run'}),
        subtitle: translate({id: 'preset.stampRush.over.subtitle', message: 'Three bad stamps and the chair takes the pen back.', description: 'Subtitle on the game-over dialog after a stamp-rush run'}),
      },
    })), OVER_AFTER_MS);
    return () => clearTimeout(id);
    /* On `over` rather than on `game`: the board keeps re-rendering
       while the last mark plays, and this effect's cleanup cancels
       the very timer that raises the card. Watching the whole run
       object would arm it and then throw it away on the next tick. */
  }, [over, locale]);

  /* "Play again" in the dialog restarts this game in place. */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  /* The stamp coming down, landing, and its mark fading, end to end.
     Kept on a timer rather than read off onAnimationEnd: that event
     bubbles from whichever of the three animations finishes first,
     which would tear the rest off the moment the quickest was done. */
  useEffect(() => {
    if (!flash) return undefined;
    const id = setTimeout(() => setFlash(null), STAMP_MS);
    return () => clearTimeout(id);
  }, [flash]);

  /* A mark belongs to the decision it was made on, so it goes the
     moment the next one lands in that place. Without this the board
     deals a fresh card under an ADOPTED still drying on the desk,
     and the stamp reads as belonging to the card now under it. */
  useEffect(() => {
    if (!flash || !game) return;
    if (game.slots[flash.slot]) setFlash(null);
  }, [game, flash]);

  /* A decision left to lapse costs a life for doing nothing, so the
     desk it lapsed on says so. */
  useEffect(() => {
    if (!game || !game.lastMiss) return;
    if (missRef.current === game.lastMiss.at) return;
    missRef.current = game.lastMiss.at;
    setFlash({slot: game.lastMiss.slot, kind: 'missed', at: game.lastMiss.at});
  }, [game]);

  /* And the count itself reacts, whichever way the life went: a
     number quietly going from 3 to 2 is not something anybody reads
     mid-round. */
  useEffect(() => {
    if (!game) return undefined;
    if (livesRef.current === null || game.lives >= livesRef.current) {
      livesRef.current = game.lives;
      return undefined;
    }
    livesRef.current = game.lives;
    setHurt(true);
    const id = setTimeout(() => setHurt(false), HURT_MS);
    return () => clearTimeout(id);
  }, [game]);

  const hit = useCallback((slot) => {
    if (!gameRef.current || gameRef.current.over) return;
    const card = gameRef.current.slots[slot];
    if (!card) return;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;
    const next = stamp(gameRef.current, slot, now);
    gameRef.current = next;
    setGame(next);
    setFlash({slot, kind: card.kind === READY ? 'good' : 'bad', at: now});
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
          <span className={[styles.hudLives, hurt && styles.hudHurt].filter(Boolean).join(' ')}>
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
                isFlash && flash.kind === 'good' && styles.flashGood,
                isFlash && flash.kind === 'bad' && styles.flashBad,
              ].filter(Boolean).join(' ')}
              onClick={() => hit(i)}
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
              {/* The stamp, and what it leaves behind. Keyed on the
                  moment of the stamp so hitting the same desk twice
                  plays twice. Decoration only: the score, the lives
                  and the card replacing this one all say what
                  happened without it. */}
              {isFlash && (
                <span className={styles.press} key={flash.at} aria-hidden="true">
                  {flash.kind !== 'missed' && (
                  <svg className={styles.tool} viewBox="0 0 48 48" fill="currentColor" focusable="false">
                    <rect x="18" y="3" width="12" height="9" rx="4" />
                    <rect x="21" y="11" width="6" height="9" />
                    <rect x="9" y="19" width="30" height="8" rx="3" />
                  </svg>
                  )}
                  <span className={[styles.mark, styles['mark' + flash.kind]].join(' ')}>
                    {flash.kind === 'good' && translate({id: 'preset.stampRush.mark.adopted', message: 'ADOPTED', description: 'The word a stamp leaves on a decision that was right to adopt. Short and upper case: it is a rubber stamp.'})}
                    {flash.kind === 'bad' && translate({id: 'preset.stampRush.mark.void', message: 'VOID', description: 'The word a stamp leaves on a decision that should have been held back'})}
                    {flash.kind === 'missed' && translate({id: 'preset.stampRush.mark.lapsed', message: 'LAPSED', description: 'The word left on a decision nobody got to in time, which costs a life'})}
                  </span>
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
