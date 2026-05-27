---
title: README
tags: [manim, wallpaper]
---

# Manim Wallpaper — README

Four animated wallpapers for the 13-inch M5 MacBook Air, built with
Manim and designed to loop seamlessly via the Wallspace app.

The **code** lives at `~/Developer/Manim_Wallpaper/`. The **docs**
(this Obsidian folder) are where the project is *explained*. Start
with [[00_index]] for navigation.

## The four wallpapers at a glance

| # | Wallpaper                                  | Theme       | Palette    |
|---|--------------------------------------------|-------------|------------|
| 1 | [[wallpapers/01_recursive_tree\|Recursive Tree]]   | CS          | Forest     |
| 2 | [[wallpapers/02_falling_leaves\|Falling Leaves]]   | Natural     | Autumn     |
| 3 | [[wallpapers/03_phyllotaxis\|Phyllotaxis]]         | Best        | Sunflower  |
| 4 | [[wallpapers/04_constellation\|Constellation]]     | Lockscreen  | Night      |

All four render at 2560×1664 @ 60 fps for 12 seconds and loop
seamlessly. See [[02_design_principles#III. Seamless loops are a hard constraint, not a nice-to-have]]
for the math.

## To render

From `~/Developer/Manim_Wallpaper/`:

```bash
./render.sh scenes/recursive_tree.py RecursiveTreeWallpaper
```

The wrapper pins resolution, fps, format, and PYTHONPATH so you
don't have to remember any flags. See [[05_render_pipeline]] for what
each flag does.

## To extend

Want a fifth wallpaper? Follow [[04_replication_guide]] — it walks
through the conventions a new scene file should follow.

## Where the rendered files end up

```
~/Developer/Manim_Wallpaper/output/finals/01_recursive_tree.mp4
                                          /02_falling_leaves.mp4
                                          /03_phyllotaxis.mp4
                                          /04_constellation.mp4
```

Drop those into Wallspace.
