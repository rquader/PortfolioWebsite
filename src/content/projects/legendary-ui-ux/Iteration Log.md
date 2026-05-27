---
tags: [iteration, log]
---

# iteration log

A terse record of what changed across the passes.

## pass 1 — first build

- Wrote the six manifesto primitives in one sitting.
- File: 1255 lines, 43 KB.
- All six primitives functional. Constants tuned by feel.

| primitive | shipped? | notes |
|---|---|---|
| [[Concept - Inertial Typography]] | ✓ | k=86, c=13 (underdamped). drag on hero. |
| [[Concept - Phosphor Touch]] | ✓ | destination-out fade, lighter stamps |
| [[Concept - Mnemonic Margin]] | ✓ | scroll fraction y, velocity x |
| [[Concept - Resonant Field]] | ✓ | three voices, slow LFO phasing, gated |
| [[Concept - Reading Tide]] | ✓ | 24-second sine, modulates CSS var |
| [[Concept - Cursor Companion]] | ✓ | spring lag k=16, c=5.4, breath via CSS |

## pass 1.5 — user feedback

> *"this is beyond beautiful, I want more tabs, more colourful, visualised sound, and brand-new things like pretext"*

Decided to expand to four rooms.

## pass 2 — multi-tab expansion

Added top tab nav with four buttons. Built three new rooms in one session.

- File: 2185 lines, 75 KB.

| primitive | room | new? |
|---|---|---|
| [[Concept - Aurora Visualiser]] | resonance | ✓ |
| [[Concept - Synesthesia]] | synesthesia | ✓ |
| [[Concept - Constellation of Attention]] | constellation | ✓ |
| word-inertial (pretext-inspired) | synesthesia | ✓ |

### shared infrastructure added

- Audio graph re-architected: added `AnalyserNode` so the aurora can read the drone's frequency bands
- Phosphor trail and cursor companion now per-tab coloured
- Audio drone persists across tab changes

## pass 2.5 — polish

| change | reason |
|---|---|
| kicker: "*a manifesto in six small parts · 2026*" → "*room one · a manifesto in six small parts*" | the dated felt try-hard |
| resonance prose: "click anywhere on the field above" → "click anywhere outside this text" | the canvas wraps the text, "above" is wrong |
| synesthesia palette: brightened `a`, `d`, `x` | unreadable against warm-dark bg |
| synesthesia heading: gradient text → simple coloured text with shadow | bg-clip: text breaks with inertial-letter inline-block spans |
| added URL hash routing (`#tab-name`) | direct links to a specific room work now |
| added `Escape` → manifesto | keyboard convenience |

### verified

- ran headless Chrome on each tab
- 125 inertial-letter spans rendered correctly
- DOM dump confirmed active-tab tracking works
- no JS errors

## pass 3 — documentation sweep

- Updated every Obsidian note to reflect the multi-tab artefact.
- Added per-primitive notes for the three new rooms.
- Refreshed [[Sources & Inspirations]] with: pretext (Cheng Lou), Rimbaud's *Voyelles*, Sean Day's synesthesia compilations, noisehack.com, Audio Shader Studio (sandner-art), Codrops audio visualiser series, Brian Eno.
- Refreshed [[Open Questions]] with the new doubts the multi-tab version raised.
- Wrote this log and [[Process Journal]].

## pass 4 — provenance & synesthesia copy

| change | reason |
|---|---|
| synesthesia intro + passage | retire Rimbaud, herons, river dawn; new copy about flat screens, word-colour disagreement, deliberate fiction |
| manifesto: **on making** (·) before coda | disclose AI experiment; note vault is part of the same test |
| footer signature | "written in one sitting" → "begun as an AI experiment, with feedback by a human" |
| JS comments (syn palette) | align with copy — Sean Day directionality, not Rimbaud citation |
| Obsidian vault | home, philosophy, synesthesia concept, sources, iteration log updated |

## final state, in one line

**`index.html` · ~2200 lines · ~76 KB · four rooms · nine primitives · one rAF loop · no network · system fonts · manifesto includes on making.**
