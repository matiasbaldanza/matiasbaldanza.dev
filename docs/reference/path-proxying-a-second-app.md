# Serving a second app at a path on your main domain

How to make `yoursite.com/thing` serve a completely separate application —
different repo, different framework, different deployment — while the address
bar keeps saying `yoursite.com/thing`.

Written host-agnostic. The concrete example throughout is a static Astro site at
the apex and a Next.js app at `/basement`, which is what this repo actually does
(see [ADR 0005](../decisions/0005-basement-path-proxy.md)).

## The mental model

A **rewrite** (also called a proxy, or a "200 redirect") is a server-side
instruction: *when a request comes in for this path, go fetch the response from
somewhere else and return it as if it were mine.* The visitor's browser never
learns that a second server was involved. No extra round trip, no URL change.

A **redirect** (301/302) is the opposite: the server tells the browser "go ask
this other URL instead", the browser makes a second request, and the address bar
changes. If you use a redirect here, you have not put the app at a path on your
domain — you've put a signpost there.

```
                Rewrite                              Redirect
  browser ──GET /basement──▶ apex                browser ──GET /basement──▶ apex
                              │                     │  ◀──301 to other.com──┘
                              ├──▶ other app        └──GET other.com/basement──▶ other app
  browser ◀──── HTML ─────────┘                     (address bar now says other.com)
```

Everything below is about getting a rewrite, and about the one thing that makes
rewrites leak: **assets**.

## The asset problem, and why basePath is the whole trick

Serving the HTML is easy. The hard part is what the HTML then asks for.

A Next.js app normally requests its JavaScript from `/_next/static/...` —
absolute, from the root. Proxy only the HTML and the browser dutifully asks
*your apex* for `/_next/static/chunk.js`, your apex has no idea, 404, blank
page. This is the failure mode people hit, and it's easy to misdiagnose because
the HTML arrived fine.

Two ways out:

1. **Also proxy the asset paths.** Add a rewrite for `/_next/*` pointing at the
   other app. Works, but now the apex has surrendered a root-level path to a
   sub-app it doesn't own — and if you ever add a second proxied Next app,
   they both want `/_next/*` and you're stuck.
2. **Make the app request its assets from under the path.** Every serious
   framework has a setting for this. Set it, and the app's own HTML asks for
   `/basement/_next/static/chunk.js` — which your single wildcard rewrite
   already covers.

Option 2 is the right answer. The setting per framework:

| Framework | Setting |
| --- | --- |
| Next.js | `basePath: '/basement'` in `next.config.js` |
| Astro | `base: '/basement'` in `astro.config.mjs` |
| Vite (SPA) | `base: '/basement/'` |
| Create React App | `"homepage": "/basement"` in `package.json` |
| SvelteKit | `paths.base: '/basement'` |
| Nuxt | `app.baseURL: '/basement/'` |

The rule of thumb: **the sub-app should be self-consistent at the path**. If you
can deploy it standalone and load it at `other-host.com/basement` and it works
completely, the proxy is a formality. If it only works at `other-host.com/`,
you're going to be patching rewrites forever.

Test this before you touch the proxy. Open the sub-app at its own domain, at
the full path, and check the network tab for anything requested from the root.

## The rewrite rules

You need two, and the reason is a small path-matching detail worth knowing:

```json
{ "source": "/basement",        "destination": "https://target.example.com/basement" }
{ "source": "/basement/:path*", "destination": "https://target.example.com/basement/:path*" }
```

`/basement/:path*` matches `/basement/`, `/basement/a`, `/basement/a/b/c`. It
does *not* reliably match bare `/basement` with no trailing slash, because the
slash is part of the literal prefix. Some routers treat the trailing group as
fully optional and match both; not all do. Writing both rules costs one line
and removes the class of bug where the entry URL 404s but every link inside the
app works — a genuinely confusing thing to debug.

Note the destination keeps `/basement` in it. The rewrite is not stripping the
prefix; the target app expects it, because that's what `basePath` means. A
common mistake is rewriting `/basement/:path*` → `https://target/:path*`,
stripping the prefix — then the app's own redirects add it back and you get a
loop.

## Per-host recipes

**Vercel** — `vercel.json` at the repo root, `rewrites` array, syntax as above.
Works for static and SSR projects alike.

