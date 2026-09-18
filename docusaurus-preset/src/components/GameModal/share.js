/**
 * Composing the post a player shares, and the links that open it.
 *
 * No API, no tokens, no account: we build a piece of text and hand it
 * to the network the player already uses. Mastodon takes the text in
 * the URL. LinkedIn does not reliably prefill any more, so there the
 * text goes to the clipboard and the composer opens empty, which is
 * why every path here also offers a plain copy.
 */

/**
 * Build the post text.
 *
 * Deliberately short: it has to survive a 500-character Mastodon
 * instance with a screenshot attached, and it reads as something a
 * person wrote rather than a share widget's output.
 */
export function buildShareText({
  total,
  lines = [],
  foundCount,
  totalGames,
  hashtag = '#IReadTheKit',
  url,
  locale = 'en',
} = {}) {
  const fmt = (n) => Number(n || 0).toLocaleString(locale);
  const parts = [];

  parts.push(
    locale === 'nl'
      ? `Totaalscore ${fmt(total)} op ${foundCount} van de ${totalGames} verstopte spelletjes van Conduction.`
      : `Total score ${fmt(total)} across ${foundCount} of ${totalGames} hidden Conduction mini-games.`,
  );

  if (lines.length) parts.push(lines.join(' · '));

  parts.push(
    locale === 'nl'
      ? 'Jouw beurt. De spelletjes staan verstopt op de site.'
      : 'Your turn. The games are hidden on the site.',
  );

  if (url) parts.push(url);
  if (hashtag) parts.push(hashtag);

  return parts.join('\n\n');
}

/** One `Label 1,234` line per game with a best score. */
export function scoreLines(games, bestOf, locale = 'en') {
  return games
    .map((g) => {
      const best = bestOf(g.id);
      if (best === null || best === undefined) return null;
      /* The label carries "Game · where it hides"; the post only needs
         the game. */
      const name = String(g.label || g.id).split('·')[0].trim();
      return `${name} ${Number(best).toLocaleString(locale)}`;
    })
    .filter(Boolean);
}

/**
 * Normalise whatever the player typed for their Mastodon instance.
 * Accepts "chaos.social", "https://chaos.social/", "@me@chaos.social".
 * Returns null when there is no host in it, so the caller can keep the
 * field open instead of opening a broken tab.
 */
export function normaliseInstance(input) {
  if (!input || typeof input !== 'string') return null;
  let value = input.trim();
  if (!value) return null;
  /* Order matters. Strip the scheme and the path first, otherwise a
     profile URL (https://chaos.social/@me) has its host thrown away
     and the trailing "@me" is read as the instance. Only then treat a
     remaining @ as a handle (@me@chaos.social). */
  value = value.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  if (value.includes('@')) value = value.slice(value.lastIndexOf('@') + 1);
  if (!value || !value.includes('.') || /\s/.test(value)) return null;
  return value.toLowerCase();
}

export function mastodonShareUrl(instance, text) {
  const host = normaliseInstance(instance);
  if (!host) return null;
  return `https://${host}/share?text=${encodeURIComponent(text)}`;
}

/**
 * LinkedIn's composer. The text parameter is honoured inconsistently,
 * so the UI copies the post to the clipboard first and tells the
 * player to paste. Passing it anyway costs nothing when it does work.
 */
export function linkedInShareUrl(text) {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}
