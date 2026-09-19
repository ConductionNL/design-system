/**
 * <HiddenGame />
 *
 * Wraps a mini-game and keeps it off the page until somebody finds it.
 * Every game on the site is hidden behind a different way in, because
 * the hunt is the game around the games: one wants three clicks on the
 * app's logo, another the Konami code, another a word typed on the
 * page, another a paragraph selected as if you were about to redact
 * it.
 *
 * The matching lives in ./matchers.js, with no DOM and no clock, so
 * "does this open it" and "does this open by accident" are tested
 * rather than tried.
 *
 * Usage:
 *
 *   <HiddenGame id="stamp-rush" unlock={{kind: 'clicks', target: 'app-glyph'}}>
 *     <StampRush />
 *   </HiddenGame>
 *
 * Unlock kinds:
 *   clicks    {target, count = 3, windowMs}  clicks on an element carrying
 *                                            data-hidden-target="<target>"
 *   hold      {target, holdMs}               press and hold that element
 *   type      {word}                         type a word anywhere on the page
 *   konami    {}                             the Konami code
 *   select    {minLength, settleMs}          select a run of text and pause
 *   link      {}                             renders its own quiet opener
 *
 * Every kind also answers to `#play-<id>` in the URL, which is how a
 * page links straight to its own game (the arcade page does) and how
 * the e2e suite gets in without re-testing the matchers through a
 * browser.
 *
 * Once found, a game stays found for that browser: reopening the page
 * shows it straight away, because hiding it again would punish the
 * person who solved it.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {
  createSequenceMatcher, createWordMatcher, createClickCounter,
  createHoldTimer, createSelectionWatcher, KONAMI,
} from './matchers';
import styles from './HiddenGame.module.css';

const FOUND_KEY = 'conduction:minigames-found';

function readFound(id) {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(FOUND_KEY);
    return Boolean(raw && JSON.parse(raw)[id]);
  } catch (e) { return false; }
}

function writeFound(id) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(FOUND_KEY);
    const found = raw ? JSON.parse(raw) : {};
    found[id] = true;
    window.localStorage.setItem(FOUND_KEY, JSON.stringify(found));
  } catch (e) {/* fail open: the game still opened, it just won't be remembered */}
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export default function HiddenGame({id, unlock = {}, children, className}) {
  const isBrowser = useIsBrowser();
  const [open, setOpen] = useState(false);
  const holder = useRef(null);
  const openedRef = useRef(false);

  const reveal = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    setOpen(true);
    writeFound(id);
    /* Bring it into view: a game that opens below the fold looks like
       nothing happened, and the player goes back to poking the logo. */
    window.requestAnimationFrame(() => {
      if (holder.current) holder.current.scrollIntoView({behavior: 'smooth', block: 'center'});
    });
  }, [id]);

  /* Already found here before, or linked to directly. */
  useEffect(() => {
    if (!isBrowser) return;
    if (readFound(id) || window.location.hash === `#play-${id}`) {
      openedRef.current = true;
      setOpen(true);
    }
  }, [isBrowser, id]);

  /* Typed words and the Konami code both listen on the document. */
  useEffect(() => {
    if (!isBrowser || open) return undefined;
    if (unlock.kind !== 'type' && unlock.kind !== 'konami') return undefined;

    const matcher = unlock.kind === 'konami'
      ? createSequenceMatcher(KONAMI)
      : createWordMatcher(unlock.word || '');

    const onKey = (e) => {
      /* Never steal from a field somebody is typing in. */
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (matcher.push(e.key)) reveal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBrowser, open, unlock.kind, unlock.word, reveal]);

  /* Clicks and holds attach to whatever carries the target marker. */
  useEffect(() => {
    if (!isBrowser || open) return undefined;
    if (unlock.kind !== 'clicks' && unlock.kind !== 'hold') return undefined;

    const target = document.querySelector(`[data-hidden-target="${unlock.target}"]`);
    if (!target) return undefined;

    if (unlock.kind === 'clicks') {
      const counter = createClickCounter({count: unlock.count || 3, windowMs: unlock.windowMs || 1500});
      const onClick = () => { if (counter.push(now())) reveal(); };
      target.addEventListener('click', onClick);
      return () => target.removeEventListener('click', onClick);
    }

    const timer = createHoldTimer({holdMs: unlock.holdMs || 1200});
    let poll = null;
    const start = () => {
      timer.start(now());
      poll = setInterval(() => { if (timer.check(now())) { clearInterval(poll); reveal(); } }, 100);
    };
    const stop = () => { timer.cancel(); if (poll) clearInterval(poll); };
    target.addEventListener('pointerdown', start);
    target.addEventListener('pointerup', stop);
    target.addEventListener('pointerleave', stop);
    return () => {
      stop();
      target.removeEventListener('pointerdown', start);
      target.removeEventListener('pointerup', stop);
      target.removeEventListener('pointerleave', stop);
    };
  }, [isBrowser, open, unlock.kind, unlock.target, unlock.count, unlock.windowMs, unlock.holdMs, reveal]);

  /* Selecting text, for the game about selecting text. */
  useEffect(() => {
    if (!isBrowser || open || unlock.kind !== 'select') return undefined;

    const watcher = createSelectionWatcher({
      minLength: unlock.minLength || 12,
      settleMs: unlock.settleMs || 900,
    });
    const tick = setInterval(() => {
      const text = window.getSelection ? String(window.getSelection()) : '';
      if (watcher.push(text, now())) reveal();
    }, 200);
    return () => clearInterval(tick);
  }, [isBrowser, open, unlock.kind, unlock.minLength, unlock.settleMs, reveal]);

  if (!isBrowser) return null;

  if (!open) {
    /* The `link` kind is the one hiding place that shows itself, for a
       page with nothing else to poke at. Everything else renders
       nothing at all: an empty wrapper is the point. */
    if (unlock.kind !== 'link') return null;
    return (
      <p className={[styles.opener, className].filter(Boolean).join(' ')}>
        <button type="button" className={styles.openerButton} onClick={reveal}>
          {unlock.label || translate({
            id: 'preset.hiddenGame.opener',
            message: 'Take a break',
            description: 'Quiet link that opens a hidden mini-game on a page',
          })}
        </button>
      </p>
    );
  }

  return (
    <div className={[styles.found, className].filter(Boolean).join(' ')} ref={holder}>
      {children}
    </div>
  );
}
