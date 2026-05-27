---
title: 'ADR-001: Resolution and Aspect Ratio'
tags: [adr, decision]
status: accepted
date: 2026-05-13
---

# ADR-001: Render at 2560×1664 with an aspect-correct frame

## Context

The user's display is a 13-inch M5 MacBook Air, native resolution
2560 × 1664 (Retina). The wallpaper player (Wallspace) is happiest
when the video resolution matches the display resolution exactly —
no scaling artifacts, no letterboxing.

Manim's default rendering is 1920 × 1080 at 16:9, with `frame_height
= 8` and `frame_width = 8 × (16/9) ≈ 14.22` (in Manim's internal
units). If you change the pixel resolution without changing the
frame dimensions, on-screen coordinates **get squished** because the
frame's aspect doesn't match the pixel canvas's aspect.

## Decision

Every wallpaper sets pixel resolution to **2560 × 1664** and
`frame_width` to **`frame_height × (2560/1664) ≈ 12.308`**. The
ratio 1.5384 matches the actual M5 Air panel aspect ratio.

`WallpaperConfig` in `lib/config.py` encodes this; every scene calls
`MACBOOK_AIR_13_M5.apply()` at module load to push these into Manim's
global config.

## Alternatives considered

1. **Render at 4K (3840 × 2160) and let Wallspace downscale.**
   Rejected: the M5 Air panel doesn't have 4K to display, so the
   extra pixels are thrown away and the render time doubles for no
   benefit.

2. **Render at 16:9 (e.g. 2560 × 1440) and let macOS letterbox.**
   Rejected: leaves visible bars at top and bottom, which defeats
   the wallpaper.

3. **Only set pixel resolution, leave `frame_width` at Manim's
   default.** Rejected: the wallpaper looks horizontally squished.
   You can compensate by scaling all coordinates yourself, but
   that's a hidden gotcha for every scene author.

## Consequences

- All scenes can rely on `frame_width = 12.308` for layout purposes.
  A `Dot` at `x = 6` is exactly at the right edge.
- Adapting to a different display (e.g. 27" iMac) is one `WallpaperConfig`
  away — `lib/config.py` can hold multiple `WallpaperConfig`
  instances. See [[../05_render_pipeline#How to render to a different aspect ratio entirely]].
- The CLI argument `-r 2560,1664` in `render.sh` is *redundant* with
  the programmatic config, but it makes the render command
  self-documenting. Kept for that reason.
