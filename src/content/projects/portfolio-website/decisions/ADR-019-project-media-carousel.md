---
tags: [adr, projects-page, media]
date: 2026-05-27
status: accepted
---

# ADR-019 — Project media: carousel, stack, and lazy-loaded GIFs

**Status:** accepted  
**Date:** 2026-05-27

## Context

After the 2026-05-27 content fill, all seven `/projects` chapters showed empty media placeholders. The user exported GIFs and PNGs from screen recordings and Manim renders into a desktop folder and asked for per-project rules:

- **Manim Wallpapers:** 10-slide carousel (all numbered scenes `01`–`10`, including phyllotaxis and v3 backdrops `09_drift_field`, `10_aurora_subtle`); default slide = `05_recursive_tree_v2`.
- **Arabic Dialect Map:** unique **stack** — screenshot + demo GIF both visible.
- **Web Crossword Generator** and **Adhkar Counter:** 2-slide carousel (photo first, GIF second).
- **Legendary UI/UX, InstaDM, Portfolio Website:** single GIF each.

Total Manim GIF payload is ~45 MB if all loaded at once; phyllotaxis alone is ~12 MB.

## Decision

1. **Schema** — extend `projects` collection frontmatter:
   - `media_items: [{ src, label? }]`
   - `media_mode: 'single' | 'carousel' | 'stack'` (default `single` when one item)
   - `media_default: number` (carousel start index; Manim uses `4` for `05_recursive_tree_v2`)

2. **Components** — extend `ProjectMedia.astro` as dispatcher:
   - `ProjectMediaAsset.astro` — PNG via `Photo`, GIF via plain `<img>`
   - `ProjectMediaCarousel.astro` + `project-media-carousel.ts` — prev/next, dots, keyboard, lazy `src` on active slide only
   - `ProjectMediaStack.astro` — vertical stack for Arabic Dialect Map

3. **Assets** — co-located under `src/content/projects/<slug>/images/`; resolved at build via `project-media-url.ts` (`import.meta.glob` + `?url`). No `.mp4` / `.mov` in repo.

4. **Performance** — carousel init deferred until IntersectionObserver sees the wrap; non-active slides use `data-src` until navigated.

5. **Per-project CSS** — `data-project-slug` on `.project-media-wrap` for fit overrides:
   - Arabic screenshot: `object-fit: contain`, natural aspect ratio (`950/706`)
   - InstaDM: `16/9` container + `contain` so full demo GIF fits

6. **Phyllotaxis in gallery** — included in the Manim carousel for display. This does **not** contradict ADR-005/006 “don't port phyllotaxis to canvas”; gallery show ≠ site backdrop port.

Legacy `cover_image` / `cover_video` remain for backward compatibility.

## Alternatives considered

1. **`cover_images[]` only, no mode enum** — insufficient for Arabic stack (both visible) vs carousel.
2. **Embed MP4 instead of GIF** — smaller files but contradicts user export workflow and adds `<video>` weight on a GIF-first pass.
3. **Eager-load all carousel slides** — simpler JS; rejected due to Manim payload.
4. **Exclude phyllotaxis** — prior aesthetic preference for canvas; user explicitly requested all 10 numbered Manim GIFs including phyllotaxis.

## Benefits

- All seven projects show real media; editorial layout unchanged.
- Data-driven modes — new projects set frontmatter, not one-off components.
- Lazy load keeps initial `/projects` payload reasonable.
- Lightbox still works on PNGs and GIFs.

## Harms / tradeoffs

- Large GIFs (phyllotaxis, portfolio demo, aurora) still heavy when user navigates to that slide.
- GIF format is inefficient vs modern video/WebP; acceptable for V1 demos.
- Per-slug CSS overrides (`arabic-dialect-map`, `insta-dm`) add maintenance if many projects need custom fit.
- `prefers-reduced-motion` does not pause GIF animation (future: static poster frame).

## Revisit if

- Page weight becomes a deploy blocker → re-encode to WebM/MP4 with `cover_video` or `<video autoplay muted loop>`.
- More than ~3 projects need custom fit → add `media_fit: contain | cover` to schema.
- Manim scene count grows past ~12 → consider thumbnail strip + full-size lightbox only.

## See also

- [[../03 - Content Model#project media (live 2026-05-27)]]
- [[ADR-018-project-wip-sticker-dialog]] — WIP sticker still overlays media column
