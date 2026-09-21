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
 *   type      {word} or {words: [...]}       type a word anywhere on the page;
 *                                            `words` accepts any of several
 *                                            spellings, and a short one
 *                                            swallows every longer one
 *                                            ending in it
 *   konami    {}                             the Konami code
 *   select    {minLength, settleMs}          select a run of text and pause
 *   link      {}                             renders its own quiet opener
 *
 * Every kind also answers to `#play-<id>` in the URL, which is how a
 * page links straight to its own game (the arcade page does) and how
 * the e2e suite gets in without re-testing the matchers through a
 * browser.
 *
 * A game stays open for the visit that found it, and no longer than
 * that. Reload, or leave and come back, and the page is a product
 * page again — you solve the riddle afresh to play.
 *
 * It used to be remembered in localStorage, on the reasoning that
 * hiding it again punished the person who solved it. That had it
 * backwards: the page is here to explain the product, and a game
 * pinned open on every future visit quietly takes that job away from
 * it. Finding it is the reward, and finding it again costs seconds.
 * `#play-<id>` is still the way back in without the riddle.
 *
 * The wrapper carries `data-hidden-game="found"` once it is open, and
 * the `link` opener carries `data-hidden-game="opener"`. That is how a
 * host can give the game the space something else is using: a product
 * hero hides its mock when the game beside it is found, with a plain
 * sibling selector rather than a class from this module. The two
 * values are distinct because an opener is not a game: the hero keeps
 * its mock while the way in is still sitting there unclicked.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {
  createSequenceMatcher, createWordMatcher, createClickCounter,
  createHoldTimer, createSelectionWatcher, KONAMI,
} from './matchers';
import {takeOpen} from './handoff';
import styles from './HiddenGame.module.css';

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
    /* Bring it into view: a game that opens below the fold looks like
       nothing happened, and the player goes back to poking the logo. */
    window.requestAnimationFrame(() => {
      if (holder.current) holder.current.scrollIntoView({behavior: 'smooth', block: 'center'});
    });
  }, [id]);

  /* The two ways in that are not the riddle: a direct #play- link, and
     the roster in the game-over modal sending you here on purpose.
     Both are deliberate acts by someone who already knows the game is
     here, so neither makes a fresh visit anything but a product page.

     takeOpen is called first and unconditionally, so the note is always
     consumed even when the hash would have opened the game anyway; left
     lying around it would spring the next page that renders this id. */
  useEffect(() => {
    if (!isBrowser) return;
    const sentHere = takeOpen(id);
    if (sentHere) {
      /* Through reveal(), for the scroll: arriving at the top of a long
         page with the game somewhere below looks like a dead link. */
      reveal();
    } else if (window.location.hash === `#play-${id}`) {
      openedRef.current = true;
      setOpen(true);
    }
  }, [isBrowser, id, reveal]);

  /* Typed words and the Konami code both listen on the document. */
  useEffect(() => {
    if (!isBrowser || open) return undefined;
    if (unlock.kind !== 'type' && unlock.kind !== 'konami') return undefined;

    const matcher = unlock.kind === 'konami'
      ? createSequenceMatcher(KONAMI)
      : createWordMatcher(unlock.words || unlock.word || '');

    const onKey = (e) => {
      /* Never steal from a field somebody is typing in. */
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (matcher.push(e.key)) reveal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    /* `words` is joined rather than passed as an array: a fresh array
       literal in the page's JSX is a new reference on every render,
       which would tear the listener down and rebuild it — losing
       whatever the visitor had typed so far. */
  }, [isBrowser, open, unlock.kind, unlock.word, (unlock.words || []).join('\u0000'), reveal]);

  /* Clicks and holds attach to whatever carries the target marker. */
  useEffect(() => {
    if (!isBrowser || open) return undefined;
    if (unlock.kind !== 'clicks' && unlock.kind !== 'hold') return undefined;

    const target = document.querySelector(`[data-hidden-target="${unlock.target}"]`);
    if (!target) return undefined;

    if (unlock.kind === 'clicks') {
      const counter = createClickCounter({count: unlock.count || 3, windowMs: unlock.windowMs || 1500});
      const onClick = () => {
        /* Knock the thing that was clicked. A hiding place nobody
           can tell they have found is just a dead logo: without
           this, two of the three clicks land with no sign that
           anything is happening and most people stop at one.

           The element belongs to whatever rendered it, so this only
           raises a flag and lets that component's own stylesheet
           decide what a knock looks like. Removing it and forcing a
           reflow first is what makes the animation run again on a
           second click rather than only the first. */
        target.removeAttribute('data-knock');
        void target.offsetWidth;
        /* The flag carries the page's chosen flavour, or nothing at
           all. A gavel swings; a bank's mark drops money. Which of
           those it is belongs to the page, not here — this only
           passes the word along, and [data-knock] on its own still
           matches whatever a page left unnamed. */
        target.setAttribute('data-knock', unlock.react || '');
        /* And an event beside the flag, because they say different
           things. The flag is a state — "this was just knocked" — and
           restarting it is the whole point for a gavel, which should
           swing again from the top on every click.

           Money does not work that way. Five clicks in a second is
           what the riddle asks for, and each one has to leave its own
           coin falling while the next arrives; a restarted animation
           yanks the last one back to the mark. An event fires once
           and is gone, so whatever is listening can spawn something
           per click and let each finish on its own. */
        target.dispatchEvent(new CustomEvent('connext:knock', {
          detail: {react: unlock.react || ''},
        }));
        if (counter.push(now())) reveal();
      };
      target.addEventListener('click', onClick);
      return () => {
        target.removeEventListener('click', onClick);
        target.removeAttribute('data-knock');
      };
    }

    const holdMs = unlock.holdMs || 1200;
    const timer = createHoldTimer({holdMs});
    let frame = null;
    let startedAt = 0;

    /* Same bargain as the knock above: this says how far into the hold
       the visitor is and nothing about what that looks like. The
       element owns the strain — it is the one that knows it is a lock
       rather than a logo.

       On a frame rather than a 100ms interval, because the point of
       the flag is a shake that grows smoothly under the finger; in
       tenth-second steps it reads as a stutter. */
    const tick = () => {
      const t = now();
      const progress = Math.min(1, (t - startedAt) / holdMs);
      target.style.setProperty('--hold-progress', progress.toFixed(3));
      if (timer.check(t)) { release(); reveal(); return; }
      frame = requestAnimationFrame(tick);
    };

    const release = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      timer.cancel();
      target.removeAttribute('data-hold');
      target.style.removeProperty('--hold-progress');
    };

    const start = () => {
      startedAt = now();
      timer.start(startedAt);
      target.setAttribute('data-hold', '');
      target.style.setProperty('--hold-progress', '0');
      frame = requestAnimationFrame(tick);
    };

    target.addEventListener('pointerdown', start);
    target.addEventListener('pointerup', release);
    target.addEventListener('pointerleave', release);
    /* A finger that slides off, or the browser taking the gesture for
       a scroll, never sends pointerup — without this the lock would
       keep straining after the hand had gone. */
    target.addEventListener('pointercancel', release);
    return () => {
      release();
      target.removeEventListener('pointerdown', start);
      target.removeEventListener('pointerup', release);
      target.removeEventListener('pointerleave', release);
      target.removeEventListener('pointercancel', release);
    };
  }, [isBrowser, open, unlock.kind, unlock.target, unlock.count, unlock.windowMs, unlock.holdMs, reveal]);

  /* Once the game is open, the hiding place has been solved, and the
     thing that hid it can say so for the rest of the visit. Keepiq's
     mark is a padlock, and a padlock that has been picked should not
     still be shut.

     A separate flag from data-knock and data-hold, because those are
     the reaction to being touched and this is a standing state. It
     carries the same flavour word, so a page that asked for nothing
     gets a marker it can ignore rather than a surprise. */
  useEffect(() => {
    if (!isBrowser || !open || !unlock.target) return undefined;
    const target = document.querySelector(`[data-hidden-target="${unlock.target}"]`);
    if (!target) return undefined;
    target.setAttribute('data-hidden-open', unlock.react || '');
    return () => target.removeAttribute('data-hidden-open');
  }, [isBrowser, open, unlock.target, unlock.react]);

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
      <p className={[styles.opener, className].filter(Boolean).join(' ')} data-hidden-game="opener">
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
    <div className={[styles.found, className].filter(Boolean).join(' ')} ref={holder} data-hidden-game="found">
      {children}
    </div>
  );
}
