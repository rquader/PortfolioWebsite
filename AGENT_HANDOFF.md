# AGENT_HANDOFF.md

> **Read [SESSION_HANDOFF.md](SESSION_HANDOFF.md) first** for a compressed brief. This file is the detailed checklist and implementation history.

**Latest update:** 2026-05-28 — design-handoff integration pass: mobile notes two-step (ADR-022), dual-shell hiding fix (specificity leak), tree-slider key-mismatch fix (ADR-024), Claude Design fonts now **self-hosted** (ADR-025, supersedes ADR-023's CDN stopgap) via `scripts/get-fonts.sh`, notes-resize persistence enabled.

**Site repo:** `/Users/rafanquader/Developer/Portfolio_Website/`

**Vault docs:** `.../RafansPortableVault/Programming/Portfolio_Website/`

---

## TL;DR for a new agent

The site is **built, content-filled, and media-complete on `/projects`**. Home scroll + editorial projects page with seven real projects, Story/Info toggle, notes folio popup, WIP dialog, top-nav GitHub, resume PDF, GIF/PNG media per chapter. `npm run check` and `npm run build` pass.

**Read first (order):**

1. [SESSION_HANDOFF.md](SESSION_HANDOFF.md)
2. Vault `06 - Next Agent Handoff.md`, `Working Agreements.md`, `03 - Content Model.md`, `Open Questions.md`
3. Vault `decisions/ADR-019-project-media-carousel.md` if touching project media
4. Vault `specs/2026-05-24-projects-page-redesign-design.md` if touching `/projects` layout

**ADRs:** 015–025 (projects redesign + WIP + media + notes folder-tree + desktop overhaul + dual-shell + mobile two-step notes + tree-slider fix + self-hosted fonts; ADR-023 superseded by 025), plus earlier stack/aesthetic ADRs in vault `decisions/_index.md`.

---

## Constraints

1. **Body copy** — from user PDF / explicit user edits only; do not invent voice.
2. **No vault read at build** — curated copies under `src/content/projects/<slug>/`.
3. **ADRs** for non-trivial decisions.
4. **Modular TS primitives** — `init(root) → { stop() }`; wire from `site-init.ts`.
5. **Light + dark** — `TopNav` theme toggle only.

---

## `/projects` shape (shipped)

- Editorial alternating rows (`ProjectChapter`, `index % 2` flip)
- Story / Info toggle — URL `?mode=` + `localStorage`
- Notes folio popup — **folder-tree sidebar** + note pane, breadcrumb, prev/next stepper, hash deep links (ADR-020; notes mirror `_Sanitized_Copy/<Project>/` folders 1:1)
- Modular link buttons — `github_url`, `web_url`, `demo_url`, etc.
- WIP sticker on media column → shared `#wip-dialog`
- **Media** — `media_items` + `media_mode` (single / carousel / stack); lazy carousel primitive

---

## Content fill (2026-05-27)

- [x] Home components: Threshold, OnMe, OnTheWork, OnTheTrail, Coda
- [x] TopNav `github ↗`
- [x] `public/Rafan_Quader_Resume.pdf`
- [x] Seven projects + `story.md` each; samples **deleted**
- [x] WIP schema + UI
- [x] Stub `field/` notes (six projects; crossword private)
- [x] Vault Process Journal, Open Questions, Content Model, ADR-018

---

## Media integration (2026-05-27)

- [x] Assets in `src/content/projects/<slug>/images/` (GIFs + PNGs only)
- [x] Schema: `media_items`, `media_mode`, `media_default`
- [x] Components: `ProjectMediaAsset`, `ProjectMediaCarousel`, `ProjectMediaStack`
- [x] `project-media-carousel.ts` — lazy load, IntersectionObserver
- [x] Manim 10-slide carousel (default `05_recursive_tree_v2`)
- [x] Arabic stack; crossword/adhkar 2-slide carousel
- [x] Per-slug fit: Arabic `contain`, InstaDM `16/9` + `contain`
- [x] Vault ADR-019 + doc sync

---

## What's left

1. `demo_url` / `cover_video` — when ready
2. Portfolio `github_url` / `web_url` when repo public
3. Deploy — Cloudflare Pages
4. Deeper note curation — vault pipeline
5. Optional: re-encode heavy GIFs to WebM if deploy weight is an issue
6. OnMe field-card content → content collection (currently hardcoded)

---

## Verification

```bash
cd /Users/rafanquader/Developer/Portfolio_Website
npm run check
npm run build
npm run dev
```

---

## Implementation notes (save time)

- JSDoc + `*/` inside backticks breaks Astro parser
- `projectFiles` exclude: `'!*/story.md'` (single-segment only)
- Notes popup open: forced reflow before `data-open='true'` (`notes-popup-controller.ts`)
- Legacy tokens: use `--text-*` / `--bg-*`, not `--ink-*` / `--paper-*` for new code
- Project media URLs: `src/lib/project-media-url.ts` (`import.meta.glob` + `?url`)
- Per-project media fit: `[data-project-slug]` overrides in `projects.css`
- Carousel: only active slide gets `src`; init deferred until in viewport

---

## Don't

- Add a test framework
- Invent body copy
- Read Obsidian vault at build time
- Commit unless the user asks

---

## Historical: `/projects` redesign phases (complete)

Phases 1–4 (editorial rows, story/info toggle, notes popup, polish) and followups F1–F4 (including temporary **sample** / **sample-two** fixtures) shipped 2026-05-24. Those samples were **removed** during content fill; seven production slugs replaced them.
