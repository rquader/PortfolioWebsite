---
tags: [adr, projects-page, content-model, toggle, story-mode]
---

# ADR-017 — /projects has a page-level Story / Info mode toggle

**Status:** accepted
**Date:** 2026-05-24

## Context

During the 2026-05-24 brainstorm the user said: *"I also want an option on the whole page to toggle b/w story mode and info mode. Info Mode has descriptions of each app and story mode has a story that goes thru all the apps like where I was at."* The intent is to have one page reading as two registers without doubling the page: an editorial *info* register (per-project blurbs) and an autobiographical *story* register (a connecting thread that runs across the projects in "where I was at" voice).

## Decision

Add a page-level segmented control (info · story) in the projects-page header. The control swaps **every chapter's body text slot** between two SSR-rendered slots:

- **Info mode** renders the project's `_index.md` body.
- **Story mode** renders the project's `story.md` body (a new sibling file at the project root, optional per project; missing files fall back to a placeholder marker).

Mechanics:
- The collection-schema gains `projectStories` (`*/story.md` single-segment pattern so nested files don't get treated as story bodies). `projectFiles` exclude pattern updates to `!*/story.md` (excludes the project-root file only).
- Page state lives in three places, priority order: URL `?mode=…` → `localStorage['rq-projects-mode']` → default `info`.
- `ProjectModeToggle.astro` hydrates state on mount and writes back to both URL (`history.replaceState`, no navigation pollution) and localStorage on click. It sets `document.documentElement.dataset.pageMode` accordingly.
- Each `ProjectChapter` renders both slots SSR with `data-mode-content="info|story"`. CSS in `projects.css` hides the inactive slot via `:root[data-page-mode="story"] .project-body-slot[data-mode-content="info"] { display: none }` (and the symmetric story-hidden rule). No client re-render. The toggle is instant.

## Alternatives Considered

- **Per-project toggle.** Every chapter has its own switch. Rejected: too much chrome; defeats the "page-wide register" feel; would let the page be in a mixed-mode state which isn't meaningful.
- **Two separate pages (`/projects/info`, `/projects/story`).** Each has its own URL. Rejected: duplicates the layout, fights the single-spread intent, and the cross-link between modes becomes the toggle anyway.
- **Story-only or info-only.** Pick one register and ship just that. Rejected: the user explicitly named both; the page benefits from each.
- **Frontmatter-embedded story field on `_index.md`.** A `story_md` string field. Rejected: inline strings in YAML are awkward for ~100-word paragraphs; a separate file is the right tool.
- **One master `story.md` with `## <slug>` anchors.** A single file with sections that get split at build time. Considered seriously — better matches the "story goes through all the apps" framing because it's literally one document while authoring. Set as `[[specs/2026-05-24-projects-page-redesign-design#8|open question]]` for later — easy to migrate via a build-time split if the user prefers it after writing for a while.

## Benefits

- The page reads two ways with one set of bones — no duplicated layout work, no second route to maintain.
- Both slots are SSR'd, so the toggle is instant and works without JS (degrades to whichever mode the URL chose; default `info`).
- The data model is symmetric and folder-additive: a project gets a story segment by dropping `story.md` next to its `_index.md`. Future projects can ship in info-only mode if the story arc hasn't reached them.
- Persistence (`localStorage`) means a reader who prefers story mode keeps it across visits without polluting the URL when they don't deep-link.
- URL persistence (`?mode=story`) means a deep link to the page in story mode is shareable.

## Harms / Tradeoffs

- The user has to write **both** an info description and a story segment per project — doubles the prose authoring load. Mitigation: story-mode degrades to a placeholder marker when `story.md` is missing, so the toggle is non-fatal for projects that haven't gotten their story segment yet.
- Both slots SSR'd means the HTML payload carries both bodies even though only one is visible. For short paragraphs (~100 words each), the cost is sub-kB; acceptable.
- If the user writes story segments piecemeal, the toggle can land on a half-empty page in story mode (some projects have segments, some don't). That's a *narrative* problem more than a *technical* one — the placeholder reads as a deliberate "more to come" rather than broken UI.

## Revisit If

- The user finds himself only writing one of the two modes in practice. Drop the toggle and use whichever survives as the canonical body.
- A third mode emerges (e.g., "links only" or "media only"). At that point the segmented control needs more visual room — switch to a select or convert each register into its own button.
- A future build wants per-section toggles (e.g., a "show field notes only" filter). That's a different decision and lives in [[ADR-016 notes popup centered folio]]'s revisit conditions, not here.

## See also

- [[specs/2026-05-24-projects-page-redesign-design]] — full design spec.
- [[ADR-015 editorial alternating layout]] — sibling decision on layout.
- [[ADR-016 notes popup centered folio]] — sibling decision on the popup.
- `src/content/config.ts` — `projectStories` collection definition.
- `src/components/project/ProjectModeToggle.astro` — UI + hydration script.
- `src/components/project/ProjectChapter.astro` — dual `data-mode-content` slots.
- `src/styles/projects.css` — visibility rules driven by `:root[data-page-mode]`.
