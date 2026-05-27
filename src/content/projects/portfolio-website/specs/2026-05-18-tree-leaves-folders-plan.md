# Tree-Leaves-Folders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the page-wide falling-leaves backdrop, modular folder primitive with multi-file Obsidian-style content, and Obsidian-styled note rendering, exactly as specified in [[specs/2026-05-18-tree-leaves-folders-design]].

**Architecture:** Five interlocking changes — (1) a fixed page-wide canvas drifting FOREST leaf polygons; (2) split of monolithic Manila gallery into `<FolderShelf>` + `<FolderCard>` + `<FolderReader>`; (3) content collection upgrade to `_index.md` + arbitrary nested `*.md` + `images/` + `videos/`; (4) two-pane Obsidian-style reading panel; (5) a scoped `obsidian-notes.css` layer plus a small primitive that wraps `<strong>` characters so the existing inertial-type flashlight color-reveal applies to bolds.

**Tech Stack:** Astro 5.x, TypeScript strict, hand-written CSS, canvas 2D. No new dependencies. Verification: `astro check`, `astro build`, curl + grep against the dev server. No unit-test framework in the repo and none added here — the cost-benefit on a static-site canvas+Astro refactor doesn't justify the setup overhead.

**Verification policy.** Every code task ends in a verify step that runs `npm run check`, `npm run build`, and (where the change is HTML-visible) a curl + grep against the dev server. Visual fidelity needs the human eye and is enumerated in the spec's §7; the plan flags it where applicable.

**No git commits.** User explicitly retained commit authority. Tasks DO NOT run `git add` or `git commit`. The user reviews and commits when ready.

---

## Plan-level acceptance

- `npm run check` clean (0 errors / 0 warnings / 0 hints across all files).
- `npm run build` produces a clean build, total client JS budget ≤ 25 KB raw / 10 KB gz.
- Dev server `GET /` returns HTML containing:
  - `<canvas id="page-leaves">` (page-wide backdrop)
  - `<canvas id="tree-threshold">` (unchanged threshold backdrop)
  - the reading-panel overlay with the new two-pane structure
  - one `<article data-slug-path>` for each `.md` file in every project folder
- Spec §9 doc updates are present in the Obsidian vault.
- Four ADRs (007–010) are written.
- Process Journal entry appended.
- Memory mirror updated.

---

## Task 0 — Kick off the Manim render in the background

**Goal:** Start the 6-minute `FallingLeavesForestBackdrop` render so the MP4 reference exists by the time we want to eyeball the JS port.

**Files:**
- Verify: `~/Developer/Manim_Wallpaper/scenes/falling_leaves_forest.py` exists (drafted 2026-05-18).
- Output target: `~/Developer/Manim_Wallpaper/output/finals/08_falling_leaves_forest.mp4`.

**Acceptance Criteria:**
- [ ] Render command kicked off in background via `run_in_background: true`.
- [ ] Render exits 0; output mp4 ≥ 100 KB.

**Verify:**
`ls -lh ~/Developer/Manim_Wallpaper/output/finals/08_falling_leaves_forest.mp4`
→ expected: file present, mp4 size in MB range.

**Steps:**

- [ ] **Step 1: kick off the render**

```bash
cd ~/Developer/Manim_Wallpaper
./render.sh scenes/falling_leaves_forest.py FallingLeavesForestBackdrop -o 08_falling_leaves_forest
```

Run with `run_in_background: true` on the Bash tool. The script auto-backgrounds with `nohup` underneath; capture the shell ID.

- [ ] **Step 2: continue with other tasks; come back to verify after Task ~12**

The render is not on the critical path for the JS port. Verify completion before Task 22 (the Manim companion doc).

---

## Task 1 — Falling-leaves TypeScript module

**Goal:** Implement the page-wide falling-leaves algorithm as a standalone TS module reusing `leafVerts()` from `leaf.ts` and FOREST tones from `palettes.ts`.

**Files:**
- Create: `src/lib/backdrop/falling-leaves.ts`
- Read (no edit): `src/lib/backdrop/leaf.ts`, `src/lib/backdrop/palettes.ts`, `src/lib/backdrop/rng.ts`, `src/lib/backdrop/easing.ts`, `src/lib/boot.ts`, `src/lib/reduced-motion.ts`
- Modify: `src/lib/backdrop/leaf.ts` — extract `leafVerts(sizePx)` (currently a local `function leafVerts`) into an exported helper so falling-leaves.ts can reuse it without duplication.

**Acceptance Criteria:**
- [ ] `mountFallingLeaves(canvas, opts)` returns a handle with `setOpacity()`, `stop()`.
- [ ] 45 leaves split across 3 layers (45/35/20% weights) with opacities 0.28/0.55/0.82.
- [ ] Integer-cycle motion: fall cycles ∈ {1,1,1,1,2}, sway cycles ∈ {1,1,2}, rotation cycles ∈ {-1,0,0,0,0,1}.
- [ ] Loop period = 12 s; at t=12 the field is pixel-identical to t=0 (within float-precision noise).
- [ ] Uses the canonical `leafVerts` from `leaf.ts`.
- [ ] DPR-aware sizing (same pattern as `tree.ts`: `ctx.setTransform(dpr,…)`, CSS box in CSS px).
- [ ] `prefers-reduced-motion: reduce` → tick is a no-op; static frame.
- [ ] No `any`. No globals. No build warnings.

**Verify:**
```bash
cd ~/Developer/Portfolio_Website
npm run check
```
→ expected: 0 errors, 0 warnings.

**Steps:**

- [ ] **Step 1: extract `leafVerts` from leaf.ts into an exported helper**

Edit `src/lib/backdrop/leaf.ts`. The current internal `function leafVerts(sizePx)` (lines ~61–76) becomes:

```typescript
/**
 * Canonical 10-vertex leaf polygon in Manim-native coordinates with tip
 * at +y. Exported so both the recursive-tree leaf renderer and the
 * page-wide falling-leaves backdrop draw the same shape.
 */
export function leafVerts(sizePx: number): readonly (readonly [number, number])[] {
  const h = sizePx;
  const w = sizePx * 0.55;
  return [
    [0, h],
    [w * 0.55, h * 0.65],
    [w, h * 0.20],
    [w * 0.60, -h * 0.25],
    [w * 0.20, -h * 0.48],
    [0, -h * 0.58],
    [-w * 0.20, -h * 0.48],
    [-w * 0.60, -h * 0.25],
    [-w, h * 0.20],
    [-w * 0.55, h * 0.65],
  ];
}
```

The local `function leafVerts` deletes; `drawLeaves` calls the exported version unchanged.

- [ ] **Step 2: write `src/lib/backdrop/falling-leaves.ts`**

