---
tags: [spec, design, brainstorm, gallery-v2, projects-page]
date: 2026-05-22
status: implemented-iterating
brainstormed_by: claude-opus-4-7-1m (autonomous, then user-corrected)
revisions:
  - rev1 2026-05-22 evening — initial draft (tabbed magazine spread)
  - rev2 2026-05-22 evening — user clarified: separate /projects route + vertical chapters; photo to threshold top-right (not on the work); only one personal photo; soft-feathered treatment recommended
  - rev3 2026-05-23 night — feathered-rectangle treatment shipped, user rejected ("doesn't feel right", "messes with the tree"); iterated to circular cameo
  - rev4 2026-05-23 night — circular cameo rejected because it clipped the gesturing hand; replaced with "print" treatment (small rectangular photo, full frame preserved, palette-tinted ring + soft drop shadow, no filters at rest, brightness-only on hover)
  - rev5 2026-05-23 night — added tree-canvas radial-mask "photo clearing" so the tree gracefully fades around the photo instead of branches being amputated by the photo edge
supersedes:
  - specs/2026-05-18-tree-leaves-folders-design.md (gallery portion only)
  - Concept - Manila Folder Gallery.md (full)
unlocks_adrs: [ADR-012, ADR-013, ADR-014]
---

# 2026-05-22 — Gallery v2, Photo Integration, Tree Click-Hint (Design Spec)

> **Status:** draft, written autonomously while the user was AFK. The user's
> brief in the originating turn:
>
> > "a little click here sticker that pops up for a second when the site loads
> > to show where to click to edit the tree, I completely hate the way the
> > Obsidian Manila folder looks, I'm thinking rn a tab with projects, some
> > text next to each (to tell a story), maybe an image or a video which is
> > clickable and on the side a like like spread out set of papers you can
> > click for the Obsidian docs and traceability and some more natural places
> > maybe at the top and bottom for text. Think about the best way to do this.
> > I will also integrate more photos and such. Also what do you think about
> > cleanly integrating one of these photos into the site with clean UI/UX,
> > think about them. I prefer IMG_6565, but you can consider both."
>
> All interpretations are surfaced in §5. The user should review §5 first.

## 1. Summary

Three interlocking changes:

1. **Tree click-hint sticker.** A small hand-applied paper sticker that pops up
   on the threshold tree canvas ~800 ms after the page is interactive, points
   at the tree, and explains it's clickable. Auto-dismisses after a few seconds
   or on any user interaction. Shown once per user (localStorage flag).

2. **Projects page (gallery v2).** Add a **separate `/projects` route** linked
   from the top nav alongside the home page. The route is a continuous
   vertical scroll: top-of-page framing prose → each project as its own
   **chapter spread** (cover image or video + narrative prose + accordion of
   cleaned Obsidian notes + status/links). Reads as a continuous story the
   user tells through the projects, not a switcher. The current
   `on the artifacts` home-page section is **removed** — projects live on
   their own page. All `FolderShelf` / `FolderCard` / `FolderReader` code +
   `manila-folder.css` deleted outright. Replaced by `src/pages/projects.astro`
   and a small `src/components/project/` set.

3. **Personal-photo integration.** `IMG_6565` placed in the **threshold,
   top-right** — the page-1-of-a-book composition the user intuited. Treated
   with a **soft-feathered radial mask + warm sepia tone** so the photo sits
   inside the parchment palette without being a hard rectangle (this is the
   "fade-to-parchment" evolution of the original [[Concept - Threshold Hero]]
   portrait-slot mask). Clicking the photo opens a lightbox at the photo's
   original colors and full size. Built behind a reusable `<Photo>` primitive
   so future photos (project covers) drop in cleanly; the personal photo is
   the only "face" image — project media is separate (covers + optional videos,
   not personal photos).

The projects-page change is the largest and gets ADR-012. The photo placement
gets ADR-013 (placing a contextual research-presentation photo in the threshold
slot the original concept reserved for a portrait is a deliberate editorial
choice worth documenting). The sticker gets ADR-014 (it introduces a new
"ambient-hint" primitive idiom we may reuse elsewhere — e.g., on the theme
toggle).

## 2. Goals and non-goals

**Goals**

- Replace the rejected manila visual with the structure the user actively
  wants: a dedicated `/projects` page that reads as a continuous story —
  top text, then each project as a chapter (cover media + narrative +
  cleaned notes accordion + project details), then closing text.
