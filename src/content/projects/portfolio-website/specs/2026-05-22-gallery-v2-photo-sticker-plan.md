# Gallery v2 + Personal Photo + Tree Click-Hint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement [[specs/2026-05-22-gallery-v2-photo-sticker-design]] (rev2) end-to-end: the tree click-hint sticker on the threshold, the personal photo placed top-right of the threshold with feathered + sepia treatment + lightbox, and the projects page (new `/projects` route) with vertical chapter spreads + native notes accordion replacing the manila gallery.

**Architecture:** Three interlocking changes — (1) a small first-load sticker primitive that doubles as a `[data-tree-open]` button; (2) a reusable `<Photo>` primitive with a `feathered` treatment (radial mask + warm sepia overlay) + a global lightbox; (3) a new `src/pages/projects.astro` route, a `src/components/project/` directory (ProjectChapter / ProjectMedia / ProjectNotes), and a TopNav that distinguishes route-active from anchor-active. All FolderShelf / FolderCard / FolderReader / manila-folder.css / folder-reader.ts / OnTheArtifacts.astro are deleted outright.

**Tech Stack:** Astro 5.x, TypeScript strict, hand-written CSS. No new runtime dependencies. Photo ships as a single JPG via `<picture>` for now (multi-format AVIF/WebP optimization is a follow-up if perf demands).

**Verification policy.** Every code task ends in a verify step that runs `npm run check`, `npm run build`, and (where the change is HTML-visible) a curl + grep against the dev server. Visual fidelity needs the human eye and is enumerated in spec §7; the plan flags it where applicable.

**No git commits.** User explicitly retained commit authority. Tasks DO NOT run `git add` or `git commit`. The user reviews and commits when ready.

---

## Plan-level acceptance

- `npm run check` clean (0 errors / 0 warnings / 0 hints across all .astro/.ts files).
- `npm run build` produces a clean build, both `/` and `/projects` in the sitemap, total client JS budget ≤ 30 KB gz.
- Dev server `GET /` returns HTML containing:
  - `<canvas id="page-leaves">` (unchanged page-wide backdrop)
  - `<canvas id="tree-threshold">` (unchanged threshold backdrop)
  - the new tree-hint sticker `<button class="tree-hint" data-tree-open>`
  - the threshold personal photo (`<picture>` element with `class="photo"`)
  - no `<section class="on-the-artifacts">`
  - no `<div id="reading-overlay">`
- Dev server `GET /projects` returns HTML containing:
  - the chapter rule(s) for each project in `projects` collection
  - top + bottom framing prose placeholders
  - for the sample project: `<details>` block(s) for `field/` (open by default) and `decisions/` (closed by default), each containing the project's notes
- Spec §8 doc updates are present in the Obsidian vault:
  - ADR-012 (gallery v2), ADR-013 (personal photo threshold), ADR-014 (tree click-hint sticker)
  - `Concept - Projects Page.md` exists, `Concept - Manila Folder Gallery.md` is deleted
  - `Concept - Threshold Hero.md` updated for the personal-photo placement
  - `02 - Architecture.md` reflects new + removed files
  - `03 - Content Model.md` removes `on the artifacts` and adds `/projects`
  - `00 - Index.md` file inventory matches reality
  - `Open Questions.md` updated (manila resolved, portrait resolved, IMG_6566 dropped)
  - `Process Journal.md` has an end-of-implementation entry

---

## Task 1 — Add personal photo asset

**Goal:** Copy IMG_6565 from Desktop into `public/images/rafan-speaking-1.jpg` so it can be referenced by the site.

**Files:**
- Source: `<local-photo-source>/portrait.jpg`
- Create: `~/Developer/Portfolio_Website/public/images/rafan-speaking-1.jpg`

**Acceptance Criteria:**
- [ ] File exists at `public/images/rafan-speaking-1.jpg`, size matches the source (~189 KB).
- [ ] The original source file at `~/Desktop/...` is unchanged.

**Verify:**
```bash
ls -la ~/Developer/Portfolio_Website/public/images/rafan-speaking-1.jpg "<local-photo-source>/portrait.jpg"
```
→ expected: both present; sizes equal.

**Steps:**

- [ ] **Step 1: Copy the file**

```bash
cp "<local-photo-source>/portrait.jpg" \
   "~/Developer/Portfolio_Website/public/images/rafan-speaking-1.jpg"
```

- [ ] **Step 2: Verify presence + size**

```bash
ls -la ~/Developer/Portfolio_Website/public/images/rafan-speaking-1.jpg
```
Expected: file present, size around 189 KB.

> **Note on multi-format optimization.** Spec §4.3.6 originally specified AVIF/WebP/JPG at 3 widths. Deferred for V1 to avoid pulling in a build-time image processor. Single JPG is acceptable for V1; revisit if Lighthouse perf budget pushes back. Tracked in [[Open Questions]] post-implementation.

---

## Task 2 — Photo primitive + lightbox

**Goal:** Build the reusable `<Photo>` Astro component (feathered / frame / plain treatments) and a small lightbox primitive (open/close, Esc, focus-trap-via-inert, reduced-motion). Wire `initPhotoLightbox()` into `site-init.ts`.

**Files:**
- Create: `src/components/photo/Photo.astro`
- Create: `src/lib/primitives/photo-lightbox.ts`
- Create: `src/styles/photo.css`
- Modify: `src/lib/site-init.ts` (add `initPhotoLightbox()` import + call)
- Modify: `src/layouts/Base.astro` (import `photo.css`)

**Acceptance Criteria:**
- [ ] `<Photo src="/images/foo.jpg" alt="…" treatment="feathered" lightbox />` renders a `<figure class="photo feathered">` with a `<picture>` + `<img>` + optional `<figcaption>`.
- [ ] When `lightbox={true}` (default), clicking the `<img>` opens a fixed overlay with the image at original size and original colors (no sepia grade, no feather), with × button + Esc + backdrop-click close.
- [ ] Focus is moved to the close button on open, and restored to the trigger on close.
- [ ] `prefers-reduced-motion: reduce` disables all transitions on the photo and the lightbox.
- [ ] `treatment="feathered"` applies the radial mask + sepia overlay. `treatment="frame"` shows a thin sepia paper frame with no mask. `treatment="plain"` is unstyled (no mask, no frame, no overlay).

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8
```
Expected: 0 errors.

**Steps:**

- [ ] **Step 1: Create `src/components/photo/Photo.astro`**

```astro
---
/**
 * Photo — reusable photograph primitive.
 *
 * Renders a <picture> with a single JPG source (multi-format optimization
 * is a follow-up). The `treatment` prop chooses the visual envelope:
 *   - 'feathered' (default for personal photos): radial mask + warm sepia
 *      overlay; hover removes the grade.
 *   - 'frame': sepia paper frame, no mask. Formal use (project covers).
 *   - 'plain': no frame, no mask. Use when callers want full control.
 *
 * `lightbox` toggles the click-to-enlarge behavior; the actual overlay
 * markup lives in Base.astro (page-global) and is driven by JS.
 *
 * Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3]].
 */

interface Props {
  src: string;            // absolute path under /public, e.g. '/images/foo.jpg'
  alt: string;            // required
  caption?: string;       // optional figcaption
  treatment?: 'feathered' | 'frame' | 'plain';
  aspect?: string;        // e.g. '4 / 5'; default 'auto'
  lightbox?: boolean;     // default true
}

const {
  src,
  alt,
  caption,
  treatment = 'feathered',
  aspect = 'auto',
  lightbox = true,
} = Astro.props;
---
<figure class={`photo ${treatment}`} style={`--photo-aspect: ${aspect};`}>
  <picture>
    <source srcset={src} type="image/jpeg" />
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      class="photo-img"
      data-lightbox-trigger={lightbox ? src : undefined}
      data-lightbox-alt={lightbox ? alt : undefined}
    />
  </picture>
  {caption && <figcaption class="photo-caption">{caption}</figcaption>}
</figure>
```

- [ ] **Step 2: Create `src/styles/photo.css`**

```css
/* photo.css — reusable photo primitive + lightbox.
   Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3]]. */

/* === Base figure === */
.photo {
  margin: 0;
  display: block;
  aspect-ratio: var(--photo-aspect, auto);
}
.photo-img {
  width: 100%;
  height: auto;
  display: block;
  cursor: zoom-in;
}

/* === Feathered treatment: radial mask + warm sepia overlay === */
.photo.feathered .photo-img {
  -webkit-mask-image: radial-gradient(
    ellipse at 50% 45%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 1) 70%,
    rgba(0, 0, 0, 0) 92%
  );
          mask-image: radial-gradient(
    ellipse at 50% 45%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 1) 70%,
    rgba(0, 0, 0, 0) 92%
  );
  filter: sepia(0.12) saturate(0.88) brightness(0.94);
  transition: filter 0.4s ease;
}
.photo.feathered .photo-img:hover {
  filter: sepia(0) saturate(1) brightness(1);
}
/* Dark mode: more sepia, less saturation to fit the deep walnut bg. */
[data-theme="dark"] .photo.feathered .photo-img {
  filter: sepia(0.18) saturate(0.78) brightness(0.86);
}
[data-theme="dark"] .photo.feathered .photo-img:hover {
  filter: sepia(0) saturate(1) brightness(1);
}

/* === Frame treatment: sepia paper frame, no mask === */
.photo.frame {
  padding: 6px;
  background: var(--bg-1);
  box-shadow: 0 12px 32px -16px rgba(58, 38, 21, 0.4);
}

/* === Plain: unstyled === */

/* === Caption (all treatments) === */
.photo-caption {
  font-family: var(--face-text);
  font-style: italic;
  font-size: var(--type-small);
  color: var(--text-1);
  margin-top: 0.6rem;
  text-align: center;
  line-height: 1.4;
}

/* === Lightbox overlay (page-global) === */
.photo-lightbox {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: none;
  background: color-mix(in srgb, var(--bg-0) 12%, var(--text-0) 88%);
  /* On dark mode the backdrop already reads as ink; keep at 92% opacity. */
  opacity: 0;
  transition: opacity 0.2s ease;
  align-items: center;
  justify-content: center;
  padding: 5vw;
}
.photo-lightbox[data-state="open"] {
  display: flex;
  opacity: 1;
}
.photo-lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 2px;
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.6);
  /* Lightbox image is the photo "as taken" — no sepia, no feather. */
  filter: none;
  -webkit-mask-image: none;
          mask-image: none;
}
.photo-lightbox-close {
  position: absolute;
  top: clamp(1rem, 3vh, 2rem);
  right: clamp(1rem, 3vw, 2rem);
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  background: rgba(245, 234, 212, 0.9);
  border: none;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--text-0);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  z-index: 91;
}
.photo-lightbox-close:hover,
.photo-lightbox-close:focus-visible {
  outline: none;
  transform: scale(1.06);
}

@media (prefers-reduced-motion: reduce) {
  .photo.feathered .photo-img,
  .photo.feathered .photo-img:hover,
  .photo-lightbox {
    transition: none;
  }
}
```

- [ ] **Step 3: Create `src/lib/primitives/photo-lightbox.ts`**

```ts
/**
 * @file photo-lightbox.ts
 *
 * Click-to-enlarge for any `<img data-lightbox-trigger="<src>">` on the page.
 * Single page-global overlay (in Base.astro); JS swaps src + alt and toggles
 * the `data-state` attribute.
 *
 * Focus management: focus the close button on open; restore previous focus on
 * close. Esc + backdrop-click + × close.
 *
 * Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3.3]].
 */

export interface PhotoLightboxHandle {
  stop(): void;
}

