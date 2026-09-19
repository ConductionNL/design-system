/**
 * <MonsterRun />
 *
 * La Frankendesk's game, and the only one that belongs to a blog post
 * rather than an app. The monster the post stitches together goes for
 * a run: jump the forks, duck the patch sets, collect the parts it was
 * made of.
 *
 * The obstacles are the post's own argument. A fork is a permanent
 * maintenance bill, a patch set is a thing you carry forever, a
 * release train arrives whether you are ready or not, and a design
 * language is the thing you keep walking into. What is worth picking
 * up is what the post says is already shared: a token, a protocol, a
 * component.
 *
 * Two inputs, jump and duck, so it is a runner rather than a fourth
 * game about picking the right answer. The rules live in ./engine.js
 * with no DOM and no clock.
 *
 * Usage:
 *
 *   <MonsterRun />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`, like every other mini-game.
 *
 * Accessibility: jump and duck are real buttons as well as arrow keys,
 * and the track ahead is announced as a sentence, so the run can be
 * played by someone who cannot see it coming.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, step, jump, duck, summarise, LOW} from './engine';
import styles from './MonsterRun.module.css';

const GAME_ID = 'monster-run';
const TICK_MS = 40;

function obstacleCopy(what) {
  switch (what) {
    case 'fork':
      return translate({id: 'preset.monsterRun.obstacle.fork', message: 'a fork', description: 'Monster-run obstacle on the ground: a fork of the code'});
    case 'patchset':
      return translate({id: 'preset.monsterRun.obstacle.patchset', message: 'a patch set', description: 'Monster-run obstacle overhead: a patch set'});
    case 'releaseTrain':
      return translate({id: 'preset.monsterRun.obstacle.releaseTrain', message: 'a release train', description: 'Monster-run obstacle on the ground: a release train'});
    default:
      return translate({id: 'preset.monsterRun.obstacle.designLanguage', message: 'another design language', description: 'Monster-run obstacle overhead: a design language'});
  }
}

function partCopy(what) {
  switch (what) {
    case 'token':
      return translate({id: 'preset.monsterRun.part.token', message: 'a token', description: 'Monster-run pick-up: a design token'});
    case 'protocol':
      return translate({id: 'preset.monsterRun.part.protocol', message: 'a protocol', description: 'Monster-run pick-up: a protocol'});
    default:
      return translate({id: 'preset.monsterRun.part.component', message: 'a component', description: 'Monster-run pick-up: a component'});
  }
}

export default function MonsterRun({className}) {
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
        title: translate({id: 'preset.monsterRun.over.title', message: 'The monster is down.', description: 'Headline on the game-over dialog after a monster-run run'}),
        subtitle: translate({id: 'preset.monsterRun.over.subtitle', message: 'Three forks will do that. The parts were never the problem.', description: 'Subtitle on the game-over dialog after a monster-run run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const act = useCallback((what) => {
    if (!gameRef.current || gameRef.current.over) return;
    const next = what === 'jump' ? jump(gameRef.current) : duck(gameRef.current);
    gameRef.current = next;
    setGame(next);
  }, []);

  useEffect(() => {
    if (!running || typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') { e.preventDefault(); act('jump'); }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); act('duck'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, act]);

  const track = game ? game.track : [];
  const posture = game ? game.posture : 'run';
  const last = game ? game.last : null;

  /* What is coming, in words, for anyone who cannot watch it come. */
  const incoming = track.slice(0, 4).find((c) => c && c.kind === 'obstacle');
  const ahead = incoming
    ? translate(
        {id: 'preset.monsterRun.ahead', message: 'Coming up: {what}, {where}', description: 'Spoken description of the next obstacle. {what} is the obstacle, {where} says whether to jump or duck.'},
        {
          what: obstacleCopy(incoming.what),
          where: incoming.lane === LOW
            ? translate({id: 'preset.monsterRun.ahead.low', message: 'on the ground', description: 'Where a monster-run obstacle sits when it must be jumped'})
            : translate({id: 'preset.monsterRun.ahead.high', message: 'overhead', description: 'Where a monster-run obstacle sits when it must be ducked'}),
        },
      )
    : translate({id: 'preset.monsterRun.ahead.clear', message: 'The way ahead is clear.', description: 'Spoken description when no monster-run obstacle is near'});

  return (
    <section className={[styles.mr, className].filter(Boolean).join(' ')} aria-labelledby="monster-run-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.monsterRun.eyebrow', message: 'Mini-game', description: 'Eyebrow above the monster-run game'})}
          </p>
          <h3 className={styles.title} id="monster-run-title">
            {translate({id: 'preset.monsterRun.title', message: 'The monster goes for a run', description: 'Name of the La Frankendesk mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.monsterRun.lede', message: 'Jump the forks, duck the patch sets, and pick up the parts it was stitched together from. The parts were never the problem.', description: 'One-line explanation of the monster-run rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.monsterRun.hud.score', message: 'Score {score}', description: 'Score readout on the monster-run HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.monsterRun.hud.lives', message: 'Stitches {lives}', description: 'Remaining-lives readout on the monster-run HUD'}, {lives: game ? game.lives : 3})}
          </span>
        </div>
      </header>

      <div className={styles.stage} aria-hidden="true">
        <div className={[styles.monster, styles[`posture-${posture}`]].filter(Boolean).join(' ')}>
          <span className={styles.head1} />
          <span className={styles.body1} />
          <span className={styles.bolt} />
        </div>

        <div className={styles.track}>
          {track.map((cell, i) => (
            <span
              key={i}
              className={[
                styles.cell,
                cell && cell.kind === 'obstacle' && styles.obstacle,
                cell && cell.kind === 'part' && styles.part,
                cell && cell.lane === LOW ? styles.low : cell && styles.high,
              ].filter(Boolean).join(' ')}>
              {cell && (cell.kind === 'obstacle' ? obstacleCopy(cell.what) : partCopy(cell.what))}
            </span>
          ))}
        </div>
        <span className={styles.ground} />
      </div>

      <p className={styles.ahead} role="status" aria-live="polite">
        {game ? ahead : translate({id: 'preset.monsterRun.idle', message: 'It has been lying on the table since the last section.', description: 'Placeholder before the monster-run game starts'})}
      </p>

      <div className={styles.controls}>
        <button type="button" className={styles.action} onClick={() => act('jump')} disabled={!running}>
          {translate({id: 'preset.monsterRun.jump', message: 'Jump', description: 'Button that makes the monster jump'})}
        </button>
        <button type="button" className={styles.action} onClick={() => act('duck')} disabled={!running}>
          {translate({id: 'preset.monsterRun.duck', message: 'Duck', description: 'Button that makes the monster duck'})}
        </button>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.monsterRun.restart', message: 'Again', description: 'Button that restarts the monster-run game'})
            : translate({id: 'preset.monsterRun.start', message: 'It lives', description: 'Button that starts the monster-run game'})}
        </button>
        <p className={styles.hint}>
          {last && last.result === 'hit' && translate(
            {id: 'preset.monsterRun.feedback.hit', message: 'Straight into {what}.', description: 'Feedback after hitting an obstacle. {what} is the obstacle.'},
            {what: obstacleCopy(last.what)},
          )}
          {last && last.result === 'part' && translate(
            {id: 'preset.monsterRun.feedback.part', message: 'Picked up {what}.', description: 'Feedback after collecting a part. {what} is the part.'},
            {what: partCopy(last.what)},
          )}
          {(!last || last.result === 'clear') && translate({id: 'preset.monsterRun.hint', message: 'Up jumps, down ducks. Arrow keys work too.', description: 'Hint under the monster-run controls'})}
        </p>
      </div>
    </section>
  );
}
