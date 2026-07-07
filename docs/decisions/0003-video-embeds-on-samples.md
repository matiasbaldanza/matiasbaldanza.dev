# ADR 0003 — Third-party video embeds allowed on /dotcms/samples

## Status

Accepted — 2026-07-07

## Context

ADR 0001 committed to zero client-side JavaScript. The samples page needs
playable video from YouTube, TikTok, and Instagram; hosting video ourselves or
linking out without previews would hurt the page's purpose. Platform embeds
necessarily load third-party iframes and their scripts.

## Decision

The site ships no first-party JavaScript, but `/dotcms/samples` may embed
third-party players via plain `<iframe>` (youtube-nocookie.com, TikTok
embed/v2, Instagram /embed/captioned) with `loading="lazy"`. No platform SDK
scripts are added to our pages. The workshops accordion uses native
`<details>`, keeping interactivity JS-free.

## Consequences

- Video plays in place; the rest of the site stays static and script-free.
- Third-party iframes bring their own weight and tracking; `loading="lazy"`
  and the nocookie domain limit the cost until a visitor scrolls to them.
- If an embed provider breaks its iframe endpoint, the fix is confined to
  `src/components/dotcms/VideoEmbed.astro`.