export function initPhotoLightbox(): PhotoLightboxHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const overlay = document.getElementById('photo-lightbox');
  if (!(overlay instanceof HTMLElement)) return { stop: () => {} };

  const img = overlay.querySelector<HTMLImageElement>('.photo-lightbox-image');
  const closeBtn = overlay.querySelector<HTMLButtonElement>('.photo-lightbox-close');
  if (!img || !closeBtn) return { stop: () => {} };

  let lastFocus: HTMLElement | null = null;

  function open(src: string, alt: string): void {
    if (!img || !overlay) return;
    lastFocus = (document.activeElement as HTMLElement | null) ?? null;
    img.src = src;
    img.alt = alt;
    overlay.dataset.state = 'open';
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtn?.focus());
  }

  function close(): void {
    if (!overlay) return;
    overlay.dataset.state = 'closed';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  const triggers = document.querySelectorAll<HTMLImageElement>('img[data-lightbox-trigger]');
  const onTriggerClick = (e: Event) => {
    const t = e.currentTarget as HTMLImageElement;
    const src = t.dataset.lightboxTrigger;
    const alt = t.dataset.lightboxAlt ?? '';
    if (!src) return;
    e.preventDefault();
    open(src, alt);
  };
  for (const t of triggers) t.addEventListener('click', onTriggerClick);

  const onOverlayClick = (e: Event) => {
    const target = e.target as HTMLElement;
    // Close on backdrop (the overlay itself) or × button.
    if (target === overlay || target.closest('.photo-lightbox-close')) {
      e.preventDefault();
      close();
    }
  };
  overlay.addEventListener('click', onOverlayClick);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && overlay?.dataset.state === 'open') {
      e.preventDefault();
      close();
    }
  };
  window.addEventListener('keydown', onKey);

  return {
    stop() {
      for (const t of triggers) t.removeEventListener('click', onTriggerClick);
      overlay.removeEventListener('click', onOverlayClick);
      window.removeEventListener('keydown', onKey);
      close();
    },
  };
}
```

- [ ] **Step 4: Add the lightbox markup to `src/layouts/Base.astro`**

Insert directly after the `<slot />` line and before the `<script>` tag:

```astro
{/* Page-global photo lightbox. JS in src/lib/primitives/photo-lightbox.ts
    drives it; any <img data-lightbox-trigger="<src>"> on the page can open it.
    Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3.3]]. */}
<div
  id="photo-lightbox"
  class="photo-lightbox"
  data-state="closed"
  aria-hidden="true"
  role="dialog"
  aria-modal="true"
  aria-label="enlarged photograph"
>
  <button class="photo-lightbox-close" type="button" aria-label="close">×</button>
  <img class="photo-lightbox-image" src="" alt="" />
</div>
```

- [ ] **Step 5: Add `import '../styles/photo.css';` to `src/layouts/Base.astro`**

Add it to the import block at the top, after `obsidian-notes.css`:

```ts
import '../styles/photo.css';
```

- [ ] **Step 6: Wire `initPhotoLightbox` into `src/lib/site-init.ts`**

Add the import:

```ts
import { initPhotoLightbox } from './primitives/photo-lightbox';
```

And the call (after `initObsidianBolds()`):

```ts
initPhotoLightbox();
```

- [ ] **Step 7: Verify**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8
```

Expected: `0 errors found.`

```bash
cd ~/Developer/Portfolio_Website && npm run build 2>&1 | tail -8
```

Expected: build succeeds; sitemap shows existing routes only (no /projects yet).

---

## Task 3 — Threshold integration (replace portrait-slot with personal photo)

**Goal:** Place the personal photo in the threshold's top-right via the `<Photo>` primitive. Remove the existing auto-discover portrait-slot logic. Update `threshold.css` for top-right positioning.

**Files:**
- Modify: `src/components/Threshold.astro` (remove fs.readdirSync auto-discovery; add `<Photo>` import + usage)
- Modify: `src/styles/threshold.css` (remove `.portrait-slot` rules; add `.threshold-photo` rules)

**Acceptance Criteria:**
- [ ] `Threshold.astro` no longer imports `node:fs` or `node:path`; no `readdirSync` call.
- [ ] `<Photo src="/images/rafan-speaking-1.jpg" alt="Rafan Quader speaking at a research symposium" caption="[PLACEHOLDER — caption, ~30–60 chars]" treatment="feathered" />` renders top-right of `.threshold` at desktop widths.
- [ ] On viewports < 720 px, the photo stacks below the tagline, centered, with reduced width.
- [ ] The threshold tree canvas is unchanged. Tree-mode hides the photo (same way it hid the old portrait-slot).
- [ ] Clicking the photo opens the lightbox at original colors / no feather / no sepia.
- [ ] `npm run check` clean.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && \
  npm run build 2>&1 | tail -6
```
Expected: 0 errors; build clean.

Then smoke:
```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  HTML=$(curl -s http://localhost:4321/)
  echo "threshold-photo:    $(echo "$HTML" | grep -c 'class="threshold-photo"')"
  echo "feathered photo:    $(echo "$HTML" | grep -c 'photo feathered')"
  echo "rafan-speaking-1:   $(echo "$HTML" | grep -c 'rafan-speaking-1.jpg')"
  echo "no portrait-slot:   $(echo "$HTML" | grep -c 'portrait-slot')"
  pkill -f 'astro dev'; sleep 1
```
Expected:
- `threshold-photo: 1`
- `feathered photo: 1`
- `rafan-speaking-1: 1` (in img src)
- `no portrait-slot: 0`

**Steps:**

- [ ] **Step 1: Rewrite `src/components/Threshold.astro`**

Replace the entire file with:

```astro
---
// Threshold — the opening section. Hero name + tagline + personal photo
// (top-right) + recursive tree canvas + tree click-hint sticker.
//
// The tree canvas is interactive: clicking it (or the sticker) enters
// tree-mode. See `tree-mode.ts`.
//
// Phase 6: the deferred portrait-slot auto-discovery is removed.
// The personal photo (`rafan-speaking-1.jpg`) is hardcoded via the
// reusable <Photo> primitive in feathered treatment, top-right.
//
// Spec: [[Concept - Threshold Hero]];
//       [[Concept - Recursive Tree Backdrop]];
//       [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3]];
//       [[decisions/ADR-010-tree-slider-labels]].
// Verbatim tagline: [[Author Profile#Stated objective]].

import '../styles/threshold.css';
import Photo from './photo/Photo.astro';

const tagline =
  'Computer Science @ SJSU. Aspiring to participate in meaningful ' +
  'applications of Computer Science, nudging humanity (well, hopefully ' +
  'at least some of it) forward!';
---
<section
  class="threshold"
  id="threshold"
  data-section-id="threshold"
  aria-label="introduction"
>
  <canvas
    id="tree-threshold"
    class="threshold-tree"
    aria-hidden="true"
    role="button"
    tabindex="0"
    aria-label="open the recursive tree"
  ></canvas>

  <div class="threshold-content">
    <h1 class="name" data-color-letters>
      <span class="name-line" data-inertial-text>rafan</span>
      <span class="name-line" data-inertial-text>quader</span>
    </h1>
    <p class="tagline">{tagline}</p>
  </div>

  <div class="threshold-photo">
    <Photo
      src="/images/rafan-speaking-1.jpg"
      alt="Rafan Quader speaking at a research symposium"
      caption="[PLACEHOLDER — caption, ~30–60 chars]"
      treatment="feathered"
    />
  </div>

  {/* Tree click-hint sticker — populated in Task 4. */}

  <a class="scroll-cue" href="#on-me" aria-label="scroll to content">
    <span aria-hidden="true">↓</span>
  </a>
</section>

{/* Tree-mode overlay — unchanged from Phase 5. Lives outside the
    section's main content because its visual layer is page-global. */}
<aside class="tree-mode-ui" aria-hidden="true" aria-label="recursive tree controls">
  <button class="tree-mode-close" type="button" aria-label="exit tree mode">×</button>
  <span class="tree-mode-hint" aria-hidden="true">esc</span>

  <div class="tree-mode-card" role="group" aria-label="tree parameters" data-label-mode="cs">
    <button class="tree-mode-reset" type="button" aria-label="reset to defaults" title="reset">↺</button>
    <label class="tree-mode-slider">
      <span class="tree-mode-label">
        <button
          type="button"
          class="tree-mode-label-toggle"
          data-label
          data-label-cs="depth"
          data-label-bot="generations"
          aria-label="click to switch between cs and botanical names"
        >depth</button>
         · <span data-value="depth">8</span>
      </span>
      <input class="tree-mode-range" type="range" min="5" max="10" step="1" value="8" data-knob="depth" aria-label="depth" />
    </label>
    <label class="tree-mode-slider">
      <span class="tree-mode-label">
        <button
          type="button"
          class="tree-mode-label-toggle"
          data-label
          data-label-cs="angle"
          data-label-bot="spread"
          aria-label="click to switch between cs and botanical names"
        >angle</button>
         · <span data-value="angle">27°</span>
      </span>
      <input class="tree-mode-range" type="range" min="14" max="40" step="1" value="27" data-knob="angle" aria-label="angle" />
    </label>
    <label class="tree-mode-slider">
      <span class="tree-mode-label">
        <button
          type="button"
          class="tree-mode-label-toggle"
          data-label
          data-label-cs="ratio"
          data-label-bot="taper"
          aria-label="click to switch between cs and botanical names"
        >ratio</button>
         · <span data-value="ratio">74%</span>
      </span>
      <input class="tree-mode-range" type="range" min="60" max="85" step="1" value="74" data-knob="ratio" aria-label="ratio" />
    </label>
  </div>
</aside>

<script>
  import { mountTree } from '../lib/backdrop/tree';
  import { initTreeMode } from '../lib/primitives/tree-mode';

  const canvas = document.getElementById('tree-threshold') as HTMLCanvasElement | null;
  if (canvas) {
    const handle = mountTree(canvas, {
      palette: 'sepia',
      opacity: 0.05,
      swayScale: 0.6,
      numParticles: 24,
    });
    initTreeMode(canvas, handle);
  }
</script>
```

- [ ] **Step 2: Update `src/styles/threshold.css`**

Replace the `.portrait-slot` block (lines 77–95 in the current file) with `.threshold-photo`:

```css
/* threshold-photo — personal photo, top-right of the threshold.
   Sits ABOVE the tree backdrop (z:1 vs tree's z:0) but BELOW the
   threshold-content text (z:2). Tree-mode hides it. The Photo
   primitive itself owns the feathered mask + sepia overlay. */

.threshold-photo {
  position: absolute;
  top: clamp(4rem, 8vh, 6rem);
  right: var(--gutter);
  width: clamp(200px, 32vw, 460px);
  z-index: 1;
  pointer-events: auto;
  transition: opacity 0.55s ease;
}
.threshold-photo .photo-caption {
  /* Tighter, smaller caption under the threshold photo so it doesn't
     compete with the tagline. */
  font-size: 0.78rem;
  opacity: 0.85;
  margin-top: 0.45rem;
}

@media (max-width: 720px) {
  .threshold-photo {
    position: relative;
    top: auto;
    right: auto;
    width: clamp(180px, 60vw, 320px);
    margin: clamp(1.5rem, 4vh, 2.5rem) auto 0;
  }
}
```

Also update the tree-mode hide rule. Find this block:

```css
body[data-tree-mode="on"] .portrait-slot,
body[data-tree-mode="on"] .scroll-cue,
body[data-tree-mode="on"] .threshold-tree-open {
  opacity: 0;
  pointer-events: none;
}
```

Change `.portrait-slot` to `.threshold-photo`:

```css
body[data-tree-mode="on"] .threshold-photo,
body[data-tree-mode="on"] .scroll-cue,
body[data-tree-mode="on"] .threshold-tree-open {
  opacity: 0;
  pointer-events: none;
}
```

And remove the old mobile-block for `.portrait-slot` (it's redundant now that the new responsive rules are inside `.threshold-photo`):

```css
@media (max-width: 640px) {
  .portrait-slot {
    position: relative;
    bottom: auto;
    right: auto;
    width: clamp(140px, 40vw, 220px);
    margin: clamp(2rem, 5vh, 3rem) auto 0;
  }
}
```

(Delete this whole `@media` block.)

- [ ] **Step 3: Type-check and build**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && \
  npm run build 2>&1 | tail -6
```

Expected: 0 errors; both run clean.

- [ ] **Step 4: Smoke-test the rendered HTML**

```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  HTML=$(curl -s http://localhost:4321/)
  echo "threshold-photo:    $(echo "$HTML" | grep -c 'class="threshold-photo"')"
  echo "feathered photo:    $(echo "$HTML" | grep -c 'photo feathered')"
  echo "rafan-speaking-1:   $(echo "$HTML" | grep -c 'rafan-speaking-1.jpg')"
  echo "no portrait-slot:   $(echo "$HTML" | grep -c 'portrait-slot')"
  echo "lightbox-trigger:   $(echo "$HTML" | grep -c 'data-lightbox-trigger')"
  pkill -f 'astro dev'; sleep 1
```

Expected:
- `threshold-photo: 1`
- `feathered photo: 1`
- `rafan-speaking-1: 1`
- `no portrait-slot: 0`
- `lightbox-trigger: 1`

---

## Task 4 — Tree click-hint sticker

**Goal:** Add a small first-load paper-sticker hint near the threshold tree that points to the tree-mode affordance. Auto-dismisses on interaction; once-per-user (localStorage).

**Files:**
- Create: `src/lib/primitives/tree-hint.ts`
- Create: `src/styles/tree-hint.css`
- Modify: `src/components/Threshold.astro` (add the sticker `<button>` markup)
- Modify: `src/layouts/Base.astro` (import `tree-hint.css`)
- Modify: `src/lib/site-init.ts` (wire `initTreeHint()`)

**Acceptance Criteria:**
- [ ] Sticker is a `<button class="tree-hint" data-tree-open>` inside the `.threshold` section.
- [ ] First page load (no `rq-tree-hint-seen` in localStorage): sticker fades in at t=800 ms, visible for 4 s, fades out over 240 ms.
- [ ] Any user interaction (`click`, `scroll`, `keydown`, `touchstart`) dismisses the sticker immediately.
- [ ] After dismissal (auto or manual), `localStorage.setItem('rq-tree-hint-seen', '1')` is called.
- [ ] Subsequent loads with `rq-tree-hint-seen=1` in localStorage: the sticker is not rendered visible (the markup exists but stays hidden).
- [ ] Clicking the sticker enters tree-mode (via the existing `[data-tree-open]` handler in tree-mode.ts).
- [ ] `prefers-reduced-motion: reduce`: no fade animation; the sticker appears/disappears with `display`/visibility only.
- [ ] `npm run check` clean.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && npm run build 2>&1 | tail -6
```

Smoke:
```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  HTML=$(curl -s http://localhost:4321/)
  echo "tree-hint button:    $(echo "$HTML" | grep -c 'class="tree-hint"')"
  echo "data-tree-open:      $(echo "$HTML" | grep -c 'data-tree-open')"
  pkill -f 'astro dev'; sleep 1
```
Expected:
- `tree-hint button: 1`
- `data-tree-open: ≥ 2` (the sticker + tree canvas could both have it depending on existing markup; at least one new sticker is present)

Human verification (when convenient): clear localStorage `rq-tree-hint-seen`, reload, sticker should appear ~1 s in, dismiss on any interaction, not return on subsequent loads.

**Steps:**

- [ ] **Step 1: Create `src/lib/primitives/tree-hint.ts`**

```ts
/**
 * @file tree-hint.ts
 *
 * First-load click-hint sticker on the threshold tree. Doubles as a
 * `[data-tree-open]` button so clicking it also enters tree-mode (the
 * existing tree-mode.ts hook picks up data-tree-open triggers).
 *
 * Behavior:
 *   - On first load (no `rq-tree-hint-seen` in localStorage):
 *       t = 800 ms: fade in (240 ms)
 *       t = ~5040 ms: fade out (240 ms)
 *   - Any user interaction (click on sticker, scroll, keydown, touchstart)
 *     dismisses immediately + flags localStorage.
 *   - On subsequent loads: sticker stays hidden.
 *   - prefers-reduced-motion: skip the fade transitions.
 *
 * Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.1]].
 */

const STORAGE_KEY = 'rq-tree-hint-seen';
const APPEAR_DELAY_MS = 800;
const HOLD_MS = 4000;
const FADE_MS = 240;

export interface TreeHintHandle {
  stop(): void;
}

export function initTreeHint(): TreeHintHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const sticker = document.querySelector<HTMLButtonElement>('.tree-hint');
  if (!sticker) return { stop: () => {} };

  // If the user has seen it before, just hide it permanently.
  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      sticker.setAttribute('hidden', '');
      return { stop: () => {} };
    }
  } catch {
    // localStorage disabled — fall through and show it once this session.
  }

  let dismissed = false;
  let appearTimer: ReturnType<typeof setTimeout> | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  function dismiss(): void {
    if (dismissed) return;
    dismissed = true;
    sticker?.setAttribute('data-state', 'gone');
    if (appearTimer) clearTimeout(appearTimer);
    if (holdTimer) clearTimeout(holdTimer);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    // Remove from DOM after fade-out so it can't be focused or screen-read.
    setTimeout(() => sticker?.setAttribute('hidden', ''), FADE_MS + 50);
    cleanup();
  }

  // Phase 1: schedule appearance.
  appearTimer = setTimeout(() => {
    sticker.setAttribute('data-state', 'visible');
    // Phase 2: schedule auto-dismiss.
    holdTimer = setTimeout(dismiss, HOLD_MS);
  }, APPEAR_DELAY_MS);

  // Dismiss on any user interaction. Use capture: true so we see the
  // event before tree-mode's own canvas click handler runs.
  const onAnyInteraction = (e: Event) => {
    // Sticker click → tree-mode.ts opens tree-mode via [data-tree-open];
    // we just need to mark dismissed and clean up.
    dismiss();
  };

  window.addEventListener('scroll', onAnyInteraction, { passive: true, once: true });
  window.addEventListener('keydown', onAnyInteraction, { once: true });
  window.addEventListener('touchstart', onAnyInteraction, { passive: true, once: true });
  // The sticker's own click also dismisses (also opens tree-mode).
  sticker.addEventListener('click', onAnyInteraction, { once: true });
  // Any other click on the page also dismisses.
  document.addEventListener('click', onAnyInteraction, { once: true });

  function cleanup(): void {
    window.removeEventListener('scroll', onAnyInteraction);
    window.removeEventListener('keydown', onAnyInteraction);
    window.removeEventListener('touchstart', onAnyInteraction);
    sticker.removeEventListener('click', onAnyInteraction);
    document.removeEventListener('click', onAnyInteraction);
  }

  return {
    stop(): void {
      if (appearTimer) clearTimeout(appearTimer);
      if (holdTimer) clearTimeout(holdTimer);
      cleanup();
    },
  };
}
```

- [ ] **Step 2: Create `src/styles/tree-hint.css`**

```css
/* tree-hint.css — small paper sticker on the threshold tree.
   Hand-applied feel: washi-tape strip, slight rotation, walnut italic.
   Three states via data-state:
     (none)     — initial, hidden
     visible    — faded in, sticker visible
     gone       — faded out, will be removed after FADE_MS
   Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.1]]. */

