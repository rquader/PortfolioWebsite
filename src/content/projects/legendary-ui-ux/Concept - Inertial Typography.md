---
tags: [concept, primitive, manifesto]
---

# inertial typography

> letters that remember they are objects.

## what it does

Every glyph in the hero heading and each section heading is wrapped in a `<span>` with `display: inline-block`. Each has a *rest position* (which the layout owns) and a *live offset* (which physics owns). The offset is driven by a damped spring toward zero. The pointer applies an inverse-square repulsion to glyphs within a 175px radius. The hero is `data-draggable` — `pointerdown` captures a letter and follows the pointer until `pointerup`.

## why

Web type is the least material material we have. Print type was hot metal, cold metal, photo-emulsion, ink — each step gave the letter slightly more body. Inertial typography is a small attempt to give the body back.

The decisive design choice was: *the layout still owns the rest position*. The springs pull each letter back to wherever the layout currently places it. Resize the window and the letters chase the new geometry home. That is what makes the effect feel less like a toy and more like the page itself having weight.

## implementation

Per letter:

```
state: { el, x, y, vx, vy, mass, dragging, draggable }
per frame:
  1. cx, cy = el.getBoundingClientRect() center
  2. forces:
     - spring to rest in offset space: f = -k * x - c * vx
     - pointer repulsion (inverse-square): fp = 5400 / (d² + 160), capped d < 175
  3. integrate: vx += f * dt;  x += vx * dt
  4. transform: translate3d(x, y, 0), snapped to half-pixels
```

Constants after pass two:
- spring `k = 86`, damping `c = 13` (slightly under-damped for a hint of bounce)
- drag spring much stiffer: `k = 220`, `c = 24` (snaps cleanly to pointer)
- repulsion radius cap 175px so distant letters aren't disturbed

The trick: `getBoundingClientRect()` returns the *current* visible position, including any transform offset already applied. So `restCx = cx - n.x` gives the rest position implicitly. No recomputation needed on resize — the layout's geometry is the source of truth.

## pitfalls

- **inline whitespace lost when splatting.** Each word is wrapped in its own `inertial-word` span, with a real `textNode(' ')` between. Without this, the heading collapses to a single un-broken run on small viewports.
- **sub-pixel shimmer on retina.** Half-pixel rounding (`Math.round(n.x * 2) / 2`) on the transform eliminates the jitter.
- **letters in hidden tabs.** `getBoundingClientRect()` still returns *something* (often 0,0,0,0) for non-visible elements. Skipping nodes with `offsetParent === null` is the right gate. Without it, every letter in inactive tabs was springing toward (0,0) and visibly moving every time a tab activated.

## priors

- **Bret Victor** — *Inventing on Principle*, *Kill Math*. The "any object you see should also be a thing you can pick up" idiom.
- **Rauno Freiberg** ([rauno.me](https://rauno.me)) — current state of the art in subtle, kinetic web typography. My damping constants are influenced by his patience for tuning.
- **Flash-era kinetic type** (1999–2003) — inertial type isn't new. What is modestly new: *the spring returns to a target the layout still owns*. Most kinetic type freezes the layout.

## related

- [[Concept - Phosphor Touch]] — same pointer, two responses
- [[Concept - Cursor Companion]] — same family of "physical body" decisions
- [[02 - Architecture]] — the rAF loop and pointer state
