# ADR 0002 — /dotcms is unlisted, not private

## Status

Accepted — 2026-07-07

## Context

The `/dotcms` pitch targets one hiring team. Options: password-protect it
(friction for the exact people who must see it), leave it fully public and
linked (job-application content would define the site's public identity), or
make it unlisted.

## Decision

Unlisted: `/dotcms/*` pages ship with `<meta name="robots" content="noindex">`
and are never linked from the homepage or sitemap. The URL travels only on the
CV and in direct messages. `robots.txt` stays permissive — blocking the path
there would paradoxically advertise it.

## Consequences

- Zero friction for the hiring team; the printed CV URL just works.
- Not secret — anyone with the URL can view it, which is acceptable: the
  content is a public-quality pitch, and the repo is public anyway.
- If the application concludes, the pages can be removed or 301'd without
  affecting the homepage.
