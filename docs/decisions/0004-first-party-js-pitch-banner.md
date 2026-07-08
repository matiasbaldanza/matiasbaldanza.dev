# ADR 0004 — First first-party JavaScript: the way-back banner

## Status

Accepted — 2026-07-08

## Context

Visitors who enter through an unlisted pitch (e.g. `/dotcms`) and then wander
to the homepage lose their way back — the homepage deliberately doesn't link
to unlisted pages (ADR 0002). Offering a way back requires remembering, on the
main site, that this tab entered through a pitch. `document.referrer` doesn't
survive address-bar edits; only client-side state does. ADR 0001 committed to
zero client-side JavaScript.

## Decision

Allow a minimal, progressive-enhancement exception: pitch layouts write one
`sessionStorage` key (`unlisted-entry`, ~10 lines inline), and the homepage
reads it to unhide a prerendered banner linking back. Constraints that keep
the exception honest:

- **Session-scoped, not tracking**: dies with the tab, no cookies, nothing
  sent anywhere, no identifiers.
- **Progressive**: no JS, blocked storage, or no marker → banner stays
  `hidden`; nothing else on the site depends on script.
- **Inline and framework-free**: `is:inline`, no bundle, no dependency.

Behavioral decisions, made explicit:

- **Lifetime = the tab, no timer.** `sessionStorage` has no expiry; the marker
  survives reloads within the tab and dies when it closes. No timestamp-based
  expiration — a hiring manager reads the site in one sitting, and a timer
  adds state for a problem this audience doesn't have. (Some browsers restore
  sessionStorage on tab-restore; acceptable.)
- **Multiple pitches: last writer wins.** Every pitch layout overwrites the
  single `unlisted-entry` key, so the banner names the most recently visited
  pitch. Never two banners, never a merge.
- **Entry direction is not checked.** A visitor who saw the homepage first
  and then typed a pitch URL still gets the banner on returning — technically
  backwards. Accepted: the copy hedges ("I think you came here through…"),
  the link is still useful to them, and the strict fix (a `seen-main` flag
  checked before writing the marker) adds state-machine logic to a 10-line
  courtesy. Revisit only if the banner grows responsibilities.

## Consequences

- The pitch page claim was reworded to "mostly no client-side JavaScript",
  with a tooltip: enhancements exist but all degrade gracefully without JS.
- Future pitches get the banner for free by setting the same key in their
  layout.
- If more interactivity ever accumulates, revisit ADR 0001 rather than
  stretching this exception.
