# Session handoff — compressed context

> **Paste this (or point the next agent here) before a large next step.**
> Canonical vault docs: `Programming/Portfolio_Website/` in the Obsidian vault.
> Live checklist: [AGENT_HANDOFF.md](AGENT_HANDOFF.md).

**Last synced:** 2026-05-27 (media pass)

---

## What was completed (content fill + media)

- Home copy from user PDF: threshold, on me (synesthesia), DDD story, simplified trail, coda
- Top nav: `github ↗` → https://github.com/rquader (visible on mobile)
- Resume: `public/Rafan_Quader_Resume.pdf`
- `/projects`: info/story intro+outro, seven real projects, WIP sticker + dialog
- **Project media:** GIFs/PNGs in `src/content/projects/<slug>/images/`; carousel / stack / single per project (ADR-019)
- Manim carousel: 10 scenes, default `05_recursive_tree_v2`
- Obsidian ADR-019 + vault docs updated; `npm run check` / `npm run build` pass

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
6. Visual QA: light/dark, mobile, WIP dialog, notes popup hashes

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
