---
tags: [architecture, technical]
---

# 02 — Architecture

## stack

- **Astro** (latest stable, ~5.x) — the static site generator. Renders pages at build time. Markdown is a first-class content source via Astro Content Collections.
- **TypeScript** — used throughout `src/`. No `any` without justification.
- **Vanilla DOM + Canvas 2D + Web Audio** — no React, no Vue, no Svelte. The interactive primitives (inertial headings, synesthesia, cursor companion, recursive tree) are hand-written in TS modules. Astro hydrates them via `client:load` / `client:visible` directives where used.
- **CSS** — hand-written. CSS custom properties for tokens. No Tailwind, no CSS-in-JS, no preprocessor. (Justification: the site is small enough that the cognitive cost of a styling system exceeds the cost of writing CSS.)
- **No third-party UI libraries.**
- **Zero runtime dependencies** beyond Astro itself. Aim for the bundle to be sub-50 KB compressed.

Stack decision is logged in [[decisions/ADR-001-tech-stack-astro]].

## hosting

**Cloudflare Pages** — free tier, fast global CDN, simple custom-domain setup. The build command is `npm run build`; the publish directory is `dist/`. CI is Cloudflare's built-in (no GitHub Actions needed for the default deployment).

Fallback: **GitHub Pages**, configured via `.github/workflows/deploy.yml`. Documented but unused by default.

Hosting decision: [[decisions/ADR-002-hosting-cloudflare-pages]].

## repo layout

```
~/Developer/Portfolio_Website/
├── README.md              -> short, points reader to this Obsidian folder
├── astro.config.mjs       -> minimal: site URL, integrations
├── tsconfig.json
├── package.json
├── public/                -> raw static assets (favicon, robots.txt, OG image)
│   └── images/            -> photos (portrait, project screenshots) drop in here
├── src/
│   ├── pages/
│   │   └── index.astro    -> the single-page site, all rooms in one HTML doc
│   ├── layouts/
│   │   └── Base.astro     -> <html>, <head>, fonts, meta, global script bootstrap
│   ├── components/
│   │   ├── Threshold.astro
│   │   ├── OnMe.astro
│   │   ├── OnTheWork.astro
│   │   ├── OnTheArtifacts.astro     -> the manila-folder gallery
│   │   ├── OnRecursion.astro        -> the full-bleed tree section
│   │   ├── OnTheTrail.astro
│   │   ├── Coda.astro
│   │   └── ProjectCard.astro        -> one manila folder
│   ├── content/
│   │   ├── config.ts               -> Astro content collection schema
│   │   └── projects/
│   │       └── <slug>/
│   │           ├── index.md         -> the story (frontmatter: title, tagline, ...)
│   │           ├── notes/*.md       -> cleaned field notes (Obsidian-style)
│   │           ├── images/*         -> screenshots
│   │           └── meta.yaml        -> github_url, download_url, sort_order
│   ├── lib/
│   │   ├── backdrop/
│   │   │   ├── tree.ts              -> the recursive_tree_v2 port (entry)
│   │   │   ├── palettes.ts          -> FOREST, AURORA, etc. ported from lib/palette.py
│   │   │   ├── easing.ts            -> sin_wave etc., ported from lib/easing.py
│   │   │   └── scenes.ts            -> scene registry (future: aurora, constellation, …)
│   │   ├── primitives/
│   │   │   ├── inertial-type.ts
│   │   │   ├── synesthesia.ts
│   │   │   └── cursor-companion.ts
│   │   ├── boot.ts                  -> single rAF loop, primitive registry
│   │   └── reduced-motion.ts        -> prefers-reduced-motion gate
│   ├── styles/
│   │   ├── tokens.css               -> :root custom properties (palette, type, layout)
│   │   ├── global.css               -> resets, body, type basics
│   │   ├── threshold.css
│   │   ├── manila-folder.css        -> the gallery treatment
│   │   └── on-recursion.css
│   └── env.d.ts
└── .github/workflows/deploy.yml     -> GH Pages fallback (commented-out by default)
```

## the single rAF loop pattern

