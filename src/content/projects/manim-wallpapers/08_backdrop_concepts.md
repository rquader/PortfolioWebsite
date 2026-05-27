---
title: V3 Backdrop Concepts — Designs Tuned for Sitting Behind Content
tags: [manim, wallpaper, design, v3, backdrop]
---

# V3 Backdrop Concepts

The v1 and v2 wallpapers were designed for **desktop wallpaper** use — full attention, foreground visual interest. The portfolio site ([[Portfolio_Website/00 - Index]]) introduces a different use case: **backdrops sitting persistently behind text and UI elements**.

Designed 2026-05-17 after the portfolio's user clarified: *"these backdrops are more than just openers — they sit behind other nodes or designs or things in front of them, with subtle animation."*

## Backdrop constraints (different from wallpaper)

| | wallpaper (v1/v2)     | backdrop (v3)                                |
|------------------------|-----------------------|----------------------------------------------|
| **Visual weight**      | foreground            | atmospheric / background                     |
| **Motion amplitude**   | small but visible     | barely perceptible                           |
| **Composition**        | can be center-heavy   | **center must be quiet** (text overlays)     |
| **Contrast at text positions** | not a concern | low contrast where body text sits            |
| **Per-section**        | one wallpaper, period | varies per page section, may differ          |
| **Render scope**       | full 12s loop, native res | smaller renders OK if MP4-deployed       |
| **Foreground tolerance** | none (it IS the foreground) | required (must not compete with copy) |

The v3 set inherits the v1/v2 architecture (seeded RNG, integer-cycle loops, flat-state-array-with-updater pattern) but tunes parameters and composition for backdrop use.

## Why this is a new doc, not edits to v1/v2

Existing wallpapers can be re-tuned (e.g., a "subtle" recursive_tree_v2 variant), but a backdrop is a *use case*, not a parameter. The conversation about whether a scene works as a backdrop is its own design question. This doc holds that conversation.

## Three concepts

### #1 — Network Nodes (`network_nodes.py` — to be coded)

**Concept.** Scattered nodes (~16) connected by occasional fading edges. Visually a constellation-graph, but the *story* it tells is different: it evokes a distributed network — disconnected clients held together by intermittent connections. Reads naturally behind text about networked-systems work.

