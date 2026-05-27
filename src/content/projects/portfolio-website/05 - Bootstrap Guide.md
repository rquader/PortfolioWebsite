---
tags: [bootstrap, setup, runnable]
---

# 05 — Bootstrap Guide

> Exactly how to start coding the site from these Obsidian docs. Run-through for a fresh agent (or future Rafan) with `~/Developer/Portfolio_Website/` currently empty.

Assumes: macOS or Linux; Node 20+ installed; git installed.

## Step 0 — Read these first (10 minutes)

In this order, in Obsidian:
1. [[00 - Index]]
2. [[Working Agreements]] — the durable rules. **Especially `7. The user writes all live-site body copy`**.
3. [[01 - Philosophy]]
4. [[02 - Architecture]]
5. Skim [[03 - Content Model]] and [[06 - Next Agent Handoff]]

You don't need to read every Concept doc and ADR upfront. Open them when you're working on the corresponding piece.

## Step 1 — Initialize the Astro project

```bash
cd ~/Developer/Portfolio_Website
# Astro's interactive create command. Pick:
#   - Empty template
#   - TypeScript: strict
#   - Initialize git: yes (or skip — we'll init separately if needed)
#   - Install dependencies: yes
npm create astro@latest -- --template minimal --typescript strict --install --git
```

Follow the prompts (or pass flags as above). Result: a working Astro skeleton.

**Verify:**
```bash
npm run dev
# Visit http://localhost:4321 — should show Astro's default page.
```

## Step 2 — Create the file structure from `02 - Architecture`

