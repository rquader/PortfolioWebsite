---
title: Aurora
tags: [manim, wallpaper, aurora, dark, vibrant]
---

# Aurora

Undulating northern-light ribbons over a star field. Dark navy background, vibrant emerald + cyan + violet + pink ribbons. The natural sibling to [[04_constellation]] but with color and motion in the foreground rather than just the stars.

- **Code:** `~/Developer/Manim_Wallpaper/scenes/aurora.py`
- **Scene class:** `AuroraWallpaper`
- **Render:** `~/Developer/Manim_Wallpaper/output/finals/06_aurora.mp4` (~3.4 MB)
- **Palette:** new `AURORA` palette — deep navy ground, emerald + cyan + violet + pink ribbons
- **Design rationale:** [[07_v2_concept_design#3 — Aurora Borealis (dark + vibrant)]]
- **Rendered:** 2026-05-17 (via `./render.sh scenes/aurora.py AuroraWallpaper -o 06_aurora`)

## What you see

Five ribbons of light flowing horizontally across the screen at different heights. Each ribbon is colored from a small bright palette (green, cyan, violet, pink) and undulates on its own rhythm — fast small folds within a slower large fold, like a real curtain of light. Behind, a sparse star field; a handful of stars are warm-cream-colored rather than white, breaking the cool palette just enough.

Soft glow on each ribbon — drawn in three overlapping passes (wide+faint halo, mid+medium, narrow+bright core) so the edges feather rather than line-cap.

## Concept

Real auroras are reflectance from charged particles hitting the upper atmosphere. They have folds-within-folds because the magnetic field lines guiding the particles undulate. The wallpaper captures the *folds-within-folds* visually with the simplest possible math: nested sine waves.

```
y = base_y + amp * sin(freq_1 * x + 2π * t * cycles_1 / D)
            + amp * 0.4 * sin(freq_2 * x + 2π * t * cycles_2 / D)
```

Two sines per ribbon, both seamless over the 12-s loop because `cycles_1` and `cycles_2` are integers. The slower spatial frequency gives the large fold; the faster one gives the wrinkles within.

## How it works

### Ribbon = polyline sampled along x

Each ribbon is a single `VMobject` with 140 corner points sampled evenly across the frame width. The y value at each point is the nested-sine formula above. Per frame: re-sample, call `set_points_as_corners(pts)`.

```python
def _sample_ribbon(self, r, t):
    pts = []
    for s in range(RIBBON_SAMPLES):
        x = -frame_w/2 + s * frame_w / (RIBBON_SAMPLES - 1)
        y = r.base_y + r.amp * math.sin(r.freq_primary * (s / RIBBON_SAMPLES) * 2π
                                        + 2π * t * r.time_cycles_primary / DURATION
                                        + r.phase_primary)
        y += r.amp * 0.4 * math.sin(...)
        pts.append([x, y, 0])
    return pts
```

### The glow — three overlapping passes

Manim doesn't support per-vertex alpha on a stroke, so a single line can't fade at its edges. Workaround: draw each ribbon three times, with different `(stroke_width, opacity)`:

```python
GLOW_LAYERS = (
    (32.0, 0.10),  # outer halo
    (18.0, 0.22),  # mid glow
    ( 7.0, 0.62),  # bright core
)
```

The outer pass is wide and very faint; subsequent passes are narrower and more opaque. The composite reads as a glowing line. Three passes is enough that a fourth doesn't visibly add anything — verified by toggling.

### Stars — same pattern as [[04_constellation]]

38 stars with rejection-sampled positions (`STAR_MIN_SPACING = 0.75`), per-star pulse (1–4 integer cycles per loop), 10% warm-color probability. Smaller and sparser than constellation's 60 — the aurora ribbons are the foreground and shouldn't compete.

### Ribbon time phases

```python
TIME_CYCLE_CHOICES = (1, 1, 2)
```

Each ribbon gets a randomly-chosen integer cycle count for its primary and secondary motion. Different ribbons cycle at different rates so the field never visually resyncs mid-loop.

## Parameters

| Name                          | Value                | Effect                                                              |
|-------------------------------|----------------------|---------------------------------------------------------------------|
| `NUM_RIBBONS`                 | 5                    | Number of aurora curtains. Higher = busier.                         |
| `RIBBON_SAMPLES`              | 140                  | Polyline resolution per ribbon. Higher = smoother curves.           |
| `GLOW_LAYERS`                 | 3 passes             | (stroke_width, opacity) for halo / mid / core.                      |
| `FREQ_PRIMARY_MIN/MAX`        | 1.2 / 2.6            | Spatial frequency (cycles across frame) for primary fold.           |
| `FREQ_SECONDARY_MIN/MAX`      | 3.0 / 5.5            | Spatial frequency for the inner wrinkle.                            |
| `AMP_MIN/MAX`                 | 0.45 / 1.10          | Per-ribbon vertical amplitude.                                      |
| `TIME_CYCLE_CHOICES`          | (1, 1, 2)            | Integer cycles per loop per ribbon (must be integer for seamless).  |
| `RIBBON_Y_RANGE`              | (-0.6, 2.4)          | Vertical span across which ribbons are placed.                      |
| `NUM_STARS`                   | 38                   | Background star count (sparser than constellation's 60).            |
| `STAR_MIN_SPACING`            | 0.75                 | Rejection-sampling minimum distance between stars.                  |
| `WARM_STAR_PROB`              | 0.10                 | Fraction of warm-color stars (#FFD27F).                             |
| `RIBBON_COLOR_INDICES`        | (2, 3, 4, 5)         | Indices into `AURORA.tones`: green / cyan / violet / pink.          |
| `RNG_SEED`                    | 91                   | Change for a different (reproducible) ribbon arrangement.           |

## Aesthetic decisions

- **5 ribbons, not 3 or 8.** 3 reads as sparse; 8 overwhelms. 5 fills the upper half without crowding.
- **Ribbons placed only in the upper 60% of the frame (`Y_RANGE = (-0.6, 2.4)`).** Real auroras are sky-anchored, not horizon-spanning. Leaves the lower frame for the deep navy ground and a sparse few stars.
- **Three glow passes with width ratios `~32:18:7`.** Empirically chosen. The 32/7 ratio gives a halo that's clearly wider than the core but doesn't make the entire frame washed-out.
- **Stars are sparser than [[04_constellation]].** That scene's whole point is the stars; this one's stars are a backdrop and shouldn't compete for attention.
- **Round-robin color assignment.** Ribbons assigned colors `[2, 3, 4, 5, 2, 3, 4, 5, ...]` across the field. Avoids accidentally clustering same-color ribbons next to each other.
- **No edges, no constellation lines.** [[04_constellation]] has edges; aurora doesn't. The ribbons are the structure; the stars are atmosphere.

## Performance notes

5 ribbons × 3 passes × 140 vertices = 2100 vertices recomputed per frame, plus 38 star opacity updates. ~50 second render at 2560×1664 / 60 fps. File size 3.4 MB.

`set_points_as_corners` is the hottest call — but for 420 calls per frame (5×3×... wait, no: 5 ribbons × 3 passes = 15 polyline updates per frame, each with `set_points_as_corners(140 points)`). Cheap.

## What I would try next

- **Audio reactivity.** Ribbons' amplitude or position driven by a low-frequency band of an audio source. Would need a non-static scene to begin with — this version is offline.
- **A single ribbon variant.** One huge slow-moving curtain across the whole upper sky. Different visual statement; might suit a more meditative tab.
- **Asymmetric color gradient along the ribbon length.** Currently each ribbon is one color end-to-end. Real auroras shade from one color at the bottom of the curtain to another at the top. Implementable with a multi-segment polyline + gradient interpolation.
- **Slow downward drift.** Whole field translates 0.05 units / sec downward over the loop, then wraps. Hard to do seamlessly without it looking like a glitch — defer.

## Relation to the portfolio site

The aurora scene is one of the candidate "additional scenes" mentioned in the portfolio's [[Portfolio_Website/decisions/ADR-005-tree-role-and-scene-engine|scene engine ADR]]. **It does not ship in V1.** The portfolio's V1 uses only the recursive tree backdrop ([[Portfolio_Website/Concept - Recursive Tree Backdrop]]). If a future iteration wants an additional generative section, aurora is a top candidate — port the algorithm (nested-sine polyline + glow passes) to canvas 2D following the same pattern as the tree port.

See [[03_process_log]] for the chronological build of v1 → v2 wallpapers.