```typescript
/**
 * @file falling-leaves.ts
 *
 * Page-wide drifting-leaf backdrop. Ports
 * ~/Developer/Manim_Wallpaper/scenes/falling_leaves_forest.py.
 *
 * Stylized 10-vertex leaf polygons (same shape as the recursive_tree
 * canopy) in FOREST tones drift downward across 3 parallax depth
 * layers. Integer-cycle motion gives a seamless 12 s loop.
 *
 * Mount via `mountFallingLeaves(canvas, opts)`. The handle exposes
 * setOpacity(o) and stop(). The canvas is sized DPR-aware just like
 * the tree.
 *
 * Reduced motion: rAF tick is a no-op; static frame remains.
 *
 * Spec: [[Concept - Falling Leaves Backdrop]] in the Obsidian docs;
 *       [[specs/2026-05-18-tree-leaves-folders-design#4.1]].
 */

import { registerTick } from '../boot';
import { isReducedMotion } from '../reduced-motion';
import { FOREST, type Palette } from './palettes';
import { mulberry32 } from './rng';
import { sinWave } from './easing';
import { leafVerts } from './leaf';

const FRAME_UNITS_HEIGHT = 8;
const DURATION = 12.0;

const NUM_LEAVES = 45;
const RNG_SEED = 113;

const LAYER_COUNT_WEIGHTS = [0.45, 0.35, 0.20] as const;
const LAYER_SIZE_RANGES: readonly (readonly [number, number])[] = [
  [0.08, 0.13],
  [0.13, 0.18],
  [0.18, 0.24],
];
const LAYER_OPACITY = [0.28, 0.55, 0.82] as const;

const SWAY_AMP = 0.34;
const FALL_CYCLE_CHOICES = [1, 1, 1, 1, 2] as const;
const SWAY_CYCLE_CHOICES = [1, 1, 2] as const;
const ROT_CYCLE_CHOICES = [-1, 0, 0, 0, 0, 1] as const;

interface Leaf {
  baseX: number;
  baseProgress: number;
  size: number;            // Manim units
  color: string;
  opacity: number;
  fallCycles: number;
  swayCycles: number;
  swayPhase: number;
  rotCycles: number;
  rotPhase: number;
  tilt: number;
}

export interface FallingLeavesOptions {
  palette?: 'forest';
  numLeaves?: number;
  opacity?: number;
  seed?: number;
  ariaHidden?: boolean;
}

export interface FallingLeavesHandle {
  setOpacity(o: number): void;
  stop(): void;
}

function pickLayer(rng: ReturnType<typeof mulberry32>): number {
  const r = rng.random();
  let acc = 0;
  for (let i = 0; i < LAYER_COUNT_WEIGHTS.length; i++) {
    acc += LAYER_COUNT_WEIGHTS[i] as number;
    if (r < acc) return i;
  }
  return LAYER_COUNT_WEIGHTS.length - 1;
}

function buildLeaves(rng: ReturnType<typeof mulberry32>, frameWidth: number, count: number, palette: Palette): Leaf[] {
  const leafPalette: readonly string[] = [
    palette.tones[palette.tones.length - 2] ?? palette.tones[0] ?? palette.accent,
    palette.tones[palette.tones.length - 1] ?? palette.tones[0] ?? palette.accent,
    palette.accent,
  ];
  const out: Leaf[] = [];
  for (let i = 0; i < count; i++) {
    const layer = pickLayer(rng);
    const sizeRange = LAYER_SIZE_RANGES[layer] as readonly [number, number];
    out.push({
      baseX: rng.uniform(-frameWidth / 2 + 0.25, frameWidth / 2 - 0.25),
      baseProgress: rng.random(),
      size: rng.uniform(sizeRange[0], sizeRange[1]),
      color: rng.choice(leafPalette),
      opacity: LAYER_OPACITY[layer] as number,
      fallCycles: rng.choice(FALL_CYCLE_CHOICES),
      swayCycles: rng.choice(SWAY_CYCLE_CHOICES),
      swayPhase: rng.random(),
      rotCycles: rng.choice(ROT_CYCLE_CHOICES),
      rotPhase: rng.uniform(0, 2 * Math.PI),
      tilt: rng.uniform(0, 2 * Math.PI),
    });
  }
  return out;
}

interface CanvasMap {
  cw: number;
  ch: number;
  u: number;
  toX(mx: number): number;
  toY(my: number): number;
}

function makeCanvasMap(cssW: number, cssH: number, frameHeight: number): CanvasMap {
  const u = cssH / frameHeight;
  return {
    cw: cssW,
    ch: cssH,
    u,
    toX(mx: number): number {
      return cssW / 2 + mx * u;
    },
    toY(my: number): number {
      return cssH / 2 - my * u;
    },
  };
}

export function mountFallingLeaves(canvas: HTMLCanvasElement, opts: FallingLeavesOptions = {}): FallingLeavesHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('mountFallingLeaves: 2d context unavailable');

  const palette: Palette = FOREST;
  let opacity = opts.opacity ?? 1.0;
  const seed = opts.seed ?? RNG_SEED;
  const count = opts.numLeaves ?? NUM_LEAVES;
  if (opts.ariaHidden !== false) canvas.setAttribute('aria-hidden', 'true');

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let map: CanvasMap = makeCanvasMap(1, 1, FRAME_UNITS_HEIGHT);
  let leaves: Leaf[] = [];
  let topY = 0;
  let span = 0;

  function configure(): void {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, Math.round(rect.width || canvas.clientWidth || canvas.width || 1));
    cssH = Math.max(1, Math.round(rect.height || canvas.clientHeight || canvas.height || 1));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    map = makeCanvasMap(cssW, cssH, FRAME_UNITS_HEIGHT);
  }

  function rebuild(): void {
    const rng = mulberry32(seed);
    const frameWidth = cssH > 0 ? (cssW / cssH) * FRAME_UNITS_HEIGHT : FRAME_UNITS_HEIGHT;
    leaves = buildLeaves(rng, frameWidth, count, palette);
    let maxSize = 0;
    for (const l of leaves) if (l.size > maxSize) maxSize = l.size;
    const margin = maxSize * 0.8;
    topY = FRAME_UNITS_HEIGHT / 2 + margin;
    span = FRAME_UNITS_HEIGHT + 2 * margin;
  }

  function draw(t: number): void {
    if (cssW < 2 || cssH < 2) return;
    ctx!.clearRect(0, 0, cssW, cssH);
    for (const l of leaves) {
      const progress = (l.baseProgress + (l.fallCycles * t) / DURATION) % 1.0;
      const y = topY - progress * span;
      const swayPeriod = DURATION / l.swayCycles;
      const x = l.baseX + SWAY_AMP * sinWave(t, swayPeriod, l.swayPhase);
      const angle = l.tilt + 2 * Math.PI * l.rotCycles * (t / DURATION) + l.rotPhase;

      const cx = map.toX(x);
      const cy = map.toY(y);
      const sizePx = l.size * map.u;
      const verts = leafVerts(sizePx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      ctx!.globalAlpha = l.opacity * opacity;
      ctx!.fillStyle = l.color;
      ctx!.beginPath();
      for (let i = 0; i < verts.length; i++) {
        const v = verts[i] as readonly [number, number];
        const rx = cos * v[0] - sin * v[1];
        const ry = sin * v[0] + cos * v[1];
        const px = cx + rx;
        const py = cy - ry;
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.closePath();
      ctx!.fill();
    }
    ctx!.globalAlpha = 1.0;
  }

  configure();
  rebuild();
  draw(0);

  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
        configure();
        rebuild();
        draw(isReducedMotion() ? 0 : performance.now() / 1000);
      })
    : null;
  ro?.observe(canvas);

  const unregister = registerTick((_dt, t) => {
    if (isReducedMotion()) return;
    draw(t / 1000);
  });

  return {
    setOpacity(o: number): void {
      opacity = o;
    },
    stop(): void {
      unregister();
      ro?.disconnect();
    },
  };
}
```

- [ ] **Step 3: run type-check**

Run: `npm run check`
Expected: PASS, 0 errors, 0 warnings.

---

## Task 2 — Page-wide canvas mount + CSS

**Goal:** Add the `<canvas id="page-leaves">` to `Base.astro` at z-index −2 and wire `mountFallingLeaves` into `site-init.ts`.

**Files:**
- Modify: `src/layouts/Base.astro` (insert canvas just inside `<body>`).
- Create: `src/styles/falling-leaves.css`.
- Modify: `src/lib/site-init.ts` (mount on the canvas if present).
- Modify: `src/styles/global.css` (import the new CSS).

**Acceptance Criteria:**
- [ ] `GET /` HTML contains `<canvas id="page-leaves" class="page-leaves-bg" aria-hidden="true">`.
- [ ] Canvas is `position: fixed; inset: 0; z-index: -2; pointer-events: none`.
- [ ] Site type-checks and builds clean.

**Verify:**
```bash
npm run dev &
sleep 2
curl -s http://localhost:4321/ | grep -c 'id="page-leaves"'
# expected: 1
pkill -f 'astro dev' || true
```

**Steps:**

- [ ] **Step 1: write `src/styles/falling-leaves.css`**

```css
/* falling-leaves.css — page-wide leaf backdrop.
   The canvas sits behind everything, including the threshold tree
   (which lives at z-index: -1 within its section). pointer-events:none
   so it never interferes with clicks. Spec:
   [[specs/2026-05-18-tree-leaves-folders-design#4.1]]. */

.page-leaves-bg {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  z-index: -2;
  pointer-events: none;
  /* Subtle fade-in on first paint so the leaves don't pop. */
  opacity: 0;
  animation: page-leaves-fade-in 1.6s ease-out forwards;
}

@keyframes page-leaves-fade-in {
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .page-leaves-bg {
    animation: none;
    opacity: 1;
  }
}
```

- [ ] **Step 2: import the new CSS from `global.css`**

Edit `src/styles/global.css` and add at the appropriate import block:
```css
@import './falling-leaves.css';
```

- [ ] **Step 3: insert canvas in `Base.astro`**

Place the canvas as the FIRST child inside `<body>`, before the skip-link:
```astro
<body>
  <canvas id="page-leaves" class="page-leaves-bg" aria-hidden="true"></canvas>
  <a class="skip-link" href="#on-me">skip to content</a>
  …
</body>
```

- [ ] **Step 4: mount in `site-init.ts`**

Add to the top of `initSite()`, just before `startBoot()`:
```typescript
import { mountFallingLeaves } from './backdrop/falling-leaves';
…
export function initSite(): void {
  const pageLeaves = document.getElementById('page-leaves');
  if (pageLeaves instanceof HTMLCanvasElement) {
    mountFallingLeaves(pageLeaves, { palette: 'forest' });
  }
  startBoot();
  …
}
```

- [ ] **Step 5: verify**

Run: `npm run check && npm run build`
Expected: clean.

Run dev server:
```bash
npm run dev &
sleep 2
curl -s http://localhost:4321/ | grep -c 'id="page-leaves"'
```
Expected: `1`.

Stop dev server: `pkill -f 'astro dev' || true`

---

## Task 3 — Content collection schema upgrade

**Goal:** Extend `src/content/config.ts` to support `_index.md` + nested `**/*.md` under each project folder.

**Files:**
- Modify: `src/content/config.ts`.

