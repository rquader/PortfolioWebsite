---
title: Recursive Tree
tags: [manim, wallpaper, cs, tree]
---

# Recursive Tree

A swaying recursive fractal tree on a deep ocean-teal field. The CS
reference is unambiguous (recursion + L-systems), but the visual reads
as a tree first.

- **Code:** `~/Developer/Manim_Wallpaper/scenes/recursive_tree.py`
- **Scene class:** `RecursiveTreeWallpaper`
- **Render:** `~/Developer/Manim_Wallpaper/output/finals/01_recursive_tree.mp4` (3.6 MB)
- **Palette:** [[02_design_principles#FOREST — CS theme (recursive tree)|FOREST]]

## What you see

A leafless-ish (canopy implied by small accent dots) tree, fully formed
from frame 0, swaying gently in a breeze that travels visibly up the
trunk to the canopy. Two full sway cycles over the 12-second loop.

## Concept

Recursion is the first-year CS topic most students *struggle with*
before it clicks. A binary recursive tree is the canonical visual
example: each branch is itself a smaller tree, rotated and scaled.

The wallpaper presents the recursion in full — every branch visible
simultaneously — so the structure reads as the shape, not as something
unfolding over time.

## How it works

### Build the tree once

The tree is generated via a depth-first recursion that appends a
`_Branch` dataclass to a flat list:

```python
def recurse(parent_idx, length, rel_angle, depth):
    if depth > MAX_DEPTH or length < 0.05:
        return
    branches.append(_Branch(parent_idx, rel_angle, length, depth, ...))
    this_idx = len(branches) - 1
    # two children with seeded jitter
    recurse(this_idx, length * SHRINK * jitter_L, +ANGLE + jitter, depth + 1)
    recurse(this_idx, length * SHRINK * jitter_R, -ANGLE + jitter, depth + 1)
```

Why a flat list instead of nested `VGroup`s: see
[[decisions/ADR-005-tree-flat-list-vs-nested-vgroups]].

### Resolve to world space every frame

Because branches are stored *relative to parent* and DFS construction
guarantees a parent's index is lower than its children's, a single
forward pass computes world positions:

```python
for i, b in enumerate(branches):
    sway = sin_wave(time, SWAY_PERIOD, phase=b.depth * SWAY_PHASE_PER_DEPTH) * SWAY_AMP
    if b.parent == -1:
        starts[i] = root_pos
        abs_angles[i] = b.rel_angle + sway
    else:
        p = b.parent
        starts[i] = starts[p] + direction(abs_angles[p]) * branches[p].length
        abs_angles[i] = abs_angles[p] + b.rel_angle + sway
    end = starts[i] + direction(abs_angles[i]) * b.length
    lines[i].put_start_and_end_on(starts[i], end)
```

The phase shift `b.depth * SWAY_PHASE_PER_DEPTH` is what makes the
breeze appear to travel — at any given moment, deeper branches are
slightly *behind* their parents in the sway cycle.

### Seamless loop

`SWAY_PERIOD = DURATION / 2`. Two complete sine cycles fit in the 12-s
loop. Every branch is at the same sway angle at `t = 0` and `t =
DURATION` because `sin(2π·k·1)` = `sin(2π·k·0)` for integer k.

## Parameters

| Name                       | Value          | Effect                                                                          |
|----------------------------|----------------|---------------------------------------------------------------------------------|
| `MAX_DEPTH`                | 7              | 127 total branches. Higher → denser canopy but slower render.                  |
| `TRUNK_LENGTH`             | 1.95           | Length of the root branch in Manim units.                                       |
| `LENGTH_SHRINK`            | 0.74           | Each child is 74% of its parent's length.                                       |
| `LENGTH_JITTER`            | 0.10           | ± fractional randomness on child length (seeded).                               |
| `BRANCH_ANGLE`             | 27°            | Left/right deviation from the parent's heading.                                 |
| `ANGLE_JITTER`             | 7°             | ± randomness on each branch angle (seeded).                                     |
| `TRUNK_BASE_Y`             | -3.4           | Root y-coordinate. Frame is 8 tall, so -3.4 places roots near the bottom.       |
| `TRUNK_STROKE`             | 16             | Stroke width at depth 0 (trunk).                                                |
| `LEAF_STROKE`              | 1.6            | Stroke width at MAX_DEPTH (twigs).                                              |
| `SWAY_PERIOD`              | `DURATION/2`   | 6 s per sway cycle → two cycles per loop.                                       |
| `SWAY_AMP_PER_BRANCH`      | 1.6°           | Per-branch sway amplitude; compounds with depth.                                |
| `SWAY_PHASE_PER_DEPTH`     | 0.03           | Fractional-period lag per depth — the wave-travel effect.                       |
| `LEAF_RADIUS`              | 0.055          | Size of the canopy accent dots.                                                 |
| `LEAF_OPACITY`             | 0.85           | Accent dot opacity.                                                             |
| `RNG_SEED`                 | 42             | Change for a different (but still reproducible) tree.                           |

## Aesthetic decisions

- **No drawing animation.** Considered: trunk grows, branches unfurl,
  canopy fills in. Rejected because growth doesn't loop — the start of
  the loop would either be a blank screen or jump-cut from full tree
  to seed.
- **Color taper trunk → canopy.** Trunk uses the deepest FOREST tone;
  canopy uses the brightest. Real bark *is* darker than fresh leaves;
  the color cue reinforces the silhouette.
- **Stroke taper trunk → canopy.** Visually the same point as color
  — trunk reads as substance, twigs as fine. Together the two tapers
  give the tree perceptual weight.
- **Symmetric initial heading, asymmetric children.** The trunk goes
  straight up; everything else has seeded random jitter. This gives
  the tree a sense of "growing toward light" without looking
  algorithmic.

## Performance notes

127 lines × 720 frames at 2560×1664. Each frame does a single forward
pass over the branch list, ~127 trig ops + 127 `put_start_and_end_on`
calls. Render time was ~1–2 minutes on the M5 Air. File size 3.6 MB.

## What I would try next

- **Procedural leaves** — small VMobjects (e.g. a stylized 5-point
  shape) at terminal branches with seeded variation in size, color,
  and orientation.
- **Two trees** — same algorithm, one with `INITIAL_ANGLE` slightly
  off-vertical, placed at the side. A pair gives the wallpaper more
  scene-like depth.
- **Subtle ground glow** — a faint radial gradient at the root y to
  imply morning fog. Would have to be tested against menu bar legibility.

See [[03_process_log#5. Wallpaper 1 Recursive fractal tree]] for the
chronological account of building this one.
