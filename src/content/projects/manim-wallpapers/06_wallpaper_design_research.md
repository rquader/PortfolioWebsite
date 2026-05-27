---
title: Wallpaper Design Research
tags: [manim, wallpaper, research]
---

# Wallpaper Design Research

Synthesis of web research done before designing the v2 set of
wallpapers. The goal: ground the next batch in *what is actually
working in 2026 wallpapers*, particularly bright, natural,
macOS-friendly, and animated-but-restrained — the user's stated
preferences and the gap left by the v1 set (all dark, plus the
abstract phyllotaxis the user did not connect to).

This document credits every source; the search log itself is in
[[tool_log]] (every WebSearch + WebFetch is appended there by hook).

## 1. macOS-specific design constraints

### 1.1 The new menu bar (macOS Tahoe / 26)

macOS Tahoe (the version following Sequoia) introduces "Liquid Glass"
— a clear/glassy Dock and a Menu Bar that can show **with or without
a background**. Apple's own framing: *the menu bar typically matches
the dynamics of the wallpaper you choose.* In practice this means:

- The menu bar adapts: a dark wallpaper gets white menu-bar text, a
  light wallpaper gets dark text.
- "Reduce Transparency" / "Increase Contrast" in Accessibility
  forces a solid menu bar — black in Dark mode, light gray in Light
  mode. Plan for this case too.
- HIG: body text needs **≥ 4.5:1 contrast ratio** against its
  background. A wallpaper used behind translucent UI elements (Dock
  icons, menu bar) inherits this requirement *at the regions where
  text would sit*.

### 1.2 What this means for wallpaper design

- **Edges matter more than the middle.** The top ~30 pixels (menu
  bar) and bottom ~70 pixels (dock) carry text and icons. The
  center is where focused windows sit. Whatever's at the edges has
  to be visually quiet enough that text/icons read against it; the
  center can carry more visual interest.
- **Dark wallpapers are the "safe default"** for a desktop with a
  white menu bar in Dark mode, but bright wallpapers can work if the
  *bright regions don't sit at the edges* — e.g. a bright sky in the
  middle, darker silhouettes at top + bottom.

