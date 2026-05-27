---
title: Manim Community Edition
tags: [credit, software]
---

# Manim Community Edition

The rendering engine that turns each `scenes/*.py` file into an MP4.

## What it is

[Manim Community](https://www.manim.community/) is an open-source fork
of the animation library Grant Sanderson built for the YouTube channel
3Blue1Brown. The community fork is maintained by a working group of
volunteers and is the version used in this project.

- Version used: **0.20.1**
- License: MIT
- Website: https://www.manim.community/
- Source: https://github.com/ManimCommunity/manim
- Documentation: https://docs.manim.community/

## How this project uses it

Every wallpaper is a single Manim `Scene` subclass with a `construct()`
method. The rendering pipeline used:

- `Scene`, `VGroup`, `ValueTracker` — base classes
- `Dot`, `Ellipse`, `Line` — primitive mobjects for stars, leaves,
  branches/edges
- `mobject.add_updater(...)` — the per-frame hook that drives all
  motion
- `scene.play(value.animate.set_value(...))` — drives the ValueTracker
  that the updater reads from
- The `manim` CLI (`-r`, `--fps`, `--format`, etc.) — rendering knobs
- `manim.config` — the global config object that `lib/config.py`'s
  `apply()` writes to

The shape of the per-scene file (module-level `Final` constants, small
dataclasses, sprite-wrapper classes, `MACBOOK_AIR_13_M5.apply()` at
import time) is informed by working *with* Manim's particulars:

- Manim's CLI doesn't add the scene-file directory to `sys.path`, so
  scene files include a two-line sys.path bootstrap to make
  `from lib.config import ...` work regardless of how they're invoked.
- `Mobject.rotate()` is cumulative, not absolute, which informs
  [[../decisions/ADR-006-rotation-delta-pattern]].
- Global `manim.config` is read at scene-construction time, so config
  has to be set at *module load*, not inside `construct()`. See
  [[../decisions/ADR-007-render-config-pattern]].

## Why Manim Community and not the original `manimgl`

Manim Community Edition has:

- Better-supported PyPI install (`pip install manim`)
- More stable API (the original `manimgl` evolves to whatever 3Blue1Brown
  needs that week)
- A larger community / more StackOverflow answers
- Active maintenance, including for newer Python versions (we're on 3.14)

`manimgl` would also work for this project, but the CE flavor is the
more pragmatic choice for a project that should still run a year from
now.

## Attribution

3Blue1Brown / Grant Sanderson originated Manim and continues to drive
its YouTube use case. The Community Edition fork is maintained by its
contributors collectively. Both deserve credit; this project would not
exist without that work.
