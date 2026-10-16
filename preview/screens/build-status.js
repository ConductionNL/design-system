/* ============================================================
   Screens: build status
   ------------------------------------------------------------
   Reads build-status.json (scripts/screens/build_status.py):
   per board how far it is built in its app and how well it
   matches. Shared by index.html and board.html. The file is
   optional; without it load() resolves to null and the pages
   show no build status at all.
   ============================================================ */
(function () {
  'use strict';

  var KINDS = ['match', 'differs', 'partial', 'missing', 'stateOf', 'none'];

  /* One of KINDS for a build-status row; a board without a row is 'none'. */
  function kind(row) {
    if (!row) return 'none';
    if (row.status === 'built' || row.status === 'accepted') return row.layoutMatch === true ? 'match' : 'differs';
    if (row.status === 'partial') return 'partial';
    if (row.status === 'missing') return 'missing';
    if (row.status === 'state-of') return 'stateOf';
    return 'none';
  }

  function label(k, row, t) {
    switch (k) {
      case 'match': return t('screens.bs.match', 'Built, layout matches');
      case 'differs': return t('screens.bs.differs', 'Built, differs');
      case 'partial': return t('screens.bs.partial', 'Partly built');
      case 'missing': return t('screens.bs.missing', 'Missing');
      case 'stateOf': return t('screens.bs.stateOf', 'State of {board}', { board: (row && row.stateOf) || '?' });
      default: return t('screens.bs.none', 'Not measured yet');
    }
  }

  function pct(n, lang) {
    if (n == null) return '';
    try { return n.toLocaleString(lang === 'en' ? 'en' : 'nl', { maximumFractionDigits: 1 }) + '%'; }
    catch (e) { return n + '%'; }
  }

  function date(iso, lang) {
    var d = new Date(iso);
    if (isNaN(d)) return iso || '';
    try { return d.toLocaleString(lang === 'en' ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return iso; }
  }

  function load() {
    return fetch('build-status.json', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) { return d && d.boards ? d : null; });
  }

  window.screensBuildStatus = { KINDS: KINDS, kind: kind, label: label, pct: pct, date: date, load: load };
})();