Reproduce the layout from [[02 - Architecture#repo layout]]. Create empty files for each component / module first; we'll fill them in stages. Don't worry about content — just scaffolding.

```bash
mkdir -p src/{components,layouts,lib/{backdrop,primitives},styles,content/projects}
touch src/components/{Threshold,OnMe,OnTheWork,OnTheArtifacts,OnRecursion,OnTheTrail,Coda,ProjectCard}.astro
touch src/layouts/Base.astro
touch src/lib/boot.ts src/lib/reduced-motion.ts
touch src/lib/backdrop/{tree,tree-algorithm,leaf,particle,palettes,easing,rng,scenes}.ts
touch src/lib/primitives/{inertial-type,synesthesia,cursor-companion}.ts
touch src/styles/{tokens,global,threshold,manila-folder,on-recursion}.css
touch src/content/config.ts
mkdir -p public/images
```

Commit this scaffold as the first commit ("scaffold: project skeleton").

## Step 3 — Build in dependency order

The recommended order is bottom-up. Don't try to build the threshold first — its dependencies aren't there yet.

### 3.1 — Tokens + global CSS

`src/styles/tokens.css` — define the palette and type custom properties. Pull from the FOREST palette in [[Concept - Recursive Tree Backdrop#palette port]]. Define `--face-serif`, `--face-mono`, `--nav-h`, `--margin-w`, etc. — see [[02 - Architecture]] for the full list.

`src/styles/global.css` — `* { box-sizing: border-box; margin: 0; padding: 0; }`, html/body baseline (background `--ink-0`, color `--paper-0`, system serif). Reduced-motion CSS gate.

`src/layouts/Base.astro` — `<html>`, `<head>` (meta, favicon, OG), `<body>` slot. Wire in `tokens.css` + `global.css`.

**Verify:** `npm run dev` shows a blank dark page in serif. No JS yet.

### 3.2 — The rAF loop + reduced-motion gate

`src/lib/reduced-motion.ts` — exposes `isReducedMotion()` (live read of the media query).

`src/lib/boot.ts` — central rAF loop with `registerTick(fn)`. Tick fns receive `(dt, t)`. Inert until any tick is registered. Skipped entirely under reduced motion.

**Verify:** import `boot.ts` in `Base.astro`'s `<script>` and confirm console shows nothing weird. No tick yet.

### 3.3 — Cursor companion

The simplest primitive. Use [[Concept - Cursor Companion]] as spec.

`src/lib/primitives/cursor-companion.ts` — create DOM element, listen to `pointermove`, register tick.

In `Base.astro`, call `initCursorCompanion()` from the boot script.

**Verify:** dot follows pointer with one-frame lag, ring breathes. Reduce motion → ring stops breathing.

### 3.4 — Recursive tree backdrop

Biggest piece. Use [[Concept - Recursive Tree Backdrop]] as spec. Source the algorithm from `~/Developer/Manim_Wallpaper/scenes/recursive_tree_v2.py`. Port piece by piece:

1. `rng.ts` — Mulberry32 seeded RNG.
2. `easing.ts` — `sinWave(t, period, phase)`.
3. `palettes.ts` — FOREST + helpers (`tone`, `lerpHex`).
4. `tree-algorithm.ts` — `buildBranches`, `resolveTree`, `drawTree`, `drawLeaf`, `drawParticle`.
5. `leaf.ts` — leaf polygon vertices generator.
6. `tree.ts` — public `mountTree(canvas, opts)`. Wires algorithm to canvas + rAF.

Mount on a test page first (e.g., create `src/pages/test-tree.astro` with a single full-bleed canvas). Confirm it renders, sways, loops. Tune until visually matches the Manim reference.

**Verify:** match against `~/Developer/Manim_Wallpaper/output/finals/05_recursive_tree_v2.mp4` (rendered 2026-05-17 — the v2 algorithm is the source of truth). Different antialiasing is fine; structural identity (same tree shape from seed=42, same sway profile, same dual-frequency wind feel) is required. The v1 render at `01_recursive_tree.mp4` is also there if you want to compare what changed v1 → v2.

### 3.5 — Threshold

Now the threshold has its dependencies. Use [[Concept - Threshold Hero]] as spec.

`Threshold.astro` — heading + tagline + portrait slot + tree-canvas. Mount tree with low-opacity props.

`src/styles/threshold.css` — name treatment, tagline, portrait fade mask.

**Verify:** full-screen hero with name, tagline, low-opacity tree behind. Drop a test photo into `public/images/portrait.jpg` and confirm the slot appears + fades.

### 3.6 — Inertial typography

Apply to the threshold name. Use [[Concept - Inertial Headings]].

`src/lib/primitives/inertial-type.ts` — letter-level physics. Wire via `initInertialType(document.body)`.

**Verify:** hovering the name nudges letters. Reduced motion → static letters.

### 3.7 — `on me` + synesthesia

Use [[Concept - Synesthesia Goals]]. `OnMe.astro` with `[PLACEHOLDER — your bio]` marker prose. Wrap a few `<span data-syn-word>` placeholders inside for the user to fill in real words.

`src/lib/primitives/synesthesia.ts` — hover word coloring + section tint.

**Verify:** hover a syn-word, letters reveal colors, section tints faintly.

### 3.8 — `on the work` (DDD card)

`OnTheWork.astro` with the placeholder DDD story marker. Static styling.

### 3.9 — Project gallery scaffolding

Use [[Concept - Manila Folder Gallery]]. Create:

- `src/content/config.ts` — collection schema ([[02 - Architecture#content collection schema]]).
- A test project under `src/content/projects/test-project/` with `index.md`, `meta.yaml`, one image, and one note in `notes/`.
- `OnTheArtifacts.astro` — read `getCollection('projects')`, render `ProjectCard` for each.
- `ProjectCard.astro` — the manila folder visual.
- `src/lib/primitives/manila.ts` — open/close, reading panel, accordion.

**Verify:** card appears, opens reading panel, story renders, field-note accordion works, escape closes.

### 3.10 — `on recursion`

Use [[Concept - Recursive Tree Backdrop]] for the full-bleed instance. `OnRecursion.astro` mounts the tree at full opacity with the annotation placeholder on top. Defer sliders (see [[Open Questions#live-parameter knobs]]).

### 3.11 — `on the trail` + `coda`

Static sections. `OnTheTrail.astro` has the coursework/tools/how-I-work groups + resume link. `Coda.astro` has the contact block.

### 3.12 — Top nav + scroll-spy

A small fixed nav at the top with anchor links to each section. JS scroll-spy updates `:root[data-section]` for the [[Concept - Cursor Companion#per-section accent|cursor companion accent]].

## Step 4 — Verification gates

Before merging anything: run through this checklist.

- [ ] `npm run build` succeeds with no warnings
- [ ] `npm run preview` shows the site as expected
- [ ] All seven sections render at viewport widths 360px, 768px, 1280px, 1920px
- [ ] Cursor companion appears, follows, recolors per section
- [ ] Tree backdrop renders on threshold (low-opacity) and on-recursion (full)
- [ ] Inertial typography nudges letters on hover (desktop)
- [ ] Synesthesia hover works on `on me` words
- [ ] At least one test project renders in the gallery, opens its reading panel
- [ ] Reduced-motion: all animations static, drone-free, no breath, no sway
- [ ] Keyboard tab order is sensible; Escape closes panels; skip-link works
- [ ] Lighthouse: Performance > 95, Accessibility > 95, Best Practices > 95
- [ ] Total transferred bytes on first load (threshold visible) < 100 KB sans portrait
- [ ] No console errors or warnings in Chrome + Safari + Firefox

## Step 5 — Deploy

Use [[decisions/ADR-002-hosting-cloudflare-pages]] as spec.

1. Push the repo to GitHub.
2. In Cloudflare dashboard → Pages → Create project → Connect to git → pick the repo.
3. Build command: `npm run build`. Output dir: `dist`. Root dir: `/`.
4. Deploy. CF assigns a `*.pages.dev` URL.
5. Configure custom domain (when user picks one) via CF DNS.

## Step 6 — First-content pass

Once the site is live with placeholders:

1. Email/Slack/page the user. Ask him to:
   - Drop in his portrait photo at `public/images/portrait.{avif,webp,jpg}`.
   - Write his bio in `OnMe.astro` (replace the `[PLACEHOLDER]` marker).
   - Write his DDD story in `OnTheWork.astro`.
   - Write his "on recursion" annotation in `OnRecursion.astro`.
   - Pick the synesthesia words inside his bio.
2. Per project he wants in the gallery: run the [[04 - Content Pipeline|content pipeline]] using the prompt at the bottom of that doc. Review the diff. Commit.

## What NOT to do

- Don't write live-site copy as the user. See [[Working Agreements#7. The user writes all live-site body copy]].
- Don't read from the user's Obsidian vault in the build. See [[Working Agreements#2. The site never reads from the personal Obsidian vault]].
- Don't ship audio. See [[decisions/ADR-006-aesthetic-primitives-inherited-and-cut#resonant field / audio → cut]].
- Don't add a CSS framework. See [[decisions/ADR-001-tech-stack-astro]].
- Don't port phyllotaxis. User explicitly excluded it.

## See also

- [[06 - Next Agent Handoff]]
- [[02 - Architecture]]
- [[03 - Content Model]]
