/**
 * <Redaction />
 *
 * Filinq's mini-game. A document is going out. Black out everything in
 * it that may not be published, then publish it, before the clock does
 * that for you.
 *
 * Both mistakes cost, and they cost differently: leaving a name or a
 * citizen number visible is a breach and costs a life, blacking out
 * half the page costs points. A game that punished both the same would
 * teach people to redact everything, which is the other way of failing
 * at this.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage on a product page:
 *
 *   <Redaction />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`.
 *
 * Accessibility: every word is a toggle button that says whether it is
 * blacked out, so the document can be read and redacted from the
 * keyboard, and the countdown is announced rather than only drawn.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, black, publish, step, remaining, summarise} from './engine';
import styles from './Redaction.module.css';

const GAME_ID = 'redaction';
const TICK_MS = 100;

/* The words of every document. Kept here rather than in the engine so
   the rules stay free of copy, and so each phrase is a translatable
   string in its own right. */
function tokenText(key) {
  switch (key) {
    case 'permitIntro':
      return translate({id: 'preset.redaction.token.permitIntro', message: 'Permit granted to', description: 'Redaction document text'});
    case 'permitMiddle':
      return translate({id: 'preset.redaction.token.permitMiddle', message: 'for a dormer at', description: 'Redaction document text'});
    case 'permitTail':
      return translate({id: 'preset.redaction.token.permitTail', message: 'applicant reference', description: 'Redaction document text'});
    case 'permitEnd':
      return translate({id: 'preset.redaction.token.permitEnd', message: 'Objections within six weeks.', description: 'Redaction document text'});
    case 'invoiceIntro':
      return translate({id: 'preset.redaction.token.invoiceIntro', message: 'Invoice for', description: 'Redaction document text'});
    case 'invoiceMiddle':
      return translate({id: 'preset.redaction.token.invoiceMiddle', message: 'payable to', description: 'Redaction document text'});
    case 'invoiceTail':
      return translate({id: 'preset.redaction.token.invoiceTail', message: 'total', description: 'Redaction document text'});
    case 'invoiceEnd':
      return translate({id: 'preset.redaction.token.invoiceEnd', message: 'Questions to', description: 'Redaction document text'});
    case 'objectionIntro':
      return translate({id: 'preset.redaction.token.objectionIntro', message: 'Objection filed by', description: 'Redaction document text'});
    case 'objectionMiddle':
      return translate({id: 'preset.redaction.token.objectionMiddle', message: 'born', description: 'Redaction document text'});
    case 'objectionTail':
      return translate({id: 'preset.redaction.token.objectionTail', message: 'against decision', description: 'Redaction document text'});
    case 'objectionEnd':
      return translate({id: 'preset.redaction.token.objectionEnd', message: 'Hearing on the fourteenth.', description: 'Redaction document text'});
    case 'reportIntro':
      return translate({id: 'preset.redaction.token.reportIntro', message: 'Inspection report from', description: 'Redaction document text'});
    case 'reportMiddle':
      return translate({id: 'preset.redaction.token.reportMiddle', message: 'contact on', description: 'Redaction document text'});
    case 'reportTail':
      return translate({id: 'preset.redaction.token.reportTail', message: 'inspector', description: 'Redaction document text'});
    case 'reportEnd':
      return translate({id: 'preset.redaction.token.reportEnd', message: 'Published under', description: 'Redaction document text'});
    case 'name':
      return translate({id: 'preset.redaction.token.name', message: 'J. de Vries', description: 'Redaction document text: a personal name, which must be redacted'});
    case 'address':
      return translate({id: 'preset.redaction.token.address', message: 'Keizersgracht 12', description: 'Redaction document text: an address, which must be redacted'});
    case 'bsn':
      return translate({id: 'preset.redaction.token.bsn', message: 'BSN 1234 56 789', description: 'Redaction document text: a citizen service number, which must be redacted'});
    case 'iban':
      return translate({id: 'preset.redaction.token.iban', message: 'NL91 ABNA 0417 1643 00', description: 'Redaction document text: a bank account, which must be redacted'});
    case 'email':
      return translate({id: 'preset.redaction.token.email', message: 'j.devries@example.nl', description: 'Redaction document text: an email address, which must be redacted'});
    case 'birthdate':
      return translate({id: 'preset.redaction.token.birthdate', message: '4 March 1971', description: 'Redaction document text: a date of birth, which must be redacted'});
    case 'phone':
      return translate({id: 'preset.redaction.token.phone', message: '06 1234 5678', description: 'Redaction document text: a phone number, which must be redacted'});
    case 'company':
      return translate({id: 'preset.redaction.token.company', message: 'Bakkerij Janssen BV', description: 'Redaction document text: a company name, which may be published'});
    case 'amount':
      return translate({id: 'preset.redaction.token.amount', message: '1,240 euro', description: 'Redaction document text: an amount, which may be published'});
    case 'caseNumber':
      return translate({id: 'preset.redaction.token.caseNumber', message: 'case 2026-118', description: 'Redaction document text: a case number, which may be published'});
    case 'department':
      return translate({id: 'preset.redaction.token.department', message: 'the building department', description: 'Redaction document text: a department, which may be published'});
    default:
      return translate({id: 'preset.redaction.token.policy', message: 'the open government act', description: 'Redaction document text: a law, which may be published'});
  }
}

