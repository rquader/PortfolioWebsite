---
tags: [spec, design, projects-page, editorial-layout, notes-popup, story-mode]
date: 2026-05-24
status: draft
brainstormed_by: claude-opus-4-7-1m (in /brainstorm visual companion session with user)
revisions:
  - rev1 2026-05-24 — initial draft after live brainstorm. Editorial alternating rows + Story/Info toggle + centered Folio popup with tabs+stepper for note nav (one note at a time, nested-folder aware).
supersedes:
  - specs/2026-05-22-gallery-v2-photo-sticker-design.md §§ on projects-page chapter layout and inline notes accordion (the photo + chapter-spread *concept* survives; the *implementation shape* changes)
unlocks_adrs: [ADR-015, ADR-016, ADR-017]
---

# 2026-05-24 — Projects Page Redesign (Editorial Rows + Notes Popup) — Design Spec

> **Status:** draft. Co-developed live with the user via the brainstorm visual
> companion. Visual mockups archived at
> `.superpowers/brainstorm/62648-1779612025/content/` (repo-local, gitignored).
> The user confirmed each step; surfacing ambiguities is in §5. Two open
> questions remain in §8 that the user passed on during the session.

## 1. Summary

Rework `/projects` along three interlocking axes:

1. **Editorial alternating rows.** Replace the single-column chapter stack with
   alternating photo/text rows (left/right, right/left, …) — magazine-spread
   shape. Each row has the project's cover, title, tagline, short body, one
   distinguished **Notes** button, and a row of **modular link buttons** that
   only render for the URLs the project actually has.

2. **Story / Info page mode toggle.** A segmented control in the page header
   that switches every row's body text between two modes:
   - **Info mode** — per-project description blurbs (what the app is, platform,
     audience, one decision worth surfacing).
   - **Story mode** — a connective autobiographical thread that runs *across*
     the projects — "where I was at" voice — each project shows a story
     segment that picks up from the previous one.

   Same layout, same rows, same buttons — only the body text swaps.

3. **Centered Folio popup for working notes.** The Notes button opens a
   centered paper-card popup with the project's cleaned Obsidian notes
   inside. Inside the popup:
   - **Top-level folders are tabs** (field, decisions, journal, credits, …).
   - **Prev/next stepper** walks through notes inside the active tab, including
     nested files at any depth. **One note shown at a time.** No nested
     accordion, no multi-open.
   - **Sub-path breadcrumb** appears above the note title only when the
     current file lives below the tab folder (e.g. `field › decisions`).
   - **Lighter backdrop** (28% scrim, no blur) so the editorial page stays
     visible behind — answers the user's "B looks better but A feels less
     intrusive" tension by softening B rather than switching pattern.

The user's main constraint on the popup was *"not intrusive, not unclean, not
overdone."* The chosen pattern is the minimal possible Obsidian-flavored read:
one tab strip, one stepper, one note. The "really cool, really fun, really
creative" payoff lives in the **soft-paper aesthetic** (subtle parchment grain,
folio-card framing, inset paper tone for the body) rather than in interaction
gymnastics.

Three ADRs unlock: ADR-015 (editorial alternating layout), ADR-016 (notes
popup pattern), ADR-017 (story/info mode toggle).

## 2. Goals and non-goals

**Goals**

- Replace the visually-flat chapter stack with an editorial alternating rhythm
  that lets each project breathe and reads as a deliberate magazine spread.
- Make traceability **visible and clickable** without making the working
  notes co-resident with the headline. The current inline `<details>`
  accordion pulls the eye downward; pushing notes into a popup keeps the
  editorial surface clean while the popup is the reading-depth.
- Honor the existing soft-paper / parchment aesthetic ([[01 - Philosophy]],
  [[ADR-007 palette sepia shift|ADR-007]]) inside the popup — the popup feels
  like opening a folio of working papers, not a system modal.
- Light and dark mode are both first-class. Light = parchment / walnut /
  terracotta. Dark = deep walnut / warm cream / amber. The existing
  `:root[data-theme=…]` switch in `TopNav` flips both the page and the popup.
- Modular link buttons — schema-driven, only present URLs render. Easy to add
  a new link type (app store, paper, blog post) by extending the schema and
  registering an icon.
- One toggle (story/info) controls the prose register across the whole page;
  no per-row reset. State persists across refresh and is deep-linkable.
