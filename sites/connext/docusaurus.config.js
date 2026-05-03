/**
 * connext.conduction.nl, the platform-proposition site.
 *
 * Built on @conduction/docusaurus-preset for brand defaults; everything
 * specific to this site (URL, navbar items, edit links, plugins) is
 * passed in here.
 */

const path = require('path');
const { createConfig } = require('@conduction/docusaurus-preset');

module.exports = createConfig({
  title: 'ConNext',
  tagline: 'The open-source workspace stack.',
  url: 'https://connext.conduction.nl',
  baseUrl: '/',

  organizationName: 'ConductionNL',
  projectName: 'design-system',

  /* Site-specific navbar items merged into brand defaults
     (locale dropdown + GitHub) */
  navbar: {
    title: 'ConNext',
    logo: {
      alt: 'ConNext logo',
      src: 'img/logo.svg',
    },
    items: [
      { to: '/docs/intro', label: 'Docs', position: 'left' },
      { to: '/blog', label: 'Blog', position: 'left' },
      { to: '/diagrams', label: 'Diagrams', position: 'left' },
      { type: 'localeDropdown', position: 'right' },
      {
        href: 'https://github.com/ConductionNL/design-system',
        label: 'GitHub',
        position: 'right',
      },
    ],
  },

  customCss: [require.resolve('./src/css/site.css')],

  /* OpenCatalogi content plugin slot, wired in via env once it exists.
     Until @conduction/docusaurus-plugin-opencatalogi is built, leave
     plugins empty and content lives in docs/ + i18n/. */
  plugins: [
    // [
    //   '@conduction/docusaurus-plugin-opencatalogi',
    //   {
    //     apiUrl: process.env.OPENCATALOGI_URL || 'http://localhost:8080/index.php/apps/openregister/api',
    //     register: 'connext-content',
    //     schema: 'page',
    //     locales: ['nl', 'en', 'de', 'fr'],
    //   },
    // ],
  ],
});
