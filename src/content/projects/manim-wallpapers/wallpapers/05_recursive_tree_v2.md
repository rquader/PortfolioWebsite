---
title: Recursive Tree v2
tags: [manim, wallpaper, cs, tree, v2]
---

# Recursive Tree v2

A deeper, leafier sibling to [[01_recursive_tree]]. Real 5-pointed leaf polygons at terminal branches, dual-frequency sway (breeze + gust), occasional 3-way branching, drifting pollen particles. Same FOREST palette, same flat-list-with-parent-indices architecture.

- **Code:** `~/Developer/Manim_Wallpaper/scenes/recursive_tree_v2.py`
- **Scene class:** `RecursiveTreeV2Wallpaper`
- **Render:** `~/Developer/Manim_Wallpaper/output/finals/05_recursive_tree_v2.mp4` (~4.3 MB)
- **Palette:** [[02_design_principles#FOREST — CS theme (recursive tree)|FOREST]]
- **Design rationale:** [[07_v2_concept_design#1 — Recursive Tree v2 (improvement on user favorite)]]
- **Rendered:** 2026-05-17 (via `./render.sh scenes/recursive_tree_v2.py RecursiveTreeV2Wallpaper -o 05_recursive_tree_v2`)

## What you see

The same swaying recursive tree as v1, with three differences you should notice in this order:

1. **Real leaves at the canopy.** 5-pointed polygons in greens, scattered across terminal branches, each rotated to follow its parent branch's heading with a small per-leaf jitter.
2. **The wind has two layers.** A faster breeze rides on top of a slower gust. The tree doesn't move on a single rhythm any more — it has weather.
3. **Pollen.** ~24 small dots drifting upward through the canopy, with a slow horizontal sway. They give the air around the tree depth.

A subtle fourth: occasional 3-way splits (~12% per non-terminal branch) produce a co-dominant shoot near vertical. The canopy reads less algorithmic than v1's strict binary.

## Concept

[[01_recursive_tree|v1]] was about presenting recursion as a shape — "every branch is itself a smaller tree." v2 keeps that argument but answers the next question a viewer asks: *if it's a tree, where are the leaves, and why does it move like a metronome?*

v2 is the same idea after another pass of looking.

## How it works

Algorithmically identical to v1 with three additions. Detail is the source file; the doc summarizes.

### Leaves — 5-point polygons with delta-rotation

Each terminal branch gets a `_Leaf`: a 10-vertex polygon shaped in canonical `+y` orientation, plus a cached `_current_angle` for delta-rotate updates (since `Polygon.rotate` is cumulative).

```python
def pose(self, position, branch_angle):
    target = branch_angle - math.pi / 2.0 + self.rotation_jitter
    delta = target - self._current_angle
    if delta != 0.0:
        self.mob.rotate(delta)
        self._current_angle = target
    self.mob.move_to(position)
```

Same delta-rotation pattern as [[02_falling_leaves]]; logged in [[decisions/ADR-006-rotation-delta-pattern]].

### Dual-frequency sway

```python
primary   = sin_wave(t, PRIMARY_PERIOD,   phase=b.depth * PRIMARY_PHASE_PER_DEPTH)   * PRIMARY_AMP_PER_BRANCH
secondary = sin_wave(t, SECONDARY_PERIOD, phase=b.depth * SECONDARY_PHASE_PER_DEPTH) * SECONDARY_AMP_PER_BRANCH
sway = primary + secondary
```

`PRIMARY_PERIOD = DURATION / 2` (2 cycles per loop, the "breeze"); `SECONDARY_PERIOD = DURATION / 1` (1 cycle, the "gust"). Both are integer cycle counts → both loop seamlessly → their sum loops seamlessly.

### Occasional 3-way branching

Inside the recursion, after the standard left/right children, with probability `THREE_WAY_PROB = 0.12`:

```python
if rng.random() < THREE_WAY_PROB and not is_terminal:
    center_jitter = rng.uniform(-THREE_WAY_ANGLE, THREE_WAY_ANGLE)
    len_c = length * SHRINK * THREE_WAY_LENGTH_FACTOR * (1 + rng.uniform(-LEN_JITTER, LEN_JITTER))
    recurse(this_idx, len_c, center_jitter, depth + 1)
```

The third child has a small angle (~6° max), so it reads as a co-dominant shoot rather than another full split. Compounds across depths to give the canopy organic density without hand-tuning per branch.

### Particles

24 `Dot`s with per-particle drift cycles (1 or 2 per loop) and sway cycles (1 or 2). Wraps bottom-to-top with a margin so the wrap edge is off-frame. Same pattern as recursive_tree v1's particle plan but actually implemented.

## Parameters

Key changes from v1:

| Name                          | v1          | v2          | Effect                                                       |
|-------------------------------|-------------|-------------|--------------------------------------------------------------|
| `MAX_DEPTH`                   | 7           | **8**       | ~2× branches. Denser canopy, more leaves.                    |
| `TRUNK_LENGTH`                | 1.95        | 1.80        | Slightly shorter trunk so the deeper tree fits.              |
| `THREE_WAY_PROB`              | n/a         | **0.12**    | Probability a non-terminal branch is 3-way.                  |
| `LEAVES`                      | dots        | **polygons**| 5-point shapes instead of accent dots.                       |
| `SECONDARY_AMP_PER_BRANCH`    | n/a         | **0.7°**    | Gust amplitude (added to primary breeze).                    |
| `NUM_PARTICLES`               | 0           | **24**      | Pollen/spore particles.                                      |

All other params (`SHRINK`, `LEN_JITTER`, `BRANCH_ANGLE`, `ANGLE_JITTER`) inherited unchanged.

## Aesthetic decisions

- **Leaves attach only at depth `MAX_DEPTH`, not throughout.** Earlier drafts attached at `MAX_DEPTH - 1` and `MAX_DEPTH`; canopy became too cluttered, lost the silhouette. Single-depth attachment keeps the form readable.
- **Leaf size range (`0.10`–`0.18`).** Tighter than the falling-leaves range — these leaves are *on a tree*, so consistency matters more than the variety a strewn-leaf composition needs.
- **`THREE_WAY_LENGTH_FACTOR = 0.88`.** Below 1.0 so the third child is shorter than the binary children, which reinforces "co-dominant shoot" rather than "third equal split."
- **Particles use FOREST.accent for color.** Pale warm green — the canopy's lightest leaf color, dimmer. Reads as pollen, not snow.
- **Z-order: particles behind tree.** A `VGroup(particles, tree)` puts particles painted first, tree painted over them. Particles drift *behind* the canopy — atmospheric depth.

## Performance notes

~255 branches (vs. 127 at depth 7) + ~128 terminal leaves + 24 particles. Per-frame work is ~255 trig pairs + ~255 `put_start_and_end_on` + ~128 polygon `move_to`/`rotate` + ~24 dot `move_to`. Still cheap.

Render time on M5 Air: ~50 seconds for the 12-s loop at 2560×1664 / 60 fps. File size 4.3 MB.

## What I would try next

- **Trunk thickness taper that's nonlinear.** Currently linear from `TRUNK_STROKE` to `LEAF_STROKE`. A power-law taper (`stroke ∝ length^0.5`) might feel more arboreal.
- **Per-leaf seasonal palette variation.** Mostly green with a few amber leaves scattered, scaled by a "season" parameter. The user mentioned liking [[07_v2_concept_design#4 — Wildflower Meadow (bright, lively, addresses "bright natural")|bright natural]] colors; one or two warm-toned leaves wouldn't fight FOREST and would add liveliness.
- **Ground glow.** A radial gradient at the root y-position, very faint, implying morning fog. Tracked in [[01_recursive_tree#What I would try next]] as well — still unbuilt.
- **A second tree offset.** Same algorithm, different seed, positioned to one side at slightly different `INITIAL_ANGLE`. Gives the wallpaper scene-like depth without rebuilding the algorithm. Tracked from v1.

## Relation to the portfolio site

The recursive tree v2 algorithm is the **source of truth** for the [[Portfolio_Website/Concept - Recursive Tree Backdrop|TypeScript canvas port]] used as the signature backdrop on Rafan's portfolio site. The port mirrors this algorithm line-for-line. See [[Portfolio_Website/decisions/ADR-004-tree-backdrop-canvas-vs-mp4]] for why the site does NOT ship this MP4 directly — it ships the JS port instead.

This MP4 render stays in the Manim repo as the reference visual for verifying the JS port (structural identity from seed=42, same sway profile). It is not symlinked into the site.

See [[03_process_log]] for the chronological build of v1 → v2.
