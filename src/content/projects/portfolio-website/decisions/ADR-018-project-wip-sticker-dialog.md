---
tags: [adr, projects-page, wip]
date: 2026-05-27
status: accepted
---

# ADR-018 — Project WIP sticker + dialog

**Status:** accepted  
**Date:** 2026-05-27

## Context

Several shipped or active projects need honest **work-in-progress** caveats (data quality, auth edge cases, portfolio itself still evolving). The editorial row has a large media column; without assets yet, the empty block still needs a visible affordance.

## Decision

- Add optional frontmatter: `wip: boolean`, `wip_note: string`.
- Render a tilted **WIP** sticker on the media column when both are set.
- Clicking opens a small centered dialog (`wip-dialog.ts`) with the note text — not the notes folio popup.

## Alternatives considered

1. **Inline disclaimer in info body only** — easy to miss; doesn't match the PDF's "sticker on photo" ask.
2. **Reuse notes popup** — wrong mental model (working notes vs caveat).
3. **Status badge only** — too quiet for longer caveats.

## Benefits

Honest signaling without cluttering the info paragraph. Reuses the paper-sticker visual language from the threshold tree hint.

## Harms / tradeoffs

Another dialog pattern to maintain. Sticker on empty media is slightly abstract (no photo yet) but still reads as "this row is WIP."

## Revisit if

Cover images ship and the sticker should anchor to a photo corner only, or WIP state moves to a single site-wide banner.
