---
title: 'ADR-006: Rotation Cached Externally, Applied as Deltas'
tags: [adr, decision]
status: accepted
date: 2026-05-13
---

# ADR-006: Rotation cached externally, applied as deltas

## Context

Manim's `Mobject.rotate(theta)` is **cumulative**. Calling
`mob.rotate(0.5)` twice rotates by 1.0 radian total, not 0.5.

This matters for any updater that wants to set an absolute rotation
each frame. Specifically:

- Phyllotaxis rotates the whole pattern's `VGroup` once per loop. We
  want the group's rotation at time t to be `2π × (t / DURATION)`.
- Falling leaves have a per-leaf rotation. Each leaf's rotation at
  time t is `tilt + 2π × rot_cycles × (t / DURATION) + phase`.

Naive code that calls `mob.rotate(target_angle)` every frame would
*add* `target_angle` to the previous rotation, producing wild
spinning that doesn't loop.

## Decision

Cache the rotation already applied externally — either as a Python
list (phyllotaxis) or as an attribute on a wrapper sprite class
(falling_leaves' `_LeafSprite`) — and on each frame compute the
**delta** to the desired absolute angle and rotate by that delta:

```python
target = ROTATION_CYCLES * angular_loop(t, DURATION)
delta = target - applied
if delta != 0.0:
    mob.rotate(delta, about_point=ORIGIN)
    applied = target
```

## Alternatives considered

1. **Rebuild the mobject from scratch each frame.** Works, simple,
   loses no precision. Rejected because creating 95 Ellipses (leaves)
   or 1500 Dots (phyllotaxis) per frame at 60 fps for 12 seconds is
   ~70,000 or 1,080,000 object creations — measurable cost.

2. **Subclass `Mobject` and add a `set_absolute_rotation()` method.**
   Possible but invasive — the subclass would have to track its own
   rotation across every call site that touches it. The delta-pattern
   keeps the state local to the updater that needs it.

3. **Manipulate `mob.points` directly** with a 2D rotation matrix.
   Works, fastest, fragile against Manim API changes. Rejected for
   this project.

4. **Track rotation via a parallel `ValueTracker` and use
   `always_redraw`.** Possible but heavyweight — `always_redraw`
   rebuilds the mobject from a factory function each frame, which is
   alternative 1 with extra Manim plumbing.

## Consequences

- Every scene that animates rotation owns a tiny piece of cached
  state (a list, or a sprite instance attribute). This is the entire
  cost.
- The delta computation is `O(N)` per frame for N rotating mobjects.
  For our scene sizes (≤1500), this is microseconds.
- New scenes following this project's conventions get the rotation
  pattern from the [[../04_replication_guide#5. Don't store rotation state on the Mobject|replication guide]].

## Why not just remember not to do the wrong thing

Because *the wrong thing* is what every Manim tutorial does — they
call `rotate(angle)` inside an updater without thinking about it,
because the videos they're teaching have one-shot animations rather
than seamless loops. A first-time scene author *will* make this
mistake. The delta pattern, encapsulated in the sprite class or the
external cache list, makes it impossible to.