export default function Redaction({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [left, setLeft] = useState(1);
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
    setLeft(1);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const t = now();
      const next = step(gameRef.current, t);
      gameRef.current = next;
      setGame(next);
      setLeft(remaining(next, t));
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
        title: translate({id: 'preset.redaction.over.title', message: 'Three of those went out with a name still on them.', description: 'Headline on the game-over dialog after a redaction run'}),
        subtitle: translate({id: 'preset.redaction.over.subtitle', message: 'Which is the part that makes the news, not the paperwork.', description: 'Subtitle on the game-over dialog after a redaction run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const toggle = useCallback((index) => {
    if (!gameRef.current || gameRef.current.over) return;
    const next = black(gameRef.current, index);
    gameRef.current = next;
    setGame(next);
  }, []);

  const send = useCallback(() => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = publish(gameRef.current, t);
    gameRef.current = next;
    setGame(next);
    setLeft(remaining(next, t));
  }, []);

  const doc = game ? game.doc : null;
  const last = game ? game.last : null;
  const pct = Math.round(left * 100);

  return (
    <section className={[styles.rd, className].filter(Boolean).join(' ')} aria-labelledby="redaction-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.redaction.eyebrow', message: 'Mini-game', description: 'Eyebrow above the redaction game on a product page'})}
          </p>
          <h3 className={styles.title} id="redaction-title">
            {translate({id: 'preset.redaction.title', message: 'Black it out', description: 'Name of the Filinq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.redaction.lede', message: 'This document is going out. Black out what may not be published, then send it. Leave one thing in and it is a breach; black out the whole page and you have published stripes.', description: 'One-line explanation of the redaction rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.redaction.hud.score', message: 'Score {score}', description: 'Score readout on the redaction HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.redaction.hud.lives', message: 'Breaches left {lives}', description: 'Remaining-lives readout on the redaction HUD'}, {lives: game ? game.lives : 3})}
          </span>
        </div>
      </header>

      <div className={styles.paper}>
        {doc ? (
          <>
            <p className={styles.doc}>
              {doc.tokens.map((token, i) => (
                <button
                  key={i}
                  type="button"
                  className={[styles.word, token.blacked && styles.wordBlacked].filter(Boolean).join(' ')}
                  onClick={() => toggle(i)}
                  disabled={!running || token.blacked}
                  aria-pressed={token.blacked}
                  aria-label={token.blacked
                    ? translate({id: 'preset.redaction.word.blacked', message: '{text}, blacked out', description: 'Accessible label for a redacted word'}, {text: tokenText(token.t)})
                    : tokenText(token.t)}>
                  <span aria-hidden="true">{tokenText(token.t)}</span>
                </button>
              ))}
            </p>
            <div
              className={styles.clock}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label={translate({id: 'preset.redaction.clock', message: 'Time before this document publishes itself', description: 'Accessible name of the redaction countdown'})}>
              <div className={[styles.clockFill, left < 0.3 && styles.clockLow].filter(Boolean).join(' ')} style={{width: `${pct}%`}} />
            </div>
          </>
        ) : (
          <p className={styles.idle}>
            {translate({id: 'preset.redaction.idle', message: 'A stack of documents, all of them due out today.', description: 'Placeholder before the redaction game starts'})}
          </p>
        )}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.publish} onClick={send} disabled={!running || !doc}>
          {translate({id: 'preset.redaction.publish', message: 'Publish it', description: 'Button that publishes the redacted document'})}
        </button>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.redaction.restart', message: 'Restart', description: 'Button that restarts the redaction game'})
            : translate({id: 'preset.redaction.start', message: 'Open the stack', description: 'Button that starts the redaction game'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'breach' && translate({id: 'preset.redaction.feedback.breach', message: 'That went out with something on it that should not have. One breach.', description: 'Feedback after publishing a document with a secret still visible'})}
          {last && last.result === 'clean' && translate({id: 'preset.redaction.feedback.clean', message: 'Clean. Everything that had to go is gone, and the rest is still readable.', description: 'Feedback after publishing a perfectly redacted document'})}
          {last && last.result === 'overRedacted' && translate(
            {id: 'preset.redaction.feedback.over', message: 'Safe, but you blacked out {over} word(s) that could have stayed.', description: 'Feedback after publishing an over-redacted document. {over} is how many ordinary words were blacked out.'},
            {over: last.over},
          )}
          {!last && translate({id: 'preset.redaction.hint', message: 'Click a word to black it out. Names, numbers and addresses go; the sentence around them stays.', description: 'Hint under the redaction document'})}
        </p>
      </footer>
    </section>
  );
}