.tree-hint {
  position: absolute;
  bottom: clamp(2.5rem, 6vh, 4rem);
  right: clamp(1.5rem, 5vw, 3rem);
  z-index: 8;
  display: block;
  padding: 0.45rem 0.9rem 0.55rem;
  background: var(--bg-1);
  color: var(--text-0);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: 2px;
  font-family: var(--face-display);
  font-style: italic;
  font-size: 0.78rem;
  font-variation-settings: 'SOFT' 70, 'WONK' 1;
  letter-spacing: 0.01em;
  cursor: pointer;
  transform: rotate(-3deg);
  transform-origin: top right;
  box-shadow: 0 6px 14px -6px rgba(58, 38, 21, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 240ms ease, transform 240ms ease;
}
/* Washi-tape strip across the top of the sticker. */
.tree-hint::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 18%;
  right: 18%;
  height: 7px;
  background: color-mix(in srgb, var(--accent-glow) 60%, transparent);
  border-radius: 1px;
  opacity: 0.8;
  pointer-events: none;
}

.tree-hint[data-state="visible"] {
  opacity: 1;
  pointer-events: auto;
  transform: rotate(-3deg) translateY(0);
}
.tree-hint[data-state="gone"] {
  opacity: 0;
  pointer-events: none;
  transform: rotate(-3deg) translateY(4px);
}

.tree-hint:hover,
.tree-hint:focus-visible {
  outline: none;
  transform: rotate(-2deg) translateY(-1px);
  box-shadow: 0 8px 20px -8px rgba(58, 38, 21, 0.45);
}

/* On narrow viewports, move to bottom-center so it doesn't clash with
   the photo (which on mobile is below the tagline). */
