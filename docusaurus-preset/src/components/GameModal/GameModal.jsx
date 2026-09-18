/**
 * <GameModal />
 *
 * The end-of-game dialog for the Conduction mini-games (hex-rain, the
 * canal-footer boats, future invaders / domino / hex-tetris). Mounts
 * once per page; listens for `connext:gameend` CustomEvents (the event
 * name is a brand-internal identifier, retained for compatibility),
 * opens
 * with the matching copy, tracks total games found in localStorage so
 * the cross-site progress bar is consistent.
 *
 * Mirrors preview/components/game-modal.html. The previous JS-only
 * version (game-modal.js) gets replaced by this component on any
 * Docusaurus surface that mounts <GameModal/>.
 *
 * Game payload shape, fired by the playing component:
 *
 *   window.dispatchEvent(new CustomEvent('connext:gameend', {
 *     detail: {
 *       id: 'hexrain',
 *       won: true,                 // or false
 *       score: 12,                 // numeric
 *       summary: '12 / 12 collected'
 *     }
 *   }));
 *
 * Usage in MDX (mount once on the layout, not per page):
 *
 *   import {GameModal} from '@conduction/docusaurus-preset/components';
 *   <GameModal />
 *
 * Custom games table (default covers the five planned mini-games):
 *
 *   <GameModal games={[
 *     {id: 'hexrain',  label: 'Twelve apps'},
 *     {id: 'boats',    label: 'Sink the boats'},
 *     {id: 'invaders', label: 'Hex-vaders'},
 *     {id: 'domino',   label: 'Hex-domino'},
 *     {id: 'tetris',   label: 'Hex-tris'},
 *   ]} />
 */

import React, {useEffect, useState, useCallback, useMemo} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, {translate} from '@docusaurus/Translate';
import {
  readScores, writeScores, recordResult, bestFor, foundCount as countFound,
  totalScore, formatScore,
} from './scores';
import {buildShareText, scoreLines, mastodonShareUrl, linkedInShareUrl, normaliseInstance} from './share';
import styles from './GameModal.module.css';

/* The player's Mastodon instance, remembered so the second share does
   not ask again. Per-viewer convenience only; nothing else reads it. */
const INSTANCE_KEY = 'conduction:mastodon-instance';

/* The labels are read by every player, so they are translated like any
   other user-facing string. Each one is "the game · where it hides";
   the share text keeps only the part before the separator. Built in a
   function rather than at module scope, because translate() must run
   inside the render for the active locale to apply. */
function defaultGames() {
  return [
    {id: 'hexrain', label: translate({id: 'preset.gameModal.game.hexrain', message: 'Twelve apps · hex rain', description: 'Name of the hex-rain mini-game and where it hides'})},
    {id: 'boats', label: translate({id: 'preset.gameModal.game.boats', message: 'Sink the boats · footer canal', description: 'Name of the boat-sinking mini-game and where it hides'})},
    {id: 'invaders', label: translate({id: 'preset.gameModal.game.invaders', message: 'Hex-vaders · cookie CLI', description: 'Name of the invaders mini-game and where it hides'})},
    {id: 'logo-memory', label: translate({id: 'preset.gameModal.game.logoMemory', message: 'Logo memory · clients marquee', description: 'Name of the logo-memory mini-game and where it hides'})},
    {id: 'kade-cyclist', label: translate({id: 'preset.gameModal.game.kadeCyclist', message: 'Kade cyclist · footer kade', description: 'Name of the kade-cyclist mini-game and where it hides'})},
  ];
}

