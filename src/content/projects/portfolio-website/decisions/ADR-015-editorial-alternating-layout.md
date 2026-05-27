---
tags: [adr, projects-page, layout, editorial]
---

# ADR-015 — Editorial alternating layout for /projects (replaces vertical chapter stack)

**Status:** accepted
**Date:** 2026-05-24

## Context

The phase-4 implementation of `/projects` shipped a single-column vertical stack of chapter blocks — each chapter rendered title → cover media → body prose → notes accordion → meta line, every chapter centered, every chapter the same shape. Visually flat. The user's brief during the 2026-05-24 brainstorm: *"i'm thinking more of photo + text in alternating right/left, left/right vertically … like buttons for traceability with the Obsidian notes."* See the visual companion screens archived at `.superpowers/brainstorm/62648-1779612025/content/` (`editorial-row.html` → `row-v3-themed.html`).

This brainstorm also generated the popup-based notes pattern (separate decision in [[ADR-016 notes popup centered folio|ADR-016]]) and the story/info toggle (separate decision in [[ADR-017 story info mode toggle|ADR-017]]). This ADR is only about the page's *macro* layout.

## Decision

Replace the single-column stack with a two-column alternating grid:

- Each chapter is `grid-template-columns: 1.05fr 1fr` (media slightly wider than text).
- Odd-indexed chapters get `.project-chapter-flip` which reverses the visual order — text on the left, media on the right.
- A subtle horizontal rule (`<hr class="chapter-rule">` capped at 24rem) separates chapters; the rule centers in the page.
- Page header gets a two-zone layout: title + intro prose on the left, controls (mode toggle, eventually theme toggle if moved) on the right.

Alternation is computed in `projects.astro` and passed to `ProjectChapter` as an `index` prop. Mobile (`@media (max-width: 720px)`) collapses the grid to a single column with media always above text — the flip is invisible at that width, by design.

## Alternatives Considered

- **Keep single column** — simplest, no regression. Rejected: the user explicitly described an editorial alternating rhythm and asked for the buttons/popup to layer onto that, not onto a stack. The visual-companion side-by-sides made the comparison concrete.
- **Card grid (responsive 2–3 columns)** — what the rejected manila-folder gallery aimed at. Rejected again here: hides the body prose, fights the "continuous story the user tells through projects" intent from `[[Concept - Manila Folder Gallery]]` and `[[01 - Philosophy]]`.
- **Horizontal scroll deck** — explored mentally, not mocked. Rejected: wrong reading metaphor (linear narrative belongs in vertical scroll).
- **Magazine-spread with overlapping media** — too maximal. The aesthetic is restrained editorial, not high-design fashion editorial.

## Benefits

- The page reads as a deliberate spread instead of a list. Each chapter gets a moment to breathe.
- The alternation creates visual rhythm without requiring extra chrome (no decorative dividers, no oversized headers).
- Photo and text each get ~50% of available width, which is enough for both a meaningful cover image and a readable prose column.
- The mobile collapse is graceful: media-then-text every time, no awkward intermediate state.
- Adding a new project remains folder-additive — `index % 2` handles the side automatically.

## Harms / Tradeoffs

- More vertical height per project than the old card-stack equivalent (no surprise — alternation costs scroll). Mitigation: nothing — the user prefers reading length on this page over compression.
- The directional flip becomes invisible on narrow viewports, so on mobile the layout is no different from the rejected single-column stack. Acceptable: mobile readers are reading, not scanning the typography rhythm.
- Two columns slightly narrows the prose column on desktop, so the existing `max-width: 38rem` on `.project-story` may not always be the binding constraint. The grid's `1fr` track is already the tighter limit; the explicit max-width remains as a safety net.

## Revisit If

- Users report scroll fatigue on lists of 12+ projects.
- The page gains a hero/featured-project pattern that breaks the symmetry of alternation.
- A future redesign wants to bring back a card-grid index above the chapters (e.g., a small "jump to project" rail). Compatible with this layout but would require a separate decision.

## See also

- [[specs/2026-05-24-projects-page-redesign-design]] — the full design spec this implements.
- [[ADR-016 notes popup centered folio]] — sibling decision about the popup; both unlocked by the same brainstorm.
- [[ADR-017 story info mode toggle]] — sibling decision about page-mode swap.
- `src/components/project/ProjectChapter.astro` — implementation.
- `src/styles/projects.css` — the grid + alternation rules.
- `.superpowers/brainstorm/62648-1779612025/content/editorial-row.html` — original mockup.
