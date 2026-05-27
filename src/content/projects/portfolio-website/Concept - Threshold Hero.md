---
tags: [concept, primitive, hero]
---

# Concept — Threshold Hero

> The first room. Name, tagline, **personal photo (top-right, printed-on-the-page style)**, a tree-click hint sticker, and an interactive recursive tree behind everything.

> [!info] State as of 2026-05-23
> The portrait slot is no longer deferred — `IMG_6565` is integrated as a "printed photo" in the top-right. The fade-to-ink rectangular mask described in the original draft is **not** what shipped. See **"Current implementation (2026-05-23)"** below and [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3.10 CURRENT TREATMENT — "print" + tree clearing (rev4 + rev5)|spec §4.3.10]] / [[decisions/ADR-013-personal-photo-threshold-print|ADR-013]] for the decision narrative. The text under "Visual design" / "Fade-to-ink mask" / "Component shape" below is preserved as historical context for the original deferred design.

## What it is

The opening section of the site — also functions as the **"opener"** in the sense the user described it on 2026-05-17: a section at the top of the page that the reader scrolls down from, and that the reader scrolls back up to naturally. It is not a click-through intro or a play-once-and-dismiss video. It is a regular document-flow section that simply happens to be the first thing the reader sees.

Full viewport height. Three composed elements:

1. **Portrait slot** — optional `<img>` with a fade-to-ink mask. Empty by default; the user drops in a file later.
2. **Name + tagline** — typographic block, lowercase styling, the user's stated tagline (verbatim).
3. **Tree backdrop** — a low-opacity instance of [[Concept - Recursive Tree Backdrop|the recursive tree]] behind everything else.

Plus a small downward scroll cue and a skip-link for accessibility.

## Why

The threshold has to do two things at once: (a) be a real, immediate "this is Rafan" moment so the reader knows who's on the page, and (b) set the visual tone for the rest of the site (warm-dark room, restrained motion, words that have weight). The portrait carries the human signal; the tagline carries the substance; the tree carries the aesthetic-and-CS-identity signal.

## Visual design

```
┌──────────────────────────────────────────────────────────┐
│  [nav: top-left logotype · top-right anchor links]        │
│                                                            │
│                                                            │
│    rafan                                                  │
│    quader                                                 │
│                                                            │
│    Computer Science @ SJSU. Aspiring to participate in    │
│    meaningful applications of Computer Science, nudging   │
│    humanity (well, hopefully at least some of it)         │
│    forward!                                               │
│                                                            │
│                                                            │
│                                          ┌──────────┐     │
│                                          │ portrait │     │
│                                          │  (fades  │     │
│                                          │  to ink) │     │
│                                          └──────────┘     │
│                                                            │
│                                                            │
│                          ↓                                 │
└──────────────────────────────────────────────────────────┘
   (behind everything: low-opacity recursive tree at ~12%)
```

- **Name treatment:** `font-family: var(--face-serif)`, ~clamp(5rem, 12vw, 9rem) sized. Lowercase. Letter-spacing slightly tight (-0.02em). Each letter wrapped in `<span data-inertial>` so [[Concept - Inertial Headings|inertial typography]] applies.
- **Tagline:** body serif at ~clamp(1.05rem, 1.5vw, 1.25rem), 1.55 line height, max-width 38ch. Wrapped in normal `<p>`. No inertial physics on the tagline — the name has it, the tagline rests.
- **Portrait slot:** square or upper-body aspect, ~clamp(180px, 28vw, 320px) wide. Positioned bottom-right of the hero (not center), so the name dominates and the portrait is companion. Mask treatment: see "fade-to-ink mask" below.
- **Tree backdrop:** absolutely positioned, full hero width and height, `z-index: -1`, `opacity: 0.12`. Uses the `tree` primitive with the FOREST palette. Lowered amplitude on the sway so the motion is barely perceptible at this opacity. `aria-hidden="true"`.
- **Scroll cue:** a single down-arrow glyph at the bottom, low opacity, gently fading on its own simple keyframe. Disappears once the user has scrolled more than `100vh`.

## Fade-to-ink mask

The portrait image gets a `mask-image: linear-gradient(180deg, black 60%, transparent 100%)` so the bottom edge dissolves into the ink background. On the right edge a similar but smaller fade so the image doesn't have a hard vertical edge against the page.

```css
.portrait-slot img {
  width: 100%;
  height: auto;
  object-fit: cover;
  mask-image: radial-gradient(ellipse at 50% 35%, black 55%, transparent 95%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 35%, black 55%, transparent 95%);
}
```

A radial mask (versus pure linear) handles arbitrary portrait crops better. The exact mask is a small thing the user can tune visually when his photo is in place.

When no photo is present (default state), the slot renders **nothing** — no placeholder graphic, no silhouette. The hero is name + tagline + tree, end of story. This is a design choice: an empty placeholder is worse than no element.

## Component shape

```astro
---
// src/components/Threshold.astro
const portraitSrc: string | undefined =
  await import.meta.glob('/public/images/portrait.*')
    .then(g => Object.keys(g)[0]); // pick whichever extension is present
const tagline = "Computer Science @ SJSU. Aspiring to participate in " +
  "meaningful applications of Computer Science, nudging humanity " +
  "(well, hopefully at least some of it) forward!";
---
<section class="threshold" aria-label="introduction">
  <canvas id="tree-threshold" aria-hidden="true"></canvas>
  <div class="threshold-content">
    <h1 class="name">
      <span data-inertial>r</span><span data-inertial>a</span>... <!-- per-letter -->
    </h1>
    <p class="tagline">{tagline}</p>
    {portraitSrc && (
      <div class="portrait-slot">
        <img src={portraitSrc} alt="Rafan Quader" />
      </div>
    )}
  </div>
  <a class="scroll-cue" href="#on-me" aria-label="scroll to content">↓</a>
</section>
<script>
  import { mountTree } from '~/lib/backdrop/tree.ts';
  mountTree(document.querySelector('#tree-threshold')!, {
    palette: 'forest',
    opacity: 0.12,
    swayScale: 0.6,
  });
</script>
```

