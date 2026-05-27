---
tags: [adr, tree, backdrop]
---

# ADR-004 — Tree backdrop: live canvas port, not embedded MP4

**Status:** accepted
**Date:** 2026-05-17

## Context

The user has a Manim-rendered recursive tree wallpaper (`~/Developer/Manim_Wallpaper/scenes/recursive_tree_v2.py`) and wants something like it as a site backdrop — at least on one tab/section. There are three ways to deliver this:

A. Render to MP4 once, embed as `<video autoplay loop muted>`.
B. Port the algorithm to TypeScript + Canvas 2D, render live.
C. Both — MP4 as poster/fallback, canvas as live version.

## Decision

**B. Live canvas port.** Re-implement `recursive_tree_v2.py` in TypeScript. Lives at `src/lib/backdrop/tree.ts` and friends. Used at low opacity in the threshold and full opacity in the "on recursion" section. No MP4 ships.

## Alternatives considered

### A. Pre-rendered MP4

Render the scene in Manim once. Drop the MP4 into `public/`. Embed via `<video>`.

- *Why-not:* the MP4 is ~3.6 MB for a 12-second loop at the current render resolution. That's ~36x the size of the entire JS port (~10 KB). On any modestly throttled connection, the video downloads visibly while the page is already interactive. Plus: fixed aspect ratio (letterboxes on wide screens), no per-section recoloring, no parameter knobs ever, and the medium-is-the-argument property collapses ("here's a video of an algorithm" is not as good as "here's an algorithm running").

### C. Both

Ship the MP4 as a `<video poster>` fallback for the canvas, swap in canvas after load.

- *Why-not:* worst of both — pays both byte costs. The canvas-load time on any modern device is well under one second; a poster fallback for that brief window is over-engineering. If we ever discover canvas perf is bad on a target device, we can revisit.

### Static SVG / image of one frame

A single-frame render as a static SVG or PNG backdrop.

- *Why-not:* kills the motion-as-atmosphere quality. Trees don't sway. The "on recursion" section in particular needs the motion to be intelligible as "this is running, not painted."

### WebGL fragment shader

A noise-based stylized tree as a shader.

- *Why-not:* more visual range, but shader source bloats the bundle and a WebGL setup is significantly more code than canvas 2D. Also strays from the source algorithm (we'd be reinventing, not porting). The canvas 2D version is fast enough on target hardware.

## Benefits

- **Byte cost.** ~10 KB JS (minified+gzipped, estimated) vs ~3.6 MB MP4. ~350× smaller.
- **Aspect-fluid.** Canvas resizes to any viewport. No letterboxing.
- **Per-section recoloring.** Same algorithm, different palettes per instance. Threshold uses FOREST; if "on recursion" later wants a slight palette shift for visual rhyme with another section, one prop change does it. The MP4 cannot.
- **Live parameter tweaking.** Sliders in the "on recursion" section can mutate `MAX_DEPTH`, `BRANCH_ANGLE`, `SHRINK` and the tree rebuilds. Genuine interactivity. The MP4 cannot.
- **Medium is the argument.** A live recursive tree on a CS-student's portfolio demonstrates the thing it depicts. An MP4 illustrates it.
- **No autoplay-policy fights.** `<video autoplay>` has cross-browser autoplay policy nuances (especially mobile Safari). Canvas has none.
- **Reduced motion handled natively.** Disabling sway is one branch in the tick; not a separate static-image asset.

## Harms / Tradeoffs

- **CPU cost on the client.** ~1.5–2 ms per frame on M-series silicon. On a 2014 dual-core laptop with battery saver, that's higher. Mitigation: gate per-frame work on `IntersectionObserver` so the tree pauses when off-screen. Optionally implement a low-power mode (MAX_DEPTH=7, fewer particles) on a `(prefers-reduced-data: reduce)` query or a manual toggle.
- **Implementation effort.** Porting the algorithm + RNG + leaf polygons + particles takes ~6–10 hours of focused work for a senior dev (estimate). An MP4 takes one render + one `<video>` tag.
- **Visual parity is not exact.** Manim's antialiasing, line caps, and color blending differ from canvas 2D's. The TS version will *look like* the MP4 but won't be pixel-identical. Acceptable: the user is the source of truth on whether the port "feels right."
- **Future Manim scene additions cost more.** Each new scene (aurora, constellation, falling_leaves) also needs a port. Bounded — the [[Concept - Recursive Tree Backdrop#scene engine (forward-looking, not v1)|scene engine]] design pattern means each port is its own module dropping into a registry.
- **Algorithm bugs are now ours.** Off-by-one in the port = wrong tree. Mitigation: review the Python source carefully; write the TS port to mirror it line-for-line where reasonable; verify visually against the rendered MP4.

## Revisit if

- Canvas perf is unacceptable on a target device class the user cares about — then ship MP4 fallback for that class via a media query.
- The user's Manim wallpaper portfolio grows beyond ~3 scenes that we want on the site — then evaluate whether porting each is worth it vs. accepting MP4 for the lower-priority ones.
- A specific scene resists canvas porting (e.g., a scene that uses Manim's TeX rendering or 3D shaders) — port what's portable, MP4 the rest.

## Update — 2026-05-17

The Manim project rendered `recursive_tree_v2` and `aurora` to MP4 (see [[Manim_Wallpaper/wallpapers/05_recursive_tree_v2]] and [[Manim_Wallpaper/wallpapers/06_aurora]]) for reference. These MP4s **do not ship on the site**. They serve two purposes only:

1. **Visual ground truth** for the TypeScript canvas port. When the port is built, render and compare. The MP4 is the answer key.
2. **An option to revisit** if the canvas port turns out to be problematic on some target device class. Documented but not deployed.

The earlier public/videos/ symlinks in the site repo (added briefly on 2026-05-17) were removed — they didn't match this decision. The MP4s live exclusively in `~/Developer/Manim_Wallpaper/output/finals/`.

### Tier-2 option: persistent MP4 backdrops

The user has floated the idea of using Manim MP4s as persistent backdrops throughout the page. This is **deferred to tier-2** evaluation. Tradeoffs:

| | canvas (V1 choice) | MP4 persistent |
|---|---|---|
| Per-section weight | ~10 KB JS, shared across all sections | ~3–4 MB per MP4, one per palette/theme |
| Recolor per section | yes (palette swap, same algorithm) | no (each section needs its own MP4) |
| Aspect-fluid | yes | no (object-fit:cover crops) |
| Live parameter knobs (e.g. on-recursion sliders) | yes | no |
| Reduced-motion handling | native (algorithm gate) | requires JS pause |
| Autoplay policies | none | muted+playsinline required, still fragile on iOS |
| Visual fidelity to Manim original | ~95% | 100% |
| Maintenance | the algorithm is in the codebase | dependency on the Manim repo's render outputs |

Net: canvas is the right V1 default. The persistent-MP4 path becomes interesting only if (a) the canvas port is *visibly worse* than Manim and the user notices, or (b) a future section needs a scene that's too complex to port (e.g., the [[Manim_Wallpaper/wallpapers/06_aurora|aurora]] could be ported but with effort). Tracked in [[../Open Questions#persistent mp4 backdrops vs canvas (tier-2 evaluation)]].

## See also

- [[../Concept - Recursive Tree Backdrop]] — the implementation spec
- [[ADR-005-tree-role-and-scene-engine]] — where the tree appears and how the engine is extensible
- [[Manim_Wallpaper/wallpapers/01_recursive_tree]] — v1 design doc
- [[Manim_Wallpaper/wallpapers/05_recursive_tree_v2]] — v2 design doc, the algorithm being ported
