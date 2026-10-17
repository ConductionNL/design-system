/* ============================================================
   Screens theme runtime
   ------------------------------------------------------------
   Loaded by every board document (boards/<Name>.html links
   ../theme.js) and by the gallery pages in preview/screens/.

   1. Picks the design system: ?ds= in the URL, else the last
      choice in localStorage ("screens.ds"), else the default
      from design-systems.json ("conduction").
   2. Fetches design-systems.json next to this script.
   3. Sets every --sc-* variable on :root, loads the system's
      Google Fonts and sets --sc-font / --sc-font-heading.
   4. Swaps the src of every <img data-sc-logo="logo|logo-wit|
      emblem|emblem-grijs"> to that system's logo file.

   Boards only use the variables for the Zuiddrecht set, where
   build.py replaced the colour literals with var(--sc-role,
   literal). School boards carry no variables, so the theme
   has no effect on them.

   API: window.screensTheme.set(id), .get(), .ready (Promise
   resolving to the parsed design-systems.json), and a
   "screens-theme" event on window after every change.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'screens.ds';
  var script = document.currentScript;
  var base = new URL('.', script ? script.src : window.location.href);
  var dataUrl = new URL('design-systems.json', base);
  var data = null;
  var current = null;

  function readStore() {
    try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function writeStore(id) {
    try { window.localStorage.setItem(STORE_KEY, id); } catch (e) { /* private mode */ }
  }
  function fromQuery() {
    try { return new URLSearchParams(window.location.search).get('ds'); } catch (e) { return null; }
  }

  function fontLink(google) {
    var id = 'sc-font-link';
    var link = document.getElementById(id);
    if (!google) { if (link) link.remove(); return; }
    var href = 'https://fonts.googleapis.com/css2?' + google + '&display=swap';
    if (link && link.getAttribute('href') === href) return;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  function apply(id) {
    if (!data || !data.systems) return;
    var sys = data.systems[id] || data.systems[data.default];
    if (!sys) return;
    current = data.systems[id] ? id : data.default;
    var root = document.documentElement;
    var vars = sys.vars || {};
    Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });
    if (sys.font) {
      root.style.setProperty('--sc-font', sys.font.family);
      root.style.setProperty('--sc-font-heading', sys.font.heading || sys.font.family);
      fontLink(sys.font.google);
    }
    var logos = sys.logos || {};
    document.querySelectorAll('img[data-sc-logo]').forEach(function (img) {
      var role = img.getAttribute('data-sc-logo');
      if (logos[role]) img.src = new URL(logos[role], base).href;
    });
    root.setAttribute('data-sc-ds', current);
    window.dispatchEvent(new CustomEvent('screens-theme', { detail: { id: current, system: sys } }));
  }

  var ready = fetch(dataUrl.href, { credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (json) {
      data = json;
      if (!data) return null;
      var wanted = fromQuery() || readStore() || data.default;
      if (!data.systems[wanted]) wanted = data.default;
      apply(wanted);
      return data;
    });

  window.screensTheme = {
    ready: ready,
    get: function () { return current; },
    set: function (id) {
      writeStore(id);
      return ready.then(function () { apply(id); return current; });
    },
    logoUrl: function (id, role) {
      if (!data || !data.systems[id]) return null;
      var p = (data.systems[id].logos || {})[role];
      return p ? new URL(p, base).href : null;
    }
  };
})();

/* ============================================================
   Screens language runtime
   ------------------------------------------------------------
   The boards are drawn in Dutch. In English the gallery overlays
   screens.json with i18n/en/_gallery.json (set and row titles,
   app blurbs) and each board document is translated from its
   catalogue in i18n/en/<Key>.json plus i18n/en/_common.json:
   every text node and placeholder, title, aria-label and alt
   whose Dutch text is a key in the catalogue gets its English
   value. Names, addresses and dates have no entry and stay as
   drawn. A board without a catalogue stays Dutch; the gallery
   marks it.

   The language comes from lang.js when it is loaded (gallery
   pages), else from ?lang=, else from the same stored choice
   ("kit.lang"), else nl. Board documents sit in an iframe and
   load only this file, so the last three carry it there.

   API: window.screensI18n.lang, .applyGallery(screens, overlay),
   .translateBoard(key) (resolves to the catalogue coverage, or
   null when the board has none).
   ============================================================ */
