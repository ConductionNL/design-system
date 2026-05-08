/**
 * @conduction/docusaurus-preset
 *
 * Brand-default Docusaurus 3 config helper. Sites import createConfig()
 * and override only the parts that differ from the brand baseline.
 *
 *   // docusaurus.config.js
 *   const { createConfig } = require('@conduction/docusaurus-preset');
 *
 *   module.exports = createConfig({
 *     title: 'Conduction',
 *     tagline: 'Open-source apps for the Nextcloud workspace.',
 *     url: 'https://conduction.nl',
 *     baseUrl: '/',
 *   });
 *
 * createConfig() returns a complete Docusaurus config with brand tokens,
 * the four-locale i18n block (nl/en/de/fr, NL default), Plex Mono +
 * Figtree fonts, and Navbar / Footer scaffolding. Sites override any
 * field by passing it in or merging after the call.
 */

const path = require('path');

/**
 * Brand-default i18n block. Nederlands at the URL root, others at /en/, /de/, /fr/.
 */
const I18N = {
  defaultLocale: 'nl',
  locales: ['nl', 'en', 'de', 'fr'],
  localeConfigs: {
    nl: { label: 'Nederlands', htmlLang: 'nl-NL', direction: 'ltr' },
    en: { label: 'English',    htmlLang: 'en-GB', direction: 'ltr' },
    de: { label: 'Deutsch',    htmlLang: 'de-DE', direction: 'ltr' },
    fr: { label: 'Français',   htmlLang: 'fr-FR', direction: 'ltr' },
  },
};

/**
 * Brand-default navbar. Sites pass their own items[] and logo; the chrome
 * styling (cobalt-on-white, Plex-Mono caption) is locked.
 */
const baseNavbar = (siteName) => ({
  title: siteName,
  logo: {
    alt: `${siteName} avatar`,
    src: 'img/logo.svg',
    srcDark: 'img/logo-dark.svg',
  },
  items: [
    { type: 'localeDropdown', position: 'right' },
    { href: 'https://github.com/ConductionNL', label: 'GitHub', position: 'right' },
  ],
});

/**
 * Brand-default footer columns (the "links" array).
 *
 * Three corporate columns rendered on the cobalt-900 footer panel.
 * Sites override these wholesale by passing `footer.links` to
 * createConfig(); a site that wants to keep just one brand column
 * (e.g. only "Conduction" on a product-page footer) can spread the
 * filtered output of this function into their own array. The other
 * footer fields (style, copyright) keep their brand defaults
 * independently.
 */
const baseFooterLinks = () => [
  {
    title: 'Product',
    items: [
      { label: 'ConNext', href: 'https://conduction.nl/connext' },
      { label: 'Common Ground', href: 'https://conduction.nl/commonground' },
      { label: 'App store', href: 'https://apps.conduction.nl/' },
      { label: 'Common Ground hosting', href: 'https://commonground.nu/' },
    ],
  },
  {
    title: 'Conduction',
    items: [
      { label: 'About', href: 'https://conduction.nl/about' },
      { label: 'Open source', href: 'https://conduction.nl/about#opensource' },
      { label: 'Team', href: 'https://conduction.nl/about#team' },
      { label: 'ISO', href: 'https://conduction.nl/iso' },
    ],
  },
  {
    title: 'Documentatie',
    items: [
      { label: 'Brand book', href: 'https://identity.conduction.nl/' },
      { label: 'Diagram set', href: 'https://identity.conduction.nl/diagrams/' },
    ],
  },
];

/**
 * Brand-default footer copyright string. KvK + BTW + IBAN + address are
 * the legal anchor that every Conduction-branded site needs to render
 * regardless of which product-specific columns the footer shows above
 * it. Sites override this only for non-Conduction surfaces (rare); on
 * product pages it inherits unchanged.
 */
const baseFooterCopyright = () =>
  `Conduction B.V. · KvK 76741850 · BTW NL860784241B01 · IBAN NL51 ABNA 0868951550 · Lauriergracht 14h, 1016 RR Amsterdam · ${new Date().getFullYear()}`;

/**
 * Brand-default footer (full object). Backward-compatible shim for
 * older sites that called `baseFooter()` directly; new callers should
 * compose with `baseFooterLinks` / `baseFooterCopyright` so per-property
 * overrides keep working.
 */
const baseFooter = () => ({
  style: 'dark',
  links: baseFooterLinks(),
  copyright: baseFooterCopyright(),
});

