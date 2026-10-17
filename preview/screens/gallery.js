/* ============================================================
   Screens gallery
   ------------------------------------------------------------
   Renders screens.json as sets, rows and tiles. Loaded by
   preview/screens/index.html (every set) and by a page that
   shows one set of its own, such as preview/openproject/.

   Configured through data attributes on the script tag:
     data-base        path from the page to preview/screens/
                      ("" on the gallery itself, "../screens/"
                      elsewhere); screens.json, board.html,
                      thumbnails and design-systems.html are
                      read from there
     data-set         show only this set (its id in screens.json);
                      without it every set is shown except the
                      ones that carry a `gallery` page of their own
     data-default-ds  design system to open in when the URL and
                      the stored choice name none

   The page supplies the elements the script fills: #sets,
   #loading, #q, #filter, #bs-filter, #open-all, #close-all,
   #count, #ds-seg, #ds-label, #m-screens, #m-rows, .meta.
   ============================================================ */
(function () {
  'use strict';

  var script = document.currentScript;
  var cfg = (script && script.dataset) || {};
  var BASE = cfg.base || '';
  var SET = cfg.set || null;
  var DEFAULT_DS = cfg.defaultDs || null;

  /* ---------- i18n: same contract as ../i18n.js, plus t() for runtime text ---------- */
  var params = new URLSearchParams(location.search);
  var LANG = (window.kitLang ? window.kitLang.lang : (params.get('lang') || 'nl')).toLowerCase();
  var DICT = null;
  function lookup(key) {
    if (!DICT) return null;
    /* i18n.nl.json uses flat dotted keys; nested objects work too */
    if (typeof DICT[key] === 'string') return DICT[key];
    var cur = DICT;
    var segs = key.split('.');
    for (var i = 0; i < segs.length; i++) { if (cur == null || typeof cur !== 'object') return null; cur = cur[segs[i]]; }
    return typeof cur === 'string' ? cur : null;
  }
  function t(key, fallback, vars) {
    var s = lookup(key) || fallback;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = lookup(el.getAttribute('data-i18n'));
      if (v == null) return;
      if (v.indexOf('<') !== -1 || v.indexOf('&') !== -1) el.innerHTML = v; else el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var p = pair.split(':').map(function (s) { return s.trim(); });
        var v = lookup(p[1]);
        if (v != null) el.setAttribute(p[0], v);
      });
    });
    document.documentElement.setAttribute('lang', LANG === 'en' ? 'en' : (DICT && DICT._lang) || LANG);
  }
  var dictReady = LANG === 'en'
    ? Promise.resolve()
    : fetch(BASE + '../i18n.' + LANG + '.json', { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (d) { DICT = d; applyStatic(); });
  function withLang(url) {
    if (window.kitLang) return window.kitLang.withLang(url);
    if (!params.get('lang')) return url;
    var i = url.indexOf('#');
    var path = i === -1 ? url : url.slice(0, i), frag = i === -1 ? '' : url.slice(i);
    return path + (path.indexOf('?') === -1 ? '?' : '&') + 'lang=' + encodeURIComponent(LANG) + frag;
  }
  document.querySelectorAll('a[data-keep-lang]').forEach(function (a) { a.href = withLang(a.getAttribute('href')); });

  /* ---------- storage, guarded ---------- */
  var ROWS_KEY = 'screens.rows';
  function loadRows() { try { return JSON.parse(localStorage.getItem(ROWS_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveRows(map) { try { localStorage.setItem(ROWS_KEY, JSON.stringify(map)); } catch (e) { /* ignore */ } }
  var rowState = loadRows();

  /* ---------- state ---------- */
  var S = null;            /* screens.json */
  var DS = null;           /* design-systems.json */
  var BS = null;           /* build-status.json, optional */
  var BSX = window.screensBuildStatus;
  var dsId = null;
  var rowsByKey = {};      /* key -> { set, row, el, rendered } */
  var anchorToBoard = {};  /* "portaliq-MijnZaken" -> board name */
  var SETS = [];           /* the sets this page shows */

  /* one chosen set, or every set that has no gallery page of its own */
  function pickSets() { return S.sets.filter(function (set) { return SET ? set.id === SET : !set.gallery; }); }
  function anchorOf(b) { return (b.id || (b.app + '/' + b.name)).replace(/\//g, '-'); }
  function rowKey(setId, rowId) { return setId + '/' + rowId; }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function boardHref(name) {
    var b = S.boards[name];
    var set = setById(b.set);
    var url = BASE + 'board.html?id=' + encodeURIComponent(b.id || name).replace(/%2F/g, '/');
    if (set && set.themable) url += '&ds=' + encodeURIComponent(dsId);
    return withLang(url);
  }
  function setById(id) { for (var i = 0; i < S.sets.length; i++) if (S.sets[i].id === id) return S.sets[i]; return null; }

  function shortCaps(caps) {
    if (!caps) return '';
    var list = String(caps).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (list.length <= 3) return list.join(', ');
    return list.slice(0, 3).join(', ') + ' ' + t('screens.tile.more', '+{n} more', { n: list.length - 3 });
  }

  function copyId(btn, text) {
    function done() {
      var old = btn.textContent;
      btn.textContent = t('screens.copied', 'Copied');
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
  }

  function idChip(id) {
    var btn = el('button', { type: 'button', text: t('screens.copy', 'Copy'), 'aria-label': t('screens.copyId', 'Copy screen id') + ' ' + id });
    btn.addEventListener('click', function (e) { e.preventDefault(); copyId(btn, id); });
    return el('span', { class: 'sc-id', title: t('screens.idTitle', 'Stable screen id') }, [el('code', { text: id }), btn]);
  }

  function tile(name, set, row) {
    var b = S.boards[name];
    var href = boardHref(name);
    var scale = Math.max((b.w || 1440) / 1440, 0.42);
    var img = el('img', { src: thumbFor(b), alt: '', loading: 'lazy', decoding: 'async', width: '480',
      height: String(Math.round(480 * (b.h || 900) / (b.w || 1440))), style: 'width: ' + Math.round(scale * 100) + '%' });
    var thumb = el('a', { class: 'thumb', href: href, tabindex: '-1', 'aria-hidden': 'true' }, [img]);
    img.addEventListener('error', function () {
      img.remove();
      thumb.insertBefore(el('span', { class: 'ph', text: t('screens.tile.noThumb', 'No thumbnail yet') }), thumb.firstChild);
    });
    if (set.themable) {
      thumb.appendChild(el('span', { class: 'hint' }, [el('span', { class: 'dot' }), el('span', { class: 'hint-name', text: dsShort(dsId) })]));
    }
    /* a shared part can sit in two rows; only its home row carries the anchor */
    var attrs = { class: 'sc-tile', 'data-board': name };
    if (!row || row.id === b.row) attrs.id = anchorOf(b);
    var art = el('article', attrs, [
      thumb,
      el('div', { class: 'meta' }, [
        el('a', { class: 'title', href: href, text: b.title || name }),
        b.caps ? el('p', { class: 'caps', text: shortCaps(b.caps), title: b.caps }) : null,
        bsTile(name),
        el('div', { class: 'foot' }, [idChip(b.id || name), el('span', { class: 'size', text: (b.w || '?') + ' × ' + (b.h || '?') })])
      ])
    ]);
    return art;
  }

  /* ---------- build status: badge per tile, progress line per row ---------- */
  function bsKind(name) { return BSX.kind(BS.boards[name]); }

  function bsTile(name) {
    if (!BS) return null;
    var row = BS.boards[name];
    var k = BSX.kind(row);
    var kids = [el('span', { class: 'sc-bs', 'data-bs': k, text: BSX.label(k, row, t) })];
    if (row && row.mismatchPct != null) {
      kids.push(el('span', { class: 'sc-bs-pct', text: t('screens.bs.pctShort', '{pct} off', { pct: BSX.pct(row.mismatchPct, LANG) }) }));
    }
    return el('div', { class: 'bs' }, kids);
  }

  function bsCounts(names) {
    var c = { n: 0, measured: 0, match: 0, built: 0, partial: 0, missing: 0 };
    names.forEach(function (n) {
      if (!S.boards[n]) return;
      c.n += 1;
      var k = bsKind(n);
      if (k === 'none') return;
      c.measured += 1;
      if (k === 'match') { c.match += 1; c.built += 1; }
      else if (k === 'differs') c.built += 1;
      else if (k === 'partial') c.partial += 1;
      else if (k === 'missing') c.missing += 1;
    });
    return c;
  }

  /* one segment per colour, each with its dot, then a bar in the same order */
  var BS_SEGS = [
    ['match', 'screens.bs.segMatch', '{n} match the board'],
    ['differs', 'screens.bs.segDiffers', '{n} built, layout differs'],
    ['partial', 'screens.bs.segPartial', '{n} partly built'],
    ['missing', 'screens.bs.segMissing', '{n} missing'],
    ['stateOf', 'screens.bs.segStateOf', '{n} state of another screen'],
    ['none', 'screens.bs.segNone', '{n} not measured yet']
  ];

  function bsSegments(c) {
    var counts = { match: c.match, differs: c.built - c.match, partial: c.partial, missing: c.missing };
    counts.stateOf = Math.max(0, c.measured - counts.match - counts.differs - counts.partial - counts.missing);
    counts.none = Math.max(0, c.n - c.measured);
    return BS_SEGS.map(function (s) { return { kind: s[0], n: counts[s[0]], text: t(s[1], s[2], { n: counts[s[0]] }) }; });
  }

  function bsSeg(kind, text) {
    return el('span', { class: 'bs-seg' }, [el('span', { class: 'bs-dot', 'data-bs': kind, 'aria-hidden': 'true' }), el('span', { text: text })]);
  }

  function bsRowLine(row) {
    if (!BS) return null;
    var c = bsCounts(row.boards);
    if (!c.measured) return null;
    var segs = bsSegments(c);
    var line = el('span', { class: 'bs-line' }, [el('span', { class: 'bs-seg', text: t('screens.bs.rowLead', '{n} screens:', { n: c.n }) })]);
    segs.forEach(function (s) { if (s.n) line.appendChild(bsSeg(s.kind, s.text)); });
    var bar = el('span', { class: 'bs-bar', 'aria-hidden': 'true' });
    segs.forEach(function (s) {
      if (!s.n || s.kind === 'none' || s.kind === 'stateOf') return;
      var b = el('span', { 'data-bs': s.kind }); b.style.width = (100 * s.n / c.n) + '%'; bar.appendChild(b);
    });
    return el('span', null, [line, bar]);
  }

  /* the colours explained once, under the page lede */
  function bsLegend() {
    if (!BS) return;
    var host = document.querySelector('.meta');
    if (!host || document.querySelector('.bs-legend')) return;
    var box = el('div', { class: 'bs-legend' }, [el('span', { class: 'bs-seg', text: t('screens.bs.legendLead', 'Build status colours:') })]);
    [['match', 'screens.bs.match', 'Built, layout matches'], ['differs', 'screens.bs.differs', 'Built, differs'], ['partial', 'screens.bs.partial', 'Partly'], ['missing', 'screens.bs.missing', 'Missing'], ['stateOf', 'screens.bs.stateOfAny', 'State of another screen'], ['none', 'screens.bs.none', 'Not measured yet']].forEach(function (k) {
      box.appendChild(bsSeg(k[0], t(k[1], k[2])));
    });
    host.parentNode.insertBefore(box, host.nextSibling);
  }

  function buildBsFilter() {
    var sel = document.getElementById('bs-filter');
    if (!BS) return;
    sel.hidden = false;
    document.querySelector('label[for="bs-filter"]').hidden = false;
    sel.appendChild(el('option', { value: '', text: t('screens.bs.filterAll', 'Any build status') }));
    BSX.KINDS.forEach(function (k) {
      var lbl = k === 'stateOf' ? t('screens.bs.stateOfAny', 'State of another screen') : BSX.label(k, null, t);
      sel.appendChild(el('option', { value: k, text: lbl }));
    });
  }

  /* a board drawn for one design system (mail in OpenProject) carries a thumbnail in that style */
  function thumbFor(b) { return BASE + ((b.thumbs && b.thumbs[dsId]) || b.thumb); }
  function dsShort(id) { return DS && DS.systems[id] ? DS.systems[id].short : id; }

  function renderRow(entry) {
    if (entry.rendered) return;
    var box = entry.el.querySelector('.tiles');
    var frag = document.createDocumentFragment();
    entry.row.boards.forEach(function (name) { if (S.boards[name]) frag.appendChild(tile(name, entry.set, entry.row)); });
    box.appendChild(frag);
    entry.rendered = true;
    applyFilters(true);
  }

  function buildSets() {
    var root = document.getElementById('sets');
    root.innerHTML = '';
    var nScreens = 0, nRows = 0, unique = {};
    SETS.forEach(function (set) {
      var head = el('header', null, [el('h2', { text: set.title })]);
      if (!set.themable) {
        head.appendChild(el('span', { class: 'sc-badge', text: t('screens.badge.own', 'Own house style') }));
        head.appendChild(el('a', { href: withLang(BASE + 'design-systems.html#' + set.id), text: t('screens.set.about', 'About this design system') }));
      } else {
        head.appendChild(el('span', { class: 'sub', text: t('screens.set.themable', 'Follows the design system you pick') }));
      }
      /* a page of one set names it in its own hero, so the set heading would repeat it */
      var sec = el('section', { class: 'sc-set', id: 'set-' + set.id, 'data-set': set.id }, [SET ? null : head]);
      if (!set.themable && DS && DS.systems[set.id]) {
        Object.keys(DS.systems[set.id].vars).forEach(function (k) { sec.style.setProperty(k, DS.systems[set.id].vars[k]); });
      }
      set.rows.forEach(function (row) {
        var key = rowKey(set.id, row.id);
        var count = row.boards.filter(function (n) { return S.boards[n]; }).length;
        nScreens += count; nRows += 1;
        var chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chev.setAttribute('viewBox', '0 0 24 24'); chev.setAttribute('class', 'chev'); chev.setAttribute('aria-hidden', 'true');
        chev.innerHTML = '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        var summary = el('summary', null, [chev, el('span', { class: 'rt' }, [document.createTextNode(row.title), row.blurb ? el('span', { class: 'blurb', text: row.blurb }) : null, bsRowLine(row)]),
          el('span', { class: 'app', text: row.app || set.id }),
          el('span', { class: 'n', text: t('screens.row.count', '{n} screens', { n: count }) })]);
        var det = el('details', { class: 'sc-row', id: 'row-' + set.id + '-' + row.id, 'data-key': key, 'data-app': row.app || set.id }, [summary, el('div', { class: 'tiles' })]);
        var entry = { set: set, row: row, el: det, rendered: false };
        rowsByKey[key] = entry;
        summary.addEventListener('click', function () {
          /* user action: remember the state this click leads to */
          rowState[key] = !det.open;
          saveRows(rowState);
        });
        det.addEventListener('toggle', function () { if (det.open) renderRow(entry); });
        if (rowState[key]) det.open = true;
        sec.appendChild(det);
        row.boards.forEach(function (n) { var b = S.boards[n]; if (b) { anchorToBoard[anchorOf(b)] = n; unique[n] = true; } });
      });
      root.appendChild(sec);
    });
    /* rows can repeat a shared part, so count unique boards */
    document.getElementById('m-screens').textContent = String(Object.keys(unique).length);
    document.getElementById('m-rows').textContent = String(nRows);
  }

  function buildFilter() {
    var sel = document.getElementById('filter');
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', text: t(SET ? 'screens.filter.allRows' : 'screens.filter.all', SET ? 'All rows' : 'All sets and rows') }));
    SETS.forEach(function (set) {
      if (SET) {
        set.rows.forEach(function (row) { sel.appendChild(el('option', { value: 'row:' + rowKey(set.id, row.id), text: row.title })); });
        return;
      }
      var g = el('optgroup', { label: set.title });
      g.appendChild(el('option', { value: 'set:' + set.id, text: t('screens.filter.wholeSet', 'All of {set}', { set: set.title }) }));
      if (set.rows.length > 1) set.rows.forEach(function (row) { g.appendChild(el('option', { value: 'row:' + rowKey(set.id, row.id), text: row.title })); });
      sel.appendChild(g);
    });
  }

  function buildSeg() {
    var seg = document.getElementById('ds-seg');
    seg.innerHTML = '';
    (DS.order || Object.keys(DS.systems)).forEach(function (id) {
      var sys = DS.systems[id];
      var dot = el('span', { class: 'dot' }); dot.style.background = sys.vars['--sc-primary'];
      var b = el('button', { type: 'button', 'data-ds': id, 'aria-pressed': String(id === dsId) }, [dot, document.createTextNode(sys.short)]);
      b.addEventListener('click', function () { setDs(id); });
      seg.appendChild(b);
    });
  }

  function setDs(id) {
    dsId = id;
    window.screensTheme.set(id);
    document.querySelectorAll('#ds-seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-ds') === id)); });
    var u = new URL(location.href); u.searchParams.set('ds', id); history.replaceState(null, '', u);
    document.querySelectorAll('.sc-tile').forEach(function (tl) {
      var name = tl.getAttribute('data-board');
      var href = boardHref(name);
      tl.querySelectorAll('a').forEach(function (a) { a.href = href; });
      var hn = tl.querySelector('.hint-name'); if (hn) hn.textContent = dsShort(id);
      var im = tl.querySelector('.thumb img'); if (im && S.boards[name]) im.src = thumbFor(S.boards[name]);
    });
  }

  /* ---------- search and filter ---------- */
  function matches(name, q) {
    if (!q) return true;
    var b = S.boards[name];
    var hay = [name, b.id, b.title, b.caps, b.note].join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function applyFilters(fromRender) {
    var q = document.getElementById('q').value.trim().toLowerCase();
    var f = document.getElementById('filter').value;
    var bf = BS ? document.getElementById('bs-filter').value : '';
    var shown = {};
    SETS.forEach(function (set) {
      var setShown = 0;
      var setOk = !f || f === 'set:' + set.id || f.indexOf('row:' + set.id + '/') === 0;
      set.rows.forEach(function (row) {
        var entry = rowsByKey[rowKey(set.id, row.id)];
        var rowOk = setOk && (f.indexOf('row:') !== 0 || f === 'row:' + rowKey(set.id, row.id));
        var hits = rowOk ? row.boards.filter(function (n) { return S.boards[n] && matches(n, q) && (!bf || bsKind(n) === bf); }) : [];
        var show = rowOk && hits.length > 0;
        entry.el.hidden = !show;
        if (show) { setShown += 1; hits.forEach(function (n) { shown[n] = true; }); }
        if (!fromRender && show && (q || bf || f.indexOf('row:') === 0) && !entry.el.open) { entry.el.open = true; }
        if (!fromRender && !q && !bf && f.indexOf('row:') !== 0) { entry.el.open = !!rowState[rowKey(set.id, row.id)]; }
        if (entry.rendered) {
          var hitSet = {}; hits.forEach(function (n) { hitSet[n] = true; });
          entry.el.querySelectorAll('.sc-tile').forEach(function (tl) { tl.hidden = !hitSet[tl.getAttribute('data-board')]; });
        }
        entry.el.querySelector('.n').textContent = q || bf
          ? t('screens.row.countOf', '{n} of {m} screens', { n: hits.length, m: row.boards.length })
          : t('screens.row.count', '{n} screens', { n: row.boards.length });
      });
      document.getElementById('set-' + set.id).hidden = setShown === 0;
    });
    document.getElementById('count').textContent = t('screens.count', '{n} screens shown', { n: Object.keys(shown).length });
  }

  var qTimer = null;
  document.getElementById('q').addEventListener('input', function () {
    clearTimeout(qTimer); qTimer = setTimeout(function () { applyFilters(false); }, 140);
  });
  document.getElementById('filter').addEventListener('change', function () { applyFilters(false); });
  document.getElementById('bs-filter').addEventListener('change', function () { applyFilters(false); });
  document.getElementById('open-all').addEventListener('click', function () {
    Object.keys(rowsByKey).forEach(function (k) { var e = rowsByKey[k]; if (!e.el.hidden) { e.el.open = true; rowState[k] = true; } });
    saveRows(rowState);
  });
  document.getElementById('close-all').addEventListener('click', function () {
    Object.keys(rowsByKey).forEach(function (k) { rowsByKey[k].el.open = false; rowState[k] = false; });
    saveRows(rowState);
  });

  /* ---------- anchors: #portaliq-MijnZaken, #portaliq (app), #row-<set>-<row> ---------- */
  /* An anchor for a set that moved to a gallery of its own (an OpenProject board, its app,
     or one of its rows under its old set) lands on that gallery, with the same anchor. */
  function movedTo(h) {
    if (SET) return null;
    for (var i = 0; i < S.sets.length; i++) {
      var set = S.sets[i];
      if (!set.gallery) continue;
      for (var j = 0; j < set.rows.length; j++) {
        var row = set.rows[j];
        if (row.app === h) return set.gallery + '#' + h;  /* the app anchor opens every row of the app there */
        if (h.replace(/^row-[^-]+-/, '') === row.id) return set.gallery + '#row-' + set.id + '-' + row.id;
        for (var k = 0; k < row.boards.length; k++) {
          var b = S.boards[row.boards[k]];
          if (b && anchorOf(b) === h) return set.gallery + '#' + h;
        }
      }
      if (h === 'set-' + set.id || h === set.id) return set.gallery;
    }
    return null;
  }
  function openHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) return;
    var moved = movedTo(h);
    if (moved) {
      var i = moved.indexOf('#');
      location.replace(withLang(BASE + (i === -1 ? moved : moved.slice(0, i))) + (i === -1 ? '' : moved.slice(i)));
      return;
    }
    var name = anchorToBoard[h];
    if (name) {
      var b = S.boards[name];
      var entry = rowsByKey[rowKey(b.set, b.row)];
      if (!entry) return;
      entry.el.hidden = false;
      entry.el.open = true;
      renderRow(entry);
      var tl = document.getElementById(h);
      if (tl) {
        tl.hidden = false;
        tl.classList.add('hit');
        setTimeout(function () { tl.classList.remove('hit'); }, 2400);
        tl.scrollIntoView({ block: 'center' });
      }
      return;
    }
    var first = null;
    Object.keys(rowsByKey).forEach(function (k) {
      var e = rowsByKey[k];
      if (e.el.getAttribute('data-app') === h || e.el.id === h) { e.el.open = true; renderRow(e); if (!first) first = e.el; }
    });
    if (!first) { var sec = document.getElementById('set-' + h); if (sec) first = sec; }
    if (first) first.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', openHash);

  /* ---------- boot ---------- */
  Promise.all([
    fetch(BASE + 'screens.json', { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    window.screensTheme.ready,
    dictReady,
    BSX ? BSX.load() : null,
    /* English gallery titles and board titles; screensI18n (theme.js) reads them next to itself */
    LANG === 'en' && window.screensI18n ? window.screensI18n.fetchJson('i18n/en/_gallery.json') : null,
    LANG === 'en' && window.screensI18n ? window.screensI18n.fetchJson('i18n/en/index.json') : null
  ]).then(function (res) {
    S = res[0]; DS = res[1]; BS = res[3];
    if (window.screensI18n) window.screensI18n.applyGallery(S, res[4], res[5]);
    Object.keys(S.boards).forEach(function (n) { S.boards[n].name = n; });
    SETS = pickSets();
    dsId = window.screensTheme.get() || (DS && DS.default) || 'conduction';
    /* a page with a default system of its own opens in it unless the URL or an earlier choice says otherwise */
    var stored = null;
    try { stored = localStorage.getItem('screens.ds'); } catch (e) { /* private mode */ }
    if (DEFAULT_DS && DS && DS.systems[DEFAULT_DS] && !params.get('ds') && !stored) {
      dsId = DEFAULT_DS;
      window.screensTheme.set(dsId);
    }
    if (DS) buildSeg();
    buildFilter();
    buildBsFilter();
    bsLegend();
    buildSets();
    applyFilters(true);
    Object.keys(rowsByKey).forEach(function (k) { if (rowsByKey[k].el.open) renderRow(rowsByKey[k]); });
    openHash();
  }).catch(function (err) {
    document.getElementById('loading').textContent = t('screens.error', 'Could not load the screens index.') + ' (' + err.message + ')';
  });
})();
