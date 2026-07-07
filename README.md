# matiasbaldanza.dev

Personal site of [Matías Baldanza](https://matiasbaldanza.dev) — Developer
Relations, technical content, developer education.

Includes my CV and some of my job pitches for employers and consulting work, in unlisted pages.

First draft created with Claude Fable 5.
Built with [Astro](https://astro.build), fully static, zero client-side
JavaScript, hand-written CSS. No frameworks were harmed (or used).

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
```

## Structure

- `src/pages/` — the pages; `src/layouts/BaseLayout.astro` holds the shared
  shell and meta tags.
- `src/styles/global.css` — the entire design system: custom properties, type
  scale, one accent color.
- `docs/` — [project brief](docs/brief.md), [launch plan](docs/plan.md), and
  [architecture decision records](docs/decisions/). Written before and during
  the build, updated alongside the code, for agents and future reference.

Currently deployed on [Vercel](https://vercel.com).