@media (max-width: 600px) {
  .tree-hint {
    right: 50%;
    transform: rotate(-3deg) translateX(50%);
    transform-origin: center;
  }
  .tree-hint[data-state="visible"] {
    transform: rotate(-3deg) translateX(50%) translateY(0);
  }
  .tree-hint[data-state="gone"] {
    transform: rotate(-3deg) translateX(50%) translateY(4px);
  }
  .tree-hint:hover,
  .tree-hint:focus-visible {
    transform: rotate(-2deg) translateX(50%) translateY(-1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tree-hint,
  .tree-hint:hover,
  .tree-hint:focus-visible {
    transition: none;
    transform: rotate(-3deg);
  }
}
```

- [ ] **Step 3: Add the sticker markup to `Threshold.astro`**

Find the comment `{/* Tree click-hint sticker — populated in Task 4. */}` from Task 3 and replace with:

```astro
<button
  class="tree-hint"
  type="button"
  data-tree-open
  aria-label="open the recursive tree to tune it"
>
  ↘ click the tree
</button>
```

- [ ] **Step 4: Import `tree-hint.css` in Base.astro**

In the import block at the top, add:

```ts
import '../styles/tree-hint.css';
```

- [ ] **Step 5: Wire `initTreeHint()` in `site-init.ts`**

Add the import:

```ts
import { initTreeHint } from './primitives/tree-hint';
```

And the call (just before `initScrollSpy()` so it runs after layout primitives are in place):

```ts
initTreeHint();
```

- [ ] **Step 6: Verify**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && npm run build 2>&1 | tail -6
```
Expected: 0 errors; build clean.

Smoke:
```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  HTML=$(curl -s http://localhost:4321/)
  echo "tree-hint button:    $(echo "$HTML" | grep -c 'class="tree-hint"')"
  echo "data-tree-open:      $(echo "$HTML" | grep -c 'data-tree-open')"
  pkill -f 'astro dev'; sleep 1
```
Expected: tree-hint button=1; data-tree-open ≥1.

---

## Task 5 — Extend project schema + ProjectMedia component

**Goal:** Add `cover_video` to the projects content collection schema, and build the `ProjectMedia` component that renders image-or-video-or-coverless per precedence.

**Files:**
- Modify: `src/content/config.ts` (add `cover_video: z.string().optional()`)
- Create: `src/components/project/ProjectMedia.astro`

**Acceptance Criteria:**
- [ ] `projects` schema validates frontmatter with `cover_video: "/projects/foo/demo.mp4"`.
- [ ] If `cover_video` is set on a project, `<ProjectMedia project={p} />` renders a `<video controls playsinline muted preload="metadata">` with the video file as the source; if `cover_image` is also set, the video element gets `poster={cover_image}`.
- [ ] If only `cover_image` is set, renders `<Photo src={cover_image} treatment="plain" lightbox />`.
- [ ] If neither is set, renders a `.project-cover-empty` block (small repeating-pattern placeholder in the project's accent color — placeholder, simple gradient).
- [ ] `npm run check` clean against the sample project (which has neither set → empty state).

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8
```
Expected: 0 errors.

**Steps:**

- [ ] **Step 1: Extend `src/content/config.ts`**

In the `projects` schema, add the `cover_video` line right after `cover_image`:

```ts
const projects = defineCollection({
  loader: glob({ pattern: '**/_index.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    sort_order: z.number(),
    github_url: z.string().url().optional(),
    download_url: z.string().url().optional(),
    cover_image: z.string().optional(),
    cover_video: z.string().optional(),  // NEW: relative path to .mp4/.webm under the project folder
    status: z.enum(['archived', 'active', 'shipped']).default('shipped'),
  }),
});
```

- [ ] **Step 2: Create `src/components/project/ProjectMedia.astro`**

```astro
---
/**
 * ProjectMedia — renders one project's cover media.
 *
 * Precedence (per spec §3.4):
 *   1. cover_video set → <video> with optional cover_image as poster
 *   2. cover_image set → <Photo treatment="plain" lightbox>
 *   3. neither → cover-less placeholder
 *
 * Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2.3]].
 */

import type { CollectionEntry } from 'astro:content';
import Photo from '../photo/Photo.astro';

interface Props {
  project: CollectionEntry<'projects'>;
}

const { project } = Astro.props;
const { cover_image, cover_video, title } = project.data;
---
{cover_video ? (
  <video
    class="project-media project-media-video"
    controls
    playsinline
    muted
    preload="metadata"
    src={cover_video}
    poster={cover_image}
    aria-label={`cover video for ${title}`}
  />
) : cover_image ? (
  <div class="project-media project-media-image">
    <Photo src={cover_image} alt={`${title} cover image`} treatment="plain" lightbox />
  </div>
) : (
  <div class="project-media project-media-empty" aria-hidden="true">
    {/* PLACEHOLDER — visual treatment is the simple gradient below.
        See spec §4.2.3 for the cover-less degradation. */}
  </div>
)}
```

- [ ] **Step 3: Verify**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -10
```
Expected: 0 errors.

---

## Task 6 — ProjectNotes accordion

**Goal:** Build `ProjectNotes.astro` — reads the project's `projectFiles` entries, groups by top-level directory, renders native `<details>` blocks with sensible defaults (`field/` open, `decisions/` closed, others closed). Each note's body uses the existing `obsidian-notes.css` treatment.

**Files:**
- Create: `src/components/project/ProjectNotes.astro`

**Acceptance Criteria:**
- [ ] For a given project entry, the component fetches its `projectFiles` and groups them by the first path segment under the project slug.
- [ ] Each group renders as an outer `<details>` with a `<summary>` "field notes (3)" / "decisions (1)" / etc., counting items.
- [ ] `field/` is `open` by default; other groups are closed.
- [ ] Each note inside a group is an inner `<details>` with the note's `title` (falling back to filename) as `<summary>`, and the rendered Markdown body in the panel.
- [ ] Loose files at project root (e.g. `credits.md`) appear under a group named after the file (e.g. group "credits", which contains one note).
- [ ] Each inner `<details>` has `id="<projectId>-<rel-path>"` so `:target` opens it on direct-link.
- [ ] `npm run check` clean.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8
```
Expected: 0 errors.

**Steps:**

- [ ] **Step 1: Create `src/components/project/ProjectNotes.astro`**

```astro
---
/**
 * ProjectNotes — accordion of cleaned Obsidian notes per project.
 *
 * Reads `projectFiles` for the given project, groups by top-level dir,
 * renders native <details>. The body of each note uses the existing
 * obsidian-notes.css treatment (Phase 4). Top-level groups expand
 * with sensible defaults (field/ open, decisions/ closed).
 *
 * Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2.4]].
 */

import { getCollection, render, type CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
}

const { project } = Astro.props;

// project.id is e.g. "sample/_index"; strip the trailing _index to get slug.
function slugFor(projectId: string): string {
  return projectId.endsWith('/_index')
    ? projectId.slice(0, -'/_index'.length)
    : projectId;
}
const slug = slugFor(project.id);

// Fetch all projectFiles, filter to those belonging to this project.
const allFiles = await getCollection('projectFiles');
const myFiles = allFiles.filter((f) => f.id === slug || f.id.startsWith(`${slug}/`));

interface Group {
  /** First path segment under slug (or filename without ext for root files). */
  name: string;
  notes: typeof myFiles;
}

const groups = new Map<string, Group>();
for (const f of myFiles) {
  const rel = f.id.startsWith(`${slug}/`) ? f.id.slice(slug.length + 1) : f.id;
  const segs = rel.split('/');
  let groupName: string;
  if (segs.length > 1) {
    groupName = segs[0] as string;
  } else {
    // Loose root file like `credits.md` → group "credits" with single note.
    groupName = segs[0] as string;
  }
  if (!groups.has(groupName)) groups.set(groupName, { name: groupName, notes: [] });
  groups.get(groupName)!.notes.push(f);
}

// Sort groups alphabetically; default-open is field/ only.
const orderedGroups = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
const openByDefault = new Set(['field']);

// Sort notes within each group by sort_order asc, then filename.
for (const g of orderedGroups) {
  g.notes.sort((a, b) => {
    const so = (a.data.sort_order ?? 0) - (b.data.sort_order ?? 0);
    if (so !== 0) return so;
    return a.id.localeCompare(b.id);
  });
}

// Pre-render all note contents at build time.
const renderedNotes = await Promise.all(
  orderedGroups.flatMap((g) =>
    g.notes.map(async (n) => ({
      group: g.name,
      noteId: n.id,
      title: n.data.title ?? n.id.split('/').pop() ?? n.id,
      Content: (await render(n)).Content,
    })),
  ),
);
const renderedById = new Map(renderedNotes.map((r) => [r.noteId, r]));
---
{orderedGroups.length > 0 && (
  <div class="project-notes" aria-label="cleaned obsidian notes">
    {orderedGroups.map((g) => (
      <details class="pn-group" open={openByDefault.has(g.name)}>
        <summary class="pn-group-summary">
          <span class="pn-group-chev" aria-hidden="true">▸</span>
          <span class="pn-group-name">{g.name}</span>
          <span class="pn-group-count">({g.notes.length})</span>
        </summary>
        <ul class="pn-group-list">
          {g.notes.map((n) => {
            const r = renderedById.get(n.id);
            return r ? (
              <li>
                <details class="pn-note" id={`${project.id}-${n.id}`}>
                  <summary class="pn-note-summary">
                    <span class="pn-note-chev" aria-hidden="true">▸</span>
                    <span class="pn-note-title">{r.title}</span>
                  </summary>
                  <div class="pn-note-body obsidian-notes">
                    <r.Content />
                  </div>
                </details>
              </li>
            ) : null;
          })}
        </ul>
      </details>
    ))}
  </div>
)}
```

- [ ] **Step 2: Verify**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -10
```
Expected: 0 errors.

---

## Task 7 — ProjectChapter component

**Goal:** Compose `ProjectChapter.astro`: heading + tagline + cover media + story prose + status/links + notes accordion + chapter rule.

**Files:**
- Create: `src/components/project/ProjectChapter.astro`

**Acceptance Criteria:**
- [ ] Renders for a given `CollectionEntry<'projects'>`: project title (h2), tagline, ProjectMedia, the `_index.md` content (via `render(project).Content`), an inline `<p class="project-meta">` with status + github + download links (omitting absent ones), and `<ProjectNotes project={project} />`.
- [ ] Final-chapter prop `isLast?: boolean`. If true, the chapter rule below it is omitted.
- [ ] Each chapter has `id="<slug>"` so `/projects#<slug>` scrolls to it.
- [ ] `npm run check` clean.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8
```
Expected: 0 errors.

**Steps:**

- [ ] **Step 1: Create `src/components/project/ProjectChapter.astro`**

```astro
---
/**
 * ProjectChapter — one project's full vertical spread on the /projects page.
 *
 * Heading + tagline + media + story + inline status/links + notes accordion.
 * A chapter rule sits below unless `isLast=true`.
 *
 * Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2.3]].
 */

import { render, type CollectionEntry } from 'astro:content';
import ProjectMedia from './ProjectMedia.astro';
import ProjectNotes from './ProjectNotes.astro';

interface Props {
  project: CollectionEntry<'projects'>;
  isLast?: boolean;
}

const { project, isLast = false } = Astro.props;
const { Content } = await render(project);

function slugFor(id: string): string {
  return id.endsWith('/_index') ? id.slice(0, -'/_index'.length) : id;
}
const slug = slugFor(project.id);
---
<article class="project-chapter" id={slug}>
  <header class="project-chapter-head">
    <h2 data-color-letters data-inertial-text>{project.data.title}</h2>
    <p class="project-tagline">{project.data.tagline}</p>
  </header>

  <ProjectMedia project={project} />

  <div class="project-story obsidian-notes">
    <Content />
  </div>

  <p class="project-meta">
    <span class={`project-status status-${project.data.status}`}>{project.data.status}</span>
    {project.data.github_url && (
      <>
        {' · '}
        <a href={project.data.github_url} rel="noopener" target="_blank">github ↗</a>
      </>
    )}
    {project.data.download_url && (
      <>
        {' · '}
        <a href={project.data.download_url} rel="noopener" target="_blank">download ↗</a>
      </>
    )}
  </p>

  <ProjectNotes project={project} />
</article>

{!isLast && <hr class="chapter-rule" aria-hidden="true" />}
```

- [ ] **Step 2: Verify**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -10
```
Expected: 0 errors.

---

## Task 8 — `/projects` page route + styles

**Goal:** Create the `/projects` page that renders top framing prose, each project as a chapter (sorted by `sort_order`), and bottom framing prose. Add `projects.css` with the chapter + notes + meta styling.

**Files:**
- Create: `src/pages/projects.astro`
- Create: `src/styles/projects.css`
- Modify: `src/layouts/Base.astro` (import `projects.css`)

**Acceptance Criteria:**
- [ ] `GET /projects` returns 200 with the page rendering.
- [ ] The page contains: top framing prose placeholder, one `.project-chapter` per project (with `<h2>` + media + story + meta + notes), `.chapter-rule` between chapters (not after the last), bottom framing prose placeholder.
- [ ] Top-of-page heading "Projects" is present in display face.
- [ ] Page uses the existing `Base.astro` layout and TopNav.
- [ ] `npm run check` clean. `npm run build` produces `/projects/` in the build output.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && npm run build 2>&1 | tail -10
```
Expected: 0 errors; build outputs `/projects/index.html`.

Smoke:
```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  HTML=$(curl -s -w "HTTP %{http_code}\n" http://localhost:4321/projects -o /tmp/projects.html)
  echo "$HTML"
  echo "project-chapter:     $(grep -c 'class="project-chapter"' /tmp/projects.html)"
  echo "chapter-rule:        $(grep -c 'class="chapter-rule"' /tmp/projects.html)"
  echo "project-notes:       $(grep -c 'class="project-notes"' /tmp/projects.html)"
  echo "pn-group field:      $(grep -c '<span class="pn-group-name">field</span>' /tmp/projects.html)"
  echo "pn-group decisions:  $(grep -c '<span class="pn-group-name">decisions</span>' /tmp/projects.html)"
  echo "top intro placeholder: $(grep -c 'class="projects-intro"' /tmp/projects.html)"
  echo "bottom outro placeholder: $(grep -c 'class="projects-outro"' /tmp/projects.html)"
  pkill -f 'astro dev'; sleep 1
```
Expected:
- `HTTP 200`
- `project-chapter: 1` (one for the sample project)
- `chapter-rule: 0` (only one project, so it's the last and has no rule after)
- `project-notes: 1`
- `pn-group field: 1`
- `pn-group decisions: 1`
- top intro placeholder: 1
- bottom outro placeholder: 1

**Steps:**

- [ ] **Step 1: Create `src/pages/projects.astro`**

```astro
---
// /projects — the projects page. Vertical chapter spreads, one per
// project in the `projects` content collection. Reads as a continuous
// story; reader scrolls through.
//
// Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2]].

import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import TopNav from '../components/TopNav.astro';
import ProjectChapter from '../components/project/ProjectChapter.astro';

const projects = (await getCollection('projects')).sort(
  (a, b) => a.data.sort_order - b.data.sort_order,
);
---
<Base title="Projects — Rafan Quader" description="The things I've built, with the working notes attached.">
  <TopNav />
  <main class="projects-page">
    <header class="projects-header">
      <h1 class="projects-title" data-color-letters data-inertial-text>Projects</h1>
      <p class="projects-intro">
        [PLACEHOLDER — top-of-page framing prose, ~120–200 words.
        The user's continuous-story opener. Tone: introduce the projects,
        explain how to read this page, what threads connect the work.
        Use one or two paragraphs. Replace this whole block.]
      </p>
    </header>

    {projects.length > 0 ? (
      <div class="projects-list">
        {projects.map((p, i) => (
          <ProjectChapter project={p} isLast={i === projects.length - 1} />
        ))}
      </div>
    ) : (
      <p class="projects-empty">
        [PLACEHOLDER — no projects yet. Drop a folder under
        <code>src/content/projects/&lt;slug&gt;/</code> via the content
        pipeline (see <em>04 - Content Pipeline</em> in the Obsidian docs).]
      </p>
    )}

    <footer class="projects-footer">
      <p class="projects-outro">
        [PLACEHOLDER — closing prose, ~60–120 words. Tone: outbound to
        the trail / github / coda; tie the projects back to the work.
        Replace this whole block.]
      </p>
    </footer>
  </main>
</Base>
```

- [ ] **Step 2: Create `src/styles/projects.css`**

```css
/* projects.css — /projects page + chapter spread + notes accordion.
   Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2]]. */

.projects-page {
  max-width: min(72rem, 100% - var(--gutter) * 2);
  margin: clamp(5rem, 10vh, 8rem) auto clamp(4rem, 8vh, 6rem);
  padding: 0 var(--gutter);
}

.projects-header {
  margin-bottom: clamp(2.5rem, 5vh, 4rem);
}

.projects-title {
  font-family: var(--face-display);
  font-variation-settings: 'SOFT' 70, 'WONK' 1;
  font-size: var(--type-h2);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
  margin-bottom: 1.2rem;
  color: var(--text-0);
}

.projects-intro,
.projects-outro {
  font-family: var(--face-text);
  font-size: var(--type-body);
  line-height: var(--leading-body);
  color: var(--text-1);
  max-width: 38rem;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: clamp(2rem, 4vh, 3rem);
}

.project-chapter {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2.5vh, 2rem);
  scroll-margin-top: var(--nav-h);
}
.project-chapter-head {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.project-chapter-head h2 {
  font-family: var(--face-display);
  font-variation-settings: 'SOFT' 80, 'WONK' 1;
  font-style: italic;
  font-size: clamp(1.8rem, 3.2vw, 2.6rem);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
  color: var(--text-0);
  margin: 0;
}
.project-tagline {
  font-family: var(--face-text);
  font-style: italic;
  font-size: var(--type-small);
  color: var(--text-1);
  margin: 0;
}

/* Cover media */
.project-media {
  width: 100%;
  max-height: 70vh;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 2px;
  background: var(--bg-1);
}
.project-media-image {
  /* The inner <Photo treatment="plain" /> inherits its sizing from this. */
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 2px;
}
.project-media-empty {
  aspect-ratio: 16 / 10;
  background:
    radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent) 35%, transparent) 0%, transparent 60%),
    repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,0.04) 6px 7px),
    var(--bg-1);
  border-radius: 2px;
}

