---
title: V2 Concept Design — Four New Wallpapers
tags: [manim, wallpaper, design, v2]
---

# V2 Concept Design

Design rationale for the next four wallpapers, drawing on:

- **The user's stated feedback on v1**:
  - Loved the [[wallpapers/01_recursive_tree|recursive tree]] most.
  - Liked [[wallpapers/04_constellation|constellation]] second.
  - "Meh" on [[wallpapers/02_falling_leaves|falling leaves]] —
    leaves looked like ovals, didn't read as leaves.
  - Didn't connect to [[wallpapers/03_phyllotaxis|phyllotaxis]] —
    too abstract / mathematical.
  - Wants brighter, natural colors like leaves and landscapes.

- **Research findings** in [[06_wallpaper_design_research]]:
  - Recognizable organic subjects > abstract math for "popular".
  - Ambient animation principles (restraint, layered motion).
  - Bright but mindful of menu bar / dock (HIG contrast).
  - 2026 trend toward "Force of Nature" — bright greens + luminous
    yellows + biophilic botanicals.

The four concepts below address each gap and each lean into a
different direction the user signaled.

---

## #1 — Recursive Tree v2 (improvement on user favorite)

- **File:** `scenes/recursive_tree_v2.py` → `RecursiveTreeV2Wallpaper`
- **Palette:** `FOREST` (existing) — already loved, refining.
- **Theme:** same CS / recursion concept, executed deeper.

### What changes from v1

| v1                          | v2                                                                 |
|-----------------------------|--------------------------------------------------------------------|
| Lines + accent dots at tips | Real **5-pointed leaf shapes** scattered at terminal + sub-terminal branches |
| Pure binary recursion       | + occasional 3-way branching for richer canopy                     |
| Single sway wave            | + a slower, lower-amplitude *secondary* sway (gust + breeze)       |
| Flat background             | + **soft atmospheric depth** (radial vignette toward roots)        |
| 127 branches at depth 7     | 255 branches at depth 8 — denser canopy                            |
| No particles                | + drifting pollen / spore dots (~20, very subtle)                  |

### Why these specifically

- **Leaf shapes** address the user's "leaves felt wrong" feedback
  from v1 falling leaves. A simple 5-pointed polygon is enough to
  read as "leaf" without becoming a literal botanical specimen.
