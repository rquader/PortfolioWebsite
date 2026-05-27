---
tags: [spec, design, brainstorm]
date: 2026-05-18
status: approved
supersedes_drafts: []
unlocks_adrs: [ADR-007, ADR-008, ADR-009, ADR-010]
---

# 2026-05-18 — Tree-Leaves-Folders Refactor (Design Spec)

> **Status:** approved by user 2026-05-18, brainstormed under the
> `superpowers-extended-cc:brainstorming` skill. Implementation plan
> follows under `superpowers-extended-cc:writing-plans` once this spec
> is reviewed.

## 1. Summary

This spec covers three interlocking changes, all approved in the
brainstorming session:

1. **Page-wide falling-leaves backdrop.** A persistent, fixed-position
   canvas behind the entire page, drifting FOREST-tone leaf polygons
   downward, visually continuous with the recursive tree's canopy.
2. **Modular folder primitive.** The Manila gallery splits into
   composable parts (`FolderShelf`, `FolderCard`, `FolderReader`) so
   folders can be embedded inline in prose on a future projects page,
   not only as a grid.
3. **Obsidian-style multi-file folders.** Each folder supports an
   arbitrary tree of `.md` files plus `images/` and `videos/` assets;
   the reading panel becomes a two-pane Obsidian-style reader (file
   tree left, content right; tree collapses on mobile and on demand).

Plus a CSS layer (`obsidian-notes.css`) that renders markdown headings,
bolds, italics, blockquotes, code, and lists in a clean Obsidian-like
treatment, with proximity-based letter-color reveal extended onto
`<strong>` runs (the existing flashlight effect on section h2s).

## 2. Goals and non-goals

**Goals**
- A backdrop motion layer that is *clean, calm, page-wide*, and
  visually continuous with the threshold tree.
- A folder primitive flexible enough to drop on a future
  `/projects` page that mixes prose with embedded folder cards and
  the same reading panel.
- A reading panel that browses a project's full tree of notes like an
  Obsidian sidebar — including a future `_index.md`, `decisions/ADR-…`,
  `credits.md`, `field/architecture.md`, etc.
- Note rendering close enough to a "well-designed Obsidian view" that
  Rafan can publish cleaned notes without re-styling each one.
- All decisions in [[Working Agreements]] honored:
  - ADRs (rule 1) for the locked-in choices below.
  - No vault reads at build time (rule 2).
  - User writes live-site body copy (rule 7); placeholders are marker-
    style, never synthetic prose in his voice.
  - Ambiguous terms (rule 8) stated up front.

**Non-goals (in this pass)**
- Per-section different backdrops (network-nodes, drift-field). Stays
  open as the V1.1 path; see [[Open Questions]].
- Soft-handoff between tree and falling-leaves (tree visibly dropping
  individual leaves). Documented as a future alternative below; this
  pass ships the simpler independent-layer design.
- A dedicated `/projects` page. The primitive is built to support one,
  but only the existing `on the artifacts` section gets the new
  multi-file folders in this pass.
- Migration of every existing Concept doc to a new format. Docs change
  only where the spec changes their primitive.

## 3. Architecture

### 3.1 Modules added

```
src/lib/backdrop/
├── falling-leaves.ts          # NEW — page-wide drifting-leaf canvas
└── (existing tree files unchanged)

src/components/folders/        # NEW — modular folder primitive
├── FolderShelf.astro          # grid of folder cards
├── FolderCard.astro           # single card (also usable inline)
└── FolderReader.astro         # the global two-pane slide-up reader

src/lib/primitives/
├── folder-reader.ts           # NEW — file-tree nav + state + a11y
└── manila.ts                  # REMOVED (folded into folder-reader.ts)

src/lib/markdown/               # NEW
└── obsidian-bolds.ts          # wraps <strong> chars with .syn-letter
                               # so synesthesia primitive picks them up

src/styles/
├── obsidian-notes.css         # NEW — heading/bold/em/code/etc. scoped
│                               #       to .rp-content
├── falling-leaves.css         # NEW — fixed-canvas layout + reduced-mo
└── manila-folder.css          # KEPT — refactored to compose shelf
                               #         + card + new paper treatment

src/content/config.ts          # EXTENDED — adds projectFiles collection
                               #            (glob **/*.md under projects)
```

