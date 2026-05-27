---
title: Manim Wallpaper — Map of Content
tags: [manim, wallpaper, moc]
---

# Manim Wallpaper — Map of Content

The entry point. If you're new to this project, follow the suggested
reading order. If you're returning, jump to whatever section you need.

## Suggested reading order

1. [[README]] — what this project is, in 60 seconds.
2. [[01_architecture]] — code structure, the two laws every scene follows.
3. [[02_design_principles]] — visual + technical principles.
4. [[03_process_log]] — chronological log of decisions, hurdles, and lessons.
5. [[04_replication_guide]] — recipe for adding a fifth wallpaper.
6. [[05_render_pipeline]] — what each Manim CLI flag does and why.

## The four wallpapers (v1)

- [[wallpapers/01_recursive_tree]] — CS theme, a swaying recursive tree.
- [[wallpapers/02_falling_leaves]] — natural, parallax falling leaves.
- [[wallpapers/03_phyllotaxis]] — best-designed, golden-angle spiral.
- [[wallpapers/04_constellation]] — lockscreen, twinkling stars + edges.

## The v2 wallpapers (added 2026-05-17)

Design rationale for the v2 set: [[07_v2_concept_design]]. Two of four shipped.

- [[wallpapers/05_recursive_tree_v2]] — deeper recursive tree, real leaf polygons, dual-frequency sway, drifting pollen. The signature scene; source-of-truth for the [[Portfolio_Website/Concept - Recursive Tree Backdrop|portfolio's TypeScript canvas port]].
- [[wallpapers/06_aurora]] — northern-light ribbons over a star field. Nested-sine polylines with three-pass glow.

### Designed but not yet coded

- **Golden Hour Mountains** — see [[07_v2_concept_design#2 — Golden Hour Mountains (bright landscape, popular subject)]]. No `scenes/golden_hour_mountains.py` exists yet; would use the `DAWN` palette (already added to `lib/palette.py`).
- **Wildflower Meadow** — see [[07_v2_concept_design#4 — Wildflower Meadow (bright, lively, addresses "bright natural")]]. No `scenes/wildflower_meadow.py` exists yet; would use the `MEADOW` palette (already added to `lib/palette.py`).

Building these is straightforward (each is 200–400 lines following the patterns the existing scenes already establish) but neither was a priority for the 2026-05-17 pass.

## The v3 backdrops (added 2026-05-17, evening)

Designed for sitting *behind text* on the portfolio site, not as standalone wallpapers. See [[08_backdrop_concepts]] for the full design rationale and the constraint comparison v1/v2 → v3.

- [[wallpapers/07_network_nodes]] — sparse graph + occasional message dots. Coded, rendered, ready. Target use: portfolio's "on the work" section (DDD research).
- **drift_field** (`scenes/drift_field.py`) — stub scene, coded but unrendered. The minimal fallback backdrop: just particles drifting. See [[08_backdrop_concepts#2 — Drift Field]].
- **aurora_subtle** (`scenes/aurora_subtle.py`) — stub config only, not directly runnable until `aurora.py` is refactored to accept a config dataclass. See [[08_backdrop_concepts#3 — Subtle Aurora Variant]].

## Credits

- [[credits/_index]] — sources and inspirations, with notes on how each
  was used.

## Decision records (ADRs)

- [[decisions/_index]] — every non-obvious design or architectural
  choice, with the reasoning behind it.

## Inspirations

- [[inspirations/_index]] — works that informed the look and approach.

---

## Sibling project

- [[Portfolio_Website/00 - Index|Portfolio Website]] — Rafan's portfolio site. Uses the [[wallpapers/05_recursive_tree_v2|recursive tree v2]] algorithm, ported to TypeScript canvas-2D, as its signature backdrop. The Manim repo is the source of truth for the algorithm; the site does NOT ship the MP4. See [[Portfolio_Website/decisions/ADR-004-tree-backdrop-canvas-vs-mp4]] for the rationale.

## File map

```
.
├── 00_index.md                  ← you are here
├── README.md
├── 01_architecture.md
├── 02_design_principles.md
├── 03_process_log.md
├── 04_replication_guide.md
├── 05_render_pipeline.md
├── 06_wallpaper_design_research.md
├── 07_v2_concept_design.md
├── 08_backdrop_concepts.md           ← v3 design conversation
├── wallpapers/
│   ├── 01_recursive_tree.md
│   ├── 02_falling_leaves.md
│   ├── 03_phyllotaxis.md
│   ├── 04_constellation.md
│   ├── 05_recursive_tree_v2.md      ← v2
│   ├── 06_aurora.md                  ← v2
│   └── 07_network_nodes.md           ← v3 backdrop
├── credits/
│   ├── _index.md
│   ├── manim_community.md
│   ├── vogel_phyllotaxis.md
│   ├── lindenmayer_lsystems.md
│   └── wallspace_app.md
├── decisions/
│   ├── _index.md
│   ├── ADR-001-resolution-and-aspect.md
│   ├── ADR-002-seamless-loops.md
│   ├── ADR-003-palette-strategy.md
│   ├── ADR-004-lib-vs-package-structure.md
│   ├── ADR-005-tree-flat-list-vs-nested-vgroups.md
│   ├── ADR-006-rotation-delta-pattern.md
│   └── ADR-007-render-config-pattern.md
└── inspirations/
    └── _index.md
```
