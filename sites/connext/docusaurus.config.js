/**
 * connext.conduction.nl, the platform-proposition site.
 *
 * Built on @conduction/docusaurus-preset for brand defaults; everything
 * specific to this site (URL, navbar items, footer link grid, plugins)
 * is passed in here.
 */

const {createConfig} = require('@conduction/docusaurus-preset');

module.exports = createConfig({
  title: 'ConNext',
  tagline: 'The open-source workspace stack.',
  url: 'https://connext.conduction.nl',
  baseUrl: '/',

  organizationName: 'ConductionNL',
  projectName: 'design-system',

  /* Brand top-navbar pattern: five left-side section links + locale
     dropdown + Partners ghost + Install primary CTA on the right. */
  navbar: {
    title: 'ConNext',
    items: [
      {to: '/apps',      label: 'Apps',      position: 'left'},
      {to: '/solutions', label: 'Solutions', position: 'left'},
      {to: '/docs/intro', label: 'Docs',     position: 'left'},
      {to: '/support',   label: 'Support',   position: 'left'},
      {to: '/about',     label: 'About',     position: 'left'},
      {type: 'localeDropdown', position: 'right'},
      {to: '/partners',  label: 'Partners',  position: 'right'},
      {to: '/install',   label: 'Install',   position: 'right', cta: true},
    ],
  },

  /* Brand footer link grid + Conduction tells in the copyright row. */
  footer: {
    links: [
      {
        title: 'Apps',
        items: [
          {label: 'OpenCatalogi',  href: 'https://opencatalogi.conduction.nl/'},
          {label: 'OpenRegister',  href: 'https://openregister.conduction.nl/'},
          {label: 'OpenConnector', href: 'https://openconnector.conduction.nl/'},
          {label: 'DocuDesk',      href: 'https://docudesk.conduction.nl/'},
          {label: 'MyDash',        href: 'https://mydash.conduction.nl/'},
          {label: 'OpenAI Bridge', href: 'https://openai-bridge.conduction.nl/'},
        ],
      },
      {
        title: 'Solutions',
        items: [
          {label: 'WOO compliance',      to: '/solutions/woo'},
          {label: 'Procurement workflow', to: '/solutions/procurement'},
          {label: 'Public catalogue',    to: '/solutions/catalogue'},
        ],
      },
      {
        title: 'Resources',
        items: [
          {label: 'Documentation',  to: '/docs/intro'},
          {label: 'Diagram set',    href: 'https://connext.conduction.nl/diagrams/'},
          {label: 'Brand book',     href: 'https://connext.conduction.nl/'},
          {label: 'GitHub',         href: 'https://github.com/ConductionNL'},
        ],
      },
      {
        title: 'Conduction',
        items: [
          {label: 'About',          to: '/about'},
          {label: 'Partners',       to: '/partners'},
          {label: 'Common Ground',  href: 'https://commonground.nu/'},
          {label: 'EUPL-1.2 / MIT', href: 'https://eupl.eu/'},
        ],
      },
    ],
    copyright: `Conduction B.V. · KvK 76741850 · BTW NL860784241B01 · Lauriergracht 14h, 1016 RR Amsterdam · © ${new Date().getFullYear()}`,
  },

  customCss: [require.resolve('./src/css/site.css')],

  /* OpenCatalogi content plugin slot, wired in via env once it exists. */
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