(Sketch, not final code. The `import.meta.glob` for portrait files lets us drop any extension; that's a tooling detail to verify against the current Astro version during build.)

## Accessibility

- `<h1>` carries the name (not the tagline). One `<h1>` per page.
- The tree canvas is `aria-hidden="true"`. Carries no information.
- Portrait `<img>` has a meaningful `alt`. When no image, no element renders.
- Skip-link from the top of `<body>` to `#on-me` (the next section). Visible on focus only.
- Reduced motion: tree becomes static (no sway), inertial letters become static. See [[02 - Architecture#prefers-reduced-motion]].

## Mobile

- Portrait slot moves above the name (or hides entirely; user choice).
- Tagline max-width relaxes.
- Tree backdrop continues at the same opacity. It's lightweight enough.

## Open questions

- Hover-on-name effect — should the inertial physics be the only motion, or also a subtle scale-shift on hover? Default: no, just inertial.
- Should the tagline also have a per-word fade-in animation on first paint? Default: no (would feel performative).
- See also [[Open Questions#portrait photo]] for the deferred photo decision.

## Current implementation (2026-05-23)

The threshold is now a four-element composition (instead of the original three):

1. **Tree backdrop** — full-bleed canvas, click-to-open into tree-mode, low rest-opacity, brightens on threshold-hover.
2. **Name + tagline** — typographic block on the left.
3. **Personal photo (`IMG_6565`)** — top-right, "print" treatment.
4. **Tree-hint sticker** — a small "↘ click the tree" pill that fades in briefly on first load and dismisses on tree open, anchor click, hover, scroll, or after a `~6s` timeout. Persisted dismissal via `localStorage` (`rq-tree-hint-seen=1`).

### Personal photo (CURRENT)

> Source: `~/Desktop/portfolio_website_photos/IMG_6565.jpg` → `public/images/rafan-speaking-1.jpg`. The user speaking at a podium, gesturing with one hand, mic in front. Color palette: dark stage backdrop, blue shirt, warm-skin tones.

- **Treatment:** `print` (the `Photo` primitive's third treatment, joining `frame` and `plain`).
- **Form:** full-frame rectangle, no crop, no mask. Rounded corners (`6px`). Hairline accent-tinted ring + soft drop shadow. Photo's own pixels are unchanged at rest (`filter: none`).
- **Hover:** brightness-only lift (`brightness(1.06)` light, `brightness(1.1)` dark) + a `-2px` translateY. No saturation/hue shift — keeps the photo honest.
- **Lightbox:** click opens the original image at full size against a near-black scrim; close via X button, Escape, or backdrop click. The lightbox surface is its own component (`#photo-lightbox`) wired by [[02 - Architecture|photo-lightbox primitive]].
- **Sizing + placement:** wide viewport top-right, `clamp(168px, 18vw, 224px)` wide; mobile collapses to relative position below the tagline.

### Tree clearing (CURRENT)

The threshold canvas wears a CSS radial mask that fades tree opacity to transparent inside an ellipse centered on the photo. Branches gracefully thin out as they approach the photo's footprint — the tree visibly "respects" the photo's space instead of being amputated by its rectangular edge.

```css
.threshold-tree {
  --tree-photo-clearing: radial-gradient(
    ellipse 19% 19% at 88% 22%,
    transparent 0%,
    transparent 38%,
    rgba(0, 0, 0, 0.55) 62%,
    rgba(0, 0, 0, 0.92) 82%,
    black 100%
  );
  mask-image: var(--tree-photo-clearing);
}
```

The clearing is dropped when tree-mode is on (photo is hidden, tree should be edge-to-edge) and on viewports `< 640px` (photo is no longer floating in the upper-right).

### Hover isolation

The threshold's "tree brightens on hover" effect is gated to *not* fire when the pointer is on the photo:

```css
.threshold:hover:not(:has(.threshold-photo:hover)) .threshold-tree {
  opacity: 0.85;
}
```

This prevents the tree and photo from "fighting" for the hover state — the photo gets its own brightness lift cleanly, and the rest of the threshold still keeps its tree-residue-brightens behavior.

### Tree-hint sticker (CURRENT)

A small button (`.tree-hint`) positioned in the lower-right of the threshold, hidden until ~`900ms` after page load, then fades in with a gentle slide. Dismissal triggers: click (opens tree-mode), hover-into the sticker, scroll past `20px`, after `~6s` visible, or page navigation. Dismissed-once state lives in `localStorage` (`rq-tree-hint-seen=1`); cleared per-session for design iteration via DevTools.

See [[02 - Architecture|tree-hint primitive]] for the timing FSM and HMR-safe `activeHandle` pattern.

## See also

- [[Concept - Inertial Headings]]
- [[Concept - Recursive Tree Backdrop]]
- [[03 - Content Model#threshold]]
- [[specs/2026-05-22-gallery-v2-photo-sticker-design]] (rev4 + rev5 — current photo + clearing spec)
- [[decisions/ADR-013-personal-photo-threshold-print]] (the four-iteration decision narrative)
