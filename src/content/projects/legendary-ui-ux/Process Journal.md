---
tags: [diary, process]
---

# process journal

The diary, in three passes. Not edited for posterity.

---

## 2026-05-12 · morning · the empty room

Started with an empty `~/Developer/legendaryUI:UX` and an empty Obsidian folder. The user gave me Opus 4.7 max and said "make the best UI/UX ever, take multiple passes, document everything in Obsidian." Free rein. The brief is impossible, which is the useful part.

First decision: the unit. What *kind* of site? Portfolio? Product? Manifesto? Art piece? The honest answer is **an art piece in the form of a manifesto-as-demonstration**. Each section both argues for a primitive and *is* the primitive. The user can't read about "memory" without watching their margin draw itself.

Brainstormed twelve candidate primitives over twenty minutes. Cut to six for the manifesto:

1. Inertial typography
2. Phosphor touch
3. Mnemonic margin
4. Resonant field (audio drone)
5. Reading tide
6. Cursor companion

Cuts preserved in [[Cut Concepts]]: negative cursor, echo pages, sediment, breath sync, polyphonic reading, page as instrument, reading temperature, coexistence cursors. Most cut for being beautiful but redundant with another primitive on the same page.

Locked the title and tone: lowercase, intimate, slow. *"on weight, on memory, on resonance — field notes from a quieter web."* The voice is someone thinking out loud at the end of a long studio day. Not pretentious by accident, only by aesthetic discipline.

## 2026-05-12 · afternoon · pass one

Wrote the HTML in one sitting. About 1255 lines, 43 KB. Six sections of essay, six primitives, one rAF loop. Got the first version running at hour three.

Constants on inertial typography took the most tweaking — too stiff and it felt like a desk toy; too soft and the letters wandered. Landed on `k = 86, c = 13`. Underdamped just enough to wobble once when pushed.

Phosphor took twenty minutes. The trick is `destination-out` for the fade rather than overlaying with bg colour (which never quite reaches zero alpha).

Margin took two hours, mostly figuring out the visual language. Tried a straight bar (boring), polar coordinates (chaotic), and the velocity-encoded thread I shipped. The last won because it makes the *pace* of reading legible, not just the *position*.

Tide took ten minutes. One CSS variable, three CSS uses, one trig function. The hardest part was deciding *not* to do more — no letter-spacing breath, because that reflowed every frame.

Cursor companion took an hour, mostly because I kept trying to hide the system cursor. Eventually accepted: *do not hide the system cursor*. The companion is additive. Way better.

Web Audio took a couple of hours, mostly debugging Safari's autoplay gating. Settled: every page-load is silent. Three buttons can start the drone; once started, it persists.

## 2026-05-12 · evening · the user reacts

User opened the file: *"this is beyond beautiful, I want more tabs, more colourful, visualised sound, brand-new things like pretext, do research."*

Read pretext (Cheng Lou): a 15KB zero-dependency text-measurement library that bypasses DOM reflow by using `canvas.measureText()` as ground truth. Did not import it — the one-file-no-network constraint stands — but absorbed the central idea: lay out once, animate offsets, never reflow.

Three new rooms decided in five minutes:

- **resonance** — full-bleed aurora visualiser, audio-reactive via `AnalyserNode`. Click anywhere to throw a pitched ping; the room catches it as an expanding ring of colour.
- **synesthesia** — grapheme–colour as a deliberate fiction. Each letter gets a hue; each word's tint is the average of its letters'. Hover a word, the whole room takes its colour. Words are inertial too, in pretext's spirit. (Pass 4 replaced the Rimbaud/heron passage with screen-and-midnight prose.)
- **constellation** — dwell on words to ignite stars. A line draws between consecutive stars. The constellation persists across scroll but dies with the tab.

Wrote them in one session. The file grew to ~2200 lines, 75 KB.

A small attribution honesty point I almost missed: I credit pretext directly in the synesthesia tab's aside ("borrows the spirit of pretext by Cheng Lou"). Also in [[Sources & Inspirations]], with a link to the repo. The implementation is mine, but the *idea* of treating text geometry as arithmetic is Lou's.

## 2026-05-12 · late evening · pass two polish

Real things to fix that I caught on rereading:

- The manifesto threshold's kicker said "*a manifesto in six small parts · 2026*". The date felt like trying too hard. Changed to "*room one · a manifesto in six small parts*."
- The resonance prose said "click anywhere on the field above." But the canvas wraps the text, so "above" is misleading. Changed to "click anywhere outside this text."
- Synesthesia letter `a` was `#332019` — too dark to read against the warm-dark bg even on hover. Brightened (also `d` and `x`). The Rimbaud "A is BLACK" claim still survives — `a` is still the darkest letter — but is now legible.
- The synesthesia hero "on colour" was invisible. I'd set it as gradient text with `background-clip: text`. But the inertial-letter spans break that technique: bg-clip on the parent doesn't extend through nested inline-blocks. Fixed by switching to plain colour with a text-shadow glow. Lesson: any visual effect that touches the *child layout structure* has to be re-examined when you ship a primitive that splits text.
- Added URL hash routing (`#tab-resonance`, etc.) so direct-link works. Also bound `Escape` to return to the manifesto.

## 2026-05-12 · later · headless verification

Ran headless Chrome on each tab. The DOM dump confirmed:
- `body[data-tab]` correctly switches
- The active `.tab-btn` class correctly tracks the URL
- No JS errors in console
- 125 inertial-letter spans were splatted across all headings (the inertial type system is running)

Took screenshots of each tab. Confirmed:
- **manifesto** — letters caught mid-fall in the entrance animation; in a live browser these settle in well under a second
- **resonance** — three aurora curtains drifting over a starfield, "on resonance, visualised" set against them
- **synesthesia** — "on colour" heading visible in the room's signature magenta, body prose dimmed by gauze, awaiting hover
- **constellation** — starfield behind "on attention", lede in ice-blue, prose laid out for dwell-ignition

The screenshots are misleading for the dynamic states (e.g., the manifesto hero is mid-spring), but they confirm the rendering pipeline is intact.

## 2026-05-27 · pass four · provenance

User asked to change the synesthesia room away from Rimbaud/heron imagery and to note somewhere that the site was largely an AI experiment.

- Rewrote synesthesia intro + hover passage (screens, subway/lemon/midnight, chart-as-fiction).
- Added manifesto section **on making** (·) before the coda — same voice, states machine-assisted build + vault parity.
- Footer signature updated.
- Obsidian notes synced ([[Iteration Log]], [[Concept - Synesthesia]], [[01 - Philosophy]], home).

## what i'd do with more time

A pass three exists in my head but doesn't fit in tonight:

- A keyboard interface for inertial drag. Arrow keys to nudge a focused letter. Space to release. Currently mouse-only.
- The margin's resize problem. Samples are rasterised into the canvas; should be stored as normalised positions and re-rasterised on resize.
- The constellation's "save the field" question. Currently ephemeral by design. A `canvas.toBlob()` save would betray the design. A `sessionStorage` persist would not. Should ask the user. ([[Open Questions]])
- A fragment-shader aurora. The Canvas-2D version is good. A WebGL version with a noise field would be transcendent. But shader source bloats the file, and a build step would betray the one-file constraint. Tabled.
- Touch story for the cursor companion that is its own primitive, not a graceful degradation.
