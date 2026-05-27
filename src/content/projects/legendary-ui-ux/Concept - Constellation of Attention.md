---
tags: [concept, primitive, constellation]
---

# constellation of attention

> the words you linger on become stars.

## what it does

In the constellation tab, every word in the prose is wrapped in a `<span class="const-word">`. Hover any word for 700 ms — a *dwell* — and:
- the word ignites visually (warm glow + text-shadow)
- a star is drawn on a background canvas at the word's screen position
- a thin line draws between this new star and the previous one
- the star count next to the passage increments
- if the drone is on, a soft pentatonic ping plays

The constellation persists across scrolling within the tab — stars are stored with their document-space y coordinate, then rendered into the viewport canvas with `y - scrollY`. They hold their places as you move through the page.

The constellation lives only as long as this tab does. There is no save button. That is by design.

## why

Reading is mostly invisible to the reader. You don't know which words made you slow down, or which words you fixated on, until someone asks. The constellation is one way of making that invisible visible — *a small private portrait of where you stayed*.

The single explicit design rule was: **this is not social**. No sharing, no leaderboard, no comparison. The constellation is for you, by you, and for the next few minutes. The "no save button" is not laziness — it is a refusal to make a small intimate gesture into a thing one performs in public. See [[Open Questions]] for the related ethical knots.

## implementation

```
state:
  stars:     [{ x, docY, born, word }]
  lines:     [{ a, b }]
  dwellEl:   the word currently being hovered
  dwellStart: when the hover began
  DWELL:     700 ms

on pointerenter of a const-word:
  dwellEl = w; dwellStart = now()
  w.classList.add('dwelling')      // CSS shows underline

per frame (constellation tab only):
  if dwellEl && now - dwellStart >= DWELL && !alreadyIgnited:
    measure w's bounding rect
    push star { x, docY = screenY + scrollY, born, word }
    if stars.length >= 2:
      push line { a: previous star, b: new star }
    if audio is on: play soft ping
    dwellEl = null
  
  render:
    soft trailing fade (rgba(3,5,14, 0.08))
    background starfield (deterministic, faint)
    lines first (composite 'lighter', dim amber)
    stars: radial-gradient halo + 1.6px pinpoint, twinkle
```

### key implementation choices

- **dwell, not click.** Clicking is interruptive. Dwell is the gesture of *reading*, not of *acting*. The 700 ms threshold is roughly the time it takes a slow reader to land on a word.
- **doc-space y, not screen-space y.** Stars stored in document coordinates, rendered with `- scrollY` at draw time. This is what lets the constellation stay anchored to the words even as you scroll.
- **lines connect the previous star, not nearest-2.** I tried nearest-neighbour (a Delaunay-ish look); it was beautiful but the *chronology* of the reading was lost. Sequential lines preserve order — the constellation is also a *path* through the reading.

## pitfalls

- **double-firing.** A word that has already ignited shouldn't re-ignite. `if (!w.classList.contains('ignited'))` before adding a star.
- **stars off-screen after scroll.** Stars whose computed screen-y is outside the viewport are skipped during rendering (small savings), but they still exist in state and lines can connect across off-screen stars.
- **resize.** The canvas resizes on `window.resize` but stars are stored in doc-y, so they reproject correctly. (This is the part [[Concept - Mnemonic Margin]] doesn't get right; the constellation does.)
- **the `\b` regex tokenizer** breaks "paragraph's" into ["paragraph", "'", "s"], so apostrophes split a word into two ignitable spans. I considered fixing this, but the visual cost is small and the reading experience is fine. Filed.

## priors

- **Jonathan Harris** — *We Feel Fine*, *The Whale Hunt*. Particles-as-emotion. The conviction that data can have a soul if you give it one.
- **Mid-2010s NYT data interactives** — visualising where attention concentrates within a long-form piece.
- **Maggie Appleton's "digital garden"** — the conviction that a reading session is something with a shape worth respecting.

I'm not aware of anyone making the *specific* gesture of "dwell-to-ignite a personal constellation on top of a reading." If they have, my version is in conversation with theirs, not in defiance.

## related

- [[Concept - Mnemonic Margin]] — sister primitive; both are portraits of reading
- [[Concept - Resonant Field]] — pings on ignition
- [[Open Questions]] — the no-save-button debate
- [[02 - Architecture]] — tab-scoped primitives
