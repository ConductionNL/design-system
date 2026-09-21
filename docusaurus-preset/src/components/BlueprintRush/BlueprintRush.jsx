/**
 * <BlueprintRush />
 *
 * Buildiq's mini-game. An app is a flow, and a flow has an order:
 * records exist before you can describe them, a description exists
 * before anyone can fill one in, nothing gets sent about a step that
 * was never built. Lay the parts left to right in an order that
 * works, before the clock runs out.
 *
 * A puzzle rather than a reaction test, on purpose. Each part says
 * what has to come before it; whether that is already on the rail is
 * for the player to look up, and looking it up is the game. An
 * earlier version marked the ready ones green, which answered the
 * puzzle and reduced it to find-the-green-card.
 *
 * Usage on a product page:
 *
 *   <BlueprintRush />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`, like every other mini-game.
 *
 * Interaction: click a part and it goes on the end of the rail.
 * There was a drag-and-drop layer over this and it has been taken
 * out — because parts land at the next empty place whatever you drop
 * them on, dragging carried no information a click did not, so it
 * was strictly slower and nobody would ever have used it. Buttons
 * also give keyboard and touch support for nothing, which HTML5 drag
 * does not.
 *
 * Every part is a button that says what it is and what has to come
 * before it, the rail is a list, and the hint names its part out
 * loud, so the whole board can be read and played without seeing or
 * pointing at anything.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, step, place, hint, timeLeft, laidParts, nextSlot, summarise, PARTS} from './engine';
import styles from './BlueprintRush.module.css';

const GAME_ID = 'blueprint-rush';
const TICK_MS = 100;

/* What each part is, and what it is for, in the words a business
   owner would use. The part key is never shown. */
function partCopy(part) {
  switch (part) {
    case 'register':
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.register', message: 'Somewhere to keep the records', description: 'What a register is for'}),
        name: translate({id: 'preset.blueprintRush.tray.register', message: 'A register', description: 'Tray part: a register'}),
      };
    case 'schema':
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.schema', message: 'What one record looks like', description: 'What a schema is for'}),
        name: translate({id: 'preset.blueprintRush.tray.schema', message: 'A set of fields', description: 'Tray part: a schema'}),
      };
    case 'form':
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.form', message: 'How people fill one in', description: 'What a form is for'}),
        name: translate({id: 'preset.blueprintRush.tray.form', message: 'A form', description: 'Tray part: a form'}),
      };
    case 'view':
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.view', message: 'How people find one back', description: 'What a list view is for'}),
        name: translate({id: 'preset.blueprintRush.tray.view', message: 'A list with search', description: 'Tray part: a list view'}),
      };
    case 'flow':
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.flow', message: 'What happens after someone saves', description: 'What a flow is for'}),
        name: translate({id: 'preset.blueprintRush.tray.flow', message: 'A flow', description: 'Tray part: a flow'}),
      };
    case 'permission':
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.permission', message: 'Who is allowed to see it', description: 'What permissions are for'}),
        name: translate({id: 'preset.blueprintRush.tray.permission', message: 'A group and its rights', description: 'Tray part: permissions'}),
      };
    case 'widget':
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.widget', message: 'What the manager sees on Monday', description: 'What a dashboard widget is for'}),
        name: translate({id: 'preset.blueprintRush.tray.widget', message: 'A dashboard widget', description: 'Tray part: a dashboard widget'}),
      };
    default:
      return {
        purpose: translate({id: 'preset.blueprintRush.slot.notification', message: 'Who hears about it', description: 'What a notification is for'}),
        name: translate({id: 'preset.blueprintRush.tray.notification', message: 'A notification', description: 'Tray part: a notification'}),
      };
  }
}

/** "a register and a set of fields", for the line that says why not. */
function nameList(parts) {
  return parts.map((p) => partCopy(p).name.toLowerCase()).join(', ');
}

