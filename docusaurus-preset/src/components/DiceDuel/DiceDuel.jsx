/**
 * <DiceDuel />
 *
 * Larpinq's game, and the one app where a game needs no excuse. A
 * monster blocks the path. You have four dice and one decision a
 * round: swing with what you rolled, or push your luck and throw the
 * weak ones again.
 *
 * The push is the game. A swing is certain and usually small; a
 * reroll is the road to a big hit and the only way to end a round
 * holding less than you started it with.
 *
 * Nothing bites you for pushing. The monster hits back once, after
 * your swing, and only if the swing left it alive — so a bad push
 * costs you by keeping the thing standing, not by wounding you on the
 * spot. Nothing is timed, because pushing your luck is not a thing to
 * be hurried through, which also makes it the one game here you can
 * play while thinking.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage:
 *
 *   <DiceDuel />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`.
 *
 * Accessibility: every die is a toggle button that says its face and
 * whether it is held, and the monster's state is a sentence. Nothing
 * depends on seeing pips.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, strike, reroll, toggleKeep, damageOf, summarise} from './engine';
import styles from './DiceDuel.module.css';

const GAME_ID = 'dice-duel';

/* When the monster's claws land, in the middle of the round's
   animation. The health bar waits for this rather than emptying the
   instant the engine says so — a bar that drops a second and a half
   before the blow that caused it reads as two unrelated events.
   Kept in step with the `.rake` delay in the stylesheet. */
const BITE_AT_MS = 1500;

/* How long a round takes to play out, so the controls can be held
   shut for exactly that long: a swing that killed is over once your
   damage has cleared, one that did not runs on through the monster's
   answer. Both follow the last animation in the stylesheet. */
const SWING_DONE_MS = 1040;
const ROUND_DONE_MS = 2520;

/* And how long the whole round is given before the run is scored, so
   the last blow, the bar running out and a beat to take it in all
   happen before the card covers the board. */
const OVER_AFTER_MS = 2900;

/**
 * A face for each thing in the queue, drawn in line so it takes the
 * ink colour and needs no asset. Silhouettes first: ears, tusks,
 * snout, skull — at this size the outline is the whole character and
 * the detail inside it is noise.
 *
 * Decorative only. Every monster is named in the sentence beside it.
 */
