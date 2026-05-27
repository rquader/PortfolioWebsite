---
tags: [adr, palette, redesign]
---

# ADR-007 — Palette shift: warm-paper-on-ink → parchment + autumn-sepia (two modes)

**Status:** accepted
**Date:** 2026-05-19

## Context

Phase 4 shipped the warm-paper-on-ink palette inherited from [[Legendary UI-UX/Legendary UI-UX]] — `--ink-0: #0A1620` deep-navy bg, `--paper-0: #E8DEC5` warm-cream text, FOREST-palette green-teal accents tied to the recursive tree canvas. The user asked for a brighter, sepia-leaning, softer aesthetic with an optional dark mode and "nicer fonts" — see [[Process Journal#2026-05-19 · morning · Phase 5 — sepia redesign begin]].

## Decision

Replace FOREST with a two-mode autumn-sepia palette. Light mode is the new default; dark is a user-toggle (see [[decisions/ADR-009-light-dark-mode-toggle]]).

| token | light | dark |
|---|---|---|
| `--bg-0` (body) | `#F5EAD4` parchment | `#1F1812` deep walnut |
| `--bg-1` (lifted) | `#ECDDC0` | `#2A201A` |
| `--text-0` (primary) | `#3A2615` walnut | `#ECDEC5` warm cream |
| `--text-1` (secondary) | `#5C3C20` | `#C9B796` |
| `--accent` | `#7A3E1C` terracotta | `#E08A52` amber |
| `--accent-warm` | `#A04A2A` burnt sienna | `#C46B45` |
| `--accent-glow` | `#D8853E` ochre | `#E8C078` |
| `--tree-branch` | `#5C3C20` | `#A88160` |
| `--tree-leaf-{1..5}` | walnut → ochre → amber | terracotta-warm → honey → ochre-light |

Per-section accents (`--accent-on-me`, `--accent-on-the-work`, etc.) are re-mapped to siblings in the new family.

## Alternatives Considered

- **B · bone / ink / burnt sienna** — quieter, less saturated. Read as "printed novel." Rejected: too quiet to carry a portfolio's emotional register.
- **C · cream / cocoa / amber** — most warm-bright. Brighter still, more golden. Rejected: cocoa text felt slightly less authoritative than walnut.
- **D · linen / clay / burnished gold** — refined, restrained. Rejected: too cool/muted; lost the sepia warmth.
- **Keep FOREST + dial brightness** — minimal change. Rejected: doesn't honor the explicit "more sepia" ask.

## Benefits

- Genuine warmth + brightness. Light mode reads as cream-and-walnut, not navy.
- Tree backdrop becomes thematically coherent (autumn tree on parchment, vs forest tree on ink — the former is a *botanical illustration*, the latter is *night-watch*).
- Dark mode preserves the "lit-from-within" feel for users who prefer it.
- The walnut text + terracotta accent gives strong contrast (AA on body, AAA on accent) without the cold-vs-warm tension the old FOREST/cream pairing had.

## Harms / Tradeoffs

- Every Phase-4 stylesheet referenced legacy tokens (`--ink-0`, `--paper-0`, `--forest-accent`, etc.). Mitigation: tokens.css ships **legacy aliases** mapping old names to new tokens, so no component CSS needs to change in Phase 5. A future Phase 6 cleanup will migrate consumers to the semantic names and remove the aliases.
- Synesthesia letter palette had to be duplicated (see [[decisions/ADR-010-tree-slider-labels|ADR-010]] for slider labels; synesthesia-dual-palette tracked in the Process Journal — formal ADR pending).
- FOREST is no longer the canvas default. `palettes.ts` retains it as a backward-compat path; new mounts use `'sepia'` and pick light/dark via `currentSepiaPalette()`.

## Revisit If

- The walnut text contrast feels insufficient on smaller screens (reconsider `#3A2615` → deeper).
- A future palette pass wants to extend the accent range (e.g., a moss-green for a "trail" section). Already plausible — tokens.css has `--accent-pale` reserved.

## See also

- [[01 - Philosophy]] — where the aesthetic comes from (updated in this phase).
- [[02 - Architecture#tokens.css]] — the file's role + structure.
- [[decisions/ADR-006-aesthetic-primitives-inherited-and-cut]] — the prior aesthetic decisions this supersedes.
- `src/styles/tokens.css` — the implementation.
