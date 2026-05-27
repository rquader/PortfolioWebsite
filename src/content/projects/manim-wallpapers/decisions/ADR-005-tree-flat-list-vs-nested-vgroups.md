---
title: 'ADR-005: Recursive Tree as Flat Branch List, Not Nested VGroups'
tags: [adr, decision]
status: accepted
date: 2026-05-13
---

# ADR-005: Recursive tree as flat branch list, not nested VGroups

## Context

The recursive tree could be represented two natural ways:

1. **Nested VGroups** — each branch is a VGroup containing its `Line`
   plus the VGroups of its children. Recursive structure matches the
   visual structure exactly. Rotating a sub-tree means rotating its
   VGroup.

2. **Flat list with parent indices** — each branch is a `_Branch`
   dataclass with a `parent: int` field pointing into the list. All
   branches are siblings in a single flat list.

For the swaying-tree wallpaper, the requirement is: each branch
sways relative to its parent, with a phase shift depending on depth,
and the overall pose updates every frame.

## Decision

Option 2: flat list with DFS ordering.

```python
@dataclass
class _Branch:
    parent: int       # -1 for root
    rel_angle: float  # relative to parent's heading
    length: float
    depth: int
    is_terminal: bool

# branches: list[_Branch] in DFS order.
# Guarantee: branches[i].parent < i always (DFS construction).
```

The per-frame layout iterates the list **once, forward**, resolving
each branch from its parent's resolved pose:

```python
for i, b in enumerate(branches):
    sway = sin_wave(t, period, phase=b.depth * PHASE_PER_DEPTH) * AMP
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

## Alternatives considered

1. **Nested VGroups with per-VGroup rotation.** The natural way if
   you're new to Manim. Rejected because:
   - Rotating a parent VGroup rotates all its descendant points about
     the parent's *centroid*, not about the parent's end-point —
     which is what we'd want for a "branch joint." Compensating means
     manually translating each child VGroup before/after rotation.
   - Per-frame, each branch's sway is the parent's accumulated
     transform *plus* the branch's own. With nested groups this
     requires walking the tree explicitly per frame anyway.
   - VGroup rotation is a heavier operation than a single
     `put_start_and_end_on` per line, especially at 127 branches.

2. **Mobject parenting hooks.** Manim's mobject model doesn't have
   a built-in parent-child rotation propagation system in the way
   a scene-graph 3D engine does. Implementing one would be more code
   than the layout function above.

## Consequences

- Tree layout cost is O(N) per frame with one trig pair per branch —
  effectively free.
- Modifying the wind model is local: change the `sway` expression in
  the loop. The structure of the tree is independent.
- The *order* of branches matters: it must be DFS for the forward
  pass to work. If a future change reorders the branches, the loop
  has to be re-validated. (Mitigation: the recursion that builds
  the list is the only place ordering is decided; it's three lines
  of code.)
- Going to a much deeper tree (say, MAX_DEPTH=12 for ~4000 branches)
  remains O(N) — there's no recursion depth limit or VGroup overhead
  to worry about.
