/* Canal footer — randomised skyline + drifting boats + a click-to-sink
   mini-game. Boats use a CSS keyframe drift on page load; spawned boats
   (added by the mini-game once it starts) use Web Animations API so the
   drift duration can scale with the per-game speed multiplier.

   LEVELS (driven by the score countdown from 100):
     100→81  drift fleet only            calm, ~1.4s/spawn
     80→61   + sailing ships  (HP 2)     ~1.0s/spawn
     60→41   + cargo ships    (HP 3)     ~0.7s/spawn
     40→21   + frigates       (HP 4)     ~0.5s/spawn, 2 at a time
     20→11   + cruise-bosses  (HP 5)     ~0.3s/spawn, 2-3 at a time
     10→2    cruise swarm + chaos        ~0.2s/spawn, 3 at a time
     1       battleship boss  (HP 10)    regular spawns paused
*/
/* On Docusaurus SPA navigation React unmounts the old <Footer/> and
   mounts a new one. The IIFE pattern (run once at script load, bind to
   the first .canal-footer found) bound listeners and timers to the
   detached old DOM — so on the new page the skyline placeholder stayed
   empty and boat clicks didn't register, until a hard reload re-ran
   the script. The fix: wrap setup in init(), expose it as
   window.CanalFooter.hydrate, and have the Footer swizzle call it on
   every mount. The data-canal-footer-ready attribute keeps repeated
   calls on the same root idempotent; _cleanup tears down the previous
   instance's timers so they don't leak across route changes. */
