---
tags: [concept, primitive, backdrop, tree, port]
---

# Concept — Recursive Tree Backdrop

> A live, deterministic, dual-frequency-swaying recursive tree drawn on a `<canvas>`. Ported from Rafan's `recursive_tree_v2.py` Manim scene. Used at low opacity behind the threshold hero and at full opacity in the "on recursion" section.

## What it is

The site's signature backdrop. A recursive fractal tree: trunk, two children, each recursively two (occasionally three) children, down to ~depth 8. Each terminal branch has a 5-point leaf polygon. Pollen-like particles drift up the field. The tree sways under two superposed sin waves — a fast "breeze" and a slow "gust." The whole thing loops seamlessly every 12 seconds.

Same algorithm as the Manim version. Renderer is canvas 2D instead of Manim's mobject pipeline.

**Source of truth for the algorithm:** `~/Developer/Manim_Wallpaper/scenes/recursive_tree_v2.py`, with companion docs at [[Manim_Wallpaper/wallpapers/01_recursive_tree]] and [[Manim_Wallpaper/02_design_principles]]. This document describes the JS port and its integration into the site.

## Why this specifically

Three reasons converge:

1. **Medium-is-the-argument.** A portfolio about studying CS has a recursive algorithm running live in the page. The thing that draws the tree is the thing the tree is about.
2. **Aesthetic.** The Manim render is already beautiful (FOREST palette, warm-dark, organic motion). It carries the room.
3. **The algorithm ports cleanly.** Manim's per-frame `update()` callback maps 1:1 to a canvas tick. No Manim magic is doing real work at runtime; it's just geometry.

## Algorithm summary (mirrors `recursive_tree_v2.py`)

### Build phase (once per instance)

DFS that produces a **flat array** of `_Branch` records:

```ts
type Branch = {
  parent: number;     // index into branches[], or -1 for root
  relAngle: number;   // radians, relative to parent
  length: number;     // local units (normalized to canvas coordinate system)
  depth: number;
  isTerminal: boolean;
};
```

Recursion:
```ts
function build(parent: number, len: number, relAngle: number, depth: number, branches: Branch[], rng: RNG) {
  if (depth > MAX_DEPTH || len < 0.045) return;
  const isTerminal = depth === MAX_DEPTH;
  branches.push({ parent, relAngle, length: len, depth, isTerminal });
  if (isTerminal) return;
  const idx = branches.length - 1;
  const aL = +BRANCH_ANGLE + rng.uniform(-ANGLE_JITTER, ANGLE_JITTER);
  const aR = -BRANCH_ANGLE + rng.uniform(-ANGLE_JITTER, ANGLE_JITTER);
  const lL = len * SHRINK * (1 + rng.uniform(-LEN_JITTER, LEN_JITTER));
  const lR = len * SHRINK * (1 + rng.uniform(-LEN_JITTER, LEN_JITTER));
  build(idx, lL, aL, depth + 1, branches, rng);
  build(idx, lR, aR, depth + 1, branches, rng);
  // Occasional 3-way (12% probability) — co-dominant shoot
  if (rng.random() < THREE_WAY_PROB) {
    const aC = rng.uniform(-THREE_WAY_ANGLE, THREE_WAY_ANGLE);
    const lC = len * SHRINK * THREE_WAY_LENGTH_FACTOR * (1 + rng.uniform(-LEN_JITTER, LEN_JITTER));
    build(idx, lC, aC, depth + 1, branches, rng);
  }
}
```

The RNG is a seeded LCG (or Mulberry32) — deterministic. Same seed → same tree.

### Resolve phase (per frame)

Single forward pass. DFS construction guarantees a parent's index is lower than its children's, so by the time we process branch `i`, branches `[0..i-1]` already have world positions.

```ts
function resolve(branches: Branch[], t: number, out: { starts: Float32Array; ends: Float32Array; absAngles: Float32Array }) {
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i];
    // dual-frequency sway
    const primary = sinWave(t, PRIMARY_PERIOD, b.depth * PRIMARY_PHASE_PER_DEPTH) * PRIMARY_AMP_PER_BRANCH;
    const secondary = sinWave(t, SECONDARY_PERIOD, b.depth * SECONDARY_PHASE_PER_DEPTH) * SECONDARY_AMP_PER_BRANCH;
    const sway = primary + secondary;

    if (b.parent < 0) {
      out.starts[i * 2]     = ROOT_X;
      out.starts[i * 2 + 1] = ROOT_Y;
      out.absAngles[i]      = b.relAngle + sway;
    } else {
      const p = b.parent;
      out.starts[i * 2]     = out.ends[p * 2];
      out.starts[i * 2 + 1] = out.ends[p * 2 + 1];
      out.absAngles[i]      = out.absAngles[p] + b.relAngle + sway;
    }

    const a = out.absAngles[i];
    out.ends[i * 2]     = out.starts[i * 2]     + Math.cos(a) * b.length;
    out.ends[i * 2 + 1] = out.starts[i * 2 + 1] + Math.sin(a) * b.length;
  }
}
```

