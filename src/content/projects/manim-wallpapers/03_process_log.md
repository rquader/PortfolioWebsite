---
title: Process Log
tags: [manim, wallpaper, notes]
created: 2026-05-13
---

# Process Log

A running log of decisions, dead-ends, and lessons-learned while building
the wallpapers. Entries are in order they happened, not in importance —
read top-to-bottom for the actual journey, or skip to the [[01_architecture]]
and [[02_design_principles]] notes for the cleaned-up summary.

## 0. Goal

User wants animated wallpapers for a 13-inch M5 MacBook Air, compatible
with the Wallspace app. Three targets and one bonus:

- **CS-themed** — first-year CS student wants something that reads as
  "code-adjacent" without being gimmicky.
- **Natural** — bright natural colors (leaves, landscapes).
- **Best designed** — most-beautiful overall.
- **Bonus** — a lockscreen-leaning option.

Constraints emphasized by the user:
- Native resolution (2560×1664) — actual M5 Air pixel grid.
- Seamlessly looping (Wallspace plays it on a loop).
- "Animated but not OVERLY animated."
- Modular, senior-engineer-quality code.
- Connoisseur-grade visual design.

## 1. Environment + paths

- Working dir: `~/Developer/Manim_Wallpaper/`
- Obsidian vault: `<vault>/Programming/Manim_Wallpaper/`
- Manim Community 0.20.1 installed in project `.venv`
- Python 3.14.4, ffmpeg available
- M5 Air confirmed at 2560×1664 native (Retina)

**Hurdle:** macOS sandbox initially refused to list the iCloud Obsidian
folder ("Operation not permitted"). User granted access to the target
subfolder specifically. Also added an `additionalDirectories` entry in
`.claude/settings.local.json` so Claude Code stops asking for permission
on each write.

## 2. Architecture decision — code vs docs separation

Discussed three layout options with the user:
- Everything in Developer + symlink to Obsidian
- Everything in Obsidian (including .venv and renders)
- Code in Developer, docs in Obsidian (chosen)

**Chosen:** Code (Python scenes, lib, renders) stays in `/Developer`,
where the venv already lives and where large `.mp4`s won't bloat iCloud
sync. Markdown lives in the Obsidian vault and is the canonical
docs/notes hub. Renders stay in `/Developer/media/videos/...` — Obsidian
gets a markdown gallery pointing at them.

## 3. The seamless-loop principle (the constraint that shapes everything)

Wallspace plays the rendered video on loop. If the last frame doesn't
visually match the first, the loop has a visible seam — instant
"this is a video, not a wallpaper" feeling.

Three classes of solution:
1. **Periodic motion** (sin/cos, integer cycles per loop) — automatic.
2. **Wrapping motion** (positions mod a span) — also automatic if speeds
   are commensurate.
3. **One-shot animations** (grow then decay) — only seamless if the end
   pose equals the start pose, which is annoying to enforce.

I chose (1) and (2) everywhere. The [[lib/easing.py]] module exposes
`sin_wave`, `smooth_loop`, `linear_loop`, `angular_loop` — all four are
strictly periodic over a chosen `period`. Every wallpaper uses an
**integer** number of these cycles per `DURATION`, which guarantees
pixel-identical start and end frames.

Decided **not** to do a one-shot grow-then-sway animation for the tree
(originally tempting because "growing tree" is a fun CS metaphor for
recursion), because the growth phase doesn't loop and would either
require a hidden teleport or a long, dull static section.

## 4. Library design — `lib/`

Three modules:

