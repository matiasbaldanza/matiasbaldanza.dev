# Plan — v1 launch

See [brief.md](./brief.md) for what and why, and [decisions/](./decisions/)
for the reasoning behind choices. This file tracks execution and is updated
in the same commit as the work it describes.

## Execution order

Deploy-first: the skeleton goes to Vercel and DNS gets pointed before any real
page is built, so propagation happens in parallel with development.

- [x] Scaffold Astro (minimal template), verify clean build
- [x] docs/: brief, plan, ADR 0001 (stack), ADR 0002 (unlisted /dotcms)
- [ ] Public GitHub repo, first push
- [ ] Vercel project + `matiasbaldanza.dev` domain + DNS records at registrar
- [ ] Base layout (meta/OG, `noindex` prop) + `global.css` + SocialLinks
- [ ] Homepage: photo, name, tagline, socials, email
- [ ] `/dotcms` pitch page (copy drafted from CV, edited by Matías)
- [ ] `/dotcms/resume` from Typst source + PDF in `public/cv/`
- [ ] Polish: OG tags, favicon, responsive pass, README rewrite
- [ ] Verify production: both URLs live, noindex only on `/dotcms/*`

## Deferred past v1

- Case study page under `/dotcms` (Zimdars-style project deep-dive)
- Articles/content cards on the homepage (`@astrojs/mdx` + content collection)
- OG image generation
