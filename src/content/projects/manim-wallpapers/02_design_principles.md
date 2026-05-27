---
title: Design Principles
tags: [manim, wallpaper, design]
---

# Design Principles

The aesthetic and technical principles every wallpaper in the project
honors. If you're tweaking an existing scene or writing a new one,
these are the rules to push against.

## I. Calm beats clever

A desktop wallpaper is on screen for hours. You see it while you read,
write code, sit on a video call. Anything that demands attention —
fast motion, high-frequency flicker, busy detail — becomes hostile
within minutes.

Practical rules:

- **Periods of 4–12 seconds**, not 0.5 seconds. Slow oscillations read
  as "alive" without becoming a distraction.
- **No saturated jewel tones at full opacity in the foreground**.
  Saturation belongs to small accent areas (a warm star, a single
  amber leaf) on a muted ground.
- **No sudden motion changes**. Use `smooth_loop` (raised cosine,
  zero-derivative endpoints) rather than `linear_loop` whenever a
  parameter peaks and returns.
- **Animation amplitude is small**. The tree sways ~5° at the trunk,
  not 30°. The phyllotaxis rotates once in 12 seconds, not eight times.

## II. The wallpaper must respect the macOS chrome

Specifically:

- The **menu bar** (top, ~24 pt tall) uses white text in dark mode.
  Whatever's at the top of the wallpaper must be dark enough for white
  text to read against it.
- The **dock** (bottom, ~70 pt tall when visible) translucently blurs
  whatever's behind it; icons sit on top. Strong contrast or busy
  detail behind icons makes them hard to read.
- The **center of the screen** is where focused windows usually live,
  so it can take more visual interest — but only just.

Every palette is chosen so the background is dark and the bright tones
sit *inside* the frame, not at the edges. The phyllotaxis pattern is
centered with margin around it precisely so the rim of seeds doesn't
fight the menu bar or dock.

## III. Seamless loops are a hard constraint, not a nice-to-have

See [[01_architecture#Law 2]] and [[decisions/ADR-002-seamless-loops]].

The principle: **every motion parameter expresses its cycle count as a
positive integer over `DURATION`**. This guarantees the start frame
and end frame are pixel-identical without any post-processing
trickery.

Why we don't rely on crossfades or video-looping software to hide
seams: they (a) require trusting that Wallspace specifically does
this, which we don't want to depend on, and (b) introduce a soft
"shimmer" at the loop point that's worse than a clean cut on a
seamless video.

## IV. Palette choices

Each palette is a hand-picked group of 5–7 colors. Common discipline:

- **One dark background** plus 4–6 graduated tones plus one accent.
- **Analogous core** (colors next to each other on the wheel) with
  the accent being either complementary or a warm spike on a cool
  ground.
- **All tones darker than mid-gray** so the bright accent never
  blinds.
- **Hex strings, not Manim color constants**, because the latter
  ship with hard-coded values that don't always cohere with each
  other.

### FOREST — CS theme (recursive tree)

- bg: `#0A1620` (deep ocean blue-green, almost black)
- tones: cool teal-greens, sage to mint
- accent: pale, near-white green

Reads as "code-adjacent" because cyan/teal is the dominant terminal
palette of the last 30 years, and as "natural" because the tones are
plant greens. The deep, slightly desaturated bg gives the canopy room
to glow without lighting up.

### AUTUMN — natural theme (falling leaves)

- bg: `#0F1A14` (very dark evergreen)
- tones: mossy green, fresh leaf green, golden amber, deep amber, rust,
  rich red-orange
- accent: pale gold

Bright natural without being seasonally locked. The two greens at the
front of the tone list keep the palette feeling alive (spring) rather
than ending-of-life (pure autumn). The dark evergreen ground reinforces
"forest floor at dusk" rather than "graveyard."

### SUNFLOWER — best-designed theme (phyllotaxis)

- bg: `#160E0A` (dark coffee)
- tones: dark umber, warm chocolate, rich amber, sunflower orange,
  sunflower yellow, pale cream
- accent: cream

Inspired by the actual seed-head coloration of *Helianthus annuus*.
The gradient runs from the deepest interior (immature seeds) to the
brightest edge (mature seeds), mirroring the biological reality. The
warm dark bg lets the yellow rim glow.

### NIGHT — lockscreen theme (constellation)

- bg: `#050B18` (deep space navy)
- tones: dark blue, muted purple-blue, mid blue, pale blue, near-white
- accent: warm gold

Star spectral types in miniature: most stars cool and white-blue, a
few warm and gold (mimicking red-giant accents). The deep navy bg
reads as "space" without being purely black, which avoids the wallpaper
feeling like a dead screen.

## V. Composition

- **Asymmetry inside a stable frame** — the tree is centered but its
  internal jitter makes it organic. The leaves are uniformly scattered
  but their colors and sizes vary. The phyllotaxis is perfectly
  symmetric mathematically but feels organic because of the golden-angle
  irrationality.
- **One focal pattern per wallpaper** — there's only one "thing"
  happening visually. Not a tree plus floating particles plus a
  textured background.
- **Negative space at the edges** — every scene has a margin of
  background before content starts. This is what makes the wallpaper
  feel like a wallpaper instead of a poster.

## VI. Motion principles

- **Phase-shifted propagation** — wherever multiple objects share a
  motion type, give each its own phase. The tree's per-branch sway
  phase increases with depth so the wind appears to travel up the
  tree. Falling leaves' fall phases are random `[0, 1)` so leaves
  don't enter the frame in lockstep.
- **Mixed cycle counts within a single scene** — most falling leaves
  fall once per loop, but some fall twice or three times. This gives
  variety without breaking seamlessness, because every per-leaf count
  is still an integer over `DURATION`.
- **Restraint on rotation** — most leaves don't rotate. Spinning
  ellipses look like coins, not leaves. Only a minority slowly turn
  (`rot_cycles ∈ {-1, 0, 0, 0, 1}` — three out of five draws are
  zero).

## VII. Code-as-craft

The wallpapers exist to be beautiful; the code exists to be read.
Stated principles for the source:

- **No magic numbers in function bodies**. All tunables are
  `Final`-typed constants at module top so the reader can sweep one
  parameter at a time.
- **Dataclasses for per-element state**, even when the class is
  small. A `_Branch` with named fields is much easier to evolve than
  a tuple of `(parent_idx, angle, length, depth)`.
- **One pass per frame**. Per-frame work runs once per `update()`
  call; no nested redundant loops.
- **Numpy for vector math**. The tree layout uses a single numpy
  `starts` array; rotation in phyllotaxis goes through Manim's group
  `.rotate(delta, about_point=ORIGIN)`.

## VIII. The negative space — things we *don't* do

- **No glowy filters or blur post-processing**. Manim doesn't natively
  ship these, and adding them via ffmpeg post-processing introduces
  another step that has to be re-validated for seamlessness. Crisp
  vector edges look beautiful at 2560×1664 anyway.
- **No image backgrounds or textures**. Solid color is enough; texture
  competes with the foreground pattern.
- **No text, no logos, no "design awards please" flourishes**.
- **No randomness that varies between renders**. Every random source
  is seeded so the wallpaper is reproducible bit-for-bit.

See [[04_replication_guide]] for how to write a new wallpaper that
honors all of the above.