export default function BlueprintRush({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [seconds, setSeconds] = useState(0);
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
    setSeconds(Math.ceil(timeLeft(fresh, 0) / 1000));
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const t = now();
      const next = step(gameRef.current, t);
      gameRef.current = next;
      setGame(next);
      setSeconds(Math.ceil(timeLeft(next, t) / 1000));
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
        title: translate({id: 'preset.blueprintRush.over.title', message: 'Time, and the flow is still half laid.', description: 'Headline on the game-over dialog after a blueprint-rush run'}),
        subtitle: translate({id: 'preset.blueprintRush.over.subtitle', message: 'Every finished app bought you seconds, and fewer of them each time. The parts laid out of order spent the rest.', description: 'Subtitle on the game-over dialog after a blueprint-rush run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const put = useCallback((part) => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = place(gameRef.current, part, t);
    gameRef.current = next;
    setGame(next);
    setSeconds(Math.ceil(timeLeft(next, t) / 1000));
  }, []);

  const ask = useCallback(() => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = hint(gameRef.current, t);
    gameRef.current = next;
    setGame(next);
    setSeconds(Math.ceil(timeLeft(next, t) / 1000));
  }, []);

  const flow = game ? game.flow : null;
  const laid = flow ? flow.laid : [];
  const on = game ? laidParts(game) : [];
  const target = game ? nextSlot(game) : -1;
  const hinted = flow ? flow.hinted : null;
  const rejected = flow ? flow.rejected : [];
  /* The beat where the finished flow is still on the rail. */
  const showing = Boolean(game && game.cleared);
  const last = game && game.last ? game.last : null;

  return (
    <section className={[styles.br, className].filter(Boolean).join(' ')} aria-labelledby="blueprint-rush-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.blueprintRush.eyebrow', message: 'Mini-game', description: 'Eyebrow above the blueprint-rush game on a product page'})}
          </p>
          <h3 className={styles.title} id="blueprint-rush-title">
            {translate({id: 'preset.blueprintRush.title', message: 'Blueprint rush', description: 'Name of the Buildiq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.blueprintRush.lede', message: 'An app is a flow, and a flow has an order: nothing can be built on a part that is not there yet. Every part on the shelf belongs here — the only question is which one can go down next.', description: 'One-line explanation of the blueprint-rush rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.blueprintRush.hud.score', message: 'Score {score}', description: 'Score readout on the blueprint-rush HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={[styles.hudPill, running && seconds <= 5 && styles.hudLow].filter(Boolean).join(' ')}>
            {translate({id: 'preset.blueprintRush.hud.time', message: '{seconds}s left', description: 'Remaining-time readout on the blueprint-rush HUD'}, {seconds: running ? seconds : 0})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.blueprintRush.hud.streak', message: 'Streak {streak}', description: 'Run-of-apps readout on the blueprint-rush HUD'}, {streak: game ? game.combo : 0})}
          </span>
        </div>
      </header>

      <div className={styles.board}>
        {/* The rail. A drop anywhere on it goes to the next empty
            place, which is why the whole strip is one target rather
            than each slot being its own. */}
        <ol
          className={[styles.rail, showing && styles.railDone].filter(Boolean).join(' ')}
          aria-label={translate({id: 'preset.blueprintRush.railLabel', message: 'The flow, in order', description: 'Accessible name for the rail the parts are laid on'})}>
          {laid.map((part, i) => (
            <li
              key={i}
              className={[
                styles.node,
                part && styles.nodeLaid,
                !part && i === target && styles.nodeNext,
              ].filter(Boolean).join(' ')}>
              <span className={styles.nodeIndex} aria-hidden="true">{i + 1}</span>
              <span className={styles.nodeText}>
                {part
                  ? partCopy(part).name
                  : translate({id: 'preset.blueprintRush.node.empty', message: 'empty', description: 'A place on the rail with nothing laid on it yet'})}
              </span>
              {/* What it is for, the same line the tray card carries.
                  Without it the rail is a row of names and the thing
                  you built stops reading as an app. */}
              {part && <span className={styles.nodePurpose}>{partCopy(part).purpose}</span>}
            </li>
          ))}
          {!flow && (
            <li className={styles.node}>
              <span className={styles.nodeText}>
                {translate({id: 'preset.blueprintRush.idle', message: 'An empty rail, and a shelf full of parts.', description: 'Placeholder on the rail before the game starts'})}
              </span>
            </li>
          )}
        </ol>

        <div className={styles.tray}>
          {(flow ? flow.tray : []).map((part) => {
            const done = on.includes(part);
            /* Tried and refused since the last part that stuck. It
               stops taking clicks so the same refusal cannot be paid
               for twice, and comes back the moment the rail moves. */
            const ruled = rejected.includes(part);
            const copy = partCopy(part);
            /* What the part needs, flat — not what it is still
               waiting for. Filtering this against the rail was the
               game playing itself: it turned every card into either
               a green "ready" or a greyed-out excuse, and the puzzle
               became find-the-green-one. The player is told what a
               part needs; working out whether that is on the rail
               yet is the thing they are here to do. */
            const needs = PARTS[part] ? PARTS[part].needs : [];

            return (
              <button
                key={part}
                type="button"
                className={[
                  styles.part,
                  done && styles.partUsed,
                  ruled && styles.partRuledOut,
                  hinted === part && styles.partHinted,
                ].filter(Boolean).join(' ')}
                onClick={() => put(part)}
                disabled={!running || done || ruled || showing}
                aria-label={translate(
                  {id: 'preset.blueprintRush.part', message: '{name}. {purpose}. {state}', description: 'Accessible label for one part in the tray. {state} says whether it can be laid yet.'},
                  {
                    name: copy.name,
                    purpose: copy.purpose,
                    state: done
                      ? translate({id: 'preset.blueprintRush.part.laid', message: 'already on the rail', description: 'State of a part that has been laid'})
                      : ruled
                        ? translate({id: 'preset.blueprintRush.part.ruledOut', message: 'ruled out until something else goes down', description: 'State of a part that was just refused for being too early'})
                      : needs.length
                        ? translate({id: 'preset.blueprintRush.part.needs', message: 'needs {needs} first', description: 'What a part requires. Whether those are on the rail yet is for the player to look up, which is the game.'}, {needs: nameList(needs)})
                        : translate({id: 'preset.blueprintRush.part.first', message: 'needs nothing first', description: 'State of a part with no prerequisites at all'}),
                  },
                )}>
                <span className={styles.partName}>{copy.name}</span>
                <span className={styles.partPurpose} aria-hidden="true">{copy.purpose}</span>
                <span className={styles.partNeeds} aria-hidden="true">
                  {needs.length
                    ? translate({id: 'preset.blueprintRush.needs', message: 'needs {needs} first', description: 'The parts that must already be on the rail. Static, not filtered against what is there.'}, {needs: nameList(needs)})
                    : translate({id: 'preset.blueprintRush.needsNothing', message: 'needs nothing first', description: 'Shown on a part with no prerequisites. Phrased as a requirement like the others, so the two subtitles on a card do not read as the same kind of statement.'})}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.blueprintRush.restart', message: 'Restart', description: 'Button that restarts the blueprint-rush game'})
            : translate({id: 'preset.blueprintRush.start', message: 'Open a blueprint', description: 'Button that starts the blueprint-rush game'})}
        </button>
        {/* The way out for anyone who has not learned the order yet.
            It names the part rather than only lighting it up, so it
            works read aloud, and it costs time so the answer is
            never simply free. */}
        <button type="button" className={styles.ask} onClick={ask} disabled={!running || showing}>
          {translate(
            {id: 'preset.blueprintRush.ask', message: 'Which one? (−{seconds}s)', description: 'Button that points at a part that can be laid now, in exchange for seconds'},
            {seconds: game ? Math.round(game.cfg.hintMs / 1000) : 0},
          )}
        </button>
        <p className={styles.hint} role="status" aria-live="polite">
          {last && last.result === 'built' && translate({id: 'preset.blueprintRush.feedback.built', message: 'It runs. That bought you {seconds} seconds, and the next app buys less.', description: 'Feedback after completing a flow. {seconds} is the time it added, which shrinks with every app.'}, {seconds: Math.round((last.bonusMs || 0) / 1000)})}
          {last && last.result === 'early' && translate({id: 'preset.blueprintRush.feedback.early', message: 'Too soon — that needs {missing} in front of it first.', description: 'Feedback after laying a part whose prerequisites are not on the rail yet'}, {missing: nameList(last.missing || [])})}
          {last && last.result === 'duplicate' && translate({id: 'preset.blueprintRush.feedback.duplicate', message: 'That one is already on the rail.', description: 'Feedback after laying a part that is already down'})}
          {last && last.result === 'hinted' && translate({id: 'preset.blueprintRush.feedback.hinted', message: '{name} can go down next — it only needed what is already there.', description: 'Feedback after asking for a hint. Names the part so the answer is spoken, not only highlighted.'}, {name: partCopy(last.part).name})}
          {(!last || last.result === 'laid' || last.result === 'timeout') && translate({id: 'preset.blueprintRush.hint', message: 'A part goes down once everything it needs is already on the rail. Each app in a row is worth more than the last.', description: 'Hint under the blueprint-rush board'})}
        </p>
      </footer>
    </section>
  );
}
