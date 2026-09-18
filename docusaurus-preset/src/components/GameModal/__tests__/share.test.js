/**
 * share.test.js — the post a player publishes, and the links that open it.
 *
 * The instance parsing is the part with real input variety: people
 * type their handle, their profile URL, or the bare host, and a wrong
 * guess opens a broken tab on a domain that is not theirs.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildShareText, scoreLines, normaliseInstance, mastodonShareUrl, linkedInShareUrl,
} = require('../share.js');

const GAMES = [
  {id: 'hexrain', label: 'Twelve apps · hex rain'},
  {id: 'boats', label: 'Sink the boats · footer canal'},
  {id: 'invaders', label: 'Hex-vaders · cookie CLI'},
];

test('score lines name the game, not where it hides, and skip unplayed games', () => {
  const bests = {hexrain: 12, invaders: 3400};
  const lines = scoreLines(GAMES, (id) => (id in bests ? bests[id] : null));
  assert.deepEqual(lines, ['Twelve apps 12', 'Hex-vaders 3,400']);
});

test('the post carries the total, the per-game lines, the site and the hashtag', () => {
  const text = buildShareText({
    total: 3412,
    lines: ['Twelve apps 12', 'Hex-vaders 3,400'],
    foundCount: 2,
    totalGames: 5,
    url: 'https://conduction.nl',
    hashtag: '#IReadTheKit',
  });
  assert.match(text, /Total score 3,412 across 2 of 5 hidden Conduction mini-games\./);
  assert.match(text, /Twelve apps 12 · Hex-vaders 3,400/);
  assert.match(text, /https:\/\/conduction\.nl/);
  assert.match(text, /#IReadTheKit$/);
  assert.ok(text.length < 500, 'must fit a 500-character Mastodon instance with room for a screenshot');
});

test('a player with no scores yet still gets a postable line', () => {
  const text = buildShareText({total: 0, lines: [], foundCount: 1, totalGames: 5});
  assert.match(text, /Total score 0 across 1 of 5/);
  assert.doesNotMatch(text, /undefined|null|NaN/);
});

test('Dutch is written, not interpolated into English', () => {
  const text = buildShareText({total: 42, lines: [], foundCount: 1, totalGames: 5, locale: 'nl'});
  assert.match(text, /Totaalscore 42 op 1 van de 5/);
  assert.doesNotMatch(text, /Total score/);
});

test('an instance is recognised however the player writes it', () => {
  for (const input of [
    'chaos.social', 'https://chaos.social', 'https://chaos.social/', 'CHAOS.social',
    '@me@chaos.social', 'https://chaos.social/@me', '  chaos.social  ',
  ]) {
    assert.equal(normaliseInstance(input), 'chaos.social', `failed on ${JSON.stringify(input)}`);
  }
});

test('nonsense yields no instance, so nothing opens', () => {
  for (const input of ['', '   ', null, undefined, 'not a host', '@me', 'localhost', 42]) {
    assert.equal(normaliseInstance(input), null, `accepted ${JSON.stringify(input)}`);
  }
  assert.equal(mastodonShareUrl('@me', 'text'), null);
});

test('the Mastodon link targets the share endpoint on the player own instance', () => {
  const url = mastodonShareUrl('@me@mastodon.nl', 'score 12 #IReadTheKit');
  assert.equal(url, 'https://mastodon.nl/share?text=score%2012%20%23IReadTheKit');
});

test('the hashtag survives URL encoding on both networks', () => {
  assert.match(mastodonShareUrl('mastodon.nl', '#IReadTheKit'), /%23IReadTheKit/);
  assert.match(linkedInShareUrl('#IReadTheKit'), /%23IReadTheKit/);
  assert.match(linkedInShareUrl('x'), /^https:\/\/www\.linkedin\.com\/feed\/\?shareActive=true/);
});