- Make the project's deeper documentation **visibly discoverable** — the
  user cares about traceability ([[01 - Philosophy#what this site has to do]]
  point 3). The notes-accordion under each project chapter makes the
  cleaned Obsidian docs first-class content, not buried behind a click.
- Personal photo integrated cleanly in the threshold's top-right corner —
  feathered into the parchment so it reads as part of the page, not a
  hard rectangle. Lightbox on click reveals the original photograph.
- Sticker that explains the tree affordance without becoming permanent UI
  furniture. Once seen, gone.
- Honor [[Working Agreements]]:
  - ADRs for non-trivial decisions (1).
  - No vault reads at build time (2).
  - User writes all live-site body copy; placeholders are marker-style (7).
  - Ambiguous terms stated up front (8) — done in §5.

**Non-goals (this pass)**

- Multiple personal photos. User confirmed one photo (IMG_6565); IMG_6566
  dropped from this design entirely.
- A deep-route per individual project (e.g. `/projects/adhkar-counter`).
  All projects live on the single `/projects` page as vertical chapters.
- Lightbox carousel. Each project has one cover (image or video). Future
  multi-image-per-project is a separate concern.
- Tab-switching transitions / SPA-style swap. `/projects` is a real route,
  navigated to like any other page.
- Migration of all real projects. The sample stays; user runs the content
  pipeline for real projects after this lands.
- Backlog ADRs 008–011 (web fonts, light/dark, slider labels, residue
  threshold). Tracked in [[Open Questions]]. Separate doc-pass. (User in
  rev2 said "I don't hate the plan" — confirmed: keep separate.)
- Top-nav cross-page transition polish (e.g. shared-element animations
  between home and `/projects`). The default browser navigation is fine
  for V1; revisit if it feels jarring.

## 3. Architecture

### 3.1 Modules added

```
src/pages/
└── projects.astro                     # NEW — the /projects route, vertical chapters

src/components/project/                # NEW — chapter primitives for /projects
├── ProjectChapter.astro               # one project: heading + media + story + notes + details
├── ProjectMedia.astro                 # cover image OR video (clickable for image)
└── ProjectNotes.astro                 # native <details> accordion grouped by directory

src/components/photo/                  # NEW — reusable photo primitive
└── Photo.astro                        # feathered photo + caption + click-to-lightbox

src/lib/primitives/
├── photo-lightbox.ts                  # photo lightbox open/close (small)
└── tree-hint.ts                       # the sticker primitive (timer + dismiss + once-per-user)

src/styles/
├── projects.css                       # NEW — /projects page + chapter layout + notes
├── photo.css                          # NEW — feathered mask + sepia overlay + lightbox
└── tree-hint.css                      # NEW — sticker pose + animation

public/images/
├── rafan-speaking-1-800.avif          # NEW — IMG_6565 converted, 3 widths × 3 formats
├── rafan-speaking-1-800.webp
├── rafan-speaking-1-800.jpg
├── rafan-speaking-1-1200.avif
├── rafan-speaking-1-1200.webp
├── rafan-speaking-1-1200.jpg
├── rafan-speaking-1-1600.avif
├── rafan-speaking-1-1600.webp
└── rafan-speaking-1-1600.jpg
```

### 3.2 Components removed / superseded

| removed                                            | replaced by                                       |
|----------------------------------------------------|---------------------------------------------------|
| `src/components/folders/FolderShelf.astro`         | (no replacement — gallery moves off home)         |
| `src/components/folders/FolderCard.astro`          | `project/ProjectChapter.astro` (different metaphor) |
| `src/components/folders/FolderReader.astro`        | `project/ProjectChapter.astro` (inline notes accordion) |
| `src/components/OnTheArtifacts.astro`              | `pages/projects.astro` (the room becomes a page) |
| `src/lib/primitives/folder-reader.ts`              | (no replacement — no overlay primitive in v2)     |
| `src/styles/manila-folder.css`                     | `projects.css`                                    |
| `Concept - Manila Folder Gallery.md` (vault doc)   | `Concept - Projects Page.md` (new)                |

Per the global rule against backwards-compat shims, the removed files are
**deleted outright**. The `<FolderReader>` mount in `src/pages/index.astro`
is also removed (no global slide-up needed).

### 3.3 Components modified

| file                                       | change                                                       |
|--------------------------------------------|--------------------------------------------------------------|
| `src/components/Threshold.astro`           | adds personal photo via `<Photo …/>` in top-right; adds `<button class="tree-hint" data-tree-open>` sticker; existing portrait-slot logic removed (this photo IS the portrait) |
| `src/components/TopNav.astro`              | adds `/projects` link alongside the existing in-page anchor links; active-link logic extended to recognize current route, not just `#hash` |
| `src/pages/index.astro`                    | removes the `<OnTheArtifacts/>` mount; removes the `<FolderReader …/>` mount |
| `src/lib/site-init.ts`                     | wires `initPhotoLightbox()` + `initTreeHint()`; drops `initFolderReader()` |
| `src/content/config.ts`                    | extends `projects` schema with optional `cover_video: z.string().optional()` |

### 3.4 Content-collection schema change

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
    cover_video: z.string().optional(),   // NEW — relative path to .mp4/.webm
    status: z.enum(['archived', 'active', 'shipped']).default('shipped'),
  }),
});
```

`projectFiles` collection is unchanged. The fanned-papers component reads
from it exactly as the file tree did, just rendered differently.

**Media element precedence (in `ProjectMedia.astro`):**

1. If `cover_video` is set → render `<video>` with controls, poster (if
   `cover_image` is also set, use it as poster), `playsinline`, `muted`
   (autoplay on hover, no autoplay on cold load).
2. Else if `cover_image` is set → render the photo via the same `<Photo>`
   primitive, treatment `'plain'` (no extra frame inside the spread).
3. Else → render a cover-less treatment: a small repeating-pattern block
   in the project's accent color (same pattern the prior manila concept
   had for cover-less projects, in [[Concept - Manila Folder Gallery#cover-less-projects]],
   ported into `spread.css`).

### 3.5 Z-order convention (additions)

| layer                                  | z-index | placement                          |
|----------------------------------------|---------|------------------------------------|
| Body content                           | 0       | normal flow                        |
| Threshold photo                        | 1       | `position: absolute; top right` within threshold |
| Tree-hint sticker                      | 8       | `position: absolute` within threshold |
| Photo lightbox backdrop                | 90      | `position: fixed; inset: 0`        |
| Photo lightbox image                   | 91      | centered on backdrop               |
| Tree-mode overlay                      | 100     | unchanged                          |

(No new fixed-position panels for the projects page — chapters scroll in
normal flow.)

## 4. Per-feature designs

### 4.1 Tree click-hint sticker

**Intent.** Tell the reader "the tree is clickable" once, on first load,
without becoming permanent UI. Pure affordance. Disappears.

**Visual.**

```
                              ╔══════════════╗
                              ║              ║
                              ║ ╭──────────╮ ║   ← thin sepia tape strip
                          ╔═══╧═╪╧╧╧╧╧╧╧╧╧╪═╧═══╗
                          ║     │           │    ║
                          ║     │ ↘ click   │    ║   ← hand-set caption
                          ║     │   the tree│    ║
                          ║     ╰──────────╯     ║
                          ╚══════════════════════╝
                                                  
                                tilted -3°, light shadow
