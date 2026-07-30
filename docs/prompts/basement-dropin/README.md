# Drop-in kit — basement project

Copy-in files and config for the Next.js basement project, so it behaves
correctly when proxied to `matiasbaldanza.dev/basement`.

This covers the mechanical parts. The judgement parts — auditing for
root-absolute asset paths, writing the ADR — are in
[../basement-project-setup.md](../basement-project-setup.md).

## 1. Way-back banner marker

Copy [`UnlistedEntryMarker.tsx`](./UnlistedEntryMarker.tsx) into the project
(e.g. `components/`), then render it once in the root layout.

**App Router** — `app/layout.tsx`:

```tsx
import { UnlistedEntryMarker } from "@/components/UnlistedEntryMarker";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <UnlistedEntryMarker />
      </body>
    </html>
  );
}
```

**Pages Router** — `pages/_app.tsx`:

```tsx
import { UnlistedEntryMarker } from "@/components/UnlistedEntryMarker";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <UnlistedEntryMarker />
    </>
  );
}
```

That's it — no props, no config. Defaults are already
`{ label: "my basement.studio pitch", href: "/basement" }`.

## 2. Metadata — canonical URL and noindex

`app/layout.tsx` (App Router). The canonical URL is the **apex path**, not this
project's own host:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://matiasbaldanza.dev/basement"),
  robots: { index: false, follow: false },
};
```

`noindex` because the pitch is *unlisted, not private*: anyone with the URL
should get in with zero friction — no password, no auth wall — but it shouldn't
turn up in search results. Leave `robots.txt` permissive; disallowing the path
there would advertise it.

## 3. next.config — basePath and the root redirect

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Load-bearing for the proxy: keeps every asset request under /basement so
  // the parent site's single wildcard rewrite carries them. Removing this
  // breaks matiasbaldanza.dev/basement.
  basePath: "/basement",

  async redirects() {
    return [
      {
        // Bare root only. Safe because the proxy never requests "/" — with
        // basePath set, every proxied request is under /basement. Do NOT
        // broaden this to /basement/* : the parent would receive the 301, pass
        // it to the browser, and the browser would come back through the
        // parent — an infinite loop on the canonical URL.
        source: "/",
        destination: "https://matiasbaldanza.dev/basement",
        basePath: false, // without this, Next prefixes the source with /basement
        permanent: false, // 302 while settling in; 301s cache hard in browsers
      },
    ];
  },
};

module.exports = nextConfig;
```

## 4. One dashboard change (not config)

Vercel **Deployment Protection must be off** for this project's production
environment — Settings → Deployment Protection. Vercel Authentication
intercepts the parent site's proxied request too, so leaving it on makes
`matiasbaldanza.dev/basement` serve an SSO login page.

## Verify

Full checklist in **[TESTING.md](./TESTING.md)** — phased, in deploy order, with
a symptom → cause table. Two things to know before you start:

- **Deploy this project first**, verify it standalone, *then* push the apex.
  Otherwise the first thing you see is a login page and you won't know whether
  the rewrite is wrong or protection is on.
- **`astro dev` on the apex ignores `vercel.json`**, so `/basement` 404s locally
  no matter what. Use `vercel dev` or a preview deployment.