### 3.2 Components removed / superseded

- `src/components/ProjectCard.astro` → replaced by `FolderCard.astro`.
- `src/components/ReadingPanel.astro` → replaced by `FolderReader.astro`.
- `src/lib/primitives/manila.ts` → renamed/folded into
  `src/lib/primitives/folder-reader.ts`.
- `projectNotes` collection → replaced by `projectFiles` (which globs
  all `**/*.md` instead of just `notes/*.md`).

### 3.3 Z-order convention (final)

| layer                                  | z-index | placement |
|----------------------------------------|---------|-----------|
| Body content / interactive UI          | 0+      | normal flow |
| Section-level decorations              | 0       | scoped to section |
| Threshold tree canvas                  | -1      | absolute within `.threshold` |
| On-recursion tree canvas               | 0       | absolute within `.on-recursion`, opacity 1 |
| **Page-wide falling-leaves canvas**    | **-2**  | **`position: fixed; inset: 0; pointer-events: none`** |
| Body background `--ink-0`              | -3      | painted by `<body>` |

The falling-leaves canvas is `position: fixed` so it stays visible as
the user scrolls — leaves drift down through the viewport perpetually,
not down the page. This is what "throughout the entire page" means: it
is the room's air, not a moving page background.

## 4. Design per primitive

### 4.1 Page-wide falling-leaves backdrop