Borrowed from [[Legendary UI-UX/02 - Architecture]]: there is **exactly one** `requestAnimationFrame` callback for the whole page. It dispatches to registered primitives. Each primitive has its own gate (e.g. "only run if my section is visible").

```ts
// src/lib/boot.ts (sketch)
type Primitive = { tick(dt: number, t: number): void };
const primitives: Primitive[] = [];
export const register = (p: Primitive) => primitives.push(p);

let last = performance.now();
function frame(t: number) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  for (const p of primitives) p.tick(dt, t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

Primitives:
- `inertial-type` — pointer-driven letter physics (shared across all headings)
- `cursor-companion` — fixed-position pulse element following the pointer
- `tree-backdrop` — the threshold's low-opacity tree
- `tree-on-recursion` — the full-bleed version (separate instance, different config)
- `synesthesia` — gated to the on-me section only

The `reduced-motion` module wraps `register` and turns any motion primitive into a no-op when the user prefers it.

## content collection schema

```ts
// src/content/config.ts (sketch)
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    sort_order: z.number(),
    github_url: z.string().url().optional(),
    download_url: z.string().url().optional(),
    cover_image: z.string().optional(), // path relative to images/
    status: z.enum(['archived', 'active', 'shipped']).default('shipped'),
  }),
});

export const collections = { projects };
```

The gallery component (`OnTheArtifacts.astro`) reads `await getCollection('projects')`, sorts by `sort_order`, and renders one `<ProjectCard>` per entry. Each card is the manila folder.

Per-project "field notes" are loose `.md` files in `notes/` that the project page renders inline (via Astro's markdown rendering APIs), not as separate pages. This preserves the "Obsidian note sliding out" affordance.

## build, dev, deploy

- `npm run dev` — local dev server, fast HMR
- `npm run build` — emits `dist/`
- `npm run preview` — serves `dist/` locally for a real-output check

Cloudflare Pages auto-deploys on push to `main`. Custom domain (TBD by user) gets pointed via Cloudflare DNS in the dashboard.

## performance budget

Targets:
- **HTML/CSS/JS total compressed:** under 50 KB on the threshold (excluding the eventual portrait photo)
- **First contentful paint:** under 1.2s on slow 4G
- **Tree backdrop frame:** under 1.5 ms on M-series silicon
- **No layout shift after load** (CLS = 0)

Things that would degrade this:
- A portrait photo larger than ~80 KB (compress, use AVIF/WebP)
- Adding additional scene types (aurora, constellation) — fine *if* they're code-split per section
- Web fonts — banned by default. System serif is the type stack (see [[Concept - Inertial Headings]]).

## modularity rules (for senior-eng review)

- Every primitive is a self-contained module exposing `init(root: Element, opts): { stop(): void }`.
- No primitive reaches outside its assigned root element.
- The boot module is the only thing that knows about all primitives.
- The tree's algorithm and rendering are in *separate* files (`tree.ts` for state/update, a small adapter file for canvas drawing). This makes the algorithm portable (e.g. for a future SVG renderer) and makes both files reviewable independently.
- No globals on `window` except for one optional debug handle (`window.__portfolio` in dev only).
- Comments explain *why*, not *what*. The file-header docstring on each module describes the algorithm's intent. Inline comments are reserved for non-obvious tradeoffs (and link to the relevant ADR or Concept doc).

## accessibility

- `prefers-reduced-motion` honored at three levels (CSS, JS-loop noop, entrance animations disabled). Same approach as Legendary.
- All interactive primitives have keyboard equivalents where it makes sense (gallery folders open with Enter; the inertial-type primitive currently does not, see [[Open Questions]]).
- Color contrast on body text: AA against the warm-dark background.
- The recursive tree backdrop is `aria-hidden="true"`; it carries no information.
- The portrait slot has a meaningful `alt` (once a photo is dropped in).

## see also

- [[03 - Content Model]] — what content each section holds
- [[Concept - Recursive Tree Backdrop]] — the canvas port of `recursive_tree_v2.py`
- [[decisions/ADR-001-tech-stack-astro]] — why Astro
- [[decisions/ADR-002-hosting-cloudflare-pages]] — why CF Pages
