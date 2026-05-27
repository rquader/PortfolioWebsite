---
tags: [index, portfolio]
date_started: 2026-05-17
---

# 00 — Index

The portfolio site for Rafan Quader (CS undergrad, SJSU). A real portfolio that inherits the voice of [[Legendary UI-UX/Legendary UI-UX|Legendary UI-UX]] and the generative aesthetic of [[Manim_Wallpaper/00_index|Manim_Wallpaper]], while remaining functionally a portfolio.

Site repo: `~/Developer/Portfolio_Website/`
Docs (this folder): `<vault>/Programming/Portfolio_Website/`
Deploy target: Cloudflare Pages (free tier).

## the brief

A real, impressive portfolio for Rafan Quader. Shows school, research, projects, and the documentation behind them. Built modularly so it's editable, durable, and pickup-able by another agent or human. Aesthetic discipline borrowed from [[Legendary UI-UX/Legendary UI-UX]] — but this is a *portfolio*, first.

Home and `/projects` body copy is **live** (2026-05-27, from user PDF). New copy is user-provided only.

## start here

| if you want to… | read |
|---|---|
| **compressed context before a big next step** | `~/Developer/Portfolio_Website/SESSION_HANDOFF.md` (repo) |
| **pick up this project from scratch (next agent / future Rafan)** | [[06 - Next Agent Handoff]] + repo `AGENT_HANDOFF.md` |
| start coding now, step by step | [[05 - Bootstrap Guide]] |
| understand *why* this site is the way it is | [[01 - Philosophy]] |
| see the technical shape and where files live | [[02 - Architecture]] |
| see what every section contains, edit copy | [[03 - Content Model]] |
| clean a personal vault note into a public note | [[04 - Content Pipeline]] |
| see who the author is | [[Author Profile]] |
| see the durable working rules (do this / never do that) | [[Working Agreements]] |
| understand a specific design primitive | the `Concept - *.md` files |
| understand a specific tech choice | `decisions/ADR-*.md` files, indexed in [[decisions/_index]] |
| see the chronological diary | [[Process Journal]] |
| see what's deferred or undecided | [[Open Questions]] |
| see what work / authors influenced this | [[Sources & Inspirations]] |

## sections of the site (the rooms)

1. **threshold** — hero, photo slot, name, tagline, low-opacity recursive tree
2. **on me** — bio, school, what I chase
3. **on the work** — DDD research at Reed Systems Group
4. **projects** — separate `/projects` route; editorial rows, Story/Info toggle, notes popup (see [[specs/2026-05-24-projects-page-redesign-design]])
5. **on the trail** — coursework, tools, resume PDF button
7. **coda (on the web)** — GitHub, LinkedIn, email, repeated tagline

See [[03 - Content Model]] for the exact content each section holds.

## design primitives in use

Inherited from [[Legendary UI-UX/Legendary UI-UX]]:
- [[Concept - Inertial Headings]] — typography with weight
- [[Concept - Synesthesia Goals]] — scoped hover-color on the goals paragraph
- [[Concept - Cursor Companion]] — ambient cursor body, per-section accent
- (phosphor touch trails — subtle, may include later; tracked in [[Open Questions]])

New for this project:
- [[Concept - Threshold Hero]] — portrait-with-fade hero
- [[Concept - Manila Folder Gallery]] — the projects browser
- [[Concept - Recursive Tree Backdrop]] — TypeScript port of `recursive_tree_v2.py`

Cut (with rationale): see [[decisions/ADR-006-aesthetic-primitives-inherited-and-cut]].

## current status (2026-05-27)

- Site **built and deployed locally**: home scroll + `/projects` editorial page, seven real projects, live copy from user PDF.
- Threshold photo live (`IMG_6565` print treatment + tree clearing). See [[decisions/ADR-013-personal-photo-threshold-print]].
- **Project media live** on all seven chapters — GIFs/PNGs via `media_items`; Manim 10-slide carousel. See [[decisions/ADR-019-project-media-carousel]].
- **Still open:** Cloudflare deploy, portfolio public URLs, `demo_url` / `cover_video`, deeper note curation.

See [[Process Journal]] for the running log. For agent pickup: [[06 - Next Agent Handoff]] + repo `SESSION_HANDOFF.md`.
