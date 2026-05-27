---
title: Architecture
tags: [manim, wallpaper, architecture]
---

# Architecture

How the code is organized, where everything lives, and *why* it is
shaped the way it is. Read this first if you are picking the project
up cold.

## Tl;dr

```
~/Developer/Manim_Wallpaper/             ← code, renders, venv
├── .venv/                               (Python 3.14, Manim 0.20.1)
├── .claude/
│   └── settings.local.json              project-scoped permissions
├── lib/                                 shared library
│   ├── __init__.py
│   ├── config.py                        WallpaperConfig + apply()
│   ├── palette.py                       Palette + 4 named palettes
│   └── easing.py                        seamless-loop primitives
├── scenes/                              one file per wallpaper
│   ├── __init__.py
│   ├── recursive_tree.py
│   ├── falling_leaves.py
│   ├── phyllotaxis.py
│   └── constellation.py
├── output/                              (final, polished mp4s — optional)
├── media/                               (manim's auto-generated render tree)
└── render.sh                            convenience wrapper for the manim CLI

~/.../Obsidian/.../Manim_Wallpaper/      ← documentation only
├── 00_index.md
├── 01_architecture.md  ← you are here
├── 02_design_principles.md
├── 03_process_log.md
├── 04_replication_guide.md
├── 05_render_pipeline.md
├── README.md
├── wallpapers/         one note per wallpaper
├── credits/            one note per external source
├── decisions/          ADR-style records
└── inspirations/       references that informed the look
```

Code lives in `~/Developer` because the venv lives there and because
big `.mp4` files shouldn't sync over iCloud. The Obsidian vault is
docs-only — it's the canonical place to *read about* the project.

## The two laws that shape every scene

Everything in `scenes/` follows two non-negotiable rules.

### Law 1: Render at 2560 × 1664 with the correct aspect ratio

The M5 MacBook Air's native panel is 2560 × 1664 pixels, aspect
~1.538. Manim's default frame is 8 units tall × 14.222 units wide
(16:9). If you only set pixel dimensions, Manim still uses the 16:9
frame width and **your coordinates get horizontally squished** when
the pixel canvas widens.

The fix: every wallpaper config also overrides `frame_width` so the
frame's aspect matches the pixel aspect:

```python
# lib/config.py (excerpt)
@dataclass(frozen=True)
class WallpaperConfig:
    pixel_width: int = 2560
    pixel_height: int = 1664
    frame_rate: int = 60
    duration: float = 12.0

    @property
    def frame_height(self) -> float:
        return 8.0

    @property
    def frame_width(self) -> float:
        return self.frame_height * (self.pixel_width / self.pixel_height)

    def apply(self) -> None:
        _manim_config.pixel_width = self.pixel_width
        _manim_config.pixel_height = self.pixel_height
        _manim_config.frame_rate = self.frame_rate
        _manim_config.frame_height = self.frame_height
        _manim_config.frame_width = self.frame_width
```

Every scene file does `MACBOOK_AIR_13_M5.apply()` **at module load**,
before any `Scene` class is constructed. Manim reads config at scene
construction time, so calling `apply()` from inside `construct()`
would be too late.

### Law 2: The animation must be seamlessly loopable

Wallspace plays the rendered `.mp4` on loop. If the last frame doesn't
match the first frame pixel-for-pixel, you see a seam every loop.

The strategy that runs through every scene is: **make every motion
parameter an integer number of cycles over `DURATION`**. Then at
`t = DURATION` every mobject is in the exact pose it had at `t = 0`.

Concretely:

| Motion           | Function (from `lib/easing.py`)        | Cycle constraint            |
|------------------|---------------------------------------|------------------------------|
| Periodic sway    | `sin_wave(t, period, phase)`          | `DURATION / period ∈ ℤ`     |
| Smooth fade      | `smooth_loop(t, period)`              | `DURATION / period ∈ ℤ`     |
| Wrapping motion  | `linear_loop(t, period)`              | `DURATION / period ∈ ℤ`     |
| Rotation         | `angular_loop(t, period)`             | `DURATION / period ∈ ℤ`     |

If a parameter doesn't fit that mold — like a one-shot drawing
animation — it has to be designed so its end pose equals its start
pose. We avoid this where possible because it's brittle.

See [[02_design_principles]] and [[decisions/ADR-002-seamless-loops]]
for the full reasoning.

## The `lib/` package

Three small modules. No magic.

### `lib/config.py`

Single dataclass `WallpaperConfig` plus a module-level constant
`MACBOOK_AIR_13_M5` that scenes import. `apply()` writes the dataclass
fields into Manim's global `config` singleton. Frozen dataclass so
config is immutable per scene.

### `lib/palette.py`

`Palette` dataclass: `name`, `background` (single hex), `tones` (tuple
of hex strings ordered deepest → brightest), `accent` (one extra hex
for sparing use). Helper methods:

