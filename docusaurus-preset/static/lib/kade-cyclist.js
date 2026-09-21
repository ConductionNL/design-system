/* Kade Cyclist: hidden minigame on the canal-footer kade strip. First
   click on a drifting kade bike clears the ambient kade traffic, widens
   the quay to three lanes, drops the player cyclist under the blue
   Conduction house in the skyline, and starts a slow-then-ramping dodge
   round.

   The quay is laid out like a real Dutch one. On top, a grey road lane
   carrying motor traffic (car -> bus -> truck -> tram) right to left,
   noticeably faster than anything on a bike. Below it, a two-way bike
   path: the upper half runs right to left, the lower half runs left to
   right. Sprites are all drawn facing right and the stylesheet mirrors
   the right-to-left ones, so every rider faces the way they are going. Bikes are weighted to stay the most
   common thing on the strip at every difficulty. Arrivals are Poisson
   rather than metronomic and mostly single riders, with the occasional
   pack when a light upstream lets one go, so the strip bunches up and
   goes quiet again the way a real one does.

   Up/W and Down/S step one lane at a time. A spawn is only placed when
   at least one other lane stays clear for the whole time the new hazard
   covers the player's x, so the round is always survivable. Collision
   ends the round, fires `connext:gameend` on window so the GameModal
   picks it up, and the modal's "Play again" button fires
   `connext:gamereplay` which we listen for to re-run the round. The
   ambient kade is restored when the round ends. */
