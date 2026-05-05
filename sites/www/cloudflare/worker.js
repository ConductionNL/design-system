/**
 * Conduction vanity-domain redirect Worker.
 *
 * Bound to the connext.conduction.nl/* and commonground.conduction.nl/*
 * routes in Cloudflare. Every incoming request is 301-redirected to the
 * canonical https://conduction.nl/<sectionPath>, with the locale prefix
 * picked from the visitor's Accept-Language header (NL preference goes
 * to /nl/<sectionPath>, otherwise to the default-locale path).
 *
 * Why a Worker instead of a 301 in DNS or page rules?
 *   - Cloudflare's static page-rule redirects do not let us inspect
 *     Accept-Language. We want NL visitors to land on the NL section
 *     directly, EN visitors on the canonical EN section, both with the
 *     same vanity domain as the entry point.
 *   - The redirect target changes per host; we keep both vanity hosts
 *     served by the same code so route-management stays in one place.
 *
 * Deployment:
 *   1. wrangler login
 *   2. wrangler deploy sites/www/cloudflare/worker.js \
 *        --name conduction-vanity-redirects \
 *        --route 'connext.conduction.nl/*' \
 *        --route 'commonground.conduction.nl/*'
 *   See briefs/cutover-runbook.md for the full sequence.
 */

const CANONICAL_ORIGIN = 'https://conduction.nl';

/**
 * Map from vanity host → section path on the canonical site.
 * Add a new entry to extend this Worker to a third vanity host;
 * the Cloudflare route binding has to be added separately.
 */
const VANITY_TO_SECTION = {
  'connext.conduction.nl':       '/connext',
  'commonground.conduction.nl':  '/commonground',
};

/**
 * Two-locale site, English default. Add to LOCALES if a third locale
 * is added to docusaurus.config.js i18n.
 */
const DEFAULT_LOCALE = 'en';
const LOCALES = ['en', 'nl'];

/**
 * Pick the best-matching locale from the visitor's Accept-Language
 * header, ordered by quality. Falls back to DEFAULT_LOCALE when no
 * supported tag matches.
 *
 * Examples:
 *   "nl-NL,nl;q=0.9,en;q=0.8" → "nl"
 *   "en-GB,en;q=0.9,nl;q=0.5" → "en"
 *   "fr,de;q=0.5"             → "en" (DEFAULT_LOCALE)
 *   ""                        → "en"
 */
function pickLocale(acceptLanguage) {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ordered = acceptLanguage
    .split(',')
    .map(part => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find(p => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.split('=')[1]) : 1.0;
      return {tag: tag.trim().toLowerCase(), q: isNaN(q) ? 0 : q};
    })
    .filter(x => x.tag)
    .sort((a, b) => b.q - a.q);

  for (const {tag} of ordered) {
    const primary = tag.split('-')[0];
    if (LOCALES.includes(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

/**
 * Build the redirect target URL.
 *
 * For the default locale we keep the URL prefix-less (Docusaurus's
 * default-locale convention). For non-default locales we prefix with
 * /<locale>.
 */
function targetUrl(host, pathname, search, locale) {
  const section = VANITY_TO_SECTION[host];
  if (!section) {
    /* Unknown host hit the Worker: redirect to the canonical root.
       This shouldn't happen under normal route bindings but is the
       safe fallback. */
    return CANONICAL_ORIGIN + '/';
  }

  const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;

  /* Strip the leading '/' off pathname so we don't get '//' when
     concatenating. The vanity host's pathname (eg. '/something')
     becomes a sub-path under the section ('/connext/something'). */
  const subPath = pathname === '/' ? '' : pathname.replace(/^\/+/, '/');

  return `${CANONICAL_ORIGIN}${localePrefix}${section}${subPath}${search}`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const acceptLanguage = request.headers.get('Accept-Language') || '';
    const locale = pickLocale(acceptLanguage);
    const target = targetUrl(host, url.pathname, url.search, locale);

    return Response.redirect(target, 301);
  },
};

/* Exported for unit tests. Not used by the Worker runtime. */
export const __test__ = {pickLocale, targetUrl, VANITY_TO_SECTION, LOCALES, DEFAULT_LOCALE, CANONICAL_ORIGIN};
