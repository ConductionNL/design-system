/* ============================================================
   Conduction kit language runtime
   ------------------------------------------------------------
   One place that decides which language a kit page shows, keeps
   that choice, and offers a visible NL/EN switch on every page.

   Order of precedence:
     1. ?lang=nl|en in the URL (a shared link in English stays
        English, and the choice is stored for the next page)
     2. localStorage "kit.lang" (the last choice on this browser)
     3. "nl", the brand default

   What it exposes, before any other script runs:
     window.kitLang.lang            the resolved language
     window.kitLang.withLang(url)   url with ?lang= added when the
                                    current page carries the param
     window.kitLang.set(lang)       store and reload in that language

   Translation itself happens elsewhere: i18n.js and the gallery
   pages overlay the Dutch dictionary, theme.js translates the
   boards. This file only answers "which language" and draws the
   switch. A page written in one language only keeps that language;
   the switch then still shows which one is chosen.

   The switch is a fixed pill in the top right corner. A page whose
   own chrome sits there marks an element with data-lang-slot and the
   pill goes inside it, in the flow. A page that draws its own switch
   (data-lang-pill="off" on <body>) gets none.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'kit.lang';
  var LANGS = ['nl', 'en'];
  var DEFAULT_LANG = 'nl';

  function fromQuery() {
    try { return new URLSearchParams(window.location.search).get('lang'); } catch (e) { return null; }
  }
  function readStore() {
    try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function writeStore(lang) {
    try { window.localStorage.setItem(STORE_KEY, lang); } catch (e) { /* private mode, blocked storage */ }
  }
  function valid(lang) {
    return lang && LANGS.indexOf(String(lang).toLowerCase()) !== -1 ? String(lang).toLowerCase() : null;
  }

  var fromUrl = valid(fromQuery());
  var lang = fromUrl || valid(readStore()) || DEFAULT_LANG;
  if (fromUrl) writeStore(fromUrl);

  function setParam(url, value) {
    var i = url.indexOf('#');
    var path = i === -1 ? url : url.slice(0, i), frag = i === -1 ? '' : url.slice(i);
    var q = path.indexOf('?');
    var base = q === -1 ? path : path.slice(0, q);
    var pairs = q === -1 ? [] : path.slice(q + 1).split('&').filter(function (p) { return p && p.split('=')[0] !== 'lang'; });
    pairs.push('lang=' + encodeURIComponent(value));
    return base + '?' + pairs.join('&') + frag;
  }

  /* Links carry the param only when the page itself was opened with it, so a
     shared English link stays English from page to page while a plain visit
     relies on the stored choice and keeps its URLs clean. */
  function withLang(url) {
    if (!fromUrl || !url) return url;
    if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(url)) return url;
    return setParam(url, lang);
  }

  function set(next) {
    next = valid(next);
    if (!next) return;
    writeStore(next);
    window.location.href = setParam(window.location.href, next);
  }

  window.kitLang = { lang: lang, fromUrl: !!fromUrl, withLang: withLang, set: set, STORE_KEY: STORE_KEY };

  /* ---------- the switch ---------- */
  var CSS = [
    '.kit-lang{position:fixed;top:12px;right:12px;z-index:9999;display:inline-flex;align-items:center;gap:2px;padding:3px;',
    'border:1px solid var(--c-cobalt-100,#d6def2);border-radius:999px;background:var(--conduction-color-surface-card,#fff);',
    'box-shadow:0 2px 8px rgba(18,38,96,.10);font:500 12px/1 var(--conduction-typography-font-family-body,"Figtree",system-ui,sans-serif);}',
    '.kit-lang button{appearance:none;border:0;background:transparent;color:var(--conduction-color-text-body,#3b4a6b);',
    'font:inherit;padding:6px 10px;border-radius:999px;cursor:pointer;letter-spacing:.04em;}',
    '.kit-lang button:hover{background:var(--conduction-color-surface-subtle,#eef2fb);}',
    '.kit-lang button[aria-pressed="true"]{background:var(--c-blue-cobalt,#1f4fd8);color:#fff;cursor:default;}',
    '.kit-lang button:focus-visible{outline:2px solid var(--c-orange-knvb,#f36f21);outline-offset:1px;}',
    '.kit-lang.in-slot{position:static;box-shadow:none;}',
    '@media print{.kit-lang{display:none}}'
  ].join('');

  function drawPill() {
    if (!document.body || document.body.getAttribute('data-lang-pill') === 'off') return;
    // A film capture (?capture) records the page frame by frame: no site chrome in the picture.
    if (/[?&]capture(&|=|$)/.test(location.search)) return;
    if (document.querySelector('.kit-lang')) return;
    var style = document.createElement('style');
    style.id = 'kit-lang-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.className = 'kit-lang';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', lang === 'en' ? 'Language' : 'Taal');
    LANGS.forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = code.toUpperCase();
      b.lang = code;
      b.title = code === 'nl' ? 'Nederlands' : 'English';
      b.setAttribute('aria-pressed', code === lang ? 'true' : 'false');
      b.addEventListener('click', function () { if (code !== lang) set(code); });
      wrap.appendChild(b);
    });
    var slot = document.querySelector('[data-lang-slot]');
    if (slot) wrap.className += ' in-slot';
    (slot || document.body).appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawPill);
  } else {
    drawPill();
  }
})();
