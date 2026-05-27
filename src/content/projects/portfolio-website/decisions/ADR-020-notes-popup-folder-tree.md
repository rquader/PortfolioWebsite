# ADR-020 — Notes popup: folder tree + faithful sanitized mirror

**Status:** accepted
**Date:** 2026-05-27

## Context

The sanitized project notes were first imported **flat**: every file for a
project was dropped into `src/content/projects/<slug>/field/sanitized/`,
collapsing the Obsidian folder hierarchy. The notes popup (see
[[ADR-016-notes-popup-centered-folio]]) then turned only the *top-level*
folder into a tab and flattened everything below it into a single linear
prev/next stepper, surfacing nested folders as a dim breadcrumb chip.

Consequences observed:

- A project's folder architecture (e.g. AdhkarCounter's `00 - Overview …
  05 - Decisions`, Manim's `wallpapers/ · decisions/ · credits/ ·
  inspirations/`) was invisible and un-navigable.
- Manim's per-wallpaper notes interleaved with its architecture docs
  because the numbered prefixes sorted together once flattened.
- `portfolio-website` was inconsistent: a stray root-level
  `decisions/ADR-017` duplicated the copy inside `field/sanitized/`, plus a
  hand-written `field/architecture.md` stub that wasn't in the sanitized
  source.
- Folder-overview notes (`decisions/_index.md`, `credits/_index.md`,
  `inspirations/_index.md`) were dropped on import — partly because
  `_index.md` is reserved for the project landing file.

## Decision

**1. Content — mirror the sanitized copy 1:1.** Each project's notes now
mirror `_Sanitized_Copy/<ProjectFolder>/` verbatim into
`src/content/projects/<slug>/`, preserving the real folder hierarchy. The
flat `field/sanitized/` wrapper and the hand-written stubs are gone. Notes
are sourced **only** from the sanitized copy. Nested `_index.md` folder
notes are renamed (the project root reserves `_index.md`) and given
`sort_order: -1` so they lead their folder. The `projectFiles` loader gets
a `generateId` that preserves the on-disk path (case + spaces) instead of
slugifying, so real names like `05 - Decisions` and `System Architecture`
display correctly and the tree mirrors the vault.

**2. UI — a folder-tree sidebar replaces the tab strip.**
`src/lib/notes-graph.ts` now builds a recursive `FolderNode` tree plus a
depth-first `order` array. `src/components/project/ProjectNotesTree.astro`
renders that tree (folders collapse, notes select) into a two-pane folio:
tree sidebar on the left, the active note's body on the right, with a
breadcrumb and a global prev/next stepper. The controller
(`notes-popup-controller.ts`) handles expand/collapse, selection,
breadcrumb, stepping, and a path-based deep-link hash
(`#notes/<slug>/<…path>/<leaf>`, segments %-decoded). The centered folio
shell, paper grain, and open/close transition from ADR-016 are kept — this
ADR refines ADR-016's *internal navigation* only.

## Alternatives Considered

- **Keep tabs = top-level folders.** Breaks for projects that mix
  root-level docs with folders (Manim's `00_index` … `08` alongside
  `wallpapers/`), which would dump the loose docs into a synthetic `_root`
  tab, and it still can't navigate depth beyond one level.
- **Keep the flat single list (status quo).** Simplest, but it is exactly
  what loses the architecture the project is meant to showcase.
- **Resolve `[[wikilinks]]` into clickable in-popup navigation.** Tempting
  for "easy to navigate," but it's a much larger feature (graph
  resolution, ambiguity, link rewriting) and orthogonal to showing folder
  structure. Deferred; wikilinks remain literal text as before.

## Benefits

- The Obsidian folder architecture is visible and navigable at any depth.
- One uniform model handles both flat projects (Legendary, InstaDM, Arabic)
  and nested ones (AdhkarCounter, Manim, Portfolio).
- Faithful to the sanitized source — a project's notes are a structural
  copy, easy to re-sync and audit.
- Deep-link hash shape is unchanged in spirit (path-based), so existing
  `#notes/<slug>` links still open.

## Harms / Tradeoffs

- The folio is wider (two panes), needing more screen; on narrow viewports
  the sidebar stacks above the note as a scrollable strip.
- Large projects show a long sidebar (mitigated by collapsible folders and
  an independent scroll).
- Untitled notes display their filename as the label (acceptable — the
  filenames are descriptive).

## Revisit If

- A project's note count or nesting depth makes the sidebar unwieldy (then:
  default-collapse folders, or add search/filter).
- Wikilink-based navigation between notes becomes worth building.
