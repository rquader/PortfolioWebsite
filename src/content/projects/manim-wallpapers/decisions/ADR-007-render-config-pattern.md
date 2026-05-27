---
title: 'ADR-007: WallpaperConfig.apply() at Module Load'
tags: [adr, decision]
status: accepted
date: 2026-05-13
---

# ADR-007: `WallpaperConfig.apply()` at module load

## Context

Manim reads its global configuration object (`manim.config`) at
**Scene construction time**, not at render time. That means setting
the config inside `Scene.construct()` is too late — the scene is
already constructed against the previous config values, including
the pixel resolution it'll render at.

Where exactly should the config be set?

Options:

1. **Inside `Scene.__init__` or `construct()`** — too late.
2. **At module load**, before the Scene class body even runs.
3. **Via `manim.cfg`** file in the project root.
4. **Via CLI flags** every render.

## Decision

Option 2: module load. Every scene file does:

```python
from lib.config import MACBOOK_AIR_13_M5
MACBOOK_AIR_13_M5.apply()    # ← runs at import time, before Scene is constructed
```

`apply()` writes `pixel_width`, `pixel_height`, `frame_rate`,
`frame_height`, `frame_width` onto `manim.config`. CLI flags then
override what they override (resolution, fps), but `frame_width`
isn't a CLI flag — so it's *only* set correctly if the programmatic
apply() runs.

## Alternatives considered

1. **`manim.cfg` file.** This is Manim's intended config mechanism.
   Rejected because:
   - It can pin pixel resolution and fps, but it cannot pin
     `frame_width` (which is what makes the aspect ratio correct).
     The aspect-ratio fix has to be programmatic regardless.
   - A scene reader has to look at *two* places (the .py file and
     the .cfg) to understand the render setup. Putting it all in code
     keeps the surface area small.

2. **CLI flags only.** Rejected for the same reason as above —
   `frame_width` isn't a CLI flag. Plus, CLI invocations get drifty
   over time (typoed flags, copy-paste errors).

3. **Apply in `Scene.__init__`.** Tried — too late. Manim has
   already initialized parts of the renderer that depend on config
   by then.

## Consequences

- Every scene file must have `MACBOOK_AIR_13_M5.apply()` at the top.
  This is two non-comment lines (import + call). Documented in the
  [[../04_replication_guide#The scene template|replication guide]].
- Different display targets require different `WallpaperConfig`
  instances. Currently only `MACBOOK_AIR_13_M5` is defined; adding
  one for, say, a 5K iMac is a 4-line addition to `lib/config.py`.
- Because `WallpaperConfig` is a `frozen=True` dataclass, you cannot
  accidentally mutate the active config between scenes — you have to
  pick which config to apply.

## What this protects against

The single most-common Manim wallpaper bug: a scene that looks correct
on the developer's machine (at default Manim resolution) but renders
horizontally squished on the target display. By making the config
declarative and tied to the import system, this whole class of bug
disappears.