(function () {
  'use strict';

  var LANG_KEY = 'kit.lang';
  var script = document.currentScript;
  var base = new URL('.', script ? script.src : window.location.href);

  function readLang() {
    if (window.kitLang && window.kitLang.lang) return window.kitLang.lang;
    var q = null;
    try { q = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* ignore */ }
    if (q) return String(q).toLowerCase();
    try { return window.localStorage.getItem(LANG_KEY) || 'nl'; } catch (e) { return 'nl'; }
  }
  var lang = readLang();

  function fetchJson(name) {
    return fetch(new URL(name, base).href, { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* Overlay set titles, row titles and app blurbs (G, _gallery.json) and board
     titles and notes (IDX, index.json, written from the catalogues) in place. */
  function applyGallery(S, G, IDX) {
    if (!S) return S;
    G = G || {};
    (S.sets || []).forEach(function (set) {
      if (G.sets && G.sets[set.id]) set.title = G.sets[set.id];
      (set.rows || []).forEach(function (row) {
        var k = set.id + '/' + row.id;
        if (G.rows && G.rows[k]) row.title = G.rows[k];
        if (row.blurb && G.blurbs && G.blurbs[row.blurb]) row.blurb = G.blurbs[row.blurb];
      });
    });
    Object.keys(S.boards || {}).forEach(function (name) {
      var b = S.boards[name];
      if (b.blurb && G.blurbs && G.blurbs[b.blurb]) b.blurb = G.blurbs[b.blurb];
      var t = IDX && IDX.boards && IDX.boards[name];
      if (t) {
        if (t.title) b.title = t.title;
        if (t.note) b.note = t.note;
      }
    });
    return S;
  }

  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function applyCatalogue(dict) {
    var hits = 0, total = 0;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode && n.parentNode.nodeName;
        if (p === 'SCRIPT' || p === 'STYLE') return NodeFilter.FILTER_REJECT;
        return /[A-Za-z]{2}/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var key = norm(n.nodeValue);
      total++;
      var v = dict[key];
      if (typeof v === 'string' && v) {
        /* keep the surrounding whitespace so inline layout does not shift */
        n.nodeValue = n.nodeValue.replace(/^(\s*)[\s\S]*?(\s*)$/, '$1' + v.replace(/\$/g, '$$$$') + '$2');
        hits++;
      }
    });
    ATTRS.forEach(function (a) {
      document.querySelectorAll('[' + a + ']').forEach(function (el) {
        var key = norm(el.getAttribute(a) || '');
        if (!/[A-Za-z]{2}/.test(key)) return;
        total++;
        var v = dict[key];
        if (typeof v === 'string' && v) { el.setAttribute(a, v); hits++; }
      });
    });
    return { hits: hits, total: total };
  }

  function translateBoard(key) {
    if (lang !== 'en' || !key) return Promise.resolve(null);
    return Promise.all([fetchJson('i18n/en/_common.json'), fetchJson('i18n/en/' + encodeURIComponent(key) + '.json')])
      .then(function (res) {
        if (!res[1]) return null;
        var dict = {};
        [res[0], res[1]].forEach(function (d) { if (d) Object.keys(d).forEach(function (k) { if (k.charAt(0) !== '_') dict[k] = d[k]; }); });
        var r = applyCatalogue(dict);
        document.documentElement.setAttribute('lang', 'en');
        return r;
      });
  }

  window.screensI18n = { lang: lang, applyGallery: applyGallery, translateBoard: translateBoard, fetchJson: fetchJson };

  /* Inside a board document (no gallery script present) translate on load. */
  function boardKey() {
    var m = /\/boards\/([^\/?#]+)\.html(?:[?#]|$)/.exec(window.location.pathname + window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  var key = boardKey();
  if (key && lang === 'en') {
    var run = function () { translateBoard(key).then(function (r) { window.dispatchEvent(new CustomEvent('screens-i18n', { detail: r })); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  }
})();
