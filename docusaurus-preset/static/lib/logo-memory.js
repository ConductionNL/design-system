/* Logo Memory: hidden minigame on the Clients hex marquee. First click
   on any hex pauses the marquee, picks 12 random client logos, doubles
   them into 24 tiles, drops them into a centred 4-5-6-5-4 honeycomb
   cluster face-up (so you see the logos pair-up), then flips every
   tile to the Conduction back. From there it's classic memory: click
   two, match holds at orange-glow, mismatch flips back. Win fires
   `connext:gameend` so the gaming-modal cookie picks it up. */
(function () {
  const PAIRS = 12;
  const FLIP_MS = 600;
  const MEMORIZE_MS = 1600;
  const MISMATCH_MS = 900;
  const STAGGER_MS = 35;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROW_SIZES = [4, 5, 6, 5, 4]; // 24 = 12 pairs

  const CONDUCTION_BACK_SVG =
    '<svg viewBox="-86.6 -100 173.2 200" aria-hidden="true">' +
      '<polygon fill="#21468B" points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50"/>' +
      '<polygon fill="#FFFFFF" points="0,-74.5 64.5,-37.3 64.5,37.3 0,74.5 -64.5,37.3 -64.5,-37.3"/>' +
      '<polygon fill="#21468B" points="-0.2,-25.2 20.1,-13.5 43.7,-27.1 -0.2,-52.4 -45.6,-26.2 -45.6,26.2 -0.2,52.4 43.7,27.1 20.1,13.5 -0.2,25.2 -22,12.6 -22,-12.6"/>' +
    '</svg>';

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function collectLogos(marquee) {
    const seen = new Map();
    marquee.querySelectorAll('a').forEach(function (a) {
      const img = a.querySelector('img');
      if (!img) return;
      const src = img.getAttribute('src');
      if (!src || seen.has(src)) return;
      const name = a.getAttribute('aria-label') || img.getAttribute('alt') || '';
      seen.set(src, name);
    });
    return Array.from(seen, function (entry) { return { src: entry[0], name: entry[1] }; });
  }

  function hydrateContainer(container) {
    if (container.dataset.memoryHydrated === '1') return;
    container.dataset.memoryHydrated = '1';

    const marquee = container.querySelector('[data-memory-marquee]') ||
                    container.querySelector('[class*="marquee"]') ||
                    container.querySelector('.marquee');
    if (!marquee) return;

    const onHexClick = function (e) {
      if (container.dataset.memoryActive === '1') return;
      const a = e.target.closest('a');
      if (!a || !marquee.contains(a)) return;
      e.preventDefault();
      const logos = collectLogos(marquee);
      if (logos.length < PAIRS) return;
      startGame(container, marquee, logos);
    };
    marquee.addEventListener('click', onHexClick);
  }

  function startGame(container, marquee, logos) {
    container.dataset.memoryActive = '1';
    marquee.classList.add('memory-frozen');

    const picked = shuffle(logos).slice(0, PAIRS);
    const tiles = shuffle(picked.flatMap(function (l, i) {
      return [{ src: l.src, name: l.name, pairId: i }, { src: l.src, name: l.name, pairId: i }];
    }));

    const overlay = document.createElement('div');
    overlay.className = 'logo-memory-overlay';
    overlay.innerHTML =
      '<div class="logo-memory-backdrop"></div>' +
      '<div class="logo-memory-stage" role="application" aria-label="Logo memory minigame">' +
        '<div class="logo-memory-hud">' +
          '<div class="logo-memory-counter"><span data-matched>0</span> / ' + PAIRS + '</div>' +
          '<div class="logo-memory-moves"><span data-moves>0</span> zetten</div>' +
          '<button class="logo-memory-close" type="button" aria-label="Sluit spel">&times;</button>' +
        '</div>' +
        '<div class="logo-memory-grid" data-grid></div>' +
        '<div class="logo-memory-win" hidden>' +
          '<div class="logo-memory-win-title">Klaar.</div>' +
          '<div class="logo-memory-win-stats"><span data-final-moves>0</span> zetten &middot; <span data-final-time>0</span> sec</div>' +
          '<button class="logo-memory-replay" type="button">Speel opnieuw</button>' +
        '</div>' +
      '</div>';
    container.appendChild(overlay);

    const grid = overlay.querySelector('[data-grid]');
    const matchedSpan = overlay.querySelector('[data-matched]');
    const movesSpan = overlay.querySelector('[data-moves]');
    const finalMovesSpan = overlay.querySelector('[data-final-moves]');
    const finalTimeSpan = overlay.querySelector('[data-final-time]');
    const winPanel = overlay.querySelector('.logo-memory-win');
    const closeBtn = overlay.querySelector('.logo-memory-close');
    const replayBtn = overlay.querySelector('.logo-memory-replay');

    let tileIdx = 0;
    const tileEls = [];
    ROW_SIZES.forEach(function (size) {
      const row = document.createElement('div');
      row.className = 'logo-memory-row';
      for (let i = 0; i < size; i++) {
        const t = tiles[tileIdx++];
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'logo-memory-tile flipped'; // start face-up so player sees the doubling
        tile.dataset.pair = String(t.pairId);
        tile.style.setProperty('--stagger', (tileIdx * STAGGER_MS) + 'ms');
        tile.setAttribute('aria-label', 'Memory tile: ' + t.name);
        tile.innerHTML =
          '<span class="logo-memory-tile-inner">' +
            '<span class="logo-memory-face logo-memory-back">' + CONDUCTION_BACK_SVG + '</span>' +
            '<span class="logo-memory-face logo-memory-front">' +
              '<img src="' + t.src + '" alt="' + t.name + '" loading="lazy">' +
            '</span>' +
          '</span>';
        row.appendChild(tile);
        tileEls.push(tile);
      }
      grid.appendChild(row);
    });

    let firstTile = null;
    let busy = true; // locked during memorize
    let moves = 0;
    let matched = 0;
    let phase = 'memorize';
    const startTime = Date.now();

    // Memorize phase: show all logos for a beat, then flip to face-down
    const flipDelay = reduceMotion ? 0 : MEMORIZE_MS;
    const flipStagger = reduceMotion ? 0 : STAGGER_MS;
    setTimeout(function () {
      tileEls.forEach(function (tile, i) {
        setTimeout(function () {
          tile.classList.remove('flipped');
          tile.setAttribute('aria-label', 'Memory tile, omgedraaid');
          if (i === tileEls.length - 1) {
            phase = 'play';
            busy = false;
          }
        }, i * flipStagger);
      });
    }, flipDelay);

    function onTileClick(tile) {
      if (busy || phase !== 'play') return;
      if (tile.classList.contains('matched')) return;
      if (tile.classList.contains('flipped')) return; // already revealed

      tile.classList.add('flipped');
      tile.setAttribute('aria-label', 'Memory tile, geraden');

      if (!firstTile) {
        firstTile = tile;
        return;
      }

      const second = tile;
      moves++;
      movesSpan.textContent = String(moves);

      const t1 = firstTile;
      firstTile = null;

      if (t1.dataset.pair === second.dataset.pair) {
        busy = true;
        setTimeout(function () {
          t1.classList.add('matched');
          second.classList.add('matched');
          t1.disabled = true;
          second.disabled = true;
          matched++;
          matchedSpan.textContent = String(matched);
          busy = false;
          if (matched === PAIRS) onWin();
        }, FLIP_MS);
      } else {
        busy = true;
        setTimeout(function () {
          t1.classList.remove('flipped');
          second.classList.remove('flipped');
          t1.setAttribute('aria-label', 'Memory tile, omgedraaid');
          second.setAttribute('aria-label', 'Memory tile, omgedraaid');
          busy = false;
        }, MISMATCH_MS);
      }
    }

    tileEls.forEach(function (t) {
      t.addEventListener('click', function () { onTileClick(t); });
    });

    function onWin() {
      phase = 'won';
      const elapsedSec = Math.round((Date.now() - startTime) / 1000);
      finalMovesSpan.textContent = String(moves);
      finalTimeSpan.textContent = String(elapsedSec);
      overlay.classList.add('won');
      setTimeout(function () { winPanel.hidden = false; }, 700);
      try {
        document.dispatchEvent(new CustomEvent('connext:gameend', {
          detail: { game: 'logo-memory', won: true, moves: moves, seconds: elapsedSec }
        }));
      } catch (_) {}
    }

    function tearDown() {
      if (phase !== 'won') {
        try {
          document.dispatchEvent(new CustomEvent('connext:gameend', {
            detail: { game: 'logo-memory', won: false, aborted: true, moves: moves }
          }));
        } catch (_) {}
      }
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('closing');
      setTimeout(function () {
        overlay.remove();
        marquee.classList.remove('memory-frozen');
        delete container.dataset.memoryActive;
      }, reduceMotion ? 0 : 280);
    }

    function onKey(e) {
      if (e.key === 'Escape') tearDown();
    }
    document.addEventListener('keydown', onKey);

    closeBtn.addEventListener('click', tearDown);
    replayBtn.addEventListener('click', function () {
      tearDown();
      setTimeout(function () { startGame(container, marquee, logos); }, reduceMotion ? 10 : 320);
    });
  }

  function hydrate() {
    document.querySelectorAll('[data-logo-memory]').forEach(hydrateContainer);
  }

  window.LogoMemory = window.LogoMemory || {};
  window.LogoMemory.hydrate = hydrate;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
