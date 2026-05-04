/* ============================================================
   Conduction kit i18n runtime
   ------------------------------------------------------------
   Tiny client-side translation layer for the static kit pages.
   The connext Docusaurus side has full Docusaurus i18n; this
   runtime is only for the plain-HTML preview pages so the NL/EN
   switcher in top-navbar.html actually flips the visible copy.

   How it works:
     1. Pages mark translatable text with data-i18n="some.key"
        on the element. The element's textContent is the EN
        default; it shows on first paint with no JS.
     2. This script reads ?lang=… from the URL (default 'nl' for
        kit pages, since NL is the brand default).
     3. If lang !== 'en' it loads /preview/i18n.<lang>.json and
        replaces every data-i18n element's textContent with the
        matching translation. Missing keys fall back to the
        original EN text — never blank.

   The runtime is intentionally small. For HTML attributes (alt,
   placeholder, title), use data-i18n-attr="title:some.key" — the
   left side names the attribute, the right side names the dict
   key.

   Per huisstijl: the kit's primary language is Dutch but EN
   stays first-class. Both are required, equal weight. So the
   default file shipped is i18n.nl.json; en is the fallback that
   already lives in the HTML.
   ============================================================ */

(function () {
  const DEFAULT_LANG = 'nl';
  const FALLBACK_LANG = 'en';

  function readLang() {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get('lang') || DEFAULT_LANG).toLowerCase();
    } catch (e) { return DEFAULT_LANG; }
  }

  function fetchDict(lang) {
    return fetch('/preview/i18n.' + lang + '.json', {credentials: 'omit'})
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }

  function get(dict, key) {
    if (!dict || !key) return null;
    let cur = dict;
    for (const seg of key.split('.')) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = cur[seg];
    }
    return typeof cur === 'string' ? cur : null;
  }

  function applyDict(dict) {
    if (!dict) return;
    /* Text content. Values containing < or & are treated as inline
       HTML so dictionary authors can preserve brand-citation spans
       (e.g. "Eén <span class='next-blue'>Nextcloud</span>"). All
       other values go through textContent for safety. */
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = get(dict, key);
      if (val == null) return;
      if (val.indexOf('<') !== -1 || val.indexOf('&') !== -1) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    /* HTML attributes via data-i18n-attr="attr:key[, attr:key]" */
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (!attr || !key) return;
        const val = get(dict, key);
        if (val != null) el.setAttribute(attr, val);
      });
    });
    /* HTML lang attribute so screen readers pick the right voice */
    document.documentElement.setAttribute('lang', dict._lang || readLang());
  }

  function init() {
    const lang = readLang();
    if (lang === FALLBACK_LANG) {
      /* EN copy is the default in the HTML; nothing to do. */
      document.documentElement.setAttribute('lang', 'en');
      return;
    }
    fetchDict(lang).then(applyDict);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
