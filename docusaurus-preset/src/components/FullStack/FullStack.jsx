/**
 * <FullStack />
 *
 * Connext's mini-game, and Connext's pitch: a stack is only worth
 * something when the pieces of it fit together. Groups of app tiles
 * fall into a well; turn them, place them, and a layer that runs the
 * full width of the stack is finished and comes out.
 *
 * A full layer is only the floor of the scoring. A layer made of one
 * app, or a layer holding all seven at once, is what the game is
 * actually about — which is both the better game and the reason it is
 * this game rather than the famous one. See the note at the top of
 * ./engine.js for the rest of that: the well, the piece set, the
 * rotation and the palette are all deliberately not that game's.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage:
 *
 *   <FullStack />
 *
 * Fires the shared `connext:gameend` event on game over and listens
 * for `connext:gamereplay`, like every other mini-game.
 *
 * Accessibility: a falling-block puzzle is the hardest kind of game to
 * make readable without sight, so the well is not the only copy of the
 * state. Every control is a real button with a label, the piece in
 * play and the column it covers are announced as they change, and each
 * column carries a button that moves the piece to it and says how deep
 * that column already is. It is playable from the keyboard and it is
 * describable; it is not going to be a pleasure on a screen reader,
 * and that is worth saying rather than claiming otherwise.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AppGlyph from '../AppGlyph/AppGlyph';
import {
  createGame, step, shift, rotate, slam, down, cellsOf, summarise, PIECES, DEFAULTS,
} from './engine';
import styles from './FullStack.module.css';

const GAME_ID = 'full-stack';
const TICK_MS = 50;

/** What each app is called, for the labels and the live readout. */
function appName(slug) {
  switch (slug) {
    case 'opencatalogi':
      return translate({id: 'preset.fullStack.app.opencatalogi', message: 'OpenCatalogi', description: 'App name on a tile in the full-stack game'});
    case 'openregister':
      return translate({id: 'preset.fullStack.app.openregister', message: 'OpenRegister', description: 'App name on a tile in the full-stack game'});
    case 'openconnector':
      return translate({id: 'preset.fullStack.app.openconnector', message: 'Integriq', description: 'App name on a tile in the full-stack game'});
    case 'docudesk':
      return translate({id: 'preset.fullStack.app.docudesk', message: 'Filinq', description: 'App name on a tile in the full-stack game'});
    case 'shillinq':
      return translate({id: 'preset.fullStack.app.shillinq', message: 'Shillinq', description: 'App name on a tile in the full-stack game'});
    case 'launchpad':
      return translate({id: 'preset.fullStack.app.launchpad', message: 'LaunchPad', description: 'App name on a tile in the full-stack game'});
    default:
      return translate({id: 'preset.fullStack.app.zaakafhandelapp', message: 'ZaakAfhandelApp', description: 'App name on a tile in the full-stack game'});
  }
}

/** What each piece is shaped like, for the same. */
function shapeName(kind) {
  switch (kind) {
    case 'dot':
      return translate({id: 'preset.fullStack.shape.dot', message: 'single tile', description: 'Shape of a piece in the full-stack game'});
    case 'pair':
      return translate({id: 'preset.fullStack.shape.pair', message: 'pair', description: 'Shape of a piece in the full-stack game'});
    case 'bend':
      return translate({id: 'preset.fullStack.shape.bend', message: 'bend', description: 'Shape of a piece in the full-stack game'});
    case 'line3':
      return translate({id: 'preset.fullStack.shape.line3', message: 'three in a line', description: 'Shape of a piece in the full-stack game'});
    case 'square':
      return translate({id: 'preset.fullStack.shape.square', message: 'square', description: 'Shape of a piece in the full-stack game'});
    case 'tee':
      return translate({id: 'preset.fullStack.shape.tee', message: 'tee', description: 'Shape of a piece in the full-stack game'});
    default:
      return translate({id: 'preset.fullStack.shape.plus', message: 'plus', description: 'Shape of a piece in the full-stack game'});
  }
}

