---
title: Network Nodes (Backdrop)
tags: [manim, wallpaper, backdrop, v3, network, ddd]
---

# Network Nodes

The first v3 *backdrop* — designed to sit persistently behind body text rather than be the foreground. Sparse graph of nodes connected by occasional fading edges, with small "message" dots traversing edges on a slow deterministic schedule.

- **Code:** `~/Developer/Manim_Wallpaper/scenes/network_nodes.py`
- **Scene class:** `NetworkNodesBackdrop`
- **Render:** `~/Developer/Manim_Wallpaper/output/finals/07_network_nodes.mp4`
- **Palette:** [[02_design_principles#NIGHT — lockscreen theme (constellation)|NIGHT]] (deep navy ground, cool node colors, one warm accent)
- **Design rationale:** [[08_backdrop_concepts#1 — Network Nodes (network_nodes.py — to be coded)]]
- **Target use:** [[Portfolio_Website/03 - Content Model#on the work|portfolio "on the work" section]] — the DDD research card

## What you see

A scattered field of ~16 small dots on a deep-navy ground, connected by thin lines that fade in and out independently. Every ~3 seconds, a small warm-cream dot appears at one node and traverses an edge to the next, fades in as it leaves, fades out as it arrives. The whole field pulses faintly — each node breathes on its own rhythm.

Compared to [[04_constellation]], everything is dialed back:
- 16 nodes instead of 60 → vastly sparser.
- Spacing 1.6 instead of 0.85 → nodes are *far* apart, leaving room for paragraph-width text overlays.
- Node pulse amplitude 0.08–0.20 instead of 0.12–0.45 → barely-perceptible breathing.
- Edge max opacity 0.18 instead of 0.34 → edges read as faint suggestions of connection.
- 8% warm-color probability instead of 12% → even fewer warm anchors.

## Concept — backdrop, not wallpaper

This is the first scene built explicitly for *backdrop* use. The full taxonomy of differences from a v1/v2 wallpaper is in [[08_backdrop_concepts#Backdrop constraints (different from wallpaper)]].

The story it tells is specifically tied to its target page section. On Rafan's portfolio site, the "on the work" section narrates his Disconnected Data Distribution research at the Reed Systems Group — a system about delivering messages across an intermittent network of nodes. The backdrop visually argues that without competing for attention with the prose: nodes (clients), edges (connections, sometimes present), messages (data, occasionally flowing). The text overlay reads through the negative space.

This is the [[Portfolio_Website/01 - Philosophy#six principles|"the medium is the argument"]] principle applied to backdrop rather than foreground.

## How it works

### Nodes — rejection-sampled positions

Same Poisson-disk-ish placement as constellation, but with a wider `MIN_NODE_SPACING = 1.6` (vs. constellation's 0.85). 16 dots → easy to satisfy the spacing constraint inside the frame. Each node gets:

- size in 0.030–0.060 (smaller than constellation's 0.025–0.080 max)
- color from `(NIGHT.tones[2], NIGHT.tones[3], NIGHT.tones[4])` cool pool, or 8% warm `#FFD27F`
- pulse amplitude 0.08–0.20
- pulse cycle count from `(1, 1, 2)` (sin)
- pulse phase in [0, 1)

### Edges — k=2 nearest neighbor, deduplicated

```python
for i, ni in enumerate(nodes):
    dists = sorted(((j, hypot(...)) for j != i), key=...)
    for j, _ in dists[:NEAREST_NEIGHBORS]:
        key = (min(i, j), max(i, j))
        if key not in seen:
            seen.add(key); edges.append(...)
```

For 16 nodes with k=2, expect ~20–24 unique edges. Each edge gets a random cycle count from `(1, 1, 2)` and a random phase. Fade follows `smooth_loop` with `EDGE_MAX_OPACITY = 0.18`.

### Messages — deterministic schedule, random edge

Four messages spread evenly through the 12s loop:

```python
_message_starts = (0.5, 3.5, 6.5, 9.5)
```

Each picks a random (seeded) edge. Each message has a 2-second traversal: it appears at edge.a, moves linearly to edge.b, with fade-in over the first 20% of the traversal and fade-out over the last 20%.

Seamless loop: all messages complete inside [0, 11.5], so at `t = 0` and `t = DURATION = 12` every message has opacity 0. The field's instantaneous state matches end-to-end.

## Parameters

| Name                   | Value                          | Effect                                                                     |
|------------------------|--------------------------------|----------------------------------------------------------------------------|
| `NUM_NODES`            | 16                             | Much sparser than constellation's 60.                                      |
| `MIN_NODE_SPACING`     | 1.6                            | Wide so text overlays land in negative space.                              |
| `SAMPLING_MARGIN`      | 0.7                            | Keeps nodes off the frame edges.                                           |
| `NEAREST_NEIGHBORS`    | 2                              | k for the edge graph.                                                      |
| `NODE_SIZE_MIN/MAX`    | 0.030 / 0.060                  | Small dots — distant, atmospheric.                                         |
| `WARM_NODE_PROB`       | 0.08                           | Rare warm anchor.                                                          |
| `PULSE_AMP_MIN/MAX`    | 0.08 / 0.20                    | Barely-visible breathing.                                                  |
| `EDGE_MAX_OPACITY`     | 0.18                           | Edges read as faint suggestions, not lines.                                |
| `EDGE_STROKE_WIDTH`    | 1.2                            | Slightly thinner than constellation's 1.6.                                 |
| `WITH_MESSAGES`        | True                           | Toggle for the message dots.                                               |
| `NUM_MESSAGES`         | 4                              | Spread evenly through the 12-s loop.                                       |
| `MESSAGE_DURATION`     | 2.0 seconds                    | Traversal time per message.                                                |
| `MESSAGE_RADIUS`       | 0.040                          | Same size as a small node.                                                 |
| `MESSAGE_PEAK_OPACITY` | 0.85                           | Bright enough to read, low enough not to startle.                          |
| `MESSAGE_COLOR`        | `NIGHT.accent` (`#FFD27F`)     | Warm cream, contrast with cool nodes.                                      |
| `RNG_SEED`             | 314                            | Deterministic; change for a different node arrangement.                    |

## Aesthetic decisions

- **NIGHT palette, not FOREST.** The portfolio's threshold uses FOREST (warm-dark, tree-themed). Switching to NIGHT (cool-dark) for the "on the work" section is intentional — it gives that section its own visual identity matched to its content (systems / networks read as cool / clinical / technical; tree reads as organic / generative). Per-section palette differentiation is a legitimate move; it's what [[Legendary UI-UX]] did with its four rooms.
- **Messages as the on-thesis touch.** Without messages, this is just a sparser constellation — pretty but generic. The messages are what tie the visual to the section's subject matter.
- **4 messages, not 1 or 12.** One message in a 12-second loop is too rare (you might miss it). Twelve is too many (becomes the focus). Four is the rhythm of "every few seconds something happens" — peripheral but reliable.
- **Linear interpolation for message position, not eased.** Real network messages don't ease into endpoints — they arrive at a constant byte rate. Linear traversal feels truer to the metaphor.
- **No clustering / no community structure.** k=2 nearest gives evenly-spread graph structure rather than visible "clusters." A clustered graph would tell a different story (separated communities); even-spread tells the "any node could talk to any other given connection" story that fits DDD.

## Performance notes

16 nodes + ~22 edges + 4 messages per frame. Per-frame cost is tiny — ~16 `set_fill` calls, ~22 `set_stroke` calls, up to 1 `move_to` call (only one message is ever active at a given moment given the schedule). Render: ~3 seconds at 2560×1664 / 60 fps. File size ~750 KB (estimated; will confirm after the copy).

## What I would try next

- **A "burst" mode.** Occasionally a node lights up and several messages emerge from it at once. Would lose the on-thesis "one channel at a time" feel — saved as a variant.
- **Edge length affecting message duration.** Long edges → slower messages, short → faster. Currently fixed 2s regardless. Easy change.
- **A "drop" event.** Rarely, a message starts but fades out partway through the edge — visually argues that the system is *disconnected* (DDD's name). On-thesis but might read as a bug rather than intent. Defer.
- **Static portrait of the graph as a print artifact.** A still PNG of the field at t=0, no animation, for a CV/resume site element.

## Canvas port notes (for the portfolio's TS implementation)

This scene is purpose-built for the portfolio's "on the work" section ([[Portfolio_Website/03 - Content Model#on the work]]). If a future agent ports it to canvas-2D as a backdrop on the site:

- Reuse the same flat-array-with-updater pattern as the tree port. Nodes and edges live in `Float32Array`s; per-frame `update(t)` mutates positions/opacities; canvas redraw.
- The message animation has no Manim-specific construct; ports trivially.
- Use the existing `src/lib/backdrop/palettes.ts` (will need a `NIGHT` entry added).
- Default opacity should be lower than the wallpaper render: aim for ~50% rather than 100%.
- A future scene-engine entry (see [[Portfolio_Website/Concept - Recursive Tree Backdrop#scene engine (forward-looking, not v1)]]) would register this as `'network-nodes'`.

**This is NOT in V1.** The portfolio's V1 ships only the recursive tree on the threshold + on-recursion sections; other sections have no backdrop. Adding a per-section backdrop family is a tier-2 enhancement tracked in [[Portfolio_Website/Open Questions]].

## See also

- [[08_backdrop_concepts]] — the design conversation this scene came from
- [[04_constellation]] — closest sibling scene (same graph primitives, different goal)
- [[Portfolio_Website/03 - Content Model#on the work]] — target section
- [[03_process_log]] — for the chronological build of v3
