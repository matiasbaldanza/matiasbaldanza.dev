# ADR 0005 — /basement is a path proxy to a separate Next.js project

## Status

Accepted — 2026-07-29

## Context

The basement.studio pitch is a Next.js app in its own repo, deployed to its own
Vercel project. It needs to be reachable at `matiasbaldanza.dev/basement` — a
path on the main domain, not a subdomain, because the URL travels on a job
application and a path reads as "part of this person's site" while a subdomain
reads as "a separate thing".

Three ways to get there:

1. **Subdomain** (`basement.matiasbaldanza.dev`) — a DNS record, works on any
   host, no proxy layer. But it's a different origin, and it loses the framing.
2. **Move the app into this repo** — one deployment, no proxy. But it drags
   Next.js, React, and a bundler into a site whose whole premise is static
   Astro and plain CSS (ADR 0001), for one page that outlives the application
   by weeks.
3. **Path proxy** — this site rewrites `/basement/*` to the other deployment.
   Two repos, two deploys, one visible domain.

## Decision

Path proxy, via `rewrites` in `vercel.json` at the repo root:

```json
{
  "rewrites": [
    { "source": "/basement",        "destination": "https://<target>/basement" },
    { "source": "/basement/:path*", "destination": "https://<target>/basement/:path*" }
  ]
}
```

Supporting decisions:

- **The Next project keeps `basePath: '/basement'`.** This is what makes the
  proxy a two-rule config instead of a maintenance problem: with `basePath`,
  every asset the app requests is already under `/basement/_next/...`, so the
  wildcard rule carries them. Without it the app would ask for `/_next/*` at
  the apex, which would need its own rewrite and would collide with anything
  this site ever puts there.
- **Rewrite, not redirect.** A 301 would bounce the visitor to the other URL
  and defeat the point. Rewrites proxy server-side; the address bar keeps
  saying `matiasbaldanza.dev/basement`.
- **Destination will be a dedicated subdomain** assigned to the basement
  project; `https://basement-jobapp.matiasbaldanza.dev` is a temporary stand-in
  while DNS is set up. The production alias is derived from the project and
  account names, so renaming either breaks `/basement` silently — no build
  failure, no error until someone loads the page. The switch is a one-line
  change to each of the two `destination` values in `vercel.json`; nothing else
  in either project depends on the host, which is the point of keeping the
  coupling in one file.
- **No blanket redirect from the target back to the apex.** The target must
  never redirect to the proxy's own front door: the apex rewrite would receive
  the 301, pass it to the browser, and the browser would come straight back
  through the apex — an unbreakable loop on the canonical URL. Proxied requests
  and direct visits are indistinguishable at the target (same `Host`, and
  `vercel.json` rewrites can't inject a marker header), so there is no cheap
  condition that separates them. Canonicalization is handled with
  `<link rel="canonical">` instead, which costs nothing and can't loop.
- **Two projects, not one.** A domain can only belong to one Vercel project,
  so "add the apex to the basement project" is not an option even in principle.
- **Deployment Protection off on the basement project's production.** Vercel
  Authentication intercepts proxied requests too, so leaving it on serves a
  login page through the rewrite. Acceptable for the same reason as ADR 0002:
  this is unlisted, not private.
- **Config lands on `main` first**, then merges forward into in-flight content
  branches. It's one new file nothing else touches, so it ships independently
  of unrelated work.

## Consequences

- The proxied app runs on this site's origin, so it shares cookies and
  `sessionStorage` with the main site. The ADR 0004 `unlisted-entry` key is
  readable from the basement app and vice versa. Harmless today; if the
  basement app ever wants the way-back banner, it gets it by writing the same
  key.
- **Portability is now a hosting requirement, not a code one.** Nothing in the
  Astro source knows about `/basement`; the coupling is entirely in
  `vercel.json`. Any host with a server-side proxy can reproduce it (Netlify
  200-rewrites, nginx `proxy_pass`, a Cloudflare Worker). Static-only hosts
  (GitHub Pages, bare object storage) cannot, and moving there would force the
  subdomain fallback and a URL change. See
  [reference/path-proxying-a-second-app.md](../reference/path-proxying-a-second-app.md).
- Two deploys to keep alive for one URL. If the basement project is deleted or
  its subdomain unassigned, `/basement` breaks with a proxy error rather than
  this site's 404 — an unhosted path, not a missing page.
- When the application concludes, deleting the two rewrite rules retires the
  path cleanly, same exit as ADR 0002.
