# Academy content schema

Frontmatter contract for posts on academy.conduction.nl.

Every MDX file under `sites/academy/content/` opens with a YAML
frontmatter block. The block conforms to
[`schemas/academy/content.schema.json`](../../schemas/academy/content.schema.json) and
drives every visual decision the academy components make: which chip
to show, which colour to tint the thumbnail, which fields to render
on the detail page.

## Minimal example

```mdx
---
slug: install-opencatalogi
title: Install OpenCatalogi in two minutes.
contentType: guide
authors: [ruben]
date: 2026-05-05
summary: From app store to first register, no terminal required.
tags: [OpenCatalogi, Install]
---

## Step 1 — Open the Nextcloud app store

…
```

## Fields

| Field             | Required | Type     | Notes |
| ----------------- | -------- | -------- | ----- |
| `slug`            |          | string   | URL slug. Defaults to the filename. Translations of the same post share a slug so URLs match across locales. |
| `title`           | yes      | string   | Sentence case. Card title and detail-page h1. |
| `contentType`     | yes      | enum     | `blog` \| `guide` \| `case-study` \| `webinar` \| `tutorial`. Drives chip colour and filter row. |
| `authors`         | yes      | string[] | Keys resolved against `sites/academy/content/authors.yml`. |
| `date`            | yes      | string   | ISO 8601 date (`YYYY-MM-DD`). Drives sort and byline. |
| `summary`         | yes      | string   | One-liner under 160 chars. Card subtitle and detail-page lede. |
| `tags`            |          | string[] | Topical tags shown next to the type chip. Free-form. |
| `heroImage`       |          | string   | Path to the cover image. Relative to the post folder. |
| `durationMinutes` |          | integer  | Renders as "N min read" (most types) or "N min watch" (webinar). |
| `videoUrl`        | conditional | uri   | Required when `contentType: webinar`. Ignored otherwise. |
| `thumbnailTone`   |          | enum     | Override for the thumbnail panel tone. Editors normally leave this off; defaults are picked from `contentType`. |

## Content type taxonomy

The five types are defined in
[`docusaurus-preset/src/components/ContentTypeFilter/contentTypes.js`](../src/components/ContentTypeFilter/contentTypes.js)
and mirrored in the JSON Schema. To add a sixth type, update both
files, the schema's `enum`, and the
`CONTENT_TYPE_BULLET_COLOR` map.

| `contentType` | Singular label | Plural (filter row) | Bullet colour token |
| ------------- | -------------- | ------------------- | ------------------- |
| `blog`        | Blog           | Blogs               | `--c-blue-cobalt`   |
| `guide`       | Guide          | Guides              | `--c-mint-500`      |
| `case-study`  | Case study     | Case studies        | `--c-cobalt-700`    |
| `webinar`     | Webinar        | Webinars            | `--c-orange-knvb`   |
| `tutorial`    | Tutorial       | Tutorials           | `--c-cobalt-400`    |

Webinar is the only type that uses KNVB orange. With one webinar
chip on a screen, the kit's "one orange accent per screen" rule
holds; the brand orange stays the focal point.

## Translations

Dutch is the canonical language. English (and any future locale) lives
in `sites/academy/i18n/<locale>/docusaurus-plugin-content-blog/` with
the same path structure as `content/`. Each translated file is a
separate MDX with its own frontmatter conforming to this schema. The
shared `slug` is what links a post across languages; everything else
(title, summary, body) can diverge.

## Forward-compat with OpenRegister

The JSON Schema in `schemas/academy/content.schema.json` is the
contract a future OpenRegister-driven academy will load. When the
content moves from MDX-on-disk to OpenRegister-hosted, this schema
becomes the registered schema in OpenRegister; existing MDX-based
posts can be ingested as objects. No frontmatter rework expected.