```

- A small "sticker" element (≈ 140 × 64 px), pose: `transform: rotate(-3deg)`.
- Sepia paper background with a thin darker washi-tape strip across the top.
- Caption in `Fraunces` italic, lowercase, walnut text.
- An arrow glyph (↘) pointing toward the tree.
- A tiny shadow (`0 6px 14px -6px rgba(58,38,21,.35)`) so it reads as "applied."

**Position.** Absolute, within `.threshold`, bottom-right of the tree canvas
viewport, ~32 px in from each edge. On screens narrower than 600 px, moves
to bottom-center.

**Timing.**

| phase     | timing                                        | reasoning |
|-----------|-----------------------------------------------|-----------|
| in        | starts at `t = 800 ms` after `DOMContentLoaded` (or `load` if slower); fade-in over 240 ms with a subtle drop (`translateY(6px) → 0`) | wait for the page to settle before drawing attention |
| visible   | held for 4 s                                  | enough to read; not enough to overstay |
| out       | fade-out over 240 ms                          | matches in |
| dismiss   | fades immediately if the user clicks, scrolls, presses any key, or touches; or after 4 s held | takes the hint = removes the hint |

**Persistence.** Once dismissed (either by timeout or interaction), set
`localStorage.setItem('rq-tree-hint-seen', '1')`. On subsequent loads,
the sticker is not rendered at all. Reset key for QA: `delete from
localStorage.rq-tree-hint-seen`.

**Behavior as a button.** The sticker is itself `<button data-tree-open
aria-label="open the tree to tune it">`. The existing `[data-tree-open]`
hook in `tree-mode.ts` will pick it up: clicking the sticker both dismisses
the hint AND opens tree-mode. Two birds.

**Reduced motion.** No fade, no slide. The sticker appears (opacity 1)
and disappears (opacity 0) instantly. The rotation pose stays.

**Touch.** Renders identically. Tap dismisses (and opens tree-mode if the
tap lands on the sticker itself).

**Copy alternatives** (user picks; default is the first):

- `↘ click the tree`
- `↘ try the tree`
- `tap to tune ↘`
- `↘ tune the tree`

Default chosen for inclusivity (works on touch + mouse).

**Files.**

- `src/lib/primitives/tree-hint.ts` (~80 lines)
- `src/styles/tree-hint.css` (~60 lines)
- Markup added to `Threshold.astro` (one `<button>`)

**Alternatives considered.**

| approach                                       | why not |
|------------------------------------------------|---------|
| Permanent caption near the tree                | Becomes furniture; conflicts with the "residue" treatment (ADR-011). |
| Animated arrow drawn on the canvas             | More code, harder to dismiss, fights with the canvas's own draw loop. |
| Tooltip on hover only                          | Doesn't trigger on touch; first-load reader doesn't get the hint. |
| **First-load sticker (chosen)**                | One-shot, visible without action, dismisses on action. Strongest UX-to-code ratio. |

---

### 4.2 Projects page (`/projects`)

The headline change. A separate route on the top nav with all the project
content. Reads as a continuous story the user tells through the projects.

#### 4.2.1 Top-nav model

`TopNav.astro` currently has anchor links to home-page sections
(`#threshold`, `#on-me`, `#on-the-work`, `#on-the-artifacts`, `#on-the-trail`,
`#coda`). Update:

- Remove `#on-the-artifacts` (section no longer exists on home).
- Add `/projects` as a route link, placed where `on the artifacts` was
  (between "on the work" and "on the trail" by reading order).
- When the user is on `/projects`, that link is highlighted; the other
  links continue to point at home-page anchors (`/#on-me`, etc., so they
  navigate home + scroll). Active-link logic now distinguishes
  *current-route* from *current-section*.

Resulting top-nav order (left → right):
`threshold · on me · on the work · projects ↗ · on the trail · coda`

The `↗` glyph is a quiet hint that this one navigates away.

#### 4.2.2 Page layout — wide viewport (≥ 900 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← back to home                                       [theme toggle: l · d]  │ ← top nav (shared)
│                                                                              │
│                              Projects                                        │
│                                                                              │
│  [PLACEHOLDER — top-of-page framing prose, ~120–200 words. The user's        │
│   continuous-story opener. Tone: introduce the projects, explain how         │
│   to read this page, what threads connect the work. Use one or two           │
│   paragraphs.]                                                               │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────           │ ← chapter rule
│                                                                              │
│  AdhkarCounter                                                               │
│  a quiet counter for daily remembrance                                       │
│                                                                              │
│  ┌────────────────────────────────────┐                                      │
│  │                                    │                                      │
│  │   cover image (or video)           │                                      │
│  │   16:10, click to lightbox         │                                      │
│  │                                    │                                      │
│  └────────────────────────────────────┘                                      │
│                                                                              │
│  [PLACEHOLDER — narrative prose for AdhkarCounter, the user's voice,         │
│   ~250–400 words. This continues the story from the top of the page.]       │
│                                                                              │
│  shipped · github ↗ · download ↗                                             │
│                                                                              │
│  ▾ field notes                                                               │
│      ▸ architecture                                                          │
│      ▸ build log: shipping v1                                                │
│  ▸ decisions                                                                 │
│      (closed by default)                                                     │
│  ▸ credits                                                                   │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────           │
│                                                                              │
│  Arabic Dialect Map                                                          │
│  ...                                                                         │
│                                                                              │
│  ...                                                                         │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────           │
│                                                                              │
│  [PLACEHOLDER — closing prose, ~60–120 words. Tone: outbound to              │
│   the trail / github / coda; tie the projects back to the work.]            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 Per-chapter structure

Each project (one `ProjectChapter.astro`) contains, top to bottom:

1. **Heading** — project title in display face. Tagline below in italic.
2. **Cover media** — single image OR video (see §3.4 precedence rule).
   Image is clickable for lightbox; video has native controls + poster.
3. **Story prose** — the project's `_index.md` content rendered.
4. **Inline details** — small mono line: `<status> · github ↗ · download ↗`.
   Links open in a new tab. Omitted-when-absent gracefully.