`sinWave(t, period, phase) = sin(2π * (t / period + phase))`. Phase shift `b.depth * SWAY_PHASE_PER_DEPTH` is the "wave travels up the tree" effect.

### Draw phase (per frame)

Clear canvas, draw branches, draw leaves, draw particles.

```ts
function draw(ctx: CanvasRenderingContext2D, ...) {
  ctx.clearRect(0, 0, w, h);

  // Branches: each as a line, color/stroke tapering by depth.
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i];
    const t01 = b.depth / MAX_DEPTH;
    ctx.strokeStyle = paletteTone(t01);
    ctx.lineWidth   = TRUNK_STROKE * (1 - t01) + LEAF_STROKE * t01;
    ctx.beginPath();
    ctx.moveTo(out.starts[i*2], out.starts[i*2+1]);
    ctx.lineTo(out.ends[i*2],   out.ends[i*2+1]);
    ctx.stroke();
  }

  // Leaves: 5-point polygons at terminal branches.
  for (const leaf of leaves) {
    const i = leaf.branchIdx;
    const x = out.ends[i*2], y = out.ends[i*2+1];
    const a = out.absAngles[i] - Math.PI / 2 + leaf.rotationJitter;
    drawLeafPolygon(ctx, x, y, leaf.size, leaf.color, leaf.opacity, a);
  }

  // Particles: drifting upward, with horizontal sway, wrapping.
  for (const p of particles) updateAndDrawParticle(ctx, p, t);
}
```

### Leaf polygon

The 10-vertex polygon from the Python version, with a canonical "+y" orientation that we rotate per leaf:

```ts
const LEAF_VERTS = (size: number) => {
  const h = size, w = size * 0.55;
  return [
    [ 0,        h],            // tip
    [ w*0.55,   h*0.65],
    [ w,        h*0.20],
    [ w*0.60,  -h*0.25],
    [ w*0.20,  -h*0.48],
    [ 0,       -h*0.58],
    [-w*0.20,  -h*0.48],
    [-w*0.60,  -h*0.25],
    [-w,        h*0.20],
    [-w*0.55,   h*0.65],
  ];
};
```

Drawing rotates via `ctx.translate(x, y); ctx.rotate(angle); ctx.beginPath(); ... ctx.fill(); ctx.setTransform(...)`.

### Particles

24 of them by default. Each has a base x position, a random progress along its drift cycle, a radius, a drift-cycles count (1 or 2), a sway-cycles count (1 or 2), and a sway phase. Per frame:

```ts
progress = (p.baseProgress + p.driftCycles * t / DURATION) % 1
y        = bottom + progress * (canvasH + 2 * margin)
x        = p.baseX + PARTICLE_SWAY_AMP * sin(t, DURATION / p.swayCycles, p.swayPhase)
```

Drawn as a soft dot (`fillStyle = paletteAccentRGBA(p.opacity)`).

## Constants (from `recursive_tree_v2.py`, normalized)

```ts
export const TREE_CONST = {
  RNG_SEED: 42,
  MAX_DEPTH: 8,
  TRUNK_LENGTH: 1.80,          // in normalized units (canvas-frame-relative)
  SHRINK: 0.74,
  LEN_JITTER: 0.10,
  BRANCH_ANGLE: 27 * Math.PI / 180,
  ANGLE_JITTER: 7 * Math.PI / 180,
  INITIAL_ANGLE: Math.PI / 2,
  THREE_WAY_PROB: 0.12,
  THREE_WAY_ANGLE: 6 * Math.PI / 180,
  THREE_WAY_LENGTH_FACTOR: 0.88,
  TRUNK_STROKE: 18,            // px at depth 0
  LEAF_STROKE: 1.4,            // px at depth MAX
  LEAF_SIZE_MIN: 0.10,
  LEAF_SIZE_MAX: 0.18,
  LEAF_OPACITY: 0.90,
  LEAF_ROTATION_JITTER: 22 * Math.PI / 180,
  DURATION: 12.0,              // seconds, loop period
  PRIMARY_PERIOD: 6.0,         // = DURATION / 2  → 2 cycles per loop
  PRIMARY_AMP_PER_BRANCH: 1.4 * Math.PI / 180,
  PRIMARY_PHASE_PER_DEPTH: 0.03,
  SECONDARY_PERIOD: 12.0,      // = DURATION / 1  → 1 cycle per loop
  SECONDARY_AMP_PER_BRANCH: 0.7 * Math.PI / 180,
  SECONDARY_PHASE_PER_DEPTH: 0.06,
  NUM_PARTICLES: 24,
  PARTICLE_RADIUS_MIN: 0.022,
  PARTICLE_RADIUS_MAX: 0.055,
  PARTICLE_OPACITY: 0.55,
  PARTICLE_SWAY_AMP: 0.32,
  PARTICLE_DRIFT_CYCLES: [1, 1, 2] as const,
  PARTICLE_SWAY_CYCLES: [1, 2] as const,
};
```