/**
 * Build a complete Docusaurus config from a small set of site-specific opts.
 *
 * Required:
 *   title, tagline, url, baseUrl
 *
 * Optional:
 *   organizationName, projectName, navbar (deep-merged into base),
 *   footer (per-property fallback: any of style/links/copyright the
 *     site omits keeps its brand default — pass `footer: { links: [...] }`
 *     to swap columns while inheriting the KvK/BTW copyright),
 *   minigames (default true; set false to drop the brand canal-footer's
 *     boat-sinking + kade-cyclist mini-games on product pages while
 *     keeping the static skyline + canal decoration),
 *   customCss[] (appended to brand.css), plugins[], presets,
 *   i18n (overrides defaults)
 */
function createConfig(opts) {
  if (!opts || !opts.title || !opts.url) {
    throw new Error(
      '@conduction/docusaurus-preset: createConfig() requires { title, tagline, url, baseUrl }'
    );
  }

  /* brand.css is injected globally by the theme plugin (./theme.js) via
     getClientModules(), so customCss carries site-specific CSS only. */
  const customCss = opts.customCss || [];

  return {
    title: opts.title,
    tagline: opts.tagline || '',
    favicon: opts.favicon || 'img/favicon.svg',
    url: opts.url,
    baseUrl: opts.baseUrl || '/',
    trailingSlash: true,

    organizationName: opts.organizationName || 'ConductionNL',
    projectName: opts.projectName || 'design-system',

    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',

    /* Two static roots, in increasing-precedence order:
         1. preset's own ../static (lib/canal-footer, conduction-bg, hex-rain,
            platform-diagram + brand img/favicon, logo, logo-dark, nextcloud-logo)
         2. site's own static/ (CNAME, site-specific images, overrides)
       Last wins per-file, so a site can drop its own /img/logo.svg into
       static/img/logo.svg to override the brand default. */
    staticDirectories: opts.staticDirectories || [
      path.resolve(__dirname, '..', 'static'),
      'static',
    ],

    i18n: opts.i18n || I18N,

    presets: opts.presets || [
      [
        'classic',
        {
          docs: {
            sidebarPath: './sidebars.js',
            editUrl: opts.editUrl,
          },
          blog: opts.blog === false ? false : {
            showReadingTime: true,
            blogTitle: opts.title + ' blog',
            blogDescription: 'Updates from Conduction',
          },
          theme: {
            customCss,
          },
        },
      ],
    ],

    /* Brand theme: registers ./theme/* swizzles (Navbar, Footer, …)
       and auto-loads brand.css. Site-specific themes can be added by
       passing themes: [...] in opts (this default is replaced wholesale). */
    themes: opts.themes || [require.resolve('./theme.js')],

    themeConfig: Object.assign(
      {
        colorMode: {
          defaultMode: 'light',
          disableSwitch: false,
          respectPrefersColorScheme: true,
        },
        navbar: Object.assign(baseNavbar(opts.title), opts.navbar || {}),
        /* Per-property fallback so a site can override one slice of the
           footer (e.g. just `links`) and inherit the rest from the brand.
           Previously `opts.footer` replaced the whole footer wholesale,
           which forced sites to copy the KvK/BTW copyright string just to
           swap columns. */
        footer: (() => {
          const f = opts.footer || {};
          return {
            style:     f.style     || 'dark',
            links:     f.links     || baseFooterLinks(),
            copyright: f.copyright || baseFooterCopyright(),
          };
        })(),
        /* The brand canal-footer carries two interactive mini-games
           (boat-sinking + kade-cyclist). They're a kit-flavour win on
           the design-system showcase but distract on product-page
           landings. Surface as a top-level themeConfig flag so the
           Footer swizzle can drop the game DOM + lazy scripts when a
           site opts out, while still keeping the static skyline +
           canal decoration. Default true preserves prior behaviour. */
        minigames: opts.minigames !== false,
        /* Footer brand block (the wordmark + tagline + triad + socials
           on the left of the canal-footer grid).
             undefined  -> wordmark = 'Conduction' (product-page default;
                          previously this fell back to the site title,
                          which made every product-page footer wear the
                          product's wordmark instead of the company's).
             { wordmark: 'X' } -> single custom brand
             { brands: [{wordmark, logo, href}, ...] } -> dual-brand row,
                          rendered side by side. Used by product pages
                          built jointly with a partner (mydash + Sendent
                          is the first case). */
        footerBrand: opts.footerBrand || null,
      },
      opts.themeConfig || {}
    ),

    plugins: opts.plugins || [],
  };
}

module.exports = {
  createConfig,
  I18N,
  baseNavbar,
  baseFooter,
  baseFooterLinks,
  baseFooterCopyright,
};
