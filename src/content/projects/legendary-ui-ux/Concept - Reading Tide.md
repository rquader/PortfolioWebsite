---
tags: [concept, primitive, manifesto]
---

# reading tide

> a slow rhythm under the page, which you can read with or against.

## what it does

A sine wave over time, with a period of 24 seconds, written to the CSS custom property `--tide` on `:root`. CSS uses `--tide` for tiny modulations of:
- per-section transform scale (max ±0.18%)
- per-section opacity (max ±3.5%)
- body background colour (a few units in each channel)

The effect is barely perceptible. By design — its goal is to be felt, not seen. The tide is only applied to the manifesto tab; the other rooms have their own time-shapes.

## why

We read inside bodies that are breathing. There is no reason a page should pretend it doesn't know.

I chose 24 seconds because it's slightly slower than a resting human breath rate (12–18 breaths per minute → 3.3–5 seconds per breath). Twenty-four seconds is roughly four-to-six breaths per cycle. Most readers will be *almost in sync* but not quite, which is the rhythm of a slow conversation. Sync exactly and you'd notice. Way off and it's noise. The slight off-sync is what makes it feel like an environment rather than a metronome.

## implementation

```js
function tideTick(t) {
  const phase = (t / 1000) * (Math.PI * 2 / TIDE_PERIOD);
  document.documentElement.style.setProperty('--tide', Math.sin(phase).toFixed(4));
}
```

CSS does the arithmetic:

```css
.movement {
  opacity:   calc(0.965 + var(--tide) * 0.035);
  transform: scale(calc(1 + var(--tide) * 0.0018));
}
body {
  background-color: rgb(
    calc(10 + var(--tide) * 1.2),
    calc(9  + var(--tide) * 0.8),
    calc(8  + var(--tide) * 0.4)
  );
}
```

That's almost the whole primitive. One JS update per frame to one custom property; CSS interpolates the rest. Cheap.

## pitfalls

- **transforming `body` breaks fixed-position children.** A transformed ancestor creates a new containing block for fixed elements, so the canvas overlays would jump on every tick. Solution: never transform `body`. Apply the tide transform only to in-flow sections inside the manifesto.
- **letter-spacing modulation was tempting** — for an even quieter effect, I tried modulating `letter-spacing` instead of scale. It caused a full text reflow every frame and dropped the page below 60 FPS. Cut. Opacity + scale was the answer.
- **the tide ran across all tabs initially**; this looked silly in resonance (the aurora was already breathing) and synesthesia (where colour is the variable). Gated to manifesto only.

## priors

- **James Turrell** — patience as a feature. The skyscapes change so slowly you cannot quite see them changing.
- **"Let the page breathe"** is folk advice in web-design copywriting; *this is the literal thing*. The novelty is small but real — most pages talk about breathing without doing anything literal about it.

## related

- [[Concept - Mnemonic Margin]] — both treat reading as a rhythm in time
- [[Concept - Resonant Field]] — the drone is the audible tide
- [[02 - Architecture]] — tide as a single CSS variable
