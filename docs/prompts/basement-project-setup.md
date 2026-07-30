# Handoff prompt — basement project, apex proxy setup

Copy this file into the basement Next.js repo (or paste it as a prompt) and run
it there. It's written to be self-contained; nothing in it assumes access to the
`matiasbaldanza.dev` repo.

Delete this file from `matiasbaldanza.dev` once the work has landed on the other
side — it's a handoff note, not documentation of this repo.

---

## Prompt

You are working in the Next.js project that powers my basement.studio job
application pitch. It deploys to its own Vercel project, with production currently at:

```
https://basement-matias-baldanza.vercel.app
```

That host is **temporary** — I'm assigning a dedicated subdomain shortly, and
the apex will point at that instead. Nothing you do in this repo should hardcode
it: the only place that hostname belongs is the parent repo's `vercel.json`. In
particular, don't reference it as the project's URL in the ADR, and don't build
absolute URLs from it in code or metadata.

It already has `basePath: '/basement'` configured.

### The setup you're fitting into

My personal site `matiasbaldanza.dev` is a separate repo — a static Astro site,
separate Vercel project. Its `vercel.json` proxies this app onto a path of my
main domain:

```json
{
  "rewrites": [
    {
      "source": "/basement",
      "destination": "https://basement-matias-baldanza.vercel.app/basement"
    },
    {
      "source": "/basement/:path*",
      "destination": "https://basement-matias-baldanza.vercel.app/basement/:path*"
    }
  ]
}
```

Three consequences that should drive your decisions:

1. **`https://matiasbaldanza.dev/basement` is the canonical, public URL.** It's
   what goes on my CV and in the application. The `*.vercel.app` URL is
   plumbing — reachable, but not advertised.
2. **These are server-side rewrites, not redirects.** The visitor's browser
   only ever sees `matiasbaldanza.dev`. It never learns this app exists on
   another host.
3. **`basePath` is load-bearing.** It's the reason the proxy is two rules
   instead of a maintenance problem: with it, every asset this app requests is
   already under `/basement/...`, so the wildcard rule carries them. Without
   it, the app would request `/_next/*` at the apex, which the apex doesn't
   serve — HTML would load and the page would render blank.

### Tasks

Work through these. Several are verifications rather than changes; report what
you found either way, and don't invent work if something is already correct.

1. **Confirm `basePath: '/basement'` is set** in `next.config.js`/`.ts` and that
   nothing overrides it. Do not remove it — the proxy depends on it.

2. **Audit for root-absolute asset references.** Grep the source for hardcoded
   paths that skip Next's helpers and would resolve at the apex root instead of
   under `/basement`: `src="/`, `href="/`, `url(/`, `fetch('/`, and absolute
   paths in metadata, manifests, or inline CSS. `next/link`, `next/image`, and
   `next/font` apply `basePath` automatically; raw strings in JSX, CSS
   `url()`, and `fetch()` calls do not. Fix any you find to go through the
   framework helpers, or prefix them with `basePath`.

3. **Set the canonical URL to the apex path.** In the metadata config, point
   `metadataBase` (or the equivalent) at `https://matiasbaldanza.dev/basement`
   so canonical, Open Graph, and Twitter URLs all resolve to the public URL
   rather than the `*.vercel.app` host. Right now they almost certainly point
   at the wrong origin.

4. **Add `noindex`.** This page is *unlisted, not private*: it should be
   trivially reachable by anyone with the URL — no password, no auth wall,
   zero friction for the hiring team — but absent from search results. Add
   `robots: { index: false, follow: false }` to the metadata. Leave
   `robots.txt` permissive; disallowing the path there would paradoxically
   advertise it.

5. **DO NOT add a blanket redirect from this app to the apex URL.** This is the
   trap in this architecture, so it's worth stating the mechanism: if this app
   redirects `/basement/*` → `https://matiasbaldanza.dev/basement/*`, then a
   normal visitor hits the apex, the apex proxies to here, here returns a 301,
   Vercel passes that 301 back to the browser, the browser goes to the apex —
   and loops forever. The canonical URL becomes the one URL that can't load.
   There's no cheap way to condition it away, either: a proxied request and a
   direct visit arrive here with the same `Host` header, and `vercel.json`
   rewrites can't inject a marker header for a `has` condition to match. Task 3
   is how canonicalization gets handled instead.

6. **Optionally redirect only the bare root `/`** → `https://matiasbaldanza.dev/basement`.
   This one is safe, precisely because the proxy never requests `/` — with
   `basePath` set, every proxied request is under `/basement`. Today `/` serves
   a 404, so this upgrades a dead page into a signpost.

   ```js
   async redirects() {
     return [{
       source: '/',
       destination: 'https://matiasbaldanza.dev/basement',
       basePath: false,   // without this, Next prefixes the source with /basement
       permanent: false,  // 302 while settling in; 301s cache hard in browsers
     }];
   }
   ```

   Both flags matter. `basePath: false` is easy to forget and makes the rule
   match something other than what you meant. `permanent: false` keeps you out
   of the situation where a browser has cached a 301 for a rule you've since
   deleted.

