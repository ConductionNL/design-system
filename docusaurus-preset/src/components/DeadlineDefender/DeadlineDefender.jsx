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
 * Every answer is ANSWERED BACK. A case is not swept off the desk the
 * moment it is judged: the verdict is held, the lane it should have
 * gone to lights up, the lane you chose is struck through if it was
 * the wrong one, and the margin bar shows the damage. A beat long
 * enough to read on a mistake, a short green one on a hit.
 *
 * Usage on a product page:
 *
 *   <DeadlineDefender />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`, like every other mini-game.
 *
 * Accessibility: the four steps are real buttons, reachable by tab
 * and by the keys 1 to 4. The case text carries the whole puzzle, so
 * nothing depends on the countdown bar being seen; the bar is
 * announced as a percentage, and every verdict is announced in words
 * naming the correct step, so the outcome never depends on the colour
 * of a button.
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  createGame, step, route, remaining, marginLeft, summarise,
  LANES, INTAKE, REVIEW, DECISION,
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
  if (lane === DECISION) {
    return translate({id: 'preset.deadlineDefender.lane.decision', message: 'Decision', description: 'Name of the decision step in the deadline-defender game'});
  }
  return translate({id: 'preset.deadlineDefender.lane.off', message: 'Off the queue', description: 'Name of the fourth step in the deadline-defender game, for cases that need no further handling'});
}

/* The label on the file. Every subject can appear in front of every
   stage, so the word itself is never the answer. */
function subjectLabel(key) {
  switch (key) {
    case 'permit':
      return translate({id: 'preset.deadlineDefender.subject.permit', message: 'Permit application', description: 'Subject label on a deadline-defender case file'});
    case 'objection':
      return translate({id: 'preset.deadlineDefender.subject.objection', message: 'Objection', description: 'Subject label on a deadline-defender case file'});
    case 'complaint':
      return translate({id: 'preset.deadlineDefender.subject.complaint', message: 'Complaint', description: 'Subject label on a deadline-defender case file'});
    case 'enforcement':
      return translate({id: 'preset.deadlineDefender.subject.enforcement', message: 'Enforcement case', description: 'Subject label on a deadline-defender case file'});
    default:
      return translate({id: 'preset.deadlineDefender.subject.subsidy', message: 'Subsidy request', description: 'Subject label on a deadline-defender case file'});
  }
}

/* The clause that decides the lane, written as a state the file is in
   rather than an instruction. Keep the English word counts in step
   with STAGES in engine.js — the clock is priced off them. */
function stageText(key) {
  switch (key) {
    case 'justArrived':
      return translate({id: 'preset.deadlineDefender.stage.justArrived', message: 'It came in through the portal this morning and nothing is registered yet.', description: 'Deadline-defender clause for a case that belongs in intake'});
    case 'notLogged':
      return translate({id: 'preset.deadlineDefender.stage.notLogged', message: 'It arrived by post and has not been logged anywhere.', description: 'Deadline-defender clause for a case that belongs in intake'});
    case 'fileComplete':
      return translate({id: 'preset.deadlineDefender.stage.fileComplete', message: 'The last missing document came in, so the file is complete.', description: 'Deadline-defender clause for a case that belongs in assessment'});
    case 'adviceBack':
      return translate({id: 'preset.deadlineDefender.stage.adviceBack', message: 'The advice came back and nobody has weighed it against the file.', description: 'Deadline-defender clause for a case that belongs in assessment'});
    case 'draftWritten':
      return translate({id: 'preset.deadlineDefender.stage.draftWritten', message: 'The assessment is finished and the draft decision is written.', description: 'Deadline-defender clause for a case that belongs in decision'});
    case 'awaitingSignature':
      return translate({id: 'preset.deadlineDefender.stage.awaitingSignature', message: 'Everything has been checked and it waits only on a signature.', description: 'Deadline-defender clause for a case that belongs in decision'});
    case 'withdrawn':
      return translate({id: 'preset.deadlineDefender.stage.withdrawn', message: 'The applicant withdrew it yesterday and confirmed that in writing.', description: 'Deadline-defender clause for a case that takes no further step'});
    case 'alreadyDecided':
      return translate({id: 'preset.deadlineDefender.stage.alreadyDecided', message: 'This was already decided last month and the letter went out.', description: 'Deadline-defender clause for a case that takes no further step'});
    default:
      return translate({id: 'preset.deadlineDefender.stage.otherAuthority', message: 'This belongs to the province, not to us.', description: 'Deadline-defender clause for a case that takes no further step'});
  }
}

/* True of the case and irrelevant to where it goes. The clock pays
   for the words; what these cost is finding the clause that governs. */
function noiseText(key) {
  switch (key) {
    case 'calledTwice':
      return translate({id: 'preset.deadlineDefender.noise.calledTwice', message: 'The applicant has called twice about it.', description: 'Deadline-defender clause that is true but does not decide the step'});
    case 'filedOnPaper':
      return translate({id: 'preset.deadlineDefender.noise.filedOnPaper', message: 'It was filed on paper rather than through the portal.', description: 'Deadline-defender clause that is true but does not decide the step'});
    case 'thickFile':
      return translate({id: 'preset.deadlineDefender.noise.thickFile', message: 'The file runs to ninety pages.', description: 'Deadline-defender clause that is true but does not decide the step'});
    case 'pressAsked':
      return translate({id: 'preset.deadlineDefender.noise.pressAsked', message: 'A local paper asked about this case last week.', description: 'Deadline-defender clause that is true but does not decide the step'});
    case 'sameStreet':
      return translate({id: 'preset.deadlineDefender.noise.sameStreet', message: 'There are two other cases on the same street.', description: 'Deadline-defender clause that is true but does not decide the step'});
    default:
      return translate({id: 'preset.deadlineDefender.noise.handlerAway', message: 'The handler who started it is on leave.', description: 'Deadline-defender clause that is true but does not decide the step'});
  }
}

function clauseText(clause) {
  return clause.kind === 'stage' ? stageText(clause.key) : noiseText(clause.key);
}

export default function DeadlineDefender({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [left, setLeft] = useState(1);
  const gameRef = useRef(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;

  /* The word counts in the engine are the English ones. Dutch is not
     wordier for these clauses — it compounds, so it lands a few words
     shorter — but the words it uses are longer, so a Dutch reader
     spends a little more time per word. A small cushion rather than
     the large one a naive "Dutch runs longer" would suggest. */
  const config = useMemo(() => ({wordScale: locale === 'nl' ? 1.05 : 1}), [locale]);

  const begin = useCallback(() => {
    endedRef.current = false;
    startedAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31), now: 0, config});
    gameRef.current = fresh;
    setGame(fresh);
    setLeft(1);
  }, [config]);

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
        subtitle: translate({id: 'preset.deadlineDefender.over.subtitle', message: 'Cases in the wrong place, or past their date. Both count the same.', description: 'Subtitle on the game-over dialog after a deadline-defender run'}),
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
  const verdict = game ? game.verdict : null;
  /* The case stays on the desk through its own verdict, so the player
     can read it against the answer instead of guessing what was on
     screen a moment ago. */
  const shown = current || (verdict ? verdict.case : null);
  const score = game ? game.score : 0;
  const combo = game ? game.combo : 0;
  const pct = Math.round(left * 100);
  const damage = game ? Math.round(marginLeft(game) * 100) : 100;

  const verdictLine = verdict && (
    verdict.result === 'handled'
      ? translate(
        {id: 'preset.deadlineDefender.verdict.handled', message: 'Correct — {lane}. +{points}', description: 'Verdict shown after routing a case to the right step. {lane} is the step name, {points} the points gained.'},
        {lane: laneLabel(verdict.shouldHaveBeen), points: verdict.points},
      )
      : verdict.result === 'misrouted'
        ? translate(
          {id: 'preset.deadlineDefender.verdict.misrouted', message: 'Wrong — you sent it to {sent}. It was {right}.', description: 'Verdict shown after routing a case to the wrong step. {sent} is the step chosen, {right} the correct one.'},
          {sent: laneLabel(verdict.sentTo), right: laneLabel(verdict.shouldHaveBeen)},
        )
        : translate(
          {id: 'preset.deadlineDefender.verdict.missed', message: 'Out of time — the deadline ran while it sat there. It was {right}.', description: 'Verdict shown after letting a deadline expire. {right} is the step the case should have gone to.'},
          {right: laneLabel(verdict.shouldHaveBeen)},
        )
  );

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
            {translate({id: 'preset.deadlineDefender.lede', message: 'Every case arrives with its clock already running. Read it, send it to the right step — and some cases take no step at all. The wrong step costs the same as being late.', description: 'One-line explanation of the deadline-defender rules'})}
          </p>
        </div>
        <div className={styles.hud}>
          <div className={styles.hudRow} role="status" aria-live="polite">
            <span className={styles.hudPill}>
              {translate({id: 'preset.deadlineDefender.hud.score', message: 'Score {score}', description: 'Score readout on the deadline-defender HUD'}, {score: Number(score).toLocaleString(locale)})}
            </span>
            <span className={styles.hudPill}>
              {translate({id: 'preset.deadlineDefender.hud.streak', message: 'Streak {combo}', description: 'Streak readout on the deadline-defender HUD'}, {combo})}
            </span>
          </div>
          <div className={styles.marginWrap}>
            <span className={styles.marginLabel}>
              {translate({id: 'preset.deadlineDefender.hud.margin', message: 'Margin {damage}%', description: 'Remaining-margin readout on the deadline-defender HUD. {damage} is a percentage.'}, {damage})}
            </span>
            <div
              className={styles.marginBar}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={damage}
              aria-label={translate({id: 'preset.deadlineDefender.marginBar', message: 'Margin left before the queue wins', description: 'Accessible name of the margin bar'})}>
              <div
                className={[styles.marginFill, damage <= 40 && styles.marginLow].filter(Boolean).join(' ')}
                style={{width: `${damage}%`}}
              />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.desk}>
        {shown ? (
          <article
            /* Keyed on the case, so a new one remounts and replays the
               arrival. Without it the verdict beat closes the gap the
               old code left between two cases, React reuses the same
               node, and one case slides into the next with nothing to
               mark the change. The key holds steady through a verdict,
               because the case being judged is still this one. */
            key={shown.id}
            className={[
              styles.file,
              verdict && verdict.result === 'handled' && styles.fileRight,
              verdict && verdict.result !== 'handled' && styles.fileWrong,
            ].filter(Boolean).join(' ')}>
            <p className={styles.fileNo}>
              <span className={styles.subject}>{subjectLabel(shown.subject.key)}</span>
              {translate({id: 'preset.deadlineDefender.caseNo', message: 'Case {id}', description: 'Case-number line on the deadline-defender file. {id} is the case number.'}, {id: shown.id})}
            </p>
            <p className={styles.fileText}>
              {shown.clauses.map((cl) => clauseText(cl)).join(' ')}
            </p>

            {verdict ? (
              /* The verdict takes the countdown's place, so the case
                 and the answer are on screen together. This is also
                 the live region: announcing it here rather than in
                 the footer keeps one copy of the sentence, not two. */
              <p
                role="status"
                aria-live="assertive"
                className={[
                  styles.verdict,
                  verdict.result === 'handled' ? styles.verdictRight : styles.verdictWrong,
                ].join(' ')}>
                {verdictLine}
              </p>
            ) : (
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
            )}
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
        {LANES.map((lane, i) => {
          const isRight = verdict && verdict.shouldHaveBeen === lane;
          const isChosenWrong = verdict && verdict.result === 'misrouted' && verdict.sentTo === lane;
          return (
            <button
              key={lane}
              type="button"
              className={[
                styles.lane,
                isRight && styles.laneRight,
                isChosenWrong && styles.laneWrong,
              ].filter(Boolean).join(' ')}
              onClick={() => send(lane)}
              disabled={!running || !current}>
              <span className={styles.laneKey} aria-hidden="true">{i + 1}</span>
              <span className={styles.laneName}>{laneLabel(lane)}</span>
              {isRight && <span className={styles.laneMark} aria-hidden="true">✓</span>}
              {isChosenWrong && <span className={styles.laneMark} aria-hidden="true">✕</span>}
            </button>
          );
        })}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.deadlineDefender.restart', message: 'Restart', description: 'Button that restarts the deadline-defender game'})
            : translate({id: 'preset.deadlineDefender.start', message: 'Open the queue', description: 'Button that starts the deadline-defender game'})}
        </button>
        <p className={styles.hint}>
          {translate({id: 'preset.deadlineDefender.hint', message: 'Click a step, or press 1 to 4. Not every case needs one — some are already finished. Each case in a row is worth more than the last.', description: 'Hint under the deadline-defender board explaining the controls and the streak bonus'})}
        </p>
      </footer>
    </section>
  );
}
