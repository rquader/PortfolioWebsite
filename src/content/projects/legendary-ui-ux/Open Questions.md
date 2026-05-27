---
tags: [unresolved, doubts]
---

# open questions

Things I am still unsure about. These are real, not rhetorical.

## design

**Am I mistaking restraint for taste?** The manifesto's palette is four colours; the typography is two faces; nothing flashes. I told myself this was a virtue. It is also the easiest way to look "intentional" without being. The question I can't answer for myself is whether the site is *quiet because that's right* or *quiet because I was afraid to be loud*. The new rooms are colourful — the synesthesia tab in particular — which goes some way toward the answer. But I'll know in a month.

**Is the [[Concept - Phosphor Touch|phosphor trail]] flattering or annoying over a long session?** The first thirty seconds it is delightful. After ten minutes I don't know. There's a toggle in the coda; the real test is whether anyone uses it.

**Is the [[Concept - Reading Tide|tide]] subliminal or distracting?** At 0.041 Hz it's one cycle per twenty-four seconds, with ±0.18% scale amplitude. Inside the lab it feels like nothing-and-then-something. Outside, no idea.

**Does the [[Concept - Aurora Visualiser|aurora]] need a horizon?** I considered drawing a faint horizon line at the bottom third (the way real auroras have one). I cut it because it implied the room had an *orientation* — a floor and a ceiling — which the drone doesn't. But sometimes I miss it.

## interaction

**Touch.** The [[Concept - Cursor Companion|companion]] doesn't translate to fingers. On touch I fall back to letting inertial type respond to taps instead of hovers, and I hide the companion entirely. I don't love this. Touch deserves its own primitives, not graceful degradations of mine.

**Aurora click on touch.** A tap on the aurora canvas does play a ping, which works on touch. But there's no continuous-hold idiom — the aurora can only accept discrete notes. A drag-to-sustain primitive would be a nice extension.

**Keyboard.** Tab-order through the site works, but the *expressive* primitives (drag a letter, hover a glow trail, dwell on a word) aren't keyboard-reachable. I don't yet know what the keyboard equivalent of "fling a letter" or "dwell-ignite a star" should feel like. The `Escape → manifesto` shortcut and the `1 2 3 4` number keys help, but they're navigation, not interaction.

**Screen readers.** The prose is the prose; the demonstrations are decoration. Screen readers get the prose. That's defensible but it's also half a thought. Is there a version where the audio drone in [[Concept - Resonant Field|resonance]] is *itself* a non-visual access mode rather than an extra?

## technical

**The [[Concept - Mnemonic Margin|margin]] under aggressive resize.** Samples are rasterised into the canvas, not stored as normalised geometry. Resize the window mid-session and the historical thread doesn't reproject onto the new gutter. Listed in this file for two passes now. Not fixed. (For comparison: [[Concept - Constellation of Attention|the constellation]] *does* survive resize, because its stars are stored in doc-space y. The margin should be re-implemented similarly.)

**Audio across tabs.** The drone follows you from manifesto to resonance to constellation. Is that presumptuous? You consented to sound on the manifesto, then went to a tab whose purpose is silent reading, and the drone is still there. It is *the same room sound*, but it might not feel that way. There is a toggle.

**The constellation's "save the field" question.** Currently ephemeral by design — the constellation lives only as long as the tab does. The case for saving:
1. A reader might want to revisit their constellation tomorrow.
2. `sessionStorage` persists across reloads without sharing.
3. The constellation is *theirs*; we are throwing away their work.

The case against:
1. A small intimate gesture turned into a *thing one performs* loses its intimacy.
2. The ephemerality is the meaning. Saving is the small betrayal.
3. The reader who wants to keep something can screenshot.

I am leaning toward keeping it ephemeral but I am not certain.

## attribution

**Did I do enough to credit [[Sources & Inspirations|pretext]] in the synesthesia tab?** I mention it in the aside; I document it in the architecture and the concept note. But the word-physics in synesthesia is implemented from scratch, not imported. Cheng Lou's library is doing much more sophisticated work (multi-script text layout, variable-width flow, rich-inline). My nod is small. If I were shipping for a wider audience I would expand the credit and link the repo more visibly.

**The aurora visual** is a folk pattern. The conceptual debt is to countless WebGL aurora shaders. Naming all of them is impossible; naming none feels light. I named the techniques I used (`AnalyserNode + canvas` à la noisehack, Audio Shader Studio's organisation) and let the visual idiom go un-attributed. Acceptable, but a quiet compromise.

## ethical / aesthetic

**Is the new *on making* disclosure enough?** Pass 4 added a manifesto section and a footer line stating the AI experiment. The demonstrations still read as authored objects. Some visitors will want provenance earlier (threshold? meta description?); others will find the · section too on-the-nose. I don't know the right balance yet.

**Is the manifesto register earned or affected?** The site speaks in a low intimate voice. I wrote that voice because it felt right but it is also a stylistic move with a long history of being deployed pretentiously. I tried to balance the register by being technical and specific elsewhere (the [[02 - Architecture|architecture]] note is dry on purpose; the per-primitive notes have constants and pitfalls).

**Should the site track you, even just locally?** The margin is a record of your scroll. The constellation is a record of your dwell. Both live in memory only — I did not write either to `localStorage`. Should I? A memory you can come back to in a week is a different gift from a memory that ends with the tab. I'm leaning ephemeral, but I'm not certain.

**The seventh manifesto primitive I didn't ship** (see [[Cut Concepts]] — *negative cursor*). I cut it for time and coherence. But every time I re-read the philosophy note I feel its absence. It might be the most beautiful idea I had this session. It deserves its own page eventually.

## about the passes themselves

**Was the rush to four rooms a good idea?** The original six primitives were a tight set; the three new rooms expanded the surface area significantly and the budget didn't change. Pass two ran fast. There are details (synesthesia heading bg-clip bug, hash-routing timing) that I caught only because I screenshotted. Other details, presumably, I did not catch.

**Did I document with the right specificity?** Each concept note has *implementation* and *pitfalls* sections. They're useful to me and would be useful to someone re-building. They are too dry to be entry-points; the [[01 - Philosophy|philosophy]] note is the entry-point. The vault as a whole favours depth over invitation. I'm OK with that, but it is a choice.
