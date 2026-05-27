---
tags: [concept, primitive, audio, shared]
---

# resonant field

> silence is the default; sound is consent.

## what it does

A gentle, slow drone built on three detuned oscillators sustained beneath everything else on the page. Voices are at G2 (98 Hz) at ratios 1, 1.5, 1.875 — root, fifth, and the ninth-an-octave-down — passed through a lowpass filter and a small synthetic convolution reverb. Each voice has a slow LFO on its detune (~0.07–0.20 Hz) so the three voices phase against each other indefinitely.

The drone never starts uninvited. Three places will start it (and re-stop it):
- the "press to listen" button in the manifesto's fourth section
- the "press to bloom" button in the resonance tab
- the `audio` toggle in the coda

Once started, the drone persists across tab changes. Switching rooms doesn't silence it.

Two modulations:
- **scroll velocity opens the filter.** Cutoff is 320 Hz at rest, rising to ~1.8 kHz on fast scrolling.
- **hover over `<em data-ping>` words plays soft pings.** Same in any tab. Clicking the aurora canvas plays a pentatonic ping pitched by Y position.

An `AnalyserNode` (FFT size 256) is in the chain, exposing three frequency bands the [[Concept - Aurora Visualiser|visualiser]] consumes.

## why

The page wants to acknowledge that you're inside a body, in a room, and that rooms have an acoustic. The drone is the shape of the room while you are in it. There is no song, no rhythm, no resolution. There is no reason to listen for anything specific — and that is what makes it a *room* and not a *track*.

The principle "silence is the default; sound is consent" is the most important rule on the site. It is the reason the audio button is the only thing on the page that asks anything of you.

## implementation

Audio graph:

```
  voices (3) ──┬── filter ──┐
               │            ├── analyser ── master ── destination
               └── reverb ──┘
```

Three voices, each with:
- a gain stage (root louder; others quieter)
- a slow LFO modulating its detune ±5–9 cents at ~0.07–0.20 Hz

Reverb: a 2.6-second exponentially-decayed white-noise impulse response built at start time. Mono summed via a wet gain at 0.55.

Pings (`em[data-ping]`, aurora clicks): short sine envelopes routed into the same filter, so the drone's cutoff affects them too. Envelope: attack 40ms, exponential release 1.2s.

## pitfalls

- **autoplay policies.** Safari requires a user gesture before `AudioContext` can produce sound. Three gates (button, bloom, toggle) all serve as the gesture. None auto-resume on tab visibility.
- **dual button state.** The three control points must all reflect the same state. `syncAudioUI(on)` centralises this, updating all three on every start/stop.
- **stop is asynchronous.** Calling `osc.stop()` immediately after `master.gain → 0` causes a click. I ramp master gain to 0 over 1.8s, then call `stop()` 1.95s later via `setTimeout`. Inelegant but quiet.

## priors

- **Brian Eno** — *Ambient 1: Music for Airports*. The "slow phasing, no rhythm, no resolution" lineage.
- **noisehack.com — *Build a Music Visualizer with the Web Audio API* (2013)** — the AnalyserNode + band-summing pattern I use is directly from this article.
- **Web Audio API community** — slow LFOs on detune for phasing is folk knowledge.

## related

- [[Concept - Aurora Visualiser]] — consumes the analyser's three frequency bands
- [[Concept - Reading Tide]] — both treat the page as a room with a rhythm
- [[02 - Architecture]] — the audio graph diagram lives here too