**Acceptance Criteria:**
- [ ] `projects` collection globs `**/_index.md` (slug = parent directory name).
- [ ] New `projectFiles` collection globs `**/*.md` excluding `**/_index.md`.
- [ ] `projectNotes` collection removed.
- [ ] Schemas: `projects` requires `title`, `tagline`, `sort_order`; everything else optional. `projectFiles` schema has optional `title`, `sort_order`.
- [ ] `npm run check` clean.

**Verify:**
```bash
npm run check && npm run build
```
Expected: clean (the empty/limited content collection may emit one notice; that's fine).

**Steps:**

- [ ] **Step 1: rewrite `src/content/config.ts`**

```typescript
/**
 * @file content/config.ts
 *
 * Astro content collections for the project gallery.
 *
 * Each project folder lives at `src/content/projects/<slug>/`. The
 * folder MUST contain `_index.md` (Obsidian's landing-file convention),
 * and MAY contain any number of additional `.md` files at any nesting
 * depth (e.g., `credits.md`, `decisions/ADR-001-foo.md`,
 * `field/architecture.md`), plus `images/` and `videos/` asset
 * subfolders that are referenced from markdown via relative paths.
 *
 * Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.3]].
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/_index.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    sort_order: z.number(),
    github_url: z.string().url().optional(),
    download_url: z.string().url().optional(),
    cover_image: z.string().optional(),
    status: z.enum(['archived', 'active', 'shipped']).default('shipped'),
  }),
});

const projectFiles = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_index.md'],
    base: './src/content/projects',
  }),
  schema: z.object({
    title: z.string().optional(),
    sort_order: z.number().optional().default(0),
  }),
});

export const collections = { projects, projectFiles };
```

- [ ] **Step 2: verify build**

Run: `npm run check`
Expected: 0 errors. (Type errors may surface in ReadingPanel.astro because it still imports `projectNotes`; that's fine — fixed in Task 7.)

---

## Task 4 — Migrate the sample project to the new layout

**Goal:** Move `sample/index.md + notes/*.md` to `sample/_index.md + decisions/*.md + field/*.md + credits.md`.

**Files:**
- Move: `src/content/projects/sample/index.md` → `src/content/projects/sample/_index.md`.
- Move: `src/content/projects/sample/notes/architecture.md` → `src/content/projects/sample/field/architecture.md`.
- Move: `src/content/projects/sample/notes/journal-sample.md` → `src/content/projects/sample/field/journal-sample.md`.
- Create: `src/content/projects/sample/decisions/ADR-001-placeholder.md`.
- Create: `src/content/projects/sample/credits.md`.
- Delete: `src/content/projects/sample/notes/` (after moves).

**Acceptance Criteria:**
- [ ] `sample/_index.md` has the frontmatter from the old `index.md` and renders the same body.
- [ ] Both moved field notes retain their bodies; their frontmatter has `title` and `sort_order: 0`.
- [ ] ADR-001 placeholder and credits.md are minimal placeholder content (marker-style per Working Agreement 7).

**Verify:**
```bash
ls src/content/projects/sample/
# expected: _index.md  credits.md  decisions/  field/  (no notes/, no index.md)
```

**Steps:**

- [ ] **Step 1: move files**

```bash
cd ~/Developer/Portfolio_Website/src/content/projects/sample
mkdir -p decisions field
git mv index.md _index.md 2>/dev/null || mv index.md _index.md
git mv notes/architecture.md field/architecture.md 2>/dev/null || mv notes/architecture.md field/architecture.md
git mv notes/journal-sample.md field/journal-sample.md 2>/dev/null || mv notes/journal-sample.md field/journal-sample.md
rmdir notes
```

- [ ] **Step 2: write `credits.md`**

```markdown
---
title: credits
sort_order: 90
---

[PLACEHOLDER — credit notes for this project go here. Inspirations,
prior art, contributing tools, libraries.]
```

- [ ] **Step 3: write `decisions/ADR-001-placeholder.md`**

```markdown
---
title: ADR-001 — placeholder decision
sort_order: 1
---

[PLACEHOLDER — sample ADR demonstrating the folder structure. Real
ADRs follow the format in
[[Working Agreements#1. Tradeoff documentation is mandatory]]:

**Decision** · **Context** · **Alternatives Considered** ·
**Benefits** · **Harms / Tradeoffs** · **Revisit If**.]
```

- [ ] **Step 4: verify**

Run: `npm run check`
Expected: clean. (Build may not yet pass because Reading-related components still reference the old shape — fixed by Task 7.)

---

## Task 5 — `<FolderCard>` component

**Goal:** Extract the closed-state folder card into a standalone, drop-anywhere component.

**Files:**
- Create: `src/components/folders/FolderCard.astro`.
- Delete: `src/components/ProjectCard.astro` (will be removed once Task 6 replaces uses).
- Keep `manila-folder.css` for now; visual refresh in Task 11.

**Acceptance Criteria:**
- [ ] Component takes a `project: CollectionEntry<'projects'>` prop.
- [ ] Renders as `<a class="project-card" href="#project-<id>" data-slug="<id>">`.
- [ ] Visually identical to today's ProjectCard.astro output.

**Verify:** Build clean (post Task 7 which fixes the imports).

**Steps:**

- [ ] **Step 1: create folder + file**

```bash
mkdir -p ~/Developer/Portfolio_Website/src/components/folders
```

- [ ] **Step 2: write `FolderCard.astro`**

```astro
---
// FolderCard — one folder in the closed-state shelf. Also usable
// embedded inline in prose (e.g., on a future /projects page).
//
// Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.2]].

import type { CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
}

const { project } = Astro.props;
const { title, tagline, cover_image, github_url, status } = project.data;
---
<a
  class="project-card"
  href={`#project-${project.id}`}
  data-slug={project.id}
  data-status={status}
>
  <div class="card-tab" aria-hidden="true"></div>
  {cover_image ? (
    <div class="card-cover">
      <img src={cover_image} alt={`${title} cover`} loading="lazy" />
    </div>
  ) : (
    <div class="card-cover no-image" aria-hidden="true"></div>
  )}
  <div class="card-body">
    <h3 class="card-title">{title}</h3>
    <p class="card-tagline">{tagline}</p>
    {github_url && (
      <p class="card-meta">github</p>
    )}
  </div>
</a>
```

---

## Task 6 — `<FolderShelf>` component

**Goal:** Grid wrapper that takes a `source` (collection name) and renders one `FolderCard` per entry sorted by `sort_order`.

**Files:**
- Create: `src/components/folders/FolderShelf.astro`.

**Acceptance Criteria:**
- [ ] Component takes a `source: 'projects'` prop (extensible to other collections later).
- [ ] Renders a `<div class="shelf">` containing one `<FolderCard>` per entry.
- [ ] Renders the empty-state placeholder if no entries.

**Verify:** Build clean (post Task 7 which removes the stale gallery imports).

**Steps:**

- [ ] **Step 1: write `FolderShelf.astro`**

```astro
---
// FolderShelf — grid of FolderCards drawn from a content collection.
// One drop-in component for the `on the artifacts` section today, and
// reusable on a future /projects page.
//
// Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.2]].

import { getCollection } from 'astro:content';
import FolderCard from './FolderCard.astro';

interface Props {
  source: 'projects';
}

const { source } = Astro.props;
const entries = (await getCollection(source)).sort(
  (a, b) => a.data.sort_order - b.data.sort_order,
);
---
{entries.length > 0 ? (
  <div class="shelf">
    {entries.map((p) => <FolderCard project={p} />)}
  </div>
) : (
  <p class="empty">
    [PLACEHOLDER — projects auto-render here from <code>src/content/projects/&lt;slug&gt;/</code>. Drop a real folder via the content pipeline (see <em>04 - Content Pipeline</em> in the Obsidian docs).]
  </p>
)}

<style>
  .empty code, .empty em {
    font-family: var(--face-mono);
    font-size: 0.9em;
    color: var(--paper-2);
    font-style: normal;
  }
</style>
```

---

## Task 7 — Replace OnTheArtifacts with FolderShelf

**Goal:** `OnTheArtifacts.astro` becomes a thin wrapper around `<FolderShelf source="projects" />`. Remove the now-unused ProjectCard.astro.

**Files:**
- Modify: `src/components/OnTheArtifacts.astro`.
- Delete: `src/components/ProjectCard.astro`.

**Acceptance Criteria:**
- [ ] `OnTheArtifacts.astro` imports FolderShelf and renders `<FolderShelf source="projects" />` inside the section wrapper.
- [ ] `src/components/ProjectCard.astro` is removed.
- [ ] Site type-checks. Build will still fail until Task 8 removes the old ReadingPanel.

**Verify:**
```bash
npm run check
# expected: 0 TS errors
```

**Steps:**

- [ ] **Step 1: rewrite `OnTheArtifacts.astro`**

```astro
---
// On The Artifacts — the manila-folder project gallery.
//
// Today: renders one shelf from the `projects` collection.
// Tomorrow: a dedicated /projects page can compose FolderShelf and
// FolderCard inline with prose. The FolderReader (slide-up two-pane)
// is mounted globally in src/pages/index.astro.
//
// Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.2]];
//       [[03 - Content Model#on the artifacts]].

import FolderShelf from './folders/FolderShelf.astro';
import '../styles/manila-folder.css';
---
<section class="section on-the-artifacts" id="on-the-artifacts" data-section-id="on-the-artifacts">
  <div class="section-inner">
    <h2 data-color-letters data-inertial-text>on the artifacts</h2>
    <FolderShelf source="projects" />
  </div>
</section>
```

- [ ] **Step 2: delete `ProjectCard.astro`**

```bash
rm ~/Developer/Portfolio_Website/src/components/ProjectCard.astro
```

- [ ] **Step 3: type-check**

Run: `npm run check`
Expected: 0 errors. (Still depends on Task 8/9 for the new reading panel; build may still fail.)

---

## Task 8 — `<FolderReader>` component (two-pane skeleton)

**Goal:** New global reader with the two-pane layout. Replaces ReadingPanel.astro. Statically renders every project's every file inline.

**Files:**
- Create: `src/components/folders/FolderReader.astro`.
- Delete: `src/components/ReadingPanel.astro`.

**Acceptance Criteria:**
- [ ] Renders one `<article class="rp-project" data-slug-path="<slug>/<path>" hidden>` per `.md` file in every project.
- [ ] Each project's `_index.md` article has `data-slug-path="<slug>/_index"`.
- [ ] Tree state for each project inlined as `<script type="application/json" class="folder-tree" data-slug="<slug>">…</script>`.
- [ ] Has the two-pane DOM skeleton: `<aside class="rp-tree-pane">` (target for tree render) + `<div class="rp-content-pane">` (articles live here).
- [ ] Site type-checks.

**Verify:**
```bash
npm run check
```

**Steps:**

- [ ] **Step 1: write `FolderReader.astro`**

```astro
---
// FolderReader — page-global slide-up reading panel with a two-pane
// Obsidian-style layout: file tree (left) + content (right).
//
// All files for all projects rendered upfront, hidden via the `hidden`
// attribute. JS swaps visibility; nothing async. The tree's hierarchy
// is also computed at build time and inlined as a JSON blob the JS
// reads on init.
//
// Rendered OUTSIDE <main> so the folder-reader primitive can `inert`
// main while open (structural focus-trap, no JS focus-loop).
//
// Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.4]];
//       [[Concept - Folder Primitive]] in the Obsidian docs.

import { getCollection, render } from 'astro:content';

interface Props {
  source: 'projects';
}

const { source } = Astro.props;
const projects = (await getCollection(source)).sort(
  (a, b) => a.data.sort_order - b.data.sort_order,
);

// All non-_index files keyed by parent slug.
const allFiles = await getCollection('projectFiles');
type FileEntry = typeof allFiles[number];
const filesBySlug = new Map<string, FileEntry[]>();
for (const f of allFiles) {
  const slug = f.id.split('/')[0];
  if (!slug) continue;
  const list = filesBySlug.get(slug);
  if (list) list.push(f);
  else filesBySlug.set(slug, [f]);
}

interface TreeNode {
  kind: 'file' | 'folder';
  label: string;
  /** For files: the inline-path key matching data-slug-path */
  path?: string;
  children?: TreeNode[];
}

function buildTree(slug: string, files: FileEntry[]): TreeNode[] {
  // Root has _index synthetic plus a tree of files grouped by their
  // intermediate directories.
  const rootChildren: TreeNode[] = [];
  rootChildren.push({ kind: 'file', label: '_index', path: `${slug}/_index` });

  // Each file's id is `<slug>/<...rel-path-no-ext>`. Strip the slug.
  type Leaf = { segments: string[]; pathKey: string; title: string };
  const leaves: Leaf[] = files
    .map((f) => {
      const rel = f.id.slice(slug.length + 1); // drop "<slug>/"
      const segments = rel.split('/');
      return {
        segments,
        pathKey: `${slug}/${rel}`,
        title: f.data.title ?? (segments[segments.length - 1] ?? rel),
      };
    })
    .sort((a, b) => {
      // Stable directory-first sort: folder depth descending, then
      // sort_order, then alpha.
      const so = (allFiles.find((x) => x.id === a.pathKey)?.data.sort_order ?? 0)
               - (allFiles.find((x) => x.id === b.pathKey)?.data.sort_order ?? 0);
      if (so !== 0) return so;
      return a.pathKey.localeCompare(b.pathKey);
    });

  for (const leaf of leaves) {
    let cursor = rootChildren;
    for (let i = 0; i < leaf.segments.length - 1; i++) {
      const dir = leaf.segments[i] as string;
      let next = cursor.find((c) => c.kind === 'folder' && c.label === dir);
      if (!next) {
        next = { kind: 'folder', label: dir, children: [] };
        cursor.push(next);
      }
      cursor = next.children as TreeNode[];
    }
    cursor.push({
      kind: 'file',
      label: leaf.title,
      path: leaf.pathKey,
    });
  }
  return rootChildren;
}

const allRendered = await Promise.all(
  projects.map(async (project) => {
    const { Content: IndexContent } = await render(project);
    const files = filesBySlug.get(project.id) ?? [];
    const fileRenders = await Promise.all(
      files.map(async (file) => {
        const { Content } = await render(file);
        return { file, Content };
      }),
    );
    const tree = buildTree(project.id, files);
    return { project, IndexContent, fileRenders, tree };
  }),
);
---
{projects.length > 0 && (
  <div
    id="reading-overlay"
    class="reading-overlay"
    data-state="closed"
    aria-hidden="true"
  >
    <div class="reading-backdrop" data-rp-close="true"></div>
    <div
      class="reading-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rp-active-title"
      tabindex="-1"
    >
      <header class="rp-head">
        <a class="rp-back" href="#on-the-artifacts" data-rp-close="true">◂ back to the shelf</a>
        <button class="rp-close" type="button" aria-label="close" data-rp-close="true">×</button>
      </header>

      {allRendered.map(({ project, tree }) => (
        <script
          type="application/json"
          class="folder-tree"
          data-slug={project.id}
          set:html={JSON.stringify(tree)}
        />
      ))}

      <div class="rp-body">
        <aside class="rp-tree-pane" aria-label="files">
          <button class="rp-tree-toggle" type="button" aria-expanded="true">
            Files <span class="rp-tree-chev" aria-hidden="true">▾</span>
          </button>
          <nav class="rp-tree" aria-label="folder navigation"></nav>
        </aside>

        <div class="rp-content-pane">
          {allRendered.map(({ project, IndexContent, fileRenders }) => (
            <>
              <article
                class="rp-project rp-content"
                data-slug={project.id}
                data-slug-path={`${project.id}/_index`}
                hidden
              >
                <h2 id={`rp-title-${project.id}`}>{project.data.title}</h2>
                <p class="rp-tagline">{project.data.tagline}</p>
                {project.data.cover_image && (
                  <img class="rp-cover" src={project.data.cover_image} alt={`${project.data.title} cover`} />
                )}
                <IndexContent />
                <footer class="rp-foot">
                  {project.data.github_url && (
                    <a href={project.data.github_url} rel="noopener" target="_blank">github</a>
                  )}
                  {project.data.download_url && (
                    <a href={project.data.download_url} rel="noopener" target="_blank">download</a>
                  )}
                </footer>
              </article>
              {fileRenders.map(({ file, Content }) => (
                <article
                  class="rp-project rp-content"
                  data-slug={project.id}
                  data-slug-path={file.id}
                  hidden
                >
                  <h2 id={`rp-title-${file.id}`}>{file.data.title ?? file.id}</h2>
                  <Content />
                </article>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: delete the old ReadingPanel**

```bash
rm ~/Developer/Portfolio_Website/src/components/ReadingPanel.astro
```

- [ ] **Step 3: update the page import**

Edit `src/pages/index.astro`:
```astro
- import ReadingPanel from '../components/ReadingPanel.astro';
+ import FolderReader from '../components/folders/FolderReader.astro';
…
- <ReadingPanel />
+ <FolderReader source="projects" />
```

- [ ] **Step 4: type-check**

Run: `npm run check`
Expected: 0 errors.

---

## Task 9 — `folder-reader.ts` primitive (replaces manila.ts)

**Goal:** Tree rendering from inlined JSON, click-to-switch, URL-hash sync, keyboard, focus-trap-via-inert.

**Files:**
- Create: `src/lib/primitives/folder-reader.ts`.
- Delete: `src/lib/primitives/manila.ts`.
- Modify: `src/lib/site-init.ts` — replace `initManilaFolders` with `initFolderReader`.

**Acceptance Criteria:**
- [ ] On load, parses every `<script.folder-tree>` blob and renders its tree into the matching project's tree pane (but: there's one global tree pane; render whichever project is currently open).
- [ ] Default file when a card is clicked: `<slug>/_index`.
- [ ] URL hash format: `#project-<slug>/<rel-path>`. Parses on load and on `hashchange`.
- [ ] Clicking a tree file swaps the visible article and `replaceState`s the hash.
- [ ] `Esc` closes; `inert` on `<main>` while open; focus returns to opener card on close.
- [ ] Tree pane toggle button hides/shows the tree on mobile (CSS handles the responsive trigger; JS toggles `aria-expanded` and a `data-collapsed` attribute).
- [ ] Keyboard: in the tree, `↑/↓` move selection, `Enter` activates, `←/→` collapse/expand folder.

**Verify:**
```bash
npm run check && npm run build
```
Expected: clean.

**Steps:**

- [ ] **Step 1: write `src/lib/primitives/folder-reader.ts`**

```typescript
/**
 * @file folder-reader.ts
 *
 * Behavior layer for the FolderReader two-pane slide-up panel.
 *   - parses inlined tree JSON
 *   - renders the tree into <nav class="rp-tree">
 *   - click/keyboard navigates tree, swaps visible article
 *   - syncs URL hash `#project-<slug>/<rel-path>` (default `<slug>/_index`)
 *   - focus-trap via `inert` on <main>; Esc closes
 *   - mobile: tree pane collapsible via the .rp-tree-toggle button
 *
 * Replaces the legacy `manila.ts`. The folder-reader is page-global —
 * one per page — opened by any [data-slug] anchor (FolderCards).
 *
 * Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.4]].
 */

const HASH_PREFIX = '#project-';

interface TreeNode {
  kind: 'file' | 'folder';
  label: string;
  path?: string;
  children?: TreeNode[];
}

export interface FolderReaderHandle {
  stop(): void;
}

function setMainInert(inert: boolean): void {
  const main = document.querySelector<HTMLElement>('main');
  if (!main) return;
  if (inert) main.setAttribute('inert', '');
  else main.removeAttribute('inert');
}

function loadTreesBySlug(overlay: HTMLElement): Map<string, TreeNode[]> {
  const map = new Map<string, TreeNode[]>();
  for (const s of overlay.querySelectorAll<HTMLScriptElement>('script.folder-tree')) {
    const slug = s.dataset.slug;
    if (!slug) continue;
    try {
      const data = JSON.parse(s.textContent ?? '[]') as TreeNode[];
      map.set(slug, data);
    } catch {
      // Bad JSON shouldn't happen — Astro stringified it server-side.
    }
  }
  return map;
}

function buildTreeMarkup(nodes: readonly TreeNode[], depth: number = 0): string {
  const items: string[] = [];
  for (const n of nodes) {
    if (n.kind === 'folder') {
      const children = buildTreeMarkup(n.children ?? [], depth + 1);
      items.push(
        `<li class="rp-tree-folder" data-depth="${depth}" data-open="true">
          <button class="rp-tree-folder-btn" type="button" aria-expanded="true">
            <span class="rp-tree-folder-chev" aria-hidden="true">▾</span>
            <span class="rp-tree-folder-label">${escapeHtml(n.label)}</span>
          </button>
          <ul class="rp-tree-children">${children}</ul>
        </li>`,
      );
    } else if (n.kind === 'file' && n.path) {
      items.push(
        `<li class="rp-tree-file" data-depth="${depth}">
          <button class="rp-tree-file-btn" type="button" data-path="${escapeAttr(n.path)}">
            <span class="rp-tree-file-icon" aria-hidden="true">▸</span>
            <span class="rp-tree-file-label">${escapeHtml(n.label)}</span>
          </button>
        </li>`,
      );
    }
  }
  return `<ul class="rp-tree-list">${items.join('')}</ul>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export function initFolderReader(): FolderReaderHandle {
  if (typeof document === 'undefined') return { stop: () => {} };

  const overlay = document.getElementById('reading-overlay') as HTMLElement | null;
  if (!overlay) return { stop: () => {} };

  const panel = overlay.querySelector<HTMLElement>('.reading-panel');
  const closeButton = overlay.querySelector<HTMLButtonElement>('.rp-close');
  const treePane = overlay.querySelector<HTMLElement>('.rp-tree-pane');
  const treeNav = overlay.querySelector<HTMLElement>('.rp-tree');
  const treeToggle = overlay.querySelector<HTMLButtonElement>('.rp-tree-toggle');
  const articles = Array.from(
    overlay.querySelectorAll<HTMLElement>('.rp-project[data-slug-path]'),
  );
  if (!panel || !treeNav || !treePane) return { stop: () => {} };

  const trees = loadTreesBySlug(overlay);

  let openSlug: string | null = null;
  let openPath: string | null = null;
  let lastFocus: HTMLElement | null = null;

  function showArticle(pathKey: string): void {
    let visibleEl: HTMLElement | null = null;
    for (const a of articles) {
      const match = a.dataset.slugPath === pathKey;
      a.hidden = !match;
      if (match) visibleEl = a;
    }
    if (visibleEl) {
      const title = visibleEl.querySelector<HTMLElement>('h2');
      if (title) panel!.setAttribute('aria-labelledby', title.id);
    }
  }

  function renderTreeFor(slug: string): void {
    const nodes = trees.get(slug) ?? [];
    treeNav!.innerHTML = buildTreeMarkup(nodes);
  }

  function highlightActive(): void {
    for (const btn of treeNav!.querySelectorAll<HTMLButtonElement>('.rp-tree-file-btn')) {
      btn.classList.toggle('is-active', btn.dataset.path === openPath);
    }
  }

  function selectPath(pathKey: string): void {
    openPath = pathKey;
    showArticle(pathKey);
    highlightActive();
    history.replaceState(null, '', `${location.pathname}${HASH_PREFIX}${pathKey}`);
  }

  function open(slug: string, initialPath: string | null = null): void {
    const tree = trees.get(slug);
    if (!tree) return;
    if (openSlug === slug && (initialPath === null || openPath === initialPath)) return;
    lastFocus = (document.activeElement as HTMLElement | null) ?? null;
    openSlug = slug;
    renderTreeFor(slug);
    const path = initialPath && articles.some((a) => a.dataset.slugPath === initialPath)
      ? initialPath
      : `${slug}/_index`;
    selectPath(path);
    overlay!.dataset.state = 'open';
    overlay!.removeAttribute('aria-hidden');
    setMainInert(true);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeButton?.focus());
  }

  function close(): void {
    if (openSlug === null) return;
    openSlug = null;
    openPath = null;
    overlay!.dataset.state = 'closed';
    overlay!.setAttribute('aria-hidden', 'true');
    setMainInert(false);
    document.body.style.overflow = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else document.getElementById('on-the-artifacts')?.scrollIntoView();
    if (location.hash.startsWith(HASH_PREFIX)) {
      history.replaceState(null, '', location.pathname + '#on-the-artifacts');
    }
  }

  function syncFromHash(): void {
    const h = location.hash;
    if (h.startsWith(HASH_PREFIX)) {
      const rest = h.slice(HASH_PREFIX.length);
      const slug = rest.split('/')[0] ?? '';
      open(slug, rest);
    } else if (openSlug !== null) {
      close();
    }
  }

  // Card click
  const cards = document.querySelectorAll<HTMLAnchorElement>('.project-card');
  const onCardClick = (e: Event) => {
    const target = e.currentTarget as HTMLAnchorElement;
    const href = target.getAttribute('href') ?? '';
    if (!href.startsWith(HASH_PREFIX)) return;
    e.preventDefault();
    history.pushState(null, '', location.pathname + href);
    syncFromHash();
  };
  for (const card of cards) card.addEventListener('click', onCardClick);

  // Hash + popstate
  const onHashChange = () => syncFromHash();
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', onHashChange);

  // Tree-pane file clicks
  const onTreeClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const fileBtn = target.closest<HTMLButtonElement>('.rp-tree-file-btn');
    if (fileBtn?.dataset.path) {
      selectPath(fileBtn.dataset.path);
      return;
    }
    const folderBtn = target.closest<HTMLButtonElement>('.rp-tree-folder-btn');
    if (folderBtn) {
      const li = folderBtn.closest<HTMLElement>('.rp-tree-folder');
      if (!li) return;
      const open = li.dataset.open !== 'false';
      li.dataset.open = open ? 'false' : 'true';
      folderBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      const chev = folderBtn.querySelector<HTMLElement>('.rp-tree-folder-chev');
      if (chev) chev.textContent = open ? '▸' : '▾';
    }
  };
  treeNav.addEventListener('click', onTreeClick);

  // Tree-pane keyboard
  const onTreeKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!treeNav!.contains(target)) return;
    const buttons = Array.from(
      treeNav!.querySelectorAll<HTMLButtonElement>('.rp-tree-file-btn,.rp-tree-folder-btn'),
    );
    const idx = buttons.indexOf(target as HTMLButtonElement);
    if (idx < 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      buttons[Math.min(buttons.length - 1, idx + 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      buttons[Math.max(0, idx - 1)]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // Default click handler covers this; preventDefault stops scroll on space.
      if (e.key === ' ') e.preventDefault();
      (target as HTMLButtonElement).click();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const folderBtn = target.closest<HTMLButtonElement>('.rp-tree-folder-btn');
      if (!folderBtn) return;
      const li = folderBtn.closest<HTMLElement>('.rp-tree-folder');
      if (!li) return;
      const wantOpen = e.key === 'ArrowRight';
      if (li.dataset.open !== (wantOpen ? 'true' : 'false')) {
        e.preventDefault();
        li.dataset.open = wantOpen ? 'true' : 'false';
        folderBtn.setAttribute('aria-expanded', String(wantOpen));
        const chev = folderBtn.querySelector<HTMLElement>('.rp-tree-folder-chev');
        if (chev) chev.textContent = wantOpen ? '▾' : '▸';
      }
    }
  };
  treeNav.addEventListener('keydown', onTreeKey);

  // Mobile tree toggle
  const onToggle = () => {
    if (!treeToggle) return;
    const collapsed = treePane.dataset.collapsed === 'true';
    treePane.dataset.collapsed = collapsed ? 'false' : 'true';
    treeToggle.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
    const chev = treeToggle.querySelector<HTMLElement>('.rp-tree-chev');
    if (chev) chev.textContent = collapsed ? '▾' : '▸';
  };
  treeToggle?.addEventListener('click', onToggle);

  // Escape
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && openSlug !== null) {
      e.preventDefault();
      history.replaceState(null, '', location.pathname + '#on-the-artifacts');
      close();
    }
  };
  window.addEventListener('keydown', onKey);

  // Close buttons / backdrop
  const onClose = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const trigger = target.closest<HTMLElement>('[data-rp-close]');
    if (!trigger) return;
    if (trigger.tagName === 'A') return; // anchor handles its own hash
    e.preventDefault();
    history.replaceState(null, '', location.pathname + '#on-the-artifacts');
    close();
  };
  overlay.addEventListener('click', onClose);

  // Initial sync (handles `#project-<slug>/...` direct links)
  syncFromHash();

  return {
    stop(): void {
      for (const card of cards) card.removeEventListener('click', onCardClick);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
      window.removeEventListener('keydown', onKey);
      treeNav!.removeEventListener('click', onTreeClick);
      treeNav!.removeEventListener('keydown', onTreeKey);
      treeToggle?.removeEventListener('click', onToggle);
      overlay.removeEventListener('click', onClose);
      close();
    },
  };
}
```

- [ ] **Step 2: delete `src/lib/primitives/manila.ts`**

```bash
rm ~/Developer/Portfolio_Website/src/lib/primitives/manila.ts
```

- [ ] **Step 3: update `site-init.ts`**

```typescript
- import { initManilaFolders } from './primitives/manila';
+ import { initFolderReader } from './primitives/folder-reader';
…
-  initManilaFolders();
+  initFolderReader();
```

- [ ] **Step 4: type-check + build**

```bash
npm run check && npm run build
```
Expected: clean.

---

## Task 10 — Tree + reader CSS

**Goal:** Style the two-pane layout, the file tree, the active-file highlight, and the mobile collapsible drawer.

**Files:**
- Modify: `src/styles/manila-folder.css` — adds the `.rp-tree-pane`, `.rp-content-pane`, tree styles, mobile breakpoint.

**Acceptance Criteria:**
- [ ] Desktop (≥ 720px): tree pane visible at ~220px, content pane flex-fills.
- [ ] Mobile (< 720px): tree pane collapses; `.rp-tree-toggle` controls show/hide.
- [ ] Active file button shows a left-accent border (`var(--companion-color)`).
- [ ] Folder disclosure chevron rotates / swaps `▸` ↔ `▾`.
- [ ] No additional new files; all CSS lives in `manila-folder.css`.

**Verify:**
```bash
npm run check && npm run build
```

**Steps:**

- [ ] **Step 1: append tree styles to `manila-folder.css`**

Add to the bottom of the file:
```css
/* ---- Two-pane reading panel (open state) ----
   Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.4]]. */

.rp-body {
  display: flex;
  gap: 0;
  min-height: 0;
  flex: 1;
}

.rp-tree-pane {
  width: 220px;
  flex: 0 0 220px;
  border-right: 1px solid rgba(0,0,0,0.08);
  padding: 0.5rem 0.5rem 1rem;
  overflow-y: auto;
  background: rgba(0,0,0,0.015);
}
.rp-tree-pane[data-collapsed="true"] .rp-tree { display: none; }

.rp-tree-toggle {
  display: none; /* shown on mobile via media query */
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  font-family: var(--face-mono);
  font-size: var(--type-small);
  color: var(--ink-2);
  background: none;
  border: none;
  padding: 0.5rem 0.6rem;
  border-radius: 3px;
  cursor: pointer;
}
.rp-tree-toggle:hover, .rp-tree-toggle:focus-visible {
  background: rgba(0,0,0,0.04);
  outline: none;
}

.rp-tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rp-tree-folder,
.rp-tree-file {
  margin: 0;
}
.rp-tree-folder-btn,
.rp-tree-file-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-family: var(--face-serif);
  font-size: 0.92rem;
  color: var(--ink-2);
  padding: 0.32rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  border-left: 2px solid transparent;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.rp-tree-folder-btn { color: var(--ink-0); font-weight: 600; }
.rp-tree-folder-btn:hover,
.rp-tree-file-btn:hover,
.rp-tree-folder-btn:focus-visible,
.rp-tree-file-btn:focus-visible {
  background: rgba(0,0,0,0.04);
  color: var(--ink-0);
  outline: none;
}
.rp-tree-file-btn.is-active {
  border-left-color: var(--companion-color);
  color: var(--ink-0);
  background: rgba(0,0,0,0.025);
}
.rp-tree-folder[data-open="false"] > .rp-tree-children { display: none; }
.rp-tree-children {
  list-style: none;
  margin: 0;
  padding-left: 0.9rem;
}
.rp-tree-folder-chev,
.rp-tree-file-icon {
  display: inline-block;
  width: 0.9em;
  color: var(--ink-2);
  font-size: 0.85em;
}

.rp-content-pane {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.25rem clamp(1rem, 2vw, 1.5rem) 2rem;
  overflow-y: auto;
}

@media (max-width: 720px) {
  .rp-body {
    flex-direction: column;
  }
  .rp-tree-pane {
    width: 100%;
    flex: 0 0 auto;
    border-right: none;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    padding-bottom: 0.6rem;
  }
  .rp-tree-toggle { display: flex; }
  .rp-tree-pane[data-collapsed="true"] .rp-tree {
    display: none;
  }
}
```

Also set `data-collapsed` default on mobile via JS — Task 9 already references `treePane.dataset.collapsed`; default for the first open is "false" on desktop and "true" on mobile. Add to `folder-reader.ts` `open()`:

```typescript
treePane.dataset.collapsed = window.matchMedia('(max-width: 720px)').matches ? 'true' : 'false';
if (treeToggle) treeToggle.setAttribute('aria-expanded', treePane.dataset.collapsed === 'false' ? 'true' : 'false');
```

(Edit the existing `open()` function rather than the whole module.)

- [ ] **Step 2: verify**

```bash
npm run check && npm run build
```

---

## Task 11 — Paper aesthetic + `obsidian-notes.css`

**Goal:** Refresh `.project-card` and `.reading-panel` with a subtle paper grain. Add the new `obsidian-notes.css` layer scoped to `.rp-content` for markdown rendering.

**Files:**
- Modify: `src/styles/manila-folder.css` — adds the grain background + tightens card styles.
- Create: `src/styles/obsidian-notes.css` — heading/strong/em/code/etc. for `.rp-content`.
- Modify: `src/styles/global.css` — imports `obsidian-notes.css`.

**Acceptance Criteria:**
- [ ] Project cards and reading panel have a subtle SVG-noise grain backdrop at ~3% opacity.
- [ ] `.rp-content` `<h2>` has Obsidian-style 1px bottom rule; `<strong>` has weight 600 + warm color; `<blockquote>` has left rule; `<code>` and `<pre>` have soft-tint background.
- [ ] No new asset files in `/public/` — grain is a data-URL.

**Verify:**
```bash
npm run check && npm run build
```

**Steps:**

- [ ] **Step 1: create `src/styles/obsidian-notes.css`**

```css
/* obsidian-notes.css — markdown styling scoped to .rp-content.
   Aims for the clean Obsidian read view that Rafan's notes live in.
   Bold gets a stronger weight + warmer color so ** in markdown reads
   as deliberate emphasis; the bold-synesthesia primitive layers a
   proximity color-reveal on top.
   Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.5]]. */

.rp-content {
  font-family: var(--face-serif);
  color: var(--ink-2);
  line-height: var(--leading-body);
  font-size: var(--type-body);
}
.rp-content > h1 { margin: 0 0 0.6em; }
.rp-content h1,
.rp-content h2,
.rp-content h3,
.rp-content h4,
.rp-content h5,
.rp-content h6 {
  font-family: var(--face-serif);
  color: var(--ink-0);
  letter-spacing: -0.01em;
  font-weight: 600;
}
.rp-content h2 {
  font-size: clamp(1.4rem, 2.4vw, 1.8rem);
  margin: 1.6em 0 0.5em;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  padding-bottom: 0.2em;
}
.rp-content h3 {
  font-size: 1.2rem;
  margin: 1.3em 0 0.4em;
}
.rp-content h4 {
  font-size: 1.05rem;
  margin: 1.1em 0 0.3em;
}

.rp-content strong {
  font-weight: 600;
  color: var(--ink-0);
}
.rp-content em {
  font-style: italic;
}

.rp-content > p,
.rp-content > ul,
.rp-content > ol,
.rp-content > blockquote,
.rp-content > pre,
.rp-content > figure { margin: 0 0 1em; }

.rp-content blockquote {
  margin-left: 0;
  padding: 0.4em 0 0.4em 1em;
  border-left: 3px solid rgba(0,0,0,0.12);
  color: var(--ink-2);
  font-style: italic;
}
.rp-content blockquote p { margin-bottom: 0.5em; }
.rp-content blockquote p:last-child { margin-bottom: 0; }

.rp-content code {
  font-family: var(--face-mono);
  font-size: 0.88em;
  background: rgba(0,0,0,0.05);
  padding: 0.05em 0.35em;
  border-radius: 3px;
}
.rp-content pre {
  font-family: var(--face-mono);
  font-size: 0.84em;
  background: rgba(0,0,0,0.04);
  padding: 0.9em 1em;
  border-left: 2px solid rgba(0,0,0,0.12);
  border-radius: 4px;
  overflow-x: auto;
}
.rp-content pre code {
  background: none;
  padding: 0;
  border-radius: 0;
}

.rp-content a {
  color: var(--ink-0);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
.rp-content a:hover { color: var(--companion-color); }

.rp-content ul, .rp-content ol {
  padding-left: 1.2em;
}
.rp-content li { margin-bottom: 0.35em; }

.rp-content hr {
  border: 0;
  border-top: 1px solid rgba(0,0,0,0.1);
  margin: 1.5em 0;
}

.rp-content img,
.rp-content video {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em 0;
  border-radius: 4px;
}
```

- [ ] **Step 2: import in `global.css`**

```css
@import './obsidian-notes.css';
```

- [ ] **Step 3: add paper grain to `manila-folder.css`**

At the top of the file (after the comment block), add:
```css
/* Subtle paper grain — data-URL SVG noise. Reads as "good paper",
   not "kraft". ~3% opacity at 64x64 tile. */
:root {
  --paper-grain: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.project-card,
.reading-panel {
  background-image: var(--paper-grain), linear-gradient(180deg, var(--paper-0), var(--paper-0));
  background-blend-mode: multiply;
}
```

- [ ] **Step 4: verify**

```bash
npm run check && npm run build
```

---

## Task 12 — `obsidian-bolds.ts` primitive (bold synesthesia)

**Goal:** Wrap each character of `<strong>` inside `.rp-content` so the inertial-type flashlight color-reveal applies, without making bolds physically wobble.

**Files:**
- Create: `src/lib/markdown/obsidian-bolds.ts`.
- Modify: `src/lib/site-init.ts` — wire it after `initFolderReader` (panel HTML is static, so we can wrap once on load).
- Modify: `src/lib/primitives/inertial-type.ts` — when `data-color-letters` is on a `<strong>`, ensure the inertial physics treat that group as **non-moving** (only color-reveals). The existing implementation already only adds `data-inertial` if the wrapper has `data-inertial-text`; the new primitive will NOT set those, just `.syn-letter` + `data-color-letters`. Verify the inertial-type primitive's letter-walker still picks them up. (If not, extend it.)

**Acceptance Criteria:**
- [ ] On page load, every `.rp-content strong` has each character wrapped in a `<span class="inertial-letter syn-letter">` (no `data-inertial` to suppress physics).
- [ ] Each `<strong>` itself gets `data-color-letters` added so the existing flashlight reveal applies.
- [ ] Hovering near a bold word in a rendered note lights its letters.
- [ ] Bolds do NOT wobble — the springy inertial motion is off for them.

**Verify:**
```bash
npm run check && npm run build
npm run dev &
sleep 2
curl -s http://localhost:4321/ | grep -o 'syn-letter' | wc -l
# expected: > 0 once a `<strong>` exists in any project note
pkill -f 'astro dev' || true
```

**Steps:**

- [ ] **Step 1: write `src/lib/markdown/obsidian-bolds.ts`**

```typescript
/**
 * @file obsidian-bolds.ts
 *
 * Wraps each character of `<strong>` inside any `.rp-content` so the
 * existing inertial-type flashlight color-reveal applies to bolds —
 * without making them wobble. Matches the Obsidian visual rule that
 * bold draws the eye.
 *
 * Side-effect-only: runs once at module init. Idempotent (skips
 * already-processed bolds).
 *
 * Spec: [[specs/2026-05-18-tree-leaves-folders-design#4.5]].
 */

function wrapChars(strong: HTMLElement): void {
  if (strong.dataset.boldsWrapped === 'true') return;
  strong.dataset.boldsWrapped = 'true';
  strong.setAttribute('data-color-letters', '');
  const walker = document.createTreeWalker(strong, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);
  for (const node of textNodes) {
    const text = node.nodeValue ?? '';
    if (text.length === 0) continue;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      if (ch === ' ' || ch === '\t' || ch === '\n') {
        frag.appendChild(document.createTextNode(ch));
      } else {
        const span = document.createElement('span');
        span.className = 'inertial-letter syn-letter';
        span.textContent = ch;
        frag.appendChild(span);
      }
    }
    node.parentNode?.replaceChild(frag, node);
  }
}

export function initObsidianBolds(): void {
  if (typeof document === 'undefined') return;
  for (const strong of document.querySelectorAll<HTMLElement>('.rp-content strong')) {
    wrapChars(strong);
  }
}
```

- [ ] **Step 2: wire from `site-init.ts`**

```typescript
import { initObsidianBolds } from './markdown/obsidian-bolds';
…
  initFolderReader();
  initObsidianBolds();
  initScrollSpy();
```

- [ ] **Step 3: verify inertial-type picks up bolds**

Check `src/lib/primitives/inertial-type.ts`: its `collectLetters` walks `[data-inertial]` and `[data-inertial-text]` descendants. Bolds carry NEITHER (they get `.inertial-letter .syn-letter` but no `data-inertial` because we don't want them to physically wobble).

**Decision:** the bolds' synesthesia reveal piggybacks on the existing flashlight code, but we don't want the inertial physics. Approach: extend `inertial-type.ts` to also walk `[data-color-letters] .syn-letter` elements as *color-only* targets (no physics). Add a second array in `Group` for color-only letters and skip the spring math for them.

Patch (in `inertial-type.ts`):
```typescript
interface ColorLetter { span: HTMLElement; cx: number; cy: number; colorLit: boolean; }
interface Group {
  root: HTMLElement;
  letters: Letter[];
  colorOnly: ColorLetter[];   // new
  visible: boolean;
  colorLetters: boolean;
}
```
In `initInertialType`, after collecting `letters`, also collect color-only ones:
```typescript
const colorOnlyEls = Array.from(
  r.querySelectorAll<HTMLElement>('[data-color-letters] .syn-letter'),
).filter((el) => !el.hasAttribute('data-inertial'));
const colorOnly: ColorLetter[] = colorOnlyEls.map((span) => ({
  span, cx: 0, cy: 0, colorLit: false,
}));
groups.push({ root: r, letters, colorOnly, visible: true, colorLetters });
```
Extend `refreshCenters` to also measure `colorOnly`:
```typescript
for (const L of g.colorOnly) {
  const rect = L.span.getBoundingClientRect();
  L.cx = rect.left + rect.width / 2;
  L.cy = rect.top + rect.height / 2;
}
```
Inside the tick, after the existing `for (const L of g.letters)` loop, add:
```typescript
for (const L of g.colorOnly) {
  const dx = pointer.x - L.cx;
  const dy = pointer.y - L.cy;
  const d2 = dx * dx + dy * dy;
  const lit = d2 < COLOR_R * COLOR_R;
  if (lit !== L.colorLit) {
    L.colorLit = lit;
    if (lit) {
      const c = synColor(L.span.textContent ?? '');
      if (c) {
        L.span.style.color = c;
        L.span.style.textShadow = `0 0 14px ${c}aa, 0 0 4px ${c}`;
      }
    } else {
      L.span.style.color = '';
      L.span.style.textShadow = '';
    }
  }
}
```
And in `stop()` plus group-empty checks, account for `colorOnly`:
```typescript
if (letterEls.length === 0 && colorOnly.length === 0) continue;
```
Where `groups.length === 0` is checked, OK as-is — at least one group still exists.

Also: the wrapper-scope `[data-inertial-root]` may not include the reading panel (it's outside `<main>`). The default `scope ?? document.body` covers the reading panel since it lives at `<body>` root. Good.

Important: the bolds primitive runs BEFORE inertial-type's tick begins picking them up. We need inertial-type to be initialized AFTER bolds wrap (so the tree walker sees them). Order in `site-init.ts`:
```typescript
initFolderReader();
initObsidianBolds();          // wraps bolds first
initInertialType(document.body); // then inertial-type sees them
```
(Re-check current order in site-init; the current call to `initInertialType(document.body)` runs before initManila — that needs reshuffling. After Task 9 it should be after `initObsidianBolds()`.)

- [ ] **Step 4: verify build clean**

```bash
npm run check && npm run build
```

---

## Task 13 — Smoke verification (curl + grep)

**Goal:** Confirm the rendered HTML has the expected structure.

**Files:** none.

**Acceptance Criteria:**
- [ ] `<canvas id="page-leaves">` exists.
- [ ] `<canvas id="tree-threshold">` exists.
- [ ] One `<article data-slug-path>` per `.md` file in every project.
- [ ] At least one `script.folder-tree` JSON blob present.
- [ ] No console errors on direct hash load `/#project-sample/decisions/ADR-001-placeholder`.

**Verify:**
```bash
npm run dev &
sleep 2
HTML=$(curl -s http://localhost:4321/)
echo "$HTML" | grep -c 'id="page-leaves"'             # 1
echo "$HTML" | grep -c 'id="tree-threshold"'          # 1
echo "$HTML" | grep -o 'data-slug-path' | wc -l       # >= 5 (sample has _index + 4 files)
echo "$HTML" | grep -c 'class="folder-tree"'          # >= 1
pkill -f 'astro dev' || true
```

**Steps:**

- [ ] **Step 1: run the smoke pipeline above**
- [ ] **Step 2: if any assert fails, file as a defect and fix before moving on**

---

## Task 14 — Concept doc: Falling Leaves Backdrop

**Goal:** New Concept doc capturing the JS-port spec.

**Files:**
- Create: `<vault>/Programming/Portfolio_Website/Concept - Falling Leaves Backdrop.md`.

**Acceptance Criteria:**
- [ ] Doc has: tags frontmatter, "what it is," "algorithm summary," "constants," "module shape," "performance budget," "open questions," "see also."
- [ ] Links: `[[Concept - Recursive Tree Backdrop]]`, the spec, the ADR-007.

**Verify:** Doc file exists and includes the required sections.

**Steps:**

- [ ] **Step 1: write the doc**

(Template content provided in the actual implementation step — see the Concept docs already in the vault for the pattern.)

---

## Task 15 — Concept doc: Folder Primitive (supersedes Manila Folder Gallery)

**Goal:** Replace `Concept - Manila Folder Gallery.md` with `Concept - Folder Primitive.md` reflecting the new modular split + multi-file content model. Leave a pointer note in the old file.

**Files:**
- Create: `<vault>/Programming/Portfolio_Website/Concept - Folder Primitive.md`.
- Modify: `<vault>/Programming/Portfolio_Website/Concept - Manila Folder Gallery.md` — replace its body with a pointer to the new doc.

**Acceptance Criteria:**
- [ ] New doc has frontmatter, "what it is," "three components (FolderShelf, FolderCard, FolderReader)," "content schema," "navigation," "module shape," "see also."
- [ ] Old doc is reduced to a 3-line pointer + the original archived inline at the bottom.

**Verify:** Both files present, linked.

**Steps:** see template patterns in existing Concept docs.

---

## Task 16 — ADR-007: Page-wide falling-leaves backdrop

**Files:**
- Create: `<vault>/Programming/Portfolio_Website/decisions/ADR-007-page-wide-falling-leaves.md`.
- Modify: `<vault>/Programming/Portfolio_Website/decisions/_index.md` — add the new entry.

**Acceptance Criteria:** ADR follows the Working Agreements §1 schema (Decision, Context, Alternatives, Benefits, Harms, Revisit If).

**Steps:** template from existing ADRs in the same folder.

---

## Task 17 — ADR-008: Multi-file project folders

**Files:**
- Create: `<vault>/.../decisions/ADR-008-multi-file-project-folders.md`.
- Modify: `decisions/_index.md`.

**Steps:** as Task 16.

---

## Task 18 — ADR-009: Modular folder primitive split

**Files:**
- Create: `<vault>/.../decisions/ADR-009-modular-folder-primitive-split.md`.
- Modify: `decisions/_index.md`.

**Steps:** as Task 16.

---

## Task 19 — ADR-010: Obsidian-style notes + bold synesthesia

**Files:**
- Create: `<vault>/.../decisions/ADR-010-obsidian-notes-and-bold-synesthesia.md`.
- Modify: `decisions/_index.md`.

**Steps:** as Task 16.

---

## Task 20 — Sibling vault doc: Manim 08_falling_leaves_forest

**Goal:** Document the new Manim scene alongside the existing v3 family docs.

**Files:**
- Create: `<vault>/Programming/Manim_Wallpaper/wallpapers/08_falling_leaves_forest.md`.
- Modify: `<vault>/Programming/Manim_Wallpaper/00_index.md` — add the entry.
- Modify: `<vault>/Programming/Manim_Wallpaper/03_process_log.md` — append a 2026-05-18 entry describing the FOREST variant.

**Acceptance Criteria:** Doc has the same shape as `wallpapers/07_network_nodes.md` (algorithm summary, palette, constants, render command, sibling-project pointer).

**Verify:** File exists; render mp4 is present once Task 0 completes.

---

## Task 21 — Update 00-Index, Open Questions

**Files:**
- Modify: `<vault>/.../00 - Index.md` — add `specs/` folder mention, refresh primitive list.
- Modify: `<vault>/.../Open Questions.md` — close obsolete entries, open new ones (soft-handoff future, projects-page composition).

**Acceptance Criteria:** docs reflect the new world.

---

## Task 22 — Process Journal entry

**Files:**
- Modify: `<vault>/.../Process Journal.md` — append `## 2026-05-18 · Phase 4 — falling leaves + folder primitive + obsidian notes`.

**Acceptance Criteria:** entry follows the existing Process Journal pattern (what I did, what I decided, what I'd flag).

---

## Task 23 — Memory mirror

**Files:**
- Modify: `~/.claude/projects/-Users-rafanquader-Developer-Portfolio-Website/memory/project_portfolio_website.md` — append a one-line status update pointing at the new Process Journal entry.

**Acceptance Criteria:** memory file references the new entry; under 4 lines total.

---

## Self-review

**Spec coverage:** every spec section maps to ≥ 1 task. §3.1 → Tasks 1–12; §3.2 → Tasks 7–9; §3.3 → Tasks 2 + 10; §4.1 → Tasks 1–2; §4.2 → Tasks 5–8; §4.3 → Tasks 3–4; §4.4 → Tasks 8–10; §4.5 → Tasks 11–12; §4.6 → Tasks 0 + 20; §5 data flow → Tasks 8–9; §6 error handling → covered inline in Tasks 3, 8, 9; §7 verification → Task 13; §8 ADRs → Tasks 16–19; §9 doc updates → Tasks 14, 15, 20, 21, 22; §10 migration → Task 4; §11 implementation order → this plan's ordering; §12 risks → addressed in Tasks 9/10's mobile + reduced-motion handling; §13 out-of-scope items recorded in Task 21's Open Questions update. ✓

**Placeholder scan:** Tasks 14–22 reference "template from existing ADRs / Concept docs" rather than inline full text. Decision: writing full ADR + Concept-doc bodies inside this plan would bloat it 3×. The patterns are well-established in the existing vault. Each task is small (one file, well-bounded) and the executor can read sibling docs as templates. Mark as acceptable.

**Type consistency:** `mountFallingLeaves` is called from `site-init.ts` with `{ palette: 'forest' }` (Task 2) — matches its signature in Task 1 (`palette?: 'forest'`). ✓. `initFolderReader` returns `FolderReaderHandle` in Task 9; `site-init.ts` doesn't capture the handle (matches today's pattern for primitives). ✓. `<FolderShelf>` and `<FolderReader>` both take `source: 'projects'` in Task 6 and Task 8. ✓.

**Naming check:** `manila-folder.css` kept (the visual aesthetic name is fine; the primitive name is `folder`). `falling-leaves.css` new. `obsidian-notes.css` new. ADR numbers ADR-007 … ADR-010 reserved.

All spec requirements have tasks; no contradictions. Plan ready.

---

## Risks during execution

- **Mass changes touch many files at once.** Mitigation: tasks ordered so each leaves the build at the same or better state than the previous; Task 7 deliberately accepts a temporary build break that Task 8 resolves.
- **Inertial-type extension (Task 12, Step 3) is in code I didn't author originally.** Mitigation: the patch is additive (new `colorOnly` array) and doesn't touch the existing `letters` flow. Type-check catches integration issues.
- **The Manim render is on a separate machine clock.** Mitigation: started in Task 0, verified only at Task 20. If it fails, Task 20 can ship without the mp4 — the JS port is the deliverable.

---

## See also

- [[specs/2026-05-18-tree-leaves-folders-design]] — the spec this plan executes.
- [[Working Agreements]] — durable rules followed throughout.
- [[Process Journal]] — chronological log.
- [[decisions/_index]] — ADR list.
