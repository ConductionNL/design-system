/**
 * <Reconcile />
 *
 * Shillinq's game. The bank statement is in, the invoices are open,
 * and the month is closing. Match each payment to the invoice it
 * settles. One line on the statement settles nothing at all: flag that
 * one instead.
 *
 * Three moves, not two, and that is the point. Paying the odd line out
 * is how money leaves quietly. Flagging a genuine payment costs too,
 * because a bookkeeper who cries wolf at every line is one nobody
 * listens to.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage:
 *
 *   <Reconcile />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`.
 *
 * Accessibility: a payment is picked up with a button and dropped on
 * an invoice with a button, so nothing needs a drag. Every amount and
 * reference is read out, and the countdown is announced.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, match, flag, step, remaining, summarise} from './engine';
import styles from './Reconcile.module.css';

const GAME_ID = 'reconcile';
const TICK_MS = 100;

export default function Reconcile({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [held, setHeld] = useState(null);
  const [left, setLeft] = useState(1);
  const gameRef = useRef(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;
  const money = (amount) => new Intl.NumberFormat(locale, {style: 'currency', currency: 'EUR', maximumFractionDigits: 0}).format(amount);

  const begin = useCallback(() => {
    endedRef.current = false;
    startedAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31), now: 0});
    gameRef.current = fresh;
    setGame(fresh);
    setHeld(null);
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
        title: translate({id: 'preset.reconcile.over.title', message: 'The books do not balance.', description: 'Headline on the game-over dialog after a reconciliation run'}),
        subtitle: translate({id: 'preset.reconcile.over.subtitle', message: 'Three of those, and somebody finds out in April.', description: 'Subtitle on the game-over dialog after a reconciliation run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const drop = useCallback((invoiceId) => {
    if (!gameRef.current || gameRef.current.over || !held) return;
    const t = now();
    const next = match(gameRef.current, held, invoiceId, t);
    gameRef.current = next;
    setGame(next);
    setHeld(null);
    setLeft(remaining(next, t));
  }, [held]);

  const raise = useCallback((paymentId) => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = flag(gameRef.current, paymentId, t);
    gameRef.current = next;
    setGame(next);
    setHeld(null);
    setLeft(remaining(next, t));
  }, []);

  const sheet = game ? game.sheet : null;
  const last = game ? game.last : null;
  const pct = Math.round(left * 100);

  return (
    <section className={[styles.rc, className].filter(Boolean).join(' ')} aria-labelledby="reconcile-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.reconcile.eyebrow', message: 'Mini-game', description: 'Eyebrow above the reconciliation game on a product page'})}
          </p>
          <h3 className={styles.title} id="reconcile-title">
            {translate({id: 'preset.reconcile.title', message: 'Match the bank', description: 'Name of the Shillinq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.reconcile.lede', message: 'Every payment belongs to an invoice, except the one that belongs to nobody. Match what fits and flag what does not, before the month closes.', description: 'One-line explanation of the reconciliation rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.reconcile.hud.score', message: 'Score {score}', description: 'Score readout on the reconciliation HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.reconcile.hud.lives', message: 'Corrections left {lives}', description: 'Remaining-lives readout on the reconciliation HUD'}, {lives: game ? game.lives : 3})}
          </span>
        </div>
      </header>

      {sheet ? (
        <>
          <div className={styles.sheet}>
            <div className={styles.column}>
              <h4 className={styles.columnHead}>
                {translate({id: 'preset.reconcile.statement', message: 'On the statement', description: 'Heading above the bank payments'})}
              </h4>
              <ul className={styles.list}>
                {sheet.payments.map((payment) => (
                  <li key={payment.id} className={payment.done ? styles.rowDone : styles.row}>
                    <button
                      type="button"
                      className={[styles.pick, held === payment.id && styles.picked].filter(Boolean).join(' ')}
                      onClick={() => setHeld(held === payment.id ? null : payment.id)}
                      disabled={!running || payment.done}
                      aria-pressed={held === payment.id}>
                      <span className={styles.amount}>{money(payment.amount)}</span>
                      <span className={styles.ref}>{payment.reference}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.flag}
                      onClick={() => raise(payment.id)}
                      disabled={!running || payment.done}
                      aria-label={translate(
                        {id: 'preset.reconcile.flagOne', message: 'Flag {amount}, reference {reference}, as belonging to nobody', description: 'Accessible label for the flag button on one payment'},
                        {amount: money(payment.amount), reference: payment.reference},
                      )}>
                      {translate({id: 'preset.reconcile.flag', message: 'Flag', description: 'Short label on the button that flags a payment as fraudulent'})}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.column}>
              <h4 className={styles.columnHead}>
                {translate({id: 'preset.reconcile.invoices', message: 'Open invoices', description: 'Heading above the open invoices'})}
              </h4>
              <ul className={styles.list}>
                {sheet.invoices.map((invoice) => (
                  <li key={invoice.id} className={invoice.settled ? styles.rowDone : styles.row}>
                    <button
                      type="button"
                      className={styles.drop}
                      onClick={() => drop(invoice.id)}
                      disabled={!running || invoice.settled || !held}
                      aria-label={translate(
                        {id: 'preset.reconcile.settle', message: 'Settle invoice {reference} for {amount} with the payment you picked up', description: 'Accessible label for an invoice button'},
                        {reference: invoice.reference, amount: money(invoice.amount)},
                      )}>
                      <span className={styles.amount}>{money(invoice.amount)}</span>
                      <span className={styles.ref}>{invoice.reference}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className={styles.clock}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={translate({id: 'preset.reconcile.clock', message: 'Time before the month closes', description: 'Accessible name of the reconciliation countdown'})}>
            <div className={[styles.clockFill, left < 0.3 && styles.clockLow].filter(Boolean).join(' ')} style={{width: `${pct}%`}} />
          </div>
        </>
      ) : (
        <p className={styles.idle}>
          {translate({id: 'preset.reconcile.idle', message: 'A statement, a stack of invoices, and one line that fits neither.', description: 'Placeholder before the reconciliation game starts'})}
        </p>
      )}

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.reconcile.restart', message: 'Restart', description: 'Button that restarts the reconciliation game'})
            : translate({id: 'preset.reconcile.start', message: 'Open the statement', description: 'Button that starts the reconciliation game'})}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'matched' && translate({id: 'preset.reconcile.feedback.matched', message: 'Settled.', description: 'Feedback after a correct match'})}
          {last && last.result === 'caught' && translate({id: 'preset.reconcile.feedback.caught', message: 'That is the one. It was never going anywhere.', description: 'Feedback after catching the fraudulent line'})}
          {last && last.result === 'mismatch' && translate({id: 'preset.reconcile.feedback.mismatch', message: 'That payment is not for that invoice.', description: 'Feedback after matching the wrong invoice'})}
          {last && last.result === 'paidFraud' && translate({id: 'preset.reconcile.feedback.paidFraud', message: 'You just paid the line that belongs to nobody.', description: 'Feedback after matching the fraudulent payment to an invoice'})}
          {last && last.result === 'flaggedGood' && translate({id: 'preset.reconcile.feedback.flaggedGood', message: 'That one was real. Flag everything and nobody reads your flags.', description: 'Feedback after flagging a genuine payment'})}
          {last && last.result === 'monthClosed' && translate({id: 'preset.reconcile.feedback.closed', message: 'The month closed with lines still open.', description: 'Feedback after the clock runs out'})}
          {last && last.result === 'sheet' && translate({id: 'preset.reconcile.feedback.sheet', message: 'Statement clear. Here comes the next one.', description: 'Feedback after clearing a whole sheet'})}
          {!last && translate({id: 'preset.reconcile.hint', message: 'Pick up a payment, then click the invoice it settles. The one that fits nothing gets flagged.', description: 'Hint under the reconciliation sheet'})}
        </p>
      </footer>
    </section>
  );
}