**Netlify** — `netlify.toml` or `_redirects`. The `status = 200` is what makes
it a proxy instead of a redirect; this is the single most-missed line:

```toml
[[redirects]]
  from = "/basement/*"
  to = "https://target.example.com/basement/:splat"
  status = 200
  force = true
```

**Cloudflare Pages** — `_redirects` here does *not* support proxying. You need
a Worker in front doing `fetch()` against the target and returning the response.

**nginx** — the classic. Note the trailing-slash semantics of `proxy_pass`
differ depending on whether you write one, which is its own tarpit:

```nginx
location /basement/ {
    proxy_pass https://target.example.com/basement/;
    proxy_set_header Host target.example.com;
}
```

**Caddy** — `handle_path` vs `handle` matters (the former strips the prefix,
which you don't want here):

```
handle /basement* {
    reverse_proxy https://target.example.com
}
```

**Cannot do this at all**: GitHub Pages, S3 without CloudFront, or any pure
static-file host. There is no server-side step to hook. If portability to those
is a requirement, use a subdomain instead — it's a DNS record and works
everywhere. You lose the path framing; you gain never thinking about this again.

## Gotchas, roughly in order of how much time they waste

1. **Deployment protection on the target.** Vercel Authentication, Netlify
   password protection, HTTP basic auth — these intercept the proxy's request
   too, so your rewrite faithfully returns a login page. Symptom: 401, or an
   unexpected SSO screen at your own URL. Fix: disable protection on the
   target's production environment, or pass a bypass token as a header.
2. **Assets requested from the root.** Covered above. Symptom: HTML loads,
   page is blank or unstyled, 404s for `/_next/*` or `/assets/*` in the network
   tab.
3. **Pointing at an unstable target URL.** Platform-generated hostnames
   (`project-abc123.vercel.app`) change on rename and don't distinguish
   production from previews. Assign a real domain to the target and point at
   that, even if you never advertise it.
4. **Shared origin, shared storage.** This is the consequence people don't
   anticipate: because the browser thinks everything came from your apex, the
   proxied app shares cookies, `localStorage`, and `sessionStorage` with your
   main site. That's occasionally useful (state carries across the boundary)
   and occasionally a leak (an analytics cookie set by the sub-app is now a
   first-party cookie on your domain). A subdomain would isolate these; a path
   proxy deliberately does not.
5. **Trailing-slash mismatch.** If the two sites disagree about whether URLs
   end in `/`, the sub-app issues its own redirect to normalize, which the
   browser follows — sometimes right out of the proxy and onto the target's
   real domain, exposing the URL you were hiding. Check that both sides agree.
6. **`Host` header.** Some proxies forward the original `Host`, which can make
   the target's routing or certificate validation unhappy. On managed platforms
   this is handled; on nginx/Caddy, set it explicitly.
7. **SEO and canonicals.** The sub-app generates canonical URLs, sitemaps, and
   Open Graph tags from *its* configured site URL, which is the target domain,
   not your apex. If you want the path indexed under your domain, the sub-app's
   site/URL config has to say so. If it's unlisted anyway (this repo's case,
   ADR 0002), this doesn't matter.
8. **Cache headers pass through.** The target's `Cache-Control` is what your
   visitors get. A sub-app with aggressive caching will serve stale content
   from your domain, and purging your CDN won't help.

## When not to do this

- **The two apps are really one app.** If they share layout, navigation, or
  design tokens, you're going to duplicate all of it across the boundary and
  they'll drift. Merge the repos.
- **You need shared server-side session or auth across the boundary.** Doable,
  but a path proxy is not the mechanism that makes it easy; you're building
  distributed auth either way.
- **A subdomain would be fine.** Genuinely ask. `thing.yoursite.com` is one
  DNS record, no config file, no gotcha list, portable to any host. The path is
  worth the complexity when the URL itself is doing communication work — a URL
  on a CV, a link in an application, something where "this is part of my site"
  is the message. That's a real reason. It's just narrower than it feels.

## Related

- [ADR 0005](../decisions/0005-basement-path-proxy.md) — the decision for this
  repo, with the specifics and the exit plan.
- [ADR 0002](../decisions/0002-unlisted-dotcms-noindex.md) — unlisted-not-private,
  which is why the target's auth can be off.