5. **Notes accordion** — a `ProjectNotes` block (see §4.2.4 below).
6. **Chapter rule** — a thin horizontal divider before the next chapter.
   For the final chapter, omitted (the closing prose takes its place).

Project order: `sort_order` ascending (same as before).

#### 4.2.4 Notes accordion (`ProjectNotes.astro`)

The "clean way to show cleaned-up Obsidian notes" the user asked for.
Reads the `projectFiles` collection (already exists) for this project,
groups by top-level directory (`decisions/`, `field/`, anything else),
renders as native `<details>` blocks. Native = accessible by default,
no JS focus trap, keyboard works for free.

Visual:

```
▾ field notes  (3)
    ▸ architecture                       ← single-line summary
    ▸ build log: shipping v1
    ▾ the SwiftUI vs UIKit decision      ← clicked open
       ┌─────────────────────────────────┐
       │ [Markdown body of the note,     │
       │  rendered with obsidian-notes   │
       │  treatment.]                    │
       └─────────────────────────────────┘

▸ decisions  (1)
    (closed by default — outer details collapsed)

▸ credits
    ▸ credits.md
```

- Outer level is one `<details>` per top-level group (sorted alphabetically;
  `field` comes before `decisions` because field-first reads more story-like).
  Top-level group `<details>` is **open** by default for `field/` and
  **closed** for `decisions/` and `credits/` (the editorial: stories first,
  ADRs on demand).
- Inner level is one `<details>` per note. Each note's `<summary>` is the
  note's title (falling back to filename without extension); the body is
  the rendered Markdown.
- Loose files at project root (`credits.md`) appear under their own
  top-level group named after the file (e.g., "credits").
- Body styling reuses the existing `obsidian-notes.css` from Phase 4 — bolds
  get inertial/synesthesia treatment if `data-color-letters` is opted in;
  blockquotes, code, lists all render in the Obsidian-like treatment that
  already exists.

