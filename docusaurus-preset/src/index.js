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
 *     title: 'ConNext',
 *     tagline: 'The open-source workspace stack.',
 *     url: 'https://connext.conduction.nl',
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
        { label: 'ConNext', href: 'https://connext.conduction.nl/' },
        { label: 'App store', href: 'https://apps.conduction.nl/' },
        { label: 'Common Ground hosting', href: 'https://commonground.nu/' },
      ],
    },
    {
      title: 'Conduction',
      items: [
        { label: 'Over ons', href: 'https://conduction.nl/over-ons/' },
        { label: 'Contact', href: 'mailto:info@conduction.nl' },
        { label: 'GitHub', href: 'https://github.com/ConductionNL' },
      ],
    },
    {
      title: 'Documentatie',
      items: [
        { label: 'Brand book', href: 'https://connext.conduction.nl/' },
        { label: 'Diagram set', href: 'https://connext.conduction.nl/diagrams/' },
        { label: 'EUPL-1.2 / MIT', href: 'https://eupl.eu/' },
      ],
    },
  ],
  copyright: `Conduction B.V. · KvK 76741850 · BTW NL860784241B01 · Lauriergracht 14h, 1016 RR Amsterdam · ${new Date().getFullYear()}`,
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

  const customCss = [
    require.resolve('./css/brand.css'),
    ...(opts.customCss || []),
  ];

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
