/**
 * Sample academy items for batch 2.
 *
 * Hardcoded data so the landing renders without a content folder. In
 * batch 3 the Docusaurus blog plugin replaces this list with the
 * actual MDX frontmatter from sites/academy/blog/.
 *
 * Each entry conforms to the academy content schema documented in
 * docusaurus-preset/docs/academy-content-schema.md, plus a couple of
 * card-only fields (panelTone, icon) the schema does not yet cover.
 */

import React from 'react';

const IconHome = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" />
    <path d="M4 9h16" />
    <path d="M8 13l3 3 5-5" />
  </svg>
);

const IconBriefcase = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="7" width="18" height="13" rx="1" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
  </svg>
);

const IconPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
  </svg>
);

const IconBook = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" />
    <path d="M4 16a4 4 0 0 1 4-4h12" />
  </svg>
);

const IconDownload = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" />
    <path d="M19 14v6" /><path d="M16 17l3 3 3-3" />
  </svg>
);

export const FEATURED = {
  href: '/posts/install-opencatalogi/',
  eyebrow: 'Featured guide',
  title: 'Install OpenCatalogi in two minutes.',
  lede:
    'A walk-through of the install flow on a fresh Nextcloud, from app store ' +
    'to first register. Twelve minutes, no terminal required.',
  ctaLabel: 'Read the guide',
  author: {name: 'Ruben van der Linde'},
  date: '2026-05-05',
  thumbnail: {icon: <IconDownload />},
};

export const ITEMS = [
  {
    href: '/posts/tame-log-noise/',
    contentType: 'blog',
    title: "Taming log noise with OpenTelemetry's drain processor",
    summary: 'How a single processor cut our trace volume by 40 percent on the OpenRegister API.',
    author: {name: 'Mike Goldsmith'},
    date: '2026-05-04',
    tags: ['OpenTelemetry', 'Instrumentation'],
    thumbnail: {icon: <IconHome />, panelTone: 'cobalt-deep'},
  },
  {
    href: '/posts/mcp-server/',
    contentType: 'guide',
    title: 'New in the academy, learn to use the Conduction MCP server',
    summary: 'Set up the MCP server, point Claude Code at it, and write your first OpenRegister query.',
    author: {name: 'Midge Pickett'},
    date: '2026-04-29',
    tags: ['AI & LLMs', 'MCP'],
    thumbnail: {icon: <IconCheck />, panelTone: 'cobalt-dark'},
  },
  {
    href: '/posts/parhelion/',
    contentType: 'case-study',
    title: 'Approaching the parhelion',
    summary: 'How a Frisian municipality replaced four SaaS subscriptions with five Conduction apps.',
    author: {name: 'Austin Parker'},
    date: '2026-04-27',
    tags: ['MKB', 'Migration'],
    thumbnail: {icon: <IconBriefcase />, panelTone: 'mint', tone: 'cobalt-deep'},
  },
  {
    href: '/posts/semantic-conventions/',
    contentType: 'webinar',
    title: 'Managing OpenTelemetry semantic convention migrations with the collector',
    summary: 'A 45-minute walk-through with live Q&A on rolling out semconv 1.27 across a fleet of services.',
    author: {name: 'Mike Goldsmith'},
    date: '2026-04-23',
    tags: ['OpenTelemetry', 'Instrumentation'],
    thumbnail: {icon: <IconPlay />, panelTone: 'orange', tone: 'cobalt-deep'},
  },
  {
    href: '/posts/build-an-app/',
    contentType: 'tutorial',
    title: 'Build your first Conduction app, end to end',
    summary: 'From a blank Nextcloud to a published app in the store. Schemas, registers, OpenConnector flows.',
    author: {name: 'Ruben van der Linde'},
    date: '2026-04-20',
    tags: ['App development', 'Schemas'],
    thumbnail: {icon: <IconBook />, panelTone: 'cobalt-dark'},
  },
  {
    href: '/posts/woo-by-friday/',
    contentType: 'guide',
    title: 'WOO compliance, by Friday',
    summary: 'A live WOO portal at your Nextcloud-hosted domain. Eleven categories, audit log, citation-stable URLs.',
    author: {name: 'Ruben van der Linde'},
    date: '2026-04-15',
    tags: ['WOO', 'OpenCatalogi', 'OpenRegister'],
    thumbnail: {icon: <IconCheck />, panelTone: 'cobalt-deep'},
  },
];
