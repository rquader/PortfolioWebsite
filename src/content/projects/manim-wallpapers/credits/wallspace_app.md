---
title: Wallspace
tags: [credit, software]
---

# Wallspace

The macOS app that the rendered MP4s are designed for.

## What it is

[Wallspace](https://wallspace.app/) is a macOS application for setting
animated wallpapers (MP4 / MOV) as the desktop background. It plays
the file on loop in place of the static system wallpaper.

## How this project uses it

The render targets are `.mp4` files at 2560×1664 / 60 fps / 12 seconds.
You drop a finished render into Wallspace and it loops it as your
desktop wallpaper.

The seamless-loop requirement (every motion in every scene is an
integer number of cycles over `DURATION`) exists *because* Wallspace
will loop the video. If we had no looping requirement, we could let
the animation drift or end on a different pose than it started, and
save a meaningful amount of complexity. The fact that we don't is
what makes the wallpapers feel like "always-on" backgrounds rather
than short loops.

## Format notes

Wallspace's documented support, as of the user's spec for this project:
`.mp4` works. The h264 encoding Manim outputs by default is fine.

If you find a Wallspace-specific format quirk (resolution caps, fps
limits, audio-track requirements) later, document it here and update
the `render.sh` flags accordingly.

## Attribution

Wallspace is a third-party macOS app. This project does not bundle,
modify, or distribute it — the wallpapers just happen to be the
*kind* of file Wallspace plays.