**Target section:** [[Portfolio_Website/03 - Content Model#on the work|on the work]] — the DDD research card. The connection is direct: DDD is a project about delivering messages across a network where connections fail. The backdrop visually argues that.

**Composition.**
- 16 nodes, rejection-sampled across the frame for even spread (Poisson-disk-ish).
- Each node: small dot (radius 0.04–0.07), cool-tone color from a NIGHT-like palette.
- Edges: each node connects to its 2 nearest neighbors, deduplicated → ~20–24 unique edges.
- All edges are present in the graph, but only ~30% have non-zero opacity at any given time (`smooth_loop` fade with offset phases).
- **Optional "messages":** small bright dots that traverse a randomly-chosen edge end-to-end on a slow schedule (~one message every 3–5 seconds). For the DDD theme this is the on-thesis touch. May be omitted for a quieter version.

**Motion.**
- Node pulse: very low amplitude (`PULSE_AMP_MIN/MAX = 0.08 / 0.20`, vs. constellation's 0.12/0.45). Barely visible.
- Edge fade: lower max opacity (`EDGE_MAX_OPACITY = 0.18`, vs constellation's 0.34). Edges read as suggestions, not lines.
- Messages: small (`radius = 0.035`), bright but brief (each message exists for ~1.5s, then fades).
- All cycles integer over 12s loop.

**Why this is backdrop-appropriate.**
- Sparse pattern → text overlays don't lose anything they need.
- Low amplitude → reading isn't disturbed.
- Centered text falls between nodes, not on top of any in particular.
- The "message" pulse is rare and small enough to be peripheral, not attention-grabbing.

### #2 — Drift Field (`drift_field.py` — to be stubbed, not rendered V1)

**Concept.** Just particles. No graph, no shapes, no structure. ~30 small dots drifting slowly upward across a dark field, with subtle horizontal sway. The most minimal possible backdrop.

**Target section:** any quiet section that has body prose but doesn't need a thematic backdrop — e.g., [[Portfolio_Website/03 - Content Model#on me|on me]], [[Portfolio_Website/03 - Content Model#on the trail|on the trail]], [[Portfolio_Website/03 - Content Model#coda / contact|coda]].

**Composition.**
- 30 particles, randomly distributed at t=0.
- Each particle: dot (radius 0.018–0.045), warm cool-neutral color (cream/pale-paper).
- Slow upward drift (~0.05 units/sec average), wrapping bottom-to-top.
- Per-particle horizontal sway with integer cycle count (1 or 2 per loop).
- Background: deep warm-dark (sample from `lib/palette.py` SUNFLOWER's deepest tone, or a new "BACKDROP" palette).

**Motion.**
- Drift is the only motion. Even the sway is minimal (~0.15 unit amplitude).
- All integer-cycle for seamless loop.

**Why this is backdrop-appropriate.**
- Nothing competes with text. Particles drift through the negative space around copy.
- Color palette aligns with the site's warm-dark tone. No conflict.
- Composition is uniform — works regardless of where text sits.

This is the "fallback" backdrop. Suitable when a section doesn't have a clear thematic backdrop but shouldn't be entirely flat.

### #3 — Subtle Aurora Variant (`aurora_subtle.py` — to be stubbed, not rendered V1)

**Concept.** Re-tune the existing aurora scene as a *backdrop* rather than a foreground spectacle. Fewer ribbons, much lower amplitude, restricted to the top of the frame, and lower-saturation colors.

**Target section:** something contemplative, like [[Portfolio_Website/03 - Content Model#on recursion|on recursion]] if the user later decides the live canvas tree feels overactive — or as an alternate threshold backdrop if the tree fights the name typography. Tier-2.

**Composition.**
- 3 ribbons (vs. 5 in the wallpaper version).
- Restricted to upper 35% of the frame (`RIBBON_Y_RANGE = (1.4, 2.8)` — far above where body text would sit).
- Amplitude halved (`AMP_MIN/MAX = 0.20 / 0.55` vs the wallpaper's 0.45/1.10).
- Desaturated palette — drop the bright magenta and electric cyan; use only the deep teal, emerald, and a single violet.
- Stars omitted entirely (they're decoration in the wallpaper; in a backdrop they add noise without contributing).

**Motion.**
- Same nested-sine ribbon motion but slower (`TIME_CYCLE_CHOICES = (1, 1, 1)` — all single-cycle).

**Why this is backdrop-appropriate.**
- Top-anchored — leaves the entire bottom 65% as quiet dark canvas for text.
- Low chroma — doesn't pull color attention from typography.
- Slow motion — reading is undisturbed.

### Other ideas not chosen (yet)

- **Warm noise** (no objects, just an ultra-slow background-color shift across a 12s sin cycle). Even more minimal than drift field. Maybe useful as the *page-wide* baseline if no per-section backdrop is wanted.
- **Tree silhouette** (recursive_tree_v2 with leaves and particles disabled, sway halved). A backdrop variant of the existing scene. Tracked in [[wallpapers/05_recursive_tree_v2#What I would try next]].
- **Phyllotaxis silhouette** (just the seed positions, no color, very faint). Avoided because the user said *"I don't really like the phyllotaxis."*

## Per-section assignment proposal

This is a proposal, not a decision. The user picks.

| section            | proposed backdrop                  | rationale                                                                  |
|--------------------|------------------------------------|----------------------------------------------------------------------------|
| threshold          | recursive_tree_v2 (canvas, low op) | already designed, the section's argument is *recursion*                    |
| on me              | drift field                        | quiet, no thematic claim                                                   |
| on the work        | **network nodes**                  | on-theme for DDD (distributed network, message delivery)                   |
| on the artifacts   | drift field or none                | gallery cards already have visual richness                                 |
| on recursion       | recursive_tree_v2 (canvas, full)   | the section IS the tree                                                    |
| on the trail       | drift field or none                | text-heavy; quiet preferred                                                |
| coda               | drift field at minimum opacity     | almost-empty section closer                                                |

## Implementation order

1. **Network nodes** — code + render (this session, proof of concept).
2. **Drift field** — stub Python only (this session).
3. **Subtle aurora variant** — stub Python only (this session).
4. **Warm noise** — design only, no code (future).
5. **Tree silhouette** — parameter-override variant (future).

## See also

- [[wallpapers/05_recursive_tree_v2]]
- [[wallpapers/06_aurora]]
- [[07_v2_concept_design]] — preceded this one; v2 was wallpaper-tuned, v3 is backdrop-tuned
- [[Portfolio_Website/decisions/ADR-006-aesthetic-primitives-inherited-and-cut]] — the original cuts of aurora/constellation as primitives; backdrop use is a different question and the cuts may not apply
