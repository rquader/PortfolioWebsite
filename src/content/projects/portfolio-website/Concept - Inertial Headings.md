---
tags: [concept, primitive, typography]
---

# Concept — Inertial Headings

> Headings whose letters have weight. The cursor pushes them gently aside as it passes; they spring back.

## What it is

A small physics simulation attached to letter-level spans inside headings. Each letter is a node with a position offset (`x`, `y`), velocity, and a spring back toward `(0, 0)`. The pointer applies a soft repulsion within a small radius. Letters wobble once when pushed and settle.

Ported in spirit from [[Legendary UI-UX/Concept - Inertial Typography]] (which in turn was inspired by Cheng Lou's [pretext](https://github.com/chenglou/pretext)). Lightly simplified for the portfolio context — no on-entrance bounce, no keyboard drag, no jiggle on scroll.

## Why

Two reasons. **First:** the medium-is-the-argument principle ([[01 - Philosophy]]). A portfolio that asserts the user cares about craft can demonstrate that craft in the typography itself. **Second:** it's *quiet* interaction — the reader can ignore it entirely, but if they hover the name, the letters notice them. That's a small kindness.

## Where it applies

- The hero name (`<h1>` in `<Threshold>`). Every letter.
- Section headings ("on me," "on the work," etc.). Every letter.
- **Not on body prose.** Letter-level inertia in paragraphs is too much; it reads as a screensaver.

## Algorithm

For each letter span:

```
state per letter:
  x, y       — current offset from rest position
  vx, vy     — velocity
  rx, ry     — rest position (where the letter "wants" to be — always (0, 0))

spring constants:
  k          — 86   (stiffness — N/m equivalent)
  c          — 13   (damping)
  pointerR   — 90   (px; the radius of pointer influence)
  pointerF   — 1200 (px/s² impulse strength when pointer is at center)

per frame (dt seconds):
  for each letter span L:
    if L is offscreen / display:none, skip
    compute distance d from pointer to letter's screen center
    if d < pointerR:
      a = pointerF * (1 - d/pointerR)^2  // soft falloff
      direction = (letter_center - pointer) normalized
      L.vx += direction.x * a * dt
      L.vy += direction.y * a * dt
    // spring back to rest
    ax_spring = -k * L.x - c * L.vx
    ay_spring = -k * L.y - c * L.vy
    L.vx += ax_spring * dt
    L.vy += ay_spring * dt
    L.x  += L.vx * dt
    L.y  += L.vy * dt
    L.span.style.transform = `translate3d(${L.x}px, ${L.y}px, 0)`
```

Constants tuned for "wobbles once and settles." `k=86, c=13` is the Legendary value, slightly underdamped. If headings feel like a desk toy, raise `k`. If they feel rigid, lower `k` or raise `pointerF`.

## DOM model

Letters are real `<span>` elements. The user-authored HTML uses either:

- explicit per-letter spans (`<span data-inertial>r</span><span data-inertial>a</span>...`) — verbose but unambiguous, and survives any text-shaping anomaly
- a wrapper element marked `data-inertial-text` that the JS splits at boot time

Recommendation: **explicit spans** for the hero name (it's typed once, small) and **wrapper splitting** for section headings (less HTML noise).

`splitInto = (root) => { /* walks text nodes, wraps each non-space character in a span, preserves whitespace */ }`

## Pointer geometry

Letter screen-center is computed once per frame from `boundingClientRect()` — but only when the heading is in the viewport. Use an `IntersectionObserver` to gate the work. A heading off-screen costs zero per-frame work.

For 30 letters in 2 headings simultaneously visible (typical worst case for this portfolio): ~60 `getBoundingClientRect()` calls per frame. Cheap on modern browsers. Sub-millisecond.

## Module shape

```ts
// src/lib/primitives/inertial-type.ts
type Letter = { span: HTMLElement; rx: number; ry: number;
  x: number; y: number; vx: number; vy: number; cx: number; cy: number };

export interface InertialTypeHandle { stop: () => void }

export function initInertialType(root: HTMLElement): InertialTypeHandle {
  const letters: Letter[] = collectLetters(root);
  const pointer = { x: -1e6, y: -1e6 };
  const onMove = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY };
  window.addEventListener('pointermove', onMove, { passive: true });

  const tick = (dt: number) => {
    if (!isVisible(root)) return;          // gate
    refreshCentersIfNeeded(letters);       // throttled (e.g. on resize)
    for (const L of letters) updateLetter(L, pointer, dt);
  };
  registerTick(tick);  // boot.ts central rAF loop

  return { stop: () => window.removeEventListener('pointermove', onMove) };
}
```

The boot module (`src/lib/boot.ts`) calls `initInertialType(document.body)` once at mount.

## Edge cases

- **Whitespace:** spans wrap non-space characters only; whitespace stays raw text nodes between spans. Letter wobble does not change line wrapping.
- **Ligatures:** native ligatures are broken by per-letter spans. For the system serif type stack we're using, no commonly-rendered ligatures occur in the words we display. Verify with the user's tagline when first shipped.
- **RTL languages:** none used here, but the algorithm is direction-agnostic.
- **Touch devices:** `pointermove` fires only with a pointer hovering — touch typically doesn't generate continuous `pointermove`. The headings simply rest. Acceptable.
- **Reduced motion:** the tick function becomes a no-op when `prefers-reduced-motion: reduce` is set. Letters render static at rest position. See [[02 - Architecture#prefers-reduced-motion]].

## Performance budget

- Per-frame cost: ~0.3 ms on M-series silicon for ~60 simultaneously visible letters.
- Letters off-screen via `IntersectionObserver`: 0 ms.
- `getBoundingClientRect()` refresh: deferred to `resize` events and a coarse fallback every ~500ms (not every frame).

## Open questions

- Keyboard-only inertial drag — Legendary noted this as an open question and never resolved it. We don't resolve it either; defer to [[Open Questions#inertial-type accessibility]].
- Touch-equivalent — scroll-velocity-driven wobble on touch could be a future tier-2 enhancement. Defer.

## See also

- [[Concept - Threshold Hero]]
- [[Legendary UI-UX/Concept - Inertial Typography]] — the parent concept
- [[02 - Architecture#the single raf loop pattern]]
