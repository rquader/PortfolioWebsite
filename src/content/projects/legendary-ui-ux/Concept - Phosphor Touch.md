---
tags: [concept, primitive, shared]
---

# phosphor touch

> a page can remember being touched.

## what it does

A full-viewport `<canvas>` with `mix-blend-mode: screen` sits between the document and the eye. On every `pointermove`, a soft radial gradient is stamped onto the canvas (composite `'lighter'`). On every frame, a translucent black rect is drawn over everything with `destination-out` to fade older deposits. The result: a phosphorescent trail that follows the cursor and decays over about a second.

To stay smooth on fast moves, deposits are interpolated between last and current pointer positions — up to 28 sub-stamps per frame.

The trail colour is the *room's* accent: amber in the manifesto, cyan in resonance, magenta in synesthesia, ice-blue in constellation. The colour changes when you switch tabs — the trail is the same primitive, dressed for the room it's in.

## why

A pointer passes through most pages like a hand through water. It enters, it leaves, the surface forgets. *Phosphor* is the dust on the inside of a cathode-ray tube that glowed for a quarter of a second after the electron beam had passed. We lost the phosphor when we switched to flat panels. We should have kept it.

This is the smallest possible answer to "what would it feel like if a page noticed you."

## implementation

```
per frame:
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = `rgba(0,0,0, ${clamp(dt * 1.45, 0.012, 0.06)})`
  ctx.fillRect(0, 0, W, H)
  
  if pointer moved:
    ctx.globalCompositeOperation = 'lighter'
    steps = clamp(ceil(dist / 5), 1, 28)
    for each interpolation step:
      draw radialGradient at (x, y), radius 22,
      colors: rgba(r,g,b, 0.55) → rgba(r,g,b, 0)
```

Frame-rate independence: the fade alpha is scaled by `dt` so the trail's apparent lifetime is constant on 60Hz and 120Hz displays.

## pitfalls

- **fade rate is the whole game.** Too fast → no trail. Too slow → screen turns amber over time. `dt * 1.45` clamped between 0.012 and 0.06 was tuned over a few passes.
- **fast moves draw a broken line.** Interpolating stamps along the movement vector fixed it; without interpolation, sweeping the cursor diagonally leaves visible dots, not a line.
- **`mix-blend-mode: screen` works against dark backgrounds.** On lighter ones (synesthesia when tinted) the trail crushes a little. I accepted this — synesthesia is colour-led; the trail is secondary there.

## priors

- **CRT phosphor itself** — the literal source.
- Canvas additive-trail is folk knowledge in web-creative circles; *Codrops* has dozens of variations. The honest novelty here is *the trail re-coloured per room* — the same gesture, dressed for context.

## related

- [[Concept - Inertial Typography]] — same pointer drives both
- [[Concept - Cursor Companion]] — the trail's visible counterpart
- [[02 - Architecture]] — canvas stacking and DPR handling
