---
title: Architecture Decision Records
sort_order: -1
tags: [adr, index]
---

# Architecture Decision Records

> Records of every non-trivial decision in the portfolio project, with explicit benefits and harms. Required by [[../Working Agreements#1. Tradeoff documentation is mandatory]]. Same pattern as [[Manim_Wallpaper/decisions/_index|the Manim_Wallpaper ADRs]].

## Index

| # | title | status |
|---|---|---|
| 001 | [[ADR-001-tech-stack-astro]] | accepted |
| 002 | [[ADR-002-hosting-cloudflare-pages]] | accepted |
| 003 | [[ADR-003-content-pipeline-curated-not-vault-link]] | accepted |
| 004 | [[ADR-004-tree-backdrop-canvas-vs-mp4]] | accepted |
| 005 | [[ADR-005-tree-role-and-scene-engine]] | accepted |
| 006 | [[ADR-006-aesthetic-primitives-inherited-and-cut]] | accepted |
| 007 | [[ADR-007-palette-sepia-shift]] | accepted |
| 013 | [[ADR-013-personal-photo-threshold-print]] | accepted |
| 015 | [[ADR-015-editorial-alternating-layout]] | accepted |
| 016 | [[ADR-016-notes-popup-centered-folio]] | accepted |
| 017 | [[ADR-017-story-info-mode-toggle]] | accepted |
| 018 | [[ADR-018-project-wip-sticker-dialog]] | accepted |
| 019 | [[ADR-019-project-media-carousel]] | accepted |
| 020 | [[ADR-020-notes-popup-folder-tree]] | accepted |

## ADR format

```
# ADR-NNN — <title>

**Status:** proposed | accepted | superseded by ADR-XXX
**Date:** YYYY-MM-DD

## Context
<the situation that prompted the decision>

## Decision
<what was chosen>

## Alternatives Considered
<at least two, with one-paragraph why-not each>

## Benefits
<what we gain>

## Harms / Tradeoffs
<what we give up>

## Revisit If
<concrete future conditions>
```

## When to write a new ADR

For: stack choices, content pipeline shape, primitive inclusion/exclusion, performance vs. fidelity, format choices that have reasonable alternatives.

Skip: small obvious choices (CSS variable naming, helper file location).
