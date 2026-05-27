---
title: Constellation
tags: [manim, wallpaper, lockscreen, stars]
---

# Constellation

Twinkling stars on a deep navy field, connected by lines that fade in
and out. Intended for lockscreen use — quiet, dark, won't fight a
clock or notification overlay.

- **Code:** `~/Developer/Manim_Wallpaper/scenes/constellation.py`
- **Scene class:** `ConstellationWallpaper`
- **Render:** `~/Developer/Manim_Wallpaper/output/finals/04_constellation.mp4` (948 KB)
- **Palette:** [[02_design_principles#NIGHT — lockscreen theme (constellation)|NIGHT]]

## What you see

60 stars (Dots) of varying sizes and brightness on a near-black navy
field. Each star pulses gently. Lines connect each star to its
nearest neighbors; the lines fade in and out independently, so
patterns of "constellations" appear and dissolve.

## Concept

Real constellations are arbitrary — humans drew them; they aren't
clusters by any astronomical measure. So the algorithm is *also*
arbitrary: each star is connected to its 2 nearest neighbors, with
duplicate edges removed. The result reads as a graph that *could be*
constellations.

The fading is what sells the wallpaper: at any moment, only some
edges are visible, so the "constellation" you see shifts continuously
without anything actually moving in space. Very lockscreen-appropriate
— eye-catching but not jittery.

## How it works

### Star placement (Poisson-disk-ish)

Pure-uniform random clumps badly. The fix is rejection sampling: try
a random position, accept it only if it's at least `MIN_STAR_SPACING`
from every existing star.

```python
while len(stars) < NUM_STARS and attempts < max_attempts:
    x, y = rng.uniform(...), rng.uniform(...)
    if all(math.hypot(x - s.pos[0], y - s.pos[1]) >= MIN_STAR_SPACING for s in stars):
        stars.append(_Star(...))
```

This is the cheap approximation of Bridson's Poisson-disk sampling.
It gives evenly-spread stars without anything as elaborate as a
proper kD-tree. For 60 stars on a 12×8 canvas, it terminates in
~100 attempts.

### Edge construction (k-nearest neighbors, deduplicated)

For each star, find its 2 closest neighbors. Add `(min(i,j), max(i,j))`
to a `seen` set; skip if already present. Result: each edge appears
exactly once.

```python
for i, s in enumerate(stars):
    ranked = sorted(((j, dist(i, j)) for j in range(N) if j != i), key=...)
    for j, _ in ranked[:NEAREST_NEIGHBORS]:
        key = (min(i, j), max(i, j))
        if key not in seen:
            seen.add(key)
            edges.append(_Edge(...))
```

O(N²) for N=60 is 3600 comparisons — instantly fast.

### Star pulse (per-star sine)

Each star's opacity oscillates between `(1 - amp)` and `1` on its own
period and phase:

```python
period = DURATION / pulse_cycles    # cycles ∈ {1, 2, 3, 4}
pulse_01 = 0.5 + 0.5 * sin_wave(t, period, phase=pulse_phase)
dot.set_fill(opacity=(1 - amp) + amp * pulse_01)
```

Independent phases mean stars twinkle in their own rhythms — no
synchronized strobing. Integer cycle counts mean every star is at
exactly the same opacity at `t = 0` and `t = DURATION`.

### Edge fade (per-edge smooth_loop)

Each edge fades in and back out using a raised cosine over its own
period:

```python
period = DURATION / cycles    # cycles ∈ {1, 1, 2}
fade = smooth_loop(t + phase * period, period)
line.set_stroke(opacity=EDGE_MAX_OPACITY * fade)
```

`smooth_loop` is 0 at both ends of each period, peaks at 0.5*period.
With the phase offset, different edges peak at different times.

## Parameters

| Name                       | Value                          | Effect                                                                                |
|----------------------------|--------------------------------|---------------------------------------------------------------------------------------|
| `NUM_STARS`                | 60                             | Total stars. Higher = busier scene.                                                   |
| `MIN_STAR_SPACING`         | 0.85                           | Rejection-sampling minimum distance. Drives the "evenly spread" feel.                 |
| `SAMPLING_MARGIN`          | 0.45                           | Distance from frame edge stars are allowed.                                           |
| `NEAREST_NEIGHBORS`        | 2                              | Each star connects to k neighbors; dedup → ~70–80 unique edges.                       |
| `STAR_SIZE_MIN/MAX`        | 0.025 / 0.080                  | Range of star sizes.                                                                  |
| `WARM_STAR_PROB`           | 0.12                           | Fraction of stars using the warm accent color.                                        |
| `PULSE_AMP_MIN/MAX`        | 0.12 / 0.45                    | Per-star opacity oscillation range.                                                   |
| `PULSE_CYCLE_CHOICES`      | (1, 2, 3, 4)                   | Per-star pulse cycle counts.                                                          |
| `EDGE_MAX_OPACITY`         | 0.34                           | Peak opacity for edge lines — low, so they read as delicate threads.                  |
| `EDGE_STROKE_WIDTH`        | 1.6                            | Line stroke width.                                                                    |
| `EDGE_CYCLE_CHOICES`       | (1, 1, 2)                      | Per-edge fade cycle counts.                                                           |
| `EDGE_COLOR`               | `NIGHT.tones[3]` (`#A5BEDC`)   | Pale cool blue.                                                                       |
| `RNG_SEED`                 | 137                            | Change for a different (reproducible) star field.                                     |

## Aesthetic decisions

- **K=2 nearest, not Delaunay or MST.** Delaunay gives ~6 edges per
  star, way too busy. MST gives a single connected tree, too rigid.
  K=2 produces a graph that's sparse, ambiguous about which edges go
  where, *and* allows for the satisfying visual of small triangles
  (3 stars mutually each in each other's top-2). See [[03_process_log#8. Wallpaper 4 Constellation lockscreen]].
- **Warm accent stars at 12% probability.** ~7 out of 60. Visible
  enough to register, rare enough to feel like accents rather than
  pattern.
- **Slow pulses, low edge opacity.** A lockscreen wallpaper plays
  while you stop looking at the screen. Hyperactivity is exactly
  wrong here.
- **Stars sit on top of edges in z-order.** The `VGroup(*edges,
  *stars)` order puts stars later, so they paint over the lines —
  reads as "line connects two stars" rather than "line passes
  through a star."

## Performance notes

60 stars + ~75 edges × 720 frames. Per-frame work is tiny — ~135
`set_fill` / `set_stroke` calls. Render took ~45 seconds. File size
948 KB — the smallest, because sparse moving content compresses
extremely well.

## What I would try next

- **Subtle drift** — let stars slowly translate (with integer-cycle
  paths) so the constellation map itself is gently evolving. Tricky
  because the edges would also have to update endpoints every frame.
- **Shooting stars** — rare, periodic. A small streak that fades from
  one position to another every N seconds. Would need careful tuning
  to ensure the streak doesn't appear at the loop boundary.
- **Nebula glow** — a few large, very transparent dots in warm
  colors as a "background atmosphere" layer. Risk of fighting the
  delicate-line aesthetic.

See [[03_process_log#8. Wallpaper 4 Constellation lockscreen]] for
the chronological account.
