---
title: Render Pipeline
tags: [manim, wallpaper, render]
---

# Render Pipeline

What happens when you type `./render.sh scenes/foo.py FooScene`, and
why every step is shaped the way it is.

## The wrapper script

`render.sh` (in the project root) does three things and then `exec`s
Manim:

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_MANIM="$SCRIPT_DIR/.venv/bin/manim"

export PYTHONPATH="$SCRIPT_DIR:${PYTHONPATH:-}"

exec "$VENV_MANIM" \
  -qh --fps 60 -r 2560,1664 --format mp4 \
  "$@"
```

| Step                                       | Why                                                                                                |
|--------------------------------------------|----------------------------------------------------------------------------------------------------|
| Use the project's `.venv/bin/manim`        | Ignores the system Python entirely. No "works on my machine" issues from a different Manim version.|
| Set `PYTHONPATH` to project root           | So scene files can `from lib.config import ...` no matter where they live in the tree.             |
| Pin `-r 2560,1664 --fps 60 --format mp4`   | A clean render of the chosen format. CLI flags override programmatic config, so this is the gate.  |
| `exec` instead of `manim ... &`            | Replaces the shell process so signals (Ctrl-C) reach Manim directly without an extra fork.         |
| `"$@"` last                                | Lets you append your own flags, e.g. `-o my_name` or `-p` for preview-after-render.                |

## What each Manim flag does

```
manim -qh --fps 60 -r 2560,1664 --format mp4 -o tree scenes/recursive_tree.py RecursiveTreeWallpaper
```

| Flag                              | Effect                                                                                                |
|-----------------------------------|-------------------------------------------------------------------------------------------------------|
| `-qh`                             | "High-quality" preset (1080p15). Mostly inert here because `-r` overrides the pixel dims and `--fps` overrides the framerate. Kept for clarity. |
| `--fps 60`                        | 60 frames per second. 60 fps reads as smooth motion; 30 fps is acceptable; 15 fps stutters.           |
| `-r 2560,1664`                    | Pixel dimensions. Width comes first, then height.                                                     |
| `--format mp4`                    | Encode to h264 MP4. Wallspace plays this directly.                                                    |
| `-o tree`                         | Output filename stem (`tree.mp4`). Default would be the Scene class name.                             |
| `scenes/recursive_tree.py`        | Source file containing the scene definition.                                                          |
| `RecursiveTreeWallpaper`          | Class name to render. A single file can contain multiple Scene classes; this picks one.               |

## Output paths

Manim writes to:

```
media/videos/<source_file_stem>/<height>p<fps>/<output_name>.mp4
```

For our renders that's:

```
media/videos/recursive_tree/1664p60/tree.mp4
media/videos/falling_leaves/1664p60/falling_leaves.mp4
media/videos/phyllotaxis/1664p60/phyllotaxis.mp4
media/videos/constellation/1664p60/constellation.mp4
```

We additionally copy the polished versions into:

```
output/finals/01_recursive_tree.mp4
output/finals/02_falling_leaves.mp4
output/finals/03_phyllotaxis.mp4
output/finals/04_constellation.mp4
```

…because (a) it's easier to drag four files from one folder into
Wallspace than to hunt them across `media/videos/*/1664p60/`, and (b)
the numbered names give a stable preferred-order independent of
filesystem mtime.

## File sizes you should expect

At 2560×1664 / 60 fps / 12 s:

| Scene             | File size | Why                                                                                              |
|-------------------|-----------|--------------------------------------------------------------------------------------------------|
| constellation     | ~1 MB     | Sparse — few mobjects, slow motion → great temporal compression.                                 |
| falling_leaves    | ~2 MB     | Moderate count, smooth wrap-around motion compresses reasonably well.                            |
| recursive_tree    | ~3.6 MB   | ~127 lines all moving every frame; thicker strokes mean more pixel-level change between frames.  |
| phyllotaxis       | ~12 MB    | 1500 dots all rotating together — every dot's pixels change every frame. Compression's worst case.|

Anything over ~50 MB for 12 seconds at this resolution suggests the
scene has too much per-frame variation. Profile if you hit that.

## What governs the size

For a wallpaper, the dominant factor is **how many pixels change
between consecutive frames**. h264 keyframes are cheap; differential
frames between two near-identical frames are also cheap. The
expensive case is when every pixel in every frame is different —
which is exactly what fast, dense motion creates.

If a render comes out huge:

1. Slow the motion (longer period).
2. Make the moving objects smaller or fewer.
3. Increase contrast between moving foreground and static background
   (so the *unchanged* pixels stay maximally constant).
4. Re-encode at a higher CRF if you absolutely need a smaller file —
   but the cost is visual quality at the seams of moving objects.

## Cache and reproducibility

Manim caches partial movie files at:

```
media/videos/<scene>/<quality>/partial_movie_files/
```

These are intermediate per-animation video segments. They speed up
re-renders when only part of the scene changed. Safe to delete if
you want a clean rebuild.

Every random source in the scenes is **seeded** (`random.Random(SEED)`)
so re-rendering produces the same wallpaper bit-for-bit. If you want
a different variant, change the seed.

## How to render at a different resolution

If you want a preview to check that a tweak landed:

```bash
.venv/bin/manim -ql --fps 30 scenes/recursive_tree.py RecursiveTreeWallpaper
```

`-ql` is 480p15; combined with `--fps 30` you get a quick preview.

**Caveat:** `MACBOOK_AIR_13_M5.apply()` runs at module load and pins
the pixel dims to 2560×1664. Manim's CLI `-r/-ql` flags happen *after*
that — they win, but `frame_width` is set programmatically to match
2560×1664's aspect ratio and is *not* overridden by `-ql`. So a `-ql`
preview will be 480p but still with a 1.538 aspect ratio (not the
default 1.778). This is what you want for a faithful preview — same
composition, smaller pixel grid.

## How to render to a different aspect ratio entirely

If you need a 4K iMac wallpaper (3840×2160, 16:9) instead, the cleanest
path is a new config:

```python
# lib/config.py — add alongside MACBOOK_AIR_13_M5
IMAC_27_5K: Final[WallpaperConfig] = WallpaperConfig(
    pixel_width=3840,
    pixel_height=2160,
)
```

…then `IMAC_27_5K.apply()` in the scene instead. Don't temporarily
mutate `MACBOOK_AIR_13_M5` — its frozen dataclass status will reject
the attempt, which is intentional. Configurations are values; pick
the value, don't edit it.
