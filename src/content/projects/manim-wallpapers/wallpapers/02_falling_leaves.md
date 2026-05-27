---
title: Falling Leaves
tags: [manim, wallpaper, natural, leaves]
---

# Falling Leaves

A field of stylized leaves drifts gently downward across three depth
layers. Bright autumn-meets-spring colors on a deep evergreen field.

- **Code:** `~/Developer/Manim_Wallpaper/scenes/falling_leaves.py`
- **Scene class:** `FallingLeavesWallpaper`
- **Render:** `~/Developer/Manim_Wallpaper/output/finals/02_falling_leaves.mp4` (1.8 MB)
- **Palette:** [[02_design_principles#AUTUMN — natural theme (falling leaves)|AUTUMN]]

## What you see

95 elliptical leaves at varying sizes and orientations falling slowly
through the frame. They sway side-to-side as they fall; some slowly
rotate. The field is continuous — leaves exit the bottom and re-enter
the top.

## Concept

The user asked specifically for "bright natural colors like leaves
and landscapes." A literal landscape doesn't fit Manim's strengths,
but falling leaves do: they're elements that can be programmed with
trivial state per element, parallelize visually into a "field," and
naturally loop if the speeds are commensurate with the loop length.

## How it works

### Three depth layers for parallax

Each leaf is assigned to one of three layers via a weighted random
draw:

| Layer  | Weight | Size range | Opacity |
|--------|--------|------------|---------|
| Back   | 40%    | 0.12–0.22  | 0.42    |
| Mid    | 35%    | 0.22–0.36  | 0.66    |
| Front  | 25%    | 0.36–0.52  | 0.92    |

The depth read comes from size + opacity together — small + dim = far,
large + opaque = near. Manim has no actual z-buffer at the rendering
layer, but at the perceptual layer this is enough to feel like
parallax.

### Seamless motion via integer cycle counts

Each leaf has three independent motion components:

```python
# Vertical fall: linear wrap, integer cycles per loop
progress = (base_progress + fall_cycles * t / DURATION) % 1.0
y = top_y - progress * span

# Horizontal sway: sine, integer cycles per loop
x = base_x + SWAY_AMP * sin_wave(t, DURATION / sway_cycles, phase=sway_phase)

# Rotation: integer (can be 0) cycles per loop, applied as delta
desired = tilt + 2π * rot_cycles * (t / DURATION) + rot_phase
mob.rotate(desired - applied_angle)
applied_angle = desired
```

Every cycle count is drawn from a small set of integers:

- `fall_cycles ∈ {1, 1, 1, 1, 2, 2, 3}` — most leaves fall once per
  loop, some twice, occasionally three times.
- `sway_cycles ∈ {1, 1, 2}` — mostly 1.
- `rot_cycles ∈ {-1, 0, 0, 0, 1}` — most leaves don't rotate;
  some rotate slowly, a few the other way.

The weighted distribution biases toward calm motion (single-cycle
falls, no rotation) while keeping enough variety that no two leaves
look identical.

### Why rotation is applied as a delta

`Mobject.rotate(theta)` adds `theta` to the current rotation; it does
not set the absolute rotation. So the per-frame work is:

```python
delta = desired_absolute_angle - self._current_angle
self.mob.rotate(delta)
self._current_angle = desired_absolute_angle
```

`_LeafSprite` encapsulates this — a small wrapper class that owns
both the `Ellipse` mobject and the `_current_angle` state. See
[[decisions/ADR-006-rotation-delta-pattern]] for the full reasoning.

## Parameters

| Name                       | Value                    | Effect                                                                  |
|----------------------------|--------------------------|-------------------------------------------------------------------------|
| `NUM_LEAVES`               | 95                       | Total leaf count.                                                       |
| `LAYER_COUNT_WEIGHTS`      | (0.40, 0.35, 0.25)       | Back / mid / front distribution.                                        |
| `LAYER_SIZE_RANGES`        | see table above          | Per-layer size range.                                                   |
| `LAYER_OPACITY`            | (0.42, 0.66, 0.92)       | Per-layer opacity — drives the depth read.                              |
| `LEAF_ASPECT`              | 0.40                     | Ellipse height/width. Lower = more sliver-like.                         |
| `FALL_CYCLE_CHOICES`       | (1, 1, 1, 1, 2, 2, 3)    | Per-leaf fall cycles (weighted bag).                                    |
| `SWAY_AMP`                 | 0.42                     | Sway amplitude in frame units (~5% of frame width).                     |
| `SWAY_CYCLE_CHOICES`       | (1, 1, 2)                | Sway cycle counts (weighted bag).                                       |
| `ROT_CYCLE_CHOICES`        | (-1, 0, 0, 0, 1)         | Rotation cycle counts. Negative = opposite direction.                   |
| `RNG_SEED`                 | 73                       | Change for a different (reproducible) leaf field.                       |

## Aesthetic decisions

- **Ellipses, not leaf-shaped polygons.** At wallpaper viewing
  distance, a leaf-shape silhouette is barely distinguishable from
  an oval. The abstraction stays appropriate for "wallpaper" rather
  than "icon."
- **Two greens in the palette** — `#3D5A3F` (mossy) and `#7BA05B`
  (fresh leaf). Without these the palette would feel locked to
  autumn-end. The greens make it feel "alive."
- **No wind-burst events.** Considered a periodic gust where leaves
  briefly accelerate. Rejected: gusts are dramatic, not calm. The
  point of a wallpaper is to *not* demand attention.

## Performance notes

95 ellipse mobjects × 720 frames. Each ellipse has ~64 vertices, so
~6000 vertex updates per frame. Numpy + Manim's Cairo backend handle
this comfortably; render took ~1 minute. File size 1.8 MB — small
because the motion is slow and the bg is uniform, so h264 temporal
compression works well.

## What I would try next

- **Stylized leaf SVG paths** as VMobjects, scaled and rotated. Would
  trade some render speed for shape identity.
- **Subtle horizon gradient** — a faint warm glow at the bottom, very
  dark at the top, suggesting "forest at dusk." Risk: fights with
  menu bar legibility.
- **Per-leaf color drift over time** — leaves slowly shifting from
  green to amber to red as they fall, mimicking seasonal change.
  Tricky to keep seamless; the colors would have to come back around
  every loop.

See [[03_process_log#6. Wallpaper 2 Falling leaves]] for the
chronological account.
