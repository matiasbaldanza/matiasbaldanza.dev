# Article images in Astro

Reference for where post images live and how to embed them.

## Where images live

| Location | Use for |
|----------|---------|
| Next to the markdown / in `src/` | Content images (colocate with the post) |
| `/public` | Stable raw URLs: favicon, `robots.txt`, PDFs (`public/cv/`) |

Do **not** put article screenshots in `/public`. Keep them beside the draft or
MDX so relative paths work and Astro can optimize them later.

**Phase 0:** `docs/drafts/<slug>.md` + `docs/drafts/<slug>-….png`  
**Phase 1:** move both to `src/content/posts/` together.

## Two ways to embed

### 1. Relative path in Markdown

```markdown
![The "way back" banner](./zero-js-and-adrs-retro-1-way-back-banner.png)
```

Astro resolves `./…` relative to the post file, copies the image into the
build, and emits a normal `<img src="…">`.

- Works in plain markdown — no component needed
- Little control over width, format, or density
- Fine for screenshots you already sized

### 2. `astro:assets` + `<Image>`

Import the file so the build pipeline owns it (MDX or `.astro`):

```astro
---
import { Image } from "astro:assets"
import banner from "./zero-js-and-adrs-retro-1-way-back-banner.png"
---

<Image
  src={banner}
  alt='The "way back" banner'
  width={800}
/>
```

What that does:

1. **Import** — Vite/Astro treat the PNG as a module and know its dimensions.
2. **Optimize** — at build time: resize, format (e.g. WebP), hashed filename.
3. **`<Image>`** — correct `width`/`height` (less CLS); can add `srcset`.

### When to use which

| Approach | Use when |
|----------|----------|
| Relative `![…](./…)` | Simple posts, screenshots already the right size |
| `<Image>` / `astro:assets` | You care about weight, CLS, or responsive sizes |

Default to relative markdown until a figure needs explicit optimization.