const FACES = {
  goblin: (
    <>
      <path d="M7 13 2 6l7 3M25 13l5-7-7 3" />
      <path d="M16 6c6 0 10 5 10 11s-4 10-10 10S6 23 6 17 10 6 16 6Z" />
      <path d="M12 23h8" />
      <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="20" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  troll: (
    <>
      <path d="M16 5c7 0 11 5 11 12s-4 10-11 10S5 24 5 17 9 5 16 5Z" />
      <path d="M11 26l1-5M21 26l-1-5" />
      <path d="M13 22h6" />
      <circle cx="12" cy="15" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="20" cy="15" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  wyrm: (
    <>
      <path d="M4 18c0-6 5-10 11-10 7 0 13 3 15 8-4 1-6 3-9 3H8" />
      <path d="M26 16c2 2 3 4 3 7-4 0-7-2-9-4" />
      <path d="M14 8 12 2l7 4" />
      <circle cx="12" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  lich: (
    <>
      <path d="M16 4c7 0 11 5 11 11 0 4-2 6-2 8H7c0-2-2-4-2-8C5 9 9 4 16 4Z" />
      <path d="M11 23v5M16 23v5M21 23v5" />
      <ellipse cx="11.5" cy="15" rx="3.2" ry="3.6" fill="currentColor" stroke="none" />
      <ellipse cx="20.5" cy="15" rx="3.2" ry="3.6" fill="currentColor" stroke="none" />
    </>
  ),
};

/* Which of the nine slots each face fills, read left to right and top
   to bottom — the arrangement on a real die, so a player reads the
   dice the way they would on a table rather than as printed digits.
   The face is still in every die's label, so nothing here is needed
   to play. */
const PIPS = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
  3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
};

function monsterName(key) {
  switch (key) {
    case 'goblin':
      return translate({id: 'preset.diceDuel.monster.goblin', message: 'a goblin', description: 'The first monster in the dice duel'});
    case 'troll':
      return translate({id: 'preset.diceDuel.monster.troll', message: 'a troll', description: 'The second monster in the dice duel'});
    case 'wyrm':
      return translate({id: 'preset.diceDuel.monster.wyrm', message: 'a wyrm', description: 'The third monster in the dice duel'});
    default:
      return translate({id: 'preset.diceDuel.monster.lich', message: 'a lich', description: 'The fourth monster in the dice duel'});
  }
}

export default function DiceDuel({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  /* What the health bar is currently showing, which trails the real
     figure while a blow is still on its way down. */
  const [shownHp, setShownHp] = useState(null);
  /* True while a round is still playing out on screen. */
  const [resolving, setResolving] = useState(false);
  const gameRef = useRef(null);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;

  /* The round counter, and the only honest trigger for anything that
     should happen once a round.

     `game` itself is not: holding a die returns a new state with the
     same `last` on it, so an effect watching the object re-fires the
     previous round's outcome on every click. That is how picking a
     second die used to re-arm the lock and shut the table for another
     two and a half seconds. `rollId` moves when dice actually move,
     and at no other time. */
  const rollId = game ? game.rollId : 0;
  const over = Boolean(game && game.over);

  const begin = useCallback(() => {
    endedRef.current = false;
    setResolving(false);
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31)});
    gameRef.current = fresh;
    setGame(fresh);
  }, []);

  useEffect(() => {
    if (!over || endedRef.current) return undefined;
    endedRef.current = true;
    if (typeof window === 'undefined') return undefined;

    /* Not on the same tick the run ended. The blow that killed you
       still has to land, the bar still has to run out, and both are
       worth watching; the card goes up once they have. Cleared on
       restart, so a quick replay never gets the old run's card. */
    const id = setTimeout(() => window.dispatchEvent(new CustomEvent('connext:gameend', {
      detail: {
        id: GAME_ID,
        won: false,
        score: game.score,
        summary: summarise(game, locale),
        title: translate({id: 'preset.diceDuel.over.title', message: 'It got you in the end.', description: 'Headline on the game-over dialog after a dice duel'}),
        subtitle: translate({id: 'preset.diceDuel.over.subtitle', message: 'Pushed until there was nothing left to push with. The dice were fine; the greed was the problem.', description: 'Subtitle on the game-over dialog after a dice duel'}),
      },
    })), OVER_AFTER_MS);
    return () => clearTimeout(id);
  }, [over, locale]);

  /**
   * Hold the controls shut while the round is on screen.
   *
   * Without this a second swing lands in the middle of the first
   * one's animation: the sequence restarts from the top, the numbers
   * on screen belong to a round that has already been superseded,
   * and the health bar is mid-way through trailing a blow that no
   * longer matches the state behind it.
   *
   * Someone who has asked for less motion sees none of the sequence,
   * so there is nothing for them to wait for and the lock is skipped.
   */
  useEffect(() => {
    if (!game || !game.last) return undefined;
    const {result, bite} = game.last;
    /* A reroll is not a round: the dice tumble and nothing else
       happens, so the table stays live. Clearing here rather than
       just returning matters — this effect's cleanup cancels the
       timer that would have reopened the controls, so an early
       return would leave them shut. */
    if (result !== 'hit' && result !== 'felled') { setResolving(false); return undefined; }

    const still = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return undefined;

    setResolving(true);
    const id = setTimeout(() => setResolving(false), bite ? ROUND_DONE_MS : SWING_DONE_MS);
    return () => clearTimeout(id);
  }, [rollId]);

  /* Hold the bar at its old reading until the claws reach it. Rounds
     where nothing bit you — a kill, a reroll — move it at once, since
     there is no blow to wait for. */
  useEffect(() => {
    if (!game) return undefined;
    const struck = game.last && game.last.bite;
    if (!struck) { setShownHp(game.hp); return undefined; }
    const id = setTimeout(() => setShownHp(game.hp), BITE_AT_MS);
    return () => clearTimeout(id);
  }, [rollId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const act = useCallback((fn) => {
    if (!gameRef.current || gameRef.current.over) return;
    const next = fn(gameRef.current);
    gameRef.current = next;
    setGame(next);
  }, []);

  const dice = game ? game.dice : [];
  const monster = game ? game.monster : null;
  const last = game ? game.last : null;

  /* What the last round looked like, for the blow-by-blow. A swing
     lands whether or not it killed; a bite comes either from the
     monster's turn or from a reroll that went wrong. `roll` changes
     every round, which is what makes the animations play again. */
  const swung = Boolean(last && (last.result === 'hit' || last.result === 'felled'));
  const dealt = (last && last.damage) || 0;
  const bite = (last && last.bite) || 0;
  /* Before the claws land the bar still shows what you had. */
  const shown = shownHp === null ? (game ? game.hp : 0) : shownHp;

  return (
    <section className={[styles.dd, className].filter(Boolean).join(' ')} aria-labelledby="dice-duel-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.diceDuel.eyebrow', message: 'Mini-game', description: 'Eyebrow above the dice duel on a product page'})}
          </p>
          <h3 className={styles.title} id="dice-duel-title">
            {translate({id: 'preset.diceDuel.title', message: 'Dice duel', description: 'Name of the Larpinq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.diceDuel.lede', message: 'Something is blocking the path. Matching dice hit far harder than their pips, so hold a pair and throw the rest after it. Anything left standing after your swing hits back, and every round you fail to finish it is a round it gets for free.', description: 'One-line explanation of the dice-duel rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.diceDuel.hud.score', message: 'Score {score}', description: 'Score readout on the dice-duel HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.diceDuel.hud.health', message: 'Health {hp}/{max}', description: 'Remaining-health readout on the dice-duel HUD'}, {hp: game ? shown : 0, max: game ? game.maxHp : 0})}
          </span>
        </div>
      </header>

      <div className={styles.field}>
        <div className={styles.side}>
          {monster && (
            <svg className={[styles.face, swung && styles.reel].filter(Boolean).join(' ')} key={`f${rollId}`}
              viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              {FACES[monster.key] || FACES.goblin}
            </svg>
          )}
          <div className={styles.sideBody}>
            <p className={styles.monster}>
              {monster
                ? translate(
                    {id: 'preset.diceDuel.monsterLine', message: '{what}, {hp} of {max} left', description: 'The monster and how much fight it has left'},
                    {what: monsterName(monster.key), hp: monster.hp, max: monster.maxHp},
                  )
                : translate({id: 'preset.diceDuel.idle', message: 'Something is waiting up the path.', description: 'Placeholder before the dice duel starts'})}
            </p>
            {monster && (
              <span className={styles.wounds} role="progressbar" aria-valuemin={0} aria-valuemax={monster.maxHp} aria-valuenow={monster.hp}
                aria-label={translate({id: 'preset.diceDuel.wounds', message: 'What the monster has left', description: 'Accessible name of the monster health bar'})}>
                <span className={styles.woundsFill} style={{width: `${Math.max(0, (monster.hp / monster.maxHp) * 100)}%`}} />
              </span>
            )}
          </div>
        </div>

        <div className={styles.dice} role="group" aria-label={translate({id: 'preset.diceDuel.diceLabel', message: 'Your dice', description: 'Accessible name for the row of dice'})}>
          {dice.map((die, i) => (
            <button
              key={i}
              type="button"
              className={[styles.die, game && game.kept[i] && styles.dieKept].filter(Boolean).join(' ')}
              onClick={() => act((s) => toggleKeep(s, i))}
              disabled={!running || resolving}
              aria-pressed={Boolean(game && game.kept[i])}
              aria-label={translate(
                {id: 'preset.diceDuel.die', message: 'Die showing {face}{held}', description: 'Accessible label for one die. {face} is the number, {held} says whether it is held.'},
                {face: die, held: game && game.kept[i]
                  ? translate({id: 'preset.diceDuel.die.held', message: ', held', description: 'Appended to a die that is being kept'})
                  : ''},
              )}>
              {/* Keyed on the throw, so a die that comes up the same
                  face twice still visibly goes back in the cup. Only
                  the ones that were actually thrown tumble; a held
                  die sits perfectly still, which is the whole point
                  of holding it. */}
              <span
                key={rollId}
                className={[styles.pips, game && game.tumbled && game.tumbled[i] && styles.tumble].filter(Boolean).join(' ')}
                aria-hidden="true">
                {PIPS[die].map((on, p) => (
                  <span key={p} className={on ? styles.pipOn : styles.pip} />
                ))}
              </span>
            </button>
          ))}
        </div>

        <p className={styles.worth}>
          {game
            ? translate({id: 'preset.diceDuel.worth', message: 'That swing is worth {damage}', description: 'How much the current dice are worth'}, {damage: damageOf(dice)})
            : ''}
        </p>

        {/* The round played out over the middle of the board: your
            sword falls, then what it took off the monster, then its
            claws if it lived, then what that took off you. Keyed on
            the round so it runs again every time, and decorative
            throughout — the same four numbers are in the sentence
            under the buttons, and this layer takes no pointer events
            so the dice stay clickable while it plays. */}
        {swung && (
          <div className={styles.fx} key={`fx${rollId}`} aria-hidden="true">
            <svg className={styles.sword} viewBox="0 0 64 64" fill="none" stroke="currentColor"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" focusable="false">
              <path d="M32 3 39 15v26H25V15Z" fill="currentColor" fillOpacity="0.15" />
              <path d="M16 44h32M32 44v13" />
              <circle cx="32" cy="59" r="3.5" />
            </svg>
            <span className={styles.dealt}>{`-${dealt}`}</span>
            {bite > 0 && (
              <svg className={styles.rake} viewBox="0 0 64 64" fill="none" stroke="currentColor"
                strokeWidth="5" strokeLinecap="round" focusable="false">
                <path d="M11 7c13 13 21 29 25 48" />
                <path d="M27 3c11 15 17 31 19 48" />
                <path d="M43 6c9 13 13 27 13 42" />
              </svg>
            )}
            {bite > 0 && <span className={styles.taken}>{`-${bite}`}</span>}
          </div>
        )}

        {/* The player's own bar, drawn the same way as the monster's.
            Both sides of a duel should be readable the same way. */}
        {game && (
          <div className={styles.side}>
            <div className={styles.sideBody}>
              <p className={styles.hero}>
                {translate(
                  {id: 'preset.diceDuel.heroLine', message: 'You, {hp} of {max} left', description: 'The player and how much fight they have left'},
                  {hp: shown, max: game.maxHp},
                )}
              </p>
              <span className={styles.health} role="progressbar" aria-valuemin={0} aria-valuemax={game.maxHp} aria-valuenow={shown}
                aria-label={translate({id: 'preset.diceDuel.health', message: 'What you have left', description: 'Accessible name of the player health bar'})}>
                <span
                  className={[styles.healthFill, shown / game.maxHp <= 0.3 && styles.healthLow].filter(Boolean).join(' ')}
                  style={{width: `${Math.max(0, (shown / game.maxHp) * 100)}%`}}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.strike} onClick={() => act(strike)} disabled={!running || resolving}>
          {translate({id: 'preset.diceDuel.strike', message: 'Swing', description: 'Button that attacks with the current dice'})}
        </button>
        <button type="button" className={styles.push} onClick={() => act(reroll)} disabled={!running || resolving || !game || game.rerollsLeft <= 0}>
          {translate({id: 'preset.diceDuel.reroll', message: 'Push your luck ({left})', description: 'Button that rerolls the unheld dice. {left} is how many rerolls remain.'}, {left: game ? game.rerollsLeft : 0})}
        </button>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.diceDuel.restart', message: 'New duel', description: 'Button that restarts the dice duel'})
            : translate({id: 'preset.diceDuel.start', message: 'Draw steel', description: 'Button that starts the dice duel'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'felled' && translate({id: 'preset.diceDuel.feedback.felled', message: 'It falls before it can answer. Something worse is already coming.', description: 'Feedback after felling a monster, which is the one way to end a round untouched'})}
          {last && last.result === 'hit' && translate({id: 'preset.diceDuel.feedback.hit', message: 'You hit for {damage}, it has {left} left — and it swings back for {bite}.', description: 'Feedback after a swing that did not fell the monster. {bite} is what it took off you in return.'}, {damage: last.damage, left: last.left, bite: last.bite})}
          {last && last.result === 'rerollDown' && translate({id: 'preset.diceDuel.feedback.worse', message: 'Worse. {from} became {to}, and it is still standing when you swing.', description: 'Feedback after a reroll that came up worse. Nothing bites, but the weaker swing buys the monster another round.'}, {from: last.from, to: last.to})}
          {last && last.result === 'rerollUp' && translate({id: 'preset.diceDuel.feedback.better', message: 'Better. {from} became {to}.', description: 'Feedback after a reroll that improved the hand'}, {from: last.from, to: last.to})}
          {!last && translate({id: 'preset.diceDuel.hint', message: 'Hold the matching dice and throw the rest. A pair pays, three of a kind pays a lot more, and sixes are worth more than six.', description: 'Hint under the dice duel, which has to teach the matching-dice rule because it is the whole reason to hold anything'})}
        </p>
      </footer>
    </section>
  );
}
