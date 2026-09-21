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
 * ## How the picture is built
 *
 * The strip is one row of columns, one column per step. The monster
 * does not stand beside the track, it stands *in* it, at column
 * MONSTER_COL, and the world walks through him. Everything he has
 * already answered keeps going, behind him, for another few columns
 * before it leaves the frame — without that tail a jump reads as the
 * obstacle blinking out of existence, and you never find out whether
 * you made it.
 *
 * The world slides rather than hops. The engine still moves in whole
 * steps; the component interpolates between them every frame and
 * writes the fraction to `--mr-slide`, which the lane, the ground and
 * the monster's legs all move on. `--mr-lift` and `--mr-gait` are
 * written the same way, so the jump arc and the running legs keep pace
 * with a run that speeds up as it goes.
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
 * played by someone who cannot see it coming. Under
 * `prefers-reduced-motion` the run goes back to moving a column at a
 * time, because the rules never needed the sliding.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {flushSync} from 'react-dom';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, step, stepMs, jump, duck, summarise, LOW} from './engine';
import styles from './MonsterRun.module.css';

const GAME_ID = 'monster-run';

/* How many columns of answered track stay on screen behind the
   monster. The monster stands on the last one, so the other three are
   the tail that shows you what you just cleared; the oldest of them
   slides out of frame rather than blinking off. */
const TRAIL = 4;
const MONSTER_COL = TRAIL - 1;

/* The jump. It has to be at full height on the step that clears the
   block, so the rise ends at the next step boundary however late the
   key was pressed, and the drop happens after the rules have already
   put the monster back on his feet. */
const MIN_RISE_MS = 40;
const FALL_MS = 100;

const BLANK_TRAIL = Object.freeze(Array.from({length: TRAIL}, () => null));

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * A React key that follows the thing, not the column it is standing in.
 *
 * The lane shifts by one every step, so keying on the column made React
 * unmount and remount every visible cell three times a second: the
 * pick-ups restarted their float from zero each time, and the churn
 * showed as a flicker across the strip. The engine's spawn() builds
 * each cell once and never replaces it, so the object can carry the
 * identity itself.
 */
const cellKeys = new WeakMap();
let lastCellKey = 0;
function keyFor(cell) {
  let key = cellKeys.get(cell);
  if (key === undefined) {
    lastCellKey += 1;
    key = lastCellKey;
    cellKeys.set(cell, key);
  }
  return key;
}

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

/**
 * How far off the ground the monster is, 0 to 1.
 *
 * Driven by the posture rather than by a timer of its own, so the
 * picture can never disagree with the rules: while the engine says
 * 'jump' he is up, and he only comes down once it says 'run'.
 */
function liftFor(state, t, air) {
  if (state.posture === 'jump') {
    /* The step this jump lands on. Constant for the whole jump, since
       distance climbs by one every time postureFor drops by one, which
       makes it a safe way to tell a new jump from the one in progress. */
    const id = state.distance + state.postureFor;
    if (!air.current || air.current.id !== id) {
      air.current = {id, from: t, rise: Math.max(t + MIN_RISE_MS, state.nextStepAt), down: null};
    }
    const u = clamp01((t - air.current.from) / Math.max(1, air.current.rise - air.current.from));
    return 1 - (1 - u) ** 3;
  }
  if (air.current) {
    if (air.current.down == null) air.current.down = t;
    const u = clamp01((t - air.current.down) / FALL_MS);
    if (u >= 1) {
      air.current = null;
      return 0;
    }
    return 1 - u * u;
  }
  return 0;
}

