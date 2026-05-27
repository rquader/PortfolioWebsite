---
tags: [adr, stack]
---

# ADR-001 — Tech stack: Astro + TypeScript + vanilla DOM

**Status:** accepted
**Date:** 2026-05-17

## Context

The portfolio is a content-rich site with custom interactive primitives (inertial typography, synesthesia, cursor companion, recursive tree backdrop) and a markdown-driven project gallery. We need a stack that:

1. Renders markdown as first-class content (for project notes).
2. Lets us ship custom canvas/JS primitives without framework overhead.
3. Produces a static `dist/` for deployment to a free CDN.
4. Stays modular and reviewable by a senior engineer.
5. Avoids fighting the aesthetic with bundle bloat or framework noise.

## Decision

Astro + TypeScript + vanilla DOM / Canvas 2D. Hand-written CSS. No CSS framework. No JS framework.

## Alternatives considered

### Single HTML file (legendary.html style)

Pure: one file, no build, no network. Matches the [[Legendary UI-UX/02 - Architecture|Legendary]] constraint.

- *Why-not:* doesn't scale for markdown-heavy content. Hand-pasting project stories into the file is painful and the file weight quickly outgrows the "single file" virtue. Also fights modular reviewability (one giant file is the opposite of what we want for senior-eng review).

### Vite + vanilla TS (no framework)

Modular, no framework overhead, hand-written everything.

- *Why-not:* would need to hand-build the markdown content pipeline (frontmatter parsing, content collection abstraction, route generation). Astro does this for free. More work for the same end state.

### Next.js / React

Most popular choice for "modern portfolio."

- *Why-not:* runtime React for what is fundamentally a static site is overkill. The bundle size fights the restraint-as-aesthetic posture. We'd be paying for hydration on every page when we want zero JS by default. Also incentivizes patterns (state management, hooks) we don't need.

### Eleventy / Hugo / Jekyll

Mature static site generators.

- *Why-not:* less ergonomic for the *interactive primitive* part. Astro's component model + `client:load` selective hydration is purpose-built for "static site with islands of interactivity." We have several islands.

### SvelteKit

Modern, good DX, clean.

- *Why-not:* solid but introduces a framework. Same argument as Next: a portfolio of this taste doesn't need a framework. Sticking to vanilla DOM in the primitives keeps the code more reviewable and avoids a Svelte-specific idiom for what is essentially a small set of canvas modules.

## Benefits

- **Zero JS by default.** Astro ships HTML/CSS unless we explicitly opt into hydration. The threshold heading + bio + DDD card are all static HTML at the wire.
- **Markdown is first-class.** `getCollection('projects')` reads our content collection at build time. We don't write a content pipeline; Astro is the pipeline.
- **Selective hydration.** Primitives that need JS get it via `client:load` or `client:visible`. The gallery's manila folders can use `client:visible` so the JS only loads when the section enters the viewport.
- **Build to plain static files.** `npm run build` → `dist/` → deploy anywhere. No serverless functions, no runtime dependencies, no vendor lock-in.
- **TypeScript-first.** Astro has good TS support out of the box.
- **Familiar to senior reviewers.** Astro components read like HTML with a script island; the mental model is small and well-documented.

## Harms / Tradeoffs

- **Astro is a framework.** It's a build dependency we'd avoid in the "single-file pure" world. The mitigation is that Astro's runtime footprint on the final page is zero (it's purely a build tool); a future migration off Astro is straightforward (the components are mostly HTML).
- **Build step adds a layer for new contributors.** A future agent or human has to install Node deps before running. Mitigated by [[Next Agent Handoff]] docs and a clear `npm install && npm run dev` path.
- **Content collection schema commits us to a shape.** Adding fields to project frontmatter requires a schema update. Acceptable: the schema is small and documented.
- **No SSR / hybrid mode used initially** — by design (static-only). If we ever want a contact form or backend, we'd add Cloudflare Pages Functions (still free, still on the same host).

## Revisit if

- The project gallery grows beyond ~30 entries and content management becomes painful → consider a CMS-backed content collection (still in Astro).
- A primitive needs server-rendered interactivity that's awkward in vanilla DOM → consider adding an Astro integration for a tiny framework (Solid, Preact) just for that primitive, not the whole site.
- Astro 6+ introduces breaking changes that fight our patterns → reassess. Until then, pin to the major version we built on.

## See also

- [[02 - Architecture]]
- [[ADR-002-hosting-cloudflare-pages]]
- [[ADR-006-aesthetic-primitives-inherited-and-cut]]