- Honor [[Working Agreements]]:
  - ADRs for the three non-trivial decisions (§6). [[Working Agreements#1. Tradeoff documentation is mandatory|WA-1]]
  - No vault read at build time — all curation through the existing pipeline.
    [[Working Agreements#2. The site never reads from the personal Obsidian vault|WA-2]]
  - User writes all live-site body copy — every body text slot is a
    `[PLACEHOLDER — …]` marker; no synthetic voice. [[Working Agreements#7. The user writes all live-site body copy|WA-7]]
  - Ambiguous terms surfaced up front. [[Working Agreements#8. Clarify ambiguous terms before executing|WA-8]] (§5 here)

**Non-goals (this pass)**

- **No nested accordion** inside the popup. User explicitly rejected
  multi-open / drill-in patterns this session.
- **No sub-folder-as-sub-tab.** Tabs are top-level folders only; recursive
  tab strips were considered and ruled out as visually heavy.
- **No anchored / drawer popup placement.** Centered folio is the chosen
  shape. The "side drawer" alternative (Option A in the brainstorm) is
  retired with the lighter-backdrop fix on Option B; documented in ADR-016
  for future revisit.
- **No per-project deep route.** All projects continue to live on the
  single `/projects` page. Popup deep-links live in the URL hash, not in
  a separate route.
- **No content authoring.** Every body-text slot stays a placeholder. The
  user writes the info-mode descriptions and the story-mode segments
  himself ([[Working Agreements#7. The user writes all live-site body copy|WA-7]]).
- **No animation polish beyond a 200 ms ease.** The popup opens and closes
  with a scale + fade; no shared-element transitions, no spring physics,
  no choreography. (Can revisit.)
- **No migration of real projects.** Sample project's `field/` and
  `decisions/` structure is the only test fixture for this spec. Real
  projects move in via the existing content pipeline ([[04 - Content Pipeline]])
  after this lands.
- **No notes-button label change** in this pass. We ship with "open notes"
  + ◰ glyph and revisit per §8 if the user picks one of the alternatives.

## 3. Architecture

### 3.1 Modules added, modified, retired

```
src/
├── pages/
│   └── projects.astro                      MOD  — header gains mode toggle; chapter list unchanged shape
├── components/
│   ├── project/
│   │   ├── ProjectChapter.astro            MOD  — two-column alternating, button row, no inline notes
│   │   ├── ProjectMedia.astro              KEEP — already does its job
│   │   ├── ProjectNotes.astro              RETIRE — replaced by ProjectNotesPopup
│   │   ├── ProjectNotesPopup.astro         NEW  — the centered Folio popup
│   │   ├── ProjectLinks.astro              NEW  — modular link button row
│   │   └── ProjectModeToggle.astro         NEW  — story/info segmented control
│   └── …
├── lib/
│   └── notes-graph.ts                      NEW  — pure data: builds {tabs: [{name, notes: [{leaf, subPath, sortKey, Content}, …]}, …]} per project
└── styles/
    ├── projects.css                        MOD  — alternating row grid + mode toggle + notes button
    ├── notes-popup.css                     NEW  — popup scoped styles (paper, tabs, stepper, breadcrumb chip)
    └── obsidian-notes.css                  KEEP — same content styling reused inside the popup body
```

Sample project's content tree gains a new file convention:

```
src/content/projects/<slug>/
├── _index.md          — project frontmatter + info-mode body
├── story.md           — story-mode body  (NEW convention; optional but recommended)
├── field/             — top-level folder → "field" tab
│   ├── architecture.md
│   ├── audio-rendering.md
│   └── decisions/     — nested folder → breadcrumb appears for these files
│       ├── ADR-001-storage.md
│       └── ADR-002-ui.md
├── decisions/         — top-level folder → "decisions" tab
├── journal/           — top-level folder → "journal" tab
├── credits/           — top-level folder → "credits" tab
├── images/
└── videos/
```

### 3.2 Content collection schema changes (`src/content/config.ts`)

```ts
const projects = defineCollection({
  loader: glob({ pattern: '**/_index.md', base: './src/content/projects' }),
  schema: z.object({
    // existing
    title:        z.string(),
    tagline:      z.string(),
    sort_order:   z.number(),
    cover_image:  z.string().optional(),
    cover_video:  z.string().optional(),
    status:       z.enum(['archived', 'active', 'shipped']).default('shipped'),
    github_url:   z.string().url().optional(),
    download_url: z.string().url().optional(),
    // new — modular link buttons
    web_url:      z.string().url().optional(),
    app_store_url: z.string().url().optional(),
    demo_url:     z.string().url().optional(),
    paper_url:    z.string().url().optional(),
  }),
});

// projectFiles loader excludes _index.md anywhere and story.md
// AT THE PROJECT ROOT only — a hypothetical nested file named
// story.md would still be treated as a regular note.
const projectFiles = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_index.md', '!*/story.md'],
    base: './src/content/projects',
  }),
  schema: z.object({
    title:      z.string().optional(),
    sort_order: z.number().optional().default(0),
  }),
});

// Story-mode content for each project (NEW). Pattern is single-segment
// `*/story.md` so nested story.md files are not loaded as project stories.
const projectStories = defineCollection({
  loader: glob({ pattern: '*/story.md', base: './src/content/projects' }),
  schema: z.object({}).optional(),  // body only; no frontmatter required
});

export const collections = { projects, projectFiles, projectStories };
```

Rationale:
- `_index.md` continues to be the canonical project entry — frontmatter +
  info-mode body. Renaming it would break Astro's globbing convention and
  the Obsidian landing-file mirror.
- `story.md` is a sibling file at the project root. Its presence is optional;
  if absent, story mode falls back to the same `[PLACEHOLDER]` marker that
  info mode shows.
- All other `.md` files at any depth remain `projectFiles` (the notes).

### 3.3 The notes graph (`src/lib/notes-graph.ts`)

```ts
export interface NoteEntry {
  fileId:   string;           // 'adhkar-counter/field/decisions/ADR-001-storage'
  leaf:     string;           // 'ADR-001-storage'
  title:    string;           // frontmatter.title || leaf
  subPath:  string[];         // ['decisions']  (segments between the tab folder and the leaf)
  sortKey:  string;
  Content:  AstroComponent;   // rendered markdown
}

export interface Tab {
  name:  string;              // 'field' | 'decisions' | …
  notes: NoteEntry[];
}

export interface NotesGraph {
  slug:       string;
  totalCount: number;
  tabs:       Tab[];
}

export async function buildNotesGraph(
  project: CollectionEntry<'projects'>
): Promise<NotesGraph>;
```

Sort order within a tab: by `frontmatter.sort_order` ascending, then by the
file's full relative path ascending (so `field/decisions/ADR-001` sorts after
`field/audio-rendering.md` when both have `sort_order=0`).

The current logic in `ProjectNotes.astro` line 27 flattens nested paths into
the top-level group name and **discards `subPath`**. The new logic preserves it.

### 3.4 Page-level mode state

Mode (`info` | `story`) is held in three places, in priority order:

1. **URL query parameter** `?mode=story` — the source of truth for deep linking.
2. **localStorage** key `rq-projects-mode` — sticky preference between visits.
3. **Default** `info`.

On page load: hydrate from URL first, then localStorage, then default. On
toggle click: update both URL (push state, no navigation) and localStorage.
Emit a `projects:mode-change` `CustomEvent` on `document`; each
`ProjectChapter` listens and swaps its body content (the `_index.md`
`<Content/>` for info, the `story.md` `<Content/>` for story).

Both content slots render at SSR time (Astro). Client-side toggle just changes
which slot is visible (CSS class). No re-render, no fetch.

### 3.5 Popup state

Popup open/close + active tab + active note live entirely in the URL hash:

```
#notes/adhkar-counter                                    → popup open, default tab+note
#notes/adhkar-counter/field                              → popup open on `field` tab, first note
#notes/adhkar-counter/field/decisions/ADR-001-storage    → popup open at a nested file
```

On `hashchange`: parse, open/close popup accordingly. Existing
`projects.astro` script (lines 50–65) already opens `<details>` from hash;
this replaces that script with the popup variant.

Closing the popup clears the `#notes/…` portion of the hash.

Only one popup is open at a time. Opening a second one (e.g. clicking another
project's Notes button) closes the first.

### 3.6 Popup interaction details

| | |
|---|---|
| **Open** | click Notes button → popup mounts, animates in (200ms ease, scale 0.96→1, opacity 0→1) |
| **Close** | Esc · backdrop click · × button · clicking a different project's Notes button |
| **Tab change** | click → switches to that folder's first note; updates hash; stepper position resets to "1 of N" |
| **Stepper next** | →  · button click · keyboard → · advances within the active tab; disables at last note (no wrap) |
| **Stepper prev** | ← · button click · keyboard ← · symmetric |
| **Focus** | on open, focus moves to the close button. On close, focus restores to the trigger Notes button. Tab key cycles focusable elements inside the popup (focus trap). |
| **Scroll lock** | `<body>` scroll locks while popup is open. Popup body scrolls internally. |
| **Hash on tab/note change** | replaceState so the popup state is shareable but doesn't pollute history. |

### 3.7 Accessibility

- `role="dialog"` + `aria-modal="true"` on the folio card.
- `aria-labelledby` points at the project title inside the popup.
- Tabs use `role="tab"` + `role="tablist"` + `aria-selected`.
- Note body is `role="tabpanel"` keyed to the active tab.
- All interactive elements keyboard-accessible.
- Disabled stepper arrows get `aria-disabled="true"`.
- Mode toggle is a `role="radiogroup"` with two `role="radio"` buttons.

## 4. Component contracts

### 4.1 `ProjectChapter.astro`

```ts
interface Props {
  project: CollectionEntry<'projects'>;
  story?: CollectionEntry<'projectStories'> | null;
  notesGraph: NotesGraph;
  index: number;        // for alternation: index % 2 === 0 → photo-left
  isLast?: boolean;
}
```

Renders:
- Two-column grid (`1.05fr 1fr`). Photo column has `order: 2` when
  `index % 2 === 1` to flip the row.
- Title + tagline (always).
- Body: **two slots**, both SSR-rendered, only one visible at a time:
  - `<div data-mode-content="info"><InfoContent /></div>`
  - `<div data-mode-content="story" hidden><StoryContent /></div>`
  CSS toggles via `[data-page-mode="story"] [data-mode-content="info"] { display: none }` and vice-versa.
- Notes button (single, primary affordance).
- `<ProjectLinks project={project} />`.
- Status chip.

Removes:
- The inline `<ProjectNotes>` block.
- The inline `<Content>` story (replaced by the dual slots above).

### 4.2 `ProjectLinks.astro`

```ts
interface Props {
  project: CollectionEntry<'projects'>;
}
```

Internal table:

```ts
const LINK_TYPES = [
  { key: 'github_url',    icon: '↗', label: 'github'    },
  { key: 'web_url',       icon: '⊕', label: 'live site' },
  { key: 'download_url',  icon: '⤓', label: 'download'  },
  { key: 'app_store_url', icon: '⌬', label: 'app store' },
  { key: 'demo_url',      icon: '▶', label: 'demo'      },
  { key: 'paper_url',     icon: '¶', label: 'paper'     },
] as const;
```

Renders only the buttons whose `key` is defined in `project.data`. Adding a
new link type is one row in `LINK_TYPES` plus a schema field.

### 4.3 `ProjectNotesPopup.astro`

```ts
interface Props {
  project: CollectionEntry<'projects'>;
  notesGraph: NotesGraph;
}
```

SSR-renders the full markup hidden by default (`<dialog>` element kept closed;
or a `<div aria-hidden="true">` toggled by a controller script). All note
bodies are SSR'd — no fetching on open. Memory cost is one project's notes
per popup; acceptable.

A small client script:
- Listens for the open trigger (the project's Notes button + hash matches).
- Manages tab+stepper state.
- Updates the hash on change.
- Handles keyboard navigation.

### 4.4 `ProjectModeToggle.astro`

```ts
interface Props {
  defaultMode?: 'info' | 'story';
}
```

Renders a `role="radiogroup"` with two buttons. Hydrates on mount: reads URL,
then localStorage, then default; sets `document.documentElement.dataset.pageMode`.
On click: updates state, URL, localStorage, and emits the custom event.

### 4.5 `notes-graph.ts` API

Pure function — no DOM, no fetch — that takes the projects + projectFiles
collections and produces the typed structure in §3.3. Unit-testable.

## 5. Open interpretations / ambiguities surfaced

Per [[Working Agreements#8. Clarify ambiguous terms before executing|WA-8]],
ambiguous moves I made during the brainstorm that the user should sanity-check:

1. **"the last second one"** (user message mid-brainstorm) — I read this as
   *"the second option from the previous screen"* = Option B (centered folio
   with tabs + stepper) from `popup-options.html`. Confirmed by the
   one-note-at-a-time constraint that followed, which is what that pattern
   does natively. If the user actually meant Option C (paper side panel) from
   `popup-v2.html`, the popup shape needs revisiting before implementation.

2. **"soft paper aesthetic, well an aesthetic that works with the page
   (maybe separate for dark/light mode??)"** — read as: use parchment paper
   feel in light mode and a warm dark-walnut equivalent in dark mode; both
   derive from the existing `:root[data-theme]` palette (ADR-007), no
   per-popup theme switch.

3. **"a story that goes thru all the apps like where I was at"** — read as:
   each project has its own story-mode segment that connects to the next.
   Implemented as per-project `story.md` files (§3.2). The alternative —
   one master `story.md` with anchors — is in §8 as an open question.

4. **"buttons for traceability with the Obsidian notes"** — read as: one
   prominent Notes button per project (popup trigger), separate from the
   smaller external-link buttons (github, web, …). Not one button per
   folder, not one button per note.

5. **End-of-folder behavior in the stepper** — chose *no wrap-around*
   (gray-out the disabled arrow). User accepted by silence during the
   nested-folders mockup; if wrap is preferred, this is a one-line change.

## 6. Decisions worth documenting (ADRs)

### ADR-015 — Editorial alternating layout for `/projects`

- **Decision:** Single-column chapter stack replaced by alternating two-column
  rows (photo left/text right, then flipped, then flipped again …).
- **Alternatives:** (a) keep single-column stack — simpler, but visually flat;
  (b) responsive grid of project cards with click-to-expand — explored in
  prior gallery v1, rejected; (c) horizontal scroll deck — wrong reading
  metaphor.
- **Tradeoffs:** Editorial rhythm is the gain. The cost is more vertical
  height per project, and the alternation must hold on mobile by stacking
  (photo above text) — the directional flip becomes invisible.
- **Revisit if:** users report scroll fatigue on long lists, or if mobile
  reads worse than the inline-card pattern.

### ADR-016 — Centered Folio popup for notes navigation

- **Decision:** Notes open in a centered paper-card popup with top-level
  folder tabs and prev/next stepper. One note at a time. No nested
  accordion.
- **Alternatives considered:** (A) Side drawer (anchored right, two-pane
  with folder/note rail + content) — user said it "felt less intrusive"
  but didn't pick it; (B') Centered folio with nested accordion (multi-open)
  — user explicitly rejected after seeing it; (C) Paper side panel hybrid
  — proposed, not chosen.
- **Tradeoffs:** The folio is more visually deliberate but covers more of
  the page than a drawer would. Mitigation: lighter 28% backdrop + narrower
  card (520px max) so the editorial layout stays partially visible.
  Tab-then-stepper means you can't see all notes-in-a-tab at once; if the
  reader wants the inventory, they cycle through.
- **Revisit if:** users get lost in deeply nested folders (then we add a
  small in-tab note list above the stepper, or break the spec by allowing
  sub-tabs).

### ADR-017 — Story / Info page-mode toggle

- **Decision:** A page-level segmented control swaps every chapter's body
  prose between two registers — *info* (per-project blurb) and *story*
  (connective autobiographical thread). State persists via URL param +
  localStorage.
- **Alternatives:** (a) per-project toggle (too much chrome); (b) two
  separate pages (`/projects/info` and `/projects/story` — duplicates the
  layout, fights the editorial intent); (c) story-only or info-only
  (loses one of the two intents the user named).
- **Tradeoffs:** Doubles the body-text authoring effort — the user has to
  write both info blurbs and story segments. Mitigation: story can be
  shipped progressively (story-mode falls back to a placeholder if
  `story.md` is missing).
- **Revisit if:** the user finds himself only writing one of the two
  modes in practice — at that point either drop the toggle or pick the
  surviving mode as default.

## 7. Implementation plan (rough phases)

Phases are written assuming the writing-plans skill will break each into
bite-sized tasks afterward.

**Phase 1 — Editorial rows (no popup, no toggle yet)**
1. Refactor `ProjectChapter.astro` to two-column alternating grid.
2. Move inline `<Content />` into the `data-mode-content="info"` slot.
3. Create `ProjectLinks.astro` + register `LINK_TYPES`.
4. Add `web_url`, `app_store_url`, `demo_url`, `paper_url` to schema.
5. Refactor `projects.css` for the new grid + button styles.
6. Validate light + dark mode in a browser.

**Phase 2 — Mode toggle**
1. Add `projectStories` collection in `config.ts`.
2. Create `ProjectModeToggle.astro` (with URL + localStorage hydration).
3. Add `data-mode-content="story"` slot to `ProjectChapter` (hidden by default).
4. Wire the custom event + CSS visibility swap.
5. Add the `story.md` placeholder to the sample project.

**Phase 3 — Notes popup**
1. Build `notes-graph.ts` (preserve subPath, sort, walk).
2. Build `ProjectNotesPopup.astro` (markup + scoped CSS).
3. Hash-based open/close + tab/note state script.
4. Keyboard nav + focus trap + scroll lock + animations.
5. Retire `ProjectNotes.astro`.
6. Validate nested-folder case with the sample project's `field/decisions/`.

**Phase 4 — Polish**
1. Soft-paper grain detail tuning (the SVG noise data-URI tested in mockup;
   may simplify to a CSS gradient if cheaper).
2. A11y verification (screen-reader pass on the popup).
3. Mobile layout: alternation collapses to single-column; popup becomes
   near-full-screen on narrow viewports.
4. Reduced-motion fallback (`prefers-reduced-motion`): pop, no scale.

## 8. Open questions (carry into the implementation plan or back to brainstorm)

1. **Notes button label voice.** Shipping with `◰ open notes` + count. User
   didn't pick from the alternatives "look inside" / "behind the work" /
   "the working notes" / "field notes". Easy late-stage tweak.

2. **Story source pattern.** Spec assumes per-project `story.md` files
   (symmetric with `_index.md`). The alternative — one master `story.md`
   with `## adhkar-counter` anchors — was offered and not chosen.
   *Recommendation:* per-project for symmetry; if the user finds writing
   the connecting tissue easier in one file, we can collapse later by
   merging `story.md` files into one and adding a build-step split.

3. **Mode persistence scope.** URL param + localStorage is the chosen model.
   Open question: should localStorage be cross-page (`rq-projects-mode`
   only on `/projects`) or site-wide? Default: page-scoped — story/info
   only applies to `/projects`, nothing else uses it.

4. **Wrap-around at end of folder.** Spec assumes no wrap. Confirm with user
   on first implementation review.

5. **Existing `ProjectNotes.astro`.** Spec retires it. Confirm we don't need
   it as a fallback (e.g. for print stylesheet that bypasses the popup).

## 9. References

- Brainstorm session 2026-05-24, visual companion screens archived at
  `Portfolio_Website/.superpowers/brainstorm/62648-1779612025/content/`
  (repo-local, gitignored):
  - `accordion-meaning.html` — clarifying "Obsidian Accordion" ambiguity
  - `editorial-row.html` — first alternating-rows mockup
  - `row-v2.html` — adds mode toggle and modular link buttons
  - `row-v3-themed.html` — light + dark side-by-side
  - `popup-options.html` — Option A (drawer) vs Option B (folio) for popup
  - `popup-v2.html` — nested accordion variants (rejected)
  - `popup-folio.html` — returned to Option B with lighter backdrop
  - `popup-nested.html` — final: nested-folder handling
- Supersedes parts of [[specs/2026-05-22-gallery-v2-photo-sticker-design]]
  (the projects-page chapter layout + inline notes accordion sections).
- Predecessor concept: [[Concept - Manila Folder Gallery]] — the
  reading-panel idea survives; the manila card aesthetic does not.
- [[Working Agreements]] · ADR rigor, no-vault-read, user writes copy,
  ambiguous-term policy.
- [[01 - Philosophy]] · traceability as a first-class value.
- [[ADR-007 palette sepia shift]] · light/dark token system reused.
- Existing code touched: `src/pages/projects.astro`,
  `src/components/project/ProjectChapter.astro`,
  `src/components/project/ProjectMedia.astro`,
  `src/components/project/ProjectNotes.astro`,
  `src/content/config.ts`,
  `src/styles/projects.css`,
  `src/styles/obsidian-notes.css`.
