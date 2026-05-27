---
tags: [adr, tree, scenes]
---

# ADR-005 — Tree role & scene engine: hero backdrop + dedicated section, expandable

**Status:** accepted
**Date:** 2026-05-17

## Context

Given we're porting `recursive_tree_v2` ([[ADR-004-tree-backdrop-canvas-vs-mp4]]), we need to decide where on the site it appears and whether the backdrop infrastructure should anticipate future generative scenes (aurora, constellation, falling_leaves, etc.) being added later.

## Decision

The tree appears in **two places**:

1. **Threshold (hero) backdrop** — low-opacity (~12%), reduced sway amplitude, halved particle count. Behind the name and tagline.
2. **"on recursion" section** — full opacity, full sway, full bleed. With prose annotation on top (user-written) and optionally live-parameter sliders (deferred to tier-2; see [[../Open Questions#live-parameter knobs]]).

The implementation includes a **scene engine** scaffold (registry pattern in `src/lib/backdrop/scenes.ts`) that allows additional scenes (aurora, constellation, falling_leaves — but **not** phyllotaxis) to drop in without restructuring the components. **No additional scenes ship in V1.**

## Alternatives considered

### Tree on hero only, no dedicated section

Just a backdrop. Quieter IA.

- *Why-not:* the user wants the medium-is-the-argument story. A live recursive tree on a CS portfolio earns a section to itself; relegating it to backdrop-only weakens the strongest aesthetic move the site has.

### Tree in dedicated section only, no hero backdrop

Hero stays minimal/typographic.

- *Why-not:* the threshold needs *something* visual or it reads as a plain page. The low-opacity tree carries atmosphere without competing with the name. Also gives the reader a visual "teaser" that pays off when they scroll to the dedicated section.

### Multiple scenes in V1 (each section gets its own)

Like Legendary's four rooms — threshold = tree, on me = synesthesia gradient backdrop, on the work = constellation, etc.

- *Why-not:* user said *"I like #4 [multiple scenes] as something that is possible to do, might mess with it in the future, idk if I'll use these specifically."* So: keep the option open, don't ship the work. Building four scenes for V1 is 4× the porting effort for diminishing aesthetic return.

### Hardcode the tree integration; no scene engine

Just put the tree directly in `Threshold.astro` and `OnRecursion.astro`. No registry, no abstraction.

- *Why-not:* it's a small abstraction (~20 LOC) with a clear future payoff. Skipping it now means future scenes touch component code, not just config. The "modular and pickup-able" working agreement ([[../Working Agreements#3. Modular, senior-eng reviewable code]]) prefers the slight abstraction.

## Benefits

- **Two-tier story.** Quiet backdrop establishes tone; dedicated section makes the argument. The tree pays for its own complexity.
- **Recoloring is free.** The two instances use the same module with different opacity/swayScale/numParticles props.
- **Scene engine costs almost nothing.** It's a small registry that exists for the moment the user (or another agent) wants to add a scene. No premature implementation.
- **User-locked direction.** Phyllotaxis explicitly excluded. Tree is the V1 anchor. The user can add aurora/constellation/falling_leaves later without our V1 work blocking him.
- **Engine pattern documented.** A future agent reads [[../Concept - Recursive Tree Backdrop#scene engine (forward-looking, not v1)]] and understands the extension point.

## Update — 2026-05-17 (v3 backdrop work)

A second scene now exists in Manim form: [[Manim_Wallpaper/wallpapers/07_network_nodes|network_nodes]] — designed specifically as a backdrop for the "on the work" section. The scene engine's design is validated by this: porting network_nodes to canvas-2D would slot it into `scenes.ts` without touching the components that use it.

V1 ships only `tree`. The network-nodes scene is V1.1 (or tier-2) — see [[../Open Questions#per-section backdrops (tier-2 design exploration)]] for the per-section assignment proposal and its pros/cons.

## Harms / Tradeoffs

- **Two instances = two `mountTree` calls = two RNGs.** They will produce different trees (different seeds). Mitigation: pin seeds explicitly per instance. Threshold uses one seed (chosen for a "leans-slightly-right" silhouette that doesn't fight the name); the on-recursion section uses another (the canonical seed=42 from the Manim source).
- **Threshold tree at 12% opacity reads as decoration, not argument.** Slight risk that the threshold tree is dismissed as "fancy background." Acceptable: the dedicated section reclaims the argument. The threshold backdrop's job is atmosphere.
- **Scene engine introduces an abstraction.** A future agent has to learn one more thing (`mountScene` vs `mountTree`). Mitigation: the V1 code can use `mountTree` directly; the engine is opt-in. Documented as such.
- **"on recursion" section is structurally a one-element section.** Risk: feels thin compared to other sections. Mitigation: the annotation prose + optional sliders give it weight. If it still feels thin, future scenes drop in here naturally — it becomes a "field guide" of generative pieces.

## Revisit if

- The threshold backdrop tree visually competes with the name or tagline → lower opacity further (try 0.08), or shrink the tree's bounds within the hero.
- The "on recursion" section is the most-visited but readers don't scroll further → the section is doing too much work; consider trimming or moving it later in the IA.
- The user decides to add another scene → port the corresponding Manim file to its own module under `src/lib/backdrop/`, register in `scenes.ts`, drop into the section that wants it.

## See also

- [[ADR-004-tree-backdrop-canvas-vs-mp4]]
- [[../Concept - Recursive Tree Backdrop]]
- [[../03 - Content Model#on recursion]]
