import React from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {usePluginData} from '@docusaurus/useGlobalData';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import SeriesNav from './SeriesNav.jsx';

/**
 * <BlogSeriesNav /> — context-aware wrapper that renders <SeriesNav/>
 * for the current blog post.
 *
 * It must be rendered inside a blog post page (within Docusaurus's
 * BlogPostProvider). It reads the post's `series` frontmatter, looks
 * up the series grouping built by the `blog-series` plugin, localises
 * each part's permalink/title for the active locale, and renders the
 * strip. It returns null when the post is not part of a series, so it
 * is safe to drop in unconditionally.
 *
 * Two integration points use it:
 *   - the brand theme/BlogPostItem/Footer swizzle (standard blog
 *     layouts — fleet-wide), and
 *   - any site with a custom BlogPostPage that bypasses BlogPostItem
 *     (e.g. the Conduction academy), which imports it directly.
 */
export default function BlogSeriesNav() {
  const {metadata, isBlogPostPage} = useBlogPost();
  const data = usePluginData('conduction-blog-series');
  const {withBaseUrl} = useBaseUrlUtils();
  const {i18n} = useDocusaurusContext();

  const seriesId =
    metadata && metadata.frontMatter && metadata.frontMatter.series;
  const parts = seriesId && data && data.series && data.series[seriesId];
  if (!isBlogPostPage || !Array.isArray(parts) || parts.length < 2) {
    return null;
  }

  const routeBasePath = (data && data.routeBasePath) || '/blog';
  const locale = i18n && i18n.currentLocale;
  const localized = parts.map((part) => ({
    partNumber: part.partNumber,
    title: (locale && part.titles && part.titles[locale]) || part.title,
    permalink: withBaseUrl(`${routeBasePath}/${part.slug}`),
  }));

  return (
    <SeriesNav parts={localized} currentPermalink={metadata.permalink} />
  );
}
