/**
 * Brand BlogPostItem/Content swizzle.
 *
 * Wraps Docusaurus's default BlogPostItem/Content to resolve the
 * `ai` frontmatter key (ai-content-disclosure) the same way the
 * DocItem/Content swizzle does for docs pages, and render the
 * <AiDisclosure> banner above the post body.
 *
 * `BlogPostItem/Content` is reused for both the full post page AND
 * truncated excerpts on the blog list/archive/tag pages, so this
 * gates on `isBlogPostPage` (from `useBlogPost()`) - the banner is a
 * per-page disclosure, not a per-excerpt one, and rendering it on
 * every list-page card would repeat the same claim N times on a page
 * that "was" not itself generated or modified with AI.
 *
 * Absence of the key is silent by design (design.md D2); an
 * unrecognised value warns at build time and still renders nothing
 * (D3) - see disclosure.js resolveAiFrontmatter.
 */

import React from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContent from '@theme-init/BlogPostItem/Content';
import AiDisclosure from '../../../components/AiDisclosure/AiDisclosure.jsx';
import {resolveAiFrontmatter} from '../../../components/AiDisclosure/disclosure';

export default function BlogPostItemContentWithDisclosure(props) {
  const {metadata, frontMatter, isBlogPostPage} = useBlogPost();

  const {kind: aiKind, warning: aiWarning} = isBlogPostPage
    ? resolveAiFrontmatter(frontMatter.ai, metadata.source)
    : {kind: null, warning: null};
  if (aiWarning && typeof console !== 'undefined') {
    console.warn(aiWarning);
  }

  return (
    <>
      {aiKind && <AiDisclosure kind={aiKind} />}
      <BlogPostItemContent {...props} />
    </>
  );
}
