/**
 * Academy BlogListPage swizzle.
 *
 * Replaces Docusaurus's default theme-classic BlogListPage with the
 * academy landing layout: <FeaturedCard/> for the most-recent post,
 * <ContentTypeFilter/> for the chip row, <ContentCardGrid/> for the
 * remaining posts, <NewsletterCta/> at the bottom. The filter is
 * driven by `?type=` so the chip selection survives reload and copy-
 * paste, and the URL stays clean.
 *
 * SSR-safe: when window is not available (Docusaurus's first render),
 * we fall back to the unfiltered view via <BrowserOnly/>.
 */

import React, {useEffect, useMemo, useState} from 'react';
import clsx from 'clsx';
import {
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  FeaturedCard,
  ContentCard,
  ContentCardGrid,
  ContentTypeFilter,
  CONTENT_TYPES,
  NewsletterCta,
  Section,
} from '@conduction/docusaurus-preset/components';

const TYPE_SET = new Set(CONTENT_TYPES);

function readType(search) {
  try {
    const t = new URLSearchParams(search).get('type');
    return t && TYPE_SET.has(t) ? t : null;
  } catch (_) {
    return null;
  }
}

function defaultIconFor(contentType) {
  const stroke = {strokeWidth: 1.6, fill: 'none', stroke: 'currentColor'};
  switch (contentType) {
    case 'guide':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
          <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" />
          <path d="M4 16a4 4 0 0 1 4-4h12" />
        </svg>
      );
    case 'case-study':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
          <rect x="3" y="7" width="18" height="13" rx="1" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    case 'webinar':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'tutorial':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
          <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" />
          <path d="M19 14v6" /><path d="M16 17l3 3 3-3" />
        </svg>
      );
    case 'blog':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
  }
}

function panelToneFor(contentType) {
  switch (contentType) {
    case 'guide':      return 'cobalt-dark';
    case 'case-study': return 'mint';
    case 'webinar':    return 'orange';
    case 'tutorial':   return 'cobalt-dark';
    case 'blog':
    default:           return 'cobalt-deep';
  }
}

function postToCardProps(post) {
  const meta = post.content.metadata;
  const fm = meta.frontMatter || {};
  const author = meta.authors && meta.authors[0];
  return {
    href: meta.permalink,
    contentType: fm.contentType,
    title: meta.title || fm.title,
    summary: fm.summary || meta.description,
    author: author ? {name: author.name, avatarSrc: author.imageURL} : null,
    date: meta.date,
    tags: (meta.tags || []).slice(0, 3).map((t) => t.label || t),
    thumbnail: {
      icon: defaultIconFor(fm.contentType),
      panelTone: panelToneFor(fm.contentType),
    },
  };
}

function postToFeaturedProps(post) {
  const card = postToCardProps(post);
  const fm = post.content.metadata.frontMatter || {};
  return {
    href: card.href,
    eyebrow: 'Featured ' + (fm.contentType || 'post'),
    title: card.title,
    lede: card.summary,
    ctaLabel: 'Read more',
    author: card.author,
    date: card.date,
    thumbnail: {icon: defaultIconFor(fm.contentType)},
  };
}

function countsByType(posts) {
  const counts = {};
  for (const post of posts) {
    const ct = post.content.metadata.frontMatter?.contentType;
    if (ct) counts[ct] = (counts[ct] || 0) + 1;
  }
  return counts;
}

function AcademyLandingInner({items}) {
  const [activeType, setActiveType] = useState(() =>
    readType(typeof window !== 'undefined' ? window.location.search : '')
  );

  useEffect(() => {
    const onPop = () => setActiveType(readType(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const counts = useMemo(() => countsByType(items), [items]);
  const allCount = items.length;

  const filtered = activeType
    ? items.filter((p) => p.content.metadata.frontMatter?.contentType === activeType)
    : items;

  const handleChange = (next) => {
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('type', next);
    else url.searchParams.delete('type');
    window.history.pushState({}, '', url.toString());
    setActiveType(next);
  };

  if (filtered.length === 0) {
    return (
      <div style={{
        padding: '48px 0',
        textAlign: 'center',
        color: 'var(--c-cobalt-400)',
        fontSize: 16,
      }}>
        Nothing yet for this category. <a href="/academy/">View everything</a>
      </div>
    );
  }

  const [featured, ...rest] = filtered;

  return (
    <>
      <FeaturedCard {...postToFeaturedProps(featured)} />

      <div style={{height: 64}} />

      <ContentTypeFilter
        value={activeType}
        onChange={handleChange}
        counts={counts}
        allCount={allCount}
      />

      <div style={{height: 32}} />

      {rest.length > 0 && (
        <ContentCardGrid columns={2}>
          {rest.map((post, i) => (
            <ContentCard key={post.content.metadata.permalink || i} {...postToCardProps(post)} />
          ))}
        </ContentCardGrid>
      )}
    </>
  );
}

function AcademyLandingFallback({items}) {
  if (items.length === 0) return null;
  const [featured, ...rest] = items;
  return (
    <>
      <FeaturedCard {...postToFeaturedProps(featured)} />
      <div style={{height: 64}} />
      {rest.length > 0 && (
        <ContentCardGrid columns={2}>
          {rest.map((post, i) => (
            <ContentCard key={post.content.metadata.permalink || i} {...postToCardProps(post)} />
          ))}
        </ContentCardGrid>
      )}
    </>
  );
}

export default function BlogListPage(props) {
  const {items, metadata} = props;
  const sorted = useMemo(
    () => items.slice().sort((a, b) => {
      const da = new Date(a.content.metadata.date).getTime();
      const db = new Date(b.content.metadata.date).getTime();
      return db - da;
    }),
    [items],
  );

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}
    >
      <Layout
        title={metadata?.blogTitle || 'Conduction Academy'}
        description={metadata?.blogDescription}
      >
        <main className="marketing-page">
          <article style={{margin: 0, padding: 0}}>
            <Section spacing="default">
              <BrowserOnly fallback={<AcademyLandingFallback items={sorted} />}>
                {() => <AcademyLandingInner items={sorted} />}
              </BrowserOnly>

              <div style={{height: 96}} />

              <NewsletterCta
                title="New posts in your inbox, monthly."
                lede="One mail a month. New guides, case studies, and webinars. Geen spam, je kunt je altijd uitschrijven."
                placeholder="jij@bedrijf.nl"
                submitLabel="Subscribe"
                fineprint="We mail vanuit info@conduction.nl. Geen lijstverkoop."
              />
            </Section>
          </article>
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