export default function GameModal({games: gamesProp, share: shareConfig, className}) {
  const isBrowser = useIsBrowser();
  const {siteConfig, i18n} = useDocusaurusContext();
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState(null);
  const [scores, setScores] = useState(() => ({version: 2, games: {}}));
  /* Share UI state: which network is mid-flow, the remembered Mastodon
     instance, and the "copied" acknowledgement. */
  const [instance, setInstance] = useState('');
  const [askInstance, setAskInstance] = useState(false);
  const [copied, setCopied] = useState(false);

  /* On mount: read the score table from localStorage and subscribe to
     the `connext:gameend` event. Each event opens the modal with the
     supplied copy and folds the result into the table. */
  useEffect(() => {
    if (!isBrowser) return;
    setScores(readScores());
    try {
      setInstance(window.localStorage.getItem(INSTANCE_KEY) || '');
    } catch (e) {/* blocked storage: the player types it again */}

    function onEnd(e) {
      const detail = e.detail || {};
      setEvent(detail);
      setOpen(true);
      setCopied(false);
      setAskInstance(false);
      if (detail.id) {
        setScores((prev) => {
          const next = recordResult(prev, detail);
          writeScores(next);
          return next;
        });
      }
    }
    window.addEventListener('connext:gameend', onEnd);
    return () => window.removeEventListener('connext:gameend', onEnd);
  }, [isBrowser]);

  /* Escape closes the modal. */
  useEffect(() => {
    if (!isBrowser || !open) return;
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBrowser, open]);

  const close = useCallback(() => {
    /* Notify the playing runtime so it can tear down its in-page UI
       (lifted hexes, kade stage, etc.) and restore the original
       surface. Without this the marquee or kade stays in its game-
       over visual until the next page load. */
    if (event?.id) {
      Promise.resolve().then(() => {
        window.dispatchEvent(new CustomEvent('connext:gameclose', {detail: {id: event.id}}));
      });
    }
    setOpen(false);
  }, [event]);
  const replay = useCallback(() => {
    /* Fire a `connext:gamereplay` event so the playing component (which
       listens for it) can re-init. We don't dispatch from inside an
       event handler that came from React, so use a microtask to keep
       the call stack clean. */
    if (event?.id) {
      Promise.resolve().then(() => {
        window.dispatchEvent(new CustomEvent('connext:gamereplay', {detail: {id: event.id}}));
      });
    }
    setOpen(false);
  }, [event]);

  const locale = (i18n && i18n.currentLocale) || 'en';

  /* Copy that reaches this component from a site's themeConfig can be
     either a string or a per-locale map, because Docusaurus does not
     translate themeConfig at all. A string is used as-is. */
  const pickLocale = useCallback((value) => {
    if (!value || typeof value === 'string') return value;
    return value[locale] || value.en || Object.values(value)[0];
  }, [locale]);

  /* The roster: which games this site actually ships. The preset's own
     five are the default, and a site that hides more of them passes
     its own list (with per-locale labels, same reason as above). A
     roster that named a game the site does not ship would leave every
     player permanently short of "all found". */
  const games = useMemo(
    () => (gamesProp || defaultGames()).map((g) => ({...g, label: pickLocale(g.label)})),
    [gamesProp, pickLocale],
  );
  const rosterIds = useMemo(() => games.map((g) => g.id), [games]);
  const foundCount = useMemo(() => countFound(scores, rosterIds), [scores, rosterIds]);
  const total = games.length;
  const percent = total > 0 ? Math.round((foundCount / total) * 100) : 0;
  const grandTotal = useMemo(() => totalScore(scores, rosterIds), [scores, rosterIds]);
  const lines = useMemo(
    () => scoreLines(games, (id) => bestFor(scores, id), locale),
    [games, scores, locale],
  );

  /* The post the player publishes. Built here so the copy button, the
     Mastodon link and the LinkedIn link cannot drift apart. */
  const shareText = useMemo(() => buildShareText({
    total: grandTotal,
    lines,
    foundCount,
    totalGames: total,
    hashtag: (shareConfig && shareConfig.hashtag) || '#IReadTheKit',
    url: (shareConfig && shareConfig.url) || (siteConfig && siteConfig.url) || undefined,
    locale,
  }), [grandTotal, lines, foundCount, total, shareConfig, siteConfig, locale]);

  const copyShareText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      return true;
    } catch (e) {
      /* No clipboard permission (or no clipboard): fall back to a
         hidden textarea, which works everywhere that still supports
         execCommand, and give up quietly if that fails too. */
      try {
        const ta = document.createElement('textarea');
        ta.value = shareText;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(ok);
        return ok;
      } catch (e2) { return false; }
    }
  }, [shareText]);

  const shareOnMastodon = useCallback((raw) => {
    const url = mastodonShareUrl(raw, shareText);
    if (!url) { setAskInstance(true); return; }
    const host = normaliseInstance(raw);
    setInstance(host);
    setAskInstance(false);
    try { window.localStorage.setItem(INSTANCE_KEY, host); } catch (e) {/* fine */}
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [shareText]);

  const shareOnLinkedIn = useCallback(async () => {
    /* LinkedIn stopped honouring prefilled text reliably, so the post
       goes to the clipboard first and the composer opens for a paste. */
    await copyShareText();
    window.open(linkedInShareUrl(shareText), '_blank', 'noopener,noreferrer');
  }, [copyShareText, shareText]);

  if (!isBrowser || !open || !event) return null;

  const eyebrow = event.won
    ? translate({id: 'preset.gameModal.eyebrow.won', message: 'Mini-game complete', description: 'Eyebrow above the game-over heading when the player won'})
    : translate({id: 'preset.gameModal.eyebrow.lost', message: 'Game over', description: 'Eyebrow above the game-over heading when the player lost'});
  const title = event.title || (event.won
    ? translate({id: 'preset.gameModal.title.won', message: 'Nice run.', description: 'Default headline on the game-over modal when the player won'})
    : translate({id: 'preset.gameModal.title.lost', message: "That's all of them.", description: 'Default headline on the game-over modal when the player lost'}));
  const subtitle = event.subtitle ||
    (event.won
      ? translate({id: 'preset.gameModal.subtitle.won', message: "You've cleared a hidden Conduction mini-game.", description: 'Default subtitle on the game-over modal when the player won'})
      : translate({id: 'preset.gameModal.subtitle.lost', message: "Try again any time, the rain doesn't stop.", description: 'Default subtitle on the game-over modal when the player lost'}));

  return (
    <div className={[styles.modal, className].filter(Boolean).join(' ')} role="dialog" aria-modal="true" aria-labelledby="gm-title">
      <div className={styles.overlay} onClick={close} />
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={close} aria-label={translate({id: 'preset.gameModal.close', message: 'Close', description: 'Accessible label for the close (×) button on the game-over modal'})}>×</button>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title} id="gm-title">{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        {typeof event.score !== 'undefined' && (
          <span className={styles.scorePill}>{event.summary || translate({id: 'preset.gameModal.scorePill', message: 'score: {score}', description: 'Default score pill text. {score} is the numeric score.'}, {score: event.score})}</span>
        )}

        <div className={styles.progress}>
          <div className={styles.progressLabel}>
            <span>
              <Translate
                id="preset.gameModal.progress.found"
                description="Progress label below the game-over copy. {found} bolded count of games discovered; {total} is the total."
                values={{
                  found: <strong>{foundCount}</strong>,
                  total: total,
                }}>
                {'{found} / {total} mini-games found'}
              </Translate>
            </span>
            <span>{percent}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{width: percent + '%'}} />
          </div>
        </div>

        <ul className={styles.grid}>
          {games.map((g) => {
            const best = bestFor(scores, g.id);
            const isFound = Boolean(scores.games[g.id] && scores.games[g.id].found);
            return (
              <li key={g.id} className={isFound ? styles.gridItemFound : styles.gridItem}>
                <span className={styles.gridHex} aria-hidden="true" />
                <span className={styles.gridLabel}>{g.label}</span>
                {best !== null && (
                  <span className={styles.gridScore}>{formatScore(best, locale)}</span>
                )}
              </li>
            );
          })}
        </ul>

        {grandTotal > 0 && (
          <p className={styles.total}>
            <Translate
              id="preset.gameModal.totalScore"
              description="Total score line under the games list. {score} is the sum of the player's best score in every game."
              values={{score: <strong>{formatScore(grandTotal, locale)}</strong>}}>
              {'Total score {score}'}
            </Translate>
          </p>
        )}

        <p className={styles.cta}>
          {/* Two messages picked here rather than one ICU plural.
              Docusaurus's translate() only substitutes {placeholder};
              it does not expand plurals, so an ICU string renders to
              the reader verbatim, braces and all, in every locale. */}
          {foundCount < total
            ? (total - foundCount === 1
                ? translate({
                    id: 'preset.gameModal.cta.remaining.one',
                    message: 'One more game hidden somewhere. Keep clicking.',
                    description: 'CTA on the game-over modal when exactly one mini-game is still hidden.',
                  })
                : translate(
                    {
                      id: 'preset.gameModal.cta.remaining.other',
                      message: '{remaining} more games hidden somewhere. Keep clicking.',
                      description: 'CTA on the game-over modal when several mini-games are still hidden. {remaining} is how many.',
                    },
                    {remaining: total - foundCount},
                  ))
            : translate(
                {
                  id: 'preset.gameModal.cta.allFound',
                  message: 'All {total} found. You read the kit.',
                  description: 'CTA on the game-over modal when every mini-game has been discovered. {total} is how many games there are.',
                },
                {total},
              )}
        </p>

        {/* Posting a score is the whole competition: there is no
            leaderboard to submit to, so the share block is where a run
            turns into something other people can see. */}
        <div className={styles.share}>
          <p className={styles.shareHead}>
            <Translate id="preset.gameModal.share.head" description="Heading above the share buttons on the game-over modal">
              Post your score
            </Translate>
          </p>
          <p className={styles.shareHint}>
            <Translate id="preset.gameModal.share.hint" description="Line under the share heading telling the player to attach a screenshot of the modal">
              Add a screenshot of this card, so people can see the run behind the number.
            </Translate>
          </p>

          <div className={styles.shareButtons}>
            <button
              type="button"
              className={styles.shareBtn}
              onClick={() => (instance ? shareOnMastodon(instance) : setAskInstance(true))}>
              <Translate id="preset.gameModal.share.mastodon" description="Share-on-Mastodon button label">Mastodon</Translate>
            </button>
            <button type="button" className={styles.shareBtn} onClick={shareOnLinkedIn}>
              <Translate id="preset.gameModal.share.linkedin" description="Share-on-LinkedIn button label">LinkedIn</Translate>
            </button>
            <button type="button" className={styles.shareBtn} onClick={copyShareText}>
              <Translate id="preset.gameModal.share.copy" description="Copy-the-post-text button label">Copy the post</Translate>
            </button>
            <span className={styles.shareStatus} role="status" aria-live="polite">
              {copied && (
                <Translate id="preset.gameModal.share.copied" description="Confirmation shown after the post text is copied to the clipboard">
                  Copied. Paste it with your screenshot.
                </Translate>
              )}
            </span>
          </div>

          {askInstance && (
            /* Mastodon has no central share endpoint, so the post can
               only be opened on the player's own instance. Asked once,
               then remembered. */
            <form
              className={styles.instanceRow}
              onSubmit={(e) => { e.preventDefault(); shareOnMastodon(e.target.elements.instance.value); }}>
              <label className={styles.instanceLabel} htmlFor="gm-instance">
                <Translate id="preset.gameModal.share.instanceLabel" description="Label for the input asking which Mastodon instance the player is on">
                  Your Mastodon instance
                </Translate>
              </label>
              <input
                id="gm-instance"
                name="instance"
                className={styles.instanceInput}
                defaultValue={instance}
                placeholder="mastodon.nl"
                autoComplete="off"
              />
              <button type="submit" className={styles.shareBtn}>
                <Translate id="preset.gameModal.share.instanceGo" description="Submit button next to the Mastodon instance input">Open</Translate>
              </button>
            </form>
          )}

          {shareConfig && pickLocale(shareConfig.prize) && (
            /* The prize sentence stays text and only the rules link is
               a link: a whole underlined paragraph reads as one long
               link and hides where it goes. */
            <p className={styles.prize}>
              {pickLocale(shareConfig.prize)}
              {shareConfig.prizeHref && (
                <>
                  {' '}
                  <a href={shareConfig.prizeHref}>
                    {pickLocale(shareConfig.prizeLinkLabel) || translate({
                      id: 'preset.gameModal.share.rules',
                      message: 'Read the rules',
                      description: 'Link to the giveaway rules, shown after the prize line in the share block',
                    })}
                  </a>
                </>
              )}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={close}>
            <Translate id="preset.gameModal.action.close" description="Close button label on the game-over modal">Close</Translate>
          </button>
          <button type="button" className={styles.btnPrimary} onClick={replay}>
            <Translate id="preset.gameModal.action.replay" description="Replay button label on the game-over modal">Play again</Translate>
          </button>
        </div>
      </div>
    </div>
  );
}
