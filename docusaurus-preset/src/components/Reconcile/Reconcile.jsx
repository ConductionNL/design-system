/**
 * <Reconcile />
 *
 * Shillinq's game. The bank statement is in, the invoices are open,
 * and the month is closing. Match each payment to the invoice it
 * settles, flag the lines that settle nothing, and do it before the
 * month closes on its own.
 *
 * Amounts do not settle it: two invoices on a sheet carry the same
 * amount, so the reference is the only thing that says which of them a
 * payment is for. Some lines settle nothing at all — one that belongs
 * to nobody, and one that is on the statement twice — and paying
 * either is how money leaves quietly.
 *
 * Mistakes come off a margin rather than out of three lives, and they
 * cost what they are worth. Every one of them is held on screen long
 * enough to see what went wrong and, where there was one, which
 * invoice it should have been.
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
 * reference is read out, the countdown and the margin are announced,
 * and the marks a beat puts on the sheet are in each row's label as
 * well as in its colour.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, match, flag, step, remaining, summarise} from './engine';
import styles from './Reconcile.module.css';

const GAME_ID = 'reconcile';
const TICK_MS = 100;

/** What a beat has put on one row, for anyone not seeing the colour. */
function markLabel(mark) {
  if (mark === 'wrong') {
    return translate({id: 'preset.reconcile.mark.wrong', message: 'this is what went wrong', description: 'Suffix on a statement or invoice row that a mistake marked as the wrong one'});
  }
  if (mark === 'right') {
    return translate({id: 'preset.reconcile.mark.right', message: 'this is where it belonged', description: 'Suffix on the invoice row a mistake marked as the correct one'});
  }
  return translate({id: 'preset.reconcile.mark.open', message: 'still open when the month closed', description: 'Suffix on a row that was never handled when the clock ran out'});
}

