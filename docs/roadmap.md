# Roadmap

Post-v1 items, roughly ordered. Each entry captures enough context to pick the
work up cold; promote to an ADR when a decision is actually made.

## Visitor analytics & notifications

**Want:** know when someone visits (especially `/dotcms` while a job
application is live), without Vercel's stats (hobby-plan limits, and see
"Migrate off Vercel" below). Cloudflare already fronts the domain and stays in
front regardless of host, so everything below survives a hosting move.

Options, by effort:

1. **Cloudflare Web Analytics** — free, no code, privacy-friendly. The proxied
   zone already exposes basic edge traffic in the dashboard; enabling Web
   Analytics adds per-page views without JavaScript. No notifications, just a
   dashboard. *Do this first; it's a toggle.*
2. **GoatCounter** — free hosted (self-hostable later), per-path visit logs
   with referrers, using the no-JS pixel mode (single `<img>` in BaseLayout).
   Only needed if per-page history beyond Cloudflare's matters.
3. **Cloudflare Worker + ntfy.sh push** — ~20-line Worker on the route
   `matiasbaldanza.dev/dotcms*` that POSTs to a secret ntfy topic and passes
   the request through; phone buzzes when the page is opened. Free tier
   (100k req/day) is effectively unlimited for this. Design notes agreed:
   - **Self-exclusion cookie:** visiting `?me=<secret>` once per browser sets
     `owner=1; Max-Age=31536000; Path=/; Secure; HttpOnly`; the Worker skips
     notifying when the cookie is present. Survives IP changes; incognito
     windows won't have the cookie (re-tag or ignore the one ping from AR).
   - **Link-preview bot filter:** Gmail/Slack/WhatsApp/LinkedIn fetch URLs to
     render previews and would ping seconds after sending an email. Filter
     User-Agents: `Slackbot`, `WhatsApp`, `LinkedInBot`, `GoogleImageProxy`,
     `facebookexternalhit`, generic `bot|crawler|preview`.
   - **Useful payload:** include `request.cf.country`, path, and referrer in
     the message ("🇺🇸 /dotcms via linkedin.com" is self-evidently not me).
   - **Rate limit:** one ping per path per ~10 min via a small KV entry, so a
     visitor clicking through three pages doesn't buzz three times.
   - Lives entirely in Cloudflare; no changes to this repo.

**Recommended combo:** option 1 now + option 3 while a pitch is live.

## PageToc: sidebar and minimap variants

`src/components/PageToc.astro` (Phase 1, done) renders an inline "On this
page" anchor row; pages pass `sections: { id, label }[]` and keep the
filtering logic themselves. The prop shape matches Astro MDX `headings`
(slug/text), so articles can feed it with a two-line map.

- **Phase 2 — sticky sidebar (when articles exist):** add `variant="sidebar"`
  rendering the list vertically with `position: sticky` in the margin right of
  the 65ch column, only above ~1100px viewport; below that, fall back to the
  inline bar. Pure CSS, keeps the zero-JS guarantee.
- **Phase 3 — true minimap (probably never):** appear-on-scroll + highlight of
  the current section. Requires either the site's first first-party JS
  (~15-line IntersectionObserver scroll-spy — needs an ADR 0001 amendment) or
  CSS scroll-driven animations (verify Safari support at build time). Floating
  overlays also cost scarce space on mobile, where the inline bar already
  wins. Only revisit if Phase 2 proves insufficient on long articles.

## Migrate off Vercel

Target: **Cloudflare Pages** — static Astro from the same GitHub repo, free
unlimited bandwidth, and collapses the stack to one provider (DNS + hosting +
Worker + analytics). The Worker and analytics above carry over unchanged.
Steps when ready: create Pages project from the repo (build: `npm run build`,
output `dist/`), point the domain at Pages instead of Vercel, delete the
Vercel project.

## Earlier deferrals (from plan.md)

- Case study page under `/dotcms` (Zimdars-style project deep-dive)
- Articles/content cards on the homepage (`@astrojs/mdx` + content collection)
- OG image generation
