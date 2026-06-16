/**
 * Brand BlogPostItem/Footer swizzle.
 *
 * On a single blog post page whose frontmatter declares a `series`,
 * this prepends a <SeriesNav/> strip (via <BlogSeriesNav/>) — "Part X
 * of N" with the ordered list of parts and Previous / Next links — to
 * the post footer. The series grouping is built once at build time by
 * the `blog-series` plugin (wired automatically by createConfig).
 *
 * The rest of the footer reconstructs Docusaurus's default blog footer
 * (tags + edit-meta on a post page, tags + read-more in list view). We
 * reconstruct rather than wrap `@theme-original/...` because a wrapping
 * swizzle inside a preset theme resolves `@theme-original` back to this
 * component and recurses; reconstruction is the convention the other
 * brand swizzles (DocItem/Footer, Footer) follow.
 *
 * Note: sites with a custom BlogPostPage that bypass BlogPostItem (e.g.
 * the Conduction academy) won't hit this swizzle — they render
 * <BlogSeriesNav/> directly in their own layout instead.
 */

import React from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {ThemeClassNames} from '@docusaurus/theme-common';
import EditMetaRow from '@theme/EditMetaRow';
import TagsListInline from '@theme/TagsListInline';
import ReadMoreLink from '@theme/BlogPostItem/Footer/ReadMoreLink';
import {BlogSeriesNav} from '@conduction/docusaurus-preset/components';

export default function BlogPostItemFooter() {
  const {metadata, isBlogPostPage} = useBlogPost();
  const {tags, title, editUrl, hasTruncateMarker, lastUpdatedBy, lastUpdatedAt} =
    metadata;

  const truncatedPost = !isBlogPostPage && hasTruncateMarker;
  const tagsExists = tags.length > 0;
  const renderDefaultFooter = tagsExists || truncatedPost || editUrl;

  // Detail view (single post page): series strip + default footer.
  if (isBlogPostPage) {
    const canDisplayEditMetaRow = !!(editUrl || lastUpdatedAt || lastUpdatedBy);
    return (
      <>
        <BlogSeriesNav />
        {renderDefaultFooter && (
          <footer className="docusaurus-mt-lg">
            {tagsExists && (
              <div
                className={clsx(
                  'row',
                  'margin-top--sm',
                  ThemeClassNames.blog.blogFooterEditMetaRow,
                )}>
                <div className="col">
                  <TagsListInline tags={tags} />
                </div>
              </div>
            )}
            {canDisplayEditMetaRow && (
              <EditMetaRow
                className={clsx(
                  'margin-top--sm',
                  ThemeClassNames.blog.blogFooterEditMetaRow,
                )}
                editUrl={editUrl}
                lastUpdatedAt={lastUpdatedAt}
                lastUpdatedBy={lastUpdatedBy}
              />
            )}
          </footer>
        )}
      </>
    );
  }

  // List view.
  if (!renderDefaultFooter) {
    return null;
  }
  return (
    <footer className="row docusaurus-mt-lg">
      {tagsExists && (
        <div className={clsx('col', {'col--9': truncatedPost})}>
          <TagsListInline tags={tags} />
        </div>
      )}
      {truncatedPost && (
        <div className={clsx('col text--right', {'col--3': tagsExists})}>
          <ReadMoreLink blogPostTitle={title} to={metadata.permalink} />
        </div>
      )}
    </footer>
  );
}
