---
tags: [architecture, technical]
---

# 02 — architecture

## the single-file constraint

The whole artefact is one HTML file. No build step, no fonts to fetch, no images, no network. This was a hard constraint, and most of the small technical decisions follow from it:

- Typography uses system fonts (`New York` and `SF Mono` on Mac; serviceable fallbacks elsewhere).
- Film grain is an inline SVG noise filter (`feTurbulence`) as a data URI.
- The favicon is an inline SVG data URI.
- All canvases are sized to the viewport and rendered in JS.
- No frameworks. Vanilla DOM, vanilla Web Audio, vanilla canvas 2D.

Total weight: ~75 KB. It weighs less than a photograph.

## file shape

```
<!doctype html>
<html lang="en">
<head>
  <meta>... · title · favicon (inline svg) ·
  <style>
    /* tokens (palette, per-tab overrides, layout, type) */
    /* shared overlays (phosphor, grain, margin, companion) */
    /* nav */
    /* tab system */
    /* per-tab visual language */
    /* reduced motion + responsive */
  </style>
</head>
<body data-tab="manifesto">
  <nav class="tabnav">...</nav>
  <canvas id="phosphor"></canvas>
  <div class="grain"></div>
  <aside id="margin">...</aside>
  <div id="companion">...</div>
  <canvas id="aurora-canvas"></canvas>
  <canvas id="constellation-canvas"></canvas>

  <section class="tab" id="tab-manifesto">…the essay…</section>
  <section class="tab" id="tab-resonance">…visualiser stage…</section>
  <section class="tab" id="tab-synesthesia">…colour passage…</section>
  <section class="tab" id="tab-constellation">…attention passage…</section>

  <script>… eight primitives + boot …</script>
</body>
</html>
```

## the tab system

Four tabs share a single `document` and a single rAF loop. The active tab is `body[data-tab]`, which is both the CSS root for per-tab styling and the JS-side state.

Switching tabs:
- updates `body[data-tab]`
- toggles `.active` on `.tab` containers
- resets `window.scrollTo(0, 0)`
- calls a per-tab `prepare<Tab>()` if it hasn't been called yet (lazy init)

Tab buttons use `aria-pressed` for accessibility plus keyboard shortcuts (1, 2, 3, 4). Tabs are visible *only* one at a time; the inactive ones are `display: none`, so their inertial letters etc. are gated out by `offsetParent === null` checks in tick.

## the single rAF loop

There is exactly one `requestAnimationFrame` callback. It dispatches into the eight primitives:

```js
function frame(t) {
  const dt = Math.min((t - lastT) / 1000, 0.05);
  lastT = t;
  if (!reduceMotion) {
    inertialTick(dt);      // shared
    phosphorTick(dt);      // shared
    marginTick(dt);        // manifesto only — gated inside
    companionTick(dt);     // shared
    wordInertialTick(dt);  // synesthesia only — gated inside
    auroraTick(t);         // resonance only — gated inside
    constellationTick(t);  // constellation only — gated inside
  }
  tideTick(t);             // manifesto only — gated inside
  updateAudioFromScroll(); // shared (no-op without audio)
  requestAnimationFrame(frame);
}
```

Each tick's first action is the gate. Inactive primitives cost a single conditional. Total frame budget on idle: under 2ms on M-series silicon.

## shared vs scoped primitives

**shared (always running):**

- inertial typography — letters in every heading, in every tab
- phosphor touch — canvas overlay, always visible (per-tab colour)
- reading tide — writes one CSS var
- cursor companion — animates a fixed element by transform (per-tab colour)
- audio drone — persistent once started, follows the user across tabs

**tab-scoped (gate at the top of tick):**

- mnemonic margin — manifesto
- aurora visualiser — resonance
- word inertial physics — synesthesia
- constellation logic — constellation

## audio graph

```
                       ┌── filter ──┐
voices (3 oscillators)─┤             ├── analyser ── master ── destination
                       └── reverb ──┘
```

- **voices** — three oscillators at G2 × {1, 1.5, 1.875}, each with a slow LFO on detune
- **filter** — biquad lowpass, cutoff modulated by scroll velocity (320–1800 Hz)
- **reverb** — small synthetic convolver from a 2.6s random IR
- **analyser** — FFT size 256, exposed to the aurora visualiser as three frequency bands
- **master** — single gain stage, ramped over 4.5s on start and 1.8s on stop

