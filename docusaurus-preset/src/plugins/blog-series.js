/**
 * blog-series — Docusaurus plugin that groups blog posts into linear
 * tutorial series.
 *
 * Scans every blog post's frontmatter at build time for a `series`
 * identifier and a `partNumber`, groups posts by series, sorts the
 * members by part number, and writes the result to `globalData`. The
 * brand `theme/BlogPostItem/Footer` swizzle reads it and renders a
 * <SeriesNav/> strip (Part X of N + prev/next) on every post that
 * belongs to a series.
 *
 * It is wired automatically by `createConfig` in the preset, so any
 * Conduction docs/academy site gets series navigation for free — the
 * only authoring contract is two frontmatter fields:
 *
 *   ---
 *   series: woo-tutorial
 *   partNumber: 2
 *   ---
 *
 * i18n: the Conduction academy keeps the same `slug` across locales
 * (only the title is translated), so the series structure is built
 * once from slugs and titles are collected per locale. Permalinks are
 * localised at render time by the swizzle via `withBaseUrl`, so they
 * pick up the `/nl` prefix automatically.
 *
 * Output via `usePluginData('conduction-blog-series')`:
 *
 *   {
 *     routeBasePath: '/academy',
 *     series: {
 *       'woo-tutorial': [
 *         {partNumber: 1, slug: 'woo-set-up-register',
 *          title: 'Set up Woo and DCAT registers',
 *          titles: {nl: 'Een Woo-register opzetten in OpenRegister'}},
 *         ...
 *       ],
 *     },
 *   }
 *
 * Options:
 *   - contentDir:    blog content directory (default 'blog')
 *   - routeBasePath: blog route base path   (default '/blog')
 *   - blogPluginId:  blog plugin id used for i18n dirs
 *                    (default 'docusaurus-plugin-content-blog')
 */

const fs = require('fs');
const path = require('path');

const SERIES_RE = /^\s*series:\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+))\s*$/m;
const PART_RE = /^\s*partNumber:\s*(\d+)\s*$/m;
const SLUG_RE = /^\s*slug:\s*([^\s#]+)\s*$/m;
const TITLE_RE = /^\s*title:\s*(?:"([^"]+)"|'([^']+)'|(.+?))\s*$/m;

function pick(match) {
  if (!match) return undefined;
  return match[1] || match[2] || match[3];
}

/** Read frontmatter from one markdown file, or null if it has none. */
function readFrontmatter(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  const block = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!block) return null;
  const fm = block[1];
  const series = pick(fm.match(SERIES_RE));
  if (!series) return null;
  const partMatch = fm.match(PART_RE);
  return {
    series,
    partNumber: partMatch ? parseInt(partMatch[1], 10) : 0,
    slug: pick(fm.match(SLUG_RE)),
    title: (pick(fm.match(TITLE_RE)) || '').trim(),
  };
}

/** Collect every `*.md`/`*.mdx` under dir (one level of post folders + flat files). */
function collectPosts(dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const inner of ['index.mdx', 'index.md']) {
        if (fs.existsSync(path.join(full, inner))) {
          out.push(path.join(full, inner));
        }
      }
    } else if (/\.mdx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

module.exports = function blogSeriesPlugin(context, options = {}) {
  const contentDir = options.contentDir || 'blog';
  const routeBasePath = options.routeBasePath || '/blog';
  const blogPluginId =
    options.blogPluginId || 'docusaurus-plugin-content-blog';

  return {
    name: 'conduction-blog-series',

    async loadContent() {
      const {siteDir, i18n} = context;
      const defaultLocale = (i18n && i18n.defaultLocale) || 'en';
      const locales = (i18n && i18n.locales) || [defaultLocale];

      // series id -> partNumber -> {partNumber, slug, title, titles:{}}
      const bySeries = {};

      const ingest = (file, locale) => {
        const fm = readFrontmatter(file);
        if (!fm || !fm.slug) return;
        const bucket = (bySeries[fm.series] ||= {});
        const entry = (bucket[fm.slug] ||= {
          partNumber: fm.partNumber,
          slug: fm.slug,
          title: fm.slug,
          titles: {},
        });
        entry.partNumber = fm.partNumber;
        if (locale === defaultLocale) {
          entry.title = fm.title || entry.title;
        } else if (fm.title) {
          entry.titles[locale] = fm.title;
        }
      };

      for (const locale of locales) {
        const dir =
          locale === defaultLocale
            ? path.join(siteDir, contentDir)
            : path.join(siteDir, 'i18n', locale, blogPluginId);
        for (const file of collectPosts(dir)) {
          ingest(file, locale);
        }
      }

      const series = {};
      for (const [id, bucket] of Object.entries(bySeries)) {
        const parts = Object.values(bucket).sort(
          (a, b) => a.partNumber - b.partNumber,
        );
        if (parts.length > 1) {
          series[id] = parts;
        }
      }

      return {routeBasePath, series};
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
};
