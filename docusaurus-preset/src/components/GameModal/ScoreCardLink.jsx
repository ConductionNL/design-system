/**
 * <ScoreCardLink />
 *
 * The way back to your score card.
 *
 * The card holds everything a player accumulates — which games they
 * have found, their best in each, the running total, the share
 * buttons — and until this existed the only thing that opened it was
 * a game ending. So the only route to your own progress was to find a
 * game, play it and lose, which got harder once a found game stopped
 * reopening itself on every visit.
 *
 * Sits in the footer, which is on every page, and says nothing at all
 * until there is something to look at: a visitor who has never found
 * a game should not be told there is a scoreboard. That is the whole
 * hunt given away in a link.
 *
 * Opens the card by firing `connext:gamecard`, the deliberate sibling
 * of `connext:gameend`. Nothing is recorded and nothing is replayed.
 */

import React, {useCallback, useEffect, useState} from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import Translate from '@docusaurus/Translate';
import {readScores, foundCount} from './scores';
import styles from './ScoreCardLink.module.css';

export default function ScoreCardLink({games = [], className}) {
  const isBrowser = useIsBrowser();
  /* Starts false on purpose, on the server and on the first client
     render alike: reading localStorage during render would make the
     markup disagree with the SSR output and Docusaurus would throw a
     hydration mismatch. It appears a tick later instead. */
  const [found, setFound] = useState(0);

  const recount = useCallback(() => {
    const ids = games.map((g) => g.id);
    setFound(foundCount(readScores(), ids));
  }, [games]);

  useEffect(() => {
    if (!isBrowser) return undefined;
    recount();
    /* A game ending is the moment this becomes relevant for the first
       time, and closing the card is the moment the player looks back
       at the footer. Recount on both so the link never lags. */
    window.addEventListener('connext:gameend', recount);
    window.addEventListener('connext:gameclose', recount);
    return () => {
      window.removeEventListener('connext:gameend', recount);
      window.removeEventListener('connext:gameclose', recount);
    };
  }, [isBrowser, recount]);

  if (found < 1) return null;

  /* The roster is the total, the same list foundCount was scoped to,
     so the two numbers always describe each other. */
  const total = games.length;
  const complete = total > 0 && found >= total;

  /* A div, not a p. The footer styles `.canal-footer .brand p` for
     the brand's prose — and at (0,2,1) that rule outranks anything a
     CSS module can say with one class, so as a paragraph this thing
     silently inherited a 24px bottom margin, a 32ch max-width and no
     top margin at all. It is a button in a wrapper, not prose. */
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={[styles.link, complete && styles.complete].filter(Boolean).join(' ')}
        onClick={() => window.dispatchEvent(new CustomEvent('connext:gamecard'))}>
        <span className={[styles.pip, complete && styles.pipDone].filter(Boolean).join(' ')} aria-hidden="true" />
        {/* Two messages rather than one with a conditional fragment:
            "all sixteen" and "nine found" are different sentences in
            Dutch as well as English, and a translator needs to see
            each of them whole. */}
        {complete ? (
          <Translate
            id="preset.scoreCard.openAll"
            description="Footer link that opens the score card once every mini-game has been found. {total} is how many games there are."
            values={{total}}>
            {'Your score card (all {total} found)'}
          </Translate>
        ) : (
          <Translate
            id="preset.scoreCard.open"
            description="Footer link that opens the player's mini-game score card. {found} is how many games they have found."
            values={{found}}>
            {'Your score card ({found} found)'}
          </Translate>
        )}
      </button>
    </div>
  );
}
