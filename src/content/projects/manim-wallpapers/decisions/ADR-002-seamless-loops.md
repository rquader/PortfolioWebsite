---
title: 'ADR-002: Seamless Loops via Integer-Cycle Counts'
tags: [adr, decision]
status: accepted
date: 2026-05-13
---

# ADR-002: Seamless loops via integer-cycle counts

## Context

The Wallspace app plays the rendered MP4 in a continuous loop. If
the last frame of the video isn't pixel-identical to the first frame,
the viewer sees a visible seam on every loop — instant "this is a
video, not a wallpaper."

Three classes of solution were available:

1. **Post-process** the video with ffmpeg crossfade-loop or similar.
2. **Design** every motion so that the start and end frames are
   pixel-identical *by construction*.
3. **Approximate** — design motion to be "close enough" at the seam,
   and hope nobody looks too carefully.

## Decision

Option 2. Every motion parameter expresses its cycle count as a
**positive integer** over `DURATION`. The `lib/easing.py` module
exposes four periodic primitives — `sin_wave`, `smooth_loop`,
`linear_loop`, `angular_loop` — and every animated quantity is built
out of those.

Specifically:

- Sine-driven motion has `cycles ∈ ℤ⁺` over DURATION (period =
  `DURATION/cycles`).
- Fade animations use `smooth_loop` (raised cosine, 0 at endpoints)
  with integer cycle counts.
- Wrapping motion (falling leaves' y position) uses `linear_loop`
  with integer cycle counts.
- Rotation uses `angular_loop` with integer cycle counts.

This guarantees that for every motion parameter, the value at `t = 0`
equals the value at `t = DURATION` — and therefore every mobject's
pose, and therefore every rendered pixel, matches.

## Alternatives considered

1. **ffmpeg crossfade-loop post-processing.** Rejected: introduces an
   extra step that has to be re-tested on every render, depends on
   ffmpeg's crossfade specifics, and produces a "soft" seam (visible
   ghosting at the loop point) rather than a true match. Also makes
   the rendered MP4 longer than `DURATION`, which is wasteful.

2. **One-shot animations (grow then sway).** Rejected for the tree:
   the grow phase doesn't loop. To loop, we'd either need to teleport
   back to "seed" (jarring) or sit on the fully-grown tree for the
   bulk of the loop length (boring). The all-visible-from-t=0 design
   produces a more wallpaper-appropriate result anyway.

3. **"Close enough" seam.** Rejected on principle: a wallpaper plays
   continuously. Anything imperfect at the seam becomes the *most
   noticeable* feature within a few minutes of viewing.

## Consequences

- Every new wallpaper must respect this rule (see
  [[../04_replication_guide#Rule 2 Make every motion parameter periodic with integer cycles]]).
- Some animation concepts are off the table without redesign — e.g.
  "a particle bursts out of a star and drifts away" — because
  one-shot trajectories don't loop. The fix is usually to make the
  trajectory periodic (the particle wraps back) or to give every
  star its own trajectory phase so several bursts overlap and the
  *aggregate* is steady-state.
- The integer-cycle constraint is mostly invisible at the design
  level. Most natural motion is periodic anyway — wind, breathing,
  rotation, falling — so the constraint matches the design intuition.
