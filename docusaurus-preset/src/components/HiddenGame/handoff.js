/**
 * A one-shot note: open this game when you land on its page.
 *
 * The roster in the game-over modal lets you jump to a game you have
 * already found. Getting it to open on arrival is the same problem
 * HiddenGame used to solve with a localStorage record — and that
 * record is exactly what we took out, because anything written down
 * survives a refresh and the page stops being a product page.
 *
 * So the note lives in memory and nowhere else. Docusaurus keeps the
 * JS context across an internal route change, so it survives the one
 * navigation it needs to. A refresh throws the context away, so it
 * cannot survive that even by accident. Nothing is stored, nothing
 * needs clearing, and private mode behaves like every other mode.
 *
 * It is *taken*, not read: the first HiddenGame with that id to mount
 * consumes it. Coming back to the page a second time asks for the
 * riddle again, which is the whole point.
 *
 * A note that is never collected — a wrong path, or a game that is
 * not on the page after all — is replaced by the next click and dies
 * with the tab. There is nothing to expire.
 */

let pending = null;

/** Ask for `id` to open on the next page that renders it. */
export function requestOpen(id) {
  pending = id || null;
}

/** True once, for the game that was asked for. */
export function takeOpen(id) {
  if (!id || pending !== id) return false;
  pending = null;
  return true;
}

/** Test seam: forget any outstanding note. */
export function clearPending() {
  pending = null;
}
