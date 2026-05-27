---
tags: [adr, projects-page, popup, notes, traceability]
---

# ADR-016 — Project notes open in a centered Folio popup with tabs + stepper (single note at a time)

**Status:** accepted
**Date:** 2026-05-24

## Context

The phase-4 `/projects` rendered each project's working notes as a vertically nested `<details>` accordion below the chapter body — `field/`, `decisions/`, etc. as collapsible groups, each note an inline expandable item. The user's 2026-05-24 brainstorm rejected this as "intrusive" once stacked under the new editorial layout: the eye drops below the headline into a long inline list, breaking the chapter rhythm. He wanted *"a button that opens a UI for traceability to see the Obsidian notes that looks good"* and described the popup interior as *"really cool, really fun, really creative … clean … with that soft paper aesthetic."* Crucially he also asked for **one note open at a time**, ruling out multi-open accordion variants.

The brainstorm explored four shells: (A) right-anchored side drawer, (B) centered paper-card folio with folder tabs + prev/next stepper, (B') centered folio with nested accordion, (C) paper side-panel hybrid. Brainstorm screens: `popup-options.html`, `popup-v2.html`, `popup-folio.html`, `popup-nested.html`.

## Decision

The notes UI is a **centered Folio popup** triggered by a per-project "open notes" button:

- **Shape:** centered paper card, max-width `540px`, max-height `80vh`. Lighter 28% scrim behind (no blur). Mobile (`max-width: 720px`) widens to `94vw` and `88vh` max.
- **Structure:** head (project title + close ×) → tab strip (top-level folder names) → body (prev/next stepper + breadcrumb chip + the one active note).
- **Folder navigation:** **top-level folders only become tabs.** A project with `field/architecture.md` and `field/decisions/ADR-001.md` produces one tab (`field`) — never a nested tab strip.
- **Note navigation within a tab:** a prev/next stepper that walks every note in the tab regardless of depth, ordered by `sort_order` then alpha path. Position indicator reads `N of M · field` at depth 1, `N of M · field › decisions` when the current note is nested below the tab folder. A small breadcrumb chip above the note title surfaces the sub-path explicitly when present.
- **One note at a time.** No nested expansion. Click a sibling tab → that tab's first note. Step → next note in this tab. Reach end of tab → stepper arrow disables (no wrap).
- **State in the URL hash.** `#notes/<slug>/<tab>/<...subPath>/<leaf>` is the canonical address, so any tab+note state is shareable and deep-linkable. The page-load hash is honored on first paint.
- **Close:** Esc, backdrop click, × button. Focus returns to the trigger Notes button.
- **A11y:** `role="dialog"` + `aria-modal="true"`, tabs as `role="tab"` + `aria-selected`, body as `role="tabpanel"`, focus trap, body scroll lock, disabled stepper arrows get `aria-disabled="true"`.
- **Aesthetic:** light-mode parchment / dark-mode walnut paper card, very faint SVG-noise grain at 45% opacity (multiplied in light, screened in dark). 200 ms scale+fade transition; `prefers-reduced-motion` falls back to opacity-only.

The notes-graph (`src/lib/notes-graph.ts`) is a pure data layer that takes the projects + projectFiles collections and produces the typed `{ tabs: [{ name, notes: [{ leaf, subPath, title, sortKey, file }, ...] }] }` shape. Tab ordering uses a small preferred-order array (`field`, `decisions`, `journal`, `credits`) with alphabetical fallback for anything else. The controller (`src/lib/notes-popup-controller.ts`) wires DOM events and keeps state in sync with the hash.

## Alternatives Considered

- **A · Side drawer.** Right-anchored, two-pane (folder/note rail + content). User said it "felt less intrusive" because part of the page stays visible. Rejected because the user preferred the centered-folio shape *visually* and the lighter-backdrop tuning resolved the intrusiveness concern.
- **B' · Centered folio with nested accordion (multi-open).** Clicking a folder expands its notes inline; clicking a note expands its content inline; multiple notes can be open simultaneously. User saw this mocked up and explicitly rejected it after one screen — *"I don't like this … I think you should only be able to have one note open at a time."*
- **C · Paper side panel.** B's paper feel anchored right like A. Proposed as a compromise; user did not pick it.
- **Inline expand under the chapter.** What the phase-4 build did. Rejected: pulls the eye out of the editorial spread, defeats the new layout's rhythm.
- **Sub-folders as sub-tabs.** Considered to handle nested files like `field/decisions/ADR-001.md`. Rejected: recursive tab strips quickly become visually heavy; the breadcrumb chip surfaces the same information without adding chrome.
- **End-of-folder wrap-around.** Stepper could wrap past the last note into the next folder's first note. Rejected: harder to predict, breaks the "this folder, these notes" mental model. Open question in [[specs/2026-05-24-projects-page-redesign-design#8]].

## Benefits

- The editorial chapter stays clean — one prominent button, no inline content below.
- Reading one note at a time honors the user's mental model and matches how a reader actually navigates a single ADR or field-note file.
- Tab + stepper interaction is simple, learnable in seconds.
- The breadcrumb chip preserves *full path traceability* without surfacing a tree UI — the user can always see where the current note lives.
- URL hash deep linking means any note is shareable / bookmarkable.
- The paper card matches the parchment/walnut tokens already in use ([[ADR-007 palette sepia shift]]), so the popup feels like an extension of the page, not a system modal.
- Nested folders work without any new UI primitive — same tab, same stepper, just longer position string.

## Harms / Tradeoffs

- The popup *is* centered + scrimmed, which is more visually intrusive in raw terms than a side drawer would be. Mitigation: 28% scrim, no blur, narrower card. The lighter knobs were the user's explicit fix.
- You cannot scan all notes in a tab at once. To see the inventory, the reader cycles through. For folders with 10+ notes this becomes friction — currently no project is that deep, so we defer. Possible mitigation later: a small in-tab note list above the stepper.
- Every note's body is SSR-rendered at build time and shipped in the page payload. For a project with many long notes, this inflates the HTML for `/projects`. Acceptable today (the sample's notes are short); revisit if a project ships a 50-note vault dump.
- The popup deletes the inline-accordion affordance that screen readers had a working mental model for. Mitigation: `role="dialog"` + tabs/tabpanel + focus trap give SRs a coherent model — but the surface area is different. A11y validation in Phase 4.3 confirms the new shape.

## Revisit If

- A project has so many nested notes that the stepper feels endless (introduce in-tab note list or sub-tab strip).
- The page payload for `/projects` grows beyond a tolerable size from SSR'd note bodies (switch to on-demand fetch via `astro:content` runtime, or split the popup into a dedicated route).
- Users report disorientation when jumping between tabs (consider light persistent prev/next-folder navigation alongside the stepper).
- The 28% scrim still reads as intrusive on a future user-research pass (Option A side drawer is documented and recoverable).

## See also

- [[specs/2026-05-24-projects-page-redesign-design]] — full design spec.
- [[ADR-015 editorial alternating layout]] — sibling decision on the macro layout.
- [[ADR-017 story info mode toggle]] — sibling decision on the page-mode swap.
- `src/components/project/ProjectNotesPopup.astro` — markup.
- `src/lib/notes-graph.ts` — pure data layer.
- `src/lib/notes-popup-controller.ts` — interaction layer.
- `src/styles/notes-popup.css` — soft-paper styling for light + dark.
- `.superpowers/brainstorm/62648-1779612025/content/popup-folio.html` + `popup-nested.html` — chosen mockups.