**Interaction.**
- Click `<summary>` → expand/collapse (native).
- Tab/Enter keyboard → native.
- Reduced motion: no animation (browsers handle this; `<details>` is
  CSS-animation-free unless we add it, which we won't).
- Anchor links: each note's `<details>` has `id="<slug>-<rel-path>"` so
  direct links into a specific note open just that note (`<details>` with
  matching `:target` auto-opens via CSS).

#### 4.2.5 Page layout — mobile (< 720 px)

- Top-of-page framing prose: full width.
- Each chapter: full width, single column. Media full-width, max-height
  capped (e.g. 60vh) so it doesn't dominate.
- Notes accordion: same as desktop, full width.
- Chapter rule: full width.
- The notes accordion may have more nested levels than fit comfortably;
  the body of an open note inherits text-size scaling from the page.

#### 4.2.6 Direct linking

- `/projects` lands on top of page.
- `/projects#<slug>` scrolls to that project's chapter.
- `/projects#<slug>-<rel-path>` scrolls to and opens a specific note.

No JS required for either — `id` attributes + native browser scroll +
`<details>` `:target` CSS handle it.

#### 4.2.7 Home page after the change

`src/pages/index.astro` removes `<OnTheArtifacts/>` (and the
`<FolderReader />` mount). The home page's sections become:

`threshold · on me · on the work · on the trail · coda`

The "on the work" section is unchanged from its Phase-5 state — no
photo there (the photo lives on the threshold, see §4.3). The
`projects` link in the top nav is the only on-home pointer to the
project content.

**Optional addition (open question 7 below):** a single one-line "see
projects" affordance at the top of "on the trail" or the bottom of "on
the work" — defer to user preference, not designed here.

#### 4.2.8 Alternatives considered

**Approach A — Separate `/projects` route, vertical chapters (CHOSEN).**
The recommendation, designed above. Matches the user's rev2 description.

**Approach B — Single home page with `on the artifacts` as a richer
section that scrolls all projects inline.**
Same content shape (chapters), but living on the home page.

- Pros: no route to manage; everything in one URL.
- Cons: home page becomes very long; "projects as a separate place" loses
  its meaning; the user explicitly said "another tab for projects."

**Approach C — Tabbed switcher (rev1's choice).** Already designed; user
rejected by clarifying intent.

**Recommendation: A.** Honors the verbatim rev2 ask. The route is cheap
in Astro; the navigation gain (a clear "go look at projects" affordance)
is worth the separation.

---

### 4.3 Photo primitive + IMG_6565 placement (threshold top-right)

User intuition from rev2: photo lives **top-right of the threshold** — the
page-1-of-a-book composition that puts the author photo where author
photos live in a book.

> **Rev4 update (2026-05-23).** The "feathered radial mask + warm sepia
> overlay" treatment specified below in rev2 was implemented and shipped,
> then iterated through three failure modes before landing on the current
> `print` treatment. The rev2 text below is preserved for traceability;
> the **current implementation** is described in §4.3.10 — read that first.
>
> See also [[decisions/ADR-013-personal-photo-threshold-print|ADR-013]] for
> the full decision narrative.

#### 4.3.1 The `<Photo>` primitive

A small reusable component for placing photographs into the site with a
consistent visual treatment. Built once, reused — but in V1 only the
personal photo uses it. Project covers go through `ProjectMedia.astro`
(which can call `<Photo>` internally or render bare; see §4.2.3).

```astro
---
// src/components/photo/Photo.astro
interface Props {
  /** Base path under /public/images/ without extension, e.g. `rafan-speaking-1`. */
  src: string;
  /** Required alt — accessibility. */
  alt: string;
  /** Optional figcaption. Marker-style placeholders allowed. */
  caption?: string;
  /**
   * 'feathered'  = radial fade-to-parchment mask + warm sepia overlay (threshold use)
   * 'frame'      = sepia paper frame, no mask (formal use)
   * 'plain'      = no frame, no mask (project covers, anywhere it should be unstyled)
   */
  treatment?: 'feathered' | 'frame' | 'plain';
  /** Aspect ratio override; default 'auto' (uses image intrinsic). */
  aspect?: string;
  /** If true, clicking opens a full-screen lightbox at original colors. Default true. */
  lightbox?: boolean;
}
---
```

**Rendering.** Emits `<picture>` with AVIF + WebP + JPG fallbacks at three
widths (800 / 1200 / 1600 px) via `srcset`. Files expected at
`/images/<src>-<size>.<format>`.

#### 4.3.2 The feathered treatment (the personal-photo case)

The user's question: *"Should I make it transparent?"* My recommendation:
no background removal, but soft-feather the edges so the photo dissolves
into parchment.

**CSS treatment:**

```css
.photo.feathered {
  /* Radial mask: solid in the middle, fades to transparent at ~10% from edges.
     Reads as "edges feather out into the page background." */
  -webkit-mask-image: radial-gradient(
    ellipse at center,
    rgba(0,0,0,1) 50%,
    rgba(0,0,0,1) 70%,
    rgba(0,0,0,0) 92%
  );
          mask-image: radial-gradient(
    ellipse at center,
    rgba(0,0,0,1) 50%,
    rgba(0,0,0,1) 70%,
    rgba(0,0,0,0) 92%
  );

  /* Warm sepia overlay via filter — keeps source pixels but harmonizes
     into the palette. ~12% sepia + 92% brightness keeps faces readable
     without going full nostalgia-filter. */
  filter: sepia(0.12) saturate(0.88) brightness(0.94);
  transition: filter 0.4s ease;
}

.photo.feathered:hover {
  /* On hover, drop the grade so the user gets a hint that the original
     is one click away. */
  filter: sepia(0) saturate(1) brightness(1);
}

/* Dark mode: less sepia (the warm palette is already warm-on-dark), and
   slight desaturation to keep faces from being garish against deep walnut. */
[data-theme="dark"] .photo.feathered {
  filter: sepia(0.18) saturate(0.78) brightness(0.86);
}
[data-theme="dark"] .photo.feathered:hover {
  filter: sepia(0) saturate(1) brightness(1);
}
```

The mask values are tunable; the spec locks the *approach* (radial fade
to transparent), not the exact stops.

**Why not full background-removal:**

- Background-removed cutouts always have a slight halo or edge-cleanness
  problem.
- The dark stage backdrop is *part of the photo* — it gives the gesture
  presence. Stripping it makes Rafan a floating bust on parchment, less
  "presenting" and more "headshot."
- This treatment costs zero photo-editing work (pure CSS). If we ever
  want to revisit and try background-removal, the original file is still
  there.

**No paper frame in this treatment.** The whole point is to dissolve the
rectangle. A frame fights the mask.

**Caption.** Optional. Walnut italic, small type, below the photo.
Marker-style placeholder; user writes the real caption.

#### 4.3.3 Lightbox

- Click photo → backdrop fades in (200 ms, ~0.88 opacity sepia-ink in
  light mode, ~0.92 opacity in dark mode), image fits viewport with 5vw
  padding.
- Lightbox image has **no sepia grade, no feather** — show the photograph
  as taken.
- Click backdrop, Esc, or × button → close.
- Focus restored to the trigger on close.
- Reduced motion: instant open/close.

#### 4.3.4 Threshold layout with the photo

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                  ╭────────────────╮  │
│                                                  │                │  │
│                                                  │  [photo —      │  │
│                                                  │   feathered,   │  │
│                                                  │   sepia-toned, │  │
│   rafan                                          │   clickable    │  │
│   quader                                         │   lightbox]    │  │
│                                                  │                │  │
│   Computer Science @ SJSU. Aspiring to           │                │  │
│   participate in meaningful applications of      │                │  │
│   Computer Science, nudging humanity (well,      ╰────────────────╯  │
│   hopefully at least some of it) forward!                            │
│                                                                      │
│                                                                      │
│                       (tree at opacity 0.05 fills the whole          │
│                        threshold — both columns are above it)        │
│                                                                      │
│                              ↓                                       │
└──────────────────────────────────────────────────────────────────────┘
                              click here
                              (sticker — see §4.1)
```

- **Photo position:** absolute top-right, ~4–8% from each edge, max-width
  `min(38vw, 460px)`. Aspect ~3:4 (cropped from the original 1:1.05 — see
  §4.3.5 for crop notes).
- **Z-order:** photo sits *above* the tree canvas (`z-index: 1` vs tree's
  `-1`) but *below* the threshold's text content (`z-index: 2`). If the
  reader's name overflows on a narrow viewport, the text wins.
- **Tree-hint sticker** lives at the *bottom-right* (§4.1) so it doesn't
  overlap the photo at the top-right.
- **Reduced motion:** the on-hover-clear filter transition is shortened
  to 0.04 s (effectively instant) per `prefers-reduced-motion`.

**Mobile / narrow viewport (< 720 px):**

- Photo moves to *below* the tagline, centered, max-width ~70vw.
- Or alternatively (decide in implementation by testing both): hide on
  the smallest viewports (< 480 px) to keep the threshold focused on the
  name. I'd lean toward *show, just smaller* — the photo is part of the
  identity.

**The deferred portrait slot in [[Concept - Threshold Hero]] is reclaimed
by this photo.** The original concept reserved the slot for a future
posed portrait; rev2 makes this photo the chosen face. The portrait-
slot/fade-to-ink logic in `Threshold.astro` is removed and replaced by
the `<Photo treatment="feathered">` component.

#### 4.3.5 Crop notes for IMG_6565

The original photo is approximately square (1:1.05, 822 × 838 px). For
the threshold slot (3:4 aspect favored), suggest a crop:

- Keep: face, glasses, name tag, URO badge, the extended arm at left.
- Crop from: bottom-right where the podium edge runs out; top — leave
  some negative space above the head (don't crop tight to the hair).
- Resulting frame: ~3:4 portrait, ~720 × 960 px source.

Alternative (no crop, slightly wider): use the original 1:1.05 unchanged
and let the feather treatment dissolve the edges. This avoids the editing
step entirely. **I'd suggest the no-crop path first** — feathering already
softens the rectangle, and the gesture-arm is part of what makes the
photo good.

**Lightbox** shows whatever the source file is (uncropped if we go that
way).

#### 4.3.6 Files

```
public/images/
├── rafan-speaking-1-800.avif      # 800 px wide
├── rafan-speaking-1-800.webp
├── rafan-speaking-1-800.jpg
├── rafan-speaking-1-1200.avif     # 1200 px wide
├── rafan-speaking-1-1200.webp
├── rafan-speaking-1-1200.jpg
├── rafan-speaking-1-1600.avif     # 1600 px wide
├── rafan-speaking-1-1600.webp
└── rafan-speaking-1-1600.jpg
```

A small one-shot conversion script (`scripts/convert-photo.sh`, not
committed) uses `sharp-cli` to produce these from the source `IMG_6565.jpg`.

#### 4.3.7 Alternatives considered (photo treatment)

| treatment                                                 | recommendation status     |
|-----------------------------------------------------------|---------------------------|
| Original photo, rectangular, sepia-frame                  | Rejected — hard rectangle floats awkwardly on parchment |
| Full background removal (transparent PNG)                 | Rejected — cutout halo + loses stage atmosphere; "headshot," not "presenting" |
| Cutout that keeps the podium (background-remove just the room) | Rejected — fiddly editing, same halo problem |
| **Feathered radial mask + warm sepia overlay** (CHOSEN)   | Recommended — dissolves rectangle, harmonizes palette, zero editing |
| Sepia overlay only, no mask                               | Acceptable fallback if feathering tests poorly |

#### 4.3.8 Alternatives considered (photo placement)

| placement                                          | recommendation status                                                       |
|----------------------------------------------------|------------------------------------------------------------------------------|
| **Threshold top-right (CHOSEN, per rev2)**         | User's instinct; page-1-of-a-book composition; replaces deferred portrait slot |
| `on the work` (rev1's choice)                      | Rejected per rev2 — user prefers threshold                                  |
| Coda                                               | Could work as a memory-of-a-moment closer; deferred to a future pass        |
| Threshold center / dominant                        | Would overpower the name; restraint required                                |

#### 4.3.9 IMG_6566

Dropped from this design entirely (user's rev2 instruction: *"We don't
need to use both photos btw, I just provided both if for some reason you
though IMG_6566 would serve better for this purpose. I like IMG_6565
better!!"*). Removed from the public/images list. Source file stays at
`~/Desktop/portfolio_website_photos/IMG_6566.jpg` for the user's records.

#### 4.3.10 CURRENT TREATMENT — "print" + tree clearing (rev4 + rev5)

**Status:** shipped 2026-05-23. Supersedes rev2's "feathered mask + sepia
overlay" treatment.

**What it is.** A small printed-photo presentation. The full photograph
is rendered un-cropped and un-masked (gesturing hand, podium, mic, stage
all preserved). Integration with the parchment palette happens entirely
at the **edge** — a hairline accent-tinted ring + a soft drop shadow —
not via pixel-altering filters. True colors at rest; the only hover
change is a `brightness()` lift (no sepia, no saturation, no hue shift).

**Markup.**

```astro
<div class="threshold-photo">
  <Photo
    src="/images/rafan-speaking-1.jpg"
    alt="Rafan Quader speaking at an event"
    treatment="print"
  />
</div>
```

**Sizing + placement.** Top-right of the threshold, well clear of the
top-nav. Width `clamp(168px, 18vw, 224px)`. Aspect ratio preserved from
source (~1:1). Mobile (< 640px): photo collapses to relative position,
right-aligned below the tagline.

**CSS treatment** (see `src/styles/photo.css` `.photo.print`):

- `border-radius: 6px` on the `<picture>` wrapper (rounded card, not raw img)
- `box-shadow: inset 0 0 0 1px var(--photo-print-ring), var(--photo-print-shadow)`
- `filter: var(--photo-print-rest)` — defaults to `none` (true pixels)
- Hover: `filter: var(--photo-print-hover)` — `brightness(1.06)` light, `brightness(1.1)` dark
- Hover: `transform: translateY(-2px)` — a small lift that signals "look closer"

**Theme tokens** (`src/styles/tokens.css`):

| token                  | light                                            | dark                                          |
|------------------------|--------------------------------------------------|-----------------------------------------------|
| `--photo-print-rest`   | `none`                                           | `none`                                        |
| `--photo-print-hover`  | `brightness(1.06)`                               | `brightness(1.1)`                             |
| `--photo-print-ring`   | `color-mix(in srgb, var(--accent) 30%, …)`       | `color-mix(in srgb, var(--accent) 48%, …)`    |
| `--photo-print-shadow` | soft walnut tint                                 | deeper near-black                             |

Lightbox unchanged — clicking the photo opens it at original colors and
full size, with no filter / no mask / no clip.

**Tree clearing (rev5).** The threshold tree canvas now wears a CSS
radial mask that fades tree opacity to transparent inside an ellipse
centered on the photo. Branches gracefully thin out as they approach
the photo's footprint, so the photo no longer "amputates" branches at
its rectangular edge.

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

The clearing is disabled in two cases:

- `body[data-tree-mode="on"]` — when the user opens the tree to its
  full canvas, the photo is hidden and the tree should read edge-to-edge.
- `@media (max-width: 640px)` — on narrow viewports the photo is
  relative-positioned below the tagline, not floating in the upper-right,
  so the clearing would just look like a smudge in empty space.

**Why this beats the prior approaches.**

| treatment tried                    | failure mode                                                              |
|------------------------------------|---------------------------------------------------------------------------|
| Feathered radial mask + sepia      | Filter visibly desaturated the photo on hover-vs-rest; user rejected      |
| Soft-feathered rectangle           | Dark stage backdrop still read as a "mass on parchment"                   |
| Circular cameo                     | Clipped the gesturing hand — the spec literally said keep the extended arm |
| **Print + tree clearing (CHOSEN)** | Whole subject preserved; tree respects the photo's space; palette integration at the edge only |

**Trade-offs accepted.**

- The dark stage backdrop is still visible in light mode (the photo is
  not dissolved). The user's direction is "let it be a photograph";
  size + ring + clearing are what make it sit on the page comfortably.
- Dark mode does not lift exposure at rest — the photo's own subject is
  legible at native exposure against the dark walnut bg, and lifting
  would feel like a Hover-state-without-hover.
- The clearing's center + radius are hard-coded percentages. If the
  photo's position changes substantially, the clearing must be re-tuned.
  Mitigation: both are CSS vars; one-line change.

---

## 5. Interpretations made (rev2 — please confirm or override)

Current state after user rev2 corrections. Rejected rev1 interpretations
shown in the right column for traceability.

| #   | Phrase                                                          | Interpretation (rev2)                                                                                                                                                                                   | Notes / what changed from rev1                                                                |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | "a little click here sticker"                                   | Hand-applied paper sticker; 4 s visible; auto-dismiss; once-per-user                                                                                                                                    | Unchanged from rev1                                                                            |
| 2   | "pops up for a second when the site loads"                      | 800 ms after page interactive; held 4 s; fade-out 240 ms                                                                                                                                                | Unchanged from rev1                                                                            |
| 3   | "a tab with projects" / "another tab from the main tab" (rev2)  | **A separate `/projects` route** linked from the top nav. Not tab-switching within a section.                                                                                                          | Rev1 read this as tab-switching within `on the artifacts`. Wrong — corrected in rev2.        |
| 4   | "go thru the projects with maybe a photo, an accordion, some text" (rev2) | The `/projects` page scrolls through each project as a **chapter spread**: heading + cover media + narrative + native `<details>` accordion of cleaned notes + status/links.                          | Rev1 had this as a single active project with switching. Replaced with vertical chapters.   |
| 5   | "maybe an image or a video which is clickable"                  | Per-project cover image OR video. Image → lightbox (via `<Photo>`). Video → native controls + poster. Schema extended with `cover_video`.                                                              | Largely unchanged.                                                                             |
| 6   | "on the side a like like spread out set of papers" (rev1 wording) | **Dropped** in rev2. Notes are now a native `<details>` accordion within each chapter (cleaner, accessible by default, no JS).                                                                          | Rev1's scattered-papers component removed. The "spread of papers" visual sets aside.        |
| 7   | "some more natural places maybe at the top and bottom for text" | Top-of-`/projects` framing prose (~120–200 words) + bottom-of-page closing prose (~60–120 words). Marker-style placeholders.                                                                            | Same intent; now on the `/projects` page, not on the home section.                            |
| 8   | "I will also integrate more photos and such" (rev2 clarified)   | "More photos" = **project cover images and videos**, NOT more personal photos.                                                                                                                          | Rev1 read "more photos" as more personal photos. Wrong; corrected.                            |
| 9   | "I only need one photo of my face" (rev2)                       | One personal photo only: IMG_6565. IMG_6566 dropped from the design entirely.                                                                                                                           | New in rev2. Rev1 had IMG_6566 reserved.                                                      |
| 10  | "where would it be placed right? I feel like the top right of the main/first tab" (rev2) | **Top-right of threshold.** Page-1-of-a-book composition. Photo treated with feathered radial mask + warm sepia overlay (the "fade-to-parchment" treatment) — not a hard rectangle, not a cutout.    | Rev1 placed photo in `on the work` with a sepia paper frame. Both wrong; corrected.          |
| 11  | "Should I make it transparent?" (rev2 question)                 | **No full background-removal.** Soft-feathered edges (CSS radial mask) so the photo dissolves into the parchment, but the original stage backdrop is preserved. Reasoning in §4.3.2.                  | New in rev2.                                                                                   |
| 12  | "should we make it enlarge on click in the main tab" (rev2)     | Yes, lightbox on click. Lightbox shows the photo at original colors / no sepia grade / no feather — the page-level treatment is to harmonize, the lightbox is to look at the photograph as taken.    | Unchanged in principle from rev1.                                                              |
| 13  | "I don't hate #6 plan, but u can think abt that" (rev2)         | Reading as "I don't hate §6's plan to keep backlog ADRs 008–011 as a separate doc-pass, but think about it." Reaffirmed: backlog ADRs stay separate from this implementation. Spec §6 note retained. | New in rev2. Term ambiguity flagged per Working Agreement 8.                                  |

## 6. Open questions / decisions for the user

1. **Sticker copy.** Default `↘ click the tree`. Alternatives in §4.1
   (`↘ try the tree`, `tap to tune ↘`, `↘ tune the tree`).
2. **Photo crop.** Default: **no crop, use the original 1:1.05 frame** and
   let the feathered mask soften the edges. Alternative: crop to ~3:4
   portrait removing the bottom-right podium edge. Recommendation:
   no-crop first (zero editing, gesture-arm preserved); revisit if the
   threshold composition feels off.
3. **Photo aspect at the threshold.** Default: `max-width: min(38vw, 460px)`,
   aspect inherited from the source. Smaller-thumbnail or taller-banner
   variations are possible.
4. **Project cover lightbox.** Default **on** for project images. Per-project
   opt-out via `cover_lightbox: false` in frontmatter — deferred until a
   real project wants it.
5. **Notes accordion default state.** Default in this spec:
   `field/` open, `decisions/` closed, anything else closed. Easy override
   per-project if any project's editorial intent differs (e.g., a
   decision-led project where ADRs should be the open default).
6. **Backlog ADRs (008–011).** Confirmed in rev2 (interpretation #13):
   **separate doc-pass**, not this implementation.
7. **Home→projects affordance.** With `on the artifacts` removed from
   home, the only path to `/projects` is the top-nav link. Should there
   also be a one-line "see projects" affordance somewhere on the home
   page (e.g., end of `on the work`, or start of `on the trail`)? I'd
   default to **no** — the top-nav is the affordance. Easy to add later.
8. **Theme toggle persistence across routes.** Existing theme toggle uses
   `localStorage` so it already persists across pages. Verify on `/projects`
   that the FOUC script in `Base.astro` fires before paint there too
   (should be automatic since `Base.astro` is the shared layout).

## 7. Acceptance criteria

When this work is done:

- [ ] Tree click-hint sticker visible on first visit, dismisses on interaction
      (click / scroll / key / touch), doesn't reappear on next load.
- [ ] Clicking the sticker also enters tree-mode (sticker is a `[data-tree-open]` button).
- [ ] `Threshold.astro` renders the personal photo top-right with feathered
      radial mask + warm sepia overlay. Hover removes the grade (shows original
      colors).
- [ ] Clicking the threshold photo opens a lightbox at original colors and
      full size. Esc / backdrop click / × button closes; focus restored to
      trigger.
- [ ] `<picture>` markup for the threshold photo serves AVIF first, WebP
      fallback, JPG fallback, at 800 / 1200 / 1600 widths via `srcset`.
- [ ] `/projects` route exists (`src/pages/projects.astro`), accessible from
      top-nav.
- [ ] `/projects` renders top-of-page framing prose, one chapter per project
      (sort_order ascending), and bottom-of-page closing prose. All marker-
      style placeholders.
- [ ] Each chapter shows: title + tagline, cover media (image or video per
      §3.4 precedence), narrative prose (`_index.md`), status + github/download
      links inline, notes accordion (`ProjectNotes`), chapter rule.
- [ ] Notes accordion: native `<details>` grouped by top-level directory
      (`field/` open by default, others closed); each note's body renders
      with `obsidian-notes.css` treatment.
- [ ] Clicking project cover image opens lightbox (same primitive as the
      personal photo).
- [ ] Direct link `/projects#<slug>` scrolls to the chapter; `/projects#<slug>-<rel-path>`
      scrolls to and opens the right note (`:target` CSS opens the `<details>`).
- [ ] Top-nav: shows `/projects` link in the right place; active state
      distinguishes route (`/projects`) from in-page section (`/#on-me`).
- [ ] Home page (`/`) no longer has the `OnTheArtifacts` section or
      `FolderReader` mount. Order: threshold → on me → on the work → on the
      trail → coda.
- [ ] All removed files in §3.2 are deleted from disk.
- [ ] `npm run check` → 0 errors / warnings / hints across all .astro/.ts.
- [ ] `npm run build` → builds clean; both `/` and `/projects` in sitemap;
      total client JS still under 30 KB gz (current baseline ~7 KB; expect
      ~+6–10 KB for projects page + photo + tree-hint; significantly less
      than rev1's tabs primitive).
- [ ] Reduced-motion respected on sticker, lightbox, and photo-filter
      transitions.
- [ ] No vault paths in any source file or build step (Working Agreement 2).
- [ ] All live-site body copy is the user's (Working Agreement 7) — placeholders
      are marker-style.

## 8. Doc updates required when this lands

- [ ] Write `Concept - Projects Page.md` (replaces `Concept - Manila Folder Gallery.md`).
- [ ] Delete `Concept - Manila Folder Gallery.md`.
- [ ] Update [[02 - Architecture]] for `src/pages/projects.astro`,
      `src/components/project/`, `src/components/photo/`, removed
      folders/* directory.
- [ ] Update [[03 - Content Model]]: remove `on the artifacts` section
      entry (no longer on home); add `/projects` page entry describing
      the chapter structure + content collections.
- [ ] Update [[Concept - Threshold Hero]] for the personal-photo slot
      (replaces the deferred portrait slot) and feathered treatment.
- [ ] Write `decisions/ADR-012-gallery-v2-projects-page.md` (chapter spreads
      on a separate route).
- [ ] Write `decisions/ADR-013-personal-photo-threshold-feathered.md`
      (placement + treatment).
- [ ] Write `decisions/ADR-014-tree-click-hint-sticker.md`.
- [ ] Update [[00 - Index]] file inventory.
- [ ] Update [[Open Questions]]: mark "manila folder direction" resolved;
      mark "portrait photo" resolved (this photo replaces the slot); drop
      "IMG_6566 placement" (no longer in scope).
- [ ] Append a `Process Journal` block summarizing this pass.

## 9. See also

- [[01 - Philosophy]] — traceability principle; the chapter accordion
  surfaces cleaned notes inline so the *how* lives next to the *what*.
- [[Working Agreements]] — the canonical rules every piece of this honors.
- [[specs/2026-05-18-tree-leaves-folders-design]] — the prior spec; the
  gallery + reader portion is superseded by this one.
- [[Concept - Threshold Hero]] — tree mode, sticker, and personal-photo
  slot all live here. Doc update required (§8).
- [[Concept - Synesthesia Goals]] — chapter titles could carry synesthesia
  tint (deferred; out of scope for this spec).

## 10. Revision log

- **rev1** (2026-05-22 evening) — initial autonomous draft. Architecture:
  tabbed magazine spread within `on the artifacts`; scattered papers as
  the doc surface; personal photo in `on the work`.
- **rev2** (2026-05-22, in-session) — user clarified all three sub-features:
  - "tab with projects" = a separate `/projects` route, not in-section tabs
  - Per project: chapter spread (cover media + narrative + notes accordion)
  - "More photos" = project covers, not more personal photos
  - One personal photo only (IMG_6565)
  - Photo placement: threshold top-right, not on the work
  - Photo treatment: soft-feathered radial mask + warm sepia overlay,
    not a sepia paper frame; not full background-removal
  - Click-to-lightbox confirmed
  - Backlog ADRs 008–011 stay separate from this implementation