Sources:
- [Apple HIG — Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
- [Apple Community: White Menu Bar background in macOS 26 Tahoe](https://discussions.apple.com/thread/256143478)
- [Apple Community: Menu Bar & Dock Background](https://discussions.apple.com/thread/255390840)

## 2. Apple's own wallpaper aesthetic (Sonoma, Sequoia, Tahoe)

### 2.1 Dynamic wallpapers — the Mojave heritage

Since macOS Mojave (2018), Apple has shipped *dynamic* wallpapers
where the image stays the same but the **lighting and mood shift
through the day** — sunrise, daylight, sunset, night. macOS Sequoia
(2024) shipped "Sequoia Sunrise / Morning / Night" variants of its
landscape wallpaper.

The design language is consistent across generations:

- **A single dominant subject** — usually a landscape (sand dune,
  catalina island, sequoia trees) — that's instantly readable.
- **Atmospheric color across the frame**, not flat color. Apple's
  wallpapers blend warm and cool tones across the image; even the
  abstract Sequoia wallpaper uses a gradient that mixes warm and
  cool in one composition.
- **Soft edges and out-of-focus blur** at the borders, so the
  composition doesn't fight UI chrome.

### 2.2 The Sequoia abstract (warm + cool fluid)

Sequoia's stock abstract wallpaper is a gradient that mixes vibrant
warm and cool tones — explicitly "fluid" rather than rigid geometric.
This is a recent shift: earlier macOS abstracts were more
geometric/structured. The current visual language is *organic
gradient*.

### 2.3 The Tahoe (26) wallpaper

Tahoe ships a new abstract wallpaper paired with the Liquid Glass
UI theme — emphasizing translucency and depth.

Sources:
- [Basic Apple Guy: macOS Sequoia Wallpapers](https://basicappleguy.com/haberdashery/sequoiawallpaper)
- [iClarified: Download the New macOS Sequoia Wallpaper](https://www.iclarified.com/93902/download-the-official-macos-sequoia-15-wallpaper-for-mac)
- [iClarified: Official macOS Tahoe 26 Wallpaper](https://www.iclarified.com/97556/download-the-official-macos-tahoe-26-wallpaper-here)
- [Mr Macintosh: Sequoia Wallpapers 5k](https://mrmacintosh.com/download-the-new-macos-sequoia-wallpaper-desktop-pictures-5k/)
- [Setapp: Where to find Mac dynamic wallpapers](https://setapp.com/lifestyle/dynamic-desktop-wallpapers-for-mac)

## 3. 2026 wallpaper trends (interior-design world, but illuminating)

Interior wallpaper trends are a real signal for desktop wallpaper
trends — they share the "what surrounds you all day" use case. Key
2026 currents:

- **"Force of Nature" / Biophilic Maximalism** — intense greens and
  luminous yellows, "contemporary vertical gardens." Big, alive,
  saturated *plant* imagery. Direct relevance: bright natural
  greens, recognizable botanicals.
- **Earthy naturals + jewel tones** — sage, dusty copper, charcoal,
  rust, off-white; alongside saturated jewel accents.
- **"Quiet minimal surface" patterns** — wallpaper as *atmosphere*
  rather than ornament. Subtle, intentional, but art-driven.
- The duality: bold-expressive AND quiet-minimal both trending. The
  middle ground (mid-saturation, mid-detail) is the dull-zone.

For our use case this maps to:

- A **bright natural** wallpaper with luminous greens / yellows is
  trend-aligned (Force of Nature).
- A **quiet minimal atmospheric** wallpaper (deep palette, sparse
  detail) is *also* trend-aligned. The current v1 set sits here.
- The "boring middle" — mid-detail, mid-saturation, neither bold nor
  minimal — is the trap. Avoid.

Sources:
- [Livettes: Wallpaper Trends 2026](https://livetteswallpaper.com/blogs/interior-blog/wallpaper-trends-of-2026)
- [Living Etc: 7 Wallpaper Trends 2026](https://www.livingetc.com/ideas/wallpaper-trends-2026)
- [Artscape: 2026 Cottage Cool, Biophilic Maximalism](https://artscape-inc.com/blogs/journal/wallpaper-trends-for-2026-cottage-cool-biophilic-maximalism-and-the-rise-of-expressive-walls)
- [Tecnografica: Wallpaper 2026 — 5 Contemporary Trends](https://www.tecnografica.net/en/news/5579/wallpaper-2026-the-5-trends-that-are-redefining-contemporary-interior-design)

## 4. Animated-wallpaper motion principles

### 4.1 "Ambient animation" — the dominant principle

Smashing Magazine's 2025 piece on ambient animations gives the clearest
articulation:

> Ambient animations are subtle, slow-moving details that add
> atmosphere without stealing the show.

This is the *exact* principle the v1 wallpapers were built on
(although discovered by intuition rather than research). Three rules
restated:

1. **Selective animation.** Pick elements that *would naturally
   move* — a leaf, a star, a flame — rather than forcing motion onto
   stable elements. The mental test: "does this thing have weight?
   would it move in real life?"
2. **Restraint.** Animation should feel like something you'd only
   *catch* if you're really looking. If you immediately notice it,
   it's too much.
3. **Layered motion.** A single slow animation is boring. *Five*
   subtle animations on separate layers can feel rich and alive.

### 4.2 The parallax pattern

A common pattern in motion wallpapers: layers shift as the device
tilts (for phones), or differential motion speeds across depth
layers (for desktops). Parallax sells *depth* — multiple objects at
different "distances" all moving at different rates.

The v1 falling-leaves uses this (3 depth layers at different sizes
and opacities). v2 mountains will use it more deliberately (back
range moves slowest, front range moves fastest).

Sources:
- [Smashing Magazine: Ambient Animations in Web Design (Sept 2025)](https://www.smashingmagazine.com/2025/09/ambient-animations-web-design-principles-implementation/)
- [Yahoo Tech: I Forgot About Live Wallpapers](https://tech.yahoo.com/apps/articles/forgot-live-wallpapers-one-now-180015981.html)

## 5. Wallspace (the target app)

Wallspace is built natively in Swift, designed specifically for low
CPU (claims <2%) and battery life. It accepts MP4 directly — no
conversion needed. Its own curation language emphasizes
*"cinematic but not overwhelming"* — exactly the ambient-animation
principle.

This validates: keep file sizes reasonable, MP4 is fine, target
gentle motion. The v1 renders (1–12 MB for 12-second loops at
2560×1664) are comfortably within what Wallspace handles.

Sources:
- [Wallspace homepage](https://wallspace.app/)
- [Why Wallspace Is the Best Free Live Wallpaper App for macOS](https://wallspace.app/blog/why-wallspace-best-free-live-wallpaper-app-macos/)
- [Wallspace Blog](https://wallspace.app/blog)

## 6. Popular nature-wallpaper themes (community signal)

Across community wallpaper repositories (Wallpaper Engine, MoeWalls,
4kwallpapers, WallpaperAccess), recurring popular themes for animated
nature wallpapers:

- **Landscapes at golden hour / sunrise / sunset** — mountains, hills,
  silhouettes against a saturated warm sky. Universally popular.
- **Forests in varied light** — sunbeams through trees, fog, fireflies.
- **Aurora / northern lights** — cool curtain motion over dark sky.
- **Subtle weather** — drifting clouds, soft rain, falling snow.
- **Water** — gentle ripples, reflections, underwater caustics.
- **Botanical close-ups** — fields of flowers, individual stems
  swaying.
- **Minimal nature abstracts** — single-color flat-design hills with
  a sun.

The strong signal: **landscapes with depth + a warm or
high-saturation light source** outperform pure abstract patterns
for "popular" appeal. This matches the user's existing preference
(they connected with recursive_tree's recognizable subject; bounced
off phyllotaxis's abstract math).

Sources:
- [Steam Workshop: Top 100 Landscape & Nature Wallpapers](https://steamcommunity.com/sharedfiles/filedetails/?id=1588337106)
- [WallpaperAccess: Animated Nature](https://wallpaperaccess.com/animated-nature)
- [Wallpaper Engine Space: Nature](https://www.wallpaperengine.space/wallpaper/tag/Nature)
- [MoeWalls: Minimalistic Live Wallpapers](https://moewalls.com/tag/minimalistic/)
- [MotionBGS: Nature Live Wallpapers](https://motionbgs.com/tag:nature/)
- [WallsFlow](https://wallsflow.com/)

## 7. Creative-coding generative-wallpaper context

The closest cultural neighbor to this project is the p5.js / Processing
generative-art community (Daniel Shiffman's "Coding Train" YouTube
channel; OpenProcessing.org; the broader fxhash / Art Blocks lineage).
Common patterns that translate well to wallpapers:

- **Flow fields** — particles following a procedural vector field,
  leaving trails. Calm, organic-looking, intrinsically loopable if
  the field is periodic.
- **L-systems** — already used (informed v1 tree). Endless variation
  possible with stochastic rules.
- **Reaction-diffusion** — Turing patterns, organic blobs. Beautiful
  but computationally heavy.
- **Signed distance fields / shaders** — fluid, glowy, very macOS-y.
  Out of reach for Manim specifically (Manim renders shapes; SDF
  rendering is a GPU thing).
- **Cellular automata** — Conway-like, but tuned for aesthetics
  rather than maths.

For Manim specifically, what translates well:

- Anything that can be expressed as **N parameterized objects** that
  each have a closed-form position(t) function. Sin waves, wrapping
  trajectories, integer-cycle rotations. (Same insight as
  [[02_design_principles#III. Seamless loops are a hard constraint, not a nice-to-have]].)
- Anything with **recursive / fractal structure** that can be
  pre-built and animated as a whole (the tree).
- Anything where **depth/parallax** comes from per-object size +
  opacity rather than a real 3D camera.

What's out of reach in Manim:

- Real fluid simulation (use a shader tool).
- Real 3D camera-based parallax (Manim's 3D mode exists but is
  optimized for math illustration, not landscape).
- Pixel-level effects (blur, bloom, lens flare) — Manim works in
  vector space.

Sources:
- [p5.js](https://p5js.org/)
- [Creative Coding Beginner's Guide to Generative Art with p5.js](https://thehobbyhopper.substack.com/p/creative-coding)
- [Beginner's Guide to Learning p5.js for Generative Art (fxhash)](https://www.fxhash.xyz/article/beginner's-guide-to-learning-p5.js-for-generative-art)

## 8. Synthesis — what to make next

Combining all of the above with the user's stated preferences:

| Want                                              | Design implication                                                                                            |
|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Bright natural colors (user)                      | At least 2 of the next 4 should have bright/warm/saturated palettes.                                          |
| Recognizable organic subjects (user)              | Subjects should READ instantly (tree, mountain, aurora, flowers) — no pure abstract math.                     |
| Calm motion (everyone)                            | Ambient animation; under-do it before over-doing it. Multiple slow layers > one fast.                         |
| macOS-friendly (HIG)                              | Top and bottom edges quiet; bright regions in the middle of the frame.                                        |
| Wallspace-compatible (target app)                 | MP4, 60fps, ~10–15 second seamless loop, ≤20 MB ideally.                                                      |
| Improve on the user's favorite (recursive tree)   | One of the next four should be tree v2 — better leaves, atmospheric depth, more "alive."                      |

The proposed concepts are in [[07_v2_concept_design|07_v2 Concept Design]].

## 9. Sources index

All sources cited above, consolidated for reuse:

- **Apple official:**
  - [Designing for macOS (HIG)](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
  - [Apple HIG home](https://developer.apple.com/design/human-interface-guidelines/)
- **macOS wallpaper coverage:**
  - [Basic Apple Guy: Sequoia Wallpapers](https://basicappleguy.com/haberdashery/sequoiawallpaper)
  - [iClarified: Sequoia](https://www.iclarified.com/93902/download-the-official-macos-sequoia-15-wallpaper-for-mac)
  - [iClarified: Tahoe 26](https://www.iclarified.com/97556/download-the-official-macos-tahoe-26-wallpaper-here)
  - [Mr Macintosh: Sequoia 5k](https://mrmacintosh.com/download-the-new-macos-sequoia-wallpaper-desktop-pictures-5k/)
  - [Setapp: Dynamic Mac Wallpapers](https://setapp.com/lifestyle/dynamic-desktop-wallpapers-for-mac)
- **Interior-design trend signal:**
  - [Living Etc 2026](https://www.livingetc.com/ideas/wallpaper-trends-2026)
  - [Livettes 2026](https://livetteswallpaper.com/blogs/interior-blog/wallpaper-trends-of-2026)
  - [Artscape: Biophilic Maximalism](https://artscape-inc.com/blogs/journal/wallpaper-trends-for-2026-cottage-cool-biophilic-maximalism-and-the-rise-of-expressive-walls)
  - [Tecnografica 2026](https://www.tecnografica.net/en/news/5579/wallpaper-2026-the-5-trends-that-are-redefining-contemporary-interior-design)
- **Animation principles:**
  - [Smashing Magazine: Ambient Animations](https://www.smashingmagazine.com/2025/09/ambient-animations-web-design-principles-implementation/)
  - [Yahoo Tech: Live Wallpapers](https://tech.yahoo.com/apps/articles/forgot-live-wallpapers-one-now-180015981.html)
- **Target app:**
  - [Wallspace](https://wallspace.app/)
  - [Wallspace Blog](https://wallspace.app/blog)
- **Community signal:**
  - [Steam Workshop: Top 100 Nature](https://steamcommunity.com/sharedfiles/filedetails/?id=1588337106)
  - [WallpaperAccess: Animated Nature](https://wallpaperaccess.com/animated-nature)
  - [Wallpaper Engine Space: Nature](https://www.wallpaperengine.space/wallpaper/tag/Nature)
  - [MoeWalls Minimalistic](https://moewalls.com/tag/minimalistic/)
  - [MotionBGS Nature](https://motionbgs.com/tag:nature/)
- **Creative coding:**
  - [p5.js](https://p5js.org/)
  - [fxhash p5.js Guide](https://www.fxhash.xyz/article/beginner's-guide-to-learning-p5.js-for-generative-art)

Every source above is credited because (a) the synthesis above
genuinely draws on these readings, and (b) future Claude sessions
should be able to retrace the reasoning rather than re-research the
same ground.