These are normalized units. The renderer scales by `frameHeight / 8` (Manim's frame is 8 units tall) to convert to pixels, picking a sensible base resolution.

## Palette port

From `~/Developer/Manim_Wallpaper/lib/palette.py`, FOREST:

```ts
export const FOREST = {
  name: 'forest' as const,
  background: '#0A1620',
  tones: ['#2F5860', '#4A8884', '#6BB4A6', '#87DCB8', '#B0EBD2'],
  accent: '#E8F4E0',
};

export function tone(palette: Palette, t01: number): string {
  // discrete index into tones
  const n = palette.tones.length;
  const i = Math.max(0, Math.min(n - 1, Math.round(t01 * (n - 1))));
  return palette.tones[i];
}
```

For each section's instance, the palette can be overridden:
- threshold: FOREST (default)
- on recursion: FOREST (default), but with optional live-param overrides
- future scenes (aurora, etc.): different palettes from `palette.py` ported

## Two usages on the site

### 1. Threshold backdrop (`tree-threshold`)

- Full hero section, `z-index: -1`.
- `opacity: 0.12`.
- `swayScale: 0.6` (reduces amplitude so motion is barely perceptible at this opacity).
- `numParticles: 12` (halved to keep the threshold uncluttered).
- `aria-hidden="true"`.

### 2. "on recursion" backdrop (`tree-on-recursion`)

- Full section, full bleed.
- `opacity: 1.0`.
- `swayScale: 1.0`.
- All defaults.
- Annotation prose laid on top (with a slight ink-toned text-shadow for legibility).
- Optional live-parameter sliders (deferred — see [[Open Questions#live-parameter knobs]]).

## Module shape

```ts
// src/lib/backdrop/tree.ts
export interface TreeOptions {
  palette: 'forest' | 'autumn' | 'sunflower' | 'night';
  opacity?: number;            // multiplier; default 1
  swayScale?: number;          // 1 = full amplitude
  numParticles?: number;       // override default
  seed?: number;               // override RNG seed
  ariaHidden?: boolean;        // default true
  overrideConst?: Partial<typeof TREE_CONST>;  // live-param support
}

export interface TreeHandle {
  setOpacity(o: number): void;
  setOverrides(p: Partial<typeof TREE_CONST>): void;  // triggers rebuild
  stop(): void;
}

export function mountTree(canvas: HTMLCanvasElement, opts: TreeOptions): TreeHandle { /* ... */ }
```

The handle's `setOverrides` enables the "on recursion" live-param sliders (when shipped): a user moves a slider, the JS calls `setOverrides({ MAX_DEPTH: newDepth })`, and the module triggers a fresh build + redraw.

## Performance budget

- Branches at MAX_DEPTH=8 with binary + occasional ternary: typically 250–300 branches.
- Per-frame cost: ~300 trig ops + ~300 `stroke()` calls + 1 polygon-fill per terminal + 24 dot draws.
- M-series silicon: ~1.5–2 ms per frame. Well under 16ms budget at 60fps.
- At low-opacity on threshold: same cost (opacity is a composite, not a render-cost change). Mitigated by halving particle count.

If we ever fork to mobile-low-end: reduce MAX_DEPTH to 7 (halves branch count), reduce particles to 12. A small `mobile` flag in `TreeOptions`.

## File layout

```
src/lib/backdrop/
├── tree.ts            -> mountTree, the public entry
├── tree-algorithm.ts  -> build/resolve/draw (pure-ish, testable)
├── leaf.ts            -> leaf polygon generation
├── particle.ts        -> particle update + draw
├── palettes.ts        -> FOREST and friends, ported from palette.py
├── easing.ts          -> sinWave, lerp
├── rng.ts             -> Mulberry32 seeded RNG
└── scenes.ts          -> scene registry (future: aurora, constellation, …)
```

The split between `tree.ts` (mount/lifecycle) and `tree-algorithm.ts` (math + drawing) keeps the algorithm portable and reviewable independently. See [[Working Agreements#3. Modular, senior-eng reviewable code]].

## Scene engine (forward-looking, not V1)

`scenes.ts` is a registry pattern so future Manim ports drop in without touching the components:

```ts
export type SceneId =
  | 'tree'              // ports recursive_tree_v2.py (V1)
  | 'network-nodes'     // ports network_nodes.py    (V1.1 candidate)
  | 'drift-field'       // ports drift_field.py      (V1.1 candidate)
  | 'aurora-subtle'     // ports aurora_subtle.py    (tier-2)
  | 'aurora'            // ports aurora.py           (tier-2)
  | 'constellation'     // ports constellation.py    (tier-2)
  | 'falling-leaves';   // ports falling_leaves.py   (tier-2)
const registry: Record<SceneId, MountFn> = {
  tree: mountTree,
  // 'network-nodes': mountNetworkNodes,  // when ported (Manim ref: 07_network_nodes.mp4)
  // 'drift-field':   mountDriftField,    // when ported
  // …
};
export function mountScene(id: SceneId, canvas: HTMLCanvasElement, opts: any) {
  return registry[id](canvas, opts);
}
```

**V1 ships only `tree`.** The other entries are documented but not implemented. **Not** porting phyllotaxis (user explicit).

The most concrete second-scene candidate is **`network-nodes`** — designed and rendered in Manim on 2026-05-17 as a backdrop-tuned scene specifically for the "on the work" section (DDD theme). See [[Manim_Wallpaper/wallpapers/07_network_nodes]] for the algorithm and [[Open Questions#per-section backdrops (tier-2 design exploration)]] for whether/when it ships on the site.

The "on recursion" tab is the obvious future home for additional scenes — could become a "field guide" page with multiple generative pieces, each annotated, each its own subsection. Tracked as deferred design.

## Reduced motion

- `prefers-reduced-motion: reduce` → sway amplitudes set to 0 (tree renders static at t=0 positions).
- Particles freeze (their `t` becomes constant).
- Leaves still render (color, not motion).

The tree is *not* hidden under reduced motion. A static tree is acceptable. See [[Open Questions#reduced-motion behavior of the tree]].

## Open questions

- **Live-parameter sliders** — deferred to tier-2. See [[Open Questions#live-parameter knobs]].
- **DPR-aware sizing** — backed by `devicePixelRatio` for crisp lines on retina. Pattern: size CSS in CSS-pixels, set canvas `width`/`height` to `cssW * dpr`, call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. Standard, plan to implement.
- **Resize behavior** — on viewport resize, rebuild with new dimensions and re-seed (or keep seed and rebuild branches to fit). Default: keep seed, re-fit.
- **Mobile particle count** — verify visual on 360px viewports; consider auto-lowering if dense.

## Verification

When implementing, verify against the Manim-rendered MP4 — both the v2 (`~/Developer/Manim_Wallpaper/output/finals/05_recursive_tree_v2.mp4`, rendered 2026-05-17, the source-of-truth) and optionally the v1 (`01_recursive_tree.mp4`) for "what changed." The JS port should be visually equivalent in structure to v2 — same tree shape from `seed=42`, same dual-frequency sway profile — with the only differences being canvas-vs-Manim antialiasing. See [[Manim_Wallpaper/wallpapers/05_recursive_tree_v2]] for the algorithm-side doc.

## See also

- `~/Developer/Manim_Wallpaper/scenes/recursive_tree_v2.py` — source algorithm
- [[Manim_Wallpaper/wallpapers/01_recursive_tree]] — v1 design doc
- [[Manim_Wallpaper/02_design_principles]] — palette and motion principles
- [[Manim_Wallpaper/decisions/ADR-005-tree-flat-list-vs-nested-vgroups]] — why flat-list
- [[Manim_Wallpaper/decisions/ADR-006-rotation-delta-pattern]] — relevant for leaves
- [[03 - Content Model#on recursion]]
- [[decisions/ADR-004-tree-backdrop-canvas-vs-mp4]]
- [[decisions/ADR-005-tree-role-and-scene-engine]]
