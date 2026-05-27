---
title: Phyllotaxis
tags: [manim, wallpaper, best, math, nature]
---

# Phyllotaxis

A sunflower-style seed head built from the Vogel model. The full
pattern is visible from t=0 and rotates exactly once per loop. This
is the wallpaper aimed at "best designed."

- **Code:** `~/Developer/Manim_Wallpaper/scenes/phyllotaxis.py`
- **Scene class:** `PhyllotaxisWallpaper`
- **Render:** `~/Developer/Manim_Wallpaper/output/finals/03_phyllotaxis.mp4` (12 MB)
- **Palette:** [[02_design_principles#SUNFLOWER — best-designed theme (phyllotaxis)|SUNFLOWER]]

## What you see

A dense radial pattern of ~1500 small dots arranged in interleaving
Fibonacci-related spiral arms, centered on the frame. The pattern
gradates from deep umber at the center to bright cream at the rim.
The whole thing rotates slowly — one full turn over the 12-second
loop.

## Concept

[Helmut Vogel, 1979] published a closed-form model for sunflower seed
arrangement:

    theta_n = n × GOLDEN_ANGLE    where GOLDEN_ANGLE = 360° × (1 − 1/φ) ≈ 137.5077640500378°
    r_n     = c × √n              (Archimedean spacing)

This is the densest disk packing with **no rotational symmetry** —
which is exactly why it works for plants. With a rational angle,
seeds would line up into easily-eaten radial rows; with the golden
angle (the "most irrational" number, in a precise sense via continued
fractions), they never align, packing dense.

The Fibonacci-related spiral arms you can see in the rendered image
aren't drawn explicitly — they emerge as the pattern's natural visual
structure, because the closest neighbors of any seed lie along arms
whose count is a Fibonacci number (typically 21 and 34 for this
density).

This is one of the most-replicated math-meets-nature patterns in
generative art for a reason: the math is elementary, the result is
gorgeous, and the connection to biology is real.

See [[credits/vogel_phyllotaxis]] for the source attribution.

## How it works

### Generate seed positions

```python
GOLDEN_ANGLE = math.radians(137.5077640500378)

for n in range(1, N_SEEDS):
    theta = n * GOLDEN_ANGLE
    r = RADIUS_SCALE * math.sqrt(n)
    x, y = r * math.cos(theta), r * math.sin(theta)
```

Skip `n = 0` so we don't draw a dot exactly at the origin that would
visually fight the spiral's natural center.

### Per-seed color and size

`t = n / (N - 1)` is 0 for the innermost seed, 1 for the outermost.
Use it to interpolate size, opacity, and color:

```python
size    = SEED_RADIUS_INNER * (1 - t) + SEED_RADIUS_OUTER * t
opacity = SEED_OPACITY_INNER * (1 - t) + SEED_OPACITY_OUTER * t
color   = SUNFLOWER.gradient(t)   # linear lerp across palette tones
```

The outward brightness mirrors real sunflower seed-head physiology:
the center holds the youngest, less-pigmented seeds; the rim holds
the mature, pigment-laden ones.

### Seamless rotation

The whole pattern is a single `VGroup`. Once per loop, it rotates by
exactly one full revolution:

```python
target = ROTATION_CYCLES * angular_loop(t, DURATION)
group.rotate(target - applied, about_point=ORIGIN)
applied = target
```

`ROTATION_CYCLES = 1` over `DURATION` gives a 30°-per-second rotation
at the rim. Slow enough to feel meditative; fast enough to be
unmistakably animated.

The delta-rotation pattern (apply `target - applied` rather than just
setting an absolute angle) avoids accumulated floating-point drift
across 720 frames. See [[decisions/ADR-006-rotation-delta-pattern]].

## Parameters

| Name                       | Value                              | Effect                                                                                  |
|----------------------------|------------------------------------|-----------------------------------------------------------------------------------------|
| `N_SEEDS`                  | 1500                               | Total seed count. Higher = denser rim.                                                  |
| `GOLDEN_ANGLE`             | 137.5077640500378° in radians      | The mathematical constant. **Do not change.**                                           |
| `RADIUS_SCALE`             | 0.092                              | Outer radius = scale × √N_SEEDS ≈ 3.56 (just inside frame_height/2 = 4).                |
| `SEED_RADIUS_INNER`        | 0.042                              | Size of seeds near the center.                                                          |
| `SEED_RADIUS_OUTER`        | 0.078                              | Size of seeds at the rim.                                                               |
| `SEED_OPACITY_INNER`       | 0.78                               | Opacity at center — dimmer because the seeds are denser there.                          |
| `SEED_OPACITY_OUTER`       | 0.96                               | Opacity at rim — nearly opaque, "lit up."                                               |
| `ROTATION_CYCLES`          | 1                                  | Full revolutions per loop. Must be an integer for seamless.                             |

## Aesthetic decisions

- **Centered, not off-center.** A radial pattern reads as "centered"
  even when nudged off — but a sunflower-head specifically benefits
  from sitting on the visual axis. The empty space around the pattern
  is the wallpaper's negative space and helps the menu bar / dock.
- **Outer rim slightly larger and brighter than center.** This matches
  real sunflower biology AND gives the wallpaper a quiet "halo"
  effect.
- **One rotation per loop, not two or three.** Two rotations are
  measurably faster but feel hyperactive on a wallpaper. One is
  meditative.
- **Smooth gradient via `Palette.gradient()`, not stepped tones.**
  Stepping the colors would create visible color bands at certain
  radii, undermining the continuous-spiral read.

## Performance notes

1500 `Dot` mobjects, each with ~12 vertices. Per-frame rotation is
implemented as a single `VGroup.rotate()` call which transforms all
~18000 points via matrix multiplication in numpy. Render took ~3
minutes.

File size is 12 MB — the largest of the four. The reason: every dot
moves every frame, so h264's frame-difference compression has the
maximum amount of changed pixels to encode. The wallpaper's underlying
*information* is small (1500 dots' positions + rotation); the *frame
sequence* doesn't reflect that.

## What I would try next

- **Subtle per-seed breathing** — each seed scales by ±5% on a
  sine-wave breath with seeded phase. Tested mentally; rejected for
  v1 because applying a per-seed transform every frame to 1500 dots
  adds ~30 ms/frame on this machine. Would need either GPU shaders
  (not Manim's lane) or a batch-scaling trick using numpy directly
  on the mobject points array.
- **Two superimposed phyllotaxes** at different radii / rotation
  speeds — could be gorgeous but flirts with the "one focal pattern"
  principle from [[02_design_principles#V. Composition]].
- **Higher `N_SEEDS`** — at 3000 the rim becomes a near-continuous
  ring. Slower render but visually richer.

See [[03_process_log#7. Wallpaper 3 Phyllotaxis spiral]] for the
chronological account.