.project-story {
  /* obsidian-notes.css styles the inner Markdown content. */
  max-width: 38rem;
}

.project-meta {
  font-family: var(--face-mono);
  font-size: 0.78rem;
  color: var(--text-2);
  letter-spacing: 0.04em;
  margin: 0;
}
.project-meta a {
  color: var(--text-1);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--accent) 50%, transparent);
  text-underline-offset: 3px;
}
.project-meta a:hover {
  color: var(--accent);
}
.project-status {
  text-transform: lowercase;
  padding: 0.05em 0.4em;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 999px;
  color: var(--text-1);
}

/* === Notes accordion === */
.project-notes {
  margin-top: clamp(0.5rem, 1.5vh, 1rem);
  font-family: var(--face-text);
}
.pn-group {
  margin-bottom: 0.6rem;
  border-left: 2px solid color-mix(in srgb, var(--accent) 22%, transparent);
  padding-left: 0.9rem;
}
.pn-group-summary {
  list-style: none;
  cursor: pointer;
  font-family: var(--face-mono);
  font-size: 0.85rem;
  color: var(--text-1);
  text-transform: lowercase;
  letter-spacing: 0.04em;
  padding: 0.3rem 0;
}
.pn-group-summary::-webkit-details-marker { display: none; }
.pn-group-chev {
  display: inline-block;
  transition: transform 0.2s ease;
}
.pn-group[open] > .pn-group-summary > .pn-group-chev {
  transform: rotate(90deg);
}
.pn-group-name {
  color: var(--text-0);
  margin-right: 0.4em;
}
.pn-group-count {
  color: var(--text-2);
  font-size: 0.85em;
}

.pn-group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.pn-note {
  scroll-margin-top: var(--nav-h);
}
.pn-note-summary {
  list-style: none;
  cursor: pointer;
  font-family: var(--face-text);
  font-size: var(--type-small);
  color: var(--text-1);
  padding: 0.25rem 0 0.25rem 0.4rem;
  border-radius: 2px;
  transition: background 0.15s ease, color 0.15s ease;
}
.pn-note-summary::-webkit-details-marker { display: none; }
.pn-note-summary:hover {
  background: color-mix(in srgb, var(--bg-2) 50%, transparent);
  color: var(--text-0);
}
.pn-note-chev {
  display: inline-block;
  transition: transform 0.2s ease;
  margin-right: 0.4em;
}
.pn-note[open] > .pn-note-summary > .pn-note-chev {
  transform: rotate(90deg);
}
.pn-note-body {
  padding: 0.4rem 0 0.6rem 1.1rem;
}

.chapter-rule {
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
  margin: clamp(2rem, 4vh, 3rem) 0;
  width: 100%;
  max-width: 24rem;
}

.projects-footer {
  margin-top: clamp(3rem, 6vh, 5rem);
  border-top: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
  padding-top: clamp(1rem, 3vh, 2rem);
}

@media (max-width: 720px) {
  .project-media,
  .project-media-image,
  .project-media-empty {
    aspect-ratio: 4 / 3;
    max-height: 60vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pn-group-chev,
  .pn-note-chev {
    transition: none;
  }
}
```

- [ ] **Step 3: Import `projects.css` in Base.astro**

In the import block:

```ts
import '../styles/projects.css';
```

- [ ] **Step 4: Verify**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && npm run build 2>&1 | tail -10
```
Expected: 0 errors; build outputs `/projects/index.html`.

Smoke:
```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  curl -s -w "HTTP %{http_code}\n" http://localhost:4321/projects -o /tmp/projects.html | head -1
  echo "project-chapter:     $(grep -c 'class="project-chapter"' /tmp/projects.html)"
  echo "chapter-rule:        $(grep -c 'class="chapter-rule"' /tmp/projects.html)"
  echo "project-notes:       $(grep -c 'class="project-notes"' /tmp/projects.html)"
  echo "pn-group field:      $(grep -c '<span class="pn-group-name">field</span>' /tmp/projects.html)"
  echo "pn-group decisions:  $(grep -c '<span class="pn-group-name">decisions</span>' /tmp/projects.html)"
  echo "projects-intro:      $(grep -c 'class="projects-intro"' /tmp/projects.html)"
  echo "projects-outro:      $(grep -c 'class="projects-outro"' /tmp/projects.html)"
  pkill -f 'astro dev'; sleep 1
```
Expected:
- HTTP 200
- project-chapter: 1
- chapter-rule: 0 (single project = last, no rule after)
- project-notes: 1
- pn-group field: 1
- pn-group decisions: 1
- projects-intro: 1
- projects-outro: 1

---

## Task 9 — TopNav cross-route navigation

**Goal:** Update TopNav to remove the `on-the-artifacts` anchor (section being removed) and add a `/projects` route link with a small `↗` glyph. Active-link logic distinguishes route from anchor.

**Files:**
- Modify: `src/components/TopNav.astro`

**Acceptance Criteria:**
- [ ] On home (`/`), TopNav shows: `on me · on the work · projects ↗ · on the trail · coda` (no "on the artifacts").
- [ ] Clicking "projects" navigates to `/projects` (full route, not anchor).
- [ ] On `/projects`, the "projects" link is marked `.is-current` (route-active).
- [ ] On home, in-page anchor links continue to work and update via scroll-spy.
- [ ] Home-page anchor links shown on `/projects` are full URLs (`/#on-me`, etc.), so clicking them navigates back to home and scrolls.
- [ ] `npm run check` clean.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && npm run build 2>&1 | tail -6
```
Expected: 0 errors; build clean.

Smoke on both pages:
```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  HOME=$(curl -s http://localhost:4321/)
  PROJ=$(curl -s http://localhost:4321/projects)
  echo "home: projects link:    $(echo "$HOME" | grep -c 'href="/projects"')"
  echo "home: artifacts link:   $(echo "$HOME" | grep -c '#on-the-artifacts')"
  echo "home: projects ↗ glyph: $(echo "$HOME" | grep -c 'data-nav-link="projects"')"
  echo "proj: projects link is-current: $(echo "$PROJ" | grep -c 'is-current.*projects\|projects.*is-current')"
  echo "proj: home anchor link: $(echo "$PROJ" | grep -c 'href="/#on-me"')"
  pkill -f 'astro dev'; sleep 1
```
Expected:
- home: projects link: 1
- home: artifacts link: 0
- home: projects ↗ glyph: 1
- proj: projects link is-current: 1
- proj: home anchor link: 1

**Steps:**

- [ ] **Step 1: Rewrite `src/components/TopNav.astro`**

Replace the file with:

```astro
---
// TopNav — fixed top-nav with cross-route + in-page anchor links.
// Active-link logic distinguishes:
//   - Route-level (Astro.url.pathname === entry.href) — `.is-current` from SSR
//   - Anchor-level (scroll-spy adds .is-current via JS, see scroll-spy.ts)
//
// Phase 6: removed `on-the-artifacts` (section gone); added `/projects ↗`.
//
// Spec: [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2.1]];
//       [[02 - Architecture#repo layout]];
//       [[decisions/ADR-009-light-dark-mode-toggle]].

const path = Astro.url.pathname;
const isHome = path === '/' || path === '';
const isProjects = path.startsWith('/projects');

// Anchor links: relative on home, absolute pointing back to home elsewhere.
function anchorHref(slug: string): string {
  return isHome ? `#${slug}` : `/#${slug}`;
}

const anchorLinks = [
  { slug: 'on-me', label: 'on me' },
  { slug: 'on-the-work', label: 'on the work' },
  { slug: 'on-the-trail', label: 'on the trail' },
  { slug: 'coda', label: 'coda' },
] as const;
---
<div class="scroll-progress" aria-hidden="true"></div>
<nav class="top-nav" aria-label="primary">
  <a
    class={`top-nav-home${isHome ? ' is-current' : ''}`}
    href={isHome ? '#threshold' : '/'}
    data-nav-link="threshold"
  >rq</a>
  <ul>
    <li>
      <a href={anchorHref('on-me')} data-nav-link="on-me">on me</a>
    </li>
    <li>
      <a href={anchorHref('on-the-work')} data-nav-link="on-the-work">on the work</a>
    </li>
    <li>
      <a
        href="/projects"
        class={`route-link${isProjects ? ' is-current' : ''}`}
        data-nav-link="projects"
      >projects <span aria-hidden="true" class="route-glyph">↗</span></a>
    </li>
    <li>
      <a href={anchorHref('on-the-trail')} data-nav-link="on-the-trail">on the trail</a>
    </li>
    <li>
      <a href={anchorHref('coda')} data-nav-link="coda">coda</a>
    </li>
  </ul>
  <button
    class="theme-toggle"
    type="button"
    data-theme-toggle
    aria-label="switch color scheme"
    aria-pressed="false"
  >
    <span class="t-light" aria-hidden="true">light</span>
    <span class="t-sep" aria-hidden="true">·</span>
    <span class="t-dark" aria-hidden="true">dark</span>
  </button>
</nav>

<style>
  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--nav-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(0.5rem, 2vw, 1rem);
    padding: 0 var(--gutter);
    z-index: 50;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--bg-0) 90%, transparent) 0%,
      color-mix(in srgb, var(--bg-0) 60%, transparent) 70%,
      transparent 100%
    );
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .top-nav a,
  .top-nav button {
    pointer-events: auto;
  }

  .top-nav-home {
    font-family: var(--face-display);
    font-variation-settings: 'SOFT' 60, 'WONK' 0;
    font-size: 1.15rem;
    color: var(--text-0);
    text-decoration: none;
    letter-spacing: 0.04em;
    font-weight: 500;
  }

  .top-nav ul {
    display: flex;
    gap: clamp(0.75rem, 2vw, 1.75rem);
    list-style: none;
    margin: 0;
    padding: 0;
    align-items: center;
  }
  .top-nav ul a {
    font-family: var(--face-text);
    font-size: var(--type-small);
    color: var(--text-2);
    text-decoration: none;
    padding: 0.3rem 0;
    text-decoration-line: none;
    text-decoration-style: wavy;
    text-decoration-thickness: 1.5px;
    text-underline-offset: 6px;
    transition: color 0.3s ease, text-decoration-color 0.3s ease;
  }
  .top-nav ul a:hover,
  .top-nav ul a:focus-visible {
    color: var(--text-0);
    outline: none;
  }
  .top-nav ul a.is-current {
    color: var(--text-0);
    text-decoration-line: underline;
    text-decoration-color: var(--companion-color, var(--accent));
  }
  /* Route links (e.g. /projects) — small ↗ glyph hint. */
  .top-nav ul a.route-link .route-glyph {
    font-size: 0.78em;
    margin-left: 0.05em;
    color: var(--text-2);
    transition: color 0.3s ease;
  }
  .top-nav ul a.route-link:hover .route-glyph,
  .top-nav ul a.route-link.is-current .route-glyph {
    color: var(--accent);
  }

  /* === Theme toggle === */
  .theme-toggle {
    font-family: var(--face-mono);
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    text-transform: lowercase;
    background: transparent;
    border: 0;
    padding: 0.22rem 0.45rem;
    cursor: pointer;
    color: var(--text-2);
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    border-radius: 999px;
    transition: background 0.25s ease, color 0.25s ease;
    line-height: 1;
  }
  .theme-toggle:hover,
  .theme-toggle:focus-visible {
    color: var(--text-0);
    outline: none;
  }
  .theme-toggle .t-light,
  .theme-toggle .t-dark {
    transition: color 0.3s ease;
  }
  .theme-toggle .t-sep {
    opacity: 0.35;
    margin: 0;
  }
  :root[data-theme="light"] .theme-toggle .t-light { color: var(--accent); }
  :root[data-theme="dark"]  .theme-toggle .t-dark  { color: var(--accent); }
  :root[data-theme="light"] .theme-toggle .t-dark  { opacity: 0.45; }
  :root[data-theme="dark"]  .theme-toggle .t-light { opacity: 0.45; }

  @media (max-width: 720px) {
    .top-nav ul { display: none; }
    .top-nav { justify-content: space-between; }
  }