(function () {
  /* Lanes, top to bottom. 'road' is the fast motor lane; 'mid' and
     'bottom' are the two halves of the bike path. The row geometry and
     the per-direction sprite mirroring live in kade-cyclist.css — keep
     the two files in step. */
  const LANES = ['road', 'mid', 'bottom'];
  const START_LANE_INDEX = 2;          // lower half of the bike path

  /* -1 drifts right to left, +1 left to right. Only the lower half of
     the bike path runs the other way; motor traffic keeps coming at
     the player head-on. */
  const LANE_DIR = { road: -1, mid: -1, bottom: 1 };
  /* Motor traffic drifts faster than bike traffic — that is the whole
     trade of the road lane: emptier, but far less time to read. */
  const LANE_SPEED = { road: 1.6, mid: 1, bottom: 1 };
  /* Spawn share per lane. The two halves of the bike path together take
     ~3/4 of all beats, which is what keeps cyclists frequent. */
  const LANE_WEIGHT = { road: 2, mid: 3, bottom: 3 };

  const PLAYER_COLLISION_X_TOL = 22;   // px tolerance around the player x
  const HAZARD_BASE_MS = 5200;         // very slow first hazards (drift duration)
  const HAZARD_FLOOR_MS = 2100;        // cap at hardest difficulty — also what
                                       // keeps the fastest road traffic inside a
                                       // couple of rAF frames of the player
  const SPAWN_INITIAL_MS = 1900;       // mean gap between the first beats
  const SPAWN_FLOOR_MS = 520;          // cap at hardest mean gap
  const REACTION_MARGIN_MS = 220;      // slack the escape lane must stay clear

  /* Geometry shared with kade-cyclist.css: a hazard starts SPAWN_OFFSET
     px past the edge it enters from, and the kc-drift-l / kc-drift-r
     keyframes carry it 100vw + TRAVEL_EXTRA px across. Both numbers are
     duplicated in the stylesheet. */
  const SPAWN_OFFSET = 96;
  const TRAVEL_EXTRA = 260;

  /* Difficulty: each kind unlocks at a fixed dodge count and then keeps
     a fixed spawn weight within its lane group. Bikes outweigh
     everything else on the path; cars carry the road lane. The speed
     and spawn multipliers grow continuously per dodge on top. Dodges
     come in faster than they used to now that hazards arrive in groups,
     so the unlock counts are spaced to match. */
  const BIKE_KINDS = [
    { kind: 'bike',    at: 0,  weight: 7 },
    { kind: 'scooter', at: 12, weight: 3 },
    { kind: 'cargo',   at: 24, weight: 2 },
  ];
  const ROAD_KINDS = [
    { kind: 'car',   at: 8,  weight: 6 },
    { kind: 'bus',   at: 28, weight: 2 },
    { kind: 'truck', at: 42, weight: 2 },
    { kind: 'tram',  at: 58, weight: 1 },
  ];

  /* How many ride together on a given beat. Most arrivals are a single
     rider; pairs are common; now and then a light upstream lets a whole
     pack go at once, and that — not every beat — is where groups come
     from. GROUP_MAX caps it per kind, because trams do not travel in
     fours. */
  const GROUP_ODDS = [
    { size: [1, 1], weight: 62 },
    { size: [2, 2], weight: 24 },
    { size: [3, 5], weight: 14 },
  ];
  const GROUP_MAX = {
    bike: 5, scooter: 3, cargo: 2,
    car: 2, bus: 1, truck: 1, tram: 1,
  };
  /* Px gap between riders in a group. A pack released together rides
     close; two that merely share a beat are strung out. */
  const GAP_PACK  = [14, 38];
  const GAP_LOOSE = [34, 78];
  /* Odds that a rider after the first in a group is something else off
     the same lane's table — a scooter in among the bikes. Packs are
     rarely all one thing. */
  const MIX_CHANCE = 0.25;
  /* Shape of the gap between beats, as fractions of the current mean.
     See headwayGap. */
  const BEAT_MIN_FRACTION = 0.35;      // shortest headway traffic will close to
  const BEAT_MAX_FACTOR = 4;           // longest lull before the strip refills

  /* Sprite widths, needed before the element is in the DOM so the
     fairness check can run on a hazard we may still discard. Must match
     the width attributes in buildHazardSvg. */
  const HAZARD_W = {
    bike: 22, scooter: 22, cargo: 34,
    car: 38, bus: 58, truck: 68, tram: 80,
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Weighted pick over the kinds unlocked at this score. Returns null
     when the group has nothing unlocked yet (the road lane, early on). */
  function pickKind(table, score) {
    let total = 0;
    for (let i = 0; i < table.length; i++) {
      if (score >= table[i].at) total += table[i].weight;
    }
    if (total <= 0) return null;
    let r = Math.random() * total;
    for (let i = 0; i < table.length; i++) {
      if (score < table[i].at) continue;
      r -= table[i].weight;
      if (r <= 0) return table[i].kind;
    }
    return null;
  }

  /* Roll how many ride this beat. Weighted so most beats are a single
     rider and a pack is the exception. */
  function rollGroupSize() {
    let total = 0;
    for (let i = 0; i < GROUP_ODDS.length; i++) total += GROUP_ODDS[i].weight;
    let r = Math.random() * total;
    for (let i = 0; i < GROUP_ODDS.length; i++) {
      r -= GROUP_ODDS[i].weight;
      if (r <= 0) return randInt(GROUP_ODDS[i].size[0], GROUP_ODDS[i].size[1]);
    }
    return 1;
  }

  /* Gap to the next beat, drawn as a shifted exponential: a minimum
     headway nobody closes past, plus an exponential tail. That is how
     traffic headways actually distribute, and unlike clamping a plain
     exponential it leaves no pile-up of draws sitting exactly on the
     floor. Beats bunch and then go quiet on their own; the mean is
     preserved, and the tail is capped so the strip never stalls. */
  function headwayGap(meanMs) {
    const min = meanMs * BEAT_MIN_FRACTION;
    const g = min - Math.log(1 - Math.random()) * (meanMs - min);
    return Math.min(g, meanMs * BEAT_MAX_FACTOR);
  }

  /* Lane order for one spawn beat: a weighted draw without replacement,
     so a lane rejected by the fairness check falls through to the
     next-likeliest rather than dropping the beat outright. */
  function laneOrder() {
    const pool = LANES.slice();
    const out = [];
    while (pool.length) {
      let total = 0;
      for (let i = 0; i < pool.length; i++) total += LANE_WEIGHT[pool[i]];
      let r = Math.random() * total;
      let picked = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        r -= LANE_WEIGHT[pool[i]];
        if (r <= 0) { picked = i; break; }
      }
      out.push(pool.splice(picked, 1)[0]);
    }
    return out;
  }

  /* Inline SVG library. Kept in JS so the runtime doesn't depend on the
     host page's <template> blocks. Sizes match the lane row's 16px
     content height; viewBoxes leave a small bleed above for handlebars,
     poles, and exhaust. Every sprite is drawn facing right; the
     stylesheet mirrors the ones riding the other way. */
  function buildHazardSvg(kind) {
    if (kind === 'bike') {
      return (
        '<svg class="kc-hazard-svg kc-hk-bike" width="22" height="16" viewBox="0 -2 22 18" aria-hidden="true">' +
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
    if (kind === 'scooter') {
      return (
        '<svg class="kc-hazard-svg kc-hk-scooter" width="22" height="16" viewBox="0 -2 22 18" aria-hidden="true">' +
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
    if (kind === 'cargo') {
      /* Bakfiets — the wide one. Long enough that it has to be read
         early, and it is still a bicycle, so it belongs on the path. */
      return (
        '<svg class="kc-hazard-svg kc-hk-cargo" width="34" height="16" viewBox="0 -2 34 18" aria-hidden="true">' +
          '<g stroke="#0A172F" stroke-width="1.4" fill="none" stroke-linecap="round">' +
            '<circle cx="5" cy="12" r="3"/>' +
            '<circle cx="29" cy="12" r="3"/>' +
            '<line x1="5" y1="12" x2="29" y2="12"/>' +
            '<line x1="29" y1="12" x2="25" y2="6"/>' +
            '<line x1="25" y1="6" x2="25" y2="3"/>' +
            '<line x1="25" y1="3" x2="28" y2="6"/>' +
          '</g>' +
          '<path d="M 3,11 L 4,4 L 19,4 L 19,11 Z" fill="#C8482F" stroke="#0A172F" stroke-width="1" stroke-linejoin="round"/>' +
          '<circle cx="25" cy="1.5" r="1.6" fill="#0A172F"/>' +
        '</svg>'
      );
    }
    if (kind === 'car') {
      return (
        '<svg class="kc-hazard-svg kc-hk-car" width="38" height="16" viewBox="0 0 38 16" aria-hidden="true">' +
          '<rect x="0" y="6" width="38" height="6" rx="2" fill="#0A172F"/>' +
          '<path d="M 5,6 L 9,2 L 29,2 L 33,6 Z" fill="#0A172F"/>' +
          '<rect x="11" y="3" width="6" height="3" fill="rgba(255,255,255,0.4)"/>' +
          '<rect x="20" y="3" width="6" height="3" fill="rgba(255,255,255,0.4)"/>' +
          '<circle cx="9" cy="13" r="2" fill="#C8482F"/>' +
          '<circle cx="29" cy="13" r="2" fill="#C8482F"/>' +
        '</svg>'
      );
    }
    if (kind === 'bus') {
      /* GVB-style city bus, side profile. Cobalt body, white windows. */
      return (
        '<svg class="kc-hazard-svg kc-hk-bus" width="58" height="16" viewBox="0 -1 58 17" aria-hidden="true">' +
          '<rect x="0" y="2" width="58" height="11" rx="2" fill="#21468B"/>' +
          '<rect x="2" y="4" width="6" height="4" fill="rgba(255,255,255,0.85)"/>' +
          '<rect x="10" y="4" width="6" height="4" fill="rgba(255,255,255,0.85)"/>' +
          '<rect x="18" y="4" width="6" height="4" fill="rgba(255,255,255,0.85)"/>' +
          '<rect x="26" y="4" width="6" height="4" fill="rgba(255,255,255,0.85)"/>' +
          '<rect x="34" y="4" width="6" height="4" fill="rgba(255,255,255,0.85)"/>' +
          '<rect x="42" y="4" width="6" height="4" fill="rgba(255,255,255,0.85)"/>' +
          '<rect x="50" y="4" width="6" height="4" fill="rgba(255,255,255,0.85)"/>' +
          '<rect x="50" y="9" width="6" height="2" fill="#F77F0E"/>' +
          '<circle cx="10" cy="13" r="2" fill="#0A172F"/>' +
          '<circle cx="48" cy="13" r="2" fill="#0A172F"/>' +
        '</svg>'
      );
    }
    if (kind === 'truck') {
      /* Cab + container, two sets of wheels. Cobalt cab, white box. */
      return (
        '<svg class="kc-hazard-svg kc-hk-truck" width="68" height="16" viewBox="0 0 68 16" aria-hidden="true">' +
          '<rect x="0" y="3" width="42" height="9" fill="#FFFFFF" stroke="#0A172F" stroke-width="0.8"/>' +
          '<rect x="42" y="5" width="20" height="7" fill="#21468B"/>' +
          '<path d="M 62,5 L 66,8 L 62,8 Z" fill="#21468B"/>' +
          '<rect x="46" y="6" width="6" height="3" fill="rgba(255,255,255,0.5)"/>' +
          '<circle cx="8" cy="13" r="2" fill="#0A172F"/>' +
          '<circle cx="22" cy="13" r="2" fill="#0A172F"/>' +
          '<circle cx="50" cy="13" r="2" fill="#0A172F"/>' +
          '<circle cx="60" cy="13" r="2" fill="#0A172F"/>' +
        '</svg>'
      );
    }
    /* tram — GVB Amsterdam, blue body with yellow band, overhead pole */
    return (
      '<svg class="kc-hazard-svg kc-hk-tram" width="80" height="16" viewBox="0 -3 80 19" aria-hidden="true">' +
        '<line x1="40" y1="-3" x2="40" y2="2" stroke="#3A3F4B" stroke-width="0.8"/>' +
        '<rect x="0" y="2" width="80" height="11" rx="1" fill="#21468B"/>' +
        '<rect x="0" y="9" width="80" height="2" fill="#F4D04A"/>' +
        '<rect x="2" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="9" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="16" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="23" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="32" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="39" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="46" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="53" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="60" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="67" y="4" width="5" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<rect x="74" y="4" width="4" height="4" fill="rgba(255,255,255,0.9)"/>' +
        '<circle cx="14" cy="13" r="1.6" fill="#0A172F"/>' +
        '<circle cx="22" cy="13" r="1.6" fill="#0A172F"/>' +
        '<circle cx="58" cy="13" r="1.6" fill="#0A172F"/>' +
        '<circle cx="66" cy="13" r="1.6" fill="#0A172F"/>' +
      '</svg>'
    );
  }

  /* Player bike: like the ki-bike-1 outline but with an orange jersey
     so it reads as the player tile, not ambient traffic. */
  function buildPlayerSvg() {
    return (
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
      '</svg>'
    );
  }

  function findRoot() { return document.querySelector('.canal-footer'); }

  /* Per-root state stash so the connext:gamereplay listener can find
     the right root and tear-down can restore the ambient items. */
  const ACTIVE = new WeakMap();

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
      startGame(root, kade);
    };
    kade.addEventListener('click', onBikeClick, true);

    /* Modal "Play again" → re-run the round. */
    window.addEventListener('connext:gamereplay', function (e) {
      if (e.detail && e.detail.id === 'kade-cyclist') {
        if (root.dataset.kadeActive === '1') tearDownActive(root, kade);
        setTimeout(function () { startGame(root, kade); }, 80);
      }
    });
    /* Modal "Close" → tear down the game stage and restore ambient. */
    window.addEventListener('connext:gameclose', function (e) {
      if (e.detail && e.detail.id === 'kade-cyclist') {
        if (root.dataset.kadeActive === '1') tearDownActive(root, kade);
      }
    });
  }

  function startGame(root, kade) {
    root.dataset.kadeActive = '1';

    /* Clear the ambient kade — actually remove the items, not just
       pause them, so the field reads as a clean playfield. We stash
       the cleared markup on the kade-items container so tearDown can
       restore it. */
    const kadeItems = kade.querySelector('.kade-items');
    const ambientHTML = kadeItems ? kadeItems.innerHTML : '';
    if (kadeItems) kadeItems.innerHTML = '';

    /* Compute player x: align under the blue Conduction house in the
       skyline. The skyline is randomised at every page load by canal-
       footer.js but always marks the middle house with .house-
       conduction, so the player ends up near the centre of the strip —
       which is what gives both directions of the bike path a runway.
       The fallback keeps that centring if the skyline isn't built yet. */
    const blueHouse = root.querySelector('.house-conduction');
    const rootRect = root.getBoundingClientRect();
    let playerCenterX;
    if (blueHouse) {
      const r = blueHouse.getBoundingClientRect();
      playerCenterX = (r.left + r.width / 2) - rootRect.left;
    } else {
      playerCenterX = rootRect.width * 0.5;
    }

    const stage = document.createElement('div');
    stage.className = 'kc-stage';
    stage.innerHTML =
      '<div class="kc-track" data-track>' +
        '<div class="kc-lane kc-lane-road" data-lane="road"></div>' +
        '<div class="kc-lane kc-lane-mid" data-lane="mid"></div>' +
        '<div class="kc-lane kc-lane-bottom" data-lane="bottom"></div>' +
        '<div class="kc-player" data-player>' + buildPlayerSvg() + '</div>' +
      '</div>' +
      '<div class="kc-hud">' +
        '<div class="kc-score-block"><span class="kc-score-num" data-score>0</span><span class="kc-score-label">Score</span></div>' +
        '<div class="kc-controls" aria-hidden="true">' +
          '<kbd>&uarr;</kbd>/<kbd>W</kbd> &middot; <kbd>&darr;</kbd>/<kbd>S</kbd>' +
        '</div>' +
        '<button type="button" class="kc-close" data-close aria-label="Stop spel">&times;</button>' +
      '</div>';
    kade.appendChild(stage);

    const trackEl = stage.querySelector('[data-track]');
    const playerEl = stage.querySelector('[data-player]');
    const scoreSpan = stage.querySelector('[data-score]');
    const closeBtn = stage.querySelector('[data-close]');

    /* Position the player centred on the blue-house x. CSS has the
       player at left: var(--kc-player-x). */
    stage.style.setProperty('--kc-player-x', (playerCenterX - 11) + 'px');

    let laneIdx = START_LANE_INDEX;
    playerEl.dataset.lane = LANES[laneIdx];

    let score = 0;
    let speedMul = 1;
    let spawnTimer = null;
    let rafId = null;
    let over = false;
    const hazards = [];
    const startTime = performance.now();

    function stepLane(delta) {
      if (over) return;
      const next = clamp(laneIdx + delta, 0, LANES.length - 1);
      if (next === laneIdx) return;
      laneIdx = next;
      playerEl.dataset.lane = LANES[laneIdx];
    }

    /* The [t0, t1] window, on the performance.now() clock, in which a
       hazard's body covers the player's x. Everything it needs is fixed
       at spawn — the drift is linear and the player never moves in x —
       so it is computed once and reused by the fairness check. */
    function blockWindow(entry) {
      const centreAtSpawn = entry.dir < 0
        ? entry.trackW + SPAWN_OFFSET - entry.w / 2
        : entry.w / 2 - SPAWN_OFFSET;
      const pass = (playerCenterX - centreAtSpawn) / (entry.dir * entry.travel);
      const centreT = entry.startedAt + pass * entry.durationMs;
      const half = (entry.tol / entry.travel) * entry.durationMs;
      return [centreT - half, centreT + half];
    }

    /* A spawn is only allowed when at least one lane other than the
       candidate's stays clear for the whole time the candidate covers
       the player's x, plus a reaction margin on both sides. Without
       this, three lanes of traffic close into unavoidable walls. Riders
       sharing the candidate's own lane are not a problem, which is what
       lets a group ride together. */
    function hasEscapeLane(candidate) {
      for (let i = 0; i < LANES.length; i++) {
        const lane = LANES[i];
        if (lane === candidate.lane) continue;
        let clear = true;
        for (let j = 0; j < hazards.length; j++) {
          const h = hazards[j];
          if (h.lane !== lane) continue;
          if (h.win[0] - REACTION_MARGIN_MS < candidate.win[1] &&
              h.win[1] + REACTION_MARGIN_MS > candidate.win[0]) {
            clear = false;
            break;
          }
        }
        if (clear) return true;
      }
      return false;
    }

    /* One beat places one group in one lane — usually a single rider,
       sometimes a pack. Riders after the first are held back by an
       animation-delay worth the px gap to the one ahead, so they sit
       off-screen until their turn and the group keeps its spacing
       whatever the lane's drift speed is. */
    function spawnHazard() {
      if (over) return;
      const trackW = trackEl.clientWidth;
      const travel = window.innerWidth + TRAVEL_EXTRA;
      const now = performance.now();
      const order = laneOrder();

      for (let i = 0; i < order.length; i++) {
        const lane = order[i];
        const table = lane === 'road' ? ROAD_KINDS : BIKE_KINDS;
        const kind = pickKind(table, score);
        if (!kind) continue;            // road lane not open at this score yet
        const dir = LANE_DIR[lane];
        const base = clamp(HAZARD_BASE_MS / speedMul, HAZARD_FLOOR_MS, HAZARD_BASE_MS);
        const dur = base / LANE_SPEED[lane];
        const count = Math.min(rollGroupSize(), GROUP_MAX[kind]);
        const gapRange = count >= 3 ? GAP_PACK : GAP_LOOSE;

        let delay = 0;
        let placed = 0;
        let aheadW = 0;
        for (let n = 0; n < count; n++) {
          /* A pack is rarely all one thing — let a rider or two in it be
             something else off the same lane's table. */
          let memberKind = kind;
          if (n > 0 && Math.random() < MIX_CHANCE) {
            const alt = pickKind(table, score);
            if (alt) memberKind = alt;
          }
          const w = HAZARD_W[memberKind];
          /* Use the hazard's own width as the X tolerance so a tram is
             harder to dodge late than a bike — generous gameplay while
             still rewarding swap timing. Mirrors checkCollisions. */
          const tol = Math.max(PLAYER_COLLISION_X_TOL, w / 2 + 6);
          /* Space this one off the rider ahead of it, not off itself. */
          if (n > 0) {
            const gapPx = aheadW + randInt(gapRange[0], gapRange[1]);
            delay += (gapPx / travel) * dur;
          }
          aheadW = w;
          const entry = {
            el: null, lane: lane, kind: memberKind, dir: dir, w: w, tol: tol,
            trackW: trackW, travel: travel,
            startedAt: now + delay, durationMs: dur, scored: false,
          };
          entry.win = blockWindow(entry);
          /* Cut the group short rather than drop it — the riders already
             placed are dodgeable, this one would have walled it in. */
          if (!hasEscapeLane(entry)) break;
          placeHazard(entry, delay);
          placed++;
        }
        if (placed) return;
      }
      /* Every lane would have walled the player in — skip this beat
         rather than spawn something undodgeable. */
    }

    function placeHazard(entry, delay) {
      const hazard = document.createElement('div');
      hazard.className = 'kc-hazard';
      hazard.dataset.lane = entry.lane;
      hazard.dataset.kind = entry.kind;
      hazard.dataset.dir = entry.dir < 0 ? 'l' : 'r';
      hazard.innerHTML = buildHazardSvg(entry.kind);
      hazard.style.animationDuration = entry.durationMs + 'ms';
      if (delay) hazard.style.animationDelay = delay + 'ms';
      entry.el = hazard;
      trackEl.appendChild(hazard);
      hazards.push(entry);
      hazard.addEventListener('animationend', function () {
        hazard.remove();
        const idx = hazards.indexOf(entry);
        if (idx >= 0) hazards.splice(idx, 1);
      });
    }

    function scheduleSpawn() {
      if (over) return;
      const mean = clamp(SPAWN_INITIAL_MS / speedMul, SPAWN_FLOOR_MS, SPAWN_INITIAL_MS);
      const interval = headwayGap(mean);
      spawnTimer = setTimeout(function () {
        spawnHazard();
        scheduleSpawn();
      }, interval);
    }

    function scoreDodge() {
      score++;
      scoreSpan.textContent = String(score);
      /* Smooth ramp: per dodge bump speed and spawn rate. The clamp in
         the spawn / drift duration formulas caps it. */
      speedMul = clamp(speedMul + 0.022, 1, 2.6);
    }

    function checkCollisions() {
      if (over) return;
      const trackRect = trackEl.getBoundingClientRect();
      const playerRect = playerEl.getBoundingClientRect();
      const playerCx = playerRect.left + playerRect.width / 2 - trackRect.left;
      const lane = LANES[laneIdx];
      for (let i = 0; i < hazards.length; i++) {
        const h = hazards[i];
        const hr = h.el.getBoundingClientRect();
        const hazardCx = hr.left + hr.width / 2 - trackRect.left;
        /* Credit the dodge the moment the hazard is fully past the
           player — whichever side it leaves on — rather than when it
           leaves the screen, so the difficulty ramp answers the
           player's last move. */
        const passed = h.dir < 0
          ? (hazardCx + h.tol < playerCx)
          : (hazardCx - h.tol > playerCx);
        if (!h.scored && passed) {
          h.scored = true;
          scoreDodge();
          continue;
        }
        if (h.scored) continue;
        if (h.lane !== lane) continue;
        if (Math.abs(hazardCx - playerCx) < h.tol) {
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
      hazards.forEach(function (h) { h.el.style.animationPlayState = 'paused'; });
      playerEl.classList.add('crashed');
      const elapsedSec = Math.round((performance.now() - startTime) / 1000);
      /* Fire on window so the GameModal picks it up. The modal handles
         the win/loss copy + replay button. */
      window.dispatchEvent(new CustomEvent('connext:gameend', {
        detail: {
          id: 'kade-cyclist',
          won: false,
          score: score,
          summary: score + ' dodges · ' + elapsedSec + 's',
          title: 'Bots.',
          subtitle: 'You crashed on the kade. Try again — the bike path runs both ways, and the road above it is emptier but everything on it comes at you faster.',
        }
      }));
    }

    function tearDown() {
      tearDownActive(root, kade);
    }

    function onKey(e) {
      if (e.key === 'Escape') { tearDown(); return; }
      if (over) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { stepLane(-1); e.preventDefault(); }
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { stepLane(1); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    closeBtn.addEventListener('click', tearDown);

    ACTIVE.set(root, {
      ambientHTML: ambientHTML,
      stage: stage,
      onKey: onKey,
      cleanup: function () {
        if (spawnTimer) clearTimeout(spawnTimer);
        if (rafId) cancelAnimationFrame(rafId);
        over = true;
      },
    });

    if (reduceMotion) speedMul = 1.4;

    /* Start the round. */
    scheduleSpawn();
    rafId = requestAnimationFrame(checkCollisions);
  }

  function tearDownActive(root, kade) {
    const state = ACTIVE.get(root);
    if (!state) return;
    if (state.cleanup) state.cleanup();
    if (state.onKey) document.removeEventListener('keydown', state.onKey);
    if (state.stage && state.stage.parentNode) state.stage.parentNode.removeChild(state.stage);
    /* Restore the ambient kade items. */
    const kadeItems = kade.querySelector('.kade-items');
    if (kadeItems && state.ambientHTML) kadeItems.innerHTML = state.ambientHTML;
    delete root.dataset.kadeActive;
    ACTIVE.delete(root);
  }

  window.KadeCyclist = window.KadeCyclist || {};
  window.KadeCyclist.hydrate = hydrate;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
