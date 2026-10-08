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