- **`lib/config.py`** — `WallpaperConfig` dataclass that holds pixel
  dims, fps, duration, and exposes `frame_width` (derived from aspect
  ratio so coordinates aren't squished). The single instance
  `MACBOOK_AIR_13_M5` is what every scene imports and calls `.apply()`
  on at module load.

  **Hurdle:** Manim's CLI flag `-r 2560,1664` sets pixel dims, but
  doesn't automatically set `frame_width` to match the aspect ratio.
  Without explicitly setting `frame_width = frame_height * (2560/1664)`,
  on-screen coordinates get horizontally squished because Manim defaults
  to a 16:9 frame width. Setting `frame_width` programmatically in
  `apply()` fixes this regardless of what flags the CLI is invoked
  with.

- **`lib/palette.py`** — `Palette` dataclass + four hand-picked
  palettes:
  - `FOREST` — deep ocean teal-green (CS / recursive tree).
  - `AUTUMN` — bright warm leaves on dark evergreen (natural).
  - `SUNFLOWER` — umber → gold → cream (phyllotaxis).
  - `NIGHT` — deep navy with cool stars + warm accent (constellation).

  `Palette.tone(t)` snaps to a discrete tone; `Palette.gradient(t)`
  lerps between adjacent tones via the `lerp_hex` helper.

  **Adjustment after first render:** initial FOREST had `tones[0] =
  "#1F3340"` which was too close in value to the background `#0A1620`
  — trunk barely visible. Bumped darkest tone up two shades to
  `"#2F5860"` so the trunk reads against the bg without losing depth.

- **`lib/easing.py`** — periodic functions (described above).

## 5. Wallpaper 1: Recursive fractal tree

**Concept:** L-system / recursive binary tree, sways in a phase-shifted
breeze that travels from trunk to canopy.

### Implementation approach (and why)

Considered two structures:
- **Nested VGroups** (a parent line owns child sub-groups). Natural for
  recursion but rotation propagation gets messy — every level needs its
  own rotate-about-the-parent's-endpoint logic, and Manim's group
  rotation rotates about the group's own center by default.
- **Flat list of branches with parent indices** (chosen). Each `_Branch`
  is a small dataclass: `parent`, `rel_angle`, `length`, `depth`.

Building DFS guarantees a parent is appended before its children, so
the per-frame layout can iterate forward once and trust that any
branch's parent has already been resolved.

```python
for i, b in enumerate(branches):
    sway = sin_wave(t, SWAY_PERIOD, phase=b.depth * SWAY_PHASE_PER_DEPTH) * SWAY_AMP
    if b.parent == -1:
        starts[i] = root_pos
        abs_angles[i] = b.rel_angle + sway
    else:
        p = b.parent
        starts[i] = starts[p] + direction(abs_angles[p]) * branches[p].length
        abs_angles[i] = abs_angles[p] + b.rel_angle + sway
```

This makes the wind effect look right out of the box — sway compounds
upward through the tree (deep branches inherit parent sway plus their
own), and the per-depth phase shift makes the motion visibly *propagate*
from trunk to leaves like a wave.

### Tuning

- `MAX_DEPTH = 7` — 127 branches total, dense enough to read as a tree.
- `BRANCH_ANGLE = 27°` with `±7°` jitter, `LENGTH_SHRINK = 0.74` with
  `±10%` jitter — gives organic asymmetry, not a perfectly symmetric
  binary fractal.
- Sway period = `DURATION / 2` (two full cycles per 12s loop).
- `SWAY_AMP_PER_BRANCH = 1.6°` — small per-branch, but cumulative
  through depth, so the canopy visibly more than the trunk.
- Leaf dots at terminal twigs in `FOREST.accent` — adds a "foliage"
  hint without obscuring the recursive structure.

### Render result

First render at 2560×1664/60fps/12s came out as a 3.6 MB MP4. Tree
silhouette is balanced, the trunk reads cleanly, and the canopy has
the right density.

## 6. Wallpaper 2: Falling leaves

**Concept:** Drifting field of leaves at three parallax depths.

### Seamless-loop construction

Each leaf has three independent motion components:
- Vertical fall (`fall_cycles` integer cycles per loop).
- Horizontal sway (sine, `sway_cycles` integer cycles per loop).
- Rotation (`rot_cycles` integer cycles per loop, can be zero).

By forcing all three to be integers, every leaf's pose at `t = DURATION`
exactly matches its pose at `t = 0`. The `base_progress` initial
fall-phase offset is a random `[0, 1)` so they don't all enter the
frame in lockstep — but each leaf's *trajectory* still wraps
periodically.

### Hurdle: Manim rotation is cumulative

`mob.rotate(theta)` adds `theta` to the current rotation. So you can't
just compute the desired absolute angle each frame and call rotate
with it. Three options:
1. Recreate the mobject each frame (slow, ~95 leaves × 720 frames).
2. Track the current angle externally, rotate by the delta to the
   desired angle (chosen).
3. Manipulate `mob.points` directly with a rotation matrix (powerful
   but fragile against Manim API changes).

Chose option 2 — encapsulated as `_LeafSprite` which holds the
`Ellipse` mobject plus its `_current_angle` state.

### Composition

- 95 leaves, 3 depth layers (40% back / 35% mid / 25% front).
- Back: small (0.12–0.22), opacity 0.42. Front: large (0.36–0.52),
  opacity 0.92.
- Random color from `AUTUMN.tones` per leaf — greens, ambers, reds,
  coral. The bright greens prevent the palette feeling purely autumnal.

### Render result

Native render is 1.8 MB (sparser geometry than the tree). Static
preview shows good color variety and depth separation; the parallax
read won't fully come across until you see it animated.

## 7. Wallpaper 3: Phyllotaxis spiral

**Concept:** The Vogel model — sunflower seed head with the golden
angle, full pattern visible from t=0, rotating exactly once per loop.

### Math

The Vogel model places the n-th seed at polar coordinates:

    theta_n = n × 137.5077640500378°   (the golden angle, in radians)
    r_n     = c × √n                   (Archimedean spacing)

This is the *densest disk packing* with no rotational symmetry — the
arrangement nature uses for real sunflower seed heads, pinecone scales,
many succulents.

### Tuning

- `N_SEEDS = 1500` — gives the dense, full-rim look without slowing
  the render.
- `RADIUS_SCALE = 0.092` — outer ring sits at ~3.56 (just inside
  frame_height/2 = 4).
- Inner seeds slightly smaller (0.042) and dimmer (opacity 0.78);
  outer seeds larger (0.078) and brighter (opacity 0.96) — feels like
  a real sunflower where the rim is mature, the center new.
- Color comes from `SUNFLOWER.gradient(t)` where `t = n / (N-1)` — a
  smooth blend from umber center to cream rim.
- One full rotation per loop. Two would feel busy; zero would be
  static. Single rotation is meditative.

### Render result

Beautiful. The Fibonacci-related spiral arms emerge naturally from the
math — no special effort. Reads instantly as a sunflower while staying
abstract enough for a wallpaper.

## 8. Wallpaper 4: Constellation (lockscreen) — in progress

Concept: dark navy with stars (Dot mobjects) connected by lines that
fade in and out. Constellation-graph aesthetic. Lines connect each star
to its k nearest neighbors, deduplicated. Each star pulses with a slow
sine wave; each line fades in/out with `smooth_loop`. All cycles
integer over loop length.

Notes will continue once it's built and rendered.

### Constellation render (closing 8)

Built and rendered same session. K=2 nearest neighbors with dedup gave the right sparseness (~75 edges for 60 stars; Delaunay would have given ~6 per star). 12% warm-color star probability hits the "a few amber accents" target. Render: 948 KB, the smallest of the four — sparse moving content compresses cleanly.

## 9. v2 wallpapers — 2026-05-17

Returned to this project months later to render the two unrendered v2 scenes ([[wallpapers/05_recursive_tree_v2]] and [[wallpapers/06_aurora]]) in support of a sibling project: [[Portfolio_Website/00 - Index|Rafan's portfolio website]]. The site uses the recursive tree algorithm as its signature backdrop — ported to TypeScript canvas-2D — and the Manim renders serve as the structural reference for verifying the JS port. See [[Portfolio_Website/Concept - Recursive Tree Backdrop]].

### Renders

```bash
./render.sh scenes/recursive_tree_v2.py RecursiveTreeV2Wallpaper -o 05_recursive_tree_v2
./render.sh scenes/aurora.py AuroraWallpaper -o 06_aurora
```

Both rendered cleanly on the first attempt with no code changes needed. Output landed in `media/videos/<scene>/1664p60/` and was copied to `output/finals/` to sit alongside the v1 renders.

- **05_recursive_tree_v2.mp4**: 4.3 MB. Verified visually — the dual-frequency sway is noticeably different from v1, the leaves read as leaves, the 3-way splits give organic canopy density, and the particles drift convincingly. Loops seamlessly.
- **06_aurora.mp4**: 3.4 MB. Verified visually — the three-pass glow gives the ribbons the soft edges I wanted, the nested-sine motion is convincingly aurora-like (folds within folds), the stars don't compete for attention.

### Still on the v2 plan

[[07_v2_concept_design#2 — Golden Hour Mountains (bright landscape, popular subject)|Golden Hour Mountains]] and [[07_v2_concept_design#4 — Wildflower Meadow (bright, lively, addresses "bright natural")|Wildflower Meadow]] have design docs but no code. Both would build cleanly on existing patterns (the per-element parameter-bag from falling_leaves, the layered depth from same) but neither was in scope for the 2026-05-17 pass.

### Lessons confirmed

- The flat-list-with-parent-indices pattern for trees ([[decisions/ADR-005-tree-flat-list-vs-nested-vgroups]]) scales fine from depth 7 to depth 8 with no rework.
- The integer-cycle-count rule ([[decisions/ADR-002-seamless-loops]]) extends to summed motions: as long as each component is integer-cycle, their sum is integer-cycle, so dual-frequency sway is automatically seamless.
- Manim renders are fast enough on M-series silicon (~50s for a 12-s 60fps 2560×1664 loop) that iteration is comfortable.

### Sibling-project implications

The portfolio project's [[Portfolio_Website/decisions/ADR-004-tree-backdrop-canvas-vs-mp4]] decided NOT to ship these MP4s directly — the site instead ports the algorithm to canvas-2D. The Manim repo remains the reference visual. If the JS port goes wrong, the MP4 is the ground truth for what "right" looks like.

## 10. v3 backdrops — 2026-05-17, later evening

Same day continuation. The portfolio's user clarified that the backdrops he wants are *more than openers* — they sit persistently behind content. That's a different use case from a v1/v2 wallpaper. Started a new design conversation in [[08_backdrop_concepts]].

### The design pivot

A wallpaper is the foreground. A backdrop is, by definition, *behind* something. Different constraints:

- Center of frame must be quiet (where body text sits).
- Motion amplitude an order of magnitude lower than wallpaper.
- Negative space dominates; visual elements live in the margins or are sparse.
- Per-section appropriate: the backdrop can match the section's content thematically.

Three concepts designed in [[08_backdrop_concepts]]:
1. Network nodes (coded + rendered today) — for the DDD section
2. Drift field (stubbed) — minimal fallback
3. Subtle aurora variant (stub config) — tier-2 alternative

### Network nodes — rendered

```bash
./render.sh scenes/network_nodes.py NetworkNodesBackdrop -o 07_network_nodes
```

First-attempt success. 456 KB — smaller than every other render so far because the field is sparse and motion is low (sparse + low-motion content encodes cheaply with h.264). The "messages" feature is the on-thesis touch — small bright dots traversing edges on a deterministic schedule, reading as data delivery over a distributed system.

Verified visually: the field reads as quiet atmosphere, messages are noticeable but not attention-grabbing, the loop is seamless (a paused frame at t=0 and t=DURATION show the same field state).

### Drift field — stubbed

Coded as `scenes/drift_field.py` but not rendered this pass. It's the minimal-most backdrop concept — just particles. Tracked as Manim TODO; would render in any future session in <1 minute.

### Subtle aurora variant — stub config

Documented the desired parameter set in `scenes/aurora_subtle.py` but the actual scene class isn't directly runnable because the parent `aurora.py` reads its constants at module-import time. To render the subtle variant, either copy `aurora.py` and edit constants in place, or refactor `aurora.py` to accept a config dataclass. Both are easy; not in scope today.

### What this means for the portfolio project

The portfolio's [[Portfolio_Website/decisions/ADR-006-aesthetic-primitives-inherited-and-cut]] cut aurora and constellation as foreground primitives. **Those cuts may not apply to backdrop use** — the foreground arguments that made them weak fits for a portfolio (audio-reactive, dwell-to-ignite) don't apply when they're passive atmosphere. Backdrop use is a separate question and is now an open consideration in [[Portfolio_Website/Open Questions]].

### Lessons

- The flat-state-array-with-updater pattern continues to scale: works for trees, leaves, particles, ribbons, and now graphs with traveling messages. Once you have it, every new scene is a recombination.
- For a backdrop, the right mental test isn't "does this look beautiful in isolation?" but "would I be distracted reading three paragraphs of body text in front of this?" That filter pushed every parameter down by ~half.
- A "messages" mechanism added to a scene-with-edges is small and easy if you pre-schedule the events deterministically. Real-time message scheduling with a Poisson process would *also* work but introduces seam questions at the loop boundary. Deterministic is simpler.

