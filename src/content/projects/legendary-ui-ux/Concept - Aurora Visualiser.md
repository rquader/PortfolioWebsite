---
tags: [concept, primitive, resonance]
---

# aurora visualiser

> the audible room, drawn.

## what it does

A full-bleed `<canvas>` in the resonance tab. On it:

- **A starfield** of 280 deterministic stars (positions derived from `sin(i * 12.9898)`-style pseudorandom). Each star twinkles independently.
- **Three aurora curtains** — closed shapes drawn with three superimposed sine waves of different frequencies and phases. Each layer has its own colour (cyan-green, violet, amber), base Y position, and drift speed.
- **Click-to-ping interaction** — clicking the canvas spawns an expanding ring centred on the click, with a hue derived from the pitch the click triggered, and plays a soft pentatonic ping (pitch from Y position, scale [C, Eb, F, G, Bb] across two octaves).

If the audio drone is running, an `AnalyserNode` exposes three frequency bands (low, mid, high) which modulate each curtain's amplitude. The visual is alive even with audio off — the bands just stay at zero.

The first click on the canvas auto-starts the drone if it isn't on already. Clicking the visualiser is the gesture that grants consent.

## why

A drone has a shape. Most music visualisers betray the music by being more frantic than it. I wanted a visualiser that is *as slow as the drone*. Aurora curtains do this naturally: they have a beautiful unhurried movement at any frequency you tune them to.

The interaction is the second thing: the field also accepts notes from the user. Clicking is throwing a stone into a quiet lake. The ring expanding outward is the wake. It is play, but the kind of play that happens at three in the morning, alone.

## implementation

```
per frame:
  1. soft trailing clear: ctx.fillStyle = rgba(5,8,22, 0.18); fillRect
  2. starfield: 280 stars with deterministic positions + twinkle = 0.5 + 0.5*sin(t*0.0008 + phase[i])
  3. three aurora curtain layers (composite: 'lighter'):
       waveform: sin(i*0.06 + phase*9) + sin(i*0.21 + phase*13) + sin(i*0.04 + phase*5)
       amplitude: base + audioBand * 240
       drift: phase = t * speed  (per-layer speed, 0.00006/0.00009/0.00012)
       fill: linearGradient base→bottom, opacity scaled by audioBand
  4. click ripples: expanding circles (radius = age * 240),
     lifetime 3.2s, fade by age, plus inner radial gradient fill
```

The three wave frequencies (0.06, 0.21, 0.04) are chosen to not beat in obvious patterns — you should never quite hear the loop.

The trailing clear (`rgba(5,8,22, 0.18)` per frame) means each frame keeps a little of the previous frame, which gives the curtains a slight motion blur and the rings a soft persistence.

## pitfalls

- **audio band selection.** First version used four bands; the highest one was always near zero and the visualiser lost a layer. Three bands sized [10%, 30%, 60%] of the FFT range works.
- **deterministic random for stars.** Using `Math.random()` reseeds each frame, making the stars dance like noise. Index-based pseudorandom keeps them still — the only motion is the twinkle.
- **canvas-2D over WebGL.** I considered a fragment shader (would have given me much richer aurora) but it would have inflated the file with shader source. Canvas 2D is a deliberate constraint, in the spirit of the rest of the site.
- **click coordinates.** The canvas is `position: fixed` below the nav. Clicks must subtract the nav height (via `getBoundingClientRect().top`) for the ring to render in the right place.

## priors

- **Audio Shader Studio** by sandner-art — sane reference for Web Audio + canvas FFT integration. ([github.com/sandner-art/Audio-Shader-Studio](https://github.com/sandner-art/Audio-Shader-Studio))
- **Codrops 3D audio visualisers** — proved that the "FFT to visual" pattern has well-trodden best practices. (e.g. *Coding a 3D Audio Visualizer with Three.js, GSAP & Web Audio API*, 2025.)
- **noisehack.com** — *Build a Music Visualizer with the Web Audio API* (2013), the canonical patient walkthrough.
- The aurora visual idiom is a folk pattern across countless WebGL shaders; my version is a Canvas 2D variant chosen to keep the file inlinable.

## related

- [[Concept - Resonant Field]] — the audio source the visualiser listens to
- [[Concept - Phosphor Touch]] — both are canvas-overlay patterns
- [[02 - Architecture]] — per-tab rendering, audio graph
