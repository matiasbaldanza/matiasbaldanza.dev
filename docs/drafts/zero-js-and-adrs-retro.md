---
title: "Zero JavaScript, four ADRs, one exception: a technical retro"
description: "The decisions behind matiasbaldanza.dev — Astro static, hand-written CSS, unlisted pitch pages, and why the first JS on the site is ten lines of sessionStorage."
date: 2026-07-12
lang: en
draft: true
type: story
translationOf: null
topic: null
videoUrl: null
---

# Zero JavaScript, four ADRs, one exception: a technical retro

My personal site shipped in a day and grew for three more. This is the technical retro: what I chose, what it cost, and the one rule I broke on purpose. (The origin story — applying to a job with a website — is [its own post](./building-this-site.md).)

## Decision 1: Astro static, plain CSS (ADR 0001)

Requirements: ship in hours, easy to review, maintainable by one person, grows slowly. I considered Next.js (client runtime I don't need), plain HTML (no layout reuse), and Astro+Tailwind (dependency and class noise in a repo meant to be read).

Astro with fully static output won. All styling lives in one hand-written `global.css`: custom properties, a type scale, a ~65ch reading measure, one accent color. The whole stack fits in your head in minutes, there are no framework upgrades to babysit, and when I eventually need interactivity, Astro lets me opt in per island instead of shipping a runtime everywhere.

Verdict after a week: zero regrets. The constraint made every page faster to write, not slower.

## Decision 2: unlisted, not secret (ADR 0002)

The pitch pages for my job application live at a real URL on the real domain, but they're `noindex` and never linked from the homepage. Only people with the URL — i.e., the people I sent it to — find them.

This is a nice middle ground I'd use again: no auth to build, no separate deploy, and the future pattern is reusable — every new pitch or proposal gets its own unlisted mini-site under the same roof, reusing the same layouts.

## Decision 3: the first JavaScript is ten lines (ADR 0004)

Here's the fun one. Zero client-side JS was a founding constraint. Then a real UX problem showed up: someone enters through an unlisted pitch, wanders to the homepage, and can't find their way back because the homepage deliberately doesn't link to unlisted pages. `document.referrer` doesn't survive address-bar edits. Only client-side state can remember how this tab arrived. 

So the site's first JavaScript is an easter egg: pitch layouts write one `sessionStorage` key, and the homepage reads it to unhide a prerendered "way back" banner. The exception stays honest through three constraints: **session-scoped** (dies with the tab, no cookies, nothing sent anywhere), **progressive** (no JS or blocked storage → banner stays hidden, nothing else depends on script), and **inline** (`is:inline`, ~10 lines, no bundle).

The lesson isn't "rules are made to be broken." It's that a written rule (ADR 0001) forced the exception to justify itself in writing too. The argument of *is this feature worth the first JS on the site?* is exactly the argument you *should* have, and without the ADR it never happens.

## Decision 4: docs as memory, for agents and for me

The repo carries a `docs/` folder with a brief, a launch plan, a roadmap, and the ADRs — written before and during the build, not after. Solo project, so who are they for?

Two readers: **AI agents** and **future me**. It turns out briefing an agent well and briefing your future self are the same problem: capture the why, not just the what. Working with Claude on this repo, the docs were the difference between *"generate me a component"* and a peer (the agent or future me) pushing back citing constraints we agreed on. The roadmap even specifies how drafts (like this one) graduate: plain `.md` in `docs/drafts/` now, MDX content collection in Phase 1, Spanish translations with `translationOf` in Phase 2.

Which is the real retro conclusion: the site is becoming my own tiny homemade CMS, growing one phase at a time, in public. Fewer features than any CMS you'd install but I can read all of it, and it can't surprise me.

## Scorecard

Shipped same day: yes. Total client-side JS after four days: ~10 lines, opt-in, tab-scoped. Dependencies: one (Astro). CSS framework: none. ADRs written: four. ADRs regretted: zero.
