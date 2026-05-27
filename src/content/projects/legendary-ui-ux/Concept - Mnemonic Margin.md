---
tags: [concept, primitive, manifesto]
---

# mnemonic margin

> a thread, drawn down the left margin, of where you have read.

## what it does

A 56-pixel-wide column on the left of the manifesto tab. Inside: a fixed-position `<canvas>` the height of the viewport, drawing a thin amber line whose y-coordinate is your *scroll fraction* (0 = top of document, 1 = bottom). As you scroll, the line accretes — each scroll event records a sample `(scrollFraction, velocity)` and the canvas paints from those samples.

The thread also encodes *velocity*: at each sample, x deviates from centre by an amount proportional to scroll velocity, alternating sides to give a heartbeat-like figure. Small section ticks at the right edge of the gutter mark where the threshold, each movement, and the coda begin. The current head is a brighter dot at your live scroll position.

The margin only appears in the manifesto tab. Other rooms have their own time-shape; the margin is the essay's shape.

## why

Reading is a body in time. You have a position, a velocity, and a history — but the web's idiom is to forget all three the instant you leave a page. The margin is a small honest portrait of the reading session, drawn locally, in the tab, and lost when the tab closes.

I considered persisting it to `localStorage` so you could return in a week and see your previous thread. I decided against it. A memory you can come back to in a week is a different gift from a memory that ends with the tab; and the latter felt right for this site. See [[Open Questions]].

## implementation

```
state: ring buffer of up to 900 samples { f, v, t }

on scroll (passive listener):
  dt = now - lastScrollT
  dy = scrollY - lastScrollY
  push { f: scrollY / docH, v: |dy/dt|, t: now }

per frame (manifesto only):
  1. fade canvas with rgba(ink, 0.04)
  2. draw section ticks at right edge (offsetTop / docH → y)
  3. draw the thread by connecting samples (composite: lighter)
     x deviation = sign(i) * clamp(v/1400, 0, 1) * gutter * 0.32
  4. draw the live head as a radial gradient at current scrollFraction
```

The thread accumulates indefinitely up to 900 samples; older samples drop off when capacity is hit. With a normal reading cadence, 900 samples covers a long session.

## pitfalls

- **resize-during-session.** The thread is rasterised into the canvas, not stored as normalised geometry. If the window is resized mid-session, the past thread doesn't reproject onto the new gutter. Listed in [[Open Questions]]; not fixed.
- **momentum trackpad scroll → huge velocities.** Clamping `v / 1400` to a max of 1 keeps the thread inside the gutter.
- **DPR.** Without `setTransform(dpr, 0, 0, dpr, 0, 0)` the canvas is blurry on retina; with it, the gutter is crisp.

## priors

- **NYT graphics desk side-rails** (c. 2017–2019). I did not have one open while building, but my hand drew theirs.
- **The "reading progress bar"** is folk knowledge across long-form sites (Medium, news outlets). The honest novelty here is *encoding velocity as horizontal deviation* — making the thread a portrait of pace, not just position. Slow careful reading produces a near-straight line; fast skimming produces an ECG.

## related

- [[Concept - Reading Tide]] — both depend on the scroll signal
- [[Concept - Resonant Field]] — scroll velocity opens the audio filter
- [[Concept - Constellation of Attention]] — sister primitive, lives only as long as the tab
- [[02 - Architecture]] — scroll sampling
