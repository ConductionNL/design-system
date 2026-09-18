/**
 * <DeadlineDefender />
 *
 * Dossiq's mini-game. A case arrives with its legal deadline already
 * running. Read it, send it to the right next step, and do it before
 * the clock empties. The wrong step costs the same as running out of
 * time, because in a real queue both end the same way: the case sits
 * somewhere nobody is looking.
 *
 * The rules live in ./engine.js with no DOM and no clock. This file
 * owns the clock, the keyboard and the paint.
 *
 * Usage on a product page:
 *
 *   <DeadlineDefender />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`, like every other mini-game.
 *
 * Accessibility: the three steps are real buttons, reachable by tab
 * and by the keys 1, 2 and 3. The case text carries the whole puzzle,
 * so nothing depends on the countdown bar being seen; the bar is
 * announced as a percentage for anyone who cannot see it drain.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  createGame, step, route, remaining, summarise, LANES, INTAKE, REVIEW, DECISION,
} from './engine';
import styles from './DeadlineDefender.module.css';

const GAME_ID = 'deadline-defender';
const TICK_MS = 80;

function laneLabel(lane) {
  if (lane === INTAKE) {
    return translate({id: 'preset.deadlineDefender.lane.intake', message: 'Intake', description: 'Name of the intake step in the deadline-defender game'});
  }
  if (lane === REVIEW) {
    return translate({id: 'preset.deadlineDefender.lane.review', message: 'Assessment', description: 'Name of the assessment step in the deadline-defender game'});
  }
  return translate({id: 'preset.deadlineDefender.lane.decision', message: 'Decision', description: 'Name of the decision step in the deadline-defender game'});
}

/* One sentence per situation, each written so the right step follows
   from what it says rather than from remembering a colour. */
function situationText(key) {
  switch (key) {
    case 'permitReceived':
      return translate({id: 'preset.deadlineDefender.case.permitReceived', message: 'A permit application came in through the portal. Nothing registered yet.', description: 'Deadline-defender case that belongs in intake'});
    case 'objectionReceived':
      return translate({id: 'preset.deadlineDefender.case.objectionReceived', message: 'An objection arrived by post. It has not been logged.', description: 'Deadline-defender case that belongs in intake'});
    case 'complaintReceived':
      return translate({id: 'preset.deadlineDefender.case.complaintReceived', message: 'A complaint was filed this morning. No case number yet.', description: 'Deadline-defender case that belongs in intake'});
    case 'documentsComplete':
      return translate({id: 'preset.deadlineDefender.case.documentsComplete', message: 'The last missing document came in. The file is complete.', description: 'Deadline-defender case that belongs in assessment'});
    case 'siteVisitDone':
      return translate({id: 'preset.deadlineDefender.case.siteVisitDone', message: 'The site visit is done and the report is attached.', description: 'Deadline-defender case that belongs in assessment'});
    case 'adviceReturned':
      return translate({id: 'preset.deadlineDefender.case.adviceReturned', message: 'The advice from the fire service came back. Nobody has read it against the file.', description: 'Deadline-defender case that belongs in assessment'});
    case 'assessmentDone':
      return translate({id: 'preset.deadlineDefender.case.assessmentDone', message: 'The assessment is finished and the draft is written.', description: 'Deadline-defender case that belongs in decision'});
    case 'objectionAssessed':
      return translate({id: 'preset.deadlineDefender.case.objectionAssessed', message: 'The objection has been assessed. It needs signing off.', description: 'Deadline-defender case that belongs in decision'});
    default:
      return translate({id: 'preset.deadlineDefender.case.enforcementReady', message: 'Enforcement has been prepared and checked. It waits on a signature.', description: 'Deadline-defender case that belongs in decision'});
  }
}

