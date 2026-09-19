/**
 * <DiceDuel />
 *
 * Larpinq's game, and the one app where a game needs no excuse. A
 * monster blocks the path. You have four dice and one decision a
 * round: swing with what you rolled, or push your luck and throw the
 * weak ones again.
 *
 * The push is the game. A swing is safe and usually small; a reroll is
 * the only road to a big hit and the only way to be bitten. Nothing is
 * timed, because pushing your luck is not a thing to be hurried
 * through, which also makes it the one game here you can play while
 * thinking.
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
        title: translate({id: 'preset.diceDuel.over.title', message: 'It got you in the end.', description: 'Headline on the game-over dialog after a dice duel'}),
        subtitle: translate({id: 'preset.diceDuel.over.subtitle', message: 'Three bad pushes. The dice were fine; the greed was the problem.', description: 'Subtitle on the game-over dialog after a dice duel'}),
      },
    }));
  }, [game, locale]);

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
            {translate({id: 'preset.diceDuel.lede', message: 'Something is blocking the path. Swing with what you rolled, or hold the good dice and throw the rest again. Roll worse than you had and it bites.', description: 'One-line explanation of the dice-duel rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.diceDuel.hud.score', message: 'Score {score}', description: 'Score readout on the dice-duel HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.diceDuel.hud.hearts', message: 'Hearts {hearts}', description: 'Remaining-lives readout on the dice-duel HUD'}, {hearts: game ? game.hearts : 3})}
          </span>
        </div>
      </header>

      <div className={styles.field}>
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

        <div className={styles.dice} role="group" aria-label={translate({id: 'preset.diceDuel.diceLabel', message: 'Your dice', description: 'Accessible name for the row of dice'})}>
          {dice.map((die, i) => (
            <button
              key={i}
              type="button"
              className={[styles.die, game && game.kept[i] && styles.dieKept].filter(Boolean).join(' ')}
              onClick={() => act((s) => toggleKeep(s, i))}
              disabled={!running}
              aria-pressed={Boolean(game && game.kept[i])}
              aria-label={translate(
                {id: 'preset.diceDuel.die', message: 'Die showing {face}{held}', description: 'Accessible label for one die. {face} is the number, {held} says whether it is held.'},
                {face: die, held: game && game.kept[i]
                  ? translate({id: 'preset.diceDuel.die.held', message: ', held', description: 'Appended to a die that is being kept'})
                  : ''},
              )}>
              {die}
            </button>
          ))}
        </div>

        <p className={styles.worth}>
          {game
            ? translate({id: 'preset.diceDuel.worth', message: 'That swing is worth {damage}', description: 'How much the current dice are worth'}, {damage: damageOf(dice)})
            : ''}
        </p>
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.strike} onClick={() => act(strike)} disabled={!running}>
          {translate({id: 'preset.diceDuel.strike', message: 'Swing', description: 'Button that attacks with the current dice'})}
        </button>
        <button type="button" className={styles.push} onClick={() => act(reroll)} disabled={!running || !game || game.rerollsLeft <= 0}>
          {translate({id: 'preset.diceDuel.reroll', message: 'Push your luck ({left})', description: 'Button that rerolls the unheld dice. {left} is how many rerolls remain.'}, {left: game ? game.rerollsLeft : 0})}
        </button>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.diceDuel.restart', message: 'New duel', description: 'Button that restarts the dice duel'})
            : translate({id: 'preset.diceDuel.start', message: 'Draw steel', description: 'Button that starts the dice duel'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'felled' && translate({id: 'preset.diceDuel.feedback.felled', message: 'It falls. Something worse is already coming.', description: 'Feedback after felling a monster'})}
          {last && last.result === 'hit' && translate({id: 'preset.diceDuel.feedback.hit', message: 'You hit for {damage}. It has {left} left.', description: 'Feedback after a swing that did not fell the monster'}, {damage: last.damage, left: last.left})}
          {last && last.result === 'bitten' && translate({id: 'preset.diceDuel.feedback.bitten', message: 'Worse than you had, and it bites. {from} became {to}.', description: 'Feedback after a reroll that came up worse'}, {from: last.from, to: last.to})}
          {last && last.result === 'rerollUp' && translate({id: 'preset.diceDuel.feedback.better', message: 'Better. {from} became {to}.', description: 'Feedback after a reroll that improved the hand'}, {from: last.from, to: last.to})}
          {!last && translate({id: 'preset.diceDuel.hint', message: 'Hold the dice you like, then push. Sixes are worth more than six.', description: 'Hint under the dice duel'})}
        </p>
      </footer>
    </section>
  );
}
