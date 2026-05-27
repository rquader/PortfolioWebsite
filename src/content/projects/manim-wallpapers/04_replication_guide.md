---
title: Replication Guide — Adding a Fifth Wallpaper
tags: [manim, wallpaper, howto]
---

# Replication Guide

How to add a new wallpaper to this project so it shares the
infrastructure of the existing four. Read [[01_architecture]] and
[[02_design_principles]] first — this doc assumes you know them.

## TL;DR

1. Add a new file `scenes/your_wallpaper.py`.
2. Import `MACBOOK_AIR_13_M5` and call `.apply()` at module load.
3. Pick (or add) a palette in `lib/palette.py`.
4. Build motion only out of the periodic primitives in `lib/easing.py`,
   with integer cycle counts over `DURATION`.
5. Render with `./render.sh scenes/your_wallpaper.py YourWallpaperScene`.
6. Write a note at `wallpapers/05_your_wallpaper.md` and link it from
   [[00_index]].

## The scene template

Copy this and fill in the marked spots. It is the same shape every
existing scene follows.

```python
"""<one-line description of what this wallpaper is>.

<longer description: the concept, how the motion works, what makes
the loop seamless>.

Run from project root:

    ./render.sh scenes/<your_file>.py <YourSceneClass>
"""
from __future__ import annotations

import pathlib
import sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

# Standard library
import math
import random
from dataclasses import dataclass
from typing import Final

# Third-party
import numpy as np
from manim import (
    # only what you use
)

# Project library
from lib.config import MACBOOK_AIR_13_M5
from lib.easing import sin_wave, smooth_loop  # whichever you need
from lib.palette import FOREST  # or whichever palette fits

MACBOOK_AIR_13_M5.apply()


# ---- Module-level Final constants -----------------------------------
DURATION: Final[float] = MACBOOK_AIR_13_M5.duration

# All tunable parameters go here, named, typed, and with a comment if
# the meaning isn't immediately obvious from the name.


# ---- Private dataclasses (use _Underscore prefix) -------------------
@dataclass
class _MyThing:
    """One sentence saying what this represents."""
    x: float
    y: float
    # ...


# ---- The Scene ------------------------------------------------------
class YourWallpaperScene(Scene):
    """One sentence on what the user sees."""

    def construct(self) -> None:
        self.camera.background_color = FOREST.background  # or whichever
        # 1. Build your data (positions, colors, params)
        # 2. Build a list of Mobjects from that data
        # 3. Add them to a VGroup
        # 4. Create a ValueTracker for time
        # 5. Define an update(group) function that uses time and the
        #    per-element data to set every mobject's pose for THIS frame
        # 6. Attach the updater, play to DURATION, detach the updater

        time = ValueTracker(0.0)
        group = VGroup(...)
        self.add(group)

        def update(_g: VGroup) -> None:
            t = time.get_value()
            # ... per-frame work ...

        update(group)  # initial pose
        group.add_updater(update)
        self.play(time.animate.set_value(DURATION), run_time=DURATION, rate_func=linear)
        group.remove_updater(update)
```

## The rules you must follow

### 1. Set Manim config at module load

```python
MACBOOK_AIR_13_M5.apply()
```

…must be at module top, **before any `class Scene` body runs**. If you
forget, your wallpaper will render with Manim's default 1080p 16:9
frame and your coordinates will look horizontally squished. See
[[decisions/ADR-001-resolution-and-aspect]].

### 2. Make every motion parameter periodic with integer cycles

This is the seamless-loop guarantee. For every animated quantity, pick
a function from `lib/easing.py`:

| If the quantity should…                                | Use…              |
|--------------------------------------------------------|-------------------|
| oscillate above and below a center value               | `sin_wave`        |
| breathe 0 → max → 0 smoothly                           | `smooth_loop`     |
| advance and wrap around (e.g. fall position)           | `linear_loop`     |
| trace a full revolution                                | `angular_loop`    |

…and ensure its cycle count over `DURATION` is a **positive integer**:

```python
period = DURATION / cycles  # cycles must be a positive int
value = sin_wave(t, period, phase=...)
```

If `cycles` is 1.5, your start frame and end frame won't match and
you'll see a seam on every loop. See
[[decisions/ADR-002-seamless-loops]].

### 3. Pre-seed every random source

If you use `random.Random(seed)`, the wallpaper is reproducible —
re-rendering tomorrow gives bit-for-bit the same animation. If you
use `random.uniform(...)` directly (which uses the global generator),
each render produces a different scene.

Always:

```python
RNG_SEED: Final[int] = 42  # any constant int
# ...
rng = random.Random(RNG_SEED)
x = rng.uniform(-1, 1)  # ✓
```

Never:

```python
x = random.uniform(-1, 1)  # ✗
```

### 4. Hide per-element state behind small private dataclasses

Don't pass tuples around. A `_Branch(parent, rel_angle, length, depth)`
is much easier to evolve than a 4-tuple — adding a fifth field is
trivial, and the code at the call site reads as English.

### 5. Don't store rotation state on the Mobject

Manim's `Mobject.rotate()` is **cumulative**, not absolute. If you
want a mobject at absolute rotation θ, track the rotation you've
already applied externally and call `rotate(θ - applied)` with the
delta. See [[decisions/ADR-006-rotation-delta-pattern]].

## How to think about a new wallpaper concept

A useful 3-step exercise before writing code:

1. **What is the *one* thing the viewer sees?** Wallpapers should be
   readable in a glance, not deciphered. A "swaying tree" works. A
   "neural network of particles plus drifting glyphs plus aurora
   curtains" does not.

2. **What's the motion?** Pick *one* motion primitive (sway, drift,
   rotation, fade, pulse). It is OK to have a single secondary motion
   (the leaves' rotation while they fall) — but only if the secondary
   serves the primary.

3. **How does it loop seamlessly?** Sketch the time line. Every motion
   needs an integer cycle count from `t=0` to `t=DURATION`. If you
   can't see how to make it loop, the design is wrong, not the
   implementation.

## Common pitfalls

- **Using `np.random` or `random` without seeding** — fix: see Rule 3.
- **Setting fill/stroke after `add()`** — works, but `.set_fill(opacity=...)`
  inside an updater is cheap; recreating the mobject each frame is not.
- **Rotating in `construct()` and forgetting to apply the delta** — the
  symptom is wild spinning that doesn't loop. See Rule 5.
- **Massive object counts** — each Manim Mobject has ~10–20 vertices.
  ~2000 mobjects updating per frame at 60 fps is fine on an M5; ~10000
  starts to chug. Profile if rendering takes > 5× the loop length.
- **Forgetting the sys.path bootstrap** — symptom: `ModuleNotFoundError:
  No module named 'lib'`. The fix is the two-line `sys.path.insert`
  shim at the top of the template above.

## Once it works

- Add `wallpapers/0N_your_wallpaper.md` documenting: concept, palette,
  math, parameter table, anything tricky.
- Link it from [[00_index]] and (briefly) from [[README]].
- If you discovered a non-obvious technique, write an ADR in
  `decisions/`.
- If you took inspiration from a specific source, add it to
  `credits/` with one paragraph on how you used it.
