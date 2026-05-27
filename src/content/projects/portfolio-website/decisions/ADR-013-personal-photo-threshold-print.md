---
tags: [adr, photo, threshold, hero, design-iteration]
---

# ADR-013 — Personal photo on the threshold: "print" treatment + tree clearing

**Status:** accepted
**Date:** 2026-05-23
**Supersedes:** the rev2 plan in [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3 Photo primitive + IMG_6565 placement (threshold top-right)]] (soft-feathered radial mask + sepia overlay)
**Implements:** [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3.10 CURRENT TREATMENT — "print" + tree clearing (rev4 + rev5)]]

## Context

`IMG_6565.jpg` is the only personal photo on the site. It's the user at a podium, mic in front, **gesturing with one extended arm**. The photo lives in the top-right of the threshold — the "author photo on page 1 of a book" composition agreed in [[specs/2026-05-22-gallery-v2-photo-sticker-design]] rev2.

Three constraints from the user, surfaced across this session's iterations:

1. **Preserve the photo.** No filters that "wrongfully change" the photo (no sepia tints, no saturation/hue shifts at rest). Brightness-only lift on hover is acceptable; anything else feels dishonest.
2. **Don't clip the subject.** The gesturing hand and the podium/mic context are part of *what the photo is*. Cropping them out removes meaning.
3. **Don't fight the tree.** The recursive tree is the threshold's primary visual identity. The photo must coexist with it cleanly — not be amputated by it, not amputate it, not compete with it visually.

The threshold canvas tree is drawn full-bleed at low opacity (~12–18%) and the photo sits over it in the top-right quadrant where the canopy reaches. So there's an unavoidable overlap zone that needs a deliberate design move.

## Decision

Ship the photo as a **small "printed" photograph** — full-frame, un-cropped, un-masked, palette-integrated **only at the edge** — and carve a **soft "no-tree" clearing** out of the tree canvas around it.

### Photo: `print` treatment

A third treatment on the [[02 - Architecture|`Photo` primitive]], joining `frame` and `plain`:

- The `<picture>` wrapper gets `border-radius: 6px`, a hairline accent-tinted ring (`inset 0 0 0 1px var(--photo-print-ring)`), and a soft theme-aware drop shadow (`var(--photo-print-shadow)`).
- The `<img>` is rendered at full source pixels, `object-fit: cover` on its native aspect, `filter: var(--photo-print-rest)` which defaults to `none` (true pixels).
- Hover: `filter: var(--photo-print-hover)` — `brightness(1.06)` light, `brightness(1.1)` dark; plus a `-2px` `translateY` lift.
- Click → existing lightbox primitive (`photo-lightbox.ts`) opens the original at native size on a near-black scrim.

Theme tokens (`src/styles/tokens.css`):

| token                  | light                                            | dark                                          |
|------------------------|--------------------------------------------------|-----------------------------------------------|
| `--photo-print-rest`   | `none`                                           | `none`                                        |
| `--photo-print-hover`  | `brightness(1.06)`                               | `brightness(1.1)`                             |
| `--photo-print-radius` | `6px`                                            | `6px`                                         |
| `--photo-print-ring`   | `color-mix(in srgb, var(--accent) 30%, …)`       | `color-mix(in srgb, var(--accent) 48%, …)`    |
| `--photo-print-shadow` | soft walnut tint                                 | deeper near-black                             |

Placement: `position: absolute`, `top: clamp(4.5rem, 12vh, 7rem)`, `right: clamp(1.25rem, 5vw, 3rem)`, `width: clamp(168px, 18vw, 224px)`. Mobile (< 640px) collapses to relative-position, right-aligned, below the tagline.

### Tree: photo clearing

Apply a CSS radial mask to the threshold tree canvas so its opacity fades to transparent inside an ellipse centered on the photo:

```css
.threshold-tree {
  --tree-photo-clearing: radial-gradient(
    ellipse 19% 19% at 88% 22%,
    transparent 0%,
    transparent 38%,
    rgba(0, 0, 0, 0.55) 62%,
    rgba(0, 0, 0, 0.92) 82%,
    black 100%
  );
  mask-image: var(--tree-photo-clearing);
}
```

The clearing is **off** in two cases:

- `body[data-tree-mode="on"]` — the photo is hidden in tree-mode; the tree should read edge-to-edge.
- `@media (max-width: 640px)` — the photo is no longer floating in the upper-right, so the clearing would be a smudge in empty space.

### Hover isolation

The threshold's existing "hover brightens tree residue" effect is gated to not fire when the pointer is on the photo, so the photo's hover lift and the tree's hover brightening don't fight:

```css
.threshold:hover:not(:has(.threshold-photo:hover)) .threshold-tree {
  opacity: 0.85;
}
```

## Alternatives Considered

We iterated through three earlier treatments live, with screenshots in both modes after each. The current ADR records the journey for the next person reading the code (probably future-me) so the constraints aren't relearned by accident.

### A · Feathered radial mask + warm sepia overlay (rev2 spec, shipped first)

Treat the photo like a frescoed inset: a soft radial mask dissolves its edges into parchment; a warm sepia overlay grades the photo into the palette; hover removes the sepia and brightens it.

