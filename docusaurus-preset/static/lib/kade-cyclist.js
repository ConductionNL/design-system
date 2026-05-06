/* Kade Cyclist: hidden minigame on the canal-footer kade strip. First
   click on a drifting kade bike pauses the ambient drift, promotes the
   clicked bike to a player-controlled cyclist, and starts spawning
   hazards (oncoming bikes / cars / scooters) from the right. Player
   sits at a fixed x near the left, switches between two lanes
   (top/bottom of the kade) with arrow keys (↑/↓ or W/S). Score rises
   per hazard passed. Collision = game over. Fires `connext:gameend`
   so the gaming-modal cookie picks it up. Boat game keeps running
   independently on the water layer. */
(function () {
  const SPAWN_INITIAL_MS = 2200;
  const SPAWN_FLOOR_MS = 700;
  const HAZARD_BASE_MS = 5400;
  const HAZARD_FLOOR_MS = 2400;
  const PLAYER_X_PCT = 14;          // fixed player x as percentage of viewport
  const COLLISION_X_TOL = 26;       // px tolerance around player x
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hazard kinds clone the look of existing kade items.
  const HAZARD_KINDS = ['bike', 'car', 'scooter'];

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function findRoot() {
    return document.querySelector('.canal-footer');
  }

  function hydrate() {
    const root = findRoot();
    if (!root) return;
    if (root.dataset.kadeHydrated === '1') return;
    const kade = root.querySelector('.kade');
    if (!kade) return;
    root.dataset.kadeHydrated = '1';

    const onBikeClick = function (e) {
      if (root.dataset.kadeActive === '1') return;
      const target = e.target.closest('.ki-bike-1, .ki-bike-2');
      if (!target || !kade.contains(target)) return;
      e.preventDefault();
      e.stopPropagation();
      startGame(root, kade, target);
    };
    /* Click capture on the kade so we can intercept before the boat
       game's own click handlers (which only listen on .ci items, not
       .ki, but defensive capture is cheap). */
    kade.addEventListener('click', onBikeClick, true);
  }

  function buildHazardSvg(kind) {
    /* Inline SVG markup for hazards — kept here so we don't depend on
       template ids in the host page. Sizes match the existing kade items
       in canal-footer JSX. */
    if (kind === 'bike') {
      return (
        '<svg class="kc-hazard-svg kc-bike" width="22" height="16" viewBox="0 -2 22 18" aria-hidden="true">' +
          '<g stroke="#0A172F" stroke-width="1.4" fill="none" stroke-linecap="round">' +
            '<circle cx="4" cy="12" r="3"/>' +
            '<circle cx="18" cy="12" r="3"/>' +
            '<line x1="4" y1="12" x2="11" y2="6"/>' +
            '<line x1="11" y1="6" x2="18" y2="12"/>' +
            '<line x1="11" y1="6" x2="14" y2="12"/>' +
            '<line x1="11" y1="6" x2="11" y2="3"/>' +
            '<line x1="11" y1="3" x2="14" y2="6"/>' +
          '</g>' +
          '<circle cx="11" cy="1.5" r="1.6" fill="#0A172F"/>' +
        '</svg>'
      );
    }
    if (kind === 'car') {
      return (
        '<svg class="kc-hazard-svg kc-car" width="38" height="16" viewBox="0 0 38 16" aria-hidden="true">' +
          '<rect x="0" y="6" width="38" height="6" rx="2" fill="#0A172F"/>' +
          '<path d="M 5,6 L 9,2 L 29,2 L 33,6 Z" fill="#0A172F"/>' +
          '<rect x="11" y="3" width="6" height="3" fill="rgba(255,255,255,0.4)"/>' +
          '<rect x="20" y="3" width="6" height="3" fill="rgba(255,255,255,0.4)"/>' +
          '<circle cx="9" cy="13" r="2" fill="#C8482F"/>' +
          '<circle cx="29" cy="13" r="2" fill="#C8482F"/>' +
        '</svg>'
      );
    }
    /* scooter — small parked-style profile */
    return (
      '<svg class="kc-hazard-svg kc-scooter" width="22" height="16" viewBox="0 -2 22 18" aria-hidden="true">' +
        '<g stroke="#3A3F4B" stroke-width="1.4" fill="none" stroke-linecap="round">' +
          '<circle cx="5" cy="12" r="3"/>' +
          '<circle cx="17" cy="12" r="3"/>' +
          '<path d="M 5,12 L 11,12 L 14,5 L 17,12" stroke-width="1.6"/>' +
          '<line x1="14" y1="5" x2="16" y2="2"/>' +
          '<line x1="14" y1="5" x2="12" y2="2"/>' +
        '</g>' +
      '</svg>'
    );
  }

  function startGame(root, kade, originBike) {
    root.dataset.kadeActive = '1';

    /* Pause every ambient kade item, but keep them visible so the
       playfield still reads as a populated street. */
    const ambientItems = Array.from(kade.querySelectorAll('.ki'));
    ambientItems.forEach(function (el) {
      el.style.animationPlayState = 'paused';
    });

    /* Hide the original clicked bike — it becomes the player. */
    originBike.style.visibility = 'hidden';

    /* Build a play-area overlay positioned over the kade. We expand
       slightly above the kade so the player's lane separation reads
       clearly without the existing 30px feeling cramped. */
    const stage = document.createElement('div');
    stage.className = 'kc-stage';
    stage.innerHTML =
      '<div class="kc-track" data-track>' +
        '<div class="kc-lane kc-lane-top" data-lane="top"></div>' +
        '<div class="kc-lane kc-lane-bottom" data-lane="bottom"></div>' +
        '<div class="kc-player" data-player>' +
          '<svg class="kc-player-svg" width="22" height="16" viewBox="0 -2 22 18" aria-hidden="true">' +
            '<g stroke="#0A172F" stroke-width="1.4" fill="none" stroke-linecap="round">' +
              '<circle cx="4" cy="12" r="3"/>' +
              '<circle cx="18" cy="12" r="3"/>' +
              '<line x1="4" y1="12" x2="11" y2="6"/>' +
              '<line x1="11" y1="6" x2="18" y2="12"/>' +
              '<line x1="11" y1="6" x2="14" y2="12"/>' +
              '<line x1="11" y1="6" x2="11" y2="3"/>' +
              '<line x1="11" y1="3" x2="14" y2="6"/>' +
            '</g>' +
            '<circle cx="11" cy="1.5" r="1.6" fill="var(--c-orange-knvb, #F77F0E)"/>' +
            '<circle cx="4" cy="12" r="1.6" fill="var(--c-orange-knvb, #F77F0E)"/>' +
            '<circle cx="18" cy="12" r="1.6" fill="var(--c-orange-knvb, #F77F0E)"/>' +
          '</svg>' +
        '</div>' +
      '</div>' +
      '<div class="kc-hud">' +
        '<div class="kc-score-block"><span class="kc-score-num" data-score>0</span><span class="kc-score-label">Score</span></div>' +
        '<div class="kc-controls" aria-hidden="true">' +
          '<kbd>&uarr;</kbd>/<kbd>W</kbd> &middot; <kbd>&darr;</kbd>/<kbd>S</kbd>' +
        '</div>' +
        '<button type="button" class="kc-close" data-close aria-label="Stop spel">&times;</button>' +
      '</div>' +
      '<div class="kc-over" data-over hidden>' +
        '<p class="kc-over-title">Bots.</p>' +
        '<p class="kc-over-stat"><span data-final-score>0</span> dodges</p>' +
        '<button type="button" data-restart>Speel opnieuw</button>' +
      '</div>';
    kade.appendChild(stage);

    const trackEl = stage.querySelector('[data-track]');
    const playerEl = stage.querySelector('[data-player]');
    const scoreSpan = stage.querySelector('[data-score]');
    const finalScoreSpan = stage.querySelector('[data-final-score]');
    const overPanel = stage.querySelector('[data-over]');
    const closeBtn = stage.querySelector('[data-close]');
    const restartBtn = stage.querySelector('[data-restart]');

    let lane = 'bottom';
    let score = 0;
    let speedMul = 1;
    let spawnTimer = null;
    let rafId = null;
    let over = false;
    const hazards = []; // { el, lane, kind, startedAt, durationMs }
    const startTime = performance.now();

    function setLane(next) {
      if (over) return;
      if (lane === next) return;
      lane = next;
      playerEl.dataset.lane = next;
    }
    playerEl.dataset.lane = lane;

    function spawnHazard() {
      if (over) return;
      const kind = HAZARD_KINDS[(Math.random() * HAZARD_KINDS.length) | 0];
      const hazardLane = Math.random() < 0.5 ? 'top' : 'bottom';
      const hazard = document.createElement('div');
      hazard.className = 'kc-hazard';
      hazard.dataset.lane = hazardLane;
      hazard.dataset.kind = kind;
      hazard.innerHTML = buildHazardSvg(kind);
      const dur = clamp(HAZARD_BASE_MS / speedMul, HAZARD_FLOOR_MS, HAZARD_BASE_MS);
      hazard.style.animationDuration = dur + 'ms';
      trackEl.appendChild(hazard);
      const entry = { el: hazard, lane: hazardLane, kind: kind, startedAt: performance.now(), durationMs: dur, scored: false };
      hazards.push(entry);
      hazard.addEventListener('animationend', function () {
        if (!entry.scored && !over) {
          // Player survived this one
          entry.scored = true;
          score++;
          scoreSpan.textContent = String(score);
          // Difficulty ramp every 5 dodges
          if (score % 5 === 0) speedMul = clamp(speedMul + 0.12, 1, 3);
        }
        hazard.remove();
        const idx = hazards.indexOf(entry);
        if (idx >= 0) hazards.splice(idx, 1);
      });
    }

    function scheduleSpawn() {
      if (over) return;
      const interval = clamp(SPAWN_INITIAL_MS / speedMul, SPAWN_FLOOR_MS, SPAWN_INITIAL_MS);
      spawnTimer = setTimeout(function () {
        spawnHazard();
        scheduleSpawn();
      }, interval);
    }

    function checkCollisions() {
      if (over) return;
      const trackRect = trackEl.getBoundingClientRect();
      const playerRect = playerEl.getBoundingClientRect();
      const playerCx = playerRect.left + playerRect.width / 2 - trackRect.left;
      for (let i = 0; i < hazards.length; i++) {
        const h = hazards[i];
        if (h.scored) continue;
        if (h.lane !== lane) continue;
        const hazardRect = h.el.getBoundingClientRect();
        const hazardCx = hazardRect.left + hazardRect.width / 2 - trackRect.left;
        if (Math.abs(hazardCx - playerCx) < COLLISION_X_TOL) {
          gameOver();
          return;
        }
      }
      rafId = requestAnimationFrame(checkCollisions);
    }

    function gameOver() {
      if (over) return;
      over = true;
      if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      // Freeze remaining hazards in place
      hazards.forEach(function (h) { h.el.style.animationPlayState = 'paused'; });
      playerEl.classList.add('crashed');
      finalScoreSpan.textContent = String(score);
      const elapsedSec = Math.round((performance.now() - startTime) / 1000);
      setTimeout(function () { overPanel.hidden = false; }, 350);
      try {
        document.dispatchEvent(new CustomEvent('connext:gameend', {
          detail: { game: 'kade-cyclist', won: false, score: score, seconds: elapsedSec }
        }));
      } catch (_) {}
    }

    function tearDown() {
      over = true;
      if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      document.removeEventListener('keydown', onKey);
      // Resume ambient drift
      ambientItems.forEach(function (el) { el.style.animationPlayState = ''; });
      originBike.style.visibility = '';
      stage.remove();
      delete root.dataset.kadeActive;
    }

    function onKey(e) {
      if (e.key === 'Escape') { tearDown(); return; }
      if (over) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { setLane('top'); e.preventDefault(); }
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { setLane('bottom'); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);

    closeBtn.addEventListener('click', tearDown);
    restartBtn.addEventListener('click', function () {
      tearDown();
      setTimeout(function () { startGame(root, kade, originBike); }, reduceMotion ? 10 : 300);
    });

    /* Reduced motion: keep the game playable but with shorter durations
       and no entrance animations. The CSS handles transitions; we just
       scale the speed multiplier higher so hazards traverse faster. */
    if (reduceMotion) speedMul = 1.4;

    /* Kick off the loops */
    scheduleSpawn();
    rafId = requestAnimationFrame(checkCollisions);
  }

  window.KadeCyclist = window.KadeCyclist || {};
  window.KadeCyclist.hydrate = hydrate;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
