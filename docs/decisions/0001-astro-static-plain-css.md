# ADR 0001 — Astro static output with plain CSS

## Status

Accepted — 2026-07-07

## Context

The site must ship in hours, be easy to review, and stay maintainable as a
personal site that grows slowly (articles later). Candidates considered:
Next.js (overkill, client runtime), plain HTML (no layout reuse), Astro with
Tailwind (extra dependency and class noise in a repo meant to be read).

## Decision

Astro with fully static output and zero client-side JavaScript. Styling lives
in one hand-written `src/styles/global.css` using custom properties, a type
scale, and a ~65ch measure — no CSS framework. `@astrojs/mdx` will be added
only when article content actually arrives.

## Consequences

- Pages are plain `.astro` files; anyone can read the entire stack in minutes.
- No framework upgrades or purge configs to maintain.
- Adding interactivity later means opting in per-island, which Astro supports.
- Design consistency depends on discipline in one CSS file rather than a
  utility system — acceptable at this size.