- **Two sway layers** are the [[06_wallpaper_design_research#4.1 "Ambient animation" — the dominant principle|"five subtle animations" principle]] —
  layered motion feels alive; single motion feels mechanical.
- **Atmospheric depth** is the [[06_wallpaper_design_research#2 Apple's own wallpaper aesthetic (Sonoma, Sequoia, Tahoe)|Apple aesthetic move]] —
  blend tones across the frame instead of flat background.
- **Particles** — pollen / spores drifting between branches —
  contribute to *layered motion* without overpowering.

### Loop seamlessness

All animations integer-cycle over `DURATION = 12s`:
- Primary sway: 2 cycles per loop (same as v1).
- Secondary sway: 1 cycle per loop (slower).
- Particle drift: 1 cycle per loop (linear wrap top-to-bottom).

---

## #2 — Golden Hour Mountains (bright landscape, popular subject)

- **File:** `scenes/golden_hour_mountains.py` → `GoldenHourMountainsWallpaper`
- **Palette:** **new `DAWN` palette** — deep indigo, coral, gold,
  mountain-purple.
- **Theme:** layered mountain silhouettes against a sunrise/sunset
  sky. The macOS Mojave / Sequoia lineage made into a procedural
  scene.

### Composition

- **Sky gradient** filling the whole frame: deep indigo at top →
  warm coral mid → gold near horizon. Procedurally rendered as
  many thin horizontal bands (so the gradient transitions are smooth
  at 2560×1664).
- **Three depth layers of mountains** silhouetted across the lower
  ~55% of the frame:
  - **Back range**: pale lavender-gray, low ridge, drifts slowly.
  - **Mid range**: deeper plum-gray, taller ridge, drifts slower.
  - **Front range**: near-black silhouette, sharpest peaks,
    static (anchored).
- **A sun disk**: warm cream, low in the sky, sits at the horizon
  line. Static (the sky moves, not the sun — opposite of reality but
  *much* better wallpaper composition, since the sun would clip out
  of frame otherwise).
- **A few sparse clouds**: thin ellipses at one of the back/mid
  layers, drifting horizontally.

### Why this addresses "bright" without breaking macOS chrome

- **Top of frame is darkest** (indigo) — menu bar text reads white
  cleanly.
- **Bottom 2/3 brightens** (coral → gold) — the area where windows
  sit gets the warm color hit the user wanted.
- **Front mountains** create a dark band JUST above the dock area
  — dock icons sit on near-black silhouette, perfect contrast.
- **Center of frame is the brightest** — the part of the wallpaper
  most often visible behind translucent windows.

This is the "bright wallpaper that still works with macOS UI"
puzzle solved by composition.

### Motion

- **Sky color band**: very slowly shifts hue over the loop (subtle
  sunset progression). Sin-wave hue shift, 1 cycle per loop.
- **Clouds drift right-to-left**, wrap. Integer cycle counts.
- **Back range** drifts horizontally at ~0.05 units/sec.
- **Front range** is anchored (parallax suggestion).

Ambient-animation discipline: nothing fast, everything synchronised
to the loop.

---

## #3 — Aurora Borealis (dark + vibrant)

- **File:** `scenes/aurora.py` → `AuroraWallpaper`
- **Palette:** **new `AURORA` palette** — deep navy, emerald green,
  electric cyan, vibrant magenta.
- **Theme:** northern lights curtains slowly undulating over a star
  field. The natural sibling to [[wallpapers/04_constellation|constellation]]
  but with COLOR and MOTION.

### Composition

- **Background**: very deep navy, slight gradient (slightly bluer
  at top, slightly darker at horizon).
- **Star field** (~40 small white/cool dots) scattered in the upper
  60% of frame. Some twinkle subtly (same pattern as constellation).
- **Three to five aurora ribbons**: each is a flowing curve drawn
  with `ParametricFunction`, undulating across the frame. Each
  ribbon has:
  - A base path (sin-of-sin parametric).
  - A color gradient (e.g. green→cyan, magenta→pink).
  - Per-frame undulation: the wave parameters shift on a sin cycle.
  - Variable thickness across the curve (thicker at peaks, thinner
    at edges — like a real aurora curtain).
  - Soft alpha falloff so the ribbon glows rather than draws a hard
    line.

### Implementation note

Manim's `ParametricFunction` takes a `t → (x, y, z)` function. For
the aurora ribbons:

```python
def ribbon(s, time, base_y, amp, freq):
    x = -frame_w/2 + s * frame_w
    y = base_y + amp * math.sin(freq * s + 2π * time/DURATION) \
              + amp * 0.4 * math.sin(2 * freq * s + 2π * time/DURATION * 2)
    return [x, y, 0]
```

The `time` parameter is captured by the updater closure. Two
nested sines give the "curtain folds within folds" look that real
auroras have.

### Why this addresses what the user likes

- Recognizable subject (aurora is iconic).
- Calm, slow motion (ambient).
- The user liked dark wallpapers (constellation) and color — aurora
  combines both.

### Loop seamlessness

Each ribbon's wave-parameter cycle is an integer number per loop.
Star twinkle is the same constellation pattern (proven to work).

---

## #4 — Wildflower Meadow (bright, lively, addresses "bright natural")

- **File:** `scenes/wildflower_meadow.py` → `WildflowerMeadowWallpaper`
- **Palette:** **new `MEADOW` palette** — honey-cream background,
  fresh greens, vibrant yellows, soft pinks, whites.
- **Theme:** procedural field of stems with flower heads, swaying in
  a breeze under warm light.

### Composition

- **Background**: a vertical gradient — pale gold at top (sunlit
  sky implied) through honey-cream in the middle to deeper warm
  grass-color at the bottom.
- **Tall grass blades** (~70 thin curved lines in greens) anchored
  at the bottom edge, lengths varying. Form a soft "field" texture.
- **Wildflower stems** (~30 taller stems with flower heads at the
  top):
  - Each stem is a thin curved Line.
  - Each flower head is a small **petal cluster** — 5-6 small
    Dots arranged in a circle around a center Dot.
  - Flower colors drawn from a small bright bouquet palette:
    yellow, pink, magenta, white, pale orange.
- **Drifting pollen particles** (~15 in the air above the field).
  Same drift mechanism as recursive_tree v2.

### Why this addresses "bright natural colors like leaves and landscapes"

- This is the most directly responsive concept to the user's stated
  preference. A meadow has *bright greens* + *vibrant flower colors*
  + *warm light* — every component of the brief.
- It's also the most "biophilic maximalism" of the four — aligned
  with the 2026 trend signal from
  [[06_wallpaper_design_research#3 2026 wallpaper trends (interior-design world, but illuminating)]].

### macOS chrome considerations

- The brightest part of the frame is *between* the grass band (bottom)
  and the sky band (top) — i.e. roughly where windows sit.
- The very top has a pale gold band — light enough that *light-mode*
  menu bar text reads, but with Accessibility's "Increase Contrast"
  forcing solid menu bar, it'll still work.
- The bottom band is a warm grass-color — darker than the sky, so
  dock icons read.
- **Caveat**: this one's the most likely to feel "too bright" with
  default Dark Mode UI. We render it and judge.

### Motion

- Grass blades **sway gently** (slow sin wave per blade, phase
  offset across the field).
- Flower stems **sway slightly slower** than grass (taller = slower
  by physical intuition).
- Pollen particles **drift upward slowly**.

All integer-cycle. Layered motion principle (grass + stems + pollen
+ subtle background hue shift = four ambient layers).

---

## Implementation order

Estimated render times based on v1 experience (≤ 5 min each at
2560×1664 / 60fps / 12s).

1. **Recursive Tree v2** first — building on existing code, fastest
   to ship, gives the user their favorite back in better form.
2. **Aurora** — different but uses similar primitives (ParametricFunction
   is new but straightforward).
3. **Wildflower Meadow** — most novel composition, several new
   element types. Most likely to need iteration.
4. **Golden Hour Mountains** — most polish-heavy (the gradient
   sky has to feel smooth at native res); save for last so the
   render-iteration loop is fresh.

## What this set commits to (the design contract)

- 2 brighter wallpapers (mountains, meadow), 2 atmospheric ones
  (tree, aurora).
- 4 distinct subjects, none repeating v1.
- All recognizable as their subject — no pure-abstract math.
- Each uses some pattern proven in v1:
  - Tree v2 — the flat-list-with-parent-indices pattern.
  - Mountains — the per-element parameter-bag pattern (mirrors
    falling_leaves' `_LeafParams`).
  - Aurora — the cached-rotation-delta pattern (for ribbon phase
    shift).
  - Meadow — the layered-depth pattern (mirrors falling_leaves' 3
    depth layers).

This means **each new scene is a recombination of techniques the
project already validates**. Low risk, high payoff.
