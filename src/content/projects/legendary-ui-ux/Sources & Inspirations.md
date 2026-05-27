---
tags: [credits, references]
---

# sources & inspirations

An honest list of debts. Some influenced specific primitives; some shaped the project's mood; a few are listed because pretending they didn't would be theft.

## directly load-bearing on primitives

**Cheng Lou — [pretext](https://github.com/chenglou/pretext)** ([pretext.cool](https://www.pretext.cool/)) — text measurement as pure arithmetic over canvas-measured widths, bypassing DOM reflow. I did not import pretext (the file is one-html, no network), but the word-physics in [[Concept - Synesthesia]] is implemented in its spirit: lay out once, animate offsets, never reflow.

**Sean Day — grapheme-colour synesthesia compilations.** Decades of self-report statistics from synesthetes. The directionality of my letter palette (which letters tend to red, which to yellow, etc.) is informed by these, even where the specific shade is mine. The [[Concept - Synesthesia|synesthesia]] tab copy cites research disagreement, not any one historical poem.

**Arthur Rimbaud — *Voyelles* (1871).** Earlier passes used his colour-vowel mapping in the room prose; pass 4 removed that. The palette was never his chart; the literary debt is retired from the live page but worth naming here as prior art for grapheme–colour fiction.

**Bret Victor — *Inventing on Principle*, *Kill Math*, *Magic Ink*.** The conviction that interaction can be a medium for thought. The "any object you see should also be a thing you can pick up" idiom in [[Concept - Inertial Typography]] is downstream of him.

**Rauno Freiberg** ([rauno.me](https://rauno.me)) — current state of the art in subtle, kinetic web typography. The damping constants in [[Concept - Inertial Typography]] are influenced by his patience for tuning.

**Brian Eno — *Ambient 1: Music for Airports* (1978).** The "slow phasing, no rhythm, no resolution" lineage. The drone in [[Concept - Resonant Field]] is built on detuned voices with slow LFO phasing — a small embarrassed homage.

**noisehack.com — *Build a Music Visualizer with the Web Audio API* (2013).** The AnalyserNode + frequency-band-summing pattern I use is directly from this article. The [[Concept - Aurora Visualiser]] would have been a much longer struggle without it.

**Audio Shader Studio (sandner-art)** — [github.com/sandner-art/Audio-Shader-Studio](https://github.com/sandner-art/Audio-Shader-Studio). Sane reference for Web Audio + canvas FFT integration. I did not import any code; I read it.

**Codrops** — *Coding a 3D Audio Visualizer with Three.js, GSAP & Web Audio API* (2025), plus general trail-canvas recipes. Proved that the "FFT to visual" pattern has well-trodden best practices.

**Jonathan Harris — *We Feel Fine* (2006), *The Whale Hunt* (2007).** Particles-as-emotion. The conviction that data can have a soul if you give it one. [[Concept - Constellation of Attention]] is in conversation with these.

## mood and material

**Robin Sloan — *An app can be a home-cooked meal*, *The Slow Web*.** Permission to make a thing for one person, or for a mood, rather than for product-market fit.

**Maggie Appleton — the digital garden idiom.** The structure of this vault — short notes, dense wikilinks, no canonical order — is hers.

**Olafur Eliasson — *The Weather Project* (2003), *Your House*.** The conviction that an environment can be a work, not a setting.

**James Turrell — *Roden Crater*, the skyscapes.** Patience as a feature. [[Concept - Reading Tide]] is a small, embarrassed homage.

**Ryoji Ikeda — *dataplex*.** Maximal effects from minimal palettes. (This site is grey, white, amber, and one cobalt in the manifesto; it is not allowed any others in that room.)

**Mark Weiser — *calm computing***. The idea that an interface element can simply *be* without doing anything. The [[Concept - Cursor Companion|cursor companion]] *does nothing*; that is what it does.

**Tobias Frere-Jones, Jurriaan Schrofer** — kinetic and architectural typography. Letters as objects with a back and a side, not glyphs only.

## practitioners whose recent work helped

- **the Linear team** — for proving that quiet is louder than loud on a marketing page.
- **the Vercel / Geist team** — for the bar height on display typography.
- **the Browser Company (Arc)** — for refusing the default chrome.
- **the Diagram → Figma motion team** — for popularising "spring physics, not bezier curves."
- **mmm.page, FigJam cursors, cursor.so** — the collaborative-cursor idiom that [[Concept - Cursor Companion]] borrows from. (Theirs are about other people's cursors; mine is about yours.)

## texts re-read while writing this

- Robert Bringhurst — *The Elements of Typographic Style*
- Don Norman — *The Design of Everyday Things* (mostly to argue with), *Living with Complexity* (less to argue with)
- Marshall McLuhan / Quentin Fiore — *The Medium is the Massage*
- James C. Scott — *Seeing Like a State* (for what gets lost when interfaces standardise)

## things i borrowed without realising until later

Honest accounting: every project carries silent passengers. These are the ones I caught myself smuggling in:

- The **margin thread** in [[Concept - Mnemonic Margin]] resembles the side-rails in some New York Times graphics-desk scrollytelling (c. 2017–2019).
- The **cursor with a breath** in [[Concept - Cursor Companion]] is in the family of FigJam cursors and *cursor.so*. Those are collaborative; mine is solitary. But the lineage is theirs.
- The **manifesto-as-demonstration** structure resembles Bret Victor's *Ladder of Abstraction* and Bartosz Ciechanowski's explorables. Neither would consider mine a peer; both deserve mention.
- The **aurora visual idiom** is a folk pattern across countless WebGL shaders (Shadertoy, codepen, etc.); my Canvas-2D version is a constrained variant.

## what i deliberately did not look at

So as not to be derivative on purpose: I did not open *awwwards*, *Site Inspire*, *godly.website*, or any "UI of the year" galleries during the build. I wanted this to arrive from priors and from sitting still, not from a feed.
