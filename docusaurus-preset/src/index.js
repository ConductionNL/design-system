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
 * Brand-default footer. Cobalt-900 panel with three-column link grid +
 * the standard Conduction tells (KvK, BTW, EUPL/MIT licence).
 */
const baseFooter = () => ({
  style: 'dark',
  links: [
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
        { label: 'Brand book', href: 'https://connext.conduction.nl/' },
        { label: 'Diagram set', href: 'https://connext.conduction.nl/diagrams/' },
      ],
    },
  ],
  copyright: `Conduction B.V. · KvK 76741850 · BTW NL860784241B01 · IBAN NL51 ABNA 0868951550 · Lauriergracht 14h, 1016 RR Amsterdam · ${new Date().getFullYear()}`,
});

/**
 * Build a complete Docusaurus config from a small set of site-specific opts.
 *
 * Required:
 *   title, tagline, url, baseUrl
 *
 * Optional:
 *   organizationName, projectName, navbar (deep-merged into base),
 *   footer (replaces base), customCss[] (appended to brand.css),
 *   plugins[], presets, i18n (overrides defaults)
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
        footer: opts.footer || baseFooter(),
      },
      opts.themeConfig || {}
    ),

    plugins: opts.plugins || [],
  };
}

module.exports = { createConfig, I18N, baseNavbar, baseFooter };