7. **Write the way-back marker so the parent site's banner works.** My homepage
   shows a small banner to visitors who arrived through an unlisted pitch and
   then wandered to the homepage — it offers them a link back, because the
   homepage deliberately doesn't link to unlisted pages. It's driven by one
   `sessionStorage` key that pitch pages set and the homepage reads:

   - **Key:** `unlisted-entry`
   - **Value:** JSON, `{ "label": string, "href": string }`

   For this app the value must be exactly:

   ```json
   { "label": "my basement.studio pitch", "href": "/basement" }
   ```

   Two details that matter:

   - **`href` is apex-relative — `/basement`, not this project's own host.**
     The banner is rendered on `matiasbaldanza.dev`, so the link resolves
     there.
   - **`label` is substituted into a sentence.** The banner reads "I believe
     you came here through *[label]*", so it has to fit that grammar. The
     dotCMS pitch uses `"my dotCMS pitch"`.

   **Don't write this from scratch — it ships as a drop-in.** Copy
   `UnlistedEntryMarker.tsx` from the `basement-dropin/` directory alongside
   this prompt and render it once in the root layout; its README has the wiring
   for both routers. It's a server component rendering an inline script, so it
   runs before hydration and needs no `"use client"`, and the storage call is
   wrapped in `try/catch` because Safari private mode throws on access — this
   is a courtesy feature that must never break the page.

   The marker is session-scoped by design: it dies with the browser tab, sets
   no cookies, sends nothing anywhere, and contains no identifiers. Don't
   "improve" it into anything more persistent. Multiple pitches share the one
   key and last-writer-wins, which is intended — the banner names the most
   recently visited pitch, never two banners.

   **This only works through `matiasbaldanza.dev/basement`.** `sessionStorage`
   is per-origin, so visiting this app on its `*.vercel.app` host writes the key
   to a different origin's storage and the apex homepage will never see it.
   That's expected, not a bug — and it's the first thing to check if the banner
   seems broken during testing.

8. **Check trailing-slash consistency.** If this app and the apex disagree about
   whether URLs end in `/`, this app will issue its own normalizing redirect,
   the browser will follow it, and it can surface the `*.vercel.app` URL in the
   address bar — leaking the host the proxy exists to hide. The apex is Astro
   with default `trailingSlash: 'ignore'`. Make sure `trailingSlash` here
   doesn't fight that.

9. **Review cache headers.** Whatever `Cache-Control` this app sets is what
   visitors to `matiasbaldanza.dev/basement` get, and purging the apex's CDN
   won't clear it. Nothing to change unless something is unusually aggressive —
   just confirm it's sane.

10. **Note for me, not a code change:** Vercel Deployment Protection must be
   **off** for this project's production environment. Vercel Authentication
   intercepts the apex's proxied request too, so leaving it on makes the rewrite
   serve an SSO login page at my own domain. I have to do this in the dashboard
   (Settings → Deployment Protection). Remind me in your summary; don't try to
   change it yourself.

### Write an ADR

Add an architecture decision record to this repo — `docs/decisions/`, create it
if it doesn't exist, numbered from `0001` if this is the first. Match this
structure:

```markdown
# ADR NNNN — Title

## Status

Accepted — YYYY-MM-DD

## Context

## Decision

## Consequences
```

The ADR should cover: that this app is consumed through a path proxy on
`matiasbaldanza.dev` and the canonical URL is the apex path, not this project's
own domain; that `basePath` is load-bearing for the proxy rather than cosmetic,
so removing it silently breaks the parent site; that canonicalization is done
with canonical tags because a redirect would loop; and that the app is unlisted
via `noindex` while staying publicly reachable.

Write it for a reader who has never seen the parent repo — this project has to
be intelligible on its own, since it's a public pitch someone may read as a
work sample. Prose over bullet soup, and record the *reasoning*, not just the
settings. State tradeoffs honestly where they exist.

The parent repo documents its side in
`docs/decisions/0005-basement-path-proxy.md`, with a host-agnostic writeup of
the technique in `docs/reference/path-proxying-a-second-app.md`. Mention them if
useful, but note you can't read them from here — don't guess at their contents,
and don't link them as if a reader of this repo could follow them.

### Verify

The full phased checklist is in `basement-dropin/TESTING.md`, alongside this
prompt. Run **Phase 1** yourself — it's the part testable from this repo alone,
before the proxy is involved. Phases 2–4 need the parent site deployed and are
mine to run.

Phase 1, in short: deploy, then on this project's own URL confirm the app renders
fully, that **every** `_next` request in the network tab is under `/basement/`
with none at the root, that deep links survive a hard reload rather than only
working via client-side navigation, and that there are no console or hydration
errors. The asset check is the one that matters — when it's broken the HTML still
arrives fine, so the page can look correct here and shatter behind the proxy.

Report what you changed, what was already correct, which Phase 1 checks you
actually ran versus couldn't, and anything you found that this prompt didn't
anticipate.
