---
tags: [concept, primitive, cursor]
---

# Concept — Cursor Companion

> A small additive presence that follows the cursor. Not a custom cursor — the system cursor stays. The companion is its body: a soft dot inside a breathing ring, colored to the current section's accent.

## What it is

A `position: fixed` `<div>` with two visual elements:
1. A solid dot (~8 px diameter) with a soft box-shadow glow.
2. A breathing ring (~30 px diameter, 1 px border) that gently scales and fades on a 4.8s loop.

The element follows the pointer position with a tiny lag (one-frame smoothing). It's `pointer-events: none` so it never interferes with click targets.

Inherits from [[Legendary UI-UX/Concept - Cursor Companion]] essentially unchanged.

## Why

Two functions:
1. **Atmosphere.** Gives the cursor a body in the way the rest of the site has bodies (letters with weight, branches with sway). The reader's presence is acknowledged.
2. **Section identity.** The companion's color changes with the current section. Threshold = FOREST teal accent; "on me" = synesthesia-tinted; "on the work" = a research-themed accent (TBD); etc. The companion is a quiet wayfinding signal.

## Visual design

```css
#cursor-companion {
  position: fixed; top: 0; left: 0;
  pointer-events: none; z-index: 100;
  transform: translate3d(-100px, -100px, 0); /* off-screen until first pointer move */
  will-change: transform;
}
.companion-body {
  position: absolute;
  width: 8px; height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  background: var(--companion-color, var(--accent));
  box-shadow: 0 0 12px var(--companion-color, var(--accent));
  transition: background 0.6s ease, box-shadow 0.6s ease;
}
.companion-ring {
  position: absolute;
  width: 30px; height: 30px;
  margin: -15px 0 0 -15px;
  border-radius: 50%;
  border: 1px solid var(--companion-color, var(--accent));
  opacity: 0.4;
  animation: companion-breath 4.8s ease-in-out infinite;
}
@keyframes companion-breath {
  0%, 100% { transform: scale(0.7); opacity: 0.65; }
  50%      { transform: scale(1.08); opacity: 0.12; }
}
```

## Per-section accent

A single CSS variable (`--companion-color`) is set by the section the cursor is currently in. The simplest approach: when the user scrolls, an `IntersectionObserver` updates `document.documentElement.dataset.section` to the current section's slug. CSS scopes the variable:

```css
:root { --companion-color: var(--accent-default, #e8d8a8); }
:root[data-section="threshold"]   { --companion-color: #b0ebd2; }
:root[data-section="on-me"]       { --companion-color: var(--syn-current, #d28ad6); }
:root[data-section="on-the-work"] { --companion-color: #c8d8e8; }
:root[data-section="on-the-artifacts"] { --companion-color: var(--accent-default); }
:root[data-section="on-recursion"]{ --companion-color: #87dcb8; }
:root[data-section="on-the-trail"]{ --companion-color: #c8c4b8; }
:root[data-section="coda"]        { --companion-color: var(--accent-default); }
```

Transitions are CSS (0.6s ease), so changes are smooth.

## Pointer lag

A one-frame smoothing makes the companion feel weightful, not pinned to the cursor:

```ts
let tx = pointer.x, ty = pointer.y;
function tick(dt: number) {
  const alpha = 1 - Math.pow(0.001, dt);  // critically smooth, dt-stable
  tx += (pointer.x - tx) * alpha;
  ty += (pointer.y - ty) * alpha;
  el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
}
```

(The `Math.pow(0.001, dt)` form gives a frame-rate-independent ease.)

## Mobile

Hidden on coarse pointers:

```css
@media (pointer: coarse) {
  #cursor-companion { display: none; }
}
```

A touch-equivalent ambient pulse (e.g., a faint ripple at touch points) is a tier-2 future. Not in V1. Tracked in [[Open Questions#cursor companion mobile behavior]].

## Reduced motion

The breathing ring's `animation` is set to `none`. The companion body remains visible (color is not motion). The lag-tween becomes instant.

```css
@media (prefers-reduced-motion: reduce) {
  .companion-ring { animation: none; }
}
```

## Module shape

```ts
// src/lib/primitives/cursor-companion.ts
export function initCursorCompanion(): { stop(): void } {
  const el = createElement();
  document.body.appendChild(el);
  const pointer = { x: -1e6, y: -1e6 };
  const onMove = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY };
  window.addEventListener('pointermove', onMove, { passive: true });
  // tick registered with boot's central rAF loop
  return { stop: () => { onMove && window.removeEventListener('pointermove', onMove); el.remove(); } };
}
```

## Edge cases

- **Pointer leaves the window** — the companion stays at its last position. Acceptable.
- **Fast pointer movement** — the one-frame lag means very fast motion shows a trail of one frame; this reads as weight, not as a bug.
- **High-DPI displays** — `transform: translate3d` handles subpixel positioning. No special handling.

## See also

- [[Legendary UI-UX/Concept - Cursor Companion]] — the parent
- [[02 - Architecture#the single raf loop pattern]]