export default function MonsterRun({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [view, setView] = useState({game: null, trail: BLANK_TRAIL});
  const gameRef = useRef(null);
  const trailRef = useRef(BLANK_TRAIL);
  const stageRef = useRef(null);
  const airRef = useRef(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);
  const stillRef = useRef(false);

  const {game, trail} = view;
  const running = Boolean(game) && !game.over;
  const now = () => clock() - startedAtRef.current;

  /* Someone who asked for less motion still gets the game; they get it
     a column at a time, the way it moved before it learned to slide. */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { stillRef.current = mq.matches; };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const begin = useCallback(() => {
    endedRef.current = false;
    airRef.current = null;
    trailRef.current = BLANK_TRAIL;
    startedAtRef.current = clock();
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31), now: 0});
    gameRef.current = fresh;
    setView({game: fresh, trail: BLANK_TRAIL});
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const stage = stageRef.current;
    let raf = 0;

    const paint = (state, t) => {
      if (!stage) return;
      const still = stillRef.current;
      const slide = still ? 0 : clamp01(1 - (state.nextStepAt - t) / Math.max(1, stepMs(state)));
      const lift = still ? (state.posture === 'jump' ? 1 : 0) : liftFor(state, t, airRef);
      stage.style.setProperty('--mr-slide', slide.toFixed(4));
      stage.style.setProperty('--mr-lift', lift.toFixed(4));
      stage.style.setProperty('--mr-gait', still ? '0' : Math.sin(Math.PI * (state.distance + slide)).toFixed(4));
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const t = now();
      let state = gameRef.current;

      /* A backgrounded tab stops the frames but not the clock. Without
         this the run comes back owing a hundred steps and spends all
         three stitches catching up before anyone can see it happen. */
      if (t - state.nextStepAt > 4 * stepMs(state)) {
        state = {...state, nextStepAt: t + stepMs(state)};
        gameRef.current = state;
      }

      const next = step(state, t);
      if (next !== state) {
        trailRef.current = [state.track[0] || null, ...trailRef.current].slice(0, TRAIL);
        gameRef.current = next;
        /* Synchronously, so the shifted lane is in the DOM before the
           slide below is reset to zero for it. React's own scheduling
           lands the commit after this frame has painted, which showed
           the new offset against the old columns: one frame of the
           world snapping backwards, three times a second. */
        flushSync(() => setView({game: next, trail: trailRef.current}));
        state = next;
      }

      paint(state, t);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      if (stage) stage.style.setProperty('--mr-lift', '0');
    };
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
    const current = gameRef.current;
    if (!current || current.over) return;
    const next = what === 'jump' ? jump(current) : duck(current);
    if (next === current) return;
    gameRef.current = next;
    setView({game: next, trail: trailRef.current});
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

  /* One row of columns: the tail on the left, the monster on column
     MONSTER_COL, and what is coming on the right. The oldest of the
     tail sits on column 0 and spends the step sliding out of frame. */
  const lane = [...trail.slice().reverse(), ...track];

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

      <div
        className={styles.stage}
        ref={stageRef}
        style={{'--mr-monster': String(MONSTER_COL)}}
        aria-hidden="true">
        <div className={styles.lane}>
          {lane.map((cell, j) => {
            if (!cell) return null;
            const isObstacle = cell.kind === 'obstacle';
            return (
              <div
                key={keyFor(cell)}
                className={[
                  styles.slot,
                  isObstacle ? (cell.lane === LOW ? styles.low : styles.high) : styles.pickup,
                ].filter(Boolean).join(' ')}
                style={{'--j': String(j)}}>
                {isObstacle
                  ? <span className={styles.block}>{obstacleCopy(cell.what)}</span>
                  : <span className={styles.part} />}
              </div>
            );
          })}
        </div>

        <span className={styles.ground} />

        {/* The villagers. Scenery, not rules: they run at his speed
            and never gain, and the stage is aria-hidden, so they cost
            the game nothing and the screen reader nothing. Built from
            the same parts as the monster, in the same order. */}
        <div className={styles.mob}>
          {[styles.v1, styles.v2, styles.v3].map((who, i) => (
            <span key={who} className={[styles.villager, who].join(' ')}>
              <span className={styles.vHead} />
              <span className={styles.vBody} />
              <span className={[styles.vLeg, styles.vLegA].join(' ')} />
              <span className={[styles.vLeg, styles.vLegB].join(' ')} />
              <span className={i === 1 ? styles.fork : styles.torch} />
            </span>
          ))}
        </div>

        <div
          className={[
            styles.monster,
            styles[`posture-${posture}`],
            last && last.result === 'hit' && styles.hurt,
          ].filter(Boolean).join(' ')}>
          <span className={styles.head1} />
          <span className={styles.body1} />
          <span className={styles.bolt} />
          <span className={[styles.leg, styles.legA].join(' ')} />
          <span className={[styles.leg, styles.legB].join(' ')} />
        </div>
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