Pings (`em[data-ping]`, aurora clicks, constellation ignitions) are routed into the filter directly so they share the filter's modulation.

## canvas layout

Each canvas is sized in CSS pixels but backed by DPR-scaled bitmaps. All sizing routines call a shared `sizeCanvas()` helper that does `setTransform(dpr, 0, 0, dpr, 0, 0)` after resize.

The canvases stack in z-index order:

| z   | layer | mode |
|-----|------|------|
| 0   | aurora, constellation (mutually exclusive) | source-over |
| 40  | margin | source-over |
| 50  | phosphor | mix-blend-mode: screen |
| 60  | grain (SVG noise via CSS) | mix-blend-mode: overlay |
| 100 | companion | normal |
| 200 | tabnav | normal, backdrop-blur |

The phosphor canvas uses `screen` blending so it tints whatever's below, regardless of the room's palette. The grain canvas uses `overlay` for the same reason.

## scroll sampling

A single `scroll` listener (passive) records `{ scrollFraction, velocity, time }` to a ring buffer of 900 samples. Three primitives consume the buffer:

- [[Concept - Mnemonic Margin]] (renders the thread)
- [[Concept - Resonant Field]] (modulates the filter cutoff from the last two samples)
- anything else that wants velocity (read-only)

## per-tab colour system

The palette is rooted at four custom properties: `--accent` and `--companion-color` (which also implicitly drives the phosphor trail via JS).

Per-tab overrides at the root:

```css
body[data-tab="resonance"]     { --accent: #6edcc8; --companion-color: #6edcc8; }
body[data-tab="synesthesia"]   { --accent: #d28ad6; --companion-color: #d28ad6; }
body[data-tab="constellation"] { --accent: #cfe2ff; --companion-color: #cfe2ff; }
```

The phosphor's stamp colour is read in JS from the current tab; the cursor companion's colour is just `var(--companion-color)`; the tab buttons each carry their own `--dot` value (synesthesia uses a conic-gradient rainbow dot).

## prefers-reduced-motion

Honoured at three levels:

1. **CSS:** every animation and transition duration collapsed to ~0ms.
2. **JS:** the rAF loop becomes a noop for the eight motion primitives, leaving only the tide CSS variable (it's a static 0) and the audio modulation (which is also a noop without audio).
3. **Tab entrance:** the `tab-in` keyframe animation is disabled.

The audio drone is *not* disabled by reduced motion — that's a motion preference, not a sound one. If the user wants silence, the audio toggle remains.

## boot order

```
DOMContentLoaded → init():
  resize all canvases
  $$('[data-inertial]').forEach(registerInertial)
  setupInertialDrag
  scroll, resize listeners
  tab nav listeners + key shortcuts
  resonance/bloom button listeners
  aurora click listener
  em[data-ping] listeners
  IntersectionObserver for manifesto sections
  toggle listeners (phosphor / tide / audio / companion / margin)
  start rAF
```

The synesthesia and constellation tabs lazy-init when first visited (`prepareSynesthesia()`, `prepareConstellation()`). The aurora canvas is sized at boot but only drawn into when its tab is active.

## perf budget

Targets:
- 60 FPS minimum on a base M1 MacBook Air
- 120 FPS on M-series displays where available

Verified empirically by manual scrolling through each tab with all primitives active. The hottest tab is resonance (aurora + audio + analyser + phosphor) and it stayed under 4ms per frame on the test machine.

Things that would degrade perf:
- more letters with inertial physics (currently ~60 across all headings)
- more samples in the margin ring buffer (capped at 900)
- larger FFT for the analyser (kept at 256)
- WebGL — deliberately avoided; a fragment shader for the aurora would have been richer but added shader source and complexity

## what i would change with more time

- the margin's persistence under window resize — see [[Open Questions]]
- a keyboard-reachable version of the inertial drag
- a touch story for the cursor companion that is its own primitive, not a graceful degradation
- a fragment-shader aurora (more visual range, but breaks the one-file no-network constraint without a build step)
