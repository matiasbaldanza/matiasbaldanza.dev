# Roadmap

Post-v1 items, roughly ordered. Each entry captures enough context to pick the
work up cold; promote to an ADR when a decision is actually made.

## Homepage growth (phased)

Catch-all public homepage at `/` — linktree-with-content that grows into a
bilingual blog/newsletter. Unlisted pitch mini-sites (e.g. `/dotcms`) stay
separate; future pitches reuse the same pattern.

| Phase | Goal | Key deliverables |
|-------|------|------------------|
| **0** | Usable structure | Homepage sections, `/now`, `/work` (freelance), footer nav, empty states |
| **1** | Articles live | `@astrojs/mdx`, `src/content/posts/`, `/writing`, RSS, 3 launch posts |
| **2** | Spanish track | `/es`, `translationOf` pairs, hreflang, `/es/feed.xml` |
| **3** | Newsletter | Separate subscribe paths per language (and later per `topic`) |
| **4** | More work streams | Sponsors, `/projects`, `/video` as products go live |
| **5** | Followers area | Gated drafts/BTS for Patreon/Twitch supporters — design on stream |

**Launch articles (English first):** building this site (Astro + Claude), the
way-back banner (ADR 0004), Orca build first impressions. Video highlights on
homepage via `src/data/video-links.ts`.

**WIP drafts before Phase 1:** `docs/drafts/` (plain `.md`, not built). See
[docs/drafts/README.md](./drafts/README.md).

**Work-with-me priority:** freelance content & consulting on `/work` first;
sponsor and project sections deferred to Phase 4.

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

## Followers area (Phase 5)

Gated section for Patreon/Twitch/YouTube supporters: behind-the-scenes and
working drafts. Build in public on stream; decide auth via ADR when started.

Options to evaluate (simplest first):

1. **Patreon OAuth + edge gate** — Cloudflare Worker checks token; `followers`
   content collection or `followers: true` frontmatter flag on posts.
2. **Magic link** — simpler UX, weaker platform tie-in.
3. **Platform-native** — Patreon posts for BTS, site links out (easiest, splits
   audience).

Route: `/followers` (not linked from public nav until ready).

## Earlier deferrals (from plan.md)

- Case study page under `/dotcms` (Zimdars-style project deep-dive)
- OG image generation
