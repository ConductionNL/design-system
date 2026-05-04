/* ============================================================
   Conduction kit downloads runtime
   ------------------------------------------------------------
   Companion to i18n.js: fills download counters in the static
   kit pages from /data/app-downloads.json. The JSON is rebuilt
   by .github/workflows/app-downloads.yml every weekday at 09:00
   Amsterdam, so these numbers stay current without editing HTML.

   How it works:
     1. Pages mark counters with one of:
          data-total-downloads      total across every app
          data-app-downloads="<id>" per-app count, e.g. "openregister"
     2. The script fetches /data/app-downloads.json. Path is
        derived from the script tag's src= so it works both at
        the kit root (preview/) and one level deeper (pages/).
     3. Numbers are formatted with toLocaleString('en'). If the
        fetch fails the placeholder text in the HTML stays intact.

   The data is the same file <DetailHero /> imports at build time
   in the Docusaurus side, so kit and live site cannot drift.
   ============================================================ */

(function () {
  function findDataUrl() {
    var here = document.currentScript && document.currentScript.src;
    if (here) {
      try {
        var u = new URL(here);
        u.pathname = u.pathname.replace(/preview\/.*$/, 'data/app-downloads.json');
        return u.toString();
      } catch (_) { /* fall through */ }
    }
    return '../../data/app-downloads.json';
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('en');
  }

  function paint(data) {
    var byId = {};
    (data.apps || []).forEach(function (a) {
      byId[a.id] = (a.github && a.github.downloads) || 0;
    });

    document.querySelectorAll('[data-total-downloads]').forEach(function (el) {
      el.textContent = fmt(data.totals && data.totals.downloads);
    });

    document.querySelectorAll('[data-apps-total]').forEach(function (el) {
      el.textContent = fmt(data.totals && data.totals.apps_total);
    });

    document.querySelectorAll('[data-app-downloads]').forEach(function (el) {
      var id = el.getAttribute('data-app-downloads');
      var n = byId[id];
      if (typeof n === 'number') {
        el.textContent = fmt(n);
        el.removeAttribute('hidden');
      } else if (el.dataset.hideWhenMissing !== undefined) {
        el.setAttribute('hidden', '');
      }
    });
  }

  fetch(findDataUrl(), { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d) paint(d); })
    .catch(function () { /* leave HTML defaults in place */ });
})();