export default function FullStack({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const gameRef = useRef(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;

  const push = useCallback((next) => {
    if (!next || next === gameRef.current) return;
    gameRef.current = next;
    setGame(next);
  }, []);

  const begin = useCallback(() => {
    endedRef.current = false;
    startedAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31), now: 0});
    gameRef.current = fresh;
    setGame(fresh);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => push(step(gameRef.current, now())), TICK_MS);
    return () => clearInterval(id);
  }, [running, push]);

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
        title: translate({id: 'preset.fullStack.over.title', message: 'The stack is full.', description: 'Headline on the game-over dialog after a full-stack run'}),
        subtitle: translate({id: 'preset.fullStack.over.subtitle', message: 'Which is what happens when nothing fits together.', description: 'Subtitle on the game-over dialog after a full-stack run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  /* Move the piece to a column, one step per call so the well is never
     asked to accept a piece that could not have walked there. */
  const toColumn = useCallback((col) => {
    const state = gameRef.current;
    if (!state || !state.piece) return;
    const delta = col - state.piece.col;
    if (!delta) return;
    push(shift(state, delta));
  }, [push]);

  useEffect(() => {
    if (!running || typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      const state = gameRef.current;
      if (!state) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); push(shift(state, -1)); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); push(shift(state, 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); push(rotate(state)); return; }
      /* Down nudges it one row and restarts its fall from there, so
         holding it is a quick descent you stay in charge of. Sending
         the piece all the way to the floor is what the space bar is
         for, deliberately kept off the arrow a player leans on. */
      if (e.key === 'ArrowDown') { e.preventDefault(); push(down(state, now())); return; }
      if (e.key === ' ') { e.preventDefault(); push(slam(state, now())); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, push]);

  /* Before the first piece there is no game to ask, so the well is
     drawn to the rules it is about to be played by — taken from the
     engine rather than repeated here, which is how the idle well came
     to be two rows taller than the real one. */
  const cfg = game ? game.cfg : DEFAULTS;
  const piece = game ? game.piece : null;
  const hold = game ? game.hold : null;
  const last = game && game.last ? game.last : null;

  /* Where the falling piece is, as a lookup the grid can ask. */
  const falling = new Map();
  if (piece) {
    for (const [r, c] of cellsOf(piece)) {
      if (r >= 0) falling.set(`${r}:${c}`, piece.app);
    }
  }
  const clearing = new Set(hold ? hold.rows : []);

  /** How many tiles deep a column already is. */
  const depthOf = (col) => {
    if (!game) return 0;
    for (let r = 0; r < cfg.rows; r++) {
      if (game.well[r][col] !== null) return cfg.rows - r;
    }
    return 0;
  };

  const covering = piece
    ? [...new Set(cellsOf(piece).map(([, c]) => c + 1))].sort((a, b) => a - b).join(', ')
    : '';

  /* The next piece's own little grid, sized to its bounding box. */
  const nextTiles = game && game.next ? PIECES[game.next.kind] : null;
  const nextWidth = nextTiles ? Math.max(...nextTiles.map(([, c]) => c)) + 1 : 0;
  const nextHeight = nextTiles ? Math.max(...nextTiles.map(([r]) => r)) + 1 : 0;
  const nextFilled = new Set(nextTiles ? nextTiles.map(([r, c]) => `${r}:${c}`) : []);

  return (
    <section className={[styles.fs, className].filter(Boolean).join(' ')} aria-labelledby="full-stack-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.fullStack.eyebrow', message: 'Mini-game', description: 'Eyebrow above the full-stack game'})}
          </p>
          <h3 className={styles.title} id="full-stack-title">
            {translate({id: 'preset.fullStack.title', message: 'Full stack', description: 'Name of the Connext mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.fullStack.lede', message: 'Apps come down the stack in groups. Fill a layer all the way across and it is done. A layer of one app pays more, and a layer with all seven of them in it pays most: that is the whole idea of a stack.', description: 'One-line explanation of the full-stack rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.fullStack.hud.score', message: 'Score {score}', description: 'Score readout on the full-stack HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.fullStack.hud.layers', message: 'Layers {layers}', description: 'Finished-layers readout on the full-stack HUD'}, {layers: game ? game.layers : 0})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.fullStack.hud.whole', message: 'Whole stack {whole}', description: 'Readout of how many layers held every app'}, {whole: game ? game.wholeStack : 0})}
          </span>
        </div>
      </header>

      <div className={styles.play}>
        <div className={styles.left}>
        <div className={styles.board}>
        <div
          className={styles.well}
          style={{'--fs-cols': cfg.cols, '--fs-rows': cfg.rows}}
          aria-hidden="true">
          {Array.from({length: cfg.rows}).map((_, r) => (
            Array.from({length: cfg.cols}).map((__, c) => {
              const settled = game ? game.well[r][c] : null;
              const app = falling.get(`${r}:${c}`) || (settled && settled.app) || null;
              return (
                <span
                  key={`${r}:${c}`}
                  className={[
                    styles.cell,
                    app && styles.cellFull,
                    falling.has(`${r}:${c}`) && styles.cellFalling,
                    clearing.has(r) && styles.cellClearing,
                  ].filter(Boolean).join(' ')}>
                  {app && <AppGlyph app={app} className={styles.glyph} />}
                </span>
              );
            })
          ))}
        </div>

        {!game && (
          <p className={styles.idle}>
            {translate({id: 'preset.fullStack.idle', message: 'An empty stack, and seven apps looking for somewhere to land.', description: 'Placeholder before the full-stack game starts'})}
          </p>
        )}
      </div>

      {/* One button per column: it moves the piece there and says how
          deep that column already is, so the well can be read rather
          than only seen. */}
      <div className={styles.columns} style={{'--fs-cols': cfg.cols}}>
        {Array.from({length: cfg.cols}).map((_, c) => (
          <button
            key={c}
            type="button"
            className={[styles.column, piece && piece.col === c && styles.columnHere].filter(Boolean).join(' ')}
            onClick={() => toColumn(c)}
            disabled={!running || Boolean(hold) || !piece}
            aria-label={translate(
              {id: 'preset.fullStack.columnLabel', message: 'Column {n}, {depth} deep. Move the piece here.', description: 'Accessible label for a column button. {depth} is how many tiles are already stacked there.'},
              {n: c + 1, depth: depthOf(c)},
            )}>
            <span aria-hidden="true">{depthOf(c)}</span>
          </button>
        ))}
      </div>
        </div>

        <div className={styles.side}>
          {/* What is coming, drawn out of the same tiles the well is
              made of. Deliberately not a bordered box of a coloured
              shape: the information is a genre convention, the
              particular picture of it in the famous game is not. The
              frame is a fixed size so a one-tile piece and a five-tile
              plus do not resize the card between them. */}
          <div className={styles.next}>
            <p className={styles.nextLabel}>
              {translate({id: 'preset.fullStack.nextLabel', message: 'Coming up', description: 'Label above the preview of the next piece'})}
            </p>
            <div className={styles.nextFrame} aria-hidden="true">
              {nextTiles && (
                <div
                  className={styles.nextGrid}
                  style={{'--fs-pw': nextWidth, '--fs-ph': nextHeight}}>
                  {Array.from({length: nextHeight}).map((_, r) => (
                    Array.from({length: nextWidth}).map((__, c) => (
                      <span
                        key={`${r}:${c}`}
                        className={[
                          styles.cell,
                          nextFilled.has(`${r}:${c}`) && styles.cellFull,
                        ].filter(Boolean).join(' ')}>
                        {nextFilled.has(`${r}:${c}`) && (
                          <AppGlyph app={game.next.app} className={styles.glyph} />
                        )}
                      </span>
                    ))
                  ))}
                </div>
              )}
            </div>
            <p className={styles.nextCaption} aria-hidden="true">
              {game && game.next && translate(
                {id: 'preset.fullStack.nextCaption', message: '{app}, {shape}', description: 'Caption under the next-piece preview. {app} is the app, {shape} the piece shape.'},
                {app: appName(game.next.app), shape: shapeName(game.next.kind)},
              )}
            </p>
          </div>

      {/* Each control wears the key that does the same thing, so the
          keyboard is discoverable without reading the hint. The chip is
          hidden from assistive tech: the button's name is the word. */}
      <div className={styles.controls}>
        {[
          {
            key: '←',
            label: translate({id: 'preset.fullStack.left', message: 'Left', description: 'Button that moves the falling piece left'}),
            act: () => shift(gameRef.current, -1),
          },
          {
            key: '↑',
            label: translate({id: 'preset.fullStack.turn', message: 'Turn', description: 'Button that rotates the falling piece'}),
            act: () => rotate(gameRef.current),
          },
          {
            key: '→',
            label: translate({id: 'preset.fullStack.right', message: 'Right', description: 'Button that moves the falling piece right'}),
            act: () => shift(gameRef.current, 1),
          },
          {
            key: '↓',
            label: translate({id: 'preset.fullStack.down', message: 'Down', description: 'Button that moves the falling piece down one row, quicker than it falls'}),
            act: () => down(gameRef.current, now()),
          },
          {
            key: '␣',
            label: translate({id: 'preset.fullStack.drop', message: 'Drop', description: 'Button that sends the falling piece all the way to the floor'}),
            act: () => slam(gameRef.current, now()),
          },
        ].map((control) => (
          <button
            key={control.label}
            type="button"
            className={styles.control}
            onClick={() => push(control.act())}
            disabled={!running || Boolean(hold)}>
            <span className={styles.controlKey} aria-hidden="true">{control.key}</span>
            {control.label}
          </button>
        ))}
      </div>

          <p className={styles.readout} role="status" aria-live="polite">
            {piece && translate(
              {id: 'preset.fullStack.inPlay', message: 'In play: {app}, {shape}, over column(s) {cols}.', description: 'Live readout of the falling piece. {cols} lists the columns it covers.'},
              {app: appName(piece.app), shape: shapeName(piece.kind), cols: covering},
            )}
            {' '}
            {game && game.next && translate(
              {id: 'preset.fullStack.nextUp', message: 'Coming up: {app}, {shape}.', description: 'Live readout of the next piece, spoken with the one in play.'},
              {app: appName(game.next.app), shape: shapeName(game.next.kind)},
            )}
          </p>
        </div>
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.fullStack.restart', message: 'Restart', description: 'Button that restarts the full-stack game'})
            : translate({id: 'preset.fullStack.start', message: 'Start stacking', description: 'Button that starts the full-stack game'})}
        </button>
        <p
          className={[
            styles.hint,
            last && last.result === 'cleared' && styles.hintGood,
          ].filter(Boolean).join(' ')}
          role="status"
          aria-live="polite">
          {last && last.result === 'cleared' && last.wholeStack > 0 && translate(
            {id: 'preset.fullStack.feedback.whole', message: 'All seven apps in one layer. That is the entire stack, in a line. +{points}.', description: 'Feedback after finishing a layer holding every app. {points} is what it paid.'},
            {points: last.points},
          )}
          {last && last.result === 'cleared' && last.wholeStack === 0 && last.oneApp > 0 && translate(
            {id: 'preset.fullStack.feedback.oneApp', message: 'A whole layer on one app. +{points}.', description: 'Feedback after finishing a layer made of a single app. {points} is what it paid.'},
            {points: last.points},
          )}
          {last && last.result === 'cleared' && last.wholeStack === 0 && last.oneApp === 0 && translate(
            {id: 'preset.fullStack.feedback.layers', message: '{layers} layer(s) out. +{points}. A layer of one app, or one with all seven, pays a great deal more.', description: 'Feedback after finishing a plain layer. {layers} is how many, {points} what they paid.'},
            {layers: last.layers, points: last.points},
          )}
          {(!last || last.result === 'landed') && translate({id: 'preset.fullStack.hint', message: 'Left and right to move, up to turn, down to hurry it along, space to drop it. The numbers under the well are how deep each column already is.', description: 'Hint under the full-stack well explaining the controls'})}
        </p>
      </footer>
    </section>
  );
}