export default function DeadlineDefender({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [left, setLeft] = useState(0);
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
    setLeft(1);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;
      const next = step(gameRef.current, now);
      gameRef.current = next;
      setGame(next);
      setLeft(remaining(next, now));
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
        title: translate({id: 'preset.deadlineDefender.over.title', message: 'The queue won.', description: 'Headline on the game-over dialog after a deadline-defender run'}),
        subtitle: translate({id: 'preset.deadlineDefender.over.subtitle', message: 'Three cases in the wrong place, or past their date. Both count.', description: 'Subtitle on the game-over dialog after a deadline-defender run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const send = useCallback((lane) => {
    if (!gameRef.current || gameRef.current.over || !gameRef.current.current) return;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;
    const next = route(gameRef.current, lane, now);
    gameRef.current = next;
    setGame(next);
    setLeft(remaining(next, now));
  }, []);

  useEffect(() => {
    if (!running || typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= LANES.length) {
        e.preventDefault();
        send(LANES[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, send]);

  const current = game ? game.current : null;
  const lives = game ? game.lives : 3;
  const score = game ? game.score : 0;
  const pct = Math.round(left * 100);
  const last = game && game.last ? game.last.result : null;

  return (
    <section className={[styles.dd, className].filter(Boolean).join(' ')} aria-labelledby="deadline-defender-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.deadlineDefender.eyebrow', message: 'Mini-game', description: 'Eyebrow above the deadline-defender game on a product page'})}
          </p>
          <h3 className={styles.title} id="deadline-defender-title">
            {translate({id: 'preset.deadlineDefender.title', message: 'Deadline defender', description: 'Name of the Dossiq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.deadlineDefender.lede', message: 'Every case arrives with its clock already running. Send it to the right step before the time is gone. The wrong step costs the same as being late.', description: 'One-line explanation of the deadline-defender rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.deadlineDefender.hud.score', message: 'Score {score}', description: 'Score readout on the deadline-defender HUD'}, {score: Number(score).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.deadlineDefender.hud.lives', message: 'Cases you can still lose {lives}', description: 'Remaining-lives readout on the deadline-defender HUD'}, {lives})}
          </span>
        </div>
      </header>

      <div className={styles.desk}>
        {current ? (
          <article className={styles.file} aria-live="polite">
            <p className={styles.fileNo}>
              {translate({id: 'preset.deadlineDefender.caseNo', message: 'Case {id}', description: 'Case-number line on the deadline-defender file. {id} is the case number.'}, {id: current.id})}
            </p>
            <p className={styles.fileText}>{situationText(current.key)}</p>
            <div
              className={styles.clock}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label={translate({id: 'preset.deadlineDefender.clock', message: 'Time left on this deadline', description: 'Accessible name of the deadline countdown bar'})}>
              <div
                className={[styles.clockFill, left < 0.3 && styles.clockLow].filter(Boolean).join(' ')}
                style={{width: `${pct}%`}}
              />
            </div>
          </article>
        ) : (
          <p className={styles.empty}>
            {game
              ? translate({id: 'preset.deadlineDefender.next', message: 'Next case…', description: 'Placeholder between two cases in the deadline-defender game'})
              : translate({id: 'preset.deadlineDefender.idle', message: 'The queue is waiting for you.', description: 'Placeholder on the deadline-defender desk before the game starts'})}
          </p>
        )}
      </div>

      <div className={styles.lanes}>
        {LANES.map((lane, i) => (
          <button
            key={lane}
            type="button"
            className={styles.lane}
            onClick={() => send(lane)}
            disabled={!running || !current}>
            <span className={styles.laneKey} aria-hidden="true">{i + 1}</span>
            <span className={styles.laneName}>{laneLabel(lane)}</span>
          </button>
        ))}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.deadlineDefender.restart', message: 'Restart', description: 'Button that restarts the deadline-defender game'})
            : translate({id: 'preset.deadlineDefender.start', message: 'Open the queue', description: 'Button that starts the deadline-defender game'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last === 'misrouted' && translate({id: 'preset.deadlineDefender.feedback.misrouted', message: 'Wrong step. That case is now somewhere nobody is looking.', description: 'Feedback after routing a case to the wrong step'})}
          {last === 'missed' && translate({id: 'preset.deadlineDefender.feedback.missed', message: 'Out of time. The deadline ran while it sat there.', description: 'Feedback after letting a deadline expire'})}
          {last !== 'misrouted' && last !== 'missed' && translate({id: 'preset.deadlineDefender.hint', message: 'Click a step, or press 1, 2 or 3. Each case in a row is worth more than the last.', description: 'Hint under the deadline-defender board explaining the controls and the streak bonus'})}
        </p>
      </footer>
    </section>
  );
}
