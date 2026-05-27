---
tags: [concept, primitive, gallery]
---

# Concept — Manila Folder Gallery

> The projects browser. Each project is a manila-tab folder. Clicking a folder opens a reading panel showing the project's story, cover image, and (cleaned) field notes.

## What it is

The "on the artifacts" section. Visually evokes Obsidian's folder UI / a desk full of literal manila folders — a stack of cards each with a small tab at the top. The reader can:

1. **Browse** — see all folders at once, with title, tagline, and a small cover thumbnail.
2. **Open** — click a folder. A reading panel slides out (in-page; no route change) showing:
   - the cover image (small)
   - the project story (`index.md` rendered)
   - a list of field-note titles (accordion-style — each opens inline)
   - GitHub / download links if present
3. **Close** — click outside, press Escape, or click a close affordance. The folder closes; the gallery is back.

No project-detail routes. The state is in-page. URL anchors are nice-to-have: `#project-<slug>` opens that folder on direct link.

## Why

The user values traceability — the visible documentation of how something was made. A grid of project cards would hide that. A folder metaphor that physically opens into the project's notes makes the *process* visible alongside the *outcome*, in keeping with [[01 - Philosophy#what this site has to do]] point 3.

The manila aesthetic is also a deliberate visual rhyme with the user's Obsidian workflow. A reader who recognizes the affordance immediately understands: "these are his actual working notes."

## Visual design

### Closed (gallery view)

```
   ┌───┐   ┌────┐    ┌─────┐
   │ ↘ │   │  ↘ │    │   ↘ │      ← little tabs at the top of each card
┌──┴───┴───┴────┴────┴─────┴──┐
│                              │
│   ╔═══════════╗  ╔═════════╗ │
│   ║           ║  ║         ║ │
│   ║ cover img ║  ║ cover   ║ │
│   ║           ║  ║         ║ │
│   ╚═══════════╝  ╚═════════╝ │
│   AdhkarCounter  Arabic       │
│   a quiet         Dialect    │
│   counter…        Map        │
│                              │
└──────────────────────────────┘
```

- Each folder card is a column ~clamp(260px, 28vw, 320px) wide.
- Cards laid out in a flexible grid — `display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));`.
- The "tab" at the top is a small `::before` pseudo-element with a slight offset so the cards look stacked.
- Background of each card is a "manila" warm-paper tone (`--paper-1: #e6dcc5` or similar) over the dark room. Restrained — not garish yellow.
- Cover image is `object-fit: cover` inside a ~16:10 box at the top of the card.
- Title in serif, tagline in italics below.
- Hover: card lifts ~2 px with a tiny shadow change. No more, no less.

### Open (reading panel)

```
┌─────────────────────────────────────────────────────┐
│  ◂ back to the shelf                            [×] │
│                                                      │
│  AdhkarCounter                                       │
│  a quiet counter for daily remembrance               │
│                                                      │
│  [cover image small]                                 │
│                                                      │
│  ¶ Story rendered from index.md …                    │
│  ¶ …                                                 │
│  ¶ …                                                 │
│                                                      │
│  field notes                                         │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ▸ architecture                                  │ │
│  │ ▸ the SwiftUI/UIKit decision                    │ │
│  │ ▸ build log: shipping v1                        │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  github · download                                   │
└─────────────────────────────────────────────────────┘
```

- Reading panel slides up from the bottom of the gallery section, taking ~80vh.
- Background dims behind it (the rest of the page) but stays partially visible — the panel reads as "stacked on top of" the gallery, not "replaced."
- The panel is itself scrollable.
- Field notes are accordion items. Clicking opens that note inline, slightly indented, in a slightly cooler-toned panel. Multiple field notes can be open at once.
- "back to the shelf" closes the panel.

## Data model

Each project is an Astro Content Collection entry. See [[02 - Architecture#content collection schema]]:

```yaml
# src/content/projects/adhkar-counter/index.md
---
title: AdhkarCounter
tagline: a quiet counter for daily remembrance
sort_order: 10
github_url: https://github.com/rquader/AdhkarCounter
download_url: ~
cover_image: ./images/home.png
status: shipped
---

[PLACEHOLDER — your project story, ~250–400 words.]
```

Field notes:
```
src/content/projects/adhkar-counter/notes/
├── architecture.md
├── decision-swiftui-vs-uikit.md
└── journal-shipping-v1.md
```

Each note is a normal Markdown file. The gallery component reads them with `getEntry()` or by importing `*.md?raw` and rendering them inline.

## Interaction details

- **Open:** click on the card. Browsers without JS still get a `<details>` fallback (graceful degradation).
- **Close:** Escape key, click on the dim backdrop, or click the close button.
- **Direct link:** `#project-adhkar-counter` in the URL opens that folder on load. Closing updates the URL via `history.replaceState`.
- **Keyboard:** cards are `<a>` elements with `href="#project-<slug>"`, so Enter opens, Tab/Shift-Tab cycles cards. Inside an open panel, focus is trapped (Esc-able).
- **Animation:** open/close uses CSS `transform: translateY()` + `opacity` over 0.4s ease. Reduced motion: instant.

## Component shape

```astro
---
// src/components/OnTheArtifacts.astro
import { getCollection } from 'astro:content';
import ProjectCard from './ProjectCard.astro';
const projects = (await getCollection('projects')).sort(
  (a, b) => a.data.sort_order - b.data.sort_order
);
---
<section id="on-the-artifacts" class="on-the-artifacts">
  <h2>on the artifacts</h2>
  <div class="shelf">
    {projects.map((p) => <ProjectCard project={p} />)}
  </div>
  <div id="reading-panel" hidden></div>
</section>
<script>
  import { initManilaFolders } from '~/lib/primitives/manila.ts';
  initManilaFolders(
    document.querySelector('#on-the-artifacts')!,
    document.querySelector('#reading-panel')!
  );
</script>
```

`ProjectCard.astro` renders the closed-state card. The `initManilaFolders` JS wires up open/close, panel rendering (by fetching the index.md HTML at build time or via dynamic import), accordion, escape handling, focus management.

## Accessibility

- `<a href="#project-<slug>">` makes folders keyboard-reachable and works without JS.
- Open panel uses `aria-modal="true"` and traps focus.
- Close button has visible focus state.
- Field-note accordions are `<details><summary>...</summary>...</details>` (native semantics).
- Cards include a meaningful alt on cover images. Projects without covers degrade gracefully (see "Cover-less projects" below).

## Cover-less projects

Some projects (backend experiments, scripts) lack a useful screenshot. The cover degrades:

```css
.project-cover.no-image {
  background:
    radial-gradient(circle at 30% 30%, var(--project-accent) 0%, transparent 60%),
    repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.03) 6px 7px);
}
```

A subtle pattern in the project's accent color. Better than a missing-image icon.

## Empty state

If `getCollection('projects')` returns zero projects, the section renders:

> [PLACEHOLDER — no projects yet. The empty state could just hide this section, or display a short note like "more soon."]

(The "or hide this section" path is implemented via `{projects.length > 0 && (...)}` in the parent component.)

## Open questions

- **Closing animation feel** — slide-down? fade? Default: slide-down 0.4s. Tune visually.
- **Direct-link behavior on mobile** — should `#project-<slug>` from a cold load center-scroll the gallery first, then open? Probably yes. Add `behavior: 'smooth'` to the scroll.
- **Field notes ordering** — alphabetical by filename, or explicit `sort_order` in each note's frontmatter? Default: alphabetical. Easy to extend later.

## See also

- [[03 - Content Model#on the artifacts]]
- [[04 - Content Pipeline]] — how notes get from vault to here
