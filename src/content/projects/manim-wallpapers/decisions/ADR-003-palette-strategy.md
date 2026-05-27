---
title: 'ADR-003: Palettes as Named Dataclass Instances'
tags: [adr, decision]
status: accepted
date: 2026-05-13
---

# ADR-003: Palettes as named dataclass instances

## Context

Wallpaper color choices need to be:

- **Coherent** within a scene — five tones that sit next to each
  other on the color wheel and share a value range.
- **Reusable** — the same wallpaper could be re-skinned with a
  different palette without changing motion code.
- **Documented** — the *why* of a color choice matters as much as
  the choice itself.

Manim ships with constants like `BLUE`, `GREEN`, `RED` etc.,
inherited from 3Blue1Brown's educational use. They're fine for
explanation videos, but as a wallpaper palette they're harsh —
saturated, not analogous, not designed to coexist.

## Decision

Define palettes as instances of a `Palette` dataclass in
`lib/palette.py`:

```python
@dataclass(frozen=True)
class Palette:
    name: str
    background: str       # single hex
    tones: tuple[str, ...]  # ordered deep→bright
    accent: str           # used sparingly
```

Four palettes are exposed as module-level constants: `FOREST`,
`AUTUMN`, `SUNFLOWER`, `NIGHT`. Each is documented at the source
with its visual intent.

The `Palette` class also provides:

- `palette.tone(t)` — snap to a discrete tone at normalized
  position `t ∈ [0,1]`.
- `palette.gradient(t)` — smoothly interpolate between adjacent
  tones (via the `lerp_hex` helper).

## Alternatives considered

1. **Use Manim's built-in color constants.** Rejected: not coherent.
   `BLUE` + `GREEN` + `RED` look like the default matplotlib pie
   chart, which is exactly what a wallpaper shouldn't look like.

2. **Inline hex colors per scene.** Rejected: each scene would
   reinvent its palette, and there's no shared place to document
   the *why* of a color choice.

3. **External JSON or TOML palette files.** Rejected for the size of
   this project: four palettes are easily inline; an external file
   adds a load step for negligible benefit.

4. **A palette-generation algorithm** (e.g. HSL-based programmatic
   harmony generation). Rejected: the hand-picked palettes are
   stronger visually than any generated set I've tried. Color theory
   helps you *avoid* mistakes but rarely helps you *find* great
   palettes from a cold start.

## Consequences

- Adding a new palette is one dataclass instance in
  `lib/palette.py`. Trivial.
- A scene swaps palettes by changing one import line.
- The `Palette` interface is stable enough that scenes don't need
  to know palette-specific details — only `bg = palette.background`
  and `color = palette.tone(t) | palette.gradient(t)`.
- The frozen=True ensures palettes can't be accidentally mutated
  at runtime. They are values, not state.
