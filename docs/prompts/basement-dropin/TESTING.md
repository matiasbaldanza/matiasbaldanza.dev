# Testing the /basement proxy

End-to-end checks for the two-project setup: the Astro site at
`matiasbaldanza.dev` proxying the Next.js basement app onto `/basement`.

Written for me to follow by hand, in order. Most failure modes here produce a
page that looks fine at a glance, so the order matters — each phase rules
something out before the next one can confuse you.

## First: what you cannot test locally

**`astro dev` does not apply `vercel.json` rewrites.** They're a platform
feature, not an Astro one. So on `localhost:4321`, `/basement` returns a 404 and
always will. This is not a bug and it's the single most likely thing to send you
chasing a problem that doesn't exist.

Two ways to get a real local test if you want one:

```bash
# Applies vercel.json rewrites locally, proxying to the deployed basement app
vercel dev
```

Or just test on a Vercel preview deployment, which is what I'd do — the preview
URL for the apex applies the rewrites exactly as production does.

What *is* locally testable: the basement app on its own (`next dev`, visit
`localhost:3000/basement`), and the apex homepage's banner behaviour if you set
the sessionStorage key by hand (see Phase 3).

## Order of operations

Deploy in this order, or you'll test a half-finished state:

1. **Basement project first** — apply the drop-in kit, deploy, turn off
   Deployment Protection.
2. **Verify the basement app standalone** (Phase 1) on its own `*.vercel.app`
   URL. Fix anything broken here before involving the proxy.
3. **Then push the apex** with `vercel.json`, and run Phases 2–4.

Doing it the other way round means the first thing you see at
`matiasbaldanza.dev/basement` is a Vercel login page, and you won't know whether
the rewrite is wrong or protection is on.

## Phase 1 — Basement app, standalone

On `https://basement-matias-baldanza.vercel.app`:

- [ ] `/basement` loads and renders fully — styles, fonts, images.
- [ ] **Network tab: nothing is requested from the root.** Filter for `_next`
      and confirm every hit is `/basement/_next/…`. Any bare `/_next/…`,
      `/assets/…`, or `/images/…` request will 404 once proxied. **This is the
      check that matters most** — the HTML loads fine when this is broken, so
      the page can look correct here and shatter behind the proxy.
- [ ] Every internal link and deep link works on a **hard reload**, not just via
      client-side navigation. Route handling and asset handling fail
      differently; SPA navigation can mask a broken direct load.
- [ ] Opening `/` (bare root) redirects to `matiasbaldanza.dev/basement` if you
      added the optional redirect, or 404s if you didn't. Either is fine — what
      must *not* happen is a redirect loop.
- [ ] No console errors, no hydration warnings.
- [ ] Open the URL in a private window. If you get an SSO or login screen,
      Deployment Protection is still on — fix that before going further.

## Phase 2 — The proxy

On `https://matiasbaldanza.dev/basement`:

- [ ] It loads. Address bar still says `matiasbaldanza.dev/basement` — no
      redirect, no `*.vercel.app` anywhere in it. If the host changes, something
      returned a 3xx instead of being proxied.
- [ ] Network tab again: no requests to apex-root asset paths, and no 404s.
- [ ] Deep links load directly: paste `matiasbaldanza.dev/basement/<subpage>`
      into a fresh tab. This exercises the wildcard rule.
- [ ] Bare `matiasbaldanza.dev/basement` with **no trailing slash** works. This
      is the case the second rewrite rule exists for; if only this one 404s
      while everything nested works, that rule is the suspect.
- [ ] Add a trailing slash: `matiasbaldanza.dev/basement/`. Should load without
      bouncing to another host — if the address bar jumps to `*.vercel.app`,
      the two projects disagree about trailing slashes.
- [ ] Hit a path that doesn't exist *inside* the app,
      `matiasbaldanza.dev/basement/nope`. Should be the **basement app's** 404,
      not the Astro site's. Confirms the wildcard reaches the target rather than
      falling through to the apex.
- [ ] Hit an apex path to confirm nothing leaked: `matiasbaldanza.dev/` and
      `matiasbaldanza.dev/dotcms` still work normally.
- [ ] View source: canonical and OG URLs say `matiasbaldanza.dev/basement`, and
      the `noindex` robots tag is present.

## Phase 3 — The way-back banner

This is a cross-app behaviour and needs the proxy live, because
`sessionStorage` is per-origin.

- [ ] In one tab: load `matiasbaldanza.dev/basement`, then navigate to
      `matiasbaldanza.dev` **in that same tab**. The banner should appear,
      reading "…came here through **my basement.studio pitch**", linking to
      `/basement`.
- [ ] Click the link — it should go back to `matiasbaldanza.dev/basement`.
- [ ] Open `matiasbaldanza.dev` in a *fresh* tab. Banner should be **absent**.
      It's session-scoped; a visitor who never saw the pitch must not see it.
- [ ] Visit `/dotcms` then the homepage: banner says "my dotCMS pitch". The two
      pitches share one key, last writer wins — never two banners.

Testing this on `*.vercel.app` will always fail, by design: the marker lands in
that origin's storage and the apex can't read it. Only the proxied URL works.

To check the apex side alone without deploying anything, paste this in the
console on the homepage and reload:

```js
sessionStorage.setItem("unlisted-entry", JSON.stringify({ label: "my basement.studio pitch", href: "/basement" }));
```

## Phase 4 — Degradation

The site's premise is that nothing essential depends on JavaScript, so:

- [ ] Disable JS and load `matiasbaldanza.dev/basement`. The Next app will lose
      interactivity — expected. What matters is the apex: with JS off the
      way-back banner must stay **hidden**, never appear empty or unstyled.
- [ ] Block storage (Safari private mode, or "block cookies"). No console
      errors — the marker's `try/catch` should swallow the throw.

## Troubleshooting

| Symptom | Almost certainly |
| --- | --- |
| Vercel SSO / login page at `matiasbaldanza.dev/basement` | Deployment Protection still on for the basement project's production |
| HTML loads, page blank or unstyled, 404s on `/_next/*` | `basePath` missing, or hardcoded root-absolute paths in the source |
| `ERR_TOO_MANY_REDIRECTS` | The basement app redirects `/basement/*` back to the apex — remove it; only bare `/` may redirect |
| Address bar flips to `*.vercel.app` | A 3xx from the target passed through the proxy; usually a trailing-slash normalization |
| Bare `/basement` 404s but `/basement/x` works | The non-wildcard rewrite rule is missing or wrong |
| Everything 404s at the apex, locally only | Expected — `astro dev` ignores `vercel.json`; use `vercel dev` or a preview deploy |
| Banner never appears | Testing on the wrong origin, or the marker component isn't rendered in the root layout |
| Banner appears with empty link text | The stored JSON's shape is wrong — must be `{label, href}` |
| `/basement` breaks suddenly, having worked | The basement project or Vercel account was renamed; its production alias changed. Update both `destination` values in the apex `vercel.json` — this is why a dedicated subdomain is the better target |

## When the subdomain lands

Once `basement-app.matiasbaldanza.dev` is assigned to the basement project,
swap both `destination` values in the apex `vercel.json` and re-run Phase 2.
Nothing in either codebase references the host, so that's the whole change.