- `palette.tone(t)` — snap to the discrete tone at normalized position
  `t ∈ [0, 1]`. Use when each object should be a single, distinct
  palette color.
- `palette.gradient(t)` — interpolate smoothly between adjacent tones
  via `lerp_hex`. Use when objects form a smooth continuum (the
  phyllotaxis seeds).

Four palettes defined: `FOREST`, `AUTUMN`, `SUNFLOWER`, `NIGHT`. See
[[02_design_principles#Palette choices]] for *why* each was picked.

### `lib/easing.py`

Four periodic primitives — every motion in every wallpaper is built
from one of these. The signatures are uniform: `(t, period, phase=0)`.

- `sin_wave(t, period, phase) → [-1, 1]`
- `smooth_loop(t, period) → [0, 1]` with zero derivative at endpoints
- `linear_loop(t, period) → [0, 1)` sawtooth that wraps
- `angular_loop(t, period) → 2π·(t/period)` for full revolutions

`phase` is in *fractions of a period* so phase=0.25 starts at a
quarter-cycle.

## The `scenes/` modules

One file per wallpaper. Each file follows the same shape:

```python
# 1. __future__ import (must be first non-comment line)
from __future__ import annotations

# 2. sys.path bootstrap so `from lib...` works regardless of how the
#    file is invoked by manim's CLI
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

# 3. Library imports
import math, random
from dataclasses import dataclass
from typing import Final

import numpy as np
from manim import (Scene, VGroup, ValueTracker, linear, ...)

from lib.config import MACBOOK_AIR_13_M5
from lib.easing import ...
from lib.palette import ...

# 4. Configure Manim at module load
MACBOOK_AIR_13_M5.apply()

# 5. Module-level Final constants for ALL tunable parameters.
#    No magic numbers inside the Scene class.
NUM_LEAVES: Final[int] = 95
DURATION: Final[float] = MACBOOK_AIR_13_M5.duration
# ...

# 6. Private dataclasses for per-element state.
@dataclass
class _LeafParams: ...

# 7. Optional helper classes — sprite wrappers that own a Mobject
#    plus per-frame state (e.g. cached rotation angle).
class _LeafSprite: ...

# 8. Public Scene class with a single `construct()` method.
class FallingLeavesWallpaper(Scene):
    def construct(self) -> None:
        ...
```

This shape is intentional:

- Module-level `Final` constants make every tunable parameter
  discoverable by scrolling once. No grep-the-class needed.
- `_Leaf` / `_Star` / `_Branch` dataclasses separate **what an object
  is** from **how it draws**. The drawing code can iterate over the
  data with one consistent loop.
- The sprite-wrapper pattern (`_LeafSprite`) is used only where a
  mobject needs its own per-frame state beyond what Manim tracks (the
  classic case: cumulative rotation, see [[decisions/ADR-006-rotation-delta-pattern]]).

## How a render command resolves

```
$ .venv/bin/manim -qh --fps 60 -r 2560,1664 --format mp4 \
      -o tree scenes/recursive_tree.py RecursiveTreeWallpaper
```

What each flag does:

| Flag                      | Effect                                                              |
|---------------------------|---------------------------------------------------------------------|
| `-qh`                     | High-quality preset; matters less since `-r` overrides pixels       |
| `--fps 60`                | 60 frames per second                                                |
| `-r 2560,1664`            | Pixel dimensions (overrides preset)                                 |
| `--format mp4`            | h264-encoded MP4 (Wallspace-compatible)                             |
| `-o tree`                 | Output filename stem (becomes `tree.mp4`)                           |
| `scenes/recursive_tree.py`| Scene source file                                                   |
| `RecursiveTreeWallpaper`  | Class name within that file                                         |

Output lands at:

```
media/videos/recursive_tree/1664p60/tree.mp4
```

(Manim's directory naming: `<scene_file_stem>/<height>p<fps>/<output_name>.mp4`.)

Why we still pass `-r 2560,1664` even though `MACBOOK_AIR_13_M5.apply()`
already sets them: redundant, but it makes the CLI invocation
self-documenting. A reader of the command can see the target
resolution without opening any source file.

## Permissions / sandbox notes

The project's `.claude/settings.local.json` pre-allows Edit/Write/MultiEdit
in both the Developer dir and the Obsidian Manim_Wallpaper subfolder.
The Obsidian path is also in `additionalDirectories` so Claude Code
treats it as part of this project's permission scope.

This file is local to the project — it doesn't follow you to other
projects, and it doesn't grant access outside these two folders.

## Next reads

- [[02_design_principles]] — the *why* behind the visual choices.
- [[04_replication_guide]] — how to add a fifth wallpaper.
- [[03_process_log]] — chronological log of what actually happened.
- [[decisions/_index]] — ADR-style decision records.