**Why rejected.** Hover-vs-rest produced a visible color shift (sepia → true → sepia). User: *"does it change the photo or just make it brighter when you hover over it? I think just brightness and stuff, I don't want like a filter that wrongfully changes the photo."* The rectangular dark stage backdrop also read as a "mass on parchment" that competed with the tree.

### B · Circular cameo (second iteration)

`clip-path: circle()` the photo into a small disc with an accent ring, drop the dark rectangular backdrop entirely. Place it like a yearbook headshot.

**Why rejected.** Cropped the gesturing hand. User: *"i don't like the circular cutout b/c it cuts my hand off, rethink my instructions."* The constraint about preserving the subject was implicit in the spec but only became explicit through this rejection — now codified above as constraint #2.

### C · Print + tree clearing (THIS ADR)

Full frame, un-cropped, palette-integration at the edge only, plus a radial mask carving a no-tree zone out of the canvas around the photo.

**Why chosen.** Honors all three constraints. The photo is presented as a *photograph*, not a graphic. The tree visibly steps back to make room — branches thin gracefully toward the clearing instead of being severed by the photo's rectangle. Mode-agnostic: light shows the photo as a print on parchment; dark shows it as a print on a walnut wall, both work because the integration is at the frame, not the pixels.

### D · Move the tree's trunk off-center

Bias the tree to the left so its canopy doesn't reach the photo's quadrant.

**Why rejected.** The tree's symmetry is part of its visual signature (it's a recursive *tree*, not a windswept one). Asymmetry to dodge the photo would feel apologetic about the photo's presence.

### E · Mix-blend on the photo to dim tree behind it

Use `mix-blend-mode: multiply` or similar on the photo to muddy the tree where they overlap.

**Why rejected.** The photo is opaque — there is no "tree behind the photo" visible. The problem isn't behind the photo; it's *next to* the photo's edge. Blend modes don't address that.

## Benefits

- **Photo integrity preserved.** No filters at rest, brightness-only on hover. Click opens the original. The photo is what it is.
- **Subject preserved.** Full frame; the gesturing arm reads.
- **Tree integrity preserved.** No tree-rendering code changes; the tree still recurses with its full algorithm. The clearing is pure CSS on the canvas element.
- **Theme-neutral integration.** Ring + shadow + clearing all use theme tokens. Light and dark each get their own legible composition without per-mode pixel work.
- **Tree-mode unaffected.** When the user opens the tree to its full self, the photo and its clearing are out of the way.
- **Decoupled from photo content.** If the user swaps `IMG_6565` for a different photo later, the treatment still works as long as the photo is roughly horizontal-rectangular. Aspect-flexible.

## Harms / Tradeoffs

- **Dark stage backdrop in the photo is still visible.** Especially in light mode, the photo's own dark rectangle reads against parchment. The size and the clearing keep it from feeling like a "mass," but a viewer who finds rectangular photos on parchment jarring won't be converted. Mitigation: this is the cost of constraint #1 (no filters at rest) + #2 (no cropping).
- **The clearing center is hard-coded.** `ellipse 19% 19% at 88% 22%` matches the current photo position. If the photo's CSS placement changes substantially, the clearing must be re-tuned. Mitigation: the clearing is a single CSS var (`--tree-photo-clearing`); a future improvement is to derive its center from the photo element's bounding box at runtime (JS), but the static version is fine for the current layout and would be the wrong complexity right now.
- **`mask-image` browser support.** Universal in evergreen browsers with `-webkit-` prefix. If a viewer is on a browser without mask support (vanishingly small share), the canvas will render edge-to-edge and the photo will still sit on top — degraded but functional.
- **The clearing slightly thins the tree's overall density.** It's intentional, but it does mean the canopy reads as marginally smaller. Acceptable: the photo is part of the composition now.

## Revisit If

- The user wants the photo bigger / smaller / repositioned. The clearing's ellipse params + the photo's `top`/`right`/`width` are the touchpoints; both are CSS vars or clamp() expressions in a single file.
- The user wants a different photo with a substantially different aspect or color profile. The print treatment is aspect-flexible, but a portrait-orientation photo would need the clearing re-shaped (taller, narrower).
- A future redesign wants the threshold without a personal photo at all. Just drop `<div class="threshold-photo">` from `Threshold.astro` and the clearing CSS vars become dead but harmless. Removing the clearing entirely is a 5-line CSS delete.

## See also

- [[Concept - Threshold Hero]] — current state of the threshold composition (this ADR is its current "personal photo" section).
- [[specs/2026-05-22-gallery-v2-photo-sticker-design]] — full spec, rev4 + rev5 are the implemented state.
- [[Process Journal#2026-05-23 · night · Phase 6 rev2 — IMG_6565 photo iteration + tree clearing]] — the session-level narrative of the four iterations.
- `src/components/photo/Photo.astro` — primitive with `print | frame | plain` treatments.
- `src/styles/photo.css` — `.photo.print` styling.
- `src/styles/threshold.css` — `.threshold-photo` placement + `.threshold-tree` clearing mask.
- `src/styles/tokens.css` — `--photo-print-*` theme tokens.
