/* game-modal.js — discovery + best-score tracker for the five hidden
   mini-games. Self-bootstrapping: each host page just adds

     <script src="../components/game-modal.js" defer></script>

   and the script injects its CSS link, the modal markup, and the
   event wiring. Games dispatch `connext:gameend` on window; the modal
   handles cookie persistence and renders the 5-tile progress grid.

   Cookie: `connext_minigames` (1-year, SameSite=Lax) holds JSON of
   game-id → { found, best, summary, wins, lastPlayed }.

   "Play again" emits `connext:gamereplay` with the game's id so the
   host game can listen and reset. Each game decides what replay means.
*/
(function () {
  // ---- Self-injection. Resolve sibling CSS / markup against this
  // script's own src so a host page only needs the one <script> tag. ----
  const SELF = (function findSelf() {
    if (document.currentScript) return document.currentScript;
    for (const s of document.querySelectorAll('script[src]')) {
      if (s.src && s.src.includes('game-modal.js')) return s;
    }
    return null;
  })();
  const SELF_URL = SELF && SELF.src ? SELF.src : null;

  function ensureCss() {
    if (document.querySelector('link[data-game-modal-css]') || !SELF_URL) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('game-modal.css', SELF_URL).href;
    link.dataset.gameModalCss = '1';
    document.head.appendChild(link);
  }

  const MODAL_HTML =
    '<div class="game-modal" id="connext-game-modal" role="dialog" aria-modal="true" aria-labelledby="gm-title" hidden>' +
      '<div class="game-modal__overlay" data-close></div>' +
      '<div class="game-modal__panel">' +
        '<button type="button" class="game-modal__close" data-close aria-label="Close">×</button>' +
        '<p class="game-modal__eyebrow" data-eyebrow>Mini-game complete</p>' +
        '<h2 class="game-modal__title" id="gm-title" data-title>Nice run.</h2>' +
        '<p class="game-modal__subtitle" data-subtitle></p>' +
        '<span class="game-modal__score-pill" data-score-pill hidden></span>' +
        '<div class="game-modal__progress">' +
          '<div class="game-modal__progress-label">' +
            '<span><strong data-progress-found>0</strong> / 5 mini-games found</span>' +
            '<span data-progress-percent>0%</span>' +
          '</div>' +
          '<div class="game-modal__progress-bar">' +
            '<div class="game-modal__progress-fill" data-progress-fill></div>' +
          '</div>' +
        '</div>' +
        '<div class="game-modal__grid" data-grid></div>' +
        '<p class="game-modal__cta" data-cta>Five mini-games are hidden across this site.</p>' +
        '<div class="game-modal__actions">' +
          '<button type="button" class="game-modal__btn game-modal__btn--secondary" data-close>Close</button>' +
          '<button type="button" class="game-modal__btn game-modal__btn--primary" data-replay>Play again</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  function ensureMarkup() {
    if (document.getElementById('connext-game-modal')) return;
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
  }

  const COOKIE = 'connext_minigames';
  const COOKIE_DAYS = 365;

  // Five game slots. The first three are wired today; the last two
  // ship as locked teasers. `clue` is shown as a hover tooltip on the
  // tile in the grid — keep it short, location-flavoured, and a little
  // playful so the reader knows where to keep digging.
  const GAMES = [
    {
      id: 'boats',
      name: 'Canal armada',
      clue: 'Sink the fleet at the bottom of any page.',
      icon: '<path d="M3 14h18M3 14l1 4a3 3 0 0 0 3 2h10a3 3 0 0 0 3-2l1-4M5 14V8h14v6M9 4h6v4H9z"/>',
    },
    {
      id: 'hexrain',
      name: 'Twelve apps',
      clue: 'Catch the apps as they fall on the front door.',
      icon: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 8l3 1.7v3.4L12 14.8l-3-1.7V9.7z"/>',
    },
    {
      id: 'invaders',
      name: 'Cookie invaders',
      clue: 'Eat your cookies.',
      icon: '<rect x="5" y="6" width="14" height="10" rx="1"/><path d="M3 18h18M9 14v2M15 14v2M9 9h0M15 9h0"/>',
    },
    {
      id: 'mystery1',
      name: '???',
      clue: 'Keep digging — we\'re not telling.',
      icon: null,
    },
    {
      id: 'mystery2',
      name: '???',
      clue: 'Keep digging — we\'re not telling.',
      icon: null,
    },
  ];

  // ---- Cookie helpers ----
  function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }
  function loadState() {
    const raw = getCookie(COOKIE);
    if (!raw) return {};
    try { return JSON.parse(raw) || {}; } catch (e) { return {}; }
  }
  function saveState(state) {
    setCookie(COOKIE, JSON.stringify(state), COOKIE_DAYS);
  }

  // ---- Modal lookup. Bail if the include hasn't landed on this page. ----
  function $(sel) { return document.getElementById('connext-game-modal')?.querySelector(sel); }
  function modalEl() { return document.getElementById('connext-game-modal'); }

  function setText(el, text) { if (el) el.textContent = text; }

  // ---- Render helpers ----
  function renderGrid(state, justUnlockedId) {
    const grid = $('[data-grid]');
    if (!grid) return;
    grid.innerHTML = '';
    for (const g of GAMES) {
      const entry = state[g.id];
      const found = !!(entry && entry.found);
      const tile = document.createElement('div');
      tile.className = 'gm-tile' + (found ? ' found' : '') + (g.id === justUnlockedId ? ' just-unlocked' : '');

      const hex = document.createElement('div');
      hex.className = 'gm-tile__hex';
      if (found && g.icon) {
        hex.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + g.icon + '</svg>';
      } else {
        const m = document.createElement('span');
        m.className = 'gm-mystery';
        m.textContent = '?';
        hex.appendChild(m);
      }
      tile.appendChild(hex);

      const name = document.createElement('p');
      name.className = 'gm-tile__name';
      name.textContent = found ? g.name : '???';
      tile.appendChild(name);

      const score = document.createElement('span');
      score.className = 'gm-tile__score';
      if (found) {
        score.textContent = entry.summary || ('best ' + (entry.best ?? '—'));
      } else {
        score.textContent = 'locked';
      }
      tile.appendChild(score);

      // Custom hover hint — pointer to where the game is hiding.
      const hint = document.createElement('span');
      hint.className = 'gm-tile__hint';
      hint.textContent = g.clue;
      tile.appendChild(hint);

      grid.appendChild(tile);
    }
  }

  function renderProgress(state) {
    const foundCount = GAMES.reduce((n, g) => n + (state[g.id]?.found ? 1 : 0), 0);
    const pct = Math.round((foundCount / GAMES.length) * 100);
    setText($('[data-progress-found]'), foundCount);
    setText($('[data-progress-percent]'), pct + '%');
    const fill = $('[data-progress-fill]');
    if (fill) requestAnimationFrame(() => { fill.style.width = pct + '%'; });

    const cta = $('[data-cta]');
    if (cta) {
      const remaining = GAMES.length - foundCount;
      if (remaining === 0) {
        cta.innerHTML = '<strong>All five mini-games discovered.</strong> Nicely done.';
      } else if (foundCount === 0) {
        cta.textContent = 'Five mini-games are hidden across this site. You just found one.';
      } else {
        cta.innerHTML = '<strong>' + remaining + '</strong> more ' + (remaining === 1 ? 'game' : 'games') + ' hidden somewhere on the site. Keep digging around.';
      }
    }
    return foundCount;
  }

  // ---- Header copy per game-end event ----
  function setHeader(detail, isNewlyFound) {
    const game = GAMES.find(g => g.id === detail.id);
    const eyebrow = isNewlyFound ? 'New mini-game found!' : (detail.won ? 'Mini-game cleared' : 'Mini-game complete');
    const title = isNewlyFound
      ? (game ? game.name : 'Hidden game')
      : (detail.won ? 'Nice run.' : 'Time to try again.');
    const subtitle = detail.won
      ? (game ? game.clue : 'You won.')
      : (game ? game.clue : 'Better luck next round.');
    setText($('[data-eyebrow]'), eyebrow);
    setText($('[data-title]'), title);
    setText($('[data-subtitle]'), subtitle);

    const pill = $('[data-score-pill]');
    if (pill) {
      if (detail.summary) {
        pill.textContent = detail.summary;
        pill.hidden = false;
      } else {
        pill.hidden = true;
      }
    }
  }

  // ---- Show / hide ----
  function show() {
    const m = modalEl();
    if (!m) return;
    m.hidden = false;
    m.classList.add('show');
    document.documentElement.style.overflow = 'hidden';
  }
  function hide() {
    const m = modalEl();
    if (!m) return;
    m.classList.remove('show');
    m.hidden = true;
    document.documentElement.style.overflow = '';
  }

  // ---- Last-played id (so "Play again" knows which game) ----
  let lastPlayedId = null;

  // ---- Event handlers ----
  function onGameEnd(e) {
    const detail = e.detail || {};
    if (!detail.id) return;
    lastPlayedId = detail.id;

    const state = loadState();
    const prev = state[detail.id] || { found: false, best: null, summary: null, wins: 0 };
    const isNewlyFound = !prev.found;

    // Best-score policy: higher numeric score wins; if no numeric, just keep first seen.
    let best = prev.best;
    let summary = prev.summary;
    if (typeof detail.score === 'number') {
      if (best == null || detail.score > best) {
        best = detail.score;
        summary = detail.summary || String(detail.score);
      }
    } else if (!summary && detail.summary) {
      summary = detail.summary;
    }

    state[detail.id] = {
      found: true,
      best,
      summary,
      wins: (prev.wins || 0) + (detail.won ? 1 : 0),
      lastPlayed: Date.now(),
    };
    saveState(state);

    setHeader(detail, isNewlyFound);
    renderGrid(state, isNewlyFound ? detail.id : null);
    renderProgress(state);
    show();
  }

  function onClickInsideModal(e) {
    const t = e.target.closest('[data-close], [data-replay]');
    if (!t) return;
    if (t.hasAttribute('data-replay')) {
      const id = lastPlayedId;
      hide();
      if (id) {
        window.dispatchEvent(new CustomEvent('connext:gamereplay', { detail: { id } }));
      }
    } else {
      hide();
    }
  }

  // ---- Wire up. Self-injects CSS + markup, then attaches listeners. ----
  function wire() {
    ensureCss();
    ensureMarkup();
    const m = modalEl();
    if (!m) return; // body not ready yet; will retry on DOMContentLoaded
    m.addEventListener('click', onClickInsideModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && m.classList.contains('show')) hide();
    });
    // Pre-render the grid + progress with whatever's in the cookie so
    // the standalone preview page shows real state.
    const state = loadState();
    renderGrid(state, null);
    renderProgress(state);
  }

  // Always listen for game-end on window — even before the markup lands.
  window.addEventListener('connext:gameend', onGameEnd);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire, { once: true });
  } else {
    wire();
  }
})();