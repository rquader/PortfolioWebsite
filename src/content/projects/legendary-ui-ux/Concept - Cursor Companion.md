---
tags: [concept, primitive, shared]
---

# cursor companion

> the cursor is a body, not a pointer.

## what it does

A small dot — 8px filled, with a 30px breathing ring behind it — follows your pointer with a quarter-second of damped-spring lag. When you stop moving, it rests. The ring breathes via CSS animation (4.8-second cycle, scale 0.7 → 1.08, opacity inverse).

The dot is *not* the cursor — the system cursor is still visible and active. The companion sits *with* the cursor, behind and slightly trailing it. It is not a pet. It is more like a hand you forgot you had.

The companion's colour changes per room (amber, cyan, magenta, ice-blue) via a CSS custom property — same dot, dressed for context.

## why

You arrived with a hand. Somewhere in the late nineties we gave you a tiny black arrow instead and called it a representative. The arrow has served us well for forty years and it has nothing more to teach us.

The decisive design choice was *not to hide the system cursor*. Hiding the cursor breaks every habit a user has — it's a hostile move dressed up as artistry. The companion is additive: it lives alongside the system cursor and is unfussily ignorable.

## implementation

```js
// state: comX, comY (current position), comVx, comVy (velocity)
// per frame:
//   k = 16, c = 5.4
//   comVx += (-k * (comX - pointer.x) - c * comVx) * dt
//   comX  += comVx * dt
//   companion.style.transform = `translate3d(${comX}px, ${comY}px, 0)`
```

The breath is pure CSS (`@keyframes companion-breath`, 4.8s ease-in-out infinite). The lag is pure JS (one damped spring). The colour is one CSS custom property. There is nothing else here. That is intentional.

## pitfalls

- **touch devices.** The companion makes no sense on a touchscreen — no continuous pointer position. `@media (hover: none)` hides it. I also hide it below 720px width as a belt-and-braces.
- **first-paint position.** The companion starts at `(-100, -100)` so it isn't visible in the top-left corner before the first `pointermove`. On entry it springs to wherever the cursor is, in a fraction of a second, with no visual artefact.
- **`mix-blend-mode: difference`** was tempting (so the companion would always be legible on any background) but it interacts oddly with `position: fixed` in some browsers and made the companion strobe over the aurora curtains. Plain colour, swapped per tab, was the simpler answer.

## priors

- **The collaborative-cursor lineage** — Figma, FigJam, mmm.page, *cursor.so*, the early multi-cursor demos. Those are about *other people's* cursors; this is about yours. The visual idiom (a coloured dot with a breath) is borrowed.
- **Mark Weiser / calm computing** — the idea that an interface element can simply *be* without doing anything. The companion does nothing. That is what it does.

## related

- [[Concept - Inertial Typography]] — same pointer, different physical response
- [[Concept - Phosphor Touch]] — same pointer, same colour palette per room
- [[02 - Architecture]] — shared pointer state
