/**
 * academy.conduction.nl, the Conduction learning hub.
 *
 * One Docusaurus build that surfaces the academy content feed: blogs,
 * guides, case studies, webinars, tutorials. Content lives as MDX with
 * a `contentType:` frontmatter and is rendered through the academy
 * components shipped in @conduction/docusaurus-preset.
 *
 * Locale shape:
 *   /         English (canonical for tech audience)
 *   /nl/      Nederlands (manual translations, can diverge)
 *
 * The blog plugin is disabled on day one. The landing at src/pages/
 * index.mdx hardcodes a few sample entries to prove the components
 * render. Batch 3 turns the plugin on, populates blog/, and points
 * the landing at real frontmatter.
 */

const {createConfig} = require('@conduction/docusaurus-preset');

module.exports = createConfig({
  title: 'Conduction Academy',
  tagline: 'Blogs, guides, case studies, webinars, tutorials. One feed, all open-source.',
  url: 'https://academy.conduction.nl',
  baseUrl: '/',

  organizationName: 'ConductionNL',
  projectName: 'design-system',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'nl'],
    localeConfigs: {
      en: {label: 'English',    htmlLang: 'en-GB', direction: 'ltr'},
      nl: {label: 'Nederlands', htmlLang: 'nl-NL', direction: 'ltr'},
    },
  },

  /* Blog plugin at /. The swizzles in src/theme/BlogListPage and
     src/theme/BlogPostPage replace the default Docusaurus chrome
     with the academy components: FeaturedCard + ContentTypeFilter +
     ContentCardGrid + NewsletterCta on the listing, ContentDetailHero
     + body + RelatedPosts on each post. */
  presets: [
    [
      'classic',
      {
        docs: false,
        blog: {
          path: 'blog',
          routeBasePath: '/',
          showReadingTime: true,
          blogTitle: 'Conduction Academy',
          blogDescription: 'Blogs, guides, case studies, webinars, tutorials. One feed, all open-source.',
          postsPerPage: 'ALL',
          blogSidebarCount: 0,
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Conduction Academy',
            description: 'New blogs, guides, case studies, webinars, and tutorials from Conduction.',
            copyright: `Conduction B.V. © ${new Date().getFullYear()}`,
          },
        },
        theme: {
          customCss: [require.resolve('./src/css/site.css')],
        },
      },
    ],
  ],

  navbar: {
    title: 'Academy',
    items: [
      {to: '/', label: 'Everything', position: 'left', activeBaseRegex: '^/$'},
      {to: '/?type=blog',       label: 'Blogs',        position: 'left'},
      {to: '/?type=guide',      label: 'Guides',       position: 'left'},
      {to: '/?type=case-study', label: 'Case studies', position: 'left'},
      {to: '/?type=webinar',    label: 'Webinars',     position: 'left'},
      {to: '/?type=tutorial',   label: 'Tutorials',    position: 'left'},
      {type: 'localeDropdown',  position: 'right'},
      {href: 'https://conduction.nl', label: 'Conduction', position: 'right'},
    ],
  },

  footer: {
    links: [
      {
        title: 'Academy',
        items: [
          {label: 'All content',    to: '/'},
          {label: 'Blogs',          to: '/?type=blog'},
          {label: 'Guides',         to: '/?type=guide'},
          {label: 'Case studies',   to: '/?type=case-study'},
          {label: 'Webinars',       to: '/?type=webinar'},
        ],
      },
      {
        title: 'Apps',
        items: [
          {label: 'OpenCatalogi',   href: 'https://opencatalogi.conduction.nl/'},
          {label: 'OpenRegister',   href: 'https://openregister.conduction.nl/'},
          {label: 'OpenConnector',  href: 'https://openconnector.conduction.nl/'},
          {label: 'DocuDesk',       href: 'https://docudesk.conduction.nl/'},
          {label: 'MyDash',         href: 'https://mydash.conduction.nl/'},
        ],
      },
      {
        title: 'Conduction',
        items: [
          {label: 'About',          href: 'https://conduction.nl/about'},
          {label: 'Open source',    href: 'https://conduction.nl/about#opensource'},
          {label: 'Apps',           href: 'https://conduction.nl/apps'},
          {label: 'Solutions',      href: 'https://conduction.nl/solutions'},
        ],
      },
    ],
    copyright: `Conduction B.V. · KvK 76741850 · BTW NL860784241B01 · IBAN NL51 ABNA 0868951550 · Lauriergracht 14h, 1016 RR Amsterdam · © ${new Date().getFullYear()}`,
  },

  plugins: [],
});