</style>
```

- [ ] **Step 2: Verify**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && npm run build 2>&1 | tail -6
```
Expected: 0 errors; build clean.

Smoke (as in the Verify block above).

---

## Task 10 — Remove old gallery code + final verification

**Goal:** Delete every artifact of the manila gallery (FolderShelf / FolderCard / FolderReader / folder-reader.ts / manila-folder.css / OnTheArtifacts.astro). Unwire from index.astro and site-init.ts. Run a full verification pass against the entire spec.

**Files:**
- Delete: `src/components/folders/FolderShelf.astro`
- Delete: `src/components/folders/FolderCard.astro`
- Delete: `src/components/folders/FolderReader.astro`
- Delete: `src/components/folders/` (the directory, after the files are gone)
- Delete: `src/components/OnTheArtifacts.astro`
- Delete: `src/lib/primitives/folder-reader.ts`
- Delete: `src/styles/manila-folder.css`
- Modify: `src/pages/index.astro` (remove `OnTheArtifacts` + `FolderReader` mounts + imports)
- Modify: `src/lib/site-init.ts` (remove `initFolderReader` import + call)

**Acceptance Criteria:**
- [ ] All listed files are gone from disk.
- [ ] `src/pages/index.astro` does not import OnTheArtifacts or FolderReader.
- [ ] `src/lib/site-init.ts` does not import or call `initFolderReader`.
- [ ] `npm run check` clean.
- [ ] `npm run build` clean.
- [ ] Home page HTML no longer contains `on-the-artifacts` section or `reading-overlay` div.
- [ ] `/projects` page HTML is unaffected.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -8 && npm run build 2>&1 | tail -10
```

Then full smoke on both pages:
```bash
cd ~/Developer/Portfolio_Website && \
  npm run dev > /tmp/dev.log 2>&1 &
  sleep 3
  HOME=$(curl -s -w "HTTP %{http_code}\n" http://localhost:4321/ -o /tmp/home.html | head -1)
  PROJ=$(curl -s -w "HTTP %{http_code}\n" http://localhost:4321/projects -o /tmp/proj.html | head -1)
  echo "home: $HOME"
  echo "proj: $PROJ"
  echo
  echo "=== HOME ==="
  echo "tree-threshold:    $(grep -c 'id="tree-threshold"' /tmp/home.html)"
  echo "threshold-photo:   $(grep -c 'class="threshold-photo"' /tmp/home.html)"
  echo "tree-hint:         $(grep -c 'class="tree-hint"' /tmp/home.html)"
  echo "OnTheArtifacts:    $(grep -c 'on-the-artifacts' /tmp/home.html)  (expect 0)"
  echo "reading-overlay:   $(grep -c 'reading-overlay' /tmp/home.html)  (expect 0)"
  echo "projects nav:      $(grep -c 'href="/projects"' /tmp/home.html)"
  echo
  echo "=== /projects ==="
  echo "project-chapter:   $(grep -c 'class="project-chapter"' /tmp/proj.html)"
  echo "pn-group field:    $(grep -c '<span class="pn-group-name">field</span>' /tmp/proj.html)"
  pkill -f 'astro dev'; sleep 1
  lsof -i :4321 >/dev/null 2>&1 && echo "still running" || echo "port 4321 free"
```

Expected: HTTP 200 on both; `on-the-artifacts: 0`; `reading-overlay: 0`; everything else ≥ 1.

**Steps:**

- [ ] **Step 1: Delete the gallery files**

```bash
cd ~/Developer/Portfolio_Website
rm src/components/folders/FolderShelf.astro
rm src/components/folders/FolderCard.astro
rm src/components/folders/FolderReader.astro
rmdir src/components/folders
rm src/components/OnTheArtifacts.astro
rm src/lib/primitives/folder-reader.ts
rm src/styles/manila-folder.css
```

- [ ] **Step 2: Update `src/pages/index.astro`**

Replace with:

```astro
---
// Single-page portfolio entry. The six rooms compose top-to-bottom in
// natural scroll order. The projects gallery has moved to its own
// route at /projects (see src/pages/projects.astro).
//
// Spec: [[03 - Content Model]] +
//       [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2.7]].

import Base from '../layouts/Base.astro';
import TopNav from '../components/TopNav.astro';
import Threshold from '../components/Threshold.astro';
import OnMe from '../components/OnMe.astro';
import OnTheWork from '../components/OnTheWork.astro';
import OnTheTrail from '../components/OnTheTrail.astro';
import Coda from '../components/Coda.astro';
---
<Base>
  <TopNav />
  <main>
    <Threshold />
    <OnMe />
    <OnTheWork />
    <OnTheTrail />
    <Coda />
  </main>
</Base>
```

- [ ] **Step 3: Update `src/lib/site-init.ts`**

Remove the FolderReader import and call:

Find and delete:
```ts
import { initFolderReader } from './primitives/folder-reader';
```
and
```ts
initFolderReader();
```

- [ ] **Step 4: Full type-check + build**

```bash
cd ~/Developer/Portfolio_Website && npm run check 2>&1 | tail -10
```
Expected: 0 errors.

```bash
cd ~/Developer/Portfolio_Website && npm run build 2>&1 | tail -10
```
Expected: build outputs `/index.html` and `/projects/index.html`; sitemap includes both.

- [ ] **Step 5: Full smoke test**

(Use the smoke block in this task's Verify section above.)

---

## Task 11 — Write ADR-012, ADR-013, ADR-014

**Goal:** Write three ADRs in `decisions/` capturing the gallery v2, personal-photo placement, and tree click-hint sticker decisions. Update the ADR index.

**Files:**
- Create: vault `decisions/ADR-012-gallery-v2-projects-page.md`
- Create: vault `decisions/ADR-013-personal-photo-threshold-feathered.md`
- Create: vault `decisions/ADR-014-tree-click-hint-sticker.md`
- Modify: vault `decisions/_index.md` (add three new entries)

**Acceptance Criteria:**
- [ ] Each ADR follows the project's standard structure: Decision · Context · Alternatives Considered · Benefits · Harms / Tradeoffs · Revisit If · See also.
- [ ] Each ADR references the spec section that motivated it.
- [ ] `decisions/_index.md` lists ADR-012, ADR-013, ADR-014 with one-line summaries.

**Verify:** `ls vault-path/decisions/ADR-01{2,3,4}*.md` shows all three.

**Steps:**

- [ ] **Step 1: Write ADR-012 — gallery v2 (projects page)**

Path: `<vault>/decisions/ADR-012-gallery-v2-projects-page.md`

Content (template — fill in the prose):

```markdown
---
tags: [adr, gallery, route]
---

# ADR-012 — Gallery v2: separate `/projects` route with vertical chapter spreads

**Status:** accepted
**Date:** 2026-05-22

## Context

Phase 4–5 shipped a manila-folder gallery (FolderShelf grid → FolderReader two-pane slide-up reader). User rejected the manila look in rev1 and clarified the desired structure in rev2: a separate top-nav "tab" for projects (a route, not in-section switching), with each project as a chapter spread containing cover media + narrative + cleaned-notes accordion + status/links + chapter rule. See [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.2]] for the full motivation.

## Decision

Add a `/projects` route (`src/pages/projects.astro`) that renders a vertical scroll of `<ProjectChapter>` components, one per entry in the `projects` collection. Remove `OnTheArtifacts` from the home page and delete the FolderShelf / FolderCard / FolderReader / manila-folder.css / folder-reader.ts files. Notes per project surface inline via native `<details>` blocks (`ProjectNotes.astro`), grouped by top-level directory.

## Alternatives Considered

- **Tabbed magazine spread (rev1 design).** Tabs across the top of the `on the artifacts` section, scattered-papers visual for docs. Rejected by the user in rev2 — "tab" meant a separate page, not in-section switching.
- **Keep the FolderShelf grid, just re-skin.** Minimal churn. Rejected — doesn't deliver the magazine-spread / chapter-story experience the user wanted.
- **Per-project deep routes (`/projects/<slug>`).** Each project becomes its own route. Rejected — adds N pages of overhead for marginal gain; one continuous page reads as the "tell a story through projects" structure the user described.

## Benefits

- Honors the user's verbatim rev2 brief (separate "tab" + chapters + cleaned notes inline).
- Removes the overlay / slide-up modality entirely. The page IS the reader.
- Native `<details>` accordion is keyboard- and screen-reader-friendly with zero JS focus management.
- Notes are now first-class content discoverable inline, reinforcing the traceability ethos ([[01 - Philosophy]]).
- Deletes more code than it adds (FolderShelf + FolderCard + FolderReader + folder-reader.ts + manila-folder.css → ProjectChapter + ProjectMedia + ProjectNotes + projects.astro + projects.css). Net negative complexity.

## Harms / Tradeoffs

- The `/projects` page is heavier than a single home-page section since all chapter content (story + every note) is rendered server-side at build. For the sample project (~2 KB markdown), this is negligible; if many projects with many notes are added, page weight may need to be revisited.
- Cross-route navigation costs a full page load (no SPA-style swap). Astro view transitions are an option later if the navigation feels jarring; deliberately deferred.
- The previous "scattered papers" visual is dropped. If the user later wants that aesthetic for a different purpose, it'd be a new primitive.

## Revisit If

- The `/projects` page exceeds ~150 KB of HTML weight (i.e., enough projects + notes to slow time-to-interactive on mobile).
- Cross-page navigation feels jarring (consider Astro view transitions).
- A future project's editorial structure outgrows the chapter-spread shape (e.g., needs sidebars, multiple columns) — then introduce a per-project layout slot.

## See also

- [[specs/2026-05-22-gallery-v2-photo-sticker-design]] — full design rationale.
- [[specs/2026-05-18-tree-leaves-folders-design]] — the prior gallery design (superseded in the gallery portion).
- [[01 - Philosophy#what this site has to do]] — traceability.
- [[Concept - Projects Page]] (forthcoming — written in this implementation pass).
- [[decisions/_index]].
```

- [ ] **Step 2: Write ADR-013 — personal photo, threshold, feathered**

Path: `<vault>/decisions/ADR-013-personal-photo-threshold-feathered.md`

```markdown
---
tags: [adr, photo, threshold, palette]
---

# ADR-013 — Personal photo: threshold top-right, feathered treatment

**Status:** accepted
**Date:** 2026-05-22

## Context

User provided two speaking-podium photographs (IMG_6565 preferred, IMG_6566 alternate) at `~/Desktop/portfolio_website_photos/`. Asked where and how to integrate one of them, considering full background-removal, click-to-enlarge, and placement. The threshold's portrait slot ([[Concept - Threshold Hero]]) was deferred awaiting a future portrait. The user's rev2 intuition: top-right of the main page.

## Decision

Place `IMG_6565` (renamed to `rafan-speaking-1.jpg`) **top-right of the threshold** via the reusable `<Photo>` primitive with `treatment="feathered"`: a radial CSS mask fades the edges to transparent (so the photo dissolves into parchment), plus a 12% warm sepia overlay so the photo harmonizes with the palette. Hover removes the grade (showing original colors as a subtle invitation). Click opens a lightbox at original colors and full size. No background removal. No paper frame. The original auto-discover portrait-slot logic is removed (this photo IS the portrait).

## Alternatives Considered

- **`on the work` placement (rev1 design).** Photo in the DDD card. Rejected by user in rev2 — they intuited threshold instead.
- **Full background removal (transparent PNG).** Considered. Rejected: cutout edges + loss of stage atmosphere; reduces "presenting" feel to "headshot."
- **Sepia paper frame, no feathering.** Considered. Rejected: hard rectangle floats awkwardly on parchment; doesn't match the literary aesthetic.
- **Keep the deferred portrait slot, use this only in a project gallery.** Rejected once user explicitly said "where would it be placed right? I feel like the top right of the main/first tab."

## Benefits

- Visual integration without photo-editing work (pure CSS mask + filter).
- Photo retains its stage atmosphere — the dark backdrop is part of why the gesture reads as presenting, not posing.
- Hover-clears-the-grade gives a quiet affordance that the original is one click away.
- Lightbox at original colors honors the photograph "as taken" — the page-level treatment is to harmonize, the lightbox is to look.
- Reusable `<Photo>` primitive (`feathered` / `frame` / `plain` treatments) covers future photo additions.

## Harms / Tradeoffs

- Radial mask via CSS is not supported equally everywhere; older browsers may show a hard-edged photo. Acceptable degradation (the photo still reads).
- 12% sepia is opinionated; a user with a strongly different palette preference might find it too warm. Tunable in `photo.css`.
- The deferred portrait slot is permanently reclaimed — a future deliberately-posed portrait would need its own slot or replace this photo.
- Single JPG ship (no AVIF/WebP at multiple widths) means a slightly heavier asset than ideal. Tracked in Open Questions.

## Revisit If

- Lighthouse perf budget pushes back on the single-JPG decision → add multi-format optimization.
- A deliberate portrait photo is taken — then either replace or add a slot.
- The feathered treatment tests poorly with users (e.g. the edges feel too soft or too sharp) → tune the mask stops in `photo.css`.

## See also

- [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.3]].
- [[Concept - Threshold Hero]] — updated in this pass to reflect the reclaimed slot.
- [[decisions/ADR-007-palette-sepia-shift]] — palette context for the sepia overlay.
- [[decisions/_index]].
```

- [ ] **Step 3: Write ADR-014 — tree click-hint sticker**

Path: `<vault>/decisions/ADR-014-tree-click-hint-sticker.md`

```markdown
---
tags: [adr, primitive, threshold, ux]
---

# ADR-014 — Tree click-hint sticker (ambient-hint primitive)

**Status:** accepted
**Date:** 2026-05-22

## Context

Phase 5 dialed the threshold tree backdrop to opacity 0.05 (residue treatment, [[decisions/ADR-011]] when written). The tree is still clickable to enter tree-mode, but at 0.05 opacity the affordance is invisible to a first-time visitor. User asked for a "little click here sticker that pops up for a second when the site loads to show where to click to edit the tree."

## Decision

Add a small hand-applied paper sticker (washi-tape strip, walnut italic display face, -3° rotation, drop-shadow) at the bottom-right of the threshold tree. Behavior:

- Appears at t=800 ms (post page-interactive); held 4 s; fades out 240 ms.
- Dismisses immediately on any user interaction (click, scroll, key, touch).
- Once dismissed (auto or manual), flagged in localStorage (`rq-tree-hint-seen=1`) and never shown again to that user.
- Doubles as a `[data-tree-open]` button — clicking it both dismisses and enters tree-mode.
- `prefers-reduced-motion: reduce` skips the fade animations.

The sticker is implemented as a new primitive (`tree-hint.ts` + `tree-hint.css`) that establishes the "ambient hint" pattern for the site. Future reuse candidates: a similar one-shot hint on the theme toggle, or on a new affordance the user wants to teach once.

## Alternatives Considered

- **Permanent caption near the tree.** Becomes furniture; fights the residue aesthetic. Rejected.
- **Animated arrow drawn on the canvas.** More code; harder to dismiss cleanly; fights the canvas draw loop. Rejected.
- **Tooltip on hover only.** Doesn't trigger on touch; first-time reader never gets the hint. Rejected.
- **Onboarding modal or carousel.** Heavy; performative. Rejected (over-explaining a single affordance).

## Benefits

- One-shot UX: explains the affordance, then disappears.
- Hand-applied feel matches the literary / handwritten aesthetic (sepia paper, washi-tape, Fraunces WONK italic).
- Reusable primitive idiom for future ambient hints.
- Zero permanent UI cost (after first dismissal, no DOM impact beyond a hidden `<button>`).

## Harms / Tradeoffs

- localStorage persistence means a user who clears their browser will see the sticker again. Acceptable.
- The 4 s hold + 240 ms fade is opinionated; could feel too long for power users (who'd dismiss it instantly anyway) or too short for slow readers. Tunable.
- The sticker requires JS to appear at all — without JS, the affordance is invisible. Acceptable for a portfolio site (JS is standard); not acceptable for a low-bandwidth-first product.

## Revisit If

- The sticker tests as overly insistent or invisible in actual use → tune timing or copy.
- A second one-shot hint is needed (e.g., on the theme toggle) → generalize `tree-hint` into an `ambient-hint` primitive with config.

## See also

- [[specs/2026-05-22-gallery-v2-photo-sticker-design#4.1]].
- [[Concept - Threshold Hero]] — updated to mention the sticker.
- [[decisions/ADR-010-tree-slider-labels]] — same threshold-room interaction surface.
- [[decisions/_index]].
```

- [ ] **Step 4: Update `decisions/_index.md`**

Add three new entries to the index (preserve the existing format — typically a table or list). Append at the bottom:

```markdown
| [[decisions/ADR-012-gallery-v2-projects-page|ADR-012]] | Gallery v2 — separate /projects route with vertical chapter spreads. Manila gallery removed. |
| [[decisions/ADR-013-personal-photo-threshold-feathered|ADR-013]] | Personal photo (IMG_6565) placed top-right of threshold, feathered mask + sepia overlay, lightbox on click. |
| [[decisions/ADR-014-tree-click-hint-sticker|ADR-014]] | First-load click-hint sticker on the threshold tree; once-per-user via localStorage. |
```

(If the index uses a different format — bulleted list, numbered list — match that format; don't introduce a new one.)

- [ ] **Step 5: Verify**

```bash
ls "<vault>/Programming/Portfolio_Website/decisions/" | grep -E "ADR-01[234]"
```
Expected: ADR-012, ADR-013, ADR-014 all present.

---

## Task 12 — Concept doc updates

**Goal:** Delete the obsolete `Concept - Manila Folder Gallery.md`. Write a new `Concept - Projects Page.md`. Update `Concept - Threshold Hero.md` to reflect the personal-photo placement + sticker.

**Files:**
- Delete: vault `Concept - Manila Folder Gallery.md`
- Create: vault `Concept - Projects Page.md`
- Modify: vault `Concept - Threshold Hero.md`

**Acceptance Criteria:**
- [ ] `Concept - Manila Folder Gallery.md` no longer exists.
- [ ] `Concept - Projects Page.md` exists, describes the route + chapter structure + notes accordion + the data model (no implementation details beyond the visual/interaction spec).
- [ ] `Concept - Threshold Hero.md` includes a section describing the personal-photo slot (treatment, position, lightbox) and the click-hint sticker.

**Verify:** `ls vault-path/Concept*.md` shows expected file list.

**Steps:**

- [ ] **Step 1: Delete `Concept - Manila Folder Gallery.md`**

```bash
rm "<vault>/Programming/Portfolio_Website/Concept - Manila Folder Gallery.md"
```

- [ ] **Step 2: Write `Concept - Projects Page.md`**

Path: `<vault>/Concept - Projects Page.md`. Write a concept doc following the format of the other `Concept - *.md` files (see e.g. `Concept - Threshold Hero.md`). Sections expected:

- `# Concept — Projects Page`
- `## What it is` — short paragraph
- `## Visual design` — ASCII mock + description of the chapter spread
- `## Data model` — `projects` + `projectFiles` collections, frontmatter, layout under `src/content/projects/<slug>/`
- `## Interaction details` — accordion default state, lightbox, direct-link hash format
- `## Accessibility` — native `<details>`, focus management is trivial (no modal), keyboard
- `## Open questions` — small follow-ups not yet decided
- `## See also` — links to the spec, ADR-012, the implementation files

Use the spec §4.2 as the source of truth; this concept doc is a durable summary, not a place to invent new design.

- [ ] **Step 3: Update `Concept - Threshold Hero.md`**

Add a new section near the bottom (after existing "Tree mode" content, before "See also"):

```markdown
## Personal photo slot (Phase 6)

The threshold's top-right slot, previously reserved for a deferred portrait,
is now occupied by `rafan-speaking-1.jpg` — a research-presentation photo
of Rafan at a URO symposium. Treatment:

- **Position:** `position: absolute; top: clamp(4rem, 8vh, 6rem); right: var(--gutter); width: clamp(200px, 32vw, 460px); z-index: 1;`
- **Feathered mask:** radial CSS mask fades the edges to transparent so the photo dissolves into parchment.
- **Sepia overlay:** `filter: sepia(0.12) saturate(0.88) brightness(0.94)` in light mode; tunes to `sepia(0.18) saturate(0.78) brightness(0.86)` in dark.
- **Hover clears the grade** (filter resets to `none`), as a quiet affordance that the original is one click away.
- **Click opens a lightbox** at original colors / full size; backdrop + × + Esc close.
- **Mobile (< 720 px):** stacks below the tagline, centered, ~60vw wide.
- **Tree-mode hides it** (same way the old portrait-slot was hidden).

The auto-discover `fs.readdirSync` logic in `Threshold.astro` is removed; the photo is referenced by an explicit `<Photo src="…" treatment="feathered" />` element. See [[decisions/ADR-013-personal-photo-threshold-feathered]].

## Tree click-hint sticker (Phase 6)

A small hand-applied paper sticker (washi-tape strip, walnut italic display face, slight -3° rotation) appears at the bottom-right of the threshold tree on first visit. Tells the reader the tree is clickable. Once dismissed (auto after 4 s + 240 ms fade, or on any user interaction), flagged in localStorage (`rq-tree-hint-seen=1`) and not shown again.

Doubles as a `[data-tree-open]` button — clicking it both dismisses and enters tree-mode. See [[decisions/ADR-014-tree-click-hint-sticker]].
```

- [ ] **Step 4: Verify**

```bash
ls "<vault>/Programming/Portfolio_Website/" | grep -E "Concept|MEMORY"
```
Expected: `Concept - Projects Page.md` present; `Concept - Manila Folder Gallery.md` absent.

---

## Task 13 — Architecture / Content Model / Index / Open Questions / Process Journal

**Goal:** Update the cross-reference docs to reflect the new architecture and content model. Append a Process Journal entry.

**Files:**
- Modify: vault `02 - Architecture.md`
- Modify: vault `03 - Content Model.md`
- Modify: vault `00 - Index.md`
- Modify: vault `Open Questions.md`
- Modify: vault `Process Journal.md`

**Acceptance Criteria:**
- [ ] `02 - Architecture.md` reflects: new files (`src/pages/projects.astro`, `src/components/project/`, `src/components/photo/`, `src/lib/primitives/{tree-hint,photo-lightbox}.ts`, `src/styles/{projects,photo,tree-hint}.css`); removed files (folders/, OnTheArtifacts, folder-reader.ts, manila-folder.css).
- [ ] `03 - Content Model.md` removes the `on the artifacts` home-section entry; adds a `/projects` page entry describing the chapter structure.
- [ ] `00 - Index.md` file inventory + sections-of-the-site map match reality (six home sections, plus the `/projects` route).
- [ ] `Open Questions.md`: "Portrait photo" marked resolved (this photo takes that slot); "Which projects to feature" still open (unchanged); a new entry "Multi-format image optimization" added (defer single-JPG ship until perf demands).
- [ ] `Process Journal.md` has a new entry dated 2026-05-22 (or implementation date) titled "Phase 6 — gallery v2 + photo + tree click-hint (implementation)" summarizing files added/removed + verification results.

**Verify:** Manual read-through of the modified docs.

**Steps:**

- [ ] **Step 1: Update `02 - Architecture.md`**

Find the file-tree section and:

- Add under `src/components/`:
  ```
  ├── project/
  │   ├── ProjectChapter.astro
  │   ├── ProjectMedia.astro
  │   └── ProjectNotes.astro
  └── photo/
      └── Photo.astro
  ```
- Remove `OnTheArtifacts.astro` and the entire `folders/` directory.
- Add under `src/pages/`:
  ```
  ├── index.astro
  ├── projects.astro            # NEW — /projects route (Phase 6)
  └── 404.astro
  ```
- Add under `src/lib/primitives/`:
  ```
  ├── tree-hint.ts              # NEW (Phase 6)
  └── photo-lightbox.ts         # NEW (Phase 6)
  ```
  Remove `folder-reader.ts`.
- Add under `src/styles/`:
  ```
  ├── projects.css              # NEW (Phase 6)
  ├── photo.css                 # NEW (Phase 6)
  └── tree-hint.css             # NEW (Phase 6)
  ```
  Remove `manila-folder.css`.

- [ ] **Step 2: Update `03 - Content Model.md`**

- Remove the entire `## on the artifacts` section.
- Add a new section after `## on the work`:

```markdown
## projects (separate page: `/projects`)

**File:** `src/pages/projects.astro`

The projects page. Vertical scroll, one chapter spread per project. Reads as a continuous story the user tells through the projects. See [[Concept - Projects Page]] for the visual + interaction design.

### Data source

Same as before:

```
src/content/projects/<slug>/
├── _index.md              ← project story (Markdown + frontmatter)
├── credits.md             ← optional loose file
├── field/*.md             ← cleaned field notes
├── decisions/*.md         ← ADRs / decision notes
└── images/*               ← screenshots (referenced from _index.md)
```

Frontmatter on `_index.md`:
```yaml
title: AdhkarCounter
tagline: a quiet counter for daily remembrance
sort_order: 10
github_url: https://github.com/rquader/AdhkarCounter
download_url: ~
cover_image: ./images/home.png
cover_video: ~          # NEW (Phase 6) — relative path to .mp4/.webm; if set, takes precedence over cover_image
status: shipped
```

### Per-chapter structure

Each `ProjectChapter` renders top to bottom:

1. Heading (title) + tagline.
2. Cover media — image OR video (per `cover_video > cover_image > empty` precedence).
3. Story prose (`_index.md` rendered).
4. Inline meta — status + github + download links.
5. Notes accordion — native `<details>` grouped by top-level directory (`field/` open by default; `decisions/` closed; other groups closed).
6. Chapter rule (omitted on the last chapter).

### Initial gallery roster

Same as before (see prior table) — final pick remains editorial.
```

(Carry over the candidate-project table from the original `## on the artifacts` block unchanged.)

- [ ] **Step 3: Update `00 - Index.md`**

- In the "sections of the site (the rooms)" list, remove item 4 (on the artifacts) and renumber.
- Add a paragraph or table entry below the section list pointing at `/projects` as a separate route.
- Update the "start here" table where `[[03 - Content Model]]` is mentioned, optionally adding `[[Concept - Projects Page]]` to the design-primitives list.

- [ ] **Step 4: Update `Open Questions.md`**

- Find the `### Portrait photo` block. Update its `**Status:**` line to:

  ```markdown
  - **Status:** RESOLVED 2026-05-22 — IMG_6565 placed in threshold top-right via `<Photo treatment="feathered">`. See [[decisions/ADR-013-personal-photo-threshold-feathered]].
  ```

  Optionally move this block to the `## Resolved` section.

- Add a new entry under `## Awaiting user input` or `## Design decisions to revisit after first paint`:

  ```markdown
  ### Multi-format image optimization (AVIF / WebP)
  - **Status:** deferred 2026-05-22. Phase 6 ships personal photo as a single JPG (~189 KB) for simplicity.
  - **What unlocks it:** Lighthouse / perf testing flags the JPG as too heavy, OR more photos are added and bandwidth becomes a concern.
  - **Plan:** introduce `sharp-cli` as a devDependency + a small `scripts/convert-photo.sh` that produces AVIF/WebP/JPG at 800/1200/1600 widths per source photo, referenced via `<picture><source srcset="…">` in `Photo.astro`.
  ```

- [ ] **Step 5: Append a Process Journal entry**

Add at the bottom of `Process Journal.md` (use the actual implementation date, not 2026-05-22 if it's a different day):

```markdown
---

## YYYY-MM-DD · Phase 6 — gallery v2 + personal photo + tree click-hint (implementation)

Implemented [[specs/2026-05-22-gallery-v2-photo-sticker-design]] (rev2) per [[specs/2026-05-22-gallery-v2-photo-sticker-plan]].

**New code:**

| layer | files |
|---|---|
| photo primitive | `src/components/photo/Photo.astro` (feathered/frame/plain treatments + caption + lightbox trigger) |
| photo lightbox | `src/lib/primitives/photo-lightbox.ts` + `src/layouts/Base.astro` markup |
| photo styles | `src/styles/photo.css` (mask + sepia overlay + lightbox) |
| project chapters | `src/components/project/{ProjectChapter,ProjectMedia,ProjectNotes}.astro` |
| projects page | `src/pages/projects.astro` + `src/styles/projects.css` |
| tree click-hint | `src/lib/primitives/tree-hint.ts` + `src/styles/tree-hint.css` + sticker markup in Threshold.astro |
| topnav | `src/components/TopNav.astro` (route-aware active state + `/projects ↗` link) |
| schema | `src/content/config.ts` (+cover_video) |

**Removed code:**

- `src/components/folders/` (whole dir: FolderShelf, FolderCard, FolderReader)
- `src/components/OnTheArtifacts.astro`
- `src/lib/primitives/folder-reader.ts`
- `src/styles/manila-folder.css`
- `Concept - Manila Folder Gallery.md` (vault doc)
- Auto-discover portrait-slot logic in `Threshold.astro` (replaced by explicit `<Photo>`)

**Verification:**

- ✅ `npm run check` — N files, 0 errors / warnings / hints.
- ✅ `npm run build` — `/` and `/projects` in sitemap. Total client JS roughly +X KB gz over the prior baseline.
- ✅ `GET /` HTML contains `threshold-photo`, `tree-hint` button, and NO `on-the-artifacts` / `reading-overlay`.
- ✅ `GET /projects` HTML contains chapter for the sample project, `field` group open by default, `decisions` group closed by default.

**ADRs written:** 012 (gallery v2), 013 (personal photo placement + treatment), 014 (click-hint sticker).

**Docs touched:** 00-Index, 02-Architecture, 03-Content Model, Concept - Projects Page (new), Concept - Threshold Hero (added photo + sticker sections), Open Questions (portrait resolved, multi-format added).

**Backlog ADRs 008–011** still owed from Phase 5; deferred to a future doc-pass per spec §6.

**What I'd flag for the user:**

- Caption under the personal photo is a placeholder; user writes the real one.
- Top + bottom framing prose on /projects are placeholders; user writes.
- The sample project remains as a placeholder so the projects page has visible content; user can replace via the content pipeline.
- Multi-format image optimization deferred — single JPG ships. Tracked in Open Questions.
```

(Fill in the actual file count and JS-size delta from the verification run.)

- [ ] **Step 6: Verify (manual)**

Skim each modified doc to confirm internal consistency: file inventories, section names, links. Spot-check that all `[[…]]` wikilinks resolve to real files in the vault.

---

# Self-review

After tasks 1–13 above are written:

- **Spec coverage** — Every spec section has a task:
  - §4.1 sticker → Task 4
  - §4.2 projects page → Tasks 5–8 (schema, media, notes, chapter, page)
  - §4.3 photo primitive + placement → Tasks 1, 2, 3
  - §3.2 removed code → Task 10
  - §3.4 schema → Task 5
  - §8 doc updates → Tasks 11, 12, 13
- **Placeholder scan** — All steps contain actual code or specific commands. No "implement later", no "TBD".
- **Type consistency** — `<Photo>` props (`src`, `alt`, `caption`, `treatment`, `aspect`, `lightbox`) used consistently across tasks 2, 3, 5. Native `<details>` markup consistent across tasks 6, 8. `data-tree-open` selector used consistently in tasks 4 and 9.
