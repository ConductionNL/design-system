/**
 * Unlock matchers — how a hidden game gets found.
 *
 * Every mini-game on a Conduction page is hidden, and every one is
 * hidden differently: finding them is the game around the games. These
 * are the little state machines behind that, kept pure so each one can
 * be tested without a page, a keyboard or a clock of its own.
 *
 * Each matcher takes events and answers the same question: has this
 * been done yet? They never touch the DOM; the component feeds them.
 */

/**
 * A fixed key sequence, the Konami shape.
 *
 * Partial progress survives a wrong key only when that key could start
 * the sequence again, which is what makes "up up down…" forgiving
 * enough to actually land: the second `up` is not a reset, it is a
 * fresh first step.
 */
export function createSequenceMatcher(sequence) {
  const wanted = sequence.map((k) => String(k).toLowerCase());
  let index = 0;

  return {
    get progress() { return index; },
    get length() { return wanted.length; },
    reset() { index = 0; },
    push(key) {
      const k = String(key || '').toLowerCase();
      if (k === wanted[index]) {
        index += 1;
      } else if (k === wanted[0]) {
        index = 1;
      } else {
        index = 0;
      }
      if (index === wanted.length) {
        index = 0;
        return true;
      }
      return false;
    },
  };
}

/**
 * A word — or any of several — typed anywhere on the page.
 *
 * Keeps a rolling buffer the length of the longest word rather than
 * resetting on every mistake, so typing "hunthunter2" still opens it.
 * Anything that is not a single printable character is ignored, so
 * shift, arrows and tabbing about are harmless.
 *
 * Several spellings are a courtesy: a riddle whose answer you know
 * but cannot type the way its author did is not a riddle, it is a
 * password. Note that a short word swallows every longer one ending
 * in it — give it "20" and "nat20" will never match on its own,
 * because "20" has already fired by then.
 */
export function createWordMatcher(word) {
  const wanted = (Array.isArray(word) ? word : [word])
    .map((w) => String(w == null ? '' : w).toLowerCase())
    .filter(Boolean);
  const longest = wanted.reduce((n, w) => Math.max(n, w.length), 1);
  let buffer = '';

  return {
    get buffer() { return buffer; },
    reset() { buffer = ''; },
    push(key) {
      const k = String(key || '');
      if (k.length !== 1) return false;
      buffer = (buffer + k.toLowerCase()).slice(-longest);
      if (wanted.some((w) => buffer.endsWith(w))) {
        buffer = '';
        return true;
      }
      return false;
    },
  };
}

/**
 * N clicks on one thing, inside a window.
 *
 * The window is what keeps an accidental unlock from being assembled
 * over a whole visit: three clicks a minute apart are three people
 * reading, not somebody poking at the logo.
 */
export function createClickCounter({count = 3, windowMs = 1500} = {}) {
  let times = [];

  return {
    get progress() { return times.length; },
    reset() { times = []; },
    push(now) {
      const t = Number(now) || 0;
      times = times.filter((prev) => t - prev <= windowMs);
      times.push(t);
      if (times.length >= count) {
        times = [];
        return true;
      }
      return false;
    },
  };
}

/**
 * Something held down, or hovered, for long enough.
 *
 * Start and end are separate calls because a press that leaves the
 * element never ends: the component cancels it instead, and a
 * cancelled hold must not count.
 */
export function createHoldTimer({holdMs = 1200} = {}) {
  let startedAt = null;

  return {
    get holding() { return startedAt !== null; },
    start(now) { startedAt = Number(now) || 0; },
    cancel() { startedAt = null; },
    check(now) {
      if (startedAt === null) return false;
      if ((Number(now) || 0) - startedAt >= holdMs) {
        startedAt = null;
        return true;
      }
      return false;
    },
  };
}

/**
 * A run of text selected on the page, held for a moment.
 *
 * The moment matters: a selection appears halfway through every drag,
 * so unlocking on the first one would fire while somebody is still
 * choosing what to copy.
 */
export function createSelectionWatcher({minLength = 12, settleMs = 900} = {}) {
  let since = null;
  let last = '';

  return {
    reset() { since = null; last = ''; },
    /** Feed the current selection text and the time; returns true once. */
    push(text, now) {
      const value = String(text || '').trim();
      const t = Number(now) || 0;
      if (value.length < minLength) {
        since = null;
        last = '';
        return false;
      }
      if (value !== last) {
        last = value;
        since = t;
        return false;
      }
      if (since !== null && t - since >= settleMs) {
        since = null;
        last = '';
        return true;
      }
      return false;
    },
  };
}

/** The Konami code, spelled the way KeyboardEvent.key spells it. */
export const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];
