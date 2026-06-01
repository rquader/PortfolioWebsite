---
tags: [concept, primitive, color]
---

# Concept — Synesthesia Goals

> Hover-coloring on a small set of words inside the "on me" paragraph. Each chosen word reveals a site accent when the reader engages with it; the section takes a faint matching wash.

## What it is

Scoped to the user's bio in the **on me** section — not a site-wide grapheme-colour tab.

- One paragraph, a handful of `<span data-syn-word>` spans the author marks up.
- On engage (hover on desktop, tap on touch), the **whole word** takes one accent from the sepia palette; the section background shifts slightly toward that accent.
- **No per-letter colour table.** No inherited Legendary / Rimbaud / Sean Day palette.

The user picks which words. Suggested candidates: language from his stated objective — e.g. "meaningful," "applications," "nudging" — but any words are fine.

## Why

*Words carry hidden weight* — here applied only to values and goals the author flags. Less spectacle than a colour chart; more intent. The reader is invited to interact with what matters to him.

## Algorithm

### Accent slots (0–3)

Each word maps to a slot via `data-syn-slot="0|1|2|3"` (or auto-cycles by DOM order). Slots are **CSS only**, wired to design tokens on `.on-me`:

| Slot | Token |
|------|--------|
| 0 | `--accent-warm` |
| 1 | `--accent-glow` |
| 2 | `--accent-pale` |
| 3 | `--accent` |

Light and dark modes follow `tokens.css`; the primitive does not ship hex tables.

### Engage behaviour

```ts
// pointerenter (desktop) or click (touch / coarse pointer):
word.setAttribute('data-syn-active', '');
section.classList.add('syn-tinted');
section.setAttribute('data-syn-active-slot', slot);

// pointerleave: 700ms grace, then clear section tint.
// touch: tap word toggles; tap outside clears.
```

CSS transitions the section `background-color` (~1.2s) and the word `color` / underline. Reduced motion: drop transitions; colour change remains.

### What we do *not* do

- No 26-letter `synColors` map.
- No averaging letter RGB for the room tint.
- No letter spans for colour reveal (word-level only).
- No spectrum strip (deferred; would read as a teaching aid on a personal statement).

## DOM model

```html
<p>
  … participate in
  <span data-syn-word data-syn-slot="2">meaningful</span>
  endeavors …
</p>
```

## Module shape

```ts
// src/lib/primitives/synesthesia.ts
export interface SynesthesiaHandle { stop(): void }
export function initSynesthesia(section: HTMLElement): SynesthesiaHandle
```

Called once on `#on-me`. Inert elsewhere.

## Related primitives

- **Inertial headings** (`data-color-letters`) use the **current section accent** (`--companion-color` from scroll-spy), not a letter palette.
- **Obsidian bolds** share the inertial colour-only path; same section accent.

## Edge cases

- Adjacent words: 700ms grace on leave.
- Touch: tap-to-toggle; tap outside deactivates.
- Theme toggle: active word re-applies (tokens update via CSS).
- Reduced motion: no background transition; word colour still updates.

## See also

- [[03 - Content Model#on me]]
- [[Concept - Inertial Headings]]
- [[decisions/ADR-007-palette-sepia-shift]]