export default function Reconcile({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [picked, setPicked] = useState(null);
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
    setPicked(null);
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
        subtitle: translate({id: 'preset.reconcile.over.subtitle', message: 'Somebody finds out in April, and it is not you.', description: 'Subtitle on the game-over dialog after a reconciliation run'}),
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
    if (!gameRef.current || gameRef.current.over || !picked) return;
    const t = now();
    const next = match(gameRef.current, picked, invoiceId, t);
    gameRef.current = next;
    setGame(next);
    setPicked(null);
    setLeft(remaining(next, t));
  }, [picked]);

  const raise = useCallback((paymentId) => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = flag(gameRef.current, paymentId, t);
    gameRef.current = next;
    setGame(next);
    setPicked(null);
    setLeft(remaining(next, t));
  }, []);

  const sheet = game ? game.sheet : null;
  const last = game ? game.last : null;
  const hold = game ? game.hold : null;
  const held = Boolean(hold);
  const pct = Math.round(left * 100);
  const margin = game ? game.margin : 100;
  const marginPct = Math.round((margin / (game ? game.cfg.margin : 100)) * 100);

  /* The beat colours the whole sheet, so the verdict is on the
     paperwork and not only in a line of text under it. */
  const beat = hold ? (hold.result === 'sheet' ? styles.sheetClear : styles.sheetSlip) : null;

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
            {translate({id: 'preset.reconcile.lede', message: 'Two invoices can carry the same amount, so the reference decides which one a payment settles. Match what fits, flag what fits nothing, and mind that some lines are on the statement twice.', description: 'One-line explanation of the reconciliation rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.reconcile.hud.score', message: 'Score {score}', description: 'Score readout on the reconciliation HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.reconcile.hud.margin', message: 'Margin {margin}', description: 'Remaining error-margin readout on the reconciliation HUD'}, {margin})}
          </span>
          <span
            className={styles.marginTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={marginPct}
            aria-label={translate({id: 'preset.reconcile.marginBar', message: 'How much this run can still afford to get wrong', description: 'Accessible name of the margin bar'})}>
            <span
              className={[styles.marginFill, marginPct <= 30 && styles.marginLow].filter(Boolean).join(' ')}
              style={{width: `${marginPct}%`}}
            />
          </span>
        </div>
      </header>

      {sheet ? (
        <>
          <div className={[styles.sheet, beat].filter(Boolean).join(' ')}>
            <div className={styles.column}>
              <h4 className={styles.columnHead}>
                {translate({id: 'preset.reconcile.statement', message: 'On the statement', description: 'Heading above the bank payments'})}
              </h4>
              <ul className={styles.list}>
                {sheet.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className={[
                      payment.done ? styles.rowDone : styles.row,
                      payment.mark && styles[`mark_${payment.mark}`],
                    ].filter(Boolean).join(' ')}>
                    <button
                      type="button"
                      className={[styles.pick, picked === payment.id && styles.picked].filter(Boolean).join(' ')}
                      onClick={() => setPicked(picked === payment.id ? null : payment.id)}
                      disabled={!running || held || payment.done}
                      aria-pressed={picked === payment.id}
                      aria-label={translate(
                        {id: 'preset.reconcile.pickOne', message: 'Pick up {amount}, reference {reference}{mark}', description: 'Accessible label for the button that picks up one payment. {mark} is an empty string or a note about how a beat marked the row.'},
                        {
                          amount: money(payment.amount),
                          reference: payment.reference,
                          mark: payment.mark ? ` — ${markLabel(payment.mark)}` : '',
                        },
                      )}>
                      <span className={styles.amount}>{money(payment.amount)}</span>
                      <span className={styles.ref}>{payment.reference}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.flag}
                      onClick={() => raise(payment.id)}
                      disabled={!running || held || payment.done}
                      aria-label={translate(
                        {id: 'preset.reconcile.flagOne', message: 'Flag {amount}, reference {reference}, as settling nothing', description: 'Accessible label for the flag button on one payment'},
                        {amount: money(payment.amount), reference: payment.reference},
                      )}>
                      {translate({id: 'preset.reconcile.flag', message: 'Flag', description: 'Short label on the button that flags a payment as settling nothing'})}
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
                  <li
                    key={invoice.id}
                    className={[
                      invoice.settled ? styles.rowSettled : styles.row,
                      invoice.mark && styles[`mark_${invoice.mark}`],
                    ].filter(Boolean).join(' ')}>
                    {/* A settled invoice stays droppable on purpose: paying
                        one twice is the mistake this game is about, and a
                        disabled row would hand the answer over. */}
                    <button
                      type="button"
                      className={styles.drop}
                      onClick={() => drop(invoice.id)}
                      disabled={!running || held || !picked}
                      aria-label={invoice.settled
                        ? translate(
                          {id: 'preset.reconcile.settled', message: 'Invoice {reference} for {amount}, already settled{mark}', description: 'Accessible label for an invoice that has been paid. {mark} is an empty string or a note about how a beat marked the row.'},
                          {reference: invoice.reference, amount: money(invoice.amount), mark: invoice.mark ? ` — ${markLabel(invoice.mark)}` : ''},
                        )
                        : translate(
                          {id: 'preset.reconcile.settle', message: 'Settle invoice {reference} for {amount} with the payment you picked up{mark}', description: 'Accessible label for an open invoice. {mark} is an empty string or a note about how a beat marked the row.'},
                          {reference: invoice.reference, amount: money(invoice.amount), mark: invoice.mark ? ` — ${markLabel(invoice.mark)}` : ''},
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
          {translate({id: 'preset.reconcile.idle', message: 'A statement, a stack of invoices, and two amounts that are the same.', description: 'Placeholder before the reconciliation game starts'})}
        </p>
      )}

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.reconcile.restart', message: 'Restart', description: 'Button that restarts the reconciliation game'})
            : translate({id: 'preset.reconcile.start', message: 'Open the statement', description: 'Button that starts the reconciliation game'})}
        </button>
        <p
          className={[
            styles.hint,
            last && (last.result === 'matched' || last.result === 'caught' || last.result === 'sheet') && styles.hintGood,
            last && last.cost && styles.hintCost,
          ].filter(Boolean).join(' ')}
          role="status"
          aria-live="polite">
          {last && last.result === 'matched' && translate({id: 'preset.reconcile.feedback.matched', message: 'Settled.', description: 'Feedback after a correct match'})}
          {last && last.result === 'caught' && translate({id: 'preset.reconcile.feedback.caught', message: 'That is one that settles nothing. Good catch.', description: 'Feedback after flagging a line that settles nothing'})}
          {last && last.result === 'sheet' && translate({id: 'preset.reconcile.feedback.sheet', message: 'Statement clear. Here comes the next one.', description: 'Feedback after clearing a whole sheet'})}
          {last && last.result === 'mismatch' && translate(
            {id: 'preset.reconcile.feedback.mismatch', message: 'Same amount, different invoice. The reference says which one — the right one is marked. Margin {cost}.', description: 'Feedback after matching the wrong invoice. {cost} is what it took off the margin.'},
            {cost: last.cost},
          )}
          {last && last.result === 'paidUnknown' && translate(
            {id: 'preset.reconcile.feedback.paidUnknown', message: 'That line belonged to no invoice on the sheet. The money is gone. Margin {cost}.', description: 'Feedback after paying a line that settles nothing. {cost} is what it took off the margin.'},
            {cost: last.cost},
          )}
          {last && last.result === 'paidTwice' && translate(
            {id: 'preset.reconcile.feedback.paidTwice', message: 'That invoice was already settled. You have paid it twice. Margin {cost}.', description: 'Feedback after paying an invoice that was already settled. {cost} is what it took off the margin.'},
            {cost: last.cost},
          )}
          {last && last.result === 'flaggedGood' && translate(
            {id: 'preset.reconcile.feedback.flaggedGood', message: 'That one was real, and the invoice it settles is marked. Flag everything and nobody reads your flags. Margin {cost}.', description: 'Feedback after flagging a genuine payment. {cost} is what it took off the margin.'},
            {cost: last.cost},
          )}
          {last && last.result === 'monthClosed' && translate(
            {id: 'preset.reconcile.feedback.closed', message: 'The month closed with lines still open, marked where they stand. Margin {cost}.', description: 'Feedback after the clock runs out. {cost} is what it took off the margin.'},
            {cost: last.cost},
          )}
          {!last && translate({id: 'preset.reconcile.hint', message: 'Pick up a payment, then click the invoice it settles. Read the reference, not just the amount.', description: 'Hint under the reconciliation sheet'})}
        </p>
      </footer>
    </section>
  );
}
