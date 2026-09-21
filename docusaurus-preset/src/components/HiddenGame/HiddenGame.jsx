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
        target.setAttribute('data-knock', '');
        if (counter.push(now())) reveal();
      };
      target.addEventListener('click', onClick);
      return () => {
        target.removeEventListener('click', onClick);
        target.removeAttribute('data-knock');
      };
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
