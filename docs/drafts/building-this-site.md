---
title: "I applied for a job by shipping a website"
description: "Instead of just sending a CV, I built and launched a pitch site in one day — with an AI pair, a public repo, and honest commit history."
date: 2026-07-10
lang: en
draft: true
type: story
translationOf: null
topic: null
videoUrl: null
---

# I applied for a job by shipping a website

Last week I applied for a Developer Relations role. The CV I sent prints a URL: a page that exists only for the team reading it. This is the story of building it — and how a one-day pitch accidentally became my new personal site.

## The premise: show, don't tell

DevRel is a show-don't-tell job. You research tools, build demos, write the docs, and get in front of developers. So a PDF saying "I can do these things" felt weaker than an artifact proving it.

The inspiration is an old one: Jason Zimdars famously landed his job at 37signals with a personal pitch site built just for them. I borrowed the shape — about me, about them, why this fit — and added a constraint of my own: **the repo would be public, and the commit history would be part of the pitch.** Clean writing, clean code, no rewriting history to look smarter than the process actually was.

## The constraint: live on the real domain, same day

I gave myself roughly three hours to get v1 on the real domain. That budget forced every decision:

- **Astro, fully static, zero client-side JavaScript.** Plain `.astro` pages anyone can read in minutes.
- **One hand-written CSS file.** Custom properties, a type scale, a ~65ch measure, one accent color. No Tailwind — this is a repo meant to be *read*, and class soup reads badly.
- **The pitch pages are unlisted, not secret.** `noindex`, never linked from the homepage. Only people with the URL find them.

v1 shipped on day one. Then, over the next three days, 40-odd commits grew it into something I hadn't planned.

## Building with an AI pair, docs-first

The first draft was written with Claude. What made that work wasn't the code generation — it was the documentation discipline it pushed me into.

Before building, we wrote a **brief** (what, why, audience, constraints) and a **launch plan**. Every non-obvious choice became a short **Architecture Decision Record**. Not for a team — there is no team — but because docs are how you brief an AI agent, and how you brief *future you*, which turns out to be the same problem. Each ADR captures enough context to pick the work up cold.

The unexpected benefit: when I came back the next day and said "let's add a way for pitch visitors to find their way back," the agent had the full context of *why* the site had zero JavaScript, and we could argue properly about whether this feature deserved the first exception. (It did. That's ADR 0004, and it's getting its own post.)

## The accident: it kept growing

Somewhere around day two, the pitch site stopped being just a pitch site. The homepage got a real structure, a `/now` page, a `/work` page. The roadmap now has phases: articles with MDX, a Spanish track with proper `hreflang`, a newsletter, eventually a supporters area.

In other words: I set out to apply for a job and ended up with the seed of my own tiny CMS — one that will grow in public, post by post. This article is Phase 1's first draft, sitting in `docs/drafts/` exactly where the launch plan said it would.

## What I'd tell you to steal

1. **Apply with an artifact.** Whatever your field's version of "working demo" is, one of those beats three paragraphs of adjectives.
2. **Give yourself a same-day deadline.** Scope negotiates itself when the date won't move.
3. **Write the brief and the ADRs, even solo.** They're cheap, they make AI pair-work dramatically better, and they're the difference between a repo and a story.
4. **Let the public repo be part of the work.** Honest history is a credential you can't fake retroactively.

The application is out. Whatever comes back, I already shipped the first project of a longer series — and the site it lives on.