**Algorithm.** A canvas port of `~/Developer/Manim_Wallpaper/scenes/falling_leaves_forest.py`
(the new FOREST-palette polygon variant of `falling_leaves.py`,
drafted 2026-05-18). 3 parallax depth layers; per-leaf integer-cycle
motion (fall + sway + slow rotation) so the loop is seamless every 12
seconds. Reuses `leafVerts()` from `src/lib/backdrop/leaf.ts` so each
leaf is visually identical to a tree canopy leaf. RNG seed 113
(distinct from the tree's seed 42 to avoid mirrored shapes).

**Density.** ~45 leaves total. Layer weights: 45% back / 35% mid / 20%
front. Layer opacities: 0.28 / 0.55 / 0.82 (matches the Manim variant).

**Spawn distribution.** Uniform horizontal across the canvas. Initial
vertical positions uniform across [bottom-margin, top-margin] so the
field reads as already-populated at t=0 (no fade-in needed). When the
user is at the top of the page (threshold visible), leaves naturally
appear at heights overlapping the tree canopy — the eye reads
continuity without any handoff logic.

**Reduced motion.** Static frame rendered at t=0; the rAF tick is a
no-op. (Matches the existing tree behavior.)

**API.**
```ts
export interface FallingLeavesOptions {
  palette?: 'forest';      // V1: forest only
  numLeaves?: number;      // default 45
  opacity?: number;        // multiplier; default 1
  seed?: number;           // default 113
  ariaHidden?: boolean;    // default true
}
export interface FallingLeavesHandle {
  setOpacity(o: number): void;
  stop(): void;
}
export function mountFallingLeaves(
  canvas: HTMLCanvasElement,
  opts?: FallingLeavesOptions,
): FallingLeavesHandle;
```

**Mount point.** A single `<canvas id="page-leaves">` in
`src/layouts/Base.astro`, fixed at viewport extent. `site-init.ts`
calls `mountFallingLeaves(canvas)` when present.

**Future alternative (not in scope, recorded):** *soft handoff* — the
tree occasionally releases an individual canopy leaf (probability
p ≈ 0.001 per leaf per second) that switches from tree-attached state
to falling-leaves drifting state, with its release position as the
spawn point. Adds "specialness" moments at the top of the page. Skip
for now because (a) it requires per-leaf mutable state in the tree,
and (b) it only fires while the threshold is on-screen — page-wide
perpetual generation has to work either way. Tracked in
[[Open Questions#tree↔falling-leaves soft handoff (V1.x)]].

### 4.2 Modular folder primitive

**Three components.**

- **`<FolderShelf>`** — grid wrapper that takes a `source` (collection
  name, e.g., `'projects'`) plus an optional `filter` and renders one
  `FolderCard` per entry in `sort_order` order.
- **`<FolderCard>`** — one folder. Takes a project (`CollectionEntry`)
  prop. Renders the closed-state tab + cover + title + tagline. Click
  → opens the global `FolderReader` to that project's `_index.md`.
- **`<FolderReader>`** — the slide-up two-pane reader; one per page;
  global. Hosts all rendered file content for every folder upfront
  (statically rendered at build time) and shows/hides via JS.

Today's `OnTheArtifacts.astro` collapses to:
```astro
<FolderShelf source="projects" />
```
A future projects page is structurally:
```astro
<article class="prose">
  <p>…overarching story prose…</p>
  <FolderCard project={byId('adhkar-counter')} />
  <p>…more prose…</p>
  <FolderCard project={byId('arabic-dialect-map')} />
</article>
<FolderReader source="projects" />
```

**Why split.** Today's `OnTheArtifacts` and `ReadingPanel` are tightly
coupled — the reader assumes one shelf, the shelf assumes one reader.
Splitting clarifies the dependency: the reader is page-global; cards
are anywhere; shelves are convenience wrappers. This is the same
pattern as headless UI libraries (Radix, Headless UI) for related
primitives.

### 4.3 Content schema — Obsidian-style multi-file folders

**On-disk layout (per project).**

```
src/content/projects/<slug>/
├── _index.md                  ← landing; required
├── credits.md
├── decisions/
│   ├── ADR-001-foo.md
│   └── ADR-002-bar.md
├── field/
│   ├── architecture.md
│   └── journal-shipping-v1.md
├── images/
│   ├── cover.png
│   ├── screen-home.png
│   └── screen-detail.png
└── videos/
    └── demo-30s.mp4
```

**Frontmatter (all optional except where noted).**

`_index.md`:
```yaml
title: AdhkarCounter            # required
tagline: a quiet counter…       # required
sort_order: 10                  # required (gallery ordering)
status: shipped | active | archived  # default shipped
cover_image: ./images/cover.png # optional
github_url: …                   # optional
download_url: …                 # optional
```

Other `*.md`:
```yaml
title: the SwiftUI vs UIKit decision  # optional; defaults to filename
sort_order: 1                          # optional; default 0
```

**Astro content collections.** Two collections:

- `projects` — `glob('**/_index.md')` under `src/content/projects` with
  the schema above. Index by slug (parent directory name).
- `projectFiles` — `glob('**/*.md')` under `src/content/projects`,
  excluding `_index.md`. Each entry's id is `<slug>/<rel-path-no-ext>`;
  we split on `/` to find the parent project and the in-folder path.

**Image and video references.** Markdown files reference assets with
relative paths like `![home screen](./images/screen-home.png)`. Astro's
markdown handler resolves these at build time. Video files referenced
via standard `<video>` tags inside markdown HTML, OR via a small Astro
component `<FolderVideo>` that produces a properly-sized embed.

**Migration.** The existing `sample` project moves from
`sample/index.md + notes/*.md` to `sample/_index.md + decisions/* +
field/*` to demonstrate the new layout. Documented in the spec's
migration section below.

### 4.4 Reading panel — two-pane Obsidian-style

**Layout (desktop).**

```
┌─────────────────────────────────────────────────────────┐
│ ◂ back to the shelf                          [×] close  │
├──────────────┬──────────────────────────────────────────┤
│              │  # AdhkarCounter                         │
│  AdhkarC…    │  a quiet counter for daily remembrance   │
│              │                                          │
│  ▾ _index    │  ¶ story prose…                          │
│  ▾ decisions │  ¶ …                                     │
│   ADR-001    │                                          │
│   ADR-002    │  [cover image inline]                    │
│  ▾ field     │                                          │
│   architect… │  ## subhead with proximity color reveal  │
│   journal-…  │                                          │
│  ▸ credits   │  ¶ body with **bold runs** that reveal   │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

- Tree pane: ~220px, top-anchored, scrolls independently.
- Content pane: fluid, scrolls independently.
- Tree disclosure: folders default open; clicking a folder header
  toggles. Active file gets a left-accent border + brighter color.
- Click an `.md` file → its rendered HTML swaps into the content pane.
- Click an image file → opens inline lightbox in the content pane.
- Click a video file → embeds inline (poster from `cover_image` if
  available, autoplay disabled, native controls).
- All files rendered into the panel HTML at build time; JS just shows/
  hides them (no async fetch). Keeps the panel snappy and offline-safe.

**Layout (mobile, < 720px).**

- Tree collapses to a top drawer with a chevron toggle: closed shows
  just "Files (n) ▾"; open expands to the full tree, pushing content
  down.
- Default state: open if the user enters via direct URL hash
  `#project-<slug>/<file-path>`, closed otherwise.

**URL state.** The hash is now `#project-<slug>/<path-no-ext>`
(slashes preserved). Today's `#project-<slug>` keeps working — opens
to `_index`. The folder-reader primitive parses, opens panel, selects
file, and updates hash on file clicks via `history.replaceState`.

**Keyboard.**

- `Esc` — close panel.
- `Tab` cycles tree → content → close button.
- Within the tree, `↑/↓` move selection, `Enter` opens, `←/→` collapse
  /expand the focused folder.
- Focus-trap via `inert` on `<main>` (today's pattern, preserved).

### 4.5 Obsidian-style notes CSS + bold synesthesia

**New `obsidian-notes.css` layer.** Scoped to `.rp-content` so it does
NOT bleed onto the rest of the site. Rules (excerpt):

```css
.rp-content {
  font-family: var(--face-serif);
  color: var(--ink-2);                /* slightly recessed body */
  line-height: var(--leading-body);
  font-size: var(--type-body);
}

.rp-content h1 { font-size: clamp(1.8rem, 3.2vw, 2.4rem); font-weight: 600;
                  letter-spacing: -0.01em; color: var(--ink-0);
                  margin: 0 0 0.6em; }
.rp-content h2 { font-size: clamp(1.4rem, 2.4vw, 1.8rem); font-weight: 600;
                  color: var(--ink-0); margin: 1.6em 0 0.5em;
                  border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 0.2em; }
.rp-content h3 { font-size: 1.2rem; font-weight: 600; color: var(--ink-0);
                  margin: 1.3em 0 0.4em; }

.rp-content strong {
  font-weight: 600;
  color: var(--ink-0);                /* warm-paper-darker against body */
}

.rp-content em { font-style: italic; }

.rp-content > p,
.rp-content > ul,
.rp-content > ol,
.rp-content > blockquote { margin: 0 0 1em; }

.rp-content blockquote {
  margin-left: 0;
  padding: 0.4em 0 0.4em 1em;
  border-left: 3px solid rgba(0,0,0,0.12);
  color: var(--ink-2);
  font-style: italic;
}

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

.rp-content a {
  color: var(--ink-0);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
.rp-content a:hover { color: var(--companion-color); }

.rp-content ul, .rp-content ol { padding-left: 1.2em; }
.rp-content li { margin-bottom: 0.35em; }
```

**Paper texture.** A subtle SVG-noise grain on the panel's paper
surface, via a data-URL CSS background. ~3% opacity at 64×64. Reads
as "good paper," not "kraft texture."

**Bold synesthesia.** A new `obsidian-bolds.ts` primitive: at panel
mount time, walks every `.rp-content strong`, wraps each character in
a `<span class="inertial-letter syn-letter">` exactly like the
inertial-typography primitive already does for `[data-inertial-text]`.
Then sets `data-color-letters` on the `<strong>` so the existing
inertial-type primitive's flashlight color-reveal picks it up
automatically. Net: hovering a bold word lights its letters in
synesthesia colors with the same feel as section headings, but bolds
do NOT physically wobble (we don't add `data-inertial`).

**Why split bolds from the inertial wobble.** Wobbling a heading is
delightful; wobbling every bold in a paragraph would feel busy. Color
reveal is quieter and reads as "important word is alive when you look
at it." Matches the user's stated reference to Obsidian — where bolds
draw the eye without being theatrical.

### 4.6 Manim companion scene

`scenes/falling_leaves_forest.py` already drafted on 2026-05-18 (before
the brainstorming reset). It serves as the ground-truth algorithm for
the JS port. **Will render** the new scene as `output/finals/
08_falling_leaves_forest.mp4` for visual reference. The render runs
unattended (~6 min). Vault doc
[[Manim_Wallpaper/wallpapers/08_falling_leaves_forest]] gets created
alongside in the same pass.

The existing `falling_leaves.py` (AUTUMN ellipse wallpaper) stays
untouched.

## 5. Data flow

**Build time:**

```
src/content/projects/<slug>/**/*.md
        │
        ▼
Astro content collection loaders
  - projects     (matches **/_index.md)
  - projectFiles (matches **/*.md, excludes _index.md)
        │
        ▼
FolderReader.astro (build-time):
  for each project:
    for each file (incl. _index):
      render(entry) → <article data-slug-path="<slug>/<rel>">…</article>
      build a tree node {kind: 'file', label, slug, path}
    for each subdir: {kind: 'folder', label, children: [...]}
        │
        ▼
Tree state (JSON) inlined into a <script type="application/json">
HTML for each article inlined into the panel, all but the active one
`hidden`
```

**Run time:**

```
User clicks a FolderCard with data-slug="adhkar-counter"
        │
        ▼
folder-reader.ts: open('adhkar-counter')
  - history.pushState('#project-adhkar-counter')
  - hydrate tree from inlined JSON
  - select _index by default
  - swap visible <article> based on slug+path
  - inert <main>; focus close button
        │
        ▼
User clicks tree node 'decisions/ADR-001'
  - replaceState('#project-adhkar-counter/decisions/ADR-001')
  - swap visible article (hide previous, show selected)
```

## 6. Error handling

- **Missing `_index.md`.** Collection schema makes it required.
  Astro's build fails loudly with a clear message; spec says
  "_index.md is required for every project."
- **Frontmatter typo.** Zod schema rejects with field-level error;
  build fails. Recovery: fix the file. (Same as today.)
- **Direct-link to a missing file.** `#project-foo/bar/baz` where
  `baz.md` doesn't exist → fall back to `_index.md`, keep panel open,
  silently `replaceState` to the corrected hash.
- **Tree depth.** No artificial limit. Real-world projects won't
  exceed 3 levels; the CSS handles any depth visually via padding-
  left increments.
- **Image asset missing.** Astro's build-time image resolution will
  throw; this is the right behavior (broken refs caught at build).
- **Reduced motion.** Falling-leaves canvas renders static frame.
  Tree canvases unchanged. Panel slide animation already disables
  under `prefers-reduced-motion: reduce` (existing CSS pattern).
- **No-JS fallback.** The shelf renders, cards are `<a href>` anchors
  with `#project-<slug>`. With JS disabled the URL just doesn't open
  the panel. Cards still link with semantically valid anchors. The
  current `<details>` accordion fallback (Manila concept doc) doesn't
  apply to the two-pane layout; we accept that no-JS = no reader.

## 7. Testing / verification plan

**Build-time:**
- `npm run check` — zero TS errors, zero Astro warnings (the
  existing zero-baseline must hold).
- `npm run build` — clean. Total client JS budget: under 25 KB raw
  / 10 KB gz (the falling-leaves module adds ~3 KB raw, the folder-
  reader rewrite adds ~2 KB net after deleting `manila.ts`).

**Smoke tests (curl + grep, run autonomously):**
- `GET /` returns 200; HTML contains `<canvas id="page-leaves">` and
  `<canvas id="tree-threshold">` and the reading-panel overlay.
- HTML contains one `<article data-slug-path>` per `.md` file under
  every project (count assert via shell pipeline).
- Tree JSON inline blob is present and parses (we'll inject a script
  that emits the parsed length to a build log via a custom logger).

**Visual checkpoints (cannot self-verify, listed for user eyeball):**
1. Open `/` — leaves drift down through the viewport behind the tree.
2. Scroll past threshold — tree disappears, leaves continue.
3. `prefers-reduced-motion` (system setting) — leaves freeze at
   initial positions; no jitter.
4. Click any folder card — two-pane reader slides up; default file
   is `_index.md`.
5. Click a `decisions/ADR-…` file in the tree — content swaps.
6. Hover a `<strong>` run in note body — letters light up in
   synesthesia colors with the flashlight effect.
7. Resize to mobile — tree pane collapses to a top drawer.
8. `Esc` closes panel; focus returns to the card.
9. Direct link `…/#project-sample/decisions/ADR-001` opens the right
   file on cold load.

## 8. Decisions to lock as ADRs

After implementation lands, four ADRs get written (one per locked-in
decision):

- **ADR-007** — Page-wide falling-leaves backdrop, fixed-position,
  z-index −2. Alternatives: per-section different backdrops (V1.1),
  persistent MP4 path (deferred). Reuses leaf polygon + FOREST palette.
- **ADR-008** — Obsidian-style multi-file project folders (`_index.md`
  + nested `*.md` + `images/` + `videos/`) replacing the
  `index.md + notes/*.md` pattern. Migration trivial because the only
  existing project is `sample`.
- **ADR-009** — Modular folder primitive split (`FolderShelf` +
  `FolderCard` + `FolderReader`) replacing monolithic Manila gallery,
  unlocking future projects-page use.
- **ADR-010** — Two-pane reading panel + `obsidian-notes.css`
  treatment with proximity-based bold synesthesia. Alternatives:
  single-column with breadcrumb (simpler mobile, rejected for
  desktop richness), tabs (rejected — feels like a code editor).

## 9. Updates to existing docs

- [[00 - Index]] — note the new specs/ folder; update primitive list
  to reflect the folder split.
- [[Working Agreements]] — no rule changes; this spec adheres.
- [[Concept - Recursive Tree Backdrop]] — append a "see also: falling
  leaves" section linking [[Concept - Falling Leaves Backdrop]] (new).
- [[Concept - Manila Folder Gallery]] — rename or supersede with the
  new [[Concept - Folder Primitive]] (more accurate name; manila is
  an aesthetic on top of the primitive, not the primitive itself).
- [[Open Questions]] — close: nothing immediate. Open: "soft handoff
  between tree and falling leaves (V1.x)", "future /projects page
  composition", "drift-field as third backdrop alongside leaves".
- [[Process Journal]] — new entry: 2026-05-18 — Phase 4 brainstorm +
  spec + implementation pass.

New docs created:
- [[specs/2026-05-18-tree-leaves-folders-design]] (this file).
- [[Concept - Falling Leaves Backdrop]].
- [[Concept - Folder Primitive]] (supersedes Manila Folder Gallery).
- [[decisions/ADR-007-page-wide-falling-leaves]].
- [[decisions/ADR-008-multi-file-project-folders]].
- [[decisions/ADR-009-modular-folder-primitive-split]].
- [[decisions/ADR-010-obsidian-style-notes-and-bold-synesthesia]].
- [[Manim_Wallpaper/wallpapers/08_falling_leaves_forest]] (sibling
  vault, mirroring the rendered scene).

## 10. Migration of existing `sample` project

The current `src/content/projects/sample/` is `index.md` +
`notes/{architecture,journal-sample}.md`. New layout:

```
sample/
├── _index.md                      ← renamed from index.md
├── credits.md                     ← new — placeholder credit
├── decisions/
│   └── ADR-001-placeholder.md     ← new — demonstrates ADR location
├── field/
│   ├── architecture.md            ← moved from notes/architecture.md
│   └── journal-sample.md          ← moved from notes/journal-sample.md
└── images/                        ← new — empty until user drops files
```

All file bodies remain placeholder text per
[[Working Agreements#7. The user writes all live-site body copy]]. No
synthetic prose in Rafan's voice.

## 11. Implementation order

Will be detailed in the implementation plan written next under
`superpowers-extended-cc:writing-plans`. Rough order:

1. Manim scene render in background; continue with code.
2. Falling-leaves TS module + `falling-leaves.css` + Base.astro mount.
3. Content collection schema updated; `sample` migrated.
4. Folder primitive split (FolderShelf + FolderCard + FolderReader).
5. Two-pane tree + state + URL hash + keyboard.
6. `obsidian-notes.css` + `obsidian-bolds.ts` + integration.
7. CSS polish (paper grain, hover transitions).
8. Smoke tests via curl + grep.
9. ADR write (4 docs).
10. Concept-doc updates.
11. Process Journal entry.
12. Memory mirror.

## 12. Risks and rollback

- **Risk:** the two-pane panel feels heavy on a small mobile viewport.
  Mitigation: tree-collapsed-by-default on < 720px and a chevron
  toggle.
- **Risk:** the falling-leaves canvas adds enough overdraw to slow
  scroll on low-end mobile. Mitigation: backdrop already lives at
  z-index −2 with `pointer-events: none`; halve the leaf count if
  needed (single constant in `FALLING_LEAVES_CONST.NUM_LEAVES`).
- **Risk:** the bold-synesthesia mutation runs on dynamic note content
  and causes layout reflow. Mitigation: the mutation runs once at
  panel mount (statically rendered articles), then never again.
- **Rollback:** every change is local. The smallest rollback is to
  revert the four new modules and restore `manila.ts` from git.

## 13. Out of scope but recorded for the future

- **Soft-handoff between tree and falling-leaves** (described in §4.1).
  Tracked in [[Open Questions]].
- **Phyllotaxis-as-backdrop** explicitly rejected per the user's
  longstanding "I don't really like the phyllotaxis."
- **Per-section different backdrops.** Tracked as the V1.1 path in
  [[Open Questions#per-section backdrops (tier-2 design exploration)]].
- **Dedicated `/projects` page.** Primitive is built to support it;
  not built in this pass.
- **Inline `FolderCard` styling polish.** When the future projects
  page is built, the inline-in-prose card may want different spacing/
  scale than the shelf form. Adjust then.
- **External video embeds (YouTube/Vimeo).** This pass supports local
  `.mp4`/`.webm` files only. External embeds via standard markdown
  iframes if needed; add a dedicated component when first used.

## See also

- [[Working Agreements]]
- [[01 - Philosophy]]
- [[02 - Architecture]]
- [[03 - Content Model]]
- [[Concept - Recursive Tree Backdrop]]
- [[Concept - Manila Folder Gallery]] (about to be superseded)
- [[decisions/_index]]
- [[Open Questions]]
- [[Process Journal]]