(function () {
  function init() {
    const root = document.querySelector('.canal-footer');
    if (!root) return;
    /* Same DOM node we already wired? Bail. The dataset attribute is
       attached to the LIVE root; React replaces the whole footer node
       on SPA navigation, so a fresh root has no attribute and falls
       through to setup. */
    if (root.dataset.canalFooterReady === '1') return;
    /* Genuinely fresh root, so the *previous* instance (if any) was
       bound to a now-detached DOM. Stop its timers and unhook its
       window listeners before binding new ones. */
    if (window.CanalFooter && window.CanalFooter._cleanup) {
      try { window.CanalFooter._cleanup(); } catch (e) { /* ignore */ }
    }
    root.dataset.canalFooterReady = '1';

  // ===== Skyline (random row of trapgevels) =====
  const skyline = root.querySelector('.skyline');
  const houseTypes  = ['h-a', 'h-b', 'h-c', 'h-d', 'h-e'];
  const houseWidths = { 'h-a': 48, 'h-b': 60, 'h-c': 42, 'h-d': 54, 'h-e': 57 };
  /* The Conduction office is always the same grachtenpand. It used to be
     whichever type the middle slot happened to roll, so the building
     changed on every page load and could be mirrored on top of that —
     and one of the five, the 42px-wide h-c, is too narrow for the house
     number to sit beside its door. */
  const OFFICE_HOUSE = 'h-d';
  /* Facades for the two slots either side of the office. The office is
     the shortest house on the canal at 108px, and it only stands out
     when its neighbours stand over it — left to the roll it kept landing
     level with the row and disappeared into it. These are the two
     tallest types, 132 and 144, so whichever pair comes up clears the
     office by 24px or more. They are drawn independently and still take
     the usual mirror roll, so the pair varies from load to load. */
  const OFFICE_NEIGHBOURS = ['h-b', 'h-c'];

  /* Replace a slot's facade in place, keeping the wrapper (and anything
     already bound to it) and re-rolling the mirror. */
  function fillWrap(wrap, type, flipped) {
    const tpl = document.getElementById('tpl-' + type);
    if (!tpl) return;
    wrap.innerHTML = '';
    wrap.appendChild(tpl.content.cloneNode(true));
    if (flipped) wrap.querySelector('svg').classList.add('flipped');
  }

  function buildSkyline() {
    skyline.innerHTML = '';
    let total = 0;
    const target = window.innerWidth + 200;
    let prev = null;
    while (total < target) {
      let pick;
      do {
        pick = houseTypes[(Math.random() * houseTypes.length) | 0];
      } while (pick === prev && Math.random() < 0.7);
      prev = pick;
      const tpl = document.getElementById('tpl-' + pick);
      if (!tpl) continue;
      const wrap = document.createElement('div');
      wrap.className = 'house-wrap';
      wrap.appendChild(tpl.content.cloneNode(true));
      if (Math.random() < 0.30) wrap.querySelector('svg').classList.add('flipped');
      skyline.appendChild(wrap);
      total += houseWidths[pick];
    }
    const all = skyline.querySelectorAll('.house-wrap');
    if (all.length) {
      const mid = Math.floor(all.length / 2);

      /* Swap whatever the middle slot rolled for the office facade,
         unflipped — the office is one building, not five. Then stand a
         tall house in the slot either side of it. Replacing three slots
         moves the row's total width by at most 54px, and the row is
         built 200px past the viewport, so it still fills the width. */
      fillWrap(all[mid], OFFICE_HOUSE, false);
      all[mid].classList.add('house-conduction');

      [mid - 1, mid + 1].forEach(function (i) {
        if (!all[i]) return;
        const pick = OFFICE_NEIGHBOURS[(Math.random() * OFFICE_NEIGHBOURS.length) | 0];
        fillWrap(all[i], pick, Math.random() < 0.30);
      });
    }
  }

  // ===== Random per-item drift speeds for the initial fleet =====
  const initialDriftSpeeds = {
    'ki-bike-1': [55, 95],
    'ki-bike-2': [60, 100],
    'ki-car-1':  [70, 120],
    'ki-car-2':  [75, 130],
    'ci-cruise':    [180, 280],
    'ci-sloep':     [120, 200],
    'ci-row':       [200, 320],
    'ci-swim':      [320, 480],
    'ci-hover':     [90, 150],
    'ci-periscope': [240, 380],
    'ci-whale':     [220, 340],
  };
  function rollSpeeds() {
    Object.entries(initialDriftSpeeds).forEach(([cls, [lo, hi]]) => {
      const el = root.querySelector('.' + cls);
      if (!el) return;
      const dur = lo + Math.random() * (hi - lo);
      el.style.animationDuration = dur + 's';
      el.style.animationDelay = '-' + (Math.random() * dur).toFixed(1) + 's';
    });
  }

  // ===== Conduction office (#14) opens Google Maps =====
  const MAPS_URL = 'https://maps.google.com/?q=Lauriergracht+14h+Amsterdam';
  function wireConductionHouse() {
    const house = root.querySelector('.house-conduction');
    if (!house) return;
    house.title = 'Conduction — Lauriergracht 14h, 1016 RL Amsterdam';
    house.addEventListener('click', () => window.open(MAPS_URL, '_blank', 'noopener'));
  }

  // ===== Drift-fleet templates =====
  // Cache a detached clone of each drift-boat SVG at page-load. Without this,
  // spawnBoat() would call querySelector('.ci-<type>') which returns null
  // once the original is sunk — and the spawn loop would go silent after
  // the player cleared the initial fleet.
  const DRIFT_TYPES = ['cruise', 'sloep', 'row', 'swim', 'hover', 'periscope', 'whale'];
  const driftTemplates = {};
  function captureDriftTemplates() {
    DRIFT_TYPES.forEach(type => {
      const el = root.querySelector('.ci-' + type);
      if (el && !driftTemplates[type]) driftTemplates[type] = el.cloneNode(true);
    });
  }

  const canalItems     = root.querySelector('.canal-items');
  const hud            = root.querySelector('.game-hud');
  const hudCounter     = root.querySelector('[data-counter]');
  const hudTimer       = root.querySelector('[data-timer]');
  const hudCounterBlock = root.querySelector('.hud-counter');
  const hudTimerBlock   = root.querySelector('.hud-timer');
  const goPanel        = root.querySelector('.game-over');
  const goTitle        = root.querySelector('[data-go-title]');
  const goSunk         = root.querySelector('[data-go-sunk]');
  const goRestart      = root.querySelector('[data-restart]');

  /* Product pages opt out of the boat-sinking mini-game by setting
     `themeConfig.minigames = false` in createConfig(); the Footer
     swizzle then doesn't render the .game-hud / .game-over / boat
     templates. The static decoration (trapgevel skyline, drift speeds,
     Conduction-house Maps link, drift-boat caches) is still wanted —
     run those first so a no-game build doesn't ship an empty .skyline.
     Then bail out before the game-only wiring rather than null-deref'ing
     on the missing HUD / restart-button. The script's `resize` handler
     re-runs buildSkyline() on viewport changes too, so the skyline
     stays full when a viewer resizes the window. */
  if (!hud || !goRestart || !goPanel) {
    buildSkyline();
    rollSpeeds();
    wireConductionHouse();
    captureDriftTemplates();
    const onResizeNoGame = () => {
      clearTimeout(window._canalNoGameResizeT);
      window._canalNoGameResizeT = setTimeout(() => {
        buildSkyline();
        rollSpeeds();
        wireConductionHouse();
      }, 200);
    };
    window.addEventListener('resize', onResizeNoGame);
    /* Mark hydrated and expose hydrate as a no-op (the IIFE's later
       `window.CanalFooter.hydrate = init` already handles the SPA
       re-mount path; we just need _cleanup to tear down the resize
       listener so it doesn't leak across SPA navigations. */
    window.CanalFooter = window.CanalFooter || {};
    window.CanalFooter.hydrate = window.CanalFooter.hydrate || function () {};
    window.CanalFooter._cleanup = function () {
      window.removeEventListener('resize', onResizeNoGame);
      clearTimeout(window._canalNoGameResizeT);
    };
    return;
  }

  let game;

  function newGameState() {
    return {
      started: false,
      over: false,
      score: 100,
      timeLeft: 60,
      sunkTotal: 0,
      swarmTriggered: false,
      bossTriggered: false,
      bossActive: false,
      timerInt: null,
      spawnTimer: null,
    };
  }
  game = newGameState();
  window.__minigame = game; // exposed for testing

  function updateHud() {
    hudCounter.textContent = String(Math.max(0, game.score));
    hudTimer.textContent   = String(Math.max(0, game.timeLeft));
    if (game.timeLeft <= 5 && game.started) hudTimerBlock.classList.add('urgent');
    else hudTimerBlock.classList.remove('urgent');
  }

  function flashCounter() {
    hudCounterBlock.classList.remove('tick');
    void hudCounterBlock.offsetWidth;
    hudCounterBlock.classList.add('tick');
  }

  function startGame() {
    if (game.started || game.over) return;
    game.started = true;
    hud.classList.add('active');
    updateHud();
    game.timerInt = setInterval(() => {
      if (game.over) return;
      game.timeLeft -= 1;
      updateHud();
      if (game.timeLeft <= 0) endGame(false);
    }, 1000);
    scheduleNextSpawn();
  }

  function endGame(victory) {
    if (game.over) return;
    game.over = true;
    if (game.timerInt) clearInterval(game.timerInt);
    if (game.spawnTimer) clearTimeout(game.spawnTimer);
    goTitle.textContent = victory ? 'Victory!' : "Time's up";
    goSunk.textContent = String(game.sunkTotal);
    goPanel.classList.add('show');
    hud.classList.remove('active');
    // Notify the gaming modal (if mounted) so it can update the cookie
    // and reveal the cross-site progress panel.
    window.dispatchEvent(new CustomEvent('connext:gameend', {
      detail: {
        id: 'boats',
        won: victory,
        score: game.sunkTotal,
        summary: game.sunkTotal + ' boat' + (game.sunkTotal === 1 ? '' : 's') + ' sunk',
      },
    }));
  }

  function resetGame() {
    if (game.timerInt) clearInterval(game.timerInt);
    if (game.spawnTimer) clearTimeout(game.spawnTimer);
    canalItems.querySelectorAll('.ci[data-spawned], .ci[data-sinking]').forEach(el => el.remove());
    game = newGameState();
    window.__minigame = game;
    hudTimerBlock.classList.remove('urgent');
    goPanel.classList.remove('show');
    updateHud();
    wireOriginalBoats();
    // Restart kicks off immediately — without this the player would face an
    // empty canal until the spawn loop produced its first boat.
    startGame();
  }
  goRestart.addEventListener('click', resetGame);
  /* The connext:gamereplay listener is bound near the bottom of init()
     so the cleanup handler can remove it on the next route change. */

  // ===== Pace knobs — driven by the further of (time elapsed) and (score lost) =====
  function progress() {
    const tTime  = game.started ? (60 - game.timeLeft) / 60 : 0;
    const tScore = (100 - game.score) / 100;
    return Math.max(tTime, tScore);
  }
  function getSpawnInterval() {
    if (game.bossActive) return 9999;
    return Math.max(140, 1400 - progress() * 1260);
  }
  function getSpeedMult() {
    return 1 + progress() * 4; // 1× → 5×
  }
  function getSpawnCount() {
    const s = game.score;
    if (s <= 10) return 3;
    if (s <= 40) return 2;
    return 1;
  }

  // ===== Spawn pool — bigger ships unlock as the score drops =====
  function pickSpawnType() {
    const s = game.score;
    const pool = [];
    pool.push({ type: 'sloep',     hp: 1, w: 4 });
    pool.push({ type: 'row',       hp: 1, w: 3 });
    pool.push({ type: 'swim',      hp: 1, w: 1 });
    pool.push({ type: 'hover',     hp: 1, w: 2 });
    pool.push({ type: 'periscope', hp: 1, w: 1 });
    pool.push({ type: 'whale',     hp: 1, w: 1 });
    pool.push({ type: 'cruise',    hp: 1, w: 2 });
    if (s <= 80) pool.push({ type: 'sailing', hp: 2, w: 3 });
    if (s <= 60) pool.push({ type: 'cargo',   hp: 3, w: 3 });
    if (s <= 40) pool.push({ type: 'frigate', hp: 4, w: 3 });
    if (s <= 20) pool.push({ type: 'cruise',  hp: 5, w: 2, boss: true });
    let total = 0;
    for (const x of pool) total += x.w;
    let r = Math.random() * total;
    for (const x of pool) {
      r -= x.w;
      if (r <= 0) return x;
    }
    return pool[0];
  }

  function scheduleNextSpawn() {
    if (game.over) return;
    const interval = getSpawnInterval();
    game.spawnTimer = setTimeout(() => {
      if (!game.over && !game.bossActive) {
        const count = getSpawnCount();
        for (let i = 0; i < count; i++) {
          const pick = pickSpawnType();
          spawnBoat(pick.type, { hp: pick.hp, boss: pick.boss });
        }
      }
      scheduleNextSpawn();
    }, interval);
  }

  // ===== Spawn a single boat (clone or template), drive drift via WAAPI =====
  function spawnBoat(type, opts) {
    opts = opts || {};
    let clone;
    if (type === 'battleship' || type === 'sailing' || type === 'cargo' || type === 'frigate') {
      const tplId = type === 'battleship' ? 'tpl-battleship' : ('tpl-ship-' + type);
      const tpl = document.getElementById(tplId);
      if (!tpl) return null;
      clone = tpl.content.firstElementChild.cloneNode(true);
    } else {
      // Drift-fleet types are cloned from the cached templates so the spawn
      // loop keeps working after the initial fleet has been sunk.
      const tmpl = driftTemplates[type];
      if (!tmpl) return null;
      clone = tmpl.cloneNode(true);
      clone.style.animation = 'none';
    }
    clone.dataset.spawned = '1';
    delete clone.dataset.wired;
    delete clone.dataset.sinking;

    if (opts.boss) {
      clone.classList.add('boss');
      // Cruise-boss = upscale the regular cruise SVG so it reads as bigger.
      if (type === 'cruise') {
        clone.setAttribute('width', '184');
        clone.setAttribute('height', '44');
      }
    }
    if (opts.hp && opts.hp > 1) {
      clone.dataset.hp = String(opts.hp);
      addHpPips(clone, opts.hp);
    }

    canalItems.appendChild(clone);

    // Stagger small-drift items vertically so they don't line up; bigger
    // hulled ships keep their template-prescribed waterline.
    if (!opts.boss && type !== 'cruise' && type !== 'sailing' && type !== 'cargo' && type !== 'frigate') {
      clone.style.bottom = (4 + Math.random() * 28) + 'px';
    } else if (type === 'sailing' || type === 'cargo' || type === 'frigate') {
      clone.style.bottom = '4px';
    }

    const w = window.innerWidth;
    const fromRight = Math.random() < 0.5;
    const startX = fromRight ? (w + 100) : -300;
    const endX   = fromRight ? -300 : (w + 100);
    const dur = (baseDurationFor(type, opts) * 1000) / getSpeedMult();
    const anim = clone.animate(
      [{ transform: 'translateX(' + startX + 'px)' },
       { transform: 'translateX(' + endX + 'px)' }],
      { duration: dur, easing: 'linear', fill: 'forwards' }
    );
    clone._anim = anim;
    anim.onfinish = () => { if (!clone.dataset.sinking) clone.remove(); };

    return clone;
  }

  function baseDurationFor(type, opts) {
    if (type === 'battleship') return 32;
    if (opts && opts.boss)     return 30; // cruise-boss
    if (type === 'cargo')      return 26;
    if (type === 'sailing')    return 22;
    if (type === 'frigate')    return 18;
    if (type === 'whale' || type === 'periscope') return 24;
    if (type === 'swim')       return 30;
    if (type === 'cruise')     return 22;
    if (type === 'sloep' || type === 'row') return 18;
    if (type === 'hover')      return 14;
    return 18;
  }

  // Pip row inside the ship's SVG — placed near the top of the viewBox so
  // they read as little orange "health" dots above the deck.
  function addHpPips(el, hp) {
    if (el.querySelector('.hp-pips')) return; // template already provides them
    const ns = 'http://www.w3.org/2000/svg';
    const vb = (el.getAttribute('viewBox') || '0 0 100 30').split(/\s+/).map(Number);
    const vx = vb[0], vy = vb[1], vw = vb[2];
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'hp-pips');
    const pipR = 1.6;
    const pipGap = 4.4;
    const totalW = (hp - 1) * pipGap;
    const startPx = vx + (vw - totalW) / 2;
    const py = vy + 2.6;
    for (let i = 0; i < hp; i++) {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('class', 'pip');
      c.setAttribute('cx', String(startPx + i * pipGap));
      c.setAttribute('cy', String(py));
      c.setAttribute('r', String(pipR));
      c.setAttribute('fill', 'var(--c-orange-knvb)');
      g.appendChild(c);
    }
    el.appendChild(g);
  }

  // ===== Click handling: damage on multi-HP, sink on HP→0 =====
  function onShipClick(el) {
    if (game.over || el.dataset.sinking) return;
    let hp = parseInt(el.dataset.hp || '1', 10);
    if (hp > 1) {
      hp -= 1;
      el.dataset.hp = String(hp);
      const pips = el.querySelectorAll('.hp-pips .pip');
      for (let i = pips.length - 1; i >= 0; i--) {
        if (!pips[i].classList.contains('hit')) {
          pips[i].classList.add('hit');
          break;
        }
      }
      el.classList.remove('damaged');
      void el.offsetWidth;
      el.classList.add('damaged');
      setTimeout(() => el.classList.remove('damaged'), 240);
      if (!game.started) startGame();
      return;
    }
    sinkBoat(el);
    onShipSunk();
  }

  function onShipSunk() {
    game.sunkTotal += 1;
    game.score = Math.max(0, game.score - 1);
    updateHud();
    flashCounter();
    if (!game.started && !game.over) startGame();
    if (game.score === 10 && !game.swarmTriggered) {
      game.swarmTriggered = true;
      triggerCruiseSwarm();
    }
    if (game.score === 1 && !game.bossTriggered) {
      game.bossTriggered = true;
      triggerBattleship();
    }
    if (game.score <= 0) endGame(true);
  }

  function triggerCruiseSwarm() {
    let i = 0;
    (function next() {
      if (game.over) return;
      spawnBoat('cruise', { boss: true, hp: 5 });
      i++;
      if (i < 5) setTimeout(next, 600);
    })();
  }

  function triggerBattleship() {
    game.bossActive = true;
    spawnBoat('battleship', { boss: true, hp: 10 });
  }

  // ===== Sink animation (drop + tilt + fade) =====
  function sinkBoat(el) {
    if (el.dataset.sinking) return;
    el.dataset.sinking = '1';
    let x = 0;
    try {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      x = m.m41 || 0;
    } catch (e) { /* keep x=0 */ }
    el.style.animation = 'none';
    if (el._anim) try { el._anim.cancel(); } catch (e) {}
    el.style.transform = 'translateX(' + x + 'px)';
    void el.offsetWidth;
    const dur = el.classList.contains('boss') ? 3000 : 2200;
    const anim = el.animate(
      [
        { transform: 'translateX(' + x + 'px) translateY(0) rotate(0deg)',     opacity: 1 },
        { transform: 'translateX(' + x + 'px) translateY(8px) rotate(5deg)',   opacity: 1, offset: 0.25 },
        { transform: 'translateX(' + x + 'px) translateY(40px) rotate(-7deg)', opacity: 0.5, offset: 0.7 },
        { transform: 'translateX(' + x + 'px) translateY(80px) rotate(15deg)', opacity: 0 }
      ],
      { duration: dur, easing: 'cubic-bezier(.4,.1,.7,.4)', fill: 'forwards' }
    );
    anim.finished.then(() => el.remove()).catch(() => {});
  }

  function wireOriginalBoats() {
    root.querySelectorAll('.canal-items .ci').forEach((b) => {
      if (b.dataset.wired) return;
      b.dataset.wired = '1';
      b.title = 'click to sink';
    });
  }

  /* ===== Hitting a boat =====
     Boats used to listen for 'click', which only fires when the pointer goes
     down AND up on the same element. At the 5× end of the ramp a boat covers
     roughly 60px during an ordinary 150ms press — more than the swimmer or
     the periscope is wide — so the mouseup landed on the water and the click
     was dispatched on the container instead: a shot that looked dead-on did
     nothing. Sinking on pointerdown fires the moment the button goes down,
     which is the moment the player aimed at, and it skips the touch-tap
     delay too.

     Delegating from the root also covers spawned boats without a listener
     each, and survives the clone-and-append the spawn loop does.

     MISS_SLOP forgives a near miss: hit-testing uses the position the main
     thread last laid out, while the compositor has already drawn a fast boat
     a few pixels further along, so an honest hit can land in the water. A
     pointerdown that hits nothing falls back to the nearest boat whose box is
     within this many pixels. Tune it from a real run — bigger is more
     forgiving, and at some point the late game stops biting. */
  const MISS_SLOP = 18;

  function boatNearPoint(x, y) {
    let best = null;
    let bestDist = Infinity;
    canalItems.querySelectorAll('.ci').forEach((el) => {
      if (el.dataset.sinking) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= MISS_SLOP && dist < bestDist) { bestDist = dist; best = el; }
    });
    return best;
  }

  function boatAtEvent(e) {
    const direct = e.target.closest && e.target.closest('.ci');
    if (direct) return direct;
    /* Only shots that hit nothing interactive get the slop, so a press on a
       footer link or on the game-over card can never sink a boat drifting
       past just above it. */
    if (e.target.closest && e.target.closest('a, button, .game-over')) return null;
    return boatNearPoint(e.clientX, e.clientY);
  }

  /* A finger resting on a boat while the page is scrolled must not sink it,
     and on touch there is no way to know that at pointerdown. So touch waits
     for pointerup and sinks only if the finger stayed put; mouse and pen fire
     straight away, which is the whole point of the change. */
  const TAP_SLOP = 12;
  let touchStart = null;

  function onCanalPointerDown(e) {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch') {
      const boat = boatAtEvent(e);
      touchStart = boat ? { id: e.pointerId, x: e.clientX, y: e.clientY, boat } : null;
      return;
    }
    const boat = boatAtEvent(e);
    if (!boat) return;
    e.preventDefault();
    /* Cancelling pointerdown suppresses the compatibility mousedown in some
       browsers, so blockGameSelection may never see this press. */
    clearStraySelection();
    onShipClick(boat);
  }

  function onCanalPointerUp(e) {
    if (!touchStart || e.pointerId !== touchStart.id) return;
    const moved = Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y);
    const boat = touchStart.boat;
    touchStart = null;
    /* The boat has drifted on since the tap began, so re-check what is under
       the finger now and fall back to what it started on. */
    if (moved <= TAP_SLOP) onShipClick(boatAtEvent(e) || boat);
  }

  function onCanalPointerCancel(e) {
    if (touchStart && e.pointerId === touchStart.id) touchStart = null;
  }

  /* ===== Sinking must never select or drag the footer =====
     Clicking fast means clicking while the mouse is still moving, so a press
     that was meant as a shot is a one-pixel drag. The water and the link
     columns are one text flow, so that drag anchors at the nearest text
     offset and highlights something — and then the real trap springs: press
     on text that is already selected, move a pixel, and the browser starts a
     native drag of that text. While it runs, every further click goes into
     the drag instead of into a boat, which is the "I can't click any more"
     part. The ghost of the dragged letter next to the cursor is that drag.

     Three rules kill it:
       1. Cancel the mousedown default across the footer, so a press in the
          canal or the link columns can never start a selection. Interactive
          elements are left alone so a click still focuses them, and the legal
          bar and the game-over card stay selectable — they sit away from the
          boats, so a selection there can't turn into a drag mid-game.
       2. Clear a stray selection on such a press. The browser normally
          collapses a selection on mousedown; rule 1 suppresses that, so
          without this an old highlight would sit in the footer for good.
       3. Refuse dragstart outright. Nothing in a footer is worth dragging,
          and this is the one that guarantees a burst of clicking can never
          lock itself out.
     None of it touches the click event, so links keep working. */
  const SELECTABLE = '.legal-bar, .game-over';
  const INTERACTIVE = 'a, button, input, textarea, select, label, [tabindex]';

  function blockGameSelection(e) {
    if (e.button !== 0) return;
    const t = e.target;
    if (!t.closest) return;
    const spared = t.closest(SELECTABLE) || t.closest(INTERACTIVE);
    if (spared && e.detail <= 1) return;
    e.preventDefault();
    clearStraySelection();
  }

  /* Drops a highlight the player never asked for. Anything they selected
     themselves in the legal bar or on the game-over card is left alone. */
  function clearStraySelection() {
    const sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const node = sel.anchorNode;
    const anchor = node && (node.nodeType === 1 ? node : node.parentElement);
    if (anchor && anchor.closest && anchor.closest(SELECTABLE)) return;
    sel.removeAllRanges();
  }

  function blockFooterDrag(e) {
    if (e.target.closest && e.target.closest(SELECTABLE)) return;
    e.preventDefault();
  }

    // ===== Bootstrap =====
    root.addEventListener('pointerdown', onCanalPointerDown);
    root.addEventListener('pointerup', onCanalPointerUp);
    root.addEventListener('pointercancel', onCanalPointerCancel);
    root.addEventListener('mousedown', blockGameSelection);
    root.addEventListener('dragstart', blockFooterDrag);
    buildSkyline();
    rollSpeeds();
    wireConductionHouse();
    captureDriftTemplates();
    wireOriginalBoats();
    updateHud();

    let resizeT;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => { buildSkyline(); rollSpeeds(); wireConductionHouse(); }, 200);
    };
    const onReplay = (e) => { if (e.detail?.id === 'boats') resetGame(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('connext:gamereplay', onReplay);

    /* Tear-down for the *previous* root: stop its timers and unhook
       its window listeners. Saved on the global so the next init()
       call can run it before binding fresh handlers. */
    window.CanalFooter._cleanup = function () {
      if (game.timerInt) clearInterval(game.timerInt);
      if (game.spawnTimer) clearTimeout(game.spawnTimer);
      clearTimeout(resizeT);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('connext:gamereplay', onReplay);
    };
  }

  window.CanalFooter = window.CanalFooter || {};
  window.CanalFooter.hydrate = init;
  init();
})();