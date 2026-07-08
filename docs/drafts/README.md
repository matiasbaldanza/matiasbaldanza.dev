# Article drafts

WIP posts live here until Phase 1 adds the MDX content collection.

## Workflow

1. **Now (Phase 0):** write drafts as plain `.md` files in this folder. They are
   not built or published — safe place to iterate.
2. **Phase 1:** move each draft to `src/content/posts/<slug>.mdx` with
   frontmatter. Set `draft: true` while editing; flip to `false` when ready to
   ship.
3. **Phase 2:** add the Spanish translation as a separate file with
   `translationOf: "<english-slug>"`.

## Suggested launch posts

| File (suggested) | Type | Notes |
|------------------|------|-------|
| `building-this-site.md` | story | Astro + Claude, public repo, ADRs |
| `way-back-banner.md` | story | Progressive enhancement; see ADR 0004 |
| `orca-build-first-impressions.md` | tutorial | Tool guide |

## Frontmatter template (for Phase 1)

```yaml
---
title: "Post title"
description: "One line for cards and meta tags."
date: 2026-07-08
lang: en
draft: true
type: story # tutorial | demo | opinion | career | story
translationOf: null
topic: null
videoUrl: null
---
```
