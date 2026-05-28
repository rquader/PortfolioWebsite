# Session handoff — compressed context

> **Paste this (or point the next agent here) before a large next step.**
> Canonical vault docs: `Programming/Portfolio_Website/` in the Obsidian vault.
> Live checklist: [AGENT_HANDOFF.md](AGENT_HANDOFF.md).

**Last synced:** 2026-05-28 (design-handoff integration pass)

---

## What was completed in the 2026-05-28 design-handoff integration pass

- **Mobile notes folio — two-step navigation** (ADR-022). Tree fills the screen on phones; tap a note to slide into the reader with a "‹ folders" back button. Hash routing preserved; deep-links jump straight into the reader.
- **Dual-shell hiding actually works.** Astro scoped-style specificity was beating the global `[data-shell] { display: none }` rule on desktop, leaking the mobile nav over the desktop nav (the "shadow on the top nav" the user reported). Replaced with `@media (min-width: 721px)` / `@media (max-width: 720px)` + `!important` in `src/styles/global.css`.
- **Tree-mode sliders work on mobile** (ADR-024). `mobile-tree-mode.ts` was passing `{ depth, angleDeg, ratio }` to `tree.setOverrides()`; the algorithm expects `MAX_DEPTH / LEAF_DEPTH_MIN / BRANCH_ANGLE / LENGTH_RATIO`. The `as unknown as` cast in the call site was hiding the type mismatch. Fixed.
- **Claude Design fonts now self-hosted** (ADR-025, supersedes ADR-023). `scripts/get-fonts.sh` downloads variable woff2 for Fraunces + Newsreader + JetBrains Mono from Google's CDN, mirrors them into `public/fonts/` (18 files, ~1.4 MB), and regenerates `src/styles/fonts.css` to point at the local paths. No runtime third-party request. Honors ADR-008.
- **Notes-resize persistence enabled** — `data-notes-resize-persist` attribute added to `ProjectNotesPopup.astro`; sidebar width now persists per-project as the in-flight `notes-resize.ts` mods intended.

## What was completed in earlier 2026-05-27 passes (content fill + media + dual-shell + mobile track)

- Home copy from user PDF: threshold, on me (synesthesia), DDD story, simplified trail, coda
- Top nav: `github ↗` → https://github.com/rquader (visible on mobile)
- Resume: `public/Rafan_Quader_Resume.pdf`
- `/projects`: info/story intro+outro, seven real projects, WIP sticker + dialog
- **Project media:** GIFs/PNGs in `src/content/projects/<slug>/images/`; carousel / stack / single per project (ADR-019)
- Manim carousel: 10 scenes, default `05_recursive_tree_v2`
- **Mobile track** (ADR-021): dual-shell architecture, drawer nav, mobile photo migration, Arabic carousel-on-mobile, mobile tree-mode bottom sheet
- Obsidian ADR-019 / 021 / 022 / 023 / 024 + vault docs updated; `npm run check` / `npm run build` pass

---

## Repo snapshot

| Area | Status |
|------|--------|
| Home | `Threshold`, `OnMe`, `OnTheWork`, `OnTheTrail`, `Coda` — live |
| Projects | 7 slugs under `src/content/projects/` |
| Media | Live — `media_items` + modes; see table below |
| WIP UI | `wip` / `wip_note` frontmatter → sticker + `#wip-dialog` |

### Project roster + media

| slug | sort | WIP | media |
|------|------|-----|-------|
| web-crossword-generator | 10 | yes | carousel: photo → gif |
| arabic-dialect-map | 20 | yes | stack: screenshot + gif |
| adhkar-counter | 30 | no | carousel: photo → gif |
| legendary-ui-ux | 40 | no | single gif |
| insta-dm | 50 | yes | single gif (contain) |
| manim-wallpapers | 60 | no | carousel ×10, default v2 |
| portfolio-website | 70 | yes | single gif |

### Locked user choices

- Threshold: `Computer Science @ SJSU` + `Research · Claude Code · Education` (no links)
- Story intro: traceability / Obsidian paragraph; minimal story outro
- Resume button on **on the trail** only
- Manim carousel includes all numbered scenes `01`–`10` (phyllotaxis included for gallery)

---

## Hard rules (unchanged)

1. **No vault read at build** — curated copies in `src/content/projects/<slug>/` only
2. **Body copy** — user-provided; do not invent voice
3. **ADRs** for non-trivial new decisions (vault `decisions/`)
4. **Verification:** `npm run check` && `npm run build`

---

## Not done — good next-step targets

1. `demo_url` / `cover_video` frontmatter when URLs exist
2. Portfolio chapter `github_url` / `web_url` when repo is public
3. Expand public notes via content pipeline (vault)
4. **Deploy** — Cloudflare Pages (ADR-002)
5. GIF→WebM optimization if deploy weight is too high (ADR-019 revisit)
6. Visual QA: light/dark, mobile (two-step notes!), WIP dialog, notes popup hashes
7. Move OnMe field-card content (focus / tools / club rows) into a content-collection entry instead of hardcoded JSX

---

## Read first

1. This file + [AGENT_HANDOFF.md](AGENT_HANDOFF.md)
2. Vault: [[06 - Next Agent Handoff]], [[Working Agreements]], [[03 - Content Model]], [[Open Questions]]
3. Media: vault `decisions/ADR-019-project-media-carousel.md`
4. If editing `/projects`: vault `specs/2026-05-24-projects-page-redesign-design.md`

---

## Suggested next-chat opener

> Continuing Rafan's portfolio. Media integration (2026-05-27) is done per SESSION_HANDOFF.md + ADR-019.
> Next: **[your step]**. Read AGENT_HANDOFF + vault 06.
